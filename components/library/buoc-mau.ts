'use client';

/**
 * components/library/buoc-mau.ts — [marker: mauLaMotBuoc] MÀU LÀ MỘT **BƯỚC** TRONG CHỌN VẬT LIỆU.
 *
 * Hoà chốt 16/08: *"màu là 1 BƯỚC chọn vật liệu, nó thuộc thư viện vật liệu"* ⇒ Bảng màu **không**
 * là mục trên rail, **không** là kệ riêng, **không** là điểm đến độc lập
 * (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §1 §4).
 *
 * Route `/colors` GIỮ NGUYÊN — xoá là vỡ bookmark/link cũ. Nó đổi vai: thôi làm trang, chuyển
 * thành **cửa dẫn vào đúng bước** trong sheet Thư viện. Đây đúng khuôn `/library` đã làm từ 03/08
 * (`app/library/page.tsx`): deep-link cũ không rơi vào trang trắng, nó mở thứ thật ở chỗ thật.
 *
 * ⚠️ VÌ SAO KHÔNG NHÉT VÀO `lib/library/use-library-sheet.ts`: khoá `if:open-library-on-load` bên
 * đó là cờ NHỊ PHÂN "mở sheet", không mang nổi *kệ nào · bước nào*. Nới nó ra là sửa file NGOÀI
 * vùng ghi của phiên này (biên phiếu V2) — và biên đó có lý do: `use-library-sheet` là cửa chung
 * cho mọi nơi mở Thư viện, đổi hợp đồng của nó giữa lúc hai phiên chạy song song là đúng thứ
 * "build chéo ngược" mà hợp đồng cấu trúc sinh ra để chặn. Nên: cờ này đi **cạnh** cờ kia, cùng
 * cơ chế `sessionStorage`, và chỉ `LibrarySheet` đọc.
 *
 * Phải là `sessionStorage` chứ không phải sự kiện: gõ thẳng `/colors` là **TẢI TRANG CỨNG**, mọi
 * listener của trang trước đã chết — cùng ca đã bắt được khi verify `/library` (xem docstring ở đó).
 */

/** Bước bên trong kệ vật liệu. `duyet` = duyệt vật liệu (mặc định) · `mau` = chọn theo bảng màu. */
export type BuocVatLieu = 'duyet' | 'mau';

const KEY = 'if:library-buoc-mau';

/** Đánh dấu "lần tải trang sau: mở kệ vật liệu, dừng ở bước Màu". Dùng 1 lần rồi tự xoá. */
export function danhDauMoBuocMau(): void {
  try {
    window.sessionStorage.setItem(KEY, '1');
  } catch {
    // private-mode/quota — mất cờ thì cùng lắm sheet mở ở bước Duyệt, không gãy gì
  }
}

/** Nhận cờ (nếu có) và xoá ngay — không để dính sang lần tải kế tiếp. */
export function nhanBuocMauDangCho(): boolean {
  try {
    if (window.sessionStorage.getItem(KEY) !== '1') return false;
    window.sessionStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}

/** Nhãn hai bước — một nguồn chữ cho cả sheet lẫn mock, không chép tay lần hai. */
export const BUOC_LABEL: Record<BuocVatLieu, { vi: string; en: string }> = {
  duyet: { vi: 'Duyệt vật liệu', en: 'Browse materials' },
  mau: { vi: 'Chọn theo màu', en: 'Pick by colour' },
};
