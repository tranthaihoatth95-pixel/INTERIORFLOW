'use client';

/**
 * app/demo/ghe-3d/page.tsx — ĐÍCH DEMO TRỰC TIẾP cho luồng Ảnh→3D (ghế Lincoln 327, 21/08).
 *
 * KHÔNG dựng lại gì: tái dùng nguyên `Object3DWindow` (viewer OBJ+MTL chuẩn-nét, camera tự
 * khung vào ghế, OrbitControls xoay/soi sẵn) + đúng model đã verify của LibrarySheet
 * (`OBJECT_3D_MODELS`, /library-assets/lincoln-327). Trang chỉ là VỎ MOUNT: mở cửa sổ NGAY
 * (không bắt duyệt Thư viện, không thêm click chọn), bày ảnh NGUỒN + metadata + cờ SUY RA
 * (INFERRED) cạnh bên. Đóng cửa sổ = quay lại trang trước (đúng nhịp deep-link demo — viên
 * "Quay về Trình bày" lo phần về đúng slide).
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Object3DWindow from '@/components/library/Object3DWindow';
import QuayVeTrinhBay from '@/components/studio/QuayVeTrinhBay';

/** Cùng nguồn với LibrarySheet.OBJECT_3D_MODELS — món Lincoln 327 (proof CW 14/08). */
const MODEL = {
  glbUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.obj',
  mtlUrl: '/library-assets/lincoln-327/lincoln-327-chuannet.mtl',
};
/** LibraryAsset "Ghế bar Lincoln 327 · AI-sinh" — ảnh nguồn thật trong kho. */
const SOURCE_IMAGE = '/api/library/cmsshuywg0001w90hkws755g5/file';

export default function DemoGhe3DPage() {
  const router = useRouter();
  // MỞ SAU MỘT NHỊP mount, không phải `open` cứng từ render đầu: loader của Object3DWindow chạy
  // effect với containerRef — render đầu portal chưa gắn container (gate `mounted` bên trong) nên
  // open=true từ đầu là effect thoát sớm và KHÔNG chạy lại ⇒ kẹt "Đang tải mô hình 3D…" vĩnh viễn
  // (đã thấy thật trên browser 21/08). Mở ở effect = đúng nhịp người bấm nút ở LibrarySheet.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(true), []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--t1)', padding: '28px 32px' }}>
      <p style={{ fontSize: 11, letterSpacing: 2.5, color: 'var(--t3)', textTransform: 'uppercase', margin: 0 }}>
        Demo · Ảnh → 3D
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 18px' }}>Ghế bar Lincoln 327 · AI-sinh</h1>

      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ẢNH NGUỒN — một ảnh chụp duy nhất, đầu vào của toàn chuỗi. */}
        <figure style={{ margin: 0, width: 300 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SOURCE_IMAGE}
            alt="Ảnh nguồn — ghế bar Lincoln 327"
            style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }}
          />
          <figcaption style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 8 }}>
            Ảnh nguồn (1 ảnh) — từ Thư viện, không chụp lại.
          </figcaption>
        </figure>

        {/* METADATA + cờ SUY RA — số đọc từ phiên chuẩn-nét, chờ người xác minh. */}
        <div style={{ width: 280, fontSize: 13, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Hình học chuẩn-nét (.obj + .mtl)</p>
          <p style={{ margin: 0, color: 'var(--t2)' }}>
            Rộng ≈ 1 206 mm
            <br />
            Sâu ≈ 825 mm
            <br />
            Cao ≈ 825 mm
          </p>
          <p
            style={{
              display: 'inline-block',
              marginTop: 12,
              padding: '3px 10px',
              borderRadius: 999,
              border: '1px solid var(--warning)',
              color: 'var(--warning)',
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            SUY RA — chờ người xác minh
          </p>
          <p style={{ marginTop: 12, color: 'var(--t3)', fontSize: 12 }}>
            Máy đọc ảnh, dựng khối và suy kích thước kèm độ tin. Người xác minh rồi mới thành sự thật của dự án.
          </p>
        </div>
      </div>

      {/* Cửa sổ 3D — MỞ NGAY, camera tự khung vào ghế, xoay/soi tức thì. Đóng = quay lại. */}
      <Object3DWindow
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) router.back();
        }}
        glbUrl={MODEL.glbUrl}
        mtlUrl={MODEL.mtlUrl}
        title="Ghế bar Lincoln 327 · AI-sinh"
        subtitle="Chuẩn-nét từ 1 ảnh · SUY RA (inferred) — xoay/soi bằng chuột"
      />

      {/* Trang này nằm NGOÀI AppShell (không có AppChrome) — viên "Quay về Trình bày" phải
          mount tại chỗ để vòng deep-link demo khép được: Present → ghế → về đúng slide. */}
      <QuayVeTrinhBay />
    </div>
  );
}
