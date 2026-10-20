import { useState } from "react";
import {
  CalendarDays,
  Droplets,
  Eye,
  FileText,
  Leaf,
  MapPin,
  Sprout,
  Tractor,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CertificateViewer } from "./certificate-viewer";
import { EmptyState } from "@/components/ui/misc";
import type { OrderView } from "@/lib/api/orders";
import { CERTIFICATE_CAPTION, TRACEABILITY_DISCLAIMER } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Lot, LotCertificate } from "@/lib/types";

/** A titled block inside a lot card. */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line px-4 py-4">
      <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="flex size-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-3.5" />
        </span>
        {title}
      </h4>
      {children}
    </section>
  );
}

/** Label on the left, value on the right. Reads like a short table. */
function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-line/70">{children}</dl>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

/**
 * One certificate, shown according to its sharing setting. The buyer only ever gets the
 * buyer-safe copy of the image that staff uploaded.
 */
function CertificateItem({ certificate }: { certificate: LotCertificate }) {
  const [viewing, setViewing] = useState(false);

  if (certificate.sharing === "hidden") {
    return (
      <li className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2.5 text-sm text-muted">
        <FileText className="size-4 shrink-0" />
        Certificate on record. Details not shared.
      </li>
    );
  }

  const hasImage = certificate.sharing === "details_and_image" && certificate.imageUrl;

  return (
    <li className="rounded-xl border border-line bg-canvas/60 p-3">
      <p className="text-sm font-bold text-ink">{certificate.type}</p>
      <div className="mt-2">
        <Rows>
          <Row label="Issuer" value={certificate.issuer} />
          <Row label="Scope" value={certificate.scope} />
          <Row label="Expires" value={formatDate(certificate.expiry)} />
        </Rows>
      </div>
      {hasImage ? (
        <>
          <Button variant="subtle" size="sm" block className="mt-3" onClick={() => setViewing(true)}>
            <Eye />
            View certificate
          </Button>
          <CertificateViewer
            open={viewing}
            onOpenChange={setViewing}
            src={certificate.imageUrl!}
            title={`${certificate.type}, ${certificate.scope}`}
          />
        </>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">{CERTIFICATE_CAPTION}</p>
    </li>
  );
}

/** One crop cycle's record. Anonymous: no farmer name, phone, exact location or map. */
function LotCard({ lot }: { lot: Lot }) {
  return (
    <Card className="overflow-hidden">
      <header className="flex items-center gap-3 bg-brand-50 px-4 py-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600">
          <Sprout className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-tight text-ink">Lot {lot.code}</p>
          <p className="text-xs leading-snug text-brand-800/80">
            {lot.crop} · {lot.variety}
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-brand-700">
          {formatNumber(lot.quantityKg)} kg
        </p>
      </header>

      <Section icon={MapPin} title="Origin">
        <Rows>
          <Row label="Province" value={lot.province} />
          <Row label="District" value={lot.district} />
          <Row label="Commune" value={lot.commune} />
        </Rows>
      </Section>

      <Section icon={CalendarDays} title="Crop cycle">
        <Rows>
          <Row label="Planting date" value={formatDate(lot.plantingDate)} />
        </Rows>
        <p className="mb-1.5 mt-3 text-sm text-muted">Harvest dates</p>
        <div className="flex flex-wrap gap-1.5">
          {lot.harvestDates.map((d) => (
            <span key={d} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink">
              {formatDate(d, "d MMM yyyy")}
            </span>
          ))}
        </div>
      </Section>

      <Section icon={Tractor} title="Production details">
        <Rows>
          <Row label="Production method" value={lot.productionMethod} />
          <Row label="Fertilizer type" value={lot.fertilizer} />
          <Row label="Pesticide used" value={lot.pesticide} />
        </Rows>
      </Section>

      <Section icon={Droplets} title="Field activities">
        <ol>
          {lot.activities.map((a, i) => {
            const last = i === lot.activities.length - 1;
            const irrigation = a.type === "irrigation";
            return (
              <li key={`${a.date}-${i}`} className="relative flex gap-3 pb-3.5 last:pb-0">
                {!last ? <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-line" /> : null}
                <span
                  className={cn(
                    "z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                    irrigation ? "bg-blue-50 text-blue-600" : "bg-brand-50 text-brand-600",
                  )}
                >
                  {irrigation ? <Droplets className="size-3.5" /> : <Leaf className="size-3.5" />}
                </span>
                <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-1 text-sm">
                  <p className="min-w-0 font-medium text-ink">{a.note}</p>
                  <p className="shrink-0 text-xs text-muted">{formatDate(a.date, "d MMM")}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section icon={FileText} title="Certificates">
        {lot.certificates.length === 0 ? (
          <p className="text-sm text-muted">No certificates on record</p>
        ) : (
          <ul className="space-y-3">
            {lot.certificates.map((c) => (
              <CertificateItem key={c.type + c.scope} certificate={c} />
            ))}
          </ul>
        )}
      </Section>

      <footer className="border-t border-line bg-canvas/60 px-4 py-3 text-xs leading-relaxed text-muted">
        {TRACEABILITY_DISCLAIMER}
      </footer>
    </Card>
  );
}

export function TraceabilityTab({ order }: { order: OrderView }) {
  if (order.status === "requested") {
    return (
      <EmptyState
        icon={Sprout}
        title="Traceability will be available once your order is confirmed."
      />
    );
  }

  if (order.status === "declined" || order.status === "cancelled" || order.lots.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="No traceability for this order"
        description={
          order.status === "declined"
            ? "This request was declined, so no lots were assigned."
            : "This order was cancelled, so its lots no longer apply."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {order.lots.map((lot) => (
        <LotCard key={lot.code} lot={lot} />
      ))}
      <p className="px-1 text-xs leading-relaxed text-muted">
        Traceability is recorded per crop cycle, so harvest dates show when the crop was picked, not which
        exact kilograms went into your order.
      </p>
    </div>
  );
}
