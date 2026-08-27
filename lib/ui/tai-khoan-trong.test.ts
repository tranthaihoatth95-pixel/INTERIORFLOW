/**
 * tai-khoan-trong.test.ts — L2-06: lời chào người-mới phải HỎI DỮ LIỆU, không hỏi trình duyệt.
 */
import { doTaiKhoanTrong, duocChaoTuDong } from './tai-khoan-trong';

let ok = 0, fail = 0;
const t = (ten: string, dieu: boolean) => {
  if (dieu) { ok++; console.log('  ok  -', ten); } else { fail++; console.log('  FAIL-', ten); }
};

// ═══ CA 0 · CỔNG HARNESS ═══
if (typeof doTaiKhoanTrong !== 'function' || typeof duocChaoTuDong !== 'function') {
  console.error('CỔNG HARNESS ĐỎ — không nạp được lib/ui/tai-khoan-trong.ts');
  process.exit(1);
}
console.log('CỔNG HARNESS XANH.');

const gia = (body: unknown, okRes = true, nem = false) =>
  (async () => {
    if (nem) throw new Error('mạng chết');
    return { ok: okRes, json: async () => body } as unknown as Response;
  }) as unknown as (u: string, i?: RequestInit) => Promise<Response>;

const run = async () => {
  // ═══ mong THẤY: đo được TRỐNG ═══
  t('projects 0 + flows 0 → trong', await doTaiKhoanTrong(gia({ stats: { projects: 0, flows: 0 } })) === 'trong');

  // ═══ mong THẤY: đo được CÓ DỮ LIỆU ═══
  t('projects 17 → co-du-lieu', await doTaiKhoanTrong(gia({ stats: { projects: 17, flows: 42 } })) === 'co-du-lieu');
  t('projects 0 nhưng flows 3 → co-du-lieu (flow cũng là dấu chân)',
    await doTaiKhoanTrong(gia({ stats: { projects: 0, flows: 3 } })) === 'co-du-lieu');

  // ═══ mọi đường HỎNG đều phải về `chua-biet`, KHÔNG được về `trong` ═══
  t('HTTP không ok → chua-biet', await doTaiKhoanTrong(gia({}, false)) === 'chua-biet');
  t('mạng ném lỗi → chua-biet', await doTaiKhoanTrong(gia(null, true, true)) === 'chua-biet');
  t('thiếu hẳn khối stats → chua-biet', await doTaiKhoanTrong(gia({})) === 'chua-biet');
  t('stats không phải object → chua-biet', await doTaiKhoanTrong(gia({ stats: 'x' })) === 'chua-biet');
  t('THIẾU TRƯỜNG projects → chua-biet, KHÔNG coi là 0 (F-17: khẳng định phải có chủ ngữ)',
    await doTaiKhoanTrong(gia({ stats: { flows: 0 } })) === 'chua-biet');
  t('projects là chuỗi "0" → chua-biet, không ép kiểu',
    await doTaiKhoanTrong(gia({ stats: { projects: '0', flows: 0 } })) === 'chua-biet');
  t('json hỏng → chua-biet', await doTaiKhoanTrong((async () => ({
    ok: true, json: async () => { throw new Error('không parse được'); },
  })) as never) === 'chua-biet');

  // ═══ cổng quyết định ═══
  t('trống + chưa dấu chân + chưa bỏ qua → CHÀO',
    duocChaoTuDong({ coDauChan: false, daBoQua: false, trangThai: 'trong' }) === true);
  t('CÓ DỮ LIỆU → KHÔNG chào (chính là ca L2-06)',
    duocChaoTuDong({ coDauChan: false, daBoQua: false, trangThai: 'co-du-lieu' }) === false);
  t('CHƯA BIẾT → KHÔNG chào (trống ≠ chưa biết)',
    duocChaoTuDong({ coDauChan: false, daBoQua: false, trangThai: 'chua-biet' }) === false);
  t('đã bỏ qua rồi → KHÔNG chào dù trống',
    duocChaoTuDong({ coDauChan: false, daBoQua: true, trangThai: 'trong' }) === false);
  t('có dấu chân trên máy → KHÔNG chào dù trống',
    duocChaoTuDong({ coDauChan: true, daBoQua: false, trangThai: 'trong' }) === false);

  console.log(`\n${ok} ok, ${fail} fail`);
  if (fail) process.exit(1);
};
void run();
