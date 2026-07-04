export function healthPill(score: number | null): { tone: "green" | "amber" | "red"; label: string } {
  if (score == null) return { tone: "amber", label: "No signal" };
  if (score >= 67) return { tone: "green", label: "On track" };
  if (score >= 34) return { tone: "amber", label: "At risk" };
  return { tone: "red", label: "Off track" };
}

export function statusPillTone(status: string): "green" | "amber" | "red" | "blue" | "grey" {
  switch (status) {
    case "active":
    case "paid":
    case "signed":
    case "completed":
      return "green";
    case "overdue":
      return "red";
    case "draft":
    case "archived":
      return "grey";
    case "sent":
    case "viewed":
    case "on_hold":
      return "blue";
    default:
      return "amber";
  }
}
