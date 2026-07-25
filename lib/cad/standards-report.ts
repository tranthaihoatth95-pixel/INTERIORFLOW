/**
 * lib/cad/standards-report.ts — Task #20 (T3): XUẤT PDF BÁO CÁO KIỂM QUY CHUẨN, TRUNG TÍNH.
 *
 * Nhận danh sách Violation (checker.ts) + bộ rule tham chiếu → dựng PDF 1-nhiều trang trình
 * bày sạch, đủ cho cấp quản lý duyệt: tiêu đề song ngữ, tên studio + tên dự án ĐỌC TỪ DỮ LIỆU
 * (Brand Kit của dự án đang mở + khung tên bản vẽ — KHÔNG hardcode thương hiệu nào), ngày,
 * bảng vi phạm phân mức (lỗi/cảnh báo/gợi ý) kèm điều khoản quy chuẩn + trạng thái kiểm chứng,
 * và (tuỳ chọn) ảnh bản vẽ.
 *
 * NGUYÊN TẮC TRUNG TÍNH (LUẬT NỀN TẢNG — CLAUDE.md): InteriorFlow là sản phẩm global, KHÔNG
 * dính bất kỳ studio nào. Vì vậy:
 *   - Tên studio/logo/màu nhấn lấy TỪ Brand Kit của dự án (getActiveBrandKit) nếu có → nhận diện
 *     riêng của KHÁCH HÀNG, không phải của app. Không có Brand Kit → layout trung tính (navy
 *     mực + xám hairline), KHÔNG chèn tên/logo mặc định nào.
 *   - Tên dự án đọc từ khung tên bản vẽ (titleBlock/titleBlockTTT ghi vào TEXT entity) — dữ liệu
 *     người dùng nhập, không bịa.
 *   - "InteriorFlow · Kiểm quy chuẩn" ở chân trang là nhận diện của CHÍNH CÔNG CỤ tạo báo cáo
 *     (trung tính, quốc tế), tách bạch khỏi thương hiệu nội dung dự án — đúng rule #4.
 *
 * TÁI DÙNG jsPDF (import động) như lib/cad/pdf.ts — KHÔNG thêm dependency mới. Ảnh bản vẽ dùng
 * renderDocToDataURL (lib/cad/render.ts) → addImage, đúng pattern export PNG hiện có.
 */

import type { Doc, Entity } from './model';
import type { Violation } from './standards/checker';
import type { StandardRule } from './standards/registry';
import { renderDocToDataURL } from './render';

/** Nhận diện thương hiệu để in lên báo cáo — LẤY TỪ DỮ LIỆU (Brand Kit dự án), không hardcode. */
export interface ReportBrand {
  /** Tên studio/đơn vị lập hồ sơ (Brand Kit.name). Rỗng/undefined = layout trung tính, không tên. */
  studioName?: string;
  /** Logo dataURL/URL (Brand Kit.logo). SVG hoặc lỗi tải → tự bỏ qua, không chèn. */
  logo?: string | null;
  /** Màu nhấn (Brand Kit.palette[0]) — hex '#RRGGBB'. Không hợp lệ → dùng navy trung tính. */
  accent?: string | null;
}

export interface StandardsReportMeta {
  brand?: ReportBrand;
  /** Tên dự án — mặc định trích từ khung tên bản vẽ (extractProjectName). */
  projectName?: string;
  /** Tên bản vẽ/hạng mục (tuỳ chọn). */
  drawingName?: string;
  /** Ngày lập báo cáo — chuỗi tự do, mặc định hôm nay (YYYY-MM-DD). */
  date?: string;
  /** Người lập (tuỳ chọn). */
  preparedBy?: string;
  /** Nhãn bộ quy chuẩn đang áp (VD "Văn phòng" / "Tất cả bộ quy chuẩn"). */
  scopeLabel?: string;
  /** Kèm ảnh bản vẽ vào trang cuối (raster) — mặc định false. */
  includeDrawing?: boolean;
}

/* ───────────────────────── Trích tên dự án / khung tên từ dữ liệu ───────────────────────── */

const texts = (doc: Doc) =>
  doc.entities.filter((e): e is Extract<Entity, { type: 'text' }> => e.type === 'text');

/**
 * Trích TÊN DỰ ÁN từ khung tên bản vẽ — KHÔNG bịa. Ưu tiên khung tên chuẩn (titleBlockTTT) có
 * nhãn "DỰ ÁN · PROJECT": tìm text-nhãn đó rồi lấy text NGAY DƯỚI cùng cột (x xấp xỉ, y nhỏ hơn
 * & gần nhất) — chính là giá trị info.project người dùng nhập. Không tìm được → chuỗi rỗng (để
 * UI cho người dùng tự điền, không đoán mò).
 */
export function extractProjectName(doc: Doc): string {
  const ts = texts(doc);
  const label = ts.find((t) => t.text.trim() === 'DỰ ÁN · PROJECT');
  if (label) {
    let best: { t: Extract<Entity, { type: 'text' }>; dy: number } | null = null;
    for (const t of ts) {
      if (t === label) continue;
      if (Math.abs(t.at.x - label.at.x) > (t.h ?? 100) * 4) continue; // cùng cột (dung sai theo cỡ chữ)
      const dy = label.at.y - t.at.y; // value nằm DƯỚI nhãn ⇒ dy > 0
      if (dy <= 0) continue;
      if (!best || dy < best.dy) best = { t, dy };
    }
    if (best) {
      const v = best.t.text.trim();
      if (v && v.toUpperCase() !== 'DỰ ÁN') return v;
    }
  }
  return '';
}

/** Trích "Người vẽ" từ khung tên chuẩn ("Vẽ · Drawn: X    Kiểm · Checked: Y"). Rỗng nếu không có. */
export function extractDrawnBy(doc: Doc): string {
  for (const t of texts(doc)) {
    const m = /Vẽ\s*·\s*Drawn:\s*(.+?)(?:\s{2,}Kiểm|$)/u.exec(t.text);
    if (m && m[1].trim() && m[1].trim() !== '—') return m[1].trim();
  }
  return '';
}

/* ───────────────────────── Bảng màu trung tính + tiện ích ───────────────────────── */

const INK = '#1F2937'; // mực chính (near-black, ấm trung tính)
const MUTED = '#6B7280'; // xám phụ
const HAIR = '#D1D5DB'; // hairline
const NAVY = '#1F2A37'; // accent trung tính mặc định (không brand)

const SEV = {
  error: { label: 'LỖI', en: 'Error', color: '#C0392B' },
  warning: { label: 'CẢNH BÁO', en: 'Warning', color: '#B8860B' },
  info: { label: 'GỢI Ý', en: 'Info', color: '#5B6B7B' },
} as const;

const HEX_RE = /^#([0-9a-fA-F]{6})$/;
const safeHex = (c: string | null | undefined, fallback: string) =>
  c && HEX_RE.test(c) ? c : fallback;

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Thứ tự nghiêm trọng để sắp xếp: lỗi → cảnh báo → gợi ý. */
const SEV_ORDER: Record<Violation['severity'], number> = { error: 0, warning: 1, info: 2 };

/* ───────────────────────── Dựng PDF ───────────────────────── */

/**
 * Dựng đối tượng jsPDF báo cáo quy chuẩn (A4 dọc). Trả về pdf để caller tự save/preview —
 * tách khỏi hàm tải xuống để test/tái dùng.
 */
export async function buildStandardsReportPdf(
  doc: Doc,
  violations: Violation[],
  rules: StandardRule[],
  meta: StandardsReportMeta = {},
) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' }); // 210 × 297
  const PW = 210;
  const PH = 297;
  const M = 16; // lề

  const brand = meta.brand ?? {};
  const accent = safeHex(brand.accent, NAVY);
  const studio = (brand.studioName ?? '').trim();
  const project = (meta.projectName ?? extractProjectName(doc)).trim();
  const date = (meta.date ?? todayStr()).trim();
  const preparedBy = (meta.preparedBy ?? '').trim();
  const rulesById = new Map(rules.map((r) => [r.id, r]));

  const counts = {
    error: violations.filter((v) => v.severity === 'error').length,
    warning: violations.filter((v) => v.severity === 'warning').length,
    info: violations.filter((v) => v.severity === 'info').length,
  };

  let page = 1;
  const footer = () => {
    pdf.setDrawColor(HAIR);
    pdf.setLineWidth(0.2);
    pdf.line(M, PH - 12, PW - M, PH - 12);
    pdf.setFontSize(7.5);
    pdf.setTextColor(MUTED);
    pdf.text('InteriorFlow · Kiểm quy chuẩn · Standards Checker', M, PH - 8);
    pdf.text(`Trang ${page}`, PW - M, PH - 8, { align: 'right' });
  };

  // ── Đầu trang: logo + tên studio (nếu có Brand Kit) trên dải accent mảnh ──
  let headerBottom = M;
  const logo = brand.logo;
  let logoW = 0;
  if (logo && /^data:image\/(png|jpe?g|webp)/i.test(logo)) {
    try {
      const fmt = /jpe?g/i.test(logo) ? 'JPEG' : /webp/i.test(logo) ? 'WEBP' : 'PNG';
      pdf.addImage(logo, fmt, M, M, 16, 16);
      logoW = 20;
    } catch {
      logoW = 0; // logo lỗi/không hỗ trợ (VD SVG) → bỏ qua, layout vẫn sạch
    }
  }
  if (studio) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(INK);
    pdf.text(studio, M + logoW, M + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(MUTED);
    pdf.text('Đơn vị lập hồ sơ · Prepared by', M + logoW, M + 12);
    headerBottom = M + 18;
  } else if (logoW) {
    headerBottom = M + 18;
  } else {
    headerBottom = M + 4;
  }
  // dải accent hairline dưới header
  pdf.setDrawColor(accent);
  pdf.setLineWidth(0.8);
  pdf.line(M, headerBottom, PW - M, headerBottom);

  // ── Tiêu đề báo cáo (song ngữ) ──
  let y = headerBottom + 12;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(INK);
  pdf.text('BÁO CÁO KIỂM TRA QUY CHUẨN', M, y);
  y += 6.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(MUTED);
  pdf.text('Standards Compliance Report — TCVN · QCVN · Neufert · IBC/NFPA · ISO', M, y);

  // ── Khối meta: dự án / ngày / người lập / phạm vi ──
  y += 9;
  pdf.setDrawColor(HAIR);
  pdf.setLineWidth(0.2);
  const metaRows: [string, string][] = [
    ['Dự án · Project', project || '—'],
  ];
  if (meta.drawingName?.trim()) metaRows.push(['Bản vẽ · Drawing', meta.drawingName.trim()]);
  metaRows.push(['Ngày lập · Date', date || '—']);
  if (preparedBy) metaRows.push(['Người lập · Prepared by', preparedBy]);
  if (meta.scopeLabel?.trim()) metaRows.push(['Phạm vi rule · Scope', meta.scopeLabel.trim()]);
  for (const [k, v] of metaRows) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(MUTED);
    pdf.text(k, M, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(INK);
    pdf.text(v, M + 52, y);
    y += 6;
  }

  // ── Tổng quan: 4 ô đếm (tổng / lỗi / cảnh báo / gợi ý) ──
  y += 3;
  const total = violations.length;
  const tiles: [string, string, number, string][] = [
    ['Tổng mục', 'Total', total, INK],
    ['Lỗi', 'Errors', counts.error, SEV.error.color],
    ['Cảnh báo', 'Warnings', counts.warning, SEV.warning.color],
    ['Gợi ý', 'Info', counts.info, SEV.info.color],
  ];
  const tileW = (PW - 2 * M - 3 * 4) / 4;
  tiles.forEach(([vi, en, n, col], i) => {
    const x = M + i * (tileW + 4);
    pdf.setDrawColor(HAIR);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, tileW, 18, 1.5, 1.5, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(col);
    pdf.text(String(n), x + 4, y + 10);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(MUTED);
    pdf.text(`${vi} · ${en}`, x + 4, y + 15);
  });
  y += 18 + 8;

  // ── Bảng danh sách vi phạm ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(INK);
  pdf.text('Danh sách vi phạm · Findings', M, y);
  y += 6;

  const sorted = [...violations].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
  );

  const contentBottom = PH - 16;
  const newPage = () => {
    footer();
    pdf.addPage();
    page += 1;
    y = M + 4;
  };

  if (sorted.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(MUTED);
    pdf.text(
      'Không phát hiện vi phạm nào trong phạm vi đo được tự động.',
      M,
      y + 2,
    );
    pdf.text('No violations found within the automatically measurable scope.', M, y + 7);
    y += 12;
  }

  sorted.forEach((v, i) => {
    const rule = rulesById.get(v.ruleId);
    const desc = rule?.description ? ` (${rule.description})` : '';
    const sev = SEV[v.severity];
    // Ước lượng chiều cao dòng để ngắt trang trước khi vẽ (message wrap + meta 2 dòng).
    pdf.setFontSize(9.5);
    const msgLines = pdf.splitTextToSize(v.message, PW - 2 * M - 8) as string[];
    const srcText = `${v.source}${desc}${v.verified ? '' : '  ·  CHƯA KIỂM CHỨNG — đối chiếu bản gốc trước khi dùng chính thức'}`;
    pdf.setFontSize(8);
    const srcLines = pdf.splitTextToSize(srcText, PW - 2 * M - 8) as string[];
    const rowH = 6 + msgLines.length * 4.6 + srcLines.length * 3.6 + 4;
    if (y + rowH > contentBottom) newPage();

    // vạch mức nghiêm trọng bên trái
    pdf.setDrawColor(sev.color);
    pdf.setLineWidth(1.2);
    pdf.line(M, y, M, y + rowH - 4);

    // badge mức + số thứ tự
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(sev.color);
    pdf.text(`${sev.label} · ${sev.en}`.toUpperCase(), M + 4, y + 3.5);
    pdf.setTextColor(MUTED);
    pdf.text(`#${i + 1}`, PW - M, y + 3.5, { align: 'right' });

    // message
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(INK);
    let ly = y + 8;
    msgLines.forEach((ln) => {
      pdf.text(ln, M + 4, ly);
      ly += 4.6;
    });
    // nguồn + điều khoản + kiểm chứng
    pdf.setFontSize(8);
    pdf.setTextColor(v.verified ? MUTED : SEV.warning.color);
    srcLines.forEach((ln) => {
      pdf.text(ln, M + 4, ly);
      ly += 3.6;
    });

    // hairline ngăn dòng
    pdf.setDrawColor(HAIR);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + rowH - 2, PW - M, y + rowH - 2);
    y = y + rowH;
  });

  // ── (Tuỳ chọn) ảnh bản vẽ ở trang cuối ──
  if (meta.includeDrawing) {
    try {
      const img = renderDocToDataURL(doc, 2000, 80);
      if (img && img.startsWith('data:image')) {
        newPage();
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(INK);
        pdf.text('Bản vẽ tham chiếu · Reference drawing', M, y + 2);
        y += 8;
        // fit ảnh vào khung còn lại giữ tỉ lệ
        const props = pdf.getImageProperties(img);
        const availW = PW - 2 * M;
        const availH = contentBottom - y - 2;
        const ratio = Math.min(availW / props.width, availH / props.height);
        const w = props.width * ratio;
        const h = props.height * ratio;
        pdf.addImage(img, 'PNG', M + (availW - w) / 2, y, w, h);
        y += h;
      }
    } catch {
      /* render/addImage lỗi (VD canvas không khả dụng SSR) → bỏ qua ảnh, báo cáo vẫn hợp lệ */
    }
  }

  footer();
  return pdf;
}

/** Xuất + tải xuống (client-only). */
export async function exportStandardsReportPdf(
  doc: Doc,
  violations: Violation[],
  rules: StandardRule[],
  meta: StandardsReportMeta = {},
  filename = 'bao-cao-quy-chuan.pdf',
): Promise<void> {
  if (typeof window === 'undefined') return;
  const pdf = await buildStandardsReportPdf(doc, violations, rules, meta);
  pdf.save(filename);
}
