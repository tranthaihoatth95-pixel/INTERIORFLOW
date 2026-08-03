'use client';

/**
 * components/studio/AppShell.tsx — SÁU Ổ CẮM CỐ ĐỊNH (VIỆC 2, `docs/SPEC-HA-TANG-UI-IF.md`
 * Trụ 1). Thay `StageShell` cho CẢ 5 màn (CAD/Render/Present/`/files`/`/settings` — Hoà 03/08:
 * "rail capsule nổi phải biến mất khỏi CẢ app, không chỉ StageShell, không thì có HAI KIỂU
 * VỎ"). Giữ nguyên NHÓM API bên ngoài của `StageShell` cũ (active/children/statusBar/toolbar/
 * bottomExtra) nhưng thay `LeftRail` icon rail bằng `Navigator` 214px + `AppLogoMenu`, thêm ổ
 * Toolbelt riêng.
 *
 * ① Header 42px — AppChrome (logo nay mở AppLogoMenu thay vì rail).
 * ② Navigator 214px — nội dung do chặng truyền qua prop `navigator`.
 * ③ Stage — children, chiếm hết chỗ còn lại.
 * ④ Inspector 236px — CHỈ render khung khi có `inspector` truyền vào (không CSS-ẩn) + animation
 *   ramp .96→1.008→1 (`docs/SPEC-CAD-SHELL-V3.md` §4) + nút ✕ đóng (gọi `onCloseInspector`).
 * ⑤ Toolbelt — dock kính nổi giữa-dưới Stage, chặng tự truyền nội dung (đã có class `.mat-panel`
 *   từ trong dock, AppShell chỉ định vị + z-index).
 * ⑥ Status 26px — statusBar slot (Vitals sống trong đó, không đổi).
 *
 * Vị trí/kích thước 6 ổ KHÔNG đổi khi đổi mode trong cùng chặng — chỉ ruột (children của từng
 * slot) đổi, đúng Trụ 1 "ổ cố định, ruột thay đổi".
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { AppChrome, type AppChromeActive } from '@/components/studio/AppChrome';
import { Navigator } from '@/components/studio/Navigator';
import { AppCommandPalette } from '@/components/studio/AppCommandPalette';
import { Dashboard } from '@/components/Dashboard';
import { FlowsPanel } from '@/components/FlowsPanel';
import { LibrarySheet } from '@/components/library/LibrarySheet';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import type { StageKey } from '@/lib/library/types';
import { tweenBase } from '@/lib/motion';

const INSPECTOR_WIDTH = 236;

interface Props {
  active: AppChromeActive;
  children: ReactNode;
  /** Ổ ② — nội dung Navigator (vd `<LayerPanel/>`), khung/đáy do `AppShell` lo qua `Navigator`
   * component riêng (chặng chỉ truyền phần list + 2 handler add/library). */
  navigator: ReactNode;
  navigatorAddLabel: string;
  /** Nhãn dải mỏng khi Navigator thu gọn (§2f SPEC-PANEL-ROLLOUT-IDF) — "Lớp"/"Khối"/"Trang"… */
  navigatorCollapsedLabel?: string;
  onNavigatorAdd?: () => void;
  /** Ghi đè hành vi nút "Thư viện" đáy Navigator — MẶC ĐỊNH (không truyền) mở `LibrarySheet`
   * (Hoà chốt 03/08 "Thư viện là MỘT nơi duy nhất, và nó là sheet" — `a73c658` trên g4).
   * Chỉ truyền khi có lý do thật; đừng truyền `router.push('/library')` (route đó nay chỉ là
   * redirect mở sheet). */
  onOpenLibrary?: () => void;
  /** Ổ ④ — CHỈ truyền khi có vật được chọn; AppShell tự ẩn hẳn khung khi `undefined`/`null`. */
  inspector?: ReactNode;
  inspectorTitle?: string;
  inspectorSub?: ReactNode;
  onCloseInspector?: () => void;
  /** Ổ ⑤ — dock kính nổi, AppShell định vị absolute giữa-dưới Stage. */
  toolbelt?: ReactNode;
  /** Ổ ⑥ */
  statusBar?: ReactNode;
  /** Phần thêm cạnh statusBar (bottomExtra cũ, giữ tương thích StageShell). */
  bottomExtra?: ReactNode;
  /** Toolbar riêng chặng trong luồng bình thường TRƯỚC children (giữ tương thích API
   * `StageShell` cũ — vd `RenderDocBar` của Render). Không phải ổ Toolbelt (dock kính nổi). */
  toolbar?: ReactNode;
}

export function AppShell({
  active,
  children,
  navigator,
  navigatorAddLabel,
  navigatorCollapsedLabel,
  onNavigatorAdd,
  onOpenLibrary,
  inspector,
  inspectorTitle,
  inspectorSub,
  onCloseInspector,
  toolbelt,
  statusBar,
  bottomExtra,
  toolbar,
}: Props) {
  // AppChromeActive → StageKey của Thư viện: photo không có kệ riêng → dùng kệ chặng dựng ảnh
  // (cùng mapping bản g4 cũ đặt trong StageShell trước khi file đó bị xoá).
  const libStage: StageKey = active === 'cad' ? 'cad' : active === 'present' ? 'present' : 'render';
  // Hoà 04/08 (BÁC bản Render list-chữ, SO-KIEM-TONG §0d) — chặng Render gắn NGUYÊN
  // `NodeLibraryPanel` (card icon+mô tả+badge cr) làm ruột Navigator, cần THỞ hơn 214 mặc định.
  const navigatorWidth = active === 'render' ? 280 : undefined;
  const openLibrary = onOpenLibrary ?? (() => openLibrarySheet({ stage: libStage }));

  /* CHINH-4 — phím tắt panel toàn app (`SPEC-PANEL-ROLLOUT-IDF` §4a):
   *   B = thu/mở Navigator · I = thu/mở Inspector · ⌘\ = ẩn/hiện CẢ HAI (zen).
   * Luật va phím (suy từ §4e đã chốt cho L): chặng Vẽ có type-anywhere nuốt MỌI chữ trần
   * (`CadCanvas.tsx` — gõ B là bắt đầu lệnh BLOCK…), nên ở CAD hai phím này cần ⇧ (⇧B/⇧I),
   * chặng khác phím trần. Nghe ở DOCUMENT CAPTURE + stopPropagation khi ăn phím — chạy TRƯỚC
   * listener window-bubble của CadCanvas, không seed nhầm chữ vào ô lệnh. Guard gõ chữ
   * (INPUT/TEXTAREA/contentEditable) như mọi hotkey khác trong app. */
  const [inspectorHidden, setInspectorHidden] = useState(false);
  const zenRef = useRef(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;
      // ⌘\ — ẩn cả hai panel, bấm lại hiện lại (deterministic qua detail.set).
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        e.stopPropagation();
        const zen = !zenRef.current;
        zenRef.current = zen;
        window.dispatchEvent(new CustomEvent('if:navigator-toggle', { detail: { set: zen } }));
        setInspectorHidden(zen);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k !== 'b' && k !== 'i') return;
      // CAD: chỉ ăn khi có ⇧ (phím trần thuộc type-anywhere gõ lệnh — §0c luật 2); chặng khác:
      // chỉ phím trần (⇧ để dành tổ hợp khác).
      const needShift = active === 'cad';
      if (e.shiftKey !== needShift) return;
      e.preventDefault();
      e.stopPropagation();
      if (k === 'b') window.dispatchEvent(new CustomEvent('if:navigator-toggle', { detail: {} }));
      else setInspectorHidden((h) => !h);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [active]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AppChrome active={active} logoMenu />
      <div className="relative flex min-h-0 flex-1">
        <Navigator addLabel={navigatorAddLabel} collapsedLabel={navigatorCollapsedLabel} onAdd={onNavigatorAdd} onOpenLibrary={openLibrary} width={navigatorWidth} shiftHotkeys={active === 'cad'}>
          {navigator}
        </Navigator>
        <div className="relative flex min-w-0 flex-1 flex-col">
          {toolbar}
          {children}
          {toolbelt && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[6] flex justify-center">
              {/* maxWidth chặn dock rộng hơn Stage (bug cũ "toolbar tràn phải đè Inspector" là
                  do pill tự đo theo 100vw — Stage mới là khung đúng, Inspector là cột riêng). */}
              <div className="pointer-events-auto" style={{ maxWidth: 'calc(100% - 24px)' }}>{toolbelt}</div>
            </div>
          )}
        </div>
        <InspectorSlot title={inspectorTitle} sub={inspectorSub} onClose={onCloseInspector} hotkey={active === 'cad' ? '⇧I' : 'I'}>
          {inspectorHidden ? undefined : inspector}
        </InspectorSlot>
      </div>
      {bottomExtra}
      {statusBar}
      {/* Ổ overlay dùng chung — tự gate state bên trong, mount 1 lần cho CẢ 5 màn. */}
      <Dashboard />
      <FlowsPanel />
      {/* Thư viện = sheet, NƠI DUY NHẤT (Hoà chốt 03/08, `a73c658` — trang /library chỉ còn
          redirect). Tự gate qua `openLibrarySheet()`/phím L/Escape (use-library-sheet.ts). */}
      <LibrarySheet stage={libStage} />
      {/* Palette ⌘K ĐA MÀN (Trụ 2 mặt hiện `palette`) — nối sổ lệnh `lib/commands/registry.ts`.
          Palette cũ `components/CommandPalette.tsx` cần ReactFlow nên chỉ sống ở Home; cái này
          không phụ thuộc ReactFlow nên phủ cả 5 màn dùng AppShell. */}
      <AppCommandPalette active={active} />
    </div>
  );
}

function InspectorSlot({
  children,
  title,
  sub,
  onClose,
  hotkey,
}: {
  children?: ReactNode;
  title?: string;
  sub?: ReactNode;
  onClose?: () => void;
  /** Phím ẩn/hiện Inspector của chặng đang mở (CAD ⇧I, chặng khác I) — tooltip phải ghi đúng
   * phím người dùng bấm được, §0c mảng 1. */
  hotkey?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {children && (
        <motion.aside
          key="inspector"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: [0.96, 1.008, 1] }}
          exit={{ opacity: 0 }}
          transition={reduceMotion ? { duration: 0.1 } : tweenBase}
          style={{ width: INSPECTOR_WIDTH, transformOrigin: 'right center' }}
          className="flex min-h-0 shrink-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--panel)]"
        >
          {(title || onClose) && (
            <div className="flex h-[34px] shrink-0 items-center gap-1.5 border-b border-[var(--mat-hairline)] px-3">
              {title && <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-[var(--t1)]">{title}</h2>}
              {sub && <span className="shrink-0 text-[11px] text-[var(--t3)]">{sub}</span>}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title={hotkey ? `Đóng — ẩn/hiện bằng ${hotkey}` : 'Đóng'}
                  className="ml-auto grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] text-[var(--t4)] transition-colors duration-[120ms] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
