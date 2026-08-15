'use client';

/**
 * components/render-studio/render-queue-store.ts — [marker: RenderQueue] HÀNG ĐỢI RENDER THEO VIEW.
 *
 * VÌ SAO CÓ: chặng 3D chạy loạt 4-5 view một lượt. Trước đây tiến trình nằm RỜI RẠC trong từng
 * node (`node.data.run.progress`) — không có khung nhìn CẢ LOẠT: view nào đang chạy, còn bao lâu,
 * cái nào lỗi. Đây là "hàng đợi + dải kết quả" (NT-18) ở cấp VIEW, không phải cấp node.
 *
 * KHÔNG ĐẺ ENGINE MỚI (luật "một cỗ máy, nhiều mặt tiền"): job kiểu `node` gọi thẳng `runNode()`
 * của `lib/execution.ts` — đúng đường chạy đang có. Tiến trình là SỐ THẬT, đi nguyên chuỗi
 *   `runImageJob(onProgress)` (lib/ai/client.ts:42) → `def.execute()` → `store.setRunState(progress)`
 *   → hàng đợi này ĐỌC LẠI.
 * Không có spinner giả, không nội suy thêm số nào.
 *
 * HUỶ (T5): mỗi job một `AbortController`.
 *   · job đang XẾP HÀNG → gỡ khỏi hàng, không tốn gì.
 *   · job đang CHẠY → abort vòng chờ của hàng đợi NGAY + đặt `cancelRequested` lên `FlowRun`
 *     tương ứng; engine dừng ở RANH GIỚI NODE KẾ TIẾP (hành vi sẵn có của `executeRun`,
 *     lib/execution.ts:219 — cố ý không cắt giữa một lần gọi API để không bỏ rơi job phía
 *     provider). ⚠️ KHAI THẬT: lượt gọi API đang dở vẫn chạy nốt ở server; hàng đợi thôi đợi
 *     và thôi tính nó vào tiến trình.
 *
 * Job kiểu `demo` KHÔNG gọi mạng, KHÔNG tốn credit — dùng để nghiệm thu chuyển động/huỷ của
 * chính bảng này (xem `window.__ifRenderQueue` cuối file, chỉ bật ngoài production).
 */

import { create } from 'zustand';
import { useFlowStore, nextId, type FlowNode } from '@/lib/store';
import { runNode } from '@/lib/execution';
import { getDefinition } from '@/lib/nodes/registry';
import type { PortValue } from '@/lib/types';

export type RenderQueueStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

/** Nguồn của một job: node thật trong flow, hoặc job diễn tập (0 credit, chỉ để nghiệm thu UI). */
export type RenderQueueSource =
  | { kind: 'node'; nodeId: string }
  | { kind: 'demo'; durationMs: number; failAt?: number; resultUrl?: string };

export interface RenderQueueJob {
  id: string;
  /** Tên view hiện trên thẻ — lấy tên node/def lúc xếp hàng, không đổi về sau. */
  viewName: string;
  /** Ảnh nguồn (đầu vào) để nhận ra view bằng mắt trước khi có kết quả. */
  sourceUrl?: string;
  /** Ảnh kết quả — có thì thẻ đổi thumbnail sang ảnh này. */
  resultUrl?: string;
  status: RenderQueueStatus;
  /** 0–1, SỐ THẬT từ chuỗi onProgress. */
  progress: number;
  /** Lý do lỗi đã dịch sang tiếng người (engine đã qua `friendlyAiError`). */
  error?: string;
  queuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  source: RenderQueueSource;
}

interface RenderQueueState {
  jobs: RenderQueueJob[];
  /** Bảng mở rộng hay thu về pill. Mặc định THU (phiếu RQ mục 3). */
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  enqueue: (input: {
    viewName: string;
    sourceUrl?: string;
    source: RenderQueueSource;
  }) => string;
  patch: (id: string, p: Partial<RenderQueueJob>) => void;
  cancel: (id: string) => void;
  cancelAll: () => void;
  /** Dọn các thẻ đã kết thúc (xong/lỗi/huỷ) khỏi dải. */
  clearFinished: () => void;
}

/** AbortController theo jobId — sống ngoài store (không serialize được vào state). */
const aborters = new Map<string, AbortController>();
/** runId của FlowRun mà job đang bám theo — cần để đặt cancelRequested đúng lượt. */
const flowRunOf = new Map<string, string>();

export const useRenderQueue = create<RenderQueueState>((set, get) => ({
  jobs: [],
  expanded: false,
  setExpanded: (expanded) => set({ expanded }),

  enqueue: ({ viewName, sourceUrl, source }) => {
    const id = nextId('rq');
    const job: RenderQueueJob = {
      id,
      viewName,
      sourceUrl,
      status: 'queued',
      progress: 0,
      queuedAt: Date.now(),
      source,
    };
    set((s) => ({ jobs: [...s.jobs, job].slice(-60) }));
    void drain();
    return id;
  },

  patch: (id, p) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) })),

  cancel: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job || job.status === 'done' || job.status === 'error' || job.status === 'cancelled') return;
    // Đang chạy: báo engine dừng ở ranh giới node kế tiếp rồi thôi đợi.
    const runId = flowRunOf.get(id);
    if (runId) useFlowStore.getState().updateFlowRun(runId, { cancelRequested: true });
    aborters.get(id)?.abort();
    get().patch(id, { status: 'cancelled', finishedAt: Date.now() });
  },

  cancelAll: () => {
    for (const j of get().jobs) {
      if (j.status === 'queued' || j.status === 'running') get().cancel(j.id);
    }
  },

  clearFinished: () =>
    set((s) => ({ jobs: s.jobs.filter((j) => j.status === 'queued' || j.status === 'running') })),
}));

/* ────────────────────────────── BỘ RÚT HÀNG ĐỢI (tuần tự tuyệt đối) ───────────────────────── */

let draining = false;

/**
 * Rút hàng đợi 1 job/lượt — CỐ Ý không chạy song song: mỗi lượt render là tiền thật, chạy song
 * song vừa đốt credit vừa làm số phần trăm mất nghĩa (cùng lúc 5 cái nhích thì không đọc được
 * cái nào sắp xong).
 */
async function drain(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    for (;;) {
      const next = useRenderQueue.getState().jobs.find((j) => j.status === 'queued');
      if (!next) break;
      await runOne(next.id);
    }
  } finally {
    draining = false;
  }
}

async function runOne(jobId: string): Promise<void> {
  const store = useRenderQueue.getState();
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job || job.status !== 'queued') return;

  const ac = new AbortController();
  aborters.set(jobId, ac);
  store.patch(jobId, { status: 'running', progress: 0, startedAt: Date.now() });

  try {
    if (job.source.kind === 'demo') {
      await runDemo(jobId, job.source, ac.signal);
    } else {
      await runNodeJob(jobId, job.source.nodeId, ac.signal);
    }
  } catch (err) {
    if (!ac.signal.aborted) {
      useRenderQueue
        .getState()
        .patch(jobId, {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
          finishedAt: Date.now(),
        });
    }
  } finally {
    aborters.delete(jobId);
    flowRunOf.delete(jobId);
  }
}

/** Chờ có điều kiện, tỉnh dậy mỗi lần store đổi — không polling theo nhịp bịa ra. */
function waitFor(check: () => boolean, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Đã huỷ', 'AbortError'));
    if (check()) return resolve();
    const done = () => {
      unsub();
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      done();
      reject(new DOMException('Đã huỷ', 'AbortError'));
    };
    const unsub = useFlowStore.subscribe(() => {
      if (check()) {
        done();
        resolve();
      }
    });
    signal.addEventListener('abort', onAbort);
  });
}

/**
 * Job THẬT: đẩy node qua `runNode()` (engine sẵn có) rồi bám theo `FlowRun` + `node.data.run`.
 * Mọi con số ở đây là số engine đã ghi, hàng đợi không tự sinh số nào.
 */
async function runNodeJob(jobId: string, nodeId: string, signal: AbortSignal): Promise<void> {
  const rq = useRenderQueue.getState();
  const runId = await runNode(nodeId);
  if (!runId) {
    rq.patch(jobId, {
      status: 'error',
      error: 'Không xếp hàng được lượt chạy (flow chỉ-đọc hoặc graph có vòng lặp).',
      finishedAt: Date.now(),
    });
    return;
  }
  flowRunOf.set(jobId, runId);

  // Relay tiến trình node → thẻ hàng đợi, chừng nào lượt chạy chưa kết thúc.
  const unsub = useFlowStore.subscribe((s) => {
    const n = s.nodes.find((x) => x.id === nodeId) as FlowNode | undefined;
    const p = n?.data.run.progress;
    if (typeof p === 'number') useRenderQueue.getState().patch(jobId, { progress: p });
  });

  try {
    await waitFor(() => {
      const run = useFlowStore.getState().flowRuns.find((r) => r.id === runId);
      return !!run && (run.status === 'done' || run.status === 'error' || run.status === 'cancelled');
    }, signal);
  } finally {
    unsub();
  }

  const run = useFlowStore.getState().flowRuns.find((r) => r.id === runId);
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId) as FlowNode | undefined;
  if (run?.status === 'cancelled') {
    useRenderQueue.getState().patch(jobId, { status: 'cancelled', finishedAt: Date.now() });
    return;
  }
  if (run?.status === 'error' || node?.data.run.status === 'error') {
    useRenderQueue.getState().patch(jobId, {
      status: 'error',
      error: node?.data.run.error || 'Lượt chạy thất bại.',
      finishedAt: Date.now(),
    });
    return;
  }
  useRenderQueue.getState().patch(jobId, {
    status: 'done',
    progress: 1,
    resultUrl: firstImageOut(node),
    finishedAt: Date.now(),
  });
}

/** Job diễn tập — 0 credit, 0 gọi mạng. Chỉ dùng nghiệm thu chuyển động + huỷ của bảng này. */
function runDemo(
  jobId: string,
  src: { kind: 'demo'; durationMs: number; failAt?: number; resultUrl?: string },
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / src.durationMs);
      if (src.failAt != null && p >= src.failAt) {
        cleanup();
        useRenderQueue.getState().patch(jobId, {
          status: 'error',
          error: 'Backend AI chưa chạy — job diễn tập dựng sẵn tình huống lỗi.',
          finishedAt: Date.now(),
        });
        return resolve();
      }
      useRenderQueue.getState().patch(jobId, { progress: p });
      if (p >= 1) {
        cleanup();
        useRenderQueue.getState().patch(jobId, {
          status: 'done',
          progress: 1,
          resultUrl: src.resultUrl,
          finishedAt: Date.now(),
        });
        resolve();
      }
    }, 120);
    const onAbort = () => {
      cleanup();
      reject(new DOMException('Đã huỷ', 'AbortError'));
    };
    function cleanup() {
      window.clearInterval(tick);
      signal.removeEventListener('abort', onAbort);
    }
    signal.addEventListener('abort', onAbort);
  });
}

/* ─────────────────────────────────── tra cứu ảnh của node ───────────────────────────────────── */

function firstImage(rec: Record<string, PortValue | undefined> | undefined): string | undefined {
  if (!rec) return undefined;
  for (const v of Object.values(rec)) {
    if (v && v.dataType === 'image' && typeof v.value === 'string' && v.value) return v.value;
  }
  return undefined;
}

/** Ảnh KẾT QUẢ của node (cổng ra kiểu image đầu tiên). */
export function firstImageOut(node: FlowNode | undefined): string | undefined {
  return firstImage(node?.data.run.outputs);
}

/** Ảnh NGUỒN của node: lần theo edge vào, lấy output ảnh của node upstream đã chạy. */
export function sourceImageOf(nodeId: string): string | undefined {
  const { nodes, edges } = useFlowStore.getState();
  for (const e of edges) {
    if (e.target !== nodeId) continue;
    const src = nodes.find((n) => n.id === e.source) as FlowNode | undefined;
    const out = src?.data.run.outputs?.[e.sourceHandle ?? ''];
    if (out && out.dataType === 'image' && typeof out.value === 'string' && out.value) return out.value;
    const any = firstImageOut(src);
    if (any) return any;
  }
  return undefined;
}

/** Tên view hiển thị: tên công cụ của node (def.title). */
export function viewNameOf(node: FlowNode): string {
  try {
    return getDefinition(node.data.defType).title || node.data.defType;
  } catch {
    return node.data.defType;
  }
}

/**
 * "Thêm vào hàng đợi": xếp mọi node ĐANG CHỌN trên canvas vào hàng đợi (bỏ node đã xong và
 * không đổi đầu vào — engine vốn cache-skip, xếp vào chỉ tạo thẻ rỗng nghĩa).
 * Trả về số job đã thêm.
 */
export function enqueueSelectedNodes(): number {
  const { nodes } = useFlowStore.getState();
  const picked = (nodes as FlowNode[]).filter((n) => n.selected && n.type === 'interior');
  let added = 0;
  for (const n of picked) {
    useRenderQueue.getState().enqueue({
      viewName: viewNameOf(n),
      sourceUrl: sourceImageOf(n.id) ?? firstImageOut(n),
      source: { kind: 'node', nodeId: n.id },
    });
    added++;
  }
  return added;
}

/**
 * ƯỚC thời gian còn lại — CHỈ tính khi đã có job xong để lấy nhịp thật; chưa có thì trả `null`
 * và bảng ghi "—". Không bịa số (N1 tội ④).
 */
export function estimateRemainingMs(jobs: RenderQueueJob[]): number | null {
  const done = jobs.filter((j) => j.status === 'done' && j.startedAt && j.finishedAt);
  if (done.length === 0) return null;
  const avg = done.reduce((s, j) => s + (j.finishedAt! - j.startedAt!), 0) / done.length;
  const queued = jobs.filter((j) => j.status === 'queued').length;
  const running = jobs.find((j) => j.status === 'running');
  let ms = queued * avg;
  if (running) ms += Math.max(0, avg * (1 - running.progress));
  return Math.round(ms);
}

/* ───────────────────────────── cửa nghiệm thu (ngoài production) ────────────────────────────── */

declare global {
  interface Window {
    __ifRenderQueue?: {
      demo: (n?: number) => void;
      demoFail: () => void;
      state: () => RenderQueueJob[];
      cancelAll: () => void;
      clear: () => void;
    };
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Ảnh diễn tập lấy từ `public/demo/` — bộ ảnh trung tính sẵn có của app, KHÔNG phải render
  // của dự án khách nào (luật trung tính).
  const VIEWS: { name: string; src: string; out: string }[] = [
    { name: 'Phòng khách · góc 1', src: '/demo/clay-in.jpg', out: '/demo/clay-out.png' },
    { name: 'Bếp · đảo bếp', src: '/demo/sketch-in.jpg', out: '/demo/sketch-out.png' },
    { name: 'Phòng ngủ chính', src: '/demo/mood1.jpg', out: '/demo/mood2.jpg' },
    { name: 'Sảnh thang', src: '/demo/mood3.jpg', out: '/demo/mood4.jpg' },
    { name: 'Hành lang tầng 2', src: '/demo/clay-4k.jpg', out: '/demo/clay-out.png' },
  ];
  window.__ifRenderQueue = {
    demo: (n = 3) => {
      useRenderQueue.getState().setExpanded(true);
      for (let i = 0; i < n; i++) {
        const v = VIEWS[i % VIEWS.length];
        useRenderQueue.getState().enqueue({
          viewName: v.name,
          sourceUrl: v.src,
          source: { kind: 'demo', durationMs: 9000 + i * 3000, resultUrl: v.out },
        });
      }
    },
    demoFail: () => {
      useRenderQueue.getState().setExpanded(true);
      useRenderQueue.getState().enqueue({
        viewName: 'Phòng tắm · gương lớn',
        sourceUrl: '/demo/mood2.jpg',
        source: { kind: 'demo', durationMs: 8000, failAt: 0.45 },
      });
    },
    state: () => useRenderQueue.getState().jobs,
    cancelAll: () => useRenderQueue.getState().cancelAll(),
    clear: () => useRenderQueue.setState({ jobs: [] }),
  };
}
