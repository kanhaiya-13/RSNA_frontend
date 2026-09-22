'use client';

import { useCallback, useRef } from 'react';
import { Series } from '@/data/mockData';
import { useAppState } from '@/context/AppStateContext';
import MRICanvas from './MRICanvas';
import styles from './ImageViewer.module.css';

interface ImageViewerProps {
  caseId: string;
  series: Series[];
  aiSignalShown: boolean;
}

export default function ImageViewer({ caseId, series, aiSignalShown }: ImageViewerProps) {
  const { getCaseLocalState, setActiveSeries, setCurrentSlice, setAiSignal } = useAppState();
  const local = getCaseLocalState(caseId);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSeries = series.find(s => s.seriesId === local.activeSeriesId) ?? series[0];
  const sliceCount = activeSeries?.sliceCount ?? 24;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(sliceCount - 1, local.currentSliceIndex + delta));
    setCurrentSlice(caseId, next);
  }, [caseId, local.currentSliceIndex, sliceCount, setCurrentSlice]);

  const planes: Array<'sagittal' | 'coronal' | 'axial'> = ['sagittal', 'coronal', 'axial'];

  return (
    <div className={styles.viewer}>
      {/* Top toolbar */}
      <div className={styles.toolbar}>
        {/* Series switcher */}
        <div className={styles.seriesTabs}>
          {planes.map(plane => {
            const s = series.find(s => s.plane === plane);
            const missing = !s;
            return (
              <button
                key={plane}
                id={`series-tab-${plane}`}
                className={`${styles.seriesTab} ${activeSeries?.plane === plane ? styles.seriesTabActive : ''} ${missing ? styles.seriesTabDisabled : ''}`}
                disabled={missing}
                onClick={() => s && setActiveSeries(caseId, s.seriesId)}
                title={missing ? `${plane} series not available` : plane}
              >
                <span className={styles.planeLabel}>{plane.charAt(0).toUpperCase() + plane.slice(1)}</span>
                {missing && <span className={styles.missingTag}>N/A</span>}
              </button>
            );
          })}
        </div>

        {/* AI toggle */}
        <button
          id="ai-signal-toggle"
          className={styles.aiToggleBtn}
          onClick={() => setAiSignal(caseId, !aiSignalShown)}
        >
          <div className={`toggle-track ${aiSignalShown ? 'on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
          <span className={styles.aiToggleLabel}>
            AI Findings: <strong>{aiSignalShown ? 'Shown' : 'Hidden'}</strong>
          </span>
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className={styles.canvasWrap}
        onWheel={handleWheel}
      >
        {activeSeries ? (
          <MRICanvas
            sliceIndex={local.currentSliceIndex}
            sliceCount={sliceCount}
            plane={activeSeries.plane}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No series available</div>
          </div>
        )}

        {/* Window/level overlay (mock affordance) */}
        <div className={styles.overlayHint}>
          <span>W/L</span>
          <span>Zoom</span>
          <span>Pan</span>
        </div>
      </div>

      {/* Slice scrubber */}
      <div className={styles.scrubber}>
        <button
          id="slice-prev"
          className={styles.scrubBtn}
          onClick={() => setCurrentSlice(caseId, Math.max(0, local.currentSliceIndex - 1))}
          disabled={local.currentSliceIndex === 0}
        >‹</button>

        <input
          id="slice-slider"
          type="range"
          min={0}
          max={sliceCount - 1}
          value={local.currentSliceIndex}
          onChange={e => setCurrentSlice(caseId, Number(e.target.value))}
          className={styles.sliderInput}
        />

        <button
          id="slice-next"
          className={styles.scrubBtn}
          onClick={() => setCurrentSlice(caseId, Math.min(sliceCount - 1, local.currentSliceIndex + 1))}
          disabled={local.currentSliceIndex === sliceCount - 1}
        >›</button>

        <span className={styles.sliceReadout}>
          Slice {local.currentSliceIndex + 1} / {sliceCount}
        </span>

        <span className={styles.scrollHint}>↕ scroll to scrub</span>
      </div>
    </div>
  );
}
