"use client";

/**
 * DEMO ONLY. There is no admin portal in this project, so this panel plays the
 * ARG TECH staff side. Remove this component (and lib/api/demo.ts) before launch.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Ban, FlaskConical, MapPin, RotateCcw, UserX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FieldGroup, Input, InputWithSuffix, Textarea } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { OrderStatusBadge } from "@/components/orders/status";
import { SAMPLE_PICKUP_POINTS, SAMPLE_TIME_WINDOWS } from "@/lib/mock/pickup";
import {
  advanceOrder,
  arrangePickup,
  cancelOrder,
  declineRequest,
  nextStatusOf,
  resetDemoData,
  setRegistered,
  simulateStockChange,
} from "@/lib/api/demo";
import { cropLabel, listOrders } from "@/lib/api/orders";
import { listAllCrops } from "@/lib/api/supply";
import { MIN_ORDER_KG } from "@/lib/constants";
import { formatNumber, statusLabel, tomorrowISO } from "@/lib/format";
import { useQuery } from "@/lib/hooks/use-query";
import { errorMessage } from "@/lib/utils";
import type { CropId } from "@/lib/types";

type Dialog = "confirm" | "decline" | "cancel" | "pickup" | null;

export function DemoControls() {
  const { data: orders } = useQuery(() => listOrders(), []);
  const { data: supply } = useQuery(() => listAllCrops(), []);

  const [orderId, setOrderId] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [confirmedKg, setConfirmedKg] = useState("");
  const [otherPrice, setOtherPrice] = useState("");
  const [pointIndex, setPointIndex] = useState("0");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupWindow, setPickupWindow] = useState(SAMPLE_TIME_WINDOWS[0]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const [stockCrop, setStockCrop] = useState("");
  const [stockKg, setStockKg] = useState("");

  const order = orders?.find((o) => o.id === orderId);
  const next = order ? nextStatusOf(order.status) : null;

  useEffect(() => {
    if (!orderId && orders?.length) setOrderId(orders[0].id);
  }, [orders, orderId]);

  async function run(action: () => Promise<unknown>, done: string) {
    setError(null);
    setMessage(null);
    try {
      await action();
      setDialog(null);
      setMessage(done);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function openAdvance() {
    if (!order || !next) return;
    if (order.status === "requested") {
      setConfirmedKg(String(order.requestedKg));
      setOtherPrice("");
      setError(null);
      setDialog("confirm");
    } else {
      void run(() => advanceOrder(order.id), `${order.code} moved to ${statusLabel(next, order.deliveryMethod)}.`);
    }
  }

  const stockItem = supply?.find((s) => s.crop.id === stockCrop);

  return (
    <section className="rounded-card border-2 border-dashed border-amber-400 bg-amber-50 p-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-amber-700" />
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-amber-800">Demo controls</h2>
      </div>
      <p className="mt-1 text-xs text-amber-800">
        Demo only. These play the ARG TECH staff side so every status can be reviewed. They will be removed.
        Demo data is sample data.
      </p>

      <div className="mt-4 space-y-4">
        <FieldGroup label="Selected order">
          <Select
            value={orderId}
            onValueChange={(v) => {
              setOrderId(v);
              setMessage(null);
              setError(null);
            }}
            placeholder="Choose an order"
            options={(orders ?? []).map((o) => ({
              value: o.id,
              label: `${o.code} · ${cropLabel(o)}`,
              description: statusLabel(o.status, o.deliveryMethod),
            }))}
          />
        </FieldGroup>

        {order ? (
          <div className="flex items-center gap-2 text-xs text-amber-900">
            Current status: <OrderStatusBadge status={order.status} method={order.deliveryMethod} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Button block variant="secondary" disabled={!next} onClick={openAdvance}>
            <ArrowRight />
            {next && order ? `Advance to ${statusLabel(next, order.deliveryMethod)}` : "Advance selected order status"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={order?.status !== "requested"}
              onClick={() => {
                setReason("Not enough supply for your date");
                setError(null);
                setDialog("decline");
              }}
            >
              <XCircle />
              Decline request
            </Button>
            <Button
              variant="secondary"
              disabled={order?.status !== "confirmed"}
              onClick={() => {
                setReason("Farmer could not deliver. Please reorder.");
                setError(null);
                setDialog("cancel");
              }}
            >
              <Ban />
              Cancel order
            </Button>
          </div>
          <Button
            block
            variant="secondary"
            disabled={!(order?.deliveryMethod === "pickup" && order.status === "confirmed")}
            onClick={() => {
              const known = SAMPLE_PICKUP_POINTS.findIndex((p) => p.name === order?.pickup?.point?.name);
              setPointIndex(String(Math.max(0, known)));
              setPickupDate(
                order?.pickup?.date ?? (order && order.neededBy >= tomorrowISO() ? order.neededBy : tomorrowISO()),
              );
              setPickupWindow(order?.pickup?.timeWindow ?? SAMPLE_TIME_WINDOWS[0]);
              setError(null);
              setDialog("pickup");
            }}
          >
            <MapPin />
            Arrange pickup
          </Button>
        </div>

        {message ? <p className="text-xs font-semibold text-brand-700">{message}</p> : null}
        {!dialog ? <ErrorNotice message={error} /> : null}

        <div className="border-t border-amber-300 pt-4">
          <p className="mb-2 text-sm font-semibold text-ink">Simulate stock change</p>
          <div className="space-y-2">
            <Select
              value={stockCrop}
              onValueChange={(v) => {
                setStockCrop(v);
                const item = supply?.find((s) => s.crop.id === v);
                setStockKg(String(Math.floor((item?.availableKg ?? 0) / 2)));
              }}
              placeholder="Choose a crop"
              options={(supply ?? []).map((s) => ({
                value: s.crop.id,
                label: s.crop.name,
                description: `${formatNumber(s.availableKg)} kg available`,
              }))}
            />
            <InputWithSuffix
              suffix="kg"
              inputMode="numeric"
              placeholder="New available kg"
              value={stockKg}
              onChange={(e) => setStockKg(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              block
              variant="secondary"
              disabled={!stockItem || stockKg === ""}
              onClick={() =>
                void run(
                  () => simulateStockChange(stockCrop as CropId, Number(stockKg)),
                  `${stockItem?.crop.name} stock lowered to ${formatNumber(Math.min(Number(stockKg), stockItem?.availableKg ?? 0))} kg.`,
                )
              }
            >
              Reduce available stock
            </Button>
            <p className="text-[11px] text-amber-800">
              Open Order now with a larger quantity typed, then use this (or the button on that form) to see
              &ldquo;Stock changed&rdquo;.
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-amber-300 pt-4">
          <Button block variant="secondary" onClick={() => void setRegistered(false)}>
            <UserX />
            Preview as unregistered user
          </Button>
          <Button block variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw />
            Reset demo data
          </Button>
        </div>
      </div>

      <Sheet
        open={dialog === "pickup"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Arrange pickup for ${order?.code ?? "order"}`}
        description="Staff action: choose the meeting point, date and time window. Meeting points are never farms."
      >
        <div className="space-y-3.5">
          <FieldGroup label="Meeting point">
            <Select
              value={pointIndex}
              onValueChange={setPointIndex}
              options={SAMPLE_PICKUP_POINTS.map((p, i) => ({
                value: String(i),
                label: p.name,
                description: p.landmark,
              }))}
            />
          </FieldGroup>
          <FieldGroup label="Date" htmlFor="pickup-date">
            <Input
              id="pickup-date"
              type="date"
              min={tomorrowISO()}
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Time window">
            <Select
              value={pickupWindow}
              onValueChange={setPickupWindow}
              options={SAMPLE_TIME_WINDOWS.map((w) => ({ value: w, label: w }))}
            />
          </FieldGroup>
          <ErrorNotice message={error} />
          <Button
            block
            onClick={() =>
              order &&
              void run(
                () =>
                  arrangePickup(order.id, {
                    point: SAMPLE_PICKUP_POINTS[Number(pointIndex)],
                    date: pickupDate,
                    timeWindow: pickupWindow,
                  }),
                `Pickup arranged for ${order.code}.`,
              )
            }
          >
            Save pickup
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={dialog === "confirm"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Confirm ${order?.code ?? "request"}`}
        description="Staff action: set the confirmed quantity. The final price comes from the tiers."
      >
        <div className="space-y-3.5">
          <FieldGroup
            label="Confirmed quantity"
            hint={`Requested ${formatNumber(order?.requestedKg)} kg. Minimum ${MIN_ORDER_KG} kg.`}
          >
            <InputWithSuffix
              suffix="kg"
              inputMode="numeric"
              value={confirmedKg}
              onChange={(e) => setConfirmedKg(e.target.value.replace(/\D/g, ""))}
            />
          </FieldGroup>
          {order && !order.cropId ? (
            <FieldGroup
              label="Price per kg"
              hint="Not a catalog crop, so there are no price tiers. Staff set the price."
            >
              <InputWithSuffix
                suffix="$/kg"
                inputMode="decimal"
                value={otherPrice}
                onChange={(e) => setOtherPrice(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </FieldGroup>
          ) : null}
          <ErrorNotice message={error} />
          <Button
            block
            onClick={() =>
              order &&
              void run(
                () =>
                  advanceOrder(order.id, {
                    confirmedKg: Number(confirmedKg),
                    pricePerKg: order.cropId ? undefined : Number(otherPrice),
                  }),
                order.cropId
                  ? `${order.code} confirmed. Supply for ${order.cropName} was reduced.`
                  : `${order.code} confirmed.`,
              )
            }
          >
            Confirm request
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={dialog === "decline" || dialog === "cancel"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === "cancel" ? `Cancel ${order?.code ?? "order"}` : `Decline ${order?.code ?? "request"}`}
        description={
          dialog === "cancel"
            ? "Staff action. The quantity returns to Supply."
            : "Staff action. Nothing was reserved, so Supply does not change."
        }
      >
        <div className="space-y-3.5">
          <FieldGroup label="Reason shown to the buyer">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </FieldGroup>
          <ErrorNotice message={error} />
          <Button
            block
            variant="danger"
            onClick={() =>
              order &&
              void run(
                () => (dialog === "cancel" ? cancelOrder(order.id, reason) : declineRequest(order.id, reason)),
                dialog === "cancel" ? `${order.code} cancelled. Stock returned to Supply.` : `${order.code} declined.`,
              )
            }
          >
            {dialog === "cancel" ? "Cancel order" : "Decline request"}
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="This restores the seeded orders, supply and addresses."
        confirmLabel="Reset"
        destructive
        onConfirm={() => void resetDemoData()}
      />
    </section>
  );
}
