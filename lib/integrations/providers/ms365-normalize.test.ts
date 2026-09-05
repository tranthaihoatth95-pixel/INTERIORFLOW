import assert from 'node:assert';
import { chuanHoaDanhSachGraph, chuanHoaSuKienGraph, isoTuGraph, khungMacDinh } from './ms365-normalize';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

/** Fixture theo hình dạng Graph v1.0 /me/calendarView (Prefer: outlook.timezone="UTC"). */
const FX = {
  value: [
    {
      id: 'AAMk2',
      subject: 'Duyệt phương án với CĐT',
      start: { dateTime: '2026-09-05T02:00:00.0000000', timeZone: 'UTC' },
      end: { dateTime: '2026-09-05T03:00:00.0000000', timeZone: 'UTC' },
      isAllDay: false,
      isOnlineMeeting: true,
      onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/xyz' },
      location: { displayName: 'Phòng họp 3' },
      organizer: { emailAddress: { name: 'Hoà', address: 'hoa@example.com' } },
      attendees: [{}, {}, {}],
      webLink: 'https://outlook.office365.com/owa/?itemid=AAMk2',
    },
    { id: 'AAMk1', subject: '  ', start: { dateTime: '2026-09-04T09:00:00', timeZone: 'SE Asia Standard Time' }, end: { dateTime: '2026-09-04T10:00:00', timeZone: 'SE Asia Standard Time' }, isAllDay: false, isOnlineMeeting: false, attendees: [] },
    { id: 'AAMk3', subject: 'đã huỷ', isCancelled: true, start: { dateTime: '2026-09-06T00:00:00', timeZone: 'UTC' }, end: { dateTime: '2026-09-07T00:00:00', timeZone: 'UTC' }, isAllDay: true },
    { subject: 'không id' },
    null,
  ],
};

test('chuẩn hoá: UTC được gắn Z, cắt 7 số lẻ giây; timezone khác giữ nguyên chuỗi (không bịa offset)', () => {
  assert.strictEqual(isoTuGraph('2026-09-05T02:00:00.0000000', 'UTC'), '2026-09-05T02:00:00.000Z');
  assert.strictEqual(isoTuGraph('2026-09-04T09:00:00', 'SE Asia Standard Time'), '2026-09-04T09:00:00');
  assert.strictEqual(isoTuGraph('2026-09-04T09:00:00+07:00', 'X'), '2026-09-04T09:00:00+07:00');
  assert.strictEqual(isoTuGraph(undefined, 'UTC'), '');
});

test('họp trực tuyến: joinUrl + nguoiToChuc + soNguoi + nguon=ms365', () => {
  const m = chuanHoaSuKienGraph(FX.value[0] as never)!;
  assert.strictEqual(m.truc_tuyen, true);
  assert.strictEqual(m.joinUrl, 'https://teams.microsoft.com/l/meetup-join/xyz');
  assert.strictEqual(m.nguoiToChuc, 'Hoà');
  assert.strictEqual(m.soNguoi, 3);
  assert.strictEqual(m.diaDiem, 'Phòng họp 3');
  assert.strictEqual(m.nguon, 'ms365');
});

test('danh sách: bỏ huỷ / thiếu id / null, tiêu đề trống → "(không tiêu đề)", sắp theo giờ bắt đầu', () => {
  const ds = chuanHoaDanhSachGraph(FX.value);
  assert.deepStrictEqual(ds.map((m) => m.id), ['AAMk1', 'AAMk2']);
  assert.strictEqual(ds[0].tieuDe, '(không tiêu đề)');
  assert.strictEqual(ds[0].truc_tuyen, false);
  assert.strictEqual(ds[0].joinUrl, null);
  assert.deepStrictEqual(chuanHoaDanhSachGraph(undefined), []);
});

test('khung mặc định: từ 0h UTC hôm nay tới +14 ngày', () => {
  const k = khungMacDinh(new Date('2026-09-03T15:20:00Z'));
  assert.strictEqual(k.tu, '2026-09-03T00:00:00.000Z');
  assert.strictEqual(k.den, '2026-09-17T00:00:00.000Z');
});

console.log(`ms365-normalize: ${pass} pass`);
