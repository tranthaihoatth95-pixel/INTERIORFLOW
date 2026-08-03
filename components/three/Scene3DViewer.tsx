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
 * 3D-4: mode `section` — `renderer.clippingPlanes` theo `sectionMm` (`lib/three/section.ts`
 * `sectionPlane()`, quyết định #5 "0 thuật toán tự viết"). Nền chế độ Công trường — cắt lớp
 * (tablet). Mode `walk` — đi bộ tự do, tầm mắt CỐ ĐỊNH 1650mm (`EYE_HEIGHT_MM`, CÙNG hằng số
 * campath) qua `PointerLockControls` (three chuẩn) + WASD, KHÔNG tự viết vector di chuyển
 * (`controls.moveForward/moveRight` có sẵn, tự chiếu phẳng theo hướng nhìn — không bay lên/xuống
 * theo pitch).
 * 3D-5: mode `massing` — push-pull khối (SketchUp-level, bậc B1 thang BIM
 * `CHOT-HUONG-3D-2026-08-01.md`). Kéo mặt TRÊN 1 tường đổi cao độ SỐNG (preview qua scale.y, tường
 * luôn đùn từ đáy 0 nên scale chính xác) — nhả chuột gọi `onPushPull(entityId, newHeightMm)` MỘT
 * LẦN, component KHÔNG tự ghi Doc. Nguồn cao độ tường là `entity.heightMm` (`lib/cad/model.ts`) —
 * `docToObjScene()` đọc lại field này mỗi lần dựng scene, viewer không giữ bản riêng (luật một
 * nguồn — cấm lặp bệnh hai-nguồn đã trả giá ở Brand Kit).
 *
 * Thiếu `camPath`/`sectionMm` tương ứng → rơi về orbit, không throw, cảnh báo console 1 lần.
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
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { buildMergedGeometries, buildMassingWalls } from '@/lib/three/obj-scene-to-geometry';
import { clampWallHeight, type Scene3DData } from '@/lib/three/cad-to-obj';
import { camPathSampleToThree, sampleCamPathAt, EYE_HEIGHT_MM } from '@/lib/three/capture';
import { sectionPlane, type SectionSpec } from '@/lib/three/section';
import type { CamPathResult } from '@/lib/cad/campath';

export type Scene3DMode = 'orbit' | 'walk' | 'campath' | 'section' | 'massing';

export interface Scene3DViewerProps {
  scene: Scene3DData;
  mode: Scene3DMode;
  camPath?: CamPathResult;
  /** mặt cắt cho mode `section` (3D-4) — thiếu → rơi về orbit. */
  sectionMm?: SectionSpec;
  /** đồng bộ UI ngoài (thanh tua) — gọi mỗi khung hình với giây đã trôi từ lúc mount. */
  onFrame?: (t: number) => void;
  /** 3D-5 push-pull (mode `massing`) — kéo mặt TRÊN 1 tường xong (pointerup) gọi 1 lần với id
   * entity + cao độ mới (mm, đã kẹp [2000,6000]). Component KHÔNG tự ghi vào Doc — nơi gọi ghi
   * qua `useCadStore.updateEntities` rồi truyền lại `scene` MỚI (luật một nguồn, xem
   * `CHOT-HUONG-3D-2026-08-01.md`). Đọc qua ref (giống `onFrame`) — KHÔNG nằm trong deps effect
   * chính để đổi ref mỗi render không dựng lại toàn cảnh. */
  onPushPull?: (entityId: string, newHeightMm: number) => void;
  /** SÂN KHẤU: lưới sàn + đường chân trời. Mở mode Vẽ 3D lúc CHƯA có khối nào vẫn phải thấy mình
   * đang đứng trong một không gian (chuẩn Blender/SketchUp mở file trống — Hoà chê 04/08 "rối
   * rắm, không hệ thống"). MẶC ĐỊNH TẮT vì mọi nơi CHỤP ẢNH (campath/capture/xuất) không được
   * dính lưới vào khung hình. */
  ground?: boolean;
  className?: string;
}

const IMPLEMENTED_MODES: Scene3DMode[] = ['orbit', 'campath', 'section', 'walk', 'massing'];
const WALK_SPEED_M_PER_SEC = 1.5; // ~tốc độ đi bộ chậm, cùng cảm giác tempo với campath 1200mm/s

export default function Scene3DViewer({ scene, mode, camPath, sectionMm, onFrame, onPushPull, ground = false, className }: Scene3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const campathActive = mode === 'campath' && !!camPath?.samples.length;
  const sectionActive = mode === 'section' && !!sectionMm;
  const walkActive = mode === 'walk';
  const massingActive = mode === 'massing';
  const onPushPullRef = useRef(onPushPull);
  onPushPullRef.current = onPushPull;

  useEffect(() => {
    if (!IMPLEMENTED_MODES.includes(mode)) {
      // eslint-disable-next-line no-console
      console.warn(`Scene3DViewer: mode "${mode}" lạ (ngoài orbit/campath/section/walk) — hiển thị tạm như orbit.`);
    }
    if (mode === 'campath' && !camPath?.samples.length) {
      // eslint-disable-next-line no-console
      console.warn('Scene3DViewer: mode "campath" nhưng thiếu camPath (hoặc rỗng) — hiển thị tạm như orbit.');
    }
    if (mode === 'section' && !sectionMm) {
      // eslint-disable-next-line no-console
      console.warn('Scene3DViewer: mode "section" nhưng thiếu sectionMm — hiển thị tạm như orbit (không cắt).');
    }
  }, [mode, camPath, sectionMm]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Mặt cắt (mode section, 3D-4) — bật sẵn cờ này (0 phí khi clippingPlanes rỗng), chỉ nạp
    // plane thật khi có sectionMm hợp lệ.
    renderer.localClippingEnabled = true;
    renderer.clippingPlanes = sectionActive && sectionMm ? [sectionPlane(sectionMm)] : [];
    container.appendChild(renderer.domElement);

    const three = new THREE.Scene();
    three.background = new THREE.Color('#2a2d33');

    // SÂN KHẤU (ground) — lưới sàn 1m/10m + sương xa làm ĐƯỜNG CHÂN TRỜI (lưới tan dần thay vì
    // cắt cụt ở rìa). Chỉ thêm object, không đụng cách dựng khối/camera phía dưới.
    if (ground) {
      const grid = new THREE.GridHelper(200, 200, 0x5a6472, 0x3a4048);
      const gridMat = grid.material as THREE.Material & { transparent: boolean; opacity: number; depthWrite: boolean };
      gridMat.transparent = true;
      gridMat.opacity = 0.55;
      gridMat.depthWrite = false; // lưới nằm dưới khối, không "ăn" vào mặt khối khi nhìn xiên
      three.add(grid);
      three.fog = new THREE.Fog(0x2a2d33, 18, 90);
    }

    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 500);

    // Khung camera bao trọn bbox mặt bằng (mm → m) — bù xuống 1 chút trên cao nhìn xuống, đúng
    // cảm giác "quan sát" (orbit) chứ không phải "đứng trong phòng" (đó là mode walk).
    const { minX, minY, maxX, maxY } = scene.bboxMm;
    const cx = (minX + maxX) / 2 / 1000;
    const cy = (minY + maxY) / 2 / 1000;
    // ⚠️ TỒN TẠI (thấy khi verify 04/08, KHÔNG sửa ở phiếu này): cảnh chỉ có 1 bức tường lẻ thì
    // camera áp rất sát và khối nằm LỆCH TÂM khung — nghi `controls.target` dùng (cx, cz, cy)
    // trong khi phép chiếu CAD→three là (x, cao, −y), tức trục thứ 3 phải là −cy. Đây là hành vi
    // engine có sẵn từ 3D-1, đụng vào là đổi khung hình của cả campath/capture ⇒ để PHU quyết.
    const halfDiag = Math.max(0.5, Math.hypot(maxX - minX, maxY - minY) / 2 / 1000);
    const cz = scene.sizeM.h / 2;

    if (walkActive) {
      // Đứng giữa mặt bằng, mắt cố định 1650mm (EYE_HEIGHT_MM, CÙNG số campath) — nhìn ngang.
      camera.position.set(cx, EYE_HEIGHT_MM / 1000, cy);
      camera.lookAt(cx + 1, EYE_HEIGHT_MM / 1000, cy);
    } else {
      camera.position.set(cx + halfDiag * 1.1, cz + halfDiag * 0.9, cy + halfDiag * 1.1);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cz, cy);
    controls.enableDamping = true;
    controls.enabled = !walkActive && !campathActive; // walk/campath tự lái camera, orbit nhường
    controls.update();

    // Mode walk (3D-4) — PointerLockControls chuẩn three (KHÔNG tự viết vector nhìn/di chuyển).
    // Cần cú click (kích hoạt Pointer Lock API) — hint phủ toàn khung, ẩn khi đã lock.
    const walkControls = new PointerLockControls(camera, renderer.domElement);
    const moveState = { forward: false, back: false, left: false, right: false };
    let hintEl: HTMLDivElement | null = null;
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.back = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') moveState.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') moveState.back = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') moveState.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') moveState.right = false;
    }
    function onHintClick() {
      walkControls.lock();
    }
    function onLock() {
      if (hintEl) hintEl.style.display = 'none';
    }
    function onUnlock() {
      if (hintEl) hintEl.style.display = 'flex';
    }
    if (walkActive) {
      hintEl = document.createElement('div');
      hintEl.textContent = 'Bấm để đi bộ tự do — WASD di chuyển, chuột nhìn quanh, Esc thoát';
      hintEl.style.cssText =
        'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:rgba(0,0,0,.55);color:#fff;font-size:13px;cursor:pointer;z-index:5;';
      container.appendChild(hintEl);
      hintEl.addEventListener('click', onHintClick);
      walkControls.addEventListener('lock', onLock);
      walkControls.addEventListener('unlock', onUnlock);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
    }

    // Mode massing (3D-5): tường tách RIÊNG mesh/entity (raycasting push-pull cần biết đúng
    // tường nào bị kéo) — loại khỏi đường gộp-theo-màu (quyết định #2 chỉ tối ưu hiển thị TĨNH,
    // massing cần tương tác từng khối). Số tường thường vài chục — 1 draw call/tường chấp nhận
    // được ở chế độ chỉnh sửa (khác hẳn cảnh quan sát ngàn entity).
    const staticScene = massingActive ? { ...scene, groups: scene.groups.filter((g) => !g.entityId) } : scene;
    const built = buildMergedGeometries(staticScene);
    const group = new THREE.Group();
    for (const b of built) {
      const material = new THREE.MeshBasicMaterial({ color: b.colorHex, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(b.geometry, material));
    }
    three.add(group);

    const massingWalls = massingActive ? buildMassingWalls(scene) : [];
    const massingMeshes: THREE.Mesh[] = [];
    for (const w of massingWalls) {
      const material = new THREE.MeshBasicMaterial({ color: w.colorHex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(w.geometry, material);
      mesh.userData = { entityId: w.entityId, baseHeightMm: w.baseHeightMm };
      massingMeshes.push(mesh);
      group.add(mesh);
    }

    // Push-pull (3D-5) — kéo mặt TRÊN 1 tường = đổi cao độ. Tường luôn đùn từ đáy z(three.y)=0
    // (`docToObjScene` lăng trụ đứng z0=0) nên scale.y quanh gốc 0 co-giãn ĐÚNG chiều cao mới,
    // khỏi build lại geometry mỗi khung kéo (rẻ, mượt) — chỉ tính lại geometry thật khi Doc đổi
    // và `scene` prop mới truyền xuống (luật một nguồn, xem comment `onPushPull` ở trên).
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragPoint = new THREE.Vector3();
    let dragging: { mesh: THREE.Mesh; entityId: string; baseHeightMm: number } | null = null;

    function ndcFromEvent(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    function onPointerDown(e: PointerEvent) {
      if (!massingMeshes.length) return;
      ndcFromEvent(e);
      raycaster.setFromCamera(pointerNdc, camera);
      const hit = raycaster.intersectObjects(massingMeshes, false)[0];
      if (!hit || !hit.face) return;
      const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (worldNormal.y < 0.5) return; // chỉ mặt TRÊN (đỉnh tường) mới có nghĩa "cao tường"
      const mesh = hit.object as THREE.Mesh;
      const ud = mesh.userData as { entityId: string; baseHeightMm: number };
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const planeNormal = new THREE.Vector3(camDir.x, 0, camDir.z);
      if (planeNormal.lengthSq() < 1e-6) planeNormal.set(0, 0, 1);
      planeNormal.normalize();
      dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hit.point);
      dragging = { mesh, entityId: ud.entityId, baseHeightMm: ud.baseHeightMm };
      controls.enabled = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      ndcFromEvent(e);
      raycaster.setFromCamera(pointerNdc, camera);
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      const newHeightM = Math.max(2, Math.min(6, dragPoint.y));
      dragging.mesh.scale.y = newHeightM / (dragging.baseHeightMm / 1000);
    }
    function onPointerUp(e: PointerEvent) {
      if (!dragging) return;
      const newHeightMm = clampWallHeight(Math.round((dragging.baseHeightMm * dragging.mesh.scale.y) / 10) * 10);
      onPushPullRef.current?.(dragging.entityId, newHeightMm);
      dragging = null;
      controls.enabled = !walkActive && !campathActive;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
    }
    if (massingActive) {
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('pointerup', onPointerUp);
      renderer.domElement.addEventListener('pointercancel', onPointerUp);
    }

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
      const dt = timer.getDelta();
      if (campathActive && camPath) {
        // Phát lặp (loop) đường cam — video 2-b xem trước ở đây, xuất file thật qua
        // captureSequence() (capture.ts, CÙNG camPathSampleToThree nên khung xem = khung xuất).
        const loopT = camPath.totalDurationSec > 0 ? t % camPath.totalDurationSec : 0;
        const pose = camPathSampleToThree(sampleCamPathAt(camPath, loopT));
        camera.position.copy(pose.position);
        camera.lookAt(pose.target);
      } else if (walkActive && walkControls.isLocked) {
        // moveForward/moveRight (PointerLockControls) tự chiếu phẳng theo hướng nhìn — không cần
        // tự tính vector di chuyển. Khoá cứng cao độ mắt sau mỗi bước (phòng trôi số/thay đổi
        // hành vi thư viện sau này — 2 lệnh move ở trên vốn không đổi Y nhưng khoá cho chắc).
        if (moveState.forward) walkControls.moveForward(WALK_SPEED_M_PER_SEC * dt);
        if (moveState.back) walkControls.moveForward(-WALK_SPEED_M_PER_SEC * dt);
        if (moveState.right) walkControls.moveRight(WALK_SPEED_M_PER_SEC * dt);
        if (moveState.left) walkControls.moveRight(-WALK_SPEED_M_PER_SEC * dt);
        camera.position.y = EYE_HEIGHT_MM / 1000;
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
      walkControls.dispose();
      if (hintEl) {
        hintEl.removeEventListener('click', onHintClick);
        container.removeChild(hintEl);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (massingActive) {
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      }
      for (const b of built) {
        b.geometry.dispose();
      }
      for (const w of massingWalls) {
        w.geometry.dispose();
      }
      group.children.forEach((m) => {
        if (m instanceof THREE.Mesh) (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // scene/mode/camPath/sectionMm đổi → dựng lại toàn bộ (đơn giản, đúng đủ — hình học tĩnh, chỉ
    // camera đổi mỗi khung trong campath/walk; onFrame CỐ Ý không nằm trong deps, đổi ref mỗi
    // render sẽ dựng lại vô ích). 💭 kéo thanh trượt sectionMm.at liên tục sẽ dựng lại TOÀN BỘ mỗi
    // lần đổi (không incremental-update riêng clippingPlanes) — chấp nhận được ở V1 (rebuild
    // scene vài chục ms, xem bench 3D-1), tối ưu sau nếu UI thật thấy giật khi kéo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mode, camPath, sectionMm, ground]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative' }} />;
}
