"use client";

import { useState } from "react";
import { CircleCheck, ThumbsUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldGroup, Textarea } from "@/components/ui/field";
import { ErrorNotice } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { FEEDBACK_REASONS } from "@/lib/constants";
import { submitFeedback, type OrderView } from "@/lib/api/orders";
import { formatDate } from "@/lib/format";
import { haptic } from "@/lib/telegram";
import { cn, errorMessage } from "@/lib/utils";

/** "How was the produce?" Shown on Delivered and Completed orders. */
export function FeedbackCard({ order }: { order: OrderView }) {
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const answer = order.feedback;

  async function send(outcome: "as_expected" | "issue") {
    setSaving(true);
    setError(null);
    try {
      await submitFeedback(order.id, { outcome, reasons, note });
      haptic("light");
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const toggle = (reason: string) =>
    setReasons((r) => (r.includes(reason) ? r.filter((x) => x !== reason) : [...r, reason]));

  return (
    <>
      <Card>
        <CardBody>
          <h2 className="text-sm font-bold text-ink">How was the produce?</h2>

          {answer ? (
            <div className="mt-3 flex items-start gap-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  answer.outcome === "issue" ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600",
                )}
              >
                {answer.outcome === "issue" ? (
                  <TriangleAlert className="size-4" />
                ) : (
                  <CircleCheck className="size-4" />
                )}
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-ink">
                  {answer.outcome === "issue" ? "Had an issue" : "As expected"}
                  <span className="ml-2 text-xs font-normal text-muted">{formatDate(answer.at)}</span>
                </p>
                {answer.reasons.length > 0 ? <p className="text-ink">{answer.reasons.join(", ")}</p> : null}
                {answer.note ? <p className="mt-0.5 text-muted">&ldquo;{answer.note}&rdquo;</p> : null}
                <p className="mt-1 text-xs text-muted">
                  {answer.outcome === "issue" ? "Thanks. ARG TECH will follow up." : "Thanks for letting us know."}{" "}
                  Linked to {answer.lotCodes.map((c) => `Lot ${c}`).join(", ")}.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">Tell us if it matched the specification.</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <Button variant="subtle" disabled={saving} onClick={() => void send("as_expected")}>
                  <ThumbsUp />
                  As expected
                </Button>
                <Button variant="secondary" onClick={() => setOpen(true)}>
                  <TriangleAlert />
                  Had an issue
                </Button>
              </div>
              <ErrorNotice message={open ? null : error} className="mt-3" />
            </>
          )}
        </CardBody>
      </Card>

      <Sheet open={open} onOpenChange={setOpen} title="What went wrong?" description="Choose all that apply.">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_REASONS.map((reason) => {
              const on = reasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(reason)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    on ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-muted",
                  )}
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <FieldGroup label="Note (optional)" htmlFor="feedback-note">
            <Textarea
              id="feedback-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else we should know?"
            />
          </FieldGroup>
          <ErrorNotice message={error} />
          <Button block disabled={saving || reasons.length === 0} onClick={() => void send("issue")}>
            {saving ? "Sending..." : "Send"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
