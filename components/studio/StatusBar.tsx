'use client';

/**
 * components/studio/StatusBar.tsx — thanh trạng thái DÙNG CHUNG đáy màn hình, cả 3 chặng
 * (CAD · Render · Present) — VIỆC A, 28/07 (Hoà giao sau khi ①②③ NT-gateway xong).
 *
 * Gom chỉ báo trước đây rải rác mỗi chặng một kiểu vào MỘT chỗ, 3 vùng cố định:
 *   TRÁI  — ngữ cảnh: tên dự án (flowName, lib/store.ts — DÙNG CHUNG cả 3 chặng) · toạ độ
 *           con trỏ (chỉ CAD, lib/cad/live-status.ts, đã throttle 100ms).
 *   GIỮA  — VITALS, điểm gọi CHÍNH THỨC: rê chuột vào → nở ô nhập (hover-to-expand, 150ms,
 *           kiểu Siri macOS) · bấm (hoặc Enter) → mở popover đầy đủ (VitalsGesturePanel, neo
 *           'statusbar', xổ LÊN). ⌘J/Ctrl+J (đăng ký ở StageSwitcher.tsx) cũng neo vào đây.
 *           Cảm ứng/di động: GIỮ NGUYÊN cử chỉ kéo từ vùng 3 chặng (StageSwitcher, không sửa).
 *   PHẢI  — trạng thái hệ thống: hàng đợi render (chỉ Render, lib/store.ts flowRuns — 2.2.86,
 *           30/07: đơn vị là FlowRun/lượt chạy, không phải Job/node lẻ) · đang lưu/
 *           đã lưu (CAD + Present, lib/save-status.ts — bám autosaver có sẵn) · số vi phạm quy
 *           chuẩn LẦN KIỂM GẦN NHẤT (chỉ CAD, lib/cad/live-status.ts — KHÔNG tự chạy nền, giữ
 *           đúng "chỉ đọc & đề xuất, chạy tay" của StandardsPanel).
 *
 * `hidden` (VIỆC A3): true khi đang trình chiếu toàn màn hình (Present `SlidePlayer` qua
 * usePlayStatus, hoặc Render `PresentOverlay` qua `presentModeOpen`) → return null hẳn, không
 * chỉ ẩn thị giác (tránh vùng bấm ẩn dưới overlay).
 *
 * Chưa phủ: tên bản vẽ/slide đang mở (SheetTabBar giữ state cục bộ trong CadSheets/
 * PresentSheets, chưa nâng lên store dùng chung) — để dành, ghi ở STATUS.md nợ kỹ thuật.
 * Dashboard (ProjectSelect.tsx/Gallery) CHƯA mount StatusBar này — màn đó đã có thanh Vitals
 * luôn-hiện riêng (VitalsChatBubble), gộp 2 kiến trúc khác nhau ngoài phạm vi đợt này.
 */

import { useMemo } from 'react';
import { Loader2, Save, ShieldAlert, HardDriveDownload, Eye, Magnet } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { getDefinition } from '@/lib/nodes/registry';
import { countBoardNodes, countMistypedEdges } from '@/lib/nodes/edge-validity';
import { useCadLiveStatus } from '@/lib/cad/live-status';
import { useCadStore, type SnapSettings } from '@/lib/cad/store';
import { useStageMode } from '@/lib/stage-mode';
import { useSaveStatus } from '@/lib/save-status';
import { useProjectPresence } from '@/lib/project-presence-ui';
import type { Phase } from '@/lib/phases';
import Tooltip from '@/components/ui/Tooltip';

interface Props {
  stage: Phase;
  hidden?: boolean;
}

/** VIỆC 2① (`docs/PHIEU-CODE-IF-DOT6-2026-08-03.md` NHÓM B, port `mocks/mock-2d-ky-thuat.html`
 * dòng "Bắt điểm: Đầu mút, Giữa cạnh") — nhãn Việt cho từng LOẠI điểm bắt (`SnapSettings`,
 * `lib/cad/store.ts`). Bỏ `enabled`/`grid` (2 công tắc, không phải "loại điểm"). Danh sách hiển
 * thị = danh sách THẬT đang bật (đọc `snap` sống từ store, không phải chuỗi tĩnh chép từ mock —
 * mock chỉ minh hoạ 2/9 loại, dữ liệu thật ở đây luôn khớp cấu hình snap hiện tại). */
const SNAP_KIND_LABEL: Record<keyof Omit<SnapSettings, 'enabled' | 'grid'>, string> = {
  endpoint: 'Đầu mút',
  midpoint: 'Giữa cạnh',
  center: 'Tâm',
  intersection: 'Giao điểm',
  quadrant: 'Góc phần tư',
  node: 'Node',
  nearest: 'Gần nhất',
  perpendicular: 'Vuông góc',
  tangent: 'Tiếp tuyến',
};

function activeSnapKindsLabel(snap: SnapSettings): string {
  const active = (Object.keys(SNAP_KIND_LABEL) as (keyof typeof SNAP_KIND_LABEL)[]).filter((k) => snap[k]);
  return active.length > 0 ? active.map((k) => SNAP_KIND_LABEL[k]).join(', ') : 'không loại nào';
}

/**
 * `SnapIndicator` (2D-STATUSBAR-DENSITY, phiên 20/08 tiếp) — thay dòng chữ liệt kê đầy đủ
 * ("Bắt điểm: Đầu mút, Giữa cạnh, …") vốn tràn/cụt ở Chuyên bằng MỘT badge gọn, mở đủ danh
 * sách qua `Tooltip` sẵn có (hover/focus, [Đ2] — không dựng cơ chế hiện/ẩn thứ hai).
 *
 * Sơ phác (`dense=false`): chỉ 1 chấm nam châm mờ (`--t4`) — "barely register", đúng luật
 * nhẹ hơn của mode này. Chuyên (`dense=true`): icon + SỐ LƯỢNG (tabular-nums, `--t3`) — đặc
 * hơn nhưng vẫn 1 cụm ngắn, không phải chuỗi phẩy tràn dòng. Cả hai bấm/trỏ vào đều mở
 * `Tooltip` liệt kê đủ tên — không mất thông tin, chỉ đổi MẬT ĐỘ mặc định.
 */
function SnapIndicator({ snap, dense }: { snap: SnapSettings; dense: boolean }) {
  if (!snap.enabled) {
    return (
      <span style={{ whiteSpace: 'nowrap', color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Magnet size={14} style={{ opacity: 0.5 }} />
        {dense && 'Bắt điểm: tắt'}
      </span>
    );
  }
  const activeKeys = (Object.keys(SNAP_KIND_LABEL) as (keyof typeof SNAP_KIND_LABEL)[]).filter((k) => snap[k]);
  return (
    <Tooltip
      label="Bắt điểm"
      desc={activeKeys.length > 0 ? activeSnapKindsLabel(snap) : 'không loại nào'}
      side="top"
    >
      <span
        tabIndex={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
          color: dense ? 'var(--t3)' : 'var(--t4)',
          cursor: 'default',
          outline: 'none',
        }}
      >
        <Magnet size={dense ? 12 : 11} />
        {dense && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{activeKeys.length}</span>}
      </span>
    </Tooltip>
  );
}


/** 2.1.8.n — "HH:MM" giờ lưu gần nhất, không giây (không cần chính xác tới giây cho mục đích
 * xác nhận thị giác "đã lưu chưa"). */
function formatHHMM(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function StatusBar({ stage, hidden }: Props) {
  const tr = useT();
  const flowName = useFlowStore((s) => s.flowName);
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const boardNodes = useFlowStore((s) => s.nodes);
  const boardEdges = useFlowStore((s) => s.edges);
  const boardGroups = useFlowStore((s) => s.groups);
  const cursorWorld = useCadLiveStatus((s) => s.cursorWorld);
  const lastViolationCount = useCadLiveStatus((s) => s.lastViolationCount);
  const snap = useCadStore((s) => s.snap);
  const cadMode = useCadStore((s) => s.cadMode);
  const saveState = useSaveStatus((s) => s.status);
  const lastSavedAt = useSaveStatus((s) => s.lastSavedAt);
  const diskStatus = useSaveStatus((s) => s.diskStatus);
  const diskMessage = useSaveStatus((s) => s.diskMessage);
  const otherTabOpen = useProjectPresence((s) => s.otherTabOpen);

  // 20/08 (COHERENCE-SHELL) — ĐÃ GỠ toàn bộ state của chip Vitals (`panelOpen`/`openVitals`/
  // `expanded`/`draft`/hover-timer/`wrapRef`/`inputRef`/`submit`). Lý do đầy đủ ở khối chú
  // thích "GIỮA" trong phần dựng hình bên dưới: chip trỏ vào một panel không còn mount từ
  // 17/08. Giữ state lại là để một cỗ máy chạy không cho ai cả.

  // 2.2.86 (30/07) — đếm theo FlowRun (lượt chạy), khớp badge "Việc" ở AppChrome.tsx (Luật Đồng
  // Bộ #6, tránh 2 mặt tiền đếm khác đơn vị — trước đếm Job/node lẻ, ra số khác badge trên bar).
  const jobsActive = stage === 'render' ? flowRuns.filter((r) => r.status === 'running' || r.status === 'queued').length : 0;

  /* ③ `docs/mocks/Bảng nút.dc.html` — "N nút · M nối sai" (mock: sidebar đáy "7 nút · 1 nối sai"
     + footer nhắc lại bằng chữ đỏ). Chỉ chặng 3D (bảng nút) mới có khái niệm này; 2 chặng kia
     dùng `nodes`/`edges` cho việc khác nên không hiện. Đếm bằng `lib/nodes/edge-validity.ts`
     (hàm thuần, có test) — CÙNG luật so kiểu với `isValidConnection` ở FlowCanvas, không viết
     luật thứ hai. `useMemo` vì `nodes` đổi tham chiếu mỗi lần kéo node. */
  // Chặng 'render' có HAI mode shell (`lib/stage-mode.ts`): 'render' = bảng nút · 'model3d' =
  // Vẽ 3D. Bảng nút mới có khái niệm "nút / nối sai" — ở Vẽ 3D con số này là dữ liệu của màn
  // khác, hiện lên là nói dối ngữ cảnh. `useStageMode` gọi vô điều kiện (Rules of Hooks); ở
  // chặng CAD nó chỉ đọc thêm 1 field store, không ảnh hưởng gì.
  const renderStageMode = useStageMode('render').mode;
  const showBoardCount = stage === 'render' && renderStageMode === 'render';
  // `boardGroups` cần cho phép đếm: nút tổng THU GỌN không có node trong `nodes[]` (mặt nút vẽ từ
  // `groups[]`, xem `GroupOverlay`), node con thì mang cờ `hidden` — xem `countBoardNodes`.
  const nodeCount = useMemo(
    () => (showBoardCount ? countBoardNodes(boardNodes, boardGroups) : 0),
    [showBoardCount, boardNodes, boardGroups],
  );
  const mistypedCount = useMemo(
    () => (showBoardCount ? countMistypedEdges(boardNodes, boardEdges, getDefinition) : 0),
    [showBoardCount, boardNodes, boardEdges],
  );
  const showSave = (stage === 'concept' || stage === 'present') && saveState !== 'idle';
  const showStandards = stage === 'concept' && lastViolationCount !== null;
  // B4 (4.1.d) — 'off' (chưa bật lưu trữ dự án) KHÔNG hiện gì, đúng thiết kế opt-in.
  const showDisk = (stage === 'concept' || stage === 'present') && diskStatus !== 'off';

  if (hidden) return null;

  return (
    <div
      style={{
        height: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--panel)',
        fontSize: 11.5,
        color: 'var(--t3)',
        position: 'relative',
        zIndex: 20,
      }}
    >
      {/* TRÁI — ngữ cảnh. A2 (DS-A 14/08): `overflow:hidden` — con nowrap không được tràn ra
          ngoài cánh rồi chui xuống dưới pill Vitals ở khổ hẹp (bug "ĐãVlialsúc" 732px). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 260,
            color: 'var(--t2)',
          }}
          title={flowName}
        >
          {flowName}
        </span>
        {stage === 'concept' && cursorWorld && (
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            X {Math.round(cursorWorld.x)}&nbsp;&nbsp;Y {Math.round(cursorWorld.y)} mm
          </span>
        )}
        {stage === 'concept' && <SnapIndicator snap={snap} dense={cadMode !== 'sketch'} />}
      </div>

      {/* GIỮA — 🔴 ĐÃ GỠ CHIP VITALS (20/08, phiếu COHERENCE-SHELL).
          Nó là **nút bấm-không-ra-gì**, đo được: chip gọi `useVitalsUi.open()`, và bên NHẬN
          trạng thái đó là `VitalsGesturePanel` — mount duy nhất ở `StageSwitcher.tsx`, mà
          StageSwitcher đã bị gỡ khỏi header 17/08; nay `grep -rn "StageSwitcher" components app`
          = 0 nơi mount. Nghĩa là từ 17/08 tới nay, gõ câu hỏi vào ô này rồi Enter thì câu hỏi
          ĐI VÀO HƯ KHÔNG. Phím ⌘J cũng đăng ký trong StageSwitcher nên đã chết cùng lúc — không
          phải mất ở lần gỡ này.
          Vitals nay có ĐÚNG MỘT chỗ đứng (chốt 16/08 — "mỗi màn ĐÚNG MỘT Vitals"). Giữ chip lại
          là để hai lối vào trên một màn mà một trong hai không chạy.
          🔴 SỬA 02/09: chỗ đứng đó TỪNG là khẩu độ mép trên `VitalsAperture.tsx`; hôm nay khẩu
          độ thôi mount (V-3a) và lối vào chuyển sang `VitalsPill` ở cụm tìm kiếm của Home.
          Lý do gỡ chip **không đổi một chữ** — nó vẫn là nút bấm-không-ra-gì. Đừng đọc lần đổi
          chỗ này thành lời mời hồi sinh chip.
          CÒN NỢ, KHÔNG làm ở phiếu này: ô GÕ NHANH (gõ thẳng ở đáy, không phải mở panel rồi mới
          gõ) là cơ chế RIÊNG và đáng giá. Muốn cứu thì cấp cho `VitalsChatSurface` một câu mở
          đầu rồi nối lại — đừng mount lại panel cũ. */}

      {/* PHẢI — trạng thái hệ thống. A2 (DS-A 14/08): `overflow:hidden` cùng lý do cánh trái —
          justify flex-end làm nội dung thừa tràn về PHÍA TRÁI, đè lên pill Vitals; mỗi mục con
          tự ellipsis (minWidth:0 + overflow hidden) thay vì đứng nguyên chiều rộng nowrap. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {showBoardCount && (
          <span
            style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
            title={
              mistypedCount > 0
                ? tr(
                    'Dây nối hai đầu khác kiểu dữ liệu — dây đó vẽ đỏ đứt đoạn trên bảng, xoá rồi nối lại đúng cổng',
                    'These links join two different data types — they are drawn red and dashed on the board; delete and reconnect to the right port',
                  )
                : tr('Số khối trên bảng nút (không kể giấy nhớ)', 'Blocks on the node board (sticky notes not counted)')
            }
          >
            {tr(`${nodeCount} nút`, `${nodeCount} nodes`)}{' '}
            <span style={{ color: mistypedCount > 0 ? 'var(--danger)' : 'var(--t4)' }}>
              · {tr(`${mistypedCount} nối sai`, `${mistypedCount} bad links`)}
            </span>
          </span>
        )}
        {stage === 'render' && jobsActive > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Loader2 size={14} className="animate-spin" /> {jobsActive} đang render
          </span>
        )}
        {showSave && (
          // 2.1.8.n (31/07) — thêm giờ lưu gần nhất ("Đã lưu lúc HH:MM"), kiến trúc sư quen
          // AutoCAD không tin autosave nếu không đọc được bằng mắt. Cỡ chữ/line-height ghi đè
          // riêng (7.1.23 ⑤c, ≥12px/≥1.5) — CHỈ cho dòng này, KHÔNG đổi `fontSize:11.5` chung
          // của cả StatusBar (thuộc đợt sửa token 7.1.23 riêng, đang chờ Hoà gật, ngoài phạm vi
          // việc gấp này).
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 12, lineHeight: 1.5, minWidth: 0 }}>
            <Save size={14} style={{ flexShrink: 0 }} />
            {/* A2 — khổ hẹp: chữ tự cụt bằng ellipsis thay vì tràn đè pill Vitals */}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {saveState === 'saving' ? 'Đang lưu…' : lastSavedAt ? `Đã lưu lúc ${formatHHMM(lastSavedAt)}` : 'Đã lưu'}
            </span>
          </span>
        )}
        {showDisk && (
          // B4 (4.1.d) — VIỆC THỨ HAI, tách khỏi `showSave` ở trên (bài học sự cố 31/07: cache
          // và đĩa là 2 việc, 2 trạng thái). 'error' KHÔNG tự tắt, đỏ để không lướt qua được.
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              fontSize: 12,
              lineHeight: 1.5,
              color: diskStatus === 'error' ? '#c0392b' : 'var(--t3)',
            }}
            title={diskMessage ?? undefined}
          >
            <HardDriveDownload size={14} />
            {diskStatus === 'syncing' ? 'Đang ghi đĩa…' : diskStatus === 'error' ? 'Chưa ghi ra đĩa' : 'Đĩa đồng bộ'}
          </span>
        )}
        {otherTabOpen && (stage === 'concept' || stage === 'present') && (
          // ④ — CHỈ cảnh báo, không khoá/gộp (phạm vi B4 đã chốt với Hoà).
          // A6 (DS-A 14/08, luật LightState): đây là THÔNG TIN (dự án đang mở thêm ở tab khác),
          // không phải nguy hiểm → màu trung tính --t3 + icon mắt, KHÔNG đỏ. Đỏ chỉ dành cho
          // xung đột ghi thật — hiện chưa có state đó (chỉ có cờ `otherTabOpen`), khi nào có
          // thì phân nhánh màu ở đây.
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', color: 'var(--t3)', minWidth: 0 }}
            title="Dự án này đang mở ở tab/cửa sổ khác — sửa đồng thời có thể ghi đè lẫn nhau"
          >
            <Eye size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Đang mở nơi khác</span>
          </span>
        )}
        {showStandards && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              color: (lastViolationCount ?? 0) > 0 ? '#c0392b' : 'var(--t3)',
            }}
            title="Số vi phạm quy chuẩn — lần kiểm gần nhất (Kiểm chuẩn, chạy tay)"
          >
            <ShieldAlert size={14} />
            {lastViolationCount} lỗi
          </span>
        )}
      </div>
    </div>
  );
}
