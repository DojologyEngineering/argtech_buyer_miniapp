import { delay, getState, mutate, NotFoundError } from "../db";
import { uid } from "../utils";
import type { Address } from "../types";

export async function getBuyer() {
  return delay({ ...getState().buyer });
}

export async function getSession() {
  return delay({ ...getState().session }, 20);
}

export async function listAddresses() {
  return delay(getState().addresses.map((a) => ({ ...a })));
}

export type AddressInput = Omit<Address, "id">;

function validate(input: AddressInput) {
  if (!input.label.trim()) throw new Error("Give the address a name, for example “Main store”.");
  if (!input.line.trim()) throw new Error("Enter the street address.");
  if (!input.district.trim()) throw new Error("Enter the district.");
  if (!input.city.trim()) throw new Error("Enter the city.");
}

export async function saveAddress(input: AddressInput, id?: string) {
  validate(input);
  const clean: AddressInput = {
    label: input.label.trim(),
    line: input.line.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
  };
  return delay(
    mutate((db) => {
      if (id) {
        const existing = db.addresses.find((a) => a.id === id);
        if (!existing) throw new NotFoundError("Address", id);
        Object.assign(existing, clean);
        return { ...existing };
      }
      const created: Address = { id: uid("addr"), ...clean };
      db.addresses.push(created);
      return { ...created };
    }),
  );
}

export async function deleteAddress(id: string) {
  return delay(
    mutate((db) => {
      db.addresses = db.addresses.filter((a) => a.id !== id);
    }),
  );
}

export function formatAddress(a: Pick<Address, "label" | "line" | "district" | "city">) {
  return `${a.label}, ${a.line}, ${a.district}, ${a.city}`;
}
