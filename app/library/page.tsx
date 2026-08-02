'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { markOpenLibraryOnLoad } from '@/lib/library/use-library-sheet';

/**
 * `/library` KHÔNG còn là trang (Hoà chốt 03/08 — "Thư viện là MỘT NƠI DUY NHẤT, và nó là SHEET").
 *
 * Lý do bỏ trang: thư viện chỉ có nghĩa khi KÉO được vào chỗ đang làm. Trang riêng không có chỗ để
 * kéo — bằng chứng là chính nó phải chế ra "Vùng thả mô phỏng (demo)". Sheet thì luôn có bàn làm
 * việc thật nằm ngay dưới.
 *
 * Deep-link cũ (bookmark, link trong doc) không được rơi vào trang trắng: quay lại trang trước rồi
 * MỞ SHEET. Không có lịch sử để quay lại (mở tab mới thẳng vào `/library`) thì về `/`.
 */
export default function LibraryRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Ý ĐỊNH "mở Thư viện" ghi vào sessionStorage TRƯỚC khi điều hướng, sheet đọc lúc mount.
    //
    // Vì sao không hẹn giờ rồi gọi `openLibrarySheet()`: gõ thẳng `/library` (bookmark, link ngoài)
    // là TẢI TRANG CỨNG, `router.back()` cũng tải cứng trang trước ⇒ mọi timer/listener của trang
    // này chết theo trang, sự kiện không bao giờ tới. Đã bắt được đúng ca này khi verify (bật về
    // `/files` nhưng sheet im). `sessionStorage` sống xuyên cả 2 kiểu điều hướng.
    markOpenLibraryOnLoad();
    if (window.history.length > 1) router.back();
    else router.replace('/');
  }, [router]);

  return null;
}
