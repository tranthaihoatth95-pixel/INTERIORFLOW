/**
 * lib/render-studio/task-cards.ts — 6 thẻ việc Tool Mode (VIỆC B, 28/07,
 * docs/SPEC-RENDER-STUDIO.md §1B + §6). Thuần dữ liệu — ánh xạ mỗi thẻ sang ĐÚNG 1 node AI có
 * thật trong registry (`lib/nodes/registry.ts`), KHÔNG bịa node mới. Tool Mode chỉ là lớp trình
 * bày rút gọn CHO node đó — bấm "▶ Render" build 2 node (input.image + node AI này), nối cạnh,
 * chạy qua `runNode()` CÙNG đường thật (Không có luồng "giả" riêng cho Tool Mode).
 *
 * `before`/`after`: ảnh Trước/Sau dạy bằng kết quả (§6 "dạy bằng kết quả, không bằng chữ").
 * Chỉ thẻ Sketch→Ảnh thật có ảnh THẬT sẵn (`public/demo/sketch-in.jpg`/`sketch-out.png`, dùng
 * lại từ `lib/demos/sketch.ts`). Thẻ khác CHƯA có ảnh thật → để trống (component tự hiện
 * "chờ ảnh thật"), TUYỆT ĐỐI không cho AI vẽ minh hoạ giả (đúng yêu cầu B3).
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
    before: '/demo/sketch-in.jpg',
    after: '/demo/sketch-out.png',
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
  {
    id: 'upscale',
    label: 'Phóng to in',
    desc: 'Nâng độ phân giải — đủ 300dpi khổ A3 để in',
    nodeType: 'ai.upscale',
  },
];

export function taskCardById(id: string): TaskCard | undefined {
  return TASK_CARDS.find((c) => c.id === id);
}
