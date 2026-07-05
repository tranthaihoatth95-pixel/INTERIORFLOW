/**
 * Barrel gom các node "mở rộng" — mỗi MẢNG việc = 1 file riêng trong thư mục này.
 *
 * CƠ CHẾ CHỐNG-ĐÈ (nhiều Claude Code / worktree chạy song song):
 *  - Mỗi worker CHỈ tạo/ sửa MỘT file `defs/<area>.ts` của mình, export 1 mảng
 *    `NodeDefinition[]`. TUYỆT ĐỐI không đụng `registry.ts`, `types.ts`, `phases.ts`.
 *  - INTEGRATOR (phiên chính) sở hữu riêng file này: chỉ thêm 1 dòng import + 1 phần
 *    tử spread cho mỗi area → merge cực nhẹ, không xung đột nội dung node.
 *  - Node cần category/phase/AI-task MỚI thì ghi vào manifest bàn giao, integrator
 *    wiring các file shared (types/phases/models) trong 1 lượt.
 *
 * Downstream (NODE_REGISTRY, getDefinition, NodeLibraryPanel) tự nhận qua
 * NODE_DEFINITIONS = [...CORE, ...EXTRA_NODES]. Không cần sửa gì thêm.
 */
import type { NodeDefinition } from '@/lib/types';
import { watermarkNodes } from './watermark';
import { compareNodes } from './compare-models';

export const EXTRA_NODES: NodeDefinition[] = [
  ...watermarkNodes,
  ...compareNodes,
];
