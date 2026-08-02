/**
 * lib/render-studio/mindmap-templates.ts — G2 phần (6) (`docs/SPEC-CHANG2-UI-2MODE.md:27`
 * "Mindmap = 1 TUỲ CHỌN | khung lập luận kéo từ kệ Thư viện"): 1 template kinh điển nhất trong 6
 * form của `SPEC-STAGE-LIBRARIES.md:26` ("Khung concept 5 nhánh") — 5 form còn lại (Ma trận so
 * sánh, 6 chiếc mũ, SWOT, Bảng tiêu chí, Mood→Concept) là việc riêng "xây kệ Thư viện chặng 2 đầy
 * đủ", ngoài phạm vi phần này.
 *
 * KHÔNG viết node/type mới — dựng từ `note` (React Flow type riêng) qua `addNote`/`updateNote`
 * có sẵn (`lib/store.ts`), đúng khuôn `demoSketchToRender` (`NodeLibraryPanel.tsx`). Không nối
 * dây (React Flow edge chỉ nối node `interior` có port) — hình toả tròn quanh tâm tự đọc ra
 * "mindmap", không cần đường nối giả.
 *
 * Dùng CHUNG cho 2 đường tạo (bấm ở `NodeLibraryPanel` + kéo-thả ở `FlowCanvas.onDrop`) — tránh
 * lặp toạ độ lượng giác ở 2 nơi.
 */

/** 5 trục phổ quát của Ý TƯỞNG NỘI THẤT nói chung — trung tính, không áp gu/phong cách cụ thể
 *  (LUẬT NỀN TẢNG CLAUDE.md: không áp ngôn ngữ thiết kế lên nội dung người dùng). */
const CONCEPT_BRANCHES = [
  'Không gian & công năng',
  'Ánh sáng',
  'Vật liệu & màu sắc',
  'Phong cách/gu',
  'Cảm xúc mong muốn',
];

const CENTER_TEXT = 'Ý tưởng chính';
const RADIUS = 260;

export const MINDMAP_TEMPLATE_ID = 'concept-5-nhanh';

interface NoteActions {
  addNote: (position: { x: number; y: number }) => void;
  updateNote: (nodeId: string, note: string) => void;
  getLastNodeId: () => string | undefined;
}

/** Dựng "Khung concept 5 nhánh" quanh `center`: 1 note tâm + 5 note nhánh toả tròn (lượng giác,
 *  bán kính cố định, bắt đầu từ hướng 12 giờ). Mỗi `addNote` tự snapshot (đúng khuôn có sẵn) nên
 *  thao tác này ra 6 bước undo riêng — chấp nhận, cùng tiền lệ `demoSketchToRender`. */
export function instantiateConceptMindmap(center: { x: number; y: number }, actions: NoteActions): void {
  const { addNote, updateNote, getLastNodeId } = actions;

  addNote(center);
  const centerId = getLastNodeId();
  if (centerId) updateNote(centerId, CENTER_TEXT);

  const step = (2 * Math.PI) / CONCEPT_BRANCHES.length;
  CONCEPT_BRANCHES.forEach((label, i) => {
    const angle = -Math.PI / 2 + i * step; // bắt đầu hướng 12 giờ, xuôi chiều kim đồng hồ
    const pos = { x: center.x + RADIUS * Math.cos(angle), y: center.y + RADIUS * Math.sin(angle) };
    addNote(pos);
    const id = getLastNodeId();
    if (id) updateNote(id, label);
  });
}
