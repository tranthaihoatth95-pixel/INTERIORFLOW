/**
 * components/studio/checkpoint-core.ts — PHẦN THUẦN của Checkpoint duyệt (S5, 05/08).
 *
 * Tách khỏi `Checkpoint.tsx` để test được bằng `sucrase-node` (không cần DOM/React) — cùng mẫu
 * `lib/server/access-policy.ts` tách khỏi `access.ts`. `Checkpoint.tsx` re-export toàn bộ, nơi
 * gọi cứ import từ `Checkpoint.tsx` như thường.
 *
 * Vì sao có file này: luật §0e QUYỀN KIỂM SOÁT (`docs/00-BAT-DAU-DOC-DAY.md`, Hoà đặt 05/08).
 * Nguyên văn nỗi đau: *"họ ghét cảm giác mông lung, không chắc chắn khi AI tạo ra sản phẩm không
 * đồng nhất"*. Năm điều kiện KS1–KS5 được cài thẳng vào KIỂU DỮ LIỆU dưới đây, để nơi gọi
 * KHÔNG THỂ quên — thiếu trường là hỏng `tsc`, không phải "quên thì thôi":
 *
 *   KS1 DẠNG TRUNG GIAN     → `preview` (ReactNode, sản phẩm THẬT) + `params` (đọc được, sửa được)
 *   KS2 CÙNG VÀO → CÙNG RA  → `seed` BẮT BUỘC khai (`null` = "bước này không dùng seed", phải nói rõ)
 *   KS3 DUYỆT THEO PHẦN     → `items[]` + `selected` — Nhận được 5 bỏ 7, không nuốt cả gói
 *   KS4 LÙI VỀ ĐÂU          → `undoLabel` BẮT BUỘC — nói rõ bấm Huỷ/Hoàn tác thì về trạng thái nào
 *   KS5 VÌ SAO              → `CheckpointItem.why` — máy đề xuất thì phải giải thích được
 */

/** Ba trạng thái của checkpoint — đúng ① ② ③ trong phiếu S5. */
export type CheckpointPhase =
  /** ① ĐANG LÀM — thấy tiến độ, huỷ được. */
  | 'running'
  /** ② XEM TRƯỚC + ③ QUYẾT — cùng một khung: thấy sản phẩm thật RỒI mới có nút quyết. */
  | 'preview'
  /** Chưa chạy / đã chốt xong — khung thu về, không chiếm chỗ. */
  | 'idle';

/**
 * Một PHẦN duyệt được riêng (KS3). AI đề xuất 12 thay đổi ⇒ 12 item, người dùng tick từng cái.
 * `detail` phải là SỐ/ĐỐI TƯỢNG THẬT ("3 tường · 12.4 m²"), KHÔNG phải câu "đã tạo xong".
 */
export interface CheckpointItem {
  id: string;
  /** tên phần thay đổi, ngắn — vd "Tường trục A" */
  label: string;
  /** con số/đối tượng thật kèm theo — vd "4200mm · dày 200" */
  detail?: string;
  /** KS5 — căn cứ của máy. Thiếu thì UI hiện "máy chưa nêu căn cứ" chứ không giấu. */
  why?: string;
  /** người dùng có lấy phần này không (mặc định true — bỏ tick để loại). */
  selected: boolean;
}

/** Một dòng tham số đọc được (KS1) — hiện cạnh kết quả để biết máy đã chạy với gì. */
export interface CheckpointParam {
  label: string;
  value: string;
}

/** Bật/tắt một phần. Trả MẢNG MỚI (không sửa tại chỗ — React so sánh tham chiếu). */
export function toggleItem(items: CheckpointItem[], id: string): CheckpointItem[] {
  return items.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it));
}

/** Tick/bỏ tick tất cả — nút "Chọn tất cả" ở đầu danh sách. */
export function setAllSelected(items: CheckpointItem[], selected: boolean): CheckpointItem[] {
  return items.map((it) => ({ ...it, selected }));
}

/** Id các phần người dùng thực sự nhận — thứ DUY NHẤT được phép ghi vào Doc. */
export function selectedIds(items: CheckpointItem[]): string[] {
  return items.filter((it) => it.selected).map((it) => it.id);
}

/**
 * Trạng thái tick của cả danh sách — cho ô "Chọn tất cả" hiện đúng 3 dạng.
 * 'none' | 'some' | 'all'. Danh sách rỗng coi như 'none'.
 */
export function selectionState(items: CheckpointItem[]): 'none' | 'some' | 'all' {
  if (items.length === 0) return 'none';
  const n = items.filter((it) => it.selected).length;
  if (n === 0) return 'none';
  return n === items.length ? 'all' : 'some';
}

/**
 * Nút [Nhận] có bấm được không — và NẾU KHÔNG thì vì sao (luật §9: disabled phải kèm lý do,
 * cấm nút giả). Trả `reason: null` nghĩa là bấm được.
 */
export function acceptGate(items: CheckpointItem[]): { enabled: boolean; reason: string | null } {
  if (items.length === 0) {
    return { enabled: false, reason: 'Chưa có kết quả nào để nhận — chạy lại hoặc sửa tham số.' };
  }
  if (selectedIds(items).length === 0) {
    return { enabled: false, reason: 'Chưa chọn phần nào — tick ít nhất 1 mục để nhận.' };
  }
  return { enabled: true, reason: null };
}

/**
 * Chữ hiện trên thanh tiến độ. `progress` null = không đo được phần trăm (vd đang chờ máy chủ)
 * ⇒ hiện thời gian đã trôi, KHÔNG bịa phần trăm giả (bài học P1 nhập DWG: % giả tệ hơn không có %).
 */
export function formatProgress(progress: number | null, elapsedMs: number): string {
  if (progress === null || !Number.isFinite(progress)) {
    return `Đang chạy… ${Math.floor(elapsedMs / 1000)}s`;
  }
  const pct = Math.max(0, Math.min(1, progress));
  return `${Math.round(pct * 100)}%`;
}

/**
 * KS2 — chữ hiện cạnh seed. Seed `null` là HỢP LỆ nhưng phải nói thẳng là bước này không tái lập
 * được bằng seed, thay vì im lặng (im lặng = người dùng tưởng chạy lại sẽ ra y hệt).
 */
export function formatSeed(seed: string | number | null): string {
  if (seed === null || seed === '') return 'Bước này không dùng seed — chạy lại có thể ra khác.';
  return String(seed);
}

/**
 * KS "Làm lại" phải GIỮ NGUYÊN THAM SỐ CŨ (yêu cầu gốc phiếu S5: *"giữ nguyên tham số cũ để
 * người ta chỉnh một thứ rồi chạy lại"*). Hàm này gộp bản vá lên tham số cũ — KHÔNG thay cả cụm.
 * Giá trị `undefined` trong `patch` bị bỏ qua (không xoá mất tham số cũ).
 */
export function mergeParamsForRetry<T extends Record<string, unknown>>(prev: T, patch: Partial<T>): T {
  const out = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
