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
import { pbrMapBaTang } from '../materials/tang-phan-giai';
import { loadPbrMap } from '../materials/pbr-store';
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

/** Nguồn PBR đã hợp nhất ba tầng (`pbrMapBaTang()` — hạt giống < studio < dự án). */
export interface NguonVatLieu3D {
  pbrMap?: Record<string, MaterialPbr>;
}

/**
 * Nguồn mặc định: hạt giống (đi theo bản cài) + studio (`localStorage`). Đây là đoạn khiến **máy
 * sạch, tài khoản mới, chưa có CSDL** vẫn thấy 7 vật liệu có vân — không cần đăng nhập, không cần
 * `/api/specs`. Bọc try/catch vì `loadPbrMap()` đụng `localStorage`: gọi từ SSR/test là ném.
 */
export function nguonVatLieuMacDinh(): NguonVatLieu3D {
  let studio: Record<string, MaterialPbr> | undefined;
  try {
    studio = loadPbrMap();
  } catch {
    studio = undefined;
  }
  return { pbrMap: pbrMapBaTang(studio ? { studio } : {}) };
}

/**
 * HÌNH THỨC TÔ — hai kiểu, cùng MỘT nguồn sự thật vật liệu:
 *  · `'co-den'`  — `MeshPhysicalMaterial` do `buildPbrMaterial` dựng. Dùng khi cảnh CÓ đèn
 *    (`lightingPreview`). Không đèn mà dùng kiểu này thì cả cảnh ĐEN SÌ.
 *  · `'khong-den'` — `MeshBasicMaterial` không cần đèn, đúng nhánh xám-trơn của `SPEC-3D-CORE §6`
 *    và đúng thứ `capture.ts`/`capture-live.ts` đang dùng.
 *
 * ⚠️ `'khong-den'` KHÔNG PHẢI ĐƯỜNG VẬT LIỆU THỨ HAI, và ranh giới này quan trọng: nó **không tự
 * quyết định gì về vật liệu**. Ảnh nào, colorSpace nào, `repeat` bao nhiêu theo `uvScaleMm` — tất
 * cả vẫn do `buildPbrMaterial` quyết; ở đây chỉ lấy lại `map`/`color` nó đã tính rồi đổi MÔ HÌNH
 * TÔ BÓNG. Tự tải texture riêng, tự đặt repeat riêng cho nhánh này mới là đẻ đường thứ hai.
 */
export type HinhThucTo = 'co-den' | 'khong-den';

export interface VatLieuNhom {
  material: THREE.Material;
  /** đã tra ra pbr thật hay chưa — nơi gọi cần biết để không khai vống là "đã có vân". */
  coPbr: boolean;
}

/**
 * ⚠️ TÁI DÙNG THEO VẬT LIỆU: N mặt cùng `matId` phải dùng CHUNG một `Material`, không thì mỗi mesh
 * một chương trình shader và bộ nhớ GPU nở theo số mesh. Cache TEXTURE ở `pbr-three.ts`; cache
 * MATERIAL ở đây. Khoá gồm `pbrCacheKey` nên sửa thông số vật liệu là ra material mới, không dính
 * bản cũ.
 */
const khoVatLieu = new Map<string, THREE.Material>();

function khoaVatLieu(pbr: MaterialPbr, hinhThuc: HinhThucTo, chieuMat: THREE.Side): string {
  return `${pbrCacheKey(pbr)}|${hinhThuc}|side:${chieuMat}`;
}

function dungVatLieu(pbr: MaterialPbr, tex: Awaited<ReturnType<typeof loadPbrTextures>>, hinhThuc: HinhThucTo, chieuMat: THREE.Side): THREE.Material {
  const goc = buildPbrMaterial(pbr, tex); // NGUỒN SỰ THẬT DUY NHẤT cho map/colorSpace/repeat
  goc.side = chieuMat;
  if (hinhThuc === 'co-den') return goc;
  const phang = new THREE.MeshBasicMaterial({ side: chieuMat, color: goc.color.clone() });
  if (goc.map) phang.map = goc.map;
  goc.dispose(); // material trung gian, CHƯA vào cache và CHƯA mesh nào dùng — texture bên trong
  // do cache của `pbr-three.ts` giữ, `Material.dispose()` không đụng tới texture.
  return phang;
}

/** Vật liệu cho MỘT nhóm — bất đồng bộ vì texture phải tải xong mới gán được. `null` = nhóm chưa
 * tra ra vật liệu nào ⇒ nơi gọi giữ nguyên `colorHex` như trước. */
export async function vatLieuChoNhom(
  nhom: NhomCoDanhTinh,
  nguon: NguonVatLieu3D,
  hinhThuc: HinhThucTo,
  chieuMat: THREE.Side = THREE.DoubleSide,
): Promise<VatLieuNhom | null> {
  const matId = matIdCuaNhom(nhom);
  if (!matId) return null;
  const pbr = nguon.pbrMap?.[matId] ?? null;
  if (!pbr) return null;
  const khoa = khoaVatLieu(pbr, hinhThuc, chieuMat);
  const cu = khoVatLieu.get(khoa);
  if (cu) return { material: cu, coPbr: true };
  const tex = await loadPbrTextures(pbr);
  // Lượt chạy song song khác có thể đã dựng xong trong lúc chờ `await` — dùng bản đã có, đừng đè.
  const daCo = khoVatLieu.get(khoa);
  if (daCo) return { material: daCo, coPbr: true };
  const m = dungVatLieu(pbr, tex, hinhThuc, chieuMat);
  khoVatLieu.set(khoa, m);
  return { material: m, coPbr: true };
}

/**
 * ĐỌC ĐỒNG BỘ từ kho — chỉ trả về khi vật liệu ĐÃ được `chuanBiVatLieu` nạp xong.
 *
 * ⛔ TỒN TẠI VÌ `capture.ts` DỰNG CẢNH ĐỒNG BỘ. `captureFrame`/`captureSequence` không `await` được
 * ở giữa chừng, mà chúng lại là đường ra ẢNH/VIDEO — thứ khách nhìn. Không có cặp
 * chuẩn-bị-rồi-đọc-đồng-bộ này thì khung xuất ra vẫn phẳng dù màn hình đã có vân.
 */
export function vatLieuChoNhomDongBo(
  nhom: NhomCoDanhTinh,
  nguon: NguonVatLieu3D,
  hinhThuc: HinhThucTo,
  chieuMat: THREE.Side = THREE.DoubleSide,
): THREE.Material | null {
  const matId = matIdCuaNhom(nhom);
  if (!matId) return null;
  const pbr = nguon.pbrMap?.[matId] ?? null;
  if (!pbr) return null;
  return khoVatLieu.get(khoaVatLieu(pbr, hinhThuc, chieuMat)) ?? null;
}

/**
 * Nạp trước vật liệu cho CẢ danh sách nhóm. Trả về số vật liệu KHÁC NHAU đã sẵn sàng — nơi gọi
 * dùng con số này để khai thật trong log/nghiệm thu thay vì đoán.
 * Gọi hàm này rồi mới dựng cảnh đồng bộ (xem `vatLieuChoNhomDongBo`).
 */
export async function chuanBiVatLieu(
  nhoms: readonly NhomCoDanhTinh[],
  nguon: NguonVatLieu3D,
  hinhThuc: HinhThucTo,
  chieuMat: THREE.Side = THREE.DoubleSide,
): Promise<number> {
  const daXet = new Set<string>();
  const canNap: NhomCoDanhTinh[] = [];
  for (const g of nhoms) {
    const id = matIdCuaNhom(g);
    if (!id || daXet.has(id)) continue;
    daXet.add(id);
    canNap.push(g);
  }
  const ket = await Promise.all(canNap.map((g) => vatLieuChoNhom(g, nguon, hinhThuc, chieuMat)));
  return ket.filter((x) => x?.coPbr).length;
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
