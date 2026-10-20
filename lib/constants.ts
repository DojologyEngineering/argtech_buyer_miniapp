/** Business rules kept as single constants so they are easy to change. */

/** Minimum order / request size in kilograms. */
export const MIN_ORDER_KG = 50;

/** Hours ARG TECH promises to reply to a future-date request. */
export const REQUEST_REPLY_HOURS = 24;

/** How many weeks ahead the forecast looks. */
export const FORECAST_WEEKS = 6;

/** Show a "higher tier is close" hint when the buyer is within this share of the next threshold. */
export const NEAR_TIER_RATIO = 0.25;

/** ARG TECH contact details (mock). */
export const ARGTECH_CONTACT = {
  phone: "+855 12 345 678",
  phoneHref: "tel:+85512345678",
  telegramHandle: "@argtech_support",
  telegramUrl: "https://t.me/argtech_support",
} as const;

export const TRACEABILITY_DISCLAIMER =
  "Recorded by an ARG TECH field agent during farm visits.";

export const CERTIFICATE_CAPTION =
  "Document provided by the farmer and seen by an ARG TECH field agent.";

/** Pilot area. Every crop and lot is shown as grown here. */
export const PILOT_PROVINCE = "Kampong Cham";

/** Reasons for "Had an issue" on delivered produce. */
export const FEEDBACK_REASONS = [
  "Too ripe",
  "Not ripe enough",
  "Cracks or damage",
  "Wrong size",
  "Short quantity",
  "Other",
] as const;

export const STANDARD_OPTION = "Standard";

/** Districts where pickup points are. One constant so it can change. */
export const PICKUP_DISTRICTS = ["Kang Meas", "Srey Santhor"];
