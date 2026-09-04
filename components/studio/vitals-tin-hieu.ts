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

/** Mã miền tri thức của Ngữ cảnh dự án — cùng bộ với `lib/site/anh-huong.ts#Mien`. */
export type MaMien =
  | 'nang' | 'khi-hau' | 'gio' | 'dia-ly'
  | 'vat-lieu' | 'thu-cong' | 'kien-truc' | 'van-hoa' | 'do-thi';

/** Mã miền → chữ người đọc. HẰNG SỐ — nguồn duy nhất của chữ, không nhận từ ngoài vào. */
export const TEN_MIEN: Record<MaMien, string> = {
  nang: 'Phân tích nắng',
  'khi-hau': 'Dữ liệu khí hậu',
  gio: 'Phân tích gió',
  'dia-ly': 'Bối cảnh địa lý',
  'vat-lieu': 'Bằng chứng vật liệu',
  'thu-cong': 'Bằng chứng thủ công',
  'kien-truc': 'Bằng chứng kiến trúc',
  'van-hoa': 'Bằng chứng văn hoá',
  'do-thi': 'Bối cảnh đô thị',
};

export type LoaiTinHieu = 'dang-chay' | 'chay-loi' | 'chuan-ve' | 'dia-diem' | 'demo-flow';

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
  /**
   * Miền bị ảnh hưởng — CHỈ tín hiệu `dia-diem` có. Nơi vẽ dùng nó để đi tới ĐÚNG chỗ
   * (Ngữ cảnh dự án → hướng/nắng) và để gọi tính lại đúng miền, thay vì mở một trang chung.
   */
  mien?: readonly MaMien[];
}

/**
 * Câu giải thích theo LOẠI. Ngắn, nói cơ chế, không phán xét — mẫu Hoà đưa:
 * *"Kích thước suy từ phối cảnh."* · *"2D và 3D không khớp."* · *"Bản sửa nguồn đã đổi."*
 */
export const VI_SAO: Record<LoaiTinHieu, string> = {
  'dang-chay': 'Việc đang chạy trong hàng đợi.',
  'chay-loi': 'Lượt chạy dừng giữa chừng.',
  'dia-diem': 'Sự thật địa điểm đã đổi, phân tích suy ra từ nó không còn khớp.',
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
   * NGỮ CẢNH DỰ ÁN — số phân tích đã CŨ vì sự thật địa điểm đổi (`HoSoDiaDiem.daCu`).
   * `undefined` = chưa đọc được hồ sơ (chưa mở dự án · fetch chưa xong) ⇒ **im**, không phải 0.
   * ⛔ Con số này PHẢI đến từ trạng thái miền đã ghi xuống hồ sơ — cấm suy từ state giao diện.
   */
  diaDiemCanXem?: number;
  /**
   * Mã miền bị ảnh hưởng. **UNION CHỮ CHẾT, cố ý KHÔNG phải `string[]`**: nguồn tín hiệu không
   * được nhận chữ tự do, nếu không đây thành cửa sau cho một câu AI sinh lọt lên khẩu độ
   * (đúng thứ mục [7] của test canh). Chữ hiển thị do CHÍNH module này dịch qua `TEN_MIEN`.
   */
  diaDiemMien?: readonly MaMien[];
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
export const THU_TU: LoaiTinHieu[] = ['dang-chay', 'chay-loi', 'chuan-ve', 'dia-diem', 'demo-flow'];

function dung(n: NguonTinHieu, loai: LoaiTinHieu): TinHieu | null {
  if (loai === 'dia-diem') {
    // `undefined` (chưa đọc được hồ sơ) và `0` (đã đọc, không có gì cũ) ĐỀU im — nhưng vì hai lý
    // do khác nhau; giữ phân biệt đó ở kiểu để không ai gộp thành `?? 0`.
    if (!(n.diaDiemCanXem && n.diaDiemCanXem > 0)) return null;
    return {
      loai,
      so: n.diaDiemCanXem,
      nhan: `${n.diaDiemCanXem} phân tích cần cập nhật`,
      chiTiet: n.diaDiemMien?.map((m) => TEN_MIEN[m]).join(' · '),
      viSao: VI_SAO['dia-diem'],
      mien: n.diaDiemMien,
    };
  }

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
 * demo chưa xong hết không phải một lỗi cần nhấp nháy đỏ.
 *
 * 🔴 ĐÍNH CHÍNH 28/08 (lane UX bắt được, ký hiệu X-12): câu cũ ghi *"Chỉ HAI loại thật sự CẦN XEM
 * ('chay-loi'/'chuan-ve')"* — mã kéo **BA**: `chay-loi` · `chuan-ve` · **`dia-diem`**. Lệch chú
 * thích ↔ mã nằm đúng trong hàm quyết định sắc của lõi Vitals, tức chỗ người đọc tin chú thích
 * nhất. `dia-diem` (sự thật địa điểm đã cũ) ĐÚNG là loại cần xem — mã đúng, chữ sai. */
export function trangThaiAmbient(tinHieu: TinHieu[]): 'idle' | 'answering' | 'alert' {
  if (tinHieu.some((t) => t.loai === 'dang-chay')) return 'answering';
  if (tinHieu.some((t) => t.loai === 'chay-loi' || t.loai === 'chuan-ve' || t.loai === 'dia-diem')) return 'alert';
  return 'idle';
}

/* ═══════════════ NHÃN KHẨU ĐỘ — P0 `L2-03`, sửa 28/08 ═══════════════
 *
 * ⚠️ Lane `IF-UXUI-RUNTIME-001` đo trên app thật và tìm ra một lời nói dối ĐỐI XỨNG:
 * nút Vitals đọc `aria-label="Vitals — không có tín hiệu"` **kể cả khi đã đăng nhập, có dữ liệu,
 * mọi API trả 200** — và cùng lúc DOM ghi `data-vitals-state="calm"`. Hai bề mặt của một nút
 * nói hai chuyện khác nhau: trình đọc màn hình nghe "không có tín hiệu", máy kiểm đọc "calm".
 *
 * Gốc: `idle` gộp HAI thứ khác hẳn nhau —
 *   ① **đã đo, không có gì cần xem**  ⇒ đúng là "yên"
 *   ② **chưa/không đo được** (401 · mất mạng · chưa mở dự án) ⇒ **KHÔNG BIẾT**
 * Chính tệp này đã đặt luật phân biệt `undefined` ↔ `0` ở tầng TỪNG TÍN HIỆU (docstring đầu tệp,
 * *"nhập chúng làm một là mở đường cho câu 'bản vẽ không có lỗi'"*) — nhưng ở tầng NHÃN thì lại
 * gộp. Luật đúng, thi hành sót một tầng.
 *
 * ⛔ Và đây là chỗ nguy hiểm hơn cả hai: nói "không có tín hiệu" khi thật ra **không hỏi được**
 * là bảo người dùng *"mọi thứ ổn"* trên một tiền đề đã chết — đúng bệnh **F-02 (calm giả)**.
 *
 * ⇒ Nhãn và `data-vitals-state` nay sinh ra từ **MỘT hàm duy nhất**. Không phải vì gọn, mà vì
 * hai bề mặt tính riêng thì chúng sẽ lệch — và chúng đã lệch.
 */

export type MucKhauDo = 'yen' | 'dang-chay' | 'can-xem' | 'khong-biet';

/**
 * `daDoDuoc = false` ⇒ **KHÔNG BIẾT**, và nó THẮNG mọi thứ khác: không đo được thì cái "yên"
 * kia không có căn cứ nào. Đang chạy thì vẫn là đang chạy (ta thấy nó chạy, đó là một phép đo).
 */
export function mucKhauDo(
  trangThai: 'idle' | 'answering' | 'alert',
  daDoDuoc: boolean,
): MucKhauDo {
  if (trangThai === 'answering') return 'dang-chay';
  if (trangThai === 'alert') return 'can-xem';
  return daDoDuoc ? 'yen' : 'khong-biet';
}

/** Nhãn người đọc — song ngữ. Bốn mức, bốn câu KHÁC NHAU. */
export function nhanKhauDo(muc: MucKhauDo, en: boolean): string {
  switch (muc) {
    case 'dang-chay': return en ? 'running' : 'đang chạy';
    case 'can-xem': return en ? 'needs attention' : 'có việc cần xem';
    case 'yen': return en ? 'all clear' : 'không có gì cần xem';
    // Cố ý KHÔNG nói "không có tín hiệu": đó là câu khẳng định về thế giới, mà ta chưa nhìn thấy
    // thế giới. Câu đúng phải nói về CHÍNH TA.
    case 'khong-biet': return en ? 'not measured yet' : 'chưa đo được';
  }
}

/** Giá trị cho `data-vitals-state` — sinh từ CÙNG `muc`, nên DOM không thể lệch với nhãn. */
export function domKhauDo(muc: MucKhauDo): 'calm' | 'attention' | 'running' | 'unknown' {
  return muc === 'can-xem' ? 'attention' : muc === 'dang-chay' ? 'running' : muc === 'yen' ? 'calm' : 'unknown';
}

/* ═══════════════ CHẶNG CỦA VITALS — sửa một lời nói dối, 04/09 ═══════════════
 *
 * 🔴 CA THẬT: ảnh chụp app ngày 04/09 cho thấy đứng ở **Trang chủ** mà tấm chat Vitals ghi
 * *"VITALS · THIẾT KẾ 3D"*. Gốc bệnh đo được, và nó KHÔNG nằm ở nơi vẽ:
 *   · `AppChrome` truyền `activeToPhase(active)` (`lib/studio/stage-nav.ts:18-23`);
 *   · hàm đó map `cad→concept · photo→render · present→present`, **còn lại rơi vào
 *     `return 'render'`**;
 *   · mà `/files` · `/library` · `/materials` · `/tasks` · `/settings` · `/inspiration` đều bọc
 *     `<AppShell active="render">` (kiểm bằng `grep "<AppShell"`).
 *   ⇒ SÁU màn không thuộc chặng nào tự khai mình là chặng Thiết kế 3D. Không chỉ sai nhãn: nó
 *     còn khiến backend chọn system prompt của chặng 3D cho một câu hỏi hỏi từ màn Files.
 *
 * ⛔ VÌ SAO KHÔNG SỬA BẰNG `active`: `active` KHÔNG phân biệt được `/projects/<id>/render` (chặng
 * 3D thật) với `/files` — cả hai đều `'render'`. Thứ duy nhất phân biệt được là ĐƯỜNG DẪN.
 *
 * ⚠️ Kiểu `Phase` chỉ có 3 giá trị nên nó KHÔNG diễn đạt nổi *"đang không ở chặng nào"*. Dùng
 * `'gallery'` — mã đã có sẵn và đúng nghĩa ở `lib/ai/chat-assist.ts#ChatStage` ("người dùng đang
 * ở Gallery/chọn dự án"). KHÔNG đẻ mã mới.
 */

/** Chặng mà tấm chat Vitals tự khai. `'gallery'` = **không thuộc chặng nào**, không phải một chặng. */
export type VitalsStage = 'concept' | 'render' | 'present' | 'gallery';

/** Các route thật sự LÀ một chặng thiết kế. Ngoài danh sách này, mọi màn đều là `'gallery'`. */
export function changTheoDuong(duong: string | null | undefined): VitalsStage {
  const d = duong ?? '';
  const m = /^\/projects\/[^/]+\/(cad|render|present|photo)(?:\/|$)/.exec(d);
  if (m) return m[1] === 'cad' ? 'concept' : m[1] === 'photo' ? 'render' : (m[1] as VitalsStage);
  // Hai route soạn thảo đứng riêng (không nằm dưới `/projects/<id>`) — vẫn là chặng thật.
  if (d === '/cad-editor' || d.startsWith('/cad-editor/')) return 'concept';
  if (d === '/present-editor' || d.startsWith('/present-editor/')) return 'present';
  return 'gallery';
}
