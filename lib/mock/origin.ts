import { PILOT_PROVINCE } from "../constants";
import { formatDaysAgo } from "../format";
import type { CropId, OriginSummary } from "../types";
import { LOT_TEMPLATES, type LotTemplate } from "./lots";

/**
 * Crop-level origin, derived from the crop's lot records rather than typed in, so it
 * always agrees with the lot cards a buyer sees after ordering. Output is plain words
 * (most, some, all): never counts, percentages, communes, exact dates or farm numbers.
 */

const MAX_DISTRICTS = 3;
const PICKED_NOTE = "Most picked within the last 14 days.";

/** Share of lots: "all" at 100%, "most" above half, otherwise "some". */
function amount(share: number) {
  if (share >= 0.999) return "all";
  if (share > 0.5) return "most";
  return "some";
}

const share = (lots: LotTemplate[], pick: (l: LotTemplate) => boolean) =>
  lots.filter(pick).length / lots.length;

function districtsOf(lots: LotTemplate[]) {
  const counts = new Map<string, number>();
  for (const l of lots) counts.set(l.district, (counts.get(l.district) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_DISTRICTS)
    .map(([district]) => district);
}

function methodOf(lots: LotTemplate[]) {
  const conventional = share(lots, (l) => l.productionMethod.startsWith("Conventional"));
  return conventional >= 0.6 ? "Mostly conventional" : "Mixed methods";
}

function fertilizerOf(lots: LotTemplate[]) {
  const chemical = share(lots, (l) => /npk/i.test(l.fertilizer));
  const organic = share(lots, (l) => /compost/i.test(l.fertilizer));
  if (organic === 0) return "Mostly chemical fertilizer";
  if (chemical === 0) return "Mostly organic fertilizer";
  if (chemical - organic >= 0.25 - 1e-9) return "Mostly chemical fertilizer, some organic";
  if (organic - chemical >= 0.25 - 1e-9) return "Mostly organic fertilizer, some chemical";
  return "Mix of organic and chemical fertilizer";
}

function pesticideOf(lots: LotTemplate[]) {
  const used = share(lots, (l) => !/^none/i.test(l.pesticide));
  return used === 0 ? "No pesticide reported" : `Pesticide used on ${amount(used)} lots`;
}

function certificatesOf(lots: LotTemplate[]) {
  const withCertificate = lots.filter((l) => l.certificate);
  if (withCertificate.length === 0) return "None on record";
  const types = [...new Set(withCertificate.map((l) => l.certificate!.typeShort))];
  const typeWords = types.length === 1 ? types[0] : `${types.slice(0, -1).join(", ")} and ${types[types.length - 1]}`;
  return `${typeWords} on ${amount(withCertificate.length / lots.length)} lots`;
}

export function deriveOrigin(cropId: CropId, lastPickedAt: string): OriginSummary {
  const lots = LOT_TEMPLATES[cropId];
  return {
    province: PILOT_PROVINCE,
    districts: districtsOf(lots),
    method: methodOf(lots),
    inputs: `${fertilizerOf(lots)}. ${pesticideOf(lots)}.`,
    picked: `Last picked ${formatDaysAgo(lastPickedAt)}`,
    pickedNote: PICKED_NOTE,
    certificates: certificatesOf(lots),
  };
}
