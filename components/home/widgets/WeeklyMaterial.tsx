'use client';

/**
 * components/home/widgets/WeeklyMaterial.tsx — [marker: DongStudio v3] Ô H "Vật liệu của tuần"
 * (phiếu docs/phieu-giao/home-bento-v3.md ④.2, widget sáng tạo #3) — CHỌN TẤT ĐỊNH theo số tuần
 * (`lib/home/weekly-picks.ts` `pickWeeklyItem`, KHÔNG random), từ kho `/api/library`
 * (`usage:'material'`, chỉ ĐỌC — đúng ②.6). Kho trống → tự ẩn.
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` mạch #2 — Hoà pin
 * bảng "material spheres" 2 lần) — PHẢI là QUẢ CẦU render thật, KHÔNG swatch vuông phẳng. Tái
 * dùng NGUYÊN VẸN engine đã có (`components/three/MaterialSphere.tsx` +
 * `components/three/material-preview.ts`, cùng cỗ máy `components/library/ItemThumb.tsx` bậc
 * (a) đang dùng cho kệ Thư viện — "một cỗ máy nhiều mặt tiền", CLAUDE.md) — KHÔNG viết render
 * riêng. `LibraryAsset` không có PBR thật + chỉ có `category`/`tags` chuỗi tự do nên loại vật
 * liệu (wood/stone/…) đoán qua `guessMaterialKind` (thuần, có test) — cùng tinh thần "suy đoán +
 * gắn cờ ước tính" của STATUS.md, không bịa PBR không có.
 */

import MaterialSphere from '@/components/three/MaterialSphere';
import { sceneForKind } from '@/components/three/material-preview';
import { tintFor } from '@/lib/library/thumb-kinds';
import { guessMaterialKind } from '@/lib/home/weekly-picks';
import { useT } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import WidgetCard from './WidgetCard';

export interface WeeklyMaterialItem {
  id: string;
  name: string;
  category: string;
  tags: string;
}

export default function WeeklyMaterial({ item, index }: { item: WeeklyMaterialItem | null; index?: string }) {
  const tr = useT();
  const router = useRouter();
  if (!item) return null;

  const kind = guessMaterialKind(item.category, item.tags);
  const [colorA, colorB] = tintFor(kind);
  const scene = sceneForKind(kind);

  return (
    <WidgetCard dense index={index} title={tr('Vật liệu của tuần', "This week's material")}>
      <button
        type="button"
        onClick={() => router.push('/library')}
        className="flex w-full items-center gap-3 rounded-[var(--r-2)] p-1 text-left transition-colors hover:bg-[var(--hover)]"
      >
        <MaterialSphere
          spec={{ id: item.id, colorA, colorB, kind, scene }}
          fallback={`linear-gradient(135deg, ${colorA}, ${colorB})`}
          backdrop="#4a4a4a"
          size={56}
          resolution={0.25}
          fit="contain"
          className="shrink-0 rounded-full"
          style={{ width: 44, height: 44 }}
          title={item.name}
        />
        <div className="min-w-0">
          <div className="truncate text-[length:var(--fs-sm)] font-medium text-[var(--t1)]">{item.name}</div>
          <div className="truncate font-mono text-[length:var(--fs-2xs)] tracking-[.01em] text-[var(--t4)]">
            {item.category || tr('vật liệu', 'material')}
          </div>
        </div>
      </button>
    </WidgetCard>
  );
}
