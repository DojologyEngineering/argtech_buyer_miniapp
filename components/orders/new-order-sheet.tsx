"use client";

import Link from "next/link";
import { CalendarPlus, ChevronRight, PackageSearch, Zap } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { REQUEST_REPLY_HOURS } from "@/lib/constants";

/** The two ways to buy: instant order from stock, or a request for a future date. */
export function NewOrderSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const choices = [
    {
      href: "/orders/new",
      icon: Zap,
      title: "Order now",
      text: "Produce that is already harvested. Price is set by quantity and your order is confirmed instantly.",
    },
    {
      href: "/orders/request",
      icon: CalendarPlus,
      title: "Request for a future date",
      text: `Produce that is expected soon. ARG TECH reviews your request and replies within ${REQUEST_REPLY_HOURS} hours.`,
    },
    {
      href: "/orders/request?crop=other",
      icon: PackageSearch,
      title: "Request a different crop",
      text: "Need a crop that isn't listed? Tell us what you need and ARG TECH will check if we can supply it.",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="New order">
      <div className="space-y-2.5">
        {choices.map(({ href, icon: Icon, title, text }) => (
          <Link
            key={href}
            href={href}
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-2xl border border-line p-3.5 active:bg-canvas"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink">{title}</span>
              <span className="mt-0.5 block text-xs text-muted">{text}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted/70" />
          </Link>
        ))}
      </div>
    </Sheet>
  );
}
