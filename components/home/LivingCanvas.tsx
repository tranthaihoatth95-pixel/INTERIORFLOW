'use client';

/**
 * components/home/LivingCanvas.tsx — BỐ CỤC HOME CHÍNH TẮC (M2 · Living Canvas, Hoà duyệt 22/08).
 *
 * ⛔ THAY, KHÔNG VÁ. Bản bốn-dải cũ bị đánh **FAIL** ngày 22/08 vì đọc ra là *dashboard*:
 * thẻ khổng lồ, tường widget, kệ dự án cao 360px chiếm trọn khung hình đầu. Vá CSS bản đó là
 * đánh bóng một cấu trúc sai — nên bố cục dựng lại ở ĐÂY, và `DongStudioHome` chỉ gọi vào.
 *
 * TRẬT TỰ ĐỌC — cố định, không đánh số trên giao diện:
 *     KHÔNG KHÍ  →  TIẾP TỤC  →  KỆ DỰ ÁN  →  CẢM HỨNG
 * (Đánh số là thứ khiến màn đọc ra "bảng điều khiển có mục 1,2,3". Thứ tự nằm ở BỐ CỤC,
 *  không nằm ở con số.)
 *
 * BỐN LUẬT KHÔNG ĐƯỢC PHÁ
 *  ① **Không thẻ khổng lồ.** Không có "VIỆC ĐANG DỞ" cỡ đại. Tiếp tục = MỘT dòng, MỘT đích.
 *  ② **Kệ dự án nhịp ~64px** — hàng gọn, không phải ô gạch to. Kệ CÓ MẶT, không ĐÒI HỎI.
 *  ③ **Thiếu dữ liệu thì TỰ ẨN.** Không hiện `0`, không khung rỗng, không bịa số/ảnh/mốc giờ.
 *  ④ **KHÔNG tin số Project thô** (audit 22/08: 15 hàng thì 5 là `__nb:` placeholder, 4 là
 *     fixture test ⇒ "21/21" và "19 Bản nháp" đếm từ RÁC). Nên màn này **không hiện con số đếm
 *     nào** cho tới khi có bộ lọc rác. Thà không nói còn hơn nói sai.
 *
 * Dữ liệu: THẬT hết — `/api/home/summary` (recentProjects) · `loadResume` → `buildResumeCard`
 * (trả null là không có việc dở ⇒ dải Tiếp tục biến mất). Không có nguồn mock nào trong tệp này.
 */

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { resumeHref, daysAgoLabel, type ResumeCard } from './widgets/resume-card';

/** Nhịp hàng kệ dự án — 64px. Con số này là YÊU CẦU của bố cục, không phải gu: hàng cao hơn thì
 *  kệ lại nuốt khung hình đầu (đúng lỗi bản cũ), thấp hơn thì chạm ngưỡng vùng bấm 44px + đệm. */
const NHIP_HANG = 64;

export interface LivingCanvasProps {
  /** Dải KHÔNG KHÍ — trường ánh sáng + lời chào. Truyền vào để tệp này không tự dựng nguồn giờ. */
  ambient: ReactNode;
  /** Việc đang dở — `null` ⇒ KHÔNG mount dải Tiếp tục (luật ③). */
  resume: ResumeCard | null;
  /** Dự án gần đây — nguồn thật `/api/home/summary`. Rỗng ⇒ kệ tự ẩn. */
  projects: readonly { id: string; name: string }[];
  /** Dải cảm hứng — đã lọc ở nơi gọi; `null` ⇒ tự ẩn (luật ③). */
  inspiration: ReactNode | null;
}

/** Một hàng kệ: tên dự án + mũi tên. KHÔNG số việc, KHÔNG badge, KHÔNG ảnh bìa — kệ là để NHẬN RA,
 *  không phải để trưng bày. (Ảnh bìa quay lại khi có dự án THẬT có bìa thật.)
 *
 * Là THẺ `<a>` chứ không phải `<button>`: hàng kệ ĐI ĐẾN một nơi. Anchor cho sẵn mở-tab-mới,
 * chuột giữa, copy link, và trình đọc màn hình đọc đúng là "liên kết" — `button`+`router.push`
 * mất sạch những thứ đó. Đường `/projects/<id>/overview` là route THẬT (rail đang dùng chính nó). */
function HangDuAn({ id, name }: { id: string; name: string }) {
  return (
    <a
      href={`/projects/${id}/overview`}
      className="group flex w-full items-center justify-between text-left"
      style={{
        height: NHIP_HANG,
        padding: '0 14px',
        borderRadius: 'var(--r-2)',
        color: 'var(--t2)',
        background: 'transparent',
        borderBottom: '1px solid var(--vien-mo)',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: 15, letterSpacing: '.01em' }}>{name}</span>
      <ArrowRight
        size={16}
        aria-hidden
        className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ color: 'var(--t3)' }}
      />
    </a>
  );
}

/**
 * KỆ DỰ ÁN dùng chung — tách ra để `BeMatHome` (bề mặt năm trạng thái, 23/08) mount lại ĐÚNG
 * cái kệ này thay vì chép hàng `HangDuAn` sang một tệp thứ hai. Hai bản chép sẽ phân kỳ; đây là
 * đúng họ bệnh "cùng một thứ khai nhiều chỗ".
 * Rỗng ⇒ trả `null` (tự ẩn), nơi gọi không phải nhớ kiểm.
 */
export function KeDuAn({
  projects,
  khongTieuDe = false,
}: {
  projects: readonly { id: string; name: string }[];
  /**
   * Nơi gọi đã tự cấp tiêu đề (ô lưới Home bọc `WidgetCard title="Dự án"`) ⇒ kệ thôi tự in nhãn.
   * Không có cờ này thì chữ "Dự án" hiện HAI LẦN chồng nhau trong cùng một ô.
   */
  khongTieuDe?: boolean;
}) {
  const tr = useT();
  if (projects.length === 0) return null;
  return (
    <section aria-label={tr('Dự án', 'Projects')} data-home-dai="ke-du-an">
      {/* 🔴 23/08 — bỏ `textTransform:'uppercase'`. Đây là nhãn "DỰ ÁN" Hoà đếm trong sáu nhãn
          hoa toàn phần; `LUAT-CHU-VIET-7.1.23` cấm hoa toàn phần với tiếng Việt. Cùng lượt hạ
          `letterSpacing` .12em → .02em (giãn chữ đó sinh ra để đỡ cho chữ hoa, bỏ hoa thì nó
          chỉ còn làm chữ rời rạc) và nâng `--t4` → `--t3` cho đạt ngưỡng tương phản. */}
      {!khongTieuDe && (
        <div style={{ fontSize: 12, letterSpacing: '.02em', color: 'var(--t3)', marginBottom: 8 }}>
          {tr('Dự án', 'Projects')}
        </div>
      )}
      <div className="flex flex-col">
        {projects.map((p) => (
          <HangDuAn key={p.id} id={p.id} name={p.name} />
        ))}
      </div>
    </section>
  );
}

export default function LivingCanvas({
  ambient,
  resume,
  projects,
  inspiration,
}: LivingCanvasProps) {
  const tr = useT();
  const daysLabel = resume ? daysAgoLabel(resume.daysAgo, false) : null;

  return (
    <div className="flex h-full w-full justify-center overflow-y-auto">
      <div
        className="flex w-full flex-col"
        style={{ maxWidth: 'min(100%, 1120px)', gap: 40, paddingTop: 44, paddingBottom: 56 }}
      >
        {/* ── KHÔNG KHÍ ── trường, không thẻ. Mắt chạm NƠI CHỐN trước, chạm DỮ LIỆU sau. */}
        <section aria-label={tr('Không khí', 'Ambient')} data-home-dai="khong-khi">
          {ambient}
        </section>

        {/* ── TIẾP TỤC ── MỘT dòng, MỘT đích. Không thẻ lớn, không danh sách việc, không hàng nút.
            Không có việc dở ⇒ dải này KHÔNG TỒN TẠI (không phải "thẻ rỗng"). */}
        {resume && (
          <section aria-label={tr('Tiếp tục', 'Resume')} data-home-dai="tiep-tuc">
            <a
              href={resumeHref(resume)}
              className="group inline-flex items-center gap-3"
              style={{ color: 'var(--t1)', textDecoration: 'none' }}
            >
              <span style={{ fontSize: 19, letterSpacing: '-.01em' }}>
                {tr('Tiếp tục', 'Resume')}{' '}
                <span style={{ color: 'var(--t1)', fontWeight: 500 }}>
                  {/* `projectName` null = CHƯA BIẾT TÊN, không phải "không có tên" ⇒ nói đúng thế. */}
                  {resume.projectName ?? tr('dự án gần nhất', 'your last project')}
                </span>
              </span>
              <ArrowRight
                size={14}
                aria-hidden
                style={{ color: 'var(--accent)' }}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
            {daysLabel && (
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--t4)' }}>{daysLabel}</div>
            )}
          </section>
        )}

        {/* ── KỆ DỰ ÁN ── nhịp 64px. CÓ MẶT, không ĐÒI HỎI. Rỗng ⇒ tự ẩn, không khung rỗng.
            ⚠️ Cố ý KHÔNG hiện tổng số: số Project thô đang lẫn `__nb:` + fixture (audit 22/08). */}
        <KeDuAn projects={projects} />

        {/* ── CẢM HỨNG ── đứng cuối, nuôi mắt. Không ảnh hợp lệ ⇒ nơi gọi truyền null ⇒ tự ẩn.
            🔴 `height` BẮT BUỘC, không phải chuyện gu: `WeeklyImage` đặt `<img>` ở
            `absolute inset-0`, nên vùng chứa KHÔNG có chiều cao riêng thì dải sập còn **2px**
            (đo trên app thật 22/08 — bản đầu của tệp này dính đúng lỗi đó).
            260 là chiều cao của DẢI, không phải của ảnh: ảnh nay `object-contain` nên nó vừa
            TRONG dải và giữ đúng tỉ lệ; phần dư hai bên là nền, đúng luật "khung phục vụ ảnh". */}
        {inspiration && (
          <section
            aria-label={tr('Cảm hứng', 'Inspiration')}
            data-home-dai="cam-hung"
            style={{ height: 260, position: 'relative' }}
          >
            {inspiration}
          </section>
        )}
      </div>
    </div>
  );
}
