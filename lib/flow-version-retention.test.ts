/**
 * lib/flow-version-retention.test.ts — kiểm hàm THUẦN planFlowVersionRetention(). Chạy:
 *   node_modules/.bin/sucrase-node lib/flow-version-retention.test.ts
 *
 * Lưu ý múi giờ: bucket giờ/ngày dùng Date LOCAL (giống bucketKey() gốc ở backup-diff.ts) — nên
 * mọi mốc "cùng ngày" trong test này dựng bằng THÀNH PHẦN local (new Date(y,m,d,h)) thay vì cộng
 * trừ mili giây thô từ NOW, để không phụ thuộc múi giờ máy chạy test (đã từng FAIL ở múi giờ
 * UTC+7 vì cộng giờ thô làm lệch sang ngày local kế tiếp).
 */
import { planFlowVersionRetention, type FlowVersionEntry } from './flow-version-retention';

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

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// NOW dựng bằng thành phần local (không phải parse chuỗi ISO/UTC) — tránh lệch ngày khi trừ giờ.
const NOW = new Date(2026, 7, 1, 12, 0, 0).getTime(); // 01/08/2026 12:00 GIỜ ĐỊA PHƯƠNG

// ── rỗng / 1 bản ──
ok('rỗng → xoá rỗng', planFlowVersionRetention([], NOW).length === 0);
ok('1 bản duy nhất → luôn giữ', planFlowVersionRetention([{ id: 'a', createdAtMs: NOW }], NOW).length === 0);

// ── mọi bản trong 1h → GIỮ HẾT, không tỉa gì ──
{
  const entries: FlowVersionEntry[] = [
    { id: 'a', createdAtMs: NOW - 50 * 60 * 1000 },
    { id: 'b', createdAtMs: NOW - 30 * 60 * 1000 },
    { id: 'c', createdAtMs: NOW - 5 * 60 * 1000 },
    { id: 'd', createdAtMs: NOW },
  ];
  ok('trong 1h: giữ hết, không xoá bản nào', planFlowVersionRetention(entries, NOW).length === 0);
}

// ── vùng "1 bản/giờ" (1h–24h tuổi): 3 bản CÙNG 1 giờ đồng hồ → chỉ giữ bản MỚI NHẤT của giờ đó ──
{
  const baseHour = NOW - 5 * HOUR; // tuổi 5h, nằm trong dải hourly (1h–24h)
  const entries: FlowVersionEntry[] = [
    { id: 'h1', createdAtMs: baseHour },
    { id: 'h2', createdAtMs: baseHour + 10 * 60 * 1000 },
    { id: 'h3', createdAtMs: baseHour + 20 * 60 * 1000 }, // cùng giờ với h1/h2 (chỉ +20 phút, không vượt biên giờ)
    { id: 'latest', createdAtMs: NOW },
  ];
  const del = planFlowVersionRetention(entries, NOW);
  ok('cùng 1 giờ: xoá 2 bản cũ hơn trong giờ', del.includes('h1') && del.includes('h2'));
  ok('cùng 1 giờ: giữ bản MỚI NHẤT của giờ đó', !del.includes('h3'));
  ok('bản mới nhất tổng thể luôn giữ', !del.includes('latest'));
}

// ── vùng "1 bản/ngày" (1–30 ngày tuổi): 2 bản CÙNG 1 NGÀY ĐỊA PHƯƠNG (dựng bằng thành phần
// local, giờ 09:00/10:00 — cách xa biên nửa đêm ở mọi múi giờ) → chỉ giữ bản mới hơn.
{
  const day = new Date(2026, 6, 22); // 22/07/2026, cách NOW đúng 10 ngày → tuổi nằm trong dải daily (1–30 ngày)
  const d1 = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0, 0).getTime();
  const d2 = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 0, 0).getTime();
  const entries: FlowVersionEntry[] = [
    { id: 'd1', createdAtMs: d1 },
    { id: 'd2', createdAtMs: d2 },
    { id: 'latest', createdAtMs: NOW },
  ];
  const del = planFlowVersionRetention(entries, NOW);
  ok('cùng 1 ngày: xoá bản cũ hơn trong ngày', del.includes('d1'));
  ok('cùng 1 ngày: giữ bản mới hơn trong ngày', !del.includes('d2'));
}

// ── vùng "1 bản/tuần" (>30 ngày tuổi): 2 bản trong CÙNG 1 khối tuần (Math.floor(ms/WEEK), tính
// từ epoch — KHÔNG phải lịch — nên neo trực tiếp vào biên khối thay vì suy từ NOW) → chỉ giữ 1.
{
  // Neo vào 1 khối tuần chắc chắn đã qua 30 ngày so với NOW: lùi 60 ngày rồi CĂN VỀ ĐẦU khối tuần
  // chứa mốc đó, đặt 2 bản cách nhau 1h ngay sau đầu khối — chắc chắn cùng khối, không đoán mò.
  const approxOld = NOW - 60 * DAY;
  const bucketStart = Math.floor(approxOld / WEEK) * WEEK;
  const w1 = bucketStart + HOUR;
  const w2 = bucketStart + 2 * HOUR;
  const entries: FlowVersionEntry[] = [
    { id: 'w1', createdAtMs: w1 },
    { id: 'w2', createdAtMs: w2 },
    { id: 'latest', createdAtMs: NOW },
  ];
  const del = planFlowVersionRetention(entries, NOW);
  ok('cùng 1 khối tuần (>30 ngày): tỉa còn 1 bản đại diện', del.length === 1);
  ok('bản mới nhất tổng thể vẫn giữ dù xa cụm tuần', !del.includes('latest'));
}

// ── an toàn: phần tử cuối sau khi sort theo thời gian luôn giữ, bất kể bucket ──
{
  const entries: FlowVersionEntry[] = [
    { id: 'old', createdAtMs: NOW - 65 * DAY },
    { id: 'newest', createdAtMs: NOW },
  ];
  const del = planFlowVersionRetention(entries, NOW);
  ok('phần tử mới nhất luôn giữ', !del.includes('newest'));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
