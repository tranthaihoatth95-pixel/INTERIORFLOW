/**
 * lib/materials/tang-phan-giai.ts — THỨ TỰ PHÂN GIẢI BA TẦNG của một vật liệu.
 *
 *   ① HẠT GIỐNG — tệp trong repo, CHỈ ĐỌC. Có mặt trên máy sạch, lần chạy đầu (`hat-giong.ts`).
 *   ② STUDIO    — `localStorage` `if.materials.pbr.v1`. Người dùng chỉnh, ghi đè tầng ①.
 *   ③ DỰ ÁN     — bản chèn trong một dự án cụ thể ghi đè cục bộ, ghi đè tầng ② và ①.
 *
 * 🔴 MỘT CHIỀU — đúng ràng buộc `.idfc` chốt 07/08: **sửa ở dự án KHÔNG đổi mẫu gốc**. Tệp này
 * chỉ ĐỌC và XẾP CHỒNG; không hàm nào ở đây ghi ngược lên tầng dưới. Muốn đổi mẫu gốc thì vào
 * Thư viện, có xác nhận — đường khác, không phải đường này.
 *
 * ⚠️ **GHI ĐÈ THEO VẬT, KHÔNG THEO TRƯỜNG.** Tầng trên có bản ghi cho `matId` nào thì bản ghi đó
 * THẮNG TRỌN cho `matId` ấy — KHÔNG trộn nửa trường của tầng này với nửa trường của tầng kia.
 * Lý do: trộn theo trường thì người dùng hạ `roughness` xuống 0.1 để làm bóng, hạt giống sau này
 * đổi `baseColor`, và họ nhận về một vật liệu **chưa ai từng thấy** — một mặt lai không thuộc
 * tầng nào. Sự thật phải truy về được ĐÚNG MỘT tầng, và `tangPhanGiai` nói tầng đó là tầng nào.
 *
 * ⛔ KHÔNG ĐỤNG `pbr-store.ts`: tệp đó giữ nguyên ngữ nghĩa cũ (`normalizeMatId` upper+trim, dữ
 * liệu `localStorage` đang sống giả định đúng thế). Tầng hạt giống là thứ THÊM VÀO, xếp DƯỚI —
 * đường đọc cũ không đổi một dòng nào.
 *
 * THUẦN — mọi nguồn tiêm qua tham số (`studio`/`duAn`), không tự đọc `localStorage`. Tầng UI tự
 * `loadPbrMap()` rồi đưa vào; nhờ vậy test được bằng sucrase-node, không cần `window`.
 */
import type { MaterialPbr } from './schema';
import { pbrMapHatGiong, vatLieuHatGiong, type VatLieuHatGiong } from './hat-giong';
import { isMatIdUuid, normalizeMatIdCanonical } from './matid-identity';
import { normalizeMatId } from './pbr-store';

export type TangVatLieu = 'hat-giong' | 'studio' | 'du-an';

export interface NguonBaTang {
  /** kho STUDIO đã nạp — thường là `loadPbrMap()`. Khoá có thể là UUID canonical (đường mới) hoặc
   * sku upper (đường legacy) — hàm dưới thử CẢ HAI, đúng cửa sổ tương thích đang mở. */
  studio?: Record<string, MaterialPbr>;
  /** ghi đè cục bộ của MỘT dự án đang mở. Khoá = matId. */
  duAn?: Record<string, MaterialPbr>;
}

export interface KetQuaPhanGiai {
  /** matId đã chuẩn hoá ĐÚNG namespace của nó (UUID ⇒ lowercase; còn lại ⇒ sku upper). */
  matId: string;
  /** `null` khi KHÔNG tầng nào có — không bịa mặc định, không rơi về `DEFAULT_PBR` (N4). */
  pbr: MaterialPbr | null;
  /** tầng thắng. `null` khi `pbr` là `null`. Đây là câu trả lời cho "số này ở đâu ra". */
  tang: TangVatLieu | null;
  /** bản ghi hạt giống (nếu mã này là vật liệu ship theo sản phẩm) — mang tên/giấy phép/nguồn,
   * kể cả khi tầng trên đã ghi đè PBR. Danh tính không mất khi người dùng chỉnh số. */
  hatGiong: VatLieuHatGiong | null;
}

/** Chuẩn hoá đúng namespace — UUID đi đường canonical, chuỗi khác đi đường sku legacy. Cùng phép
 * mà `resolve.ts` đang dùng, KHÔNG chế phép thứ hai. */
function chuanHoa(input: string): string {
  return isMatIdUuid(input) ? normalizeMatIdCanonical(input) : normalizeMatId(input);
}

/**
 * Tra một kho theo MỌI cách chuẩn hoá đang cùng sống — kho studio của người dùng có thể còn khoá
 * sku cũ, VÀ (ca đắt hơn, bắt được lúc cắm điện 04/09) còn có thể mang khoá **UUID VIẾT HOA**:
 * `savePbr()` ghi qua `normalizeMatId` (upper+trim) nên người dùng chỉnh một vật liệu hạt giống —
 * `matId` của nó là UUID lowercase — thì bản chỉnh nằm dưới khoá UPPERCASE. Chỉ tra lowercase thì
 * **bản chỉnh của chính họ trở nên vô hình**, và họ thấy app "không lưu". Đây là cửa sổ tương
 * thích, không phải hành vi vĩnh viễn: `pbr-store.ts` GIỮ NGUYÊN (dữ liệu localStorage đang sống
 * giả định đúng ngữ nghĩa đó), nên đường ĐỌC phải biết cả hai.
 */
function traKho(kho: Record<string, MaterialPbr> | undefined, input: string, khoa: string): MaterialPbr | null {
  if (!kho) return null;
  return kho[khoa] ?? kho[input] ?? kho[normalizeMatId(input)] ?? null;
}

/**
 * Đưa kho STUDIO về CÙNG MỘT NAMESPACE khoá với tầng hạt giống trước khi xếp chồng.
 * Khoá là UUID (bất kể hoa/thường) ⇒ hạ về canonical lowercase; khoá khác (sku legacy) giữ
 * nguyên. Không bước này thì `{...hatGiong, ...studio}` để bản gốc lowercase và bản chỉnh
 * UPPERCASE **nằm cạnh nhau như hai vật khác nhau** — hợp nhất xong người dùng vẫn đọc ra bản gốc.
 */
function dongNamespace(kho: Record<string, MaterialPbr> | undefined): Record<string, MaterialPbr> {
  if (!kho) return {};
  const out: Record<string, MaterialPbr> = {};
  for (const [k, v] of Object.entries(kho)) out[isMatIdUuid(k) ? normalizeMatIdCanonical(k) : k] = v;
  return out;
}

/**
 * Đọc PBR của một vật liệu theo đúng thứ tự ba tầng. Trả cả TẦNG THẮNG — thiếu nó thì UI không
 * nói được "đây là bản gốc theo sản phẩm" hay "đây là bản bạn đã chỉnh", mà đó chính là thứ người
 * dùng cần biết trước khi bấm hoàn nguyên.
 */
export function phanGiaiPbr(input: string, nguon: NguonBaTang = {}): KetQuaPhanGiai {
  if (typeof input !== 'string' || !input.trim()) {
    return { matId: '', pbr: null, tang: null, hatGiong: null };
  }
  const khoa = chuanHoa(input);
  const hatGiong = vatLieuHatGiong(input);

  const duAn = traKho(nguon.duAn, input, khoa);
  if (duAn) return { matId: khoa, pbr: duAn, tang: 'du-an', hatGiong };

  const studio = traKho(nguon.studio, input, khoa);
  if (studio) return { matId: khoa, pbr: studio, tang: 'studio', hatGiong };

  if (hatGiong) return { matId: khoa, pbr: { ...hatGiong.pbr }, tang: 'hat-giong', hatGiong };

  return { matId: khoa, pbr: null, tang: null, hatGiong: null };
}

/**
 * Kho PBR HỢP NHẤT ba tầng, dưới đúng hình dạng `Record<matId, MaterialPbr>` mà
 * `resolve.ts::getMaterial` nhận qua `sources.pbrMap`. Đây là đoạn dây để **máy sạch lần chạy đầu
 * vẫn tra ra vật liệu**: trước tệp này, `getMaterial(matId, { pbrMap: loadPbrMap() })` trên máy
 * sạch trả `pbr: null` cho MỌI mã — kho rỗng, không có gì phía dưới đỡ.
 *
 * Thứ tự hợp nhất = thứ tự ghi đè: hạt giống trước, studio đè lên, dự án đè cuối.
 */
export function pbrMapBaTang(nguon: NguonBaTang = {}): Record<string, MaterialPbr> {
  return { ...pbrMapHatGiong(), ...dongNamespace(nguon.studio), ...dongNamespace(nguon.duAn) };
}
