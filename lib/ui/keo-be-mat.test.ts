/**
 * lib/ui/keo-be-mat.test.ts — canh HÚT MÉP + NHỚ CHỖ.
 * Chạy: node_modules/.bin/sucrase-node lib/ui/keo-be-mat.test.ts
 *
 * Canh đúng những thứ hỏng thì người dùng MẤT CỬA SỔ hoặc BỊ MÁY GIÀNH QUYỀN — hai lỗi mà mắt
 * chỉ bắt được sau khi đã bực.
 */
import {
  LE_HUT,
  NGUONG_HUT,
  choConDungDuoc,
  datChoAnToan,
  docCho,
  ghiCho,
  hutMep,
  khoaNhoCho,
  xoaCho,
} from './keo-be-mat';
import { LO_RA } from '../nodes/cua-so-cong-cu';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const CUA = { w: 400, h: 300 };
const VUNG = { w: 1440, h: 900 };

/* ---------- HÚT MÉP: NHẸ, KHÔNG HUNG HĂNG ---------- */
{
  console.log('\n[1] hút mép');

  const trai = hutMep({ x: LE_HUT + 5, y: 200 }, CUA, VUNG);
  ok('gần mép trái ⇒ hút vào, và BÁO là đang bám trái',
    trai.viTri.x === LE_HUT && trai.mep.trai === true);

  const phai = hutMep({ x: VUNG.w - LE_HUT - CUA.w - 4, y: 200 }, CUA, VUNG);
  ok('gần mép phải ⇒ hút vào, báo bám phải',
    phai.viTri.x === VUNG.w - LE_HUT - CUA.w && phai.mep.phai === true);

  const tren = hutMep({ x: 600, y: LE_HUT + 6 }, CUA, VUNG);
  ok('gần mép trên ⇒ hút vào, báo bám trên', tren.viTri.y === LE_HUT && tren.mep.tren === true);

  // 🔴 Đây là ca chống "dock hung hăng" — Hoà nêu thẳng.
  const xa = hutMep({ x: LE_HUT + NGUONG_HUT + 8, y: 300 }, CUA, VUNG);
  ok('ĐẶT CÁCH MÉP CÓ CHỦ Ý ⇒ ĐỨNG YÊN, không bị giật vào mép',
    xa.viTri.x === LE_HUT + NGUONG_HUT + 8 && xa.mep.trai === false);

  ok('ngưỡng hút đủ nhỏ để không giành quyền (≤12px)', NGUONG_HUT <= 12);

  // Không hút mép DƯỚI: dán đáy là che thanh trạng thái/dock lệnh.
  const duoi = hutMep({ x: 600, y: VUNG.h - CUA.h - LE_HUT }, CUA, VUNG);
  ok('KHÔNG hút mép dưới — dán đáy là che dock lệnh', duoi.viTri.y === VUNG.h - CUA.h - LE_HUT);
}

/* ---------- KHÔNG CÓ ĐƯỜNG NÀO CHO CỬA SỔ THOÁT KHỎI MÀN ---------- */
{
  console.log('\n[2] luôn với tới được');

  const traiXa = datChoAnToan({ x: -99999, y: -99999 }, CUA, VUNG);
  ok('kéo lố sang trái/lên trên ⇒ vẫn còn mép nắm được',
    traiXa.viTri.x >= LO_RA - CUA.w && traiXa.viTri.y >= 0);

  const phaiXa = datChoAnToan({ x: 99999, y: 99999 }, CUA, VUNG);
  ok('kéo lố sang phải/xuống dưới ⇒ vẫn trong tầm với',
    phaiXa.viTri.x <= VUNG.w - LO_RA && phaiXa.viTri.y <= VUNG.h - LO_RA);

  ok('mép TRÊN không bao giờ âm — âm là mất thanh tiêu đề, hết đường nắm',
    datChoAnToan({ x: 100, y: -500 }, CUA, VUNG).viTri.y >= 0);

  /* 🔴 THỨ TỰ HÚT-RỒI-KẸP: kẹp phải là tiếng nói CUỐI CÙNG. Kiểm bằng ngưỡng hút to bất thường —
     dù hút có kéo đi đâu, kết quả vẫn không được thoát khỏi vùng. */
  const hutTo = hutMep({ x: -300, y: 400 }, CUA, VUNG, 99999);
  const sauKep = datChoAnToan({ x: -300, y: 400 }, CUA, VUNG);
  ok('hút mạnh cỡ nào thì kẹp biên vẫn thắng',
    sauKep.viTri.x >= LO_RA - CUA.w && hutTo.viTri.x === LE_HUT);
}

/* ---------- NHỚ CHỖ ---------- */
{
  console.log('\n[3] nhớ chỗ');

  // localStorage giả — đủ dùng cho hợp đồng đọc/ghi.
  const kho: Record<string, string> = {};
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => (k in kho ? kho[k] : null),
    setItem: (k: string, v: string) => { kho[k] = v; },
    removeItem: (k: string) => { delete kho[k]; },
  };

  ok('khoá lưu mang NGỮ CẢNH — cùng cửa sổ ở hai dự án là hai chỗ nhớ',
    khoaNhoCho('da', 'w') !== khoaNhoCho('db', 'w'));

  ghiCho('da', 'w', { viTri: { x: 120, y: 80 } });
  const doc = docCho('da', 'w');
  ok('ghi rồi đọc lại đúng chỗ', doc?.viTri.x === 120 && doc?.viTri.y === 80);

  ok('ngữ cảnh khác KHÔNG thấy chỗ của ngữ cảnh này', docCho('db', 'w') === null);

  xoaCho('da', 'w');
  ok('xoá rồi thì trả null', docCho('da', 'w') === null);

  // Dữ liệu hỏng KHÔNG được làm sập cửa sổ — thà mở ở chỗ mọc-từ-nguồn còn hơn không mở được.
  kho[khoaNhoCho('da', 'hong')] = '{ khong phai json';
  ok('JSON hỏng ⇒ null, không ném lỗi', docCho('da', 'hong') === null);
  kho[khoaNhoCho('da', 'thieu')] = JSON.stringify({ viTri: { x: 'a', y: 2 } });
  ok('toạ độ không phải số ⇒ null', docCho('da', 'thieu') === null);

  /* 🔴 CA THẬT: nhớ chỗ trên màn 27" rồi mở lại trên laptop 13". Không kiểm lại vùng thì cửa sổ
     nằm ngoài màn, KHÔNG TÀI NÀO với tới. */
  const choToRong = { viTri: { x: 2200, y: 1200 } };
  ok('chỗ nhớ từ màn LỚN ⇒ khai là hết dùng được trên màn nhỏ',
    choConDungDuoc(choToRong, CUA, { w: 1280, h: 800 }) === false);
  ok('chỗ nhớ hợp lệ trên chính màn đó ⇒ vẫn dùng được',
    choConDungDuoc({ viTri: { x: 120, y: 80 } }, CUA, VUNG) === true);
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
