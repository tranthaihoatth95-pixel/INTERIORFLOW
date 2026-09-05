/**
 * lib/three/vat-lieu-nhom.ts — MỘT ĐƯỜNG TRA VẬT LIỆU DÙNG CHUNG cho mọi nơi dựng mesh từ
 * `SceneGroup[]`. Ba nơi đọc cùng một sự thật vật liệu: `Scene3DViewer` (màn hình) ·
 * `lib/three/capture.ts` (ảnh/video/depth nuôi ControlNet) · `components/three/capture-live.ts`
 * (chụp khung đang xem).
 *
 * ⛔ VÌ SAO PHẢI DÙNG CHUNG chứ không dán mã vào viewer: sửa mỗi viewer thì **khung hình xuất ra
 * vẫn phẳng** — mà ảnh xuất ra mới là thứ khách nhìn. Đó đúng là chỗ probe 05/09 bỏ sót ở vòng đầu
 * (`docs/delivery/PROBE-DUONG-ONG-ANH.md`, "người đọc thứ ba").
 *
 * TỆP NÀY KHÔNG ĐẺ ĐƯỜNG VẬT LIỆU THỨ HAI: mọi vật liệu vẫn ra khỏi `buildPbrMaterial`
 * (`pbr-three.ts`) — nơi duy nhất biết colorSpace nào cho map nào và `uvScaleMm` → `repeat`.
 */
import * as THREE from 'three';
import type { MaterialPbr } from '../materials/schema';
import { isMatIdUuid, normalizeMatIdCanonical } from '../materials/matid-identity';
// Tiền tố lấy TỪ NGUỒN, không gõ lại chuỗi 'hat-giong:' lần thứ hai — gõ lại là dựng nguồn sự thật
// thứ hai cho cùng một quy ước, đúng họ bệnh `soi:dong-dang` sinh ra để bắt.
import { TIEN_TO_HAT_GIONG } from '../materials/kho-mo-dau';
import { buildPbrMaterial, loadPbrTextures, pbrCacheKey } from './pbr-three';

/** Hình lát tối thiểu mà `matIdCuaNhom` cần — `SceneGroup` gán thẳng được, test dựng gọn được. */
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

/** Nguồn PBR đã hợp nhất ba tầng (`pbrMapBaTang()`), + specs/defs nếu nơi gọi có. */
export interface NguonVatLieu3D {
  pbrMap?: Record<string, MaterialPbr>;
}

export interface VatLieuNhom {
  material: THREE.Material;
  /** đã tra ra pbr thật hay đang là màu phẳng lùi — nơi gọi cần biết để không khai vống. */
  coPbr: boolean;
}

/**
 * Vật liệu three.js cho MỘT nhóm. Bất đồng bộ vì texture phải tải xong mới gán được.
 *
 * ⚠️ TÁI DÙNG THEO `matId` + hình thức: N mặt cùng vật liệu phải dùng CHUNG một `Material`, không
 * thì mỗi mesh một chương trình shader và bộ nhớ GPU nở theo số mesh. Cache nằm ở `pbr-three.ts`
 * cho TEXTURE; cache ở đây cho MATERIAL. Khoá gồm `pbrCacheKey` nên đổi thông số vật liệu là ra
 * material mới, không dính bản cũ.
 */
const khoVatLieu = new Map<string, THREE.MeshPhysicalMaterial>();

export async function vatLieuChoNhom(
  nhom: NhomCoDanhTinh & { colorHex: string },
  nguon: NguonVatLieu3D,
  chieuMat: THREE.Side = THREE.DoubleSide,
): Promise<VatLieuNhom | null> {
  const matId = matIdCuaNhom(nhom);
  if (!matId) return null;
  const pbr = nguon.pbrMap?.[matId] ?? null;
  if (!pbr) return null;
  const khoa = `${pbrCacheKey(pbr)}|side:${chieuMat}`;
  const cu = khoVatLieu.get(khoa);
  if (cu) return { material: cu, coPbr: true };
  const tex = await loadPbrTextures(pbr);
  const m = buildPbrMaterial(pbr, tex);
  m.side = chieuMat;
  khoVatLieu.set(khoa, m);
  return { material: m, coPbr: true };
}

/**
 * ⛔ KHÔNG dispose material lấy từ `vatLieuChoNhom` — chúng DÙNG CHUNG giữa các mesh và giữa các
 * lần dựng lại cảnh. `material-preview.ts:318` đã trả giá đúng bài này một lần: dispose một vật
 * dùng chung là các mesh còn lại mất texture giữa chừng. Nơi gọi chỉ dispose GEOMETRY của mình.
 * Hàm này để test/khởi động lại xoá sạch kho khi thật sự cần.
 */
export function xoaKhoVatLieu(): void {
  for (const m of khoVatLieu.values()) m.dispose();
  khoVatLieu.clear();
}

/** Số vật liệu đang giữ trong kho — dùng để đo rò bộ nhớ (mở/đóng nhiều lượt không được tăng tuyến tính). */
export function soVatLieuTrongKho(): number {
  return khoVatLieu.size;
}
