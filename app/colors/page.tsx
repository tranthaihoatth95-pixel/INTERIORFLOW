'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { markOpenLibraryOnLoad } from '@/lib/library/use-library-sheet';
import { danhDauMoBuocMau } from '@/components/library/buoc-mau';

/**
 * [marker: mauLaMotBuoc] `/colors` KHÔNG còn là trang.
 *
 * Hoà chốt 16/08: *"màu là 1 BƯỚC chọn vật liệu, nó thuộc thư viện vật liệu"*
 * (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §1: Bảng màu ⛔ không lên rail, §4: màu **không** phải
 * một kệ). Trước 17/08 nó là màn đứng riêng bọc `<AppShell>`, lối vào duy nhất là nút "Bảng màu"
 * ở `components/materials/MaterialsScreen.tsx:181` — tức một điểm đến độc lập, trái chốt.
 *
 * ⚠️ **KHÔNG XOÁ ROUTE** — xoá là vỡ bookmark và mọi link cũ. Nó đổi VAI: dẫn người dùng tới đúng
 * chỗ màu thật sự sống — kệ **Vật liệu** trong sheet Thư viện, bước **Chọn theo màu**. Màn cũ
 * (`components/colors/ColorLibraryScreen`) không mất một dòng nào; nó nay render **bên trong** bước
 * đó (xem `components/library/LibrarySheet.tsx`, nhánh `buoc === 'mau'`).
 *
 * Khuôn này chép nguyên của `/library` (chốt 03/08, `app/library/page.tsx`) — cùng bài toán
 * "deep-link cũ trỏ vào thứ đã thôi làm trang", nên dùng cùng một lời giải chứ không chế lời giải
 * thứ hai. Kể cả cái bẫy đã trả giá bên đó: phải ghi ý định vào `sessionStorage` TRƯỚC khi điều
 * hướng, vì `router.back()` có thể là TẢI TRANG CỨNG và mọi timer/listener của trang này chết theo.
 */
export default function ColorsRedirect() {
  const router = useRouter();

  useEffect(() => {
    markOpenLibraryOnLoad(); // mở sheet Thư viện (cơ chế chung, chỉ GỌI — không sửa `lib/library`)
    danhDauMoBuocMau();      // …và dừng ở kệ Vật liệu, bước "Chọn theo màu"
    if (window.history.length > 1) router.back();
    else router.replace('/');
  }, [router]);

  return null;
}
