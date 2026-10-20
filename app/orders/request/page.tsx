"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RequestForm } from "@/components/orders/request-form";

function Inner() {
  const params = useSearchParams();
  return (
    <RequestForm
      initialCropId={params.get("crop") ?? undefined}
      initialDate={params.get("date") ?? undefined}
    />
  );
}

export default function RequestPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
