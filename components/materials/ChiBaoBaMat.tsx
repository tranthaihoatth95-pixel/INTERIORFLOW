'use client';

/**
 * components/materials/ChiBaoBaMat.tsx — [marker: vatLieuBaMat] CHỈ BÁO BA MẶT trong bảng kho.
 *
 * Trả lời đúng một câu, đọc trong một nhịp mắt: *mã này đã đủ ba mặt chưa, thiếu mặt nào.*
 *
 * ⛔ **KHÔNG phải ba chấm màu.** Màu không được là kênh duy nhất — bỏ hết màu vẫn phải đọc được.
 * Ba kênh chồng lên nhau, kênh nào cũng đủ tự đứng:
 *   ① **CHỮ**   — "2D" · "3D" · "Giá" luôn hiện, không bao giờ rút thành ký hiệu trần.
 *   ② **DẤU**   — ✓ đủ · ≈ máy suy đoán · ! có mà chưa đủ · – chưa có. Bốn hình khác hẳn nhau.
 *   ③ **MÀU**   — chỉ là lớp thứ ba, đọc nhanh hơn chứ không mang tin riêng.
 * Ký hiệu đứng đầu mỗi ô là **ký hiệu nén tin** (bảng 7 loại 16/08): nó chỉ nói *chữ bên cạnh
 * nói về cái gì*, nên **luôn kèm chữ**, không bao giờ đứng một mình.
 *
 * Cả cụm là MỘT nút — một điểm dừng Tab cho mỗi hàng, không phải ba. Vì sao không dùng `<span>`
 * kèm `title`: `title` câm trên cảm ứng và Tab bỏ qua hẳn (bài học 16/08 — *"có trong mã" không
 * bằng "tới được người dùng"*). Nút thì bàn phím tới được, và `aria-label` kể trọn ba mặt bằng
 * câu đầy đủ cho người dùng trình đọc màn hình.
 */
import { Ruler, Orbit, Tag } from 'lucide-react';
import { useT } from '@/lib/i18n';
import Tooltip from '@/components/ui/Tooltip';
import type { BaMat, MatKhoa, MatMotMat, MatTrangThai } from '@/lib/materials/ba-mat';

const KY_HIEU: Record<MatKhoa, typeof Ruler> = { ve2d: Ruler, dung3d: Orbit, trinhBay: Tag };

/** Dấu trạng thái — HÌNH mang tin, không phải trang trí. Đọc được cả khi bỏ hết màu. */
function dauCua(m: MatMotMat): string {
  if (m.trangThai === 'du') return m.suyDoan ? '≈' : '✓';
  return m.trangThai === 'chuaDu' ? '!' : '–';
}

function mauCua(t: MatTrangThai): string {
  if (t === 'du') return 'var(--success)';
  return t === 'chuaDu' ? 'var(--warning)' : 'var(--t3)';
}

/** Một câu người đọc hiểu cho mỗi mặt — dùng cho `aria-label` và cho ô giải nghĩa. */
export function cauCuaMat(m: MatMotMat, tr: (vi: string, en: string) => string): string {
  const ten = tr(m.nhanDay.vi, m.nhanDay.en);
  if (m.trangThai === 'du') {
    const gt = m.tomTat ? tr(m.tomTat.vi, m.tomTat.en) : '';
    const suy = m.suyDoan ? tr(' (máy suy đoán, chưa ai xác nhận)', ' (machine-inferred, unconfirmed)') : '';
    return `${ten}: ${gt}${suy}`;
  }
  const thieu = m.thieu ? tr(m.thieu.vi, m.thieu.en) : '';
  const loiRa = m.loiRa ? ` — ${tr(m.loiRa.vi, m.loiRa.en)}` : '';
  return `${ten}: ${thieu}${loiRa}`;
}

export function ChiBaoBaMat({ baMat, onMo }: { baMat: BaMat; onMo: () => void }) {
  const tr = useT();
  const cau = baMat.mats.map((m) => cauCuaMat(m, tr)).join('. ');
  const tongQuat = tr(
    `Đủ ${baMat.soDu} trên 3 mặt`,
    `${baMat.soDu} of 3 faces complete`,
  );

  return (
    <Tooltip label={tongQuat} desc={cau} side="bottom">
      <button
        type="button"
        onClick={onMo}
        aria-label={`${tongQuat}. ${cau}. ${tr('Bấm để xem ba mặt', 'Open the three faces')}`}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)]"
        style={{
          /* `--tap` = 32 chuột / 44 cảm ứng — vòng chạm đủ lớn ở cả hai lối, và vẫn lọt trong
             hàng bảng cao 46. Gõ cứng 24px là hụt vòng chạm ngay khi cầm tablet. */
          display: 'flex', alignItems: 'center', gap: 4, height: 'var(--tap)', padding: '0 2px',
          border: 0, borderRadius: 'var(--r-1)', background: 'transparent', cursor: 'pointer',
        }}
      >
        {baMat.mats.map((m) => {
          const Icon = KY_HIEU[m.khoa];
          const mau = mauCua(m.trangThai);
          return (
            <span
              key={m.khoa}
              aria-hidden
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, height: 20, padding: '0 6px',
                /* nền `--card` chứ KHÔNG `--field`: đo được — chữ 11px màu `--warning` trên
                   `--field` ở theme SÁNG chỉ 4,48:1, hụt ngưỡng 4,5. Trên `--card` là 5,05:1.
                   Đổi NỀN chứ không đổi màu nghĩa — màu nghĩa là thứ không được phép chỉnh. */
                borderRadius: 'var(--r-1)', background: 'var(--card)', color: mau,
                fontSize: 11, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
                /* VIỀN CHỈ MỌC KHI CÓ CHUYỆN. Mặt đã đủ thì viền TRONG SUỐT — giữ nguyên kích
                   thước ô nhưng im lặng. Viền vẽ ở mọi trạng thái là viền KHÔNG MANG TIN, tức
                   trang trí; mà mỗi hàng có ba ô, mười hàng là ba mươi khung kêu như nhau. Nét
                   ĐỨT dành riêng cho "chưa có" — kênh hình dạng, đọc được cả khi in trắng đen. */
                border: m.trangThai === 'du'
                  ? '1px solid transparent'
                  : `1px ${m.trangThai === 'chuaCo' ? 'dashed' : 'solid'} ${mau}`,
              }}
            >
              <Icon size={11} />
              {tr(m.nhan.vi, m.nhan.en)}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{dauCua(m)}</span>
            </span>
          );
        })}
      </button>
    </Tooltip>
  );
}
