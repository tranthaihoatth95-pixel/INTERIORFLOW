/**
 * components/photo-editor/PhotoEditor.test.ts — G-M12-01 + G-M20-08 (07/08).
 *
 * `PhotoEditor.tsx` là 1 trong 3 component rủi ro cao nhất chọn để test: `onInvertMask` chạm
 * canvas/ảnh async (có thể ném lỗi thật — ảnh mask hỏng, `getContext('2d')` trả `null` trên
 * trình duyệt lạ) và TRƯỚC khi sửa KHÔNG có try/catch — lỗi rơi vào unhandled promise rejection,
 * người dùng bấm "Đảo mask" không thấy gì xảy ra, không biết vì sao, nút cũng không tự khoá
 * trong lúc chạy (đường MẤT DỮ LIỆU THAO TÁC im lặng). Không dựng được React/canvas thật trong
 * repo (không jsdom) nên test quét SOURCE THẬT — đúng khuôn `StoreHydrator.test.ts`.
 *
 * Chạy: node_modules/.bin/sucrase-node components/photo-editor/PhotoEditor.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';

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

/** Cắt đúng thân hàm `onInvertMask` bằng đếm ngoặc — tránh dính nhầm hàm khác đứng cạnh. */
function extractFunctionBody(source: string, marker: string): string {
  const start = source.indexOf(marker);
  if (start < 0) return '';
  let depth = 0;
  let i = source.indexOf('{', start);
  const bodyStart = i;
  for (; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart, i + 1);
    }
  }
  return source.slice(bodyStart);
}

const src = fs.readFileSync(path.join(__dirname, 'PhotoEditor.tsx'), 'utf8');

console.log('onInvertMask — có trong file (đối tượng đang kiểm tồn tại, không kiểm nhầm hàm đã đổi tên)');
{
  ok('const onInvertMask = useCallback( ... ) có mặt', src.includes('const onInvertMask = useCallback('));
}

const body = extractFunctionBody(src, 'const onInvertMask = useCallback(');

console.log('onInvertMask — G-M20-08: phải có try/catch/finally + trạng thái busy, đúng khuôn onExport liền kề');
{
  ok('có try {', /try\s*\{/.test(body));
  ok('có catch', /catch\s*\(/.test(body));
  ok('có finally', /finally\s*\{/.test(body));
  ok('khoá nút bằng setBusy trước khi chạy async', /setBusy\(/.test(body));
  ok('có báo lỗi cho người dùng (alert) khi catch — không nuốt lỗi im lặng', /alert\(/.test(body));
}

/* ---- ĐỐI CHỨNG: chứng minh bộ quét CÓ RĂNG — thân hàm CŨ (trước khi sửa) phải bị bắt lỗi ---- */
console.log('đối chứng — thân hàm CŨ (trước G-M20-08, chép lại nguyên văn từ git blame) phải bị test bắt thiếu');
{
  const OLD_BODY = `{
    // đảo mask của lớp chọn — làm ở canvas rồi commit
    const l = ed.selected;
    if (!l || !l.mask) return;
    (async () => {
      const img = await loadImage(l.mask!);
      const c = document.createElement('canvas');
      c.width = ed.doc.width;
      c.height = ed.doc.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255 - data.data[i];
        data.data[i + 1] = 255 - data.data[i + 1];
        data.data[i + 2] = 255 - data.data[i + 2];
      }
      ctx.putImageData(data, 0, 0);
      onCommitLayerMask(l.id, c.toDataURL('image/png'));
    })();
  }`;
  const hasTry = /try\s*\{/.test(OLD_BODY);
  const hasBusy = /setBusy\(/.test(OLD_BODY);
  ok('thân hàm CŨ không có try — đúng bug đã ghi trong G-M20-08', !hasTry);
  ok('thân hàm CŨ không có setBusy — đúng bug đã ghi trong G-M20-08', !hasBusy);
  ok('thân hàm MỚI (đang chạy trong repo) KHÁC thân hàm CŨ — xác nhận đã thật sự sửa, không phải test tự khớp bừa', body.trim() !== OLD_BODY.trim());
}

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
