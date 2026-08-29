'use client';

/**
 * lib/lockscreen.ts — VIỆC 3 UI (04/08, docs/SO-KIEM-TONG.md). Khoá màn kiểu macOS: ⌃⌘Q hoặc
 * tự khoá sau N phút không thao tác. Store zustand thuần (`useLockScreen`) — chỉ 1 cờ `locked`,
 * đọc/ghi ở AppChrome.tsx (nơi TẬP TRUNG mọi phím tắt toàn cục, VIỆC 2) + LockScreen.tsx (UI).
 *
 * KHÔNG có cơ chế mật khẩu cục bộ riêng. File này không tự chế xác thực gì cả.
 *
 * 🔴 ĐÍNH CHÍNH LANE K (22/08): dòng trên TỪNG ghi "`LockScreen.tsx` nhúng thẳng `LoginForm`" —
 * nay KHÔNG CÒN ĐÚNG và cũng không được phép đúng nữa. Khoá ≠ đăng xuất, nên mặt khoá cấm là
 * một form đăng nhập thứ hai (không ô email). Mở lại đi qua `lib/auth/xac-thuc-lai.ts` —
 * xác thực LẠI đúng tài khoản đang mở, dùng lại `POST /api/auth/login` sẵn có, KHÔNG đụng
 * phiên/route/dự án/job đang chạy.
 */

import { create } from 'zustand';
import { useSaveStatus } from './save-status';

/**
 * HAI MỨC KHOÁ — Hoà chốt 29/08. Trước đó chỉ có MỘT mức, và nó đòi mật khẩu trong cả hai
 * tình huống hoàn toàn khác nhau:
 *
 *   `ranh` — MÁY tự khoá vì người dùng rời bàn 15 phút. Người dùng KHÔNG yêu cầu gì cả; đây là
 *            máy tự bảo vệ. Đi pha cà phê rồi quay lại mà phải gõ mật khẩu là **phạt người dùng
 *            vì một việc họ không làm**. ⇒ MỞ BẰNG MỘT NÚT, không mật khẩu.
 *   `tay`  — NGƯỜI dùng chủ động bấm ⌘⇧L (hoặc gọi lệnh "Khoá InteriorFlow"). Đây là một YÊU CẦU
 *            rõ ràng: "che màn hình này lại". Rời máy cho người khác dùng, họp, ra khỏi phòng.
 *            ⇒ ĐÒI mật khẩu, đúng điều người dùng vừa xin.
 *
 * Vì sao đây là sửa LUẬT chứ không phải sửa giao diện: mức bảo vệ phải theo Ý ĐỊNH của người
 * dùng, không theo tiện tay của máy. Bản cũ đối xử hai tình huống như một ⇒ vừa phiền ở ca
 * thường gặp, vừa không hề an toàn hơn ở ca thật sự cần (kẻ ngồi cùng bàn vẫn đợi được 15 phút).
 */
export type LyDoKhoa = 'ranh' | 'tay';

interface LockScreenState {
  locked: boolean;
  /** Vì sao đang khoá. `null` khi chưa khoá. */
  lyDo: LyDoKhoa | null;
  lock: (lyDo?: LyDoKhoa) => void;
  unlock: () => void;
}

export const useLockScreen = create<LockScreenState>((set) => ({
  locked: false,
  lyDo: null,
  // Mặc định `tay` — an toàn mặc định: nơi gọi nào quên khai lý do thì rơi về mức CHẶT hơn,
  // không phải mức lỏng hơn.
  lock: (lyDo: LyDoKhoa = 'tay') => set({ locked: true, lyDo }),
  unlock: () => set({ locked: false, lyDo: null }),
}));

/** Khoá này có đòi mật khẩu không. Một chỗ trả lời, mọi mặt hiện đọc chung. */
export function canMatKhau(lyDo: LyDoKhoa | null): boolean {
  return lyDo !== 'ranh';
}

/** Trần an toàn nếu autosave kẹt/không bao giờ báo xong — không được khoá treo mãi. */
const FORCE_SAVE_MAX_WAIT_MS = 2000;

/**
 * Khoá màn — ÉP AUTOSAVE CHẠY TRƯỚC (yêu cầu cứng của VIỆC 3: "khoá màn KHÔNG được làm mất
 * việc đang làm"). Tái dùng ĐÚNG 2 sự kiện ép-lưu sẵn có — 'cad:force-save-request'
 * (CadCanvas.tsx ⌘S, nghe ở CadSheets.tsx) và 'present:force-save-request' (PresentEditor.tsx
 * ⌘S, nghe ở PresentSheets.tsx) — KHÔNG dựng luồng lưu thứ hai. Bắn cả hai vô điều kiện (không
 * hại gì nếu chặng đó không mount — không ai nghe thì rơi vào chỗ trống); chặng Dựng
 * (flow-graph) chưa có khái niệm "ép lưu" riêng (đúng hiện trạng `lib/shortcuts.ts` VIỆC 2).
 *
 * G-M20-06: bản trước khoá cứng sau 200ms CỐ ĐỊNH — không biết autosave có kịp ghi xong hay
 * chưa (nguy cơ mất dữ liệu nếu ghi lâu hơn 200ms; phí thời gian nếu không có gì để lưu). Sửa
 * bằng cách đợi TÍN HIỆU THẬT thay vì đoán một con số: `useSaveStatus` (lib/save-status.ts) là
 * trạng thái CHUNG mà cả CAD lẫn Present đã ghi vào qua `onSavingChange` từ trước (KHÔNG dựng
 * cơ chế theo dõi mới, không cần sửa CadSheets.tsx/PresentSheets.tsx) — nếu đang `'saving'` thì
 * đợi tới khi rời trạng thái đó, có trần `FORCE_SAVE_MAX_WAIT_MS` phòng autosave kẹt/không mount.
 * Không có gì đang lưu (ca phổ biến nhất) ⇒ khoá gần như ngay, không đợi vô ích.
 */
export function lockScreenNow(lyDo: LyDoKhoa = 'tay'): void {
  window.dispatchEvent(new CustomEvent('cad:force-save-request'));
  window.dispatchEvent(new CustomEvent('present:force-save-request'));

  if (useSaveStatus.getState().status !== 'saving') {
    useLockScreen.getState().lock(lyDo);
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(safety);
    unsubscribe();
    useLockScreen.getState().lock(lyDo);
  };
  const unsubscribe = useSaveStatus.subscribe((s) => {
    if (s.status !== 'saving') finish();
  });
  const safety = window.setTimeout(finish, FORCE_SAVE_MAX_WAIT_MS);
}

/* ---------- Số phút tự khoá khi không thao tác — theo user, chỉnh được ở Cài đặt ---------- */

const IDLE_MINUTES_PREFIX = 'interiorflow.lockIdleMinutes.';
export const DEFAULT_LOCK_IDLE_MINUTES = 15;

/**
 * Số phút hẹn giờ tự khoá — hàm nơi tiêu thụ CŨ (`AppChrome.tsx`) đang gọi, GIỮ NGUYÊN TÊN và
 * chữ ký để không phải sửa nơi đó.
 *
 * 🔴 LANE K (22/08) sửa RUỘT: bản cũ trả thẳng con số trong localStorage và coi mọi giá trị
 * `<= 0` là "hỏng" ⇒ rơi về 15. Nay nấc "Không bao giờ" được lưu bằng số `0`, nên nếu giữ
 * nguyên bản cũ thì chọn "không bao giờ" vẫn bị khoá sau 15 phút — đúng ngược ý người dùng.
 * Ủy quyền hết cho `getLockIdleMinutesEffective` (0 → `NEVER_MINUTES`, xem lý do ở đó).
 */
/**
 * 🔴 §24 (22/08, ĐÈ bản 7-ngày của Lane K): "Không bao giờ" = **KHÔNG CÓ HẸN GIỜ TỰ KHOÁ**.
 * Trả `null` — hợp đồng mới bắt NƠI TIÊU THỤ phải xử nhánh "đừng đặt timer", thay vì nhận một
 * con số nào đó rồi cứ thế `setTimeout`. Bản 7-ngày là GIẢ LẬP: nó vẫn khoá (chỉ là rất lâu),
 * và một hẹn giờ 604.800.000ms sống qua sleep/wake của macOS theo cách không ai kiểm soát.
 * Khoá TAY (⌘⇧L / lệnh) vẫn hoạt động bình thường ở nấc này.
 */
export function getLockIdleMinutes(userId: string): number | null {
  if (!userId) return DEFAULT_LOCK_IDLE_MINUTES;
  const choice = getLockIdleChoice(userId);
  return choice === 0 ? null : choice;
}

export function setLockIdleMinutes(userId: string, minutes: number): void {
  if (!userId || !Number.isFinite(minutes) || minutes <= 0) return;
  try {
    localStorage.setItem(IDLE_MINUTES_PREFIX + userId, String(Math.round(minutes)));
  } catch {
    /* bỏ qua — localStorage bị chặn (private mode…), chỉ mất tiện nghi */
  }
}

/* ═══════════════ LANE K (22/08) — mở rộng, KHÔNG dựng hệ khoá thứ hai ═══════════════
 * Ba thứ thêm ở dưới, đều bám đúng cơ chế đã chạy ở trên:
 *   ① NẤC TỰ KHOÁ 5/15/30/60/Không-bao-giờ (thay ô nhập số tự do ở Cài đặt).
 *   ② CANH TAB Ở NỀN — tab bị ẩn quá hạn thì khoá NGAY KHI QUAY LẠI (hẹn giờ setTimeout của
 *      AppChrome vẫn chạy khi tab ẩn nhưng trình duyệt bóp ga rất mạnh, không tin được).
 *   ③ CỬA EVENT `if:lock-request` — để LỆNH trong sổ lệnh chung (lib/commands/registry.ts)
 *      gọi khoá mà lib/commands/ KHÔNG phải import store/DOM (giữ lib/commands thuần, cùng
 *      khuôn 'cad:zoom-extents' đã có sẵn ở đó).
 *
 * ⚠️ LOCK ≠ LOGOUT: không hàm nào dưới đây đụng phiên đăng nhập, route, store dự án, hay job
 * đang chạy. Khoá chỉ dựng một lớp che (LockScreen.tsx) — cây React phía sau vẫn sống nguyên.
 */

/** Nấc chọn được ở Cài đặt. `0` = KHÔNG BAO GIỜ tự khoá. */
export const LOCK_IDLE_CHOICES = [5, 15, 30, 60, 0] as const;
export type LockIdleChoice = (typeof LOCK_IDLE_CHOICES)[number];

/**
 * "Không bao giờ" quy ra PHÚT cho `getLockIdleMinutes` — 7 ngày.
 * ⚠️ CỐ Ý không dùng 0/Infinity: nơi tiêu thụ duy nhất hôm nay (AppChrome.tsx) làm
 * `setTimeout(..., minutes * 60_000)`, mà `setTimeout` với 0/không-hữu-hạn/quá 2^31−1 ms đều
 * chạy NGAY LẬP TỨC ⇒ chọn "không bao giờ" sẽ hoá ra "khoá tức thì", đúng ngược ý người dùng.
 * 7 ngày = 604.800.000 ms, vẫn dưới trần 2.147.483.647 ms nên hẹn giờ hợp lệ và thực tế không
 * bao giờ tới. Đổi số này phải kiểm lại đúng hai ràng buộc đó.
 */
export const NEVER_MINUTES = 7 * 24 * 60;

/** Nấc NGƯỜI DÙNG chọn (0 = không bao giờ) — cho màn Cài đặt đọc/ghi. */
export function getLockIdleChoice(userId: string): LockIdleChoice {
  if (!userId) return DEFAULT_LOCK_IDLE_MINUTES;
  try {
    const raw = localStorage.getItem(IDLE_MINUTES_PREFIX + userId);
    if (raw === null) return DEFAULT_LOCK_IDLE_MINUTES;
    const n = Number(raw);
    return (LOCK_IDLE_CHOICES as readonly number[]).includes(n)
      ? (n as LockIdleChoice)
      : DEFAULT_LOCK_IDLE_MINUTES;
  } catch {
    return DEFAULT_LOCK_IDLE_MINUTES;
  }
}

export function setLockIdleChoice(userId: string, choice: LockIdleChoice): void {
  if (!userId) return;
  try {
    localStorage.setItem(IDLE_MINUTES_PREFIX + userId, String(choice));
  } catch {
    /* localStorage bị chặn — chỉ mất tiện nghi, không hỏng việc */
  }
}

/**
 * ⛔ LỖI THỜI (22/08, §24) — bản này quy "không bao giờ" thành 7 ngày, tức VẪN KHOÁ. Định nghĩa
 * đúng: không bao giờ = không có hẹn giờ. Giữ hàm cho nơi gọi cũ khỏi vỡ; đường sống là
 * `getLockIdleMinutes` (trả `null` khi Never).
 */
export function getLockIdleMinutesEffective(userId: string): number {
  const choice = getLockIdleChoice(userId);
  return choice === 0 ? NEVER_MINUTES : choice;
}

/** Sự kiện cửa vào của LỆNH "Khoá InteriorFlow" (sổ lệnh chung bắn, LockScreen.tsx nghe). */
export const LOCK_REQUEST_EVENT = 'if:lock-request';

let lanHoatDongCuoi = Date.now();

/**
 * Canh nền cho khoá — gọi MỘT LẦN từ `LockScreen.tsx` (component luôn mount cùng AppChrome).
 * Cố ý đặt ở đây thay vì thêm vào AppChrome: AppChrome đã có hẹn giờ rảnh riêng (VIỆC 3, 04/08)
 * và phần này CỘNG THÊM chứ không thay — hai đường cùng gọi `lockScreenNow()`, mà khoá là thao
 * tác luỹ đẳng (`locked=true` hai lần vẫn là một) nên không có tác dụng phụ.
 */
export function startLockGuard(getIdleMinutes: () => number | null): () => void {
  if (typeof window === 'undefined') return () => {};
  const cham = () => {
    lanHoatDongCuoi = Date.now();
  };
  // Tương tác THẬT — chuột · phím · bút/chạm (pointerdown phủ cả bút Wacom lẫn ngón tay) · cuộn.
  const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'pointerdown', 'wheel', 'touchstart'];
  events.forEach((ev) => window.addEventListener(ev, cham, { passive: true }));

  const khiHienLai = () => {
    if (document.visibilityState !== 'visible') return;
    if (useLockScreen.getState().locked) return;
    const phut = getIdleMinutes();
    // §24 — `null` = Không bao giờ: tab về lại cũng KHÔNG khoá. (Nhánh `>= NEVER_MINUTES` giữ
    // cho nơi gọi cũ còn dùng bản Effective; đường sống trả null từ trước khi tới đây.)
    if (phut === null || phut >= NEVER_MINUTES) return;
    if (Date.now() - lanHoatDongCuoi >= phut * 60_000) lockScreenNow('ranh');   // MÁY tự khoá
    else cham();
  };
  document.addEventListener('visibilitychange', khiHienLai);

  const khiCoLenh = () => lockScreenNow('tay');   // NGƯỜI chủ động gọi lệnh / bấm ⌘⇧L
  window.addEventListener(LOCK_REQUEST_EVENT, khiCoLenh);

  return () => {
    events.forEach((ev) => window.removeEventListener(ev, cham));
    document.removeEventListener('visibilitychange', khiHienLai);
    window.removeEventListener(LOCK_REQUEST_EVENT, khiCoLenh);
  };
}
