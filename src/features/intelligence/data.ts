export type Risk = "low" | "medium" | "high";
export type Momentum = "accelerating" | "steady" | "stalling";

export interface Stakeholder {
  name: string;
  role: string;
  alignment: number; // 0-100
  sentiment: "champion" | "neutral" | "blocker";
}

export interface Signal {
  id: string;
  kind: "intent" | "risk" | "objection" | "buying" | "stakeholder";
  label: string;
  detail: string;
  weight: number; // 0-100
  at: string;
}

export interface NextMove {
  id: string;
  title: string;
  rationale: string;
  confidence: number;
  effort: "low" | "med" | "high";
}

export interface Conversation {
  id: string;
  account: string;
  contact: string;
  title: string;
  channel: "Call" | "Email" | "Meeting" | "Slack";
  durationMin: number;
  when: string;
  dealValue: number;
  stage: string;
  momentum: Momentum;
  risk: Risk;
  summary: string;
  transcriptHighlights: { speaker: string; text: string; tag?: string }[];
  signals: Signal[];
  stakeholders: Stakeholder[];
  nextMoves: NextMove[];
}

export const conversations: Conversation[] = [
  {
    id: "c-8821",
    account: "Northwind Robotics",
    contact: "Maya Chen — VP Revenue Ops",
    title: "Pricing alignment + procurement timeline",
    channel: "Call",
    durationMin: 42,
    when: "Today · 10:24",
    dealValue: 184000,
    stage: "Negotiation",
    momentum: "accelerating",
    risk: "medium",
    summary:
      "Maya confirmed budget approval cleared finance. Procurement wants SOC2 evidence by Friday. Champion is pushing for a 14-day pilot, but legal flagged DPA redlines on data residency.",
    transcriptHighlights: [
      { speaker: "Maya", text: "We have green light from Priya on the budget.", tag: "buying" },
      { speaker: "Maya", text: "Legal needs EU data residency in writing.", tag: "risk" },
      { speaker: "You", text: "We can pre-configure the EU region for the pilot.", tag: "commit" },
      { speaker: "Maya", text: "Procurement asked for SOC2 by end of week.", tag: "action" },
    ],
    signals: [
      { id: "s1", kind: "buying", label: "Budget unlocked", detail: "CFO sign-off referenced 2x", weight: 92, at: "10:31" },
      { id: "s2", kind: "risk", label: "DPA redlines incoming", detail: "Legal raised EU data residency", weight: 68, at: "10:38" },
      { id: "s3", kind: "intent", label: "Pilot scoping language", detail: "14-day proof requested", weight: 81, at: "10:42" },
      { id: "s4", kind: "stakeholder", label: "Procurement engaged", detail: "New stakeholder surfaced", weight: 55, at: "10:50" },
    ],
    stakeholders: [
      { name: "Maya Chen", role: "VP RevOps", alignment: 88, sentiment: "champion" },
      { name: "Priya Natarajan", role: "CFO", alignment: 72, sentiment: "neutral" },
      { name: "Tomás Reyes", role: "Legal", alignment: 41, sentiment: "blocker" },
      { name: "Devon Lee", role: "Procurement", alignment: 60, sentiment: "neutral" },
    ],
    nextMoves: [
      {
        id: "nm1",
        title: "Send SOC2 + EU DPA addendum to Tomás by Thursday AM",
        rationale: "Removes the only blocker before procurement's Friday cutoff.",
        confidence: 94,
        effort: "low",
      },
      {
        id: "nm2",
        title: "Loop Devon into a 15-min procurement sync",
        rationale: "New stakeholder — early alignment shortens redline cycles.",
        confidence: 82,
        effort: "low",
      },
      {
        id: "nm3",
        title: "Draft 14-day pilot scope with EU region pre-set",
        rationale: "Mirrors Maya's exact ask; signals execution velocity.",
        confidence: 88,
        effort: "med",
      },
    ],
  },
  {
    id: "c-8804",
    account: "Helios Freight",
    contact: "Idris Okafor — Director of Sales",
    title: "Renewal expansion — multi-region rollout",
    channel: "Meeting",
    durationMin: 55,
    when: "Yesterday · 16:10",
    dealValue: 312000,
    stage: "Expansion",
    momentum: "steady",
    risk: "low",
    summary:
      "Idris validated the APAC rollout case. Wants a joint QBR with their COO before signing. No pricing friction; the lever is timing.",
    transcriptHighlights: [
      { speaker: "Idris", text: "COO wants to see the operational impact slide.", tag: "stakeholder" },
      { speaker: "Idris", text: "We're aligned on price — it's timing.", tag: "buying" },
    ],
    signals: [
      { id: "s1", kind: "buying", label: "Price unobjected", detail: "No pushback on uplift", weight: 86, at: "16:18" },
      { id: "s2", kind: "stakeholder", label: "COO involvement", detail: "Exec sponsor surfaced", weight: 74, at: "16:30" },
    ],
    stakeholders: [
      { name: "Idris Okafor", role: "Dir. Sales", alignment: 90, sentiment: "champion" },
      { name: "Anya Vorov", role: "COO", alignment: 50, sentiment: "neutral" },
    ],
    nextMoves: [
      {
        id: "nm1",
        title: "Schedule joint QBR with operational impact deck",
        rationale: "COO is the gate; Idris asked for this exact artifact.",
        confidence: 91,
        effort: "med",
      },
    ],
  },
  {
    id: "c-8790",
    account: "Lumen Health",
    contact: "Sara Patel — Head of IT",
    title: "Security review — second pass",
    channel: "Email",
    durationMin: 0,
    when: "2d ago · 09:02",
    dealValue: 96000,
    stage: "Evaluation",
    momentum: "stalling",
    risk: "high",
    summary:
      "Sara's team flagged three open security items from the first review. No response on the SSO scope question for 6 days. Champion has gone quiet.",
    transcriptHighlights: [
      { speaker: "Sara", text: "We still need clarity on SCIM provisioning scope.", tag: "risk" },
    ],
    signals: [
      { id: "s1", kind: "risk", label: "Champion silence", detail: "6 days, no reply", weight: 88, at: "—" },
      { id: "s2", kind: "objection", label: "SCIM scope unclear", detail: "Open since first review", weight: 71, at: "—" },
    ],
    stakeholders: [
      { name: "Sara Patel", role: "Head of IT", alignment: 38, sentiment: "neutral" },
      { name: "Marcus Hill", role: "VP Clinical", alignment: 22, sentiment: "blocker" },
    ],
    nextMoves: [
      {
        id: "nm1",
        title: "Send a one-page SCIM scope brief + propose 20-min call",
        rationale: "Direct answer to the open item; lightweight ask re-opens the loop.",
        confidence: 79,
        effort: "low",
      },
    ],
  },
];

export const dashboardMetrics = {
  activeDeals: 23,
  pipelineValue: 2840000,
  signalsToday: 147,
  recommendedMoves: 9,
};
