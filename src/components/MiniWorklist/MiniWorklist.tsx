'use client';

import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import { getHighestFinding } from '@/data/mockData';
import { ConfidenceBadge, StatusBadge } from '@/components/Badges/Badges';
import styles from './MiniWorklist.module.css';

interface MiniWorklistProps {
  activeCaseId: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function MiniWorklist({ activeCaseId, collapsed, onToggle }: MiniWorklistProps) {
  const { cases } = useAppState();

  if (collapsed) {
    return (
      <div className={styles.rail}>
        <button className={styles.toggleBtn} onClick={onToggle} id="worklist-expand" title="Expand worklist">
          ›
        </button>
        {cases.map(c => {
          const top = getHighestFinding(c);
          return (
            <Link
              key={c.caseId}
              href={`/case/${c.caseId}`}
              id={`mini-case-${c.caseId}`}
              className={`${styles.railItem} ${c.caseId === activeCaseId ? styles.railItemActive : ''}`}
              title={`${c.patientIdMasked} · ${c.studyDate}`}
            >
              <span className={styles.railDot} style={{
                background: top?.confidenceTier === 'high' ? 'var(--conf-high)' : top?.confidenceTier === 'medium' ? 'var(--conf-medium)' : 'var(--conf-low)'
              }} />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Worklist</span>
        <button className={styles.toggleBtn} onClick={onToggle} id="worklist-collapse" title="Collapse worklist">‹</button>
      </div>
      <div className={styles.list}>
        {cases.map(c => {
          const top = getHighestFinding(c);
          const isActive = c.caseId === activeCaseId;
          return (
            <Link
              key={c.caseId}
              href={`/case/${c.caseId}`}
              id={`worklist-item-${c.caseId}`}
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            >
              <div className={styles.itemTop}>
                <span className={styles.patientId}>{c.patientIdMasked}</span>
                <StatusBadge status={c.readStatus} />
              </div>
              <div className={styles.itemBottom}>
                <span className={styles.date}>{new Date(c.studyDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                {top && <ConfidenceBadge tier={top.confidenceTier} prob={top.probability} showProb={false} />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
