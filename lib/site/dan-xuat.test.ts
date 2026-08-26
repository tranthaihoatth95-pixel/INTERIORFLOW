/**
 * lib/site/dan-xuat.test.ts — khoá CHUỖI SỰ THẬT ĐỊA ĐIỂM.
 * Chạy: `node_modules/.bin/sucrase-node lib/site/dan-xuat.test.ts`
 *
 * Hai cách hỏng đã xảy ra thật (22/08) và test này canh cho chúng không quay lại:
 *   ① máy suy có đủ mà KHÔNG AI GỌI ⇒ hồ sơ không bao giờ có sự thật ⇒ không bao giờ có gì cũ
 *      ⇒ Vitals im vĩnh viễn. Máy đủ, dây thiếu — tsc/test cũ đều mù vì hai hàm đều "có".
 *   ② "Tính lại" chỉ XOÁ DẤU chứ không tính ⇒ trạng thái nói "đã tươi" mà không phép tính nào
 *      chạy. Cùng họ với bịa phần trăm: một con số/trạng thái không có gì đỡ phía sau.
 */
import { suyLanDau, tinhLaiThat } from './dan-xuat';
import type { HoSoDiaDiem } from './types';

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log('  ok  -', m); else { fail++; console.log('  FAIL -', m); } };

const NGAY = new Date('2026-06-21T12:00:00Z');
const K = 'nang.gocToiMatDungMinChieuDeg';
const nen = (matDung: number): HoSoDiaDiem => ({
  duAnId: 'p1', phienBan: 1,
  viTri: { viDo: 10.7769, kinhDo: 106.7009, nhan: 'TP. HCM' },
  huong: { matDungChinhDeg: matDung, bacThatDeg: 0 },
  suThat: {}, ketLuan: [], deXuat: [], taoLuc: NGAY.toISOString(),
} as unknown as HoSoDiaDiem);

console.log('\ndan-xuat — sự thật địa điểm phải ĐƯỢC SINH RA và TÍNH LẠI THẬT');

console.log('\n[1] Suy lần đầu — có toạ độ thì PHẢI ra sự thật (nếu không, Vitals câm vĩnh viễn)');
const a = suyLanDau(nen(135), NGAY);
ok('sinh ra sự thật', Object.keys(a.suThat).length > 0);
ok('có sự thật miền nắng', Object.keys(a.suThat).some((k) => k.startsWith('nang.')));
ok('giá trị là SỐ THẬT, không phải null/undefined', typeof (a.suThat[K] as { giaTri?: unknown })?.giaTri === 'number');

console.log('\n[2] Chưa khai toạ độ ⇒ IM, không bịa sự thật');
{
  const trong = { ...nen(135), viTri: {} } as unknown as HoSoDiaDiem;
  ok('không toạ độ ⇒ không sinh sự thật nắng', !Object.keys(suyLanDau(trong, NGAY).suThat).some((k) => k.startsWith('nang.')));
}

console.log('\n[3] §32 — ĐÃ CÓ nền thì suyLanDau KHÔNG được đè (người quyết, không phải máy)');
{
  const b = suyLanDau({ ...a, huong: { ...a.huong, matDungChinhDeg: 60 } }, NGAY);
  ok('giá trị GIỮ NGUYÊN dù hướng đã đổi', (b.suThat[K] as { giaTri: number }).giaTri === (a.suThat[K] as { giaTri: number }).giaTri);
}

console.log('\n[4] Tính lại PHẢI TÍNH — không phải xoá dấu cho im');
{
  const cu: HoSoDiaDiem = { ...a, huong: { ...a.huong, matDungChinhDeg: 60 }, daCu: [K, 'nang.gioGocToiMin'] };
  const moi = tinhLaiThat(cu, ['nang'], NGAY);
  const truoc = (cu.suThat[K] as { giaTri: number }).giaTri;
  const sau = (moi.suThat[K] as { giaTri: number }).giaTri;
  ok('giá trị ĐỔI THẬT sau khi tính lại', truoc !== sau);
  ok('dấu cũ của miền được yêu cầu đã gỡ', (moi.daCu ?? []).length === 0);
}

console.log('\n[5] Chỉ gỡ dấu ĐÚNG MIỀN được yêu cầu — không dọn hộ miền khác');
{
  const cu: HoSoDiaDiem = { ...a, daCu: [K, 'khi-hau.mua'] };
  const moi = tinhLaiThat(cu, ['nang'], NGAY);
  ok('dấu miền khí hậu CÒN NGUYÊN', (moi.daCu ?? []).includes('khi-hau.mua'));
  ok('dấu miền nắng đã gỡ', !(moi.daCu ?? []).includes(K));
}

console.log('\n[6] Không yêu cầu miền nào ⇒ không đụng gì (bấm nhầm không được đổi sự thật)');
{
  const cu: HoSoDiaDiem = { ...a, daCu: [K] };
  ok('hồ sơ giữ nguyên', JSON.stringify(tinhLaiThat(cu, [], NGAY)) === JSON.stringify(cu));
}

console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);

/* ═══════════════════════════════════════════════════════════════════════════════════════════
 * [7] CỔNG CHÍNH SÁCH — ngưỡng VÔ CĂN CỨ không được đẻ ra kết luận sản xuất (nối 22/08)
 *
 * 🔴 Ca thật: `NGUONG.doAmCaoPc = 75` trong bảng luật ĐANG DÙNG chính là `khi-hau.am-cao` mà
 * `chinh-sach.ts` xếp hạng `uoc-le` ("chưa tra được ngưỡng ẩm nào được ban hành"). Hai bảng ngưỡng
 * song song, và bảng CÓ cổng an toàn thì `grep "from '.*chinh-sach'"` = 0 nơi import.
 * Hôm nay luật đó chưa nổ vì thiếu nguồn khí hậu ⇒ RỦI RO NGỦ: ngày cắm nguồn vào, số tự đặt ship
 * im lặng. Test này canh cho cổng không bị gỡ.
 * ══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const { nguongDungDuoc, NGUONG, suyLuan } = require('./suy-luan') as typeof import('./suy-luan');
  const { SO_NGUONG } = require('./chinh-sach') as typeof import('./chinh-sach');

  console.log('\n[7] Cổng chính sách chặn ngưỡng vô căn cứ');
  ok('ngưỡng ẩm ĐANG bị chặn (hạng uoc-le)', nguongDungDuoc('khi-hau.am-cao') === false);
  ok('ngưỡng không có trong sổ chính sách thì tự do (hình học thuần)', nguongDungDuoc('khong-co-trong-so') === true);
  ok('MỘT SỐ, KHÔNG HAI: NGUONG.doAmCaoPc lấy thẳng từ chính sách',
    NGUONG.doAmCaoPc === SO_NGUONG['khi-hau.am-cao'].giaTri);

  // Dữ liệu ĐỦ để luật ẩm-ven-biển nổ, nhưng cổng đóng ⇒ phải IM.
  const su = {
    'khi-hau.doAmTbNamPc': { giaTri: 88, co: 'measured', nguon: { tieuDe: 't', layLuc: '', loai: 'tinh-toan', pham_vi: 'vung' } },
    'dia-ly.venBien': { giaTri: true, co: 'measured', nguon: { tieuDe: 't', layLuc: '', loai: 'tinh-toan', pham_vi: 'vung' } },
  } as never;
  // 🔧 ĐỔI HƯỚNG giữa lượt: KHÔNG bịt miệng luật (bản đầu làm đỏ vat-ly.test.ts:194, và test đó
  // ĐÚNG). Kết luận VẪN RA, nhưng phải MANG THEO lời khai ngưỡng là quy ước — không ban phước.
  const k = suyLuan(su).find((x) => x.id === 'am-ven-bien');
  ok('kết luận VẪN RA (không bịt miệng tin có ích)', !!k);
  ok('nhưng KHAI THẲNG ngưỡng là quy ước chưa có nguồn', /quy ước làm việc, chưa có nguồn ngành/.test(k?.dienGiai ?? ''));
}
console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);
