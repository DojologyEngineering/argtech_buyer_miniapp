import { formatCurrency } from "@/lib/format";
import { tierFor, tierLabel } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { PriceTier } from "@/lib/types";

/** Price per kg by quantity band. The price applies to the whole order quantity. */
export function PriceTierTable({
  tiers,
  highlightKg,
}: {
  tiers: PriceTier[];
  /** Quantity to highlight the matching band for (order form). */
  highlightKg?: number;
}) {
  const active = highlightKg && highlightKg > 0 ? tierFor(tiers, highlightKg) : null;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line">
        {tiers.map((tier, i) => {
          const isActive = active === tier;
          return (
            <div
              key={tier.minKg}
              className={cn(
                "flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm",
                i > 0 && "border-t border-line",
                isActive ? "bg-brand-50 font-semibold text-brand-800" : "text-ink",
              )}
            >
              <span>{tierLabel(tier)}</span>
              <span className="font-bold">{formatCurrency(tier.pricePerKg)}/kg</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">The price for your quantity applies to the whole order.</p>
    </div>
  );
}
