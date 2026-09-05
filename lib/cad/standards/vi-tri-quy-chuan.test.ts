/**
 * lib/cad/standards/vi-tri-quy-chuan.test.ts — W2 (05/09): VỊ TRÍ ↔ BỘ QUY CHUẨN.
 * Chạy: node_modules/.bin/sucrase-node lib/cad/standards/vi-tri-quy-chuan.test.ts
 *
 * Ba thứ tệp này canh, theo đúng thứ tự nguy hiểm giảm dần:
 *   [C] TẦNG C CHỈ SIẾT — cắm HẲN một phép siết cố tình nới lỏng và chứng minh nó BỊ TỪ CHỐI.
 *       Đây là chặn an toàn tối cao của chốt 15/08; thiếu nó thì biến số tuỳ chọn thành cửa sau.
 *   [B] ĐOÁN VÙNG THÌ KHÔNG LỌC — lọc theo vùng đoán sai là làm biến mất cả bộ luật quốc gia.
 *   [A] Thang bậc A→B: tầng A (nhân trắc) luôn có mặt, tầng B chồng lên.
 */
import { readFileSync } from 'node:fs';
import { getAllRules, type StandardRule } from './registry';
import { checkStandards } from './checker';
import { rulesForOperator } from '../operator-profile';
import {
  vungTuViTri, nenLuatTheoVung, giuBoBatBuoc, batBuocBiRoi,
} from './vung-tu-vi-tri';
import {
  goYBienSoTuDiaLy, bienSoDaNhan, apBienSoNguCanh, khongNoiLong,
  type BienSoNguCanhApDung, type BangSiet,
} from './ngu-canh';
import { goYTuTenDiaDanh, venBienTuKhoangCach } from '../../site/dia-ly';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ═══════════════ [1] SUY VÙNG TỪ VỊ TRÍ ═══════════════ */
console.log('\n[1] vungTuViTri — người khai thì lọc được, máy đoán thì không');

const khai = vungTuViTri({ quocGia: 'Việt Nam' });
ok('khai "Việt Nam" ⇒ vùng VN', khai.vung === 'VN');
ok('người khai ⇒ hạng measured', khai.co === 'measured');
ok('người khai ⇒ ĐƯỢC lọc', khai.apDuocNgay === true);
ok('bỏ dấu/chữ hoa vẫn ra VN', vungTuViTri({ quocGia: 'VIET NAM' }).vung === 'VN' && vungTuViTri({ quocGia: 'vn' }).vung === 'VN');

const la = vungTuViTri({ quocGia: 'Nhật Bản' });
ok('nước app CHƯA có bộ luật ⇒ rơi về INTL, KHÔNG bịa', la.vung === 'INTL');
ok('… và nói thẳng là app thiếu dữ liệu, không phải nơi đó không có luật', /CHƯA có bộ luật quốc gia/.test(la.ghiChu));

const doan = vungTuViTri({ viDo: 10.7769, kinhDo: 106.7009 });
ok('toạ độ TP.HCM rơi hộp bao VN ⇒ gợi ý VN', doan.vung === 'VN');
ok('… nhưng hạng chỉ inferred', doan.co === 'inferred');
ok('⭐ … và TUYỆT ĐỐI KHÔNG được lọc (apDuocNgay=false)', doan.apDuocNgay === false);
ok('… ghi chú nói rõ hộp bao là xấp xỉ thô', /hộp bao/.test(doan.ghiChu));

const ngoai = vungTuViTri({ viDo: 48.85, kinhDo: 2.35 }); // Paris
ok('toạ độ ngoài mọi hộp bao ⇒ INTL + không lọc', ngoai.vung === 'INTL' && ngoai.apDuocNgay === false);

const trong = vungTuViTri(undefined);
ok('chưa khai gì ⇒ INTL, không lọc, KHÔNG coi là lỗi', trong.vung === 'INTL' && trong.apDuocNgay === false);
ok('mọi kết quả đều có ghi chú (không bao giờ trả vùng câm)',
  [khai, la, doan, ngoai, trong].every((v) => v.ghiChu.trim().length > 0));

/* ═══════════════ [2] THANG BẬC A → B ═══════════════ */
console.log('\n[2] nenLuatTheoVung — A luôn có mặt, B chồng lên, đoán thì không lọc');

const tatCa = getAllRules();
const boVN = nenLuatTheoVung(khai);
ok('bộ VN có luật vn-*', boVN.some((r) => r.region === 'VN'));
ok('⭐ bộ VN VẪN GIỮ tầng A (rule region=INTL, vd Neufert)', boVN.some((r) => r.region === 'INTL'));
ok('bộ VN vẫn giữ luật chung không gắn vùng (ISO)', boVN.some((r) => r.region === undefined));
ok('bộ VN KHÔNG lẫn luật region=US', !boVN.some((r) => r.region === 'US'));
ok('lọc thật sự có tác dụng: bộ VN nhỏ hơn toàn bộ', boVN.length < tatCa.length);
ok('⭐ vùng chỉ ĐOÁN ⇒ trả nguyên bộ, không lọc gì', nenLuatTheoVung(doan).length === tatCa.length);

const boUS = nenLuatTheoVung(vungTuViTri({ quocGia: 'USA' }));
ok('bộ US có luật region=US và KHÔNG có region=VN',
  boUS.some((r) => r.region === 'US') && !boUS.some((r) => r.region === 'VN'));

/* ═══════════════ [3] BỘ LỌC TIỆN DỤNG KHÔNG ĐƯỢC THÀNH CỬA SAU ═══════════════ */
console.log('\n[3] giuBoBatBuoc — lọc theo loại vận hành không được làm rơi luật bắt buộc');

const chonGeneric = rulesForOperator('generic').flatMap((g) => g.rules);
const roi = batBuocBiRoi(chonGeneric, khai);
ok('đo được: operator "generic" LÀM RƠI luật bắt buộc của VN', roi.length > 0);
ok('… trong đó có PCCC', roi.some((r) => r.id.startsWith('vn-fire-')));
const daGop = giuBoBatBuoc(chonGeneric, khai);
ok('⭐ giuBoBatBuoc gộp lại đủ, không còn rơi', batBuocBiRoi(daGop, khai).length === 0);
ok('… và chỉ THÊM, không bỏ gì của bộ đã chọn',
  chonGeneric.every((r) => daGop.some((x) => x.id === r.id)));
ok('vùng chỉ ĐOÁN ⇒ không tự nhét luật quốc gia vào',
  giuBoBatBuoc(chonGeneric, doan).length === chonGeneric.length);

/* ═══════════════ [4] MÁY GỢI Ý — NGƯỜI THÊM ═══════════════ */
console.log('\n[4] Địa lý → biến số ngữ cảnh: gợi ý từ TÊN thì mãi mãi chỉ là gợi ý');

const tuTen = goYTuTenDiaDanh('Thành phố Hải Phòng');
const bienTuTen = goYBienSoTuDiaLy(tuTen);
ok('tên có chữ "hải" ⇒ máy gợi ý ven-bien', bienTuTen.some((b) => b.ma === 'ven-bien'));
ok('⭐ … nhưng hạng inferred, KHÔNG được áp', bienSoDaNhan(bienTuTen).length === 0);
ok('… và luôn kèm lý do', bienTuTen.every((b) => b.lyDo.trim().length > 0));

const doDuoc = venBienTuKhoangCach(800, {
  tieuDe: 'đo trên bản đồ dự án', layLuc: '2026-09-05', loai: 'do-dac', pham_vi: 'cong-truong',
});
const bienDoDuoc = goYBienSoTuDiaLy({ venBien: doDuoc.venBien });
ok('đo khoảng cách + có nguồn ⇒ verified', bienDoDuoc[0]?.co === 'verified');
ok('⭐ … và LÚC ĐÓ mới được áp', bienSoDaNhan(bienDoDuoc).length === 1);

/* ═══════════════ [5] TẦNG C CHỈ SIẾT — CHẶN AN TOÀN TỐI CAO ═══════════════ */
console.log('\n[5] apBienSoNguCanh — cắm hẳn ca cố tình NỚI LỎNG, phải bị TỪ CHỐI');

const NHAN: BienSoNguCanhApDung[] = [{ ma: 'ven-bien', co: 'verified', lyDo: 'test' }];

// ① Đường bình thường: C chỉ THÊM luật, không đụng luật cũ.
const nen = nenLuatTheoVung(khai);
const kq = apBienSoNguCanh(nen, NHAN);
ok('C thêm luật ven biển vào bộ', kq.themVao.some((r) => r.id === 'ctx-ven-bien-chong-an-mon'));
ok('… bộ sau nhiều hơn bộ trước đúng số luật thêm', kq.rules.length === nen.length + kq.themVao.length);
ok('⭐ … và không nới lỏng gì (máy canh im)', khongNoiLong(nen, kq.rules).length === 0);
ok('luật C thêm vào KHÔNG mang trị số (cấm bịa số)', kq.themVao.every((r) => Object.keys(r.params).length === 0));
ok('luật C thêm vào khai thật là chưa verified + có note',
  kq.themVao.every((r) => r.verified === false && Boolean(r.note?.trim())));
ok('biến số chỉ gợi ý (inferred) ⇒ C KHÔNG đụng bộ luật',
  apBienSoNguCanh(nen, [{ ma: 'ven-bien', co: 'inferred', lyDo: 'đoán' }]).rules.length === nen.length);

// ② CA CỐ TÌNH NỚI LỎNG — hạ ngưỡng lối thoát nạn PCCC từ 800 xuống 700mm.
const luatPCCC = nen.find((r) => r.id === 'vn-fire-exit-clear-width-min');
ok('có luật PCCC bề rộng lối thoát để thử nới', Boolean(luatPCCC) && luatPCCC!.params.minWidthMm === 800);

const SIET_XAU: BangSiet = {
  'ven-bien': [{ ruleId: 'vn-fire-exit-clear-width-min', params: { minWidthMm: 700 } }],
};
const kqXau = apBienSoNguCanh(nen, NHAN, { siet: SIET_XAU });
const sauXau = kqXau.rules.find((r) => r.id === 'vn-fire-exit-clear-width-min');
ok('⭐⭐ NỚI LỎNG BỊ TỪ CHỐI — ngưỡng PCCC vẫn 800mm', sauXau?.params.minWidthMm === 800);
ok('⭐ … và lý do được BÀY RA, không nuốt im', kqXau.tuChoi.some((v) => /NỚI "minWidthMm"/.test(v.lyDo)));
ok('… phép siết hỏng không được ghi là đã siết', kqXau.daSiet.length === 0);
ok('… luật thêm hợp lệ vẫn vào bình thường (một phép hỏng không giết cả tầng C)',
  kqXau.themVao.some((r) => r.id === 'ctx-ven-bien-chong-an-mon'));

// ③ Ca SIẾT HỢP LỆ — nâng ngưỡng lên 900mm thì được nhận.
const SIET_TOT: BangSiet = {
  'ven-bien': [{ ruleId: 'vn-fire-exit-clear-width-min', params: { minWidthMm: 900 } }],
};
const kqTot = apBienSoNguCanh(nen, NHAN, { siet: SIET_TOT });
ok('siết ĐÚNG CHIỀU (min tăng) được nhận', kqTot.rules.find((r) => r.id === 'vn-fire-exit-clear-width-min')?.params.minWidthMm === 900);
ok('… và ghi vào danh sách đã siết', kqTot.daSiet.includes('vn-fire-exit-clear-width-min'));
ok('… không có phép nào bị từ chối', kqTot.tuChoi.length === 0);

/* ═══════════════ [6] MÁY CANH khongNoiLong — bốn kiểu nới lỏng ═══════════════ */
console.log('\n[6] khongNoiLong — bốn kiểu nới lỏng đều bị bắt');

const G: StandardRule = {
  id: 'w2-goc', source: 'fixture', category: 'egress', severity: 'error',
  description: 'fixture', params: { minWidthMm: 800, maxSlopePct: 5, heSo: 2 },
  verified: false, note: 'fixture', binding: 'mandatory',
};
const sua = (p: Partial<StandardRule>): StandardRule[] => [{ ...G, ...p }];
ok('① BIẾN MẤT luật', khongNoiLong([G], []).some((v) => /BIẾN MẤT/.test(v.lyDo)));
ok('② HẠ binding mandatory → advisory', khongNoiLong([G], sua({ binding: 'advisory' })).some((v) => /HẠ ràng buộc/.test(v.lyDo)));
ok('③ HẠ severity error → info', khongNoiLong([G], sua({ severity: 'info' })).some((v) => /HẠ mức nghiêm trọng/.test(v.lyDo)));
ok('④a NỚI tham số min (giảm)', khongNoiLong([G], sua({ params: { ...G.params, minWidthMm: 700 } })).some((v) => /NỚI "minWidthMm"/.test(v.lyDo)));
ok('④b NỚI tham số max (tăng)', khongNoiLong([G], sua({ params: { ...G.params, maxSlopePct: 9 } })).some((v) => /NỚI "maxSlopePct"/.test(v.lyDo)));
ok('④c GỠ tham số', khongNoiLong([G], sua({ params: { minWidthMm: 800, maxSlopePct: 5 } })).some((v) => /GỠ tham số "heSo"/.test(v.lyDo)));
ok('⭐ ④d tên tham số KHÔNG đọc được chiều ⇒ CẤM ĐỔI (mặc định bảo thủ)',
  khongNoiLong([G], sua({ params: { ...G.params, heSo: 3 } })).some((v) => /không nói được chiều siết/.test(v.lyDo)));
ok('siết đúng chiều thì máy canh im',
  khongNoiLong([G], sua({ params: { minWidthMm: 900, maxSlopePct: 4, heSo: 2 }, severity: 'error' })).length === 0);
ok('THÊM luật mới không bị coi là nới lỏng', khongNoiLong([G], [G, { ...G, id: 'w2-them' }]).length === 0);
ok('luật cũ KHÔNG khai binding ⇒ suy từ severity, hạ severity vẫn bị bắt',
  khongNoiLong([{ ...G, binding: undefined }], [{ ...G, binding: undefined, severity: 'warning' }]).length > 0);

/* ═══════════════ [7] checkStandards nhận vùng — additive, không hồi quy ═══════════════ */
console.log('\n[7] checkStandards(opts.vung) — thêm được, bỏ trống thì y như cũ');

const docTrong = { entities: [], layers: [] } as unknown as Parameters<typeof checkStandards>[0];
ok('gọi 2 tham số như cũ vẫn chạy', Array.isArray(checkStandards(docTrong, getAllRules())));
ok('truyền vung=null ⇒ y hệt không truyền',
  JSON.stringify(checkStandards(docTrong, getAllRules(), { vung: null })) === JSON.stringify(checkStandards(docTrong, getAllRules())));
ok('truyền vung ⇒ engine lọc theo rule.region (không nhánh if theo nước)',
  Array.isArray(checkStandards(docTrong, getAllRules(), { vung: 'VN' })));

/* ═══════════════ [8] MỘT TỪ VỰNG, KHÔNG ĐẺ BỘ THỨ HAI ═══════════════ */
console.log('\n[8] MaNguCanh phải khớp MaBienSoNguCanh của lib/site/types.ts');

const nguon = readFileSync('lib/site/types.ts', 'utf8');
const khoiSite = nguon.slice(nguon.indexOf('export type MaBienSoNguCanh'));
const maSite = new Set((khoiSite.slice(0, khoiSite.indexOf(';')).match(/'([a-z-]+)'/g) ?? []).map((x) => x.slice(1, -1)));
const nguonC = readFileSync('lib/cad/standards/ngu-canh.ts', 'utf8');
const khoiC = nguonC.slice(nguonC.indexOf('export type MaNguCanh'));
const maC = new Set((khoiC.slice(0, khoiC.indexOf(';')).match(/'([a-z-]+)'/g) ?? []).map((x) => x.slice(1, -1)));
ok('đọc được cả hai bảng', maSite.size > 0 && maC.size > 0);
ok('⭐ hai bảng TRÙNG KHÍT (không đẻ từ vựng thứ hai)',
  maSite.size === maC.size && [...maSite].every((m) => maC.has(m)));

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
