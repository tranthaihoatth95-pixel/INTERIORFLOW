/**
 * Hệ TAG chức năng cho node — tách khỏi `category` (kỹ thuật/nội bộ) để NodeLibraryPanel
 * nhóm theo VIỆC người dùng muốn làm, không phải theo tầng kỹ thuật. Đặt ở file riêng
 * (không đụng NodeDefinition trong lib/types.ts) đúng seam "không phá types dùng chung".
 *
 * Node KHÔNG có mặt trong NODE_TAGS (vd node mới ai chưa gắn tag) → fallback 'utility',
 * không bao giờ "biến mất" khỏi panel.
 */

export type NodeTag =
  | 'input'
  | 'ai-generate'
  | 'edit'
  | 'material'
  | 'layout-present'
  | 'utility'
  | 'video';

export const TAG_ORDER: NodeTag[] = [
  'input',
  'ai-generate',
  'edit',
  'material',
  'layout-present',
  'video',
  'utility',
];

export const TAG_META: Record<NodeTag, { label: string; color: string }> = {
  input: { label: 'Đầu vào', color: '#38bdf8' },
  'ai-generate': { label: 'Sinh ảnh AI', color: '#8b7cf7' },
  edit: { label: 'Chỉnh sửa', color: '#f472b6' },
  material: { label: 'Vật liệu', color: '#eab308' },
  'layout-present': { label: 'Bố cục / Trình bày', color: '#fb923c' },
  utility: { label: 'Tiện ích', color: '#34d399' },
  video: { label: 'Video', color: '#fb7185' },
};

/** node.type → 1+ tag. Node có thể thuộc nhiều tag (vd Style Transfer vừa AI vừa Edit). */
export const NODE_TAGS: Record<string, NodeTag[]> = {
  // ---- Input ----
  'input.image': ['input'],
  'input.prompt': ['input'],
  'input.stylepreset': ['input'],
  'input.roominfo': ['input'],
  'input.guref': ['input', 'material'],

  // ---- AI Generate ----
  'ai.sketch2render': ['ai-generate'],
  'ai.clay2render': ['ai-generate'],
  'ai.emptystaging': ['ai-generate'],
  'ai.styletransfer': ['ai-generate', 'edit'],
  'ai.moodboard': ['ai-generate', 'material'],
  'ai.exterior': ['ai-generate'],
  'ai.batchvariants': ['ai-generate'],
  'ai.image2video': ['ai-generate', 'video'],
  'ai.text2video': ['ai-generate', 'video'],
  'render.compare': ['ai-generate'],

  // ---- Render v2 (2 tầng — defs/render-v2.ts) ----
  'ai.text2image': ['ai-generate'],
  'three.camera': ['input'],
  'three.cad2fbx': ['input', 'utility'],
  'ai.idmask': ['edit', 'utility'],
  'ai.furnitureextract': ['edit'],
  'ai.localedit': ['edit', 'material'],

  // ---- AI Edit ----
  'ai.materialswap': ['edit', 'material'],
  'ai.furniture': ['edit'],
  'ai.relight': ['edit'],
  'ai.upscale': ['edit'],
  'ai.removebg': ['edit'],

  // ---- Slide / Present ----
  'slide.concept': ['layout-present'],
  'slide.composer': ['layout-present'],
  'slide.deck': ['layout-present'],

  // ---- Utility ----
  'util.maskpainter': ['edit', 'utility'],
  'util.sketchpad': ['edit', 'utility'],
  'util.edit': ['edit', 'utility'],
  'util.palette': ['material', 'utility'],
  'util.compare': ['utility'],
  'util.annotate': ['layout-present', 'utility'],
  'util.watermark': ['utility', 'layout-present'],
  'util.crop': ['utility', 'edit'],
  'util.composite': ['utility', 'edit'],
  'util.materialnote': ['material', 'layout-present'],

  // ---- Output ----
  'out.moodboard': ['layout-present', 'material'],
  'out.board': ['layout-present'],
  'out.gallery': ['utility'],
};

export function tagsFor(nodeType: string): NodeTag[] {
  const tags = NODE_TAGS[nodeType];
  return tags && tags.length ? tags : ['utility'];
}
