/**
 * lib/save-status.ts — trạng thái "đang lưu…/đã lưu" DÙNG CHUNG cho StatusBar (VIỆC A, 28/07).
 *
 * Bám vào autosaver CÓ SẴN (`createSheetsAutosaver`, lib/sheets-persist.ts) qua callback
 * `onSavingChange` — KHÔNG dựng cơ chế theo dõi mới. CAD (`CadSheets.tsx`) và Present
 * (`PresentSheets.tsx`) cùng ghi vào đây; Render (flow graph) chưa có autosave debounce
 * tương đương nên chặng đó StatusBar không hiện mục này (không bịa trạng thái).
 *
 * 2.1.8.n (31/07) — `lastSavedAt` thêm cho chỉ báo "Đã lưu lúc HH:MM" (kiến trúc sư quen AutoCAD
 * không tin autosave nếu không đọc được bằng mắt). Set trong `onSaved` (autosaver báo ghi THẬT
 * sự thành công, `bytes > 0`) — KHÔNG set trong `onSavingChange(false)` vì nhánh đó cũng chạy khi
 * `getRecord()` trả `null` (chưa có gì để lưu), sẽ ghi giờ sai cho 1 lần "lưu" không hề xảy ra.
 *
 * B4 (31/07, mã `4.1.d`) — `diskStatus`/`diskMessage` thêm cho trạng thái ghi ĐĨA (`.idf`/`.idfp`
 * trong thư mục dự án, `lib/disk-sync.ts`), TÁCH KHỎI `status` ở trên (IndexedDB) — đúng bài học
 * sự cố 31/07: "đã lưu" (cache) và "đã ghi đĩa" là HAI việc, HAI trạng thái, không được gộp.
 * `'off'` = chưa bật lưu trữ dự án (không chọn thư mục gốc) — KHÔNG hiện gì ở StatusBar, đúng
 * thiết kế opt-in. `'error'` KHÔNG tự tắt — phải ở lại đến khi tự phục hồi (ghi lại thành công)
 * hoặc người dùng bấm "Kiểm tra kết nối thư mục" (Settings, đã có từ B3).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * 🔴 P0-LUU (05/09, lỗi `A2-03`) — ĐÍCH THỨ BA: MÁY CHỦ. Đây là **cùng một bài học 31/07 lặp lần
 * hai**: một kênh lưu mới mọc thêm mà không ai nới trạng thái, nên nhãn nói về kênh CŨ trong khi
 * việc mất-hay-không-mất do kênh MỚI quyết.
 *
 * Đo tại nguồn trước khi sửa (`docs/delivery/FIX-P0-LUU.md`): bản vẽ 2D có **BA** nơi đến —
 *   ① IndexedDB (`status`/`lastSavedAt`)  — nhanh, nhưng CHẾT THEO HỒ SƠ TRÌNH DUYỆT;
 *   ② đĩa `.idf` (`diskStatus`)           — bền nhất, nhưng **mặc định TẮT** (opt-in chọn thư mục);
 *   ③ máy chủ (`POST /api/project-files`) — **KHÔNG CÓ trạng thái nào đại diện**.
 * Thứ quyết định "mở máy khác / xoá dữ liệu duyệt web có còn bản vẽ không" chính là ③. Nhãn cũ
 * đọc ① rồi ghi "Đã lưu lúc …", nên nó nói đúng về cache mà **nói sai về thứ người dùng đang hỏi**.
 *
 * ⇒ `serverStatus`/`serverSavedAt`/`serverMessage` KHÔNG phải cơ chế thứ tư — nó là **kênh thứ ba
 * của đúng bộ trạng thái này**, cùng khuôn `diskStatus`/`diskMessage` (luật K1 "một việc một chỗ",
 * §B25 NO-REBUILD "EXTEND NEAREST CONTRACT"). Nhịp đẩy nằm ở `taoNhipSaoLuuMayChu`
 * (`lib/sheets-persist.ts`) — cạnh `createSheetsAutosaver`, đúng nơi mọi lịch-ghi của app đã ở.
 *
 * `nhanTrangThaiLuu()` bên dưới là **hàm THUẦN** dựng câu chữ cho StatusBar. Cố ý tách khỏi JSX để
 * luật "nhãn không được nói dối" thành thứ **test khẳng định được**, không phải lời dặn trong
 * docstring: xem `lib/save-status.test.ts` (quét mọi tổ hợp trạng thái, khẳng định KHÔNG tổ hợp nào
 * cho ra câu hứa-bền-vững khi máy chủ chưa nhận).
 */

import { create } from 'zustand';

export type SaveState = 'idle' | 'saving' | 'saved';
export type DiskSyncState = 'off' | 'synced' | 'syncing' | 'error';
/**
 * Trạng thái BẢN SAO MÁY CHỦ (đích ③). Khác `DiskSyncState` đúng một nấc — `'pending'`:
 * có thay đổi ĐÃ nằm trong máy nhưng CHƯA lên máy chủ. Nấc đó là toàn bộ lý do file này phải
 * mở rộng: thiếu nó thì không có cách nào nói câu "mới lưu được trong máy thôi" cho đúng.
 *   · `'off'`     — chặng/route này không có kênh máy chủ (vd mode 3D, `/cad-editor` không dự án);
 *   · `'pending'` — có thay đổi đang chờ đẩy đi;
 *   · `'syncing'` — đang đẩy;
 *   · `'synced'`  — máy chủ ĐÃ NHẬN đúng trạng thái hiện tại;
 *   · `'error'`   — lần đẩy gần nhất hỏng (mạng/quyền/máy chủ) và còn thay đổi treo.
 */
export type ServerSyncState = 'off' | 'pending' | 'syncing' | 'synced' | 'error';

interface SaveStatusState {
  status: SaveState;
  lastSavedAt: number | null;
  diskStatus: DiskSyncState;
  diskMessage: string | null;
  /** P0-LUU — đích ③ máy chủ; xem `ServerSyncState`. */
  serverStatus: ServerSyncState;
  /** Mốc máy chủ NHẬN THẬT lần gần nhất (null = chưa lần nào trong phiên). */
  serverSavedAt: number | null;
  serverMessage: string | null;
  setStatus: (s: SaveState) => void;
  setLastSavedAt: (t: number) => void;
  setDiskStatus: (s: DiskSyncState, message?: string | null) => void;
  setServerStatus: (s: ServerSyncState, message?: string | null) => void;
  setServerSavedAt: (t: number) => void;
}

export const useSaveStatus = create<SaveStatusState>((set) => ({
  status: 'idle',
  lastSavedAt: null,
  diskStatus: 'off',
  diskMessage: null,
  serverStatus: 'off',
  serverSavedAt: null,
  serverMessage: null,
  setStatus: (status) => set({ status }),
  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),
  setDiskStatus: (diskStatus, message) => set({ diskStatus, diskMessage: message ?? null }),
  setServerStatus: (serverStatus, message) => set({ serverStatus, serverMessage: message ?? null }),
  setServerSavedAt: (serverSavedAt) => set({ serverSavedAt }),
}));

/* ─────────────────── NHÃN — hàm THUẦN, nơi luật "không nói dối" sống ─────────────────── */

/** Câu chữ + mức nhấn cho chỉ báo lưu ở StatusBar. `null` = KHÔNG hiện gì (chưa có gì để nói). */
export interface NhanTrangThaiLuu {
  /** Câu ngắn hiện trên thanh trạng thái (≤ 12 từ — `SPEC-NGON-NGU-CHI-DAN` §5). */
  chu: string;
  /** `'canh-bao'` = tô màu cảnh báo (chưa lưu được), `'thuong'` = mực thường. */
  muc: 'thuong' | 'canh-bao';
  /** Câu đầy đủ cho ô giải nghĩa — nói RÕ bản sao nào đã có, bản nào chưa. */
  giaiThich: string;
  /** true khi câu `chu` là LỜI HỨA BỀN VỮNG ("mất máy này vẫn còn"). Test khoá đúng cờ này. */
  huaBenVung: boolean;
}

export interface DauVaoNhanLuu {
  status: SaveState;
  lastSavedAt: number | null;
  serverStatus: ServerSyncState;
  serverSavedAt: number | null;
  serverMessage?: string | null;
}

const hhmm = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Dựng nhãn lưu — **BỐN CÂU, KHÔNG BAO GIỜ CHỒNG NHAU**, xếp theo thứ tự "nói điều YẾU NHẤT
 * còn đúng" (đây là quy tắc, không phải danh sách if tuỳ hứng):
 *
 *   1. đang ghi                        → "Đang lưu…"
 *   2. máy chủ hỏng + còn thay đổi treo → "Chưa lưu lên máy chủ"   ⚠ cảnh báo
 *   3. máy chủ CHƯA nhận trạng thái này → "Đã lưu trong máy"       ← câu cứu cả P0
 *   4. máy chủ ĐÃ nhận                 → "Đã lưu lúc HH:MM"        ← lời hứa bền vững DUY NHẤT
 *
 * 🔴 Vì sao (3) tồn tại: `A2-03` đo được nhãn cũ ghi "Đã lưu lúc 07:5x" ở giây **1,5** trong khi
 * `POST /api/project-files` mãi giây **21,1** mới xảy ra. Câu đó KHÔNG sai về cache — nó sai vì
 * người đọc hiểu là "đóng máy được rồi". Sổ dự án 04/09: *"nút nói dối việc nó vừa làm, tệ hơn
 * nút chết"*. (3) trả lại đúng nghĩa cho khoảng thời gian đó.
 *
 * ⚠️ `serverStatus === 'off'` (mode 3D, `/cad-editor` không dự án) cũng rơi vào (3): ở đó **thật
 * sự** chỉ có bản trong máy, nên nói "Đã lưu trong máy" là đúng — không phải xuống cấp cho an toàn.
 */
export function nhanTrangThaiLuu(v: DauVaoNhanLuu): NhanTrangThaiLuu | null {
  if (v.status === 'saving' || v.serverStatus === 'syncing') {
    return {
      chu: 'Đang lưu…',
      muc: 'thuong',
      giaiThich: 'Đang ghi thay đổi. Chờ một nhịp rồi hãy đóng cửa sổ.',
      huaBenVung: false,
    };
  }
  if (v.serverStatus === 'error') {
    return {
      chu: 'Chưa lưu lên máy chủ',
      muc: 'canh-bao',
      giaiThich:
        (v.serverMessage ? `${v.serverMessage}. ` : '') +
        'Bản vẽ mới nằm trong máy này. Kiểm tra mạng, hoặc bấm ⌘S để thử lại.',
      huaBenVung: false,
    };
  }
  // Chưa từng ghi được gì trong phiên ⇒ KHÔNG hiện gì. Nhãn "Đã lưu" trống trơn (nhánh cũ khi
  // `getRecord()` trả null) là một lời khai cho một lần lưu KHÔNG HỀ XẢY RA.
  if (v.lastSavedAt === null) return null;

  if (v.serverStatus === 'synced' && v.serverSavedAt !== null) {
    return {
      chu: `Đã lưu lúc ${hhmm(v.serverSavedAt)}`,
      muc: 'thuong',
      giaiThich: `Máy chủ đã nhận bản vẽ lúc ${hhmm(v.serverSavedAt)}. Mở ở máy khác vẫn còn.`,
      huaBenVung: true,
    };
  }
  return {
    chu: `Đã lưu trong máy ${hhmm(v.lastSavedAt)}`,
    muc: 'thuong',
    giaiThich:
      v.serverStatus === 'off'
        ? 'Bản vẽ nằm trong trình duyệt này. Chưa có bản sao trên máy chủ.'
        : 'Đang chờ đẩy lên máy chủ. Đóng cửa sổ lúc này thì máy khác chưa thấy bản vẽ.',
    huaBenVung: false,
  };
}
