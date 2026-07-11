/**
 * render.compare — "So sánh model xịn": 1 prompt → 4 model đỉnh cạnh nhau (board 2×2 có nhãn).
 * Vừa hữu dụng (chọn model thắng), vừa là cú "bất ngờ" trong demo BGĐ.
 * Gọi /api/render/premium (fal thật nếu có balance, không thì placeholder có nhãn). Seam defs/.
 */
import type { NodeDefinition } from '@/lib/types';
import { loadImage } from '@/lib/imaging';
import { DEFAULT_COMPARE, getPremiumModel } from '@/lib/ai/premium-models';

async function renderOne(modelKey: string, prompt: string, image?: string): Promise<string> {
  const res = await fetch('/api/render/premium', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelKey, prompt, image }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.imageUrl) throw new Error(body.error ?? 'Render lỗi.');
  return body.imageUrl as string;
}

async function composeCompare(cells: { name: string; strength: string; url: string }[]): Promise<string> {
  const W = 1536, H = 1024, PAD = 24, HEAD = 44;
  const cw = (W - PAD * 3) / 2;
  const ch = (H - PAD * 3) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0E0C09'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) {
    const cell = cells[i];
    const x = PAD + (i % 2) * (cw + PAD);
    const y = PAD + Math.floor(i / 2) * (ch + PAD);
    if (cell) {
      try {
        const img = await loadImage(cell.url);
        // cover-fit ảnh vào vùng dưới nhãn
        const iy = y + HEAD, ih = ch - HEAD;
        const scale = Math.max(cw / img.naturalWidth, ih / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.save(); ctx.beginPath(); ctx.rect(x, iy, cw, ih); ctx.clip();
        ctx.drawImage(img, x + (cw - dw) / 2, iy + (ih - dh) / 2, dw, dh);
        ctx.restore();
      } catch { /* ảnh lỗi → bỏ trống */ }
      ctx.fillStyle = '#E9E0CD'; ctx.font = '600 22px system-ui';
      ctx.fillText(cell.name, x + 4, y + 26);
      ctx.fillStyle = '#9C8E76'; ctx.font = '14px system-ui';
      ctx.fillText(cell.strength, x + 4 + ctx.measureText(cell.name).width + 14, y + 25);
    }
    ctx.strokeStyle = 'rgba(199,154,99,.18)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + .5, y + HEAD + .5, cw - 1, ch - HEAD - 1);
  }
  return canvas.toDataURL('image/jpeg', 0.92);
}

export const compareNodes: NodeDefinition[] = [
  {
    type: 'render.compare',
    title: 'So sánh model (xịn)',
    category: 'AI_GENERATE',
    description:
      '1 prompt → 4 model đỉnh (FLUX Pro · SD3.5 · Ideogram · Recraft) cạnh nhau để chọn. Cần balance fal cho ảnh thật — 4cr/model render thật (16cr đủ 4), mock miễn phí.',
    inputs: [
      { id: 'prompt', label: 'Prompt', dataType: 'text' },
      { id: 'image', label: 'Ảnh (tuỳ chọn)', dataType: 'image' },
    ],
    outputs: [{ id: 'image', label: 'Board so sánh', dataType: 'image' }],
    params: [],
    // Kế toán ở SERVER: /api/render/premium trừ 4cr/model render fal thật (mock hoàn lại)
    // — creditCost client để 0 tránh trừ đúp, và curl thẳng route cũng không thoát phí.
    creditCost: 0,
    async execute({ inputs, onProgress }) {
      const prompt = String(inputs.prompt?.value ?? '').trim();
      if (!prompt) throw new Error('Cần Prompt để so sánh model.');
      const image = inputs.image?.value ? String(inputs.image.value) : undefined;
      onProgress(0.1);
      const urls = await Promise.all(
        DEFAULT_COMPARE.map((k) => renderOne(k, prompt, image).catch(() => '')),
      );
      onProgress(0.8);
      const cells = DEFAULT_COMPARE.map((k, i) => {
        const m = getPremiumModel(k)!;
        return { name: m.name, strength: m.strength, url: urls[i] };
      }).filter((c) => c.url);
      if (!cells.length) throw new Error('Không model nào trả ảnh — kiểm tra fal/API.');
      const board = await composeCompare(cells);
      onProgress(1);
      return { image: { dataType: 'image', value: board } };
    },
  },
];
