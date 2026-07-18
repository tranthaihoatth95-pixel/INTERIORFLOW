/**
 * lib/photo-editor/handoff.test.ts — kiểm bridge Present ⇄ /photo-editor (PS-3). Chạy:
 *   node_modules/.bin/sucrase-node lib/photo-editor/handoff.test.ts
 *
 * CHIỀU VÀO: môi trường node KHÔNG có sessionStorage → đúng kịch bản "storage hỏng/offline",
 * stash phải rơi xuống mem-fallback và consume vẫn nhận đủ (consume-once) — cùng cách
 * lib/present-editor/handoff.test.ts tự kiểm.
 *
 * CHIỀU VỀ: node cũng không có localStorage — nhưng khác chiều vào, KHÔNG có mem-fallback ở
 * đây (2 tab thật, biến module-level không chia sẻ), nên polyfill 1 Storage tối thiểu (Map)
 * để bài test chạm được ĐÚNG code path localStorage thật, không chỉ nhánh catch.
 */
import {
  stashPhotoEditorIn,
  consumePhotoEditorIn,
  writePhotoEditorReturn,
  readPhotoEditorReturn,
  clearPhotoEditorReturn,
  type PhotoHandoffTarget,
} from './handoff';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const target: PhotoHandoffTarget = { slideId: 's1', elementId: 'i1' };

function testInMemFallback() {
  console.log('\n[1] CHIỀU VÀO — sessionStorage hỏng (node) → mem-fallback + consume-once');
  const gotStash = stashPhotoEditorIn('data:image/png;base64,AAA', target);
  ok('stash báo KHÔNG vào được sessionStorage (dùng mem)', gotStash === false);
  const got = consumePhotoEditorIn();
  ok('consume nhận đủ payload từ mem', got?.src === 'data:image/png;base64,AAA' && got?.target.slideId === 's1');
  ok('consume lần 2 → null (consume-once)', consumePhotoEditorIn() === null);
}

function testInInvalidNoop() {
  console.log('\n[2] CHIỀU VÀO — thiếu src/target → stash noop, consume null (mở biệt lập vẫn nguyên vẹn)');
  ok('src rỗng → stash false', stashPhotoEditorIn('', target) === false);
  ok('không có gì để consume → null', consumePhotoEditorIn() === null);
}

/** Polyfill Storage tối thiểu (Map) — CHỈ dùng để bài test chạm code path localStorage thật. */
function installFakeStorage(): void {
  const store = new Map<string, string>();
  const fake = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
  };
  (globalThis as Record<string, unknown>).localStorage = fake;
}

function testReturnRoundtrip() {
  console.log('\n[3] CHIỀU VỀ — localStorage thật (polyfill) — write/read/clear');
  installFakeStorage();
  ok('chưa ghi gì → read null', readPhotoEditorReturn() === null);
  const wrote = writePhotoEditorReturn('data:image/png;base64,BBB', target);
  ok('write báo thành công', wrote === true);
  const read1 = readPhotoEditorReturn();
  ok('read thấy đúng dataUrl + target', read1?.dataUrl === 'data:image/png;base64,BBB' && read1?.target.elementId === 'i1');
  const read2 = readPhotoEditorReturn();
  ok('read KHÔNG dọn (peek) — đọc lại vẫn thấy', read2?.dataUrl === 'data:image/png;base64,BBB');
  clearPhotoEditorReturn();
  ok('clear xong → read null', readPhotoEditorReturn() === null);
}

function testReturnAssetTarget() {
  console.log('\n[4] CHIỀU VỀ — target có assetId (ảnh liên kết) được giữ nguyên qua write/read');
  installFakeStorage();
  const linkedTarget: PhotoHandoffTarget = { slideId: 's2', elementId: 'i9', assetId: 'asset_x' };
  writePhotoEditorReturn('data:image/png;base64,CCC', linkedTarget);
  const read = readPhotoEditorReturn();
  ok('assetId đi kèm target còn nguyên', read?.target.assetId === 'asset_x');
  clearPhotoEditorReturn();
}

function testReturnInvalidNoop() {
  console.log('\n[5] CHIỀU VỀ — thiếu dataUrl/target → write false, read vẫn null');
  installFakeStorage();
  ok('dataUrl rỗng → write false', writePhotoEditorReturn('', target) === false);
  ok('không có gì được ghi → read null', readPhotoEditorReturn() === null);
}

testInMemFallback();
testInInvalidNoop();
testReturnRoundtrip();
testReturnAssetTarget();
testReturnInvalidNoop();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
