/**
 * lib/cad/plan-leader.ts — LEADER LINE ĐÚNG CHUẨN (VIỆC 2, phiên S4).
 *
 * ▸ NGUỒN: `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` mục 5 (ảnh `C1`) + **ISO 128-22**.
 *   Nguyên văn công thức:
 *     · nét **mảnh nhất** trong bản vẽ
 *     · nghiêng **30–60°**, **KHÔNG mũi tên**
 *     · nhãn **CHỮ HOA cỡ nhỏ, letter-spacing rộng**, đặt ở **cuối dây**
 *     · landing = **20 × độ dày nét** · chữ cách nét = **2 × độ dày nét**
 *     · nhiều leader giữ **CÙNG MỘT TẬP GÓC**, ⛔ **cấm cắt nhau**
 *
 * ▸ "Đây là hình học có quy luật ⇒ **sinh bằng hàm, cấm gõ tay toạ độ**." Toàn bộ file không có
 *   một hằng số toạ độ nào; mọi điểm suy ra từ `anchor` + góc + bề dày nét + tỉ lệ in.
 *   Phép thử §0f TB4: đổi `lineWidthMm` hoặc `scaleN` thì landing/khoảng cách chữ tự đúng lại.
 *
 * ▸ ĐƠN VỊ — cùng quy ước `titleBlockPro()` (`lib/cad/commands.ts:347`): tham số cỡ khai bằng
 *   **mm-GIẤY**, nhân `scaleN` (tỉ lệ 1:N) để ra **mm-WORLD**. Nhầm hai đơn vị này là lỗi kinh
 *   điển của bản vẽ tỉ lệ — `model.ts:31` đã ghi rõ, không lặp lại.
 *
 * ▸ ⚠️ **LETTER-SPACING — KHAI THẬT GIỚI HẠN (N5).** `TextEntity` (`model.ts:360`) **không có**
 *   trường letter-spacing, và renderer (`lib/cad/render.ts`) vẽ chữ bằng `ctx.fillText` thẳng.
 *   Thêm field mới vào `Doc` cho một hiệu ứng trình bày là **vi phạm K4** ("field mới chỉ thêm
 *   khi ĐÃ CÓ nơi tiêu thụ" — mà PDF/DXF export đều chưa đọc được nó). Nên ở đây giãn chữ bằng
 *   cách **chèn U+2009 THIN SPACE giữa các ký tự** (`letterSpaced()`).
 *   ĐÁNH ĐỔI, ghi rõ chứ không giấu: chuỗi nhãn sinh ra **không tìm kiếm/sửa lại được như chuỗi
 *   gốc**. Vì thế `LeaderPlacement` LUÔN giữ `label` GỐC bên cạnh `labelDisplay` đã giãn — nơi
 *   nào cần chuỗi thật (tìm kiếm, BOQ, xuất bảng) thì đọc `label`.
 *
 * Hàm THUẦN. Test: `node_modules/.bin/sucrase-node lib/cad/plan-leader.test.ts`
 */

import type { Entity, Pt } from './model';

/* ═══════════════════════ 0 · THAM SỐ ═══════════════════════ */

export interface LeaderStyle {
  /** bề dày nét (mm-GIẤY). Phải là nét MẢNH NHẤT của bản vẽ — ISO 128-22. */
  lineWidthMm: number;
  /** cao chữ nhãn (mm-GIẤY). ISO 3098 nhỏ nhất đọc được khi in là 2.5. */
  textHeightMm: number;
  /** tỉ lệ in 1:N — mm-giấy × N = mm-world. */
  scaleN: number;
  /**
   * TẬP GÓC dùng chung cho MỌI leader trong một bản vẽ (độ). Nguồn `C1` + ISO 128-22: 30–60°.
   * Giữ chung một tập là lý do các leader trông "cùng một hệ" chứ không loạn.
   */
  anglesDeg: number[];
  /** hệ số landing: landing = `landingFactor` × độ dày nét. Nguồn ghi 20. */
  landingFactor: number;
  /** hệ số khoảng cách chữ: gap = `textGapFactor` × độ dày nét. Nguồn ghi 2. */
  textGapFactor: number;
  /** chiều dài đoạn nghiêng (mm-GIẤY) — thử lần lượt cho tới khi không cắt ai. */
  slantLenMm: number[];
  /** true = viết HOA + giãn chữ (đúng `C1`). */
  uppercase: boolean;
  /** số lần lặp ký tự giãn cách — 1 = một thin space giữa mỗi ký tự. */
  letterSpacing: number;
}

export const DEFAULT_LEADER_STYLE: LeaderStyle = {
  lineWidthMm: 0.18,
  textHeightMm: 2.5,
  scaleN: 100,
  anglesDeg: [30, 45, 60],
  landingFactor: 20,
  textGapFactor: 2,
  slantLenMm: [12, 18, 26, 36],
  uppercase: true,
  letterSpacing: 1,
};

/** Điểm cần chỉ tới + nhãn. `id` để truy ngược về entity được chú thích (không bắt buộc). */
export interface LeaderRequest {
  at: Pt;
  label: string;
  id?: string;
}

export interface LeaderPlacement {
  id?: string;
  /** chuỗi GỐC — dùng cho tìm kiếm/bảng/BOQ. */
  label: string;
  /** chuỗi ĐỂ VẼ (đã hoa + giãn). Xem cảnh báo letter-spacing ở đầu file. */
  labelDisplay: string;
  /** điểm chỉ — KHÔNG có mũi tên ở đây (đúng `C1`/ISO 128-22). */
  anchor: Pt;
  /** chỗ gãy giữa đoạn nghiêng và landing. */
  knee: Pt;
  /** cuối landing — chữ bắt đầu từ đây + gap. */
  landingEnd: Pt;
  /** gốc chữ. */
  textAt: Pt;
  angleDeg: number;
  /** hướng landing: +1 = sang phải, −1 = sang trái. Chữ căn theo hướng này. */
  dir: 1 | -1;
}

export interface LeaderLayout {
  placed: LeaderPlacement[];
  /**
   * Những nhãn KHÔNG đặt được mà không cắt leader khác. **Không đặt bừa** — trả ra để UI báo
   * người dùng tự dời (N5: khai thật cái chưa xong, thà thiếu còn hơn vẽ sai chuẩn).
   */
  unplaced: { request: LeaderRequest; why: string }[];
}

/* ═══════════════════════ 1 · CHỮ ═══════════════════════ */

const THIN_SPACE = ' ';

/** Giãn chữ bằng thin space. Xem đánh đổi ở đầu file. `n<=0` ⇒ trả nguyên chuỗi. */
export function letterSpaced(s: string, n = 1): string {
  if (n <= 0) return s;
  const pad = THIN_SPACE.repeat(n);
  return s.split('').join(pad);
}

/* ═══════════════════════ 2 · HÌNH HỌC ═══════════════════════ */

const orient = (a: Pt, b: Pt, c: Pt): number => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const onSeg = (a: Pt, b: Pt, p: Pt): boolean =>
  Math.min(a.x, b.x) - 1e-9 <= p.x && p.x <= Math.max(a.x, b.x) + 1e-9 &&
  Math.min(a.y, b.y) - 1e-9 <= p.y && p.y <= Math.max(a.y, b.y) + 1e-9;

/** Hai đoạn thẳng có cắt nhau không (kể cả chạm). Chuẩn, không xấp xỉ. */
export function segmentsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (Math.abs(d1) < 1e-9 && onSeg(p3, p4, p1)) return true;
  if (Math.abs(d2) < 1e-9 && onSeg(p3, p4, p2)) return true;
  if (Math.abs(d3) < 1e-9 && onSeg(p1, p2, p3)) return true;
  if (Math.abs(d4) < 1e-9 && onSeg(p1, p2, p4)) return true;
  return false;
}

/**
 * Ước lượng bề rộng chuỗi trên GIẤY (mm). Chép hệ số của `estTextWidthMm`
 * (`lib/cad/commands.ts:327` — hàm đó `private`, và `commands.ts` nằm NGOÀI vùng phiên này nên
 * không export ra được). Hệ số 0.62 (toàn hoa) / 0.52 (hỗn hợp) đã đo thật bằng
 * `jsPDF.getTextWidth`, xem docstring bản gốc. Giữ CÙNG SỐ để hai chỗ không lệch nhau.
 *
 * ⚠️ Đếm cả THIN SPACE của `letterSpaced()` — nhãn giãn chữ rộng gần gấp đôi nhãn thường, không
 * trừ hao thì leader hướng TRÁI sẽ đè chữ lên dây.
 */
function estTextWidthMm(text: string, hMm: number): number {
  const allCaps = text === text.toUpperCase();
  return text.length * (allCaps ? 0.62 : 0.52) * hMm;
}

/** Một leader là đường gấp 2 đoạn: anchor→knee→landingEnd. */
const legs = (p: LeaderPlacement): [Pt, Pt][] => [[p.anchor, p.knee], [p.knee, p.landingEnd]];

function crosses(a: LeaderPlacement, b: LeaderPlacement): boolean {
  for (const [a1, a2] of legs(a)) {
    for (const [b1, b2] of legs(b)) {
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

/** Dựng một phương án đặt (chưa kiểm cắt). Mọi số suy từ style — không hằng số toạ độ. */
function build(
  req: LeaderRequest,
  angleDeg: number,
  dirX: 1 | -1,
  dirY: 1 | -1,
  slantMm: number,
  st: LeaderStyle,
): LeaderPlacement {
  const k = st.scaleN;                       // mm-giấy → mm-world
  const rad = (angleDeg * Math.PI) / 180;
  const slant = slantMm * k;
  const knee: Pt = {
    x: req.at.x + Math.cos(rad) * slant * dirX,
    y: req.at.y + Math.sin(rad) * slant * dirY,
  };
  const landing = st.landingFactor * st.lineWidthMm * k;
  const landingEnd: Pt = { x: knee.x + landing * dirX, y: knee.y };
  const gap = st.textGapFactor * st.lineWidthMm * k;
  const raw = st.uppercase ? req.label.toUpperCase() : req.label;
  const display = letterSpaced(raw, st.letterSpacing);
  // Renderer vẽ text CĂN TRÁI, baseline 'bottom' (`lib/cad/render.ts` case 'text'). Hai hệ quả:
  //  · leader hướng TRÁI ⇒ phải lùi gốc chữ đúng bề rộng chuỗi, không thì chữ chạy đè lên dây.
  //  · baseline 'bottom' ⇒ đặt y = landingEnd.y + gap là chữ NGỒI TRÊN landing, cách đúng 2× nét.
  const textW = estTextWidthMm(display, st.textHeightMm) * k;
  const textX = dirX > 0 ? landingEnd.x + gap : landingEnd.x - gap - textW;
  return {
    id: req.id,
    label: req.label,
    labelDisplay: display,
    anchor: req.at,
    knee,
    landingEnd,
    // chữ đặt ở CUỐI DÂY, cách nét đúng `textGapFactor` × bề dày nét
    textAt: { x: textX, y: landingEnd.y + gap },
    angleDeg,
    dir: dirX,
  };
}

/**
 * ĐẶT LEADER TỰ ĐỘNG, ĐẢM BẢO KHÔNG CẮT NHAU.
 *
 * Cách làm: xếp yêu cầu theo vị trí (trái→phải, dưới→lên) cho thứ tự ổn định (§0e KS2 — cùng đầu
 * vào ra cùng kết quả), rồi tham lam: mỗi leader thử lần lượt các phương án theo thứ tự ưu tiên
 * (hướng RA XA tâm đám trước — đó là hướng có chỗ trống), lấy phương án đầu tiên không cắt
 * leader nào đã đặt. Không phương án nào sạch ⇒ **KHÔNG đặt**, đẩy sang `unplaced` kèm lý do.
 *
 * Độ phức tạp O(n² × |phương án|). Số leader trên một bản vẽ là hàng chục, không phải hàng vạn.
 */
export function autoPlaceLeaders(
  requests: LeaderRequest[],
  style: Partial<LeaderStyle> = {},
): LeaderLayout {
  const st: LeaderStyle = { ...DEFAULT_LEADER_STYLE, ...style };
  if (!requests.length) return { placed: [], unplaced: [] };

  // tâm đám điểm — dùng để chọn hướng "ra ngoài"
  const cx = requests.reduce((s, r) => s + r.at.x, 0) / requests.length;
  const cy = requests.reduce((s, r) => s + r.at.y, 0) / requests.length;

  const ordered = [...requests].sort((a, b) => (a.at.x - b.at.x) || (a.at.y - b.at.y));

  const placed: LeaderPlacement[] = [];
  const unplaced: LeaderLayout['unplaced'] = [];

  for (const req of ordered) {
    // ưu tiên hướng ra xa tâm; nếu trùng tâm thì mặc định phải-trên
    const outX: 1 | -1 = req.at.x >= cx ? 1 : -1;
    const outY: 1 | -1 = req.at.y >= cy ? 1 : -1;
    const dirs: [1 | -1, 1 | -1][] = [
      [outX, outY],
      [outX, (-outY) as 1 | -1],
      [(-outX) as 1 | -1, outY],
      [(-outX) as 1 | -1, (-outY) as 1 | -1],
    ];

    let chosen: LeaderPlacement | null = null;
    // thử độ dài NGẮN trước (dây càng ngắn càng gọn), trong mỗi độ dài thử đủ hướng × đủ góc
    outer:
    for (const slant of st.slantLenMm) {
      for (const [dx, dy] of dirs) {
        for (const ang of st.anglesDeg) {
          const cand = build(req, ang, dx, dy, slant, st);
          if (placed.some((p) => crosses(cand, p))) continue;
          chosen = cand;
          break outer;
        }
      }
    }

    if (chosen) placed.push(chosen);
    else {
      unplaced.push({
        request: req,
        why: `Không còn hướng nào trong tập góc ${st.anglesDeg.join('/')}° đặt được mà không cắt ${placed.length} leader đã có. Dời điểm chỉ hoặc nới tập góc.`,
      });
    }
  }

  return { placed, unplaced };
}

/* ═══════════════════════ 3 · RA ENTITY ═══════════════════════ */

/**
 * Khoá ổn định của một leader — dùng làm `CheckpointItem.id` (KS3: người tick gì ghi nấy).
 * Ưu tiên id của entity được chú thích; không có thì lùi về chỉ số trong mảng.
 */
export const leaderKey = (p: LeaderPlacement, i: number): string => p.id ?? `#${i}`;

export interface LeadersToEntitiesOptions {
  layer?: string;
  textLayer?: string;
  style?: Partial<LeaderStyle>;
  color?: string;
  idPrefix?: string;
  /**
   * CHỈ sinh entity cho những khoá này (`leaderKey`). `undefined` = lấy hết.
   * Có mặt để checkpoint §0e KS3 ghi ĐÚNG phần người dùng đã tick — không có đường "ghi cả mẻ".
   */
  only?: string[];
}

/**
 * Leader → entity thường (line + text). **KHÔNG sinh mũi tên** — đúng `C1`/ISO 128-22.
 * Bề dày ghi thẳng vào `lineweight` của entity (mm-giấy) nên PDF/DXF export ăn theo đúng nét mảnh.
 */
export function leadersToEntities(
  layout: LeaderLayout,
  opts: LeadersToEntitiesOptions = {},
): Entity[] {
  const st: LeaderStyle = { ...DEFAULT_LEADER_STYLE, ...opts.style };
  const layer = opts.layer ?? 'l-text';
  const textLayer = opts.textLayer ?? layer;
  const pre = opts.idPrefix ?? 'ld';
  const keep = opts.only ? new Set(opts.only) : null;
  const out: Entity[] = [];

  layout.placed.forEach((p, i) => {
    if (keep && !keep.has(leaderKey(p, i))) return;
    const base = { layer, lineweight: st.lineWidthMm, ...(opts.color ? { color: opts.color } : {}) };
    out.push({ id: `${pre}-slant-${i}`, type: 'line', ...base, a: p.anchor, b: p.knee } as Entity);
    out.push({ id: `${pre}-land-${i}`, type: 'line', ...base, a: p.knee, b: p.landingEnd } as Entity);
    out.push({
      id: `${pre}-text-${i}`, type: 'text', layer: textLayer,
      ...(opts.color ? { color: opts.color } : {}),
      at: p.textAt, text: p.labelDisplay, h: st.textHeightMm * st.scaleN,
    } as Entity);
  });

  return out;
}

/**
 * HẠT GIỐNG TÁI LẬP (§0e KS2) — băm từ ĐÚNG những gì quyết định kết quả: tập điểm chỉ + nhãn +
 * tỉ lệ + tập góc. Cùng đầu vào ⇒ cùng số ⇒ cùng bố cục leader. Hiện ra UI để người dùng chép lại.
 *
 * ⚠️ KHÔNG phải nguồn ngẫu nhiên: `autoPlaceLeaders()` tất định hoàn toàn (không `Math.random()`).
 * Seed ở đây là **dấu vân tay của đầu vào**, để đối chiếu "chạy lại có ra như cũ không".
 */
export function leaderSeed(requests: LeaderRequest[], style: Partial<LeaderStyle> = {}): number {
  const st = { ...DEFAULT_LEADER_STYLE, ...style };
  const s = [...requests]
    .map((r) => `${r.label}@${Math.round(r.at.x)},${Math.round(r.at.y)}`)
    .sort()
    .join(';') + `|${st.scaleN}|${st.anglesDeg.join(',')}|${st.lineWidthMm}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
