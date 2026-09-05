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

import { useEffect, useRef, useState } from 'react';
import { renderMaterialPreviewAsync, type PreviewSpec } from './material-preview';
import { xepLuotXemTruoc } from '@/lib/materials/hang-doi-xem-truoc';

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
  /**
   * 05/09 — CHỈ RENDER KHI Ô LỌT VÀO MẮT, và render qua VAN CHI PHÍ (≤4 lượt đồng thời, chạy
   * lúc trình duyệt rảnh). Dành cho danh sách DÀI (kho vật liệu 200 món).
   *
   * ⛔ MẶC ĐỊNH `false` — CỐ Ý. Bảy nơi đang dùng component này (kệ Thư viện · widget Home ·
   * panel 3D · ô chỉnh PBR…) đều bày ÍT ô và bày ngay trong tầm mắt; đổi hành vi của chúng
   * trong cùng một lượt là sửa bốn màn không ai yêu cầu, và nhánh `henLucRanh` có trần 1500 ms
   * nên trên tab bận chúng sẽ giữ nền chờ lâu hơn hôm nay — một thay đổi NHÌN THẤY ĐƯỢC ở nơi
   * chưa ai duyệt. Ai cần thì bật, không ép cả nhà.
   */
  hoanLaiToiKhiThay?: boolean;
}

export default function MaterialSphere({ spec, fallback, size = 96, resolution = 0.25, className, style, title, fit = 'cover', backdrop, children, hoanLaiToiKhiThay = false }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [dangThay, setDangThay] = useState(!hoanLaiToiKhiThay);
  const oRef = useRef<HTMLSpanElement | null>(null);

  /* CỬA SỔ HIỂN THỊ (P1) — chỉ bật khi nơi gọi xin. Danh sách 200 món mà render tất là dựng lại
     đúng `AdPreviewGenerator` của Revit (30 giây, 100% CPU). `rootMargin` 200px = phần ĐỆM: ô
     ngay ngoài mép được dựng trước nên cuộn tới là đã có ảnh, không thấy nó "mọc ra". */
  useEffect(() => {
    if (!hoanLaiToiKhiThay) return;
    const el = oRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setDangThay(true); return; }
    const io = new IntersectionObserver((es) => {
      /* Một chiều: thấy rồi thì THÔI theo dõi. Bật/tắt theo mỗi lần cuộn qua lại sẽ vứt ảnh đã
         có rồi dựng lại — tốn hơn hẳn việc giữ một dataURL đã nằm trong cache. */
      if (es.some((e) => e.isIntersecting)) { setDangThay(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hoanLaiToiKhiThay]);

  useEffect(() => {
    if (!dangThay) return;
    let alive = true;
    // đẩy ra sau frame hiện tại — mở panel có N ô không khựng vì render đồng loạt.
    // VIỆC 3 M-VAT-LIEU-2: có `spec.pbr` (map là ảnh, phải chờ decode) đi đường async; không có
    // thì async đó tương đương bản sync — một nhánh gọi cho cả hai, fallback giữ nguyên lúc chờ.
    // 05/09: nhánh hoãn-lại đi qua VAN CHI PHÍ (≤4 lượt đồng thời, chạy lúc rảnh, huỷ được);
    // nhánh mặc định giữ nguyên rAF như trước, không đổi một li cho bảy nơi gọi cũ.
    const ve = () => renderMaterialPreviewAsync(spec, size, resolution).then((u) => {
      if (alive) setUrl(u);
    });
    const huy = hoanLaiToiKhiThay
      ? xepLuotXemTruoc(ve)
      : (() => { const t = requestAnimationFrame(() => { void ve(); }); return () => cancelAnimationFrame(t); })();
    return () => {
      alive = false;
      huy();
    };
    // spec là object literal mỗi render — key theo các trường thật để không render lại vô ích;
    // pbr đổi được nhận qua spec.id (caller phải trộn pbrCacheKey/phiên bản vào id — editor làm vậy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dangThay, hoanLaiToiKhiThay, spec.id, spec.kind, spec.scene, spec.colorA, spec.colorB, size, resolution]);

  return (
    <span
      aria-hidden
      ref={oRef}
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
