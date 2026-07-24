/**
 * Kiểu chung cho Notebook UI. Contract API brief xong với Agent P1a (backend):
 *   POST   /api/notebook/[projectId]/source
 *   GET    /api/notebook/[projectId]/sources
 *   DELETE /api/notebook/[projectId]/source/[sourceId]
 *   POST   /api/notebook/[projectId]/query
 *   GET    /api/notebook/[projectId]/source/[sourceId]/file
 *
 * Nếu API chưa tồn tại (P1a chạy song song), fallback dùng in-memory state để
 * verify layout — hook `useNotebook` xử lý.
 */

export type SourceKind = 'pdf' | 'image' | 'text' | 'url' | 'meeting';

export type SourceStatus = 'processing' | 'ready' | 'error';

export interface NotebookSource {
  id: string;
  kind: SourceKind;
  title: string;
  size?: number; // bytes
  status: SourceStatus;
  createdAt: string;
  url?: string;
  error?: string;
  pages?: number;
}

export interface Citation {
  sourceId: string;
  sourceTitle: string;
  page?: number;
  snippet: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
  pending?: boolean;
  /**
   * Mode trả lời: 'grounded' = trích từ nguồn (có citations),
   * 'general'  = tri thức chung (khi notebook chưa có source hoặc retrieve rỗng).
   * UI hiển thị badge nhỏ để user biết Vitals đang nói theo tài liệu hay tự luận.
   */
  mode?: 'grounded' | 'general';
}

export const SOURCE_KIND_LABEL: Record<SourceKind, { vi: string; en: string }> = {
  pdf: { vi: 'PDF', en: 'PDF' },
  image: { vi: 'Ảnh', en: 'Image' },
  text: { vi: 'Văn bản', en: 'Text' },
  url: { vi: 'Liên kết', en: 'URL' },
  meeting: { vi: 'Cuộc họp', en: 'Meeting' },
};

export const SUGGESTED_QUESTIONS: Array<{ vi: string; en: string }> = [
  { vi: 'Câu chuyện thiết kế cho dự án này?', en: 'Design story for this project?' },
  { vi: 'Giải pháp thiết kế đề xuất?', en: 'Proposed design solution?' },
  { vi: 'Định hướng không gian?', en: 'Spatial direction?' },
  { vi: 'Moodboard tiền 3D — palette + material phù hợp?', en: 'Pre-3D moodboard — palette + materials?' },
];
