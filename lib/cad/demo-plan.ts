/**
 * lib/cad/demo-plan.ts — MẶT BẰNG MẪU (demo) cho chặng 1 "Layout CAD", mức SƠ PHÁC DD.
 *
 * Căn hộ 1PN+bếp+wc ~9.0×6.6m: tường bao + vách ngăn, cửa đi, cửa sổ, nội thất, nhãn phòng +
 * diện tích, lưới trục, khung tên, mũi tên Bắc, thước tỉ lệ. Mục đích: bấm 1 nút là có ngay
 * 1 bản vẽ đầy đủ để hiểu tool — KHÔNG phải hồ sơ thi công (kích thước/khoảng hở cửa xấp xỉ).
 */

import type { Doc, Entity } from './model';
import { emptyDoc, docBox } from './model';
import { newId } from './store';
import { wallChain, roomRect as _roomRect, dimensionChain, addPresentationKit } from './commands';

void _roomRect; // (không dùng ở demo này — tường của demo là vách CHUNG giữa các phòng, tự dựng tay bên dưới)

const EXT = 200; // bề dày tường bao (mm)
const PART = 100; // bề dày vách ngăn (mm)

export function buildDemoPlan(): Doc {
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const furn = doc.layers.find((l) => l.name === 'Nội thất')!.id;
  const dim = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  const text = doc.layers.find((l) => l.name === 'Ghi chú')!.id;

  const W = 9000;
  const H = 6600;
  const push = (es: Entity[]) => doc.entities.push(...es);

  /* ── tường bao (khép vòng) + 2 vách ngăn ── */
  push(wallChain([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], EXT, wall, true));
  push(wallChain([{ x: 5200, y: 0 }, { x: 5200, y: H }], PART, wall)); // vách dọc: Khách | Ngủ+Bếp+WC
  push(wallChain([{ x: 5200, y: 3400 }, { x: W, y: 3400 }], PART, wall)); // vách ngang: Ngủ (trên) | Bếp+WC (dưới)
  push(wallChain([{ x: 7600, y: 0 }, { x: 7600, y: 3400 }], PART, wall)); // vách dọc: Bếp | WC

  /* ── cửa đi (block 'door' có sẵn — quy tắc rot: tường ngang mở +y→rot 0, -y→rot π;
     tường dọc mở +x→rot -π/2, -x→rot +π/2, xem lib/cad/commands.ts) ── */
  const door = (at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: 'door', at, rot, sx: 1, sy: 1 }]);
  door({ x: 1600, y: 0 }, 0); // cửa chính, mở vào Khách
  door({ x: 5200, y: 1700 }, -Math.PI / 2); // cửa Bếp
  door({ x: 7600, y: 1700 }, -Math.PI / 2); // cửa WC
  door({ x: 5200, y: 5000 }, -Math.PI / 2); // cửa Ngủ

  /* ── cửa sổ (block 'window') ── */
  const win = (at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: 'window', at, rot, sx: 1, sy: 1 }]);
  win({ x: 0, y: 3300 }, Math.PI / 2); // Khách, tường Tây
  win({ x: 3500, y: 0 }, 0); // Khách, tường Nam
  win({ x: 7100, y: H }, 0); // Ngủ, tường Bắc
  win({ x: W, y: 5000 }, Math.PI / 2); // Ngủ, tường Đông
  win({ x: 6400, y: 0 }, 0); // Bếp, tường Nam
  win({ x: W, y: 1700 }, Math.PI / 2); // WC, tường Đông

  /* ── nội thất ── */
  const block = (id: string, at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: furn, block: id, at, rot, sx: 1, sy: 1 }]);
  block('sofa3', { x: 550, y: 2000 }, Math.PI / 2);
  block('armchair', { x: 550, y: 3300 }, Math.PI / 2);
  block('dining6', { x: 3000, y: 4500 }, 0);
  block('bedD', { x: 7100, y: 5500 }, 0);
  block('wardrobe', { x: 8600, y: 4500 }, Math.PI / 2);
  block('kitchenI', { x: 5550, y: 1700 }, Math.PI / 2);
  block('bathtub', { x: 8525, y: 2450 }, Math.PI / 2);
  block('toilet', { x: 7900, y: 410 }, Math.PI);
  block('lavabo', { x: 7900, y: 1200 }, 0);

  /* ── nhãn phòng + diện tích + cao độ N.P.T ── */
  const label = (at: { x: number; y: number }, s: string, h = 200) => push([{ id: newId('e'), type: 'text', layer: text, at, text: s, h }]);
  label({ x: 2200, y: 5900 }, 'PHÒNG KHÁCH + ĂN', 220);
  label({ x: 2200, y: 5650 }, `${((5200 * H) / 1e6).toFixed(1)} m²`, 160);
  label({ x: 6300, y: 6250 }, 'PHÒNG NGỦ', 220);
  label({ x: 6300, y: 6000 }, `${(((W - 5200) * (H - 3400)) / 1e6).toFixed(1)} m²`, 160);
  label({ x: 5450, y: 3150 }, 'BẾP', 200);
  label({ x: 5450, y: 2900 }, `${((2400 * 3400) / 1e6).toFixed(1)} m²`, 150);
  label({ x: 7750, y: 3150 }, 'WC', 200);
  label({ x: 7750, y: 2900 }, `${((1400 * 3400) / 1e6).toFixed(1)} m²`, 150);
  label({ x: 1200, y: 250 }, 'N.P.T ±0.000', 150);

  /* ── kích thước ngoài (chuỗi theo cạnh Nam + cạnh Tây; dấu off = phía ngoài nhà — xem
     drawDimension trong render.ts: pháp tuyến (-dy,dx)/len, off dương lệch theo pháp tuyến đó) ── */
  push(dimensionChain([{ x: 0, y: 0 }, { x: 5200, y: 0 }, { x: 7600, y: 0 }, { x: W, y: 0 }], -500, dim));
  push(dimensionChain([{ x: 0, y: 0 }, { x: 0, y: 3400 }, { x: 0, y: H }], 500, dim));

  /* ── bộ trình bày: lưới trục + khung tên + mũi tên Bắc + thước tỉ lệ ── */
  const box = docBox(doc)!;
  push(
    addPresentationKit(doc, box, {
      project: 'CĂN HỘ MẪU — DEMO',
      drawing: 'MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD',
      scale: '1:100',
      author: 'InteriorFlow',
    }),
  );

  return doc;
}
