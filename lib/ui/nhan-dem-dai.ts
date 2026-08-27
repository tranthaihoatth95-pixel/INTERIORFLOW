/**
 * nhan-dem-dai.ts — con số trên dải Dự án phải NÓI ĐÚNG nó đếm gì (28/08, L2-07).
 *
 * BỆNH ĐÃ ĐO: dải mang nhãn **"Dự án"** hiện `2/2`, trong khi DB có **17 dự án sống**.
 * Ba tầng sai chồng nhau, và tầng dưới cùng mới là gốc:
 *   ① Con số là `filteredFlows.length / flows.length` — đếm **FLOW**, đứng dưới nhãn **DỰ ÁN**.
 *   ② Ô lọc dự án dựng từ `flow.project`, nên chỉ liệt kê dự án **đã có bản vẽ**.
 *   ③ **Không có nguồn dự án nào cả** — `ProjectSelect` chỉ gọi `/api/flows`; repo chưa có route
 *      liệt kê dự án (`app/api/projects/` chỉ có `[id]`). ⇒ Một dự án chưa có bản vẽ thì **không
 *      tồn tại** với màn Home.
 *
 * `x/y` là một lời khẳng định: *"y là tất cả"*. Ở đây y không phải tất cả (`IF-CANONICAL` §3
 * luật 5 — không dữ liệu giả). File này KHÔNG sửa được ③ (cần route mới + đổi nguồn của dải —
 * đó là đổi bề mặt người dùng nhìn thấy, thuộc quyền Design, luật 3). Nó làm đúng phần thuộc
 * về tính đúng đắn: **đếm cái gì thì gọi tên cái đó, và nói ra phần đang thiếu.**
 */

export type DemDai = {
  /** Số dự án đang hiện thành thẻ (dự án CÓ ít nhất một bản vẽ, sau bộ lọc). */
  duAnHien: number;
  /** Số bản vẽ chưa gắn dự án. */
  nhapHien: number;
  /** Tổng bản vẽ khớp bộ lọc / tổng bản vẽ đã nạp. */
  banVeKhop: number;
  banVeNap: number;
  /** Tổng dự án THẬT của tài khoản — `null` khi chưa đo được. Không được thay bằng 0. */
  tongDuAn: number | null;
  /** Người dùng đang gõ tìm hoặc đang chọn một bộ lọc? */
  dangLoc: boolean;
};

/**
 * Câu hiện trên dải. Không bao giờ trả `x/y` trần — `x/y` chỉ xuất hiện khi ĐANG LỌC,
 * vì lúc đó "trên tổng đã nạp" là câu đúng.
 */
export function nhanDemDai(d: DemDai, en = false): string {
  if (d.dangLoc) {
    return en
      ? `${d.banVeKhop} of ${d.banVeNap} loaded drawings match`
      : `${d.banVeKhop}/${d.banVeNap} bản vẽ đã nạp khớp bộ lọc`;
  }
  const phan: string[] = [];
  phan.push(en ? `${d.duAnHien} project${d.duAnHien === 1 ? '' : 's'}` : `${d.duAnHien} dự án`);
  if (d.nhapHien > 0) phan.push(en ? `${d.nhapHien} draft${d.nhapHien === 1 ? '' : 's'}` : `${d.nhapHien} nháp`);
  return phan.join(' · ');
}

/**
 * Câu nói ra phần ĐANG THIẾU. `null` khi không có gì để nói (chưa đo được, hoặc không thiếu).
 * Đây là thứ biến một con số im lặng sai thành một con số tự khai giới hạn của nó.
 */
export function nhanConThieu(d: DemDai, en = false): string | null {
  if (d.dangLoc) return null;
  if (d.tongDuAn === null) return null;
  const thieu = d.tongDuAn - d.duAnHien;
  if (thieu <= 0) return null;
  return en
    ? `${thieu} more project${thieu === 1 ? '' : 's'} with no drawing yet`
    : `còn ${thieu} dự án chưa có bản vẽ`;
}
