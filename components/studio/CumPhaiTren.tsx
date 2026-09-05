'use client';

/**
 * components/studio/CumPhaiTren.tsx — [marker: cumPhaiTren] CỤM PHẢI TRÊN: cá nhân · cộng tác ·
 * hệ thống. Trả lời đúng một câu của luật không gian: **"tôi là ai / ai đang ở đây"**.
 *
 * NGUỒN CHỐT — Hoà 20/08 (đợt NAV-HAI-DAO): thanh trái CHỈ CÒN VIỆC (hai đảo: xưởng/việc ·
 * chặng); Hồ sơ · Credit · Cài đặt · Tài khoản · Đăng xuất **rời khỏi thanh trái** và về đây.
 * Thứ tự gọn, trái→phải: `[Thông báo] [Hiện diện] [Ảnh đại diện]`.
 * ⛔ Hoà nêu TIÊU CHÍ TRƯỢT: *"trượt nếu thanh trái còn chứa Hồ sơ/Credit/Cài đặt"* — và hệ quả
 * kèm theo là **cấm lặp**: đã ở đây thì không được có bản thứ hai bên trái.
 *
 * ── LUẬT KHÔNG GIAN: ĐÂY KHÔNG PHẢI VITALS ───────────────────────────────────────────────────
 * CỤM TÌM KIẾM (Home) = *"tôi nên biết gì"* — Vitals, thứ hệ thống thấy đáng nói.
 * PHẢI TRÊN (tệp này) = *"tôi là ai / ai đang ở đây"* — danh tính và người.
 * Hai hệ KHÁC NHAU, ⛔ cấm nhập một. Đừng gom badge Vitals vào chuông, đừng cho avatar mở Vitals.
 *
 * 🔴 SỬA 02/09 — dòng trên trước ghi *"MÉP TRÊN (`VitalsAperture`, đã LIVE)"*. Khẩu độ đó đã
 * THÔI MOUNT hôm nay (V-3a, `AppChrome.tsx`); Vitals nay vào bằng `VitalsPill` ở cụm tìm kiếm.
 * ⚠️ Chỗ ĐỨNG của Vitals đổi, LUẬT thì KHÔNG: phiếu V-3b đề nghị đặt nút Vitals vào chính tệp
 * này. Đã từ chối, vì nó phạm đúng dòng "cấm nhập một" ngay trên, và phạm chốt 6 của Hoà
 * (*"góc trên phải = cá nhân + thông báo"*, `docs/hoa-noi/SO-TONG.md`). Ai định làm lại việc đó
 * thì phải lật được hai nguồn ấy trước, đừng lật bằng một phiếu.
 *
 * ── VÌ SAO CHỖ NÀY HIỆN ÍT HƠN BA MÓN — CÓ Ý, KHÔNG PHẢI THIẾU ────────────────────────────────
 * Phiếu ghi rõ: *"chưa có nhóm/hiện diện thật ⇒ TỰ THU GỌN, không vẽ chỗ trống"*. Áp thẳng:
 *
 * ① HOẠT ĐỘNG (`HoatDongChuong.tsx`, LANE C 20/08) — chuông, KHÔNG PHẢI "thông báo" theo nghĩa
 *    được-giao-việc/khách-phản-hồi (kho đó vẫn CHƯA CÓ, `grep -rin "notif" lib components` vẫn
 *    ra 0). Đây là câu KHÁC: *"cái gì đang chạy/sắp tới"* (tiến độ) — đọc `flowRuns` +
 *    `useRenderQueue`, hai nguồn job THẬT đã sống trong app. KHÔNG lấn hệ Vitals (mép trên —
 *    *"tôi nên biết gì"*): hai chuông khác câu hỏi, khác chỗ đứng, không gộp.
 *    ⛳ NỢ CÒN LẠI: kho thông báo xã hội (được giao việc · nhắc soát duyệt · khách phản hồi) —
 *    khi có, thêm nhóm riêng vào `hoat-dong-luong.ts`, không dựng chuông thứ ba.
 *
 * ② HIỆN DIỆN — render khi CÓ NGƯỜI THẬT khác mình trong dự án đang mở, ngoài ra tự ẩn.
 *    Nguồn là `useCollabStore` (con trỏ sống, server tự dọn sau 6s) — dữ liệu ĐÃ CÓ SẴN trong bộ
 *    nhớ, tệp này KHÔNG mở thêm một đường mạng nào. Neo vào **dự án đang mở**, đúng câu phiếu
 *    *"hiện diện neo vào dự án/soát duyệt đang mở, không phải bảng tin xã hội"*.
 *    KHÔNG dùng lại `components/collab/PresenceBar.tsx`: nó là thẻ `absolute right-4 top-4` NỔI
 *    TRÊN CANVAS của FlowCanvas, kèm nút mời + poll roster 30s — mount bản thứ hai ở header là
 *    hai thẻ hiện diện cùng lúc trên một màn. Ở đây dùng ĐÚNG primitive dùng chung mà chính
 *    PresenceBar dùng: `components/ui/PresenceRow.tsx`. Một primitive, hai mặt tiền — không
 *    dựng lại (B25 no-rebuild).
 *
 * ③ ẢNH ĐẠI DIỆN — chỉ render khi ĐÃ ĐĂNG NHẬP. ⛔ Không avatar giả, không ô tròn xám chờ sẵn.
 *    Menu là `components/AccountMenu.tsx` DÙNG CHUNG (đã có Hồ sơ · Credit · Cài đặt · Đăng
 *    xuất từ trước) — tệp này chỉ neo nó vào góc phải-trên, không chép nội dung menu ra bản thứ
 *    hai. Cùng cơ chế portal + `getBoundingClientRect()` mà `AccountMenu` đã sửa ở K4 (thoát
 *    "kính lồng kính": panel kính nổi PHẢI portal, không lồng trong chrome kính).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFlowStore } from '@/lib/store';
import { useCollabStore, colorForUser } from '@/lib/collabStore';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AccountMenu } from '@/components/AccountMenu';
import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useDismissable } from '@/lib/useDismissable';
import { HoatDongChuong } from '@/components/studio/HoatDongChuong';

export function CumPhaiTren() {
  const tr = useT();
  const user = useFlowStore((s) => s.user);
  const duAnId = useFlowStore((s) => s.currentProjectId);
  const others = useCollabStore((s) => s.others);
  const meId = useCollabStore((s) => s.meId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const nutRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Neo theo hình chữ nhật THẬT của nút, đo sau khi menu bật (useLayoutEffect — trước lượt vẽ,
  // nên menu không nháy ở góc 0,0 rồi mới nhảy về chỗ). `right` tính từ mép phải cửa sổ để menu
  // không tràn ra ngoài màn khi nút sát bờ.
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const el = nutRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
  }, [menuOpen]);

  useDismissable({ open: menuOpen, onDismiss: () => setMenuOpen(false), refs: [nutRef, menuRef] });

  /**
   * NẠP USER MỘT LẦN KHI STORE CHƯA BIẾT — đo trên app thật 20/08, KHÔNG suy từ mã:
   * ở `/` avatar hiện; mở `/projects/<id>/cad` thì `store.user` là `undefined` ⇒ cả cụm ẩn, tức
   * *"tôi là ai"* biến mất đúng lúc đang làm việc. Phiên đăng nhập VẪN CÒN (cookie hợp lệ), chỉ
   * là chỉ `HomeScreen` mới đi hỏi — các route chặng không ai hỏi.
   *
   * Đây KHÔNG phải lỗ do đợt này đào ra: avatar cũ nằm ở chân `Navigator` cũng gác `{user && …}`
   * nên nó cũng câm y hệt trên các route chặng. Đợt này chỉ làm lỗ đó lộ ra và bịt luôn.
   *
   * [Đ2] KHÔNG chế đường xác thực thứ hai: dùng ĐÚNG endpoint + ĐÚNG khuôn `SessionWatch.tsx:36`
   * và `PresentStageScreen.tsx:62-77` đã dùng (một lần · 401 thì im, để `SessionWatch` lo báo,
   * không báo hai lần · mạng đứt thì không kết luận gì).
   * ⛳ NỢ: khuôn này nay có ba bản chép tay (SessionWatch · PresentStageScreen · đây) — đúng ca
   * `may-soi-dong-dang` tín hiệu ③ "cùng chuỗi thao tác ở nhiều nơi"; gom về một hook là phiếu
   * riêng, không làm trong đợt điều hướng này.
   */
  const setUser = useFlowStore((s) => s.setUser);
  const userId = user?.id;
  useEffect(() => {
    if (userId) return;
    let bo = false;
    void (async () => {
      try {
        const r = await fetch('/api/auth/me');
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        const u = j?.user ?? j;
        if (!bo && u?.id) setUser(u);
      } catch {
        /* mạng đứt — giữ nguyên trạng thái, cụm tự ẩn như khi chưa đăng nhập */
      }
    })();
    return () => {
      bo = true;
    };
  }, [userId, setUser]);

  // Chưa đăng nhập thì cả cụm không có gì để nói — ẩn hẳn, không giữ chỗ.
  if (!user) return null;

  // Hiện diện: CHỈ người thật đang có con trỏ sống trong dự án đang mở. Một mình thì không có
  // "ai đang ở đây" để trả lời ⇒ tự thu gọn (không vẽ dãy một avatar của chính mình).
  const nguoiKhac = duAnId ? others.filter((o) => o.userId !== meId) : [];
  const hienDien: PresenceMember[] = nguoiKhac.map((o) => ({
    id: o.userId,
    name: o.name,
    color: o.color || colorForUser(o.userId),
    online: true,
  }));

  return (
    <div
      data-marker="cumPhaiTren"
      // `aria-label` chứ không tiêu đề nhìn thấy: cụm này nhận ra bằng VỊ TRÍ (góc phải trên) —
      // thêm chữ "Tài khoản" cạnh avatar là nói cùng một điều hai lần.
      aria-label={tr('Tài khoản và cộng tác', 'Account and collaboration')}
      className="flex shrink-0 items-center gap-2"
    >
      {/* ① HOẠT ĐỘNG — tiến độ job xuyên chặng. Xem docstring + HoatDongChuong.tsx. */}
      <HoatDongChuong />

      {/* ② HIỆN DIỆN — neo vào dự án đang mở; một mình thì tự ẩn. */}
      {hienDien.length > 0 && (
        <div
          // Nhãn nói RÕ đây là người trong dự án, không phải bảng tin: trình đọc màn hình chỉ
          // nghe được dãy tên nếu ta đặt tên cho dãy.
          role="group"
          aria-label={tr(
            `${hienDien.length} người khác đang ở dự án này`,
            `${hienDien.length} other people in this project`,
          )}
          className="hidden sm:flex"
        >
          <PresenceRow members={hienDien} max={4} />
        </div>
      )}

      {/* ③ ẢNH ĐẠI DIỆN — cửa duy nhất tới Hồ sơ · Credit · Cài đặt · Tài khoản · Đăng xuất. */}
      <button
        ref={nutRef}
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={tr(`Tài khoản — ${user.name}`, `Account — ${user.name}`)}
        style={{ borderRadius: RADIUS.full }}
        className="grid shrink-0 place-items-center p-0.5 transition-colors duration-[var(--nhip-bam)] hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]"
      >
        <UserAvatar id={user.id} avatar={user.avatar} name={user.name} size={26} frame={false} />
      </button>

      <AccountMenu open={menuOpen} anchorRect={anchor} onDismiss={() => setMenuOpen(false)} menuRef={menuRef} />
    </div>
  );
}
