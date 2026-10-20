# ARG TECH Buyer App (Phase 1: UI only, mock data)

Telegram Mini App for registered buyers: see what produce is available now, see what is
expected soon, order instantly, request a future date, track orders and view lot traceability.
Frontend only: everything runs on an in-memory mock store persisted to localStorage.

```
pnpm install
pnpm dev         # http://localhost:3001  (works in a normal browser, no Telegram needed)
pnpm build
```

## Structure

- `lib/api/*` – async service functions (the only code that touches `lib/db.ts`). Swap these for real API calls later.
- `lib/db.ts`, `lib/mock/*` – mock store, seed story, price tiers, lot templates, forecast.
- `lib/constants.ts` – `MIN_ORDER_KG` (50), `REQUEST_REPLY_HOURS` (24), contact details.
- `components/account/demo-controls.tsx`, `lib/api/demo.ts`, `components/layout/unregistered-screen.tsx`
  (back button) and the "Simulate stock change" box in the Order now form are **demo only**; remove before launch.

## Notes on the mock

- Order and request numbers share one sequence. A request keeps its REQ code until confirmed, then becomes the PO with the same number.
- Lots are auto-assigned from fixed per-crop lot templates, oldest harvest first, split across 1–3 lots.
- Forecast weeks start Monday; week 0 is the current week, so the data stays aligned over time.
- Reset demo data (Account tab) restores the seed. Storage key: `argtech.buyer.v3`.
- The crop-level Origin summary is derived from the crop's lot records (`lib/mock/origin.ts`), so it always agrees with the lot cards shown after ordering. Wording uses most / some / all, never counts.
- Certificates carry a sharing setting (`hidden`, `details`, `details_and_image`). The app only ever shows the buyer-safe image URL; `public/sample-certificate.svg` is a placeholder.
