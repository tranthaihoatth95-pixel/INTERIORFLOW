'use client';

/**
 * components/nodes/ParamField.tsx — MỘT hàng điều khiển tham số của node (chữ · chọn · thanh
 * trượt · mask/chú thích/chọn-vùng · 4 góc phối cảnh · vẽ tay · nạp ảnh).
 *
 * 16/08 — TÁCH RA từ `InteriorNode.tsx` (nguyên văn, 0 đổi hành vi), không phải viết mới. Lý do
 * là một **vòng import** chứ không phải sở thích dọn dẹp: `InteriorNode` nay dựng được **cửa sổ
 * công cụ** trong thân node, mà thân cửa sổ ấy cần đúng những hàng điều khiển này ⇒ nếu để
 * `ParamField` nằm trong `InteriorNode` thì thành `InteriorNode → CuaSoCongCu → ParamField →
 * InteriorNode`. Tách ra là cắt vòng ở đúng chỗ nó sinh ra.
 *
 * ⭐ VÌ SAO KHÔNG VIẾT BỘ ĐIỀU KHIỂN RIÊNG CHO CỬA SỔ ([T2] một cỗ máy nhiều mặt tiền): tham số
 * hiện trên khối nhỏ và tham số hiện trong cửa sổ mở là **cùng một tham số của cùng một node** —
 * hai bộ điều khiển là hai đường ghi vào cùng một chỗ, sớm muộn lệch nhau. Đây cũng là lý do
 * `MacroNodeFace.tsx` đã tái dùng chính hàm này từ trước (mặt nút tổng), nay thêm mặt thứ ba.
 *
 * `InteriorNode.tsx` re-export lại tên này để 13 chỗ gọi cũ không phải sửa một dòng nào.
 */

import { useRef, useState } from 'react';
import { Loader2, ImagePlus, Paintbrush, Wand2, Frame } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import type { ParamDef } from '@/lib/types';
import { cn } from '@/lib/utils';
import { smartImportImage, SmartImportError } from '@/lib/images/smart-ingest';
import { useSketchStore } from '@/lib/sketch/sketchStore';
import { useSmartSelectStore } from '@/lib/smartselect/smartSelectStore';
import { useWarpStore } from '@/lib/warp/warpStore';
import { useSourceImage } from '@/lib/nodes/source-image';

export function ParamField({
  nodeId,
  param,
  value,
}: {
  nodeId: string;
  param: ParamDef;
  value: string | number;
}) {
  const updateParam = useFlowStore((s) => s.updateParam);
  const setConnectError = useFlowStore((s) => s.setConnectError);
  const setNotice = useFlowStore((s) => s.setNotice);
  const fileRef = useRef<HTMLInputElement>(null);
  // Có ảnh ở input 'image' chưa — quyết định enable nút mở modal (mask / smart select / warp).
  const hasSourceImage = Boolean(useSourceImage(nodeId));
  // G-M20-05: smartImportImage() decode ảnh lớn (TIFF/PSD/HEIC) có thể mất >1s — trước đây nút
  // upload vẫn nhận click trong lúc đang decode (bấm lặp = 2 lượt import đua nhau ghi param).
  const [importing, setImporting] = useState(false);

  if (param.kind === 'text') {
    return (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--t4)]">{param.label}</span>
        {param.multiline ? (
          <textarea
            className="nodrag w-full resize-none rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] focus:border-[var(--focus-ring)]"
            rows={3}
            placeholder={param.placeholder}
            value={String(value)}
            onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
          />
        ) : (
          <input
            className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] focus:border-[var(--focus-ring)]"
            placeholder={param.placeholder}
            value={String(value)}
            onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
          />
        )}
      </label>
    );
  }

  if (param.kind === 'select') {
    return (
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--t4)]">{param.label}</span>
        <select
          className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] focus:border-[var(--focus-ring)]"
          value={String(value)}
          onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
        >
          {param.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (param.kind === 'slider') {
    // node cũ (autosave) có thể thiếu param mới → value undefined → NaN. Fallback về default.
    const sv = value == null || Number.isNaN(Number(value)) ? param.default : Number(value);
    return (
      <label className="block">
        <span className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-[var(--t4)]">
          {param.label}
          <span className="text-[var(--t3)]">{sv.toFixed(2)}</span>
        </span>
        <input
          type="range"
          className="nodrag w-full accent-[var(--accent)]"
          min={param.min}
          max={param.max}
          step={param.step}
          value={sv}
          onChange={(e) => updateParam(nodeId, param.id, Number(e.target.value))}
        />
      </label>
    );
  }

  if (param.kind === 'mask' || param.kind === 'annotate' || param.kind === 'smartmask') {
    const isMask = param.kind === 'mask';
    const isSmart = param.kind === 'smartmask';
    const has = typeof value === 'string' && value.startsWith('data:');
    // Modal cần ảnh nguồn ở input 'image'. Trước đây modal MỞ ĐƯỢC khi chưa nối input rồi
    // mới báo "chưa có ảnh nguồn" — user gặp thật, rất khó hiểu. Giờ chặn ngay ở nút.
    const needsSource = isMask || isSmart || param.kind === 'annotate';
    const disabled = needsSource && !hasSourceImage;
    const open = () => {
      if (disabled) return;
      if (isSmart) useSmartSelectStore.getState().open(nodeId);
      else if (isMask) useFlowStore.getState().setMaskEditorNodeId(nodeId);
      else useFlowStore.getState().setAnnotateNodeId(nodeId);
    };
    const label = isSmart
      ? has
        ? 'Sửa vùng chọn'
        : 'Chọn vùng thông minh'
      : isMask
        ? has
          ? 'Sửa mask'
          : 'Vẽ mask'
        : has
          ? 'Sửa chú thích'
          : 'Chú thích lên ảnh';
    return (
      <div>
        {has && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(value)} alt={param.kind} className="mb-1.5 h-20 w-full rounded-md object-cover" loading="lazy" />
        )}
        <button
          disabled={disabled}
          title={disabled ? 'Nối ảnh vào input Image trước' : undefined}
          className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border-strong)] py-2 text-[11px] text-[var(--t3)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t1)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--border-strong)] disabled:hover:text-[var(--t3)]"
          onClick={open}
        >
          {isSmart ? <Wand2 size={13} /> : <Paintbrush size={13} />}
          {disabled ? 'Nối ảnh vào input Image trước' : label}
        </button>
      </div>
    );
  }

  // 4 góc phối cảnh (util.warp) — mở modal kéo góc, xem trước ngay trên ảnh phối cảnh.
  if (param.kind === 'corners') {
    const set = typeof value === 'string' && value.trim().startsWith('[');
    return (
      <div>
        <button
          disabled={!hasSourceImage}
          title={!hasSourceImage ? 'Nối ảnh vào input Image trước' : undefined}
          className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border-strong)] py-2 text-[11px] text-[var(--t3)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t1)] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => hasSourceImage && useWarpStore.getState().open(nodeId)}
        >
          <Frame size={13} />
          {!hasSourceImage ? 'Nối ảnh vào input Image trước' : set ? 'Sửa 4 góc' : 'Kéo 4 góc phối cảnh'}
        </button>
      </div>
    );
  }

  // vẽ tay tự do (Sketch Studio — components/sketch/**) — cùng UI pattern mask/annotate
  // nhưng mở modal RIÊNG (useSketchStore), không dùng chung state với mask/annotate.
  if (param.kind === 'sketch') {
    const has = typeof value === 'string' && value.startsWith('data:');
    return (
      <div>
        {has && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={String(value)} alt="sketch" className="mb-1.5 h-20 w-full rounded-md object-cover" loading="lazy" />
        )}
        <button
          className="nodrag flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border-strong)] py-2 text-[11px] text-[var(--t3)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t1)]"
          onClick={() => useSketchStore.getState().open(nodeId)}
        >
          <Paintbrush size={13} />
          {has ? 'Sửa vẽ' : 'Vẽ tay'}
        </button>
      </div>
    );
  }

  // image upload — nhận cả data-URI (upload thật) LẪN URL ('/demo/…', '/covers/…', http…)
  const hasImage =
    typeof value === 'string' &&
    value.length > 0 &&
    (value.startsWith('data:') || value.startsWith('/') || value.startsWith('http'));
  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff,.tif,.tiff,.psd,image/heic,image/heif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // cho phép chọn lại cùng file sau khi lỗi
          if (!file || importing) return;
          setImporting(true);
          try {
            const { dataUrl, meta } = await smartImportImage(file);
            updateParam(nodeId, param.id, dataUrl);
            setConnectError(null);
            setNotice(`✓ ${meta.note}`);
          } catch (err) {
            setConnectError(
              err instanceof SmartImportError ? err.message : 'Không nạp được ảnh vào node.',
            );
          } finally {
            setImporting(false);
          }
        }}
      />
      {hasImage ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(value)}
            alt="input"
            className={cn(
              'nodrag h-28 w-full rounded-md object-cover',
              importing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
            onClick={() => !importing && fileRef.current?.click()}
            loading="lazy"
          />
          {importing && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
            </div>
          )}
        </div>
      ) : (
        <button
          disabled={importing}
          className="nodrag flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[var(--border-strong)] text-[var(--t4)] transition hover:border-[var(--accent-ring)] hover:text-[var(--t2)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => fileRef.current?.click()}
        >
          {importing ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          <span className="text-[11px]">{importing ? 'Đang nạp…' : 'Upload / drag ảnh'}</span>
        </button>
      )}
    </div>
  );
}
