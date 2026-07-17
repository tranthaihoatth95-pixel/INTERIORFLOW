/**
 * lib/cad/templates.ts — Sprint 8, VIỆC 2 (H1.4 Project template): 2 mẫu KHỞI ĐẦU mới —
 * Văn phòng (office) và Khách sạn (hotel) — dùng CHUNG pattern dữ liệu với
 * `lib/cad/demo-plan.ts` (căn hộ, KHÔNG sửa file đó — vẫn là 1 trong 3 lựa chọn nguyên trạng).
 *
 * Khác biệt CỐ Ý so với demo-plan.ts: đây là ĐIỂM BẮT ĐẦU cho user tự vẽ tiếp (tường bao + 1-2
 * phòng cơ bản + nhãn phòng), KHÔNG phải bản vẽ hoàn chỉnh — không đặt nội thất, không đặt cửa
 * sổ, không dựng bộ trình bày (lưới trục/khung tên/mũi tên Bắc — khung tên nay có UI riêng ở
 * VIỆC 1, user tự chèn khi cần). Chỉ 1 cửa chính + cửa nội bộ tối thiểu để bản vẽ "dùng được
 * ngay", không phải chỉ là hình khối trống.
 *
 * Cả 2 hàm build*Template() THUẦN (không đụng store/React), trả về Doc — gọi từ CadEditor rồi
 * importDoc(doc, 'replace') giống hệt pattern openDemo()/buildDemoPlan() đã có.
 *
 * Nhãn phòng dùng ĐÚNG từ khoá mà classifyRoom() (lib/cad/standards/checker.ts) nhận diện, để
 * sau khi user vẽ tiếp, Kiểm chuẩn/MEP/Gợi ý tên phòng hoạt động bình thường trên các phòng có
 * sẵn này — không phải chỉ là TEXT hiển thị suông.
 */

import type { Doc, Entity } from './model';
import { emptyDoc } from './model';
import { newId } from './store';
import { wallChain, dimensionChain } from './commands';

const EXT = 210; // bề dày tường bao (mm) — cùng khung 200-220 dùng trong demo-plan.ts
const PART = 100; // bề dày vách ngăn (mm)

/* ═══════════════════════════ VĂN PHÒNG (office) ═══════════════════════════ */

/**
 * Mẫu Văn phòng: 1 khối KHÔNG GIAN MỞ (open office) + 2 phòng họp nhỏ tách biệt bằng 1 vách dọc
 * xuyên suốt + 1 vách ngang phụ (chỉ trong dải phòng họp) — cùng kỹ thuật "vách CHUNG giữa các
 * phòng" như demo-plan.ts (KHÔNG dùng roomRect() vì roomRect tự vẽ đủ 4 cạnh riêng, sẽ nhân đôi
 * tường ở cạnh chung).
 *
 * Kích thước: bao 10.0×6.0m. Open office ~6.8×5.8m (khối lớn). 2 phòng họp dọc tường Đông, mỗi
 * phòng ~2.8×2.8m — đủ 1 bàn họp nhỏ, không cần đặt nội thất mẫu (điểm bắt đầu, không phải bản
 * vẽ hoàn chỉnh).
 */
export function buildOfficeTemplate(): Doc {
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const dim = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  const text = doc.layers.find((l) => l.name === 'Ghi chú')!.id;

  const W = 10000;
  const H = 6000;
  const XP = 7000; // vách dọc chính: Open office (trái) | cột 2 phòng họp (phải)
  const YM = 3000; // vách ngang PHỤ (chỉ trong dải X: XP..W): Phòng họp 1 (dưới) | Phòng họp 2 (trên)
  const push = (es: Entity[]) => doc.entities.push(...es);

  /* ── tường bao (khép vòng) + 2 vách ngăn ── */
  push(wallChain([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], EXT, wall, true));
  push(wallChain([{ x: XP, y: 0 }, { x: XP, y: H }], PART, wall)); // Open office | cột phòng họp
  push(wallChain([{ x: XP, y: YM }, { x: W, y: YM }], PART, wall)); // Phòng họp 1 | Phòng họp 2

  /* ── cửa đi (cùng quy ước rot với demo-plan.ts: tường ngang mở +y→rot 0, -y→rot π; tường dọc
     mở +x→rot -π/2, -x→rot +π/2 — xem lib/cad/furniture.ts) ── */
  const door = (blockId: string, at: { x: number; y: number }, rot: number) =>
    push([{ id: newId('e'), type: 'block', layer: wall, block: blockId, at, rot, sx: 1, sy: 1 }]);
  door('door', { x: 2000, y: 0 }, 0); // cửa chính 900 — mở vào open office
  door('doorRoom', { x: XP, y: YM - 1500 }, -Math.PI / 2); // Open office → Phòng họp 1
  door('doorRoom', { x: XP, y: YM + 1500 }, -Math.PI / 2); // Open office → Phòng họp 2

  /* ── nhãn phòng + diện tích thông thuỷ (công thức xấp xỉ giống demo-plan.ts: trừ nửa bề dày
     tường quanh mỗi phòng). "VĂN PHÒNG" → classifyRoom 'office'; "PHÒNG HỌP 1/2" → 'assembly'
     (chứa từ khoá "PHÒNG HỌP"). ── */
  const label = (at: { x: number; y: number }, s: string, h = 200) => push([{ id: newId('e'), type: 'text', layer: text, at, text: s, h }]);
  const officeArea = ((XP - EXT / 2 - PART / 2) * (H - EXT)) / 1e6;
  const meeting1Area = ((W - XP - PART / 2 - EXT / 2) * (YM - PART / 2 - EXT / 2)) / 1e6;
  const meeting2Area = ((W - XP - PART / 2 - EXT / 2) * (H - YM - PART / 2 - EXT / 2)) / 1e6;
  label({ x: 1800, y: H - 400 }, 'VĂN PHÒNG', 220);
  label({ x: 1800, y: H - 650 }, `${officeArea.toFixed(1)} m²`, 160);
  label({ x: XP + 300, y: YM - 1400 }, 'PHÒNG HỌP 1', 180);
  label({ x: XP + 300, y: YM - 1650 }, `${meeting1Area.toFixed(1)} m²`, 140);
  label({ x: XP + 300, y: YM + 1600 }, 'PHÒNG HỌP 2', 180);
  label({ x: XP + 300, y: YM + 1350 }, `${meeting2Area.toFixed(1)} m²`, 140);

  /* ── kích thước tổng thể cạnh Nam + Đông (1 lớp, đủ tham chiếu — không dựng bộ trình bày đầy
     đủ như demo-plan.ts, khung tên nay chèn riêng qua UI VIỆC 1) ── */
  push(dimensionChain([{ x: 0, y: 0 }, { x: XP, y: 0 }, { x: W, y: 0 }], -500, dim));
  push(dimensionChain([{ x: W, y: 0 }, { x: W, y: YM }, { x: W, y: H }], 500, dim));

  return doc;
}

/* ═══════════════════════════ KHÁCH SẠN (hotel) ═══════════════════════════ */

/**
 * Mẫu Khách sạn: 1 dải HÀNH LANG chạy suốt chiều ngang (tầng điển hình) + 2 phòng ngủ mẫu kiểu
 * khách sạn phía trên, ngăn nhau bằng 1 vách dọc. Đây là "1 khoang tầng điển hình" thu nhỏ để
 * minh hoạ, KHÔNG phải mặt bằng tầng đầy đủ nhiều phòng.
 *
 * Kích thước: bao 8.0×5.2m. Hành lang dải dưới ~1.24m thông thuỷ (đạt chuẩn QCVN 06 ≥1.0m tối
 * thiểu, xem vn-fire-corridor-min-width-general). 2 phòng ngủ phía trên, mỗi phòng ~3.7×3.6m
 * thông thuỷ (≈14.0 m², đạt chuẩn TCVN 4451 ≥9m²) — cả 2 phòng đạt chuẩn NGAY từ template, đúng
 * tinh thần "điểm bắt đầu sạch", không phải phòng lỗi mà user phải tự sửa trước khi dùng.
 */
export function buildHotelTemplate(): Doc {
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const dim = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  const text = doc.layers.find((l) => l.name === 'Ghi chú')!.id;

  const W = 8000;
  const H = 5200;
  const YC = 1400; // vách ngang: Hành lang (dưới) | 2 phòng ngủ (trên)
  const XP = 4000; // vách dọc PHỤ (chỉ trong dải Y: YC..H): Phòng ngủ 1 (trái) | Phòng ngủ 2 (phải)
  const push = (es: Entity[]) => doc.entities.push(...es);

  /* ── tường bao (khép vòng) + 2 vách ngăn ── */
  push(wallChain([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], EXT, wall, true));
  push(wallChain([{ x: 0, y: YC }, { x: W, y: YC }], PART, wall)); // Hành lang | 2 phòng ngủ
  push(wallChain([{ x: XP, y: YC }, { x: XP, y: H }], PART, wall)); // Phòng ngủ 1 | Phòng ngủ 2 (chỉ trong dải trên)

  /* ── cửa đi: 1 cửa chính vào hành lang (đầu hồi Tây) + 2 cửa phòng từ hành lang vào từng
     phòng ngủ (cùng quy ước rot demo-plan.ts) ── */
  const door = (blockId: string, at: { x: number; y: number }, rot: number) =>
    push([{ id: newId('e'), type: 'block', layer: wall, block: blockId, at, rot, sx: 1, sy: 1 }]);
  door('door', { x: 0, y: 700 }, Math.PI / 2); // cửa chính 900 — tường Tây, mở vào hành lang (+x → rot +π/2 vì tường dọc)
  door('doorRoom', { x: 2000, y: YC }, 0); // Hành lang → Phòng ngủ 1 (tường ngang mở +y → rot 0)
  door('doorRoom', { x: 6000, y: YC }, 0); // Hành lang → Phòng ngủ 2

  /* ── nhãn phòng + diện tích thông thuỷ. "HÀNH LANG" → classifyRoom 'corridor' (đo bề rộng nhỏ
     nhất qua polygonMinWidth trong checker.ts); "PHÒNG NGỦ 1/2" → 'bedroom' (chứa "NGỦ"). ── */
  const label = (at: { x: number; y: number }, s: string, h = 200) => push([{ id: newId('e'), type: 'text', layer: text, at, text: s, h }]);
  const corridorArea = ((W - EXT) * (YC - EXT / 2 - PART / 2)) / 1e6;
  const room1Area = ((XP - PART / 2 - EXT / 2) * (H - YC - PART / 2 - EXT / 2)) / 1e6;
  const room2Area = ((W - XP - PART / 2 - EXT / 2) * (H - YC - PART / 2 - EXT / 2)) / 1e6;
  label({ x: W / 2 - 500, y: YC / 2 - 80 }, 'HÀNH LANG', 160);
  label({ x: W / 2 - 500, y: YC / 2 - 300 }, `${corridorArea.toFixed(1)} m²`, 120);
  label({ x: XP / 2 - 600, y: YC + (H - YC) / 2 + 200 }, 'PHÒNG NGỦ 1', 200);
  label({ x: XP / 2 - 600, y: YC + (H - YC) / 2 - 100 }, `${room1Area.toFixed(1)} m²`, 150);
  label({ x: XP + (W - XP) / 2 - 600, y: YC + (H - YC) / 2 + 200 }, 'PHÒNG NGỦ 2', 200);
  label({ x: XP + (W - XP) / 2 - 600, y: YC + (H - YC) / 2 - 100 }, `${room2Area.toFixed(1)} m²`, 150);

  /* ── kích thước tổng thể cạnh Nam + Đông (1 lớp) ── */
  push(dimensionChain([{ x: 0, y: 0 }, { x: XP, y: 0 }, { x: W, y: 0 }], -500, dim));
  push(dimensionChain([{ x: W, y: 0 }, { x: W, y: YC }, { x: W, y: H }], 500, dim));

  return doc;
}
