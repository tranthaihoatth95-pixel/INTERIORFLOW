import type { Box, Sheet, Viewport2D } from './model';

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
