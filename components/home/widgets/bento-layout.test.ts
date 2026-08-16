/** Test `bento-layout.ts` — chạy: node_modules/.bin/sucrase-node components/home/widgets/bento-layout.test.ts
 *
 * Phiếu P-X ⑥ đòi: "dãy số ô liền mạch ở MỌI tổ hợp widget ẩn/hiện, CHỨNG MINH BẰNG TEST (không
 * phải nhìn)". Nên test quét ĐỦ 2^6 = 64 tổ hợp cờ × 4 bố cục = 256 ca, không lấy mẫu.
 */
import {
  cellIndexMap,
  visibleCells,
  duAnTileRows,
  bentoFillPercent,
  type HomeCellFlags,
  type HomeLayout,
} from './bento-layout';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  -', name); }
  else { fail++; console.log('  FAIL-', name); }
}

const LAYOUTS: HomeLayout[] = ['bento', 'vua', 'mong', 'stacked'];
const FLAG_KEYS: (keyof HomeCellFlags)[] = ['homNay', 'anhTuan', 'bieuDo', 'mocToi', 'vatLieu', 'dongTin'];

/** 64 tổ hợp cờ — bit i của n bật cờ thứ i. */
function allFlagCombos(): HomeCellFlags[] {
  const out: HomeCellFlags[] = [];
  for (let n = 0; n < 1 << FLAG_KEYS.length; n++) {
    const f = {} as HomeCellFlags;
    FLAG_KEYS.forEach((k, i) => { f[k] = (n & (1 << i)) !== 0; });
    out.push(f);
  }
  return out;
}
const COMBOS = allFlagCombos();

console.log('cellIndexMap() — 256 ca (64 tổ hợp × 4 bố cục): dãy số LIỀN MẠCH 01..0N, không đứt, không trùng');
{
  let batCa = 0;
  let dut = 0;
  let trung = 0;
  let sotO = 0;
  let thuaO = 0;
  for (const layout of LAYOUTS) {
    for (const flags of COMBOS) {
      batCa++;
      const cells = visibleCells(layout, flags);
      const map = cellIndexMap(layout, flags);
      const nums = cells.map((id) => map[id]);
      // ① mọi ô hiện ra đều CÓ số
      if (nums.some((n) => n === undefined)) sotO++;
      // ② không ô ẩn nào lại có số
      if (Object.keys(map).length !== cells.length) thuaO++;
      // ③ liền mạch đúng 01..0N
      const kyVong = cells.map((_, i) => String(i + 1).padStart(2, '0'));
      if (nums.join(',') !== kyVong.join(',')) dut++;
      // ④ không trùng số
      if (new Set(nums).size !== nums.length) trung++;
    }
  }
  ok(`quét đủ 256 ca (thật: ${batCa})`, batCa === 256);
  ok('0 ca dãy số đứt quãng', dut === 0);
  ok('0 ca số trùng nhau', trung === 0);
  ok('0 ca ô hiện ra mà thiếu số', sotO === 0);
  ok('0 ca ô ẩn mà vẫn được cấp số', thuaO === 0);
}

console.log('cellIndexMap() — TÁI HIỆN đúng lỗi ảnh chụp 17/08 rồi chứng minh đã hết');
{
  // Ảnh thật: hasC=false (thiếu 03) · hasG=false (thiếu 07) · lưới tích luỹ KHÔNG số.
  const anhThat: HomeCellFlags = {
    homNay: false, anhTuan: true, bieuDo: true, mocToi: false, vatLieu: true, dongTin: true,
  };
  const map = cellIndexMap('bento', anhThat);
  ok('01 vẫn là Dự án', map.duAn === '01');
  ok('02 vẫn là Chào', map.chao === '02');
  ok('Ảnh tuần dồn lên 03 (trước là 04)', map.anhTuan === '03');
  ok('Biểu đồ chặng dồn lên 04 (trước là 05)', map.bieuDo === '04');
  ok('Ghi chú dồn lên 05 (trước là 06)', map.ghiChu === '05');
  ok('Vật liệu dồn lên 06 (trước là 08)', map.vatLieu === '06');
  ok('Dòng tin/Lưới tích luỹ CÓ số 07 (trước KHÔNG có số nào)', map.dongTin === '07');
  ok('Ô ẩn không có số — Hôm nay', map.homNay === undefined);
  ok('Ô ẩn không có số — Sắp tới', map.mocToi === undefined);
  const day = Object.values(map).sort().join(' ');
  ok(`dãy đọc được liền mạch: ${day}`, day === '01 02 03 04 05 06 07');
}

console.log('cellIndexMap() — bố cục MỎNG chỉ 3 ô, vẫn 01·02·03');
{
  const rong: HomeCellFlags = {
    homNay: false, anhTuan: false, bieuDo: false, mocToi: false, vatLieu: false, dongTin: false,
  };
  const map = cellIndexMap('mong', rong);
  ok('mỏng = đúng 3 ô có số', Object.keys(map).length === 3);
  ok('mỏng: 01 Dự án · 02 Chào · 03 Ghi chú', map.duAn === '01' && map.chao === '02' && map.ghiChu === '03');
}

console.log('cellIndexMap() — bố cục VỪA đặt Ghi chú TRƯỚC các ô phụ (đúng thứ tự render thật)');
{
  const f: HomeCellFlags = {
    homNay: false, anhTuan: false, bieuDo: true, mocToi: false, vatLieu: false, dongTin: false,
  };
  const map = cellIndexMap('vua', f);
  ok('vừa: Ghi chú là 03, Biểu đồ là 04', map.ghiChu === '03' && map.bieuDo === '04');
  // cùng tổ hợp cờ mà ở bento thì thứ tự ngược lại — chứng minh số bám BỐ CỤC, không bám widget
  const mapBento = cellIndexMap('bento', f);
  ok('bento cùng cờ: Biểu đồ 03, Ghi chú 04 (ngược với vừa)', mapBento.bieuDo === '03' && mapBento.ghiChu === '04');
}

console.log('duAnTileRows() — số hàng tile ô Dự án (lưới 4 cột + 1 tile "Dự án mới")');
{
  ok('0 dự án → 1 hàng', duAnTileRows(0) === 1);
  ok('2 dự án (ảnh 17/08) → 1 hàng', duAnTileRows(2) === 1);
  ok('3 dự án → 1 hàng (3+1=4 tile vừa đúng 1 hàng)', duAnTileRows(3) === 1);
  ok('4 dự án → 2 hàng', duAnTileRows(4) === 2);
  ok('8 dự án → 3 hàng', duAnTileRows(8) === 3);
  ok('số rác (NaN) → vẫn 1 hàng, không vỡ', duAnTileRows(NaN) === 1);
  ok('số âm → vẫn 1 hàng, không âm', duAnTileRows(-5) === 1);
}

console.log('bentoFillPercent() — lưới CO khi dữ liệu mỏng, ĐỦ khi dữ liệu dày');
{
  ok('1 hàng tile → lưới 76% màn (phần dư trả cho nền)', bentoFillPercent(1) === 76);
  ok('2 hàng tile → lưới 100% màn', bentoFillPercent(2) === 100);
  ok('3 hàng tile → lưới 100% màn', bentoFillPercent(3) === 100);
  ok('không bao giờ vượt 100%', LAYOUTS.every(() => bentoFillPercent(9) <= 100));
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
