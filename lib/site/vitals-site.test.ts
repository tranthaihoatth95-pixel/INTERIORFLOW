/** lib/site/vitals-site.test.ts — DÂY Site → Vitals (§6 · §D · §E). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hoSoRong } from './types';
import { tinHieuDiaDiem, tinhLai, mienDangCu, SU_KIEN_SITE_DOI } from './vitals-site';

let fail = 0;
const ok = (m: string, c: unknown) => { if (c) console.log(`  ok  - ${m}`); else { console.log(`  FAIL - ${m}`); fail++; } };
const LUC = '2026-08-22T00:00:00.000Z';
const goc = hoSoRong('p', LUC);

console.log('\n[1] KHÔNG CÓ GÌ CŨ → VITALS IM TUYỆT ĐỐI');
ok('hồ sơ trống → không tín hiệu', tinHieuDiaDiem(goc) === null);
ok('daCu rỗng → không tín hiệu', tinHieuDiaDiem({ ...goc, daCu: [] }) === null);
ok('hồ sơ CHƯA KHAI không phải một cảnh báo', tinHieuDiaDiem({ ...goc, viTri: { doChinhXac: 'chua-ro', nguoiDungXacNhan: false } }) === null);

console.log('\n[2] CÓ DẤU CŨ → TÍN HIỆU MANG SỐ THẬT');
{
  const h = { ...goc, daCu: ['nang.gocChieu', 'nang.gioNang'] };
  const t = tinHieuDiaDiem(h)!;
  ok('có tín hiệu', Boolean(t));
  ok('số đếm THẬT từ daCu', t.so === 2);
  ok('nhãn mang số, không chung chung', /2 phân tích/.test(t.nhan));
  ok('nói rõ miền nào', t.chiTiet.includes('Phân tích nắng'));
  ok('trả lời được "tại sao"', /địa điểm/.test(t.viSao));
  ok('chỉ đúng miền để đi tới, không phải trang chung', t.mien.join() === 'nang');
}

console.log('\n[3] TÍNH LẠI GỠ CÓ CHỌN LỌC — KHÔNG "DỌN HẾT CHO GỌN"');
{
  const h = { ...goc, daCu: ['nang.gocChieu', 'van-hoa.det', 'thu-cong.gom'] };
  ok('ba miền đang cũ', mienDangCu(h).length === 3);
  const sau = tinhLai(h, ['nang']);
  ok('gỡ đúng nắng', !sau.daCu!.some((k) => k.startsWith('nang')));
  ok('⭐ văn hoá VẪN cũ (cũ vì lý do khác)', sau.daCu!.includes('van-hoa.det'));
  ok('⭐ thủ công VẪN cũ', sau.daCu!.includes('thu-cong.gom'));
  ok('tín hiệu vẫn còn vì còn miền cũ', tinHieuDiaDiem(sau)!.so === 2);
  const het = tinhLai(sau, ['van-hoa', 'thu-cong']);
  ok('gỡ nốt → Vitals TẮT HẲN', tinHieuDiaDiem(het) === null);
}

console.log('\n[4] VITALS KHÔNG PHẢI SỔ NHẬT KÝ (§E)');
{
  const h = { ...goc, daCu: ['nang.a'] };
  ok('xử xong thì tín hiệu BIẾN MẤT (không giữ lịch sử)', tinHieuDiaDiem(tinhLai(h, ['nang'])) === null);
}

/* ═══════════════════════════════════════════════════════════════════════════════════════════
 * [5] ⛔ CANH DÂY — mô-đun này TỪNG NẰM CHẾT (K1) VÀ KÊNH TỰ-LÊN-TIẾNG TỪNG CHỈ CÓ MỘT NỬA (K2).
 *
 * Bốn kiểm dưới đây soi MÃ NGUỒN, không soi hành vi — cố ý. Hai lỗi chúng canh đều thuộc loại
 * **không làm test nào đỏ**: bản làm-lại-bằng-tay vẫn ra đúng số, và một kênh sự kiện không ai
 * phát vẫn biên dịch sạch. Thứ duy nhất bắt được chúng là đối chiếu "ai gọi ai".
 * ═══════════════════════════════════════════════════════════════════════════════════════════ */
console.log('\n[5] CANH DÂY — K1 (một việc một nơi) · K2 (tự lên tiếng)');
{
  const goc4 = join(__dirname, '..', '..');
  /**
   * ⚠️ BỎ CHÚ THÍCH TRƯỚC KHI SOI — bài học đã trả giá HAI LẦN trong ngày 04/09 (`soi-thao-tac`
   * đọc chữ trong chú thích · máy chẩn đoán khớp trúng chính danh sách nằm trong nó).
   * Chính khối kiểm này vừa dính lần thứ ba: docstring của `locMien` có nhắc `as MaMien[]` để
   * GIẢI THÍCH thứ vừa bị khai tử, và bản làm tay được trích lại nguyên văn trong chú thích K1
   * ⇒ máy báo "vẫn còn" trong khi mã đã sạch. Ta soi **mã đang chạy**, không soi lời kể về nó.
   */
  const boChuThich = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const doc = (t: string) => boChuThich(readFileSync(join(goc4, t), 'utf8'));
  const khauDo = doc('components/studio/VitalsAperture.tsx');
  const cua = doc('components/site/dia-diem-client.ts');

  // K1 — khẩu độ phải GỌI mô-đun, không tự tách/tự đếm lại.
  ok('khẩu độ gọi `tinHieuDiaDiem` của mô-đun', khauDo.includes('tinHieuDiaDiem('));
  ok('⭐ hết bản làm tay `daCu.map(k => k.split(...))` trong khẩu độ',
    !/ds\.map\(\(k\)\s*=>\s*k\.split/.test(khauDo));
  // Ép kiểu mù làm CHẾT lời hứa "union chữ chết" — miền lạ đi thẳng ra mắt người dùng.
  ok('⭐ hết ép kiểu mù `as MaMien[]` (đã thay bằng cửa lọc `locMien`)',
    !khauDo.includes('as MaMien[]') && khauDo.includes('locMien('));

  // K2 — nơi GHI phải phát tiếng, nếu không thì khẩu độ chỉ nghe được chính nó.
  ok('⭐ đường GHI (`luu`) phát tiếng `baoSiteDoi()`', cua.includes('baoSiteDoi()'));
  ok('cửa đọc/ghi cũng NGHE, không đọc một lần rồi đứng yên',
    cua.includes('addEventListener(SU_KIEN_SITE_DOI'));
  // Tên sự kiện gõ tay ở nhiều nơi = nhiều nguồn cho một cái tên; sai một ký tự là đứt câm.
  ok('tên sự kiện đi qua HẰNG SỐ, không gõ tay lại',
    SU_KIEN_SITE_DOI === 'if:site-changed' &&
    !khauDo.includes("'if:site-changed'") && !cua.includes("'if:site-changed'"));
}

console.log(fail ? `\n❌ ${fail} kiểm HỎNG` : '\n✅ Tất cả kiểm ĐẠT');
if (fail) process.exit(1);
