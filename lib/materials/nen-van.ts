/**
 * lib/materials/nen-van.ts — VẼ TRƯỜNG VÂN CHO TỪNG NẤC CHI TIẾT. Thuần hình học, không DOM.
 *
 * ⭐ VÌ SAO PHẢI CÓ TỆP NÀY, chứ không nhân ô SCAN lên cho to (Hoà chốt 16/08, đã phải sửa hai
 * lần): **ba nấc chi tiết là ba CÔNG NĂNG, không phải ba cỡ.** Nấc to phải mang thứ nấc nhỏ
 * KHÔNG THỂ có. Phóng to một ô 44 px lên 168 px chỉ cho ra một ô 44 px mờ.
 *   · SCAN    — *món nào* → quả cầu + màu. **Không nói gì về khổ.**
 *   · JUDGE   — *chất* → VÂN thật, đủ lớn để phân biệt sồi ↔ óc chó. **Vẫn không nói về khổ.**
 *   · INSPECT — *khổ* → đúng `uvScaleMm`: thấy trọn một tấm + **MẠCH NỐI** sang tấm kế.
 *
 * 🔴 RANH GIỚI TRUNG THỰC — đọc kỹ trước khi ai đó "cải tiến" nó:
 * vân của IF là **procedural** (`lib/cad/material-texture.ts`), sinh bằng thuật toán để khỏi
 * dính giấy phép ảnh chụp. Nó **CHƯA hiệu chuẩn theo mm**: `paintWood` đặt tần số thớ theo
 * PIXEL của tấm sinh ra, không theo milimet của gỗ thật.
 *   ⇒ **JUDGE KHÔNG được vẽ thước mm**, dù `nacXemTruoc()` có trả `spanMm` cho nó. Vẽ thước lên
 *     một hoạ tiết chưa hiệu chuẩn là **nói dối về khổ** — thứ người nghề phát hiện trong một
 *     nhịp mắt và mất tin cả bảng. Nấc JUDGE nói về CHẤT; khổ là việc của nấc sau.
 *   ⇒ **INSPECT thì ĐƯỢC**, vì thứ nó khẳng định là *"khung soi rộng bằng này, một tấm lặp
 *     bằng kia, nên mạch rơi vào đây"* — cả ba con số đến thẳng từ `uvScaleMm`, và đó đúng là
 *     phép lát mà engine 3D sẽ dùng. Chi tiết BÊN TRONG tấm vẫn là suy diễn, và panel nói ra.
 *
 * 📄 BẢN VẼ CỦA VIỆC NÀY: `docs/delivery/SPEC-VAT-LIEU-LAT-CAT-DOC.md` §5.5 (hợp đồng ngưỡng) +
 * §6 mục V5 (thứ tự thi công). Trỏ ngược lại là CỐ Ý: bản vẽ đó hôm nay **không tệp nào trỏ
 * tới** — đúng trạng thái mồ côi đã giết `IF-ARCHITECTURE-COMPASS.md` suốt 19 ngày (một lần đổi
 * tên, không ai đi nối lại con trỏ, mọi phiên sau đọc mẩu cụt rồi tưởng đã đọc kiến trúc).
 * Mã thi công phải trỏ về bản vẽ nó thi công.
 *
 * ⛔ TRẦN CHI PHÍ `TRAN_TILE_PX`: một tấm vân là vòng lặp `size²` pixel trên luồng chính. Cho
 * phép sinh tấm theo bề rộng khung là mời một khung 1200 px sinh tấm 1200² = 1,4 triệu pixel —
 * đúng cửa vào của ca `AdPreviewGenerator` (Revit: mở thư viện vật liệu = 30 giây, 100% CPU).
 */
import type { NacXem, KetQuaNac } from './nac-xem-truoc';

/** Tấm vân nguồn không bao giờ vượt cạnh này. Xem ⛔ trên — đây là van chi phí, không phải gu. */
export const TRAN_TILE_PX = 384;
/** Sàn tấm vân: dưới mức này thớ gỗ bệt thành nhiễu, vẽ ra cũng không đọc được chất. */
export const SAN_TILE_PX = 96;

export interface NenVan {
  /** cạnh tấm vân PHẢI SINH RA (px nguồn) — nơi gọi đưa thẳng cho `materialTextureDataUrl`. */
  canhTile: number;
  /** `background-size`. */
  coNen: string;
  /** `background-repeat`. `repeat` chỉ ở INSPECT — chỗ mạch nối là THÔNG TIN, không phải lỗi. */
  lapNen: 'repeat' | 'no-repeat';
  /** nấc này có khai khổ thật không. Chỉ INSPECT true ⇒ chỉ INSPECT được vẽ thước mm. */
  khaiKho: boolean;
}

/** Kẹp trong [thấp, cao] và **bắt về bội số 4**. Hai lý do, cả hai đo được:
 *  ① cạnh chia hết cho 4 thì các lưới noise `size/2` · `size/3` của `material-texture.ts` ra số
 *    nguyên — cỡ lẻ từng cho ra **tấm đen im lặng** (đã vá tại gốc 05/09, đây là dây an toàn thứ
 *    hai, và nó nằm ở nơi CHỌN cỡ nên rẻ hơn).
 *  ② kéo hộp thoại rộng thêm vài px không sinh một cỡ tấm mới ⇒ cache `id:size` không nở ra và
 *    không có lượt vẽ lại nào — đúng tinh thần van chi phí. */
const kep = (n: number, thap: number, cao: number) =>
  Math.max(thap, Math.min(cao, Math.round(n / 4) * 4));

/**
 * Hình học nền vân cho một nấc chi tiết.
 * @param rongKhungPx bề rộng khung hiển thị, px CSS.
 * @param tyLeCaoTrenRong `uvScaleMm.h / uvScaleMm.w` — tấm ván 1200×190 KHÔNG vuông, và cái làm
 *        người nghề đọc ra "một tấm ván" chính là **mạch ngang** ở mép dài. Bỏ trống ⇒ `auto`
 *        (tấm vuông): đúng cho vật liệu chưa khai chiều cao, sai cho ván sàn.
 * @returns `null` khi nấc đó chưa đứng được (`!kq.datNguong`) hoặc thiếu số để lát — nơi gọi
 *          phải hiện `kq.lyDo`, KHÔNG được tự lát bừa một khổ mặc định.
 */
export function nenVanNac(nac: NacXem, kq: KetQuaNac, rongKhungPx: number, tyLeCaoTrenRong?: number): NenVan | null {
  if (!kq.datNguong) return null;
  const rong = Math.max(1, Math.round(rongKhungPx));

  /* SCAN + JUDGE — MỘT tấm, phủ kín khung, không lát. Không lát ⇒ không có mạch giả, và cũng
     không có lời hứa nào về khổ. Khác nhau ở cạnh tấm: SCAN rẻ, JUDGE đủ nét để soi vân. */
  if (nac === 'scan') return { canhTile: SAN_TILE_PX, coNen: 'cover', lapNen: 'no-repeat', khaiKho: false };
  if (nac === 'judge') {
    return { canhTile: kep(Math.max(rong, kq.px), SAN_TILE_PX, TRAN_TILE_PX), coNen: 'cover', lapNen: 'no-repeat', khaiKho: false };
  }

  /* INSPECT — LÁT ĐÚNG KHỔ. `repeat` = số lần tấm lặp trong khung soi; bề rộng vẽ của một tấm
     là `rong / repeat`. Đây là chỗ mạch nối hiện ra, và nó là điểm bán hàng của nấc này. */
  if (kq.repeat == null || !(kq.repeat > 0)) return null;
  const rongTileVe = rong / kq.repeat;
  const caoTileVe = tyLeCaoTrenRong && tyLeCaoTrenRong > 0 ? rongTileVe * tyLeCaoTrenRong : null;
  return {
    canhTile: kep(rongTileVe, SAN_TILE_PX, TRAN_TILE_PX),
    coNen: `${Math.round(rongTileVe)}px ${caoTileVe ? `${Math.max(1, Math.round(caoTileVe))}px` : 'auto'}`,
    lapNen: 'repeat',
    khaiKho: true,
  };
}

/** Thang bước thước quen mắt bản vẽ (1·2,5·5 ×10ⁿ), mm. */
const THANG_BUOC_MM = [1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

export interface Thuoc {
  buocMm: number;
  /** mốc tính bằng mm, luôn có 0, mốc cuối ≤ spanMm. */
  mocMm: number[];
}

/**
 * Thước mm cho nấc INSPECT. Chọn bước sao cho có **4–10 khoảng** — ít hơn thì thước không nói
 * được gì, nhiều hơn thì nhãn chồng nhau ở khung 400 px.
 * ⚠️ CHỈ gọi khi `NenVan.khaiKho === true`. Gọi ở JUDGE là vẽ thước lên hoạ tiết chưa hiệu
 * chuẩn — xem 🔴 đầu tệp.
 */
export function thuocMm(spanMm: number): Thuoc | null {
  if (!(spanMm > 0)) return null;
  const buocMm = THANG_BUOC_MM.find((b) => spanMm / b <= 10) ?? THANG_BUOC_MM[THANG_BUOC_MM.length - 1];
  const mocMm: number[] = [];
  for (let v = 0; v <= spanMm + 1e-9; v += buocMm) mocMm.push(Math.round(v * 1000) / 1000);
  return { buocMm, mocMm };
}

/** Số đọc được cho người: 1800 → "1,8 m" · 25 → "25 mm". Đơn vị luôn hiện, không bao giờ số trần. */
export function docKhoMm(mm: number): string {
  if (!(mm > 0)) return '—';
  if (mm >= 1000) return `${(Math.round(mm / 100) / 10).toString().replace('.', ',')} m`;
  return `${Math.round(mm)} mm`;
}
