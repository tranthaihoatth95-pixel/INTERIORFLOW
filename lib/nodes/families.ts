/**
 * lib/nodes/families.ts — CHÍN HỌ NODE theo dòng chảy "ảnh → sản phẩm nghề" (Slice 10, 03/09).
 *
 * ── LOOK INSIDE TRƯỚC (luật B25 NO-REBUILD) ──────────────────────────────────────────────────
 *  · `groups.ts` (6 nhóm theo BƯỚC quy trình dựng ảnh: nguồn·gu·máy quay·dựng·sửa·hồ sơ) là
 *    trục "đang ở bước nào" cho BẢNG CHỌN node chặng 3D — GIỮ NGUYÊN, không thay.
 *  · `NodeCategory` (INPUT/AI_GENERATE/…) là trục "node là loại gì về kỹ thuật" — GIỮ NGUYÊN.
 *  · File này là TRỤC THỨ BA: node trả lời câu "nó làm ra THỨ GÌ CỦA NGHỀ" — Nguồn/Ảnh · Hiểu
 *    ảnh · 2D · 3D · Vật liệu/Spec · Dựng ảnh · Phim · BOQ · Trình bày. Đây là trục người MỚI
 *    đọc được ("tôi cần bảng khối lượng thì đi họ BOQ"), và là trục `guided-paths.ts` xếp bước.
 *  Ba trục độc lập, mỗi node đúng 1 giá trị mỗi trục. Không có trục nào bị bỏ để nhường trục kia.
 *
 * ⛔ Khoá ở đây là khoá HỌ (`source`/`understand`/…), không phải `node.type` — `node.type`
 *    TUYỆT ĐỐI không đổi (flow đã lưu trỏ theo id đó).
 * ⛔ Màu: KHÔNG chế hex mới (`LUAT-GIAO-DIEN-BAT-BUOC.md` L4) — mỗi họ trỏ về đúng 1 màu đã có
 *    trong `groups.ts` (`GROUP_META[...].color`), qua `familyColor()`.
 *
 * Node chưa xếp họ (ai đó thêm node mới mà quên) → fallback `'render'`? KHÔNG — fallback là
 * `'understand'`?? Cũng không: fallback CỐ Ý là `'source'`… Lý do chọn: KHÔNG có fallback ngầm
 * nào đúng cho mọi node; vì thế `families.test.ts` khoá bằng máy: MỌI `type:` khai trong
 * `registry.ts` + `defs/*.ts` PHẢI có mặt trong `NODE_FAMILY`, thiếu là test đỏ. `familyOf()`
 * vẫn trả `'render'` cho id lạ (flow cũ mang node đã xoá) để UI không sập — nhưng đó là đường
 * lùi cho DỮ LIỆU CŨ, không phải giấy phép quên xếp họ cho node mới.
 *
 * Import TƯƠNG ĐỐI (test chạy qua `sucrase-node`, không resolve alias `@/`).
 */
import { GROUP_META, type NodeGroup } from './groups';

export type NodeFamily =
  | 'source' // Nguồn/Ảnh — thứ đưa VÀO: ảnh, prompt, thông tin phòng, nét vẽ
  | 'understand' // Hiểu ảnh — đọc ảnh ra dữ liệu: đo, mask, tách, phiếu tham khảo
  | 'draw2d' // 2D — bản vẽ/nắn phối cảnh/ghép/cắt: thao tác mặt phẳng
  | 'model3d' // 3D — máy ảnh, khối từ bản vẽ
  | 'material' // Vật liệu/Spec — ghi chú vật liệu, hoạ tiết, bảng màu, gu
  | 'render' // Dựng ảnh — bấm ra ảnh mới (AI hoặc tất định)
  | 'motion' // Phim — video từ ảnh/chữ
  | 'boq' // BOQ — bảng món/khối lượng, chỉ nhận số đo được
  | 'present'; // Trình bày — slide, board, deck, gallery, đóng dấu

/** Thứ tự = thứ tự dòng chảy nghề (đọc từ trái sang phải trên đường dẫn). */
export const FAMILY_ORDER: NodeFamily[] = [
  'source', 'understand', 'draw2d', 'model3d', 'material', 'render', 'motion', 'boq', 'present',
];

export interface FamilyMeta {
  label: string;
  labelEn: string;
  /** 1 câu cho người mới: họ này trả lời câu gì. */
  blurb: string;
  blurbEn: string;
  /** Màu MƯỢN từ `groups.ts` — không có hex mới. */
  colorFrom: NodeGroup;
}

export const FAMILY_META: Record<NodeFamily, FamilyMeta> = {
  source: { label: 'Nguồn / Ảnh', labelEn: 'Source / Image', blurb: 'Thứ đưa vào: ảnh, chữ, thông tin phòng.', blurbEn: 'What goes in: image, text, room info.', colorFrom: 'source' },
  understand: { label: 'Hiểu ảnh', labelEn: 'Understand / Vision', blurb: 'Đọc ảnh ra dữ liệu: kích thước, mask, phiếu.', blurbEn: 'Read an image into data: sizes, masks, sheets.', colorFrom: 'camera' },
  draw2d: { label: '2D', labelEn: '2D', blurb: 'Thao tác mặt phẳng: nắn, cắt, ghép, vẽ tay.', blurbEn: 'Plane operations: warp, crop, composite, sketch.', colorFrom: 'edit' },
  model3d: { label: '3D', labelEn: '3D', blurb: 'Góc máy và khối dựng từ bản vẽ.', blurbEn: 'Camera and massing from the drawing.', colorFrom: 'camera' },
  material: { label: 'Vật liệu / Spec', labelEn: 'Material / Spec', blurb: 'Vật liệu, hoạ tiết, bảng màu, gu tham chiếu.', blurbEn: 'Materials, patterns, palettes, reference taste.', colorFrom: 'gu' },
  render: { label: 'Dựng ảnh', labelEn: 'Render', blurb: 'Bấm ra ảnh mới — AI hoặc tất định, luôn ghi tầng đã chạy.', blurbEn: 'Produce a new image — AI or deterministic, always labelled.', colorFrom: 'render' },
  motion: { label: 'Phim', labelEn: 'Movie / Motion', blurb: 'Video từ ảnh hoặc chữ.', blurbEn: 'Video from image or text.', colorFrom: 'render' },
  boq: { label: 'BOQ', labelEn: 'BOQ', blurb: 'Bảng món / khối lượng — chỉ nhận số đo được.', blurbEn: 'Item / quantity table — measured numbers only.', colorFrom: 'doc' },
  present: { label: 'Trình bày', labelEn: 'Present', blurb: 'Slide, board, deck, đóng dấu, lưu Gallery.', blurbEn: 'Slides, boards, decks, watermark, gallery.', colorFrom: 'doc' },
};

export function familyColor(f: NodeFamily): string {
  return GROUP_META[FAMILY_META[f].colorFrom].color;
}

/**
 * node.type → ĐÚNG 1 họ. Mọi `type:` trong `registry.ts` + `defs/*.ts` phải có mặt — khoá bằng
 * `families.test.ts` (quét source thật, không tin bảng này tự khai đủ).
 */
export const NODE_FAMILY: Record<string, NodeFamily> = {
  // ── Nguồn / Ảnh ──
  'input.image': 'source',
  'input.prompt': 'source',
  'input.roominfo': 'source',
  'input.stylepreset': 'source',
  'util.sketchpad': 'source',
  'ai.text2image': 'render', // sinh ảnh mới từ chữ — là DỰNG, dù đứng đầu chuỗi
  // ── Hiểu ảnh ──
  'vision.measureobject': 'understand',
  'ai.idmask': 'understand',
  'ai.smartselect': 'understand',
  'ai.removebg': 'understand',
  'ai.furnitureextract': 'understand',
  'ai.refsheet': 'understand',
  'util.maskpainter': 'understand',
  // ── 2D ──
  'util.warp': 'draw2d',
  'util.crop': 'draw2d',
  'util.composite': 'draw2d',
  'util.edit': 'draw2d',
  'util.annotate': 'draw2d',
  // ── 3D ──
  'three.camera': 'model3d',
  'three.cad2fbx': 'model3d',
  // ── Vật liệu / Spec ──
  'util.materialnote': 'material',
  'util.palette': 'material',
  'ai.pattern': 'material',
  'input.guref': 'material',
  // ── Dựng ảnh ──
  'ai.sketch2render': 'render',
  'ai.clay2render': 'render',
  'ai.emptystaging': 'render',
  'ai.styletransfer': 'render',
  'ai.exterior': 'render',
  'ai.moodboard': 'render',
  'ai.batchvariants': 'render',
  'ai.regionrender': 'render',
  'ai.materialswap': 'render',
  'ai.furniture': 'render',
  'ai.relight': 'render',
  'ai.upscale': 'render',
  'ai.localedit': 'render',
  'render.compare': 'render',
  'util.compare': 'render',
  // ── Phim ──
  'ai.image2video': 'motion',
  'ai.text2video': 'motion',
  // ── BOQ ──
  'util.ffetable': 'boq',
  // ── Trình bày ──
  'slide.concept': 'present',
  'slide.composer': 'present',
  'slide.deck': 'present',
  'out.moodboard': 'present',
  'out.board': 'present',
  'out.gallery': 'present',
  'util.watermark': 'present',
};

/** Họ của 1 node. Id lạ (flow cũ) → 'render' để UI không sập — xem docblock đầu file. */
export function familyOf(nodeType: string): NodeFamily {
  return NODE_FAMILY[nodeType] ?? 'render';
}

/** Node thuộc họ này (theo thứ tự khai). */
export function nodeTypesOfFamily(f: NodeFamily): string[] {
  return Object.keys(NODE_FAMILY).filter((t) => NODE_FAMILY[t] === f);
}
