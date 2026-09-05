'use client';

/**
 * lib/danh-tinh-phien.ts — GIEO ĐỊNH DANH TỪ PHIÊN MÁY CHỦ vào bộ đệm cục bộ.
 *
 * ⛔ BỆNH ĐÃ CHỮA (P0 mất dữ liệu, 04/09): người dùng ĐANG ĐĂNG NHẬP hợp lệ mở THẲNG một
 * route studio (`/projects/[id]/cad`, `/projects/[id]/present` — tab mới, bookmark, F5) rồi
 * làm việc. `lastUserId` trong localStorage rỗng vì trình duyệt đó chưa từng đi qua Home
 * hay màn đăng nhập ⇒ `getLastUserId()` trả null ⇒ `CadSheets`/`PresentSheets`/autosave 3D
 * rơi vào nhánh "thuần in-memory" ⇒ **KHÔNG ghi một byte nào xuống IndexedDB, và KHÔNG báo lỗi.**
 *
 * GỐC BỆNH KHÔNG PHẢI THIẾU THÔNG TIN — máy chủ BIẾT người này là ai (cookie phiên hợp lệ,
 * `/api/auth/me` trả 200 kèm user). Gốc bệnh là **lưu trữ neo vào nguồn YẾU (localStorage)
 * trong khi nguồn MẠNH (phiên máy chủ) nằm ngay đó.** Nên chữa ở TẦNG NGUỒN:
 *
 *   · phiên máy chủ = NGUỒN SỰ THẬT của định danh
 *   · `interiorflow.lastUserId` (localStorage) = BỘ ĐỆM của nguồn đó
 *
 * ⚠️ CẤM VÁ ĐIỂM. Đây là lần thứ ba cùng họ bệnh (⌘Z, Delete đều từng vá điểm rồi mọc lại).
 * TUYỆT ĐỐI không thêm một chỗ gọi `getLastUserId()` nào nữa để "chữa" chỗ mới — mọi đường tiêu
 * thụ đã có sẵn tự đúng khi bộ đệm được gieo. Đường nào ĐỌC MỘT LẦN lúc mount (3 đường GHI dưới
 * đây) thì dùng `danhTinhChoLuot()`, đừng tự chế cách chờ riêng.
 *
 * 🔒 KHÔNG ĐỔI HÌNH DẠNG KHOÁ. Vẫn đúng `interiorflow.lastUserId`, vẫn đúng một chuỗi id trần
 * (`lib/resume.ts`). Dữ liệu cũ đọc lại được nguyên vẹn, không cần bảng nâng cấp.
 *
 * ⛔ THÀ KHÔNG LƯU CÒN HƠN LƯU NHẦM CHỖ NGƯỜI KHÁC: chỉ ghi khi máy chủ khẳng định 200 + có
 * `user.id`. 401 (chưa đăng nhập) · 503 (hạ tầng lỗi, `SessionWatch` lo báo) · mạng đứt · hết giờ
 * · JSON hỏng ⇒ KHÔNG ghi gì, KHÔNG ném lỗi, app chạy tiếp y như cũ.
 */

import { getLastUserId, setLastUserId, clearLastUserId } from './resume';

/**
 * HẠN HỎI MÁY CHỦ. Có timeout là BẮT BUỘC: ba đường ghi `await` hàm này trước khi khôi phục
 * sheet, nên máy chủ treo mà không có hạn giờ sẽ **biến một lỗi mất-dữ-liệu thành một lỗi
 * treo-app** — đổi bệnh chứ không chữa bệnh.
 *
 * Vì sao 8 giây chứ không phải 1-2: hết giờ ⇒ rơi về nhánh không-có-user ⇒ **mất dữ liệu**, đúng
 * thứ đang chữa. Còn đợi lâu chỉ làm chậm lượt khôi phục sheet — mà đường đó vốn đã bất đồng bộ
 * (`loadSheets` + `ensureProjectScope` cũng chờ mạng). Nên cán cân cố ý lệch về phía KIÊN NHẪN:
 * đủ rộng để máy chủ chậm/khởi động nguội không bao giờ chạm, vẫn có trần để không treo vĩnh viễn.
 * ⚠️ Hạ số này xuống là ĐÁNH ĐỔI LẤY RỦI RO MẤT DỮ LIỆU, không phải "tối ưu tốc độ".
 */
export const HAN_HOI_MS = 8000;

/** Kết quả một lượt giải định danh — đủ để test phân biệt "im lặng" với "ghi bừa". */
export type KetQuaDanhTinh =
  /**
   * Bộ đệm khớp với máy chủ — hoặc máy chủ không với tới nên đệm được dùng lại (đường lùi
   * local-first). `hoSo` CHỈ có ở vế thứ nhất: đường lùi không có bằng chứng nào từ máy chủ.
   */
  | { trangThai: 'da-co'; userId: string; hoSo?: unknown }
  /** Máy chủ xác nhận, vừa gieo vào bộ đệm. */
  | { trangThai: 'gieo-moi'; userId: string; hoSo?: unknown }
  /** Máy chủ nói rõ: chưa đăng nhập (401). Không ghi gì. */
  | { trangThai: 'chua-dang-nhap' }
  /** Không kết luận được (503 / mạng đứt / hết giờ / thân lạ). Không ghi gì. */
  | { trangThai: 'khong-ket-luan'; lyDo: string };

/** Bề mặt tối thiểu của `Response` mà lõi cần — để test không phải dựng `fetch` thật. */
export interface DapAnMayChu {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export interface PhuThuocDanhTinh {
  docDem: () => string | null;
  ghiDem: (userId: string) => void;
  hoiMayChu: (signal?: AbortSignal) => Promise<DapAnMayChu>;
  /** Chuông báo hết giờ. Test bơm đồng hồ giả để khỏi chờ thật / khỏi để lại timer treo. */
  chuongHetGio: () => Promise<void>;
  /** Cắt request khi hết giờ — không để kết nối mồ côi chạy tiếp. */
  cat?: () => void;
}

/**
 * LÕI THUẦN (test được bằng sucrase-node, không cần DOM/mạng/timer thật): đọc đệm trước, thiếu
 * thì hỏi máy chủ đúng MỘT lần rồi gieo. Mọi nhánh không chắc chắn đều KHÔNG ghi.
 */
export async function giaiDanhTinh(deps: PhuThuocDanhTinh): Promise<KetQuaDanhTinh> {
  /**
   * 🔴 BỘ ĐỆM KHÔNG ĐƯỢC LÀM TIẾNG NÓI CUỐI VỀ ĐỊNH DANH (sửa 04/09, cổng G1).
   *
   * BẢN CŨ trả về NGAY khi bộ đệm có giá trị, KHÔNG bao giờ đối chiếu với máy chủ. Đó là một
   * lỗ RÒ DỮ LIỆU CHÉO NGƯỜI DÙNG, đã tái hiện được trên app thật bằng hai đường độc lập
   * (`scripts/nghiem-thu-g1.mjs` CA4 và CA8):
   *
   *   A đăng xuất → B đăng nhập trên CÙNG trình duyệt → B vẽ trong DỰ ÁN CỦA CHÍNH B
   *   ⇒ nét vẽ ghi vào `<idA>::/cad-editor::<dự án của B>`.
   *
   * Không cần bơm lỗi gì cả — đó là đường đăng xuất/đăng nhập bình thường của một máy dùng
   * chung, và trong repo KHÔNG có chỗ nào xoá `interiorflow.lastUserId` lúc đăng xuất
   * (`clearLastUserId` trước 04/09 không tồn tại). Vi phạm thẳng bất biến "dữ liệu người A
   * KHÔNG BAO GIỜ vào kho người B".
   *
   * NAY: máy chủ LUÔN được hỏi để XÁC NHẬN, và tiếng nói của máy chủ THẮNG bộ đệm — đúng như
   * chính docstring đầu tệp này đã tuyên bố ("phiên máy chủ = NGUỒN SỰ THẬT, lastUserId = BỘ
   * ĐỆM của nguồn đó"). Bộ đệm lệch thì được GHI ĐÈ, tự chữa ngay trong lượt.
   *
   * ⚖️ CÁI GIÁ, nói thẳng: đường thường mất thêm MỘT request `/api/auth/me` mỗi tab (đã
   * single-flight, không nhân lên theo số nơi gọi). Chấp nhận được vì app VỐN ĐÃ gọi đúng
   * endpoint đó lúc nạp trang, và vì đổi lại là chặn hẳn một lỗi hỏng-âm-thầm ở hạng nặng
   * nhất. Đây KHÔNG phải hy sinh hiệu năng cho sự sạch sẽ — là hy sinh ~40ms để không ghi
   * việc của người này vào kho người kia.
   *
   * 🛟 VẪN GIỮ ĐƯỢC LOCAL-FIRST: máy chủ KHÔNG VỚI TỚI (mạng đứt · hết giờ · 503) thì bộ đệm
   * lại được dùng — lúc đó không có bằng chứng nào nói nó sai, và chặn ghi khi mất mạng sẽ
   * biến một app local-first thành app không dùng được offline. Còn khi máy chủ TRẢ LỜI ĐƯỢC
   * mà câu trả lời không mạch lạc (401 · thân hỏng · thiếu id) thì KHÔNG dùng bộ đệm nữa —
   * thà không ghi còn hơn ghi nhầm chỗ.
   */
  const dem = deps.docDem();

  type Dua =
    | { loai: 'dap'; r: DapAnMayChu }
    | { loai: 'loi' }
    | { loai: 'het-gio' };

  const dua: Dua = await Promise.race<Dua>([
    deps.hoiMayChu().then(
      (r) => ({ loai: 'dap', r }) as const,
      () => ({ loai: 'loi' }) as const,
    ),
    deps.chuongHetGio().then(() => ({ loai: 'het-gio' }) as const),
  ]);

  /** Máy chủ KHÔNG với tới ⇒ bộ đệm được dùng lại (giữ local-first, xem ghi chú 🛟 ở trên). */
  const luiVeDem = (lyDo: string): KetQuaDanhTinh =>
    dem ? { trangThai: 'da-co', userId: dem } : { trangThai: 'khong-ket-luan', lyDo };

  if (dua.loai === 'het-gio') {
    deps.cat?.();
    return luiVeDem('het-gio');
  }
  // Mạng đứt / máy chủ không với tới — KHÔNG kết luận là "chưa đăng nhập".
  if (dua.loai === 'loi') return luiVeDem('mang-dut');

  const dapAn = dua.r;
  // 503 = hạ tầng lỗi, người dùng VẪN đang đăng nhập hợp lệ (xem app/api/auth/me/route.ts).
  if (dapAn.status === 503) return luiVeDem('may-chu-loi');
  // 401 = máy chủ nói RÕ không có ai đăng nhập. Bộ đệm lúc này chắc chắn là rác của phiên
  // trước ⇒ TUYỆT ĐỐI không lui về nó, nếu không thì đúng lại lỗ CA4/CA8.
  if (!dapAn.ok) return { trangThai: 'chua-dang-nhap' };

  let than: unknown;
  try {
    than = await dapAn.json();
  } catch {
    // Máy chủ TRẢ LỜI ĐƯỢC nhưng thân hỏng — không phải ca offline, không lui về đệm.
    return { trangThai: 'khong-ket-luan', lyDo: 'than-hong' };
  }

  const u = (than as { user?: { id?: unknown } } | null)?.user;
  const id = typeof u?.id === 'string' ? u.id.trim() : '';
  if (!id) return { trangThai: 'khong-ket-luan', lyDo: 'thieu-id' };

  /**
   * 🔴 TRẢ LUÔN CẢ HỒ SƠ, KHÔNG CHỈ ID (D8, 04/09).
   *
   * Bản trước vứt `u` đi và chỉ giữ `id`. Hệ quả đo được trên app thật: bộ đệm được gieo mà
   * `useFlowStore.user` KHÔNG BAO GIỜ được đặt trên `/settings` · `/cad` · `/photo` (đo 12 s,
   * `store=null`), vì `getLastUserId()` đọc localStorage — KHÔNG phải state phản ứng, nên gieo
   * xong **không kích một lượt render nào**. Mọi chỗ đọc `effectiveUserId` ở THÂN RENDER đứng
   * yên ở giá trị null của lượt render đầu.
   *
   * Vì thân đáp án `/api/auth/me` VỐN ĐÃ mang đủ hồ sơ (id · email · name · credits · isAdmin ·
   * avatar), giữ lại nó là MIỄN PHÍ — không thêm request, không thêm vòng. Đây là điều kiện để
   * `danhTinhSanSang()` nạp được vào store, tức để bốn màn kia thôi phải tự hỏi máy chủ lần nữa.
   *
   * ⚠️ Lõi vẫn THUẦN: `hoSo` là `unknown` — lõi không biết `SessionUser` là gì, tầng vỏ mới ép
   * kiểu. Giữ được như thế thì `lib/danh-tinh-phien.test.ts` không phải kéo store vào.
   */
  // Máy chủ đã lên tiếng ⇒ tiếng nói của nó THẮNG. Đệm lệch (người trước còn sót) thì ghi đè,
  // tự chữa ngay trong lượt này — đây chính là chỗ vá lỗ rò chéo người dùng.
  if (id !== dem) {
    deps.ghiDem(id);
    return { trangThai: 'gieo-moi', userId: id, hoSo: u };
  }
  return { trangThai: 'da-co', userId: id, hoSo: u };
}

/** Một lượt duy nhất cho cả vòng đời tab — nhiều nơi gọi cũng chỉ MỘT request. */
let dangChay: Promise<KetQuaDanhTinh> | null = null;

/**
 * NẠP HỒ SƠ VÀO STORE — nửa còn thiếu của việc gieo định danh (D8, 04/09).
 *
 * ⛔ VÌ SAO PHẢI CÓ, và vì sao gieo bộ đệm KHÔNG đủ. `interiorflow.lastUserId` là localStorage:
 * ghi vào đó **không kích render**. Nên bộ đệm chỉ cứu được các đường ĐỌC-MỘT-LẦN-LÚC-MOUNT đã
 * `await danhTinhChoLuot()` (CadSheets · PresentSheets · autosave 3D · ResumeTracker ·
 * project-scope). Còn 12 chỗ đọc `effectiveUserId(storeUserId)` trong **THÂN RENDER** thì phụ
 * thuộc `useFlowStore.user` — đo trên app thật ngày 04/09: `/settings` · `/cad` · `/photo` chờ
 * 12 giây, `store.user` vẫn `null`. Chúng đứng yên ở lượt render đầu, vĩnh viễn.
 *
 * ⭐ ĐÂY LÀ CONNECT, KHÔNG PHẢI CƠ CHẾ THỨ BA. Trước lượt này app chạy BA đường đọc định danh
 * song song: `danhTinhSanSang` (chỉ gieo đệm) · `HomeScreen:423` · `PresentStageScreen:66` —
 * hai đường sau tự `fetch('/api/auth/me')` rồi `setUser`. Nay đường thứ nhất làm nốt phần
 * `setUser`, nên hai đường kia thành thừa và gỡ được. Số cơ chế đi TỪ BA XUỐNG MỘT.
 *
 * 🔒 BA CHỐT CHẶN, mỗi cái chặn một ca hỏng cụ thể:
 *  ① `import()` ĐỘNG, không import tĩnh — `lib/store.ts` kéo theo zustand + registry; import
 *    tĩnh sẽ lôi cả cụm đó vào `lib/danh-tinh-phien.test.ts` (chạy bằng sucrase-node, không DOM).
 *    Lõi `giaiDanhTinh` phải ở lại thuần.
 *  ② KHÔNG ghi đè khi store đã có ĐÚNG người đó — `/settings/avatar/page.tsx:39` `setUser` một
 *    hồ sơ MỚI HƠN (vừa đổi avatar); đè bằng bản `/api/auth/me` cũ là làm mất avatar vừa lưu.
 *  ③ Chỉ nạp khi máy chủ THỰC SỰ trả hồ sơ (`hoSo` chỉ tồn tại ở nhánh có đáp án 200). Đường
 *    lui-về-đệm lúc mất mạng KHÔNG có `hoSo` ⇒ không bịa ra một user từ mỗi cái id.
 */
async function napHoSoVaoStore(kq: KetQuaDanhTinh): Promise<void> {
  if (kq.trangThai !== 'da-co' && kq.trangThai !== 'gieo-moi') return;
  const hs = kq.hoSo as { id?: unknown } | null | undefined;
  if (!hs || typeof hs.id !== 'string' || !hs.id.trim()) return;
  try {
    const { useFlowStore } = await import('./store');
    const dangCo = useFlowStore.getState().user;
    if (dangCo?.id === hs.id) return; // chốt ② — đã đúng người, đừng đè bản mới bằng bản cũ
    useFlowStore.getState().setUser(hs as never);
  } catch {
    /* nạp module hỏng / store chưa sẵn — app chạy tiếp y như trước, không ném */
  }
}

/**
 * Gieo định danh cho tab hiện tại. Gọi được nhiều lần, nhiều nơi (single-flight).
 * Trả về promise để nơi nào CẦN CHẮC CHẮN có định danh thì `await` — thay vì đọc
 * `getLastUserId()` một phát rồi kết luận sai lúc vào thẳng URL.
 */
export function danhTinhSanSang(): Promise<KetQuaDanhTinh> {
  if (typeof window === 'undefined') {
    return Promise.resolve({ trangThai: 'khong-ket-luan', lyDo: 'khong-co-window' });
  }
  if (!dangChay) {
    const huy = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let hen: ReturnType<typeof setTimeout> | null = null;
    dangChay = giaiDanhTinh({
      docDem: getLastUserId,
      ghiDem: setLastUserId,
      hoiMayChu: () => fetch('/api/auth/me', huy ? { signal: huy.signal } : undefined),
      chuongHetGio: () =>
        new Promise<void>((res) => {
          hen = setTimeout(res, HAN_HOI_MS);
        }),
      cat: () => huy?.abort(),
    })
      .then(async (kq) => {
        // Nạp hồ sơ TRƯỚC khi promise này resolve: nơi nào `await danhTinhSanSang()` rồi đọc
        // store ngay sau đó (đường đọc-một-lần-lúc-mount) phải thấy store đã đầy, không phải
        // đợi thêm một microtask nữa — nếu không thì lại đúng cuộc chạy đua vừa chữa xong.
        await napHoSoVaoStore(kq);
        return kq;
      })
      .finally(() => {
        if (hen) clearTimeout(hen); // không để timer 8s giữ tab thức sau khi đã có câu trả lời
      });
  }
  return dangChay;
}

/**
 * DÙNG CHO ĐƯỜNG ĐỌC-MỘT-LẦN-LÚC-MOUNT (`CadSheets` · `PresentSheets` · autosave 3D).
 *
 * Vì sao ba đường đó KHÔNG tự lành khi chỉ gieo ở `AppChrome`: chúng đọc `getLastUserId()` ĐỒNG
 * BỘ trong effect mount với deps `[bucketId]`, mà `bucketId` lấy từ URL nên có sẵn ngay lượt
 * render đầu và KHÔNG BAO GIỜ đổi trên một deep-link ⇒ effect chạy đúng một lần. `AppChrome`
 * chạy trước nhưng chỉ KHỞI ĐỘNG request; `setLastUserId` xảy ra sau khi lượt flush effect đó
 * (gồm cả effect của chúng) đã chạy xong ⇒ thua cuộc chạy đua một cách TẤT ĐỊNH.
 *
 * `conSong` là cờ huỷ của chính lượt effect đó. ĐỔI DỰ ÁN GIỮA PHIÊN (`bucketId` đổi, component
 * KHÔNG remount) ⇒ effect cũ bị dọn ⇒ `conSong()` false ⇒ trả `tiepTuc:false` để lượt cũ DỪNG,
 * không ghi đè trạng thái của lượt mới. Không có cờ này thì lượt cũ chạy tiếp và nạp bản vẽ dự
 * án A xuống dưới URL dự án B.
 */
export async function danhTinhChoLuot(
  conSong: () => boolean,
): Promise<{ tiepTuc: boolean; userId: string | null }> {
  await danhTinhSanSang();
  if (!conSong()) return { tiepTuc: false, userId: null };
  return { tiepTuc: true, userId: getLastUserId() };
}

/** Quên lượt đã chạy để lượt sau hỏi lại máy chủ từ đầu. Dùng trong test VÀ ở `quenDangXuat()`. */
export function quenLuotDanhTinh(): void {
  dangChay = null;
}

/**
 * ⛔ GỌI Ở MỌI ĐƯỜNG ĐĂNG XUẤT PHÍA CLIENT — đóng khe "đăng xuất → mất mạng → người mới vẽ".
 *
 * Vì sao lớp thứ hai này CẦN dù `giaiDanhTinh()` đã cho máy chủ thắng bộ đệm: khi máy chủ KHÔNG
 * với tới (mạng đứt · hết giờ · 503) thì đường lui-về-đệm được dùng lại — đó là chỗ local-first
 * sống, và cố ý giữ. Nhưng nếu bộ đệm còn id người VỪA ĐĂNG XUẤT thì đúng lúc đó nó trỏ nhầm
 * người ⇒ việc của người mới rơi vào kho người cũ. Xoá bộ đệm ngay lúc đăng xuất làm cho đường
 * lui đó không còn gì sai để lui về: `getLastUserId()` trả null ⇒ chạy thuần bộ nhớ, không ghi.
 *
 * Hai việc, cố ý gói làm MỘT hàm để bốn nơi bấm Đăng xuất (`components/AccountMenu.tsx` ·
 * `components/MobileMenu.tsx` · `components/settings/AccountSettings.tsx` ·
 * `app/settings/_components/PixelSettingsShell.tsx`) không phải nhớ hai bước — nhớ một nửa là
 * đúng lại lỗ cũ:
 *   ① xoá bộ đệm định danh (localStorage + đường lùi trong bộ nhớ);
 *   ② quên lượt giải định danh của tab. Đăng xuất/đăng nhập trong SPA KHÔNG tải lại trang, nên
 *      không có bước này thì lượt cũ (đã resolve với người cũ) nằm lì cả vòng đời tab và tab đó
 *      không bao giờ hỏi lại máy chủ nữa.
 *
 * KHÔNG gọi mạng, KHÔNG ném lỗi — chạy được cả khi localStorage bị chặn hẳn.
 */
export function quenDangXuat(): void {
  clearLastUserId();
  quenLuotDanhTinh();
}
