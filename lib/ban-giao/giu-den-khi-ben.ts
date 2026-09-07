'use client';

/**
 * lib/ban-giao/giu-den-khi-ben.ts — LUẬT BÀN GIAO, một chỗ duy nhất.
 *
 * ═══ VÌ SAO TỆP NÀY TỒN TẠI ═══
 *
 * IF có NĂM đường bàn giao giữa hai chặng (CAD→Trình chiếu · Spec→Trình chiếu · Render→Trình
 * chiếu · Trình chiếu⇄Chỉnh ảnh · CAD→Render). Cả năm dựng trên cùng một ý: cất hàng vào
 * session/localStorage ở chặng gửi, lấy ra ở chặng nhận. Và bốn trong năm đường viết cùng một
 * lỗi: `consume` = ĐỌC và XOÁ trong cùng một nhịp.
 *
 * Lỗi đó có giá đo được (`scripts/nghiem-thu-ban-lam-viec/tai-hien-mat-slide.mjs`, 06/09):
 *
 *     ms 5739  nguồn CÒN (133.956 byte trong sessionStorage)
 *     ms 7987  nguồn = 0   ← đã xoá, bản DUY NHẤT của tờ bản vẽ biến mất
 *     ms 9273  IndexedDB mới có slide  ← bền từ đây
 *
 * ⇒ giữa hai mốc là một khoảng mà món hàng **không tồn tại ở đâu bền cả**. Nạp lại trang, đóng
 * tab, hay một lỗi render trong khoảng đó ⇒ mất trắng, và không có đường lấy lại vì nguồn đã bị
 * xoá. Người dùng thì tin là đã gửi xong — đó mới là phần tệ: việc bị đánh rơi TRONG IM LẶNG.
 *
 * ═══ LUẬT (ba câu, không hơn) ═══
 *
 *   ① ĐỌC MÀ GIỮ    — lấy hàng ra xem, KHÔNG xoá nguồn.
 *   ② BUÔNG KHI CÓ BIÊN NHẬN — chỉ xoá nguồn khi đích đã trả lời "đã ghi bền" (một boolean
 *                      THẬT từ tầng ghi, không phải "chắc là xong rồi").
 *   ③ ÁP PHẢI LUỸ ĐẲNG — vì nguồn còn sống, lượt sau có thể áp lại. Phép áp phải nhận ra
 *                      "món này đã nằm ở đích rồi" và buông tay thay vì nhân đôi.
 *
 * Thiếu ③ thì ② thành máy nhân bản; thiếu ② thì ① vô nghĩa. Ba câu đi liền nhau.
 *
 * ═══ CÁI GÌ DÙNG CHUNG, CÁI GÌ KHÔNG (đo 06/09, nói thẳng) ═══
 *
 * DÙNG CHUNG: **luật**, tức hàm `buongKhiDaGhi` dưới đây. Bốn nơi gọi nó.
 *
 * KHÔNG dùng chung: **kho chứa**. Đã cân nhắc gom năm kho vào một factory rồi BỎ, vì chúng khác
 * nhau thật chứ không phải khác vì lười:
 *   · `lib/present-editor/handoff.ts`  — chứa MỘT MẢNG ảnh, có trần `MAX_IMAGES`, còn phải nhận
 *                                        cả shape cũ (phần tử là chuỗi trần).
 *   · `lib/photo-editor/handoff.ts`    — `localStorage` CHIA SẺ GIỮA HAI TAB, có `ts`, có sự kiện
 *                                        `storage`, và CỐ Ý không có mem-fallback (biến module
 *                                        không đi qua được ranh giới tab).
 *   · ba đường còn lại                 — một object, `sessionStorage` + mem-fallback.
 * Ép chúng vào một khuôn là bẻ cong ba thứ để hợp một cái tên. Mỗi kho tự giữ `peek`/`clear` của
 * nó — đó là từ vựng tối thiểu, không phải bản sao của luật.
 */

export interface BuongKhiDaGhiOpts {
  /**
   * BIÊN NHẬN từ tầng ghi bền. `true` = bản ghi CHỨA món hàng đã thật sự nằm trong kho bền
   * (IndexedDB / localStorage / máy chủ). Bất cứ giá trị nào khác ⇒ coi như CHƯA ghi.
   *
   * ⚠️ Đừng truyền hàm luôn trả `true`. Cả cơ chế này đứng trên đúng một câu trả lời đó; một
   * biên nhận giả còn tệ hơn không có biên nhận, vì nó xoá nguồn với vẻ ngoài an toàn.
   */
  bienNhan: () => Promise<boolean> | boolean;
  /** BUÔNG TAY — dọn nguồn (cả kho lẫn mem-fallback). Chỉ được gọi sau biên nhận `true`. */
  xoaNguon: () => void;
  /**
   * Lượt này còn hiệu lực không (component chưa unmount, chưa đổi dự án…). Trả `false` ⇒ GIỮ
   * NGUYÊN nguồn. Dữ liệu vẫn bền, chỉ là ta không buông ở lượt này — lần áp sau luỹ đẳng sẽ
   * nhận ra "đã có ở đích" rồi buông. Thà giữ thừa còn hơn xoá thiếu.
   */
  conHieuLuc?: () => boolean;
}

/**
 * Chờ biên nhận rồi mới buông nguồn. Trả `true` = đã buông; `false` = còn giữ (và đó KHÔNG phải
 * lỗi — nguồn còn sống nghĩa là lần sau còn cứu được).
 */
export async function buongKhiDaGhi(opts: BuongKhiDaGhiOpts): Promise<boolean> {
  let daGhi = false;
  try {
    daGhi = (await opts.bienNhan()) === true;
  } catch {
    daGhi = false; // tầng ghi ném lỗi = chưa bền. Không có nhánh nào xoá nguồn vì "chắc là xong".
  }
  if (!daGhi) return false;
  if (opts.conHieuLuc && !opts.conHieuLuc()) return false;
  opts.xoaNguon();
  return true;
}
