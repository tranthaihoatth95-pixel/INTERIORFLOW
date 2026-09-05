/**
 * lib/sheets-persist-nhip-may-chu.test.ts — chạy:
 *   node_modules/.bin/sucrase-node lib/sheets-persist-nhip-may-chu.test.ts
 *
 * Cổng canh cho `taoNhipSaoLuuMayChu` (P0-LUU, lỗi `A2-03`). Bốn tính chất phải giữ, và cả bốn
 * đều là thứ đã hỏng ở bản `setInterval(30_000)` cũ:
 *   ① bám THAY ĐỔI, không bám đồng hồ — không sửa gì thì không gửi gì;
 *   ② trạng thái báo ra KHÔNG BAO GIỜ là 'synced' khi còn thay đổi treo (đây là chỗ nhãn nói dối);
 *   ③ thay đổi đến GIỮA CHUYẾN BAY không bị nuốt (lý do đếm phiên bản thay vì dùng cờ boolean);
 *   ④ gửi hỏng thì THỬ LẠI và nói thật trong lúc chờ, không im lặng tụt về 'pending'.
 *
 * Dùng đồng hồ thật với số ms nhỏ (`treMs`/`gianCachMs` bơm vào) — nhịp này không có phụ thuộc
 * DOM nào ngoài `navigator.sendBeacon` (chỉ dùng ở `flushKhiRoiTrang`, không test ở đây; đường đó
 * phải đo trên trình duyệt thật — xem `docs/delivery/FIX-P0-LUU.md`).
 */
import assert from 'node:assert';
import { taoNhipSaoLuuMayChu, TRE_SAO_LUU_MAY_CHU_MS, GIAN_CACH_SAO_LUU_MAY_CHU_MS } from './sheets-persist';

let passed = 0;
const cho = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** Bộ ghi trạng thái — giữ nguyên THỨ TỰ để khẳng định được cả đường đi, không chỉ điểm cuối. */
function soGhi() {
  const day: string[] = [];
  return { day, ghi: (s: string) => day.push(s) };
}

(async () => {
  console.log('\n[0] Hằng số — số đã cân, đổi thì phải đổi cả lời khai trong docstring');
  await test('trễ 2,5 s · giãn cách 12 s', async () => {
    assert.strictEqual(TRE_SAO_LUU_MAY_CHU_MS, 2500);
    assert.strictEqual(GIAN_CACH_SAO_LUU_MAY_CHU_MS, 12_000);
  });

  console.log('\n[1] Bám thay đổi, không bám đồng hồ');
  await test('không touch ⇒ không gửi lần nào (bản cũ vẫn tick mỗi 30 s)', async () => {
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: () => {},
      treMs: 20, gianCachMs: 0,
    });
    await cho(150);
    assert.strictEqual(soLanGui, 0);
    n.dispose();
  });

  await test('touch ⇒ gửi sau ĐÚNG nhịp trễ, và gộp nhiều touch liên tiếp thành MỘT lượt', async () => {
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: () => {},
      treMs: 60, gianCachMs: 0,
    });
    n.touch(); await cho(20);
    n.touch(); await cho(20);
    n.touch();
    assert.strictEqual(soLanGui, 0, 'chưa yên tay thì chưa được gửi');
    await cho(140);
    assert.strictEqual(soLanGui, 1, 'ba lần sửa liên tiếp phải gộp thành một lượt gửi');
    n.dispose();
  });

  console.log('\n[2] Trạng thái — chỗ nhãn lấy sự thật');
  await test('đường đi: pending → syncing → synced', async () => {
    const s = soGhi();
    const n = taoNhipSaoLuuMayChu({
      gui: async () => ({ ok: true }),
      onTrangThai: (st) => s.ghi(st),
      treMs: 30, gianCachMs: 0,
    });
    n.touch();
    await cho(150);
    assert.deepStrictEqual(s.day, ['pending', 'syncing', 'synced']);
    n.dispose();
  });

  await test('TRONG lúc chờ giãn cách, trạng thái ở "pending" — KHÔNG được là "synced"', async () => {
    // Đây chính là cửa sổ mà nhãn cũ nói dối: có thay đổi chưa lên máy chủ.
    const s = soGhi();
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: (st) => s.ghi(st),
      treMs: 10, gianCachMs: 250,
    });
    n.touch();
    await cho(120); // lượt 1 đã gửi xong
    assert.strictEqual(soLanGui, 1);
    assert.strictEqual(s.day[s.day.length - 1], 'synced');
    n.touch(); // sửa tiếp — còn kẹt giãn cách
    await cho(120);
    assert.strictEqual(soLanGui, 1, 'giãn cách phải chặn lượt gửi thứ hai');
    assert.strictEqual(s.day[s.day.length - 1], 'pending', 'đang treo mà báo synced là nói dối');
    await cho(300);
    assert.strictEqual(soLanGui, 2, 'hết giãn cách thì phải tự gửi, không đợi ai touch thêm');
    assert.strictEqual(s.day[s.day.length - 1], 'synced');
    n.dispose();
  });

  await test('⌘S (flushNow) bỏ qua giãn cách', async () => {
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: () => {},
      treMs: 10, gianCachMs: 5000,
    });
    n.touch();
    await cho(90);
    assert.strictEqual(soLanGui, 1);
    n.touch();
    n.flushNow();
    await cho(90);
    assert.strictEqual(soLanGui, 2, 'giãn cách 5 s mà ⌘S vẫn phải gửi ngay');
    n.dispose();
  });

  await test('flushNow khi KHÔNG có gì treo là no-op — không đẻ bản ghi rác', async () => {
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: () => {},
      treMs: 10, gianCachMs: 0,
    });
    n.flushNow();
    await cho(80);
    assert.strictEqual(soLanGui, 0);
    n.dispose();
  });

  console.log('\n[3] Thay đổi giữa chuyến bay — lý do đếm phiên bản');
  await test('sửa trong lúc đang gửi ⇒ gửi thêm lượt nữa, không nuốt', async () => {
    const s = soGhi();
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; await cho(120); return { ok: true }; },
      onTrangThai: (st) => s.ghi(st),
      treMs: 10, gianCachMs: 0,
    });
    n.touch();
    await cho(60);           // lượt 1 đang bay
    n.touch();               // người dùng vẽ tiếp ngay giữa chuyến
    await cho(400);
    assert.strictEqual(soLanGui, 2, 'thay đổi giữa chuyến bay bị nuốt — đúng bẫy của cờ boolean');
    assert.strictEqual(s.day[s.day.length - 1], 'synced');
    n.dispose();
  });

  console.log('\n[4] Hỏng thì nói thật và thử lại');
  await test('gửi hỏng → "error" kèm lý do, rồi TỰ thử lại', async () => {
    const s = soGhi();
    const lyDo: (string | null | undefined)[] = [];
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => {
        soLanGui++;
        return soLanGui === 1 ? { ok: false, loi: 'máy chủ trả 503' } : { ok: true };
      },
      onTrangThai: (st, msg) => { s.ghi(st); lyDo.push(msg); },
      treMs: 10, gianCachMs: 0,
    });
    n.touch();
    await cho(120);
    assert.ok(s.day.includes('error'), 'hỏng mà không báo là im lặng nuốt lỗi');
    assert.ok(lyDo.some((x) => x === 'máy chủ trả 503'), 'lý do thật phải đi tới nhãn');
    await cho(5200); // nhánh thử lại chờ tối thiểu 5 s
    assert.strictEqual(soLanGui, 2, 'phải tự thử lại');
    assert.strictEqual(s.day[s.day.length - 1], 'synced');
    n.dispose();
  });

  await test('gui() ném exception cũng thành "error", không làm sập nhịp', async () => {
    const s = soGhi();
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { throw new Error('mạng đứt'); },
      onTrangThai: (st) => s.ghi(st),
      treMs: 10, gianCachMs: 0,
    });
    n.touch();
    await cho(120);
    assert.strictEqual(s.day[s.day.length - 1], 'error');
    n.dispose();
  });

  await test('dispose xong thì im hẳn — không gửi, không báo trạng thái nữa', async () => {
    const s = soGhi();
    let soLanGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { soLanGui++; return { ok: true }; },
      onTrangThai: (st) => s.ghi(st),
      treMs: 20, gianCachMs: 0,
    });
    n.touch();
    n.dispose();
    const soSauKhiDong = s.day.length;
    await cho(120);
    assert.strictEqual(soLanGui, 0);
    assert.strictEqual(s.day.length, soSauKhiDong);
  });

  console.log('\n[5] `khongGuiGi` — không có lượt nhận mới thì KHÔNG cấp mốc giờ');
  await test('gui trả khongGuiGi ⇒ vẫn "synced" nhưng onDaGui KHÔNG chạy', async () => {
    // Mốc giờ là thứ nhãn dùng để hứa "Đã lưu lúc HH:MM". Cấp mốc cho một lượt KHÔNG HỀ GỬI là
    // dựng lại đúng lời nói dối mà cả đợt này sinh ra để diệt, chỉ ở một chỗ kín hơn.
    const s = soGhi();
    let soLanDaGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => ({ ok: true, khongGuiGi: true }),
      onTrangThai: (st) => s.ghi(st),
      onDaGui: () => { soLanDaGui++; },
      treMs: 10, gianCachMs: 0,
    });
    n.touch();
    await cho(120);
    assert.strictEqual(s.day[s.day.length - 1], 'synced', 'không có gì để gửi ⇒ máy chủ đang giữ đúng bản này');
    assert.strictEqual(soLanDaGui, 0, 'KHÔNG được cấp mốc giờ cho một lượt không hề gửi');
    n.dispose();
  });

  await test('gửi THẬT thì onDaGui chạy đúng một lần', async () => {
    let soLanDaGui = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => ({ ok: true }),
      onTrangThai: () => {},
      onDaGui: () => { soLanDaGui++; },
      treMs: 10, gianCachMs: 0,
    });
    n.touch();
    await cho(120);
    assert.strictEqual(soLanDaGui, 1);
    n.dispose();
  });

  await test('lượt khongGuiGi KHÔNG khoá đồng hồ giãn cách', async () => {
    // Bệnh đo được trên app thật: lượt lúc mở dự án không gửi gì (bản vẽ còn rỗng) nhưng vẫn khoá
    // giãn cách ⇒ nét vẽ đầu tiên phải chờ 10,0 s thay vì ~2,5 s.
    const guiRa = [];
    let lanThu = 0;
    const n = taoNhipSaoLuuMayChu({
      gui: async () => { lanThu++; guiRa.push(Date.now()); return lanThu === 1 ? { ok: true, khongGuiGi: true } : { ok: true }; },
      onTrangThai: () => {},
      treMs: 10, gianCachMs: 400,
    });
    n.touch();
    await cho(90);          // lượt 1: khongGuiGi
    const t1 = Date.now();
    n.touch();              // lượt 2: gửi thật — KHÔNG được phải chờ hết 400 ms
    await cho(120);
    assert.strictEqual(lanThu, 2, 'lượt gửi thật bị giãn cách chặn oan');
    assert.ok(Date.now() - t1 < 350, 'lượt thật phải đi ngay, không đợi giãn cách của một lượt trống');
    n.dispose();
  });

  console.log(`\n${passed} passed`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
