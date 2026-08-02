'use client';

/**
 * components/three/Scene3DViewer.tsx — TẦNG TRÌNH CHIẾU (B) của hạ tầng 3D lõi
 * (`docs/SPEC-3D-CORE.md` §1/§3). MỘT component duy nhất cho cả 4 nơi tiêu thụ (video bậc 2-b ·
 * Đổi góc phối cảnh · Công trường cắt lớp · D5 handoff) — cấm mỗi nơi tự dựng viewer riêng.
 *
 * 3D-1: mode `orbit` — khung máy tự đặt bao trọn scene, OrbitControls xoay quan sát tự do.
 * 3D-2: mode `campath` — camera bám theo `CamPathResult` (campath.ts, V2) mỗi khung hình, tầm
 * mắt người 1650mm (`lib/three/capture.ts` `camPathSampleToThree`, CÙNG công thức `captureSequence`
 * dùng để xuất khung hình video 2-b — xem live ở đây với xuất file dùng chung 1 nguồn toạ độ).
 * Không có `camPath` (thiếu prop) → rơi về orbit, không throw. `walk`/`section` GIỮ chữ ký đúng
 * hợp đồng §3 nhưng chưa có hành vi riêng — tạm render như orbit, cảnh báo console 1 lần. Thi
 * công thật ở 3D-4, xem bảng thứ tự §4.
 *
 * Xám trơn, KHÔNG PBR/đèn/bóng đổ (quyết định #3) — `MeshBasicMaterial` phẳng theo `colorHex` của
 * từng group, không cần ánh sáng. Hình học đến từ `buildMergedGeometries` (gộp theo màu = gộp
 * theo lớp, quyết định #2 + FPS §4.1) — ~6 draw call thay vì 1/entity.
 *
 * Nặng vì kéo theo `three` (~170KB gzip, quyết định #1) — component này (và mọi thứ nó import
 * tĩnh, gồm `lib/three/obj-scene-to-geometry.ts`) CHỈ được tải khi nơi gọi dùng
 * `next/dynamic(() => import('./Scene3DViewer'), { ssr: false })` — KHÔNG import tĩnh từ trang
 * tải ngay khi mở app (xem cách `PresentEditor` đã lày làm với `PresentSheets.tsx`).
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildMergedGeometries } from '@/lib/three/obj-scene-to-geometry';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import { camPathSampleToThree, sampleCamPathAt } from '@/lib/three/capture';
import type { CamPathResult } from '@/lib/cad/campath';

export type Scene3DMode = 'orbit' | 'walk' | 'campath' | 'section';

export interface Scene3DViewerProps {
  scene: Scene3DData;
  mode: Scene3DMode;
  /** TODO 3D-2 — chưa dùng ở 3D-1. */
  camPath?: CamPathResult;
  /** TODO 3D-4 — chưa dùng ở 3D-1. */
  sectionMm?: { axis: 'x' | 'y' | 'z'; at: number };
  /** đồng bộ UI ngoài (thanh tua) — gọi mỗi khung hình với giây đã trôi từ lúc mount. */
  onFrame?: (t: number) => void;
  className?: string;
}

let warnedUnsupportedMode = false;

const IMPLEMENTED_MODES: Scene3DMode[] = ['orbit', 'campath'];

export default function Scene3DViewer({ scene, mode, camPath, onFrame, className }: Scene3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const campathActive = mode === 'campath' && !!camPath?.samples.length;

  useEffect(() => {
    if (!IMPLEMENTED_MODES.includes(mode) && !warnedUnsupportedMode) {
      warnedUnsupportedMode = true;
      // eslint-disable-next-line no-console
      console.warn(`Scene3DViewer: mode "${mode}" chưa thi công (3D-4) — hiển thị tạm như orbit.`);
    }
    if (mode === 'campath' && !camPath?.samples.length) {
      // eslint-disable-next-line no-console
      console.warn('Scene3DViewer: mode "campath" nhưng thiếu camPath (hoặc rỗng) — hiển thị tạm như orbit.');
    }
  }, [mode, camPath]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const three = new THREE.Scene();
    three.background = new THREE.Color('#2a2d33');

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 500);

    // Khung camera bao trọn bbox mặt bằng (mm → m) — bù xuống 1 chút trên cao nhìn xuống, đúng
    // cảm giác "quan sát" (orbit) chứ không phải "đứng trong phòng" (đó là mode walk, 3D-4).
    const { minX, minY, maxX, maxY } = scene.bboxMm;
    const cx = (minX + maxX) / 2 / 1000;
    const cy = (minY + maxY) / 2 / 1000;
    const halfDiag = Math.max(0.5, Math.hypot(maxX - minX, maxY - minY) / 2 / 1000);
    const cz = scene.sizeM.h / 2;
    camera.position.set(cx + halfDiag * 1.1, cz + halfDiag * 0.9, cy + halfDiag * 1.1);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cz, cy);
    controls.enableDamping = true;
    controls.update();

    const built = buildMergedGeometries(scene);
    const group = new THREE.Group();
    for (const b of built) {
      const material = new THREE.MeshBasicMaterial({ color: b.colorHex, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(b.geometry, material));
    }
    three.add(group);

    function resize() {
      if (!container) return;
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const timer = new THREE.Timer();
    let raf = 0;
    function tick() {
      timer.update();
      const t = timer.getElapsed();
      if (campathActive && camPath) {
        // Phát lặp (loop) đường cam — video 2-b xem trước ở đây, xuất file thật qua
        // captureSequence() (capture.ts, CÙNG camPathSampleToThree nên khung xem = khung xuất).
        const loopT = camPath.totalDurationSec > 0 ? t % camPath.totalDurationSec : 0;
        const pose = camPathSampleToThree(sampleCamPathAt(camPath, loopT));
        camera.position.copy(pose.position);
        camera.lookAt(pose.target);
      } else {
        controls.update();
      }
      renderer.render(three, camera);
      onFrame?.(t);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      for (const b of built) {
        b.geometry.dispose();
      }
      group.children.forEach((m) => {
        if (m instanceof THREE.Mesh) (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // scene/mode/camPath đổi → dựng lại toàn bộ (đơn giản, đúng đủ — hình học tĩnh, chỉ camera
    // đổi mỗi khung trong campath; onFrame CỐ Ý không nằm trong deps, đổi ref mỗi render sẽ dựng
    // lại vô ích).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mode, camPath]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: 320 }} />;
}
