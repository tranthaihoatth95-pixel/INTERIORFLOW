/**
 * components/collab/feature-flags.ts — cờ mở cho **Cửa Sổ Thảo Luận** (phiếu COLLAB-VO 17/08).
 *
 * ⭐ Vì sao có tệp này (không phải nhét thẳng `false` trong `CuaSoThaoLuan.tsx`):
 * phiếu COLLAB-VO chạy SONG SONG với COLLAB-LOI — LOI mở `ProvenanceInput` từ union 2 kind
 * (`image | text`) sang 4 kind (`+ sticky | form | asset`) và thêm hàm chưng cất gộp nguồn.
 * VO không có quyền ghi vào `lib/distill/**` (biên phiếu), nhưng phải dựng được UI đầy đủ
 * NGAY, trong đó có nút "Chưng cất → Thẻ DNA". §9 cấm nút giả bấm không ra gì ⇒ trong lúc LOI
 * chưa ship, nút bắt buộc hiện MỜ **kèm lý do đọc được**, không phải ẩn.
 *
 * Cách dùng: LOI xong ⇒ flip cờ này sang `true` trong CÙNG một dòng, không rải rác nơi khác.
 * Không dùng `typeof` kiểu (types không tồn tại lúc chạy) hoặc try/catch import động (che lỗi
 * thật). Cờ boolean tường minh là cách rẻ nhất mà THẤY được trên diff.
 *
 * ⚠️ CẤM đặt cờ này ở `globals.css` hoặc feature-flag chung — nó có PHẠM VI hẹp (đúng một chỗ
 * gọi tới engine chưng cất từ cửa sổ thảo luận), không phải chuyển đổi toàn app. Đặt ở đây là
 * đúng luật *"khoá phạm vi phải khai được cả định danh"* (16/08 `claim-keys-va-cham`).
 */

/**
 * `true` (17/08 sau khi COLLAB-LOI ship): `lib/distill/types.ts` mở union sang 5 kind
 * (`image | text | sticky | form | asset`) và `lib/dna/distiller.ts:152` xuất
 * `distillDnaFromSources(sources)` — cửa gọi thẳng cho cửa sổ Thảo Luận. Nút "Chưng cất → Thẻ
 * DNA" nay SÁNG khi tầng mount truyền `onChungCat`. Bên trong `CuaSoThaoLuan.tsx` gọi
 * converter `taoNguonChungCat` (đổi `KetQuaThaoLuan` → `ProvenanceInput[]`) rồi trả về
 * `DesignDnaLayers` cho mount site.
 *
 * ⚠️ CỜ NÀY LÙI được: nếu LOI phát sinh regress trên `distillDnaFromSources` thì flip lại
 * `false` — cửa sổ tự về trạng thái mờ, KHÔNG cần đụng UI.
 */
export const CHUNG_CAT_SAN_SANG = true;

/**
 * Lý do đứng ngoài `CHUNG_CAT_SAN_SANG` để tách chuyện *"tại sao mờ"* khỏi chuyện *"còn mờ hay
 * không"* — hai câu hỏi khác nhau, một khi cờ flip thì lý do vẫn cần đọc được từ code (không
 * ai đi tìm lại `docs/00-CHOT.md` để biết tại sao nút này từng mờ).
 */
export const LY_DO_MO_CHUNG_CAT = {
  vi: 'Engine chưng cất tạm khoá — bật lại cờ CHUNG_CAT_SAN_SANG khi ổn định.',
  en: 'Distill engine temporarily locked — flip CHUNG_CAT_SAN_SANG back on when stable.',
} as const;
