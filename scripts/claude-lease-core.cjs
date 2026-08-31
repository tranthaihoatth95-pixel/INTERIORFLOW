'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function readEvents(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []; }
function state(events, now = Date.now()) {
  const leases = new Map();
  for (const event of events) {
    if (event.type === 'LEASE_ISSUED') leases.set(event.lease_id, { ...event, status: 'ACTIVE' });
    if (event.type === 'LEASE_REVOKED' && leases.has(event.lease_id)) leases.get(event.lease_id).status = 'REVOKED';
    // RENEW/AMEND chỉ ĐÈ LÊN trường của lease, không đụng `status`: một lease đã thu hồi mà
    // được renew vẫn là REVOKED. Sổ là append-only, trạng thái MỚI NHẤT thắng — nhờ vậy phiên
    // đang chạy hưởng ngay, vì env chỉ giữ `IF_LEASE_ID` chứ không giữ nội dung lease.
    if (event.type === 'LEASE_RENEWED' && leases.has(event.lease_id)) leases.get(event.lease_id).expires_at = event.expires_at;
    if (event.type === 'LEASE_AMENDED' && leases.has(event.lease_id)) leases.get(event.lease_id).files = event.files;
  }
  for (const lease of leases.values()) if (lease.status === 'ACTIVE' && lease.expires_at <= now) lease.status = 'EXPIRED';
  return [...leases.values()];
}
function findLease(events, id, now) { return state(events, now).find((v) => v.lease_id === id) || null; }
function activeWriter(events, now) { return state(events, now).find((v) => v.status === 'ACTIVE') || null; }
function issue({ events, system, lane, session_id, task_id, files, expires_at, issuer, now = Date.now() }) {
  if (activeWriter(events, now)) throw new Error('đã có production writer lease sống; thu hồi trước');
  if (system !== 'cl' || lane !== '06' || !session_id || !task_id || !files.length || expires_at <= now) throw new Error('lease fields không hợp lệ');
  return { v: 1, type: 'LEASE_ISSUED', lease_id: `L-${crypto.randomUUID()}`, system, lane, session_id, task_id, files, expires_at, issuer, generated_at: new Date(now).toISOString() };
}
// NỐI HẠN — không đặt lại từ bây giờ. Một lượt việc kéo dài hơn dự tính thì phần đã dùng vẫn
// phải nằm trong sổ: đặt lại từ `now` là lặng lẽ tặng thêm phần thời gian đã tiêu.
function renew({ events, lease_id, minutes, issuer, now = Date.now() }) {
  const lease = findLease(events, lease_id, now);
  if (!lease || lease.status !== 'ACTIVE') throw new Error('lease không sống hoặc không tồn tại');
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('renew cần --minutes là số > 0');
  return { v: 1, type: 'LEASE_RENEWED', lease_id, expires_at: lease.expires_at + minutes * 60_000, issuer, generated_at: new Date(now).toISOString() };
}

// THAY danh sách tệp. Trước 31/08 không có lệnh này, và cái giá đo được: ca đột biến của
// `phieu-ca` phải TẠM TRÚ nhờ trong `cau-mo-hinh.test.ts` vì lease 15 tệp không sửa được
// giữa phiên — tức cấu trúc sổ đẩy mã đi sai chỗ, rồi để lại một khoản nợ dọn dẹp.
function amend({ events, lease_id, files, issuer, now = Date.now() }) {
  const lease = findLease(events, lease_id, now);
  if (!lease || lease.status !== 'ACTIVE') throw new Error('lease không sống hoặc không tồn tại');
  if (!Array.isArray(files) || !files.length || files.some((v) => typeof v !== 'string' || !v.trim())) throw new Error('amend cần --files là mảng đường dẫn không rỗng');
  return { v: 1, type: 'LEASE_AMENDED', lease_id, files, issuer, generated_at: new Date(now).toISOString() };
}

function append(file, event) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.appendFileSync(file, `${JSON.stringify(event)}\n`, { mode: 0o600 }); }

// AI CẤP LEASE. Ba lối, theo thứ tự ưu tiên:
//   `--issuer-hoa <ghi chú>` — người thật đang ngồi ngay đó, ghi thẳng tên mình vào biên nhận
//   identity cx:00          — tuyến Codex điều phối
//   HANDOFF receipt cx:00→cl:06 — thẩm quyền được chuyển qua cầu, có biên nhận mở lại được
// Lối đầu sinh ra vì trước 31/08 KHÔNG có lối nào cho người: Hoà muốn cấp lease thì phải
// mượn identity `cx:00`. Biên nhận khi đó ghi tên một tuyến máy cho một quyết định của người —
// tức sổ nói dối đúng chỗ quan trọng nhất là "ai đã cho phép".
function resolveIssuer({ args = [], env = {}, handoffs = [] }) {
  const value = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const human = value('--issuer-hoa');
  if (human !== null) {
    const note = String(human).trim();
    if (!note || note.startsWith('--')) throw new Error('--issuer-hoa cần một ghi chú người thật, không rỗng');
    return `hoa:${note}`;
  }
  if (env.IF_SYSTEM === 'cx' && env.IF_LANE === '00' && env.BOS_SESSION_ID) return `cx:00/${env.BOS_SESSION_ID}`;
  const handoffId = value('--authority-handoff');
  const receipt = handoffs.find((event) => event.type === 'HANDOFF' && event.handoffId === handoffId);
  if (!receipt || receipt.from !== 'cx:00' || receipt.to !== 'cl:06') throw new Error('issuer phải là --issuer-hoa <ghi chú>, cx:00 identity, hoặc HANDOFF receipt cx:00→cl:06');
  if (value('--task') && receipt.task_id !== value('--task')) throw new Error('authority handoff không khớp task');
  return `handoff:${receipt.handoffId}/cx:00/${receipt.session_id}`;
}

module.exports = { activeWriter, amend, append, findLease, issue, readEvents, renew, resolveIssuer, state };
