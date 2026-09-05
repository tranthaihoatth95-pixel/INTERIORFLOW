/**
 * lib/commands/chinh-lenh-tai-ap.ts — KẾ HOẠCH TÁI ÁP (thuần) cho "Chỉnh lệnh vừa chạy": từ bản
 * gốc + lệnh đã sửa → tính ra ĐÚNG những gì phải ghi vào Doc, KHÔNG ghi. `CadCanvas.tsx` chỉ còn
 * việc đưa kế hoạch vào store (1 snapshot undo). Tách ra đây để hình học tái áp — chỗ dễ mất dữ
 * liệu âm thầm nhất — chạy được trong test sucrase-node với `wallChain`/`offsetEntity`/
 * `rotateEntity`/`expandDeleteWithHostedChildren` THẬT, không mock.
 *
 * Luật giữ: Dời/Chép đã có đường riêng (`viTriBanSao` + `lastMoveCopy` trong canvas — là đường VCB
 * sẵn có, không nhân đôi). File này lo ba lệnh còn lại: Xoay · Offset · Tường.
 */

import type { Doc, Entity, Pt } from '../cad/model';
import { offsetEntity, rotateEntity } from '../cad/geometry';
import { wallChain } from '../cad/commands';
import { expandDeleteWithHostedChildren } from '../cad/hosting';
import { DEG_TO_RAD, type LenhVuaChay } from './chinh-lenh-vua-chay';

export type KeHoachTaiAp =
  | { ok: true; kieu: 'update'; entities: Entity[] }
  | { ok: true; kieu: 'replace'; removeIds: string[]; add: Entity[] }
  | { ok: false; lyDo: [string, string] };

export interface NguCanhXoay { originals: Entity[]; center: Pt }
export interface NguCanhOffset { sourceId: string; side: Pt; createdId: string }
export interface NguCanhTuong { pts: Pt[]; closed: boolean; layer: string; createdIds: string[] }

const LY_DO = {
  saiLenh: ['Lệnh không khớp ngữ cảnh tái áp.', 'Command does not match the re-apply context.'] as [string, string],
  matNguon: ['Đối tượng gốc không còn — không tái áp được.', 'Source object is gone — cannot re-apply.'] as [string, string],
  offsetKhongRa: ['Không dựng được offset với khoảng này.', 'Cannot build an offset at this distance.'] as [string, string],
  tuongCoCua: [
    'Tường đã có cửa/cửa sổ — hoàn tác rồi vẽ lại, không tự xoá cửa.',
    'This wall already hosts doors/windows — undo and redraw; doors are never deleted silently.',
  ] as [string, string],
};

/** Xoay: luôn từ bản gốc quanh cùng tâm — không cộng dồn góc. */
export function taiApXoay(ctx: NguCanhXoay, l: LenhVuaChay): KeHoachTaiAp {
  if (l.kind !== 'xoay') return { ok: false, lyDo: LY_DO.saiLenh };
  const rad = l.angleDeg * DEG_TO_RAD;
  return { ok: true, kieu: 'update', entities: ctx.originals.map((e) => rotateEntity(e, ctx.center, rad)) };
}

/** Offset: thay bản đã sinh bằng bản mới cùng phía, từ ĐỐI TƯỢNG GỐC hiện có trong doc. */
export function taiApOffset(doc: Doc, ctx: NguCanhOffset, l: LenhVuaChay): KeHoachTaiAp {
  if (l.kind !== 'offset') return { ok: false, lyDo: LY_DO.saiLenh };
  const src = doc.entities.find((e) => e.id === ctx.sourceId);
  if (!src) return { ok: false, lyDo: LY_DO.matNguon };
  const off = offsetEntity(src, l.distMm, ctx.side);
  if (!off) return { ok: false, lyDo: LY_DO.offsetKhongRa };
  return { ok: true, kieu: 'replace', removeIds: [ctx.createdId], add: [off] };
}

/**
 * Tường: dựng lại CHUỖI y hệt từ cùng điểm với bề dày mới. Có cửa/cửa sổ đã bám lên tường thì TỪ
 * CHỐI kèm lý do — `replaceEntities` sẽ kéo theo con hosted, tức xoá cửa âm thầm, trái luật.
 */
export function taiApTuong(doc: Doc, ctx: NguCanhTuong, l: LenhVuaChay): KeHoachTaiAp {
  if (l.kind !== 'tuong') return { ok: false, lyDo: LY_DO.saiLenh };
  const hosted = expandDeleteWithHostedChildren(ctx.createdIds, doc);
  if (hosted.size > ctx.createdIds.length) return { ok: false, lyDo: LY_DO.tuongCoCua };
  const add = wallChain(ctx.pts.slice(), l.thicknessMm, ctx.layer, ctx.closed);
  return { ok: true, kieu: 'replace', removeIds: ctx.createdIds.slice(), add };
}
