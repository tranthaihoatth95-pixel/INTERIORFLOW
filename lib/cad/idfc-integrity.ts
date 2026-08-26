/**
 * lib/cad/idfc-integrity.ts — `IDFC-MANIFEST-INTEGRITY-001` (26/08).
 *
 * ── VÌ SAO KHÔNG BỌC `.idfc` THÀNH ZIP ─────────────────────────────────────────────────────────
 * `.ifpack` là ZIP có `manifest.json` + sha256 mỗi tệp — đúng khuôn cho một GÓI NHIỀU TỆP. `.idfc`
 * là **một tệp JSON** cho MỘT mẫu. Bọc nó thành ZIP là đổi định dạng và đổi phần mở rộng, mà
 * Hoà đã chốt: *"Không sửa format/extension tùy tiện."* Và mọi `.idfc` đang nằm trên đĩa người
 * dùng sẽ thành thứ bản mới không mở được — đắt hơn nhiều lần cái nó mua.
 *
 * ⇒ Manifest của một-tệp là **một khoá thêm vào chính tệp đó**: `meta.integrity`. Additive tuyệt
 * đối — `.idfc` cũ không có khoá này vẫn mở y nguyên, và bản IF cũ gặp khoá này cũng không sao
 * (nó rơi vào túi khoá lạ của `IDFC-INTEGRITY-001`, được giữ và trả lại đúng chỗ).
 *
 * ── MỘT HỆ BĂM, KHÔNG HAI ──────────────────────────────────────────────────────────────────────
 * Dùng `sha256Hex`/`sha256Text` của `lib/cad/sha256.ts` — CHÍNH hàm mà `ifpack.ts` dùng (nó đã
 * được dời ra đó cho lát này, không phải chép). Luật 6.
 *
 * ── NGỮ NGHĨA KIỂM: CẢNH BÁO, KHÔNG CHẶN ───────────────────────────────────────────────────────
 * Giống `restoreIfpack` (`integrityWarnings`, *"KHÔNG chặn phục hồi"*): hash lệch thì **nói to**,
 * nhưng vẫn cho mở. Từ chối mở một tệp vì hash lệch là biến một nghi ngờ thành một mất mát chắc
 * chắn — người dùng còn cứu được dữ liệu thì phải để họ cứu. Cái phải chặn là **im lặng**.
 *
 * ── VÌ SAO HÀM RIÊNG, KHÔNG NHÉT VÀO `importIdfc`/`exportIdfc` ─────────────────────────────────
 * `crypto.subtle.digest` là **async**. `importIdfc`/`exportIdfc` là sync và có hàng chục nơi gọi;
 * biến chúng thành async là sửa cả một vùng vì một tính năng tuỳ chọn. Nên: ký/kiểm là hai hàm
 * async riêng, gọi ở ranh giới xuất/nhập tệp. Đường sync cũ không đổi một dòng.
 */

import { sha256Text } from './sha256';
import { IDFC_APP_VERSION, IDFC_VERSION } from './idfc';

export const IDFC_INTEGRITY_ALGO = 'sha256' as const;

/** Xuất xứ: tệp này SINH RA TỪ đâu. `undefined` = không khai — KHÔNG suy diễn hộ. */
export interface IdfcNguon {
  /** loại nguồn, vd 'photo' | 'manufacturer-import' | 'library' | 'hand'. */
  kind: string;
  /** tham chiếu trong hệ nguồn (assetId, mã nhà sản xuất, đường dẫn…). */
  ref: string;
  /** sha256 của chính hiện vật nguồn, nếu biết. */
  sha256?: string;
}

export interface IdfcIntegrity {
  algo: typeof IDFC_INTEGRITY_ALGO;
  /** sha256 của phần NỘI DUNG đã chuẩn hoá — xem `chuoiChuanHoa`. */
  contentHash: string;
  hashedAt: string; // ISO 8601
  /** bản IF đã ký. Lệch bản KHÔNG phải lỗi — chỉ là thông tin cho người đọc. */
  appVersion: string;
  /** phiên bản định dạng lúc ký. Lệch ⇒ cảnh báo riêng, không lẫn với "bị sửa". */
  idfcVersion: number;
  nguon?: IdfcNguon;
}

export type TrangThaiToanVen =
  /** có khối integrity, hash khớp. */
  | 'khop'
  /** có khối integrity, hash LỆCH — nội dung đã đổi sau khi ký. */
  | 'lech'
  /** không có khối integrity — tệp cũ hoặc tệp chưa ký. **KHÔNG phải lỗi.** */
  | 'khong-co'
  /** khối integrity có nhưng hỏng/thiếu trường/thuật toán lạ — không kết luận được. */
  | 'khong-doc-duoc';

export interface KetQuaToanVen {
  trangThai: TrangThaiToanVen;
  /** Cảnh báo cho người dùng. Rỗng ⇒ không có gì để nói. KHÔNG chặn mở tệp. */
  canhBao: string[];
  hashKhai?: string;
  hashTinhLai?: string;
  nguon?: IdfcNguon;
}

/**
 * Chuỗi CHUẨN HOÁ để băm — quyết định quan trọng nhất của tệp này.
 *
 * Băm phải phủ **nội dung**, không phủ **cách viết**. Nếu băm thẳng chuỗi JSON gốc thì đổi thứ tự
 * khoá hay thêm một khoảng trắng cũng thành "bị sửa" — cảnh báo giả, và cảnh báo giả thì người
 * dùng học cách bỏ qua đúng cái cảnh báo mình vừa dựng lên (bài học F-02 trong sổ sai lầm).
 *
 * Nên: sắp khoá theo thứ tự tất định ở mọi cấp, và LOẠI ba thứ:
 *   · `meta.integrity`  — không thể tự băm chính mình;
 *   · `meta.modifiedAt` — `exportIdfc` đóng dấu lại mỗi lần ghi; đưa vào là hash lệch mọi lần lưu
 *                          dù nội dung y hệt;
 *   · `meta.x`          — túi VẬN CHUYỂN nội bộ, không phải nội dung (nó được rải về cấp gốc lúc
 *                          ghi ra, và chính những khoá đó ĐÃ nằm trong phần băm ở cấp gốc rồi —
 *                          băm cả hai là băm trùng).
 */
export function chuoiChuanHoa(file: Record<string, unknown>): string {
  const sap = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sap);
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const ra: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) {
        if (o[k] === undefined) continue;
        ra[k] = sap(o[k]);
      }
      return ra;
    }
    return v;
  };
  const { meta, ...conLai } = file;
  const m = { ...((meta as Record<string, unknown>) ?? {}) };
  delete m.integrity;
  delete m.modifiedAt;
  delete m.x;
  return JSON.stringify(sap({ ...conLai, meta: m }));
}

/**
 * KÝ: nhận chuỗi JSON `.idfc` (thứ `exportIdfc` trả về), trả chuỗi JSON có thêm `meta.integrity`.
 * Chuỗi vào không parse được ⇒ trả **nguyên văn** chuỗi vào. Không ném: ký là việc tuỳ chọn,
 * hỏng thì mất một khối siêu dữ liệu, không được làm mất tệp của người dùng.
 */
export async function kyIdfc(json: string, nguon?: IdfcNguon): Promise<string> {
  let file: Record<string, unknown>;
  try {
    const p = JSON.parse(json);
    if (!p || typeof p !== 'object' || Array.isArray(p)) return json;
    file = p as Record<string, unknown>;
  } catch {
    return json;
  }
  const meta = { ...((file.meta as Record<string, unknown>) ?? {}) };
  delete meta.integrity; // ký lại thì thay dấu cũ, không chồng lên
  const goc: Record<string, unknown> = { ...file, meta };

  const integrity: IdfcIntegrity = {
    algo: IDFC_INTEGRITY_ALGO,
    contentHash: await sha256Text(chuoiChuanHoa(goc)),
    hashedAt: new Date().toISOString(),
    appVersion: IDFC_APP_VERSION,
    idfcVersion: typeof file.idfcVersion === 'number' ? file.idfcVersion : IDFC_VERSION,
    ...(nguon ? { nguon } : {}),
  };
  return JSON.stringify({ ...goc, meta: { ...meta, integrity } });
}

/**
 * KIỂM: nhận chuỗi JSON `.idfc`, nói tệp này còn nguyên vẹn không. **Không bao giờ ném.**
 */
export async function kiemToanVenIdfc(json: string): Promise<KetQuaToanVen> {
  let file: Record<string, unknown>;
  try {
    const p = JSON.parse(json);
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      return { trangThai: 'khong-doc-duoc', canhBao: ['Tệp không phải một đối tượng JSON — không kiểm được toàn vẹn.'] };
    }
    file = p as Record<string, unknown>;
  } catch {
    // Tệp hỏng đã có `importIdfc` nói lý do; ở đây chỉ khai KHÔNG KẾT LUẬN ĐƯỢC, không nói "bị sửa".
    return { trangThai: 'khong-doc-duoc', canhBao: ['Tệp không phải JSON hợp lệ — không kiểm được toàn vẹn.'] };
  }

  const meta = (file.meta as Record<string, unknown>) ?? {};
  const it = meta.integrity as Partial<IdfcIntegrity> | undefined;

  if (!it || typeof it !== 'object') {
    // Tệp CHƯA KÝ. Đây là trạng thái bình thường của mọi `.idfc` sinh trước lát này — tuyệt đối
    // không được báo như nghi vấn giả mạo, nếu không mọi tệp cũ đều kêu và cảnh báo mất giá.
    return { trangThai: 'khong-co', canhBao: [] };
  }
  if (it.algo !== IDFC_INTEGRITY_ALGO || typeof it.contentHash !== 'string' || !it.contentHash) {
    return {
      trangThai: 'khong-doc-duoc',
      canhBao: [`Khối toàn vẹn dùng thuật toán lạ hoặc thiếu hash ("${String(it.algo)}") — bản IF này không kiểm được.`],
      nguon: it.nguon,
    };
  }

  const tinhLai = await sha256Text(chuoiChuanHoa(file));
  const canhBao: string[] = [];

  // Lệch phiên bản định dạng: THÔNG TIN, không phải giả mạo. Tách bạch để người đọc không kết
  // luận nhầm — đây đúng là chỗ dễ gộp bừa hai chuyện khác nhau thành một câu doạ.
  if (typeof it.idfcVersion === 'number' && typeof file.idfcVersion === 'number' && it.idfcVersion !== file.idfcVersion) {
    canhBao.push(
      `Tệp được ký ở định dạng v${it.idfcVersion} nhưng nay mang v${file.idfcVersion} — nhiều khả năng do nâng cấp định dạng, không phải bị sửa nội dung.`,
    );
  }

  if (tinhLai !== it.contentHash) {
    canhBao.push(
      'Nội dung KHÔNG khớp dấu toàn vẹn đã ký — tệp đã bị sửa sau khi ký, hoặc hỏng khi chép/tải. ' +
        'Vẫn mở được, nhưng đừng tin số liệu trong đó cho tới khi đối chiếu lại với nguồn.',
    );
    return { trangThai: 'lech', canhBao, hashKhai: it.contentHash, hashTinhLai: tinhLai, nguon: it.nguon };
  }
  return { trangThai: 'khop', canhBao, hashKhai: it.contentHash, hashTinhLai: tinhLai, nguon: it.nguon };
}
