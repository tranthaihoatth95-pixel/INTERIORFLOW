/**
 * lib/nodes/dinh-nghia-ket-qua.ts — **"định nghĩa file = kết quả"** (Hoà chốt 15/08, nguyên văn:
 * *"cho phép mở nhiều cửa sổ để nối với nhau, và định nghĩa file = kết quả"*).
 *
 * Đọc là: đầu ra của mỗi cửa sổ công cụ KHÔNG phải một tệp trần — nó mang sẵn **định nghĩa**
 * (loại · vai trò · nguồn gốc), và chính định nghĩa đó làm nó thành **đầu vào đã-định-nghĩa của
 * cửa sổ kế**. Đó là điều kiện để chuỗi "mở nhiều cửa sổ nối với nhau" có nghĩa: nối được thì
 * dễ, nối mà biết mình đang chuyền cái gì mới là phần đắt.
 *
 * ⛔ KHÔNG THÊM TRƯỜNG MỚI — luật của phiếu, và cũng là điều đúng: ba mảnh định nghĩa ĐÃ nằm sẵn
 * trong dữ liệu hiện có, chỉ chưa ai ghép lại và bày ra.
 *   · **loại**      ← `PortDef.dataType` (`lib/types.ts`) — image/text/mask/number/video/table
 *   · **vai trò**   ← `PortDef.label` — cổng này là "Ảnh render" hay "Ghi chú"
 *   · **nguồn gốc** ← `defType` của chính node sinh ra nó + danh sách node cấp trên đã nuôi nó
 * Cần trường mới thì DỪNG và đề xuất (luật ③ của phiếu) — tệp này cố ý không có chỗ để thêm.
 *
 * Thuần tính, không React/store ⇒ test được bằng `sucrase-node`.
 */

import type { DataType } from '@/lib/types';

/** Cổng ra + định nghĩa đi kèm. Một node có bao nhiêu cổng ra thì bấy nhiêu mục. */
export interface DinhNghiaKetQua {
  /** id cổng — trùng `sourceHandle` của dây nối đi ra. */
  cong: string;
  loai: DataType;
  vaiTro: string;
  /** `defType` của node đã sinh ra kết quả này. */
  nguonGoc: string;
  /** Các node cấp trên đã nuôi node này (theo dây đang nối) — phần "từ đâu ra". */
  nuoiBoi: string[];
  /** Đã chạy xong VÀ cổng này có giá trị thật chưa. Chưa có thì đây là định nghĩa của chỗ CHỜ. */
  coGiaTri: boolean;
}

/** Hình dạng tối thiểu cần đọc — khai tại chỗ để test khỏi kéo `NodeDefinition` thật vào. */
export interface CongRa {
  id: string;
  label: string;
  dataType: DataType;
}

export interface DayNoi {
  source: string;
  target: string;
}

/**
 * Ghép định nghĩa cho từng cổng ra của một node.
 *
 * `outputs` là `run.outputs` (có sau khi chạy) — thiếu/rỗng KHÔNG phải lỗi: cổng vẫn có định
 * nghĩa trước khi có giá trị, đó chính là thứ cho phép nối dây trước rồi chạy sau.
 */
export function dinhNghiaKetQua(
  nodeId: string,
  defType: string,
  congRa: readonly CongRa[],
  outputs: Record<string, { dataType: DataType; value: string | number }> | null | undefined,
  day: readonly DayNoi[] = [],
): DinhNghiaKetQua[] {
  const nuoiBoi = day.filter((e) => e.target === nodeId).map((e) => e.source);
  return congRa.map((p) => ({
    cong: p.id,
    loai: p.dataType,
    vaiTro: p.label,
    nguonGoc: defType,
    nuoiBoi,
    coGiaTri: Boolean(outputs && outputs[p.id] !== undefined),
  }));
}

/** Tên người-đọc-được của từng loại — song ngữ, dùng chung cho nhãn cổng và dòng định nghĩa. */
export const TEN_LOAI: Record<DataType, { vi: string; en: string }> = {
  image: { vi: 'Ảnh', en: 'Image' },
  text: { vi: 'Chữ', en: 'Text' },
  mask: { vi: 'Vùng chọn', en: 'Mask' },
  number: { vi: 'Số', en: 'Number' },
  video: { vi: 'Phim', en: 'Video' },
  table: { vi: 'Bảng', en: 'Table' },
};

/**
 * Một dòng ngắn đọc ra tiếng người: *"Ảnh · Kết quả render · chờ chạy"*.
 * Giữ ≤ 12 từ theo `SPEC-NGON-NGU-CHI-DAN` — phần dài (nguồn gốc, node nuôi) để ô giải nghĩa.
 */
export function dongDinhNghia(d: DinhNghiaKetQua, vi: boolean): string {
  const loai = vi ? TEN_LOAI[d.loai].vi : TEN_LOAI[d.loai].en;
  const trangThai = d.coGiaTri ? (vi ? 'đã có' : 'ready') : vi ? 'chờ chạy' : 'not run yet';
  return `${loai} · ${d.vaiTro} · ${trangThai}`;
}
