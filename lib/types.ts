/**
 * Buyer-facing domain model.
 *
 * Farmer identity never appears here: lots are anonymous codes and origin is
 * limited to province (crop level) or province/district/commune (lot level).
 */

export type CropId =
  | "tomato"
  | "cucumber"
  | "long-bean"
  | "morning-glory"
  | "chili"
  | "cabbage"
  | "eggplant";

/** Price per kg that applies to the whole order when quantity falls in [minKg, maxKg]. */
export interface PriceTier {
  minKg: number;
  maxKg: number | null;
  pricePerKg: number;
}

/**
 * Crop-level origin shown before any order exists. Derived from the crop's lot records
 * (see lib/mock/origin.ts), in plain words only: no communes, counts, exact dates,
 * farm numbers or farmer names.
 */
export interface OriginSummary {
  province: string;
  /** At most three, districts only. */
  districts: string[];
  /** e.g. "Mostly conventional" */
  method: string;
  /** Fertilizer and pesticide line, e.g. "Mostly chemical fertilizer. Pesticide used on most lots." */
  inputs: string;
  /** e.g. "Last picked yesterday" */
  picked: string;
  /** e.g. "Most picked within the last 14 days." */
  pickedNote: string;
  /** e.g. "GAP on some lots" or "None on record" */
  certificates: string;
}

/**
 * Written specification for a crop. One data object so the admin portal can edit it
 * later. Wording rule: "checked by our agent at handover"; never claim lab testing or guarantees.
 */
export interface CropSpec {
  ripeness: string;
  size: string;
  /** Fixed: buyers cannot lower it. */
  condition: string;
  bestUsedWithinDays: number;
  /** Up to three short chips for the Supply list. */
  chips: string[];
  /** Request options. "Standard" (the specification above) is always first; one entry means no dropdown. */
  ripenessOptions: string[];
  sizeOptions: string[];
}

export interface Crop {
  id: CropId;
  name: string;
  tiers: PriceTier[];
  spec: CropSpec;
}

export interface SupplyRecord {
  availableKg: number;
  /** ISO date of the most recent pick. */
  lastPickedAt: string;
}

/* ---------------------------------------------------------------- Traceability */

export interface FieldActivity {
  date: string;
  type: "irrigation" | "fertilization";
  note: string;
}

/**
 * What the buyer may see of a certificate. Staff set the sharing setting and upload a
 * buyer-safe copy of the image (name, ID number, address and QR codes removed), so the
 * buyer app only ever shows that safe copy.
 */
export type CertificateSharing = "hidden" | "details" | "details_and_image";

export interface LotCertificate {
  /** Full name, e.g. "Good Agricultural Practices (GAP)". */
  type: string;
  /** Short form used in crop-level summaries, e.g. "GAP". */
  typeShort: string;
  issuer: string;
  /** e.g. "Tomato production" */
  scope: string;
  /** ISO date. */
  expiry: string;
  sharing: CertificateSharing;
  /** Buyer-safe copy. Only used when sharing is "details_and_image". */
  imageUrl?: string;
}

export interface Lot {
  /** Anonymous lot code, e.g. "A-014". */
  code: string;
  quantityKg: number;
  province: string;
  district: string;
  commune: string;
  crop: string;
  variety: string;
  plantingDate: string;
  harvestDates: string[];
  productionMethod: string;
  fertilizer: string;
  /** As reported to the field agent. */
  pesticide: string;
  activities: FieldActivity[];
  certificates: LotCertificate[];
}

/* -------------------------------------------------------------------- Orders */

export type OrderKind = "instant" | "request";

export type OrderStatus =
  | "requested"
  | "confirmed"
  | "delivered"
  | "completed"
  | "declined"
  | "cancelled";

export type DeliveryMethod = "delivery" | "pickup";

/**
 * A meeting point chosen by ARG TECH. Farmers stay anonymous, so a pickup never happens
 * at a farm: an ARG TECH agent and the buyer's representative check the produce together here.
 */
export interface PickupPoint {
  name: string;
  district: string;
  /** Short landmark note, e.g. "Next to the market gate". */
  landmark: string;
  /** Google Maps link. Optional. */
  mapUrl?: string;
}

/** Pickup arrangements on an order. "Not arranged yet" while `point` is null. */
export interface Pickup {
  point: PickupPoint | null;
  /** Date ARG TECH arranged. Null until arranged. */
  date: string | null;
  /** e.g. "8:00 to 10:00". Null until arranged. */
  timeWindow: string | null;
  /** Person collecting. Empty strings when not set. */
  collectorName: string;
  collectorPhone: string;
}

/** Result of the check at handover (kept for the Agent App; not shown in this app yet). */
export interface Handover {
  receivedKg: number;
  acceptedKg: number;
  rejectedKg: number;
  rejectReason: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Order {
  id: string;
  /** Shared sequence number; the code prefix depends on kind and status. */
  seq: number;
  kind: OrderKind;
  /** Null for an "Other crop" request (a crop that is not in the catalog). */
  cropId: CropId | null;
  cropName: string;
  requestedKg: number;
  /** Null until a request is confirmed. Equals requestedKg for instant orders. */
  confirmedKg: number | null;
  /** Final price per kg. Null while a request is open or declined. */
  pricePerKg: number | null;
  /** Price per kg from the tiers at request time (indicative only). Null for other crops. */
  indicativePricePerKg: number | null;
  /** Delivery date for orders, needed-by date for requests. */
  neededBy: string;
  deliveryMethod: DeliveryMethod;
  addressId: string | null;
  /** Snapshot so the order keeps its address if the saved one is edited or removed. */
  addressText: string | null;
  note: string;
  status: OrderStatus;
  createdAt: string;
  history: StatusEvent[];
  /** Buyer choices on a catalog request (absent on Order now, which uses the crop specification). */
  requirements?: { ripeness: string; size: string };
  /** Free text on an "Other crop" request. */
  requirementsText?: string;
  /** Present when the delivery method is "pickup". */
  pickup?: Pickup;
  handover?: Handover;
  feedback?: OrderFeedback;
  declineReason?: string;
  cancelReason?: string;
  lots: Lot[];
}

export type FeedbackOutcome = "as_expected" | "issue";

export interface OrderFeedback {
  outcome: FeedbackOutcome;
  reasons: string[];
  note: string;
  /** Lot codes of the order, so staff can link the answer to the produce. */
  lotCodes: string[];
  at: string;
}

/* ------------------------------------------------------------------- Account */

export interface Buyer {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface Address {
  id: string;
  label: string;
  line: string;
  district: string;
  city: string;
}

export interface Session {
  registered: boolean;
}
