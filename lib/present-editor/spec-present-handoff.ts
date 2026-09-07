'use client';

/**
 * lib/present-editor/spec-present-handoff.ts — Handoff Spec (G1-G4, `CuaAnhThanhSpec`) → Present
 * ("Đưa spec sang Trình bày"). LANE F (demo spine) — đóng gap `IF-LIVE-BRIDGE.md` mục MISSING
 * "Spec Portal to Present" (Lane D xác nhận: 0 nút gửi sang Trình chiếu cạnh dữ liệu Spec/BOQ).
 *
 * CÙNG PATTERN sessionStorage + fallback module-singleton như `lib/cad/present-handoff.ts`
 * (CAD→Present) và `lib/present-editor/handoff.ts` (Render→Present) — KHÔNG đẻ cơ chế thứ ba,
 * chỉ đổi payload từ ảnh sang các dòng chữ của một tờ spec đã DUYỆT (G4 `daLuu` — chỉ xuất hiện
 * sau khi `/api/asset-representation` trả 200, tức spec đã có `AssetRepresentation` thật trong DB).
 *
 * KHÔNG có content-model mới ở phía Present: payload chỉ là text content-lines, PresentEditor
 * dựng slide bằng `makeText` (đã có, `lib/present-editor/model.ts`) — giống hệt cầu CAD→Present.
 *
 * 🔴 TÁCH "ĐỌC" KHỎI "BUÔNG TAY" (06/09) — cùng lỗ, cùng cách chữa như `lib/cad/present-handoff.ts`.
 * `consumeSpecPresentHandoff` xoá bản DUY NHẤT của tờ spec ngay lúc đọc, trong khi slide mới chỉ
 * nằm trong bộ nhớ editor; deck chỉ bền sau autosave (debounce 1,2 s + chờ-rảnh tới 1,5 s). Luật
 * và số đo: `lib/ban-giao/giu-den-khi-ben.ts`. Nay: `peek` → chèn → `clear` CHỈ KHI `flushCho()`
 * trả `true`. Ở đây còn tệ hơn cầu CAD một bậc trước khi sửa: id slide dùng `newId('sld')` NGẪU
 * NHIÊN nên mất rồi thì không có cách nào nhận ra để chèn lại — nay id suy từ chính lô hàng.
 */

const KEY = 'interiorflow.specPresentHandoff';

export interface SpecPresentHandoffPayload {
  version: number;
  /** Tên đối tượng — dòng tiêu đề slide. */
  doiTuong: string;
  /** Các dòng nội dung đã render sẵn (kích thước · vật liệu · sản phẩm) — KHÔNG phải object sống,
   * tránh Present phải import lib/capabilities/anh-thanh-spec (biên chặng). */
  dongChu: string[];
  /** Cảnh báo BOQ (đủ/chưa đủ điều kiện) — hiện riêng, không trộn với các dòng số đo. */
  boqNote: string;
  /** id `AssetRepresentation` đã lưu — để Present ghi provenance, không bắt buộc hiển thị. */
  representationId: string;
  timestamp: number;
  /**
   * Dự án đã gửi tờ spec này. Cần từ 06/09, cùng lượt với `peek`/`clear`: payload nay được GIỮ
   * tới lúc ghi bền nên nó có thể còn sống lúc người dùng mở Trình chiếu của **dự án khác** —
   * thiếu trường này thì tờ spec rơi nhầm nhà. `null` = payload cũ ⇒ nhận như trước (không chặn).
   */
  projectId: string | null;
}

let versionCounter = 0;
let memHandoff: SpecPresentHandoffPayload | null = null;

export function stashSpecPresentHandoff(
  payload: Omit<SpecPresentHandoffPayload, 'version' | 'timestamp' | 'projectId'> & { projectId?: string | null },
): boolean {
  versionCounter += 1;
  const full: SpecPresentHandoffPayload = {
    ...payload,
    projectId: payload.projectId ?? null,
    version: versionCounter,
    timestamp: Date.now(),
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(full));
    memHandoff = null;
    return true;
  } catch {
    memHandoff = full;
    return false;
  }
}

function normalizePayload(raw: string | null): SpecPresentHandoffPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SpecPresentHandoffPayload>;
    if (typeof parsed.doiTuong !== 'string' || !Array.isArray(parsed.dongChu)) return null;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 0,
      doiTuong: parsed.doiTuong,
      dongChu: parsed.dongChu.filter((x): x is string => typeof x === 'string'),
      boqNote: typeof parsed.boqNote === 'string' ? parsed.boqNote : '',
      representationId: typeof parsed.representationId === 'string' ? parsed.representationId : '',
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
      projectId: typeof parsed.projectId === 'string' ? parsed.projectId : null,
    };
  } catch {
    return null;
  }
}

/**
 * ĐỌC MÀ GIỮ — không xoá gì. Dùng cặp với `clearSpecPresentHandoff()` khi người gọi phải bảo đảm
 * hàng đã hạ cánh trước lúc buông tay (luật + số đo: `lib/ban-giao/giu-den-khi-ben.ts`).
 */
export function peekSpecPresentHandoff(): SpecPresentHandoffPayload | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  return normalizePayload(raw) ?? memHandoff;
}

/** BUÔNG TAY — dọn cả 2 nguồn. Gọi SAU khi chắc chắn tờ spec đã ghi bền, không sớm hơn. */
export function clearSpecPresentHandoff(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode — mem-fallback dưới đây vẫn dọn */
  }
  memHandoff = null;
}

/**
 * Consume-ONCE = peek + clear.
 *
 * ⚠️ @deprecated CHO ĐƯỜNG CHÈN SLIDE — 06/09. Đây là hàm đã mở ra cửa sổ mất tờ spec: nó xoá bản
 * duy nhất ngay lúc đọc, trong khi slide còn hơn một giây nữa mới ghi bền. Đường đúng cho mọi nơi
 * CHÈN dữ liệu bàn giao vào tài liệu: `peekSpecPresentHandoff()` → chèn → `clearSpecPresentHandoff()`
 * **sau khi** có biên nhận đã ghi. Giữ hàm này cho test và cho caller đọc-rồi-vứt.
 */
export function consumeSpecPresentHandoff(): SpecPresentHandoffPayload | null {
  const payload = peekSpecPresentHandoff();
  clearSpecPresentHandoff();
  return payload;
}

/** Test-only helper. */
export function __resetSpecPresentHandoffForTest(): void {
  versionCounter = 0;
  memHandoff = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
