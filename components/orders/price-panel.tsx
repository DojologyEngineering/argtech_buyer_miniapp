import { TrendingDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { nextTierHint, tierFor, tierLabel, totalPrice } from "@/lib/pricing";
import type { Crop } from "@/lib/types";

/** Live price for the chosen quantity: tier, per-kg price, upsell hint, and the total. */
export function LivePricePanel({
  crop,
  quantityKg,
  indicative = false,
}: {
  crop: Crop | undefined;
  quantityKg: number;
  /** For requests: the price is a guide, not the final price. */
  indicative?: boolean;
}) {
  if (!crop || quantityKg <= 0) {
    return (
      <Card className="border-dashed bg-canvas shadow-none">
        <CardBody className="py-5 text-center text-sm text-muted">
          Choose a crop and quantity to see the price.
        </CardBody>
      </Card>
    );
  }

  const tier = tierFor(crop.tiers, quantityKg);
  const hint = nextTierHint(crop, quantityKg);
  const total = totalPrice(quantityKg, tier.pricePerKg);

  return (
    <Card className="border-brand-200 bg-brand-50/60">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">{indicative ? "Indicative price per kg" : "Price per kg"}</p>
            <p className="text-lg font-extrabold leading-tight text-ink">
              {formatCurrency(tier.pricePerKg)}
              <span className="text-sm font-semibold text-muted">/kg</span>
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {tierLabel(tier)}
          </p>
        </div>

        {hint ? (
          <p className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs text-brand-800">
            <TrendingDown className="mt-0.5 size-4 shrink-0" />
            <span>
              Order {formatNumber(hint.missingKg)} kg more to get {formatCurrency(hint.pricePerKg)}/kg
            </span>
          </p>
        ) : null}

        <div className="border-t border-brand-200 pt-3">
          <p className="text-xs text-muted">
            {indicative ? "Indicative total" : "Total price"} ({formatNumber(quantityKg)} kg ×{" "}
            {formatCurrency(tier.pricePerKg)})
          </p>
          <p className="text-3xl font-extrabold leading-tight text-brand-700">{formatCurrency(total)}</p>
        </div>

        {indicative ? (
          <p className="text-xs text-muted">Indicative price. ARG TECH confirms the final price.</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
