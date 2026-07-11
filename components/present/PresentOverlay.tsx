'use client';
/**
 * components/present/PresentOverlay.tsx — Present mode TRONG APP.
 *
 * Lớp phủ full-bleed (tách khỏi node graph) để trình chiếu deck/board ngay trong
 * app. Đây là TRÌNH XEM, không phải trình soạn — giữ đơn giản, khó vỡ.
 *
 * CÁCH TÍCH HỢP (cho integrator):
 *   - Đây là component tự chứa. Mount khi cần vào Present mode, unmount khi thoát.
 *   - Ví dụ trong nơi mount overlay của app (vd cạnh Dashboard overlay trong store):
 *       {presentModeOpen && <PresentOverlay onClose={() => setPresentModeOpen(false)} />}
 *   - Cần thêm 1 cờ store `presentModeOpen` + setter, và 1 nút kích hoạt ở Header
 *     (chỉ hiện khi phase === 'present'). Xem báo cáo agent để biết đề xuất chi tiết.
 *   - Mặc định trình chiếu deck Detech mẫu (DEMO_DECK). Khi pipeline Present của app
 *     xuất được mảng slide thật, truyền vào PresentDeck qua prop `deck`.
 */
import { useEffect, useMemo } from 'react';
import PresentDeck from './PresentDeck';
import type { PresentDeck as PresentDeckData } from '@/lib/present-demo';
import { useFlowStore } from '@/lib/store';

export interface PresentOverlayProps {
  onClose: () => void;
  /** deck thật từ pipeline app (nếu có); bỏ trống = tự lấy từ node Export Deck của flow hiện tại. */
  deck?: PresentDeckData;
}

/** Lấy deck mới nhất từ flow:
 *  1) Ưu tiên node slide.deck (Export Deck) đã Run — run.outputs._slides = mảng dataURL.
 *  2) Nếu chưa gắn Export Deck: gom mọi slide.composer đã chạy (theo thứ tự pageNo, rồi vị trí trên canvas)
 *     — đúng cách user thường dựng slide lẻ mà chưa nối vào Export Deck. */
function useFlowDeck(): { slides: string[]; name: string } | null {
  const nodes = useFlowStore((s) => s.nodes);
  return useMemo(() => {
    // (1) Export Deck
    const decks = nodes.filter((n) => n.data?.defType === 'slide.deck' && n.data.run?.outputs?._slides?.value);
    const lastDeck = decks.at(-1);
    if (lastDeck) {
      try {
        const slides = JSON.parse(String(lastDeck.data.run.outputs!._slides.value)) as string[];
        if (Array.isArray(slides) && slides.length > 0) {
          return { slides: slides.map(String), name: String(lastDeck.data.params?.deckName ?? 'Deck') };
        }
      } catch {
        /* rơi xuống fallback composer */
      }
    }

    // (2) Fallback: các Slide Composer đã render xong
    const composed = nodes
      .filter((n) => n.data?.defType === 'slide.composer' && typeof n.data.run?.outputs?.image?.value === 'string')
      .map((n) => ({
        url: String(n.data.run!.outputs!.image!.value),
        page: parseInt(String(n.data.params?.pageNo ?? ''), 10),
        x: n.position?.x ?? 0,
        y: n.position?.y ?? 0,
      }))
      .sort((a, b) => {
        const pa = Number.isFinite(a.page) ? a.page : Infinity;
        const pb = Number.isFinite(b.page) ? b.page : Infinity;
        if (pa !== pb) return pa - pb; // theo số trang nếu có
        if (a.x !== b.x) return a.x - b.x; // rồi trái→phải trên canvas
        return a.y - b.y;
      });
    if (composed.length > 0) {
      return { slides: composed.map((c) => c.url), name: 'Slide' };
    }
    return null;
  }, [nodes]);
}

export default function PresentOverlay({ onClose, deck }: PresentOverlayProps) {
  const flowDeck = useFlowDeck();
  // khoá cuộn nền khi overlay mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Present mode"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--bg)',
      }}
    >
      <PresentDeck
        deck={deck}
        imageSlides={!deck && flowDeck ? flowDeck.slides : undefined}
        title={!deck && flowDeck ? flowDeck.name : undefined}
        onClose={onClose}
      />
    </div>
  );
}
