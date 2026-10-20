"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OrderNowForm } from "@/components/orders/order-now-form";

function Inner() {
  const params = useSearchParams();
  return <OrderNowForm initialCropId={params.get("crop") ?? undefined} />;
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
