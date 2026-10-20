"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, Sprout, X } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content, StickyFooter } from "@/components/layout/app-shell";
import { Card, CardBody, SectionHeading } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton } from "@/components/ui/misc";
import { CropSpecCard } from "@/components/supply/crop-spec-card";
import { OriginSummaryCard } from "@/components/supply/origin-summary-card";
import { PriceTierTable } from "@/components/supply/price-tier-table";
import { useQuery } from "@/lib/hooks/use-query";
import { getSupplyItem } from "@/lib/api/supply";
import { formatDaysAgo, formatNumber } from "@/lib/format";

export default function SupplyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, error } = useQuery(() => getSupplyItem(id), [id]);

  if (error) {
    return (
      <>
        <ScreenHeader title="Crop not found" backHref="/supply" />
        <Content>
          <EmptyState icon={X} title="This crop is not listed" />
        </Content>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <ScreenHeader title="Loading..." backHref="/supply" />
        <Content>
          <ListSkeleton rows={3} />
        </Content>
      </>
    );
  }

  const inStock = item.availableKg > 0;

  return (
    <>
      <ScreenHeader title={item.crop.name} subtitle="Available now" backHref="/supply" />

      <Content withFooter={inStock} className="space-y-4">
        {inStock ? (
          <>
            <Card>
              <CardBody className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Sprout className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">Available now</p>
                  <p className="text-2xl font-extrabold leading-tight text-ink">
                    {formatNumber(item.availableKg)} kg
                  </p>
                </div>
                <p className="shrink-0 text-right text-xs text-muted">
                  Last picked
                  <br />
                  {formatDaysAgo(item.lastPickedAt)}
                </p>
              </CardBody>
            </Card>

            <div>
              <SectionHeading title="Price per kg" hint="Depends on how much you order" />
              <Card>
                <CardBody>
                  <PriceTierTable tiers={item.crop.tiers} />
                </CardBody>
              </Card>
            </div>

            <CropSpecCard crop={item.crop} />

            <OriginSummaryCard origin={item.origin} />
          </>
        ) : (
          <>
            <EmptyState
              icon={CalendarDays}
              title="Not available right now"
              description={`${item.crop.name} has no harvested stock at the moment. See what is expected soon and request it for a future date.`}
              action={
                <Button asChild size="sm">
                  <Link href="/forecast">See the Forecast</Link>
                </Button>
              }
            />
            <CropSpecCard crop={item.crop} />
          </>
        )}
      </Content>

      {inStock ? (
        <StickyFooter>
          <Button asChild block size="lg">
            <Link href={`/orders/new?crop=${item.crop.id}`}>Order now</Link>
          </Button>
        </StickyFooter>
      ) : null}
    </>
  );
}
