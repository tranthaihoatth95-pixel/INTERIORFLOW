/**
 * lib/cad/standards/types.ts — TRỤC NGUỒN + NGUYÊN VĂN ĐIỀU KHOẢN (phiếu P-B, 16/08).
 *
 * File này CHỈ THÊM hai trường tuỳ chọn vào `StandardRule` (registry.ts `extends RuleSourceMeta`).
 * Không đổi trường cũ, không migrate: rule nào không khai thì chạy y nguyên như trước.
 *
 * ════════════════════════════════════════════════════════════════════════════════════════════
 * ⛔ BA RÀO AN TOÀN — LUẬT, KHÔNG PHẢI KHUYẾN NGHỊ
 * Nguồn: `docs/CHOT-PHIEN-15-08-CAN-SOAT.md` B6 (*"chỗ rủi ro pháp lý cao nhất trong toàn bộ
 * phiên"*) + `docs/00-CHOT.md` 15/08 (*"kiểm tiêu chuẩn = việc của MÁY, AI chỉ đứng ở lớp góp ý"*
 * — Hoà duyệt thành luật).
 *
 *  ① AI CHỈ ĐƯỢC BÁO, KHÔNG ĐƯỢC SỬA BỘ LUẬT.
 *     Nhiều nhất là *"có vẻ có bản mới, đây là link"*. Không hàm nào trong hệ được để AI ghi
 *     thẳng vào `StandardRule` — kể cả `nguyenVan`.
 *
 *  ② MỌI CẬP NHẬT BỘ LUẬT ĐI QUA NGƯỜI DUYỆT.
 *     Khuôn phiếu duyệt (ProposalSheet) là cửa duy nhất. Không có đường tắt "tự áp".
 *
 *  ③ VỚI `loaiNguon: 'luat'` — CHỈ TÌM VÀ TRÍCH NGUYÊN VĂN.
 *     CẤM diễn giải · CẤM tóm tắt · CẤM rút gọn cho vừa thẻ (thẻ ngắn thì cho cuộn, không cắt
 *     chữ của văn bản pháp quy). Rule chưa có nguyên văn thì UI nói thẳng "chưa có nguyên văn",
 *     KHÔNG được để model viết thay — app nói sai một điều khoản mà KTS xuất hồ sơ theo đó thì
 *     hậu quả là thật.
 *
 * Ba rào trên được KHOÁ BẰNG TEST ở `lib/review/hien-thi-luat.test.ts` (ca [11]-[15]), không chỉ
 * bằng lời dặn trong comment.
 * ════════════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * TRỤC NGUỒN — *ai ban hành trị số này*. Nguồn: `CHOT-PHIEN-15-08-CAN-SOAT.md` B2.
 *
 * ⚠️ ĐỘC LẬP với trục RÀNG BUỘC (`RuleBinding`: mandatory/adjustable/advisory — *chặt tới đâu*).
 * TUYỆT ĐỐI KHÔNG suy trục này ra trục kia, cả hai chiều (B3):
 *   · một TIÊU CHUẨN ngành thành BẮT BUỘC khi hợp đồng viện dẫn;
 *   · một LUẬT vẫn có điều khoản chỉ mang tính KHUYẾN NGHỊ.
 * Vì thế `loaiNguon` là trường KHAI, không phải trường TÍNH — không có hàm nào được đoán nó ra
 * từ `severity`, `binding`, hay từ chuỗi `source`.
 */
export type LoaiNguon =
  /** Nhà nước · chính phủ ban hành (QCVN, thông tư, nghị định). Hiển thị = TRÍCH NGUYÊN VĂN. */
  | 'luat'
  /** Ngành ban hành, có số liệu + nghiên cứu chống lưng (TCVN, ISO, Neufert). Trích số + nguồn. */
  | 'tieuChuan'
  /** Đổi theo xã hội. Bắt buộc có nguồn công khai + ngày, và KHÔNG BAO GIỜ được chặn (B2). */
  | 'xuHuong';

/**
 * Hai trường TUỲ CHỌN gắn thêm vào `StandardRule`. Tách ra file riêng vì chúng nói về XUẤT XỨ
 * của trị số, không nói về phép đo — và vì `registry.ts` đang giữ toàn bộ cơ chế nạp/đè/lọc
 * theo ngày, thêm vào đó nữa là file phình mà nghĩa thì lẫn.
 */
export interface RuleSourceMeta {
  /** Xem `LoaiNguon`. Không khai = CHƯA PHÂN LOẠI — UI hiện đúng chữ đó, không đoán. */
  loaiNguon?: LoaiNguon;
  /**
   * NGUYÊN VĂN điều khoản, chép đúng từng chữ từ văn bản gốc.
   *
   * Trước phiếu này hệ CHỈ giữ mã số (`source` = "QCVN 06:2022/BXD §3.2.1") — đủ để tra tay,
   * KHÔNG đủ để trích vào hồ sơ bảo vệ trước thẩm duyệt. Đây là chỗ lấp.
   *
   * ⛔ Không khai còn hơn khai sai: rào ③ ở đầu file. Trường rỗng ⇒ chế độ ĐẦY ĐỦ hiện
   * `THIEU_NGUYEN_VAN` (lib/review/hien-thi-luat.ts), tuyệt đối không sinh chữ thay thế.
   */
  nguyenVan?: string;
}
