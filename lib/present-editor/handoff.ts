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
 *
 * PS-3 (id ổn định — nợ kỹ thuật đã ghi ở STATUS.md): mỗi ảnh rút ra giờ có kèm 1 `id` ổn định
 * dựa trên `node.id` (React Flow node id — ổn định suốt vòng đời flow, KHÔNG đổi giữa các lần
 * Run). Format: `render:<nodeId>` (node xuất đúng 1 ảnh, vd slide.composer) hoặc
 * `render:<nodeId>:<index>` (1 node xuất nhiều ảnh, vd slide.deck nhiều slide). Present dùng id
 * này làm `assetId` (lib/present-editor/linked-assets.ts) — chèn CÙNG ảnh (cùng node nguồn) vào
 * nhiều slide ⇒ cùng assetId ⇒ sửa 1 nơi (round-trip /photo-editor hoặc panel tài sản liên kết)
 * cập nhật MỌI nơi. `deckImagesFromNodes` (string[], không id) GIỮ NGUYÊN cho tương thích ngược
 * — chỗ nào chưa cần link cứ dùng như cũ; `deckImagesWithIdsFromNodes` là bản mới kèm id.
 */

const KEY = 'interiorflow.presentHandoff';

/** Trần số ảnh chuyển 1 lần — deck 6 slide + dư; tránh nhét cả thư viện vào storage. */
const MAX_IMAGES = 8;

/** Node "giống FlowNode" tối thiểu — structural type để hàm thuần không dính reactflow.
 *  `id` bắt buộc: mọi FlowNode thật (React Flow) luôn có id ổn định do store quản lý. */
export interface HandoffNodeLike {
  id: string;
  position?: { x: number; y: number };
  data?: {
    defType?: string;
    params?: Record<string, unknown>;
    run?: { outputs?: Record<string, { value?: unknown } | undefined> } | null;
  };
}

/** 1 ảnh rút từ flow kèm id ổn định (xem PS-3 ở đầu file). */
export interface DeckImageItem {
  src: string;
  id: string;
}

/**
 * id ổn định cho 1 ảnh xuất từ node `nodeId` — `total` = tổng số ảnh node đó xuất ra trong lần
 * rút này. Node xuất đúng 1 ảnh → dùng thẳng id node (dễ đọc, ổn định tuyệt đối); node xuất
 * nhiều ảnh (slide.deck nhiều slide) → thêm chỉ số để mỗi ảnh có 1 id riêng.
 */
export function renderImageId(nodeId: string, index: number, total: number): string {
  return total > 1 ? `render:${nodeId}:${index}` : `render:${nodeId}`;
}

/**
 * THUẦN: rút mảng {src,id} từ flow hiện tại (ưu tiên như PresentOverlay):
 *  1) node `slide.deck` đã Run — outputs._slides = JSON mảng dataURL (nhiều ảnh, 1 node);
 *  2) các `slide.composer` đã render — sắp theo pageNo rồi vị trí trái→phải, trên→dưới (1 node/ảnh).
 * Không có gì → []. Tất định.
 */
function extractDeckImages(nodes: HandoffNodeLike[]): DeckImageItem[] {
  const decks = nodes.filter(
    (n) => n.data?.defType === 'slide.deck' && n.data.run?.outputs?._slides?.value,
  );
  const lastDeck = decks.at(-1);
  if (lastDeck) {
    try {
      const slides = JSON.parse(String(lastDeck.data!.run!.outputs!._slides!.value)) as unknown;
      if (Array.isArray(slides) && slides.length > 0) {
        const capped = slides.map(String).slice(0, MAX_IMAGES);
        return capped.map((src, i) => ({ src, id: renderImageId(lastDeck.id, i, capped.length) }));
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
      nodeId: n.id,
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
  return composed
    .slice(0, MAX_IMAGES)
    .map((c) => ({ src: c.url, id: renderImageId(c.nodeId, 0, 1) }));
}

/** Bản CŨ — string[] không id, giữ nguyên chữ ký cho nơi gọi chưa cần link (tương thích ngược). */
export function deckImagesFromNodes(nodes: HandoffNodeLike[]): string[] {
  return extractDeckImages(nodes).map((i) => i.src);
}

/** Bản MỚI (PS-3) — kèm id ổn định để Present gán `assetId` (linked-assets.ts). */
export function deckImagesWithIdsFromNodes(nodes: HandoffNodeLike[]): DeckImageItem[] {
  return extractDeckImages(nodes);
}

/** Item lưu trong handoff — `id` optional: nguồn cũ (stashPresentHandoff, string[]) không có id. */
interface StashedItem {
  src: string;
  id?: string;
}

/** Fallback bộ nhớ khi sessionStorage hỏng/đầy (pattern B1 của lib/cad/handoff.ts). */
let memHandoff: StashedItem[] | null = null;

function stashItems(items: StashedItem[]): boolean {
  const trimmed = items.filter((it) => it.src).slice(0, MAX_IMAGES);
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

function consumeItems(): StashedItem[] {
  let items: StashedItem[] = [];
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      sessionStorage.removeItem(KEY);
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed
          .map((p): StashedItem | null => {
            if (p && typeof p === 'object' && typeof (p as StashedItem).src === 'string') {
              return p as StashedItem;
            }
            if (typeof p === 'string') return { src: p };
            return null;
          })
          .filter((it): it is StashedItem => !!it && !!it.src);
      }
    }
  } catch {
    /* storage hỏng lúc đọc / JSON hỏng — thử fallback bộ nhớ bên dưới */
  }
  if (!items.length && memHandoff) items = memHandoff;
  memHandoff = null; // dọn ngay — tránh double-consume
  return items;
}

/** Stash ảnh chuyển sang Present (bản CŨ, không id). Trả true nếu vào được sessionStorage. */
export function stashPresentHandoff(images: string[]): boolean {
  return stashItems(images.map((src) => ({ src })));
}

/** Stash ảnh kèm id ổn định (PS-3) — dùng khi nguồn có id (deckImagesWithIdsFromNodes). */
export function stashPresentHandoffWithIds(items: DeckImageItem[]): boolean {
  return stashItems(items);
}

/** Consume-ONCE: trả ảnh đã stash rồi dọn cả 2 nguồn (bản CŨ, chỉ src). Không có gì → []. */
export function consumePresentHandoff(): string[] {
  return consumeItems().map((i) => i.src);
}

/** Consume-ONCE kèm id (nếu nguồn có) — PS-3. `id` vắng mặt = ảnh không có nguồn Render ổn định. */
export function consumePresentHandoffWithIds(): StashedItem[] {
  return consumeItems();
}
