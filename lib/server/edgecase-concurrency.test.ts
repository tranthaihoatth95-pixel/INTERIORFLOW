/**
 * lib/server/edgecase-concurrency.test.ts — BỔ SUNG cho lib/server/stress-auth.test.ts
 * (42 test đã có — KHÔNG viết lại, đọc trước để tránh trùng: domain variants, email edge
 * case, googleSignInGate 3 nhánh cơ bản, token exp=now, bypass injection). Viết lại thay
 * bản đã mất 15/07 (xem CHANGELOG.md "15/07 — 4 nhánh merge trước Sprint 3").
 * Chạy: node_modules/.bin/sucrase-node lib/server/edgecase-concurrency.test.ts
 *
 * KHÁC BIỆT với stress-auth.test.ts: file đó test HÀNH VI ĐƠN của các hàm; file NÀY nhắm
 * 3 khía cạnh MỚI theo yêu cầu: (a) race condition mô phỏng khi 2 request cùng lúc tạo user
 * cùng email, (b) giới hạn credit âm/tràn số, (c) session hết hạn ở 2 BIÊN KHÁC (không phải
 * "exp===now" đã có sẵn ở stress-auth.test.ts mục [4]): hằng số 30 ngày thật của createSession
 * + ngưỡng cập nhật lastSeenAt 20 giây.
 *
 * GIỚI HẠN KỸ THUẬT: `lib/server/auth.ts` import `jose` (SignJWT/jwtVerify) — gói này là
 * ESM-only, sucrase-node (CommonJS require) báo lỗi thẳng "ERR_REQUIRE_ESM" khi require()
 * chain đụng tới `node_modules/jose/dist/webapi/index.js` (đã thử nghiệm trực tiếp, xác
 * nhận lỗi). `lib/server/credits.ts` import `@/lib/server/db` (Prisma, alias không resolve
 * qua sucrase-node). Vì vậy:
 *   - Phần [1] dùng CODE THẬT 100% — `lib/server/auth-policy.ts` (isAllowedGoogleEmail,
 *     googleSignInGate) THUẦN, không import gì, resolve bình thường.
 *   - Phần [2]/[3] SAO CHÉP NGUYÊN VĂN 1-2 dòng biểu thức thuần từ nguồn thật (ghi rõ số
 *     dòng) — đúng tiền lệ đã có ở stress-auth.test.ts mục [4] ("Giả lập logic kiểm tra
 *     token expiry — pure, không cần jose", dòng 73-89 file đó).
 */
import { isAllowedGoogleEmail, googleSignInGate, GOOGLE_ALLOWED_DOMAIN, type GoogleGate } from './auth-policy';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ══════════════════ [1] Race condition mô phỏng — CODE THẬT (auth-policy.ts) ══════════════════ */
console.log(`[1] Race condition — 2 "request" cùng lúc tạo user cùng email @${GOOGLE_ALLOWED_DOMAIN} (googleSignInGate thật)`);
{
  // Kịch bản race kinh điển (TOCTOU — time-of-check-to-time-of-use): request A và request B
  // CÙNG LÚC nhận Google callback cho CÙNG 1 email chưa từng đăng ký. Cả 2 đều query DB
  // "user đã tồn tại chưa?" TRƯỚC KHI bất kỳ request nào commit insert — cả 2 đều thấy
  // userExists=false (dữ liệu CŨ, chưa có request nào ghi xong).
  const email = 'race-new-user@ttt.vn';
  const decisionA = googleSignInGate(email, false); // request A đọc DB: chưa có user
  const decisionB = googleSignInGate(email, false); // request B đọc DB CÙNG THỜI ĐIỂM: cũng chưa có
  ok('cả 2 request race cùng thấy userExists=false → CẢ 2 đều quyết định "create" (hàm thuần không tự biết về request kia)', decisionA === 'create' && decisionB === 'create');
  // → Đây CHÍNH LÀ lý do DB (Prisma) PHẢI có unique constraint trên email — googleSignInGate
  // chỉ là quyết định THUẦN dựa trên input nó nhận, không tự chống race. Ghi nhận rõ: bảo vệ
  // thật nằm ở tầng DB (email unique index), KHÔNG nằm ở hàm này — test khoá đúng giới hạn
  // của lớp pure-logic để không ai lầm tưởng gọi lại hàm này nhiều lần là đủ an toàn.

  // Kịch bản AN TOÀN (serialized, không race): A thắng và COMMIT xong trước khi B query DB.
  const decisionA2 = googleSignInGate(email, false); // A: chưa có → tạo
  const decisionB2 = googleSignInGate(email, true); // B: đọc SAU khi A đã commit → thấy user đã tồn tại
  ok('thứ tự an toàn (A commit xong rồi B mới đọc) → A "create", B "login-existing" (KHÔNG tạo trùng)', decisionA2 === 'create' && decisionB2 === 'login-existing');

  // Race với email NGOÀI domain — an toàn tự nhiên vì kết quả không phụ thuộc thứ tự (luôn deny).
  const outsideEmail = 'race-outside@gmail.com';
  const d1 = googleSignInGate(outsideEmail, false);
  const d2 = googleSignInGate(outsideEmail, false);
  ok('race với email NGOÀI domain (chưa tồn tại) → CẢ 2 lần đều "deny" như nhau, race vô hại (không có nhánh nào tạo được để trùng)', d1 === 'deny-new-outside-domain' && d2 === 'deny-new-outside-domain');

  // 50 "request" đồng thời mô phỏng (mảng gọi liên tiếp cùng input) — quyết định phải NHẤT
  // QUÁN 100% (hàm thuần, không side-effect, không có state ẩn rò rỉ giữa các lần gọi).
  const results: GoogleGate[] = [];
  for (let i = 0; i < 50; i++) results.push(googleSignInGate('race-batch@ttt.vn', false));
  ok('50 lần gọi "đồng thời" (input giống hệt) → 100% nhất quán "create", không có lần nào lệch (hàm thuần, không rò rỉ state)', results.every((r) => r === 'create') && results.length === 50);
}

/* ══════════════════ [2] Giới hạn credit âm/tràn số — sao chép guard-clause thật lib/server/credits.ts:16-17 ══════════════════ */
console.log('\n[2] Chuẩn hoá số credit (sao chép nguyên văn lib/server/credits.ts dòng 16-17) — âm/0/NaN/tràn số');
/** Sao y nguyên văn: `const amt = Math.abs(Math.round(amount)); if (!amt) return true;`
 * (spendCredits) — 2 dòng đầu tiên của hàm, TRƯỚC khi chạm Prisma (không cần DB để test). */
function normalizeSpendAmount(amount: number): { amt: number; noOpEarlyReturn: boolean } {
  const amt = Math.abs(Math.round(amount));
  return { amt, noOpEarlyReturn: !amt };
}
{
  ok('amount ÂM (-50) → Math.abs quy về dương 50 (trừ đúng 50, không trừ ra ÂM credit)', normalizeSpendAmount(-50).amt === 50);
  ok('amount = 0 → amt=0 → early-return true (no-op, không đụng DB, không tạo transaction rác)', normalizeSpendAmount(0).noOpEarlyReturn === true);
  ok('amount = -0 (âm 0) → Math.abs/Math.round vẫn ra 0 → early-return true', normalizeSpendAmount(-0).noOpEarlyReturn === true);

  // P2 — hành vi thật đáng chú ý: NaN là falsy trong JS (`!NaN === true`), nên amount=NaN
  // KHÔNG bị coi là lỗi mà bị "nuốt êm" thành no-op — request trừ credit với NaN sẽ ÂM THẦM
  // THÀNH CÔNG (trả true) mà KHÔNG trừ gì cả. Ghi nhận đúng tinh thần "P2" trong stress-
  // auth.test.ts (NaN token expiry quirk) — cùng 1 lớp bug tiềm ẩn ở 1 module khác.
  const nanResult = normalizeSpendAmount(NaN);
  ok('amount = NaN → Math.round/abs(NaN)=NaN → NaN falsy → early-return true (P2: NaN bị nuốt êm thành "thành công", không trừ credit)', Number.isNaN(nanResult.amt) && nanResult.noOpEarlyReturn === true);

  // Infinity: KHÔNG rơi vào early-return (Infinity là truthy) — sẽ CỐ trừ vô hạn credit nếu đi
  // tiếp vào Prisma updateMany (where credits >= Infinity gần như luôn false nên spend sẽ fail
  // tự nhiên ở tầng DB, nhưng biểu thức THUẦN ở đây không tự chặn Infinity).
  const infResult = normalizeSpendAmount(Infinity);
  ok('amount = Infinity → KHÔNG bị coi là no-op (Infinity truthy) → amt=Infinity đi tiếp xuống tầng DB (không tự chặn ở bước chuẩn hoá)', infResult.amt === Infinity && infResult.noOpEarlyReturn === false);

  // Số thập phân dưới 1 (0.4) → Math.round về 0 → bị nuốt thành no-op (credit lẻ dưới 1 đơn vị
  // KHÔNG BAO GIỜ trừ được gì, dù gọi liên tục nhiều lần — không tích luỹ phần dư).
  ok('amount = 0.4 (dưới 0.5) → Math.round về 0 → no-op, KHÔNG trừ gì (không tích luỹ phần lẻ)', normalizeSpendAmount(0.4).noOpEarlyReturn === true);
  ok('amount = 0.5 (đúng biên .5) → Math.round làm tròn LÊN theo quy ước JS → amt=1', normalizeSpendAmount(0.5).amt === 1);

  // Tràn số an toàn (Number.MAX_SAFE_INTEGER) — vẫn ra số hữu hạn hợp lệ, không NaN/Infinity giả.
  const overflow = normalizeSpendAmount(Number.MAX_SAFE_INTEGER + 100);
  ok('amount vượt Number.MAX_SAFE_INTEGER → vẫn là số hữu hạn (không NaN), dù có thể mất độ chính xác bit thấp', Number.isFinite(overflow.amt) && overflow.noOpEarlyReturn === false);
}

/* ══════════════════ [3] Session hết hạn — 2 BIÊN MỚI (khác exp===now đã có ở stress-auth.test.ts) ══════════════════ */
console.log('\n[3a] Session — hằng số 30 NGÀY THẬT của createSession (lib/server/auth.ts:23 setExpirationTime(\'30d\'))');
/** Cùng công thức isTokenExpired đã dùng ở stress-auth.test.ts mục [4] (`now >= exp`, đơn vị
 * giây — khớp chuẩn JWT `exp`/`iat`), áp vào cửa sổ 30 NGÀY THẬT thay vì now±3600 tuỳ ý. */
function isTokenExpired(exp: number, now: number): boolean { return now >= exp; }
{
  const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60; // khớp chuỗi '30d' thật trong createSession
  const iat = 1_753_000_000; // epoch giây cố định, KHÔNG phụ thuộc Date.now() lúc chạy test (tất định)
  const exp = iat + THIRTY_DAYS_SEC;
  ok('đúng 1 giây TRƯỚC mốc hết hạn 30 ngày → vẫn còn hạn', isTokenExpired(exp, exp - 1) === false);
  ok('ĐÚNG LÚC hết hạn (now === iat+30 ngày) → hết hạn (biên đóng, cùng quy ước `>=` đã khoá ở stress-auth.test.ts)', isTokenExpired(exp, exp) === true);
  ok('1 giây SAU mốc 30 ngày → hết hạn', isTokenExpired(exp, exp + 1) === true);
  // Số giây của 30 ngày là số nguyên lớn (2,592,000) nhưng vẫn nằm rất xa giới hạn an toàn của
  // Number (2^53) — không có sai số làm tròn nào ở quy mô "epoch giây" thực tế (khác hẳn phép
  // thử toạ độ CAD 1e12 ở lib/cad — domain thời gian không chạm ngưỡng mất độ chính xác).
  ok('THIRTY_DAYS_SEC tính đúng 2,592,000 giây, không sai số', THIRTY_DAYS_SEC === 2_592_000);
}

console.log('\n[3b] Session — ngưỡng cập nhật lastSeenAt 20 GIÂY (lib/server/auth.ts:47, khác hẳn cơ chế exp JWT)');
/** Sao y nguyên văn điều kiện: `Date.now() - user.lastSeenAt.getTime() > 20_000` (getSessionUser,
 * auth.ts dòng 47) — dùng mili-giây (khác exp JWT dùng giây), so sánh `>` (KHÔNG phải `>=`). */
function needsPresenceUpdate(lastSeenMs: number, nowMs: number): boolean {
  return nowMs - lastSeenMs > 20_000;
}
{
  ok('lệch ĐÚNG 20000ms (biên chính xác) → dùng `>` nên KHÔNG cập nhật (khác quy ước `>=` của exp JWT ở trên — 2 cơ chế session riêng biệt, biên khác nhau)', needsPresenceUpdate(0, 20_000) === false);
  ok('lệch 19999ms (dưới biên 1ms) → chưa cập nhật', needsPresenceUpdate(0, 19_999) === false);
  ok('lệch 20001ms (trên biên 1ms) → phải cập nhật lastSeenAt', needsPresenceUpdate(0, 20_001) === true);
  ok('lệch = 0 (vừa cập nhật xong, truy vấn lại ngay) → không cập nhật lại (tránh spam write)', needsPresenceUpdate(1000, 1000) === false);

  // Nhiều phiên (session) hết hạn/cần-update ĐỒNG THỜI ở CÙNG 1 mốc `now` snapshot — xác nhận
  // đánh giá độc lập, không có phiên nào "rò" trạng thái từ phiên khác (thuần, không state ẩn).
  const now = 1_000_000;
  const sessions = [
    { id: 'A', lastSeen: now - 20_001 }, // vừa qua biên → cập nhật
    { id: 'B', lastSeen: now - 20_000 }, // đúng biên → KHÔNG cập nhật
    { id: 'C', lastSeen: now - 19_999 }, // dưới biên → không cập nhật
    { id: 'D', lastSeen: now }, // vừa xong → không cập nhật
  ];
  const results = sessions.map((s) => ({ id: s.id, update: needsPresenceUpdate(s.lastSeen, now) }));
  ok('4 phiên hết hạn/không hết hạn ĐỒNG THỜI cùng 1 mốc `now` → mỗi phiên đánh giá ĐÚNG ĐỘC LẬP theo lastSeen riêng (A update, B/C/D không)', JSON.stringify(results) === JSON.stringify([{ id: 'A', update: true }, { id: 'B', update: false }, { id: 'C', update: false }, { id: 'D', update: false }]));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
