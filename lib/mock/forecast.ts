import type { CropId } from "../types";

/**
 * Expected kg per crop for the next 6 weeks. Index 0 is the current week
 * (Monday start), so the numbers stay lined up with the calendar over time.
 * These are estimates — the UI labels them as such.
 */
export const FORECAST_WEEKLY_KG: Record<CropId, number[]> = {
  tomato: [700, 500, 350, 200, 0, 150],
  cucumber: [0, 300, 400, 250, 0, 0],
  "long-bean": [200, 0, 150, 300, 250, 0],
  "morning-glory": [0, 0, 120, 260, 300, 180],
  chili: [0, 0, 150, 250, 300, 200],
  cabbage: [400, 0, 0, 350, 450, 300],
  eggplant: [0, 100, 0, 0, 200, 250],
};
