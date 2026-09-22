'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Case, Finding, ReadStatus, ReviewState, appState } from '@/data/mockData';

interface CaseLocalState {
  independentReadPerformed: boolean;
  aiSignalShown: boolean;
  selectedFindingId: string | null;
  activeSeriesId: string | null;
  currentSliceIndex: number;
}

interface AppContextType {
  currentUser: typeof appState.currentUser;
  cases: Case[];
  caseLocalState: Record<string, CaseLocalState>;
  getCaseLocalState: (caseId: string) => CaseLocalState;
  setAiSignal: (caseId: string, shown: boolean) => void;
  setSelectedFinding: (caseId: string, findingId: string | null) => void;
  setActiveSeries: (caseId: string, seriesId: string) => void;
  setCurrentSlice: (caseId: string, idx: number) => void;
  updateFindingReview: (caseId: string, findingId: string, state: ReviewState, note?: string) => void;
  updateReadStatus: (caseId: string, status: ReadStatus) => void;
  getCase: (caseId: string) => Case | undefined;
  reportState: Record<string, ReportLine[]>;
  initReport: (caseId: string, findings: Finding[]) => void;
  updateReportLine: (caseId: string, findingId: string, text: string) => void;
  finalizeReport: (caseId: string) => void;
  isReportFinalized: (caseId: string) => boolean;
}

export interface ReportLine {
  findingId: string;
  findingName: string;
  text: string;
  edited: boolean;
  aiOriginal: string;
}

const AppContext = createContext<AppContextType | null>(null);

function defaultCaseState(caseId: string, caseData?: Case): CaseLocalState {
  return {
    independentReadPerformed: false,
    aiSignalShown: true,
    selectedFindingId: null,
    activeSeriesId: caseData?.series[0]?.seriesId ?? null,
    currentSliceIndex: 0,
  };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<Case[]>(appState.cases);
  const [caseLocalState, setCaseLocalState] = useState<Record<string, CaseLocalState>>({});
  const [reportState, setReportState] = useState<Record<string, ReportLine[]>>({});
  const [finalizedReports, setFinalizedReports] = useState<Set<string>>(new Set());

  const getCaseLocalState = useCallback((caseId: string): CaseLocalState => {
    if (caseLocalState[caseId]) return caseLocalState[caseId];
    const caseData = cases.find(c => c.caseId === caseId);
    return defaultCaseState(caseId, caseData);
  }, [caseLocalState, cases]);

  const patchCaseLocal = useCallback((caseId: string, patch: Partial<CaseLocalState>) => {
    setCaseLocalState(prev => {
      const current = prev[caseId] ?? defaultCaseState(caseId, cases.find(c => c.caseId === caseId));
      return { ...prev, [caseId]: { ...current, ...patch } };
    });
  }, [cases]);

  const setAiSignal = useCallback((caseId: string, shown: boolean) => {
    const prev = getCaseLocalState(caseId);
    const wasHidden = !prev.aiSignalShown;
    patchCaseLocal(caseId, {
      aiSignalShown: shown,
      independentReadPerformed: wasHidden && shown ? true : prev.independentReadPerformed,
    });
  }, [getCaseLocalState, patchCaseLocal]);

  const setSelectedFinding = useCallback((caseId: string, findingId: string | null) => {
    patchCaseLocal(caseId, { selectedFindingId: findingId });
  }, [patchCaseLocal]);

  const setActiveSeries = useCallback((caseId: string, seriesId: string) => {
    patchCaseLocal(caseId, { activeSeriesId: seriesId });
  }, [patchCaseLocal]);

  const setCurrentSlice = useCallback((caseId: string, idx: number) => {
    patchCaseLocal(caseId, { currentSliceIndex: idx });
  }, [patchCaseLocal]);

  const updateFindingReview = useCallback((caseId: string, findingId: string, state: ReviewState, note?: string) => {
    setCases(prev => prev.map(c => {
      if (c.caseId !== caseId) return c;
      return {
        ...c,
        readStatus: 'in_progress',
        findings: c.findings.map(f => {
          if (f.findingId !== findingId) return f;
          return { ...f, reviewState: state, doctorNote: note ?? f.doctorNote };
        }),
      };
    }));
  }, []);

  const updateReadStatus = useCallback((caseId: string, status: ReadStatus) => {
    setCases(prev => prev.map(c => c.caseId === caseId ? { ...c, readStatus: status } : c));
  }, []);

  const getCase = useCallback((caseId: string) => cases.find(c => c.caseId === caseId), [cases]);

  const initReport = useCallback((caseId: string, findings: Finding[]) => {
    if (reportState[caseId]) return;
    const lines: ReportLine[] = findings.map(f => {
      const tierStr = f.confidenceTier === 'high' ? 'HIGH confidence' : f.confidenceTier === 'medium' ? 'MEDIUM confidence' : 'LOW (likely negative)';
      const relStr = f.modelReliabilityTier === 'high' ? 'Model reliability: High' : f.modelReliabilityTier === 'moderate' ? 'Model reliability: Moderate' : 'Model reliability: Verify manually';
      const text = `${f.findingName}: ${tierStr} (p=${f.probability.toFixed(2)}). ${relStr}.${f.doctorNote ? ` Doctor note: ${f.doctorNote}` : ''}`;
      return { findingId: f.findingId, findingName: f.findingName, text, edited: false, aiOriginal: text };
    });
    setReportState(prev => ({ ...prev, [caseId]: lines }));
  }, [reportState]);

  const updateReportLine = useCallback((caseId: string, findingId: string, text: string) => {
    setReportState(prev => ({
      ...prev,
      [caseId]: (prev[caseId] ?? []).map(l =>
        l.findingId === findingId ? { ...l, text, edited: text !== l.aiOriginal } : l
      ),
    }));
  }, []);

  const finalizeReport = useCallback((caseId: string) => {
    setFinalizedReports(prev => new Set([...prev, caseId]));
    updateReadStatus(caseId, 'signed');
  }, [updateReadStatus]);

  const isReportFinalized = useCallback((caseId: string) => finalizedReports.has(caseId), [finalizedReports]);

  return (
    <AppContext.Provider value={{
      currentUser: appState.currentUser,
      cases,
      caseLocalState,
      getCaseLocalState,
      setAiSignal,
      setSelectedFinding,
      setActiveSeries,
      setCurrentSlice,
      updateFindingReview,
      updateReadStatus,
      getCase,
      reportState,
      initReport,
      updateReportLine,
      finalizeReport,
      isReportFinalized,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
