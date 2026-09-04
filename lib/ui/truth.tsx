/**
 * lib/ui/truth.tsx — [marker: nhanNguonSuThat] NHÃN NGUỒN SỰ THẬT (truth badge) — định nghĩa
 * thuần + mặt tiền không hook, để test render được mà không kéo store.
 *
 * Năm nấc theo EXS điều 9 (Context Intelligence Stack, Hoà chốt 20/08): Measured · Verified ·
 * Inferred · External · Stale. Nhãn này trả lời MỘT câu ở mọi con số/thuộc tính trong app:
 * *số này từ đâu ra, tin được tới đâu* — đúng cái IF bán ("con số truy được về một nguồn").
 *
 * ── BA KÊNH, KÊNH NÀO CŨNG TỰ ĐỨNG (cùng luật với ChiBaoBaMat, chốt 16/08 màu-không-là-kênh-duy-nhất) ──
 *   ① CHỮ  — nhãn luôn hiện, chữ MỰC `--t1` (không tô màu nhấn lên chữ 11px: accent trên nền
 *            tối chỉ ~3,7:1, dưới AA 4,5 — màu chỉ được ở dấu/viền/nền).
 *   ② DẤU  — ✓ đo · ✓✓ người xác nhận · ≈ máy suy · ↗ nguồn ngoài · ⟳ đã cũ. Năm hình khác hẳn.
 *   ③ MÀU + KIỂU VIỀN — bí danh `--truth-*` (không mở màu mới); Stale viền ĐỨT, Inferred viền
 *            CHẤM: bỏ hết màu vẫn phân biệt được với Measured.
 *
 * `≈` cho Inferred dùng lại đúng dấu của ChiBaoBaMat ("máy suy đoán, chưa ai xác nhận") — một
 * dấu một nghĩa toàn app, không đẻ dấu thứ hai cho cùng khái niệm.
 */

// Import tường minh vì test chạy sucrase-node theo lối JSX cổ điển (xem thao-tac-glyph.tsx).
import React from 'react';
import type { ReactElement } from 'react';
import type { Lang } from '../lang';
import { t } from '../lang';

export type TruthKind = 'measured' | 'verified' | 'inferred' | 'external' | 'stale';

export interface TruthSpec {
  /** dấu hình — kênh ②, aria-hidden (chữ đã nói rồi). */
  dau: string;
  /** token màu — kênh ③, chỉ dùng cho dấu/viền/nền. */
  token: `--truth-${TruthKind}`;
  nhan: { vi: string; en: string };
  /** một câu cho aria-label / ô giải nghĩa — nói tin được tới đâu. */
  giaiThich: { vi: string; en: string };
}

export const TRUTH: Record<TruthKind, TruthSpec> = {
  measured: {
    dau: '✓',
    token: '--truth-measured',
    nhan: { vi: 'Đo được', en: 'Measured' },
    giaiThich: { vi: 'Đọc trực tiếp từ bản vẽ hoặc khối đã dựng', en: 'Read directly from the drawing or built model' },
  },
  verified: {
    dau: '✓✓',
    token: '--truth-verified',
    nhan: { vi: 'Đã xác nhận', en: 'Verified' },
    giaiThich: { vi: 'Người đã kiểm và xác nhận', en: 'Checked and confirmed by a person' },
  },
  inferred: {
    dau: '≈',
    token: '--truth-inferred',
    nhan: { vi: 'Máy suy đoán', en: 'Inferred' },
    giaiThich: { vi: 'Máy suy ra, chưa ai xác nhận', en: 'Machine-inferred, not yet confirmed' },
  },
  external: {
    dau: '↗',
    token: '--truth-external',
    nhan: { vi: 'Nguồn ngoài', en: 'External' },
    giaiThich: { vi: 'Lấy từ hệ thống hoặc tệp bên ngoài', en: 'Taken from an external system or file' },
  },
  stale: {
    dau: '⟳',
    token: '--truth-stale',
    nhan: { vi: 'Đã cũ', en: 'Stale' },
    giaiThich: { vi: 'Nguồn đã đổi sau lần đọc này — cần đọc lại', en: 'Source changed since last read — re-read needed' },
  },
};

export const TRUTH_KINDS: TruthKind[] = ['measured', 'verified', 'inferred', 'external', 'stale'];

/** Câu đầy đủ cho trình đọc màn hình: "Đo được: đọc trực tiếp từ…". */
export function truthAriaLabel(kind: TruthKind, lang: Lang): string {
  const s = TRUTH[kind];
  return `${t(lang, s.nhan.vi, s.nhan.en)}: ${t(lang, s.giaiThich.vi, s.giaiThich.en)}`;
}

export interface TruthBadgeViewProps {
  kind: TruthKind;
  lang: Lang;
  /** chỉ hiện dấu (chỗ chật, vd ô bảng) — chữ vẫn có trong aria-label, KHÔNG mất kênh ①. */
  compact?: boolean;
  className?: string;
}

/**
 * Mặt tiền THUẦN (không hook) — `components/ui/TruthBadge.tsx` bọc nó với ngôn ngữ hiện hành.
 * Kiểu dáng ở `app/globals.css` `.if-truth` (capsule 20px — "capsule có việc: trạng thái", §7).
 */
export function TruthBadgeView({ kind, lang, compact = false, className }: TruthBadgeViewProps): ReactElement {
  const s = TRUTH[kind];
  const nhan = t(lang, s.nhan.vi, s.nhan.en);
  return (
    <span
      className={['if-truth', compact ? 'if-truth--compact' : '', className ?? ''].filter(Boolean).join(' ')}
      data-truth={kind}
      role="img"
      aria-label={truthAriaLabel(kind, lang)}
    >
      <span className="if-truth-dau" aria-hidden="true">
        {s.dau}
      </span>
      {!compact && <span className="if-truth-nhan">{nhan}</span>}
    </span>
  );
}
