import { createFileRoute } from "@tanstack/react-router";
import { PreVisitPage } from "@/features/prep/PreVisitPage";

export const Route = createFileRoute("/_authenticated/prep/$accountId")({
  head: () => ({
    meta: [
      { title: "Pre-visit briefing · BEVI" },
      {
        name: "description",
        content: "Standing status, next move, account memory and visit history before you walk in.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { accountId } = Route.useParams();
  return <PreVisitPage accountId={accountId} />;
}
