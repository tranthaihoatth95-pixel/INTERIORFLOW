import type { Box, Sheet, Viewport2D } from './model';

const MIN_VIEWPORT_MM = 35;

/** Vùng model mà một viewport trên giấy nhìn thấy, theo đúng tỉ lệ 1:N. */
export function viewportWorldBox(viewport: Viewport2D): Box {
  const halfW = (viewport.rectOnPaper.w * viewport.scale) / 2;
  const halfH = (viewport.rectOnPaper.h * viewport.scale) / 2;
  return {
    minX: viewport.centerMm.x - halfW,
    minY: viewport.centerMm.y - halfH,
    maxX: viewport.centerMm.x + halfW,
    maxY: viewport.centerMm.y + halfH,
  };
}

export function patchSheetViewport(sheet: Sheet, viewportId: string, patch: Partial<Viewport2D>): Sheet {
  return {
    ...sheet,
    viewports: sheet.viewports.map((viewport) => viewport.id === viewportId ? { ...viewport, ...patch } : viewport),
  };
}

export function clampViewportRect(rect: Viewport2D['rectOnPaper'], paperW: number, paperH: number, margin = 8): Viewport2D['rectOnPaper'] {
  const x = Math.max(margin, Math.min(rect.x, paperW - margin - MIN_VIEWPORT_MM));
  const y = Math.max(margin, Math.min(rect.y, paperH - margin - MIN_VIEWPORT_MM));
  const w = Math.max(MIN_VIEWPORT_MM, Math.min(rect.w, paperW - margin - x));
  const h = Math.max(MIN_VIEWPORT_MM, Math.min(rect.h, paperH - margin - y));
  return {
    x, y,
    w, h,
  };
}

export function moveViewportRect(rect: Viewport2D['rectOnPaper'], dx: number, dy: number, paperW: number, paperH: number) {
  const safe = clampViewportRect(rect, paperW, paperH);
  return {
    ...safe,
    x: Math.max(8, Math.min(rect.x + dx, paperW - 8 - safe.w)),
    y: Math.max(8, Math.min(rect.y + dy, paperH - 8 - safe.h)),
  };
}

export function resizeViewportRect(rect: Viewport2D['rectOnPaper'], dw: number, dh: number, paperW: number, paperH: number) {
  return clampViewportRect({ ...rect, w: rect.w + dw, h: rect.h + dh }, paperW, paperH);
}

export function removeSheetViewport(sheet: Sheet, viewportId: string): Sheet {
  if (sheet.viewports.length <= 1) return sheet;
  return { ...sheet, viewports: sheet.viewports.filter((viewport) => viewport.id !== viewportId) };
}
