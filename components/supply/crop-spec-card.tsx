import { Clock, Eye, Leaf, Ruler } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Crop } from "@/lib/types";

export const SPEC_FOOTER =
  "Checked by our agent at handover. Typical for this crop; individual lots can vary slightly.";

/** The four specification rows. Shared by the crop detail card and the Order now sheet. */
export function SpecRows({ crop }: { crop: Crop }) {
  const { spec } = crop;
  const rows = [
    { icon: Leaf, label: "Ripeness", value: spec.ripeness },
    { icon: Ruler, label: "Size", value: spec.size },
    { icon: Eye, label: "Condition", value: spec.condition },
    {
      icon: Clock,
      label: "Best used within",
      value: `${spec.bestUsedWithinDays} day${spec.bestUsedWithinDays === 1 ? "" : "s"}`,
    },
  ];

  return (
    <dl className="space-y-3">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-[15px] font-semibold text-ink">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** Crop specification, in the same card style as the Origin summary. Shown for every crop. */
export function CropSpecCard({ crop }: { crop: Crop }) {
  return (
    <Card id="specification">
      <CardBody>
        <h2 className="text-sm font-bold text-ink">Crop specification</h2>
        <div className="mt-3">
          <SpecRows crop={crop} />
        </div>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">{SPEC_FOOTER}</p>
      </CardBody>
    </Card>
  );
}

/** Up to three short chips on the Supply list. Greyed out when there is no stock. */
export function SpecChips({ crop, muted }: { crop: Crop; muted?: boolean }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {crop.spec.chips.slice(0, 3).map((chip) => (
        <span
          key={chip}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold leading-snug",
            muted ? "bg-canvas text-muted/70" : "bg-brand-50 text-brand-700",
          )}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
