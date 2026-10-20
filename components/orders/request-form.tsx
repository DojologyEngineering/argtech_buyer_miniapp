"use client";

import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content, StickyFooter } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DerivedField, FieldGroup, Input, InputWithSuffix, Textarea } from "@/components/ui/field";
import { Badge, ErrorNotice, ListSkeleton, Notice } from "@/components/ui/misc";
import { Select } from "@/components/ui/select";
import { ConfirmationScreen } from "./confirmation";
import { DeliveryFields } from "./delivery-fields";
import { MIN_ORDER_KG, REQUEST_REPLY_HOURS, STANDARD_OPTION } from "@/lib/constants";
import { listAddresses } from "@/lib/api/account";
import { getExpectedByDate, getSuggestedDate } from "@/lib/api/forecast";
import { cropLabel, sendRequest, type OrderView } from "@/lib/api/orders";
import { listAllCrops } from "@/lib/api/supply";
import { formatCurrency, formatDate, formatNumber, tomorrowISO } from "@/lib/format";
import { useGoBack } from "@/lib/hooks/use-go-back";
import { useQuery } from "@/lib/hooks/use-query";
import { nextTierHint, tierFor, tierLabel, totalPrice } from "@/lib/pricing";
import { haptic } from "@/lib/telegram";
import { errorMessage } from "@/lib/utils";
import type { CropId, DeliveryMethod } from "@/lib/types";

type Errors = Partial<Record<"crop" | "otherName" | "quantity" | "date" | "address", string>>;

/** Value of the crop dropdown (and `?crop=` param) that switches to the "other crop" mode. */
export const OTHER_CROP = "other";

/**
 * Request for a future date: reserves nothing; ARG TECH staff confirm or decline.
 * Also covers crops that are not in the catalog ("other crop" mode).
 */
export function RequestForm({
  initialCropId,
  initialDate,
}: {
  initialCropId?: string;
  initialDate?: string;
}) {
  const goBack = useGoBack("/orders");
  const { data: supply } = useQuery(() => listAllCrops(), []);
  const { data: addresses } = useQuery(() => listAddresses(), []);

  const [cropId, setCropId] = useState(initialCropId ?? "");
  const [otherName, setOtherName] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [date, setDate] = useState(initialDate ?? "");
  const [dateTouched, setDateTouched] = useState(Boolean(initialDate));
  const [ripeness, setRipeness] = useState(STANDARD_OPTION);
  const [size, setSize] = useState(STANDARD_OPTION);
  const [requirementsText, setRequirementsText] = useState("");
  const [method, setMethod] = useState<DeliveryMethod>("delivery");
  const [addressId, setAddressId] = useState("");
  const [note, setNote] = useState("");
  const [collector, setCollector] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<OrderView | null>(null);

  const isOther = cropId === OTHER_CROP;
  const catalogId = cropId && !isOther ? (cropId as CropId) : null;
  const item = supply?.find((s) => s.crop.id === catalogId);
  const quantity = Number.parseInt(quantityText, 10) || 0;

  const { data: expectedKg } = useQuery(
    async () => (catalogId && date ? getExpectedByDate(catalogId, date) : undefined),
    [catalogId, date],
  );

  useEffect(() => {
    if (!addressId && addresses?.length) setAddressId(addresses[0].id);
  }, [addresses, addressId]);

  // Opened without a date: suggest the first week with expected supply.
  useEffect(() => {
    if (!catalogId || dateTouched) return;
    let cancelled = false;
    getSuggestedDate(catalogId).then((d) => {
      if (!cancelled) setDate(d);
    });
    return () => {
      cancelled = true;
    };
  }, [catalogId, dateTouched]);

  function handleCropChange(next: string) {
    setCropId(next);
    // Requirements belong to a crop: start again from the standard specification.
    setRipeness(STANDARD_OPTION);
    setSize(STANDARD_OPTION);
    setErrors((e) => ({ ...e, crop: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!cropId) next.crop = "Choose a crop.";
    if (isOther && otherName.trim().length < 2) next.otherName = "Enter the name of the crop you need.";
    if (quantity < MIN_ORDER_KG) next.quantity = `The minimum request is ${MIN_ORDER_KG} kg.`;
    if (!date) next.date = "Choose the date you need it by.";
    else if (date < tomorrowISO()) next.date = "Choose a future date.";
    if (method === "delivery" && !addressId) next.address = "Choose a delivery address.";
    return next;
  }

  async function submit() {
    setSubmitError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const order = await sendRequest({
        cropId: catalogId,
        otherCropName: isOther ? otherName : undefined,
        quantityKg: quantity,
        date,
        deliveryMethod: method,
        addressId: method === "delivery" ? addressId : null,
        note,
        collectorName: method === "pickup" ? collector.name : undefined,
        collectorPhone: method === "pickup" ? collector.phone : undefined,
        ripeness: catalogId ? ripeness : undefined,
        size: catalogId ? size : undefined,
        requirementsText: isOther ? requirementsText : undefined,
      });
      haptic("medium");
      setSent(order);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <ConfirmationScreen
        headerTitle="Request sent"
        title="Request sent"
        message={`ARG TECH will review it and reply within ${REQUEST_REPLY_HOURS} hours.`}
        summary={[
          { label: "Request", value: sent.code },
          { label: "Crop", value: cropLabel(sent) },
          { label: "Quantity", value: `${formatNumber(sent.requestedKg)} kg` },
          { label: "Needed by", value: formatDate(sent.neededBy) },
        ]}
        actions={[
          { label: "View request", href: `/orders/${sent.id}` },
          sent.cropId
            ? { label: "Back to Forecast", href: "/forecast", variant: "secondary" }
            : { label: "Back to Orders", href: "/orders", variant: "secondary" },
        ]}
      />
    );
  }

  const tier = item && quantity > 0 ? tierFor(item.crop.tiers, quantity) : null;
  const hint = item && quantity > 0 ? nextTierHint(item.crop, quantity) : null;
  const overExpected = item && quantity > 0 && expectedKg !== undefined && quantity > expectedKg;
  const ripenessOptions = item?.crop.spec.ripenessOptions ?? [];
  const sizeOptions = item?.crop.spec.sizeOptions ?? [];

  return (
    <>
      <ScreenHeader
        title="Request"
        subtitle={isOther ? "A crop that isn't listed" : "For a future date"}
        onBack={goBack}
      />

      <Content withFooter className="space-y-4">
        {!supply ? (
          <ListSkeleton rows={3} />
        ) : (
          <>
            <FieldGroup label="Crop" required error={errors.crop}>
              <Select
                value={cropId}
                onValueChange={handleCropChange}
                options={[
                  ...supply.map((s) => ({
                    value: s.crop.id as string,
                    label: s.crop.name,
                    description:
                      s.availableKg > 0 ? `${formatNumber(s.availableKg)} kg available now` : "Not available now",
                  })),
                  { value: OTHER_CROP, label: "Other crop (not listed)" },
                ]}
                placeholder="Choose a crop"
                invalid={Boolean(errors.crop)}
              />
            </FieldGroup>

            {isOther ? (
              <FieldGroup label="Crop name" required htmlFor="other-name" error={errors.otherName}>
                <Input
                  id="other-name"
                  value={otherName}
                  maxLength={60}
                  placeholder="For example, Pumpkin"
                  onChange={(e) => {
                    setOtherName(e.target.value);
                    setErrors((er) => ({ ...er, otherName: undefined }));
                  }}
                />
              </FieldGroup>
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
                onChange={(e) => {
                  setQuantityText(e.target.value.replace(/\D/g, "").slice(0, 7));
                  setErrors((er) => ({ ...er, quantity: undefined }));
                }}
              />
            </FieldGroup>

            <FieldGroup label="Needed by" required htmlFor="date" error={errors.date}>
              <Input
                id="date"
                type="date"
                min={tomorrowISO()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setDateTouched(true);
                  setErrors((er) => ({ ...er, date: undefined }));
                }}
              />
            </FieldGroup>

            {isOther ? (
              <>
                <Notice tone="info">
                  This crop isn&apos;t in our catalog yet. ARG TECH will check if we can supply it and reply within{" "}
                  {REQUEST_REPLY_HOURS} hours.
                </Notice>
                <FieldGroup label="Your requirements (optional)" htmlFor="requirements">
                  <Textarea
                    id="requirements"
                    value={requirementsText}
                    onChange={(e) => setRequirementsText(e.target.value)}
                    placeholder="For example, medium size, firm, no cracks"
                  />
                </FieldGroup>
              </>
            ) : (
              <>
                {/* Helper panel: updates as crop, quantity and date change. */}
                <Card className="border-brand-200 bg-brand-50/60">
                  <CardBody className="space-y-2.5">
                    {!item ? (
                      <p className="text-center text-sm text-muted">Choose a crop to see supply and price.</p>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-muted">Available now</span>
                          <span className="font-semibold text-ink">{formatNumber(item.availableKg)} kg</span>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-muted">Expected by your date</span>
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            {expectedKg === undefined ? "—" : `${formatNumber(expectedKg)} kg`}
                            <Badge tone="amber">Estimate</Badge>
                          </span>
                        </div>

                        {tier ? (
                          <div className="border-t border-brand-200 pt-2.5">
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="text-muted">Indicative price</span>
                              <span className="font-semibold text-ink">
                                {formatCurrency(tier.pricePerKg)}/kg
                                <span className="ml-1.5 text-[11px] font-normal text-muted">({tierLabel(tier)})</span>
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
                              <span className="text-muted">Indicative total</span>
                              <span className="text-lg font-extrabold text-brand-700">
                                {formatCurrency(totalPrice(quantity, tier.pricePerKg))}
                              </span>
                            </div>
                            {hint ? (
                              <p className="mt-1 text-xs text-brand-800">
                                Order {formatNumber(hint.missingKg)} kg more to get {formatCurrency(hint.pricePerKg)}/kg
                              </p>
                            ) : null}
                            <p className="mt-1.5 text-xs text-muted">
                              Indicative price. ARG TECH confirms the final price.
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </CardBody>
                </Card>

                {overExpected ? (
                  <Notice tone="info">
                    This is more than what is expected. ARG TECH will confirm what can be filled.
                  </Notice>
                ) : null}

                {item ? (
                  <section className="space-y-3.5">
                    <h2 className="text-sm font-bold text-ink">Your requirements</h2>
                    {ripenessOptions.length > 1 ? (
                      <FieldGroup label="Ripeness" htmlFor="ripeness">
                        <Select
                          id="ripeness"
                          value={ripeness}
                          onValueChange={setRipeness}
                          options={ripenessOptions.map((o) => ({
                            value: o,
                            label: o,
                            description: o === STANDARD_OPTION ? item.crop.spec.ripeness : undefined,
                          }))}
                        />
                      </FieldGroup>
                    ) : null}
                    {sizeOptions.length > 1 ? (
                      <FieldGroup label="Size" htmlFor="size">
                        <Select
                          id="size"
                          value={size}
                          onValueChange={setSize}
                          options={sizeOptions.map((o) => ({
                            value: o,
                            label: o,
                            description: o === STANDARD_OPTION ? item.crop.spec.size : undefined,
                          }))}
                        />
                      </FieldGroup>
                    ) : null}
                    <DerivedField label="Condition" value={item.crop.spec.condition} />
                    <p className="text-xs text-muted">ARG TECH will confirm with the farmer that this can be met.</p>
                  </section>
                ) : null}
              </>
            )}

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
                placeholder="Anything we should know about this request?"
              />
            </FieldGroup>

            <ErrorNotice message={submitError} />
          </>
        )}
      </Content>

      <StickyFooter>
        <Button block size="lg" onClick={submit} disabled={submitting || !supply}>
          {submitting ? "Sending..." : "Send request"}
        </Button>
      </StickyFooter>
    </>
  );
}
