import { ConfidenceTier, ModelReliabilityTier, ReadStatus, ReviewState } from '@/data/mockData';

// ─── Confidence badge ──────────────────────────────────────────────────────────
const CONF_ICONS: Record<ConfidenceTier, string> = { high: '✓', medium: '~', low: '—' };
const CONF_LABELS: Record<ConfidenceTier, string> = { high: 'High', medium: 'Medium', low: 'Low' };

export function ConfidenceBadge({ tier, prob, showProb = true }: {
  tier: ConfidenceTier;
  prob?: number;
  showProb?: boolean;
}) {
  return (
    <span className={`badge badge-conf-${tier}`} title={`Case confidence: ${CONF_LABELS[tier]}`}>
      <span>{CONF_ICONS[tier]}</span>
      <span>{CONF_LABELS[tier]}</span>
      {showProb && prob !== undefined && (
        <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.85 }}>
          {(prob * 100).toFixed(0)}%
        </span>
      )}
    </span>
  );
}

// ─── Model reliability badge ────────────────────────────────────────────────────
const REL_ICONS: Record<ModelReliabilityTier, string> = { high: '🔬', moderate: '⚠', verify: '⛔' };
const REL_LABELS: Record<ModelReliabilityTier, string> = { high: 'High', moderate: 'Moderate', verify: 'Verify manually' };

export function ReliabilityBadge({ tier }: { tier: ModelReliabilityTier }) {
  return (
    <span className={`badge badge-rel-${tier}`} title={`Model reliability: ${REL_LABELS[tier]}`}>
      <span>{REL_ICONS[tier]}</span>
      <span>{REL_LABELS[tier]}</span>
    </span>
  );
}

// ─── Read status badge ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<ReadStatus, string> = {
  unread: 'Unread',
  in_progress: 'In Progress',
  signed: 'Signed',
};
const STATUS_ICONS: Record<ReadStatus, string> = {
  unread: '●',
  in_progress: '◐',
  signed: '✓',
};

export function StatusBadge({ status }: { status: ReadStatus }) {
  return (
    <span className={`badge badge-status-${status}`}>
      <span>{STATUS_ICONS[status]}</span>
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}

// ─── Review state icon ──────────────────────────────────────────────────────────
const REVIEW_ICONS: Record<ReviewState, string> = {
  unreviewed: '○',
  reviewed: '✓',
  flagged_disagree: '⚑',
};
const REVIEW_COLORS: Record<ReviewState, string> = {
  unreviewed: 'var(--text-muted)',
  reviewed: 'var(--conf-high)',
  flagged_disagree: 'var(--conf-medium)',
};

export function ReviewStateIcon({ state }: { state: ReviewState }) {
  return (
    <span
      title={state === 'unreviewed' ? 'Unreviewed' : state === 'reviewed' ? 'Reviewed' : 'Flagged — disagree'}
      style={{ color: REVIEW_COLORS[state], fontSize: '14px', fontWeight: 600 }}
    >
      {REVIEW_ICONS[state]}
    </span>
  );
}
