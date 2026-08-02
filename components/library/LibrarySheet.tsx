'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ArrowUp } from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { StageKey } from '@/lib/library/types';
import {
  COMMON_SHELVES,
  DEFAULT_SHELF,
  SCOPE_BADGE_TEXT,
  SCOPE_CHIPS,
  STAGE_SHELVES,
  SWATCH,
  itemsFor,
  type ScopeChip,
  type SheetItem,
} from '@/lib/library/shelves';
import { useLibrarySheetState } from '@/lib/library/use-library-sheet';
import { useLibraryLocalState } from '@/lib/library/local-state';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { LIBRARY_SHEET_CSS } from './library-sheet-css';
import { LibraryToastHost, pushLibraryToast } from './LibraryToast';
import { PublishModal } from './PublishModal';
import { BulkIngestMode } from './BulkIngestMode';

const STAGE_CAPTION: Record<StageKey, [string, string]> = {
  cad: ['Kệ chặng Vẽ', 'Drawing stage shelf'],
  render: ['Kệ chặng Dựng ảnh', 'Rendering stage shelf'],
  present: ['Kệ chặng Trình bày', 'Presenting stage shelf'],
};

/** Sự kiện cho canvas/inspector (NGOÀI vùng code G4) tiêu thụ — xem docs/BAO-CAO-G4-LIB.md. */
export const LIBRARY_INSTANTIATE_EVENT = 'if:library-instantiate';
export const LIBRARY_APPLY_EVENT = 'if:library-apply';

/**
 * THƯ VIỆN — sheet kính TRƯỢT LÊN từ đáy. Đây là **NƠI DUY NHẤT** của thư viện trong app
 * (Hoà chốt 03/08): không có trang `/library` riêng, không có panel thứ hai. Lý do: thư viện chỉ
 * có nghĩa khi KÉO được vào chỗ đang làm — sheet luôn có bàn làm việc thật nằm ngay dưới, còn
 * trang riêng thì không (nó đã phải chế ra "vùng thả mô phỏng", nay xoá hẳn).
 *
 * Port nguyên văn `docs/mocks/mock-if-3chang.html` (xem `library-sheet-css.ts`).
 *
 * Kệ TỰ LỌC theo chặng đang mở (contextual shelf) — chặng lấy từ state thật của app do nơi mount
 * truyền vào (`StageShell active`), KHÔNG đọc query param (`?stage=` đã bỏ 03/08: URL và tab đang
 * sáng có thể lệch nhau ⇒ trạng thái mâu thuẫn). Muốn xem toàn kho thì dùng chip "Tất cả".
 *
 * Ba động tác đúng `docs/SPEC-STAGE-LIBRARIES.md`:
 *  · KÉO–THẢ  = instantiate → 1 bản làm việc, sửa KHÔNG đụng bản gốc (template gốc read-only).
 *  · ÁP       = preset lên vật đang chọn (vật liệu · hatch · preset dựng ảnh).
 *  · PUBLISH  = bản của mình → template mới, PHẢI qua chủ studio duyệt (không tự lên kệ chung).
 *
 * Portal ra `body` — luật panel nổi (`docs/00-CHOT.md` K4: panel kính lồng trong chrome kính thì
 * backdrop-filter của cha chặn blur của con).
 */
export function LibrarySheet({ stage = 'render' }: { stage?: StageKey }) {
  const tr = useT();
  const { open, setOpen, shelfId: requestedShelf, stageOverride } = useLibrarySheetState();
  const { state, addPublishDraft } = useLibraryLocalState();

  const activeStage: StageKey = stageOverride ?? stage;
  const [shelfId, setShelfId] = useState<string>(DEFAULT_SHELF[activeStage]);
  const [chip, setChip] = useState<ScopeChip>('all');
  const [query, setQuery] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  /** `/library/ingest` gộp thành 1 CHẾ ĐỘ của sheet (SPEC-NAVIGATION-MODEL §1) — không trang riêng. */
  const [mode, setMode] = useState<'browse' | 'ingest'>('browse');
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Đổi chặng → về kệ mặc định của chặng đó (mock: mỗi chặng có 1 `.shrow.on` riêng).
  useEffect(() => {
    setShelfId(DEFAULT_SHELF[activeStage]);
  }, [activeStage]);

  // Mở thẳng vào 1 kệ (ô Vật liệu trong Inspector gọi openLibrarySheet({shelfId:'render-mat'})).
  useEffect(() => {
    if (requestedShelf) setShelfId(requestedShelf);
  }, [requestedShelf]);

  const items = useMemo(() => itemsFor(activeStage, shelfId, chip, query), [activeStage, shelfId, chip, query]);
  const stageShelves = STAGE_SHELVES[activeStage];

  const instantiate = (item: SheetItem) => {
    window.dispatchEvent(new CustomEvent(LIBRARY_INSTANTIATE_EVENT, { detail: item }));
    pushLibraryToast(tr(`Đã tạo bản làm việc từ "${item.name}" — bản gốc không đổi`, `Created a working copy of "${item.name}" — original untouched`));
  };

  const applyPreset = (item: SheetItem) => {
    window.dispatchEvent(new CustomEvent(LIBRARY_APPLY_EVENT, { detail: item }));
    pushLibraryToast(tr(`Đã áp "${item.name}" lên vật đang chọn`, `Applied "${item.name}" to the current selection`));
  };

  const use = (item: SheetItem) => (item.mechanic === 'ap' ? applyPreset(item) : instantiate(item));

  if (!mounted) return null;

  return createPortal(
    <div className="if-lib-root">
      <RawStyle css={LIBRARY_SHEET_CSS} />

      <button
        type="button"
        className="scrim"
        data-open={open}
        aria-label={tr('Đóng Thư viện', 'Close library')}
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <div
        className="lib mat-sheet"
        data-open={open}
        role="dialog"
        aria-modal={open}
        aria-label={tr('Thư viện', 'Library')}
        aria-hidden={!open}
        ref={sheetRef}
        // Sheet luôn nằm trong DOM (để có hiệu ứng trượt); khi đóng phải khoá hẳn tiêu điểm bàn
        // phím, nếu không Tab vẫn chui vào sheet vô hình — lỗi a11y thật, không phải lý thuyết.
        {...(!open ? { inert: '' as unknown as boolean } : {})}
      >
        <div className="grab"><i /></div>

        <div className="libh">
          <h3>{tr('Thư viện', 'Library')}</h3>
          {mode === 'browse' && (
            <span className="srch">
              <Search size={13} strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('Tìm trong kho…', 'Search the store…')}
                aria-label={tr('Tìm trong kho', 'Search the store')}
              />
            </span>
          )}
          <span className="modeseg" role="group" aria-label={tr('Chế độ', 'Mode')}>
            <button type="button" className={mode === 'browse' ? 'on' : ''} aria-pressed={mode === 'browse'} onClick={() => setMode('browse')}>
              {tr('Duyệt kho', 'Browse')}
            </button>
            <button type="button" className={mode === 'ingest' ? 'on' : ''} aria-pressed={mode === 'ingest'} onClick={() => setMode('ingest')}>
              {tr('Nạp hàng loạt', 'Bulk add')}
            </button>
          </span>
          <button type="button" className="cx" onClick={() => setOpen(false)} aria-label={tr('Đóng', 'Close')}>
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>

        {mode === 'ingest' ? (
          <BulkIngestMode onDone={() => setMode('browse')} />
        ) : (
        <div className="libbody">
          <div className="shelf">
            {/* NHÓM TRÊN — đổi theo chặng đang mở */}
            <div className="shcap">{tr(STAGE_CAPTION[activeStage][0], STAGE_CAPTION[activeStage][1])}</div>
            {stageShelves.map((s) => (
              <button
                type="button"
                key={s.id}
                className={s.id === shelfId ? 'shrow on' : 'shrow'}
                aria-current={s.id === shelfId}
                onClick={() => setShelfId(s.id)}
              >
                {tr(s.label[0], s.label[1])}
                <span className="c">{s.count}</span>
              </button>
            ))}

            {/* NHÓM DƯỚI — kệ chung, luôn có ở mọi chặng */}
            <div className="shcap">{tr('Kệ chung', 'Shared shelves')}</div>
            {COMMON_SHELVES.map((s) => (
              <button
                type="button"
                key={s.id}
                className={s.id === shelfId ? 'shrow on' : 'shrow'}
                aria-current={s.id === shelfId}
                onClick={() => setShelfId(s.id)}
              >
                {tr(s.label[0], s.label[1])}
                <span className="c">{s.count}</span>
              </button>
            ))}
          </div>

          <div className="libmain">
            <div className="chips" role="group" aria-label={tr('Lọc theo phạm vi', 'Filter by scope')}>
              {SCOPE_CHIPS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={c.id === chip ? 'chip on' : 'chip'}
                  aria-pressed={c.id === chip}
                  onClick={() => setChip(c.id)}
                >
                  {tr(c.label[0], c.label[1])}
                </button>
              ))}
            </div>

            <div className="grid">
              {items.length === 0 && (
                <p className="empty">{tr('Không có món nào khớp bộ lọc.', 'Nothing matches this filter.')}</p>
              )}
              {items.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className="it"
                  draggable
                  title={it.mechanic === 'ap' ? tr('Bấm để áp lên vật đang chọn', 'Click to apply to selection') : tr('Kéo ra bàn làm việc để dùng', 'Drag onto the workspace to use')}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-if-library-item', it.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={(e) => {
                    // Thả ra ngoài sheet = dùng món (canvas thật nối sau — xem báo cáo).
                    if (e.dataTransfer.dropEffect !== 'none') instantiate(it);
                  }}
                  onClick={() => use(it)}
                  onDoubleClick={() => pushLibraryToast(tr(`Xem trước: ${it.name} · ${it.code}`, `Preview: ${it.name} · ${it.code}`))}
                >
                  <span className="th" style={{ background: SWATCH[it.swatch] }}>
                    <span className={it.scope === 'studio' ? 'badge st' : 'badge'}>{SCOPE_BADGE_TEXT[it.scope]}</span>
                  </span>
                  <span className="mt">
                    <span className="a" style={{ display: 'block' }}>{it.name}</span>
                    <span className="b" style={{ display: 'block' }}>{it.code}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="libft">
              <span>{tr('Kéo thẳng vào bàn làm việc để dùng · Bấm đúp để xem trước', 'Drag onto the workspace to use · Double-click to preview')}</span>
              {state.pending.length > 0 && (
                <span title={state.pending.map((p) => p.name).join(', ')}>
                  {tr(`${state.pending.length} chờ duyệt`, `${state.pending.length} awaiting approval`)}
                </span>
              )}
              <button type="button" className="pub" onClick={() => setPublishOpen(true)}>
                <ArrowUp size={13} strokeWidth={2} />
                {tr('Đưa lên kệ', 'Publish to shelf')}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>

      <PublishModal
        open={publishOpen}
        defaultStage={activeStage}
        onClose={() => setPublishOpen(false)}
        onSubmit={(draft) => {
          addPublishDraft(draft);
          setPublishOpen(false);
          pushLibraryToast(tr(`Đã gửi "${draft.name}" — chờ chủ studio duyệt`, `Sent "${draft.name}" — awaiting studio owner approval`));
        }}
      />

      <LibraryToastHost />
    </div>,
    document.body,
  );
}
