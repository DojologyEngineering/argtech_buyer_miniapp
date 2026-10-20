import { PILOT_PROVINCE } from "../constants";
import { daysFromToday } from "../format";
import type { CropId, FieldActivity, Lot, LotCertificate } from "../types";
import { requireCrop } from "./catalog";

/**
 * Mock lot inventory. Each template stands for one crop cycle; an order's lot is
 * the template plus the kilograms allocated to that order. Dates are stored as
 * "days ago" so the data stays fresh whenever the demo is opened.
 */
export interface LotTemplate {
  code: string;
  province: string;
  district: string;
  commune: string;
  variety: string;
  plantedDaysAgo: number;
  /** Days ago for each pick, any order. */
  harvestDaysAgo: number[];
  productionMethod: string;
  fertilizer: string;
  pesticide: string;
  certificate?: LotCertificate;
}

const PROVINCE = PILOT_PROVINCE;
const SAMPLE_IMAGE = "/sample-certificate.svg";

/** Sample certificate. Real ones are uploaded by staff as a buyer-safe copy. */
function gap(
  scope: string,
  expiry: string,
  sharing: LotCertificate["sharing"],
  imageUrl?: string,
): LotCertificate {
  return {
    type: "Good Agricultural Practices (GAP)",
    typeShort: "GAP",
    issuer: "Sample issuer",
    scope,
    expiry,
    sharing,
    imageUrl,
  };
}
const CONV = "Conventional";
const MIXED = "Mixed (conventional with organic inputs)";

function t(
  code: string,
  province: string,
  district: string,
  commune: string,
  variety: string,
  plantedDaysAgo: number,
  harvestDaysAgo: number[],
  productionMethod: string,
  fertilizer: string,
  pesticide: string,
  certificate?: LotTemplate["certificate"],
): LotTemplate {
  return {
    code,
    province,
    district,
    commune,
    variety,
    plantedDaysAgo,
    harvestDaysAgo,
    productionMethod,
    fertilizer,
    pesticide,
    certificate,
  };
}

export const LOT_TEMPLATES: Record<CropId, LotTemplate[]> = {
  tomato: [
    t("A-014", PROVINCE, "Kang Meas", "Angkor Ban", "Local red tomato", 88, [14, 12, 10, 8], CONV, "NPK compound and compost", "Yes: insecticide (2 sprays)"),
    t("A-022", PROVINCE, "Kang Meas", "Chrey Vien", "Hybrid round tomato", 84, [11, 9, 7, 5], MIXED, "Compost and NPK compound", "Yes: fungicide (1 spray)", gap("Tomato production", "2027-06-30", "details_and_image", SAMPLE_IMAGE)),
    t("A-031", PROVINCE, "Srey Santhor", "Baray", "Local red tomato", 80, [8, 6, 4, 3], CONV, "NPK compound", "Yes: insecticide (3 sprays)", gap("Tomato production", "2027-03-15", "details")),
    t("A-038", PROVINCE, "Kang Meas", "Peam Chileang", "Hybrid round tomato", 74, [4, 3, 2, 1], CONV, "NPK compound and compost", "None reported"),
  ],
  cucumber: [
    t("B-107", PROVINCE, "Kang Meas", "Ampil", "Green slicing cucumber", 52, [13, 11, 9], CONV, "NPK compound", "Yes: insecticide (2 sprays)"),
    t("B-112", PROVINCE, "Kang Meas", "Angkor Ban", "Green slicing cucumber", 49, [9, 7, 5], CONV, "NPK compound", "Yes: fungicide (1 spray)"),
    t("B-119", PROVINCE, "Kampong Siem", "Kaoh Mitt", "Long green cucumber", 46, [5, 3, 2], CONV, "NPK compound", "None reported"),
  ],
  "long-bean": [
    t("C-201", PROVINCE, "Srey Santhor", "Baray", "Green long bean", 58, [12, 10, 8], MIXED, "Compost and NPK compound", "None reported"),
    t("C-208", PROVINCE, "Srey Santhor", "Preaek Dambouk", "Green long bean", 55, [8, 6, 4], CONV, "NPK compound", "Yes: insecticide (2 sprays)"),
    t("C-215", PROVINCE, "Srey Santhor", "Ruessei Srok", "Yard-long bean", 51, [4, 3, 2], MIXED, "Compost", "None reported"),
  ],
  "morning-glory": [
    t("E-401", PROVINCE, "Kang Meas", "Angkor Ban", "Water spinach", 28, [10, 7, 5], MIXED, "Compost", "None reported"),
    t("E-406", PROVINCE, "Kang Meas", "Ampil", "Water spinach", 26, [7, 5, 3], CONV, "NPK compound", "Yes: insecticide (1 spray)"),
    t("E-413", PROVINCE, "Kampong Siem", "Rumchek", "Water spinach", 24, [3, 2, 1], MIXED, "Compost", "None reported"),
  ],
  chili: [
    t("F-501", PROVINCE, "Kang Meas", "Chrey Vien", "Red hot chili", 96, [13, 10, 7], CONV, "NPK compound", "Yes: insecticide (3 sprays)"),
    t("F-507", PROVINCE, "Kang Meas", "Peam Chileang", "Red hot chili", 92, [9, 6, 4], CONV, "Compost and NPK compound", "Yes: fungicide (2 sprays)", gap("Chili production", "2027-01-20", "details")),
    t("F-514", PROVINCE, "Srey Santhor", "Ruessei Srok", "Green finger chili", 88, [5, 3, 1], MIXED, "Compost", "Yes: insecticide (1 spray)"),
  ],
  cabbage: [
    t("D-302", PROVINCE, "Kang Meas", "Angkor Ban", "Round green cabbage", 66, [14, 11, 9], CONV, "NPK compound and compost", "Yes: insecticide (2 sprays)"),
    t("D-309", PROVINCE, "Kang Meas", "Ampil", "Round green cabbage", 62, [10, 8, 6], CONV, "NPK compound", "Yes: insecticide (3 sprays)", gap("Cabbage production", "2027-08-31", "hidden")),
    t("D-317", PROVINCE, "Kampong Siem", "Kaoh Mitt", "Flat-head cabbage", 58, [6, 4, 2], MIXED, "NPK compound and compost", "None reported"),
  ],
  eggplant: [
    t("G-601", PROVINCE, "Kang Meas", "Chrey Vien", "Long purple eggplant", 74, [13, 10, 8], MIXED, "Compost and NPK compound", "Yes: insecticide (2 sprays)"),
    t("G-608", PROVINCE, "Kang Meas", "Peam Chileang", "Long purple eggplant", 70, [9, 7, 5], CONV, "NPK compound", "Yes: insecticide (3 sprays)"),
    t("G-615", PROVINCE, "Srey Santhor", "Baray", "Round green eggplant", 66, [5, 3, 1], CONV, "NPK compound and compost", "Yes: fungicide (1 spray)"),
  ],
};

/** Irrigation and fertilization events between planting and the first pick. */
function buildActivities(tpl: LotTemplate, shiftDays: number): FieldActivity[] {
  const firstPickAgo = Math.max(...tpl.harvestDaysAgo);
  const span = Math.max(tpl.plantedDaysAgo - firstPickAgo, 10);
  const at = (offset: number) => daysFromToday(-(tpl.plantedDaysAgo - offset + shiftDays));
  const organic = tpl.fertilizer.toLowerCase().startsWith("compost");
  const fertNote = organic ? "Compost applied" : "NPK compound applied";

  const events: FieldActivity[] = [
    { date: at(3), type: "irrigation", note: "Irrigated after planting" },
    { date: at(Math.round(span * 0.25)), type: "fertilization", note: fertNote },
    { date: at(Math.round(span * 0.4)), type: "irrigation", note: "Irrigated" },
    { date: at(Math.round(span * 0.55)), type: "fertilization", note: "Top-dressing applied" },
    { date: at(Math.round(span * 0.8)), type: "irrigation", note: "Irrigated" },
  ];
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** Builds the buyer-facing lot. `shiftDays` moves every date into the past (older orders). */
export function resolveLot(cropId: CropId, tpl: LotTemplate, quantityKg: number, shiftDays = 0): Lot {
  return {
    code: tpl.code,
    quantityKg,
    province: tpl.province,
    district: tpl.district,
    commune: tpl.commune,
    crop: requireCrop(cropId).name,
    variety: tpl.variety,
    plantingDate: daysFromToday(-(tpl.plantedDaysAgo + shiftDays)),
    harvestDates: [...tpl.harvestDaysAgo]
      .sort((a, b) => b - a)
      .map((d) => daysFromToday(-(d + shiftDays))),
    productionMethod: tpl.productionMethod,
    fertilizer: tpl.fertilizer,
    pesticide: tpl.pesticide,
    activities: buildActivities(tpl, shiftDays),
    certificates: tpl.certificate ? [{ ...tpl.certificate }] : [],
  };
}

/** Oldest first harvest first. */
function byOldestHarvest(a: LotTemplate, b: LotTemplate) {
  return Math.max(...b.harvestDaysAgo) - Math.max(...a.harvestDaysAgo);
}

/** Share of the order each successive lot takes. */
const SPLIT_WEIGHTS = [0.45, 0.33, 0.22];

function lotCountFor(quantityKg: number) {
  if (quantityKg < 150) return 1;
  if (quantityKg < 600) return 2;
  return 3;
}

/**
 * Mock auto-assignment: split the quantity across one to three lots, oldest
 * harvest first. A real backend would draw from actual unsold lot inventory.
 */
export function assignLots(cropId: CropId, quantityKg: number, shiftDays = 0): Lot[] {
  const templates = [...LOT_TEMPLATES[cropId]].sort(byOldestHarvest);
  const count = Math.min(lotCountFor(quantityKg), templates.length);
  const weights = SPLIT_WEIGHTS.slice(0, count);
  const total = weights.reduce((sum, w) => sum + w, 0);

  let assigned = 0;
  return templates.slice(0, count).map((tpl, index) => {
    const isLast = index === count - 1;
    const kg = isLast ? quantityKg - assigned : Math.round((quantityKg * weights[index]) / total);
    assigned += kg;
    return resolveLot(cropId, tpl, kg, shiftDays);
  });
}

/** Builds lots with exact, hand-picked quantities (used by the seed story). */
export function lotsWithQuantities(
  cropId: CropId,
  quantities: { code: string; kg: number }[],
  shiftDays = 0,
): Lot[] {
  return quantities.map(({ code, kg }) => {
    const tpl = LOT_TEMPLATES[cropId].find((x) => x.code === code);
    if (!tpl) throw new Error(`Unknown lot ${code}`);
    return resolveLot(cropId, tpl, kg, shiftDays);
  });
}

/** Lot for a crop that is not in the catalog (confirmed from an "Other crop" request). */
export function otherCropLot(cropName: string, quantityKg: number): Lot {
  const tpl = t("Z-701", PROVINCE, "Kang Meas", "Angkor Ban", "Not specified", 60, [8, 6, 4], CONV, "Compost and NPK compound", "None reported");
  return { ...resolveLot("tomato", tpl, quantityKg), crop: cropName };
}

/**
 * Lots that exist only in the seeded story (the pickup orders). They are kept out of
 * LOT_TEMPLATES on purpose so they do not change the crop-level origin summaries.
 */
const STORY_LOT_TEMPLATES: Record<string, { cropId: CropId; template: LotTemplate }> = {
  "A-041": {
    cropId: "long-bean",
    template: t("A-041", PROVINCE, "Srey Santhor", "Preaek Dambouk", "Green long bean", 55, [6, 5, 4], MIXED, "Compost and NPK compound", "None reported"),
  },
  "A-052": {
    cropId: "cucumber",
    template: t("A-052", PROVINCE, "Kang Meas", "Angkor Ban", "Green slicing cucumber", 47, [7, 6, 4], CONV, "NPK compound", "Yes: insecticide (2 sprays)"),
  },
};

export function storyLot(code: string, quantityKg: number): Lot {
  const entry = STORY_LOT_TEMPLATES[code];
  if (!entry) throw new Error(`Unknown story lot ${code}`);
  return resolveLot(entry.cropId, entry.template, quantityKg);
}
