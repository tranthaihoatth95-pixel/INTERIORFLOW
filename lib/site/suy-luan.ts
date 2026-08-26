/**
 * lib/site/suy-luan.ts — SỰ THẬT → KẾT LUẬN → ĐỀ XUẤT (§3 · §4 · §22). THUẦN, TẤT ĐỊNH.
 *
 * ⛔ **KHÔNG GỌI AI Ở ĐÂY.** Mọi thứ dưới đây là luật đọc được, chạy 10 lần ra 10 kết quả giống
 *   nhau, 0 đồng, và **dẫn được về sự thật đã sinh ra nó**. Đó chính là điều một câu trả lời của
 *   mô hình không làm được — nó nghe hay hơn nhưng không truy nguồn được, và mỗi lần một khác.
 *
 * ⭐ **BA TẦNG KHÔNG ĐƯỢC LÀM PHẲNG (§3):**
 *     ① SỰ THẬT   — đo được / tra được, có nguồn.
 *     ② KẾT LUẬN  — máy suy ra, **bắt buộc khai `tuSuThat`**. Rỗng là không hợp lệ, chặn bằng máy.
 *     ③ ĐỀ XUẤT   — **KHÔNG phải sự thật dự án.** Ra đời luôn ở `cho-duyet`; chỉ một hành động của
 *                   CON NGƯỜI mới đổi được (§4). File này **không có đường nào** sinh ra `da-nhan`.
 *
 * ⭐ **LUẬT MẮT XÍCH YẾU NHẤT (`hangDanXuat`)**: phép tính tất định KHÔNG tạo thêm độ tin cậy và
 *   cũng không làm mất đi. Kết luận rút từ một sự thật `inferred` thì bản thân nó là `inferred` —
 *   dù công thức có chính xác tới đâu. Đây là chỗ độ tin cậy hay bị "rửa" lên hạng cao mà không ai
 *   để ý, nên nó được khoá bằng test.
 */

import type { HoSoDiaDiem, KetLuanSuyRa, DeXuatThietKe, ProvenanceFlag, SuThat } from './types';
import { trangThaiNang } from './solar';
import { NHAN_GIO, viPhamCFD } from './gio';
import { SO_NGUONG, dungDuocTrongSanXuat, moTaNguong } from './chinh-sach';

/* ═══════════════ HẠNG DẪN XUẤT ═══════════════ */

const THU_TU: Record<ProvenanceFlag, number> = { inferred: 0, measured: 1, verified: 2 };

/** Hạng của một giá trị dẫn xuất = hạng YẾU NHẤT trong các đầu vào. Rỗng đầu vào → `inferred`. */
export function hangDanXuat(dauVao: ProvenanceFlag[]): ProvenanceFlag {
  if (dauVao.length === 0) return 'inferred';
  return dauVao.reduce((a, b) => (THU_TU[b] < THU_TU[a] ? b : a));
}

/* ═══════════════ ĐỔ HỒ SƠ THÀNH SỰ THẬT ═══════════════ */

/**
 * Vị trí/hướng nằm ở trường riêng của `HoSoDiaDiem`, không nằm trong `suThat`. Muốn kết luận truy
 * được về chúng thì phải cho chúng một KHOÁ. Tiền tố `hoSo.` cố ý KHÔNG trùng `Mien` nào ở
 * `./anh-huong.ts` — vì đây là sự thật **sinh tại chỗ**, không phải sự thật lưu trên đĩa, nên nó
 * không bao giờ được `suThatCu()` đánh dấu là cũ (nó luôn tươi theo hồ sơ hiện hành).
 */
export function suThatTuHoSo(hoSo: HoSoDiaDiem): Record<string, SuThat<unknown>> {
  const chac = hoSo.viTri.nguoiDungXacNhan && hoSo.viTri.doChinhXac === 'cong-truong';
  const co: ProvenanceFlag = chac ? 'measured' : 'inferred';
  const ghi = chac
    ? undefined
    : `vị trí ở mức "${hoSo.viTri.doChinhXac}"${hoSo.viTri.nguoiDungXacNhan ? '' : ', người dùng CHƯA xác nhận'}`;
  const ra: Record<string, SuThat<unknown>> = {};
  const dat = (k: string, v: number | undefined) => {
    if (typeof v === 'number') ra[k] = { giaTri: v, co, ghiChu: ghi };
  };
  dat('hoSo.viDo', hoSo.viTri.viDo);
  dat('hoSo.kinhDo', hoSo.viTri.kinhDo);
  dat('hoSo.caoDoM', hoSo.viTri.caoDoM);
  // Hướng do KTS khai trên bản vẽ — khai thẳng là quan sát trực tiếp (`measured`), không kèm
  // độ chính xác vị trí; nhưng CHƯA khai thì không sinh khoá, để luật phía dưới tự im.
  if (typeof hoSo.huong.matDungChinhDeg === 'number') {
    ra['hoSo.matDungChinhDeg'] = { giaTri: hoSo.huong.matDungChinhDeg, co: 'measured' };
  }
  if (typeof hoSo.huong.bacThatDeg === 'number') {
    ra['hoSo.bacThatDeg'] = { giaTri: hoSo.huong.bacThatDeg, co: 'measured' };
  }
  return ra;
}

/** Khung giờ chiều dùng để đo "nắng chiều" — quy ước làm việc, ghi thẳng ra để không thành số ma. */
export const GIO_CHIEU: readonly number[] = [14, 15, 16, 17];

/**
 * Sự thật NẮNG — tính từ toạ độ + hướng bằng hình học tất định (`solar.ts`, thuật toán NOAA).
 * Đây là nhóm sự thật DUY NHẤT của Pha 2 chạy được **mà không cần cắm nguồn dữ liệu ngoài**,
 * vì hình học mặt trời không phải số liệu đi xin — nó tính ra từ vĩ độ, kinh độ và ngày.
 *
 * Trả `{}` khi thiếu toạ độ hoặc thiếu hướng mặt đứng — im chứ không đoán (§5).
 */
export function suThatNang(hoSo: HoSoDiaDiem, ngay: Date): Record<string, SuThat<unknown>> {
  const goc = suThatTuHoSo(hoSo);
  const viTri = goc['hoSo.viDo'];
  const matDung = goc['hoSo.matDungChinhDeg'];
  if (!viTri || !matDung) return {};

  let gocMin: number | null = null;
  let caoLucDo = 0;
  let gioLucDo = 0;
  for (const h of GIO_CHIEU) {
    const t = trangThaiNang(hoSo, ngay, h);
    if (!t || !t.tren || t.gocToiMatDungDeg === null) continue;
    if (gocMin === null || t.gocToiMatDungDeg < gocMin) {
      gocMin = t.gocToiMatDungDeg;
      caoLucDo = t.caoDoDeg;
      gioLucDo = h;
    }
  }
  if (gocMin === null) return {};

  const co = hangDanXuat([viTri.co, matDung.co]);
  const nguon = {
    tieuDe: 'Hình học mặt trời NOAA (lib/three/lighting.ts#sunFromDateTime)',
    layLuc: ngay.toISOString(),
    loai: 'tinh-toan' as const,
    pham_vi:
      hoSo.viTri.doChinhXac === 'cong-truong'
        ? ('cong-truong' as const)
        : hoSo.viTri.doChinhXac === 'thanh-pho'
          ? ('thanh-pho' as const)
          : ('vung' as const),
  };
  const ghiChu =
    co === 'inferred'
      ? 'tính đúng, nhưng đầu vào (toạ độ/hướng) chưa chắc — xác nhận vị trí thì kết quả lên hạng theo'
      : undefined;
  return {
    'nang.gocToiMatDungMinChieuDeg': { giaTri: gocMin, co, nguon, ghiChu },
    'nang.caoDoLucGocToiMinDeg': { giaTri: caoLucDo, co, nguon, ghiChu },
    'nang.gioGocToiMin': { giaTri: gioLucDo, co, nguon, ghiChu },
  };
}

/** Gộp mọi sự thật đang dùng được: đã lưu trên hồ sơ + sinh tại chỗ từ hồ sơ + nắng tính ra. */
export function gopSuThat(hoSo: HoSoDiaDiem, ngay: Date): Record<string, SuThat<unknown>> {
  return { ...hoSo.suThat, ...suThatTuHoSo(hoSo), ...suThatNang(hoSo, ngay) };
}

/* ═══════════════ KẾT LUẬN — LUÔN TRUY VỀ SỰ THẬT ═══════════════ */

/** §3B — kết luận không truy được về sự thật thì chỉ là một câu nói. Máy chặn, không nhắc suông. */
export function ketLuanHopLe(k: KetLuanSuyRa): boolean {
  return (
    Boolean(k.id.trim()) &&
    Boolean(k.tieuDe.trim()) &&
    k.tuSuThat.length > 0 &&
    k.tuSuThat.every((s) => Boolean(s.trim()))
  );
}

/** Chặt hơn: mọi khoá trong `tuSuThat` phải THỰC SỰ có mặt trong tập sự thật đang xét. */
export function ketLuanTruyDuoc(k: KetLuanSuyRa, su: Record<string, SuThat<unknown>>): boolean {
  return ketLuanHopLe(k) && k.tuSuThat.every((s) => s in su);
}

/** Cửa DUY NHẤT dựng kết luận. Trả `null` khi không hợp lệ — nơi gọi không thể lách. */
export function taoKetLuan(k: KetLuanSuyRa): KetLuanSuyRa | null {
  return ketLuanHopLe(k) ? k : null;
}

export interface LuatSuyLuan {
  id: string;
  moTa: string;
  chay(su: Record<string, SuThat<unknown>>): KetLuanSuyRa | null;
}

function so(su: Record<string, SuThat<unknown>>, k: string): number | null {
  const v = su[k];
  return v && typeof v.giaTri === 'number' ? v.giaTri : null;
}

/**
 * 🔴 NỐI 22/08 — TRƯỚC NAY CÓ **HAI BẢNG NGƯỠNG SONG SONG**, và bảng có cổng an toàn thì
 * KHÔNG nối vào đâu cả:
 *   · `NGUONG` (đây) — bảng LUẬT ĐANG DÙNG.
 *   · `SO_NGUONG` (`chinh-sach.ts:76`) — lớp CHÍNH SÁCH xếp hạng nguồn (`chuan|chinh-sach|uoc-le|
 *     chi-test`) + `dungDuocTrongSanXuat()`. `grep "from '.*chinh-sach'"` = **0 nơi import**.
 * Hệ quả đo được: `doAmCaoPc: 75` ở đây CHÍNH LÀ `khi-hau.am-cao` mà chính sách xếp `uoc-le`
 * ("chưa tra được ngưỡng ẩm nào được ban hành") ⇒ một con số **chính sách cấm ship** đang nằm
 * trong bảng luật sống. Hôm nay chưa nổ vì luật đó cần sự thật khí hậu mà **chưa có nguồn dữ liệu**
 * — tức đây là rủi ro NGỦ: ngày cắm nguồn khí hậu vào, số vô căn cứ ship im lặng.
 * Nay: giá trị nào chính sách có khai thì LẤY TỪ CHÍNH SÁCH (một số, không hai số trôi khác nhau),
 * và luật dùng nó phải qua `nguongDungDuoc()` bên dưới.
 */
export const NGUONG = {
  /** Góc tới ≤ ngưỡng này thì coi là mặt đứng hứng nắng gần trực diện (độ). */
  gocToiTrucDienDeg: 45,
  /** Cao độ mặt trời còn đủ gắt để gây chói/hấp thụ nhiệt (độ). */
  caoDoConGatDeg: 5,
  /** Độ ẩm trung bình năm từ mức này trở lên là môi trường ẩm cao (%). NGUỒN: chính sách. */
  doAmCaoPc: SO_NGUONG['khi-hau.am-cao'].giaTri,
  /** Góc gió tới mặt đứng ≤ ngưỡng này thì mặt đó quay về phía đầu gió (độ). */
  gocGioThuanDeg: 60,
} as const;

/**
 * CỔNG CHÍNH SÁCH — ngưỡng có đủ tư cách ship không. Ngưỡng KHÔNG có trong sổ chính sách thì tự do
 * (vd `gocToiTrucDienDeg` — hình học thuần, không phải con số ai đó phải ban hành).
 */
export function nguongDungDuoc(id: string): boolean {
  const n = SO_NGUONG[id];
  return n ? dungDuocTrongSanXuat(n) : true;
}

/**
 * 🔧 KHAI THẬT THAY VÌ CHẶN CỨNG — đổi hướng giữa lượt 22/08, ghi lại vì lý do đáng giữ.
 * Bản đầu tôi cho luật IM khi ngưỡng hạng `uoc-le`. Nó làm ĐỎ một test đang có
 * (`vat-ly.test.ts:194`) vốn khẳng định ca ẩm+ven-biển PHẢI chạy — và test đó ĐÚNG: bịt miệng một
 * kết luận có ích thì người dùng mất tin tức mà chẳng được gì, trong khi nguy hiểm thật nằm ở chỗ
 * NGƯỠNG TỰ ĐẶT ĐI MÀ KHÔNG AI BIẾT.
 * `KetLuanSuyRa` KHÔNG có trường độ tin ⇒ không hạ hạng bằng cấu trúc được (đổi schema là việc
 * khác, phạm vi khác). Kênh trung thực còn lại là CHÍNH LỜI GIẢI THÍCH: kết luận vẫn ra, nhưng
 * mang theo câu "ngưỡng này là quy ước, chưa có nguồn ngành, vì …".
 * ⇒ Không bịt miệng, cũng không ban phước. Người đọc thấy đủ để tự cân.
 */
export function ghiChuNguong(id: string): string {
  const n = SO_NGUONG[id];
  if (!n || dungDuocTrongSanXuat(n)) return '';
  return ` ⚠️ Ngưỡng dùng ở đây: ${moTaNguong(n)}`;
}

/**
 * ⭐ CA KINH ĐIỂN 1 — mặt đứng Tây + nắng chiều gắt ⇒ nguy cơ chói và hấp thụ nhiệt.
 * Chạy được **không cần bảng khí hậu nào** vì nó dùng hình học mặt trời. Nếu có thêm sự thật bức
 * xạ thì bức xạ được nạp vào `tuSuThat` để kết luận nặng ký hơn — nhưng không có cũng vẫn chạy.
 */
const LUAT_NANG_CHIEU: LuatSuyLuan = {
  id: 'nang-chieu-mat-dung',
  moTa: 'Mặt đứng chính hứng nắng chiều gần trực diện',
  chay(su) {
    const goc = so(su, 'nang.gocToiMatDungMinChieuDeg');
    const cao = so(su, 'nang.caoDoLucGocToiMinDeg');
    const gio = so(su, 'nang.gioGocToiMin');
    if (goc === null || cao === null || gio === null) return null;
    if (goc > NGUONG.gocToiTrucDienDeg || cao < NGUONG.caoDoConGatDeg) return null;

    const tuSuThat = ['nang.gocToiMatDungMinChieuDeg', 'nang.caoDoLucGocToiMinDeg', 'nang.gioGocToiMin'];
    let them = '';
    if ('khi-hau.buXaTbNamKwhM2Ngay' in su) {
      tuSuThat.push('khi-hau.buXaTbNamKwhM2Ngay');
      const bx = so(su, 'khi-hau.buXaTbNamKwhM2Ngay');
      if (bx !== null) them = ` Bức xạ ngang trung bình năm ${bx.toFixed(1)} kWh/m²/ngày.`;
    }
    return taoKetLuan({
      id: 'nang-chieu-mat-dung',
      tieuDe: 'Mặt đứng chính hứng nắng chiều gần trực diện',
      dienGiai:
        `Khoảng ${Math.round(gio)}h, mặt trời lệch chỉ ${Math.round(goc)}° so với pháp tuyến mặt đứng ` +
        `(ngưỡng đang dùng ${NGUONG.gocToiTrucDienDeg}°) trong khi còn cao ${Math.round(cao)}° trên chân trời. ` +
        `Nắng chiều xiên thấp và gần trực diện là tổ hợp gây CHÓI cho người trong nhà và HẤP THỤ NHIỆT ` +
        `vào lớp vỏ — nhiệt vào cuối ngày còn nhả lại vào buổi tối.${them}`,
      tuSuThat,
      mucDo: 'rui-ro',
    });
  },
};

/**
 * ⭐ CA KINH ĐIỂN 2 — độ ẩm cao + ven biển ⇒ nguy cơ ăn mòn và ẩm mốc.
 * Luật này **chỉ chạy khi có dữ liệu thật**: cần sự thật độ ẩm (từ nguồn khí hậu đã cắm) và sự
 * thật ven biển. Chưa cắm nguồn thì nó im — đúng luật thà rỗng thật.
 */
const LUAT_AM_VEN_BIEN: LuatSuyLuan = {
  id: 'am-ven-bien',
  moTa: 'Độ ẩm cao kết hợp vị trí ven biển',
  chay(su) {
    const am = so(su, 'khi-hau.doAmTbNamPc');
    const vb = su['dia-ly.venBien'];
    if (am === null || !vb || vb.giaTri !== true) return null;
    if (am < NGUONG.doAmCaoPc) return null;
    const canhBaoHang =
      vb.co === 'inferred'
        ? ' ⚠️ Dữ kiện "ven biển" mới ở hạng suy đoán — xác nhận trước khi dùng nó chọn vật liệu.'
        : '';
    return taoKetLuan({
      id: 'am-ven-bien',
      tieuDe: 'Nguy cơ ăn mòn và ẩm mốc do ẩm cao vùng ven biển',
      dienGiai:
        `Độ ẩm trung bình năm ${am.toFixed(0)}% (ngưỡng ẩm cao đang dùng ${NGUONG.doAmCaoPc}%) cộng với vị ` +
        `trí ven biển: hơi muối trong không khí đẩy nhanh ăn mòn kim loại và phụ kiện, còn ẩm kéo dài ` +
        `nuôi nấm mốc ở chân tường, mặt sau tủ và các hốc kín ít thông thoáng.${canhBaoHang}${ghiChuNguong('khi-hau.am-cao')}`,
      tuSuThat: ['khi-hau.doAmTbNamPc', 'dia-ly.venBien'],
      mucDo: 'rui-ro',
    });
  },
};

/**
 * CA 3 — mặt đứng quay về phía đầu gió thịnh hành ⇒ CƠ HỘI thông gió tự nhiên.
 * ⛔ Câu chữ ở đây bị `viPhamCFD()` soi trong test: nó chỉ được nói về **quan hệ hướng ở thang
 * vùng**, tuyệt đối không được nói về luồng khí trong phòng hay lượng gió vào nhà.
 */
const LUAT_GIO_THUAN: LuatSuyLuan = {
  id: 'gio-thuan-mat-dung',
  moTa: 'Mặt đứng chính quay về phía gió thịnh hành',
  chay(su) {
    const huong = so(su, 'gio.huongThinhHanhTuDeg');
    const matDung = so(su, 'hoSo.matDungChinhDeg');
    if (huong === null || matDung === null) return null;
    const d = Math.abs(((huong - matDung) % 360) + 360) % 360;
    const lech = d > 180 ? 360 - d : d;
    if (lech > NGUONG.gocGioThuanDeg) return null;
    return taoKetLuan({
      id: 'gio-thuan-mat-dung',
      tieuDe: 'Mặt đứng chính quay về phía đầu gió thịnh hành',
      dienGiai:
        `${NHAN_GIO} thổi tới từ khoảng ${Math.round(huong)}°, lệch ${Math.round(lech)}° so với pháp tuyến ` +
        `mặt đứng chính. Đây là quan hệ HƯỚNG ở thang vùng, đáng cân nhắc khi bố trí ô mở. ` +
        `Nó KHÔNG nói được lượng gió thực tế đi vào từng phòng — muốn biết điều đó phải khảo sát hoặc ` +
        `tính trên hình học thật, IF không đưa ra con số đó.`,
      tuSuThat: ['gio.huongThinhHanhTuDeg', 'hoSo.matDungChinhDeg'],
      mucDo: 'co-hoi',
    });
  },
};

export const LUAT: LuatSuyLuan[] = [LUAT_NANG_CHIEU, LUAT_AM_VEN_BIEN, LUAT_GIO_THUAN];

/**
 * Chạy toàn bộ luật trên tập sự thật. Kết luận không truy được về sự thật đang có bị LOẠI —
 * không phải cảnh báo, mà loại thẳng: một kết luận treo lơ lửng còn hại hơn không có kết luận.
 */
export function suyLuan(su: Record<string, SuThat<unknown>>): KetLuanSuyRa[] {
  const ra: KetLuanSuyRa[] = [];
  for (const l of LUAT) {
    const k = l.chay(su);
    if (k && ketLuanTruyDuoc(k, su)) ra.push(k);
  }
  return ra;
}

/** Đường ngắn: từ hồ sơ dự án ra thẳng kết luận. */
export function suyLuanTuHoSo(hoSo: HoSoDiaDiem, ngay: Date): KetLuanSuyRa[] {
  return suyLuan(gopSuThat(hoSo, ngay));
}

/* ═══════════════ ĐỀ XUẤT — RA ĐỜI LUÔN LÀ `cho-duyet` (§4) ═══════════════ */

/**
 * Cửa DUY NHẤT sinh đề xuất. **Không có tham số `trangThai`** — máy không có cách nào tự nhận,
 * kể cả khi ai đó rất muốn. Muốn `da-nhan` thì phải đi qua `apQuyetDinh()` ở `./types` và phải
 * có tên một CON NGƯỜI. Trả `null` khi không dẫn về kết luận nào.
 */
export function taoDeXuat(p: {
  id: string;
  tieuDe: string;
  dienGiai: string;
  tuKetLuan: string[];
}): DeXuatThietKe | null {
  if (!p.id.trim() || !p.tieuDe.trim() || p.tuKetLuan.length === 0) return null;
  return { ...p, trangThai: 'cho-duyet' };
}

/** Hướng xử lý gợi ý theo từng kết luận. Chữ nghề, cố ý KHÔNG kèm con số — số phải có nguồn. */
const HUONG_XU_LY: Record<string, { tieuDe: string; dienGiai: string }> = {
  'nang-chieu-mat-dung': {
    tieuDe: 'Chắn nắng cho mặt đứng hứng nắng chiều',
    dienGiai:
      'Cân nhắc lớp chắn đứng (lam dọc, chớp, cây leo) vì nắng chiều xiên thấp — ô văng ngang gần như ' +
      'không cản được góc này. Kèm theo: chọn kính có hệ số hấp thụ nhiệt thấp cho các ô mở phía đó, ' +
      'và tránh đặt chỗ ngồi lâu ngay sát mặt đứng ấy.',
  },
  'am-ven-bien': {
    tieuDe: 'Chọn vật liệu và phụ kiện chịu được ẩm mặn',
    dienGiai:
      'Cân nhắc phụ kiện kim loại chống ăn mòn cho phần phơi ra ngoài, xử lý chống ẩm chân tường, và ' +
      'chừa khe thông thoáng sau tủ/vách áp tường để hốc kín không thành ổ mốc.',
  },
  'gio-thuan-mat-dung': {
    tieuDe: 'Tận dụng hướng gió khi bố trí ô mở',
    dienGiai:
      'Cân nhắc đặt ô mở lấy gió ở mặt đứng này khi bố trí mặt bằng. Đây là gợi ý theo HƯỚNG ở thang ' +
      'vùng; hiệu quả thực tế còn phụ thuộc vật cản quanh nhà, cần khảo sát tại chỗ.',
  },
};

/** Sinh đề xuất từ danh sách kết luận. Kết luận lạ (chưa có hướng xử lý) thì bỏ qua, không bịa. */
export function deXuatTuKetLuan(ks: KetLuanSuyRa[]): DeXuatThietKe[] {
  const ra: DeXuatThietKe[] = [];
  for (const k of ks) {
    const h = HUONG_XU_LY[k.id];
    if (!h) continue;
    const d = taoDeXuat({ id: `dx-${k.id}`, tieuDe: h.tieuDe, dienGiai: h.dienGiai, tuKetLuan: [k.id] });
    if (d) ra.push(d);
  }
  return ra;
}

/** Máy canh nói quá về gió — soi mọi chữ mà kết luận/đề xuất sẽ đưa ra trước mắt người dùng. */
export function viPhamNoiQua(x: { tieuDe: string; dienGiai: string }): string[] {
  return [...viPhamCFD(x.tieuDe), ...viPhamCFD(x.dienGiai)];
}
