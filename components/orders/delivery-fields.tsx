"use client";

import Link from "next/link";
import { Building2, Truck } from "lucide-react";
import { FieldGroup, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Notice } from "@/components/ui/misc";
import { PICKUP_DISTRICTS, PILOT_PROVINCE } from "@/lib/constants";
import { joinList } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Address, DeliveryMethod } from "@/lib/types";

const METHODS: { value: DeliveryMethod; label: string; icon: typeof Truck }[] = [
  { value: "delivery", label: "Delivery to my address", icon: Truck },
  { value: "pickup", label: "I will pick up", icon: Building2 },
];

/** Delivery method plus a saved-address dropdown, shared by Order now and Request. */
export function DeliveryFields({
  method,
  onMethodChange,
  addresses,
  addressId,
  onAddressChange,
  addressError,
  collectorName,
  collectorPhone,
  onCollectorChange,
}: {
  method: DeliveryMethod;
  onMethodChange: (method: DeliveryMethod) => void;
  addresses: Address[] | undefined;
  addressId: string;
  onAddressChange: (id: string) => void;
  addressError?: string;
  /** Pickup only: who will collect. Both optional. */
  collectorName: string;
  collectorPhone: string;
  onCollectorChange: (value: { name: string; phone: string }) => void;
}) {
  return (
    <>
      <FieldGroup label="Delivery method" required>
        <div className="space-y-2" role="radiogroup" aria-label="Delivery method">
          {METHODS.map(({ value, label, icon: Icon }) => {
            const active = method === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onMethodChange(value)}
                className={cn(
                  "flex h-12 w-full items-center gap-3 rounded-xl border px-3.5 text-left text-[15px] transition-colors",
                  active ? "border-brand-500 bg-brand-50 font-semibold text-brand-800" : "border-line bg-white text-ink",
                )}
              >
                <Icon className={cn("size-4", active ? "text-brand-600" : "text-muted")} />
                <span className="flex-1">{label}</span>
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border",
                    active ? "border-brand-600" : "border-line",
                  )}
                >
                  {active ? <span className="size-2 rounded-full bg-brand-600" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {method === "delivery" ? (
        addresses && addresses.length === 0 ? (
          <Notice tone="warning">
            You have no saved delivery addresses.{" "}
            <Link href="/account" className="font-semibold underline">
              Add one in Account
            </Link>{" "}
            or choose pick-up.
          </Notice>
        ) : (
          <FieldGroup label="Delivery address" required error={addressError}>
            <Select
              value={addressId}
              onValueChange={onAddressChange}
              placeholder="Choose a saved address"
              invalid={Boolean(addressError)}
              options={(addresses ?? []).map((a) => ({
                value: a.id,
                label: a.label,
                description: `${a.line}, ${a.district}, ${a.city}`,
              }))}
            />
          </FieldGroup>
        )
      ) : (
        <>
          <Notice tone="info">
            Pickup points are in {joinList(PICKUP_DISTRICTS)}, {PILOT_PROVINCE}. ARG TECH will share the exact
            pickup point and time once the farmer confirms.
          </Notice>
          <div className="grid grid-cols-1 gap-3.5">
            <FieldGroup label="Person collecting (optional)" htmlFor="collector-name">
              <Input
                id="collector-name"
                value={collectorName}
                maxLength={60}
                autoComplete="off"
                placeholder="Name"
                onChange={(e) => onCollectorChange({ name: e.target.value, phone: collectorPhone })}
              />
            </FieldGroup>
            <FieldGroup
              label="Phone (optional)"
              htmlFor="collector-phone"
              hint="You can add this later."
            >
              <Input
                id="collector-phone"
                type="tel"
                inputMode="tel"
                value={collectorPhone}
                maxLength={20}
                autoComplete="off"
                placeholder="+855 ..."
                onChange={(e) => onCollectorChange({ name: collectorName, phone: e.target.value })}
              />
            </FieldGroup>
          </div>
        </>
      )}
    </>
  );
}
