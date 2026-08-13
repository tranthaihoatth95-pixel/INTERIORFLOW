/**
 * lib/grounded-render/region-inpaint.ts — GroundedRender · SINH THEO MẢNG (B5):
 * soạn THAM SỐ cho inpaint MỘT mảng qua mask cứng — thuần, test được, không gọi mạng.
 *
 * Đường inpaint TÁI DÙNG: task `materialSwap` (lib/ai/models.ts:81 → fal-ai/flux-pro/v1/fill,
 * comfy 'inpaint') — cùng task mà node "Sửa vùng" (`ai.localedit`, lib/nodes/defs/render-v2.ts)
 * đang gọi qua `runImageJob`. File này CHỈ soạn {task, input}; node def gọi mạng.
 *
 * Luật cứng [T6] SPEC-GROUNDED-RENDER §2 B5: KHÔNG BAO GIỜ trộn toàn cục —
 * thiếu mask = LỖI RÕ RÀNG, không fallback áp toàn ảnh (khác hành vi nhân nhượng của
 * ai.localedit vốn là công cụ chỉnh tay).
 *
 * Guidance: import từ `CONTROL_GUIDANCE_DEFAULT` (fix F2 13/08, lib/ai/models.ts:141) —
 * KHÔNG chép số. FLUX Fill cùng họ FLUX Pro control: guidance thấp 3.5–4 mới bám;
 * số cao (copy từ text2img) là đúng bệnh F2.
 *
 * Import tương đối để test sucrase-node chạy được.
 */
import { CONTROL_GUIDANCE_DEFAULT } from '../ai/models';
import type { RegionId } from './types';

/** Guidance inpaint mảng — đọc từ bảng F2 (không hardcode số tại đây). */
export const REGION_INPAINT_GUIDANCE: number = CONTROL_GUIDANCE_DEFAULT.sketch2render ?? 4;

/** Task AI tái dùng — cùng task node Sửa vùng (FLUX Fill / comfy inpaint). */
export const REGION_INPAINT_TASK = 'materialSwap' as const;

/**
 * Mức bám (giữ hiện trạng trong mảng) — 3 nấc, thể hiện qua CHỮ trong prompt.
 * v0 không truyền `strength` cho provider: fal flux-pro/v1/fill không khai tham số này
 * (chỉ comfy 'inpaint' đọc IF_STRENGTH) — truyền mù là giả điều khiển. Núm per-mảng
 * đúng nghĩa là việc v1 (bảng ánh xạ + núm, phiếu ghi rõ KHÔNG làm trước).
 */
export type KeepLevel = 'thoang' | 'vua' | 'chat';
export const KEEP_LEVELS: Array<{ id: KeepLevel; label: string; hint: string }> = [
  { id: 'thoang', label: 'Thoáng', hint: 'reimagine the masked surface freely while keeping room geometry' },
  { id: 'vua', label: 'Vừa', hint: 'keep the masked surface structure, change material and tone' },
  { id: 'chat', label: 'Chặt', hint: 'subtle change only, preserve existing material character and lighting in the masked area' },
];

export function keepLabelToId(label: string): KeepLevel {
  const hit = KEEP_LEVELS.find((k) => k.label === label || k.id === label);
  return hit ? hit.id : 'vua';
}

/**
 * F2 image_size: khớp TỈ LỆ ảnh gốc, cạnh dài ≤1024, bội 8 (min 8) — cùng luật với
 * `scaleToMaxSide` (lib/nodes/registry.ts:197). Chép LUẬT chứ không import được hàm đó:
 * registry.ts value-import '@/lib/ai/client' (sucrase-node không resolve '@/') và
 * registry ← defs ← file này sẽ thành vòng import. ĐỀ XUẤT LÊN T: nhấc scaleToMaxSide
 * ra module thuần dùng chung rồi xoá bản này (ghi trong báo cáo phiên).
 */
export function fitMaskImageSize(w: number, h: number, max = 1024): { width: number; height: number } {
  const long = Math.max(w, h);
  const scale = long > max ? max / long : 1;
  const round8 = (n: number) => Math.max(8, Math.round((n * scale) / 8) * 8);
  return { width: round8(w), height: round8(h) };
}

export interface RegionInpaintSpec {
  /** ảnh A (trọng tâm) — dataURL/URL */
  imageA: string;
  /** mask cứng của MỘT mảng (trắng = vùng áp) — BẮT BUỘC */
  mask: string;
  /** định danh mảng (RegionId) — vào prompt + để truy vết */
  regionId: RegionId;
  /** chỉ dẫn áp cho mảng (từ phiếu đã duyệt + người gõ) — BẮT BUỘC */
  instruction: string;
  keep: KeepLevel;
  /** seed chung đợt — các mảng cùng đợt truyền cùng seed */
  seed?: number;
  /** kích thước F2 (từ fitMaskImageSize trên ảnh A) — không đọc được thì bỏ, không chặn job */
  imageSize?: { width: number; height: number };
}

export interface RegionInpaintJob {
  task: typeof REGION_INPAINT_TASK;
  input: Record<string, unknown>;
}

/**
 * Soạn job inpaint MỘT mảng. Throw chữ rõ khi thiếu mask/chỉ dẫn — KHÔNG có nhánh
 * "không mask thì áp toàn ảnh" (test khoá luật này).
 */
export function composeRegionInpaint(spec: RegionInpaintSpec): RegionInpaintJob {
  if (!spec.mask || !spec.mask.trim()) {
    throw new Error('Thiếu mask mảng — nối Mặt nạ đối tượng / Chọn vùng / Vẽ mask vào. Không áp lên toàn ảnh.');
  }
  if (!spec.imageA || !spec.imageA.trim()) {
    throw new Error('Thiếu ảnh trọng tâm (ảnh A) ở input.');
  }
  const instruction = spec.instruction.trim();
  if (!instruction) {
    throw new Error('Chưa có chỉ dẫn cho mảng này — duyệt phiếu đọc tham khảo hoặc gõ vào ô "Áp gì vào mảng".');
  }
  const keep = KEEP_LEVELS.find((k) => k.id === spec.keep) ?? KEEP_LEVELS[1];
  const prompt = [
    instruction,
    keep.hint,
    'photorealistic interior, seamless with surrounding, matching lighting and perspective',
  ].join(', ');
  const seed = Number.isFinite(spec.seed) ? Math.floor(spec.seed as number) : undefined;
  return {
    task: REGION_INPAINT_TASK,
    input: {
      prompt,
      image_url: spec.imageA,
      mask_url: spec.mask,
      guidance_scale: REGION_INPAINT_GUIDANCE,
      num_images: 1,
      ...(seed !== undefined ? { seed } : {}),
      ...(spec.imageSize ? { image_size: spec.imageSize } : {}),
    },
  };
}
