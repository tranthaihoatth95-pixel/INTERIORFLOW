'use client';

/**
 * components/ui/LightBar.tsx — [marker: LightBar] THANH tiến trình dùng chung.
 *
 * Mặt tiền thứ hai của lõi `lib/ui/tien-trinh.ts` ([marker: tienTrinh]) — `LightArc` là mặt
 * tiền VÒNG CUNG, file này là mặt tiền THANH. Cùng một lõi, cấm đẻ logic thứ hai ([T2]).
 *
 * ── VÌ SAO CÓ FILE NÀY (Hoà chốt 16/08) ────────────────────────────────────────────────────
 *   "Cái gì đang chạy cũng phải có thanh thể hiện tiến trình, thanh đó là cái mà người dùng
 *    hay nhìn chăm chăm vào nên phải có hiệu ứng, cảm giác light nhẹ, fast."
 *   KTS chạy render / xuất PDF / gọi AI rồi NGỒI NHÌN. Không có thanh thì họ đoán, đoán sai
 *   thì bấm lại — sinh job trùng, tốn credit thật.
 *
 * ── HAI LOẠI, NHÌN LÀ PHÂN BIỆT ĐƯỢC (không cần đọc chữ) ───────────────────────────────────
 *   ĐO ĐƯỢC     → **đơn vị ĐẾM ĐƯỢC**: dãy vạch rời, sáng dần từ trái, có ĐIỂM SÁNG ĐẦU MÚT
 *                 nói *đang ở đâu*, kèm % (số thật).
 *   KHÔNG ĐO ĐƯỢC → **rai KHÔNG ĐẾM ĐƯỢC**: một dải vạch mảnh liền, thấp hơn, không mốc
 *                 đầu-cuối, có cụm sáng trôi ngang. **Tuyệt đối không có con số nào.**
 *   Khác nhau ở HÌNH THÁI (đếm được ↔ không đếm được), không phải ở chỗ "cùng thanh nhưng
 *   giấu số" — nên giảm chuyển động vẫn phân biệt được.
 *
 * ⛔ CẤM BỊA PHẦN TRĂM. Nơi gọi KHÔNG có số thật thì **đừng truyền `value`** (để trống) —
 *   chứ không phải truyền một số đoán. Union `TienTrinh` của lõi khiến việc lỡ tay in số ở
 *   nhánh không-đo-được không biên dịch được. `conLai` (thời gian còn lại) chỉ hiện khi NƠI
 *   GỌI có sẵn con số đó; component KHÔNG tự ước lượng.
 *
 * ── PHÂN VAI với VIỀN CHẠY (ba tầng ánh sáng, chốt 16/08) ───────────────────────────────────
 *   ② viền sáng ĐỨNG YÊN = "bấm được"      ③ viền CHẠY vòng = "card này đang chạy" (nhìn TỪ XA)
 *   Thanh này = "còn bao lâu nữa" (nhìn GẦN). Một card đang render có CẢ ③ lẫn thanh này và
 *   không đánh nhau — khác chỗ đứng (viền ↔ trong ruột) và khác việc.
 *
 * ── GIẢM CHUYỂN ĐỘNG ───────────────────────────────────────────────────────────────────────
 *   `prefers-reduced-motion` ⇒ cụm trôi vô hạn là thứ ĐẦU TIÊN tắt: rai sáng đều một mức
 *   (nghĩa "đang chạy, chưa biết tới đâu" — không phải "đứng lại ở chỗ X"). Loại đo được bỏ
 *   transition, nhảy thẳng tới đúng %.
 */

import { useId, useRef } from 'react';
import { useT } from '@/lib/i18n';
import {
  ariaTienTrinh,
  chiaVach,
  cuongDoVach,
  doDaiVet,
  phanTramHienThi,
  tuPhanTram,
  VET_NGAN_NHAT,
  type TienTrinh,
} from '@/lib/ui/tien-trinh';

/* ── VỆT SÁNG: hai hằng số quyết định "sáng tới đâu" ─────────────────────────────────────────
   PHA_NEN  — mức pha của phần ĐÃ CHẠY đã nguội. Không để 0: ở nền tối, `--accent` trần chỉ được
              2,64:1 so vạch tắt, dưới ngưỡng 3:1 (WCAG 1.4.11). Nhấc nền lên là phần đã chạy
              tự đủ tương phản BẰNG MÀU, không phải chỉ nhờ kênh chiều cao.
   PHA_THEM — pha cộng thêm ở đúng đầu mút. Tổng trần ~46%: quá nữa thì mút bạc màu, mất luôn
              nhận diện màu nhấn.
   ⚠️ Pha về `var(--t1)` (màu MỰC của theme), KHÔNG pha về trắng. Nền tối `--t1` gần trắng ⇒ mút
   SÁNG lên; nền sáng `--t1` gần đen ⇒ mút ĐẬM lên. Cả hai chiều đều là TĂNG TƯƠNG PHẢN với nền —
   pha về trắng thì nền sáng sẽ mất chữ. Cảm giác "phát sáng" ở nền sáng do QUẦNG màu nhấn gánh.
   Và vì chỉ gọi token, hiệu ứng đúng bất kể màu nhấn thứ hai chốt hex nào. */
const PHA_NEN = 16;
const PHA_THEM = 30;

export interface LightBarProps {
  /**
   * Phần trăm 0–100 — **chỉ truyền khi có SỐ THẬT**.
   * Bỏ trống (undefined) = việc không đo được ⇒ thanh đổi sang hình thái không-đếm-được và
   * KHÔNG hiện con số nào. Đây là cửa duy nhất để khai "chưa biết tới đâu".
   */
  value?: number;
  /**
   * Số vạch của loại đo được. Mặc định 48 — đo trên thanh ~520px cho vạch rộng 5px, cách nhau
   * ~6px: đọc ra **VẠCH**, không ra **KHỐI** (32 vạch trên cùng bề rộng cho vạch 13px, rộng hơn
   * cả chiều cao — sai cảm giác "nhẹ · nhanh" Hoà mô tả).
   * ⚠️ Thanh HẸP (dưới ~260px) thì hạ số này xuống, kẻo vạch mảnh tới mức mất nét.
   */
  soVach?: number;
  /** Chiều cao vạch (px). Mặc định 10. */
  height?: number;
  /** Bề rộng thanh. Mặc định `100%`. */
  width?: number | string;
  state?: 'normal' | 'warn';
  /** Nhãn cho trình đọc màn hình — nói rõ VIỆC GÌ đang chạy. Mặc định song ngữ VI/EN. */
  label?: string;
  /** Hiện % bên phải. Chỉ có tác dụng khi đo được; mặc định bật. */
  hienSo?: boolean;
  /**
   * Thời gian còn lại đã được NƠI GỌI tính sẵn (vd `"còn 2 phút"`).
   * Bỏ qua khi không đo được. Component **không tự suy ra ETA** — xem lõi, mục ⑤.
   */
  conLai?: string;
  /** Trạng thái kết thúc. Luôn kèm CHỮ + HÌNH, màu không phải kênh duy nhất. */
  ket?: 'xong' | 'loi';
  /** Chữ đi kèm trạng thái kết thúc. Mặc định song ngữ VI/EN. */
  ketLabel?: string;
  /**
   * **Nấc giảm chói** (NT-16 — bài học iOS 27 tự sửa Liquid Glass vì khó đọc): `'diu'` hạ quầng
   * sáng và mức pha xuống một nửa, giữ nguyên MỌI kênh thông tin (bậc chiều cao · vị trí mút ·
   * hướng vệt). Độ đọc thắng độ đẹp — hạ chói không được làm mất tin.
   * ⚠️ Đây mới là nấc ở CẤP COMPONENT. Công tắc cấp app chưa có và **không thuộc phiếu này** —
   * nơi gọi tự truyền, hoặc chờ đợt NT-16 làm công tắc chung. Không dựng nút giả.
   */
  doSang?: 'day' | 'diu';
}

export default function LightBar({
  value,
  soVach = 48,
  height = 10,
  width = '100%',
  state = 'normal',
  label,
  hienSo = true,
  conLai,
  ket,
  ketLabel,
  doSang = 'day',
}: LightBarProps) {
  const tr = useT();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const tt: TienTrinh = tuPhanTram(value);
  const mau = state === 'warn' ? 'var(--accent-warm)' : 'var(--accent)';
  const nhan = label ?? tr('Tiến trình', 'Progress');
  const aria = ariaTienTrinh(tt, nhan);

  const n = Math.max(1, Math.floor(soVach));
  const { soVachSang, viTriMut } = chiaVach(tt, n);

  /* ── ĐO TỐC ĐỘ để suy độ dài vệt (tin ③ "nhanh hay chậm") ──────────────────────────────────
     Giữ lần đọc trước trong ref rồi so với lần này. Đây là ĐO THẬT giữa hai mốc, không phải một
     hằng số cho đẹp — cùng tinh thần "không có số thì đừng bịa" của cả file. Lần đầu, hoặc lùi
     lại, hoặc không đo được ⇒ `doDaiVet` trả vệt ngắn nhất chứ không đoán một độ dài. */
  const truoc = useRef<{ pct: number; t: number } | null>(null);
  let vet = VET_NGAN_NHAT;
  if (tt.doDuoc) {
    const bayGio = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const cu = truoc.current;
    if (cu) vet = doDaiVet(tt.pct - cu.pct, bayGio - cu.t, n);
    if (!cu || tt.pct !== cu.pct) truoc.current = { pct: tt.pct, t: bayGio };
  } else {
    truoc.current = null;
  }

  const heSoChoi = doSang === 'diu' ? 0.5 : 1;
  /**
   * Màu một vạch theo cường độ vệt 0..1 — pha về `--t1`, xem ghi chú PHA_NEN/PHA_THEM.
   * ⚠️ Nấc giảm chói **CHỈ hạ phần PHA_THEM và quầng sáng, KHÔNG hạ PHA_NEN**. PHA_NEN có mặt vì
   * ĐỘ ĐỌC (nó là thứ kéo tương phản vạch-đã-chạy ↔ vạch-tắt lên trên ngưỡng 3:1 ở nền tối);
   * hạ nó theo là lấy mất chính cái mà nấc giảm chói phải bảo vệ. **Giảm chói cắt ÁNH KIM,
   * không bao giờ cắt ĐỘ ĐỌC.**
   */
  const mauVach = (cuong: number) =>
    `color-mix(in oklab, ${mau}, var(--t1) ${PHA_NEN + PHA_THEM * cuong * heSoChoi}%)`;
  const so = hienSo ? phanTramHienThi(tt) : null; // null khi không đo được ⇒ không có gì để in
  const troiName = `iflb-troi-${uid}`;

  const chuKet =
    ket === 'xong'
      ? (ketLabel ?? tr('Xong', 'Done'))
      : ket === 'loi'
        ? (ketLabel ?? tr('Lỗi', 'Failed'))
        : null;

  return (
    <span
      {...aria}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        width,
        fontSize: 'var(--fs-2xs, 11px)',
        lineHeight: 1.5,
      }}
    >
      {/* keyframes cục bộ theo instance — không đụng app/globals.css (2 phiên khác đang chạy
          song song trong cùng cây làm việc), và tự tắt khi người dùng giảm chuyển động.
          ⚠️ Bản TĨNH phải SÁNG ĐÚNG MỨC, không được thành xám xịt: rai sáng đều trên toàn dải
          (nghĩa "đang chạy, chưa biết tới đâu"), GỠ mặt nạ chuyển sắc — giữ mặt nạ thì nửa trái
          tắt ngóm, đọc nhầm thành "đứng ở chỗ X". Và cấm nhấp nháy: chỉ có một trạng thái tĩnh. */}
      <style>{`
        @keyframes ${troiName} { from { transform: translateX(-115%); } to { transform: translateX(760%); } }
        @media (prefers-reduced-motion: reduce) {
          .iflb-${uid}-troi { animation: none !important; transform: none !important;
            left: 0 !important; right: 0 !important; width: auto !important; opacity: .78 !important;
            -webkit-mask-image: none !important; mask-image: none !important; }
          .iflb-${uid}-vach { transition: none !important; }
        }
      `}</style>

      {tt.doDuoc ? (
        /* ── ĐO ĐƯỢC — dãy vạch ĐẾM ĐƯỢC, sáng dần từ trái, điểm sáng ở đầu mút ───────────── */
        <span
          aria-hidden
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            // Khe theo TỈ LỆ, không theo px cố định. Khe 3px cứng × 47 khe = 141px — thanh hẹp
            // 160px sẽ TRÀN. Khe % co theo bề rộng nên một component chạy đúng ở mọi khổ.
            gap: '1.2%',
            flex: 1,
            height,
            minWidth: 0,
            // Chốt chặn cuối: khai `soVach` quá dày cho một thanh hẹp thì vạch mờ đi, KHÔNG
            // đẩy vỡ khổ hàng bên cạnh. Hỏng thì hỏng ở chính nó, không lây.
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: n }, (_, i) => {
            const sang = i < soVachSang;
            const mut = i === viTriMut;
            // Cường độ vệt 0..1 — 1 ở đúng mút, nguội dần về sau, 0 ở phần đã chạy xong lâu.
            const cuong = sang ? cuongDoVach(i, viTriMut, vet) : 0;
            // Quầng sáng chỉ ở vùng vệt, bán kính ≤7px. CỐ Ý giữ nhỏ: quầng to lan ra sẽ đọc
            // nhầm thành tầng ② (hover) hoặc ③ (viền card đang chạy) — ba tầng phải không lẫn.
            const banKinh = cuong * 7 * heSoChoi;
            return (
              <i
                key={i}
                className={`iflb-${uid}-vach`}
                style={{
                  flex: '1 1 0',
                  minWidth: 0,
                  // Chặn trần bề rộng: thanh rộng thì vạch KHÔNG phình thành khối; phần dư
                  // được `justify-content: space-between` rải đều thành khe. Nhờ vậy một
                  // component chạy đúng ở cả thanh 160px lẫn thanh 900px.
                  maxWidth: 5,
                  height: '100%',
                  borderRadius: 'var(--r-full)',
                  // Vạch chưa chạy: màu viền. Vạch đã chạy: pha theo CƯỜNG ĐỘ VỆT — chói nhất ở
                  // mút, nguội dần về sau. Ánh sáng vì thế nói được ba tin (đang ở đâu · đi hướng
                  // nào · nhanh hay chậm), không phải một vệt cho đẹp — luật NT-11/LightState.
                  background: sang ? mauVach(cuong) : 'var(--border)',
                  opacity: sang ? 1 : 0.75,
                  // Quầng sáng GIÃN THEO cường độ: mút có quầng đầy, vạch nguội gần như không có.
                  // Đây là chỗ "thêm sáng" của Hoà nằm — và nó tắt hẳn khi xong (cuong = 0 cả dãy).
                  filter: banKinh > 0.4 ? `drop-shadow(0 0 ${banKinh.toFixed(1)}px ${mau})` : undefined,
                  // ⭐ RANH GIỚI ĐÃ-CHẠY/CHƯA-CHẠY NÓI BẰNG CẢ CHIỀU CAO, KHÔNG CHỈ BẰNG MÀU.
                  //   Đo 16/08 ở theme tối: vạch sáng (--accent) so vạch tắt (--border) chỉ được
                  //   2,64:1 — DƯỚI ngưỡng 3:1 của WCAG 1.4.11 cho hình đồ hoạ mang thông tin.
                  //   Thêm bậc chiều cao (tắt .62 → sáng 1 → mút 1.28) làm kênh thứ hai: đọc được
                  //   cả khi in đen trắng, cả với người mù màu, và KHÔNG phụ thuộc hex của màu
                  //   nhấn (màu nhấn thứ hai còn đang chờ chốt — sửa hex thì thanh vẫn đúng).
                  transform: mut ? 'scaleY(1.28)' : sang ? undefined : 'scaleY(.62)',
                  transformOrigin: '50% 100%',
                  transition:
                    'background var(--nhip-bang) var(--ease-apple, ease), transform var(--nhip-bang) var(--ease-apple, ease)',
                  display: 'block',
                }}
              />
            );
          })}
        </span>
      ) : (
        /* ── KHÔNG ĐO ĐƯỢC — rai KHÔNG ĐẾM ĐƯỢC, thấp hơn, không mốc đầu-cuối ──────────────
           Vạch vẽ bằng gradient lặp (không phải phần tử rời) — CỐ Ý: không có gì để đếm thì
           không bày ra đơn vị để đếm. Cụm sáng trôi ngang, ra khỏi mép rồi vào lại ⇒ mắt
           không tìm thấy điểm bắt đầu hay kết thúc. */
        <span
          aria-hidden
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: Math.max(3, Math.round(height * 0.55)),
            borderRadius: 'var(--r-full)',
            overflow: 'hidden',
            background:
              'repeating-linear-gradient(90deg, var(--border) 0 2px, transparent 2px 5px)',
            opacity: 0.9,
          }}
        >
          {/* Cụm trôi dùng CHUNG NGÔN NGỮ ÁNH SÁNG với loại đo được: chói ở MÉP DẪN ĐẦU (phải),
              nhạt dần về đuôi. Nhờ vậy hai loại nói cùng một thứ tiếng về ánh sáng trong khi
              vẫn khác hẳn nhau về HÌNH THÁI — kênh phân biệt chính không bị đụng tới. */}
          <i
            className={`iflb-${uid}-troi`}
            style={{
              position: 'absolute',
              inset: '0 auto 0 0',
              width: '18%',
              display: 'block',
              background: `repeating-linear-gradient(90deg, ${mauVach(1)} 0 2px, transparent 2px 5px)`,
              WebkitMaskImage:
                'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.45) 45%, #000 100%)',
              maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.45) 45%, #000 100%)',
              filter: `drop-shadow(0 0 ${(6 * heSoChoi).toFixed(1)}px ${mau})`,
              animation: `${troiName} 1.5s linear infinite`,
            }}
          />
        </span>
      )}

      {/* Bên phải: SỐ chỉ có ở loại đo được. Không đo được ⇒ khe này trống hoàn toàn. */}
      {so && (
        <span
          style={{
            color: 'var(--t2)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 'var(--fw-semi, 600)',
            flex: 'none',
          }}
        >
          {so}
        </span>
      )}
      {tt.doDuoc && conLai && (
        <span style={{ color: 'var(--t3)', fontVariantNumeric: 'tabular-nums', flex: 'none' }}>
          {conLai}
        </span>
      )}

      {/* Kết thúc: MÀU + HÌNH + CHỮ — màu không bao giờ là kênh duy nhất. */}
      {chuKet && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flex: 'none',
            color: ket === 'loi' ? 'var(--danger)' : 'var(--success)',
            fontWeight: 'var(--fw-semi, 600)',
          }}
        >
          <svg width={11} height={11} viewBox="0 0 12 12" aria-hidden style={{ display: 'block' }}>
            {ket === 'loi' ? (
              // hình chữ thập — khác hẳn dấu tích về HÌNH DẠNG, không chỉ khác màu
              <path
                d="M3 3l6 6M9 3l-6 6"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d="M2.5 6.4l2.4 2.4L9.5 3.6"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </svg>
          {chuKet}
        </span>
      )}
    </span>
  );
}
