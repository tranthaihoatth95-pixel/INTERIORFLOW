'use client';

/**
 * lib/nodes/magic-perspective.ts — bước ② của vòng "Chỉnh phối cảnh" (phiếu
 * `docs/phieu-giao/demo-d2-vong-chinh.md`, marker `magic-phoi-canh`): GIEO node
 * `ai.regionrender` (kèm node ảnh nguồn `input.image`) vào flow chặng 2, mang metadata
 * {assetId, deckId} để chiều về ghi đúng chỗ.
 *
 * [T2] Tái dùng node `ai.regionrender` sẵn có (lib/nodes/defs/grounded-render.ts) — KHÔNG
 * engine mới. [T1] Ảnh nguồn lấy đúng src hiện tại của asset — sửa xong ghi VỀ asset, không
 * copy rời. [T5] Gieo qua snapshot() → undo được ở chặng 2; node gieo xong ĐỨNG YÊN chờ
 * người nối mask + duyệt phiếu + bấm chạy (luồng Grounded v0, máy không tự chạy gì).
 *
 * Chỉ GỌI hàm/exports sẵn có của flow store (addNode-style qua setState như loadDemoFlow) —
 * không sửa lib/store.ts.
 */

import { useFlowStore, nextId, edgeStyleFor, type FlowNode } from '@/lib/store';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import {
  MAGIC_PERSPECTIVE_KEY,
  magicMetaOf,
  findMagicNodes,
  type MagicPerspectiveMeta,
} from './magic-perspective-core';

export interface SeedPerspectiveInput {
  assetId: string;
  deckId: string;
  /** src hiện tại của asset — thành ảnh nguồn (input.image) cho node render bám ý. */
  src: string;
}

/**
 * Gieo (hoặc TÁI DÙNG) cặp node cho 1 asset: `input.image` (ảnh nguồn) → `ai.regionrender`
 * (metadata magic). Bấm lại lần 2 cùng asset KHÔNG đẻ node trùng — chọn lại node cũ và làm
 * tươi ảnh nguồn theo src mới nhất. Trả nodeId của node regionrender (node được select sẵn
 * để sang chặng 2 nhìn thấy ngay — canvas fitView lúc mount, node chọn có viền nổi bật).
 */
export function seedPerspectiveEdit(input: SeedPerspectiveInput): string {
  const st = useFlowStore.getState();
  const { nodes, edges } = st;

  const existing = findMagicNodes(nodes, input.assetId, input.deckId)[0];
  st.snapshot();

  if (existing) {
    // Làm tươi ảnh nguồn của node input.image đang nối vào cổng 'image' (asset có thể đã đổi
    // src từ lần gieo trước) + select node magic, bỏ chọn node khác.
    const edge = edges.find((e) => e.target === existing.id && e.targetHandle === 'image');
    const srcNodeId = edge?.source ?? null;
    useFlowStore.setState({
      nodes: nodes.map((n) => {
        if (srcNodeId && n.id === srcNodeId && n.data.defType === 'input.image') {
          return {
            ...n,
            selected: false,
            data: { ...n.data, params: { ...n.data.params, file: input.src } },
          };
        }
        return n.selected !== (n.id === existing.id) ? { ...n, selected: n.id === existing.id } : n;
      }),
    });
    st.setNotice('Đã mở lại node "Render bám ý (mảng)" của ảnh này ở chặng Thiết kế 3D.');
    return existing.id;
  }

  // Vị trí: bên phải mép graph hiện có — không đè node cũ.
  const baseX = nodes.length ? Math.max(...nodes.map((n) => n.position.x)) + 200 : 80;
  const baseY = 120;
  const mk = (defType: string, x: number, y: number): FlowNode => {
    const def = getDefinition(defType);
    return {
      id: nextId('node'),
      type: 'interior',
      position: { x, y },
      data: { defType, params: defaultParams(def), run: { status: 'idle', progress: 0 } },
    };
  };

  const srcNode = mk('input.image', baseX, baseY);
  srcNode.data.params.file = input.src;
  const region = mk('ai.regionrender', baseX + 340, baseY);
  const meta: MagicPerspectiveMeta = { assetId: input.assetId, deckId: input.deckId, luc: Date.now() };
  region.data[MAGIC_PERSPECTIVE_KEY] = meta;
  region.selected = true;

  useFlowStore.setState({
    nodes: [...nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), srcNode, region],
    edges: [
      ...edges,
      {
        id: nextId('edge'),
        source: srcNode.id,
        sourceHandle: 'image',
        target: region.id,
        targetHandle: 'image',
        style: edgeStyleFor('image'),
      },
    ],
  });
  st.setNotice('Đã gieo node "Render bám ý (mảng)" — nối mask, duyệt phiếu rồi chạy. Xong quay lại Trình chiếu bấm "Nhận ảnh đã chỉnh".');
  return region.id;
}

/** Re-export cho nơi gọi phía deck (PresentEditor) khỏi import 2 file. */
export { magicMetaOf, MAGIC_PERSPECTIVE_KEY };
