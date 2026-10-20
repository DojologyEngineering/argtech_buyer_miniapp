"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { Card, CardBody, SectionHeading } from "@/components/ui/card";
import { EmptyState, ListSkeleton, Notice } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { ContactButton } from "@/components/orders/contact-sheet";
import { quantityLabel } from "@/components/orders/order-card";
import { OrderStatusBadge } from "@/components/orders/status";
import { PickupCard } from "@/components/orders/pickup-card";
import { StatusTimeline } from "@/components/orders/status-timeline";
import { TraceabilityTab } from "@/components/orders/traceability";
import { FeedbackCard } from "@/components/orders/feedback-card";
import { cropLabel, getOrder, orderSpecification, type OrderView } from "@/lib/api/orders";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { useQuery } from "@/lib/hooks/use-query";
import { totalPrice } from "@/lib/pricing";

type Tab = "details" | "trace";

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

/** Pickup orders talk about pickup, not delivery. Until ARG TECH arranges it, the date is only the buyer's wish. */
function dateRowLabel(order: OrderView, open: boolean) {
  if (open) return "Needed by";
  if (order.deliveryMethod !== "pickup") return "Delivery date";
  return order.status === "confirmed" && !order.pickup?.point ? "Preferred pickup date" : "Pickup date";
}

function Summary({ order }: { order: OrderView }) {
  const finalPrice = order.pricePerKg !== null;
  const price = order.pricePerKg ?? order.indicativePricePerKg;
  const qty = order.confirmedKg ?? order.requestedKg;
  const open = order.status === "requested" || order.status === "declined";

  return (
    <Card>
      <CardBody>
        <dl className="divide-y divide-line">
          <SummaryRow label="Crop" value={cropLabel(order)} />
          <SummaryRow
            label={order.confirmedKg === null ? "Quantity requested" : "Quantity"}
            value={`${formatNumber(qty)} kg`}
          />
          <SummaryRow
            label="Price per kg"
            value={
              price === null ? (
                <span className="font-normal text-muted">To be confirmed by ARG TECH</span>
              ) : finalPrice ? (
                formatCurrency(price)
              ) : (
                <>
                  {formatCurrency(price)}
                  <span className="block text-[11px] font-normal text-muted">Indicative, not final</span>
                </>
              )
            }
          />
          <SummaryRow
            label={finalPrice ? "Total price" : "Indicative total"}
            value={
              price === null ? (
                <span className="font-normal text-muted">To be confirmed</span>
              ) : (
                <span className="text-base text-brand-700">{formatCurrency(totalPrice(qty, price))}</span>
              )
            }
          />
          <SummaryRow label="Specification" value={orderSpecification(order)} />
          <SummaryRow label={dateRowLabel(order, open)} value={formatDate(order.neededBy)} />
          <SummaryRow
            label="Delivery method"
            value={
              order.deliveryMethod === "delivery" ? (
                <>
                  Delivery to my address
                  {order.addressText ? (
                    <span className="block text-xs font-normal text-muted">{order.addressText}</span>
                  ) : null}
                </>
              ) : (
                "I will pick up"
              )
            }
          />
          <SummaryRow label="Your note" value={order.note || <span className="font-normal text-muted">None</span>} />
          <SummaryRow
            label="Type"
            value={order.kind === "instant" ? "Order now" : "Request for a future date"}
          />
        </dl>
      </CardBody>
    </Card>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { data: order, error } = useQuery(() => getOrder(id), [id]);
  const [tab, setTab] = useState<Tab>(params.get("tab") === "trace" ? "trace" : "details");

  useEffect(() => {
    setTab(params.get("tab") === "trace" ? "trace" : "details");
  }, [params]);

  if (error) {
    return (
      <>
        <ScreenHeader title="Order not found" backHref="/orders" />
        <Content>
          <EmptyState icon={X} title="This order no longer exists" />
        </Content>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <ScreenHeader title="Loading..." backHref="/orders" />
        <Content>
          <ListSkeleton rows={3} />
        </Content>
      </>
    );
  }

  const confirmedLess =
    order.confirmedKg !== null && order.confirmedKg < order.requestedKg && order.kind === "request";

  return (
    <>
      <ScreenHeader
        title={order.code}
        subtitle={`${cropLabel(order)} · ${quantityLabel(order)}`}
        backHref="/orders"
        action={<OrderStatusBadge status={order.status} method={order.deliveryMethod} />}
      >
        <Segmented
          tone="onGreen"
          value={tab}
          onChange={setTab}
          options={[
            { value: "details", label: "Details" },
            { value: "trace", label: "Traceability" },
          ]}
        />
      </ScreenHeader>

      <Content className="space-y-5">
        {tab === "details" ? (
          <>
            {confirmedLess ? (
              <Notice tone="warning">
                Confirmed {formatNumber(order.confirmedKg)} kg of {formatNumber(order.requestedKg)} kg requested.
              </Notice>
            ) : null}

            <div>
              <SectionHeading title="Status" />
              <Card>
                <CardBody>
                  <StatusTimeline order={order} />
                </CardBody>
              </Card>
            </div>

            <PickupCard order={order} />

            {order.status === "delivered" || order.status === "completed" ? <FeedbackCard order={order} /> : null}

            <div>
              <SectionHeading title="Summary" />
              <Summary order={order} />
            </div>

            <div className="space-y-2.5">
              <ContactButton variant="secondary" block />
              <p className="text-center text-xs text-muted">Need to change or cancel an order? Contact ARG TECH.</p>
            </div>
          </>
        ) : (
          <TraceabilityTab order={order} />
        )}
      </Content>
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
