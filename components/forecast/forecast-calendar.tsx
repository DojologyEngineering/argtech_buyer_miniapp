"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import type { Forecast, ForecastWeek } from "@/lib/api/forecast";
import { addDaysISO, formatNumber, formatWeekRange, todayISO, toISODate, weekStartISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Weeks, not days: a day-level grid would suggest precision these estimates do not have. */
export function ForecastCalendar({ forecast }: { forecast: Forecast }) {
  const today = todayISO();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);

  const weekByStart = useMemo(
    () => new Map<string, ForecastWeek>(forecast.weeks.map((w) => [w.weekStart, w])),
    [forecast],
  );

  // Calendar rows: whole Monday-start weeks covering the month.
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [month]);

  const selectedWeekStart = weekStartISO(selected);
  const selectedWeek = weekByStart.get(selectedWeekStart);
  const crops = forecast.crops.filter((c) => (selectedWeek?.byCrop[c.id] ?? 0) > 0);

  // A request can only be for a future date: never pre-fill today or the past.
  const tomorrow = addDaysISO(today, 1);
  const requestDate = selected > tomorrow ? selected : tomorrow;

  return (
    <div className="space-y-3">
      <Card>
        <CardBody className="px-3">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-canvas"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="text-[15px] font-bold text-ink">{format(month, "MMMM yyyy")}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-canvas"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-1 space-y-1">
            {weeks.map((row) => {
              const start = toISODate(row[0]);
              const data = weekByStart.get(start);
              const hasSupply = (data?.totalKg ?? 0) > 0;
              const isSelectedWeek = start === selectedWeekStart;

              return (
                <div
                  key={start}
                  className={cn(
                    "grid grid-cols-7 rounded-xl border border-transparent",
                    hasSupply && "bg-brand-50",
                    isSelectedWeek && "border-brand-400",
                  )}
                >
                  {row.map((day) => {
                    const iso = toISODate(day);
                    const inMonth = isSameMonth(day, month);
                    const isToday = iso === today;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setSelected(iso)}
                        aria-label={`${format(day, "EEEE d MMMM")}${hasSupply ? ", supply expected this week (estimate)" : ""}`}
                        aria-pressed={iso === selected}
                        className="flex h-11 flex-col items-center justify-center gap-0.5"
                      >
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-[13px]",
                            inMonth ? "font-medium text-ink" : "text-muted/50",
                            isToday && "bg-brand-600 font-bold text-white",
                            iso === selected && !isToday && "ring-2 ring-brand-500",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        <span
                          className={cn(
                            "size-1 rounded-full",
                            hasSupply ? "bg-brand-500" : "bg-transparent",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-muted">
            <span className="h-3 w-5 rounded bg-brand-50 ring-1 ring-brand-200" />
            Week with expected supply (estimate)
          </div>
        </CardBody>
      </Card>

      {/* Panel for the tapped week */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-bold text-ink">Week of {formatWeekRange(selectedWeekStart)}</p>
              <p className="text-xs text-muted">
                Selected: {format(parseISO(selected), "EEE d MMM")}
              </p>
            </div>
            <Badge tone="amber">Estimate</Badge>
          </div>

          {crops.length === 0 ? (
            <p className="rounded-xl bg-canvas px-3 py-4 text-center text-sm text-muted">Nothing expected</p>
          ) : (
            <ul className="divide-y divide-line">
              {crops.map((crop) => (
                <li key={crop.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{crop.name}</p>
                    <p className="text-sm font-semibold text-ink">
                      {formatNumber(selectedWeek?.byCrop[crop.id])} kg
                      <span className="ml-1 text-[11px] font-normal text-muted">(estimate)</span>
                    </p>
                  </div>
                  <Button asChild variant="subtle" size="sm" block className="mt-2">
                    <Link href={`/orders/request?crop=${crop.id}&date=${requestDate}`}>
                      <CalendarPlus />
                      Request for this date
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

