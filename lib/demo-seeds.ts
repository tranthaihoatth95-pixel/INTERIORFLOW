// Demo seeds — các flow demo "THỰC TẾ" cho InteriorFlow (one-click cho empty state).
//
// Mỗi demo là 1 module trong lib/demos/* dạng { meta, build }. build() dựng sẵn
// node + edge + params, NƯỚNG output thật từ /public/demo cho node AI, và niêm
// inputHash (sealHashes) để "Chạy flow" bỏ qua re-exec — không gọi provider (đang
// chờ balance). 4 chặng: Concept · Sketch→Ảnh · Clay→Ảnh 4K · Present (slide khách).

import { useFlowStore } from '@/lib/store';
import { conceptDemo } from '@/lib/demos/concept';
import { sketchDemo } from '@/lib/demos/sketch';
import { clayDemo } from '@/lib/demos/clay';
import { presentDemo } from '@/lib/demos/present';
import type { DemoModule, DemoSeedMeta } from '@/lib/demos/_shared';

export type { DemoSeedMeta } from '@/lib/demos/_shared';

// Thứ tự hiển thị trên launcher = thứ tự chặng trong pipeline.
const MODULES: DemoModule[] = [conceptDemo, sketchDemo, clayDemo, presentDemo];

/** Meta cho các nút launcher (id · glyph · label · desc). */
export const DEMO_SEEDS: DemoSeedMeta[] = MODULES.map((m) => m.meta);

const BUILDERS: Record<string, DemoModule['build']> = Object.fromEntries(
  MODULES.map((m) => [m.meta.id, m.build]),
);

/** Dựng graph của demo (đã niêm hash) rồi áp vào canvas — snapshot để undo được. */
export function applyDemoSeed(id: string): void {
  const build = BUILDERS[id];
  if (!build) return;
  const { nodes, edges } = build();
  const store = useFlowStore.getState();
  store.snapshot();
  useFlowStore.setState({ nodes, edges });
}
