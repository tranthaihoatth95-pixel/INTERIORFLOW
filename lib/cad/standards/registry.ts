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

export interface StandardRule {
  /** slug duy nhất toàn cục, VD 'vn-res-bedroom-min-area'. Trùng id ⇒ rule sau ghi đè rule trước
   * (dùng để user override 1 rule built-in bằng rule tuỳ biến cùng id nếu muốn). */
  id: string;
  /** Nguồn trích dẫn — TÊN VĂN BẢN + điều khoản nếu biết, VD "TCVN 4451:2012 §2.3.4". */
  source: string;
  category: StandardCategory;
  severity: Severity;
  /** Mô tả tiếng Việt, hiển thị trực tiếp trong panel Kiểm chuẩn. */
  description: string;
  /** Tham số số — mỗi rule tự định nghĩa field nào dùng (mm hoặc m², xem checker.ts). */
  params: Record<string, number>;
  verified: boolean;
  /** Bắt buộc có nội dung khi verified=false — lý do chưa chắc + cần đối chiếu gì. */
  note?: string;
  /** Vùng/hệ quy chuẩn áp dụng (tuỳ chọn — rule cũ không đặt = áp dụng chung). */
  region?: StandardRegion;
  /** Ràng buộc bắt buộc/tuỳ chỉnh (tuỳ chọn — rule cũ không đặt, coi như suy ra từ severity). */
  binding?: RuleBinding;
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

export const BUILTIN_GROUPS: RuleGroup[] = [VN_RESIDENTIAL, VN_FIRE, INTL_EGRESS, ISO_DRAFTING, NEUFERT, VN_ACCESSIBILITY, VN_LIGHTING];

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
