/**
 * lib/nodes/defs/metrology.ts — 2.2.88: mặt tiền node cho `lib/vision/single-view-metrology.ts`
 * (2.2.87). Node DUY NHẤT `vision.measureobject` — 0 credit, tất định.
 *
 * NGUYÊN TẮC BẮT BUỘC (30/07, Hoà sửa sau khi thử ảnh thật): "Bấm Render KHÔNG BAO GIỜ được trả
 * về tay không." `execute()` này KHÔNG throw vì thiếu cấu trúc/mặt nạ/neo — CHỈ throw khi ảnh
 * thật sự không đọc được (CORS/hỏng file). Mọi trường hợp khác đi qua `measureObjectTiered()`
 * (không bao giờ null), tự tụt phương pháp, luôn trả số + độ tin thật.
 *
 * TÁCH MÓN — TÁI SỬ DỤNG, KHÔNG VIẾT MỚI: gọi thẳng `extractForeground()`
 * (lib/render-core/furniture-extract-core.ts) — CHÍNH XÁC hàm mà node `ai.furnitureextract`
 * (render-v2.ts) cũng gọi ở tầng lõi tất định của nó (Luật #6 Đồng Bộ).
 *
 * TẦNG AI (`ctx.aiTier`, `lib/ai/tiers.ts`) — CHỈ dùng để GHI NHÃN hiển thị lúc này (Tầng 2 auto-
 * tìm vật neo qua oneAI và Tầng 3 VLM ước category/tỉ lệ CHƯA xây trong bản này — cần hạ tầng
 * object-detection/VLM riêng, disclose rõ trong docs/IF-FEATURE-TREE.md, không giấu). Phương pháp
 * đo (`TieredMeasurement.tier`, 1-4) hoạt động ĐỘC LẬP với `ctx.aiTier` — kể cả `aiTier===1`
 * (Không AI) vẫn đạt phương pháp 4 (tự động) hoặc 3 (neo tay) nếu ảnh/thao tác cho phép.
 */
import type { NodeDefinition } from '@/lib/types';
import { loadImage } from '@/lib/imaging';
import { extractForeground } from '@/lib/render-core/furniture-extract-core';
import { TIERS, type AiTier } from '@/lib/ai/tiers';
import {
  measureObjectTiered,
  ANCHOR_CONFIG,
  FURNITURE_SIZE_PRIORS,
  type FurnitureCategory,
  type AnchorKind,
  type Pt2D,
  type RgbaImage,
  type ObjectSilhouette,
} from '@/lib/vision/single-view-metrology';

/** Ảnh (dataURL/URL) → buffer RGBA — cùng cách `decodeImage()` cục bộ của render-v2.ts (không
 * export dùng chung ở đó, viết lại tối thiểu ở đây theo đúng pattern, không phát minh cách mới). */
async function decodeToRgba(src: string, maxSide = 1400): Promise<RgbaImage> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');
  ctx.drawImage(img, 0, 0, w, h);
  try {
    const id = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, data: id.data };
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh upload hoặc output từ node khác.');
  }
}

/** 4 góc bbox foreground → đa giác viền tối giản đủ cho `measureObject()` (chỉ cần điểm trái/
 * phải/cao nhất, xem docstring `measureObject()` — không cần contour pixel-chính xác). */
function bboxToCorners(bbox: { x: number; y: number; w: number; h: number }): Pt2D[] {
  return [
    { x: bbox.x, y: bbox.y },
    { x: bbox.x + bbox.w, y: bbox.y },
    { x: bbox.x + bbox.w, y: bbox.y + bbox.h },
    { x: bbox.x, y: bbox.y + bbox.h },
  ];
}

const CATEGORY_OPTIONS = Object.keys(FURNITURE_SIZE_PRIORS) as FurnitureCategory[];

interface ManualAnchorPayload {
  kind: AnchorKind;
  points: [Pt2D, Pt2D];
  realMm: number;
}

export const metrologyNodes: NodeDefinition[] = [
  {
    type: 'vision.measureobject',
    title: 'Ghi kích thước',
    titleEn: 'Dimension Annotation',
    category: 'UTILITY',
    description:
      'Chọn loại đồ → tách món (nếu được) → suy Rộng×Sâu×Cao thật (mm), có sai số + phân nhóm 🟢 ĐO/🟡 SUY. ' +
      'Luôn ra số — tự tụt phương pháp khi ảnh thiếu cấu trúc/neo, không dừng lại báo lỗi. ' +
      'KHÔNG dựng mesh 3D, KHÔNG sinh góc phối cảnh mới (xem docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md).',
    inputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    outputs: [{ id: 'measurement', label: 'Kích thước (JSON)', dataType: 'text' }],
    // 2 param VISIBLE mặc định (ToolModeForm gom vào "Tinh chỉnh" thu gọn, xem 2.2.88) — category
    // là lựa chọn CHÍNH người dùng cần làm trước khi bấm Render.
    params: [
      { kind: 'select', id: 'category', label: 'Loại đồ', options: CATEGORY_OPTIONS.map((k) => FURNITURE_SIZE_PRIORS[k].label) },
      {
        kind: 'slider',
        id: 'cameraHeightMm',
        label: `${ANCHOR_CONFIG.cameraHeight.label} (mm)`,
        min: ANCHOR_CONFIG.cameraHeight.minMm - 50,
        max: ANCHOR_CONFIG.cameraHeight.maxMm + 300,
        step: 10,
        default: ANCHOR_CONFIG.cameraHeight.typicalMm,
      },
      { kind: 'slider', id: 'bgTolerance', label: 'Ngưỡng nền (tách món)', min: 0.1, max: 0.5, step: 0.05, default: 0.25 },
    ],
    creditCost: 0,
    async execute(ctx) {
      const { inputs, params, onProgress, aiTier } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const src = String(inputs.image.value);

      // category: ToolModeForm ghi LABEL (select options là label, không phải key — UI đơn giản
      // hơn khi hiện dropdown) — tra ngược lại key qua FURNITURE_SIZE_PRIORS.
      const categoryLabel = String(params.category || '');
      const category: FurnitureCategory = CATEGORY_OPTIONS.find((k) => FURNITURE_SIZE_PRIORS[k].label === categoryLabel) ?? 'other';

      onProgress(0.1);
      // CHỈ throw khi ảnh THẬT SỰ không đọc được (CORS/hỏng) — decodeToRgba tự throw đúng lúc đó.
      const rgba = await decodeToRgba(src);
      onProgress(0.3);

      // Tách món — TÁI DÙNG extractForeground(), KHÔNG viết engine mới. KHÔNG throw khi fail —
      // tự rơi về "chưa có mặt nạ", measureObjectTiered() tụt xuống phương pháp 1 (chỉ loại đồ).
      const core = extractForeground(rgba.data, rgba.width, rgba.height, Number(params.bgTolerance) || 0.25);
      const silhouette: ObjectSilhouette | undefined = core.bbox ? { front: bboxToCorners(core.bbox) } : undefined;
      onProgress(0.5);

      // Neo tay (nếu ToolModeForm đã ghi qua updateParam — KHÔNG khai trong `params` ở trên vì
      // chỉ xuất hiện SAU khi người dùng khoanh 2 điểm trên ảnh, xem measurement-spec-sheet.ts.
      let manualAnchor: ManualAnchorPayload | undefined;
      const rawAnchor = params.manualAnchorJson;
      if (typeof rawAnchor === 'string' && rawAnchor.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawAnchor) as ManualAnchorPayload;
          if (parsed.points?.length === 2 && parsed.realMm > 0) manualAnchor = parsed;
        } catch {
          /* JSON hỏng — bỏ qua, coi như chưa có neo tay (không throw, đúng nguyên tắc). */
        }
      }

      const knownWidthMmRaw = Number(params.knownWidthMm);
      const knownWidthMm = Number.isFinite(knownWidthMmRaw) && knownWidthMmRaw > 0 ? knownWidthMmRaw : undefined;

      // G-M20-07: measureObjectTiered() chạy đồng bộ (vòng lặp pixel dò cạnh) — có thể mất >1s
      // trên ảnh lớn, và onProgress() chỉ đổi STATE, không tự vẽ lại màn hình giữa lúc luồng JS
      // đang bận. Báo 0.7 rồi NHƯỜNG một tick cho trình duyệt vẽ xong thanh tiến độ TRƯỚC khi
      // chặn luồng — không vậy thanh chờ đứng yên ở 0.5 suốt quãng tính nặng nhất rồi nhảy thẳng 1.
      onProgress(0.7);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const result = measureObjectTiered({
        category,
        silhouette,
        image: rgba,
        cameraHeightMm: Number(params.cameraHeightMm) || ANCHOR_CONFIG.cameraHeight.typicalMm,
        knownWidthMm,
        manualAnchor,
      });
      onProgress(1);

      const tierName = TIERS[aiTier as AiTier]?.name ?? 'Không AI';
      const bgWarn = core.warnings.length ? ` · ${core.warnings.join(' ')}` : '';
      const payload = {
        ...result,
        aiTier,
        aiTierName: tierName,
        hasSilhouette: !!silhouette,
        warnings: core.warnings,
      };
      return {
        measurement: { dataType: 'text', value: JSON.stringify(payload) },
        _tier: { dataType: 'text', value: `Tầng ${aiTier} · ${tierName} · ${result.tierLabel} · độ tin ${result.confidencePercent}%${bgWarn}` },
      };
    },
  },
];
