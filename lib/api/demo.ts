/**
 * DEMO ONLY. These stand in for the ARG TECH admin portal and for stock moving on
 * its own, so the whole buyer flow can be reviewed without a backend.
 * Delete this file (and components/account/demo-controls.tsx) once real staff
 * actions exist.
 */
import { MIN_ORDER_KG } from "../constants";
import { ConflictError, delay, getState, mutate, NotFoundError, resetDatabase } from "../db";
import { todayISO } from "../format";
import { requireCrop } from "../mock/catalog";
import { assignLots, otherCropLot } from "../mock/lots";
import { pricePerKgFor } from "../pricing";
import type { CropId, Order, OrderStatus, PickupPoint } from "../types";

function setStatus(order: Order, status: OrderStatus) {
  order.status = status;
  order.history.push({ status, at: todayISO() });
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  requested: "confirmed",
  confirmed: "delivered",
  delivered: "completed",
};

export function nextStatusOf(status: OrderStatus) {
  return NEXT_STATUS[status] ?? null;
}

/**
 * Staff action. Requested -> Confirmed fills in the confirmed quantity, the final
 * price from the tiers and the lots, and takes that quantity out of Supply (never
 * below 0). Later steps only move the status.
 */
export async function advanceOrder(id: string, options?: { confirmedKg?: number; pricePerKg?: number }) {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order", id);
    const next = NEXT_STATUS[order.status];
    if (!next) throw new ConflictError("This order cannot move forward any more.");

    if (order.status === "requested") {
      const kg = Math.round(options?.confirmedKg ?? order.requestedKg);
      if (kg < MIN_ORDER_KG || kg > order.requestedKg) {
        throw new ConflictError(
          `Confirmed quantity must be between ${MIN_ORDER_KG} and ${order.requestedKg} kg.`,
        );
      }
      order.confirmedKg = kg;
      if (order.cropId) {
        order.pricePerKg = pricePerKgFor(requireCrop(order.cropId), kg);
        order.lots = assignLots(order.cropId, kg);
        const stock = db.supply[order.cropId];
        stock.availableKg = Math.max(0, stock.availableKg - kg);
      } else {
        // Other crop: not in the catalog, so there are no tiers and no stock. Staff set the price.
        const price = options?.pricePerKg;
        if (!price || price <= 0) throw new ConflictError("Enter the price per kg for this crop.");
        order.pricePerKg = price;
        order.lots = [otherCropLot(order.cropName, kg)];
      }
    }
    setStatus(order, next);
  });
  return delay(true);
}

export async function declineRequest(id: string, reason: string) {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order", id);
    if (order.status !== "requested") throw new ConflictError("Only an open request can be declined.");
    order.declineReason = reason.trim() || undefined;
    setStatus(order, "declined");
  });
  return delay(true);
}

/** Staff cancel a Confirmed order; the quantity goes back to Supply. */
export async function cancelOrder(id: string, reason: string) {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order", id);
    if (order.status !== "confirmed") throw new ConflictError("Only a confirmed order can be cancelled.");
    if (order.cropId) db.supply[order.cropId].availableKg += order.confirmedKg ?? 0;
    order.cancelReason = reason.trim() || undefined;
    setStatus(order, "cancelled");
  });
  return delay(true);
}

/** Pretend other buyers bought stock: lower a crop's available kg. Never raises it. */
export async function simulateStockChange(cropId: CropId, newAvailableKg: number) {
  requireCrop(cropId);
  mutate((db) => {
    const stock = db.supply[cropId];
    stock.availableKg = Math.max(0, Math.min(stock.availableKg, Math.floor(newAvailableKg)));
  });
  return delay(true, 30);
}

export async function setRegistered(registered: boolean) {
  mutate((db) => {
    db.session.registered = registered;
  });
  return delay(true, 20);
}

export async function resetDemoData() {
  resetDatabase();
  return delay(true, 20);
}

/** Read-only helper for the demo UI. */
export function currentStock(cropId: CropId) {
  return getState().supply[cropId].availableKg;
}

/**
 * Staff action: arrange the pickup for a pickup order. Fills in the meeting point, date and
 * time window, which switches the buyer's Pickup card to "Arranged".
 */
export async function arrangePickup(
  id: string,
  arrangement: { point: PickupPoint; date: string; timeWindow: string },
) {
  mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) throw new NotFoundError("Order", id);
    if (order.deliveryMethod !== "pickup") throw new ConflictError("This is not a pickup order.");
    if (order.status !== "confirmed") throw new ConflictError("Pickup can be arranged once the order is confirmed.");
    if (!arrangement.date) throw new ConflictError("Choose a pickup date.");
    const existing = order.pickup;
    order.pickup = {
      point: arrangement.point,
      date: arrangement.date,
      timeWindow: arrangement.timeWindow,
      collectorName: existing?.collectorName ?? "",
      collectorPhone: existing?.collectorPhone ?? "",
    };
  });
  return delay(true);
}
