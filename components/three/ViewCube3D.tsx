'use client';

/**
 * components/three/ViewCube3D.tsx — PHIẾU ĐỢT 7 NHÓM B (2026-08-03): ViewCube THẬT thay bản SVG
 * 2D tĩnh cũ (3 polygon toạ độ chết, chỉ đổi CHỮ nhãn — không xoay theo camera, không kéo được,
 * đúng như Hoà chỉ ra khi soi màn `Viewport3D.tsx:92-107`).
 *
 * KIẾN TRÚC: renderer THỨ HAI riêng (96×96px, góc trên phải) — KHÔNG dùng chung renderer +
 * setScissor với `Scene3DViewer` (ticket cho phép cả 2 cách, chọn renderer riêng vì
 * `Scene3DViewer` đóng gói camera/controls hoàn toàn trong 1 effect riêng, không có chỗ móc vào
 * để chia sẻ context WebGL an toàn mà không đảo lộn file đó). Cầu nối DUY NHẤT giữa 2 renderer là
 * `cameraApiRef` (`Scene3DCameraApi`, xem `Scene3DViewer.tsx`) — camera cube ĐỌC quaternion camera
 * chính mỗi khung (xoay đồng bộ khi orbit), và khi người dùng thao tác TRÊN CUBE thì ViewCube3D
 * GHI THẲNG vào `camera.position` của camera chính (kéo = orbit tức thời quanh `controls.target`,
 * bấm 1 trong 26 vùng = bay tới bằng slerp hướng ~350ms) — `OrbitControls.update()` (đã chạy mỗi
 * khung trong `Scene3DViewer`) tự đọc lại `camera.position`/`target` nên ghi từ bên ngoài là cách
 * AN TOÀN chuẩn của thư viện, không cần tắt `controls.enabled`.
 *
 * KHỐI 26 VÙNG (6 mặt · 12 cạnh · 8 góc) dựng kiểu "Rubik's cube": duyệt sign ∈{-1,0,1}³ trừ
 * (0,0,0), phân loại theo SỐ trục khác 0 (1=mặt, 2=cạnh, 3=góc). Mỗi ô là 1 BoxGeometry riêng,
 * kích thước/vị trí suy từ `LOW` (điểm gãy 0.72) sao cho các ô khớp khít không chồng/hở — xem
 * `rangeFor()`. Chỉ 6 ô MẶT có nhãn tiếng Việt (texture canvas dán vào ĐÚNG mặt hướng ra ngoài
 * qua `materials[]` theo thứ tự group mặc định của BoxGeometry: +X,-X,+Y,-Y,+Z,-Z).
 *
 * QUY ƯỚC TRỤC (khớp `cadAxesToThree`/`Scene3DViewer` — three.js Y = cao độ CAD Z, three.js
 * X=CAD X, three.js Z=-CAD Y): TRÊN=+Y · DƯỚI=-Y · TRƯỚC=+Z · SAU=-Z · PHẢI=+X · TRÁI=-X.
 *
 * Màu CỐ ĐỊNH (không theo theme) — CÙNG lý do đã ghi ở `ve3d-css.ts` cho `.vpover`: nền cảnh 3D
 * luôn tối (`Scene3DViewer.tsx` set `#2a2d33` cứng), overlay theo theme sẽ sai tương phản ở 1 trong
 * 2 theme. accent hex CHÉP TỪ `app/globals.css:19` (`--accent`), không tách biến CSS vào three.js.
 */
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { Scene3DCameraApi } from './Scene3DViewer';

export type ViewDir = 'tren' | 'duoi' | 'truoc' | 'sau' | 'trai' | 'phai';

const VIEW_LABEL_VI: Record<ViewDir, string> = {
  tren: 'TRÊN', duoi: 'DƯỚI', truoc: 'TRƯỚC', sau: 'SAU', trai: 'TRÁI', phai: 'PHẢI',
};

const ACCENT_HEX = 0x6a57f5; // app/globals.css:19 --accent — 1 accent xuyên hệ, không đổi theo theme
const FLY_MS = 350;

type Sign = -1 | 0 | 1;
interface Cell {
  sx: Sign; sy: Sign; sz: Sign;
  kind: 'face' | 'edge' | 'corner';
  dir?: ViewDir;
}

const SIGNS: Sign[] = [-1, 0, 1];
const LOW = 0.72; // điểm gãy: |trục|<LOW = vùng giữa (mặt/thân ô), |trục|>=LOW = dải sát vỏ ngoài

function rangeFor(sign: Sign): [center: number, size: number] {
  if (sign === 0) return [0, 2 * LOW];
  return [(sign * (1 + LOW)) / 2, 1 - LOW];
}

function faceDirFor(sx: Sign, sy: Sign, sz: Sign): ViewDir | undefined {
  if (sy === 1) return 'tren';
  if (sy === -1) return 'duoi';
  if (sz === 1) return 'truoc';
  if (sz === -1) return 'sau';
  if (sx === 1) return 'phai';
  if (sx === -1) return 'trai';
  return undefined;
}

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  for (const sx of SIGNS) {
    for (const sy of SIGNS) {
      for (const sz of SIGNS) {
        if (sx === 0 && sy === 0 && sz === 0) continue;
        const nonZero = [sx, sy, sz].filter((v) => v !== 0).length;
        const kind: Cell['kind'] = nonZero === 1 ? 'face' : nonZero === 2 ? 'edge' : 'corner';
        cells.push({ sx, sy, sz, kind, dir: kind === 'face' ? faceDirFor(sx, sy, sz) : undefined });
      }
    }
  }
  return cells;
}

/** Hướng camera bay tới cho 1 ô — trục thô từ sign, NÉ suy biến `lookAt` song song trục up
 * (0,1,0) cho đúng 2 ô TRÊN/DƯỚI thuần (nghiêng 0.0001 theo Z, không lệch mắt thấy được). */
function cellDirection(sx: Sign, sy: Sign, sz: Sign): THREE.Vector3 {
  const v = new THREE.Vector3(sx, sy, sz);
  if (sx === 0 && sz === 0 && sy !== 0) v.z = sy * 0.0001;
  return v.normalize();
}

function labelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(106,87,245,0.30)';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(232,232,238,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 126);
  ctx.fillStyle = '#e8e8ee';
  ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 66);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** thứ tự group mặc định BoxGeometry (không group riêng) khi gán mảng 6 material: +X,-X,+Y,-Y,+Z,-Z. */
function materialIndexFor(sx: Sign, sy: Sign, sz: Sign): number {
  if (sx === 1) return 0;
  if (sx === -1) return 1;
  if (sy === 1) return 2;
  if (sy === -1) return 3;
  if (sz === 1) return 4;
  return 5; // sz === -1
}

function slerpUnitVec(v0: THREE.Vector3, v1: THREE.Vector3, t: number, out: THREE.Vector3): THREE.Vector3 {
  const dot = THREE.MathUtils.clamp(v0.dot(v1), -1, 1);
  const omega = Math.acos(dot);
  if (omega < 1e-5) return out.copy(v1);
  const sinOmega = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinOmega;
  const s1 = Math.sin(t * omega) / sinOmega;
  return out.set(v0.x * s0 + v1.x * s1, v0.y * s0 + v1.y * s1, v0.z * s0 + v1.z * s1);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export interface ViewCube3DProps {
  cameraApiRef: MutableRefObject<Scene3DCameraApi | null>;
  /** chỉ bắn cho 6 ô MẶT (cạnh/góc bay camera tới nhưng không có nhãn ViewDir tương ứng). */
  onPick?: (dir: ViewDir) => void;
  size?: number;
  className?: string;
}

export default function ViewCube3D({ cameraApiRef, onPick, size = 96, className }: ViewCube3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene(); // background null — trong suốt, đè lên viewport chính
    const CAM_HALF = 1.7;
    const cubeCamera = new THREE.OrthographicCamera(-CAM_HALF, CAM_HALF, CAM_HALF, -CAM_HALF, 0.1, 10);

    const cells = buildCells();
    const meshes: THREE.Mesh[] = [];
    const group = new THREE.Group();
    for (const cell of cells) {
      const [cx, sxSize] = rangeFor(cell.sx);
      const [cy, sySize] = rangeFor(cell.sy);
      const [cz, szSize] = rangeFor(cell.sz);
      const geom = new THREE.BoxGeometry(sxSize, sySize, szSize);
      const plain = new THREE.MeshBasicMaterial({ color: ACCENT_HEX, transparent: true, opacity: 0.22 });
      let material: THREE.Material | THREE.Material[] = plain;
      if (cell.kind === 'face' && cell.dir) {
        const materials: THREE.Material[] = [plain, plain, plain, plain, plain, plain].map((m) => m.clone());
        materials[materialIndexFor(cell.sx, cell.sy, cell.sz)] = new THREE.MeshBasicMaterial({
          map: labelTexture(VIEW_LABEL_VI[cell.dir]),
          transparent: true,
        });
        material = materials;
      }
      const mesh = new THREE.Mesh(geom, material);
      mesh.position.set(cx, cy, cz);
      mesh.userData.cell = cell;
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({ color: ACCENT_HEX, transparent: true, opacity: 0.4 }),
      );
      mesh.add(edges);
      meshes.push(mesh);
      group.add(mesh);
    }
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    function ndcFromEvent(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }
    function pickMesh(): THREE.Mesh | null {
      raycaster.setFromCamera(ndc, cubeCamera);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      return (hit?.object as THREE.Mesh) ?? null;
    }

    // ── Bay tới (bấm 1 ô) — slerp hướng camera quanh `controls.target`, giữ nguyên bán kính
    // (không đổi zoom), ~350ms, easeInOutCubic (SPEC-APPLE-MOTION-MATERIAL preset "smooth"). ──
    let flying: { from: THREE.Vector3; to: THREE.Vector3; target: THREE.Vector3; radius: number; startMs: number } | null = null;
    function startFlyTo(cell: Cell) {
      const api = cameraApiRef.current;
      if (!api) return;
      const target = api.controls.target.clone();
      const offset = api.camera.position.clone().sub(target);
      const radius = offset.length() || 1;
      const from = offset.clone().normalize();
      const to = cellDirection(cell.sx, cell.sy, cell.sz);
      flying = { from, to, target, radius, startMs: performance.now() };
      if (cell.kind === 'face' && cell.dir) onPickRef.current?.(cell.dir);
    }
    const flyOffset = new THREE.Vector3();
    function tickFly() {
      if (!flying) return;
      const api = cameraApiRef.current;
      if (!api) { flying = null; return; }
      const t = Math.min(1, (performance.now() - flying.startMs) / FLY_MS);
      slerpUnitVec(flying.from, flying.to, easeInOutCubic(t), flyOffset);
      api.camera.position.copy(flying.target).addScaledVector(flyOffset, flying.radius);
      api.camera.lookAt(flying.target);
      if (t >= 1) flying = null;
    }

    // ── Kéo trên cube = orbit camera chính (giống SketchUp) — spherical quanh controls.target,
    // gia số theo pixel giữa 2 lần pointermove liên tiếp (khớp cách OrbitControls tự tính nội bộ,
    // dùng chiều cao khối 96px làm mốc — khối nhỏ nên kéo ngắn vẫn xoay rõ, đúng cảm giác SU). ──
    const ROTATE_SPEED = Math.PI * 1.4;
    function orbitBy(dxPx: number, dyPx: number) {
      const api = cameraApiRef.current;
      if (!api) return;
      const target = api.controls.target;
      const offset = api.camera.position.clone().sub(target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta -= (dxPx / size) * ROTATE_SPEED;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - (dyPx / size) * ROTATE_SPEED, 0.001, Math.PI - 0.001);
      offset.setFromSpherical(spherical);
      api.camera.position.copy(target).add(offset);
      api.camera.lookAt(target);
    }

    let hovered: THREE.Mesh | null = null;
    function setHover(mesh: THREE.Mesh | null) {
      if (hovered === mesh) return;
      if (hovered) hovered.scale.setScalar(1);
      hovered = mesh;
      if (hovered) hovered.scale.setScalar(1.08);
      renderer.domElement.style.cursor = mesh ? 'pointer' : 'grab';
    }

    const drag = { active: false, id: -1, lastX: 0, lastY: 0, moved: false };
    function onPointerDown(e: PointerEvent) {
      flying = null; // người dùng thao tác tay ⇒ huỷ animation bay-tới đang chạy, tránh giằng co
      drag.active = true;
      drag.id = e.pointerId;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.moved = false;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (drag.active && drag.id === e.pointerId) {
        const dx = e.clientX - drag.lastX;
        const dy = e.clientY - drag.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
        if (drag.moved) orbitBy(dx, dy);
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        return;
      }
      ndcFromEvent(e);
      setHover(pickMesh());
    }
    function onPointerUp(e: PointerEvent) {
      if (!drag.active || drag.id !== e.pointerId) return;
      drag.active = false;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
      if (!drag.moved) {
        ndcFromEvent(e);
        const mesh = pickMesh();
        if (mesh) startFlyTo(mesh.userData.cell as Cell);
      }
    }
    function onPointerLeave() {
      setHover(null);
    }
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    let raf = 0;
    function tick() {
      const api = cameraApiRef.current;
      if (api) {
        // ── xoay đồng bộ: copy quaternion camera chính mỗi khung (yêu cầu NHÓM B #1) ──
        cubeCamera.quaternion.copy(api.camera.quaternion);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cubeCamera.quaternion);
        cubeCamera.position.copy(forward).multiplyScalar(-5);
        cubeCamera.updateMatrixWorld();
      }
      tickFly();
      renderer.render(scene, cubeCamera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m instanceof THREE.MeshBasicMaterial && m.map) m.map.dispose();
          m.dispose();
        }
        const edges = mesh.children[0] as THREE.LineSegments | undefined;
        if (edges) {
          edges.geometry.dispose();
          (edges.material as THREE.Material).dispose();
        }
      }
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // onPick đọc qua onPickRef (xem trên) — cố ý KHÔNG vào deps, đổi identity mỗi render (hay gặp
    // với inline arrow ở nơi gọi) không được phép dựng lại cả renderer/scene/listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraApiRef, size]);

  return <div ref={containerRef} className={className} aria-label="Hướng nhìn (ViewCube)" role="group" />;
}
