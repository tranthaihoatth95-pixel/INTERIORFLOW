/**
 * lib/cad/import-summary.ts — ĐÚC báo cáo nạp bản vẽ thành CÂU NGƯỜI DÙNG ĐỌC ĐƯỢC, và quyết định
 * KHUNG NHÌN cho "Xem vừa màn" khi file có bản sao để xa.
 *
 * Vì sao có file này (khoảng trống `docs/GAP-IF.md` G-M1-02 · G-M1-04):
 * - `parseDxfEx()` đã trả `DxfLoadReport` đủ 7 trường từ lâu, nhưng màn CAD gọi bản mỏng
 *   `parseDxf()` rồi **vứt báo cáo** ⇒ mỗi file thật bỏ qua 71–344 bản ghi mà người dùng không hề
 *   biết. Nói ra thì phải nói bằng CHỮ NGƯỜI DÙNG HIỂU, và không được kể cả những bản ghi mà mất
 *   cũng chẳng mất gì (`SEQEND`/`ATTDEF`/`VIEWPORT`) — kêu lên thành 344 là báo động giả.
 * - "Xem vừa màn" dùng khung bao TOÀN BỘ entity nên một bản sao parked cách gốc 12 km làm mặt bằng
 *   co lại thành một chấm. `zoomExtentsPlan()` là phần thuần của cách chữa (nơi gọi:
 *   `CadCanvas.zoomExtents` cho phím F/nút, và `CadEditor.onImportFile` ngay sau khi nạp — MỘT luật
 *   dùng chung, không để hai chỗ tự tính rồi lệch nhau).
 *
 * ⚠️ File này CHỈ đúc chữ + tính hộp. **Không** vẽ panel, **không** đụng store CAD, **không** gọi
 * DOM ⇒ chạy được bằng `node_modules/.bin/sucrase-node` để kiểm bằng file DXF thật.
 * Panel "Báo cáo nạp bản vẽ" (bảng chi tiết + kết quả đọc mặt bằng `dxf-plan.ts`) sống trong
 * `CadEditor.tsx` — đó là NƠI TIÊU THỤ đầy đủ của `DxfLoadReport`, file này không giữ bản sao thứ hai.
 *
 * ⛔ K3 — KHÔNG BỊA SỐ: chỉ nói con số CÓ THẬT trong báo cáo; không quy đổi, không ước lượng.
 */

import type { Doc, Box, Viewport } from './model';
import { docBox, entityBox, fitBox } from './model';
import type { DxfLoadReport } from './dxf';
import { mainClusterBox } from './dxf-plan';

/* ═══════════════════════ 1 · ĐÚC CÂU CHO THANH TRẠNG THÁI ═══════════════════════ */

/**
 * Tên record DXF → chữ người dùng hiểu (`docs/SPEC-NGON-NGU-CHI-DAN.md` luật 2: cấm jargon nội bộ
 * lộ ra UI). KTS đọc bản vẽ, không đọc tên record của định dạng file — "bỏ qua 300 POINT" là câu
 * của lập trình viên nói với lập trình viên.
 */
export const SKIPPED_LABELS: Readonly<Record<string, string>> = {
  POINT: 'điểm đánh dấu',
  ELLIPSE: 'hình elip',
  SPLINE: 'đường cong',
  HATCH: 'mảng tô',
  SOLID: 'mảng đặc',
  '3DFACE': 'mảng đặc',
  ATTRIB: 'chữ trong khối',
  TEXT: 'chữ',
  MTEXT: 'chữ',
  LINE: 'đường',
  LWPOLYLINE: 'đường',
  POLYLINE: 'đường',
  ARC: 'cung tròn',
  CIRCLE: 'đường tròn',
  DIMENSION: 'kích thước',
  LEADER: 'ghi chú có đường dẫn',
  MULTILEADER: 'ghi chú có đường dẫn',
  MTEXTLEADER: 'ghi chú có đường dẫn',
  INSERT: 'khối',
  IMAGE: 'ảnh chèn',
  WIPEOUT: 'mảng che',
  XLINE: 'đường dựng hình',
  RAY: 'đường dựng hình',
  '3DSOLID': 'khối 3D',
  MESH: 'khối 3D',
  BODY: 'khối 3D',
  REGION: 'khối 3D',
  TABLE: 'bảng',
};

/**
 * Bản ghi KHÔNG mang hình nhìn thấy được — bỏ qua chúng không mất gì trên bản vẽ.
 *
 * Đếm chúng vào câu "bạn vừa mất gì" là **báo động giả**: `SEQEND`/`ENDBLK` chỉ là dấu đóng nhóm
 * (14/file), `ATTDEF` là ĐỊNH NGHĨA ô chữ nằm trong định nghĩa block (giá trị thật đi theo
 * `ATTRIB`), `VIEWPORT` là khung nhìn của không gian giấy chứ không phải nét vẽ. Vẫn giữ đủ trong
 * `report.skipped` cho panel M2 xem chi tiết — chỉ không kêu lên ở thanh trạng thái.
 */
export const SILENT_RECORDS: readonly string[] = [
  'SEQEND', 'ENDBLK', 'BLOCK', 'ENDSEC', 'VERTEX', 'ATTDEF', 'VIEWPORT',
  'DICTIONARY', 'XRECORD', 'CLASS',
];

export interface DroppedGroup { label: string; count: number }

/**
 * Gộp `report.skipped` theo CHỮ NGƯỜI DÙNG (nhiều tên record có thể cùng một chữ), bỏ nhóm không
 * mang hình, sắp giảm dần. Không có gì bị bỏ ⇒ mảng rỗng.
 */
export function droppedContent(report: DxfLoadReport): DroppedGroup[] {
  const byLabel = new Map<string, number>();
  for (const [kind, n] of Object.entries(report.skipped)) {
    if (!n || n <= 0) continue;
    if (SILENT_RECORDS.includes(kind.toUpperCase())) continue;
    const label = SKIPPED_LABELS[kind.toUpperCase()] ?? 'nét lạ';
    byLabel.set(label, (byLabel.get(label) ?? 0) + n);
  }
  return [...byLabel.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** 2984 → "2.984" (quy ước số VN). Tự viết để không phụ thuộc bảng locale của môi trường chạy. */
export function viNum(n: number): string {
  const s = Math.round(Math.abs(n)).toString();
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return n < 0 ? `-${grouped}` : grouped;
}

/**
 * CÂU CHO THANH TRẠNG THÁI sau khi nạp xong.
 *
 * Luật chữ (`SPEC-NGON-NGU-CHI-DAN.md` §1): mỗi câu ≤ 12 từ · không jargon · cảnh báo phải kèm
 * VIỆC LÀM TIẾP. Ba câu (không phải hai như khuôn §2) chỉ xảy ra ở ca xấu nhất — file vừa bỏ bớt
 * nội dung VỪA có bản sao để xa. Chọn nói đủ ba, vì gộp lại thì câu dài quá 12 từ, còn cắt bớt thì
 * quay lại đúng bệnh G-M1-02 (im lặng về thứ vừa mất). Câu 1 luôn có, hai câu sau chỉ khi CÓ THẬT.
 */
export function importStatusLine(s: {
  fileName: string;
  report: DxfLoadReport;
  farEntities?: number;
}): string {
  const out: string[] = [`Đã mở ${s.fileName} — ${viNum(s.report.totalEntities)} đối tượng.`];

  const dropped = droppedContent(s.report);
  if (dropped.length) {
    // Kể 2 nhóm đông nhất, phần còn lại nói ĐÚNG SỐ NHÓM (không "vài loại" mơ hồ) — bảng đầy đủ
    // nằm trong panel "Báo cáo nạp bản vẽ" mở ngay sau khi nạp, nên câu này chỉ cần dẫn tới đó.
    const head = dropped.slice(0, 2).map((d) => `${viNum(d.count)} ${d.label}`).join(', ');
    const rest = dropped.length > 2 ? `, ${dropped.length - 2} loại khác` : '';
    out.push(`Bỏ qua ${head}${rest} — xem báo cáo nạp.`);
  }

  if ((s.farEntities ?? 0) > 0) {
    out.push('Đã canh vào phần vẽ chính — bấm F xem toàn bộ.');
  }
  return out.join(' ');
}

/* ═══════════════════════ 2 · KHUNG NHÌN "XEM VỪA MÀN" ═══════════════════════ */

export interface ZoomExtentsPlan {
  box: Box;
  /** `full` = khung bao mọi hình (hành vi cũ) · `mainCluster` = đã bỏ bản sao parked xa. */
  mode: 'full' | 'mainCluster';
  /** số hình bị bỏ ra ngoài khung nhìn khi `mode==='mainCluster'`. `full` ⇒ luôn 0. */
  farEntities: number;
}

/** Khung nhìn phải rộng hơn phần giữ lại bao nhiêu lần thì mới đáng bỏ bản sao xa. */
const FOCUS_MIN_RATIO = 4;
/**
 * "XA VÔ LÝ" = tâm hình cách tâm cụm chính quá bao nhiêu LẦN CỠ CỤM.
 *
 * 🔴 Con số 30 là ĐO ĐƯỢC, không phải chọn cho đẹp (G-M1-04 vòng 2, 6 hồ sơ thật). Phân bố
 * khoảng cách (đơn vị = cỡ cụm): nội dung bình thường — bảng ghi chú, khung tên, bản vẽ khác cùng
 * tệp — nằm ở **0,4–13,8**; còn bản sao parked thật sự (cách gốc 12 km) nằm ở **353–358**. Giữa
 * hai vùng đó là một khoảng trống rất rộng, nên ngưỡng 30 tách sạch mà không cần tinh chỉnh.
 *
 * ⚠️ Luật CŨ (nới cụm 25% rồi bỏ mọi thứ ngoài vùng nới) sai ở chỗ nó cắt theo VÙNG chứ không
 * theo ĐỘ XA VÔ LÝ: đo được nó bật ở **6/6 file** và giấu **31–76%** số hình — tức là giấu cả
 * bảng ghi chú và các bản vẽ khác trong cùng tệp, thứ người dùng đang muốn xem. Nay chỉ bỏ đúng
 * cái đáng bỏ.
 */
const ABSURD_FAR_RATIO = 30;

const areaOf = (b: Box): number => Math.max(0, b.maxX - b.minX) * Math.max(0, b.maxY - b.minY);

/**
 * KHUNG NHÌN CHO "Zoom toàn bộ" — bỏ bản sao parked xa khi (và chỉ khi) chúng có thật.
 *
 * 🔴 Ca thật (một file sàn, F2): cùng một block chèn 3 lần cách gốc **12 km** ⇒ khung bao thô
 * 12.311 × 15.492 m trong khi mặt bằng chỉ 34,7 × 28,1 m — mở file ra là một màn hình trống với
 * một chấm ở góc.
 *
 * ⚖️ LUẬT TỰ CHỌN (nút này dùng chung cho MỌI bản vẽ, kể cả hình người dùng vừa vẽ tay — không
 * được làm ai "mất" hình của mình):
 *  1. Chỉ đổi hành vi khi `mainClusterBox()` tìm được cụm vẽ chính. Hàm đó chỉ xét các layer hồ sơ
 *     kỹ thuật (`A-Wall`/`A-Column`/…) nên bản vẽ tay của người dùng (layer tiếng Việt của app,
 *     `buildDemoPlan()`…) trả `null` ⇒ rơi thẳng về `mode:'full'` — hành vi cũ y nguyên, không có
 *     đường nào làm "mất" hình vừa vẽ.
 *  2. Nới cụm chính thêm 25% cạnh dài rồi ÔM TRỌN mọi hình nằm lọt trong vùng nới đó ⇒ kích thước,
 *     nhãn trục, ghi chú vẽ quanh mặt bằng vẫn nằm trong khung nhìn, không bị cắt.
 *  3. Chênh lệch phải đáng kể (khung bao đầy ≥ 4× diện tích vùng tập trung) mới đổi. Lệch ít thì
 *     giữ nguyên hành vi cũ cho khỏi gây bất ngờ.
 *  4. LUÔN có đường quay lại: nơi gọi (`CadCanvas.zoomExtents`) bấm lần thứ hai thì truyền
 *     `preferFull` để xem toàn bộ, kèm câu nói rõ. Không có chuyện hình biến mất mà không lấy lại được.
 *  5. **KHUNG THÔ RỘNG VÔ ÍCH** (Hoà chốt 31/08): kể cả khi KHÔNG hình nào xa vô lý, nếu khung
 *     bao đầy vẫn rộng hơn `FOCUS_MIN_RATIO` lần diện tích cụm chính thì canh vào cụm chính.
 *     Đây là ca tờ bản vẽ nhiều mặt bằng rải ngang — xem chi tiết + số đo ngay tại nhánh đó.
 */
export function zoomExtentsPlan(doc: Doc, opts: { preferFull?: boolean } = {}): ZoomExtentsPlan | null {
  const full = docBox(doc);
  if (!full) return null;
  if (opts.preferFull) return { box: full, mode: 'full', farEntities: 0 };

  const cluster = mainClusterBox(doc);
  if (!cluster) return { box: full, mode: 'full', farEntities: 0 };

  const cx = (cluster.box.minX + cluster.box.maxX) / 2;
  const cy = (cluster.box.minY + cluster.box.maxY) / 2;
  const size = Math.max(cluster.box.maxX - cluster.box.minX, cluster.box.maxY - cluster.box.minY);
  if (size <= 0) return { box: full, mode: 'full', farEntities: 0 };
  const limit = size * ABSURD_FAR_RATIO;

  const focus: Box = { ...cluster.box };
  let far = 0;
  for (const e of doc.entities) {
    const b = entityBox(e);
    if (!Number.isFinite(b.minX) || !Number.isFinite(b.maxX)) continue;
    const ex = (b.minX + b.maxX) / 2;
    const ey = (b.minY + b.maxY) / 2;
    if (Math.abs(ex - cx) <= limit && Math.abs(ey - cy) <= limit) {
      // GIỮ: nới khung ra ôm trọn nó. Ghi chú, khung tên, bản vẽ khác trong cùng tệp đều vào đây.
      focus.minX = Math.min(focus.minX, b.minX);
      focus.minY = Math.min(focus.minY, b.minY);
      focus.maxX = Math.max(focus.maxX, b.maxX);
      focus.maxY = Math.max(focus.maxY, b.maxY);
    } else {
      far += 1;
    }
  }

  // Có hình xa vô lý VÀ chênh lệch đáng kể ⇒ canh vào vùng đã nới (ôm ghi chú, khung tên quanh mặt bằng).
  if (far > 0 && areaOf(full) >= FOCUS_MIN_RATIO * areaOf(focus)) return { box: focus, mode: 'mainCluster', farEntities: far };

  // ── ĐIỀU KIỆN THỨ HAI: KHUNG THÔ RỘNG HƠN CỤM CHÍNH QUÁ NHIỀU ────────────────────────────
  // Hoà chốt phương án A 31/08 20:48, tái xác nhận 20:56 (phiếu HO-20260831135132-e4c854369eda).
  //
  // Lỗ mà nó bịt: nhánh trên chỉ bật khi có hình XA VÔ LÝ (>30× cỡ cụm). Một tờ bản vẽ có 6 mặt
  // bằng rải ngang 225 m thì KHÔNG hình nào xa vô lý cả — và người mở tệp nhận một mặt bằng
  // 28 m nằm lọt thỏm trong khung 225 m. Đo trên 6 hồ sơ thật (`FILE MBHT`): 5/6 tệp rơi đúng
  // vào lỗ này (`mode:'full'`) dù tỉ lệ thô/cụm là 21,6× · 56,3× · 46,7× · 29,3× · 29,7×.
  //
  // ⚠️ GIÁ PHẢI TRẢ, ĐO ĐƯỢC — ghi ở đây để không ai phải đo lại: khung nhìn = cụm chính TRẦN
  // nên 34–88% số hình nằm NGOÀI khung khi mở (03: 88,3% · 05: 82,3% · 06: 82,8% · 07: 81,8% ·
  // 08: 34,2%). Con số đó CAO HƠN mức 31–76% từng khiến luật "nới 25%" bị bỏ. Khác biệt là
  // đường quay lại: `farEntities` nói thẳng bao nhiêu hình nằm ngoài, và phím F (`preferFull`)
  // trả về toàn bộ ngay lượt bấm sau. Đây là quyết định của Hoà trên app thật, không phải suy
  // luận của máy — muốn lật thì lật ở đây, đừng lật bằng cách sửa kỳ vọng của test.
  //
  // ⛔ KHÔNG đụng `ABSURD_FAR_RATIO` (30). Hai ngưỡng trả lời hai câu khác nhau: 30 hỏi "hình
  // này có xa vô lý không", 4 hỏi "khung thô có rộng vô ích so với cụm chính không".
  const dtCum = areaOf(cluster.box);
  if (dtCum > 0 && areaOf(full) > FOCUS_MIN_RATIO * dtCum) {
    let ngoaiKhung = 0;
    for (const e of doc.entities) {
      const b = entityBox(e);
      if (!Number.isFinite(b.minX) || !Number.isFinite(b.maxX)) continue;
      const ex = (b.minX + b.maxX) / 2;
      const ey = (b.minY + b.maxY) / 2;
      if (ex < cluster.box.minX || ex > cluster.box.maxX || ey < cluster.box.minY || ey > cluster.box.maxY) ngoaiKhung += 1;
    }
    return { box: { ...cluster.box }, mode: 'mainCluster', farEntities: ngoaiKhung };
  }

  return { box: full, mode: 'full', farEntities: 0 };
}

/**
 * Đệm mép (px màn) khi fit khung nhìn. Trước đây con số 80 nằm rời ở `CadCanvas`, còn luật chọn
 * hộp nằm ở đây ⇒ phần THUẦN không tự kiểm được cái nó sinh ra. Nay một chỗ giữ cả hai.
 */
export const ZOOM_FIT_PAD = 80;

/**
 * Kết quả của "fit khung nhìn vào bản vẽ". Có `reason` chứ không phải `null` trần, vì hai ca
 * KHÔNG-FIT-ĐƯỢC đòi hai cách xử ngược nhau ở nơi gọi:
 *  · `empty-doc`         — không có gì để nhìn ⇒ im lặng, đúng hành vi cũ.
 *  · `screen-not-measured` — MÀN chưa có kích thước thật ⇒ **hoãn**, fit lại khi đo xong.
 */
export type ZoomExtentsFit =
  | { ok: true; viewport: Viewport; plan: ZoomExtentsPlan }
  | { ok: false; reason: 'empty-doc' | 'screen-not-measured' };

/**
 * FIT-KHI-MỞ — ghép `zoomExtentsPlan()` (chọn hộp) với `fitBox()` (đổi hộp ra viewport) thành MỘT
 * hàm thuần, để chỗ duy nhất quyết định "khung nhìn lúc mở hồ sơ" kiểm được không cần DOM.
 *
 * 🔴 BỆNH NÓ KHOÁ (điều tra 31/08, đường mở-lại hồ sơ): `CadSheets` khôi phục Doc từ IndexedDB/đĩa
 * rồi phát `cad:zoom-extents` NGAY trong `.then()` của lượt nạp bất đồng bộ. `CadCanvas` nghe được,
 * nhưng backing canvas lúc đó **có thể chưa được đo** — `ResizeObserver` mới hẹn `requestAnimation
 * Frame`. Phần tử `<canvas>` chưa gán `width/height` mang kích thước MẶC ĐỊNH của HTML: 300×150.
 * Chia cho DPR rồi trừ đệm hai bên (`80·2 = 160`) ⇒ **bề cao còn ÂM** ⇒ `fitBox()` trả `scale` âm,
 * và viewport âm đó được ghi thẳng vào store. Đó chính là "mở lại hồ sơ thì vào toạ độ kỳ": không
 * phải bản vẽ sai, mà là khung nhìn được tính trên một cái màn chưa tồn tại.
 * Đối chứng đo được (mặt bằng 34,7×28,1 m):
 *   dpr 1 · 300×150 → scale −0,000356 · dpr 2 · 150×75  → scale −0,003025
 *   dpr 2 · đã đo 1200×700 → scale +0,0157  ⇒ chỉ ca CHƯA ĐO mới hỏng.
 *
 * ⚖️ Không thêm luật mới: hộp vẫn do `zoomExtentsPlan()` chọn (mọi ngưỡng cũ giữ nguyên), viewport
 * vẫn do `fitBox()` tính. Thứ duy nhất thêm vào là **điều kiện well-formed của chính phép fit** —
 * `scale` phải hữu hạn và dương. Không đo lại màn, không lưu viewport, không ngưỡng nào mới.
 */
export function zoomExtentsFit(
  doc: Doc,
  screen: { W: number; H: number },
  opts: { preferFull?: boolean; pad?: number } = {},
): ZoomExtentsFit {
  const plan = zoomExtentsPlan(doc, opts);
  if (!plan) return { ok: false, reason: 'empty-doc' };
  const viewport = fitBox(plan.box, screen.W, screen.H, opts.pad ?? ZOOM_FIT_PAD);
  const sane = Number.isFinite(viewport.scale) && viewport.scale > 0
    && Number.isFinite(viewport.panX) && Number.isFinite(viewport.panY);
  return sane ? { ok: true, viewport, plan } : { ok: false, reason: 'screen-not-measured' };
}

/** Kết quả fit 1 HỘP TUỲ Ý vào màn — anh em của `ZoomExtentsFit` nhưng không có `plan` (hộp do
 * nơi gọi đưa, không đi qua luật chọn hộp) và không có ca `empty-doc` (hộp luôn tồn tại). */
export type GotoBoxFit =
  | { ok: true; viewport: Viewport }
  | { ok: false; reason: 'screen-not-measured' };

/**
 * FIT HỘP TUỲ Ý — cho `cad:goto-box` (`CadCanvas.tsx`: đổi tab sheet, "Mở vùng này trong Model"
 * từ paper space) và mọi nơi cần bay camera tới một vùng world cụ thể.
 *
 * 🔴 BỆNH NÓ KHOÁ (vá 01/09, cùng họ với bệnh `zoomExtentsFit` đã vá 81dd7dd7): listener
 * `cad:goto-box` cũ gọi `fitBox(detail, W, H, 80)` với `screenSize()` CHƯA CANH — tab ẩn/canvas
 * chưa đo mang kích thước mặc định 300×150 của `<canvas>` ⇒ trừ đệm hai bên là bề cao ÂM ⇒
 * `scale` âm ghi thẳng store, y hệt bệnh cũ chỉ khác cửa vào. Nay CÙNG MỘT điều kiện well-formed
 * (scale hữu hạn dương, pan hữu hạn) quyết định fit hay TỪ CHỐI; nơi gọi hoãn tới khi canvas đo
 * thật (cờ `gotoBoxPending`, cùng khuôn `fitOnOpenPending`). Không đo lại màn, không đoán số.
 *
 * `pad` mặc định `ZOOM_FIT_PAD` (= 80) — ĐÚNG con số listener cũ dùng, hành vi màn-đã-đo giữ
 * nguyên từng bit (khoá bằng ca ⑦ `import-summary.test.ts`).
 */
export function gotoBoxFit(box: Box, screen: { W: number; H: number }, pad = ZOOM_FIT_PAD): GotoBoxFit {
  const viewport = fitBox(box, screen.W, screen.H, pad);
  const sane = Number.isFinite(viewport.scale) && viewport.scale > 0
    && Number.isFinite(viewport.panX) && Number.isFinite(viewport.panY);
  return sane ? { ok: true, viewport } : { ok: false, reason: 'screen-not-measured' };
}

/**
 * Câu báo khi khung nhìn đã canh vào cụm vẽ chính — LUÔN nói cách xem lại toàn bộ (luật 4 ở trên).
 * Nói "nằm ngoài khung nhìn" chứ KHÔNG nói "bản sao rác": phần lớn trong đó là khung tên, ghi chú,
 * bản vẽ khác cùng file — chúng không hỏng, chỉ là đang không hiện.
 */
export function zoomFocusStatusLine(farEntities: number): string {
  return `Đã canh vào phần vẽ chính, ${viNum(farEntities)} hình nằm ngoài khung nhìn. Bấm F lần nữa để xem toàn bộ.`;
}

/** Câu báo khi người dùng bấm lần hai để xem toàn bộ. */
export const ZOOM_FULL_STATUS_LINE = 'Đang xem toàn bộ bản vẽ, kể cả hình để xa.';

/* ═══════════════════ 3 · CÂU CHO Ô DUYỆT TRƯỚC KHI XUẤT DXF (G-M1-20) ═══════════════════ */

/**
 * Ô duyệt trước khi xuất DXF từng ghi cứng **"Tải file DXF đã làm phẳng block — mở lại ở AutoCAD
 * sẽ không còn cấu trúc block"**. Câu đó ĐÚNG cho tới 06/08, sau đó thì SAI: bộ ghi nay dựng lại
 * block thật (đo trên hồ sơ thật: 91–457 bản chèn, 25–31 định nghĩa block mỗi file, bộ đọc DXF
 * độc lập duyệt sạch 0 lỗi). Nói với người dùng rằng họ sắp mất thứ họ KHÔNG mất là lỗi nặng
 * ngang nói họ giữ được thứ đã mất — cả hai đều khiến họ quyết định sai.
 *
 * Hàm THUẦN, tách khỏi component để kiểm được bằng `sucrase-node` với báo cáo thật.
 * Bốn field `insertsWritten`/`blockDefsWritten`/`preservedBlocks`/`flattenedBlocks` trước đây khai
 * ra rồi bỏ đó (không nơi nào đọc) — đây là nơi tiêu thụ của chúng (K4).
 */
export function exportBlockSummary(report: {
  insertsWritten: number;
  blockDefsWritten: number;
  preservedBlocks: Record<string, number>;
  flattenedBlocks: Record<string, number>;
  flattenedBlockCount: number;
}): { label: string; detail: string } {
  const flatEnts = Object.values(report.flattenedBlocks).reduce((a, b) => a + b, 0);
  const keptNames = Object.keys(report.preservedBlocks).length;

  // Không giữ được khối nào → giữ nguyên câu cũ, vì lúc đó nó đúng.
  if (report.insertsWritten === 0) {
    return {
      label: 'Tải file DXF — các khối bị rã thành nét rời',
      detail: `${viNum(report.flattenedBlockCount)} khối · ${viNum(flatEnts)} hình`,
    };
  }

  const kept = `Giữ ${viNum(report.insertsWritten)} khối (${viNum(keptNames)} loại)`;
  return {
    label: flatEnts > 0 ? 'Tải file DXF — giữ được phần lớn khối' : 'Tải file DXF — giữ nguyên khối',
    detail: flatEnts > 0
      ? `${kept} · ${viNum(flatEnts)} hình bị rã thành nét rời`
      : `${kept} · không hình nào bị rã`,
  };
}

/**
 * Câu cho mục "Tự phân loại" trong panel báo cáo nạp — nơi tiêu thụ của `report.elementTypes`
 * (K4: field khai xong phải có người đọc).
 *
 * ⛔ K3 — phải nói rõ đây là MÁY ĐOÁN, và đoán bằng gì. Người dùng có quyền biết để mà sửa lại;
 * giấu chuyện đoán đi thì con số trông như do họ khai.
 */
export function inferSummaryLine(elementTypes: { inferredCount: number; byLayer: Record<string, string> }): string | null {
  if (!elementTypes.inferredCount) return null;
  const layers = Object.keys(elementTypes.byLayer).length;
  return `Máy đoán ${viNum(elementTypes.inferredCount)} hình theo tên ${viNum(layers)} lớp. Kiểm lại rồi sửa nếu sai.`;
}
