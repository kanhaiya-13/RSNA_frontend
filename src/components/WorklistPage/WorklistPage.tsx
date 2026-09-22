'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppState } from '@/context/AppStateContext';
import { Case, ConfidenceTier, FindingName, ReadStatus } from '@/data/mockData';
import { getHighestFinding, countFlaggedFindings } from '@/data/mockData';
import { ConfidenceBadge, StatusBadge } from '@/components/Badges/Badges';
import styles from './WorklistPage.module.css';

type SortKey = 'urgency' | 'date' | 'flagged';

const ALL_FINDING_NAMES: FindingName[] = [
  'ACL', 'MCL', 'Medial Meniscus', 'Lateral Meniscus',
  'Medial OA', 'Lateral OA', 'PF OA', 'Effusion',
  'Synovitis', "Baker's", 'Contusion', 'Fracture',
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = parseInt(month, 10) - 1;
  return `${day} ${months[mIdx] || ''} ${year}`;
}

export default function WorklistPage() {
  const { cases, currentUser } = useAppState();
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [filterStatus, setFilterStatus] = useState<ReadStatus | 'all'>('all');
  const [filterTier, setFilterTier] = useState<ConfidenceTier | 'all'>('all');
  const [filterFinding, setFilterFinding] = useState<FindingName | 'all'>('all');

  const sorted = useMemo(() => {
    let list = [...cases];

    // Filter
    if (filterStatus !== 'all') list = list.filter(c => c.readStatus === filterStatus);
    if (filterFinding !== 'all') list = list.filter(c => c.findings.some(f => f.findingName === filterFinding));
    if (filterTier !== 'all') list = list.filter(c => c.findings.some(f => f.confidenceTier === filterTier));

    // Sort
    if (sortKey === 'urgency') {
      list.sort((a, b) => {
        const topA = getHighestFinding(a)?.probability ?? 0;
        const topB = getHighestFinding(b)?.probability ?? 0;
        return topB - topA;
      });
    } else if (sortKey === 'date') {
      list.sort((a, b) => new Date(b.studyDate).getTime() - new Date(a.studyDate).getTime());
    } else {
      list.sort((a, b) => countFlaggedFindings(b) - countFlaggedFindings(a));
    }
    return list;
  }, [cases, sortKey, filterStatus, filterTier, filterFinding]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Worklist</h1>
          <p className={styles.subtitle}>
            {sorted.length} case{sorted.length !== 1 ? 's' : ''} · sorted by{' '}
            <span className={styles.sortLabel}>{sortKey}</span>
          </p>
        </div>
        <div className={styles.docBadge}>
          <span>👤</span>
          <span>{currentUser.name}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort by</label>
          <div className={styles.segmented}>
            {(['urgency', 'date', 'flagged'] as SortKey[]).map(k => (
              <button
                key={k}
                id={`sort-${k}`}
                className={`${styles.segBtn} ${sortKey === k ? styles.segActive : ''}`}
                onClick={() => setSortKey(k)}
              >
                {k === 'urgency' ? '⚡ Urgency' : k === 'date' ? '📅 Date' : '🔍 Flagged'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className={styles.select}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ReadStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="unread">Unread</option>
            <option value="in_progress">In Progress</option>
            <option value="signed">Signed</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-tier">Confidence</label>
          <select
            id="filter-tier"
            className={styles.select}
            value={filterTier}
            onChange={e => setFilterTier(e.target.value as ConfidenceTier | 'all')}
          >
            <option value="all">All tiers</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-finding">Finding</label>
          <select
            id="filter-finding"
            className={styles.select}
            value={filterFinding}
            onChange={e => setFilterFinding(e.target.value as FindingName | 'all')}
          >
            <option value="all">All findings</option>
            {ALL_FINDING_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Study Date</th>
              <th>AI-Flagged</th>
              <th>Highest Finding</th>
              <th>Confidence</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No cases match filters</div>
                    <div className="empty-state-desc">Try adjusting or clearing the filter criteria above.</div>
                  </div>
                </td>
              </tr>
            ) : sorted.map((c: Case) => {
              const top = getHighestFinding(c);
              const flagged = countFlaggedFindings(c);
              return (
                <tr key={c.caseId} className={styles.row}>
                  <td>
                    <span className={styles.patientId}>{c.patientIdMasked}</span>
                  </td>
                  <td>
                    <span className={styles.date}>
                      {formatDate(c.studyDate)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.flaggedCount}>{flagged}</span>
                    {' '}
                    <span className={styles.flaggedOf}>/ 12</span>
                  </td>
                  <td>
                    <span className={styles.findingName}>{top?.findingName ?? '—'}</span>
                  </td>
                  <td>
                    {top ? <ConfidenceBadge tier={top.confidenceTier} prob={top.probability} /> : '—'}
                  </td>
                  <td>
                    <StatusBadge status={c.readStatus} />
                  </td>
                  <td>
                    <Link href={`/case/${c.caseId}`} id={`open-case-${c.caseId}`} className={`btn btn-ghost ${styles.openBtn}`}>
                      Review →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
