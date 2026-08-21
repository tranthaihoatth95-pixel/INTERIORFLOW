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
 * Mặc định xám trơn, KHÔNG PBR/đèn/bóng đổ. Riêng workspace Chiếu sáng có thể truyền một
 * `lightingPreview` tường minh để đổi sang preview ánh sáng thời gian thực; đây không phải render
 * cuối hoặc báo cáo trắc quang. Hình học đến từ `buildMergedGeometries` (gộp theo màu = gộp
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
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ensureBoundsTree, dropBoundsTree, installAcceleratedRaycast } from '@/lib/three/bvh';
import { findSnap3D, lockToAxis, DEFAULT_SNAP_TOLERANCE_PX, type Snap3DKind, type CadAxis } from '@/lib/three/snap3d';
import type { SnapSettings } from '@/lib/cad/store';
import { clampWallHeight, cadToThreeM, type Scene3DData } from '@/lib/three/cad-to-obj';
import {
  threeMToCadMm,
  hinhChuNhatMm,
  daGiacDeuMm,
  duLonDeGhi,
  WALL_THICKNESS_MM,
  DEFAULT_HEIGHT_MM,
  CYLINDER_SIDES,
  type CreateTool3D,
} from '@/lib/three/tao-khoi-3d';
import { camPathSampleToThree, sampleCamPathAt, EYE_HEIGHT_MM } from '@/lib/three/capture';
import { sectionPlane, type SectionSpec } from '@/lib/three/section';
import type { CamPathResult } from '@/lib/cad/campath';
import { fovFromLens } from '@/lib/three/camera';
import type { LightRig } from '@/lib/three/lighting';

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
   * mỗi khung, "toàn cảnh" vô nghĩa khi đang đứng trong phòng/bám đường quay).
   * GOTO-3D (19/08) — truyền `entityId` để khung camera CHỈ bao khối đó (đọc `scene.groups`,
   * dùng chung `positions` đã có sẵn — KHÔNG cần mesh riêng trong THREE scene, xem `frameBox`
   * dưới). Không tìm thấy (entity chưa vào cảnh / rỗng) ⇒ rơi về toàn cảnh, không bịa vị trí. */
  fit: (entityId?: string) => void;
}

/** Đưa camera+controls về khung bao trọn `box` — TÁCH khỏi `fitCameraToScene` để dùng lại được
 * cho GOTO-3D (19/08, khung theo MỘT entity thay vì cả group). Toán giữ NGUYÊN VĂN công thức cũ
 * (03/08, phán quyết PHU) — chỉ đổi chỗ ở, không đổi số. */
function frameBox(camera: THREE.PerspectiveCamera, controls: OrbitControls, box: THREE.Box3) {
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const halfDiag = Math.max(0.5, Math.hypot(size.x, size.y, size.z) / 2) * 1.15;
  camera.position.set(c.x + halfDiag * 1.1, c.y + halfDiag * 0.9, c.z + halfDiag * 1.1);
  controls.target.copy(c);
  camera.updateProjectionMatrix();
  controls.update();
}

/** Tính khung camera bao trọn `scene.bboxMm` — TÁCH RIÊNG khỏi effect mount để dùng lại được cho
 * cả lúc dựng cảnh LẪN nút "Toàn cảnh" (G-M18-04): trước đây `camera.position.set()` chỉ chạy
 * MỘT LẦN lúc mount, khối vẽ thêm sau không có đường nào đưa camera về lại — grep xác nhận
 * `fitToScene|zoomExtents|zoomToFit|fitCamera|Toàn cảnh|Vừa khung` trong `components/three/` +
 * `components/render-studio/` + `lib/three/` = 0 trước bản vá này (`GAP-IF.md` G-M18-04). Toán
 * giữ NGUYÊN VĂN công thức cũ (03/08, phán quyết PHU) — chỉ đổi chỗ ở, không đổi số. */
function fitCameraToScene(scene: Scene3DData, camera: THREE.PerspectiveCamera, controls: OrbitControls, object?: THREE.Object3D | null) {
  // p14 (Hoà báo 08/08 "fit chạy rồi mà camera vẫn dí sát"): nguồn khung cũ là `scene.bboxMm` —
  // bbox của ENTITY 2D. Hai lỗ đo được: ① gọi lúc CHƯA dựng mesh (trước là dòng trên cùng của
  // effect, mesh dựng sau) — với bboxMm thì không sao nhưng là sai thời điểm chờ sẵn; ② hình học
  // THẬT vượt ra ngoài bboxMm: bản nhân lưới (2 bậc arrayLinear, p14) chỉ tồn tại sau
  // `resolveGroupGeometry` ở tầng three — bboxMm không hề biết ⇒ lưới 3×2 nằm ngoài khung.
  // Sửa: đo `Box3.setFromObject(group)` — khung bao của ĐÚNG những mesh đang vẽ (kể cả ops/scale).
  // Giữ đường bboxMm làm fallback khi group rỗng (cảnh trống — vẫn cần đứng đúng chỗ 8×8m).
  const box = object ? new THREE.Box3().setFromObject(object) : null;
  if (box && !box.isEmpty()) {
    frameBox(camera, controls, box);
    return;
  }
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
  /** Camera Intent đã lưu trên polyline; mặc định giữ hành vi cũ 1650mm/35mm. */
  cameraHeightMm?: number;
  lensMm?: number;
  /** Preview ánh sáng của workspace Chiếu sáng. Bỏ trống giữ khung khối xám mặc định. */
  lightingPreview?: LightRig | null;
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
  /** LANE D (20/08) — khối đang chọn (entityId, cùng nguồn `useTree3DUi` qua Object3DTree/
   * Object3DInspector). Chỉ tường (massing mesh có entityId) tô được — furniture/cửa sổ đi
   * qua đường gộp-theo-màu `buildMergedGeometries`, không có mesh 1-1 để tô (giới hạn đã ghi
   * ở Object3DInspector, KHÔNG bịa). Đưa vào deps effect chính — đổi chọn là 1 click rời rạc,
   * không phải kéo liên tục như `lightMarkers`, nên KHÔNG cần đường ref né rebuild. */
  selectedId?: string | null;
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
  /** T4 (P14) — BẮT ĐIỂM 3D khi rê chuột (mode massing): truyền ĐÚNG SnapSettings của
   * `useCadStore` (K1 — không đẻ settings thứ hai) + bước lưới mm. Bỏ trống = không bắt điểm,
   * hành vi y như trước với campath/chụp ảnh/công trường. Đọc qua REF (như lightMarkers) —
   * đổi công tắc snap không dựng lại cảnh. */
  snap3d?: { settings: SnapSettings; gridStepMm: number } | null;
  /** 21/08 — BẤM-VÀO-KHỐI ĐỂ CHỌN (viewport-first): pointerdown trúng mesh massing (mặt bất kỳ)
   * gọi hàm này với `entityId` của mesh. Component KHÔNG tự ghi store chọn (một nguồn — nơi gọi
   * map entityId→group rồi ghi `useTree3DUi`); bỏ trống = hành vi cũ (chỉ push-pull mặt trên). */
  onPickEntity?: (entityId: string) => void;
  /** 21/08 — DỰNG KHỐI BẰNG CỬ CHỈ. `null` = hành vi cũ y nguyên (chọn/kéo-đẩy). Khác `null` thì
   * mọi cú bấm trong khung nhìn thuộc về cử chỉ dựng: chọn/kéo-đẩy/orbit tạm nhường đường, vì
   * một cú bấm không thể vừa là "chọn khối" vừa là "đặt điểm đầu". Đọc qua REF (như `snap3d`) —
   * đổi công cụ KHÔNG dựng lại cảnh. */
  createTool?: CreateTool3D | null;
  /** Chốt cử chỉ dựng — gọi ĐÚNG MỘT LẦN với toạ độ CAD (mm). Component KHÔNG tự ghi Doc (cùng
   * luật một-nguồn với `onPushPull`): nơi gọi sinh entity rồi `useCadStore.addEntities`. */
  onCreateSolid?: (payload: CreateSolidPayload) => void;
  /** Esc / cử chỉ bị huỷ — nơi gọi tắt đèn nút công cụ. Không gọi khi chốt thành công. */
  onCreateCancel?: () => void;
}

/** Kết quả một cử chỉ dựng, hệ CAD (mm). Union phân biệt theo `tool`: tường mang TIM + bề dày
 * (nơi gọi tự dựng đường bao qua `wallSegmentOutline` sẵn có), hộp/trụ mang thẳng đa giác đáy. */
export type CreateSolidPayload =
  | { tool: 'wall'; aMm: { x: number; y: number }; bMm: { x: number; y: number }; thicknessMm: number; heightMm: number }
  | { tool: 'box' | 'cylinder'; pointsMm: { x: number; y: number }[]; heightMm: number };

const IMPLEMENTED_MODES: Scene3DMode[] = ['orbit', 'campath', 'section', 'walk', 'massing'];
const WALK_SPEED_M_PER_SEC = 1.5; // ~tốc độ đi bộ chậm, cùng cảm giác tempo với campath 1200mm/s

export default function Scene3DViewer({ scene, mode, camPath, cameraHeightMm = EYE_HEIGHT_MM, lensMm = 35, lightingPreview = null, sectionMm, onFrame, onPushPull, lightMarkers, onLightMove, ground = false, className, cameraApiRef, snap3d, selectedId = null, onPickEntity, createTool = null, onCreateSolid, onCreateCancel }: Scene3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // 21/08 — cử chỉ dựng đi qua REF (cùng lý do `snap3dRef`): đổi công cụ là chuyện của thanh nút,
  // không phải chuyện của hình học — cho vào deps effect chính sẽ dựng lại cả cảnh + reset camera.
  const createToolRef = useRef<CreateTool3D | null>(createTool);
  createToolRef.current = createTool;
  const onCreateSolidRef = useRef(onCreateSolid);
  onCreateSolidRef.current = onCreateSolid;
  const onCreateCancelRef = useRef(onCreateCancel);
  onCreateCancelRef.current = onCreateCancel;
  // Bỏ công cụ giữa chừng thì cử chỉ đang dở phải chết theo (không để lại mesh xem trước lơ lửng).
  const huyVeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!createTool) huyVeRef.current?.();
  }, [createTool]);
  // T4 — snap qua REF (cùng lý do lightMarkersRef): đổi công tắc không dựng lại cảnh.
  const snap3dRef = useRef(snap3d ?? null);
  snap3dRef.current = snap3d ?? null;
  const campathActive = mode === 'campath' && !!camPath?.samples.length;
  const sectionActive = mode === 'section' && !!sectionMm;
  const walkActive = mode === 'walk';
  const massingActive = mode === 'massing';
  const onPushPullRef = useRef(onPushPull);
  onPushPullRef.current = onPushPull;
  // 21/08 — pick qua REF (cùng lý do onPushPullRef): đổi handler không dựng lại cảnh.
  const onPickEntityRef = useRef(onPickEntity);
  onPickEntityRef.current = onPickEntity;
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
    // Viewport chiếm gần toàn màn hình. DPR 2 trên Retina biến mỗi khung thành ~4 lần số pixel
    // CSS, trong khi đây là màn dựng hình thao tác (không phải ảnh xuất). Giữ nét đủ đọc cạnh
    // ở 1.5x, còn ảnh/video xuất dùng pipeline riêng với độ phân giải thật.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    if (lightingPreview) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
    }
    // Mặt cắt (mode section, 3D-4) — bật sẵn cờ này (0 phí khi clippingPlanes rỗng), chỉ nạp
    // plane thật khi có sectionMm hợp lệ.
    renderer.localClippingEnabled = true;
    renderer.clippingPlanes = sectionActive && sectionMm ? [sectionPlane(sectionMm)] : [];
    container.appendChild(renderer.domElement);

    const three = new THREE.Scene();
    three.background = new THREE.Color('#2a2d33');

    if (lightingPreview) {
      const ambient = new THREE.HemisphereLight('#dce8ff', '#19120d', Math.max(0.15, lightingPreview.sky.intensity * 0.35));
      three.add(ambient);
      if (!lightingPreview.sun.belowHorizon) {
        const [x, y, z] = lightingPreview.sun.directionThree;
        const sun = new THREE.DirectionalLight(lightingPreview.sun.colorHex, lightingPreview.sun.intensity * 2.2);
        sun.position.set(x * 40, y * 40, z * 40);
        sun.castShadow = true;
        three.add(sun);
        three.add(sun.target);
      }
      for (const light of lightingPreview.rooms) {
        const [x, y, z] = light.posThreeM;
        const point = new THREE.PointLight(light.colorHex, Math.min(12, Math.max(0.2, light.candelaIsotropic / 18)), 14, 2);
        point.position.set(x, y, z);
        point.castShadow = true;
        three.add(point);
      }
    }

    // SÂN KHẤU (ground) — VIỆC 7 (P14): lưới ĐỔI MẬT ĐỘ THEO TẦM NHÌN kiểu SketchUp thay
    // GridHelper(200,200) cố định — xa: ô 1m · gần: 100mm · rất gần: 10mm. 3 lưới dựng sẵn,
    // tick() chỉ bật/tắt visible theo khoảng cách camera→target (rẻ, không dựng lại). 2 lưới mịn
    // BÁM controls.target (làm tròn về mắt ô của chính nó để vạch không "trôi" khi pan) — không
    // bám thì làm việc xa gốc toạ độ là mất lưới mịn. Sương xa giữ nguyên vai trò chân trời.
    const gridJunk: { dispose(): void }[] = [];
    let gridCoarse: THREE.GridHelper | null = null;
    let gridMid: THREE.GridHelper | null = null;
    let gridFine: THREE.GridHelper | null = null;
    if (ground) {
      const mkGrid = (sizeM: number, divisions: number, opacity: number) => {
        const g = new THREE.GridHelper(sizeM, divisions, 0x5a6472, 0x3a4048);
        const m = g.material as THREE.Material & { transparent: boolean; opacity: number; depthWrite: boolean };
        m.transparent = true;
        m.opacity = opacity;
        m.depthWrite = false; // lưới nằm dưới khối, không "ăn" vào mặt khối khi nhìn xiên
        three.add(g);
        gridJunk.push(g.geometry, m);
        return g;
      };
      gridCoarse = mkGrid(200, 200, 0.55); // ô 1 m — tầm nhìn xa (giữ đúng lưới cũ)
      gridMid = mkGrid(20, 200, 0.35); // ô 100 mm — tầm gần
      gridFine = mkGrid(2, 200, 0.3); // ô 10 mm — rất gần
      gridMid.visible = false;
      gridFine.visible = false;
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

    // G-M18-04 — khung ban đầu bao trọn CẢNH. p14: fit dời XUỐNG SAU khi dựng mesh (xem chỗ gọi
    // `fitCameraToScene(scene, camera, controls, group)` bên dưới) — đo Box3 từ mesh thật cần
    // mesh tồn tại trước; gọi ở đây là sai thời điểm (đúng nghi vấn Hoà 08/08).
    controls.update();

    if (cameraApiRef) {
      cameraApiRef.current = {
        camera,
        controls,
        fit: (entityId) => {
          if (walkActive || campathActive) return; // 2 mode này tự lái camera mỗi khung, fit vô nghĩa
          // GOTO-3D (19/08): khung theo MỘT entity — đọc `positions` thẳng từ `scene.groups`
          // (dữ liệu nguồn của `docToObjScene()`, cùng mảng dùng để dựng mesh), KHÔNG cần tìm
          // mesh riêng trong THREE scene (`buildMergedGeometries` gộp mesh theo MÀU, không theo
          // entity — không có mesh 1-1 với entityId trừ mode `massing`). Rỗng/không thấy ⇒ rơi
          // xuống nhánh toàn cảnh bên dưới, không bịa vị trí.
          if (entityId) {
            const g = scene.groups.find((sg) => sg.entityId === entityId && sg.positions.length > 0);
            if (g) {
              const box = new THREE.Box3().setFromArray(g.positions);
              if (!box.isEmpty()) {
                frameBox(camera, controls, box);
                return;
              }
            }
          }
          fitCameraToScene(scene, camera, controls, fitTargetRef.group);
        },
      };
    }
    // hộp trỏ tới group mesh (dựng bên dưới) cho closure fit ở trên — tránh dùng-trước-khai-báo.
    const fitTargetRef: { group: THREE.Group | null } = { group: null };

    // Mode walk (3D-4) — PointerLockControls chuẩn three (KHÔNG tự viết vector nhìn/di chuyển).
    // Cần cú click (kích hoạt Pointer Lock API) — hint phủ toàn khung, ẩn khi đã lock.
    const walkControls = new PointerLockControls(camera, renderer.domElement);
    const moveState = { forward: false, back: false, left: false, right: false };
    let hintEl: HTMLDivElement | null = null;
    function onKeyDown(e: KeyboardEvent) {
      // Né ô nhập (luật keydown-ne-o-nhap): gõ chữ w/a/s/d trong input không được di chuyển camera.
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && (ae.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName))) return;
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
    /* p14 (Hoà báo 08/08 "khối nhìn không đọc được hình"): MeshBasicMaterial phẳng lì làm mọi mặt
       cùng màu dính thành một mảng. Thêm VIỀN CẠNH — EdgesGeometry(30°, bỏ chéo fan cùng mặt) +
       LineSegments tối, gắn làm CON của từng mesh (scale.y lúc kéo push-pull tự co theo). KHÔNG
       đèn, KHÔNG bóng đổ — quyết định #3 SPEC-3D-CORE §6 giữ nguyên, chỉ thêm nét đọc khối. */
    const edgeJunk: { dispose(): void }[] = [];
    const addEdges = (mesh: THREE.Mesh) => {
      // soup không chỉ mục ⇒ EdgesGeometry coi mỗi tam giác là đảo riêng, vẽ CẢ chéo fan (đã
      // thấy lúc verify) — hàn đỉnh (mergeVertices, dung sai 0.1mm) trước rồi mới rút cạnh 30°.
      // (Hoà 08/08: ngưỡng 15° — mặt phẳng sạch trơn, góc tường/cạnh trên vẫn rõ. Chéo lộ ra
      // KHÔNG phải do WireframeGeometry — là EdgesGeometry chạy trên soup CHƯA hàn đỉnh: mỗi tam
      // giác một đảo nên mọi cạnh đều là biên. mergeVertices là thuốc đúng, ngưỡng chỉ là phụ.)
      const welded = mergeVertices((mesh.geometry as THREE.BufferGeometry).clone(), 1e-4);
      const eg = new THREE.EdgesGeometry(welded, 15);
      welded.dispose();
      const em = new THREE.LineBasicMaterial({ color: 0x26221c, transparent: true, opacity: 0.55 });
      const lines = new THREE.LineSegments(eg, em);
      lines.renderOrder = 1;
      mesh.add(lines);
      edgeJunk.push(eg, em);
    };
    for (const b of built) {
      const material = lightingPreview
        ? new THREE.MeshStandardMaterial({ color: b.colorHex, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide })
        : new THREE.MeshBasicMaterial({ color: b.colorHex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(b.geometry, material);
      addEdges(mesh);
      group.add(mesh);
    }
    three.add(group);

    const massingWalls = massingActive ? buildMassingWalls(scene) : [];
    const massingMeshes: THREE.Mesh[] = [];
    for (const w of massingWalls) {
      const isSelected = !!selectedId && w.entityId === selectedId;
      const material = lightingPreview
        ? new THREE.MeshStandardMaterial({ color: w.colorHex, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide, emissive: isSelected ? 0x6a57f5 : 0x000000, emissiveIntensity: isSelected ? 0.28 : 0 })
        : new THREE.MeshBasicMaterial({ color: w.colorHex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(w.geometry, material);
      mesh.userData = { entityId: w.entityId, baseHeightMm: w.baseHeightMm, baseMm: w.baseMm };
      addEdges(mesh);
      massingMeshes.push(mesh);
      group.add(mesh);
      if (isSelected) {
        // ⭐ SELECTION FEEDBACK THẬT — thứ truth-map 20/08 gắn cờ "3D PASS trừ selection feedback".
        // Gốc bệnh: `Viewport3D` gizmo trước đây LUÔN vẽ ở CHÍNH GIỮA khung nhìn bất kể khối
        // đang chọn nằm đâu (SVG `left:50%,top:50%` cố định) — Hoà đúng, đó không phải phản hồi
        // chọn thật. Sửa TẠI NGUỒN: viền hộp bao khối THẬT trong không gian (Box3Helper, màu
        // accent `#6a57f5`, khớp `--accent` app), theo camera/orbit như mọi vật khác — không
        // phải overlay 2D cố định. `renderOrder` cao để không bị mesh khác đè (không depth test
        // tắt hẳn — vẫn muốn nó ẩn đúng khi bị khối khác che, giống Blender/SketchUp).
        const box = new THREE.Box3().setFromObject(mesh);
        const helper = new THREE.Box3Helper(box, new THREE.Color(0x6a57f5));
        (helper.material as THREE.LineBasicMaterial).transparent = true;
        (helper.material as THREE.LineBasicMaterial).opacity = 0.9;
        helper.renderOrder = 998;
        group.add(helper);
        edgeJunk.push(helper.geometry, helper.material as THREE.Material);
      }
    }

    // p14 — fit SAU khi mesh tồn tại, đo Box3 từ chính group (xem docstring fitCameraToScene).
    fitTargetRef.group = group;
    if (!walkActive) fitCameraToScene(scene, camera, controls, group);

    /* ── T1 (P14) — BVH cho mọi mesh bắn tia được (NC-12 §3.1). ensureBoundsTree idempotent;
       dispose ở cleanup PHẢI dropBoundsTree trước geometry.dispose() (cây giữ mảng riêng).
       Chỉ dựng ở mode massing (nơi duy nhất bắn tia mỗi pointermove hôm nay) — campath/chụp
       ảnh không bắn tia, dựng cây là phí. Số đo cảnh IF thật: tổng ≤3,2ms — xem M-3D-NOI-OUT. */
    const snapTargets: THREE.Mesh[] = [];
    if (massingActive) {
      for (const mesh of [...massingMeshes, ...(group.children.filter((c) => c instanceof THREE.Mesh) as THREE.Mesh[])]) {
        if (!snapTargets.includes(mesh)) {
          ensureBoundsTree(mesh.geometry as THREE.BufferGeometry);
          snapTargets.push(mesh);
        }
      }
    }

    /* ── T4 (P14) — BẮT ĐIỂM 3D: dấu (vòng nhỏ) + CHỮ tiếng Việt (HTML, luật ② NC-12 §3.3),
       ⇧ khoá loại đang bắt, X/Y/Z khoá trục khi đang kéo (luật ③). Dung sai px = nửa token
       --tap đọc từ CSS thật, rơi về 22px nếu không đọc được (luật ①). */
    installAcceleratedRaycast();
    const tapToken = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tap'));
    const snapTolerancePx = Number.isFinite(tapToken) && tapToken > 0 ? tapToken / 2 : DEFAULT_SNAP_TOLERANCE_PX;
    const snapMarkerGeo = new THREE.SphereGeometry(0.03, 12, 8);
    const snapMarkerMat = new THREE.MeshBasicMaterial({ color: '#6a57f5', depthTest: false, transparent: true, opacity: 0.95 });
    const snapMarker = new THREE.Mesh(snapMarkerGeo, snapMarkerMat);
    snapMarker.renderOrder = 1000;
    snapMarker.visible = false;
    three.add(snapMarker);
    let snapLabelEl: HTMLDivElement | null = null;
    if (massingActive) {
      snapLabelEl = document.createElement('div');
      snapLabelEl.style.cssText =
        'position:absolute;pointer-events:none;z-index:6;padding:2px 7px;border-radius:6px;font-size:11px;line-height:1.5;' +
        'background:rgba(20,18,26,.92);color:#efece6;border:1px solid rgba(255,255,255,.16);display:none;white-space:nowrap;';
      container.appendChild(snapLabelEl);
    }
    let hoverSnapKind: Snap3DKind | null = null; // loại đang bắt — ⇧ khoá đúng loại này
    let snapLockKind: Snap3DKind | null = null; // ≠null khi đang giữ ⇧
    let axisLockKey: CadAxis | null = null; // X/Y/Z khi đang kéo
    const axisGuideGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const axisGuideMat = new THREE.LineBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true, opacity: 0.9 });
    const axisGuide = new THREE.Line(axisGuideGeo, axisGuideMat);
    axisGuide.renderOrder = 1000;
    axisGuide.visible = false;
    three.add(axisGuide);

    function hideSnapUi() {
      snapMarker.visible = false;
      if (snapLabelEl) snapLabelEl.style.display = 'none';
      hoverSnapKind = null;
    }
    function onSnapKeyDown(e: KeyboardEvent) {
      // Né ô nhập (luật keydown-ne-o-nhap): gõ x/y/z trong input không được khoá trục.
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && (ae.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName))) return;
      if (e.key === 'Shift' && hoverSnapKind) snapLockKind = hoverSnapKind; // ⇧ khoá suy luận ĐANG bắt
      const k = e.key.toLowerCase();
      if ((k === 'x' || k === 'y' || k === 'z') && (dragging || draggingLight)) {
        axisLockKey = axisLockKey === k ? null : (k as CadAxis); // bấm lại = nhả khoá, chuẩn SketchUp
      }
    }
    function onSnapKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') snapLockKind = null;
    }
    if (massingActive) {
      window.addEventListener('keydown', onSnapKeyDown);
      window.addEventListener('keyup', onSnapKeyUp);
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

    let needsRender = true;
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
      needsRender = true;
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
    let draggingLight: { mesh: THREE.Mesh; id: string; vertical: boolean; startPos?: THREE.Vector3 } | null = null;

    function ndcFromEvent(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /* ── CỬ CHỈ DỰNG KHỐI trên mặt sàn (21/08) ─────────────────────────────────────────────
       Mảnh còn thiếu mà `lib/render-studio/tool3d.ts` đã nêu đích danh trong docstring của nó:
       hình học có đủ từ trước, chỉ thiếu đường "unproject con trỏ → mặt sàn" vì camera sống nằm
       trong file này. Nay có: bấm-giữ-thả trên sàn, XEM TRƯỚC vẽ bằng mesh tạm (KHÔNG ghi Doc),
       thả chuột mới trả toạ độ CAD mm ra ngoài cho nơi gọi ghi. Esc huỷ.                      */
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const groundHit = new THREE.Vector3();
    let veDang: { tuMm: { x: number; y: number }; toiMm: { x: number; y: number } } | null = null;
    let xemTruoc: THREE.Line | null = null;

    /** Con trỏ → điểm trên mặt sàn y=0, đổi sang hệ CAD (mm). null khi tia song song mặt sàn. */
    function diemSanMm(e: PointerEvent): { x: number; y: number } | null {
      ndcFromEvent(e);
      raycaster.setFromCamera(pointerNdc, camera);
      if (!raycaster.ray.intersectPlane(groundPlane, groundHit)) return null;
      const c = threeMToCadMm({ x: groundHit.x, y: groundHit.y, z: groundHit.z });
      return { x: c.x, y: c.y };
    }

    function xoaXemTruoc() {
      if (!xemTruoc) return;
      three.remove(xemTruoc);
      xemTruoc.geometry.dispose();
      (xemTruoc.material as THREE.Material).dispose();
      xemTruoc = null;
    }

    /** Vẽ lại đường bao xem trước theo đúng loại cử chỉ đang cầm. Dùng CHUNG hàm sinh đa giác với
     *  đường ghi thật (`tao-khoi-3d.ts`) — xem trước và kết quả không thể lệch nhau. */
    function veXemTruoc(kind: CreateTool3D, aMm: { x: number; y: number }, bMm: { x: number; y: number }) {
      xoaXemTruoc();
      const diem: { x: number; y: number }[] =
        kind === 'wall'
          ? [aMm, bMm]
          : kind === 'box'
            ? hinhChuNhatMm(aMm, bMm)
            : daGiacDeuMm(aMm, Math.hypot(bMm.x - aMm.x, bMm.y - aMm.y));
      const khep = kind === 'wall' ? diem : [...diem, diem[0]];
      // CAD mm → three m: nghịch đảo threeMToCadMm (z_three = -y_cad/1000). Nhích 5mm khỏi sàn
      // để đường không bị z-fighting với lưới sàn.
      const v = khep.map((p) => new THREE.Vector3(p.x / 1000, 0.005, -p.y / 1000));
      const g = new THREE.BufferGeometry().setFromPoints(v);
      xemTruoc = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x6a57f5, depthTest: false }));
      xemTruoc.renderOrder = 999;
      three.add(xemTruoc);
      needsRender = true;
    }

    function huyVe() {
      if (!veDang) return;
      veDang = null;
      xoaXemTruoc();
      controls.enabled = !walkActive && !campathActive;
      onCreateCancelRef.current?.();
      needsRender = true;
    }

    // Bỏ công cụ giữa chừng (nút dock tắt, hoặc Esc ở tầng trên) → cử chỉ đang dở chết theo.
    huyVeRef.current = huyVe;

    // Esc huỷ cử chỉ ngay trong khung nhìn. Né ô nhập theo đúng luật keydown-ne-o-nhap đã dùng ở
    // handler phím của mode walk bên trên — gõ Esc trong ô số không được huỷ hình đang vẽ.
    function onEscVe(ev: KeyboardEvent) {
      if (ev.key !== 'Escape' || !veDang) return;
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && (ae.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName))) return;
      ev.preventDefault();
      huyVe();
    }
    window.addEventListener('keydown', onEscVe, true);

    function onPointerDown(e: PointerEvent) {
      // Đang cầm công cụ dựng ⇒ cú bấm này thuộc về cử chỉ dựng, KHÔNG phải chọn/kéo-đẩy: một cú
      // bấm không thể vừa đặt điểm đầu vừa chọn khối. Orbit nhường đường tới lúc thả.
      const kind = createToolRef.current;
      if (kind) {
        const p = diemSanMm(e);
        if (!p) return;
        veDang = { tuMm: p, toiMm: p };
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        return;
      }
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
        draggingLight = { mesh, id, vertical: e.shiftKey, startPos: mesh.position.clone() };
        needsRender = true;
        hideSnapUi();
        controls.enabled = false;
        renderer.domElement.setPointerCapture(e.pointerId);
        return;
      }

      if (!massingMeshes.length) return;
      const hit = raycaster.intersectObjects(massingMeshes, false)[0];
      if (!hit || !hit.face) return;
      const worldNormal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      // 21/08 — BẤM TRÚNG KHỐI = CHỌN KHỐI (mặt nào cũng chọn), viewport-first: trước đây chọn
      // CHỈ đi qua cây Navigator, bấm thẳng vào khối trên khung nhìn không làm gì (đo thật) —
      // sai kỳ vọng của mọi app 3D. Chọn ngay ở pointerdown; mặt KHÔNG-phải-đỉnh thì return như
      // cũ (orbit vẫn xoay bình thường, không capture) — chỉ thêm tín hiệu chọn, không đổi camera.
      onPickEntityRef.current?.((hit.object as THREE.Mesh).userData.entityId as string);
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
      needsRender = true;
      controls.enabled = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      // Cử chỉ dựng đang chạy: cập nhật xem trước theo con trỏ, không đụng gì khác.
      if (veDang) {
        const p = diemSanMm(e);
        if (!p) return;
        veDang.toiMm = p;
        const kind = createToolRef.current;
        if (kind) veXemTruoc(kind, veDang.tuMm, p);
        return;
      }
      if (draggingLight) {
        ndcFromEvent(e);
        raycaster.setFromCamera(pointerNdc, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, dragPoint)) return;
        if (draggingLight.vertical) {
          // Chỉ đổi cao độ; kẹp ≥0 để đèn không chui xuống dưới sàn tầng.
          draggingLight.mesh.position.y = Math.max(0, dragPoint.y);
        } else if (axisLockKey && draggingLight.startPos) {
          // luật ③ — X/Y/Z khoá trục khi kéo: chiếu điểm kéo lên trục CAD qua vị trí bắt đầu,
          // vẽ đường dẫn đúng màu trục (X đỏ · Y lục · Z lam).
          const locked = lockToAxis(draggingLight.startPos, dragPoint, axisLockKey);
          draggingLight.mesh.position.copy(locked.point);
          // đường dẫn chạy DỌC TRỤC qua điểm neo (trục CAD → three: X=(1,0,0) · Y=(0,0,−1) · Z=(0,1,0))
          const dir = axisLockKey === 'x' ? new THREE.Vector3(1, 0, 0) : axisLockKey === 'y' ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
          axisGuideMat.color.set(locked.color);
          axisGuideGeo.setFromPoints([
            new THREE.Vector3().copy(draggingLight.startPos).addScaledVector(dir, -50),
            new THREE.Vector3().copy(draggingLight.startPos).addScaledVector(dir, 50),
          ]);
          axisGuide.visible = true;
        } else {
          draggingLight.mesh.position.x = dragPoint.x;
          draggingLight.mesh.position.z = dragPoint.z;
          axisGuide.visible = false;
        }
        needsRender = true;
        return;
      }
      // T4 — BẮT ĐIỂM khi RÊ (không kéo gì): dấu + chữ tiếng Việt, ⇧ khoá loại đang bắt.
      if (!dragging && massingActive && snapTargets.length && snap3dRef.current) {
        ndcFromEvent(e);
        raycaster.setFromCamera(pointerNdc, camera);
        const rect = renderer.domElement.getBoundingClientRect();
        const res = findSnap3D({
          raycaster,
          camera,
          pointerPx: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          viewportPx: { w: rect.width, h: rect.height },
          meshes: snapTargets,
          snap: snap3dRef.current.settings,
          tolerancePx: snapTolerancePx,
          gridStepM: snap3dRef.current.gridStepMm / 1000,
          lockKind: snapLockKind,
        });
        if (res) {
          hoverSnapKind = res.kind;
          snapMarker.position.copy(res.point);
          snapMarker.visible = true;
          if (snapLabelEl) {
            snapLabelEl.textContent = snapLockKind ? `${res.label} — đang khoá ⇧` : res.label;
            snapLabelEl.style.left = `${e.clientX - rect.left + 14}px`;
            snapLabelEl.style.top = `${e.clientY - rect.top + 14}px`;
            snapLabelEl.style.display = 'block';
          }
        } else {
          hideSnapUi();
        }
        needsRender = true;
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
      needsRender = true;
    }
    function onPointerUp(e: PointerEvent) {
      // Chốt cử chỉ dựng: đủ lớn thì trả toạ độ CAD ra ngoài (nơi gọi ghi Doc), nhỏ quá thì coi
      // như bấm lỡ tay và huỷ — thà không tạo gì còn hơn đẻ khối 0 chiều không xoá được bằng mắt.
      if (veDang) {
        const kind = createToolRef.current;
        const { tuMm, toiMm } = veDang;
        veDang = null;
        xoaXemTruoc();
        controls.enabled = !walkActive && !campathActive;
        if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
        const dx = toiMm.x - tuMm.x;
        const dy = toiMm.y - tuMm.y;
        if (kind === 'wall') {
          if (duLonDeGhi(Math.hypot(dx, dy))) {
            onCreateSolidRef.current?.({ tool: 'wall', aMm: tuMm, bMm: toiMm, thicknessMm: WALL_THICKNESS_MM, heightMm: DEFAULT_HEIGHT_MM });
          } else onCreateCancelRef.current?.();
        } else if (kind === 'box') {
          if (duLonDeGhi(dx, dy)) {
            onCreateSolidRef.current?.({ tool: 'box', pointsMm: hinhChuNhatMm(tuMm, toiMm), heightMm: DEFAULT_HEIGHT_MM });
          } else onCreateCancelRef.current?.();
        } else if (kind === 'cylinder') {
          const r = Math.hypot(dx, dy);
          if (duLonDeGhi(r)) {
            onCreateSolidRef.current?.({ tool: 'cylinder', pointsMm: daGiacDeuMm(tuMm, r), heightMm: DEFAULT_HEIGHT_MM });
          } else onCreateCancelRef.current?.();
        }
        needsRender = true;
        return;
      }
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
        axisLockKey = null;
        axisGuide.visible = false;
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
      if (campathActive) {
        const hFov = (fovFromLens(lensMm) * Math.PI) / 180;
        camera.fov = (2 * Math.atan(Math.tan(hFov / 2) / camera.aspect) * 180) / Math.PI;
      }
      camera.updateProjectionMatrix();
      needsRender = true;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Chỉ có video path/walk cần vẽ liên tục. Ở mode dựng khối, vòng lặp trước đây render canvas
    // 60fps kể cả khi người dùng không làm gì; cộng thêm ViewCube tạo hai WebGL loop song song và
    // là nguồn giật chính trên laptop Retina. OrbitControls phát `change` cho pan/zoom/xoay, nên
    // đánh dấu bẩn rồi chỉ render một khung khi có thay đổi thật.
    const requestRender = () => { needsRender = true; };
    controls.addEventListener('change', requestRender);
    const timer = new THREE.Timer();
    let raf = 0;
    function tick() {
      timer.update();
      const t = timer.getElapsed();
      const dt = timer.getDelta();
      const dynamicFrame = (campathActive && !!camPath) || (walkActive && walkControls.isLocked);
      if (campathActive && camPath) {
        // Phát lặp (loop) đường cam — video 2-b xem trước ở đây, xuất file thật qua
        // captureSequence() (capture.ts, CÙNG camPathSampleToThree nên khung xem = khung xuất).
        const loopT = camPath.totalDurationSec > 0 ? t % camPath.totalDurationSec : 0;
        const pose = camPathSampleToThree(sampleCamPathAt(camPath, loopT), cameraHeightMm);
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
        if (controls.update()) needsRender = true;
      }
      // VIỆC 7 (P14) — lưới đổi mật độ theo tầm nhìn: xa ô 1m · gần thêm ô 100mm · rất gần thêm
      // ô 10mm (chuẩn SketchUp — mắt ước lượng kích thước không cần đo). 2 lưới mịn bám target,
      // làm tròn về mắt ô của CHÍNH NÓ để vạch đứng yên khi pan (không "trôi lưới").
      if (gridCoarse && (needsRender || dynamicFrame)) {
        const d = camera.position.distanceTo(controls.target);
        if (gridMid) {
          gridMid.visible = d < 8;
          gridMid.position.set(Math.round(controls.target.x / 0.1) * 0.1, 0.001, Math.round(controls.target.z / 0.1) * 0.1);
        }
        if (gridFine) {
          gridFine.visible = d < 2;
          gridFine.position.set(Math.round(controls.target.x / 0.01) * 0.01, 0.002, Math.round(controls.target.z / 0.01) * 0.01);
        }
        gridCoarse.visible = d >= 2; // rất gần thì tắt lưới thô cho đỡ rối vạch chồng vạch
      }
      if (needsRender || dynamicFrame) {
        renderer.render(three, camera);
        needsRender = false;
      }
      if (dynamicFrame) onFrame?.(t);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      if (cameraApiRef) cameraApiRef.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      walkControls.dispose();
      if (hintEl) {
        hintEl.removeEventListener('click', onHintClick);
        container.removeChild(hintEl);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onEscVe, true);
      huyVeRef.current = null;
      xoaXemTruoc();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      syncMarkersRef.current = null;
      clearMarkers();
      // T1/T4 (P14) — gỡ cây BVH TRƯỚC khi dispose geometry (cây giữ mảng riêng), gỡ UI snap.
      if (massingActive) {
        window.removeEventListener('keydown', onSnapKeyDown);
        window.removeEventListener('keyup', onSnapKeyUp);
      }
      for (const m of snapTargets) dropBoundsTree(m.geometry as THREE.BufferGeometry);
      if (snapLabelEl) container.removeChild(snapLabelEl);
      snapMarkerGeo.dispose();
      snapMarkerMat.dispose();
      axisGuideGeo.dispose();
      axisGuideMat.dispose();
      for (const j of gridJunk) j.dispose();
      for (const j of edgeJunk) j.dispose();
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
  }, [scene, mode, camPath, cameraHeightMm, lensMm, lightingPreview, sectionMm, ground, selectedId]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative' }} />;
}
