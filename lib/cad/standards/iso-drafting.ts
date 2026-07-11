/**
 * lib/cad/standards/iso-drafting.ts — Chuẩn trình bày bản vẽ kỹ thuật: ISO 128 (nét vẽ), ISO
 * 129 (ghi kích thước), ISO 7200 (khung tên), ISO 216 (khổ giấy A-series). ISO 128 lineweight
 * + ISO 216 paper sizes tra được nguồn rõ ràng (verified=true); ISO 129/7200 chỉ có hiểu biết
 * định tính chung, CHƯA tra được điều khoản cụ thể (verified=false).
 */
import type { RuleGroup } from './registry';

export const ISO_DRAFTING: RuleGroup = {
  id: 'iso-drafting',
  name: 'Trình bày bản vẽ (ISO 128/129/7200/216)',
  rules: [
    {
      id: 'iso128-lineweight-set',
      source: 'ISO 128-2:2020',
      category: 'drafting',
      severity: 'info',
      description: 'Bề dày nét chuẩn: 0.13/0.18/0.25/0.35/0.5/0.7/1.0/1.4/2.0 mm — dùng đúng 1 trong các giá trị này cho mọi layer (đã áp dụng: xem STANDARD_LINEWEIGHTS trong lib/cad/model.ts).',
      params: {
        lw0: 0.13, lw1: 0.18, lw2: 0.25, lw3: 0.35, lw4: 0.5, lw5: 0.7, lw6: 1.0, lw7: 1.4, lw8: 2.0,
      },
      verified: true,
      note: 'Tra qua tìm kiếm web (nhiều nguồn kỹ thuật trích ISO 128-2) — trùng khớp với STANDARD_LINEWEIGHTS đã cài trong model.ts.',
    },
    {
      id: 'iso128-thick-thin-ratio',
      source: 'ISO 128-2:2020',
      category: 'drafting',
      severity: 'warning',
      description: 'Tỉ lệ giữa nét đậm nhất và nét mảnh nhất dùng trong 1 bản vẽ nên ≥ 2:1 (VD tường 0.6mm / kích thước 0.15mm = tỉ lệ 4:1, đạt).',
      params: { minRatio: 2 },
      verified: true,
      note: 'Tra qua tìm kiếm web — checker so sánh lineweight lớn nhất/nhỏ nhất đang dùng trong các layer hiện có của Doc.',
    },
    {
      id: 'iso216-paper-sizes',
      source: 'ISO 216 (khổ giấy A-series)',
      category: 'drafting',
      severity: 'info',
      description: 'Khổ giấy chuẩn: A0 841×1189, A1 594×841, A2 420×594, A3 297×420, A4 210×297 (mm) — dùng cho layout in ấn (Nấc 7, chưa triển khai trong app).',
      params: {
        a0w: 841, a0h: 1189, a1w: 594, a1h: 841, a2w: 420, a2h: 594, a3w: 297, a3h: 420, a4w: 210, a4h: 297,
      },
      verified: true,
      note: 'ISO 216 là kiến thức phổ thông rất ổn định/không tranh cãi (kích thước A-series) — không cần tra thêm, nhưng chưa có pipeline in ấn để áp dụng (xem Nấc 7 trong docs/CAD-LT.md).',
    },
    {
      id: 'iso129-dimension-style-minimal',
      source: 'ISO 129 (ghi kích thước) — hiểu biết chung, CHƯA tra điều khoản cụ thể',
      category: 'drafting',
      severity: 'info',
      description: 'Đường kích thước nên có mũi tên/gạch chéo đầu mút rõ ràng, đường gióng vượt quá đường kích thước 1 đoạn ngắn, chữ số đặt giữa hoặc trên đường kích thước — app đã có tick 45° kiểu kiến trúc (xem render.ts drawDimAligned), phù hợp tinh thần chung nhưng CHƯA đối chiếu số liệu cụ thể (độ dài tick, khoảng vượt của đường gióng) với văn bản ISO 129 gốc.',
      params: {},
      verified: false,
      note: 'Chỉ là hiểu biết định tính chung về cách trình bày kích thước kỹ thuật — CẦN tra bản gốc ISO 129 để có số liệu cụ thể (độ dài tick/mũi tên theo tỉ lệ bản vẽ…) trước khi coi là "chuẩn ISO 129" chính thức.',
    },
    {
      id: 'iso7200-titleblock-fields',
      source: 'ISO 7200 (trường thông tin khung tên) — hiểu biết chung, CHƯA tra điều khoản cụ thể',
      category: 'drafting',
      severity: 'info',
      description: 'Khung tên nên có tối thiểu: tên/mã dự án, tên bản vẽ, tỉ lệ, ngày, người vẽ/kiểm tra — app đã có titleBlock() trong commands.ts với project/drawing/scale/author/date.',
      params: {},
      verified: false,
      note: 'Danh sách trường là hiểu biết thực hành phổ biến, KHÔNG phải trích dẫn trực tiếp bảng trường ISO 7200 — cần tra bản gốc để xác nhận đủ trường bắt buộc trước khi coi là tuân thủ ISO 7200 đầy đủ.',
    },
  ],
};
