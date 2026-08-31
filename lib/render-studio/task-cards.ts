/**
 * lib/render-studio/task-cards.ts — thẻ việc Tool Mode (VIỆC B, 28/07, docs/SPEC-RENDER-STUDIO.md
 * §1B + §6; mở rộng H2 02/08 — vùng "node MASTER", docs/SPEC-MODE-PER-STAGE.md §2). Thuần dữ liệu
 * — ánh xạ mỗi thẻ sang ĐÚNG 1 node AI có thật trong registry (`lib/nodes/registry.ts`), KHÔNG
 * bịa node mới. Tool Mode chỉ là lớp trình bày rút gọn CHO node đó — bấm "▶ Render" build 2 node
 * (input.image + node AI này), nối cạnh, chạy qua `runNode()` CÙNG đường thật (Không có luồng
 * "giả" riêng cho Tool Mode).
 *
 * `before`/`after`: ảnh Trước/Sau dạy bằng kết quả (§6 "dạy bằng kết quả, không bằng chữ").
 * 31/08 — QĐ-1 "demo sạch": HIỆN KHÔNG THẺ NÀO CÓ ẢNH. Thẻ Sketch→Ảnh thật từng mượn
 * `public/demo/sketch-in.jpg`/`sketch-out.png`; bộ ảnh đó đã rời bản ship cùng mọi dữ liệu
 * demo khác, nên thẻ này quay về đúng trạng thái của các thẻ còn lại: để trống, component
 * tự hiện "chờ ảnh thật". Quy tắc cũ giữ nguyên và nay áp cho tất cả — TUYỆT ĐỐI không cho
 * AI vẽ minh hoạ giả (yêu cầu B3), và cũng không mượn render của dự án khách.
 * TODO(phiếu "bộ minh hoạ trung tính"): có ảnh tự vẽ thì điền lại `before`/`after` ở đây.
 */

export interface TaskCard {
  id: string;
  label: string;
  desc: string;
  /** node AI thật trong lib/nodes/registry.ts — build graph 2 node (input.image → node này). */
  nodeType: string;
  before?: string;
  after?: string;
  /**
   * 'auto-run' (mặc định): thẻ tự đủ (1 ảnh + tham số) → bấm Render chạy thẳng qua runNode().
   * 'canvas-handoff': node cần INPUT thứ 2 mà Tool Mode không tự làm được (vd mask vẽ tay) —
   * bấm Render chỉ DỰNG node lên canvas rồi mở canvas để người dùng hoàn tất ở đó (không giả
   * vờ chạy được cái mà thật ra chưa đủ dữ liệu).
   */
  formKind?: 'auto-run' | 'canvas-handoff';
}

export const TASK_CARDS: TaskCard[] = [
  {
    id: 'sketch2render',
    label: 'Sketch → Ảnh thật',
    desc: 'Nét vẽ tay / xuất SketchUp → ảnh render đúng hình khối',
    nodeType: 'ai.sketch2render',
  },
  {
    id: 'clay2render',
    label: 'Grey-box → Nội thất',
    desc: 'Khối trắng (3ds Max clay) → render thực, khoá đúng hình học',
    nodeType: 'ai.clay2render',
  },
  {
    id: 'styletransfer',
    label: 'Đổi phong cách giữ bố cục',
    desc: 'Render lại đúng góc phòng theo phong cách khác',
    nodeType: 'ai.styletransfer',
  },
  {
    id: 'relight',
    label: 'Đổi ánh sáng/giờ',
    desc: 'Đổi sáng ban ngày / hoàng hôn / đèn vàng ban đêm',
    nodeType: 'ai.relight',
  },
  {
    id: 'materialswap',
    label: 'Sửa một mảng',
    desc: 'Vẽ vùng cần sửa (sàn/tường/đồ) rồi đổi vật liệu — cần vẽ tay trên canvas',
    nodeType: 'ai.materialswap',
    formKind: 'canvas-handoff',
  },
  // H2 (02/08, docs/TICKET-UI-HATANG-2026-08-02.md) — mở rộng vùng "node MASTER" (sidebar §2):
  // 5 thẻ cùng khuôn hình các thẻ trên (ĐÚNG shape input/output, KHÔNG cần UI riêng), tận dụng
  // thẳng ToolModeForm chung — additive, không đổi execute()/registry.
  {
    id: 'emptystaging',
    label: 'Phòng trống → Bày đồ',
    desc: 'Ảnh phòng trống → phòng có nội thất theo phong cách (virtual staging)',
    nodeType: 'ai.emptystaging',
  },
  {
    id: 'exterior',
    label: 'Render mặt tiền',
    desc: 'Sketch/massing mặt tiền → render exterior photoreal',
    nodeType: 'ai.exterior',
  },
  {
    id: 'furniture',
    label: 'Xoá/Thêm đồ',
    desc: 'Vẽ vùng cần sửa rồi xoá hoặc thêm nội thất — cần vẽ tay trên canvas',
    nodeType: 'ai.furniture',
    formKind: 'canvas-handoff',
  },
  {
    id: 'removebg',
    label: 'Cắt nền',
    desc: 'Tách sản phẩm/đồ nội thất khỏi nền',
    nodeType: 'ai.removebg',
  },
  {
    id: 'localedit',
    // 05/08 — nhãn theo thuật ngữ ngành AI ảnh (xem lib/nodes/defs/render-v2.ts).
    // `id`/`nodeType` GIỮ NGUYÊN (đổi = vỡ flow đã lưu + `taskCardById`).
    label: 'Sửa vùng',
    desc: 'Vẽ vùng cần sửa rồi chỉnh sáng/tương phản/bão hoà tại chỗ — cần vẽ tay trên canvas',
    nodeType: 'ai.localedit',
    formKind: 'canvas-handoff',
  },
  {
    id: 'upscale',
    label: 'Phóng to in',
    // 30/07 — bỏ gắn cứng 1 khổ giấy (Luật Đồng Bộ #6): "khổ A3" mâu thuẫn với khổ giấy CAD vừa
    // mở rộng A0-A4 + hướng giấy độc lập (2.1.8.m). Thẻ Render này không có khái niệm "khổ giấy"
    // riêng của nó (đó là chuyện CAD paper-space) — chỉ nói đúng việc nó làm: nâng độ phân giải.
    desc: 'Nâng độ phân giải — đủ 300dpi để in khổ lớn',
    nodeType: 'ai.upscale',
  },
  {
    // 2.2.88 (30/07) — docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md §4 "Lát cắt 1". Node
    // `vision.measureobject` (2.2.87, lib/nodes/defs/metrology.ts) — 0 credit, tất định.
    id: 'measureobject',
    // 05/08 — "Metrology/đo món đồ" là đo lường công nghiệp, sai ngành; việc thật là ghi kích
    // thước lên ảnh. `id`/`nodeType` GIỮ NGUYÊN.
    label: 'Ghi kích thước',
    desc: 'Khoanh 1 món trong ảnh → rộng × sâu × cao kèm sai số — cần ảnh thấy rõ cạnh tường/sàn',
    nodeType: 'vision.measureobject',
  },
];

export function taskCardById(id: string): TaskCard | undefined {
  return TASK_CARDS.find((c) => c.id === id);
}
