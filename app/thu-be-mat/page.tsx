'use client';

/**
 * app/thu-be-mat/page.tsx — MẪU SỐNG của lớp bề mặt nổi (nội bộ, không nằm trong điều hướng).
 *
 * Vì sao là ROUTE THẬT chứ không phải mock HTML: mock chép giá trị token, mẫu sống thì DÙNG
 * CHÍNH nguyên thể — kính lệch một nhịp là thấy ngay ở đây, không phải chờ tới lúc nó lệch
 * trong màn thật. Và bốn nền dưới đây đúng bốn nền bề mặt nổi sẽ trôi lên trong app
 * (ambient Home · lưới 2D · viewport 3D · trang Trình chiếu) ⇒ đo tương phản tại chỗ,
 * không phải suy từ một nền trung bình tưởng tượng.
 */

import { useRef, useState } from 'react';
import BeMatNoi from '@/components/ui/BeMatNoi';
import HienDan from '@/components/ui/HienDan';
import MucNenDan from '@/components/ui/MucNenDan';
import type { TrangThaiMuc } from '@/lib/ui/hien-dan';

type Nen = 'ambient' | 'luoi2d' | 'viewport3d' | 'trinhchieu';

const NEN: Record<Nen, { ten: string; style: React.CSSProperties }> = {
  ambient: {
    ten: 'Nền ambient (Home)',
    style: {
      background:
        'radial-gradient(120% 90% at 18% 8%, rgba(124,58,237,.34), transparent 58%), radial-gradient(90% 70% at 85% 92%, rgba(32,128,137,.28), transparent 60%), var(--bg)',
    },
  },
  luoi2d: {
    ten: 'Lưới 2D',
    style: {
      backgroundColor: 'var(--bg)',
      backgroundImage:
        'linear-gradient(var(--vien-mo) 1px, transparent 1px), linear-gradient(90deg, var(--vien-mo) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
  },
  viewport3d: {
    ten: 'Viewport 3D',
    style: {
      background: 'linear-gradient(180deg, #9fb3c8 0%, #d9d2c6 52%, #7d7468 100%)',
    },
  },
  trinhchieu: {
    ten: 'Trang Trình chiếu',
    style: { background: '#ffffff' },
  },
};

export default function ThuBeMatPage() {
  const [nen, setNen] = useState<Nen>('ambient');
  const [mo, setMo] = useState<'vien' | 'bang' | 'bangSau' | null>(null);
  const [chay, setChay] = useState(false);
  const [buoc, setBuoc] = useState(1);

  const nutVien = useRef<HTMLButtonElement>(null);
  const nutBang = useRef<HTMLButtonElement>(null);
  const nutSau = useRef<HTMLButtonElement>(null);

  const nacHien = mo ?? 'vien';

  const trangThai = (i: number): TrangThaiMuc =>
    i < buoc ? 'daXong' : i === buoc ? 'dangLam' : 'dangToi';

  return (
    <main style={{ minHeight: '100vh', padding: 24, ...NEN[nen].style }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>
        Bề mặt nổi — mẫu sống
      </h1>
      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 16 }}>
        Kính · mọc từ nguồn · hiện dần · nén dần. Đổi nền để soi tương phản chữ trên cả bốn nền thật.
      </p>

      {/* Đổi nền */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(Object.keys(NEN) as Nen[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setNen(k)}
            aria-pressed={nen === k}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 'var(--r-full)',
              border: `1px solid ${nen === k ? 'var(--t2)' : 'var(--vien-mo)'}`,
              background: nen === k ? 'var(--card)' : 'transparent',
              color: 'var(--t1)',
              fontWeight: nen === k ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {NEN[k].ten}
          </button>
        ))}
      </div>

      {/* Ba nguồn — mỗi nút mở một nấc, bề mặt nở ra TỪ CHÍNH nút đó */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button
          ref={nutVien}
          type="button"
          className="kinh-noi kinh-noi--mong kinh-noi--bam-duoc"
          onClick={() => setMo(mo === 'vien' ? null : 'vien')}
          style={{ padding: '8px 14px', borderRadius: 'var(--r-2)', fontSize: 13, cursor: 'pointer' }}
        >
          Viên ngữ cảnh
        </button>
        <button
          ref={nutBang}
          type="button"
          className="kinh-noi kinh-noi--bam-duoc"
          onClick={() => setMo(mo === 'bang' ? null : 'bang')}
          style={{ padding: '8px 14px', borderRadius: 'var(--r-2)', fontSize: 13, cursor: 'pointer' }}
        >
          Bảng năng lực
        </button>
        <button
          ref={nutSau}
          type="button"
          className={`kinh-noi kinh-noi--dac kinh-noi--bam-duoc ${chay ? 'kinh-noi--dang-chay' : ''}`}
          onClick={() => setMo(mo === 'bangSau' ? null : 'bangSau')}
          style={{ padding: '8px 14px', borderRadius: 'var(--r-2)', fontSize: 13, cursor: 'pointer' }}
        >
          Cổng Spec (bảng sâu)
        </button>
        <button
          type="button"
          onClick={() => setChay((c) => !c)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--r-2)',
            fontSize: 13,
            border: '1px solid var(--vien-mo)',
            background: 'transparent',
            color: 'var(--t2)',
            cursor: 'pointer',
          }}
        >
          {chay ? 'Dừng' : 'Giả lập đang chạy'}
        </button>
      </div>

      {/* Ba tầng ánh sáng đứng cạnh nhau — CỬA NGHIỆM THU: nhìn phát phải phân biệt được */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
          Ba tầng ánh sáng — phải phân biệt được ngay
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { lop: 'kinh-noi', ten: '① Chất liệu', y: 'luôn có · mép bắt sáng · tĩnh' },
            { lop: 'kinh-noi kinh-noi--bam-duoc', ten: '② Khả năng', y: 'trỏ vào · viền sáng ĐỨNG YÊN' },
            { lop: 'kinh-noi kinh-noi--dang-chay', ten: '③ Trạng thái', y: 'đang chạy · viền sáng CHẠY' },
          ].map((t) => (
            <div
              key={t.ten}
              className={t.lop}
              style={{ padding: 14, borderRadius: 'var(--r-3)', width: 210 }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{t.ten}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>{t.y}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Nén dần — chuỗi cổng, đã duyệt thì co về một dòng */}
      <section style={{ maxWidth: 560 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
          Nén dần khi đã xong
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 260 }}>
          {['Đọc khung hình học', 'Định danh mảng', 'Phiếu 4 cấp', 'Bảng ánh xạ'].map((ten, i) => (
            <MucNenDan
              key={ten}
              ten={ten}
              trangThai={trangThai(i)}
              tomTat={`Đã duyệt · ${3 + i} mảng · nguồn: ảnh gốc`}
              onMoLai={i === 0 ? () => setBuoc(0) : undefined}
              lyDoKhoa="Cổng sau đã dùng kết quả cổng này — mở lại phải quay về từ bước đầu."
            >
              <p style={{ fontSize: 12, color: 'var(--t2)' }}>
                Nội dung đầy đủ của cổng đang làm. Cổng đã duyệt bên trên co về một dòng, nhường chỗ
                cho cổng này.
              </p>
              <button
                type="button"
                onClick={() => setBuoc((b) => Math.min(4, b + 1))}
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 'var(--r-2)',
                  border: '1px solid var(--vien-mo)',
                  background: 'var(--panel)',
                  color: 'var(--t1)',
                  cursor: 'pointer',
                }}
              >
                Duyệt cổng này
              </button>
            </MucNenDan>
          ))}
        </div>
      </section>

      {/* ---- Bề mặt nổi, mọc ra từ đúng nút đã gọi ---- */}
      <BeMatNoi
        mo={mo === 'vien'}
        nguonRef={nutVien}
        bac="vien"
        rong={280}
        nhan="Viên ngữ cảnh"
      >
        <NoiDung nac="vien" mo={mo === 'vien'} />
      </BeMatNoi>

      <BeMatNoi mo={mo === 'bang'} nguonRef={nutBang} bac="bang" rong={360} nhan="Bảng năng lực">
        <NoiDung nac="bang" mo={mo === 'bang'} />
      </BeMatNoi>

      <BeMatNoi
        mo={mo === 'bangSau'}
        nguonRef={nutSau}
        bac="bangSau"
        rong={440}
        dangChay={chay}
        nhan="Cổng Spec"
      >
        <NoiDung nac="bangSau" mo={mo === 'bangSau'} />
      </BeMatNoi>

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--t3)' }}>
        Nấc đang mở: {mo ? nacHien : '—'}
      </p>
    </main>
  );
}

/** Cùng một nội dung, ba nấc — bậc nào hiện ở nấc nào do `lib/ui/hien-dan.ts` quyết. */
function NoiDung({ nac, mo }: { nac: 'vien' | 'bang' | 'bangSau'; mo: boolean }) {
  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <HienDan bac="danhTinh" nac={nac} mo={mo}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>① Từ: ảnh phối cảnh · phòng khách</div>
      </HienDan>
      <HienDan bac="ketQua" nac={nac} mo={mo}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
          ② Gỗ sồi trắng — MAT-0412
        </div>
      </HienDan>
      <HienDan bac="doChac" nac={nac} mo={mo}>
        <div style={{ fontSize: 11, color: 'var(--t2)' }}>③ đo được · nguồn: khối 3D</div>
      </HienDan>
      <HienDan bac="quyetDinh" nac={nac} mo={mo}>
        <button
          type="button"
          style={{
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 'var(--r-2)',
            border: '1px solid var(--vien-mo)',
            background: 'var(--panel)',
            color: 'var(--t1)',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          ④ Áp vào mảng đang chọn
        </button>
      </HienDan>
      <HienDan bac="chiTiet" nac={nac} mo={mo}>
        <div style={{ fontSize: 11, color: 'var(--t2)' }}>⑤ 12,4 m² · hao hụt 8% · NCC: —</div>
      </HienDan>
      <HienDan bac="thongTinSau" nac={nac} mo={mo}>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>
          ⑥ Nhám 0,42 · kim loại 0 · lát 600×600 · hatch: gỗ dọc
        </div>
      </HienDan>
    </div>
  );
}
