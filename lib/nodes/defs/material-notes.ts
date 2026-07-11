/**
 * util.materialnote — thẻ ghi chú vật liệu (tên · mã/SKU · NCC · màu · ghi chú) → 1 ảnh
 * thẻ nhỏ + mô tả text. Dán lên board/slide (Present) hoặc nối vào prompt node AI
 * (Render) để khoá đúng vật liệu khách chốt. 0 AI, canvas client-side. Seam defs/.
 */
import type { NodeDefinition, PortValue } from '@/lib/types';
import { loadImage } from '@/lib/imaging';

function isHex(v: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(v.trim());
}
function normHex(v: string): string {
  const t = v.trim();
  return t.startsWith('#') ? t : `#${t}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, yStart: number, maxWidth: number, lineHeight: number, maxY: number): void {
  const words = text.split(' ');
  let line = '';
  let y = yStart;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = w;
      if (y > maxY) return;
    } else {
      line = test;
    }
  }
  if (line && y <= maxY) ctx.fillText(line, x, y);
}

async function renderMaterialCard(opt: {
  name: string;
  code: string;
  supplier: string;
  hex: string;
  note: string;
  swatch?: string;
}): Promise<string> {
  const W = 480;
  const H = 320;
  const PAD = 20;
  const SWATCH_H = 160;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');

  ctx.fillStyle = '#faf7f2';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const fallbackColor = isHex(opt.hex) ? normHex(opt.hex) : '#c7a397';
  if (opt.swatch) {
    try {
      const img = await loadImage(opt.swatch);
      const scale = Math.max(W / img.naturalWidth, SWATCH_H / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, SWATCH_H);
      ctx.clip();
      ctx.drawImage(img, (W - dw) / 2, (SWATCH_H - dh) / 2, dw, dh);
      ctx.restore();
    } catch {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(0, 0, W, SWATCH_H);
    }
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(0, 0, W, SWATCH_H);
  }

  let y = SWATCH_H + PAD + 18;
  ctx.fillStyle = '#2b2620';
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText(opt.name || 'Vật liệu chưa đặt tên', PAD, y);
  y += 24;

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#6f6a5f';
  const metaLine = [opt.code, opt.supplier].filter(Boolean).join('  ·  ');
  if (metaLine) {
    ctx.fillText(metaLine, PAD, y);
    y += 20;
  }
  if (isHex(opt.hex)) {
    ctx.fillText(normHex(opt.hex).toUpperCase(), PAD, y);
    y += 20;
  }
  if (opt.note) {
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = '#8a8378';
    wrapText(ctx, opt.note, PAD, y, W - PAD * 2, 16, H - PAD);
  }

  return canvas.toDataURL('image/png');
}

export const materialNoteNodes: NodeDefinition[] = [
  {
    type: 'util.materialnote',
    title: 'Material Note',
    category: 'UTILITY',
    description:
      'Ghi chú vật liệu: tên · mã/SKU · NCC · màu · ghi chú → 1 thẻ ảnh + mô tả text. Dán lên board/slide hoặc nhồi vào prompt AI. 0 credit.',
    inputs: [{ id: 'swatch', label: 'Ảnh mẫu (tuỳ chọn)', dataType: 'image' }],
    outputs: [
      { id: 'image', label: 'Thẻ vật liệu', dataType: 'image' },
      { id: 'text', label: 'Mô tả', dataType: 'text' },
    ],
    params: [
      { kind: 'text', id: 'name', label: 'Tên vật liệu', placeholder: 'Đá travertine Ý' },
      { kind: 'text', id: 'code', label: 'Mã / SKU', placeholder: 'TRV-045' },
      { kind: 'text', id: 'supplier', label: 'Nhà cung cấp', placeholder: 'Marble Center' },
      { kind: 'text', id: 'hex', label: 'Mã màu (HEX)', placeholder: '#C7A397' },
      {
        kind: 'text',
        id: 'note',
        label: 'Ghi chú',
        placeholder: 'Hoàn thiện mờ, chống trơn, bảo trì 6 tháng…',
        multiline: true,
      },
    ],
    creditCost: 0,
    async execute({ inputs, params, onProgress }) {
      const name = String(params.name ?? '').trim();
      if (!name) throw new Error('Chưa nhập tên vật liệu.');
      onProgress(0.3);
      const hex = String(params.hex ?? '').trim();
      const code = String(params.code ?? '').trim();
      const supplier = String(params.supplier ?? '').trim();
      const note = String(params.note ?? '').trim();
      const image = await renderMaterialCard({
        name,
        code,
        supplier,
        hex,
        note,
        swatch: inputs.swatch ? String(inputs.swatch.value) : undefined,
      });
      onProgress(1);
      const descParts = [name, code, supplier].filter(Boolean);
      if (isHex(hex)) descParts.push(normHex(hex));
      const text = note ? `${descParts.join(' · ')} — ${note}` : descParts.join(' · ');
      const out: Record<string, PortValue> = {
        image: { dataType: 'image', value: image },
        text: { dataType: 'text', value: text },
      };
      return out;
    },
  },
];
