import { STANDARD_OPTION } from "../constants";
import type { Crop, CropId, CropSpec, PriceTier } from "../types";

function tiers(under200: number, mid: number, large: number): PriceTier[] {
  return [
    { minKg: 0, maxKg: 199, pricePerKg: under200 },
    { minKg: 200, maxKg: 999, pricePerKg: mid },
    { minKg: 1000, maxKg: null, pricePerKg: large },
  ];
}

const S = STANDARD_OPTION;
const STANDARD_SIZES = [S, "Small", "Medium", "Large"];

function spec(
  ripeness: string,
  size: string,
  condition: string,
  bestUsedWithinDays: number,
  chips: string[],
  ripenessExtras: string[] = [],
  sizeOptions: string[] = [S],
): CropSpec {
  return {
    ripeness,
    size,
    condition,
    bestUsedWithinDays,
    chips,
    ripenessOptions: [S, ...ripenessExtras],
    sizeOptions,
  };
}

export const CROPS: Crop[] = [
  {
    id: "tomato",
    name: "Tomato",
    tiers: tiers(0.65, 0.6, 0.55),
    spec: spec(
      "Firm, mostly red-ripe",
      "Medium",
      "No cracks, rot or bruising",
      7,
      ["Firm", "Medium", "Red-ripe"],
      ["Firm and green", "Partly ripe", "Fully ripe"],
      STANDARD_SIZES,
    ),
  },
  {
    id: "cucumber",
    name: "Cucumber",
    tiers: tiers(0.5, 0.48, 0.45),
    spec: spec(
      "Firm, dark green",
      "Medium",
      "Straight, no soft spots or yellowing",
      5,
      ["Firm", "Medium", "Dark green"],
      ["Younger and smaller", "Fully grown"],
      STANDARD_SIZES,
    ),
  },
  {
    id: "long-bean",
    name: "Long bean",
    tiers: tiers(0.75, 0.7, 0.65),
    spec: spec("Tender, snaps cleanly", "Medium length", "No spots or overgrown pods", 4, ["Tender", "Medium"]),
  },
  {
    id: "morning-glory",
    name: "Morning glory",
    tiers: tiers(0.38, 0.35, 0.32),
    spec: spec("Fresh, tender leaves", "Standard bundle", "No yellowing or wilting", 2, ["Fresh", "Tender"]),
  },
  {
    id: "chili",
    name: "Chili",
    tiers: tiers(1.3, 1.2, 1.1),
    spec: spec("Fully colored", "Standard", "No soft spots or shriveling", 7, ["Fully colored"]),
  },
  {
    id: "cabbage",
    name: "Cabbage",
    tiers: tiers(0.45, 0.42, 0.4),
    spec: spec(
      "Firm, compact heads",
      "Medium to large",
      "No split heads or damaged outer leaves",
      14,
      ["Compact", "Medium to large"],
      ["Smaller heads", "Larger heads"],
      STANDARD_SIZES,
    ),
  },
  {
    id: "eggplant",
    name: "Eggplant",
    tiers: tiers(0.6, 0.55, 0.5),
    spec: spec(
      "Firm, glossy",
      "Medium",
      "No blemishes or soft spots",
      7,
      ["Firm", "Glossy", "Medium"],
      [],
      STANDARD_SIZES,
    ),
  },
];

export function getCrop(id: string): Crop | undefined {
  return CROPS.find((c) => c.id === id);
}

export function requireCrop(id: string): Crop {
  const crop = getCrop(id);
  if (!crop) throw new Error(`Unknown crop ${id}`);
  return crop;
}

export const CROP_IDS: CropId[] = CROPS.map((c) => c.id);

/** "Firm, mostly red-ripe · Medium · No cracks, rot or bruising" */
export function specSummary(crop: Crop) {
  return [crop.spec.ripeness, crop.spec.size, crop.spec.condition].join(" · ");
}
