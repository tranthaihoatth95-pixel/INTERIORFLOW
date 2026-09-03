/**
 * lib/library/object-3d-models.ts — món nào trong kho CÓ MÔ HÌNH 3D XEM ĐƯỢC (Object3DWindow).
 *
 * Tách ra từ `components/library/LibrarySheet.tsx` (02/09) vì trang tổng Thư viện (`/library`,
 * `lib/library/overview.ts`) cũng cần đếm "Mô hình 3D" — giữ bảng ở hai nơi là đúng bệnh
 * "cùng một danh sách khai nhiều chỗ" mà `may-soi-dong-dang` sinh ra để bắt. THUẦN, không React.
 *
 * ⚠️ HIỆN TRẠNG (khai thật, không tô): kho `LibraryAsset` CHƯA có cờ "có model 3D xem được".
 * Nhận diện bằng TÊN món là bản tạm cho đúng MỘT proof (ghế Lincoln 327, CW 14/08). Khi có cấu
 * kiện 3D thứ hai, đường đúng là tag `has3d:` đọc từ `LibraryApiAsset` (`db-items.ts`) — hàm này
 * là nơi DUY NHẤT phải sửa lúc đó.
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
