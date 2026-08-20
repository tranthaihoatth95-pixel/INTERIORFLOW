'use client';

/**
 * lib/capabilities/visual-generate-run.ts — TAY THI HÀNH của năng lực "Dựng hình ảnh".
 *
 * Kế hoạch do `visual-generate.ts` (thuần) dựng; file này chỉ đem nó **đi qua đường chạy SẴN CÓ**.
 *
 * ── ĐIỀU QUAN TRỌNG NHẤT: KHÔNG CÓ EXECUTOR THỨ HAI ────────────────────────────────────────────
 * File này KHÔNG gọi provider, KHÔNG `fetch`, KHÔNG đụng `lib/ai/*`. Nó dựng một **đồ thị con tạm**
 * bằng đúng các node đã có trong `lib/nodes/registry.ts`, rồi gọi `runNode()` của
 * `lib/execution.ts`. Nhờ vậy nó thừa hưởng NGUYÊN VẸN, không viết lại dòng nào:
 *   · hàng đợi tuần tự + `FlowRun` (`enqueueFlowRun`/`drainQueue`) — §20 không đẻ job model thứ hai
 *   · kế toán credit (client khi chưa đăng nhập · `/api/jobs` nguyên tử khi đã đăng nhập)
 *   · cache theo input-hash (chạy lại cùng đầu vào ⇒ không tính tiền lần nữa)
 *   · `friendlyAiError()` — provider chết thì ra câu người đọc được, KHÔNG phải "fetch failed"
 *   · `estimateRunCredit()` — nói giá TRƯỚC khi tiêu
 *
 * ── VÌ SAO DÙNG ĐỒ THỊ CON TẠM, KHÔNG GỌI `def.execute()` THẲNG ────────────────────────────────
 * Gọi thẳng `execute()` là đi vòng qua hàng đợi, qua kế toán credit và qua cache — tức dựng lại
 * một đường chạy song song với `execNode()`. Đó đúng là "executor thứ hai" mà phiếu cấm. Đồ thị
 * con tạm đắt hơn vài dòng code, nhưng mọi bảo đảm ở trên là MIỄN PHÍ và không thể lệch.
 *
 * ── DỌN RÁC ────────────────────────────────────────────────────────────────────────────────────
 * Node/edge tạm được gỡ ở `finally`, kể cả khi lỗi hoặc bị huỷ. Ghi/xoá bằng `setState` thẳng chứ
 * KHÔNG qua `addNode`/`deleteNode`: hai hàm đó gọi `snapshot()` ⇒ mỗi lượt dựng sẽ nhét 2N bước
 * vào undo stack của người dùng — rác đúng nghĩa. `hoanTat()` kiểm đếm trước = sau.
 */

import type { Edge } from '@xyflow/react';
import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { useFlowStore, nextId, type FlowNode } from '@/lib/store';
import { estimateRunCredit, runNode } from '@/lib/execution';
import {
  dungKeHoach,
  dungXuatXu,
  chuoiHopLe,
  loiHienThi,
  sanSangDung,
  type BuocLenh,
  type DeXuatHinhAnh,
  type TienDoDung,
  type YeuCauDung,
} from './visual-generate';

export interface KetQuaDung {
  readonly ok: boolean;
  readonly deXuat?: DeXuatHinhAnh;
  /** Lỗi đã dịch sang lời người dùng (đường `friendlyAiError` của `execNode`). */
  readonly loi?: string;
}

export interface TuyChonDung {
  /** Báo tiến độ cho giao diện. Gọi nhiều lần trong một lượt. */
  readonly onTienDo?: (t: TienDoDung) => void;
}

/** Cổng vào ảnh của mọi node trong chuỗi đều tên `image` (đã đọc registry) — hằng hoá cho rõ. */
const CONG_ANH = 'image';
const CONG_PROMPT = 'prompt';

function nodeTam(defType: string, thamSo: Record<string, string | number>, x: number, y: number): FlowNode {
  const def = getDefinition(defType);
  return {
    id: nextId('vgtmp'),
    type: 'interior',
    position: { x, y },
    // Đặt ngoài khung nhìn thường trực: lượt dựng không được làm canvas người dùng nhảy chỗ.
    hidden: true,
    data: { defType, params: { ...defaultParams(def), ...thamSo }, run: { status: 'idle', progress: 0 } },
  } as FlowNode;
}

function coCongPrompt(defType: string): boolean {
  return getDefinition(defType).inputs.some((p) => p.id === CONG_PROMPT);
}

/**
 * Chạy một lượt "Dựng hình ảnh".
 *
 * Trả về ĐỀ XUẤT (`trangThaiNhan: 'deXuat'`) — không ghi vào đâu cả. Nhận hay bỏ là việc của
 * người, ở `nguon-anh.ts`. Đây là chỗ luật "máy sinh là đề xuất" được thi hành bằng kiểu dữ liệu
 * chứ không bằng lời nhắc.
 */
export async function chayDungHinhAnh(yc: YeuCauDung, opts: TuyChonDung = {}): Promise<KetQuaDung> {
  const cong = sanSangDung({ coAnhNguon: Boolean(yc.anhNguon) });
  if (!cong.sanSang) return { ok: false, loi: cong.lyDo?.[0] };

  const chuoi = dungKeHoach(yc);
  if (!chuoi.length) return { ok: false, loi: 'Không dựng được chuỗi lệnh cho nguồn này.' };
  if (!chuoiHopLe(chuoi)) {
    // Lưới an toàn cho mục ⑤ negative evidence — nếu ai đó thêm node lạ vào kế hoạch, DỪNG ở đây
    // thay vì chạy một node ngoài phạm vi năng lực đã khai.
    return { ok: false, loi: 'Chuỗi lệnh có node ngoài phạm vi năng lực — dừng, không chạy.' };
  }

  const tongBuoc = chuoi.length;
  let soBuocXong = 0;
  const bao = (patch: Partial<TienDoDung>) =>
    opts.onTienDo?.({ trangThai: 'running', soBuocXong, tongBuoc, ...patch });

  const soNodeTruoc = useFlowStore.getState().nodes.length;
  const soEdgeTruoc = useFlowStore.getState().edges.length;

  const nodesTam: FlowNode[] = [];
  const edgesTam: Edge[] = [];

  const anhNode = nodeTam('input.image', { file: yc.anhNguon as string }, -4000, -4000);
  nodesTam.push(anhNode);

  const yDinh = yc.yDinh.trim();
  const promptNode = yDinh ? nodeTam('input.prompt', { prompt: yDinh }, -4000, -3800) : undefined;
  if (promptNode) nodesTam.push(promptNode);

  let nguonAnhId = anhNode.id;
  const nodeTheoBuoc: { buoc: BuocLenh; id: string }[] = [];
  chuoi.forEach((buoc, i) => {
    const n = nodeTam(buoc.node, { ...buoc.thamSo }, -3700 + i * 260, -4000);
    nodesTam.push(n);
    edgesTam.push({ id: nextId('vgedge'), source: nguonAnhId, sourceHandle: CONG_ANH, target: n.id, targetHandle: CONG_ANH });
    if (promptNode && coCongPrompt(buoc.node)) {
      edgesTam.push({ id: nextId('vgedge'), source: promptNode.id, sourceHandle: 'text', target: n.id, targetHandle: CONG_PROMPT });
    }
    nodeTheoBuoc.push({ buoc, id: n.id });
    nguonAnhId = n.id;
  });

  const idTam = new Set(nodesTam.map((n) => n.id));
  // Ghi thẳng: KHÔNG qua addNode/onConnect (chúng gọi snapshot() ⇒ rác undo stack).
  useFlowStore.setState((s) => ({ nodes: [...s.nodes, ...nodesTam], edges: [...s.edges, ...edgesTam] }));

  try {
    const creditUocTinh = estimateRunCredit(nodeTheoBuoc.map((b) => b.id));
    opts.onTienDo?.({ trangThai: 'queued', soBuocXong: 0, tongBuoc });

    const cuoi = nodeTheoBuoc[nodeTheoBuoc.length - 1].id;
    const runId = await runNode(cuoi);
    if (!runId) return { ok: false, loi: 'Đang ở chế độ chỉ đọc — không chạy được.' };

    // Chờ hàng đợi CÓ SẴN chạy xong. Chỉ ĐỌC trạng thái, không tự điều phối lại — điều phối là
    // việc của `drainQueue()` trong `lib/execution.ts`.
    for (;;) {
      const run = useFlowStore.getState().flowRuns.find((r) => r.id === runId);
      if (!run) break;
      const xong = nodeTheoBuoc.filter(
        (b) => useFlowStore.getState().nodes.find((n) => n.id === b.id)?.data.run.status === 'done',
      ).length;
      if (xong !== soBuocXong) {
        soBuocXong = xong;
        bao({});
      }
      if (run.status === 'done' || run.status === 'error' || run.status === 'cancelled') {
        if (run.status !== 'done') {
          const loiNode = nodeTheoBuoc
            .map((b) => useFlowStore.getState().nodes.find((n) => n.id === b.id)?.data.run.error)
            .find(Boolean);
          const loi = loiHienThi(run.status, loiNode);
          opts.onTienDo?.({ trangThai: run.status, soBuocXong, tongBuoc, loi });
          return { ok: false, loi };
        }
        break;
      }
      await new Promise((r) => setTimeout(r, 160));
    }

    const nodeCuoi = useFlowStore.getState().nodes.find((n) => n.id === cuoi);
    const anh = nodeCuoi?.data.run.outputs?.[CONG_ANH]?.value;
    if (typeof anh !== 'string' || !anh) {
      const loi = 'Lượt dựng xong nhưng không có ảnh trả về.';
      opts.onTienDo?.({ trangThai: 'error', soBuocXong, tongBuoc, loi });
      return { ok: false, loi };
    }

    soBuocXong = tongBuoc;
    opts.onTienDo?.({ trangThai: 'done', soBuocXong, tongBuoc });

    return {
      ok: true,
      deXuat: {
        id: nextId('dexuat'),
        anh,
        anhTruoc: yc.anhNguon,
        // provider/model CỐ Ý bỏ trống: đường chạy cũ (`execNode` → `def.execute`) hôm nay
        // KHÔNG trả tên provider/model ra ngoài. Bịa một cái tên vào xuất xứ còn tệ hơn để trống —
        // xuất xứ mà sai thì cả cơ chế truy-về-một-nguồn mất giá trị.
        xuatXu: dungXuatXu({ yeuCau: yc, chuoi, creditUocTinh, taoLuc: Date.now() }),
      },
    };
  } catch (err) {
    const loi = err instanceof Error ? err.message : String(err);
    opts.onTienDo?.({ trangThai: 'error', soBuocXong, tongBuoc, loi });
    return { ok: false, loi };
  } finally {
    useFlowStore.setState((s) => ({
      nodes: s.nodes.filter((n) => !idTam.has(n.id)),
      edges: s.edges.filter((e) => !idTam.has(e.source) && !idTam.has(e.target)),
    }));
    const sau = useFlowStore.getState();
    if (sau.nodes.length !== soNodeTruoc || sau.edges.length !== soEdgeTruoc) {
      // Không ném lỗi (lượt dựng đã xong, không nên nuốt kết quả vì chuyện dọn dẹp) — nhưng phải
      // kêu to: đếm trước ≠ đếm sau nghĩa là có rác ở lại canvas người dùng.
      console.warn(
        `[visual-generate] dọn chưa sạch: node ${soNodeTruoc}→${sau.nodes.length}, edge ${soEdgeTruoc}→${sau.edges.length}`,
      );
    }
  }
}
