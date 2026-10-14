const WIDTH = 96;
const HEIGHT = 32;
const PAD = 4;

/** The latest prices as a small line, the last one marked. Decoration: the figures it shows
 *  are written next to it. */
export function Sparkline({ values }: { values: readonly number[] }) {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const spread = Math.max(...values) - low || 1;
  const points = values.map((value, index) => [
    PAD + (index / (values.length - 1)) * (WIDTH - 2 * PAD),
    HEIGHT - PAD - ((value - low) / spread) * (HEIGHT - 2 * PAD),
  ]);
  const [lastX, lastY] = points.at(-1) ?? [0, 0];
  return (
    <svg aria-hidden="true" width={WIDTH} height={HEIGHT} className="shrink-0">
      <polyline
        points={points.map((point) => point.join(',')).join(' ')}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-chart"
      />
      <circle cx={lastX} cy={lastY} r={3.5} strokeWidth={2} className="fill-chart stroke-surface" />
    </svg>
  );
}
