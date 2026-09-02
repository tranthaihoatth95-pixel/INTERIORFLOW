'use client';

/**
 * components/home/widgets/TodayStrip.tsx — [marker: DongStudio] Ô C "Hôm nay" (bento v3,
 * docs/phieu-giao/home-bento-v3.md ④.2) — việc ĐẾN HẠN hôm nay (số to, count-in 1 lần khi mount)
 * · ai online (chấm pulse). TỰ ẨN nếu cả 2 tín hiệu đều rỗng (luật chung phiếu).
 *
 * v3 — đổi số CHÍNH từ "việc XONG hôm nay" (v2) sang "việc ĐẾN HẠN hôm nay" (`greeting.
 * dueTodayCount`, đã tính sẵn ở route, trước đây chỉ dùng cho câu chào) — khớp đúng nhãn ô C của
 * phiếu ASCII + việc ④.2 "số việc đến hạn đếm lên". `tasksDoneToday` (v2) giữ vai trò PHỤ, dòng
 * nhỏ bên dưới — không bỏ hẳn dữ liệu, chỉ đổi thứ tự ưu tiên hiển thị.
 *
 * "Đếm lên" — ràng buộc ⑤ phiếu CHỈ cho phép animate transform/opacity (không phải mọi hoạt
 * hoạ), nên đây là số HIỆN RA (scale .92→1 + opacity 0→1, 200ms, MỘT lần khi mount) chứ không
 * phải digit-tally chạy số — vẫn đúng tinh thần "đếm lên" (số xuất hiện có sức sống) mà không
 * cần thêm interval JS riêng (giữ đúng luật "1 interval toàn trang" của DongStudioHome).
 *
 * Chấm pulse — PresenceRow (`components/ui/PresenceRow.tsx`) NGOÀI vùng file được sửa của phiếu
 * này nên không chèn pulse vào TỪNG avatar; thay bằng 1 chấm pulse ĐỒNG HÀNH cạnh nhãn "đang
 * online" (cùng ý nghĩa — có người đang sống — không cần đúng pixel từng avatar).
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.1) — ngưỡng SIẾT lại: "≥2 tín hiệu thật (việc đến hạn/xong
 * + người online NGOÀI bản thân)". Đọc là HAI phạm trù bắt buộc CÙNG có mặt (không phải đếm rời
 * 3 cờ) — một mình mở app không tạo ra "hôm nay của studio" chỉ vì `today.online` (mọi User, kể
 * cả chính mình) luôn có tên mình trong đó. `currentUserId` lọc bản thân ra khỏi phạm trù online.
 */

import PresenceRow, { type PresenceMember } from '@/components/ui/PresenceRow';
import { useReducedMotion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import type { HomeSummary } from './types';

/**
 * 🔴 ĐẢO NGƯỠNG v4 — 02/09. Bản cũ: `taskSignal && onlineOthersSignal`, tức ĐÒI CÙNG LÚC hai
 * phạm trù (có việc hôm nay **và** có người khác online). Giữ nguyên chú thích v4 phía trên vì
 * lập luận của nó không sai — nó chỉ đúng cho một studio NHIỀU NGƯỜI.
 *
 * ĐẢO VÌ: đo trên app thật 02/09, ô "Hôm nay" KHÔNG BAO GIỜ mọc. Người dùng một mình thì
 * `online` sau khi lọc bản thân luôn rỗng ⇒ vế thứ hai luôn false ⇒ widget chết cứng bất kể có
 * bao nhiêu việc đến hạn. Một điều kiện mà người dùng ĐƠN LẺ không có cách nào thoả không phải
 * là ngưỡng chất lượng, nó là công tắc tắt. Và pilot của Hoà đúng là một người dùng đơn lẻ.
 *
 * Nay: chỉ `taskSignal` — ô nói về VIỆC, nên nguồn sống của nó phải là việc.
 * Phần hiện diện KHÔNG mất: thân component vẫn chỉ vẽ hàng online khi `online.length > 0`, nên
 * studio nhiều người thấy y như cũ. Tức đây là NỚI ngưỡng mọc, không phải bỏ tính năng.
 * ⚠️ `currentUserId` vẫn giữ trong chữ ký — nó còn dùng để lọc bản thân khỏi hàng hiện diện.
 * Gỡ tham số là làm hỏng chỗ đó, dù ở đây nó thôi tham gia quyết định hiện/ẩn.
 */
export function todayHasSignal(summary: HomeSummary, _currentUserId?: string | null): boolean {
  return summary.greeting.dueTodayCount > 0 || summary.today.tasksDoneToday > 0;
}

export default function TodayStrip({
  summary,
  index,
  currentUserId = null,
}: {
  summary: HomeSummary;
  index?: string;
  /** id user đang xem Home — loại khỏi danh sách "đang online" hiển thị (chính mình luôn "online"
   * với chính mình, hiện lại vô nghĩa). */
  currentUserId?: string | null;
}) {
  const tr = useT();
  const reduce = useReducedMotion();

  const dueTodayCount = summary.greeting.dueTodayCount;
  const { tasksDoneToday } = summary.today;
  const online = summary.today.online.filter((u) => u.id !== currentUserId);
  if (!todayHasSignal(summary, currentUserId)) return null;

  const onlineMembers: PresenceMember[] = online.map((u) => ({ id: u.id, name: u.name, online: true }));

  /* 🔴 R-3b (02/09) — BA LỖI ĐO ĐƯỢC TRÊN ẢNH 18:28, sửa cùng chỗ vì cùng một khối chữ.
   *
   * ① CON SỐ QUÁ NHỎ SO VỚI Ô. `--fs-xl` = 28px trong ô `clamp(148px, 11.5vw, 188px)` ⇒ số chiếm
   *    ~1/6 chiều cao ô. Luật H-4 nói ô 1×1 = MỘT cái nhìn; một cái nhìn thì con số phải là thứ
   *    ĐẦU TIÊN mắt bắt được, không phải một dòng chữ hơi to hơn dòng bên cạnh.
   *    Cỡ đi theo cùng nhịp `vw` với ô (ô 11.5vw, số 3.9vw) nên tỉ lệ số/ô gần như không đổi khi
   *    đổi khổ màn: 1440 ⇒ 56px, 1180 ⇒ ô chạm sàn 148 và số 46px.
   *    ⚠️ KHÔNG hardcode 56px: ô co được thì số phải co theo, nếu không nó tràn ở khổ hẹp.
   *    ⚠️ Muốn đúng "một nửa CHIỀU CAO Ô" theo nghĩa hình học thì phải `cqh` + container query —
   *    đó là đổi kiến trúc ô, không phải một lát chữ. Ghi ra đây để lần sau khỏi bàn lại.
   *
   * ② TRÀN DỌC 2px. Máy đo: `{chu:'1', chieu:'doc', sh:30, ch:28}`. `leading-none` đặt
   *    line-height = 1 = đúng bằng cỡ chữ, trong khi hộp chữ THẬT còn phần trên/dưới của phông
   *    (ascender/descender) ⇒ luôn cao hơn 1em một chút. Số càng to thì 2px đó càng thành nhiều.
   *    `lineHeight: 1.1` cho hộp cao hơn phần vẽ ra — hết tràn, và không ai thấy khác gì.
   *
   * ③ CHỮ MONO LẠC GU — và nó là NGUYÊN NHÂN CHUNG với chip "hôm  nay" ở `ResumeWork.tsx`.
   *    Trong phông đều nét, dấu cách rộng bằng một chữ cái, nên `'hôm nay'` với ĐÚNG MỘT dấu
   *    cách vẽ ra trông như hai. Bảng chấm ghi thành hai lỗi riêng (chữ mono · chip hở đôi);
   *    thật ra một nguyên nhân, một sửa. `tracking-[.01em]` cộng thêm vào cùng chiều.
   *    ⇒ Bỏ `font-mono` khỏi NHÃN. `tabular-nums` thì GIỮ ở con số — nó là thứ giữ chữ số cùng
   *    bề ngang khi số đổi (1 → 2 không nhảy chỗ), và nó KHÔNG đổi phông. */
  const LOP_SO = 'font-light tabular-nums text-[var(--t1)]';
  /* 🔴 R-3c — `lineHeight` 1.1 VẪN TRÀN. Đo ảnh 19:32: `{chu:'1', chieu:'doc', sh:66, ch:62}`
   * ở cỡ 56px ⇒ hộp chữ thật cao ~1,18em, còn 1,1em chỉ cho 61,6px. Lát trước tôi chọn 1.1
   * bằng ƯỚC LƯỢNG chứ không bằng số đo — và ước lượng đó hụt đúng 4px.
   * 1.2 phủ được ~1,18em của phông đang dùng, còn dư một chút cho phông khác. ⚠️ Nếu ai đổi
   * phông chữ toàn app thì con số này phải ĐO LẠI, không suy: cổng `oTran` chiều dọc là thứ
   * bắt được, đừng chờ mắt. */
  const KIEU_SO = { fontSize: 'clamp(44px, 3.9vw, 64px)', lineHeight: 1.2 } as const;
  const LOP_NHAN = 'mt-1 text-[length:var(--fs-2xs)] text-[var(--t4)]';

  return (
    <WidgetCard dense index={index} title={tr('Hôm nay', 'Today')}>
      <div className="flex h-full flex-col justify-between gap-3">
        {/* 🔴 R-3c — SỐ NEO ĐÁY. Ảnh 19:32: tiêu đề và số dính trên, ~55% ô trống bên dưới —
            `justify-between` với MỘT khối con thì khối đó rơi về đầu, không có gì để "between".
            `mt-auto` đẩy khối số xuống đáy ⇒ tiêu đề trên, số dưới, khoảng thở ở GIỮA hai thứ
            có nghĩa, đúng cách widget iPad xếp một con số. */}
        {dueTodayCount > 0 ? (
          <div className={`mt-auto ${reduce ? '' : 'today-count-in'}`}>
            <div className={LOP_SO} style={KIEU_SO}>{dueTodayCount}</div>
            <div className={LOP_NHAN}>
              {tr(dueTodayCount === 1 ? 'việc đến hạn' : 'việc đến hạn', dueTodayCount === 1 ? 'task due' : 'tasks due')}
            </div>
          </div>
        ) : (
          tasksDoneToday > 0 && (
            <div className={`mt-auto ${reduce ? '' : 'today-count-in'}`}>
              <div className={LOP_SO} style={KIEU_SO}>{tasksDoneToday}</div>
              <div className={LOP_NHAN}>
                {tr('việc xong hôm nay', tasksDoneToday === 1 ? 'task done' : 'tasks done')}
              </div>
            </div>
          )
        )}

        {dueTodayCount > 0 && tasksDoneToday > 0 && (
          <div className="text-[length:var(--fs-2xs)] text-[var(--t4)]">
            {tr(`${tasksDoneToday} đã xong`, `${tasksDoneToday} done`)}
          </div>
        )}

        {online.length > 0 && (
          <div className="flex items-center gap-2">
            <PresenceRow members={onlineMembers} max={4} />
            <span className="flex items-center gap-1 text-[length:var(--fs-2xs)] text-[var(--t4)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${reduce ? '' : 'today-pulse-ring'}`} style={{ background: 'var(--success, #2e9e5b)' }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success, #2e9e5b)' }} />
              </span>
              {tr('online', 'online')}
            </span>
          </div>
        )}
      </div>
      <style jsx>{`
        .today-count-in {
          animation: today-count-in var(--nhip-bang) cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        @keyframes today-count-in {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .today-pulse-ring {
          animation: today-pulse 2.2s ease-out infinite;
        }
        @keyframes today-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .today-count-in,
          .today-pulse-ring {
            animation: none !important;
          }
        }
      `}</style>
    </WidgetCard>
  );
}
