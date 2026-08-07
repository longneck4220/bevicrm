import type { ReactNode } from "react";

/**
 * Isometric technical line figures.
 * Hairline strokes only, no fills, one teal accent per figure. Every figure is
 * drawn from the same axonometric projection so they read as one spec sheet.
 */

const S = 26; // grid unit in px
const COS30 = Math.cos(Math.PI / 6);

/** iso projection: grid (x, y, z) -> svg (px, py) */
function p(x: number, y: number, z: number): [number, number] {
  return [(x - y) * COS30 * S, (x + y) * 0.5 * S - z * S];
}

function poly(pts: [number, number, number][]) {
  return pts.map(([x, y, z]) => p(x, y, z).join(",")).join(" ");
}

function lineProps(a: [number, number, number], b: [number, number, number]) {
  const [x1, y1] = p(...a);
  const [x2, y2] = p(...b);
  return { x1, y1, x2, y2 };
}

/** A flat rhombus (top face) at height z, spanning w x d from the origin. */
function Plate({
  z,
  w = 2,
  d = 2,
  className = "",
}: {
  z: number;
  w?: number;
  d?: number;
  className?: string;
}) {
  return (
    <polygon
      points={poly([
        [0, 0, z],
        [w, 0, z],
        [w, d, z],
        [0, d, z],
      ])}
      className={className}
      fill="none"
    />
  );
}

function Cube({
  x,
  y,
  z = 0,
  s = 1,
  className = "",
}: {
  x: number;
  y: number;
  z?: number;
  s?: number;
  className?: string;
}) {
  const top = poly([
    [x, y, z + s],
    [x + s, y, z + s],
    [x + s, y + s, z + s],
    [x, y + s, z + s],
  ]);
  const left = poly([
    [x, y + s, z + s],
    [x + s, y + s, z + s],
    [x + s, y + s, z],
    [x, y + s, z],
  ]);
  const right = poly([
    [x + s, y, z + s],
    [x + s, y + s, z + s],
    [x + s, y + s, z],
    [x + s, y, z],
  ]);
  return (
    <g className={className} fill="none">
      <polygon points={top} />
      <polygon points={left} />
      <polygon points={right} />
    </g>
  );
}

function Frame({
  children,
  label,
  caption,
  viewBox = "-92 -78 184 168",
}: {
  children: ReactNode;
  label: string;
  caption: string;
  viewBox?: string;
}) {
  return (
    <figure className="fig">
      <figcaption className="fig-label">{label}</figcaption>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={caption}
        className="fig-svg"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <g className="stroke-foreground/22" strokeWidth={1}>
          {children}
        </g>
      </svg>
    </figure>
  );
}

/** FIG 0.1 — loose sheets: the raw dictated note, unsorted. */
export function FigureCapture() {
  const sheets = [0, 1, 2, 3, 4, 5];
  return (
    <Frame label="Fig 0.1 — Capture" caption="Loose sheets stacked in isometric projection">
      {sheets.map((i) => (
        <Plate
          key={i}
          z={i * 0.22}
          w={2.1}
          d={2.1}
          className={i === sheets.length - 1 ? "stroke-primary/70" : undefined}
        />
      ))}
      <line {...lineProps([0, 0, 0], [0, 0, 1.1])} strokeDasharray="2 3" />
      <line {...lineProps([2.1, 2.1, 0], [2.1, 2.1, 1.1])} strokeDasharray="2 3" />
    </Frame>
  );
}

/** FIG 0.2 — a reading plate lifting off a layered slab: interpretation. */
export function FigureSignal() {
  return (
    <Frame label="Fig 0.2 — Signal" caption="Reading plate separating from a layered core">
      <Plate z={2.05} w={2.2} d={2.2} className="stroke-primary/70" />
      <g className="stroke-primary/40">
        <ellipse cx={0} cy={-2.05 * S + 0.55 * S} rx={26} ry={14} fill="none" />
        <line x1={-26} y1={-38} x2={26} y2={-38} />
        <line x1={-22} y1={-32} x2={22} y2={-32} />
      </g>
      {[0, 0.34, 0.68, 1.02, 1.36].map((z) => (
        <Plate key={z} z={z} w={2.2} d={2.2} />
      ))}
      <line {...lineProps([0, 0, 1.42], [0, 0, 2.0])} strokeDasharray="2 3" />
      <line {...lineProps([2.2, 2.2, 1.42], [2.2, 2.2, 2.0])} strokeDasharray="2 3" />
    </Frame>
  );
}

/** FIG 0.3 — four blocks, one resolved: the decision set. */
export function FigureMove() {
  return (
    <Frame label="Fig 0.3 — Move" caption="Four solid blocks with one resolved in accent">
      <Cube x={0} y={1.15} s={1.15} />
      <Cube x={1.15} y={2.3} s={1.15} />
      <Cube x={2.3} y={1.15} s={1.15} />
      <Cube x={1.15} y={0} s={1.15} z={0.55} className="stroke-primary/75" />
    </Frame>
  );
}

/** FIG 0.4 — a rising fan of records: memory that compounds. */
export function FigureMemory() {
  const n = 9;
  return (
    <Frame label="Fig 0.4 — Memory" caption="Fanned records rising in isometric projection">
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const y = 2.4 - i * 0.26;
        const h = 0.35 + t * 1.75;
        return (
          <g key={i} className={i === n - 1 ? "stroke-primary/70" : undefined}>
            <polygon
              points={poly([
                [0.2, y, 0],
                [2.4, y, 0],
                [2.4, y, h],
                [0.2, y, h],
              ])}
              fill="none"
            />
          </g>
        );
      })}
    </Frame>
  );
}
