'use client';

import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Play, Loader2, CircleAlert, CircleCheck, RotateCcw, ImagePlus, Paintbrush, X, Wand2, Frame } from 'lucide-react';
import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { nodeIconFor } from '@/components/nodes/NodeIcons';
import { runNode } from '@/lib/execution';
import { CATEGORY_META, DATA_TYPE_COLORS, type ParamDef } from '@/lib/types';
import { NodeExtras } from '@/components/nodes/NodeExtras';
import { nodePop, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { smartImportImage, SmartImportError } from '@/lib/images/smart-ingest';
import { useSketchStore } from '@/lib/sketch/sketchStore';
import { useSmartSelectStore } from '@/lib/smartselect/smartSelectStore';
import { useWarpStore } from '@/lib/warp/warpStore';
import { useSourceImage } from '@/lib/nodes/source-image';
import CommentPin from '@/components/nodes/CommentPin';
import { useT } from '@/lib/i18n';

const PORT_GAP = 26;
const PORT_TOP = 46;

/** Export cho `MacroNodeFace.tsx` (VIỆC "Nút tổng") — mặt nút tổng lộ tham số của NHIỀU node con
 * khác nhau, tái dùng đúng control này thay vì viết lại slider/select/text riêng (tránh 2 bản
 * lệch nhau). Hành vi/props giữ nguyên 100% cho InteriorNode. */
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
            className="nodrag w-full resize-none rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-[var(--accent-ring)]"
            rows={3}
            placeholder={param.placeholder}
            value={String(value)}
            onChange={(e) => updateParam(nodeId, param.id, e.target.value)}
          />
        ) : (
          <input
            className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-[var(--accent-ring)]"
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
          className="nodrag w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2 py-1.5 text-xs text-[var(--t1)] outline-none focus:border-[var(--accent-ring)]"
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

function StatusIcon({ status }: { status: string }) {
  if (status === 'running' || status === 'queued')
    return <Loader2 size={13} className="animate-spin text-[var(--accent)]" />;
  if (status === 'done') return <CircleCheck size={13} className="text-emerald-400" />;
  if (status === 'error') return <CircleAlert size={13} className="text-red-400" />;
  return null;
}

function InteriorNodeInner({ id, data, selected }: NodeProps<FlowNode>) {
  const tr = useT();
  const def = getDefinition(data.defType);
  const meta = CATEGORY_META[def.category];
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const { status, progress, error } = data.run;
  const busy = status === 'running' || status === 'queued';
  /* Đang kéo dây từ MỘT cổng nguồn ở đâu đó trên canvas (FlowCanvas onConnectStart/onConnectEnd
     ghi vào store) — sáng cổng NHẬN cùng kiểu dữ liệu, mờ cổng khác kiểu (mock-if-bang-nut.html
     màn 03). CHỈ áp cho cổng target (input) — cổng nguồn không phải đích thả dây. */
  const connectFromType = useFlowStore((s) => s.connectFromType);
  const dragging = connectFromType !== null;
  /* CHẤM TÍM "tham số đã đưa ra ngoài" (port `docs/mocks/Nút tổng.dc.html` màn 04 — 3 node con
     có chấm ở góc phải tiêu đề + chú thích cuối khung "Chấm tím là tham số đã đưa ra ngoài").
     CHỈ hiện khi nút tổng chứa node này ĐANG MỞ RA XEM (`!g.collapsed`): lúc thu gọn, node con
     không nằm trên màn nên chấm vô nghĩa; chú thích trong khung mở cũng chỉ có ở trạng thái đó.
     Chọn `some()` chứ không map cả bảng: mỗi node chỉ cần biết CÓ/KHÔNG, so sánh boolean nên
     selector không tạo tham chiếu mới mỗi lần store đổi. */
  const hasExposedParam = useFlowStore((s) =>
    s.groups.some((g) => g.isMacro && !g.collapsed && (g.exposedParams ?? []).some((p) => p.nodeId === id)),
  );

  return (
    <motion.div
      variants={nodePop}
      initial="hidden"
      animate="visible"
      /* VIỀN CHỌN (port `docs/mocks/Nút tổng.dc.html` màn 01 "Đang chọn năm nút"): node được
         chọn có viền 1.5px accent ĐẶC + quầng 4px accent-soft. Trước đây chỉ đổi màu viền sang
         --accent-ring (accent pha 55% alpha) — ở nền Kem gần như không thấy, nên lúc quét chọn
         5 nút để gom nút tổng không biết mình đang cầm những nút nào.
         Quầng đi bằng box-shadow (thuộc tính paint), KHÔNG opacity — nen-mo-card có backdrop blur
         (luật G1). Lúc node chạy, `.node-running-halo` là animation nên vẫn thắng inline style
         này theo thứ tự tầng CSS — đúng ý: đang chạy thì tín hiệu "chạy" quan trọng hơn "chọn". */
      style={{ boxShadow: selected ? 'var(--shadow-pop), 0 0 0 4px var(--accent-soft)' : 'var(--shadow-pop)' }}
      className={cn(
        'group relative nen-mo-card w-64 rounded-[14px] border transition-colors',
        selected ? 'border-[1.5px] border-[var(--accent)]' : 'border-[var(--vien-mo)]',
        status === 'error' && 'border-red-500/60',
        status === 'running' && 'node-running-halo glass-gradient-run',
      )}
    >
      {/* G2 phần (2) — comment neo vào node này (badge góc phải-trên, xem CommentPin.tsx). */}
      <CommentPin nodeId={id} />

      {/* header — icon flat, nhãn dùng font hệ thống app (2.2.85, 30/07: bỏ font mono —
          SF Mono/Cascadia Code/Fira Code thiếu glyph dấu tiếng Việt tổ hợp, xung khắc với
          luật thoại 2.2.69 "Việt dẫn · Anh theo") */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        {(() => { const Icon = nodeIconFor(data.defType); return <Icon size={14} className="shrink-0 text-[var(--t2)]" />; })()}
        {/* nhãn chỉ tiếng Việt (05/08) — tên tiếng Anh của công cụ ở tooltip, giống thẻ trong
            bảng chọn node (components/NodeLibraryPanel.tsx `NodeCard`). */}
        <span className="flex-1 truncate text-[11.5px] font-medium tracking-[-.005em] text-[var(--t1)]" title={def.titleEn}>
          {def.title}
        </span>
        {hasExposedParam && (
          <span
            aria-hidden
            title={tr('Có tham số đưa ra ngoài mặt nút tổng', 'Has a parameter exposed on the macro node face')}
            className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--accent)]"
          />
        )}
        {status === 'queued' && (
          <span className="text-[10px] text-[var(--t4)]">đang chờ</span>
        )}
        {status === 'running' && (
          <span className="text-[10px] font-semibold tabular-nums text-[var(--accent)]">{Math.round(progress * 100)}%</span>
        )}
        {def.creditCost > 0 && (
          <span className="rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--t3)]">
            {def.creditCost}cr
          </span>
        )}
        <StatusIcon status={status} />
        <motion.button
          {...pressableIcon}
          // A5 (DS-A 14/08, SPEC-NGON-NGU): VI trước, không lộ jargon "node/upstream"
          title={status === 'error' ? tr('Chạy lại', 'Retry') : tr('Chạy khối (kèm khối nguồn)', 'Run block (with source blocks)')}
          disabled={busy}
          onClick={() => runNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md bg-[var(--accent-strong)] text-white transition-colors hover:bg-[var(--accent)] disabled:opacity-40"
        >
          {status === 'error' ? <RotateCcw size={12} /> : <Play size={12} className="translate-x-[1px]" />}
        </motion.button>
        <motion.button
          {...pressableIcon}
          title="Xoá node"
          disabled={busy}
          onClick={() => deleteNode(id)}
          className="nodrag grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
        >
          <X size={13} />
        </motion.button>
      </div>

      {/* body */}
      <div
        className="space-y-2.5 px-3 py-2.5"
        style={{ minHeight: Math.max(def.inputs.length, def.outputs.length) * PORT_GAP }}
      >
        {def.params.map((p) => (
          <ParamField key={p.id} nodeId={id} param={p} value={data.params[p.id]} />
        ))}

        {status === 'running' && (
          <div className="h-1 overflow-hidden rounded-full bg-[var(--hover)]">
            {/* Rà soát motion 20/07: trước dùng `transition-all` + `width: n%` — animate width là
                animate LAYOUT, mà thanh này chạy trên TỪNG node của canvas trong suốt lúc render.
                Đổi sang scaleX (chỉ composite): thanh đặc bo tròn nên nhìn y hệt. */}
            <div
              className="h-full w-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        )}

        {status === 'error' && error && (
          <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-300">{error}</p>
        )}

        <NodeExtras nodeId={id} data={data} />
      </div>

      {/* ports — MÀU THEO KIỂU DỮ LIỆU. `DATA_TYPE_COLORS` (lib/types.ts) nay trả BIẾN token
          `var(--p-img)`/`var(--p-mask)`/`var(--p-num)` (`app/globals.css`, port ① mock
          `docs/mocks/Bảng nút.dc.html`) thay hex cứng ⇒ chấm cổng tự đổi theo theme Sáng/Tối
          và theo --accent, không phải sửa 2 nơi. Viền `2px solid var(--bg)` giữ đúng mock. */}
      {def.inputs.map((port, i) => {
        const isMatch = port.dataType === connectFromType;
        return (
          <Handle
            key={port.id}
            id={port.id}
            type="target"
            position={Position.Left}
            style={{
              top: PORT_TOP + i * PORT_GAP,
              background: DATA_TYPE_COLORS[port.dataType],
              width: dragging && isMatch ? 13 : 10,
              height: dragging && isMatch ? 13 : 10,
              border: dragging && isMatch ? '2px solid var(--accent)' : '2px solid var(--bg)',
              boxShadow: dragging && isMatch ? '0 0 0 3px var(--accent-soft)' : undefined,
              filter: dragging && !isMatch ? 'grayscale(0.9) brightness(0.55)' : undefined,
              transition: 'width .15s var(--ease-apple), height .15s var(--ease-apple), box-shadow .15s var(--ease-apple), filter .15s var(--ease-apple), border-color .15s var(--ease-apple)',
            }}
            title={`${port.label} · ${port.dataType}${dragging ? (isMatch ? ' · nhận được' : ' · khác kiểu') : ''}`}
          />
        );
      })}
      {def.outputs.map((port, i) => (
        <Handle
          key={port.id}
          id={port.id}
          type="source"
          position={Position.Right}
          style={{
            top: PORT_TOP + i * PORT_GAP,
            background: DATA_TYPE_COLORS[port.dataType],
            width: 10,
            height: 10,
            border: '2px solid var(--bg)',
          }}
          title={`${port.label} · ${port.dataType}`}
        />
      ))}
    </motion.div>
  );
}

export const InteriorNode = memo(InteriorNodeInner);
