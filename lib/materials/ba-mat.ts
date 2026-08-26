/**
 * lib/materials/ba-mat.ts — [marker: vatLieuBaMat] ĐỌC RA CHỮ ba mặt của MỘT vật liệu.
 *
 * `resolve.ts` `getMaterial()` (07/08) đã trả đủ ba mảnh — nhưng nó trả DỮ LIỆU THÔ, không trả
 * thứ đọc được trên màn. Từ 07/08 tới 17/08 hàm đó **0 nơi gọi ngoài chính test của nó**: dây có,
 * chưa cắm điện. File này là đoạn dây cuối — biến `MaterialFacets` thành ba dòng người đọc hiểu:
 * *mặt này ĐỦ chưa · nếu chưa thì THIẾU GÌ · và LÀM SAO CÓ*.
 *
 *   ① `ve2d`     ← `flat`       (MaterialDef)  — đứng ở chặng 2D thì mã này ra ký hiệu gì
 *   ② `dung3d`   ← `pbr`        (MaterialPbr)  — đứng ở chặng 3D thì ra chất liệu render gì
 *   ③ `trinhBay` ← `commercial` (ProductSpec)  — đứng ở Trình bày thì ra giá nào
 *
 * ⛔ **KHÔNG CHÉP GIÁ SANG BÊN THỊ GIÁC.** Module này chỉ ĐỌC mặt thương mại để dựng chuỗi hiển
 * thị tại lúc render; không hàm nào ở đây ghi. Giá đổi hằng ngày, texture thì không — luật
 * 2.1.9.i (30/07) cố ý tách hai bên và vẫn đúng. *"Hiểu được thông tin" = TRỎ TỚI ĐƯỢC, không
 * phải CHỨA.* Giá đọc ở đây là **giá kho chung**; giá chốt của một dự án là chuyện khác, sống ở
 * nơi khác (`boq-overrides`).
 *
 * BA TRẠNG THÁI, không phải hai — vì hai thì phải nói dối một ca có thật: bản ghi thương mại
 * TỒN TẠI nhưng bỏ trống giá. Gắn ✓ là bịa, gắn ✗ là sai. ⇒ `chuaDu` = *có mảnh, thiếu đúng thứ
 * mặt đó cần*. Không mảnh nào được rơi về giá trị mặc định để "cho đẹp bảng".
 *
 * Thuần — không React, không DOM, không localStorage. Chuỗi trả về là cặp {vi,en}, phía gọi tự
 * dịch bằng `useT()` (một nguồn chữ, không chép tay lần hai).
 */
import type { MaterialFacets } from './resolve';
import type { MaterialPbr } from './schema';

export interface BaMatText {
  vi: string;
  en: string;
}

/** Ba mặt = ba chặng nhìn vào cùng một `matId` (`IF-KIEN-TRUC.md` §5). */
export type MatKhoa = 've2d' | 'dung3d' | 'trinhBay';

/**
 * `du`     — mảnh có và dùng được ngay ở chặng đó.
 * `chuaDu` — mảnh CÓ nhưng thiếu đúng thứ chặng đó cần (vd có bản ghi thương mại mà bỏ trống giá;
 *            có ảnh vân mà không khai bước lặp vân ⇒ viên gạch 600mm render thành 3m).
 * `chuaCo` — chưa có mảnh nào cho mã này.
 */
export type MatTrangThai = 'du' | 'chuaDu' | 'chuaCo';

export interface MatMotMat {
  khoa: MatKhoa;
  trangThai: MatTrangThai;
  /** nhãn ngắn đứng cạnh ký hiệu trong bảng — LUÔN là chữ, ký hiệu chỉ nói *chữ này nói về gì*. */
  nhan: BaMatText;
  /** nhãn đầy đủ cho panel chi tiết và cho `aria-label`. */
  nhanDay: BaMatText;
  /** giá trị THẬT đang có — null khi không có gì để khoe. Không bao giờ là giá trị bịa. */
  tomTat: BaMatText | null;
  /** thiếu đúng cái gì — null khi `du`. */
  thieu: BaMatText | null;
  /** làm sao để có — null khi `du`. Cấm hiện ô trống câm. */
  loiRa: BaMatText | null;
  /** mặt này do MÁY SUY ĐOÁN (`MaterialPbr.suyDoan`), chưa ai xác nhận bằng mắt. */
  suyDoan: boolean;
}

export interface BaMat {
  matId: string;
  /** luôn đúng ba phần tử, luôn đúng thứ tự 2D → 3D → Trình bày. */
  mats: readonly [MatMotMat, MatMotMat, MatMotMat];
  /** số mặt đạt `du` (0–3) — dùng cho dòng tổng, không thay được cho chi tiết từng mặt. */
  soDu: number;
}

/** Nhóm ba chữ số cho tiền VND — MỘT nguồn định dạng, `MaterialTable` import lại chứ không tự chế. */
export function dinhDangVnd(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function tomTatPbr(pbr: MaterialPbr): BaMatText | null {
  const vi: string[] = [];
  const en: string[] = [];
  if (typeof pbr.roughness === 'number') {
    vi.push(`nhám ${pbr.roughness.toFixed(2)}`);
    en.push(`rough ${pbr.roughness.toFixed(2)}`);
  }
  if (pbr.metallic === 1) { vi.push('kim loại'); en.push('metal'); }
  else if (pbr.metallic === 0) { vi.push('phi kim'); en.push('dielectric'); }
  if (pbr.baseColorMapUrl) { vi.push('có ảnh vân'); en.push('has colour map'); }
  else if (pbr.baseColor) { vi.push(`màu ${pbr.baseColor}`); en.push(`colour ${pbr.baseColor}`); }
  if (vi.length === 0) return null;
  return { vi: vi.join(' · '), en: en.join(' · ') };
}

function matVe2d(f: MaterialFacets): MatMotMat {
  const nhan = { vi: '2D', en: '2D' };
  const nhanDay = { vi: 'Ký hiệu 2D', en: '2D symbol' };
  const d = f.flat;
  if (!d) {
    return {
      khoa: 've2d', trangThai: 'chuaCo', nhan, nhanDay, tomTat: null, suyDoan: false,
      thieu: { vi: 'chưa có ký hiệu 2D cho mã này', en: 'no 2D symbol for this code' },
      loiRa: {
        vi: 'gán mã này cho một mẫu vật liệu 2D — bản vẽ mới có hoạ tiết đúng',
        en: 'attach this code to a 2D material preset so drawings hatch correctly',
      },
    };
  }
  return {
    khoa: 've2d', trangThai: 'du', nhan, nhanDay, suyDoan: false,
    tomTat: { vi: `${d.name} · ${d.hatchPattern}`, en: `${d.name} · ${d.hatchPattern}` },
    thieu: null, loiRa: null,
  };
}

function matDung3d(f: MaterialFacets): MatMotMat {
  const nhan = { vi: '3D', en: '3D' };
  const nhanDay = { vi: 'Chất liệu render 3D', en: '3D render material' };
  const p = f.pbr;
  if (!p) {
    return {
      khoa: 'dung3d', trangThai: 'chuaCo', nhan, nhanDay, tomTat: null, suyDoan: false,
      thieu: { vi: 'chưa có thông số render', en: 'no render parameters yet' },
      loiRa: {
        vi: 'mở cửa sổ chất liệu render và đặt độ nhám, kim loại, ảnh vân',
        en: 'open the render material window and set roughness, metalness, colour map',
      },
    };
  }
  const tomTat = tomTatPbr(p);
  const suyDoan = p.suyDoan === true;
  if (!tomTat) {
    return {
      khoa: 'dung3d', trangThai: 'chuaDu', nhan, nhanDay, tomTat: null, suyDoan,
      thieu: { vi: 'có bản ghi nhưng chưa đặt thông số nào', en: 'record exists but no parameter set' },
      loiRa: {
        vi: 'mở cửa sổ chất liệu render và đặt độ nhám, kim loại, ảnh vân',
        en: 'open the render material window and set roughness, metalness, colour map',
      },
    };
  }
  /* Có ảnh vân mà thiếu bước lặp vân là hỏng THẤY ĐƯỢC, không phải thiếu vặt: ảnh kéo theo UV
     mặc định ⇒ viên gạch 600mm hiện thành 3m (docstring `schema.ts` uvScaleMm). */
  if (p.baseColorMapUrl && !p.uvScaleMm) {
    return {
      khoa: 'dung3d', trangThai: 'chuaDu', nhan, nhanDay, tomTat, suyDoan,
      thieu: { vi: 'có ảnh vân nhưng chưa khai bước lặp vân (mm)', en: 'colour map set but no tiling size (mm)' },
      loiRa: {
        vi: 'khai bước lặp vân — thiếu nó thì vân sai tỉ lệ ngay khi nhìn',
        en: 'set the tiling size — without it the pattern renders at the wrong scale',
      },
    };
  }
  return { khoa: 'dung3d', trangThai: 'du', nhan, nhanDay, tomTat, thieu: null, loiRa: null, suyDoan };
}

function matTrinhBay(f: MaterialFacets): MatMotMat {
  const nhan = { vi: 'Giá', en: 'Price' };
  const nhanDay = { vi: 'Giá kho chung & đơn vị', en: 'Shared-catalogue price & unit' };
  const c = f.commercial;
  if (!c) {
    return {
      khoa: 'trinhBay', trangThai: 'chuaCo', nhan, nhanDay, tomTat: null, suyDoan: false,
      thieu: { vi: 'không có bản ghi thương mại nào mang mã này', en: 'no commercial record carries this code' },
      loiRa: {
        vi: 'thêm món vào kho vật liệu với đúng mã này, hoặc sửa mã cho khớp',
        en: 'add the item to the materials warehouse under this code, or fix the code',
      },
    };
  }
  const gia = typeof c.priceVnd === 'number' ? c.priceVnd : null;
  if (gia === null) {
    const ten = c.vendor ?? c.brand ?? c.name;
    return {
      khoa: 'trinhBay', trangThai: 'chuaDu', nhan, nhanDay, suyDoan: false,
      tomTat: { vi: `có bản ghi — ${ten}`, en: `record found — ${ten}` },
      thieu: { vi: 'có bản ghi thương mại nhưng bỏ trống giá', en: 'commercial record exists but price is empty' },
      loiRa: {
        vi: 'điền giá kho chung — bảng khối lượng chỉ nhận số đo được, không nhận số ước tính',
        en: 'fill in the shared-catalogue price — the BOQ only takes measured figures, never estimates',
      },
    };
  }
  const donVi = c.unit ? `/${c.unit}` : '';
  return {
    khoa: 'trinhBay', trangThai: 'du', nhan, nhanDay, suyDoan: false,
    tomTat: { vi: `${dinhDangVnd(gia)} ₫${donVi}`, en: `${dinhDangVnd(gia)} ₫${donVi}` },
    thieu: null, loiRa: null,
  };
}

/** Đọc ba mặt của một vật liệu ĐÃ resolve. Mảnh thiếu ⇒ nói thẳng thiếu gì, không bịa mặc định. */
export function baMatCuaVatLieu(f: MaterialFacets): BaMat {
  const mats = [matVe2d(f), matDung3d(f), matTrinhBay(f)] as const;
  return { matId: f.matId, mats, soDu: mats.filter((m) => m.trangThai === 'du').length };
}

/**
 * Món CHƯA CÓ MÃ. ⚠️ SUPERSEDED 19/08: matId nay là IF-owned immutable UUID (chốt hòa giải
 * Hoà 19/08), KHÔNG còn = ProductSpec.sku. "Chưa có mã" nghĩa là chưa có matId — vẫn không tra
 * được cả ba mặt. Logic hàm giữ nguyên; text hiển thị "Mã vật liệu" có thể cần đổi thành
 * "Material ID" sau khi UI thi công, phiếu Slice 1A kế. Xem `lib/materials/matid-identity.ts`.
 */
export function baMatChuaCoMa(): BaMat {
  const loiRa: BaMatText = {
    vi: 'đặt Mã vật liệu cho món này — mã là khoá nối cả ba mặt',
    en: 'give this item a material code — the code is what links all three faces',
  };
  const thieu: BaMatText = { vi: 'món chưa có mã nên không tra được mặt nào', en: 'no code, so no face can be looked up' };
  const mot = (khoa: MatKhoa, nhan: BaMatText, nhanDay: BaMatText): MatMotMat =>
    ({ khoa, trangThai: 'chuaCo', nhan, nhanDay, tomTat: null, thieu, loiRa, suyDoan: false });
  return {
    matId: '',
    mats: [
      mot('ve2d', { vi: '2D', en: '2D' }, { vi: 'Ký hiệu 2D', en: '2D symbol' }),
      mot('dung3d', { vi: '3D', en: '3D' }, { vi: 'Chất liệu render 3D', en: '3D render material' }),
      mot('trinhBay', { vi: 'Giá', en: 'Price' }, { vi: 'Giá kho chung & đơn vị', en: 'Shared-catalogue price & unit' }),
    ],
    soDu: 0,
  };
}
