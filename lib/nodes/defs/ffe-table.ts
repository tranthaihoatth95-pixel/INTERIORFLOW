/**
 * lib/nodes/defs/ffe-table.ts — khối **BẢNG MÓN** (`util.ffetable`), 06/08.
 * Đóng G-M3-01 + G-M3-02 (`docs/GAP-IF.md`, `docs/M3-OUT.md` §1c–1e).
 *
 * ─── VẤN ĐỀ ĐANG CÓ ───────────────────────────────────────────────────────────────────────
 * Dây chuyền bốc món từ ảnh đã chạy được từng mảnh: `ai.furnitureextract` tách MỘT món khỏi nền,
 * `vision.measureobject` suy ra Rộng×Sâu×Cao của MỘT món. Nhưng kết quả dừng ở đó — chữ và ảnh
 * rời. Muốn có bảng 12 món thì chạy 12 lượt rồi **gõ tay lại** tên/mã/số vào Excel. Luồng node
 * cũng không có kiểu dữ liệu BẢNG nên không khối nào xuất ra danh sách được.
 *
 * ─── KHỐI NÀY LÀM GÌ (và KHÔNG làm gì) ────────────────────────────────────────────────────
 * ✅ Nhận kết quả của MỘT lượt bốc tách/đo (ảnh cutout + JSON kích thước) → thành MỘT DÒNG món,
 *    nối vào bảng đến từ cổng "Bảng trước" ⇒ xâu N khối lại là có bảng N món chạy được trên dây,
 *    KHÔNG phải gõ lại.
 * ⛔ **KHÔNG nhìn ra N món trong một tấm ảnh.** Bộ tách hiện tại (BiRefNet / tầng lõi tách theo
 *    màu nền) chỉ trả về ĐÚNG MỘT vùng tiền cảnh mỗi lượt — đây là giới hạn của mô hình đang
 *    dùng, không phải thiếu code ở đây. Câu này được nhắc lại nguyên văn trong `description`
 *    (chỗ người dùng đọc) chứ không giấu trong comment.
 *
 * Vì sao gộp bằng CÁCH NỐI DÂY chứ không bằng nút "thêm dòng" trong khối: mặt khối
 * (`components/nodes/**`) nằm ngoài vùng file đợt này, và quan trọng hơn — trạng thái tích luỹ
 * giấu trong một khối sẽ đá nhau với cơ chế cache theo input-hash của `lib/execution.ts` (chạy
 * lại khối = cộng thêm một dòng trùng). Nối dây thì bảng là HÀM THUẦN của đồ thị: chạy lại bao
 * nhiêu lần cũng ra đúng ngần ấy dòng. `id` món khoá theo `ctx.nodeId` nên bền qua mọi lượt chạy.
 *
 * Import lib/ffe bằng đường TƯƠNG ĐỐI (không alias '@/') để `.test.ts` chạy được bằng
 * sucrase-node — cùng lý do đã ghi ở `lib/nodes/search.ts`.
 */
import type { NodeDefinition, PortValue } from '@/lib/types';
import { makeFfeItem, normalizeQty, FFE_DEFAULT_UNIT, type FfeConfidence, type FfeItem, type FfeTable } from '../../ffe/item';
import { decodeFfeTablePort, encodeFfeTablePort, ffeTableSummary } from '../../ffe/port';
import { parseMeasurementPayload, splitMaterials, normalizeColorHex } from '../../ffe/from-measurement';

/** Đơn vị chọn được trên khối. 4 đơn vị đầu là ĐẾM (`isCountUnit` bỏ dấu trước khi so nên 'cái'
 * nhận đúng), 3 đơn vị sau là ĐO. Giữ đúng bộ mã `ProductSpec.unit` cho phần đo ('m2'/'m'/'m3')
 * — không bịa hệ đơn vị thứ hai. */
export const FFE_UNIT_OPTIONS = ['cái', 'bộ', 'chiếc', 'tấm', 'm2', 'm', 'm3'];

/** Người dùng ép mức tin cậy khi họ biết rõ hơn máy. 'Tự động' = lấy theo kết quả đo. */
const CONFIDENCE_OPTIONS = ['Tự động', 'Đo được', 'Suy đoán', 'Nhập tay'];
const CONFIDENCE_BY_LABEL: Record<string, FfeConfidence> = {
  'Đo được': 'measured',
  'Suy đoán': 'inferred',
  'Nhập tay': 'manual',
};

function txt(v: string | number | undefined): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

export const ffeTableNodes: NodeDefinition[] = [
  {
    type: 'util.ffetable',
    title: 'Bảng món',
    titleEn: 'FF&E Schedule',
    category: 'UTILITY',
    description:
      'Gom kết quả bốc tách/đo từng món thành MỘT bảng chạy được trên dây — không phải gõ lại. ' +
      'Nối "Bảng trước" của khối này vào khối phía trước để cộng dồn: mỗi khối = một món. ' +
      'Máy chỉ tách được 1 món mỗi lượt, nên 12 món thì chạy 12 lượt rồi nối lại.',
    inputs: [
      { id: 'table', label: 'Bảng trước', dataType: 'table' },
      { id: 'measurement', label: 'Kích thước (JSON)', dataType: 'text' },
      { id: 'cutout', label: 'Ảnh món', dataType: 'image' },
    ],
    outputs: [
      { id: 'table', label: 'Bảng món', dataType: 'table' },
      { id: 'summary', label: 'Tóm tắt', dataType: 'text' },
    ],
    params: [
      { kind: 'text', id: 'name', label: 'Tên món', placeholder: 'Ghế lounge Volumen' },
      { kind: 'text', id: 'qty', label: 'Số lượng', placeholder: '1' },
      { kind: 'select', id: 'unit', label: 'Đơn vị', options: FFE_UNIT_OPTIONS },
      { kind: 'text', id: 'room', label: 'Phòng', placeholder: 'Phòng khách' },
      { kind: 'text', id: 'sku', label: 'Mã (SKU)', placeholder: 'GHE-01' },
      { kind: 'text', id: 'materials', label: 'Vật liệu', placeholder: 'gỗ sồi, vải lanh' },
      { kind: 'text', id: 'colorHex', label: 'Màu (hex)', placeholder: '#c79a63' },
      { kind: 'select', id: 'confidence', label: 'Độ tin cậy', options: CONFIDENCE_OPTIONS },
      { kind: 'text', id: 'note', label: 'Ghi chú' },
      { kind: 'text', id: 'label', label: 'Tên bảng', placeholder: 'FF&E — Tầng 2' },
    ],
    creditCost: 0,
    async execute(ctx) {
      const { inputs, params, onProgress, nodeId } = ctx;
      const prev = decodeFfeTablePort(inputs.table?.value);
      onProgress(0.3);

      const measured = parseMeasurementPayload(inputs.measurement?.value);
      const unit = txt(params.unit) || FFE_DEFAULT_UNIT;

      // Số lượng: ô trống ⇒ 1 (mặc định hợp lý). Gõ vào mà không ra số ⇒ BÁO LỖI, tuyệt đối
      // không âm thầm thay bằng 1 — đoán số lượng là đoán tiền (G-M3-09).
      const qtyRaw = txt(params.qty);
      const qty = qtyRaw ? normalizeQty(qtyRaw, unit) : 1;
      if (qty === null) {
        throw new Error(`Số lượng "${qtyRaw}" không đọc được thành số. Sửa lại rồi chạy tiếp.`);
      }

      // Tên trống ⇒ đặt tạm theo thứ tự (luật X4: thiếu thì SUY, không CHẶN). Tên tạm nhìn là
      // biết ngay còn thiếu, khác hẳn việc lặng lẽ bỏ dòng.
      const name = txt(params.name) || `Món ${prev.items.length + 1}`;
      const cutoutUrl = inputs.cutout ? String(inputs.cutout.value) : undefined;
      const forced = CONFIDENCE_BY_LABEL[txt(params.confidence)];

      const item: FfeItem = makeFfeItem({
        // id khoá theo nodeId ⇒ chạy lại khối KHÔNG đẻ dòng trùng (xem docblock đầu file).
        id: `ffe_${nodeId}`,
        name,
        qty,
        unit,
        sku: txt(params.sku) || undefined,
        room: txt(params.room) || undefined,
        materials: splitMaterials(txt(params.materials)),
        colorHex: normalizeColorHex(txt(params.colorHex)),
        note: txt(params.note) || undefined,
        imageUrl: cutoutUrl,
        w: measured.w,
        d: measured.d,
        hUp: measured.hUp,
        confidence: forced ?? measured.confidence ?? (measured.w || measured.d || measured.hUp ? undefined : 'manual'),
        confidenceBasis: forced ? 'Người dùng chỉ định trên khối Bảng món.' : measured.confidenceBasis,
        // Có số đo/ảnh từ máy ⇒ nguồn 'vision'; không thì đây là dòng gõ tay.
        source: measured.confidence || cutoutUrl ? 'vision' : 'manual',
      });
      onProgress(0.8);

      const table: FfeTable = {
        id: prev.id,
        label: txt(params.label) || prev.label,
        items: [...prev.items.filter((it) => it.id !== item.id), item],
        sourceRef: prev.sourceRef ?? cutoutUrl,
      };
      onProgress(1);

      const out: Record<string, PortValue> = {
        table: { dataType: 'table', value: encodeFfeTablePort(table) },
        summary: { dataType: 'text', value: ffeTableSummary(table) },
      };
      return out;
    },
  },
];
