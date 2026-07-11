/**
 * lib/cad/demo-plan.ts — MẶT BẰNG MẪU (demo) cho chặng 1 "Layout CAD", mức SƠ PHÁC DD.
 *
 * Căn hộ 1PN ~9.0×7.2m, ĐÃ RÀ LẠI CÔNG NĂNG (bản trước có lỗi: WC chỉ vào được QUA bếp — sai
 * hoàn toàn). Logic công năng (như KTS rà bản vẽ):
 *   - Lối vào → Phòng khách + ăn (mặt tiền Nam, khối lớn nhất, view ra 2 mặt Tây/Nam).
 *   - Bếp: cột dịch vụ bên phải, SÁT lối vào (gần cửa chính hơn WC/ngủ) — vào từ khách, KHÔNG
 *     là lối đi xuyên qua để tới WC/ngủ (bếp là phòng CỤT, chỉ 1 cửa).
 *   - Hành lang phụ (corridor) nối Khách ↔ WC ↔ Ngủ — WC có cửa mở vào HÀNH LANG (không mở
 *     thẳng vào bếp/bàn ăn), Ngủ cũng vào từ hành lang này (không xuyên bếp, không xuyên WC).
 *   - Ngủ: khối sâu nhất (xa cửa chính nhất) → yên tĩnh nhất, đúng nguyên tắc phân khu.
 *
 * Kích thước thật (không còn xấp xỉ tuỳ tiện):
 *   - Tường bao 210mm, tường ngăn 100mm (đúng khung 200-220 / 100-110 KTS yêu cầu).
 *   - Cửa chính 900, cửa phòng 800, cửa WC 700 (block doorRoom/doorWC mới, xem furniture.ts).
 *   - Ngủ master: 3445×3545mm thông thuỷ ≈ 12.2 m², cạnh ngắn 3445mm ≥ 3m.
 *   - WC: 2245×1600mm thông thuỷ ≈ 3.6 m² (trong khung 3-4m²).
 *   - Bếp: 3445×1540mm thông thuỷ, bếp chữ I dài 3000 sát tường Nam, lối đi 940mm trước bếp.
 *   - Giường đôi cách tường Đông ~795mm, tủ áo dọc tường Tây (đủ 600mm lối đi cạnh giường).
 *
 * Vẫn KHÔNG phải hồ sơ thi công (CD) — mục đích: bấm 1 nút có ngay 1 bản vẽ đúng công năng để
 * hiểu tool, không phải bản vẽ nộp hồ sơ xin phép.
 */

import type { Doc, Entity } from './model';
import { emptyDoc, docBox } from './model';
import { newId } from './store';
import { wallChain, roomRect as _roomRect, dimensionChain, addPresentationKit, elevationMarker } from './commands';

void _roomRect; // (không dùng — tường của demo là vách CHUNG giữa các phòng, tự dựng tay bên dưới)

const EXT = 210; // bề dày tường bao (mm) — trong khung 200-220 KTS yêu cầu
const PART = 100; // bề dày vách ngăn (mm)

export function buildDemoPlan(): Doc {
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const furn = doc.layers.find((l) => l.name === 'Nội thất')!.id;
  const dim = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  const text = doc.layers.find((l) => l.name === 'Ghi chú')!.id;

  const W = 9000;
  const H = 7200;
  const XP = 5400; // vách dọc chính: Khách (trái) | cột dịch vụ Bếp/Hành lang/WC/Ngủ (phải)
  const Y1 = 1800; // vách ngang: Bếp (dưới) | Hành lang+WC (giữa)
  const Y2 = 3500; // vách ngang: Hành lang+WC (giữa) | Ngủ (trên, khối sâu nhất)
  const XW = 6600; // vách dọc PHỤ (chỉ trong dải Y1-Y2): Hành lang (trái) | WC (phải)
  const push = (es: Entity[]) => doc.entities.push(...es);

  /* ── tường bao (khép vòng) + vách ngăn ── */
  push(wallChain([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], EXT, wall, true));
  push(wallChain([{ x: XP, y: 0 }, { x: XP, y: H }], PART, wall)); // vách dọc chính, suốt chiều sâu
  push(wallChain([{ x: XP, y: Y1 }, { x: W, y: Y1 }], PART, wall)); // Bếp | Hành lang+WC
  push(wallChain([{ x: XP, y: Y2 }, { x: W, y: Y2 }], PART, wall)); // Hành lang+WC | Ngủ
  push(wallChain([{ x: XW, y: Y1 }, { x: XW, y: Y2 }], PART, wall)); // Hành lang | WC (chỉ trong dải giữa)

  /* ── cửa đi (quy tắc rot: tường ngang mở +y→rot 0, -y→rot π; tường dọc mở +x→rot -π/2,
     -x→rot +π/2 — xem lib/cad/furniture.ts). Cửa chính 900mm; cửa phòng 800mm (doorRoom);
     cửa WC 700mm (doorWC) — đúng phân cấp KTS yêu cầu. ── */
  const door = (blockId: string, at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: blockId, at, rot, sx: 1, sy: 1 }]);
  door('door', { x: 1500, y: 0 }, 0); // cửa chính 900 — mở vào Khách
  door('doorRoom', { x: XP, y: 1300 }, -Math.PI / 2); // cửa Bếp 800 — CHỈ vào từ Khách (bếp là phòng cụt); y cao để cung mở không đụng bếp chữ I dọc tường Nam
  door('doorRoom', { x: XP, y: 2200 }, -Math.PI / 2); // Khách → Hành lang 800
  door('doorWC', { x: XW, y: 2200 }, -Math.PI / 2); // Hành lang → WC 700 (KHÔNG mở vào bếp/bàn ăn)
  door('doorRoom', { x: 6000, y: Y2 }, 0); // Hành lang → Ngủ 800 (không xuyên bếp, không xuyên WC)

  /* ── cửa sổ (block 'window') ── */
  const win = (at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: 'window', at, rot, sx: 1, sy: 1 }]);
  win({ x: 0, y: 3600 }, Math.PI / 2); // Khách, tường Tây
  win({ x: 3500, y: 0 }, 0); // Khách, tường Nam
  win({ x: W, y: 510 }, Math.PI / 2); // Bếp, tường Đông — thẳng trên bếp chữ I (lấy sáng khu soạn/rửa)
  win({ x: W, y: 2650 }, Math.PI / 2); // WC, tường Đông (thông gió — WC luôn cần cửa sổ/ống gió)
  win({ x: 7200, y: H }, 0); // Ngủ, tường Bắc
  win({ x: W, y: 5350 }, Math.PI / 2); // Ngủ, tường Đông (đối lưu 2 hướng)

  /* ── nội thất — có tính khoảng cách/lối đi, không chỉ đặt cho có ── */
  const block = (id: string, at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: furn, block: id, at, rot, sx: 1, sy: 1 }]);
  // Khách + Ăn: sofa dọc tường Tây, ghế bành tạo góc tiếp khách, bàn ăn sát khu bếp (liên hoàn bếp-ăn)
  block('sofa3', { x: 660, y: 3000 }, Math.PI / 2);
  block('armchair', { x: 1700, y: 3000 }, 0);
  block('dining6', { x: 4200, y: 1200 }, 0); // cách vách Bếp ~350mm, cách tường Nam ~320mm
  // Bếp: bếp chữ I dọc tường Nam (lấy sáng cửa sổ Đông phía trên khu rửa/soạn), lối đi 940mm
  block('kitchenI', { x: 7172, y: 510 }, 0);
  // Ngủ: giường đôi áp tường Bắc, tủ áo dọc tường Tây (đủ 600mm lối đi cạnh giường)
  block('bedD', { x: 7400, y: 6095 }, 0); // cách tủ áo ~550mm lối đi, cách tường Đông ~695mm, cách cung mở cửa phòng ~200mm
  block('wardrobe', { x: 5750, y: 6100 }, Math.PI / 2);
  // WC: bồn tắm áp tường trong (giáp Ngủ), bồn cầu + lavabo dọc tường Đông, cách xa cửa/bồn tắm
  block('bathtub', { x: 7500, y: 3075 }, 0);
  block('toilet', { x: 8550, y: 2200 }, -Math.PI / 2);
  block('lavabo', { x: 8550, y: 1600 }, -Math.PI / 2);

  /* ── nhãn phòng + diện tích (thông thuỷ, trừ nửa bề dày tường bao quanh) ── */
  const label = (at: { x: number; y: number }, s: string, h = 200) => push([{ id: newId('e'), type: 'text', layer: text, at, text: s, h }]);
  const livingArea = ((XP - EXT / 2 - PART / 2) * (H - EXT)) / 1e6;
  const kitchenArea = ((W - XP - PART / 2 - EXT / 2) * (Y1 - EXT / 2 - PART / 2)) / 1e6;
  const wcArea = ((W - XW - PART / 2 - EXT / 2) * (Y2 - Y1 - PART)) / 1e6;
  const bedArea = ((W - XP - PART / 2 - EXT / 2) * (H - Y2 - PART / 2 - EXT / 2)) / 1e6;
  label({ x: 1900, y: H - 300 }, 'PHÒNG KHÁCH + ĂN', 220);
  label({ x: 1900, y: H - 550 }, `${livingArea.toFixed(1)} m²`, 160);
  label({ x: 6900, y: H - 300 }, 'PHÒNG NGỦ', 220);
  label({ x: 6900, y: H - 550 }, `${bedArea.toFixed(1)} m²  (cạnh ngắn ≥3.0m)`, 150);
  label({ x: XP + 260, y: 950 }, 'BẾP', 200);
  label({ x: XP + 260, y: 700 }, `${kitchenArea.toFixed(1)} m²`, 150);
  label({ x: XW + 260, y: 2750 }, 'WC', 200);
  label({ x: XW + 260, y: 2500 }, `${wcArea.toFixed(1)} m²`, 150);
  label({ x: XP + 260, y: 2750 }, 'H.LANG', 130);
  push(elevationMarker({ x: 1300, y: 260 }, '±0.000 (N.P.T)', text, 170));

  /* ── chuỗi kích thước 2 LỚP (trục tổng thể + chi tiết mở) — cạnh Nam (ngang) và cạnh Đông (dọc) ── */
  // Lớp 1 (trục, xa nhà hơn): các mốc tường ngăn chính. Lớp 2 (chi tiết, sát tường): tim cửa/cửa sổ.
  push(dimensionChain([{ x: 0, y: 0 }, { x: XP, y: 0 }, { x: W, y: 0 }], -900, dim));
  push(dimensionChain([{ x: 0, y: 0 }, { x: 1500, y: 0 }, { x: 3500, y: 0 }, { x: XP, y: 0 }, { x: W, y: 0 }], -450, dim));
  push(dimensionChain([{ x: W, y: 0 }, { x: W, y: Y1 }, { x: W, y: Y2 }, { x: W, y: H }], 900, dim));
  push(dimensionChain([{ x: W, y: 0 }, { x: W, y: 510 }, { x: W, y: Y1 }, { x: W, y: 2650 }, { x: W, y: Y2 }, { x: W, y: 5350 }, { x: W, y: H }], 450, dim));
  // Kích thước cạnh Tây (chỉ 1 lớp — chiều sâu tổng, không có vách phụ dọc mặt này)
  push(dimensionChain([{ x: 0, y: 0 }, { x: 0, y: H }], 500, dim));

  /* ── bộ trình bày: lưới trục + khung tên + mũi tên Bắc + thước tỉ lệ ── */
  const box = docBox(doc)!;
  push(
    addPresentationKit(doc, box, {
      project: 'CĂN HỘ MẪU — DEMO',
      drawing: 'MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD (đã rà công năng)',
      scale: '1:100',
      author: 'InteriorFlow',
    }),
  );

  return doc;
}
