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
import { useLockScreen, startLockGuard, getLockIdleMinutes, canMatKhau, LOCK_REQUEST_EVENT } from '@/lib/lockscreen';
import { danhNgonNgauNhien, type DanhNgon } from '@/lib/lockscreen-danh-ngon';

/* HAI HƯỚNG, HAI MỨC KHOÁ — Hoà chốt 29/08: *"giữ cả 2 vì một cái rảnh tay một cái chủ động,
 * liên quan gì nhau"*. Đúng, và nó bỏ luôn được cái nút chọn tôi vừa dựng: LÝ DO KHOÁ đã quyết
 * mặt nào rồi, không cần hỏi người dùng thêm một câu nữa.
 *
 *   khoá RẢNH  (máy tự khoá, người dùng không xin gì)  →  D · NỀN ĐỘNG phủ cả màn.
 *              Không có thẻ, không có gì phải chứng minh. Chỉ một câu và một nút.
 *              Đúng cảm giác: anh rời bàn, căn phòng vẫn đó, nắng vẫn đi qua.
 *
 *   khoá TAY   (người bấm ⌘⇧L — một YÊU CẦU rõ ràng)   →  A · THẺ, lật ra mặt mật khẩu.
 *              Thẻ là VẬT: cầm được, lật được, và mặt sau là chỗ chứng minh "vẫn là anh".
 *              Ẩn dụ khớp việc: anh xin khoá lại, nên phải có cái để mở.
 *
 * Hai mặt KHÁC CẤP nhau — A là một vật đặt giữa màn, D là chính cái màn. Ép chung một khung
 * là vỡ (đã trả giá: nhét D vào khung lật rộng 300px của A, nền không phủ nổi màn). */
import { hinhChoCau } from '@/lib/lockscreen-hinh-the';
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
  const lyDo = useLockScreen((s) => s.lyDo);
  const unlock = useLockScreen((s) => s.unlock);
  /** Khoá RẢNH (máy tự khoá) mở bằng một nút. Khoá TAY (người bấm ⌘⇧L) mới đòi mật khẩu. */
  const doiMatKhau = canMatKhau(lyDo);
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
  const [cau, setCau] = useState<DanhNgon | null>(null);
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
    setCau(danhNgonNgauNhien());
    // Khoá RẢNH: thẻ TỰ LẬT sang mặt danh ngôn — Hoà 29/08 *"lúc khoá nó tự động lật, không cần
    // nút"*. Bắt bấm một nút chỉ để xem mặt sau là dựng một cửa không ai xin. Khoá TAY thì vẫn
    // đứng ở mặt khoá: mặt sau bên đó là ô mật khẩu, tự lật vào đó là ép người dùng gõ.
    setMode(canMatKhau(useLockScreen.getState().lyDo) ? 'mat-khoa' : 'xac-thuc');
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
          {/* HƯỚNG D thay CẢ LỚP CHE, không nằm trong khung lật.
              Bản đầu tôi nhét `NenDong` vào trong khung lật (khung đó rộng đúng bằng thẻ 300px)
              ⇒ nền động không phủ nổi màn, chữ trôi lơ lửng trên trang. Nhìn ảnh là thấy ngay.
              Hai hướng KHÁC NHAU VỀ CẤP: A là một VẬT đặt giữa màn (có lật, có hai mặt);
              D là CHÍNH CÁI MÀN. Nhét D vào khung của A là ép hai cấp khác nhau vào một chỗ. */}
          {!doiMatKhau && cau ? (
            <NenDong cau={cau} en={lang === 'en'} onMoLai={unlock} />
          ) : (
          <div className="relative" style={{ perspective: 1200 }}>
            <motion.div
              /* HAI MẶT XẾP CHỒNG TRONG MỘT Ô LƯỚI, không phải `absolute inset-0`.
                 Vì sao đổi: mặt sau (thẻ danh ngôn) nay RỘNG HƠN mặt trước (đồng hồ). Với
                 `absolute` thì khung lật lấy kích thước theo mặt trước, mặt sau tràn ra và bị
                 CẮT CỤT — bắt được bằng mắt ngay lần soi đầu. Lưới cho khung tự lấy kích thước
                 theo mặt LỚN NHẤT, nên đổi bố cục mặt sau không phá khung nữa. */
              className="relative grid"
              style={{ transformStyle: 'preserve-3d' }}
              initial={reduce ? false : { rotateY: 180 }}
              animate={{ rotateY: reduce ? 0 : xoay }}
              transition={reduce ? { duration: 0 } : { duration: 0.62, ease: easeApple }}
            >
              {/* ── MẶT KHOÁ: giờ → ngữ cảnh → dòng ngắn → Mở lại ↵ ─────────────────────── */}
              <div
                className="flex flex-col items-center justify-center gap-1.5 text-center"
                style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', visibility: reduce && mode === 'xac-thuc' ? 'hidden' : undefined }}
                aria-hidden={mode === 'xac-thuc'}
              >
                {/* Khoá TAY: mặt trước là THẺ A (ảnh công trình + câu, bọc kính) — Hoà chốt
                    29/08 "giữ cả 2, một cái rảnh tay một cái chủ động". Nút trên thẻ LẬT sang
                    mặt mật khẩu, không mở thẳng: đây là khoá người dùng CHỦ ĐỘNG xin. */}
                {cau && (
                  <TheDanhNgon
                    cau={cau}
                    en={lang === 'en'}
                    onMoLai={() => setMode('xac-thuc')}
                    nhanNut={tr('Mở lại', 'Resume')}
                  />
                )}
                <div
                  className="mt-4 mb-2 hidden h-11 w-11 place-items-center rounded-[var(--r-full,999px)]"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <Lock size={18} className="text-[var(--t2)]" />
                </div>

                <div className="hidden text-[56px] font-semibold tabular-nums leading-none tracking-tight text-[var(--t1)]">
                  {time}
                </div>

                {/* NGỮ CẢNH — dự án · chặng. Đúng mức "đang ở đâu", không hé nội dung. */}
                <div className="mt-2 hidden items-center gap-2 text-[12px] text-[var(--t3)]">
                  <span className="text-[var(--t2)]">{flowName || tr('Chưa mở dự án', 'No project open')}</span>
                  {chang && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{tr(chang[0], chang[1])}</span>
                    </>
                  )}
                </div>

                {line && (
                  <div className="mt-4 hidden max-w-[300px] text-[13px] italic leading-normal text-[var(--t3)]">
                    {tr(line[0], line[1])}
                  </div>
                )}

                <button
                  ref={nutMoLai}
                  type="button"
                  onClick={() => (doiMatKhau ? setMode('xac-thuc') : unlock())}
                  className="mt-7 hidden items-center gap-2 rounded-[var(--r-full,999px)] px-5 py-2.5 text-[13px] text-[var(--t1)] transition-colors hover:bg-[var(--hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  {tr('Mở lại', 'Resume')}
                  <CornerDownLeft size={18} className="text-[var(--t3)]" aria-hidden />
                </button>

              </div>

              {/* ── MẶT XÁC THỰC (mặt sau, lật 180° trục Y) ─────────────────────────────── */}
              <div
                className="flex items-center justify-center"
                style={{
                  gridArea: '1 / 1',
                  backfaceVisibility: 'hidden',
                  transform: reduce ? undefined : 'rotateY(180deg)',
                  visibility: mode === 'xac-thuc' ? 'visible' : 'hidden',
                }}
                aria-hidden={mode !== 'xac-thuc'}
              >
                {/* Khung lật nay CHỈ dùng cho khoá TAY ⇒ mặt sau luôn là thẻ xác thực. */}
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
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * MẶT SAU CỦA KHOÁ RẢNH — một câu THẬT của người thật, to và rõ.
 *
 * Hoà 29/08: *"nó là 1 thẻ lật ra mặt sau là 1 câu ngẫu nhiên về thiết kế — câu của người nổi
 * tiếng, không bịa. Câu nói thể hiện to rõ, đẹp."*
 *
 * Ba quyết định hình thức, mỗi cái có lý do:
 *   · **Câu là nhân vật chính** — cỡ chữ lớn hẳn, không chú thích chen ngang, không biểu tượng
 *     trang trí. Thẻ này chỉ có một việc: cho đọc một câu.
 *   · **Tên tác giả nhỏ hơn nhưng KHÔNG mờ nhạt** — trích mà giấu tên là đúng thứ luật cũ sợ.
 *     Nguồn đặt ngay dưới tên, cỡ nhỏ nhất: người muốn kiểm thì có đường kiểm.
 *   · **Cạnh răng cưa như con tem** — mượn đúng ngôn ngữ Hoà đưa trong ảnh tham chiếu; nó nói
 *     "vật sưu tầm, mỗi lần một cái khác", đúng bản chất bốc ngẫu nhiên.
 */
function TheDanhNgon({ cau, en, onMoLai, nhanNut }: { cau: DanhNgon; en: boolean; onMoLai: () => void; nhanNut?: string }) {
  const tr = (v: string, e: string) => (en ? e : v);
  const h = hinhChoCau(cau.en);
  const W = 400;
  const H = 250;

  /* MỘT THẺ, HAI MẶT — Hoà 29/08: *"tỉ lệ không thay đổi so với card login, chỉ đơn giản lật
   * lại 180 độ thôi."*
   *
   * Vì sao đây là luật chứ không phải sở thích: thẻ khoá là MỘT VẬT. Vật thật lật mặt thì
   * không phình ra. Bản trước tôi cho mặt sau rộng 880px trong khi mặt trước 300px — hai mặt
   * hoá hai vật khác nhau, và cú lật đọc ra như "đổi màn" chứ không phải "lật thẻ".
   *
   * ⇒ Vỏ thẻ này CHÉP ĐÚNG SỐ của `components/auth/TheXacThucLai.tsx:67`
   *   `w-[300px] rounded-[20px] p-5` · nền `--panel` · viền `--border`.
   * Đổi số ở đó thì phải đổi ở đây. Ba con số này là HỢP ĐỒNG giữa hai mặt, không phải trang trí.
   *
   * Đánh đổi tôi khai thẳng: cột chữ 260px cho ra ~30 ký tự/dòng, dưới dải dễ đọc 45–75. Chấp
   * nhận được vì đây là MỘT CÂU NGẮN chứ không phải đoạn văn — và giữ thẻ nguyên khổ đáng giá
   * hơn. Đổi lại phải giữ kỷ luật: câu quá dài thì cắt bớt khỏi bảng, không nới thẻ. */
  return (
    <div
      /* HƯỚNG A — vỏ thẻ nay TRONG SUỐT, hai nửa tự mang kính của mình:
         nửa trên là ảnh dưới lớp kính, nửa dưới là chữ trên tấm kính mờ. Vỏ không còn tô nền
         đục nữa, nếu không thì "nền trong suốt" chỉ là lời nói — lớp đục sẽ chặn hết phía sau. */
      className="w-[300px] overflow-hidden rounded-[20px]"
      style={{ border: '1px solid var(--border)', boxShadow: '0 24px 60px -24px rgba(0,0,0,0.42)' }}
    >
      {/* HÌNH BỌC KÍNH — ba lớp chồng, cố ý KHÔNG dùng `backdrop-filter`: hình nằm ngay dưới
          kính, không có gì phía sau để làm mờ. Dùng nó chỉ tốn GPU mà mắt không thấy khác.
          Có ảnh CÔNG TRÌNH CỦA CHÍNH NGƯỜI NÓI thì dùng ảnh; không có thì rơi về hình hình học. */}
      <div className="relative h-[150px] overflow-hidden">
        {cau.anh ? (
          <img
            src={`/anh-khoa/${cau.anh.tep}`}
            alt={`${cau.anh.ct} — ${cau.ai}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden style={{ display: 'block' }}>
          <rect width={W} height={H} fill={h.troi} />
          <circle cx={h.vangX * W} cy={h.vangY * H} r={H * 0.115} fill={h.vang} />
          <line x1="0" y1={H * 0.54} x2={W} y2={H * 0.54} stroke={h.net} strokeWidth="0.8" opacity="0.5" />
          {/* Vẽ từ XA (cao trên màn) tới GẦN (thấp dưới) — lớp gần vẽ SAU nên che phần dưới của
              lớp xa, chừa lại đúng một dải: đó là cách chồng lớp cho ra chiều sâu. */}
          {h.lop.map((l, i) => {
            const y = H * (1 - l.cao);
            const dx = l.lech * W * 0.5;
            return (
              <path
                key={i}
                d={`M ${-W * 0.2 + dx} ${H} L ${-W * 0.2 + dx} ${y + H * 0.09} L ${W * 0.34 + dx} ${y} L ${W * 0.78 + dx} ${y + H * 0.07} L ${W * 1.2 + dx} ${y - H * 0.02} L ${W * 1.2 + dx} ${H} Z`}
                fill={l.mau}
              />
            );
          })}
          <rect y={H * 0.965} width={W} height={H * 0.035} fill={h.dat} />
        </svg>
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.16) 18%, rgba(255,255,255,0.02) 34%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.07) 82%, rgba(255,255,255,0.26) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow:
              'inset 0 1.5px 0 rgba(255,255,255,0.72), inset 1px 0 0 rgba(255,255,255,0.30), inset -1px 0 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.28), inset 0 -18px 30px -20px rgba(0,0,0,0.5)',
          }}
        />
      </div>

      <div className="the-khoa-kinh p-5">
      <blockquote className="m-0 flex flex-col gap-3 text-center">
        {/* Ba con số dưới đây là LUẬT chữ tiếng Việt (`knowledge/typography-vietnamese.md`):
            V-2 line-height ≥1.5 · V-3 letter-spacing không âm · V-6 cỡ sàn ≥12px. */}
        <p
          className="m-0 font-medium text-[var(--t1)]"
          style={{ fontSize: 17, lineHeight: 1.55, letterSpacing: 0, textWrap: 'pretty' }}
        >
          “{en ? cau.en : cau.vi}”
        </p>
        <footer className="flex flex-col gap-0.5">
          <div className="text-[13px] font-semibold text-[var(--t1)]">{cau.ai}</div>
          <div className="text-[12px] leading-normal text-[var(--t3)]">{cau.vai}</div>
          {/* Công trình + người chụp. `chup` là ĐIỀU KIỆN CỦA GIẤY PHÉP CC BY, không phải chú
              thích cho đẹp — bỏ nó là vi phạm giấy phép. */}
          {cau.anh && (
            <div className="mt-2 text-[12px] leading-normal text-[var(--t3)] opacity-75">
              {cau.anh.ct} · ảnh {cau.anh.chup} · {cau.anh.lic}
            </div>
          )}
        </footer>
      </blockquote>

      <button
        type="button"
        onClick={onMoLai}
        autoFocus
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--r-full,999px)] px-4 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{ background: 'var(--accent)', color: 'var(--on-accent, #fff)' }}
      >
        {nhanNut ?? tr('Mở lại', 'Resume')}
      </button>
      </div>
    </div>
  );
}

/**
 * HƯỚNG D — NỀN ĐỘNG phủ cả màn, không có thẻ.
 *
 * Khác A ở CHỖ ĐẶT NHÂN VẬT CHÍNH: A cho ảnh và chữ vào một vật cầm được; D biến cả màn thành
 * một căn phòng có nắng đi qua, chữ nổi lên giữa. Không có cái nào đúng hơn — chúng nhắm hai
 * cảm giác khác nhau, nên phải nhìn thật mới chọn được.
 *
 * Ba lớp trôi lệch nhịp (48 · 67 · 26 giây, xem `app/globals.css`) nên mắt không bắt được chu
 * kỳ. Một nét đứng yên duy nhất — đường chân trời — làm chỗ mắt bám.
 */
function NenDong({ cau, en, onMoLai }: { cau: DanhNgon; en: boolean; onMoLai: () => void }) {
  const tr = (v: string, e: string) => (en ? e : v);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="nen-dong-lop nen-dong-bong" />
      <div className="nen-dong-lop nen-dong-nang" />
      <div className="nen-dong-lop nen-dong-luoi" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
        <p
          className="m-0 max-w-[30ch] font-medium text-[var(--t1)]"
          style={{ fontSize: 'clamp(19px, 2.4vw, 27px)', lineHeight: 1.55, letterSpacing: 0, textWrap: 'pretty' }}
        >
          “{en ? cau.en : cau.vi}”
        </p>
        <div className="flex flex-col gap-0.5">
          <div className="text-[13px] font-semibold text-[var(--t1)]">{cau.ai}</div>
          <div className="text-[12px] leading-normal text-[var(--t3)]">{cau.vai}</div>
          {cau.anh && (
            <div className="mt-1 text-[12px] leading-normal text-[var(--t3)] opacity-75">
              {cau.anh.ct} · ảnh {cau.anh.chup} · {cau.anh.lic}
            </div>
          )}
        </div>
        {/* ĐƯỜNG CHÂN TRỜI — nét DUY NHẤT đứng yên giữa mọi thứ đang trôi.
            🔴 SỬA 30/08 — TRƯỚC ĐÂY NÓ `position:absolute; top:58%`, tức neo vào MÀN trong khi
            chữ neo vào TÂM CỦA CHÍNH NÓ. Hai hệ toạ độ không liên quan ⇒ chỗ nét rơi xuống là
            việc của bề rộng cửa sổ, không phải của thiết kế. Đo tại 1440×900: nét ở y=522,5 cắt
            xuyên hộp chữ dòng ghi nguồn (508,3–523,3) — đúng chỗ Hoà khoanh trên ảnh Eames.
            Nay nó nằm TRONG cùng cột với chữ, nên khoảng cách tới chữ là `gap-6` của cột và
            KHÔNG THỂ đè lên chữ ở bất kỳ bề rộng nào hay độ dài câu nào.
            Đây là ca mẫu của luật: *quan hệ mới là bất biến, không phải giá trị* — chữa bằng
            việc cho hai thứ chung một hệ toạ độ, không chữa bằng cách dời `58%` thành `62%`. */}
        <div
          aria-hidden
          className="pointer-events-none w-screen"
          style={{
            height: 1,
            background: 'linear-gradient(to right, rgba(220,228,238,0) 0%, rgba(220,228,238,0.22) 22%, rgba(220,228,238,0.22) 78%, rgba(220,228,238,0) 100%)',
          }}
        />
        <button
          type="button"
          onClick={onMoLai}
          autoFocus
          className="whitespace-nowrap rounded-[var(--r-full,999px)] px-7 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{ background: 'var(--accent)', color: 'var(--on-accent, #fff)' }}
        >
          {tr('Mở lại', 'Resume')}
        </button>
      </div>
    </div>
  );
}

/** Cửa vào cho nơi khác muốn bắn lệnh khoá mà không import store (giữ đúng một cửa). */
export const LOCK_EVENT = LOCK_REQUEST_EVENT;
