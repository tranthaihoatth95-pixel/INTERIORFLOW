'use client';

/**
 * components/print/ExportPdfDialog.tsx — Màn 7. Port nguyên văn `docs/mocks/HopXuatPDF.dc.html`.
 *
 * Hộp thoại xuất PDF: header (icon + tiêu đề "Xuất PDF — {n} tờ" + nút đóng) · body grid
 * `1fr 258px` (trái = xem trước tờ giấy qua `PaperSheetFrame variant="preview"`, phải = cột điều
 * khiển Khổ giấy/Tỉ lệ in/Trước khi xuất + 2 nút hành động).
 *
 * KHÔNG tự gọi engine PDF — mọi nút hành động chỉ gọi lại callback (`onExportAll`/
 * `onExportCurrent`), khớp `Toolbar.tsx` đang gọi `p.onExportPdf: () => void` sẵn có.
 *
 * Lệch mock CÓ CHỦ Ý (ghi theo yêu cầu phiếu, mock gốc không vẽ phần này):
 *  - Thêm nút "Bảng nét in" trên header, mở `LineweightTable` (Màn 8) NGAY TRONG hộp thoại này
 *    (đổi `tab`, không mở modal lồng modal) — để bảng nét in được vào luồng xuất PDF.
 *  - Khổ giấy render đủ 5 khối A0-A4 (mock chỉ vẽ 4 khối demo A0-A3) — giữ nguyên lưới 4 cột,
 *    A4 tự tràn xuống hàng 2, vì bỏ A4 là mất tính năng thật của app.
 *  - VIỆC 4 (07/08, `docs/GAP-IF.md` G-M13-03): nút tròn "Công cụ" nổi góc dưới-phải bản xem
 *    trước mở `RadialToolMenu` (Màn 9, trước đó 0 nơi mount). KHÔNG dựng engine vẽ tay mới lên
 *    bản xem trước tĩnh (đó là việc lớn, ngoài phạm vi "nối nút") — bấm một công cụ ĐÓNG hộp
 *    thoại này và chuyển THẲNG sang công cụ CAD thật tương ứng (`onPickTool`, nơi gọi tự map qua
 *    `useCadStore.setTool`/`undo()`) để người dùng sửa ngay bản vẽ trước khi xuất lại — hành động
 *    thật, không phải nút bấm-không-ra-gì. Không truyền `onPickTool` thì nút không hiện (đúng
 *    luật §9: ẩn hẳn thay vì bày nút không làm gì).
 *
 * Portal ra `document.body` (luật K4). Đóng bằng Esc hoặc bấm nền mờ (`useDismissable`).
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ruler, Wand2 } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import type { PaperKey, PaperOrientation } from '@/lib/cad/model';
import LightArc from '@/components/ui/LightArc';
import PaperSheetFrame from './PaperSheetFrame';
import LineweightTable, { type LineweightRow } from './LineweightTable';
import RadialToolMenu from './RadialToolMenu';

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif";
const MONO = 'ui-monospace, Menlo, monospace';
const PAPER_KEYS: PaperKey[] = ['A0', 'A1', 'A2', 'A3', 'A4'];

export interface ExportSheetInfo {
  id: string;
  label: string;
}

export interface ExportChecklistItem {
  label: string;
  ok: boolean;
  /** VIỆC 4 CHUAN_DAU_RA (lib/print/export-checks.ts) — 'error' đỏ (--danger), 'warn'/thiếu =
   * vàng như cũ. Additive: caller cũ không truyền vẫn hiện y hệt trước. */
  level?: 'error' | 'warn';
  /** cách sửa — dòng phụ nhỏ dưới thông điệp. */
  fix?: string;
}

export interface ExportPdfDialogProps {
  open: boolean;
  /** danh sách tờ trong bộ hồ sơ đang xuất — quyết định "{n} tờ" trên tiêu đề. */
  sheets: ExportSheetInfo[];
  /** chỉ số (0-based) tờ đang mở trong editor — dùng cho nhãn xem trước + nút "chỉ xuất tờ đang mở". */
  currentSheetIndex?: number;
  initialPaper?: PaperKey;
  initialOrientation?: PaperOrientation;
  /** mặc định rỗng — nơi gọi CHƯA nối dữ liệu kiểm tra thật thì không hiện checklist giả, không
   * bịa mục để "cho đủ" (đúng luật §9 CLAUDE.md: ô trống là bằng chứng còn việc, không phải lỗi). */
  checks?: ExportChecklistItem[];
  /** URL blob của PDF THẬT vừa dựng từ engine xuất; thiếu = đang dựng hoặc caller cũ. */
  previewUrl?: string;
  previewError?: string;
  /** dữ liệu cho Bảng nét in (Màn 8) mở lồng trong hộp thoại — không truyền thì dùng mẫu. */
  lineweightRows?: LineweightRow[];
  /** nơi gọi KHÔNG cầm được khổ giấy (khổ do chỗ khác quyết định) → cột "Khổ giấy" mờ đi kèm
   * ĐÚNG lý do, thay vì để người dùng bấm rồi không có gì đổi ở file xuất ra. */
  paperLockedReason?: string;
  /** báo lên nơi gọi mỗi lần đổi khổ/hướng, để nơi cầm dữ liệu THẬT ghi vào đó (chặng 2D ghi vào
   * `Doc.paperKey/paperOrientation` qua `setPrintSettings`) — nhờ vậy file PDF xuất ra đúng khổ
   * vừa chọn, và danh sách kiểm tính lại theo khổ mới. Không truyền = hộp thoại chỉ đổi bản xem trước. */
  onPaperChange?: (paper: PaperKey, orientation: PaperOrientation) => void;
  /** VIỆC 4 (07/08) — chọn công cụ từ `RadialToolMenu` (id: pen/shape/eraser/undo/measure/text).
   * Không truyền = nút "Công cụ" ẩn hẳn (không bày nút không làm gì, luật §9). Hộp thoại tự đóng
   * NGAY SAU khi báo lên, để người dùng thấy công cụ vừa chọn có tác dụng thật trên bản vẽ. */
  onPickTool?: (toolId: string) => void;
  onExportAll: () => void;
  onExportCurrent: () => void;
  onClose: () => void;
}

export default function ExportPdfDialog({
  open,
  sheets,
  currentSheetIndex = 0,
  initialPaper = 'A3',
  initialOrientation = 'landscape',
  checks = [],
  previewUrl,
  previewError,
  lineweightRows,
  paperLockedReason,
  onPaperChange,
  onPickTool,
  onExportAll,
  onExportCurrent,
  onClose,
}: ExportPdfDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [paper, setPaper] = useState<PaperKey>(initialPaper);
  const [orientation, setOrientation] = useState<PaperOrientation>(initialOrientation);
  const [tab, setTab] = useState<'export' | 'lineweight'>('export');
  const [radialAt, setRadialAt] = useState<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  // Hộp thoại KHÔNG unmount khi đóng (chỉ `return null`) ⇒ state của lần trước còn nguyên: mở lại
  // sẽ rơi đúng vào tab "Bảng nét" đã xem lần trước, và khổ giấy nơi gọi truyền vào bị bỏ qua.
  useEffect(() => {
    if (!open) return;
    setTab('export');
    setPaper(initialPaper);
    setOrientation(initialOrientation);
  }, [open, initialPaper, initialOrientation]);
  /**
   * Báo khổ giấy lên nơi gọi từ MỘT CHỖ (effect), KHÔNG gọi trong từng `onClick`.
   *
   * 🐛 Bug thật bắt được lúc nghiệm thu 06/08: gọi trong onClick thì `onPaperChange(paper, 'portrait')`
   * đọc `paper` từ closure của lần render TRƯỚC. Bấm "A1" rồi "Dọc" đủ nhanh để React gộp chung một
   * nhịp ⇒ lần gọi thứ hai ghi đè bằng khổ CŨ, kết quả ra "A3 dọc" thay vì "A1 dọc" — mất lựa chọn
   * của người dùng mà không báo gì. Effect luôn thấy cặp giá trị SAU CÙNG nên không lệch.
   *
   * `lastNotified === null` = lần chạy đầu sau khi mở: đó chính là giá trị nơi gọi vừa truyền vào,
   * ghi ngược lại là làm bẩn Doc (kích autosave) mà không ai đổi gì.
   */
  const lastNotified = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      lastNotified.current = null;
      return;
    }
    const cap = `${paper}|${orientation}`;
    if (lastNotified.current === null || lastNotified.current === cap) {
      lastNotified.current = cap;
      return;
    }
    lastNotified.current = cap;
    onPaperChange?.(paper, orientation);
  }, [open, paper, orientation, onPaperChange]);

  useDismissable({ open, onDismiss: onClose, refs: [panelRef] });

  if (!mounted || !open) return null;

  const sheetCount = sheets.length;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--mat-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: FONT,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tab === 'export' ? 'Xuất PDF' : 'Bảng nét khi in'}
        style={{
          width: 'min(680px,100%)',
          // Mock khoá cứng A3 ngang nên không cần trần chiều cao. Ở đây khổ giấy đổi được:
          // A0/A1 DỌC làm tờ xem trước cao gấp đôi ⇒ không có trần thì hộp thoại tràn khỏi màn
          // hình thấp và 2 nút xuất nằm ngoài vùng thấy được, không cuộn tới.
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: 20,
          background: 'var(--panel)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-pop)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 'var(--tap-lg)',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)',
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 10,
              flex: 'none',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeLinecap="round">
              <path d="M4 2.5h5l3 3v8H4z" />
              <path d="M6 9h4M6 11h4" />
            </svg>
          </span>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, letterSpacing: '-.01em' }}>
            {tab === 'export' ? `Xuất PDF — ${sheetCount} tờ` : 'Bảng nét khi in'}
          </span>
          {tab === 'export' ? (
            <HeaderIconButton title="Mở bảng nét khi in" onClick={() => setTab('lineweight')}>
              <Ruler size={14} />
            </HeaderIconButton>
          ) : (
            <button
              type="button"
              onClick={() => setTab('export')}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--field)',
                color: 'var(--t2)',
                fontSize: 11.5,
                fontWeight: 600,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              ← Xuất PDF
            </button>
          )}
          <HeaderIconButton title="Đóng — Esc" onClick={onClose}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </HeaderIconButton>
        </div>

        {/* Bảng nét in (Màn 8) KHÔNG chiếm nguyên hộp thoại: nó vốn là PANEL DỌC HẸP trong mock
         * BangNetIn.dc.html (grid 14px 1fr 46px 34px) — kéo ngang ra 680px thì cột tên phình,
         * con số mm và vạch minh hoạ văng ra xa nhau, sai tinh thần mock. Giữ nguyên khung 2 cột:
         * tờ giấy bên trái không đổi, chỉ CỘT PHẢI 258px đổi nội dung. Người dùng vẫn thấy tờ
         * giấy trong lúc soát nét — đúng việc họ đang làm. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 258px', minHeight: 0, overflow: 'auto' }}>
          <div
            style={{
              position: 'relative',
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--field)',
              borderRight: '1px solid var(--border)',
            }}
          >
            {previewUrl ? <object aria-label="Xem trước PDF thật" data={previewUrl} type="application/pdf" style={{ width: '100%', height: 410, border: 0, borderRadius: 10, background: '#fff' }}>
              <a href={previewUrl} target="_blank" rel="noreferrer">Mở bản xem trước PDF</a>
            </object> : <>
              <PaperSheetFrame variant="preview" paper={paper} orientation={orientation} sheetIndex={currentSheetIndex + 1} sheetTotal={sheetCount} />
              {/* 12/08 — LightArc indeterminate KÈM trạng thái đang-dựng THẬT (chưa có % đo được
                  từ engine xuất nên không bịa số — quay đều tới khi previewUrl về). Lỗi thì
                  đổi sang biến thể warn đứng yên đủ vòng: việc dựng đã DỪNG, không quay nữa. */}
              <div role={previewError ? 'alert' : 'status'} style={{ position: 'absolute', left: '50%', bottom: 22, translate: '-50% 0', maxWidth: '80%', padding: '6px 9px', borderRadius: 6, background: 'var(--panel)', border: '1px solid var(--border)', color: previewError ? 'var(--warn)' : 'var(--t3)', fontSize: 10.5, textAlign: 'center', boxShadow: 'var(--shadow-pop)', display: 'flex', alignItems: 'center', gap: 7 }}>
                {previewError
                  ? <LightArc value={100} size={16} strokeWidth={2.5} state="warn" label="Dựng xem trước gặp lỗi" />
                  : <LightArc size={16} strokeWidth={2.5} label="Đang dựng bản xem trước PDF" />}
                <span style={{ minWidth: 0 }}>{previewError ?? 'Đang dựng bản xem trước PDF thật…'}</span>
              </div>
            </>}
            {onPickTool && (
              <button
                type="button"
                title="Công cụ — sửa nhanh trước khi xuất lại"
                onClick={(e) => setRadialAt({ x: e.clientX, y: e.clientY })}
                style={{
                  position: 'absolute',
                  right: 24,
                  bottom: 24,
                  width: 34,
                  height: 34,
                  border: '1px solid var(--border-strong)',
                  borderRadius: '50%',
                  background: 'var(--panel)',
                  color: 'var(--t2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                <Wand2 size={15} />
              </button>
            )}
          </div>
          {radialAt && (
            <RadialToolMenu
              x={radialAt.x}
              y={radialAt.y}
              onPick={(toolId) => {
                setRadialAt(null);
                onPickTool?.(toolId);
              }}
              onClose={() => setRadialAt(null)}
            />
          )}

          {tab === 'lineweight' ? (
            <div style={{ minWidth: 0, minHeight: 380 }}>
              <LineweightTable rows={lineweightRows} />
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div>
                <SectionLabel>Khổ giấy</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                  {PAPER_KEYS.map((key) => (
                    <PaperButton key={key} active={key === paper} lockedReason={paperLockedReason} onClick={() => setPaper(key)}>
                      {key}
                    </PaperButton>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                  <OrientationButton active={orientation === 'landscape'} lockedReason={paperLockedReason} onClick={() => setOrientation('landscape')}>
                    Ngang
                  </OrientationButton>
                  <OrientationButton active={orientation === 'portrait'} lockedReason={paperLockedReason} onClick={() => setOrientation('portrait')}>
                    Dọc
                  </OrientationButton>
                </div>
                {paperLockedReason && (
                  <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--t5)', lineHeight: 1.5, textWrap: 'pretty' }}>
                    {paperLockedReason}
                  </div>
                )}
              </div>

              <div>
                <SectionLabel>Tỉ lệ in</SectionLabel>
                <div
                  style={{
                    height: 'var(--tap)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--field)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>Theo tỉ lệ từng khung nhìn</span>
                  <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: 'var(--ok)' }}>1:1 giấy</span>
                </div>
              </div>

              {/* Chưa nối được dữ liệu kiểm tra thật thì ẨN CẢ MỤC — hiện tiêu đề "Trước khi xuất"
               * rồi bỏ trống là gợi ý sai rằng "không có gì phải kiểm". */}
              <div style={{ display: checks.length ? undefined : 'none' }}>
                <SectionLabel>Trước khi xuất</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {checks.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--gap)', fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          flex: 'none',
                          marginTop: 1.5,
                          borderRadius: 6,
                          // VIỆC 4 CHUAN_DAU_RA — mức 'error' dùng --danger (token sẵn có, nghĩa
                          // "lỗi"); thiếu level giữ --warn y hệt trước (caller cũ không đổi gì).
                          background: c.ok ? 'var(--ok)' : c.level === 'error' ? 'var(--danger)' : 'var(--warn)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          // Xem giải thích --bg dùng làm "chữ trên huy hiệu ok/warn" ở
                          // PaperSheetFrame.tsx — cùng lý do, không có token --on-ok/--on-warn riêng.
                          color: 'var(--bg)',
                          fontSize: 9,
                          fontWeight: 800,
                        }}
                      >
                        {c.ok ? '✓' : '!'}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        {c.label}
                        {/* cách sửa — dòng phụ mờ, chỉ hiện khi bộ kiểm cấp (CHUAN_DAU_RA). */}
                        {!c.ok && c.fix && (
                          <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t5)' }}>{c.fix}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ExportMainButton onClick={onExportAll}>Xuất {sheetCount} tờ ra PDF</ExportMainButton>
                {/* Bộ chỉ có 1 tờ thì "xuất cả bộ" và "chỉ xuất tờ đang mở" là CÙNG một việc —
                 * bày 2 nút giống hệt nhau là bẫy người dùng. Chỉ hiện khi thật sự nhiều tờ. */}
                {sheetCount > 1 && <ExportSecondaryButton onClick={onExportCurrent}>Chỉ xuất tờ đang mở</ExportSecondaryButton>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t4)', marginBottom: 7 }}>
      {children}
    </div>
  );
}

function HeaderIconButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 28,
        height: 28,
        border: 0,
        borderRadius: 10,
        background: hover ? 'var(--hover)' : 'transparent',
        color: hover ? 'var(--t1)' : 'var(--t4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background var(--dur-fast) var(--ease-apple)',
      }}
    >
      {children}
    </button>
  );
}

/** `lockedReason` — nơi gọi KHÔNG cầm được khổ giấy (vd chặng Trình chiếu: khổ do "Khổ trình bày"
 * của hồ sơ quyết định). Khi đó nút phải MỜ + nói rõ LÝ DO, chứ không được bấm-mà-không-ra-gì
 * (luật §9 `docs/00-BAT-DAU-DOC-DAY.md`: cấm nút giả; disabled phải kèm lý do). */
function PaperButton({
  active,
  onClick,
  lockedReason,
  children,
}: {
  active: boolean;
  onClick: () => void;
  lockedReason?: string;
  children: React.ReactNode;
}) {
  const locked = !!lockedReason;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      title={lockedReason}
      style={{
        height: 'var(--tap)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10,
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontWeight: 700,
        fontSize: 11,
        lineHeight: 1.45,
        fontFamily: MONO,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked && !active ? 0.45 : 1,
        transition: 'background var(--dur-base) var(--ease-apple)',
      }}
    >
      {children}
    </button>
  );
}

function OrientationButton({
  active,
  onClick,
  lockedReason,
  children,
}: {
  active: boolean;
  onClick: () => void;
  lockedReason?: string;
  children: React.ReactNode;
}) {
  const locked = !!lockedReason;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      title={lockedReason}
      style={{
        flex: 1,
        height: 'var(--tap)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10,
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t3)',
        fontWeight: 600,
        fontSize: 11.5,
        lineHeight: 1.45,
        fontFamily: 'inherit',
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked && !active ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function ExportMainButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        height: 'var(--tap-lg)',
        border: 0,
        borderRadius: 10,
        background: hover ? 'var(--accent-strong)' : 'var(--accent)',
        color: 'var(--on-accent)',
        fontWeight: 700,
        fontSize: 'var(--fs-ui)',
        lineHeight: 1.45,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background var(--dur-base) var(--ease-apple)',
      }}
    >
      {children}
    </button>
  );
}

function ExportSecondaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        height: 30,
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--field)',
        color: 'var(--t2)',
        fontWeight: 600,
        fontSize: 11,
        lineHeight: 1.45,
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
