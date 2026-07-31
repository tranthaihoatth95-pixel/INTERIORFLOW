'use client';

/**
 * lib/disk-sync.ts — B4 (ĐỢT B lớp lưu trữ, mã `4.1.d`): hạ tầng CHUNG "đảo nguồn sự thật" cho cả
 * CAD (`.idf`) và Present (`.idfp`) — tệp trong thư mục dự án là NGUỒN, IndexedDB tụt xuống CACHE.
 *
 * KHÔNG phụ thuộc `Doc`/`EditorDeck` cụ thể — `CadSheets.tsx`/`PresentSheets.tsx` tự đóng gói
 * build/parse JSON riêng (`exportIdf`/`importIdf` hay `exportIdfp`/`importIdfp`) rồi gọi các hàm
 * THUẦN ở đây để QUYẾT ĐỊNH, không lặp lại logic quyết định ở 2 nơi (Luật Đồng Bộ #6).
 *
 * Bốn bổ sung Hoà chốt (31/07, ngay khi gật kế hoạch B4 — đọc kỹ trước khi sửa gì ở đây):
 *  ① `TIE_TOLERANCE_MS` — 2 mốc thời gian so sánh KHÔNG nguyên tử (`modifiedAt` đặt lúc
 *     serialize .idf/.idfp, `IndexedDB.ts` đặt lúc ghi record IndexedDB — luôn lệch vài trăm ms
 *     sau MỌI lượt lưu bình thường). So sánh chính xác tuyệt đối sẽ RUNG (lúc bảo đĩa mới, lúc
 *     bảo cache mới). Lệch trong ngưỡng ⇒ `tie` ⇒ DÙNG CACHE (thứ người dùng đang nhìn — không
 *     bao giờ thay thứ đang nhìn bằng thứ NGANG TUỔI).
 *  ② Đĩa PARSE ĐƯỢC nhưng SỐ SHEET ÍT HƠN cache ⇒ nghi ghi dở (sập máy/công cụ đồng bộ cắt
 *     ngang/tự sửa tay) — bước ghi-rồi-đọc-lại chỉ bảo vệ được LƯỢT GHI CỦA CHÍNH MÌNH, không
 *     bảo vệ file đã hỏng sẵn từ trước. KHÔNG thay im lặng — trả `disk-incomplete`, caller phải
 *     báo rõ + giữ cache (đúng lớp lỗi mất-dữ-liệu-im-lặng vừa đóng ở B3).
 *  ③ `createDiskWriter` là THROTTLE (ghi trong vòng `intervalMs` kể từ lần `touch()` ĐẦU của đợt
 *     dồn dập), KHÔNG phải debounce — debounce sẽ hoãn vô thời hạn nếu gõ liên tục. `flushNow()`
 *     bỏ qua nhịp, ghi ngay — dùng cho ⌘S/rời trang/đóng tab. HỆ QUẢ: giữa 2 lượt ghi đĩa, đĩa
 *     CŨ HƠN cache vài giây là TRẠNG THÁI BÌNH THƯỜNG, không phải lỗi — phép so sánh ① CHỈ chạy
 *     lúc mount/hydrate (nạp lần đầu), KHÔNG chạy liên tục trong lúc đang sửa, nên không báo
 *     động giả theo nhịp ghi đĩa chậm hơn IndexedDB.
 *  ④ `watchProjectPresence` — CHỈ phát hiện + báo "dự án đang mở ở tab khác", KHÔNG giải bài
 *     khoá/gộp đa tab (Hoà xác nhận ngoài phạm vi B4). Im lặng không phải lựa chọn — nên đây LÀ
 *     hạ tầng bắt buộc có, dù chỉ dừng ở mức cảnh báo.
 */

export const TIE_TOLERANCE_MS = 2000;

export type DiskResolution =
  | { kind: 'disk' }
  | { kind: 'cache'; reason: 'tie' | 'cache-newer' | 'disk-unreadable' | 'disk-incomplete' };

/**
 * So khớp NGUỒN NÀO thắng lúc nạp (mount/hydrate) — THUẦN, test được không cần IndexedDB/File
 * System Access thật. `diskModifiedAtMs`/`diskSheetCount` = `null` khi KHÔNG đọc được đĩa (chưa
 * chọn thư mục gốc/chưa có file/mất quyền/JSON hỏng — mọi lý do gộp về 1 nhánh `disk-unreadable`,
 * vì hành động đúng đều giống nhau: dùng cache, không có gì để so sánh).
 */
export function resolveSourceOfTruth(params: {
  diskModifiedAtMs: number | null;
  cacheTs: number;
  diskSheetCount: number | null;
  cacheSheetCount: number;
}): DiskResolution {
  const { diskModifiedAtMs, cacheTs, diskSheetCount, cacheSheetCount } = params;
  if (diskModifiedAtMs === null) return { kind: 'cache', reason: 'disk-unreadable' };
  // ② — đĩa đọc được nhưng THIẾU sheet so với cache: có thể ghi dở/hỏng, không tự thay.
  if (diskSheetCount !== null && diskSheetCount < cacheSheetCount) {
    return { kind: 'cache', reason: 'disk-incomplete' };
  }
  const diff = diskModifiedAtMs - cacheTs;
  // ① — lệch trong ngưỡng dung sai: coi là NGANG TUỔI, giữ nguyên cache (thứ đang hiển thị).
  if (Math.abs(diff) <= TIE_TOLERANCE_MS) return { kind: 'cache', reason: 'tie' };
  return diff > 0 ? { kind: 'disk' } : { kind: 'cache', reason: 'cache-newer' };
}

export interface DiskWriteResult {
  ok: boolean;
  reason?: string;
}

export interface DiskWriter {
  /** Đánh dấu "có thay đổi" — ghi trong vòng `intervalMs` kể từ lần touch ĐẦU (throttle). */
  touch: () => void;
  /** Ép ghi NGAY, bỏ qua nhịp chờ — ⌘S/beforeunload/visibilitychange(hidden). */
  flushNow: () => void;
  dispose: () => void;
}

/**
 * Ghi đĩa THEO NHỊP RIÊNG, chậm hơn IndexedDB (③) — throttle, không debounce. `write()` do caller
 * đóng gói toàn bộ (build JSON qua exportIdf/exportIdfp + getProjectFolderHandle + writeTextFile),
 * hàm này chỉ lo NHỊP GỌI, không biết gì về định dạng .idf/.idfp.
 */
export function createDiskWriter(
  write: () => Promise<DiskWriteResult>,
  opts?: { intervalMs?: number; onStatus?: (r: DiskWriteResult & { at: number }) => void },
): DiskWriter {
  const intervalMs = Math.max(3000, opts?.intervalMs ?? 10_000);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let writing = false;

  const run = () => {
    timer = null;
    if (!dirty || writing) return;
    dirty = false;
    writing = true;
    void write()
      .then((r) => opts?.onStatus?.({ ...r, at: Date.now() }))
      .finally(() => {
        writing = false;
        // Có thay đổi mới phát sinh trong lúc đang ghi ⇒ lên lịch lượt kế, không rơi mất.
        if (dirty && !timer) timer = setTimeout(run, intervalMs);
      });
  };

  return {
    touch: () => {
      dirty = true;
      if (!timer && !writing) timer = setTimeout(run, intervalMs);
    },
    flushNow: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      dirty = true;
      run();
    },
    dispose: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      dirty = false;
    },
  };
}

export interface ProjectPresenceHandle {
  dispose: () => void;
}

const PRESENCE_HEARTBEAT_MS = 4000;
const PRESENCE_TTL_MS = 12_000; // ≥ 2× nhịp heartbeat — chịu được rớt 1 nhịp

/**
 * ④ — Phát hiện (KHÔNG khoá/giải quyết) 2 tab cùng mở 1 dự án qua `BroadcastChannel` theo
 * `bucketId`. `onOtherTabOpen(true/false)` báo khi phát hiện/mất tab khác — dùng để hiện banner
 * cảnh báo, KHÔNG chặn thao tác, KHÔNG tự gộp/khoá (ngoài phạm vi B4).
 *
 * BUG BẮT ĐƯỢC KHI BROWSER-VERIFY (31/07): bản đầu CHỈ gửi `'bye'` lúc `beforeunload` — tab đóng
 * KHÔNG SẠCH (crash/force-quit/OS kill trình duyệt, hoặc verify thấy `beforeunload` không luôn
 * chạy khi đóng tab bằng công cụ tự động — thực tế tương đương "đóng không sạch") ⇒ banner cảnh
 * báo TREO VĨNH VIỄN dù tab kia đã mất từ lâu — chính là loại lỗi "im lặng/sai trạng thái" mà cả
 * B4 sinh ra để tránh. Sửa: chuyển sang HEARTBEAT + TTL (mẫu chuẩn cho presence-detection, không
 * tự nghĩ cơ chế lạ) — mỗi tab tự phát `'hello'` lặp lại mỗi `PRESENCE_HEARTBEAT_MS`, quét định kỳ
 * xoá tab nào không thấy tin trong `PRESENCE_TTL_MS`. `'bye'` lúc unload CHỈ còn là đường tắt dọn
 * NHANH khi có (best-effort), KHÔNG còn là cơ chế duy nhất — tab biến mất kiểu nào cũng tự hết hạn.
 */
export function watchProjectPresence(bucketId: string, onOtherTabOpen: (present: boolean) => void): ProjectPresenceHandle {
  if (typeof BroadcastChannel === 'undefined' || !bucketId) {
    return { dispose: () => {} };
  }
  const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channel = new BroadcastChannel(`interiorflow-presence:${bucketId}`);
  const lastSeen = new Map<string, number>();

  const updatePresence = () => onOtherTabOpen(lastSeen.size > 0);

  const sweep = () => {
    const cutoff = Date.now() - PRESENCE_TTL_MS;
    let changed = false;
    for (const [id, seenAt] of lastSeen) {
      if (seenAt < cutoff) {
        lastSeen.delete(id);
        changed = true;
      }
    }
    if (changed) updatePresence();
  };

  channel.onmessage = (ev) => {
    const msg = ev.data as { type: 'hello' | 'bye' | 'ack'; tabId: string } | undefined;
    if (!msg || msg.tabId === tabId) return;
    if (msg.type === 'bye') {
      lastSeen.delete(msg.tabId);
    } else {
      lastSeen.set(msg.tabId, Date.now());
      if (msg.type === 'hello') channel.postMessage({ type: 'ack', tabId });
    }
    updatePresence();
  };

  const announce = () => channel.postMessage({ type: 'hello', tabId });
  announce();
  const heartbeat = setInterval(announce, PRESENCE_HEARTBEAT_MS);
  const sweepTimer = setInterval(sweep, PRESENCE_HEARTBEAT_MS);

  const onUnload = () => channel.postMessage({ type: 'bye', tabId }); // best-effort, không phụ thuộc vào nó
  window.addEventListener('beforeunload', onUnload);

  return {
    dispose: () => {
      onUnload();
      window.removeEventListener('beforeunload', onUnload);
      clearInterval(heartbeat);
      clearInterval(sweepTimer);
      channel.close();
    },
  };
}
