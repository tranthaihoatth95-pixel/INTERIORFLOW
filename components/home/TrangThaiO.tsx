'use client';

/**
 * components/home/TrangThaiO.tsx — [marker: bonTrangThai] BỐN trạng thái NHÌN LÀ PHÂN BIỆT ĐƯỢC.
 *
 * Cặp với máy trạng thái thuần `lib/home/trang-thai.ts` (nó QUYẾT ĐỊNH, file này BÀY RA).
 *
 * ⭐ LUẬT NỀN CỦA FILE NÀY — mỗi trạng thái khác nhau ở CÁI NÓ NÓI, không ở kích cỡ:
 *   · ĐANG TẢI   → **khung xương mang HÌNH DẠNG của thứ sắp tới** + tiến trình thật. Không
 *                  phải vòng xoay. Vòng xoay nói "đợi đi"; khung xương nói "sắp có mấy thẻ,
 *                  xếp như thế này" — người dùng bắt đầu đọc bố cục trước khi dữ liệu về.
 *   · TRỐNG      → bố cục CÓ CHỦ ĐÍCH + việc kế tiếp bấm được ngay. Trống là một trạng thái
 *                  được thiết kế, không phải phần giao diện còn thiếu.
 *   · LỖI        → LÝ DO (nói được chuyện gì hỏng) + ĐƯỜNG HỒI PHỤC (nút thật, chạy được).
 *   · NGOẠI TUYẾN→ việc CỤC BỘ nào vẫn hiểu được. Không có nút "Thử lại" — mất mạng thì bấm
 *                  lại là lời khuyên vô ích; app tự biết khi mạng về (sự kiện `online`).
 *
 * ⛔ BA RÀNG BUỘC CỨNG, giữ cả ở đây lẫn ở nơi gọi:
 *   ① LẤP ĐẦY Ô (`h-full`). Cái bị chê không phải "có khối trạng thái" mà là **một pill 44px
 *      lơ lửng giữa ô cao 400px**. Khối trạng thái phải chiếm đúng chỗ nội dung thật sẽ chiếm.
 *   ② `prefers-reduced-motion` THẮNG: tắt hẳn shimmer, thay bằng dải tĩnh + một dòng chữ —
 *      không để người bật giảm chuyển động mất luôn tín hiệu "đang chạy".
 *   ③ CẤM BỊA SỐ. Khung xương KHÔNG có phần trăm, KHÔNG có "còn X giây" — lượt tải này không
 *      đo được (luật thanh-tiến-trình 16/08: hai loại thanh, loại không đo được thì KHÔNG có
 *      số). Nó dùng dải chạy vô hạn, và ở reduce-motion thì thành dải tĩnh.
 */

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

/** Đọc `prefers-reduced-motion` — SSR-safe, mặc định "không giảm" rồi sửa lại sau khi mount. */
function useGiamChuyenDong(): boolean {
  const [giam, setGiam] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const doc = () => setGiam(mq.matches);
    doc();
    mq.addEventListener('change', doc);
    return () => mq.removeEventListener('change', doc);
  }, []);
  return giam;
}

/* ------------------------------------------------------------------ *
 * ĐANG TẢI — khung xương
 * ------------------------------------------------------------------ */

/**
 * Nền mảnh khung xương — pha từ `--t4` (màu chữ mờ) chứ KHÔNG dùng `--field`.
 *
 * Đo trên app thật, theme sáng: `--field #f4f1eb` đứng trên card `rgba(255,255,255,.82)` ⇒ hai
 * màu gần như trùng, khung xương **tàng hình** — ô đang tải đọc ra y hệt một hộp trắng rỗng,
 * tức là vẫn đúng cái bẫy phiếu cấm, chỉ đổi hình dạng. `--t4` là mực có thật ở CẢ HAI theme
 * nên pha 14% cho một dải nhìn thấy được mà không hét lên, và nó TỰ ĐẢO CỰC theo theme —
 * không phải khai hai giá trị rồi quên một bên.
 */
const XUONG: CSSProperties = {
  background: 'color-mix(in srgb, var(--t4) 14%, transparent)',
  borderRadius: 'var(--r-2)',
};

/**
 * Một mảnh khung xương. `cao` khai bằng chuỗi CSS để nơi gọi tả được hình dạng thật của thứ
 * sắp tới (thẻ dự án cao khác dòng ghi chú) — nhưng KHÔNG khai bề rộng bằng px: bề rộng do
 * lưới cha quyết (luật "widget khai theo Ô LƯỚI, cấm khai px").
 */
export function MangXuong({ cao = '100%', tron = false }: { cao?: string; tron?: boolean }) {
  return <div style={{ ...XUONG, height: cao, borderRadius: tron ? 'var(--r-full)' : 'var(--r-2)' }} aria-hidden />;
}

/**
 * KHUNG XƯƠNG lấp đầy ô, mang hình dạng của nội dung sắp tới.
 *
 * `hinh`:
 *   · `'the'`  — lưới thẻ (ô Dự án · Ảnh tuần): mấy khối chữ nhật xếp ngang.
 *   · `'dong'` — danh sách dòng (Ghi chú · Mốc sắp tới · Bảng tin).
 *
 * `nhan` là câu người đọc được, BẮT BUỘC — khung xương câm thì trình đọc màn hình không biết
 * gì đang xảy ra. Nó đi qua `aria-live="polite"` + `role="status"`.
 */
export function KhungXuong({
  hinh = 'dong',
  soMang = 3,
  nhan,
}: {
  hinh?: 'the' | 'dong';
  soMang?: number;
  nhan: string;
}) {
  const giam = useGiamChuyenDong();
  const mang = Array.from({ length: soMang });
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-[var(--gap)]" role="status" aria-live="polite">
      {/* Dải tiến trình — KHÔNG phần trăm (lượt tải này không đo được). reduce-motion ⇒ dải
          tĩnh, vẫn nhìn thấy là "đang có việc chạy", chỉ không nhấp nháy. */}
      <div
        className="h-[2px] w-full shrink-0 overflow-hidden"
        style={{ background: 'var(--vien-mo, var(--border))', borderRadius: 'var(--r-full)' }}
        aria-hidden
      >
        <div
          className={giam ? '' : 'if-xuong-chay'}
          style={{
            height: '100%',
            width: giam ? '38%' : '38%',
            background: 'var(--t4)',
            opacity: giam ? 0.55 : 0.8,
            borderRadius: 'var(--r-full)',
          }}
        />
      </div>

      {hinh === 'the' ? (
        <div className="grid min-h-0 flex-1 gap-[var(--gap)]" style={{ gridTemplateColumns: `repeat(${Math.min(soMang, 4)}, minmax(0,1fr))` }}>
          {mang.slice(0, 4).map((_, i) => (
            <MangXuong key={i} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-[var(--gap)]">
          {mang.map((_, i) => (
            <MangXuong key={i} cao="var(--row, 32px)" />
          ))}
        </div>
      )}

      <span className="sr-only">{nhan}</span>
      <p className="shrink-0 text-[length:var(--fs-2xs)] text-[var(--t4)]" aria-hidden>
        {nhan}
      </p>

      {/* Keyframes cục bộ — không đụng globals.css (vùng chung, lane khác đang giữ). Bọc trong
          media query để trình duyệt tự tắt, KHÔNG chỉ dựa vào nhánh JS ở trên (hai lớp bảo
          hiểm: JS lo bố cục, CSS lo chuyển động). */}
      <style jsx global>{`
        @keyframes ifXuongChay {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .if-xuong-chay { animation: ifXuongChay 1.35s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .if-xuong-chay { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TRỐNG · LỖI · NGOẠI TUYẾN — khối lấp đầy ô
 * ------------------------------------------------------------------ */

export interface HanhDongO {
  nhan: string;
  onClick?: () => void;
  /** Nút chính (đặc, một cái duy nhất mỗi khối) hay nút phụ (viền). */
  chinh?: boolean;
  /**
   * Lý do THẬT khiến nút chưa bấm được. Có giá trị ⇒ nút đi đường `aria-disabled` +
   * `aria-describedby` (KHÔNG dùng `disabled` + `title`): `disabled` thì Tab bỏ qua hẳn và
   * `title` câm trên cảm ứng ⇒ lý do KHÔNG BAO GIỜ tới người dùng bàn phím / trình đọc màn
   * hình. Đây là bẫy đã ghi trong sổ 16/08, không lặp lại.
   */
  lyDoMo?: string;
}

/**
 * Khối thay-cho-nội-dung, LẤP ĐẦY ô lưới cha.
 *
 * `giong` chỉ đổi ICON + màu chữ phụ, KHÔNG đổi bố cục — ba trạng thái phải đọc ra là ba
 * chuyện khác nhau nhờ CÂU CHỮ và VIỆC KẾ TIẾP, không nhờ ba kiểu trang trí.
 */
export function OTrangThai({
  bieuTuong,
  tieuDe,
  moTa,
  hanhDong = [],
  duoi,
}: {
  bieuTuong?: ReactNode;
  tieuDe: string;
  moTa: string;
  hanhDong?: HanhDongO[];
  /** Phần phụ dưới cùng — vd danh sách "việc cục bộ vẫn làm được" của trạng thái ngoại tuyến. */
  duoi?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 overflow-y-auto px-5 py-6 text-center">
      {bieuTuong && (
        <div
          className="grid h-11 w-11 shrink-0 place-items-center text-[var(--t3)]"
          style={{ background: 'var(--field, var(--panel))', border: '1px solid var(--vien-mo, var(--border))', borderRadius: 'var(--r-full)' }}
          aria-hidden
        >
          {bieuTuong}
        </div>
      )}
      <div className="max-w-[42ch]">
        <p className="text-[length:var(--fs-sm)] font-semibold text-[var(--t1)]">{tieuDe}</p>
        <p className="mt-1 text-[length:var(--fs-xs)] leading-relaxed text-[var(--t3)]">{moTa}</p>
      </div>
      {hanhDong.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hanhDong.map((h, i) => (
            <NutO key={i} {...h} />
          ))}
        </div>
      )}
      {duoi}
    </div>
  );
}

/** Nút của khối trạng thái — một chỗ duy nhất xử đường nút-mờ-có-lý-do. */
export function NutO({ nhan, onClick, chinh, lyDoMo }: HanhDongO) {
  const mo = !!lyDoMo;
  const idLyDo = mo ? `if-lydo-${nhan.replace(/\s+/g, '-').toLowerCase()}` : undefined;
  return (
    <>
      <button
        type="button"
        // `aria-disabled` chứ KHÔNG phải `disabled`: giữ nút trong luồng Tab để lý do đọc được.
        aria-disabled={mo || undefined}
        aria-describedby={idLyDo}
        onClick={mo ? undefined : onClick}
        className="rounded-[var(--r-full)] px-4 py-2 text-[length:var(--fs-xs)] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        style={{
          background: chinh ? 'var(--accent)' : 'transparent',
          // `--on-accent` (globals.css:160) là token CÓ SẴN cho chữ đứng trên nền `--accent`
          // (đo 4,89:1) — dùng nó thay vì gõ `#fff` như vài chỗ cũ trong repo.
          color: chinh ? 'var(--on-accent)' : 'var(--t1)',
          border: chinh ? '1px solid transparent' : '1px solid var(--border)',
          opacity: mo ? 'var(--mo-vo-hieu)' : undefined,
          cursor: mo ? 'not-allowed' : 'pointer',
        }}
      >
        {nhan}
      </button>
      {mo && (
        <span id={idLyDo} className="sr-only">
          {lyDoMo}
        </span>
      )}
    </>
  );
}
