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
 *
 * 05/08 VIỆC A3 (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md`, Trụ 4) — Navigator/canvas không còn
 * literal JSX rải trong component: khai 2 mode `2d/sketch`/`2d/pro` qua `defineMode()` ở MODULE
 * SCOPE (chạy trước khi `CadStageScreen` render lần đầu), component chỉ `requireMode(modeId)`.
 * Cả 2 mode dùng CHUNG `CAD_NAVIGATOR`/`CAD_CANVAS` — đúng hành vi THẬT hôm nay (Sketch/Pro chỉ
 * khác BỘ CÔNG CỤ trong `CadToolbar`, không khác Navigator/canvas) — khai đủ 4 thứ không có
 * nghĩa là bịa ra khác biệt chưa tồn tại. `cadMode==='revit'` GỘP vào `'2d/pro'` (cùng cách
 * `phaseLabel()` gộp cadStage `technical`/`bim` — BIM/Cấu kiện không còn là mode Trụ-4 riêng từ
 * VÒNG CUỐI 03/08, xem `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md`). `cadMode` (khoá kỹ thuật
 * `sketch`/`pro`/`revit`, persist localStorage) GIỮ NGUYÊN — chỉ map sang `ModeId` lúc tra
 * registry, không đổi khoá lưu.
 */

import { useMemo, type ReactNode } from 'react';
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
import { useCadStore, type CadMode } from '@/lib/cad/store';
import { defineMode, requireMode, type ModeId } from '@/lib/shell/mode-registry';
import { effectiveUserId } from '@/lib/resume';
import { useT } from '@/lib/i18n';

const CAD_NAVIGATOR: ReactNode = <LayerPanel />;
const CAD_CANVAS: ReactNode = <FoldableDualPane primary={<CadSheets />} secondary={<ReferencePane />} />;

defineMode('2d/sketch', {
  stage: 'cad',
  label: ['Sơ phác', 'Sketch'],
  navigator: CAD_NAVIGATOR,
  canvas: CAD_CANVAS,
  shelves: ['cad-kyhieu', 'cad-room'],
  commands: 'cad.sketch.*',
});
defineMode('2d/pro', {
  stage: 'cad',
  // 08/08 — nhãn theo chốt 07/08 "ĐỊNH NGHĨA BA CHẶNG" (docs/00-CHOT.md): pro = "Chuyên | Pro
  // mode", gồm luôn Revit 2D. Chỉ đổi NHÃN — id `'2d/pro'` và khoá cadMode giữ nguyên.
  label: ['Chuyên', 'Pro'],
  navigator: CAD_NAVIGATOR,
  canvas: CAD_CANVAS,
  shelves: ['cad-kyhieu', 'cad-sheet', 'cad-room', 'cad-hatch', 'cad-form'],
  commands: 'cad.pro.*',
});

/** `revit` gộp vào `'2d/pro'` — xem docstring đầu file. */
function cadModeToModeId(m: CadMode): ModeId {
  return m === 'sketch' ? '2d/sketch' : '2d/pro';
}

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
  // Trụ 4 A3 — đọc khai báo thay vì hardcode navigator/canvas; xem defineMode() đầu file.
  const cadMode = useCadStore((s) => s.cadMode);
  const mode = requireMode(cadModeToModeId(cadMode));

  // Tiêu đề Inspector — 1 vật chọn thì tên rõ theo type, nhiều vật thì đếm số (khớp mock
  // "Phòng khách"/"24.6 m²"). 08/08 ĐÍNH CHÍNH — ghi chú cũ ở đây nói "chưa có mô hình 'tên vật'
  // đầy đủ như mock giả định" là SAI: `RoomEntity.name` (lib/cad/model.ts:860) đã là tên THẬT
  // ("PHÒNG KHÁCH"…, gán lúc `detectRooms` đọc từ nhãn TEXT gốc) — chỉ chưa được ĐỌC ở đây. Phòng
  // (type 'room') giờ hiện đúng tên thật; mọi loại entity khác vẫn dùng nhãn LOẠI như cũ (đúng —
  // chúng thật sự không có "tên", suy tên là bịa).
  // CHINH-5 (SPEC-PANEL-ROLLOUT §3 hàng "Lớp: Tường"): sub = CHẤM MÀU lớp + TÊN lớp (học Figma),
  // không nhãn "Lớp:", không lộ id thô (`l-wall`) như bản đầu.
  // Bug D4 (QA 19/08) — PHÒNG THỦ nơi đọc: chỉ đếm/hiện id CÒN SỐNG trong doc. Nguồn chính đã
  // chặn ở store (removeLayer lọc selection), nhưng mọi mutation tương lai làm chết id mà quên
  // dọn selection sẽ không còn dựng được Inspector ma "N đối tượng" trên bản vẽ rỗng nữa
  // (CadInspectorPages đã tự gate `!selected.length → null`, đây là gate cho VỎ AppShell + title).
  const aliveSelection = useMemo(() => {
    if (selection.length === 0) return selection;
    const ids = new Set(doc.entities.map((e) => e.id));
    const alive = selection.filter((id) => ids.has(id));
    return alive.length === selection.length ? selection : alive;
  }, [selection, doc.entities]);

  const { title, sub } = useMemo(() => {
    if (aliveSelection.length === 0) return { title: undefined, sub: undefined };
    if (aliveSelection.length > 1) return { title: tr(`${aliveSelection.length} đối tượng`, `${aliveSelection.length} objects`), sub: undefined };
    const e = doc.entities.find((x) => x.id === aliveSelection[0]);
    const layer = e ? doc.layers.find((l) => l.id === e.layer) : undefined;
    return {
      title: e ? (e.type === 'room' ? e.name : tr(entityTypeLabel(e.type), e.type)) : undefined,
      sub: layer ? (
        <span className="flex items-center gap-1.5" title={tr('Lớp', 'Layer')}>
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: layer.color }} />
          {layer.name}
        </span>
      ) : undefined,
    };
  }, [aliveSelection, doc.entities, doc.layers, tr]);

  return (
    <AppShell
      active="cad"
      statusBar={<StatusBar stage="concept" />}
      navigator={mode.navigator}
      navigatorAddLabel={tr('Lớp mới', 'New layer')}
      navigatorCollapsedLabel={tr('Lớp', 'Layers')}
      onNavigatorAdd={addLayer}
      /* CHINH-3 (SPEC-PANEL-ROLLOUT-IDF §2c): ruột Inspector = dải trang Rhino + rollout,
         thay SelectionInfoPanel chồng 4 box dọc. Gate chỉ-hiện-khi-chọn giữ nguyên. */
      inspector={aliveSelection.length > 0 ? <CadInspectorPages /> : undefined}
      inspectorTitle={title}
      inspectorSub={sub}
      onCloseInspector={aliveSelection.length > 0 ? clearSelection : undefined}
      /* Ổ ⑤ Toolbelt — dock kính gộp CadToolbar + CadTouchDock, hết đè Inspector (việc a
         hàng đợi CHINH, xem đầu CadToolbelt.tsx). */
      toolbelt={<CadToolbelt />}
    >
      <StageEnter>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + CadEditor. 1 sheet ⇒ y hệt bản cũ. */}
        {mode.canvas}
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
