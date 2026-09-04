/**
 * components/home/mat-vat.tsx — MẶT NHÌN của bậc KỀ BÊN (bản khoá §3, chỉ thị E).
 *
 * Bậc KỀ BÊN được cấp "một MẶT NHÌN", và **hình thức mặt đổi theo NGHĨA CỦA VẬT** — không
 * phải một thẻ chung tô màu khác nhau. Ba mặt, port đúng ngữ pháp SVG của ba bản vẽ khoá:
 *
 *   khung  — khung hình phối cảnh (render / ảnh hiện trường): trần · sàn · cửa sổ · đèn thả
 *   net    — nét bản vẽ trên mặt giấy: khung phòng · trục · dãy kích thước
 *   mau    — dải mẫu vật liệu: bốn ô màu liền nhau, không viền
 *
 * ⚠️ Cỡ mặt là **104×64** — khai trong CSS, không khai lại ở đây. Ngưỡng này đang CHỜ MẮT
 *    (`HOME-IMPLEMENTATION-SPEC.md` §8.3): kho vật liệu từng đo 141px là "quá nhỏ để phân
 *    biệt vân", còn ở đây mặt chỉ cần **nhận ra vật**, không cần **so vân**. Mắt phán ngược
 *    thì nới thang 400 → ~360 cho phần hình, KHÔNG nới cả cột.
 *
 * ⚠️ Mọi mặt đều `aria-hidden` — chúng là kênh NHÌN, và mọi tin thật đã có bản chữ ngay cạnh
 *    (tên · số sống · thời điểm). Đây là điều kiện của "hình không bao giờ là kênh duy nhất".
 */

/** Loại mặt — suy từ nghĩa của vật, không do người dựng chọn cho đẹp. */
export type KieuMat = 'khung' | 'net' | 'mau';

/**
 * Suy kiểu mặt từ TÊN vật. Thuần, tất định, không đọc gì bên ngoài.
 * Không đoán ra được thì trả `'khung'` — mặt trung tính nhất, không hứa sai loại nội dung.
 */
export function kieuMatTuTen(ten: string): KieuMat {
  const t = ten.toLowerCase();
  if (/vật liệu|mẫu|hoàn thiện|bộ .*(gỗ|đá|vải)|dna|bảng màu/.test(t)) return 'mau';
  if (/mặt bằng|mặt cắt|bản vẽ|triển khai|khung tên|hồ sơ|deck|trang|trục/.test(t)) return 'net';
  return 'khung';
}

/** Bốn ô màu vật liệu mặc định của dải mẫu — token, không hex gõ tay. */
const MAU_MAC_DINH = ['var(--vl-go)', 'var(--vl-da)', 'var(--vl-vai)', 'var(--vl-son)'];

/**
 * Nhiễu tất định từ chuỗi — cùng một vật thì mặt LUÔN y hệt, qua mọi lần tải.
 * (Mặt sinh bằng mã, không phải ảnh giả: nó không hứa đây là ảnh thật của dự án.)
 */
function hat(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function MatVat({ kieu, khoa, mau }: { kieu: KieuMat; khoa: string; mau?: readonly string[] }) {
  if (kieu === 'mau') {
    const dai = (mau && mau.length ? mau : MAU_MAC_DINH).slice(0, 5);
    return (
      <span className="mat-mau" aria-hidden="true">
        {dai.map((c, i) => (
          <i key={i} style={{ background: c }} />
        ))}
      </span>
    );
  }

  if (kieu === 'net') {
    const r = hat(khoa);
    const chia = 30 + Math.round(r * 20); // vị trí trục dọc — đổi theo vật, luôn cùng chỗ với cùng vật
    return (
      <span className="mat-vat" aria-hidden="true">
        <svg viewBox="0 0 104 64" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="104" height="64" fill="var(--nen-sang)" />
          <g stroke="var(--muc)" strokeWidth="1" opacity=".62" fill="none">
            <rect x="12" y="12" width="52" height="40" />
            <rect x="64" y="12" width="28" height="22" />
            <path d={`M12 34h52M${12 + chia} 12v40`} />
          </g>
          <g stroke="var(--muc)" strokeWidth="1" opacity=".3">
            <path d="M12 58h80" />
            <path d="M12 55v6M92 55v6" />
          </g>
        </svg>
      </span>
    );
  }

  const r = hat(khoa);
  const cuaX = 46 + Math.round(r * 22);
  return (
    <span className="mat-vat" aria-hidden="true">
      <svg viewBox="0 0 104 64" preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="0" width="104" height="64" fill="var(--canh-1)" />
        <rect x="0" y="40" width="104" height="24" fill="var(--canh-3)" />
        <rect x={cuaX} y="8" width="38" height="32" fill="var(--canh-6)" opacity=".26" />
        <rect x="12" y="28" width="34" height="14" rx="2" fill="var(--canh-2)" />
        <ellipse cx={cuaX - 14} cy="16" rx="9" ry="3" fill="var(--canh-5)" />
      </svg>
    </span>
  );
}

/**
 * CẠNH BẢNG VẬT LIỆU — nửa phải của thân bậc 1 khi vật là một bảng mẫu.
 * Port từ `mock-home-lock-co-viec.html`: mẫu đang xem (khổ lớn, có vân) + bộ hoàn thiện + hai
 * dòng chữ có nguồn. Chữ nằm trên `--nen-sang` nên **máy đo được** — đó là chỗ khác H1.
 */
export function CanhBangVatLieu({ ma, boMau }: { ma: string; boMau: readonly string[] }) {
  return (
    <div className="canh-vl">
      <svg viewBox="0 0 300 370" preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="0" width="300" height="370" fill="var(--nen-sang)" />
        <rect x="30" y="26" width="240" height="126" rx="4" fill="var(--vl-go)" />
        <g stroke="var(--muc)" strokeWidth="1" opacity=".14">
          <path d="M30 52h240M30 78h240M30 104h240M30 130h240" />
        </g>
        <rect x="30" y="26" width="240" height="126" rx="4" fill="none" stroke="var(--net-sang)" strokeWidth="2" />
        <text x="30" y="176" fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--muc-2)">
          {ma} · đang xem
        </text>
        {boMau.slice(0, 3).map((c, i) => (
          <rect key={i} x={30 + i * 83} y="196" width="74" height="52" rx="4" fill={c} />
        ))}
        <text x="30" y="272" fontFamily="-apple-system,Segoe UI,sans-serif" fontSize="12" fontWeight="600" fill="var(--muc)">
          Bộ hoàn thiện · phòng khách
        </text>
        <text x="30" y="294" fontFamily="-apple-system,Segoe UI,sans-serif" fontSize="11.5" fill="var(--muc-2)">
          Khớp thẻ DNA “Trầm · gỗ sồi”
        </text>
        <line x1="30" y1="314" x2="270" y2="314" stroke="var(--net-sang)" strokeWidth="1" />
        <text x="30" y="336" fontFamily="ui-monospace,Menlo,monospace" fontSize="11" fill="var(--muc-2)">
          4 trong 5 mảng đã khoá
        </text>
      </svg>
    </div>
  );
}

/**
 * KHUNG PHỐI CẢNH — nửa trái của thân bậc 1 khi vật là một mẻ render.
 * Port từ `mock-home-lock-day-du.html`. Nền nội dung TỐI: chứng minh bậc 1 KHÔNG mặc định
 * là một loại vật, và KHÔNG mặc định là mặt bằng 2D.
 */
export function KhungPhoiCanh() {
  return (
    <div className="khung-anh">
      <svg viewBox="0 0 700 370" preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="0" width="700" height="370" fill="var(--canh-0)" />
        <rect x="0" y="0" width="700" height="250" fill="var(--canh-1)" />
        <rect x="0" y="250" width="700" height="120" fill="var(--canh-2)" />
        <rect x="0" y="250" width="700" height="2" fill="var(--canh-4)" opacity=".5" />
        <rect x="392" y="26" width="270" height="224" fill="var(--canh-0)" />
        <g fill="var(--canh-4)" opacity=".45">
          <rect x="410" y="120" width="30" height="130" />
          <rect x="452" y="86" width="24" height="164" />
          <rect x="490" y="138" width="34" height="112" />
          <rect x="540" y="102" width="26" height="148" />
          <rect x="580" y="146" width="40" height="104" />
        </g>
        <rect x="392" y="26" width="270" height="224" fill="none" stroke="var(--canh-3)" strokeWidth="2" />
        <rect x="70" y="222" width="250" height="14" rx="4" fill="var(--canh-5)" />
        <rect x="84" y="236" width="9" height="46" fill="var(--canh-3)" />
        <rect x="298" y="236" width="9" height="46" fill="var(--canh-3)" />
        <rect x="118" y="196" width="44" height="86" rx="6" fill="var(--canh-3)" />
        <rect x="182" y="196" width="44" height="86" rx="6" fill="var(--canh-3)" />
        <rect x="246" y="196" width="44" height="86" rx="6" fill="var(--canh-3)" />
        <line x1="196" y1="0" x2="196" y2="96" stroke="var(--canh-3)" strokeWidth="1.4" />
        <ellipse cx="196" cy="104" rx="34" ry="10" fill="var(--canh-6)" opacity=".8" />
        <ellipse cx="196" cy="150" rx="86" ry="30" fill="var(--canh-6)" opacity=".13" />
      </svg>
    </div>
  );
}
