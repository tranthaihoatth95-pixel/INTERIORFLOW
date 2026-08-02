/**
 * lib/render-studio/sidebar-zones.ts — H2 (`docs/TICKET-UI-HATANG-2026-08-02.md`,
 * `docs/SPEC-MODE-PER-STAGE.md` §2): phân loại TOÀN BỘ node chặng Render vào 3 vùng sidebar.
 * "Rà kỹ từng node, không xếp bừa" (Hoà nhấn) — bảng dưới đây là kết quả rà, ĐỌC TRƯỚC khi đổi.
 *
 * Vùng suy ra TỰ ĐỘNG từ 2 nguồn đã có (không tự tạo danh sách rời rạc dễ lệch):
 *   - `master` = mọi `nodeType` xuất hiện trong `TASK_CARDS` (`task-cards.ts`) — tool window ĐÃ
 *     có nội dung thật (ToolModeForm), không phải placeholder.
 *   - `mood`   = tập cố định nhỏ (moodboard + reference/gu) đúng câu chốt §2 "ai.moodboard,
 *     reference, gu, note" — KHÔNG suy được từ dữ liệu khác nên khai trực tiếp.
 *   - `normal` = phần còn lại (mặc định).
 *
 * ── RÀ TỪNG NODE (24 catalog CATALOG-STAGE2-RENDERING.md + 4 node mới hơn catalog chưa cập
 *    nhật: ai.pattern/ai.smartselect/util.warp/vision.measureobject — tổng ~34) ──
 *
 * MASTER (12 — 7 gốc D3 + 5 mở rộng H2, cùng khuôn image[+mask]+prompt→image, ToolModeForm dùng
 * được thẳng không cần UI riêng):
 *   ai.sketch2render · ai.clay2render · ai.styletransfer · ai.relight · ai.materialswap ·
 *   ai.upscale · vision.measureobject (7 gốc) · ai.emptystaging · ai.exterior · ai.furniture ·
 *   ai.removebg · ai.localedit (5 mới, H2)
 *
 * MOOD + COLLAB (3 — đúng câu chốt §2):
 *   ai.moodboard (moodboard cộng tác) · input.guref (reference/gu) · note (sticky note, KHÔNG
 *   phải node registry — type React Flow riêng, xem lib/store.ts `addNote()`)
 *
 * NORMAL — inline như cũ, có lý do KHÔNG xếp MASTER dù cùng họ AI:
 *   - input.image/input.prompt/input.stylepreset/input.roominfo — đầu vào thuần, không phải
 *     "sản phẩm cuối" để mở window riêng (đúng ví dụ §2 "Nhập ảnh… inline").
 *   - three.camera/three.cad2fbx — 0 credit tất định, output nuôi node khác (camera/OBJ), không
 *     phải ảnh trình khách xem.
 *   - ai.batchvariants — ra 2-4 ảnh cùng lúc, không khớp khung 1-trước/1-sau của ToolModeForm.
 *   - ai.text2image — không nhận ảnh vào, bản chất gần INPUT/generator hơn "sửa ảnh có sẵn".
 *   - render.compare — so sánh 3 model cạnh nhau, output đa-ảnh có nhãn, dành người dùng nâng cao.
 *   - ai.image2video/ai.text2video — video sinh chuyển sang chặng "Vẽ 3D" cùng camera path
 *     (`CHOT-VIDEO-2-TANG-2026-08-02.md` "① Sinh phim ở IF2 chặng 2"), không thuộc bộ ảnh 2D.
 *   - ai.idmask/ai.furnitureextract/ai.smartselect — output kỹ thuật (mask/idmap) nuôi node
 *     KHÁC, không phải ảnh cuối cho khách xem — giống vai trò util hơn AI hero.
 *   - ai.pattern (Hoa văn) — MASTER-candidate hợp lý nhưng CHƯA đưa vào TASK_CARDS đợt này (ngoài
 *     5 mở rộng đã chọn) — cân nhắc đợt sau nếu Hoà muốn.
 *   - util.* (10 node) + out.* (3 node) — đúng ví dụ §2 "util.*, OUTPUT" nguyên văn.
 */

import { NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { TASK_CARDS } from './task-cards';

export type SidebarZone = 'mood' | 'master' | 'normal';

/** §2 "Mood + Collab — moodboard cộng tác kiểu Miro (ai.moodboard, reference, gu, note)" — tập
 * cố định, không suy được từ registry nên khai trực tiếp. */
const MOOD_NODE_TYPES: ReadonlySet<string> = new Set(['ai.moodboard', 'input.guref']);

/** Suy từ TASK_CARDS — 1 nguồn, đổi TASK_CARDS thì vùng MASTER tự cập nhật theo, không lệch. */
const MASTER_NODE_TYPES: ReadonlySet<string> = new Set(TASK_CARDS.map((c) => c.nodeType));

export function sidebarZoneOf(nodeType: string): SidebarZone {
  if (MASTER_NODE_TYPES.has(nodeType)) return 'master';
  if (MOOD_NODE_TYPES.has(nodeType)) return 'mood';
  return 'normal';
}

/** Toàn bộ `NodeDefinition` thuộc vùng "node thường" (mọi thứ registry trừ mood+master) — nguồn
 * cho phần liệt kê/tìm kiếm của sidebar (tái dùng danh sách + tag đã có trong `NodeLibraryPanel`,
 * KHÔNG dựng lại UI liệt kê từ đầu). */
export function normalNodeDefinitions() {
  return NODE_DEFINITIONS.filter((d) => sidebarZoneOf(d.type) === 'normal');
}
