"use client";

/**
 * Telegram Mini App integration.
 *
 * The SDK reads `window` at import time, so it is only ever loaded lazily on the
 * client. Outside Telegram (plain desktop or phone browser) every call degrades
 * to a no-op, so the app can be reviewed without Telegram.
 */

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
}

type SafeInset = { top: number; bottom: number; left: number; right: number };

type WebAppLike = {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  HapticFeedback?: { impactOccurred: (style: string) => void };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  safeAreaInset?: SafeInset;
  contentSafeAreaInset?: SafeInset;
  onEvent?: (event: string, cb: () => void) => void;
};

let webApp: WebAppLike | null = null;
/** True only when running inside Telegram (the SDK also loads in a plain browser). */
let insideTelegram = false;

/** Header colour must match the app's green chrome so Telegram blends in. */
const HEADER_COLOR = "#06642b";
const BACKGROUND_COLOR = "#f4f6f8";

function applySafeArea(app: WebAppLike) {
  const top = (app.safeAreaInset?.top ?? 0) + (app.contentSafeAreaInset?.top ?? 0);
  const bottom = (app.safeAreaInset?.bottom ?? 0) + (app.contentSafeAreaInset?.bottom ?? 0);
  document.documentElement.style.setProperty("--safe-top", `${top}px`);
  document.documentElement.style.setProperty("--safe-bottom", `${bottom}px`);
}

export async function initTelegram(): Promise<{ user: TelegramUser | null; inTelegram: boolean }> {
  if (typeof window === "undefined") return { user: null, inTelegram: false };

  try {
    const mod = await import("@twa-dev/sdk");
    const app = (mod.default ?? mod) as unknown as WebAppLike;
    webApp = app;

    const tgUser = app.initDataUnsafe?.user;
    insideTelegram = Boolean(tgUser);
    // Outside Telegram the SDK still loads but carries no user: stay in browser mode.
    if (!tgUser) return { user: null, inTelegram: false };

    app.ready();
    app.expand();
    app.setHeaderColor?.(HEADER_COLOR);
    app.setBackgroundColor?.(BACKGROUND_COLOR);
    // Stops swipe-to-close from firing while scrolling long forms.
    app.disableVerticalSwipes?.();

    // The CSS env() safe-area fallback is unreliable inside Telegram's WebView, so
    // use the client's own reported insets once we know we are really in Telegram.
    applySafeArea(app);
    app.onEvent?.("safeAreaChanged", () => applySafeArea(app));
    app.onEvent?.("contentSafeAreaChanged", () => applySafeArea(app));

    return {
      user: {
        id: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? "",
        username: tgUser.username,
      },
      inTelegram: true,
    };
  } catch {
    return { user: null, inTelegram: false };
  }
}

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  try {
    webApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    // Older Telegram clients do not expose haptics.
  }
}

/** Wires Telegram's native back button to a callback; returns a cleanup fn. */
export function bindBackButton(onBack: () => void): () => void {
  const button = webApp?.BackButton;
  if (!button) return () => {};
  button.onClick(onBack);
  button.show();
  return () => {
    button.offClick(onBack);
    button.hide();
  };
}

/** Opens a t.me link inside Telegram when possible, otherwise in a new tab. */
export function openTelegramLink(url: string) {
  if (webApp?.openTelegramLink) {
    webApp.openTelegramLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Opens an external link, such as Google Maps. Inside Telegram the SDK's `openLink` hands
 * it to the phone's own app or browser; in a normal browser it opens a new tab.
 */
export function openExternalLink(url: string) {
  if (insideTelegram && webApp?.openLink) {
    webApp.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
