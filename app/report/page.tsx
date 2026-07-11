'use client';
/**
 * app/report/page.tsx — Route standalone `/report`.
 *
 * Trình chiếu BÁO CÁO NGHIÊN CỨU CHIẾN LƯỢC (EFC/.idf) dựng bằng CHẶNG PRESENT của app:
 * cùng renderSlide + buildDeckPdf như /present, chỉ khác nội dung + font 'Editorial' (serif).
 * Chứng minh chặng Present xuất được bản trình bày quiet-luxury cho một tài liệu chữ-nhiều.
 * withMoodboard=false vì báo cáo không cần moodboard vật liệu. 0 auth, 0 AI, 0 mạng.
 */
import PresentDeck from '@/components/present/PresentDeck';
import { RESEARCH_DECK } from '@/lib/report-deck';

export default function ReportPage() {
  return (
    <main style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <PresentDeck deck={RESEARCH_DECK} withMoodboard={false} />
    </main>
  );
}
