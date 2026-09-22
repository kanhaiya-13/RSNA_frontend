'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import CaseReviewPage from '@/components/CaseReviewPage/CaseReviewPage';

interface Props {
  params: Promise<{ caseId: string }>;
}

export default function CasePage({ params }: Props) {
  const { caseId } = use(params);
  const { getCase } = useAppState();
  const caseData = getCase(caseId);
  if (!caseData) return notFound();
  return <CaseReviewPage caseData={caseData} />;
}
