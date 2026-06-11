import type { ReactNode } from "react";
import { Screen } from "../Screen";

const QUEST_BACKGROUND = "/backgrounds/Wald.png";

/** Quest flow phases share the forest background from the quest picker. */
export function QuestPhaseScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Screen
      title={title}
      subtitle={subtitle}
      back={false}
      background={QUEST_BACKGROUND}
    >
      {children}
    </Screen>
  );
}
