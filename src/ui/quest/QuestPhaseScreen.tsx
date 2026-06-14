import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "../Screen";

const QUEST_BACKGROUND = "/backgrounds/Wald.png";

/**
 * Quest flow phases share the forest background from the quest picker. The back
 * chevron returns to Camp without abandoning the quest — it stays active and can
 * be resumed from the Camp banner or the quest board.
 */
export function QuestPhaseScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Screen
      title={title}
      subtitle={subtitle}
      back
      onBack={() => navigate("/")}
      background={QUEST_BACKGROUND}
    >
      {children}
    </Screen>
  );
}
