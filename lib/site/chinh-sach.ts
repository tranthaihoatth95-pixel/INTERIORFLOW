/**
 * lib/site/chinh-sach.ts — TẦNG CHÍNH SÁCH NGƯỠNG. Mọi con số ảnh hưởng tới KẾT LUẬN THIẾT KẾ
 * phải đi qua đây, không được nằm rải rác dưới dạng hằng số trong thân luật.
 *
 * 🔴 VÌ SAO CÓ TẦNG NÀY. Ba ngưỡng đang dùng (mưa 100mm · ven biển 3000m · ẩm 75%) là **quy ước
 * làm việc KHÔNG CÓ NGUỒN**. Nguy hiểm không nằm ở con số — nằm ở chỗ một con số vô chủ, đi qua
 * vài lớp hàm, rồi hiện ra trước mặt KTS như **sự thật ngành**. Tầng này chặn đúng đường đó.
 *
 * ⛔ **KHÔNG hỏi người dùng chọn 100mm hay 120mm.** Đó là câu hỏi BẰNG CHỨNG, không phải câu hỏi
 * khẩu vị. Chưa có nguồn bảo vệ được thì luật **IM TRONG SẢN XUẤT**, chứ không đem ra bỏ phiếu.
 *
 * BỐN HẠNG (chỉ bốn, không có hạng "chắc là đúng"):
 *   `chuan`      — chuẩn/tập dữ liệu có nguồn. Được ra sản xuất, kết quả có thể lên `verified`.
 *   `chinh-sach` — chính sách dự án/vùng, có nguồn (hợp đồng, quy định nội bộ). Ra sản xuất được.
 *   `uoc-le`     — QUY ƯỚC LÀM VIỆC, chưa có nguồn. **IM trong sản xuất.** Kết quả trần `inferred`.
 *   `chi-test`   — chỉ để dựng fixture. KHÔNG BAO GIỜ ra sản xuất.
 */

import type { NguonGoc, ProvenanceFlag } from './types';

export type HangNguong = 'chuan' | 'chinh-sach' | 'uoc-le' | 'chi-test';

export interface Nguong {
  id: string;
  giaTri: number;
  donVi: string;
  hang: HangNguong;
  /** BẮT BUỘC với `chuan`/`chinh-sach` — xem `nguongHopLe()`. */
  nguon?: NguonGoc;
  /** Vì sao lấy con số này. Với `uoc-le` phải nói rõ nó CHƯA có gì chống lưng. */
  lyDo: string;
}

/**
 * `chuan`/`chinh-sach` mà thiếu nguồn là mâu thuẫn tự thân — chính là cửa mà một con số vô chủ
 * lẻn vào hạng canonical. Máy chặn, không nhắc suông.
 */
export function nguongHopLe(n: Nguong): boolean {
  if (n.hang === 'chuan' || n.hang === 'chinh-sach') return Boolean(n.nguon);
  return Boolean(n.lyDo && n.lyDo.trim());
}

/**
 * ⭐ CỬA SẢN XUẤT. `uoc-le` và `chi-test` KHÔNG được nói gì với người dùng.
 * Đây là chỗ thi hành câu *"chưa có nguồn bảo vệ được thì luật im"*.
 */
export function dungDuocTrongSanXuat(n: Nguong): boolean {
  return (n.hang === 'chuan' || n.hang === 'chinh-sach') && nguongHopLe(n);
}

/**
 * ⭐ TRẦN ĐỘ TIN CẬY. Một kết luận KHÔNG THỂ chắc hơn ngưỡng yếu nhất đã dùng để rút ra nó
 * (mắt xích yếu nhất). Dùng ngưỡng `uoc-le` ⇒ trần là `inferred`, dù mọi dữ kiện khác có
 * `verified` đi nữa. Không có đường vòng nào để lên `verified`.
 */
export function tranDoTinCay(dungNhung: Nguong[]): ProvenanceFlag {
  if (dungNhung.some((n) => !dungDuocTrongSanXuat(n))) return 'inferred';
  return 'verified';
}

/** Câu giải thích ngưỡng cho người đọc — luôn nói ra HẠNG, không giấu. */
export function moTaNguong(n: Nguong): string {
  const dau = `${n.giaTri} ${n.donVi}`;
  if (n.hang === 'uoc-le') return `${dau} — quy ước làm việc, chưa có nguồn ngành: ${n.lyDo}`;
  if (n.hang === 'chi-test') return `${dau} — chỉ dùng cho kiểm thử`;
  return `${dau} — ${n.nguon?.tieuDe ?? 'có nguồn'}${n.nguon?.url ? ` (${n.nguon.url})` : ''}`;
}

/* ═══════════════ SỔ NGƯỠNG ═══════════════ */

/**
 * 🔴 CẢ BA ĐỀU `uoc-le` — KHÔNG có nguồn ngành nào chống lưng, nên chúng **IM TRONG SẢN XUẤT**.
 * Ai tra được nguồn thật: đổi `hang` sang `chuan` + đính `nguon`, KHÔNG sửa con số rồi để nguyên
 * hạng. Nâng hạng mà không có nguồn thì `nguongHopLe()` trả false và test đỏ.
 */
export const SO_NGUONG: Record<string, Nguong> = {
  'mua.thang-mua': {
    id: 'mua.thang-mua',
    giaTri: 100,
    donVi: 'mm/tháng',
    hang: 'uoc-le',
    lyDo: 'tài liệu khí hậu nhiệt đới dùng nhiều ngưỡng khác nhau; chưa chọn được một nguồn để trích',
  },
  'dia-ly.ven-bien': {
    id: 'dia-ly.ven-bien',
    giaTri: 3000,
    donVi: 'm',
    hang: 'uoc-le',
    lyDo: 'tài liệu ăn mòn khí quyển chia vùng ven biển theo nhiều khoảng cách tuỳ mức phơi nhiễm',
  },
  'khi-hau.am-cao': {
    id: 'khi-hau.am-cao',
    giaTri: 75,
    donVi: '%',
    hang: 'uoc-le',
    lyDo: 'chưa tra được ngưỡng ẩm nào được ban hành cho mục đích thiết kế nội thất',
  },
};

/** Ngưỡng nào đang IM trong sản xuất — để một máy soi/bảng chờ đọc được, không phải đi hỏi người. */
export function nguongDangIm(): Nguong[] {
  return Object.values(SO_NGUONG).filter((n) => !dungDuocTrongSanXuat(n));
}
