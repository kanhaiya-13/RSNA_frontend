'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Case, Finding } from '@/data/mockData';
import { useAppState } from '@/context/AppStateContext';
import { ConfidenceBadge, ReliabilityBadge, ReviewStateIcon } from '@/components/Badges/Badges';
import styles from './FindingsList.module.css';

interface FindingsListProps {
  caseData: Case;
  aiSignalShown: boolean;
  selectedFindingId: string | null;
  onSelectFinding: (f: Finding) => void;
}

export default function FindingsList({
  caseData,
  aiSignalShown,
  selectedFindingId,
  onSelectFinding,
}: FindingsListProps) {
  const { updateFindingReview } = useAppState();
  const [noteInput, setNoteInput] = useState<{ id: string; text: string } | null>(null);

  const sortedFindings = [...caseData.findings].sort((a, b) => b.probability - a.probability);
  const allLow = sortedFindings.every(f => f.confidenceTier === 'low');
  const reviewedCount = caseData.findings.filter(f => f.reviewState !== 'unreviewed').length;

  function handleMark(f: Finding) {
    updateFindingReview(caseData.caseId, f.findingId, 'reviewed');
  }

  function handleFlag(f: Finding) {
    if (noteInput?.id === f.findingId) {
      updateFindingReview(caseData.caseId, f.findingId, 'flagged_disagree', noteInput.text);
      setNoteInput(null);
    } else {
      setNoteInput({ id: f.findingId, text: f.doctorNote ?? '' });
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>AI Findings</span>
        <span className={styles.reviewProgress}>
          {reviewedCount} / {caseData.findings.length} reviewed
        </span>
      </div>

      <div className={styles.listBody}>
        {allLow && (
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">No findings flagged</div>
            <div className="empty-state-desc">All 12 model outputs are below confidence threshold for this case.</div>
          </div>
        )}

        {sortedFindings.map((f) => {
          const isSelected = f.findingId === selectedFindingId;
          const series = caseData.series;

          return (
            <div key={f.findingId}>
              <div
                id={`finding-row-${f.findingId}`}
                className={`${styles.findingRow} ${isSelected ? styles.findingRowSelected : ''} ${f.confidenceTier === 'low' ? styles.findingRowLow : ''}`}
                onClick={() => onSelectFinding(f)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onSelectFinding(f)}
              >
                {/* Left: review state + name */}
                <div className={styles.findingMain}>
                  <ReviewStateIcon state={f.reviewState} />
                  <div className={styles.findingInfo}>
                    <span className={styles.findingName}>{f.findingName}</span>
                    {aiSignalShown && (
                      <span className={styles.seriesLabels}>
                        {f.contributingSeries.map(sid => {
                          const s = series.find(s => s.seriesId === sid);
                          return s ? (
                            <span key={sid} className={styles.seriesChip}>{s.plane.charAt(0).toUpperCase()}</span>
                          ) : null;
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: badges */}
                <div className={styles.findingBadges}>
                  {aiSignalShown && (
                    <ConfidenceBadge tier={f.confidenceTier} prob={f.probability} />
                  )}
                  <ReliabilityBadge tier={f.modelReliabilityTier} />
                </div>

                {/* Row actions */}
                <div className={styles.findingActions} onClick={e => e.stopPropagation()}>
                  {f.reviewState !== 'reviewed' && (
                    <button
                      id={`mark-reviewed-${f.findingId}`}
                      className="btn btn-sm btn-success"
                      onClick={() => handleMark(f)}
                      title="Mark reviewed"
                    >✓ Mark</button>
                  )}
                  <button
                    id={`flag-disagree-${f.findingId}`}
                    className={`btn btn-sm ${f.reviewState === 'flagged_disagree' ? 'btn-danger' : 'btn-ghost'}`}
                    onClick={() => handleFlag(f)}
                    title="Flag disagreement"
                  >
                    {noteInput?.id === f.findingId ? '💾 Save' : f.reviewState === 'flagged_disagree' ? '⚑ Flagged' : '⚑ Flag'}
                  </button>
                </div>

                {/* Probability bar */}
                {aiSignalShown && (
                  <div className={styles.probBar}>
                    <div
                      className={`${styles.probFill} ${styles[`probFill_${f.confidenceTier}`]}`}
                      style={{ width: `${f.probability * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Doctor note input */}
              {noteInput?.id === f.findingId && (
                <div className={styles.noteWrap}>
                  <textarea
                    className={styles.noteInput}
                    placeholder="Add disagreement note…"
                    value={noteInput.text}
                    onChange={e => setNoteInput({ id: f.findingId, text: e.target.value })}
                    rows={2}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-ghost" onClick={() => setNoteInput(null)}>Cancel</button>
                </div>
              )}

              {/* Existing note */}
              {f.doctorNote && noteInput?.id !== f.findingId && (
                <div className={styles.existingNote}>
                  <span className={styles.noteIcon}>📝</span>
                  <span>{f.doctorNote}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className={styles.footer}>
        <div className={styles.footerProgress}>
          <div className={styles.footerProgressBar} style={{ width: `${(reviewedCount / caseData.findings.length) * 100}%` }} />
        </div>
        <Link
          href={`/case/${caseData.caseId}/report`}
          id="generate-report-btn"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}
        >
          📋 Generate Report
        </Link>
      </div>
    </div>
  );
}
