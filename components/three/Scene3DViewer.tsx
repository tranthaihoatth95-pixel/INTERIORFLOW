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
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { buildMergedGeometries, buildMassingWalls, isMassingWallGroup } from '@/lib/three/obj-scene-to-geometry';
import { clampWallHeight, cadToThreeM, type Scene3DData } from '@/lib/three/cad-to-obj';
import { camPathSampleToThree, sampleCamPathAt, EYE_HEIGHT_MM } from '@/lib/three/capture';
import { sectionPlane, type SectionSpec } from '@/lib/three/section';
import type { CamPathResult } from '@/lib/cad/campath';

export type Scene3DMode = 'orbit' | 'walk' | 'campath' | 'section' | 'massing';

/** PHIẾU ĐỢT 7 NHÓM B — cầu nối camera SỐNG cho ViewCube3D (`ViewCube3D.tsx`) đọc mỗi khung hình
 * (copy quaternion để cube xoay đồng bộ) và ghi trực tiếp (orbit khi kéo cube, bay tới khi bấm
 * mặt/cạnh/góc). Component này KHÔNG biết gì về ViewCube — chỉ xuất object sống qua ref khi
 * camera/controls dựng xong, xoá khi unmount. `OrbitControls.update()` mỗi khung (đã có sẵn trong
 * tick() dưới) tự đọc lại `camera.position`/`controls.target` hiện tại, nên ViewCube3D được phép
 * ghi thẳng vào `camera.position` giữa 2 lần update — cách an toàn chuẩn của OrbitControls khi
 * điều khiển camera từ bên ngoài. */
export interface Scene3DCameraApi {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  /** G-M18-04 — đưa camera về khung bao trọn TOÀN CẢNH hiện tại (tính lại bbox mỗi lần gọi, không
   * chỉ dùng số đo lúc mount). Không làm gì ở mode `walk`/`campath` (camera do 2 mode đó tự lái
   * mỗi khung, "toàn cảnh" vô nghĩa khi đang đứng trong phòng/bám đường quay). */
  fit: () => void;
}

/** Tính khung camera bao trọn `scene.bboxMm` — TÁCH RIÊNG khỏi effect mount để dùng lại được cho
 * cả lúc dựng cảnh LẪN nút "Toàn cảnh" (G-M18-04): trước đây `camera.position.set()` chỉ chạy
 * MỘT LẦN lúc mount, khối vẽ thêm sau không có đường nào đưa camera về lại — grep xác nhận
 * `fitToScene|zoomExtents|zoomToFit|fitCamera|Toàn cảnh|Vừa khung` trong `components/three/` +
 * `components/render-studio/` + `lib/three/` = 0 trước bản vá này (`GAP-IF.md` G-M18-04). Toán
 * giữ NGUYÊN VĂN công thức cũ (03/08, phán quyết PHU) — chỉ đổi chỗ ở, không đổi số. */
function fitCameraToScene(scene: Scene3DData, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  const { minX, minY, maxX, maxY } = scene.bboxMm;
  const cx = (minX + maxX) / 2 / 1000;
  const cy = (minY + maxY) / 2 / 1000;
  const halfDiag = Math.max(0.5, Math.hypot(maxX - minX, maxY - minY) / 2 / 1000);
  const cz = scene.sizeM.h / 2;
  camera.position.set(cx + halfDiag * 1.1, cz + halfDiag * 0.9, -cy + halfDiag * 1.1);
  controls.target.set(cx, cz, -cy);
  camera.updateProjectionMatrix();
  controls.update();
}

/**
 * VIỆC 3.c (05/08) — DẤU VỊ TRÍ ĐÈN kéo được trong khung nhìn. Chỉ là **quả cầu đánh dấu**, KHÔNG
 * phải nguồn sáng: khối vẫn `MeshBasicMaterial` không nhận ánh sáng (quyết định #3
 * `SPEC-3D-CORE.md` §6, giữ nguyên). Đây là cách duy nhất "kéo đèn bằng gizmo" có nghĩa khi cảnh
 * chưa hề có đèn thật.
 *
 * `posCadMm` là toạ độ **TUYỆT ĐỐI hệ CAD** (đã cộng cao độ tầng) — dùng thẳng `RigRoomLight.
 * posCadMm` của `lib/three/lighting.ts`, không tự quy đổi lần thứ hai.
 */
export interface LightMarker {
  id: string;
  posCadMm: { x: number; y: number; z: number };
  colorHex: string;
}

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
  /** VIỆC 3.c — dấu vị trí đèn (xem `LightMarker`). Bỏ trống = không vẽ dấu nào, hành vi y như
   * trước với cả 4 nơi tiêu thụ khác (chụp ảnh · campath · công trường · D5). */
  lightMarkers?: LightMarker[];
  /** Nhả chuột sau khi kéo dấu đèn — gọi MỘT lần với toạ độ **tuyệt đối hệ CAD (mm)**. Component
   * KHÔNG tự ghi vào Doc (luật một nguồn, cùng khuôn `onPushPull`); nơi gọi biết đèn có gắn tầng
   * hay không nên nó tự trừ cao độ tầng ra trước khi ghi `RoomLight.posMm`. */
  onLightMove?: (id: string, posCadMm: { x: number; y: number; z: number }) => void;
  className?: string;
  /** PHIẾU ĐỢT 7 NHÓM B — nơi ghi `{camera,controls}` sống cho ViewCube3D, xem comment
   * `Scene3DCameraApi` trên. Optional — nơi gọi không cần ViewCube (vd chụp ảnh) khỏi phải truyền. */
  cameraApiRef?: MutableRefObject<Scene3DCameraApi | null>;
}

const IMPLEMENTED_MODES: Scene3DMode[] = ['orbit', 'campath', 'section', 'walk', 'massing'];
const WALK_SPEED_M_PER_SEC = 1.5; // ~tốc độ đi bộ chậm, cùng cảm giác tempo với campath 1200mm/s

export default function Scene3DViewer({ scene, mode, camPath, sectionMm, onFrame, onPushPull, lightMarkers, onLightMove, ground = false, className, cameraApiRef }: Scene3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const campathActive = mode === 'campath' && !!camPath?.samples.length;
  const sectionActive = mode === 'section' && !!sectionMm;
  const walkActive = mode === 'walk';
  const massingActive = mode === 'massing';
  const onPushPullRef = useRef(onPushPull);
  onPushPullRef.current = onPushPull;
  // VIỆC 3.c — đèn đi qua REF, KHÔNG qua deps của effect chính. Nếu cho `lightMarkers` vào deps
  // thì mỗi lần kéo đèn 1px sẽ dựng lại TOÀN BỘ cảnh (hình học + camera + controls) — vừa giật
  // vừa reset góc nhìn. Effect chính đăng ký `syncMarkersRef`, effect nhỏ bên dưới gọi lại nó.
  const lightMarkersRef = useRef<LightMarker[]>(lightMarkers ?? []);
  lightMarkersRef.current = lightMarkers ?? [];
  const onLightMoveRef = useRef(onLightMove);
  onLightMoveRef.current = onLightMove;
  const syncMarkersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    syncMarkersRef.current?.();
  }, [lightMarkers]);

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
    // ✅ SỬA (03/08, phán quyết PHU — xác minh bằng số, xem BAO-CAO-PHU.md): đúng như nghi ngờ.
    // `bboxMm` là toạ độ CAD THÔ (chưa qua `cadAxesToThree`), trong khi hình học thật
    // (`ObjBuilder.vert()`, `cad-to-obj.ts`) đã trừ dấu `z_three = -y_cad`. Camera dùng `+cy`
    // (chưa đảo) ⇒ target/vị trí nằm ở phía ĐỐI DIỆN hình học thật qua trục z — khớp đúng triệu
    // chứng "camera áp sát + lệch tâm" khi bbox không đối xứng qua CAD-Y=0 (vd 1 tường lẻ). Đảo
    // `cy` → `-cy` ở 4 chỗ dưới (walk vị trí/lookAt, orbit vị trí, controls.target). KHÔNG đụng
    // campath/walk per-frame: `camPathSampleToThree()` (`lib/three/capture.ts`) và
    // `walkControls`/tick() tự lái camera mỗi khung qua `cadToThreeM()` riêng, không đọc cx/cy/cz
    // ở khối này — fix chỉ đổi khung camera BAN ĐẦU lúc mount (orbit/section/massing hết lệch tâm,
    // walk đứng đúng vị trí trong mặt bằng thay vì lệch phía đối diện).
    const cz = scene.sizeM.h / 2;

    if (walkActive) {
      // Đứng giữa mặt bằng, mắt cố định 1650mm (EYE_HEIGHT_MM, CÙNG số campath) — nhìn ngang.
      camera.position.set(cx, EYE_HEIGHT_MM / 1000, -cy);
      camera.lookAt(cx + 1, EYE_HEIGHT_MM / 1000, -cy);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(cx, cz, -cy);
    controls.enableDamping = true;
    controls.enabled = !walkActive && !campathActive; // walk/campath tự lái camera, orbit nhường

    // G-M18-04 — khung ban đầu bao trọn bbox (thay vì tự tính lại y hệt công thức ở đây): walk có
    // vị trí đứng-trong-phòng riêng ở trên (KHÔNG fit), mọi mode khác dùng đúng 1 hàm dùng lại
    // được cho cả nút "Toàn cảnh" bên dưới.
    if (!walkActive) fitCameraToScene(scene, camera, controls);
    controls.update();

    if (cameraApiRef) {
      cameraApiRef.current = {
        camera,
        controls,
        fit: () => {
          if (walkActive || campathActive) return; // 2 mode này tự lái camera mỗi khung, fit vô nghĩa
          fitCameraToScene(scene, camera, controls);
        },
      };
    }

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
    // Lọc bằng `isMassingWallGroup` (entityId VÀ heightMm), KHÔNG chỉ `!g.entityId` — từ khi
    // SPEC-TANG-DU-LIEU-CAU-KIEN §8 Đ1 gán entityId cho CẢ Furn_i/Window_i, lọc theo mỗi
    // entityId sẽ vô tình loại luôn nội thất/cửa sổ khỏi scene tĩnh (chúng không có heightMm nên
    // cũng không lọt vào `buildMassingWalls` bên dưới ⇒ biến mất khỏi màn hình).
    const staticScene = massingActive ? { ...scene, groups: scene.groups.filter((g) => !isMassingWallGroup(g)) } : scene;
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
      mesh.userData = { entityId: w.entityId, baseHeightMm: w.baseHeightMm, baseMm: w.baseMm };
      massingMeshes.push(mesh);
      group.add(mesh);
    }

    /* ── VIỆC 3.c — DẤU VỊ TRÍ ĐÈN (quả cầu + chân dọi xuống sàn) ────────────────────────────
       `depthTest:false` + `renderOrder` cao: dấu đèn phải THẤY ĐƯỢC kể cả khi nằm sau tường —
       đèn trần luôn bị chính trần/tường che, chôn nó vào khối thì không ai kéo được. Chân dọi
       xuống z=0 để đọc được vị trí trên mặt bằng (chỉ nhìn quả cầu lơ lửng thì không biết nó
       đứng đâu — bài học quen thuộc của gizmo 3D). */
    const markerGroup = new THREE.Group();
    three.add(markerGroup);
    const markerMeshes: THREE.Mesh[] = [];
    const markerJunk: { dispose(): void }[] = [];

    function clearMarkers() {
      for (const j of markerJunk) j.dispose();
      markerJunk.length = 0;
      markerMeshes.length = 0;
      markerGroup.clear();
    }

    function syncMarkers() {
      clearMarkers();
      for (const lm of lightMarkersRef.current) {
        const [x, y, z] = cadToThreeM(lm.posCadMm.x, lm.posCadMm.y, lm.posCadMm.z);

        const geo = new THREE.SphereGeometry(0.085, 16, 12);
        const mat = new THREE.MeshBasicMaterial({ color: lm.colorHex, depthTest: false, transparent: true, opacity: 0.95 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.renderOrder = 999;
        mesh.userData = { lightId: lm.id };
        markerGroup.add(mesh);
        markerMeshes.push(mesh);
        markerJunk.push(geo, mat);

        const stemGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, y, z)]);
        const stemMat = new THREE.LineBasicMaterial({ color: lm.colorHex, transparent: true, opacity: 0.35, depthTest: false });
        const stem = new THREE.Line(stemGeo, stemMat);
        stem.renderOrder = 998;
        markerGroup.add(stem);
        markerJunk.push(stemGeo, stemMat);
      }
    }
    syncMarkers();
    syncMarkersRef.current = syncMarkers;

    // Push-pull (3D-5) — kéo mặt TRÊN 1 tường = đổi cao độ. Tường luôn đùn từ đáy z(three.y)=0
    // (`docToObjScene` lăng trụ đứng z0=0) nên scale.y quanh gốc 0 co-giãn ĐÚNG chiều cao mới,
    // khỏi build lại geometry mỗi khung kéo (rẻ, mượt) — chỉ tính lại geometry thật khi Doc đổi
    // và `scene` prop mới truyền xuống (luật một nguồn, xem comment `onPushPull` ở trên).
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragPoint = new THREE.Vector3();
    let dragging: { mesh: THREE.Mesh; entityId: string; baseHeightMm: number; baseM: number } | null = null;
    let draggingLight: { mesh: THREE.Mesh; id: string; vertical: boolean } | null = null;

    function ndcFromEvent(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    function onPointerDown(e: PointerEvent) {
      if (!massingMeshes.length && !markerMeshes.length) return;
      ndcFromEvent(e);
      raycaster.setFromCamera(pointerNdc, camera);

      // Dấu đèn ĐƯỢC ƯU TIÊN trước tường: nó nhỏ và `depthTest:false` nên luôn nổi trên mặt
      // tường; bấm trúng nó mà lại đi kéo cao tường thì người dùng không hiểu chuyện gì xảy ra.
      const lightHit = markerMeshes.length ? raycaster.intersectObjects(markerMeshes, false)[0] : undefined;
      if (lightHit) {
        const mesh = lightHit.object as THREE.Mesh;
        const id = (mesh.userData as { lightId: string }).lightId;
        // Không Shift = trượt trên MẶT PHẲNG NGANG ở đúng cao độ đèn (đổi vị trí trên mặt bằng).
        // Giữ Shift = trượt trên MẶT PHẲNG ĐỨNG hướng về camera (đổi cao độ) — cùng quy ước
        // "Shift đổi trục" mà push-pull/SketchUp/Blender đều dùng.
        if (e.shiftKey) {
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          const n = new THREE.Vector3(camDir.x, 0, camDir.z);
          if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
          dragPlane.setFromNormalAndCoplanarPoint(n.normalize(), mesh.position);
        } else {
          dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), mesh.position);
        }
        draggingLight = { mesh, id, vertical: e.shiftKey };
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        return;
      }

      if (!massingMeshes.length) return;
      const hit = raycaster.intersectObjects(massingMeshes, false)[0];
      if (!hit || !hit.face) return;
      const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (worldNormal.y < 0.5) return; // chỉ mặt TRÊN (đỉnh tường) mới có nghĩa "cao tường"
      const mesh = hit.object as THREE.Mesh;
      const ud = mesh.userData as { entityId: string; baseHeightMm: number; baseMm?: number };
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const planeNormal = new THREE.Vector3(camDir.x, 0, camDir.z);
      if (planeNormal.lengthSq() < 1e-6) planeNormal.set(0, 0, 1);
      planeNormal.normalize();
      dragPlane.setFromNormalAndCoplanarPoint(planeNormal, hit.point);
      dragging = { mesh, entityId: ud.entityId, baseHeightMm: ud.baseHeightMm, baseM: (ud.baseMm ?? 0) / 1000 };
      controls.enabled = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (draggingLight) {
        ndcFromEvent(e);
        raycaster.setFromCamera(pointerNdc, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
        if (draggingLight.vertical) {
          // Chỉ đổi cao độ; kẹp ≥0 để đèn không chui xuống dưới sàn tầng.
          draggingLight.mesh.position.y = Math.max(0, dragPoint.y);
        } else {
          draggingLight.mesh.position.x = dragPoint.x;
          draggingLight.mesh.position.z = dragPoint.z;
        }
        return;
      }
      if (!dragging) return;
      ndcFromEvent(e);
      raycaster.setFromCamera(pointerNdc, camera);
      if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
      // 05/08 (S2 BUILD#1) — tường KHÔNG còn luôn đùn từ 0: `computeHeights()` đặt đáy theo tầng.
      // `dragPoint.y` là cao độ TUYỆT ĐỐI của con trỏ ⇒ chiều cao mới = trừ đi cốt đáy. Và scale.y
      // co-giãn quanh GỐC 0 nên phải bù `position.y` để điểm ở cốt đáy đứng yên — không bù thì kéo
      // tường tầng 2 sẽ tụt luôn cả tường xuống dưới sàn.
      const newHeightM = Math.max(2, Math.min(6, dragPoint.y - dragging.baseM));
      const s = newHeightM / (dragging.baseHeightMm / 1000);
      dragging.mesh.scale.y = s;
      dragging.mesh.position.y = dragging.baseM * (1 - s);
    }
    function onPointerUp(e: PointerEvent) {
      if (draggingLight) {
        const p = draggingLight.mesh.position;
        // three (m, Y-lên) → CAD (mm, Y-Bắc): nghịch đảo `cadAxesToThree` = (x, z, -y) — viết
        // ngay đây thay vì thêm hàm vào `lib/three/*` (vùng PHU). Đề nghị PHU xuất
        // `threeMToCadMm()` để chỗ này gọi chung, xem báo cáo phiên.
        onLightMoveRef.current?.(draggingLight.id, {
          x: Math.round(p.x * 1000),
          y: Math.round(-p.z * 1000),
          z: Math.round(p.y * 1000),
        });
        draggingLight = null;
        controls.enabled = !walkActive && !campathActive;
        if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
        return;
      }
      if (!dragging) return;
      const newHeightMm = clampWallHeight(Math.round((dragging.baseHeightMm * dragging.mesh.scale.y) / 10) * 10);
      onPushPullRef.current?.(dragging.entityId, newHeightMm);
      dragging = null;
      controls.enabled = !walkActive && !campathActive;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
    }
    // Gắn LUÔN LUÔN (không còn gate `massingActive`): dấu đèn có thể xuất hiện ở mọi mode, và cả
    // 3 handler đều tự thoát ngay khi không có tường-massing lẫn dấu đèn nào ⇒ 0 phí, 0 đổi hành
    // vi cho campath/walk/section (đã kiểm: `onPointerDown` return sớm nên không nuốt cú click
    // kích hoạt Pointer Lock của mode walk).
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);

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
      if (cameraApiRef) cameraApiRef.current = null;
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      syncMarkersRef.current = null;
      clearMarkers();
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
