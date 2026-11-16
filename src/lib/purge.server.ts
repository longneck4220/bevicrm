import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

const LIBRARY_BUCKET = "library";
const STORAGE_BATCH = 100;

export type AccountContents = {
  visits: number;
  memoryVersions: number;
  pinnedFiles: number;
};

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

/** Counts what deleting these venues would remove, so the dialog can show it. */
export async function countAccountContents(
  client: Client,
  accountIds: string[],
): Promise<AccountContents> {
  if (accountIds.length === 0)
    return { visits: 0, memoryVersions: 0, pinnedFiles: 0 };
  const visits = await countRows(
    client
      .from("visits")
      .select("id", { count: "exact", head: true })
      .in("account_id", accountIds),
    "visits",
  );
  const memoryVersions = await countRows(
    client
      .from("account_memory_versions")
      .select("id", { count: "exact", head: true })
      .in("account_id", accountIds),
    "memory versions",
  );
  const pinnedFiles = await countRows(
    client
      .from("library_files")
      .select("id", { count: "exact", head: true })
      .in("account_id", accountIds),
    "pinned files",
  );
  return { visits, memoryVersions, pinnedFiles };
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
  if (accountIds.length === 0) return 0;
  const { data: files, error } = await client
    .from("library_files")
    .select("id, storage_path")
    .in("account_id", accountIds);
  if (error) {
    console.error("[delete] could not list pinned files", error);
    throw new Error(
      "Could not list the files pinned to this venue. Nothing was deleted.",
    );
  }
  if (!files || files.length === 0) return 0;

  await removeStorageObjects(
    client,
    files.map((f) => f.storage_path),
  );
  const { error: deleteError } = await client
    .from("library_files")
    .delete()
    .in(
      "id",
      files.map((f) => f.id),
    );
  if (deleteError) {
    console.error("[delete] could not delete pinned file rows", deleteError);
    throw new Error(
      "Could not delete the files pinned to this venue. Try again.",
    );
  }
  return files.length;
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

export async function countUserContents(
  client: Client,
  userId: string,
): Promise<AccountContents & { venues: number; files: number }> {
  const { data: accounts, error } = await client
    .from("accounts")
    .select("id")
    .eq("owner_id", userId);
  if (error) {
    console.error("[delete] could not list venues", error);
    throw new Error(
      "Could not check what would be deleted. Nothing was changed.",
    );
  }
  const venueIds = (accounts ?? []).map((a) => a.id);
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
 */
export async function purgeUserData(
  client: Client,
  userId: string,
): Promise<void> {
  const { data: accounts, error: accountsError } = await client
    .from("accounts")
    .select("id")
    .eq("owner_id", userId);
  if (accountsError) {
    console.error("[purge] could not list venues", accountsError);
    throw new Error("Could not list this user's venues. Nothing was deleted.");
  }
  const venueIds = (accounts ?? []).map((a) => a.id);

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

  const { error: venuesError } = await client
    .from("accounts")
    .delete()
    .eq("owner_id", userId);
  if (venuesError) {
    console.error("[purge] could not delete venues", venuesError);
    throw new Error("Could not delete this user's venues. Try again.");
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
