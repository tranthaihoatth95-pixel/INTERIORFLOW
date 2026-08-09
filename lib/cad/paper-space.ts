import type { Box, Doc, Sheet, Viewport2D } from './model';

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

/** Trạng thái lớp hiệu lực trong riêng một ô nhìn; thiếu override thì theo Doc chung. */
export function viewportLayerVisible(viewport: Viewport2D, layerId: string, defaultVisible: boolean): boolean {
  const override = viewport.layerOverrides?.[layerId];
  return typeof override === 'boolean' ? override : defaultVisible;
}

/** Đổi hiển thị lớp cho một ô nhìn mà không mutate viewport/Doc nguồn. */
export function setViewportLayerVisibility(viewport: Viewport2D, layerId: string, visible: boolean): Viewport2D {
  return {
    ...viewport,
    layerOverrides: { ...viewport.layerOverrides, [layerId]: visible },
  };
}

/** View nhẹ chỉ dành cho render Paper; hình học vẫn là đúng một Doc nguồn sự thật. */
export function docForViewport(doc: Doc, viewport: Viewport2D): Doc {
  if (!viewport.layerOverrides || Object.keys(viewport.layerOverrides).length === 0) return doc;
  return {
    ...doc,
    layers: doc.layers.map((layer) => ({
      ...layer,
      visible: viewportLayerVisible(viewport, layer.id, layer.visible),
    })),
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
