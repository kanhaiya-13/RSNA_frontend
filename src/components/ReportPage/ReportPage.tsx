'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Case } from '@/data/mockData';
import { useAppState } from '@/context/AppStateContext';
import { ConfidenceBadge, ReliabilityBadge } from '@/components/Badges/Badges';
import styles from './ReportPage.module.css';

interface ReportPageProps {
  caseData: Case;
}

export default function ReportPage({ caseData }: ReportPageProps) {
  const { reportState, initReport, updateReportLine, finalizeReport, isReportFinalized } = useAppState();

  useEffect(() => {
    initReport(caseData.caseId, caseData.findings);
  }, [caseData, initReport]);

  const lines = reportState[caseData.caseId] ?? [];
  const finalized = isReportFinalized(caseData.caseId);

  const findingMap = new Map(caseData.findings.map(f => [f.findingId, f]));

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Link href={`/case/${caseData.caseId}`} className={`btn btn-ghost ${styles.backBtn}`}>
              ← Back to Review
            </Link>
            <h1 className={styles.title}>AI-Assisted Report</h1>
            <p className={styles.subtitle}>
              {caseData.patientIdMasked} · {new Date(caseData.studyDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              {finalized && <span className={styles.finalBadge}>✓ FINALIZED</span>}
            </p>
          </div>
          <div className={styles.actions}>
            <button
              id="save-draft-btn"
              className="btn btn-ghost"
              onClick={() => {}} // persisted in state already
              disabled={finalized}
            >
              💾 Save Draft
            </button>
            <button
              id="print-btn"
              className="btn btn-ghost"
              onClick={() => window.print()}
            >
              🖨 Print
            </button>
            <button
              id="finalize-btn"
              className="btn btn-primary"
              onClick={() => finalizeReport(caseData.caseId)}
              disabled={finalized}
            >
              ✓ Sign &amp; Finalize
            </button>
          </div>
        </div>

        {/* Model note */}
        <div className={styles.modelNote}>
          <span className={styles.noteIcon}>🔬</span>
          <span>ResNet-34 · 5-fold ensemble · 24-slice per-plane analysis. Per-finding confidence thresholds are empirically tuned from validation PR/ROC curves. Model reliability tiers reflect OOF AUC from cross-validation.</span>
        </div>

        {finalized && (
          <div className={styles.finalBanner}>
            ✓ This report has been signed and finalized. Editing is locked.
          </div>
        )}

        {/* Comparison view if prior study */}
        {caseData.priorStudy && (
          <div className={styles.comparisonHeader}>
            <div className={styles.compCol}>
              <span className={styles.compLabel}>Current Study</span>
              <span className={styles.compDate}>{caseData.studyDate}</span>
            </div>
            <div className={styles.compDivider}>⟺</div>
            <div className={styles.compCol}>
              <span className={styles.compLabel}>Prior Study</span>
              <span className={styles.compDate}>{caseData.priorStudy.studyDate}</span>
            </div>
          </div>
        )}

        {/* Report lines */}
        <div className={styles.reportBody}>
          {lines.map(line => {
            const finding = findingMap.get(line.findingId);
            if (!finding) return null;
            const priorFinding = caseData.priorStudy?.findings.find(f => f.findingName === finding.findingName);

            return (
              <div key={line.findingId} className={`${styles.reportLine} ${finding.confidenceTier === 'low' ? styles.reportLineLow : ''}`}>
                {/* Left: current */}
                <div className={styles.lineContent}>
                  <div className={styles.lineTop}>
                    <span className={styles.lineNumber}>{finding.findingName}</span>
                    <div className={styles.lineBadges}>
                      <ConfidenceBadge tier={finding.confidenceTier} prob={finding.probability} />
                      <ReliabilityBadge tier={finding.modelReliabilityTier} />
                      {line.edited && <span className={styles.editedTag}>✏ Doctor-edited</span>}
                      {!line.edited && <span className={styles.aiTag}>AI-original</span>}
                    </div>
                  </div>
                  <div className={styles.textWrap}>
                    <textarea
                      id={`report-line-${line.findingId}`}
                      className={`${styles.lineText} ${line.edited ? styles.lineTextEdited : ''}`}
                      value={line.text}
                      onChange={e => updateReportLine(caseData.caseId, line.findingId, e.target.value)}
                      disabled={finalized}
                      rows={2}
                    />
                    {line.edited && (
                      <button
                        className={styles.revertBtn}
                        onClick={() => updateReportLine(caseData.caseId, line.findingId, line.aiOriginal)}
                        disabled={finalized}
                        title="Revert to AI original"
                      >
                        ↺ Revert
                      </button>
                    )}
                  </div>
                  {finding.doctorNote && (
                    <div className={styles.doctorNote}>📝 {finding.doctorNote}</div>
                  )}
                </div>

                {/* Right: prior comparison */}
                {caseData.priorStudy && priorFinding && (
                  <div className={styles.priorCol}>
                    <ConfidenceBadge tier={priorFinding.confidenceTier} prob={priorFinding.probability} />
                    <span className={styles.priorDelta}>
                      {Math.abs(finding.probability - priorFinding.probability) > 0.05 ? (
                        finding.probability > priorFinding.probability
                          ? <span className={styles.deltaUp}>▲ {((finding.probability - priorFinding.probability) * 100).toFixed(0)}%</span>
                          : <span className={styles.deltaDown}>▼ {((priorFinding.probability - finding.probability) * 100).toFixed(0)}%</span>
                      ) : <span className={styles.deltaFlat}>→ stable</span>}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
