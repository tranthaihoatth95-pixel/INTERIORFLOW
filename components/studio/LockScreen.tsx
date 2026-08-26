'use client';

/**
 * components/studio/LockScreen.tsx — MÀN KHOÁ (VIỆC 3 UI 04/08 · viết lại ruột Lane K 22/08).
 *
 * ⛔ LUẬT NỀN — KHOÁ ≠ ĐĂNG XUẤT. Khoá chỉ dựng MỘT LỚP CHE trên cùng (portal, z-[99]): chặn
 * NHÌN và THAO TÁC, hết. Không điều hướng, không `setUser(null)`, không xoá cookie phiên,
 * không unmount cây React phía sau ⇒ giữ nguyên: phiên · dự án đang mở · workspace/chặng ·
 * camera · zoom · vùng chọn · cửa sổ công cụ đang mở · bố cục · VÀ MỌI JOB RENDER/GENERATE ĐANG
 * CHẠY (không có một dòng nào ở đây huỷ job — `lockScreenNow()` chỉ ép autosave rồi bật cờ).
 *
 * 🔴 ĐỔI SO VỚI BẢN CŨ (22/08): bản cũ nhúng thẳng `LoginForm` vào mặt khoá ⇒ mặt khoá đọc ra
 * như MỘT MÀN ĐĂNG NHẬP THỨ HAI (ô email + tab Đăng ký + 3 nút OAuth) — sai bản chất, vì phiên
 * chưa hề mất. Nay mặt khoá theo đúng thứ bậc: **GIỜ → NGỮ CẢNH (dự án · chặng) → MỘT DÒNG
 * NGẮN → Mở lại ↵**, tuyệt đối không ô email/mật khẩu. Bằng chứng "vẫn là anh" nằm ở MẶT SAU
 * của thẻ (`components/auth/TheXacThucLai.tsx`), chỉ lộ ra khi người dùng chủ động mở lại.
 *
 * CHUYỂN CẢNH (§6): khoá vào = thẻ xác thực **lật 180° quanh trục Y** để hiện mặt khoá; mở lại =
 * lật ngược về mặt xác thực. Lật ở đây NÓI "đổi trạng thái", không phải hiệu ứng lặp trang trí —
 * mỗi lần khoá/mở chỉ lật đúng một lần. `prefers-reduced-motion` ⇒ NHÁNH TĨNH THẬT: không xoay,
 * không nghiêng, đổi mặt tức thì (xem `reduce` bên dưới).
 *
 * PORTAL RA document.body (bắt buộc, luật K4 `docs/00-CHOT.md`): `<header className="nen-mo-header">`
 * có `backdrop-filter`, mà `backdrop-filter` trên tổ tiên biến nó thành containing block MỚI cho
 * con `position:fixed` — lồng trong header thì lớp che chỉ hiện một mẩu ở góc (đã bắt được lúc
 * verify browser thật, đừng bỏ portal).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Lock, CornerDownLeft } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useLockScreen, startLockGuard, getLockIdleMinutes, LOCK_REQUEST_EVENT } from '@/lib/lockscreen';
import { getLastUserId } from '@/lib/resume';
import { TheXacThucLai } from '@/components/auth/TheXacThucLai';
import { useLang, useT } from '@/lib/i18n';
import { easeApple } from '@/lib/motion';
import { findAppCommand, matchKeyToken } from '@/lib/commands/registry';

function useClock(): string {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return '--:--';
  return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Dòng ngắn trong ngày — cố định theo NGÀY (cả ngày một câu, qua ngày mới đổi; không băng
 * chuyền, không đổi mỗi lần khoá). Chỉ ba giọng được phép: suy nghĩ nghề · chào theo buổi ·
 * một câu IF điềm tĩnh. CẤM khẩu hiệu năng suất, quảng cáo, trích dẫn gán tên tác giả.
 */
const DAILY_LINES: [string, string][] = [
  ['Bản vẽ đẹp nhất là bản vẽ đo được.', 'The most beautiful drawing is the one that measures true.'],
  ['Ánh sáng kể giờ, vật liệu kể chất.', 'Light tells the hour, material tells the truth.'],
  ['Chi tiết là nơi sự tôn trọng hiện ra.', 'Detail is where respect becomes visible.'],
  ['Một nguồn sự thật, ba cách nhìn.', 'One source of truth, three ways of seeing.'],
  ['Không gian tốt bắt đầu từ ràng buộc rõ.', 'Good space begins with a clear constraint.'],
  ['Sự đơn giản là kết quả, không phải điểm xuất phát.', 'Simplicity is a result, not a starting point.'],
  ['Đo hai lần, dựng một lần.', 'Measure twice, build once.'],
  ['Vật liệu thật không cần tô vẽ thêm.', 'True material needs no further ornament.'],
  ['Tỉ lệ đúng thắng mọi trang trí.', 'Right proportion outlasts every decoration.'],
  ['Bản vẽ là lời hứa với người thi công.', 'A drawing is a promise kept to the builder.'],
  ['Nghề nội thất là quản lý ánh sáng và bóng đổ.', 'Interior design is the management of light and shadow.'],
  ['Chậm mà đúng, còn hơn nhanh mà phải sửa lại.', 'Slow and right beats fast and redone.'],
];
function dailyLine(): [string, string] {
  const d = new Date();
  const dayOfYear = Math.floor(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000,
  );
  return DAILY_LINES[dayOfYear % DAILY_LINES.length];
}

/**
 * Chặng đang mở, đọc từ đường dẫn. CỐ Ý chỉ nêu TÊN CHẶNG — mặt khoá được phép nói "đang ở đâu",
 * KHÔNG được lộ nội dung mật: không ảnh render, không toạ độ, không số đo, không tên tệp.
 */
function changDangMo(pathname: string | null): [string, string] | null {
  if (!pathname) return null;
  if (pathname.includes('/cad')) return ['2D Kỹ thuật', '2D Design'];
  if (pathname.includes('/present')) return ['Trình chiếu', 'Presenting'];
  if (pathname.includes('/photo') || pathname.includes('/render')) return ['3D Thiết kế', '3D Design'];
  return null;
}

export function LockScreen() {
  const locked = useLockScreen((s) => s.locked);
  const unlock = useLockScreen((s) => s.unlock);
  const flowName = useFlowStore((s) => s.flowName);
  const user = useFlowStore((s) => s.user);
  const reduce = useReducedMotion();
  const lang = useLang();
  const tr = useT();
  const time = useClock();
  const pathname = usePathname();
  const chang = useMemo(() => changDangMo(pathname), [pathname]);
  const [line, setLine] = useState<[string, string] | null>(null);
  const [mode, setMode] = useState<'mat-khoa' | 'xac-thuc'>('mat-khoa');
  const nutMoLai = useRef<HTMLButtonElement>(null);

  /**
   * CANH NỀN + CỬA LỆNH — mount một lần, sống cùng AppChrome. `startLockGuard` lo hai việc mà
   * hẹn giờ rảnh của AppChrome không lo được: ① tab ở nền quá hạn ⇒ khoá ngay khi quay lại
   * ② nghe `if:lock-request` do LỆNH "Khoá InteriorFlow" (sổ lệnh chung) bắn ra.
   */
  useEffect(() => {
    return startLockGuard(() => {
      const uid = useFlowStore.getState().user?.id ?? getLastUserId() ?? '';
      return getLockIdleMinutes(uid);
    });
  }, []);

  /**
   * PHÍM TẮT khoá — ⌘⇧L (macOS) · Ctrl⇧L (Win/Linux). KHÔNG gõ cứng phím ở đây: đọc từ SỔ LỆNH
   * CHUNG (`app.lock`). Đổi phím trong sổ là đổi cả ở đây lẫn ở mọi mặt hiện khác, không lệch.
   */
  useEffect(() => {
    const lenh = findAppCommand('app.lock');
    if (!lenh?.key) return;
    const onKey = (e: KeyboardEvent) => {
      // Đây là phím tắt TOÀN CỤC thật (⌘⇧L), không phải Escape-only — né ô nhập/PIN/mật khẩu
      // đang gõ dở (kể cả mặt xác thực lật ra ở `TheXacThucLai`) để không cướp phím giữa chừng.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!matchKeyToken(lenh.key!, e)) return;
      e.preventDefault();
      lenh.run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Vào khoá: chọn câu của ngày, luôn bắt đầu ở MẶT KHOÁ (không bao giờ mở ra sẵn thẻ xác thực).
  useEffect(() => {
    if (!locked) return;
    setLine(dailyLine());
    setMode('mat-khoa');
    // Đưa tiêu điểm vào nút "Mở lại" — vừa để Enter chạy được ngay (bộ chặn phím toàn cục của
    // AppChrome chỉ chừa lối cho phần tử BÊN TRONG [data-lockscreen-root]), vừa đúng trợ năng.
    const t = setTimeout(() => nutMoLai.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [locked]);

  if (typeof document === 'undefined') return null;

  const xoay = mode === 'xac-thuc' ? 180 : 0;

  return createPortal(
    <AnimatePresence>
      {locked && (
        <motion.div
          data-lockscreen-root
          data-lock-mode={mode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.24, ease: easeApple }}
          className="fixed inset-0 z-[99] flex flex-col items-center justify-center overflow-y-auto py-10"
          style={{
            // TRƯỜNG AMBIENT: workspace lùi lại phía sau — vẫn nhận ra "app của mình", nhưng
            // mờ đủ để không đọc được nội dung (ảnh render, con số, bản vẽ).
            background: 'color-mix(in srgb, var(--bg) 72%, transparent)',
            backdropFilter: 'blur(30px) saturate(120%)',
            WebkitBackdropFilter: 'blur(30px) saturate(120%)',
          }}
        >
          <div className="relative" style={{ perspective: 1200 }}>
            <motion.div
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
              initial={reduce ? false : { rotateY: 180 }}
              animate={{ rotateY: reduce ? 0 : xoay }}
              transition={reduce ? { duration: 0 } : { duration: 0.62, ease: easeApple }}
            >
              {/* ── MẶT KHOÁ: giờ → ngữ cảnh → dòng ngắn → Mở lại ↵ ─────────────────────── */}
              <div
                className="flex flex-col items-center gap-1.5 text-center"
                style={{ backfaceVisibility: 'hidden', visibility: reduce && mode === 'xac-thuc' ? 'hidden' : undefined }}
                aria-hidden={mode === 'xac-thuc'}
              >
                <div
                  className="mb-2 grid h-11 w-11 place-items-center rounded-[var(--r-full,999px)]"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <Lock size={18} className="text-[var(--t2)]" />
                </div>

                <div className="text-[56px] font-semibold tabular-nums leading-none tracking-tight text-[var(--t1)]">
                  {time}
                </div>

                {/* NGỮ CẢNH — dự án · chặng. Đúng mức "đang ở đâu", không hé nội dung. */}
                <div className="mt-2 flex items-center gap-2 text-[12px] text-[var(--t3)]">
                  <span className="text-[var(--t2)]">{flowName || tr('Chưa mở dự án', 'No project open')}</span>
                  {chang && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{tr(chang[0], chang[1])}</span>
                    </>
                  )}
                </div>

                {line && (
                  <div className="mt-4 max-w-[300px] text-[12px] italic leading-snug text-[var(--t3)]">
                    {tr(line[0], line[1])}
                  </div>
                )}

                <button
                  ref={nutMoLai}
                  type="button"
                  onClick={() => setMode('xac-thuc')}
                  className="mt-7 flex items-center gap-2 rounded-[var(--r-full,999px)] px-5 py-2.5 text-[13px] text-[var(--t1)] transition-colors hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  {tr('Mở lại', 'Resume')}
                  <CornerDownLeft size={18} className="text-[var(--t3)]" aria-hidden />
                </button>
              </div>

              {/* ── MẶT XÁC THỰC (mặt sau, lật 180° trục Y) ─────────────────────────────── */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: reduce ? undefined : 'rotateY(180deg)',
                  visibility: mode === 'xac-thuc' ? 'visible' : 'hidden',
                }}
                aria-hidden={mode !== 'xac-thuc'}
              >
                {mode === 'xac-thuc' && (
                  <TheXacThucLai
                    ten={user?.name ?? ''}
                    email={user?.email ?? ''}
                    en={lang === 'en'}
                    onXong={unlock}
                    onHuy={() => setMode('mat-khoa')}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Cửa vào cho nơi khác muốn bắn lệnh khoá mà không import store (giữ đúng một cửa). */
export const LOCK_EVENT = LOCK_REQUEST_EVENT;
