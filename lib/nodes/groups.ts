/**
 * lib/nodes/groups.ts — 6 NHÓM THEO QUY TRÌNH ARCHVIZ cho bảng chọn node (Hoà giao 05/08).
 *
 * THAY cho `lib/nodes/tags.ts` cũ (7 tag theo TẦNG KỸ THUẬT: input / ai-generate / edit /
 * material / layout-present / utility / video). Lý do đổi: tag cũ nhóm theo *node là loại gì*,
 * còn người dùng tìm theo *đang ở bước nào của quy trình dựng ảnh* — nguồn → gu → máy quay →
 * dựng ảnh → sửa ảnh → hồ sơ. Đây cũng là lý do bỏ luôn cơ chế 1-node-nhiều-tag: một node đứng
 * ở ĐÚNG 1 bước quy trình; xuất hiện 2 chỗ chỉ làm rối bảng chọn.
 *
 * Node không có mặt trong `NODE_GROUP` (node mới ai đó thêm mà quên xếp nhóm) → fallback 'edit'
 * (⑤ Sửa ảnh, nhóm rộng nhất) — KHÔNG BAO GIỜ biến mất khỏi bảng chọn, đúng luật cũ của tags.ts.
 *
 * ⛔ Khoá ở đây là khoá NHÓM (`source`/`gu`/…), không phải node type — đổi tự do. `node.type`
 * (id kỹ thuật, vd 'ai.idmask') TUYỆT ĐỐI không đổi: flow người dùng đã lưu trỏ theo id đó.
 */

export type NodeGroup = 'source' | 'gu' | 'camera' | 'render' | 'edit' | 'doc';

/** Thứ tự hiện trên bảng chọn = thứ tự quy trình, không phải a-b-c. */
export const GROUP_ORDER: NodeGroup[] = ['source', 'gu', 'camera', 'render', 'edit', 'doc'];

/**
 * Nhãn VI/EN + màu chấm. Màu LẤY LẠI đúng 6 giá trị đã dùng trong `tags.ts` cũ (không chế màu
 * mới — `LUAT-GIAO-DIEN-BAT-BUOC.md` L4).
 */
export const GROUP_META: Record<NodeGroup, { label: string; labelEn: string; color: string }> = {
  source: { label: 'Nguồn', labelEn: 'Source', color: '#38bdf8' },
  gu: { label: 'Gu', labelEn: 'Style', color: '#eab308' },
  camera: { label: 'Máy quay', labelEn: 'Camera', color: '#34d399' },
  render: { label: 'Dựng ảnh', labelEn: 'Render', color: '#8b7cf7' },
  edit: { label: 'Sửa ảnh', labelEn: 'Edit', color: '#f472b6' },
  doc: { label: 'Hồ sơ', labelEn: 'Documentation', color: '#fb923c' },
};

/**
 * node.type → 1 nhóm duy nhất. 18 node đầu là bộ Hoà xếp tay trong phiếu 05/08; phần còn lại
 * (node đời đầu trong `registry.ts`) xếp theo cùng logic quy trình, ghi lý do tại chỗ khi không
 * hiển nhiên.
 */
export const NODE_GROUP: Record<string, NodeGroup> = {
  // ── ① NGUỒN — thứ khởi đầu một bảng làm việc: ảnh/chữ/nét vẽ/khối từ bản vẽ ──
  'ai.text2image': 'source',
  'util.sketchpad': 'source',
  'three.cad2fbx': 'source',
  'input.image': 'source',
  'input.prompt': 'source',
  'input.roominfo': 'source',

  // ── ② GU — thẩm mỹ tham chiếu: ảnh mẫu, hoạ tiết, moodboard, bảng màu ──
  'input.guref': 'gu',
  'ai.pattern': 'gu',
  'ai.moodboard': 'gu',
  'util.palette': 'gu',
  // Chọn phong cách là KHAI GU (japandi/indochine…), không phải "đầu vào ảnh" → ② chứ không ①.
  'input.stylepreset': 'gu',

  // ── ③ MÁY QUAY — góc nhìn & phối cảnh ──
  'three.camera': 'camera',
  'util.warp': 'camera',

  // ── ④ DỰNG ẢNH — bấm ra ảnh/phim mới (kể cả so sánh nhiều bản dựng) ──
  'ai.batchvariants': 'render',
  'render.compare': 'render',
  'ai.sketch2render': 'render',
  'ai.clay2render': 'render',
  'ai.emptystaging': 'render',
  'ai.styletransfer': 'render',
  'ai.exterior': 'render',
  // Video = một bản dựng khác của cùng cảnh (`CHOT-VIDEO-2-TANG-2026-08-02.md` ① Sinh phim).
  'ai.image2video': 'render',
  'ai.text2video': 'render',
  // So sánh ảnh trước/sau: việc của bước xem lại bản dựng, cùng chỗ với So sánh model.
  'util.compare': 'render',

  // ── ⑤ SỬA ẢNH — có ảnh rồi mới dùng: chọn vùng, sửa, tách, cắt ghép ──
  'ai.smartselect': 'edit',
  'ai.localedit': 'edit',
  'ai.idmask': 'edit',
  'ai.furnitureextract': 'edit',
  'util.crop': 'edit',
  'util.composite': 'edit',
  'ai.materialswap': 'edit',
  'ai.furniture': 'edit',
  'ai.relight': 'edit',
  'ai.upscale': 'edit',
  'ai.removebg': 'edit',
  'util.maskpainter': 'edit',
  'util.edit': 'edit',

  // ── ⑥ HỒ SƠ — thứ đi ra ngoài cho khách/nhà thầu xem ──
  'util.materialnote': 'doc',
  'vision.measureobject': 'doc',
  'util.watermark': 'doc',
  'util.annotate': 'doc',
  'slide.concept': 'doc',
  'slide.composer': 'doc',
  'slide.deck': 'doc',
  'out.moodboard': 'doc',
  'out.board': 'doc',
  'out.gallery': 'doc',
};

export function groupOf(nodeType: string): NodeGroup {
  return NODE_GROUP[nodeType] ?? 'edit';
}
