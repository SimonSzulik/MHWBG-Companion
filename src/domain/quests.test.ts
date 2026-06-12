import assert from "node:assert/strict";
import { questsForMonster } from "../data/quests";
import { canStartQuest } from "./quests";

function runQuestTests(): void {
  const jagrasQuests = questsForMonster("jagras");
  const quest = jagrasQuests[0]!;

  assert.equal(
    canStartQuest(quest, {}, false, jagrasQuests, null, true),
    false,
  );
  assert.equal(
    canStartQuest(quest, {}, false, jagrasQuests, null, false),
    true,
  );
}

runQuestTests();
