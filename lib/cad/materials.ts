/**
 * lib/cad/materials.ts — THƯ VIỆN "VẬT LIỆU" cho lệnh Hatch (Sprint 5 / Việc 1, xem A3.3 trong
 * AUDIT-2026-07-15.md: trước Sprint 5, Hatch chỉ chọn được 5 pattern KỸ THUẬT (ANSI31/32/37/
 * SOLID/DOTS) — không có khái niệm "vật liệu nội thất". Mỗi MaterialDef là 1 PRESET: gộp sẵn
 * pattern + patternScale + patternAngle + màu dưới 1 cái tên vật liệu quen thuộc (gạch/gỗ/đá/sơn
 * phổ biến ở VN) để chọn nhanh — nhưng KHÔNG thay thế, chỉ NỐI THÊM vào hệ pattern kỹ thuật cũ:
 * applyMaterial() trong store set luôn hatchPattern/Scale/Angle/Color, người dùng vẫn chỉnh tay
 * được sau đó (MaterialPalette giữ cả 2 UI — chọn preset + chỉnh chi tiết).
 *
 * ⚠️ QUAN TRỌNG: preview mỗi vật liệu (`materialSwatchStyle`) là HOẠ TIẾT DỰNG BẰNG CSS
 * (linear/radial-gradient lặp), KHÔNG PHẢI ảnh chụp thật — repo này không có ảnh vật liệu thật
 * nào (đã grep xác nhận trước khi làm Sprint 5, và không tự tải ảnh từ internet vì rủi ro bản
 * quyền). Đây là giải pháp tạm thực tế: nhìn có vân/hoạ tiết gợi đúng cảm giác vật liệu, phân
 * biệt được với nhau, còn hơn hẳn chỉ hiện tên chữ như cũ. Khi có ảnh thật (chụp hoặc mua license)
 * — chỉ cần thêm field `photoUrl?: string` vào MaterialDef rồi ưu tiên nó trong MaterialPalette,
 * không cần đổi cấu trúc gì khác ở đây.
 *
 * Thuần dữ liệu — không đụng DOM, test được độc lập (materials.test.ts).
 */

import type { HatchPattern } from './model';

export type MaterialCategory = 'Sàn' | 'Tường/Ốp' | 'Sơn';

/** Kiểu hoạ tiết CSS dùng để dựng preview — xem materialSwatchStyle() bên dưới. */
export type MaterialTexture = 'wood' | 'marble' | 'solid' | 'mosaic' | 'travertine' | 'granite' | 'terrazzo' | 'tile';

export interface MaterialDef {
  id: string;
  name: string;
  category: MaterialCategory;
  /** preset nối vào lệnh Hatch hiện có (Nấc 4) */
  hatchPattern: HatchPattern;
  patternScale: number;
  patternAngle: number;
  /** màu chủ đạo — ghi vào entity.color (override màu layer, xem render.ts layerColor()) */
  color: string;
  texture: MaterialTexture;
  /** 2-4 tông màu dùng để dựng preview CSS (đậm→nhạt hoặc các đốm màu) */
  tones: string[];
}

export const MATERIALS: MaterialDef[] = [
  {
    id: 'gach-bong',
    name: 'Gạch bông',
    category: 'Sàn',
    hatchPattern: 'ANSI37',
    patternScale: 0.6,
    patternAngle: 45,
    color: '#8a3b2e',
    texture: 'mosaic',
    tones: ['#8a3b2e', '#e7d9b8', '#2b2620', '#c98a4b'],
  },
  {
    id: 'gach-ceramic-trang',
    name: 'Gạch ceramic trắng',
    category: 'Sàn',
    hatchPattern: 'ANSI31',
    patternScale: 1.4,
    patternAngle: 0,
    color: '#e9e6df',
    texture: 'tile',
    tones: ['#f3f1ea', '#dcd8cd'],
  },
  {
    id: 'san-go-oc-cho',
    name: 'Sàn gỗ óc chó',
    category: 'Sàn',
    hatchPattern: 'ANSI31',
    patternScale: 0.9,
    patternAngle: 0,
    color: '#5a3a26',
    texture: 'wood',
    tones: ['#3f2717', '#6b4429', '#89583a'],
  },
  {
    id: 'san-go-soi',
    name: 'Sàn gỗ sồi',
    category: 'Sàn',
    hatchPattern: 'ANSI31',
    patternScale: 0.9,
    patternAngle: 0,
    color: '#b98a54',
    texture: 'wood',
    tones: ['#8f6538', '#c9a06a', '#e3c493'],
  },
  {
    id: 'da-marble-trang',
    name: 'Đá marble trắng',
    category: 'Sàn',
    hatchPattern: 'DOTS',
    patternScale: 0.5,
    patternAngle: 0,
    color: '#e8e6e0',
    texture: 'marble',
    tones: ['#f5f4f0', '#d8d5cc', '#9a988f'],
  },
  {
    id: 'da-granite-den',
    name: 'Đá granite đen',
    category: 'Sàn',
    hatchPattern: 'DOTS',
    patternScale: 0.4,
    patternAngle: 0,
    color: '#1c1c1e',
    texture: 'granite',
    tones: ['#141416', '#3a3a3d', '#5c5c60'],
  },
  {
    id: 'da-granite-trang',
    name: 'Đá granite trắng',
    category: 'Sàn',
    hatchPattern: 'DOTS',
    patternScale: 0.4,
    patternAngle: 0,
    color: '#d8d5cd',
    texture: 'granite',
    tones: ['#eae7df', '#c3c0b7', '#8f8c83'],
  },
  {
    id: 'son-trang',
    name: 'Sơn trắng',
    category: 'Sơn',
    hatchPattern: 'SOLID',
    patternScale: 1,
    patternAngle: 0,
    color: '#f5f3ee',
    texture: 'solid',
    tones: ['#f7f5f0', '#eae7df'],
  },
  {
    id: 'son-xam-am',
    name: 'Sơn xám ấm',
    category: 'Sơn',
    hatchPattern: 'SOLID',
    patternScale: 1,
    patternAngle: 0,
    color: '#8f8a80',
    texture: 'solid',
    tones: ['#97927f', '#7d7a70'],
  },
  {
    id: 'son-xanh-reu',
    name: 'Sơn xanh rêu',
    category: 'Sơn',
    hatchPattern: 'SOLID',
    patternScale: 1,
    patternAngle: 0,
    color: '#5c6650',
    texture: 'solid',
    tones: ['#64705a', '#4a5340'],
  },
  {
    id: 'gach-mosaic',
    name: 'Gạch mosaic',
    category: 'Tường/Ốp',
    hatchPattern: 'ANSI32',
    patternScale: 0.4,
    patternAngle: 0,
    color: '#4a7a8a',
    texture: 'mosaic',
    tones: ['#3d6270', '#5f97a8', '#8fc0cc', '#e3ded2'],
  },
  {
    id: 'da-travertine',
    name: 'Đá travertine',
    category: 'Tường/Ốp',
    hatchPattern: 'ANSI31',
    patternScale: 1.1,
    patternAngle: 0,
    color: '#cbb794',
    texture: 'travertine',
    tones: ['#d9c6a3', '#bfa77e', '#a58e69'],
  },
  {
    id: 'gach-terrazzo',
    name: 'Gạch terrazzo',
    category: 'Sàn',
    hatchPattern: 'DOTS',
    patternScale: 0.7,
    patternAngle: 0,
    color: '#e2ddd2',
    texture: 'terrazzo',
    tones: ['#eee9de', '#c9825a', '#5c7a68', '#3a3a3d'],
  },
];

/**
 * Dựng style CSS (plain object — dùng trực tiếp làm React.CSSProperties) mô phỏng vân/hoạ tiết
 * vật liệu bằng gradient thuần CSS. Xem cảnh báo ở đầu file: KHÔNG PHẢI ảnh thật.
 */
export function materialSwatchStyle(m: MaterialDef): Record<string, string> {
  const [t1, t2 = t1, t3 = t2, t4 = t3] = m.tones;
  switch (m.texture) {
    case 'wood':
      return {
        backgroundColor: t1,
        backgroundImage: `repeating-linear-gradient(90deg, ${t2} 0px, ${t1} 3px, ${t2} 6px, ${t3} 10px, ${t1} 14px)`,
      };
    case 'marble':
      return {
        backgroundColor: t1,
        backgroundImage: `linear-gradient(120deg, transparent 40%, ${t3} 41%, transparent 43%),
          linear-gradient(35deg, transparent 60%, ${t3} 61%, transparent 63%),
          linear-gradient(160deg, transparent 20%, ${t2} 21%, transparent 24%),
          linear-gradient(${t1}, ${t1})`,
      };
    case 'granite':
      return {
        backgroundColor: t1,
        backgroundImage: `radial-gradient(circle at 20% 30%, ${t3} 0 1.5px, transparent 2px),
          radial-gradient(circle at 70% 60%, ${t2} 0 1px, transparent 1.5px),
          radial-gradient(circle at 45% 80%, ${t3} 0 1px, transparent 1.5px),
          radial-gradient(circle at 85% 20%, ${t2} 0 1.2px, transparent 2px),
          radial-gradient(circle at 10% 70%, ${t2} 0 1px, transparent 1.5px)`,
        backgroundSize: '18px 18px',
      };
    case 'mosaic':
      return {
        backgroundColor: t1,
        backgroundImage: `linear-gradient(${t2} 1px, transparent 1px), linear-gradient(90deg, ${t2} 1px, transparent 1px),
          linear-gradient(45deg, ${t3} 25%, transparent 25%, transparent 75%, ${t4} 75%)`,
        backgroundSize: '9px 9px, 9px 9px, 18px 18px',
      };
    case 'tile':
      return {
        backgroundColor: t1,
        backgroundImage: `linear-gradient(${t2} 1px, transparent 1px), linear-gradient(90deg, ${t2} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      };
    case 'travertine':
      return {
        backgroundColor: t1,
        backgroundImage: `repeating-linear-gradient(4deg, ${t2} 0px, ${t1} 2px, ${t3} 5px, ${t1} 9px)`,
      };
    case 'terrazzo':
      return {
        backgroundColor: t1,
        backgroundImage: `radial-gradient(circle at 15% 25%, ${t2} 0 3px, transparent 4px),
          radial-gradient(circle at 55% 60%, ${t3} 0 2.5px, transparent 3.5px),
          radial-gradient(circle at 80% 30%, ${t4} 0 2px, transparent 3px),
          radial-gradient(circle at 30% 80%, ${t3} 0 2px, transparent 3px),
          radial-gradient(circle at 75% 75%, ${t2} 0 2.5px, transparent 3.5px)`,
        backgroundSize: '22px 22px',
      };
    case 'solid':
    default:
      return {
        backgroundColor: t1,
        backgroundImage: `radial-gradient(circle at 30% 30%, ${t2} 0%, transparent 70%)`,
      };
  }
}
