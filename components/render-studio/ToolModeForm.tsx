'use client';

/**
 * components/render-studio/ToolModeForm.tsx — giao diện 2 cột (ẢNH GỐC + KẾT QUẢ) cho 1 thẻ việc
 * đã chọn (VIỆC B, 28/07, docs/SPEC-RENDER-STUDIO.md §1B). Hai cột · một nút · tham số rút gọn.
 * KHÔNG dây, không node hiện ra — nhưng phía sau vẫn dựng ĐÚNG node thật (input.image → node AI
 * của thẻ) và chạy qua `runNode()` CÙNG đường với canvas thường (không có luồng "giả" riêng).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Upload, ChevronDown, Sun, Sunset, Moon, Lightbulb } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { useToolModeUi, useIsSmallScreenForCanvas } from '@/lib/render-studio/tool-mode-ui';
import { taskCardById } from '@/lib/render-studio/task-cards';
import { ensureToolModeGraph } from '@/lib/render-studio/tool-mode-graph';
import { exportMeasurementSpecSheet } from '@/lib/render-studio/measurement-spec-sheet';
import { getActiveBrandKit } from '@/lib/present-editor/brand-kit';
import { ANCHOR_CONFIG, type TieredMeasurement, type AnchorKind, type Pt2D } from '@/lib/vision/single-view-metrology';
import type { ParamDef } from '@/lib/types';

/** Tham số của node "Đo món đồ" GOM vào "Tinh chỉnh" thu gọn — người dùng bấm Render trước, ra
 * kết quả rồi mới cần sờ tới (30/07, Hoà chỉ ra bản trước bày cả 2 slider ra trước khi chạy). */
const MEASURE_ADVANCED_PARAM_IDS = new Set(['cameraHeightMm', 'bgTolerance']);
/** Vật chuẩn cho UI khoanh tay — bỏ cameraHeight (đã có slider riêng) và depthMetric (chỉ kiểm chéo). */
const MANUAL_ANCHOR_KINDS: AnchorKind[] = ['bed', 'door', 'tableTop', 'stairRiser', 'tileModule', 'seatHeight', 'outlet'];

type MeasurePayload = TieredMeasurement & { aiTier: number; aiTierName: string; hasSilhouette: boolean; warnings: string[] };

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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 2.2.88 — 2 điểm khoanh tay cho neo thang đo (chỉ thẻ "Đo món đồ"). Toạ độ NATURAL PIXEL của
  // ảnh gốc (không phải px màn hình) — quy đổi ở onImageClick(). Sống ở state cục bộ (KHÔNG cần
  // sống sót qua unmount như ảnh/refs — chỉ là thao tác đang dở trong 1 lượt xem thẻ này).
  const [anchorPoints, setAnchorPoints] = useState<Pt2D[]>([]);
  const [anchorKind, setAnchorKind] = useState<AnchorKind>('bed');
  const [anchorMm, setAnchorMm] = useState<number>(ANCHOR_CONFIG.bed.typicalMm);

  // Đổi thẻ → chỉ reset THAM SỐ (node AI khác thì params cũ không còn hợp lệ nữa) — KHÔNG đụng
  // `imageDataUrl`/`nodeRefs` (ở store, tự sống sót qua unmount/remount). Việc thay node AI thật
  // sự (xoá node cũ, dựng node mới, nối lại vào ĐÚNG node ảnh nguồn) xảy ra lười (lazy) trong
  // buildOrUpdateGraph(), đúng lúc user bấm Render — không mutate graph chỉ vì đang lướt xem thẻ.
  useEffect(() => {
    if (def) setValues(defaultParams(def));
    setAnchorPoints([]);
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
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setAnchorPoints([]); // ảnh mới — 2 điểm khoanh cũ (nếu có) không còn nghĩa gì trên ảnh này.
      }
    };
    reader.readAsDataURL(file);
  };

  const buildOrUpdateGraph = useCallback(
    (extraParams?: Record<string, string | number>): string => {
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
      if (extraParams) for (const [k, v] of Object.entries(extraParams)) store.updateParam(refs.aiId, k, v);
      return refs.aiId;
    },
    [card, cardId, imageDataUrl, values, nodeRefs, setNodeRefs],
  );

  const onRender = () => {
    if (!card || !imageDataUrl) return;
    const aiId = buildOrUpdateGraph();
    if (card.formKind === 'canvas-handoff') {
      openCanvas();
      return;
    }
    void runNode(aiId);
  };

  /** 2.2.88 — bấm "Dùng vật chuẩn này" sau khi đã khoanh 2 điểm: ghi neo tay vào node (param
   * KHÔNG khai báo trong `NodeDefinition.params` — xem ghi chú `manualAnchorJson` ở metrology.ts)
   * rồi chạy lại NGAY, không bắt bấm Render 2 lần. */
  const onConfirmAnchorAndRerun = () => {
    if (!card || !imageDataUrl || anchorPoints.length !== 2) return;
    const payload = JSON.stringify({ kind: anchorKind, points: anchorPoints, realMm: anchorMm });
    const aiId = buildOrUpdateGraph({ manualAnchorJson: payload });
    void runNode(aiId);
  };

  /** Toạ độ click trên `<img>` (object-fit:contain) → toạ độ pixel THẬT của ảnh gốc — object-fit
   * contain co-giãn giữ tỉ lệ + letterbox 2 bên, phải trừ phần letterbox trước khi quy đổi tỉ lệ. */
  const onImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const rect = img.getBoundingClientRect();
    const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const dispW = img.naturalWidth * scale;
    const dispH = img.naturalHeight * scale;
    const offX = (rect.width - dispW) / 2;
    const offY = (rect.height - dispH) / 2;
    const px = (e.clientX - rect.left - offX) / scale;
    const py = (e.clientY - rect.top - offY) / scale;
    if (px < 0 || py < 0 || px > img.naturalWidth || py > img.naturalHeight) return; // click vào vùng letterbox
    setAnchorPoints((pts) => (pts.length >= 2 ? [{ x: px, y: py }] : [...pts, { x: px, y: py }]));
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

  const isMeasureCard = card.id === 'measureobject';
  const allEditableParams = def.params.filter(
    (p): p is Extract<ParamDef, { kind: 'select' | 'slider' | 'text' }> =>
      p.kind === 'select' || p.kind === 'slider' || p.kind === 'text',
  );
  // "Đo món đồ": category hiện NGAY (lựa chọn chính trước khi Render); cameraHeight/bgTolerance
  // gom vào "Tinh chỉnh" thu gọn. Thẻ khác: giữ nguyên hành vi cũ (mọi param hiện thẳng).
  const primaryParams = isMeasureCard ? allEditableParams.filter((p) => !MEASURE_ADVANCED_PARAM_IDS.has(p.id)) : allEditableParams;
  const advancedParams = isMeasureCard ? allEditableParams.filter((p) => MEASURE_ADVANCED_PARAM_IDS.has(p.id)) : [];

  const outputUrl = run?.outputs?.image?.value;
  const measurementJson = isMeasureCard ? run?.outputs?.measurement?.value : undefined;
  const measurement: MeasurePayload | null =
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
              style={{
                position: 'relative',
                aspectRatio: '4/3',
                border: '1px dashed var(--border)',
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                background: 'var(--field)',
              }}
            >
              {imageDataUrl ? (
                <>
                  <img
                    ref={imgRef}
                    src={imageDataUrl}
                    alt="Ảnh gốc"
                    onClick={isMeasureCard ? onImageClick : () => fileInputRef.current?.click()}
                    title={isMeasureCard ? 'Bấm 2 điểm trên 1 vật chuẩn (vd 2 đầu giường) để neo thang đo tay' : undefined}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                  />
                  {isMeasureCard &&
                    anchorPoints.map((p, i) => {
                      const img = imgRef.current;
                      if (!img || !img.naturalWidth) return null;
                      const rect = img.getBoundingClientRect();
                      const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
                      const dispW = img.naturalWidth * scale;
                      const dispH = img.naturalHeight * scale;
                      const left = (rect.width - dispW) / 2 + p.x * scale;
                      const top = (rect.height - dispH) / 2 + p.y * scale;
                      return (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left,
                            top,
                            width: 10,
                            height: 10,
                            marginLeft: -5,
                            marginTop: -5,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            border: '2px solid #fff',
                            pointerEvents: 'none',
                          }}
                        />
                      );
                    })}
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--t4)', cursor: 'pointer' }}
                >
                  <Upload size={20} />
                  <span style={{ fontSize: 12 }}>Thả ảnh vào đây</span>
                </div>
              )}
            </div>

            {isMeasureCard && imageDataUrl && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t4)' }}>
                {anchorPoints.length === 0 && 'Tuỳ chọn: bấm 2 điểm trên 1 vật chuẩn trong ảnh (vd 2 đầu giường) để tăng độ tin.'}
                {anchorPoints.length === 1 && 'Đã đặt 1 điểm — bấm điểm thứ 2 để hoàn tất.'}
              </div>
            )}
            {isMeasureCard && anchorPoints.length === 2 && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 8, border: '1px solid var(--accent-ring)', background: 'var(--accent-soft)' }}>
                <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 6 }}>Vật chuẩn vừa khoanh là gì?</div>
                <select
                  value={anchorKind}
                  onChange={(e) => {
                    const k = e.target.value as AnchorKind;
                    setAnchorKind(k);
                    setAnchorMm(ANCHOR_CONFIG[k].typicalMm);
                  }}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)', fontSize: 12, marginBottom: 6 }}
                >
                  {MANUAL_ANCHOR_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {ANCHOR_CONFIG[k].label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={anchorMm}
                  onChange={(e) => setAnchorMm(+e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)', fontSize: 12, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={onConfirmAnchorAndRerun}
                    style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Dùng vật chuẩn này, đo lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnchorPoints([])}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--t3)', fontSize: 12, cursor: 'pointer' }}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {primaryParams.map((p) =>
                // Tinh chỉnh 02/08 (docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md "MODE-DRIVEN SHELL")
                // — "Đổi ánh sáng/giờ → bảng THẺ giờ trong ngày, không phải slider chung" (ví dụ
                // ĐÍCH DANH Hoà nêu). Đúng đến từng tool này — thẻ/param khác giữ ParamControl
                // chung (sketch2render/clay2render/styletransfer Hoà đã xác nhận "như đang có,
                // đúng cho tool này"; đo món đồ đã có UI khoanh tay riêng bên dưới).
                card.id === 'relight' && p.id === 'lighting' && p.kind === 'select' ? (
                  <LightingCardPicker key={p.id} value={String(values[p.id] ?? p.options[0])} options={p.options} onChange={(v) => setValues((s) => ({ ...s, [p.id]: v }))} />
                ) : (
                  <ParamControl key={p.id} param={p} value={values[p.id]} onChange={(v) => setValues((s) => ({ ...s, [p.id]: v }))} />
                ),
              )}
            </div>

            {advancedParams.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((o) => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--t3)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <ChevronDown size={13} style={{ transform: advancedOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
                  Tinh chỉnh
                </button>
                {advancedOpen && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {advancedParams.map((p) => (
                      <ParamControl key={p.id} param={p} value={values[p.id]} onChange={(v) => setValues((s) => ({ ...s, [p.id]: v }))} />
                    ))}
                  </div>
                )}
              </div>
            )}

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
 * + dấu `~` + tooltip nêu `basis`. Luôn hiện "Tầng N · phương pháp bậc M · độ tin K%" (30/07 —
 * KHÔNG BAO GIỜ chỉ hiện chữ đỏ rồi dừng, trừ ngoại lệ thật — xem `status==='error'`). */
function MeasurementPanel({
  measurement,
  status,
  error,
  progress,
}: {
  measurement: MeasurePayload | null;
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

  const rows: { label: string; v: MeasurePayload['width'] }[] = [
    { label: 'Rộng · Width', v: measurement.width },
    { label: 'Sâu · Depth', v: measurement.depth },
    { label: 'Cao · Height', v: measurement.height },
  ];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 18, background: 'var(--field)' }}>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 12 }}>
        Tầng {measurement.aiTier} · {measurement.aiTierName} · {measurement.tierLabel} · độ tin <b style={{ color: 'var(--t1)' }}>{measurement.confidencePercent}%</b>
      </div>
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
      {measurement.upgradeHint && (
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, marginBottom: 8 }}>💡 {measurement.upgradeHint}</div>
      )}
      <div
        style={{
          marginTop: 8,
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
  measurement: MeasurePayload;
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
            methodLine: `Tầng ${measurement.aiTier} · ${measurement.aiTierName} · ${measurement.tierLabel} · độ tin ${measurement.confidencePercent}%`,
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

const LIGHTING_ICON: Record<string, typeof Sun> = {
  Daylight: Sun,
  Sunset: Sunset,
  'Đèn vàng ấm ban đêm': Moon,
  'Studio soft light': Lightbulb,
};

/** Bảng thẻ giờ trong ngày cho "Đổi ánh sáng/giờ" — thay `<select>` chung bằng lựa chọn TRỰC QUAN
 * theo đúng việc (mode-driven shell, xem nơi gọi). Vẫn ghi vào ĐÚNG param `lighting` — không đổi
 * gì ở tầng thực thi (`ai.relight`, `lib/nodes/registry.ts`), chỉ đổi CÁCH CHỌN. */
function LightingCardPicker({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Ánh sáng</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {options.map((o) => {
          const Icon = LIGHTING_ICON[o] ?? Sun;
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={active}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '12px 8px',
                borderRadius: 10,
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'color-mix(in srgb, var(--accent) 12%, var(--panel))' : 'var(--panel)',
                color: active ? 'var(--t1)' : 'var(--t2)',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.3 }}>{o}</span>
            </button>
          );
        })}
      </div>
    </div>
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
