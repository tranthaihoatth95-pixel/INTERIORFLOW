/**
 * lib/nodes/cua-so-cong-cu.test.ts — chạy:
 *   node_modules/.bin/sucrase-node lib/nodes/cua-so-cong-cu.test.ts
 *
 * Canh ba thứ dễ trôi nhất của **cửa sổ công cụ**:
 *  ① thang ba nấc KHÔNG cuộn vòng (lỡ tay ở nấc cuối không được rơi về nấc đầu);
 *  ② cửa sổ nổi KHÔNG kéo lọt hẳn ra ngoài vùng làm việc (mất tích = không có đường gọi lại);
 *  ③ danh sách cửa sổ công cụ ĐỌC từ `TASK_CARDS`, không phải bản chép — thêm thẻ việc là có
 *    ngay, và ngược lại không có cửa sổ nào trỏ vào thẻ không tồn tại.
 * Kèm ④ định nghĩa kết quả ghép đủ ba mảnh mà KHÔNG cần trường mới.
 */
import {
  THANG_CAP,
  NHAN_CAP,
  capKe,
  capTruoc,
  ghimTrongVung,
  LO_RA,
  theViecChoDefType,
  laCuaSoCongCu,
  khoaCuaSoNode,
  khoaCuaSoThe,
  KHUNG_VUA,
  KHUNG_VUA_MIN,
  MOI_TRUONG,
  LENH_CHUNG,
  lenhTrongCua,
  lenhSaiKhongGian,
  lenhDamChan,
  type CapCuaSo,
  type MaMoiTruong,
} from './cua-so-cong-cu';
import { dinhNghiaKetQua, dongDinhNghia, TEN_LOAI } from './dinh-nghia-ket-qua';
import { TASK_CARDS } from '../render-studio/task-cards';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

console.log('lib/nodes/cua-so-cong-cu.test.ts');

// ① thang ba nấc
ok('thang đúng 3 nấc, đúng thứ tự', THANG_CAP.join(',') === 'thu,vua,toanMan');
ok('capKe: thu → vua', capKe('thu') === 'vua');
ok('capKe: vua → toanMan', capKe('vua') === 'toanMan');
ok('capKe ở nấc cuối ĐỨNG YÊN, không cuộn vòng', capKe('toanMan') === 'toanMan');
ok('capTruoc: toanMan → vua', capTruoc('toanMan') === 'vua');
ok('capTruoc ở nấc đầu ĐỨNG YÊN', capTruoc('thu') === 'thu');
ok(
  'mọi nấc đều có nhãn song ngữ (không nấc nào câm)',
  THANG_CAP.every((c: CapCuaSo) => NHAN_CAP[c].vi.length > 0 && NHAN_CAP[c].en.length > 0),
);
ok('khung nấc vừa lớn hơn trần dưới ở cả hai chiều', KHUNG_VUA.w > KHUNG_VUA_MIN.w && KHUNG_VUA.h > KHUNG_VUA_MIN.h);

// ② ghim trong vùng
const cua = { w: 640, h: 420 };
const vung = { w: 1440, h: 900 };
ok('vị trí hợp lệ giữ nguyên', JSON.stringify(ghimTrongVung({ x: 200, y: 100 }, cua, vung)) === '{"x":200,"y":100}');
ok('kéo quá mép PHẢI vẫn còn lò ra để nắm', ghimTrongVung({ x: 9999, y: 10 }, cua, vung).x === vung.w - LO_RA);
ok('kéo quá mép DƯỚI vẫn còn lò ra để nắm', ghimTrongVung({ x: 10, y: 9999 }, cua, vung).y === vung.h - LO_RA);
ok('kéo lên trên KHÔNG cho âm (mất thanh tiêu đề là hết đường nắm)', ghimTrongVung({ x: 10, y: -500 }, cua, vung).y === 0);
ok(
  'kéo sang trái quá tay vẫn chừa đúng LO_RA nhìn thấy',
  ghimTrongVung({ x: -9999, y: 10 }, cua, vung).x === LO_RA - cua.w,
);
ok(
  'vùng bé hơn cửa sổ vẫn ra số hợp lệ, không NaN',
  Number.isFinite(ghimTrongVung({ x: 0, y: 0 }, cua, { w: 10, h: 10 }).x),
);

// ③ danh sách đọc từ TASK_CARDS — không phải bản chép
ok('node của thẻ đầu tiên nhận ra là cửa sổ công cụ', laCuaSoCongCu(TASK_CARDS[0].nodeType));
ok('trả đúng cardId, không phải nodeType', theViecChoDefType(TASK_CARDS[0].nodeType) === TASK_CARDS[0].id);
ok('node thường KHÔNG phải cửa sổ công cụ', !laCuaSoCongCu('input.image'));
ok('defType bịa trả null, không nổ', theViecChoDefType('khong.co.that') === null);
ok(
  'MỌI thẻ việc đều có cửa sổ công cụ (không thẻ nào rớt)',
  TASK_CARDS.every((c) => theViecChoDefType(c.nodeType) === c.id),
);
ok('khoá node và khoá thẻ không đụng nhau', khoaCuaSoNode('x') !== khoaCuaSoThe('x'));

// ④ định nghĩa kết quả — ba mảnh, không trường mới
const congRa = [
  { id: 'image', label: 'Ảnh render', dataType: 'image' as const },
  { id: 'text', label: 'Ghi chú', dataType: 'text' as const },
];
const chuaChay = dinhNghiaKetQua('n2', 'ai.sketch2render', congRa, null, [{ source: 'n1', target: 'n2' }]);
ok('mỗi cổng ra một định nghĩa', chuaChay.length === 2);
ok('loại lấy từ cổng', chuaChay[0].loai === 'image');
ok('vai trò lấy nhãn cổng', chuaChay[0].vaiTro === 'Ảnh render');
ok('nguồn gốc là defType node sinh ra', chuaChay[0].nguonGoc === 'ai.sketch2render');
ok('nuôi bởi node cấp trên theo dây thật', chuaChay[0].nuoiBoi.join(',') === 'n1');
ok('CHƯA chạy vẫn CÓ định nghĩa (nối dây trước, chạy sau)', chuaChay[0].coGiaTri === false);

const daChay = dinhNghiaKetQua('n2', 'ai.sketch2render', congRa, {
  image: { dataType: 'image', value: 'data:image/png;base64,x' },
});
ok('cổng đã có giá trị → coGiaTri true', daChay[0].coGiaTri === true);
ok('cổng chưa có giá trị vẫn false, không lây', daChay[1].coGiaTri === false);
ok('không dây nối thì nuôiBoi rỗng, không undefined', Array.isArray(daChay[0].nuoiBoi) && daChay[0].nuoiBoi.length === 0);

ok('dòng định nghĩa VI đọc được', dongDinhNghia(daChay[0], true) === 'Ảnh · Ảnh render · đã có');
ok('dòng định nghĩa EN đọc được', dongDinhNghia(chuaChay[0], false) === 'Image · Ảnh render · not run yet');
ok(
  'mọi kiểu dữ liệu đều có tên người-đọc-được (không kiểu nào lộ khoá kỹ thuật)',
  (['image', 'text', 'mask', 'number', 'video', 'table'] as const).every(
    (k) => TEN_LOAI[k].vi.length > 0 && TEN_LOAI[k].en.length > 0,
  ),
);

// ⑤ RANH GIỚI HAI TẦNG — thứ khiến thanh chung và cửa sổ công cụ KHÔNG ĐÁ NHAU.
//    Đây là phần đáng canh nhất của cả tệp: nó không kiểm một phép tính, nó kiểm một LUẬT KIẾN
//    TRÚC. Không có test này thì "lệnh chuyên sâu không tràn ra thanh chung" chỉ là câu dặn
//    trong docstring, và câu dặn thì đợt sau ai cũng có lý do chính đáng để phá.
const MOI_TRUONG_MA: MaMoiTruong[] = ['anh', 'video', 'ba-chieu', 'ban-bac'];

ok('mọi môi trường khai trong bảng đều tự khai đúng mã', MOI_TRUONG_MA.every((m) => MOI_TRUONG[m]?.ma === m));
ok(
  'môi trường nào cũng có tên + mô tả song ngữ (không cái nào câm)',
  MOI_TRUONG_MA.every((m) => MOI_TRUONG[m].ten.vi && MOI_TRUONG[m].ten.en && MOI_TRUONG[m].moTa.vi && MOI_TRUONG[m].moTa.en),
);
ok(
  'môi trường nào cũng có ÍT NHẤT 1 vệ tinh (cửa sổ trần thì không phải môi trường làm việc)',
  MOI_TRUONG_MA.every((m) => MOI_TRUONG[m].veTinh.length >= 1),
);
ok(
  'vệ tinh nào cũng mang lệnh (panel rỗng là panel giả)',
  MOI_TRUONG_MA.every((m) => MOI_TRUONG[m].veTinh.every((v) => v.lenh.length >= 1)),
);
ok(
  'lệnh nào cũng có nhãn song ngữ',
  MOI_TRUONG_MA.every((m) => MOI_TRUONG[m].veTinh.every((v) => v.lenh.every((l) => l.nhan.vi && l.nhan.en))),
);

// ⑤a — mọi lệnh trong cửa sổ đúng không gian tên của môi trường mình.
ok(
  'KHÔNG lệnh nào khai sai không gian tên',
  MOI_TRUONG_MA.every((m) => lenhSaiKhongGian(m).length === 0),
);
// ⑤b — không lệnh nào vừa ở thanh chung vừa ở trong cửa sổ.
ok(
  'KHÔNG lệnh nào giẫm chân thanh chung',
  MOI_TRUONG_MA.every((m) => lenhDamChan(m).length === 0),
);
// ⑤c — hai môi trường khác nhau không dùng chung một id (nếu dùng chung thì nó thuộc bản chất
//      chung, tức phải lên thanh chung — không được nằm trong cửa sổ hai lần).
const tatCaLenhCua = MOI_TRUONG_MA.flatMap((m) => lenhTrongCua(m));
ok('id lệnh trong cửa sổ không trùng nhau giữa các môi trường', new Set(tatCaLenhCua).size === tatCaLenhCua.length);
// ⑤d — thanh chung ngắn. Con số là ngưỡng CẢNH BÁO, không phải chân lý: phình lên thì phải có
//      người đọc lại luật, đó đúng là mục đích.
ok('thanh chung còn ngắn (≤ 8 lệnh) — phình là dấu hiệu ranh giới thủng', LENH_CHUNG.length <= 8);
ok('thanh chung không rỗng', LENH_CHUNG.length > 0);
// ⑤e — chứng minh mệnh đề "chặng không đổi vỏ": hai môi trường khác loại đứng cạnh nhau vẫn
//      dùng CHUNG một thanh chung, khác nhau đúng ở phần trong cửa sổ.
ok(
  'hai môi trường khác loại: phần chung y hệt, phần trong cửa sổ khác hẳn',
  lenhTrongCua('anh').every((id) => !lenhTrongCua('ba-chieu').includes(id)) &&
    lenhDamChan('anh').length === 0 &&
    lenhDamChan('ba-chieu').length === 0,
);

// ⑥ HAI LOẠI CỬA SỔ — khung phải chịu được cửa sổ KHÔNG CÓ CỔNG RA.
//    Công thức "cửa sổ ⇒ luôn đẻ ra sản phẩm" nghe gọn và SAI: cửa sổ thảo luận (moodboard,
//    khung tư duy) cho ra một QUYẾT ĐỊNH, không phải một tệp. Ép nó đẻ tệp là đẻ asset rỗng chỉ
//    để thoả mãn hình dạng dữ liệu — đúng loại "nút giả" §9 cấm.
ok('có ít nhất một cửa sổ SẢN XUẤT', MOI_TRUONG_MA.some((m) => MOI_TRUONG[m].loai === 'san-xuat'));
ok('có ít nhất một cửa sổ THẢO LUẬN', MOI_TRUONG_MA.some((m) => MOI_TRUONG[m].loai === 'thao-luan'));
ok('cửa sổ thảo luận ĐƯỢC PHÉP không có cổng ra', MOI_TRUONG['ban-bac'].coCongRa === false);
ok(
  'cửa sổ sản xuất thì có cổng ra (đầu ra là tệp nối sang công đoạn sau)',
  MOI_TRUONG_MA.filter((m) => MOI_TRUONG[m].loai === 'san-xuat').every((m) => MOI_TRUONG[m].coCongRa),
);
ok(
  'ranh giới lệnh áp CHO CẢ HAI LOẠI, không có ngoại lệ cho cửa sổ thảo luận',
  MOI_TRUONG_MA.every((m) => lenhSaiKhongGian(m).length === 0 && lenhDamChan(m).length === 0),
);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
