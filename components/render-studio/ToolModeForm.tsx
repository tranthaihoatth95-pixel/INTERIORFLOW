'use client';

/**
 * components/render-studio/ToolModeForm.tsx — giao diện 2 cột (ẢNH GỐC + KẾT QUẢ) cho 1 thẻ việc
 * đã chọn (VIỆC B, 28/07, docs/SPEC-RENDER-STUDIO.md §1B). Hai cột · một nút · tham số rút gọn.
 * KHÔNG dây, không node hiện ra — nhưng phía sau vẫn dựng ĐÚNG node thật (input.image → node AI
 * của thẻ) và chạy qua `runNode()` CÙNG đường với canvas thường (không có luồng "giả" riêng).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { taskCardById } from '@/lib/render-studio/task-cards';
import { ensureToolModeGraph } from '@/lib/render-studio/tool-mode-graph';
import { exportMeasurementSpecSheet } from '@/lib/render-studio/measurement-spec-sheet';
import { getActiveBrandKit } from '@/lib/present-editor/brand-kit';
import type { MeasurementResult } from '@/lib/vision/single-view-metrology';
import type { ParamDef } from '@/lib/types';

export default function ToolModeForm({ cardId }: { cardId: string }) {
  const card = taskCardById(cardId);
  const backToHome = useToolModeUi((s) => s.backToHome);
  const openCanvas = useToolModeUi((s) => s.openCanvas);
  const smallScreen = useIsSmallScreenForCanvas();

  // LỖ RÒ 1 (2.2.77, 29/07, docs/CHOT-SO-MA-2026-07-29.md §D) — ảnh đã thả + node graph refs
  // sống Ở STORE (useToolModeUi), KHÔNG phải `useState`/`useRef` cục bộ trong component này.
  // Lý do bắt buộc, đã xác nhận bằng browser thật: `RenderToolModeOverlay` UNMOUNT HẲN
  // `ToolModeForm` mỗi lần `view` rời 'form' (vd bấm "Chọn việc khác" về Home) — state cục bộ
  // (kể cả `useRef`) KHÔNG sống sót qua unmount, chỉ state ở NGOÀI component (store) mới giữ
  // được ảnh khi user quay lại Home rồi chọn thẻ khác.
  const imageDataUrl = useToolModeUi((s) => s.sessionImageDataUrl);
  const setImageDataUrl = useToolModeUi((s) => s.setSessionImageDataUrl);
  const nodeRefs = useToolModeUi((s) => s.sessionNodeRefs);
  const setNodeRefs = useToolModeUi((s) => s.setSessionNodeRefs);

  const def = card ? getDefinition(card.nodeType) : null;
  const [values, setValues] = useState<Record<string, string | number>>(() => (def ? defaultParams(def) : {}));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đổi thẻ → chỉ reset THAM SỐ (node AI khác thì params cũ không còn hợp lệ nữa) — KHÔNG đụng
  // `imageDataUrl`/`nodeRefs` (ở store, tự sống sót qua unmount/remount). Việc thay node AI thật
  // sự (xoá node cũ, dựng node mới, nối lại vào ĐÚNG node ảnh nguồn) xảy ra lười (lazy) trong
  // buildOrUpdateGraph(), đúng lúc user bấm Render — không mutate graph chỉ vì đang lướt xem thẻ.
  useEffect(() => {
    if (def) setValues(defaultParams(def));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  // Kết quả hiện ĐÚNG khi refs trong store khớp thẻ đang mở (mở lại đúng thẻ vừa render trước
  // đó) — thẻ khác thì chưa có kết quả CHO THẺ NÀY (dù node AI của thẻ cũ vẫn còn tới lúc bấm
  // Render tiếp mới bị thay, xem ensureToolModeGraph).
  const aiNodeId = nodeRefs?.cardId === cardId ? nodeRefs.aiId : null;
  const run = useFlowStore((s) => (aiNodeId ? s.nodes.find((n) => n.id === aiNodeId)?.data.run : undefined));

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const buildOrUpdateGraph = useCallback((): string => {
    const store = useFlowStore.getState();
    const refs = ensureToolModeGraph(
      {
        addNode: store.addNode,
        deleteNode: store.deleteNode,
        onConnect: store.onConnect,
        lastNodeId: () => useFlowStore.getState().nodes.at(-1)!.id,
      },
      nodeRefs,
      cardId,
      card!.nodeType,
    );
    if (refs !== nodeRefs) setNodeRefs(refs);
    if (imageDataUrl) store.updateParam(refs.imgId, 'file', imageDataUrl);
    for (const [k, v] of Object.entries(values)) store.updateParam(refs.aiId, k, v);
    return refs.aiId;
  }, [card, cardId, imageDataUrl, values, nodeRefs, setNodeRefs]);

  const onRender = () => {
    if (!card || !imageDataUrl) return;
    const aiId = buildOrUpdateGraph();
    if (card.formKind === 'canvas-handoff') {
      openCanvas();
      return;
    }
    void runNode(aiId);
  };

  if (!card || !def) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 35, display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <button type="button" onClick={backToHome} style={{ color: 'var(--t2)' }}>
          ← Quay lại
        </button>
      </div>
    );
  }

  const editableParams = def.params.filter(
    (p): p is Extract<ParamDef, { kind: 'select' | 'slider' | 'text' }> =>
      p.kind === 'select' || p.kind === 'slider' || p.kind === 'text',
  );

  const outputUrl = run?.outputs?.image?.value;
  // 2.2.88 — thẻ "Đo món đồ" xuất TEXT (JSON đo lường), không phải ảnh — nhánh hiển thị riêng.
  const isMeasureCard = card.id === 'measureobject';
  const measurementJson = isMeasureCard ? run?.outputs?.measurement?.value : undefined;
  const measurement: (MeasurementResult & { calibConfidence: number; scaleConfidence: number }) | null =
    typeof measurementJson === 'string'
      ? (() => {
          try {
            return JSON.parse(measurementJson);
          } catch {
            return null;
          }
        })()
      : null;
  const handoffBlockedOnSmallScreen = card.formKind === 'canvas-handoff' && smallScreen;
  const canRender = !!imageDataUrl && run?.status !== 'running' && !handoffBlockedOnSmallScreen;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 35, background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>
        <button
          type="button"
          onClick={backToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: 'var(--t3)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> Chọn việc khác
        </button>

        <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--t1)', marginBottom: 20 }}>{card.label}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* ẢNH GỐC */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onPickFile} />
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              style={{
                aspectRatio: '4/3',
                border: '1px dashed var(--border)',
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                background: 'var(--field)',
              }}
            >
              {imageDataUrl ? (
                <img src={imageDataUrl} alt="Ảnh gốc" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--t4)' }}>
                  <Upload size={20} />
                  <span style={{ fontSize: 12 }}>Thả ảnh vào đây</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {editableParams.map((p) => (
                <ParamControl key={p.id} param={p} value={values[p.id]} onChange={(v) => setValues((s) => ({ ...s, [p.id]: v }))} />
              ))}
            </div>

            <button
              type="button"
              onClick={onRender}
              disabled={!canRender}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: canRender ? 'var(--accent)' : 'var(--border)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: canRender ? 'pointer' : 'not-allowed',
              }}
            >
              {handoffBlockedOnSmallScreen
                ? 'Cần màn lớn hơn để vẽ vùng sửa'
                : card.formKind === 'canvas-handoff'
                  ? '✎ Vẽ vùng cần sửa (mở canvas)'
                  : run?.status === 'running'
                    ? `Đang chạy… ${Math.round((run.progress ?? 0) * 100)}%`
                    : '▶ Render'}
            </button>
          </div>

          {/* KẾT QUẢ */}
          <div>
            {isMeasureCard ? (
              <MeasurementPanel measurement={measurement} status={run?.status} error={run?.error} progress={run?.progress} />
            ) : (
              <div
                style={{
                  aspectRatio: '4/3',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                  background: 'var(--field)',
                }}
              >
                {outputUrl ? (
                  <img src={String(outputUrl)} alt="Kết quả" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : run?.status === 'error' ? (
                  <span style={{ fontSize: 12, color: '#c0392b', padding: 16, textAlign: 'center' }}>{run.error}</span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--t4)' }}>
                    {run?.status === 'running' ? 'Đang render…' : 'Chưa có kết quả'}
                  </span>
                )}
              </div>
            )}
            {isMeasureCard && measurement && imageDataUrl && (
              <MeasurementExportButton imageDataUrl={imageDataUrl} measurement={measurement} />
            )}
            {!smallScreen && (
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={openCanvas}
                  title="Xem/chỉnh node phía sau thẻ này trên canvas"
                  style={{
                    fontSize: 12,
                    color: 'var(--t3)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Mở canvas ▾
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 2.2.88 — bảng R×S×C cho thẻ "Đo món đồ": số 🟢 ĐO màu `--success`, số 🟡 SUY màu `--warning`
 * + dấu `~` + tooltip nêu `basis` (đúng yêu cầu "KHÔNG cho số 🟡 hiện giống số 🟢"). */
function MeasurementPanel({
  measurement,
  status,
  error,
  progress,
}: {
  measurement: (MeasurementResult & { calibConfidence: number; scaleConfidence: number }) | null;
  status: string | undefined;
  error: string | undefined;
  progress: number | undefined;
}) {
  if (!measurement) {
    return (
      <div
        style={{
          aspectRatio: '4/3',
          border: '1px solid var(--border)',
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--field)',
        }}
      >
        {status === 'error' ? (
          <span style={{ fontSize: 12, color: '#c0392b', padding: 16, textAlign: 'center' }}>{error}</span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--t4)' }}>
            {status === 'running' ? `Đang đo… ${Math.round((progress ?? 0) * 100)}%` : 'Chưa có kết quả'}
          </span>
        )}
      </div>
    );
  }

  const rows: { label: string; v: MeasurementResult['width'] }[] = [
    { label: 'Rộng · Width', v: measurement.width },
    { label: 'Sâu · Depth', v: measurement.depth },
    { label: 'Cao · Height', v: measurement.height },
  ];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 18, background: 'var(--field)' }}>
      {rows.map(({ label, v }) => {
        const measured = v.kind === 'measured';
        const color = measured ? 'var(--success)' : 'var(--warning)';
        return (
          <div key={label} style={{ marginBottom: 14 }} title={v.basis}>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>
              {measured ? '' : '~'}
              {Math.round(v.valueMm)} <span style={{ fontSize: 12, fontWeight: 500 }}>± {Math.round(v.toleranceMm)} mm</span>{' '}
              <span style={{ fontSize: 11, fontWeight: 500 }}>{measured ? '🟢 ĐO' : '🟡 SUY'}</span>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>
        Độ tin camera {(measurement.calibConfidence * 100).toFixed(0)}% · thang đo {(measurement.scaleConfidence * 100).toFixed(0)}%
      </div>
      <div
        style={{
          marginTop: 12,
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid var(--warning)',
          background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
          color: 'var(--warning)',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        ⚠ Mặt khuất là suy diễn — kiểm tra trước khi sản xuất.
      </div>
    </div>
  );
}

function MeasurementExportButton({
  imageDataUrl,
  measurement,
}: {
  imageDataUrl: string;
  measurement: MeasurementResult & { calibConfidence: number; scaleConfidence: number };
}) {
  const flowName = useFlowStore((s) => s.flowName);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const studioName = getActiveBrandKit()?.name ?? '';
          await exportMeasurementSpecSheet({
            photoDataUrl: imageDataUrl,
            result: measurement,
            calibConfidence: measurement.calibConfidence,
            scaleConfidence: measurement.scaleConfidence,
            projectName: flowName,
            studioName,
          });
        } finally {
          setBusy(false);
        }
      }}
      style={{
        marginTop: 12,
        width: '100%',
        padding: '9px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--t2)',
        fontSize: 12.5,
        fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer',
      }}
    >
      {busy ? 'Đang dựng spec sheet…' : '⬇ Xuất Spec Sheet'}
    </button>
  );
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: Extract<ParamDef, { kind: 'select' | 'slider' | 'text' }>;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  if (param.kind === 'select') {
    return (
      <label style={{ display: 'block' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>{param.label}</div>
        <select
          value={String(value ?? param.options[0])}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 9px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--panel)',
            color: 'var(--t1)',
            fontSize: 12.5,
          }}
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
    const v = typeof value === 'number' ? value : param.default;
    return (
      <label style={{ display: 'block' }}>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
          {param.label} <span style={{ color: 'var(--t4)' }}>{v}</span>
        </div>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.step}
          value={v}
          onChange={(e) => onChange(+e.target.value)}
          style={{ width: '100%' }}
        />
      </label>
    );
  }
  // 'text'
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>{param.label}</div>
      <input
        type="text"
        value={String(value ?? '')}
        placeholder={param.placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '7px 9px',
          borderRadius: 7,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          color: 'var(--t1)',
          fontSize: 12.5,
        }}
      />
    </label>
  );
}
