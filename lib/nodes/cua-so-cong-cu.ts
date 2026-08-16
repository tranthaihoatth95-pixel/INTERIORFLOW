/**
 * lib/nodes/cua-so-cong-cu.ts — PHẦN TÍNH THUẦN của **cửa sổ công cụ**
 * (entry `master-tool-cong-dan-canvas`).
 *
 * ⚠️ TÊN — đọc trước khi viết thêm chữ nào. Sổ dùng "master tool" 26 lần cho thứ mà **code đã
 * đặt tên `ToolWindow` từ 01/08** (13 chỗ). Hoà làm rõ 16/08: *"master tool mà tôi nói chính là
 * window tool"* ⇒ T chốt **một tên: `cửa sổ công cụ`**, khoá kỹ thuật giữ `ToolWindow`. Đây đúng
 * họ bệnh `soi:tu-dien` sinh ra để bắt — cùng một vật, hai từ vựng, hai nhóm người tưởng đang
 * bàn hai việc.
 *
 * ⭐ BẢN CHẤT (Hoà chốt 16/08 kèm 7 ảnh Photoshop · Lightroom · Illustrator · Premiere):
 * cửa sổ công cụ là **panel THÁO RỜI nổi quanh mặt làm việc** — thẻ bo góc tự chứa, kéo được,
 * đặt được chỗ bất kỳ, mở nhiều cái cùng lúc. Nó **không thuộc riêng chặng nào**: ảnh tham chiếu
 * là mọi trình biên tập, kể cả nơi không có node graph.
 *
 * ⭐ MẶT TIỀN ĐẶC THÙ trên canvas node (chặng 2, Hoà chốt 15/08 *"nó phải thuộc môi trường
 * canvas… cho phép mở nhiều cửa sổ để nối với nhau"*): cùng cái cửa sổ đó **neo vào thân node**,
 * nhờ đó thừa hưởng cổng vào/ra để NỐI DÂY. Neo-vào-node là **lớp thêm**, KHÔNG phải bản chất —
 * khoá thiết kế vào xyflow là tự chặn đường sang 2D và Trình chiếu ([T2]).
 *
 * ⭐ VÌ SAO KHÔNG ĐẺ LOẠI NODE MỚI cho mặt tiền canvas: mỗi thẻ việc trong
 * `lib/render-studio/task-cards.ts` ĐÃ ánh xạ sang ĐÚNG MỘT node có thật trong registry
 * (`TaskCard.nodeType`, vd `ai.sketch2render`) ⇒ cửa sổ công cụ **đã là một node trên canvas từ
 * trước**; thứ thiếu chưa bao giờ là "một vật mới" mà là **cách nhìn thứ hai của cùng vật đó**.
 * Đúng câu chốt 01/08 `CHOT-RENDER-TOOL-WINDOW §1`: *"tool window LÀ subgraph node phóng to"*.
 * Hệ quả có sẵn không phải xây: cổng vào/ra · kéo di chuyển · pan/zoom · undo chung · nhiều cái
 * mở cùng lúc (= nhiều node).
 *
 * Không React/zustand trong tệp này để test chạy được bằng `sucrase-node` (repo không có
 * Jest/Vitest — xem `lib/nodes/macro.test.ts`). Phần trạng thái ở `cua-so-cong-cu-ui.ts`.
 */

// Đường DẪN TƯƠNG ĐỐI có chủ ý: `sucrase-node` (bộ chạy test của repo, xem `package.json`
// script `test`) KHÔNG resolve alias `@/…` ⇒ import giá trị bằng alias là tự khoá tệp này khỏi
// mọi test. Cùng lý do đã ghi trong `lib/render-studio/tool-mode-graph.ts`.
import { TASK_CARDS } from '../render-studio/task-cards';

/**
 * BA NẤC — đúng nhịp ba nấc toàn app (Hoà chốt 16/08: *"luôn gọn và tươm tất ở lớp mặc định,
 * và cho phép xổ ra tuỳ chọn với 2 chi tiết vừa và full"*), cùng nhịp sidebar 3 nấc + kiến trúc
 * tool 3 lớp. KHÔNG đẻ nhịp thứ hai.
 *
 *  · `thu`     — cửa sổ đóng lại còn khối nhỏ (trên canvas = node thường). Phải ĐỦ TỰ THÂN:
 *                đọc được tên + trạng thái mà không cần mở ra.
 *  · `vua`     — cửa sổ mở, ôm bàn làm việc, vẫn ở trong mặt làm việc (nổi quanh, hoặc neo node).
 *  · `toanMan` — lấp khung nhìn cho việc cần soi kỹ.
 */
export type CapCuaSo = 'thu' | 'vua' | 'toanMan';

export const THANG_CAP: readonly CapCuaSo[] = ['thu', 'vua', 'toanMan'] as const;

/** Nhãn song ngữ từng nấc — MỘT nguồn, mọi mặt tiền đọc chung (nút · aria-label · bản vẽ). */
export const NHAN_CAP: Record<CapCuaSo, { vi: string; en: string }> = {
  thu: { vi: 'Thu gọn', en: 'Collapsed' },
  vua: { vi: 'Mở tại chỗ', en: 'Open in place' },
  toanMan: { vi: 'Toàn màn', en: 'Full screen' },
};

/**
 * Nấc kế tiếp; đã ở nấc cuối thì ĐỨNG YÊN (cố ý không cuộn vòng — cuộn vòng làm người dùng lỡ
 * tay từ "toàn màn" rơi thẳng về "thu gọn", mất ngữ cảnh đang làm giữa chừng).
 */
export function capKe(cap: CapCuaSo): CapCuaSo {
  const i = THANG_CAP.indexOf(cap);
  return THANG_CAP[Math.min(i + 1, THANG_CAP.length - 1)];
}

/** Nấc trước; đã ở nấc đầu thì đứng yên. */
export function capTruoc(cap: CapCuaSo): CapCuaSo {
  const i = THANG_CAP.indexOf(cap);
  return THANG_CAP[Math.max(i - 1, 0)];
}

/**
 * Khung mặc định của nấc `vua`. Trên canvas đơn vị là FLOW (canvas có zoom riêng), ngoài canvas
 * là pixel — cùng con số vì cả hai đứng ở zoom 1 lúc mở. 640×420 vừa đủ hai cột
 * "đầu vào ↔ kết quả" mà chưa nuốt khung nhìn; kéo to nhỏ tuỳ ý sau đó.
 */
export const KHUNG_VUA = { w: 640, h: 420 } as const;
/** Trần dưới lúc kéo đổi cỡ — nhỏ hơn nữa thì hai cột dính vào nhau, đọc không ra. */
export const KHUNG_VUA_MIN = { w: 420, h: 280 } as const;

/** Toạ độ cửa sổ nổi (pixel, gốc góc trái-trên vùng làm việc). */
export interface ViTriCuaSo {
  x: number;
  y: number;
}

/**
 * Giữ cửa sổ nổi **không trôi ra ngoài vùng làm việc**. Chừa `LO_RA` để mép cửa sổ luôn còn
 * nắm được: thả lọt hẳn ra ngoài là cửa sổ biến mất mà không có đường gọi lại — đúng loại hỏng
 * mà luật CẤM auto-hide đang chặn (`SPEC-PANEL-ROLLOUT-IDF`: thu thì thu, không được mất tích).
 */
export const LO_RA = 48;

export function ghimTrongVung(
  viTri: ViTriCuaSo,
  cua: { w: number; h: number },
  vung: { w: number; h: number },
): ViTriCuaSo {
  const xMax = Math.max(0, vung.w - LO_RA);
  const yMax = Math.max(0, vung.h - LO_RA);
  return {
    x: Math.min(Math.max(viTri.x, LO_RA - cua.w), xMax),
    y: Math.min(Math.max(viTri.y, 0), yMax), // mép TRÊN không cho âm: kéo lên quá là mất thanh tiêu đề, hết đường nắm.
  };
}

/**
 * `defType` này có phải cửa sổ công cụ không → trả `cardId` của thẻ việc, không thì `null`.
 *
 * Đọc thẳng `TASK_CARDS` chứ không chép danh sách sang đây: chép là tái phạm đúng gốc bệnh
 * "cùng một danh sách khai ở nhiều chỗ" mà `may-soi-dong-dang` sinh ra để bắt (5 sổ lệnh song
 * song, đo 15/08). Thêm thẻ việc mới ⇒ cửa sổ công cụ mới tự có mặt, 0 dòng sửa ở đây.
 */
export function theViecChoDefType(defType: string): string | null {
  const card = TASK_CARDS.find((c) => c.nodeType === defType);
  return card ? card.id : null;
}

/** Mặt tiền boolean của hàm trên, cho chỗ chỉ cần biết có/không. */
export function laCuaSoCongCu(defType: string): boolean {
  return theViecChoDefType(defType) !== null;
}

/** Khoá cửa sổ neo vào một node — tiền tố để không đụng khoá của cửa sổ nổi. */
export function khoaCuaSoNode(nodeId: string): string {
  return `node:${nodeId}`;
}

/** Khoá cửa sổ nổi mở từ một thẻ việc. */
export function khoaCuaSoThe(cardId: string): string {
  return `the:${cardId}`;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
   MÔI TRƯỜNG LÀM VIỆC — phần Hoà làm rõ 16/08, và là chỗ cửa sổ công cụ khác hẳn "một panel".
   ══════════════════════════════════════════════════════════════════════════════════════════

   Nguyên văn: *"mỗi 1 cửa sổ là 1 window — được hiểu là MÔI TRƯỜNG LÀM VIỆC TỐI ƯU (ảnh / video /
   3D prototype…), kéo thả trong môi trường canvas, XUNG QUANH ĐÍNH KÈM CÁC TOOL TỐI ƯU RIÊNG cho
   tác vụ đó."*

   ⇒ Cửa sổ công cụ là **MỘT CỤM**, không phải một tấm: **khung môi trường** (mặt làm việc riêng)
   **+ panel vệ tinh** bám quanh mang tool riêng của môi trường đó. Kéo là kéo CẢ CỤM.

   ⭐⭐ HAI TẦNG GIẢI HAI BÀI TOÁN NGƯỢC NHAU — ghi rõ để phiên sau không gộp nhầm làm một:
     ① THANH CHUNG (`lib/commands/registry.ts`, `ToolbarChip`, trục phải, Vitals) giải bài
        *"mỗi công cụ một phím tắt, ai mà nhớ"* ⇒ CHƯNG CẤT: lệnh cùng bản chất ở mọi công cụ quy
        về MỘT bộ, dùng ở mọi tác vụ. Giá trị = **quen tay**. Ít · ổn định · mọi nơi giống nhau.
     ② CỬA SỔ CÔNG CỤ giải bài NGƯỢC LẠI: *"phải đúng Photoshop, đúng render, đúng D5, đúng
        Blender"*. Giá trị = **đúng nghề**. Nhiều · sâu · chỉ đúng một môi trường.

   🔴 RANH GIỚI LÀ THỨ KHIẾN HAI TẦNG KHÔNG ĐÁ NHAU — và nó phải MÁY GIỮ, không phải lời dặn:
   **cửa sổ ĐÓNG KHUNG PHẠM VI.** Lệnh chuyên sâu của ảnh sống TRONG cửa sổ ảnh, của 3D sống
   TRONG cửa sổ 3D; chúng KHÔNG TRÀN ra thanh chung ⇒ thanh chung **không bao giờ phình** và
   **không đổi theo chặng**. Hệ quả Hoà nêu: *"dù làm 2D, 3D, graphic, đồ hoạ, rendering hay gì
   thì cũng không còn đá nhau"* — vì chặng thôi là thứ quyết định giao diện: 2D/3D/Trình chiếu
   khác nhau ở chỗ **mở cửa sổ nào**, không phải ở chỗ đổi cả bộ vỏ.

   Cách máy giữ ranh giới: lệnh trong cửa sổ BẮT BUỘC mang tiền tố `cua.<môi trường>.` (hàm
   `lenhSaiKhongGian()` bắt chỗ phạm), và tập lệnh cửa sổ phải RỜI HẲN `LENH_CHUNG` (hàm
   `lenhDamChan()` phải luôn trả rỗng). Cả hai có test canh — xem `cua-so-cong-cu.test.ts`.
*/

export type MaMoiTruong = 'anh' | 'video' | 'ba-chieu' | 'ban-bac';

/**
 * ⭐ HAI LOẠI CỬA SỔ — Hoà chốt 16/08, và đây là chỗ dễ trừu tượng hoá SAI nhất:
 *
 *  · `san-xuat`  — ảnh · phim · khối 3D. Cửa sổ là **một trạm SẢN XUẤT**: đầu ra là một tệp/asset
 *                  mang định nghĩa, nối sang công đoạn sau. **Có cổng ra.**
 *  · `thao-luan` — moodboard · khung tư duy · ghi chú · bàn concept (kiểu Miro). Cửa sổ là **mặt
 *                  để NGHĨ**, không phải trạm để làm ra tệp. Đầu ra thật là **một QUYẾT ĐỊNH**,
 *                  không phải một tệp ⇒ **có thể KHÔNG có cổng ra**, và thường có nhiều người
 *                  cùng lúc.
 *
 * 🔴 VÌ SAO GHI THÀNH LUẬT Ở ĐÂY: công thức *"cửa sổ ⇒ luôn có cổng ra"* nghe rất gọn và **sai**.
 * Ép cửa sổ thảo luận đẻ ra một tệp là bắt nó giả vờ sản xuất — sẽ đẻ ra asset rỗng chỉ để thoả
 * mãn hình dạng dữ liệu, đúng loại "nút giả" mà §9 cấm. Cờ `coCongRa` giữ cho khung chịu được
 * cả hai mà không phải hai khung.
 *
 * ⚠️ KHAI THẬT: `ban-bac` dưới đây mới là **DÒNG KHAI**, chưa có màn nào mở nó (phiếu này cố ý
 * không dựng moodboard — ngoài phạm vi). Nó nằm đây để chứng minh bằng máy rằng khung **chịu
 * được** loại thứ hai; test canh đúng điều đó. Ô trống là bằng chứng còn việc, không phải rác.
 */
export type LoaiCuaSo = 'san-xuat' | 'thao-luan';

/** Neo của panel vệ tinh quanh khung môi trường. */
export type NeoVeTinh = 'trai' | 'phai' | 'duoi';

export interface VeTinh {
  id: string;
  ten: { vi: string; en: string };
  neo: NeoVeTinh;
  /** Lệnh chuyên sâu SỐNG TRONG cửa sổ — bắt buộc tiền tố `cua.<môi trường>.`. */
  lenh: { id: string; nhan: { vi: string; en: string } }[];
}

export interface DinhNghiaMoiTruong {
  ma: MaMoiTruong;
  loai: LoaiCuaSo;
  /**
   * Cửa sổ này có cổng ra không. `false` là HỢP LỆ, không phải thiếu sót — xem `LoaiCuaSo`.
   * Khung (`CuaSoCongCu.tsx`) không đọc cờ này để vẽ gì cả: cổng do VẬT CHỦ dựng (node có
   * `<Handle>` theo `def.outputs`), nên khung vốn đã chịu được cửa sổ không cổng. Cờ ở đây để
   * nơi gọi biết mình đang mở loại nào mà không phải đoán theo tên.
   */
  coCongRa: boolean;
  ten: { vi: string; en: string };
  /** Một câu nói môi trường này tối ưu cho việc gì (≤ 12 từ, `SPEC-NGON-NGU-CHI-DAN`). */
  moTa: { vi: string; en: string };
  veTinh: VeTinh[];
}

/**
 * LỆNH THANH CHUNG — id THẬT đang có trong `lib/commands/registry.ts` (đọc 16/08; tệp đó là
 * BIÊN của phiếu này nên chỉ tham chiếu, không sửa). Cố ý ngắn: đây là những động tác **cùng
 * bản chất ở mọi công cụ sáng tạo** — chọn · hoàn tác · làm lại · xoá · nhìn vừa khung. Danh
 * sách này phình ra là dấu hiệu ranh giới bị thủng.
 */
export const LENH_CHUNG: readonly string[] = [
  'cad.sel.select',
  'cad.sel.undo',
  'cad.sel.redo',
  'cad.sel.delete',
  'cad.view.zoomextents',
] as const;

export const MOI_TRUONG: Record<MaMoiTruong, DinhNghiaMoiTruong> = {
  anh: {
    ma: 'anh',
    loai: 'san-xuat',
    coCongRa: true,
    ten: { vi: 'Ảnh', en: 'Image' },
    moTa: { vi: 'Sửa ảnh: lớp, vùng chọn, sáng tối', en: 'Image work: layers, selection, tone' },
    veTinh: [
      {
        id: 'anh.lop',
        ten: { vi: 'Lớp', en: 'Layers' },
        neo: 'phai',
        lenh: [
          { id: 'cua.anh.them-lop', nhan: { vi: 'Thêm lớp', en: 'Add layer' } },
          { id: 'cua.anh.gop-lop', nhan: { vi: 'Gộp lớp', en: 'Merge layers' } },
          { id: 'cua.anh.che-do-hoa', nhan: { vi: 'Chế độ hoà', en: 'Blend mode' } },
        ],
      },
      {
        id: 'anh.chinh',
        ten: { vi: 'Chỉnh sáng', en: 'Adjust' },
        neo: 'phai',
        lenh: [
          { id: 'cua.anh.duong-cong', nhan: { vi: 'Đường cong', en: 'Curves' } },
          { id: 'cua.anh.can-trang', nhan: { vi: 'Cân trắng', en: 'White balance' } },
        ],
      },
      {
        id: 'anh.vung',
        ten: { vi: 'Vùng chọn', en: 'Selection' },
        neo: 'trai',
        lenh: [
          { id: 'cua.anh.chon-thong-minh', nhan: { vi: 'Chọn thông minh', en: 'Smart select' } },
          { id: 'cua.anh.co-gian-vung', nhan: { vi: 'Co giãn vùng', en: 'Grow / shrink' } },
        ],
      },
    ],
  },
  video: {
    ma: 'video',
    loai: 'san-xuat',
    coCongRa: true,
    ten: { vi: 'Phim', en: 'Video' },
    moTa: { vi: 'Dựng phim: dòng thời gian, cắt, chuyển cảnh', en: 'Editing: timeline, cuts, transitions' },
    veTinh: [
      {
        id: 'video.dong-thoi-gian',
        ten: { vi: 'Dòng thời gian', en: 'Timeline' },
        neo: 'duoi',
        lenh: [
          { id: 'cua.video.cat-canh', nhan: { vi: 'Cắt cảnh', en: 'Split clip' } },
          { id: 'cua.video.chuyen-canh', nhan: { vi: 'Chuyển cảnh', en: 'Transition' } },
          { id: 'cua.video.doi-nhip', nhan: { vi: 'Đổi nhịp', en: 'Retime' } },
        ],
      },
      {
        id: 'video.tieng',
        ten: { vi: 'Tiếng', en: 'Audio' },
        neo: 'phai',
        lenh: [{ id: 'cua.video.tron-tieng', nhan: { vi: 'Trộn tiếng', en: 'Mix audio' } }],
      },
    ],
  },
  'ba-chieu': {
    ma: 'ba-chieu',
    loai: 'san-xuat',
    coCongRa: true,
    ten: { vi: 'Khối 3D', en: '3D' },
    moTa: { vi: 'Dựng khối: công thức khối, vật liệu, đèn', en: 'Modelling: build stack, materials, lights' },
    veTinh: [
      {
        id: '3d.cong-thuc',
        ten: { vi: 'Công thức khối', en: 'Build stack' },
        neo: 'phai',
        lenh: [
          { id: 'cua.ba-chieu.extrude', nhan: { vi: 'Extrude / đùn khối', en: 'Extrude' } },
          { id: 'cua.ba-chieu.mirror', nhan: { vi: 'Mirror / đối xứng', en: 'Mirror' } },
          { id: 'cua.ba-chieu.array', nhan: { vi: 'Array / lặp theo lưới', en: 'Array' } },
        ],
      },
      {
        id: '3d.vat-lieu',
        ten: { vi: 'Vật liệu', en: 'Materials' },
        neo: 'phai',
        lenh: [{ id: 'cua.ba-chieu.gan-vat-lieu', nhan: { vi: 'Gán vật liệu', en: 'Assign material' } }],
      },
      {
        id: '3d.khung-nhin',
        ten: { vi: 'Khung nhìn', en: 'Viewport' },
        neo: 'trai',
        lenh: [
          { id: 'cua.ba-chieu.tieu-cu', nhan: { vi: 'Tiêu cự ống kính', en: 'Focal length' } },
          { id: 'cua.ba-chieu.chinh-dung', nhan: { vi: 'Chỉnh đứng 2 điểm tụ', en: 'Two-point correction' } },
        ],
      },
    ],
  },

  /**
   * ⚠️ DÒNG KHAI, CHƯA CÓ MÀN NÀO MỞ — cố ý. Hoà chốt 16/08: cửa sổ công cụ *"là lời giải cho
   * đoạn COLLAB — thảo luận concept, chốt định hướng ý tưởng, moodboard trước khi thiết kế, với
   * nhiều template hệ khung tư duy… giống kiểu Miro"*.
   *
   * Nó có mặt ở đây để **chứng minh bằng máy** rằng khung chịu được cửa sổ **KHÔNG có cổng ra**
   * (`coCongRa: false`) — thứ mà công thức *"cửa sổ ⇒ luôn đẻ ra sản phẩm"* sẽ làm hỏng. Đầu ra
   * thật của nó là **một quyết định đã chốt**, không phải một tệp.
   *
   * Phần chưa có, khai thẳng: nhiều người cùng lúc (presence/con trỏ) · kho template khung tư
   * duy · lưu quyết định đã chốt. Đó là phiếu khác — dựng ở đây là mở rộng phạm vi.
   */
  'ban-bac': {
    ma: 'ban-bac',
    loai: 'thao-luan',
    coCongRa: false,
    ten: { vi: 'Bàn bạc', en: 'Discussion' },
    moTa: { vi: 'Bàn concept: moodboard, khung tư duy, ghi chú', en: 'Concept: moodboard, frameworks, notes' },
    veTinh: [
      {
        id: 'ban-bac.khung-tu-duy',
        ten: { vi: 'Khung tư duy', en: 'Frameworks' },
        neo: 'trai',
        lenh: [
          { id: 'cua.ban-bac.chon-khung', nhan: { vi: 'Chọn khung mẫu', en: 'Pick a framework' } },
          { id: 'cua.ban-bac.gom-nhom', nhan: { vi: 'Gom nhóm ý', en: 'Cluster ideas' } },
        ],
      },
      {
        id: 'ban-bac.chot',
        ten: { vi: 'Chốt', en: 'Decide' },
        neo: 'phai',
        lenh: [{ id: 'cua.ban-bac.ghi-quyet-dinh', nhan: { vi: 'Ghi quyết định', en: 'Record decision' } }],
      },
    ],
  },
};

/** Tiền tố bắt buộc của mọi lệnh sống trong cửa sổ của một môi trường. */
export function tienToLenh(ma: MaMoiTruong): string {
  return `cua.${ma}.`;
}

/** Mọi lệnh chuyên sâu của một môi trường (gom từ các vệ tinh). */
export function lenhTrongCua(ma: MaMoiTruong): string[] {
  return MOI_TRUONG[ma].veTinh.flatMap((v) => v.lenh.map((l) => l.id));
}

/**
 * Lệnh khai SAI KHÔNG GIAN — nằm trong cửa sổ mà không mang tiền tố của môi trường đó.
 * Rỗng là đạt. Đây là cái chặn "lệnh chuyên sâu bò ra thanh chung" ở mức id, trước khi nó kịp
 * bò ra ở mức giao diện.
 */
export function lenhSaiKhongGian(ma: MaMoiTruong): string[] {
  return lenhTrongCua(ma).filter((id) => !id.startsWith(tienToLenh(ma)));
}

/** Lệnh vừa ở thanh chung vừa ở trong cửa sổ — **phải luôn rỗng**, nếu không là hai bộ đá nhau. */
export function lenhDamChan(ma: MaMoiTruong): string[] {
  return lenhTrongCua(ma).filter((id) => LENH_CHUNG.includes(id));
}
