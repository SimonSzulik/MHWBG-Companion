import type { ForgeBranch, ForgeNode } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { ForgeNodeBadge } from "./ForgeDetails";

export function ForgeTreeNode({
  node,
  branch,
  onClick,
}: {
  node: ForgeNode;
  branch?: ForgeBranch;
  onClick: () => void;
}) {
  const gear = node.gear;
  const icon = gear.tierIcon ?? gear.pathIcon ?? "";
  const pct = Math.round(node.materialProgress * 100);
  const locked = node.state === "locked" || branch?.locked;
  const craftable = node.state === "craftable";
  const forged = node.forged;

  const ringColor = forged
    ? "var(--color-ok)"
    : craftable
      ? "var(--color-accent)"
      : "var(--color-line-strong)";

  const fillDeg = forged ? 360 : node.materialProgress * 360;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center gap-1.5 active:scale-95 ${
        locked ? "opacity-50" : ""
      }`}
    >
      <div
        className={`relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full p-[3px] ${
          craftable ? "shadow-[0_0_12px_rgba(201,162,39,0.45)]" : ""
        }`}
        style={{
          background: `conic-gradient(${ringColor} ${fillDeg}deg, var(--color-line) ${fillDeg}deg)`,
        }}
      >
        <div
          className={`flex h-full w-full items-center justify-center rounded-full border-2 bg-card ${
            forged
              ? "border-ok"
              : craftable
                ? "border-accent"
                : "border-line-strong"
          }`}
        >
          {icon ? (
            <img src={iconUrl(icon)} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <span className="text-xs font-bold text-ink-soft">?</span>
          )}
        </div>
        {craftable && (
          <span className="absolute -right-0.5 -top-0.5 text-sm">🔨</span>
        )}
        {!node.prerequisiteMet && !forged && (
          <span className="absolute -left-0.5 -top-0.5 text-[10px]">🔒</span>
        )}
      </div>
      <p className="max-w-[5.5rem] truncate text-center text-[11px] font-semibold leading-tight">
        {gear.name}
      </p>
      <ForgeNodeBadge node={node} />
      {!forged && node.state === "pending" && node.prerequisiteMet && (
        <span className="text-[10px] tabular-nums text-ink-soft">{pct}%</span>
      )}
      {branch && (
        <span className="flex items-center gap-0.5 text-[9px] text-ink-soft">
          <img src={iconUrl(branch.icon)} alt="" className="h-3 w-3 object-contain" />
          {branch.label}
        </span>
      )}
    </button>
  );
}
