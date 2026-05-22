// Compute urgency status for a document expiry date.

export type UrgencyLevel = "expired" | "soon" | "warning" | "safe";

export type Urgency = {
  level: UrgencyLevel;
  days: number; // negative if expired
  label: string; // user-facing short text
};

/**
 * Days between today (local midnight) and the expiry date (local midnight).
 * Positive = future, negative = past.
 */
export function daysUntil(expiryISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(expiryISO);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUrgency(expiryISO: string, t: (k: string) => string): Urgency {
  const days = daysUntil(expiryISO);
  let level: UrgencyLevel;
  if (days < 0) level = "expired";
  else if (days <= 7) level = "soon";
  else if (days <= 30) level = "warning";
  else level = "safe";

  let label: string;
  if (days < 0) {
    const abs = Math.abs(days);
    label =
      abs === 1
        ? t("urgency.expiredYesterday")
        : t("urgency.expiredDaysAgo").replace("{n}", String(abs));
  } else if (days === 0) label = t("urgency.expiresToday");
  else if (days === 1) label = t("urgency.expiresTomorrow");
  else label = t("urgency.daysLeft").replace("{n}", String(days));

  return { level, days, label };
}

export function urgencyColors(
  level: UrgencyLevel,
  theme: { success: string; warning: string; brandPrimary: string; error: string; brandSecondary: string }
) {
  switch (level) {
    case "expired":
      return { bg: theme.error, fg: "#FFFFFF" };
    case "soon":
      return { bg: theme.brandPrimary, fg: "#FFFFFF" };
    case "warning":
      return { bg: theme.warning, fg: "#38312E" };
    case "safe":
    default:
      return { bg: theme.success, fg: "#FFFFFF" };
  }
}

export function formatExpiryDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === "bg" ? "bg-BG" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
