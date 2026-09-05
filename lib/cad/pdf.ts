/**
 * lib/cad/pdf.ts — Sprint 7 Việc 1: xuất PDF VECTOR THẬT cho CAD (khác PDF của Present —
 * lib/present-editor/export.ts nhúng JPEG toàn trang qua addImage(), "trung thực" nhưng là
 * ẢNH). Ở đây vẽ lại TỪNG Entity bằng API hình học của jsPDF (line/rect/circle/triangle/text)
 * — giữ nét thật (zoom trong PDF viewer không bể) + text chọn/copy được, giống "Plot to PDF"
 * của AutoCAD.
 *
 * GIỚI HẠN ĐÃ XÁC NHẬN (đọc trước khi sửa): jsPDF 4.2.1 (package.json hiện tại) KHÔNG có
 * Optional Content Groups (OCG) — đã grep "OCG"/"optionalContent"/"addLayer"/"setLayer" trong
 * node_modules/jspdf/dist/*.js, không có kết quả nào. Vì vậy PDF xuất ra KHÔNG có layer ẩn/hiện
 * được trong PDF viewer thật (Preview/Acrobat) — chỉ đảm bảo đúng yêu cầu tối thiểu "vector,
 * không phải ảnh raster". Layer VẪN được tôn trọng ở bước xuất: layer đang ẨN trong app thì
 * KHÔNG vẽ vào PDF (giống hành vi drawEntities() ở lib/cad/render.ts), chỉ là không bật/tắt
 * lại được sau khi đã xuất. Muốn OCG thật cần đổi sang thư viện khác (VD pdf-lib) — ngoài
 * phạm vi sprint này (brief yêu cầu tái dùng jsPDF, không thêm dependency mới).
 *
 * Toạ độ: tái dùng CHÍNH XÁC fitBox()/worldToScreen() của lib/cad/model.ts — coi "pixel" của
 * Viewport là "mm giấy": fitBox(box, khổGiấyRộng, khổGiấyCao, lề) trả về {scale, panX, panY}
 * với scale = mm-giấy / mm-world (tỉ lệ bản vẽ), rồi worldToScreen(v, p) cho thẳng toạ độ mm
 * trên trang PDF (unit:'mm'). KHÔNG cần suy công thức mới, KHÔNG đụng render.ts.
 *
 * Lineweight (Layer.lineweight/Entity.lineweight): theo docstring model.ts, đây là mm ĐO TRÊN
 * GIẤY IN (chuẩn ISO 128 — pen width vật lý), khác `v.scale` (px-màn-hình/mm-world dùng cho
 * canvas hiển thị theo mức zoom). PDF dùng lineweight TRỰC TIẾP làm mm nét trên trang, KHÔNG
 * nhân thêm v.scale (khác effectiveLineWidthPx() trong render.ts — đúng vì đó là px màn hình
 * theo zoom, còn đây là mm giấy cố định bất kể tỉ lệ bản vẽ, đúng nghĩa "Plot to PDF").
 * Ngược lại TextEntity.h/DimStyle.textHeight/arrowSize là mm THẬT ngoài đời (tỉ lệ 1:1) nên
 * VẪN nhân v.scale để ra đúng cỡ trên giấy ở tỉ lệ bản vẽ đã chọn.
 *
 * FONT (#25): `buildCadPdf` gọi `ensureVietnameseFont(pdf)` (lib/pdf-font.ts) NGAY sau khi tạo
 * instance, TRƯỚC vòng vẽ entity — nếu không, mọi TEXT tiếng Việt (nhãn phòng, khung tên
 * `titleBlockPro`, nhãn zone) bị jsPDF mã hoá WinAnsi và mất dấu. Font mặc định (Be Vietnam
 * Pro) RỘNG hơn helvetica ~5-8%; file này KHÔNG đo/cắt chuỗi theo bề rộng ở đâu cả (cỡ chữ suy
 * từ TextEntity.h, không có ô nào bị clip), nên đổi font không làm lệch bố cục — ô khung tên
 * chật là do dữ liệu người dùng nhập dài, không phải do bước xuất.
 */

import type { Doc, Entity, Pt, Viewport, DimEntity, Sheet, Box } from './model';
import { docBox, entityBox, fitBox, fitScaleLabel, worldToScreen, ellipseBoundaryPoints, zoneBoundaryPoints, zoneCentroid, ZONE_GROUP_META, fixedScaleViewport, fitsAtScale, docPaperMm, defaultPaperOrientation, paperSizeMm, snapPrintScale, resolveDocPrintScaleN } from './model';
import { planExportLabelShifts, stripInternalJargon, type ExportLabelShift } from './label-placer';
import { BLOCK_MAP, type Prim } from './furniture';
import { hatchLines, hatchDots } from './hatch';
import { ensureVietnameseFont } from '../pdf-font';
import { docForViewport } from './paper-space';

/**
 * M0 fix (docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.6/§4) — khổ giấy/lề mặc định dùng khi
 * xuất PDF CAD. TẠM hardcode A3 ngang cho tới khi M1 (dropdown chọn khổ giấy, CHƯA duyệt) — export
 * ra để UI khung tên (`components/cad/CadEditor.tsx` → `TitleBlockPanel`) tính CÙNG một con số
 * tỉ lệ với lúc xuất PDF thật, không lệch nhau (đây chính là gốc lỗi §1.6: 2 nguồn số không liên hệ).
 */
export const DEFAULT_PDF_PAPER_MM: [number, number] = [420, 297];
export const DEFAULT_PDF_MARGIN_MM = 15;

/** Chuỗi mở đầu text khung tên ghi tỉ lệ — sinh bởi `titleBlock()` (lib/cad/commands.ts:184,
 * `text: \`Tỷ lệ ${info.scale}\``). Dùng để NHẬN DIỆN entity nào cần ghi đè tỉ lệ TÍNH THẬT lúc
 * xuất PDF — heuristic theo tiền tố chuỗi (không có field/kind riêng đánh dấu "đây là ô tỉ lệ" ở
 * tầng Entity, thêm field mới sẽ đụng DXF/IDF export — ngoài phạm vi M0 rẻ-độc lập). */
const TITLE_BLOCK_SCALE_PREFIX = 'Tỷ lệ ';

/**
 * M0 fix — trả về entities đã GHI ĐÈ đúng vị trí text tỉ lệ (nếu có, do `titleBlock()` chèn) bằng
 * `scaleLabel` TÍNH THẬT từ `fitBox()` tại đúng khổ giấy/lề sẽ dùng lúc xuất PDF này — KHÔNG đụng
 * `doc.entities` gốc (chỉ áp cho bản vẽ ra PDF), giữ nguyên field `scale` gõ tay trong app như cũ.
 * Entity không khớp tiền tố trả về NGUYÊN VẸN (giữ reference, không clone thừa).
 */
/** B1 fix (24/07): tiền tố suông "Tỷ lệ " bắt NHẦM cả nhãn thước tỉ lệ "Tỷ lệ (m)" (scaleBar,
 * commands.ts) → xuất PDF biến caption thước thành "Tỷ lệ 1:N". Nay yêu cầu sau tiền tố phải là
 * CHỮ SỐ (ô tỉ lệ khung tên luôn dạng "Tỷ lệ 1:100"). */
const TITLE_BLOCK_SCALE_RE = /^Tỷ lệ \d/;

export function applyRealScaleToTitleBlock(entities: Entity[], scaleLabel: string): Entity[] {
  return entities.map((e) =>
    e.type === 'text' && TITLE_BLOCK_SCALE_RE.test(e.text)
      ? { ...e, text: `${TITLE_BLOCK_SCALE_PREFIX}${scaleLabel}` }
      : e,
  );
}

/* ─────────── P0-GIAY (05/09) — KHUNG TÊN LÀ VẬT CỦA TỜ GIẤY, KHÔNG PHẢI VẬT CỦA MÔ HÌNH ───────────
 *
 * 🔴 GỐC BỆNH ĐO ĐƯỢC (A2-01): khung tên do `titleBlockPro()` sinh ra là entity **trong model
 * space**, đặt tại `box.maxX + 500 + 180*k` với `k` = tỉ lệ ĐOÁN lúc chèn. Tờ giấy thì in qua
 * `Viewport2D` có `scale` RIÊNG (mặc định 1:100, `CadSheets.defaultSheet()`), và `centerMm` chốt
 * theo bao hình TẠI LÚC TẠO TỜ. Hai con số không liên hệ nhau ⇒
 *   · chèn 1 lần trên bản demo A3: khối rộng 180×50 = 9000mm world, in ở 1:100 ra **90mm** thay vì
 *     180mm — chữ "Tỷ lệ" 3,4mm co còn **1,70mm** (đúng con số A2-05 đo được);
 *   · chèn lần 2 (`box.maxX` đã nở): khối văng tới world x=32230 trong khi cửa sổ ô nhìn chỉ tới
 *     24485 ⇒ cả cột phải rơi NGOÀI vùng cắt — đo trên PDF thật: chuỗi ở **x=1489pt trên trang
 *     1190pt**. Người đọc bản vẽ thấy "1:5" của một tờ 1:50 — sai mười lần.
 *
 * ⇒ Cách chữa KHÔNG phải nới cửa sổ ô nhìn (thế là phá "plot to scale"), mà là trả khung tên về
 * ĐÚNG CHỖ của nó trong nghề: **paper space**. Ô nhìn cắt hình mô hình là chuyện bình thường của
 * CAD; khung tên bị cắt thì không bao giờ bình thường. Đặt ở paper space ⇒ luôn đủ 180×42mm, luôn
 * nằm trong khung viền, không phụ thuộc `k` đoán lúc chèn, và KHÔNG THỂ bị cắt.
 */

/** Khổ chuẩn của khung tên trên GIẤY (mm) — khớp template `titleBlockPro()` (180×42). */
const TITLE_BLOCK_PAPER_W_MM = 180;
const TITLE_BLOCK_PAPER_H_MM = 42;

export interface KhungTenPhatHien {
  /** bao hình world của cả khối khung tên. */
  box: Box;
  /** mọi entity thuộc khối (kể cả khung, vạch chia, chữ). */
  entities: Entity[];
  /** id các entity thuộc khối — để loại khỏi vòng vẽ model space. */
  ids: Set<string>;
}

/**
 * Tìm khối khung tên đã bake trong `entities`: một `rect` có chứa TRỌN một text ô tỉ lệ
 * (`/^Tỷ lệ \d/`) bên trong. Cả `titleBlock()` cũ lẫn `titleBlockPro()` đều đẩy `rect` bao ngoài
 * làm entity ĐẦU TIÊN rồi mới tới vạch/chữ nằm trong, nên nhận diện theo "rect nào bao ô tỉ lệ"
 * là đủ và không cần thêm field mới vào Entity (thêm field sẽ đụng DXF/IDF — xem ghi chú
 * `TITLE_BLOCK_SCALE_PREFIX`).
 *
 * Nhiều khối cùng tờ (bản demo tự mang một khung tên cũ, người dùng chèn thêm khung tên 9 ô) thì
 * lấy khối **rộng nhất** — đó là khung tên chính của tờ; khối còn lại vẫn vẽ bình thường trong ô
 * nhìn như một ghi chú model space.
 */
export function timCacKhungTen(entities: Entity[]): KhungTenPhatHien[] {
  const rects = entities.filter((e): e is Extract<Entity, { type: 'rect' }> => e.type === 'rect');
  if (!rects.length) return [];
  const oTiLe = entities.filter((e) => e.type === 'text' && TITLE_BLOCK_SCALE_RE.test((e as { text: string }).text));
  if (!oTiLe.length) return [];

  const trong = (box: Box, b: Box) =>
    b.minX >= box.minX - 1e-6 && b.maxX <= box.maxX + 1e-6 && b.minY >= box.minY - 1e-6 && b.maxY <= box.maxY + 1e-6;

  const raw: KhungTenPhatHien[] = [];
  for (const r of rects) {
    const box: Box = {
      minX: Math.min(r.x, r.x + r.w), minY: Math.min(r.y, r.y + r.h),
      maxX: Math.max(r.x, r.x + r.w), maxY: Math.max(r.y, r.y + r.h),
    };
    const bw = box.maxX - box.minX;
    const bh = box.maxY - box.minY;
    if (bw <= 0 || bh <= 0) continue;
    // Chặn nhận nhầm: khung tên là khối NẰM NGANG dẹt (180/42 = 4,3 · khối cũ 2600/900 = 2,9).
    // Không có rào này thì một `rect` phòng to bao trọn ô tỉ lệ cũng bị nuốt theo cả bản vẽ.
    const ti = bw / bh;
    if (ti < 1.5 || ti > 8) continue;
    if (!oTiLe.some((t) => trong(box, entityBox(t)))) continue;
    // Chữ thuộc khối tính theo ĐIỂM NEO, không theo bao hình: `fitTextHeightMm()` chỉ co chữ tới
    // sàn 60% rồi CHẤP NHẬN tràn, nên dòng dài (tên bản vẽ, dòng "Vẽ · Kiểm") thò ra khỏi chính
    // hộp của nó — đo trên bản demo: 2/5 dòng thò. Lọc theo bao hình thì hai dòng đó BỊ BỎ LẠI
    // trong ô nhìn trong khi phần còn lại của khối đã lên giấy ⇒ khung tên in ra thiếu dòng, và
    // dòng bị bỏ lại thì nằm chờ vùng cắt xén. Khối khung tên phải đi TRỌN hoặc không đi.
    const thuoc = entities.filter((e) => {
      if (e.type === 'text') return trong(box, { minX: e.at.x, minY: e.at.y, maxX: e.at.x, maxY: e.at.y });
      const b = entityBox(e);
      return Number.isFinite(b.minX) && trong(box, b);
    });
    // Ngưỡng 2 chứ không phải 3, và đây là con số ĐO chứ không phải đoán: khung tên cũ của bản
    // demo có 5 dòng chữ nhưng **2 dòng tràn ra ngoài chính hộp của nó** (đúng nửa sau của A2-04),
    // nên chỉ 2 dòng nằm trọn bên trong. Đặt ngưỡng 3 là bỏ sót đúng khối khung tên thật — mà bỏ
    // sót nghĩa là để nó lại trong ô nhìn cho vùng cắt xén chữ, tức là ca P0 này.
    if (thuoc.filter((e) => e.type === 'text').length < 2) continue;
    // Bao hình của khối = HỢP bao hình mọi thành viên (không phải chỉ cái `rect`): có thế thì
    // `viewportKhopO` mới ép được CẢ phần chữ thò ra vào trong ô giấy. Lấy mỗi `rect` thì đúng
    // phần thò đó lại lọt ra ngoài mép — tức tái lập chính lỗi A2-01 ở quy mô nhỏ hơn.
    const hop: Box = { ...box };
    for (const e of thuoc) {
      const b = entityBox(e);
      if (!Number.isFinite(b.minX)) continue;
      hop.minX = Math.min(hop.minX, b.minX); hop.minY = Math.min(hop.minY, b.minY);
      hop.maxX = Math.max(hop.maxX, b.maxX); hop.maxY = Math.max(hop.maxY, b.maxY);
    }
    raw.push({ box: hop, entities: thuoc, ids: new Set(thuoc.map((e) => e.id)) });
  }
  // Khối lồng trong khối khác (rect con của chính khung tên) — bỏ, giữ khối ngoài cùng.
  const ngoai = raw.filter((a) => !raw.some((b) => b !== a && a.ids.size < b.ids.size && trong(b.box, a.box)));
  return ngoai.sort((a, b) => (b.box.maxX - b.box.minX) - (a.box.maxX - a.box.minX));
}

/** Khung tên CHÍNH của tờ = khối rộng nhất. `null` khi bản vẽ chưa chèn khung tên nào. */
export function timKhungTen(entities: Entity[]): KhungTenPhatHien | null {
  return timCacKhungTen(entities)[0] ?? null;
}

/**
 * Viewport đưa bao hình `box` (world) khớp ĐÚNG ô chữ nhật `slot` trên giấy (mm), giữ tỉ lệ khung
 * hình và căn giữa. Dùng để vẽ khung tên ở paper space bất kể nó được bake ở `k` nào.
 */
export function viewportKhopO(box: Box, slot: { x: number; y: number; w: number; h: number }): Viewport {
  const bw = Math.max(1e-6, box.maxX - box.minX);
  const bh = Math.max(1e-6, box.maxY - box.minY);
  const scale = Math.min(slot.w / bw, slot.h / bh);
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  return { scale, panX: slot.x + slot.w / 2 - cx * scale, panY: slot.y + slot.h / 2 + cy * scale };
}

/** VIỆC 2 `khung-ten-sach` (CHUAN-DAU-RA §1) — gỡ jargon nội bộ khỏi MỌI text sẽ in ra file
 * (bắt được 11/08: "(đã rà công năng)" nằm trong tên bản vẽ đã BAKE thành entity từ trước, sửa
 * ở `titleBlockPro` không cứu được doc cũ). Chỉ clone entity có chữ đổi — giữ reference còn lại
 * (cùng convention `applyRealScaleToTitleBlock`). */
export function stripJargonFromEntities(entities: Entity[]): Entity[] {
  return entities.map((e) => {
    if (e.type !== 'text') return e;
    const clean = stripInternalJargon(e.text);
    return clean === e.text ? e : { ...e, text: clean };
  });
}

/**
 * VIỆC 1 `ty-le-chuan` — TỈ LỆ CHUẨN hiệu dụng mà đường xuất PDF sẽ dùng cho Doc này:
 *   · `doc.printScale` đã chọn và lọt giấy → tôn trọng nguyên vẹn (kể cả nấc lẻ người dùng
 *     cố ý gõ — cổng CHUAN_DAU_RA sẽ báo, đường xuất không tự sửa lựa chọn tường minh);
 *   · còn lại → auto-fit rồi BẮT về nấc chuẩn gần nhất phía nhỏ (`snapPrintScale`) — hết cảnh
 *     in "Tỷ lệ 1:47";
 *   · null = không nấc chuẩn nào lọt giấy (vượt 1:500) — caller rơi về auto-fit số lẻ cũ và
 *     cổng kiểm sẽ chặn, không im lặng.
 * Export để `export-checks.ts` kiểm CÙNG con số với file xuất thật (một nguồn, không lệch nhau).
 */
export function resolveExportScaleN(doc: Doc, pw: number, ph: number, margin: number): number | null {
  // P0-GIAY (05/09) — phép tính đã DỜI về `model.ts:resolveDocPrintScaleN` để màn hình (khung tên)
  // và đường xuất đọc CÙNG một hàm. Giữ tên + chữ ký ở đây vì `export-checks.ts` và test cũ đang
  // gọi; đây nay chỉ là vỏ, KHÔNG được tính lại (hai phép tính là gốc bệnh A2-02).
  return resolveDocPrintScaleN(doc, [pw, ph], margin);
}

/** 2.1.8.m (30/07) — nhãn "Khổ · Hướng" cho mục lục bộ hồ sơ (VD "A4 · Dọc") — khổ và hướng là
 * 2 trục độc lập (xem model.ts), 1 tên khổ không còn đủ mô tả 1 trang giấy thật. Export riêng
 * (không phải closure cục bộ trong buildSheetSetPdf) để test được trực tiếp, không phải spy
 * jsPDF (jsPDF gắn `text()` làm own-property mỗi instance, không qua prototype — khó spy sạch). */
export function paperKeyOrientationLabel(doc: Doc): string {
  const key = doc.paperKey ?? 'A3';
  const orientation = doc.paperOrientation ?? defaultPaperOrientation(key);
  return `${key} · ${orientation === 'portrait' ? 'Dọc' : 'Ngang'}`;
}

/** Dim style tối thiểu — bản sao cục bộ giống hệt DEFAULT_DIM_STYLE của render.ts (chủ đích
 * KHÔNG import từ store.ts để tránh kéo theo 'use client'/zustand vào module thuần này —
 * render.ts cũng tự định nghĩa riêng với lý do y hệt, xem comment ở đó). */
export interface CadPdfDimStyle {
  textHeight: number;
  arrowSize: number;
  dimScale: number;
}
const DEFAULT_DIM_STYLE: CadPdfDimStyle = { textHeight: 120, arrowSize: 80, dimScale: 1 };

export interface CadPdfOptions {
  /** khổ giấy mm [rộng, cao] — mặc định A3 ngang (420×297, đủ cho mặt bằng căn hộ nhỏ-vừa). */
  paper?: [number, number];
  /** lề mm quanh bản vẽ trong khổ giấy. */
  margin?: number;
  /** tiêu đề in góc dưới-trái trang (VD tên project + sheet). */
  title?: string;
  dimStyle?: CadPdfDimStyle;
  /** P4 (04/08) — "số tờ" trong khung tên (VD "Tờ 2/5"). `buildSheetSetPdf()` TỰ điền 2 field
   * này cho mỗi trang theo đúng thứ tự thật (không cần caller tự đếm) — `buildCadPdf()` (1 tờ
   * đơn lẻ, chưa nối bộ hồ sơ, xem đầu file NC-xuat-pdf) chỉ vẽ khi caller CHỦ ĐỘNG truyền vào. */
  sheetIndex?: number;
  sheetCount?: number;
  /** P4 (04/08) — "phiên bản"/revision bản vẽ (VD "Rev A", "v2") — KHÔNG có field tương đương ở
   * `TitleBlockInfoPro` (lib/cad/commands.ts, ngoài vùng file `lib/cad/pdf*.ts` của đợt này) nên
   * hiện tại chỉ vẽ được ở dòng ghi chú cuối trang (`pdfFooterLine`), không phải TRONG khung tên
   * bằng entity thật — cần P nào sở hữu commands.ts/TitleBlockInfoPro thêm field `version` rồi
   * nối UI mới lên được khung tên đúng nghĩa. Ghi rõ giới hạn, không giả vờ đã đủ. */
  version?: string;
}

const MM_PER_PT = 25.4 / 72;
const mmToPt = (mm: number) => Math.max(4, mm / MM_PER_PT);

/**
 * P4 (04/08) — bề dày nét TỐI THIỂU đảm bảo còn nhìn thấy khi in thật (yêu cầu "hairline không
 * được biến mất khi in"). Trước đây sàn là 0.03mm — DƯỚI CẢ lineweight ISO 128 mảnh nhất trong
 * hệ thống (`STANDARD_LINEWEIGHTS[0]` = 0.13mm, `model.ts`) nên chỉ có ý nghĩa chặn giá trị 0/âm
 * từ dữ liệu hỏng, KHÔNG đảm bảo in ra còn thấy: máy in văn phòng/RIP phổ thông (300-600dpi) hay
 * làm mất/đứt nét dưới ~0.1mm do dot-gain, trong khi PDF vector không có "hairline 0-width tự
 * đảm bảo 1px thiết bị" đúng NGHĨA plot CAD (0-width là "mảnh nhất máy render được", không phải
 * "đúng bề dày mm đã khai" — sai mục đích ISO 128 là in ĐÚNG mm thật). Chọn 0.1mm: dưới lineweight
 * chuẩn mảnh nhất (0.13mm, còn margin cho dữ liệu cũ/tuỳ chỉnh nhỏ hơn chuẩn) nhưng đủ dày để máy
 * in phổ thông không đánh rơi — không phải số tự bịa, khớp thực hành "hairline in ấn" phổ biến
 * (Illustrator/InDesign mặc định coi <0.1mm là rủi ro mất nét khi in offset/laser).
 */
export const MIN_PRINTABLE_LINE_MM = 0.1;

function layerColorOf(doc: Doc, e: Entity, fallback: string): string {
  if (e.color) return e.color;
  const lay = doc.layers.find((l) => l.id === e.layer);
  return lay?.color ?? fallback;
}

/** Lineweight HIỆU DỤNG = mm trên giấy thật (KHÔNG nhân v.scale — xem comment đầu file). Sàn
 * 0.05mm ở đây chỉ chặn giá trị 0/âm hỏng dữ liệu — sàn IN-ẤN THẬT (đảm bảo không mất nét khi in)
 * nằm ở `setStroke()`/`MIN_PRINTABLE_LINE_MM`, LUÔN cao hơn (0.1mm) nên áp dụng sau cùng. */
function lineWidthMmOf(doc: Doc, e: Entity): number {
  const lay = doc.layers.find((l) => l.id === e.layer);
  return Math.max(0.05, e.lineweight ?? lay?.lineweight ?? 0.25);
}

function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

/** Xấp xỉ cung tròn (world mm, KHÔNG transform) thành đa giác — vẫn là ĐƯỜNG THẲNG THẬT
 * trong PDF (vector), chỉ là polyline mịn thay vì lệnh "arc" gốc của PDF (jsPDF 4.2.1 không
 * có API arc bậc thấp public để vẽ cung chuẩn — dùng polyline mịn là cách an toàn, phổ biến). */
function arcPoints(c: Pt, r: number, a1: number, a2: number): Pt[] {
  let sweep = a2 - a1;
  while (sweep <= 0) sweep += Math.PI * 2;
  while (sweep > Math.PI * 2) sweep -= Math.PI * 2;
  const segs = Math.max(8, Math.min(96, Math.ceil((sweep / (Math.PI * 2)) * 96)));
  const pts: Pt[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = a1 + (sweep * i) / segs;
    pts.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return pts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsPdf = any;

function setStroke(pdf: JsPdf, color: string, widthMm: number) {
  pdf.setDrawColor(color);
  pdf.setLineWidth(Math.max(MIN_PRINTABLE_LINE_MM, widthMm));
}

function polylinePdf(pdf: JsPdf, pts: Pt[], closed: boolean) {
  for (let i = 0; i < pts.length - 1; i++) pdf.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  if (closed && pts.length > 2) pdf.line(pts[pts.length - 1].x, pts[pts.length - 1].y, pts[0].x, pts[0].y);
}

/** Fan-triangulation từ đỉnh 0 để tô đặc — CÙNG cách tiếp cận đã dùng cho HATCH SOLID khi xuất
 * DXF (xem comment lib/cad/model.ts trên HatchEntity: "tam-giác-hoá quạt từ đỉnh 0"), đủ cho đa
 * giác lồi/gần-lồi (quad tường do lệnh WALL sinh ra — phạm vi hatch đã tài liệu hoá). */
function fillPolygonPdf(pdf: JsPdf, pts: Pt[]) {
  for (let i = 1; i + 1 < pts.length; i++) {
    pdf.triangle(pts[0].x, pts[0].y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, 'F');
  }
}

function drawArrowPdf(pdf: JsPdf, from: Pt, tip: Pt, color: string, sizeMm: number) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const size = Math.max(0.8, sizeMm);
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  pdf.setFillColor(color);
  pdf.triangle(tip.x, tip.y, back.x + px * size * 0.4, back.y + py * size * 0.4, back.x - px * size * 0.4, back.y - py * size * 0.4, 'F');
}

function drawPrimPdf(pdf: JsPdf, v: Viewport, prim: Prim, tf: (p: Pt) => Pt, color: string, widthMm: number) {
  const S = (p: Pt) => worldToScreen(v, tf(p));
  setStroke(pdf, color, widthMm);
  if (prim.k === 'line') {
    const a = S(prim.a);
    const b = S(prim.b);
    pdf.line(a.x, a.y, b.x, b.y);
  } else if (prim.k === 'poly') {
    polylinePdf(pdf, prim.pts.map(S), !!prim.closed);
  } else if (prim.k === 'circle') {
    const c = worldToScreen(v, tf(prim.c));
    pdf.circle(c.x, c.y, Math.max(0.1, Math.abs(prim.r) * v.scale), 'S');
  } else if (prim.k === 'arc') {
    const pts = arcPoints(prim.c, prim.r, prim.a1, prim.a2).map((p) => S(p));
    polylinePdf(pdf, pts, false);
  }
}

function drawHatchPdf(pdf: JsPdf, v: Viewport, e: Extract<Entity, { type: 'hatch' }>, color: string) {
  if (e.points.length < 3) return;
  const S = (p: Pt) => worldToScreen(v, p);
  const pattern = e.pattern ?? (e.solid === false ? 'ANSI31' : 'SOLID');
  if (pattern === 'SOLID') {
    pdf.setFillColor(color);
    fillPolygonPdf(pdf, e.points.map(S));
  } else if (pattern === 'DOTS') {
    pdf.setFillColor(color);
    for (const p of hatchDots(e.points, e.patternScale ?? 1)) {
      const s = S(p);
      pdf.circle(s.x, s.y, 0.15, 'F');
    }
  } else {
    setStroke(pdf, color, 0.1);
    for (const [p, q] of hatchLines(e.points, pattern, e.patternScale ?? 1, e.patternAngle ?? 0)) {
      const a = S(p);
      const b = S(q);
      pdf.line(a.x, a.y, b.x, b.y);
    }
  }
}

function drawDimPdf(pdf: JsPdf, v: Viewport, e: DimEntity, color: string, ds: CadPdfDimStyle, shift?: ExportLabelShift) {
  const S = (p: Pt) => worldToScreen(v, p);
  const kind = e.kind ?? 'aligned';
  setStroke(pdf, color, 0.15);
  pdf.setTextColor(color);
  pdf.setFontSize(mmToPt(ds.textHeight * ds.dimScale * v.scale));
  const arrowMm = Math.max(0.8, ds.arrowSize * ds.dimScale * v.scale);

  if (kind === 'radius' || kind === 'diameter') {
    const diameter = kind === 'diameter';
    const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
    const from = diameter ? { x: e.a.x * 2 - e.b.x, y: e.a.y * 2 - e.b.y } : e.a;
    const sFrom = S(from);
    const sTo = S(e.b);
    pdf.line(sFrom.x, sFrom.y, sTo.x, sTo.y);
    drawArrowPdf(pdf, sFrom, sTo, color, arrowMm);
    if (diameter) drawArrowPdf(pdf, sTo, sFrom, color, arrowMm);
    // #25 — dùng 'Ø' (U+00D8, ký hiệu đường kính chuẩn ISO 129 trên bản vẽ) THAY '⌀' (U+2300):
    // U+2300 gần như không có trong font chữ thường (không có trong Be Vietnam Pro, Noto Sans,
    // lẫn bảng WinAnsi của jsPDF) ⇒ in ra là ô rỗng .notdef. Đổi cả ở render.ts (canvas) để
    // màn hình và bản in khớp nhau.
    const label = diameter ? `Ø${Math.round(r * 2)}` : `R${Math.round(r)}`;
    pdf.text(label, (sFrom.x + sTo.x) / 2, (sFrom.y + sTo.y) / 2 - 1);
  } else if (kind === 'angular' && e.c) {
    const ang1 = Math.atan2(e.a.y - e.c.y, e.a.x - e.c.x);
    const ang2 = Math.atan2(e.b.y - e.c.y, e.b.x - e.c.x);
    const r = Math.abs(e.off) || 500;
    const p1 = { x: e.c.x + r * Math.cos(ang1), y: e.c.y + r * Math.sin(ang1) };
    const p2 = { x: e.c.x + r * Math.cos(ang2), y: e.c.y + r * Math.sin(ang2) };
    const sc = S(e.c);
    const sp1 = S(p1);
    const sp2 = S(p2);
    pdf.line(sc.x, sc.y, sp1.x, sp1.y);
    pdf.line(sc.x, sc.y, sp2.x, sp2.y);
    polylinePdf(pdf, arcPoints(e.c, r, ang1, ang2).map(S), false);
    let sweep = ang2 - ang1;
    while (sweep <= 0) sweep += Math.PI * 2;
    const deg = Math.round((sweep * 180) / Math.PI);
    const mid = ang1 + sweep / 2;
    const tp = S({ x: e.c.x + r * Math.cos(mid), y: e.c.y + r * Math.sin(mid) });
    pdf.text(`${deg}°`, tp.x, tp.y);
  } else {
    const dx = e.b.x - e.a.x;
    const dy = e.b.y - e.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const oa = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
    const ob = { x: e.b.x + nx * e.off, y: e.b.y + ny * e.off };
    const sa = S(oa);
    const sb = S(ob);
    const sa0 = S(e.a);
    const sb0 = S(e.b);
    // VIỆC v2 `dimOutsideRoom` — shift.wholeDim = dời CẢ CỤM: đường dim + chữ dời theo (dx,dy),
    // extension line vẫn bám mốc đo thật a/b (kéo dài ra tới đường dim mới — đúng ngữ nghĩa dim).
    const whole = shift?.wholeDim ? { dx: shift.dx, dy: shift.dy } : { dx: 0, dy: 0 };
    const sa2 = whole.dx || whole.dy ? S({ x: oa.x + whole.dx, y: oa.y + whole.dy }) : sa;
    const sb2 = whole.dx || whole.dy ? S({ x: ob.x + whole.dx, y: ob.y + whole.dy }) : sb;
    pdf.line(sa0.x, sa0.y, sa2.x, sa2.y);
    pdf.line(sb0.x, sb0.y, sb2.x, sb2.y);
    pdf.line(sa2.x, sa2.y, sb2.x, sb2.y);
    // VIỆC 3 — chuỗi dim đè chuỗi khác thì DỜI RIÊNG CHỮ (mm world, từ label-placer); wholeDim
    // thì chữ đi cùng cụm (cùng dx/dy).
    const tm = S({ x: (oa.x + ob.x) / 2 + (shift?.dx ?? 0), y: (oa.y + ob.y) / 2 + (shift?.dy ?? 0) });
    pdf.text(`${Math.round(len)}`, tm.x, tm.y - 1);
  }
}

function drawEntityPdf(pdf: JsPdf, v: Viewport, doc: Doc, e: Entity, ds: CadPdfDimStyle, shift?: ExportLabelShift) {
  const S = (p: Pt) => worldToScreen(v, p);
  const color = layerColorOf(doc, e, '#111111');
  const widthMm = lineWidthMmOf(doc, e);
  setStroke(pdf, color, widthMm);

  switch (e.type) {
    case 'line': {
      const a = S(e.a);
      const b = S(e.b);
      pdf.line(a.x, a.y, b.x, b.y);
      break;
    }
    case 'polyline':
      polylinePdf(pdf, e.points.map(S), e.closed);
      break;
    case 'rect': {
      const p0 = S({ x: e.x, y: e.y });
      const p1 = S({ x: e.x + e.w, y: e.y + e.h });
      pdf.rect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y), 'S');
      break;
    }
    case 'circle': {
      const c = S(e.c);
      pdf.circle(c.x, c.y, Math.max(0.1, Math.abs(e.r) * v.scale), 'S');
      break;
    }
    case 'arc':
      polylinePdf(pdf, arcPoints(e.c, e.r, e.a1, e.a2).map(S), false);
      break;
    case 'text': {
      // VIỆC 3 `label-ne-hinh` — nhãn (phòng) có kế hoạch né thì vẽ ở vị trí ĐÃ DỜI; phải kéo
      // ra ngoài thì vẽ thêm leader mảnh trỏ về điểm gốc nó chú thích (CHUAN-DAU-RA §1).
      const at = S(shift ? { x: e.at.x + shift.dx, y: e.at.y + shift.dy } : e.at);
      if (shift?.leader) {
        setStroke(pdf, color, 0.13);
        const lf = S(shift.leader.from);
        const lt = S(shift.leader.to);
        pdf.line(lf.x, lf.y, lt.x, lt.y);
      }
      pdf.setTextColor(color);
      pdf.setFontSize(mmToPt(Math.max(1, e.h) * v.scale));
      pdf.text(e.text, at.x, at.y);
      break;
    }
    case 'dim':
      drawDimPdf(pdf, v, e, color, ds, shift);
      break;
    case 'block': {
      const def = BLOCK_MAP[e.block];
      if (!def) break;
      const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
      for (const prim of def.prims) drawPrimPdf(pdf, v, prim, tf, color, widthMm);
      break;
    }
    case 'hatch':
      drawHatchPdf(pdf, v, e, color);
      break;
    // Zone tool (N2) — hỗ trợ tối thiểu trong PDF vector: ellipse/zone → polyline xấp xỉ,
    // arrow → polyline + 2 đoạn đầu mũi tên. Zone fill nhạt qua GState opacity (jsPDF hỗ trợ);
    // môi trường không hỗ trợ GState → chỉ vẽ viền + nhãn (không crash).
    case 'ellipse':
      polylinePdf(pdf, ellipseBoundaryPoints(e.c, e.rx, e.ry, e.rot ?? 0, 32).map(S), true);
      break;
    case 'arrow': {
      if (e.path.length < 2) break;
      pdf.setLineDashPattern?.([1.5, 1.2], 0);
      polylinePdf(pdf, e.path.map(S), false);
      pdf.setLineDashPattern?.([], 0);
      const head = (from: Pt, tip: Pt) => {
        const size = e.headSize ?? 250;
        const dx = tip.x - from.x;
        const dy = tip.y - from.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const back = { x: tip.x - ux * size, y: tip.y - uy * size };
        const t = S(tip);
        const b1 = S({ x: back.x - uy * size * 0.4, y: back.y + ux * size * 0.4 });
        const b2 = S({ x: back.x + uy * size * 0.4, y: back.y - ux * size * 0.4 });
        pdf.line(b1.x, b1.y, t.x, t.y);
        pdf.line(b2.x, b2.y, t.x, t.y);
      };
      if (e.headEnd !== false) head(e.path[e.path.length - 2], e.path[e.path.length - 1]);
      if (e.headStart) head(e.path[1], e.path[0]);
      break;
    }
    case 'zone': {
      const pts = zoneBoundaryPoints(e, 32).map(S);
      if (pts.length < 3) break;
      const zColor = e.color ?? ZONE_GROUP_META[e.group]?.color ?? '#9a9488';
      setStroke(pdf, zColor, widthMm);
      try {
        const P = pdf as unknown as { GState?: new (o: { opacity: number }) => unknown; setGState?: (g: unknown) => void; setFillColor: (c: string) => void };
        if (P.GState && P.setGState) {
          P.setFillColor(zColor);
          P.setGState(new P.GState({ opacity: Math.max(0, Math.min(1, e.opacity ?? 0.4)) }));
          fillPolygonPdf(pdf, pts);
          P.setGState(new P.GState({ opacity: 1 }));
        }
      } catch {
        /* fallback: chỉ viền */
      }
      polylinePdf(pdf, pts, true);
      if (e.label) {
        const at = S(e.labelPos ?? zoneCentroid(e));
        pdf.setTextColor('#1E1B16');
        pdf.setFontSize(mmToPt(Math.max(2, 260 * v.scale)));
        pdf.text(e.label.toUpperCase(), at.x, at.y, { align: 'center' });
      }
      break;
    }
  }
}

/** Khổ giấy hiệu dụng của 1 trang PDF (mm) + orientation suy từ đó — tách ra vì `buildCadPdf`
 * (trang đơn) VÀ `buildSheetSetPdf` (nhiều trang, mỗi trang addPage() với khổ riêng) đều cần
 * đúng công thức orientation này (xem lý do ở drawDocOntoPdfPage bên dưới). */
function pageFormatOf(doc: Doc, opts: CadPdfOptions): { pw: number; ph: number; orientation: 'landscape' | 'portrait' } {
  const [pw, ph] = opts.paper ?? docPaperMm(doc);
  return { pw, ph, orientation: pw >= ph ? 'landscape' : 'portrait' };
}

/**
 * Vẽ 1 Doc lên TRANG HIỆN TẠI của 1 jsPDF instance đã tồn tại (đã đúng khổ giấy — caller lo
 * `new jsPDF(...)`/`pdf.addPage(...)` trước khi gọi). Tách khỏi `buildCadPdf` để `buildSheetSetPdf`
 * (2.1.8.k) dùng lại NGUYÊN VẸN logic vẽ 1 tờ mà không phải tạo N instance jsPDF rời rồi tự ghép
 * (jsPDF không có API "merge 2 PDF" — addPage() trong CÙNG 1 instance là cách đúng, xem
 * lib/cad/standards-report.ts đã làm y hệt cho báo cáo nhiều trang).
 */
function drawDocOntoPdfPage(pdf: JsPdf, doc: Doc, pw: number, ph: number, opts: CadPdfOptions): void {
  const margin = opts.margin ?? DEFAULT_PDF_MARGIN_MM;
  const ds = opts.dimStyle ?? DEFAULT_DIM_STYLE;
  const box = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  // VIỆC 1 `ty-le-chuan` (CHUAN-DAU-RA §1) — B1 "plot to scale" mở rộng: MỌI đường ra tỉ lệ đều
  // qua `resolveExportScaleN` (printScale hợp lệ → giữ; auto-fit → BẮT về nấc chuẩn phía nhỏ).
  // Chỉ khi không nấc chuẩn nào lọt giấy (vượt 1:500) mới rơi về auto-fit số lẻ cũ — ca đó cổng
  // CHUAN_DAU_RA trong export-checks.ts báo lỗi, không im lặng in "1:47".
  const scaleN = resolveExportScaleN(doc, pw, ph, margin);
  const v: Viewport = scaleN !== null
    ? fixedScaleViewport(box, [pw, ph], scaleN)
    : fitBox(box, pw, ph, margin);
  // M0 fix (§1.6) — khoá lỗi tỉ lệ khung tên gõ tay không khớp tỉ lệ in thật: TÍNH LẠI "1:N" thật
  // từ ĐÚNG viewport sẽ vẽ rồi ghi đè vào entity text khung tên trước khi vẽ — entity gốc trong
  // doc/app KHÔNG đổi. Kèm VIỆC 2: gỡ jargon nội bộ khỏi mọi text sẽ in ra.
  const scaleLabel = scaleN !== null ? `1:${scaleN}` : fitScaleLabel(box, [pw, ph], margin);
  const entities = stripJargonFromEntities(applyRealScaleToTitleBlock(doc.entities, scaleLabel));
  // VIỆC 3 `label-ne-hinh` (v2) — kế hoạch DỜI nhãn phòng/chuỗi dim để không đè hình/đè nhau khi
  // in. Tính trên entities SẼ VẼ (sau ghi đè tỉ lệ — cùng id), chỉ áp lúc vẽ, Doc gốc không đổi.
  // v2 cần biết: scaleN (bậc thang dim 8mm GIẤY → mm world) + vùng world còn thấy trên trang
  // (dim dời ra ngoài không được rơi khỏi mép giấy — rơi thì giữ nguyên, gate warn đếm).
  const pageWorldBox = {
    minX: (0 - v.panX) / v.scale,
    maxX: (pw - v.panX) / v.scale,
    minY: (v.panY - ph) / v.scale,
    maxY: (v.panY - 0) / v.scale,
  };
  const labelShifts = planExportLabelShifts({ entities, layers: doc.layers }, ds, { scaleN: scaleN ?? undefined, pageWorldBox });

  pdf.setLineCap?.(1); // 1 = round — nét nối mượt hơn (không bắt buộc, jsPDF fallback im lặng nếu thiếu)
  for (const e of entities) {
    const lay = doc.layers.find((l) => l.id === e.layer);
    if (lay && !lay.visible) continue; // layer ẩn trong app → không vẽ vào PDF (xem giới hạn OCG đầu file)
    drawEntityPdf(pdf, v, doc, e, ds, labelShifts.get(e.id));
  }
  const footer = pdfFooterLine(opts);
  if (footer) {
    pdf.setFontSize(9);
    pdf.setTextColor('#888888');
    pdf.text(footer, margin, ph - 6);
  }
}

/** Vẽ đúng bố cục Paper: mỗi ô nhìn có rect/tâm/tỉ lệ/layer riêng, không fit lại toàn Doc. */
function drawPaperSheetOntoPdfPage(pdf: JsPdf, doc: Doc, sheet: Sheet, opts: CadPdfOptions): void {
  const ds = opts.dimStyle ?? DEFAULT_DIM_STYLE;
  const [pw, ph] = paperSizeMm(sheet.paper, sheet.orientation);

  // P0-GIAY ① — KHUNG TÊN RA PAPER SPACE. Xem khối ghi chú "KHUNG TÊN LÀ VẬT CỦA TỜ GIẤY" ở trên:
  // để nó nằm trong ô nhìn là để nó bị cắt. Tìm một lần, vẽ ở cuối hàm, và LOẠI khỏi vòng vẽ model.
  const cacKhungTen = timCacKhungTen(doc.entities);
  const khungTen = cacKhungTen[0] ?? null;
  // Loại MỌI khối khung tên khỏi ô nhìn, không riêng khối chính: khối thừa (chèn hai lần) nằm
  // trong vùng cắt sẽ bị xén giữa chừng — mà chữ khung tên bị xén là in ra một GIÁ TRỊ SAI, đúng
  // ca P0 này. Một tờ giấy có đúng MỘT khung tên; khối thừa là rác dựng hình, cổng kiểm sẽ báo
  // cho người dùng biết chứ đường xuất không im lặng in bản cụt.
  const idKhungTen = new Set<string>();
  for (const kt of cacKhungTen) for (const id of kt.ids) idKhungTen.add(id);
  // Tỉ lệ THẬT của tờ = tỉ lệ ô nhìn LỚN NHẤT (ô chính). Sheet nhiều ô khác tỉ lệ thì ô chính là
  // con số ghi ở khung tên, đúng thông lệ hồ sơ (ô phụ ghi tỉ lệ riêng cạnh ô đó).
  const oChinh = sheet.viewports.length
    ? sheet.viewports.reduce((a, b) => (a.rectOnPaper.w * a.rectOnPaper.h >= b.rectOnPaper.w * b.rectOnPaper.h ? a : b))
    : null;
  const nhanTiLe = `1:${oChinh ? oChinh.scale : 100}`;

  /** P0-GIAY ② — CÙNG bộ hậu kỳ với `drawDocOntoPdfPage`. Đường Paper trước 05/09 KHÔNG chạy bước
   * nào trong ba bước này, nên cùng một tờ in ra vừa còn jargon nội bộ, vừa mang HAI con số tỉ lệ
   * mâu thuẫn (khung tên demo "1:100" cạnh khung tên chèn "1:47" — đo được trên PDF thật). */
  const hauKy = (entities: Entity[]): Entity[] => stripJargonFromEntities(applyRealScaleToTitleBlock(entities, nhanTiLe));

  for (const viewport of sheet.viewports) {
    const { x, y, w, h } = viewport.rectOnPaper;
    const scale = 1 / viewport.scale;
    const v: Viewport = {
      scale,
      panX: x + w / 2 - viewport.centerMm.x * scale,
      panY: y + h / 2 + viewport.centerMm.y * scale,
    };
    const viewportDoc = docForViewport(doc, viewport);
    const entities = hauKy(viewportDoc.entities).filter((e) => !idKhungTen.has(e.id));
    const pageWorldBox: Box = {
      minX: (x - v.panX) / v.scale,
      maxX: (x + w - v.panX) / v.scale,
      minY: (v.panY - (y + h)) / v.scale,
      maxY: (v.panY - y) / v.scale,
    };
    const labelShifts = planExportLabelShifts({ entities, layers: viewportDoc.layers }, ds, { scaleN: viewport.scale, pageWorldBox });
    pdf.saveGraphicsState();
    pdf.rect(x, y, w, h);
    pdf.clip();
    pdf.discardPath?.();
    for (const entity of entities) {
      const layer = viewportDoc.layers.find((candidate) => candidate.id === entity.layer);
      if (layer && !layer.visible) continue;
      drawEntityPdf(pdf, v, viewportDoc, entity, ds, labelShifts.get(entity.id));
    }
    pdf.restoreGraphicsState();
    pdf.setDrawColor('#8D8880');
    pdf.setLineWidth(0.13);
    pdf.rect(x, y, w, h);
  }

  // Khung giấy.
  pdf.setDrawColor('#555555');
  pdf.setLineWidth(0.18);
  pdf.rect(8, 8, pw - 16, ph - 16);

  if (khungTen) {
    // P0-GIAY ③ — vẽ khung tên THẬT (dữ liệu người dùng đã điền) ở góc phải-dưới, ĐÚNG 180×42mm
    // trên giấy: `viewportKhopO` khớp bao hình world của khối vào ô giấy nên cỡ in KHÔNG còn phụ
    // thuộc `k` đoán lúc chèn (trước đây in ra 90×21mm, chữ tụt còn 1,70mm — dưới sàn đọc được).
    const tbW = Math.min(TITLE_BLOCK_PAPER_W_MM, pw - 16);
    const tbH = Math.min(TITLE_BLOCK_PAPER_H_MM, ph - 16);
    const slot = { x: pw - 8 - tbW, y: ph - 8 - tbH, w: tbW, h: tbH };
    const v = viewportKhopO(khungTen.box, slot);
    // A2-04 "chữ đè hình": ô nhìn (thụt 15mm) TRÙM lên chỗ khung tên đứng, nên nét mô hình vẫn
    // chạy xuyên qua chữ khung tên — đúng ca đường trục ⑥ cắt ngang dòng tên bản vẽ trong bản nộp
    // 05/09. Khung tên là lớp TRÊN CÙNG của tờ giấy: xoá nền dưới nó trước khi vẽ, đúng thông lệ
    // khung tên đặc trên bản vẽ. Không đụng nét mô hình gốc — chỉ là thứ tự vẽ trên giấy.
    pdf.setFillColor('#FFFFFF');
    pdf.rect(slot.x, slot.y, slot.w, slot.h, 'F');
    pdf.setDrawColor('#555555');
    pdf.setLineWidth(0.18);
    for (const e of hauKy(khungTen.entities)) {
      const layer = doc.layers.find((l) => l.id === e.layer);
      if (layer && !layer.visible) continue;
      drawEntityPdf(pdf, v, doc, e, ds);
    }
  } else {
    // Chưa chèn khung tên → khối metadata tối thiểu của Sheet, hành vi cũ giữ nguyên.
    const titleW = Math.min(180, pw - 16);
    const titleH = Math.min(34, ph - 16);
    const tx = pw - 8 - titleW;
    const ty = ph - 8 - titleH;
    pdf.rect(tx, ty, titleW, titleH);
    pdf.line(tx, ty + 12, tx + titleW, ty + 12);
    pdf.line(tx + titleW - 42, ty, tx + titleW - 42, ty + titleH);
    pdf.setTextColor('#25221E');
    pdf.setFontSize(9);
    pdf.text(sheet.titleBlock.project || opts.title || 'InteriorFlow project', tx + 4, ty + 7);
    pdf.setFontSize(8);
    pdf.text(sheet.name, tx + 4, ty + 18);
    pdf.text(`Người vẽ: ${sheet.titleBlock.drawnBy || '—'}`, tx + 4, ty + 25);
    pdf.text(`Rev: ${sheet.titleBlock.revision || '—'}`, tx + 4, ty + 31);
    pdf.setFontSize(11);
    pdf.text(sheet.number || '—', tx + titleW - 38, ty + 8);
    pdf.setFontSize(7);
    pdf.text(`${sheet.paper} · ${sheet.orientation === 'portrait' ? 'Dọc' : 'Ngang'}`, tx + titleW - 38, ty + 18);
    pdf.text(`${sheet.viewports.length} ô nhìn`, tx + titleW - 38, ty + 25);
  }
}

/**
 * P4 (04/08) — dòng ghi chú cuối trang: tiêu đề · "Tờ N/M" · "Rev X" nếu caller truyền
 * `sheetIndex`/`sheetCount`/`version`. Tách THÀNH HÀM THUẦN (không phụ thuộc jsPDF) để test được
 * trực tiếp — chữ vào PDF qua font nhúng tiếng Việt (`ensureVietnameseFont`) không phải WinAnsi
 * ASCII nên KHÔNG đọc lại được từ content stream đã render (xem `pdf-print-fidelity.test.ts`),
 * test tầng chữ phải chặn Ở ĐÂY, trước khi đưa vào `pdf.text()`.
 * null khi không có gì để ghi (giữ hành vi cũ — trang KHÔNG có `opts.title` thì không vẽ dòng nào).
 */
export function pdfFooterLine(opts: CadPdfOptions): string | null {
  const parts: string[] = [];
  if (opts.title) parts.push(opts.title);
  if (opts.sheetIndex && opts.sheetCount) parts.push(`Tờ ${opts.sheetIndex}/${opts.sheetCount}`);
  if (opts.version) parts.push(`Rev ${opts.version}`);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Dựng jsPDF instance đã vẽ xong Doc (tách riêng khỏi exportCadToPdf để test được — tạo Blob/
 * ArrayBuffer kiểm tra mà không cần DOM/anchor-click, xem lib/cad/pdf.node-check.mjs khi verify).
 */
export async function buildCadPdf(doc: Doc, opts: CadPdfOptions = {}) {
  const { jsPDF } = await import('jspdf');
  // B1 (24/07) — khổ giấy: opts.paper (caller ép) > doc.paperKey (per-sheet) > A3 mặc định cũ.
  const { pw, ph, orientation } = pageFormatOf(doc, opts);
  // Khổ giấy CAD (PAPER_SIZES_MM) khai báo NGANG — [420,297] cho A3. jsPDF mặc định
  // orientation 'portrait' và khi đó nó TỰ ĐẢO format cho cạnh ngắn thành bề rộng, nên
  // `format:[420,297]` không có orientation ⇒ trang thật ra 297×420 DỌC, trong khi viewport
  // bên dưới tính theo pw=420 ⇒ mất ~30% mép phải, đúng chỗ khung tên neo. Suy orientation
  // từ chính khổ giấy để trang PDF luôn khớp [pw, ph] đã dùng để dựng viewport.
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [pw, ph] });
  // #25 — nhúng font có dấu TRƯỚC vòng vẽ entity: nhãn phòng, khung tên ("DỰ ÁN · PROJECT",
  // "Tỷ lệ 1:100"), nhãn zone… đều là tiếng Việt. Phải `await` ở đây, KHÔNG để promise trôi —
  // pdf.text() chạy trước khi font đăng ký xong thì vẫn ra helvetica/WinAnsi (mất dấu).
  await ensureVietnameseFont(pdf);
  drawDocOntoPdfPage(pdf, doc, pw, ph, opts);
  return pdf;
}

/** Xuất + tải xuống (client-only, giống exportDeckToPdf của Present). */
export async function exportCadToPdf(doc: Doc, filename = 'layout.pdf', opts: CadPdfOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const pdf = await buildCadPdf(doc, opts);
  pdf.save(filename);
}

/** Dựng một tờ Paper thật, dùng cho xem/xuất tờ đang mở. */
export async function buildPaperSheetPdf(doc: Doc, sheet: Sheet, opts: CadPdfOptions = {}) {
  const { jsPDF } = await import('jspdf');
  const [pw, ph] = paperSizeMm(sheet.paper, sheet.orientation);
  const orientation = pw >= ph ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [pw, ph] });
  await ensureVietnameseFont(pdf);
  drawPaperSheetOntoPdfPage(pdf, doc, sheet, opts);
  return pdf;
}

export async function exportPaperSheetPdf(doc: Doc, sheet: Sheet, filename = 'layout.pdf', opts: CadPdfOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const pdf = await buildPaperSheetPdf(doc, sheet, opts);
  pdf.save(filename);
}

/** 1 tờ trong bộ hồ sơ — id/name khớp hình hài `sheets[]` của `CadSheets.tsx` (không import
 * type từ đó để tránh vòng lặp 'use client' → module thuần này chỉ cần 3 field). */
export interface SheetSetEntry {
  id: string;
  name: string;
  doc: Doc;
  /** Có metadata Paper ⇒ xuất đúng layout nhiều ô nhìn; thiếu ⇒ tương thích bộ Doc kiểu cũ. */
  paperSheet?: Sheet;
}

/**
 * 2.1.8.k — Xuất BỘ HỒ SƠ nhiều tờ thành 1 PDF: trang 1 = MỤC LỤC (số tờ · tên tờ · khổ · tỉ lệ),
 * các trang sau mỗi tờ 1 trang, TÔN TRỌNG paperKey/printScale RIÊNG từng tờ (không ép chung 1
 * khổ — dùng lại NGUYÊN VẸN `drawDocOntoPdfPage`, mỗi trang `addPage([pw,ph], orientation)` với
 * khổ của ĐÚNG tờ đó, xem lib/cad/pdf.ts đầu file `pageFormatOf`). Bookmark PDF (`pdf.outline.add`,
 * plugin `jsPDF-AutoTable`… KHÔNG — đây là "Outline PlugIn" lõi của jsPDF, đã có sẵn, không thêm
 * dependency) theo tên tờ, trỏ đúng trang — mở trong Preview/Acrobat thấy khung điều hướng bên trái.
 *
 * DPI (Luật #9 ≥300dpi): hàm này KHÔNG raster hoá gì — dùng lại `drawEntityPdf` (line/rect/text
 * vẽ bằng API hình học jsPDF, xem đầu file lib/cad/pdf.ts), không có `addImage()` nào trong toàn
 * bộ file (đã grep xác nhận). PDF vector không có trần dpi — in ở bất kỳ độ phân giải máy in nào
 * cũng sắc nét tuyệt đối, khác PNG/board composite (Luật #9 áp cho export RASTER, xem
 * docs/LUAT-300DPI-2026-07-29.md). Vì vậy không có nhánh "báo dpi thật" ở đây — không phải bỏ sót,
 * là vì luật này vô nghĩa với vector (không có dpi để đo).
 */
export async function buildSheetSetPdf(sheets: SheetSetEntry[], opts: CadPdfOptions = {}) {
  const { jsPDF } = await import('jspdf');
  // Trang mục lục: A4 dọc (giống lib/cad/standards-report.ts) — nội dung chỉ là bảng chữ, không
  // cần khớp khổ giấy của bất kỳ tờ nào (mục lục không phải bản vẽ kỹ thuật).
  const TOC_PW = 210;
  const TOC_PH = 297;
  const margin = opts.margin ?? DEFAULT_PDF_MARGIN_MM;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [TOC_PW, TOC_PH] });
  // 1 lần cho CẢ instance — jsPDF giữ font hiện hành qua addPage(). Giữ lại tên font (FONT) để
  // gọi setFont(FONT, 'bold'/'normal') tường minh ở bảng mục lục — setFont(undefined, ...) không
  // hợp lệ với type jsPDF (không phải "giữ nguyên font hiện tại" như CSS font-weight).
  const FONT = await ensureVietnameseFont(pdf);

  pdf.outline.add(null, opts.title ?? 'Mục lục', { pageNumber: 1 });

  pdf.setFontSize(16);
  pdf.setTextColor('#1E1B16');
  pdf.text(opts.title ?? 'Bộ hồ sơ bản vẽ · Drawing Set', margin, margin + 4);
  pdf.setFontSize(9);
  pdf.setTextColor('#888888');
  pdf.text(`${sheets.length} tờ · Mục lục · Table of Contents`, margin, margin + 11);

  let y = margin + 22;
  pdf.setFontSize(10);
  pdf.setTextColor('#1E1B16');
  const colNo = margin;
  const colName = margin + 14;
  const colPaper = margin + 120;
  const colScale = margin + 155;
  pdf.setFont(FONT, 'bold');
  pdf.text('Số tờ', colNo, y);
  pdf.text('Tên tờ · Sheet name', colName, y);
  pdf.text('Khổ', colPaper, y);
  pdf.text('Tỉ lệ', colScale, y);
  y += 3;
  pdf.setDrawColor('#C9C2B4');
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, TOC_PW - margin, y);
  y += 6;
  pdf.setFont(FONT, 'normal');

  // VIỆC 1 — mục lục phải in CÙNG con số tỉ lệ với trang thật (một nguồn: resolveExportScaleN).
  const scaleLabelOf = (doc: Doc, pw: number, ph: number) => {
    const m = opts.margin ?? DEFAULT_PDF_MARGIN_MM;
    const n = resolveExportScaleN(doc, pw, ph, m);
    return n !== null ? `1:${n}` : fitScaleLabel(docBox(doc), [pw, ph], m);
  };

  sheets.forEach((s, i) => {
    const [pw, ph] = s.paperSheet ? paperSizeMm(s.paperSheet.paper, s.paperSheet.orientation) : [pageFormatOf(s.doc, opts).pw, pageFormatOf(s.doc, opts).ph];
    pdf.text(String(i + 1), colNo, y);
    pdf.text(s.name, colName, y);
    pdf.text(s.paperSheet ? `${s.paperSheet.paper} · ${s.paperSheet.orientation === 'portrait' ? 'Dọc' : 'Ngang'}` : paperKeyOrientationLabel(s.doc), colPaper, y);
    pdf.text(s.paperSheet ? s.paperSheet.viewports.map((viewport) => `1:${viewport.scale}`).join(' · ') : scaleLabelOf(s.doc, pw, ph), colScale, y);
    y += 7;
  });

  // Mỗi tờ 1 trang, khổ giấy RIÊNG của tờ đó (không ép chung 1 khổ như brief yêu cầu) — trang
  // mục lục là trang 1, tờ thứ i là trang i+1 (outline.add pageNumber phải khớp thứ tự này).
  sheets.forEach((s, i) => {
    const page = pageFormatOf(s.doc, opts);
    const [pw, ph] = s.paperSheet ? paperSizeMm(s.paperSheet.paper, s.paperSheet.orientation) : [page.pw, page.ph];
    const orientation = pw >= ph ? 'landscape' : 'portrait';
    pdf.addPage([pw, ph], orientation);
    // P4 (04/08) — "số tờ" khung tên: bộ hồ sơ BIẾT thứ tự/tổng số tờ thật (sheets[]), tự điền
    // sheetIndex/sheetCount cho MỖI trang — caller không cần tự đếm, không lệch với mục lục ở trên.
    if (s.paperSheet) drawPaperSheetOntoPdfPage(pdf, s.doc, s.paperSheet, { ...opts, title: s.name, sheetIndex: i + 1, sheetCount: sheets.length });
    else drawDocOntoPdfPage(pdf, s.doc, pw, ph, { ...opts, title: s.name, sheetIndex: i + 1, sheetCount: sheets.length });
    pdf.outline.add(null, s.name, { pageNumber: i + 2 });
  });

  return pdf;
}

/** Xuất + tải xuống bộ hồ sơ nhiều tờ (client-only, cùng pattern exportCadToPdf ở trên). */
export async function exportSheetSetPdf(
  sheets: SheetSetEntry[],
  filename = 'drawing-set.pdf',
  opts: CadPdfOptions = {},
): Promise<void> {
  if (typeof window === 'undefined') return;
  const pdf = await buildSheetSetPdf(sheets, opts);
  pdf.save(filename);
}
