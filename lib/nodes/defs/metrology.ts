/**
 * lib/nodes/defs/metrology.ts — 2.2.88: mặt tiền node cho `lib/vision/single-view-metrology.ts`
 * (2.2.87). Node DUY NHẤT `vision.measureobject` — 0 credit, tất định, KHÔNG gọi AI provider nào.
 *
 * TÁCH MÓN — TÁI SỬ DỤNG, KHÔNG VIẾT MỚI: gọi thẳng `extractForeground()`
 * (lib/render-core/furniture-extract-core.ts) — CHÍNH XÁC hàm mà node `ai.furnitureextract`
 * (render-v2.ts) cũng gọi ở tầng lõi tất định của nó (Luật #6 Đồng Bộ — một cỗ máy, mặt tiền
 * khác). KHÔNG dựng chuỗi 3-node (input.image → ai.furnitureextract → node này) qua
 * `tool-mode-graph.ts`: hàm đó hiện CHỈ hỗ trợ đúng 2-node, dùng CHUNG cho cả 6 thẻ Tool Mode
 * khác — mở rộng thành 3-node cho riêng 1 thẻ này rủi ro ảnh hưởng 6 thẻ kia (đã cân nhắc, chọn
 * tái dùng HÀM LÕI thay vì NODE để giữ đúng phạm vi "Lát cắt 1", KHÔNG đụng hạ tầng chung).
 *
 * ANCHOR (neo thang đo) — SCOPE Lát cắt 1: CHỈ 1 nguồn (chiều cao máy ảnh, mốc MẠNH NHẤT theo
 * `docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md` §1/§3②) qua 1 tham số số — KHÔNG dựng UI khoanh 2
 * điểm cho vật chuẩn khác (cửa/bậc thang/gạch...) — đó cần tương tác click-điểm-trên-ảnh (canvas
 * riêng), ngoài phạm vi thẻ "auto-run" đơn giản. `anchorScale()` (2.2.87) đã thiết kế nhận NHIỀU
 * nguồn — mở UI đa-neo là việc thêm THẺ/tham số, không phải sửa engine, để lại cho lượt sau nếu
 * cần độ tin cậy cao hơn (1 nguồn = confidence 0.6, xem `anchorScale()`).
 */
import type { NodeDefinition } from '@/lib/types';
import { loadImage } from '@/lib/imaging';
import { extractForeground } from '@/lib/render-core/furniture-extract-core';
import {
  calibrateFromImage,
  anchorScale,
  measureObject,
  ANCHOR_CONFIG,
  type MeasurementResult,
  type Pt2D,
  type RgbaImage,
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

export const metrologyNodes: NodeDefinition[] = [
  {
    type: 'vision.measureobject',
    title: 'Đo món đồ · Measure Object',
    category: 'UTILITY',
    description:
      'Khoanh/chọn 1 món nội thất trong ảnh → suy Rộng×Sâu×Cao thật (mm), có sai số + phân nhóm 🟢 ĐO/🟡 SUY. ' +
      'Hiệu chỉnh camera từ điểm tụ ảnh (tất định, 0 credit) + neo bằng chiều cao máy ảnh lúc chụp. ' +
      'KHÔNG dựng mesh 3D, KHÔNG sinh góc phối cảnh mới (xem docs/TU-VAN-ANH-SANG-BAN-VE-2026-07-30.md).',
    inputs: [{ id: 'image', label: 'Ảnh (thấy rõ cạnh tường/sàn để hiệu chỉnh camera)', dataType: 'image' }],
    outputs: [{ id: 'measurement', label: 'Kích thước (JSON)', dataType: 'text' }],
    params: [
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
      const { inputs, params, onProgress } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh ở input.');
      const src = String(inputs.image.value);

      onProgress(0.1);
      const rgba = await decodeToRgba(src);

      // Tách món — TÁI DÙNG extractForeground() (xem docstring đầu file), KHÔNG viết engine mới.
      const core = extractForeground(rgba.data, rgba.width, rgba.height, Number(params.bgTolerance));
      if (!core.bbox) {
        throw new Error('Không tách được món đồ khỏi nền (ảnh nền quá phức tạp cho tầng lõi tất định) — thử ảnh có nền phẳng hơn hoặc khoanh vùng tay.');
      }
      onProgress(0.4);

      // Hiệu chỉnh camera từ CHÍNH ảnh gốc (cần cạnh tường/sàn — Manhattan world) — bước ①.
      const calib = calibrateFromImage(rgba);
      if ('needsManualScale' in calib) {
        throw new Error(`Không hiệu chỉnh được camera từ ảnh này: ${calib.reason} Đây LÀ kết quả đúng (không đoán bừa), không phải lỗi — thử ảnh thấy rõ cạnh tường/sàn/trần hơn.`);
      }
      onProgress(0.7);

      // Neo thang đo — Lát cắt 1: CHỈ chiều cao máy ảnh (mốc mạnh nhất, không cần khoanh điểm gì thêm).
      const scale = anchorScale(calib, [
        { kind: 'cameraHeight', realLengthMm: Number(params.cameraHeightMm), imagePoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }], vertical: true },
      ]);

      const result: MeasurementResult = measureObject(calib, scale, { front: bboxToCorners(core.bbox) });
      onProgress(1);

      const bgWarn = core.warnings.length ? ` · ${core.warnings.join(' ')}` : '';
      const payload = {
        ...result,
        calibConfidence: calib.confidence,
        scaleConfidence: scale.confidence,
        fgRatio: core.fgRatio,
        warnings: core.warnings,
      };
      return {
        measurement: { dataType: 'text', value: JSON.stringify(payload) },
        _tier: { dataType: 'text', value: `Tất định (hiệu chỉnh camera + neo cao máy ảnh, confidence camera ${(calib.confidence * 100).toFixed(0)}% · thang đo ${(scale.confidence * 100).toFixed(0)}%)${bgWarn}` },
      };
    },
  },
];
