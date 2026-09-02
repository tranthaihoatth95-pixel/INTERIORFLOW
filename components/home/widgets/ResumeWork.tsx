'use client';

/**
 * components/home/widgets/ResumeWork.tsx — [marker: vietDangDo] widget "VIỆC ĐANG DỞ" trên
 * dashboard (phiếu docs/phieu-giao/P-N-dashboard-la-cua-vao.md, V2).
 *
 * VÌ SAO CÓ NÓ: V1 cắt nhánh tự-nhảy-về-việc-đang-dở khi đăng nhập (Hoà 16/08 — dashboard là
 * CỬA VÀO). Việc đang dở KHÔNG mất, nó đổi từ ÉP sang MỜI: vẫn nằm đó, một cú bấm là về đúng
 * chỗ cũ. Widget này chính là chỗ "vẫn nằm đó" — thiếu nó thì V1 là bước LÙI, không phải cải tiến.
 *
 * BA NẤC (Hoà chốt 16/08 "luôn gọn và tươm tất ở lớp mặc định, cho phép xổ ra 2 chi tiết vừa và
 * full" + "thu gọn ↔ sổ ra là HAI NGÔN NGỮ TRÌNH BÀY, không phải hai chiều cao"):
 *   · GỌN (mặc định) — nói bằng KÝ HIỆU + SỐ: chip chặng, chip "2 ngày". Đọc lướt 1 giây.
 *   · VỪA           — icon BIẾN MẤT, thay bằng câu chữ ngắn. (Có chữ rồi thì icon là nhiễu.)
 *   · FULL          — đoạn văn đủ, đọc để hiểu.
 * Nấc GỌN phải ĐỦ TỰ THÂN: che hai nấc kia đi vẫn đứng được một mình (cửa nghiệm thu của chốt).
 *
 * ⚠️ KHÔNG BỊA DỮ LIỆU (ràng buộc V2): mọi thứ hiện ra đều có nguồn thật — xem `resume-card.ts`.
 * Riêng ẢNH XEM TRƯỚC của việc đang dở: HIỆN CHƯA CÓ NGUỒN nào trong app (`ResumeState` chỉ mang
 * route + flowId + phase + ts; không có thumbnail canvas). Nên widget này KHÔNG vẽ ảnh — thiếu
 * thì nói thiếu, không vẽ đại một khung xám giả làm ảnh.
 *
 * TỰ ẨN: `buildResumeCard()` trả null (không có việc dở) ⇒ component trả `null`, KHÔNG hiện
 * khung rỗng (luật Home: widget thiếu dữ liệu tự ẩn).
 */

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, ChevronDown, Clock, PencilRuler, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES } from '@/lib/phases';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';
import { buildResumeCard, daysAgoLabel, resumeHref, type ResumeCard, type ResumeLite } from './resume-card';

/** Cùng bộ icon chặng của `StageSwitcher.tsx` — một chặng một ký hiệu, toàn app giống nhau. */
const STAGE_ICON: Record<Phase, typeof PencilRuler> = {
  concept: PencilRuler,
  render: Box,
  present: Presentation,
};

type Nac = 'gon' | 'vua' | 'day';

/** Có việc dở để bày không — cùng quy ước `todayHasSignal`/`upcomingHasSignal` của các widget khác. */
export function resumeWorkHasSignal(card: ResumeCard | null): boolean {
  return card !== null;
}

export default function ResumeWork({
  resume,
  recentProjects,
  currentProjectId = null,
  index,
}: {
  /** `loadResume(userId)` — nơi gọi đọc, widget không tự đụng localStorage (SSR-safe). */
  resume: ResumeLite | null;
  /** `summary.recentProjects` — CHỈ để tra tên dự án; không quyết định hiện/ẩn. */
  recentProjects?: readonly { id: string; name: string }[];
  currentProjectId?: string | null;
  index?: string;
}) {
  const tr = useT();
  const router = useRouter();
  const [nac, setNac] = useState<Nac>('gon');
  /** Trỏ vào = XEM TRƯỚC nấc vừa (không ghim). Rời chuột thì về nấc đã ghim. */
  const [hover, setHover] = useState(false);

  const card = useMemo(
    () => buildResumeCard(resume, { recentProjects, currentProjectId }),
    [resume, recentProjects, currentProjectId],
  );

  const open = useCallback(() => {
    if (card) router.push(resumeHref(card));
  }, [card, router]);

  if (!card) return null;

  const meta = PHASES.find((p) => p.id === card.stage);
  const stageName = meta ? tr(meta.label, meta.labelEn) : card.stage;
  const Icon = STAGE_ICON[card.stage];
  /* 🔴 02/09 — BỎ CHỮ GIỮ CHỖ. Bản cũ: `card.projectName ?? tr('Dự án gần nhất', …)`, nên ô LỚN
   * NHẤT của Home in một cái tên KHÔNG PHẢI TÊN — phạm F6 ("Home biết im lặng: cấm chữ giữ
   * chỗ"), và tệ hơn: nó khiến lỗi tra tên trông như một thiết kế. Lỗi thật đã vá ở
   * `resume-card.ts` (chỉ nhận `flowId` khi `scopeKind === 'project'`).
   * Khi vẫn KHÔNG tra được tên: nói thứ mình BIẾT CHẮC — tên CHẶNG đang dở. Đó là tin thật,
   * không phải chỗ trống độn chữ. Nhãn trợ năng ở dưới cũng dùng cùng chuỗi này, nên người
   * dùng bàn phím nghe đúng thứ người dùng mắt đọc. */
  const projectName = card.projectName ?? stageName;
  const timeLabel = daysAgoLabel(card.daysAgo, false);
  const timeLabelEn = daysAgoLabel(card.daysAgo, true);
  const time = timeLabel && timeLabelEn ? tr(timeLabel, timeLabelEn) : null;

  /** Nấc ĐANG HIỆN = nấc ghim, nhưng trỏ vào thì nâng GỌN lên VỪA (xem trước, không ghim). */
  const shown: Nac = hover && nac === 'gon' ? 'vua' : nac;

  const nextNac: Nac = nac === 'gon' ? 'vua' : nac === 'vua' ? 'day' : 'gon';
  const nacLabel: Record<Nac, string> = {
    gon: tr('Gọn', 'Compact'),
    vua: tr('Vừa', 'Medium'),
    day: tr('Đầy đủ', 'Full'),
  };

  return (
    <WidgetCard
      dense
      index={index}
      title={tr('Việc đang dở', 'Where you left off')}
      action={
        <button
          type="button"
          onClick={() => setNac(nextNac)}
          aria-label={tr(`Xem nấc ${nacLabel[nextNac]}`, `Show ${nacLabel[nextNac]} level`)}
          title={tr(`Xem nấc ${nacLabel[nextNac]}`, `Show ${nacLabel[nextNac]} level`)}
          className="grid h-6 w-6 place-items-center rounded-[var(--r-1)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          {/* Mũi tên NÓI HÀNH ĐỘNG sắp xảy ra (chuẩn PanelFlank): quay xuống = sổ thêm,
              quay lên (nấc cuối) = thu về gọn. */}
          <ChevronDown
            size={14}
            aria-hidden
            style={{ transform: nac === 'day' ? 'rotate(180deg)' : undefined }}
          />
        </button>
      }
    >
      <button
        type="button"
        onClick={open}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        /* Nhãn cho trình đọc màn hình nói ĐỦ ba mẩu tin, không phụ thuộc nấc đang hiện —
           người dùng bàn phím không "trỏ vào" được để thấy nấc vừa. */
        aria-label={tr(
          `Mở lại ${projectName} ở ${stageName}${time ? `, ${time}` : ''}`,
          `Reopen ${projectName} in ${stageName}${time ? `, ${time}` : ''}`,
        )}
        className="flex h-full w-full flex-col justify-between gap-2 rounded-[var(--r-2)] p-1 text-left transition-colors hover:bg-[var(--hover)]"
      >
        <div className="min-w-0">
          <div className="truncate text-[length:var(--fs-sm)] font-[var(--fw-semi)] text-[var(--t1)]">
            {projectName}
          </div>

          {shown === 'gon' ? (
            /* NẤC GỌN — ký hiệu + số. Mỗi chip có SỐ/CHỮ đi kèm (luật icon-nén-tin: icon một
               mình không mang tin, nó chỉ nói "số này là số gì"). */
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-[var(--r-1)] px-1.5 py-0.5 text-[length:var(--fs-2xs)] text-[var(--t3)]"
                style={{ background: 'var(--field)' }}
              >
                {/* ⚠️ KHÔNG để dấu cách chữ giữa icon và nhãn. Thẻ này đã `gap-1`; dấu cách
                    trong JSX là một TEXT NODE, mà text node trong flex thành một item riêng ⇒
                    khe hoá thành gap + dấu cách = "hôm  nay" hở đôi. Đo trên ảnh 1054 (02/09,
                    bảng đối chiếu dòng 10). Khoảng cách do `gap` lo, chữ không lo. */}
                <Icon size={14} aria-hidden />
                {stageName}
              </span>
              {time && (
                <span
                  className="inline-flex items-center gap-1 rounded-[var(--r-1)] px-1.5 py-0.5 font-mono text-[length:var(--fs-2xs)] tabular-nums text-[var(--t3)]"
                  style={{ background: 'var(--field)' }}
                >
                  <Clock size={14} aria-hidden />
                  {time}
                </span>
              )}
            </div>
          ) : shown === 'vua' ? (
            /* NẤC VỪA — icon BIẾN MẤT, chữ thay chỗ (chốt 16/08). */
            <p className="mt-1.5 text-[length:var(--fs-xs)] leading-[var(--lh)] text-[var(--t3)]">
              {tr(
                `${stageName}${time ? ` · dở từ ${time}` : ''}`,
                `${stageName}${time ? ` · left off ${time}` : ''}`,
              )}
            </p>
          ) : (
            /* NẤC ĐẦY ĐỦ — đoạn văn, đọc để hiểu. */
            <p className="mt-1.5 text-[length:var(--fs-xs)] leading-[var(--lh)] text-[var(--t3)]">
              {tr(
                `Bạn đang dở ở ${stageName}${time ? `, lần cuối ${time}` : ''}. Bấm để mở lại đúng chỗ cũ.`,
                `You left off in ${stageName}${time ? `, last seen ${time}` : ''}. Click to reopen exactly where you were.`,
              )}
            </p>
          )}
        </div>

        <span className="text-[length:var(--fs-2xs)] text-[var(--t3)]">
          {tr('Mở lại →', 'Reopen →')}
        </span>
      </button>
    </WidgetCard>
  );
}
