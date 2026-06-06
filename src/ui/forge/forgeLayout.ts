import { useEffect, useRef, useState } from "react";

export const NODE = 48;
export const RING = 3;
export const NODE_R = NODE / 2 + RING;
export const ROW_H = 88;
export const PAD_X = 12;
export const PAD_Y = 16;
export const NODE_WRAPPER_W = 100;
/** Equal inset from left/right canvas edge to outermost node centers. */
export const EDGE_FRAC = 0.12;
export const FORGE_COL_COUNT = 3;

export type Pt = { x: number; y: number };

/** Place `col` of `colCount` columns with symmetric horizontal margins. */
export function colX(col: number, colCount: number, width: number): number {
  const inner = width - PAD_X * 2;
  if (colCount <= 1) return width / 2;
  const frac = EDGE_FRAC + (col / (colCount - 1)) * (1 - 2 * EDGE_FRAC);
  return PAD_X + inner * frac;
}

export function rowCenterY(row: number): number {
  return PAD_Y + row * ROW_H + ROW_H / 2;
}

export function useForgeCanvasWidth(defaultWidth = 360) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(defaultWidth);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const next = el.clientWidth;
      if (next > 0) setWidth(next);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
