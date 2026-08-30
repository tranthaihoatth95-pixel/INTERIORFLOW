/**
 * lib/cad/chuan-nap.ts — CHUẨN NẠP: máy tự chấm một lượt nhập DXF ĐẠT hay KHÔNG ĐẠT.
 *
 * ══ VÌ SAO CÓ TỆP NÀY ══
 * Hoà, 30/08/2026, bắt đúng một chỗ lười:
 *
 *   *"tôi cần bạn định nghĩa lại phần phụ thuộc — duyệt mắt. Những gì liên quan đến thẩm mỹ, logic
 *   hiển thị ra sơ đồ thì duyệt mắt. Một bản vẽ DXF biết bao nhiêu là nét, làm sao biết được nét
 *   nào đúng nét nào sai? Chi tiết nào thiếu? Dựng 1 chuẩn nạp đi chứ — nạp cái gì vào mà không
 *   biết nó đạt tiêu chuẩn hay chưa, phải dựa vào mắt người, thì hệ thống đó vứt."*
 *
 * Sổ việc BOS trước đó đánh dấu "đường nạp DXF" là **duyệt mắt**. Sai. Mắt người **không thể**
 * biết trong 12.274 nét thì nét nào rơi mất — mắt chỉ thấy "có hình" hay "không hình".
 * ⇒ Ranh giới đúng, nay là luật:
 *     **DUYỆT MẮT** chỉ dành cho **thẩm mỹ** và **logic hiển thị** — bố cục, tỉ lệ, màu, thứ bậc
 *     thị giác, thứ máy không đo được.
 *     **BẢO TOÀN DỮ LIỆU** thì **máy chấm**, luôn luôn. Không có ngoại lệ.
 *
 * ══ ĐIỀU LÀM CHUẨN NÀY KHÔNG VÔ NGHĨA ══
 * Đếm bằng **PHƯƠNG PHÁP KHÁC** với bộ đọc. Nếu dùng chính `parseDxfEx` để kiểm `parseDxfEx` thì
 * nó luôn khớp — một phép đo tự soi mình là phép đo rỗng. Đây đúng bài học **M-59** đã trả giá:
 * phép so trước↔sau chỉ bắt được lỗi mà BƯỚC ĐÓ THÊM VÀO; lỗi có ở CẢ HAI đầu thì nó mù.
 *
 * Nên `demTho()` dưới đây đọc DXF như **văn bản thô**, theo đúng đặc tả định dạng: trong mục
 * `ENTITIES`, mỗi thực thể mở đầu bằng cặp dòng `0` rồi tên loại. Không dùng một dòng nào của
 * `dxf.ts`. Hai bên đếm độc lập rồi mới đối chiếu.
 *
 * ══ NĂM TIÊU CHÍ — mỗi tiêu chí trả lời một câu Hoà hỏi ══
 *   ① BẢO TOÀN SỐ LƯỢNG   "nét nào thiếu?"      — tổng thực thể đọc được = tổng có trong tệp
 *   ② BẢO TOÀN TỪNG LOẠI  "nét nào sai?"        — LINE/ARC/CIRCLE… khớp từng loại, không bù trừ
 *   ③ BẢO TOÀN LỚP        "chi tiết nào mất?"   — mọi lớp trong tệp đều có mặt
 *   ④ KHÔNG BỊA           "có gì thừa ra?"      — không sinh ra loại thực thể tệp không có
 *   ⑤ IM LẶNG BỊ CẤM      "bỏ qua mà không nói?" — thứ không đọc được PHẢI nằm trong `skipped`
 *
 * ⑤ là tiêu chí quan trọng nhất và dễ bỏ sót nhất: một bộ đọc **bỏ qua trong im lặng** thì tiêu
 * chí ① vẫn có thể xanh nếu nó bỏ qua ở cả hai phía. Bỏ sót có KHAI BÁO là chấp nhận được;
 * bỏ sót IM LẶNG thì không.
 */

/** Loại thực thể DXF mà bộ đọc của app có xử lý. Ngoài danh sách này thì phải nằm ở `skipped`. */
const LOAI_DOC_DUOC = new Set([
  'LINE', 'LWPOLYLINE', 'POLYLINE', 'ARC', 'CIRCLE', 'ELLIPSE', 'SPLINE',
  'TEXT', 'MTEXT', 'INSERT', 'HATCH', 'DIMENSION', 'POINT', 'SOLID', '3DFACE',
]);

export interface DemTho {
  tong: number;
  theoLoai: Record<string, number>;
  lop: string[];
}

/**
 * Đếm THÔ từ văn bản DXF — **không dùng bộ đọc của app**.
 *
 * Cách đọc theo đặc tả DXF: tệp là chuỗi cặp (mã nhóm, giá trị) trên hai dòng liên tiếp.
 * Trong `SECTION`/`ENTITIES`, mỗi thực thể mở đầu bằng mã `0` + tên loại ở dòng kế.
 * Tên lớp của thực thể nằm ở mã `8`.
 *
 * ⚠️ Cố ý CHỈ đếm trong mục ENTITIES: thực thể bên trong `BLOCKS` là ĐỊNH NGHĨA, chưa được đặt
 * xuống bản vẽ — đếm chúng vào tổng là tự tạo ra chênh lệch giả.
 */
export function demTho(text: string): DemTho {
  const d = text.split(/\r?\n/).map((s) => s.trim());
  const theoLoai: Record<string, number> = {};
  const lop = new Set<string>();
  let trongEntities = false;
  let loaiHienTai: string | null = null;

  for (let i = 0; i + 1 < d.length; i += 2) {
    const ma = d[i];
    const gt = d[i + 1];

    if (ma === '2' && gt === 'ENTITIES') { trongEntities = true; continue; }
    if (ma === '0' && gt === 'ENDSEC' && trongEntities) { trongEntities = false; loaiHienTai = null; continue; }
    if (!trongEntities) continue;

    if (ma === '0') {
      loaiHienTai = gt;
      if (gt !== 'ENDSEC' && gt !== 'SEQEND') theoLoai[gt] = (theoLoai[gt] ?? 0) + 1;
      continue;
    }
    /* Mã 8 = tên lớp. Chỉ nhận khi đang ở trong một thực thể, không phải trong phần đầu mục. */
    if (ma === '8' && loaiHienTai && gt) lop.add(gt);
  }

  const tong = Object.entries(theoLoai)
    .filter(([k]) => k !== 'VERTEX') // VERTEX là đỉnh CON của POLYLINE, không phải thực thể riêng
    .reduce((a, [, v]) => a + v, 0);

  return { tong, theoLoai, lop: [...lop].sort() };
}

/**
 * Đưa tên loại của HAI PHÍA về cùng một hệ trước khi so.
 *
 * ⚠️ SỬA NGAY LƯỢT CHẠY ĐẦU — chuẩn báo 0/54 tệp đạt, và thủ phạm là CHÍNH CHUẨN, không phải bộ
 * đọc: tệp DXF ghi `LINE` `LWPOLYLINE` (đặc tả dùng chữ HOA), bộ đọc của app trả `line` `polyline`.
 * So thẳng thì không bao giờ khớp, và chuẩn sẽ tố oan bộ đọc "bịa ra loại tệp không có".
 * Bài học: một chuẩn mới dựng phải nghi NGỜ CHÍNH NÓ trước khi kết tội thứ nó đo.
 */
const DONG_NGHIA: Record<string, string> = {
  LWPOLYLINE: 'polyline', POLYLINE: 'polyline', '3DFACE': 'solid',
};
const chuan = (t: string) => (DONG_NGHIA[t] ?? t).toLowerCase();

export interface TieuChi { ma: string; ten: string; dat: boolean; do: string; }
export interface KetQuaChuan { dat: boolean; tieuChi: TieuChi[]; }

/** Kiểu tối thiểu cần từ `DxfLoadReport` — cố ý KHÔNG import `dxf.ts` để chuẩn không dính bộ đọc. */
export interface BaoCaoToiThieu {
  entitiesRead?: Record<string, number>;
  skipped?: Record<string, number>;
}

/**
 * Chấm một lượt nạp.
 * @param tho     kết quả `demTho()` trên chính văn bản đã nạp
 * @param baoCao  `report` do bộ đọc trả về
 * @param soLop   số lớp bộ đọc dựng được (`doc.layers.length`)
 */
export function chamChuanNap(tho: DemTho, baoCao: BaoCaoToiThieu, soLop: number): KetQuaChuan {
  const doc = baoCao.entitiesRead ?? {};
  const bo = baoCao.skipped ?? {};
  const tongDoc = Object.values(doc).reduce((a, b) => a + b, 0);
  const tongBo = Object.values(bo).reduce((a, b) => a + b, 0);

  /* ① + ⑤ đi cặp: đọc được CỘNG bỏ qua CÓ KHAI phải bằng tổng có thật trong tệp. */
  const tc: TieuChi[] = [];
  tc.push({
    ma: 'so-luong', ten: 'Bảo toàn số lượng',
    dat: tongDoc + tongBo === tho.tong,
    do: `tệp ${tho.tong} · đọc ${tongDoc} · bỏ qua có khai ${tongBo} ⇒ chênh ${tho.tong - tongDoc - tongBo}`,
  });

  /* Gộp theo tên đã chuẩn hoá — `LWPOLYLINE` và `POLYLINE` cùng đổ về `polyline`, nên phải cộng
     hai bên rồi mới so, không so từng dòng thô. */
  const thoChuan: Record<string, number> = {};
  for (const [k, n] of Object.entries(tho.theoLoai)) {
    if (k === 'VERTEX' || k === 'SEQEND') continue;
    thoChuan[chuan(k)] = (thoChuan[chuan(k)] ?? 0) + n;
  }
  const nhanChuan: Record<string, number> = {};
  for (const [k, n] of Object.entries(doc)) nhanChuan[chuan(k)] = (nhanChuan[chuan(k)] ?? 0) + n;
  for (const [k, n] of Object.entries(bo)) nhanChuan[chuan(k)] = (nhanChuan[chuan(k)] ?? 0) + n;

  const lechLoai: string[] = [];
  for (const [loai, n] of Object.entries(thoChuan)) {
    const co = nhanChuan[loai] ?? 0;
    if (co !== n) lechLoai.push(`${loai}: tệp ${n} ≠ nhận ${co}`);
  }
  tc.push({
    ma: 'tung-loai', ten: 'Bảo toàn từng loại',
    dat: lechLoai.length === 0,
    do: lechLoai.length ? lechLoai.join(' · ') : `${Object.keys(tho.theoLoai).length} loại khớp từng cái một`,
  });

  tc.push({
    ma: 'lop', ten: 'Bảo toàn lớp',
    dat: soLop >= tho.lop.length,
    do: `tệp ${tho.lop.length} lớp · dựng ${soLop}`,
  });

  const bia = Object.keys(nhanChuan).filter((k) => (nhanChuan[k] ?? 0) > 0 && !(k in thoChuan));
  tc.push({
    ma: 'khong-bia', ten: 'Không bịa thêm',
    dat: bia.length === 0,
    do: bia.length ? `sinh ra loại tệp KHÔNG có: ${bia.join(' · ')}` : 'không loại nào sinh thêm',
  });

  const imLang = Object.entries(tho.theoLoai)
    .filter(([k, n]) => n > 0 && !LOAI_DOC_DUOC.has(k) && !(chuan(k) in nhanChuan) && k !== 'VERTEX' && k !== 'SEQEND')
    .map(([k, n]) => `${k}×${n}`);
  tc.push({
    ma: 'im-lang', ten: 'Không bỏ qua trong im lặng',
    dat: imLang.length === 0,
    do: imLang.length ? `có trong tệp, không đọc, KHÔNG khai: ${imLang.join(' · ')}` : 'mọi thứ không đọc được đều có khai báo',
  });

  return { dat: tc.every((t) => t.dat), tieuChi: tc };
}
