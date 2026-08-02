'use client';

/**
 * components/three/MaterialSphere.tsx — ảnh QUẢ CẦU xem trước vật liệu (G4,
 * `docs/SPEC-VAT-LIEU-PBR-IF.md` §2). Lõi render + cache ở `material-preview.ts`
 * (một renderer/PMREM dùng chung — đây chỉ là <img> nhận dataURL).
 *
 * Fallback = gradient swatch phẳng sẵn có: hiện trong lúc chờ render (1 frame) và khi WebGL
 * không có (SSR/máy tắt WebGL) — không bao giờ trống trắng. Chặng Vẽ 2D vẫn dùng swatch phẳng
 * theo spec (đúng ngữ cảnh bản vẽ), component này chỉ gắn ở mode Vẽ 3D + kệ vật liệu sheet.
 */

import { useEffect, useState } from 'react';
import { renderMaterialPreview, type PreviewSpec } from './material-preview';

interface Props {
  spec: PreviewSpec;
  /** gradient CSS làm nền chờ/fallback — truyền thẳng swatch sẵn có. */
  fallback: string;
  /** cạnh ô hiển thị (px) — ảnh render vuông cạnh này × resolution. */
  size?: number;
  /** nấc phân giải kiểu V-Ray: lưới cuộn 0.25 · panel chi tiết 1. */
  resolution?: 0.25 | 0.5 | 1;
  className?: string;
  style?: React.CSSProperties;
  /** phần tử đè lên ảnh (vd. badge phạm vi của kệ sheet). */
  children?: React.ReactNode;
}

export default function MaterialSphere({ spec, fallback, size = 96, resolution = 0.25, className, style, children }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // đẩy ra sau frame hiện tại — mở panel có N ô không khựng vì render đồng loạt
    const t = requestAnimationFrame(() => {
      const u = renderMaterialPreview(spec, size, resolution);
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(t);
    };
    // spec là object literal mỗi render — key theo các trường thật để không render lại vô ích
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id, spec.kind, spec.scene, spec.colorA, spec.colorB, size, resolution]);

  return (
    <span
      aria-hidden
      className={className}
      style={{ display: 'block', position: 'relative', background: fallback, overflow: 'hidden', ...style }}
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      )}
      {children}
    </span>
  );
}
