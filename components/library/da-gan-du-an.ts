/**
 * components/library/da-gan-du-an.ts — LOGIC THUẦN trả lời đúng MỘT câu:
 * "asset này đã được gắn vào dự án ĐANG MỞ chưa?", suy từ danh sách where-used đã tải.
 *
 * Vì sao tách ra khỏi component: nút "Dùng cho dự án này" trước 20/08 chỉ biết trạng thái SAU
 * khi người dùng bấm thử (200 hoặc 409) — reload trang là nút nói sai lại. Dữ liệu để biết
 * trước đã nằm sẵn trong `GET /api/project-asset-usage?assetId=X` mà `AssetWhereUsed` vốn gọi;
 * việc còn lại chỉ là ĐỌC ĐÚNG nó. Tách thành hàm thuần để khoá bằng test, không phải để đẹp.
 *
 * ⚠️ RÀNG BUỘC NGHIỆP VỤ: "đã gắn" là theo ĐÚNG `projectId` hiện tại. Cùng một asset dùng ở
 * dự án khác thì ở đây vẫn phải là CHƯA gắn — where-used cố ý liệt kê MỌI dự án (Golden Journey:
 * asset X ở Project A → reuse ở Project B → thấy cả hai), nên lọc theo projectId là bắt buộc,
 * không được đọc `rows.length > 0`.
 */

/** Một hàng where-used như route trả về (chỉ khai phần UI này thật sự đọc). */
export interface WhereUsedRow {
  id: string;
  projectId: string;
  usage: string;
  project: { id: string; name: string };
}

/**
 * `rows` = danh sách where-used đã tải xong (chưa tải xong / lỗi thì bên gọi truyền `null` và
 * TỰ xử trạng thái chờ — hàm này cố ý không biết khái niệm "đang tải").
 * `projectId` rỗng/null (đang duyệt kho không mở dự án nào) ⇒ luôn `false`, vì lúc đó câu hỏi
 * "đã gắn vào dự án nào" không có nghĩa.
 */
export function daGanVaoDuAn(rows: WhereUsedRow[] | null, projectId: string | null | undefined): boolean {
  if (!rows || !projectId) return false;
  return rows.some((r) => r.projectId === projectId);
}
