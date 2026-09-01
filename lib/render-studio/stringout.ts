/**
 * lib/render-studio/stringout.ts — DỰNG THÔ (stringout) cho đường render phim.
 *
 * "Stringout" là chữ của nghề dựng: xếp mọi cảnh đã render nối đuôi nhau theo thứ
 * tự, KHÔNG cắt, KHÔNG chuyển cảnh — bản dựng đầu tiên để xem mình đang có gì.
 * Nó là bước trước "rough cut", và nó tồn tại chính vì người dựng cần thấy TOÀN BỘ
 * vật liệu thật, không phải bản đã tỉa.
 *
 * Vì thế module này có một luật cứng: **không bịa khung hình**. Cảnh chưa render
 * xong (0 khung) KHÔNG được độn bằng khung đen cho đủ thời lượng — nó bị BỎ RA và
 * ghi tên vào `boQua` kèm lý do. Một dựng thô nói dối về vật liệu là dựng thô vô dụng.
 *
 * Thuần dữ liệu + toán, không DOM — test bằng sucrase-node.
 */

/** Một cảnh đã (hoặc chưa) render, đưa vào để xếp lên trục thời gian. */
export interface CanhStringout {
  id: string;
  /** nhãn tiếng Việt hiện trên trục — thường là tên góc máy hoặc tên cảnh */
  nhan: string;
  /** số khung hình THẬT đang có trên đĩa. 0 = chưa render xong. */
  soKhung: number;
  /** thứ tự người dựng đặt; thiếu thì giữ thứ tự đưa vào */
  thuTu?: number;
}

/** Một cảnh đã có chỗ trên trục thời gian. */
export interface KhoangStringout {
  id: string;
  nhan: string;
  /** khung bắt đầu trên trục tổng (bao gồm) */
  batDauKhung: number;
  /** khung kết thúc trên trục tổng (KHÔNG bao gồm) */
  ketThucKhung: number;
  soKhung: number;
  batDauGiay: number;
  thoiLuongGiay: number;
}

export interface CanhBoQua {
  id: string;
  nhan: string;
  lyDo: string;
}

export interface Stringout {
  fps: number;
  canh: KhoangStringout[];
  boQua: CanhBoQua[];
  tongKhung: number;
  tongGiay: number;
}

export interface TuyChonStringout {
  /** khung/giây của bản dựng — mặc định 25 (PAL, chuẩn phổ biến cho phim kiến trúc) */
  fps?: number;
}

export const FPS_MAC_DINH = 25;

/**
 * Xếp các cảnh nối đuôi nhau. Ổn định: cảnh cùng `thuTu` giữ nguyên thứ tự đưa vào,
 * cảnh không khai `thuTu` xuống sau cùng (cũng giữ nguyên thứ tự đưa vào).
 * Cảnh 0 khung / khung âm / khung không nguyên bị BỎ RA kèm lý do, không độn.
 */
export function dungStringout(
  canhVao: readonly CanhStringout[],
  tuyChon: TuyChonStringout = {},
): Stringout {
  const fps = tuyChon.fps ?? FPS_MAC_DINH;
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`stringout: fps phải > 0, nhận ${fps}`);
  }

  const boQua: CanhBoQua[] = [];
  const nhan: { canh: CanhStringout; viTri: number }[] = [];
  canhVao.forEach((c, viTri) => {
    if (!Number.isFinite(c.soKhung) || !Number.isInteger(c.soKhung)) {
      boQua.push({ id: c.id, nhan: c.nhan, lyDo: `số khung không nguyên (${c.soKhung})` });
      return;
    }
    if (c.soKhung < 0) {
      boQua.push({ id: c.id, nhan: c.nhan, lyDo: `số khung âm (${c.soKhung})` });
      return;
    }
    if (c.soKhung === 0) {
      boQua.push({ id: c.id, nhan: c.nhan, lyDo: 'chưa có khung nào — cảnh chưa render xong' });
      return;
    }
    nhan.push({ canh: c, viTri });
  });

  // sắp ổn định: có `thuTu` đi trước theo giá trị; không khai thì xuống cuối theo thứ tự vào
  nhan.sort((a, b) => {
    const ta = a.canh.thuTu;
    const tb = b.canh.thuTu;
    if (ta === undefined && tb === undefined) return a.viTri - b.viTri;
    if (ta === undefined) return 1;
    if (tb === undefined) return -1;
    if (ta !== tb) return ta - tb;
    return a.viTri - b.viTri;
  });

  const canh: KhoangStringout[] = [];
  let con = 0;
  for (const { canh: c } of nhan) {
    canh.push({
      id: c.id,
      nhan: c.nhan,
      batDauKhung: con,
      ketThucKhung: con + c.soKhung,
      soKhung: c.soKhung,
      batDauGiay: con / fps,
      thoiLuongGiay: c.soKhung / fps,
    });
    con += c.soKhung;
  }

  return { fps, canh, boQua, tongKhung: con, tongGiay: con / fps };
}

/**
 * Mã thời gian SMPTE không-drop `HH:MM:SS:FF` từ số khung.
 * Khung âm hoặc fps ≤ 0 là lỗi lập trình ⇒ nổ, không trả chuỗi trông-như-đúng.
 */
export function maThoiGian(khung: number, fps: number): string {
  if (!Number.isFinite(fps) || fps <= 0) throw new Error(`maThoiGian: fps phải > 0, nhận ${fps}`);
  if (!Number.isInteger(khung) || khung < 0) {
    throw new Error(`maThoiGian: khung phải là số nguyên ≥ 0, nhận ${khung}`);
  }
  const fpsNguyen = Math.round(fps);
  const ff = khung % fpsNguyen;
  const tongGiay = Math.floor(khung / fpsNguyen);
  const ss = tongGiay % 60;
  const mm = Math.floor(tongGiay / 60) % 60;
  const hh = Math.floor(tongGiay / 3600);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}:${p(ff)}`;
}

/**
 * Bản in cho MẮT NGƯỜI DỰNG — mỗi cảnh một dòng kèm mã thời gian vào/ra.
 * Cảnh bị bỏ được in ở cuối: hộp rỗng phải nói ra là rỗng, không im lặng.
 */
export function inStringout(s: Stringout): string {
  const dong = s.canh.map((c, i) =>
    `${String(i + 1).padStart(3, '0')}  ${maThoiGian(c.batDauKhung, s.fps)}  ${maThoiGian(c.ketThucKhung, s.fps)}  ${c.nhan}`,
  );
  dong.push(`TỔNG  ${maThoiGian(s.tongKhung, s.fps)}  (${s.canh.length} cảnh · ${s.fps} fps)`);
  if (s.boQua.length) {
    dong.push(`BỎ RA ${s.boQua.length} cảnh:`);
    for (const b of s.boQua) dong.push(`      ${b.nhan} — ${b.lyDo}`);
  }
  return dong.join('\n');
}

/* ══════════════════════════════════════════════════════════════════════════════
 * CỬA VÀO TỪ KHO KẾT QUẢ — chỗ dựng thô gặp dữ liệu THẬT của app.
 *
 * Kho kết quả (`lib/capabilities/render.ts`, `BanGhiKetQua`) là nơi mọi lượt render
 * rơi vào. Nó KHÔNG lưu số khung: một bản ghi phim chỉ mang `thamSo` người dùng đã
 * khai (`thoiLuong: '5s'`) — số khung phải suy ra, và **suy ra là chỗ dễ bịa nhất
 * trong cả module này**. Nên đường suy đó nằm ở đây, thuần, có ca đột biến riêng:
 *   · không có `url`            ⇒ chưa có tệp phim  ⇒ BỎ RA (soKhung 0, module tự gọi tên);
 *   · có `url`, không đọc nổi thời lượng ⇒ BỎ RA kèm lý do — KHÔNG rơi về một số mặc định;
 *   · bản ghi ẢNH               ⇒ không phải cảnh phim, không thuộc dựng thô.
 *
 * Kiểu vào khai theo CẤU TRÚC (không `import` từ `lib/capabilities/*`): tệp này chạy
 * test bằng `sucrase-node`, mà sucrase-node không giải được alias `@/`. `BanGhiKetQua`
 * gán vừa khít kiểu dưới — cùng một dữ liệu, không phải bản mô phỏng thứ hai.
 * ══════════════════════════════════════════════════════════════════════════════ */

/** Phần bản ghi kết quả mà dựng thô thật sự đọc — cổng hẹp, cố ý. */
export interface BanGhiCanh {
  id: string;
  ten: string;
  loai: 'anh' | 'phim';
  /** URL tệp kết quả. Rỗng/thiếu = chưa render xong. */
  url?: string;
  thamSo?: Record<string, string | number>;
  /** mốc sinh ra (ms epoch) — dùng để xếp thứ tự ổn định khi người dựng chưa xếp tay. */
  luc?: number;
}

/**
 * Đọc thời lượng (giây) từ một giá trị tham số. Nhận `10`, `'10'`, `'10s'`, `'10 s'`.
 * KHÔNG đoán: mọi thứ khác trả `null` để nơi gọi phải nói ra là không đọc được.
 */
export function docThoiLuongGiay(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : null;
  if (typeof v !== 'string') return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:s|giây|sec|secs|seconds?)?\s*$/i.exec(v);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Khoá tham số có thể chở thời lượng — theo đúng tên node đang ghi (`motion-core.THOI_LUONG`). */
const KHOA_THOI_LUONG = ['thoiLuong', 'duration', 'thời lượng', 'thoi_luong'];

/**
 * Dựng thô TỪ KHO KẾT QUẢ. Chỉ bản ghi `loai: 'phim'` được xét — ảnh tĩnh không phải
 * một cảnh trong bản dựng, và nói "bỏ ra" về một tấm ảnh thì lại là một kiểu nói sai khác.
 * Nơi gọi đếm số ảnh và tự nói ra nếu cần (nó đang cầm cả mảng).
 */
export function stringoutTuKho(
  kho: readonly BanGhiCanh[],
  tuyChon: TuyChonStringout = {},
): Stringout {
  const fps = tuyChon.fps ?? FPS_MAC_DINH;
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`stringout: fps phải > 0, nhận ${fps}`);
  }
  const phim = kho
    .filter((b) => b.loai === 'phim')
    .slice()
    // xếp theo mốc sinh: người dựng chưa xếp tay thì thứ tự QUAY là thứ tự hợp lý nhất,
    // và nó tất định (không phụ thuộc thứ tự React trả mảng).
    .sort((a, b) => (a.luc ?? 0) - (b.luc ?? 0));

  const boQuaTruoc: CanhBoQua[] = [];
  const canh: CanhStringout[] = [];
  for (const b of phim) {
    if (!b.url) {
      // để chính `dungStringout` gọi tên — một lý do, một chỗ viết ra.
      canh.push({ id: b.id, nhan: b.ten, soKhung: 0 });
      continue;
    }
    const thoV = KHOA_THOI_LUONG.map((k) => b.thamSo?.[k]).find((v) => v !== undefined);
    const giay = docThoiLuongGiay(thoV);
    if (giay === null) {
      boQuaTruoc.push({
        id: b.id,
        nhan: b.ten,
        lyDo:
          thoV === undefined
            ? 'bản ghi không khai thời lượng — không suy được số khung'
            : `không đọc được thời lượng (${String(thoV)})`,
      });
      continue;
    }
    canh.push({ id: b.id, nhan: b.ten, soKhung: Math.round(giay * fps) });
  }

  const s = dungStringout(canh, { fps });
  // Bỏ-ra của cửa vào đứng TRƯỚC bỏ-ra của lõi: chúng là lỗi khai báo, đọc trước thì sửa trước.
  return { ...s, boQua: [...boQuaTruoc, ...s.boQua] };
}
