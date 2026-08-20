'use client';

/**
 * lib/capabilities/render.ts — NĂNG LỰC `render` (P0) + KHO KẾT QUẢ ĐÃ NHẬN dùng chung với
 * `motion.ts`.
 *
 * ── LOOK INSIDE TRƯỚC (luật B25 NO-REBUILD — negative evidence, đo 20/08) ──────────────────────
 * Thứ ĐÃ CÓ và file này CHỈ TRỎ VÀO, tuyệt đối không dựng lại:
 *   · `components/render-studio/render-queue-store.ts` — HÀNG ĐỢI THẬT (nghiệm thu 15/08): tuần
 *     tự, `AbortController`, huỷ, tiến trình SỐ THẬT relay từ `runNode()`. ⇒ mọi việc chạy ở đây
 *     đi qua đúng hàng đợi đó. KHÔNG đẻ job model thứ hai (§20 phiếu Frontier).
 *   · `lib/execution.ts` `runNode()` — engine chạy node + upstream, trừ credit, cache-skip,
 *     `friendlyAiError`. ⇒ không gọi provider trực tiếp từ đây.
 *   · `lib/nodes/registry.ts` — `input.image` · `ai.clay2render` · `ai.upscale` đã có thật, có
 *     provider, có credit khai sẵn. ⇒ ba chế độ dưới đây chỉ là BA CÁCH GHÉP các node đó.
 *   · `lib/three/capture.ts` — chụp offscreen đã có, nhưng đặt camera qua `CameraSpec`/
 *     `placeCamera` (khung suy từ bbox), KHÔNG chụp được ĐÚNG góc người dùng đang orbit. Phần
 *     thiếu duy nhất là "chụp tại pose sống" ⇒ `components/three/capture-live.ts` (30 dòng, dùng
 *     lại `buildMergedGeometries` + `nearFarForScene` đã export). Không viết engine 3D thứ hai.
 *   · `lib/present-editor/handoff.ts` — CẦU RENDER→PRESENT ĐÃ CÓ (`stashPresentHandoffWithIds`,
 *     consume-once, id ổn định `renderImageId`). ⇒ cầu sang Trình chiếu là CONNECT, không phải
 *     cầu mới.
 *   · `lib/ui/tien-trinh.ts` — nhánh không-đo-được. Hàng đợi có số thật nên nhánh đó chỉ dùng cho
 *     lúc CHỜ XẾP HÀNG.
 * ⇒ Thứ chưa tồn tại và là toàn bộ nội dung file này: (1) bảng BA CHẾ ĐỘ khai thật khả năng,
 *   (2) bản ghi PROVENANCE của một kết quả, (3) cờ CŨ khi nguồn đổi, (4) kho "đã Nhận".
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ────────────────────────────────────────────────────────────────────────
 *  ① CẤM KHAI KHỐNG. Chế độ nào backend không làm được thì `sanSang:false` + lý do THẬT.
 *    ⛔ Không chỗ nào trong hệ này được gọi là "ray tracing" — không có bộ dò tia nào chạy.
 *  ② NGUỒN ĐỔI ⇒ CHỈ ĐÁNH DẤU CŨ, KHÔNG TỰ SINH LẠI. Sinh lại là tiền thật; máy không tiêu tiền
 *    thay người (§19 + luật con-người-quyết-cuối [T5]).
 *  ③ Ảnh/phim là `khongPhaiSoDo` (compound.ts `MucSuThat`) — KHÔNG mang con số nào vào BOQ
 *    (chốt 15/08: "BOQ chỉ nhận số đo được").
 *  ④ Kết quả máy sinh ra là ĐỀ XUẤT: `xemTruoc` → người bấm Nhận mới thành tài sản.
 */

import { create } from 'zustand';
import type { Connection } from '@xyflow/react';
import { useFlowStore, type FlowNode } from '@/lib/store';
import { useRenderQueue } from '@/components/render-studio/render-queue-store';
import { cheDoTheoId, type BanGhiKetQua, type CheDoRenderId, type KhungMayQuay } from './render-core';

/** MỘT CỬA cho nơi gọi: phần thuần nằm ở `render-core.ts` (test được dưới sucrase-node), phần
 * chạm store nằm ở đây. Nơi gọi cứ import từ `render.ts`. */
export * from './render-core';

/* ══════════════════════════════ ④ KHO KẾT QUẢ (đã Nhận) ══════════════════════════════ */

const KHO_KEY = 'if.capabilities.ketqua.v1';
/** Trần bản ghi — kho này qua localStorage, ảnh chụp offscreen là data URI rất nặng. */
const TRAN_KHO = 24;

interface KhoKetQuaState {
  items: BanGhiKetQua[];
  them: (bg: BanGhiKetQua) => void;
  capNhat: (id: string, p: Partial<BanGhiKetQua>) => void;
  nhan: (id: string) => void;
  bo: (id: string) => void;
}

function docKho(): BanGhiKetQua[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KHO_KEY);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as BanGhiKetQua[]) : [];
  } catch {
    return [];
  }
}

/**
 * Ghi kho — CHỈ bản đã Nhận mới xuống đĩa (bản xem trước là nháp, hết phiên là thôi), và data URI
 * quá nặng thì bỏ qua thay vì làm vỡ localStorage của cả app.
 */
function ghiKho(items: BanGhiKetQua[]): void {
  if (typeof window === 'undefined') return;
  const luu = items.filter((i) => i.trangThai === 'daNhan').slice(-TRAN_KHO);
  try {
    window.localStorage.setItem(KHO_KEY, JSON.stringify(luu));
  } catch {
    // Quota đầy: bỏ bản nặng nhất (data URI) rồi thử lại đúng một lần. Không im lặng nuốt hết —
    // thất bại lần hai thì kho chỉ sống trong phiên, và UI vẫn hiện đủ.
    try {
      window.localStorage.setItem(
        KHO_KEY,
        JSON.stringify(luu.filter((i) => !i.url.startsWith('data:'))),
      );
    } catch {
      /* kho chỉ còn trong bộ nhớ phiên này */
    }
  }
}

export const useKhoKetQua = create<KhoKetQuaState>((set, get) => ({
  items: docKho(),
  them: (bg) =>
    set((s) => {
      const items = [...s.items, bg].slice(-TRAN_KHO * 2);
      ghiKho(items);
      return { items };
    }),
  capNhat: (id, p) =>
    set((s) => {
      const items = s.items.map((i) => (i.id === id ? { ...i, ...p } : i));
      ghiKho(items);
      return { items };
    }),
  nhan: (id) => get().capNhat(id, { trangThai: 'daNhan' }),
  bo: (id) =>
    set((s) => {
      const items = s.items.filter((i) => i.id !== id);
      ghiKho(items);
      return { items };
    }),
}));

let demBanGhi = 0;
export function idBanGhi(prefix: string): string {
  demBanGhi += 1;
  return `${prefix}_${Date.now().toString(36)}_${demBanGhi}`;
}

/* ══════════════════════ ⑤ DỰNG DÂY CHUYỀN THẬT RỒI ĐẨY VÀO HÀNG ĐỢI ══════════════════ */

/**
 * Thêm một node vào flow và trả về id của nó.
 * `useFlowStore.addNode` cố ý KHÔNG trả id (lib/store.ts:686 — ngoài vùng ghi của lượt này), nên
 * đọc lại node cuối. An toàn vì `addNode` là đồng bộ và zustand `set` xong ngay trong lời gọi.
 */
function themNode(defType: string, position: { x: number; y: number }): string {
  const st = useFlowStore.getState();
  st.addNode(defType, position);
  const nodes = useFlowStore.getState().nodes;
  const cuoi = nodes[nodes.length - 1];
  if (!cuoi) throw new Error(`Không thêm được node ${defType} vào flow.`);
  return cuoi.id;
}

function noi(source: string, sourceHandle: string, target: string, targetHandle: string): void {
  useFlowStore.getState().onConnect({ source, target, sourceHandle, targetHandle } as Connection);
}

export interface YeuCauRender {
  /** PNG khối xám vừa chụp từ viewport (data URI). */
  anhKhoi: string;
  cheDo: CheDoRenderId;
  /** Phong cách của `ai.clay2render` (STYLE_OPTIONS). */
  phongCach: string;
  camera: KhungMayQuay;
  sceneRev: string;
  ten: string;
  provider: string;
  /** Góc đặt chuỗi node trên canvas — để chuỗi không chồng lên nhau. */
  goc?: { x: number; y: number };
}

/**
 * Dựng chuỗi node THẬT (`input.image` → `ai.clay2render` [→ `ai.upscale`]) rồi xếp vào HÀNG ĐỢI
 * SẴN CÓ. Trả `{ jobId, nodeId, banGhiId }`.
 *
 * Vì sao dựng node thật thay vì gọi thẳng provider: node là nơi duy nhất có credit, cache-skip,
 * huỷ, dịch lỗi, và là thứ người dùng mở lại xem/chỉnh được ở mode Node — đúng luật một-nguồn.
 */
export function chayRender(yc: YeuCauRender): { jobId: string; nodeId: string; banGhiId: string } {
  const cheDo = cheDoTheoId(yc.cheDo);
  if (!cheDo.lenhNoiBo.length)
    throw new Error('Chế độ này không chạy qua hàng đợi — nó là bản chụp tại chỗ.');

  const g = yc.goc ?? { x: 80, y: 80 };
  const idAnh = themNode('input.image', { x: g.x, y: g.y });
  useFlowStore.getState().updateParam(idAnh, 'file', yc.anhKhoi);

  const idRender = themNode('ai.clay2render', { x: g.x + 300, y: g.y });
  useFlowStore.getState().updateParam(idRender, 'style', yc.phongCach);
  noi(idAnh, 'image', idRender, 'image');

  let cuoi = idRender;
  if (cheDo.lenhNoiBo.includes('ai.upscale')) {
    const idUp = themNode('ai.upscale', { x: g.x + 600, y: g.y });
    useFlowStore.getState().updateParam(idUp, 'scale', '2');
    noi(idRender, 'image', idUp, 'image');
    cuoi = idUp;
  }

  const banGhiId = idBanGhi('kq');
  useKhoKetQua.getState().them({
    id: banGhiId,
    loai: 'anh',
    url: '',
    ten: yc.ten,
    cheDo: yc.cheDo,
    camera: yc.camera,
    sceneRev: yc.sceneRev,
    provider: yc.provider,
    credit: cheDo.credit,
    nodeId: cuoi,
    thamSo: { phongCach: yc.phongCach, rongPx: cheDo.rongPx },
    trangThai: 'xemTruoc',
    luc: Date.now(),
  });

  const jobId = useRenderQueue.getState().enqueue({
    viewName: yc.ten,
    sourceUrl: yc.anhKhoi,
    source: { kind: 'node', nodeId: cuoi },
  });

  return { jobId, nodeId: cuoi, banGhiId };
}

/** Cổng ra đầu tiên đúng kiểu của một node đã chạy xong — dùng chung cho ảnh lẫn phim. */
export function ketQuaCuaNode(nodeId: string, dataType: 'image' | 'video'): string | undefined {
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId) as FlowNode | undefined;
  const outs = node?.data.run.outputs;
  if (!outs) return undefined;
  for (const v of Object.values(outs)) {
    if (v && v.dataType === dataType && typeof v.value === 'string' && v.value) return v.value;
  }
  return undefined;
}
