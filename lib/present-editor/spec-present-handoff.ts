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
}

let versionCounter = 0;
let memHandoff: SpecPresentHandoffPayload | null = null;

export function stashSpecPresentHandoff(
  payload: Omit<SpecPresentHandoffPayload, 'version' | 'timestamp'>,
): boolean {
  versionCounter += 1;
  const full: SpecPresentHandoffPayload = { ...payload, version: versionCounter, timestamp: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(full));
    memHandoff = null;
    return true;
  } catch {
    memHandoff = full;
    return false;
  }
}

/** Consume-ONCE: đọc xong dọn cả 2 nguồn ngay — không double-insert khi PresentEditor remount. */
export function consumeSpecPresentHandoff(): SpecPresentHandoffPayload | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
    if (raw) sessionStorage.removeItem(KEY);
  } catch {
    raw = null;
  }
  let payload: SpecPresentHandoffPayload | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<SpecPresentHandoffPayload>;
      if (typeof parsed.doiTuong === 'string' && Array.isArray(parsed.dongChu)) {
        payload = {
          version: typeof parsed.version === 'number' ? parsed.version : 0,
          doiTuong: parsed.doiTuong,
          dongChu: parsed.dongChu.filter((x): x is string => typeof x === 'string'),
          boqNote: typeof parsed.boqNote === 'string' ? parsed.boqNote : '',
          representationId: typeof parsed.representationId === 'string' ? parsed.representationId : '',
          timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : 0,
        };
      }
    } catch {
      payload = null;
    }
  }
  if (!payload && memHandoff) payload = memHandoff;
  memHandoff = null;
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
