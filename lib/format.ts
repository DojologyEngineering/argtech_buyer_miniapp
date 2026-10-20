import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfWeek } from "date-fns";

export function formatDate(iso: string | null | undefined, pattern = "dd MMM yyyy") {
  if (!iso) return "—";
  const d = parseISO(iso);
  return isValid(d) ? format(d, pattern) : "—";
}

export function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/** ISO date `n` days from today — keeps mock data alive as time passes. */
export function daysFromToday(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function todayISO() {
  return daysFromToday(0);
}

export function tomorrowISO() {
  return daysFromToday(1);
}

/** Monday of the week containing `iso` (weeks start on Monday). */
export function weekStartISO(iso: string) {
  return toISODate(startOfWeek(parseISO(iso), { weekStartsOn: 1 }));
}

export function addDaysISO(iso: string, n: number) {
  return toISODate(addDays(parseISO(iso), n));
}

/** "13–19 Oct" or "28 Oct – 3 Nov" */
export function formatWeekRange(weekStart: string) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}–${format(end, "d MMM")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM")}`;
}

/** "yesterday" / "3 days ago" / "today" */
export function formatDaysAgo(iso: string) {
  const days = differenceInCalendarDays(new Date(), parseISO(iso));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function formatCurrency(value: number | null | undefined, fractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatNumber(value: number | null | undefined, fractionDigits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatKg(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${formatNumber(value)} kg`;
}

/** "A and B" / "A, B and C" */
export function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function orderCode(order: { kind: string; status: string; seq: number }) {
  // A request keeps its REQ code until staff confirm it; after that it is a PO.
  const isRequest = order.status === "requested" || order.status === "declined";
  return `${isRequest ? "REQ" : "PO"}-${String(order.seq).padStart(4, "0")}`;
}

/** Wording for a status. A delivered pickup order reads "Picked up"; the stored status stays "delivered". */
export function statusLabel(
  status: "requested" | "confirmed" | "delivered" | "completed" | "declined" | "cancelled",
  deliveryMethod?: "delivery" | "pickup",
) {
  if (status === "delivered" && deliveryMethod === "pickup") return "Picked up";
  return {
    requested: "Requested",
    confirmed: "Confirmed",
    delivered: "Delivered",
    completed: "Completed",
    declined: "Declined",
    cancelled: "Cancelled",
  }[status];
}
