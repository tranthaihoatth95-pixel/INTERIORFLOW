/**
 * lib/nodes/edge-validity.ts — ĐẾM dây nối SAI KIỂU đang có trên bảng nút (③ phiếu
 * `docs/mocks/Bảng nút.dc.html`: thanh trạng thái ghi "N nút · M nối sai").
 *
 * Vì sao vẫn có dây sai dù `isValidConnection` (`components/FlowCanvas.tsx`) đã CHẶN lúc nối:
 * cửa chặn chỉ gác THAO TÁC NỐI TAY. Dây sai vẫn vào bảng qua 3 đường khác —
 *   ① flow cũ lưu từ trước khi có cửa chặn (localStorage `interiorflow.flow.v1`, file `.json`);
 *   ② định nghĩa node đổi kiểu cổng sau này (vd cổng `text` nâng thành `table`) → dây cũ hoá sai;
 *   ③ demo/mẫu dựng bằng `addEdge` thẳng trong store, không đi qua `isValidConnection`.
 * Đếm ở đây là ĐỌC hiện trạng, KHÔNG tự xoá dây — người dùng phải thấy rồi tự quyết (mock hiện
 * số đỏ + nhãn cạnh dây, không âm thầm dọn).
 *
 * Hàm THUẦN + nhận `lookupDef` từ ngoài (khuôn `DefLookup` của `lib/nodes/macro.ts`) nên test
 * chạy được mà không kéo cả `registry.ts` (registry kéo theo AI client/WebGPU). Import TƯƠNG ĐỐI
 * theo đúng quy ước file có `.test.ts` — alias `@/…` không chạy dưới `sucrase-node`
 * (bài học `boq-group.ts`, STATUS.md 04/08).
 */

import type { DataType, NodeDefinition } from '../types';

export type DefLookup = (type: string) => NodeDefinition;

/** Hình dạng TỐI THIỂU cần đọc — khai cấu trúc thay vì import `FlowNode`/`Edge` (store + React
 *  Flow), để module này thuần và test không phải dựng cả store. */
export interface EdgeValidityNode {
  id: string;
  type?: string;
  /** React Flow ẩn node (`hidden: true`) khi nút tổng THU GỌN — `lib/store.ts` đặt cờ này cho mọi
   *  node con. Đọc ở đây để `countBoardNodes` đếm đúng thứ NHÌN THẤY, xem hàm đó. */
  hidden?: boolean;
  data: { defType: string };
}
/** Hình dạng tối thiểu của một CỤM (`NodeGroup` trong store) mà phép đếm cần biết. */
export interface EdgeValidityGroup {
  isMacro?: boolean;
  collapsed?: boolean;
}
export interface EdgeValidityEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface MistypedEdge {
  edgeId: string;
  sourceType: DataType;
  targetType: DataType;
}

/**
 * Dây có 2 đầu KHÁC KIỂU dữ liệu. Cùng luật với `isValidConnection`: chỉ so `dataType` của cổng
 * ra (outputs) với cổng vào (inputs).
 *
 * KHÔNG tính là "sai kiểu" (cố ý — đây là hỏng dữ liệu, không phải nối nhầm loại; gộp vào một con
 * số sẽ nói dối người dùng): node không tồn tại · node ghi chú (`type === 'note'`, không có cổng)
 * · `defType` tra không ra · thiếu `sourceHandle`/`targetHandle` · handle trỏ vào cổng không còn.
 */
export function findMistypedEdges(
  nodes: EdgeValidityNode[],
  edges: EdgeValidityEdge[],
  lookupDef: DefLookup,
): MistypedEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: MistypedEdge[] = [];

  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    if (source.type === 'note' || target.type === 'note') continue;
    if (!edge.sourceHandle || !edge.targetHandle) continue;

    let sourceDef: NodeDefinition;
    let targetDef: NodeDefinition;
    try {
      sourceDef = lookupDef(source.data.defType);
      targetDef = lookupDef(target.data.defType);
    } catch {
      continue; // defType lạ (flow của bản cũ hơn) — không phán xét được, bỏ qua
    }

    const outPort = sourceDef.outputs.find((p) => p.id === edge.sourceHandle);
    const inPort = targetDef.inputs.find((p) => p.id === edge.targetHandle);
    if (!outPort || !inPort) continue;

    if (outPort.dataType !== inPort.dataType) {
      out.push({ edgeId: edge.id, sourceType: outPort.dataType, targetType: inPort.dataType });
    }
  }
  return out;
}

/** Số dây sai kiểu — con số hiện trên thanh trạng thái ("… · M nối sai"). */
export function countMistypedEdges(
  nodes: EdgeValidityNode[],
  edges: EdgeValidityEdge[],
  lookupDef: DefLookup,
): number {
  return findMistypedEdges(nodes, edges, lookupDef).length;
}

/** Số KHỐI trên bảng — ghi chú dán (`type === 'note'`) KHÔNG phải nút, không đếm (mock đếm 7 thẻ
 *  nút, không kể giấy nhớ).
 *
 *  06/08 — đếm thứ NHÌN THẤY, hai chiều:
 *  · TRỪ node đang ẩn (`hidden`) — thu gọn nút tổng thì `lib/store.ts` đặt cờ này cho mọi node con.
 *    Còn 1 mặt nút trên bảng mà ghi "5 nút" là nói dối đúng lúc người dùng vừa gom xong.
 *  · CỘNG mỗi nút tổng ĐANG THU GỌN 1 đơn vị — mặt nút tổng vẽ từ `groups[]` (`GroupOverlay`),
 *    KHÔNG có node tương ứng trong `nodes[]`; thiếu vế này thì gom hết bảng lại ra "0 nút".
 *  Node con vẫn sống nguyên trong `nodes[]` (thu gọn ≠ xoá) — lọc ở tầng ĐẾM, không đụng store. */
export function countBoardNodes(nodes: EdgeValidityNode[], groups: EdgeValidityGroup[] = []): number {
  const visible = nodes.filter((n) => n.type !== 'note' && n.hidden !== true).length;
  const collapsedMacros = groups.filter((g) => g.isMacro === true && g.collapsed === true).length;
  return visible + collapsedMacros;
}
