import { CalendarCheck, FileText, MapPin, Sprout } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { joinList } from "@/lib/format";
import type { OriginSummary } from "@/lib/types";

/**
 * Crop-level origin, visible before any order exists. Plain words only: districts at
 * most (never communes), no counts, exact dates, farm numbers or farmer names.
 */
export function OriginSummaryCard({ origin }: { origin: OriginSummary }) {
  const rows: { icon: typeof MapPin; label: string; value: string; detail?: string }[] = [
    {
      icon: MapPin,
      label: "Grown in",
      value: `${origin.province}: ${joinList(origin.districts)}`,
    },
    { icon: Sprout, label: "Grown with", value: origin.method, detail: origin.inputs },
    { icon: CalendarCheck, label: "Picked", value: origin.picked, detail: origin.pickedNote },
    { icon: FileText, label: "Certificates", value: origin.certificates },
  ];

  return (
    <Card>
      <CardBody>
        <h2 className="text-sm font-bold text-ink">Origin summary</h2>
        <dl className="mt-3 space-y-3">
          {rows.map(({ icon: Icon, label, value, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-[15px] font-semibold text-ink">{value}</dd>
                {detail ? <dd className="mt-0.5 text-xs leading-snug text-muted">{detail}</dd> : null}
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
          Recorded by ARG TECH field agents during farm visits.
        </p>
      </CardBody>
    </Card>
  );
}
