/**
 * lib/ffe/sheet.ts — HỒ SƠ FF&E NHIỀU MÓN (G-M3-04, 06/08). Hàm THUẦN: `FfeItem[]` → bảng hồ sơ
 * chuẩn ngành, gộp theo PHÒNG, xuất được ra .xlsx CÓ ẢNH.
 *
 * Vì sao có file này (`docs/GAP-IF.md` G-M3-04): hồ sơ FF&E của IF hiện dừng ở mức **1 món = 1 tấm
 * JPG** (`lib/render-studio/measurement-spec-sheet.ts` — `grep -n "^export"` cho đúng 1 hàm
 * `exportMeasurementSpecSheet`, dựng 1 ảnh cho MỘT món). Thứ studio thật gửi xưởng/khách là BẢNG
 * NHIỀU MÓN: mã · ảnh · tên · quy cách · vật liệu-hoàn thiện · nhà cung cấp · đơn giá · số lượng ·
 * đơn vị · thành tiền · **ô duyệt trước sản xuất**. Không có nó thì mỗi hồ sơ phải dán tay trong
 * Excel — chỗ số liệu lệch khỏi mô hình bắt đầu.
 *
 * Ranh giới (N7 — đã có thì NỐI, không dựng lại):
 *  - Kiểu dữ liệu món: `./item` (`FfeItem`, `groupByRoom`, `ffeLineAmount`, `isCountUnit`,
 *    `normalizeQty`) — file này KHÔNG khai lại field nào của món.
 *  - Máy dựng .xlsx: `../boq/xlsx` `buildXlsxBuffer` (tầng ① tách ra đúng cho việc này) — KHÔNG
 *    viết OOXML lần thứ hai.
 *  - Nhãn phòng trống dùng ĐÚNG chữ của bảng BOQ ('Chưa gán phòng', `lib/present-editor/
 *    boq-group.ts` `NO_ROOM_LABEL`) — khai lại hằng ở đây thay vì import vì `lib/ffe/` không được
 *    phụ thuộc ngược vào `lib/present-editor/` (tầng UI của một chặng); có test khoá chữ.
 *
 * THUẦN: không React/DOM/Prisma/fetch — chạy được bằng sucrase-node, import TƯƠNG ĐỐI.
 */

import {
  type FfeItem,
  ffeLineAmount,
  groupByRoom,
  isCountUnit,
  normalizeQty,
} from './item';
import { ffeAssurance, type SpecVerifiedMap } from './assurance';
import { isVerifiedQuantity, type AssuranceGrade } from '../distill/assurance';
import {
  buildXlsxBuffer,
  STYLE,
  type XlsxCell,
  type XlsxImage,
  type XlsxRow,
} from '../boq/xlsx';

/** Nhãn nhóm cho món CHƯA khai phòng — HIỆN thành một nhóm riêng, KHÔNG giấu, KHÔNG nhét bừa vào
 * phòng nào (luật "thiếu dữ liệu thì lộ, không đoán"). Trùng chữ với `NO_ROOM_LABEL` của bảng BOQ
 * để người dùng thấy cùng một khái niệm ở hai màn hình. */
export const FFE_NO_ROOM_LABEL = 'Chưa gán phòng';

/** 12 cột chuẩn ngành, đúng thứ tự đọc từ trái sang của một bảng FF&E. */
export const FFE_SHEET_HEADERS = [
  'STT', 'Mã', 'Ảnh', 'Tên món', 'Quy cách / Kích thước', 'Vật liệu · Hoàn thiện',
  'Nhà cung cấp', 'Đơn giá (đ)', 'Số lượng', 'Đơn vị', 'Thành tiền (đ)', 'Duyệt SX',
] as const;

/** Trạng thái ô DUYỆT trước sản xuất. Chưa có bảng lưu nào trong repo (`grep` 0) ⇒ caller truyền
 * vào qua `opts.approvals`; mặc định 'pending'. KHÔNG bịa "đã duyệt". */
export type FfeApproval = 'pending' | 'approved' | 'rejected';

export const FFE_APPROVAL_LABEL: Record<FfeApproval, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Không duyệt',
};

export interface FfeSheetRow {
  stt: number;
  /** mã hàng hiển thị: `sku` → `specId` → '—' (chưa có mã là chuyện bình thường với món vừa bốc
   * từ ảnh ra; hiện '—' để người làm hồ sơ biết chỗ cần điền). */
  code: string;
  imageAssetId?: string;
  imageUrl?: string;
  name: string;
  /** quy cách: w×d×h mm nếu có, ngược lại '—'. */
  spec: string;
  /** vật liệu · hoàn thiện · mã màu — gộp 1 ô như bảng FF&E giấy. */
  finish: string;
  vendor: string;
  priceVnd: number | null;
  qty: number;
  unit: string;
  /** `null` = CHƯA CÓ GIÁ ⇒ không cộng vào tổng, hiện rõ. 0đ và "chưa biết giá" là 2 chuyện khác. */
  amount: number | null;
  approval: FfeApproval;
  /** Slice 5 (02/09) — độ đảm bảo theo thang chung `lib/distill/assurance`: dòng này là số
   * ĐÃ ĐẢM BẢO (declared/catalog-approved/user-override) hay PROXY (inferred/unknown). Present/BOQ
   * đọc field này để không cộng tiền máy đoán vào tổng đã đảm bảo. */
  assurance: AssuranceGrade;
  /** món gốc — truy vết ngược về entity/ảnh, không phải chép dữ liệu ra rồi mất đường về. */
  item: FfeItem;
}

export interface FfeSheetGroup {
  /** khoá nhóm = tên phòng đã trim; '' cho nhóm "Chưa gán phòng". */
  key: string;
  label: string;
  rows: FfeSheetRow[];
  /** tổng tiền các dòng CÓ GIÁ trong nhóm. */
  subtotalAmount: number;
  /** số dòng chưa có giá trong nhóm — UI/hồ sơ phải nói ra, không để tổng trông "đủ". */
  missingPriceCount: number;
  /** số dòng PROXY (máy đoán / chưa rõ nguồn) trong nhóm — hồ sơ phải nói ra. */
  proxyRowCount: number;
}

/** Tổng tiền tách theo lớp đảm bảo — `verified + proxy === totalAmount` (bất biến, test khoá). */
export interface FfeAmountByAssurance {
  /** tiền của các dòng ĐÃ ĐẢM BẢO có giá — phần được phép vào BOQ. */
  verified: number;
  /** tiền của các dòng PROXY có giá — hiện được, KHÔNG được coi là số thật. */
  proxy: number;
}

export interface FfeSheet {
  title: string;
  groups: FfeSheetGroup[];
  rowCount: number;
  /** tổng CÁC DÒNG CÓ GIÁ. Dòng chưa có giá không được coi là 0đ. */
  totalAmount: number;
  missingPriceCount: number;
  /** số món có số lượng hỏng (không phải số) — đã bị loại khỏi bảng, phải báo. */
  invalidQtyItemIds: string[];
  /** Slice 5 — tổng tách theo lớp đảm bảo; `totalAmount` GIỮ NGUYÊN nghĩa cũ (mọi dòng có giá). */
  amountByAssurance: FfeAmountByAssurance;
  /** số dòng PROXY toàn bảng — 0 nghĩa là mọi con số trong bảng đều có người/tài liệu/danh mục đứng sau. */
  proxyRowCount: number;
}

export interface BuildFfeSheetOptions {
  title?: string;
  /** trạng thái duyệt theo `FfeItem.id` — caller nạp từ nơi lưu của mình. */
  approvals?: Record<string, FfeApproval>;
  /** `ProductSpec.verified` theo `specId` — caller nạp từ `/api/specs`; thiếu = coi như chưa duyệt
   * (món thư viện vẫn là `declared`, không tụt xuống proxy). */
  specVerified?: SpecVerifiedMap;
}

function dimsLabel(item: FfeItem): string {
  const parts = [item.w, item.d, item.hUp].filter((n): n is number => typeof n === 'number' && n > 0);
  return parts.length ? `${parts.join('×')} mm` : '—';
}

function finishLabel(item: FfeItem): string {
  const parts: string[] = [];
  if (item.materials?.length) parts.push(item.materials.join(', '));
  if (item.finish) parts.push(item.finish);
  if (item.colorHex) parts.push(item.colorHex);
  return parts.length ? parts.join(' · ') : '—';
}

/**
 * Dựng bảng hồ sơ FF&E từ danh sách món.
 *
 * Luật (cùng tinh thần `computeBoq` — không tính bừa, không im lặng):
 *  - Món có `qty` không hợp lệ (`normalizeQty` trả null) → KHÔNG vào bảng, id ghi vào
 *    `invalidQtyItemIds` để caller báo. Không tự thay bằng 1.
 *  - Món chưa có giá (`priceVnd` null/undefined) → VẪN CÓ DÒNG (hồ sơ vẫn phải liệt kê đủ món),
 *    `amount = null`, đếm vào `missingPriceCount`. Tổng KHÔNG cộng nó vào như 0đ.
 *  - Món chưa khai phòng → nhóm "Chưa gán phòng", đứng như mọi nhóm khác.
 *  - Thứ tự nhóm = thứ tự gặp lần đầu (`groupByRoom` giữ nguyên) — hồ sơ in ra ổn định giữa 2 lần.
 */
export function buildFfeSheet(items: FfeItem[], opts?: BuildFfeSheetOptions): FfeSheet {
  const approvals = opts?.approvals ?? {};
  const specVerified = opts?.specVerified ?? {};
  const invalidQtyItemIds: string[] = [];
  const byRoom = groupByRoom(items);

  const groups: FfeSheetGroup[] = [];
  let stt = 0;
  let totalAmount = 0;
  let missingPriceCount = 0;
  let rowCount = 0;
  let verifiedAmount = 0;
  let proxyAmount = 0;
  let proxyRowCount = 0;

  for (const [key, roomItems] of byRoom) {
    const rows: FfeSheetRow[] = [];
    let subtotalAmount = 0;
    let groupMissing = 0;
    let groupProxy = 0;

    for (const item of roomItems) {
      const qty = normalizeQty(item.qty, item.unit);
      if (qty === null) {
        invalidQtyItemIds.push(item.id);
        continue;
      }
      stt += 1;
      // `ffeLineAmount` tính theo `item.qty` gốc — dùng qty ĐÃ chuẩn hoá để bảng và tiền khớp
      // nhau (đơn vị đếm ⇒ số nguyên). Vẫn gọi hàm chung để giữ đúng 1 định nghĩa "thành tiền".
      const amount = ffeLineAmount({ ...item, qty });
      const assurance = ffeAssurance(item, specVerified);
      const verified = isVerifiedQuantity(assurance);
      if (!verified) {
        groupProxy += 1;
        proxyRowCount += 1;
      }
      if (amount === null) {
        groupMissing += 1;
        missingPriceCount += 1;
      } else {
        subtotalAmount += amount;
        totalAmount += amount;
        if (verified) verifiedAmount += amount;
        else proxyAmount += amount;
      }
      rows.push({
        stt,
        code: item.sku || item.specId || '—',
        imageAssetId: item.imageAssetId,
        imageUrl: item.imageUrl,
        name: item.name,
        spec: dimsLabel(item),
        finish: finishLabel(item),
        vendor: item.vendor || item.brand || '—',
        priceVnd: item.priceVnd ?? null,
        qty,
        unit: item.unit,
        amount,
        approval: approvals[item.id] ?? 'pending',
        assurance,
        item,
      });
      rowCount += 1;
    }

    if (!rows.length) continue;
    groups.push({
      key,
      label: key || FFE_NO_ROOM_LABEL,
      rows,
      subtotalAmount,
      missingPriceCount: groupMissing,
      proxyRowCount: groupProxy,
    });
  }

  return {
    title: opts?.title ?? 'HỒ SƠ FF&E',
    groups,
    rowCount,
    totalAmount,
    missingPriceCount,
    invalidQtyItemIds,
    amountByAssurance: { verified: verifiedAmount, proxy: proxyAmount },
    proxyRowCount,
  };
}

/* ═════════════════════════ XUẤT .xlsx (nối vào máy của B3) ═════════════════════════ */

/** 1 ảnh món — caller tự nạp byte (module này THUẦN, không fetch). Khoá theo `FfeItem.id`. */
export interface FfeSheetImage {
  bytes: Uint8Array;
  ext: 'png' | 'jpeg';
  /** kích thước GỐC px — để giữ tỉ lệ khi thu nhỏ về ô thumbnail. */
  wPx: number;
  hPx: number;
}

const COL_WIDTHS = [6, 16, 12, 30, 22, 26, 18, 16, 10, 8, 18, 12];
const COL_IMAGE0 = 2; // cột "Ảnh", 0-based
const THUMB_BOX_W_PX = 64;
const THUMB_BOX_H_PX = 48;
const IMAGE_ROW_HEIGHT_PT = 40;

function fitThumb(wPx: number, hPx: number): { w: number; h: number } {
  if (!(wPx > 0) || !(hPx > 0)) return { w: THUMB_BOX_W_PX, h: THUMB_BOX_H_PX };
  const k = Math.min(THUMB_BOX_W_PX / wPx, THUMB_BOX_H_PX / hPx);
  return { w: Math.max(1, Math.round(wPx * k)), h: Math.max(1, Math.round(hPx * k)) };
}

function blanks(n: number): XlsxCell[] {
  return Array.from({ length: n }, () => ({ t: 'blank' as const }));
}

/**
 * Xuất hồ sơ FF&E ra .xlsx THẬT, ẢNH NHÚNG THEO DÒNG — dùng chung máy OOXML của `lib/boq/xlsx.ts`
 * (`buildXlsxBuffer`), KHÔNG thêm package.
 *
 * `images` khoá theo `FfeItem.id`. Dòng không có ảnh ⇒ ô Ảnh TRỐNG (không placeholder giả).
 * Không truyền ảnh nào ⇒ file vẫn hợp lệ, chỉ là không có phần `drawings/`/`media/`.
 */
export async function ffeSheetToXlsxBuffer(
  sheet: FfeSheet,
  images?: Map<string, FfeSheetImage>,
): Promise<Uint8Array> {
  const rows: XlsxRow[] = [];
  const xlsxImages: XlsxImage[] = [];

  rows.push({ cells: [{ t: 'text', v: sheet.title, style: STYLE.BOLD }] });
  rows.push({ cells: FFE_SHEET_HEADERS.map((h) => ({ t: 'text' as const, v: h, style: STYLE.BOLD })) });

  for (const group of sheet.groups) {
    // Dải phòng — 1 dòng đậm, nhóm nào cũng có (kể cả "Chưa gán phòng"): người đọc hồ sơ phải
    // thấy ngay còn bao nhiêu món chưa xếp phòng.
    rows.push({
      cells: [
        {
          t: 'text',
          v: group.missingPriceCount
            ? `${group.label} — ${group.rows.length} dòng · ${group.missingPriceCount} dòng CHƯA CÓ GIÁ`
            : `${group.label} — ${group.rows.length} dòng`,
          style: STYLE.BOLD,
        },
      ],
    });

    for (const row of group.rows) {
      const img = images?.get(row.item.id);
      const rowIndex = rows.length;
      rows.push({
        heightPt: img ? IMAGE_ROW_HEIGHT_PT : undefined,
        cells: [
          { t: 'num', v: row.stt, style: STYLE.NUM_INT },
          { t: 'text', v: row.code },
          { t: 'blank' },
          { t: 'text', v: row.name },
          { t: 'text', v: row.spec },
          { t: 'text', v: row.finish },
          { t: 'text', v: row.vendor },
          // "chưa có giá" ≠ 0đ — ghi CHỮ vào ô, không ghi số 0 (ghi 0 là nói dối bằng số).
          row.priceVnd === null
            ? { t: 'text', v: 'chưa có giá' }
            : { t: 'num', v: row.priceVnd, style: STYLE.NUM_VND },
          { t: 'num', v: row.qty, style: isCountUnit(row.unit) ? STYLE.NUM_INT : STYLE.NUM_M2 },
          { t: 'text', v: row.unit },
          row.amount === null
            ? { t: 'text', v: 'chưa có giá' }
            : { t: 'num', v: row.amount, style: STYLE.NUM_VND },
          { t: 'text', v: FFE_APPROVAL_LABEL[row.approval] },
        ],
      });
      if (img) {
        const { w, h } = fitThumb(img.wPx, img.hPx);
        xlsxImages.push({ rowIndex, colIndex: COL_IMAGE0, bytes: img.bytes, ext: img.ext, wPx: w, hPx: h });
      }
    }

    rows.push({
      cells: [
        ...blanks(9),
        { t: 'text', v: `Cộng ${group.label}`, style: STYLE.BOLD },
        { t: 'num', v: group.subtotalAmount, style: STYLE.BOLD_VND },
      ],
    });
  }

  rows.push({
    cells: [
      ...blanks(9),
      { t: 'text', v: 'TỔNG CỘNG', style: STYLE.BOLD },
      { t: 'num', v: sheet.totalAmount, style: STYLE.BOLD_VND },
    ],
  });

  if (sheet.missingPriceCount) {
    rows.push({
      cells: [
        {
          t: 'text',
          v: `⚠ ${sheet.missingPriceCount} món chưa có đơn giá — KHÔNG nằm trong tổng trên. Bổ sung giá trong kho vật liệu rồi xuất lại.`,
          style: STYLE.BOLD,
        },
      ],
    });
  }

  return buildXlsxBuffer({ name: 'FF&E', colWidths: COL_WIDTHS, rows, images: xlsxImages });
}
