import { createFileRoute } from "@tanstack/react-router";
import { ConversationDetailPage } from "@/features/conversation/ConversationDetailPage";

export const Route = createFileRoute("/_authenticated/conversation/$id")({
  head: () => ({
    meta: [
      { title: "Conversation · BEVI" },
      {
        name: "description",
        content: "Signal moments, stakeholder map, and AI-recommended next moves.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <ConversationDetailPage id={id} />;
}
