"use client";

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { ScreenHeader } from "@/components/layout/screen-header";
import { Content } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

/** Full-screen result shown after "Place order" or "Send request". */
export function ConfirmationScreen({
  headerTitle,
  title,
  message,
  summary,
  actions,
}: {
  headerTitle: string;
  title: string;
  message: string;
  summary: { label: string; value: string }[];
  actions: { label: string; href: string; variant?: "primary" | "secondary" }[];
}) {
  return (
    <>
      <ScreenHeader title={headerTitle} />
      <Content className="flex flex-col items-center pt-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <CircleCheck className="size-9" />
        </span>
        <h2 className="mt-4 text-xl font-extrabold text-ink">{title}</h2>
        <p className="mt-1.5 max-w-xs text-sm text-muted">{message}</p>

        <Card className="mt-6 w-full text-left">
          <CardBody className="space-y-2">
            {summary.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">{row.label}</span>
                <span className="text-right font-semibold text-ink">{row.value}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="mt-6 w-full space-y-2.5">
          {actions.map((action) => (
            <Button key={action.href} asChild block size="lg" variant={action.variant ?? "primary"}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </Content>
    </>
  );
}
