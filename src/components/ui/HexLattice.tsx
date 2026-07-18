import React, { useCallback, useMemo, useRef, useState } from "react";
import { playHoverBlip, playPinClick } from "../../lib/soundEngine";

interface Cell {
  q: number;
  r: number;
  cx: number;
  cy: number;
  d: string;
}

const R = 17; // hex circumradius
const H = (R * Math.sqrt(3)) / 2;

function hexPath(cx: number, cy: number, r: number) {
  return `M ${cx} ${cy - r} L ${cx + (r * Math.sqrt(3)) / 2} ${cy - r / 2} L ${cx + (r * Math.sqrt(3)) / 2} ${cy + r / 2} L ${cx} ${cy + r} L ${cx - (r * Math.sqrt(3)) / 2} ${cy + r / 2} L ${cx - (r * Math.sqrt(3)) / 2} ${cy - r / 2} Z`;
}

/**
 * A honeycomb cluster that responds to the cursor: cells within a falling-off
 * radius light up, and clicking sends a ripple outward from the struck cell.
 *
 * This is deliberately ornamental — it replaced a "gadget matrix" of buttons
 * that implied capabilities the app does not have. Every route that dial
 * exposed (crypto lab, encoding deck, evidence board) is reachable from the
 * sidebar, so nothing became unreachable.
 *
 * Hover distance is computed in SVG space from a single pointer position held
 * in state; there is no per-cell listener and no animation loop.
 */
export default function HexLattice({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const lastBlip = useRef(0);

  const W = 240;
  const HT = 190;

  // Hex-grid cluster, trimmed to a rough circle so it reads as a cluster
  // rather than a rectangle of cells.
  const cells = useMemo<Cell[]>(() => {
    const out: Cell[] = [];
    const cols = Math.ceil(W / (H * 2)) + 2;
    const rows = Math.ceil(HT / (R * 1.5)) + 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * H * 2 + (row % 2 ? H : 0);
        const cy = row * R * 1.5;
        const dx = (cx - W / 2) / (W / 2);
        const dy = (cy - HT / 2) / (HT / 2);
        if (dx * dx + dy * dy > 1.05) continue;
        out.push({ q: col, r: row, cx, cy, d: hexPath(cx, cy, R - 1.5) });
      }
    }
    return out;
  }, []);

  const toLocal = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * HT,
    };
  }, []);

  const handleMove = useCallback(
    (e: React.PointerEvent) => {
      const p = toLocal(e);
      if (!p) return;
      setPointer(p);
      // Throttle the hover cue hard — this fires on every pointer move.
      const now = performance.now();
      if (now - lastBlip.current > 420) {
        lastBlip.current = now;
        playHoverBlip();
      }
    },
    [toLocal],
  );

  const handleDown = useCallback(
    (e: React.PointerEvent) => {
      const p = toLocal(e);
      if (!p) return;
      playPinClick();
      setRipple({ ...p, id: Date.now() });
    },
    [toLocal],
  );

  return (
    <svg
      ref={svgRef}
      className={`w-full h-full cursor-crosshair touch-none ${className}`}
      viewBox={`0 0 ${W} ${HT}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={handleMove}
      onPointerLeave={() => setPointer(null)}
      onPointerDown={handleDown}
      role="presentation"
    >
      {cells.map((c, i) => {
        let intensity = 0.08;
        if (pointer) {
          const dist = Math.hypot(c.cx - pointer.x, c.cy - pointer.y);
          // Falls off over ~3 cells.
          intensity = Math.max(0.08, 1 - dist / 62);
        }
        return (
          <path
            key={i}
            d={c.d}
            fill="var(--color-accent-primary)"
            fillOpacity={intensity * 0.22}
            stroke="var(--color-accent-primary)"
            strokeOpacity={0.15 + intensity * 0.75}
            strokeWidth={0.8 + intensity * 0.9}
            style={{ transition: "fill-opacity 180ms ease-out, stroke-opacity 180ms ease-out" }}
          />
        );
      })}

      {/* Click ripple — a single expanding ring, keyed so each strike restarts it. */}
      {ripple && (
        <circle
          key={ripple.id}
          cx={ripple.x}
          cy={ripple.y}
          fill="none"
          stroke="var(--color-accent-primary)"
          strokeWidth={1.5}
          className="hex-lattice-ripple"
          onAnimationEnd={() => setRipple(null)}
        />
      )}
    </svg>
  );
}
