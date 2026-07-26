/**
 * lib/cad/standards/room-type.test.ts — kiểm việc `roomType` persisted trên TextEntity (xem
 * docs/IF1-COMPLETION-AUDIT.md §3b). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/standards/room-type.test.ts
 *
 * 3 mảng test theo acceptance criteria của task:
 *  1. roomType đã gán → findRoomLabels() giữ NGUYÊN kind dù .text đổi sau đó (đổi text KHÔNG
 *     làm mất công năng phòng — đây là điểm cốt lõi của cả tính năng).
 *  2. backfillRoomTypes() gán đúng roomType cho doc kiểu cũ (chưa có field) + idempotent (gọi
 *     lần 2 không ghi đè, kể cả khi user đã CHỐT 1 giá trị khác classifyRoom() suy luận).
 *  3. checkStandards() vẫn ra ĐÚNG violation như trước cho doc KHÔNG có roomType (fallback
 *     classifyRoom() không đổi hành vi cũ).
 */
import { checkStandards, findRoomLabels, backfillRoomTypes } from './checker';
import { getAllRules } from './registry';
import { emptyDoc } from '../model';
import type { Doc, LineEntity, TextEntity } from '../model';
import { newId } from '../store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const LAY = 'l-wall';
function rectWalls(x0: number, y0: number, x1: number, y1: number): LineEntity[] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [0, 1, 2, 3].map((i) => ({ id: newId('e'), type: 'line' as const, layer: LAY, a: p[i], b: p[(i + 1) % 4] }));
}
function label(at: { x: number; y: number }, text: string, roomType?: TextEntity['roomType']): TextEntity {
  return { id: newId('e'), type: 'text', layer: 'l-text', at, text, h: 200, roomType };
}

function testRoomTypeSurvivesTextRename() {
  console.log('\n[1] roomType đã gán → findRoomLabels() giữ nguyên kind dù .text đổi sau đó');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  // Text nói "PHÒNG NGỦ" (classifyRoom sẽ ra 'bedroom') nhưng roomType CHỐT là 'office' — mô
  // phỏng user tự gán khác với suy luận từ chuỗi.
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ', 'office'));

  const rooms1 = findRoomLabels(doc);
  ok('dò được đúng 1 phòng', rooms1.length === 1);
  ok('kind = roomType đã gán (office), KHÔNG bị classifyRoom() ghi đè thành bedroom', rooms1[0]?.kind === 'office');

  // Đổi text label (rename) — roomType vẫn giữ nguyên trên entity.
  const renamed: Doc = {
    ...doc,
    entities: doc.entities.map((e) => (e.type === 'text' ? { ...e, text: 'KHÔNG GIAN LINH HOẠT' } : e)),
  };
  const rooms2 = findRoomLabels(renamed);
  ok('sau khi đổi text, vẫn dò được phòng', rooms2.length === 1);
  ok('kind KHÔNG đổi sau khi rename text (đây là acceptance test cốt lõi)', rooms2[0]?.kind === 'office');
  ok('tên hiển thị (name) đã cập nhật theo text mới', rooms2[0]?.name === 'KHÔNG GIAN LINH HOẠT');
}

function testBackfillAssignsAndIsIdempotent() {
  console.log('\n[2] backfillRoomTypes() gán đúng cho doc cũ + idempotent, không ghi đè lựa chọn user');
  const doc: Doc = emptyDoc();
  doc.entities.push(...rectWalls(0, 0, 4000, 3500));
  doc.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ')); // roomType undefined — dữ liệu cũ

  const backfilled = backfillRoomTypes(doc);
  const text1 = backfilled.entities.find((e) => e.type === 'text') as TextEntity | undefined;
  ok('backfill gán roomType = classifyRoom(text) = bedroom', text1?.roomType === 'bedroom');
  ok('backfillRoomTypes trả về Doc MỚI (không mutate input)', backfilled !== doc && doc.entities[doc.entities.length - 1].type === 'text' && (doc.entities[doc.entities.length - 1] as TextEntity).roomType === undefined);

  // Idempotent: gọi lần 2 trên doc ĐÃ backfill — không có gì đổi (không entity nào bị ghi đè).
  const backfilledAgain = backfillRoomTypes(backfilled);
  ok('gọi lần 2 = no-op, trả về CÙNG reference doc (không có entity nào cần đổi)', backfilledAgain === backfilled);

  // Idempotent tôn trọng lựa chọn user khác classifyRoom(): entity đã có roomType='office' dù
  // text là "PHÒNG NGỦ" (classifyRoom sẽ ra 'bedroom' nếu tính lại) — backfill KHÔNG được đè.
  const docUserOverride: Doc = emptyDoc();
  docUserOverride.entities.push(...rectWalls(0, 0, 4000, 3500));
  docUserOverride.entities.push(label({ x: 2000, y: 1750 }, 'PHÒNG NGỦ', 'office'));
  const backfilledOverride = backfillRoomTypes(docUserOverride);
  ok('doc đã có roomType (khác classifyRoom) → backfill giữ nguyên, KHÔNG ghi đè', backfilledOverride === docUserOverride);
  const textOverride = backfilledOverride.entities.find((e) => e.type === 'text') as TextEntity | undefined;
  ok('roomType vẫn là office (lựa chọn user), không bị classifyRoom() đè về bedroom', textOverride?.roomType === 'office');
}

function testCheckStandardsUnchangedWithoutRoomType() {
  console.log('\n[3] checkStandards() không đổi hành vi cũ cho doc KHÔNG có roomType (pure fallback)');
  const doc: Doc = emptyDoc();
  // Phòng ngủ dưới chuẩn (2.5×3m = 7.5m² < 9m² TCVN) — không set roomType, y hệt test cũ trong
  // checker.test.ts để đảm bảo fallback classifyRoom() vẫn hoạt động đúng như trước khi có field.
  doc.entities.push(...rectWalls(0, 0, 2500, 3000));
  doc.entities.push(label({ x: 1250, y: 1500 }, 'PHÒNG NGỦ'));
  const rules = getAllRules();
  const violations = checkStandards(doc, rules);
  const v = violations.find((v) => v.ruleId === 'vn-res-bedroom-min-area');
  ok('vẫn phát hiện vi phạm diện tích phòng ngủ qua fallback classifyRoom()', !!v);
  ok('violation vẫn có nguồn TCVN 4451:2012', !!v?.source.includes('TCVN 4451'));

  // WC đạt chuẩn — không có violation, y hệt hành vi cũ.
  const docWc: Doc = emptyDoc();
  docWc.entities.push(...rectWalls(0, 0, 2000, 2000)); // 4m² > 2.5m²
  docWc.entities.push(label({ x: 1000, y: 1000 }, 'WC'));
  const violationsWc = checkStandards(docWc, rules);
  ok('WC đạt chuẩn không sinh violation (hành vi cũ giữ nguyên)', !violationsWc.some((v) => v.ruleId === 'vn-res-wc-min-area'));
}

testRoomTypeSurvivesTextRename();
testBackfillAssignsAndIsIdempotent();
testCheckStandardsUnchangedWithoutRoomType();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
