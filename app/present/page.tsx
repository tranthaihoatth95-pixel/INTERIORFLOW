'use client';
/**
 * app/present/page.tsx — Route standalone `/present`.
 *
 * Mở thẳng vào một bộ trình chiếu Present đã dựng sẵn (ZERO setup) — hợp để trình
 * chiếu cho khách. Dùng CHÍNH pipeline Present của app (lib/slides + lib/imaging)
 * qua wrapper lib/present-demo. 0 auth, 0 AI, 0 mạng, chạy cục bộ.
 *
 * Toàn màn hình, nền theo CSS var. Không đọc window/location ở render body.
 */
import PresentDeck from '@/components/present/PresentDeck';
import { DEMO_DECK } from '@/lib/present-demo';

/**
 * `/present` = route SHOWCASE demo (deck Detech mẫu), TÁCH khỏi app thật.
 * App thật (Present mode trong app) KHÔNG dùng deck này — mặc định rỗng.
 * Xem docs/CONTENT-RULES.md.
 */
export default function PresentPage() {
  return (
    <main style={{ position: 'fixed', inset: 0, background: 'var(--bg)' }}>
      <PresentDeck deck={DEMO_DECK} />
    </main>
  );
}
