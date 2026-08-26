/**
 * lib/voice/nhan-dang.test.ts — canh luật "KHÔNG NÚT GIẢ, KHÔNG GIẢ VỜ NGHE".
 *
 * Ba trường hợp máy không nghe được là BA lý do khác nhau, và người dùng phải được nghe đúng lý
 * do của mình. Gộp cả ba thành một câu "không dùng được" là bỏ mặc người dùng đoán.
 */

import assert from 'assert';
import { khaNangNghe, taoMayNghe } from './nhan-dang';

let soCa = 0;
function ca(ten: string, f: () => void) {
  f();
  soCa++;
  console.log(`  ✓ ${ten}`);
}

console.log('lib/voice/nhan-dang.test.ts');

ca('không có window → nói thẳng, có tiếng Việt', () => {
  const k = khaNangNghe(undefined);
  // Chạy trong node: không có `window` toàn cục ⇒ nhánh này.
  assert.strictEqual(k.co, false);
  assert.strictEqual(k.lyDo, 'khong-co-window');
  assert.ok(k.noiThang && k.noiThang[0].length > 0);
});

ca('trình duyệt không có API → lý do RIÊNG, không gộp chung', () => {
  const k = khaNangNghe({ isSecureContext: true });
  assert.strictEqual(k.co, false);
  assert.strictEqual(k.lyDo, 'khong-co-api');
  assert.ok((k.noiThang as [string, string])[0].includes('gõ chữ'), 'phải chỉ đường đi tiếp');
});

ca('trang không an toàn (http) → lý do RIÊNG', () => {
  const k = khaNangNghe({ isSecureContext: false, SpeechRecognition: function () {} });
  assert.strictEqual(k.co, false);
  assert.strictEqual(k.lyDo, 'khong-an-toan');
});

ca('có API → nghe được, và KHÔNG kèm câu lý do thừa', () => {
  const k = khaNangNghe({ isSecureContext: true, webkitSpeechRecognition: function () {} });
  assert.strictEqual(k.co, true);
  assert.strictEqual(k.noiThang, undefined);
});

ca('taoMayNghe trả null khi không nghe được — nơi gọi buộc phải xử', () => {
  assert.strictEqual(taoMayNghe({ onBanChu: () => {} }, { isSecureContext: true }), null);
});

ca('⭐ độ tin cậy 0 của engine đọc là "CHƯA BIẾT", không phải "chắc 0%"', () => {
  const nhan: Array<{ doTinCay?: number; tamThoi: boolean; van: string }> = [];
  let onresult: ((ev: unknown) => void) | undefined;
  const win = {
    isSecureContext: true,
    SpeechRecognition: function (this: Record<string, unknown>) {
      Object.defineProperty(this, 'onresult', {
        set: (f: (ev: unknown) => void) => {
          onresult = f;
        },
        configurable: true,
      });
      this.start = () => {};
      this.stop = () => {};
    },
  };
  const may = taoMayNghe({ onBanChu: (b) => nhan.push(b) }, win);
  assert.ok(may);
  // engine trả confidence 0 kèm bản CHƯA chốt
  onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: 'vẽ tường', confidence: 0 }], { isFinal: false })] });
  assert.strictEqual(nhan.length, 1);
  assert.strictEqual(nhan[0].tamThoi, true);
  assert.strictEqual(nhan[0].doTinCay, undefined, 'không được bịa 0%');
});

console.log(`  → ${soCa} ca PASS`);
