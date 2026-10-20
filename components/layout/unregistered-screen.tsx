"use client";

import * as React from "react";
import { LockKeyhole } from "lucide-react";
import { ContactButton } from "@/components/orders/contact-sheet";
import { setRegistered } from "@/lib/api/demo";

/** Shown instead of the whole app when the visitor is not linked to a buyer account. */
export function UnregisteredScreen() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <div className="bg-brand-600 px-4 pb-6 pt-[calc(var(--safe-top)+14px)] text-white">
        <p className="text-sm font-semibold tracking-wide text-white/80">ARG TECH</p>
        <h1 className="mt-0.5 text-[26px] font-extrabold leading-tight">Buyer App</h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <LockKeyhole className="size-7" />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-ink">Your account isn&apos;t set up yet</h2>
        <p className="mt-2 max-w-xs text-sm text-muted">Contact ARG TECH to get access.</p>
        <div className="mt-6 w-full max-w-xs">
          <ContactButton block size="lg" />
        </div>
      </div>

      {/* DEMO ONLY: the way back from the unregistered preview. */}
      <div className="px-4 pb-[calc(max(var(--safe-bottom),10px)+20px)] text-center">
        <button
          type="button"
          onClick={() => void setRegistered(true)}
          className="rounded-full border border-dashed border-amber-400 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800"
        >
          Demo only: back to the buyer app
        </button>
      </div>
    </div>
  );
}
