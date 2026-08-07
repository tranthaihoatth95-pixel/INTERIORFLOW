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
/**
 * Sai số coi một đỉnh là "thẳng hàng, thừa" (mm). Rộng hơn `POCHE_MATCH_TOL_MM` rất nhiều vì đây
 * là sai số HÌNH HỌC của bản vẽ thật (điểm chia cạnh do phần mềm CAD tự chèn), không phải sai số
 * dấu phẩy động. 0,5 mm ở tỉ lệ 1:50 là 0,01 mm trên giấy — không mắt nào thấy.
 */
export const POCHE_COLLINEAR_TOL_MM = 0.5;

/**
 * Bỏ đỉnh THỪA của một vòng: đỉnh trùng đỉnh liền trước, và đỉnh nằm THẲNG HÀNG giữa hai đỉnh kề
 * (không đổi hình, chỉ đổi cách kể).
 *
 * 🔴 VÌ SAO PHẢI CÓ — đo trên hồ sơ thật, không phải phòng xa (G-M1-08 vòng 2). Một cái cột trong
 * bản vẽ nhập vào gồm **1 đường bao 4 đỉnh + 9 mảng tô 5 đỉnh**, tất cả CÙNG một bản chèn, CÙNG
 * lớp, và 4 đỉnh đầu TRÙNG KHÍT tới từng phần nghìn mm. Đỉnh thứ 5 của mảng tô là một điểm nằm
 * GIỮA cạnh trên — phần mềm CAD chèn vào khi cắt cạnh, không thêm hình gì. Chỉ vì cái đỉnh thừa
 * đó mà `ringKey` ra hai chuỗi khác nhau ⇒ **0/126 mảng tô neo được**, và kết luận cũ ("hồ sơ thật
 * không có nửa đường bao để neo") là SAI: đường bao có, chỉ là bộ so trùng quá cứng.
 *
 * THUẦN. Vòng < 3 đỉnh trả nguyên; không bao giờ trả về ít hơn 3 đỉnh (vòng suy biến giữ nguyên
 * để nơi gọi tự loại, đừng biến nó thành đoạn thẳng sau lưng người ta).
 */
export function normalizeRing(points: Pt[], tolMm = POCHE_COLLINEAR_TOL_MM): Pt[] {
  if (points.length < 3) return points;
  // ① bỏ đỉnh trùng liền kề (kể cả đỉnh cuối trùng đỉnh đầu — vòng "đóng bằng cách lặp đỉnh")
  const uniq: Pt[] = [];
  for (const p of points) {
    const last = uniq[uniq.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) <= tolMm) continue;
    uniq.push(p);
  }
  while (uniq.length > 1 && Math.hypot(uniq[0].x - uniq[uniq.length - 1].x, uniq[0].y - uniq[uniq.length - 1].y) <= tolMm) {
    uniq.pop();
  }
  if (uniq.length < 3) return points;

  // ② bỏ đỉnh thẳng hàng — lặp cho tới khi không bỏ được nữa (ba đỉnh thừa liên tiếp cũng sạch)
  let ring = uniq;
  let removed = true;
  while (removed && ring.length > 3) {
    removed = false;
    const keep: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[(i - 1 + ring.length) % ring.length];
      const b = ring[i];
      const c = ring[(i + 1) % ring.length];
      // khoảng cách từ b tới đoạn a→c; nhỏ hơn sai số ⇒ b không mang hình gì
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const L = Math.hypot(dx, dy);
      const d = L === 0 ? Math.hypot(b.x - a.x, b.y - a.y) : Math.abs(dy * (b.x - a.x) - dx * (b.y - a.y)) / L;
      if (d <= tolMm && ring.length - (keep.length === i ? 0 : 1) > 3) {
        // chỉ bỏ khi vòng còn ≥ 3 đỉnh sau khi bỏ
        if (ring.length - 1 >= 3) { removed = true; continue; }
      }
      keep.push(b);
    }
    if (removed) ring = keep;
  }
  return ring.length >= 3 ? ring : points;
}

export function ringKey(points: Pt[]): string {
  const norm = normalizeRing(points);
  if (norm.length < 3) return '';
  const q = (n: number) => Math.round(n / POCHE_MATCH_TOL_MM);
  const forms: string[] = [];
  for (const dir of [norm, [...norm].reverse()]) {
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

/**
 * Hai bộ điểm có trùng khít không (dùng `ringKey`, nên bất biến điểm-bắt-đầu/chiều-quay).
 *
 * ⚠️ KHÔNG so `a.length !== b.length` nữa (bỏ 06/08, vòng 2): hai vòng CÙNG hình có thể khác số
 * đỉnh vì một bên mang đỉnh thẳng-hàng thừa — đó chính là ca 4 đỉnh vs 5 đỉnh của hồ sơ thật.
 * `ringKey` đã chuẩn hoá qua `normalizeRing`, so khoá là đủ và đúng hơn.
 */
export function sameRing(a: Pt[], b: Pt[]): boolean {
  if (a.length < 3 || b.length < 3) return false;
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
  return pochePartnerIds(doc, entityId)[0];
}

/**
 * MỌI nửa kia — vì một đường bao có thể mang NHIỀU mảng tô.
 *
 * 🔴 Đo trên hồ sơ thật (06/08, vòng 2): một cái cột = **1 đường bao + 9 mảng tô** chồng nhau,
 * cùng vòng, khác `pattern` (ANSI31 ×6 · ANSI37 · SOLID · DOTS) — người vẽ chồng nhiều lớp gạch để
 * ra sắc độ mong muốn. Luật cũ "1 chủ ↔ 1 con" neo được đúng 1 trong 9 ⇒ dời cột thì 8 mảng còn
 * lại ở lại chỗ cũ. Đó vẫn là đúng cái bệnh G-M1-08, chỉ đỡ hơn về số lượng.
 *
 * Chiều ngược lại VẪN LÀ MỘT: mỗi mảng tô có đúng một `hostId`. Ràng buộc chống mơ hồ nay nằm ở
 * phía CHỦ (hai đường bao trùng vòng trên cùng lớp ⇒ không neo, xem `syncPocheAnchors` ③).
 */
export function pochePartnerIds(doc: Doc, entityId: string): string[] {
  const e = doc.entities.find((x) => x.id === entityId);
  if (!e) return [];
  if (e.type === 'hatch' && e.hostId) {
    const host = doc.entities.find((x) => x.id === e.hostId);
    return host?.type === 'polyline' ? [host.id] : [];
  }
  if (e.type === 'polyline') {
    return doc.entities.filter((x) => x.type === 'hatch' && x.hostId === e.id).map((x) => x.id);
  }
  return [];
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

  let changed = false;
  const next: Entity[] = doc.entities.map((e) => {
    if (e.type !== 'hatch') return e;

    // ① liên kết đang có còn hợp lệ không (chủ còn sống và đúng là đường bao)
    if (e.hostId) {
      const host = byId.get(e.hostId);
      if (host?.type === 'polyline') return e;
      changed = true;
      const { hostId: _drop, ...rest } = e;
      return rest as Entity;
    }

    // ② backfill — chỉ khi có ĐÚNG MỘT đường bao trùng vòng trên cùng lớp.
    // Nhiều mảng tô cùng nhận một đường bao là HỢP LỆ (xem `pochePartnerIds`); mơ hồ là khi có
    // NHIỀU ĐƯỜNG BAO trùng vòng — lúc đó không biết neo vào cái nào, thà không neo (K3).
    const k = `${e.layer}|${ringKey(e.points)}`;
    const hosts = candidates.get(k) ?? [];
    if (hosts.length !== 1) return e;
    changed = true;
    return { ...e, hostId: hosts[0] };
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
  // 1 chủ → NHIỀU con (hồ sơ thật: 9 mảng tô chồng trên 1 đường bao cột).
  const hatchesByHost = new Map<string, string[]>();
  for (const e of doc.entities) {
    if (e.type !== 'hatch' || !e.hostId) continue;
    const list = hatchesByHost.get(e.hostId);
    if (list) list.push(e.id);
    else hatchesByHost.set(e.hostId, [e.id]);
  }
  const byId = new Map(doc.entities.map((e) => [e.id, e]));
  for (const id of [...out]) {
    const e = byId.get(id);
    if (!e) continue;
    if (e.type === 'hatch' && e.hostId && byId.has(e.hostId)) {
      out.add(e.hostId);
      // anh em cùng chủ đi theo luôn — nếu không, dời mảng tô này thì 8 mảng kia ở lại
      for (const sib of hatchesByHost.get(e.hostId) ?? []) out.add(sib);
    }
    for (const child of hatchesByHost.get(id) ?? []) out.add(child);
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
    // MỌI nửa kia — sửa đường bao cột thì cả 9 mảng tô phải đi theo, không chỉ mảng đầu tiên.
    for (const partnerId of pochePartnerIds(doc, id)) {
      if (changed.has(partnerId)) continue;
      const partner = byId.get(partnerId);
      if (!partner || !isPocheSide(partner)) continue;
      if (sameRing(e.points, partner.points)) continue; // đã khớp, không sinh Doc mới vô ích
      patch.set(partnerId, e.points.map((p) => ({ x: p.x, y: p.y })));
    }
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
