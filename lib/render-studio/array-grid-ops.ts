/**
 * lib/render-studio/array-grid-ops.ts — MỘT nguồn ghi bậc Array (lưới hàng×cột) vào `ops[]`,
 * dùng chung cho CẢ 2 cửa nhập (p14): panel Sửa (`Command3DPanel.ArrayGridSection`) và dòng nhập
 * nhanh kiểu SketchUp ở góc khung nhìn (`Viewport3D` — Hoà chốt 08/08 ③). Hai cửa MỘT logic —
 * không chép công thức 2 lần (tránh 2 ổ ghi lệch nhau, cùng lý do G3).
 *
 * Persist bằng 2 bậc `arrayLinear` CÓ SẴN (không kiểu BuildOp mới — `lib/cad/model.ts` ngoài vùng
 * p14); engine ăn ở `lib/three/build-ops.ts` `applyArrayOps` (2 bậc đơn trục → `arrayGrid`).
 * Ghi qua `useCadStore.updateEntities` ⇒ vào lịch sử ⇒ Ctrl+Z lùi được (KS4).
 */
import type { BuildOp } from '../cad/model';
import { useCadStore } from '../cad/store';
import { modKey } from '@/lib/kbd'; // nhãn phím theo hệ: Mac ⌘ · Windows Ctrl

export interface ArrayGridParams {
  cols: number;
  rows: number;
  dxMm: number;
  dyMm: number;
}

/** Ghi/gỡ lưới Array lên entity — `grid=null` là gỡ. Trả false khi không tìm thấy entity. */
export function applyArrayGrid(entityId: string, grid: ArrayGridParams | null): boolean {
  const store = useCadStore.getState();
  const entity = store.doc.entities.find((e) => e.id === entityId);
  if (!entity) return false;
  const rest = (entity.ops ?? []).filter((op) => op.op !== 'arrayLinear');
  const next: BuildOp[] = [...rest];
  if (grid) {
    if (grid.cols > 1 && grid.dxMm !== 0) next.push({ op: 'arrayLinear', n: Math.round(grid.cols), dx: grid.dxMm, dy: 0, dz: 0 });
    if (grid.rows > 1 && grid.dyMm !== 0) next.push({ op: 'arrayLinear', n: Math.round(grid.rows), dx: 0, dy: grid.dyMm, dz: 0 });
  }
  store.updateEntities([{ ...entity, ops: next.length ? next : undefined }]);
  store.setStatus(
    grid
      ? `Array ${Math.round(grid.cols)}×${Math.round(grid.rows)} — ${modKey('Z')} để lùi`
      : `Đã gỡ Array — ${modKey('Z')} để lùi`,
  );
  return true;
}

/**
 * Cú pháp dòng nhập nhanh (③): `array 3x2` · `array 3x2 1200` · `array 3x2 1200,900` ·
 * viết tắt `a 3x2 @1200,900`. Thiếu khoảng cách → mặc định 1200/900mm. Trả null khi không
 * phải lệnh array hợp lệ (nơi gọi tự báo lỗi tại chỗ).
 */
export function parseArrayCommand(raw: string): ArrayGridParams | null {
  const m = /^(?:array|arr|a)\s+(\d+)\s*[x×]\s*(\d+)(?:\s+@?(\d+(?:[.,]\d+)?)(?:\s*[,;\s]\s*(\d+(?:[.,]\d+)?))?)?$/i.exec(raw.trim());
  if (!m) return null;
  const cols = Math.round(Number(m[1]));
  const rows = Math.round(Number(m[2]));
  if (!(cols >= 1) || !(rows >= 1) || cols * rows <= 1) return null;
  const dx = m[3] ? Number(m[3].replace(',', '.')) : 1200;
  const dy = m[4] ? Number(m[4].replace(',', '.')) : 900;
  if (!(dx > 0) || !(dy > 0)) return null;
  return { cols, rows, dxMm: dx, dyMm: dy };
}
