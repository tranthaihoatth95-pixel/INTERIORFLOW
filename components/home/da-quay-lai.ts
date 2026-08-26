/**
 * components/home/da-quay-lai.ts — [marker: daQuayLaiHome] MỘT dữ kiện, một chỗ đọc/ghi:
 * *"trong PHIÊN NÀY, người dùng đã rời Home vào một workspace rồi quay lại chưa?"*
 *
 * VÌ SAO CẦN: bản chốt 23/08 tách **C · Start of Day** với **D · Active Work — quay về Home
 * GIỮA GIỜ**. Hai thứ đó KHÔNG phân biệt được bằng đồng hồ: 10 giờ sáng có thể là lúc mới mở
 * máy (C) hoặc lúc vừa bật về từ chặng 3D (D). Đoán bằng giờ là đoán sai một nửa số lần.
 *
 * VÌ SAO `sessionStorage` chứ không `localStorage`: đây là dữ kiện của **một phiên làm việc**.
 * Ghi vào `localStorage` thì hôm sau mở máy lần đầu vẫn đọc ra "đã quay lại" ⇒ C không bao giờ
 * xuất hiện nữa. Phiên đóng là dữ kiện hết hạn — đúng bản chất của nó.
 *
 * ⛔ KHÔNG suy từ `document.referrer` hay lịch sử điều hướng: điều hướng trong app là client-side
 * nên `referrer` đứng yên, và đọc `history` không cho biết *đã đi tới đâu*.
 */

const KHOA = 'interiorflow.home.daRoi_v1';

/** Đã từng rời Home trong phiên này chưa. Không có `sessionStorage` (SSR) ⇒ `false`. */
export function docDaQuayLai(): boolean {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    return sessionStorage.getItem(KHOA) === '1';
  } catch {
    // Chế độ riêng tư / bộ nhớ đầy: mất dữ kiện này chỉ làm Home chọn C thay vì D — nhẹ hơn
    // hẳn việc ném lỗi ra giữa lượt dựng.
    return false;
  }
}

/** Đánh dấu "đã rời Home". Gọi lúc Home gỡ khỏi cây (người dùng đi vào một workspace). */
export function ghiDaRoiHome(): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(KHOA, '1');
  } catch {
    /* xem lý do nuốt lỗi ở `docDaQuayLai` */
  }
}
