'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SliceProbChart.module.css';

interface SliceProbChartProps {
  sliceScores: number[];
  peakSliceIndex: number;
  currentSliceIndex: number;
  findingName: string;
  triggerPulse?: boolean;
}

export default function SliceProbChart({
  sliceScores,
  peakSliceIndex,
  currentSliceIndex,
  findingName,
  triggerPulse = false,
}: SliceProbChartProps) {
  const [pulsing, setPulsing] = useState(false);
  const pulseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (triggerPulse) {
      setPulsing(true);
      if (pulseRef.current) clearTimeout(pulseRef.current);
      pulseRef.current = setTimeout(() => setPulsing(false), 1200);
    }
    return () => { if (pulseRef.current) clearTimeout(pulseRef.current); };
  }, [triggerPulse]);

  const W = 100; // SVG viewBox width %
  const H = 80;
  const PAD_L = 32, PAD_R = 12, PAD_T = 8, PAD_B = 20;
  const n = sliceScores.length;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const xOf = (i: number) => PAD_L + (i / (n - 1)) * chartW;
  const yOf = (v: number) => PAD_T + (1 - v) * chartH;

  // Build SVG path
  const points = sliceScores.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
  const linePath = `M ${points.join(' L ')}`;

  // Area fill
  const areaPath = `M ${xOf(0)},${yOf(0)} ${points.map(p => `L ${p}`).join(' ')} L ${xOf(n - 1)},${PAD_T + chartH} L ${xOf(0)},${PAD_T + chartH} Z`;

  const peakX = xOf(peakSliceIndex);
  const peakY = yOf(sliceScores[peakSliceIndex] ?? 0);
  const curX = xOf(currentSliceIndex);

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>Slice Probability Strip</span>
        <span className={styles.finding}>{findingName}</span>
        <span className={styles.peakLabel}>
          Peak: slice {peakSliceIndex + 1} ({((sliceScores[peakSliceIndex] ?? 0) * 100).toFixed(0)}%)
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <filter id="peakGlow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Y grid lines */}
        {yTicks.map(t => (
          <line
            key={t}
            x1={PAD_L} y1={yOf(t).toFixed(1)}
            x2={W - PAD_R} y2={yOf(t).toFixed(1)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map(t => (
          <text
            key={`yl${t}`}
            x={PAD_L - 3}
            y={(yOf(t) + 1).toFixed(1)}
            textAnchor="end"
            fontSize="5"
            fill="rgba(140,163,194,0.7)"
          >
            {(t * 100).toFixed(0)}
          </text>
        ))}

        {/* X axis label */}
        <text x={PAD_L + chartW / 2} y={H - 2} textAnchor="middle" fontSize="4.5" fill="rgba(140,163,194,0.6)">
          Slice index (0–{n - 1})
        </text>

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round" />

        {/* All data points (small) */}
        {sliceScores.map((v, i) => (
          <circle
            key={i}
            cx={xOf(i).toFixed(1)}
            cy={yOf(v).toFixed(1)}
            r="0.9"
            fill="#3b82f6"
            opacity="0.5"
          />
        ))}

        {/* Current slice vertical indicator */}
        <line
          x1={curX.toFixed(1)} y1={PAD_T}
          x2={curX.toFixed(1)} y2={PAD_T + chartH}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.8"
          strokeDasharray="2,2"
        />

        {/* Peak marker */}
        <circle
          cx={peakX.toFixed(1)}
          cy={peakY.toFixed(1)}
          r={pulsing ? '5' : '3.5'}
          fill="#f59e0b"
          filter={pulsing ? 'url(#peakGlow)' : undefined}
          opacity={pulsing ? '0.9' : '1'}
          className={pulsing ? styles.peakPulse : ''}
        />
        <circle
          cx={peakX.toFixed(1)}
          cy={peakY.toFixed(1)}
          r="2"
          fill="#fff"
        />
        <text
          x={(peakX + 2.5).toFixed(1)}
          y={(peakY - 3).toFixed(1)}
          fontSize="4.5"
          fill="#f59e0b"
          fontWeight="600"
        >
          peak
        </text>
      </svg>
    </div>
  );
}
