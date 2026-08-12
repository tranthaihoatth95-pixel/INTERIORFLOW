/**
 * lib/present-editor/schedule-table.ts — MẶT TIỀN `schedule` (nhãn hiển thị "Bảng thống kê") của
 * `TableDocEngine` (Đợt 4, `docs/phieu-giao/editor-bang-bieu-mau.md`). V1: thống kê CỬA + PHÒNG,
 * đọc thẳng Doc 2D THẬT của flow (không snapshot/ảnh — cùng luật T1 `getProjectDoc` đã áp cho
 * BOQ, xem `project-doc.ts`).
 *
 * "Cửa là con tường" (SPEC-LENH-VE-IF): cửa trong dữ liệu là `BlockEntity` có
 * `elementType==='door'`, không phải entity riêng. "Phòng có diện tích": `RoomEntity.boundary`
 * là biên KÍN của lòng phòng — diện tích tính qua `polygonArea` (mm² → m²).
 *
 * TÁI DÙNG, KHÔNG viết lại (Luật #6 CLAUDE.md — một cỗ máy nhiều mặt tiền):
 *  - `blockInfo()` (`lib/cad/schedule.ts`) — CÙNG hàm Hệ Legend C1 (đóng dấu bảng lên bản vẽ) và
 *    `openingsAreaInPolygon`/`openingsWidthOnBoundary` (`lib/cad/hatch.ts`) đã dùng để lấy tên +
 *    bề rộng danh nghĩa của 1 block cửa/sổ từ `BLOCK_MAP`/variant.
 *  - `polygonArea()` (`lib/cad/hatch.ts`) — cùng hàm BOQ/hatch dùng để đo diện tích đa giác.
 *  - `OPENING_STANDARD_HEIGHT_MM.door` (`lib/cad/hatch.ts`) — cùng chiều cao chuẩn nghề 2100mm
 *    BOQ đã dùng cho diện tích lỗ mở (2.1.9.q), tránh 2 nơi có 2 con số khác nhau cho "cao cửa".
 *
 * CHỈ ĐỌC `lib/cad/**` (vùng file ③ của phiếu giao việc — không sửa file nào trong đó).
 *
 * THUẦN — không React/DOM (test bằng sucrase-node như `table-doc-engine.test.ts`).
 */
import type { Doc } from '../cad/model';
import { blockInfo } from '../cad/schedule';
import { polygonArea, OPENING_STANDARD_HEIGHT_MM } from '../cad/hatch';
import { ROOM_KIND_OPTIONS } from '../cad/model';
import type { TableColumnDef, TableRowSeed } from './table-doc-engine';

export const SCHEDULE_GROUP_DOOR = 'door';
export const SCHEDULE_GROUP_ROOM = 'room';

const ROOM_KIND_LABEL = new Map(ROOM_KIND_OPTIONS.map((o) => [o.value, o.label]));

/** Cột docType `schedule` v1 — nhãn hiển thị KHÔNG lộ chữ "schedule"/jargon (SPEC-NGON-NGU). */
export const SCHEDULE_COLUMNS: TableColumnDef[] = [
  { key: 'label', label: ['Tên', 'Name'], editable: false },
  { key: 'spec', label: ['Thông số', 'Specification'], kind: 'text' },
  { key: 'areaM2', label: ['Diện tích (m²)', 'Area (m²)'], kind: 'number', align: 'right', summable: true },
  { key: 'storey', label: ['Tầng', 'Storey'], editable: false },
  { key: 'note', label: ['Ghi chú', 'Note'], kind: 'text' },
];

const NO_STOREY_LABEL = 'Chưa gán tầng · No storey';

/**
 * Gieo dòng từ Doc SỐNG — 1 hàng = 1 entity (cửa hoặc phòng), giữ `entityId` để re-sync +
 * "Xem trên bản vẽ" (cùng UX `BoqScreen#viewOnDrawing`). Doc rỗng ⇒ mảng rỗng, KHÔNG lỗi (luật
 * X2 — empty state làm được việc tại chỗ, không chặn).
 */
export function buildScheduleRowSeeds(doc: Doc): TableRowSeed[] {
  const seeds: TableRowSeed[] = [];

  for (const e of doc.entities) {
    if (e.type === 'block' && e.elementType === 'door') {
      const { label, w } = blockInfo(e);
      seeds.push({
        id: `entity:${e.id}`,
        entityId: e.id,
        groupKey: SCHEDULE_GROUP_DOOR,
        groupLabel: 'Cửa đi · Doors',
        cells: {
          label,
          // w = rộng danh nghĩa (mm, từ BLOCK_MAP/variant) — block DXF/lạ không có trong BLOCK_MAP
          // thì `w` undefined, KHÔNG đoán mò (đúng nguyên tắc `openingsAreaInPolygon`).
          spec: w ? `${w} × ${OPENING_STANDARD_HEIGHT_MM.door} mm` : null,
          storey: e.storey ?? NO_STOREY_LABEL,
        },
      });
      continue;
    }
    if (e.type === 'room') {
      const areaM2 = e.boundary.length >= 3 ? Math.round((polygonArea(e.boundary) / 1e6) * 100) / 100 : null;
      seeds.push({
        id: `entity:${e.id}`,
        entityId: e.id,
        groupKey: SCHEDULE_GROUP_ROOM,
        groupLabel: 'Phòng · Rooms',
        cells: {
          label: e.name || '—',
          spec: e.roomKind ? (ROOM_KIND_LABEL.get(e.roomKind) ?? null) : null,
          areaM2,
          storey: e.storey ?? NO_STOREY_LABEL,
        },
      });
    }
  }

  return seeds;
}
