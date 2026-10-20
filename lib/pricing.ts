import { NEAR_TIER_RATIO } from "./constants";
import { formatNumber } from "./format";
import type { Crop, PriceTier } from "./types";

/** Tier that applies to `quantityKg`. The price applies to the whole quantity. */
export function tierFor(tiers: PriceTier[], quantityKg: number): PriceTier {
  const q = Math.max(quantityKg, 0);
  return (
    [...tiers].reverse().find((tier) => q >= tier.minKg) ?? tiers[0]
  );
}

export function pricePerKgFor(crop: Crop, quantityKg: number) {
  return tierFor(crop.tiers, quantityKg).pricePerKg;
}

export function lowestPrice(crop: Crop) {
  return Math.min(...crop.tiers.map((t) => t.pricePerKg));
}

export function totalPrice(quantityKg: number, pricePerKg: number) {
  return Math.round(quantityKg * pricePerKg * 100) / 100;
}

export function tierLabel(tier: PriceTier) {
  if (tier.minKg <= 0 || tier.minKg === 1) {
    return `Under ${formatNumber((tier.maxKg ?? 0) + 1)} kg`;
  }
  if (tier.maxKg === null) return `${formatNumber(tier.minKg)} kg and above`;
  return `${formatNumber(tier.minKg)} to ${formatNumber(tier.maxKg)} kg`;
}

/** Hint like "Order 150 kg more to get $0.55/kg" when the next tier is close. */
export function nextTierHint(crop: Crop, quantityKg: number) {
  if (quantityKg <= 0) return null;
  const current = tierFor(crop.tiers, quantityKg);
  const next = crop.tiers.find((t) => t.minKg > current.minKg);
  if (!next) return null;
  const missing = next.minKg - quantityKg;
  if (missing > next.minKg * NEAR_TIER_RATIO) return null;
  return { missingKg: missing, pricePerKg: next.pricePerKg };
}
