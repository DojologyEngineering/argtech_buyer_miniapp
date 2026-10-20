import { MIN_ORDER_KG } from "../constants";
import { ConflictError, delay, getState, mutate, NotFoundError, StockChangedError } from "../db";
import { orderCode, todayISO, tomorrowISO } from "../format";
import { getCrop, requireCrop, specSummary } from "../mock/catalog";
import { assignLots } from "../mock/lots";
import { emptyPickup } from "../mock/pickup";
import { pricePerKgFor } from "../pricing";
import { STANDARD_OPTION } from "../constants";
import type { CropId, DeliveryMethod, FeedbackOutcome, Order, OrderStatus } from "../types";
import { formatAddress } from "./account";

/** An order as screens see it: with its display code resolved. */
export type OrderView = Order & { code: string };

/** "Pumpkin" for catalog crops, "Other crop: Pumpkin" for crops that are not listed. */
export function cropLabel(order: Pick<Order, "cropId" | "cropName">) {
  return order.cropId ? order.cropName : `Other crop: ${order.cropName}`;
}

/**
 * What this order is checked against, always as actual text. Order now: the crop specification.
 * Catalog request: "Standard: ..." or the buyer's choices plus the fixed condition. Other crop:
 * the buyer's own text.
 */
export function orderSpecification(order: Order) {
  if (!order.cropId) return order.requirementsText || "To be agreed with ARG TECH";
  const crop = getCrop(order.cropId);
  if (!crop) return STANDARD_OPTION;
  if (!order.requirements) return specSummary(crop);
  const { ripeness, size } = order.requirements;
  // Kept Standard: say so, and spell out what Standard means for this crop.
  if (ripeness === STANDARD_OPTION && size === STANDARD_OPTION) return `Standard: ${specSummary(crop)}`;
  // Otherwise: the buyer's choices (Standard parts fall back to the crop specification) plus the fixed condition.
  return [
    ripeness === STANDARD_OPTION ? crop.spec.ripeness : ripeness,
    size === STANDARD_OPTION ? crop.spec.size : size,
    crop.spec.condition,
  ].join(" · ");
}

export function toView(order: Order): OrderView {
  return structuredClone({ ...order, code: orderCode(order) });
}

export async function listOrders(filter?: { status?: OrderStatus | "all" }) {
  const status = filter?.status ?? "all";
  const orders = getState()
    .orders.filter((o) => status === "all" || o.status === status)
    .sort((a, b) => b.seq - a.seq)
    .map(toView);
  return delay(orders);
}

export async function getOrder(id: string) {
  const order = getState().orders.find((o) => o.id === id);
  if (!order) throw new NotFoundError("Order", id);
  return delay(toView(order));
}

export interface OrderInput {
  cropId: CropId;
  quantityKg: number;
  /** Delivery date for instant orders; needed-by date for requests. */
  date: string;
  deliveryMethod: DeliveryMethod;
  addressId: string | null;
  note: string;
  /** Optional, pickup only. */
  collectorName?: string;
  collectorPhone?: string;
}

function validateCommon(input: { quantityKg: number; date: string }, minDate: string) {
  if (!Number.isFinite(input.quantityKg) || input.quantityKg < MIN_ORDER_KG) {
    throw new ConflictError(`The minimum order is ${MIN_ORDER_KG} kg.`);
  }
  if (!input.date) throw new ConflictError("Choose a date.");
  if (input.date < minDate) throw new ConflictError("Choose a date that is not in the past.");
}

/** A new pickup order always starts as "not arranged yet". */
function pickupFor(input: { deliveryMethod: DeliveryMethod; collectorName?: string; collectorPhone?: string }) {
  return input.deliveryMethod === "pickup"
    ? { pickup: emptyPickup(input.collectorName?.trim() ?? "", input.collectorPhone?.trim() ?? "") }
    : {};
}

function resolveAddress(input: Pick<OrderInput, "deliveryMethod" | "addressId">) {
  if (input.deliveryMethod !== "delivery") return { addressId: null, addressText: null };
  const address = getState().addresses.find((a) => a.id === input.addressId);
  if (!address) throw new ConflictError("Choose a delivery address.");
  return { addressId: address.id, addressText: formatAddress(address) };
}

/**
 * Order now: price from the tiers, confirmed instantly, stock reserved immediately,
 * lots auto-assigned. No staff step.
 */
export async function placeInstantOrder(input: OrderInput) {
  const crop = requireCrop(input.cropId);
  validateCommon(input, todayISO());
  const address = resolveAddress(input);

  const result = mutate((db) => {
    // Checked inside the mutation so a reservation can never overdraw stock.
    const stock = db.supply[crop.id];
    if (input.quantityKg > stock.availableKg) throw new StockChangedError(stock.availableKg);
    stock.availableKg -= input.quantityKg;

    const now = todayISO();
    const price = pricePerKgFor(crop, input.quantityKg);
    const seq = db.nextSeq++;
    const order: Order = {
      id: `ord_${seq}`,
      seq,
      kind: "instant",
      cropId: crop.id,
      cropName: crop.name,
      requestedKg: input.quantityKg,
      confirmedKg: input.quantityKg,
      pricePerKg: price,
      indicativePricePerKg: price,
      neededBy: input.date,
      deliveryMethod: input.deliveryMethod,
      ...address,
      ...pickupFor(input),
      note: input.note.trim(),
      status: "confirmed",
      createdAt: now,
      history: [{ status: "confirmed", at: now }],
      lots: assignLots(crop.id, input.quantityKg),
    };
    db.orders.push(order);
    return toView(order);
  });
  return delay(result, 250);
}

export interface RequestInput {
  /** Null for an "Other crop" request. */
  cropId: CropId | null;
  /** Required when cropId is null. */
  otherCropName?: string;
  quantityKg: number;
  date: string;
  deliveryMethod: DeliveryMethod;
  addressId: string | null;
  note: string;
  /** Optional, pickup only. */
  collectorName?: string;
  collectorPhone?: string;
  /** Catalog crops: the buyer's ripeness and size choices. */
  ripeness?: string;
  size?: string;
  /** Other crops: one optional free-text requirement. */
  requirementsText?: string;
}

/** Request for a future date: reserves nothing, staff confirm or decline. */
export async function sendRequest(input: RequestInput) {
  const crop = input.cropId ? requireCrop(input.cropId) : null;
  const otherName = input.otherCropName?.trim() ?? "";
  if (!crop && otherName.length < 2) throw new ConflictError("Enter the name of the crop you need.");
  validateCommon(input, tomorrowISO());
  const address = resolveAddress(input);

  const result = mutate((db) => {
    const now = todayISO();
    const seq = db.nextSeq++;
    const order: Order = {
      id: `ord_${seq}`,
      seq,
      kind: "request",
      cropId: crop?.id ?? null,
      cropName: crop?.name ?? otherName,
      requestedKg: input.quantityKg,
      confirmedKg: null,
      pricePerKg: null,
      indicativePricePerKg: crop ? pricePerKgFor(crop, input.quantityKg) : null,
      neededBy: input.date,
      deliveryMethod: input.deliveryMethod,
      ...address,
      ...pickupFor(input),
      ...(crop
        ? {
            requirements: {
              ripeness: input.ripeness ?? STANDARD_OPTION,
              size: input.size ?? STANDARD_OPTION,
            },
          }
        : { requirementsText: input.requirementsText?.trim() || undefined }),
      note: input.note.trim(),
      status: "requested",
      createdAt: now,
      history: [{ status: "requested", at: now }],
      lots: [],
    };
    db.orders.push(order);
    return toView(order);
  });
  return delay(result, 250);
}

/** "How was the produce?" answer for a delivered or completed order. Linked to the order's lots. */
export async function submitFeedback(
  id: string,
  answer: { outcome: FeedbackOutcome; reasons: string[]; note: string },
) {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order", id);
    if (order.status !== "delivered" && order.status !== "completed") {
      throw new ConflictError("Feedback is available once the order is delivered.");
    }
    if (answer.outcome === "issue" && answer.reasons.length === 0) {
      throw new ConflictError("Choose at least one reason.");
    }
    order.feedback = {
      outcome: answer.outcome,
      reasons: answer.outcome === "issue" ? answer.reasons : [],
      note: answer.note.trim(),
      lotCodes: order.lots.map((l) => l.code),
      at: todayISO(),
    };
  });
  return delay(true, 200);
}
