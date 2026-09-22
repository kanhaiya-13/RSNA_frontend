import { findingReliability, getConfidenceTier } from './config';

export type Plane = 'sagittal' | 'coronal' | 'axial';
export type ReadStatus = 'unread' | 'in_progress' | 'signed';
export type ReviewState = 'unreviewed' | 'reviewed' | 'flagged_disagree';
export type ConfidenceTier = 'high' | 'medium' | 'low';
export type ModelReliabilityTier = 'high' | 'moderate' | 'verify';

export type FindingName =
  | 'ACL' | 'MCL' | 'Medial Meniscus' | 'Lateral Meniscus'
  | 'Medial OA' | 'Lateral OA' | 'PF OA' | 'Effusion'
  | 'Synovitis' | "Baker's" | 'Contusion' | 'Fracture';

export const ALL_FINDINGS: FindingName[] = [
  'ACL', 'MCL', 'Medial Meniscus', 'Lateral Meniscus',
  'Medial OA', 'Lateral OA', 'PF OA', 'Effusion',
  'Synovitis', "Baker's", 'Contusion', 'Fracture',
];

export interface Series {
  seriesId: string;
  plane: Plane;
  sliceCount: number;
}

export interface Finding {
  findingId: string;
  findingName: FindingName;
  probability: number;
  confidenceTier: ConfidenceTier;
  modelReliabilityTier: ModelReliabilityTier;
  contributingSeries: string[];
  sliceScores: number[];
  peakSliceIndex: number;
  reviewState: ReviewState;
  doctorNote?: string;
}

export interface Case {
  caseId: string;
  patientIdMasked: string;
  studyDate: string;
  readStatus: ReadStatus;
  series: Series[];
  findings: Finding[];
  priorStudy?: Omit<Case, 'priorStudy'>;
}

export interface AppState {
  currentUser: { id: string; name: string; role: string };
  cases: Case[];
}

// ─── Mock data helpers ────────────────────────────────────────────────────────

function deterministicSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) / 2147483647;
}

function makeSliceScores(peakSlice: number, peakVal: number, spread: number, seedKey: string = 'default'): number[] {
  return Array.from({ length: 24 }, (_, i) => {
    const dist = Math.abs(i - peakSlice);
    const base = peakVal * Math.exp(-(dist * dist) / (2 * spread * spread));
    const noise = (deterministicSeed(`${seedKey}_slice_${i}`) - 0.5) * 0.04;
    return Math.max(0, Math.min(1, base + noise));
  });
}

function makeFinding(
  id: string,
  name: FindingName,
  probability: number,
  seriesIds: string[],
  peakSlice?: number,
): Finding {
  const defaultPeak = Math.floor(deterministicSeed(`${id}_peak`) * 20) + 2;
  const peak = peakSlice ?? defaultPeak;
  const spread = 3 + deterministicSeed(`${id}_spread`) * 3;
  const sliceScores = makeSliceScores(peak, probability, spread, id);
  const actualPeak = sliceScores.indexOf(Math.max(...sliceScores));
  return {
    findingId: id,
    findingName: name,
    probability,
    confidenceTier: getConfidenceTier(name, probability),
    modelReliabilityTier: findingReliability[name].tier,
    contributingSeries: seriesIds,
    sliceScores,
    peakSliceIndex: actualPeak,
    reviewState: 'unreviewed',
  };
}

// ─── Case 1: All-negative ─────────────────────────────────────────────────────
const case1: Case = {
  caseId: 'case-001',
  patientIdMasked: 'PT-###-0042',
  studyDate: '2026-09-01',
  readStatus: 'unread',
  series: [
    { seriesId: 's1-sag', plane: 'sagittal', sliceCount: 24 },
    { seriesId: 's1-cor', plane: 'coronal', sliceCount: 24 },
    { seriesId: 's1-ax', plane: 'axial', sliceCount: 24 },
  ],
  findings: ALL_FINDINGS.map((name, i) =>
    makeFinding(`c1-f${i}`, name, 0.05 + deterministicSeed(`c1_${i}`) * 0.18, ['s1-sag'])
  ),
};

// ─── Case 2: Mixed-confidence ─────────────────────────────────────────────────
const case2: Case = {
  caseId: 'case-002',
  patientIdMasked: 'PT-###-0117',
  studyDate: '2026-09-08',
  readStatus: 'in_progress',
  series: [
    { seriesId: 's2-sag', plane: 'sagittal', sliceCount: 24 },
    { seriesId: 's2-cor', plane: 'coronal', sliceCount: 24 },
    { seriesId: 's2-ax', plane: 'axial', sliceCount: 24 },
  ],
  findings: [
    makeFinding('c2-f0', 'ACL', 0.82, ['s2-sag'], 12),
    makeFinding('c2-f1', 'MCL', 0.28, ['s2-cor'], 8),
    makeFinding('c2-f2', 'Medial Meniscus', 0.76, ['s2-sag', 's2-cor'], 15),
    makeFinding('c2-f3', 'Lateral Meniscus', 0.44, ['s2-sag'], 10),
    makeFinding('c2-f4', 'Medial OA', 0.12, ['s2-cor'], 5),
    makeFinding('c2-f5', 'Lateral OA', 0.08, ['s2-cor'], 6),
    makeFinding('c2-f6', 'PF OA', 0.55, ['s2-ax'], 11),
    makeFinding('c2-f7', 'Effusion', 0.91, ['s2-sag', 's2-ax'], 18),
    makeFinding('c2-f8', 'Synovitis', 0.48, ['s2-ax'], 19),
    makeFinding("c2-f9", "Baker's", 0.19, ['s2-ax'], 20),
    makeFinding('c2-f10', 'Contusion', 0.07, ['s2-cor'], 3),
    makeFinding('c2-f11', 'Fracture', 0.04, ['s2-sag'], 2),
  ],
};

// ─── Case 3: With prior study ─────────────────────────────────────────────────
const case3PriorFindings: Finding[] = [
  makeFinding('c3p-f0', 'ACL', 0.88, ['sp-sag'], 12),
  makeFinding('c3p-f1', 'MCL', 0.22, ['sp-cor'], 8),
  makeFinding('c3p-f2', 'Medial Meniscus', 0.65, ['sp-sag'], 14),
  makeFinding('c3p-f3', 'Lateral Meniscus', 0.30, ['sp-sag'], 10),
  makeFinding('c3p-f4', 'Medial OA', 0.35, ['sp-cor'], 5),
  makeFinding('c3p-f5', 'Lateral OA', 0.10, ['sp-cor'], 6),
  makeFinding('c3p-f6', 'PF OA', 0.45, ['sp-ax'], 11),
  makeFinding('c3p-f7', 'Effusion', 0.78, ['sp-sag'], 18),
  makeFinding('c3p-f8', 'Synovitis', 0.40, ['sp-ax'], 19),
  makeFinding("c3p-f9", "Baker's", 0.15, ['sp-ax'], 20),
  makeFinding('c3p-f10', 'Contusion', 0.09, ['sp-cor'], 3),
  makeFinding('c3p-f11', 'Fracture', 0.03, ['sp-sag'], 2),
];

const case3: Case = {
  caseId: 'case-003',
  patientIdMasked: 'PT-###-0203',
  studyDate: '2026-09-12',
  readStatus: 'unread',
  series: [
    { seriesId: 's3-sag', plane: 'sagittal', sliceCount: 24 },
    { seriesId: 's3-cor', plane: 'coronal', sliceCount: 24 },
    { seriesId: 's3-ax', plane: 'axial', sliceCount: 24 },
  ],
  findings: [
    makeFinding('c3-f0', 'ACL', 0.92, ['s3-sag'], 12),
    makeFinding('c3-f1', 'MCL', 0.31, ['s3-cor'], 8),
    makeFinding('c3-f2', 'Medial Meniscus', 0.78, ['s3-sag', 's3-cor'], 15),
    makeFinding('c3-f3', 'Lateral Meniscus', 0.22, ['s3-sag'], 10),
    makeFinding('c3-f4', 'Medial OA', 0.55, ['s3-cor'], 5),
    makeFinding('c3-f5', 'Lateral OA', 0.14, ['s3-cor'], 6),
    makeFinding('c3-f6', 'PF OA', 0.62, ['s3-ax'], 11),
    makeFinding('c3-f7', 'Effusion', 0.85, ['s3-sag', 's3-ax'], 18),
    makeFinding('c3-f8', 'Synovitis', 0.53, ['s3-ax'], 19),
    makeFinding("c3-f9", "Baker's", 0.28, ['s3-ax'], 20),
    makeFinding('c3-f10', 'Contusion', 0.11, ['s3-cor'], 3),
    makeFinding('c3-f11', 'Fracture', 0.06, ['s3-sag'], 2),
  ],
  priorStudy: {
    caseId: 'case-003-prior',
    patientIdMasked: 'PT-###-0203',
    studyDate: '2025-03-15',
    readStatus: 'signed',
    series: [
      { seriesId: 'sp-sag', plane: 'sagittal', sliceCount: 24 },
      { seriesId: 'sp-cor', plane: 'coronal', sliceCount: 24 },
      { seriesId: 'sp-ax', plane: 'axial', sliceCount: 24 },
    ],
    findings: case3PriorFindings,
  },
};

// ─── Case 4: Missing axial series ────────────────────────────────────────────
const case4: Case = {
  caseId: 'case-004',
  patientIdMasked: 'PT-###-0358',
  studyDate: '2026-09-15',
  readStatus: 'unread',
  series: [
    { seriesId: 's4-sag', plane: 'sagittal', sliceCount: 24 },
    { seriesId: 's4-cor', plane: 'coronal', sliceCount: 24 },
    // axial intentionally missing
  ],
  findings: [
    makeFinding('c4-f0', 'ACL', 0.61, ['s4-sag'], 12),
    makeFinding('c4-f1', 'MCL', 0.73, ['s4-cor'], 8),
    makeFinding('c4-f2', 'Medial Meniscus', 0.45, ['s4-sag'], 14),
    makeFinding('c4-f3', 'Lateral Meniscus', 0.38, ['s4-sag'], 10),
    makeFinding('c4-f4', 'Medial OA', 0.20, ['s4-cor'], 5),
    makeFinding('c4-f5', 'Lateral OA', 0.16, ['s4-cor'], 6),
    makeFinding('c4-f6', 'PF OA', 0.18, ['s4-sag'], 11),
    makeFinding('c4-f7', 'Effusion', 0.55, ['s4-sag'], 18),
    makeFinding('c4-f8', 'Synovitis', 0.33, ['s4-cor'], 7),
    makeFinding("c4-f9", "Baker's", 0.12, ['s4-cor'], 3),
    makeFinding('c4-f10', 'Contusion', 0.09, ['s4-sag'], 4),
    makeFinding('c4-f11', 'Fracture', 0.07, ['s4-sag'], 2),
  ],
};

// ─── Case 5: High confidence + low model reliability (MCL verify + high prob) ─
const case5: Case = {
  caseId: 'case-005',
  patientIdMasked: 'PT-###-0491',
  studyDate: '2026-09-18',
  readStatus: 'unread',
  series: [
    { seriesId: 's5-sag', plane: 'sagittal', sliceCount: 24 },
    { seriesId: 's5-cor', plane: 'coronal', sliceCount: 24 },
    { seriesId: 's5-ax', plane: 'axial', sliceCount: 24 },
  ],
  findings: [
    // MCL: "verify" model reliability, but HIGH confidence on this case — critical edge case
    makeFinding('c5-f0', 'MCL', 0.88, ['s5-cor'], 9),
    // Lateral Meniscus: also "verify" tier, high prediction
    makeFinding('c5-f1', 'Lateral Meniscus', 0.79, ['s5-sag'], 13),
    makeFinding('c5-f2', 'ACL', 0.34, ['s5-sag'], 11),
    makeFinding('c5-f3', 'Medial Meniscus', 0.22, ['s5-sag'], 7),
    makeFinding('c5-f4', 'Medial OA', 0.18, ['s5-cor'], 5),
    makeFinding('c5-f5', 'Lateral OA', 0.42, ['s5-cor'], 8),
    makeFinding('c5-f6', 'PF OA', 0.28, ['s5-ax'], 14),
    makeFinding('c5-f7', 'Effusion', 0.65, ['s5-sag', 's5-ax'], 20),
    makeFinding('c5-f8', 'Synovitis', 0.30, ['s5-ax'], 16),
    makeFinding("c5-f9", "Baker's", 0.08, ['s5-ax'], 21),
    makeFinding('c5-f10', 'Contusion', 0.71, ['s5-cor'], 6),
    makeFinding('c5-f11', 'Fracture', 0.05, ['s5-sag'], 2),
  ],
};

export const mockCases: Case[] = [case2, case3, case5, case4, case1];

export const appState: AppState = {
  currentUser: { id: 'dr-001', name: 'Dr. Priya Sharma', role: 'Orthopaedic Radiologist' },
  cases: mockCases,
};

export function getCaseById(caseId: string): Case | undefined {
  return mockCases.find(c => c.caseId === caseId);
}

export function getHighestFinding(c: Case): Finding | undefined {
  return [...c.findings].sort((a, b) => b.probability - a.probability)[0];
}

export function countFlaggedFindings(c: Case): number {
  return c.findings.filter(f => f.confidenceTier !== 'low').length;
}
