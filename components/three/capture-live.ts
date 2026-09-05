'use client';

/**
 * components/three/capture-live.ts — CHỤP OFFSCREEN TẠI ĐÚNG POSE ĐANG NHÌN.
 *
 * ── VÌ SAO KHÔNG DÙNG THẲNG `lib/three/capture.ts` (LOOK INSIDE trước, B25) ────────────────────
 * `captureFrame()` (capture.ts:166) đã chụp offscreen rất tốt, NHƯNG nó đặt camera qua
 * `placeCamera(bbox, CameraSpec)` — tức khung SUY TỪ bounding box + preset, không phải góc người
 * dùng vừa orbit tới. Với việc "kết xuất khung nhìn 3D hiện tại" thì đó là ảnh KHÁC ⇒ sai đề.
 *
 * Đường thứ hai đã cân nhắc và loại: đọc thẳng canvas của `Scene3DViewer`. Không được —
 * `Scene3DViewer.tsx:221` tạo `WebGLRenderer({ antialias: true })` KHÔNG có `preserveDrawingBuffer`
 * ⇒ `toDataURL` trả khung trắng/không xác định. Bật cờ đó là đánh đổi hiệu năng cho MỌI nơi dùng
 * viewer (4 nơi tiêu thụ), chỉ để phục vụ một nút — không đáng, và `lib/three/**` ngoài vùng ghi
 * của lượt này.
 *
 * ⇒ File này dùng lại đúng hai linh kiện ĐÃ EXPORT (`buildMergedGeometries`, `nearFarForScene`) và
 *   nhận pose SỐNG từ `Scene3DCameraApi.camera`. Không có engine 3D thứ hai, không đụng viewer.
 *
 * ⚠️ Ảnh ra là KHỐI XÁM ĐÚNG NHƯ VIEWPORT: `MeshBasicMaterial` theo màu group — giống hệt
 *   `buildOffscreenScene` của capture.ts. Không đèn, không PBR. Đây là sự thật của cảnh, và cũng
 *   chính là thứ `ai.clay2render` cần để khoá hình học.
 */

import * as THREE from 'three';
import { buildMergedGeometries } from '@/lib/three/obj-scene-to-geometry';
import { nearFarForScene } from '@/lib/three/capture';
import type { Scene3DData } from '@/lib/three/cad-to-obj';
import type { KhungMayQuay } from '@/lib/capabilities/render';
import { chuanBiVatLieu, nguonVatLieuMacDinh, vatLieuChoNhomDongBo } from '@/lib/three/vat-lieu-nhom';

/** Nền cảnh chụp — CÙNG mã màu với `buildOffscreenScene` (capture.ts:91) để hai đường chụp không
 * ra hai tông nền khác nhau. */
const NEN = '#2a2d33';

export interface KetQuaChup {
  dataUrl: string;
  camera: KhungMayQuay;
}

/**
 * Chụp `scene` tại đúng vị trí/hướng/FOV của `camera` đang chạy trong viewport.
 * `rongPx` là bề rộng mong muốn; chiều cao suy từ `tyLe` (w/h) để tỉ lệ khung là thứ NGƯỜI chọn,
 * không phải thứ vô tình theo kích thước cửa sổ.
 */
/* 🔴 05/09 (V8c bước 3) — hàm này thành ASYNC. Lý do: vật liệu thật phải TẢI XONG texture trước
   khi dựng cảnh, và đây là NGƯỜI ĐỌC THỨ BA của cùng một `SceneGroup[]` (viewer · capture.ts ·
   tệp này). Sửa hai chỗ kia mà bỏ chỗ này thì "Chụp khung nhìn" — nút người dùng bấm nhiều nhất —
   vẫn ra ảnh phẳng. Nơi gọi duy nhất (`KetXuatPanel.tsx`) vốn đã ở trong `async` nên chỉ thêm
   `await`. */
export async function chupKhungNhinSong(
  scene: Scene3DData,
  camera: THREE.PerspectiveCamera,
  rongPx: number,
  tyLe: number,
): Promise<KetQuaChup> {
  const w = Math.max(64, Math.round(rongPx));
  const h = Math.max(64, Math.round(w / tyLe));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(w, h, false);

  // FOV DỌC giữ nguyên của camera sống; aspect đổi theo khung xuất ⇒ đổi tỉ lệ là mở/hẹp bề NGANG,
  // đúng cách máy ảnh thật đổi khổ phim mà không đổi ống kính.
  const cam = new THREE.PerspectiveCamera(camera.fov, w / h, 0.02, 500);
  cam.position.copy(camera.position);
  cam.quaternion.copy(camera.quaternion);
  const { near, far } = nearFarForScene(scene, cam.position);
  cam.near = near;
  cam.far = far;
  cam.updateProjectionMatrix();

  const three = new THREE.Scene();
  three.background = new THREE.Color(NEN);
  const built = buildMergedGeometries(scene);
  const nguon = nguonVatLieuMacDinh();
  await chuanBiVatLieu(built, nguon, 'khong-den');
  for (const b of built) {
    // Vật liệu DÙNG CHUNG (kho `vat-lieu-nhom`) ⇒ KHÔNG dispose ở dưới, chỉ dispose geometry.
    const vl = vatLieuChoNhomDongBo(b, nguon, 'khong-den');
    three.add(new THREE.Mesh(b.geometry, vl ?? new THREE.MeshBasicMaterial({ color: b.colorHex, side: THREE.DoubleSide })));
  }

  renderer.render(three, cam);
  const dataUrl = canvas.toDataURL('image/png');

  built.forEach((b) => b.geometry.dispose());
  renderer.dispose();

  // Điểm nhìn tới: 4m trước mặt theo hướng camera — đủ để tái lập khung, và là SỐ ĐO ĐƯỢC từ pose
  // thật (không phải preset bịa).
  const huong = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const nhin = camera.position.clone().add(huong.multiplyScalar(4));

  return {
    dataUrl,
    camera: {
      viTriM: [r3(camera.position.x), r3(camera.position.y), r3(camera.position.z)],
      nhinToiM: [r3(nhin.x), r3(nhin.y), r3(nhin.z)],
      fovDoc: r3(camera.fov),
      tyLe: r3(tyLe),
      rongPx: w,
      caoPx: h,
    },
  };
}

function r3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
