import type { ReactNode } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { useSyncStatus } from "../lib/sync/useSync";
import { stopSync } from "../lib/sync/engine";
import { exportCampaign, importCampaign } from "../lib/backup";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  off: { text: "Getrennt", cls: "text-ink-soft" },
  connecting: { text: "Verbinde…", cls: "text-warn" },
  live: { text: "● Live synchronisiert", cls: "text-ok" },
  error: { text: "Fehler", cls: "text-red-600" },
};

/** Settings: sync status, join code, backup, logout. */
export function Settings() {
  const nav = useNavigate();
  const campaign = useCampaign((s) => s.campaign);
  const resetCampaign = useCampaign((s) => s.resetCampaign);
  const signOut = useAuth((s) => s.signOut);
  const { status, detail } = useSyncStatus();
  const fileInput = useRef<HTMLInputElement>(null);

  const st = STATUS_LABEL[status] ?? STATUS_LABEL.off;

  const logout = async () => {
    if (!confirm("Abmelden und Kampagne verlassen?")) return;
    await stopSync();
    resetCampaign();
    await signOut();
    nav("/login", { replace: true });
  };

  return (
    <Screen title="Einstellungen" subtitle={campaign?.name}>
      <Section title="Sync">
        <p className={`text-sm font-semibold ${st.cls}`}>
          {st.text}
          {detail ? ` — ${detail}` : ""}
        </p>
        {campaign?.joinCode && (
          <div className="rounded-lg border border-dashed border-accent/70 bg-accent-faint/50 px-3 py-2 text-center">
            <p className="text-xs text-ink-soft">
              Teile diesen Code, damit andere der Kampagne beitreten können:
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
              Code kopieren
            </button>
          </div>
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
            Exportieren (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex-1 rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px"
          >
            Importieren
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
            if (!res.ok) alert(res.reason ?? "Import fehlgeschlagen.");
            e.target.value = "";
          }}
        />
      </Section>

      <Section title="Konto">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px"
        >
          Abmelden
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
