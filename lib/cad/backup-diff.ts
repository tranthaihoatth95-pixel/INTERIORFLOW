/**
 * lib/cad/backup-diff.ts — B3 (30/07, sửa TRƯỚC khi thử sập, theo yêu cầu Hoà): thay "5 bản gần
 * nhất" (chỉ 50 phút lịch sử) bằng lưu CHÊNH LỆCH + giữ theo THANG THỜI GIAN (~60-80 bản phủ
 * TOÀN BỘ đời dự án, không phải 20GB/năm/dự án nếu lưu bản đầy đủ mỗi 10 phút mãi mãi).
 *
 * TÁCH BẠCH THUẦN/FS (giống `namesToPrune()` cũ, xem auto-backup.ts): mọi hàm ở đây KHÔNG đụng
 * File System Access API/IndexedDB — nhận/trả dữ liệu thuần, test được bằng sucrase-node không
 * cần mock trình duyệt. `auto-backup.ts` là lớp keo mỏng gọi các hàm này rồi mới chạm FS thật.
 *
 * BẤT BIẾN BẮT BUỘC (Hoà nhấn mạnh, đây là hạ tầng chống-mất-dữ-liệu — sai ở đây là mất thật):
 * "mỗi mốc đầy đủ phải TỰ ĐỨNG ĐƯỢC — mất 1 diff không được kéo sập cả chuỗi." Cụ thể:
 *  - Khi TỈA (planRetention): một diff được GIỮ nhưng phần chuỗi dẫn tới nó (từ full gần nhất)
 *    có đoạn bị XOÁ → diff đó phải được "đúc" (materialize) thành 1 bản full MỚI TRƯỚC khi xoá
 *    phần chuỗi phía trước — không bao giờ để 1 bản giữ lại mà không tự đứng được.
 *  - Khi PHỤC HỒI (reconstructUpTo): gặp 1 entry thiếu/hỏng giữa chuỗi → DỪNG NGAY, trả về trạng
 *    thái đã ráp được tới NGAY TRƯỚC entry hỏng đó (không cố nhảy qua lỗ hổng ráp tiếp — sẽ ra
 *    trạng thái SAI mà tưởng là đúng, nguy hiểm hơn cả không phục hồi được). Nếu bản full-mốc bản
 *    thân nó cũng hỏng → lùi tiếp về mốc full TRƯỚC ĐÓ nữa, không bao giờ throw.
 */

import type { IdfSheetData } from './idf';
import type { Doc, Entity } from './model';

/* ═══════════════════════════ ① Diff/Apply theo entity, không phải byte ═══════════════════════════ */

export interface SheetDiffEntry {
  sheetId: string;
  /** sheet bị xoá hoàn toàn khỏi dự án — không kèm field nào khác. */
  removed?: true;
  /** sheet MỚI, hoặc field khác `entities` đã đổi (layers/viewport/paperKey/markups/...) — lưu
   * NGUYÊN cả sheet thay vì diff từng field (đơn giản, chắc đúng — các field này nhỏ và ít đổi
   * so với entities, diff riêng từng field không đáng công, dễ sai). */
  full?: IdfSheetData;
  /** entity thêm MỚI hoặc đã ĐỔI (so khớp theo id) — chỉ có khi không `full`/`removed`. */
  upsertEntities?: Entity[];
  /** id entity đã bị xoá — chỉ có khi không `full`/`removed`. */
  removeEntityIds?: string[];
}

export interface BackupDiff {
  sheets: SheetDiffEntry[];
}

function docWithoutEntities(d: Doc): Omit<Doc, 'entities'> {
  const clone: Doc = { ...d };
  delete (clone as Partial<Doc>).entities;
  return clone;
}

function docNonEntitiesEqual(a: Doc, b: Doc): boolean {
  return JSON.stringify(docWithoutEntities(a)) === JSON.stringify(docWithoutEntities(b));
}

/** So `prev` (trạng thái backup TRƯỚC) với `next` (trạng thái vừa lưu) → diff tối giản. Sheet
 * không đổi gì hoàn toàn KHÔNG xuất hiện trong kết quả (tiết kiệm, đúng tinh thần "diff"). */
export function diffSheets(prev: IdfSheetData[], next: IdfSheetData[]): BackupDiff {
  const prevById = new Map(prev.map((s) => [s.id, s]));
  const nextIds = new Set(next.map((s) => s.id));
  const sheets: SheetDiffEntry[] = [];

  for (const s of prev) {
    if (!nextIds.has(s.id)) sheets.push({ sheetId: s.id, removed: true });
  }

  for (const s of next) {
    const p = prevById.get(s.id);
    if (!p) {
      sheets.push({ sheetId: s.id, full: s });
      continue;
    }
    if (p.name !== s.name || !docNonEntitiesEqual(p.doc, s.doc)) {
      sheets.push({ sheetId: s.id, full: s });
      continue;
    }
    const prevEntById = new Map(p.doc.entities.map((e) => [e.id, e]));
    const nextEntIds = new Set(s.doc.entities.map((e) => e.id));
    const upsertEntities: Entity[] = [];
    for (const e of s.doc.entities) {
      const pe = prevEntById.get(e.id);
      if (!pe || JSON.stringify(pe) !== JSON.stringify(e)) upsertEntities.push(e);
    }
    const removeEntityIds: string[] = [];
    for (const e of p.doc.entities) if (!nextEntIds.has(e.id)) removeEntityIds.push(e.id);
    if (upsertEntities.length || removeEntityIds.length) {
      sheets.push({
        sheetId: s.id,
        upsertEntities: upsertEntities.length ? upsertEntities : undefined,
        removeEntityIds: removeEntityIds.length ? removeEntityIds : undefined,
      });
    }
  }

  return { sheets };
}

/** Áp `diff` lên `base` → trạng thái mới. KHÔNG mutate `base`. Entry tham chiếu sheet không tồn
 * tại trong `base` (diff hỏng/lệch ngữ cảnh) → bỏ qua entry đó, không throw (an toàn phục hồi). */
export function applyDiff(base: IdfSheetData[], diff: BackupDiff): IdfSheetData[] {
  const byId = new Map(base.map((s) => [s.id, s]));
  const order = base.map((s) => s.id);

  for (const entry of diff.sheets) {
    if (entry.removed) {
      byId.delete(entry.sheetId);
      continue;
    }
    if (entry.full) {
      if (!byId.has(entry.sheetId)) order.push(entry.sheetId);
      byId.set(entry.sheetId, entry.full);
      continue;
    }
    const existing = byId.get(entry.sheetId);
    if (!existing) continue;
    let entities = existing.doc.entities;
    if (entry.removeEntityIds?.length) {
      const removeSet = new Set(entry.removeEntityIds);
      entities = entities.filter((e) => !removeSet.has(e.id));
    }
    if (entry.upsertEntities?.length) {
      const upsertById = new Map(entry.upsertEntities.map((e) => [e.id, e]));
      entities = entities.map((e) => upsertById.get(e.id) ?? e);
      for (const e of entry.upsertEntities) if (!entities.some((x) => x.id === e.id)) entities.push(e);
    }
    byId.set(entry.sheetId, { ...existing, doc: { ...existing.doc, entities } });
  }

  return order.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

/* ═══════════════════════════ ② Thang giữ theo thời gian, không đếm số bản ═══════════════════════════ */

/** Ngưỡng thang thời gian (ms) — Hoà chốt 30/07: 1 giờ giữ MỌI bản · 24 giờ 1 bản/giờ · 30 ngày
 * 1 bản/ngày · xa hơn 1 bản/tuần KHÔNG giới hạn. Vào CONFIG, không hard-code rải rác. */
export const RETENTION_TIERS = {
  keepAllWithinMs: 60 * 60 * 1000,
  hourlyWithinMs: 24 * 60 * 60 * 1000,
  dailyWithinMs: 30 * 24 * 60 * 60 * 1000,
} as const;

/** Cứ 20 bản ghi 1 mốc đầy đủ (Hoà chốt) — vào CONFIG. */
export const FULL_SNAPSHOT_EVERY = 20;

export type BackupKind = 'full' | 'diff';

export interface BackupEntry {
  name: string;
  timestampMs: number;
  kind: BackupKind;
}

const FULL_EXT = '.ifpack';
const DIFF_EXT = '.ifdiff.json';

/** Tên file backup từ projectId+thời điểm+loại — cùng quy ước cũ (`<projectId>_<YYYYMMDD-HHmmss>`,
 * sort chuỗi = sort thời gian) + đuôi phân biệt full/diff. */
export function backupFileName(projectId: string, timestampMs: number, kind: BackupKind): string {
  const d = new Date(timestampMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${projectId}_${ts}${kind === 'full' ? FULL_EXT : DIFF_EXT}`;
}

/** Ngược lại `backupFileName()` — `null` nếu tên không đúng quy ước (file lạ trong thư mục). */
export function parseBackupFileName(name: string): BackupEntry | null {
  const m = /^.+_(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.(ifpack|ifdiff\.json)$/.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, ext] = m;
  const timestampMs = new Date(+y, +mo - 1, +d, +h, +mi, +s).getTime();
  if (Number.isNaN(timestampMs)) return null;
  return { name, timestampMs, kind: ext === 'ifpack' ? 'full' : 'diff' };
}

/** Khoá gộp nhóm cho 1 mốc thời gian, theo đúng bậc thang đang áp dụng tại thời điểm `nowMs`.
 * `null` = còn trong vùng "giữ MỌI bản" (không gộp nhóm gì cả). */
function bucketKey(timestampMs: number, nowMs: number): string | null {
  const age = nowMs - timestampMs;
  if (age < RETENTION_TIERS.keepAllWithinMs) return null;
  const d = new Date(timestampMs);
  if (age < RETENTION_TIERS.hourlyWithinMs) return `h:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
  if (age < RETENTION_TIERS.dailyWithinMs) return `d:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  // Tuần: gộp theo số tuần kể từ epoch (đơn giản hoá — không cần đúng chuẩn ISO-8601 tuần lịch,
  // chỉ cần NHÓM ỔN ĐỊNH theo khối 7 ngày liên tục để tỉa bớt, không phải lịch hiển thị).
  return `w:${Math.floor(timestampMs / (7 * 24 * 60 * 60 * 1000))}`;
}

export interface RetentionPlan {
  /** tên các entry PHẢI xoá. */
  deleteNames: string[];
  /** tên các entry (diff) PHẢI đúc thành full TRƯỚC KHI xoá bất kỳ gì — mất tính tự-đứng-được
   * nếu không đúc, vì phần chuỗi dẫn tới nó sắp bị xoá. Nội dung full tương ứng nằm ở
   * `materialized` (đã ráp sẵn, ghi thẳng ra FS là xong, không cần ráp lại lần 2). */
  materialize: { name: string; sheets: IdfSheetData[] }[];
}

/**
 * Lập kế hoạch tỉa theo thang thời gian — THUẦN, không đụng FS. `entries` là TOÀN BỘ backup hiện
 * có của 1 dự án (đã biết `kind` từ tên file), PHẢI đưa kèm hàm `loadDiffOrFull` để hàm này tự
 * ráp trạng thái từng điểm khi cần đúc (materialize) — không đọc trước toàn bộ nội dung vào bộ
 * nhớ nếu không cần (dự án lớn, nhiều bản, tránh tốn RAM oan).
 */
export function planRetention(
  entries: BackupEntry[],
  nowMs: number,
  loadContent: (name: string, kind: BackupKind) => IdfSheetData[] | BackupDiff,
): RetentionPlan {
  const sorted = [...entries].sort((a, b) => a.timestampMs - b.timestampMs);

  // Bước 1 — quyết GIỮ/XOÁ theo bucket (bucket null luôn giữ; bucket khác giữ đại diện MỚI NHẤT).
  const keep = new Array<boolean>(sorted.length).fill(false);
  const latestIndexByBucket = new Map<string, number>();
  sorted.forEach((e, i) => {
    const key = bucketKey(e.timestampMs, nowMs);
    if (key === null) {
      keep[i] = true;
      return;
    }
    const cur = latestIndexByBucket.get(key);
    if (cur === undefined || sorted[cur].timestampMs < e.timestampMs) latestIndexByBucket.set(key, i);
  });
  for (const i of latestIndexByBucket.values()) keep[i] = true;
  if (sorted.length) keep[sorted.length - 1] = true; // bản mới nhất luôn giữ, an toàn tuyệt đối

  // Bước 2 — dry-run ráp trạng thái tại MỌI vị trí (dùng file gốc, CHƯA xoá gì) + ghi lại mốc
  // full gần nhất của từng vị trí, để biết đoạn chuỗi nào sắp gãy nếu tỉa theo bước 1.
  const stateAt: (IdfSheetData[] | null)[] = new Array(sorted.length).fill(null);
  const anchorIndexAt: number[] = new Array(sorted.length).fill(-1);
  let anchorIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].kind === 'full') {
      stateAt[i] = loadContent(sorted[i].name, 'full') as IdfSheetData[];
      anchorIdx = i;
    } else {
      const prevState = i > 0 ? stateAt[i - 1] : null;
      stateAt[i] = prevState ? applyDiff(prevState, loadContent(sorted[i].name, 'diff') as BackupDiff) : null;
    }
    anchorIndexAt[i] = anchorIdx;
  }

  // Bước 3 — entry GIỮ mà là diff, và đoạn [anchor..i-1] có chỗ XOÁ → phải đúc thành full.
  const materialize: { name: string; sheets: IdfSheetData[] }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (!keep[i] || sorted[i].kind !== 'diff') continue;
    const anchor = anchorIndexAt[i];
    let broken = anchor < 0 || !keep[anchor];
    if (!broken) for (let k = anchor + 1; k < i; k++) if (!keep[k]) { broken = true; break; }
    if (broken && stateAt[i]) materialize.push({ name: sorted[i].name, sheets: stateAt[i]! });
  }

  const deleteNames = sorted.filter((_, i) => !keep[i]).map((e) => e.name);
  return { deleteNames, materialize };
}

/* ═══════════════════════════ ③ Phục hồi — ráp trạng thái tại 1 điểm bất kỳ ═══════════════════════════ */

export interface ReconstructResult {
  sheets: IdfSheetData[];
  /** true = KHÔNG ráp được trọn tới đúng điểm yêu cầu (thiếu/hỏng entry giữa chuỗi) — `sheets`
   * là trạng thái TỐT NHẤT đã ráp được TRƯỚC chỗ gãy, không phải điểm người dùng chọn. */
  degraded: boolean;
  /** tên entry thật sự dùng làm kết quả cuối (mốc gần nhất ráp được) — hiện cho người dùng biết
   * chính xác đang xem bản nào, tránh tưởng nhầm là bản mới nhất họ chọn. */
  recoveredAsOf: string | null;
}

/**
 * Ráp trạng thái tại `entries[targetIndex]` (đã sort theo thời gian). Gặp entry thiếu/hỏng
 * (`loadContent` trả `null`) ở BẤT KỲ đâu trên đường đi → DỪNG NGAY, trả về trạng thái TRƯỚC đó —
 * không nhảy qua lỗ hổng ráp tiếp (sẽ ra bản SAI mà tưởng đúng). Mốc full bản thân cũng hỏng →
 * tự lùi về mốc full TRƯỚC ĐÓ thử tiếp, không throw.
 */
export function reconstructUpTo(
  entries: BackupEntry[],
  targetIndex: number,
  loadContent: (name: string, kind: BackupKind) => IdfSheetData[] | BackupDiff | null,
): ReconstructResult {
  if (targetIndex < 0 || targetIndex >= entries.length) return { sheets: [], degraded: true, recoveredAsOf: null };

  let anchorIdx = targetIndex;
  while (anchorIdx >= 0 && entries[anchorIdx].kind !== 'full') anchorIdx--;

  while (anchorIdx >= 0) {
    const anchorContent = loadContent(entries[anchorIdx].name, 'full');
    if (anchorContent) {
      let state = anchorContent as IdfSheetData[];
      let lastGoodIdx = anchorIdx;
      let brokeMidway = false;
      for (let i = anchorIdx + 1; i <= targetIndex; i++) {
        const diffContent = loadContent(entries[i].name, 'diff');
        if (!diffContent) {
          brokeMidway = true;
          break;
        }
        state = applyDiff(state, diffContent as BackupDiff);
        lastGoodIdx = i;
      }
      return { sheets: state, degraded: brokeMidway, recoveredAsOf: entries[lastGoodIdx].name };
    }
    // mốc full này hỏng — lùi về mốc full TRƯỚC ĐÓ (nếu có) thử lại.
    anchorIdx--;
    while (anchorIdx >= 0 && entries[anchorIdx].kind !== 'full') anchorIdx--;
  }

  return { sheets: [], degraded: true, recoveredAsOf: null };
}

/* ═══════════════════════════ ④ Hiển thị theo thang, không danh sách phẳng ═══════════════════════════ */

const WEEKDAY_VI = ['Chủ Nhật', 'thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy'];

/** "10 phút trước · 1 giờ trước · hôm qua 15:20 · thứ Hai · tuần trước" — Hoà chốt 30/07: 1.000
 * dòng thời gian giống hệt nhau khó dùng hơn 5 dòng có nghĩa. */
export function formatBackupRelativeTime(timestampMs: number, nowMs: number): string {
  const ageMs = nowMs - timestampMs;
  const ageMin = Math.floor(ageMs / 60_000);
  if (ageMin < 1) return 'vừa xong';
  if (ageMin < 60) return `${ageMin} phút trước`;
  const ageHour = Math.floor(ageMin / 60);
  if (ageHour < 24) return `${ageHour} giờ trước`;

  const d = new Date(timestampMs);
  const now = new Date(nowMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayDiff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (dayDiff === 1) return `hôm qua ${hhmm}`;
  if (dayDiff < 7) return `${WEEKDAY_VI[d.getDay()]} ${hhmm}`;
  if (dayDiff < 14) return 'tuần trước';
  const weekAgo = Math.floor(dayDiff / 7);
  if (dayDiff < 30) return `${weekAgo} tuần trước`;
  const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (monthDiff < 12) return `${monthDiff} tháng trước`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
