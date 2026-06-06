import type { ReactNode } from "react";
import type { ForgeArmorSetRow, ForgeNode } from "../../domain/catalog";
import { iconUrl } from "../../domain/icons";
import { ForgeTreeNode } from "./ForgeTreeNode";

const NODE = 48;
const RING = 3;
const NODE_R = NODE / 2 + RING;
const ROW_H = 88;
const PAD_X = 12;
const PAD_Y = 16;
const LABEL_W = 72;
const NODE_COLS = [0.32, 0.58, 0.84] as const;

type Pt = { x: number; y: number };

type EdgeStyle = {
  stroke: string;
  width: number;
  flow: boolean;
  dash?: string;
  glow?: string;
};

type LayoutNode = {
  node: ForgeNode;
  row: ForgeArmorSetRow;
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
  return { stroke: "rgba(255,255,255,0.22)", width: 2, flow: false };
}

function nodeX(col: number, width: number): number {
  const inner = width - PAD_X * 2 - LABEL_W;
  const frac = NODE_COLS[col] ?? NODE_COLS[NODE_COLS.length - 1];
  return PAD_X + LABEL_W + inner * frac;
}

function rowCenterY(row: number): number {
  return PAD_Y + row * ROW_H + ROW_H / 2;
}

function edgePath(from: Pt, to: Pt): string {
  const start: Pt = { x: from.x + NODE_R, y: from.y };
  const end: Pt = { x: to.x - NODE_R, y: to.y };
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function buildLayout(rows: ForgeArmorSetRow[], width: number) {
  const height = PAD_Y * 2 + Math.max(1, rows.length) * ROW_H;
  const nodes: LayoutNode[] = [];
  const edges: { id: string; d: string; style: EdgeStyle }[] = [];

  rows.forEach((row, ri) => {
    const y = rowCenterY(ri);
    const centers = row.nodes.map((_, ci): Pt => ({ x: nodeX(ci, width), y }));

    row.nodes.forEach((node, ci) => {
      nodes.push({
        node,
        row,
        center: centers[ci],
        key: `${row.set.id}-${node.gear.id}`,
      });
    });

    for (let i = 1; i < centers.length; i++) {
      edges.push({
        id: `${row.set.id}-edge-${i}`,
        d: edgePath(centers[i - 1], centers[i]),
        style: edgeStyle(row.nodes[i]),
      });
    }
  });

  return { nodes, edges, height };
}

export function ForgeArmorCanvas({
  rows,
  onNodeClick,
}: {
  rows: ForgeArmorSetRow[];
  onNodeClick: (node: ForgeNode, row: ForgeArmorSetRow) => void;
}) {
  const width = 360;
  const { nodes, edges, height } = buildLayout(rows, width);

  return (
    <div className="forge-graph overflow-x-hidden p-2">
      <div className="relative mx-auto w-full max-w-[360px]" style={{ height }}>
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

        {rows.map((row, ri) => (
          <SetLabel key={row.set.id} row={row} y={rowCenterY(ri)} />
        ))}

        {nodes.map((ln) => (
          <NodeWrapper key={ln.key} center={ln.center} width={100}>
            <ForgeTreeNode
              node={ln.node}
              size={NODE}
              onClick={() => onNodeClick(ln.node, ln.row)}
            />
          </NodeWrapper>
        ))}
      </div>
    </div>
  );
}

function SetLabel({ row, y }: { row: ForgeArmorSetRow; y: number }) {
  return (
    <div
      className="absolute flex flex-col items-center justify-center gap-0.5"
      style={{
        left: PAD_X,
        top: y - 28,
        width: LABEL_W - 8,
      }}
    >
      <img
        src={iconUrl(row.set.icon)}
        alt=""
        className="h-9 w-9 object-contain"
      />
      <span className="max-w-full truncate text-center text-[9px] font-semibold uppercase tracking-wide text-[#cabfa9]">
        {row.set.label}
      </span>
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
