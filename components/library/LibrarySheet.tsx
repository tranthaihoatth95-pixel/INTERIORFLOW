'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
  itemsFor,
  type ScopeChip,
  type SheetItem,
} from '@/lib/library/shelves';
import { useLibrarySheetState } from '@/lib/library/use-library-sheet';
import { useLibraryLocalState } from '@/lib/library/local-state';
import { CLUSTER_SPECS } from '@/lib/cad/workstation-clusters';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { ClusterPanel } from './ClusterPanel';
import { ItemThumb } from './ItemThumb';
import { LIBRARY_SHEET_CSS } from './library-sheet-css';
import { LibraryToastHost, pushLibraryToast } from './LibraryToast';
import { PublishModal } from './PublishModal';
import { BulkIngestMode } from './BulkIngestMode';

// 03/08 CHỐT TÊN vòng cuối (docs/CHOT-TEN-CHANG-MODE-2026-08-03.md) — "Vẽ"/"Dựng ảnh" là tên
// round trước, nay đồng bộ theo bộ tên chính thức.
const STAGE_CAPTION: Record<StageKey, [string, string]> = {
  cad: ['Kệ chặng Thiết kế 2D', '2D Design stage shelf'],
  render: ['Kệ chặng Thiết kế 3D', '3D Design stage shelf'],
  present: ['Kệ chặng Trình chiếu', 'Presenting stage shelf'],
};

/** Sự kiện cho canvas/inspector (NGOÀI vùng code G4) tiêu thụ — xem docs/BAO-CAO-G4-LIB.md.
 * 🔴 05/08 (S3): `grep -rn "LIBRARY_INSTANTIATE_EVENT\|if:library-instantiate" app/ components/ lib/`
 * → CHỈ có chỗ PHÁT, **0 nơi NGHE**. Tức kéo-thả món từ kệ hiện chỉ hiện toast chứ chưa rơi
 * xuống bản vẽ thật. Kệ "Văn phòng · Cụm bàn" bên dưới KHÔNG đi đường này — nó gọi thẳng
 * `useCadStore.addEntities()`, nên thả là có hình ngay. Ghi lại để phiên nối canvas biết.
 * ✅ 06/08 (G-M3-14): ĐÃ NỐI. Chỗ nghe = `components/cad/LibraryDropBridge.tsx` (mount trong
 * `CadEditor`), đối chiếu món qua `lib/cad/library-item-resolve.ts` rồi ghi vào ĐÚNG đường
 * `addEntities()` nói trên. `LIBRARY_APPLY_EVENT` (áp preset/vật liệu lên vật đang chọn) thì
 * VẪN CÒN 0 nơi nghe — việc khác, chưa làm, đừng tưởng đã xong theo. */
export const LIBRARY_INSTANTIATE_EVENT = 'if:library-instantiate';
export const LIBRARY_APPLY_EVENT = 'if:library-apply';

/** id kệ cụm bàn — cục bộ, KHÔNG nằm trong `STAGE_SHELVES` (xem lý do ở chỗ render nút kệ). */
const CLUSTER_SHELF_ID = 'cad-clusters';

/**
 * THƯ VIỆN — CARD RỜI trượt lên từ đáy (detached sheet, Hoà chốt 05/08: "không dính bottom, raise
 * lên là card rời bo 4 góc"). Nền ĐẶC, không kính — xem `library-sheet-css.ts`.
 * Đây là **NƠI DUY NHẤT** của thư viện trong app
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
  // CHINH-4: truyền stage để hook xử va phím L theo chặng (§4e — CAD: ⇧L, chặng khác: L trần).
  const { open, setOpen, shelfId: requestedShelf, stageOverride } = useLibrarySheetState(stage);
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

  /* ───── Kéo vạch xuống để đóng (card rời, 05/08) ─────
   * Trước đây `.grab` chỉ là vạch TRANG TRÍ — nhìn như kéo được nhưng không có handler nào, đúng
   * kiểu "nút giả" §9 cấm. Nay nó kéo thật: theo ngón tay, thả quá ngưỡng thì đóng, chưa tới thì
   * bật về. Vùng chạm 44px khai ở CSS (§0c mảng 3). Nút ✕ trong header là đường TƯƠNG ĐƯƠNG —
   * kéo không bao giờ là đường duy nhất (G8/K5).
   * Chỉ đụng `transform` (không `opacity`) để không tạo backdrop-root — xem G1 ở library-sheet-css. */
  const dragRef = useRef<{ id: number; startY: number; dy: number } | null>(null);
  const CLOSE_AFTER_PX = 96;

  const onGrabDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!open) return;
    dragRef.current = { id: e.pointerId, startY: e.clientY, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onGrabMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId || !sheetRef.current) return;
    // Chỉ cho kéo XUỐNG (âm = kéo lên, kẹp về 0) — sheet không cao thêm được.
    d.dy = Math.max(0, e.clientY - d.startY);
    sheetRef.current.style.transform = `translate(-50%, ${d.dy}px) scale(1)`;
  };

  const onGrabUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (sheetRef.current) {
      // Trả về CSS: mở thì bật lại vị trí mở, đóng thì CSS tự trượt xuống bằng transition sẵn có.
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }
    if (d.dy > CLOSE_AFTER_PX) setOpen(false);
  };

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

  /**
   * 06/08 (G-M3-14) — SỬA LỜI BÁO NÓI DỐI. Trước: phát sự kiện xong là toast "Đã tạo bản làm
   * việc…" VÔ ĐIỀU KIỆN, trong khi **0 nơi nghe** ⇒ bản vẽ trống trơn mà app khẳng định đã xong.
   * Nay: `detail.claimed` do nơi NGHE bật lên (đồng bộ ngay trong listener — `dispatchEvent`
   * chạy đồng bộ nên đọc được ngay dòng sau). Có người nhận ⇒ ĐỂ HỌ báo kết quả thật (thả được
   * mấy nét / chưa có hình cho món này — xem `components/cad/LibraryDropBridge.tsx`). Không ai
   * nhận ⇒ nói thẳng là màn đang mở chưa đón được, kèm việc làm tiếp.
   */
  const instantiate = (item: SheetItem) => {
    const detail: SheetItem & { claimed?: boolean } = { ...item, claimed: false };
    window.dispatchEvent(new CustomEvent(LIBRARY_INSTANTIATE_EVENT, { detail }));
    if (detail.claimed) return;
    pushLibraryToast(
      tr(
        `Chưa thả "${item.name}" xuống được — màn đang mở không có bản vẽ. Mở chặng Thiết kế 2D rồi thả lại.`,
        `Can't place "${item.name}" here — this screen has no drawing. Open the 2D Design stage and try again.`,
      ),
    );
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
        <div
          className="grab"
          aria-hidden
          onPointerDown={onGrabDown}
          onPointerMove={onGrabMove}
          onPointerUp={onGrabUp}
          onPointerCancel={onGrabUp}
        >
          <i />
        </div>

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
            {/* KỆ "VĂN PHÒNG · CỤM BÀN" (phiếu S3 VIỆC 1) — đưa 6 hàm sinh cụm của
               `lib/cad/workstation-clusters.ts` ra tay KTS (trước đó 0 nơi gọi).
               Khai TẠI ĐÂY chứ không thêm vào `lib/library/shelves.ts`: kệ kia là danh mục món
               TĨNH (`SheetItem` có ảnh/mã/phạm vi), còn cụm sinh LÚC CHẠY theo tham số nên không
               có `SheetItem` nào mô tả đúng nó. Nhét vào đó sẽ phải bịa mã + ảnh giả.
               Chỉ hiện ở chặng 2D — chặng khác không có `Doc` để thả cụm xuống. */}
            {activeStage === 'cad' && (
              <button
                type="button"
                className={shelfId === CLUSTER_SHELF_ID ? 'shrow on' : 'shrow'}
                aria-current={shelfId === CLUSTER_SHELF_ID}
                onClick={() => setShelfId(CLUSTER_SHELF_ID)}
              >
                {tr('Văn phòng · Cụm bàn', 'Office · Desk clusters')}
                <span className="c">{CLUSTER_SPECS.length}</span>
              </button>
            )}

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
            {shelfId === CLUSTER_SHELF_ID ? (
              /* Cụm bàn — panel riêng: có núm chỉnh + XEM TRƯỚC bắt buộc trước khi thả, nên không
                 dùng lưới thẻ `.it` (thẻ chỉ hợp với món tĩnh bấm-là-dùng). Thả xong đóng sheet để
                 KTS thấy ngay cụm vừa rơi xuống bản vẽ. */
              <ClusterPanel onInserted={() => setOpen(false)} />
            ) : (
            <>
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
                  {/* Ô xem trước theo BẬC THANG ảnh-thật → quả-cầu → vân-procedural (xem
                      `ItemThumb.tsx`); badge phạm vi đè lên trên, không đổi. */}
                  <ItemThumb item={it}>
                    <span className={it.scope === 'studio' ? 'badge st' : 'badge'}>{SCOPE_BADGE_TEXT[it.scope]}</span>
                  </ItemThumb>
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
            </>
            )}
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
