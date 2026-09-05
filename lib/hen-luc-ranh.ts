/**
 * lib/hen-luc-ranh.ts — HẸN MỘT VIỆC CHẠY LÚC TRÌNH DUYỆT RẢNH, huỷ được.
 *
 * ⛔ VÌ SAO TÁCH RA (05/09): khuôn này đã sống từ trước ở `sheets-persist.ts` dưới dạng một
 * closure `henIdle` — đúng, có lý do ghi tại chỗ (cục stringify nổ đúng lúc người dùng chạm lại
 * canvas), nhưng KHÔNG export được. Lượt nối máy xem trước vật liệu cần y hệt cơ chế đó (nâng
 * nấc ảnh lúc rảnh, huỷ khi cuộn qua). Chép thân hàm sang chỗ thứ hai là dựng **hai bản của
 * cùng một cơ chế** — đúng họ bệnh `soi:dong-dang` sinh ra để bắt, và là thứ luật 6 cấm.
 * ⇒ Tách nguyên văn ra đây, hai nơi cùng gọi. KHÔNG đổi một dòng hành vi nào.
 *
 * Trần thời gian là BẮT BUỘC: không có `timeout` thì một tab bận có thể không bao giờ rảnh và
 * việc nằm im vĩnh viễn. Trình duyệt cũ / Node không có `requestIdleCallback` ⇒ rơi về macrotask
 * kế, tức "sớm nhất có thể" — chậm hơn thì thà chạy ngay còn hơn không chạy.
 */

/**
 * @param fn việc cần chạy khi rảnh
 * @param tranMs trần chờ; quá hạn thì trình duyệt chạy `fn` bất kể còn bận
 * @returns hàm HUỶ — gọi trước khi `fn` chạy thì việc không xảy ra
 */
export function henLucRanh(fn: () => void, tranMs = 1500): () => void {
  const g = globalThis as {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof g.requestIdleCallback === 'function') {
    const id = g.requestIdleCallback(fn, { timeout: tranMs });
    return () => g.cancelIdleCallback?.(id);
  }
  const id = setTimeout(fn, 0);
  return () => clearTimeout(id);
}
