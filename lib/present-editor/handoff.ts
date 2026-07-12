'use client';

/**
 * lib/present-editor/handoff.ts — Handoff RENDER → PRESENT (A-4, "universal bridge").
 *
 * CÙNG PATTERN với lib/cad/handoff.ts (chiều CAD→Render, đã có fix B1):
 *   - Chặng Render (app '/') và chặng Present ('/present-editor') là 2 ROUTE khác nhau;
 *     flow store zustand KHÔNG hydrate ở /present-editor nên slide/ảnh đã render không tự theo.
 *   - Stash vào sessionStorage; sessionStorage hỏng (quota — dataURL slide rất to — hoặc bị chặn)
 *     → FALLBACK biến module-level (singleton sống qua điều hướng SPA client-side, đủ cho
 *     router.push '/'→'/present-editor').
 *   - CONSUME-ONCE: đọc xong dọn cả 2 nguồn ngay → không double-import khi editor remount.
 *   - Không phá luồng cũ: không có handoff ⇒ consume trả [] ⇒ /present-editor y hệt trước.
 *
 * Phần RÚT ẢNH từ flow (`deckImagesFromNodes`) tách THUẦN để test không cần DOM — cùng thứ tự
 * ưu tiên với PresentOverlay.useFlowDeck (slide.deck đã Run → slide.composer theo pageNo/vị trí).
 */

const KEY = 'interiorflow.presentHandoff';

/** Trần số ảnh chuyển 1 lần — deck 6 slide + dư; tránh nhét cả thư viện vào storage. */
const MAX_IMAGES = 8;

/** Node "giống FlowNode" tối thiểu — structural type để hàm thuần không dính reactflow. */
export interface HandoffNodeLike {
  position?: { x: number; y: number };
  data?: {
    defType?: string;
    params?: Record<string, unknown>;
    run?: { outputs?: Record<string, { value?: unknown } | undefined> } | null;
  };
}

/**
 * THUẦN: rút mảng ảnh slide từ flow hiện tại (ưu tiên như PresentOverlay):
 *  1) node `slide.deck` đã Run — outputs._slides = JSON mảng dataURL;
 *  2) các `slide.composer` đã render — sắp theo pageNo rồi vị trí trái→phải, trên→dưới.
 * Không có gì → []. Tất định.
 */
export function deckImagesFromNodes(nodes: HandoffNodeLike[]): string[] {
  const decks = nodes.filter(
    (n) => n.data?.defType === 'slide.deck' && n.data.run?.outputs?._slides?.value,
  );
  const lastDeck = decks.at(-1);
  if (lastDeck) {
    try {
      const slides = JSON.parse(String(lastDeck.data!.run!.outputs!._slides!.value)) as unknown;
      if (Array.isArray(slides) && slides.length > 0) {
        return slides.map(String).slice(0, MAX_IMAGES);
      }
    } catch {
      /* JSON hỏng — rơi xuống composer */
    }
  }

  const composed = nodes
    .filter(
      (n) =>
        n.data?.defType === 'slide.composer' &&
        typeof n.data.run?.outputs?.image?.value === 'string',
    )
    .map((n) => ({
      url: String(n.data!.run!.outputs!.image!.value),
      page: parseInt(String(n.data!.params?.pageNo ?? ''), 10),
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    }))
    .sort((a, b) => {
      const pa = Number.isFinite(a.page) ? a.page : Infinity;
      const pb = Number.isFinite(b.page) ? b.page : Infinity;
      if (pa !== pb) return pa - pb;
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
  return composed.map((c) => c.url).slice(0, MAX_IMAGES);
}

/** Fallback bộ nhớ khi sessionStorage hỏng/đầy (pattern B1 của lib/cad/handoff.ts). */
let memHandoff: string[] | null = null;

/** Stash ảnh chuyển sang Present. Trả true nếu vào được sessionStorage (false = dùng mem). */
export function stashPresentHandoff(images: string[]): boolean {
  const trimmed = images.filter(Boolean).slice(0, MAX_IMAGES);
  if (!trimmed.length) return false;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(trimmed));
    memHandoff = null; // ưu tiên sessionStorage; dọn fallback cũ nếu có
    return true;
  } catch {
    memHandoff = trimmed; // quota/chặn — giữ bộ nhớ, consume vẫn nhận được sau điều hướng SPA
    return false;
  }
}

/** Consume-ONCE: trả ảnh đã stash rồi dọn cả 2 nguồn. Không có gì → []. */
export function consumePresentHandoff(): string[] {
  let images: string[] = [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      sessionStorage.removeItem(KEY);
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) images = parsed.map(String).filter(Boolean);
    }
  } catch {
    /* storage hỏng lúc đọc / JSON hỏng — thử fallback bộ nhớ bên dưới */
  }
  if (!images.length && memHandoff) images = memHandoff;
  memHandoff = null; // dọn ngay — tránh double-consume
  return images;
}
