/**
 * lib/nodes/thi-hanh-lenh-cua.ts — **BỘ THI HÀNH cho lệnh trong cửa sổ công cụ**: lệnh nào đã có
 * dòng điện, lệnh nào chưa và **vì sao chưa**.
 *
 * 🔴 BÀI TOÁN NÓ GIẢI (đo 22/08): `MOI_TRUONG` khai **13 lệnh chuyên sâu**, và `CuaSoCongCu.tsx`
 * chỉ nối đúng **1** (`cua.anh.can-trang`). 12 lệnh còn lại hiện mờ với **một câu lý do dùng
 * chung**: *"chưa nối bộ thi hành"*. Câu đó đúng nhưng vô dụng — nó không nói người dùng đang
 * thiếu cái gì, và không nói phiên sau phải xây cái gì. §9 đòi *"lệnh chưa đủ điều kiện hiện mờ
 * KÈM LÝ DO"*; một lý do dùng chung cho 12 lệnh là lý do của cái danh sách, không phải của lệnh.
 *
 * ⭐ LUẬT TỆP NÀY GIỮ (có test canh, `cua-so-cong-cu.test.ts`):
 *   **MỌI lệnh khai trong `MOI_TRUONG` phải hoặc NẰM TRONG `LENH_DA_NOI`, hoặc CÓ LÝ DO RIÊNG
 *   trong `LY_DO_CHUA_NOI`.** Không lệnh nào được rơi vào đường mặc định. Thêm một lệnh vào bảng
 *   môi trường mà quên khai ở đây ⇒ **test đỏ**, không phải "ai đó nhớ ra rồi vá sau".
 *
 * ⛔ THÊM VÀO `LENH_DA_NOI` PHẢI ĐI KÈM BỘ THI HÀNH THẬT. Bảng này không phải danh sách "sắp
 * làm" — nó là danh sách "bấm vào thì có chuyện xảy ra".
 *
 * Thuần tính, không React/store, import TƯƠNG ĐỐI ⇒ chạy được bằng `sucrase-node` (bộ chạy test
 * của repo không phân giải alias `@/…` — cùng lý do đã ghi ở `cua-so-cong-cu.ts`).
 */

import { MOI_TRUONG, type MaMoiTruong } from './cua-so-cong-cu';

/* ────────────────────────────── CÁCH CHẠY ────────────────────────────── */

/**
 * · `sua-co-kiem-soat` — mở bảng Sửa có kiểm soát ngay trong thân cửa sổ (Trước/Sau + Nhận/Bỏ,
 *   `SuaCoKiemSoat.tsx`). Chỉ có nghĩa khi node đã CHẠY XONG và có ảnh kết quả.
 * · `xoay-tham-so`  — đảo sang giá trị kế của MỘT tham số select CÓ THẬT trên node. Không đẻ
 *   trạng thái mới: nó ghi thẳng vào `updateParam()` — cùng đường với `ParamField`, nên undo
 *   chung, lưu chung, không có bản sao nào để lệch. Đây là lý do nó "nối được ngay": engine đã
 *   có sẵn, thứ thiếu chỉ là một cái nút ĐÚNG CHỖ TAY ĐANG ĐẶT.
 */
export type CachChay =
  | { kieu: 'sua-co-kiem-soat' }
  | {
      kieu: 'xoay-tham-so';
      /** Lệnh chỉ sống được trên đúng khối này — khối khác thì mờ, kèm lý do nói rõ khối nào. */
      defType: string;
      /** id tham số trên `NodeDefinition.params` (bắt buộc là `kind:'select'`). */
      thamSo: string;
    };

/**
 * Lệnh ĐÃ CÓ DÒNG ĐIỆN. Bốn lệnh, và cả bốn đều tựa vào engine đã tồn tại trong repo — không
 * lệnh nào phải viết engine mới cho phiếu này ([Đ2] nhìn vào trong trước):
 *
 *  · `cua.anh.can-trang`        → `lib/render-studio/controlled-edit.ts` (P0 20/08, giữ nguyên)
 *  · `cua.ba-chieu.tieu-cu`     → tham số `lens`  của `three.camera`   (`CAMERA_LENSES`)
 *  · `cua.ba-chieu.gan-vat-lieu`→ tham số `theme` của `three.cad2fbx`  (`CAD_THEMES`)
 *  · `cua.video.doi-nhip`       → tham số `duration` của `ai.image2video` (`VIDEO_DURATIONS`)
 */
export const LENH_DA_NOI: Readonly<Record<string, CachChay>> = {
  'cua.anh.can-trang': { kieu: 'sua-co-kiem-soat' },
  'cua.ba-chieu.tieu-cu': { kieu: 'xoay-tham-so', defType: 'three.camera', thamSo: 'lens' },
  'cua.ba-chieu.gan-vat-lieu': { kieu: 'xoay-tham-so', defType: 'three.cad2fbx', thamSo: 'theme' },
  'cua.video.doi-nhip': { kieu: 'xoay-tham-so', defType: 'ai.image2video', thamSo: 'duration' },
};

/**
 * Lệnh CHƯA nối — mỗi lệnh MỘT lý do RIÊNG, nói đúng thứ đang thiếu.
 *
 * Viết theo khuôn *"thiếu X"* chứ không *"chưa làm"*: câu thứ nhất cho người dùng biết có nên
 * chờ hay đi đường khác, câu thứ hai chỉ cho biết có người lười. Giữ ≤ 12 từ theo
 * `SPEC-NGON-NGU-CHI-DAN`.
 */
export const LY_DO_CHUA_NOI: Readonly<Record<string, { vi: string; en: string }>> = {
  // ── Ảnh: 3 lệnh cần một mô hình LỚP thật, IF chưa có (ảnh hiện là một tấm phẳng một tầng).
  'cua.anh.them-lop': { vi: 'Cần hệ lớp ảnh — ảnh hiện chỉ một tầng', en: 'Needs an image layer stack — images are flat today' },
  'cua.anh.gop-lop': { vi: 'Cần hệ lớp ảnh — chưa có lớp nào để gộp', en: 'Needs an image layer stack — no layers to merge yet' },
  'cua.anh.che-do-hoa': { vi: 'Cần hệ lớp ảnh — chế độ hoà áp giữa hai lớp', en: 'Needs an image layer stack — blending needs two layers' },
  'cua.anh.duong-cong': { vi: 'Cần bảng đường cong — nay mới có cân trắng', en: 'Needs a curves editor — only white balance exists' },
  'cua.anh.chon-thong-minh': { vi: 'Chọn thông minh sống ở khối Tách vùng, chưa gọi từ đây', en: 'Smart select lives in the Mask block, not wired here' },
  'cua.anh.co-gian-vung': { vi: 'Cần vùng chọn đang mở — vệ tinh chưa đọc được vùng', en: 'Needs an active selection — the panel cannot read one yet' },

  // ── Phim: dòng thời gian là thứ chưa tồn tại; video hiện là MỘT clip sinh ra trọn gói.
  'cua.video.cat-canh': { vi: 'Cần dòng thời gian — phim hiện là một clip trọn', en: 'Needs a timeline — video is one whole clip today' },
  'cua.video.chuyen-canh': { vi: 'Cần dòng thời gian — chưa có hai cảnh để nối', en: 'Needs a timeline — no two shots to join yet' },
  'cua.video.tron-tieng': { vi: 'Chưa có đường tiếng — phim sinh ra không kèm tiếng', en: 'No audio track — generated video has no sound' },

  // ── Khối 3D: 1 lệnh dựng hình (cần công thức khối sống trong node) + 1 lệnh máy ảnh.
  'cua.ba-chieu.extrude': { vi: 'Công thức khối chạy ở chặng 3D, chưa gọi được từ đây', en: 'Build stack runs in the 3D stage, not callable here' },
  'cua.ba-chieu.mirror': { vi: 'Công thức khối chạy ở chặng 3D, chưa gọi được từ đây', en: 'Build stack runs in the 3D stage, not callable here' },
  'cua.ba-chieu.array': { vi: 'Công thức khối chạy ở chặng 3D, chưa gọi được từ đây', en: 'Build stack runs in the 3D stage, not callable here' },
  'cua.ba-chieu.chinh-dung': { vi: 'Cần chỉnh hai điểm tụ — máy ảnh nay chỉ có preset', en: 'Needs two-point correction — camera only has presets' },

  // ── Bàn bạc: cửa sổ THẢO LUẬN, cố ý chưa dựng (ngoài phạm vi lane này, xem `cua-so-cong-cu.ts`).
  'cua.ban-bac.chon-khung': { vi: 'Kho khung tư duy chưa có mẫu nào', en: 'The framework library has no templates yet' },
  'cua.ban-bac.gom-nhom': { vi: 'Cần bàn bạc có ý đã dán — bàn còn trống', en: 'Needs notes on the board — the board is empty' },
  'cua.ban-bac.ghi-quyet-dinh': { vi: 'Cần sổ quyết định của dự án — chưa có nơi ghi', en: 'Needs a project decision log — nowhere to write yet' },
};

/* ────────────────────────────── TRA CỨU ────────────────────────────── */

/** Lệnh này đã có dòng điện chưa. */
export function daNoiDien(lenhId: string): boolean {
  return Object.prototype.hasOwnProperty.call(LENH_DA_NOI, lenhId);
}

/** Mọi lệnh chuyên sâu đang khai trong bảng môi trường (mọi môi trường, mọi vệ tinh). */
export function moiLenhTrongCua(): string[] {
  return (Object.keys(MOI_TRUONG) as MaMoiTruong[]).flatMap((m) =>
    MOI_TRUONG[m].veTinh.flatMap((v) => v.lenh.map((l) => l.id)),
  );
}

/**
 * Lệnh KHÔNG có mặt ở cả hai bảng — **phải luôn rỗng**. Rỗng là bằng chứng "không lệnh nào rơi
 * vào lý do dùng chung"; có phần tử là bằng chứng ai đó thêm lệnh mà quên khai số phận của nó.
 */
export function lenhKhongKhaiSoPhan(): string[] {
  return moiLenhTrongCua().filter(
    (id) => !daNoiDien(id) && !Object.prototype.hasOwnProperty.call(LY_DO_CHUA_NOI, id),
  );
}

/**
 * Lệnh khai ở CẢ HAI bảng — cũng phải luôn rỗng. Vừa nối vừa kèm lý do-chưa-nối là hai lời khai
 * ngược nhau; để lẫn thì không ai biết tin cái nào.
 */
export function lenhKhaiHaiLan(): string[] {
  return Object.keys(LENH_DA_NOI).filter((id) =>
    Object.prototype.hasOwnProperty.call(LY_DO_CHUA_NOI, id),
  );
}

/** Lệnh khai ở đây mà KHÔNG tồn tại trong bảng môi trường — bảng khai thừa, dọn đi. */
export function lenhKhaiThua(): string[] {
  const that = new Set(moiLenhTrongCua());
  return [...Object.keys(LENH_DA_NOI), ...Object.keys(LY_DO_CHUA_NOI)].filter((id) => !that.has(id));
}

/* ────────────────────────────── PHẦN TÍNH ────────────────────────────── */

/**
 * Giá trị kế tiếp trong một danh sách select (cuộn vòng).
 *
 * ⭐ Ở ĐÂY cuộn vòng là ĐÚNG, khác hẳn `capKe()` của ba nấc cố ý KHÔNG cuộn: nấc là một thang có
 * đầu có cuối (rơi từ "toàn màn" về "thu gọn" là mất ngữ cảnh đang làm), còn tiêu cự ống kính
 * hay bảng vật liệu là một VÒNG — người dùng bấm để lướt qua các lựa chọn và quay lại chỗ cũ.
 *
 * Giá trị hiện tại không nằm trong danh sách (dữ liệu cũ, tuỳ biến tay) ⇒ trả phần tử ĐẦU, không
 * ném lỗi: người dùng bấm một nút thì phải có chuyện xảy ra, không phải một thông báo đỏ.
 */
export function giaTriKe(options: readonly string[], hienTai: unknown): string | null {
  if (options.length === 0) return null;
  const i = options.indexOf(String(hienTai));
  if (i < 0) return options[0];
  return options[(i + 1) % options.length];
}
