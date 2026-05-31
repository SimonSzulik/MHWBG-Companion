import { Screen } from "../ui/Screen";
import { useCampaign } from "../store/campaign";
import { wildspireHunts } from "../data/hunts";
import { catalog } from "../domain/catalog";

/** Campaign drill-in: day tracker + hunt checklist. */
export function CampaignScreen() {
  const campaign = useCampaign((s) => s.campaign);
  const setDay = useCampaign((s) => s.setDay);
  const toggleHunt = useCampaign((s) => s.toggleHunt);
  if (!campaign) return null;

  const done = Object.values(campaign.huntsCompleted).filter(Boolean).length;

  return (
    <Screen title="Kampagne" subtitle={campaign.name}>
      <div className="paper-card flex items-center justify-between px-4 py-4">
        <div>
          <p className="font-display text-2xl leading-none">Tag {campaign.day}</p>
          <p className="text-sm text-ink-soft">von {campaign.maxDay}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDay(campaign.day - 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-paper-2 font-bold active:translate-y-px"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setDay(campaign.day + 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-line-strong bg-accent font-bold text-white active:translate-y-px"
          >
            +
          </button>
        </div>
      </div>

      <p className="mb-2 mt-5 px-1 text-xs uppercase tracking-wide text-accent">
        Jagden · {done}/{wildspireHunts.length}
      </p>
      <div className="flex flex-col gap-2">
        {wildspireHunts
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((h) => {
            const completed = !!campaign.huntsCompleted[h.id];
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggleHunt(h.id)}
                className="paper-card flex items-center gap-3 px-4 py-3 text-left active:translate-y-px"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-[1.5px] border-line-strong text-sm ${
                    completed ? "bg-ok text-white" : "bg-paper-2"
                  }`}
                >
                  {completed ? "✓" : ""}
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate font-medium ${
                      completed ? "text-ink-soft line-through" : ""
                    }`}
                  >
                    {h.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {catalog.monster(h.monsterId)?.kind} · {h.objective}
                  </p>
                </div>
              </button>
            );
          })}
      </div>
    </Screen>
  );
}
