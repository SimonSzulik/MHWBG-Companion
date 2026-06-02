import { useCallback, useEffect, useMemo, useState } from "react";

type InstallChoice = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
}

const DISMISS_KEY = "mhwbg:pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getDismissedAt(): number | null {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return null;
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function isAppleMobile(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

function isStandaloneMode(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function usePwaInstall() {
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobileLike = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua,
    );
    setIsMobile(mobileLike || window.innerWidth <= 900);
    setIsInstalled(isStandaloneMode());
    setIsIos(isAppleMobile(ua));
    setDismissedAt(getDismissedAt());

    const onBeforeInstallPrompt = (event: Event) => {
      const next = event as BeforeInstallPromptEvent;
      next.preventDefault();
      setDeferredPrompt(next);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
      setDismissedAt(null);
    };
    const onResize = () => {
      setIsMobile(window.innerWidth <= 900 || mobileLike);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const isDismissedRecently = useMemo(() => {
    if (!dismissedAt) return false;
    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  }, [dismissedAt]);

  const canShowInstallPrompt = useMemo(() => {
    if (!isMobile || isInstalled || isDismissedRecently) return false;
    // On iOS we have no native prompt, so show instructions.
    if (isIos) return true;
    return deferredPrompt != null;
  }, [deferredPrompt, isDismissedRecently, isInstalled, isIos, isMobile]);

  const dismissPrompt = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(DISMISS_KEY, String(now));
    setDismissedAt(now);
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallChoice | null> => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.removeItem(DISMISS_KEY);
      setDismissedAt(null);
    } else {
      dismissPrompt();
    }
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt, dismissPrompt]);

  return {
    isMobile,
    isIos,
    isInstalled,
    canShowInstallPrompt,
    hasNativeInstallPrompt: deferredPrompt != null,
    promptInstall,
    dismissPrompt,
  };
}
