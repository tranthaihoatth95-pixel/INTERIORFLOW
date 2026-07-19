/**
 * lib/present-demo.ts — Dữ liệu + helper cho môi trường DEMO của chặng Present.
 *
 * KHÔNG đụng các file dùng chung (lib/slides, lib/imaging, lib/store). Chỉ khai báo
 * dữ liệu deck mẫu (dùng ảnh render Detech sẵn trong public/covers) + wrapper mỏng
 * bọc renderSlide / composeBoard / jsPDF để cả route /present lẫn Present mode trong
 * app cùng gọi.
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

/** Ảnh render Detech sẵn có trong /public/covers (đường dẫn tuyệt đối từ web root). */
export const COVER_IMAGES = [
  '/covers/render_00.jpeg',
  '/covers/render_03.jpeg',
  '/covers/render_04.jpeg',
  '/covers/render_05.jpeg',
  '/covers/render_10.jpeg',
] as const;

export interface DemoSlideSpec {
  layout: SlideLayout;
  theme: SlideTheme;
  kicker: string;
  title: string;
  body: string[];
  /** index ảnh trong COVER_IMAGES; bỏ trống = không hero (vd Quote). */
  hero?: number;
}

export interface PresentDeck {
  id: string;
  brand: string;
  project: string;
  slides: DemoSlideSpec[];
  /** bộ chữ render — mặc định 'Modern' (sans). Deck báo cáo dùng 'Editorial' (serif thanh). */
  fonts?: FontPairing;
}

/* ---------- Deck mẫu: 6 slide, kể chuyện quiet-luxury ---------- */
export const DEMO_DECK: PresentDeck = {
  id: 'detech',
  brand: 'DETECH · NỘI THẤT',
  project: 'Detech — Không gian trưng bày',
  slides: [
    {
      layout: 'Cover',
      theme: PRESENT_DARK,
      kicker: 'DETECH — CONCEPT 2026',
      title: 'Không gian sống, kể theo ánh sáng',
      body: ['Bộ trình bày concept nội thất', 'Ngôn ngữ quiet-luxury, vật liệu ấm'],
      hero: 0,
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: '01 — Ý NIỆM',
      title: 'Tối giản mà ấm, sang mà tĩnh',
      body: [
        'Bảng vật liệu trầm — đá, gỗ và vải mộc đối thoại với ánh sáng tự nhiên.',
        'Đường nét gọn, khối hình rõ ràng, không chi tiết thừa.',
        'Mỗi không gian giữ một nhịp nghỉ cho mắt.',
      ],
      hero: 1,
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: '02 — ÁNH SÁNG',
      title: 'Ánh sáng dẫn lối, dựng chiều sâu',
      body: [
        'Sáng gián tiếp ấm 2700K nhấn khối và thớ vật liệu.',
        'Nắng tự nhiên vào theo trục nhìn chính của phòng.',
        'Tương phản sáng–tối tạo kịch tính điềm đạm.',
      ],
      hero: 2,
    },
    {
      layout: 'Quote',
      theme: PRESENT_DARK,
      kicker: '',
      title: '“Xa xỉ là sự tĩnh lặng — đủ đầy mà không gì thừa.”',
      body: ['Nguyên tắc thiết kế'],
    },
    {
      layout: 'Nội dung + ảnh',
      theme: PRESENT_LIGHT,
      kicker: '03 — VẬT LIỆU',
      title: 'Đá ấm, gỗ tự nhiên, kim loại hun',
      body: [
        'Đá và gỗ làm nền; kim loại hun điểm xuyết chiều sâu.',
        'Chất liệu chạm vào thấy thật — không phủ bóng, không phô trương.',
        'Palette nhất quán suốt bộ, giữ tinh thần biên tập.',
      ],
      hero: 3,
    },
    {
      layout: 'Cover',
      theme: PRESENT_DARK,
      kicker: 'DETECH · 2026',
      title: 'Cảm ơn đã lắng nghe',
      body: ['Sẵn sàng trao đổi phương án chi tiết', 'InteriorFlow — chặng Presenting'],
      hero: 4,
    },
  ],
};

/* ---------- Wrapper render (mỏng, bọc pipeline app) ---------- */

/** Render toàn bộ deck → mảng JPEG dataURL 1920×1080. Font SANS ('Modern'). */
export async function renderDeck(deck: PresentDeck): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < deck.slides.length; i++) {
    const s = deck.slides[i];
    const heroUrl = s.layout === 'Quote' || s.hero === undefined ? null : COVER_IMAGES[s.hero] ?? null;
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

/** Ghép moodboard vật liệu từ 4 ảnh render (composeBoard pipeline app). */
export async function renderMoodboard(deck: PresentDeck): Promise<string> {
  const imgs = COVER_IMAGES.slice(0, 4).map((p) => p as string);
  return composeBoard({ images: imgs, projectName: deck.project, studioName: 'InteriorFlow — Quiet Luxury' });
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
