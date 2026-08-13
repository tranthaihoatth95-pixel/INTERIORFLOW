/**
 * lib/nodes/defs/grounded-render.ts — GroundedRender ("Render bám ý") · 2 node lát v0:
 *
 *  · ai.refsheet      — Phiếu đọc tham khảo: ảnh B → phiếu 4 cấp (JSON + bản đọc) cho KTS
 *                       duyệt/sửa TỪNG DÒNG. Đường vision tái dùng /api/vision/caption.
 *  · ai.regionrender  — Render bám ý (mảng): ảnh A + mask cứng MỘT mảng + phiếu ĐÃ DUYỆT
 *                       → inpaint đúng mảng đó (task materialSwap, guidance/image_size theo
 *                       fix F2). CẤM chạy khi chưa duyệt phiếu, CẤM chạy khi thiếu mask [T5][T6].
 *
 * Luồng v0 (SPEC-GROUNDED-RENDER §4): Nhập ảnh B → Phiếu đọc tham khảo → (người duyệt/sửa
 * phiếu trong ô param) → Render bám ý (mảng) nhận ảnh A + mask (từ Mặt nạ đối tượng /
 * Chọn vùng / Vẽ mask) → chạy TỪNG mảng, seed chung đợt. Node cũ không đổi hành vi.
 */
import type { ExecContext, NodeDefinition, PortValue } from '@/lib/types';
import { runImageJob, checkProviders, AiJobError } from '@/lib/ai/client';
import { providerForTier } from '@/lib/ai/tiers';
import { loadImage } from '@/lib/imaging';
import {
  decodeReferenceSheet,
  emptyReferenceSheet,
  encodeReferenceSheet,
  regionLabelToId,
  sheetToText,
  sheetValues,
  REGION_IDS,
} from '@/lib/grounded-render/types';
import { readReferenceSheet } from '@/lib/grounded-render/reference-sheet';
import {
  composeRegionInpaint,
  fitMaskImageSize,
  keepLabelToId,
  KEEP_LEVELS,
} from '@/lib/grounded-render/region-inpaint';

/** Port ẩn `_tier` — NodeExtras hiện badge tầng đã chạy (cùng khuôn render-v2.ts). */
const tierPort = (label: string): PortValue => ({ dataType: 'text', value: label });

/** Provider của tier hiện tại sẵn sàng chưa — cùng logic tierProviderReady của render-v2.ts
 * (hàm đó module-private nên chép logic 5 dòng, không đổi hành vi). */
async function providerReady(ctx: ExecContext): Promise<boolean> {
  const provider = providerForTier(ctx.aiTier, ctx.oneAiEngine);
  if (!provider) return false;
  const st = await checkProviders();
  if (provider === 'fal') return st.fal;
  if (provider === 'comfyui') return st.comfyui;
  return st.sd;
}

const SHEET_MODES = ['Máy đọc ảnh (cần key)', 'Phiếu trống — điền tay'];
const APPROVE_OPTIONS = ['Chưa duyệt phiếu', 'Đã duyệt phiếu'];

export const groundedRenderNodes: NodeDefinition[] = [
  // ============ 1) PHIẾU ĐỌC THAM KHẢO ============
  {
    type: 'ai.refsheet',
    title: 'Phiếu đọc tham khảo',
    titleEn: 'Reference Reading Sheet',
    category: 'AI_EDIT',
    description:
      'Đọc ảnh tham khảo ra phiếu 4 cấp (tổng thể · trần/tường/sàn · vật liệu · chi tiết) để duyệt/sửa từng dòng TRƯỚC khi áp vào render. Máy chỉ suy — mọi dòng chờ người duyệt. Chưa có key VLM: chọn "Phiếu trống — điền tay".',
    inputs: [{ id: 'image', label: 'Ảnh tham khảo', dataType: 'image' }],
    outputs: [
      { id: 'sheet', label: 'Phiếu (JSON)', dataType: 'text' },
      { id: 'text', label: 'Phiếu (bản đọc)', dataType: 'text' },
    ],
    params: [{ kind: 'select', id: 'mode', label: 'Cách lập phiếu', options: SHEET_MODES }],
    keywords: ['phiếu', 'tham khảo', 'đọc ảnh', 'reference', 'moodboard'],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      if (!inputs.image) throw new Error('Thiếu ảnh tham khảo ở input.');
      onProgress(0.2);
      const manual = String(params.mode) === SHEET_MODES[1];
      let sheet;
      let tier: string;
      if (manual) {
        sheet = emptyReferenceSheet('anh-b');
        tier = 'Phiếu trống — người điền tay từng dòng (không AI)';
      } else {
        // Đường vision sẵn có (/api/vision/caption → VLM NVIDIA). Lỗi → BÁO RÕ, không tự tụt
        // sang phiếu trống (cùng cơ chế "chỉ báo, không tự tụt" của provider nvidia.ts).
        sheet = await readReferenceSheet(String(inputs.image.value));
        tier = 'Tầng AI · VLM đọc ảnh — điền cấp ①+③; cấp ②④ máy chưa đọc được, điền tay';
      }
      onProgress(0.9);
      return {
        sheet: { dataType: 'text', value: encodeReferenceSheet(sheet) },
        text: { dataType: 'text', value: sheetToText(sheet) },
        _tier: tierPort(tier),
      };
    },
  },

  // ============ 2) RENDER BÁM Ý (MẢNG) ============
  {
    type: 'ai.regionrender',
    title: 'Render bám ý (mảng)',
    titleEn: 'Reference-guided Render (region)',
    category: 'AI_EDIT',
    description:
      'Áp giá trị ĐÃ DUYỆT từ phiếu đọc tham khảo vào ĐÚNG MỘT mảng qua mask cứng — không trộn toàn ảnh. Bắt buộc: mask mảng + phiếu đã duyệt. Mảng nào hỏng chạy lại riêng mảng đó, seed chung đợt.',
    inputs: [
      { id: 'image', label: 'Ảnh trọng tâm (A)', dataType: 'image' },
      { id: 'mask', label: 'Mask mảng', dataType: 'mask' },
      { id: 'sheet', label: 'Phiếu (JSON)', dataType: 'text' },
    ],
    outputs: [{ id: 'image', label: 'Ảnh', dataType: 'image' }],
    params: [
      {
        kind: 'text',
        id: 'sheetEdit',
        label: 'Duyệt/sửa phiếu (dán JSON — sửa dòng nào cứ sửa)',
        placeholder: 'Trống = dùng nguyên phiếu từ dây nối. Dán JSON phiếu vào đây để sửa từng dòng.',
        multiline: true,
      },
      { kind: 'select', id: 'approve', label: 'Trạng thái phiếu', options: APPROVE_OPTIONS },
      { kind: 'select', id: 'region', label: 'Mảng áp', options: REGION_IDS.map((r) => r.label) },
      {
        kind: 'text',
        id: 'instruction',
        label: 'Áp gì vào mảng này',
        placeholder: 'Trống = lấy từ phiếu (③ vật liệu + ① tổng thể). Vd: sàn gỗ sồi bản lớn, phủ mờ…',
        multiline: true,
      },
      { kind: 'select', id: 'keep', label: 'Mức bám hiện trạng', options: KEEP_LEVELS.map((k) => k.label) },
      { kind: 'text', id: 'seed', label: 'Seed (chung đợt, tuỳ chọn)', placeholder: 'vd 4213' },
    ],
    keywords: ['bám ý', 'mảng', 'inpaint', 'vật liệu', 'tham khảo', 'render'],
    creditCost: 4,
    async execute(ctx) {
      const { inputs, params, onProgress } = ctx;
      if (!inputs.image) throw new Error('Thiếu ảnh trọng tâm (A) ở input.');
      // [T6] mask cứng bắt buộc — không có nhánh "áp toàn ảnh".
      if (!inputs.mask) {
        throw new Error('Thiếu mask mảng — nối Mặt nạ đối tượng / Chọn vùng / Vẽ mask vào. Không áp lên toàn ảnh.');
      }

      // Phiếu: ô duyệt/sửa (param) ĐÈ dây nối — người sửa dòng nào lấy dòng đó.
      const sheetText = String(params.sheetEdit ?? '').trim() || (inputs.sheet ? String(inputs.sheet.value) : '');
      if (!sheetText) {
        throw new Error('Chưa có phiếu đọc tham khảo — nối node "Phiếu đọc tham khảo" hoặc dán phiếu vào ô duyệt/sửa.');
      }
      const decoded = decodeReferenceSheet(sheetText);
      if (!decoded.sheet) throw new Error(decoded.error ?? 'Phiếu không đọc được.');

      // [T5] cửa người duyệt — máy trình phiếu, người gật rồi mới chạy. Không một-nút-trộn-thẳng.
      if (String(params.approve) !== APPROVE_OPTIONS[1]) {
        throw new Error('Phiếu chưa duyệt — đọc/sửa phiếu rồi chọn "Đã duyệt phiếu" mới chạy mảng này.');
      }

      const regionId = regionLabelToId(String(params.region ?? ''));
      const instruction =
        String(params.instruction ?? '').trim() ||
        [...sheetValues(decoded.sheet, 'vat-lieu'), ...sheetValues(decoded.sheet, 'tong-the')].join(', ');

      // F2 image_size từ ảnh A — đọc thất bại thì bỏ qua, không chặn job (hành vi F2).
      let imageSize: { width: number; height: number } | undefined;
      try {
        const img = await loadImage(String(inputs.image.value));
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w && h) imageSize = fitMaskImageSize(w, h);
      } catch {
        imageSize = undefined;
      }

      const seedNum = Number(params.seed);
      const job = composeRegionInpaint({
        imageA: String(inputs.image.value),
        mask: String(inputs.mask.value),
        regionId,
        instruction,
        keep: keepLabelToId(String(params.keep ?? '')),
        seed: Number.isFinite(seedNum) && String(params.seed ?? '').trim() !== '' ? seedNum : undefined,
        imageSize,
      });

      // Node này KHÔNG có tầng lõi giả lập — thiếu provider thì báo rõ, không mock [T0].
      if (!(await providerReady(ctx))) {
        throw new Error('Chưa nối provider inpaint (FAL_KEY / ComfyUI / SD) — thêm key rồi chạy lại. Node này không chạy giả.');
      }
      onProgress(0.1);
      try {
        const urls = await runImageJob(job.task, job.input, onProgress, ctx.aiTier, ctx.oneAiEngine);
        if (!urls.length) throw new Error('Provider không trả ảnh.');
        return {
          image: { dataType: 'image', value: urls[0] },
          _tier: tierPort(`Tầng AI · inpaint mảng "${regionId}" qua mask cứng (FLUX Fill)`),
        };
      } catch (err) {
        if (err instanceof AiJobError && err.code === 'PROVIDER_NOT_CONFIGURED') {
          throw new Error('Provider inpaint chưa cấu hình — thêm FAL_KEY hoặc ComfyUI rồi chạy lại.');
        }
        throw err;
      }
    },
  },
];
