'use client';

/**
 * components/cad/DrawOnPreview.tsx — V1 phần C (`docs/SPEC-VIDEO-MAT-BANG.md` §1): xem thử video
 * draw-on của MỘT mặt bằng. Đọc `planDrawOn()` (`lib/cad/plan-drawon.ts`) để biết 5 đợt + mốc thời
 * gian, rồi vẽ SVG theo đúng kỹ thuật §1.1 cho từng đợt:
 *   ① Vỏ       — `stroke-dashoffset` (line/polyline/rect/circle/arc), hatch tô bằng `clip-path`.
 *   ② Lỗ mở    — hiện tại chỗ + xoay 90° (`guard()` cho reduced-motion).
 *   ③ Nội thất — mờ-lên + trồi (`guard()`).
 *   ④ Vùng     — tô loang từ `labelPos`/tâm polygon ra biên, `clip-path: circle()` (`guard()`).
 *   ⑤ Ghi chú  — mờ-lên, không trồi (`guard()`).
 *
 * LỆCH KHỎI HỆ CHUYỂN ĐỘNG CHUNG (`lib/motion-apple.ts`) — CÓ CHỦ Ý, cần nêu rõ: đợt ① dùng CSS
 * `@keyframes` thuần thay vì `motion.path` + `guard()` như 4 đợt còn lại. Lý do: đợt ① có thể tới
 * HÀNG NGHÌN `<path>` đồng thời (mặt bằng phức tạp) — framer-motion tính lại bằng JS mỗi frame cho
 * từng phần tử sẽ là chỗ nghẽn đầu tiên; CSS animation để trình duyệt tự composite trên GPU. Đợt ①
 * vẫn tôn trọng reduced-motion, chỉ KHÔNG qua hàm `guard()` — xem `shellStyle()` bên dưới.
 *
 * Block (cửa/cửa sổ/nội thất) chưa có hình khối thật trong preview này — dùng HÌNH CHỮ NHẬT bbox
 * từ `BLOCK_MAP[block].w/h` (lib/cad/furniture.ts) làm placeholder, KHÔNG vẽ prims thật của block.
 * Đủ để xem nhịp/thứ tự draw-on; vẽ đúng hình khối là việc khác, không thuộc phần C.
 */

import { useMemo } from 'react';
import { motion, useReducedMotion, type Transition, type TargetAndTransition } from 'framer-motion';
import type { Doc, Entity, Layer } from '@/lib/cad/model';
import { docBox } from '@/lib/cad/model';
import { planDrawOn, DRAW_ON_BATCH_DURATION_SEC, lineweightOf, type DrawOnBatch } from '@/lib/cad/plan-drawon';
import { entityToStrokeD, entityToFillD, strokeLength, batchStrokeD, batchStrokeLength } from '@/lib/cad/entity-path';
import { easeApple } from '@/lib/motion';
import { guard } from '@/lib/motion-apple';
import { BLOCK_MAP } from '@/lib/cad/furniture';

export interface DrawOnPreviewProps {
  doc: Pick<Doc, 'entities' | 'layers'>;
  /** true = gộp entity cùng layer thành 1 `<path>` (bật khi đo FPS < 30fps — xem SPEC §ĐK ra khỏi phần C). */
  batching?: boolean;
  className?: string;
}

const EASE_CSS = `cubic-bezier(${easeApple.join(',')})`;

/** Ngưỡng tự bật batching cho đợt ① — xem số đo trong `renderShell()`. Chọn 500 (không phải 1900,
 * điểm proxy đo được rơi dưới 30fps) để chừa biên an toàn: phép đo chỉ tính chi phí style-recalc,
 * CHƯA cộng paint/composite thật + 4 đợt khác chạy song song trong sản phẩm thật. */
const SHELL_AUTO_BATCH_THRESHOLD = 500;

/** initial = trạng thái ẨN khi có motion; = trạng thái HIỆN SẴN khi reduced-motion (không animate
 * từ trạng thái ẩn — tức KHÔNG BAO GIỜ để phần tử kẹt vô hình khi tắt animate qua `guard()`). */
function reveal(reduce: boolean, hidden: TargetAndTransition, visible: TargetAndTransition, transition: Transition) {
  return { initial: reduce ? visible : hidden, ...guard(reduce, { animate: visible, transition }) };
}

export default function DrawOnPreview({ doc, batching = false, className }: DrawOnPreviewProps) {
  const reduce = !!useReducedMotion();
  const plan = useMemo(() => planDrawOn(doc), [doc]);
  const box = useMemo(() => docBox(doc as Doc), [doc]);
  const layerById = useMemo(() => new Map(doc.layers.map((l) => [l.id, l] as const)), [doc.layers]);
  const entityById = useMemo(() => new Map(doc.entities.map((e) => [e.id, e] as const)), [doc.entities]);
  const delayById = useMemo(() => new Map(plan.timings.map((t) => [t.id, t.delaySec] as const)), [plan.timings]);

  const byBatch = useMemo(() => {
    const m = new Map<DrawOnBatch, Entity[]>();
    for (const g of plan.groups) m.set(g.batch, g.entityIds.map((id) => entityById.get(id)).filter((e): e is Entity => !!e));
    return m;
  }, [plan.groups, entityById]);

  if (!box) return null;
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const pad = Math.max(w, h) * 0.03 || 100;
  const viewBox = `${box.minX - pad} ${box.minY - pad} ${w + pad * 2} ${h + pad * 2}`;

  return (
    <svg viewBox={viewBox} className={className} style={{ width: '100%', height: '100%' }}>
      <style jsx>{`
        @keyframes if-draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
      `}</style>
      {renderShell(byBatch.get('shell') ?? [], layerById, delayById, batching, reduce)}
      {renderOpenings(byBatch.get('openings') ?? [], delayById, reduce)}
      {renderFurniture(byBatch.get('furniture') ?? [], delayById, reduce)}
      {renderZones(byBatch.get('zones') ?? [], delayById, reduce)}
      {renderAnnotations(byBatch.get('annotations') ?? [], delayById, reduce)}
    </svg>
  );
}

/** đợt ① CSS thuần (không `guard()` — xem JSDoc đầu file). `reduce=true` ⇒ dashoffset:0 thẳng,
 * KHÔNG gắn animation-name (giữ đúng nguyên tắc "không kẹt vô hình" như `reveal()` ở trên). */
function shellStyle(len: number, delaySec: number, durationSec: number, reduce: boolean): React.CSSProperties {
  const base: React.CSSProperties = { ['--len' as string]: len, strokeDasharray: len };
  if (reduce) return { ...base, strokeDashoffset: 0 };
  return { ...base, animation: `if-draw ${durationSec}s ${EASE_CSS} ${delaySec}s both` };
}

function renderShell(
  entities: Entity[],
  layerById: Map<string, Layer>,
  delayById: Map<string, number>,
  batching: boolean,
  reduce: boolean,
) {
  const strokeable = entities.filter((e) => entityToStrokeD(e) !== null);
  const fillable = entities.filter((e) => entityToFillD(e) !== null);
  const batchEnd = DRAW_ON_BATCH_DURATION_SEC.shell; // đợt ① luôn bắt đầu ở t=0 (đợt đầu tiên).
  // đo 01/08 (harness `/dev/drawon-fps`, đã xoá sau khi đo): 2000 <path> RIÊNG LẺ cùng animate
  // stroke-dashoffset ⇒ ~31fps (biên, dưới ngưỡng an toàn) · gộp thành 1 <path>/layer ⇒ dư sức
  // >1000fps. Tự bật batching khi vượt ngưỡng, KHÔNG cần caller tự đoán — vẫn cho ép `batching` tay.
  const effectiveBatching = batching || strokeable.length > SHELL_AUTO_BATCH_THRESHOLD;

  const strokeEls = effectiveBatching
    ? batchByLayer(strokeable).map(([layerId, list]) => {
        const d = batchStrokeD(list);
        const len = batchStrokeLength(list);
        const lw = layerById.get(layerId)?.lineweight ?? 0.25;
        return <path key={`shell-batch-${layerId}`} d={d} fill="none" stroke="currentColor" strokeWidth={lw} style={shellStyle(len, 0, batchEnd, reduce)} />;
      })
    : strokeable.map((e) => {
        const d = entityToStrokeD(e)!;
        const len = strokeLength(e);
        const lw = lineweightOf(e, layerById);
        const delay = delayById.get(e.id) ?? 0;
        const duration = Math.max(0.1, batchEnd - delay);
        return <path key={e.id} d={d} fill="none" stroke="currentColor" strokeWidth={lw} style={shellStyle(len, delay, duration, reduce)} />;
      });

  // hatch (tô đặc thân tường) — clip-path quét ngang, đồng bộ khung thời gian đợt ①.
  const fillEls = fillable.map((e) => {
    const d = entityToFillD(e)!;
    const delay = delayById.get(e.id) ?? 0;
    const { initial, animate, transition } = reveal(
      reduce,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)' },
      { duration: Math.max(0.1, batchEnd - delay), delay, ease: easeApple },
    );
    return <motion.path key={e.id} d={d} fill="currentColor" opacity={0.9} initial={initial} animate={animate} transition={transition} />;
  });

  return <g className="if-drawon-shell">{fillEls}{strokeEls}</g>;
}

function batchByLayer(entities: Entity[]): [string, Entity[]][] {
  const m = new Map<string, Entity[]>();
  for (const e of entities) {
    const list = m.get(e.layer) ?? [];
    list.push(e);
    m.set(e.layer, list);
  }
  return [...m.entries()];
}

function blockRect(e: Extract<Entity, { type: 'block' }>) {
  const def = BLOCK_MAP[e.block];
  const w = def?.w ?? 900;
  const h = def?.h ?? 50;
  return { x: e.at.x - w / 2, y: e.at.y - h / 2, w, h, rotDeg: (e.rot * 180) / Math.PI };
}

function renderOpenings(entities: Entity[], delayById: Map<string, number>, reduce: boolean) {
  const start = DRAW_ON_BATCH_DURATION_SEC.shell;
  const end = start + DRAW_ON_BATCH_DURATION_SEC.openings;
  return (
    <g className="if-drawon-openings">
      {entities.map((e) => {
        if (e.type !== 'block') return null;
        const r = blockRect(e);
        const delay = delayById.get(e.id) ?? start;
        const { initial, animate, transition } = reveal(
          reduce,
          { opacity: 0, rotate: -90 },
          { opacity: 0.5, rotate: r.rotDeg },
          { duration: Math.max(0.1, end - delay), delay, ease: easeApple },
        );
        return (
          <motion.rect
            key={e.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="currentColor"
            style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
            initial={initial}
            animate={animate}
            transition={transition}
          />
        );
      })}
    </g>
  );
}

function renderFurniture(entities: Entity[], delayById: Map<string, number>, reduce: boolean) {
  const start = DRAW_ON_BATCH_DURATION_SEC.shell + DRAW_ON_BATCH_DURATION_SEC.openings;
  const end = start + DRAW_ON_BATCH_DURATION_SEC.furniture;
  return (
    <g className="if-drawon-furniture">
      {entities.map((e) => {
        const delay = delayById.get(e.id) ?? start;
        const { initial, animate, transition } = reveal(reduce, { opacity: 0, y: 4 }, { opacity: 0.6, y: 0 }, { duration: Math.max(0.1, end - delay), delay, ease: easeApple });
        if (e.type === 'block') {
          const rect = blockRect(e);
          return (
            <motion.rect
              key={e.id}
              x={rect.x}
              y={rect.y}
              width={rect.w}
              height={rect.h}
              fill="currentColor"
              transform={`rotate(${rect.rotDeg} ${e.at.x} ${e.at.y})`}
              initial={initial}
              animate={animate}
              transition={transition}
            />
          );
        }
        const d = entityToStrokeD(e);
        if (!d) return null;
        return <motion.path key={e.id} d={d} fill="none" stroke="currentColor" strokeWidth={0.3} initial={initial} animate={animate} transition={transition} />;
      })}
    </g>
  );
}

function zoneCenter(e: Extract<Entity, { type: 'zone' }>) {
  if (e.labelPos) return e.labelPos;
  if (e.ellipse) return e.ellipse.c;
  if (e.polygon && e.polygon.length) {
    const sx = e.polygon.reduce((s, p) => s + p.x, 0) / e.polygon.length;
    const sy = e.polygon.reduce((s, p) => s + p.y, 0) / e.polygon.length;
    return { x: sx, y: sy };
  }
  return { x: 0, y: 0 };
}

function renderZones(entities: Entity[], delayById: Map<string, number>, reduce: boolean) {
  const start = DRAW_ON_BATCH_DURATION_SEC.shell + DRAW_ON_BATCH_DURATION_SEC.openings + DRAW_ON_BATCH_DURATION_SEC.furniture;
  const end = start + DRAW_ON_BATCH_DURATION_SEC.zones;
  return (
    <g className="if-drawon-zones">
      {entities.map((e) => {
        if (e.type !== 'zone') return null;
        const d = entityToFillD(e);
        const c = zoneCenter(e);
        const delay = delayById.get(e.id) ?? start;
        const dur = Math.max(0.1, end - delay);
        const { initial, animate, transition } = reveal(
          reduce,
          { clipPath: `circle(0% at ${c.x}px ${c.y}px)` },
          { clipPath: `circle(150% at ${c.x}px ${c.y}px)` },
          { duration: dur, delay, ease: easeApple },
        );
        if (d) return <motion.path key={e.id} d={d} fill="currentColor" opacity={0.35} initial={initial} animate={animate} transition={transition} />;
        if (e.ellipse) {
          return (
            <motion.ellipse
              key={e.id}
              cx={e.ellipse.c.x}
              cy={e.ellipse.c.y}
              rx={e.ellipse.rx}
              ry={e.ellipse.ry}
              fill="currentColor"
              opacity={0.35}
              initial={initial}
              animate={animate}
              transition={transition}
            />
          );
        }
        return null;
      })}
    </g>
  );
}

function renderAnnotations(entities: Entity[], delayById: Map<string, number>, reduce: boolean) {
  const start = DRAW_ON_BATCH_DURATION_SEC.shell + DRAW_ON_BATCH_DURATION_SEC.openings + DRAW_ON_BATCH_DURATION_SEC.furniture + DRAW_ON_BATCH_DURATION_SEC.zones;
  const end = start + DRAW_ON_BATCH_DURATION_SEC.annotations;
  return (
    <g className="if-drawon-annotations">
      {entities.map((e) => {
        const delay = delayById.get(e.id) ?? start;
        const dur = Math.max(0.1, end - delay);
        const { initial, animate, transition } = reveal(reduce, { opacity: 0 }, { opacity: 1 }, { duration: dur, delay, ease: easeApple });
        if (e.type === 'text') {
          return (
            <motion.text key={e.id} x={e.at.x} y={e.at.y} fontSize={e.h} fill="currentColor" initial={initial} animate={animate} transition={transition}>
              {e.text}
            </motion.text>
          );
        }
        if (e.type === 'dim') {
          return (
            <motion.line key={e.id} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y} stroke="currentColor" strokeWidth={0.15} initial={initial} animate={animate} transition={transition} />
          );
        }
        return null;
      })}
    </g>
  );
}
