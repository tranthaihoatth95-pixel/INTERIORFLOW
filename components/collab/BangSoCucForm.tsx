'use client';

/**
 * components/collab/BangSoCucForm.tsx — **Khuôn 2** của Cửa Sổ Thảo Luận: Bảng So Cực.
 *
 * ⭐ VÌ SAO KHUÔN NÀY XỨNG CÓ (NC-COLLAB-CHANG-3D.md Câu 2, đo lại 17/08 trước khi code): KTS
 * **không tự viết** ra gu bằng chữ. Bắt gu bằng cách bấm CỰC (tối giản ↔ ấm áp · kín ↔ mở) rẻ
 * hơn viết luận vài lần: một cái là gõ, một cái là kéo. Đầu ra nuôi Thẻ DNA lớp
 * `ngonNguKhongGian` (`lib/dna/distiller.ts:78` cố ý bỏ trống ở rule-based, chờ nguồn khác điền).
 *
 * ⛔ **KHÔNG có nguồn nào cho *"6 hàng chuẩn"* — nội thất không có bảng ISO cho việc này.** Sáu
 * hàng dưới là **đề xuất KHỞI**, khai rõ để phiên sau không tưởng là chuẩn ngành: chúng gộp từ
 * cặp cực thường thấy trong ngôn ngữ mô tả không gian nội thất (mộc/tinh · kín/mở · nguội/ấm ·
 * trơn/nhịp · sáng/tối · đơn/phong phú). Có nguồn nghề chuẩn hơn thì sửa ở MỘT chỗ này.
 *
 * ⭐ THIẾT KẾ THANG −3..+3 (bảy nấc, có nấc GIỮA = 0):
 *  · Nấc lẻ vì phải có nấc *"không nghiêng bên nào"* — nội thất không phải luôn đứng về một cực.
 *  · Bảy nấc vì năm quá ít (không đủ diễn tả *"hơi ấm"* vs *"rất ấm"*), chín quá nhiều (mắt
 *    KTS không phân biệt được nấc gần nhau khi bấm nhanh).
 *  · KHÔNG dùng thanh trượt liên tục (0..100): mỗi lần bấm ra một con số khác, không lặp lại
 *    được, và distiller phải bịa ngưỡng đóng khung. Bảy nấc rời rạc thì mỗi nấc có nghĩa.
 *
 * ⭐ RANH GIỚI PHIẾU VO — form này TRẢ VỀ giá trị qua `onChange`, KHÔNG gọi thẳng `distill`.
 * Việc gọi distiller là của LOI (phiếu song song). VO dựng vỏ; lõi ở tệp khác.
 */

import { useCallback } from 'react';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';

/**
 * Một hàng trong bảng — nhãn hai cực (nhớ song ngữ) và giá trị hiện tại. Không có id: hàng khai
 * tĩnh ở đây, không cho người dùng tự thêm/xoá (giữ bảng ngắn). Nếu sau này cho phép custom thì
 * tự có id qua slug từ nhãn — nhưng lúc đó phải làm luôn migration `lib/distill`, ngoài phạm vi VO.
 */
export interface HangSoCuc {
  /** id kỹ thuật để nơi khác đọc kết quả — song song với `label`. */
  id: string;
  cucTrai: { vi: string; en: string };
  cucPhai: { vi: string; en: string };
}

/**
 * BẢNG KHỞI 6 HÀNG — sửa ở đây thì mọi cửa sổ có Bảng so cực đổi theo.
 * Đặt ngoài component để không tạo mới mỗi lần render (React key ổn định).
 */
export const HANG_SO_CUC_KHOI: readonly HangSoCuc[] = [
  { id: 'toi-gian-vs-phong-phu', cucTrai: { vi: 'Tối giản', en: 'Minimal' }, cucPhai: { vi: 'Phong phú', en: 'Rich' } },
  { id: 'kin-vs-mo', cucTrai: { vi: 'Kín', en: 'Enclosed' }, cucPhai: { vi: 'Mở', en: 'Open' } },
  { id: 'nguoi-vs-am', cucTrai: { vi: 'Nguội', en: 'Cool' }, cucPhai: { vi: 'Ấm', en: 'Warm' } },
  { id: 'tron-vs-nhip', cucTrai: { vi: 'Trơn', en: 'Smooth' }, cucPhai: { vi: 'Có nhịp', en: 'Rhythmic' } },
  { id: 'toi-vs-sang', cucTrai: { vi: 'Tối', en: 'Dark' }, cucPhai: { vi: 'Sáng', en: 'Bright' } },
  { id: 'don-sac-vs-nhieu-sac', cucTrai: { vi: 'Đơn sắc', en: 'Monotone' }, cucPhai: { vi: 'Nhiều sắc', en: 'Polychrome' } },
] as const;

/** Nấc giá trị hợp lệ — hằng số để test canh: đổi số nấc phải đổi Ở ĐÂY, không rải rác. */
export const NAC_MIN = -3;
export const NAC_MAX = 3;

/** Kết quả một hàng — id + giá trị. `null` = chưa bấm (khác 0 = *"cân bằng"* — có ý). */
export interface KetQuaSoCuc {
  id: string;
  giaTri: number | null;
}

/**
 * Chuyển bảng giá trị hiện tại thành mảng — hàm thuần, dùng được ở test/distiller.
 * KHÔNG đọc gì ngoài `giaTriTheoId` ⇒ dễ tái dùng.
 */
export function ketQuaBangSoCuc(giaTriTheoId: Record<string, number | null>): KetQuaSoCuc[] {
  return HANG_SO_CUC_KHOI.map((h) => ({ id: h.id, giaTri: giaTriTheoId[h.id] ?? null }));
}

export interface BangSoCucFormProps {
  /** Bảng khai, mặc định 6 hàng khởi. Cho ghi đè để dựng bảng riêng theo dự án về sau. */
  hang?: readonly HangSoCuc[];
  /** Giá trị hiện tại (controlled) — parent giữ state. */
  giaTri: Record<string, number | null>;
  onDoi: (giaTriMoi: Record<string, number | null>) => void;
}

export function BangSoCucForm({ hang = HANG_SO_CUC_KHOI, giaTri, onDoi }: BangSoCucFormProps) {
  const tr = useT();

  const doiMotHang = useCallback(
    (id: string, giaTriMoi: number) => {
      onDoi({ ...giaTri, [id]: giaTriMoi });
    },
    [giaTri, onDoi],
  );

  const soHangDaBam = hang.filter((h) => giaTri[h.id] !== null && giaTri[h.id] !== undefined).length;

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p
        style={{
          fontSize: 11,
          color: 'var(--t4)',
          margin: '0 0 8px',
          lineHeight: 1.5,
        }}
      >
        {tr(
          'Bấm nấc giữa hai cực. Kéo mũi tên hoặc bấm số 1–7. Cân bằng = nấc giữa.',
          'Tap the notch between two poles. Arrow keys or number 1–7. Balance = middle notch.',
        )}
      </p>

      {hang.map((h) => (
        <HangSlider key={h.id} hang={h} giaTri={giaTri[h.id] ?? null} onDoi={(v) => doiMotHang(h.id, v)} />
      ))}

      <p style={{ fontSize: 11, color: 'var(--t4)', margin: '8px 0 0' }}>
        {tr(`Đã bấm ${soHangDaBam}/${hang.length} hàng`, `${soHangDaBam}/${hang.length} rows set`)}
      </p>
    </div>
  );
}

/**
 * Một hàng — hai nhãn cực + 7 nấc (radio). Dùng `role="radiogroup"` để trình đọc màn hình đọc
 * đúng "một trong bảy", không phải một mớ nút rời (§Đ3 bàn phím = chuột).
 * Không dùng `<input type="range">`: range có bước liên tục và số hiện, mà ở đây nấc rời rạc và
 * *"số nấc"* không mang nghĩa (số 4 không có nghĩa hơn số 3) — radio đúng ngữ nghĩa hơn.
 */
function HangSlider({ hang, giaTri, onDoi }: { hang: HangSoCuc; giaTri: number | null; onDoi: (v: number) => void }) {
  const tr = useT();
  const nacs = Array.from({ length: NAC_MAX - NAC_MIN + 1 }, (_, i) => NAC_MIN + i);

  // Bàn phím = chuột (WCAG 2.1.1 + chuẩn ARIA radiogroup): mũi tên trái/phải chuyển giữa các
  // nấc, Home/End nhảy đầu/cuối. Không có handler này thì Tab qua từng radio (7 × 6 = 42 lần
  // Tab một bảng) — vi phạm 2.4.3 focus order thực dụng và làm form không dùng nổi bằng phím.
  const doiTheoPhim = (e: React.KeyboardEvent) => {
    const hienTai = giaTri ?? 0;
    let moi: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') moi = Math.max(NAC_MIN, hienTai - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') moi = Math.min(NAC_MAX, hienTai + 1);
    else if (e.key === 'Home') moi = NAC_MIN;
    else if (e.key === 'End') moi = NAC_MAX;
    if (moi !== null) {
      e.preventDefault();
      onDoi(moi);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={tr(`${hang.cucTrai.vi} tới ${hang.cucPhai.vi}`, `${hang.cucTrai.en} to ${hang.cucPhai.en}`)}
      onKeyDown={doiTheoPhim}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}
    >
      <span
        style={{
          fontSize: 12,
          color: 'var(--t3)',
          width: 80,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {tr(hang.cucTrai.vi, hang.cucTrai.en)}
      </span>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        {nacs.map((v) => {
          const isMid = v === 0;
          const chon = giaTri === v;
          const nhan = isMid
            ? tr('Cân bằng — không nghiêng bên nào', 'Balanced — neither side')
            : v < 0
              ? tr(`${hang.cucTrai.vi} · nấc ${Math.abs(v)}`, `${hang.cucTrai.en} · notch ${Math.abs(v)}`)
              : tr(`${hang.cucPhai.vi} · nấc ${v}`, `${hang.cucPhai.en} · notch ${v}`);
          return (
            // Chấm nhìn thấy 10–14px, nhưng vùng chạm THẬT 24px — cảm ứng bấm trúng, không lỗ
            // giữa các nấc. Button ôm ngoài (aria + hit area); chấm màu là `<span aria-hidden>`.
            // `title` bỏ đi (câm trên cảm ứng); `aria-label` thay thế, trình đọc màn hình đọc.
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={chon}
              aria-label={nhan}
              onClick={() => onDoi(v)}
              style={{
                width: 24,
                height: 24,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-grid',
                placeItems: 'center',
                borderRadius: RADIUS.full,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: chon ? 14 : 10,
                  height: chon ? 14 : 10,
                  borderRadius: RADIUS.full,
                  border: chon ? '2px solid var(--accent)' : '1px solid var(--border-strong)',
                  background: chon
                    ? 'var(--accent)'
                    : isMid
                      ? 'var(--field)'
                      : 'transparent',
                  transition: 'width var(--nhip-bam) ease, height var(--nhip-bam) ease, background var(--nhip-bam) ease',
                }}
              />
            </button>
          );
        })}
      </div>
      <span
        style={{
          fontSize: 12,
          color: 'var(--t3)',
          width: 80,
          flexShrink: 0,
        }}
      >
        {tr(hang.cucPhai.vi, hang.cucPhai.en)}
      </span>
    </div>
  );
}
