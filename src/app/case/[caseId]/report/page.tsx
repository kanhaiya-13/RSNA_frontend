'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import ReportPage from '@/components/ReportPage/ReportPage';

interface Props {
  params: Promise<{ caseId: string }>;
}

export default function ReportRoutePage({ params }: Props) {
  const { caseId } = use(params);
  const { getCase } = useAppState();
  const caseData = getCase(caseId);
  if (!caseData) return notFound();
  return <ReportPage caseData={caseData} />;
}
