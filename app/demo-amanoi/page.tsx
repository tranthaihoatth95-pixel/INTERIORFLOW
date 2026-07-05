'use client';
/**
 * Demo THẬT chạy trên máy — dùng CHÍNH pipeline Present của app (lib/slides + lib/imaging):
 *   /demo-amanoi?scene=bedroom  → Pavilion Phòng ngủ Amanoi
 *   /demo-amanoi?scene=lobby    → Sảnh (Central Pavilion) Amanoi
 * Sinh: (1) deck present PDF 16:9 có nội dung + hình, (2) moodboard vật liệu PNG.
 * Hình ảnh sinh cục bộ (canvas, palette đá ấm Amanoi) — stand-in cho render SD; khi bật
 * Draw Things (oneAI) sẽ thay bằng ảnh photoreal. 0 AI, 0đ, chạy thẳng trong trình duyệt.
 */
import { useEffect, useRef, useState } from 'react';
import { renderSlide, type SlideTheme, type SlideOptions } from '@/lib/slides';
import { composeBoard } from '@/lib/imaging';

// ---------- Palette đá ấm Amanoi ----------
const DARK: SlideTheme = { bg: '#151109', text: '#F2ECDF', muted: '#A2937A', accent: '#C79A63', palette: ['#C79A63', '#8A6A3A', '#D8C7A8', '#3B352F'] };
const LIGHT: SlideTheme = { bg: '#EBE4D6', text: '#28211A', muted: '#7A6C58', accent: '#A8794B', palette: ['#C2AD86', '#6E4A2E', '#D9CFBE', '#8A6A3A'] };

type Mat = { name: string; a: string; b: string };
const MATERIALS_BEDROOM: Mat[] = [
  { name: 'Travertine', a: '#DAC9AA', b: '#BEA983' },
  { name: 'Gỗ tếch', a: '#8A5E38', b: '#5E3F25' },
  { name: 'Vải lanh', a: '#DDD3C1', b: '#C4B8A0' },
  { name: 'Đồng hun', a: '#B08D53', b: '#7C5E33' },
  { name: 'Đá núi lửa', a: '#554D43', b: '#332E28' },
  { name: 'Vữa mộc', a: '#CBC0AE', b: '#AE9F89' },
];
const MATERIALS_LOBBY: Mat[] = [
  { name: 'Đá bazan', a: '#4A443C', b: '#2C2823' },
  { name: 'Travertine', a: '#DAC9AA', b: '#BEA983' },
  { name: 'Gỗ lim', a: '#5C3E26', b: '#3D2917' },
  { name: 'Đồng đỏ', a: '#B57A48', b: '#7E5230' },
  { name: 'Đá cuội sông', a: '#9C9284', b: '#756B5E' },
  { name: 'Mây tre', a: '#C9A96E', b: '#A5814B' },
];

interface Scene {
  key: string;
  brand: string;
  project: string;
  materials: Mat[];
  slides: { layout: SlideOptions['layout']; theme: SlideTheme; kicker: string; title: string; body: string[]; hero?: 'room' | 'material' | 'landscape' }[];
}

const SCENES: Record<string, Scene> = {
  bedroom: {
    key: 'bedroom',
    brand: 'AMANOI · NÚI CHÚA',
    project: 'Amanoi — Pavilion Phòng Ngủ',
    materials: MATERIALS_BEDROOM,
    slides: [
      { layout: 'Cover', theme: DARK, kicker: 'AMANOI — NÚI CHÚA, NINH THUẬN', title: 'Pavilion Phòng Ngủ', body: ['Nơi đá núi gặp biển Đông', 'Concept không gian nghỉ — 2026'], hero: 'landscape' },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '01 — Ý NIỆM', title: 'Tĩnh tại giữa thiên nhiên hoang sơ', body: ['Không gian nghỉ mở về phía núi và vịnh, giữ sự trầm mặc của Aman.', 'Đường nét tối giản, khối đá thô đối thoại với ánh sáng tự nhiên.', 'Mỗi pavilion là một ẩn thất riêng tư, ôm trọn cảnh quan.'], hero: 'room' },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '02 — VẬT LIỆU', title: 'Travertine, tếch, lanh và đồng hun', body: ['Bảng vật liệu ấm, mộc — chạm vào thấy thiên nhiên.', 'Đá travertine cho tường và sàn; gỗ tếch cho trần và đồ rời.', 'Vải lanh mộc, chi tiết đồng hun tạo chiều sâu quiet-luxury.'], hero: 'material' },
      { layout: 'Quote', theme: DARK, kicker: '', title: '“Xa xỉ là sự tĩnh lặng — được thiên nhiên bao bọc, không gì thừa.”', body: [] },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '03 — ÁNH SÁNG & BỐ CỤC', title: 'Ánh sáng dẫn lối, bố cục buông lỏng', body: ['Giường hướng ra khung cảnh; ánh nắng sớm vào trực tiếp.', 'Đèn gián tiếp ấm 2700K, nhấn khối đá và thớ gỗ về đêm.', 'Bồn tắm đá bên hiên — ranh giới trong/ngoài tan biến.'], hero: 'room' },
    ],
  },
  lobby: {
    key: 'lobby',
    brand: 'AMANOI · NÚI CHÚA',
    project: 'Amanoi — Sảnh Central Pavilion',
    materials: MATERIALS_LOBBY,
    slides: [
      { layout: 'Cover', theme: DARK, kicker: 'AMANOI — NÚI CHÚA, NINH THUẬN', title: 'Sảnh Central Pavilion', body: ['Ngưỡng cửa của một hành trình tĩnh', 'Concept không gian đón — 2026'], hero: 'landscape' },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '01 — Ý NIỆM', title: 'Sảnh mở như một đền đài giữa núi', body: ['Mái lớn, cột đá bazan — khung nhìn thẳng ra vịnh Vĩnh Hy.', 'Không gian đón trầm mặc, dẫn khách từ ồn ào vào tĩnh lặng.', 'Tỉ lệ cao thoáng, vật liệu thô ráp mà sang trọng.'], hero: 'room' },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '02 — VẬT LIỆU', title: 'Bazan, travertine, gỗ lim và đồng đỏ', body: ['Đá bazan địa phương cho cột và nền — vững chãi, nguyên bản.', 'Travertine ấm làm dịu khối; gỗ lim cho quầy và trần.', 'Đồng đỏ, mây tre điểm xuyết hơi ấm thủ công.'], hero: 'material' },
      { layout: 'Quote', theme: DARK, kicker: '', title: '“Sảnh không phô trương — nó khiến ta hạ giọng và ngẩng nhìn.”', body: [] },
      { layout: 'Nội dung + ảnh', theme: LIGHT, kicker: '03 — TRẢI NGHIỆM ĐÓN', title: 'Hành trình từ bóng râm ra ánh sáng', body: ['Lối vào nén thấp, mở dần ra sảnh cao ngập sáng và gió biển.', 'Nước phản chiếu chạy suốt trục nhìn tới đường chân trời.', 'Chỗ ngồi chờ ấm cúng, nhìn ra bậc đá xuống vườn.'], hero: 'room' },
    ],
  },
};

// ---------- Sinh hình cục bộ (stand-in cho render SD) ----------
function noise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number) {
  for (let i = 0; i < w * h * 0.04; i++) {
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * alpha).toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
}

function makeScene(kind: 'room' | 'landscape', theme: SlideTheme, seed: number): string {
  const w = 1200, h = 900;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const warm = theme.accent;
  // trời/tường
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, kind === 'landscape' ? '#C7B48C' : '#E6D9BE');
  sky.addColorStop(0.55, kind === 'landscape' ? '#9E8763' : '#CDBB98');
  sky.addColorStop(1, '#6E5C41');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  // khối núi / tường đá
  ctx.fillStyle = 'rgba(40,32,22,0.55)';
  ctx.beginPath();
  if (kind === 'landscape') {
    ctx.moveTo(0, h * 0.62);
    ctx.lineTo(w * 0.28, h * 0.42); ctx.lineTo(w * 0.5, h * 0.58);
    ctx.lineTo(w * 0.74, h * 0.36); ctx.lineTo(w, h * 0.55); ctx.lineTo(w, h); ctx.lineTo(0, h);
  } else {
    ctx.rect(0, h * 0.58, w, h * 0.42);
  }
  ctx.closePath(); ctx.fill();
  // sàn
  const floor = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floor.addColorStop(0, '#7A6446'); floor.addColorStop(1, '#4A3B29');
  ctx.fillStyle = floor; ctx.fillRect(0, h * 0.72, w, h * 0.28);
  // bloom ánh sáng ấm
  const g = ctx.createRadialGradient(w * 0.72, h * 0.3, 20, w * 0.72, h * 0.3, 520);
  g.addColorStop(0, 'rgba(255,236,190,0.85)'); g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (kind === 'room') {
    // gợi khối giường/đồ nội thất
    ctx.fillStyle = 'rgba(20,16,10,0.35)';
    ctx.fillRect(w * 0.1, h * 0.6, w * 0.42, h * 0.2);
    ctx.fillStyle = 'rgba(230,220,200,0.5)';
    ctx.fillRect(w * 0.1, h * 0.56, w * 0.42, h * 0.06);
    ctx.strokeStyle = warm; ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.62, h * 0.12, w * 0.28, h * 0.5);
  }
  noise(ctx, w, h, 0.06);
  return c.toDataURL('image/jpeg', 0.9);
}

function makeSwatch(m: Mat): string {
  const w = 900, h = 700;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, m.a); g.addColorStop(1, m.b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // vân nhẹ
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = i % 2 ? m.a : m.b; ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath(); ctx.moveTo(Math.random() * w, 0); ctx.lineTo(Math.random() * w, h); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  noise(ctx, w, h, 0.05);
  return c.toDataURL('image/jpeg', 0.9);
}

async function save(name: string, dataUri: string) {
  try {
    await fetch('/api/demo-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, dataUri }) });
  } catch { /* route dev-only; bỏ qua nếu không có */ }
}

function download(name: string, dataUri: string) {
  const a = document.createElement('a'); a.href = dataUri; a.download = name; a.click();
}

export default function DemoAmanoi() {
  const [log, setLog] = useState<string[]>([]);
  const [slides, setSlides] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<string>('');
  const [pdf, setPdf] = useState<string>('');
  const [sceneKey, setSceneKey] = useState<string | null>(null); // client-only → tránh hydration mismatch
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; ran.current = true;
    const scene = SCENES[new URLSearchParams(location.search).get('scene') ?? 'bedroom'] ?? SCENES.bedroom;
    setSceneKey(scene.key);
    const push = (m: string) => setLog((l) => [...l, m]);
    (async () => {
      push(`Cảnh: ${scene.project}`);
      // 1) hình cục bộ
      const roomA = makeScene('room', LIGHT, 1);
      const roomB = makeScene('room', LIGHT, 2);
      const land = makeScene('landscape', DARK, 3);
      const heroFor = (h?: string) => (h === 'landscape' ? land : h === 'material' ? makeSwatch(scene.materials[0]) : Math.random() > 0.5 ? roomA : roomB);
      // 2) deck slides bằng renderSlide (pipeline app)
      const out: string[] = [];
      for (let i = 0; i < scene.slides.length; i++) {
        const s = scene.slides[i];
        const url = await renderSlide({
          content: { kicker: s.kicker, title: s.title, body: s.body },
          theme: s.theme, layout: s.layout, fonts: 'Editorial',
          heroUrl: s.layout === 'Quote' ? null : heroFor(s.hero),
          brand: scene.brand, pageNo: `${i + 1} / ${scene.slides.length}`,
        });
        out.push(url); push(`Slide ${i + 1}/${scene.slides.length} — ${s.layout}`);
      }
      setSlides(out);
      // 3) PDF present (jsPDF, giống Export Deck)
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
      out.forEach((s, i) => { if (i > 0) doc.addPage([1920, 1080], 'landscape'); doc.addImage(s, 'JPEG', 0, 0, 1920, 1080); });
      const pdfUri = doc.output('datauristring');
      setPdf(pdfUri); push('PDF present dựng xong');
      // 4) moodboard vật liệu (composeBoard — pipeline app; board 2×2 = 4 vật liệu tiêu biểu)
      const swatches = scene.materials.slice(0, 4).map(makeSwatch);
      const board = await composeBoard({ images: swatches, projectName: scene.project, studioName: 'TTT — Quiet Luxury' });
      setMoodboard(board); push('Moodboard vật liệu dựng xong');
      // 5) lưu ~/Downloads
      await save(`Amanoi-${scene.key}-present.pdf`, pdfUri);
      await save(`Amanoi-${scene.key}-moodboard.png`, board);
      push('Đã lưu vào ~/Downloads ✓');
      (window as unknown as { __amanoiDemo?: unknown }).__amanoiDemo = { done: true, scene: scene.key, slides: out.length };
    })();
  }, []);

  const scene = sceneKey ? (SCENES[sceneKey] ?? SCENES.bedroom) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0E0C09', color: '#EFE9DC', fontFamily: 'system-ui', padding: 32 }}>
      <h1 style={{ fontSize: 22, letterSpacing: 1 }}>{scene?.project ?? 'Đang tải demo Amanoi…'}</h1>
      <p style={{ opacity: 0.6, fontSize: 13 }}>{log.join('  ·  ')}</p>
      {scene && (
        <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
          {pdf && <button onClick={() => download(`Amanoi-${scene.key}-present.pdf`, pdf)} style={btn}>⬇ Tải PDF present</button>}
          {moodboard && <button onClick={() => download(`Amanoi-${scene.key}-moodboard.png`, moodboard)} style={btn}>⬇ Tải moodboard PNG</button>}
          <a href={`/demo-amanoi?scene=${scene.key === 'bedroom' ? 'lobby' : 'bedroom'}`} style={{ ...btn, textDecoration: 'none' }}>↻ Đổi cảnh</a>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: 12 }}>
        {slides.map((s, i) => <img key={i} src={s} alt={`slide ${i + 1}`} style={{ width: '100%', borderRadius: 8, border: '1px solid #33302a' }} />)}
      </div>
      {moodboard && <img src={moodboard} alt="moodboard" style={{ width: '100%', maxWidth: 900, marginTop: 16, borderRadius: 8 }} />}
    </div>
  );
}

const btn: React.CSSProperties = { background: '#C79A63', color: '#151109', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 13 };
