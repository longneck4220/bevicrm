import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  listUsersForAdmin,
  adminDeleteAccount,
  type AdminUser,
  type AdminAccount,
} from "@/lib/admin.functions";

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
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Users & Accounts</h1>
          <p className="mt-2 text-white/60 text-sm">
            Manage every user's accounts. Use this to clean up duplicates or remove stale records.
          </p>
        </header>

        <WaitlistSection />



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
                  <button
                    onClick={() => setOpenUser(isOpen ? null : u.user_id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {u.display_name || u.email || "Unknown user"}
                        </span>
                        {u.is_admin && (
                          <span
                            className="shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider"
                            style={{ background: "var(--brand-cyan)", color: "#000" }}
                          >
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50 truncate">{u.email}</div>
                    </div>
                    <div className="shrink-0 text-xs text-white/60">
                      {u.account_count} account{u.account_count === 1 ? "" : "s"}
                    </div>
                  </button>

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
      </div>
    </div>
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
