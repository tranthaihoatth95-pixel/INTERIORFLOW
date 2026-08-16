/**
 * lib/ui/thao-tac-glyph.tsx — kho HÌNH MINH HOẠ THAO TÁC cho ô giải nghĩa (`ThaoTacGlyph`).
 *
 * Mỗi hình vẽ ĐỘNG TÁC, không vẽ biểu tượng: khung vật (nét mảnh) + tay nắm + mũi tên chỉ
 * hướng + vệt "trước → sau". Nhìn một cái là biết lệnh đó làm gì với vật đang chọn — đúng
 * NT-10 "học bằng hình: lệnh dựng có minh hoạ trước→sau".
 *
 * ⛔ RÀNG BUỘC PHẠM VI — CẤM DÙNG CÁC SVG NÀY LÀM NÚT.
 * Trong đề xuất tách "icon" thành SÁU LOẠI (00-CHOT 16/08), đây là loại **Hình minh hoạ**:
 * nó vẽ THAO TÁC chứ không định danh một chức năng, và nó **chỉ sống trong ô giải nghĩa**
 * (`<Tooltip hinh={...}>`). Đem làm nút là lẫn hai loại: nút cần một ký hiệu đọc-được-ở-16px
 * kèm nhãn (NT-8/K14), còn hình này cố ý vẽ cả bối cảnh ở khổ 220×110 — thu nhỏ về cỡ nút
 * thì thành một mớ nét. Muốn có nút thì lấy icon lucide + nhãn chữ như mọi nơi khác trong app.
 *
 * ⛔ CẤM MÀU: chỉ `currentColor`. Thẻ tooltip đảo màu theo theme (nền --t1, chữ --bg) và ô hình
 * đảo ngược lại một lần nữa (.if-tooltip-hinh đặt color: --t1) ⇒ nét phải ĂN THEO màu chữ, gõ
 * cứng một hex là hình biến mất ở một trong hai theme. Cũng là luật ③ giao diện (cấm hex).
 *
 * ⛔ KHÔNG file ảnh ngoài: SVG inline, không <img>, không sprite — hình phải sống được cả khi
 * app chạy offline/đóng gói Electron, và phải đổi màu theo theme (ảnh bitmap thì không).
 *
 * Khổ chuẩn 220×110 = đúng khung `.if-tooltip-hinh`. Mọi hình dùng CÙNG viewBox để lướt qua
 * một danh sách lệnh không thấy hình nhảy giật.
 */

// `React` import TƯỜNG MINH dù Next.js không cần (jsx: preserve → automatic runtime):
// test của file này chạy bằng `sucrase-node`, vốn dịch JSX theo lối CỔ ĐIỂN
// (`React.createElement`) nên thiếu import là ném `React is not defined` NGAY LÚC RENDER —
// tsc thì vẫn xanh. Đây là cái giá rẻ để hình được kiểm bằng render thật, không phải bằng
// đọc chuỗi văn bản.
import React from 'react';
import type { ReactElement } from 'react';

/** Tên các thao tác đã có hình. Thêm hình mới thì thêm khoá ở đây — máy sẽ bắt chỗ thiếu. */
export type ThaoTacKey = 'doi' | 'xoay' | 'chep' | 'lat' | 'do' | 'chon';

/** Khổ chuẩn — khai một chỗ, mọi hình dùng chung (khớp `.if-tooltip-hinh` 220×110). */
export const GLYPH_VIEWBOX = '0 0 220 110';

/* Nét: mảnh và đồng đều. 1.4 cho nét chính (khung vật), 1 cho nét phụ (vị trí cũ, đường gióng).
   Không dùng nét dày — hình nằm trong một thẻ nhỏ, nét dày thành mảng đen. */
const NET = 1.4;
const NET_PHU = 1;

interface GlyphProps {
  /** hình nào — xem `ThaoTacKey`. */
  ten: ThaoTacKey;
}

/** Mũi tên dùng chung: định nghĩa MỘT marker cho mỗi hình (id phải khác nhau giữa các hình
 *  vì nhiều tooltip có thể cùng nằm trong DOM — trùng id là mũi tên của hình này ăn màu hình kia). */
function DauMuiTen({ id }: { id: string }): ReactElement {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 z" fill="currentColor" />
      </marker>
    </defs>
  );
}

/** Khung vật mẫu — hình chữ nhật bo nhẹ, dùng lại ở mọi glyph để mắt nhận ra "cùng một vật". */
function Vat({ x, y, w = 54, h = 40, mo = false }: { x: number; y: number; w?: number; h?: number; mo?: boolean }): ReactElement {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={4}
      fill="none"
      stroke="currentColor"
      strokeWidth={mo ? NET_PHU : NET}
      strokeDasharray={mo ? '4 3' : undefined}
      /* 0.55 chứ không 0.45: đo trên nền SÁNG, .45 chỉ đạt 2,74:1 — nét vị trí cũ gần như
         biến mất. .55 lên 3,62:1, vẫn rõ là "mờ hơn vật chính" mà không mất hẳn. */
      opacity={mo ? 0.55 : 1}
    />
  );
}

/** Tay nắm ở 4 góc — dấu hiệu "vật đang được chọn/kéo". */
function TayNam({ x, y, w = 54, h = 40 }: { x: number; y: number; w?: number; h?: number }): ReactElement {
  const g = 3;
  const pts: Array<[number, number]> = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  return (
    <>
      {pts.map(([cx, cy], i) => (
        <rect key={i} x={cx - g} y={cy - g} width={g * 2} height={g * 2} fill="currentColor" />
      ))}
    </>
  );
}

/**
 * `ThaoTacGlyph` — một hình minh hoạ thao tác. Dùng qua `<Tooltip hinh={<ThaoTacGlyph ten="doi" />}>`.
 * KHÔNG bọc thành nút (xem ràng buộc ở đầu file).
 */
export function ThaoTacGlyph({ ten }: GlyphProps): ReactElement {
  const mid = `mt-${ten}`;
  const chung = {
    viewBox: GLYPH_VIEWBOX,
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
    focusable: 'false' as const,
    role: 'presentation' as const,
  };

  switch (ten) {
    /* DỜI — vật cũ mờ ở trái, vật mới đặc ở phải, mũi tên nối tâm sang tâm. */
    case 'doi':
      return (
        <svg {...chung}>
          <DauMuiTen id={mid} />
          <Vat x={26} y={35} mo />
          <Vat x={140} y={35} />
          <TayNam x={140} y={35} />
          <line x1={88} y1={55} x2={132} y2={55} stroke="currentColor" strokeWidth={NET} markerEnd={`url(#${mid})`} />
        </svg>
      );

    /* XOAY — vật nghiêng quanh một tâm, cung tròn + mũi tên chỉ chiều quay. */
    case 'xoay':
      return (
        <svg {...chung}>
          <DauMuiTen id={mid} />
          <Vat x={46} y={38} mo />
          <g transform="rotate(-28 73 58)">
            <Vat x={46} y={38} />
            <TayNam x={46} y={38} />
          </g>
          <circle cx={73} cy={58} r={2.6} fill="currentColor" />
          <path
            d="M132 76 A30 30 0 0 0 132 34"
            fill="none"
            stroke="currentColor"
            strokeWidth={NET}
            markerEnd={`url(#${mid})`}
          />
        </svg>
      );

    /* CHÉP — vật gốc, bản sao lệch chồng lên, dấu + ở bản mới. */
    case 'chep':
      return (
        <svg {...chung}>
          <DauMuiTen id={mid} />
          <Vat x={34} y={30} />
          <TayNam x={34} y={30} />
          <Vat x={120} y={44} />
          <line x1={94} y1={45} x2={114} y2={54} stroke="currentColor" strokeWidth={NET} markerEnd={`url(#${mid})`} />
          <line x1={147} y1={57} x2={161} y2={57} stroke="currentColor" strokeWidth={NET} />
          <line x1={154} y1={50} x2={154} y2={64} stroke="currentColor" strokeWidth={NET} />
        </svg>
      );

    /* LẬT (đối xứng) — trục gạch đứng giữa, vật hai bên soi gương nhau. */
    case 'lat':
      return (
        <svg {...chung}>
          <Vat x={36} y={35} w={48} />
          <TayNam x={36} y={35} w={48} />
          <line
            x1={110}
            y1={18}
            x2={110}
            y2={92}
            stroke="currentColor"
            strokeWidth={NET_PHU}
            strokeDasharray="5 4"
          />
          <g transform="translate(220 0) scale(-1 1)">
            <Vat x={36} y={35} w={48} mo />
          </g>
          <path d="M96 55 l-8 -5 v10 z" fill="currentColor" />
          <path d="M124 55 l8 -5 v10 z" fill="currentColor" />
        </svg>
      );

    /* ĐO — đường gióng hai đầu + đường kích thước có mũi tên hai chiều + chỗ trống ghi số. */
    case 'do':
      return (
        <svg {...chung}>
          <DauMuiTen id={mid} />
          <Vat x={44} y={26} w={112} h={44} mo />
          <line x1={44} y1={70} x2={44} y2={92} stroke="currentColor" strokeWidth={NET_PHU} />
          <line x1={156} y1={70} x2={156} y2={92} stroke="currentColor" strokeWidth={NET_PHU} />
          <line
            x1={44}
            y1={84}
            x2={156}
            y2={84}
            stroke="currentColor"
            strokeWidth={NET}
            markerStart={`url(#${mid})`}
            markerEnd={`url(#${mid})`}
          />
          <rect x={86} y={76} width={28} height={16} rx={3} fill="currentColor" opacity={0.16} />
        </svg>
      );

    /* CHỌN — con trỏ mũi tên chạm vào vật, vật hiện tay nắm 4 góc. */
    case 'chon':
    default:
      return (
        <svg {...chung}>
          <Vat x={62} y={32} w={68} h={46} />
          <TayNam x={62} y={32} w={68} h={46} />
          <path
            d="M112 58 l0 26 l6 -7 l5 10 l5 -2 l-5 -10 l9 -1 z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={NET_PHU}
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/** Danh sách khoá — để màn duyệt/kiểm liệt kê đủ hình mà không phải gõ tay lần hai. */
export const THAO_TAC_KEYS: ThaoTacKey[] = ['doi', 'xoay', 'chep', 'lat', 'do', 'chon'];

/**
 * Nhãn song ngữ của từng hình — dùng cho màn duyệt mắt và cho `label` khi ô giải nghĩa
 * đứng một mình. Chuỗi lộ ra UI phải có cả VI/EN (luật song ngữ).
 */
export const THAO_TAC_NHAN: Record<ThaoTacKey, { vi: string; en: string }> = {
  doi: { vi: 'Dời', en: 'Move' },
  xoay: { vi: 'Xoay', en: 'Rotate' },
  chep: { vi: 'Chép', en: 'Copy' },
  lat: { vi: 'Lật đối xứng', en: 'Mirror' },
  do: { vi: 'Đo', en: 'Measure' },
  chon: { vi: 'Chọn', en: 'Select' },
};
