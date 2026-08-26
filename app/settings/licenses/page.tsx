'use client';

/**
 * /settings/licenses — "Third-party licenses". VIỆC "Ngay (~0 chi phí)" ở `docs/LICENSE-NOTES.md
 * §4/§2` (viết 28/07, còn ⬜ tới 05/08) — GPL-3 §4 đòi kèm BẢN COPY đầy đủ license khi conveying,
 * không phải link ra ngoài. Vào được từ Cài đặt (`PixelSettingsShell` → "Nâng cao" →
 * `ThirdPartyLicensesRow`) VÀ từ `/settings/about`.
 *
 * ⚠️ LUẬT TRUNG TÍNH (`CLAUDE.md`): trang này KHÔNG dùng lập luận "tool nội bộ" — IF là sản phẩm
 * global, mọi bản phát hành ra ngoài = conveying theo GPL-3 §0 (`docs/LICENSE-NOTES.md §0`).
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { GPL_3_0_TEXT } from '@/lib/legal/gpl-3-0-text';
import {
  GPL_SCOPE_FILES,
  GPL_COPYRIGHT_NOTICE,
  GPL_WRITTEN_OFFER,
  OTHER_LICENSES,
} from '@/lib/legal/third-party-licenses';

/** Trang này KHÔNG mount `PixelSettingsShell`/`RawStyle(SETTINGS_MOCK_CSS)` nên `.card`/`.ghost`
 * (chỉ tồn tại trong CSS đó) không có tác dụng — tự style inline bằng biến CSS toàn cục (đúng
 * cách `app/settings/avatar/page.tsx` đã làm), tránh phụ thuộc ngầm vào 1 trang khác. */
const cardStyle: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 14,
};
const ghostButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '7px 12px',
  color: 'var(--t2)',
  cursor: 'pointer',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        color: 'var(--t2)',
        margin: '32px 0 10px',
      }}
    >
      {children}
    </h2>
  );
}

export default function ThirdPartyLicensesPage() {
  const router = useRouter();
  const tr = useT();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '48px 24px 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: 760, width: '100%' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ ...ghostButtonStyle, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginBottom: 20 }}
        >
          <ArrowLeft size={18} /> {tr('Quay lại', 'Back')}
        </button>

        <div style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
          {tr('Cài đặt', 'Settings')}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
          {tr('Giấy phép bên thứ ba', 'Third-party licenses')}
        </h1>
        <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
          {tr(
            'InteriorFlow dùng một số mã nguồn mở. Trang này liệt kê nghĩa vụ giấy phép — quan trọng nhất là GNU LibreDWG (GPL-3.0), dùng để đọc file .dwg.',
            'InteriorFlow uses some open-source components. This page lists the licensing obligations — most notably GNU LibreDWG (GPL-3.0), used to read .dwg files.',
          )}
        </p>

        <SectionTitle>{tr('Phần nào của IF dưới GPL-3.0', 'Which part of IF is under GPL-3.0')}</SectionTitle>
        <div style={{ ...cardStyle, padding: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--t2)' }}>
          <p style={{ margin: '0 0 8px', color: 'var(--t1)' }}>
            {tr(
              'CHỈ hai mục dưới đây — không phải toàn bộ InteriorFlow:',
              'ONLY the two items below — not all of InteriorFlow:',
            )}
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {GPL_SCOPE_FILES.map((f) => (
              <li key={f} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5 }}>
                {f}
              </li>
            ))}
          </ul>
          <p style={{ margin: '12px 0 0' }}>{GPL_COPYRIGHT_NOTICE}</p>
        </div>

        <SectionTitle>{tr('Lời chào hàng Corresponding Source (GPL-3 §6c)', 'Written offer for Corresponding Source (GPL-3 §6c)')}</SectionTitle>
        <div style={{ ...cardStyle, padding: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--t2)' }}>
          <p style={{ margin: '0 0 8px' }}>{GPL_WRITTEN_OFFER.textVi}</p>
          <p style={{ margin: '0 0 8px', color: 'var(--t3)', fontSize: 12 }}>{GPL_WRITTEN_OFFER.textEn}</p>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--t1)' }}>{GPL_WRITTEN_OFFER.contactPlaceholder}</p>
          {GPL_WRITTEN_OFFER.contactPlaceholder.startsWith('[') && (
            <p style={{ margin: '10px 0 0', padding: '8px 10px', borderRadius: 8, background: 'color-mix(in srgb, red 12%, transparent)', color: 'var(--t1)', fontSize: 11.5 }}>
              ⚠️ {tr(
                'Kênh liên hệ CHƯA điền — lời chào hàng này chưa có hiệu lực pháp lý cho tới khi có kênh thật. Xem docs/LICENSE-NOTES.md §8.',
                'Contact channel NOT filled in — this offer has no legal effect until a real channel exists. See docs/LICENSE-NOTES.md §8.',
              )}
            </p>
          )}
        </div>

        <SectionTitle>{tr('Thư viện mã nguồn mở khác', 'Other open-source components')}</SectionTitle>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {OTHER_LICENSES.map((entry, i) => (
            <div
              key={entry.name}
              style={{
                padding: 14,
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>{entry.name}</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{entry.license}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>{entry.note}</p>
            </div>
          ))}
        </div>

        <SectionTitle>{tr('Toàn văn GNU General Public License v3.0', 'Full text of the GNU General Public License v3.0')}</SectionTitle>
        <pre
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
            maxHeight: 480,
            overflow: 'auto',
            fontSize: 11.5,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            color: 'var(--t2)',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          }}
        >
          {GPL_3_0_TEXT}
        </pre>
      </div>
    </main>
  );
}
