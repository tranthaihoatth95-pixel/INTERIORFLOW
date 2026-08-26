/**
 * components/filemanager/tep-nguon-trang-thai.ts — LÕI THUẦN của phần **NHÌN LÀ HIỂU** trong khu
 * *Tệp nguồn dự án*. Tách khỏi `tep-nguon.ts` (đã lo usage/kích thước/human-gate) vì đây là một
 * việc khác: **phân biệt VẬT** và **kể TRẠNG THÁI**.
 *
 * ══ HAI TRỤC, KHÔNG TRỘN ═══════════════════════════════════════════════════════════════════
 *   ① VẬT LÀ GÌ (`VatNguon`) — nó là *thứ gì* trong dòng chảy §5 `IF-KIEN-TRUC.md`:
 *        `tepDuAn`      tệp thô, thuộc ĐÚNG MỘT dự án            (□ — chưa hiểu)
 *        `taiSanThuVien` đã promote, dùng lại được nhiều dự án    (◆ — đã hiểu)
 *        `dangDung`      quan hệ SỬ DỤNG trong chính dự án này    (⇄ — quan hệ)
 *      Ba thứ này KHÔNG phải ba nấc của một thang: một tệp có thể vừa là `tepDuAn` vừa đã sinh
 *      `taiSanThuVien` vừa `dangDung` — nên chúng hiện SONG SONG, không đè nhau.
 *   ② VIỆC ĐANG TỚI ĐÂU (`TrangThaiTep`) — 7 nấc, loại trừ nhau, đúng MỘT nấc mỗi lúc.
 *
 * ⚠️ VÌ SAO PHẢI TÁCH: `LibraryAsset` **không mang `projectId`** (contract Promote,
 * `lib/server/promote.ts`) — nó không thuộc dự án nào. Vẽ chung một huy hiệu cho *tệp của dự án*
 * và *tài sản dùng chung* là nói sai contract ngay trên mặt kính.
 *
 * 🎨 Mỗi nhãn mang **KÝ HIỆU HÌNH HỌC + CHỮ**, không có màu. Màu là kênh phụ do nơi gọi thêm —
 * bỏ hết màu vẫn đọc được (luật màu-không-là-kênh-duy-nhất). Hai họ ký hiệu cố ý KHÁC NHAU:
 * trạng thái dùng họ tròn `○ ◐ ●` (cùng họ `NganPhanTho.tsx` đã dùng — mức độ), vật dùng họ
 * `□ ◆ ⇄` (danh tính). Nhìn cột là biết đang đọc trục nào.
 *
 * Thuần — không React/DOM/fetch. Chuỗi trả `{vi,en}`, nơi gọi tự dịch (quy ước `tep-nguon.ts`).
 * Import RELATIVE — bộ chạy test là `sucrase-node`, không đọc `paths` của tsconfig.
 */

import type { ChuHaiThu } from './tep-nguon';

/* ══ ① VẬT — ba trạng thái vật của dòng chảy §5 ═══════════════════════════════════════════ */

export type VatNguon = 'tepDuAn' | 'taiSanThuVien' | 'dangDung';

export interface NhanVat extends ChuHaiThu {
  /** Ký hiệu hình học — kênh thứ hai cạnh chữ, sống được khi bỏ hết màu. */
  ky: string;
  /** Một câu nói ĐÚNG RANH GIỚI của vật — đi vào ô giải nghĩa, không phải chữ trang trí. */
  y: ChuHaiThu;
}

export const VAT_NHAN: Record<VatNguon, NhanVat> = {
  tepDuAn: {
    ky: '□',
    vi: 'Tệp nguồn dự án',
    en: 'Project source file',
    y: {
      vi: 'Nguyên liệu thô, thuộc riêng dự án này — chưa đủ định nghĩa để dùng lại nơi khác.',
      en: 'Raw input owned by this project only — not yet defined enough to reuse elsewhere.',
    },
  },
  taiSanThuVien: {
    ky: '◆',
    vi: 'Tài sản Thư viện',
    en: 'Library asset',
    y: {
      vi: 'Đã hiểu, dùng lại được ở nhiều dự án — tài sản Thư viện KHÔNG thuộc dự án nào.',
      en: 'Understood and reusable across projects — a Library asset belongs to no single project.',
    },
  },
  dangDung: {
    ky: '⇄',
    vi: 'Đang dùng trong dự án này',
    en: 'Used in this project',
    y: {
      vi: 'Quan hệ sử dụng: tài sản Thư viện được nối ngược về dự án này.',
      en: 'A usage link: the Library asset is wired back into this project.',
    },
  },
};

/**
 * Huy hiệu nào sáng cho một hàng — thứ tự cố định `tepDuAn → taiSanThuVien → dangDung`, đúng
 * chiều dòng chảy, để mắt quét ngang là đọc được món đã đi tới đâu.
 * Mọi hàng trong khu này LUÔN có `tepDuAn` (đó là định nghĩa của khu).
 */
export function huyHieuVat(o: { coAsset: boolean; dangDung: boolean }): VatNguon[] {
  const ra: VatNguon[] = ['tepDuAn'];
  if (o.coAsset) ra.push('taiSanThuVien');
  if (o.dangDung) ra.push('dangDung');
  return ra;
}

/* ══ ② TRẠNG THÁI — 7 nấc, loại trừ nhau ══════════════════════════════════════════════════ */

export type TrangThaiTep =
  | 'dangTaiLen'
  | 'sanSang'
  | 'canXemLai'
  | 'dangDuaVao'
  | 'daVaoThuVien'
  | 'khongHoTro'
  | 'loi';

/** Thứ tự bày cho người đọc/tài liệu — KHÔNG phải thứ tự ưu tiên (ưu tiên nằm ở `tinhTrangThai`). */
export const TRANG_THAI_LIST: TrangThaiTep[] = [
  'dangTaiLen', 'sanSang', 'canXemLai', 'dangDuaVao', 'daVaoThuVien', 'khongHoTro', 'loi',
];

export interface NhanTrangThai extends ChuHaiThu {
  ky: string;
  /** `true` = nấc kết thúc bằng trục trặc ⇒ nơi gọi tô `--danger` (màu là kênh PHỤ, đã có ký+chữ). */
  hong?: boolean;
  /** `true` = đang chạy ⇒ nơi gọi có thể kèm thanh tiến trình. */
  dangChay?: boolean;
}

export const TRANG_THAI_NHAN: Record<TrangThaiTep, NhanTrangThai> = {
  dangTaiLen: { ky: '↑', vi: 'Đang tải lên', en: 'Uploading', dangChay: true },
  canXemLai: { ky: '○', vi: 'Cần xem lại', en: 'Needs review' },
  sanSang: { ky: '◐', vi: 'Sẵn sàng', en: 'Ready' },
  dangDuaVao: { ky: '→', vi: 'Đang đưa vào Thư viện', en: 'Promoting', dangChay: true },
  daVaoThuVien: { ky: '●', vi: 'Đã vào Thư viện', en: 'In the Library' },
  khongHoTro: { ky: '⊘', vi: 'Không hỗ trợ', en: 'Unsupported', hong: true },
  loi: { ky: '✕', vi: 'Lỗi', en: 'Error', hong: true },
};

export interface DauVaoTrangThai {
  /** Đang gửi lên máy chủ (chưa có bản ghi `ProjectFile`). */
  dangTaiLen?: boolean;
  /** NGUYÊN VĂN lý do server từ chối loại tệp (415). Có giá trị ⇒ nấc `khongHoTro`. */
  lyDoKhongHoTro?: string | null;
  /** Lỗi khác (413/500/mạng…), nguyên văn. */
  loi?: string | null;
  /** Đang gọi Promote. */
  dangDuaVao?: boolean;
  /** Đã có `LibraryAsset` sinh từ tệp này. */
  daVaoThuVien?: boolean;
  /** Người dùng đã tick "Đã xem" (human gate — `lyDoChuaGui`). */
  daXem?: boolean;
}

/**
 * MỘT nấc cho mỗi hàng. Thứ tự ưu tiên đọc từ trên xuống, và nó có lý do:
 *   ① `khongHoTro` đứng trước `loi` — "server không nhận loại tệp này" là câu trả lời CỤ THỂ hơn
 *      "lỗi", và là ca người dùng gặp thật (DWG/DXF → 415).
 *   ② việc ĐANG CHẠY thắng kết quả cũ — bấm promote lại thì phải thấy "đang", không thấy "đã".
 *   ③ `daVaoThuVien` thắng human-gate: đã vào rồi thì không còn hỏi "xem chưa".
 *
 * ⚠️ `canXemLai` KHÔNG có nghĩa "tệp có vấn đề" — nó là *chưa ai mở ra nhìn*. Đây đúng human
 * gate duy nhất của chuỗi (`lyDoChuaGui`), không phải kết luận của một engine review nào.
 */
export function tinhTrangThai(o: DauVaoTrangThai): TrangThaiTep {
  if (o.lyDoKhongHoTro) return 'khongHoTro';
  if (o.loi) return 'loi';
  if (o.dangTaiLen) return 'dangTaiLen';
  if (o.dangDuaVao) return 'dangDuaVao';
  if (o.daVaoThuVien) return 'daVaoThuVien';
  return o.daXem ? 'sanSang' : 'canXemLai';
}

/**
 * Câu đi kèm nấc — với hai nấc trục trặc thì đây là **NGUYÊN VĂN CỦA MÁY CHỦ**, không phải câu
 * tự chế. Ca thật: `POST /api/project-files` trả 415 cho DWG/DXF với lý do từ sniff magic-bytes;
 * UI viết lại câu đó bằng lời của mình là **giả vờ hiểu** — người dùng mất manh mối thật.
 * Trả `null` = nấc đó không cần câu phụ.
 */
export function chuPhu(tt: TrangThaiTep, o: DauVaoTrangThai): string | null {
  if (tt === 'khongHoTro') return o.lyDoKhongHoTro ?? null;
  if (tt === 'loi') return o.loi ?? null;
  return null;
}

/* ══ ③ LÝ DO NÚT MỜ — không `title` câm, không nút giả ════════════════════════════════════ */

/**
 * Lý do "Mở tài sản trong Thư viện" đang mờ. `null` = bấm được.
 * Nút này CHỈ có nghĩa khi đã promote — chưa promote thì chưa có vật nào để mở, và bịa một nút
 * bấm-ra-trang-trống là nút giả.
 */
export function lyDoChuaMoTaiSan(o: { coAsset: boolean }): ChuHaiThu | null {
  if (o.coAsset) return null;
  return {
    vi: 'Tệp chưa vào Thư viện — chưa có tài sản nào để mở.',
    en: 'Not promoted yet — there is no Library asset to open.',
  };
}

/**
 * Lý do "Đang dùng ở đâu" đang mờ. Quan hệ sử dụng (`ProjectAssetUsage`) chỉ tồn tại SAU Promote
 * — trước đó câu hỏi "dùng ở đâu" chưa có nghĩa, chứ không phải "chưa tra được".
 */
export function lyDoChuaXemDangDung(o: { coAsset: boolean }): ChuHaiThu | null {
  if (o.coAsset) return null;
  return {
    vi: 'Quan hệ sử dụng chỉ có sau khi đưa vào Thư viện.',
    en: 'Usage links only exist after the file is promoted to the Library.',
  };
}

/* ══ ④ NỐI TỆP ↔ TÀI SẢN — đọc lại được sau khi tải lại trang ═════════════════════════════ */

/**
 * Tag provenance mà Promote đóng lên `LibraryAsset` — **BẢN SAO PHÍA CLIENT** của
 * `tagNguonProjectFile` (`lib/server/promote.ts`). Cùng lý do đã ghi ở đầu `tep-nguon.ts`:
 * module server import Prisma ở top-level nên client không import được. Lệch là test đỏ
 * (drift-guard `tep-nguon-trang-thai.test.ts`).
 *
 * ⚠️ VÌ SAO PHẢI ĐI ĐƯỜNG TAG: `ProjectFile` **không có** cột `promotedAt`/`assetId`, và
 * `GET /api/project-files` (FILE_SELECT — `_lib/guard.ts:48`) không trả trạng thái promote.
 * ⇒ Muốn biết "tệp này đã vào Thư viện chưa" sau khi tải lại trang thì chỉ còn cách khớp tag
 * bên phía tài sản. Đây là **đường vòng có thật, không phải thiết kế đẹp** — khai thẳng trong
 * báo cáo; đường sạch là thêm cờ vào FILE_SELECT (nằm ngoài vùng ghi của phiếu này).
 */
export function tagNguonTep(projectFileId: string): string {
  return `nguon:projectfile:${projectFileId}`;
}

/** Hình dạng tối thiểu của một hàng `GET /api/library` mà việc khớp cần. */
export interface AssetToiThieu {
  id: string;
  name: string;
  url: string;
  tags: string;
}

/**
 * Tìm tài sản Thư viện sinh ra từ một `ProjectFile`. So sánh KHÔNG phân biệt hoa/thường và cắt
 * theo dấu phẩy — `LibraryAsset.tags` là CSV free-text, và `gallery-tags.ts` đọc tag ở dạng
 * thường; khớp bằng `includes` trên cả chuỗi sẽ dính nhầm tiền tố của id khác.
 */
export function timAssetTheoTep(assets: AssetToiThieu[], projectFileId: string): AssetToiThieu | null {
  const can = tagNguonTep(projectFileId).toLowerCase();
  for (const a of assets) {
    const list = String(a.tags ?? '').split(',').map((t) => t.trim().toLowerCase());
    if (list.includes(can)) return a;
  }
  return null;
}

/* ══ ⑤ BA NẤC BÊN PHẢI — ba CÔNG NĂNG, không phải ba cỡ chữ ═══════════════════════════════ */

export type NacXem = 'luot' | 'ky' | 'sau';

export const NAC_LIST: NacXem[] = ['luot', 'ky', 'sau'];

export interface NhanNac extends ChuHaiThu {
  /** Câu hỏi mà nấc này trả lời — cửa nghiệm thu: hai nấc không được trả lời cùng một câu. */
  hoi: ChuHaiThu;
}

/**
 * Hoà chốt 16/08: *"size to là BỔ SUNG CHI TIẾT cho size nhỏ"* — mỗi nấc trả lời MỘT CÂU KHÁC,
 * nấc to thêm một LỚP TIN chứ không phóng to lớp cũ.
 *   lướt → *nó là gì*      (danh tính: huy hiệu vật + nấc trạng thái)
 *   kỹ   → *nó là tệp nào* (thông số đo được: MIME · ngày · người tải · vân tay nội dung)
 *   sâu  → *nó dính vào đâu* (QUAN HỆ: đi tới nguồn · đang dùng ở đâu — dữ liệu server thật)
 * Lớp "quan hệ" là thứ nấc lướt/kỹ **không thể** có: nó phải hỏi máy chủ mới biết.
 */
export const NAC_NHAN: Record<NacXem, NhanNac> = {
  luot: {
    vi: 'Xem lướt', en: 'Glance',
    hoi: { vi: 'Nó là gì?', en: 'What is it?' },
  },
  ky: {
    vi: 'Xem kỹ', en: 'Inspect',
    hoi: { vi: 'Nó là tệp nào?', en: 'Which file is it?' },
  },
  sau: {
    vi: 'Xem sâu', en: 'Trace',
    hoi: { vi: 'Nó dính vào đâu?', en: 'What is it wired to?' },
  },
};
