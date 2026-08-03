/**
 * lib/render-studio/group-kind.ts — suy loại + nhãn hiển thị cho `SceneGroup` (VIỆC "MỘT THƯ VIỆN"
 * `PHIEU-CODE-IF-DOT6`/`SPEC-DUNG-3D-THONG-NHAT` §5-6, tách khỏi `Command3DPanel.tsx` khi cây đối
 * tượng dời sang Navigator (`Object3DTree.tsx`) và panel thuộc tính dời sang Inspector
 * (`Object3DInspector.tsx`) — CẢ HAI cần cùng một cách suy loại/nhãn, tránh 2 bản lệch nhau.
 *
 * Loại group suy từ TIỀN TỐ tên (`docToObjScene()` đặt tên tất định: `Wall_i`/`Furn_i_id`/
 * `Window_i`/`Room_i`/`Floor`/`Ceiling` — xem `lib/three/cad-to-obj.ts`), không phải dữ liệu khai
 * báo riêng — đủ dùng vì tên đã tất định, không cần thêm field.
 */
import type { SceneGroup } from '@/lib/three/cad-to-obj';

export type GroupKind = 'wall' | 'furniture' | 'window' | 'room' | 'floor' | 'ceiling' | 'other';

export function kindOfGroup(name: string): GroupKind {
  if (name.startsWith('Wall_')) return 'wall';
  if (name.startsWith('Furn_')) return 'furniture';
  if (name.startsWith('Window_')) return 'window';
  if (name.startsWith('Room_')) return 'room';
  if (name === 'Floor') return 'floor';
  if (name === 'Ceiling') return 'ceiling';
  return 'other';
}

export const KIND_LABEL_VI: Record<GroupKind, string> = {
  wall: 'Tường', furniture: 'Nội thất', window: 'Cửa sổ', room: 'Phòng', floor: 'Sàn', ceiling: 'Trần', other: 'Khối',
};
export const KIND_LABEL_EN: Record<GroupKind, string> = {
  wall: 'Wall', furniture: 'Furniture', window: 'Window', room: 'Room', floor: 'Floor', ceiling: 'Ceiling', other: 'Block',
};
export const KIND_DOT: Record<GroupKind, string> = {
  wall: 'var(--t3)', furniture: 'var(--success)', window: 'var(--accent)', room: 'var(--t5)',
  floor: 'var(--warning)', ceiling: 'var(--t5)', other: 'var(--t5)',
};

/** Nhãn hiển thị — số thứ tự đọc từ tên tất định (`Wall_2` → "Tường 2"); mock gốc dùng tên
 * PHÒNG THẬT (Tường Bắc/Tây) nhưng dữ liệu đó (`RoomEntity`, hướng tường) CHƯA có trong Doc
 * (SPEC-DUNG-3D-THONG-NHAT §11.2 câu treo) — số thứ tự là thứ DUY NHẤT có thật hôm nay, không bịa
 * hướng/tên phòng. */
export function labelOfGroup(g: SceneGroup, tr: (vi: string, en: string) => string): string {
  const kind = kindOfGroup(g.name);
  const n = g.name.match(/_(\d+)/)?.[1] ?? '';
  if (kind === 'floor') return tr('Sàn', 'Floor');
  if (kind === 'ceiling') return tr('Trần', 'Ceiling');
  if (kind === 'furniture') {
    const blockId = g.name.split('_').slice(2).join('_');
    return `${tr('Nội thất', 'Furniture')} ${n}${blockId ? ` · ${blockId}` : ''}`;
  }
  return `${tr(KIND_LABEL_VI[kind], KIND_LABEL_EN[kind])} ${n}`.trim();
}
