'use client';

/**
 * components/library/NhanDienCauKien.tsx — MẶT TIỀN của dây chuyền `lib/idfc-import/`.
 *
 * Trước lượt này bốn module engine (`from-photo` · `chuan-net` · `surface-graph` · `part-lock`,
 * 64 test, proof ghế Lincoln 327 14/08) **không có một nơi gọi nào ngoài test của chính chúng** —
 * `soi:mat-tien` chấm bậc 0/2. Ô này là chỗ người dùng chạm được vào chúng.
 *
 * ── HAI CỬA VÀO, MỘT LÕI ───────────────────────────────────────────────────────────────────────
 *  · **Có tệp khối 3D** — máy đọc tệp, 0 lượt. LUÔN chạy được.
 *  · **Chỉ có ảnh** — máy nhìn ảnh rồi dựng khối, TỐN LƯỢT, cần khoá dịch vụ ngoài.
 * Máy chủ trả trạng thái từng cửa qua `GET /api/idfc-import` ⇒ cửa chưa chạy được thì nút **MỜ
 * KÈM LÝ DO** (`aria-disabled` + `aria-describedby`, token `--mo-vo-hieu`), KHÔNG phải nút bấm
 * vào mới báo lỗi.
 *
 * ── CỜ TIN CẬY LÀ THÔNG TIN NGHỀ, KHÔNG PHẢI TRANG TRÍ ─────────────────────────────────────────
 * Kết quả hiện **từng trường một** kèm nấc của nó: số hãng là *đã xác minh* (có nguồn đối chiếu),
 * hình khối và phân loại là *máy suy*. **Cấm hiện đồng loạt như nhau** — người dùng phải phân biệt
 * được ngay cái nào tra được và cái nào máy đoán. Ba nấc dùng đúng bộ từ vựng đang chạy
 * (`measured | inferred | verified`), phân biệt bằng **chữ + hình dạng**, không chỉ bằng màu.
 *
 * Chữ theo `SPEC-NGON-NGU-CHI-DAN`: hành động trước · ≤12 từ · không để lộ tên nội bộ ra nhãn.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Box, FileUp, Image as ImageIcon, Loader2 } from 'lucide-react';

type Nac = 'measured' | 'inferred' | 'verified';

/** Ba nấc — nhãn tiếng người + hình dạng riêng. Màu là kênh THỨ BA, không phải kênh duy nhất. */
const NAC: Record<Nac, { nhan: string; hinh: string; mau: string }> = {
  verified: { nhan: 'Đã xác minh', hinh: '◆', mau: 'var(--success)' },
  measured: { nhan: 'Đo được', hinh: '■', mau: 'var(--accent)' },
  inferred: { nhan: 'Máy suy', hinh: '▲', mau: 'var(--warning)' },
};

interface TruongCoNac {
  ten: string;
  giaTri: string;
  nac: Nac;
  nguon: string;
}

interface KetQua {
  assetId: string;
  anhUrl: string;
  objUrl: string;
  mtlUrl: string;
  soLieu: {
    triTruoc: number;
    triSau: number;
    soManh: number;
    soManhThamSo: number;
    soDien: number;
    soCauKien: number;
    soCauKienDatTen: number;
    coTexture: boolean;
  };
  cauKien: { id: string; ten: { vi: string; en: string }; matHex: string; provenance: string }[];
  ghiChu: string[];
  coCua: Record<string, unknown>;
  creditDaTieu: number;
  bieuDien: { id: string; kind: string; payloadRef: string }[];
}

interface TrangThaiNhanh {
  khoi: { chay: boolean; credit: number; moTa: string };
  anh: { chay: boolean; credit: number; lyDo?: string; moTa: string };
}

const doc = (f: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('Không đọc được tệp.'));
    r.readAsDataURL(f);
  });

/** Bóc bảng cờ per-trường ra từ khối mở rộng của bản ghi — KHÔNG suy lại, đọc đúng cái máy ghi. */
function bocTruong(coCua: Record<string, unknown>): TruongCoNac[] {
  const ra: TruongCoNac[] = [];
  const doc1 = (nhom: string, ten: string, v: unknown) => {
    if (typeof v !== 'object' || v === null) return;
    const o = v as { value?: unknown; flag?: string; source?: string };
    if (o.flag !== 'measured' && o.flag !== 'inferred' && o.flag !== 'verified') return;
    const gt = Array.isArray(o.value) ? o.value.join(' · ') : String(o.value ?? '');
    if (!gt) return;
    ra.push({ ten: `${nhom} · ${ten}`, giaTri: gt, nac: o.flag, nguon: o.source ?? '' });
  };
  const p = coCua.params as Record<string, unknown> | undefined;
  if (p) for (const [k, v] of Object.entries(p)) doc1('Số đo', k, v);
  const c = coCua.classification as Record<string, unknown> | undefined;
  if (c) for (const [k, v] of Object.entries(c)) doc1('Phân loại', k, v);
  const m = coCua.mesh as { flag?: string; source?: string; triangles?: number } | undefined;
  if (m?.flag === 'inferred')
    ra.push({ ten: 'Hình khối · mesh', giaTri: `${m.triangles ?? '?'} tam giác`, nac: 'inferred', nguon: m.source ?? '' });
  return ra;
}

export default function NhanDienCauKien() {
  const [trangThai, setTrangThai] = useState<TrangThaiNhanh | null>(null);
  const [anh, setAnh] = useState<{ ten: string; dataUri: string } | null>(null);
  const [khoi, setKhoi] = useState<{ ten: string; base64: string } | null>(null);
  const [ten, setTen] = useState('');
  const [ma, setMa] = useState('');
  const [hang, setHang] = useState('');
  const [w, setW] = useState('');
  const [d, setD] = useState('');
  const [h, setH] = useState('');
  const [nguon, setNguon] = useState('');
  const [moTa, setMoTa] = useState('');
  const [dangChay, setDangChay] = useState<'' | 'khoi' | 'anh'>('');
  const [loi, setLoi] = useState('');
  const [kq, setKq] = useState<KetQua | null>(null);
  const lyDoId = useId();
  const anhRef = useRef<HTMLInputElement>(null);
  const khoiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/idfc-import')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setTrangThai(j.nhanh))
      .catch(() => {});
  }, []);

  const duMoTa = ten.trim() && ma.trim() && w.trim() && d.trim() && h.trim() && nguon.trim();
  const sanSangKhoi = Boolean(duMoTa && anh && khoi);
  const sanSangAnh = Boolean(duMoTa && anh && trangThai?.anh.chay);

  const chay = useCallback(
    async (nhanh: 'khoi' | 'anh') => {
      if (!anh) return;
      setDangChay(nhanh);
      setLoi('');
      setKq(null);
      try {
        const r = await fetch('/api/idfc-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nhanh,
            anhDataUri: anh.dataUri,
            glbBase64: khoi?.base64 ?? '',
            tenTepKhoi: khoi?.ten ?? '',
            spec: {
              name: ten.trim(),
              code: ma.trim(),
              brand: hang.trim() || undefined,
              wMm: Number(w),
              dMm: Number(d),
              hMm: Number(h),
              sourceUrl: nguon.trim(),
            },
            phanLoai: { caption: moTa.trim(), style: '', materials: [], room: '' },
          }),
        });
        const j = await r.json();
        if (!r.ok) setLoi(j.error ?? `Lỗi ${r.status}.`);
        else setKq(j as KetQua);
      } catch (e) {
        setLoi(e instanceof Error ? e.message : 'Không gọi được máy chủ.');
      } finally {
        setDangChay('');
      }
    },
    [anh, khoi, ten, ma, hang, w, d, h, nguon, moTa],
  );

  const oNhap = {
    background: 'var(--card)',
    color: 'var(--t1)',
    border: '1px solid var(--vien-mo)',
    borderRadius: 'var(--r-2)',
    padding: '7px 10px',
    fontSize: 'var(--fs-ui)',
    minWidth: 0,
  } as const;

  const nutChinh = (bat: boolean) =>
    ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      minHeight: 'var(--tap)',
      padding: '0 14px',
      borderRadius: 'var(--r-2)',
      border: '1px solid var(--vien-mo)',
      background: bat ? 'var(--accent)' : 'var(--panel)',
      // `--on-accent` chứ không phải '#fff' gõ tay: máy soi `cam-hex-inline` KHÔNG bắt được hex nằm
      // trong nhánh ba ngôi (mẫu của nó đòi `: '#…'` ngay sau dấu hai chấm) — lọt máy không có
      // nghĩa là đúng luật.
      color: bat ? 'var(--on-accent)' : 'var(--t2)',
      fontSize: 'var(--fs-ui)',
      cursor: bat ? 'pointer' : 'not-allowed',
      opacity: bat ? 1 : 'var(--mo-vo-hieu)',
    }) as const;

  const truong = kq ? bocTruong(kq.coCua) : [];

  return (
    <section
      style={{
        border: '1px solid var(--vien-mo)',
        borderRadius: 'var(--r-3)',
        background: 'var(--panel)',
        padding: 18,
        margin: '0 0 16px',
        color: 'var(--t1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <Box size={15} aria-hidden style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>Nhận diện cấu kiện</h2>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>
          Máy tháo khối thành cấu kiện có tên, kèm mức tin cậy từng số.
        </span>
      </div>

      {/* ── nguyên liệu ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 12 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--t3)' }}>
          Ảnh của món (bắt buộc)
          <input
            ref={anhRef}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setAnh({ ten: f.name, dataUri: await doc(f) });
            }}
            style={{ ...oNhap, padding: '6px 8px' }}
          />
          {anh && (
            <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>
              <ImageIcon size={11} aria-hidden /> {anh.ten}
            </span>
          )}
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--t3)' }}>
          Tệp khối 3D (.glb) — có thì chạy không tốn lượt
          <input
            ref={khoiRef}
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const du = await doc(f);
              setKhoi({ ten: f.name, base64: du.slice(du.indexOf(',') + 1) });
            }}
            style={{ ...oNhap, padding: '6px 8px' }}
          />
          {khoi && (
            <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>
              <FileUp size={11} aria-hidden /> {khoi.ten}
            </span>
          )}
        </label>
      </div>

      {/* ── mô tả món ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginTop: 12 }}>
        <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên món" style={oNhap} aria-label="Tên món" />
        <input value={ma} onChange={(e) => setMa(e.target.value)} placeholder="Mã món" style={oNhap} aria-label="Mã món" />
        <input value={hang} onChange={(e) => setHang(e.target.value)} placeholder="Hãng (nếu có)" style={oNhap} aria-label="Hãng" />
        <input value={w} onChange={(e) => setW(e.target.value)} inputMode="numeric" placeholder="Rộng mm" style={oNhap} aria-label="Rộng, mm" />
        <input value={d} onChange={(e) => setD(e.target.value)} inputMode="numeric" placeholder="Sâu mm" style={oNhap} aria-label="Sâu, mm" />
        <input value={h} onChange={(e) => setH(e.target.value)} inputMode="numeric" placeholder="Cao mm" style={oNhap} aria-label="Cao, mm" />
      </div>
      <input
        value={nguon}
        onChange={(e) => setNguon(e.target.value)}
        placeholder="Nguồn số đo — trang hãng hoặc hồ sơ đã tra"
        aria-label="Nguồn số đo"
        style={{ ...oNhap, width: '100%', boxSizing: 'border-box', marginTop: 8 }}
      />
      <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '6px 0 0' }}>
        Ba số trên sẽ mang mức <b style={{ color: 'var(--t2)' }}>Đã xác minh</b> — nên phải nói rõ tra ở đâu.
      </p>
      <input
        value={moTa}
        onChange={(e) => setMoTa(e.target.value)}
        placeholder="Một câu mô tả món (tuỳ chọn)"
        aria-label="Mô tả món"
        style={{ ...oNhap, width: '100%', boxSizing: 'border-box', marginTop: 8 }}
      />

      {/* ── hai cửa chạy ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => sanSangKhoi && chay('khoi')}
          aria-disabled={!sanSangKhoi}
          style={nutChinh(sanSangKhoi)}
        >
          {dangChay === 'khoi' ? <Loader2 size={14} aria-hidden /> : <Box size={14} aria-hidden />}
          {dangChay === 'khoi' ? 'Đang đọc khối…' : 'Nhận diện từ tệp khối'}
        </button>
        <button
          type="button"
          onClick={() => sanSangAnh && chay('anh')}
          aria-disabled={!sanSangAnh}
          aria-describedby={trangThai && !trangThai.anh.chay ? lyDoId : undefined}
          style={nutChinh(sanSangAnh)}
        >
          {dangChay === 'anh' ? <Loader2 size={14} aria-hidden /> : <ImageIcon size={14} aria-hidden />}
          {dangChay === 'anh' ? 'Đang dựng khối…' : 'Dựng khối từ ảnh'}
        </button>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          Đọc tệp khối: không tốn lượt · Dựng từ ảnh: tốn {trangThai?.anh.credit ?? 6} lượt
        </span>
      </div>
      {trangThai && !trangThai.anh.chay && (
        <p id={lyDoId} style={{ fontSize: 11.5, color: 'var(--warning)', margin: '8px 0 0' }}>
          {trangThai.anh.lyDo}
        </p>
      )}
      {loi && (
        <p role="alert" style={{ fontSize: 12.5, color: 'var(--danger)', margin: '10px 0 0' }}>
          {loi}
        </p>
      )}

      {/* ── kết quả ─────────────────────────────────────────────────────────────── */}
      {kq && (
        <div
          data-nhan-dien-xong
          style={{ marginTop: 16, borderTop: '1px solid var(--vien-mo)', paddingTop: 14, display: 'grid', gap: 14 }}
        >
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--t2)' }}>
            <span>
              Tam giác <b>{kq.soLieu.triTruoc.toLocaleString('vi')}</b> → <b>{kq.soLieu.triSau.toLocaleString('vi')}</b>
            </span>
            <span>
              Mảnh tham số <b>{kq.soLieu.soManhThamSo}</b>/{kq.soLieu.soManh}
            </span>
            <span>
              Diện <b>{kq.soLieu.soDien}</b>
            </span>
            <span>
              Cấu kiện đặt tên <b>{kq.soLieu.soCauKienDatTen}</b>/{kq.soLieu.soCauKien}
            </span>
            <a href={kq.objUrl} style={{ color: 'var(--accent)' }}>
              Tải hình học (.obj)
            </a>
          </div>

          <div>
            <h3 style={{ fontSize: 13, margin: '0 0 8px', fontWeight: 600 }}>Mức tin cậy từng số</h3>
            <div style={{ display: 'grid', gap: 4 }}>
              {truong.map((t) => {
                const n = NAC[t.nac];
                return (
                  <div
                    key={t.ten}
                    data-nac={t.nac}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(140px,1fr) minmax(90px,1fr) auto',
                      gap: 10,
                      alignItems: 'baseline',
                      fontSize: 12.5,
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ color: 'var(--t3)' }}>{t.ten}</span>
                    <span style={{ color: 'var(--t1)' }}>{t.giaTri}</span>
                    <span style={{ color: n.mau, whiteSpace: 'nowrap' }} title={t.nguon}>
                      <span aria-hidden>{n.hinh}</span> {n.nhan}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 13, margin: '0 0 8px', fontWeight: 600 }}>Cấu kiện máy tháo ra</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {kq.cauKien.slice(0, 24).map((c) => (
                <span
                  key={c.id}
                  title={c.provenance}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 'var(--r-full)',
                    border: '1px solid var(--vien-mo)',
                    background: 'var(--card)',
                    padding: '3px 10px',
                    fontSize: 12,
                    color: 'var(--t2)',
                  }}
                >
                  <span
                    aria-hidden
                    style={{ width: 8, height: 8, borderRadius: 'var(--r-full)', background: c.matHex }}
                  />
                  {c.ten.vi}
                </span>
              ))}
              {kq.cauKien.length > 24 && (
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>+{kq.cauKien.length - 24} phần nữa</span>
              )}
            </div>
          </div>

          {kq.ghiChu.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, margin: '0 0 6px', fontWeight: 600 }}>Máy khai chỗ chưa chắc</h3>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--t3)', lineHeight: 1.6 }}>
                {kq.ghiChu.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--t3)', margin: 0 }}>
            Đã lưu vào Thư viện — mở lại lần sau vẫn còn.
          </p>
        </div>
      )}
    </section>
  );
}
