import { FORECAST_WEEKS } from "../constants";
import { delay } from "../db";
import { addDaysISO, todayISO, weekStartISO } from "../format";
import { CROPS } from "../mock/catalog";
import { FORECAST_WEEKLY_KG } from "../mock/forecast";
import type { Crop, CropId } from "../types";

export interface ForecastWeek {
  /** Monday of the week (ISO date). */
  weekStart: string;
  byCrop: Record<CropId, number>;
  totalKg: number;
}

export interface Forecast {
  crops: Crop[];
  weeks: ForecastWeek[];
}

function buildWeeks(): ForecastWeek[] {
  const first = weekStartISO(todayISO());
  return Array.from({ length: FORECAST_WEEKS }, (_, i) => {
    const byCrop = {} as Record<CropId, number>;
    let totalKg = 0;
    for (const crop of CROPS) {
      const kg = FORECAST_WEEKLY_KG[crop.id][i] ?? 0;
      byCrop[crop.id] = kg;
      totalKg += kg;
    }
    return { weekStart: addDaysISO(first, i * 7), byCrop, totalKg };
  });
}

/** Both the list and calendar views read from this one source. */
export async function getForecast(): Promise<Forecast> {
  return delay({ crops: CROPS, weeks: buildWeeks() });
}

/**
 * Cumulative expected kg (estimate) for a crop from now until the end of the week
 * that contains `dateISO`.
 */
export async function getExpectedByDate(cropId: CropId, dateISO: string) {
  const weekStart = weekStartISO(dateISO);
  const kg = buildWeeks()
    .filter((w) => w.weekStart <= weekStart)
    .reduce((sum, w) => sum + (w.byCrop[cropId] ?? 0), 0);
  return delay(kg, 40);
}

/** A sensible default needed-by date: the first week with expected supply, never before tomorrow. */
export function pickSuggestedDate(weeks: ForecastWeek[], cropId: CropId) {
  const tomorrow = addDaysISO(todayISO(), 1);
  const week = weeks.find((w) => (w.byCrop[cropId] ?? 0) > 0);
  return week && week.weekStart > tomorrow ? week.weekStart : tomorrow;
}

export async function getSuggestedDate(cropId: CropId) {
  return delay(pickSuggestedDate(buildWeeks(), cropId), 20);
}
