"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content, StickyFooter } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { FieldGroup, Input, InputWithSuffix, Textarea } from "@/components/ui/field";
import { ErrorNotice, ListSkeleton } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { SpecRows, SPEC_FOOTER } from "@/components/supply/crop-spec-card";
import { Sheet } from "@/components/ui/sheet";
import { specSummary } from "@/lib/mock/catalog";
import { ConfirmationScreen } from "./confirmation";
import { DeliveryFields } from "./delivery-fields";
import { LivePricePanel } from "./price-panel";
import { MIN_ORDER_KG } from "@/lib/constants";
import { StockChangedError } from "@/lib/db";
import { listAddresses } from "@/lib/api/account";
import { simulateStockChange } from "@/lib/api/demo";
import { placeInstantOrder, type OrderView } from "@/lib/api/orders";
import { listAllCrops } from "@/lib/api/supply";
import { formatCurrency, formatNumber, todayISO, tomorrowISO } from "@/lib/format";
import { useGoBack } from "@/lib/hooks/use-go-back";
import { useQuery } from "@/lib/hooks/use-query";
import { haptic } from "@/lib/telegram";
import { errorMessage } from "@/lib/utils";
import type { CropId, DeliveryMethod } from "@/lib/types";

type Errors = Partial<Record<"crop" | "quantity" | "date" | "address", string>>;

/** Order now: instant order from available stock. Price comes from the quantity tiers. */
export function OrderNowForm({ initialCropId }: { initialCropId?: string }) {
  const goBack = useGoBack("/orders");
  const { data: supply } = useQuery(() => listAllCrops(), []);
  const { data: addresses } = useQuery(() => listAddresses(), []);

  const [cropId, setCropId] = useState(initialCropId ?? "");
  const [quantityText, setQuantityText] = useState("");
  const [cappedAt, setCappedAt] = useState<number | null>(null);
  const [stockChangedTo, setStockChangedTo] = useState<number | null>(null);
  const [date, setDate] = useState(tomorrowISO);
  const [method, setMethod] = useState<DeliveryMethod>("delivery");
  const [addressId, setAddressId] = useState("");
  const [note, setNote] = useState("");
  const [collector, setCollector] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<OrderView | null>(null);
  const [specOpen, setSpecOpen] = useState(false);

  const item = supply?.find((s) => s.crop.id === cropId);
  const available = item?.availableKg ?? 0;
  const quantity = Number.parseInt(quantityText, 10) || 0;

  // Default to the first saved address once they load.
  useEffect(() => {
    if (!addressId && addresses?.length) setAddressId(addresses[0].id);
  }, [addresses, addressId]);

  // Stock can drop while the form is open (someone else ordered). Never overwrite what
  // the buyer typed: flag it and let them adjust.
  const quantityRef = useRef(quantity);
  quantityRef.current = quantity;
  useEffect(() => {
    if (cropId && quantityRef.current > available) setStockChangedTo(available);
  }, [available, cropId]);

  const overStock = stockChangedTo !== null && quantity > available;

  function handleCropChange(next: string) {
    setCropId(next);
    setErrors((e) => ({ ...e, crop: undefined }));
    setStockChangedTo(null);
    const nextAvailable = supply?.find((s) => s.crop.id === next)?.availableKg ?? 0;
    if (quantity > nextAvailable) {
      setQuantityText(String(nextAvailable));
      setCappedAt(nextAvailable);
    } else {
      setCappedAt(null);
    }
  }

  function handleQuantityChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 7);
    const n = Number.parseInt(digits, 10) || 0;
    setErrors((e) => ({ ...e, quantity: undefined }));
    if (cropId && n > available) {
      // Cap instead of allowing an impossible order.
      setQuantityText(String(available));
      setCappedAt(available);
      return;
    }
    setQuantityText(digits);
    setCappedAt(null);
    if (n <= available) setStockChangedTo(null);
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!cropId) next.crop = "Choose a crop.";
    if (quantity < MIN_ORDER_KG) next.quantity = `The minimum order is ${MIN_ORDER_KG} kg.`;
    if (!date) next.date = "Choose a delivery date.";
    else if (date < todayISO()) next.date = "Choose today or a later date.";
    if (method === "delivery" && !addressId) next.address = "Choose a delivery address.";
    return next;
  }

  async function submit() {
    setSubmitError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (overStock) return;

    setSubmitting(true);
    try {
      const order = await placeInstantOrder({
        cropId: cropId as CropId,
        quantityKg: quantity,
        date,
        deliveryMethod: method,
        addressId: method === "delivery" ? addressId : null,
        note,
        collectorName: method === "pickup" ? collector.name : undefined,
        collectorPhone: method === "pickup" ? collector.phone : undefined,
      });
      haptic("medium");
      setPlaced(order);
    } catch (error) {
      if (error instanceof StockChangedError) setStockChangedTo(error.availableKg);
      else setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <ConfirmationScreen
        headerTitle="Order confirmed"
        title="Order confirmed"
        message={`Your order ${placed.code} is confirmed.`}
        summary={[
          { label: "Crop", value: placed.cropName },
          { label: "Quantity", value: `${formatNumber(placed.requestedKg)} kg` },
          { label: "Price per kg", value: formatCurrency(placed.pricePerKg) },
          {
            label: "Total",
            value: formatCurrency((placed.confirmedKg ?? 0) * (placed.pricePerKg ?? 0)),
          },
        ]}
        actions={[
          { label: "View order", href: `/orders/${placed.id}` },
          { label: "View traceability", href: `/orders/${placed.id}?tab=trace`, variant: "secondary" },
        ]}
      />
    );
  }

  const cropOptions = (supply ?? [])
    .filter((s) => s.availableKg > 0 || s.crop.id === cropId)
    .map((s) => ({
      value: s.crop.id,
      label: s.crop.name,
      description: `${formatNumber(s.availableKg)} kg available`,
    }));

  return (
    <>
      <ScreenHeader title="Order now" subtitle="Confirmed instantly" onBack={goBack} />

      <Content withFooter className="space-y-4">
        {!supply ? (
          <ListSkeleton rows={3} />
        ) : (
          <>
            <FieldGroup label="Crop" required error={errors.crop}>
              <Select
                value={cropId}
                onValueChange={handleCropChange}
                options={cropOptions}
                placeholder="Choose a crop"
                invalid={Boolean(errors.crop)}
              />
            </FieldGroup>

            {item ? (
              // Read-only: this produce is already harvested, so quality cannot be changed here.
              <div className="-mt-2 rounded-xl bg-canvas px-3 py-2.5 text-xs text-muted">
                <span className="font-semibold text-ink">Specification:</span> {specSummary(item.crop)}
                <button
                  type="button"
                  onClick={() => setSpecOpen(true)}
                  className="mt-1 block font-semibold text-brand-700 underline"
                >
                  View specification
                </button>
              </div>
            ) : null}

            <FieldGroup
              label="Quantity"
              required
              htmlFor="quantity"
              error={errors.quantity}
              hint={`Minimum ${MIN_ORDER_KG} kg`}
            >
              <InputWithSuffix
                id="quantity"
                suffix="kg"
                inputMode="numeric"
                placeholder="0"
                value={quantityText}
                onChange={(e) => handleQuantityChange(e.target.value)}
                aria-invalid={Boolean(errors.quantity) || overStock}
              />
              {cropId ? (
                <p className="mt-1 text-xs font-medium text-brand-700">
                  Available now: {formatNumber(available)} kg
                </p>
              ) : null}
              {cappedAt !== null ? (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  Only {formatNumber(cappedAt)} kg available.
                </p>
              ) : null}
            </FieldGroup>

            {stockChangedTo !== null && overStock ? (
              <ErrorNotice
                message={`Stock changed. Only ${formatNumber(stockChangedTo)} kg is available now. Please lower your quantity.`}
              />
            ) : null}

            <LivePricePanel crop={item?.crop} quantityKg={quantity} />

            <FieldGroup label="Delivery date" required htmlFor="date" error={errors.date}>
              <Input
                id="date"
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setErrors((er) => ({ ...er, date: undefined }));
                }}
              />
            </FieldGroup>

            <DeliveryFields
              method={method}
              onMethodChange={setMethod}
              addresses={addresses}
              addressId={addressId}
              onAddressChange={(id) => {
                setAddressId(id);
                setErrors((e) => ({ ...e, address: undefined }));
              }}
              addressError={errors.address}
              collectorName={collector.name}
              collectorPhone={collector.phone}
              onCollectorChange={setCollector}
            />

            <FieldGroup label="Note (optional)" htmlFor="note">
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything we should know about this order?"
              />
            </FieldGroup>

            <ErrorNotice message={submitError} />

            {/* DEMO ONLY: lets a reviewer see the "Stock changed" message without a second buyer. */}
            <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">Demo only</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                block
                className="mt-2"
                disabled={!cropId || available === 0}
                onClick={() =>
                  void simulateStockChange(
                    cropId as CropId,
                    quantity > 0 ? Math.floor(quantity * 0.6) : Math.floor(available * 0.5),
                  )
                }
              >
                <FlaskConical />
                Simulate stock change
              </Button>
              <p className="mt-1.5 text-[11px] text-amber-800">
                Pretends another buyer took stock while this form is open.
              </p>
            </div>
          </>
        )}
      </Content>

      {item ? (
        <Sheet open={specOpen} onOpenChange={setSpecOpen} title={`${item.crop.name} specification`}>
          <SpecRows crop={item.crop} />
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">{SPEC_FOOTER}</p>
        </Sheet>
      ) : null}

      <StickyFooter>
        <Button block size="lg" onClick={submit} disabled={submitting || !supply || overStock}>
          {submitting ? "Placing order..." : "Place order"}
        </Button>
      </StickyFooter>
    </>
  );
}
