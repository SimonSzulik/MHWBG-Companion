import { useRef, useState } from "react";
import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { isSupabaseConfigured } from "../lib/supabase";
import { useSyncStatus } from "../lib/sync/useSync";
import {
  createCloudCampaign,
  joinCloudCampaign,
  stopSync,
} from "../lib/sync/engine";
import { exportCampaign, importCampaign } from "../lib/backup";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  off: { text: "Nur lokal", cls: "text-ink-soft" },
  connecting: { text: "Verbinde…", cls: "text-warn" },
  live: { text: "● Live synchronisiert", cls: "text-ok" },
  error: { text: "Fehler", cls: "text-red-600" },
};

/** Settings: cloud sync (create/join), backup export/import, danger zone. */
export function Settings() {
  const campaign = useCampaign((s) => s.campaign);
  const resetCampaign = useCampaign((s) => s.resetCampaign);
  const { status, detail } = useSyncStatus();
  const [joinCode, setJoinCode] = useState("");
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const st = STATUS_LABEL[status] ?? STATUS_LABEL.off;

  return (
    <Screen title="Einstellungen" subtitle={campaign?.name}>
      {/* Cloud sync */}
      <Section title="Cloud-Sync">
        {!isSupabaseConfigured ? (
          <p className="text-sm text-ink-soft">
            Supabase ist nicht konfiguriert. Trage{" "}
            <code>VITE_SUPABASE_URL</code> und{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> ein, um geräteübergreifend zu
            synchronisieren. Bis dahin läuft alles lokal.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className={`text-sm font-semibold ${st.cls}`}>
              {st.text}
              {detail ? ` — ${detail}` : ""}
            </p>

            {status === "live" || status === "connecting" ? (
              <button
                type="button"
                onClick={() => void stopSync()}
                className="rounded-lg border-[1.5px] border-line-strong bg-card py-2 text-sm font-semibold active:translate-y-px"
              >
                Sync stoppen
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || !campaign}
                  onClick={async () => {
                    setBusy(true);
                    const code = await createCloudCampaign();
                    setShareCode(code);
                    setBusy(false);
                  }}
                  className="rounded-lg border-[1.5px] border-line-strong bg-accent py-2 text-sm font-semibold text-white active:translate-y-px disabled:opacity-40"
                >
                  Diese Kampagne in die Cloud stellen
                </button>

                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Beitritts-Code"
                    className="flex-1 rounded-lg border-[1.5px] border-line-strong bg-paper-2 px-3 py-2 text-sm uppercase outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy || joinCode.trim().length < 4}
                    onClick={async () => {
                      setBusy(true);
                      const ok = await joinCloudCampaign(joinCode);
                      if (!ok) alert("Beitritt fehlgeschlagen.");
                      setBusy(false);
                    }}
                    className="rounded-lg border-[1.5px] border-line-strong bg-card px-4 py-2 text-sm font-semibold active:translate-y-px disabled:opacity-40"
                  >
                    Beitreten
                  </button>
                </div>
              </>
            )}

            {shareCode && (
              <div className="rounded-lg border border-dashed border-accent/70 bg-accent-faint/50 px-3 py-2 text-center">
                <p className="text-xs text-ink-soft">Teile diesen Code:</p>
                <p className="font-display text-2xl tracking-widest">
                  {shareCode}
                </p>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Backup */}
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

      {/* Danger zone */}
      <Section title="Zurücksetzen">
        <button
          type="button"
          onClick={() => {
            if (confirm("Lokale Kampagne wirklich löschen?")) {
              void stopSync();
              resetCampaign();
            }
          }}
          className="rounded-lg border-[1.5px] border-red-600/40 bg-card py-2 text-sm font-semibold text-red-700 active:translate-y-px"
        >
          Lokale Kampagne löschen
        </button>
        <p className="mt-2 text-xs text-ink-soft">
          Löscht nur die Daten auf diesem Gerät. Eine in der Cloud geteilte
          Kampagne bleibt für andere bestehen.
        </p>
      </Section>
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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
