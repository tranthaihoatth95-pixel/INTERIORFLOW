'use client';

/**
 * lib/present-editor/to-ban-ve.ts — TỜ GỬI SANG TRÌNH CHIẾU (2D/3D → Present).
 *
 * ⭐ LUẬT NỀN THI HÀNH Ở ĐÂY: **2D và 3D SÁNG TÁC NỘI DUNG · TRÌNH CHIẾU DÀN TRANG VÀ PHÁT HÀNH.**
 * Chặng 2D không còn là nơi quyết định trang giấy — nó GỬI một tờ có neo nguồn sang Trình chiếu,
 * và Trình chiếu mới là nơi đặt khổ/tỉ lệ/lề/khung tên rồi phát hành.
 *
 * ⛔ KHÔNG nhân bản engine trang: đây là MODEL của một tờ (metadata + neo nguồn), KHÔNG chứa bản
 * sao hình học — cùng nguyên lý `Sheet`/`Viewport2D` của `lib/cad/model.ts` ("giấy không bao giờ
 * giữ bản sao hình học"). Tờ chỉ mang TOẠ ĐỘ NHÌN + DẤU VẾT nguồn; hình do nguồn cấp.
 *
 * Cầu vận chuyển dùng LẠI ĐÚNG pattern `lib/present-editor/handoff.ts` (sessionStorage + fallback
 * biến module-level + consume-once), vì hai chặng là hai route và store không hydrate chéo. Không
 * viết cầu thứ hai: hàm ở đây stash vào KHOÁ RIÊNG nhưng cùng cơ chế, cùng bài học B1.
 *
 * 🔴 HAI LUẬT NGHỀ ĐƯỢC KHOÁ BẰNG MÁY TRONG FILE NÀY:
 *  ① CẤM CO GIÃN ÂM THẦM (`tyLeApDung`): người dùng chọn 1:50 thì tờ in ra ĐÚNG 1:50 — không lọt
 *    giấy thì BÁO, tuyệt đối không tự hạ xuống 1:100 cho vừa. "Vừa khung" chỉ xảy ra khi người
 *    dùng chọn TƯỜNG MINH `{ kieu: 'vua-khung' }`. Sai tỉ lệ là hỏng hồ sơ, không phải lỗi thẩm mỹ.
 *  ② NGUỒN ĐỔI KHÔNG TỰ SỬA ĐẦU RA (`trangThaiNguon`): nguồn đổi thì tờ chỉ ĐÁNH DẤU 'cu', người
 *    chọn Cập nhật · So sánh · Giữ bản hiện tại. Tờ ĐÃ PHÁT HÀNH thì máy không được đụng vào
 *    (`coTheTuCapNhat` luôn false khi đã phát hành).
 *
 * Dãy tỉ lệ theo LUẬT `docs/CHUAN-DAU-RA-NGHE.md` (dãy tỉ lệ chuẩn) — KHÔNG đẻ dãy thứ hai:
 * `TY_LE_BAN_VE` là TẬP CON dùng cho tờ nội thất của `STANDARD_SCALES` (lib/cad/model.ts:1094),
 * có test canh để nó không trôi khỏi tập cha.
 */

import type { PaperKey, PaperOrientation } from '../cad/model';

/* ── ① TỈ LỆ ─────────────────────────────────────────────────────────────────────────── */

/** Dãy tỉ lệ bày ra cho tờ bản vẽ nội thất. TẬP CON của `STANDARD_SCALES` (có test canh). */
export const TY_LE_BAN_VE = [20, 25, 50, 100] as const;

/**
 * Lựa chọn tỉ lệ của một tờ.
 * `vua-khung` là một LỰA CHỌN TƯỜNG MINH của người dùng — không bao giờ là đường thoái lui của máy.
 */
export type TyLe =
  | { kieu: 'chuan'; n: number }
  | { kieu: 'tuy-chinh'; n: number }
  | { kieu: 'vua-khung' };

export function laTyLeChuan(n: number): boolean {
  return (TY_LE_BAN_VE as readonly number[]).includes(n);
}

/** Nhãn người đọc: "1:50" · "Vừa khung". Tỉ lệ tuỳ chỉnh vẫn đọc là 1:N (nó là tỉ lệ thật). */
export function nhanTyLe(t: TyLe): string {
  if (t.kieu === 'vua-khung') return 'Vừa khung';
  return `1:${t.n}`;
}

export interface HopMm {
  rongMm: number;
  caoMm: number;
}

/**
 * Kết quả áp tỉ lệ lên một tờ.
 * `n` = mẫu số 1:N THỰC SỰ dùng để in. `tranKhung` = nội dung KHÔNG lọt vùng in ở tỉ lệ đó.
 *
 * 🔴 Điểm khoá luật ①: khi `tranKhung` là true với `kieu` chuẩn/tuỳ chỉnh, hàm VẪN trả về đúng
 * `n` người dùng chọn kèm `canhBao` — nơi gọi phải bày cảnh báo và để NGƯỜI quyết, tuyệt đối
 * không được tự thay `n`. Nếu hàm này tự hạ tỉ lệ, cả luật nghề sụp ở một dòng.
 */
export interface ApTyLe {
  n: number;
  tranKhung: boolean;
  /** lý do đọc được để bày ra; `null` khi mọi thứ vừa vặn. */
  canhBao: string | null;
}

/** Vùng in còn lại sau lề (mm). Lề âm/quá lớn bị kẹp về 0 để không sinh kích thước âm. */
export function vungInMm(khoMm: HopMm, leMm: number): HopMm {
  const le = Math.max(0, leMm);
  return {
    rongMm: Math.max(0, khoMm.rongMm - le * 2),
    caoMm: Math.max(0, khoMm.caoMm - le * 2),
  };
}

/**
 * Tỉ lệ NHỎ NHẤT trong dãy chuẩn đủ để nội dung lọt vùng in. Trả `null` khi cả dãy đều không đủ —
 * KHÔNG bịa ra một số ngoài dãy để "cho xong" (số lẻ kiểu 1:47 là thứ LUẬT chuẩn-đầu-ra cấm).
 */
export function tyLeVuaKhung(noiDung: HopMm, vungIn: HopMm): number | null {
  if (noiDung.rongMm <= 0 || noiDung.caoMm <= 0) return null;
  for (const n of TY_LE_BAN_VE) {
    if (noiDung.rongMm / n <= vungIn.rongMm && noiDung.caoMm / n <= vungIn.caoMm) return n;
  }
  return null;
}

/**
 * Áp lựa chọn tỉ lệ lên nội dung + vùng in. Xem `ApTyLe` cho luật cấm co giãn âm thầm.
 * `noiDung` = hộp bao nội dung theo mm THẬT (world mm), `vungIn` = khổ giấy đã trừ lề.
 */
export function tyLeApDung(t: TyLe, noiDung: HopMm, vungIn: HopMm): ApTyLe {
  if (t.kieu === 'vua-khung') {
    const n = tyLeVuaKhung(noiDung, vungIn);
    if (n === null) {
      // Không có tỉ lệ CHUẨN nào đủ. Rơi về tỉ lệ nhỏ nhất của dãy và báo — thà tờ tràn có cảnh
      // báo còn hơn một con số lẻ ngoài dãy chuẩn lọt vào hồ sơ.
      const cuoi = TY_LE_BAN_VE[TY_LE_BAN_VE.length - 1];
      return {
        n: cuoi,
        tranKhung: true,
        canhBao: `Không tỉ lệ chuẩn nào cho nội dung lọt khổ giấy này — đang dùng 1:${cuoi}, vẫn tràn. Đổi khổ giấy lớn hơn hoặc tách tờ.`,
      };
    }
    return { n, tranKhung: false, canhBao: null };
  }

  const n = Math.max(1, Math.round(t.n));
  const vua = noiDung.rongMm / n <= vungIn.rongMm && noiDung.caoMm / n <= vungIn.caoMm;
  if (vua) return { n, tranKhung: false, canhBao: null };
  return {
    n,
    tranKhung: true,
    // Nói rõ MÁY KHÔNG TỰ ĐỔI — để người dùng biết tờ vẫn đúng tỉ lệ họ chọn, và quyết định là của họ.
    canhBao: `Ở 1:${n} nội dung tràn ngoài vùng in. Giữ nguyên tỉ lệ (không tự co giãn) — đổi khổ giấy, đổi tỉ lệ, hoặc chọn "Vừa khung" nếu chấp nhận đổi tỉ lệ.`,
  };
}

/* ── ② NEO NGUỒN · BẢN SỬA ───────────────────────────────────────────────────────────── */

export type ChangNguon = 'cad2d' | 'model3d';

/**
 * Dây về nguồn của một tờ. `dauVet` là DẤU VẾT nội dung nguồn lúc gửi — đổi nội dung nguồn thì
 * dấu vết đổi, nhờ đó Trình chiếu biết tờ đã cũ MÀ KHÔNG cần đọc lại hình học nguồn.
 */
export interface NeoNguon {
  chang: ChangNguon;
  /** định danh tài liệu nguồn (Doc/scene). */
  docId: string;
  /** tờ/ô nhìn cụ thể trong nguồn, nếu có. */
  sheetId?: string;
  /** dấu vết nội dung nguồn LÚC GỬI. */
  dauVet: string;
  /** mốc thời gian gửi (ms). */
  luc: number;
}

/**
 * Dấu vết TẤT ĐỊNH từ vài mẩu mô tả nguồn (số entity, mốc sửa cuối, khổ, tỉ lệ…).
 * Cố ý KHÔNG dùng thư viện băm: đây là dấu-vết-đổi-hay-không, không phải bảo mật. Tất định để
 * chạy 10 lần ra 10 kết quả giống nhau (đúng luật kiểm-bằng-máy).
 */
export function dauVetNguon(phan: readonly (string | number)[]): string {
  const s = phan.join('|');
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

/**
 * 'hien-hanh' = nguồn không đổi từ lúc gửi · 'cu' = nguồn ĐÃ ĐỔI, có bản mới ·
 * 'khong-ro' = không đọc được dấu vết nguồn hiện tại (nguồn đã đóng/xoá/chưa nạp) — KHÔNG được
 * đoán bừa thành 'hien-hanh', vì đoán sai ở đây là đưa bản cũ ra cho khách mà không ai biết.
 */
export type TrangThaiNguon = 'hien-hanh' | 'cu' | 'khong-ro';

export function trangThaiNguon(neo: NeoNguon, dauVetHienTai?: string | null): TrangThaiNguon {
  if (!dauVetHienTai) return 'khong-ro';
  return dauVetHienTai === neo.dauVet ? 'hien-hanh' : 'cu';
}

export const NHAN_TRANG_THAI: Record<TrangThaiNguon, string> = {
  'hien-hanh': 'Hiện hành',
  cu: 'Có bản mới',
  'khong-ro': 'Cần xem lại',
};

/* ── ③ TỜ ────────────────────────────────────────────────────────────────────────────── */

export interface KhungTenTo {
  duAn: string;
  tenBanVe: string;
  soTo: string;
  banSua: string;
  nguoiVe: string;
  ngay: string;
}

export function khungTenRong(): KhungTenTo {
  return { duAn: '', tenBanVe: '', soTo: '', banSua: '', nguoiVe: '', ngay: '' };
}

export interface ToBanVe {
  id: string;
  nhan: string;
  khoGiay: PaperKey;
  huong: PaperOrientation;
  le: number;
  tyLe: TyLe;
  khungTen: KhungTenTo;
  neo: NeoNguon;
  /** hộp bao nội dung nguồn (world mm) — để Trình chiếu tính tỉ lệ mà không cần đọc hình học. */
  noiDungMm: HopMm;
  /** ảnh xem trước tuỳ chọn (dataURL). Không có thì Trình chiếu vẽ khung trống, KHÔNG bịa hình. */
  anh?: string;
  /** đã phát hành thì máy KHÔNG được tự cập nhật — chỉ người quyết. */
  daPhatHanh?: boolean;
}

/**
 * Tờ đã phát hành thì TUYỆT ĐỐI không tự cập nhật, dù nguồn có đổi. Đây là hàm cổng duy nhất
 * cho câu hỏi "máy được đụng vào tờ này không" — nơi gọi phải đi qua đây, không tự suy.
 */
export function coTheTuCapNhat(to: ToBanVe): boolean {
  return !to.daPhatHanh;
}

/** Ba lối xử khi nguồn đổi — người chọn, máy không chọn hộ. */
export const LOI_XU_NGUON_DOI = ['cap-nhat', 'so-sanh', 'giu-ban-hien-tai'] as const;
export type LoiXuNguonDoi = (typeof LOI_XU_NGUON_DOI)[number];

/* ── ④ CẦU 2D/3D → PRESENT (pattern handoff.ts) ─────────────────────────────────────── */

const KEY = 'interiorflow.toBanVeHandoff';
/** Trần số tờ chuyển 1 lượt — giữ nhỏ vì mỗi tờ có thể mang ảnh xem trước. */
const MAX_TO = 12;

let memTo: ToBanVe[] | null = null;

/** Stash tờ sang Trình chiếu. Trả `true` nếu vào được sessionStorage (false = đang dùng fallback). */
export function guiToSangTrinhChieu(toList: readonly ToBanVe[]): boolean {
  const trimmed = toList.filter((t) => t && t.id).slice(0, MAX_TO);
  if (!trimmed.length) return false;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trimmed));
    memTo = null;
    return true;
  } catch {
    memTo = trimmed.slice();
    return false;
  }
}

/** Consume-ONCE: trả tờ đã gửi rồi dọn cả hai nguồn. Không có gì → []. */
export function nhanToTuChang(): ToBanVe[] {
  let items: ToBanVe[] = [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      sessionStorage.removeItem(KEY);
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed.filter(
          (p): p is ToBanVe =>
            !!p && typeof p === 'object' && typeof (p as ToBanVe).id === 'string',
        );
      }
    }
  } catch {
    /* storage hỏng/JSON hỏng — rơi xuống fallback bộ nhớ */
  }
  if (!items.length && memTo) items = memTo;
  memTo = null;
  return items;
}

/* ── ⑤ SỔ DẤU VẾT NGUỒN (2D ghi · Present đọc) ─────────────────────────────────────── */

/**
 * Present và 2D là HAI ROUTE — store 2D không hydrate ở `/present-editor`, nên Present KHÔNG đọc
 * được `Doc` để tự tính dấu vết. Chặng nguồn ghi dấu vết hiện hành vào sổ này mỗi lần nội dung
 * đổi; Present đọc sổ để biết tờ đã cũ chưa.
 *
 * Dùng `localStorage` (không phải sessionStorage): dấu vết phải sống qua lần tải lại trang, còn
 * tờ thì không. Đây là DẤU VẾT của nội dung nguồn — thuộc dự án, không phải cách-bày-trên-màn.
 * Đọc/ghi hỏng ⇒ trả `null` ⇒ `trangThaiNguon` cho ra 'khong-ro', KHÔNG đoán thành 'hien-hanh'.
 */
const KEY_DAU_VET = 'interiorflow.dauVetNguon';

function docSo(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY_DAU_VET);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* storage hỏng — coi như sổ rỗng */
  }
  return {};
}

/** Chặng nguồn gọi mỗi khi nội dung đổi. Trả `false` nếu không ghi được (storage hỏng/đầy). */
export function ghiDauVetNguon(docId: string, dauVet: string): boolean {
  if (!docId) return false;
  try {
    const so = docSo();
    if (so[docId] === dauVet) return true;
    so[docId] = dauVet;
    localStorage.setItem(KEY_DAU_VET, JSON.stringify(so));
    return true;
  } catch {
    return false;
  }
}

/** Present gọi để biết nguồn HIỆN GIỜ ra sao. `null` = không đọc được ⇒ 'khong-ro'. */
export function docDauVetNguon(docId: string): string | null {
  if (!docId) return null;
  return docSo()[docId] ?? null;
}

/** Có tờ đang chờ nhận không — KHÔNG tiêu thụ (dùng để hiện huy hiệu trên nút). */
export function coToDangCho(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return true;
  } catch {
    /* bỏ qua — xem fallback */
  }
  return !!memTo && memTo.length > 0;
}
