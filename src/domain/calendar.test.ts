import assert from "node:assert/strict";
import type { QuestDef } from "../data/quests";
import { recordQuestOnCalendar } from "./calendar";
import type { Campaign } from "./types";

function minimalCampaign(day = 5): Campaign {
  return {
    id: "test",
    name: "Test",
    box: "af",
    day,
    maxDay: 60,
    leaderId: "h1",
    hunters: [],
    zenny: 0,
    items: {},
    questCompletions: {},
    activeQuest: null,
    dayLog: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

const oneStar: QuestDef = {
  id: "great-jagras-1",
  name: "Great Jagras",
  monsterId: "jagras",
  stars: "one-star",
  icon: "jagras",
  type: "white-head",
};

const twoStar: QuestDef = {
  ...oneStar,
  id: "great-jagras-2",
  stars: "two-star",
};

function runCalendarTests(): void {
  let c = minimalCampaign(5);
  c = recordQuestOnCalendar(c, oneStar, "success");
  assert.equal(c.day, 6);
  assert.equal(c.dayLog[5]?.kind, "quest");
  if (c.dayLog[5]?.kind === "quest") {
    assert.equal(c.dayLog[5].monsterId, "jagras");
    assert.equal(c.dayLog[5].result, "success");
  }

  c = minimalCampaign(5);
  c = recordQuestOnCalendar(c, oneStar, "failure", false, {
    keepInvestigationLoot: false,
  });
  assert.equal(c.day, 5);
  assert.equal(c.dayLog[5], undefined);

  c = minimalCampaign(5);
  c = recordQuestOnCalendar(c, oneStar, "failure", false, {
    keepInvestigationLoot: true,
  });
  assert.equal(c.day, 6);
  assert.equal(c.dayLog[5]?.kind, "quest");
  if (c.dayLog[5]?.kind === "quest") {
    assert.equal(c.dayLog[5].result, "failure");
  }

  c = minimalCampaign(5);
  c = recordQuestOnCalendar(c, twoStar, "failure");
  assert.equal(c.day, 6);
  assert.equal(c.dayLog[5]?.kind, "quest");

  c = minimalCampaign(60);
  c = recordQuestOnCalendar(c, oneStar, "success");
  assert.equal(c.day, 60);
  assert.equal(c.dayLog[60]?.kind, "quest");

  const report = {
    questId: "great-jagras-2",
    investigationLoot: { h1: { "quality-bone": 1 } },
    rolledLoot: { h1: { "great-jagras-hide": 1 } },
  };
  c = minimalCampaign(7);
  c = recordQuestOnCalendar(c, twoStar, "success", false, { report });
  assert.equal(c.dayLog[7]?.kind, "quest");
  if (c.dayLog[7]?.kind === "quest") {
    assert.equal(c.dayLog[7].report?.questId, "great-jagras-2");
    assert.equal(c.dayLog[7].report?.rolledLoot.h1["great-jagras-hide"], 1);
  }
}

runCalendarTests();
