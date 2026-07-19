'use client';

/**
 * components/ui/AdaptiveContrast.tsx — mặt React của `lib/adaptive-contrast.ts`.
 *
 * `useAdaptiveContrast()` — đo nền MỘT LẦN mỗi khi src ảnh ĐỔI (không phải mỗi frame),
 * trả về ContrastPlan. Chưa đo xong / đo không được → trả plan CSS thuần ngay lập tức,
 * nên chữ không bao giờ có "khoảnh khắc không đọc được".
 *
 * `<AdaptiveScrim>` — lớp sương mềm đặt SAU chữ (absolute, pointer-events none).
 * `adaptiveTextStyle()` — style chữ (màu + text-shadow) theo plan.
 *
 * Dùng ở 4 chỗ chữ/logo đè ảnh: màn login · thẻ dự án Gallery · chữ Present đè ảnh ·
 * nhãn A/B trên thumbnail Render.
 */

import { useEffect, useState } from 'react';
import {
  compositeOver,
  planFallback,
  planFromReading,
  readImageRegion,
  type ContrastPlan,
  type ContrastTone,
  type PlanOptions,
  type SampleRegion,
} from '@/lib/adaptive-contrast';

export interface UseAdaptiveContrastArgs extends PlanOptions {
  /** Ảnh nền đang hiện. `null`/rỗng → dùng luôn plan dự phòng. */
  src: string | null | undefined;
  /** Vùng ảnh ngay dưới chữ (tỉ lệ 0..1). */
  region: SampleRegion;
  /** Tone dùng khi chưa đo xong / đo không được. Mặc định 'light' (chữ kem). */
  fallbackTone?: ContrastTone;
  /** Tắt hẳn việc đo (vd nền là gradient phẳng, không phải ảnh). */
  enabled?: boolean;
  /**
   * Lớp phủ CỐ ĐỊNH nơi gọi đã đắp sẵn lên ảnh (vd PhotoScrim ở login) — gộp vào số đo
   * để tone quyết định theo cái MẮT THẤY, không theo ảnh gốc. Xem `compositeOver`.
   */
  overlay?: { luminance: number; alpha: number };
}

export function useAdaptiveContrast({
  src,
  region,
  fallbackTone = 'light',
  enabled = true,
  overlay,
  ...opts
}: UseAdaptiveContrastArgs): ContrastPlan {
  const [plan, setPlan] = useState<ContrastPlan>(() => planFallback(fallbackTone, opts));

  const regionKey = `${region.x},${region.y},${region.w},${region.h}`;
  const optsKey = `${opts.shape ?? ''}|${opts.baseAlpha ?? ''}|${opts.threshold ?? ''}`;
  const overlayKey = overlay ? `${overlay.luminance},${overlay.alpha}` : '';

  useEffect(() => {
    if (!enabled || !src) {
      setPlan(planFallback(fallbackTone, opts));
      return;
    }
    let cancelled = false;
    // giữ NGUYÊN plan cũ trong lúc đo ảnh mới — không nháy màu giữa 2 lần crossfade
    void readImageRegion(src, region).then((raw) => {
      if (cancelled) return;
      if (!raw) {
        setPlan(planFallback(fallbackTone, opts));
        return;
      }
      const reading = overlay ? compositeOver(raw, overlay.luminance, overlay.alpha) : raw;
      setPlan(planFromReading(reading, opts));
    });
    return () => {
      cancelled = true;
    };
    // đo lại CHỈ khi ảnh/vùng/tuỳ chọn đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, regionKey, optsKey, overlayKey, fallbackTone, enabled]);

  return plan;
}

/** Style chữ theo plan — trải vào `style` của phần tử chứa chữ. */
export function adaptiveTextStyle(plan: ContrastPlan, muted = false): React.CSSProperties {
  return {
    color: muted ? plan.colorMuted : plan.color,
    textShadow: plan.textShadow,
  };
}

/**
 * Lớp sương mềm sau chữ. Đặt trong một phần tử `position: relative`, chữ nằm SAU nó
 * trong DOM (hoặc có z-index cao hơn). Không có scrim → render null.
 */
export function AdaptiveScrim({
  plan,
  className,
  style,
}: {
  plan: ContrastPlan;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!plan.scrim) return null;
  return (
    <span
      aria-hidden
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        background: plan.scrim,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
