'use client';

/**
 * components/studio/CadInspectorPages.tsx — ruột Inspector chặng Vẽ theo CHINH-3
 * (`docs/SPEC-PANEL-ROLLOUT-IDF.md` §2): DẢI TRANG kiểu Rhino (§2c) + ROLLOUT trong trang
 * (§2a/2b/2d). Thay cách cũ `SelectionInfoPanel` CHỒNG 4 box dọc (đúng bệnh spec nêu: chồng
 * rollout thì cuộn mệt, layout nhảy khi đổi loại vật).
 *
 * Tập trang theo selection (§2c):
 *   · 1 khối (block)      → trang "Khối" (thông tin/biến thể + BIM chung 1 nhóm rollout)
 *   · 1 nhãn phòng (text) → trang "Phòng" (công năng + BIM)
 *   · 1 tường (wall-like) → trang "Tường" (loại tường + BIM)
 *   · mọi selection       → trang "Chung" (BIM · IFC — áp cho mọi entity, kể cả chọn nhiều)
 * Chọn NHIỀU loại khác nhau → chỉ còn trang "Chung" (luật §2c dòng cuối).
 *
 * `kindKey` nhớ bố cục rollout THEO LOẠI VẬT ('cad.block'/'cad.room'/'cad.wall'/'cad.generic'),
 * đúng §2b — KHÔNG theo sub-mode.
 *
 * Nội dung box tái dùng NGUYÊN các component đã có (BimAssignBox/RoomTypeBox/WallTypePanel từ
 * CadEditor + ShapeInfoPanel từ ShapePalette) — CHINH chỉ thêm lớp trình bày, không viết lại
 * logic gán (đúng "một cỗ máy nhiều mặt tiền").
 */

import { Info, Home, BrickWall, Armchair } from 'lucide-react';
import { useCadStore } from '@/lib/cad/store';
import { BimAssignBox, RoomTypeBox, WallTypePanel } from '@/components/cad/CadEditor';
import { ShapeInfoPanel } from '@/components/ShapePalette';
import { BLOCK_MAP } from '@/lib/cad/furniture';
import { ROOM_NAME_RE, isWallLikeEntity } from '@/lib/cad/standards/checker';
import { InspectorPages, type InspectorPage } from '@/components/studio/InspectorPages';
import { RolloutGroup, Rollout } from '@/components/studio/Rollout';

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
  if (wallLikeEntity) {
    pages.push({
      id: 'wall',
      icon: BrickWall,
      label: 'Loại tường',
      content: (
        <RolloutGroup kindKey="cad.wall">
          <Rollout id="walltype" title="Loại tường">
            <div style={{ padding: 10 }}>
              <WallTypePanel key={`wall-${wallLikeEntity.id}`} entity={wallLikeEntity} onApply={updateEntities} />
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
