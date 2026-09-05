/**
 * lib/cad/standards/vung-tu-vi-tri.ts — VỊ TRÍ CÔNG TRÌNH → BỘ QUY CHUẨN ÁP DỤNG.
 *
 * Thi hành chốt 15/08 của Hoà: *"vị trí dự án nằm đâu thì áp quy chuẩn tiêu chuẩn đồng bộ tại đó
 * thôi"* — MỘT biến kéo trọn bộ, thay vì bắt người dùng chọn từng bộ rồi tự lo chúng có hợp nhau.
 *
 * ⛔ VÌ SAO TỆP NÀY NẰM Ở `lib/cad/standards/` CHỨ KHÔNG PHẢI `lib/site/`:
 *   Câu hỏi ở đây là *"cơ quan nào ban hành luật cho chỗ này"* — đó là tri thức của TẦNG QUY
 *   CHUẨN, không phải của tầng địa điểm. `lib/site/` biết công trình đứng ở đâu; nó không có
 *   nghĩa vụ biết Việt Nam thì dùng QCVN/TCVN. Đặt ngược lại là bắt tầng địa điểm gánh từ vựng
 *   của tầng luật, và mỗi lần thêm một hệ quy chuẩn lại phải sửa `lib/site/`.
 *   Hệ quả: tệp này **KHÔNG import gì từ `lib/site`** — nó nhận một hình dạng dữ liệu HẸP
 *   (`ViTriDeSuyVung`) mà `ViTriDuAn` của `lib/site/types.ts` khớp sẵn về cấu trúc. Không dây
 *   buộc hai tầng, không vòng import, và test chạy được mà không kéo cả tầng địa điểm vào.
 *
 * 🔴🔴 **LUẬT NẶNG NHẤT FILE NÀY — ĐOÁN VÙNG THÌ KHÔNG ĐƯỢC LỌC.**
 *   Lọc luật theo vùng là con dao hai lưỡi: đoán ĐÚNG thì hồ sơ gọn đúng bộ; đoán SAI thì
 *   **32 luật VN (trong đó có PCCC bắt buộc) BIẾN MẤT KHÔNG AI HAY**. Đó là NỚI LỎNG — đúng thứ
 *   chốt 15/08 cấm tuyệt đối ở tầng C, và không có lý do gì tầng B được miễn.
 *   ⇒ `apDuocNgay` chỉ bật khi CON NGƯỜI đã khai quốc gia. Suy từ toạ độ **mãi mãi chỉ là gợi ý**:
 *   máy nói *"có vẻ dự án ở Việt Nam"*, người bấm nhận thì mới lọc. Đúng khuôn "máy gợi ý —
 *   người thêm" mà Hoà chốt cho biến số ngữ cảnh, áp luôn cho vùng.
 *   Cùng họ với luật của `lib/site/dia-ly.ts`: *"Hải Dương có chữ 'hải' nhưng không giáp biển"* —
 *   ở đây là *"toạ độ trong hộp bao Việt Nam chưa chắc là đất Việt Nam"* (hộp bao ôm cả một
 *   phần Lào, Campuchia, Nam Trung Quốc và biển Đông).
 */

import type { StandardRegion, StandardRule } from './registry';
import { getAllRules, getRulesByRegion, getMandatoryRules } from './registry';

/** Ba nấc tin cậy dùng chung toàn repo (`measured|inferred|verified`) — KHÔNG đẻ bộ thứ tư. */
export type HangVung = 'measured' | 'inferred' | 'verified';

/**
 * Hình dạng HẸP mà phép suy vùng cần. `ViTriDuAn` (lib/site/types.ts) khớp sẵn về cấu trúc, nên
 * nơi gọi truyền thẳng `hoSo.viTri` — không cần adapter, không cần import chéo tầng.
 */
export interface ViTriDeSuyVung {
  quocGia?: string;
  viDo?: number;
  kinhDo?: number;
}

export interface VungSuyRa {
  vung: StandardRegion;
  /** `measured` = người khai quốc gia · `inferred` = máy đoán từ toạ độ, hoặc chưa khai gì. */
  co: HangVung;
  /** LUÔN có nội dung — nói rõ vùng này từ đâu ra, để không ai đọc nó như sự thật đã kiểm. */
  ghiChu: string;
  /**
   * ⭐ CỬA AN TOÀN. `true` ⇒ được phép LỌC bộ luật theo vùng. `false` ⇒ chỉ được GỢI Ý, phải
   * dùng nguyên bộ. Xem luật nặng nhất ở đầu tệp.
   */
  apDuocNgay: boolean;
}

/**
 * Quốc gia → hệ quy chuẩn. **CỐ Ý NGẮN.** Chỉ khai những hệ mà repo THẬT SỰ có bộ luật:
 * VN (32 rule `vn-*`) và US (25 rule IBC/NFPA trong `intl-egress`/`intl-occupant-load`).
 * `EU` tồn tại trong union `StandardRegion` nhưng **0 rule** — khai một nước châu Âu về `'EU'`
 * sẽ trả về một bộ rỗng-luật-quốc-gia và tạo cảm giác "đã có bộ chuẩn châu Âu", tức nói dối.
 * Nước chưa khai ⇒ rơi về `INTL` kèm ghi chú nói thẳng là repo chưa có bộ của nước đó.
 *
 * Khoá là mã ISO-3166 alpha-2/alpha-3 **và** tên thường gọi — người dùng gõ "Việt Nam" hay "VN"
 * đều phải ra một kết quả; ép họ nhớ mã là đẩy việc của máy sang cho người.
 */
const BANG_QUOC_GIA: Record<string, StandardRegion> = {
  vn: 'VN', vnm: 'VN', 'viet nam': 'VN', vietnam: 'VN',
  us: 'US', usa: 'US', 'united states': 'US', 'hoa ky': 'US', 'my': 'US',
};

/** Bỏ dấu + gọn khoảng trắng — cùng phép chuẩn hoá `lib/site/dia-ly.ts` dùng, để "Việt Nam",
 *  "viet nam" và "VIỆT  NAM" là một. */
function chuanHoa(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * HỘP BAO Việt Nam (vĩ độ, kinh độ) — **xấp xỉ thô, KHÔNG phải biên giới**.
 * Nó ôm lẫn một phần Lào · Campuchia · Nam Trung Quốc · biển Đông. Đó là lý do kết quả suy từ
 * hộp bao này **không bao giờ** vượt hạng `inferred`, và không bao giờ tự lọc luật.
 * ⛔ Đừng nới bảng này thành "biên giới thế giới" — dựng một CSDL biên giới trong repo là việc
 * khác hẳn, và làm nửa vời thì tệ hơn không làm.
 */
const HOP_BAO: { vung: StandardRegion; ten: string; latMin: number; latMax: number; lngMin: number; lngMax: number }[] = [
  { vung: 'VN', ten: 'Việt Nam', latMin: 8.0, latMax: 23.6, lngMin: 102.0, lngMax: 110.0 },
];

/**
 * Suy vùng quy chuẩn từ vị trí công trình.
 *
 * Thứ tự: ① người khai `quocGia` → `measured`, LỌC ĐƯỢC · ② toạ độ rơi trong hộp bao →
 * `inferred`, CHỈ GỢI Ý · ③ không suy được → `INTL`, `inferred`, dùng nguyên bộ.
 * Ca ③ **không phải lỗi** — chưa khai vị trí là một trạng thái hợp lệ, và câu trả lời đúng lúc
 * đó là "dùng bộ chung", không phải chặn người dùng.
 */
export function vungTuViTri(v: ViTriDeSuyVung | undefined): VungSuyRa {
  const qg = v?.quocGia?.trim();
  if (qg) {
    const tra = BANG_QUOC_GIA[chuanHoa(qg)];
    if (tra) {
      return {
        vung: tra,
        co: 'measured',
        ghiChu: `người dùng khai quốc gia "${qg}" ⇒ áp bộ quy chuẩn ${tra}`,
        apDuocNgay: true,
      };
    }
    return {
      vung: 'INTL',
      co: 'measured',
      ghiChu:
        `người dùng khai quốc gia "${qg}", nhưng kho quy chuẩn của app CHƯA có bộ luật quốc gia nào cho nơi này` +
        ' ⇒ dùng bộ chung (nhân trắc/ISO). Đây là thiếu dữ liệu, không phải "nơi này không có luật".',
      apDuocNgay: true,
    };
  }

  const { viDo, kinhDo } = v ?? {};
  if (typeof viDo === 'number' && typeof kinhDo === 'number') {
    const hop = HOP_BAO.find(
      (h) => viDo >= h.latMin && viDo <= h.latMax && kinhDo >= h.lngMin && kinhDo <= h.lngMax,
    );
    if (hop) {
      return {
        vung: hop.vung,
        co: 'inferred',
        ghiChu:
          `GỢI Ý TỪ TOẠ ĐỘ (${viDo}, ${kinhDo}) — rơi trong hộp bao ${hop.ten}. Hộp bao là xấp xỉ thô,` +
          ' ôm lẫn cả nước láng giềng và mặt biển ⇒ CHƯA lọc bộ luật. Khai quốc gia để máy lọc đúng bộ.',
        apDuocNgay: false,
      };
    }
    return {
      vung: 'INTL',
      co: 'inferred',
      ghiChu:
        `toạ độ (${viDo}, ${kinhDo}) không rơi vào hộp bao quốc gia nào app đang biết ⇒ dùng bộ chung.` +
        ' Khai quốc gia để máy áp đúng bộ quy chuẩn nước sở tại.',
      apDuocNgay: false,
    };
  }

  return {
    vung: 'INTL',
    co: 'inferred',
    ghiChu: 'dự án chưa khai vị trí ⇒ dùng bộ chung (nhân trắc/ISO). Khai vị trí để áp đúng bộ nước sở tại.',
    apDuocNgay: false,
  };
}

/* ═══════════════ TỪ VÙNG → BỘ LUẬT (thang bậc A → B của chốt 15/08) ═══════════════ */

/**
 * ⭐ **A LUÔN CÓ MẶT, B CHỒNG LÊN.** Chốt 15/08 ghi rõ thang bậc:
 *   A nền công thái học (số gốc từ cơ thể, **lấp chỗ B im lặng**) → B chuẩn/luật quốc gia
 *   (soi A theo thực tế nước mình, **giữ nguyên hoặc NÂNG**).
 * ⇒ Bộ của một vùng = luật chung (không gắn vùng, vd ISO drafting) **∪ tầng A (`INTL`)**
 *   **∪ luật quốc gia của vùng đó**.
 *
 * 🔴 VÌ SAO KHÔNG GỌI THẲNG `getRulesByRegion(vung)` MỘT LẦN: nó trả `region === undefined ||
 * region === vung`, tức lọc về `'VN'` sẽ **VỨT 12 rule Neufert** (`region: 'INTL'`). Vứt tầng A
 * là phá đúng câu *"A lấp chỗ B im lặng"* — VN không có chuẩn công thái học cho đồ rời, bỏ
 * Neufert đi là mất luôn phần đó, im lặng. Hợp hai lượt lọc là cách rẻ nhất giữ đúng thang bậc.
 */
export function nenLuatTheoVung(v: VungSuyRa): StandardRule[] {
  if (!v.apDuocNgay) return getAllRules(); // đoán thì không lọc — luật nặng nhất đầu tệp
  const gop = new Map<string, StandardRule>();
  for (const r of getRulesByRegion('INTL')) gop.set(r.id, r); // tầng A + luật chung
  for (const r of getRulesByRegion(v.vung)) gop.set(r.id, r); // tầng B chồng lên
  return [...gop.values()];
}

/**
 * ⭐ **CỬA SAU KHÔNG ĐƯỢC MỞ.** Mọi bộ lọc TIỆN DỤNG (vd lọc theo loại hình khai thác —
 * `rulesForOperator`) **không bao giờ** được làm rơi luật BẮT BUỘC của vùng.
 *
 * Đây không phải lo xa, đo được: `rulesForOperator('generic')` chỉ giữ nhóm `iso-drafting`
 * (`lib/cad/operator-profile.ts` — `OPERATOR_RULE_GROUPS.generic`), tức **vứt sạch nhóm
 * `vn-fire`** vốn toàn luật PCCC `binding: 'mandatory'`. Một dự án ở Việt Nam chọn nhãn "Chung"
 * cho tiện sẽ lặng lẽ thôi bị kiểm thoát nạn. Hàm này gộp bộ bắt buộc trở lại.
 *
 * ⚠️ Chỉ gộp khi vùng đã CHẮC (`apDuocNgay`) — đoán vùng rồi nhét thêm luật của nước khác vào
 * cũng là một kiểu bịa, chỉ khác chiều.
 */
export function giuBoBatBuoc(chon: StandardRule[], v: VungSuyRa): StandardRule[] {
  if (!v.apDuocNgay) return chon;
  const co = new Set(chon.map((r) => r.id));
  const thieu = getMandatoryRules(v.vung).filter((r) => !co.has(r.id));
  return thieu.length === 0 ? chon : [...chon, ...thieu];
}

/**
 * Báo cáo cho người dùng: bộ lọc tiện dụng vừa suýt làm rơi bao nhiêu luật bắt buộc.
 * Trả mảng rỗng = không rơi gì. Nơi gọi bày ra, hàm này không tự xử.
 */
export function batBuocBiRoi(chon: StandardRule[], v: VungSuyRa): StandardRule[] {
  if (!v.apDuocNgay) return [];
  const co = new Set(chon.map((r) => r.id));
  return getMandatoryRules(v.vung).filter((r) => !co.has(r.id));
}
