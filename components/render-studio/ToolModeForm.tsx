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
import {
  ANCHOR_CONFIG,
  FURNITURE_SIZE_PRIORS,
  calibrateFromImage,
  type TieredMeasurement,
  type AnchorKind,
  type Pt2D,
  type FurnitureCategory,
  type MeasurementResult,
  type CameraCalib,
} from '@/lib/vision/single-view-metrology';
import { buildFurnitureFromMeasurement, orthoViewsToEntities, measurementToTarget } from '@/lib/vision/to-cad';
import { matchTemplate, readTemplateQueue, writeTemplateQueue, mergeTemplateRequests } from '@/lib/vision/match-template';
import {
  horizonFromCalib,
  applyUserHorizon,
  horizonConfidenceLabel,
  addGuideLine,
  updateGuideLineEndpoint,
  removeGuideLine,
  canAddGuideLine,
  MAX_GUIDE_LINES,
  type HorizonLine,
  type GuideLine,
} from '@/lib/vision/horizon';
import { loadManifest } from '@/lib/cad/block-library';
import { useCadStore } from '@/lib/cad/store';
import { screenToWorld } from '@/lib/cad/model';
import { loadImage } from '@/lib/imaging';
import type { ParamDef } from '@/lib/types';
import { useT } from '@/lib/i18n';

/** 2.2.89 (HZ, 15/08, docs/phieu-giao/duong-chan-troi.md) — đọc `--tap` (cỡ chạm chuẩn, 32
 * desktop/44 cảm ứng, `app/globals.css:105`) TẠI THỜI ĐIỂM VẼ thay vì hard-code, để tay nắm kéo
 * đường chân trời/đường gióng luôn đúng cỡ chạm hiện hành — không viết số riêng. */
function tapPx(): number {
  if (typeof window === 'undefined') return 32;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tap'));
  return Number.isFinite(v) && v > 0 ? v : 32;
}

/** Hình học hiển thị của `<img>` (object-fit:contain, có letterbox) — CÙNG công thức đã có trong
 * `onImageClick()`/vẽ chấm neo bên dưới, viết riêng ở module scope để overlay đường chân trời +
 * đường gióng dùng lại, KHÔNG sửa `onImageClick()` cũ (đúng phạm vi phiếu — chỉ thêm). */
function imgDisplayGeometry(img: HTMLImageElement) {
  const rect = img.getBoundingClientRect();
  const scale = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
  const dispW = img.naturalWidth * scale;
  const dispH = img.naturalHeight * scale;
  const offX = (rect.width - dispW) / 2;
  const offY = (rect.height - dispH) / 2;
  return { rect, scale, dispW, dispH, offX, offY };
}
/** Toạ độ pixel TỰ NHIÊN của ảnh → toạ độ hiển thị (relative tới khung `<img>`). */
function natToDisp(img: HTMLImageElement, p: Pt2D): Pt2D {
  const g = imgDisplayGeometry(img);
  return { x: g.offX + p.x * g.scale, y: g.offY + p.y * g.scale };
}
/** Toạ độ con trỏ chuột (client, viewport) → toạ độ pixel TỰ NHIÊN của ảnh — dùng khi kéo tay nắm. */
function dispClientToNat(img: HTMLImageElement, clientX: number, clientY: number): Pt2D {
  const g = imgDisplayGeometry(img);
  return { x: (clientX - g.rect.left - g.offX) / g.scale, y: (clientY - g.rect.top - g.offY) / g.scale };
}

type HorizonDragTarget = { kind: 'horizon'; end: 'y0' | 'y1' } | { kind: 'guide'; id: string; end: 'a' | 'b' };

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
  const tr = useT();

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
  // `card` có thể còn null lúc render đầu (trước early-return dưới `if (!card||!def)`) — bản
  // "sớm" này dùng optional chaining để hook đường chân trời (chạy TRƯỚC early-return, đúng luật
  // Hooks) không vỡ; `isMeasureCard` (không optional) vẫn khai lại y hệt ở dưới cho phần JSX cũ.
  const isMeasureCardEarly = card?.id === 'measureobject';
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

  // 2.2.89 (HZ, 15/08) — đường chân trời + đường gióng phụ. `calib` tính RIÊNG ở đây (không đợi
  // bấm Render/không đụng node "Đo món đồ") bằng ĐÚNG engine đã có (`calibrateFromImage`, không
  // viết lại phép tính — [Đ2]), vì `TieredMeasurement` (kết quả node) không mang `CameraCalib` ra
  // ngoài (`tryTier4()` ở single-view-metrology.ts tính xong rồi vứt). `userHorizon` khác null =
  // KTS đã đè tay, thắng máy [T5]; null = đang dùng bản suy từ `calib`.
  const [calib, setCalib] = useState<CameraCalib | null>(null);
  const [userHorizon, setUserHorizon] = useState<HorizonLine | null>(null);
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dragTarget, setDragTarget] = useState<HorizonDragTarget | null>(null);

  // Đổi thẻ → chỉ reset THAM SỐ (node AI khác thì params cũ không còn hợp lệ nữa) — KHÔNG đụng
  // `imageDataUrl`/`nodeRefs` (ở store, tự sống sót qua unmount/remount). Việc thay node AI thật
  // sự (xoá node cũ, dựng node mới, nối lại vào ĐÚNG node ảnh nguồn) xảy ra lười (lazy) trong
  // buildOrUpdateGraph(), đúng lúc user bấm Render — không mutate graph chỉ vì đang lướt xem thẻ.
  useEffect(() => {
    if (def) setValues(defaultParams(def));
    setAnchorPoints([]);
    setUserHorizon(null);
    setGuideLines([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  // Tính `CameraCalib` riêng cho UI đường chân trời — CÙNG cách `decodeToRgba()` của
  // `lib/nodes/defs/metrology.ts` (canvas + `loadImage`), viết lại tối thiểu tại đây vì node đó
  // không nằm trong phạm vi sửa của phiếu này. Chỉ chạy cho thẻ "Đo món đồ" có ảnh.
  useEffect(() => {
    if (!isMeasureCardEarly || !imageDataUrl) {
      setCalib(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const img = await loadImage(imageDataUrl);
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const maxSide = 1400; // cùng ngưỡng dò cạnh của node đo — đủ chi tiết, không nặng máy
        const s = Math.min(1, maxSide / Math.max(iw, ih));
        const w = Math.max(1, Math.round(iw * s));
        const h = Math.max(1, Math.round(ih * s));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (!cancelled) setCalib(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const id = ctx.getImageData(0, 0, w, h);
        const result = calibrateFromImage({ width: w, height: h, data: id.data });
        if (!cancelled) setCalib('needsManualScale' in result ? null : result);
      } catch {
        if (!cancelled) setCalib(null); // ảnh CORS/hỏng — không có calib, KHÔNG đoán đường chân trời
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMeasureCardEarly, imageDataUrl]);

  // Kéo tay nắm (đường chân trời hoặc đường gióng phụ) — nghe ở `window` vì con trỏ có thể trượt
  // ra ngoài vòng tròn nhỏ lúc kéo nhanh; state cập nhật qua callback (không đọc closure cũ).
  useEffect(() => {
    if (!dragTarget) return;
    const onMove = (e: PointerEvent) => {
      const img = imgRef.current;
      if (!img || !img.naturalWidth) return;
      const nat = dispClientToNat(img, e.clientX, e.clientY);
      if (dragTarget.kind === 'horizon') {
        const fracY = nat.y / img.naturalHeight; // applyUserHorizon() tự kẹp [0,1]
        setUserHorizon((prev) => {
          const base = prev ?? horizonFromCalib(calib) ?? { y0: 0.5, y1: 0.5 };
          const next = dragTarget.end === 'y0' ? { y0: fracY, y1: base.y1 } : { y0: base.y0, y1: fracY };
          return applyUserHorizon(next);
        });
      } else {
        const point: Pt2D = {
          x: Math.min(img.naturalWidth, Math.max(0, nat.x)),
          y: Math.min(img.naturalHeight, Math.max(0, nat.y)),
        };
        setGuideLines((prev) => updateGuideLineEndpoint(prev, dragTarget.id, dragTarget.end, point));
      }
    };
    const onUp = () => setDragTarget(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragTarget, calib]);

  const derivedHorizon = horizonFromCalib(calib);
  const horizon = userHorizon ?? derivedHorizon;

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
        setUserHorizon(null); // đường chân trời đè tay cũ cũng không còn nghĩa gì trên ảnh mới.
        setGuideLines([]);
        setImgLoaded(false);
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
                    onLoad={() => setImgLoaded(true)}
                    title={isMeasureCard ? 'Bấm 2 điểm trên 1 vật chuẩn (vd 2 đầu giường) để neo thang đo tay' : undefined}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
                  />
                  {/* 2.2.89 (HZ, 15/08) — đường chân trời + đường gióng phụ, chồng lên ảnh. Toạ độ
                      dùng lại `imgDisplayGeometry()`/`natToDisp()` (module scope, cùng công thức
                      object-fit:contain đã có ở `onImageClick()`/chấm neo dưới đây — không sửa
                      chúng, chỉ thêm lớp vẽ mới). */}
                  {isMeasureCard &&
                    imgLoaded &&
                    imgRef.current &&
                    (() => {
                      const img = imgRef.current!;
                      const hitR = tapPx() / 2; // cỡ chạm chuẩn (⑤ ràng buộc phiếu)
                      return (
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          {horizon &&
                            (() => {
                              const p0 = natToDisp(img, { x: 0, y: horizon.y0 * img.naturalHeight });
                              const p1 = natToDisp(img, { x: img.naturalWidth, y: horizon.y1 * img.naturalHeight });
                              return (
                                <g>
                                  <line
                                    x1={p0.x}
                                    y1={p0.y}
                                    x2={p1.x}
                                    y2={p1.y}
                                    stroke="var(--accent)"
                                    strokeWidth={1.5}
                                    // Nét ĐỨT = máy suy [derived] · nét LIỀN = KTS đã chỉnh tay [user] — khác nhau
                                    // nhìn là biết, không cùng 1 kiểu nét (đúng ④.3 của phiếu).
                                    strokeDasharray={horizon.source === 'derived' ? '7 6' : undefined}
                                  />
                                  {([
                                    ['y0', p0],
                                    ['y1', p1],
                                  ] as const).map(([end, p]) => (
                                    <circle
                                      key={end}
                                      cx={p.x}
                                      cy={p.y}
                                      r={hitR}
                                      fill="var(--accent)"
                                      fillOpacity={0.18}
                                      stroke="var(--accent)"
                                      strokeWidth={1.5}
                                      style={{ cursor: 'ns-resize', pointerEvents: 'auto' }}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        setDragTarget({ kind: 'horizon', end });
                                      }}
                                    />
                                  ))}
                                </g>
                              );
                            })()}
                          {guideLines.map((g) => {
                            const pa = natToDisp(img, g.a);
                            const pb = natToDisp(img, g.b);
                            return (
                              <g key={g.id}>
                                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="var(--warning)" strokeWidth={1.5} strokeDasharray="3 4" />
                                {([
                                  ['a', pa],
                                  ['b', pb],
                                ] as const).map(([end, p]) => (
                                  <circle
                                    key={end}
                                    cx={p.x}
                                    cy={p.y}
                                    r={hitR * 0.8}
                                    fill="var(--warning)"
                                    fillOpacity={0.18}
                                    stroke="var(--warning)"
                                    strokeWidth={1.5}
                                    style={{ cursor: 'grab', pointerEvents: 'auto' }}
                                    onPointerDown={(e) => {
                                      e.stopPropagation();
                                      setDragTarget({ kind: 'guide', id: g.id, end });
                                    }}
                                  />
                                ))}
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
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
              <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: '1px solid var(--accent-ring)', background: 'var(--accent-soft)' }}>
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

            {/* 2.2.89 (HZ, 15/08) — bảng điều khiển đường chân trời + đường gióng phụ (④.3/④.4). */}
            {isMeasureCard && imageDataUrl && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--field)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>Đường chân trời</div>
                  {userHorizon && (
                    <button
                      type="button"
                      onClick={() => setUserHorizon(null)}
                      title="Bỏ đường đã chỉnh tay, quay về đường máy suy từ điểm tụ ảnh"
                      style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      ↺ Về đường máy suy
                    </button>
                  )}
                </div>
                {horizon ? (
                  <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>
                    {horizonConfidenceLabel(horizon)} — nét {horizon.source === 'derived' ? 'đứt' : 'liền'} trên ảnh. Kéo 2 chấm 2
                    đầu đường để chỉnh tay.
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--t4)', lineHeight: 1.5 }}>
                    Ảnh không đủ cạnh thẳng theo 2 phương để tự suy đường chân trời.{' '}
                    <button
                      type="button"
                      onClick={() => setUserHorizon(applyUserHorizon({ y0: 0.5, y1: 0.5 }))}
                      style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Đặt đường chân trời bằng tay
                    </button>
                  </div>
                )}

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 600 }}>
                      Đường gióng phụ ({guideLines.length}/{MAX_GUIDE_LINES})
                    </div>
                    <button
                      type="button"
                      disabled={!canAddGuideLine(guideLines) || !imgRef.current}
                      title={!canAddGuideLine(guideLines) ? `Đã đủ tối đa ${MAX_GUIDE_LINES} đường — xoá bớt để thêm mới.` : 'Thêm 1 đường gióng, kéo tay để đặt vị trí'}
                      onClick={() => {
                        const img = imgRef.current;
                        if (!img || !img.naturalWidth) return;
                        const w = img.naturalWidth;
                        const h = img.naturalHeight;
                        setGuideLines((prev) =>
                          addGuideLine(prev, { id: crypto.randomUUID(), a: { x: w * 0.3, y: h * 0.5 }, b: { x: w * 0.7, y: h * 0.5 } }),
                        );
                      }}
                      style={{
                        fontSize: 11,
                        color: canAddGuideLine(guideLines) ? 'var(--accent)' : 'var(--t4)',
                        background: 'transparent',
                        border: 'none',
                        cursor: canAddGuideLine(guideLines) ? 'pointer' : 'not-allowed',
                        padding: 0,
                      }}
                    >
                      + Thêm đường gióng
                    </button>
                  </div>
                  {guideLines.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {guideLines.map((g, i) => (
                        <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
                          <span>Đường gióng {i + 1} — kéo 2 chấm vàng trên ảnh</span>
                          <button
                            type="button"
                            onClick={() => setGuideLines((prev) => removeGuideLine(prev, g.id))}
                            style={{ color: 'var(--t4)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Xoá
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 10.5, color: 'var(--t4)', lineHeight: 1.5 }}>
                    Chỉ hiển thị + lưu ở lượt này — CHƯA áp vào ảnh AI. Kéo đường xong ảnh KHÔNG tự đổi.
                  </div>
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
                  <ChevronDown size={14} style={{ transform: advancedOpen ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
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
                borderRadius: 10,
                border: 'none',
                background: canRender ? 'var(--accent)' : 'var(--border)',
                color: 'var(--on-accent)',
                fontSize: 'var(--fs-ui)',
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
              <>
                <MeasurementExportButton imageDataUrl={imageDataUrl} measurement={measurement} />
                {/* G-M3-03 (06/08) — hai bước cuối của dây chuyền ảnh→bản vẽ (khớp mẫu block ⑤ +
                    ba hình chiếu ⑥) đã viết xong từ trước nhưng có 0 nơi gọi. Đây là chỗ gọi. */}
                <MeasurementToCadButtons
                  measurement={measurement}
                  categoryLabel={String(values.category ?? '')}
                  imageDataUrl={imageDataUrl}
                />
              </>
            )}
            {!smallScreen && (
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={openCanvas}
                  title={tr('Xem/chỉnh khối phía sau thẻ này trên canvas', 'View/edit the block behind this card on the canvas')}
                  style={{
                    fontSize: 12,
                    color: 'var(--t3)',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
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
          borderRadius: 10,
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
  // VIỆC 5 (07/08, G-M13-01) — trước đây `await exportMeasurementSpecSheet(...)` không có `catch`:
  // dựng file hỏng (canvas lỗi, disk full…) thì nút kẹt "Đang dựng…" rồi im lặng, không báo, không
  // lùi được (đúng luật §5 N3/§4 G6). Bắt lỗi tại chỗ, hiện dòng đỏ ngay dưới nút.
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const studioName = getActiveBrandKit()?.name ?? '';
            await exportMeasurementSpecSheet({
              photoDataUrl: imageDataUrl,
              result: measurement,
              methodLine: `Tầng ${measurement.aiTier} · ${measurement.aiTierName} · ${measurement.tierLabel} · độ tin ${measurement.confidencePercent}%`,
              projectName: flowName,
              studioName,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Không dựng được Spec Sheet — thử lại.');
          } finally {
            setBusy(false);
          }
        }}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '9px',
          borderRadius: 10,
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
      {error && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--danger)', lineHeight: 1.5 }}>{error}</div>
      )}
    </div>
  );
}

/**
 * G-M3-03 — HAI NÚT nối "món vừa đo" sang BẢN VẼ THẬT.
 *
 * Trước 06/08: `lib/vision/match-template.ts` (⑤) và `lib/vision/ortho-projection.ts` (⑥) đã viết
 * xong + có test nhưng `grep -rn "match-template\|ortho-projection" components app` = **0 dòng**
 * ⇒ dây chuyền ảnh→bản vẽ đứt đúng giữa vision và block. Đây là cửa gọi chúng, qua cầu nối thuần
 * `lib/vision/to-cad.ts` (có test riêng).
 *
 * Ghi thẳng vào `useCadStore` — ĐÚNG luật X1 (`docs/00-CHOT.md`): dựng ở chặng nào cũng ghi vào
 * MỘT `Doc`, không đẻ "model riêng của chặng 3D". Mở chặng Thiết kế 2D là thấy hình ngay.
 *
 * ⚠️ Nói rõ giới hạn, không giấu: mặt nạ (silhouette) của bước ③ KHÔNG có trong payload node đo
 * (`MeasurePayload` chỉ mang cờ `hasSilhouette`), nên mặt đứng dựng từ hộp bao chứ chưa phải
 * đường bao thật của vật. Muốn có, phải cho node đo xuất mặt nạ ra — việc của lượt sau.
 */
function MeasurementToCadButtons({
  measurement,
  categoryLabel,
  imageDataUrl,
}: {
  measurement: MeasurePayload;
  categoryLabel: string;
  imageDataUrl: string;
}) {
  const [busy, setBusy] = useState<'block' | 'ortho' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Node đo ghi LABEL vào param `category` (select hiện label, không phải khoá) — đổi ngược lại
  // đúng cách `lib/nodes/defs/metrology.ts:113` đang làm, không tự chế bảng thứ hai.
  const category = (Object.keys(FURNITURE_SIZE_PRIORS) as FurnitureCategory[]).find(
    (k) => FURNITURE_SIZE_PRIORS[k].label === categoryLabel,
  );

  const result: MeasurementResult = {
    width: measurement.width,
    depth: measurement.depth,
    height: measurement.height,
  };

  const dropPoint = () => {
    const st = useCadStore.getState();
    return screenToWorld(st.viewport, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  };

  const onBuildBlock = async () => {
    setBusy('block');
    try {
      const manifest = await loadManifest().catch(() => null);
      const built = buildFurnitureFromMeasurement({
        measurement: result,
        at: dropPoint(),
        category,
        manifest,
        imageUrl: imageDataUrl,
        now: Date.now(),
      });
      const st = useCadStore.getState();
      // Số đo hỏng (NaN/vô cực/≤0) ⇒ `entities` rỗng: báo đúng câu giải thích, KHÔNG nói "đã đặt".
      if (built.invalidDims) {
        st.setStatus(built.label);
        setMsg(built.label);
        return;
      }
      st.addEntities(built.entities);
      st.setStatus(`${built.label} — đã đặt ${built.entities.length} nét vào bản vẽ. ⌘Z để lùi.`);
      // Trượt ngưỡng ⇒ ghi MỘT DÒNG VIỆC cho thư viện (cơ chế `TemplateRequest` đã có sẵn, trước
      // nay cũng chưa ai gọi) — thư viện tự lớn theo cách studio dùng thật.
      if (built.request) writeTemplateQueue(mergeTemplateRequests(readTemplateQueue(), built.request));
      setMsg(
        built.usedFallback
          ? `${built.label}. Đã ghi vào danh sách mẫu cần bổ sung.`
          : `${built.label} — mở chặng Thiết kế 2D để xem.`,
      );
    } finally {
      setBusy(null);
    }
  };

  const onBuildOrtho = async () => {
    setBusy('ortho');
    try {
      const manifest = await loadManifest().catch(() => null);
      const match = matchTemplate(measurementToTarget(result), { category, manifest });
      const built = orthoViewsToEntities(result, dropPoint(), { match });
      const st = useCadStore.getState();
      if (built.invalidDims) {
        st.setStatus(built.warning);
        setMsg(built.warning);
        return;
      }
      st.addEntities(built.entities);
      st.setStatus(`Đã đặt 3 hình chiếu (${built.entities.length} nét). ${built.warning} ⌘Z để lùi.`);
      setMsg(`Mặt bằng · Mặt đứng · Mặt bên đã vào bản vẽ. ${built.warning}`);
    } finally {
      setBusy(null);
    }
  };

  const btn = (disabled: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '9px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--t2)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={busy !== null} onClick={onBuildBlock} style={btn(busy !== null)}>
          {busy === 'block' ? 'Đang dựng…' : '⬒ Dựng khối trên bản vẽ'}
        </button>
        <button type="button" disabled={busy !== null} onClick={onBuildOrtho} style={btn(busy !== null)}>
          {busy === 'ortho' ? 'Đang dựng…' : '⊞ Ba hình chiếu'}
        </button>
      </div>
      {!category && (
        <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 6, lineHeight: 1.5 }}>
          Chọn "Loại đồ" ở trên để khớp mẫu có căn cứ — chưa chọn thì chỉ ra khối tạm.
        </div>
      )}
      {msg && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 6, lineHeight: 1.5 }}>{msg}</div>}
    </div>
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
            borderRadius: 6,
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
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--panel)',
          color: 'var(--t1)',
          fontSize: 12.5,
        }}
      />
    </label>
  );
}
