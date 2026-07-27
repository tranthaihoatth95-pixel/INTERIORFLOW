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
 *   PHẢI  — trạng thái hệ thống: hàng đợi render (chỉ Render, lib/store.ts jobs) · đang lưu/
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
import { Loader2, Save, ShieldAlert } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useCadLiveStatus } from '@/lib/cad/live-status';
import { useSaveStatus } from '@/lib/save-status';
import { useVitalsUi } from '@/lib/vitals-ui';
import VitalsGesturePanel from './VitalsGesture';
import VitalsIcon from './VitalsIcon';
import type { Phase } from '@/lib/phases';

interface Props {
  stage: Phase;
  hidden?: boolean;
}

const HOVER_DELAY_MS = 150;

export default function StatusBar({ stage, hidden }: Props) {
  const flowName = useFlowStore((s) => s.flowName);
  const jobs = useFlowStore((s) => s.jobs);
  const cursorWorld = useCadLiveStatus((s) => s.cursorWorld);
  const lastViolationCount = useCadLiveStatus((s) => s.lastViolationCount);
  const saveState = useSaveStatus((s) => s.status);

  const panelOpen = useVitalsUi((s) => s.panelOpen && s.anchor === 'statusbar');
  const initialInput = useVitalsUi((s) => s.initialInput);
  const autoSend = useVitalsUi((s) => s.autoSend);
  const openVitals = useVitalsUi((s) => s.open);
  const closeVitals = useVitalsUi((s) => s.close);
  const consumeInitial = useVitalsUi((s) => s.consumeInitial);

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
    openVitals('statusbar', text, text.length > 0);
  };

  const jobsActive = stage === 'render' ? jobs.filter((j) => j.status === 'running' || j.status === 'queued').length : 0;
  const showSave = (stage === 'concept' || stage === 'present') && saveState !== 'idle';
  const showStandards = stage === 'concept' && lastViolationCount !== null;

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
            border: '1px solid var(--border)',
            background: expanded ? 'var(--field)' : 'transparent',
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
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>Vitals</span>
          )}
        </div>

        <VitalsGesturePanel
          originPx={null}
          open={panelOpen}
          direction="up"
          stage={stage}
          initialInput={initialInput}
          autoSend={autoSend}
          onConsumeInitial={consumeInitial}
          onClose={() => {
            closeVitals();
            setExpanded(false);
          }}
        />
      </div>

      {/* PHẢI — trạng thái hệ thống */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', flex: 1, minWidth: 0 }}>
        {stage === 'render' && jobsActive > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Loader2 size={12} className="animate-spin" /> {jobsActive} đang render
          </span>
        )}
        {showSave && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
            <Save size={12} />
            {saveState === 'saving' ? 'Đang lưu…' : 'Đã lưu'}
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
