'use client';

/**
 * components/collab/BaHoiStorylineForm.tsx — **Khuôn 3** của Cửa Sổ Thảo Luận: Câu Chuyện 3 Hồi.
 *
 * ⭐ VÌ SAO XỨNG CÓ (NC-COLLAB-CHANG-3D.md Câu 2 + `00-CHOT.md` [16/08 storyline dự án]):
 * Hoà đã dùng thật khuôn "storyline dự án"; nó ép ý tưởng thành **mở · xung đột · giải quyết**.
 * Nuôi Thẻ DNA lớp `yDo` (ý đồ) — `lib/dna/distiller.ts:78` cố ý bỏ trống ở rule-based **vì
 * không suy được từ ảnh**, chờ nguồn khác điền. Ba hồi CHÍNH LÀ nguồn thứ nhất cho lớp đó.
 *
 * ⭐ VÌ SAO ĐÚNG BA HỒI (không phải năm hồi, không phải hai hồi):
 *  · **Hai** thiếu — thiếu *"giữa"* (xung đột / mâu thuẫn / bước trung gian) là mất chỗ để KTS
 *    nêu ràng buộc thật của dự án (khách yêu Nhật NHƯNG bếp phải mở — mâu thuẫn thật, không
 *    phải trang trí).
 *  · **Năm** thừa — tăng chi phí điền mà không tăng thông tin. Hollywood có ba (Aristotle · Freytag),
 *    Kishōtenketsu Nhật có bốn, nhưng cả hai bộ đều gom vào MỞ · XUNG ĐỘT · GIẢI QUYẾT khi rút.
 *
 * ⭐ ẢNH MINH HOẠ MỖI HỒI LÀ TUỲ CHỌN, không bắt buộc:
 *  · Bắt buộc ảnh cho mỗi hồi ⇒ nửa phiên Hoà kẹt vì chưa có ảnh → điền không được → chuyển
 *    sang khuôn khác. Đây đúng loại rào cản "nút chặn tiến trình" mà §9 cấm ("nếu bấm không ra
 *    gì thì đừng làm nút").
 *  · Không có ảnh cũng nộp được cho distiller (LOI xử — VO chỉ trả về giá trị).
 *
 * ⭐ RANH GIỚI PHIẾU VO — form này TRẢ VỀ giá trị qua `onChange`, KHÔNG gọi thẳng `distill`.
 */

import { useCallback } from 'react';
import { useT } from '@/lib/i18n';
import { RADIUS } from '@/lib/geometry';

/**
 * Một hồi — vị trí trong ba hồi (0/1/2), tiêu đề, mô tả, ảnh (tuỳ chọn).
 * Chọn thứ tự cố định 0/1/2 chứ không cho drag re-order: mở → xung đột → giải quyết là NGỮ
 * NGHĨA cố định, không phải thứ tự tuỳ ý. Đổi thứ tự là đổi loại khuôn khác.
 */
export interface Hoi {
  vi_tri: 0 | 1 | 2;
  tieuDe: string;
  moTa: string;
  /** URL ảnh — data-URL, blob URL, hoặc http URL đều được. Rỗng = không có ảnh. */
  anhUrl?: string;
}

export const NHAN_HOI: readonly { vi: string; en: string; gợi_ý: { vi: string; en: string } }[] = [
  {
    vi: 'Mở',
    en: 'Open',
    gợi_ý: {
      vi: 'Không gian bắt đầu thế nào? Ai bước vào, cảm giác đầu tiên?',
      en: 'How does the space open? Who enters, what is the first feeling?',
    },
  },
  {
    vi: 'Xung đột',
    en: 'Tension',
    gợi_ý: {
      vi: 'Ràng buộc thật của dự án — cái khách muốn vs cái phải làm.',
      en: 'The real tension — what the client wants vs what must be done.',
    },
  },
  {
    vi: 'Giải quyết',
    en: 'Resolution',
    gợi_ý: {
      vi: 'Không gian đóng lại thế nào? Người ở lại mang theo cảm giác gì?',
      en: 'How does the space resolve? What feeling stays with the person?',
    },
  },
] as const;

/** Hồi mặc định — ba hồi rỗng, đúng thứ tự. Đặt ngoài component để React key ổn định. */
export const BA_HOI_KHOI: readonly Hoi[] = [
  { vi_tri: 0, tieuDe: '', moTa: '' },
  { vi_tri: 1, tieuDe: '', moTa: '' },
  { vi_tri: 2, tieuDe: '', moTa: '' },
] as const;

/** Kết quả một hồi để nơi khác đọc — cùng hình dạng với `Hoi`, thêm cờ `daDien` để lọc nhanh. */
export interface KetQuaHoi extends Hoi {
  daDien: boolean;
}

/**
 * Chuyển ba hồi hiện tại thành kết quả — hàm thuần, dùng được ở test/distiller.
 * `daDien = true` khi có ít nhất tiêu đề HOẶC mô tả (ảnh không đủ vì không nói được nội dung).
 */
export function ketQuaBaHoi(hoi: readonly Hoi[]): KetQuaHoi[] {
  return hoi.map((h) => ({
    ...h,
    daDien: h.tieuDe.trim().length > 0 || h.moTa.trim().length > 0,
  }));
}

export interface BaHoiStorylineFormProps {
  hoi: readonly Hoi[];
  onDoi: (hoiMoi: Hoi[]) => void;
}

export function BaHoiStorylineForm({ hoi, onDoi }: BaHoiStorylineFormProps) {
  const tr = useT();

  const doiMotHoi = useCallback(
    (vi_tri: 0 | 1 | 2, patch: Partial<Hoi>) => {
      const moi: Hoi[] = hoi.map((h) => (h.vi_tri === vi_tri ? { ...h, ...patch } : h));
      onDoi(moi);
    },
    [hoi, onDoi],
  );

  const soDaDien = ketQuaBaHoi(hoi).filter((h) => h.daDien).length;

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0, lineHeight: 1.5 }}>
        {tr(
          'Ba hồi cố định: Mở · Xung đột · Giải quyết. Ảnh mỗi hồi là tuỳ chọn.',
          'Three fixed acts: Open · Tension · Resolution. Image per act is optional.',
        )}
      </p>

      {hoi.map((h) => {
        const nhan = NHAN_HOI[h.vi_tri];
        return (
          <fieldset
            key={h.vi_tri}
            style={{
              border: '1px solid var(--border)',
              borderRadius: RADIUS.r2,
              padding: 10,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--card)',
            }}
          >
            <legend
              style={{
                padding: '0 6px',
                fontSize: 11,
                color: 'var(--t3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {tr(`Hồi ${h.vi_tri + 1} · ${nhan.vi}`, `Act ${h.vi_tri + 1} · ${nhan.en}`)}
            </legend>

            <input
              type="text"
              value={h.tieuDe}
              onChange={(e) => doiMotHoi(h.vi_tri, { tieuDe: e.target.value })}
              placeholder={tr(`Tiêu đề hồi ${h.vi_tri + 1}…`, `Act ${h.vi_tri + 1} title…`)}
              aria-label={tr(`Tiêu đề hồi ${h.vi_tri + 1}`, `Act ${h.vi_tri + 1} title`)}
              style={{
                fontSize: 13,
                padding: '6px 8px',
                borderRadius: RADIUS.r1,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t1)',
                outline: 'none',
                width: '100%',
              }}
            />
            <textarea
              value={h.moTa}
              onChange={(e) => doiMotHoi(h.vi_tri, { moTa: e.target.value })}
              placeholder={tr(nhan.gợi_ý.vi, nhan.gợi_ý.en)}
              rows={3}
              aria-label={tr(`Mô tả hồi ${h.vi_tri + 1}`, `Act ${h.vi_tri + 1} description`)}
              style={{
                fontSize: 12,
                padding: '6px 8px',
                borderRadius: RADIUS.r1,
                border: '1px solid var(--border)',
                background: 'var(--field)',
                color: 'var(--t1)',
                outline: 'none',
                width: '100%',
                resize: 'vertical',
                minHeight: 60,
                lineHeight: 1.5,
                fontFamily: 'inherit',
              }}
            />
            <NutAnhHoi
              h={h}
              onDoi={(anhUrl) => doiMotHoi(h.vi_tri, { anhUrl })}
            />
          </fieldset>
        );
      })}

      <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0 }}>
        {tr(`Đã điền ${soDaDien}/3 hồi`, `${soDaDien}/3 acts filled`)}
      </p>
    </div>
  );
}

/**
 * NÚT ẢNH của một hồi — hai hình thái:
 *  · CHƯA có ảnh: nút thêm ảnh (input file ẩn — không bắt gõ URL vì KTS không copy được URL từ
 *    Gallery ra tay). Ảnh chuyển thành data URL để không lệ thuộc mạng.
 *  · ĐÃ có ảnh: preview nhỏ + nút xoá ở góc.
 *
 * ⚠️ KHÔNG upload lên server ở đây — data URL đủ dùng cho phiên thảo luận. Việc lưu về sau là
 * của distiller/LOI (nếu quyết định giữ ảnh trong Thẻ DNA thay vì trỏ ra Gallery).
 */
function NutAnhHoi({ h, onDoi }: { h: Hoi; onDoi: (anhUrl: string | undefined) => void }) {
  const tr = useT();

  if (h.anhUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={h.anhUrl}
          alt={tr(`Ảnh hồi ${h.vi_tri + 1}`, `Act ${h.vi_tri + 1} image`)}
          style={{
            width: 80,
            height: 60,
            objectFit: 'cover',
            borderRadius: RADIUS.r1,
            border: '1px solid var(--border)',
          }}
        />
        <button
          type="button"
          onClick={() => onDoi(undefined)}
          style={{
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: RADIUS.r1,
            border: '1px solid var(--border)',
            background: 'var(--field)',
            color: 'var(--t3)',
            cursor: 'pointer',
          }}
        >
          {tr('Xoá ảnh', 'Remove image')}
        </button>
      </div>
    );
  }

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        padding: '4px 8px',
        borderRadius: RADIUS.r1,
        border: '1px dashed var(--border-strong)',
        color: 'var(--t3)',
        cursor: 'pointer',
        alignSelf: 'flex-start',
      }}
    >
      + {tr('Thêm ảnh minh hoạ (tuỳ chọn)', 'Add illustrative image (optional)')}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = await fileToDataUrl(file);
          onDoi(url);
        }}
      />
    </label>
  );
}

/** Đọc File thành data URL — hàm thuần, không phụ thuộc React. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
