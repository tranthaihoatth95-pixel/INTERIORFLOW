'use client';

/**
 * components/present-editor/CongThietLapTrang.tsx — CỬA nhận TỜ BẢN VẼ từ 2D/3D, và bề mặt
 * Thiết lập trang NHANH của tờ đó.
 *
 * ⭐ LUẬT NỀN THI HÀNH Ở ĐÂY: **2D/3D SÁNG TÁC NỘI DUNG · TRÌNH CHIẾU DÀN TRANG VÀ PHÁT HÀNH.**
 * Tờ đi qua cầu `lib/present-editor/to-ban-ve.ts` mang theo **tỉ lệ · khổ · lề · khung tên · neo
 * nguồn** — KHÔNG phải một tấm ảnh. Đường ẢNH (`lib/cad/present-handoff.ts` → chèn một slide ảnh)
 * VẪN CHẠY SONG SONG và không bị đụng: hai đường mang hai nghĩa khác nhau (xem §HAI ĐƯỜNG dưới).
 *
 * 🔴 VIỆC 7 — NGUỒN ĐỔI KHÔNG TỰ SỬA ĐẦU RA: component này CHỈ ĐỌC sổ dấu vết (`docDauVetNguon`)
 * để tính trạng thái và ĐÁNH DẤU. Không có nhánh nào tự ghi lại tờ khi nguồn đổi — người bấm
 * "Cập nhật" thì mới cập nhật, và tờ ĐÃ PHÁT HÀNH thì nút đó mờ hẳn (`coTheTuCapNhat`).
 *
 * Chưa có tờ nào ⇒ trả `null`: không bày cửa rỗng ở chặng Trình chiếu khi chưa ai gửi gì (luật
 * §9 — ô trống là bằng chứng còn việc, nhưng cửa KHÔNG DẪN ĐI ĐÂU thì đừng bày).
 *
 * ⛔ §HAI ĐƯỜNG — phân biệt cho phiên sau khỏi gộp nhầm:
 *   · ĐƯỜNG ẢNH  `interiorflow.cadPresentHandoff`  → PresentEditor chèn MỘT SLIDE ảnh vào deck.
 *     Đầu ra là NỘI DUNG trong deck; sửa xong là hết dây, không biết nguồn đổi.
 *   · ĐƯỜNG TỜ   `interiorflow.toBanVeHandoff`     → component NÀY giữ, không chèn slide nào.
 *     Đầu ra là MỘT TỜ có neo nguồn; nguồn đổi thì tờ tự đánh dấu "Có bản mới".
 *   Hai khoá riêng, hai kho riêng, hai bề mặt riêng ⇒ bấm "Đưa sang Present" (ảnh) và bấm "Gửi
 *   sang Trình chiếu" (tờ) trong cùng một phiên KHÔNG giẫm nhau.
 *
 * ⚠️ Bề mặt Thiết lập trang ĐẦY ĐỦ (11 mục sâu) chưa thu về ở lượt này — nút mở nó cố ý KHÔNG
 * được vẽ, thay vì vẽ một nút bấm-không-ra-gì.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { FileText, ArrowLeft, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { getLastUserId, saveResume } from '@/lib/resume';
import { paperSizeMm, type PaperKey, type PaperOrientation } from '@/lib/cad/model';
import {
  nhanToTuChang,
  docDauVetNguon,
  trangThaiNguon,
  coTheTuCapNhat,
  nhanTyLe,
  tyLeApDung,
  vungInMm,
  TY_LE_BAN_VE,
  NHAN_TRANG_THAI,
  type ToBanVe,
  type TrangThaiNguon,
  type LoiXuNguonDoi,
} from '@/lib/present-editor/to-ban-ve';

const MONO = 'ui-monospace, Menlo, monospace';
const PAPER_KEYS: PaperKey[] = ['A0', 'A1', 'A2', 'A3', 'A4'];
/** Hai dải thường trực KHÔNG được che: Vitals mép trên · dải hành động mép dưới. */
const DAI_TREN = 48;
const DAI_DUOI = 44;
const RONG = 300;

/**
 * Tờ đã nhận trong phiên này, giữ ở mức module.
 *
 * 🐛 Bug thật bắt được lúc nghiệm thu 20/08: cầu là CONSUME-ONCE, mà chặng Trình chiếu dựng
 * component này hai lần (StrictMode chạy effect → dọn → chạy lại; và `PresentEditor` còn remount
 * thật khi đổi `key={activeId}` hoặc khi người dùng tạt sang màn BOQ rồi quay lại). Lần dựng thứ
 * nhất tiêu thụ mất tờ; lần sau gọi vào cầu thì đã rỗng ⇒ tờ vừa gửi BIẾN MẤT, nút "Thiết lập
 * trang" không bao giờ hiện. Biến này sống ngoài vòng đời component nên lần dựng sau nhặt lại
 * đúng tờ đó. (Cùng họ bẫy với fallback bộ nhớ của `handoff.ts`.)
 */
let toDaNhan: ToBanVe | null = null;

/**
 * BẢN LƯU TỜ ĐÃ NHẬN — vá lỗi cùng họ với vụ mất deck.
 * TRƯỚC: tờ chỉ sống ở biến module `toDaNhan` ⇒ TẢI LẠI TRANG là mất sạch, người dùng phải sang
 * 2D gửi lại. NAY: soi gương xuống `sessionStorage` theo TỪNG DỰ ÁN. Chọn sessionStorage chứ
 * không phải localStorage vì tờ mang `anh` (dataURL xem trước ~1400px) — localStorage trần ~5MB
 * là vỡ, còn đây là ngữ cảnh của MỘT phiên làm việc, đúng vòng đời của nó. Vỡ hạn mức thì im
 * lặng bỏ qua: đây là tiện nghi, không được phép làm gãy editor (cùng luật `sheets-persist`).
 */
const KHOA_TO = 'interiorflow.toBanVe.';
function khoaTo(): string {
  const m = /\/projects\/([^/]+)/.exec(typeof location === 'undefined' ? '' : location.pathname);
  return KHOA_TO + (m?.[1] ?? 'chung');
}
function docToDaLuu(): ToBanVe | null {
  try {
    const raw = sessionStorage.getItem(khoaTo());
    return raw ? (JSON.parse(raw) as ToBanVe) : null;
  } catch {
    return null;
  }
}
function ghiToDaLuu(t: ToBanVe | null): void {
  try {
    if (t) sessionStorage.setItem(khoaTo(), JSON.stringify(t));
    else sessionStorage.removeItem(khoaTo());
  } catch {
    /* hết hạn mức / chế độ riêng tư — bỏ qua, tờ vẫn sống trong phiên qua biến module */
  }
}

export default function CongThietLapTrang() {
  const [to, setTo] = useState<ToBanVe | null>(toDaNhan);
  const router = useRouter();
  const pathname = usePathname();
  const [mo, setMo] = useState(false);
  const nutRef = useRef<HTMLButtonElement | null>(null);

  // Consume-ONCE ngay khi chặng Trình chiếu dựng xong. Không có tờ ⇒ y hệt trước, không đổi gì.
  useEffect(() => {
    const nhan = nhanToTuChang();
    if (nhan.length) {
      toDaNhan = nhan[0];
      setTo(nhan[0]);
      setMo(true); // vừa gửi sang thì mở luôn — người dùng đang ở giữa một việc
      ghiToDaLuu(nhan[0]);
    } else if (toDaNhan) {
      setTo(toDaNhan); // lần dựng thứ hai — nhặt lại tờ lần đầu đã tiêu thụ
    } else {
      // Không có tờ mới VÀ biến module trống ⇒ đây là lần TẢI LẠI TRANG. Nhặt bản đã lưu.
      const cu = docToDaLuu();
      if (cu) {
        toDaNhan = cu;
        setTo(cu);
      }
    }
  }, []);

  if (!to) return null;

  const trangThai = trangThaiNguon(to.neo, docDauVetNguon(to.neo.docId));

  /** Ghi cả state LẪN biến module — tờ đã sửa phải sống qua lần dựng lại. */
  const capNhat = (t: ToBanVe) => {
    toDaNhan = t;
    ghiToDaLuu(t); // đổi khổ/tỉ lệ/khung tên phải sống qua tải lại, không chỉ qua StrictMode
    setTo(t);
  };

  const xuLy = (loi: LoiXuNguonDoi) => {
    if (loi === 'giu-ban-hien-tai') {
      // Ghim dấu vết hiện tại làm mốc mới: người dùng đã biết nguồn đổi và CHỌN giữ bản này.
      const hienTai = docDauVetNguon(to.neo.docId);
      if (hienTai) capNhat({ ...to, neo: { ...to.neo, dauVet: hienTai } });
      return;
    }
    if (loi === 'cap-nhat') {
      // ⛔ Cổng duy nhất: tờ đã phát hành thì không đường nào cập nhật được.
      if (!coTheTuCapNhat(to)) return;
      const hienTai = docDauVetNguon(to.neo.docId);
      if (hienTai) capNhat({ ...to, neo: { ...to.neo, dauVet: hienTai, luc: Date.now() } });
      return;
    }
    // 'so-sanh' — chưa có màn so sánh; không giả vờ làm gì (nút đã mờ khi chưa nối).
  };

  const mauTrangThai =
    trangThai === 'hien-hanh' ? 'var(--success)' : trangThai === 'cu' ? 'var(--warning)' : 'var(--t3)';

  /**
   * ĐƯỜNG VỀ 2D — cấm ngõ cụt: vào sâu bằng đường nào thì phải ra được bằng đường đó.
   * Tờ này mang sẵn `neo = {chang:'cad2d', docId, sheetId}` do CadSheets ghi lúc "Gửi sang Trình
   * chiếu" — mọi thứ cần để về ĐÚNG tờ đã có. Cách về dùng LẠI cơ chế sẵn có, không đẻ đường
   * điều hướng thứ hai: ghi `resume.sheetId` rồi đi tới chặng 2D — `CadSheets` lúc mount vốn đã
   * ưu tiên `resume.sheetId` để chọn tờ, y hệt cách `PresentSheets` khôi phục tờ trình bày.
   */
  const veLai2D = () => {
    const uid = getLastUserId();
    if (uid) saveResume(uid, { route: '/cad-editor', sheetId: to.neo.sheetId });
    // Cùng dự án: đổi đuôi chặng trên chính đường đang đứng (…/present → …/cad). Không đoán id
    // dự án từ nơi khác — đường hiện tại LÀ nguồn đúng nhất.
    const duong = (pathname ?? '').replace(/\/present(?:\/.*)?$/, '/cad');
    router.push(duong && duong !== pathname ? duong : '/cad-editor');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: '0 0 auto',
        padding: '5px 10px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      <button
        ref={nutRef}
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        title={`Thiết lập trang — ${to.nhan}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          minHeight: 28,
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--vien-mo)',
          background: 'var(--card)',
          color: 'var(--t1)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <FileText size={14} />
        Thiết lập trang
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--t3)' }}>
          {to.khoGiay} · {nhanTyLe(to.tyLe)}
        </span>
        {/* chấm + chữ, không chỉ màu — màu không bao giờ là kênh duy nhất */}
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 'var(--r-full)', background: mauTrangThai }}
        />
        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{NHAN_TRANG_THAI[trangThai]}</span>
      </button>
      {/* ĐƯỜNG VỀ — chỉ hiện khi tờ này ĐẾN TỪ 2D (`neo.chang === 'cad2d'`). Không có neo 2D thì
          không vẽ nút — không hứa đường về mà không về được. */}
      {to.neo.chang === 'cad2d' && (
        <button
          type="button"
          onClick={veLai2D}
          title={`Về đúng tờ "${to.nhan}" ở chặng Thiết kế 2D`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 9px',
            minHeight: 28,
            borderRadius: 'var(--r-2)',
            border: '1px solid var(--vien-mo)',
            background: 'transparent',
            color: 'var(--t2)',
            fontSize: 11.5,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Quay lại 2D
        </button>
      )}
      <ThietLapTrang
        mo={mo}
        onDong={() => setMo(false)}
        to={to}
        onDoiTo={(patch) => capNhat({ ...to, ...patch })}
        trangThai={trangThai}
        onXuLyNguonDoi={xuLy}
      />
    </div>
  );
}

/* ── THIẾT LẬP TRANG · NHANH ────────────────────────────────────────────────────────── */

/**
 * Inspector BÊN CẠNH: khổ · hướng · tỉ lệ · lề · khung tên. Canvas VẪN THẤY.
 *
 * ⛔ Cột NEO (`top`/`bottom` chừa sẵn) chứ không phải bề mặt nổi tự tìm chỗ — hai dải thường
 * trực (Vitals mép trên · dải hành động mép dưới) là vùng cấm CỨNG, cột neo thì không có đường
 * nào che được chúng.
 * 🔴 VẬT LIỆU: biểu mẫu kỹ thuật ⇒ nền ĐẶC (`--panel`), không kính — bảng số nhoè là mất uy tín nghề.
 */
function ThietLapTrang({
  mo,
  onDong,
  to,
  onDoiTo,
  trangThai,
  onXuLyNguonDoi,
}: {
  mo: boolean;
  onDong: () => void;
  to: ToBanVe | null;
  onDoiTo: (patch: Partial<ToBanVe>) => void;
  /** trạng thái nguồn tính từ `trangThaiNguon()` — bề mặt này chỉ HIỂN THỊ, không tự sửa tờ. */
  trangThai: TrangThaiNguon;
  /** người chọn cách xử khi nguồn đổi. Không truyền = chưa nối, ba nút hiện mờ. */
  onXuLyNguonDoi?: (loi: LoiXuNguonDoi) => void;
}) {
  const [tuyChinh, setTuyChinh] = useState('');
  if (!mo || !to) return null;

  const [rongMm, caoMm] = paperSizeMm(to.khoGiay, to.huong);
  const ap = tyLeApDung(to.tyLe, to.noiDungMm, vungInMm({ rongMm, caoMm }, to.le));

  return (
    <aside
      aria-label="Thiết lập trang"
      style={{
        position: 'fixed',
        top: DAI_TREN,
        bottom: DAI_DUOI,
        right: 0,
        width: RONG,
        zIndex: 30,
        background: 'var(--panel)',
        borderLeft: '1px solid var(--vien-mo)',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'grid', gap: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ fontSize: 12, color: 'var(--t1)' }}>Thiết lập trang</strong>
          <button
            type="button"
            onClick={onDong}
            aria-label="Đóng thiết lập trang"
            style={{
              marginLeft: 'auto',
              display: 'grid',
              placeItems: 'center',
              width: 'var(--tap, 32px)',
              height: 'var(--tap, 32px)',
              borderRadius: 'var(--r-2)',
              border: '1px solid var(--vien-mo)',
              background: 'var(--card)',
              color: 'var(--t2)',
              cursor: 'pointer',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* VIỆC 7 — nguồn đổi thì ĐÁNH DẤU, không tự sửa tờ. */}
        <TrangThaiNguonHang trangThai={trangThai} daPhatHanh={!!to.daPhatHanh} onXuLy={onXuLyNguonDoi} />

        <Muc nhan="Khổ giấy">
          <HangNut>
            {PAPER_KEYS.map((k) => (
              <Chip key={k} chon={to.khoGiay === k} onClick={() => onDoiTo({ khoGiay: k })}>
                {k}
              </Chip>
            ))}
          </HangNut>
        </Muc>

        <Muc nhan="Hướng">
          <HangNut>
            {(['landscape', 'portrait'] as PaperOrientation[]).map((h) => (
              <Chip key={h} chon={to.huong === h} onClick={() => onDoiTo({ huong: h })}>
                {h === 'landscape' ? 'Ngang' : 'Dọc'}
              </Chip>
            ))}
          </HangNut>
          <Ghi>
            {rongMm} × {caoMm} mm
          </Ghi>
        </Muc>

        {/* 🔴 LUẬT ① — "Vừa khung" là LỰA CHỌN của người, không phải đường thoái lui của máy. */}
        <Muc nhan="Tỉ lệ bản vẽ">
          <HangNut>
            {TY_LE_BAN_VE.map((n) => (
              <Chip
                key={n}
                chon={to.tyLe.kieu !== 'vua-khung' && to.tyLe.n === n}
                onClick={() => onDoiTo({ tyLe: { kieu: 'chuan', n } })}
              >
                1:{n}
              </Chip>
            ))}
            <Chip chon={to.tyLe.kieu === 'vua-khung'} onClick={() => onDoiTo({ tyLe: { kieu: 'vua-khung' } })}>
              Vừa khung
            </Chip>
          </HangNut>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Tuỳ chỉnh 1:</span>
            <input
              value={tuyChinh}
              onChange={(e) => setTuyChinh(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => {
                const n = parseInt(tuyChinh, 10);
                if (Number.isFinite(n) && n > 0) onDoiTo({ tyLe: { kieu: 'tuy-chinh', n } });
              }}
              inputMode="numeric"
              aria-label="Tỉ lệ tuỳ chỉnh, mẫu số của 1 trên N"
              placeholder={to.tyLe.kieu === 'tuy-chinh' ? String(to.tyLe.n) : '—'}
              style={oNhap}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t2)', marginLeft: 'auto' }}>
              đang in {nhanTyLe(to.tyLe)}
            </span>
          </div>
          {ap.canhBao && (
            <p
              role="status"
              style={{
                margin: '8px 0 0',
                padding: '7px 9px',
                borderRadius: 'var(--r-2)',
                background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--warning) 34%, transparent)',
                color: 'var(--t1)',
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {ap.canhBao}
            </p>
          )}
        </Muc>

        <Muc nhan="Lề">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min={0}
              max={30}
              value={to.le}
              onChange={(e) => onDoiTo({ le: Number(e.target.value) })}
              aria-label="Lề trang, milimét"
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--t2)', minWidth: 34 }}>{to.le} mm</span>
          </div>
        </Muc>

        <Muc nhan="Khung tên">
          <div style={{ display: 'grid', gap: 6 }}>
            <OKhungTen
              nhan="Tên bản vẽ"
              gt={to.khungTen.tenBanVe}
              doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, tenBanVe: v } })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <OKhungTen
                nhan="Số tờ"
                gt={to.khungTen.soTo}
                doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, soTo: v } })}
              />
              <OKhungTen
                nhan="Bản sửa"
                gt={to.khungTen.banSua}
                doi={(v) => onDoiTo({ khungTen: { ...to.khungTen, banSua: v } })}
              />
            </div>
          </div>
        </Muc>
      </div>
    </aside>
  );
}

/* ── VIỆC 7 · hàng trạng thái nguồn ─────────────────────────────────────────────── */

function TrangThaiNguonHang({
  trangThai,
  daPhatHanh,
  onXuLy,
}: {
  trangThai: TrangThaiNguon;
  daPhatHanh: boolean;
  onXuLy?: (loi: LoiXuNguonDoi) => void;
}) {
  const mau =
    trangThai === 'hien-hanh' ? 'var(--success)' : trangThai === 'cu' ? 'var(--warning)' : 'var(--t3)';
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 'var(--r-2)',
        // ⛔ ĐẶC — dòng mang trạng thái nguồn là chỗ ít được phép nhoè nhất trong cả bề mặt.
        background: 'var(--card)',
        border: '1px solid var(--vien-mo)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {/* chấm + CHỮ — màu không bao giờ là kênh duy nhất */}
        <span
          aria-hidden
          style={{ width: 8, height: 8, borderRadius: 'var(--r-full)', background: mau, flex: '0 0 auto' }}
        />
        <strong style={{ fontSize: 12, color: 'var(--t1)' }}>Nguồn: {NHAN_TRANG_THAI[trangThai]}</strong>
        {daPhatHanh && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--t3)', fontFamily: MONO }}>
            đã phát hành
          </span>
        )}
      </div>
      {trangThai === 'cu' && (
        <>
          <p style={{ margin: '6px 0 7px', fontSize: 11, lineHeight: 1.5, color: 'var(--t2)' }}>
            Bản vẽ nguồn đã đổi từ lúc gửi. Tờ này giữ nguyên — bạn chọn cách xử.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <NutXu
              nhan="Cập nhật"
              loi="cap-nhat"
              onXuLy={onXuLy}
              ly={
                daPhatHanh
                  ? 'Tờ đã phát hành — máy không tự cập nhật. Tạo bản sửa mới rồi cập nhật ở đó.'
                  : null
              }
            />
            {/* ⛔ Chưa có màn so sánh ⇒ nút MỜ kèm lý do thật, không bày nút bấm-không-ra-gì. */}
            <NutXu
              nhan="So sánh"
              loi="so-sanh"
              onXuLy={onXuLy}
              ly="Chưa có màn so sánh tờ với bản nguồn mới — đang là việc còn nợ, không phải nút hỏng."
            />
            <NutXu nhan="Giữ bản hiện tại" loi="giu-ban-hien-tai" onXuLy={onXuLy} ly={null} />
          </div>
        </>
      )}
    </div>
  );
}

function NutXu({
  nhan,
  loi,
  onXuLy,
  ly: lyNgoai,
}: {
  nhan: string;
  loi: LoiXuNguonDoi;
  onXuLy?: (loi: LoiXuNguonDoi) => void;
  ly: string | null;
}) {
  const ly = !onXuLy ? 'Chưa nối đường xử nguồn đổi ở màn này.' : lyNgoai;
  const id = `xu-${loi}-ly`;
  return (
    <>
      <button
        type="button"
        aria-disabled={!!ly}
        aria-describedby={ly ? id : undefined}
        onClick={ly ? undefined : () => onXuLy?.(loi)}
        style={{
          padding: '5px 9px',
          minHeight: 'var(--tap, 32px)',
          borderRadius: 'var(--r-2)',
          border: '1px solid var(--vien-mo)',
          background: 'var(--card)',
          color: 'var(--t1)',
          fontSize: 11,
          cursor: ly ? 'default' : 'pointer',
          opacity: ly ? 'var(--mo-vo-hieu)' : 1,
        }}
      >
        {nhan}
      </button>
      {ly && (
        <span id={id} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {ly}
        </span>
      )}
    </>
  );
}

/* ── mảnh biểu mẫu ─────────────────────────────────────────────────────────────── */

function Muc({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <section>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--t3)',
          marginBottom: 6,
        }}
      >
        {nhan}
      </div>
      {children}
    </section>
  );
}

function HangNut({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{children}</div>;
}

function Chip({
  chon,
  onClick,
  children,
}: {
  chon: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chon}
      style={{
        padding: '5px 10px',
        minHeight: 'var(--tap, 32px)',
        borderRadius: 'var(--r-2)',
        border: `1px solid ${chon ? 'var(--accent)' : 'var(--vien-mo)'}`,
        background: chon ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'var(--card)',
        color: chon ? 'var(--t1)' : 'var(--t2)',
        fontSize: 11,
        fontWeight: chon ? 600 : 500,
        fontFamily: MONO,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function Ghi({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10, color: 'var(--t3)' }}>{children}</div>;
}

const oNhap: CSSProperties = {
  width: 56,
  padding: '4px 6px',
  borderRadius: 'var(--r-2)',
  border: '1px solid var(--vien-mo)',
  background: 'var(--bg)',
  color: 'var(--t1)',
  fontFamily: MONO,
  fontSize: 11,
};

function OKhungTen({ nhan, gt, doi }: { nhan: string; gt: string; doi: (v: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{nhan}</span>
      <input value={gt} onChange={(e) => doi(e.target.value)} style={{ ...oNhap, width: '100%' }} placeholder="—" />
    </label>
  );
}
