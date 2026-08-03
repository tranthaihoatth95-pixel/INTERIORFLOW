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

import { useEffect, useRef, useState } from 'react';
import { Loader2, Save, ShieldAlert, HardDriveDownload, Users } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useCadLiveStatus } from '@/lib/cad/live-status';
import { useCadStore, type SnapSettings } from '@/lib/cad/store';
import { useSaveStatus } from '@/lib/save-status';
import { useProjectPresence } from '@/lib/project-presence-ui';
import { useVitalsUi } from '@/lib/vitals-ui';
import VitalsIcon from './VitalsIcon';
import type { Phase } from '@/lib/phases';

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

const HOVER_DELAY_MS = 150;

/** 2.1.8.n — "HH:MM" giờ lưu gần nhất, không giây (không cần chính xác tới giây cho mục đích
 * xác nhận thị giác "đã lưu chưa"). */
function formatHHMM(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function StatusBar({ stage, hidden }: Props) {
  const flowName = useFlowStore((s) => s.flowName);
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const cursorWorld = useCadLiveStatus((s) => s.cursorWorld);
  const lastViolationCount = useCadLiveStatus((s) => s.lastViolationCount);
  const snap = useCadStore((s) => s.snap);
  const saveState = useSaveStatus((s) => s.status);
  const lastSavedAt = useSaveStatus((s) => s.lastSavedAt);
  const diskStatus = useSaveStatus((s) => s.diskStatus);
  const diskMessage = useSaveStatus((s) => s.diskMessage);
  const otherTabOpen = useProjectPresence((s) => s.otherTabOpen);

  // 05/08 — panel Vitals nay mount DUY NHẤT ở `StageSwitcher.tsx` (ổ ① header). Ở đây chỉ ĐỌC
  // `panelOpen` để ô gõ nhanh không tự co lại khi panel đang mở, và gọi `open()` khi người dùng
  // gửi câu hỏi. KHÔNG mount panel (xem lib/vitals-ui.ts + SO-KIEM-TONG §1).
  const panelOpen = useVitalsUi((s) => s.panelOpen);
  const openVitals = useVitalsUi((s) => s.open);

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Panel đã mở (vd qua ⌘J) → vùng giữa cũng coi như "đang nở", tránh nhấp nháy co lại rồi mở.
  useEffect(() => {
    if (panelOpen) setExpanded(true);
  }, [panelOpen]);

  const onZoneEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setExpanded(true), HOVER_DELAY_MS);
  };
  const onZoneLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (panelOpen) return; // popover đầy đủ đang mở — đừng co ô gọn lại dưới nó
    if (document.activeElement === inputRef.current) return; // đang gõ — đừng co khi rê chuột ra ngoài
    hoverTimer.current = setTimeout(() => setExpanded(false), HOVER_DELAY_MS);
  };

  const submit = () => {
    const text = draft.trim();
    setDraft('');
    openVitals(text, text.length > 0);
  };

  // 2.2.86 (30/07) — đếm theo FlowRun (lượt chạy), khớp badge "Việc" ở AppChrome.tsx (Luật Đồng
  // Bộ #6, tránh 2 mặt tiền đếm khác đơn vị — trước đếm Job/node lẻ, ra số khác badge trên bar).
  const jobsActive = stage === 'render' ? flowRuns.filter((r) => r.status === 'running' || r.status === 'queued').length : 0;
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
      {/* TRÁI — ngữ cảnh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
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
        {stage === 'concept' && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Cấu hình bắt điểm đang bật — đổi ở nút nam châm trên Toolbelt">
            {snap.enabled ? `Bắt điểm: ${activeSnapKindsLabel(snap)}` : 'Bắt điểm: tắt'}
          </span>
        )}
      </div>

      {/* GIỮA — Vitals, điểm gọi chính thức */}
      <div
        ref={wrapRef}
        onMouseEnter={onZoneEnter}
        onMouseLeave={onZoneLeave}
        style={{ position: 'relative', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Vitals — hỏi trợ lý (⌘J / Ctrl+J)"
          title="Vitals — hỏi trợ lý (⌘J / Ctrl+J)"
          onClick={() => {
            if (!expanded) setExpanded(true);
            inputRef.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            height: 24,
            padding: expanded ? '0 4px 0 10px' : '0 12px',
            borderRadius: 999,
            // PHIẾU ĐỢT 7 A2 — chip chìm hẳn vào StatusBar (viền `--border` mờ + nền trong suốt lúc
            // rảnh), không ai thấy đây là điểm gọi CHÍNH THỨC. Viền tím cố định + nền tím nhạt lúc
            // rảnh cho nó nổi lên khỏi thanh trạng thái; lúc nở thì đổi sang `--field` (đủ tương
            // phản cho input, không lẫn với 2 vùng chữ khác trên bar).
            border: '1px solid var(--accent)',
            background: expanded ? 'var(--field)' : 'var(--accent-soft)',
            color: 'var(--accent)',
            cursor: 'pointer',
            width: expanded ? 280 : 92,
            transition: 'width .16s ease, padding .16s ease, background .16s ease',
            overflow: 'hidden',
          }}
        >
          <VitalsIcon size={14} />
          {expanded ? (
            <>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    submit();
                  }
                }}
                placeholder="Hỏi Vitals…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--t1)',
                  fontSize: 11.5,
                }}
              />
              <span style={{ fontSize: 9.5, color: 'var(--t4)', whiteSpace: 'nowrap', paddingRight: 4 }}>⌘J</span>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Vitals</span>
              {/* chấm sống — tái dùng đúng cỗ máy `vitals-state-dot--idle` (VitalsStateBadge.tsx),
                  chỉ ghi đè nhịp thở 2s theo brief thay vì 4.4s mặc định; reduced-motion đã tắt
                  animation qua class này ở globals.css nên không cần xử lý riêng ở đây. */}
              <span
                className="vitals-state-dot vitals-state-dot--idle"
                style={{ width: 6, height: 6, animationDuration: '2s' }}
                aria-hidden="true"
              />
            </>
          )}
        </div>

        {/* 05/08 — ĐÃ GỠ `<VitalsGesturePanel>` khỏi đây (Hoà chốt: giữ MỘT bản ở header).
            Panel mount duy nhất tại `StageSwitcher.tsx`; ô gõ nhanh trên đây gọi `openVitals()`
            và panel ở header nhận `initialInput`/`autoSend`. Ô gõ + hover-nở kiểu Siri GIỮ
            NGUYÊN — đó là cơ chế riêng (gõ thẳng, không phải mở panel rồi mới gõ), không phải
            bản sao của panel. */}
      </div>

      {/* PHẢI — trạng thái hệ thống */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', flex: 1, minWidth: 0 }}>
        {stage === 'render' && jobsActive > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Loader2 size={12} className="animate-spin" /> {jobsActive} đang render
          </span>
        )}
        {showSave && (
          // 2.1.8.n (31/07) — thêm giờ lưu gần nhất ("Đã lưu lúc HH:MM"), kiến trúc sư quen
          // AutoCAD không tin autosave nếu không đọc được bằng mắt. Cỡ chữ/line-height ghi đè
          // riêng (7.1.23 ⑤c, ≥12px/≥1.5) — CHỈ cho dòng này, KHÔNG đổi `fontSize:11.5` chung
          // của cả StatusBar (thuộc đợt sửa token 7.1.23 riêng, đang chờ Hoà gật, ngoài phạm vi
          // việc gấp này).
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', fontSize: 12, lineHeight: 1.5 }}>
            <Save size={12} />
            {saveState === 'saving' ? 'Đang lưu…' : lastSavedAt ? `Đã lưu lúc ${formatHHMM(lastSavedAt)}` : 'Đã lưu'}
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
            <HardDriveDownload size={12} />
            {diskStatus === 'syncing' ? 'Đang ghi đĩa…' : diskStatus === 'error' ? 'Chưa ghi ra đĩa' : 'Đĩa đồng bộ'}
          </span>
        )}
        {otherTabOpen && (stage === 'concept' || stage === 'present') && (
          // ④ — CHỈ cảnh báo, không khoá/gộp (phạm vi B4 đã chốt với Hoà).
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', color: '#c0392b' }}
            title="Dự án này đang mở ở tab/cửa sổ khác — sửa đồng thời có thể ghi đè lẫn nhau"
          >
            <Users size={12} />
            Đang mở nơi khác
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
            <ShieldAlert size={12} />
            {lastViolationCount} lỗi
          </span>
        )}
      </div>
    </div>
  );
}
