/**
 * lib/commands/toolbar-doc-registry.test.ts — kiểm **B2**: ba thanh công cụ đọc CHUNG một sổ lệnh
 * (`docs/phieu-giao/P-C-toolbar-doc-so-lenh.md` ô④, `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` §4).
 *
 * 6 nhóm:
 *  [1] tầng ① giống hệt ở cả ba chặng (đây là câu trả lời cho "3 chặng như 3 app")
 *  [2] lệnh chưa đủ điều kiện phải MỜ KÈM LÝ DO, không mất tích (§9)
 *  [3] HAI ĐƯỜNG NHẬP — giữ cả alias gõ lẫn phím đơn, không chọn phe
 *  [4] cạm bẫy phím-đơn-cướp-ký-tự-đang-gõ
 *  [5] `bindStage` — chặng đắp tay thi hành lên danh sách của sổ
 *  [6] không lệch giữa sổ lệnh và mặt tiền (icon có thật, phím không đụng nhau)
 *
 * Chạy: node_modules/.bin/sucrase-node lib/commands/toolbar-doc-registry.test.ts
 */
import { COMMANDS, type WhenCtx } from './registry';
import {
  commonCommandsFor, isCommonCommand, bindStage,
  inputPathsFor, shouldDirectKeyFire, findByDirectKey,
} from './toolbar-source';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const CTX_2D: WhenCtx = { stage: 'cad', mode: 'pro', proToolsAllowed: true };
const CTX_3D: WhenCtx = { stage: 'render' };
const CTX_TC: WhenCtx = { stage: 'present' };

/* ── 1) Tầng ① GIỐNG HỆT ở cả ba chặng ─────────────────────────────────── */
function testBaChangGiongNhau() {
  console.log('\n[1] Tầng ① — ba chặng cùng một bộ lệnh chung');

  const a = commonCommandsFor(CTX_2D);
  const b = commonCommandsFor(CTX_3D);
  const c = commonCommandsFor(CTX_TC);

  ok('cả 3 chặng cùng trả về đúng 10 lệnh chung', a.length === 10 && b.length === 10 && c.length === 10);

  const ids = (x: typeof a) => x.map((i) => i.id).join('|');
  ok('cùng bộ id, CÙNG THỨ TỰ ở cả 3 chặng', ids(a) === ids(b) && ids(b) === ids(c));

  const icons = (x: typeof a) => x.map((i) => i.icon).join('|');
  ok('cùng icon ở cả 3 chặng (không chặng nào tự vẽ khác)', icons(a) === icons(b) && icons(b) === icons(c));

  const labels = (x: typeof a) => x.map((i) => i.label[0]).join('|');
  ok('cùng NHÃN ở cả 3 chặng — hết cảnh "Đo nhanh"/"Thước" cho một việc', labels(a) === labels(b) && labels(b) === labels(c));

  // Đúng 10 lệnh ticket §2 liệt kê (9 lệnh chung, Hoàn tác+Làm lại là một lệnh hai chiều).
  const mong = [
    'cad.draw.text', 'cad.dim.measure', 'cad.edit.move', 'cad.edit.copy', 'cad.edit.rotate',
    'cad.edit.mirror', 'cad.sel.select', 'cad.sel.delete', 'cad.sel.undo', 'cad.sel.redo',
  ].sort().join('|');
  ok('đúng 10 lệnh ticket §2 khai, không thừa không thiếu', a.map((i) => i.id).sort().join('|') === mong);

  ok('`isCommonCommand` chỉ nhận lệnh khai đủ 3 chặng', COMMANDS.filter(isCommonCommand).length === 10);

  const draw = COMMANDS.find((x) => x.id === 'cad.draw.line');
  ok('lệnh chỉ-2D (Đường thẳng) KHÔNG bị tính là lệnh chung', !!draw && !isCommonCommand(draw));
}

/* ── 2) Mờ KÈM LÝ DO, không mất tích ───────────────────────────────────── */
function testMoKemLyDo() {
  console.log('\n[2] Lệnh chưa đủ điều kiện — mờ kèm lý do, KHÔNG bị lọc bỏ');

  const tc = commonCommandsFor(CTX_TC);
  ok('Trình chiếu vẫn nhận đủ 10 nút dù phần lớn chưa chạy được', tc.length === 10);
  ok('mọi lệnh mờ đều CÓ lý do (§9 cấm nút giả)', tc.filter((c) => !c.enabled).every((c) => !!c.disabledReason && c.disabledReason.length > 0));

  const lat3d = commonCommandsFor(CTX_3D).find((c) => c.id === 'cad.edit.mirror')!;
  ok('3D: Lật mờ (3D chưa có lệnh đối xứng — lỗ trống ticket §2b nêu)', !lat3d.enabled);
  ok('3D: lý do của Lật nói đúng việc, không phải câu chung', /đối xứng/i.test(lat3d.disabledReason ?? ''));

  const chu2d = commonCommandsFor(CTX_2D).find((c) => c.id === 'cad.draw.text')!;
  ok('2D: Chữ chạy được nên KHÔNG có lý do mờ', chu2d.enabled && chu2d.disabledReason === undefined);

  // Lý do phải là lời NGƯỜI DÙNG đọc — không lộ jargon nội bộ (SPEC-NGON-NGU-CHI-DAN luật 2).
  const jargon = /useCadStore|registry|store\b|when\(|CommandDef/;
  const moiLyDo = [...commonCommandsFor(CTX_3D), ...tc].filter((c) => !c.enabled).map((c) => c.disabledReason ?? '');
  ok('không câu lý do nào lộ jargon nội bộ ra giao diện', moiLyDo.every((s) => !jargon.test(s)));
}

/* ── 3) HAI ĐƯỜNG NHẬP — không chọn phe ────────────────────────────────── */
function testHaiDuongNhap() {
  console.log('\n[3] Hai đường nhập — alias gõ VÀ phím đơn cùng sống');

  const xoay = COMMANDS.find((c) => c.id === 'cad.edit.rotate')!;
  ok('Xoay giữ CẢ alias gõ "RO" (2D) LẪN phím đơn "Q" (3D)', xoay.aliases.includes('RO') && xoay.directKey === 'Q');

  const chep = COMMANDS.find((c) => c.id === 'cad.edit.copy')!;
  ok('Chép giữ cả "CO" lẫn "D"', chep.aliases.includes('CO') && chep.directKey === 'D');

  const do_ = COMMANDS.find((c) => c.id === 'cad.dim.measure')!;
  ok('Đo giữ cả "DI" lẫn "T"', do_.aliases.includes('DI') && do_.directKey === 'T');

  const chon = COMMANDS.find((c) => c.id === 'cad.sel.select')!;
  ok('Chọn giữ cả phím chính Esc lẫn phím đơn V (registry.ts:428-431)', (chon.key ?? []).includes('Esc') && chon.directKey === 'V');

  // B2 KHÔNG được đẻ alias mới từ phím đơn (trộn hai cơ chế = sai kiểu dữ liệu, B1 cố ý tránh).
  // Q và V là hai chữ THUẦN 3D — không lệnh nào ở sổ được nhận chúng làm alias gõ.
  ok('không alias gõ nào là "Q" hay "V" (B2 không nhét phím đơn vào ô alias)',
    COMMANDS.every((c) => !c.aliases.includes('Q') && !c.aliases.includes('V')));

  /* 🔴 BẪY CHÉO CHẶNG — test này GHI LẠI một sự thật khó chịu, không phải khẳng định "đã ổn":
     ba chữ M · D · T vừa là alias gõ ở 2D vừa là phím đơn ở 3D, và HAI TRONG BA MANG NGHĨA KHÁC
     NHAU. Hôm nay chưa vỡ vì 2D không bật đường phím đơn (`inputPathsFor('cad') === ['typed']`),
     nhưng ngày nào 2D/Trình chiếu có phím đơn thì đây là chỗ nổ đầu tiên. Để test đứng đây làm
     chuông báo: đổi ánh xạ mà quên chỗ này thì nó đỏ. */
  const nghia = (chu: string) => ({
    alias2D: COMMANDS.find((c) => c.aliases.includes(chu))?.id,
    phim3D: COMMANDS.find((c) => c.directKey?.toUpperCase() === chu)?.id,
  });
  const m = nghia('M');
  ok('M: alias 2D và phím 3D CÙNG nghĩa (Dời) — không phải học lại', m.alias2D === 'cad.edit.move' && m.phim3D === 'cad.edit.move');
  const d = nghia('D');
  ok('D: 2D là Cửa đi, 3D là Chép — LỆCH NGHĨA, đã ghi nhận (chưa vỡ vì 2D không bật phím đơn)',
    d.alias2D === 'cad.draw.door' && d.phim3D === 'cad.edit.copy');
  const t = nghia('T');
  ok('T: 2D là Chữ, 3D là Đo — LỆCH NGHĨA, đã ghi nhận',
    t.alias2D === 'cad.draw.text' && t.phim3D === 'cad.dim.measure');

  ok('2D bật đường GÕ, không bật phím đơn', inputPathsFor('cad').join() === 'typed');
  ok('3D bật PHÍM ĐƠN, không bật đường gõ', inputPathsFor('render').join() === 'directKey');
  ok('Trình chiếu chưa có đường nhập nào — nói thật, không bịa', inputPathsFor('present').length === 0);

  ok('tra phím đơn ở 3D: "q" → Xoay', findByDirectKey('q', CTX_3D)?.id === 'cad.edit.rotate');
  ok('tra phím đơn ở 3D không phân biệt hoa/thường', findByDirectKey('Q', CTX_3D)?.id === 'cad.edit.rotate');
  ok('tra phím đơn ở 2D KHÔNG khớp gì — 2D không bật đường đó', findByDirectKey('q', CTX_2D) === undefined);
}

/* ── 4) Cạm bẫy phím đơn cướp ký tự đang gõ ────────────────────────────── */
function testKhongCuopKyTu() {
  console.log('\n[4] Phím đơn KHÔNG được cướp ký tự đang gõ');

  const nen: Parameters<typeof shouldDirectKeyFire>[0] = {
    stage: 'render', inTextField: false, commandLineBuffer: '', hasModifier: false,
  };
  ok('3D, không gõ gì, không giữ phím phụ → phím đơn ĂN', shouldDirectKeyFire(nen));
  ok('đang ở ô nhập chữ → KHÔNG ăn', !shouldDirectKeyFire({ ...nen, inTextField: true }));
  ok('giữ ⌘/Ctrl/Alt/Shift → KHÔNG ăn (tổ hợp là địa hạt của `key`)', !shouldDirectKeyFire({ ...nen, hasModifier: true }));

  // Đây là ca ticket §1 nêu đích danh: gõ "REC" mà phím R cướp mất thì không vẽ nổi chữ nhật.
  ok('đang gõ dở "RE" ở dòng lệnh → KHÔNG ăn (ca REC)', !shouldDirectKeyFire({ ...nen, commandLineBuffer: 'RE' }));
  ok('dòng lệnh mới gõ 1 ký tự cũng đủ chặn', !shouldDirectKeyFire({ ...nen, commandLineBuffer: 'R' }));
  ok('2D không bao giờ để phím đơn ăn — chặng này nhập bằng dòng lệnh', !shouldDirectKeyFire({ ...nen, stage: 'cad' }));
  ok('Trình chiếu chưa bật đường phím đơn → không ăn', !shouldDirectKeyFire({ ...nen, stage: 'present' }));
}

/* ── 5) bindStage — chặng đắp tay thi hành ─────────────────────────────── */
function testBindStage() {
  console.log('\n[5] bindStage — danh sách của sổ, tay thi hành của chặng');

  let chay = 0;
  const bound = bindStage(commonCommandsFor(CTX_3D), {
    'cad.edit.rotate': { run: () => { chay += 1; }, active: true },
  });

  const xoay = bound.find((c) => c.id === 'cad.edit.rotate')!;
  ok('có binding → lệnh bật lên dù sổ lệnh chặn ở chặng đó', xoay.enabled);
  ok('có binding → lý do mờ được gỡ', xoay.disabledReason === undefined);
  xoay.run();
  ok('có binding → chạy đúng tay thi hành của chặng', chay === 1);
  ok('có binding → `active` truyền được qua', xoay.active);

  const lat = bound.find((c) => c.id === 'cad.edit.mirror')!;
  ok('không binding → giữ nguyên kết quả sổ lệnh (vẫn mờ, vẫn có lý do)', !lat.enabled && !!lat.disabledReason);
  ok('không binding → vẫn NẰM TRONG danh sách, không bị lọc bỏ', bound.length === 10);

  // "Có engine nhưng lúc này không bấm được" khác hẳn "chặng này chưa làm được bao giờ".
  const tam = bindStage(commonCommandsFor(CTX_2D), {
    'cad.sel.undo': { run: () => {}, unavailableReason: 'Chưa có thao tác nào để hoàn tác' },
  }).find((c) => c.id === 'cad.sel.undo')!;
  ok('`unavailableReason` → mờ tạm thời kèm đúng lý do', !tam.enabled && tam.disabledReason === 'Chưa có thao tác nào để hoàn tác');
}

/* ── 6) Không lệch giữa sổ lệnh và mặt tiền ────────────────────────────── */
function testKhongLech() {
  console.log('\n[6] Sổ lệnh ↔ mặt tiền — không lệch');

  const chung = COMMANDS.filter(isCommonCommand);
  ok('mọi lệnh chung đều có `icon` (mặt tiền không phải tự chọn)', chung.every((c) => !!c.icon));
  ok('mọi lệnh chung đều có ít nhất 1 alias gõ', chung.every((c) => c.aliases.length > 0));

  // Danh sách trắng của `components/ui/command-icon.tsx` — chép tay ở đây là CỐ Ý: file kia là
  // React (.tsx), test thuần không import được. Lệch một tên là nút hiện dấu hỏi.
  const ICON_CO_THAT = new Set([
    'MousePointer2', 'Move', 'RotateCw', 'Copy', 'FlipHorizontal2', 'Trash2',
    'Undo2', 'Redo2', 'MoveDiagonal', 'Type', 'HelpCircle',
  ]);
  ok('mọi icon lệnh chung đều có trong bảng tra của command-icon.tsx', chung.every((c) => ICON_CO_THAT.has(c.icon!)));

  // Hai phím đơn trùng nhau ở cùng một chặng = một cú bấm hai nghĩa.
  const keys = chung.map((c) => c.directKey).filter(Boolean) as string[];
  ok('không hai lệnh chung nào trùng phím đơn', new Set(keys.map((k) => k.toLowerCase())).size === keys.length);

  // Phím đơn của lệnh chung không được đụng phím đơn tool riêng của 3D (L/R/C của Vẽ).
  const TOOL_3D_RIENG = ['l', 'r', 'c'];
  ok('phím đơn lệnh chung không đụng L/R/C của nhóm Vẽ 3D', keys.every((k) => !TOOL_3D_RIENG.includes(k.toLowerCase())));

  ok('5 lệnh chung có phím đơn thật, 5 lệnh còn lại để trống (không bịa phím)', keys.length === 5);
}

testBaChangGiongNhau();
testMoKemLyDo();
testHaiDuongNhap();
testKhongCuopKyTu();
testBindStage();
testKhongLech();

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
