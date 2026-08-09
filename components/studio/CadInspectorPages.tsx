'use client';

/**
 * components/studio/CadInspectorPages.tsx — ruột Inspector chặng Vẽ theo CHINH-3
 * (`docs/SPEC-PANEL-ROLLOUT-IDF.md` §2): DẢI TRANG kiểu Rhino (§2c) + ROLLOUT trong trang
 * (§2a/2b/2d). Thay cách cũ `SelectionInfoPanel` CHỒNG 4 box dọc (đúng bệnh spec nêu: chồng
 * rollout thì cuộn mệt, layout nhảy khi đổi loại vật).
 *
 * Tập trang theo selection (§2c):
 *   · 1 khối (block)          → trang "Khối" (thông tin/biến thể + BIM chung 1 nhóm rollout)
 *   · 1 nhãn phòng (text)     → trang "Phòng" (công năng + BIM)
 *   · 1 cấu kiện phòng (room) → trang "Phòng" (diện tích/chu vi thật + BIM) — VIỆC PORT 08/08
 *     (`docs/mocks/2D Kỹ thuật.dc.html` màn 03 "Đang chọn một phòng"): trước đây `RoomEntity`
 *     (type:'room', sinh từ "Nhận diện phòng") KHÔNG có trang riêng — rơi vào trang "Chung" chỉ
 *     có BIM, mất hẳn Diện tích/Chu vi dù dữ liệu THẬT đã có sẵn (`roomAreaM2()`/
 *     `polygonPerimeter()`). ĐÍNH CHÍNH so bản trước: import `roomAreaM2`/`ROOM_KIND_OPTIONS` đã
 *     có sẵn nhưng CHƯA TỪNG được dùng thật (docstring cũ tự nhận "VIỆC PORT 08/08" nhưng code
 *     chưa có nhánh `single.type === 'room'` nào) — nay nối thật. Lớp sàn/Tầng/"Đưa vào bảng khối
 *     lượng" của mock CHƯA có dữ liệu backing (`RoomEntity` không có floorSpecId, BOQ tự tính từ
 *     TOÀN dự án qua `lib/boq/from-project.ts` chứ không có cơ chế "đẩy tay 1 phòng") — hiện đúng
 *     khung/token nhưng `disabled` kèm lý do tại `title`, theo đúng khuôn đã lập ở
 *     `WallFinishBox.tsx`/`SelectSameKindButton.tsx` (KHÔNG bịa dữ liệu, §9 không giấu ô trống).
 *     Khác `roomLabelEntity` (nhãn TEXT rời — không có `boundary`).
 *   · 1 tường (wall-like)     → trang "Tường" (Kích thước thật + loại tường + BIM) — rollout
 *     "Kích thước" (Dài/Dày/Cao, port màn 01/02 mock) MỚI 08/08, đọc `measuredWallLengthMm`/
 *     `measuredWallThicknessMm` (CadEditor.tsx, đã đo sẵn cho cảnh báo lệch — nay xuất ra dùng lại,
 *     không viết phép đo thứ hai).
 *   · mọi selection           → trang "Chung" (BIM · IFC — áp cho mọi entity, kể cả chọn nhiều)
 * Chọn NHIỀU loại khác nhau → chỉ còn trang "Chung" (luật §2c dòng cuối).
 *
 * `kindKey` nhớ bố cục rollout THEO LOẠI VẬT ('cad.block'/'cad.room'/'cad.roomentity'/
 * 'cad.wall'/'cad.generic'), đúng §2b — KHÔNG theo sub-mode.
 *
 * Nội dung box tái dùng NGUYÊN các component đã có (BimAssignBox/RoomTypeBox/WallTypePanel từ
 * CadEditor + ShapeInfoPanel từ ShapePalette) — CHINH chỉ thêm lớp trình bày, không viết lại
 * logic gán (đúng "một cỗ máy nhiều mặt tiền").
 */

import { Info, Home, BrickWall, Armchair, Ruler } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { BimAssignBox, RoomTypeBox, WallTypePanel, measuredWallLengthMm, measuredWallThicknessMm } from '@/components/cad/CadEditor';
import { ShapeInfoPanel } from '@/components/ShapePalette';
import { BLOCK_MAP } from '@/lib/cad/furniture';
import { ROOM_NAME_RE, isWallLikeEntity } from '@/lib/cad/standards/checker';
import type { Entity, RoomEntity } from '@/lib/cad/model';
import { roomAreaM2 } from '@/lib/cad/room';
import { polygonPerimeter } from '@/lib/cad/hatch';
import { InspectorPages, type InspectorPage } from '@/components/studio/InspectorPages';
import { RolloutGroup, Rollout } from '@/components/studio/Rollout';
import WallFinishBox from '@/components/studio/WallFinishBox';
import SelectSameKindButton from '@/components/studio/SelectSameKindButton';

const fieldRow: React.CSSProperties = {
  height: 28, background: 'var(--field)', borderRadius: 10, padding: '0 9px',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
};
const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--t4)' };
const fieldValue: React.CSSProperties = { font: '400 12px ui-monospace, Menlo, monospace', color: 'var(--t1)' };

/** Rollout "Kích thước" tường (port `2D Kỹ thuật.dc.html` màn 01/02) — CHỈ đọc, không sửa (sửa
 * "Dày" vẫn ở đúng MỘT chỗ: rollout "Loại tường" bên dưới, tránh 2 ô cùng ghi 1 field). "Cao"
 * dùng đúng mặc định scene 3D (`lib/three/cad-to-obj.ts:546` `opts.wallHeightMm ?? 2700`) khi
 * entity chưa khai riêng — ghi rõ "(mặc định)" thay vì hiện số trần như đã khai. */
function WallSizeBox({ entity }: { entity: Entity }) {
  const lengthMm = measuredWallLengthMm(entity);
  const thicknessMm = entity.wallThicknessMm ?? measuredWallThicknessMm(entity);
  const heightIsDefault = entity.heightMm == null;
  const heightMm = entity.heightMm ?? 2700;
  const areaM2 = lengthMm != null ? (lengthMm * heightMm) / 1e6 : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={fieldRow}>
        <span style={fieldLabel}>Dài</span>
        <span style={fieldValue}>{lengthMm != null ? `${Math.round(lengthMm).toLocaleString('vi-VN')}` : '—'}</span>
      </div>
      <div style={fieldRow}>
        <span style={fieldLabel}>Dày</span>
        <span style={fieldValue}>{thicknessMm != null ? `${Math.round(thicknessMm).toLocaleString('vi-VN')}` : '—'}</span>
      </div>
      <div style={fieldRow}>
        <span style={fieldLabel}>Cao</span>
        <span style={fieldValue}>
          {Math.round(heightMm).toLocaleString('vi-VN')}
          {heightIsDefault && <span style={{ color: 'var(--t4)', fontWeight: 400 }}> (mặc định)</span>}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--t4)' }}>
        <span>Đơn vị mi-li-mét</span>
        {areaM2 != null && <span style={{ font: '400 11px ui-monospace, Menlo, monospace', color: 'var(--t3)' }}>{areaM2.toFixed(2)} m²</span>}
      </div>
    </div>
  );
}

/** Rollout "Diện tích" phòng (port màn 03) — Diện tích/chu vi tính THẬT từ `boundary`
 * (`roomAreaM2`/`polygonPerimeter`, cùng bộ máy `lib/cad/room.ts`/`hatch.ts` mọi ống kính khác
 * dùng — không đo lần hai). */
function RoomSizeBox({ entity }: { entity: RoomEntity }) {
  const areaM2 = roomAreaM2(entity);
  const perimeterMm = polygonPerimeter(entity.boundary);
  return (
    <div>
      <div style={{ background: 'var(--field)', borderRadius: 14, padding: 12, textAlign: 'center' }}>
        <div style={{ font: '600 28px ui-monospace, Menlo, monospace', color: 'var(--t1)', letterSpacing: '-.02em' }}>
          {areaM2.toFixed(2)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 2 }}>mét vuông thông thuỷ</div>
      </div>
      <div style={{ ...fieldRow, marginTop: 8 }}>
        <span style={fieldLabel}>Chu vi</span>
        <span style={fieldValue}>{Math.round(perimeterMm).toLocaleString('vi-VN')}</span>
      </div>
    </div>
  );
}

/** Rollout "Lớp sàn" phòng — khung/token port mock, KHÔNG bịa vật liệu: `RoomEntity` chưa có
 * field vật liệu sàn (`lib/cad/model.ts` docstring RoomEntity: "Field vật liệu phòng… CHƯA khai ở
 * đây — chưa có ống kính nào tiêu thụ, thêm khi có nơi tiêu thụ thật"). Cùng khuôn `WallFinishBox`
 * — "— chưa gán —" + nút disabled kèm lý do tại `title`, không phải nút chết vô cớ. */
function RoomFloorBox() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 34, padding: '0 9px', background: 'var(--field)', borderRadius: 10 }}>
        <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none', background: 'var(--border-strong)' }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--t4)' }}>— chưa gán —</span>
      </div>
      <button
        type="button"
        disabled
        title="RoomEntity chưa có field vật liệu sàn (lib/cad/model.ts, docstring RoomEntity) — cần chốt cách lưu trước, ngoài phạm vi port UI này"
        style={{ marginTop: 8, width: '100%', height: 28, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--field)', color: 'var(--t4)', font: '600 11px inherit', cursor: 'not-allowed', opacity: 0.6 }}
      >
        Đổi lớp sàn
      </button>
    </div>
  );
}

/** Rollout "Tầng" phòng — `storey` (Base, model.ts) đã có field lưu được, chỉ CHƯA có UI gán ở
 * IF1 (docstring Base: "Chưa có UI gán ở IF1; hiện chỉ nền dữ liệu cho IF2-C") — hiện ĐỌC thật,
 * không dựng dropdown giả (chưa có danh sách tầng của dự án để chọn). "Đưa vào bảng khối lượng"
 * disabled — BOQ trong app này tự tính từ TOÀN dự án (`lib/boq/from-project.ts`), không có cơ chế
 * đẩy tay từng phòng; nút mock không khớp kiến trúc thật nên giữ khung + lý do, không giả bấm. */
function RoomStoreyBox({ entity }: { entity: RoomEntity }) {
  return (
    <div>
      <div style={fieldRow}>
        <span style={{ ...fieldLabel, textTransform: 'none', fontWeight: 400, color: 'var(--t1)', fontSize: 12 }}>{entity.storey ?? '—'}</span>
      </div>
      <button
        type="button"
        disabled
        title="BOQ trong IF tự tính từ toàn bộ dự án (lib/boq/from-project.ts) — không có cơ chế đẩy tay 1 phòng vào bảng khối lượng"
        style={{ marginTop: 8, width: '100%', height: 32, border: 'none', borderRadius: 10, background: 'var(--field)', color: 'var(--t4)', font: '600 12px inherit', cursor: 'not-allowed', opacity: 0.6 }}
      >
        Đưa vào bảng khối lượng
      </button>
    </div>
  );
}

export function CadInspectorPages() {
  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const updateEntities = useCadStore((s) => s.updateEntities);
  const clearSelection = useCadStore((s) => s.clearSelection);

  if (selection.length === 0) return null;
  const selected = doc.entities.filter((e) => selection.includes(e.id));
  if (!selected.length) return null;

  const single = selection.length === 1 ? selected[0] : null;
  const blockEntity = single && single.type === 'block' ? single : null;
  const roomLabelEntity = single && single.type === 'text' && ROOM_NAME_RE.test(single.text.trim()) ? single : null;
  // VIỆC PORT 08/08 — `RoomEntity` (biên đã duyệt qua "Nhận diện phòng", khác `roomLabelEntity`
  // là nhãn TEXT rời chưa có boundary).
  const roomBoundaryEntity = single && single.type === 'room' ? single : null;
  const wallLikeEntity = single && isWallLikeEntity(single) ? single : null;

  const bim = <BimAssignBox key={selection.join('|')} selected={selected} onApply={updateEntities} />;

  const pages: InspectorPage[] = [];

  if (blockEntity) {
    pages.push({
      id: 'block',
      icon: Armchair,
      label: 'Khối · biến thể',
      content: (
        <RolloutGroup kindKey="cad.block">
          <Rollout id="shape" title="Khối · biến thể">
            <div style={{ padding: 10 }}>
              <ShapeInfoPanel
                entity={blockEntity}
                def={BLOCK_MAP[blockEntity.block]}
                onVariantChange={(variantId) => updateEntities([{ ...blockEntity, variant: variantId }])}
                onClose={clearSelection}
              />
            </div>
          </Rollout>
          <Rollout id="bim" title="BIM · IFC">
            <div style={{ padding: 10 }}>{bim}</div>
          </Rollout>
        </RolloutGroup>
      ),
    });
  }
  if (roomLabelEntity) {
    pages.push({
      id: 'room',
      icon: Home,
      label: 'Công năng phòng',
      content: (
        <RolloutGroup kindKey="cad.room">
          <Rollout id="roomtype" title="Công năng phòng">
            <div style={{ padding: 10 }}>
              <RoomTypeBox key={`room-${roomLabelEntity.id}`} entity={roomLabelEntity} onApply={updateEntities} />
            </div>
          </Rollout>
          <Rollout id="bim" title="BIM · IFC">
            <div style={{ padding: 10 }}>{bim}</div>
          </Rollout>
        </RolloutGroup>
      ),
    });
  }
  if (roomBoundaryEntity) {
    pages.push({
      id: 'roomboundary',
      icon: Ruler,
      label: 'Phòng',
      content: (
        <RolloutGroup kindKey="cad.roomentity">
          <Rollout id="size" title="Diện tích">
            <div style={{ padding: 10 }}>
              <RoomSizeBox key={`roomsize-${roomBoundaryEntity.id}`} entity={roomBoundaryEntity} />
            </div>
          </Rollout>
          <Rollout id="floor" title="Lớp sàn">
            <div style={{ padding: 10 }}>
              <RoomFloorBox key={`roomfloor-${roomBoundaryEntity.id}`} />
            </div>
          </Rollout>
          <Rollout id="storey" title="Tầng">
            <div style={{ padding: 10 }}>
              <RoomStoreyBox key={`roomstorey-${roomBoundaryEntity.id}`} entity={roomBoundaryEntity} />
            </div>
          </Rollout>
          <Rollout id="bim" title="BIM · IFC">
            <div style={{ padding: 10 }}>{bim}</div>
          </Rollout>
        </RolloutGroup>
      ),
    });
  }
  if (wallLikeEntity) {
    pages.push({
      id: 'wall',
      icon: BrickWall,
      label: 'Loại tường',
      content: (
        <RolloutGroup kindKey="cad.wall">
          <Rollout id="size" title="Kích thước">
            <div style={{ padding: 10 }}>
              <WallSizeBox key={`wallsize-${wallLikeEntity.id}`} entity={wallLikeEntity} />
            </div>
          </Rollout>
          <Rollout id="walltype" title="Loại tường">
            <div style={{ padding: 10 }}>
              <WallTypePanel key={`wall-${wallLikeEntity.id}`} entity={wallLikeEntity} onApply={updateEntities} />
            </div>
          </Rollout>
          {/* VIỆC 2①③ (PHIEU-CODE-IF-DOT6 NHÓM B) — port mock-2d-ky-thuat.html, xem docstring
              WallFinishBox.tsx/SelectSameKindButton.tsx cho lý do disabled + luật port L2. */}
          <Rollout id="finish" title="Lớp hoàn thiện">
            <div style={{ padding: 10 }}>
              <WallFinishBox key={`finish-${wallLikeEntity.id}`} />
            </div>
          </Rollout>
          <Rollout id="select-same" title="Chọn theo loại">
            <div style={{ padding: 10 }}>
              <SelectSameKindButton key={`same-${wallLikeEntity.id}`} doc={doc} entity={wallLikeEntity} />
            </div>
          </Rollout>
          <Rollout id="bim" title="BIM · IFC">
            <div style={{ padding: 10 }}>{bim}</div>
          </Rollout>
        </RolloutGroup>
      ),
    });
  }

  // Trang "Chung" — CHỈ khi không có trang loại-vật nào (selection nhiều loại / loại chưa có
  // trang riêng). Có trang riêng rồi thì BIM đã nằm trong đó, thêm "Chung" nữa là 2 nơi cùng 1 ô.
  if (pages.length === 0) {
    pages.push({
      id: 'general',
      icon: Info,
      label: 'Chung · BIM',
      content: (
        <RolloutGroup kindKey="cad.generic">
          <Rollout id="bim" title="BIM · IFC">
            <div style={{ padding: 10 }}>{bim}</div>
          </Rollout>
        </RolloutGroup>
      ),
    });
  }

  return <InspectorPages pages={pages} />;
}
