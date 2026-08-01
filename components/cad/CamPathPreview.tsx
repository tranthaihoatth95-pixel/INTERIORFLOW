'use client';

/**
 * components/cad/CamPathPreview.tsx — V2 mức 2-a (`docs/SPEC-VIDEO-MAT-BANG.md` §2.3): xem thử
 * đường cam TRÊN mặt bằng 2D. Mặt bằng đứng yên (render TĨNH một lần — bài học phần C: hàng nghìn
 * entity mà animate riêng lẻ sẽ nghẽn), CHỈ animate lớp hình quạt tầm nhìn + chấm định vị chạy
 * dọc `planCamPath()`. Look-at: CHỈ chế độ 1 (tiếp tuyến, "đi tới đâu nhìn tới đó") — chế độ
 * khoá-điểm/khoá-zone (§2.1 mục 2-3) là V2.1, CHƯA làm ở đây.
 *
 * Tốc độ/tiêu cự (`speedMmPerSec`/`lensMm`) là THAM SỐ TRUYỀN VÀO component (props, mặc định
 * đúng spec: 1200mm/s · 35mm), CHƯA lưu per-entity/DXF — panel chỉnh tay sau khi vẽ (§2 phần B)
 * CHƯA làm, xem báo cáo cuối. Cao độ mắt (1650mm, §2.1) không ảnh hưởng hình học quạt 2D (chỉ có
 * ý nghĩa với camera 3D — mức 2-b, chưa tới lượt) nên KHÔNG phải prop của component này.
 */

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Doc, Entity, Layer } from '@/lib/cad/model';
import { docBox } from '@/lib/cad/model';
import { planCamPath } from '@/lib/cad/campath';
import { entityToStrokeD, entityToFillD } from '@/lib/cad/entity-path';
import { lineweightOf } from '@/lib/cad/plan-drawon';
import { fovFromLens } from '@/lib/three/camera';
import { guard } from '@/lib/motion-apple';

export interface CamPathPreviewProps {
  doc: Pick<Doc, 'entities' | 'layers'>;
  /** id entity polyline mang cờ `campath:true` cần xem — component tự đọc `points` từ đó. */
  campathEntityId: string;
  /** tiêu cự mm — suy FOV qua `fovFromLens()` (`lib/three/camera.ts`). Mặc định 35 (§2.1). */
  lensMm?: number;
  /** tốc độ đi, mm/giây. Mặc định 1200 (§2.1). */
  speedMmPerSec?: number;
  className?: string;
}

const DOT_RADIUS_FRACTION = 0.01; // bán kính chấm định vị = 1% cạnh dài mặt bằng — tỉ lệ, không cố định px

export default function CamPathPreview({ doc, campathEntityId, lensMm = 35, speedMmPerSec = 1200, className }: CamPathPreviewProps) {
  const reduce = !!useReducedMotion();
  const box = useMemo(() => docBox(doc as Doc), [doc]);
  const layerById = useMemo(() => new Map(doc.layers.map((l) => [l.id, l] as const)), [doc.layers]);
  const campathEntity = useMemo(() => doc.entities.find((e) => e.id === campathEntityId), [doc.entities, campathEntityId]);
  const points = useMemo(() => (campathEntity?.type === 'polyline' ? campathEntity.points : []), [campathEntity]);
  const plan = useMemo(() => planCamPath(points, { speedMmPerSec }), [points, speedMmPerSec]);

  if (!box || plan.samples.length === 0) return null;

  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const pad = Math.max(w, h) * 0.05 || 100;
  const viewBox = `${box.minX - pad} ${box.minY - pad} ${w + pad * 2} ${h + pad * 2}`;
  const spanMax = Math.max(w, h) || 1000;
  const fanReachMm = Math.min(spanMax * 0.15, 3000); // bán kính hình quạt — thẩm mỹ (không phải khoảng nhìn xa thật)
  const dotRadiusMm = spanMax * DOT_RADIUS_FRACTION;
  const fovDeg = fovFromLens(lensMm);
  const fanD = buildFanPathD(fanReachMm, fovDeg);

  const xs = plan.samples.map((s) => s.point.x);
  const ys = plan.samples.map((s) => s.point.y);
  const rotDeg = plan.samples.map((s) => (s.dirRad * 180) / Math.PI);
  const times = plan.samples.map((s) => (plan.totalDurationSec > 0 ? s.tSec / plan.totalDurationSec : 0));
  const duration = Math.max(0.1, plan.totalDurationSec);

  return (
    <svg viewBox={viewBox} className={className} style={{ width: '100%', height: '100%' }}>
      <g className="if-campath-static-plan" opacity={0.6}>
        {renderStaticPlan(doc.entities, layerById)}
      </g>

      <path d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={dotRadiusMm * 0.3} strokeDasharray={`${dotRadiusMm} ${dotRadiusMm}`} opacity={0.4} />

      <motion.g
        className="if-campath-fan"
        initial={{ x: xs[0], y: ys[0], rotate: rotDeg[0] }}
        {...guard(reduce, {
          animate: { x: xs, y: ys, rotate: rotDeg },
          transition: { duration, times, ease: 'linear', repeat: Infinity },
        })}
      >
        <path d={fanD} fill="currentColor" opacity={0.18} />
        <circle cx={0} cy={0} r={dotRadiusMm} fill="currentColor" />
      </motion.g>
    </svg>
  );
}

/** Làm tròn 2 chữ số — đủ chính xác cho hình học mm, và QUAN TRỌNG: tránh lệch hydrate SSR↔CSR
 * (Math.cos/sin có thể lệch 1 ULP giữa build V8 của Node và Chrome, sinh khác biệt ở chữ số cuối
 * nếu in đủ ~17 chữ số của float64 thô — làm tròn về cùng 1 chuỗi ở cả 2 phía). */
function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Wedge hình quạt tầm nhìn, LOCAL SPACE, đỉnh tại gốc, trục chính +X (khớp `dirRad=0` của
 * campath.ts: atan2 chuẩn, hướng +X). Xấp xỉ cung bằng đa giác (tránh mơ hồ sweep-flag của lệnh
 * arc SVG khi ghép với `rotate` do framer-motion tự áp — cùng kỹ thuật entity-path.ts dùng cho
 * circle/ellipse). */
function buildFanPathD(reachMm: number, fovDeg: number, segments = 16): string {
  const halfRad = (fovDeg / 2) * (Math.PI / 180);
  const pts: string[] = ['M 0 0'];
  for (let i = 0; i <= segments; i++) {
    const a = -halfRad + (2 * halfRad * i) / segments;
    pts.push(`L ${r2(reachMm * Math.cos(a))} ${r2(reachMm * Math.sin(a))}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

function renderStaticPlan(entities: Entity[], layerById: Map<string, Layer>) {
  return entities.map((e) => {
    const strokeD = entityToStrokeD(e);
    if (strokeD) {
      const lw = lineweightOf(e, layerById);
      return <path key={e.id} d={strokeD} fill="none" stroke="currentColor" strokeWidth={lw} vectorEffect="non-scaling-stroke" />;
    }
    const fillD = entityToFillD(e);
    if (fillD) return <path key={e.id} d={fillD} fill="currentColor" opacity={0.5} />;
    return null;
  });
}
