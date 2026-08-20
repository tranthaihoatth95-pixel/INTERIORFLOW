'use client';

/**
 * components/ui/CuaAnhThanhSpec.tsx — CỬA NGƯỜI DUYỆT của năng lực `image-to-3d`:
 * **ảnh đã nhận → máy hiểu → người duyệt → spec lưu được**.
 *
 * ── DÙNG LẠI, KHÔNG VẼ MỚI (luật B25 NO-REBUILD) ───────────────────────────────────────────────
 *  · máy HIỂU ảnh   → `lib/vision/single-view-metrology#measureObjectTiered` qua
 *                     `lib/capabilities/image-to-3d#deXuatKhoi3D`. Không thuật toán nào ở đây.
 *  · tách món       → `lib/render-core/furniture-extract-core#extractForeground` — ĐÚNG hàm node
 *                     `vision.measureobject` và `ai.furnitureextract` đang gọi. Không bộ tách thứ hai.
 *  · ảnh → RGBA     → `lib/imaging#loadImage` + canvas, cùng cách `lib/nodes/defs/metrology.ts` làm.
 *  · ngữ pháp sự thật → `lib/capabilities/anh-thanh-spec` (thuần, có test canh). Component này
 *                     KHÔNG tự chế nhãn "SUY RA"/"ĐÃ KIỂM" — nó gọi `nhanKichThuoc()`.
 *  · tiến trình     → `LightBar` + `lib/ui/tien-trinh.ts`.
 *  · nơi lưu        → `AssetRepresentation` (bảng đã có) qua `/api/asset-representation`.
 *
 * ── BỐN CỬA, ÍT MA SÁT (§ cửa duyệt) ───────────────────────────────────────────────────────────
 *   G1 đối tượng · G2 kích thước · G3 vật liệu & sản phẩm · G4 xuất spec.
 * Chỗ máy CHẮC thì im lặng (không huênh hoang "đã nhận diện thành công"); chỗ máy KHÔNG chắc thì
 * gọi chú ý bằng CHỮ, không chỉ bằng màu (màu không được là kênh duy nhất).
 *
 * ── HAI THỨ TUYỆT ĐỐI KHÔNG LÀM ────────────────────────────────────────────────────────────────
 *  ⛔ KHÔNG BỊA %. Đọc ảnh là việc **không đo được** ⇒ `LightBar` không nhận `value`. Con số duy
 *    nhất hiện ra là `confidencePercent` của chính máy đo, có nhãn "độ tin phương pháp".
 *  ⛔ KHÔNG GHI ĐÈ IM LẶNG. Không cú bấm nào ở đây đổi ảnh nguồn hay ghi vào bản vẽ. Đầu ra duy
 *    nhất là MỘT hàng `AssetRepresentation` gắn vào chính danh tính ảnh đó.
 */

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { RADIUS } from '@/lib/geometry';
import { CommandIcon } from './command-icon';
import LightBar from './LightBar';
import { loadImage } from '@/lib/imaging';
import { stashSpecPresentHandoff } from '@/lib/present-editor/spec-present-handoff';
import { extractForeground } from '@/lib/render-core/furniture-extract-core';
import {
  FURNITURE_SIZE_PRIORS,
  type FurnitureCategory,
  type ObjectSilhouette,
  type Pt2D,
  type RgbaImage,
} from '@/lib/vision/single-view-metrology';
import { deXuatKhoi3D, nhanUngVien, type TuChoi, type UngVienKhoi3D } from '@/lib/capabilities/image-to-3d';
import {
  banGhiBieuDien,
  nhanKichThuoc,
  sanPhamChuaRo,
  sanPhamNguoiNhap,
  taoSpecTuUngVien,
  thuocTinhKhongSuyDuoc,
  ungVienVatLieu,
  type Mau,
  type SpecTuAnh,
  type UngVienSanPham,
  type UngVienVatLieu,
} from '@/lib/capabilities/anh-thanh-spec';

interface AnhThuVien {
  id: string;
  name: string;
  url: string;
}

const LOAI_DO = Object.keys(FURNITURE_SIZE_PRIORS) as FurnitureCategory[];

/* ─────────────────────────── đọc ảnh (DOM, không thuật toán mới) ─────────────────────────── */

async function docRgba(src: string, maxSide = 1400): Promise<RgbaImage> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas để đọc ảnh.');
  ctx.drawImage(img, 0, 0, w, h);
  try {
    const id = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, data: id.data };
  } catch {
    throw new Error('Ảnh bị chặn CORS — dùng ảnh trong Thư viện của dự án.');
  }
}

/** 4 góc bbox → đa giác viền tối giản; cùng khuôn `bboxToCorners` của `lib/nodes/defs/metrology.ts`. */
function gocBbox(b: { x: number; y: number; w: number; h: number }): Pt2D[] {
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ];
}

/** Màu trung bình của các pixel MÓN (alpha>0). Bằng chứng yếu nhưng THẬT — và được khai là yếu. */
function mauTrungBinh(data: Uint8ClampedArray): Mau | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return null;
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

/* ─────────────────────────── cửa duyệt ─────────────────────────── */

export default function CuaAnhThanhSpec({ onDong }: { onDong: () => void }) {
  const router = useRouter();
  const [dsAnh, setDsAnh] = useState<AnhThuVien[] | null>(null);
  const [loiDs, setLoiDs] = useState<string | null>(null);
  const [chon, setChon] = useState<AnhThuVien | null>(null);
  const [loai, setLoai] = useState<FurnitureCategory>('armchair');

  const [dangDoc, setDangDoc] = useState(false);
  const [uv, setUv] = useState<UngVienKhoi3D | null>(null);
  const [tuChoi, setTuChoi] = useState<TuChoi | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [canhBao, setCanhBao] = useState<string[]>([]);
  const [mauAnh, setMauAnh] = useState<Mau | undefined>(undefined);

  const [sua, setSua] = useState<{ rong: string; sau: string; cao: string }>({ rong: '', sau: '', cao: '' });
  const [matId, setMatId] = useState('');
  const [sp, setSp] = useState({ ten: '', sku: '', nguon: '' });
  const [loiSp, setLoiSp] = useState<string | null>(null);

  const [nguoiKy, setNguoiKy] = useState('');
  const [spec, setSpec] = useState<SpecTuAnh | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const [daLuu, setDaLuu] = useState<{ id: string; truthLevel: string } | null>(null);

  const idLyDo = useId();

  useEffect(() => {
    let huy = false;
    fetch('/api/library')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 401 ? 'Chưa đăng nhập.' : `Thư viện trả lỗi ${r.status}.`))))
      .then((j: { assets?: AnhThuVien[] }) => {
        if (!huy) setDsAnh((j.assets ?? []).slice(0, 60));
      })
      .catch((e: Error) => !huy && setLoiDs(e.message));
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { user?: { name?: string } } | null) => !huy && setNguoiKy(j?.user?.name ?? ''))
      .catch(() => undefined);
    return () => {
      huy = true;
    };
  }, []);

  const ungVienVl = useMemo(() => ungVienVatLieu({ mauAnh }), [mauAnh]);
  const chuaRo = useMemo(() => thuocTinhKhongSuyDuoc(), []);

  const docAnh = useCallback(async () => {
    if (!chon) return;
    setDangDoc(true);
    setLoi(null);
    setTuChoi(null);
    setUv(null);
    setSpec(null);
    setDaLuu(null);
    setCanhBao([]);
    try {
      const rgba = await docRgba(chon.url);
      const tach = extractForeground(rgba.data, rgba.width, rgba.height, 0.25);
      setCanhBao(tach.warnings);
      setMauAnh(mauTrungBinh(tach.data) ?? undefined);
      const silhouette: ObjectSilhouette | undefined = tach.bbox ? { front: gocBbox(tach.bbox) } : undefined;
      const kq = deXuatKhoi3D({
        nguon: { loai: 'libraryAsset', id: chon.id, imageUrl: chon.url },
        category: loai,
        silhouette,
        image: rgba,
        name: chon.name,
      });
      if (kq.ok) setUv(kq.ungVien);
      else setTuChoi(kq.tuChoi);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không đọc được ảnh.');
    } finally {
      setDangDoc(false);
    }
  }, [chon, loai]);

  const soSua = (s: string): number | undefined => {
    const n = Number(s.trim());
    return s.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const xuatSpec = useCallback(async () => {
    if (!uv) return;
    setLoi(null);
    setLoiSp(null);
    // Sản phẩm: máy KHÔNG bao giờ điền. Người có gõ thì đi qua cổng cấm-bịa-mã.
    let sanPham: UngVienSanPham = sanPhamChuaRo();
    if (sp.ten.trim() || sp.sku.trim()) {
      const r = sanPhamNguoiNhap({ ten: sp.ten, sku: sp.sku, nguon: sp.nguon, nguoiNhap: nguoiKy });
      if (!r.ok) {
        setLoiSp(r.lyDo);
        return;
      }
      sanPham = r.sanPham;
    }
    try {
      const daNhan = nhanUngVien(uv, {
        nguoiXacNhan: nguoiKy,
        sua: { rongMm: soSua(sua.rong), sauMm: soSua(sua.sau), caoMm: soSua(sua.cao) },
      });
      const vatLieu: UngVienVatLieu | undefined = ungVienVl.find((v) => v.matId === matId);
      const s = taoSpecTuUngVien(daNhan, { vatLieu, sanPham });
      setSpec(s);
      // 🔴 CỐ Ý KHÔNG `setUv(daNhan)` — bắt trên app thật 20/08: nhận rồi xuất lại lần hai thì
      // `basis` bị nối thêm *"người duyệt đã xem, không sửa: …"* chồng lên nhau. Giữ ỨNG VIÊN
      // GỐC làm nguồn: mỗi lần xuất là một phép ký MỚI từ số máy gốc, nên xuất bao nhiêu lần
      // cũng ra cùng một vết. (Cùng lý do `nhanUngVien` trả bản mới thay vì đổi tại chỗ.)

      setDangLuu(true);
      const res = await fetch('/api/asset-representation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(banGhiBieuDien(s)),
      });
      const j = (await res.json().catch(() => ({}))) as { representation?: { id: string; truthLevel: string }; error?: string };
      if (!res.ok || !j.representation) throw new Error(j.error ?? `Máy chủ trả lỗi ${res.status}.`);
      setDaLuu({ id: j.representation.id, truthLevel: j.representation.truthLevel });
    } catch (e) {
      setLoi(e instanceof Error ? e.message : 'Không lưu được spec.');
    } finally {
      setDangLuu(false);
    }
  }, [uv, sua, matId, sp, nguoiKy, ungVienVl]);

  const lyDoXuat = !uv ? 'Chưa đọc ảnh — chọn ảnh rồi bấm Đọc ảnh' : !nguoiKy ? 'Chưa biết ai duyệt — cần đăng nhập' : dangLuu ? 'Đang lưu — chờ lượt này xong' : undefined;

  // "Đưa sang Trình bày →" — CHỈ bật SAU khi `daLuu` có (spec đã ghi thật vào AssetRepresentation
  // qua /api/asset-representation, không phải state nháp trên màn). Cùng pattern CAD→Present
  // (lib/cad/present-handoff.ts): stash rồi router.push, PresentEditor tự consume-once.
  const toPresent = useCallback(() => {
    if (!spec || !daLuu) return;
    const dongChu = [
      spec.kichThuoc.map((k) => `${k.ten}: ${k.nhan}`).join(' · '),
      `Vật liệu: ${spec.vatLieu ? `${spec.vatLieu.ten} — ứng viên, chưa xác nhận` : 'Chưa chọn'}`,
      `Sản phẩm: ${spec.sanPham.ten}${spec.sanPham.sku ? ` (${spec.sanPham.sku})` : ''}`,
      `Mức sự thật: ${daLuu.truthLevel}`,
    ];
    stashSpecPresentHandoff({
      doiTuong: spec.doiTuong,
      dongChu,
      boqNote: spec.boq.duoc ? 'Đủ điều kiện vào BOQ.' : `Chưa vào BOQ: ${spec.boq.lyDo}`,
      representationId: daLuu.id,
    });
    router.push('/present-editor');
  }, [spec, daLuu, router]);

  return (
    <div style={panel} role="dialog" aria-label="Ảnh thành khối">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <CommandIcon name="Box" size={16} />
        <strong style={{ fontSize: 12.5 }}>Ảnh thành khối</strong>
        <span style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={onDong} style={nutPhu} aria-label="Đóng cửa duyệt">
            Đóng
          </button>
        </span>
      </div>

      {/* ═══ G1 — ĐỐI TƯỢNG ═══ */}
      <section style={cua} aria-label="G1 — đối tượng">
        <div style={tieuDeCua}>G1 · Đối tượng</div>
        {loiDs && <div style={hopLoi} role="alert">{loiDs}</div>}
        <label style={nhan}>
          Ảnh nguồn
          <select
            value={chon?.id ?? ''}
            onChange={(e) => {
              setChon(dsAnh?.find((a) => a.id === e.target.value) ?? null);
              setUv(null);
              setSpec(null);
              setDaLuu(null);
              setTuChoi(null);
            }}
            style={oNhap}
          >
            <option value="">{dsAnh ? 'chọn một ảnh đã nhận…' : 'đang tải danh sách…'}</option>
            {(dsAnh ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          {chon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chon.url} alt={`Ảnh nguồn: ${chon.name}`} style={anhNho} />
          ) : (
            <div style={{ ...anhNho, display: 'grid', placeItems: 'center', fontSize: 10.5, color: 'var(--t3)' }}>chưa chọn ảnh</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
            <label style={nhan}>
              Loại đồ (máy không đoán hộ)
              <select value={loai} onChange={(e) => setLoai(e.target.value as FurnitureCategory)} style={oNhap}>
                {LOAI_DO.map((k) => (
                  <option key={k} value={k}>
                    {FURNITURE_SIZE_PRIORS[k].label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-disabled={!chon || dangDoc ? true : undefined}
              aria-describedby={!chon || dangDoc ? idLyDo : undefined}
              onClick={!chon || dangDoc ? undefined : docAnh}
              style={{ ...nutChinh, opacity: !chon || dangDoc ? 'var(--mo-vo-hieu)' : 1, cursor: !chon || dangDoc ? 'not-allowed' : 'pointer' }}
            >
              {dangDoc ? 'Đang đọc…' : 'Đọc ảnh'}
            </button>
            {(!chon || dangDoc) && (
              <span id={idLyDo} style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                {dangDoc ? 'Đang đọc ảnh — chờ lượt này xong' : 'Chưa có ảnh nguồn — chọn một ảnh đã nhận'}
              </span>
            )}
          </div>
        </div>

        {/* Đọc ảnh là việc KHÔNG đo được ⇒ không truyền `value`, không con số nào. */}
        {dangDoc && <LightBar soVach={24} label="Đang đọc ảnh và tách món" />}

        {loi && (
          <div style={hopLoi} role="alert">
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Không chạy được</div>
            <div style={{ color: 'var(--t2)' }}>{loi}</div>
          </div>
        )}

        {tuChoi && (
          <div style={hopLoi} role="alert">
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Chưa dựng được khối</div>
            <div style={{ color: 'var(--t2)' }}>{tuChoi.lyDo}</div>
            <ul style={{ margin: '5px 0 0 16px', padding: 0, color: 'var(--t2)' }}>
              {tuChoi.canLam.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {uv && (
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div>
              <strong>{uv.categoryLabel}</strong> · {uv.nhanKhop}
            </div>
            <div style={{ color: 'var(--t3)' }}>
              {uv.tierLabel} · độ tin phương pháp {uv.confidencePercent}%
            </div>
            {uv.hopBaoTam && <div style={cheNhac}>Mới là hộp bao tạm — chưa khớp mẫu nào trong thư viện.</div>}
            {uv.upgradeHint && <div style={{ color: 'var(--t3)' }}>{uv.upgradeHint}</div>}
            {canhBao.map((w) => (
              <div key={w} style={cheNhac}>
                {w}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ G2 — KÍCH THƯỚC ═══ */}
      {uv && (
        <section style={cua} aria-label="G2 — kích thước">
          <div style={tieuDeCua}>G2 · Kích thước</div>
          <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
            Kích thước suy từ phối cảnh. Gõ lại số nào thì số đó thành đã kiểm; để nguyên thì vẫn là suy ra.
          </div>
          {([
            ['Rộng', uv.rong, sua.rong, (v: string) => setSua((s) => ({ ...s, rong: v }))],
            ['Sâu', uv.sau, sua.sau, (v: string) => setSua((s) => ({ ...s, sau: v }))],
            ['Cao', uv.cao, sua.cao, (v: string) => setSua((s) => ({ ...s, cao: v }))],
          ] as const).map(([ten, k, val, set]) => (
            <div key={ten} style={hangSo}>
              <div style={{ width: 44, color: 'var(--t3)' }}>{ten}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{nhanKichThuoc(k.valueMm, k.flag)}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{k.basis}</div>
              </div>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                inputMode="numeric"
                placeholder="gõ lại (mm)"
                aria-label={`Gõ lại chiều ${ten} theo mm`}
                style={{ ...oNhap, width: 104, flex: 'none' }}
              />
            </div>
          ))}
        </section>
      )}

      {/* ═══ G3 — VẬT LIỆU & SẢN PHẨM ═══ */}
      {uv && (
        <section style={cua} aria-label="G3 — vật liệu và sản phẩm">
          <div style={tieuDeCua}>G3 · Vật liệu & sản phẩm</div>
          <label style={nhan}>
            Ứng viên vật liệu — máy đề xuất, bạn chọn
            <select value={matId} onChange={(e) => setMatId(e.target.value)} style={oNhap}>
              <option value="">chưa chọn</option>
              {ungVienVl.map((v) => (
                <option key={v.matId} value={v.matId}>
                  {v.ten} ({v.nhom}){v.doGan != null ? ` · gần màu ${v.doGan}%` : ''}
                </option>
              ))}
            </select>
          </label>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>
            {ungVienVl.find((v) => v.matId === matId)?.bangChung ?? ungVienVl[0]?.bangChung}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <input value={sp.ten} onChange={(e) => setSp((s) => ({ ...s, ten: e.target.value }))} placeholder="Sản phẩm (để trống = Chưa rõ)" aria-label="Tên sản phẩm" style={{ ...oNhap, flex: '1 1 150px' }} />
            <input value={sp.sku} onChange={(e) => setSp((s) => ({ ...s, sku: e.target.value }))} placeholder="Mã (nếu có)" aria-label="Mã sản phẩm" style={{ ...oNhap, flex: '0 1 110px' }} />
            <input value={sp.nguon} onChange={(e) => setSp((s) => ({ ...s, nguon: e.target.value }))} placeholder="Nguồn tra được của mã" aria-label="Nguồn tra được của mã sản phẩm" style={{ ...oNhap, flex: '1 1 170px' }} />
          </div>
          {loiSp && <div style={hopLoi} role="alert">{loiSp}</div>}

          <details>
            <summary style={{ cursor: 'pointer', fontSize: 10.5, color: 'var(--t3)' }}>
              Sáu ô ảnh không trả lời được — đang để Chưa rõ
            </summary>
            <ul style={{ margin: '5px 0 0 16px', padding: 0, fontSize: 10.5, color: 'var(--t3)' }}>
              {chuaRo.map((c) => (
                <li key={c.ten}>
                  <strong>{c.ten}:</strong> {c.giaTri} — {c.canLam}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* ═══ G4 — XUẤT SPEC ═══ */}
      {uv && (
        <section style={cua} aria-label="G4 — xuất spec">
          <div style={tieuDeCua}>G4 · Xuất spec</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              aria-disabled={lyDoXuat ? true : undefined}
              onClick={lyDoXuat ? undefined : xuatSpec}
              style={{ ...nutChinh, opacity: lyDoXuat ? 'var(--mo-vo-hieu)' : 1, cursor: lyDoXuat ? 'not-allowed' : 'pointer' }}
            >
              {dangLuu ? 'Đang lưu…' : 'Nhận & xuất spec'}
            </button>
            {lyDoXuat && <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{lyDoXuat}</span>}
            {nguoiKy && !lyDoXuat && <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>Ký tên: {nguoiKy}</span>}
          </div>
          {dangLuu && <LightBar soVach={24} label="Đang ghi cách thể hiện vào ảnh gốc" />}

          {spec && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 10.5 }}>
              <div>
                <strong>{spec.doiTuong}</strong> — {spec.kichThuoc.map((k) => k.nhan).join(' · ')}
              </div>
              <div style={spec.boq.duoc ? cheOk : cheNhac}>
                {spec.boq.duoc ? 'Đủ điều kiện vào BOQ.' : `Chưa vào BOQ: ${spec.boq.lyDo}`}
              </div>
              <div style={{ color: 'var(--t3)' }}>
                Vật liệu: {spec.vatLieu ? `${spec.vatLieu.ten} — ứng viên, chưa xác nhận` : 'Chưa chọn'} · Sản phẩm: {spec.sanPham.ten}
                {spec.sanPham.sku ? ` (${spec.sanPham.sku})` : ''}
              </div>
              {daLuu && (
                <div style={cheOk}>
                  Đã lưu vào ảnh gốc — mức sự thật ghi xuống: {daLuu.truthLevel}. Không tạo bản sao ảnh nào.
                </div>
              )}
              {daLuu && (
                <button type="button" onClick={toPresent} style={{ ...nutChinh, alignSelf: 'flex-start' }}>
                  Đưa sang Trình bày →
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ─────────────────────────── hình thức (token, không hex) ─────────────────────────── */

const panel: CSSProperties = {
  width: 'min(460px, calc(100vw - 32px))',
  maxHeight: 'min(70vh, 620px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 12,
  borderRadius: RADIUS.r4,
  // Kính là VỎ; các ô cửa bên trong dùng nền đặc — không kính chồng kính.
  background: 'color-mix(in srgb, var(--panel) 88%, transparent)',
  backdropFilter: 'blur(18px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  border: '1px solid var(--border)',
  boxShadow: '0 8px 30px rgba(0,0,0,.22)',
  color: 'var(--t2)',
  fontSize: 11.5,
};

const cua: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  padding: 9,
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--card, var(--field))',
};

const tieuDeCua: CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: 'var(--t3)' };

const hangSo: CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 };

const anhNho: CSSProperties = {
  width: 92,
  height: 68,
  flex: 'none',
  objectFit: 'cover',
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--field)',
};

const nhan: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10.5, color: 'var(--t3)' };

const oNhap: CSSProperties = {
  minHeight: 28,
  padding: '0 7px',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontFamily: 'inherit',
  fontSize: 11.5,
};

const nutChinh: CSSProperties = {
  minHeight: 30,
  padding: '0 14px',
  borderRadius: RADIUS.r2,
  border: '1px solid transparent',
  background: 'var(--accent)',
  color: 'var(--on-accent)',
  fontFamily: 'inherit',
  fontSize: 11.5,
  fontWeight: 700,
  cursor: 'pointer',
};

const nutPhu: CSSProperties = {
  minHeight: 30,
  padding: '0 12px',
  borderRadius: RADIUS.r2,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontFamily: 'inherit',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
};

const hopLoi: CSSProperties = {
  padding: 9,
  borderRadius: RADIUS.r2,
  border: '1px solid color-mix(in srgb, var(--danger, #e05252) 45%, transparent)',
  background: 'color-mix(in srgb, var(--danger, #e05252) 12%, transparent)',
  fontSize: 11,
};

/** Nhắc — CHỮ mang nghĩa, màu chỉ là kênh phụ (màu không được là kênh duy nhất). */
const cheNhac: CSSProperties = { color: 'var(--warning, var(--t2))', fontSize: 10.5 };
const cheOk: CSSProperties = { color: 'var(--t2)', fontSize: 10.5 };
