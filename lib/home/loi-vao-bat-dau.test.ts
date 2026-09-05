/** Test BA LỐI VÀO của Home + hai bất biến chống tái phát lỗi chặn D-J04a / D-J04b.
 *  Chạy: node_modules/.bin/sucrase-node lib/home/loi-vao-bat-dau.test.ts
 *
 * VÌ SAO TỆP NÀY TỒN TẠI (đo trên app thật 04/09, TRƯỚC khi sửa):
 *   · D-J04a — ba nút "Tạo dự án mới" / "Mở dự án có sẵn" / "Nhập từ tệp" DÙNG CHUNG một
 *     `onClick`; bấm cái nào cũng gọi cùng một hàm, và hàm đó không tạo gì: `Project` 20 → 20,
 *     URL không đổi, lệnh gọi API khác GET chỉ có nhịp presence.
 *   · D-J04b — màn "dự án chưa có bản vẽ": bấm tạo thì máy chủ sinh Flow thật (0 → 1) nhưng
 *     màn kẹt "Đang tạo…" vô hạn, vì cờ bận CHỈ được gỡ trong nhánh `catch`.
 *
 * Cả hai là loại lỗi `tsc` và năm máy soi hiện có KHÔNG bắt được: mã biên dịch sạch, nhãn đúng,
 * chỉ có ĐƯỜNG DÂY là đứt. Nên bất biến phải được khoá bằng khẳng định, không bằng chú thích.
 */
import { readFileSync } from 'node:fs';
import { boDemo, type CanhDemo } from './xuong-demo';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

/**
 * ĐỌC MÃ ĐÃ BỎ CHÚ THÍCH.
 * 🔴 Bài học lặp lại lần thứ tư trong ngày 04/09: máy soi quét văn bản mà không tự loại chú
 * thích ra thì nó BẮT TRÚNG CHÍNH LỜI GIẢI THÍCH VỀ LUẬT — ở đây, dòng `finally` có câu
 * "trước 04/09 setBusy(false) chỉ nằm trong catch" làm phép đếm ra 2 thay vì 1. Cách chữa
 * đúng là THU HẸP VÙNG QUÉT ở máy, không nới luật.
 * Cố ý chỉ bỏ khối chú thích nhiều dòng và dòng bắt đầu bằng hai dấu gạch — không đụng chuỗi
 * nằm trong mã.
 */
function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((d) => !d.trim().startsWith('//'))
    .join('\n');
}

const doc = (p: string) => boChuThich(readFileSync(p, 'utf8'));

console.log('① mỗi lối vào là MỘT VIỆC KHÁC — không hai nút nào mang cùng mã việc');
{
  const canh: CanhDemo[] = ['co-viec', 'day-du', 'rong'];
  let soCanhCoLoiVao = 0;
  for (const c of canh) {
    const than = boDemo(c).hienVat.than;
    if (than.kieu !== 'bat-dau') continue;
    soCanhCoLoiVao++;
    const viec = than.nut.map((n) => n.viec);
    eq(`${c}: ba mã việc rời nhau`, new Set(viec).size, 3);
    eq(`${c}: đúng bộ ba đã chốt`, viec, ['tao-du-an', 'mo-du-an', 'nhap-tep']);
    ok(`${c}: nhãn nào cũng có chữ`, than.nut.every((n) => n.nhan.trim().length > 0));
  }
  ok('có ít nhất một cảnh dựng thân "bắt đầu" để mà kiểm', soCanhCoLoiVao > 0);
}

console.log('② Home KHÔNG còn nối ba nút vào một hàm (chống tái phát D-J04a)');
{
  const src = doc('components/home/XuongHome.tsx');
  eq('đúng ba nút lối vào được dựng', (src.match(/<NutLoiVao\b/g) ?? []).length, 3);
  ok('không còn `onClick={onMo}` dùng chung', !src.includes('onClick={onMo}'));
  ok(
    'nút mờ đi đường aria-disabled, KHÔNG dùng thuộc tính `disabled` (Tab bỏ qua thì lý do không tới ai)',
    src.includes('aria-disabled={mo || undefined}') && !/<button[^>]*\sdisabled=/.test(src),
  );
  ok('nút mờ có aria-describedby trỏ tới lý do', src.includes('aria-describedby={mo && lyDo ? idLyDo : undefined}'));
}

console.log('③ màn "dự án chưa có bản vẽ" gỡ cờ bận ở CẢ đường thành công (chống tái phát D-J04b)');
{
  const src = doc('components/studio/ProjectScopeEmptyState.tsx');
  eq('hai handler đều có nhánh finally', (src.match(/\} finally \{/g) ?? []).length, 2);
  eq('gỡ cờ bận gọi ở đúng hai chỗ finally', (src.match(/thoiBan\(\);/g) ?? []).length, 2);
  eq(
    'setBusy(false) CHỈ sống trong `thoiBan` — không rải rác trong catch như bản cũ',
    (src.match(/setBusy\(false\)/g) ?? []).length,
    1,
  );
  ok('khoá bấm-hai-lần là ref, không phải state đóng băng trong closure', src.includes('if (dangChay.current) return;'));
  ok(
    'điều hướng cùng-đường thì KHÔNG push (push tới chính chỗ đang đứng không dựng lại gì)',
    src.includes('if (dich !== duongHienTai) router.push(dich);'),
  );
}

console.log('④ scope tính lại khi flow đang mở đổi — GỐC của D-J04b');
{
  const src = doc('lib/project-scope.ts');
  ok('hook đọc currentFlowId từ kho làm ĐẦU VÀO', src.includes('useFlowStore((s) => s.currentFlowId)'));
  ok('currentFlowId nằm trong danh sách phụ thuộc của effect', src.includes('[routeId, stage, router, currentFlowId]'));
  ok(
    'đường tắt "đã khớp rồi" đòi có FLOW THẬT, không chỉ khớp id',
    src.includes('if (s.currentFlowId && storeMatchesRouteId('),
  );
}

console.log('⑤ bộ đo hành trình KHÔNG còn liều thuốc giấu bệnh');
{
  const src = doc('scripts/nghiem-thu-g2-hanh-trinh.mjs');
  const dau = src.indexOf('async function quaCuaDuAnRong');
  const cuoi = src.indexOf('async function moMatVe');
  ok('tìm được thân hàm qua-cửa để soi', dau >= 0 && cuoi > dau);
  const than = src.slice(dau, cuoi);
  ok('cửa dự-án-rỗng không còn reload() để đi vòng lỗi', !than.includes('page.reload'));
  ok(
    'nó ĐỢI MÀN RỖNG BIẾN MẤT — bất biến đúng, và chạy được ở cả chặng không có canvas',
    than.includes("waitFor({ state: 'hidden'"),
  );
  ok(
    'KHÔNG đợi <canvas>: chặng Trình bày không dựng canvas nào, đợi ở đó là ngã vì hạ tầng chứ không vì khẳng định',
    !than.includes("waitForSelector('canvas'"),
  );
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
