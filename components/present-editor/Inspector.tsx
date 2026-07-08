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
} from '@/lib/present-editor/model';
import type { FontPairing } from '@/lib/slides';
import { DEFAULT_ADJUST } from '@/lib/present-editor/model';
import { CURATED_FONTS } from '@/lib/present-editor/fonts';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  RotateCcw,
} from 'lucide-react';

/** Kiểu căn element trong sân khấu. */
type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

interface Props {
  slide: EditorSlide;
  selected: SlideElement | null;
  palette: string[];
  deckFonts: FontPairing;
  onUpdateSelected: (mutate: (el: SlideElement) => void, live?: boolean) => void;
  onUpdateSlide: (mutate: (s: EditorSlide) => void, live?: boolean) => void;
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  onAlign: (mode: AlignMode) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function Inspector({
  slide,
  selected,
  palette,
  deckFonts,
  onUpdateSelected,
  onUpdateSlide,
  onZOrder,
  onAlign,
  onDuplicate,
  onDelete,
}: Props) {
  if (!selected) {
    return (
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
        <p style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.4, marginTop: 4 }}>
          Chọn một phần tử trên slide để chỉnh. Kéo để di chuyển, kéo góc để đổi cỡ, chấm tròn
          trên đỉnh để xoay. Nhấp đúp chữ để sửa nội dung.
        </p>
      </Panel>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected.kind === 'text' && (
        <TextInspector
          el={selected}
          palette={palette}
          deckFonts={deckFonts}
          onUpdate={onUpdateSelected as (m: (el: TextElement) => void, live?: boolean) => void}
        />
      )}
      {selected.kind === 'image' && (
        <ImageInspector
          el={selected}
          onUpdate={onUpdateSelected as (m: (el: ImageElement) => void, live?: boolean) => void}
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
            onClick={() => onUpdateSelected((el) => (el.locked = !el.locked))}
            title="Khoá/mở khoá"
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
function TextInspector({
  el,
  palette,
  deckFonts,
  onUpdate,
}: {
  el: TextElement;
  palette: string[];
  deckFonts: FontPairing;
  onUpdate: (m: (el: TextElement) => void, live?: boolean) => void;
}) {
  return (
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
          style={input}
        >
          <option value="">Theo deck ({deckFonts})</option>
          {CURATED_FONTS.map((f) => (
            <option key={f.stack} value={f.stack}>
              {f.label}
            </option>
          ))}
        </select>
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
          active={!!el.bullet}
          onClick={() => onUpdate((t) => (t.bullet = !t.bullet))}
          title="Danh sách gạch đầu dòng"
        >
          <List size={14} />
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
        <ColorRow value={el.color} palette={palette} onChange={(c) => onUpdate((t) => (t.color = c))} />
      </Field>
    </Panel>
  );
}

/* ------------------------------- IMAGE ------------------------------- */
function ImageInspector({
  el,
  onUpdate,
}: {
  el: ImageElement;
  onUpdate: (m: (el: ImageElement) => void, live?: boolean) => void;
}) {
  const crop = el.crop;
  return (
    <Panel title="Ảnh">
      <AdjustControls adjust={el.adjust} onChange={(a, live) => onUpdate((im) => (im.adjust = a), live)} />
      <Field label={`Bo góc ${el.radius ?? 0}%`}>
        <input
          type="range"
          min={0}
          max={50}
          value={el.radius ?? 0}
          onChange={(e) => onUpdate((im) => (im.radius = +e.target.value), true)}
          onPointerUp={(e) => onUpdate((im) => (im.radius = +(e.target as HTMLInputElement).value))}
          style={{ width: '100%' }}
        />
      </Field>
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
    </Panel>
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
    </Panel>
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
        borderRadius: 7,
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
            borderRadius: 5,
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
  borderRadius: 7,
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
