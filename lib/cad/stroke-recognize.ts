import type { Pt } from './model';

export type RecognizedStroke =
  | { kind: 'line'; a: Pt; b: Pt }
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'circle'; c: Pt; r: number }
  | { kind: 'polyline'; points: Pt[]; closed: boolean };

const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function pointLineDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const den = dx * dx + dy * dy;
  if (!den) return d(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den));
  return d(p, { x: a.x + t * dx, y: a.y + t * dy });
}

export function simplifyStroke(points: Pt[], epsilon: number): Pt[] {
  if (points.length <= 2) return points.slice();
  let max = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointLineDistance(points[i], points[0], points[points.length - 1]);
    if (distance > max) { max = distance; index = i; }
  }
  if (max <= epsilon) return [points[0], points[points.length - 1]];
  const left = simplifyStroke(points.slice(0, index + 1), epsilon);
  const right = simplifyStroke(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function strokeLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += d(points[i - 1], points[i]);
  return total;
}

function axisSnap(a: Pt, b: Pt): [Pt, Pt] {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const nearHorizontal = Math.abs(Math.sin(angle)) < Math.sin(5 * Math.PI / 180);
  const nearVertical = Math.abs(Math.cos(angle)) < Math.sin(5 * Math.PI / 180);
  if (nearHorizontal) return [a, { x: b.x, y: a.y }];
  if (nearVertical) return [a, { x: a.x, y: b.y }];
  return [a, b];
}

function circleFit(points: Pt[]): { c: Pt; r: number; variance: number } {
  const c = points.reduce((sum, p) => ({ x: sum.x + p.x / points.length, y: sum.y + p.y / points.length }), { x: 0, y: 0 });
  const radii = points.map((p) => d(p, c));
  const r = radii.reduce((sum, value) => sum + value, 0) / radii.length;
  const variance = r ? Math.sqrt(radii.reduce((sum, value) => sum + (value - r) ** 2, 0) / radii.length) / r : Infinity;
  return { c, r, variance };
}

function rectFrom(points: Pt[], tolerance: number): RecognizedStroke | null {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const w = maxX - minX; const h = maxY - minY;
  if (w < tolerance * 2 || h < tolerance * 2) return null;
  const corners = [
    { x: minX, y: minY }, { x: maxX, y: minY },
    { x: maxX, y: maxY }, { x: minX, y: maxY },
  ];
  const everyNearEdge = points.every((p) => Math.min(
    Math.abs(p.x - minX), Math.abs(p.x - maxX), Math.abs(p.y - minY), Math.abs(p.y - maxY),
  ) <= tolerance * 0.75);
  const visitsAllCorners = corners.every((corner) => points.some((p) => d(p, corner) <= tolerance * 1.2));
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]; const b = points[(i + 1) % points.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  const areaRatio = Math.abs(twiceArea) / 2 / (w * h);
  return everyNearEdge && visitsAllCorners && areaRatio >= 0.7
    ? { kind: 'rect', x: minX, y: minY, w, h }
    : null;
}

export function recognizeStroke(raw: Pt[], options: { tolMm?: number } = {}): RecognizedStroke | null {
  const points = raw.filter((p, i) => i === 0 || d(p, raw[i - 1]) > 0.001);
  if (points.length < 2) return null;
  const length = strokeLength(points);
  if (length < 1) return null;
  const tol = Math.max(options.tolMm ?? 8, length * 0.015);
  const chord = d(points[0], points[points.length - 1]);
  const closed = chord < Math.max(tol, length * 0.03);

  if (!closed) {
    const maxDeviation = Math.max(...points.map((p) => pointLineDistance(p, points[0], points[points.length - 1])));
    if (maxDeviation < Math.max(options.tolMm ?? 8, length * 0.02)) {
      const [a, b] = axisSnap(points[0], points[points.length - 1]);
      return { kind: 'line', a, b };
    }
  }

  if (closed) {
    const rect = rectFrom(points, tol);
    if (rect) return rect;
    const circle = circleFit(points);
    if (circle.variance < 0.12) return { kind: 'circle', c: circle.c, r: circle.r };
  }

  const simplified = simplifyStroke(points, tol);
  if (closed && d(simplified[0], simplified[simplified.length - 1]) > 0.001) simplified.push(simplified[0]);
  return { kind: 'polyline', points: simplified, closed };
}
