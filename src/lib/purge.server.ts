import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

const LIBRARY_BUCKET = "library";
const STORAGE_BATCH = 100;
// Keeps `.in()` lists short enough for the request URL.
const ID_CHUNK = 50;
// The API returns at most 1000 rows per select; page below that.
const PAGE_SIZE = 1000;

export type AccountContents = {
  visits: number;
  memoryVersions: number;
  pinnedFiles: number;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Every venue id owned by this user, read page by page so none are cut off. */
async function listOwnedVenueIds(
  client: Client,
  userId: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from("accounts")
      .select("id")
      .eq("owner_id", userId)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error("[delete] could not list venues", error);
      throw new Error(
        "Could not list this user's venues. Nothing was deleted.",
      );
    }
    const page = (data ?? []).map((a) => a.id);
    ids.push(...page);
    if (page.length < PAGE_SIZE) return ids;
  }
}

async function countRows(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
  label: string,
): Promise<number> {
  const { count, error } = await query;
  if (error) {
    console.error(`[delete] could not count ${label}`, error);
    throw new Error(
      "Could not check what would be deleted. Nothing was changed.",
    );
  }
  return count ?? 0;
}

/**
 * Counts what deleting these venues would remove, so the dialog can show it.
 * Only content on the venues themselves is counted.
 */
export async function countAccountContents(
  client: Client,
  accountIds: string[],
): Promise<AccountContents> {
  const totals: AccountContents = {
    visits: 0,
    memoryVersions: 0,
    pinnedFiles: 0,
  };
  for (const ids of chunk(accountIds, ID_CHUNK)) {
    totals.visits += await countRows(
      client
        .from("visits")
        .select("id", { count: "exact", head: true })
        .in("account_id", ids),
      "visits",
    );
    totals.memoryVersions += await countRows(
      client
        .from("account_memory_versions")
        .select("id", { count: "exact", head: true })
        .in("account_id", ids),
      "memory versions",
    );
    totals.pinnedFiles += await countRows(
      client
        .from("library_files")
        .select("id", { count: "exact", head: true })
        .in("account_id", ids),
      "pinned files",
    );
  }
  return totals;
}

async function removeStorageObjects(
  client: Client,
  paths: string[],
): Promise<void> {
  for (let i = 0; i < paths.length; i += STORAGE_BATCH) {
    const batch = paths.slice(i, i + STORAGE_BATCH);
    const { error } = await client.storage.from(LIBRARY_BUCKET).remove(batch);
    if (error) {
      console.error("[delete] storage remove failed", error);
      throw new Error(
        "Could not remove stored files. Nothing further was deleted; try again.",
      );
    }
  }
}

/**
 * Deletes the library files pinned to these venues (rows and storage objects).
 * Without this, the database would quietly turn them into global files.
 * Safe to run twice: a second run finds nothing and does nothing.
 */
export async function deletePinnedFiles(
  client: Client,
  accountIds: string[],
): Promise<number> {
  let deleted = 0;
  for (const ids of chunk(accountIds, ID_CHUNK)) {
    // Each pass deletes what it read, so the next pass sees the next batch.
    for (;;) {
      const { data: files, error } = await client
        .from("library_files")
        .select("id, storage_path")
        .in("account_id", ids)
        .limit(PAGE_SIZE);
      if (error) {
        console.error("[delete] could not list pinned files", error);
        throw new Error(
          "Could not list the files pinned to this venue. Nothing was deleted.",
        );
      }
      if (!files || files.length === 0) break;

      await removeStorageObjects(
        client,
        files.map((f) => f.storage_path),
      );
      for (const fileChunk of chunk(files, ID_CHUNK)) {
        const { error: deleteError } = await client
          .from("library_files")
          .delete()
          .in(
            "id",
            fileChunk.map((f) => f.id),
          );
        if (deleteError) {
          console.error(
            "[delete] could not delete pinned file rows",
            deleteError,
          );
          throw new Error(
            "Could not delete the files pinned to this venue. Try again.",
          );
        }
      }
      deleted += files.length;
      if (files.length < PAGE_SIZE) break;
    }
  }
  return deleted;
}

async function listUserStoragePaths(
  client: Client,
  userId: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage
      .from(LIBRARY_BUCKET)
      .list(userId, { limit: STORAGE_BATCH, offset });
    if (error) {
      console.error("[delete] could not list user storage", error);
      throw new Error(
        "Could not list this user's stored files. Nothing was deleted.",
      );
    }
    const names = (data ?? []).map((o) => `${userId}/${o.name}`);
    paths.push(...names);
    if (names.length < STORAGE_BATCH) return paths;
    offset += STORAGE_BATCH;
  }
}

/**
 * Counts what deleting this login would remove. Visits, memory versions and
 * pinned files are counted only on the user's own venues; see purgeUserData
 * for why rows they own on other people's venues are not included.
 */
export async function countUserContents(
  client: Client,
  userId: string,
): Promise<AccountContents & { venues: number; files: number }> {
  const venueIds = await listOwnedVenueIds(client, userId);
  const contents = await countAccountContents(client, venueIds);
  const files = await countRows(
    client
      .from("library_files")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    "files",
  );
  return { ...contents, venues: venueIds.length, files };
}

/**
 * True when removing this user's admin role would leave the app with no admin.
 * Non-admins can always be removed.
 */
export async function isLastAdmin(
  client: Client,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (error) {
    console.error("[delete] could not check admins", error);
    throw new Error("Could not check admin roles. Nothing was changed.");
  }
  const adminIds = new Set((data ?? []).map((r) => r.user_id));
  return adminIds.has(userId) && adminIds.size <= 1;
}

/**
 * Removes everything a login owns, in an order that is safe to retry if any
 * step fails part-way: storage objects, file rows, venues (which cascade to
 * visits, memory versions and call notes), and last the login itself.
 *
 * Scope is deliberately conservative: rows this user owns (owner_id) on OTHER
 * users' venues, such as visits, memory versions or call notes, are not
 * purged here. Those venues belong to someone else and keep their history.
 */
export async function purgeUserData(
  client: Client,
  userId: string,
): Promise<void> {
  const venueIds = await listOwnedVenueIds(client, userId);

  // Files pinned to these venues first, then everything left under the user's folder.
  await deletePinnedFiles(client, venueIds);
  await removeStorageObjects(
    client,
    await listUserStoragePaths(client, userId),
  );
  const { error: filesError } = await client
    .from("library_files")
    .delete()
    .eq("owner_id", userId);
  if (filesError) {
    console.error("[purge] could not delete file rows", filesError);
    throw new Error("Could not delete this user's files. Try again.");
  }

  for (const ids of chunk(venueIds, ID_CHUNK)) {
    const { error: venuesError } = await client
      .from("accounts")
      .delete()
      .in("id", ids);
    if (venuesError) {
      console.error("[purge] could not delete venues", venuesError);
      throw new Error("Could not delete this user's venues. Try again.");
    }
  }

  // Counted again right before the irreversible step. This narrows, but does
  // not fully close, the race where two admins delete each other at once.
  if (await isLastAdmin(client, userId)) {
    throw new Error(
      "Their data was removed, but they are now the last admin so the login was kept. Make someone else an admin, then try again.",
    );
  }

  const { error: authError } = await client.auth.admin.deleteUser(userId);
  // Already gone means a previous attempt finished; treat as success.
  if (authError && authError.status !== 404) {
    console.error("[purge] could not delete login", authError);
    throw new Error(
      "Their data was removed but the login could not be deleted. Try again.",
    );
  }
}
