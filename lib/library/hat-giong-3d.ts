/**
 * lib/library/hat-giong-3d.ts — CẤU KIỆN 3D HẠT GIỐNG, dựng bằng `BuildRecipe`, KHÔNG tải model.
 *
 * ⛔ VÌ SAO KHÔNG TẢI THƯ VIỆN MODEL NGOÀI (hợp đồng `docs/delivery/G4-HOP-DONG-TAI-SAN.md` §3):
 * mỗi model tải về là một hồ sơ giấy phép phải tự kiểm (bài học GPL/libredwg), và nó là **lưới
 * chết** — sửa được bằng tay, KHÔNG sửa được bằng tham số. Đổi kệ 4 tầng thành 5 tầng phải đi
 * tìm model khác.
 *
 * ✅ DỰNG BẰNG `BuildRecipe` được ba thứ cùng lúc:
 *   · **CC0 tự dựng** — 0 rủi ro giấy phép, 0 byte tài sản nhị phân.
 *   · **sửa được bằng tham số** — đổi số tầng/khoảng cách là đổi MỘT SỐ trong ngăn xếp, hình học
 *     dựng lại; ngăn xếp KHÔNG PHÁ HUỶ nên tắt một bậc không mất tham số của bậc đó.
 *   · **2D và 3D sinh từ MỘT nguồn** — cùng `THAM_SO` cho ra cả `prims` mặt bằng lẫn ngăn xếp
 *     3D. Đúng câu định vị *"đồng bộ là KHÔNG TÁCH ra ngay từ đầu"*: hai mặt không thể lệch nhau
 *     vì chúng không phải hai bản ghi.
 *
 * VÌ SAO ĐÚNG MỘT MÓN, VÀ VÌ SAO LÀ MÓN NÀY (khai thật): lượt này làm **bộ đại diện tối thiểu**
 * để chạy trọn vòng nghề, không sản xuất hàng loạt. Chọn **kệ sách liền tường** vì ba lý do đo
 * được, không phải vì dễ:
 *   ① Nó GHÉP ĐÔI với một món 2D ĐÃ CÓ SẴN trong 54 block — `living-bookshelf` (900×350, hUp
 *      1800). Không vẽ mới một nét nào, và cặp 2D↔3D là CÙNG MỘT VẬT chứ không phải hai vật đặt
 *      cạnh nhau cho giống.
 *   ② Hình học của nó ĐÚNG LÀ một ngăn xếp: một tấm ván, lặp lên theo phương đứng. `arrayLinear`
 *      diễn tả nó **đúng bản chất**, không phải diễn tả gượng. Món nào cần nhiều mảnh khác chất
 *      (mặt bàn + chân bàn) thì cần nhiều ngăn xếp — `evalRecipe` hiện đánh giá MỘT ngăn xếp cho
 *      MỘT khối, nên dựng bàn ở đây sẽ phải bịa một tầng "mảnh" chưa ai tiêu thụ. Không bịa.
 *   ③ Nó là đồ mộc đóng (`millwork`) — đúng chỗ Revit làm dở nhất, đúng chỗ IF nói mình sâu hơn.
 *
 * THUẦN — không React/DOM/FS. Trả về dữ liệu để tầng trên `exportIdfc()`.
 */
import type { Pt } from '../cad/model';
import type { BuildRecipe, BuildRecipeStep } from '../cad/model';
import type { Prim } from '../cad/furniture';
import type { IdfcBody, IdfcCommerce, IdfcMeta } from '../cad/idfc';
import { VAT_LIEU_HAT_GIONG } from '../materials/hat-giong';

/** Tham số của kệ — MỘT nguồn cho cả mặt bằng 2D lẫn ngăn xếp 3D. */
export interface ThamSoKe {
  /** rộng theo phương ngang (mm) — khớp `living-bookshelf.w` = 900. */
  rongMm: number;
  /** sâu (mm) — khớp `living-bookshelf.h` (hình chiếu bằng) = 350. */
  sauMm: number;
  /** dày một tấm ván (mm). */
  dayVanMm: number;
  /** số tầng ván. */
  soTang: number;
  /** khoảng cách tim–tim giữa hai tầng (mm). */
  buocTangMm: number;
  /** cao độ đáy tấm dưới cùng so với sàn (mm). */
  caoDayMm: number;
}

/** Kệ sách liền tường 900×350, 5 tấm ván cách nhau 350mm, tấm dưới cách sàn 100mm
 * ⇒ đỉnh tấm trên cùng = 100 + 4×350 + 25 = **1525mm**, nằm trong khối bao `hUp` 1800 của block
 * 2D `living-bookshelf` (phần trên là khoảng hở — kệ liền tường không kịch trần). */
export const KE_SACH_LIEN_TUONG: ThamSoKe = {
  rongMm: 900,
  sauMm: 350,
  dayVanMm: 25,
  soTang: 5,
  buocTangMm: 350,
  caoDayMm: 100,
};

/** ID cấu kiện hạt giống — GÕ CỨNG, cùng luật bất biến với `matId` (`hat-giong.ts` ràng buộc 1):
 * nó đi vào `.idf` người dùng lưu qua `srcBlock`/`meta.code`, đổi là làm mồ côi bản chèn cũ. */
export const MA_KE_SACH = 'IF-3D-KE-SACH-900';
export const ID_KE_SACH = '8c6511d2-a0bf-4672-9f3e-65198a8b15eb';

/** Đa giác đáy MỘT TẤM VÁN, gốc TÂM cấu kiện — cùng hệ toạ độ `prims` (mm). */
export function daGiacVan(t: ThamSoKe = KE_SACH_LIEN_TUONG): Pt[] {
  const x = t.rongMm / 2;
  const y = t.sauMm / 2;
  return [
    { x: -x, y: -y },
    { x, y: -y },
    { x, y },
    { x: -x, y },
  ];
}

/** Hình chiếu bằng — cùng `THAM_SO`, nên 2D không thể lệch 3D. */
export function primsMatBang(t: ThamSoKe = KE_SACH_LIEN_TUONG): Prim[] {
  const p = daGiacVan(t);
  return [
    { k: 'poly', pts: p, closed: true },
    // vạch mép trước của tấm ván — ký hiệu nghề cho "đây là kệ, mặt hở phía trước".
    { k: 'line', a: { x: -t.rongMm / 2, y: t.sauMm / 2 - t.dayVanMm }, b: { x: t.rongMm / 2, y: t.sauMm / 2 - t.dayVanMm } },
  ];
}

/**
 * NGĂN XẾP LỆNH — đọc từ trên xuống là đọc được cách người thợ dựng nó:
 *   ① `extrude`     — đùn MỘT tấm ván dày `dayVanMm` từ đa giác đáy.
 *   ② `arrayLinear` — lặp tấm đó lên trên `soTang` lần, mỗi lần cao thêm `buocTangMm`.
 *
 * `id` của bậc là CỐ ĐỊNH (không sinh ngẫu nhiên): người dùng tắt/bật/kéo thứ tự theo `id`, và
 * `id` đi vào `.idf`/`.idfc` — sinh mới mỗi lần dựng là mất luôn lựa chọn tắt/bật của họ sau khi
 * mở lại. Cùng lý do với `matId` bất biến.
 */
export function congThucKe(t: ThamSoKe = KE_SACH_LIEN_TUONG): BuildRecipe {
  const steps: BuildRecipeStep[] = [
    { id: 'ke-van', op: { op: 'extrude', h: t.dayVanMm }, enabled: true, label: 'Tấm ván' },
    {
      id: 'ke-lap-tang',
      op: { op: 'arrayLinear', n: t.soTang, dx: 0, dy: 0, dz: t.buocTangMm },
      enabled: true,
      label: `Lặp ${t.soTang} tầng, bước ${t.buocTangMm}mm`,
    },
  ];
  return { steps };
}

/** Cao độ ĐỈNH tấm trên cùng (mm) — số kiểm chứng được, dùng cho nghiệm thu và cho khối bao. */
export function caoDinhMm(t: ThamSoKe = KE_SACH_LIEN_TUONG): number {
  return t.caoDayMm + (t.soTang - 1) * t.buocTangMm + t.dayVanMm;
}

export interface CauKienHatGiong {
  meta: Pick<IdfcMeta, 'id' | 'name' | 'nameEn' | 'code' | 'kind' | 'scope' | 'tags' | 'room'>;
  body: IdfcBody;
  commerce?: IdfcCommerce;
  license: string;
  source: string;
  /** món 2D CÓ SẴN trong `public/cad-library/manifest.json` mà cấu kiện này là mặt 3D của nó —
   * khai tường minh để máy đối chiếu được kích thước hai bên, không phải tin lời. */
  block2dId: string;
}

/**
 * Cấu kiện hạt giống dưới hình dạng `exportIdfc()` nhận thẳng.
 * `matId` truyền vào từ tầng hạt giống vật liệu — KHÔNG gõ lại chuỗi UUID ở đây (một sự thật một
 * chỗ; gõ lại là đẻ bản sao thứ hai để rồi lệch).
 *
 * ⛔ KHÔNG `commerce` — cấu kiện hạt giống **trỏ tới** kho giá qua `matId`, TUYỆT ĐỐI không chép
 * giá vào tài sản (luật 2.1.9.i). Giá của một tấm ván sồi là chuyện của `ProductSpec`, đổi hằng
 * ngày; hình học thì không.
 */
export function cauKienKeSach(matId: string, t: ThamSoKe = KE_SACH_LIEN_TUONG): CauKienHatGiong {
  return {
    meta: {
      id: ID_KE_SACH,
      name: 'Kệ sách liền tường 900',
      nameEn: 'Wall-mounted bookshelf 900',
      code: MA_KE_SACH,
      kind: 'millwork',
      scope: 'chung',
      tags: ['kệ', 'kệ sách', 'shelf', 'bookshelf', 'đồ mộc', 'millwork'],
      room: 'Phòng khách',
    },
    body: {
      type: 'component',
      geom2d: {
        group: 'Phòng khách',
        w: t.rongMm,
        h: t.sauMm,
        prims: primsMatBang(t),
      },
      geom3d: {
        heightMm: t.dayVanMm,
        matId,
        recipe: congThucKe(t),
      },
    },
    license: 'CC0 — tự do sử dụng/sửa/phân phối (tài sản gốc của dự án InteriorFlow)',
    source: 'tự dựng bằng BuildRecipe (extrude + arrayLinear) — không tải model ngoài, không lưới nhập khẩu',
    block2dId: 'living-bookshelf',
  };
}

/* ═══════════════ CẮM ĐIỆN — đưa cấu kiện hạt giống LÊN KỆ THƯ VIỆN ═══════════════ */

/**
 * ⚡ 04/09 — kệ "Cấu kiện (.idfc)" đọc `loadIdfcStore()` (IndexedDB, tầng STUDIO). Trên **máy
 * sạch** kho đó RỖNG ⇒ trước hàm này, cấu kiện hạt giống dựng xong nằm im trong repo, **không kệ
 * nào hiện nó**. Hàm này là mặt tiền để `LibrarySheet` xếp nó xuống DƯỚI kho studio — cùng thứ
 * tự ba tầng của vật liệu (hạt giống → studio → dự án), không đẻ luật xếp hạng thứ hai.
 *
 * ⛔ KHÔNG GHI VÀO KHO: hàm này chỉ TRẢ VỀ dữ liệu. Nhét cấu kiện hạt giống vào `idfc-store` là
 * biến mẫu-theo-bản-cài thành tài sản-của-studio — người dùng xoá được, và bản cài sau không cập
 * nhật được nữa. Một chiều: hạt giống ĐỌC, studio GHI.
 *
 * `scope: 'chung'` (không phải `'studio'`) nói đúng bản chất: **mọi studio đều có món này**.
 */
export interface CauKienHatGiongTrenKe {
  meta: IdfcMeta;
  body: IdfcBody;
  commerce?: IdfcCommerce;
  /** thời điểm vào kho — hạt giống đi theo bản cài, KHÔNG phải "vừa nhập lúc mở app". */
  storedAt: string;
}

/** Ngày cố định — cùng lý do với `NGAY_THEO_BAN_CAI` ở `lib/materials/kho-mo-dau.ts`. */
const NGAY_THEO_BAN_CAI = '1970-01-01T00:00:00.000Z';

/**
 * Mọi cấu kiện hạt giống dưới hình dạng `StoredIdfc` mà kệ Thư viện đọc thẳng.
 * `matId` truyền vào từ tầng hạt giống VẬT LIỆU — một sự thật một chỗ, không gõ lại UUID.
 */
export function cauKienHatGiongTrenKe(matId?: string): CauKienHatGiongTrenKe[] {
  /* Mặc định = vật liệu hạt giống ĐẦU TIÊN (gỗ sồi). Đọc từ bảng vật liệu chứ KHÔNG gõ lại chuỗi
     UUID — một sự thật một chỗ; gõ lại là đẻ bản sao thứ hai để rồi lệch (ràng buộc 1 của
     `lib/materials/hat-giong.ts`). */
  const mac = matId ?? VAT_LIEU_HAT_GIONG[0]?.matId ?? '';
  const c = cauKienKeSach(mac);
  return [
    {
      meta: {
        ...c.meta,
        tags: [...c.meta.tags ?? []],
        createdAt: NGAY_THEO_BAN_CAI,
        modifiedAt: NGAY_THEO_BAN_CAI,
        appVersion: 'ban-cai',
      },
      body: c.body,
      commerce: c.commerce,
      storedAt: NGAY_THEO_BAN_CAI,
    },
  ];
}
