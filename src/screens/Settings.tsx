import type { ReactNode } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { useSyncStatus } from "../lib/sync/useSync";
import { stopSync } from "../lib/sync/engine";
import { exportCampaign, importCampaign } from "../lib/backup";
import { usePwaInstall } from "../lib/pwa/usePwaInstall";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  off: { text: "Disconnected", cls: "text-ink-soft" },
  connecting: { text: "Connecting…", cls: "text-warn" },
  live: { text: "● Live sync", cls: "text-ok" },
  error: { text: "Error", cls: "text-red-600" },
};

/** Settings: sync status, join code, backup, logout. */
export function Settings() {
  const nav = useNavigate();
  const campaign = useCampaign((s) => s.campaign);
  const resetCampaign = useCampaign((s) => s.resetCampaign);
  const signOut = useAuth((s) => s.signOut);
  const { status, detail } = useSyncStatus();
  const { isInstalled, isIos, hasNativeInstallPrompt, promptInstall } = usePwaInstall();
  const fileInput = useRef<HTMLInputElement>(null);

  const st = STATUS_LABEL[status] ?? STATUS_LABEL.off;

  const logout = async () => {
    if (!confirm("Sign out and leave the campaign?")) return;
    await stopSync();
    resetCampaign();
    await signOut();
    nav("/login", { replace: true });
  };

  const switchCampaign = async () => {
    await stopSync();
    resetCampaign();
    nav("/onboarding", { replace: true });
  };

  return (
    <Screen title="Settings" subtitle={campaign?.name} back>
      <Section title="Campaign">
        <button
          type="button"
          onClick={() => nav("/")}
          className="rounded-lg border-[1.5px] border-line-strong bg-paper-2 py-2 text-sm font-semibold active:translate-y-px"
        >
          Back to Camp
        </button>
        {campaign?.joinCode ? (
          <div className="rounded-lg border border-dashed border-accent/70 bg-accent-faint/50 px-3 py-2 text-center">
            <p className="text-xs text-ink-soft">
              Share this code so others can join the campaign:
            </p>
            <p className="font-display text-2xl tracking-widest">
              {campaign.joinCode}
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(campaign.joinCode!);
              }}
              className="mt-2 text-sm text-accent underline"
            >
              Copy code
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Loading join code…</p>
        )}
        <button
          type="button"
          onClick={() => void switchCampaign()}
          className="rounded-lg border-[1.5px] border-accent bg-accent-faint py-2 text-sm font-semibold text-accent active:translate-y-px"
        >
          Campaigns
        </button>
        <p className="text-xs text-ink-soft">
          Return to the campaign list to join or switch campaigns — you stay
          signed in.
        </p>
      </Section>

      <Section title="Sync">
        <p className={`text-sm font-semibold ${st.cls}`}>
          {st.text}
          {detail ? ` — ${detail}` : ""}
        </p>
      </Section>

      <Section title="App">
        {isInstalled ? (
          <p className="text-sm text-ok">This app is already installed.</p>
        ) : isIos || !hasNativeInstallPrompt ? (
          <p className="text-sm text-ink-soft">
            In Safari: tap Share, then choose “Add to Home Screen”.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              void promptInstall();
            }}
            className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px"
          >
            Install app
          </button>
        )}
      </Section>

      <Section title="Backup">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!campaign}
            onClick={() => exportCampaign()}
            className="flex-1 rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px disabled:opacity-40"
          >
            Export (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex-1 rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px"
          >
            Import
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const res = await importCampaign(f);
            if (!res.ok) alert(res.reason ?? "Import failed.");
            e.target.value = "";
          }}
        />
      </Section>

      <Section title="Account">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px"
        >
          Sign out
        </button>
      </Section>
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
        {title}
      </p>
      <div className="paper-card flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}
