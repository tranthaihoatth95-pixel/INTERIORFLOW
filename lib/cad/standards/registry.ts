/**
 * lib/cad/standards/registry.ts — BỘ NHỚ QUY CHUẨN (Nấc bổ sung, xen giữa Nấc LT theo yêu cầu
 * user 2026-07-11). Kiến trúc DATA-DRIVEN: mỗi quy chuẩn là 1 `StandardRule` (dữ liệu thuần,
 * không phải code) gom trong các file `vn-residential.ts` / `vn-fire.ts` / `intl-egress.ts` /
 * `iso-drafting.ts`. Thêm quy chuẩn MỚI = thêm 1 object vào 1 trong các file đó (hoặc file mới,
 * tự đăng ký vào ALL_GROUPS bên dưới) — KHÔNG cần sửa checker.ts hay bất kỳ code xử lý nào.
 *
 * NGUYÊN TẮC SỐ LIỆU (quan trọng — đọc trước khi thêm rule):
 *   - `verified: true` CHỈ khi đã tra cứu được số liệu từ nguồn có thể kiểm chứng (search web,
 *     văn bản pháp luật, tiêu chuẩn gốc) — ghi rõ nguồn trong `source`.
 *   - `verified: false` khi số liệu lấy từ trí nhớ chung / suy đoán hợp lý / chưa tra được bản
 *     gốc — PHẢI có `note` giải thích "cần kiểm chứng với bản gốc quy chuẩn X trước khi dùng
 *     cho hồ sơ chính thức". TUYỆT ĐỐI không bịa số rồi gắn mác quy chuẩn như thật.
 *   - Panel "Kiểm chuẩn" hiển thị rõ verified/chưa verified cho user tự cân nhắc — checker CHỈ
 *     đọc và đề xuất, KHÔNG BAO GIỜ tự sửa bản vẽ (điều khoản hiến pháp của hệ sinh thái).
 *
 * Cơ chế "ghi nhớ tự động": registry nạp toàn bộ rule tĩnh (built-in) TRỘN với rule tuỳ biến
 * user tự thêm (lưu localStorage key CUSTOM_RULES_KEY, qua addCustomRule/removeCustomRule).
 * localStorage chỉ truy cập trong hàm gọi từ client ('use client' component) — module này
 * THUẦN (an toàn SSR), không tự đọc localStorage ở module scope.
 */

export type StandardCategory =
  | 'room-size'
  | 'clearance'
  | 'door-window'
  | 'egress'
  | 'corridor-stair'
  | 'drafting'
  | 'other';

export type Severity = 'error' | 'warning' | 'info';

/**
 * Vùng/hệ quy chuẩn áp dụng của 1 rule. Cho phép UI lọc bộ quy chuẩn theo dự án (VN dùng
 * TCVN/QCVN, dự án tham chiếu Mỹ dùng NFPA/IBC…). 'INTL' = tham số nhân trắc/không gian phổ
 * quát (Neufert) không gắn 1 quốc gia cụ thể — dùng chung, tinh chỉnh theo địa phương.
 */
export type StandardRegion = 'VN' | 'US' | 'EU' | 'INTL';

/**
 * Tính chất ràng buộc của 1 trị số:
 *   - 'mandatory'  : trị số BẮT BUỘC theo văn bản pháp quy/quy chuẩn (VD chiều rộng thoát nạn
 *                    QCVN 06) — vi phạm là không đạt, không được tự điều chỉnh.
 *   - 'adjustable' : trị số nhân trắc/tiện dụng KHUYẾN NGHỊ (VD lối đi bếp Neufert) — thiết kế
 *                    có thể chỉnh theo bối cảnh/địa phương, dưới ngưỡng chỉ là cảnh báo tiện nghi.
 *   - 'advisory'   : chỉ mang tính tham khảo/thực hành tốt, không có ngưỡng cứng.
 * Neufert khác nhau theo quốc gia chính là ở chỗ CÙNG một thông số có thể là 'mandatory' ở nước
 * này (đưa vào luật xây dựng) nhưng 'adjustable' ở nước khác — field này ghi rõ để không áp cứng.
 */
export type RuleBinding = 'mandatory' | 'adjustable' | 'advisory';

/** P-B (16/08) — trục NGUỒN + NGUYÊN VĂN điều khoản, tách file vì nói về XUẤT XỨ chứ không
 * phải phép đo. Cả hai trường TUỲ CHỌN ⇒ 12 bộ luật ngành sẵn có chạy y nguyên, không migrate.
 * Ba rào an toàn pháp lý ghi ở đầu `./types.ts` — đọc trước khi đụng `nguyenVan`. */
import type { RuleSourceMeta } from './types';
export type { LoaiNguon, RuleSourceMeta } from './types';

export interface StandardRule extends RuleSourceMeta {
  /** slug duy nhất toàn cục, VD 'vn-res-bedroom-min-area'. Trùng id ⇒ rule sau ghi đè rule trước
   * (dùng để user override 1 rule built-in bằng rule tuỳ biến cùng id nếu muốn). */
  id: string;
  /** Nguồn trích dẫn — TÊN VĂN BẢN + điều khoản nếu biết, VD "TCVN 4451:2012 §2.3.4". */
  source: string;
  category: StandardCategory;
  severity: Severity;
  /** Mô tả tiếng Việt, hiển thị trực tiếp trong panel Kiểm chuẩn. */
  description: string;
  /** Tham số số — mỗi rule tự định nghĩa field nào dùng (mm hoặc m², xem checker.ts). Quy ước
   * cho field boolean-như (VD gross/net area basis): dùng số 1/0 thay vì string, để giữ toàn bộ
   * params thuần number (đơn giản hoá mọi phép so sánh `<`/`>` trong checker.ts) — ý nghĩa
   * gross/net ghi rõ bằng lời trong `description`/`note` của rule (xem intl-occupant-load.ts,
   * field `areaBasisGross`: 1 = gross, 0 = net). */
  params: Record<string, number>;
  verified: boolean;
  /** Bắt buộc có nội dung khi verified=false — lý do chưa chắc + cần đối chiếu gì. */
  note?: string;
  /** Vùng/hệ quy chuẩn áp dụng (tuỳ chọn — rule cũ không đặt = áp dụng chung). */
  region?: StandardRegion;
  /** Ràng buộc bắt buộc/tuỳ chỉnh (tuỳ chọn — rule cũ không đặt, coi như suy ra từ severity). */
  binding?: RuleBinding;
  /**
   * T2 (2026-08-05) — NGÀY BẮT ĐẦU HIỆU LỰC của trị số này, ISO `'YYYY-MM-DD'`. Tuỳ chọn: rule
   * KHÔNG đặt = áp dụng cho mọi mốc thời gian (hành vi cũ nguyên vẹn).
   *
   * Vì sao cần: quy chuẩn VN có ĐIỀU KHOẢN CHUYỂN TIẾP. QCVN 10:2024/BXD (Thông tư 06/2024/TT-BXD)
   * hiệu lực 01/02/2025, nhưng dự án đã thẩm định TRƯỚC mốc đó vẫn nghiệm thu theo QCVN 10:2014.
   * ⇒ hai dự án mở cùng lúc trong app phải được kiểm bằng HAI bộ số khác nhau, và bộ nào đúng
   * phụ thuộc ngày mốc CỦA DỰ ÁN — không phải ngày hôm nay. Đó là lý do `resolveRulesAsOf()`
   * bên dưới nhận ngày từ caller và TUYỆT ĐỐI không gọi `Date.now()`: lấy ngày hệ thống là kiểm
   * sai bộ số cho mọi hồ sơ cũ, âm thầm, không ai thấy.
   */
  effectiveFrom?: string;
  /**
   * T2 (2026-08-05) — `id` của rule THAY THẾ rule này. Tuỳ chọn; đặt trên rule CŨ, trỏ tới rule
   * MỚI (rule mới nên có `effectiveFrom`). Rule cũ ngừng áp dụng KỂ TỪ ngày rule mới có hiệu lực,
   * còn trước ngày đó thì rule cũ vẫn là bộ số đúng — chính là điều khoản chuyển tiếp.
   * Trỏ tới id không tồn tại ⇒ bỏ qua (rule cũ giữ nguyên hiệu lực), không throw: registry trộn
   * cả rule tuỳ biến của user, không đảm bảo toàn vẹn tham chiếu.
   */
  supersededBy?: string;
}

export interface RuleGroup {
  id: string;
  name: string;
  rules: StandardRule[];
}

const CUSTOM_RULES_KEY = 'interiorflow.cad.standards.customRules.v1';

/** Đọc rule tuỳ biến user đã lưu (client-only — gọi trong component/hàm chạy ở browser). */
export function loadCustomRules(): StandardRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_RULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomRules(rules: StandardRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(rules));
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua an toàn, không throw */
  }
}

export function addCustomRule(rule: StandardRule): StandardRule[] {
  const cur = loadCustomRules().filter((r) => r.id !== rule.id);
  const next = [...cur, rule];
  saveCustomRules(next);
  return next;
}

export function removeCustomRule(id: string): StandardRule[] {
  const next = loadCustomRules().filter((r) => r.id !== id);
  saveCustomRules(next);
  return next;
}

/** Đăng ký các nhóm rule TĨNH (built-in). Import các file rule mới vào đây để "ghi nhớ tự động"
 * — registry tự nạp hết khi mở app, không cần đụng checker.ts hay UI. */
import { VN_RESIDENTIAL } from './vn-residential';
import { VN_FIRE } from './vn-fire';
import { INTL_EGRESS } from './intl-egress';
import { ISO_DRAFTING } from './iso-drafting';
import { NEUFERT } from './neufert';
import { VN_ACCESSIBILITY } from './vn-accessibility';
import { VN_LIGHTING } from './vn-lighting';
import { INTL_OCCUPANT_LOAD } from './intl-occupant-load';
import { VN_ELECTRICAL } from './vn-electrical';

export const BUILTIN_GROUPS: RuleGroup[] = [VN_RESIDENTIAL, VN_FIRE, INTL_EGRESS, ISO_DRAFTING, NEUFERT, VN_ACCESSIBILITY, VN_LIGHTING, INTL_OCCUPANT_LOAD, VN_ELECTRICAL];

/** Toàn bộ rule (built-in + tuỳ biến), trùng id thì rule tuỳ biến (thêm sau) ghi đè. */
export function getAllRules(): StandardRule[] {
  const map = new Map<string, StandardRule>();
  for (const g of BUILTIN_GROUPS) for (const r of g.rules) map.set(r.id, r);
  for (const r of loadCustomRules()) map.set(r.id, r);
  return Array.from(map.values());
}

export function getRulesByCategory(cat: StandardCategory): StandardRule[] {
  return getAllRules().filter((r) => r.category === cat);
}

/** Lọc rule theo vùng/hệ quy chuẩn. Rule KHÔNG đặt `region` (rule chung, VD ISO drafting) luôn
 * được trả về cùng mọi vùng — chúng áp dụng bất kể dự án tham chiếu hệ nào. */
export function getRulesByRegion(region: StandardRegion): StandardRule[] {
  return getAllRules().filter((r) => r.region === undefined || r.region === region);
}

/** Chỉ lấy rule mang tính BẮT BUỘC (mandatory) — dùng khi cần bộ tối thiểu pháp lý cho hồ sơ. */
export function getMandatoryRules(region?: StandardRegion): StandardRule[] {
  const base = region ? getRulesByRegion(region) : getAllRules();
  return base.filter((r) => r.binding === 'mandatory');
}

/* ────────────────────────────────────────────────────────────────────────────────────────────
 * T2 (2026-08-05) — CHIỀU THỜI GIAN: chọn bộ rule đúng theo NGÀY MỐC CỦA DỰ ÁN.
 * Xem doc-comment `effectiveFrom`/`supersededBy` ở `StandardRule` phía trên để biết vì sao.
 * ──────────────────────────────────────────────────────────────────────────────────────────── */

export interface ResolvedRuleSet {
  /** Bộ rule còn hiệu lực tại `asOfDate` (hoặc bộ mới nhất khi không có ngày). */
  rules: StandardRule[];
  /** Ngày mốc đã dùng (`'YYYY-MM-DD'`), hoặc null khi caller không cung cấp/ngày sai định dạng. */
  asOfDate: string | null;
  /** Ghi chú CHUNG cần hiển thị cho người dùng. undefined = không có gì phải lưu ý. */
  note?: string;
  /** Ghi chú RIÊNG theo `rule.id` (VD rule cũ còn áp theo điều khoản chuyển tiếp). */
  noteByRuleId: Record<string, string>;
  /**
   * Ánh xạ `id rule ĐÃ BỊ THAY` → `id rule ĐANG HIỆU LỰC` thay nó (đã đi hết chuỗi thay thế, VD
   * 2014→2024→2031 thì cả 2 id cũ đều trỏ thẳng tới bản cuối).
   *
   * Vì sao PHẢI có: `checker.ts` tra rule bằng ID CHẾT viết thẳng trong code
   * (`byId('vn-res-bedroom-min-area')`). Rule thay thế bắt buộc mang id KHÁC (id là khoá duy nhất
   * toàn cục — xem doc-comment `id`), nên nếu không có bảng này thì bản mới sẽ KHÔNG BAO GIỜ được
   * đo: `byId()` tra id cũ, bộ rule đã bỏ id cũ ⇒ phép kiểm im lặng biến mất. Đây là lỗi ĐÃ MẮC
   * khi làm T2 — test [6]/[7] `rule-effective-date.test.ts` bắt được, không phải suy đoán.
   * ⇒ id cũ đóng vai "khoá NGHIỆP VỤ" mà checker gọi tên; id mới là "khoá PHIÊN BẢN" của trị số.
   */
  aliasByOldId: Record<string, string>;
}

/** `'YYYY-MM-DD'` (chấp nhận chuỗi ISO dài hơn — cắt lấy 10 ký tự đầu). Sai định dạng ⇒ null.
 * So sánh ngày bằng so sánh CHUỖI: đúng với ISO `YYYY-MM-DD` (từ điển = thứ tự thời gian), tránh
 * kéo `Date` vào đây (`new Date('2025-02-01')` là UTC, lệch múi giờ ⇒ lệch 1 ngày ở biên). */
function normalizeIsoDate(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const d = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const m = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  if (m < 1 || m > 12 || day < 1 || day > 31) return null;
  return d;
}

/**
 * Lọc `rules` về đúng bộ áp dụng tại `asOfDate`:
 *   - rule có `effectiveFrom` SAU ngày mốc ⇒ loại (lúc đó chưa có hiệu lực).
 *   - rule bị `supersededBy` trỏ tới 1 rule ĐÃ có hiệu lực tại ngày mốc ⇒ loại (đã bị thay).
 *   - rule bị thay nhưng rule thay thế CHƯA hiệu lực tại ngày mốc ⇒ GIỮ + gắn ghi chú chuyển tiếp.
 *
 * `asOfDate` rỗng/sai định dạng ⇒ dùng BỘ MỚI NHẤT (mọi rule chưa bị thay) + `note` cảnh báo, CHỈ
 * khi bộ rule thật sự có chiều thời gian — dự án không khai ngày thì không phải nghe cảnh báo về
 * thứ không tồn tại. KHÔNG có `Date.now()` ở đây: xem lý do trong doc-comment `effectiveFrom`.
 */
export function resolveRulesAsOf(rules: StandardRule[], asOfDate?: string | null): ResolvedRuleSet {
  const at = normalizeIsoDate(asOfDate);
  const byId = new Map(rules.map((r) => [r.id, r]));
  const hasTimeDimension = rules.some((r) => r.effectiveFrom !== undefined || r.supersededBy !== undefined);
  const noteByRuleId: Record<string, string> = {};
  const aliasByOldId: Record<string, string> = {};
  const out: StandardRule[] = [];
  const dropped: StandardRule[] = [];

  for (const r of rules) {
    if (at !== null && r.effectiveFrom !== undefined) {
      const from = normalizeIsoDate(r.effectiveFrom);
      // effectiveFrom sai định dạng ⇒ coi như không khai (giữ rule), không âm thầm nuốt rule.
      if (from !== null && from > at) continue;
    }
    const successor = r.supersededBy ? byId.get(r.supersededBy) : undefined;
    if (successor) {
      const sFrom = normalizeIsoDate(successor.effectiveFrom);
      if (at === null || sFrom === null || sFrom <= at) {
        dropped.push(r); // bản thay thế đã hiệu lực (hoặc đang lấy bộ mới nhất) ⇒ bỏ bản cũ
        continue;
      }
      noteByRuleId[r.id] =
        `Áp bản CŨ theo điều khoản chuyển tiếp: dự án lấy mốc ${at}, bản thay thế "${successor.id}"` +
        ` chỉ có hiệu lực từ ${sFrom}.`;
    }
    out.push(r);
  }

  // Bảng ánh xạ id cũ → bản đang hiệu lực. Đi hết chuỗi thay thế; trần lặp = số rule để chuỗi
  // vòng (A thay B, B thay A — dữ liệu tuỳ biến của user có thể sai) không treo vòng vô hạn.
  const inForce = new Set(out.map((r) => r.id));
  for (const r of dropped) {
    let cur = r.supersededBy;
    for (let i = 0; i < rules.length && cur; i += 1) {
      if (inForce.has(cur)) { aliasByOldId[r.id] = cur; break; }
      cur = byId.get(cur)?.supersededBy;
    }
  }

  const note =
    at === null && hasTimeDimension
      ? 'Dự án chưa khai ngày mốc (ngày thẩm định/phê duyệt) — đang kiểm bằng BỘ QUY CHUẨN MỚI NHẤT.' +
        ' Hồ sơ đã thẩm định trước ngày quy chuẩn mới có hiệu lực có thể vẫn được nghiệm thu theo bản cũ.'
      : undefined;

  return { rules: out, asOfDate: at, note, noteByRuleId, aliasByOldId };
}

/** Tiện dụng: bộ rule (built-in + tuỳ biến) còn hiệu lực tại 1 ngày mốc. */
export function getRulesEffectiveOn(asOfDate?: string | null): StandardRule[] {
  return resolveRulesAsOf(getAllRules(), asOfDate).rules;
}
