/**
 * lib/nodes/macro.ts — NÚT TỔNG (macro/group node dùng lại được): phép tính THUẦN, không đụng
 * store/React. Node con vẫn là node THẬT sống trong `nodes[]`/`edges[]` phẳng của flow (không di
 * chuyển ra ngoài) — "gom" chỉ là: (a) đánh dấu 1 `NodeGroup` (lib/store.ts) có cờ `isMacro`,
 * (b) khi collapsed thì ẩn node con (`hidden:true`, CÙNG cơ chế `toggleGroupCollapse` đã có sẵn
 * cho group thường — không viết engine ẩn/hiện mới), (c) mặt nút tổng đọc/ghi THẲNG vào
 * `data.params` của node con qua `updateParam()` đã có sẵn (một nguồn, không giữ bản sao tham số).
 *
 * Vì vậy: mở ra/thu vào KHÔNG BAO GIỜ mất dữ liệu — node/edge/param không hề đổi chỗ hay bị xoá,
 * chỉ đổi `hidden`. Chạy nút tổng = gọi `runNode()` (lib/execution.ts) cho các node "cuối nhánh"
 * trong nhóm — hàm đó đã tự chạy toàn bộ dây upstream (kể cả node ngoài nhóm nếu có), không cần
 * viết engine thực thi mới.
 */
import type { Edge } from '@xyflow/react';
import type { FlowNode } from '../store';
import { DATA_TYPE_COLORS, type DataType, type NodeDefinition, type ParamDef } from '../types';

/**
 * Tra `NodeDefinition` theo `defType` — nơi gọi thật (component/store) truyền `getDefinition`
 * (`lib/nodes/registry.ts`) vào. KHÔNG import thẳng registry.ts ở đây: file đó (và cả chuỗi
 * `lib/ai/*`/`lib/imaging`/`lib/slides` nó kéo theo) dùng import `@/...` — alias mà bộ chạy test
 * độc lập của repo (`sucrase-node`, xem `package.json` script "test") KHÔNG resolve được (chỉ
 * transform cú pháp, không đụng module resolution). Tiêm phụ thuộc qua tham số giữ file này
 * test được bằng node thật, không cần mock registry 44KB. */
export type DefLookup = (defType: string) => NodeDefinition;

export interface ExposableParamRow {
  nodeId: string;
  nodeTitle: string;
  /** màu chấm nhận diện node con (theo dataType đầu ra chính — cùng bảng màu port toàn app). */
  dotColor: string;
  param: ParamDef;
}

export interface MacroExposedParam {
  nodeId: string;
  paramId: string;
  /** tên hiển thị ra ngoài — mặc định = `param.label` gốc, người dùng đổi được lúc tạo. */
  label: string;
}

export interface MacroBoundaryPort {
  /** id ổn định cho chấm cổng trên mặt nút tổng — đặt 1 lần lúc tạo, không đổi về sau. */
  portId: string;
  childNodeId: string;
  childHandleId: string;
  dataType: DataType;
}

/** Node thật (bỏ sticky note — note không có `defType`/params) trong tập id đã chọn. */
function realMembers(nodes: FlowNode[], nodeIds: string[]): FlowNode[] {
  const set = new Set(nodeIds);
  return nodes.filter((n) => set.has(n.id) && n.type !== 'note');
}

/** Mọi tham số của mọi node con — nguồn cho bảng "Tham số đưa ra ngoài" (state ② mock). Node nào
 * không tra được `defType` (dữ liệu hỏng) thì bỏ qua, không làm sập bảng. */
export function collectExposableParams(nodes: FlowNode[], nodeIds: string[], lookupDef: DefLookup): ExposableParamRow[] {
  const rows: ExposableParamRow[] = [];
  for (const node of realMembers(nodes, nodeIds)) {
    const defType = (node.data as { defType: string }).defType;
    let def;
    try {
      def = lookupDef(defType);
    } catch {
      continue;
    }
    const dotColor = DATA_TYPE_COLORS[def.outputs[0]?.dataType ?? 'image'];
    for (const param of def.params) {
      rows.push({ nodeId: node.id, nodeTitle: def.title, dotColor, param });
    }
  }
  return rows;
}

/** Cạnh nối XUYÊN BIÊN nhóm (1 đầu trong, 1 đầu ngoài) → mỗi cạnh thành 1 chấm cổng trên mặt nút
 * tổng (informational — kéo dây MỚI vào cổng này khi đang thu gọn CHƯA làm, phải mở ra mới nối
 * lại được; xem báo cáo phiên). Cạnh nội bộ (cả 2 đầu trong nhóm) không sinh cổng gì — nó vẫn
 * sống nguyên trong `edges[]`, chỉ ẩn theo node khi thu gọn. */
export function computeBoundaryPorts(
  nodes: FlowNode[],
  nodeIds: string[],
  edges: Edge[],
  lookupDef: DefLookup,
): { inputs: MacroBoundaryPort[]; outputs: MacroBoundaryPort[] } {
  const set = new Set(nodeIds);
  const defTypeOf = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? (n.data as { defType: string }).defType : undefined;
  };
  const inputs: MacroBoundaryPort[] = [];
  const outputs: MacroBoundaryPort[] = [];
  let i = 0;
  for (const e of edges) {
    const sIn = set.has(e.source);
    const tIn = set.has(e.target);
    if (sIn && !tIn) {
      const defType = defTypeOf(e.source);
      let dataType: DataType = 'image';
      try {
        if (defType) dataType = lookupDef(defType).outputs.find((o) => o.id === e.sourceHandle)?.dataType ?? 'image';
      } catch {
        /* def lạ — giữ mặc định 'image', chỉ ảnh hưởng MÀU chấm trang trí */
      }
      outputs.push({ portId: `mport_out_${i++}`, childNodeId: e.source, childHandleId: e.sourceHandle ?? '', dataType });
    } else if (!sIn && tIn) {
      const defType = defTypeOf(e.target);
      let dataType: DataType = 'image';
      try {
        if (defType) dataType = lookupDef(defType).inputs.find((p) => p.id === e.targetHandle)?.dataType ?? 'image';
      } catch {
        /* như trên */
      }
      inputs.push({ portId: `mport_in_${i++}`, childNodeId: e.target, childHandleId: e.targetHandle ?? '', dataType });
    }
  }
  return { inputs, outputs };
}

/** Node "cuối nhánh" TRONG nhóm — không có cạnh nội bộ nào đi tiếp tới 1 node khác cũng trong
 * nhóm. Chạy `runNode()` (đã tự kéo cả dây upstream, kể cả ngoài nhóm nếu cần) cho từng node này
 * = chạy đúng NGUYÊN chuỗi bên trong, không cần engine thực thi mới. */
export function terminalNodeIds(nodeIds: string[], edges: Edge[]): string[] {
  const set = new Set(nodeIds);
  const hasInternalDownstream = new Set<string>();
  for (const e of edges) {
    if (set.has(e.source) && set.has(e.target)) hasInternalDownstream.add(e.source);
  }
  return nodeIds.filter((id) => !hasInternalDownstream.has(id));
}

/** Tổng credit của mọi node con — hiện trên mặt nút tổng ("N nút bên trong · M credit"). */
export function totalCreditCost(nodes: FlowNode[], nodeIds: string[], lookupDef: DefLookup): number {
  let sum = 0;
  for (const node of realMembers(nodes, nodeIds)) {
    try {
      sum += lookupDef((node.data as { defType: string }).defType).creditCost;
    } catch {
      /* def lạ — không cộng, không sập */
    }
  }
  return sum;
}

export const MACRO_ICONS = ['box', 'sun', 'layers', 'sparkle', 'grid'] as const;
export type MacroIcon = (typeof MACRO_ICONS)[number];
