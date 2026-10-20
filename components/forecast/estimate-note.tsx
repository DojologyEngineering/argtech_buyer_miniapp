import { Badge } from "@/components/ui/misc";

/** The label every forecast view must carry: these numbers are estimates. */
export function EstimateNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <Badge tone="amber" className="shrink-0 bg-amber-100">
        Estimate
      </Badge>
      <p className="text-xs leading-relaxed text-amber-900">
        Based on expected yields. Weather and harvest conditions can change these numbers.
      </p>
    </div>
  );
}
