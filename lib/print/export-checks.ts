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
import { docBox, paperSizeMm, fitsAtScale, suggestStandardScale, isStandardPrintScale, snapPrintScale } from '../cad/model';
import { DEFAULT_PDF_MARGIN_MM, MIN_PRINTABLE_LINE_MM, resolveExportScaleN, timCacKhungTen } from '../cad/pdf';
import { TITLE_BLOCK_REQUIRED_CELLS } from '../cad/commands';
import { countUnresolvedLabelCollisions } from '../cad/label-placer';

export interface ExportCheckItem {
  label: string;
  ok: boolean;
  /** CHUAN_DAU_RA — 'error' chặn/đỏ, 'warn' cảnh báo. Thiếu = dòng kiểm cũ (hiện như trước). */
  level?: 'error' | 'warn';
  /** cách sửa ngắn gọn — hiện dòng phụ dưới thông điệp. */
  fix?: string;
}

/** Bề dày mặc định khi layer chưa khai — khớp chú thích `Layer.lineweight` trong `lib/cad/model.ts`. */
const DEFAULT_LAYER_LINEWEIGHT_MM = 0.25;

/**
 * Ngưỡng "xa gốc toạ độ" (mm) = 50m. Bản vẽ nội thất thật hiếm khi rộng quá vài chục mét; nằm xa
 * hơn thế gần như luôn là do dán từ file khác vào mà quên đưa về 0,0 — đúng lỗi mà dòng kiểm
 * "Về gốc toạ độ 0,0" của mock muốn bắt.
 */
const FAR_FROM_ORIGIN_MM = 50_000;

export function buildExportChecks(
  doc: Doc,
  paper: PaperKey,
  orientation: PaperOrientation,
  /** P0-GIAY — tỉ lệ ô nhìn chính của tờ Paper sắp in (`Sheet.viewports[].scale`). Truyền vào thì
   * cổng kiểm ĐÚNG con số tờ đó in ra; bỏ trống = suy từ Doc như cũ. Nơi gọi có `Sheet` trong tay
   * (`components/cad/CadSheets.tsx`) nên truyền — xem ①b bên dưới. */
  tiLeInThat?: number,
): ExportCheckItem[] {
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

  // ⑥ VIỆC 4 — bộ kiểm CHUAN_DAU_RA nối thẳng vào danh sách (CadSheets đã truyền items này cho
  //    ExportPdfDialog, không cần dây mới). Sạch cả bộ thì báo 1 dòng ✓ để người xuất biết bộ
  //    kiểm CÓ chạy (khác với "không kiểm gì").
  const chuan = buildChuanDauRaChecks(doc, paper, orientation, tiLeInThat);
  if (chuan.length === 0) {
    items.push({ label: 'Đạt chuẩn đầu ra: tỷ lệ · khung tên · nhãn', ok: true });
  } else {
    for (const c of chuan) items.push({ label: c.message, ok: false, level: c.level, fix: c.fix });
  }

  return items;
}

/* ───────────── VIỆC 4 `chuan-dau-ra-gate` — bộ kiểm CHUAN_DAU_RA (marker) ─────────────
 * docs/CHUAN-DAU-RA-NGHE.md §6 tầng 1 "máy chặn lúc xuất". Mỗi phát hiện: mức + thông điệp
 * ≤12 từ + cách sửa. Trả [] khi sạch. */

export interface ChuanDauRaFinding {
  level: 'error' | 'warn';
  /** thông điệp ≤12 từ (SPEC-NGON-NGU-CHI-DAN: hành động trước, không jargon nội bộ). */
  message: string;
  /** cách sửa — luôn kèm việc làm được ngay, không chỉ chê. */
  fix: string;
}

/** Marker bộ kiểm — CHUAN-DAU-RA-NGHE.md §6 yêu cầu code mang mã này để registry soi được. */
export const CHUAN_DAU_RA = 'CHUAN_DAU_RA';

/** DimStyle mặc định cho bước đếm nhãn — khớp DEFAULT_DIM_STYLE của pdf.ts (không export bên đó,
 * bản sao 3 số này là hợp đồng đã tài liệu hoá ở render.ts/pdf.ts). */
const GATE_DIM_STYLE = { textHeight: 120, dimScale: 1 };

export function buildChuanDauRaChecks(
  doc: Doc,
  paper: PaperKey,
  orientation: PaperOrientation,
  /** P0-GIAY — tỉ lệ tờ giấy THẬT sẽ in (ô nhìn chính của Sheet). Bỏ trống = suy từ Doc như cũ. */
  tiLeInThat?: number,
): ChuanDauRaFinding[] {
  const findings: ChuanDauRaFinding[] = [];
  const entities = doc.entities ?? [];
  if (!entities.length) return findings; // bản vẽ trống — dòng ① của buildExportChecks đã báo

  // ① Tỷ lệ in phải thuộc dãy chuẩn — đọc CÙNG nguồn số với file xuất thật (resolveExportScaleN).
  const [pw, ph] = paperSizeMm(paper, orientation);
  const n = tiLeInThat ?? resolveExportScaleN(doc, pw, ph, DEFAULT_PDF_MARGIN_MM);
  if (n === null) {
    findings.push({
      level: 'error',
      message: 'Bản vẽ quá lớn, không nấc tỷ lệ chuẩn nào lọt giấy',
      fix: 'Chọn khổ giấy lớn hơn hoặc tách bản vẽ thành nhiều tờ',
    });
  } else if (!isStandardPrintScale(n)) {
    findings.push({
      level: 'error',
      message: `Tỷ lệ 1:${n} không thuộc dãy chuẩn`,
      fix: `Đổi tỷ lệ in về 1:${snapPrintScale(n)}`,
    });
  }

  // ①b P0-GIAY (05/09) — VÌ SAO ① NAY MỚI ĐỎ ĐƯỢC, ghi lại để đừng ai "tối ưu" nó về như cũ:
  //
  // 🔴 Trước 05/09 mục ① gọi `resolveExportScaleN()` — mà hàm đó ĐÃ tự bắt về nấc chuẩn rồi mới
  // trả về ⇒ `isStandardPrintScale(n)` gần như LUÔN đúng ⇒ cổng **không thể** đỏ trên nhánh
  // "Vừa khổ". Cùng lúc, con số THẬT đi ra giấy lại đến từ `docScaleLabel()` (auto-fit THÔ) nên
  // giấy ghi **"Tỷ lệ 1:47"** trong khi cổng vẫn tick xanh *"Đạt chuẩn đầu ra: tỷ lệ"*. Cổng gật
  // cho đúng thứ nó sinh ra để chặn — vì nó kiểm MỘT con số khác với con số in ra.
  //
  // Cách chữa KHÔNG phải thêm một mục kiểm thứ hai (thế là ba con số), mà là **gộp về một**:
  //   · `model.ts:resolveDocPrintScaleN` nay là phép tính DUY NHẤT — màn hình, chữ bake vào khung
  //     tên, viewport lúc xuất và cổng này đọc chung nó ⇒ số cổng kiểm CHÍNH LÀ số in ra giấy;
  //   · `tiLeInThat` bịt lỗ cuối: tờ Paper in theo `Viewport2D.scale` của Sheet — một con số thứ
  //     ba mà trước nay KHÔNG mục kiểm nào chạm tới. Caller có Sheet thì truyền vào, tờ 1:47 đỏ.
  //
  // ⇒ Luật rút ra, áp cho mọi cổng về sau: **kiểm thứ ĐI RA FILE, đừng kiểm thứ mình vừa tính lại.**
  // Cố ý KHÔNG đối chiếu thêm chuỗi đã bake trong entity với `n`: đường xuất chạy
  // `applyRealScaleToTitleBlock()` ghi đè ô tỉ lệ ngay trước khi vẽ, nên chuỗi bake cũ KHÔNG bao
  // giờ tới được giấy — báo nó là báo động giả về một thứ người dùng không sửa được.

  // ② Khung tên đủ 9 ô bắt buộc — nhận diện caption trong text entity (khung tên đã bake).
  const texts = entities.filter((e) => e.type === 'text').map((e) => (e as { text: string }).text.trim());
  const missing = TITLE_BLOCK_REQUIRED_CELLS.filter((cell) => !texts.some((t) => cell.test(t)));
  if (missing.length === TITLE_BLOCK_REQUIRED_CELLS.length) {
    findings.push({
      level: 'error',
      message: 'Bản vẽ chưa có khung tên',
      fix: 'Chèn khung tên từ bảng Khung tên rồi điền đủ ô',
    });
  } else if (missing.length > 0) {
    findings.push({
      level: 'error',
      message: `Khung tên thiếu ${missing.length} ô bắt buộc`,
      fix: `Bổ sung: ${missing.map((m) => m.label).join(' · ')}`,
    });
  }

  // ②b P0-GIAY — MỘT TỜ CHỈ CÓ MỘT KHUNG TÊN. Bấm "Chèn khung tên" hai lần là ra hai khối, khối
  // thứ hai nằm xa hơn về bên phải (`box.maxX` đã nở) nên rơi ra ngoài vùng cắt của ô nhìn và bị
  // xén giữa chừng — in ra "1:5" của một tờ 1:50. Đường xuất nay chỉ dựng khối LỚN NHẤT lên giấy
  // và bỏ khối thừa khỏi ô nhìn; báo ở đây để việc bỏ đó KHÔNG im lặng.
  const soKhungTen = timCacKhungTen(entities).length;
  if (soKhungTen > 1) {
    findings.push({
      level: 'warn',
      message: `Bản vẽ có ${soKhungTen} khung tên — tờ in chỉ dùng khối lớn nhất`,
      fix: 'Xoá khung tên thừa trong bản vẽ để giữ đúng một khối',
    });
  }

  // ③ Nhãn còn đè nhau/đè hình SAU khi máy đã né (label-placer) — cảnh báo, không chặn.
  const con = countUnresolvedLabelCollisions({ entities, layers: doc.layers ?? [] }, GATE_DIM_STYLE);
  if (con > 0) {
    findings.push({
      level: 'warn',
      message: `${con} nhãn còn đè lên hình hoặc nhãn khác`,
      fix: 'Dời nhãn bằng tay hoặc rút gọn chữ',
    });
  }

  return findings;
}
