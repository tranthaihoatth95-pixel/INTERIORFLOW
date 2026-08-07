/**
 * lib/print/export-checks.ts — danh sách kiểm "TRƯỚC KHI XUẤT" của Màn 7 (`ExportPdfDialog`).
 *
 * Mock `HopXuatPDF.dc.html` vẽ 5 dòng kiểm CỐ ĐỊNH (PURGE · gốc toạ độ · layer/màu · VP chưa khoá ·
 * cỡ chữ theo tỉ lệ). Ở đây mỗi dòng phải ĐỌC TỪ `Doc` THẬT — dòng kiểm bịa sẵn "✓ đã chạy" còn
 * tệ hơn không có, vì nó bảo người dùng yên tâm về thứ chưa ai kiểm.
 *
 * Chỗ nào CHƯA đo được thì KHÔNG sinh dòng (xem ghi chú từng mục), đúng §9: ô trống là bằng chứng
 * còn việc, không phải chỗ để lấp cho đẹp.
 *
 * Hàm thuần, không DOM — `export-checks.test.ts` chạy thẳng.
 */

import type { Doc, PaperKey, PaperOrientation } from '../cad/model';
import { docBox, paperSizeMm, fitsAtScale, suggestStandardScale } from '../cad/model';
import { DEFAULT_PDF_MARGIN_MM, MIN_PRINTABLE_LINE_MM } from '../cad/pdf';

export interface ExportCheckItem {
  label: string;
  ok: boolean;
}

/** Bề dày mặc định khi layer chưa khai — khớp chú thích `Layer.lineweight` trong `lib/cad/model.ts`. */
const DEFAULT_LAYER_LINEWEIGHT_MM = 0.25;

/**
 * Ngưỡng "xa gốc toạ độ" (mm) = 50m. Bản vẽ nội thất thật hiếm khi rộng quá vài chục mét; nằm xa
 * hơn thế gần như luôn là do dán từ file khác vào mà quên đưa về 0,0 — đúng lỗi mà dòng kiểm
 * "Về gốc toạ độ 0,0" của mock muốn bắt.
 */
const FAR_FROM_ORIGIN_MM = 50_000;

export function buildExportChecks(doc: Doc, paper: PaperKey, orientation: PaperOrientation): ExportCheckItem[] {
  const items: ExportCheckItem[] = [];
  const entities = doc.entities ?? [];
  const layers = doc.layers ?? [];

  // ① Có gì để xuất không — dòng đầu tiên, vì mọi dòng sau vô nghĩa nếu bản vẽ trống.
  items.push(
    entities.length > 0
      ? { label: `Bản vẽ có ${entities.length} nét`, ok: true }
      : { label: 'Bản vẽ trống — chưa có gì để xuất', ok: false },
  );

  // ② Tỉ lệ in có lọt khổ giấy đang chọn không — dùng ĐÚNG `fitsAtScale`/`suggestStandardScale`
  //    mà `lib/cad/pdf.ts` dùng lúc plot, nên con số ở đây và trong file PDF luôn khớp.
  const box = docBox(doc);
  const paperMm = paperSizeMm(paper, orientation);
  const huong = orientation === 'landscape' ? 'ngang' : 'dọc';
  if (!doc.printScale) {
    items.push({ label: `Tỉ lệ tự động vừa khổ ${paper} ${huong}`, ok: true });
  } else if (fitsAtScale(box, paperMm, DEFAULT_PDF_MARGIN_MM, doc.printScale)) {
    items.push({ label: `Tỉ lệ 1:${doc.printScale} lọt khổ ${paper} ${huong}`, ok: true });
  } else {
    const goiY = suggestStandardScale(box, paperMm, DEFAULT_PDF_MARGIN_MM);
    items.push({ label: `1:${doc.printScale} không lọt khổ ${paper} ${huong} — thử 1:${goiY}`, ok: false });
  }

  // ③ PURGE: layer không có nét nào. Đếm thật theo `Entity.layer` (id layer), không đoán theo tên.
  const layerDung = new Set(entities.map((e) => e.layer));
  const thua = layers.filter((l) => !layerDung.has(l.id));
  items.push(
    thua.length === 0
      ? { label: 'Không có layer thừa', ok: true }
      : { label: `${thua.length} layer không có nét nào — nên dọn (PURGE)`, ok: false },
  );

  // ④ Nét mảnh hơn sàn in được: dưới `MIN_PRINTABLE_LINE_MM` là máy in phổ thông ăn mất nét.
  //    Tính bề dày HIỆU DỤNG: entity tự khai thì theo entity, không thì theo layer của nó.
  const lwTheoLayer = new Map(layers.map((l) => [l.id, l.lineweight ?? DEFAULT_LAYER_LINEWEIGHT_MM]));
  const mongQua = entities.filter((e) => {
    const mm = e.lineweight ?? lwTheoLayer.get(e.layer) ?? DEFAULT_LAYER_LINEWEIGHT_MM;
    return mm < MIN_PRINTABLE_LINE_MM;
  });
  items.push(
    mongQua.length === 0
      ? { label: `Mọi nét dày ≥ ${MIN_PRINTABLE_LINE_MM}mm — in ra thấy được`, ok: true }
      : { label: `${mongQua.length} nét mảnh hơn ${MIN_PRINTABLE_LINE_MM}mm — in ra có thể mất`, ok: false },
  );

  // ⑤ Gốc toạ độ 0,0 — chỉ nói khi ĐO ĐƯỢC (bản vẽ trống thì `docBox` = null, bỏ dòng này thay vì
  //    khẳng định bừa "đã về gốc").
  if (box) {
    const xa = Math.max(Math.abs(box.minX), Math.abs(box.minY));
    items.push(
      xa <= FAR_FROM_ORIGIN_MM
        ? { label: 'Bản vẽ nằm quanh gốc toạ độ 0,0', ok: true }
        : { label: `Bản vẽ cách gốc 0,0 tới ${Math.round(xa / 1000)}m — nên đưa về gần gốc`, ok: false },
    );
  }

  return items;
}
