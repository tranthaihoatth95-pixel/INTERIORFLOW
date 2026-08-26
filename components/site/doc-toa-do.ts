/**
 * components/site/doc-toa-do.ts — ĐỌC MỘT CẶP TOẠ ĐỘ NGƯỜI DÙNG GÕ/DÁN VÀO. THUẦN, có test.
 *
 * Dân nghề dán toạ độ theo đúng dạng máy bản đồ trả ra: `10.7769, 106.7009`. Bắt họ gõ hai ô
 * riêng là thêm một bước không cần thiết ⇒ ô này nhận cả cặp, và **nói thẳng khi không hiểu**
 * thay vì đoán bừa một nửa (đoán sai toạ độ là sai mọi phân tích phía sau).
 *
 * ⛔ CHƯA hỗ trợ độ-phút-giây (`10°46'37"N`). Cố ý: đọc sai DMS ra sai vài trăm mét mà vẫn "trông
 * hợp lệ" — im lặng sai còn tệ hơn từ chối. Gặp DMS thì báo rõ và mời đổi sang thập phân.
 */

export type LoiToaDo = 'trong' | 'khong-hieu' | 'ngoai-pham-vi' | 'dang-dms';

export interface KetQuaDocToaDo {
  viDo?: number;
  kinhDo?: number;
  loi?: LoiToaDo;
}

const SO = /-?\d+(?:[.,]\d+)?/g;

export function docToaDo(raw: string): KetQuaDocToaDo {
  const s = raw.trim();
  if (!s) return { loi: 'trong' };
  // DMS = có ký hiệu độ/phút/giây, HOẶC một con số dính ngay hậu tố hướng (`106E`, `10.5 N`).
  // ⚠️ Không được nhận diện bằng "chữ cái NSEW ở cuối chuỗi": test bắt được ca thật — "Sài Gòn"
  // kết thúc bằng `n` và bị đọc thành ký hiệu hướng Bắc.
  if (/[°′″'"]/.test(s) || /\d\s*[NSEW]\b/i.test(s)) return { loi: 'dang-dms' };

  const so = s.match(SO);
  if (!so || so.length < 2) return { loi: 'khong-hieu' };
  // Lấy đúng HAI số đầu; chuỗi dài hơn (vd có kèm độ cao) thì phần dư bỏ qua có chủ ý.
  const viDo = Number(so[0].replace(',', '.'));
  const kinhDo = Number(so[1].replace(',', '.'));
  if (!Number.isFinite(viDo) || !Number.isFinite(kinhDo)) return { loi: 'khong-hieu' };
  if (Math.abs(viDo) > 90 || Math.abs(kinhDo) > 180) return { loi: 'ngoai-pham-vi' };
  return { viDo, kinhDo };
}

/** Hiện lại cặp toạ độ cho người đọc — 4 số lẻ ≈ 11m, đủ cho một công trình, không giả vờ chính
 *  xác tới centimet. */
export function hienToaDo(viDo?: number, kinhDo?: number): string {
  if (typeof viDo !== 'number' || typeof kinhDo !== 'number') return '';
  return `${viDo.toFixed(4)}, ${kinhDo.toFixed(4)}`;
}
