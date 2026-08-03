'use client';

/**
 * components/studio/CadStageScreen.tsx — MÀN chặng 1 "Drafting CAD" dùng chung
 * (tách khỏi app/cad-editor/page.tsx ở Task #21 · ĐỔ NỀN 1B).
 *
 * Hai route mount CÙNG component này:
 *   · `/projects/[id]/cad` — scope dự án (route chính thức).
 *   · `/cad-editor`        — route cũ, nay redirect; khi chưa xác định được dự án nào đang
 *                            hoạt động thì render thẳng màn này (giữ hành vi cũ).
 *
 * 03/08 VIỆC 2 (`docs/SPEC-HA-TANG-UI-IF.md`) — chuyển từ `<StageShell>` sang `<AppShell>` sáu ổ:
 * CAD làm MẪU thí điểm (Render/Present CHƯA chuyển, xem `lib/shell/mode-registry.ts`).
 *   · `LayerPanel` dời từ ổ Inspector-phải (280, StageShell cũ) SANG ổ ② Navigator-trái 214
 *     (đúng `SPEC-CAD-SHELL-V3` §2 luật 2 "một sidebar, một việc: Lớp").
 *   · Ổ ④ Inspector 236 nay là `SelectionInfoPanel` (BIM/room/wall/shape — vốn đã tự gate
 *     `selection.length===0 → null`), CHỈ hiện khi có chọn — không còn nổi đè canvas.
 *   · Toolbelt (ổ ⑤, gộp `CadTouchDock`) CHƯA chuyển — việc riêng kế tiếp (giữ `CadTouchDock`
 *     nổi trong canvas như cũ ở bước này, tránh 1 commit đụng quá nhiều).
 */

import { useMemo } from 'react';
import CadSheets from '@/components/cad/CadSheets';
import CadToolbelt from '@/components/cad/CadToolbelt';
import { LayerPanel } from '@/components/cad/CadEditor';
import { CadInspectorPages } from '@/components/studio/CadInspectorPages';
import { StageEnter } from '@/components/studio/StageTransition';
import FoldableDualPane from '@/components/studio/FoldableDualPane';
import ReferencePane from '@/components/studio/ReferencePane';
import StatusBar from '@/components/studio/StatusBar';
import { AppShell } from '@/components/studio/AppShell';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { useFlowStore } from '@/lib/store';
import { useCadStore } from '@/lib/cad/store';
import { effectiveUserId } from '@/lib/resume';
import { useT } from '@/lib/i18n';

export default function CadStageScreen() {
  // Route studio KHÔNG nạp `user` vào store khi vào bằng hard-reload/URL trực tiếp — rơi về
  // lastUserId (cùng pattern CadSheets.tsx/ResumeTracker), nếu không StageIntroCard im lặng
  // không bao giờ hiện cho user mở thẳng `/projects/[id]/cad` (F5, bookmark, tab mới).
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId);
  const tr = useT();

  const doc = useCadStore((s) => s.doc);
  const selection = useCadStore((s) => s.selection);
  const addLayer = useCadStore((s) => s.addLayer);
  const clearSelection = useCadStore((s) => s.clearSelection);

  // Tiêu đề Inspector — 1 vật chọn thì tên rõ theo type, nhiều vật thì đếm số (khớp mock
  // "Phòng khách"/"24.6 m²" — ở đây chưa có mô hình "tên vật" đầy đủ như mock giả định, dùng
  // nhãn theo LOẠI entity, trung thực hơn là bịa tên phòng không có thật).
  // CHINH-5 (SPEC-PANEL-ROLLOUT §3 hàng "Lớp: Tường"): sub = CHẤM MÀU lớp + TÊN lớp (học Figma),
  // không nhãn "Lớp:", không lộ id thô (`l-wall`) như bản đầu.
  const { title, sub } = useMemo(() => {
    if (selection.length === 0) return { title: undefined, sub: undefined };
    if (selection.length > 1) return { title: tr(`${selection.length} đối tượng`, `${selection.length} objects`), sub: undefined };
    const e = doc.entities.find((x) => x.id === selection[0]);
    const layer = e ? doc.layers.find((l) => l.id === e.layer) : undefined;
    return {
      title: e ? tr(entityTypeLabel(e.type), e.type) : undefined,
      sub: layer ? (
        <span className="flex items-center gap-1.5" title={tr('Lớp', 'Layer')}>
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: layer.color }} />
          {layer.name}
        </span>
      ) : undefined,
    };
  }, [selection, doc.entities, doc.layers, tr]);

  return (
    <AppShell
      active="cad"
      statusBar={<StatusBar stage="concept" />}
      navigator={<LayerPanel />}
      navigatorAddLabel={tr('Lớp mới', 'New layer')}
      navigatorCollapsedLabel={tr('Lớp', 'Layers')}
      onNavigatorAdd={addLayer}
      /* CHINH-3 (SPEC-PANEL-ROLLOUT-IDF §2c): ruột Inspector = dải trang Rhino + rollout,
         thay SelectionInfoPanel chồng 4 box dọc. Gate chỉ-hiện-khi-chọn giữ nguyên. */
      inspector={selection.length > 0 ? <CadInspectorPages /> : undefined}
      inspectorTitle={title}
      inspectorSub={sub}
      onCloseInspector={selection.length > 0 ? clearSelection : undefined}
      /* Ổ ⑤ Toolbelt — dock kính gộp CadToolbar + CadTouchDock, hết đè Inspector (việc a
         hàng đợi CHINH, xem đầu CadToolbelt.tsx). */
      toolbelt={<CadToolbelt />}
    >
      <StageEnter>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + CadEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <FoldableDualPane primary={<CadSheets />} secondary={<ReferencePane />} />
      </StageEnter>
      {/* Tầng 2 onboarding — thẻ giới thiệu lần đầu chặng CAD (góc màn, không chặn thao tác). */}
      <StageIntroCard stage="cad" userId={userId} />
    </AppShell>
  );
}

function entityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    line: 'Đường',
    polyline: 'Đa tuyến',
    rect: 'Chữ nhật',
    circle: 'Đường tròn',
    text: 'Chữ',
    dimension: 'Kích thước',
    block: 'Khối',
    hatch: 'Vùng vật liệu',
  };
  return map[type] ?? type;
}
