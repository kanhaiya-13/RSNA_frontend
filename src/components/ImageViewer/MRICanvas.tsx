'use client';

import { useRef, useEffect, useCallback } from 'react';

interface MRICanvasProps {
  sliceIndex: number;
  sliceCount: number;
  plane: 'sagittal' | 'coronal' | 'axial';
  width?: number;
  height?: number;
}

// Generate a deterministic but anatomically-plausible grayscale MRI slice
function drawMRISlice(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sliceIndex: number,
  sliceCount: number,
  plane: string,
  seed: number
) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const imageData = ctx.createImageData(w, h);
  const d = imageData.data;

  // Deterministic pseudo-random seeded by slice+plane
  function seededRandom(s: number) {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  const cx = w / 2, cy = h / 2;
  // Joint-like ellipse params vary slightly per plane
  const rx = plane === 'axial' ? w * 0.38 : w * 0.30;
  const ry = plane === 'axial' ? h * 0.38 : h * 0.42;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer fat ring
      const outerDist = Math.sqrt(
        ((x - cx) / (rx * 1.35)) ** 2 + ((y - cy) / (ry * 1.35)) ** 2
      );

      let intensity = 0;

      if (outerDist <= 1.0 && dist > 1.0) {
        // Fat: bright outer ring
        intensity = 200 + seededRandom(seed + x * 0.01 + y * 0.007) * 40;
      } else if (dist <= 1.0) {
        // Inside joint
        const innerCx = cx + (plane === 'sagittal' ? -w * 0.05 : 0);
        const innerCy = cy - h * 0.08;
        const cartDist = Math.sqrt(((x - innerCx) / (rx * 0.55)) ** 2 + ((y - innerCy) / (ry * 0.12)) ** 2);
        const cartDist2 = Math.sqrt(((x - cx) / (rx * 0.5)) ** 2 + ((y - cy + h * 0.15) / (ry * 0.1)) ** 2);

        if (cartDist <= 1.0 || cartDist2 <= 1.0) {
          // Cartilage — bright white/grey
          intensity = 180 + seededRandom(seed + x + y * 100) * 30;
        } else {
          // Bone / marrow — mid grey with noise
          const boneNoise = seededRandom(seed + x * 0.05 + y * 0.08) * 60;
          const trabeculae = seededRandom(seed + x * 0.7 + y * 0.9) * 30;
          const sliceVar = Math.sin((sliceIndex / 24) * Math.PI) * 20;
          intensity = 80 + boneNoise + trabeculae + sliceVar;
          // Small dark artifacts (fluid, tears)
          if (seededRandom(seed + x * 1.3 + y * 0.4) > 0.97) intensity = 10 + seededRandom(seed + x + y) * 20;
        }
      } else {
        // Background soft tissue — very dark with slight muscle texture
        const muscle = seededRandom(seed + x * 0.15 + y * 0.22) * 18;
        intensity = muscle;
      }

      // Mild vignette
      const vignette = 1 - 0.35 * Math.max(0, outerDist - 1.1);

      d[idx]     = Math.min(255, intensity * vignette);
      d[idx + 1] = Math.min(255, intensity * vignette);
      d[idx + 2] = Math.min(255, intensity * vignette);
      d[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Slice label overlay
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.fillText(`${plane.toUpperCase()} · Slice ${sliceIndex + 1}/${sliceCount ?? 24}`, 10, h - 10);
}

export default function MRICanvas({ sliceIndex, sliceCount, plane, width = 480, height = 420 }: MRICanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const seed = sliceIndex * 137 + plane.charCodeAt(0) * 31 + sliceCount * 7;
    drawMRISlice(ctx, width, height, sliceIndex, sliceCount, plane, seed);
  }, [sliceIndex, plane, sliceCount, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
