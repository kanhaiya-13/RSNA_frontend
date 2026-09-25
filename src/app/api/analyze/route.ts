import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const patientId = (formData.get('patientId') as string) || `PT-###-${Math.floor(1000 + Math.random() * 9000)}`;
    const studyDate = (formData.get('studyDate') as string) || new Date().toISOString().split('T')[0];
    const plane = ((formData.get('plane') as string) || 'sagittal').toLowerCase() as 'sagittal' | 'coronal' | 'axial';
    const notes = (formData.get('notes') as string) || '';

    // Create a temporary folder for uploaded files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mri_upload_'));

    let savedFilesCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        await fs.writeFile(path.join(tempDir, `${i.toString().padStart(3, '0')}_${safeName}`), buffer);
        savedFilesCount++;
      }
    }

    const rsnaModelDir = path.resolve(process.cwd(), '..', 'RSNA_model');
    const predictScript = path.join(rsnaModelDir, 'predict.py');

    // Execute PyTorch prediction script
    const pyOutput = await new Promise<string>((resolve, reject) => {
      const targetInput = savedFilesCount > 0 ? tempDir : path.join(rsnaModelDir, 'outputs');
      const pyProcess = spawn('python', [predictScript, '--input', targetInput], {
        cwd: rsnaModelDir,
      });

      let stdout = '';
      let stderr = '';

      pyProcess.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      pyProcess.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      pyProcess.on('close', (code) => {
        // Clean up temp dir asynchronously
        fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        if (code === 0 && stdout.trim()) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || stdout || `Process exited with code ${code}`));
        }
      });

      pyProcess.on('error', (err) => {
        fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        reject(err);
      });
    });

    const mlResult = JSON.parse(pyOutput);

    if (!mlResult.success) {
      throw new Error(mlResult.error || 'Model inference failed');
    }

    const caseId = `case-uploaded-${Date.now()}`;
    const seriesId = `s-uploaded-${Date.now()}`;
    const sliceCount = mlResult.num_slices || (savedFilesCount > 0 ? savedFilesCount : 24);

    // Map findings
    const findings = mlResult.findings.map((f: any, idx: number) => ({
      findingId: `${caseId}-f${idx}`,
      findingName: f.findingName,
      probability: f.probability,
      confidenceTier: f.confidenceTier,
      modelReliabilityTier: f.modelReliabilityTier,
      contributingSeries: [seriesId],
      sliceScores: f.sliceScores,
      peakSliceIndex: f.peakSliceIndex,
      reviewState: 'unreviewed',
      doctorNote: notes ? `Doctor clinical note: ${notes}` : undefined,
    }));

    const newCase = {
      caseId,
      patientIdMasked: patientId,
      studyDate,
      readStatus: 'unread',
      isUploaded: true,
      series: [
        {
          seriesId,
          plane,
          sliceCount,
        },
      ],
      findings,
    };

    return NextResponse.json({
      success: true,
      caseData: newCase,
      modelName: mlResult.model || 'ResNet-34 5-Fold Ensemble',
    });

  } catch (err: any) {
    console.error('API analyze error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process MRI scan' },
      { status: 500 }
    );
  }
}
