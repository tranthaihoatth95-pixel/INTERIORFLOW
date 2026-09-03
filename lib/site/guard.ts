/**
 * lib/site/guard.ts — CHẶN AN TOÀN bắt buộc (docs/SPEC-HIEU-BOI-CANH §2, T bổ sung, Hoà chốt 15/08):
 * biến số ngữ cảnh CHỈ được SIẾT THÊM hoặc THÊM MỚI — TUYỆT ĐỐI KHÔNG NỚI LỎNG luật bắt buộc.
 * "Ven biển" được thêm yêu cầu chống ăn mòn; không bao giờ được hạ chuẩn phòng cháy.
 *
 * Hàm thuần, nhận hai bản ngưỡng (trước/sau khi áp biến số) theo hình dạng tối giản chung với
 * `StandardRule` (id · min · max · binding). Không import registry luật để giữ file thuần và để
 * lớp luật (lib/cad/standards) cắm vào sau — đây là cửa kiểm, không phải bộ luật mới.
 */
export interface NguongLuat {
  id: string;
  min?: number;
  max?: number;
  binding: 'mandatory' | 'adjustable' | 'advisory';
}

export interface ViPhamNoiLong {
  id: string;
  truong: 'min' | 'max';
  truoc: number;
  sau: number;
}

/** Trả danh sách luật BẮT BUỘC bị nới lỏng (min hạ xuống / max nâng lên / bỏ ngưỡng). Rỗng = an toàn. */
export function kiemChiSiet(truoc: NguongLuat[], sau: NguongLuat[]): ViPhamNoiLong[] {
  const out: ViPhamNoiLong[] = [];
  const sauMap = new Map(sau.map((r) => [r.id, r]));
  for (const cu of truoc) {
    if (cu.binding !== 'mandatory') continue;
    const moi = sauMap.get(cu.id);
    if (!moi) {
      // xoá hẳn một luật bắt buộc = nới tới vô cực
      if (cu.min !== undefined) out.push({ id: cu.id, truong: 'min', truoc: cu.min, sau: Number.NEGATIVE_INFINITY });
      if (cu.max !== undefined) out.push({ id: cu.id, truong: 'max', truoc: cu.max, sau: Number.POSITIVE_INFINITY });
      continue;
    }
    if (cu.min !== undefined && (moi.min === undefined || moi.min < cu.min)) {
      out.push({ id: cu.id, truong: 'min', truoc: cu.min, sau: moi.min ?? Number.NEGATIVE_INFINITY });
    }
    if (cu.max !== undefined && (moi.max === undefined || moi.max > cu.max)) {
      out.push({ id: cu.id, truong: 'max', truoc: cu.max, sau: moi.max ?? Number.POSITIVE_INFINITY });
    }
  }
  return out;
}

/** Áp một bộ SIẾT (chỉ min tăng / max giảm / luật mới). Bất kỳ delta nới nào bị BỎ QUA và báo lại. */
export function apSiet(
  goc: NguongLuat[],
  siet: NguongLuat[],
): { ketQua: NguongLuat[]; biTuChoi: ViPhamNoiLong[] } {
  const ketQua = goc.map((r) => ({ ...r }));
  const byId = new Map(ketQua.map((r) => [r.id, r]));
  const biTuChoi: ViPhamNoiLong[] = [];
  for (const s of siet) {
    const cu = byId.get(s.id);
    if (!cu) {
      ketQua.push({ ...s });
      continue;
    }
    if (s.min !== undefined) {
      if (cu.min === undefined || s.min >= cu.min) cu.min = s.min;
      else biTuChoi.push({ id: s.id, truong: 'min', truoc: cu.min, sau: s.min });
    }
    if (s.max !== undefined) {
      if (cu.max === undefined || s.max <= cu.max) cu.max = s.max;
      else biTuChoi.push({ id: s.id, truong: 'max', truoc: cu.max, sau: s.max });
    }
  }
  return { ketQua, biTuChoi };
}
