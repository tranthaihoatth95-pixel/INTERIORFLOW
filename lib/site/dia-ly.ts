/**
 * lib/site/dia-ly.ts — ĐẶC ĐIỂM ĐỊA LÝ CỦA ĐỊA ĐIỂM (§9). THUẦN, không đụng đĩa, không gọi mạng.
 *
 * 🔴🔴 **LUẬT NẶNG NHẤT FILE NÀY: CẤM SUY TỪ TÊN ĐỊA DANH RỒI COI LÀ SỰ THẬT.**
 *   Tên chỗ ở Việt Nam mang chữ biển/sông/núi nhiều đến mức nó gần như vô dụng làm bằng chứng:
 *     · **Hải Dương** có chữ "hải" (biển) nhưng nằm sâu trong đồng bằng, không giáp biển.
 *     · **Sông Công** (Thái Nguyên) là tên một thành phố, không nói gì về chỗ đứng của công trình.
 *     · **Núi Thành** (Quảng Nam) lại là một huyện **ven biển**.
 *   Ba ca này không phải chuyện chữ nghĩa vui — nếu máy nhận "ven biển" là SỰ THẬT rồi đẻ ra
 *   *"dùng inox mác cao chống ăn mòn"*, người dùng trả tiền cho một quyết định sinh ra từ chính tả.
 *
 *   ⇒ Vì vậy `goYTuTenDiaDanh()` **KHÔNG BAO GIỜ** trả về hạng cao hơn `inferred`, và luôn ghi rõ
 *   nó suy từ chữ nào. Muốn lên `verified` thì phải đi qua `venBienTuKhoangCach()` — tức là phải
 *   có một phép đo và một `NguonGoc`. Ranh giới này khoá bằng `chiLaGoY()` + test.
 */

import type { NguonGoc, ProvenanceFlag, SuThat } from './types';

export type MatDoDoThi = 'do-thi' | 'ngoai-o' | 'nong-thon';
export type MucNguyCo = 'cao' | 'trung-binh' | 'thap' | 'chua-ro';

/**
 * Mọi trường là `SuThat` chứ không phải giá trị trần — vì ở đây, **hạng tin cậy quan trọng ngang
 * giá trị**: "ven biển (đo được 800m tới bờ)" và "ven biển (đoán từ chữ 'hải' trong tên)" là hai
 * thứ khác hẳn nhau, và làm phẳng chúng là đúng cái §3 cấm.
 */
export interface DacDiemDiaLy {
  venBien?: SuThat<boolean>;
  khoangCachBienM?: SuThat<number>;
  venSong?: SuThat<boolean>;
  doiNui?: SuThat<boolean>;
  dao?: SuThat<boolean>;
  matDoDoThi?: SuThat<MatDoDoThi>;
  nguyCoNgap?: SuThat<MucNguyCo>;
}

/* ═══════════════ ĐƯỜNG ĐO ĐƯỢC — đường DUY NHẤT lên hạng cao ═══════════════ */

/**
 * Ngưỡng mặc định gọi là "ven biển" (m).
 * ⚠️ **QUY ƯỚC LÀM VIỆC, KHÔNG phải chuẩn.** Các tài liệu về ăn mòn khí quyển chia vùng ven biển
 * theo nhiều khoảng cách khác nhau tuỳ mức độ phơi nhiễm. Nó là THAM SỐ, và kết quả luôn ghi lại
 * ngưỡng đã dùng — để không ai đọc con số này như thể nó được ai đó ban hành.
 */
export const NGUONG_VEN_BIEN_M = 3000;

/**
 * "Ven biển" suy từ KHOẢNG CÁCH ĐO ĐƯỢC tới bờ.
 * Hạng: có `nguon` → `verified`; không có → `inferred` (phép đo không nói được nó từ đâu ra).
 */
export function venBienTuKhoangCach(
  khoangCachM: number,
  nguon?: NguonGoc,
  nguongM = NGUONG_VEN_BIEN_M,
): { venBien: SuThat<boolean>; khoangCachBienM: SuThat<number> } {
  const co: ProvenanceFlag = nguon ? 'verified' : 'inferred';
  const ghi = `đo khoảng cách tới bờ ${Math.round(khoangCachM)}m, ngưỡng ven biển đang dùng ${nguongM}m`;
  return {
    venBien: { giaTri: khoangCachM <= nguongM, co, nguon, ghiChu: nguon ? undefined : ghi },
    khoangCachBienM: { giaTri: khoangCachM, co, nguon, ghiChu: nguon ? undefined : ghi },
  };
}

/**
 * Nguy cơ ngập từ cao độ nền so với MỘT MỨC NGẬP THAM CHIẾU.
 * 🔴 Trả `null` khi thiếu mức tham chiếu — và **không có đường vòng nào**. Cao độ đứng một mình
 * không nói được gì về ngập: 2m so với mực nước biển là an toàn ở nơi này và là vùng ngập ở nơi
 * khác. Mức tham chiếu phải đến từ tài liệu quy hoạch/thuỷ văn, tức phải có người đi lấy về.
 * Đây chính là ca "thà rỗng thật còn hơn đầy giả".
 */
export function nguyCoNgapTuCaoDo(
  caoDoNenM: number | undefined,
  mucNgapThamChieuM: number | undefined,
  nguon?: NguonGoc,
): SuThat<MucNguyCo> | null {
  if (typeof caoDoNenM !== 'number' || typeof mucNgapThamChieuM !== 'number') return null;
  const du = caoDoNenM - mucNgapThamChieuM;
  const muc: MucNguyCo = du < 0 ? 'cao' : du < 0.5 ? 'trung-binh' : 'thap';
  const ghi = `cao độ nền ${caoDoNenM}m so mức ngập tham chiếu ${mucNgapThamChieuM}m (chênh ${du.toFixed(2)}m)`;
  return {
    giaTri: muc,
    co: nguon ? 'verified' : 'inferred',
    nguon,
    ghiChu: nguon ? undefined : ghi,
  };
}

/* ═══════════════ ĐƯỜNG GỢI Ý TỪ TÊN — MÃI MÃI CHỈ LÀ GỢI Ý ═══════════════ */

interface MauTen {
  truong: keyof DacDiemDiaLy;
  tu: string[];
}

/**
 * Bảng mảnh chữ. **Đây là suy đoán ngôn ngữ, không phải dữ liệu địa lý** — nó chỉ đáng tồn tại
 * vì nó giúp máy HỎI ĐÚNG CÂU (*"chỗ này có phải ven biển không?"*), chứ không phải để trả lời hộ.
 */
const MAU_TEN: MauTen[] = [
  { truong: 'venBien', tu: ['biển', 'bãi biển', 'hải', 'duyên hải', 'cửa biển', 'vịnh'] },
  { truong: 'dao', tu: ['đảo', 'quần đảo', 'cù lao', 'hòn'] },
  { truong: 'venSong', tu: ['sông', 'rạch', 'kênh', 'bến', 'cửa sông', 'đầm', 'hồ'] },
  { truong: 'doiNui', tu: ['núi', 'đồi', 'đèo', 'cao nguyên', 'thung lũng'] },
];

function boDau(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
}

/**
 * Gợi ý đặc điểm địa lý từ TÊN địa danh.
 * ⛔ Mọi kết quả luôn `co: 'inferred'` và luôn có `ghiChu` nêu đúng chữ đã khớp — đó là cách người
 * dùng nhìn ra ngay rằng máy đang **đoán từ chính tả**, và tự quyết có xác nhận hay không (§4).
 * Trả `{}` khi không khớp gì — không đoán bừa cho đủ trường.
 */
export function goYTuTenDiaDanh(ten: string | undefined): Partial<DacDiemDiaLy> {
  if (!ten || !ten.trim()) return {};
  const t = boDau(ten);
  const ra: Partial<DacDiemDiaLy> = {};
  for (const m of MAU_TEN) {
    const khop = m.tu.filter((tu) => t.includes(boDau(tu)));
    if (khop.length === 0) continue;
    const su: SuThat<boolean> = {
      giaTri: true,
      co: 'inferred',
      ghiChu:
        `GỢI Ý TỪ TÊN "${ten}" — khớp chữ ${khop.map((k) => `"${k}"`).join(', ')}. ` +
        'Tên địa danh KHÔNG phải bằng chứng địa lý (vd "Hải Dương" có chữ "hải" nhưng không giáp biển). ' +
        'Cần một phép đo hoặc tài liệu để xác nhận.',
    };
    (ra as Record<string, SuThat<boolean>>)[m.truong] = su;
  }
  return ra;
}

/**
 * Máy canh: mọi thứ do `goYTuTenDiaDanh()` sinh ra phải ở hạng `inferred` VÀ có ghi chú.
 * Trả `false` là dấu hiệu ai đó đã nới luật — test bắt ngay, không đợi tới lúc lên UI.
 */
export function chiLaGoY(x: Partial<DacDiemDiaLy>): boolean {
  return Object.values(x).every(
    (s) => s && (s as SuThat<unknown>).co === 'inferred' && Boolean((s as SuThat<unknown>).ghiChu?.trim()),
  );
}

/* ═══════════════ ĐỔ RA SỰ THẬT (§3A) ═══════════════ */

/**
 * Sự thật địa lý, khoá `dia-ly.*` (khớp `Mien` ở `./anh-huong.ts`).
 * Giữ NGUYÊN hạng của từng trường — cấm nâng hạng lúc đổ ra, vì đó đúng là chỗ một gợi ý từ tên
 * có thể lặng lẽ hoá thành "sự thật dự án".
 */
export function suThatDiaLy(d: Partial<DacDiemDiaLy>): Record<string, SuThat<unknown>> {
  const ra: Record<string, SuThat<unknown>> = {};
  for (const [k, v] of Object.entries(d)) {
    if (v) ra[`dia-ly.${k}`] = v as SuThat<unknown>;
  }
  return ra;
}
