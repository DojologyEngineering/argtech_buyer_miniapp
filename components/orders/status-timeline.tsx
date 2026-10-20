import { Check, X } from "lucide-react";
import { statusLabel } from "@/lib/format";
import type { OrderView } from "@/lib/api/orders";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

interface Step {
  status: OrderStatus;
  state: "done" | "current" | "upcoming" | "failed";
  at?: string;
  detail?: string;
}

/**
 * Requested (requests only) -> Confirmed -> Delivered -> Completed, ending early in
 * Declined (with the staff reason) or Cancelled (with the reason).
 */
function buildSteps(order: OrderView): Step[] {
  const when = (status: OrderStatus) => order.history.find((h) => h.status === status)?.at;

  if (order.status === "declined") {
    return [
      { status: "requested", state: "done", at: when("requested") },
      { status: "declined", state: "failed", at: when("declined"), detail: order.declineReason },
    ];
  }

  if (order.status === "cancelled") {
    const steps: Step[] = [];
    if (order.kind === "request") steps.push({ status: "requested", state: "done", at: when("requested") });
    steps.push({ status: "confirmed", state: "done", at: when("confirmed") });
    steps.push({ status: "cancelled", state: "failed", at: when("cancelled"), detail: order.cancelReason });
    return steps;
  }

  const flow: OrderStatus[] = ["requested", "confirmed", "delivered", "completed"];
  const currentIndex = flow.indexOf(order.status);
  const result: Step[] = [];
  for (const status of flow) {
    if (status === "requested" && order.kind !== "request") continue;
    const index = flow.indexOf(status);
    result.push({
      status,
      at: when(status),
      state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
    });
  }
  return result;
}

export function StatusTimeline({ order }: { order: OrderView }) {
  const steps = buildSteps(order);

  return (
    <ol>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const reached = step.state !== "upcoming";
        return (
          <li key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5",
                  step.state === "done" ? "bg-brand-400" : "bg-line",
                )}
              />
            ) : null}
            <span
              className={cn(
                "z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                step.state === "done" && "border-brand-600 bg-brand-600 text-white",
                step.state === "current" && "border-brand-600 bg-white text-brand-600",
                step.state === "upcoming" && "border-line bg-white text-muted",
                step.state === "failed" && "border-red-500 bg-red-500 text-white",
              )}
            >
              {step.state === "failed" ? (
                <X className="size-3.5" />
              ) : step.state === "done" ? (
                <Check className="size-3.5" />
              ) : (
                <span className={cn("size-2 rounded-full", step.state === "current" ? "bg-brand-600" : "bg-line")} />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  step.state === "failed" ? "text-red-600" : reached ? "text-ink" : "text-muted",
                )}
              >
                {statusLabel(step.status, order.deliveryMethod)}
              </p>
              <p className="text-xs text-muted">{step.at ? formatDate(step.at) : "Not yet"}</p>
              {step.detail ? (
                <p className="mt-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                  Reason: {step.detail}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
