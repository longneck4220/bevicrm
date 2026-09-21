import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight, Download, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  listUsersForAdmin,
  adminDeleteAccount,
  adminSetUserRole,
  adminInviteManager,
  type AdminUser,
  type AdminAccount,
} from "@/lib/admin.functions";
import { ROLE_LABEL, ROLE_OPTIONS, type AppRole } from "@/lib/roles";
import { listWaitlist, type WaitlistRow } from "@/lib/waitlist.functions";
import { CsvImportSection } from "@/features/admin/CsvImportSection";

export function AdminUsersPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(listUsersForAdmin);
  const deleteFn = useServerFn(adminDeleteAccount);

  const [query, setQuery] = useState("");
  const [openUser, setOpenUser] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn(),
    enabled: isAdmin,
  });

  const del = useMutation({
    mutationFn: (accountId: string) => deleteFn({ data: { accountId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const setRoleFn = useServerFn(adminSetUserRole);
  const [roleError, setRoleError] = useState<string | null>(null);
  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) => setRoleFn({ data: vars }),
    onMutate: () => setRoleError(null),
    onError: (e: Error) => setRoleError(e.message || "Could not update that role."),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users: AdminUser[] = useMemo(() => data?.users ?? [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users
      .map((u) => ({
        ...u,
        accounts: u.accounts.filter(
          (a) => a.name.toLowerCase().includes(q) || (a.contact ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter(
        (u) =>
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.display_name ?? "").toLowerCase().includes(q) ||
          u.accounts.length > 0,
      );
  }, [users, query]);

  if (loading) {
    return <div className="min-h-screen pt-32 px-6 text-center text-white/60">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-32 px-6 text-center">
        <h1 className="text-2xl font-semibold text-white">Admin only</h1>
        <p className="mt-2 text-white/60">You don't have access to this page.</p>
        <button
          className="mt-6 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 border border-white/10"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16 px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Users & Accounts</h1>
            <p className="mt-2 text-white/60 text-sm">
              Manage every user's accounts. Use this to clean up duplicates or remove stale records.
            </p>
          </div>
          <Link
            to="/manager"
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/70 transition-colors duration-200 hover:border-white/25 hover:text-white"
          >
            Team overview
          </Link>
        </header>

        <InviteManagerSection />

        <WaitlistSection />

        {roleError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {roleError}
          </div>
        )}




        <GlassCard className="p-3 mb-6">
          <div className="flex items-center gap-2 px-2">
            <Search className="w-4 h-4 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by user email, name, or account…"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/40 py-2"
            />
          </div>
        </GlassCard>

        {isLoading ? (
          <div className="text-center text-white/50 py-12">Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/50 py-12">No matches.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => {
              const isOpen = openUser === u.user_id;
              return (
                <GlassCard key={u.user_id} className="p-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setOpenUser(isOpen ? null : u.user_id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {u.display_name || u.email || "Unknown user"}
                        </div>
                        <div className="text-xs text-white/50 truncate">
                          {u.email} · joined {new Date(u.created_at).toLocaleDateString()} ·{" "}
                          {u.account_count} account{u.account_count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </button>

                    <RolePicker
                      value={u.role}
                      saving={roleMut.isPending && roleMut.variables?.userId === u.user_id}
                      onChange={(role) => roleMut.mutate({ userId: u.user_id, role })}
                    />
                  </div>


                  {isOpen && (
                    <div className="border-t border-white/5 px-4 py-3 space-y-2">
                      {u.accounts.length === 0 ? (
                        <div className="text-xs text-white/40 py-2">No accounts.</div>
                      ) : (
                        u.accounts.map((a) => (
                          <AccountRow
                            key={a.id}
                            account={a}
                            onDelete={() => {
                              const warn =
                                a.visit_count > 0 || a.has_memory
                                  ? `Delete "${a.name}"? This has ${a.visit_count} visit(s)${a.has_memory ? " and account memory" : ""}. This cannot be undone.`
                                  : `Delete "${a.name}"? This cannot be undone.`;
                              if (confirm(warn)) del.mutate(a.id);
                            }}
                            deleting={del.isPending && del.variables === a.id}
                          />
                        ))
                      )}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        <div className="mt-10">
          <CsvImportSection />
        </div>
      </div>
    </div>
  );
}

function RolePicker({
  value,
  saving,
  onChange,
}: {
  value: AppRole;
  saving: boolean;
  onChange: (role: AppRole) => void;
}) {
  return (
    <label className="shrink-0">
      <span className="sr-only">Role</span>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as AppRole)}
        className="rounded-lg border border-white/15 bg-[#1A2338] px-2 py-1.5 text-xs text-white/90 disabled:opacity-50"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </label>
  );
}

function InviteManagerSection() {
  const inviteFn = useServerFn(adminInviteManager);
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: (address: string) =>
      inviteFn({ data: { email: address, redirectTo: `${window.location.origin}/login` } }),
    onSuccess: (res) => {
      setSentTo(res.email);
      setEmail("");
    },
    onError: (e: Error) => setError(e.message || "Could not send the invite."),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSentTo(null);
    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError("Enter an email address.");
      return;
    }
    invite.mutate(clean);
  }

  return (
    <GlassCard className="p-5 mb-6">
      <SignalLabel>Invite manager</SignalLabel>
      <p className="mt-1 text-sm text-white/60">
        Sends a sign-in link. Once they appear in the list below, set their role to Manager.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          placeholder="Manager email address"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[var(--brand-cyan)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={invite.isPending}
          className="min-h-[44px] rounded-lg border border-white/15 px-4 text-sm font-medium text-white/85 hover:bg-white/5 disabled:opacity-50"
        >
          {invite.isPending ? "Sending…" : "Send invite"}
        </button>
      </form>
      {sentTo && <p className="mt-3 text-sm text-[var(--signal-positive)]">Invite sent to {sentTo}</p>}
      {error && <p className="mt-3 text-sm text-[var(--signal-risk)]">{error}</p>}
    </GlassCard>
  );
}


function AccountRow({
  account,
  onDelete,
  deleting,
}: {
  account: AdminAccount;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{account.name}</div>
        <div className="text-xs text-white/50 truncate">
          {account.contact || "—"} · {account.visit_count} visit
          {account.visit_count === 1 ? "" : "s"}
          {account.has_memory ? " · memory" : ""}
        </div>
      </div>
      <div className="text-[11px] text-white/40 shrink-0">
        {new Date(account.created_at).toLocaleDateString()}
      </div>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
        title="Delete account"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}

function WaitlistSection() {
  const listFn = useServerFn(listWaitlist);
  const { data, isLoading } = useQuery({ queryKey: ["admin-waitlist"], queryFn: () => listFn() });
  const rows: WaitlistRow[] = data ?? [];

  function downloadCsv() {
    const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      "email,source,referrer,utm,created_at",
      ...rows.map((r) => [r.email, r.source, r.referrer, r.utm, r.created_at].map(esc).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bevi-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <SignalLabel>Waitlist</SignalLabel>
          <p className="mt-1 text-sm text-white/60">
            {isLoading ? "Loading…" : `${rows.length} email${rows.length === 1 ? "" : "s"} captured`}
          </p>
        </div>
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-white/8">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2 text-xs last:border-0"
            >
              <span className="truncate text-white/85">{r.email}</span>
              <span className="shrink-0 text-white/45">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
