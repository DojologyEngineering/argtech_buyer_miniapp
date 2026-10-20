"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sprout } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { SpecChips } from "@/components/supply/crop-spec-card";
import { EmptyState, FilterChips, ListSkeleton, SearchInput } from "@/components/ui/misc";
import { useQuery } from "@/lib/hooks/use-query";
import { listSupply } from "@/lib/api/supply";
import { CROPS } from "@/lib/mock/catalog";
import { formatCurrency, formatDaysAgo, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CropId } from "@/lib/types";

const CROP_FILTERS: { value: CropId | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...CROPS.map((c) => ({ value: c.id, label: c.name })),
];

export default function SupplyPage() {
  const [search, setSearch] = useState("");
  const [cropId, setCropId] = useState<CropId | "all">("all");

  const { data: items, loading } = useQuery(() => listSupply({ search, cropId }), [search, cropId]);

  return (
    <>
      <ScreenHeader title="Available now" subtitle="Harvested and ready to order">
        <SearchInput value={search} onChange={setSearch} placeholder="Search crops..." />
      </ScreenHeader>

      <Content withNav className="space-y-3">
        <FilterChips options={CROP_FILTERS} value={cropId} onChange={setCropId} />

        {loading && !items ? <ListSkeleton /> : null}

        {items?.map((item) => {
          const inStock = item.availableKg > 0;
          return (
            <Link key={item.crop.id} href={`/supply/${item.crop.id}`} className="block">
              <Card className="p-3.5 active:bg-canvas">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      inStock ? "bg-brand-50 text-brand-600" : "bg-canvas text-muted",
                    )}
                  >
                    <Sprout className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-ink">{item.crop.name}</p>
                    <p className="text-xs leading-snug text-muted">
                      {inStock ? item.originLine : "Not available right now"}
                    </p>
                    <SpecChips crop={item.crop} muted={!inStock} />
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-sm font-bold", inStock ? "text-ink" : "text-muted")}>
                      {formatNumber(item.availableKg)} kg
                    </p>
                    <p className="text-[11px] text-muted">available</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted/70" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5 text-xs">
                  <span className="font-semibold text-brand-700">
                    From {formatCurrency(item.fromPrice)}/kg
                  </span>
                  <span className="text-muted">Last picked {formatDaysAgo(item.lastPickedAt)}</span>
                </div>
              </Card>
            </Link>
          );
        })}

        {items && items.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="No crops match"
            description="Try another name or clear the filter."
          />
        ) : null}
      </Content>
    </>
  );
}
