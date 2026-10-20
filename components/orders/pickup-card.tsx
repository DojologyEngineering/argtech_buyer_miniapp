"use client";

import { CircleCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { OrderView } from "@/lib/api/orders";
import { formatDate } from "@/lib/format";
import { openExternalLink } from "@/lib/telegram";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

/**
 * Pickup arrangements for a pickup order. Pickups happen at a meeting point chosen by
 * ARG TECH, never at a farm, so this card never shows a farm name, farmer or farm location.
 */
export function PickupCard({ order }: { order: OrderView }) {
  const pickup = order.pickup;
  if (order.deliveryMethod !== "pickup" || !pickup) return null;
  // A declined or cancelled order has nothing to collect.
  if (order.status === "declined" || order.status === "cancelled") return null;

  const pickedUp = order.status === "delivered" || order.status === "completed";

  if (pickedUp) {
    const at = order.history.find((h) => h.status === "delivered")?.at ?? pickup.date;
    return (
      <Card>
        <CardBody className="flex items-center gap-3 py-3.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <CircleCheck className="size-4" />
          </span>
          <p className="text-sm font-semibold text-ink">Picked up on {formatDate(at)}</p>
        </CardBody>
      </Card>
    );
  }

  const point = pickup.point;

  return (
    <Card>
      <CardBody>
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <MapPin className="size-4 text-brand-600" />
          Pickup
        </h2>

        {!point ? (
          <p className="mt-2 text-sm text-muted">
            ARG TECH will share the pickup point and time once the farmer confirms.
          </p>
        ) : (
          <>
            <dl className="mt-3 divide-y divide-line/70">
              <Row
                label="Pickup point"
                value={
                  <>
                    {point.name}
                    <span className="block text-xs font-normal text-muted">{point.landmark}</span>
                    <span className="block text-xs font-normal text-muted">{point.district}</span>
                  </>
                }
              />
              <Row label="Date" value={formatDate(pickup.date)} />
              <Row label="Time window" value={pickup.timeWindow ?? "To be confirmed"} />
              <Row
                label="Collected by"
                value={
                  pickup.collectorName || pickup.collectorPhone ? (
                    <>
                      {pickup.collectorName || "Name not set"}
                      {pickup.collectorPhone ? (
                        <span className="block text-xs font-normal text-muted">{pickup.collectorPhone}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="font-normal text-muted">Not set</span>
                  )
                }
              />
            </dl>

            {point.mapUrl ? (
              <Button variant="secondary" block className="mt-4" onClick={() => openExternalLink(point.mapUrl!)}>
                <MapPin />
                Open in Google Maps
              </Button>
            ) : null}

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Bring your order code {order.code}. You will check the produce with our agent and pay for the
              accepted kg before loading.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
