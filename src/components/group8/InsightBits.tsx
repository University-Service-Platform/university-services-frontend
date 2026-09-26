import React from 'react';

/**
 * Small, dependency-free chart pieces for Group 8 insight screens.
 * Single-series bars in the primary hue, value always printed beside the bar
 * (no colour-only encoding), hover title for exact numbers.
 */

export const StatTile: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="g8-stat">
    <span className="g8-stat-value">{value}</span>
    <span className="g8-stat-label">{label}</span>
    {hint && <span className="g8-muted g8-small">{hint}</span>}
  </div>
);

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  /** Optional maximum for this row (e.g. capacity); defaults to the largest value. */
  max?: number;
  valueLabel?: string;
}

export const HorizontalBars: React.FC<{ data: BarDatum[]; ariaLabel: string }> = ({ data, ariaLabel }) => {
  const largest = Math.max(1, ...data.map((datum) => datum.max ?? datum.value));
  return (
    <ul className="g8-bars" aria-label={ariaLabel}>
      {data.map((datum) => {
        const scale = datum.max ?? largest;
        const width = scale > 0 ? Math.min(datum.value / scale, 1) * 100 : 0;
        const text = datum.valueLabel ?? String(datum.value);
        return (
          <li key={datum.key} className="g8-bar-row">
            <span className="g8-bar-label" title={datum.label}>
              {datum.label}
            </span>
            <span className="g8-bar-track" aria-hidden="true" title={`${datum.label}: ${text}`}>
              <span className="g8-bar-fill" style={{ width: `${width}%` }} />
            </span>
            <span className="g8-bar-value">{text}</span>
          </li>
        );
      })}
    </ul>
  );
};
