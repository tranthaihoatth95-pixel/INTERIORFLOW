/**
 * lib/capabilities/xuat-xu-ben.ts — GHI BỀN `XuatXu` khi người bấm **Nhận**.
 *
 * ── BÀI TOÁN ĐÃ ĐO ────────────────────────────────────────────────────────────────────────────
 * `visual-generate.ts` khai `XuatXu` — cấu trúc xuất xứ đầy đủ nhất repo. Nhưng `nguon-anh.ts`
 * giữ kết quả trong **state module = RAM**: F5 là mất sạch. Trong khi `/api/jobs` đã **trừ tiền
 * bền vào DB**. Tiền bền mà kết quả bay hơi là một lời hứa gãy — người dùng trả tiền cho một thứ
 * không còn tồn tại sau khi tải lại trang.
 *
 * ── VÌ SAO GIỮ `XuatXu`, KHÔNG GIỮ ẢNH ────────────────────────────────────────────────────────
 * Ảnh là dataURL base64, hàng trăm KB–vài MB. Nhồi vào localStorage là **vỡ quota** (trần ~5MB
 * cho cả origin) — và vỡ quota nghĩa là mất luôn những thứ khác đang lưu ở đó (`demo-spine.ts`,
 * `tool-mode-ui.ts`). `XuatXu` thì vài trăm byte. Nên: **giữ xuất xứ, ảnh chỉ giữ THAM CHIẾU.**
 * Mọi `data:` URL bị LƯỢC trước khi ghi, và việc lược được GHI LẠI (`anhNguonLuoc`) chứ không
 * làm im — dữ liệu bị cắt mà không khai là dữ liệu nói dối.
 *
 * ── VÌ SAO HAI TẦNG, VÀ VÌ SAO KHÔNG ĐẺ BẢNG MỚI ──────────────────────────────────────────────
 * Đã khảo sát ba đường (không mở lại):
 *  (a) **localStorage** theo khuôn `persist()` thủ công đang chạy ở `lib/studio/demo-spine.ts`.
 *      RẺ NHẤT: không mạng, không đăng nhập, không schema. **KHÔNG qua được ca "đổi máy / xoá dữ
 *      liệu duyệt web"** — khai thẳng, xem `NOT ASSESSED` trong báo cáo.
 *  (b) **`ProjectFile`** qua `app/api/project-files` — **LOẠI**, hai lý do đo được:
 *      ① route sniff MAGIC BYTES (`_lib/luu-file.ts`) và chỉ nhận PNG/JPEG/WEBP/GIF/AVIF/PDF ⇒
 *         một khối JSON xuất xứ ăn `415`; ② `ProjectFile` bắt buộc `projectId`, mà sổ nguồn
 *      (`nguon-anh.ts`) **cố ý không biết project nào** — nó là sổ của cách-bày-trên-màn.
 *      Cả hai chỉ chữa được bằng cách sửa route, mà route nằm ngoài phạm vi ghi của lát này.
 *  (c) **`AssetRepresentation`** qua `app/api/asset-representation` (route ĐÃ CÓ, không migrate):
 *      cột `provenance` được khai nguyên văn là *"Nguồn gốc: sinh từ đâu, bằng năng lực nào,
 *      tham số gì (JSON chuỗi)"* — đúng chỗ dành cho `XuatXu`; `payloadRef` được khai là *"trỏ
 *      tới nơi chứa nội dung thật… KHÔNG nhúng payload nặng vào cột"* — đúng luật giữ tham chiếu.
 *      Đây là tầng **sống qua đổi máy**.
 *
 * ⚠️ GIỚI HẠN THẬT của tầng (c), khai trước khi ai đó tin nhầm: route bắt `assetId` phải là một
 *    `LibraryAsset` **đang tồn tại** (nó cố ý không bao giờ tạo asset). Xuất xứ chỉ mang
 *    `nguon.id`, và **đường chạy hôm nay (`StageToolbelt.tsx` → `chayDungHinhAnh`) KHÔNG truyền
 *    `nguonId`** ⇒ trong sản phẩm hiện tại tầng (c) **chưa bao giờ nổ**. Nó được viết và được
 *    chứng minh trên runtime thật để sẵn sàng cho ngày Toolbelt truyền `nguonId`; hôm nay nó là
 *    một nhánh ĐÚNG nhưng NGUỘI. Ai nối `nguonId` vào là tầng bền xuyên máy sống ngay, không phải
 *    sửa file này.
 *
 * ── CỜ ────────────────────────────────────────────────────────────────────────────────────────
 * `IF_PERSIST_XUATXU=1`. **Cờ chưa đặt ⇒ không ghi một byte nào**, hành vi y hệt hôm nay.
 * ⚠️ Đây là mã CHẠY TRÊN MÁY NGƯỜI DÙNG. Next chỉ nhúng `NEXT_PUBLIC_*` vào gói client, nên
 * `process.env.IF_PERSIST_XUATXU` **đọc được ở node/test/SSR/Electron nhưng KHÔNG đọc được trong
 * trình duyệt**. Vì vậy cờ được tra ở ba chỗ, theo thứ tự, và khai rõ ra đây thay vì để phiên sau
 * phát hiện bằng cách bật cờ mà không thấy gì xảy ra.
 *
 * ── GHI HỎNG THÌ SAO ──────────────────────────────────────────────────────────────────────────
 * **Không được làm rơi luồng nhận ảnh** (người bấm Nhận là phải nhận được), nhưng cũng **không
 * được nuốt im lặng**. Repo đã trả giá cho việc nuốt lỗi im lặng — xem `SessionState` ở
 * `lib/server/auth.ts:123`: ở đó lỗi hạ tầng từng bị trộn vào "chưa đăng nhập" và đá người dùng
 * về màn đăng nhập. Nên mọi sự cố ghi đi ra một **đường báo** (`subscribeSuCoGhi`) và đọng lại ở
 * `suCoGhiGanNhat()`, còn hàm ghi thì **không bao giờ ném**.
 *
 * Import TƯƠNG ĐỐI, không alias `@/` — bộ chạy test là `sucrase-node`, nó không đọc `paths`.
 */

import type { XuatXu } from './visual-generate';

/** Khoá localStorage. `v1` nằm trong khoá: đổi hình dạng bản ghi thì đổi khoá, không đọc nhầm. */
export const KHOA_LUU = 'if.xuatXu.v1';

/** Trần số bản ghi giữ tại chỗ. Xuất xứ nhẹ, nhưng không có gì được phép phình vô hạn. */
export const TRAN_BAN_GHI = 50;

/** Đường gọi tầng (c). Đổi được để proof/test trỏ vào server thật — xem `datGocApi()`. */
const DUONG_API = '/api/asset-representation';
let gocApi = '';

/**
 * Đặt gốc URL cho tầng (c). CHỈ dùng cho proof/test chạy ngoài trình duyệt (node không có URL
 * tương đối). Trong app để trống ⇒ gọi cùng origin, đúng như mọi `fetch` khác của repo.
 */
export function datGocApi(goc: string) {
  gocApi = goc.replace(/\/+$/, '');
}

/* ─────────────────────────── cờ ─────────────────────────── */

function moiTruong(ten: string): string | undefined {
  // `process` không tồn tại trong một số môi trường trình duyệt — hỏi trước khi chạm.
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.[ten];
}

/**
 * Cờ có đang bật không. Ba nguồn, theo thứ tự — **mọi nguồn đều phải là chuỗi `'1'`**, không nhận
 * `'true'`/`'yes'`: một tập giá trị là một cửa để lệch.
 *   ① `IF_PERSIST_XUATXU`            — node · test · SSR · Electron main.
 *   ② `NEXT_PUBLIC_IF_PERSIST_XUATXU` — nguồn DUY NHẤT Next nhúng được vào gói trình duyệt.
 *   ③ `globalThis.__IF_PERSIST_XUATXU` — bật tại chỗ khi soi trên runtime, không phải rebuild.
 */
export function coBatPersist(): boolean {
  if (moiTruong('IF_PERSIST_XUATXU') === '1') return true;
  if (moiTruong('NEXT_PUBLIC_IF_PERSIST_XUATXU') === '1') return true;
  return (globalThis as { __IF_PERSIST_XUATXU?: unknown }).__IF_PERSIST_XUATXU === '1';
}

/* ─────────────────────────── đường báo sự cố ─────────────────────────── */

export type NoiGhi = 'cucBo' | 'mayChu';

export interface SuCoGhi {
  readonly noi: NoiGhi;
  /** Mã ngắn, ổn định — để chỗ khác phân nhánh được mà không phải so chuỗi tiếng người. */
  readonly ma: 'khong-co-kho' | 'quota' | 'hong' | 'mang' | 'tu-choi';
  /** Câu người đọc được. Không bao giờ rỗng — im lặng là thứ mục này sinh ra để chống. */
  readonly loi: string;
  readonly luc: number;
}

const nguoiNgheSuCo = new Set<(s: SuCoGhi) => void>();
let suCoCuoi: SuCoGhi | null = null;

/** Đăng ký nghe sự cố ghi. Giao diện muốn hiện một dòng "chưa lưu được xuất xứ" thì cắm vào đây. */
export function subscribeSuCoGhi(f: (s: SuCoGhi) => void): () => void {
  nguoiNgheSuCo.add(f);
  return () => nguoiNgheSuCo.delete(f);
}

/** Sự cố gần nhất, hoặc `null` nếu chưa có. Đọc được ngay cả khi không ai kịp `subscribe`. */
export function suCoGhiGanNhat(): SuCoGhi | null {
  return suCoCuoi;
}

/** Xoá vết sự cố — dùng trong test và khi người dùng đã xử lý xong. */
export function xoaSuCoGhi() {
  suCoCuoi = null;
}

function bao(noi: NoiGhi, ma: SuCoGhi['ma'], loi: string): SuCoGhi {
  const s: SuCoGhi = { noi, ma, loi, luc: Date.now() };
  suCoCuoi = s;
  for (const f of nguoiNgheSuCo) {
    // Người nghe hỏng KHÔNG được làm hỏng đường báo cho người nghe kế tiếp.
    try {
      f(s);
    } catch {
      /* bỏ qua có chủ đích — xem câu trên */
    }
  }
  return s;
}

/* ─────────────────────────── bản ghi ─────────────────────────── */

export interface BanGhiXuatXu {
  /** Id của đề xuất đã nhận — cùng id `DeXuatHinhAnh.id`, để nối lại được với khay. */
  readonly id: string;
  readonly ghiLuc: number;
  /** Tham chiếu tới ảnh kết quả. `data:` URL bị lược thành `''` — xem `anhKetQuaLuoc`. */
  readonly anhKetQua: string;
  readonly anhKetQuaLuoc?: boolean;
  /** Ảnh nguồn trong xuất xứ đã bị lược chưa (và mất bao nhiêu byte). */
  readonly anhNguonLuoc?: { readonly bytes: number };
  readonly xuatXu: XuatXu;
}

const laDataUrl = (s: unknown): s is string => typeof s === 'string' && s.startsWith('data:');

/**
 * Lược mọi `data:` URL khỏi xuất xứ. Trả về xuất xứ đã nhẹ + số byte đã bỏ (0 = không lược gì).
 * Thuần, không I/O — đây là chỗ luật "không nhồi base64" được thi hành, nên nó phải test được.
 */
export function luocAnhNang(x: XuatXu): { xuatXu: XuatXu; boBytes: number } {
  if (!laDataUrl(x.nguon.anh)) return { xuatXu: x, boBytes: 0 };
  const bytes = x.nguon.anh.length;
  const { anh: _bo, ...nguonConLai } = x.nguon;
  return { xuatXu: { ...x, nguon: nguonConLai }, boBytes: bytes };
}

/* ─────────────────────────── tầng (a) · localStorage ─────────────────────────── */

function kho(): Storage | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    return s ?? null;
  } catch {
    // Trình duyệt chặn site data thì chính việc CHẠM vào `localStorage` đã ném.
    return null;
  }
}

/**
 * Đọc danh sách bản ghi đã lưu. **Không bao giờ ném** và **không bao giờ vứt cả kho vì một bản
 * ghi hỏng**: bản ghi cũ thiếu trường được vá bằng giá trị rỗng, bản ghi không cứu được thì bị bỏ
 * qua riêng nó. Kho cũ hơn cấu trúc hôm nay là chuyện chắc chắn xảy ra, không phải ngoại lệ.
 */
export function docXuatXuBen(): BanGhiXuatXu[] {
  const s = kho();
  if (!s) return [];
  let tho: unknown;
  try {
    const raw = s.getItem(KHOA_LUU);
    if (!raw) return [];
    tho = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(tho)) return [];
  const ra: BanGhiXuatXu[] = [];
  for (const b of tho) {
    const chuan = chuanHoa(b);
    if (chuan) ra.push(chuan);
  }
  return ra;
}

/** Vá một bản ghi thô về đúng hình dạng. `null` = không cứu được (thiếu id hoặc thiếu xuất xứ). */
function chuanHoa(b: unknown): BanGhiXuatXu | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Record<string, unknown>;
  if (typeof o.id !== 'string' || !o.id) return null;
  if (!o.xuatXu || typeof o.xuatXu !== 'object') return null;
  const x = o.xuatXu as Record<string, unknown>;
  const nguonTho = (x.nguon && typeof x.nguon === 'object' ? x.nguon : {}) as Record<string, unknown>;
  const xuatXu = {
    nangLucId: typeof x.nangLucId === 'string' ? x.nangLucId : '',
    nguon: {
      id: typeof nguonTho.id === 'string' ? nguonTho.id : undefined,
      revision: typeof nguonTho.revision === 'string' ? nguonTho.revision : undefined,
      kieu: (typeof nguonTho.kieu === 'string' ? nguonTho.kieu : 'phac') as XuatXu['nguon']['kieu'],
      anh: typeof nguonTho.anh === 'string' ? nguonTho.anh : undefined,
    },
    chuoiLenh: Array.isArray(x.chuoiLenh) ? (x.chuoiLenh.filter((v) => typeof v === 'string') as string[]) : [],
    thamSo: x.thamSo && typeof x.thamSo === 'object' ? (x.thamSo as XuatXu['thamSo']) : {},
    provider: typeof x.provider === 'string' ? x.provider : undefined,
    model: typeof x.model === 'string' ? x.model : undefined,
    taoLuc: typeof x.taoLuc === 'number' ? x.taoLuc : 0,
    creditUocTinh: typeof x.creditUocTinh === 'number' ? x.creditUocTinh : 0,
    mucSuThat: (typeof x.mucSuThat === 'string' ? x.mucSuThat : 'inferred') as XuatXu['mucSuThat'],
    // Thứ nằm trong kho BỀN chỉ có thể là thứ người đã nhận — bản ghi cũ không khai thì suy ra
    // `daNhan`, KHÔNG suy ra `deXuat` (suy ngược lại là bịa ra một đề xuất chưa ai duyệt).
    trangThaiNhan: (typeof x.trangThaiNhan === 'string' ? x.trangThaiNhan : 'daNhan') as XuatXu['trangThaiNhan'],
  } as XuatXu;
  return {
    id: o.id,
    ghiLuc: typeof o.ghiLuc === 'number' ? o.ghiLuc : 0,
    anhKetQua: typeof o.anhKetQua === 'string' ? o.anhKetQua : '',
    anhKetQuaLuoc: o.anhKetQuaLuoc === true ? true : undefined,
    anhNguonLuoc:
      o.anhNguonLuoc && typeof o.anhNguonLuoc === 'object'
        ? { bytes: Number((o.anhNguonLuoc as { bytes?: unknown }).bytes) || 0 }
        : undefined,
    xuatXu,
  };
}

function ghiCucBo(ban: BanGhiXuatXu): SuCoGhi | null {
  const s = kho();
  if (!s) return bao('cucBo', 'khong-co-kho', 'Không có kho cục bộ (trình duyệt chặn hoặc chạy ngoài trình duyệt).');
  const cu = docXuatXuBen().filter((b) => b.id !== ban.id);
  const moi = [...cu, ban].slice(-TRAN_BAN_GHI);
  try {
    s.setItem(KHOA_LUU, JSON.stringify(moi));
    return null;
  } catch (e) {
    const ten = (e as { name?: string })?.name ?? '';
    const quota = /quota/i.test(ten) || /quota/i.test(String((e as Error)?.message ?? ''));
    return bao(
      'cucBo',
      quota ? 'quota' : 'hong',
      quota ? 'Kho cục bộ đầy — chưa lưu được xuất xứ.' : 'Không ghi được xuất xứ vào kho cục bộ.',
    );
  }
}

/* ─────────────────────────── tầng (c) · AssetRepresentation ─────────────────────────── */

/**
 * Gửi xuất xứ lên `/api/asset-representation`. Chỉ chạy khi xuất xứ mang `nguon.id` — route đòi
 * `assetId` có thật và **cố ý không bao giờ tạo `LibraryAsset`**.
 *
 * `truthLevel: 'inferred'` — CỐ Ý, không phải sơ suất. Luật cửa duyệt 03 ghi ở
 * `prisma/schema.prisma` (`AssetRepresentation.truthLevel`): *bấm "Nhận" KHÔNG tự nâng lên
 * `verified`; chỉ chiều nào người GÕ LẠI SỐ mới được `verified`*. Ở đây người mới chỉ chấp nhận
 * một tấm ảnh máy dựng — chưa ai đo lại gì.
 */
async function ghiMayChu(ban: BanGhiXuatXu): Promise<SuCoGhi | null> {
  const assetId = ban.xuatXu.nguon.id;
  if (!assetId) return null; // Không có danh tính để gắn vào — KHÔNG phải sự cố, chỉ là không áp dụng.
  try {
    const res = await fetch(`${gocApi}${DUONG_API}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        assetId,
        kind: 'image',
        // THAM CHIẾU, không phải payload: `data:` URL đã bị lược ở tầng trên nên chỗ này trỏ về
        // bản ghi cục bộ. Đúng chú thích cột `payloadRef` trong schema.
        payloadRef: ban.anhKetQua || `${KHOA_LUU}#${ban.id}`,
        truthLevel: 'inferred',
        provenance: JSON.stringify(ban.xuatXu),
      }),
    });
    if (res.ok) return null;
    const than = await res.text().catch(() => '');
    return bao('mayChu', 'tu-choi', `Máy chủ từ chối lưu xuất xứ (HTTP ${res.status}). ${than}`.trim());
  } catch (e) {
    return bao('mayChu', 'mang', `Không gửi được xuất xứ lên máy chủ: ${(e as Error)?.message ?? 'không rõ'}`);
  }
}

/* ─────────────────────────── cửa vào ─────────────────────────── */

export interface ThamSoGhi {
  readonly id: string;
  readonly xuatXu: XuatXu;
  /** Ảnh kết quả đã nhận. `data:` URL sẽ bị lược — kho bền giữ xuất xứ, không giữ ảnh. */
  readonly anhKetQua?: string;
}

export interface KetQuaGhi {
  /** `true` khi ÍT NHẤT tầng cục bộ ghi được. Cờ tắt ⇒ `false` với `boQua: 'co-tat'`. */
  readonly ok: boolean;
  readonly boQua?: 'co-tat';
  readonly cucBo?: SuCoGhi;
  readonly mayChu?: SuCoGhi;
  readonly banGhi?: BanGhiXuatXu;
}

/**
 * GHI BỀN một xuất xứ vừa được NHẬN. **Không bao giờ ném** — luồng nhận ảnh không được rơi vì
 * chuyện lưu trữ. Mọi hỏng hóc đi ra `subscribeSuCoGhi()`.
 */
export async function ghiXuatXuBen(p: ThamSoGhi): Promise<KetQuaGhi> {
  if (!coBatPersist()) return { ok: false, boQua: 'co-tat' };
  try {
    const { xuatXu, boBytes } = luocAnhNang(p.xuatXu);
    const anhTho = p.anhKetQua ?? '';
    const luocKetQua = laDataUrl(anhTho);
    const ban: BanGhiXuatXu = {
      id: p.id,
      ghiLuc: Date.now(),
      anhKetQua: luocKetQua ? '' : anhTho,
      anhKetQuaLuoc: luocKetQua || undefined,
      anhNguonLuoc: boBytes ? { bytes: boBytes } : undefined,
      xuatXu,
    };
    const scCucBo = ghiCucBo(ban);
    const scMayChu = await ghiMayChu(ban);
    return { ok: !scCucBo, cucBo: scCucBo ?? undefined, mayChu: scMayChu ?? undefined, banGhi: ban };
  } catch (e) {
    // Lưới cuối: bất cứ thứ gì chưa lường trước cũng KHÔNG được thoát ra ngoài hàm này.
    return { ok: false, cucBo: bao('cucBo', 'hong', `Lỗi không lường trước khi ghi xuất xứ: ${(e as Error)?.message ?? 'không rõ'}`) };
  }
}

/** Dọn kho — dùng trong test và khi người dùng muốn xoá vết. */
export function xoaXuatXuBen() {
  try {
    kho()?.removeItem(KHOA_LUU);
  } catch {
    /* không xoá được thì thôi — đây là thao tác dọn, không phải thao tác của người dùng cuối */
  }
}
