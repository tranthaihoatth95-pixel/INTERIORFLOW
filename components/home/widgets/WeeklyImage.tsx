'use client';

/**
 * components/home/widgets/WeeklyImage.tsx — [marker: DongStudio v3] Ô D "Ảnh đẹp tuần này"
 * (phiếu docs/phieu-giao/home-bento-v3.md ④.2, widget sáng tạo #2) — ảnh `LibraryAsset` gần đây
 * nhất (`usage:'ref-render'`, đọc từ `/api/library` — chỉ ĐỌC, đúng ②.6). Crossfade khi có ≥2
 * ảnh (đổi theo `eightSecTick` — MỘT interval toàn trang do DongStudioHome cấp, xem đó). Trống
 * → tự ẩn (DongStudioHome giãn ô A chiếm chỗ, xem comment ở đó).
 *
 * ⚠️ `/api/library` KHÔNG trả `createdAt` (route ngoài vùng file được sửa của phiếu này) — mảng
 * `images` truyền vào ĐÃ được lọc/giữ thứ tự "mới nhất trước" từ server (`lib/home/weekly-picks.ts`
 * `pickWeeklyImages`, xem ghi chú ở đó) — KHÔNG có mốc lịch 7-ngày cứng, ghi rõ ở đây để không ai
 * tưởng nhầm là lọc theo ngày thật.
 */

import { useMemo, useState } from 'react';
import { useT } from '@/lib/i18n';
import WidgetCard from './WidgetCard';

export interface WeeklyImageItem {
  id: string;
  url: string;
  name: string;
}

export default function WeeklyImage({
  images,
  eightSecTick,
  index,
}: {
  images: WeeklyImageItem[];
  eightSecTick: number;
  index?: string;
}) {
  const tr = useT();
  // Ảnh hỏng (URL trả 404/410 — asset đã bị dọn khỏi kho) thì LOẠI khỏi vòng xoay thay vì
  // hiện khung vỡ: <img> không onError là ô này đứng hình vỡ + lỗi console lặp mỗi lần Home
  // mount lại. Hết ảnh sống thì widget tự ẩn (đúng luật 13/08: thiếu dữ liệu thì ẩn).
  const [hong, setHong] = useState<ReadonlySet<string>>(() => new Set());
  const song = useMemo(() => images.filter((img) => !hong.has(img.id)), [images, hong]);
  const current = useMemo(() => (song.length ? song[eightSecTick % song.length] : null), [song, eightSecTick]);
  if (!current) return null;

  return (
    <WidgetCard noPad>
      <div className="absolute left-2.5 top-2.5 z-10 rounded-[4px] px-1.5 py-0.5 font-mono text-[length:var(--fs-2xs)] uppercase tracking-wide text-white/85" style={{ background: 'rgba(10,9,8,0.55)' }}>
        {index && <span className="mr-1 opacity-70">{index}</span>}
        {tr('Ảnh đẹp tuần này', "This week's frame")}
      </div>
      {song.map((img) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.url}
          alt={img.name}
          draggable={false}
          onError={() => setHong((prev) => new Set(prev).add(img.id))}
          className="weekly-image-frame absolute inset-0 h-full w-full object-cover"
          style={{ opacity: img.id === current.id ? 1 : 0 }}
          aria-hidden={img.id !== current.id}
        />
      ))}
      <style jsx>{`
        .weekly-image-frame {
          transition: opacity 700ms ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .weekly-image-frame {
            transition: none !important;
          }
        }
      `}</style>
    </WidgetCard>
  );
}
