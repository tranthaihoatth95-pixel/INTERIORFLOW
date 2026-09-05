/**
 * lib/ui/icon/IfIcon.tsx — BỘ KÝ HIỆU RIÊNG CỦA IF. Hai họ, một ngữ pháp.
 *
 *   HỌ CHUNG (12) — việc mà phần mềm nào cũng có: tổng quan · việc · trò chuyện · tệp …
 *   HỌ NGHỀ  (9)  — ký hiệu BẢN VẼ mà kiến trúc sư đọc được TRƯỚC khi mở IF:
 *                   tường cắt · cửa có cánh mở · cửa sổ · trục bong bóng · cốt cao độ ·
 *                   mặt cắt · thước tỷ lệ · hoa gió · bắt điểm.
 *
 * Năm ký hiệu nghề đầu tiên KHÔNG do tôi chọn: `docs/CHUAN-DAU-RA-NGHE.md:39` liệt kê
 * "ký hiệu tối thiểu" của một bản vẽ đạt chuẩn — *cửa có cánh mở · cốt ±0.000 · hoa gió ·
 * trục bong bóng · thước tỷ lệ*. Bộ ký hiệu chỉ việc nói đúng thứ tiếng hồ sơ đã nói.
 *
 * ⭐ HAI HỌ CHUNG MỘT LUẬT — riêng ở NGỮ VỰNG, không riêng ở LUẬT:
 *   cùng lưới 16 · cùng vùng an toàn 14 · cùng hình khoá · cùng đầu nét vuông + góc nhọn.
 *   Khác biệt DUY NHẤT: họ chung dùng MỘT bề dày nét (`cat`); họ nghề dùng CẶP nét
 *   `cat` : `thay` = 2 : 1 — vì bản vẽ dùng bề dày nét để phân biệt *cái bị cắt qua* với
 *   *cái chỉ nhìn thấy*. Đó là ngữ pháp thật của hồ sơ kỹ thuật, không phải hiệu ứng.
 *   Tỉ lệ 2:1 lấy từ bảng nét của chính IF (`lib/three/section-entities.ts:61-63`).
 *
 * ⛔ CẤM MÀU GÕ CỨNG: chỉ `currentColor`. Ký hiệu sống trên cả hai nền sáng/tối; một mã màu
 *    là biến mất ở một nền (cùng luật với `lib/ui/thao-tac-glyph.tsx`).
 * ⛔ CẤM CỠ NGOÀI `THANG_CO`. Ba mươi lăm cỡ đang có chính là gốc bệnh — xem `he-so.ts`.
 * ⛔ KHÔNG tệp ảnh ngoài: SVG nội tuyến, để chạy được khi đóng gói Electron và đổi màu
 *    theo nền.
 *
 * KHÁC `lib/ui/thao-tac-glyph.tsx` — hai loại khác nhau trong bảng bảy loại (00-CHOT 16/08):
 *   kho kia là **Hình minh hoạ** (vẽ THAO TÁC, khổ 220×110, chỉ sống trong ô giải nghĩa,
 *   cấm làm nút). Tệp này là **Icon giao diện** + **Ký hiệu nghề** — định danh một chức
 *   năng, đọc được ở 16px, ĐƯỢC làm nút, và theo NT-8 thì luôn đi kèm nhãn chữ.
 */

// `React` nhập TƯỜNG MINH: test chạy bằng `sucrase-node`, vốn dịch JSX theo lối cổ điển
// (`React.createElement`) — thiếu dòng này là ném lỗi lúc render, trong khi tsc vẫn xanh.
import React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { LUOI, NET, BO, DAU_NET, GOC_NOI, THANG_CO, type CoIcon } from './he-so';

export type HoIcon = 'chung' | 'nghe';

export type TenIcon =
  // ── họ chung (12) — đúng 12 mục thanh điều hướng đang khai ở components/nav/muc-dieu-huong.ts
  | 'tong-quan' | 'bang-viec' | 'tro-chuyen' | 'tep' | 'thu-vien' | 'du-an'
  | 'ghi-chu' | 'thiet-ke-2d' | 'thiet-ke-3d' | 'trinh-chieu' | 'ca-nhan' | 'cai-dat'
  // ── họ nghề (9) — ký hiệu bản vẽ
  | 'tuong' | 'cua' | 'cua-so' | 'truc' | 'cao-do' | 'mat-cat' | 'ty-le' | 'hoa-gio' | 'bat-diem';

export const TEN_ICON: readonly TenIcon[] = [
  'tong-quan', 'bang-viec', 'tro-chuyen', 'tep', 'thu-vien', 'du-an',
  'ghi-chu', 'thiet-ke-2d', 'thiet-ke-3d', 'trinh-chieu', 'ca-nhan', 'cai-dat',
  'tuong', 'cua', 'cua-so', 'truc', 'cao-do', 'mat-cat', 'ty-le', 'hoa-gio', 'bat-diem',
] as const;

export const HO_CUA_ICON: Record<TenIcon, HoIcon> = {
  'tong-quan': 'chung', 'bang-viec': 'chung', 'tro-chuyen': 'chung', 'tep': 'chung',
  'thu-vien': 'chung', 'du-an': 'chung', 'ghi-chu': 'chung', 'thiet-ke-2d': 'chung',
  'thiet-ke-3d': 'chung', 'trinh-chieu': 'chung', 'ca-nhan': 'chung', 'cai-dat': 'chung',
  'tuong': 'nghe', 'cua': 'nghe', 'cua-so': 'nghe', 'truc': 'nghe', 'cao-do': 'nghe',
  'mat-cat': 'nghe', 'ty-le': 'nghe', 'hoa-gio': 'nghe', 'bat-diem': 'nghe',
};

/** Nhãn song ngữ. NT-8: ký hiệu LUÔN có nhãn — nhãn sống ở đây để mọi mặt tiền dùng chung
 *  một chữ, không mỗi thanh công cụ tự đặt một tên. */
export const NHAN_ICON: Record<TenIcon, { vi: string; en: string }> = {
  'tong-quan': { vi: 'Tổng quan', en: 'Overview' },
  'bang-viec': { vi: 'Bảng việc', en: 'Tasks' },
  'tro-chuyen': { vi: 'Trò chuyện', en: 'Chat' },
  'tep': { vi: 'Tệp', en: 'Files' },
  'thu-vien': { vi: 'Thư viện', en: 'Library' },
  'du-an': { vi: 'Dự án', en: 'Projects' },
  'ghi-chu': { vi: 'Ghi chú', en: 'Notes' },
  'thiet-ke-2d': { vi: 'Thiết kế 2D', en: '2D Design' },
  'thiet-ke-3d': { vi: 'Thiết kế 3D', en: '3D Design' },
  'trinh-chieu': { vi: 'Trình chiếu', en: 'Presenting' },
  'ca-nhan': { vi: 'Cá nhân', en: 'Account' },
  'cai-dat': { vi: 'Cài đặt', en: 'Settings' },
  'tuong': { vi: 'Tường', en: 'Wall' },
  'cua': { vi: 'Cửa', en: 'Door' },
  'cua-so': { vi: 'Cửa sổ', en: 'Window' },
  'truc': { vi: 'Trục', en: 'Grid axis' },
  'cao-do': { vi: 'Cao độ', en: 'Level' },
  'mat-cat': { vi: 'Mặt cắt', en: 'Section' },
  'ty-le': { vi: 'Tỷ lệ', en: 'Scale' },
  'hoa-gio': { vi: 'Hoa gió', en: 'North' },
  'bat-diem': { vi: 'Bắt điểm', en: 'Snap' },
};

/* ─────────────────────────────────────────────────────────────────────────────────────
   NÉT VẼ — hai bề dày, khai một chỗ.
   `c` = nét CẮT (chính, 1 đơn vị) · `t` = nét THẤY (phụ, 0,5) — tỉ lệ 2:1.
   Toạ độ nằm trên bội số 0,5: nét 1 đơn vị có tâm ở x,5 thì hai mép rơi đúng vào số
   nguyên ⇒ ăn lưới điểm ảnh ở cả 1× lẫn 2×.
   ───────────────────────────────────────────────────────────────────────────────────── */
const c = { strokeWidth: NET.cat } as const;
const t = { strokeWidth: NET.thay } as const;
const dac = { fill: 'currentColor', stroke: 'none' } as const;

function HINH(ten: TenIcon): ReactNode {
  switch (ten) {
    /* ── HỌ CHUNG ─────────────────────────────────────────────────────────────────── */
    case 'tong-quan': // bốn ô — đúng hình khoá VUÔNG 12×12 (mép ngoài 2…14)
      return (<>
        <rect x={2.5} y={2.5} width={4.5} height={4.5} rx={BO} {...c} />
        <rect x={9} y={2.5} width={4.5} height={4.5} rx={BO} {...c} />
        <rect x={2.5} y={9} width={4.5} height={4.5} rx={BO} {...c} />
        <rect x={9} y={9} width={4.5} height={4.5} rx={BO} {...c} />
      </>);
    case 'bang-viec': // ô đánh dấu + dòng việc
      return (<>
        <rect x={1.5} y={3} width={4} height={4} rx={BO} {...c} />
        <path d="M2.5 5 L3.5 6 L4.5 4" {...c} />
        <path d="M7.5 5 H14.5" {...c} />
        <rect x={1.5} y={9} width={4} height={4} rx={BO} {...c} />
        <path d="M7.5 11 H14.5" {...c} />
      </>);
    case 'tro-chuyen': // khung thoại + đuôi
      return (<>
        <path d="M1.5 11.5 V3.5 H14.5 V11.5 H6.5 L3.5 14 V11.5 Z" {...c} />
      </>);
    case 'tep': // cặp tài liệu
      return (<>
        <path d="M1.5 12.5 V3.5 H6 L7.5 5.5 H14.5 V12.5 Z" {...c} />
      </>);
    case 'thu-vien': // ba gáy sách đứng — hình khoá VUÔNG
      return (<>
        <rect x={2.5} y={2.5} width={3} height={11} {...c} />
        <rect x={6.5} y={2.5} width={3} height={11} {...c} />
        <rect x={10.5} y={2.5} width={3} height={11} {...c} />
        <path d="M2.5 6 H5.5 M6.5 6 H9.5 M10.5 6 H13.5" {...t} />
      </>);
    case 'du-an': // khối nhà chính + khối phụ, ô cửa vẽ ĐẶC (nét rỗng 0,5 sẽ mất ở 16px)
      return (<>
        <path d="M2.5 13.5 V2.5 H9.5 V13.5" {...c} />
        <path d="M9.5 13.5 V6.5 H13.5 V13.5" {...c} />
        <path d="M1.5 13.5 H14.5" {...c} />
        <rect x={4} y={4.5} width={1} height={1} {...dac} />
        <rect x={7} y={4.5} width={1} height={1} {...dac} />
        <rect x={4} y={7.5} width={1} height={1} {...dac} />
        <rect x={7} y={7.5} width={1} height={1} {...dac} />
        <rect x={11} y={8.5} width={1} height={1} {...dac} />
      </>);
    case 'ghi-chu': // trang giấy + gáy đóng + dòng chữ
      return (<>
        <path d="M4.5 1.5 H13.5 V14.5 H4.5 Z" {...c} />
        <path d="M2.5 4 H6.5 M2.5 8 H6.5 M2.5 12 H6.5" {...t} />
        <path d="M8 5 H11.5 M8 8 H11.5 M8 11 H11.5" {...t} />
      </>);
    case 'thiet-ke-2d': // MẢNH MẶT BẰNG — tường cắt khép góc, chừa một ô cửa
      return (<>
        <path d="M1.5 14.5 V1.5 H14.5" {...c} />
        <path d="M1.5 14.5 H6" {...c} />
        <path d="M9.5 14.5 H14.5 V9" {...c} />
        <path d="M6 14.5 A3.5 3.5 0 0 0 9.5 11" {...t} />
        <path d="M6 14.5 V11" {...c} />
      </>);
    case 'thiet-ke-3d': // khối lập phương trục đo
      return (<>
        <path d="M8 1.5 L14 5 V11 L8 14.5 L2 11 V5 Z" {...c} />
        <path d="M8 8 L14 5 M8 8 L2 5 M8 8 V14.5" {...t} />
      </>);
    case 'trinh-chieu': // màn chiếu + chân
      return (<>
        <rect x={1.5} y={2.5} width={13} height={8} {...c} />
        <path d="M8 10.5 V13 M5 14.5 L8 13 L11 14.5" {...c} />
      </>);
    case 'ca-nhan': // đầu + vai
      return (<>
        <circle cx={8} cy={5.5} r={3} {...c} />
        <path d="M2.5 14.5 A5.5 5.5 0 0 1 13.5 14.5" {...c} />
      </>);
    case 'cai-dat': // bánh răng SÁU răng — sáu là ngưỡng còn đọc được ở 16px
      return (<>
        <circle cx={8} cy={8} r={4} {...c} />
        <circle cx={8} cy={8} r={1} {...dac} />
        <path d="M8 4 V1.5 M8 12 V14.5 M11.46 6 L13.63 4.75 M4.54 10 L2.37 11.25 M11.46 10 L13.63 11.25 M4.54 6 L2.37 4.75" {...c} />
      </>);

    /* ── HỌ NGHỀ — dùng CẶP nét cắt/thấy 2:1 ─────────────────────────────────────── */
    case 'tuong': // TƯỜNG CẮT: hai mặt tường (nét cắt) + gạch chéo poché (nét thấy)
      return (<>
        <path d="M1.5 5.5 H14.5 M1.5 10.5 H14.5" {...c} />
        <path d="M3 10.5 L8 5.5 M6.5 10.5 L11.5 5.5 M10 10.5 L14.5 6" {...t} />
      </>);
    case 'cua': // CỬA CÓ CÁNH MỞ: tường cắt hai bên · cánh cửa · cung quét
      return (<>
        <path d="M1.5 10.5 H4 M12 10.5 H14.5" {...c} />
        <path d="M4 10.5 V2.5" {...c} />
        <path d="M4 2.5 A8 8 0 0 1 12 10.5" {...t} />
      </>);
    case 'cua-so': // CỬA SỔ: tường cắt ngắt quãng · khung · hai nét kính
      return (<>
        <path d="M1.5 5.5 H4.5 M11.5 5.5 H14.5 M1.5 10.5 H4.5 M11.5 10.5 H14.5" {...c} />
        <path d="M4.5 5.5 V10.5 M11.5 5.5 V10.5" {...c} />
        <path d="M4.5 7.5 H11.5 M4.5 9 H11.5" {...t} />
      </>);
    case 'truc': // TRỤC BONG BÓNG: vòng tròn rỗng (chữ trục là DỮ LIỆU) + nét chấm gạch
      return (<>
        <circle cx={8} cy={4} r={2.5} {...c} />
        <path d="M8 6.5 V14.5" {...t} strokeDasharray="3 1 0.5 1" />
      </>);
    case 'cao-do': // CỐT CAO ĐỘ: đường gióng chuẩn (nét THẤY) + tam giác nửa đặc (±0.000)
      // Đường chuẩn là đường GIÓNG, không phải cạnh vật bị cắt ⇒ phải mảnh. Test [8] bắt
      // được chỗ này lúc nó còn vẽ bằng nét cắt: sai bề dày là sai NGHĨA, không phải sai gu.
      return (<>
        <path d="M1.5 10 H14.5" {...t} />
        <path d="M5 6 H11 L8 10 Z" {...c} />
        <path d="M8 6 H11 L8 10 Z" {...dac} />
      </>);
    case 'mat-cat': // KÝ HIỆU MẶT CẮT: hai đoạn cắt ĐẬM ở hai đầu · đoạn giữa MẢNH ngắt
      // quãng · hai mũi chỉ hướng nhìn. Đúng quy ước: chỉ hai đầu tuyến cắt vẽ đậm, thân
      // tuyến để mảnh/ngắt cho khỏi che bản vẽ.
      return (<>
        <path d="M5 1.5 V6 M5 10 V14.5" {...c} />
        <path d="M5 6 V10" {...t} strokeDasharray="1.5 1" />
        <path d="M6 2.5 L9.5 4.25 L6 6 Z" {...dac} />
        <path d="M6 10 L9.5 11.75 L6 13.5 Z" {...dac} />
      </>);
    case 'ty-le': // THƯỚC TỶ LỆ: bốn ô so le + vạch chia
      return (<>
        <rect x={2} y={6} width={12} height={3.5} {...c} />
        <rect x={5} y={6} width={3} height={3.5} {...dac} />
        <rect x={11} y={6} width={3} height={3.5} {...dac} />
        <path d="M2 9.5 V11.5 M5 9.5 V11 M8 9.5 V11.5 M11 9.5 V11 M14 9.5 V11.5" {...t} />
      </>);
    case 'hoa-gio': // HOA GIÓ: kim chỉ bắc nửa đặc trong vòng định hướng
      return (<>
        <circle cx={8} cy={8} r={5.5} {...t} />
        <path d="M8 2 L11 13 L8 10.5 L5 13 Z" {...c} />
        <path d="M8 2 L11 13 L8 10.5 Z" {...dac} />
      </>);
    case 'bat-diem': // BẮT ĐIỂM: ô vuông bắt điểm kiểu CAD + trục gióng
      return (<>
        <path d="M8 1.5 V5.5 M8 10.5 V14.5 M1.5 8 H5.5 M10.5 8 H14.5" {...t} />
        <rect x={5.5} y={5.5} width={5} height={5} {...c} />
      </>);
  }
}

export interface IfIconProps {
  ten: TenIcon;
  /** Cỡ render. CHỈ nhận bốn nấc của `THANG_CO`. */
  co?: CoIcon;
  /**
   * Nhãn cho trình đọc màn hình. Có nhãn ⇒ `role="img"`; KHÔNG có ⇒ `aria-hidden`.
   * Chỗ ký hiệu đứng cạnh chữ đã nói cùng một điều (đúng NT-8) thì BỎ TRỐNG — để nguyên
   * là trình đọc màn hình đọc hai lần.
   */
  nhan?: string;
  className?: string;
}

export function IfIcon({ ten, co = 16, nhan, className }: IfIconProps): ReactElement {
  const anDi = !nhan;
  return (
    <svg
      width={co}
      height={co}
      viewBox={`0 0 ${LUOI} ${LUOI}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap={DAU_NET}
      strokeLinejoin={GOC_NOI}
      role={anDi ? undefined : 'img'}
      aria-label={nhan}
      aria-hidden={anDi || undefined}
      focusable="false"
    >
      {HINH(ten)}
    </svg>
  );
}

/** Cỡ có nằm trong thang không — dùng cho test và cho máy soi về sau. */
export function coHopLe(co: number): co is CoIcon {
  return (THANG_CO as readonly number[]).includes(co);
}
