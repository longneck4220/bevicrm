export type Status = "red" | "amber" | "green";

// BEVI's own signal tokens (styles.css), not ad-hoc hex — keeps this section
// in step with the same red/amber/green used everywhere else in the app.
export const STATUS_COLOR: Record<Status, string> = {
  red: "var(--signal-risk)",
  amber: "var(--signal-warning)",
  green: "var(--signal-positive)",
};

export type Rings = {
  volume: number; // 0..1 call volume
  quality: number; // 0..1 note quality
  progression: number; // 0..1 account progression
};

export type AccountItem = {
  name: string;
  venueType: string;
  status: Status;
  summary: string;
  action: string;
};

export type Rep = {
  id: string;
  name: string;
  territory: string;
  status: Status;
  rings: Rings;
  calls: number;
  target: number;
  onPremise: number; // percentage 0..100
  attention: AccountItem[];
  onTrack: AccountItem[];
};

export const REPS: Rep[] = [
  {
    id: "ryan-pearce",
    name: "Ryan Pearce",
    territory: "Inner South",
    status: "red",
    rings: { volume: 0.4, quality: 0.25, progression: 0.3 },
    calls: 22,
    target: 40,
    onPremise: 80,
    attention: [
      {
        name: "Agnes",
        venueType: "Restaurant",
        status: "red",
        summary: "No visit in 3 weeks — last note was 4 lines.",
        action: "Find out why this account is being avoided.",
      },
      {
        name: "Steampunk",
        venueType: "Bar",
        status: "red",
        summary: "New whisky activation not pitched in 3 consecutive visits.",
        action: "Confirm rep knows the activation budget is available.",
      },
      {
        name: "Cobbler",
        venueType: "Bar",
        status: "red",
        summary: "Same 'overstocked' objection logged every visit — no pushback attempted.",
        action: "Role-play the objection response before next visit.",
      },
      {
        name: "Longtime",
        venueType: "Restaurant",
        status: "amber",
        summary:
          "Rep pitching premium spirits to a value-focused operator — mismatch flagged twice.",
        action: "Coach on reading buyer type before next visit.",
      },
      {
        name: "Southside",
        venueType: "Bar",
        status: "amber",
        summary: "Relationship strong but no order placed in 6 weeks.",
        action: "Check whether a contract agreement is blocking the deal.",
      },
    ],
    onTrack: [],
  },
  {
    id: "matthew-omalley",
    name: "Matthew O'Malley",
    territory: "Northern Beaches",
    status: "amber",
    rings: { volume: 0.65, quality: 0.55, progression: 0.5 },
    calls: 31,
    target: 40,
    onPremise: 70,
    attention: [
      {
        name: "Bedroom Nightclub",
        venueType: "Nightclub",
        status: "red",
        summary: "Activation space identified two visits ago — no follow-through.",
        action: "Check whether rep knows how to access the activation budget.",
      },
      {
        name: "Cali Beach Club",
        venueType: "Bar",
        status: "amber",
        summary: "Pitching premium spirits to a mid-range beach venue — volume opportunity missed.",
        action: "Redirect rep to the right portfolio tier for this account.",
      },
      {
        name: "Burleigh Pavilion",
        venueType: "Bar",
        status: "amber",
        summary:
          "Next move ('introduce new gin range') repeated across last 3 notes — not executing.",
        action: "Find out what's blocking the conversation.",
      },
      {
        name: "Rydges Hotel",
        venueType: "Hotel",
        status: "amber",
        summary: "Events program not explored — significant volume opportunity.",
        action: "Brief rep on the events angle before next visit.",
      },
    ],
    onTrack: [
      {
        name: "Costa Tacos",
        venueType: "Restaurant",
        status: "green",
        summary: "Consistent orders and strong relationship.",
        action: "Explore bundle deal to grow basket size.",
      },
    ],
  },
  {
    id: "mark-pinel",
    name: "Mark Pinel",
    territory: "CBD & Surrounds",
    status: "green",
    rings: { volume: 1, quality: 0.9, progression: 0.85 },
    calls: 41,
    target: 40,
    onPremise: 60,
    attention: [
      {
        name: "Walter's Steakhouse",
        venueType: "Restaurant",
        status: "amber",
        summary: "Relationship solid but slow on new brand adoption.",
        action: "One more targeted visit should close — monitor next note.",
      },
    ],
    onTrack: [
      {
        name: "Fortitude Music Hall",
        venueType: "Venue",
        status: "green",
        summary: "Event activation agreed — contract in progress.",
        action: "Offer supplier contact to support contract sign-off.",
      },
      {
        name: "Sixes & Sevens",
        venueType: "Bar",
        status: "green",
        summary: "NPD pitched and sampled last week — follow-up visit scheduled.",
        action: "None needed.",
      },
      {
        name: "Otto",
        venueType: "Restaurant",
        status: "green",
        summary: "Premium portfolio placed, ordering regularly.",
        action: "None needed.",
      },
      {
        name: "Brooklyn Standard",
        venueType: "Bar",
        status: "green",
        summary: "High-volume consistent account — relationship strong.",
        action: "None needed.",
      },
    ],
  },
];

export function getRep(id: string): Rep | undefined {
  return REPS.find((r) => r.id === id);
}
