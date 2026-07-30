/**
 * lib/render-studio/measurement-spec-sheet.ts — 2.2.88: xuất SPEC SHEET cho "Đo món đồ" (2.2.87).
 * TÁI SỬ DỤNG `composeBoard()` (lib/imaging.ts, cùng engine node `out.board`) cho khung/300dpi/
 * tiêu đề — KHÔNG viết engine ghép ảnh mới (Luật #6 Đồng Bộ). Tự vẽ MỘT panel [ảnh + bảng số đo]
 * bằng canvas rồi đưa panel đó làm ảnh DUY NHẤT cho `composeBoard()` — vì `composeBoard()` chỉ
 * ghép ảnh, không có chỗ vẽ chữ/bảng (đã xác nhận đọc code — không sửa nó, tránh rủi ro 6 chỗ
 * khác đang gọi `out.board`).
 *
 * DẤU CẢNH BÁO "Mặt khuất là suy diễn — kiểm tra trước khi sản xuất." LUÔN vẽ, KHÔNG có tham số
 * tắt (Luật sản phẩm §2 tài liệu tư vấn — sai 1 con số là mất tiền thật của xưởng).
 */
import { composeBoard } from '@/lib/imaging';
import { loadImage } from '@/lib/imaging';
import type { TieredMeasurement, MeasurementValue } from '@/lib/vision/single-view-metrology';

const PANEL_W = 2840;
const PANEL_H = 2000;
const SCALE = 2; // giữ tỉ lệ layout khi phóng cỡ canvas thật, cùng cách composeBoard() đã làm

function fmtMm(v: MeasurementValue): string {
  const tag = v.kind === 'inferred' ? '~' : '';
  return `${tag}${Math.round(v.valueMm)} ± ${Math.round(v.toleranceMm)} mm`;
}

/** Vẽ panel [ảnh trái · bảng số đo phải] ở độ phân giải cao — trả dataURL PNG, đưa vào
 * `composeBoard({images:[panel]})` để có khung/300dpi/tiêu đề cuối cùng. */
async function buildMeasurementPanel(photoDataUrl: string, result: TieredMeasurement, methodLine: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = PANEL_W;
  canvas.height = PANEL_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');

  ctx.fillStyle = '#1a1a1e';
  ctx.fillRect(0, 0, PANEL_W, PANEL_H);

  // Ảnh — nửa trái, cover-fit.
  const photoArea = { x: 0, y: 0, w: PANEL_W * 0.46, h: PANEL_H };
  const img = await loadImage(photoDataUrl);
  const s = Math.max(photoArea.w / img.naturalWidth, photoArea.h / img.naturalHeight);
  const sw = photoArea.w / s;
  const sh = photoArea.h / s;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, photoArea.x, photoArea.y, photoArea.w, photoArea.h);

  // Bảng — nửa phải.
  const px = photoArea.w + 60 * SCALE;
  let y = 100 * SCALE;
  const lh = 74 * SCALE;

  ctx.fillStyle = '#f4f4f5';
  ctx.font = `600 ${44 * SCALE}px system-ui, sans-serif`;
  ctx.fillText('Kích thước · Dimensions', px, y);
  y += lh * 1.3;

  const rows: [string, MeasurementValue][] = [
    ['Rộng · Width', result.width],
    ['Sâu · Depth', result.depth],
    ['Cao · Height', result.height],
  ];
  for (const [label, v] of rows) {
    const color = v.kind === 'measured' ? '#46b876' : '#d9a34a'; // var(--success)/var(--warning), giá trị thật (canvas không đọc CSS var)
    ctx.font = `500 ${30 * SCALE}px system-ui, sans-serif`;
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(label, px, y);
    y += lh * 0.55;
    ctx.font = `700 ${40 * SCALE}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(`${fmtMm(v)}  ${v.kind === 'measured' ? '🟢 ĐO' : '🟡 SUY'}`, px, y);
    y += lh * 0.5;
    ctx.font = `400 ${22 * SCALE}px system-ui, sans-serif`;
    ctx.fillStyle = '#71717a';
    wrapText(ctx, v.basis, px, y, PANEL_W - px - 40 * SCALE, 28 * SCALE);
    y += lh * 1.1;
  }

  y += 20 * SCALE;
  ctx.font = `400 ${22 * SCALE}px system-ui, sans-serif`;
  ctx.fillStyle = '#71717a';
  ctx.fillText(methodLine, px, y);
  y += lh * 0.9;

  // ĐÓNG DẤU CẢNH BÁO — BẮT BUỘC, không tham số tắt.
  const stampY = PANEL_H - 140 * SCALE;
  ctx.fillStyle = 'rgba(217,163,74,0.14)';
  ctx.fillRect(px, stampY - 40 * SCALE, PANEL_W - px - 20 * SCALE, 100 * SCALE);
  ctx.strokeStyle = '#d9a34a';
  ctx.lineWidth = 2 * SCALE;
  ctx.strokeRect(px, stampY - 40 * SCALE, PANEL_W - px - 20 * SCALE, 100 * SCALE);
  ctx.font = `700 ${26 * SCALE}px system-ui, sans-serif`;
  ctx.fillStyle = '#d9a34a';
  wrapText(ctx, '⚠ Mặt khuất là suy diễn — kiểm tra trước khi sản xuất.', px + 16 * SCALE, stampY, PANEL_W - px - 60 * SCALE, 32 * SCALE);

  return canvas.toDataURL('image/png');
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

/** Xuất spec sheet đầy đủ (300dpi, khung out.board) rồi tải xuống — dùng trong ToolModeForm.
 * `methodLine` = dòng "Tầng N · aiTierName · Bậc M · độ tin K%" đã dựng sẵn ở caller (khớp đúng
 * dòng hiện trên MeasurementPanel — không dựng lại logic ghép chuỗi lần 2 ở đây). */
export async function exportMeasurementSpecSheet(opts: {
  photoDataUrl: string;
  result: TieredMeasurement;
  methodLine: string;
  projectName: string;
  studioName: string;
}): Promise<void> {
  const panel = await buildMeasurementPanel(opts.photoDataUrl, opts.result, opts.methodLine);
  const board = await composeBoard({ images: [panel], projectName: opts.projectName, studioName: opts.studioName });
  const a = document.createElement('a');
  a.href = board;
  a.download = 'spec-sheet.jpg';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
