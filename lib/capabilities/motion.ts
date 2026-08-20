'use client';

/**
 * lib/capabilities/motion.ts — NĂNG LỰC `motion` (P1): cho MỘT ảnh ĐÃ NHẬN chuyển động thành clip
 * ngắn.
 *
 * ── LOOK INSIDE TRƯỚC (B25 NO-REBUILD, đo 20/08) ───────────────────────────────────────────────
 *   · `lib/nodes/registry.ts:561` `ai.image2video` — ĐÃ CÓ THẬT: input `image`+`prompt`, params
 *     `model` (Kling Turbo Pro / Master) · `duration` ('5s'|'10s') · `motion` (chữ tự do),
 *     output `video`, `creditCost: 8`. ⇒ file này KHÔNG gọi provider, chỉ ghép prompt + dựng node.
 *   · `render.ts` (cùng thư mục) — đã có kho kết quả, provenance, cờ cũ, và lối dựng node/xếp
 *     hàng. ⇒ dùng lại nguyên, không chép.
 *   · `components/render-studio/render-queue-store.ts` — hàng đợi thật, dùng chung.
 * ⇒ Phần chưa có: bảng Ý ĐỊNH CHUYỂN ĐỘNG (chữ nghề → mẩu prompt), và dây từ một ảnh ĐÃ NHẬN
 *   sang node video kèm gia phả.
 *
 * ⛔ KHÔNG XÂY TRÌNH DỰNG PHIM. Không timeline, không cắt ghép, không nhạc. Đây là một lượt sinh
 *    clip từ một khung, đúng phạm vi P1.
 * ⛔ TỈ LỆ KHUNG không phải núm của bước này: `ai.image2video` không nhận tỉ lệ, clip lấy tỉ lệ
 *    của ẢNH NGUỒN. Tỉ lệ được chọn ở bước Kết xuất (nơi nó CÓ tác dụng thật) rồi kế thừa xuống.
 *    Bịa một núm tỉ lệ ở đây là nút giả.
 */

import { useFlowStore } from '@/lib/store';
import { useRenderQueue } from '@/components/render-studio/render-queue-store';
import type { Connection } from '@xyflow/react';
import { idBanGhi, useKhoKetQua, type BanGhiKetQua } from './render';
import { CREDIT_MOT_LUOT_VIDEO, dungPromptChuyenDong, yDinhTheoId, type ChatLuongVideo, type ThoiLuong, type YDinhChuyenDongId } from './motion-core';

/** MỘT CỬA: phần thuần ở `motion-core.ts`, phần chạm store ở đây. */
export * from './motion-core';

/* ══════════════════════════════ DỰNG DÂY CHUYỀN ══════════════════════════════ */

function themNode(defType: string, position: { x: number; y: number }): string {
  const st = useFlowStore.getState();
  st.addNode(defType, position);
  const nodes = useFlowStore.getState().nodes;
  const cuoi = nodes[nodes.length - 1];
  if (!cuoi) throw new Error(`Không thêm được node ${defType} vào flow.`);
  return cuoi.id;
}

export interface YeuCauChuyenDong {
  /** Bản ghi ảnh ĐÃ NHẬN — nguồn duy nhất hợp lệ (luật: chỉ ảnh đã Nhận mới đi tiếp). */
  nguon: BanGhiKetQua;
  yDinh: YDinhChuyenDongId;
  thoiLuong: ThoiLuong;
  chatLuong: ChatLuongVideo;
  moTaThem?: string;
  provider: string;
  goc?: { x: number; y: number };
}

/**
 * Ảnh đã Nhận → node `ai.image2video` → HÀNG ĐỢI SẴN CÓ. Giữ nguyên gia phả: `nguonId` trỏ về ảnh,
 * và `sceneRev` KẾ THỪA của ảnh — nghĩa là cảnh 3D đổi thì clip cũng thành CŨ, đúng một chuỗi.
 */
export function chayChuyenDong(yc: YeuCauChuyenDong): { jobId: string; nodeId: string; banGhiId: string } {
  if (yc.nguon.trangThai !== 'daNhan')
    throw new Error('Chỉ ảnh đã Nhận mới cho chuyển động được — xem trước rồi Nhận trước đã.');
  if (!yc.nguon.url) throw new Error('Ảnh nguồn chưa có kết quả.');

  const g = yc.goc ?? { x: 80, y: 420 };
  const idAnh = themNode('input.image', { x: g.x, y: g.y });
  useFlowStore.getState().updateParam(idAnh, 'file', yc.nguon.url);

  const idVideo = themNode('ai.image2video', { x: g.x + 300, y: g.y });
  const st = useFlowStore.getState();
  st.updateParam(idVideo, 'model', yc.chatLuong);
  st.updateParam(idVideo, 'duration', yc.thoiLuong);
  st.updateParam(idVideo, 'motion', dungPromptChuyenDong(yc.yDinh, yc.moTaThem));
  st.onConnect({ source: idAnh, target: idVideo, sourceHandle: 'image', targetHandle: 'image' } as Connection);

  const ten = `${yc.nguon.ten} · ${yDinhTheoId(yc.yDinh).ten[0]}`;
  const banGhiId = idBanGhi('kq');
  useKhoKetQua.getState().them({
    id: banGhiId,
    loai: 'phim',
    url: '',
    ten,
    camera: yc.nguon.camera,
    sceneRev: yc.nguon.sceneRev,
    provider: yc.provider,
    credit: CREDIT_MOT_LUOT_VIDEO,
    nodeId: idVideo,
    nguonId: yc.nguon.id,
    thamSo: { yDinh: yc.yDinh, thoiLuong: yc.thoiLuong, chatLuong: yc.chatLuong },
    trangThai: 'xemTruoc',
    luc: Date.now(),
  });

  const jobId = useRenderQueue.getState().enqueue({
    viewName: ten,
    sourceUrl: yc.nguon.url,
    source: { kind: 'node', nodeId: idVideo },
  });

  return { jobId, nodeId: idVideo, banGhiId };
}
