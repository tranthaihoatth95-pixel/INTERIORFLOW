'use client';

/**
 * components/photo-editor/PhotoEditor.tsx — Trình chỉnh ảnh raster "Photoshop-level" (container).
 *
 * Lắp ráp: PhotoToolbar (trên) · [Canvas | Panel phải (Lớp + Chỉnh màu)]. State cục bộ ở
 * useDoc (KHÔNG dùng lib/store). Import ảnh (upload/URL/thư viện) → tạo raster layer full
 * khung; ảnh đầu tiên đặt lại kích thước tài liệu theo tỉ lệ ảnh. Export PNG/JPEG từ CÙNG model.
 *
 * Trọng tâm: hậu kỳ ảnh render nội thất (xoá vật thể bằng heal/clone, relight/grade bằng
 * adjustment layer, ghép/blend nhiều lớp). Tông quiet-luxury, dùng đúng CSS token.
 *
 * Hydration-safe: nhận initialDoc từ trang (useState initializer). Đo ảnh trong handler/effect.
 */

import { useCallback, useEffect, useState } from 'react';
import type { BlendMode, AdjustParams, AdjustPreset } from '@/lib/photo-editor/model';
import {
  makeRasterLayer,
  makeAdjustmentLayer,
  newId,
  type PhotoDoc,
} from '@/lib/photo-editor/model';
import { exportDoc, clearRenderCache } from '@/lib/photo-editor/render';
import { loadImage } from '@/lib/photo-editor/imaging';
import { DEFAULT_BRUSH, type Tool, type BrushSettings } from '@/lib/photo-editor/tools';
import { useDoc } from './useDoc';
import PhotoToolbar from './PhotoToolbar';
import DocCanvas from './DocCanvas';
import LayersPanel from './LayersPanel';
import AdjustPanel from './AdjustPanel';
import LibraryPickerModal from './LibraryPickerModal';

interface Props {
  initialDoc: PhotoDoc;
}

export default function PhotoEditor({ initialDoc }: Props) {
  const ed = useDoc(initialDoc);
  const [tool, setTool] = useState<Tool>('move');
  const [brush, setBrush] = useState<BrushSettings>({ ...DEFAULT_BRUSH });
  const [zoom, setZoom] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number }[] | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  // đếm số lớp raster (để biết có phải ảnh đầu tiên → resize doc)
  const [hasFirst, setHasFirst] = useState(initialDoc.layers.some((l) => l.kind === 'raster'));

  // dọn cache render khi unmount
  useEffect(() => () => clearRenderCache(), []);

  /* --------------------------- import ảnh --------------------------- */
  const importImage = useCallback(
    async (src: string) => {
      try {
        // Ảnh đầu tiên: đặt khung tài liệu theo kích thước ảnh (giới hạn 2400px cạnh dài).
        if (!hasFirst) {
          const img = await loadImage(src);
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const maxSide = 2400;
          const scale = Math.min(1, maxSide / Math.max(iw, ih));
          const w = Math.round(iw * scale);
          const h = Math.round(ih * scale);
          ed.update((d) => {
            d.width = w;
            d.height = h;
            const layer = makeRasterLayer(src, { name: 'Ảnh nền' });
            d.layers.push(layer);
          });
          setHasFirst(true);
          // chọn lớp mới (là cuối mảng sau update — dùng effect chọn phía dưới)
        } else {
          const layer = makeRasterLayer(src, { name: 'Ảnh ghép' });
          ed.update((d) => {
            d.layers.push(layer);
          });
          ed.select(layer.id);
        }
      } catch (e) {
        console.error('[PhotoEditor] import lỗi', e);
        alert('Không tải được ảnh (URL hết hạn hoặc chặn CORS). Thử tải file lên.');
      }
    },
    [ed, hasFirst],
  );

  // sau khi thêm lớp ảnh đầu, chọn lớp cuối
  useEffect(() => {
    if (hasFirst && !ed.selectedId && ed.doc.layers.length) {
      ed.select(ed.doc.layers[ed.doc.layers.length - 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFirst, ed.doc.layers.length]);

  /* --------------------------- lớp: actions --------------------------- */
  const onAddAdjustment = useCallback(() => {
    const layer = makeAdjustmentLayer();
    ed.update((d) => {
      d.layers.push(layer);
    });
    ed.select(layer.id);
  }, [ed]);

  const onAddEmptyRaster = useCallback(() => {
    const layer = makeRasterLayer('', { name: 'Lớp trống' });
    ed.update((d) => {
      d.layers.push(layer);
    });
    ed.select(layer.id);
    setTool('brush');
  }, [ed]);

  const onToggleVisible = useCallback((id: string) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.visible = !l.visible;
    });
  }, [ed]);

  const onToggleLock = useCallback((id: string) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.locked = !l.locked;
    });
  }, [ed]);

  const onRename = useCallback((id: string, name: string) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.name = name;
    });
  }, [ed]);

  const onDuplicate = useCallback((id: string) => {
    ed.update((d) => {
      const i = d.layers.findIndex((x) => x.id === id);
      if (i < 0) return;
      const copy = JSON.parse(JSON.stringify(d.layers[i]));
      copy.id = newId(copy.kind === 'raster' ? 'ras' : 'adj');
      copy.name = copy.name + ' (bản sao)';
      d.layers.splice(i + 1, 0, copy);
    });
  }, [ed]);

  const onDelete = useCallback((id: string) => {
    ed.update((d) => {
      d.layers = d.layers.filter((x) => x.id !== id);
    });
    if (ed.selectedId === id) ed.select(null);
  }, [ed]);

  const onMove = useCallback((id: string, dir: -1 | 1) => {
    ed.update((d) => {
      const i = d.layers.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.layers.length) return;
      const [l] = d.layers.splice(i, 1);
      d.layers.splice(j, 0, l);
    });
  }, [ed]);

  const onOpacity = useCallback((id: string, v: number, live: boolean) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.opacity = v;
    }, live);
  }, [ed]);

  const onBlend = useCallback((id: string, b: BlendMode) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.blend = b;
    });
  }, [ed]);

  /* --------------------------- vẽ: commit từ canvas --------------------------- */
  const onCommitLayerSrc = useCallback((id: string, src: string) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l && l.kind === 'raster') l.src = src;
    });
  }, [ed]);

  const onCommitLayerMask = useCallback((id: string, mask: string) => {
    ed.update((d) => {
      const l = d.layers.find((x) => x.id === id);
      if (l) l.mask = mask;
    });
  }, [ed]);

  /* --------------------------- adjustment params --------------------------- */
  const onParams = useCallback((patch: Partial<AdjustParams>, live: boolean) => {
    ed.updateSelected((l) => {
      if (l.kind === 'adjustment') Object.assign(l.params, patch);
    }, live);
  }, [ed]);

  const onPreset = useCallback((preset: AdjustPreset) => {
    ed.updateSelected((l) => {
      if (l.kind === 'adjustment') Object.assign(l.params, preset.params);
    });
  }, [ed]);

  /* --------------------------- mask lớp: tiện ích --------------------------- */
  const onInvertMask = useCallback(() => {
    // đảo mask của lớp chọn — làm ở canvas rồi commit
    const l = ed.selected;
    if (!l || !l.mask) return;
    (async () => {
      const img = await loadImage(l.mask!);
      const c = document.createElement('canvas');
      c.width = ed.doc.width;
      c.height = ed.doc.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255 - data.data[i];
        data.data[i + 1] = 255 - data.data[i + 1];
        data.data[i + 2] = 255 - data.data[i + 2];
      }
      ctx.putImageData(data, 0, 0);
      onCommitLayerMask(l.id, c.toDataURL('image/png'));
    })();
  }, [ed.selected, ed.doc.width, ed.doc.height, onCommitLayerMask]);

  const onClearMask = useCallback(() => {
    const l = ed.selected;
    if (!l) return;
    ed.updateSelected((x) => {
      x.mask = null;
    });
  }, [ed]);

  /* --------------------------- export --------------------------- */
  const onExport = useCallback(
    async (format: 'png' | 'jpeg') => {
      setBusy(format);
      try {
        const url = await exportDoc(ed.doc, format);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(ed.doc.name || 'photo').replace(/\s+/g, '-')}.${format === 'jpeg' ? 'jpg' : 'png'}`;
        a.click();
      } catch (e) {
        console.error('[PhotoEditor] export lỗi', e);
        alert('Không xuất được ảnh (có thể do CORS). Dùng ảnh tải lên.');
      } finally {
        setBusy(null);
      }
    },
    [ed.doc],
  );

  const selectedIsAdj = ed.selected?.kind === 'adjustment';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', color: 'var(--t1)' }}>
      <PhotoToolbar
        tool={tool}
        onTool={setTool}
        brush={brush}
        onBrush={(patch) => setBrush((b) => ({ ...b, ...patch }))}
        onImportFile={importImage}
        onImportUrl={importImage}
        onOpenLibrary={() => setLibOpen(true)}
        onUndo={ed.undo}
        onRedo={ed.redo}
        canUndo={ed.canUndo}
        canRedo={ed.canRedo}
        onFit={() => setFitSignal((s) => s + 1)}
        onExport={onExport}
        busy={busy}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* giữa: canvas */}
        <DocCanvas
          doc={ed.doc}
          selected={ed.selected}
          tool={tool}
          brush={brush}
          zoom={zoom}
          onZoom={setZoom}
          fitSignal={fitSignal}
          onCommitLayerSrc={onCommitLayerSrc}
          onCommitLayerMask={onCommitLayerMask}
          onSelection={setSelection}
          selection={selection}
        />

        {/* phải: panel lớp + chỉnh màu */}
        <aside
          style={{
            width: 300,
            flex: '0 0 300px',
            borderLeft: '1px solid var(--border)',
            background: 'var(--panel)',
            padding: 14,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* nút thêm lớp */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SmallBtn onClick={onAddAdjustment}>+ Chỉnh màu</SmallBtn>
            <SmallBtn onClick={onAddEmptyRaster}>+ Lớp trống</SmallBtn>
            {selection && <SmallBtn onClick={() => setSelection(null)}>Bỏ chọn vùng</SmallBtn>}
          </div>

          {/* mask tiện ích cho lớp chọn */}
          {ed.selected && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <SmallBtn onClick={onInvertMask} disabled={!ed.selected.mask}>Đảo mask</SmallBtn>
              <SmallBtn onClick={onClearMask} disabled={!ed.selected.mask}>Xoá mask</SmallBtn>
            </div>
          )}

          <LayersPanel
            layers={ed.doc.layers}
            selectedId={ed.selectedId}
            onSelect={ed.select}
            onToggleVisible={onToggleVisible}
            onToggleLock={onToggleLock}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onMove={onMove}
            onOpacity={onOpacity}
            onBlend={onBlend}
          />

          {selectedIsAdj && ed.selected?.kind === 'adjustment' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <AdjustPanel layer={ed.selected} onParams={onParams} onPreset={onPreset} />
            </div>
          )}
        </aside>
      </div>

      <LibraryPickerModal open={libOpen} onClose={() => setLibOpen(false)} onPick={importImage} />
    </div>
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 12,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
