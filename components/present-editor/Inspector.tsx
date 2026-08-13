'use client';

/**
 * components/present-editor/Inspector.tsx — Bảng thuộc tính phần tử đang chọn.
 *
 * Tuỳ loại: TEXT (nội dung/cỡ/màu/căn/đậm-nghiêng), IMAGE (brightness/contrast/
 * saturate/temperature + crop + bo góc), SHAPE (fill/stroke/độ dày/bo góc). Cùng nút
 * chung: z-order, khoá, xoá, độ mờ. Không chọn gì → chỉnh NỀN slide.
 */

import type {
  SlideElement,
  TextElement,
  ImageElement,
  ShapeElement,
  EditorSlide,
  ImageAdjust,
  CropRect,
  ListStyle,
  EmbeddedFont,
  TextFx,
  TextShadowLayer,
  ImageMaskShape,
  FillOverlay,
  ElementFilter,
} from '@/lib/present-editor/model';
import { effectiveListStyle, DEFAULT_ELEMENT_FILTER } from '@/lib/present-editor/model';
import type { LinkedAsset } from '@/lib/present-editor/model';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
// [marker: taoViecTuDay] — tạo Task từ trang (POST /api/tasks sẵn có, lib/tasks/focus-entity).
import { postTaskFromHere, suggestedTaskTitle, TASK_BOARD_ROUTE } from '@/lib/tasks/focus-entity';
import { effectiveUserId } from '@/lib/resume';
import { getProjectDoc } from '@/lib/present-editor/project-doc';
import {
  computeCadPlanFingerprint,
  renderRecipeImage,
  isLinkedAssetStale,
} from '@/lib/present-editor/linked-asset-recipe';
import {
  addCustomFont,
  getLibraryFonts,
  registerFonts,
  registerLibraryFonts,
  mergeFontLists,
  isCustomStack,
  FontError,
  type CustomFont,
} from '@/lib/present-editor/custom-fonts';
import { FX_PRESETS, applyPreset } from '@/lib/present-editor/text-fx';
import type { FontPairing } from '@/lib/slides';
import { DEFAULT_ADJUST } from '@/lib/present-editor/model';
import { CURATED_FONTS } from '@/lib/present-editor/fonts';
import LayerPanel from './LayerPanel';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  ChevronDown,
  Layers,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  RotateCcw,
  SlidersHorizontal,
  Wand2,
  Link2,
  Unlink,
  RefreshCw,
  AlertTriangle,
  Group,
  Ungroup,
} from 'lucide-react';
import type { AlignMode as GroupAlignMode, DistributeAxis } from '@/lib/present-editor/align';

/** Kiểu căn element trong sân khấu (canh theo BIÊN SÂN KHẤU — nút "Căn trong slide" cũ, 1 phần tử). */
type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

interface Props {
  slide: EditorSlide;
  /** [marker: taoViecTuDay] — số thứ tự trang hiện tại (0-based) để đặt title "Trang N". */
  slideIndex?: number;
  selected: SlideElement | null;
  palette: string[];
  deckFonts: FontPairing;
  /** Font tải lên đã NHÚNG trong deck (#1) — nguồn để dựng dropdown + biết font nào là custom. */
  deckCustomFonts?: EmbeddedFont[];
  /** Nhúng font vừa tải vào deck (PresentEditor ghi vào `deck.customFonts`). */
  onAddDeckFont?: (f: EmbeddedFont) => void;
  onUpdateSelected: (mutate: (el: SlideElement) => void, live?: boolean) => void;
  onUpdateSlide: (mutate: (s: EditorSlide) => void, live?: boolean) => void;
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  onAlign: (mode: AlignMode) => void;
  /** Căn NHIỀU element đã chọn theo bounding box CHUNG của chính chúng (khác `onAlign` canh
   * theo biên slide) — chỉ hiện cụm nút khi `selectedIds.length > 1` (xem lib/present-editor/align.ts). */
  onAlignSelection?: (mode: GroupAlignMode) => void;
  /** Phân bố đều khoảng cách giữa các element đã chọn (cần ≥3). */
  onDistributeSelection?: (axis: DistributeAxis) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** P2/E1 (nhóm) — khoá/mở khoá CẢ CỤM đang chọn (cascade, khác `onUpdateSelected` chỉ
   * đụng 1 phần tử "chính"). Dùng cho nút Khoá trong Inspector. */
  onToggleLockSelected: () => void;
  /** P2/E1 — gộp ≥2 phần tử đang chọn thành 1 cụm mới / rã cụm đang chọn. */
  onGroup: () => void;
  onUngroup: () => void;
  /** mở chế độ chỉnh ảnh (Canva-style) cho ảnh đang chọn. */
  onOpenImageEditor?: (id: string) => void;
  /** mở trình chỉnh ảnh nâng cao (Photoshop-level, /photo-editor) cho đúng ảnh `id`. */
  onOpenAdvancedEditor?: (id: string) => void;
  /* ---- tài sản liên kết (PS-3) — chỉ dùng khi selected.kind === 'image' ---- */
  linkedAssets?: LinkedAsset[];
  onCreateAsset?: () => void;
  onAttachAsset?: (assetId: string) => void;
  onDetachAsset?: () => void;
  /**
   * T2 (`docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` §3) — asset có `recipe` vừa được "Làm mới từ bản
   * vẽ" render lại: áp `dataUrl`+`fingerprint` mới vào REGISTRY (`deck.linkedAssets`, qua
   * `applyRecipeRefresh`) để MỌI element khác đang dùng chung `assetId` cùng cập nhật — không chỉ
   * ảnh đang chọn. Optional: PresentEditor.tsx CHƯA nối callback này ở phiên 08/08 (ngoài vùng
   * file được giao — xem báo cáo phiên). Thiếu callback này, nút "Làm mới từ bản vẽ" vẫn hoạt
   * động ĐÚNG cho riêng ảnh đang chọn (qua `onUpdateSelected`), chỉ không lan sang slide khác
   * dùng chung asset — KHÔNG phải nút giả, chỉ hẹp phạm vi hơn dự tính đầy đủ của T2.
   */
  onRefreshAsset?: (assetId: string, dataUrl: string, fingerprint: string) => void;
  /* ---- ô quản lý layer ---- */
  selectedIds: string[];
  onSelect: (id: string) => void;
  onReorderElement: (fromIndex: number, toIndex: number) => void;
}

export default function Inspector({
  slide,
  slideIndex,
  selected,
  palette,
  deckFonts,
  deckCustomFonts,
  onAddDeckFont,
  onUpdateSelected,
  onUpdateSlide,
  onZOrder,
  onAlign,
  onAlignSelection,
  onDistributeSelection,
  onDuplicate,
  onDelete,
  onToggleLockSelected,
  onGroup,
  onUngroup,
  onOpenImageEditor,
  onOpenAdvancedEditor,
  linkedAssets,
  onCreateAsset,
  onAttachAsset,
  onDetachAsset,
  onRefreshAsset,
  selectedIds,
  onSelect,
  onReorderElement,
}: Props) {
  const [layersOpen, setLayersOpen] = useState(true);

  // Ô quản lý layer — luôn hiện đầu inspector (kể cả khi không chọn gì).
  const layerBlock = (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card)', marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setLayersOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '9px 11px',
          background: 'transparent',
          border: 'none',
          color: 'var(--t2)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          cursor: 'pointer',
        }}
      >
        <Layers size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Lớp ({slide.elements.length})</span>
        <ChevronDown size={14} style={{ transform: layersOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s', color: 'var(--t4)' }} />
      </button>
      {layersOpen && (
        <div style={{ padding: '0 8px 8px', maxHeight: 220, overflowY: 'auto' }}>
          <LayerPanel
            elements={slide.elements}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleHidden={(id) => onUpdateSlide((s) => { const e = s.elements.find((x) => x.id === id); if (e) e.hidden = !e.hidden; })}
            onToggleLocked={(id) => onUpdateSlide((s) => { const e = s.elements.find((x) => x.id === id); if (e) e.locked = !e.locked; })}
            onRename={(id, name) => onUpdateSlide((s) => { const e = s.elements.find((x) => x.id === id); if (e) e.name = name || undefined; })}
            onReorder={onReorderElement}
          />
        </div>
      )}
    </div>
  );

  // Cụm căn chỉnh + phân bố đều NHIỀU element đã chọn (≥2) — canh theo bounding box CHUNG
  // của chính các phần tử đã chọn, KHÁC "Căn trong slide" bên dưới (canh theo biên sân khấu,
  // chỉ áp cho 1 phần tử). Phân bố đều cần ≥3 phần tử — nút vẫn hiện nhưng disabled khi <3
  // để người dùng biết tính năng có tồn tại (không ẩn hẳn).
  const multiCount = selectedIds.length;

  // P2/E1 (nhóm) — "Nhóm" cần ≥2 phần tử đang chọn; "Bỏ nhóm" hiện khi CÓ ÍT NHẤT 1 phần tử
  // đang chọn thuộc 1 cụm (kể cả multiCount === 1 — chọn 1 dòng trong ô Lớp không tự mở rộng
  // cả cụm, xem PresentEditor.tsx#onSelectGroupAware). Tách riêng khỏi multiBlock (không phụ
  // thuộc onAlignSelection) vì Group/Ungroup là thao tác riêng, có ý nghĩa ngay cả khi <2 phần
  // tử đang chọn (trường hợp Bỏ nhóm 1 dòng).
  const selectedGroupCount = new Set(
    slide.elements.filter((e) => selectedIds.includes(e.id) && e.groupId).map((e) => e.groupId),
  ).size;
  const groupBlock =
    multiCount > 1 || selectedGroupCount > 0 ? (
      <Panel title="Nhóm">
        <Row>
          {multiCount > 1 && (
            <ActionBtn onClick={onGroup} title="Gộp các phần tử đang chọn thành 1 cụm">
              <Group size={14} /> Nhóm
            </ActionBtn>
          )}
          {selectedGroupCount > 0 && (
            <ActionBtn onClick={onUngroup} title="Rã cụm của lựa chọn hiện tại">
              <Ungroup size={14} /> Bỏ nhóm
            </ActionBtn>
          )}
        </Row>
      </Panel>
    ) : null;

  const multiBlock =
    multiCount > 1 && onAlignSelection ? (
      <Panel title={`Căn & phân bố (${multiCount} đối tượng)`}>
        <Sub>Căn theo nhau</Sub>
        <Row>
          <Toggle onClick={() => onAlignSelection('left')} title="Căn trái">
            <AlignStartVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlignSelection('hcenter')} title="Căn giữa ngang">
            <AlignCenterVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlignSelection('right')} title="Căn phải">
            <AlignEndVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlignSelection('top')} title="Căn trên">
            <AlignStartHorizontal size={14} />
          </Toggle>
          <Toggle onClick={() => onAlignSelection('vcenter')} title="Căn giữa dọc">
            <AlignCenterHorizontal size={14} />
          </Toggle>
          <Toggle onClick={() => onAlignSelection('bottom')} title="Căn dưới">
            <AlignEndHorizontal size={14} />
          </Toggle>
        </Row>
        {onDistributeSelection && (
          <>
            <Sub>Phân bố đều {multiCount < 3 ? '(cần ≥3 đối tượng)' : ''}</Sub>
            <Row>
              <ActionBtn
                onClick={() => onDistributeSelection('horizontal')}
                title="Phân bố đều theo chiều ngang"
              >
                <AlignHorizontalDistributeCenter size={14} /> Ngang
              </ActionBtn>
              <ActionBtn
                onClick={() => onDistributeSelection('vertical')}
                title="Phân bố đều theo chiều dọc"
              >
                <AlignVerticalDistributeCenter size={14} /> Dọc
              </ActionBtn>
            </Row>
          </>
        )}
      </Panel>
    ) : null;

  if (!selected) {
    return (
      <>
      {layerBlock}
      {groupBlock}
      {multiBlock}
      <Panel title="Nền slide">
        <Field label="Màu nền">
          <ColorRow
            value={slide.background}
            palette={palette}
            onChange={(c) => onUpdateSlide((s) => (s.background = c))}
          />
        </Field>
        {slide.backgroundImage && (
          <>
            <Row>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>Ảnh nền</span>
              <button
                type="button"
                onClick={() => onUpdateSlide((s) => (s.backgroundImage = null))}
                style={ghostBtn}
              >
                Gỡ ảnh nền
              </button>
            </Row>
            <AdjustControls
              adjust={slide.backgroundAdjust ?? DEFAULT_ADJUST}
              onChange={(a, live) => onUpdateSlide((s) => (s.backgroundAdjust = a), live)}
            />
          </>
        )}
        {/* [marker: taoViecTuDay] — tạo Task {stage:'present', entityId: slide.id} từ trang này */}
        <CreateTaskFromSlide slide={slide} slideIndex={slideIndex} />
        <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.4, marginTop: 4 }}>
          Chọn một phần tử trên slide để chỉnh. Kéo để di chuyển, kéo góc để đổi cỡ, chấm tròn
          trên đỉnh để xoay. Nhấp đúp chữ để sửa nội dung.
        </p>
      </Panel>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {layerBlock}
      {groupBlock}
      {multiBlock}
      {selected.kind === 'text' && (
        <TextInspector
          el={selected}
          palette={palette}
          deckFonts={deckFonts}
          deckCustomFonts={deckCustomFonts}
          onAddDeckFont={onAddDeckFont}
          onUpdate={onUpdateSelected as (m: (el: TextElement) => void, live?: boolean) => void}
        />
      )}
      {selected.kind === 'image' && (
        <ImageInspector
          el={selected}
          palette={palette}
          onUpdate={onUpdateSelected as (m: (el: ImageElement) => void, live?: boolean) => void}
          onOpenEditor={onOpenImageEditor ? () => onOpenImageEditor(selected.id) : undefined}
          onOpenAdvanced={onOpenAdvancedEditor}
          linkedAssets={linkedAssets ?? []}
          onCreateAsset={onCreateAsset}
          onAttachAsset={onAttachAsset}
          onDetachAsset={onDetachAsset}
          onRefreshAsset={onRefreshAsset}
        />
      )}
      {selected.kind === 'shape' && (
        <ShapeInspector
          el={selected}
          palette={palette}
          onUpdate={onUpdateSelected as (m: (el: ShapeElement) => void, live?: boolean) => void}
        />
      )}

      {/* chung */}
      <Panel title="Sắp xếp">
        <Field label={`Độ mờ ${Math.round((selected.opacity ?? 1) * 100)}%`}>
          <input
            type="range"
            min={10}
            max={100}
            value={Math.round((selected.opacity ?? 1) * 100)}
            onChange={(e) => onUpdateSelected((el) => (el.opacity = +e.target.value / 100), true)}
            onPointerUp={(e) => onUpdateSelected((el) => (el.opacity = +(e.target as HTMLInputElement).value / 100))}
            style={{ width: '100%' }}
          />
        </Field>
        {/* P4/E4 — filter chung mọi loại phần tử (text/shape/image), riêng với Sáng/Tương
            phản/Bão hoà/Nhiệt độ chỉ có ở ảnh (AdjustControls bên dưới). Additive: el.filter
            có thể chưa tồn tại (phần tử cũ chưa từng chỉnh) → mặc định DEFAULT_ELEMENT_FILTER
            khi hiển thị, chỉ ghi el.filter khi người dùng thật sự kéo. */}
        <Sub>Hiệu ứng lọc</Sub>
        <FilterControls
          filter={selected.filter}
          onChange={(f, live) => onUpdateSelected((el) => (el.filter = f), live)}
        />

        {/* z-order: lên trước cùng / tiến 1 / lùi 1 / ra sau cùng */}
        <Sub>Thứ tự lớp</Sub>
        <Row>
          <ActionBtn onClick={() => onZOrder('front')} title="Đưa lên trước cùng">
            <ChevronsUp size={14} /> Trước cùng
          </ActionBtn>
          <ActionBtn onClick={() => onZOrder('forward')} title="Tiến 1 bậc">
            <ArrowUp size={14} /> Tiến 1
          </ActionBtn>
        </Row>
        <Row>
          <ActionBtn onClick={() => onZOrder('backward')} title="Lùi 1 bậc">
            <ArrowDown size={14} /> Lùi 1
          </ActionBtn>
          <ActionBtn onClick={() => onZOrder('back')} title="Đưa ra sau cùng">
            <ChevronsDown size={14} /> Sau cùng
          </ActionBtn>
        </Row>

        {/* căn element trong sân khấu */}
        <Sub>Căn trong slide</Sub>
        <Row>
          <Toggle onClick={() => onAlign('left')} title="Căn mép trái">
            <AlignStartVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlign('hcenter')} title="Căn giữa ngang">
            <AlignCenterVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlign('right')} title="Căn mép phải">
            <AlignEndVertical size={14} />
          </Toggle>
          <Toggle onClick={() => onAlign('top')} title="Căn mép trên">
            <AlignStartHorizontal size={14} />
          </Toggle>
          <Toggle onClick={() => onAlign('vcenter')} title="Căn giữa dọc">
            <AlignCenterHorizontal size={14} />
          </Toggle>
          <Toggle onClick={() => onAlign('bottom')} title="Căn mép dưới">
            <AlignEndHorizontal size={14} />
          </Toggle>
        </Row>

        <Sub>Thao tác</Sub>
        <Row>
          <ActionBtn onClick={onDuplicate} title="Nhân bản (Ctrl/Cmd+D)">
            <Copy size={14} /> Nhân bản
          </ActionBtn>
          <ActionBtn
            onClick={onToggleLockSelected}
            title="Khoá/mở khoá (cả cụm nếu đang chọn nhiều)"
          >
            {selected.locked ? <Unlock size={14} /> : <Lock size={14} />}
            {selected.locked ? 'Mở khoá' : 'Khoá'}
          </ActionBtn>
        </Row>
        <Row>
          <ActionBtn onClick={onDelete} title="Xoá (Delete)" danger>
            <Trash2 size={14} /> Xoá phần tử
          </ActionBtn>
        </Row>
      </Panel>
    </div>
  );
}

/* ------------------------------- TEXT ------------------------------- */
function listOf(el: TextElement): ListStyle {
  return effectiveListStyle(el);
}
function setListStyle(
  el: TextElement,
  onUpdate: (m: (el: TextElement) => void, live?: boolean) => void,
  s: ListStyle,
) {
  onUpdate((t) => {
    t.listStyle = s;
    t.bullet = s === 'bullet';
  });
}

function TextInspector({
  el,
  palette,
  deckFonts,
  deckCustomFonts,
  onAddDeckFont,
  onUpdate,
}: {
  el: TextElement;
  palette: string[];
  deckFonts: FontPairing;
  deckCustomFonts?: EmbeddedFont[];
  onAddDeckFont?: (f: EmbeddedFont) => void;
  onUpdate: (m: (el: TextElement) => void, live?: boolean) => void;
}) {
  /* Font tải lên (#1). Dropdown gộp HAI nguồn: font nhúng trong deck (đi theo dự án) +
     thư viện font của máy (tiện dùng lại ở deck khác). Xem lib/present-editor/custom-fonts.ts. */
  const [libFonts, setLibFonts] = useState<CustomFont[]>([]);
  const [fontErr, setFontErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fontFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    registerLibraryFonts().then((list) => alive && setLibFonts(list));
    return () => {
      alive = false;
    };
  }, []);

  // font của deck phải được đăng ký lại mỗi khi deck đổi (mở deck khác / nạp từ IndexedDB)
  useEffect(() => {
    registerFonts(deckCustomFonts);
  }, [deckCustomFonts]);

  const allCustom = mergeFontLists(deckCustomFonts, libFonts);
  const usingCustom = isCustomStack(el.fontFamily, allCustom);

  async function onUploadFont(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFontErr(null);
    setBusy(true);
    try {
      const cf = await addCustomFont(f);
      setLibFonts(await getLibraryFonts());
      onAddDeckFont?.(cf); // nhúng vào deck → mở lại dự án vẫn còn font
      onUpdate((t) => (t.fontFamily = cf.stack)); // áp luôn cho text đang chọn
    } catch (err) {
      // Lỗi font PHẢI hiện ra: bản trước nuốt im lặng, user tưởng app hỏng.
      setFontErr(err instanceof FontError ? err.message : 'Không tải được font này.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <Panel title="Chữ">
      <Field label="Nội dung">
        <textarea
          value={el.text}
          onChange={(e) => onUpdate((t) => (t.text = e.target.value))}
          rows={3}
          style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </Field>
      <Field label="Font chữ">
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            value={el.fontFamily ?? ''}
            onChange={(e) =>
              onUpdate((t) => {
                const v = e.target.value;
                // rỗng = theo bộ chữ của deck; ngược lại ghi đè family riêng cho element
                if (!v) delete t.fontFamily;
                else t.fontFamily = v;
              })
            }
            style={{ ...input, flex: 1 }}
          >
            <option value="">Theo deck ({deckFonts})</option>
            {CURATED_FONTS.map((f) => (
              <option key={f.stack} value={f.stack}>
                {f.label}
              </option>
            ))}
            {allCustom.length > 0 && (
              <optgroup label="Đã tải lên">
                {allCustom.map((f) => (
                  <option key={f.stack} value={f.stack}>
                    {f.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            onClick={() => fontFileRef.current?.click()}
            disabled={busy}
            title="Tải font lên (.ttf/.otf/.woff/.woff2)"
            style={{ ...input, width: 34, cursor: busy ? 'default' : 'pointer', padding: 0, opacity: busy ? 0.5 : 1 }}
          >
            {busy ? '…' : '＋'}
          </button>
          <input
            ref={fontFileRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/*"
            hidden
            onChange={onUploadFont}
          />
        </div>
        {fontErr && (
          <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--danger)' }}>
            {fontErr}
          </p>
        )}
        {usingCustom && (
          /* Ghi chú NHẸ, đúng chỗ — nói rõ mức bảo toàn font TRƯỚC khi user xuất file.
             PDF/PNG: canvas tự vẽ chữ bằng font đã nạp ⇒ ĐÚNG font, không phụ thuộc máy người xem.
             PPTX: file font được NHÚNG THẬT vào .pptx (dạng EOT, chuẩn OOXML) ⇒ máy chưa cài font
             vẫn hiển thị đúng. Ngoại lệ đã chặn có báo: font .woff/.woff2 (dữ liệu đã nén) và font
             bị nhà phát hành cấm nhúng (cờ fsType). Xem lib/pptx-font-embed.ts. */
          <p style={{ margin: '6px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--t3)' }}>
            Font tải lên · Xuất PDF/PNG giữ đúng font. Xuất PPTX nhúng luôn file font (.ttf/.otf) nên
            máy chưa cài vẫn đúng — trừ font .woff/.woff2 hoặc font có giấy phép cấm nhúng.
          </p>
        )}
      </Field>
      <Field label={`Cỡ chữ ${el.fontSize.toFixed(1)}`}>
        <input
          type="range"
          min={1}
          max={20}
          step={0.1}
          value={el.fontSize}
          onChange={(e) => onUpdate((t) => (t.fontSize = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((t) => (t.fontSize = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
      {/* kiểu chữ: đậm / nghiêng / gạch chân / bullet */}
      <Row>
        <Toggle active={el.bold} onClick={() => onUpdate((t) => (t.bold = !t.bold))} title="Đậm">
          <Bold size={14} />
        </Toggle>
        <Toggle
          active={el.italic}
          onClick={() => onUpdate((t) => (t.italic = !t.italic))}
          title="Nghiêng"
        >
          <Italic size={14} />
        </Toggle>
        <Toggle
          active={!!el.underline}
          onClick={() => onUpdate((t) => (t.underline = !t.underline))}
          title="Gạch chân"
        >
          <Underline size={14} />
        </Toggle>
        <Toggle
          active={listOf(el) === 'bullet'}
          onClick={() => setListStyle(el, onUpdate, listOf(el) === 'bullet' ? 'none' : 'bullet')}
          title="Danh sách gạch đầu dòng"
        >
          <List size={14} />
        </Toggle>
        <Toggle
          active={listOf(el) === 'number'}
          onClick={() => setListStyle(el, onUpdate, listOf(el) === 'number' ? 'none' : 'number')}
          title="Danh sách đánh số"
        >
          <ListOrdered size={14} />
        </Toggle>
      </Row>
      {/* căn chữ ngang */}
      <Row>
        <Toggle
          active={el.align === 'left'}
          onClick={() => onUpdate((t) => (t.align = 'left'))}
          title="Căn trái"
        >
          <AlignLeft size={14} />
        </Toggle>
        <Toggle
          active={el.align === 'center'}
          onClick={() => onUpdate((t) => (t.align = 'center'))}
          title="Căn giữa"
        >
          <AlignCenter size={14} />
        </Toggle>
        <Toggle
          active={el.align === 'right'}
          onClick={() => onUpdate((t) => (t.align = 'right'))}
          title="Căn phải"
        >
          <AlignRight size={14} />
        </Toggle>
      </Row>
      <Field label={`Giãn dòng ${(el.lineHeight ?? 1.2).toFixed(2)}`}>
        <input
          type="range"
          min={0.8}
          max={2.4}
          step={0.05}
          value={el.lineHeight ?? 1.2}
          onChange={(e) => onUpdate((t) => (t.lineHeight = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((t) => (t.lineHeight = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label={`Giãn chữ ${el.tracking ?? 0}`}>
        <input
          type="range"
          min={-2}
          max={20}
          step={0.5}
          value={el.tracking ?? 0}
          onChange={(e) => onUpdate((t) => (t.tracking = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((t) => (t.tracking = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
      <Field label="Màu chữ">
        <ColorRow
          value={el.color}
          palette={palette}
          onChange={(c) =>
            // P6a (04/08) — tự chỉnh tay → khoá colorAuto vĩnh viễn (xem TextToolbar.tsx cùng
            // pattern, text-contrast.ts).
            onUpdate((t) => {
              t.color = c;
              t.colorAuto = false;
            })
          }
        />
      </Field>
      <Field label="Sương sau chữ (khi đè ảnh)">
        <button
          type="button"
          onClick={() => onUpdate((t) => (t.scrimEnabled = !t.scrimEnabled))}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: el.scrimEnabled ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: el.scrimEnabled ? 'var(--accent-soft)' : 'var(--field)',
            color: el.scrimEnabled ? 'var(--accent)' : 'var(--t2)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {el.scrimEnabled ? 'Đang bật' : 'Đang tắt'}
        </button>
      </Field>
      </Panel>
      <TextFxPanel el={el} palette={palette} onUpdate={onUpdate} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* HIỆU ỨNG CHỮ (#2) — text effects & typography illustration          */
/* ------------------------------------------------------------------ */

/**
 * Bảng chỉnh hiệu ứng cho chữ tiêu đề. Gu TTT (CLAUDE.md): keyline mảnh, whitespace rộng,
 * nhãn tracked uppercase, KHÔNG loè loẹt — nên bảng MẶC ĐỊNH THU GỌN, chỉ hiện hàng preset;
 * muốn chỉnh sâu thì mở "Tinh chỉnh". Người dùng thường chỉ cần bấm 1 preset là xong.
 */
function TextFxPanel({
  el,
  palette,
  onUpdate,
}: {
  el: TextElement;
  palette: string[];
  onUpdate: (m: (el: TextElement) => void, live?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const fx = el.fx;

  /** Sửa một field của fx (tạo object nếu chưa có). */
  function setFx(mut: (f: TextFx) => void, live?: boolean) {
    onUpdate((t) => {
      t.fx = { ...(t.fx ?? {}) };
      mut(t.fx);
    }, live);
  }

  const shadows = fx?.shadows ?? [];

  function setShadow(i: number, mut: (s: TextShadowLayer) => void, live?: boolean) {
    setFx((f) => {
      const list = [...(f.shadows ?? [])];
      const next = { ...list[i] };
      mut(next);
      list[i] = next;
      f.shadows = list;
    }, live);
  }

  return (
    <Panel title="Hiệu ứng chữ">
      {/* --- Preset: bấm phát dùng ngay --- */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {FX_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.hint}
            onClick={() => onUpdate((t) => (t.fx = applyPreset(t.fx, p)))}
            style={{
              padding: '5px 9px',
              fontSize: 11,
              letterSpacing: '0.04em',
              borderRadius: 3,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--t2)',
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '5px 0',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          borderRadius: 3,
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--t3)',
          cursor: 'pointer',
        }}
      >
        {open ? 'Thu gọn' : 'Tinh chỉnh · Fine-tune'}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Field label="Hoa / thường">
            <select
              value={fx?.transform ?? 'none'}
              onChange={(e) => setFx((f) => (f.transform = e.target.value as TextFx['transform']))}
              style={input}
            >
              <option value="none">Giữ nguyên</option>
              <option value="uppercase">CHỮ HOA</option>
              <option value="lowercase">chữ thường</option>
              <option value="capitalize">Hoa Đầu Từ</option>
            </select>
          </Field>

          <Field label={`Giãn từ ${(fx?.wordSpacing ?? 0).toFixed(1)}`}>
            <input
              type="range"
              min={-1}
              max={6}
              step={0.1}
              value={fx?.wordSpacing ?? 0}
              onChange={(e) => setFx((f) => (f.wordSpacing = +e.target.value), true)}
              onPointerUp={(e) => setFx((f) => (f.wordSpacing = +(e.target as HTMLInputElement).value))}
              style={{ width: '100%' }}
            />
          </Field>

          {/* --- Viền chữ --- */}
          <Field label={`Viền chữ ${(fx?.strokeWidth ?? 0).toFixed(2)}`}>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.01}
              value={fx?.strokeWidth ?? 0}
              onChange={(e) => setFx((f) => (f.strokeWidth = +e.target.value), true)}
              onPointerUp={(e) => setFx((f) => (f.strokeWidth = +(e.target as HTMLInputElement).value))}
              style={{ width: '100%' }}
            />
          </Field>
          {(fx?.strokeWidth ?? 0) > 0 && (
            <>
              <Field label="Màu viền">
                <ColorRow
                  value={fx?.strokeColor ?? el.color}
                  palette={palette}
                  onChange={(c) => setFx((f) => (f.strokeColor = c))}
                />
              </Field>
              <Row>
                <Toggle
                  active={Boolean(fx?.outlineOnly)}
                  onClick={() => setFx((f) => (f.outlineOnly = !f.outlineOnly))}
                  title="Chữ rỗng — chỉ giữ nét viền"
                >
                  <span style={{ fontSize: 11 }}>Chữ rỗng</span>
                </Toggle>
              </Row>
            </>
          )}

          {/* --- Gradient đổ vào lòng chữ --- */}
          <Row>
            <Toggle
              active={Boolean(fx?.gradient)}
              onClick={() =>
                setFx((f) => {
                  f.gradient = f.gradient ? undefined : { from: '#C89B62', to: '#7A5A2E', angle: 100 };
                })
              }
              title="Đổ chuyển sắc vào lòng chữ"
            >
              <span style={{ fontSize: 11 }}>Chuyển sắc</span>
            </Toggle>
          </Row>
          {fx?.gradient && (
            <>
              <Field label="Màu đầu">
                <ColorRow
                  value={fx.gradient.from}
                  palette={palette}
                  onChange={(c) => setFx((f) => (f.gradient = { ...f.gradient!, from: c }))}
                />
              </Field>
              <Field label="Màu cuối">
                <ColorRow
                  value={fx.gradient.to}
                  palette={palette}
                  onChange={(c) => setFx((f) => (f.gradient = { ...f.gradient!, to: c }))}
                />
              </Field>
              <Field label={`Góc ${fx.gradient.angle}°`}>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={fx.gradient.angle}
                  onChange={(e) => setFx((f) => (f.gradient = { ...f.gradient!, angle: +e.target.value }), true)}
                  onPointerUp={(e) =>
                    setFx((f) => (f.gradient = { ...f.gradient!, angle: +(e.target as HTMLInputElement).value }))
                  }
                  style={{ width: '100%' }}
                />
              </Field>
            </>
          )}

          {/* --- Bóng đổ nhiều lớp --- */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)' }}>
              Bóng đổ
            </span>
            {shadows.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setFx((f) => {
                    f.shadows = [...(f.shadows ?? []), { x: 0, y: 0.3, blur: 1, color: 'rgba(20,16,12,0.4)' }];
                  })
                }
                style={{ ...input, width: 'auto', padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}
              >
                + Lớp
              </button>
            )}
          </div>
          {shadows.map((s, i) => (
            <div
              key={i}
              style={{ border: '1px solid var(--border)', borderRadius: 3, padding: 8, marginTop: 6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>Lớp {i + 1}</span>
                <button
                  type="button"
                  title="Xoá lớp bóng"
                  onClick={() =>
                    setFx((f) => {
                      f.shadows = (f.shadows ?? []).filter((_, k) => k !== i);
                    })
                  }
                  style={{ ...input, width: 'auto', padding: '1px 7px', fontSize: 11, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
              <Field label={`Ngang ${s.x.toFixed(2)}`}>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.02}
                  value={s.x}
                  onChange={(e) => setShadow(i, (v) => (v.x = +e.target.value), true)}
                  onPointerUp={(e) => setShadow(i, (v) => (v.x = +(e.target as HTMLInputElement).value))}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label={`Dọc ${s.y.toFixed(2)}`}>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.02}
                  value={s.y}
                  onChange={(e) => setShadow(i, (v) => (v.y = +e.target.value), true)}
                  onPointerUp={(e) => setShadow(i, (v) => (v.y = +(e.target as HTMLInputElement).value))}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label={`Nhoè ${s.blur.toFixed(2)}`}>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.05}
                  value={s.blur}
                  onChange={(e) => setShadow(i, (v) => (v.blur = +e.target.value), true)}
                  onPointerUp={(e) => setShadow(i, (v) => (v.blur = +(e.target as HTMLInputElement).value))}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Màu bóng">
                <ColorRow value={s.color} palette={palette} onChange={(c) => setShadow(i, (v) => (v.color = c))} />
              </Field>
            </div>
          ))}

          {/* --- Uốn cung --- */}
          <Field label={`Uốn cung ${fx?.curve ?? 0}°`}>
            <input
              type="range"
              min={-180}
              max={180}
              step={2}
              value={fx?.curve ?? 0}
              onChange={(e) => setFx((f) => (f.curve = +e.target.value), true)}
              onPointerUp={(e) => setFx((f) => (f.curve = +(e.target as HTMLInputElement).value))}
              style={{ width: '100%' }}
            />
          </Field>
          {Boolean(fx?.curve) && (
            <p style={{ margin: '2px 0 6px', fontSize: 11, lineHeight: 1.45, color: 'var(--t3)' }}>
              Chữ uốn chỉ nhận MỘT dòng — xuống dòng sẽ được nối lại thành một dòng.
            </p>
          )}

          {/* --- Hoà trộn --- */}
          <Field label="Hoà trộn">
            <select
              value={fx?.blend ?? 'normal'}
              onChange={(e) => setFx((f) => (f.blend = e.target.value as TextFx['blend']))}
              style={input}
            >
              <option value="normal">Bình thường</option>
              <option value="multiply">Nhân (đậm lại)</option>
              <option value="screen">Màn (sáng lên)</option>
              <option value="overlay">Phủ</option>
              <option value="difference">Khác biệt</option>
              <option value="luminosity">Độ sáng</option>
            </select>
          </Field>

          <p style={{ margin: '8px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--t3)' }}>
            Hiệu ứng giữ nguyên khi xuất PDF/PNG. Xuất PPTX chỉ giữ chữ và màu — viền, bóng,
            chuyển sắc và uốn cung sẽ phẳng lại.
          </p>
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------- IMAGE ------------------------------- */
function ImageInspector({
  el,
  palette,
  onUpdate,
  onOpenEditor,
  onOpenAdvanced,
  linkedAssets = [],
  onCreateAsset,
  onAttachAsset,
  onDetachAsset,
  onRefreshAsset,
}: {
  el: ImageElement;
  palette: string[];
  onUpdate: (m: (el: ImageElement) => void, live?: boolean) => void;
  onOpenEditor?: () => void;
  onOpenAdvanced?: (id: string) => void;
  linkedAssets?: LinkedAsset[];
  onCreateAsset?: () => void;
  onAttachAsset?: (assetId: string) => void;
  onDetachAsset?: () => void;
  onRefreshAsset?: (assetId: string, dataUrl: string, fingerprint: string) => void;
}) {
  const crop = el.crop;
  // asset khác (không phải asset chính ảnh này) — để gợi ý "dùng lại" trong dropdown.
  const otherAssets = linkedAssets.filter((a) => a.id !== el.assetId);
  // T2 — asset CHÍNH của ảnh đang chọn (nếu có), để đọc `recipe` (§3 SPEC-TRINH-ONG-KINH-DU-LIEU).
  const currentAsset = linkedAssets.find((a) => a.id === el.assetId);
  const diskPathInputRef = useRef<HTMLInputElement>(null);
  const onPickUpdatedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho chọn lại đúng cùng 1 file lần sau nếu cần
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      onUpdate((im) => {
        im.src = dataUrl;
        im.diskPath = file.name;
        im.diskPathMissing = false;
      });
    };
    reader.readAsDataURL(file);
  };
  return (
    <Panel title="Ảnh">
      <input
        ref={diskPathInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPickUpdatedFile}
      />
      {onOpenEditor && (
        <button
          type="button"
          onClick={onOpenEditor}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            padding: '9px',
            borderRadius: 10,
            border: '1px solid var(--accent)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 12,
            cursor: 'pointer',
          }}
          title="Mở chế độ chỉnh ảnh (hoặc nhấp đúp / chuột phải ảnh)"
        >
          <SlidersHorizontal size={14} /> Chỉnh ảnh (crop · lọc · thay ảnh)
        </button>
      )}
      {onOpenAdvanced && (
        <button type="button" onClick={() => onOpenAdvanced(el.id)} style={ghostBtn} title="Layers · mask · clone (mở /photo-editor)">
          <Wand2 size={12} /> Chỉnh ảnh nâng cao (Photoshop)
        </button>
      )}
      <Sub>Liên kết file trên máy</Sub>
      {el.diskPathMissing && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#c0392b', lineHeight: 1.4, margin: '0 0 6px' }}>
          <AlertTriangle size={12} /> Lần cập nhật gần nhất không đúng file — kiểm tra lại.
        </p>
      )}
      {el.diskPath && (
        <p style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.4, margin: '0 0 6px', wordBreak: 'break-all' }}>
          Đang liên kết: <strong style={{ color: 'var(--t2)' }}>{el.diskPath}</strong>
        </p>
      )}
      <button
        type="button"
        onClick={() => diskPathInputRef.current?.click()}
        style={ghostBtn}
        title="Chọn lại file thật trên máy — cập nhật ảnh này theo file vừa chọn (thao tác tay một lần — máy không theo dõi file)"
      >
        <RefreshCw size={12} /> {el.diskPath ? 'Cập nhật liên kết' : 'Liên kết với file trên máy'}
      </button>
      {(onCreateAsset || onAttachAsset || onDetachAsset) && (
        <>
          <Sub>Tài sản liên kết</Sub>
          {el.assetId ? (
            <>
              <p style={{ fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.4, margin: '0 0 6px' }}>
                Ảnh này đang LIÊN KẾT — sửa qua &quot;Chỉnh ảnh nâng cao&quot; rồi ghi về sẽ cập
                nhật MỌI slide dùng chung ảnh này.
              </p>
              {onDetachAsset && (
                <button type="button" onClick={onDetachAsset} style={ghostBtn} title="Tách ảnh này ra khỏi tài sản chung">
                  <Unlink size={12} /> Gỡ liên kết
                </button>
              )}
              {currentAsset?.recipe && (
                <RecipeStatus asset={currentAsset} onUpdate={onUpdate} onRefreshAsset={onRefreshAsset} />
              )}
            </>
          ) : (
            <>
              {onCreateAsset && (
                <button
                  type="button"
                  onClick={onCreateAsset}
                  style={ghostBtn}
                  title="Đặt ảnh này làm nguồn dùng chung — gắn thêm ảnh khác vào sẽ đồng bộ theo"
                >
                  <Link2 size={12} /> Đặt làm tài sản dùng chung
                </button>
              )}
              {onAttachAsset && otherAssets.length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) onAttachAsset(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    marginTop: 6,
                    fontSize: 11.5,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--field)',
                    color: 'var(--t2)',
                  }}
                >
                  <option value="" disabled>
                    Dùng ảnh liên kết có sẵn…
                  </option>
                  {otherAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || a.id}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </>
      )}
      <AdjustControls adjust={el.adjust} onChange={(a, live) => onUpdate((im) => (im.adjust = a), live)} />
      <Field label={`Bo góc ${el.radius ?? 0}%`}>
        <input
          type="range"
          min={0}
          max={50}
          value={el.radius ?? 0}
          disabled={!!el.mask}
          onChange={(e) => onUpdate((im) => (im.radius = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((im) => (im.radius = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
      {/* P1/E2 — mask theo hình. Có mask → chiếm quyền cắt, "Bo góc" ở trên bị vô hiệu (khoá
          input, KHÔNG ẩn — người dùng vẫn thấy field đó tồn tại, chỉ tạm không tác dụng). */}
      <Field label="Cắt ảnh theo hình">
        <select
          value={el.mask?.shape ?? ''}
          onChange={(e) => {
            const shape = e.target.value as ImageMaskShape | '';
            onUpdate((im) =>
              (im.mask = shape
                ? { shape, sides: shape === 'polygon' ? (im.mask?.sides ?? 5) : undefined }
                : undefined),
            );
          }}
          style={{
            width: '100%',
            fontSize: 11.5,
            padding: '6px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--field)',
            color: 'var(--t2)',
          }}
        >
          <option value="">Không (chữ nhật/bo góc)</option>
          <option value="ellipse">Tròn</option>
          <option value="triangle">Tam giác</option>
          <option value="polygon">Đa giác</option>
          <option value="arrow">Mũi tên</option>
        </select>
      </Field>
      {el.mask?.shape === 'polygon' && (
        <Field label={`Số cạnh ${el.mask.sides ?? 5}`}>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={el.mask.sides ?? 5}
            onChange={(e) =>
              onUpdate((im) => {
                if (im.mask) im.mask.sides = +e.target.value;
              }, true)
            }
            onPointerUp={(e) =>
              onUpdate((im) => {
                if (im.mask) im.mask.sides = +(e.target as HTMLInputElement).value;
              })
            }
            style={{ width: '100%' }}
          />
        </Field>
      )}
      <Sub>Cắt ảnh (crop)</Sub>
      <CropSlider label="Trái" value={crop.x} max={0.9} onChange={(v, live) => onUpdate((im) => (im.crop = clampCrop({ ...crop, x: v })), live)} />
      <CropSlider label="Trên" value={crop.y} max={0.9} onChange={(v, live) => onUpdate((im) => (im.crop = clampCrop({ ...crop, y: v })), live)} />
      <CropSlider label="Rộng" value={crop.w} min={0.1} onChange={(v, live) => onUpdate((im) => (im.crop = clampCrop({ ...crop, w: v })), live)} />
      <CropSlider label="Cao" value={crop.h} min={0.1} onChange={(v, live) => onUpdate((im) => (im.crop = clampCrop({ ...crop, h: v })), live)} />
      <button
        type="button"
        onClick={() => onUpdate((im) => (im.crop = { x: 0, y: 0, w: 1, h: 1 }))}
        style={ghostBtn}
      >
        <RotateCcw size={12} /> Bỏ crop
      </button>
      <FillOverlayControls el={el} onUpdate={onUpdate} palette={palette} />
    </Panel>
  );
}

/**
 * T2 (`docs/SPEC-TRINH-ONG-KINH-DU-LIEU.md` §3) — trạng thái "ảnh có công thức" của asset đang
 * chọn: báo cờ CŨ khi Doc CAD nguồn đã đổi từ lúc render (so `boqFingerprint` đã lưu với vân tay
 * SỐNG, qua `getProjectDoc` — CÙNG cầu dữ liệu T1 đã dùng cho BOQ, không dựng đường đọc Doc thứ
 * hai) + nút "Làm mới từ bản vẽ" (dựng lại ảnh bằng ĐÚNG công thức, `renderRecipeImage`).
 *
 * KHÔNG tự động chạy khi mount — chỉ ĐO (đọc, không sinh phụ) mỗi khi `asset.recipe`/dự án đổi,
 * đúng luật L5 "không ghi ngược/tự đổi sau lưng". `projectId` đọc từ URL (`useParams`, CÙNG cách
 * `components/present-editor/PresentStageScreen.tsx` lấy — route `/projects/[id]/present`) —
 * KHÔNG cần PresentEditor.tsx truyền prop mới (ngoài vùng file được sửa của việc này).
 *
 * GIỚI HẠN ĐÃ BIẾT (khai thật, không giấu): thiếu `onRefreshAsset` (PresentEditor.tsx CHƯA nối,
 * xem ghi chú ở `Props.onRefreshAsset` phía trên) → nút này CHỈ cập nhật ảnh đang chọn qua
 * `onUpdate`, KHÔNG lan sang các slide KHÁC đang dùng chung `assetId` — registry (`deck.
 * linkedAssets`) không đổi nên badge "cũ" có thể hiện lại đúng ở CÁC INSTANCE KHÁC cho tới khi
 * PresentEditor.tsx nối `onRefreshAsset` (xem báo cáo phiên cho đoạn code cần thêm).
 */
function RecipeStatus({
  asset,
  onUpdate,
  onRefreshAsset,
}: {
  asset: LinkedAsset;
  onUpdate: (m: (el: ImageElement) => void, live?: boolean) => void;
  onRefreshAsset?: (assetId: string, dataUrl: string, fingerprint: string) => void;
}) {
  const recipe = asset.recipe;
  const params = useParams<{ id?: string }>();
  // recipe.projectId (dự án LÚC TẠO ảnh) ưu tiên hơn URL hiện tại (ảnh có thể chèn chéo dự án) —
  // rơi về URL khi recipe chưa từng khai projectId (không nên xảy ra, nhưng không throw).
  const projectId = recipe?.projectId || params?.id || '';
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId) ?? '';
  const [stale, setStale] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!recipe || !projectId) { setStale(null); return; }
    void (async () => {
      const { doc, source } = await getProjectDoc(userId, projectId);
      if (cancelled) return;
      // source === 'none' → không xác định được Doc SỐNG (chưa từng mở Thiết kế 2D trong phiên
      // này) — KHÔNG kết luận "cũ" khi không chắc (§ tinh thần isLinkedAssetStale, tránh báo sai).
      setStale(source === 'none' ? null : isLinkedAssetStale(asset, computeCadPlanFingerprint(doc)));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, recipe?.fingerprint, asset.updatedAt]);

  if (!recipe) return null;

  async function handleRefresh() {
    setBusy(true);
    setError(null);
    try {
      if (!projectId) {
        setError('Chưa xác định được dự án nguồn — mở lại Thiết kế 2D của dự án này rồi thử lại.');
        return;
      }
      const { doc, source } = await getProjectDoc(userId, projectId);
      if (source === 'none') {
        setError('Không đọc được bản vẽ CAD của dự án này trong phiên hiện tại — mở lại chặng ' +
          'Thiết kế 2D một lần (để nạp bản vẽ), rồi quay lại đây bấm "Làm mới từ bản vẽ".');
        return;
      }
      const dataUrl = renderRecipeImage(doc, recipe as NonNullable<LinkedAsset['recipe']>);
      if (!dataUrl) {
        setError('Không dựng được ảnh từ bản vẽ (bản vẽ trống hoặc lỗi khi vẽ lại) — kiểm tra ' +
          'Thiết kế 2D còn nội dung không.');
        return;
      }
      const fingerprint = computeCadPlanFingerprint(doc);
      onUpdate((im) => { im.src = dataUrl; });
      onRefreshAsset?.(asset.id, dataUrl, fingerprint);
      setStale(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {stale && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--warning)', lineHeight: 1.4, margin: '6px 0' }}>
          <AlertTriangle size={12} /> Bản vẽ đã đổi từ lúc chèn ảnh này.
        </p>
      )}
      {error && (
        <p style={{ fontSize: 10.5, color: '#c0392b', lineHeight: 1.4, margin: '4px 0' }}>{error}</p>
      )}
      <button
        type="button"
        onClick={handleRefresh}
        disabled={busy}
        style={{ ...ghostBtn, opacity: busy ? 0.6 : 1 }}
        title="Dựng lại ảnh này từ bản vẽ Thiết kế 2D hiện tại (Doc sống) — KHÔNG phải bản chụp cũ"
      >
        <RefreshCw size={12} /> {busy ? 'Đang làm mới…' : 'Làm mới từ bản vẽ'}
      </button>
    </>
  );
}

function clampCrop(c: CropRect): CropRect {
  const w = Math.min(Math.max(c.w, 0.1), 1);
  const h = Math.min(Math.max(c.h, 0.1), 1);
  const x = Math.min(Math.max(c.x, 0), 1 - w);
  const y = Math.min(Math.max(c.y, 0), 1 - h);
  return { x, y, w, h };
}

function CropSlider({
  label,
  value,
  min = 0,
  max = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number, live: boolean) => void;
}) {
  return (
    <Field label={`${label} ${Math.round(value * 100)}%`}>
      <input
        type="range"
        min={min}
        max={max}
        step={0.01}
        value={value}
        onChange={(e) => onChange(+e.target.value, true)}
        onPointerUp={(e) => onChange(+(e.target as HTMLInputElement).value, false)}
        style={{ width: '100%' }}
      />
    </Field>
  );
}

/* ------------------------------- SHAPE ------------------------------- */
function ShapeInspector({
  el,
  palette,
  onUpdate,
}: {
  el: ShapeElement;
  palette: string[];
  onUpdate: (m: (el: ShapeElement) => void, live?: boolean) => void;
}) {
  return (
    <Panel title="Hình">
      {el.shape !== 'line' && (
        <Field label="Màu nền">
          <ColorRow
            value={el.fill}
            palette={palette}
            allowTransparent
            onChange={(c) => onUpdate((s) => (s.fill = c))}
          />
        </Field>
      )}
      <Field label="Màu viền / đường">
        <ColorRow value={el.stroke} palette={palette} onChange={(c) => onUpdate((s) => (s.stroke = c))} />
      </Field>
      <Field label={`Độ dày ${el.strokeWidth}`}>
        <input
          type="range"
          min={0}
          max={20}
          step={0.5}
          value={el.strokeWidth}
          onChange={(e) => onUpdate((s) => (s.strokeWidth = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((s) => (s.strokeWidth = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
      {el.shape === 'rect' && (
        <Field label={`Bo góc ${el.radius ?? 0}%`}>
          <input
            type="range"
            min={0}
            max={50}
            value={el.radius ?? 0}
            onChange={(e) => onUpdate((s) => (s.radius = +e.target.value), true)}
            onPointerUp={(e) => onUpdate((s) => (s.radius = +(e.target as HTMLInputElement).value))}
            style={{ width: '100%' }}
          />
        </Field>
      )}
      {el.shape === 'polygon' && (
        <Field label={`Số cạnh ${el.sides ?? 5}`}>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={el.sides ?? 5}
            onChange={(e) => onUpdate((s) => (s.sides = +e.target.value), true)}
            onPointerUp={(e) => onUpdate((s) => (s.sides = +(e.target as HTMLInputElement).value))}
            style={{ width: '100%' }}
          />
        </Field>
      )}
      {el.shape !== 'line' && <GradientControls el={el} onUpdate={onUpdate} palette={palette} />}
      {el.shape !== 'line' && <FillOverlayControls el={el} onUpdate={onUpdate} palette={palette} />}
    </Panel>
  );
}

/**
 * P3/E3 — lớp phủ FILL (`{kind, color, colorTo?, direction?, opacity, blend?}`) dùng CHUNG cho
 * ẢNH + HÌNH (generic theo `T`) — khác `GradientControls` bên dưới (gradient MỜ ĐEN, mask alpha,
 * chỉ shape) và khác gradient MÀU chữ (`TextFx.gradient`, Inspector "Hiệu ứng chữ"): đây là 1
 * lớp MÀU/GRADIENT THẬT tô ĐÈ lên fill/ảnh gốc, có blend mode riêng (mirror `render.ts`
 * `makeOverlayGradient`/`applyFillOverlayStyle` + `shape-geometry.ts#fillOverlayCss` — 1 nguồn
 * sự thật cho hình học/màu, xem 2 file đó). Cộng thêm (additive) — KHÔNG thay thế `gradient` cũ
 * của shape (`OpacityGradient`, @deprecated nhưng vẫn hoạt động — `.idfp` cũ mở lại vẫn y hệt).
 */
function FillOverlayControls<T extends { fillOverlay?: FillOverlay }>({
  el,
  onUpdate,
  palette,
}: {
  el: T;
  onUpdate: (m: (el: T) => void, live?: boolean) => void;
  palette: string[];
}) {
  const o = el.fillOverlay;
  const on = !!o;
  const dirs: { id: NonNullable<FillOverlay['direction']>; label: string }[] = [
    { id: 'ltr', label: 'Trái → phải' },
    { id: 'rtl', label: 'Phải → trái' },
    { id: 'ttb', label: 'Trên → dưới' },
    { id: 'btt', label: 'Dưới → trên' },
    { id: 'center', label: 'Từ giữa' },
    { id: 'edges', label: 'Hai phía' },
  ];
  const blends: { id: NonNullable<FillOverlay['blend']>; label: string }[] = [
    { id: 'normal', label: 'Thường' },
    { id: 'multiply', label: 'Nhân (multiply)' },
    { id: 'screen', label: 'Màn chiếu (screen)' },
    { id: 'overlay', label: 'Chồng (overlay)' },
    { id: 'difference', label: 'Khác biệt' },
    { id: 'luminosity', label: 'Độ sáng' },
  ];
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row>
        <span style={{ fontSize: 11, color: 'var(--t3)', flex: 1 }}>Lớp phủ (fill overlay)</span>
        <Toggle
          active={on}
          onClick={() =>
            onUpdate((e) => {
              e.fillOverlay = on ? undefined : { kind: 'color', color: '#000000', opacity: 0.3 };
            })
          }
          title={on ? 'Tắt lớp phủ' : 'Bật lớp phủ'}
        >
          {on ? 'Bật' : 'Tắt'}
        </Toggle>
      </Row>
      {on && o && (
        <>
          <Field label="Kiểu phủ">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5 }}>
              <button
                type="button"
                onClick={() => onUpdate((e) => { if (e.fillOverlay) e.fillOverlay.kind = 'color'; })}
                style={{
                  padding: '6px 4px',
                  borderRadius: 6,
                  fontSize: 10,
                  border: o.kind === 'color' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: o.kind === 'color' ? 'var(--accent-soft)' : 'var(--field)',
                  color: o.kind === 'color' ? 'var(--accent)' : 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                Màu
              </button>
              <button
                type="button"
                onClick={() => onUpdate((e) => { if (e.fillOverlay) e.fillOverlay.kind = 'gradient'; })}
                style={{
                  padding: '6px 4px',
                  borderRadius: 6,
                  fontSize: 10,
                  border: o.kind === 'gradient' ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: o.kind === 'gradient' ? 'var(--accent-soft)' : 'var(--field)',
                  color: o.kind === 'gradient' ? 'var(--accent)' : 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                Gradient
              </button>
            </div>
          </Field>
          <Field label={o.kind === 'gradient' ? 'Màu đầu' : 'Màu phủ'}>
            <ColorRow
              value={o.color}
              palette={palette}
              onChange={(c) => onUpdate((e) => { if (e.fillOverlay) e.fillOverlay.color = c; })}
            />
          </Field>
          {o.kind === 'gradient' && (
            <>
              <Field label="Màu cuối">
                <ColorRow
                  value={o.colorTo ?? o.color}
                  palette={palette}
                  onChange={(c) => onUpdate((e) => { if (e.fillOverlay) e.fillOverlay.colorTo = c; })}
                />
              </Field>
              <Field label="Hướng">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                  {dirs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onUpdate((e) => { if (e.fillOverlay) e.fillOverlay.direction = d.id; })}
                      style={{
                        padding: '6px 4px',
                        borderRadius: 6,
                        fontSize: 10,
                        border: (o.direction ?? 'ltr') === d.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: (o.direction ?? 'ltr') === d.id ? 'var(--accent-soft)' : 'var(--field)',
                        color: (o.direction ?? 'ltr') === d.id ? 'var(--accent)' : 'var(--t2)',
                        cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          <Field label={`Độ mờ ${Math.round(o.opacity * 100)}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(o.opacity * 100)}
              onChange={(e) => onUpdate((el2) => { if (el2.fillOverlay) el2.fillOverlay.opacity = +e.target.value / 100; }, true)}
              onPointerUp={(e) =>
                onUpdate((el2) => {
                  if (el2.fillOverlay) el2.fillOverlay.opacity = +(e.target as HTMLInputElement).value / 100;
                })
              }
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Hoà trộn (blend)">
            <select
              value={o.blend ?? 'normal'}
              onChange={(e) =>
                onUpdate((el2) => {
                  if (el2.fillOverlay) el2.fillOverlay.blend = e.target.value as FillOverlay['blend'];
                })
              }
              style={{
                width: '100%',
                fontSize: 11.5,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t2)',
              }}
            >
              {blends.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </div>
  );
}

/* --------------------- Gradient MỜ có hướng cho shape --------------------- */
function GradientControls({
  el,
  onUpdate,
  palette,
}: {
  el: ShapeElement;
  onUpdate: (m: (el: ShapeElement) => void, live?: boolean) => void;
  palette: string[];
}) {
  const g = el.gradient;
  const on = !!g;
  const dirs: { id: NonNullable<ShapeElement['gradient']>['direction']; label: string }[] = [
    { id: 'ltr', label: 'Trái → phải' },
    { id: 'rtl', label: 'Phải → trái' },
    { id: 'ttb', label: 'Trên → dưới' },
    { id: 'btt', label: 'Dưới → trên' },
    { id: 'center', label: 'Từ giữa' },
    { id: 'edges', label: 'Hai phía' },
  ];
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row>
        <span style={{ fontSize: 11, color: 'var(--t3)', flex: 1 }}>Gradient mờ (theo hướng)</span>
        <Toggle
          active={on}
          onClick={() =>
            onUpdate((s) => {
              s.gradient = on ? undefined : { direction: 'ltr', from: 1, to: 0 };
            })
          }
          title={on ? 'Tắt gradient mờ' : 'Bật gradient mờ'}
        >
          {on ? 'Bật' : 'Tắt'}
        </Toggle>
      </Row>
      {on && g && (
        <>
          <Field label="Hướng mờ">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {dirs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onUpdate((s) => { if (s.gradient) s.gradient.direction = d.id; })}
                  style={{
                    padding: '6px 4px',
                    borderRadius: 6,
                    fontSize: 10,
                    border: g.direction === d.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: g.direction === d.id ? 'var(--accent-soft)' : 'var(--field)',
                    color: g.direction === d.id ? 'var(--accent)' : 'var(--t2)',
                    cursor: 'pointer',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Mờ đầu ${Math.round(g.from * 100)}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(g.from * 100)}
              onChange={(e) => onUpdate((s) => { if (s.gradient) s.gradient.from = +e.target.value / 100; }, true)}
              onPointerUp={(e) => onUpdate((s) => { if (s.gradient) s.gradient.from = +(e.target as HTMLInputElement).value / 100; })}
              style={{ width: '100%' }}
            />
          </Field>
          <Field label={`Mờ cuối ${Math.round(g.to * 100)}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(g.to * 100)}
              onChange={(e) => onUpdate((s) => { if (s.gradient) s.gradient.to = +e.target.value / 100; }, true)}
              onPointerUp={(e) => onUpdate((s) => { if (s.gradient) s.gradient.to = +(e.target as HTMLInputElement).value / 100; })}
              style={{ width: '100%' }}
            />
          </Field>
          <Field label="Màu (chỉnh trực tiếp)">
            <ColorRow value={el.fill} palette={palette} allowTransparent onChange={(c) => onUpdate((s) => (s.fill = c))} />
          </Field>
        </>
      )}
    </div>
  );
}

/* --------------------------- Adjust sliders --------------------------- */
function AdjustControls({
  adjust,
  onChange,
}: {
  adjust: ImageAdjust;
  onChange: (a: ImageAdjust, live: boolean) => void;
}) {
  const set = (k: keyof ImageAdjust, v: number, live: boolean) => onChange({ ...adjust, [k]: v }, live);
  return (
    <>
      <Slider label="Sáng" value={adjust.brightness} min={20} max={200} onChange={(v, l) => set('brightness', v, l)} />
      <Slider label="Tương phản" value={adjust.contrast} min={20} max={200} onChange={(v, l) => set('contrast', v, l)} />
      <Slider label="Độ bão hoà" value={adjust.saturate} min={0} max={250} onChange={(v, l) => set('saturate', v, l)} />
      <Slider label="Nhiệt độ" value={adjust.temperature} min={-100} max={100} onChange={(v, l) => set('temperature', v, l)} />
    </>
  );
}

/** P4/E4 — filter chung (blur/brightness/contrast/saturate) cho MỌI loại phần tử. Khác
 * AdjustControls (sáng/tương phản/bão hoà/nhiệt độ) chỉ dành riêng cho ảnh. */
function FilterControls({
  filter,
  onChange,
}: {
  filter: ElementFilter | undefined;
  onChange: (f: ElementFilter, live: boolean) => void;
}) {
  const f = filter ?? DEFAULT_ELEMENT_FILTER;
  const set = (k: keyof ElementFilter, v: number, live: boolean) => onChange({ ...f, [k]: v }, live);
  return (
    <>
      <Slider label="Mờ" value={f.blur} min={0} max={40} onChange={(v, l) => set('blur', v, l)} />
      <Slider label="Sáng" value={f.brightness} min={20} max={200} onChange={(v, l) => set('brightness', v, l)} />
      <Slider label="Tương phản" value={f.contrast} min={20} max={200} onChange={(v, l) => set('contrast', v, l)} />
      <Slider label="Độ bão hoà" value={f.saturate} min={0} max={250} onChange={(v, l) => set('saturate', v, l)} />
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number, live: boolean) => void;
}) {
  return (
    <Field label={`${label} ${value}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value, true)}
        onPointerUp={(e) => onChange(+(e.target as HTMLInputElement).value, false)}
        style={{ width: '100%' }}
      />
    </Field>
  );
}

/* ------------------------------- UI bits ------------------------------- */
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--card)',
        padding: 12,
      }}
    >
      <h4
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: 'var(--t3)',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{label}</span>
      {children}
    </label>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginTop: 2 }}>{children}</div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>;
}

function Toggle({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 34,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 6,
        border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent)' : 'var(--t2)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minWidth: 90,
        padding: '8px 6px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: danger ? '#e5674f' : 'var(--t2)',
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function ColorRow({
  value,
  palette,
  onChange,
  allowTransparent,
}: {
  value: string;
  palette: string[];
  onChange: (c: string) => void;
  allowTransparent?: boolean;
}) {
  const swatches = [...new Set([...(palette || []), '#ffffff', '#000000'])].slice(0, 8);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 32, height: 28, border: '1px solid var(--border)', borderRadius: 6, background: 'none', padding: 0 }}
      />
      {swatches.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={c}
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: c,
            border: value.toLowerCase() === c.toLowerCase() ? '2px solid var(--accent)' : '1px solid var(--border)',
            cursor: 'pointer',
          }}
        />
      ))}
      {allowTransparent && (
        <button type="button" onClick={() => onChange('transparent')} style={ghostBtn}>
          Trong suốt
        </button>
      )}
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 12,
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t3)',
  fontSize: 11,
  cursor: 'pointer',
};

/**
 * [marker: taoViecTuDay] — nút nhỏ trong Inspector trang (phiếu focus-entity-2d-present ô④):
 * tạo Task {stage:'present', entityId: slide.id} qua POST /api/tasks sẵn có; title gợi ý theo
 * chữ đầu tiên trên trang hoặc "Trang N". Xong hiện xác nhận + lối mở Bảng việc (không tự
 * điều hướng — người dùng đang dàn trang, không giật họ đi nơi khác).
 */
function CreateTaskFromSlide({ slide, slideIndex }: { slide: EditorSlide; slideIndex?: number }) {
  const params = useParams<{ id?: string }>();
  const storeProjectId = useFlowStore((s) => s.currentProjectId);
  const projectId = params?.id || storeProjectId || '';
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [errText, setErrText] = useState('');

  const pageName = `Trang ${typeof slideIndex === 'number' ? slideIndex + 1 : 1}`;
  const firstText = slide.elements.find(
    (e): e is Extract<SlideElement, { kind: 'text' }> => e.kind === 'text' && !!e.text.trim(),
  );

  const run = () => {
    if (!projectId || state === 'busy') return;
    setState('busy');
    void postTaskFromHere({
      projectId,
      stage: 'present',
      entityId: slide.id,
      title: suggestedTaskTitle(firstText?.text.split('\n')[0] ?? '', pageName),
    }).then((r) => {
      if (r.ok) setState('done');
      else { setErrText(r.error); setState('error'); }
    });
  };

  return (
    <Row>
      <button
        type="button"
        onClick={run}
        disabled={!projectId || state === 'busy'}
        title={!projectId
          ? 'Chưa xác định dự án — mở hồ sơ từ trang Dự án'
          : `Tạo việc gắn ${pageName} vào Bảng việc`}
        style={{ ...ghostBtn, opacity: !projectId || state === 'busy' ? 0.55 : 1 }}
      >
        {state === 'busy' ? 'Đang tạo việc…' : 'Tạo việc từ đây'}
      </button>
      {state === 'done' && (
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
          Đã tạo việc ·{' '}
          <a href={TASK_BOARD_ROUTE} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Mở Bảng việc
          </a>
        </span>
      )}
      {state === 'error' && (
        <span style={{ fontSize: 11, color: 'var(--danger)' }}>Không tạo được: {errText}</span>
      )}
    </Row>
  );
}
