'use client';

/**
 * lib/present-editor/print-upscale.ts — P3 PHẦN 2 (02/08, Hoà chốt hướng "CHUẨN NGUỒN IN"
 * sau khi đọc số đo thật `scripts/measure-upscale-dpi.ts`): ×4 (ESRGAN) chạy ĐÚNG lý thuyết —
 * nguồn ảnh ≥ ngưỡng cần thiết thì A3 300dpi đạt được ngay; nguồn nhỏ hơn thì upscale 2 BƯỚC
 * (×4 rồi ×2 phần thiếu — 2 mức scale DUY NHẤT `ai.upscale` hỗ trợ, xem `lib/nodes/registry.ts`
 * node `ai.upscale`). Cache theo hash `src` (không phải element id — ẢNH giống nhau dùng lại ở
 * nhiều slide/nhiều lần xuất chỉ trả tiền MỘT LẦN, xem `upscale-cache.ts`).
 *
 * Đích thật: từng ẢNH element/backgroundImage cần bao nhiêu px để hiển thị ĐÚNG kích thước nó
 * chiếm trên trang in ở `dpi` — không phải một ngưỡng cố định cho mọi ảnh (ảnh nhỏ trên trang
 * cần ít px hơn ảnh full-bleed). Công thức suy thẳng từ `printResScale()` (đã có, `stage-
 * presets.ts`): `targetPx = (frame.w% / 100) × (mm.w / 25.4) × dpi`, cùng `mm.w` cấp cho
 * `printResScale`, chỉ nhân thêm tỉ lệ chiếm-trang của phần tử.
 *
 * KHÔNG mutate `deck` gốc (đang mở trong editor) — trả DECK MỚI chỉ dùng để render PDF lần này.
 * User không thấy ảnh gốc trong project bị âm thầm thay bằng bản AI-upscale.
 *
 * Credit spend/refund CÙNG khuôn `lib/execution.ts` `execNode()` (server ledger `/api/credits`
 * nếu đã đăng nhập, local `store.spendCredits` nếu chưa) — viết lại tại đây thay vì import
 * `execution.ts` để KHÔNG kéo theo toàn bộ máy chạy node-graph vào đường export (rủi ro thấp
 * hơn, blast radius hẹp); 2 nơi cùng gọi `/api/credits` nên không lệch hợp đồng server.
 */
import type { EditorDeck, EditorSlide, ImageElement } from './model';
import { PAPER_SIZE_MM, DEFAULT_STAGE_PRESET, type StagePresetId } from './stage-presets';
import { runImageJob, checkProviders } from '@/lib/ai/client';
import { providerForTier, type AiTier } from '@/lib/ai/tiers';
import { useFlowStore } from '@/lib/store';
import { getCachedUpscale, putCachedUpscale, hashSrc } from './upscale-cache';

/** creditCost của node `ai.upscale` (registry.ts) — 1 lần gọi ESRGAN = 2cr, bất kể scale 2/4. */
const CREDIT_PER_STEP = 2;
/** Làm tròn từ số đo THẬT `measure-upscale-dpi.ts` (02/08): TB 9.7s/lần gọi (8.7s@512px,
 * 10.6s@896px) — ước hiển thị trước khi bấm, KHÔNG phải cam kết chính xác (thời gian thật phụ
 * thuộc kích thước ảnh + tải mạng lúc chạy). */
const UPSCALE_CALL_MS = 10_000;

export class UpscaleCreditError extends Error {
  constructor(public src: string) {
    super('Hết credits khi nâng độ phân giải ảnh.');
  }
}

function targetPxForFrameWidth(framePct: number, stagePreset: StagePresetId, dpi: number): number {
  const mm = PAPER_SIZE_MM[stagePreset];
  if (!mm) return 0;
  return Math.round((framePct / 100) * (mm.w / 25.4) * dpi);
}

/** `null` = không đọc được kích thước thật (ảnh lỗi/mất mạng khi đo) — coi như AN TOÀN, bỏ qua
 * upscale ảnh đó thay vì đoán bừa. Không cần `crossOrigin` — chỉ đọc `naturalWidth`, KHÔNG đọc
 * pixel (canvas) nên CORS không chặn. */
function loadNaturalWidth(src: string): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth || null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 0 = đã đủ · 1 = ×4 là đủ · 2 = ×4 rồi ×2 phần thiếu (Hoà chốt 02/08). Nguồn cực nhỏ có thể
 * vẫn thiếu sau ×8 — chấp nhận (2 mức scale duy nhất `ai.upscale` hỗ trợ, không loop thêm). */
function planSteps(havePx: number, targetPx: number): 0 | 1 | 2 {
  if (havePx >= targetPx) return 0;
  if (havePx * 4 >= targetPx) return 1;
  return 2;
}

async function providerReadyFor(tier: AiTier): Promise<boolean> {
  const provider = providerForTier(tier);
  if (!provider) return false;
  const status = await checkProviders();
  if (provider === 'fal') return status.fal;
  if (provider === 'comfyui') return status.comfyui;
  return status.sd;
}

async function spendCredit(amount: number, reason: string, jobRef: string): Promise<boolean> {
  const store = useFlowStore.getState();
  if (store.user) {
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'spend', amount, reason, jobRef }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return false;
      store.setCredits(body.credits);
      return true;
    } catch {
      return false;
    }
  }
  if (store.credits < amount) return false;
  store.spendCredits(amount);
  return true;
}

function refundCredit(amount: number, reason: string, jobRef: string) {
  const store = useFlowStore.getState();
  if (store.user) {
    fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund', amount, reason, jobRef }),
    })
      .then((r) => r.json())
      .then((b) => typeof b.credits === 'number' && store.setCredits(b.credits))
      .catch(() => {});
  } else {
    useFlowStore.setState((s) => ({ credits: s.credits + amount }));
  }
}

/** Gom mọi ảnh (element `kind:'image'` + `backgroundImage`) toàn deck → `targetPx` LỚN NHẤT
 * cần cho từng `src` duy nhất (cùng ảnh dùng ở nhiều nơi, có nơi to nơi nhỏ → nâng theo nhu cầu
 * cao nhất, đủ dùng cho mọi chỗ). */
function collectImageUsage(deck: EditorDeck, stagePreset: StagePresetId, dpi: number): Map<string, number> {
  const usage = new Map<string, number>();
  const bump = (src: string, px: number) => usage.set(src, Math.max(usage.get(src) ?? 0, px));
  for (const slide of deck.slides) {
    if (slide.backgroundImage) bump(slide.backgroundImage, targetPxForFrameWidth(100, stagePreset, dpi));
    for (const el of slide.elements) {
      if (el.kind === 'image') bump(el.src, targetPxForFrameWidth(el.frame.w, stagePreset, dpi));
    }
  }
  return usage;
}

export interface UpscaleEstimateItem {
  src: string;
  havePx: number | null;
  targetPx: number;
  steps: 0 | 1 | 2;
}

export interface PrintUpscaleEstimate {
  items: UpscaleEstimateItem[];
  needCount: number;
  totalSteps: number;
  totalCredits: number;
  estMs: number;
  /** mức AI hiện tại (header) là "Không AI" — không upscale được, PDF vẫn xuất nhưng ảnh giữ
   * nguyên nguồn. UI hiện thông báo khác (không phải giá tiền) cho ca này. */
  aiUnavailable: boolean;
}

/**
 * Ước tính TRƯỚC KHI CHẠY (Hoà 02/08: "hiện giá + thời gian ước trước khi bấm") — KHÔNG gọi AI,
 * chỉ tải header ảnh (`Image().naturalWidth`) để biết kích thước thật đang có. An toàn gọi nhiều
 * lần (vd mở lại dialog xác nhận).
 */
export async function estimatePrintUpscale(deck: EditorDeck, dpi: number, tier: AiTier): Promise<PrintUpscaleEstimate> {
  const stagePreset = (deck.stagePreset ?? DEFAULT_STAGE_PRESET) as StagePresetId;
  const empty: PrintUpscaleEstimate = { items: [], needCount: 0, totalSteps: 0, totalCredits: 0, estMs: 0, aiUnavailable: tier === 1 };
  if (!PAPER_SIZE_MM[stagePreset] || tier === 1) return empty;

  const usage = collectImageUsage(deck, stagePreset, dpi);
  const items: UpscaleEstimateItem[] = [];
  for (const [src, targetPx] of usage) {
    const havePx = await loadNaturalWidth(src);
    items.push({ src, havePx, targetPx, steps: havePx === null ? 0 : planSteps(havePx, targetPx) });
  }
  const totalSteps = items.reduce((n, it) => n + it.steps, 0);
  return {
    items,
    needCount: items.filter((it) => it.steps > 0).length,
    totalSteps,
    totalCredits: totalSteps * CREDIT_PER_STEP,
    estMs: totalSteps * UPSCALE_CALL_MS,
    aiUnavailable: false,
  };
}

async function resolveUpscaledSrc(
  src: string,
  targetPx: number,
  havePx: number,
  tier: AiTier,
): Promise<{ resultSrc: string; steps: 0 | 1 | 2 }> {
  const steps = planSteps(havePx, targetPx);
  if (steps === 0) return { resultSrc: src, steps: 0 };

  const key = await hashSrc(src);
  const cached = await getCachedUpscale(key);
  if (cached && cached.width >= targetPx) return { resultSrc: cached.resultSrc, steps: 0 }; // đã đủ — khỏi trả tiền lại

  const jobRef = `print300-${key.slice(0, 16)}`;
  const spent = await spendCredit(steps * CREDIT_PER_STEP, 'In 300dpi — nâng độ phân giải ảnh', jobRef);
  if (!spent) throw new UpscaleCreditError(src);

  try {
    let cur = src;
    for (let i = 0; i < steps; i++) {
      const scale = i === 0 ? 4 : 2;
      const urls = await runImageJob('upscale', { image_url: cur, scale }, () => {}, tier);
      cur = urls[0];
    }
    const width = (await loadNaturalWidth(cur)) ?? targetPx;
    await putCachedUpscale(key, { resultSrc: cur, width, steps, cachedAt: Date.now() });
    return { resultSrc: cur, steps };
  } catch (err) {
    refundCredit(steps * CREDIT_PER_STEP, 'Hoàn: In 300dpi upscale lỗi', jobRef);
    throw err;
  }
}

export interface ApplyUpscaleResult {
  deck: EditorDeck;
  upscaledCount: number;
  failedCount: number;
}

function replaceSlideImages(slide: EditorSlide, replacements: Map<string, string>): EditorSlide {
  const bg = slide.backgroundImage && replacements.has(slide.backgroundImage) ? replacements.get(slide.backgroundImage)! : slide.backgroundImage;
  const elements = slide.elements.map((el) => {
    if (el.kind !== 'image') return el;
    const next = replacements.get(el.src);
    return next ? ({ ...el, src: next } as ImageElement) : el;
  });
  return { ...slide, backgroundImage: bg, elements };
}

/**
 * Chạy THẬT — trừ credit + gọi ESRGAN + cache. Không phải khổ giấy / mức "Không AI" / provider
 * chưa cấu hình → trả nguyên `deck` KHÔNG đổi (Tầng lõi tất định luôn ra kết quả, không chặn
 * export chỉ vì thiếu AI — đúng luật app 2 tầng).
 */
export async function applyPrintUpscale(
  deck: EditorDeck,
  dpi: number,
  tier: AiTier,
  onProgress?: (done: number, total: number) => void,
): Promise<ApplyUpscaleResult> {
  const noop: ApplyUpscaleResult = { deck, upscaledCount: 0, failedCount: 0 };
  const stagePreset = (deck.stagePreset ?? DEFAULT_STAGE_PRESET) as StagePresetId;
  if (!PAPER_SIZE_MM[stagePreset] || tier === 1) return noop;
  if (!(await providerReadyFor(tier))) return noop;

  const usage = collectImageUsage(deck, stagePreset, dpi);
  const uniqueSrcs = [...usage.keys()];
  const replacements = new Map<string, string>();
  let upscaledCount = 0;
  let failedCount = 0;

  for (let i = 0; i < uniqueSrcs.length; i++) {
    const src = uniqueSrcs[i];
    const targetPx = usage.get(src)!;
    const havePx = await loadNaturalWidth(src);
    if (havePx !== null) {
      try {
        const { resultSrc, steps } = await resolveUpscaledSrc(src, targetPx, havePx, tier);
        if (steps > 0) {
          replacements.set(src, resultSrc);
          upscaledCount++;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[print-upscale] lỗi nâng độ phân giải', src.slice(0, 60), err instanceof Error ? err.message : err);
        failedCount++;
      }
    }
    onProgress?.(i + 1, uniqueSrcs.length);
  }

  if (replacements.size === 0) return { deck, upscaledCount, failedCount };
  return {
    deck: { ...deck, slides: deck.slides.map((s) => replaceSlideImages(s, replacements)) },
    upscaledCount,
    failedCount,
  };
}
