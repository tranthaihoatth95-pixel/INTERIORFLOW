'use client';

/**
 * Cửa vào Trình chiếu: thư viện mẫu, không phải form chọn loại tài liệu.
 * Chốt 10/08: bốn ô ngang hàng; ô cuối luôn là hành động tạo trống.
 * Các loại chưa có editor vẫn hiện đúng cấu trúc thư viện, nhưng không giả thao tác.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useT } from '@/lib/i18n';

export interface PresentDocTypePickerProps {
  onChooseBlankDeck: () => void;
  onChooseMagicDeck: () => void;
  onChooseBoq: () => void;
}

type Kind = 'deck' | 'material' | 'boq' | 'text' | 'video';

type Template = {
  title: [string, string];
  caption: [string, string];
  image?: string;
  tone?: string;
  enabled: boolean;
};

const LIBRARY: Record<Kind, { label: [string, string]; count: string; lead: [string, string]; templates: Template[] }> = {
  deck: {
    label: ['Deck', 'Deck'], count: '03',
    lead: ['Tạo một câu chuyện thiết kế rõ ràng, phù hợp cho từng buổi duyệt.', 'Create a clear design story for every review.'],
    templates: [
      { title: ['Không gian có câu chuyện', 'A space with a story'], caption: ['Concept tối giản', 'Minimal concept'], image: '/demo/mood1.jpg', enabled: true },
      { title: ['Mộc Residence', 'Moc Residence'], caption: ['Hồ sơ khách hàng', 'Client presentation'], image: '/demo/mood2.jpg', enabled: true },
      { title: ['Phương án 02', 'Option 02'], caption: ['So sánh phương án', 'Option comparison'], image: '/demo/mood3.jpg', enabled: true },
    ],
  },
  material: {
    label: ['Bảng vật liệu', 'Material board'], count: '04',
    lead: ['Ghép vật liệu, mã hàng và vùng sử dụng trên một tấm rõ ràng.', 'Pair finishes, product codes, and usage zones on a clear board.'],
    templates: [
      { title: ['Palette hoàn thiện', 'Finish palette'], caption: ['Đang hoàn thiện editor', 'Editor in progress'], image: '/demo/mood4.jpg', enabled: false },
      { title: ['Bảng mẫu dự án', 'Project sample board'], caption: ['Đang hoàn thiện editor', 'Editor in progress'], tone: '#bcae9e', enabled: false },
      { title: ['Bề mặt & sắc độ', 'Surface & tone'], caption: ['Đang hoàn thiện editor', 'Editor in progress'], tone: '#829aa0', enabled: false },
    ],
  },
  boq: {
    label: ['Bảng tính BOQ', 'BOQ spreadsheet'], count: '03',
    lead: ['Dự toán và khối lượng được đọc cùng nhịp với dự án.', 'Quantities and estimates remain in step with your project.'],
    templates: [
      { title: ['Khối lượng tổng', 'Total quantities'], caption: ['Mở bảng tính BOQ', 'Open BOQ spreadsheet'], tone: '#e5dfd1', enabled: true },
      { title: ['Dự toán hoàn thiện', 'Finishes estimate'], caption: ['Đang bổ sung mẫu', 'Templates in progress'], tone: '#d7d1c4', enabled: false },
      { title: ['Đối chiếu vật tư', 'Procurement check'], caption: ['Đang bổ sung mẫu', 'Templates in progress'], tone: '#cbc4b5', enabled: false },
    ],
  },
  text: {
    label: ['Văn bản', 'Documents'], count: '05',
    lead: ['Văn bản có cấu trúc riêng, không bị nhét vào trang slide.', 'Documents have their own structure, never squeezed into slides.'],
    templates: [
      { title: ['Thuyết minh thiết kế', 'Design narrative'], caption: ['Editor sắp có', 'Editor coming soon'], tone: '#ece8df', enabled: false },
      { title: ['Biểu mẫu nghiệm thu', 'Inspection form'], caption: ['Editor sắp có', 'Editor coming soon'], tone: '#ddd7cb', enabled: false },
      { title: ['Hợp đồng song ngữ', 'Bilingual agreement'], caption: ['Editor sắp có', 'Editor coming soon'], tone: '#cfc8bb', enabled: false },
    ],
  },
  video: {
    label: ['Video', 'Video'], count: '03',
    lead: ['Dựng footage từ chặng 3D thành một nhịp xem có chủ đích.', 'Shape footage from 3D into an intentional viewing rhythm.'],
    templates: [
      { title: ['Walkthrough 60 giây', '60-second walkthrough'], caption: ['Editor sắp có', 'Editor coming soon'], image: '/demo/mood2.jpg', enabled: false },
      { title: ['Phương án ánh sáng', 'Lighting study'], caption: ['Editor sắp có', 'Editor coming soon'], image: '/demo/mood3.jpg', enabled: false },
      { title: ['Tổng hợp dự án', 'Project reel'], caption: ['Editor sắp có', 'Editor coming soon'], image: '/demo/mood4.jpg', enabled: false },
    ],
  },
};

export function PresentDocTypePicker({ onChooseBlankDeck, onChooseMagicDeck, onChooseBoq }: PresentDocTypePickerProps) {
  const tr = useT();
  const [kind, setKind] = useState<Kind>('deck');
  const current = LIBRARY[kind];
  const canCreateBlank = kind === 'deck';

  const openTemplate = (template: Template) => {
    if (!template.enabled) return;
    if (kind === 'boq') onChooseBoq();
    else onChooseMagicDeck();
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 'clamp(34px, 7vh, 76px) 26px 96px' }}>
      <section style={{ width: '100%', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 750, letterSpacing: '.09em' }}>
            <span aria-hidden="true" style={{ display: 'inline-block', width: 7, height: 7, marginRight: 7, borderRadius: '50%', background: 'currentColor' }} />
            {tr('THƯ VIỆN HỒ SƠ', 'DOCUMENT LIBRARY')}
          </div>
          <h1 style={{ margin: '10px 0 7px', color: 'var(--t1)', fontSize: 'clamp(30px, 4vw, 43px)', lineHeight: 1.08, letterSpacing: '-.045em' }}>
            {tr('Bắt đầu từ một mẫu phù hợp.', 'Start with a fitting template.')}
          </h1>
          <p style={{ maxWidth: 540, margin: '0 auto', color: 'var(--t3)', fontSize: 14.5, lineHeight: 1.55 }}>{tr(...current.lead)}</p>
        </div>

        <nav aria-label={tr('Loại hồ sơ', 'Document type')} style={{ display: 'flex', justifyContent: 'center', gap: 5, margin: '32px 0 24px', paddingBottom: 12, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {(Object.keys(LIBRARY) as Kind[]).map((key) => {
            const item = LIBRARY[key];
            const selected = key === kind;
            return <button key={key} type="button" onClick={() => setKind(key)} style={{ flex: 'none', height: 34, padding: '0 12px', border: 0, borderRadius: 10, cursor: 'pointer', background: selected ? 'var(--accent-soft)' : 'transparent', color: selected ? 'var(--accent)' : 'var(--t3)', fontSize: 12, fontWeight: selected ? 650 : 500 }}>
              {tr(...item.label)} <small style={{ marginLeft: 5, opacity: .68 }}>{item.count}</small>
            </button>;
          })}
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }} className="present-template-grid">
          {current.templates.map((template, index) => (
            <button key={template.title[0]} type="button" onClick={() => openTemplate(template)} disabled={!template.enabled} style={{ minWidth: 0, padding: 0, border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', cursor: template.enabled ? 'pointer' : 'not-allowed', opacity: template.enabled ? 1 : .56 }}>
              <div style={{ position: 'relative', height: 185, overflow: 'hidden', borderRadius: 14, background: template.tone ?? '#292733', boxShadow: '0 14px 32px -24px rgba(0,0,0,.8)' }}>
                {template.image ? <img src={template.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(.74) contrast(.94)' }} /> : null}
                {kind === 'boq' ? <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 26px, rgba(63,54,40,.22) 27px 28px), repeating-linear-gradient(90deg, transparent 0 59px, rgba(63,54,40,.18) 60px 61px)' }} /> : null}
                <div style={{ position: 'absolute', inset: 0, background: template.image ? 'linear-gradient(180deg, transparent 34%, rgba(0,0,0,.66))' : 'linear-gradient(145deg, rgba(255,255,255,.12), rgba(0,0,0,.24))' }} />
                <strong style={{ position: 'absolute', left: 16, right: 16, bottom: 15, color: kind === 'boq' || kind === 'text' ? '#312c26' : '#fff', fontSize: 17, lineHeight: 1.08, letterSpacing: '-.025em' }}>{tr(...template.title)}</strong>
              </div>
              <div style={{ marginTop: 11, color: 'var(--t1)', fontSize: 13.5, fontWeight: 650 }}>{tr(...template.caption)}</div>
              {!template.enabled ? <div style={{ marginTop: 3, color: 'var(--t4)', fontSize: 11 }}>{tr('Sắp có', 'Coming soon')}</div> : null}
            </button>
          ))}

          <button type="button" onClick={canCreateBlank ? onChooseBlankDeck : undefined} disabled={!canCreateBlank} aria-label={tr('Tạo hồ sơ trống', 'Create blank document')} style={{ height: 185, border: '1px dashed var(--border)', borderRadius: 14, background: 'transparent', color: canCreateBlank ? 'var(--t3)' : 'var(--t4)', cursor: canCreateBlank ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11 }}>
            <span style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid currentColor', display: 'grid', placeItems: 'center' }}><Plus size={23} strokeWidth={1.5} /></span>
            <span style={{ fontSize: 12, fontWeight: 650 }}>{tr('Tạo hồ sơ trống', 'Create blank document')}</span>
            {!canCreateBlank ? <span style={{ fontSize: 10 }}>{tr('Sắp có', 'Coming soon')}</span> : null}
          </button>
        </div>
      </section>
      <style jsx>{`@media (max-width: 780px) { .present-template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 16px 12px !important; } } @media (max-width: 420px) { .present-template-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

export default PresentDocTypePicker;
