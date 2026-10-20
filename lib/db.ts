/**
 * Phase-1 mock database.
 *
 * A single in-memory store, persisted to localStorage so edits survive a reload
 * inside Telegram. Nothing outside `lib/api/*` should import this — when the real
 * backend lands, only those service modules change.
 */

import type { Address, Buyer, CropId, Order, Session, SupplyRecord } from "./types";
import {
  SEED_ADDRESSES,
  SEED_BUYER,
  SEED_NEXT_SEQ,
  SEED_SESSION,
  SEED_SUPPLY,
  buildSeedOrders,
} from "./mock/seed";

export interface DbShape {
  buyer: Buyer;
  addresses: Address[];
  session: Session;
  supply: Record<CropId, SupplyRecord>;
  orders: Order[];
  nextSeq: number;
}

// Bump whenever DbShape changes shape. Data saved under an older key is ignored,
// so a device with stale data falls back to a fresh, correctly-shaped seed.
const STORAGE_KEY = "argtech.buyer.v3";

function seed(): DbShape {
  return {
    buyer: structuredClone(SEED_BUYER),
    addresses: structuredClone(SEED_ADDRESSES),
    session: structuredClone(SEED_SESSION),
    supply: structuredClone(SEED_SUPPLY),
    orders: buildSeedOrders(),
    nextSeq: SEED_NEXT_SEQ,
  };
}

let state: DbShape | null = null;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function load(): DbShape {
  if (state) return state;
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DbShape>;
        const fresh = seed();
        state = {
          buyer: parsed.buyer ?? fresh.buyer,
          addresses: parsed.addresses ?? fresh.addresses,
          session: parsed.session ?? fresh.session,
          supply: parsed.supply ?? fresh.supply,
          orders: parsed.orders ?? fresh.orders,
          nextSeq: parsed.nextSeq ?? fresh.nextSeq,
        };
        return state;
      }
    } catch {
      // Corrupt payload — fall through to a clean seed.
    }
  }
  state = seed();
  return state;
}

function persist() {
  if (!isBrowser() || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — the in-memory copy still works for this session.
  }
}

export function getState(): DbShape {
  return load();
}

/** Applies a change, persists it, and wakes every subscribed screen. */
export function mutate<T>(fn: (db: DbShape) => T): T {
  const db = load();
  const result = fn(db);
  persist();
  listeners.forEach((l) => l());
  return result;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Wipes local edits and restores the seeded story. */
export function resetDatabase() {
  state = seed();
  persist();
  listeners.forEach((l) => l());
}

/** Small artificial latency so loading states are exercised like a real API. */
export function delay<T>(value: T, ms = 90): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} ${id} not found`);
    this.name = "NotFoundError";
  }
}

/** A well-formed change that the current data does not allow. The message is shown as-is. */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Stock dropped below the requested quantity between opening the form and submitting. */
export class StockChangedError extends ConflictError {
  availableKg: number;
  constructor(availableKg: number) {
    super(`Stock changed. Only ${availableKg.toLocaleString("en-US")} kg is available now.`);
    this.name = "StockChangedError";
    this.availableKg = availableKg;
  }
}
