import { registerSW } from "virtual:pwa-register";

/** How often to ask the browser whether a new build has been deployed. */
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

/**
 * Register the service worker and keep the app on the deployed build.
 *
 * `vite-plugin-pwa` injects a bare `navigator.serviceWorker.register()` by
 * default. That installs a new worker, but nothing ever *checks* for one after
 * the initial page load — so an installed PWA that is never fully closed keeps
 * running the JavaScript it started with, indefinitely.
 *
 * That is not hypothetical: after the box-selection release, campaigns created
 * from a stale client sent no `boxes` field at all, so Postgres applied the
 * column default and every box appeared to be owned. The server was correct the
 * whole time; the client was old. See docs/qa/e2e-report.md (QA-8).
 *
 * With `registerType: "autoUpdate"` the generated worker calls `skipWaiting()`
 * and `clientsClaim()`, so once a new worker is found it takes over and this
 * reloads the page to pick up the matching bundle.
 */
export function registerServiceWorkerUpdates(): void {
  if (import.meta.env.DEV) return;

  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Re-check periodically, and whenever the app comes back to the
      // foreground — the common case for an installed PWA left open for days.
      const check = () => {
        if (document.visibilityState === "visible") void registration.update();
      };
      setInterval(check, UPDATE_CHECK_INTERVAL);
      document.addEventListener("visibilitychange", check);
    },
    onNeedRefresh() {
      // autoUpdate normally activates on its own; this is the belt-and-braces
      // path for browsers that keep the new worker waiting.
      void updateSW(true);
    },
  });
}
