'use client';

/**
 * components/render-studio/doc-catalog.ts — CẦU GHI TẠM cho hai catalog cấp `Doc` mà PHU vừa mở ở
 * TẦNG DỮ LIỆU nhưng CHƯA có lệnh ghi: `Doc.levels` (VIỆC 1) và `Doc.wallTypes` (VIỆC 3 của PHU).
 *
 * 🔴 VÌ SAO PHẢI CÓ FILE NÀY — đo được, không suy đoán:
 * `lib/cad/store.ts` khai đủ `addEntities`/`updateEntities`/`cutHoleInWall`/`setEntityBevel`… và
 * `addLayer`/`updateLayer`/`removeLayer` cho `Doc.layers`, nhưng **KHÔNG có một action nào đụng
 * `doc.levels` hay `doc.wallTypes`** (`grep -n "levels\|wallTypes" lib/cad/store.ts` = 0). PHU
 * mới ra `lib/cad/levels.ts` + `lib/cad/wall-types.ts` — cả hai là HÀM THUẦN đọc/giải, không ghi.
 * Phiếu phiên này CẤM đụng `lib/*` ⇒ không thêm action vào store được.
 *
 * ⇒ Hai hàm dưới đây làm ĐÚNG những gì `updateEntities` làm, không hơn: `snapshot()` trước (để
 * ⌘Z hoàn tác được), rồi `set` một `doc` MỚI **cộng thêm** (`{...s.doc, levels}`) — TUYỆT ĐỐI
 * không `setState({ doc })` ghi đè nguyên doc, đúng bài học đã trả giá ở `SO-KIEM-TONG.md` §7b.
 * `syncHostedOpenings` KHÔNG gọi ở đây vì hai catalog này không đụng entity nào (chỉ `assign*`
 * bên dưới đụng entity, và nó đi qua `updateEntities` chính chủ nên đã được reconcile sẵn).
 *
 * ⏳ VIỆC CỦA PHU (đề nghị trong báo cáo phiên): thêm `setLevels()` / `setWallTypes()` /
 * `setLighting()` vào `lib/cad/store.ts`, rồi xoá file này và đổi các chỗ gọi. Không có gì trong
 * đây đáng sống lâu.
 */

import { useCadStore } from '@/lib/cad/store';
import { levelsFromStoreys, sortedLevels } from '@/lib/cad/levels';
import { DEFAULT_SUN, DEFAULT_SKY } from '@/lib/three/lighting';
import type { DocLighting, RoomLight, SunLight, SkyLight } from '@/lib/three/lighting';
import type { Level, WallType, Entity } from '@/lib/cad/model';

function patchDoc(patch: { levels?: Level[]; wallTypes?: WallType[]; lighting?: DocLighting }) {
  useCadStore.getState().snapshot();
  useCadStore.setState((s) => ({ doc: { ...s.doc, ...patch } }));
}

export function writeLevels(levels: Level[]) {
  patchDoc({ levels });
}

export function writeWallTypes(wallTypes: WallType[]) {
  patchDoc({ wallTypes });
}

/** Sinh id tầng bằng CHÍNH hàm của PHU (`levelsFromStoreys`) thay vì chép lại công thức slug —
 * chép tay là lệch, mà lệch id nghĩa là mọi `levelId` đã ghi ra `.idf` thành mồ côi. */
function newLevelId(name: string, existing: Level[]): string {
  const base = levelsFromStoreys([name])[0]?.id ?? 'level';
  if (!existing.some((l) => l.id === base)) return base;
  let n = 2;
  while (existing.some((l) => l.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Thêm MỘT tầng vào cuối danh sách. Dùng chung cho nút ＋ của `LevelManagerPanel` và phím tắt
 * Shift+T ở `Render3DModeSkeleton` — hai cửa, MỘT hàm (nếu tách đôi thì hai đường sinh id khác
 * nhau là chuyện sớm muộn). `elevationMm` = 0, KHÔNG đoán 3000/tầng: đoán số cao độ là bịa dữ
 * liệu vào hồ sơ kỹ thuật, đúng lý do PHU đã ghi ở `levelsFromStoreys`.
 */
export function addLevelToDoc(baseName: string): Level {
  const levels = sortedLevels(useCadStore.getState().doc);
  const nth = levels.filter((l) => l.name.startsWith(baseName)).length;
  const name = nth ? `${baseName} ${nth + 1}` : baseName;
  const level: Level = { id: newLevelId(name, levels), name, elevationMm: 0, order: levels.length };
  writeLevels([...levels, level]);
  return level;
}

/**
 * Gán tầng cho một tập entity. Ghi **CẢ HAI** field theo đúng luật của `Level` (`model.ts:157`):
 * `levelId` (nguồn cao độ) và `storey` (nhãn hiển thị/nhóm — DXF XDATA, cây đối tượng, BOQ vẫn
 * đọc nó). Ghi thiếu `storey` thì khối biến mất khỏi bucket cây đối tượng dù đã có tầng.
 *
 * Đi qua `updateEntities` chính chủ ⇒ tự có snapshot + bỏ qua layer đang khoá + reconcile host.
 */
export function assignLevelToEntities(entityIds: string[], level: Level) {
  const store = useCadStore.getState();
  const ids = new Set(entityIds);
  const next = store.doc.entities.filter((e) => ids.has(e.id)).map((e) => ({ ...e, levelId: level.id, storey: level.name }));
  if (!next.length) return;
  store.updateEntities(next);
}

/**
 * Gỡ giá trị khai TRÊN INSTANCE để tham số rơi về Type ("Trả về theo Type", VIỆC 2). Phải xoá hẳn
 * key chứ không gán `undefined` — `resolveWallParams()` (`lib/cad/wall-types.ts:63`) phân biệt
 * bằng `instance !== undefined`, mà `{...e, wallKind: undefined}` vẫn đi qua nhánh 'instance' nếu
 * ai đó đọc bằng `'wallKind' in e`. Xoá key là cách duy nhất không mơ hồ.
 */
export function clearWallInstanceOverride(entityId: string, field: 'wallThicknessMm' | 'wallKind' | 'specId') {
  const store = useCadStore.getState();
  const entity = store.doc.entities.find((e) => e.id === entityId);
  if (!entity) return;
  const next = { ...entity } as Entity & Record<string, unknown>;
  delete next[field];
  store.updateEntities([next as Entity]);
}

/* ────────────────────────────────── ĐÈN (`Doc.lighting`, VIỆC 3) ────────────────────────────── */

/**
 * `Doc.lighting` hiện tại, hoặc bộ mặc định của PHU khi chưa cấu hình. Đọc qua đây thay vì
 * `doc.lighting ?? {...}` rải rác — hai chỗ tự chế mặc định là hai chỗ lệch.
 * ⚠️ Dùng ĐÚNG `DEFAULT_SUN`/`DEFAULT_SKY` xuất từ `lighting.ts`, KHÔNG chép số (`buildLightRig()`
 * cũng lùi về đúng hai hằng đó — chép tay là sớm muộn UI hiện một đằng, render một nẻo).
 */
export function currentLighting(): DocLighting {
  const l = useCadStore.getState().doc.lighting;
  return { sun: l?.sun ?? DEFAULT_SUN, sky: l?.sky ?? DEFAULT_SKY, rooms: l?.rooms ?? [] };
}

export function writeSun(patch: Partial<SunLight>) {
  const cur = currentLighting();
  patchDoc({ lighting: { ...cur, sun: { ...cur.sun, ...patch } } });
}

export function writeSky(patch: Partial<SkyLight>) {
  const cur = currentLighting();
  patchDoc({ lighting: { ...cur, sky: { ...cur.sky, ...patch } } });
}

export function writeRoomLights(rooms: RoomLight[]) {
  patchDoc({ lighting: { ...currentLighting(), rooms } });
}

/** Đổi MỘT đèn. Tách riêng khỏi `writeRoomLights` vì kéo gizmo gọi hàm này liên tục — giữ nguyên
 * mảng cho các đèn khác để React khỏi dựng lại cả danh sách mỗi khung kéo. */
export function patchRoomLight(id: string, patch: Partial<RoomLight>) {
  const cur = currentLighting();
  patchDoc({ lighting: { ...cur, rooms: cur.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) } });
}

/** Id tất định theo số thứ tự đang có — KHÔNG `Math.random()`/`Date.now()` (cùng luật PHU đã đặt
 * ở `levelIdFromStorey`: mở cùng một tệp hai lần phải ra cùng bộ id). */
export function newRoomLightId(rooms: RoomLight[]): string {
  let n = rooms.length + 1;
  while (rooms.some((r) => r.id === `light-${n}`)) n += 1;
  return `light-${n}`;
}

/** Gán `typeId` cho entity đang chọn ("Áp cho vật đang chọn", VIỆC 2). */
export function assignWallType(entityIds: string[], typeId: string) {
  const store = useCadStore.getState();
  const ids = new Set(entityIds);
  const next = store.doc.entities.filter((e) => ids.has(e.id)).map((e) => ({ ...e, typeId }));
  if (!next.length) return;
  store.updateEntities(next);
}
