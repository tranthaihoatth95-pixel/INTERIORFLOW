'use client';

/**
 * components/present-editor/PresentDocTypePicker.tsx — Màn chọn LOẠI HỒ SƠ khi vào chặng
 * Trình chiếu CHƯA có hồ sơ nào (V6/H4, `docs/PHIEU-PRESENT-G4.md` mục "V6 · Màn chọn 5 loại
 * hồ sơ + tách lối vào Magic", `docs/SPEC-MODE-PER-STAGE.md` §4).
 *
 * 6 thẻ (5 chốt trong spec gốc + 1 bổ sung theo `STATUS.md` "BỎ HOÃN H4" — loại thứ 6 "Trình
 * chiếu HTML", CHƯA có spec nên disabled, không tự chế đặc tả cho nó):
 *   Deck · Bảng vật liệu A3 · Bảng tính/BOQ · Văn bản · Video · Trình chiếu HTML
 *
 * Enable/disable theo NĂNG LỰC CODE THẬT (không theo văn bản ticket cũ — ticket V6 viết
 * "BOQ disabled" hồi 04/08, nhưng `BoqScreen` đã có editor thật từ `M-BOQ-OUT.md` — coi code
 * là sự thật, xem `docs/CLAUDE.md`):
 *   - Deck        → editor thật (PresentEditor), 2 lối vào: Tự dàn / ✨ Magic.
 *   - Bảng tính/BOQ → editor thật (BoqScreen).
 *   - 3 loại còn lại + HTML → disabled, "Sắp có" + lý do cụ thể (SPEC-NGON-NGU-CHI-DAN).
 *
 * Nhãn theo `docs/SPEC-NGON-NGU-CHI-DAN.md`: hành động trước · ≤12 từ · luôn kèm nút · không
 * jargon nội bộ. Từ khoá "Magic" + dấu ✨ + accent, KHÔNG dùng chữ "tự động"
 * (`docs/CHOT-TACH-AI-VA-CHINH-TAY.md`).
 */

import { useState } from 'react';
import {
  LayoutTemplate,
  Palette,
  FileSpreadsheet,
  FileText,
  Clapperboard,
  Globe,
  Sparkles,
  PenLine,
} from 'lucide-react';
import { useT } from '@/lib/i18n';

export interface PresentDocTypePickerProps {
  /** "Tự dàn" — deck mới bắt đầu với 1 trang trắng, KHÔNG qua GenerateFlow. */
  onChooseBlankDeck: () => void;
  /** "✨ Magic" — deck mới, mở thẳng GenerateFlow (import ảnh/text → máy dàn). */
  onChooseMagicDeck: () => void;
  /** Bảng tính/BOQ — mở `BoqScreen` (editor thật, đã ship). */
  onChooseBoq: () => void;
}

interface DisabledCard {
  key: string;
  icon: React.ReactNode;
  title: [string, string];
  /** Lý do disabled — RIÊNG từng thẻ, tham chiếu đúng spec đang chờ (không viết chung chung). */
  reason: [string, string];
  specFile: string | null;
}

const DISABLED_CARDS: DisabledCard[] = [
  {
    key: 'material-a3',
    icon: <Palette size={20} />,
    title: ['Bảng vật liệu A3', 'Material board A3'],
    reason: [
      'Đã có bản thiết kế, chưa xây xong — sắp có.',
      'Design is ready, still being built — coming soon.',
    ],
    specFile: 'SPEC-TRINH-MATERIAL-A3.md',
  },
  {
    key: 'doc',
    icon: <FileText size={20} />,
    title: ['Văn bản', 'Word document'],
    reason: [
      'Đã có bản thiết kế, chưa xây xong — sắp có.',
      'Design is ready, still being built — coming soon.',
    ],
    specFile: 'SPEC-TRINH-VANBAN-EDITOR.md',
  },
  {
    key: 'video',
    icon: <Clapperboard size={20} />,
    title: ['Video', 'Video'],
    reason: [
      'Đã có bản thiết kế, chưa xây xong — sắp có.',
      'Design is ready, still being built — coming soon.',
    ],
    specFile: 'SPEC-TRINH-VIDEO-EDITOR.md',
  },
  {
    key: 'html',
    icon: <Globe size={20} />,
    title: ['Trình chiếu HTML', 'HTML presentation'],
    reason: [
      'Chưa có bản thiết kế cho loại này — sắp có.',
      'No design yet for this type — coming soon.',
    ],
    specFile: null,
  },
];

const cardBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border)',
  background: 'var(--card)',
  padding: 18,
  minHeight: 168,
  transition: 'transform 200ms cubic-bezier(.32,.72,0,1), box-shadow 200ms, border-color 200ms',
};

function CardShell({
  active,
  children,
  style,
}: {
  active: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardBase,
        ...(active
          ? {
              cursor: 'default',
              transform: hover ? 'translateY(-2px) scale(1.02)' : 'none',
              boxShadow: hover ? 'var(--shadow-pop)' : 'none',
              borderColor: hover ? 'var(--accent-ring)' : 'var(--border)',
            }
          : { opacity: 0.62 }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 34,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-strong)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
};

const magicBtn: React.CSSProperties = {
  ...primaryBtn,
  border: '1px solid var(--accent-ring)',
  background: 'var(--accent-soft)',
  color: 'var(--accent)',
};

export function PresentDocTypePicker({
  onChooseBlankDeck,
  onChooseMagicDeck,
  onChooseBoq,
}: PresentDocTypePickerProps) {
  const tr = useT();
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--t1)' }}>
            {tr('Chọn loại hồ sơ để bắt đầu', 'Choose a document type to start')}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--t3)' }}>
            {tr('Mỗi hồ sơ trình bày một cách khác nhau.', 'Each document presents your project differently.')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {/* Deck — thẻ duy nhất có 2 lối vào (Tự dàn / Magic). */}
          <CardShell active>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
              <LayoutTemplate size={20} />
              <strong style={{ fontSize: 13.5, color: 'var(--t1)' }}>{tr('Deck', 'Deck')}</strong>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t3)', flex: 1, lineHeight: 1.5 }}>
              {tr('Dàn slide kể câu chuyện thiết kế.', 'Slides that tell your design story.')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button type="button" onClick={onChooseBlankDeck} style={primaryBtn}>
                <PenLine size={13} />
                {tr('Tự dàn', 'Start blank')}
              </button>
              <button type="button" onClick={onChooseMagicDeck} style={magicBtn}>
                <Sparkles size={13} />
                {tr('✨ Magic', '✨ Magic')}
              </button>
            </div>
          </CardShell>

          {/* Bảng tính/BOQ — editor thật đã ship (BoqScreen), ENABLE. */}
          <CardShell active>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
              <FileSpreadsheet size={20} />
              <strong style={{ fontSize: 13.5, color: 'var(--t1)' }}>
                {tr('Bảng tính / BOQ', 'Spreadsheet / BOQ')}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t3)', flex: 1, lineHeight: 1.5 }}>
              {tr('Dự toán khối lượng tự tính từ bản vẽ.', 'Quantities calculated straight from the drawing.')}
            </p>
            <button type="button" onClick={onChooseBoq} style={primaryBtn}>
              {tr('Mở', 'Open')}
            </button>
          </CardShell>

          {DISABLED_CARDS.map((c) => (
            <CardShell key={c.key} active={false}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)' }}>
                {c.icon}
                <strong style={{ fontSize: 13.5, color: 'var(--t2)' }}>{tr(...c.title)}</strong>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--t4)', flex: 1, lineHeight: 1.5 }}>
                {tr(...c.reason)}
              </p>
              {c.specFile && (
                <p style={{ margin: 0, fontSize: 10, color: 'var(--t4)' }}>{c.specFile}</p>
              )}
              <div
                style={{
                  ...primaryBtn,
                  cursor: 'default',
                  color: 'var(--t4)',
                  border: '1px solid var(--border)',
                  background: 'var(--field)',
                }}
                aria-disabled="true"
              >
                {tr('Sắp có', 'Coming soon')}
              </div>
            </CardShell>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PresentDocTypePicker;
