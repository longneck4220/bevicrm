import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

/**
 * The global top bar is hidden on manager pages, so these views carry their own
 * sign-out control.
 */
export function SignOutLink() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <button
      onClick={async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await signOut();
        navigate({ to: "/login", search: { next: undefined }, replace: true });
      }}
      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
    >
      Sign out
    </button>
  );
}
