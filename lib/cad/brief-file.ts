/**
 * lib/cad/brief-file.ts — nạp ĐỀ BÀI từ tệp vào panel "Đề bài → Phương án" (AiBriefPanel).
 *
 * Theo `docs/SPEC-BRIEF-INTAKE.md` bước ②: brief thật của dự án lớn là PDF nhiều trang, không
 * phải một dòng gõ tay. Module này là phần THUẦN (không DOM, không import unpdf) để test được
 * dưới sucrase-node: phân loại tệp theo đuôi tên · chuẩn hoá/cắt text · soạn thông điệp theo
 * khuôn `SPEC-NGON-NGU-CHI-DAN.md` (điều gì hỏng + cách thoát, luôn kèm tên tệp, không đổ lỗi
 * user). Việc TRÍCH text thật nằm ở `lib/notebook/extract.ts` (extractPdf/unpdf — đã có test
 * riêng, KHÔNG viết lại parser); AiBriefPanel gọi extract rồi đưa kết quả qua đây.
 *
 * Human-in-the-loop (luật nền 00-CHOT mục 7): text trích ra chỉ ĐỔ VÀO Ô BRIEF cho người dùng
 * đọc/sửa — KHÔNG tự chạy parseDescription/generate sau khi nạp.
 *
 * ⚠️ .docx CHƯA nhận: repo không có thư viện đọc Word (đã kiểm 08/08 — không mammoth/docx trong
 * package.json, extract.ts chỉ có PDF/ảnh/plain). Nhận .docx mà parse sai còn tệ hơn báo rõ —
 * thông điệp hướng người dùng lưu thành PDF/.txt (Word làm được 1 bước).
 */

/** Loại tệp đoán theo ĐUÔI TÊN (không đọc nội dung — phân loại trước khi tốn công trích). */
export type BriefFileKind = 'pdf' | 'text' | 'word' | 'unknown';

/** Chuỗi cho thuộc tính accept của <input type="file"> — nguồn duy nhất, UI đọc từ đây. */
export const BRIEF_FILE_ACCEPT = '.pdf,.txt,.md';

/**
 * Trần ký tự đổ vào ô brief. Ô textarea hiện KHÔNG có maxLength (đã kiểm AiBriefPanel 08/08 —
 * trần duy nhất là HISTORY_KEY slice(0,2000), nhưng đó là trần LƯU LỊCH SỬ, không phải trần ô
 * nhập). Chọn 20.000: parseDescription đọc theo DÒNG nên text dài không phá parser, nhưng brief
 * còn persist localStorage (DRAFT_KEY) mỗi lần gõ — 20k ≈ 8-10 trang chữ đặc, đủ cho phần lời
 * của brief 20-50 trang (phần còn lại thường là ảnh/bảng), mà không phình draft.
 */
export const BRIEF_MAX_CHARS = 20_000;

export function briefFileKind(fileName: string): BriefFileKind {
  const n = fileName.toLowerCase().trim();
  if (n.endsWith('.pdf')) return 'pdf';
  if (n.endsWith('.txt') || n.endsWith('.md') || n.endsWith('.markdown')) return 'text';
  if (n.endsWith('.docx') || n.endsWith('.doc')) return 'word';
  return 'unknown';
}

export interface NormalizedBrief {
  /** Text đã chuẩn hoá (LF, không dòng trống chồng đống, đã cắt nếu quá trần). */
  text: string;
  /** true nếu đã phải cắt bớt. */
  truncated: boolean;
  /** Số ký tự SAU chuẩn hoá nhưng TRƯỚC khi cắt — để báo "đã cắt còn X/Y". */
  originalLength: number;
}

/**
 * Chuẩn hoá text trích từ tệp trước khi đổ vào ô brief:
 * - CRLF/CR → LF (cùng cách extractPlain của notebook làm);
 * - xoá khoảng trắng cuối dòng; gộp ≥3 dòng trống liên tiếp còn 1 dòng trống (PDF hay sinh
 *   khoảng trống lớn giữa các trang);
 * - quá trần thì CẮT THÔNG MINH: lùi về ranh giới dòng gần nhất trước trần (đề bài đọc theo
 *   dòng — cắt giữa câu "phòng ngủ 3.4x…" là mất nghĩa cả dòng); không có newline nào trong
 *   80% cuối đoạn cắt thì lùi về khoảng trắng gần nhất; bí quá mới cắt cứng.
 */
export function normalizeBriefText(raw: string, maxChars: number = BRIEF_MAX_CHARS): NormalizedBrief {
  const clean = (raw ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (clean.length <= maxChars) {
    return { text: clean, truncated: false, originalLength: clean.length };
  }
  const window = clean.slice(0, maxChars);
  const lastNewline = window.lastIndexOf('\n');
  const lastSpace = window.lastIndexOf(' ');
  // Ranh giới dòng đáng dùng khi PHẦN DÒNG DỞ bị vứt đi có độ dài của một dòng bình thường
  // (≤500 ký tự). Văn bản 1 dòng siêu dài (PDF trích không xuống dòng) thì newline gần nhất ở
  // tít đầu — vứt theo nó là mất oan cả đoạn, khi đó thà cắt theo khoảng trắng gần trần.
  const partialLineLen = window.length - (lastNewline + 1);
  const cutAt =
    lastNewline > 0 && partialLineLen <= 500 ? lastNewline : lastSpace > 0 ? lastSpace : maxChars;
  return { text: window.slice(0, cutAt).trimEnd(), truncated: true, originalLength: clean.length };
}

/* ── Thông điệp — khuôn SPEC-NGON-NGU-CHI-DAN: có tên tệp, nói việc làm tiếp, ≤ vài dòng ── */

const nf = new Intl.NumberFormat('vi-VN'); // 12400 → "12.400" cho dễ đọc

/** Nạp xong, đổ vào ô — nhắc rõ bước tiếp là NGƯỜI kiểm tra/sửa (không tự chạy). */
export function briefLoadedMessage(fileName: string, n: NormalizedBrief, pageCount?: number): string {
  const pages = pageCount && pageCount > 0 ? `${pageCount} trang · ` : '';
  const cut = n.truncated
    ? ` Đề bài dài ${nf.format(n.originalLength)} ký tự — đã giữ ${nf.format(n.text.length)} ký tự đầu (cắt ở ranh giới dòng), phần sau dán tay nếu cần.`
    : '';
  return `Đã nạp "${fileName}" (${pages}${nf.format(n.text.length)} ký tự) vào ô đề bài — kiểm tra, sửa nếu cần, rồi bấm Tạo phương án.${cut}`;
}

/** PDF trích ra 0 chữ — thường là bản scan (toàn ảnh). */
export function briefEmptyPdfMessage(fileName: string): string {
  return `"${fileName}" không có chữ trích được — có thể là PDF scan (toàn ảnh). Dùng bản PDF gốc có text, hoặc gõ/dán đề bài vào ô bên dưới.`;
}

/** Tệp text rỗng. */
export function briefEmptyTextMessage(fileName: string): string {
  return `"${fileName}" đang trống — chọn tệp khác hoặc gõ/dán đề bài vào ô bên dưới.`;
}

/** .docx/.doc — chưa có bộ đọc Word trong app (xem docstring đầu file). */
export function briefWordMessage(fileName: string): string {
  return `"${fileName}" là tệp Word — IF chưa đọc được định dạng này. Trong Word chọn Lưu thành PDF (hoặc .txt) rồi nạp lại.`;
}

/** Đuôi tệp ngoài danh sách nhận. */
export function briefUnsupportedMessage(fileName: string): string {
  return `"${fileName}" không thuộc định dạng nhận được (.pdf · .txt · .md) — xuất đề bài sang PDF hoặc dán thẳng nội dung vào ô bên dưới.`;
}

/** Trích lỗi giữa chừng (PDF hỏng, mã hoá…) — kèm lý do kỹ thuật rút gọn để còn tra được. */
export function briefExtractFailedMessage(fileName: string, reason: unknown): string {
  const msg = reason instanceof Error ? reason.message : String(reason ?? '');
  const detail = msg ? ` (${msg.slice(0, 120)})` : '';
  return `Không đọc được "${fileName}"${detail} — tệp có thể hỏng hoặc đặt mật khẩu. Thử mở lại bằng trình đọc PDF rồi xuất bản mới, hoặc dán nội dung vào ô bên dưới.`;
}
