"use client";

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { ListSkeleton } from "@/components/ui/misc";
import { Segmented } from "@/components/ui/segmented";
import { EstimateNote } from "@/components/forecast/estimate-note";
import { ForecastList } from "@/components/forecast/forecast-list";
import { ForecastCalendar } from "@/components/forecast/forecast-calendar";
import { useQuery } from "@/lib/hooks/use-query";
import { getForecast } from "@/lib/api/forecast";

type View = "list" | "calendar";

export default function ForecastPage() {
  const [view, setView] = useState<View>("list");
  const { data: forecast } = useQuery(() => getForecast(), []);

  return (
    <>
      <ScreenHeader title="Coming soon" subtitle="Expected supply (estimates)">
        <Segmented
          tone="onGreen"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: "List", icon: <List /> },
            { value: "calendar", label: "Calendar", icon: <CalendarDays /> },
          ]}
        />
      </ScreenHeader>

      <Content withNav className="space-y-3">
        <EstimateNote />
        {!forecast ? <ListSkeleton rows={3} /> : null}
        {forecast && view === "list" ? <ForecastList forecast={forecast} /> : null}
        {forecast && view === "calendar" ? <ForecastCalendar forecast={forecast} /> : null}
      </Content>
    </>
  );
}
