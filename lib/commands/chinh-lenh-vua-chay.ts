/**
 * lib/commands/chinh-lenh-vua-chay.ts — LÕI THUẦN của "Chỉnh lệnh vừa chạy" (Blender F9 *Adjust
 * Last Operation*) cho chặng 2D — tầng ③ của `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` §2, ghi rõ
 * "IF CHƯA CÓ, giá trị cao nhất". Brief ngoài gọi mặt tiền này là *MasterTool*; trong repo tên
 * "master tool" đã khai tử (16/08, = ToolWindow) nên file dùng đúng tên sổ: **chỉnh lệnh vừa chạy**.
 *
 * NỖI ĐAU THẬT nó giết: vẽ tường xong thấy dày sai · dời/chép xong muốn đổi khoảng cách · xoay
 * xong muốn 90° thay vì 87° · offset xong muốn 150 thay vì 120 — hôm nay phải Undo rồi làm lại
 * cả chuỗi click. Với bút/ngón tay (Sơ phác) còn tệ hơn: không có bàn phím để gõ số sau thao tác.
 *
 * NHÌN VÀO TRONG TRƯỚC [Đ2] — KHÔNG viết parser thứ hai: trường khoảng cách của Dời/Chép đi qua
 * ĐÚNG `parseVcbToken`/`applyVcbToMoveCopy` của `vcb.ts` (gõ "3x"/"/3" trong ô cũng ra y hệt gõ
 * trên canvas — một bộ luật cho hai cửa vào). File này CHỈ mô tả lệnh + trường sửa được + luật
 * hợp lệ; việc tái áp lên hình học là của nơi giữ bản gốc (`CadCanvas.tsx`, xem
 * `chinh-lenh-store.ts` cho cách nối), cùng phong cách "lõi thuần, UI tự quản state" của `vcb.ts`.
 *
 * KHÔNG lưu vào Doc/.idf: đây là ngữ cảnh THAO TÁC, mất khi đổi tool/Esc/undo (giống `lastMoveCopy`).
 */

import { parseVcbToken, applyVcbToMoveCopy, type MoveCopyPlan } from './vcb';

export type LenhVuaChay =
  | { kind: 'doi'; stepMm: number; baseSpanMm: number }
  | { kind: 'chep'; stepMm: number; copyCount: number; baseSpanMm: number }
  | { kind: 'xoay'; angleDeg: number }
  | { kind: 'offset'; distMm: number }
  | { kind: 'tuong'; thicknessMm: number; closed: boolean; segmentCount: number };

export type LoaiLenh = LenhVuaChay['kind'];

/** Một trường sửa được trên mặt tiền. `donVi` rỗng = số đếm (bản sao). */
export interface TruongSua {
  key: string;
  nhan: [string, string];
  donVi: 'mm' | '°' | '';
  giaTri: number;
  /** Gợi ý gõ nhanh — chỉ trường nào có luật phụ (VCB "3x"/"/3"). */
  goiY?: [string, string];
}

export type KetQuaSua =
  | { ok: true; lenh: LenhVuaChay }
  | { ok: false; lyDo: [string, string] };

export function tenLenh(kind: LoaiLenh): [string, string] {
  switch (kind) {
    case 'doi': return ['Dời', 'Move'];
    case 'chep': return ['Chép', 'Copy'];
    case 'xoay': return ['Xoay', 'Rotate'];
    case 'offset': return ['Offset', 'Offset'];
    case 'tuong': return ['Tường', 'Wall'];
  }
}

/** Làm tròn hiển thị: mm nguyên, độ 1 chữ số lẻ. */
function lamTron(n: number, soLe = 0): number {
  const k = 10 ** soLe;
  return Math.round(n * k) / k;
}

/** Tóm tắt một dòng — "Dời 1200 mm" · "Chép 3 bản · mỗi bước 600 mm" · "Xoay 90°". */
export function moTaLenh(l: LenhVuaChay): [string, string] {
  switch (l.kind) {
    case 'doi': return [`Dời ${lamTron(l.stepMm)} mm`, `Move ${lamTron(l.stepMm)} mm`];
    case 'chep':
      return [
        `Chép ${l.copyCount} bản · mỗi bước ${lamTron(l.stepMm)} mm`,
        `Copy ×${l.copyCount} · step ${lamTron(l.stepMm)} mm`,
      ];
    case 'xoay': return [`Xoay ${lamTron(l.angleDeg, 1)}°`, `Rotate ${lamTron(l.angleDeg, 1)}°`];
    case 'offset': return [`Offset ${lamTron(l.distMm)} mm`, `Offset ${lamTron(l.distMm)} mm`];
    case 'tuong':
      return [
        `Tường ${l.segmentCount} đoạn${l.closed ? ' (kín)' : ''} · dày ${lamTron(l.thicknessMm)} mm`,
        `Wall ${l.segmentCount} segment${l.segmentCount === 1 ? '' : 's'}${l.closed ? ' (closed)' : ''} · ${lamTron(l.thicknessMm)} mm thick`,
      ];
  }
}

/** Trường nào sửa được cho từng lệnh — mặt tiền vẽ theo bảng này, KHÔNG tự rẽ nhánh theo kind. */
export function truongCuaLenh(l: LenhVuaChay): TruongSua[] {
  switch (l.kind) {
    case 'doi':
      return [{ key: 'stepMm', nhan: ['Khoảng cách', 'Distance'], donVi: 'mm', giaTri: lamTron(l.stepMm) }];
    case 'chep':
      return [
        {
          key: 'stepMm', nhan: ['Mỗi bước', 'Step'], donVi: 'mm', giaTri: lamTron(l.stepMm),
          goiY: ['"3x" = 3 bản · "/3" = chia đều', '"3x" = 3 copies · "/3" = divide evenly'],
        },
        { key: 'copyCount', nhan: ['Số bản', 'Copies'], donVi: '', giaTri: l.copyCount },
      ];
    case 'xoay':
      return [{ key: 'angleDeg', nhan: ['Góc', 'Angle'], donVi: '°', giaTri: lamTron(l.angleDeg, 1) }];
    case 'offset':
      return [{ key: 'distMm', nhan: ['Khoảng offset', 'Offset distance'], donVi: 'mm', giaTri: lamTron(l.distMm) }];
    case 'tuong':
      return [{ key: 'thicknessMm', nhan: ['Dày tường', 'Thickness'], donVi: 'mm', giaTri: lamTron(l.thicknessMm) }];
  }
}

/** Số thực có dấu, chấp nhận dấu phẩy kiểu VN. null = không phải số. */
function docSo(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

const LY_DO = {
  soDuong: ['Cần một số dương (mm).', 'Enter a positive number (mm).'] as [string, string],
  goc: ['Cần một số đo góc (°), âm = xoay ngược.', 'Enter an angle in degrees; negative = clockwise.'] as [string, string],
  soBan: ['Số bản phải là số nguyên ≥ 1.', 'Copies must be a whole number ≥ 1.'] as [string, string],
  vcb: ['Gõ số (mm), "3x" (nhân bản) hoặc "/3" (chia đều).', 'Type a number (mm), "3x" (copies) or "/3" (divide).'] as [string, string],
  chiChep: ['Nhân bản/chia đều chỉ có khi Chép — Dời chỉ nhận khoảng cách.', 'Multiply/divide only apply to Copy — Move takes a distance.'] as [string, string],
  truong: ['Trường không thuộc lệnh này.', 'This field does not belong to this command.'] as [string, string],
};

/**
 * Áp một chuỗi người dùng gõ vào trường `key` của lệnh `l`. Thuần — trả lệnh MỚI hoặc lý do từ
 * chối; không throw (gọi được mỗi keystroke như `parseVcbToken`). Dời/Chép trường `stepMm` đi
 * qua VCB nguyên bản: "3x"/"/3" vẫn tính từ `baseSpanMm` gốc, không cộng dồn qua nhiều lần chỉnh.
 */
export function apDungSua(l: LenhVuaChay, key: string, raw: string): KetQuaSua {
  switch (l.kind) {
    case 'doi':
    case 'chep': {
      if (key === 'stepMm') {
        const token = parseVcbToken(raw);
        if (token.kind === 'invalid') return { ok: false, lyDo: LY_DO.vcb };
        if (l.kind === 'doi' && token.kind !== 'value') return { ok: false, lyDo: LY_DO.chiChep };
        const current: MoveCopyPlan = { copyCount: l.kind === 'chep' ? l.copyCount : 1, stepMm: l.stepMm };
        const plan = applyVcbToMoveCopy(current, token, l.baseSpanMm);
        return {
          ok: true,
          lenh: l.kind === 'chep'
            ? { ...l, stepMm: plan.stepMm, copyCount: plan.copyCount }
            : { ...l, stepMm: plan.stepMm },
        };
      }
      if (key === 'copyCount' && l.kind === 'chep') {
        const n = docSo(raw);
        if (n === null || n < 1 || !Number.isInteger(n)) return { ok: false, lyDo: LY_DO.soBan };
        return { ok: true, lenh: { ...l, copyCount: n } };
      }
      return { ok: false, lyDo: LY_DO.truong };
    }
    case 'xoay': {
      if (key !== 'angleDeg') return { ok: false, lyDo: LY_DO.truong };
      const n = docSo(raw);
      if (n === null) return { ok: false, lyDo: LY_DO.goc };
      return { ok: true, lenh: { ...l, angleDeg: n } };
    }
    case 'offset': {
      if (key !== 'distMm') return { ok: false, lyDo: LY_DO.truong };
      const n = docSo(raw);
      if (n === null || n <= 0) return { ok: false, lyDo: LY_DO.soDuong };
      return { ok: true, lenh: { ...l, distMm: n } };
    }
    case 'tuong': {
      if (key !== 'thicknessMm') return { ok: false, lyDo: LY_DO.truong };
      const n = docSo(raw);
      if (n === null || n <= 0) return { ok: false, lyDo: LY_DO.soDuong };
      return { ok: true, lenh: { ...l, thicknessMm: n } };
    }
  }
}

/** Vị trí từng bản (Dời = 1 bản) dọc hướng đơn vị đã kéo — bản i cách gốc `i × step`. */
export function viTriBanSao(l: LenhVuaChay, ux: number, uy: number): { dx: number; dy: number }[] {
  if (l.kind !== 'doi' && l.kind !== 'chep') return [];
  const n = l.kind === 'chep' ? l.copyCount : 1;
  const out: { dx: number; dy: number }[] = [];
  for (let i = 1; i <= n; i++) out.push({ dx: ux * l.stepMm * i, dy: uy * l.stepMm * i });
  return out;
}

export const RAD_TO_DEG = 180 / Math.PI;
export const DEG_TO_RAD = Math.PI / 180;
