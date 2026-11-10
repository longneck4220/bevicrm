import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pickRole, type AppRole } from "@/lib/roles";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roleLoading: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Tracks whose role is currently loaded/loading, so a token refresh for
    // the same user doesn't re-trigger a role fetch (see below).
    let roleLoadedForUserId: string | null = null;

    function loadRole(userId: string) {
      roleLoadedForUserId = userId;
      setRoleLoading(true);
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .then(({ data }) => {
          setRole(pickRole((data ?? []).map((r) => r.role as string)));
          setRoleLoading(false);
        });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const newUserId = newSession?.user?.id ?? null;
      if (newUserId) {
        // Supabase re-fires this event for routine token refreshes (e.g. a
        // backgrounded tab regaining focus), not just on sign-in. Re-running
        // loadRole every time flips roleLoading back to true, and
        // RequireRole unmounts its children while roleLoading is true —
        // wiping any in-progress page state (e.g. an unsaved /trial note).
        // Only reload the role when the signed-in user actually changes.
        if (newUserId !== roleLoadedForUserId) {
          // Deferred: Supabase forbids awaiting its own client inside this callback.
          setTimeout(() => loadRole(newUserId), 0);
        }
      } else {
        roleLoadedForUserId = null;
        setRole(null);
        setRoleLoading(false);
      }
      router.invalidate();
      queryClient.invalidateQueries();
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadRole(data.session.user.id);
      } else {
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        role,
        roleLoading,
        isAdmin: role === "admin",
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
