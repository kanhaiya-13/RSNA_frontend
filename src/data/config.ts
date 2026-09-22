// Static app-level config — not per-case
// Model reliability table (OOF AUC from spec §6)
export const findingReliability: Record<string, { oofAuc: number; tier: 'high' | 'moderate' | 'verify' }> = {
  'Medial Meniscus': { oofAuc: 0.8662, tier: 'high' },
  'Medial OA':       { oofAuc: 0.8636, tier: 'high' },
  'Effusion':        { oofAuc: 0.8622, tier: 'high' },
  "Baker's":         { oofAuc: 0.8608, tier: 'high' },
  'Fracture':        { oofAuc: 0.8496, tier: 'high' },
  'ACL':             { oofAuc: 0.8474, tier: 'high' },
  'Synovitis':       { oofAuc: 0.8353, tier: 'moderate' },
  'PF OA':           { oofAuc: 0.8162, tier: 'moderate' },
  'Lateral OA':      { oofAuc: 0.8121, tier: 'moderate' },
  'Contusion':       { oofAuc: 0.7984, tier: 'verify' },
  'Lateral Meniscus':{ oofAuc: 0.7901, tier: 'verify' },
  'MCL':             { oofAuc: 0.7623, tier: 'verify' },
};

// Per-finding empirical confidence thresholds (§7.2)
// Thresholds are tunable — leave as config, not hardcoded 0.5/0.9
// Values below are reasonable empirical starting points from typical knee MRI AUC curves
export const confidenceThresholds: Record<string, { high: number; medium: number }> = {
  'ACL':              { high: 0.70, medium: 0.40 },
  'MCL':              { high: 0.65, medium: 0.35 },
  'Medial Meniscus':  { high: 0.72, medium: 0.42 },
  'Lateral Meniscus': { high: 0.65, medium: 0.38 },
  'Medial OA':        { high: 0.75, medium: 0.45 },
  'Lateral OA':       { high: 0.70, medium: 0.40 },
  'PF OA':            { high: 0.68, medium: 0.38 },
  'Effusion':         { high: 0.72, medium: 0.42 },
  'Synovitis':        { high: 0.65, medium: 0.38 },
  "Baker's":          { high: 0.70, medium: 0.40 },
  'Contusion':        { high: 0.62, medium: 0.35 },
  'Fracture':         { high: 0.80, medium: 0.50 },
};

export function getConfidenceTier(findingName: string, probability: number): 'high' | 'medium' | 'low' {
  const thresholds = confidenceThresholds[findingName] ?? { high: 0.70, medium: 0.40 };
  if (probability >= thresholds.high) return 'high';
  if (probability >= thresholds.medium) return 'medium';
  return 'low';
}
