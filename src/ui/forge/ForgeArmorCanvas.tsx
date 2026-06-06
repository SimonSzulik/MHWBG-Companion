import type { ReactNode } from "react";
import type { ForgeArmorSetRow, ForgeNode } from "../../domain/catalog";
import { ForgeTreeNode } from "./ForgeTreeNode";
import { forgeEdgeStyle, type ForgeEdgeStyle } from "./forgeTheme";
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

type LayoutNode = {
  node: ForgeNode;
  row: ForgeArmorSetRow;
  center: Pt;
  key: string;
};

function edgePath(from: Pt, to: Pt): string {
  const start: Pt = { x: from.x + NODE_R, y: from.y };
  const end: Pt = { x: to.x - NODE_R, y: to.y };
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

function buildLayout(rows: ForgeArmorSetRow[], width: number) {
  const height = PAD_Y * 2 + Math.max(1, rows.length) * ROW_H;
  const nodes: LayoutNode[] = [];
  const edges: { id: string; d: string; style: ForgeEdgeStyle }[] = [];

  rows.forEach((row, ri) => {
    const y = rowCenterY(ri);
    const centers = row.nodes.map(
      (_, ci): Pt => ({ x: colX(ci, FORGE_COL_COUNT, width), y }),
    );

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
        style: forgeEdgeStyle(row.nodes[i]),
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
  const { ref, width } = useForgeCanvasWidth();
  const { nodes, edges, height } = buildLayout(rows, width);

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
              onClick={() => onNodeClick(ln.node, ln.row)}
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
