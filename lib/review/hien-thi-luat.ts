/**
 * lib/review/hien-thi-luat.ts — HAI CHẾ ĐỘ HIỂN THỊ (Ngắn ↔ Đầy đủ) + TRỤC NGUỒN.
 * Phiếu P-B (16/08). Nguồn: `docs/CHOT-PHIEN-15-08-CAN-SOAT.md` B1-B7.
 *
 * VÌ SAO HAI CHẾ ĐỘ — bài toán nghề, không phải sở thích giao diện:
 *   · Lúc chạy deadline, KTS chỉ cần *"đỏ ở đâu, sửa cái gì"*. Nhồi nguyên văn điều khoản vào
 *     lúc đó là làm nhiễu, người dùng học cách bỏ qua cả bảng.
 *   · Lúc bảo vệ hồ sơ trước chủ đầu tư hoặc thẩm duyệt, phải **trích được nguyên văn**. Nói
 *     "app bảo thế" là mất uy tín nghề.
 * Một chế độ không phục vụ nổi hai tình huống đó ⇒ hai chế độ, nhớ lựa chọn, đổi bất cứ lúc nào.
 *
 * ⛔ ĐÂY LÀ VÙNG RỦI RO PHÁP LÝ CAO NHẤT. Ba rào an toàn ghi ở đầu `lib/cad/standards/types.ts`.
 * Cụ thể trong file này:
 *   · Rule KHÔNG có `nguyenVan` ⇒ trả `THIEU_NGUYEN_VAN`. KHÔNG sinh chữ thay thế, KHÔNG lấy
 *     `moTa` (câu do CODE dựng từ số đo) đắp vào chỗ nguyên văn — hai thứ đó khác hẳn nhau về
 *     giá trị pháp lý, trộn là lừa người dùng.
 *   · Rule KHÔNG khai `loaiNguon` ⇒ `null` + nhãn "Chưa phân loại nguồn". KHÔNG suy từ `severity`
 *     hay từ chuỗi `nguon` (B3 — hai trục độc lập).
 *   · Lớp GÓP Ý đi qua `dungTheGopy()` — hàm đó KHÔNG CÓ ĐƯỜNG NÀO trả về mức đỏ/vàng hay cờ
 *     chặn. Muốn phạm luật phải sửa kiểu dữ liệu trước, và diff đó sẽ bị soi.
 *
 * File THUẦN (không React/DOM/fetch) trừ đúng hai hàm đọc/ghi localStorage có canh SSR —
 * test bằng sucrase-node như `luat/rules-3d.test.ts`.
 */

import type { FindingGopy, FindingLuat } from './types';
import type { LoaiNguon } from '../cad/standards/types';

/** Chế độ hiển thị lớp LUẬT. Mặc định `ngan` — phần lớn thời gian là lúc đang vẽ. */
export type CheDoHienThi = 'ngan' | 'dayDu';

export const CHE_DO_MAC_DINH: CheDoHienThi = 'ngan';

/** Khoá localStorage — per-user trên máy này. Cùng họ khoá với `interiorflow.*` sẵn có. */
export const CHE_DO_STORAGE_KEY = 'interiorflow.review.cheDoHienThi.v1';

/**
 * Câu hiện khi rule chưa có nguyên văn. HẰNG SỐ, không phải chuỗi tự do — để test khoá được và
 * để không phiên nào "viết lại cho mềm hơn" rồi vô tình hàm ý là đã có nguyên văn.
 */
export const THIEU_NGUYEN_VAN =
  'Chưa có nguyên văn — chỉ có số hiệu điều khoản. Tra bản gốc trước khi trích vào hồ sơ.';

/** Nhãn khi rule không khai `loaiNguon`. Cũng là hằng số, cùng lý do. */
export const CHUA_PHAN_LOAI_NGUON = 'Chưa phân loại nguồn';

/* ─────────────────────────── nhớ lựa chọn (per-user, client-only) ─────────────────────────── */

function laCheDo(x: unknown): x is CheDoHienThi {
  return x === 'ngan' || x === 'dayDu';
}

/**
 * Đọc chế độ đã lưu. SSR / localStorage bị chặn ⇒ trả mặc định, KHÔNG throw.
 * (Cùng khuôn `loadCustomRules()` của registry.ts — module vẫn thuần, chỉ hàm này chạm window.)
 */
export function layCheDoHienThi(): CheDoHienThi {
  if (typeof window === 'undefined') return CHE_DO_MAC_DINH;
  try {
    const raw = window.localStorage.getItem(CHE_DO_STORAGE_KEY);
    return laCheDo(raw) ? raw : CHE_DO_MAC_DINH;
  } catch {
    return CHE_DO_MAC_DINH;
  }
}

export function datCheDoHienThi(cheDo: CheDoHienThi): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHE_DO_STORAGE_KEY, cheDo);
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua an toàn, chế độ vẫn đổi trong phiên này */
  }
}

/* ─────────────────────────────── nhãn hai trục ─────────────────────────────── */

/** Nhãn song ngữ cho MỘT giá trị. UI chọn theo ngôn ngữ đang bật (`lib/i18n`). */
export interface Nhan {
  vi: string;
  en: string;
}

/**
 * Nhãn trục NGUỒN. `undefined` ⇒ "Chưa phân loại nguồn" — KHÔNG đoán (rào B3).
 * Chữ ngắn vì nó nằm trong chip cạnh nhãn mức; câu giải thích dài thuộc về tooltip, không phải chip.
 */
export function nhanLoaiNguon(loai: LoaiNguon | undefined): Nhan {
  switch (loai) {
    case 'luat':
      return { vi: 'Luật nhà nước', en: 'Government law' };
    case 'tieuChuan':
      return { vi: 'Tiêu chuẩn ngành', en: 'Industry standard' };
    case 'xuHuong':
      return { vi: 'Xu hướng', en: 'Trend' };
    default:
      return { vi: CHUA_PHAN_LOAI_NGUON, en: 'Source not classified' };
  }
}

/**
 * Hình dạng đi kèm mức — KÊNH THỨ HAI ngoài màu.
 * Người mù màu đỏ-lục (~8% nam giới) không đọc được cảnh báo nếu mức CHỈ khác nhau ở màu; và
 * bản in trắng đen thì không ai đọc được. ⇒ mỗi mức có hình dạng RIÊNG + nhãn chữ RIÊNG.
 * UI ánh xạ: `batGiac` → OctagonAlert · `tamGiac` → TriangleAlert · `tia` → Sparkles (lucide).
 */
export type HinhDangMuc = 'batGiac' | 'tamGiac' | 'tia';

/** Nhãn + hình dạng của mức luật. Ngắn gọn, nói ĐỘ RÀNG BUỘC chứ không nói màu. */
export function nhanMuc(muc: FindingLuat['muc']): { nhan: Nhan; hinhDang: HinhDangMuc } {
  return muc === 'do'
    ? { nhan: { vi: 'Bắt buộc', en: 'Mandatory' }, hinhDang: 'batGiac' }
    : { nhan: { vi: 'Khuyến nghị', en: 'Advisory' }, hinhDang: 'tamGiac' };
}

/* ─────────────────────────── dựng thẻ hiển thị ─────────────────────────── */

/** Một dòng phụ chỉ hiện ở chế độ ĐẦY ĐỦ (cách sửa · ngày hiệu lực). */
export interface DongPhu {
  nhan: Nhan;
  giaTri: string;
}

/**
 * Thẻ vi phạm lớp LUẬT đã dựng sẵn cho UI vẽ — UI KHÔNG tự quyết chế độ nào hiện gì.
 * Gom quyết định về một chỗ để test khoá được, và để ba mặt tiền (panel 2D · 3D · deck) không
 * mỗi nơi diễn dịch một kiểu.
 */
export interface TheLuat {
  lop: 'luat';
  muc: FindingLuat['muc'];
  /** Nhãn chữ của mức — LUÔN có, kể cả chế độ Ngắn (bỏ đi là thẻ hết dẫn được độ ràng buộc). */
  nhanMuc: Nhan;
  hinhDang: HinhDangMuc;
  /** Câu mô tả vi phạm do CODE dựng từ số đo. KHÔNG phải nguyên văn điều khoản. */
  moTa: string;
  /** Số hiệu điều khoản, vd "QCVN 06:2022/BXD §3.2.1". Luôn hiện ở cả hai chế độ. */
  nguon: string;
  ruleId: string;
  /** Chip trục nguồn. `phanLoaiRoi=false` ⇒ UI vẽ viền đứt + chữ "Chưa phân loại nguồn". */
  chipNguon: { nhan: Nhan; phanLoaiRoi: boolean };

  /* ── chỉ chế độ ĐẦY ĐỦ mới điền, chế độ NGẮN để trống hết ── */
  /** Nguyên văn điều khoản, hoặc `null` khi rule chưa có (UI hiện `THIEU_NGUYEN_VAN`). */
  nguyenVan: string | null;
  /** `true` ⇒ hiện đúng câu `THIEU_NGUYEN_VAN`, KHÔNG sinh chữ thay thế. */
  thieuNguyenVan: boolean;
  dongPhu: DongPhu[];
  /** Cờ `verified === false` mang từ StandardRule qua — "số liệu chưa đối chiếu bản gốc". */
  chuaKiemChung: boolean;

  /** Có nút "Sửa" hay không (khi finding mang `cachSua`). */
  coNutSua: boolean;
  /** Có nút "Tới chỗ này" hay không (khi finding neo được vị trí/entity). */
  coNutToiCho: boolean;

  /**
   * Cảnh báo NHẤT QUÁN cho người biên tập bộ luật, không phải cho KTS.
   * Ca duy nhất hiện nay: `loaiNguon='xuHuong'` mà mức là đỏ — trái B2 (*"xu hướng không bao giờ
   * chặn"*). Máy BÁO chứ KHÔNG tự hạ mức: tự hạ là máy quyết thay người ở chỗ pháp lý (trái [N1]).
   */
  canhBaoNhatQuan: Nhan | null;
}

/** Thẻ lớp GÓP Ý. Ít trường hơn hẳn — và đó là CHỦ Ý, không phải làm dở. */
export interface TheGopy {
  lop: 'gopy';
  moTa: string;
  /** Nhãn "gợi ý" đứng đầu câu — dấu nhận biết bắt buộc (CHOT-TACH-AI §2 tách bằng DẤU). */
  nhanDau: Nhan;
  hinhDang: 'tia';
  /** Nguồn công bố công khai, chỉ có khi góp ý dựa vào nguồn ngoài. */
  nguonCongKhai: string | null;
  /**
   * LUÔN `false`. Không phải mặc định — là HẰNG. Góp ý không bao giờ chặn xuất file hay giao
   * hồ sơ (chốt 07/08 §12.3 ③). Để lộ ra thành trường để test khoá được và để UI hiện thành
   * chữ cho người dùng đọc, thay vì bắt họ đoán.
   */
  chan: false;
  /** Câu hiện cạnh thẻ để người dùng biết ngay là không bị chặn. */
  nhanKhongChan: Nhan;
}

/**
 * Dựng thẻ LUẬT theo chế độ.
 *
 * Chế độ NGẮN cố tình vẫn giữ `nhanMuc` + `nguon`: bỏ nguồn đi thì thẻ thôi là "luật", nó thành
 * một câu chê chung chung — đúng thứ mà lớp góp ý mới được phép làm.
 */
export function dungTheLuat(f: FindingLuat, cheDo: CheDoHienThi): TheLuat {
  const { nhan, hinhDang } = nhanMuc(f.muc);
  const dayDu = cheDo === 'dayDu';

  const dongPhu: DongPhu[] = [];
  if (dayDu) {
    if (f.cachSua) dongPhu.push({ nhan: { vi: 'Cách sửa', en: 'How to fix' }, giaTri: f.cachSua });
    if (f.ngayHieuLuc) {
      dongPhu.push({ nhan: { vi: 'Hiệu lực từ', en: 'In force from' }, giaTri: f.ngayHieuLuc });
    }
  }

  // Rule khai `xuHuong` mà mức đỏ ⇒ trái B2. BÁO, không tự sửa.
  const lechXuHuong = f.loaiNguon === 'xuHuong' && f.muc === 'do';

  return {
    lop: 'luat',
    muc: f.muc,
    nhanMuc: nhan,
    hinhDang,
    moTa: f.moTa,
    nguon: f.nguon,
    ruleId: f.ruleId,
    chipNguon: { nhan: nhanLoaiNguon(f.loaiNguon), phanLoaiRoi: f.loaiNguon !== undefined },
    // Chỉ chế độ ĐẦY ĐỦ mới lộ nguyên văn — và chỉ khi rule THẬT SỰ có, không bịa.
    nguyenVan: dayDu ? f.nguyenVan ?? null : null,
    thieuNguyenVan: dayDu ? !f.nguyenVan : false,
    dongPhu,
    chuaKiemChung: dayDu ? f.chuaKiemChung === true : false,
    coNutSua: Boolean(f.cachSua),
    coNutToiCho: Boolean(f.viTri?.entityId || f.viTri?.mm),
    canhBaoNhatQuan: lechXuHuong
      ? {
          vi: 'Rule khai nguồn "Xu hướng" nhưng đang ở mức Bắt buộc — xu hướng không được chặn nghiệm thu.',
          en: 'Rule declares source "Trend" but sits at Mandatory — trends must never block sign-off.',
        }
      : null,
  };
}

/**
 * Dựng thẻ GÓP Ý. KHÔNG nhận `cheDo`: góp ý không có "bản đầy đủ" để bung ra — nó không có
 * điều khoản để trích, và cho nó một chế độ đầy đủ là bước đầu của việc trộn hai lớp.
 */
export function dungTheGopy(g: FindingGopy): TheGopy {
  return {
    lop: 'gopy',
    moTa: g.moTa,
    nhanDau: { vi: 'gợi ý', en: 'suggestion' },
    hinhDang: 'tia',
    nguonCongKhai: g.nguonCongKhai ?? null,
    chan: false,
    nhanKhongChan: { vi: 'Không chặn xuất hồ sơ', en: 'Never blocks export' },
  };
}
