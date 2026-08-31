/**
 * lib/cad/import-summary.test.ts — KHOÁ "FIT KHI MỞ HỒ SƠ" (`zoomExtentsFit`).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/import-summary.test.ts`
 *
 * BỆNH ĐO ĐƯỢC (31/08, đường MỞ LẠI hồ sơ — khác đường nhập DXF):
 *   `CadSheets` khôi phục Doc từ IndexedDB/đĩa rồi phát `cad:zoom-extents` ngay trong `.then()`
 *   của lượt nạp bất đồng bộ. `CadCanvas` nghe được, nhưng backing canvas lúc đó có thể CHƯA
 *   được đo (`ResizeObserver` mới hẹn một `requestAnimationFrame`). `<canvas>` chưa gán
 *   `width/height` mang kích thước MẶC ĐỊNH của HTML — **300×150** — nên `screenSize()` trả
 *   150×75 ở DPR 2. Trừ đệm hai bên (80·2 = 160) thì bề cao còn ÂM ⇒ `fitBox()` trả `scale` ÂM,
 *   và viewport âm đó ghi thẳng vào store: "mở lại hồ sơ thì vào toạ độ kỳ".
 *
 * ⚠️ Ca ĐỎ phải đỏ vì ĐÚNG lý do, nên mỗi khối có ĐỐI CHỨNG khoá phần KHÔNG được đổi: luật chọn
 * hộp vẫn là `zoomExtentsPlan()` cũ (không ngưỡng mới), màn ĐÃ ĐO vẫn fit y như trước, và bản vẽ
 * rỗng vẫn im lặng chứ không bị đọc nhầm thành "màn chưa đo".
 *
 * Hàm THUẦN, không DOM — cùng khuôn `render-z-order.test.ts` (luật 6: không đẻ khuôn test thứ hai).
 */
import type { Doc, Entity, Layer } from './model';
import { docBox, fitBox } from './model';
import { ZOOM_FIT_PAD, zoomExtentsFit, zoomExtentsPlan } from './import-summary';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, got?: unknown) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label} → ${JSON.stringify(got)}`); }
}

/* ══ FIXTURE ══ layer hồ sơ kỹ thuật thật (`DEFAULT_STRUCTURE_LAYERS`) để `mainClusterBox()`
   nhận ra cụm — dùng tên layer thật chứ không chế tên riêng cho test. */
const layers: Layer[] = [
  { id: 'l-w', name: 'A-Wall', color: '#cccccc', visible: true, locked: false, lineweight: 0.25 },
  { id: 'l-t', name: 'A-Text', color: '#888888', visible: true, locked: false, lineweight: 0.13 },
];
let seq = 0;
const line = (x: number, y: number, layer = 'l-w', len = 1000) =>
  ({ id: `e${++seq}`, type: 'line', layer, a: { x, y }, b: { x: x + len, y } }) as Entity;
const docVoi = (es: Entity[]): Doc => ({ entities: es, layers } as Doc);

/** Mặt bằng 34,7 × 28,1 m đặt cách gốc ~12 km — đúng hình dạng ca thật F2 trong docstring. */
const MAT_BANG = docVoi([
  line(120_000, 80_000), line(120_000, 108_100, 'l-w', 34_700),
  line(154_700, 80_000), line(120_000, 94_000, 'l-w', 34_700),
]);

/* ═══════════ ① MÀN CHƯA ĐO ⇒ KHÔNG ĐƯỢC TRẢ VIEWPORT ═══════════ */
console.log('① canvas chưa đo (mặc định 300×150 của <canvas>) — fit phải TỪ CHỐI, không trả số âm');
{
  // BẰNG CHỨNG BỆNH: `fitBox()` trần trên đúng kích thước đó cho scale ÂM. Khoá luôn con số này
  // để nếu ai đổi `fitBox`/đệm thì test nói ra, chứ không im lặng đổi nghĩa của ca dưới.
  const box = docBox(MAT_BANG)!;
  const traiDpr1 = fitBox(box, 300, 150, ZOOM_FIT_PAD);
  const traiDpr2 = fitBox(box, 150, 75, ZOOM_FIT_PAD);
  ok('① tang vật: fitBox trên canvas chưa đo cho scale ÂM (cả DPR 1 và 2)',
    traiDpr1.scale < 0 && traiDpr2.scale < 0, { traiDpr1, traiDpr2 });

  const dpr1 = zoomExtentsFit(MAT_BANG, { W: 300, H: 150 });
  ok('① DPR 1 · 300×150 ⇒ ok:false, reason screen-not-measured',
    dpr1.ok === false && dpr1.reason === 'screen-not-measured', dpr1);

  const dpr2 = zoomExtentsFit(MAT_BANG, { W: 150, H: 75 });
  ok('① DPR 2 · 150×75 ⇒ ok:false, reason screen-not-measured',
    dpr2.ok === false && dpr2.reason === 'screen-not-measured', dpr2);

  // Màn 0×0 (khung chứa chưa có layout) — cùng hạng, KHÔNG được rơi vào 'empty-doc'.
  const khong = zoomExtentsFit(MAT_BANG, { W: 0, H: 0 });
  ok('① màn 0×0 ⇒ screen-not-measured (không đọc nhầm thành bản vẽ rỗng)',
    khong.ok === false && khong.reason === 'screen-not-measured', khong);
}

/* ═══════════ ② MÀN ĐÃ ĐO ⇒ FIT Y NHƯ TRƯỚC ═══════════ */
console.log('② canvas đã đo — fit phải chạy y hệt hành vi cũ (không được "an toàn" thành không làm gì)');
{
  const got = zoomExtentsFit(MAT_BANG, { W: 1200, H: 700 });
  ok('② 1200×700 ⇒ ok:true', got.ok === true, got);
  if (got.ok) {
    ok('② scale dương, hữu hạn', got.viewport.scale > 0 && Number.isFinite(got.viewport.scale), got.viewport);
    // ĐỐI CHỨNG: viewport phải BẰNG ĐÚNG `fitBox(plan.box, …)` — không có phép tính thứ hai
    // xen vào giữa. Đây là điều giữ cho fit-khi-mở và phím F không bao giờ lệch nhau.
    const box = zoomExtentsPlan(MAT_BANG)!.box;
    const chuan = fitBox(box, 1200, 700, ZOOM_FIT_PAD);
    ok('② viewport == fitBox(zoomExtentsPlan().box) — một luật, không tính lại',
      JSON.stringify(got.viewport) === JSON.stringify(chuan), { got: got.viewport, chuan });
    // Tâm bản vẽ rơi đúng giữa màn (kiểm nghĩa, không chỉ kiểm dấu).
    const cx = (box.minX + box.maxX) / 2;
    const tamMan = got.viewport.panX + cx * got.viewport.scale;
    ok('② tâm bản vẽ nằm giữa màn theo trục X', Math.abs(tamMan - 1200 / 2) < 1e-6, tamMan);
  }
}

/* ═══════════ ③ RANH GIỚI ĐÚNG Ở CHỖ PHÉP FIT HẾT NGHĨA ═══════════ */
console.log('③ ranh giới = "còn chỗ sau khi trừ đệm", không phải một ngưỡng chế thêm');
{
  const H = 900; // dư dả theo trục Y để ranh giới do trục X quyết
  const vua = zoomExtentsFit(MAT_BANG, { W: ZOOM_FIT_PAD * 2 + 1, H });
  ok('③ W = 2·đệm + 1 ⇒ vẫn fit được (không chặn oan màn hẹp thật)', vua.ok === true, vua);
  const sat = zoomExtentsFit(MAT_BANG, { W: ZOOM_FIT_PAD * 2, H });
  ok('③ W = 2·đệm chẵn ⇒ scale = 0, từ chối', sat.ok === false && sat.reason === 'screen-not-measured', sat);
  // ĐỐI CHỨNG: đệm là tham số, không phải hằng số chết — nơi gọi khác đệm thì ranh giới dời theo.
  const demNho = zoomExtentsFit(MAT_BANG, { W: 150, H: 75 }, { pad: 10 });
  ok('③ cùng màn 150×75 nhưng đệm 10 ⇒ fit được', demNho.ok === true, demNho);
}

/* ═══════════ ④ BẢN VẼ RỖNG VẪN LÀ CA RIÊNG ═══════════ */
console.log('④ bản vẽ rỗng ⇒ empty-doc, để nơi gọi im lặng chứ không hoãn fit mãi mãi');
{
  const rong = zoomExtentsFit(docVoi([]), { W: 1200, H: 700 });
  ok('④ doc rỗng + màn tốt ⇒ empty-doc', rong.ok === false && rong.reason === 'empty-doc', rong);
  // Rỗng VÀ màn chưa đo: `empty-doc` thắng — không có gì để fit thì hoãn cũng vô nghĩa.
  const caHai = zoomExtentsFit(docVoi([]), { W: 150, H: 75 });
  ok('④ doc rỗng + màn chưa đo ⇒ vẫn empty-doc (không hoãn một việc không tồn tại)',
    caHai.ok === false && caHai.reason === 'empty-doc', caHai);
}

/* ═══════════ ⑤ LUẬT CHỌN HỘP GIỮ NGUYÊN ═══════════ */
console.log('⑤ zoomExtentsFit KHÔNG được đổi luật chọn hộp của zoomExtentsPlan');
{
  // Mặt bằng + 1 bản sao parked cách gốc rất xa ⇒ plan phải canh vào cụm chính, và fit đi theo.
  const parked = docVoi([...MAT_BANG.entities, line(12_000_000, 12_000_000)]);
  const plan = zoomExtentsPlan(parked)!;
  const got = zoomExtentsFit(parked, { W: 1200, H: 700 });
  ok('⑤ fixture THẬT SỰ kích hoạt canh-cụm (nếu không, hai ca dưới đúng một cách rỗng)',
    plan.mode === 'mainCluster' && plan.farEntities > 0, plan);
  ok('⑤ mode của fit == mode của plan', got.ok === true && got.plan.mode === plan.mode, { fit: got, planMode: plan.mode });
  ok('⑤ farEntities đi kèm nguyên vẹn', got.ok === true && got.plan.farEntities === plan.farEntities, plan.farEntities);

  // ĐỐI CHỨNG: `preferFull` (bấm F lần hai) truyền xuyên qua, không bị nuốt.
  const full = zoomExtentsFit(parked, { W: 1200, H: 700 }, { preferFull: true });
  ok('⑤ preferFull ⇒ mode full, khớp zoomExtentsPlan(preferFull)',
    full.ok === true && full.plan.mode === 'full' && full.plan.mode === zoomExtentsPlan(parked, { preferFull: true })!.mode, full);

  // ĐỐI CHỨNG KHÔNG-HỒI-QUY: bản vẽ thường (không có hình xa vô lý) vẫn là 'full', y như cũ.
  const thuong = zoomExtentsFit(MAT_BANG, { W: 1200, H: 700 });
  ok('⑤ bản vẽ thường vẫn mode full, farEntities 0',
    thuong.ok === true && thuong.plan.mode === 'full' && thuong.plan.farEntities === 0, thuong);
}

console.log(`\nimport-summary: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
