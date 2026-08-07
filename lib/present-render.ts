/**
 * lib/present-render.ts (tên cũ: present-demo.ts, đổi 07/08 M-EMPTY) — wrapper render/tải cho Present mode (PresentDeck/PresentOverlay).
 *
 * M-EMPTY (07/08, Hoà chốt "bỏ hết dự án mẫu"): DECK MẪU (`DEMO_DECK` Atelier Nord) và bộ ảnh
 * `COVER_IMAGES` (public/covers — render dự án khách, AUDIT-BRAND-PII) đã GỠ HẲN cùng route
 * `/present`. File này chỉ còn phần DÙNG THẬT: theme + kiểu deck + wrapper mỏng bọc
 * renderSlide / composeBoard / jsPDF. Tên file giữ nguyên để không đụng import của các màn thật
 * (PresentDeck · PresentOverlay · ConceptForm) — đổi tên là việc dọn riêng, không nhét vào đây.
 *
 * LUẬT: font SANS (fonts: 'Modern') — KHÔNG serif. Ảnh cục bộ, 0 AI, 0 mạng.
 */
import { renderSlide, type SlideTheme, type SlideLayout, type FontPairing } from '@/lib/slides';
import { composeBoard } from '@/lib/imaging';

/* ---------- Palette đá ấm quiet-luxury (fallback, không phụ thuộc ảnh ref) ---------- */
export const PRESENT_DARK: SlideTheme = {
  bg: '#151109',
  text: '#F2ECDF',
  muted: '#A2937A',
  accent: '#C79A63',
  palette: ['#C79A63', '#8A6A3A', '#D8C7A8', '#3B352F', '#6E5C41', '#151109'],
};
export const PRESENT_LIGHT: SlideTheme = {
  bg: '#EFE9DC',
  text: '#28211A',
  muted: '#7A6C58',
  accent: '#A8794B',
  palette: ['#C2AD86', '#6E4A2E', '#D9CFBE', '#8A6A3A', '#A8794B', '#28211A'],
};

export interface DemoSlideSpec {
  layout: SlideLayout;
  theme: SlideTheme;
  kicker: string;
  title: string;
  body: string[];
  /** URL/dataURL ảnh hero của slide; bỏ trống = không hero (vd Quote).
   * (Trước 07/08 là `hero: number` — index vào bộ ảnh mẫu COVER_IMAGES đã gỡ.) */
  heroUrl?: string;
}

export interface PresentDeck {
  id: string;
  brand: string;
  project: string;
  slides: DemoSlideSpec[];
  /** bộ chữ render — mặc định 'Modern' (sans). Deck báo cáo dùng 'Editorial' (serif thanh). */
  fonts?: FontPairing;
}

/* ---------- Wrapper render (mỏng, bọc pipeline app) ---------- */

/** Render toàn bộ deck → mảng JPEG dataURL 1920×1080. Font SANS ('Modern'). */
export async function renderDeck(deck: PresentDeck): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    const heroUrl = s.layout === 'Quote' ? null : s.heroUrl ?? null;
    const url = await renderSlide({
      content: { kicker: s.kicker, title: s.title, body: s.body },
      theme: s.theme,
      layout: s.layout,
      fonts: deck.fonts ?? 'Modern',
      heroUrl,
      brand: deck.brand,
      pageNo: `${i + 1} / ${deck.slides.length}`,
    });
    out.push(url);
  }
  return out;
}

/** Ghép moodboard vật liệu từ ảnh CỦA CHÍNH deck (tối đa 4 ảnh hero đầu). Deck không có ảnh
 * nào thì ném lỗi — nơi gọi duy nhất (PresentDeck) đã try/catch sẵn, moodboard là phần phụ. */
export async function renderMoodboard(deck: PresentDeck): Promise<string> {
  const imgs = deck.slides.map((s) => s.heroUrl).filter((u): u is string => !!u).slice(0, 4);
  if (!imgs.length) throw new Error('Deck không có ảnh để ghép moodboard.');
  return composeBoard({ images: imgs, projectName: deck.project, studioName: deck.brand || 'InteriorFlow' });
}

/**
 * Dựng PDF 16:9 từ các slide đã render (giống Export Deck trong app).
 * TRẢ dataURI đầy đủ ('data:application/pdf;filename=...;base64,...').
 * Người gọi tự strip tới sau ';base64,' nếu cần Blob (xem downloadPdf).
 */
export async function buildDeckPdf(slides: string[], fileName = 'present-deck.pdf'): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
  slides.forEach((s, i) => {
    if (i > 0) doc.addPage([1920, 1080], 'landscape');
    doc.addImage(s, 'JPEG', 0, 0, 1920, 1080);
  });
  // gợi ý tên file trong metadata dataURI
  return doc.output('datauristring', { filename: fileName });
}

/** Tải PDF về máy từ dataURI (strip đúng phần trước ';base64,' rồi tạo Blob). */
export function downloadPdf(dataUri: string, fileName: string) {
  const marker = ';base64,';
  const idx = dataUri.indexOf(marker);
  const b64 = idx >= 0 ? dataUri.slice(idx + marker.length) : dataUri;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Tải dataURL ảnh (PNG/JPEG) về máy. */
export function downloadImage(dataUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}
