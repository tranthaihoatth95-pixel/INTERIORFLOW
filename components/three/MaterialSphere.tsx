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
import { renderMaterialPreviewAsync, type PreviewSpec } from './material-preview';

interface Props {
  spec: PreviewSpec;
  /** nền chờ/fallback: chuỗi CSS `background`, hoặc cả cụm style vân procedural
   * (`thumbTexture()` của Thư viện — nhiều lớp nên cần backgroundSize/Repeat đi kèm). */
  fallback: string | React.CSSProperties;
  /** tooltip — ô xem trước nên nói được nó đang thể hiện LOẠI gì. */
  title?: string;
  /** 'contain' = thấy TRỌN quả cầu (ô lưới thấp hơn rộng thì 'cover' cắt mất chỏm, còn lại
   * mảng màu vô nghĩa — bắt được khi verify kệ Thư viện 122×76). */
  fit?: 'cover' | 'contain';
  /** Nền phía sau quả cầu KHI đã render xong (V-Ray/D5 để cầu trên nền trung tính, không để
   * trên vân). Lúc chờ/WebGL tắt vẫn là `fallback` để không bao giờ ra ô trơn. */
  backdrop?: string;
  /** cạnh ô hiển thị (px) — ảnh render vuông cạnh này × resolution. */
  size?: number;
  /** nấc phân giải kiểu V-Ray: lưới cuộn 0.25 · panel chi tiết 1. */
  resolution?: 0.25 | 0.5 | 1;
  className?: string;
  style?: React.CSSProperties;
  /** phần tử đè lên ảnh (vd. badge phạm vi của kệ sheet). */
  children?: React.ReactNode;
}

export default function MaterialSphere({ spec, fallback, size = 96, resolution = 0.25, className, style, title, fit = 'cover', backdrop, children }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // đẩy ra sau frame hiện tại — mở panel có N ô không khựng vì render đồng loạt.
    // VIỆC 3 M-VAT-LIEU-2: có `spec.pbr` (map là ảnh, phải chờ decode) đi đường async; không có
    // thì async đó tương đương bản sync — một nhánh gọi cho cả hai, fallback giữ nguyên lúc chờ.
    const t = requestAnimationFrame(() => {
      void renderMaterialPreviewAsync(spec, size, resolution).then((u) => {
        if (alive) setUrl(u);
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(t);
    };
    // spec là object literal mỗi render — key theo các trường thật để không render lại vô ích;
    // pbr đổi được nhận qua spec.id (caller phải trộn pbrCacheKey/phiên bản vào id — editor làm vậy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id, spec.kind, spec.scene, spec.colorA, spec.colorB, size, resolution]);

  return (
    <span
      aria-hidden
      className={className}
      title={title}
      style={{
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        ...(typeof fallback === 'string' ? { background: fallback } : fallback),
        ...style,
      }}
    >
      {url && backdrop && <span style={{ position: 'absolute', inset: 0, background: backdrop }} />}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit }}
          draggable={false}
        />
      )}
      {children}
    </span>
  );
}
