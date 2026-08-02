'use client';

/**
 * app/dev-bench-3d-2/page.tsx — BENCH TẠM (3D-2, 02/08), KHÔNG phải sản phẩm — xoá sau khi đo
 * xong (cùng tinh thần `app/dev-bench-3d` của 3D-1, đã xoá). Đo thời gian THẬT của
 * `captureSequence()` (WebGL thật, không giả lập) trên 1 scene tổng hợp ~24k tam giác (khớp quy
 * mô bench 3D-1 đã ghi trong STATUS.md để so sánh ngang hàng).
 */
import { useEffect, useState } from 'react';
import type { Scene3DData, SceneGroup } from '@/lib/three/cad-to-obj';
import type { CamPathResult } from '@/lib/cad/campath';
import { captureSequence } from '@/lib/three/capture';

/** 1 hộp 12 tam giác (6 mặt × 2), toạ độ ĐÃ Ở HỆ three.js (mét, Y-up) — khớp quy ước SceneGroup. */
function pushBox(positions: number[], cx: number, cz: number, w: number, d: number, h: number) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const y0 = 0;
  const y1 = h;
  const c: [number, number, number][] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
    [x0, y1, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  const faces = [
    [0, 1, 2, 0, 2, 3],
    [4, 6, 5, 4, 7, 6],
    [0, 4, 5, 0, 5, 1],
    [1, 5, 6, 1, 6, 2],
    [2, 6, 7, 2, 7, 3],
    [3, 7, 4, 3, 4, 0],
  ];
  for (const f of faces) for (const idx of f) positions.push(...c[idx]);
}

function buildBenchScene(): Scene3DData {
  // Lưới 50×40 = 2000 hộp × 12 tam giác = 24.000 tam giác — khớp số 3D-1 (STATUS.md: "2040
  // entity/24k tam giác"). Gộp theo 4 màu (i+j)%4 → 4 SceneGroup, khớp cách gộp draw call thật.
  const groups: SceneGroup[] = [0, 1, 2, 3].map((k) => ({
    name: `bench-${k}`,
    colorHex: ['#b08968', '#8d99ae', '#606c38', '#bc6c25'][k],
    positions: [] as number[],
  }));
  const cols = 50;
  const rows = 40;
  const spacing = 1.2; // mét
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const g = groups[(i + j) % 4];
      pushBox(g.positions, i * spacing, j * spacing, 0.8, 0.8, 0.75 + ((i * 7 + j * 13) % 5) * 0.1);
    }
  }
  const wM = cols * spacing;
  const dM = rows * spacing;
  return {
    groups,
    bboxMm: { minX: 0, minY: 0, maxX: wM * 1000, maxY: dM * 1000 },
    sizeM: { w: wM, d: dM, h: 2.7 },
  };
}

function buildBenchPath(): CamPathResult {
  // Đường thẳng CAD dọc theo lưới, 4 giây, dirRad=0 (nhìn +X CAD) — đủ để camera bay qua nhiều
  // hộp mỗi khung (không đứng yên 1 chỗ, tránh đo nhầm trường hợp render trivial do view cắt hết).
  const wMm = 50 * 1.2 * 1000;
  return {
    samples: [
      { point: { x: 2000, y: 24000 }, dirRad: 0, tSec: 0, cumLenMm: 0 },
      { point: { x: wMm - 2000, y: 24000 }, dirRad: 0, tSec: 4, cumLenMm: wMm - 4000 },
    ],
    totalLengthMm: wMm - 4000,
    totalDurationSec: 4,
  };
}

export default function Bench3D2Page() {
  const [log, setLog] = useState<string[]>(['(đang chạy...)']);

  useEffect(() => {
    const lines: string[] = [];
    const push = (s: string) => {
      lines.push(s);
      console.log('[bench-3d-2]', s);
      setLog([...lines]);
    };

    const scene = buildBenchScene();
    const path = buildBenchPath();
    const triCount = scene.groups.reduce((sum, g) => sum + g.positions.length / 9, 0);
    push(`Scene tổng hợp: ${scene.groups.length} group, ${triCount} tam giác, bbox ${scene.sizeM.w}×${scene.sizeM.d}m.`);
    push(`Đường cam: ${path.totalDurationSec}s, ${path.totalLengthMm}mm.`);

    const fps = 15;
    const w = 640;
    const h = 360;
    const perFrameMs: number[] = [];
    let lastT = performance.now();
    const t0 = performance.now();

    const result = captureSequence(scene, path, {
      fps,
      w,
      h,
      onFrame: (f) => {
        const now = performance.now();
        perFrameMs.push(now - lastT);
        lastT = now;
        if (f.index === 0) push(`Khung đầu (i=0, t=${f.tSec.toFixed(3)}s) render xong, dataUrl dài ${f.dataUrl.length} ký tự.`);
      },
    });
    const t1 = performance.now();

    const totalMs = t1 - t0;
    const avgMs = perFrameMs.reduce((a, b) => a + b, 0) / perFrameMs.length;
    const maxMs = Math.max(...perFrameMs);
    const minMs = Math.min(...perFrameMs);

    push(`XONG — ${result.frameCount} khung (fps=${fps}, ${w}×${h}px, aborted=${result.aborted}).`);
    push(`Tổng thời gian THẬT: ${totalMs.toFixed(1)}ms cho ${result.frameCount} khung.`);
    push(`Trung bình/khung: ${avgMs.toFixed(2)}ms · nhanh nhất: ${minMs.toFixed(2)}ms · chậm nhất: ${maxMs.toFixed(2)}ms.`);
    push(`___DONE___`);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
      <h1>Bench 3D-2 captureSequence (tạm, xoá sau khi đo)</h1>
      {log.join('\n')}
    </div>
  );
}
