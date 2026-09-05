/**
 * lib/library/idfc-noi-kho.ts — CẮM ĐIỆN cho `resolveIdfcCommerceToSpec` (05/09).
 *
 * ⓪ VÌ SAO TỆP NÀY TỒN TẠI, đo được trước khi viết: `resolveIdfcCommerceToSpec`
 * (`lib/materials/warehouse/catalog-link.ts:59`) dựng xong 04/09 — có thứ tự ưu tiên đúng, có cờ
 * `ben`, có 8 ca test — nhưng `grep` toàn `app/` + `components/` + `lib/` trả **0 nơi gọi ngoài
 * chính test của nó**. Dây có, chưa cắm điện. Tệp này là đoạn dây từ hàm đó tới cột thông số ④
 * của tấm Thư viện — nơi DUY NHẤT trong app người dùng mở một cấu kiện `.idfc` ra hỏi
 * *"món này là hàng nào, giá bao nhiêu"* trước khi kéo nó vào bản vẽ.
 *
 * ⛔ LUẬT 2.1.9.i (30/07) LÀ THỨ QUYẾT ĐỊNH THỨ TỰ, không phải sở thích: vật liệu **TRỎ TỚI** bản
 * ghi thương mại, KHÔNG chép giá vào mình. Chính docstring của `IdfcCommerce` (`lib/cad/idfc.ts`
 * :229-230, viết 04/09) nói thẳng: *"`priceVnd` chỉ là ẢNH CHỤP lúc nhập của cấu kiện rời,
 * `specId` mới là ĐƯỜNG VỀ NGUỒN"*. ⇒ nối được về kho thì **kho thắng** (giá sống); không nối
 * được mới rơi về số chép trong tệp, và lúc đó phải NÓI RA rằng đó là ảnh chụp.
 *
 * 🔴 CHỖ TRƯỚC LƯỢT NÀY LÀM NGƯỢC: `LibrarySheet.tsx` (nhánh `displayIdfc?.commerce`) lấy thẳng
 * `brand/unit/priceVnd` NHÚNG TRONG TỆP và dừng ở đó — không lần nào đi tra về kho. Hệ quả đo
 * được: kho sửa giá xong, tấm Thư viện vẫn hiện giá cũ của tệp, và người dùng không có dấu hiệu
 * nào để biết. Hai khoá bất biến `commerce.specId`/`commerce.matId` nằm im trong tệp.
 *
 * ⚠️ RANH GIỚI CỐ Ý — `component.geom3d.matId` KHÔNG được dùng làm khoá:
 *   · ruột `material`: `body.matId` là danh tính của CHÍNH vật liệu đó ⇒ khoá hợp lệ, cùng một vật.
 *   · ruột `component`: `geom3d.matId` là vật liệu cấu kiện ĐƯỢC LÀM BẰNG ⇒ vật KHÁC. Nối vào đó
 *     là hiện *giá một mét vuông gỗ sồi* làm *giá cái kệ sách*. Đó đúng là loại bịa số mà cột
 *     thông số cấm (`spec-panel.ts` đầu tệp: một con số bịa ở đây đi thẳng vào báo giá gửi khách).
 */

import type { IdfcBody, IdfcCommerce } from '../cad/idfc';
import { resolveIdfcCommerceToSpec, type SpecLinkVia } from '../materials/warehouse/catalog-link';
import type { SpecSource, TrangThaiNoiKho } from './spec-panel';

/** Hình dạng tối thiểu một dòng kho mà cột thông số cần đọc. `matId`/`sku` khai `string | null`
 * (không optional) để khớp thẳng `Pick<MaterialSpecDto, 'id'|'matId'|'sku'>` mà resolver đòi —
 * `GET /api/specs` luôn trả đủ hai trường, `null` khi chưa backfill. */
export interface DongKhoToiThieu {
  id: string;
  name: string;
  matId: string | null;
  sku: string | null;
  brand?: string | null;
  vendor?: string | null;
  unit?: string | null;
  priceVnd?: number | null;
}

export interface KetQuaNoiKho {
  /** `null` = CHƯA BIẾT (kho còn đang tải) — giao diện không hiện câu nào, không đoán bừa. */
  trangThai: TrangThaiNoiKho | null;
  /** Nguồn cho 6 dòng thông số. `undefined` = chưa có nguồn ⇒ các dòng hiện "—" kèm lý do. */
  nguon: SpecSource | undefined;
  /** Khoá đã nối được — chỉ để bộ đo/nhật ký đọc, KHÔNG hiện ra giao diện (jargon). */
  via: SpecLinkVia | null;
}

/**
 * Khoá nối lấy từ RUỘT tệp cho ruột `material`: vật liệu tự mang danh tính của chính nó
 * (`IdfcBody` nhánh `material`, trường `matId` thêm 04/09 — G6). Ghép vào `commerce` thành một
 * đầu vào duy nhất cho resolver, KHÔNG sửa hàm thuần và KHÔNG đẻ đường so khớp thứ hai.
 */
function khoaTuRuot(body: IdfcBody | undefined, commerce: IdfcCommerce | undefined): IdfcCommerce | undefined {
  const tuRuot = body?.type === 'material' && typeof body.matId === 'string' ? body.matId : undefined;
  if (!tuRuot) return commerce;
  // `commerce.matId` đã khai thì GIỮ NGUYÊN — thứ người nhập ghi thẳng vào mặt thương mại thắng
  // thứ suy ra từ ruột. Không có thì mượn danh tính của ruột.
  return { ...(commerce ?? {}), matId: commerce?.matId ?? tuRuot };
}

/** Tệp có mang được con số nào không — quyết định câu lý do ở ca "kho chưa có món này". */
function coSoTrongTep(c: IdfcCommerce | undefined): boolean {
  if (!c) return false;
  return (
    typeof c.priceVnd === 'number' ||
    Boolean((c.brand ?? '').trim()) ||
    Boolean((c.vendor ?? '').trim()) ||
    Boolean((c.unit ?? '').trim())
  );
}

function nguonTuTep(c: IdfcCommerce): SpecSource {
  return { supplier: c.brand ?? c.vendor ?? null, unit: c.unit ?? null, priceVnd: c.priceVnd ?? null };
}

/**
 * Nối một cấu kiện `.idfc` về kho và nói ra liên kết đó bền tới đâu.
 *
 * `specs === null` ⇒ kho chưa tải xong: trả `trangThai: null` (chưa biết) và VẪN đưa số của tệp
 * ra để cột không trống trơn trong lúc chờ — nhưng KHÔNG khẳng định gì về kho.
 */
export function noiIdfcVeKho<S extends DongKhoToiThieu>(
  body: IdfcBody | undefined,
  commerce: IdfcCommerce | undefined,
  specs: readonly S[] | null,
): KetQuaNoiKho {
  const khoa = khoaTuRuot(body, commerce);

  if (specs === null) {
    return { trangThai: null, nguon: commerce ? nguonTuTep(commerce) : undefined, via: null };
  }

  const hit = resolveIdfcCommerceToSpec<S>(khoa, specs);
  if (hit) {
    const s = hit.spec;
    return {
      // Kho THẮNG — giá sống, đúng luật 2.1.9.i. Tệp chỉ là ảnh chụp.
      nguon: { supplier: s.brand ?? s.vendor ?? null, unit: s.unit ?? null, priceVnd: s.priceVnd ?? null },
      trangThai: hit.ben ? { kieu: 'ben', tenHang: s.name } : { kieu: 'mong', tenHang: s.name },
      via: hit.via,
    };
  }

  // Không nối được. Hai sự thật KHÁC NHAU, không gộp:
  //  · tệp không khai gì để nối  ⇒ "chưa có thông tin" (ca của cấu kiện hạt giống — `hat-giong-3d
  //    .ts` CỐ Ý không mang `commerce`, nó trỏ về kho bằng con đường khác).
  //  · tệp có khai mà kho tìm không ra ⇒ lỗi ở phía kho/dữ liệu, và số hiện ra là ảnh chụp.
  const coKhoa =
    Boolean((khoa?.specId ?? '').trim()) || Boolean((khoa?.matId ?? '').trim()) || Boolean((khoa?.sku ?? '').trim());
  if (!coKhoa && !coSoTrongTep(commerce)) {
    return { trangThai: { kieu: 'chua-khai' }, nguon: undefined, via: null };
  }
  return {
    trangThai: { kieu: 'khong-thay', coSoTrongTep: coSoTrongTep(commerce) },
    nguon: commerce ? nguonTuTep(commerce) : undefined,
    via: null,
  };
}
