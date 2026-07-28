export type OutputCard = {
  key: string;
  header: string;
  body: string;
  expanded: string;
};

export const OUTPUT_CARDS: OutputCard[] = [
  {
    key: "next",
    header: "NEXT BEST MOVE",
    body: "Reconfirm pricing support before Friday's order cycle. Aaron's loyalty is practical — the lapsed support is the risk.",
    expanded:
      "Reconfirm pricing support before Friday's order cycle. Aaron's loyalty is practical — the lapsed support is the risk. Bring the support terms in writing and pair them with the training date already booked, so the commitment lands as one decision instead of two.",
  },
  {
    key: "crm",
    header: "CRM NOTE",
    body: "Byron Bay Hotel — Aaron. Sentiment positive. Pricing support lapsed (risk). Staff training booked next month.",
    expanded:
      "Byron Bay Hotel — Aaron. Sentiment positive. Pricing support lapsed (risk). Staff training booked next month. Byron performing to expectation; no range changes requested. Next action owner: rep. Due before Friday order cycle.",
  },
  {
    key: "email",
    header: "FOLLOW-UP EMAIL",
    body: "Hi Aaron — great to catch up today. I'll have the pricing support sorted before Friday's order…",
    expanded:
      "Hi Aaron — great to catch up today. I'll have the pricing support sorted before Friday's order, and I'll confirm the training date for next month so your team is set. Anything you want covered on the day, send it through and I'll build it in.",
  },
  {
    key: "missed",
    header: "MISSED OPPORTUNITY",
    body: "Italian range activation not raised — strong ROS fit for their new menu.",
    expanded:
      "Italian range activation not raised — strong ROS fit for their new menu. Worth introducing at the training visit, when the staff conversation is already open and the menu change is front of mind.",
  },
  {
    key: "signals",
    header: "ACCOUNT SIGNALS",
    body: "Buying style: practical, menu-led · Margin pressure: support must be explicit · Risk: lapsed support",
    expanded:
      "Buying style: practical, menu-led · Margin pressure: support must be explicit · Risk: lapsed support · Relationship: warm, low-maintenance · Decision pace: fast when terms are written down.",
  },
];

export const HERO_NOTE =
  "Aaron happy with Byron. Pricing support lapsed. Wants help with staff performance. Training booked next month.";
