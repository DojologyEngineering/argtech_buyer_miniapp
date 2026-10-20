"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { pickSuggestedDate, type Forecast } from "@/lib/api/forecast";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CropId } from "@/lib/types";

type Grouping = "week" | "month";

interface Bar {
  key: string;
  label: string;
  kg: number;
}

function barsFor(forecast: Forecast, cropId: CropId, grouping: Grouping): Bar[] {
  if (grouping === "week") {
    return forecast.weeks.map((w) => ({
      key: w.weekStart,
      label: format(parseISO(w.weekStart), "d MMM"),
      kg: w.byCrop[cropId] ?? 0,
    }));
  }
  // A week belongs to the month its Thursday falls in.
  const months = new Map<string, Bar>();
  for (const w of forecast.weeks) {
    const thursday = addDays(parseISO(w.weekStart), 3);
    const key = format(thursday, "yyyy-MM");
    const bar = months.get(key) ?? { key, label: format(thursday, "MMM"), kg: 0 };
    bar.kg += w.byCrop[cropId] ?? 0;
    months.set(key, bar);
  }
  return [...months.values()];
}

const CHART_HEIGHT = 88;

function BarChart({ bars, cropName, grouping }: { bars: Bar[]; cropName: string; grouping: Grouping }) {
  const max = Math.max(...bars.map((b) => b.kg), 1);

  return (
    <div
      className="grid items-end gap-2"
      style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`${cropName} expected kilograms by ${grouping}, estimates`}
    >
      {bars.map((bar) => {
        const height = bar.kg > 0 ? Math.max((bar.kg / max) * CHART_HEIGHT, 6) : 0;
        return (
          <div key={bar.key} className="flex min-w-0 flex-col items-center">
            <span
              className={cn(
                "mb-1 text-[11px] font-semibold leading-none",
                bar.kg > 0 ? "text-ink" : "text-muted/60",
              )}
            >
              {formatNumber(bar.kg)}
            </span>
            <div className="flex w-full items-end justify-center" style={{ height: CHART_HEIGHT }}>
              {bar.kg > 0 ? (
                <div
                  className="w-full max-w-9 rounded-t-md bg-brand-400"
                  style={{ height }}
                  title={`${formatNumber(bar.kg)} kg (estimate)`}
                />
              ) : (
                <div className="h-0.5 w-full max-w-9 rounded-full bg-line" />
              )}
            </div>
            <span className="mt-1.5 text-[10px] text-muted">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ForecastList({ forecast }: { forecast: Forecast }) {
  const [grouping, setGrouping] = useState<Grouping>("week");

  const rows = useMemo(
    () =>
      forecast.crops.map((crop) => {
        const bars = barsFor(forecast, crop.id, grouping);
        const total = forecast.weeks.reduce((sum, w) => sum + (w.byCrop[crop.id] ?? 0), 0);
        return { crop, bars, total, date: pickSuggestedDate(forecast.weeks, crop.id) };
      }),
    [forecast, grouping],
  );

  return (
    <div className="space-y-3">
      <Segmented
        value={grouping}
        onChange={setGrouping}
        options={[
          { value: "week", label: "By week" },
          { value: "month", label: "By month" },
        ]}
      />

      {rows.map(({ crop, bars, total, date }) => (
        <Card key={crop.id}>
          <CardBody>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{crop.name}</p>
                <p className="text-xs text-muted">
                  {total > 0
                    ? `About ${formatNumber(total)} kg over the next 6 weeks`
                    : "Nothing expected in the next 6 weeks"}
                </p>
              </div>
              <Badge tone="amber">Estimate</Badge>
            </div>

            <BarChart bars={bars} cropName={crop.name} grouping={grouping} />

            <Button asChild variant="subtle" block className="mt-4">
              <Link href={`/orders/request?crop=${crop.id}&date=${date}`}>
                <CalendarPlus />
                Request for a future date
              </Link>
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
