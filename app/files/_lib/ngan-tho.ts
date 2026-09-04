/**
 * app/files/_lib/ngan-tho.ts — [marker: filesHaiNgan] LÕI THUẦN của ngăn ② *Phần thô dùng chung*.
 *
 * Hoà chốt 17/08 (`docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` §3): Files có **HAI NGĂN KHÁC BẢN CHẤT**
 *   ① *Dự án* — tệp của dự án đang mở, người trong dự án thấy.
 *   ② *Phần thô dùng chung* — map texture · nhà cung cấp · **range giá**; nguyên liệu nhiều người
 *      góp, **chưa đủ định nghĩa để render**; ai cũng thấy.
 *
 * ⭐ ĐỊNH NGHĨA "THÔ" KHÔNG PHẢI MỘT CỜ MỚI — nó ĐỌC RA TỪ CỖ MÁY ĐÃ CÓ.
 * `lib/materials/ba-mat.ts` (17/08) đã biết nói mặt `dung3d` của một mã là `du` / `chuaDu` /
 * `chuaCo`. *Thô* = **mặt dựng-3D chưa `du`** — tức đúng nghĩa "chưa đủ định nghĩa để render".
 * Món nào đủ thì nó **rời ngăn thô**, đi tiếp dòng chảy `Files → cửa sổ công cụ → Thư viện`
 * (`docs/IF-KIEN-TRUC.md` §5). Không thêm trường DB, không thêm cờ, không đẻ khái niệm thứ hai —
 * đây là một MẶT TIỀN mới của `ba-mat`, đúng luật *một cỗ máy nhiều mặt tiền* (`CLAUDE.md`).
 *
 * ⛔ **RANGE GIÁ THUỘC KHO CHUNG — GIÁ CHỐT THUỘC DỰ ÁN. Module này KHÔNG BAO GIỜ chạm nửa kia.**
 * Mọi con số ở đây tính TỪ `MaterialSpecDto` (kho chung) và chỉ từ đó; không import, không đọc
 * `boq-overrides` hay bất kỳ giá chốt nào của một dự án. Khoảng giá trả về mang sẵn nhãn nói rõ
 * nó là *khoảng trong kho chung*, để không chỗ nào lỡ bày nó ra như giá đã chốt.
 *
 * ⚠️ KHAI THẲNG MỘT GIỚI HẠN: schema **không có** cột min/max giá (`MaterialSpecDto.priceVnd` là
 * MỘT số, `dto.ts:29`). Nên "range" ở đây là **khoảng đo được giữa các món cùng nhóm trong kho**,
 * không phải khoảng nhà cung cấp báo. Nhóm có 0 món ghi giá ⇒ trả `null`, **cấm bịa khoảng**.
 *
 * Thuần — không React, không DOM, không fetch. Chuỗi trả về là cặp {vi,en}, nơi gọi tự dịch.
 *
 * ⚠️ Import RELATIVE, không dùng alias `@/` — bộ chạy test của repo là `sucrase-node` (xem
 * `package.json` script `test`), nó KHÔNG đọc `paths` của tsconfig. Mọi module có test phải theo
 * quy ước này; `@/` chỉ an toàn ở file KHÔNG có test đứng sau (vd `components/home/widgets/nav.ts`).
 */
import { getMaterial, type CommercialFacet, type MaterialSources } from '../../../lib/materials/resolve';
import { baMatCuaVatLieu, dinhDangVnd, type BaMatText, type MatMotMat } from '../../../lib/materials/ba-mat';
import { khoaBaMat } from '../../../lib/materials/kho-mo-dau';

/** Hai ngăn của Files. Khác BẢN CHẤT ⇒ khác khoá, không phải hai giá trị của một bộ lọc. */
export type NganKey = 'duAn' | 'thoChung';

/** Phần `MaterialSpecDto` mà ngăn thô cần — shape con, để test dựng object gọn (structural typing). */
export interface MonKhoChung extends CommercialFacet {
  id: string;
  kind: string;
  /** ảnh vân đã có trong kho chung — `imageAssetId` của `MaterialSpecDto`. */
  imageAssetId?: string | null;
  priceNote?: string | null;
}

export interface KhoangGia {
  /** đồng, nhỏ nhất trong nhóm — LUÔN là số có thật của một món, không nội suy. */
  thap: number;
  cao: number;
  /** số món trong nhóm CÓ ghi giá (mẫu số của khoảng này). */
  soMonCoGia: number;
  /** chuỗi đọc được, đã mang sẵn chữ *kho chung* — cấm hiện số trần không nói nguồn. */
  chu: BaMatText;
}

export interface MonTho {
  matId: string;
  ten: string;
  /** nhóm (`ProductSpec.kind`) — trục gom khoảng giá. */
  nhom: string;
  /** nhà cung cấp / hãng — một trong ba thứ Hoà kể tên của phần thô. */
  nhaCungCap: string | null;
  /** đã có ảnh vân trong kho chung chưa (thứ hai Hoà kể tên). */
  coAnhVan: boolean;
  /** mặt dựng-3D đọc từ `ba-mat` — nguồn của *thiếu gì* và *làm sao có*. */
  matDung3d: MatMotMat;
  /** khoảng giá của NHÓM trong kho chung; null = nhóm chưa món nào ghi giá. */
  khoangGia: KhoangGia | null;
}

/** Nhãn hai ngăn — đặt ở lõi để mock, giao diện và test dùng CÙNG một chuỗi, không chép tay. */
export const NGAN_LABEL: Record<NganKey, { ten: BaMatText; aiThay: BaMatText }> = {
  duAn: {
    ten: { vi: 'Tệp dự án', en: 'Project files' },
    aiThay: { vi: 'người trong dự án này thấy', en: 'visible to this project’s members' },
  },
  thoChung: {
    ten: { vi: 'Phần thô dùng chung', en: 'Shared raw stock' },
    aiThay: { vi: 'ai cũng thấy · nhiều người góp', en: 'visible to everyone · many contributors' },
  },
};

/**
 * Câu MỘT DÒNG nói ngăn này là gì. Đây là thứ làm hai ngăn *khác bản chất* đọc được **cả khi bỏ
 * hết màu** — chữ mang nghĩa, không phải sắc độ mang nghĩa (luật *màu không là kênh duy nhất*).
 */
export const NGAN_MOTA: Record<NganKey, BaMatText> = {
  duAn: {
    vi: 'Bản vẽ, ảnh, tài liệu thuộc dự án đang mở.',
    en: 'Drawings, images and documents belonging to the open project.',
  },
  thoChung: {
    vi: 'Nguyên liệu chưa đủ định nghĩa để render — thêm thông số rồi mới lên Thư viện.',
    en: 'Raw stock not yet defined enough to render — add parameters, then it moves to the Library.',
  },
};

function chuKhoangGia(thap: number, cao: number, donVi: string | null): BaMatText {
  const dv = donVi ? `/${donVi}` : '';
  const so = thap === cao ? `${dinhDangVnd(thap)} ₫${dv}` : `${dinhDangVnd(thap)}–${dinhDangVnd(cao)} ₫${dv}`;
  return {
    vi: `${so} · khoảng trong kho chung`,
    en: `${so} · range across the shared catalogue`,
  };
}

/**
 * Khoảng giá của MỘT nhóm, tính từ kho chung. `null` khi nhóm không món nào ghi giá — nói thẳng
 * "chưa nhóm nào ghi giá" ở giao diện, hơn là hiện `0–0 ₫`.
 */
export function khoangGiaCuaNhom(mon: readonly MonKhoChung[], nhom: string): KhoangGia | null {
  const gia: number[] = [];
  let donVi: string | null = null;
  for (const m of mon) {
    if (m.kind !== nhom) continue;
    const g = typeof m.priceVnd === 'number' ? m.priceVnd : null;
    if (g === null || !Number.isFinite(g)) continue;
    gia.push(g);
    if (donVi === null && m.unit) donVi = m.unit;
  }
  if (gia.length === 0) return null;
  const thap = Math.min(...gia);
  const cao = Math.max(...gia);
  return { thap, cao, soMonCoGia: gia.length, chu: chuKhoangGia(thap, cao, donVi) };
}

/**
 * Đọc kho chung ra danh sách món THÔ.
 *
 * Món vào ngăn thô khi mặt `dung3d` **chưa `du`** — gồm cả `chuaCo` (chưa có thông số nào) lẫn
 * `chuaDu` (có ảnh vân mà quên bước lặp vân ⇒ viên gạch 600mm render thành 3m). Ca `chuaDu` mới là
 * ca đắt: nó TRÔNG như đã xong nên không ai đi sửa — đúng thứ ngăn này sinh ra để bày mặt.
 *
 * Món **chưa có mã** thì bỏ qua: không mã thì không khoá nối, `ba-mat` cũng không tra được mặt nào
 * (`baMatChuaCoMa`). Nói chuyện đó ở màn Kho vật liệu, không phải việc của ngăn này.
 */
export function locMonTho(mon: readonly MonKhoChung[], nguon: MaterialSources = {}): MonTho[] {
  const ra: MonTho[] = [];
  const nhoDaTinh = new Map<string, KhoangGia | null>();
  for (const m of mon) {
    /* KHOÁ TRA PHẢI QUA `khoaBaMat`, KHÔNG phải `m.sku` — đo được 04/09, ca hỏng thật:
       dòng hạt giống mang `sku` là mã nghề (`IF-MAT-GO-SOI`) còn kho PBR của nó khoá theo
       **UUID**; tra bằng sku thì KHÔNG BAO GIỜ khớp ⇒ hai vật liệu ship sẵn, vốn ĐÃ ĐỦ định
       nghĩa, bị bày ra ngăn thô như hàng chưa có thông số. Cùng họ lệch-namespace đã vá ở
       `tang-phan-giai.ts`; `khoaBaMat` là nơi DUY NHẤT biết chọn khoá cho từng loại dòng. */
    const khoa = khoaBaMat(m);
    if (!khoa) continue;
    const facets = getMaterial(khoa, { ...nguon, specs: nguon.specs ?? mon });
    const ba = baMatCuaVatLieu(facets);
    const dung3d = ba.mats.find((x) => x.khoa === 'dung3d');
    if (!dung3d || dung3d.trangThai === 'du') continue;
    if (!nhoDaTinh.has(m.kind)) nhoDaTinh.set(m.kind, khoangGiaCuaNhom(mon, m.kind));
    ra.push({
      matId: facets.matId,
      ten: m.name,
      nhom: m.kind,
      nhaCungCap: m.vendor ?? m.brand ?? null,
      coAnhVan: !!m.imageAssetId || !!facets.pbr?.baseColorMapUrl,
      matDung3d: dung3d,
      khoangGia: nhoDaTinh.get(m.kind) ?? null,
    });
  }
  return ra;
}

/**
 * Dòng tổng của ngăn thô. Rỗng KHÔNG phải lỗi — nó là tin tốt ("mọi món đều đã đủ để render"),
 * nên câu chữ phải khác hẳn câu lỗi, đừng dùng chung một khuôn "không có gì".
 */
export function tomTatNganTho(mon: readonly MonTho[], tongKho: number): BaMatText {
  if (tongKho === 0) {
    return {
      vi: 'Kho chung chưa có món nào — thả tệp vào đây để bắt đầu.',
      en: 'The shared catalogue is empty — drop files here to start.',
    };
  }
  if (mon.length === 0) {
    return {
      vi: `Cả ${tongKho} món trong kho chung đều đã đủ định nghĩa để render.`,
      en: `All ${tongKho} items in the shared catalogue are defined enough to render.`,
    };
  }
  return {
    vi: `${mon.length}/${tongKho} món chưa đủ định nghĩa để render.`,
    en: `${mon.length} of ${tongKho} items are not yet defined enough to render.`,
  };
}
