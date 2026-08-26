'use client';

/**
 * app/thu-trang-thai/page.tsx — MẪU SỐNG của ma trận trạng thái tương tác (nội bộ, không nằm
 * trong điều hướng). Cùng khuôn với `app/thu-be-mat/page.tsx`.
 *
 * Vì sao là ROUTE THẬT chứ không phải mock HTML: mock CHÉP giá trị token, mẫu sống thì DÙNG
 * CHÍNH nguyên thể. Loại lỗi đợt này phải bắt — "trỏ vào" và "đang chạy" đọc ra giống nhau —
 * chỉ lộ khi mười trạng thái đứng CẠNH NHAU và tay thật rê qua. Chụp ảnh một trạng thái rồi
 * suy ra chín trạng thái kia là đúng cách bỏ sót nó lần nữa.
 *
 * Cửa nghiệm thu của trang này: nhìn một phát phải tách được `troVao` (vành đứng yên) với
 * `dangChay` (vành chạy vòng) với `canChuY` (mép phồng, hổ phách) với `hong` (đứng yên hẳn).
 */

import { useState } from 'react';
import VanhTrangThai from '@/components/ui/VanhTrangThai';
import SoCucBo from '@/components/ui/SoCucBo';
import { TRANG_THAI, MA_TRAN, mauTrangThai, type TrangThai } from '@/lib/ui/trang-thai-tuong-tac';
import { hutNamCham, type Chieu } from '@/lib/ui/so-cuc-bo';

const MOC_BAT = [0, 300, 600, 900, 1200];

export default function ThuTrangThai() {
  const [giaTri, setGiaTri] = useState(590);
  const [chieu, setChieu] = useState<Chieu | null>('rong');
  const hut = hutNamCham(giaTri, MOC_BAT, 40);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--t1)', padding: 32 }}>
      <h1 style={{ fontSize: 'var(--fs-xl)', marginBottom: 4 }}>Thử ma trận trạng thái</h1>
      <p style={{ color: 'var(--t3)', fontSize: 'var(--fs-ui)', marginBottom: 28 }}>
        Mười trạng thái đứng cạnh nhau. Rê chuột qua từng ô để thấy vành đứng yên của “trỏ vào”
        không lẫn với vành chạy của “đang chạy”.
      </p>

      {/* ── Mười trạng thái ─────────────────────────────────────────────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 40,
        }}
      >
        {TRANG_THAI.map((tt) => (
          <O key={tt} trangThai={tt} />
        ))}
      </section>

      {/* ── Con số cục bộ: mặt thước (2D) ───────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>Con số cục bộ · mặt thước (2D)</h2>
      <p style={{ color: 'var(--t3)', fontSize: 'var(--fs-ui)', marginBottom: 12 }}>
        Kéo thanh dưới đây tới gần {MOC_BAT.join(' · ')} để thấy lực hít đậm dần — liên tục, không
        bật-tắt phựt.
      </p>
      <input
        type="range"
        min={0}
        max={1200}
        value={giaTri}
        onChange={(e) => setGiaTri(Number(e.target.value))}
        style={{ width: 420, display: 'block', marginBottom: 14 }}
        aria-label="Giá trị thử cho thước"
      />
      <div style={{ marginBottom: 40 }}>
        <SoCucBo mat="thuoc" pha="dangSua" donVi="mm" giaTri={giaTri} min={0} max={1200} buoc={100} hut={hut} />
      </div>

      {/* ── Con số cục bộ: mặt ba chiều (3D) ────────────────────────────────────────────── */}
      <h2 style={{ fontSize: 'var(--fs-lg)', marginBottom: 12 }}>Con số cục bộ · mặt ba chiều (3D)</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {(['rong', 'sau', 'cao', null] as const).map((c) => (
          <button
            key={String(c)}
            onClick={() => setChieu(c)}
            style={{
              padding: 'var(--pad-card)',
              borderRadius: 'var(--r-2)',
              border: `1px solid ${chieu === c ? 'var(--accent-ring)' : 'var(--border)'}`,
              background: chieu === c ? 'var(--accent-soft)' : 'transparent',
              color: chieu === c ? 'var(--accent)' : 'var(--t2)',
              fontSize: 'var(--fs-ui)',
              cursor: 'pointer',
            }}
          >
            {c ?? 'không kéo chiều nào'}
          </button>
        ))}
      </div>
      <SoCucBo
        mat="baChieu"
        pha="dangSua"
        donVi="mm"
        soDo={{ rong: 1200, sau: 600, cao: 750 }}
        dangSua={chieu}
      />
      <p style={{ color: 'var(--t3)', fontSize: 'var(--fs-ui)', marginTop: 12 }}>
        Hai chiều còn lại LÙI chứ không ẩn — người dựng vẫn phải thấy tỉ lệ giữa ba chiều lúc kéo.
      </p>
    </main>
  );
}

function O({ trangThai }: { trangThai: TrangThai }) {
  const h = MA_TRAN[trangThai];
  return (
    <div>
      <VanhTrangThai trangThai={trangThai} tenVat="Dựng ảnh phòng khách" banKinh="var(--r-3)">
        <div
          style={{
            width: 200,
            height: 96,
            borderRadius: 'var(--r-3)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'var(--pad-card)',
            boxSizing: 'border-box',
            opacity: trangThai === 'voHieu' ? 'var(--mo-vo-hieu)' : 1,
          }}
        >
          <strong style={{ fontSize: 'var(--fs-ui)' }}>{trangThai}</strong>
          {/* Kênh chữ MANG LUÔN MÀU trạng thái. Không tô thì `xong` trông y hệt `nghi` (cả hai
              đều không vẽ vành) — lướt mắt qua không tách được "hết việc" với "chưa có việc".
              Bảng đã khai `xong.mau = --success`; đây là chỗ màu đó thật sự tới được mắt. */}
          {h.nhan && (
            <span
              style={{
                fontSize: 'var(--fs-2xs)',
                color: mauTrangThai(trangThai) ?? 'var(--t3)',
                marginTop: 4,
              }}
            >
              {h.nhan}
            </span>
          )}
        </div>
      </VanhTrangThai>
      <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--t4)', marginTop: 6 }}>
        kênh động: {h.kenhDong ?? '— (đứng yên)'}
      </div>
    </div>
  );
}
