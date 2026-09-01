'use client';

/**
 * components/home/BeMatHome.tsx — [marker: beMatHome] **BỀ MẶT HOME CÓ TRẠNG THÁI** (chốt Hoà
 * 23/08, `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`).
 *
 * 🟣 01/09 — VÁ THỊ GIÁC THEO BẢN VẼ GĐ1 (`design-if/Main.dc.html` + `HomeStart.dc.html`,
 * Hoà chốt hướng). KHÔNG đổi luật trạng thái (`nam-trang-thai.ts` nguyên vẹn, test giữ):
 *   · Trạng thái B (Main.dc.html): hero = TIẾP TỤC VIỆC DỞ đứng TRÁI-DƯỚI trên nền là chính
 *     công việc (ảnh phiên dở khi có; không có thì nền môi trường theo giờ của `SystemWallpaper`
 *     hiện xuyên — đúng cổng FAIL-CLOSED A4). Tín hiệu nhóm C KHÔNG VỎ ở phải-trên. Kệ dự án
 *     MỘT DÒNG pill ở đáy-phải. MASTER-TOOL đáy giữa: Dự án mới · Nhập DXF · Hỏi AI.
 *   · Trạng thái A (HomeStart.dc.html): đồng hồ mảnh lớn giữa màn + ba cửa vào THẬT
 *     (`ngaySoKhong` — ProjectSelect/BatDauNgaySoKhong, handler nguyên vẹn).
 *   ⚠️ MÂU THUẪN KHAI THẲNG: chốt 22/08 ghi "bỏ mặt đồng hồ — người dùng CẢM giờ, không ĐỌC giờ";
 *   bản vẽ GĐ1 (mới hơn, Hoà chốt hướng) vẽ đồng hồ số mảnh lớn ở HomeStart. Bản vá theo GĐ1
 *   (nguồn mới thắng), ghi lại ở GHI-CHU-VA.md để Hoà phân xử nếu cần.
 *
 * ─── VÌ SAO KHÔNG PHẢI "LƯỚI BENTO ĐỀU" ────────────────────────────────────────────────────
 * Chữ *bento* dễ bị đọc thành *lưới thẻ đều nhau*, mà đó đúng là thứ đã bị đánh trượt HAI LẦN:
 *   · 20/08 — *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* ⇒ cấm lưới thẻ đều.
 *   · 22/08 — bản bốn-dải bị FAIL vì *"thẻ khổng lồ, tường widget"*.
 * ⇒ Lưới C/D/E giữ nguyên là **lưới Ô** (editorial có trọng lượng), không đụng ở lượt vá này.
 *
 * ─── LUẬT MÀU (IF-CHUAN-NEN + bản vẽ GĐ1) ──────────────────────────────────────────────────
 * ĐƠN SẮC + MỘT accent `--accent` (#6a57f5): ở màn Home accent chỉ nằm trên ĐÚNG MỘT CTA —
 * nút "Tiếp tục" (B) — mọi chip/pill khác trung tính. ⛔ Không teal trang trí, không cam ngoài
 * cảnh báo. Mọi màu qua token ⇒ sống được cả hai theme.
 *
 * ─── KHÔNG DỮ LIỆU GIẢ ─────────────────────────────────────────────────────────────────────
 *   · Vòng Vitals "76" trong bản vẽ là MOCK — app chưa có nguồn điểm thật ⇒ KHÔNG vẽ vòng.
 *     Hiện diện Vitals thật vẫn ở `VitalsAperture` (AppChrome, mép trên) — không dựng bản hai.
 *   · Tín hiệu nhóm C chỉ vẽ khi `vietDangDo.tinHieu` có phần tử THẬT; rỗng ⇒ cột không tồn tại.
 *   · "Hỏi AI" chưa có bề mặt trung tính để mở ⇒ nút MỜ kèm lý do thật (`aria-disabled` +
 *     `aria-describedby`) — đúng khuôn `NutTaoAi` của rail, cấm nút giả (§9).
 */

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Import, Sparkles } from 'lucide-react';
// 🔴 KHÔNG dùng được `<Icon glyph={...}>` ở đây (lỗi kiểu của primitive `components/ui/Icon.tsx`,
// xem ghi chú bản trước). Lấy `ICON_STROKE` từ chính primitive để luật nét vẫn có MỘT nguồn.
import { ICON_STROKE } from '@/components/ui/Icon';
import { useLang, useT } from '@/lib/i18n';
import {
  keHoachHome,
  nhipO,
  type DuKienHome,
  type KeHoachHome,
  type MaWidget,
  type VaiO,
} from './nam-trang-thai';
import { VaiOProvider } from './widgets/WidgetCard';

/**
 * Chiều cao một hàng ô — **88px, số của bản vẽ** `mocks/mock-exs-c-home-work-os.html` H1.
 * `minmax(88, auto)` chứ không phải `88px` cứng — nội dung tràn thì hàng nở, không cắt chữ.
 */
const CAO_O = 'minmax(88px, auto)';

export interface BeMatHomeProps {
  /** Dữ kiện thô — bề mặt tự tính kế hoạch để nơi gọi không phải nhớ gọi hai hàm. */
  duKien: DuKienHome;
  /** Trường ánh sáng + lời chào. Truyền vào để tệp này không tự dựng nguồn giờ. */
  ambient: ReactNode;
  /** Ba cửa vào của Ngày-Số-Không (trạng thái A) — handler THẬT sống trong ProjectSelect. */
  ngaySoKhong: ReactNode;
  /** Nội dung từng mục — nơi gọi mount widget thật. Thiếu khoá nào ⇒ mục đó không vẽ. */
  noiDung: Partial<Record<MaWidget, ReactNode>>;
  /** Dữ liệu tối thiểu cho trạng thái B. `null` ⇒ B không dựng được (nơi gọi tự tránh). */
  vietDangDo: {
    tenDuAn: string | null;
    /** Nhãn chặng đang dở — "2D Kỹ thuật"… Nơi gọi dịch, tệp này không tra bảng chặng. */
    nhanChang: string | null;
    /** "Hoạt động gần nhất …" — null = bản ghi cũ không mang dấu thời gian, KHÔNG đoán. */
    nhanLuc: string | null;
    href: string;
    /** Vài tín hiệu ngắn, ĐÃ có thật. Rỗng ⇒ không vẽ cột tín hiệu (không hiện "0"). */
    tinHieu: readonly string[];
  } | null;
  /** Ảnh phiên dở đã QUA CỔNG "khoảnh khắc đẹp". Chưa có đường chụp ⇒ luôn `null` hôm nay. */
  anhPhien?: string | null;
  /**
   * 01/09 — KỆ DỰ ÁN MỘT DÒNG (bản vẽ Main.dc.html, đáy-phải trạng thái B).
   * Nguồn thật `/api/home/summary` (recentProjects) do nơi gọi cấp. Rỗng/undefined ⇒ kệ tự ẩn.
   */
  duAnGanDay?: readonly { id: string; name: string }[];
  /**
   * 01/09 — nhịp phút của interval TOÀN TRANG (`DongStudioHome` luật ⑤) cho đồng hồ trạng thái A.
   * Không truyền ⇒ đồng hồ tự đọc giờ một lần lúc mount (không đẻ interval thứ hai ở đây).
   */
  minuteTick?: number;
}

/**
 * Lớp phủ chuyển sắc CỤC BỘ dưới chân chữ — không bôi mờ nền (chốt A2 16/08: nền để NÉT).
 */
function PhuChanChu({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          inset: '-18px -26px -22px -26px',
          borderRadius: 'var(--r-4)',
          background:
            'radial-gradient(120% 100% at 20% 50%, var(--nen-mo-card, var(--card)) 0%, color-mix(in srgb, var(--nen-mo-card, var(--card)) 72%, transparent) 55%, transparent 100%)',
          backdropFilter: 'blur(var(--blur-strong))',
          WebkitBackdropFilter: 'blur(var(--blur-strong))',
        }}
      />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

/* ── 01/09 · MASTER-TOOL ĐÁY (bản vẽ Main.dc.html + HomeStart.dc.html) ─────────────────────────
 * Ba việc: Dự án mới · Nhập DXF · Hỏi AI. LUẬT NÚT THẬT:
 *   · "Dự án mới"  → LINK THẬT `/projects` — bề mặt Dự án (ProjectSelect) mang "＋ Dự án mới"
 *     canonical. KHÔNG chép lại chuỗi createFlow/openFlow ra đây (luật 6 cấm khuôn thứ hai).
 *   · "Nhập DXF"   → LINK THẬT `/library/ingest` — đúng đích `onNhapNguon` của ProjectSelect.
 *   · "Hỏi AI"     → CHƯA có bề mặt trung tính ⇒ MỜ kèm lý do thật (khuôn `NutTaoAi` rail).
 * Accent KHÔNG vào đây — CTA duy nhất của màn B là "Tiếp tục". Mọi chip trung tính, hai theme
 * sống bằng token (`--panel`/`--nen-mo-card`/`--vien-mo`/`--t2`).
 */
const CHIP_MASTER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 16px',
  borderRadius: 'var(--r-full)',
  background: 'var(--panel)',
  border: '1px solid var(--vien-mo, var(--border))',
  color: 'var(--t2)',
  fontSize: 'var(--fs-ui, 13px)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

function MasterToolHome() {
  const tr = useT();
  const idLyDoAi = 'home-ly-do-hoi-ai';
  return (
    <div className="relative flex shrink-0 justify-center" style={{ paddingBottom: 6 }}>
      <div
        role="toolbar"
        aria-label={tr('Việc chính', 'Primary actions')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 12px',
          borderRadius: 'var(--r-full)',
          background: 'var(--nen-mo-card, var(--card))',
          border: '1px solid var(--vien-mo, var(--border))',
          backdropFilter: 'saturate(180%) blur(var(--blur-strong))',
          WebkitBackdropFilter: 'saturate(180%) blur(var(--blur-strong))',
          boxShadow: '0 16px 40px rgba(0,0,0,.28), inset 0 1px 0 var(--vien-mo, var(--border))',
        }}
      >
        <Link
          href="/projects"
          style={CHIP_MASTER}
          className="transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {/* Cỡ icon đi theo THANG QUANG HỌC {14,16,18,20} — cổng F-ICON-SIZE (`soi:foundation`).
              Bản vá gốc ghi 15, cổng bánh cóc bắt (0 → 4 vi phạm); 16 là nấc gần nhất. */}
          <Plus size={16} strokeWidth={ICON_STROKE} aria-hidden />
          {tr('Dự án mới', 'New project')}
        </Link>
        <Link
          href="/library/ingest"
          style={CHIP_MASTER}
          className="transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Import size={16} strokeWidth={ICON_STROKE} aria-hidden />
          {tr('Nhập DXF', 'Import DXF')}
        </Link>
        <button
          type="button"
          aria-disabled
          aria-describedby={idLyDoAi}
          style={{
            ...CHIP_MASTER,
            background: 'transparent',
            opacity: 'var(--mo-vo-hieu)',
            cursor: 'not-allowed',
          }}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Sparkles size={16} strokeWidth={ICON_STROKE} aria-hidden />
          {tr('Hỏi AI', 'Ask AI')}
        </button>
        <span id={idLyDoAi} className="if-tooltip-a11y">
          {tr(
            'Cửa hỏi AI trung tính đang dựng — chưa nối bề mặt nào.',
            'The neutral Ask-AI surface is not wired yet.',
          )}
        </span>
      </div>
    </div>
  );
}

/* ── 01/09 · KỆ DỰ ÁN MỘT DÒNG (Main.dc.html, đáy-phải) ────────────────────────────────────────
 * Pill kính trung tính, tối đa 4 tên + nút `+` đứt nét dẫn về bề mặt Dự án. Rỗng ⇒ trả null.
 * KHÔNG số đếm, KHÔNG badge — kệ là để NHẬN RA (luật LivingCanvas ④: số Project thô đang lẫn rác).
 */
function KeDuAnMotDong({ projects }: { projects: readonly { id: string; name: string }[] }) {
  const tr = useT();
  if (projects.length === 0) return null;
  const pill: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 14px',
    borderRadius: 'var(--r-full)',
    background: 'var(--nen-mo-card, var(--card))',
    border: '1px solid var(--vien-mo, var(--border))',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    fontSize: 'var(--fs-2xs, 12px)',
    color: 'var(--t2)',
    textDecoration: 'none',
    maxWidth: 200,
  };
  return (
    <div
      aria-label={tr('Dự án', 'Projects')}
      className="flex flex-wrap items-center justify-end gap-2"
      data-home-dai="ke-du-an"
    >
      <span style={{ fontSize: 'var(--fs-2xs, 11px)', color: 'var(--t3)', marginRight: 2 }}>
        {tr('Dự án', 'Projects')}
      </span>
      {projects.slice(0, 4).map((p) => (
        <Link
          key={p.id}
          href={`/projects/${p.id}/overview`}
          style={pill}
          className="transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="truncate">{p.name}</span>
        </Link>
      ))}
      <Link
        href="/projects"
        aria-label={tr('Tất cả dự án', 'All projects')}
        style={{
          ...pill,
          background: 'transparent',
          border: '1px dashed var(--border)',
          color: 'var(--t3)',
          padding: '7px 12px',
        }}
        className="transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {/* 13 → 14: nấc NHỎ NHẤT của thang quang học (F-ICON-SIZE). Kệ dự án vẫn là chip nhỏ. */}
        <Plus size={14} strokeWidth={ICON_STROKE} aria-hidden />
      </Link>
    </div>
  );
}

/* ── 01/09 · ĐỒNG HỒ MẢNH (HomeStart.dc.html) — chỉ trạng thái A ─────────────────────────────
 * Đọc giờ tại render, cập nhật theo `minuteTick` của interval toàn trang (không interval mới).
 * BeMatHome chỉ mount phía trình duyệt (nơi gọi chờ `gio !== null`) nên `new Date()` an toàn.
 */
function DongHoMong({ tick, en }: { tick?: number; en: boolean }) {
  // `tick` đổi mỗi phút ⇒ component re-render ⇒ giờ mới. Không truyền thì đứng ở giờ lúc mount.
  void tick;
  const now = new Date();
  const ngay = now.toLocaleDateString(en ? 'en-US' : 'vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const gio = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex flex-col items-center" style={{ gap: 6 }} data-home-dong-ho>
      <div style={{ fontSize: 15, fontWeight: 300, color: 'var(--t3)', letterSpacing: '.02em' }}>
        {ngay}
      </div>
      <div
        className="tabular-nums"
        style={{
          fontSize: 'clamp(72px, 12vw, 156px)',
          fontWeight: 200,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'var(--t1)',
        }}
      >
        {gio}
      </div>
    </div>
  );
}

/**
 * TRẠNG THÁI B — *"KHÔNG dùng Resume card nhỏ."* (Main.dc.html)
 * Hero trái-dưới: nhãn nhỏ "Việc đang dở" → tên dự án cỡ lớn mảnh → dòng mốc → CTA "Tiếp tục".
 * Đây là NƠI DUY NHẤT của Home mang accent.
 */
function HeroTiepTuc({ data }: { data: NonNullable<BeMatHomeProps['vietDangDo']> }) {
  const tr = useT();
  return (
    <div style={{ maxWidth: 'min(100%, 620px)' }}>
      <PhuChanChu>
        {/* Nhãn nhóm — KHÔNG hoa toàn phần (LUAT-CHU-VIET-7.1.23), tách bằng CỠ + MÀU. */}
        <div style={{ fontSize: 13, letterSpacing: '.02em', color: 'var(--t3)', marginBottom: 10 }}>
          {tr('Việc đang dở', 'Work in progress')}
          {data.nhanChang ? ` · ${data.nhanChang}` : null}
        </div>
        <div
          style={{
            fontSize: 'clamp(32px, 3.4vw, 46px)',
            fontWeight: 200,
            lineHeight: 1.15,
            letterSpacing: '-.02em',
            color: 'var(--t1)',
          }}
        >
          {/* `null` = CHƯA BIẾT TÊN, không phải "không có tên" — nói đúng thế, không bịa. */}
          {data.tenDuAn ?? tr('Dự án gần nhất', 'Your last project')}
        </div>
        {data.nhanLuc && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--t3)' }}>{data.nhanLuc}</div>
        )}

        <a
          href={data.href}
          className="group mt-6 inline-flex items-center gap-2"
          style={{
            height: 'var(--tap, 44px)',
            padding: '0 24px',
            borderRadius: 'var(--r-full)',
            background: 'var(--accent)',
            color: 'var(--on-accent, #fff)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 10px 30px color-mix(in srgb, var(--accent) 40%, transparent)',
            transition: 'transform var(--nhip-bam) var(--ease-apple)',
          }}
        >
          {tr('Tiếp tục', 'Continue')}
          <ArrowRight
            size={16}
            strokeWidth={ICON_STROKE}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </PhuChanChu>
    </div>
  );
}

/** Cột TÍN HIỆU NHÓM C — phải-trên, KHÔNG VỎ: chữ trực tiếp trên nền, chấm trung tính. */
function TinHieuPhai({ tinHieu }: { tinHieu: readonly string[] }) {
  const tr = useT();
  if (tinHieu.length === 0) return null;
  return (
    <div
      aria-label={tr('Điều cần chú ý', 'Needs attention')}
      className="flex flex-col items-end gap-3 text-right"
      style={{ maxWidth: 300 }}
      data-home-dai="tin-hieu"
    >
      {tinHieu.map((s) => (
        <div key={s} className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--t2)' }}>
          <span>{s}</span>
          <span
            aria-hidden
            style={{
              width: 7,
              height: 7,
              borderRadius: 'var(--r-full)',
              background: 'var(--t3)',
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Một ô của lưới — chỉ cấp CHỖ và khai VAI; ruột là widget thật do nơi gọi truyền vào.
 */
function O({
  co,
  vai,
  children,
}: {
  co: KeHoachHome['bay'][number]['co'];
  vai: VaiO;
  children: ReactNode;
}) {
  const { cot, hang } = nhipO(co);
  const st: CSSProperties = {
    gridColumn: `span ${cot}`,
    gridRow: `span ${hang}`,
    minHeight: 0,
    minWidth: 0,
  };
  return (
    <div style={st} data-o-co={co} data-o-vai={vai}>
      <VaiOProvider vai={vai}>{children}</VaiOProvider>
    </div>
  );
}

export default function BeMatHome({
  duKien,
  ambient,
  ngaySoKhong,
  noiDung,
  vietDangDo,
  anhPhien = null,
  duAnGanDay,
  minuteTick,
}: BeMatHomeProps) {
  const en = useLang() === 'en';
  const kh = keHoachHome(duKien);
  const gap = `calc(var(--gap) * ${kh.nhip.heSoGap})`;

  /* ── B ── (Main.dc.html) không đi qua lưới: hero trái-dưới trên nền công việc, tín hiệu
     phải-trên không vỏ, kệ dự án một dòng đáy-phải, master-tool đáy giữa. */
  if (kh.trangThai === 'B' && vietDangDo) {
    return (
      <div
        className="relative flex h-full w-full flex-col"
        data-home-trang-thai="B"
        data-home-mat-do={kh.matDo}
      >
        {/* NỀN = CHÍNH VIỆC ĐANG DỞ — chỉ khi ảnh đã qua cổng "khoảnh khắc đẹp" (A4 fail-closed).
            Không có ⇒ nền môi trường theo giờ (SystemWallpaper của DongStudioHome) hiện xuyên. */}
        {anhPhien && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${anhPhien})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* Phủ chuyển sắc theo bản vẽ: đậm mép trên/dưới, thưa ở giữa — chữ đọc được mà
                nền vẫn là nhân vật. Token-hoá bằng --bg để sống cả hai theme. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--bg) 82%, transparent) 0%, color-mix(in srgb, var(--bg) 38%, transparent) 34%, color-mix(in srgb, var(--bg) 55%, transparent) 72%, color-mix(in srgb, var(--bg) 88%, transparent) 100%)',
              }}
            />
          </>
        )}

        {/* Lời chào nhỏ — KHÔNG đọc giờ to ở B (giờ chỉ cảm qua ánh sáng nền). */}
        <section data-home-dai="khong-khi" className="relative shrink-0">
          {ambient}
        </section>

        <div className="relative flex min-h-0 flex-1" style={{ gap: 24 }}>
          {/* HERO trái-dưới */}
          <div
            className="flex min-h-0 flex-1 flex-col justify-end"
            style={{ paddingBottom: 'clamp(16px, 4vh, 44px)' }}
          >
            <HeroTiepTuc data={vietDangDo} />
          </div>
          {/* TÍN HIỆU nhóm C — phải-trên, không vỏ. Rỗng ⇒ cột không tồn tại. */}
          <div className="flex shrink-0 flex-col items-end" style={{ paddingTop: 8 }}>
            <TinHieuPhai tinHieu={vietDangDo.tinHieu} />
          </div>
        </div>

        {/* ĐÁY: kệ dự án một dòng (phải). Vòng Vitals của bản vẽ KHÔNG dựng — chưa có nguồn
            điểm thật; hiện diện Vitals thật ở VitalsAperture (AppChrome). Không dữ liệu giả. */}
        {duAnGanDay && duAnGanDay.length > 0 && (
          <div
            className="relative flex shrink-0 items-end justify-end"
            style={{ paddingBottom: 18 }}
          >
            <KeDuAnMotDong projects={duAnGanDay} />
          </div>
        )}

        <MasterToolHome />
      </div>
    );
  }

  /* ── A ── (HomeStart.dc.html) — đồng hồ mảnh lớn giữa màn, ba cửa vào THẬT ngay dưới.
     "CẤM giả lập dashboard": không ô nào khác, không hàng widget bịa. */
  if (kh.trangThai === 'A') {
    return (
      <div
        className="flex h-full w-full flex-col overflow-y-auto"
        data-home-trang-thai="A"
        data-home-mat-do={kh.matDo}
      >
        <section data-home-dai="khong-khi" className="shrink-0">
          {ambient}
        </section>
        <div
          className="flex min-h-0 flex-1 flex-col items-center"
          style={{
            justifyContent: 'safe center',
            gap: 'clamp(20px, 4vh, 36px)',
            paddingBottom: 'clamp(16px, 4vh, 40px)',
          }}
        >
          <DongHoMong tick={minuteTick} en={en} />
          {/* BA CỬA VÀO — `ngaySoKhong` giữ nguyên handler thật (ProjectSelect). */}
          <section
            data-home-dai="ngay-so-khong"
            className="w-full"
            style={{ maxWidth: 'min(100%, 860px)' }}
          >
            {ngaySoKhong}
          </section>
        </div>
      </div>
    );
  }

  /* ─── C · D · E — LƯỚI Ô CO THEO SỐ Ô THẬT (giữ nguyên bản 23/08, lỗi ⑩ đã vá) ─── */
  const cotCanDung = kh.bay.reduce((s, m) => s + nhipO(m.co).cot, 0);
  const cotDung = Math.max(1, Math.min(kh.nhip.cot, cotCanDung));
  const RONG_DAY = 1280;
  const rongKhung = `min(100%, ${Math.round((RONG_DAY * cotDung) / kh.nhip.cot)}px)`;

  return (
    <div
      className="flex h-full w-full justify-center overflow-y-auto"
      data-home-trang-thai={kh.trangThai}
      data-home-mat-do={kh.matDo}
    >
      <div
        className="flex w-full flex-col"
        style={{
          maxWidth: rongKhung,
          gap,
          paddingTop: 'clamp(16px, 3vh, 40px)',
          paddingBottom: 40,
          /* `safe center`: nội dung dày tự cư xử như `start`, không cắt mất phần trên. */
          justifyContent: 'safe center' as const,
        }}
        data-home-cot={cotDung}
      >
        <section data-home-dai="khong-khi">{ambient}</section>

        {kh.bay.length > 0 && (
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cotDung}, minmax(0, 1fr))`,
              gridAutoRows: CAO_O,
              gap,
            }}
          >
            {kh.bay.map((m) => {
              const node = noiDung[m.ma];
              // Nơi gọi không cấp nội dung ⇒ KHÔNG vẽ ô rỗng.
              if (!node) return null;
              return (
                <O key={m.ma} co={m.co} vai={m.vai}>
                  {node}
                </O>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Xuất lại để nơi gọi/soi đọc được kế hoạch mà không phải render. */
export { keHoachHome };
export type { KeHoachHome };
