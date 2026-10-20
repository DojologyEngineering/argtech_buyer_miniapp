"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { AddressSheet } from "@/components/account/address-sheet";
import { DemoControls } from "@/components/account/demo-controls";
import { ContactOptions } from "@/components/orders/contact-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardBody, SectionHeading } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataPoint, EmptyState, Skeleton } from "@/components/ui/misc";
import { deleteAddress, getBuyer, listAddresses } from "@/lib/api/account";
import { useQuery } from "@/lib/hooks/use-query";
import type { Address } from "@/lib/types";

export default function AccountPage() {
  const { data: buyer } = useQuery(() => getBuyer(), []);
  const { data: addresses } = useQuery(() => listAddresses(), []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Address | undefined>();
  const [removing, setRemoving] = useState<Address | null>(null);

  return (
    <>
      <ScreenHeader title="Account" subtitle={buyer?.companyName ?? " "} />

      <Content withNav className="space-y-5">
        <div>
          <SectionHeading title="Company" />
          <Card>
            <CardBody className="space-y-3.5">
              {buyer ? (
                <>
                  <DataPoint label="Company name" value={buyer.companyName} />
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
                    <DataPoint label="Contact person" value={buyer.contactPerson} />
                    <DataPoint label="Phone" value={buyer.phone} />
                  </div>
                  <DataPoint label="Email" value={buyer.email} />
                </>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
              <p className="border-t border-line pt-3 text-xs text-muted">
                Need to change your company details? Contact ARG TECH.
              </p>
            </CardBody>
          </Card>
        </div>

        <div>
          <SectionHeading
            title="Delivery addresses"
            hint="Used when you choose delivery"
            action={
              <Button
                size="sm"
                variant="subtle"
                onClick={() => {
                  setEditing(undefined);
                  setSheetOpen(true);
                }}
              >
                <Plus /> Add
              </Button>
            }
          />
          {addresses && addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              description="Add an address to choose delivery on your orders."
            />
          ) : (
            <div className="space-y-2.5">
              {addresses?.map((a) => (
                <Card key={a.id}>
                  <CardBody className="flex items-start gap-3 p-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <MapPin className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">{a.label}</p>
                      <p className="text-xs text-muted">
                        {a.line}, {a.district}, {a.city}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${a.label}`}
                        onClick={() => {
                          setEditing(a);
                          setSheetOpen(true);
                        }}
                        className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-canvas"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${a.label}`}
                        onClick={() => setRemoving(a)}
                        className="flex size-9 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
              {!addresses ? <Skeleton className="h-20 w-full" /> : null}
            </div>
          )}
        </div>

        <div>
          <SectionHeading title="Contact ARG TECH" hint="Questions, changes or cancellations" />
          <Card>
            <CardBody>
              <ContactOptions />
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <Send className="size-3.5" />
                Buyer accounts are set up by ARG TECH staff.
              </p>
            </CardBody>
          </Card>
        </div>

        <DemoControls />
      </Content>

      <AddressSheet open={sheetOpen} onOpenChange={setSheetOpen} address={editing} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title="Delete this address?"
        description={removing ? `${removing.label} will be removed from your saved addresses. Existing orders keep their address.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => removing && void deleteAddress(removing.id)}
      />
    </>
  );
}
