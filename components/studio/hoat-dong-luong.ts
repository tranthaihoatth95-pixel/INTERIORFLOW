/**
 * components/studio/hoat-dong-luong.ts — LÕI THUẦN của "Việc đang chạy" (Activity/Flow).
 *
 * Vitals ≠ Activity (chốt 20/08 + brief phiên này): Vitals trả lời "tôi nên biết gì" (lời
 * khuyên/câu trả lời) — sống ở khẩu độ mép trên (`VitalsAperture.tsx`). Activity trả lời "cái gì
 * đang chạy/sắp tới" (tiến độ) — chuông ở cụm phải-trên (`CumPhaiTren.tsx`). Hai hệ tách biệt cả
 * về không gian lẫn nghĩa; module này KHÔNG được import bởi bất cứ file Vitals nào.
 *
 * [Đ2] NHÌN VÀO TRONG TRƯỚC — hai nguồn dữ liệu THẬT đã có, không đẻ hàng đợi thứ ba:
 *   · `useFlowStore.flowRuns` (`lib/store.ts`) — lượt chạy CẢ CHUỖI node (nhiều node/lượt).
 *   · `useRenderQueue.jobs` (`components/render-studio/render-queue-store.ts`) — job TỪNG VIEW
 *     dựng ảnh (nguồn ①② mà chính `VitalsAperture.tsx` cũng đọc `flowRuns`).
 * Hai nguồn khác đơn vị (chuỗi vs. view lẻ) nên KHÔNG gộp làm một entry — mỗi cái ra một
 * `MucHoatDong`, gắn cờ `nguon` để phân biệt, rồi xếp CHUNG một nhóm theo trạng thái.
 *
 * DỊCH SANG NGÔN NGỮ SẢN PHẨM — brief cấm lộ tên provider/model/job id. Nhãn "Năng lực" lấy từ
 * `NodeDefinition.title` (đã là tiếng người: "Sketch → Render", "Xoá & lấp đầy"…), KHÔNG bao giờ
 * lấy `defType` (khoá kỹ thuật) hay bất cứ trường model/provider nào.
 */

import type { FlowRun } from '@/lib/types';
import type { RenderQueueJob, RenderQueueStatus } from '@/components/render-studio/render-queue-store';
import { getDefinition } from '@/lib/nodes/registry';

export type NhomHoatDong =
  | 'dangChay'
  | 'dangCho'
  | 'canXem'
  | 'sanSang'
  | 'loi'
  | 'vuaXong';

export interface MucHoatDong {
  id: string;
  nguon: 'luong' | 'view';
  /** Tên món hiện cho người dùng — KHÔNG BAO GIỜ là defType/provider/job id kỹ thuật. */
  nhan: string;
  /** Chặng sản sinh ra nó, tiếng người. */
  chang: string;
  /** Năng lực đã dùng, tiếng người (lấy từ NodeDefinition.title). */
  nangLuc?: string;
  nhom: NhomHoatDong;
  /** Có kết quả để xem chưa (ảnh/asset). */
  coKetQua: boolean;
  /** Lý do lỗi đã dịch sang tiếng người, nếu có. */
  loiDo?: string;
  /** SUY RA, không phải trường lưu sẵn: true khi trạng thái dừng lại cần người quyết tiếp
   * (retry/huỷ/xem lý do) thay vì tự trôi qua. Khai thật trong docstring, đừng đọc là field gốc. */
  canNguoiDuyet: boolean;
  thoiGian: number;
}

const NHAN_CHANG = {
  render: 'Thiết kế 3D',
  khongRo: 'Không rõ chặng',
} as const;

function nhomTuTrangThaiLuong(s: FlowRun['status']): NhomHoatDong {
  switch (s) {
    case 'running':
      return 'dangChay';
    case 'queued':
      return 'dangCho';
    case 'error':
      return 'canXem';
    case 'cancelled':
      return 'vuaXong';
    case 'done':
      return 'vuaXong';
    default:
      return 'dangCho';
  }
}

function nhomTuTrangThaiView(s: RenderQueueStatus): NhomHoatDong {
  switch (s) {
    case 'running':
      return 'dangChay';
    case 'queued':
      return 'dangCho';
    case 'error':
      return 'loi';
    case 'cancelled':
      return 'vuaXong';
    case 'done':
      return 'sanSang';
  }
}

/** Năng lực tiếng người của node đầu tiên trong lượt — id chuỗi/node KHÔNG bao giờ lộ ra. */
function nangLucCuaNode(nodeType?: string): string | undefined {
  if (!nodeType) return undefined;
  try {
    return getDefinition(nodeType).title;
  } catch {
    return undefined;
  }
}

export function tuFlowRuns(
  runs: FlowRun[],
  /** map nodeId → defType, để tra nhãn năng lực — truyền từ `useFlowStore.nodes`. */
  loaiNode: (nodeId: string) => string | undefined,
): MucHoatDong[] {
  return runs.map((r) => ({
    id: `luong:${r.id}`,
    nguon: 'luong' as const,
    nhan: r.label,
    chang: NHAN_CHANG.render,
    nangLuc: nangLucCuaNode(loaiNode(r.nodeIds[Math.max(0, r.currentIndex)] ?? r.nodeIds[0])),
    nhom: nhomTuTrangThaiLuong(r.status),
    coKetQua: r.status === 'done',
    canNguoiDuyet: r.status === 'error',
    thoiGian: r.finishedAt ?? r.startedAt ?? r.queuedAt,
  }));
}

export function tuRenderQueue(jobs: RenderQueueJob[]): MucHoatDong[] {
  return jobs.map((j) => ({
    id: `view:${j.id}`,
    nguon: 'view' as const,
    nhan: j.viewName,
    chang: NHAN_CHANG.render,
    nhom: nhomTuTrangThaiView(j.status),
    coKetQua: j.status === 'done' && !!j.resultUrl,
    loiDo: j.error,
    canNguoiDuyet: j.status === 'error',
    thoiGian: j.finishedAt ?? j.startedAt ?? j.queuedAt,
  }));
}

export const THU_TU_NHOM: NhomHoatDong[] = ['dangChay', 'dangCho', 'canXem', 'loi', 'sanSang', 'vuaXong'];

export const NHAN_NHOM: Record<NhomHoatDong, { vi: string; en: string }> = {
  dangChay: { vi: 'Đang chạy', en: 'Running' },
  dangCho: { vi: 'Đang chờ', en: 'Waiting' },
  canXem: { vi: 'Cần xem', en: 'Needs attention' },
  loi: { vi: 'Lỗi', en: 'Failed' },
  sanSang: { vi: 'Sẵn sàng', en: 'Ready' },
  vuaXong: { vi: 'Vừa xong', en: 'Recent complete' },
};

/** Gộp hai nguồn, mới nhất trước, giữ tối đa `tran` mục mỗi nhóm ở các nhóm "đã xong" để không
 * phình vô hạn (đang chạy/đang chờ/cần xem thì KHÔNG cắt — đó là thứ người dùng phải thấy hết). */
export function gomHoatDong(muc: MucHoatDong[]): Record<NhomHoatDong, MucHoatDong[]> {
  const out: Record<NhomHoatDong, MucHoatDong[]> = {
    dangChay: [],
    dangCho: [],
    canXem: [],
    loi: [],
    sanSang: [],
    vuaXong: [],
  };
  for (const m of muc) out[m.nhom].push(m);
  for (const nhom of Object.keys(out) as NhomHoatDong[]) {
    out[nhom].sort((a, b) => b.thoiGian - a.thoiGian);
  }
  out.vuaXong = out.vuaXong.slice(0, 8);
  out.sanSang = out.sanSang.slice(0, 8);
  return out;
}

/** Tóm tắt cho trạng thái GỌN của chuông — "1 đang chạy · 2 chờ · 1 lỗi". Chỉ nói nhóm > 0,
 * và CHỈ trả rỗng khi không có gì — không bịa số 0 cho nhóm không có. */
export function tomTatGon(gom: Record<NhomHoatDong, MucHoatDong[]>, tr: (vi: string, en: string) => string): string {
  const phan: string[] = [];
  if (gom.dangChay.length) phan.push(tr(`${gom.dangChay.length} đang chạy`, `${gom.dangChay.length} running`));
  if (gom.dangCho.length) phan.push(tr(`${gom.dangCho.length} chờ`, `${gom.dangCho.length} waiting`));
  if (gom.canXem.length) phan.push(tr(`${gom.canXem.length} cần xem`, `${gom.canXem.length} needs attention`));
  if (gom.loi.length) phan.push(tr(`${gom.loi.length} lỗi`, `${gom.loi.length} failed`));
  return phan.join(' · ');
}

export function tongSoDangHoatDong(gom: Record<NhomHoatDong, MucHoatDong[]>): number {
  return gom.dangChay.length + gom.dangCho.length + gom.canXem.length + gom.loi.length;
}
