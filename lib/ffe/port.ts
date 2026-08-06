/**
 * lib/ffe/port.ts — CẦU NỐI giữa `FfeTable` (lib/ffe/item.ts) và cổng dữ liệu kiểu `'table'`
 * của luồng node (`DataType` trong `lib/types.ts`, thêm 06/08 theo G-M3-02).
 *
 * Vì sao tách file riêng thay vì nhét vào `item.ts`:
 *  - `item.ts` là HỢP ĐỒNG DỮ LIỆU dùng chung (BOQ · hồ sơ FF&E · kho vật liệu · luồng node đều
 *    đọc). File này là chuyện RIÊNG của luồng node (mã hoá chuỗi, gộp bảng, đặt nhãn) — trộn vào
 *    sẽ kéo cả 4 nơi tiêu thụ phải đọc chuyện của một nơi.
 *  - Agent khác đang đọc `item.ts` ở chế độ chỉ-đọc; thêm ở file mới thì không va.
 *
 * ⚠️ LUẬT MỘT CỬA: mọi nơi đọc/ghi giá trị cổng `'table'` PHẢI đi qua `encodeFfeTablePort` /
 * `decodeFfeTablePort`. Không nơi nào `JSON.parse` tay — chuỗi hỏng (flow cũ, người dùng sửa tay,
 * node upstream lỗi) phải rơi về BẢNG RỖNG chứ không được ném lỗi giữa lượt chạy: một dây chuyền
 * 5 khối mà chết vì 1 ký tự JSON hỏng thì mất luôn 4 lượt gọi mô hình đã trả tiền.
 *
 * File THUẦN: không React/DOM/fetch — chạy được bằng sucrase-node.
 */
import type { FfeItem, FfeTable } from './item';
import { makeFfeId } from './item';

/** Khoá kiểu dữ liệu cổng — khai ở đây để node def không gõ chuỗi trần rải rác. */
export const FFE_TABLE_DATA_TYPE = 'table' as const;

/** Dấu nhận dạng gói tin trên dây — có nó mới chắc chuỗi này là bảng món chứ không phải JSON
 * bất kỳ ai đó nối nhầm từ cổng 'text' sang (cổng khác kiểu thì `FlowCanvas` đã chặn, nhưng
 * `params` dạng chữ thì không ai chặn được). */
const ENVELOPE_KIND = 'ffe-table@1';

interface Envelope {
  kind: typeof ENVELOPE_KIND;
  table: FfeTable;
}

/** Bảng rỗng có id — dùng làm giá trị lùi khi giải mã thất bại (KHÔNG trả `null`, để caller khỏi
 * phải rải `?.` khắp nơi rồi quên một chỗ). */
export function emptyFfeTable(label?: string): FfeTable {
  return { id: makeFfeId('ffetab'), label, items: [] };
}

/** `FfeTable` → chuỗi đặt vào `PortValue.value`. */
export function encodeFfeTablePort(table: FfeTable): string {
  const env: Envelope = { kind: ENVELOPE_KIND, table };
  return JSON.stringify(env);
}

/**
 * Chuỗi trên dây → `FfeTable`. Chấp nhận 3 dạng đầu vào, theo thứ tự ưu tiên:
 *  1. gói tin đúng chuẩn `{kind:'ffe-table@1', table:{…}}`;
 *  2. JSON trần của chính `FfeTable` (`{id, items:[…]}`) — phòng khi ai đó dán tay/ghi từ file;
 *  3. bất cứ thứ gì khác ⇒ BẢNG RỖNG (không ném lỗi, xem docblock đầu file).
 * `items` luôn được lọc: phần tử không có `name` chuỗi thì bỏ — một dòng rác không được phép
 * biến thành một dòng báo giá "undefined".
 */
export function decodeFfeTablePort(raw: unknown): FfeTable {
  if (typeof raw !== 'string' || !raw.trim()) return emptyFfeTable();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyFfeTable();
  }
  const obj = parsed as { kind?: unknown; table?: unknown; items?: unknown; id?: unknown; label?: unknown; sourceRef?: unknown };
  const candidate =
    obj && obj.kind === ENVELOPE_KIND && obj.table && typeof obj.table === 'object'
      ? (obj.table as Record<string, unknown>)
      : obj && Array.isArray(obj.items)
        ? (obj as unknown as Record<string, unknown>)
        : null;
  if (!candidate) return emptyFfeTable();
  const rawItems = Array.isArray(candidate.items) ? candidate.items : [];
  const items = rawItems.filter(
    (it): it is FfeItem => Boolean(it) && typeof it === 'object' && typeof (it as FfeItem).name === 'string',
  );
  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : makeFfeId('ffetab'),
    label: typeof candidate.label === 'string' ? candidate.label : undefined,
    items,
    sourceRef: typeof candidate.sourceRef === 'string' ? candidate.sourceRef : undefined,
  };
}

/**
 * Nối nhiều bảng thành MỘT, giữ nguyên thứ tự gặp. Trùng `id` món ⇒ giữ bản ĐẦU TIÊN (bảng đứng
 * trước trong dây chuyền), KHÔNG cộng dồn số lượng: hai lần chạy cùng một món có thể là "đúng 2
 * cái" mà cũng có thể là "chạy lại lần 2" — máy không phân biệt được, nên không được tự đoán ra
 * tiền. Người dùng sửa số lượng trên node là đường đúng.
 */
export function mergeFfeTables(tables: (FfeTable | null | undefined)[], label?: string): FfeTable {
  const out = emptyFfeTable(label);
  const seen = new Set<string>();
  for (const t of tables) {
    if (!t) continue;
    for (const it of t.items) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      out.items.push(it);
    }
    if (!out.label && t.label) out.label = t.label;
    if (!out.sourceRef && t.sourceRef) out.sourceRef = t.sourceRef;
  }
  return out;
}

/**
 * Câu tóm tắt NGẮN cho cổng phụ + nhãn trên mặt khối — theo `SPEC-NGON-NGU-CHI-DAN` (≤12 từ,
 * không jargon). Món chưa gán phòng đếm riêng để người dùng thấy ngay chỗ còn thiếu.
 */
export function ffeTableSummary(table: FfeTable): string {
  if (table.items.length === 0) return 'Bảng trống — chưa có món nào.';
  const rooms = new Set(table.items.map((i) => (i.room ?? '').trim()).filter(Boolean));
  const noRoom = table.items.filter((i) => !(i.room ?? '').trim()).length;
  const parts = [`${table.items.length} món`];
  if (rooms.size > 0) parts.push(`${rooms.size} phòng`);
  if (noRoom > 0) parts.push(`${noRoom} chưa gán phòng`);
  return parts.join(' · ');
}
