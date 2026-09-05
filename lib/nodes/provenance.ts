/**
 * lib/nodes/provenance.ts — NGUỒN GỐC một kết quả node, SUY từ dữ liệu ĐÃ CÓ (Slice 10, 03/09).
 *
 * ── LOOK INSIDE TRƯỚC (luật B25) ─────────────────────────────────────────────────────────────
 *  · Bộ node render-v2/grounded-render đã ghi port ẩn `_tier` ("Tầng AI · …" / "Tầng lõi tất định
 *    …") — `NodeExtras.tsx` hiện badge. ⇒ ĐÂY là nguồn sự thật #1, file này chỉ ĐỌC nó.
 *  · `NodeRunState.inputHash` (lib/types.ts) = dấu "chạy lại y hệt thì cache-skip" (idempotent
 *    rerun của `execNode()`), `status`/`error` = trạng thái + lỗi đã dịch tiếng người.
 *  · Node AI đời đầu (registry.ts `aiImages()`) KHÔNG ghi `_tier`; khi provider chưa sẵn sàng nó
 *    trả ảnh MOCK là SVG data-URI có chữ "mock" trong nhãn. ⇒ nhận diện mock bằng dấu vết đó, và
 *    KHAI RÕ là "suy đoán từ dấu vết", không phải khẳng định.
 * ⇒ File này KHÔNG thêm trường mới vào run-state, KHÔNG đụng `lib/execution.ts` (ngoài vùng).
 *    Nó là mặt tiền đọc: một chỗ dịch run-state thành "cái này từ đâu ra" cho UI đường dẫn.
 *
 * Import TƯƠNG ĐỐI (test qua sucrase-node).
 */
import type { NodeRunState, PortValue } from '../types';

export type ProvenanceKind =
  | 'deterministic' // tầng lõi tất định — không AI, 0đ, chạy 10 lần ra 10 kết quả giống nhau
  | 'ai' // tầng AI thật đã chạy (có ghi tầng/model)
  | 'mock' // ảnh giữ chỗ vì provider chưa sẵn sàng — KHÔNG phải kết quả thật
  | 'ai-unlabelled' // node tốn credit, đã done, nhưng không ghi tầng — không biết provider nào
  | 'none'; // chưa chạy / đang chạy / lỗi — chưa có kết quả để nói nguồn gốc

export interface Provenance {
  kind: ProvenanceKind;
  /** nhãn ngắn cho chip (VI) */
  label: string;
  labelEn: string;
  /** chuỗi `_tier` nguyên văn nếu có — tooltip */
  detail?: string;
  /** kết quả ĐÃ được cache theo inputHash — chạy lại y hệt sẽ không tốn credit */
  cached: boolean;
}

/** Hình dạng tối thiểu của node mà hàm cần — không import FlowNode (kéo store/React Flow). */
export interface ProvenanceInput {
  run: Pick<NodeRunState, 'status' | 'outputs' | 'inputHash'>;
  creditCost: number;
}

const MOCK_SVG_PREFIX = 'data:image/svg+xml';

/** Dấu vết mock của `aiImages()` (registry.ts): SVG data-URI, nhãn có chữ "mock". */
export function looksLikeMockImage(v: PortValue | undefined): boolean {
  if (!v || v.dataType !== 'image' || typeof v.value !== 'string') return false;
  if (!v.value.startsWith(MOCK_SVG_PREFIX)) return false;
  try {
    return /mock/i.test(decodeURIComponent(v.value));
  } catch {
    return /mock/i.test(v.value);
  }
}

export function deriveProvenance(input: ProvenanceInput): Provenance {
  const { run, creditCost } = input;
  const cached = Boolean(run.inputHash) && run.status === 'done';
  if (run.status !== 'done' || !run.outputs) {
    return { kind: 'none', label: 'Chưa có kết quả', labelEn: 'No result yet', cached: false };
  }
  const tier = run.outputs._tier;
  const tierText = tier && typeof tier.value === 'string' ? tier.value : '';
  if (tierText) {
    if (/^Tầng AI/i.test(tierText)) {
      return { kind: 'ai', label: 'AI', labelEn: 'AI', detail: tierText, cached };
    }
    if (/tất định|Tất định/.test(tierText)) {
      return { kind: 'deterministic', label: 'Tất định', labelEn: 'Deterministic', detail: tierText, cached };
    }
  }
  const anyMock = Object.values(run.outputs).some(looksLikeMockImage);
  if (anyMock) {
    return { kind: 'mock', label: 'Mock (giữ chỗ)', labelEn: 'Mock (placeholder)', detail: tierText || undefined, cached };
  }
  if (creditCost === 0) {
    return { kind: 'deterministic', label: 'Tất định', labelEn: 'Deterministic', detail: tierText || undefined, cached };
  }
  return { kind: 'ai-unlabelled', label: 'AI (không ghi tầng)', labelEn: 'AI (tier not recorded)', detail: tierText || undefined, cached };
}

/** Kết quả này có được coi là "thật" để đi tiếp sang hồ sơ không. Mock = KHÔNG. */
export function isTrustworthy(p: Provenance): boolean {
  return p.kind === 'deterministic' || p.kind === 'ai' || p.kind === 'ai-unlabelled';
}
