/**
 * lib/ai/doc-context.ts — VIỆC 5a: Vitals ĐỌC ĐƯỢC TRẠNG THÁI BẢN VẼ.
 * Hàm THUẦN. Chạy test: `node_modules/.bin/sucrase-node lib/ai/doc-context.test.ts`.
 *
 * §0b SEARCH: `lib/ai/chat-assist.ts` hôm nay chỉ gửi `{messages, stage, brand}` — Vitals biết
 * người dùng đang ở CHẶNG nào và dự án tên gì, nhưng **mù hoàn toàn về nội dung bản vẽ**. Hỏi
 * "phòng ngủ của tôi có đủ rộng không" thì nó phải đoán. `IF-FEATURE-TREE 6.7` tự ghi đây là
 * *"phần đáng giá nhất còn thiếu"*.
 *
 * §0b NGHĨ NHƯ NGƯỜI DÙNG: một KTS 10 năm nghề hỏi trợ lý thì mong nó **đã nhìn bản vẽ rồi**, y
 * như hỏi đồng nghiệp đứng cạnh. Trợ lý trả lời chung chung kiểu bài giảng ⇒ họ tắt đi và không
 * mở lại. Nhưng trợ lý **bịa số** ("phòng khách 24m² của bạn…" trong khi thật ra 18m²) thì tệ hơn
 * hẳn — mất niềm tin vĩnh viễn. Vì vậy file này chỉ đưa SỐ ĐO ĐƯỢC, chỗ nào không đo được thì nói
 * thẳng "chưa dò được biên", KHÔNG ước lượng.
 *
 * ⚠️ **TÓM TẮT — TUYỆT ĐỐI KHÔNG nhét cả `Doc` vào prompt.** Một bản vẽ thật có hàng nghìn entity,
 * kèm ảnh nhúng dạng data-URL (`PhotoEmbed.src`) — nhét thẳng là nổ token, tốn tiền thật của Hoà,
 * và model cũng không đọc nổi. Trần ký tự khai ở `MAX_DOC_CONTEXT_CHARS` bên dưới, `docContext
 * PromptBlock()` tự cắt và ĐÁNH DẤU đã cắt (không cắt lén).
 */

import type { Doc, Entity } from '../cad/model';
import { findRoomLabels } from '../cad/standards/checker';

/** Trần ký tự của khối ngữ cảnh bơm vào system prompt. ~900 ký tự ≈ 300 token — đủ mô tả một mặt
 * bằng căn hộ, nhỏ so với trần 500 token đầu ra của route (`ai-assist-chat`). Cắt là CẮT THẬT +
 * gắn dấu "…(đã cắt bớt)", không im lặng. */
export const MAX_DOC_CONTEXT_CHARS = 900;

/** Số phòng tối đa liệt kê tên trong prompt — còn lại gộp thành "và N phòng khác". */
export const MAX_ROOMS_LISTED = 12;

/**
 * Trần số nhãn phòng còn cho phép ĐO DIỆN TÍCH. Trên ngưỡng này thì BỎ đo, chỉ đếm.
 * Lý do có thật, không phải phòng xa: `findRoomLabels()` gọi `findHatchBoundary()` — `docs/
 * TECH-DEBT.md` ghi hàm này **treo >2 phút ở mật độ phòng cực cao**. Ngữ cảnh chat chạy đồng bộ
 * ngay lúc người dùng gõ câu hỏi ⇒ treo ở đây là ĐƠ APP. Thà thiếu diện tích còn hơn đơ (N5:
 * khai thật cái chưa làm được — `DocContext.areasSkipped` nói rõ vì sao thiếu).
 */
export const MAX_ROOMS_FOR_AREA = 60;

export interface DocContextRoom {
  name: string;
  /** null = có nhãn phòng nhưng KHÔNG dò được biên kín ⇒ không biết diện tích. Không đoán. */
  areaM2: number | null;
}

export interface DocContextSelection {
  count: number;
  /** các loại entity đang chọn, VD ['hatch','block'] — đủ để Vitals nói "3 vùng tô đang chọn". */
  kinds: string[];
}

export interface DocContext {
  entityCount: number;
  roomCount: number;
  rooms: DocContextRoom[];
  /** tổng diện tích các phòng ĐO ĐƯỢC (m², làm tròn 1 số lẻ). null = không phòng nào đo được. */
  totalAreaM2: number | null;
  /** true = đã BỎ QUA bước đo diện tích vì quá nhiều nhãn phòng (xem `MAX_ROOMS_FOR_AREA`). */
  areasSkipped: boolean;
  levelCount: number;
  levelNames: string[];
  /** entity ĐÁNG LẼ phải gắn vật liệu (hatch vùng tô + block nội thất) và đã gắn `specId`. */
  materialsAssigned: number;
  /** … và chưa gắn. Đây là con số Vitals được phép nhắc "còn N món chưa gán vật liệu". */
  materialsMissing: number;
  selection?: DocContextSelection;
}

export interface SummarizeDocOptions {
  /** id entity đang chọn trên canvas — selection KHÔNG nằm trong `Doc` (nó là state UI), nên phải
   * truyền vào. Bỏ trống = không nói gì về selection (KHÔNG bịa "bạn đang không chọn gì"). */
  selectedIds?: string[];
  /** true = bỏ hẳn bước đo diện tích (nơi gọi biết bản vẽ nặng, hoặc đang gõ liên tục). */
  skipAreas?: boolean;
}

/** Entity nào ĐÁNG LẼ phải có vật liệu: vùng tô (`hatch`) + đồ nội thất (`block`) — đúng 2 loại
 * mang field `specId` trong `model.ts`. Line/text/dim không có chỗ gắn ⇒ không tính là "thiếu". */
function needsMaterial(e: Entity): boolean {
  return e.type === 'hatch' || e.type === 'block';
}

/**
 * TÓM TẮT bản vẽ cho Vitals. Mọi con số đều ĐO ĐƯỢC từ `doc`; không đo được thì để `null`/0 và
 * nói rõ, KHÔNG suy đoán (K3).
 */
export function summarizeDoc(doc: Doc, opts: SummarizeDocOptions = {}): DocContext {
  const entities = Array.isArray(doc.entities) ? doc.entities : [];

  // ── phòng + diện tích ──
  const textCount = entities.filter((e) => e.type === 'text').length;
  const tooMany = textCount > MAX_ROOMS_FOR_AREA;
  const areasSkipped = !!opts.skipAreas || tooMany;

  let rooms: DocContextRoom[] = [];
  let roomCount = 0;
  let totalAreaM2: number | null = null;

  if (!areasSkipped) {
    const found = findRoomLabels(doc);
    roomCount = found.length;
    rooms = found.map((r) => ({ name: r.name, areaM2: r.areaM2 === null ? null : Math.round(r.areaM2 * 10) / 10 }));
    const measured = rooms.filter((r) => r.areaM2 !== null);
    if (measured.length) totalAreaM2 = Math.round(measured.reduce((s, r) => s + (r.areaM2 ?? 0), 0) * 10) / 10;
  } else {
    // Vẫn đếm được nhãn phòng mà KHÔNG chạy dò biên (chỉ lọc TEXT toàn-hoa như checker) — rẻ.
    roomCount = textCount;
  }

  // ── tầng ──
  const levels = Array.isArray(doc.levels) ? doc.levels : [];
  let levelNames = levels.map((l) => l.name);
  if (!levelNames.length) {
    // Chưa có Level thật (file v1 chưa nâng) — lùi về nhãn `storey` để vẫn nói được điều gì đó.
    const st = new Set<string>();
    for (const e of entities) if (typeof e.storey === 'string' && e.storey.trim()) st.add(e.storey.trim());
    levelNames = Array.from(st);
  }

  // ── vật liệu ──
  let materialsAssigned = 0;
  let materialsMissing = 0;
  for (const e of entities) {
    if (!needsMaterial(e)) continue;
    const specId = 'specId' in e ? e.specId : undefined;
    if (specId) materialsAssigned++;
    else materialsMissing++;
  }

  // ── đang chọn gì ──
  let selection: DocContextSelection | undefined;
  if (opts.selectedIds?.length) {
    const ids = new Set(opts.selectedIds);
    const sel = entities.filter((e) => ids.has(e.id));
    if (sel.length) selection = { count: sel.length, kinds: Array.from(new Set(sel.map((e) => e.type))) };
  }

  return {
    entityCount: entities.length,
    roomCount,
    rooms,
    totalAreaM2,
    areasSkipped,
    levelCount: levelNames.length,
    levelNames,
    materialsAssigned,
    materialsMissing,
    ...(selection ? { selection } : {}),
  };
}

/**
 * Khối chữ bơm vào system prompt. Trả `''` khi bản vẽ RỖNG — không bơm một khối "0 phòng, 0 vật
 * liệu" vô nghĩa làm loãng prompt.
 *
 * Câu chốt cuối khối là RÀO CHẮN QUAN TRỌNG NHẤT: cấm model tự đẻ số. Không có nó, model rất hay
 * "làm tròn cho đẹp" hoặc suy ra diện tích phòng chưa đo được.
 */
export function docContextPromptBlock(ctx: DocContext | null): string {
  if (!ctx || ctx.entityCount === 0) return '';

  const parts: string[] = [];
  parts.push(`Bản vẽ đang mở có ${ctx.entityCount} đối tượng.`);

  if (ctx.areasSkipped) {
    parts.push(`Có ${ctx.roomCount} nhãn phòng; CHƯA đo diện tích (bản vẽ quá nặng để đo nhanh).`);
  } else if (ctx.roomCount === 0) {
    parts.push('Chưa có nhãn phòng nào.');
  } else {
    const listed = ctx.rooms.slice(0, MAX_ROOMS_LISTED);
    const ten = listed.map((r) => (r.areaM2 === null ? `${r.name} (chưa dò được biên)` : `${r.name} ${r.areaM2}m²`)).join(' · ');
    const con = ctx.rooms.length - listed.length;
    parts.push(`${ctx.roomCount} phòng: ${ten}${con > 0 ? ` · và ${con} phòng khác` : ''}.`);
    if (ctx.totalAreaM2 !== null) parts.push(`Tổng diện tích đo được: ${ctx.totalAreaM2}m².`);
  }

  if (ctx.levelCount > 0) parts.push(`${ctx.levelCount} tầng: ${ctx.levelNames.join(' · ')}.`);

  const tongVL = ctx.materialsAssigned + ctx.materialsMissing;
  if (tongVL > 0) parts.push(`Vật liệu: ${ctx.materialsAssigned}/${tongVL} đối tượng đã gán, ${ctx.materialsMissing} chưa gán.`);

  if (ctx.selection) parts.push(`Đang chọn ${ctx.selection.count} đối tượng (${ctx.selection.kinds.join(', ')}).`);

  let body = parts.join(' ');
  if (body.length > MAX_DOC_CONTEXT_CHARS) body = body.slice(0, MAX_DOC_CONTEXT_CHARS - 16).trimEnd() + '… (đã cắt bớt)';

  return (
    'TRẠNG THÁI BẢN VẼ (số liệu ĐO ĐƯỢC từ file người dùng đang mở): ' +
    body +
    ' — CHỈ dùng đúng những con số trên; TUYỆT ĐỐI không tự tính hay ước lượng số đo nào khác, ' +
    'không có số thì nói "chưa đo được".'
  );
}

/**
 * Validate `docContext` do CLIENT gửi lên (route chạy ở server, không cầm `Doc`). Cùng tinh thần
 * `sanitizeBrandContext` — không tin dữ liệu client, cắt mọi chuỗi/mảng về trần cứng để một
 * payload cố ý phình không bơm được nghìn ký tự vào prompt (và vào hoá đơn token).
 * Trả `null` nếu không có gì dùng được.
 */
export function sanitizeDocContext(input: unknown): DocContext | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;

  const num = (v: unknown, max = 1_000_000) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0);
  const str = (v: unknown, max = 60) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  const entityCount = num(o.entityCount);
  if (entityCount === 0) return null;

  const rooms: DocContextRoom[] = Array.isArray(o.rooms)
    ? o.rooms
        .slice(0, MAX_ROOMS_LISTED)
        .map((r) => {
          const ro = (r ?? {}) as Record<string, unknown>;
          const name = str(ro.name);
          const a = ro.areaM2;
          return { name, areaM2: typeof a === 'number' && Number.isFinite(a) && a >= 0 ? a : null };
        })
        .filter((r) => !!r.name)
    : [];

  const levelNames = Array.isArray(o.levelNames)
    ? o.levelNames.map((n) => str(n)).filter(Boolean).slice(0, 20)
    : [];

  const selRaw = o.selection as Record<string, unknown> | undefined;
  const selCount = selRaw ? num(selRaw.count) : 0;
  const selection: DocContextSelection | undefined =
    selCount > 0
      ? { count: selCount, kinds: Array.isArray(selRaw?.kinds) ? selRaw!.kinds.map((k) => str(k, 20)).filter(Boolean).slice(0, 10) : [] }
      : undefined;

  const total = o.totalAreaM2;
  return {
    entityCount,
    roomCount: num(o.roomCount),
    rooms,
    totalAreaM2: typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : null,
    areasSkipped: o.areasSkipped === true,
    levelCount: num(o.levelCount),
    levelNames,
    materialsAssigned: num(o.materialsAssigned),
    materialsMissing: num(o.materialsMissing),
    ...(selection ? { selection } : {}),
  };
}
