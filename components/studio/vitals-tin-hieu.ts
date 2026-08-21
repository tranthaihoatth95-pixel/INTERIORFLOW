/**
 * components/studio/vitals-tin-hieu.ts — LÕI THUẦN chọn tín hiệu cho khẩu độ Vitals.
 * Chạy test: `node_modules/.bin/sucrase-node components/studio/vitals-tin-hieu.test.ts`
 *
 * VÌ SAO TÁCH RA KHỎI COMPONENT: câu hỏi đắt nhất của mức Peek không phải "vẽ thế nào" mà
 * "được phép nói gì". Luật của phiếu: **chỉ dùng dữ liệu thật; không có dữ liệu thì KHÔNG hiện
 * tín hiệu đó**. Đặt luật ấy trong JSX là không khoá được — đặt ở đây thì test khoá được, và
 * `chonTinHieu([])` trả `[]` trở thành một khẳng định máy canh, không phải lời hứa trong docstring.
 *
 * BA NGUỒN SỰ THẬT, tất cả đã tồn tại từ trước — file này KHÔNG đẻ nguồn nào mới:
 *   ① `useFlowStore.flowRuns`  — hàng đợi chạy DUY NHẤT của app (lib/execution.ts, chốt 2.2.86).
 *   ② cùng mảng đó, nhánh `status==='error'`.
 *   ③ `topViolations(doc)` (lib/ai/violations-context.ts) — mặt tiền của bộ kiểm quy chuẩn
 *      tất định `lib/cad/standards/checker.ts`. Kiểm chuẩn là việc của MÁY, không của AI
 *      (00-CHOT 15/08, Hoà duyệt) ⇒ tín hiệu này 0 đồng, chạy 10 lần ra 10 kết quả giống nhau.
 *
 * ⛔ KHÔNG có "insight AI" ở đây, và cố ý không có chỗ để cắm vào: mọi trường đầu vào đều là
 * SỐ ĐẾM lấy từ trạng thái đang có. Vitals = "tôi nên biết gì" (thường trực, im); toast/action
 * strip = "vừa xảy ra gì" (thoáng qua) — hai thứ khác nhau, không nhập.
 *
 * ⚠️ PHÂN BIỆT `undefined` ↔ `0` — đây là chỗ dễ hỏng nhất và là lý do trường ③ optional:
 *   `undefined` = CHƯA/KHÔNG ĐO ĐƯỢC (không mở bản vẽ nào · bản vẽ quá nặng nên bỏ kiểm theo
 *                 ngưỡng `MAX_ROOMS_FOR_AREA` sẵn có · bộ kiểm ném lỗi)
 *   `0`         = ĐÃ ĐO, không thấy mục nào
 *   Cả hai đều KHÔNG hiện dòng nào — nhưng nhập chúng làm một là mở đường cho câu
 *   "bản vẽ không có lỗi", thứ `violationsPromptBlock` đã cấm bằng chữ vì "0 vi phạm" ≠ "đạt chuẩn".
 */

/** Trần số tín hiệu ở mức Peek. Phiếu chốt 1-3: quá 3 thì nó thôi là khẩu độ, thành bảng điều
 * khiển — mà bảng điều khiển đã có chỗ ngồi riêng (Dashboard, ReviewPanel, hàng đợi render). */
export const TRAN_TIN_HIEU = 3;

export type LoaiTinHieu = 'dang-chay' | 'chay-loi' | 'chuan-ve' | 'demo-flow';

export interface TinHieu {
  loai: LoaiTinHieu;
  /** Câu người đọc thấy. Luôn mang SỐ THẬT — không có câu chung chung kiểu "có vài việc". */
  nhan: string;
  /** Con số nguyên bản, để nơi vẽ hiện badge mà không phải bóc chữ ra khỏi `nhan`. */
  so: number;
  /** Dòng phụ (vd tên lượt chạy). Bỏ trống khi nguồn không cho biết — không bịa. */
  chiTiet?: string;
  /**
   * ⭐ VÌ SAO BỊ GẮN CỜ — một câu ngắn trả lời đúng câu hỏi người dùng hỏi khi thấy một dấu
   * cảnh báo: *"tại sao?"*. Cố ý là HẰNG SỐ theo loại tín hiệu, không phải chữ tự do: nguồn
   * duy nhất của nó là bảng dưới đây, nên không có cửa nào cho một câu AI sinh lọt vào.
   */
  viSao: string;
}

/**
 * Câu giải thích theo LOẠI. Ngắn, nói cơ chế, không phán xét — mẫu Hoà đưa:
 * *"Kích thước suy từ phối cảnh."* · *"2D và 3D không khớp."* · *"Bản sửa nguồn đã đổi."*
 */
export const VI_SAO: Record<LoaiTinHieu, string> = {
  'dang-chay': 'Việc đang chạy trong hàng đợi.',
  'chay-loi': 'Lượt chạy dừng giữa chừng.',
  'chuan-ve': 'Bộ kiểm quy chuẩn đo được sai lệch trên bản vẽ đang mở.',
  'demo-flow': 'Chế độ hiển thị Demo đang bật — xem tiến độ ở chuông Hoạt động.',
};

export interface NguonTinHieu {
  /** `flowRuns` đang `queued` hoặc `running`. */
  dangChay: number;
  /** Nhãn lượt chạy đầu tiên đang chạy — `FlowRun.label`, chốt lúc xếp hàng. */
  nhanDangChay?: string;
  /** `flowRuns` đã kết thúc ở trạng thái `error`. */
  chayLoi: number;
  /**
   * Số mục `error` + `warning` của bộ kiểm quy chuẩn trên bản vẽ ĐANG MỞ.
   * `undefined` = chưa/không đo được (xem docstring đầu file). CỐ Ý optional.
   */
  chuanCanXem?: number;
  /**
   * Chế độ hiển thị Demo (`lib/studio/demo-spine.ts`) — số bước ĐÃ XONG / TỔNG số bước có thể
   * xong, đọc thẳng từ `tomTatSpine()`. Cả hai optional CÙNG LÚC = "demo mode đang tắt/không có
   * gì để nói" ⇒ im, đúng luật "không đo không nói" — không tách `undefined` khỏi `demoTong`
   * vì hai số này LUÔN đi cùng nhau (không có ca "biết mẫu số mà không biết tử số").
   */
  demoXong?: number;
  demoTong?: number;
}

/** Nặng → nhẹ. "Đang chạy" đứng trước vì nó nói về việc CÒN ĐANG DIỄN RA (người dùng có thể
 * phải chờ); "chuẩn vẽ" nói về việc đã xong/đứng yên, xem lúc nào cũng được. "Demo flow" nhẹ
 * nhất — nó là TIẾN ĐỘ trình bày, không phải cảnh báo, chỉ đáng nói khi không có gì nặng hơn. */
const THU_TU: LoaiTinHieu[] = ['dang-chay', 'chay-loi', 'chuan-ve', 'demo-flow'];

function dung(n: NguonTinHieu, loai: LoaiTinHieu): TinHieu | null {
  if (loai === 'dang-chay') {
    if (!(n.dangChay > 0)) return null;
    return {
      loai,
      so: n.dangChay,
      nhan: `${n.dangChay} lượt đang chạy`,
      viSao: VI_SAO['dang-chay'],
      // Chỉ kèm khi nguồn thật sự có nhãn; chuỗi rỗng cũng coi như không có.
      ...(n.nhanDangChay ? { chiTiet: n.nhanDangChay } : {}),
    };
  }
  if (loai === 'chay-loi') {
    if (!(n.chayLoi > 0)) return null;
    return { loai, so: n.chayLoi, nhan: `${n.chayLoi} lượt chạy lỗi`, viSao: VI_SAO['chay-loi'] };
  }
  if (loai === 'chuan-ve') {
    // `undefined` (chưa đo) và `0` (đo rồi, sạch) đều KHÔNG ra dòng.
    if (typeof n.chuanCanXem !== 'number' || !(n.chuanCanXem > 0)) return null;
    return {
      loai,
      so: n.chuanCanXem,
      nhan: `${n.chuanCanXem} mục quy chuẩn cần xem`,
      viSao: VI_SAO['chuan-ve'],
    };
  }
  // 'demo-flow' — cần CẢ HAI số (demo mode đang bật) VÀ chưa xong hết (đã xong hết thì không có
  // gì để "xem tiến độ" nữa, giữ Vitals im theo đúng luật không nói điều không đáng nói).
  if (typeof n.demoXong !== 'number' || typeof n.demoTong !== 'number' || n.demoTong <= 0) return null;
  if (n.demoXong >= n.demoTong) return null;
  return {
    loai,
    so: n.demoXong,
    nhan: `Demo flow · ${n.demoXong}/${n.demoTong} sẵn sàng`,
    viSao: VI_SAO['demo-flow'],
  };
}

/**
 * Chọn tối đa `TRAN_TIN_HIEU` tín hiệu THẬT, theo thứ tự ưu tiên cố định.
 * Không nguồn nào có gì ⇒ `[]` ⇒ nơi vẽ KHÔNG hiện dòng tín hiệu nào. Đó là kết quả ĐÚNG,
 * không phải trạng thái lỗi cần lấp chỗ trống.
 */
export function chonTinHieu(nguon: NguonTinHieu): TinHieu[] {
  const ra: TinHieu[] = [];
  for (const loai of THU_TU) {
    const t = dung(nguon, loai);
    if (t) ra.push(t);
    if (ra.length >= TRAN_TIN_HIEU) break;
  }
  return ra;
}

/** Trạng thái chấm ambient — ánh xạ sang đúng bộ `VitalsState` SẴN CÓ (VitalsStateBadge.tsx),
 * KHÔNG đẻ bảng trạng thái thứ hai. Đang chạy → 'answering' (nhịp nhanh) · có việc cần xem →
 * 'alert' · còn lại → 'idle' (thở chậm, im).
 * ⚠️ 'demo-flow' CỐ Ý không kéo chấm sang 'alert': nó là TIẾN ĐỘ trình bày, không phải cảnh báo —
 * demo chưa xong hết không phải một lỗi cần nhấp nháy đỏ. Chỉ hai loại thật sự CẦN XEM
 * ('chay-loi'/'chuan-ve') mới kéo ambient sang alert. */
export function trangThaiAmbient(tinHieu: TinHieu[]): 'idle' | 'answering' | 'alert' {
  if (tinHieu.some((t) => t.loai === 'dang-chay')) return 'answering';
  if (tinHieu.some((t) => t.loai === 'chay-loi' || t.loai === 'chuan-ve')) return 'alert';
  return 'idle';
}
