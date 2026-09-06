/**
 * lib/three/nhan-vat-lieu.ts — MỘT luật đếm "khối nào đã có vật liệu", cho mọi nhãn nói về nó.
 *
 * ⛔ VÌ SAO TÁCH RA (V6, 06/09): khung nhìn 3D nói câu "Khối xám · chưa vật liệu" ở HAI chỗ, và
 * chỉ MỘT chỗ được sửa cho biết đếm (`Render3DModeSkeleton`, phiếu `[3D-VL-01]`). Chỗ còn lại
 * (`Viewport3D` dòng ghi chú góc dưới) vẫn là chuỗi CHẾT: gán vật liệu xong nó vẫn khẳng định
 * "chưa vật liệu". Đây không phải chuyện đẹp-xấu — nhãn nói sai điều vừa xảy ra thì người dùng
 * mất tin vào MỌI con số khác trên màn.
 *
 * Sửa bằng cách chép luật đếm sang chỗ thứ hai là đẻ khuôn thứ hai (luật 6). Một hàm, hai nơi đọc.
 */

/** Chỉ cần đúng phần `groups` — không kéo cả `ObjScene`/`Scene3DData` vào để hàm này còn dùng được
 * từ cả hai phía (bản đầy đủ và bản rút gọn cho viewer). */
export interface CanhCoVatLieu {
  groups: readonly { specId?: string }[];
}

/** Số khối ĐÃ mang danh tính vật liệu (`specId`) — đếm trên chính cảnh đang hiện, không đoán. */
export function demKhoiCoVatLieu(scene: CanhCoVatLieu | null | undefined): { co: number; tong: number } {
  const groups = scene?.groups ?? [];
  return { co: groups.filter((g) => !!g.specId).length, tong: groups.length };
}

/**
 * Câu mô tả trạng thái vật liệu của khung nhìn. `tr` là hàm song ngữ của nơi gọi (`useT`) — module
 * này không tự nạp i18n để còn thuần và test được.
 *
 * Chưa gán cái nào thì giữ NGUYÊN VĂN câu cũ (không hồi quy chữ đã quen mắt).
 */
export function nhanKhoiVatLieu(
  scene: CanhCoVatLieu | null | undefined,
  tr: (vi: string, en: string) => string,
): string {
  const { co, tong } = demKhoiCoVatLieu(scene);
  if (tong === 0) return tr('Không gian trống', 'Empty space');
  if (co === 0) return tr('Khối xám · chưa vật liệu', 'Clay blocks · no material yet');
  return tr(`Khối xám · ${co}/${tong} đã gán vật liệu`, `Clay blocks · ${co}/${tong} with material`);
}
