"use client";

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { EmptyState, FilterChips, ListSkeleton } from "@/components/ui/misc";
import { OrderCard } from "@/components/orders/order-card";
import { NewOrderSheet } from "@/components/orders/new-order-sheet";
import { STATUS_LABEL } from "@/components/orders/status";
import { useQuery } from "@/lib/hooks/use-query";
import { listOrders } from "@/lib/api/orders";
import type { OrderStatus } from "@/lib/types";

type Filter = OrderStatus | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: STATUS_LABEL.requested },
  { value: "confirmed", label: STATUS_LABEL.confirmed },
  { value: "delivered", label: STATUS_LABEL.delivered },
  { value: "completed", label: STATUS_LABEL.completed },
  { value: "declined", label: STATUS_LABEL.declined },
  { value: "cancelled", label: STATUS_LABEL.cancelled },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const { data: orders, loading } = useQuery(() => listOrders({ status: filter }), [filter]);

  return (
    <>
      <ScreenHeader
        title="My orders"
        subtitle="Orders and requests"
        action={
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
          >
            <Plus className="size-4" />
            New
          </button>
        }
      />

      <Content withNav className="space-y-3">
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

        {loading && !orders ? <ListSkeleton /> : null}

        {orders?.map((order) => <OrderCard key={order.id} order={order} />)}

        {orders && orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filter === "all" ? "No orders yet" : `No ${STATUS_LABEL[filter as OrderStatus].toLowerCase()} orders`}
            description={
              filter === "all"
                ? "Order produce that is available now, or request it for a future date."
                : "Try another status."
            }
          />
        ) : null}
      </Content>

      <NewOrderSheet open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}
