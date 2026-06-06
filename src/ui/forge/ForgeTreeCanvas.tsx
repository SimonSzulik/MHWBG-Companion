import { useEffect, type ReactNode } from "react";
import type { ForgeBranch, ForgeNode, ForgeRootGroup } from "../../domain/catalog";
import { layoutForgeTree } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { ForgeTreeNode } from "./ForgeTreeNode";

const NODE = 54;
const COL_W = 98;
const ROOT_W = 140;
const ROW_H = 124;
const ROOT_TOP = 28;
const BOTTOM_PAD = 84;

type Pt = { x: number; y: number };

type EdgeStyle = {
  stroke: string;
  width: number;
  flow: boolean;
  dash?: string;
  glow?: string;
};

function edgeStyle(node: ForgeNode): EdgeStyle {
  if (node.forged) {
    return { stroke: "#6fae62", width: 2.5, flow: false, glow: "0 0 3px rgba(111,174,98,0.6)" };
  }
  if (node.state === "craftable") {
    return {
      stroke: "#d9a72c",
      width: 2.5,
      flow: true,
      glow: "0 0 4px rgba(217,167,44,0.85)",
    };
  }
  if (node.state === "locked") {
    return { stroke: "rgba(255,255,255,0.1)", width: 2, flow: false, dash: "3 6" };
  }
  return { stroke: "rgba(255,255,255,0.22)", width: 2, flow: false };
}

export function ForgeTreeCanvas({
  group,
  onNodeClick,
}: {
  group: ForgeRootGroup;
  onNodeClick: (node: ForgeNode, branch?: ForgeBranch) => void;
}) {
  const layout = layoutForgeTree(group);
  const cols = layout.columns;
  const multi = cols.length > 1;
  const colCount = Math.max(1, cols.length);
  const W = colCount * COL_W;

  const rootCenter: Pt = { x: W / 2, y: ROOT_TOP + NODE / 2 };
  const colX = (bi: number) => (bi + 0.5) * COL_W;
  const nodeCenter = (bi: number, t: number): Pt => ({
    x: colX(bi),
    y: rootCenter.y + (t + 1) * ROW_H,
  });

  const maxNodes = cols.reduce((m, c) => Math.max(m, c.nodes.length), 0);
  const H = rootCenter.y + maxNodes * ROW_H + BOTTOM_PAD;

  const edges: { id: string; d: string; style: EdgeStyle }[] = [];
  cols.forEach((col, bi) => {
    let parent = rootCenter;
    col.nodes.forEach((n, t) => {
      const c = nodeCenter(bi, t);
      const from: Pt = { x: parent.x, y: parent.y + NODE / 2 };
      const to: Pt = { x: c.x, y: c.y - NODE / 2 };
      const my = (from.y + to.y) / 2;
      const d =
        from.x === to.x
          ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
          : `M ${from.x} ${from.y} C ${from.x} ${my} ${to.x} ${my} ${to.x} ${to.y}`;
      edges.push({ id: `${bi}-${t}`, d, style: edgeStyle(n) });
      parent = c;
    });
  });

  return (
    <div className="forge-graph overflow-x-auto p-2">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        <svg
          width={W}
          height={H}
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
          aria-hidden
        >
          {edges.map((e) => (
            <path
              key={e.id}
              d={e.d}
              fill="none"
              stroke={e.style.stroke}
              strokeWidth={e.style.width}
              strokeLinecap="round"
              strokeDasharray={e.style.dash}
              className={e.style.flow ? "forge-edge-flow" : undefined}
              style={e.style.glow ? { filter: `drop-shadow(${e.style.glow})` } : undefined}
            />
          ))}
        </svg>

        <NodeWrapper center={rootCenter} width={ROOT_W}>
          <ForgeTreeNode
            node={layout.root}
            size={NODE + 6}
            onClick={() => onNodeClick(layout.root)}
          />
        </NodeWrapper>

        {multi &&
          cols.map((col, bi) =>
            col.nodes.length > 0 ? (
              <BranchLabel
                key={`label-${col.branch.id}`}
                branch={col.branch}
                x={colX(bi)}
                y={nodeCenter(bi, 0).y - NODE / 2 - 16}
              />
            ) : null,
          )}

        {cols.map((col, bi) =>
          col.nodes.length === 0 ? (
            <NodeWrapper
              key={`empty-${col.branch.id}`}
              center={nodeCenter(bi, 0)}
              width={COL_W}
            >
              <BranchChip branch={col.branch} />
            </NodeWrapper>
          ) : (
            col.nodes.map((node, t) => (
              <NodeWrapper
                key={node.gear.id}
                center={nodeCenter(bi, t)}
                width={COL_W}
              >
                <ForgeTreeNode
                  node={node}
                  size={NODE}
                  onClick={() => onNodeClick(node, col.branch)}
                />
              </NodeWrapper>
            ))
          ),
        )}
      </div>
    </div>
  );
}

function NodeWrapper({
  center,
  width,
  children,
}: {
  center: Pt;
  width: number;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        width,
        left: center.x - width / 2,
        top: center.y - NODE / 2,
      }}
    >
      {children}
    </div>
  );
}

function BranchLabel({ branch, x, y }: { branch: ForgeBranch; x: number; y: number }) {
  return (
    <div
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-[rgba(255,255,255,0.12)] bg-[#2c2620] px-2 py-0.5"
      style={{ left: x, top: y }}
    >
      <img src={iconUrl(branch.icon)} alt="" className="h-3 w-3 object-contain" />
      <span className="text-[9px] font-semibold uppercase tracking-wide text-[#cabfa9]">
        {branch.label}
      </span>
    </div>
  );
}

function BranchChip({ branch }: { branch: ForgeBranch }) {
  if (branch.chosen) {
    return (
      <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[9px] font-bold text-ok">
        PFAD
      </span>
    );
  }
  if (branch.locked) {
    return (
      <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[9px] font-bold text-ink-soft">
        🔒
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-2 py-0.5 text-[9px] font-semibold text-[#cabfa9]">
      {branch.label}
    </span>
  );
}

/** Lock body scroll while sheet is open. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
