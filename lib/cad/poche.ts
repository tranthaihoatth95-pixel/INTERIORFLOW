/**
 * lib/cad/poche.ts — A3 · G-M1-08 "vùng tô (poché) KHÔNG neo vào đường bao".
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * BỆNH (đo được, `docs/M2-OUT.md` §2): lệnh tường sinh **hai** entity cùng lúc — `hatch` (mảng
 * tô đặc, tức poché) và `polyline` (đường bao nét mảnh) — với ĐÚNG CÙNG một bộ điểm, nhưng KHÔNG
 * có gì nối chúng lại (`lib/cad/commands.ts` `wallSegment`/`wallSegmentOutline`). Chọn trúng một
 * nửa rồi dời đi ⇒ nửa kia đứng nguyên tại chỗ cũ, tường rách làm đôi (đo được: lệch 450mm).
 *
 * THUỐC: dùng LẠI ĐÚNG KHUÔN NEO đã có cho cửa/cửa sổ (`lib/cad/hosting.ts`), KHÔNG đẻ cơ chế
 * thứ hai — cùng 3 mảnh:
 *   ① một field trỏ vật chủ  → `Base.hostId` (CHÍNH field cửa/cửa sổ đang dùng, `model.ts`)
 *   ② một hàm reconcile idempotent chạy sau MỌI mutation → `syncPocheAnchors(doc)`
 *      (đứng cạnh `syncHostedOpenings(doc)` trong `lib/cad/store.ts`)
 *   ③ một hàm nở tập id lúc xoá/chọn → `expandIdsWithPoche()`
 *      (đứng cạnh `expandDeleteWithHostedChildren()`)
 *
 * AI LÀ VẬT CHỦ: **đường bao (`polyline`) là chủ, vùng tô (`hatch`) là con.** Lý do: đường bao là
 * thứ mang hình học có nghĩa của cấu kiện (biên tường), còn poché chỉ là cách THỂ HIỆN cái biên đó
 * trên bản in — đúng thứ tự "hình học trước, thể hiện sau" của mọi hệ CAD. Chiều ngược lại (poché
 * làm chủ) sẽ khiến xoá nét mảnh đi là mất luôn biên thật.
 *
 * ⚠️ KHÔNG áp cho mọi hatch. Chỉ ghép khi hatch và polyline **trùng khít bộ điểm + cùng layer** —
 * tức đúng cặp do lệnh tường sinh ra. Hatch vật liệu/preset sơn (không có polyline anh em) không
 * bị ghép nhầm; đó là lý do có `ringKey()` chứ không phải "hatch nào cũng tìm polyline gần nhất".
 *
 * DỮ LIỆU CŨ: `.idf`/DXF cũ không có `hostId` ⇒ `syncPocheAnchors()` TỰ ghép lại bằng hình học ở
 * lần mở đầu tiên (cặp cũ vẫn còn trùng khít vì chưa ai dời). Không cần bump `IDF_VERSION`, không
 * cần migration. Cặp đã bị dời lệch từ trước (bệnh cũ đã xảy ra) thì KHÔNG ghép — cố ghép là đoán
 * mò và có thể kéo nhầm hai mảng chẳng liên quan vào nhau (luật K3: thà không biết còn hơn đoán).
 *
 * THUẦN (không React/DOM/store). Test: node_modules/.bin/sucrase-node lib/cad/poche.test.ts
 */
import type { Doc, Entity, HatchEntity, PolylineEntity, Pt } from './model';

/** Sai số coi hai điểm là MỘT (mm). 1µm — dưới mọi sai số dựng hình thật, trên sai số dấu phẩy động. */
export const POCHE_MATCH_TOL_MM = 1e-3;

/** Entity có bộ điểm ghép được thành cặp poché (chỉ 2 loại này, cố ý KHÔNG nhận rect/zone…). */
export type PocheSide = HatchEntity | PolylineEntity;

function isPocheSide(e: Entity): e is PocheSide {
  return e.type === 'hatch' || (e.type === 'polyline' && e.closed);
}

/**
 * Khoá so trùng của một vòng điểm — **bất biến với điểm bắt đầu và với chiều quay**, vì hai nửa
 * của cùng một quad tường có thể được ghi theo thứ tự khác nhau (và `transformEntity` của DXF có
 * thể lật gương ⇒ đảo chiều). Làm tròn theo `POCHE_MATCH_TOL_MM` trước khi ghép chuỗi.
 */
export function ringKey(points: Pt[]): string {
  if (points.length < 3) return '';
  const q = (n: number) => Math.round(n / POCHE_MATCH_TOL_MM);
  const forms: string[] = [];
  for (const dir of [points, [...points].reverse()]) {
    // chuẩn hoá điểm bắt đầu: xoay vòng sao cho đỉnh "nhỏ nhất" đứng đầu
    let best = 0;
    for (let i = 1; i < dir.length; i++) {
      const a = dir[i];
      const b = dir[best];
      if (q(a.x) < q(b.x) || (q(a.x) === q(b.x) && q(a.y) < q(b.y))) best = i;
    }
    const rot = [...dir.slice(best), ...dir.slice(0, best)];
    forms.push(rot.map((p) => `${q(p.x)},${q(p.y)}`).join(';'));
  }
  return forms.sort()[0];
}

/** Hai bộ điểm có trùng khít không (dùng `ringKey`, nên bất biến điểm-bắt-đầu/chiều-quay). */
export function sameRing(a: Pt[], b: Pt[]): boolean {
  if (a.length !== b.length || a.length < 3) return false;
  const k = ringKey(a);
  return k !== '' && k === ringKey(b);
}

/**
 * Id NỬA KIA của cặp poché — đường bao của một vùng tô, hoặc vùng tô của một đường bao.
 * undefined = entity không thuộc cặp nào (đại đa số entity trong bản vẽ).
 *
 * THUẦN, chỉ đọc `hostId` đã neo — KHÔNG dò hình học (dò là việc của `syncPocheAnchors`, chạy một
 * lần cho cả Doc; gọi dò ở đây sẽ thành O(n²) mỗi lần UI hỏi một entity).
 */
export function pochePartnerId(doc: Doc, entityId: string): string | undefined {
  const e = doc.entities.find((x) => x.id === entityId);
  if (!e) return undefined;
  if (e.type === 'hatch' && e.hostId) {
    const host = doc.entities.find((x) => x.id === e.hostId);
    return host?.type === 'polyline' ? host.id : undefined;
  }
  if (e.type === 'polyline') {
    const child = doc.entities.find((x) => x.type === 'hatch' && x.hostId === e.id);
    return child?.id;
  }
  return undefined;
}

/**
 * RECONCILE toàn bộ liên kết poché ↔ đường bao. Gọi sau MỌI thao tác thêm/sửa/xoá — đúng khuôn
 * `syncHostedOpenings`. Idempotent: gọi lại nhiều lần trên CÙNG Doc luôn ra CÙNG kết quả.
 *
 * Làm đúng 3 việc:
 *  1. `hostId` trỏ vào entity không còn tồn tại / không phải polyline ⇒ XOÁ (không giữ rác).
 *  2. Một polyline bị 2 hatch cùng nhận làm chủ ⇒ giữ cái đầu, gỡ cái sau (1 chủ ↔ 1 con).
 *  3. Hatch CHƯA neo mà có đúng MỘT polyline trùng khít bộ điểm + cùng layer ⇒ neo vào
 *     (đường về cho dữ liệu cũ). Trùng khít với NHIỀU polyline ⇒ không neo (mơ hồ, xem K3).
 */
export function syncPocheAnchors(doc: Doc): Doc {
  const byId = new Map(doc.entities.map((e) => [e.id, e]));

  // polyline khép kín, gom theo khoá vòng + layer (ứng viên làm chủ)
  const candidates = new Map<string, string[]>();
  for (const e of doc.entities) {
    if (e.type !== 'polyline' || !e.closed) continue;
    const k = `${e.layer}|${ringKey(e.points)}`;
    if (k.endsWith('|')) continue;
    const list = candidates.get(k);
    if (list) list.push(e.id);
    else candidates.set(k, [e.id]);
  }

  const takenHost = new Set<string>();
  let changed = false;
  const next: Entity[] = doc.entities.map((e) => {
    if (e.type !== 'hatch') return e;

    // ① + ② liên kết đang có còn hợp lệ không
    if (e.hostId) {
      const host = byId.get(e.hostId);
      if (host?.type === 'polyline' && !takenHost.has(host.id)) {
        takenHost.add(host.id);
        return e;
      }
      changed = true;
      const { hostId: _drop, ...rest } = e;
      return rest as Entity;
    }

    // ③ backfill cho dữ liệu cũ — chỉ khi ĐÚNG MỘT ứng viên chưa bị nhận
    const k = `${e.layer}|${ringKey(e.points)}`;
    const free = (candidates.get(k) ?? []).filter((id) => !takenHost.has(id));
    if (free.length !== 1) return e;
    takenHost.add(free[0]);
    changed = true;
    return { ...e, hostId: free[0] };
  });

  return changed ? { ...doc, entities: next } : doc;
}

/**
 * Nở tập id ra CẢ CẶP poché — dùng cho **chọn** (chọn nét bao là cầm luôn mảng tô) lẫn **xoá**
 * (xoá một nửa không để lại nửa mồ côi). Cùng khuôn `expandDeleteWithHostedChildren` của
 * `hosting.ts`; hai hàm bổ sung nhau, gọi lồng nhau được (kết quả không phụ thuộc thứ tự).
 *
 * THUẦN. Id không thuộc cặp nào giữ nguyên, không mất.
 */
export function expandIdsWithPoche(ids: Iterable<string>, doc: Doc): Set<string> {
  const out = new Set(ids);
  const hatchByHost = new Map<string, string>();
  for (const e of doc.entities) {
    if (e.type === 'hatch' && e.hostId) hatchByHost.set(e.hostId, e.id);
  }
  const byId = new Map(doc.entities.map((e) => [e.id, e]));
  for (const id of [...out]) {
    const e = byId.get(id);
    if (!e) continue;
    if (e.type === 'hatch' && e.hostId && byId.has(e.hostId)) out.add(e.hostId);
    const child = hatchByHost.get(id);
    if (child) out.add(child);
  }
  return out;
}

/**
 * Sau một lần SỬA: chép hình học của nửa vừa bị sửa sang nửa kia — **đây mới là cái "neo" thật**,
 * cái chặn được ca "dời một nửa, nửa kia đứng yên".
 *
 * Vì sao cần `changedIds` (chứ không tự đoán ai mới đổi): hai nửa vốn PHẢI trùng nhau, nên nhìn
 * vào một Doc tĩnh thì không thể biết bên nào là bản mới. Nơi gọi (`store.ts` `updateEntities`)
 * biết chính xác entity nào vừa được ghi ⇒ truyền vào. Bên vừa sửa là CHỦ của lần chép này, bất
 * kể nó là hatch hay polyline — người dùng cầm cái nào thì cái đó đúng.
 *
 * Hai nửa cùng nằm trong `changedIds` (vd sau khi `expandIdsWithPoche` đã nở selection, cả cặp
 * được dời cùng lúc) ⇒ KHÔNG đụng: caller đã tự lo, chép thêm chỉ tổ ghi đè lên việc đúng.
 *
 * THUẦN — trả Doc mới, không sửa tại chỗ.
 */
export function propagatePocheEdits(doc: Doc, changedIds: Iterable<string>): Doc {
  const changed = new Set(changedIds);
  if (!changed.size) return doc;

  const byId = new Map(doc.entities.map((e) => [e.id, e]));
  /** id nửa-bị-động → bộ điểm mới phải nhận. */
  const patch = new Map<string, Pt[]>();

  for (const id of changed) {
    const e = byId.get(id);
    if (!e || !isPocheSide(e)) continue;
    const partnerId = pochePartnerId(doc, id);
    if (!partnerId || changed.has(partnerId)) continue;
    const partner = byId.get(partnerId);
    if (!partner || !isPocheSide(partner)) continue;
    if (sameRing(e.points, partner.points)) continue; // đã khớp, không sinh Doc mới vô ích
    patch.set(partnerId, e.points.map((p) => ({ x: p.x, y: p.y })));
  }

  if (!patch.size) return doc;
  return {
    ...doc,
    entities: doc.entities.map((e) => {
      const pts = patch.get(e.id);
      return pts && isPocheSide(e) ? ({ ...e, points: pts } as Entity) : e;
    }),
  };
}

/**
 * Kiểm kê "còn cặp nào rách không" — người tiêu thụ: test hồi quy + báo cáo nạp file cũ. Trả về
 * id các cặp mà hai nửa KHÔNG còn trùng khít (bệnh cũ đã xảy ra trước khi có file này).
 */
export function findBrokenPocheePairs(doc: Doc): { hatchId: string; outlineId: string }[] {
  const byId = new Map(doc.entities.map((e) => [e.id, e]));
  const out: { hatchId: string; outlineId: string }[] = [];
  for (const e of doc.entities) {
    if (e.type !== 'hatch' || !e.hostId) continue;
    const host = byId.get(e.hostId);
    if (host?.type !== 'polyline') continue;
    if (!sameRing(e.points, host.points)) out.push({ hatchId: e.id, outlineId: host.id });
  }
  return out;
}
