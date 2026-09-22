'use client';

import { useState, useCallback, useRef } from 'react';
import { Case, Finding } from '@/data/mockData';
import { useAppState } from '@/context/AppStateContext';
import ImageViewer from '@/components/ImageViewer/ImageViewer';
import SliceProbChart from '@/components/SliceProbChart/SliceProbChart';
import FindingsList from '@/components/FindingsList/FindingsList';
import MiniWorklist from '@/components/MiniWorklist/MiniWorklist';
import styles from './CaseReviewPage.module.css';

interface CaseReviewPageProps {
  caseData: Case;
}

export default function CaseReviewPage({ caseData }: CaseReviewPageProps) {
  const { getCaseLocalState, setSelectedFinding, setActiveSeries, setCurrentSlice } = useAppState();
  const local = getCaseLocalState(caseData.caseId);

  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [lastPulseFindingId, setLastPulseFindingId] = useState<string | null>(null);

  // Selected finding
  const selectedFinding = caseData.findings.find(f => f.findingId === local.selectedFindingId) ?? null;

  const handleSelectFinding = useCallback((f: Finding) => {
    // Switch to first contributing series, jump to peak slice
    const firstSeries = caseData.series.find(s => f.contributingSeries.includes(s.seriesId));
    if (firstSeries) setActiveSeries(caseData.caseId, firstSeries.seriesId);
    setCurrentSlice(caseData.caseId, f.peakSliceIndex);
    setSelectedFinding(caseData.caseId, f.findingId);
    // Trigger peak pulse
    setLastPulseFindingId(f.findingId);
  }, [caseData, setActiveSeries, setCurrentSlice, setSelectedFinding]);

  return (
    <div className={styles.layout}>
      {/* Left panel */}
      <div className={`${styles.leftPanel} ${leftCollapsed ? styles.leftCollapsed : ''}`}>
        <MiniWorklist
          activeCaseId={caseData.caseId}
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(v => !v)}
        />
      </div>

      {/* Center panel */}
      <div className={styles.centerPanel}>
        {/* Case header */}
        <div className={styles.caseHeader}>
          <div className={styles.caseInfo}>
            <span className={styles.caseId}>{caseData.patientIdMasked}</span>
            <span className={styles.caseDivider}>·</span>
            <span className={styles.caseDate}>{new Date(caseData.studyDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            {caseData.priorStudy && (
              <span className={styles.priorBadge}>Prior study: {caseData.priorStudy.studyDate}</span>
            )}
          </div>
          <div className={styles.caseActions}>
            <button
              className={`btn btn-ghost ${styles.collapseBtn}`}
              onClick={() => setRightCollapsed(v => !v)}
              title={rightCollapsed ? 'Show findings' : 'Hide findings'}
            >
              {rightCollapsed ? '◀ Findings' : 'Findings ▶'}
            </button>
          </div>
        </div>

        {/* Image viewer + chart */}
        <div className={styles.viewerArea}>
          <ImageViewer
            caseId={caseData.caseId}
            series={caseData.series}
            aiSignalShown={local.aiSignalShown}
          />

          {/* Slice prob strip — only when finding selected AND AI shown */}
          {selectedFinding && local.aiSignalShown && (
            <SliceProbChart
              sliceScores={selectedFinding.sliceScores}
              peakSliceIndex={selectedFinding.peakSliceIndex}
              currentSliceIndex={local.currentSliceIndex}
              findingName={selectedFinding.findingName}
              triggerPulse={lastPulseFindingId === selectedFinding.findingId}
            />
          )}
        </div>
      </div>

      {/* Right panel */}
      {!rightCollapsed && (
        <div className={styles.rightPanel}>
          <FindingsList
            caseData={caseData}
            aiSignalShown={local.aiSignalShown}
            selectedFindingId={local.selectedFindingId}
            onSelectFinding={handleSelectFinding}
          />
        </div>
      )}
    </div>
  );
}
