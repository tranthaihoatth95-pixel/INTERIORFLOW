/**
 * lib/materials/xem-truoc-o.ts — DỌN SẴN ĐẦU VÀO CHO MỘT Ô XEM TRƯỚC, thuần dữ liệu.
 *
 * ⛔ VÌ SAO CÓ TỆP NÀY: đo 05/09, ô mẫu ở Kho vật liệu là `imageUrlOf(m)` — tức nó đi tìm một
 * **ẢNH ĐÃ TẢI LÊN**, mà vật liệu của IF **ship THAM SỐ, không ship ẢNH** (ràng buộc 3 của
 * `hat-giong.ts`: 0 byte, 0 rủi ro giấy phép). Không ảnh ⇒ `url` rỗng ⇒ ô rơi về **biểu tượng
 * ảnh-hỏng 14 px**, trông như lỗi trong khi dữ liệu hoàn toàn lành lặn.
 * ⇒ Ô xem trước phải được **VẼ RA**, không phải được **TẢI VỀ**. Tệp này gom đúng những thứ cần
 * để vẽ, từ ba mặt đã đọc — KHÔNG đọc thêm nguồn nào, KHÔNG đoán thêm gì.
 *
 * 🔴 KHÔNG ĐOÁN HỌ BỀ MẶT TỪ TÊN MÓN. `Command3DPanel` đang suy `kind` từ TÊN (`kindFromName`)
 * trong khi `MaterialPbr.typeId` đã khai sẵn — đoán trong khi đã biết. Ở đây chỉ đọc `typeId`
 * qua bảng `MATERIAL_TYPES` có sẵn; không có `typeId` thì trả `null` để nơi gọi hiện **màu
 * phẳng thật**, chứ không dựng một quả cầu gỗ cho thứ chưa ai nói là gỗ.
 *
 * THUẦN — không DOM, không WebGL. Nơi gọi tự dịch sang `PreviewSpec` của `material-preview.ts`
 * (giữ `lib/materials/` không phụ thuộc ngược lên `components/`).
 */
import type { MaterialDef } from '../cad/materials';
import type { MaterialFacets } from './resolve';
import { materialTypeOf, type MaterialPreviewKind } from './material-edit';
import { pbrCacheKey } from '../three/pbr-three';
import type { MaterialPbr } from './schema';

export interface XemTruocO {
  /** khoá cache của máy render. **Phải** trộn dấu vân tay PBR: sửa một thông số render của MỘT
   * vật liệu thì chỉ ô của mã đó vẽ lại, ô của mã khác đứng yên (spec §5.4 P6). */
  id: string;
  /** họ bề mặt — quyết định CẢNH của quả cầu. `null` = chưa khai, nơi gọi hiện màu phẳng. */
  ho: MaterialPreviewKind | null;
  /** hai màu dựng nền chờ / gradient hai tông. Luôn có, luôn thật. */
  mauA: string;
  mauB: string;
  pbr: MaterialPbr | null;
  /** preset 2D — nguồn của **vân procedural** làm nền chờ (0 byte, đồng bộ, không WebGL). */
  def: MaterialDef | null;
  /** ẢNH VÂN THẬT (`MaterialPbr.baseColorMapUrl`) nếu mã này có. Có nó thì nó THẮNG vân
   * procedural ở mọi nấc — cùng MỘT sự thật vật liệu nuôi cả ba nấc, không hai đường vẽ. */
  anhVan: string | null;
}

/** Màu cuối cùng khi mọi mặt đều trống. Xám trung tính — nói "chưa biết", không giả vờ là vật
 * liệu nào cả. */
const XAM_CHUA_BIET = '#8a8a8a';

export function xemTruocO(khoaHang: string, f: MaterialFacets, colorHex?: string | null): XemTruocO {
  const pbr = f.pbr ?? null;
  const def = f.flat ?? null;
  /* 🔴 CÓ ẢNH VÂN ⇒ **KHÔNG lấy `baseColor` làm màu phẳng**. Theo glTF, khi có
     `baseColorTexture` thì `baseColorFactor` là HỆ SỐ NHÂN, và ảnh vân đủ màu phải đi với hệ số
     TRẮNG (`buildPbrMaterial` đã thi hành đúng luật đó). Trắng là màu của PHÉP NHÂN, không phải
     màu của vật liệu — lấy nó vẽ ô là ra một ô trắng cho tấm gỗ óc chó. Màu thật của vật liệu
     lúc này nằm ở mặt 2D (`def.color`), nơi nó vẫn có nghĩa là màu. */
  const coAnhVan = !!pbr?.baseColorMapUrl;
  const goc = (coAnhVan ? def?.color : pbr?.baseColor) ?? def?.color ?? colorHex ?? XAM_CHUA_BIET;
  const tones = def?.tones ?? [];
  return {
    id: pbr ? `${khoaHang}|${pbrCacheKey(pbr)}` : khoaHang,
    ho: materialTypeOf(pbr?.typeId)?.previewKind ?? null,
    mauA: tones[0] ?? goc,
    mauB: tones[tones.length - 1] ?? goc,
    pbr,
    def,
    anhVan: pbr?.baseColorMapUrl ?? null,
  };
}
