'use client';

/**
 * components/ui/MucNenDan.tsx — MỘT MỤC TRONG CHUỖI CỔNG, BA TRẠNG THÁI (nguyên thể dùng chung).
 *
 * ⭐ NÉN DẦN KHI ĐÃ XONG: cổng nào người đã duyệt thì CO LẠI thành MỘT DÒNG tóm tắt, nhường
 * chỗ cho cổng đang tới. Chuỗi mười bước không đẩy người dùng cuộn mười màn.
 *
 * Dùng CHUNG cho mọi chuỗi có cổng duyệt — Ảnh→Spec · Grounded Render · gói hồ sơ · bất kỳ
 * pipeline nào về sau. Ai tự chế "bước đã xong" riêng là đẻ ra hiện thực thứ hai.
 *
 * ⚠️ `daXong` KHÔNG phải ẩn đi: dòng tóm tắt vẫn đọc được, vẫn bấm mở lại được. Ẩn hẳn là
 * cắt mất bằng chứng người dùng đã duyệt cái gì — trái luật đích-đến-phải-sửa-được [T5].
 */

import type { ReactNode } from 'react';
import { DUONG_CONG, giamChuyenDong, NHIP, thoiLuong } from '@/lib/ui/nhip';
import { tiTrongMuc, type TrangThaiMuc } from '@/lib/ui/hien-dan';

export interface MucNenDanProps {
  trangThai: TrangThaiMuc;
  /** Tên cổng — luôn hiện ở cả ba trạng thái. */
  ten: string;
  /** MỘT DÒNG tóm tắt điều đã duyệt. Bắt buộc khi `daXong`; đó là toàn bộ nội dung còn lại. */
  tomTat?: string;
  /** Nội dung đầy đủ — chỉ dựng khi đang làm. */
  children?: ReactNode;
  /** Mở lại cổng đã xong. Không truyền ⇒ nút mở lại hiện MỜ kèm lý do thật. */
  onMoLai?: () => void;
  /** Lý do không mở lại được — hiện trong ô giải nghĩa, cấm bỏ trống khi đã khoá. */
  lyDoKhoa?: string;
}

/** Dấu hiệu trạng thái = HÌNH + CHỮ, không chỉ màu (luật màu-không-là-kênh-duy-nhất). */
const DAU: Record<TrangThaiMuc, { ky: string; chu: string }> = {
  dangToi: { ky: '○', chu: 'đang tới' },
  dangLam: { ky: '◉', chu: 'đang làm' },
  daXong: { ky: '✓', chu: 'đã xong' },
};

export function MucNenDan({ trangThai, ten, tomTat, children, onMoLai, lyDoKhoa }: MucNenDanProps) {
  const giam = giamChuyenDong();
  const ms = thoiLuong(NHIP.bang, giam);
  const dau = DAU[trangThai];
  const xong = trangThai === 'daXong';
  const idLyDo = `muc-nen-dan-ly-do-${ten.replace(/\s+/g, '-')}`;

  return (
    <section
      aria-label={`${ten} — ${dau.chu}`}
      style={{
        flex: `${tiTrongMuc(trangThai)} 1 auto`,
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: 'var(--r-3)',
        border: '1px solid var(--vien-mo)',
        background: trangThai === 'dangLam' ? 'var(--card)' : 'transparent',
        padding: xong ? '8px 12px' : '12px 14px',
        transition: ms === 0 ? 'none' : `flex-grow ${ms}ms ${DUONG_CONG}, padding ${ms}ms ${DUONG_CONG}`,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden style={{ color: xong ? 'var(--success)' : 'var(--t3)', fontSize: 13 }}>
          {dau.ky}
        </span>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>{ten}</span>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>{dau.chu}</span>
        {xong && (
          <button
            type="button"
            onClick={onMoLai}
            aria-disabled={onMoLai ? undefined : true}
            aria-describedby={onMoLai ? undefined : idLyDo}
            onClickCapture={(e) => {
              if (!onMoLai) e.stopPropagation();
            }}
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'var(--t2)',
              background: 'transparent',
              border: '1px solid var(--vien-mo)',
              borderRadius: 'var(--r-1)',
              padding: '2px 8px',
              cursor: onMoLai ? 'pointer' : 'default',
              opacity: onMoLai ? 1 : 'var(--mo-vo-hieu)',
            }}
          >
            Mở lại
          </button>
        )}
        {xong && !onMoLai && (
          <span id={idLyDo} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {lyDoKhoa ?? 'Cổng này đã khoá sau khi duyệt — mở lại phải quay về bước trước.'}
          </span>
        )}
      </header>

      {xong && tomTat && (
        <p style={{ margin: '4px 0 0 21px', fontSize: 12, color: 'var(--t3)' }}>{tomTat}</p>
      )}
      {trangThai === 'dangLam' && children && <div style={{ marginTop: 10 }}>{children}</div>}
    </section>
  );
}

export default MucNenDan;
