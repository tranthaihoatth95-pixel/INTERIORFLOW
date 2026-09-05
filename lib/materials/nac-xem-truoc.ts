/**
 * lib/materials/nac-xem-truoc.ts — HỢP ĐỒNG BA NẤC XEM TRƯỚC VẬT LIỆU.
 *
 * ⛔ VÌ SAO LÀ MỘT HÀM THUẦN CHỨ KHÔNG PHẢI MỘT MÁY SOI (bác đề xuất `soi:vat-lieu`):
 * ngưỡng ở đây phụ thuộc `uvScaleMm` **của từng vật liệu, lúc chạy** — một máy soi tĩnh đọc mã
 * nguồn không bao giờ biết tấm ván này lặp vân 1200 mm hay 120 mm. Ngưỡng sống ở đây thì **không
 * đi vòng được**: mọi ô xem trước phải qua hàm này để lấy `repeat`. Và khi con số hoá ra sai
 * (nó CHƯA được thử bằng mắt người — xem ⚠️ dưới) thì sửa **một hằng số**, không nắn cả repo.
 *
 * ⭐ BA NẤC LÀ BA CÔNG NĂNG, KHÔNG PHẢI BA CỠ (Hoà chốt 16/08, đã phải sửa hai lần):
 *   SCAN    — *hàng này là món nào*      → màu + họ bề mặt. KHÔNG nói gì về khổ thật.
 *   JUDGE   — *hai món khác nhau ở đâu*  → CHẤT: vân, độ nhám. Khung soi ~25 mm.
 *   INSPECT — *lát ra thì trông thế nào* → KHỔ: mạch, hướng, module. Khung ~1,5 module.
 * Cửa nghiệm thu hai vế: nấc nhỏ đứng được một mình **và** nấc to mang thứ nấc nhỏ KHÔNG THỂ có.
 * Vế hai được ép bằng máy ngay trong hàm này (`LAN_KHAC_KHO`) — nấc INSPECT nào không đủ khác
 * nấc JUDGE thì **BỊ KHOÁ kèm lý do**, không được hiện ra như một ảnh phóng to.
 *
 * ⚠️ HAI CON SỐ DƯỚI ĐÂY LÀ SUY LUẬN, CHƯA PHẢI CHUẨN CÔNG BỐ (spec §7-2, khai thẳng):
 * `SAN_PX_JUDGE = 80` và `MAT_DO_TOI_THIEU = 6.7 px/mm` ghép từ bốn dữ kiện có nguồn (góc nhìn
 * W3C · thị lực Snellen · giải phẫu vòng năm gỗ · cỡ mẫu nghề), nhưng **phép ghép thì không có
 * nguồn**, và CHƯA ai thử bằng mắt người với đúng hai ảnh sồi/óc chó (phép thử N1). ⇒ Đây là
 * ĐIỂM KHỞI ĐẦU THAM CHIẾU, không phải bất biến. Đổi nó là đổi hai dòng ở đây.
 *
 * THUẦN — không DOM, không WebGL, không đọc kho nào.
 */
import type { MaterialPbr } from './schema';

export type NacXem = 'scan' | 'judge' | 'inspect';

export interface KetQuaNac {
  /** cạnh ngắn của ô, tính bằng px CSS — chép lại đầu vào để nơi gọi không phải giữ hai biến. */
  px: number;
  /** bề rộng THẬT của khung soi, tính bằng mm. `null` = nấc này KHÔNG nói gì về khổ thật
   * (SCAN), hoặc không đủ dữ liệu để nói (thiếu `uvScaleMm`) — nơi gọi CẤM tự đoán thay. */
  spanMm: number | null;
  /** số lần lặp vân trong khung soi = `spanMm / uvScaleMm.w`. Đây là thứ nơi gọi đưa xuống
   * `texture.repeat`; `null` đi kèm `spanMm: null`. */
  repeat: number | null;
  /** nấc này ĐỨNG ĐƯỢC chưa: đủ dữ liệu để vẽ · đủ px · (JUDGE) đủ mật độ px/mm · (INSPECT) đủ
   * khác nấc JUDGE. */
  datNguong: boolean;
  /** câu tiếng người nói VÌ SAO chưa đạt. `null` khi `datNguong` true. Không bao giờ để nơi gọi
   * phải tự nghĩ ra lời giải thích — đó là cách đẻ ra ô mờ câm. */
  lyDo: string | null;
}

/** Sàn px cạnh ngắn của từng nấc. SCAN 44 = sàn NHẬN DẠNG (đủ biết là món nào), cùng con số
 * `--tap` của hệ; JUDGE 80 = sàn PHÁN (đủ thấy vân) — xem ⚠️ trên. */
export const SAN_PX: Readonly<Record<NacXem, number>> = { scan: 44, judge: 80, inspect: 80 };

/** Mật độ tối thiểu để vân đọc được ở nấc JUDGE, px trên mỗi mm thật. SUY LUẬN — xem ⚠️. */
export const MAT_DO_TOI_THIEU = 6.7;

/** Khung soi của nấc JUDGE, mm. Vân gỗ/đá đọc được ở quãng này; vật liệu nào lặp NHỎ HƠN thì
 * lấy đúng bước lặp của nó (soi rộng hơn cả module là thấy lưới, không thấy chất). */
export const KHUNG_JUDGE_MM = 25;

/** Khung soi của nấc INSPECT = 1,5 module — đủ thấy MỘT module trọn kèm mạch nối hai bên. */
export const HE_SO_INSPECT = 1.5;

/** INSPECT phải rộng gấp ít nhất chừng này lần JUDGE mới được coi là một nấc KHÁC. Dưới ngưỡng
 * thì nó chỉ là ảnh phóng to — đúng lỗi "ba nấc thành kéo dãn" đã bị bắt hai lần. */
export const LAN_KHAC_KHO = 10;

/**
 * Đọc thông số của MỘT nấc xem trước cho MỘT vật liệu.
 * KHÔNG bịa: thiếu `uvScaleMm` thì trả `spanMm: null` + lý do, chứ không lấy một khổ mặc định
 * rồi vẽ ra một tấm ván sai tỉ lệ — nói dối về khổ là thứ người nghề phát hiện ngay và mất tin
 * cả bảng.
 */
export function nacXemTruoc(pbr: MaterialPbr | null | undefined, nac: NacXem, px: number): KetQuaNac {
  const canh = Number.isFinite(px) ? Math.max(0, Math.round(px)) : 0;
  const trong = (lyDo: string): KetQuaNac => ({ px: canh, spanMm: null, repeat: null, datNguong: false, lyDo });

  if (!pbr) return trong('chưa có thông số render cho mã này');
  if (canh < SAN_PX[nac]) {
    return trong(`ô ${canh} px, nấc này cần tối thiểu ${SAN_PX[nac]} px cạnh ngắn`);
  }

  // SCAN cố ý KHÔNG khai khổ: nó trả lời "món nào", không trả lời "khổ bao nhiêu". Khai một con
  // số ở đây là mời nơi gọi vẽ vân theo tỉ lệ mà nấc này chưa bao giờ hứa là đúng.
  if (nac === 'scan') return { px: canh, spanMm: null, repeat: null, datNguong: true, lyDo: null };

  const w = pbr.uvScaleMm?.w;
  if (!(typeof w === 'number' && w > 0)) {
    return trong('chưa khai bước lặp vân (mm) nên không biết vẽ ở khổ nào');
  }

  const spanJudge = Math.min(KHUNG_JUDGE_MM, w);

  if (nac === 'judge') {
    const matDo = canh / spanJudge;
    if (matDo < MAT_DO_TOI_THIEU) {
      return {
        px: canh, spanMm: spanJudge, repeat: spanJudge / w, datNguong: false,
        lyDo: `mật độ ${matDo.toFixed(1)} px/mm, cần ${MAT_DO_TOI_THIEU} px/mm mới thấy được vân`,
      };
    }
    return { px: canh, spanMm: spanJudge, repeat: spanJudge / w, datNguong: true, lyDo: null };
  }

  const spanInspect = HE_SO_INSPECT * w;
  if (spanInspect < LAN_KHAC_KHO * spanJudge) {
    // Vật liệu lặp vân nhỏ: nấc JUDGE đã ôm trọn module rồi, INSPECT không thêm được gì.
    // Khoá lại đúng luật "nấc to phải có thứ nấc nhỏ KHÔNG THỂ có" (Hoà 16/08).
    return {
      px: canh, spanMm: null, repeat: null, datNguong: false,
      lyDo: `bước lặp ${w} mm đã nằm gọn trong nấc trước — nấc này chỉ là ảnh phóng to`,
    };
  }
  return { px: canh, spanMm: spanInspect, repeat: spanInspect / w, datNguong: true, lyDo: null };
}
