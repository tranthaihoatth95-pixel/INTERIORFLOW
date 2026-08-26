'use client';

/**
 * components/ui/SoSpecDaLuu.tsx — ĐƯỜNG ĐỌC của lát cắt "Ảnh → Spec".
 *
 * ── VÌ SAO CÓ TỆP NÀY (đo 26/08, W1-5) ─────────────────────────────────────────────────────────
 * `GET /api/asset-representation` TỒN TẠI từ 20/08 nhưng **không component nào gọi**. Người dùng
 * duyệt xong một tờ spec ở `CuaAnhThanhSpec.tsx`, POST một hàng `AssetRepresentation` — rồi
 * **không bao giờ mở lại được**. Chỉ có đường GHI. Một thứ ghi được mà không đọc lại được thì
 * người dùng không có lý do nào để tin là nó đã được ghi (luật 8: đi trọn tới chứng minh).
 *
 * ── DÙNG LẠI, KHÔNG VẼ MỚI (luật B25 NO-REBUILD) ───────────────────────────────────────────────
 *  · ngữ pháp sự thật → `lib/capabilities/anh-thanh-spec#nhanKichThuoc` — CHỖ DUY NHẤT quyết định
 *    chữ `SUY RA` / `NGƯỜI NHẬP` / `ĐÃ KIỂM` / `ĐO ĐƯỢC`. Tệp này KHÔNG tự chế một cách gọi nào.
 *  · xuất xứ chữ      → `lib/capabilities/image-to-3d#nhanXuatXu`, nhưng chỉ dùng khi bản ghi
 *    KHÔNG mang sẵn `xuatXu` — bản lưu là sự thật, hàm chỉ là lưới đỡ cho bản ghi cũ.
 *  · hằng `kind`      → `KIND_SPEC` của chính lib đó. Không gõ lại chuỗi `'spec-from-image'`.
 *  · hình thức        → cùng bộ token và cùng khuôn style của `CuaAnhThanhSpec.tsx` (nơi gọi).
 *
 * ── CHỈ ĐỌC. TUYỆT ĐỐI ──────────────────────────────────────────────────────────────────────────
 *  ⛔ Không POST · không PATCH · không DELETE · không nút sửa. Cửa GHI đã có ở `CuaAnhThanhSpec`;
 *    hai cửa ghi cho cùng một bảng là bắt đầu phân kỳ.
 *  ⛔ KHÔNG TÍNH LẠI. Mọi con số, mọi cờ, mọi câu `basis` hiện ở đây đều **đọc nguyên** từ cột
 *    `provenance` đã lưu. Tính lại từ ảnh sẽ ra một con số KHÁC con số đã ký — và người đọc hồ sơ
 *    không có cách nào biết mình đang nhìn cái nào.
 *
 * ── NĂM TRẠNG THÁI, KHÔNG GỘP (luật đã trả giá) ────────────────────────────────────────────────
 *   ① đang tải  ② không có quyền (401/403)  ③ tải hỏng  ④ chưa có bản ghi nào  ⑤ có bản ghi.
 * ④ ≠ ③: "chưa ai lưu spec cho ảnh này" là chuyện BÌNH THƯỜNG, không phải lỗi — hiện nó như lỗi
 * là dạy người dùng sợ một trạng thái sạch. ② ≠ ③: hết phiên thì việc phải làm là đăng nhập lại,
 * chứ không phải thử lại. Và trong ⑤ còn một ca thứ sáu ở cấp HÀNG: **bản ghi có nhưng `provenance`
 * rỗng/hỏng** — hàng vẫn hiện, kèm câu nói thẳng là nội dung không đọc được, KHÔNG im lặng bỏ qua
 * (ô trống là bằng chứng còn việc, §9).
 */

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { RADIUS } from '@/lib/geometry';
import { nhanXuatXu, type CanCuSuThat } from '@/lib/capabilities/image-to-3d';
import { KIND_SPEC, nhanKichThuoc } from '@/lib/capabilities/anh-thanh-spec';
import type { ProvenanceFlag } from '@/lib/idfc-import/from-photo';

/* ─────────────────────────── hình dạng ĐÃ LƯU (đọc, không dựng lại) ─────────────────────────── */

/** Đúng hàng `AssetRepresentation` mà `GET /api/asset-representation` trả về. */
interface HangBieuDien {
  id: string;
  assetId: string;
  kind: string;
  payloadRef: string;
  truthLevel: string;
  provenance: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  deletedAt: string | null;
}

/**
 * Hình dạng JSON trong cột `provenance`, do `banGhiBieuDien()` ghi ra. Khai lỏng có chủ đích:
 * đây là dữ liệu ĐÃ NẰM TRONG DB từ những phiên bản trước, nên mọi trường đều phải coi là có thể
 * thiếu. Cấm `as` ép kiểu rồi đọc thẳng — đó đúng là cách một trường `undefined` lọt qua và thành
 * một khẳng định xanh trên không khí.
 */
interface ODaLuu {
  ten?: unknown;
  mm?: unknown;
  flag?: unknown;
  flagMay?: unknown;
  canCu?: unknown;
  canCuMay?: unknown;
  xuatXu?: unknown;
  basis?: unknown;
}

interface XuatXuDaLuu {
  nangLuc?: unknown;
  doiTuong?: unknown;
  phuongPhap?: unknown;
  doTin?: unknown;
  kichThuoc?: unknown;
  boq?: unknown;
  vatLieu?: unknown;
  sanPham?: unknown;
  chuaRo?: unknown;
}

const FLAG: readonly ProvenanceFlag[] = ['measured', 'inferred', 'verified'];

const laChuoi = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const laSo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Một chiều đã đọc được từ bản lưu. `nhan` LUÔN đi qua `nhanKichThuoc` — không tự đặt chữ. */
interface ChieuDoc {
  ten: string;
  nhan: string | null;
  xuatXu: string | null;
  basis: string | null;
}

function docChieu(o: ODaLuu): ChieuDoc {
  const ten = laChuoi(o.ten) ? o.ten : '(không tên)';
  const flag = laChuoi(o.flag) && (FLAG as readonly string[]).includes(o.flag) ? (o.flag as ProvenanceFlag) : null;
  const canCu = laChuoi(o.canCu) ? (o.canCu as CanCuSuThat) : undefined;
  // Số + cờ phải CÓ THẬT thì mới có nhãn. Thiếu một trong hai ⇒ `null` và mặt tiền nói ra là thiếu,
  // chứ không rơi về một nhãn mặc định trông như đã kiểm.
  const nhan = laSo(o.mm) && flag ? nhanKichThuoc(o.mm, flag, canCu) : null;
  // Bản lưu là sự thật; `nhanXuatXu` chỉ đỡ cho bản ghi cũ chưa có cột chữ này.
  const xuatXu = laChuoi(o.xuatXu) ? o.xuatXu : canCu ? nhanXuatXu(canCu) : null;
  return { ten, nhan, xuatXu, basis: laChuoi(o.basis) ? o.basis : null };
}

/** Kết quả bóc một hàng: hoặc đọc được nội dung, hoặc nói rõ vì sao không. */
type NoiDung =
  | { doc: true; xx: XuatXuDaLuu; chieu: ChieuDoc[] }
  | { doc: false; lyDo: string };

function bocProvenance(raw: string): NoiDung {
  if (!raw.trim()) return { doc: false, lyDo: 'Bản ghi có thật nhưng cột nguồn gốc để trống — không có gì để dựng lại tờ spec.' };
  let j: unknown;
  try {
    j = JSON.parse(raw);
  } catch {
    return { doc: false, lyDo: 'Cột nguồn gốc không phải JSON đọc được — bản ghi còn đó, nội dung thì không tra được.' };
  }
  if (!j || typeof j !== 'object') {
    return { doc: false, lyDo: 'Cột nguồn gốc không phải một đối tượng — không dựng lại được.' };
  }
  const xx = j as XuatXuDaLuu;
  const ds = Array.isArray(xx.kichThuoc) ? (xx.kichThuoc as ODaLuu[]) : [];
  return { doc: true, xx, chieu: ds.map(docChieu) };
}

/* ─────────────────────────── năm trạng thái tải, không gộp ─────────────────────────── */

type TrangThai =
  | { t: 'dangTai' }
  | { t: 'khongQuyen'; ma: number }
  | { t: 'hong'; lyDo: string }
  | { t: 'xong'; hang: HangBieuDien[] };

export interface SoSpecDaLuuProps {
  /** Ảnh đang xem. Rỗng ⇒ component không gọi mạng và không hiện gì. */
  assetId: string;
  /** Đổi giá trị này để bắt tải lại (ví dụ ngay sau khi vừa lưu xong một tờ spec). */
  khoaLamMoi?: string;
}

export default function SoSpecDaLuu({ assetId, khoaLamMoi = '' }: SoSpecDaLuuProps) {
  const [tt, setTt] = useState<TrangThai>({ t: 'dangTai' });
  const [moHang, setMoHang] = useState<string | null>(null);

  const tai = useCallback(
    async (huy: () => boolean) => {
      setTt({ t: 'dangTai' });
      try {
        const res = await fetch(`/api/asset-representation?assetId=${encodeURIComponent(assetId)}`);
        if (huy()) return;
        // 401/403 là chuyện KHÁC HẲN lỗi mạng: việc phải làm là đăng nhập lại, không phải thử lại.
        if (res.status === 401 || res.status === 403) return setTt({ t: 'khongQuyen', ma: res.status });
        if (!res.ok) return setTt({ t: 'hong', lyDo: `Máy chủ trả lỗi ${res.status}.` });
        const j = (await res.json().catch(() => null)) as { representations?: unknown } | null;
        if (huy()) return;
        // Luật F-17: khẳng định phải có chủ thể. Không có mảng `representations` thì đây KHÔNG
        // phải "danh sách rỗng" — đó là phản hồi sai hình dạng, và phải nói ra là hỏng.
        if (!j || !Array.isArray(j.representations)) {
          return setTt({ t: 'hong', lyDo: 'Phản hồi không có mảng `representations` — không đọc được.' });
        }
        const hang = (j.representations as HangBieuDien[])
          // Route đã lọc `deletedAt: null`; lọc lại ở đây là chốt chặn thứ hai, cố ý.
          .filter((r) => r && r.kind === KIND_SPEC && !r.deletedAt);
        setTt({ t: 'xong', hang });
      } catch (e) {
        if (!huy()) setTt({ t: 'hong', lyDo: e instanceof Error ? e.message : 'Không gọi được máy chủ.' });
      }
    },
    [assetId],
  );

  useEffect(() => {
    if (!assetId) return;
    let bo = false;
    void tai(() => bo);
    return () => {
      bo = true;
    };
  }, [assetId, khoaLamMoi, tai]);

  if (!assetId) return null;

  return (
    <section style={cua} aria-label="Spec đã lưu cho ảnh này">
      <div style={tieuDeCua}>Spec đã lưu · chỉ đọc</div>

      {tt.t === 'dangTai' && (
        <div style={{ fontSize: 10.5, color: 'var(--t3)' }} role="status">
          Đang tìm các tờ spec đã lưu cho ảnh này…
        </div>
      )}

      {tt.t === 'khongQuyen' && (
        <div style={hopLoi} role="alert">
          <div style={{ fontWeight: 700, marginBottom: 3 }}>Không có quyền đọc ({tt.ma})</div>
          <div style={{ color: 'var(--t2)' }}>
            Phiên đăng nhập đã hết hoặc ảnh này không thuộc quyền của bạn. Đăng nhập lại rồi mở lại — thử lại ngay
            lúc này sẽ trả cùng câu trả lời.
          </div>
        </div>
      )}

      {tt.t === 'hong' && (
        <div style={hopLoi} role="alert">
          <div style={{ fontWeight: 700, marginBottom: 3 }}>Không tải được danh sách</div>
          <div style={{ color: 'var(--t2)' }}>{tt.lyDo}</div>
          <div style={{ color: 'var(--t3)', fontSize: 10.5, marginTop: 4 }}>
            Đây là lỗi đường truyền/máy chủ — KHÔNG có nghĩa là ảnh này chưa có spec nào.
          </div>
        </div>
      )}

      {tt.t === 'xong' && tt.hang.length === 0 && (
        <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
          Chưa có tờ spec nào được lưu cho ảnh này. Đây không phải lỗi — duyệt xong ở G4 thì tờ đầu tiên sẽ hiện ở
          đây.
        </div>
      )}

      {tt.t === 'xong' && tt.hang.length > 0 && (
        <>
          <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
            {tt.hang.length} phiên bản — mới nhất trước. Bản cũ vẫn xem được, không bản nào bị đè.
          </div>
          {tt.hang.map((h, i) => (
            <TheBanGhi
              key={h.id}
              hang={h}
              moiNhat={i === 0}
              thuTu={tt.hang.length - i}
              mo={moHang === h.id}
              onMo={() => setMoHang((cu) => (cu === h.id ? null : h.id))}
            />
          ))}
        </>
      )}
    </section>
  );
}

/* ─────────────────────────── một phiên bản ─────────────────────────── */

function TheBanGhi({
  hang,
  moiNhat,
  thuTu,
  mo,
  onMo,
}: {
  hang: HangBieuDien;
  moiNhat: boolean;
  thuTu: number;
  mo: boolean;
  onMo: () => void;
}) {
  const nd = bocProvenance(hang.provenance);
  const doiTuong = nd.doc && laChuoi(nd.xx.doiTuong) ? nd.xx.doiTuong : null;

  return (
    <div style={the}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 11 }}>Bản {thuTu}</strong>
        {moiNhat && <span style={cheMoi}>mới nhất</span>}
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{gioPhut(hang.createdAt)}</span>
        <button type="button" onClick={onMo} style={{ ...nutPhu, marginLeft: 'auto' }} aria-expanded={mo}>
          {mo ? 'Thu gọn' : 'Xem tờ spec'}
        </button>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
        {doiTuong ?? 'Chưa đọc được tên đối tượng'} · mức sự thật ghi xuống: <strong>{hang.truthLevel || '(trống)'}</strong>
      </div>

      {/* Ai ký, lúc nào. Không ai ký thì NÓI RA là không ai ký — đừng để ô trống tự nói hộ. */}
      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
        {hang.verifiedBy
          ? `Người ký: ${hang.verifiedBy}${hang.verifiedAt ? ` · lúc ${gioPhut(hang.verifiedAt)}` : ' · chưa ghi thời điểm ký'}`
          : 'Chưa ai ký bản này.'}
      </div>

      {!nd.doc && (
        <div style={hopLoi} role="alert">
          <div style={{ fontWeight: 700, marginBottom: 3 }}>Bản ghi có, nội dung không đọc được</div>
          <div style={{ color: 'var(--t2)' }}>{nd.lyDo}</div>
        </div>
      )}

      {mo && nd.doc && <ToSpec xx={nd.xx} chieu={nd.chieu} payloadRef={hang.payloadRef} />}
    </div>
  );
}

/* ─────────────────────────── tờ spec dựng lại TỪ BẢN LƯU ─────────────────────────── */

function ToSpec({ xx, chieu, payloadRef }: { xx: XuatXuDaLuu; chieu: ChieuDoc[]; payloadRef: string }) {
  const boq = xx.boq && typeof xx.boq === 'object' ? (xx.boq as { duoc?: unknown; lyDo?: unknown; canhBao?: unknown }) : null;
  const vl = xx.vatLieu && typeof xx.vatLieu === 'object' ? (xx.vatLieu as { ten?: unknown; bangChung?: unknown }) : null;
  const sp = xx.sanPham && typeof xx.sanPham === 'object' ? (xx.sanPham as { ten?: unknown; sku?: unknown; nguon?: unknown; nguoiNhap?: unknown }) : null;
  const chuaRo = Array.isArray(xx.chuaRo) ? xx.chuaRo.filter(laChuoi) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10.5 }}>
      <div style={{ color: 'var(--t3)' }}>
        Phương pháp: {laChuoi(xx.phuongPhap) ? xx.phuongPhap : 'chưa ghi'}
        {laSo(xx.doTin) ? ` · độ tin phương pháp ${xx.doTin}%` : ''}
      </div>

      {chieu.length === 0 ? (
        <div style={cheNhac}>Bản lưu không có chiều nào — tờ spec này trống phần kích thước.</div>
      ) : (
        chieu.map((k) => (
          <div key={k.ten} style={hangSo}>
            <div style={{ width: 44, color: 'var(--t3)' }}>{k.ten}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Chữ SUY RA / NGƯỜI NHẬP / ĐÃ KIỂM / ĐO ĐƯỢC — do `nhanKichThuoc` đặt, không phải ở đây. */}
              <div style={{ fontWeight: 700 }}>{k.nhan ?? 'Thiếu số hoặc thiếu mức sự thật — không dựng được nhãn'}</div>
              {k.xuatXu && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{k.xuatXu}</div>}
              {k.basis && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{k.basis}</div>}
            </div>
          </div>
        ))
      )}

      {boq && (
        <div style={boq.duoc === true ? cheOk : cheNhac}>
          {boq.duoc === true ? 'Đủ điều kiện vào BOQ.' : `Chưa vào BOQ: ${laChuoi(boq.lyDo) ? boq.lyDo : 'không ghi lý do'}`}
          {laChuoi(boq.canhBao) ? ` · ${boq.canhBao}` : ''}
        </div>
      )}

      <div style={{ color: 'var(--t3)' }}>
        Vật liệu: {vl && laChuoi(vl.ten) ? `${vl.ten} — ứng viên, chưa xác nhận` : 'Chưa chọn'}
      </div>
      <div style={{ color: 'var(--t3)' }}>
        Sản phẩm: {sp && laChuoi(sp.ten) ? sp.ten : 'Chưa rõ'}
        {sp && laChuoi(sp.sku) ? ` (${sp.sku})` : ''}
        {sp && laChuoi(sp.nguon) ? ` · nguồn: ${sp.nguon}` : ''}
        {sp && laChuoi(sp.nguoiNhap) ? ` · người nhập: ${sp.nguoiNhap}` : ''}
      </div>

      {chuaRo.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', color: 'var(--t3)' }}>
            {chuaRo.length} ô ảnh không trả lời được — đã lưu là Chưa rõ
          </summary>
          <ul style={{ margin: '5px 0 0 16px', padding: 0, color: 'var(--t3)' }}>
            {chuaRo.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      )}

      <div style={{ color: 'var(--t4)', fontSize: 10 }}>Con trỏ biểu diễn: {payloadRef || '(trống)'}</div>
    </div>
  );
}

/** Giờ đọc được cho người, không nuốt giá trị hỏng thành chuỗi rác. */
function gioPhut(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? 'thời điểm không đọc được' : d.toLocaleString();
}

/* ─────────────────────────── hình thức (token, không hex) ─────────────────────────── */

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

const the: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  padding: 8,
  borderRadius: RADIUS.r1,
  border: '1px solid var(--border)',
  background: 'var(--field)',
};

const hangSo: CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11 };

const nutPhu: CSSProperties = {
  minHeight: 24,
  padding: '0 10px',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--border)',
  background: 'var(--card, var(--field))',
  color: 'var(--t2)',
  fontFamily: 'inherit',
  fontSize: 10.5,
  fontWeight: 600,
  cursor: 'pointer',
};

const hopLoi: CSSProperties = {
  padding: 8,
  borderRadius: RADIUS.r1,
  border: '1px solid color-mix(in srgb, var(--danger) 45%, transparent)',
  background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
  fontSize: 10.5,
};

/** "mới nhất" là CHỮ, không chỉ màu — màu không được là kênh duy nhất. */
const cheMoi: CSSProperties = {
  padding: '1px 5px',
  borderRadius: RADIUS.r1,
  border: '1px solid var(--accent-ring)',
  color: 'var(--accent)',
  fontSize: 9.5,
  fontWeight: 700,
};

const cheNhac: CSSProperties = { color: 'var(--warning)', fontSize: 10.5 };
const cheOk: CSSProperties = { color: 'var(--t2)', fontSize: 10.5 };
