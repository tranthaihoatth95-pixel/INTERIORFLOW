'use client';

/**
 * components/studio/Checkpoint.tsx — KHUNG CHECKPOINT DUYỆT DÙNG CHUNG (S5, 05/08).
 *
 * ⛔ MỘT khung cho CẢ APP. S2 (3D) · S3 (bố trí) · S4 (CAD) gắn vào ĐÚNG file này — KHÔNG phiên
 * nào tự đẻ khung duyệt riêng, nếu không mỗi màn một kiểu quyết định và người dùng lại mất
 * phương hướng đúng như nỗi đau gốc.
 *
 * ─── VÌ SAO CÓ ───
 * `docs/00-BAT-DAU-DOC-DAY.md` §0e QUYỀN KIỂM SOÁT (Hoà đặt 05/08). Nguyên văn:
 *   *"Kiến trúc sư và dân làm sáng tạo ghét nhất là những việc mà bản thân mình không thể kiểm
 *   soát. Họ không ghét AI, nhưng họ ghét cảm giác mông lung, không chắc chắn khi AI tạo ra sản
 *   phẩm không đồng nhất. Nên từ flow lớn đến flow nhỏ, cân nhắc có checkpoint và thấy được sản
 *   phẩm để duyệt."*
 *
 * ─── BA TRẠNG THÁI ───
 *   ① `phase='running'`  ĐANG LÀM  — thấy tiến độ THẬT, huỷ được bất cứ lúc nào.
 *   ② `phase='preview'`  XEM TRƯỚC — `preview` là SẢN PHẨM THẬT (ảnh/entity/con số).
 *   ③ cùng khung ②       QUYẾT     — [Nhận] · [Làm lại] · [Sửa tham số rồi làm lại].
 *
 * ─── LUẬT CỨNG ───
 *  1. ⛔ CẤM ĐƯỜNG TẮT. Không flow nào được ghi thẳng vào `Doc` mà bỏ qua ②. Cách thi hành:
 *     `onAccept` trả về ĐÚNG `selectedIds` — nơi gọi PHẢI ghi theo danh sách đó, không được cầm
 *     sẵn kết quả rồi ghi tất. Xem `acceptGate()` (`checkpoint-core.ts`) chặn nhận-khi-chưa-chọn.
 *  2. ② phải hiện KẾT QUẢ THẬT. `preview` là `ReactNode` chứ không phải `string` — cố tình, để
 *     không ai truyền vào câu *"đã tạo xong 12 đối tượng"*. Muốn mô tả bằng chữ thì dùng
 *     `items[].detail` kèm con số thật.
 *  3. [Làm lại] GIỮ NGUYÊN THAM SỐ CŨ (`onRetry` không nhận đối số — nơi gọi giữ nguyên state
 *     tham số; muốn sửa 1 thứ thì bấm [Sửa tham số rồi làm lại] → `onEditParams`).
 *
 * ─── KS1–KS5 CÀI VÀO KIỂU DỮ LIỆU ───
 *   `seed` và `undoLabel` là BẮT BUỘC (không optional). Quên = hỏng `tsc`, không phải "quên thì
 *   thôi". Seed không áp dụng thì truyền `null` — UI sẽ nói thẳng "chạy lại có thể ra khác".
 *
 * ─── THEME ───
 * Chỉ dùng token (`--panel`/`--field`/`--border`/`--t1..t5`/`--accent`/`--success`/`--radius-*`)
 * ⇒ tự đúng cả 2 theme, không cần nhánh riêng. ⛔ không `font:` shorthand (luật chữ Việt).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, RotateCcw, SlidersHorizontal, X, Info, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Tooltip from '@/components/ui/Tooltip';
import {
  acceptGate,
  formatProgress,
  formatSeed,
  selectedIds,
  selectionState,
  setAllSelected,
  toggleItem,
  type CheckpointItem,
  type CheckpointParam,
  type CheckpointPhase,
} from './checkpoint-core';

export * from './checkpoint-core';

export interface CheckpointProps {
  phase: CheckpointPhase;
  /** tên việc đang duyệt — vd "Dựng tường từ mô tả". */
  title: string;

  /* ── ① ĐANG LÀM ── */
  /** 0..1; `null` = chưa đo được ⇒ hiện số giây, KHÔNG bịa phần trăm. */
  progress?: number | null;
  /** dòng trạng thái thật, vd "Đang đọc bản vẽ…" */
  statusLine?: string;
  /** Huỷ — bắt buộc khi `phase='running'`, luật "huỷ được". */
  onCancel?: () => void;

  /* ── ② XEM TRƯỚC ── */
  /** SẢN PHẨM THẬT. Ảnh, canvas, bảng số — KHÔNG phải câu mô tả. */
  preview?: ReactNode;
  /** KS3 — các phần duyệt riêng được. Rỗng ⇒ [Nhận] tự disabled kèm lý do. */
  items?: CheckpointItem[];
  onItemsChange?: (next: CheckpointItem[]) => void;
  /** KS1 — tham số máy đã chạy, đọc được. */
  params?: CheckpointParam[];
  /** KS2 — BẮT BUỘC khai. `null` = bước này không tái lập bằng seed (UI nói rõ). */
  seed: string | number | null;
  /** KS4 — BẮT BUỘC. Bấm Huỷ/Hoàn tác thì về đâu, vd "bản vẽ trước khi chạy AI (12 tường)". */
  undoLabel: string;

  /* ── ③ QUYẾT ── */
  /** Nhận — CHỈ nhận `ids` được tick. Nơi gọi không được ghi thứ ngoài danh sách này. */
  onAccept?: (ids: string[]) => void;
  /** Làm lại NGUYÊN tham số cũ. */
  onRetry?: () => void;
  /** Mở lại bảng tham số để sửa rồi chạy — không có thì nút tự disabled kèm lý do. */
  onEditParams?: () => void;
}

const box: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--panel)',
  padding: 14,
};

export function Checkpoint(props: CheckpointProps) {
  const tr = useT();
  const { phase, title, seed, undoLabel } = props;
  const items = props.items ?? [];
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number>(0);

  // Đồng hồ chỉ chạy ở ① — dừng hẳn khi rời trạng thái, không để timer mồ côi.
  useEffect(() => {
    if (phase !== 'running') return;
    startedAt.current = Date.now();
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 1000);
    return () => clearInterval(id);
  }, [phase]);

  if (phase === 'idle') return null;

  /* ────────────────────────── ① ĐANG LÀM ────────────────────────── */
  if (phase === 'running') {
    const pct = props.progress ?? null;
    return (
      <section style={box} aria-live="polite" aria-busy>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Loader2 size={14} style={{ color: 'var(--accent)' }} className="pe-spin" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{title}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
            {formatProgress(pct, elapsedMs)}
          </span>
        </header>

        {/* Thanh tiến độ: có % thì chạy theo %, không có thì vạch trượt vô định — KHÔNG giả % */}
        <div style={{ height: 4, borderRadius: 999, background: 'var(--field)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              borderRadius: 999,
              background: 'var(--accent)',
              width: pct === null ? '35%' : `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`,
              transition: 'width var(--nhip-bang) ease-out',
            }}
            className={pct === null ? 'if-indeterminate' : undefined}
          />
        </div>

        {props.statusLine && (
          <p style={{ marginTop: 8, fontSize: 11.5, color: 'var(--t3)' }}>{props.statusLine}</p>
        )}

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          {props.onCancel ? (
            <button type="button" onClick={props.onCancel} style={btnGhost}>
              <X size={18} /> {tr('Huỷ', 'Cancel')}
            </button>
          ) : (
            // Luật §9: không có đường huỷ thì NÓI THẲNG, không để nút giả.
            <Tooltip label={tr('Bước này chưa huỷ giữa chừng được — chờ chạy xong rồi bấm Làm lại.', 'This step cannot be cancelled midway — wait, then use Retry.')}>
              <button type="button" disabled style={{ ...btnGhost, ...btnDisabled }}>
                <X size={18} /> {tr('Huỷ', 'Cancel')}
              </button>
            </Tooltip>
          )}
        </div>
      </section>
    );
  }

  /* ───────────────────── ② XEM TRƯỚC + ③ QUYẾT ───────────────────── */
  const gate = acceptGate(items);
  const selState = selectionState(items);
  const nSel = selectedIds(items).length;
  const setItems = (next: CheckpointItem[]) => props.onItemsChange?.(next);

  return (
    <section style={box}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={badge}>{tr('XEM TRƯỚC', 'PREVIEW')}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{title}</span>
      </header>

      {/* ── SẢN PHẨM THẬT ── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--field)',
          overflow: 'hidden',
          minHeight: 120,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {props.preview ?? (
          <span style={{ fontSize: 11.5, color: 'var(--t4)', padding: 16, textAlign: 'center' }}>
            {tr(
              'Bước này chưa dựng được ảnh xem trước — chưa nhận được, xem danh sách bên dưới rồi bấm Làm lại.',
              'No preview available for this step yet — review the list below, then Retry.',
            )}
          </span>
        )}
      </div>

      {/* ── KS1 tham số + KS2 seed ── */}
      {(props.params?.length || seed !== undefined) && (
        <dl style={{ margin: '10px 0 0', display: 'grid', gap: 4 }}>
          {props.params?.map((p, i) => (
            // key kèm chỉ số: hai hàng CÙNG NHÃN là ca thật (ClusterPanel truyền param "Số chỗ"
            // của spec LẪN hàng tính từ result) — key theo label trần là React trùng key.
            <div key={`${p.label}#${i}`} style={rowKV}>
              <dt style={kvKey}>{p.label}</dt>
              <dd style={kvVal}>{p.value}</dd>
            </div>
          ))}
          <div style={rowKV}>
            <dt style={kvKey}>Seed</dt>
            <dd style={{ ...kvVal, color: seed === null || seed === '' ? 'var(--warning)' : 'var(--t2)' }}>
              {formatSeed(seed)}
            </dd>
          </div>
        </dl>
      )}

      {/* ── KS3 duyệt theo phần ── */}
      {items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.04em', color: 'var(--t4)' }}>
              {tr('NHẬN PHẦN NÀO', 'WHAT TO ACCEPT')}
            </span>
            <button
              type="button"
              onClick={() => setItems(setAllSelected(items, selState !== 'all'))}
              style={{ ...btnGhost, marginLeft: 'auto', padding: '3px 8px', fontSize: 11 }}
            >
              {selState === 'all' ? tr('Bỏ chọn tất cả', 'Deselect all') : tr('Chọn tất cả', 'Select all')}
            </button>
          </div>

          <ul style={{ display: 'grid', gap: 2, margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((it) => (
              <li key={it.id}>
                <label style={itemRow}>
                  <input
                    type="checkbox"
                    checked={it.selected}
                    onChange={() => setItems(toggleItem(items, it.id))}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--t1)' }}>{it.label}</span>
                  {it.detail && (
                    <span style={{ fontSize: 11.5, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                      {it.detail}
                    </span>
                  )}
                  {/* KS5 — máy nói được vì sao. Không có căn cứ thì NÓI LÀ KHÔNG CÓ, không giấu. */}
                  <Tooltip
                    label={it.why ?? tr('Máy chưa nêu được căn cứ cho mục này.', 'No rationale provided for this item.')}
                  >
                    <span
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        color: it.why ? 'var(--t4)' : 'var(--t5)',
                      }}
                    >
                      <Info size={16} />
                    </span>
                  </Tooltip>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── KS4 lùi về đâu ── */}
      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--t4)', display: 'flex', gap: 5 }}>
        <RotateCcw size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{tr('Không nhận thì quay về: ', 'Discarding returns to: ')}{undoLabel}</span>
      </p>

      {/* ── ③ QUYẾT ── */}
      <footer style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {gate.enabled ? (
          <button type="button" onClick={() => props.onAccept?.(selectedIds(items))} style={btnPrimary}>
            <Check size={18} /> {tr(`Nhận ${nSel} phần`, `Accept ${nSel}`)}
          </button>
        ) : (
          <Tooltip label={gate.reason ?? ''}>
            <button type="button" disabled style={{ ...btnPrimary, ...btnDisabled }}>
              <Check size={18} /> {tr('Nhận', 'Accept')}
            </button>
          </Tooltip>
        )}

        {props.onRetry ? (
          <button type="button" onClick={props.onRetry} style={btnGhost}>
            <RotateCcw size={18} /> {tr('Làm lại', 'Retry')}
          </button>
        ) : (
          <Tooltip label={tr('Bước này chưa chạy lại tại chỗ được — đóng rồi chạy lại từ đầu.', 'Cannot retry in place yet — close and run again.')}>
            <button type="button" disabled style={{ ...btnGhost, ...btnDisabled }}>
              <RotateCcw size={18} /> {tr('Làm lại', 'Retry')}
            </button>
          </Tooltip>
        )}

        {props.onEditParams ? (
          <button type="button" onClick={props.onEditParams} style={btnGhost}>
            <SlidersHorizontal size={18} /> {tr('Sửa tham số rồi làm lại', 'Edit settings & retry')}
          </button>
        ) : (
          <Tooltip label={tr('Bước này chưa có bảng tham số sửa được.', 'This step has no editable settings yet.')}>
            <button type="button" disabled style={{ ...btnGhost, ...btnDisabled }}>
              <SlidersHorizontal size={18} /> {tr('Sửa tham số rồi làm lại', 'Edit settings & retry')}
            </button>
          </Tooltip>
        )}
      </footer>
    </section>
  );
}

/* ─────────────────────────── kiểu dáng dùng chung ─────────────────────────── */

const badge: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.06em',
  color: 'var(--accent)',
  background: 'var(--accent-soft)',
  border: '1px solid var(--accent-ring)',
  borderRadius: 999,
  padding: '2px 7px',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '6px 11px',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background var(--nhip-bam) ease-out, border-color var(--nhip-bam) ease-out',
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  color: '#fff',
  background: 'var(--accent)',
  border: '1px solid var(--accent-strong)',
};

const btnGhost: React.CSSProperties = {
  ...btnBase,
  color: 'var(--t2)',
  background: 'transparent',
  border: '1px solid var(--border)',
};

/** disabled LUÔN đi kèm `<Tooltip>` nêu lý do — luật §9, cấm nút giả. */
const btnDisabled: React.CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.45,
  borderStyle: 'dashed',
};

const rowKV: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'baseline' };
const kvKey: React.CSSProperties = { margin: 0, fontSize: 11, color: 'var(--t4)', minWidth: 92 };
const kvVal: React.CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  color: 'var(--t2)',
  fontVariantNumeric: 'tabular-nums',
};

const itemRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '5px 7px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--field)',
  cursor: 'pointer',
};
