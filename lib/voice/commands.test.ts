/**
 * lib/voice/commands.test.ts — ngữ pháp lệnh giọng nói: tất định, VI/EN, không đổi dữ liệu.
 * Chạy: node_modules/.bin/sucrase-node lib/voice/commands.test.ts
 */
import { parseVoiceNav, applyVoiceNav, normalizeUtterance, describeVoiceNav, voiceNavHints } from './commands';

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log('  ok  -', m); } else { fail++; console.log('  FAIL-', m); } };
const k = (s: string) => parseVoiceNav(s).kind;

console.log('[1] Chuẩn hoá — bỏ dấu, hạ chữ, dấu câu');
ok(normalizeUtterance('Trang Tiếp!') === 'trang tiep', 'bỏ dấu + hạ chữ + bỏ dấu câu');
ok(normalizeUtterance('  Đến   trang  Ba ') === 'den trang ba', 'đ → d, gom khoảng trắng');

console.log('[2] VI — tiếp/lùi/đầu/cuối/tới trang N');
ok(k('trang tiếp') === 'next' && k('tiếp theo') === 'next' && k('sang trang') === 'next', 'next VI');
ok(k('trang trước') === 'prev' && k('quay lại') === 'prev' && k('lùi lại') === 'prev', 'prev VI');
ok(k('trang đầu') === 'first' && k('về đầu') === 'first', 'first VI');
ok(k('trang cuối') === 'last', 'last VI');
const g5 = parseVoiceNav('tới trang 5');
ok(g5.kind === 'goto' && g5.page === 5, 'goto số');
const g3 = parseVoiceNav('đến trang ba');
ok(g3.kind === 'goto' && g3.page === 3, 'goto chữ');
const g12 = parseVoiceNav('trang mười hai');
ok(g12.kind === 'goto' && g12.page === 12, 'goto "mười hai" = 12');
const g23 = parseVoiceNav('trang hai mươi ba');
ok(g23.kind === 'goto' && g23.page === 23, 'goto "hai mươi ba" = 23');
ok(k('dừng nghe') === 'stop' && k('tắt mic') === 'stop', 'stop VI');

console.log('[3] EN');
ok(k('next slide') === 'next' && k('next') === 'next' && k('forward') === 'next', 'next EN');
ok(k('go back') === 'prev' && k('previous') === 'prev', 'prev EN');
ok(k('first slide') === 'first' && k('last page') === 'last', 'first/last EN');
const e7 = parseVoiceNav('go to slide seven');
ok(e7.kind === 'goto' && e7.page === 7, 'goto EN chữ');
ok(k('stop listening') === 'stop', 'stop EN');

console.log('[4] Không khớp → none; "trang" không số → theo từ khoá còn lại; ưu tiên');
ok(k('hôm nay trời đẹp') === 'none' && k('') === 'none', 'câu lạ / rỗng → none');
ok(k('trang tiếp theo') === 'next', '"trang" không có số → rơi về từ khoá tiếp');
ok(k('dừng nghe trang tiếp') === 'stop', 'stop thắng mọi lệnh khác');
ok(k('tới trang 4 tiếp') === 'goto', 'goto thắng next');

console.log('[5] Áp lệnh — kẹp biên, không đổi gì với none/stop');
ok(applyVoiceNav({ kind: 'next' }, 0, 3) === 1 && applyVoiceNav({ kind: 'next' }, 2, 3) === 2, 'next kẹp cuối');
ok(applyVoiceNav({ kind: 'prev' }, 0, 3) === 0, 'prev kẹp đầu');
ok(applyVoiceNav({ kind: 'goto', page: 99 }, 0, 3) === 2 && applyVoiceNav({ kind: 'goto', page: 1 }, 2, 3) === 0, 'goto kẹp');
ok(applyVoiceNav({ kind: 'first' }, 2, 3) === 0 && applyVoiceNav({ kind: 'last' }, 0, 3) === 2, 'first/last');
ok(applyVoiceNav({ kind: 'none' }, 1, 3) === 1 && applyVoiceNav({ kind: 'stop' }, 1, 3) === 1, 'none/stop giữ nguyên');
ok(applyVoiceNav({ kind: 'next' }, 0, 0) === 0, 'deck rỗng → 0');

console.log('[6] Mô tả + gợi ý song ngữ, gợi ý đều parse được');
ok(describeVoiceNav({ kind: 'goto', page: 3 }, 'vi') === 'Tới trang 3' && describeVoiceNav({ kind: 'next' }, 'en') === 'Next slide', 'mô tả');
ok(voiceNavHints('vi').every((h) => parseVoiceNav(h).kind !== 'none') && voiceNavHints('en').every((h) => parseVoiceNav(h).kind !== 'none'), 'mọi gợi ý đều là lệnh thật');

console.log(`\n${pass} ok · ${fail} fail`);
if (fail) process.exit(1);
