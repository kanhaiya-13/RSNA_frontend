'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import styles from './UploadModal.module.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();
  const { addUploadedCase } = useAppState();

  const [files, setFiles] = useState<File[]>([]);
  const [patientId, setPatientId] = useState(`PT-###-${Math.floor(1000 + Math.random() * 9000)}`);
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);
  const [plane, setPlane] = useState<'sagittal' | 'coronal' | 'axial'>('sagittal');
  const [notes, setNotes] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setErrorMsg('');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setErrorMsg('');
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisStep('Uploading MRI scan files & preparing volume...');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('patientId', patientId);
      formData.append('studyDate', studyDate);
      formData.append('plane', plane);
      formData.append('notes', notes);

      setAnalysisStep('Running 2.5D ResNet-34 5-Fold Ensemble Model...');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze MRI scan');
      }

      setAnalysisStep('Finalizing 12 abnormality probability predictions...');

      // Add to global state
      addUploadedCase(data.caseData);

      // Short pause for UX feedback
      setTimeout(() => {
        setIsAnalyzing(false);
        onClose();
        router.push(`/case/${data.caseData.caseId}`);
      }, 600);

    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || 'Error occurred during AI model analysis.');
      setIsAnalyzing(false);
    }
  }

  return (
    <div className={styles.backdrop} onClick={() => !isAnalyzing && onClose()}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.headerIcon}>⚡</span>
            <div>
              <h2 className={styles.title}>Upload & Analyze MRI Scan</h2>
              <p className={styles.subtitle}>Run trained ResNet-34 5-fold ensemble model on new scan</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} disabled={isAnalyzing}>×</button>
        </div>

        <form onSubmit={handleAnalyze} className={styles.form}>
          {/* File Drop Area */}
          <div
            className={`${styles.dropzone} ${files.length > 0 ? styles.dropzoneHasFiles : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.dcm,.nii,.nii.gz,.npz"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div className={styles.dropIcon}>📁</div>
            {files.length === 0 ? (
              <>
                <div className={styles.dropText}>
                  <strong>Click to select</strong> or drag & drop MRI scan files
                </div>
                <div className={styles.dropHint}>Supports PNG, JPG, DICOM (.dcm), NIfTI (.nii), or NPZ volumes</div>
              </>
            ) : (
              <div className={styles.fileSelectedText}>
                <strong>{files.length} file{files.length > 1 ? 's' : ''} selected</strong>
                <span className={styles.fileListPreview}>
                  {files.slice(0, 3).map(f => f.name).join(', ')}
                  {files.length > 3 ? ` +${files.length - 3} more` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Input metadata grid */}
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Patient ID (Masked)</label>
              <input
                type="text"
                className={styles.input}
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                required
                disabled={isAnalyzing}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Study Date</label>
              <input
                type="date"
                className={styles.input}
                value={studyDate}
                onChange={e => setStudyDate(e.target.value)}
                required
                disabled={isAnalyzing}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>MRI Acquisition Plane</label>
              <select
                className={styles.select}
                value={plane}
                onChange={e => setPlane(e.target.value as any)}
                disabled={isAnalyzing}
              >
                <option value="sagittal">Sagittal</option>
                <option value="coronal">Coronal</option>
                <option value="axial">Axial</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Clinical Notes / Indication (Optional)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Right knee pain following sports injury..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          {errorMsg && (
            <div className={styles.errorBanner}>
              ⚠️ {errorMsg}
            </div>
          )}

          {isAnalyzing && (
            <div className={styles.analyzingBox}>
              <div className={styles.spinner} />
              <div className={styles.analyzingText}>
                <strong>Analyzing MRI with PyTorch Ensemble…</strong>
                <span>{analysisStep}</span>
              </div>
            </div>
          )}

          <div className={styles.footerActions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isAnalyzing}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isAnalyzing}
              style={{ minWidth: '180px' }}
            >
              {isAnalyzing ? 'Processing...' : '⚡ Analyze Scan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
