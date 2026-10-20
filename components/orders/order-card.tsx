import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge, STATUS_TILE } from "./status";
import { cropLabel, type OrderView } from "@/lib/api/orders";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** "400 kg" once confirmed, "400 of 500 kg" when staff confirmed less than requested. */
export function quantityLabel(order: OrderView) {
  if (order.confirmedKg !== null && order.confirmedKg !== order.requestedKg) {
    return `${formatNumber(order.confirmedKg)} of ${formatNumber(order.requestedKg)} kg`;
  }
  return `${formatNumber(order.confirmedKg ?? order.requestedKg)} kg`;
}

export function dateLabel(order: OrderView) {
  const open = order.status === "requested" || order.status === "declined";
  if (open) return "Needed by";
  return order.deliveryMethod === "pickup" ? "Pickup" : "Delivery";
}

export function OrderCard({ order }: { order: OrderView }) {
  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card className="p-3.5 active:bg-canvas">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              STATUS_TILE[order.status],
            )}
          >
            <Package className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[15px] font-bold text-ink">{order.code}</p>
              <OrderStatusBadge status={order.status} method={order.deliveryMethod} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              <span className="font-medium text-ink">{cropLabel(order)}</span> · {quantityLabel(order)}
            </p>
            <p className="truncate text-xs text-muted">
              {dateLabel(order)} {formatDate(order.neededBy)}
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted/70" />
        </div>
      </Card>
    </Link>
  );
}
