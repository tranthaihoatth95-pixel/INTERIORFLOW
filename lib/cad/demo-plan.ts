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
  // Khách → Hành lang 800 — mở NGƯỢC vào Khách (rot +π/2), KHÔNG mở vào hành lang: hành lang
  // thông thuỷ chỉ ~1100mm, nếu cửa này mở +x (vào hành lang) thì cung quét 800mm choán gần hết
  // bề rộng, chặn lối đi kề ngay cửa WC (2 cung quét dồn 1 điểm y=2200 — đúng lỗi user phát hiện
  // trên ảnh chụp). Khách là phòng lớn (36.7m²) nên mở vào đó không đụng gì.
  door('doorRoom', { x: XP, y: 2200 }, Math.PI / 2); // Khách → Hành lang 800
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

/**
 * ════════════════════════════════════════════════════════════════════════════════════════
 * lib/cad/demo-plan.ts — PRESET THỨ HAI: "CĂN HỘ 1" (căn 74m², dãy 5B, trục I–F).
 * ════════════════════════════════════════════════════════════════════════════════════════
 *
 * NGUỒN: KHÔNG có file CAD/PDF gốc trong repo — số đo dưới đây do user đọc thủ công từ 1 ẢNH
 * CHỤP bản vẽ rồi chuyển giao bằng text, xem brief giao việc. Vài chuỗi kích thước trên ảnh tự
 * MÂU THUẪN (đo tới mép khác nhau) — 2 số đáng tin nhất là 2 chuỗi dọc cộng khớp NHAU 7825mm:
 *   trái  4325+100+3400=7825   |   phải  3100+2200+2525=7825
 * → dùng H=7825 làm chuẩn dựng TUYỆT ĐỐI. Chiều rộng W chỉ có khoảng "10.050–10.300m" (không
 * điểm nào khớp tuyệt đối) — chọn W=10300 (đầu trên của khoảng) vì tổng diện tích thông thuỷ 8
 * phòng ra ĐÚNG ~73.9m², khớp sát nhãn "74 m²" ghi trên bản vẽ gốc (xem cách tính areaXxx dưới).
 *
 * Vài chi tiết trên ảnh (rộng PN2 ~4.05m, WC nhỏ "cao 2.2m"…) không thể vừa khít cùng lúc với
 * W/H đã chốt + các số đo khác (PN1 3.2m, tắm 1.8m, T.G 1.2m) — đây là ĐẶC ĐIỂM CỐ HỮU của việc
 * đọc số liệu từ ảnh chụp (không phải file CAD gốc), KHÔNG che giấu: lệch trong khoảng ~5-20%,
 * ưu tiên khớp CÔNG NĂNG (ai cạnh ai, cửa mở đâu) hơn khớp centimet chính xác từng phòng.
 *
 * Bố cục (khác demo-plan gốc — đây là preset RIÊNG, KHÔNG đụng buildDemoPlan phía trên):
 *   Bổ dọc trên cùng (đồng cao 4225mm thông thuỷ, sát dải cửa sổ/ban công): PN1 | Phòng tắm
 *   chung | PN2 (PN2 SÂU HƠN xuống dưới, hết chiều cao còn lại chia HÀNH LANG-nhánh → WC nhỏ →
 *   Bếp+T.G, đúng thứ tự "PN2 trên, WC dưới PN2, Bếp/T.G góc dưới-phải" trên ảnh).
 *   Bổ dọc dưới cùng (bên trái): PHÒNG KHÁCH + ĂN — phòng lớn nhất, nhận cửa chính 2 cánh
 *   (tường Nam) + 1 cửa phụ/ban công (góc Tây-Nam). Không có tường/cửa giữa PN1↔Khách (chỉ đặt
 *   NGƯỠNG MỞ theo yêu cầu ảnh gốc "không cửa") — vì app KHÔNG hỗ trợ tường có khe hở thật (mọi
 *   wallSegment là 1 quad đặc), cách xấp xỉ trung thực nhất là: VẪN xây tường (để mỗi phòng còn
 *   dò biên riêng, không vỡ phép đo Kiểm chuẩn) nhưng KHÔNG đặt block cửa nào ở đó — không có
 *   cánh cửa, không có cung quét, chỉ là 1 khung tường trống (không hoàn toàn đúng "mở toang"
 *   như ảnh gốc, nhưng gần nhất trong giới hạn model 2D hiện có; xem hatch.ts đầu file để hiểu
 *   vì sao 1 khe hở thật sẽ làm PN1 và Khách gộp thành 1 vòng dò biên duy nhất, sai lệch mọi số
 *   đo diện tích phòng ngủ ở Kiểm chuẩn).
 *
 * Cửa nội bộ đúng danh sách ảnh gốc: PN1↔tắm · tắm↔hành lang · hành lang↔PN2 · hành lang↔WC
 * (cửa WC) · Bếp↔T.G (cửa T.G) — KHÔNG có cửa tắm↔PN2 trực tiếp (đi vòng qua hành lang, đúng ảnh
 * gốc liệt kê "tắm↔hành lang [↔] PN2", không phải "tắm↔PN2").
 */

const EXT2 = 200; // tường bao — đúng "200mm" ghi trên ảnh (khác 210 của buildDemoPlan gốc)
const PART2 = 100; // vách ngăn — đúng "~100mm" ghi trên ảnh (tường PN1/PN2 quanh phòng tắm)

export function buildDemoPlanApartment74(): Doc {
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const furn = doc.layers.find((l) => l.name === 'Nội thất')!.id;
  const dim = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  const text = doc.layers.find((l) => l.name === 'Ghi chú')!.id;

  const W = 10300; // bề rộng bao — xem giải thích chọn đầu-trên-khoảng ở comment đầu file
  const H = 7825; // chiều cao bao — SỐ TIN CẬY NHẤT (2 chuỗi kích thước ảnh gốc cùng cộng ra 7825)
  // lưới chia — xem sơ đồ bố cục ở comment đầu hàm
  const X1 = 3350; // PN1 | Phòng tắm chung (PN1 thông thuỷ đúng 3200mm rộng theo ảnh)
  const X2 = 5250; // {PN1,Tắm} | {PN2,hành lang,WC,Bếp,T.G} — tắm thông thuỷ đúng 1800mm rộng theo ảnh
  const X3 = 7850; // hành lang(nhánh) | WC nhỏ — trong dải Y1..Y3
  const X4 = 8850; // Bếp | T.G — trong dải 0..Y1 (T.G thông thuỷ ra ≈1.3m, gần đúng "1.2m" ghi trên ảnh)
  const Y1 = 2525; // {Bếp,T.G} | {hành lang nhánh,WC nhỏ} — khớp ĐÚNG số "2525" chuỗi phải trên ảnh
  const Y2 = 3450; // {Khách+Ăn} | {PN1,Tắm}
  const Y3 = 4725; // {hành lang nhánh,WC nhỏ} | PN2 — khớp ĐÚNG số "4725=7825-3100" chuỗi phải trên ảnh
  const push = (es: Entity[]) => doc.entities.push(...es);

  /* ── tường bao (khép vòng) + 7 vách ngăn nội bộ — cùng kỹ thuật "vách CHUNG giữa các phòng"
     như buildDemoPlan gốc (KHÔNG dùng roomRect, tự dựng tay để không nhân đôi tường cạnh chung). */
  push(wallChain([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: H }, { x: 0, y: H }], EXT2, wall, true));
  push(wallChain([{ x: X1, y: Y2 }, { x: X1, y: H }], PART2, wall)); // PN1 | Tắm
  push(wallChain([{ x: X2, y: 0 }, { x: X2, y: H }], PART2, wall)); // cột trái | cột phải (suốt chiều cao)
  push(wallChain([{ x: X3, y: Y1 }, { x: X3, y: Y3 }], PART2, wall)); // hành lang(nhánh) | WC nhỏ
  push(wallChain([{ x: X4, y: 0 }, { x: X4, y: Y1 }], PART2, wall)); // Bếp | T.G
  push(wallChain([{ x: X2, y: Y1 }, { x: W, y: Y1 }], PART2, wall)); // {Bếp,T.G} | {hành lang,WC}
  push(wallChain([{ x: X2, y: Y3 }, { x: W, y: Y3 }], PART2, wall)); // {hành lang,WC} | PN2
  push(wallChain([{ x: 0, y: Y2 }, { x: X2, y: Y2 }], PART2, wall)); // Khách+Ăn | {PN1,Tắm} — bỏ trống đoạn PN1
  // (đoạn tường Khách|PN1 ở trên VẪN xây kín — không đặt block cửa nào ở đây là cách xấp xỉ
  // "ngưỡng mở, không cửa" trong giới hạn model — xem comment đầu file.)

  /* ── cửa đi (quy tắc rot giống buildDemoPlan gốc: tường ngang mở +y→rot 0, -y→rot π; tường dọc
     mở +x→rot -π/2, -x→rot +π/2). ── */
  const door = (blockId: string, at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: blockId, at, rot, sx: 1, sy: 1 }]);
  door('doubleDoor', { x: 1800, y: 0 }, 0); // cửa chính 2 cánh 1600 — tường Nam, vào Khách+Ăn
  door('glassDoor', { x: 0, y: 700 }, -Math.PI / 2); // cửa phụ/ban công góc Tây-Nam — tường Tây
  door('doorRoom', { x: X1, y: 5500 }, -Math.PI / 2); // PN1 → Tắm
  door('doorRoom', { x: X2, y: 4000 }, -Math.PI / 2); // Tắm → hành lang (đúng "tắm↔hành lang" trên ảnh)
  door('doorRoom', { x: 6500, y: Y3 }, 0); // hành lang → PN2 (đúng "hành lang↔PN2")
  door('doorWC', { x: X3, y: 3600 }, -Math.PI / 2); // hành lang → WC nhỏ (cửa WC)
  door('doorRoom', { x: X2, y: 1200 }, -Math.PI / 2); // Khách+Ăn → Bếp
  door('doorRoom', { x: X2, y: 3000 }, -Math.PI / 2); // Khách+Ăn → hành lang
  door('doorWC', { x: X4, y: 1200 }, -Math.PI / 2); // Bếp → T.G (cửa T.G)

  /* ── cửa sổ — dải liên tục cạnh trên (5 khuôn, đúng ảnh gốc) + 2 cửa sổ phụ thông gió Bếp/WC ── */
  const win = (at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: wall, block: 'window', at, rot, sx: 1, sy: 1 }]);
  win({ x: 900, y: H }, 0); // PN1
  win({ x: 2450, y: H }, 0); // PN1
  win({ x: 4300, y: H }, 0); // Tắm
  win({ x: 7000, y: H }, 0); // PN2
  win({ x: 9200, y: H }, 0); // PN2
  win({ x: 7000, y: 0 }, 0); // Bếp — lấy sáng tường Nam (phụ, không tính trong "5 khuôn" của ảnh)
  win({ x: W, y: 3600 }, Math.PI / 2); // WC nhỏ — thông gió, tường Đông

  /* ── nội thất (vị trí đã rà collision — xem lib/cad/shape-interactions.ts detectCollisions;
     mọi món dưới đây KHÔNG chồng lấn nhau/cửa, verify bằng script tay lúc build preset này) ── */
  const block = (id: string, at: { x: number; y: number }, rot: number) => push([{ id: newId('e'), type: 'block', layer: furn, block: id, at, rot, sx: 1, sy: 1 }]);
  // PN1: giường đôi áp tường trên (cạnh ban công), armchair dọc cạnh dưới (hướng Khách)
  block('bedD', { x: 1700, y: 6675 }, 0);
  block('armchair', { x: 700, y: 3750 }, 0);
  // Phòng tắm chung: bồn tắm áp tường trên, toilet+lavabo dọc tường Đông (giáp PN2), kệ khăn tường Tây
  block('bathtub', { x: 4300, y: 7350 }, 0);
  block('toilet', { x: 5000, y: 6500 }, -Math.PI / 2);
  block('lavabo', { x: 5000, y: 5900 }, -Math.PI / 2);
  block('bookshelf', { x: 3550, y: 6400 }, -Math.PI / 2); // đứng vai "tủ đồ vải/khăn" (không có block riêng)
  // PN2: giường đôi áp tường Đông (cạnh phải), tủ áo dọc tường dưới (giáp hành lang/WC)
  block('bedD', { x: 9150, y: 6250 }, -Math.PI / 2);
  block('wardrobe', { x: 7900, y: 5125 }, Math.PI);
  // WC nhỏ: toilet + lavabo
  block('toilet', { x: 9900, y: 4300 }, 0);
  block('lavabo', { x: 8200, y: 2900 }, 0);
  // Bếp: bếp chữ I áp tường Nam (2 lò + bồn rửa đã có trong block)
  block('kitchenI', { x: 7050, y: 430 }, 0);
  // T.G: tủ cao hẹp (dùng wardrobe xoay 90° để vừa bề rộng ~1.2m)
  block('wardrobe', { x: 9600, y: 1200 }, Math.PI / 2);
  // Khách + Ăn: sofa 3 chỗ áp tường Tây, armchair + bàn trà tạo góc tiếp khách, bàn ăn tròn 6 ghế
  // giữa-dưới (sát Bếp), kệ giày (dùng bookshelf) áp tường trên (giáp PN1/Tắm — tường này không
  // có cửa nên còn trống, xem ghi chú "không cửa, ngưỡng mở" ở comment đầu file)
  block('sofa3', { x: 600, y: 2300 }, Math.PI / 2);
  block('armchair', { x: 2200, y: 900 }, 0);
  block('coffeeTable', { x: 1750, y: 2300 }, 0);
  block('dining6', { x: 3900, y: 1100 }, 0);
  block('bookshelf', { x: 2900, y: 3170 }, Math.PI); // kệ giày bậc thang — không có block zigzag riêng, dùng tạm

  /* ── hốc tam giác máy nước nóng/bồn nước (nhãn "W") — góc T.G giáp WC, theo ảnh gốc.
     Vẽ bằng 1 HatchEntity tam giác nhỏ, KHÔNG chạm bất kỳ tường nào (tránh cắt sai biên dò
     phòng của hatch.ts — xem đầu file hatch.ts, mọi entity không phải text/block đều bị coi là
     "biên khả dĩ"). ── */
  push([{ id: newId('e'), type: 'hatch', layer: furn, solid: false, pattern: 'ANSI31', points: [{ x: 9900, y: 2375 }, { x: 10150, y: 2375 }, { x: 10150, y: 2100 }] }]);
  push([{ id: newId('e'), type: 'text', layer: text, at: { x: 9950, y: 2160 }, text: 'W', h: 120 }]);
  // ghi chú kệ giày (chữ thường lẫn hoa — KHÔNG khớp ROOM_NAME_RE nên Kiểm chuẩn không coi là tên phòng)
  push([{ id: newId('e'), type: 'text', layer: text, at: { x: 2750, y: 550 }, text: 'Kệ giày (bậc thang)', h: 90 }]);

  /* ── nhãn phòng + diện tích thông thuỷ (công thức trừ nửa bề dày tường quanh mỗi phòng, cùng
     kiểu buildDemoPlan gốc). Tổng 8 phòng ≈73.9 m² — khớp sát nhãn "74 m²" ghi trên ảnh gốc. ── */
  const label = (at: { x: number; y: number }, s: string, h = 200) => push([{ id: newId('e'), type: 'text', layer: text, at, text: s, h }]);
  const areaPN1 = ((X1 - EXT2 / 2 - PART2 / 2) * (H - Y2 - PART2 / 2 - EXT2 / 2)) / 1e6;
  const areaTam = ((X2 - X1 - PART2) * (H - Y2 - PART2 / 2 - EXT2 / 2)) / 1e6;
  const areaPN2 = ((W - X2 - PART2 / 2 - EXT2 / 2) * (H - Y3 - PART2 / 2 - EXT2 / 2)) / 1e6;
  const areaHLang = ((X3 - X2 - PART2) * (Y3 - Y1 - PART2)) / 1e6;
  const areaWC = ((W - X3 - PART2 / 2 - EXT2 / 2) * (Y3 - Y1 - PART2)) / 1e6;
  const areaBep = ((X4 - X2 - PART2) * (Y1 - PART2 / 2 - EXT2 / 2)) / 1e6;
  const areaTG = ((W - X4 - PART2 / 2 - EXT2 / 2) * (Y1 - PART2 / 2 - EXT2 / 2)) / 1e6;
  const areaKhach = ((X2 - EXT2 / 2 - PART2 / 2) * (Y2 - EXT2 / 2 - PART2 / 2)) / 1e6;
  label({ x: 1700, y: H - 300 }, 'PHÒNG NGỦ 1', 200);
  label({ x: 1700, y: H - 530 }, `${areaPN1.toFixed(1)} m²`, 150);
  label({ x: X1 + 260, y: H - 300 }, 'PHÒNG TẮM CHUNG', 150);
  label({ x: X1 + 260, y: H - 500 }, `${areaTam.toFixed(1)} m²`, 130);
  label({ x: X2 + 300, y: H - 300 }, 'PHÒNG NGỦ 2', 200);
  label({ x: X2 + 300, y: H - 530 }, `${areaPN2.toFixed(1)} m²`, 150);
  label({ x: X2 + 260, y: Y3 - 300 }, 'HÀNH LANG', 150);
  label({ x: X2 + 260, y: Y3 - 500 }, `${areaHLang.toFixed(1)} m²`, 120);
  label({ x: X3 + 260, y: Y3 - 300 }, 'WC', 180);
  label({ x: X3 + 260, y: Y3 - 500 }, `${areaWC.toFixed(1)} m²`, 130);
  label({ x: X2 + 260, y: Y1 - 300 }, 'BẾP', 200);
  label({ x: X2 + 260, y: Y1 - 530 }, `${areaBep.toFixed(1)} m²`, 150);
  label({ x: X4 + 130, y: Y1 - 300 }, 'KHO T.G', 120);
  label({ x: X4 + 130, y: Y1 - 460 }, `${areaTG.toFixed(1)} m²`, 100);
  label({ x: 1700, y: Y2 - 300 }, 'PHÒNG KHÁCH + ĂN', 220);
  label({ x: 1700, y: Y2 - 550 }, `${areaKhach.toFixed(1)} m²`, 160);
  const totalArea = areaPN1 + areaTam + areaPN2 + areaHLang + areaWC + areaBep + areaTG + areaKhach;
  label({ x: 100, y: -700 }, `TỔNG THÔNG THUỶ ≈ ${totalArea.toFixed(1)} m² (bản gốc ghi 74 m²)`, 160);
  push(elevationMarker({ x: 1000, y: 260 }, '±0.000 (N.P.T)', text, 170));

  /* ── nhãn trục + số hiệu căn — chỉ TEXT trang trí cho giống bản gốc, KHÔNG phải kết cấu chịu
     lực thật (đúng yêu cầu brief: trục I/F + "5B"). ── */
  label({ x: -650, y: H / 2 }, 'I', 260);
  label({ x: W + 350, y: H / 2 }, 'F', 260);
  label({ x: W - 900, y: H + 350 }, '5B', 220);

  /* ── chuỗi kích thước — cạnh Đông (phải, khớp ĐÚNG 3 số "3100/2200/2525" ghi trên ảnh) + cạnh
     Tây (trái, khớp ĐÚNG 3 số "4325/100/3400" — dùng chính 2 mặt của vách PN1|Khách dày 100mm)
     + kích thước tổng thể cạnh Nam. ── */
  push(dimensionChain([{ x: W, y: 0 }, { x: W, y: Y1 }, { x: W, y: Y3 }, { x: W, y: H }], 900, dim));
  push(dimensionChain([{ x: 0, y: 0 }, { x: 0, y: Y2 - PART2 / 2 }, { x: 0, y: Y2 + PART2 / 2 }, { x: 0, y: H }], -900, dim));
  push(dimensionChain([{ x: 0, y: 0 }, { x: X1, y: 0 }, { x: X2, y: 0 }, { x: X4, y: 0 }, { x: W, y: 0 }], -450, dim));
  push(dimensionChain([{ x: 0, y: 0 }, { x: W, y: 0 }], -1400, dim));

  /* ── bộ trình bày: lưới trục + khung tên + mũi tên Bắc + thước tỉ lệ ── */
  const box2 = docBox(doc)!;
  push(
    addPresentationKit(doc, box2, {
      project: 'CĂN HỘ 1 — DÃY 5B (74 m²)',
      drawing: 'MẶT BẰNG BỐ TRÍ NỘI THẤT — SƠ PHÁC DD (đọc từ ảnh chụp bản vẽ gốc)',
      scale: '1:100',
      author: 'InteriorFlow',
    }),
  );

  return doc;
}
