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

export const BUILTIN_GROUPS: RuleGroup[] = [VN_RESIDENTIAL, VN_FIRE, INTL_EGRESS, ISO_DRAFTING];

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
