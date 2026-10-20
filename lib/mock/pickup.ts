import type { Pickup, PickupPoint } from "../types";

/**
 * SAMPLE meeting points. In the real product these come from the Admin Portal's pickup
 * point list. They are never farms.
 */
export const SAMPLE_PICKUP_POINTS: PickupPoint[] = [
  {
    name: "Kang Meas sample meeting point",
    district: "Kang Meas",
    landmark: "Next to the market gate (sample)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kang+Meas+Kampong+Cham",
  },
  {
    name: "Srey Santhor sample meeting point",
    district: "Srey Santhor",
    landmark: "Beside the pagoda gate (sample)",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Srey+Santhor+Kampong+Cham",
  },
];

export const SAMPLE_TIME_WINDOWS = ["8:00 to 10:00", "10:00 to 12:00", "14:00 to 16:00"];

export function emptyPickup(collectorName = "", collectorPhone = ""): Pickup {
  return { point: null, date: null, timeWindow: null, collectorName, collectorPhone };
}
