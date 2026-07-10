/**
 * lib/present-editor/detech-sample.ts — Deck THỬ NGHIỆM "Detech Complex — ENSŌ" để TEST
 * chặng Present bằng NỘI DUNG THẬT của dự án (căn hộ dịch vụ 5 sao, concept ENSŌ, Japandi-wellness).
 *
 * Nguồn nội dung: deck Detech gốc (~/Downloads/detech-builder) — ý niệm 円相 ENSŌ, SERENE,
 * bốn nguyên lý Nhật (Wabi-sabi/Ma/Shakkei/Omotenashi). CHỈ phần chính Detech (bỏ About-TTT).
 * Ảnh: /public/detech/* (render concept sạch trích từ PPTX + phối cảnh tháp).
 *
 * Tông ENSŌ: navy #0B1622 nền tối · cam #E85C1E accent · cloudwhite #EDEFEC · xanh rêu.
 * pal() tự chọn accent = màu bão hoà nhất → cam thành accent; navy = dark; cloudwhite = light.
 */

import type { EditorDeck } from './model';
import { BUILTIN_TEMPLATES } from './templates';

/** Palette ENSŌ: mực navy → navy → xanh rêu trầm → CAM accent → sage → cloudwhite. */
export const DETECH_PALETTE = ['#0B1622', '#12202A', '#3A4A44', '#E85C1E', '#A9B5A0', '#EDEFEC'];

/** Ảnh Detech phục vụ tại /detech/* (public/detech/*). */
const IMG = {
  towerNight: '/detech/tower-night.png',
  towerDusk: '/detech/tower-dusk.png',
  ensoCircle: '/detech/enso-circle.png',
  ensoGarden: '/detech/enso-garden.png',
  ikiBanner: '/detech/iki-banner.png',
  meditation: '/detech/meditation.jpg',
  lobbyWater: '/detech/lobby-water.png',
  apt1: '/detech/apt-1.png',
  apt2: '/detech/apt-2.png',
  apt3: '/detech/apt-3.png',
  apt4: '/detech/apt-4.png',
  poolZen: '/detech/pool-zen.png',
  wellness: '/detech/wellness.png',
  matMood: '/detech/mat-moodboard.jpg',
  matPalette: '/detech/mat-palette.png',
  matTravertine: '/detech/mat-travertine.png',
  matWalnut: '/detech/mat-walnut.jpg',
  loungeGreen: '/detech/lounge-green.png',
};

function tpl(id: string) {
  const t = BUILTIN_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`template không tồn tại: ${id}`);
  return t;
}

/**
 * Deck 9 slide — mạch chính Detech (bỏ About-TTT), 2 trang ĐẬM CHẤT ENSŌ:
 *   1. dark-cover        — bìa ENSŌ (vườn thiền moss/void).
 *   2. full-bleed        — 円相 · ENSŌ: ý niệm chủ đạo (vòng tròn thiền). ★ ẤN TƯỢNG
 *   3. grid4-philosophy  — Từ một vòng tròn: bốn giá trị · bốn giác quan · bốn lời giải.
 *   4. full-bleed        — SERENE: phong cách (Simple Geometry · Balance Space).
 *   5. grid4-philosophy  — Bốn nguyên lý Nhật (Wabi-sabi/Ma/Shakkei/Omotenashi). ★ CÂU CHUYỆN
 *   6. moodboard-board   — Không gian sống Japandi (căn hộ + tiện ích).
 *   7. material-flatlay  — Bảng vật liệu (đá ấm · gỗ óc chó · travertine · rêu).
 *   8. full-bleed        — Ánh sáng khuếch tán (lounge/atrium xanh).
 *   9. closing-thanks    — Trang kết.
 */
export function makeDetechEnsoDeck(): EditorDeck {
  const P = DETECH_PALETTE;
  const slides = [
    tpl('dark-cover').build({
      kicker: 'Khối căn hộ dịch vụ lưu trú 5 sao · TTT Architects',
      title: 'DETECH COMPLEX',
      images: [IMG.ensoGarden],
      palette: P,
    }),
    tpl('full-bleed').build({
      kicker: 'Ý niệm chủ đạo · 円相 ENSŌ',
      title: 'Một nét vẽ tròn — màu xanh của sự sống',
      images: [IMG.ensoCircle],
      palette: P,
    }),
    tpl('grid4-philosophy').build({
      kicker: 'Từ một vòng tròn',
      title: 'Bốn giá trị · Bốn giác quan · Bốn lời giải',
      body: [
        'THIÊN NHIÊN — thị giác — vườn thiền, cây xanh, nước',
        'AN LÀNH — xúc giác — vật liệu mộc, ấm, thật',
        'TĨNH TẠI — thính giác — khoảng lặng, cách âm',
        'TUẦN HOÀN — vận động — vòng của một ngày an trú',
      ],
      images: [IMG.ensoGarden, IMG.meditation, IMG.poolZen, IMG.wellness],
      palette: P,
    }),
    tpl('full-bleed').build({
      kicker: 'Phong cách thiết kế · Simple Geometry · Balance Space',
      title: 'SERENE — điềm tĩnh làm khí chất chủ đạo',
      images: [IMG.lobbyWater],
      palette: P,
    }),
    tpl('grid4-philosophy').build({
      kicker: 'Triết lý dẫn đường',
      title: 'Bốn nguyên lý mỹ học Nhật Bản',
      body: [
        'Wabi-sabi 侘寂 — vẻ đẹp thô mộc: vữa, đá basalt, linen thô',
        'Ma 間 — khoảng trống thành nhạc: đồ đạc dưới 40% sàn',
        'Shakkei 借景 — vay mượn cảnh: kính kịch trần, rèm tre lọc sáng',
        'Omotenashi おもてなし — hiếu khách trọn vẹn từng chi tiết',
      ],
      images: [IMG.matWalnut, IMG.poolZen, IMG.meditation, IMG.lobbyWater],
      palette: P,
    }),
    tpl('moodboard-board').build({
      kicker: 'Không gian sống',
      title: 'Căn hộ Japandi — an trú trong từng nhịp',
      body: ['Phòng khách', 'Phòng ngủ', 'Bếp & đảo', 'Tiện ích wellness'],
      images: [IMG.apt1, IMG.apt2, IMG.apt3, IMG.apt4, IMG.poolZen],
      palette: P,
    }),
    tpl('material-flatlay').build({
      kicker: 'Bảng vật liệu',
      title: 'Chất liệu mộc — đá ấm, gỗ trầm',
      body: ['Đá ấm', 'Gỗ óc chó', 'Travertine', 'Xanh rêu', 'Đồng thau'],
      images: [IMG.matMood, IMG.matTravertine, IMG.matWalnut, IMG.matPalette],
      palette: P,
    }),
    tpl('full-bleed').build({
      kicker: 'Ánh sáng',
      title: 'Ánh sáng khuếch tán, dịu như sương',
      images: [IMG.loungeGreen],
      palette: P,
    }),
    tpl('closing-thanks').build({
      kicker: 'DETECH COMPLEX · TTT ARCHITECTS',
      title: 'Trân trọng cảm ơn',
      images: [IMG.towerDusk],
      palette: P,
    }),
  ];

  return {
    id: 'detech-enso',
    brand: 'DETECH · ENSŌ',
    project: 'Detech Complex — Khối căn hộ dịch vụ 5 sao',
    fonts: 'Modern',
    palette: P,
    slides,
    transition: 'slide',
    reveal: 'rise',
  };
}
