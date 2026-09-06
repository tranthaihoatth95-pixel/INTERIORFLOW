/**
 * lib/materials/danh-tinh-vat-lieu.ts — LUẬT DUY NHẤT trả lời "vật này mang vật liệu nào".
 *
 * ⛔ VÌ SAO TÁCH RA MODULE RIÊNG, KHÔNG để trong `lib/three/vat-lieu-nhom.ts`: chặng **2D** cũng
 * phải hỏi đúng câu này (ô chọn vật liệu ghi `matId` xuống entity), mà `vat-lieu-nhom.ts` import
 * `three` TĨNH ⇒ import nó từ `components/cad/` là kéo ~170 KB `three` vào bundle của chặng 2D,
 * nơi không có một dòng 3D nào. Tách ra là điều kiện để **2D và 3D dùng CHUNG một luật** thay vì
 * mỗi bên tự cắt chuỗi rồi lệch nhau — đúng họ bệnh `soi:dong-dang` sinh ra để bắt.
 *
 * THUẦN: không `three`, không DOM, không fetch.
 */
import { isMatIdUuid, normalizeMatIdCanonical } from './matid-identity';
// Tiền tố lấy TỪ NGUỒN, không gõ lại chuỗi 'hat-giong:' lần thứ hai.
import { TIEN_TO_HAT_GIONG } from './kho-mo-dau';

/** Hình lát tối thiểu mà `matIdCuaNhom` cần — `SceneGroup`/`MaterialPick` gán thẳng được, test dựng gọn được. */
export interface NhomCoDanhTinh {
  /** UUID vật liệu ghi thẳng trên entity (`Base.matId`) — đường CHÍNH, có từ bước 4 của V8c. */
  matId?: string;
  /** FK mềm `ProductSpec.id` đã có sẵn từ trước (`Base.specId`). Với hàng hạt giống nó mang dạng
   * `hat-giong:<uuid>`; với bản ghi DB thật nó là cuid, KHÔNG suy ra matId được. */
  specId?: string;
}

/**
 * DANH TÍNH VẬT LIỆU của một nhóm, hoặc `null` khi nhóm chưa khai gì tra được.
 *
 * Thứ tự lùi — khai báo thắng suy đoán:
 *  1. `matId` — UUID ghi thẳng trên entity.
 *  2. `specId` mang tiền tố hạt giống ⇒ **gỡ 7 ký tự đầu là ra UUID**. Đây là đường sáng rẻ nhất
 *     của cả lát cắt: 7 vật liệu ship theo bản cài lên vân NGAY, không cần CSDL, không cần đăng
 *     nhập. Probe 05/09 đo được đúng chỗ này: cùng một chuỗi, bỏ tiền tố đi là `getMaterial` trả
 *     `resolvedVia:'uuid'` + ảnh + `uvScaleMm` thật.
 *  3. `null`.
 *
 * ⚠️ KHAI THẲNG GIỚI HẠN, đừng để phiên sau tưởng đã trọn: `specId` là **cuid của `ProductSpec`
 * thật** (studio tự nhập) thì hàm này trả `null` — không có cách nào suy UUID từ cuid mà không tra
 * CSDL, và hàm này cố ý THUẦN (không fetch). Nhóm đó rơi về `colorHex` như hôm nay. Đường đúng cho
 * ca ấy là `Base.matId` (bước 4), không phải nhét fetch vào đây.
 */
export function matIdCuaNhom(g: NhomCoDanhTinh): string | null {
  if (typeof g.matId === 'string' && isMatIdUuid(g.matId)) return normalizeMatIdCanonical(g.matId);
  const s = g.specId;
  if (typeof s === 'string' && s.startsWith(TIEN_TO_HAT_GIONG)) {
    const loi = s.slice(TIEN_TO_HAT_GIONG.length);
    if (isMatIdUuid(loi)) return normalizeMatIdCanonical(loi);
  }
  return null;
}
