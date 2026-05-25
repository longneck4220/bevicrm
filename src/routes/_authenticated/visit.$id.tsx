import { createFileRoute } from "@tanstack/react-router";
import { VisitDetailPage } from "@/features/visit/VisitDetailPage";

export const Route = createFileRoute("/_authenticated/visit/$id")({
  head: () => ({
    meta: [
      { title: "Visit · BEVI" },
      { name: "description", content: "Saved post-visit intelligence: next move, signals, CRM note and follow-up email." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <VisitDetailPage id={id} />;
}
