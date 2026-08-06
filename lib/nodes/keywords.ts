/**
 * Từ khoá tìm kiếm node — VI + EN, theo CÁCH NGƯỜI DÙNG THẬT GÕ, không phải tên kỹ thuật.
 *
 * Vì sao có file này: `title`/`description` của node là tiếng Việt "đúng nghiệp vụ" nhưng
 * người dùng gõ theo việc muốn làm ("vách", "sửa tường", "tách nền", "phóng to", "hoa văn").
 * Trước đây search chỉ khớp title/description/type → gõ mấy từ đó ra 0 kết quả.
 *
 * Đặt ở file riêng (cùng seam với `lib/nodes/groups.ts`) để KHÔNG phải sửa 9 file `defs/*.ts`
 * — tránh xung đột khi nhiều worktree chạy song song. Node vẫn có thể tự khai
 * `keywords` trong NodeDefinition; `keywordsFor()` ưu tiên khai báo tại node rồi mới tới bảng này.
 */

export const NODE_KEYWORDS: Record<string, string[]> = {
  // ---- Input ----
  'input.image': ['ảnh', 'hình', 'tải ảnh', 'up ảnh', 'nhập ảnh', 'mở ảnh', 'import', 'upload', 'photo', 'jpg', 'png'],
  'input.prompt': ['prompt', 'mô tả', 'nhập chữ', 'viết mô tả', 'text', 'câu lệnh'],
  'input.stylepreset': ['phong cách', 'style', 'gu', 'preset', 'japandi', 'scandinavian', 'indochine', 'wabi sabi'],
  'input.roominfo': ['phòng', 'diện tích', 'hướng nắng', 'trần cao', 'thông tin phòng', 'room', 'area'],
  'input.guref': ['gu', 'bảng gu', 'reference', 'style reference', 'moodboard', 'thư viện tham khảo', 'ảnh mẫu', 'ref', 'moodboard ref', 'style ref'],

  // ---- AI Generate ----
  'ai.sketch2render': ['sketch', 'vẽ tay', 'nét chì', 'phác', 'line', 'render từ sketch', 'sketchup', 'canny', 'ảnh thật'],
  'ai.clay2render': ['clay', 'khối trắng', 'phối cảnh', 'render thật', '3ds max', 'ảnh thật', 'photoreal', 'depth', 'archviz'],
  'ai.emptystaging': ['phòng trống', 'bày đồ', 'thêm nội thất', 'staging', 'virtual staging', 'furnish'],
  'ai.styletransfer': ['đổi phong cách', 'chuyển style', 'style transfer', 'img2img', 'render lại', 'cùng góc'],
  'ai.moodboard': ['moodboard', 'concept', 'ý tưởng', 'bảng cảm hứng', '4 ảnh', 'mood'],
  'ai.exterior': ['mặt tiền', 'ngoại thất', 'facade', 'exterior', 'kiến trúc ngoài', 'phối cảnh ngoài'],
  'ai.batchvariants': ['nhiều biến thể', 'so sánh phương án', 'variants', 'batch', 'render nhiều', '4 phương án'],
  'ai.image2video': ['video', 'clip', 'quay', 'walkthrough', 'ảnh thành video', 'kling', 'chuyển động'],
  'ai.text2video': ['video', 'clip từ chữ', 'text to video', 'quay concept', 'kling'],
  'ai.text2image': ['tạo ảnh', 'sinh ảnh', 'text to image', 'từ chữ ra ảnh', 'generate', 'ảnh mới'],
  'render.compare': ['so sánh model', 'đối chiếu', 'compare', 'thử nhiều model', 'a b'],
  'ai.pattern': ['hoa văn', 'pattern', 'hoạ tiết', 'motif', 'giấy dán tường', 'wallpaper', 'thảm', 'rèm', 'gạch', 'vách trang trí', 'phù điêu', 'mural', 'tranh tường', 'chăm', 'khmer', 'seamless', 'tile'],

  // ---- AI Edit ----
  'ai.materialswap': ['vách', 'tường', 'sàn', 'trần', 'tủ', 'đổi vật liệu', 'thay vật liệu', 'ốp', 'ốp gỗ', 'ốp đá', 'sửa tường', 'material', 'swap', 'inpaint', 'finish'],
  'ai.furniture': ['xoá đồ', 'bỏ đồ', 'thêm đồ', 'thêm ghế', 'dọn phòng', 'remove', 'add furniture', 'inpaint'],
  'ai.relight': ['ánh sáng', 'đổi sáng', 'sáng tối', 'đèn', 'nắng', 'ban đêm', 'relight', 'lighting'],
  'ai.upscale': ['phóng to', 'nét hơn', 'rõ hơn', 'độ phân giải', '4k', 'in ấn', '300dpi', 'upscale', 'resolution'],
  'ai.removebg': ['tách nền', 'xoá nền', 'cắt nền', 'bỏ nền', 'cutout', 'background', 'remove bg', 'tách đồ'],
  // giữ cả tên CŨ ('phân vùng ID') sau khi đổi nhãn 05/08 → người quen tên cũ vẫn tìm ra.
  'ai.idmask': ['phân vùng', 'phân vùng id', 'mặt nạ', 'mặt nạ đối tượng', 'object mask', 'chia vùng', 'nhận diện vùng', 'segment', 'mask tự động', 'id mask'],
  'ai.furnitureextract': ['tách nội thất', 'lấy món đồ', 'cắt đồ', 'extract', 'trích đồ'],
  'ai.smartselect': ['chọn vùng', 'chọn thông minh', 'tách vùng', 'magic wand', 'sam', 'segment', 'khoanh vùng tự động', 'chọn tường', 'chọn vách', 'chọn đúng biên', 'mask tự động', 'chọn nhanh'],
  'ai.localedit': ['chỉnh cục bộ', 'sửa một chỗ', 'sửa vùng', 'local edit', 'inpaint', 'inpainting', 'retouch', 'sửa chi tiết'],

  // ---- Slide / Present ----
  'slide.concept': ['nội dung slide', 'tiêu đề', 'concept', 'text slide', 'thuyết trình'],
  'slide.composer': ['slide', 'dàn trang', 'layout slide', 'trình bày', 'present', 'ghép slide', '16:9'],
  'slide.deck': ['deck', 'pdf', 'xuất thuyết trình', 'gom slide', 'export', 'trình chiếu'],

  // ---- Utility ----
  'util.maskpainter': ['mask', 'vẽ vùng', 'chọn vùng', 'khoanh vùng', 'tô vùng', 'brush', 'quét vùng', 'bôi'],
  'util.sketchpad': ['vẽ tay', 'vẽ nhanh', 'phác thảo', 'sketch', 'bút', 'draw', 'nháp'],
  'util.edit': ['chỉnh ảnh', 'sáng', 'tương phản', 'bão hoà', 'nhiệt màu', 'ấm lạnh', 'edit', 'brightness', 'contrast'],
  'util.palette': ['màu', 'bảng màu', 'hex', 'trích màu', 'palette', 'color'],
  'util.compare': ['so sánh', 'trước sau', 'a b', 'before after', 'slider'],
  'util.annotate': ['ghi chú', 'chú thích', 'đánh dấu', 'feedback khách', 'markup', 'annotate', 'vẽ lên ảnh'],
  'util.watermark': ['watermark', 'logo', 'đóng dấu', 'chống copy', 'dán logo', 'brand'],
  'util.crop': ['cắt ảnh', 'crop', 'tỉ lệ', 'khung hình', 'resize', 'vuông', '16:9', 'dọc'],
  'util.composite': ['ghép ảnh', 'chồng ảnh', 'dán ảnh', 'composite', 'overlay', 'gộp'],
  'util.materialnote': ['ghi chú vật liệu', 'bảng vật liệu', 'material', 'chú thích vật liệu', 'finish schedule'],
  'util.warp': ['warp', 'dán lên tường', 'dán lên vách', 'phối cảnh', 'biến dạng', '4 góc', 'perspective', 'nghiêng', 'méo', 'transform', 'kéo góc'],

  // ---- 3D / CAD ----
  'three.camera': ['góc máy', 'camera', 'view', 'góc nhìn', 'tiêu cự', 'lens'],
  'three.cad2fbx': ['cad', 'bản vẽ', 'dwg', 'dxf', '3d', 'obj', 'fbx', 'dựng khối', 'mô hình'],
  // `vision.measureobject` trước không có entry — search chỉ dựa vào title, mà title vừa đổi
  // ('Đo món đồ' → 'Ghi kích thước') nên phải khai tay, giữ luôn tên cũ + 'metrology'.
  'vision.measureobject': ['ghi kích thước', 'kích thước', 'đo món đồ', 'đo đạc', 'đo', 'rộng cao sâu', 'dimension', 'measure', 'metrology', 'size'],
  // Bảng món (06/08) — người dùng gõ theo THỨ HỌ CẦN ("danh sách đồ", "bảng ff&e", "thống kê
  // món", "số lượng"), không gõ 'util.ffetable'.
  'util.ffetable': ['bảng món', 'danh sách món', 'danh sách đồ', 'liệt kê đồ', 'thống kê món', 'ff&e', 'ffe', 'schedule', 'furniture schedule', 'bảng nội thất', 'số lượng', 'đếm món', 'bảng kê', 'gom món'],

  // ---- Output ----
  'out.moodboard': ['moodboard', 'collage', 'bảng vật liệu', 'ghép nhiều ảnh', 'trang mood', 'board'],
  'out.board': ['board', 'xuất bảng', 'presentation board', 'ghép 4 ảnh', 'pdf', 'png'],
  'out.gallery': ['lưu', 'gallery', 'thư viện', 'save', 'lưu ảnh', 'kho ảnh'],
};

/** Từ khoá của 1 node: node tự khai (NodeDefinition.keywords) ưu tiên, rồi tới bảng trung tâm. */
export function keywordsFor(nodeType: string, own?: string[]): string[] {
  if (own && own.length) return own;
  return NODE_KEYWORDS[nodeType] ?? [];
}
