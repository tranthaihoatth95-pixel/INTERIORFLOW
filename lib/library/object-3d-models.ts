/**
 * lib/library/object-3d-models.ts — món nào trong kho CÓ MÔ HÌNH 3D XEM ĐƯỢC (Object3DWindow).
 *
 * Tách ra từ `components/library/LibrarySheet.tsx` (02/09) vì trang tổng Thư viện (`/library`,
 * `lib/library/overview.ts`) cũng cần đếm "Mô hình 3D" — giữ bảng ở hai nơi là đúng bệnh
 * "cùng một danh sách khai nhiều chỗ" mà `may-soi-dong-dang` sinh ra để bắt. THUẦN, không React.
 *
 * 🔄 05/09 — ĐÃ ĐI ĐÚNG ĐƯỜNG FILE NÀY TỰ VẠCH RA. Bản cũ khai thật: *"kho `LibraryAsset` CHƯA có
 * cờ 'có model 3D xem được'; nhận diện bằng TÊN món là bản tạm cho đúng MỘT proof (ghế Lincoln
 * 327). Khi có cấu kiện 3D thứ hai, đường đúng là tag đọc từ `LibraryApiAsset`."* Cửa nhận diện
 * cấu kiện (`POST /api/idfc-import`) nay sinh ra cấu kiện thứ hai, thứ ba… nên tag đó thành thật:
 * asset mang `mo3d:<id biểu diễn>`, `assetToSheetItem` bóc ra `SheetItem.model3d`.
 *
 * ⇒ `object3dModelForItem()` là cửa đọc DUY NHẤT: **dữ liệu trước, tên sau**. Bảng tên giữ lại
 * đúng một dòng cho proof Lincoln — nó là tệp tĩnh trong `public/`, không có hàng DB nào đứng sau,
 * xoá đi là mất một món đang xem được. Món mới KHÔNG bao giờ đi qua bảng tên nữa.
 */

export interface Object3DModelRef {
  glbUrl: string;
  mtlUrl?: string;
}

/** Hình học CHUẨN-NÉT (`chuanNet`, `.obj`+`.mtl`) ưu tiên hơn GLB Trellis thô — biên phiếu
 * `docs/phieu-giao/ghe-3d-window-app.md` ("có bản chuẩn-nét thì dùng bản đó"). */
const OBJECT_3D_MODELS: { match: RegExp; model: Object3DModelRef }[] = [
  {
    match: /lincoln 327/i,
    model: {
      glbUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.obj',
      mtlUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.mtl',
    },
  },
];

/** Mô hình 3D của một món theo TÊN — `null` khi món không có mô hình xem được. */
export function object3dModelForName(name: string): Object3DModelRef | null {
  const hit = OBJECT_3D_MODELS.find((m) => m.match.test(name));
  return hit ? { ...hit.model } : null;
}

/**
 * Cửa đọc DUY NHẤT cho tấm Thư viện + trang tổng. Thứ tự CÓ CHỦ ĐÍCH:
 * ① `item.model3d` — con trỏ THẬT do cửa nhận diện ghi vào kho ② bảng tên (chỉ còn proof Lincoln).
 * Đặt dữ liệu trước nghĩa là một món có hàng DB sẽ KHÔNG bị một dòng regex cũ cướp mất.
 */
export function object3dModelForItem(item: { name: string; model3d?: Object3DModelRef }): Object3DModelRef | null {
  if (item.model3d) return { ...item.model3d };
  return object3dModelForName(item.name);
}
