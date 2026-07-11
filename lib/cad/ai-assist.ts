/**
 * lib/cad/ai-assist.ts — AI-ASSIST TỐI GIẢN (rule-based) cho chặng 1 "Layout CAD".
 *
 * PHẠM VI: chặng 1 chỉ cần sơ phác DD nhanh, không phải bộ máy hiểu ngôn ngữ tự nhiên đầy đủ
 * (việc đó để app CAD chuyên nghiệp EFC tách rời lo, nếu cần). Ở đây: 1 hàm rule-based đọc mô
 * tả kiểu "phòng ngủ 4x3.5 có giường và tủ" → tách kích thước (WxH mét) + từ khoá nội thất →
 * sinh ROOM (dùng roomRect trong commands.ts) + đặt vài block khớp từ khoá. Đủ để bấm nút ra
 * ngay 1 phòng có sẵn tường + nội thất, không cần model AI thật.
 *
 * CHỖ CẮM LLM THẬT (sau này): thay nội dung hàm `describeToEntities` bằng 1 lời gọi tới
 * `/api/jobs` (adapter AI đã có sẵn ở app chính — xem RESUME.md mục "AI: adapter layer
 * lib/ai/") với prompt yêu cầu trả JSON { w, h, name, items: string[] } rồi tái dùng nguyên
 * phần dựng entity bên dưới — KHÔNG cần đổi API bên ngoài hàm này.
 */

import type { Entity } from './model';
import { roomRect } from './commands';
import { newId } from './store';
import { BLOCKS } from './furniture';

const KEYWORD_TO_BLOCK: Record<string, string> = {
  'giường đôi': 'bedD', 'giường': 'bedD', 'giường đơn': 'bedS',
  'tủ áo': 'wardrobe', 'tủ quần áo': 'wardrobe',
  'sofa': 'sofa3', 'ghế sofa': 'sofa3', 'ghế bành': 'armchair',
  'bàn ăn': 'dining4', 'bàn làm việc': 'desk', 'bàn': 'desk',
  'bồn cầu': 'toilet', 'lavabo': 'lavabo', 'bồn tắm': 'bathtub',
  'bếp': 'kitchenI',
};

export interface AiAssistResult {
  entities: Entity[];
  note: string;
}

/** Tách "4x3.5" hoặc "4 x 3.5" (mét) → {w,h} mm. Mặc định 4000×3500 nếu không tìm thấy. */
function parseDims(text: string): { w: number; h: number } {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return { w: 4000, h: 3500 };
  const w = parseFloat(m[1].replace(',', '.')) * 1000;
  const h = parseFloat(m[2].replace(',', '.')) * 1000;
  return { w: Number.isFinite(w) && w > 500 ? w : 4000, h: Number.isFinite(h) && h > 500 ? h : 3500 };
}

/** Rule-based: mô tả text ngắn → phòng (tường + nhãn + diện tích) + nội thất khớp từ khoá. */
export function describeToEntities(
  text: string,
  origin: { x: number; y: number },
  wallLayer: string,
  textLayer: string,
  wallThickness = 110,
): AiAssistResult {
  const lower = text.toLowerCase();
  const { w, h } = parseDims(lower);
  const nameMatch = lower.match(/phòng\s+\S+/);
  const name = (nameMatch?.[0] ?? 'PHÒNG').toUpperCase();

  const { entities, areaM2 } = roomRect(origin, { x: origin.x + w, y: origin.y + h }, wallThickness, name, wallLayer, textLayer);

  const found: string[] = [];
  for (const [kw, blockId] of Object.entries(KEYWORD_TO_BLOCK)) {
    if (lower.includes(kw) && BLOCKS.find((b) => b.id === blockId) && !found.includes(blockId)) found.push(blockId);
  }
  // đặt tối đa 3 món tìm thấy, dàn theo hàng ngang trong phòng, cách tường 1 khoảng an toàn
  found.slice(0, 3).forEach((blockId, i) => {
    const def = BLOCKS.find((b) => b.id === blockId)!;
    const x = origin.x + wallThickness * 2 + def.w / 2 + i * (def.w + 300);
    const y = origin.y + wallThickness * 2 + def.h / 2;
    entities.push({ id: newId('e'), type: 'block', layer: wallLayer, block: blockId, at: { x, y }, rot: 0, sx: 1, sy: 1 });
  });

  return {
    entities,
    note: `Rule-based: ${name} ${(w / 1000).toFixed(1)}×${(h / 1000).toFixed(1)}m (${areaM2.toFixed(1)} m²)${found.length ? `, nội thất: ${found.join(', ')}` : ''}.`,
  };
}
