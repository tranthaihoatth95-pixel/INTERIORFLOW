/**
 * scripts/cad-library/blocks-data.ts — DỮ LIỆU GỐC của thư viện block CAD nội thất/kiến trúc.
 *
 * Toàn bộ hình học ở đây là TỰ DỰNG (nguyên bản, không chép từ nguồn thứ 3) theo đúng phong
 * cách đã dùng ở `lib/cad/furniture.ts`: danh sách Prim (line/poly/circle/arc) trong hệ toạ độ
 * LOCAL milimét, gốc ở TÂM block, trục X phải / Y lên. Kích thước theo cataloge nội thất phổ
 * biến VN/quốc tế (mm). File này CHỈ chứa dữ liệu — không phụ thuộc DOM/React, dùng được cả
 * trong script Node (generate-library.ts) lẫn (nếu cần sau này) trong app.
 *
 * KHÔNG import gì từ đây vào `lib/cad/furniture.ts` hay `components/cad/**` — thư viện này độc
 * lập hoàn toàn, chỉ dùng type `Prim` (đọc, không sửa) để khớp định dạng.
 */

import type { Prim } from '../../lib/cad/furniture';
import type { Pt } from '../../lib/cad/model';

export type Category =
  | 'phong-khach'
  | 'phong-an'
  | 'phong-ngu'
  | 'bep'
  | 've-sinh'
  | 'cua'
  | 'cay-canh'
  | 'xe'
  | 'cau-thang'
  | 'cot'
  | 'ky-hieu';

export const CATEGORY_LABEL: Record<Category, string> = {
  'phong-khach': 'Phòng khách',
  'phong-an': 'Phòng ăn',
  'phong-ngu': 'Phòng ngủ',
  bep: 'Bếp',
  've-sinh': 'Vệ sinh',
  cua: 'Cửa & cửa sổ',
  'cay-canh': 'Cây cảnh',
  xe: 'Xe',
  'cau-thang': 'Cầu thang',
  cot: 'Cột',
  'ky-hieu': 'Ký hiệu',
};

export interface LibBlockDef {
  id: string;
  name: string;
  category: Category;
  /** kích thước bao (mm) — dùng để tính viewBox thumbnail + hiển thị trong panel */
  w: number;
  h: number;
  prims: Prim[];
  /** nguồn dữ liệu: URL+license nếu lấy từ web, hoặc 'tự dựng' */
  source: string;
  license: string;
}

/* ───────────────────────── helper hình học (local mm, gốc tâm) ───────────────────────── */

function rect(x: number, y: number, w: number, h: number, closed = true): Prim {
  return { k: 'poly', closed, pts: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }] };
}
function box(w: number, h: number): Prim {
  return rect(-w / 2, -h / 2, w, h);
}
function line(ax: number, ay: number, bx: number, by: number): Prim {
  return { k: 'line', a: { x: ax, y: ay }, b: { x: bx, y: by } };
}
function circ(cx: number, cy: number, r: number): Prim {
  return { k: 'circle', c: { x: cx, y: cy }, r };
}
function arc(cx: number, cy: number, r: number, a1: number, a2: number): Prim {
  return { k: 'arc', c: { x: cx, y: cy }, r, a1, a2 };
}
/** bo góc bằng bát giác xấp xỉ (đủ cho ký hiệu mặt bằng, không cần bezier) */
function octagon(w: number, h: number, cut: number): Prim {
  const x = w / 2;
  const y = h / 2;
  const c = Math.min(cut, x, y);
  return {
    k: 'poly',
    closed: true,
    pts: [
      { x: -x + c, y: -y }, { x: x - c, y: -y }, { x, y: -y + c },
      { x, y: y - c }, { x: x - c, y }, { x: -x + c, y },
      { x: -x, y: y - c }, { x: -x, y: -y + c },
    ],
  };
}
function hatchX(w: number, h: number): Prim[] {
  return [line(-w / 2, -h / 2, w / 2, h / 2), line(-w / 2, h / 2, w / 2, -h / 2)];
}

/* ═════════════════ helper CONG — thêm 06/08, VIỆC 4 ═════════════════
 *
 * LỖI CHUNG CẢ BỘ (đo thật 06/08): **41/46 block KHÔNG dùng arc nào**, trung vị **4 hình/block**.
 * Nội thất mềm mà toàn nét thẳng thì luôn ra hình hộp. Bộ helper dưới đây là để chữa đúng chỗ đó.
 *
 * ⚠️ Giữ đúng §2 nguồn tham chiếu — **CHI TIẾT TIẾT CHẾ, gợi ý chứ không tả**: ghế là
 * "mâm + lưng + 2 tay", KHÔNG chân sao, KHÔNG bánh xe. Thêm cong để đúng chất, không phải để
 * thêm chi tiết.
 */

/** Hình chữ nhật BO GÓC thật (4 đoạn thẳng + 4 cung). Bán kính tự kẹp để không vượt nửa cạnh. */
function roundedRect(x: number, y: number, w: number, h: number, r: number): Prim[] {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr === 0) return [rect(x, y, w, h)];
  const x0 = x, y0 = y, x1 = x + w, y1 = y + h;
  const HALF = Math.PI / 2;
  return [
    line(x0 + rr, y0, x1 - rr, y0),
    line(x1, y0 + rr, x1, y1 - rr),
    line(x1 - rr, y1, x0 + rr, y1),
    line(x0, y1 - rr, x0, y0 + rr),
    arc(x1 - rr, y0 + rr, rr, -HALF, 0),
    arc(x1 - rr, y1 - rr, rr, 0, HALF),
    arc(x0 + rr, y1 - rr, rr, HALF, Math.PI),
    arc(x0 + rr, y0 + rr, rr, Math.PI, 1.5 * Math.PI),
  ];
}

/** Elip xấp xỉ bằng đa giác kín — `Prim` không có kiểu elip, và poly thì DXF/SVG đều ăn thẳng. */
function ellipse(cx: number, cy: number, rx: number, ry: number, n = 32): Prim {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return { k: 'poly', closed: true, pts };
}

/* ── ngẫu nhiên TẤT ĐỊNH (§0e KS2) ──
 * Tán cây phải bất đối xứng, nhưng **sinh lại phải ra đúng hình cũ** — nếu không thì mỗi lần chạy
 * generator lại ra một bộ .dxf/.svg khác, repo churn vô nghĩa và người dùng thấy cây đổi hình.
 * ⛔ TUYỆT ĐỐI KHÔNG `Math.random()` trong file này.
 */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tán tự do BẤT ĐỐI XỨNG (nguồn mục 4: *"tán vẽ tự do bất đối xứng"*, và mục "Việc phải sửa ngay"
 * số 4: *"tán tự do bất đối xứng, không răng cưa đều"*).
 *
 * Cách làm: bán kính mỗi thuỳ nhiễu quanh `r` theo PRNG có hạt giống, RỒI làm mượt bằng trung
 * bình trượt 3 điểm — không làm mượt thì ra đúng "răng cưa" mà nguồn cấm.
 */
function canopy(cx: number, cy: number, r: number, lobes: number, wobble: number, seed: string): Prim {
  const rnd = mulberry32(hash32(seed));
  const n = Math.max(7, lobes);
  const raw: number[] = [];
  for (let i = 0; i < n; i++) raw.push(r * (1 + (rnd() * 2 - 1) * wobble));
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const rSmooth = (raw[(i - 1 + n) % n] + raw[i] * 2 + raw[(i + 1) % n]) / 4;
    const a = (i / n) * Math.PI * 2;
    pts.push({ x: cx + rSmooth * Math.cos(a), y: cy + rSmooth * Math.sin(a) });
  }
  return { k: 'poly', closed: true, pts };
}
const SRC_SELF = 'tự dựng (nguyên bản, theo phong cách lib/cad/furniture.ts)';
const LIC_SELF = 'CC0 — tự do sử dụng/sửa/phân phối (tài sản gốc của dự án InteriorFlow)';

/* ───────────────────────── PHÒNG KHÁCH ───────────────────────── */

/**
 * SOFA nhìn từ trên.
 *
 * 🔴 **NÂNG CẤP 06/08.** Bản cũ toàn `rect` + `line` thẳng ⇒ ra hình hộp, không ra đồ mềm. Nay
 * thêm đúng ba thứ nguồn tham chiếu yêu cầu: **tay có bo**, **lưng CONG**, **đệm ngồi bo góc**.
 * Vẫn tiết chế — không vẽ đường chỉ, không vẽ nút bọc.
 */
function sofa(w: number, d: number, seats: number): Prim[] {
  const arm = 150;
  const backY = d / 2 - 150;
  const prims: Prim[] = [
    ...roundedRect(-w / 2, -d / 2, w, d, 90),                       // thân bo góc
    // LƯNG CONG — cung rất thoải, võng nhẹ về phía người ngồi
    arc(0, backY + w * 0.62, w * 0.63, Math.PI * 1.42, Math.PI * 1.58),
    // hai tay: bo đầu ngoài
    ...roundedRect(-w / 2 + 14, -d / 2 + 14, arm, d - 28 - 150, 60),
    ...roundedRect(w / 2 - arm - 14, -d / 2 + 14, arm, d - 28 - 150, 60),
  ];
  const inner = w - arm * 2;
  const seatW = inner / seats;
  const seatH = backY + d / 2 - 100;
  for (let i = 0; i < seats; i++) {
    const sx = -inner / 2 + i * seatW;
    prims.push(...roundedRect(sx + 30, -d / 2 + 60, seatW - 60, seatH, 55)); // đệm bo góc
  }
  return prims;
}

/**
 * SOFA GÓC CHỮ L.
 *
 * 🔴 **NÂNG CẤP 06/08.** Bản cũ toàn `rect`/`line` thẳng — cùng bệnh hình hộp với `sofa()`. Nay
 * dùng chung ngôn ngữ đã sửa ở `sofa()`: **thân bo góc · lưng cong · tay bo · đệm bo góc**.
 * Bố cục giữ nguyên (nhánh ngang 2600×900 + chaise 900×1250 ghép góc trái) để không đổi cách
 * người dùng đã quen đặt nó vào bản vẽ.
 */
function sofaL(): Prim[] {
  const W = 2600, D = 900;          // nhánh ngang
  const chaiseW = 900, chaiseL = 1250; // nhánh vươn xuống
  const arm = 140;
  const backY = D / 2 - 150;
  const xL = -W / 2, yB = -D / 2;
  return [
    // thân: nhánh ngang + chaise, cùng bo góc
    ...roundedRect(xL, yB, W, D, 80),
    ...roundedRect(xL, yB - chaiseL, chaiseW, chaiseL + 40, 80),
    // LƯNG CONG của nhánh ngang
    arc(0, backY + W * 0.63, W * 0.64, Math.PI * 1.46, Math.PI * 1.54),
    // tay phải (đầu hở của nhánh ngang) — chaise thay cho tay trái
    ...roundedRect(W / 2 - arm - 14, yB + 14, arm, D - 28 - 150, 55),
    // đệm ngồi: 1 tấm trên chaise + 2 tấm trên nhánh ngang
    ...roundedRect(xL + 40, yB - chaiseL + 60, chaiseW - 80, chaiseL - 40, 50),
    ...roundedRect(xL + 40, yB + 55, 780, backY - yB - 40, 50),
    ...roundedRect(xL + 860, yB + 55, 800, backY - yB - 40, 50),
  ];
}

/**
 * GHẾ BÀNH — dựng theo ĐÚNG mẫu `G1` của `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` §2:
 * *"đường bao ngoài + 3–4 đường cong gợi nệm. Hết."*
 *
 * 🔴 **VẼ LẠI 06/08.** Bản cũ chỉ là `sofa(800,800,1)` — tức ghế bành và sofa 1 chỗ là cùng một
 * hình, và đều là hộp. Nay là hàm riêng, đúng công thức G1, KHÔNG tái dùng `sofa()`.
 * Kích thước lấy từ bảng đo ảnh `G2`: **rộng 630 · sâu 580** (dữ kiện ngành).
 */
function armchair(): Prim[] {
  const W = 630, D = 580;
  const arm = 115;          // bề dày tay
  const backD = 130;        // bề dày lưng
  const yBack = D / 2 - backD;   // mép trong của lưng
  const yFront = -D / 2;
  return [
    // ① đường bao ngoài
    ...roundedRect(-W / 2, -D / 2, W, D, 95),
    // ② mép trong LƯNG — cung thoải, võng về phía người ngồi
    arc(0, yBack + W * 1.05, W * 1.08, Math.PI * 1.463, Math.PI * 1.537),
    // ③ + ④ mép trong hai TAY
    line(-W / 2 + arm, yFront + 55, -W / 2 + arm, yBack),
    line(W / 2 - arm, yFront + 55, W / 2 - arm, yBack),
    // ⑤ mép trước đệm ngồi — cung nhẹ, phình ra phía trước
    arc(0, yFront + 55 + W * 0.72, W * 0.75, Math.PI * 1.44, Math.PI * 1.56),
  ];
}

function coffeeTable(): Prim[] {
  return [box(1200, 600), rect(-500, -250, 1000, 500)];
}

function tvConsole(): Prim[] {
  return [box(1600, 400), line(-700, 0, 700, 0), circ(0, 0, 60)];
}

function bookshelf(): Prim[] {
  const w = 900, h = 350;
  const prims: Prim[] = [box(w, h)];
  for (let i = 1; i < 4; i++) prims.push(line(-w / 2 + (i * w) / 4, -h / 2, -w / 2 + (i * w) / 4, h / 2));
  return prims;
}

/* ───────────────────────── PHÒNG ĂN ───────────────────────── */

/**
 * GHẾ ăn nhìn từ trên, có LƯNG và có HƯỚNG NGỒI.
 *
 * 🔴 **NÂNG CẤP 06/08.** Bản cũ là **một ô vuông rỗng** — không đọc được ghế quay mặt về đâu, mà
 * hướng ngồi mới là thứ mặt bằng bố trí cần nói. Nay theo đúng §2 nguồn tham chiếu
 * (*"1 mâm + 1 lưng cong + 2 tay"*, tiết chế): **mâm bo góc + lưng cong + 2 mẩu tay**.
 * ⛔ Không chân sao, không bánh xe — nguồn ghi rõ bản vẽ thật không ai vẽ.
 *
 * `faceAngle` = hướng NGỒI (ghế quay mặt về phía đó), radian. Mọi điểm quay quanh `(cx,cy)` nên
 * dùng được cho cả bàn chữ nhật lẫn bàn tròn — không cần hai hàm như trước.
 */
function chairAt(cx: number, cy: number, faceAngle: number): Prim[] {
  const s = 420;                      // bề rộng ghế
  const seat = s * 0.86;
  const cos = Math.cos(faceAngle), sin = Math.sin(faceAngle);
  // hệ LOCAL của ghế: +y là hướng NGỒI (nhìn về bàn), lưng ở -y
  const T = (x: number, y: number): Pt => ({ x: cx + x * cos - y * sin, y: cy + x * sin + y * cos });
  const TP = (p: Pt) => T(p.x, p.y);

  const prims: Prim[] = [];
  // mâm ngồi — bo góc, dựng ở local rồi quay
  for (const pr of roundedRect(-seat / 2, -seat / 2, seat, seat * 0.9, 70)) {
    if (pr.k === 'line') prims.push({ k: 'line', a: TP(pr.a), b: TP(pr.b) });
    else if (pr.k === 'arc') prims.push({ k: 'arc', c: TP(pr.c), r: pr.r, a1: pr.a1 + faceAngle, a2: pr.a2 + faceAngle });
  }
  // lưng CONG ôm sau lưng người ngồi (phía -y local). Tâm cung đẩy RA SAU mâm và bán kính vừa đủ
  // ôm bề rộng mâm ⇒ lưng DÍNH vào mâm. (Bản đầu 06/08 để r=0.56·seat, tâm -0.30·seat ⇒ cung phình
  // ra ngoài thành một vành trăng RỜI phía sau ghế — nhìn không ra cái lưng.)
  prims.push({ k: 'arc', c: T(0, -seat * 0.02), r: seat * 0.47, a1: faceAngle + Math.PI * 1.20, a2: faceAngle + Math.PI * 1.80 });
  // 2 mẩu tay
  prims.push({ k: 'line', a: T(-seat / 2, -seat * 0.10), b: T(-seat / 2, seat * 0.22) });
  prims.push({ k: 'line', a: T(seat / 2, -seat * 0.10), b: T(seat / 2, seat * 0.22) });
  return prims;
}

/** Giữ chữ ký cũ để chỗ gọi không phải đổi: `up=true` nghĩa là ghế ngồi quay XUỐNG (về bàn). */
function diningChair(cx: number, cy: number, up: boolean): Prim[] {
  return chairAt(cx, up ? cy + 210 : cy - 210, up ? -Math.PI / 2 : Math.PI / 2);
}

function diningTableRect(seats: 4 | 6): Prim[] {
  const w = seats === 4 ? 1200 : 1800;
  const d = seats === 4 ? 750 : 900;
  const prims: Prim[] = [box(w, d)];
  const perSide = seats / 2;
  const gap = w / perSide;
  for (let i = 0; i < perSide; i++) {
    const cx = -w / 2 + gap / 2 + i * gap;
    prims.push(...diningChair(cx, d / 2 + 80, true));
    prims.push(...diningChair(cx, -d / 2 - 80, false));
  }
  return prims;
}

function diningTableRound(seats: 4): Prim[] {
  const r = 600;
  const prims: Prim[] = [circ(0, 0, r)];
  for (let i = 0; i < seats; i++) {
    const ang = (i / seats) * Math.PI * 2;
    const cx = Math.cos(ang) * (r + 300);
    const cy = Math.sin(ang) * (r + 300);
    // ghế quay MẶT VÀO BÀN ⇒ hướng ngồi là ngược hướng bán kính (ang + π)
    prims.push(...chairAt(cx, cy, ang + Math.PI));
  }
  return prims;
}
function chairSquareAt(cx: number, cy: number, faceAngle: number): { x: number; y: number }[] {
  const s = 420;
  const local = [{ x: -s / 2, y: -s / 2 }, { x: s / 2, y: -s / 2 }, { x: s / 2, y: s / 2 }, { x: -s / 2, y: s / 2 }];
  const cos = Math.cos(faceAngle), sin = Math.sin(faceAngle);
  return local.map((p) => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
}

function barStool(): Prim[] {
  return [circ(0, 0, 175), circ(0, 0, 130)];
}

function sideboard(): Prim[] {
  const w = 1600, h = 450;
  return [box(w, h), line(-w / 2 + w / 3, -h / 2, -w / 2 + w / 3, h / 2), line(-w / 2 + (2 * w) / 3, -h / 2, -w / 2 + (2 * w) / 3, h / 2)];
}

/* ───────────────────────── PHÒNG NGỦ ───────────────────────── */

function bed(w: number, l: number, pillows: number): Prim[] {
  const prims: Prim[] = [box(w, l)];
  const blanketY = -l / 2 + l * 0.62;
  prims.push(line(-w / 2, blanketY, w / 2, blanketY));
  const pw = (w - 120) / pillows;
  for (let i = 0; i < pillows; i++) {
    const px = -w / 2 + 60 + i * pw;
    prims.push(rect(px + 30, l / 2 - 380, pw - 60, 300));
  }
  return prims;
}

function nightstand(): Prim[] {
  return [box(450, 400), line(-225, 0, 225, 0)];
}

/**
 * TỦ ÁO nhìn từ trên.
 *
 * 🔴 **VẼ LẠI 06/08.** Bản cũ vẽ mỗi cánh bằng 2 đoạn thẳng chụm đỉnh ⇒ cả tủ thành **dãy răng
 * cưa tam giác đều**, không phải ký hiệu tủ. Ký hiệu đúng của cánh mở là **cánh (đoạn thẳng
 * vuông góc mặt tủ) + CUNG 90° quét từ bản lề** — cùng quy ước với ký hiệu cửa đi.
 *
 * ⚠️ **Bản lề đặt CÙNG MỘT BÊN, không so le.** Bản so le (thử 06/08) trông như **cái rèm**: hai
 * cung gặp nhau ở giữa thành một đường liền, còn hai cánh thì nằm ĐÚNG TRÊN mép hông tủ nên vô
 * hình — nhìn ra tủ cao gấp đôi chứ không ra cánh cửa. Cùng chiều thì mọi cánh (trừ cánh đầu) rơi
 * vào vạch chia trong lòng tủ ⇒ thấy được, và các cung lặp cùng hướng đọc ngay ra "dãy cánh mở".
 *
 * ⚠️ Cung quét làm kích thước bao lớn hơn thân tủ (tủ 1200×600 ⇒ bao 1200×1200). Đó là **đúng quy
 * ước sẵn có của thư viện này**, không phải lỗi: `arch-door-single` cũng khai 900×900 cho cánh
 * cửa 900 — số khai là BỀ RỘNG BẢN VẼ kể cả cung, không phải bề rộng vật.
 */
function wardrobe(w: number, doors: 2 | 3): Prim[] {
  const d = 600;
  const yFront = -d / 2;                       // mặt trước tủ (phía mở cánh)
  const prims: Prim[] = [
    box(w, d),
    line(-w / 2, d / 2 - 40, w / 2, d / 2 - 40), // vạch thanh treo trong lòng tủ
  ];
  const seg = w / doors;
  const HALF = Math.PI / 2;
  for (let i = 0; i < doors; i++) {
    const hinge = -w / 2 + i * seg;   // bản lề ở mép TRÁI mỗi cánh, mọi cánh mở CÙNG chiều
    prims.push(line(hinge, yFront, hinge, yFront - seg)); // cánh mở vuông góc ra ngoài
    prims.push(arc(hinge, yFront, seg, -HALF, 0));        // cung quét 90°
  }
  return prims;
}

function dresser(): Prim[] {
  const w = 1000, h = 500;
  const prims: Prim[] = [box(w, h)];
  for (let i = 1; i < 3; i++) prims.push(line(-w / 2, -h / 2 + (i * h) / 3, w / 2, -h / 2 + (i * h) / 3));
  return prims;
}

/* ───────────────────────── BẾP ───────────────────────── */

function sinkSingle(): Prim[] {
  return [box(600, 500), rect(-220, -170, 440, 340)];
}
function stove4(): Prim[] {
  const prims: Prim[] = [box(600, 600)];
  const off = 140;
  [[-off, -off], [off, -off], [-off, off], [off, off]].forEach(([x, y]) => prims.push(circ(x, y, 90)));
  return prims;
}
function fridge(): Prim[] {
  return [box(700, 700), line(-350, 100, 350, 100), line(0, 100, 0, 350)];
}
function kitchenIsland(): Prim[] {
  const w = 2000, d = 900;
  return [box(w, d), rect(-w / 2 + 200, -d / 2 + 100, 500, d - 200), circ(w / 2 - 500, 0, 30)];
}
function cabinetRunL(): Prim[] {
  const w1 = 3000, d1 = 600, w2 = 1500, d2 = 600;
  const prims: Prim[] = [];
  prims.push(rect(-w1 / 2, -d1 / 2, w1, d1));
  prims.push(rect(w1 / 2 - d2, -d1 / 2 - w2, d2, w2));
  for (let i = 1; i < 6; i++) prims.push(line(-w1 / 2 + (i * w1) / 6, -d1 / 2, -w1 / 2 + (i * w1) / 6, d1 / 2));
  return prims;
}

/* ───────────────────────── VỆ SINH ───────────────────────── */

/**
 * BỒN CẦU nhìn từ trên.
 *
 * 🔴 **VẼ LẠI 06/08.** Bản cũ là hộp chữ nhật + **đa giác 6 đỉnh nhọn** + 1 vòng tròn — nhìn ra
 * con dấu, không ra bồn cầu. Nay đúng cấu tạo thật: **két nước chữ nhật (bo góc sau)** + **bầu
 * dục thân bồn** + vành ngồi bên trong + cổ nối két với bồn.
 *
 * Kích thước: 380 rộng × 700 sâu — cỡ bồn cầu một khối phổ thông (dữ kiện ngành, §0h HG3).
 * Gốc toạ độ đặt ở TÂM bao để thumbnail và mọi phép đặt block đều cân.
 */
function toilet(): Prim[] {
  const W = 380, D = 700;
  const cisH = 180;                    // két nước
  const yTop = D / 2;                  // mép sau (lưng két)
  const cisY = yTop - cisH;            // mép trước két
  const bowlCy = -D / 2 + 240;         // tâm bầu dục thân bồn
  return [
    ...roundedRect(-W / 2, cisY, W, cisH, 40),          // két nước
    ellipse(0, bowlCy, W / 2 - 10, 240),                 // thân bồn — BẦU DỤC, không phải đa giác
    ellipse(0, bowlCy + 10, W / 2 - 70, 185),            // vành ngồi
    line(-70, cisY, -70, bowlCy + 215),                  // cổ nối
    line(70, cisY, 70, bowlCy + 215),
  ];
}
/**
 * BIDET nhìn từ trên.
 *
 * 🔴 **VẼ LẠI 06/08.** Cùng bệnh với bồn cầu (ngũ giác + tròn). Nay: **bầu dục thân** + vành +
 * gờ vòi ở mép sau. Không két nước — đó chính là điểm phân biệt bidet với bồn cầu trên mặt bằng,
 * bản cũ vẽ cả hai gần như y hệt nên nhìn không tách được.
 * Kích thước 360 × 560 (nhỏ và ngắn hơn bồn cầu — đúng tỉ lệ thật).
 */
function bidet(): Prim[] {
  const W = 360, D = 560;
  const bowlCy = -D / 2 + 250;
  return [
    ellipse(0, bowlCy, W / 2, 250),            // thân
    ellipse(0, bowlCy + 8, W / 2 - 60, 195),   // vành
    ...roundedRect(-90, D / 2 - 70, 180, 70, 25), // gờ vòi ở mép sau (thay cho két nước)
  ];
}
function lavabo(): Prim[] {
  return [box(600, 460), circ(0, -20, 170), circ(0, 190, 22)];
}
function bathtub(): Prim[] {
  const w = 1700, d = 750;
  return [box(w, d), rect(-w / 2 + 90, -d / 2 + 90, w - 180, d - 180)];
}
function showerStall(): Prim[] {
  const s = 900;
  return [box(s, s), arc(-s / 2, -s / 2, s * 0.9, 0, Math.PI / 2), circ(s / 2 - 150, s / 2 - 150, 40)];
}

/* ───────────────────────── CỬA & CỬA SỔ ───────────────────────── */

function doorSwing(w = 900): Prim[] {
  return [line(-w / 2, 0, -w / 2, w), arc(-w / 2, 0, w, 0, Math.PI / 2), line(-w / 2, 0, w / 2, 0)];
}
function doorDouble(w = 1500): Prim[] {
  const half = w / 2;
  return [
    line(-half, 0, -half, half), arc(-half, 0, half, 0, Math.PI / 2), line(-half, 0, 0, 0),
    line(half, 0, half, half), arc(half, 0, half, Math.PI / 2, Math.PI), line(half, 0, 0, 0),
  ];
}
function doorSliding(w = 1800): Prim[] {
  const t = 60;
  return [
    rect(-w / 2, -t / 2, w * 0.55, t),
    rect(-w / 2 + w * 0.4, -t / 2 - 70, w * 0.55, t),
    line(-w / 2, -t / 2 - 140, w / 2, -t / 2 - 140),
  ];
}
function windowN(w = 1200): Prim[] {
  const t = 100;
  return [
    line(-w / 2, t / 2, w / 2, t / 2), line(-w / 2, -t / 2, w / 2, -t / 2),
    line(-w / 2, 0, w / 2, 0), line(-w / 2, t / 2, -w / 2, -t / 2), line(w / 2, t / 2, w / 2, -t / 2),
  ];
}
function windowDouble(w = 1800): Prim[] {
  const t = 100;
  const base = windowN(w);
  base.push(line(0, t / 2, 0, -t / 2));
  return base;
}
function windowBay(): Prim[] {
  // cửa sổ góc/vòm: 3 nhịp kính gấp khúc lồi ra ngoài
  const seg = 700;
  return [
    line(-seg, 0, -seg * 0.5, -300), line(-seg * 0.5, -300, seg * 0.5, -300), line(seg * 0.5, -300, seg, 0),
    line(-seg, 60, -seg * 0.5, -240), line(-seg * 0.5, -240, seg * 0.5, -240), line(seg * 0.5, -240, seg, 60),
  ];
}

/* ───────────────────────── CÂY CẢNH ───────────────────────── */

/**
 * CHẬU CÂY nhìn từ trên.
 *
 * 🔴 **VẼ LẠI 06/08.** Bản cũ là `circ(r*0.35)` + `circ(r)` + vài cung đều = **hai vòng tròn đồng
 * tâm (cái donut)**, không ai đọc ra cây. Nay: miệng chậu tròn (chậu THẬT tròn, giữ) + **tán bất
 * đối xứng sinh bằng hàm có hạt giống** + 2–3 nhánh gợi khối lá. Hạt giống lấy từ chính bán kính
 * ⇒ chậu nhỏ và chậu lớn ra hai dáng tán KHÁC nhau, nhưng mỗi cái luôn tái lập đúng (KS2).
 */
function pottedPlant(r: number, leaves: number): Prim[] {
  const seed = `pot-${r}-${leaves}`;
  const rnd = mulberry32(hash32(seed));
  const prims: Prim[] = [
    circ(0, 0, r * 0.34),                                  // miệng chậu
    canopy(0, 0, r * 0.92, leaves + 2, 0.26, seed),         // tán ngoài, bất đối xứng
    canopy(0, 0, r * 0.62, leaves + 1, 0.22, `${seed}-in`), // lớp lá trong — gợi khối, không tả
  ];
  // 2–3 nhánh cong hướng ra ngoài; góc lệch ngẫu-nhiên-tất-định nên không đều tăm tắp
  const branches = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < branches; i++) {
    const a = rnd() * Math.PI * 2;
    prims.push(arc(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, r * 0.5, a - 0.7, a + 0.7));
  }
  return prims;
}
/**
 * CÂY nhìn từ trên (tán lớn ngoài nhà).
 *
 * 🔴 **VẼ LẠI 06/08.** Bản cũ là 3 vòng tròn đồng tâm + 2 đường thập chia tư = **vòng ngắm súng**,
 * không phải cây. Nay: 3 lớp tán bất đối xứng lồng nhau (hạt giống khác nhau nên không lớp nào
 * lặp lại lớp nào) + gốc cây nhỏ ở tâm. Không đường thập.
 */
function treeTop(): Prim[] {
  const r = 900;
  return [
    canopy(0, 0, r, 13, 0.20, 'tree-outer'),
    canopy(0, 0, r * 0.68, 11, 0.24, 'tree-mid'),
    canopy(0, 0, r * 0.36, 9, 0.28, 'tree-inner'),
    circ(0, 0, r * 0.09), // gốc — chấm nhỏ, đủ để biết tâm cây, không phải tâm ngắm
  ];
}

/* ───────────────────────── XE ───────────────────────── */

/* ── XE ──
 * 🔴 **VẼ LẠI 06/08.** Bản cũ: `carSedan` và `carSuv` là **CÙNG MỘT HÌNH** — cùng `octagon` +
 * cùng 4 đường, chỉ khác vài chục mm kích thước. Đặt cạnh nhau trong thư viện thì không ai phân
 * biệt được, mà đó chính là lý do tồn tại của hai block.
 *
 * Nay phân biệt bằng **DÁNG THẬT**, không chỉ bằng số đo:
 *  · sedan — mũi và đuôi VÁT dài, ca-bin lùi về sau, thân thấp thuôn.
 *  · SUV   — đầu/đuôi CẮT CỤT gần vuông, ca-bin dài phủ gần hết thân, có gờ nóc dọc.
 * Cả hai dùng bo góc bằng cung (xe không có góc nhọn).
 */
function carSedan(): Prim[] {
  const L = 4600, W = 1800;
  const hx = L / 2, hy = W / 2;
  return [
    // thân: mũi (phải) và đuôi (trái) vát dài, hai bên hông thẳng
    { k: 'poly', closed: true, pts: [
      { x: -hx + 260, y: -hy }, { x: hx - 420, y: -hy }, { x: hx - 60, y: -hy + 330 },
      { x: hx, y: 0 }, { x: hx - 60, y: hy - 330 }, { x: hx - 420, y: hy },
      { x: -hx + 260, y: hy }, { x: -hx, y: hy - 300 }, { x: -hx, y: -hy + 300 },
    ] },
    // ca-bin lùi về sau — nét đặc trưng của sedan
    ...roundedRect(-1250, -hy + 190, 2100, W - 380, 240),
    arc(850, 0, 620, -1.0, 1.0),      // kính lái cong
    arc(-1250, 0, 520, Math.PI - 1.0, Math.PI + 1.0), // kính hậu cong
  ];
}
function carSuv(): Prim[] {
  const L = 4700, W = 1950;
  const hx = L / 2, hy = W / 2;
  return [
    // thân: đầu/đuôi gần vuông, chỉ bo nhẹ — dáng hộp của SUV
    ...roundedRect(-hx, -hy, L, W, 260),
    // ca-bin DÀI, phủ gần hết thân
    ...roundedRect(-1750, -hy + 170, 3200, W - 340, 200),
    line(-1750, -hy + 170, -1750, hy - 170), // vách sau ca-bin
    arc(1450, 0, 560, -1.05, 1.05),          // kính lái
    // gờ nóc dọc — chi tiết chỉ SUV có, đủ để phân biệt ngay từ thumbnail
    line(-1500, -hy + 380, 900, -hy + 380),
    line(-1500, hy - 380, 900, hy - 380),
  ];
}

/* ───────────────────────── CẦU THANG ───────────────────────── */

function stairsStraight(): Prim[] {
  const w = 1000, l = 3000, steps = 12;
  const prims: Prim[] = [rect(-w / 2, -l / 2, w, l)];
  for (let i = 1; i < steps; i++) {
    const y = -l / 2 + (i * l) / steps;
    prims.push(line(-w / 2, y, w / 2, y));
  }
  prims.push({ k: 'poly', closed: false, pts: [{ x: -w / 2 + 120, y: -l / 2 + 200 }, { x: 0, y: -l / 2 + 400 }, { x: -w / 2 + 120, y: -l / 2 + 600 }] });
  return prims;
}
function stairsL(): Prim[] {
  const w = 1000;
  const flight1Len = 1400, landing = 1000, flight2Len = 1400;
  const prims: Prim[] = [];
  prims.push(rect(-w / 2, -flight1Len / 2 - landing / 2, w, flight1Len));
  for (let i = 1; i < 6; i++) {
    const y = -flight1Len / 2 - landing / 2 + (i * flight1Len) / 6;
    prims.push(line(-w / 2, y, w / 2, y));
  }
  const landY = flight1Len / 2 - landing / 2;
  prims.push(rect(-w / 2, landY, w + flight2Len, landing));
  prims.push(rect(w / 2 + landing - w, landY + landing, flight2Len - (landing - w), w));
  return prims;
}

/* ───────────────────────── CỘT ───────────────────────── */

function columnSquare(s = 400): Prim[] {
  return [box(s, s), ...hatchX(s * 0.8, s * 0.8)];
}
function columnRound(r = 200): Prim[] {
  return [circ(0, 0, r), line(-r * 0.7, -r * 0.7, r * 0.7, r * 0.7), line(-r * 0.7, r * 0.7, r * 0.7, -r * 0.7)];
}

/* ───────────────────────── KÝ HIỆU ───────────────────────── */

function northArrow(): Prim[] {
  const r = 400;
  return [
    circ(0, 0, r),
    { k: 'poly', closed: true, pts: [{ x: 0, y: r - 40 }, { x: -90, y: -r * 0.3 }, { x: 0, y: -r * 0.1 }, { x: 90, y: -r * 0.3 }] },
  ];
}

/* ───────────────────────── DANH SÁCH TỔNG ───────────────────────── */

const RAW_BLOCKS: LibBlockDef[] = [
  // Phòng khách
  { id: 'living-sofa-2seat', name: 'Sofa 2 chỗ', category: 'phong-khach', w: 1600, h: 850, prims: sofa(1600, 850, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-sofa-3seat', name: 'Sofa 3 chỗ', category: 'phong-khach', w: 2100, h: 850, prims: sofa(2100, 850, 3), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-sofa-lshape', name: 'Sofa góc chữ L', category: 'phong-khach', w: 2600, h: 1700, prims: sofaL(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-armchair', name: 'Ghế bành', category: 'phong-khach', w: 800, h: 800, prims: armchair(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-coffee-table', name: 'Bàn trà', category: 'phong-khach', w: 1200, h: 600, prims: coffeeTable(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-tv-console', name: 'Kệ TV', category: 'phong-khach', w: 1600, h: 400, prims: tvConsole(), source: SRC_SELF, license: LIC_SELF },
  { id: 'living-bookshelf', name: 'Kệ sách', category: 'phong-khach', w: 900, h: 350, prims: bookshelf(), source: SRC_SELF, license: LIC_SELF },

  // Phòng ăn
  { id: 'dining-table-4', name: 'Bàn ăn 4 ghế', category: 'phong-an', w: 1200, h: 1760, prims: diningTableRect(4), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-table-6', name: 'Bàn ăn 6 ghế', category: 'phong-an', w: 1800, h: 1860, prims: diningTableRect(6), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-table-round-4', name: 'Bàn tròn 4 ghế', category: 'phong-an', w: 1780, h: 1780, prims: diningTableRound(4), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-bar-stool', name: 'Ghế bar', category: 'phong-an', w: 350, h: 350, prims: barStool(), source: SRC_SELF, license: LIC_SELF },
  { id: 'dining-sideboard', name: 'Tủ búp phê', category: 'phong-an', w: 1600, h: 450, prims: sideboard(), source: SRC_SELF, license: LIC_SELF },

  // Phòng ngủ
  { id: 'bed-single', name: 'Giường đơn (1m)', category: 'phong-ngu', w: 1000, h: 2000, prims: bed(1000, 2000, 1), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-double', name: 'Giường đôi (1m4)', category: 'phong-ngu', w: 1400, h: 2000, prims: bed(1400, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-queen', name: 'Giường Queen (1m6)', category: 'phong-ngu', w: 1600, h: 2000, prims: bed(1600, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bed-king', name: 'Giường King (1m8)', category: 'phong-ngu', w: 1800, h: 2000, prims: bed(1800, 2000, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-nightstand', name: 'Táp đầu giường', category: 'phong-ngu', w: 450, h: 400, prims: nightstand(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-wardrobe-2door', name: 'Tủ áo 2 cánh', category: 'phong-ngu', w: 1200, h: 600, prims: wardrobe(1200, 2), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-wardrobe-3door', name: 'Tủ áo 3 cánh', category: 'phong-ngu', w: 1800, h: 600, prims: wardrobe(1800, 3), source: SRC_SELF, license: LIC_SELF },
  { id: 'bedroom-dresser', name: 'Tủ ngăn kéo', category: 'phong-ngu', w: 1000, h: 500, prims: dresser(), source: SRC_SELF, license: LIC_SELF },

  // Bếp
  { id: 'kitchen-sink', name: 'Bồn rửa đơn', category: 'bep', w: 600, h: 500, prims: sinkSingle(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-stove-4', name: 'Bếp 4 vòng', category: 'bep', w: 600, h: 600, prims: stove4(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-fridge', name: 'Tủ lạnh', category: 'bep', w: 700, h: 700, prims: fridge(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-island', name: 'Đảo bếp', category: 'bep', w: 2000, h: 900, prims: kitchenIsland(), source: SRC_SELF, license: LIC_SELF },
  { id: 'kitchen-cabinet-l', name: 'Tủ bếp chữ L', category: 'bep', w: 3000, h: 2100, prims: cabinetRunL(), source: SRC_SELF, license: LIC_SELF },

  // Vệ sinh
  { id: 'bath-toilet', name: 'Bồn cầu', category: 've-sinh', w: 400, h: 620, prims: toilet(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-bidet', name: 'Bồn tiểu nữ (bidet)', category: 've-sinh', w: 320, h: 480, prims: bidet(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-lavabo', name: 'Lavabo', category: 've-sinh', w: 600, h: 460, prims: lavabo(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-bathtub', name: 'Bồn tắm', category: 've-sinh', w: 1700, h: 750, prims: bathtub(), source: SRC_SELF, license: LIC_SELF },
  { id: 'bath-shower', name: 'Vòi sen (phòng tắm đứng)', category: 've-sinh', w: 900, h: 900, prims: showerStall(), source: SRC_SELF, license: LIC_SELF },

  // Cửa & cửa sổ
  { id: 'arch-door-single', name: 'Cửa đi 1 cánh', category: 'cua', w: 900, h: 900, prims: doorSwing(900), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-door-double', name: 'Cửa đi 2 cánh', category: 'cua', w: 1500, h: 750, prims: doorDouble(1500), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-door-sliding', name: 'Cửa lùa', category: 'cua', w: 1800, h: 200, prims: doorSliding(1800), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-single', name: 'Cửa sổ đơn', category: 'cua', w: 1200, h: 100, prims: windowN(1200), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-double', name: 'Cửa sổ đôi', category: 'cua', w: 1800, h: 100, prims: windowDouble(1800), source: SRC_SELF, license: LIC_SELF },
  { id: 'arch-window-bay', name: 'Cửa sổ vòm góc', category: 'cua', w: 1400, h: 300, prims: windowBay(), source: SRC_SELF, license: LIC_SELF },

  // Cây cảnh
  { id: 'plant-pot-small', name: 'Chậu cây nhỏ', category: 'cay-canh', w: 400, h: 400, prims: pottedPlant(200, 5), source: SRC_SELF, license: LIC_SELF },
  { id: 'plant-pot-large', name: 'Chậu cây lớn', category: 'cay-canh', w: 700, h: 700, prims: pottedPlant(350, 7), source: SRC_SELF, license: LIC_SELF },
  { id: 'plant-tree-top', name: 'Cây (nhìn từ trên)', category: 'cay-canh', w: 1800, h: 1800, prims: treeTop(), source: SRC_SELF, license: LIC_SELF },

  // Xe
  { id: 'vehicle-car-sedan', name: 'Xe sedan', category: 'xe', w: 4500, h: 1800, prims: carSedan(), source: SRC_SELF, license: LIC_SELF },
  { id: 'vehicle-car-suv', name: 'Xe SUV', category: 'xe', w: 4700, h: 1950, prims: carSuv(), source: SRC_SELF, license: LIC_SELF },

  // Cầu thang
  { id: 'stairs-straight', name: 'Thang thẳng', category: 'cau-thang', w: 1000, h: 3000, prims: stairsStraight(), source: SRC_SELF, license: LIC_SELF },
  { id: 'stairs-l-shape', name: 'Thang chữ L', category: 'cau-thang', w: 2400, h: 2400, prims: stairsL(), source: SRC_SELF, license: LIC_SELF },

  // Cột
  { id: 'column-square', name: 'Cột vuông', category: 'cot', w: 400, h: 400, prims: columnSquare(400), source: SRC_SELF, license: LIC_SELF },
  { id: 'column-round', name: 'Cột tròn', category: 'cot', w: 400, h: 400, prims: columnRound(200), source: SRC_SELF, license: LIC_SELF },

  // Ký hiệu
  { id: 'symbol-north', name: 'Ký hiệu hướng Bắc', category: 'ky-hieu', w: 800, h: 800, prims: northArrow(), source: SRC_SELF, license: LIC_SELF },
];

/* ═════════════════ CHỐT KÍCH THƯỚC — thêm 06/08, VIỆC 4 ═════════════════
 *
 * 🔴 **LỖI ĐO ĐƯỢC 06/08:** `w`/`h` khai tay trong mảng trên **KHÔNG khớp hình thật** ở 4 block —
 * `living-sofa-lshape` khai cao 1700 nhưng hình thật cao **2150** · `stairs-l-shape` khai 2400
 * nhưng thật **3400** · `bath-bidet` 480/510 · `arch-window-bay` 300/360. Hai số đó đi THẲNG vào
 * `manifest.json` và là kích thước mà panel Thư viện hiển thị cho người dùng ⇒ thư viện đang nói
 * sai số đo. §0f TB1: *"Sai một con số thì mọi thứ phía sau vô nghĩa"*.
 *
 * ⇒ `LIB_BLOCKS` nay **ĐO LẠI từ chính `prims`**, số khai tay chỉ còn là ý định thiết kế. Block
 * thêm về sau tự đúng, không phải nhớ cập nhật hai chỗ.
 *
 * (Sửa ở ĐÂY chứ không sửa `generate-library.ts` — phiếu cho phép sửa generator ĐÚNG MỘT chỗ là
 * viewBox, không hơn.)
 */
function measurePrims(prims: Prim[]): { w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (p: Pt) => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  };
  for (const p of prims) {
    if (p.k === 'line') { grow(p.a); grow(p.b); }
    else if (p.k === 'poly') p.pts.forEach(grow);
    else if (p.k === 'circle') { grow({ x: p.c.x - p.r, y: p.c.y - p.r }); grow({ x: p.c.x + p.r, y: p.c.y + p.r }); }
    else if (p.k === 'arc') {
      // lấy đúng các điểm generator sẽ vẽ (sampleArc n=16) — bao khít nét thật
      for (let i = 0; i <= 16; i++) {
        const a = p.a1 + ((p.a2 - p.a1) * i) / 16;
        grow({ x: p.c.x + p.r * Math.cos(a), y: p.c.y + p.r * Math.sin(a) });
      }
    }
  }
  if (!Number.isFinite(minX)) return { w: 0, h: 0 };
  return { w: Math.round(maxX - minX), h: Math.round(maxY - minY) };
}

export const LIB_BLOCKS: LibBlockDef[] = RAW_BLOCKS.map((b) => ({ ...b, ...measurePrims(b.prims) }));
