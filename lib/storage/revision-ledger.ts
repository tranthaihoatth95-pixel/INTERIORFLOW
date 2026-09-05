/**
 * lib/storage/revision-ledger.ts — SỔ PHIÊN BẢN (revision ledger) THUẦN cho một object JSON.
 *
 * VÌ SAO (Blueprint B11: "Hiện trạng: chỉ `FlowVersion` tồn tại. Checkpoint/Revision = [GAP]"):
 * mọi kho JSON per-project của IF (`uploads/dna/<projectId>/cards.json` là ca đầu tiên) đang
 * GHI ĐÈ tại chỗ — sửa nhầm là mất, không lùi được, và không có định danh nào cho "bản lúc 14:02".
 * File này cấp hai thứ còn thiếu, KHÔNG đẻ DB mới:
 *   · `objectId`   — UUID bền của OBJECT, sinh một lần lúc tạo sổ, KHÔNG phụ thuộc id UI/route.
 *   · `revisionId` — định danh NỘI DUNG: `rev_` + hash(parentRevisionId + contentHash) — cùng nội
 *     dung + cùng cha ⇒ cùng id ở mọi máy; đổi một byte ngữ nghĩa ⇒ id khác. Chuỗi cha→con kiểm
 *     lại được (`verifyChain`) không cần tin sổ.
 *
 * Từ vựng theo B3: đây là **Version** (technical evolution, snapshot mỗi lần ghi), KHÔNG phải
 * "Revision" nghề (R01 issued/frozen — Q6, [GAP] Wave 3). Tên file giữ chữ "revision" theo đề bài
 * slice 5 ("reversible revisions"); khi Q6 thi công, ProjectRevision TRỎ TỚI một `revisionId` ở
 * đây thay vì chép lại nội dung.
 *
 * KHÔNG PHÁ HUỶ: khôi phục = ghi MỘT ENTRY MỚI có `restoredFrom`, không cắt lịch sử. Xoá object =
 * entry có nội dung rỗng, vẫn lùi được. Sổ chỉ nối thêm (append-only).
 *
 * THUẦN: hash tiêm qua tham số (`HashFn`) để chạy được cả node (`crypto`) lẫn browser (WebCrypto
 * async bọc ngoài) và test tất định. Không Date.now — `at` do caller cấp. Import tương đối.
 */

export type HashFn = (text: string) => string;

export interface RevisionEntry {
  revisionId: string;
  parentRevisionId: string | null;
  /** thứ tự trong sổ, 1-based — để người đọc sổ thấy ngay bản thứ mấy. */
  seq: number;
  /** ISO 8601 — caller cấp. */
  at: string;
  /** ai ghi (userId) — optional, KHÔNG bịa khi không biết. */
  by?: string;
  /** lý do ngắn máy-đọc: 'upsert' · 'delete' · 'restore' · 'import'… — caller tự đặt. */
  reason: string;
  /** hash của nội dung (canonical JSON) — trùng hash = cùng nội dung ngữ nghĩa. */
  contentHash: string;
  /** khi là bản khôi phục: revisionId của bản được lấy lại. */
  restoredFrom?: string;
}

export interface RevisionLedger {
  version: 1;
  /** UUID bền của object — độc lập với projectId/route/UI id. */
  objectId: string;
  /** object này LÀ gì (kind) và thuộc về ai (key) — để đọc sổ không cần ngữ cảnh thư mục. */
  subject: { kind: string; key: string };
  head: string | null;
  entries: RevisionEntry[];
}

/**
 * JSON chuẩn hoá: khoá object sắp xếp, `undefined` bỏ (như JSON.stringify), mảng giữ thứ tự.
 * Hai object bằng nhau về ngữ nghĩa ⇒ cùng chuỗi ⇒ cùng hash, bất kể thứ tự khoá lúc ghi.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) {
      if (src[k] !== undefined) out[k] = sortKeys(src[k]);
    }
    return out;
  }
  return v;
}

export function contentHashOf(value: unknown, hash: HashFn): string {
  return hash(canonicalJson(value));
}

/** `rev_` + 24 hex — đủ ngắn để in vào UI/URL, đủ dài để không va (96 bit). */
export function revisionIdOf(parentRevisionId: string | null, contentHash: string, hash: HashFn): string {
  return `rev_${hash(`${parentRevisionId ?? ''}\n${contentHash}`).slice(0, 24)}`;
}

export function newLedger(objectId: string, subject: { kind: string; key: string }): RevisionLedger {
  return { version: 1, objectId, subject: { ...subject }, head: null, entries: [] };
}

export interface AppendRevisionInput {
  contentHash: string;
  at: string;
  reason: string;
  by?: string;
  restoredFrom?: string;
}

export interface AppendRevisionResult {
  ledger: RevisionLedger;
  /** entry đang là head sau khi gọi (entry mới, hoặc entry cũ nếu `unchanged`). */
  entry: RevisionEntry | null;
  /** nội dung y hệt head hiện tại và không phải khôi phục ⇒ KHÔNG ghi entry mới (idempotent). */
  unchanged: boolean;
}

/** Nối một bản mới vào sổ. KHÔNG đột biến `ledger` đầu vào — trả sổ mới. */
export function appendRevision(ledger: RevisionLedger, input: AppendRevisionInput, hash: HashFn): AppendRevisionResult {
  const headEntry = ledger.head ? ledger.entries.find((e) => e.revisionId === ledger.head) ?? null : null;
  if (headEntry && headEntry.contentHash === input.contentHash && !input.restoredFrom) {
    return { ledger, entry: headEntry, unchanged: true };
  }
  const revisionId = revisionIdOf(ledger.head, input.contentHash, hash);
  const entry: RevisionEntry = {
    revisionId,
    parentRevisionId: ledger.head,
    seq: ledger.entries.length + 1,
    at: input.at,
    reason: input.reason,
    contentHash: input.contentHash,
  };
  if (input.by) entry.by = input.by;
  if (input.restoredFrom) entry.restoredFrom = input.restoredFrom;
  const next: RevisionLedger = {
    ...ledger,
    subject: { ...ledger.subject },
    head: revisionId,
    entries: [...ledger.entries, entry],
  };
  return { ledger: next, entry, unchanged: false };
}

export function findRevision(ledger: RevisionLedger, revisionId: string): RevisionEntry | null {
  return ledger.entries.find((e) => e.revisionId === revisionId) ?? null;
}

/**
 * Kiểm lại toàn chuỗi: mỗi entry phải có id = hash(cha + contentHash), cha đúng là entry trước,
 * seq liên tục, head = entry cuối. Sổ bị sửa tay/ghi dở ⇒ `ok: false` + entry đầu tiên hỏng.
 */
export function verifyChain(ledger: RevisionLedger, hash: HashFn): { ok: true } | { ok: false; brokenAt: string | null } {
  let parent: string | null = null;
  for (let i = 0; i < ledger.entries.length; i++) {
    const e = ledger.entries[i];
    if (e.parentRevisionId !== parent) return { ok: false, brokenAt: e.revisionId };
    if (e.seq !== i + 1) return { ok: false, brokenAt: e.revisionId };
    if (revisionIdOf(parent, e.contentHash, hash) !== e.revisionId) return { ok: false, brokenAt: e.revisionId };
    parent = e.revisionId;
  }
  if (ledger.head !== parent) return { ok: false, brokenAt: ledger.head };
  return { ok: true };
}

export function serializeLedger(ledger: RevisionLedger): string {
  return JSON.stringify(ledger, null, 2);
}

/** Parse sổ từ đĩa — dữ liệu ngoài không tin mù; hỏng cấu trúc ⇒ `null` (caller quyết mở sổ mới
 * hay báo lỗi — KHÔNG tự "sửa" sổ). */
export function parseLedger(raw: string): RevisionLedger | null {
  if (!raw.trim()) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const l = v as Record<string, unknown>;
  if (l.version !== 1) return null;
  if (typeof l.objectId !== 'string' || !l.objectId) return null;
  const subject = l.subject as Record<string, unknown> | undefined;
  if (!subject || typeof subject.kind !== 'string' || typeof subject.key !== 'string') return null;
  if (l.head !== null && typeof l.head !== 'string') return null;
  if (!Array.isArray(l.entries)) return null;
  const entries: RevisionEntry[] = [];
  for (const raw of l.entries) {
    const e = raw as Record<string, unknown>;
    if (!e || typeof e !== 'object') return null;
    if (typeof e.revisionId !== 'string' || typeof e.contentHash !== 'string') return null;
    if (e.parentRevisionId !== null && typeof e.parentRevisionId !== 'string') return null;
    if (typeof e.seq !== 'number' || typeof e.at !== 'string' || typeof e.reason !== 'string') return null;
    const entry: RevisionEntry = {
      revisionId: e.revisionId,
      parentRevisionId: e.parentRevisionId as string | null,
      seq: e.seq,
      at: e.at,
      reason: e.reason,
      contentHash: e.contentHash,
    };
    if (typeof e.by === 'string') entry.by = e.by;
    if (typeof e.restoredFrom === 'string') entry.restoredFrom = e.restoredFrom;
    entries.push(entry);
  }
  return {
    version: 1,
    objectId: l.objectId,
    subject: { kind: subject.kind, key: subject.key },
    head: l.head as string | null,
    entries,
  };
}
