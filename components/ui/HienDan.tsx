'use client';

/**
 * components/ui/HienDan.tsx — HIỆN DẦN THEO NGHĨA (nguyên thể dùng chung).
 *
 * Nơi dùng chỉ việc KHAI BẬC cho từng mẩu nội dung; thứ tự · độ trễ · ẩn-hiện-theo-nấc do
 * `lib/ui/hien-dan.ts` quyết. Cấm nơi dùng tự chế `setTimeout` riêng — đó là cách năm màn
 * hình có năm nhịp khác nhau.
 *
 * ⚠️ ẨN THEO NẤC LÀ ẨN THỊ GIÁC, KHÔNG PHẢI XOÁ: mẩu không thuộc nấc hiện tại thì không
 * render — nhưng ba bậc đầu (danh tính · kết quả · độ chắc) có mặt ở MỌI nấc, nên nấc gọn
 * luôn tự đứng được một mình, đúng cửa nghiệm thu "gọn và tươm tất".
 */

import { useEffect, useState, type ReactNode } from 'react';
import { DUONG_CONG, giamChuyenDong, NHIP, thoiLuong } from '@/lib/ui/nhip';
import { hienONac, treTheoBac, type BacHien } from '@/lib/ui/hien-dan';

export interface HienDanProps {
  /** Bậc nghĩa của mẩu nội dung này. */
  bac: BacHien;
  /** Nấc hiện tại của bề mặt chứa nó. */
  nac: 'vien' | 'bang' | 'bangSau';
  /** Bề mặt đã mở chưa — đóng thì đếm lại từ đầu cho lần mở sau. */
  mo: boolean;
  children: ReactNode;
  className?: string;
}

export function HienDan({ bac, nac, mo, children, className }: HienDanProps) {
  const giam = giamChuyenDong();
  const tre = treTheoBac(bac, giam);
  const [hien, setHien] = useState(giam);

  useEffect(() => {
    if (!mo) {
      setHien(false);
      return;
    }
    if (tre === 0) {
      setHien(true);
      return;
    }
    const t = window.setTimeout(() => setHien(true), tre);
    return () => window.clearTimeout(t);
  }, [mo, tre]);

  if (!hienONac(bac, nac)) return null;

  const ms = thoiLuong(NHIP.bam, giam);

  return (
    <div
      className={className}
      style={{
        opacity: hien ? 1 : 0,
        // Nhích 4px chứ không trượt cả thân: mẩu nội dung phải xuất hiện ĐÚNG CHỖ nó sẽ đứng.
        transform: hien ? 'none' : 'translateY(4px)',
        transition: ms === 0 ? 'none' : `opacity ${ms}ms ${DUONG_CONG}, transform ${ms}ms ${DUONG_CONG}`,
      }}
    >
      {children}
    </div>
  );
}

export default HienDan;
