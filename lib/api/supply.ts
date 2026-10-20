import { delay, getState, NotFoundError } from "../db";
import { PILOT_PROVINCE } from "../constants";
import { CROPS, getCrop } from "../mock/catalog";
import { deriveOrigin } from "../mock/origin";
import { lowestPrice } from "../pricing";
import type { Crop, CropId, OriginSummary } from "../types";

export interface SupplyItem {
  crop: Crop;
  availableKg: number;
  /** ISO date of the most recent pick. */
  lastPickedAt: string;
  /** Lowest tier price per kg. */
  fromPrice: number;
  /** e.g. "Grown in Kampong Cham" */
  originLine: string;
  /** Crop-level origin for the detail screen, derived from the crop's lot records. */
  origin: OriginSummary;
}

function toItem(crop: Crop): SupplyItem {
  const record = getState().supply[crop.id];
  return {
    crop,
    availableKg: record.availableKg,
    lastPickedAt: record.lastPickedAt,
    fromPrice: lowestPrice(crop),
    originLine: `Grown in ${PILOT_PROVINCE}`,
    origin: deriveOrigin(crop.id, record.lastPickedAt),
  };
}

/** All crops, in-stock first. Only crop-level facts: never farmers or farm counts. */
export async function listSupply(filter?: { search?: string; cropId?: CropId | "all" }) {
  const search = filter?.search?.trim().toLowerCase() ?? "";
  const items = CROPS.filter((c) => {
    if (filter?.cropId && filter.cropId !== "all" && c.id !== filter.cropId) return false;
    return !search || c.name.toLowerCase().includes(search);
  }).map(toItem);

  items.sort((a, b) => Number(b.availableKg > 0) - Number(a.availableKg > 0));
  return delay(items);
}

export async function getSupplyItem(cropId: string) {
  const crop = getCrop(cropId);
  if (!crop) throw new NotFoundError("Crop", cropId);
  return delay(toItem(crop));
}

/** Crops that can be ordered right now (available > 0). */
export async function listOrderableCrops() {
  return delay(CROPS.map(toItem).filter((item) => item.availableKg > 0));
}

/** Every crop with its current stock, for the request form. */
export async function listAllCrops() {
  return delay(CROPS.map(toItem));
}
