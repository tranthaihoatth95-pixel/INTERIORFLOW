/**
 * lib/nodes/magic-perspective-core.ts — PHẦN THUẦN của vòng "Chỉnh phối cảnh" liên chặng
 * (phiếu `docs/phieu-giao/demo-d2-vong-chinh.md`, marker `magic-phoi-canh`).
 *
 * Vòng 5 bước: ảnh deck (ImageElement có assetId) → gieo node `ai.regionrender` ở chặng 2
 * mang metadata {assetId, deckId} → người chỉnh (mask + phiếu duyệt + inpaint, luồng
 * Grounded v0 sẵn có) → deck NHẬN ảnh kết quả về đúng asset (setLinkedAssetSrc — mọi
 * element giữ nguyên frame, chỉ đổi ruột ảnh) → asset ghi thêm bước provenance.
 *
 * File này KHÔNG import lib/store (test được bằng sucrase-node — xem
 * magic-perspective-core.test.ts). Phần gieo node thật (đụng flow store) ở
 * `lib/nodes/magic-perspective.ts`.
 */

/** Khoá metadata trên `node.data` (InteriorNodeData extends Record<string, unknown> — additive,
 *  node cũ không có field này hành vi không đổi; autosave JSON.stringify giữ nguyên field). */
export const MAGIC_PERSPECTIVE_KEY = 'magicPerspective';

/** Metadata gắn trên node `ai.regionrender` đã gieo từ chặng Trình chiếu. */
export interface MagicPerspectiveMeta {
  /** assetId trong `deck.linkedAssets` — đường về ghi đúng chỗ. */
  assetId: string;
  /** deck nguồn (EditorDeck.id) — dự án nhiều sheet không nhận nhầm kết quả của sheet khác. */
  deckId: string;
  /** mốc gieo (Date.now()) — nhiều lần gieo cùng asset thì lấy node mới nhất. */
  luc: number;
}

/**
 * Hình dạng TỐI THIỂU của 1 flow-node mà core cần đọc — cố ý KHÔNG import FlowNode từ
 * lib/store ('use client' + zustand, kéo cả xyflow vào test thuần không đáng). FlowNode
 * thật thoả structural typing này nên nơi gọi truyền thẳng `useFlowStore.getState().nodes`.
 */
export interface MagicNodeLike {
  id: string;
  data: {
    defType?: string;
    run?: {
      status?: string;
      outputs?: Record<string, { dataType: string; value: string | number } | undefined>;
    };
    [k: string]: unknown;
  };
}

/** Đọc metadata magic từ `node.data` — thiếu/sai hình dạng → null (node thường, bỏ qua). */
export function magicMetaOf(data: Record<string, unknown>): MagicPerspectiveMeta | null {
  const raw = data[MAGIC_PERSPECTIVE_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Partial<MagicPerspectiveMeta>;
  if (typeof m.assetId !== 'string' || !m.assetId) return null;
  if (typeof m.deckId !== 'string' || !m.deckId) return null;
  return { assetId: m.assetId, deckId: m.deckId, luc: typeof m.luc === 'number' ? m.luc : 0 };
}

/** Mọi node magic khớp asset+deck, MỚI NHẤT trước (theo `luc`). */
export function findMagicNodes(
  nodes: MagicNodeLike[],
  assetId: string,
  deckId: string,
): MagicNodeLike[] {
  return nodes
    .filter((n) => {
      const m = magicMetaOf(n.data);
      return !!m && m.assetId === assetId && m.deckId === deckId;
    })
    .sort((a, b) => (magicMetaOf(b.data)?.luc ?? 0) - (magicMetaOf(a.data)?.luc ?? 0));
}

/** Kết quả chờ nhận về deck: node magic ĐÃ CHẠY XONG + ảnh output KHÁC ảnh asset hiện tại. */
export interface MagicPerspectiveResult {
  nodeId: string;
  /** ảnh kết quả (URL/dataURL) từ `run.outputs.image`. */
  src: string;
}

/**
 * Bước ④ (chiều VỀ, bán tự động trung thực): tìm ảnh đã chỉnh đang chờ cho 1 asset.
 * `currentSrc` = src hiện tại của asset — kết quả TRÙNG src hiện tại nghĩa là đã nhận rồi
 * (hoặc không đổi gì) → null, nút "Nhận ảnh đã chỉnh" không hiện thừa.
 */
export function findPerspectiveResult(
  nodes: MagicNodeLike[],
  assetId: string,
  deckId: string,
  currentSrc: string,
): MagicPerspectiveResult | null {
  for (const n of findMagicNodes(nodes, assetId, deckId)) {
    const run = n.data.run;
    if (run?.status !== 'done') continue;
    const out = run.outputs?.image;
    if (!out || out.dataType !== 'image') continue;
    const src = String(out.value);
    if (!src || src === currentSrc) continue;
    return { nodeId: n.id, src };
  }
  return null;
}

/** Bước ⑤ — một bước gia phả trên asset sau khi nhận ảnh (khuôn của phiếu D2). */
export interface PerspectiveProvenanceStep {
  loai: 'grounded-render';
  nodeId: string;
  luc: number;
}

/**
 * Nối 1 bước provenance vào danh sách cũ (nếu có, validate từng phần tử — dữ liệu lạ bỏ qua,
 * không nổ). Trả MẢNG MỚI, không mutate đầu vào.
 *
 * ⚠️ KHAI THẬT phạm vi: `LinkedAsset` (lib/present-editor/model.ts — NGOÀI vùng phiếu D2)
 * chưa có field `provenance`; bước này được ghi thêm vào object asset lúc nhận ảnh (JSON
 * round-trip giữ nguyên field lạ — cloneDeck/persist đều JSON). Nhưng `setLinkedAssetSrc`
 * DỰNG LẠI asset (chỉ giữ id/name/src/recipe) ⇒ lần đổi src KẾ TIẾP qua đường khác
 * (vd round-trip /photo-editor) sẽ RƠI provenance. Sửa tận gốc = thêm field vào model +
 * giữ qua setLinkedAssetSrc (1 dòng, như recipe) — đề xuất lên T, ngoài vùng D2.
 */
export function appendPerspectiveProvenance(
  prev: unknown,
  nodeId: string,
  luc: number = Date.now(),
): PerspectiveProvenanceStep[] {
  const out: PerspectiveProvenanceStep[] = [];
  if (Array.isArray(prev)) {
    for (const p of prev) {
      if (
        p &&
        typeof p === 'object' &&
        (p as PerspectiveProvenanceStep).loai === 'grounded-render' &&
        typeof (p as PerspectiveProvenanceStep).nodeId === 'string' &&
        typeof (p as PerspectiveProvenanceStep).luc === 'number'
      ) {
        out.push(p as PerspectiveProvenanceStep);
      }
    }
  }
  out.push({ loai: 'grounded-render', nodeId, luc });
  return out;
}
