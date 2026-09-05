/**
 * lib/cad/standards/ngu-canh.ts — TẦNG C: BIẾN SỐ NGỮ CẢNH. **CHỈ SIẾT, KHÔNG BAO GIỜ NỚI.**
 *
 * Thang bậc Hoà chốt 15/08 (đính chính cùng ngày):
 *   **A** nền công thái học (số gốc từ cơ thể, lấp chỗ B im lặng)
 *   → **B** chuẩn/luật quốc gia (soi A theo thực tế nước mình, **giữ nguyên hoặc NÂNG**)
 *   → **C** biến số ngữ cảnh (ven biển · vùng ngập · gió mạnh · nóng ẩm…) — **CHỈ SIẾT THÊM**.
 * A và B nối ở `./vung-tu-vi-tri.ts`. Tệp này là C.
 *
 * 🔴🔴 **CHẶN AN TOÀN TỐI CAO (nguyên văn chốt 15/08):**
 *   *"Cờ 'ven biển' được thêm yêu cầu chống ăn mòn, KHÔNG BAO GIỜ được hạ chuẩn phòng cháy.
 *   Thiếu chặn này thì biến số tuỳ chọn thành CỬA SAU LÁCH LUẬT."*
 *   ⇒ Chặn đó ở đây **KHÔNG phải một dòng dặn dò** mà là `khongNoiLong()` — máy soi từng luật,
 *   từng tham số, và `apBienSoNguCanh()` **TỪ CHỐI** mọi phép siết vi phạm. Có test cắm hẳn một
 *   ca cố tình nới lỏng để chứng minh nó bị chặn (`ngu-canh.test.ts`).
 *
 * ⭐ **MÁY GỢI Ý — NGƯỜI THÊM.** Máy suy đặc điểm địa lý (`../../site/dia-ly.ts`) rồi TRÌNH cho
 *   KTS bấm nhận; nó **không tự áp**. Suy từ TÊN địa danh thì mãi mãi chỉ là gợi ý — `dia-ly.ts`
 *   đã khoá điều đó bằng `chiLaGoY()`, và tệp này tôn trọng: chỉ sự thật hạng `measured`/
 *   `verified` mới đi vào `bienSoDaNhan()`.
 *
 * ⛔ **KHÔNG BỊA SỐ.** Bảng siết trị số (`SIET`) hiện **RỖNG TRONG SẢN XUẤT** — chưa tra được
 *   điều khoản gốc nào cho "ven biển thì nâng ngưỡng X lên Y". Đó đúng kỷ luật `lib/site/
 *   chinh-sach.ts` đã đặt: *"chưa có nguồn bảo vệ được thì luật IM TRONG SẢN XUẤT, chứ không đem
 *   ra bỏ phiếu"*. Cơ chế thì dựng đủ và có máy canh; ai tra được nguồn thật thì thêm một dòng
 *   vào `SIET` — không phải viết lại tầng C.
 */

import type { StandardRule, StandardRegion } from './registry';
import type { DacDiemDiaLy } from '../../site/dia-ly';

/**
 * Mã biến số ngữ cảnh. **CỐ Ý TRÙNG KHÍT** `MaBienSoNguCanh` ở `lib/site/types.ts` — cùng một
 * từ vựng, không đẻ bộ thứ hai (đúng thứ `may-soi-dong-dang` sinh ra để bắt). Khai lại ở đây
 * dưới dạng union thuần thay vì import chéo tầng, vì `lib/site/types.ts` kéo theo cả tầng địa
 * điểm; ràng buộc "hai bảng phải khớp" được khoá bằng test chứ không bằng lời dặn.
 */
export type MaNguCanh =
  | 'ven-bien'
  | 'vung-ngap'
  | 'co-mua-dong'
  | 'nong-am'
  | 'huong-tay-nang'
  | 'tap-quan'
  | 'vat-lieu-tai-cho';

export type HangNguCanh = 'measured' | 'inferred' | 'verified';

export interface BienSoNguCanhApDung {
  ma: MaNguCanh;
  /** `inferred` = máy gợi ý, CHƯA áp · `measured`/`verified` = đã có bằng chứng/người gật ⇒ áp. */
  co: HangNguCanh;
  /** Vì sao có biến số này — luôn có nội dung, để không ai đọc gợi ý như sự thật. */
  lyDo: string;
}

/* ═══════════════ ① MÁY GỢI Ý: ĐỊA LÝ → BIẾN SỐ ═══════════════ */

/** Trường địa lý nào nuôi biến số nào. Khai MỘT LẦN để không nơi nào tự đoán. */
const TU_DIA_LY: { truong: keyof DacDiemDiaLy; ma: MaNguCanh; khiGiaTri: 'that' | 'muc-cao' }[] = [
  { truong: 'venBien', ma: 'ven-bien', khiGiaTri: 'that' },
  { truong: 'dao', ma: 'ven-bien', khiGiaTri: 'that' },
  { truong: 'nguyCoNgap', ma: 'vung-ngap', khiGiaTri: 'muc-cao' },
];

/**
 * Đặc điểm địa lý → danh sách biến số ngữ cảnh, **GIỮ NGUYÊN HẠNG** của sự thật gốc.
 * ⛔ Cấm nâng hạng lúc đổ ra — đó đúng chỗ một gợi ý từ chính tả ("Hải Dương" có chữ "hải") lặng
 *   lẽ hoá thành sự thật dự án rồi đẻ ra "dùng inox mác cao". `dia-ly.ts` đã cảnh báo đúng ca này.
 */
export function goYBienSoTuDiaLy(d: Partial<DacDiemDiaLy>): BienSoNguCanhApDung[] {
  const ra = new Map<MaNguCanh, BienSoNguCanhApDung>();
  for (const m of TU_DIA_LY) {
    const su = d[m.truong];
    if (!su) continue;
    const dung =
      m.khiGiaTri === 'that' ? su.giaTri === true : su.giaTri === 'cao' || su.giaTri === 'trung-binh';
    if (!dung) continue;
    const moi: BienSoNguCanhApDung = {
      ma: m.ma,
      co: su.co,
      lyDo: su.ghiChu?.trim() || `từ sự thật địa lý "${String(m.truong)}" (${su.nguon?.tieuDe ?? 'có nguồn'})`,
    };
    // Cùng một mã tới từ hai trường (venBien + dao) ⇒ giữ bản HẠNG CAO HƠN, vì đó là bằng chứng
    // mạnh hơn; hạ xuống bản yếu hơn là vứt bằng chứng.
    const cu = ra.get(m.ma);
    if (!cu || THU_TU[moi.co] > THU_TU[cu.co]) ra.set(m.ma, moi);
  }
  return [...ra.values()];
}

const THU_TU: Record<HangNguCanh, number> = { inferred: 0, measured: 1, verified: 2 };

/**
 * ⭐ CỬA NGƯỜI-GẬT. Chỉ biến số có BẰNG CHỨNG (`measured`) hoặc NGƯỜI ĐÃ NHẬN (`verified`) mới
 * được áp vào bộ luật. `inferred` ở lại làm gợi ý trên màn — máy gợi ý, người thêm.
 */
export function bienSoDaNhan(ds: BienSoNguCanhApDung[]): BienSoNguCanhApDung[] {
  return ds.filter((b) => b.co !== 'inferred');
}

/* ═══════════════ ② LUẬT DO NGỮ CẢNH THÊM VÀO ═══════════════ */

/**
 * Luật C **THÊM** khi biến số được nhận.
 * 🔴 Cả bộ dưới đây `verified: false` · `binding: 'advisory'` · `params: {}` — **CỐ Ý KHÔNG CÓ
 * TRỊ SỐ NÀO**. Chúng là câu nhắc nghề có địa chỉ, không phải ngưỡng đo. Gắn một con số chưa tra
 * được nguồn rồi cho nó `severity: 'error'` là đúng thứ đầu `registry.ts` cấm: *"TUYỆT ĐỐI không
 * bịa số rồi gắn mác quy chuẩn như thật"*. Không có trị số ⇒ `checker.ts` không đo ⇒ không sinh
 * violation giả; luật vẫn có mặt trong bộ và trong báo cáo, đúng vai một mục cần người xem xét.
 */
const LUAT_THEM: Record<MaNguCanh, StandardRule[]> = {
  'ven-bien': [
    {
      id: 'ctx-ven-bien-chong-an-mon',
      source: 'Biến số ngữ cảnh — chưa trích được điều khoản gốc',
      category: 'other',
      severity: 'info',
      description:
        'Công trình ven biển: rà lại kim loại lộ thiên (phụ kiện, tay nắm, khung, ray, ốc vít) và lớp hoàn thiện ngoài trời theo yêu cầu chống ăn mòn khí quyển biển.',
      params: {},
      verified: false,
      note:
        'CHƯA tra được điều khoản/tiêu chuẩn gốc quy định mác vật liệu theo khoảng cách tới biển. Đây là mục CẦN NGƯỜI XEM XÉT, không phải ngưỡng đo — cố ý không gắn trị số để máy không sinh kết luận sai.',
      binding: 'advisory',
      region: undefined,
    },
  ],
  'vung-ngap': [
    {
      id: 'ctx-vung-ngap-cao-do-va-chan-tuong',
      source: 'Biến số ngữ cảnh — chưa trích được điều khoản gốc',
      category: 'other',
      severity: 'info',
      description:
        'Vùng có nguy cơ ngập: rà lại cao độ sàn hoàn thiện, vật liệu chân tường và vị trí ổ cắm/tủ điện thấp.',
      params: {},
      verified: false,
      note:
        'CHƯA tra được mức ngập tham chiếu nào có nguồn cho địa điểm cụ thể — `lib/site/dia-ly.ts#nguyCoNgapTuCaoDo` cũng trả null khi thiếu mức tham chiếu. Mục cần người xem xét, không gắn trị số.',
      binding: 'advisory',
      region: undefined,
    },
  ],
  'co-mua-dong': [],
  'nong-am': [],
  'huong-tay-nang': [],
  'tap-quan': [],
  'vat-lieu-tai-cho': [],
};

/**
 * Phép SIẾT trị số của luật đã có. **RỖNG TRONG SẢN XUẤT — có lý do, không phải quên.**
 * Xem đoạn "KHÔNG BỊA SỐ" ở đầu tệp. Thêm một dòng ở đây là đủ để tầng C siết thật; máy canh
 * `khongNoiLong()` sẽ tự chặn nếu dòng đó lỡ nới lỏng.
 */
export type BangSiet = Partial<Record<MaNguCanh, { ruleId: string; params: Record<string, number> }[]>>;

const SIET: BangSiet = {};

/* ═══════════════ ③ MÁY CANH: CHỈ SIẾT, KHÔNG NỚI ═══════════════ */

/**
 * Chiều "siết" của một tham số. Tên bắt đầu bằng `min` ⇒ siết là TĂNG; `max` ⇒ siết là GIẢM.
 * ⛔ **Tên không đọc được chiều ⇒ CẤM ĐỔI** (phải bằng nhau). Đây là mặc định bảo thủ có chủ ý:
 * đoán chiều sai một lần là nới lỏng một luật mà không ai thấy — thà chặn thừa còn hơn.
 */
function chieuSiet(ten: string): 'tang' | 'giam' | 'cam-doi' {
  if (/^min/i.test(ten)) return 'tang';
  if (/^max/i.test(ten)) return 'giam';
  return 'cam-doi';
}

const NANG_SEVERITY: Record<StandardRule['severity'], number> = { info: 0, warning: 1, error: 2 };
const NANG_BINDING: Record<NonNullable<StandardRule['binding']>, number> = {
  advisory: 0,
  adjustable: 1,
  mandatory: 2,
};
/** Luật cũ không khai `binding` ⇒ suy từ `severity` (đúng ghi chú ở `registry.ts#binding`). */
function bindingCua(r: StandardRule): number {
  if (r.binding) return NANG_BINDING[r.binding];
  return r.severity === 'error' ? NANG_BINDING.mandatory : NANG_BINDING.adjustable;
}

export interface ViPhamNoiLong {
  ruleId: string;
  /** Nói bằng tiếng người — dòng này hiện thẳng cho người dùng khi máy từ chối. */
  lyDo: string;
}

/**
 * ⭐ MÁY CANH. So bộ luật TRƯỚC ↔ SAU khi tầng C tác động. Trả danh sách vi phạm; rỗng = hợp lệ.
 * Bốn thứ tầng C **không bao giờ** được làm:
 *   ① làm BIẾN MẤT một luật · ② HẠ `binding` (mandatory → adjustable/advisory) ·
 *   ③ HẠ `severity` (error → warning/info) · ④ NỚI một tham số (hoặc đổi tham số không rõ chiều).
 */
export function khongNoiLong(truoc: StandardRule[], sau: StandardRule[]): ViPhamNoiLong[] {
  const map = new Map(sau.map((r) => [r.id, r]));
  const ra: ViPhamNoiLong[] = [];
  for (const t of truoc) {
    const s = map.get(t.id);
    if (!s) {
      ra.push({ ruleId: t.id, lyDo: 'biến số ngữ cảnh làm BIẾN MẤT một luật — tầng C chỉ được thêm/siết' });
      continue;
    }
    if (bindingCua(s) < bindingCua(t)) {
      ra.push({
        ruleId: t.id,
        lyDo: `HẠ ràng buộc "${t.binding ?? `suy từ severity ${t.severity}`}" → "${s.binding ?? `suy từ severity ${s.severity}`}"`,
      });
    }
    if (NANG_SEVERITY[s.severity] < NANG_SEVERITY[t.severity]) {
      ra.push({ ruleId: t.id, lyDo: `HẠ mức nghiêm trọng "${t.severity}" → "${s.severity}"` });
    }
    for (const [ten, giaTriCu] of Object.entries(t.params)) {
      const giaTriMoi = s.params[ten];
      if (typeof giaTriMoi !== 'number') {
        ra.push({ ruleId: t.id, lyDo: `GỠ tham số "${ten}" (${giaTriCu})` });
        continue;
      }
      const chieu = chieuSiet(ten);
      if (chieu === 'tang' && giaTriMoi < giaTriCu) {
        ra.push({ ruleId: t.id, lyDo: `NỚI "${ten}": ${giaTriCu} → ${giaTriMoi} (tham số min chỉ được tăng)` });
      } else if (chieu === 'giam' && giaTriMoi > giaTriCu) {
        ra.push({ ruleId: t.id, lyDo: `NỚI "${ten}": ${giaTriCu} → ${giaTriMoi} (tham số max chỉ được giảm)` });
      } else if (chieu === 'cam-doi' && giaTriMoi !== giaTriCu) {
        ra.push({
          ruleId: t.id,
          lyDo: `ĐỔI "${ten}": ${giaTriCu} → ${giaTriMoi}, nhưng tên tham số không nói được chiều siết ⇒ cấm đổi`,
        });
      }
    }
  }
  return ra;
}

export interface KetQuaNguCanh {
  rules: StandardRule[];
  /** Luật tầng C vừa thêm vào. */
  themVao: StandardRule[];
  /** Luật vừa bị siết chặt hơn. */
  daSiet: string[];
  /** Phép siết BỊ TỪ CHỐI vì nới lỏng — bày ra, không nuốt im. */
  tuChoi: ViPhamNoiLong[];
}

/**
 * ⭐ ÁP TẦNG C. Chỉ nhận biến số **đã được người gật/có bằng chứng** (`bienSoDaNhan`).
 *
 * 🔴 Phép siết nào làm `khongNoiLong()` kêu thì **BỊ BỎ, không được áp** — và lý do đi ra ngoài
 * qua `tuChoi` để người dùng thấy. Nuốt im một phép siết hỏng là biến máy canh thành đồ trang trí.
 * Luật THÊM thì không thể nới lỏng theo định nghĩa (chỉ thêm mục mới), nhưng vẫn chạy qua máy
 * canh một lượt cuối — máy canh rẻ, và niềm tin vào nó phải đến từ việc nó luôn chạy.
 */
export function apBienSoNguCanh(
  rules: StandardRule[],
  bien: BienSoNguCanhApDung[],
  opts?: {
    /**
     * MỐI NỐI CHO FIXTURE. Sản xuất KHÔNG truyền — dùng `SIET` (rỗng, có lý do ở đầu tệp).
     * Nó tồn tại vì máy canh chỉ đáng tin khi có ai đó CẮM THẬT một phép siết nới lỏng và thấy
     * nó bị từ chối; bảng sản xuất rỗng thì không có cách nào chứng minh điều đó.
     */
    siet?: BangSiet;
  },
): KetQuaNguCanh {
  const bangSiet = opts?.siet ?? SIET;
  const nhan = bienSoDaNhan(bien);
  const coSan = new Set(rules.map((r) => r.id));
  const themVao: StandardRule[] = [];
  const daSiet: string[] = [];
  const tuChoi: ViPhamNoiLong[] = [];

  let ra = [...rules];
  for (const b of nhan) {
    for (const r of LUAT_THEM[b.ma] ?? []) {
      if (coSan.has(r.id)) continue;
      coSan.add(r.id);
      themVao.push(r);
      ra.push(r);
    }
  }

  for (const b of nhan) {
    for (const s of bangSiet[b.ma] ?? []) {
      const i = ra.findIndex((r) => r.id === s.ruleId);
      if (i < 0) continue; // luật không có trong bộ đang dùng ⇒ không có gì để siết
      const thu = [...ra];
      thu[i] = { ...ra[i], params: { ...ra[i].params, ...s.params } };
      const loi = khongNoiLong(ra, thu);
      if (loi.length > 0) {
        tuChoi.push(...loi);
        continue; // TỪ CHỐI — giữ nguyên bộ cũ
      }
      ra = thu;
      daSiet.push(s.ruleId);
    }
  }

  // Lượt canh cuối trên toàn bộ phép biến đổi.
  const loiCuoi = khongNoiLong(rules, ra);
  if (loiCuoi.length > 0) return { rules, themVao: [], daSiet: [], tuChoi: loiCuoi };
  return { rules: ra, themVao, daSiet, tuChoi };
}

/** Vùng nào đang được áp — tiện cho nơi gọi bày nhãn, không tính lại gì. */
export type { StandardRegion };
