/**
 * lib/cad/sheet-migrate.ts — NC-13 (`docs/nc/NC-13-multisheet-autodesk-2026-08-03.md` §4) BƯỚC 2:
 * bộ chuyển MỘT CHIỀU từ mô hình sheet CŨ (mỗi sheet = 1 `Doc` độc lập, `IdfSheetData` ở `idf.ts`)
 * sang mô hình ĐÍCH (MỘT `Doc` chung, đúng luật K1, + 1 `Sheet`/`Viewport2D` — `model.ts`, BƯỚC 1).
 *
 * Nơi gọi thật: `CadSheets.tsx` (D1 đợt 8 — gộp bản ghi/.idf CŨ nhiều Doc về 1 Doc chung lúc
 * nạp). `MAX_SHEETS` cũng đã gỡ (D2, 04/08). Còn lại bump `IDF_VERSION` + tách N sheet theo
 * offset Q1 khi mở file cũ = D3, HOÃN chờ studio thật dùng thử (quyết định Hoà 04/08).
 *
 * THUẦN (không React/DOM) — chạy test bằng `node_modules/.bin/sucrase-node
 * lib/cad/sheet-migrate.test.ts`, giống `dxf.roundtrip.test.ts`.
 *
 * Thuật toán "dịch offset để không chồng nhau": xếp các sheet cũ THÀNH MỘT HÀNG NGANG theo đúng
 * thứ tự mảng đầu vào — sheet sau đặt ngay bên phải sheet trước (đúng biên bbox + khoảng cách
 * `SHEET_GAP_MM`), mọi sheet neo cạnh DƯỚI vào y=0. Đơn giản, tất định (deterministic — cùng đầu
 * vào luôn ra cùng đầu ra, test được), không cần thuật toán đóng gói 2D phức tạp — đủ cho mục
 * tiêu BƯỚC 2 là BẢO TOÀN dữ liệu, không phải bố cục đẹp (bố cục thật là việc UI của BƯỚC 3+).
 *
 * ID entity/markup/photo được ĐỔI TÊN có tiền tố theo CHỈ SỐ sheet (`s{i}-...`) — KHÔNG dùng
 * nguyên id cũ: `newId()` (store.ts) chỉ đảm bảo duy nhất TRONG một phiên làm việc (bộ đếm module-
 * level + 4 ký tự ngẫu nhiên), hai sheet tạo ở hai phiên/lần tải trang khác nhau HOÀN TOÀN có thể
 * trùng id — gộp thẳng sẽ ghi đè nhầm entity. Đổi tên có tiền tố loại bỏ khả năng đó bằng cấu trúc,
 * không dựa vào may rủi thống kê. `BuildOp.withRef` (NC-12 boolean) được ánh xạ lại theo ĐÚNG bảng
 * đổi tên của sheet đó (tham chiếu chỉ có nghĩa trong cùng 1 Doc gốc, không xuyên sheet).
 */
import type { Doc, Entity, Layer, Level, MarkupPin, PhotoEmbed, Sheet, SiteImage, Viewport2D, WallType } from './model';
import { docBox, defaultPaperOrientation, paperSizeMm, type PaperKey } from './model';
import { translateEntity, translatePt } from './geometry';
import { newId } from './id';
import type { IdfSheetData } from './idf';

/** khoảng trống mm giữa 2 sheet liền kề khi xếp hàng ngang — đủ rộng để không ai nhầm 2 sheet
 * dính làm một khi nhìn merged Doc (không phải con số kỹ thuật, chỉ cần > 0 và dễ nhận ra bằng mắt). */
export const SHEET_GAP_MM = 2000;

/** viền trắng quanh viewport trên giấy (mm giấy), tránh viewport chạm sát mép khổ. */
const VIEWPORT_MARGIN_MM = 15;

export interface MergeSheetsOptions {
  /** tên Sheet mới sinh ra. Mặc định 'Bản vẽ gộp'. */
  sheetName?: string;
  /** số hiệu tờ (khung tên). Mặc định 'A-01'. */
  sheetNumber?: string;
  /** khổ giấy Sheet mới. Mặc định 'A3' — KHÔNG tự chọn khổ theo kích thước nội dung (đó là việc
   * UI bước sau); viewport ở bước này chỉ đảm bảo dữ liệu đúng, không đảm bảo "vừa khổ giấy". */
  paper?: PaperKey;
  /** tỉ lệ in N của "1:N" cho viewport duy nhất. Mặc định 100 — ĐÚNG yêu cầu BƯỚC 2 ("sinh 1
   * viewport tỉ lệ 1:100"), tham số hoá để test/gọi lại linh hoạt hơn thay vì hard-code rải rác. */
  scale?: number;
}

export interface MergeSheetsResult {
  doc: Doc;
  sheet: Sheet;
}

function prefixMarkup(m: MarkupPin, prefix: string, dx: number, dy: number): MarkupPin {
  return { ...m, id: `${prefix}-${m.id}`, at: translatePt(m.at, dx, dy) };
}

function prefixPhoto(p: PhotoEmbed, prefix: string, dx: number, dy: number): PhotoEmbed {
  return { ...p, id: `${prefix}-${p.id}`, at: translatePt(p.at, dx, dy) };
}

function translateSiteImage(s: SiteImage, dx: number, dy: number): SiteImage {
  return { ...s, x: s.x + dx, y: s.y + dy };
}

/**
 * Gộp N sheet cũ (mỗi sheet = 1 `Doc` độc lập) thành 1 `Doc` chung + 1 `Sheet` (1 `Viewport2D`
 * soi toàn bộ nội dung gộp, tỉ lệ 1:100 mặc định). MỘT CHIỀU — không có hàm ngược (chưa cần tới,
 * BƯỚC 5 mới quyết định `.idf` cũ có giữ được bằng cách nào khác không).
 *
 * Bảo toàn: MỌI entity/markup/photo của MỌI sheet đều có mặt trong `doc` kết quả (đếm được bằng
 * `sheets.flatMap(s=>s.doc.entities).length === result.doc.entities.length`) — không rơi rớt,
 * không đè lẫn nhau (dịch offset theo bbox thật của từng sheet).
 */
export function mergeIdfSheetsToDoc(sheets: IdfSheetData[], opts: MergeSheetsOptions = {}): MergeSheetsResult {
  const mergedEntities: Entity[] = [];
  const mergedMarkups: MarkupPin[] = [];
  const mergedPhotos: PhotoEmbed[] = [];
  const layerById = new Map<string, Layer>();
  // VIỆC 1+3 (05/08) — `Doc.levels`/`Doc.wallTypes` gộp theo ĐÚNG khuôn `layerById` phía trên:
  // dedupe theo `id`, sheet ĐẦU TIÊN thắng, **KHÔNG đổi tên có tiền tố**. Cố ý khác cách xử lý
  // entity/markup/photo (bị prefix `s{i}-`) vì đây là DANH MỤC DÙNG CHUNG, không phải nội dung
  // riêng của tờ: 2 tờ cùng nhãn tầng 'Trệt' phải ra ĐÚNG MỘT tầng sau khi gộp, y như 2 tờ cùng
  // layer 'Tường' ra đúng một layer (`e.layer` cũng không hề bị đổi tên).
  // ⚠️ THIẾU BƯỚC NÀY = MẤT DỮ LIỆU THẬT: từ khi bump `.idf` v2, migration sinh `levels` + gắn
  // `levelId` lên entity; gộp mà bỏ rơi `levels` thì mọi `levelId` thành THAM CHIẾU MỒ CÔI
  // (`computeHeights` sẽ trả `danglingLevelIds`) — cấu kiện rụng hết cao độ tầng.
  const levelById = new Map<string, Level>();
  const wallTypeById = new Map<string, WallType>();
  let mergedSiteImage: SiteImage | undefined;

  let cursorX = 0;
  sheets.forEach((sheetData, i) => {
    const doc = sheetData.doc;
    const box = docBox(doc);
    const dx = cursorX - (box?.minX ?? 0);
    const dy = 0 - (box?.minY ?? 0);
    const prefix = `s${i}`;

    const idMap = new Map<string, string>();
    for (const e of doc.entities) idMap.set(e.id, `${prefix}-${e.id}`);

    for (const e of doc.entities) {
      const moved = translateEntity(e, dx, dy);
      const renamed: Entity = { ...moved, id: idMap.get(e.id)! };
      if (renamed.ops) {
        renamed.ops = renamed.ops.map((op) =>
          op.op === 'boolean' ? { ...op, withRef: idMap.get(op.withRef) ?? op.withRef } : op,
        );
      }
      mergedEntities.push(renamed);
    }

    for (const l of doc.layers) if (!layerById.has(l.id)) layerById.set(l.id, { ...l });
    for (const lv of doc.levels ?? []) if (!levelById.has(lv.id)) levelById.set(lv.id, { ...lv });
    for (const wt of doc.wallTypes ?? []) if (!wallTypeById.has(wt.id)) wallTypeById.set(wt.id, { ...wt });

    for (const m of doc.markups ?? []) mergedMarkups.push(prefixMarkup(m, prefix, dx, dy));
    for (const p of doc.photos ?? []) mergedPhotos.push(prefixPhoto(p, prefix, dx, dy));
    // Doc chỉ có 1 slot `siteImage` — nếu nhiều sheet cùng có ảnh nền thì CHỈ sheet ĐẦU TIÊN có
    // ảnh được giữ (không có chỗ nào khác trong model để chứa ảnh thứ 2 trở đi). Giới hạn CÓ THẬT
    // của cấu trúc dữ liệu hiện tại, không phải sơ suất — ghi rõ ở đây theo luật N4 (SO-KIEM-TONG
    // §6c: "chỗ nào chưa có dữ liệu nguồn thì ghi lý do tại chỗ, đừng gán bừa cho đủ").
    if (!mergedSiteImage && doc.siteImage) mergedSiteImage = translateSiteImage(doc.siteImage, dx, dy);

    const width = box ? box.maxX - box.minX : 0;
    cursorX += width + SHEET_GAP_MM;
  });

  // `order` đánh LẠI 0..n-1 sau khi gộp: mỗi Doc gốc tự đánh từ 0 nên gộp thẳng sẽ đụng số
  // (2 tờ đều có tầng `order:0`). Xếp theo (order cũ, cao độ) rồi đánh lại — giữ đúng ý đồ thứ tự
  // của từng tờ, chỉ bỏ chỗ đụng. KHÔNG đụng `elevationMm` (số thật, không được bịa lại).
  const mergedLevels = Array.from(levelById.values())
    .sort((a, b) => a.order - b.order || a.elevationMm - b.elevationMm)
    .map((lv, i) => ({ ...lv, order: i }));

  const mergedWallTypes = Array.from(wallTypeById.values());

  const doc: Doc = {
    entities: mergedEntities,
    layers: Array.from(layerById.values()),
    ...(mergedMarkups.length ? { markups: mergedMarkups } : {}),
    ...(mergedPhotos.length ? { photos: mergedPhotos } : {}),
    ...(mergedSiteImage ? { siteImage: mergedSiteImage } : {}),
    ...(mergedLevels.length ? { levels: mergedLevels } : {}),
    ...(mergedWallTypes.length ? { wallTypes: mergedWallTypes } : {}),
  };

  const mergedBox = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const paper = opts.paper ?? 'A3';
  const orientation = defaultPaperOrientation(paper);
  const [paperW, paperH] = paperSizeMm(paper, orientation);
  const scale = opts.scale ?? 100;

  const viewport: Viewport2D = {
    id: newId('vp'),
    rectOnPaper: {
      x: VIEWPORT_MARGIN_MM,
      y: VIEWPORT_MARGIN_MM,
      w: paperW - VIEWPORT_MARGIN_MM * 2,
      h: paperH - VIEWPORT_MARGIN_MM * 2,
    },
    centerMm: { x: (mergedBox.minX + mergedBox.maxX) / 2, y: (mergedBox.minY + mergedBox.maxY) / 2 },
    scale,
    locked: false,
  };

  const sheet: Sheet = {
    id: newId('sheet'),
    name: opts.sheetName ?? 'Bản vẽ gộp',
    number: opts.sheetNumber ?? 'A-01',
    paper,
    orientation,
    titleBlock: { project: '', drawnBy: '', date: '', revision: '' },
    viewports: [viewport],
  };

  return { doc, sheet };
}
