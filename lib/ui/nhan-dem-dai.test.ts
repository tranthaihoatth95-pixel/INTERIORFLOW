/** nhan-dem-dai.test.ts — L2-07: con số trên dải Dự án phải nói đúng nó đếm gì. */
import { nhanDemDai, nhanConThieu, type DemDai } from './nhan-dem-dai';

let ok = 0, fail = 0;
const t = (ten: string, dieu: boolean) => {
  if (dieu) { ok++; console.log('  ok  -', ten); } else { fail++; console.log('  FAIL-', ten); }
};

if (typeof nhanDemDai !== 'function' || typeof nhanConThieu !== 'function') {
  console.error('CỔNG HARNESS ĐỎ — không nạp được lib/ui/nhan-dem-dai.ts');
  process.exit(1);
}
console.log('CỔNG HARNESS XANH.');

const nen = (p: Partial<DemDai> = {}): DemDai => ({
  duAnHien: 2, nhapHien: 0, banVeKhop: 2, banVeNap: 2, tongDuAn: null, dangLoc: false, ...p,
});

// ═══ ca L2-07 nguyên bản: 2 thẻ, 17 dự án thật ═══
const caThat = nen({ duAnHien: 2, tongDuAn: 17 });
t('KHÔNG còn trả "2/2" trần', !nhanDemDai(caThat, false).includes('2/2'));
t('gọi đúng danh từ "dự án"', nhanDemDai(caThat).includes('dự án'));
t('nói ra 15 dự án còn thiếu', nhanConThieu(caThat) === 'còn 15 dự án chưa có bản vẽ');

// ═══ chưa đo được tổng → im, KHÔNG bịa ═══
t('tongDuAn null → không nói gì về phần thiếu', nhanConThieu(nen({ tongDuAn: null })) === null);
t('tổng bằng số đang hiện → không nói thừa', nhanConThieu(nen({ duAnHien: 5, tongDuAn: 5 })) === null);
t('tổng NHỎ hơn số hiện (phạm vi lệch) → không ra số âm',
  nhanConThieu(nen({ duAnHien: 9, tongDuAn: 5 })) === null);

// ═══ đang lọc: x/y HỢP LỆ, nhưng phải nói rõ "đã nạp" ═══
const loc = nen({ dangLoc: true, banVeKhop: 3, banVeNap: 48 });
t('đang lọc → hiện 3/48', nhanDemDai(loc).includes('3/48'));
t('đang lọc → nói rõ "đã nạp", không khẳng định toàn bộ', nhanDemDai(loc).includes('đã nạp'));
t('đang lọc → không chen câu thiếu vào', nhanConThieu({ ...loc, tongDuAn: 17 }) === null);

// ═══ nháp ═══
t('có nháp thì kể ra', nhanDemDai(nen({ duAnHien: 2, nhapHien: 42 })).includes('42 nháp'));
t('không nháp thì không nhắc', !nhanDemDai(nen({ nhapHien: 0 })).includes('nháp'));

// ═══ tài khoản trống thật ═══
t('0 dự án → nói "0 dự án", không im', nhanDemDai(nen({ duAnHien: 0, nhapHien: 0 })) === '0 dự án');

// ═══ EN ═══
t('EN có bản riêng', nhanDemDai(caThat, true) === '2 projects');
t('EN số ít đúng', nhanDemDai(nen({ duAnHien: 1 }), true) === '1 project');
t('EN phần thiếu', nhanConThieu(caThat, true) === '15 more projects with no drawing yet');
t('EN phần thiếu số ít', nhanConThieu(nen({ duAnHien: 16, tongDuAn: 17 }), true) === '1 more project with no drawing yet');

console.log(`\n${ok} ok, ${fail} fail`);
if (fail) process.exit(1);
