"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { saveAddress, type AddressInput } from "@/lib/api/account";
import { errorMessage } from "@/lib/utils";
import type { Address } from "@/lib/types";

const EMPTY: AddressInput = { label: "", line: "", district: "", city: "Phnom Penh" };

/** Add or edit a saved delivery address. */
export function AddressSheet({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when adding. */
  address?: Address;
}) {
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(address ? { label: address.label, line: address.line, district: address.district, city: address.city } : EMPTY);
      setError(null);
    }
  }, [open, address]);

  const set = (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveAddress(form, address?.id);
      onOpenChange(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={address ? "Edit address" : "Add delivery address"}>
      <div className="space-y-3.5">
        <FieldGroup label="Name" required htmlFor="addr-label">
          <Input id="addr-label" value={form.label} onChange={set("label")} placeholder="Main store" />
        </FieldGroup>
        <FieldGroup label="Street address" required htmlFor="addr-line">
          <Input id="addr-line" value={form.line} onChange={set("line")} placeholder="No. 24, Street 278" />
        </FieldGroup>
        <FieldGroup label="District" required htmlFor="addr-district">
          <Input id="addr-district" value={form.district} onChange={set("district")} placeholder="Boeng Keng Kang" />
        </FieldGroup>
        <FieldGroup label="City" required htmlFor="addr-city">
          <Input id="addr-city" value={form.city} onChange={set("city")} />
        </FieldGroup>
        <ErrorNotice message={error} />
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" block onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button block onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save address"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
