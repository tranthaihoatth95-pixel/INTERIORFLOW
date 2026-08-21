'use client';

/**
 * components/render-studio/SuaCoKiemSoat.tsx — "Sửa có kiểm soát" (Controlled Edit): P0 —
 * chứng minh MỘT đường Controlled Edit chạy thật trọn vẹn (chọn vùng thủ công → chỉnh tất định
 * → so sánh Trước/Sau → Nhận/Bỏ), thay vì 7 nút mờ "chưa nối bộ thi hành".
 *
 * Chỉ nối `cua.anh.can-trang` (Cân trắng) — KHÔNG dựng cả 7 lệnh (đúng chỉ định P0: chứng minh
 * MỘT đường chạy được trước, không lan man). 6 lệnh còn lại giữ nguyên mờ + lý do ở
 * `CuaSoCongCu.tsx` (`PanelVeTinh`), không đổi.
 *
 * Mở/đóng: `useControlledEditUi` (ai đang mở, xem lý do trong tệp đó). Vẽ ảnh + vùng chọn +
 * Trước/Sau + Nhận/Bỏ ở đây, thay chỗ `NodeExtras` bình thường trong cột Kết quả của
 * `ThanCuaSoNode.tsx` khi `openNodeId === nodeId`.
 *
 * LINEAGE: xem `lib/render-studio/controlled-edit.ts` — bản gốc bất biến ở `editHistory[0]`,
 * Nhận = thêm một mục mới vào cuối, ghi đè `run.outputs.image.value` (đường DUY NHẤT mà
 * downstream — `useSourceImage`, Image→Spec — đọc ảnh của node này, nên "nhận" là tự động trở
 * thành nguồn hợp lệ cho bước sau, không cần dây riêng).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';
import { ToolbarChip } from '@/components/ui/ToolbarChip';
import {
  seedHistory,
  regionFromDrag,
  regionIsValid,
  whiteBalanceIsNeutral,
  withNewRevision,
  activeRevision,
  originalRevision,
  newRevisionId,
  type EditRegion,
  type WhiteBalanceParams,
} from '@/lib/render-studio/controlled-edit';
import { applyWhiteBalanceToRegion } from '@/lib/render-studio/controlled-edit-apply';
import { useControlledEditUi } from '@/lib/render-studio/controlled-edit-ui';

const NEUTRAL: WhiteBalanceParams = { temperature: 0, tint: 0 };

export default function SuaCoKiemSoat({ nodeId }: { nodeId: string }) {
  const tr = useT();
  const node = useFlowStore((s) => s.nodes.find((n) => n.id === nodeId));
  const setRunState = useFlowStore((s) => s.setRunState);
  const close = useControlledEditUi((s) => s.close);

  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [region, setRegion] = useState<EditRegion | null>(null);
  const [params, setParams] = useState<WhiteBalanceParams>(NEUTRAL);
  const [preview, setPreview] = useState<string | null>(null);
  const [beforeAfter, setBeforeAfter] = useState<'before' | 'after'>('after');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outputs = node?.data.run.outputs;
  const activeUrl = outputs?.image ? String(outputs.image.value) : null;
  const history = node?.data.run.editHistory;

  // Seed lịch sử ĐÚNG MỘT LẦN — bản gốc là ảnh hiện tại lúc mở, trước khi có edit nào.
  useEffect(() => {
    if (!node || !activeUrl) return;
    if (!history || history.length === 0) {
      setRunState(nodeId, { editHistory: seedHistory(history, activeUrl) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, !!node, !!activeUrl]);

  const regionValid = useMemo(
    () => (natural ? regionIsValid(region, natural.w, natural.h) : false),
    [region, natural],
  );
  const canPreview = regionValid && !whiteBalanceIsNeutral(params);

  // Tính preview khi vùng chọn HOẶC tham số đổi — trễ nhẹ để không tính lại mỗi pixel lúc kéo slider.
  useEffect(() => {
    if (!canPreview || !activeUrl || !region) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setBusy(true);
      setError(null);
      applyWhiteBalanceToRegion(activeUrl, region, params)
        .then((url) => {
          if (!cancelled) setPreview(url);
        })
        .catch(() => {
          if (!cancelled) setError(tr('Không chỉnh được ảnh — thử vùng chọn khác.', 'Could not adjust — try a different region.'));
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPreview, activeUrl, region?.x, region?.y, region?.width, region?.height, params.temperature, params.tint]);

  if (!node || !activeUrl) {
    return (
      <p style={{ fontSize: 11, color: 'var(--t4)' }}>
        {tr('Chưa có ảnh để chỉnh.', 'No image to edit yet.')}
      </p>
    );
  }

  function toNaturalXY(e: React.PointerEvent<HTMLDivElement>) {
    const el = imgRef.current;
    if (!el || !natural) return null;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * natural.w;
    const py = ((e.clientY - rect.top) / rect.height) * natural.h;
    return { x: px, y: py };
  }

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    const p = toNaturalXY(e);
    if (!p || !natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStart(p);
    setRegion(regionFromDrag(p, p, natural.w, natural.h));
  }
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart || !natural) return;
    const p = toNaturalXY(e);
    if (!p) return;
    setRegion(regionFromDrag(dragStart, p, natural.w, natural.h));
  }
  function onUp() {
    setDragStart(null);
  }

  function handleAccept() {
    if (!preview || !region || !node || !activeUrl) return;
    const rev = {
      id: newRevisionId(),
      ts: Date.now(),
      kind: 'white-balance' as const,
      dataUrl: preview,
      region,
      params,
    };
    const seeded = seedHistory(history, activeUrl);
    const nextHistory = withNewRevision(seeded, rev);
    setRunState(nodeId, {
      outputs: { ...outputs, image: { dataType: 'image', value: preview } },
      editHistory: nextHistory,
    });
    setRegion(null);
    setParams(NEUTRAL);
    setPreview(null);
    close();
  }

  function handleReject() {
    setRegion(null);
    setParams(NEUTRAL);
    setPreview(null);
    setError(null);
  }

  const original = originalRevision(history ?? []);
  const active = activeRevision(history ?? []);
  const displayUrl = beforeAfter === 'before' ? activeUrl : preview ?? activeUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t4)' }}>
          {tr('Cân trắng — kéo để chọn vùng', 'White balance — drag to select a region')}
        </p>
        <ToolbarChip
          icon={<X size={12} />}
          label={tr('Đóng', 'Close')}
          size={22}
          onClick={() => {
            handleReject();
            close();
          }}
        />
      </div>

      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ position: 'relative', cursor: 'crosshair', userSelect: 'none', touchAction: 'none' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={displayUrl}
          alt={tr('Ảnh kết quả', 'Result image')}
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget;
            setNatural({ w: el.naturalWidth, h: el.naturalHeight });
          }}
          style={{ width: '100%', display: 'block', borderRadius: RADIUS.r2, maxHeight: 260, objectFit: 'contain', background: 'var(--field)' }}
        />
        {region && natural && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${(region.x / natural.w) * 100}%`,
              top: `${(region.y / natural.h) * 100}%`,
              width: `${(region.width / natural.w) * 100}%`,
              height: `${(region.height / natural.h) * 100}%`,
              border: '1.5px dashed var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              pointerEvents: 'none',
              borderRadius: 2,
            }}
          />
        )}
      </div>

      {!regionValid && (
        <p style={{ fontSize: 10.5, color: 'var(--t4)' }}>
          {tr('Kéo một vùng chữ nhật trên ảnh để giới hạn chỉnh sửa.', 'Drag a rectangle on the image to scope the edit.')}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Truot
          nhan={tr('Nhiệt độ', 'Temperature')}
          gia={params.temperature}
          onDoi={(v) => setParams((p) => ({ ...p, temperature: v }))}
        />
        <Truot nhan={tr('Tint', 'Tint')} gia={params.tint} onDoi={(v) => setParams((p) => ({ ...p, tint: v }))} />
      </div>

      {error && <p style={{ fontSize: 10.5, color: 'var(--danger, #d9534f)' }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={() => setBeforeAfter('before')}
          disabled={!preview}
          style={pillStyle(beforeAfter === 'before')}
        >
          {tr('Trước', 'Before')}
        </button>
        <button
          type="button"
          onClick={() => setBeforeAfter('after')}
          disabled={!preview}
          style={pillStyle(beforeAfter === 'after')}
        >
          {tr('Sau', 'After')}
        </button>
        {busy && <span style={{ fontSize: 10, color: 'var(--t4)' }}>{tr('Đang tính…', 'Computing…')}</span>}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <ToolbarChip
          icon={<Check size={14} />}
          label={tr('Nhận', 'Accept')}
          desc={tr('Áp bản chỉnh, giữ ảnh gốc trong lịch sử', 'Apply the edit, keep the original in history')}
          size={30}
          disabled={!preview}
          disabledReason={tr('Chưa có bản xem trước để nhận', 'No preview to accept yet')}
          onClick={handleAccept}
        />
        <ToolbarChip
          icon={<RotateCcw size={14} />}
          label={tr('Bỏ', 'Reject')}
          desc={tr('Bỏ vùng chọn + tham số, không đổi gì', 'Discard the region + params, nothing changes')}
          size={30}
          disabled={!region && whiteBalanceIsNeutral(params)}
          disabledReason={tr('Chưa chỉnh gì để bỏ', 'Nothing to reject yet')}
          onClick={handleReject}
        />
      </div>

      {original && active && active.id !== original.id && (
        <p style={{ fontSize: 10, color: 'var(--t4)' }}>
          {tr(
            `Lịch sử: ${(history ?? []).length} bản — bản gốc giữ nguyên, đang dùng bản #${(history ?? []).length}.`,
            `History: ${(history ?? []).length} revisions — original kept, using #${(history ?? []).length}.`,
          )}
        </p>
      )}
    </div>
  );
}

function Truot({ nhan, gia, onDoi }: { nhan: string; gia: number; onDoi: (v: number) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10.5, color: 'var(--t3)' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{nhan}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--t2)' }}>{gia}</span>
      </span>
      <input
        type="range"
        min={-100}
        max={100}
        step={1}
        value={gia}
        onChange={(e) => onDoi(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </label>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    padding: '4px 10px',
    borderRadius: RADIUS.full,
    border: '1px solid var(--vien-mo)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--on-accent, #fff)' : 'var(--t3)',
    cursor: 'pointer',
  };
}
