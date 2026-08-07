/**
 * Kiểu dữ liệu chạy trên dây nối giữa các khối.
 *
 * `'table'` (thêm 06/08, G-M3-02 — xem `docs/GAP-IF.md`): BẢNG N MÓN. Trước đây luồng node chỉ
 * có ảnh/chữ/mặt nạ/số/video ⇒ một DANH SÁCH món không tồn tại được như dữ liệu chạy giữa các
 * khối, nên không khối nào xuất ra bảng món được; muốn có bảng phải chạy tay N lượt rồi gõ lại.
 *
 * ⚠️ RUỘT của `'table'` là `FfeTable` (`lib/ffe/item.ts`) đã **tuần tự hoá thành JSON string** —
 * KHÔNG phải object. Lý do: `PortValue.value` là `string | number` (flow của người dùng được
 * `JSON.stringify` nguyên cục vào localStorage/`graphJson`, xem `lib/store.ts`), đổi kiểu đó
 * thành object là vỡ mọi file flow đã lưu. Mã hoá/giải mã ĐI QUA `lib/ffe/port.ts`
 * (`encodeFfeTablePort`/`decodeFfeTablePort`) — không nơi nào tự `JSON.parse` tay.
 */
export type DataType = 'image' | 'text' | 'mask' | 'number' | 'video' | 'table';

export interface PortDef {
  id: string;
  label: string;
  dataType: DataType;
}

export type ParamDef =
  | { kind: 'text'; id: string; label: string; placeholder?: string; multiline?: boolean }
  | { kind: 'select'; id: string; label: string; options: string[] }
  | { kind: 'slider'; id: string; label: string; min: number; max: number; step: number; default: number }
  | { kind: 'image'; id: string; label: string }
  | { kind: 'mask'; id: string; label: string }
  | { kind: 'annotate'; id: string; label: string }
  /** Vẽ tay tự do (brush/eraser/line/shape + palette màu) — mở Sketch Studio modal.
   *  Thêm OPTIONAL (union mới, không đổi field cũ) — xem lib/sketch/**, components/sketch/**. */
  | { kind: 'sketch'; id: string; label: string }
  /** Chọn vùng thông minh (SAM 2 + brush tinh chỉnh) — mở Smart Select modal.
   *  Giá trị lưu GIỐNG `kind: 'mask'` (data-URI PNG trắng/đen) nên downstream không phân biệt;
   *  khác nhau chỉ ở modal mở ra. Xem lib/smartselect/**, components/smartselect/**. */
  | { kind: 'smartmask'; id: string; label: string }
  /** 4 điểm góc phối cảnh (kéo trên modal canvas) — giá trị lưu JSON `[{x,y}×4]` theo TỈ LỆ 0–1
   *  của ảnh nền. Dùng cho `util.warp`; xem lib/warp/**, components/warp/**. */
  | { kind: 'corners'; id: string; label: string };

export type NodeCategory = 'INPUT' | 'AI_GENERATE' | 'AI_EDIT' | 'SLIDE' | 'UTILITY' | 'OUTPUT';

export interface PortValue {
  dataType: DataType;
  value: string | number;
}

export interface ExecContext {
  nodeId: string;
  inputs: Record<string, PortValue | undefined>;
  params: Record<string, string | number>;
  onProgress: (progress: number) => void;
  /** mức phụ thuộc AI hiện tại (1–4) — node AI dùng để chọn provider */
  aiTier: import('@/lib/ai/tiers').AiTier;
  /** engine của oneAI (mức 2): 'sd' | 'flux' — quyết định provider sd/comfyui */
  oneAiEngine?: import('@/lib/ai/tiers').OneAiEngine;
  /** runtime của oneAI khi engine 'sd': 'server' (API) | 'webgpu' (client-side) */
  oneAiRuntime?: import('@/lib/ai/tiers').OneAiRuntime;
}

export interface NodeDefinition {
  type: string;
  /**
   * NHÃN HIỂN THỊ — CHỈ TIẾNG VIỆT, ngắn (đổi 05/08: trước đây trộn 'Việt · English' trong cùng
   * một nhãn, dài gấp đôi và vỡ khuôn "≤12 từ" của `SPEC-NGON-NGU-CHI-DAN`). Tên tiếng Anh của
   * công cụ chuyển sang `titleEn` → hiện ở TOOLTIP, cùng khuôn thanh tool 2D ("Đường (L)").
   */
  title: string;
  /**
   * Tên tiếng Anh (thuật ngữ ngành: 'Inpainting', 'Object Mask'…) — dùng cho tooltip, cho giao
   * diện EN (`useT`), và làm từ khoá tìm kiếm (`lib/nodes/search.ts` gộp vào kho chữ). OPTIONAL:
   * node không khai thì mọi chỗ tự lùi về `title` (không nơi nào hiện chuỗi rỗng).
   */
  titleEn?: string;
  category: NodeCategory;
  description: string;
  inputs: PortDef[];
  outputs: PortDef[];
  params: ParamDef[];
  creditCost: number;
  /**
   * Từ khoá tìm kiếm VI + EN theo CÁCH NGƯỜI DÙNG GÕ ("vách", "tách nền", "phóng to"),
   * không phải tên kỹ thuật. OPTIONAL — node không khai thì lấy từ `lib/nodes/keywords.ts`
   * (bảng trung tâm, xem `keywordsFor()`). Tìm kiếm bỏ dấu nên gõ "vach" cũng khớp "vách".
   */
  keywords?: string[];
  execute: (ctx: ExecContext) => Promise<Record<string, PortValue>>;
}

export type RunStatus = 'idle' | 'queued' | 'running' | 'done' | 'error';

export interface NodeRunState {
  status: RunStatus;
  progress: number;
  outputs?: Record<string, PortValue>;
  error?: string;
  /** hash of inputs+params of the last successful run — unchanged inputs are not re-run */
  inputHash?: string;
}

export interface Job {
  id: string;
  nodeId: string;
  nodeTitle: string;
  status: RunStatus;
  createdAt: number;
  finishedAt?: number;
  creditCost: number;
  error?: string;
}

export type FlowRunStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

/**
 * 2.2.86 (30/07, Hoà chốt) — đơn vị HÀNG ĐỢI là 1 lượt chạy (node ▶ + upstream, thẻ Tool Mode
 * "Kết xuất", hoặc "Run flow" toàn graph), KHÔNG phải từng node lẻ. `Job` (trên) vẫn giữ nguyên,
 * là chi tiết TỪNG NODE — xem "lồng" trong 1 FlowRun bằng cách lọc `jobs[]` theo `nodeIds` +
 * khoảng thời gian `startedAt..finishedAt` (không thêm field `runId` vào Job — execNode() giữ
 * nguyên 100%, không đụng, theo đúng yêu cầu).
 */
export interface FlowRun {
  id: string;
  /** tên flow/node lúc XẾP HÀNG (không đổi theo sau, kể cả nếu người dùng đổi tên flow lúc đang chạy). */
  label: string;
  /** thứ tự node sẽ chạy — topo-sort tính SẴN lúc xếp hàng, không tính lại khi tới lượt. */
  nodeIds: string[];
  status: FlowRunStatus;
  queuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  /** index (0-based) của node đang/vừa chạy trong nodeIds — dùng hiện "3/7 node". -1 = chưa bắt đầu. */
  currentIndex: number;
  /** true (nút ▶ trên node): dừng CẢ chuỗi ngay khi 1 node lỗi. false (Run flow toàn graph): bỏ
   * qua nhánh bị chặn bởi node lỗi, chạy tiếp nhánh khác — đúng hành vi cũ của runNode()/runFlow(). */
  stopOnFirstFailure: boolean;
  /** true = người dùng bấm Huỷ khi đang chạy — dừng ở ranh giới node kế tiếp, không cắt giữa 1 lần gọi API. */
  cancelRequested: boolean;
}

export interface InteriorNodeData extends Record<string, unknown> {
  defType: string;
  params: Record<string, string | number>;
  run: NodeRunState;
  /** sticky note content (type === 'note' only) */
  note?: string;
}

/**
 * Màu cổng nối theo kiểu dữ liệu. Dùng CHUNG cho chấm cổng (`InteriorNode`/`MacroNodeFace`) và
 * MÀU DÂY (`edgeStyleFor`, `lib/store.ts`) — một bảng, không hai mặt tiền lệch màu.
 *
 * 06/08 — port `docs/mocks/Bảng nút.dc.html` ①: 3 kiểu có mặt trong mock đổi sang BIẾN token
 * `--p-img`/`--p-mask`/`--p-num` (`app/globals.css`, khai bí danh của --accent/--warning/--t3)
 * thay hex cứng ⇒ đổi theme Sáng/Tối là màu cổng đổi theo, đúng L4 "cấm hex tự chế".
 * Giá trị resolve ở theme Tối = đúng hex mock (#6a57f5 · #d9a34a · #9e9ea8).
 *
 * ⚠️ Còn hex: `text`/`video` KHÔNG có trong mock (mock chỉ vẽ 4 loại cổng) và `table` cố ý ghim
 * đúng giá trị `--accent-warm` (có test khoá, `lib/ffe/port.test.ts`) — đổi 3 dòng đó là quyết
 * định thiết kế mới, ngoài phạm vi việc này.
 * ⚠️ Biến thứ 4 của mock — `--p-mat` ("Vật liệu") — CHƯA có nơi tiêu thụ: `DataType` hiện không
 * có kiểu 'material' (xem `DataType` đầu file). Biến vẫn khai trong globals.css theo đúng mock,
 * dùng được ngay khi thêm kiểu đó; không bịa một DataType mới chỉ để lấp chỗ.
 */
export const DATA_TYPE_COLORS: Record<DataType, string> = {
  image: 'var(--p-img)',
  // G-NB-03: trước hex trần '#38bdf8' — nền Kem giữ nguyên giá trị nền Mực (chấm mờ, không
  // đổi theo theme). Nay dùng token `--p-text` (app/globals.css), theo đúng lối bí danh của
  // --p-img/--p-mask/--p-num ở trên: Tối giữ đúng hex cũ, Sáng có bản đủ tương phản riêng.
  text: 'var(--p-text)',
  mask: 'var(--p-mask)',
  number: 'var(--p-num)',
  // G-NB-03: trước hex trần '#fb7185' (hồng san hô — phân biệt luồng video với ảnh), cùng lỗi
  // không đổi theo theme. Nay dùng token `--p-video`.
  video: 'var(--p-video)',
  /**
   * Bảng món (06/08). KHÔNG chế hex mới (`LUAT-GIAO-DIEN-BAT-BUOC.md` L4 + `SPEC-DESIGN-SYSTEM-IF`):
   * lấy đúng giá trị token `--accent-warm` đã có trong `app/globals.css:26` — token nâu ấm DUY NHẤT
   * của hệ, vốn dành cho chỗ "cần một sắc ấm khác accent tím".
   * Vì sao chọn nó: 5 màu port đang dùng hết 5 vùng sắc rõ rệt (tím · lam · hổ phách · lục · san
   * hô); nâu ấm là sắc còn lại phân biệt được BẰNG MẮT ở chấm 8px, và "bảng/hồ sơ = giấy ấm" khớp
   * ngôn ngữ tài liệu.
   * (07/08, p2 — đính chính ghi chú cũ ở đây: `edgeStyleFor()` trong `lib/store.ts` NAY ĐÃ có
   * 'table' trong nhánh `isData` ⇒ cạnh bảng vẽ NÉT ĐỨT đúng nhóm text/number rồi, việc "cần thêm"
   * mà bản 06/08 ghi đã xong — đừng sửa lại lần nữa.)
   * ⚠️ Còn đúng một điều: '#c79a63' là hex trần lấy theo giá trị `--accent-warm` bản Tối — nền Kem
   * không có bản riêng (cùng lớp bệnh G-NB-03 đã sửa cho text/video). Đổi sang token cần khai
   * `--p-table` 2 theme ở globals.css trước, chưa làm trong đợt này.
   */
  table: '#c79a63',
};

// Nhãn nhóm — quy chuẩn thoại 5 luật (2.2.69, 30/07): Việt dẫn · Anh theo, dùng trong
// CommandPalette (nguồn nhãn kỹ thuật thô bị 7.3.25 nêu). Đây KHÔNG phải "4 nhóm" cross-layout
// của 2.2.71 (Ý tưởng/Dựng/Sửa/Xuất, còn ⬜ chờ 7.1.18) — đó là màn hình riêng, mã riêng.
export const CATEGORY_META: Record<NodeCategory, { label: string; color: string }> = {
  INPUT: { label: 'Đầu vào · Input', color: '#38bdf8' },
  AI_GENERATE: { label: 'Sinh ảnh AI · AI Generate', color: '#8b7cf7' },
  AI_EDIT: { label: 'Sửa ảnh AI · AI Edit', color: '#f472b6' },
  SLIDE: { label: 'Slide trình bày · Slide Deck', color: '#fb923c' },
  UTILITY: { label: 'Tiện ích · Utility', color: '#34d399' },
  OUTPUT: { label: 'Xuất · Output', color: '#fbbf24' },
};
