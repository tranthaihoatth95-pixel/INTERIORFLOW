'use client';

/**
 * components/home/BatDauNgaySoKhong.tsx — [marker: ngaySoKhong] HOME NGÀY-SỐ-KHÔNG.
 *
 * BÀI TOÁN: IF vừa cài, chưa có dự án nào, chưa có việc nào, chưa có tệp nào. Màn vẫn phải đọc
 * ra là một sản phẩm TRỌN VẸN — không phải một dashboard đang dựng dở.
 *
 * ⛔ ĐIỀU KHÔNG ĐƯỢC LÀM, và lý do:
 *   · CẤM bịa số liệu ("3 dự án đang chạy", "12 việc tuần này"). Số giả trên màn đầu tiên là
 *     thứ giết niềm tin sớm nhất — và nó phá thẳng luật một-nguồn: mọi con số trong IF phải
 *     truy được về một chỗ có thật.
 *   · CẤM thẻ trắng to đùng chờ dữ liệu. Không có dữ liệu thì ô đó KHÔNG TỒN TẠI (widget thiếu
 *     dữ liệu tự ẩn, luật 13/08) — chứ không đứng đó làm khung rỗng.
 *   · CẤM nút giả. Việc nào chưa nối được thì hiện MỜ kèm LÝ DO THẬT đi đường
 *     `aria-disabled` + `aria-describedby` (KHÔNG `disabled` + `title` — Tab bỏ qua và cảm
 *     ứng không thấy `title`, lý do không bao giờ tới nơi).
 *
 * ⭐ HÌNH DẠNG: **ba việc chính, ba lối phụ** — không phải bức tường nút tính năng.
 *   Chính: Tạo dự án · Mở dự án · Nhập nguồn — ba cách DUY NHẤT để dữ liệu đầu tiên vào IF.
 *   Phụ:   Khám phá Thư viện · Ghi chú nhanh · Bắt đầu từ đâu — xem trước, ghi tạm, học đường đi.
 *
 * 🟣 01/09 — VÁ THỊ GIÁC THEO BẢN VẼ GĐ1 (`design-if/HomeStart.dc.html`): ba việc chính đổi từ
 * ba THẺ vuông sang MỘT HÀNG PILL bo full đứng giữa (đúng gu liquid-glass · pill bo full ·
 * đơn sắc + 1 accent). "Tạo dự án" là CTA DUY NHẤT mang `--accent`; hai pill kia kính trung
 * tính. Handler + khuôn trợ năng (`aria-disabled`/`aria-describedby`) GIỮ NGUYÊN — câu mô tả
 * từng cửa (`cau`) chuyển vào `sr-only` để trình đọc màn hình vẫn nghe được, mắt thì đọc pill.
 *
 * Nó CÙNG MỘT vật với trạng thái TRỐNG của ô Dự án, không phải màn chào riêng: hết dự án thì
 * quay lại đúng màn này. Một cửa vào, không hai mô hình.
 */

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { FolderPlus, FolderOpen, Import, Library, PenLine, Compass, ChevronRight } from 'lucide-react';

export interface ViecChinh {
  ma: string;
  bieuTuong: ReactNode;
  ten: string;
  cau: string;
  onClick?: () => void;
  /** Lý do thật khiến việc này chưa bấm được — có giá trị thì thẻ thành mờ, vẫn Tab tới được. */
  lyDoMo?: string;
}

/** Pill kính trung tính — bo full theo bản vẽ; nền/viền token nên hai theme tự đúng. */
const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  height: 'var(--tap, 44px)',
  padding: '0 22px',
  borderRadius: 'var(--r-full, 999px)',
  background: 'var(--nen-mo-card, var(--card))',
  border: '1px solid var(--vien-mo, var(--border))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  color: 'var(--t1)',
  fontSize: 14,
  fontFamily: 'inherit',
};

/** CTA accent — ĐÚNG MỘT pill mang màu nhấn trên màn này ("Tạo dự án"). */
const PILL_ACCENT: CSSProperties = {
  ...PILL,
  background: 'var(--accent)',
  border: '1px solid transparent',
  color: 'var(--on-accent, #fff)',
  fontWeight: 500,
  boxShadow: '0 10px 30px color-mix(in srgb, var(--accent) 40%, transparent)',
};

/** Ba bước đường đi — chữ mô tả CƠ CHẾ THẬT của IF, không phải lời quảng cáo. */
function baBuoc(en: boolean): { so: string; cau: string }[] {
  return en
    ? [
        { so: '01', cau: 'A project holds everything: drawings, 3D, materials, the client deck.' },
        { so: '02', cau: 'Draw in 2D or build in 3D — either way it writes to the same document.' },
        { so: '03', cau: 'Presenting only packages what the other two stages already made.' },
      ]
    : [
        { so: '01', cau: 'Một dự án giữ tất cả: bản vẽ, khối 3D, vật liệu, hồ sơ trình khách.' },
        { so: '02', cau: 'Vẽ ở 2D hay dựng ở 3D đều được — cả hai ghi vào cùng một hồ sơ.' },
        { so: '03', cau: 'Trình chiếu chỉ đóng gói thứ hai chặng kia đã làm, không sản xuất mới.' },
      ];
}

export default function BatDauNgaySoKhong({
  en,
  onTaoDuAn,
  onMoTuMay,
  lyDoMoTuMay,
  onNhapNguon,
  onThuVien,
  onGhiChu,
}: {
  en: boolean;
  onTaoDuAn: () => void;
  onMoTuMay?: () => void;
  /** Truyền lý do ⇒ "Mở dự án" hiện mờ. Bỏ trống ⇒ nút chạy thật. */
  lyDoMoTuMay?: string;
  onNhapNguon: () => void;
  onThuVien: () => void;
  onGhiChu?: () => void;
}) {
  const [moDuongDi, setMoDuongDi] = useState(false);

  const chinh: ViecChinh[] = [
    {
      ma: 'tao',
      bieuTuong: <FolderPlus size={16} aria-hidden />,
      ten: en ? 'Create a project' : 'Tạo dự án',
      cau: en ? 'Start from an empty document.' : 'Bắt đầu từ một hồ sơ trống.',
      onClick: onTaoDuAn,
    },
    {
      ma: 'mo',
      bieuTuong: <FolderOpen size={16} aria-hidden />,
      ten: en ? 'Open a project' : 'Mở dự án',
      cau: en ? 'Restore one from a file on this machine.' : 'Khôi phục từ tệp có sẵn trên máy.',
      onClick: onMoTuMay,
      lyDoMo: lyDoMoTuMay,
    },
    {
      ma: 'nhap',
      bieuTuong: <Import size={16} aria-hidden />,
      ten: en ? 'Import sources' : 'Nhập nguồn',
      cau: en ? 'Drawings, photos, spreadsheets — IF reads them in.' : 'Bản vẽ, ảnh, bảng tính — IF đọc vào.',
      onClick: onNhapNguon,
    },
  ];

  const phu: { ten: string; bieuTuong: ReactNode; onClick?: () => void; lyDoMo?: string }[] = [
    {
      ten: en ? 'Explore the Library' : 'Khám phá Thư viện',
      bieuTuong: <Library size={14} aria-hidden />,
      onClick: onThuVien,
    },
    {
      ten: en ? 'Quick note' : 'Ghi chú nhanh',
      bieuTuong: <PenLine size={14} aria-hidden />,
      onClick: onGhiChu,
      lyDoMo: onGhiChu
        ? undefined
        : en
          ? 'The notes widget is not on screen right now.'
          : 'Ô ghi chú nhanh hiện không có trên màn này.',
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center overflow-y-auto px-5 py-5 text-center">
      {/* Đầu ô — một câu nói ĐÚNG sự thật hiện tại, không xin lỗi vì trống. */}
      <div className="shrink-0">
        <p className="text-[length:var(--fs-md,15px)] font-medium leading-snug text-[var(--t2)]">
          {en
            ? 'Nothing here yet — pick a door and IF starts working for you.'
            : 'Chưa có gì ở đây — chọn một cửa là IF bắt đầu làm việc cho bạn.'}
        </p>
      </div>

      {/* BA VIỆC CHÍNH — MỘT HÀNG PILL (HomeStart.dc.html). `flex-wrap` để màn hẹp tự xuống
          hàng, không khai breakpoint px nào. "Tạo dự án" là pill accent DUY NHẤT. */}
      <div className="mt-5 flex shrink-0 flex-wrap items-center justify-center gap-2.5">
        {chinh.map((v, i) => {
          const mo = !!v.lyDoMo;
          const idLyDo = `if-bd-${v.ma}`;
          const kieu = i === 0 ? PILL_ACCENT : PILL;
          return (
            <span key={v.ma} className="inline-flex">
              <button
                type="button"
                aria-disabled={mo || undefined}
                aria-describedby={idLyDo}
                onClick={mo ? undefined : v.onClick}
                className="transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{
                  ...kieu,
                  opacity: mo ? 'var(--mo-vo-hieu)' : undefined,
                  cursor: mo ? 'not-allowed' : 'pointer',
                }}
              >
                {v.bieuTuong}
                {v.ten}
              </button>
              {/* Câu mô tả cửa + lý do mờ (nếu có) — vẫn tới được trình đọc màn hình. */}
              <span id={idLyDo} className="sr-only">
                {v.cau}
                {mo ? ` ${v.lyDoMo}` : ''}
              </span>
            </span>
          );
        })}
      </div>

      {/* Hairline — tách VIỆC LÀM NGAY khỏi ĐƯỜNG XEM TRƯỚC. Đường kẻ mảnh này là ranh giới
          giữa hai loại việc, không phải trang trí. */}
      <div className="mt-5 h-px w-full max-w-[420px] shrink-0" style={{ background: 'var(--vien-mo, var(--border))' }} aria-hidden />

      {/* BA LỐI PHỤ — chữ, không phải thẻ: chúng là lối rẽ, không cùng hạng với ba cửa trên. */}
      <div className="mt-3 flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {phu.map((p) => {
          const mo = !!p.lyDoMo;
          const idLyDo = mo ? `if-bd-phu-${p.ten.replace(/\s+/g, '-').toLowerCase()}` : undefined;
          return (
            <span key={p.ten} className="inline-flex items-center">
              <button
                type="button"
                aria-disabled={mo || undefined}
                aria-describedby={idLyDo}
                onClick={mo ? undefined : p.onClick}
                className="inline-flex items-center gap-1.5 text-[length:var(--fs-xs)] text-[var(--t3)] underline-offset-4 transition-colors hover:text-[var(--t1)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                style={{ opacity: mo ? 'var(--mo-vo-hieu)' : undefined, cursor: mo ? 'not-allowed' : 'pointer' }}
              >
                {p.bieuTuong}
                {p.ten}
              </button>
              {mo && (
                <span id={idLyDo} className="sr-only">
                  {p.lyDoMo}
                </span>
              )}
            </span>
          );
        })}

        {/* "Bắt đầu từ đâu" — MỞ TẠI CHỖ, không điều hướng đi đâu cả. Một trang hướng dẫn riêng
            ở màn đầu tiên là đẩy người dùng ra khỏi sản phẩm ngay khi họ vừa vào. */}
        <button
          type="button"
          onClick={() => setMoDuongDi((v) => !v)}
          aria-expanded={moDuongDi}
          className="inline-flex items-center gap-1.5 text-[length:var(--fs-xs)] text-[var(--t3)] underline-offset-4 transition-colors hover:text-[var(--t1)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <Compass size={14} aria-hidden />
          {en ? 'Where to start' : 'Bắt đầu từ đâu'}
          <ChevronRight
            size={14}
            aria-hidden
            style={{ transform: moDuongDi ? 'rotate(90deg)' : undefined, transition: 'transform 160ms ease' }}
          />
        </button>
      </div>

      {moDuongDi && (
        <ol className="mt-3 flex shrink-0 flex-col items-start gap-2 text-left">
          {baBuoc(en).map((b) => (
            <li key={b.so} className="flex items-start gap-2.5">
              <span className="mt-px shrink-0 font-mono text-[length:var(--fs-2xs)] font-semibold text-[var(--t4)]">{b.so}</span>
              <span className="text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">{b.cau}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
