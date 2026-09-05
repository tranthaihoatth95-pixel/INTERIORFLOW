/**
 * lib/storage/revisioned-json-file.ts — KHO JSON CÓ SỔ PHIÊN BẢN trên đĩa (node/server), ghi
 * NGUYÊN TỬ, lùi được, không phá huỷ. Mặt tiền node của `./revision-ledger.ts` (thuần).
 *
 * Cây thư mục — bản hiện hành GIỮ NGUYÊN tên/định dạng cũ để mọi reader hiện có không đổi:
 *   <dir>/<fileName>                  bản hiện hành (vd `cards.json` — đúng bytes reader cũ đọc)
 *   <dir>/ledger.json                 sổ phiên bản (objectId bền + chuỗi revisionId)
 *   <dir>/revisions/<revisionId>.json bản chụp từng phiên bản, cùng serializer với bản hiện hành
 *
 * GHI NGUYÊN TỬ: mỗi file ghi qua `<file>.tmp-<pid>-<rand>` rồi `rename` (atomic trên cùng
 * filesystem) — không bao giờ có file nửa chừng. Thứ tự ghi: bản chụp → sổ → bản hiện hành, nên
 * crash giữa chừng chỉ để lại bản chụp/sổ THỪA (lần ghi sau tự nối tiếp), không bao giờ mất bản
 * hiện hành. Mọi thao tác trên cùng `dir` xếp hàng qua một khoá in-process — hai upsert song
 * song trong cùng server không giẫm read-modify-write của nhau (kho cũ không có lớp này).
 *
 * LOCAL-FIRST, KHAI THẬT: đây là đĩa của máy đang chạy server IF (desktop Electron = máy người
 * dùng). Không đồng bộ giữa máy, không khoá liên tiến trình — hai server trỏ cùng thư mục vẫn
 * có thể đua; sổ có `verifyChain` để phát hiện chứ không để ngăn.
 *
 * SERVER ONLY (`fs/promises`, `crypto`). Import tương đối cho sucrase-node.
 */
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  appendRevision,
  contentHashOf,
  findRevision,
  newLedger,
  parseLedger,
  serializeLedger,
  verifyChain,
  type RevisionEntry,
  type RevisionLedger,
} from './revision-ledger';

const LEDGER_FILE = 'ledger.json';
const REVISIONS_DIR = 'revisions';

export const sha256Text = (s: string): string => createHash('sha256').update(s).digest('hex');

export interface WriteMeta {
  /** lý do máy-đọc: 'upsert' · 'delete' · 'restore' · … */
  reason: string;
  by?: string;
  /** ISO 8601 — mặc định `new Date().toISOString()` (mặt tiền node được phép có đồng hồ; test
   * truyền vào để tất định). */
  at?: string;
}

export interface WriteResult {
  entry: RevisionEntry;
  /** nội dung y hệt head ⇒ không ghi gì (idempotent). */
  unchanged: boolean;
}

export interface RevisionedJsonStore<T> {
  /** Bản hiện hành. `undefined` = chưa từng ghi (KHÁC với giá trị rỗng hợp lệ). */
  read(): Promise<T | undefined>;
  write(value: T, meta: WriteMeta): Promise<WriteResult>;
  /** Sổ phiên bản — `null` khi chưa từng ghi. */
  ledger(): Promise<RevisionLedger | null>;
  /** Nội dung một phiên bản cũ — `undefined` khi không có id đó / bản chụp mất. */
  readRevision(revisionId: string): Promise<T | undefined>;
  /** Khôi phục = ghi entry MỚI với nội dung của bản cũ (không cắt lịch sử). `null` = không có id. */
  restore(revisionId: string, meta: Omit<WriteMeta, 'reason'>): Promise<{ value: T; entry: RevisionEntry } | null>;
  /** Kiểm chuỗi sổ trên đĩa (không tin sổ mù). */
  verify(): Promise<{ ok: true } | { ok: false; brokenAt: string | null }>;
}

export interface OpenRevisionedJsonFileOptions<T> {
  dir: string;
  /** tên bản hiện hành, vd 'cards.json'. */
  fileName: string;
  subject: { kind: string; key: string };
  /** đọc chuỗi từ đĩa → giá trị; `undefined` = hỏng/không đọc được. */
  parse: (raw: string) => T | undefined;
  serialize: (value: T) => string;
  /** hash/uuid tiêm cho test; mặc định sha256 + randomUUID. */
  hash?: (text: string) => string;
  newObjectId?: () => string;
}

/* ─────────── khoá in-process theo thư mục — tuần tự hoá read-modify-write ─────────── */
const locks = new Map<string, Promise<unknown>>();
async function withDirLock<R>(dir: string, fn: () => Promise<R>): Promise<R> {
  const prev = locks.get(dir) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  locks.set(dir, run.catch(() => undefined));
  try {
    return await run;
  } finally {
    if (locks.get(dir) === run) locks.delete(dir);
  }
}

/** Ghi nguyên tử: tmp cùng thư mục → rename. */
export async function writeFileAtomic(file: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await fs.writeFile(tmp, data, 'utf8');
    await fs.rename(tmp, file);
  } catch (e) {
    await fs.rm(tmp, { force: true }).catch(() => undefined);
    throw e;
  }
}

async function readTextOrUndefined(file: string): Promise<string | undefined> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return undefined;
    throw e;
  }
}

export function openRevisionedJsonFile<T>(opts: OpenRevisionedJsonFileOptions<T>): RevisionedJsonStore<T> {
  const hash = opts.hash ?? sha256Text;
  const newObjectId = opts.newObjectId ?? randomUUID;
  const currentFile = path.join(opts.dir, opts.fileName);
  const ledgerFile = path.join(opts.dir, LEDGER_FILE);
  const revFile = (id: string) => path.join(opts.dir, REVISIONS_DIR, `${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);

  async function loadLedger(): Promise<RevisionLedger | null> {
    const raw = await readTextOrUndefined(ledgerFile);
    if (raw === undefined) return null;
    const l = parseLedger(raw);
    if (!l) throw new Error(`Sổ phiên bản hỏng cấu trúc: ${ledgerFile} — không tự sửa, cần người xem.`);
    return l;
  }

  async function readCurrent(): Promise<T | undefined> {
    const raw = await readTextOrUndefined(currentFile);
    return raw === undefined ? undefined : opts.parse(raw);
  }

  async function commit(value: T, meta: WriteMeta, restoredFrom?: string): Promise<WriteResult> {
    const ledger0 = (await loadLedger()) ?? newLedger(newObjectId(), opts.subject);
    const contentHash = contentHashOf(value, hash);
    const res = appendRevision(
      ledger0,
      { contentHash, at: meta.at ?? new Date().toISOString(), reason: meta.reason, by: meta.by, restoredFrom },
      hash,
    );
    if (res.unchanged) return { entry: res.entry as RevisionEntry, unchanged: true };
    const entry = res.entry as RevisionEntry;
    const bytes = opts.serialize(value);
    // thứ tự: bản chụp → sổ → hiện hành (crash giữa chừng chỉ để lại thừa, không mất hiện hành)
    await writeFileAtomic(revFile(entry.revisionId), bytes);
    await writeFileAtomic(ledgerFile, serializeLedger(res.ledger));
    await writeFileAtomic(currentFile, bytes);
    return { entry, unchanged: false };
  }

  return {
    read: () => withDirLock(opts.dir, readCurrent),
    write: (value, meta) => withDirLock(opts.dir, () => commit(value, meta)),
    ledger: () => withDirLock(opts.dir, loadLedger),
    readRevision: (revisionId) =>
      withDirLock(opts.dir, async () => {
        const ledger = await loadLedger();
        if (!ledger || !findRevision(ledger, revisionId)) return undefined;
        const raw = await readTextOrUndefined(revFile(revisionId));
        return raw === undefined ? undefined : opts.parse(raw);
      }),
    restore: (revisionId, meta) =>
      withDirLock(opts.dir, async () => {
        const ledger = await loadLedger();
        if (!ledger || !findRevision(ledger, revisionId)) return null;
        const raw = await readTextOrUndefined(revFile(revisionId));
        if (raw === undefined) return null;
        const value = opts.parse(raw);
        if (value === undefined) return null;
        const r = await commit(value, { ...meta, reason: 'restore' }, revisionId);
        return { value, entry: r.entry };
      }),
    verify: () =>
      withDirLock(opts.dir, async () => {
        const ledger = await loadLedger();
        if (!ledger) return { ok: true };
        return verifyChain(ledger, hash);
      }),
  };
}
