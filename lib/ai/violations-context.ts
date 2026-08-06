/**
 * lib/ai/violations-context.ts — VIỆC 5b: Vitals BIẾT bản vẽ đang vi phạm quy chuẩn gì.
 * Hàm THUẦN. Test: `node_modules/.bin/sucrase-node lib/ai/violations-context.test.ts`.
 *
 * §0b SEARCH: bộ kiểm quy chuẩn **đã có sẵn và đã chạy thật** — `lib/cad/standards/checker.ts`
 * `checkStandards(doc, rules)` trả `Violation[]` (`ruleId`/`source`/`severity`/`category`/
 * `message`/`verified`/`at`), `registry.ts` `getAllRules()` gom 8 nhóm rule. File này **KHÔNG
 * viết lại một dòng logic kiểm nào** (§0d + luật "một cỗ máy nhiều mặt tiền") — nó chỉ là MẶT
 * TIỀN thứ hai của cỗ máy đó: xếp hạng, cắt còn TOP N, gói thành khối chữ cho prompt.
 *
 * ⚠️ **VITALS KHÔNG TỰ NGHĨ RA SỐ** (yêu cầu phiếu, và là luật T-tin-cậy của cả sản phẩm). Số đo
 * nằm sẵn trong `Violation.message` do checker sinh ra (VD *"Phòng ngủ \"NGỦ 1\": diện tích 7.2m²
 * < 9m² tối thiểu"*) — ta chuyển NGUYÊN VĂN, kèm `ruleId` + `source` để người dùng tra ngược được
 * tới điều khoản gốc. Model chỉ được diễn đạt lại, không được tính thêm.
 *
 * §0b NGHĨ NHƯ NGƯỜI DÙNG: KTS sợ nhất là bị bắt lỗi TCVN lúc nộp hồ sơ. Trợ lý nói *"phòng ngủ
 * NGỦ 1 đang 7,2m², QCVN đòi tối thiểu 9m²"* là thứ họ trả tiền. Trợ lý nói *"bạn nên kiểm tra
 * lại diện tích các phòng"* là thứ họ tắt đi.
 */

import type { Doc } from '../cad/model';
import { checkStandards } from '../cad/standards/checker';
import type { Violation } from '../cad/standards/checker';
import { getAllRules } from '../cad/standards/registry';
import type { Severity, StandardRule } from '../cad/standards/registry';

/** Mặc định lấy 5 vi phạm nặng nhất (đúng phiếu) — đủ để nói chuyện, không phình prompt. */
export const DEFAULT_VIOLATION_LIMIT = 5;

/** Trần ký tự mỗi dòng vi phạm — `message` của checker vốn ngắn, đây chỉ là chốt an toàn cho
 * rule tuỳ biến do người dùng tự thêm (`loadCustomRules()`), tránh 1 rule viết dài nuốt cả prompt. */
export const MAX_VIOLATION_MSG_LEN = 220;

/** Nặng → nhẹ. Số nhỏ = nặng hơn (dùng làm khoá sắp xếp). */
const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export interface ViolationBrief {
  ruleId: string;
  source: string;
  severity: Severity;
  category: string;
  /** nguyên văn `Violation.message` của checker — CHỨA SỐ ĐO. Không viết lại, không làm tròn. */
  message: string;
  /** false = rule chưa được đối chiếu chéo nguồn thứ 2 (`StandardRule.verified`). Phải nói ra,
   * không được im: có rule trong repo tự ghi "trị số CHƯA đối chiếu nguồn độc lập". */
  verified: boolean;
}

export interface TopViolationsResult {
  items: ViolationBrief[];
  /** tổng số vi phạm tìm được TRƯỚC khi cắt — để nói "và N lỗi khác", không giấu phần bị cắt. */
  total: number;
  countsBySeverity: Record<Severity, number>;
}

function toBrief(v: Violation): ViolationBrief {
  return {
    ruleId: v.ruleId,
    source: v.source,
    severity: v.severity,
    category: v.category,
    message: v.message.slice(0, MAX_VIOLATION_MSG_LEN),
    verified: v.verified,
  };
}

/**
 * TOP N vi phạm NẶNG NHẤT của bản vẽ. Sắp xếp: `error` → `warning` → `info`; trong cùng mức giữ
 * nguyên thứ tự checker trả về (sort ổn định — checker duyệt phòng theo thứ tự bản vẽ, giữ vậy
 * để lần chạy nào cũng ra cùng kết quả, người dùng không thấy danh sách "nhảy").
 *
 * `rules` bỏ trống ⇒ `getAllRules()` (toàn bộ, kể cả rule tuỳ biến người dùng thêm). Nơi gọi muốn
 * lọc theo hồ sơ hành nghề thì tự truyền `rulesForOperator(...)` — KHÔNG hardcode ở đây.
 */
export function topViolations(doc: Doc, rules?: StandardRule[], limit: number = DEFAULT_VIOLATION_LIMIT): TopViolationsResult {
  let all: Violation[];
  try {
    all = checkStandards(doc, rules ?? getAllRules());
  } catch {
    // Bộ kiểm gặp hình học lạ → KHÔNG được làm hỏng cả câu chat. Thà không có mục quy chuẩn còn
    // hơn 500 cả request (cùng triết lý "im lặng khi lỗi" của sheets-persist).
    return { items: [], total: 0, countsBySeverity: { error: 0, warning: 0, info: 0 } };
  }

  const countsBySeverity: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const v of all) countsBySeverity[v.severity]++;

  const sorted = [...all].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return {
    items: sorted.slice(0, Math.max(0, limit)).map(toBrief),
    total: all.length,
    countsBySeverity,
  };
}

const SEVERITY_LABEL: Record<Severity, string> = { error: 'LỖI', warning: 'CẢNH BÁO', info: 'lưu ý' };

/**
 * Khối chữ bơm vào system prompt. Trả `''` khi không có vi phạm nào — **không bơm câu "bản vẽ
 * không có lỗi"**: checker chỉ kiểm được những gì đo được (rule không đo tự động được thì KHÔNG
 * sinh violation, xem docstring `checkStandards`), nên "0 vi phạm" ≠ "hồ sơ đạt chuẩn". Nói câu
 * đó là để model đi trấn an sai sự thật.
 */
export function violationsPromptBlock(res: TopViolationsResult | null): string {
  if (!res || res.items.length === 0) return '';

  const lines = res.items.map((v) => {
    const nghi = v.verified ? '' : ' [trị số chưa đối chiếu chéo nguồn độc lập]';
    return `- ${SEVERITY_LABEL[v.severity]} · ${v.message} (${v.ruleId} — ${v.source})${nghi}`;
  });

  const con = res.total - res.items.length;
  const duoi = con > 0 ? `\n- … và ${con} mục khác chưa liệt kê ở đây.` : '';

  return (
    `KẾT QUẢ KIỂM QUY CHUẨN của bản vẽ đang mở (${res.total} mục: ` +
    `${res.countsBySeverity.error} lỗi · ${res.countsBySeverity.warning} cảnh báo · ${res.countsBySeverity.info} lưu ý` +
    `). Nặng nhất:\n${lines.join('\n')}${duoi}\n` +
    'CHỈ trích dẫn đúng các mục trên, giữ nguyên con số và mã điều khoản; ' +
    'TUYỆT ĐỐI không tự nghĩ ra số đo hay tên tiêu chuẩn khác. ' +
    'Danh sách này chỉ gồm mục MÁY ĐO ĐƯỢC — không có nghĩa hồ sơ đã đạt chuẩn toàn diện.'
  );
}

/** Validate danh sách vi phạm do CLIENT gửi (route không cầm `Doc`) — cùng khuôn
 * `sanitizeDocContext`/`sanitizeBrandContext`: cắt trần cứng, bỏ mục hỏng, không tin client. */
export function sanitizeViolations(input: unknown): TopViolationsResult | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;

  const items: ViolationBrief[] = [];
  for (const raw of o.items.slice(0, DEFAULT_VIOLATION_LIMIT)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const sev = r.severity;
    if (sev !== 'error' && sev !== 'warning' && sev !== 'info') continue;
    const message = typeof r.message === 'string' ? r.message.trim().slice(0, MAX_VIOLATION_MSG_LEN) : '';
    if (!message) continue;
    items.push({
      ruleId: typeof r.ruleId === 'string' ? r.ruleId.slice(0, 80) : '',
      source: typeof r.source === 'string' ? r.source.slice(0, 120) : '',
      severity: sev,
      category: typeof r.category === 'string' ? r.category.slice(0, 60) : '',
      message,
      verified: r.verified === true,
    });
  }
  if (!items.length) return null;

  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, 100000) : 0);
  const c = (o.countsBySeverity ?? {}) as Record<string, unknown>;
  return {
    items,
    total: Math.max(n(o.total), items.length),
    countsBySeverity: { error: n(c.error), warning: n(c.warning), info: n(c.info) },
  };
}
