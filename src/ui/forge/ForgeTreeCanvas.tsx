import { useEffect, type ReactNode } from "react";
import type { ForgeBranch, ForgeNode, ForgeRootGroup } from "../../domain/catalog";
import { ForgeTreeNode } from "./ForgeTreeNode";
import {
  colX,
  FORGE_COL_COUNT,
  NODE,
  NODE_R,
  NODE_WRAPPER_W,
  PAD_Y,
  ROW_H,
  rowCenterY,
  useForgeCanvasWidth,
  type Pt,
} from "./forgeLayout";

type EdgeStyle = {
  stroke: string;
  width: number;
  flow: boolean;
  dash?: string;
  glow?: string;
};

type LayoutNode = {
  node: ForgeNode;
  branch?: ForgeBranch;
  group: ForgeRootGroup;
  center: Pt;
  key: string;
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

/** Horizontal edge from right of `from` to left of `to`, stopping at node borders. */
function edgePath(from: Pt, to: Pt): string {
  const start: Pt = { x: from.x + NODE_R, y: from.y };
  const end: Pt = { x: to.x - NODE_R, y: to.y };
  if (Math.abs(start.y - end.y) < 1) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  const mx = (start.x + end.x) / 2;
  return `M ${start.x} ${start.y} C ${mx} ${start.y} ${mx} ${end.y} ${end.x} ${end.y}`;
}

function buildLayout(groups: ForgeRootGroup[], width: number) {
  const rows: { group: ForgeRootGroup; branch: ForgeBranch; row: number }[] = [];
  for (const group of groups) {
    for (const branch of group.branches) {
      rows.push({ group, branch, row: rows.length });
    }
  }

  const groupRowRange = new Map<string, { start: number; end: number }>();
  let rowIdx = 0;
  for (const group of groups) {
    const start = rowIdx;
    const end = rowIdx + group.branches.length - 1;
    groupRowRange.set(group.rootId, { start, end });
    rowIdx += group.branches.length;
  }

  const height = PAD_Y * 2 + Math.max(1, rows.length) * ROW_H;
  const nodes: LayoutNode[] = [];
  const rootCenters = new Map<string, Pt>();

  for (const group of groups) {
    const range = groupRowRange.get(group.rootId);
    if (!range) continue;
    const y =
      range.start === range.end
        ? rowCenterY(range.start)
        : (rowCenterY(range.start) + rowCenterY(range.end)) / 2;
    const center: Pt = { x: colX(0, FORGE_COL_COUNT, width), y };
    rootCenters.set(group.rootId, center);
    nodes.push({
      node: group.root,
      group,
      center,
      key: `root-${group.rootId}`,
    });
  }

  for (const { group, branch, row } of rows) {
    branch.nodes.forEach((node, tierIdx) => {
      nodes.push({
        node,
        branch,
        group,
        center: {
          x: colX(tierIdx + 1, FORGE_COL_COUNT, width),
          y: rowCenterY(row),
        },
        key: node.gear.id,
      });
    });
  }

  const edges: { id: string; d: string; style: EdgeStyle }[] = [];
  for (const { group, branch, row } of rows) {
    const rootCenter = rootCenters.get(group.rootId);
    if (!rootCenter) continue;

    let parent = rootCenter;
    branch.nodes.forEach((node, tierIdx) => {
      const childCenter: Pt = {
        x: colX(tierIdx + 1, FORGE_COL_COUNT, width),
        y: rowCenterY(row),
      };
      edges.push({
        id: `${branch.id}-${tierIdx}`,
        d: edgePath(parent, childCenter),
        style: edgeStyle(node),
      });
      parent = childCenter;
    });
  }

  return { nodes, edges, height };
}

export function ForgeTreeCanvas({
  groups,
  onNodeClick,
}: {
  groups: ForgeRootGroup[];
  onNodeClick: (node: ForgeNode, branch?: ForgeBranch, group?: ForgeRootGroup) => void;
}) {
  const { ref, width } = useForgeCanvasWidth();
  const { nodes, edges, height } = buildLayout(groups, width);

  return (
    <div className="forge-graph overflow-x-hidden p-2">
      <div ref={ref} className="relative mx-auto w-full" style={{ height }}>
        <svg
          width={width}
          height={height}
          className="absolute inset-0 w-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
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
              strokeLinecap="butt"
              strokeDasharray={e.style.dash}
              className={e.style.flow ? "forge-edge-flow" : undefined}
              style={e.style.glow ? { filter: `drop-shadow(${e.style.glow})` } : undefined}
            />
          ))}
        </svg>

        {nodes.map((ln) => (
          <NodeWrapper key={ln.key} center={ln.center}>
            <ForgeTreeNode
              node={ln.node}
              size={NODE}
              onClick={() => onNodeClick(ln.node, ln.branch, ln.group)}
            />
          </NodeWrapper>
        ))}
      </div>
    </div>
  );
}

function NodeWrapper({
  center,
  children,
}: {
  center: Pt;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        width: NODE_WRAPPER_W,
        left: center.x - NODE_WRAPPER_W / 2,
        top: center.y - NODE / 2,
      }}
    >
      {children}
    </div>
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
