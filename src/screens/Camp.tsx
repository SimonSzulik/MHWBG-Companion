import { useState } from "react";
import { Link } from "react-router-dom";
import { useCampaign } from "../store/campaign";
import { useAuth } from "../store/auth";
import { useOwnHunter } from "../store/hooks";
import { otherHunters } from "../lib/hunter";
import { catalog, hunterTotalDefense } from "../domain/catalog";
import { ScreenBackground } from "../ui/ScreenBackground";
import { CampaignCalendar } from "../ui/CampaignCalendar";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { GearSlotIcons } from "../ui/GearSlotIcons";
import type { GearSlot } from "../domain/types";

const EQUIP_SLOTS: GearSlot[] = ["weapon", "head", "chest", "legs"];

/** Camp hub: character overview, gear, skills, calendar, party + quest/downtime. */
export function Camp() {
  const { campaign, hunter } = useOwnHunter();
  const adjustItem = useCampaign((s) => s.adjustItem);
  const userId = useAuth((s) => s.userId);
  const [confirmPotion, setConfirmPotion] = useState(false);
  if (!campaign || !hunter) return null;

  const potions = campaign.items["potion"] ?? 0;
  const teammates = otherHunters(campaign, userId);
  const totalDef = hunterTotalDefense(hunter);
  const skills = Object.values(hunter.equipped)
    .map((id) => (id ? catalog.gear(id) : undefined))
    .map((g) => g?.effect)
    .filter((effect): effect is string => Boolean(effect));

  const usePotion = () => {
    adjustItem("potion", -1);
    setConfirmPotion(false);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-24 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <ScreenBackground
        src="/backgrounds/camp.webp"
        fallback="/backgrounds/camp.svg"
      />

      {/* 1 · status strip — profile + name (tap → settings), armour value */}
      <div className="paper-card flex items-center gap-3 px-3 py-2.5">
        <Link
          to="/settings"
          aria-label="Einstellungen"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-2xl active:translate-y-px"
        >
          🧍
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate text-2xl leading-none">
            {hunter.name}
          </p>
          <p className="truncate text-xs text-ink-soft">{hunter.weaponType}</p>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5"
          title="Verteidigung"
        >
          <span className="text-xl leading-none">🛡️</span>
          <span className="font-display text-3xl leading-none">{totalDef}</span>
        </div>
      </div>

      {/* 2 · quest / downtime choice */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/campaign/quests"
          className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-line-strong bg-accent py-3.5 font-semibold text-white active:translate-y-px"
        >
          <img src="/icons/quest.png" alt="" className="h-7 w-7 object-contain" />{" "}
          Quest
        </Link>
        <Link
          to="/campaign/downtime"
          className="flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-line-strong bg-paper-2 py-3.5 font-semibold active:translate-y-px"
        >
          <span className="text-xl leading-none">🏠</span> Downtime
        </Link>
      </div>

      {/* 3 + 4 · equipment & skills (left) | calendar (right, equal height) */}
      <div className="mt-3 grid min-h-[15rem] grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          <Link
            to="/hunters"
            aria-label="Ausrüstung im Jäger-Menü bearbeiten"
            className="paper-card block px-3 py-2.5 active:translate-y-px"
          >
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Ausrüstung
            </p>
            <GearSlotIcons hunter={hunter} slots={EQUIP_SLOTS} />
          </Link>

          <div className="paper-card flex min-h-0 flex-1 flex-col px-3 py-2.5">
            <p className="text-xs uppercase tracking-wide text-accent">
              Aktive Fähigkeiten
            </p>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              {skills.length === 0 ? (
                <p className="text-sm text-ink-soft">Keine aktiven Fähigkeiten.</p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {skills.map((skill, i) => (
                    <li key={i} className="leading-snug">
                      • {skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="paper-card flex flex-col px-3 py-2.5">
          <CampaignCalendar
            day={campaign.day}
            maxDay={campaign.maxDay}
            dayLog={campaign.dayLog ?? {}}
            cols={5}
            right={
              <button
                type="button"
                disabled={potions <= 0}
                onClick={() => setConfirmPotion(true)}
                aria-label="Trank verbrauchen"
                className="flex items-center gap-1 rounded-full border-[1.5px] border-line-strong bg-card px-2 py-0.5 active:translate-y-px disabled:opacity-50"
              >
                <img src="/icons/potion.png" alt="" className="h-5 w-5" />
                <span className="text-sm font-bold tabular-nums">{potions}</span>
              </button>
            }
          />
        </div>
      </div>

      {/* 5 · party */}
      {teammates.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs uppercase tracking-wide text-accent">
            Mitspieler · {teammates.length}
          </p>
          <div className="flex flex-wrap gap-4">
            {teammates.map((mate) => (
              <div
                key={mate.id}
                className="flex w-16 flex-col items-center gap-1 text-center"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full border-[1.5px] border-line-strong bg-paper-2 text-3xl shadow-sm">
                  🧍
                </span>
                <span className="w-full truncate text-xs font-medium">
                  {mate.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmPotion && (
        <ConfirmDialog
          title="Trank verbrauchen?"
          message="Tränke kommen aus dem gemeinsamen Gruppen-Vorrat. Wirklich einen Trank verbrauchen?"
          onConfirm={usePotion}
          onCancel={() => setConfirmPotion(false)}
        />
      )}
    </div>
  );
}
