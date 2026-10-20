import { Badge, type BadgeTone } from "@/components/ui/misc";
import { statusLabel } from "@/lib/format";
import type { DeliveryMethod, OrderStatus } from "@/lib/types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  delivered: "Delivered",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  requested: "amber",
  confirmed: "blue",
  delivered: "green",
  completed: "solid",
  declined: "red",
  cancelled: "neutral",
};

/** Tile colours for the icon beside an order, matching the badge. */
export const STATUS_TILE: Record<OrderStatus, string> = {
  requested: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  delivered: "bg-brand-50 text-brand-600",
  completed: "bg-brand-600 text-white",
  declined: "bg-red-50 text-red-600",
  cancelled: "bg-canvas text-muted",
};

/** Pass `method` so a delivered pickup order reads "Picked up". */
export function OrderStatusBadge({
  status,
  method,
  className,
}: {
  status: OrderStatus;
  method?: DeliveryMethod;
  className?: string;
}) {
  return (
    <Badge tone={STATUS_TONE[status]} dot className={className}>
      {statusLabel(status, method)}
    </Badge>
  );
}
