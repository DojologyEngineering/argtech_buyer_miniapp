import { daysFromToday } from "../format";
import type { Address, Buyer, CropId, Order, Session, SupplyRecord } from "../types";
import { requireCrop } from "./catalog";
import { lotsWithQuantities, storyLot } from "./lots";
import { SAMPLE_PICKUP_POINTS, emptyPickup } from "./pickup";

export const SEED_BUYER: Buyer = {
  companyName: "Fresh Market Ltd.",
  contactPerson: "Sophea Chan",
  phone: "+855 12 888 456",
  email: "sophea@freshmarket.example",
};

export const SEED_ADDRESSES: Address[] = [
  {
    id: "addr_main",
    label: "Main store",
    line: "No. 24, Street 278",
    district: "Boeng Keng Kang",
    city: "Phnom Penh",
  },
  {
    id: "addr_warehouse",
    label: "Warehouse",
    line: "No. 112, National Road 1",
    district: "Chbar Ampov",
    city: "Phnom Penh",
  },
];

export const SEED_SESSION: Session = { registered: true };

export const SEED_SUPPLY: Record<CropId, SupplyRecord> = {
  tomato: { availableKg: 1050, lastPickedAt: daysFromToday(-1) },
  cucumber: { availableKg: 620, lastPickedAt: daysFromToday(-2) },
  "long-bean": { availableKg: 300, lastPickedAt: daysFromToday(-2) },
  cabbage: { availableKg: 780, lastPickedAt: daysFromToday(-3) },
  "morning-glory": { availableKg: 0, lastPickedAt: daysFromToday(-9) },
  chili: { availableKg: 0, lastPickedAt: daysFromToday(-6) },
  eggplant: { availableKg: 0, lastPickedAt: daysFromToday(-8) },
};

/** Shared sequence: the next order or request gets number 12. */
export const SEED_NEXT_SEQ = 12;

const MAIN = SEED_ADDRESSES[0];
const WAREHOUSE = SEED_ADDRESSES[1];

function addressText(a: Address) {
  return `${a.label}, ${a.line}, ${a.district}, ${a.city}`;
}

function base(
  seq: number,
  cropId: CropId,
): Pick<Order, "id" | "seq" | "cropId" | "cropName" | "indicativePricePerKg"> {
  return {
    id: `ord_${seq}`,
    seq,
    cropId,
    cropName: requireCrop(cropId).name,
    indicativePricePerKg: 0,
  };
}

function indicative(cropId: CropId, kg: number) {
  const tiers = requireCrop(cropId).tiers;
  return [...tiers].reverse().find((t) => kg >= t.minKg)?.pricePerKg ?? tiers[0].pricePerKg;
}

export function buildSeedOrders(): Order[] {
  return [
    // Requested: a crop that is not in the catalog.
    {
      id: "ord_11",
      seq: 11,
      kind: "request",
      cropId: null,
      cropName: "Pumpkin",
      indicativePricePerKg: null,
      requestedKg: 150,
      confirmedKg: null,
      pricePerKg: null,
      neededBy: daysFromToday(21),
      deliveryMethod: "delivery",
      addressId: WAREHOUSE.id,
      addressText: addressText(WAREHOUSE),
      requirementsText: "Medium, firm, no cracks",
      note: "",
      status: "requested",
      createdAt: daysFromToday(0),
      history: [{ status: "requested", at: daysFromToday(0) }],
      lots: [],
    },
    // Requested: waiting for ARG TECH staff.
    {
      ...base(10, "chili"),
      indicativePricePerKg: indicative("chili", 200),
      kind: "request",
      requestedKg: 200,
      confirmedKg: null,
      pricePerKg: null,
      neededBy: daysFromToday(14),
      deliveryMethod: "delivery",
      addressId: MAIN.id,
      addressText: addressText(MAIN),
      requirements: { ripeness: "Standard", size: "Standard" },
      note: "Prefer a mix of red and green if possible.",
      status: "requested",
      createdAt: daysFromToday(-1),
      history: [{ status: "requested", at: daysFromToday(-1) }],
      lots: [],
    },
    // Confirmed: instant order, three lots.
    {
      ...base(9, "tomato"),
      indicativePricePerKg: indicative("tomato", 1000),
      kind: "instant",
      requestedKg: 1000,
      confirmedKg: 1000,
      pricePerKg: 0.55,
      neededBy: daysFromToday(3),
      deliveryMethod: "delivery",
      addressId: WAREHOUSE.id,
      addressText: addressText(WAREHOUSE),
      note: "Please call on arrival at the gate.",
      status: "confirmed",
      createdAt: daysFromToday(-2),
      history: [{ status: "confirmed", at: daysFromToday(-2) }],
      lots: lotsWithQuantities("tomato", [
        { code: "A-014", kg: 400 },
        { code: "A-022", kg: 350 },
        { code: "A-031", kg: 250 },
      ]),
    },
    // Confirmed pickup order, arranged (sample data).
    {
      ...base(4, "long-bean"),
      indicativePricePerKg: indicative("long-bean", 120),
      kind: "instant",
      requestedKg: 120,
      confirmedKg: 120,
      pricePerKg: 0.75,
      neededBy: daysFromToday(2),
      deliveryMethod: "pickup",
      addressId: null,
      addressText: null,
      pickup: {
        point: SAMPLE_PICKUP_POINTS[0],
        date: daysFromToday(2),
        timeWindow: "8:00 to 10:00",
        collectorName: "Dara Kim (sample)",
        collectorPhone: "+855 96 555 019",
      },
      note: "",
      status: "confirmed",
      createdAt: daysFromToday(-3),
      history: [{ status: "confirmed", at: daysFromToday(-3) }],
      lots: [storyLot("A-041", 120)],
    },
    // Confirmed pickup order, not arranged yet (sample data).
    {
      ...base(3, "cucumber"),
      indicativePricePerKg: indicative("cucumber", 150),
      kind: "instant",
      requestedKg: 150,
      confirmedKg: 150,
      pricePerKg: 0.5,
      neededBy: daysFromToday(5),
      deliveryMethod: "pickup",
      addressId: null,
      addressText: null,
      pickup: emptyPickup(),
      note: "",
      status: "confirmed",
      createdAt: daysFromToday(-4),
      history: [{ status: "confirmed", at: daysFromToday(-4) }],
      lots: [storyLot("A-052", 150)],
    },
    // Picked up: a request that was confirmed for less than asked (sample pickup data).
    {
      ...base(8, "cucumber"),
      indicativePricePerKg: indicative("cucumber", 500),
      kind: "request",
      requestedKg: 500,
      confirmedKg: 400,
      pricePerKg: 0.48,
      neededBy: daysFromToday(-3),
      deliveryMethod: "pickup",
      addressId: null,
      addressText: null,
      pickup: {
        point: SAMPLE_PICKUP_POINTS[0],
        date: daysFromToday(-3),
        timeWindow: "8:00 to 10:00",
        collectorName: "Vannak Sok (sample)",
        collectorPhone: "+855 12 777 321",
      },
      handover: { receivedKg: 400, acceptedKg: 380, rejectedKg: 20, rejectReason: "Cracks or damage" },
      requirements: { ripeness: "Standard", size: "Standard" },
      note: "",
      status: "delivered",
      createdAt: daysFromToday(-9),
      history: [
        { status: "requested", at: daysFromToday(-9) },
        { status: "confirmed", at: daysFromToday(-7) },
        { status: "delivered", at: daysFromToday(-3) },
      ],
      lots: lotsWithQuantities(
        "cucumber",
        [
          { code: "B-107", kg: 250 },
          { code: "B-112", kg: 150 },
        ],
        8,
      ),
    },
    // Completed.
    {
      ...base(7, "cabbage"),
      indicativePricePerKg: indicative("cabbage", 300),
      kind: "instant",
      requestedKg: 300,
      confirmedKg: 300,
      pricePerKg: 0.42,
      neededBy: daysFromToday(-18),
      deliveryMethod: "delivery",
      addressId: MAIN.id,
      addressText: addressText(MAIN),
      note: "",
      status: "completed",
      createdAt: daysFromToday(-22),
      history: [
        { status: "confirmed", at: daysFromToday(-22) },
        { status: "delivered", at: daysFromToday(-18) },
        { status: "completed", at: daysFromToday(-16) },
      ],
      lots: lotsWithQuantities(
        "cabbage",
        [
          { code: "D-302", kg: 180 },
          { code: "D-309", kg: 120 },
        ],
        22,
      ),
    },
    // Declined request.
    {
      ...base(6, "morning-glory"),
      indicativePricePerKg: indicative("morning-glory", 150),
      kind: "request",
      requestedKg: 150,
      confirmedKg: null,
      pricePerKg: null,
      neededBy: daysFromToday(4),
      deliveryMethod: "pickup",
      addressId: null,
      addressText: null,
      requirements: { ripeness: "Standard", size: "Standard" },
      note: "",
      status: "declined",
      createdAt: daysFromToday(-12),
      history: [
        { status: "requested", at: daysFromToday(-12) },
        { status: "declined", at: daysFromToday(-11) },
      ],
      declineReason: "Not enough supply for your date",
      lots: [],
    },
    // Cancelled by staff after confirmation.
    {
      ...base(5, "eggplant"),
      indicativePricePerKg: indicative("eggplant", 250),
      kind: "instant",
      requestedKg: 250,
      confirmedKg: 250,
      pricePerKg: 0.55,
      neededBy: daysFromToday(-6),
      deliveryMethod: "delivery",
      addressId: MAIN.id,
      addressText: addressText(MAIN),
      note: "",
      status: "cancelled",
      createdAt: daysFromToday(-10),
      history: [
        { status: "confirmed", at: daysFromToday(-10) },
        { status: "cancelled", at: daysFromToday(-9) },
      ],
      cancelReason: "Farmer could not deliver. Please reorder.",
      lots: [],
    },
  ];
}
