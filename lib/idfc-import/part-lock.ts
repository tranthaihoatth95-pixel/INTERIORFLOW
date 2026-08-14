/**
 * lib/idfc-import/part-lock.ts — PartLock: cấu kiện lắp ghép có tên thật + khoá từng phần
 * (phiếu `docs/phieu-giao/part-lock-cau-kien.md`, LUẬT NGÀNH thứ 6, Hoà chốt 14/08):
 * *"Chi tiết fur đều là 1 cấu kiện vật lý được ghép rời như 1 chiếc ghế thực tế. Việc tinh chỉnh
 * vật liệu ở cấp độ chi tiết sản phẩm là có... Luật chung: khi tạo sinh sản phẩm phải có cách
 * trực tiếp/gián tiếp cho phép thay đổi, tinh chỉnh thiết kế, khoá cái không đổi. Đổi điều cần đổi
 * thôi, không phải cả khối render là chốt cứng."*
 * → bản 3D của cùng nguyên tắc Grounded Render: 2D mask ảnh khoá vùng · đây là mask hình học +
 * vật liệu, khoá CẤU KIỆN không sửa [T2].
 *
 * CHỈ GHÉP hai nguồn đã có, KHÔNG viết lại thuật toán của chúng [Đ2]:
 *  · `surface-graph.ts` → N diện + cụm vật liệu (region-growing theo crease — MÙ giải phẫu, chỉ
 *    biết "mảnh liền + cùng màu"; đo thật trên Lincoln: cụm gỗ lớn nhất nối liền CHÂN→GHẾ→LƯNG vì
 *    cùng vân gỗ, nên cauKien vật liệu KHÔNG dùng trực tiếp làm cấu kiện giải phẫu — xem §2 dưới).
 *  · `chuan-net.ts`   → chân trụ + vòng tay vịn đã fit PRIMITIVE tham số (slab-cut theo trục đứng —
 *    MÙ vật liệu/giải phẫu, chỉ biết "trục đối xứng"). Phần còn lại chuan-net GIỮ NGUYÊN thành MỘT
 *    khối mesh hữu cơ (ghế+lưng+giằng dính liền) — không tự tách được ba bộ phận đó.
 *
 * VIỆC CỦA FILE NÀY (③ engine, không có ở hai nguồn trên):
 *  ① đặt tên cấu kiện theo GIẢI PHẪU ghế thật, suy từ TOẠ ĐỘ KHÔNG GIAN (không phải vật liệu):
 *     chân/vòng tay = LẤY THẲNG từ chuan-net (đã là primitive sạch, không cần suy lại); mặt ngồi/
 *     tựa lưng/thanh giằng = gom DIỆN của surface-graph theo VÙNG Y (chiều cao) sau khi loại trừ
 *     vùng đã bị chân/vòng "ăn" — xem §2.
 *  ② cờ `khoa` per-cấu-kiện.
 *  ③ `regenerateUnlocked` — CHỈ tái sinh phần chưa khoá; phần khoá copy y nguyên + hash để CHỨNG
 *     MINH bất biến [T6] (đo được, không phải "trông có vẻ giống").
 *
 * §2 — VÌ SAO KHÔNG DÙNG THẲNG `surfaceGraph.cauKien` (cụm vật liệu) để đặt tên giải phẫu:
 * đo thật trên Lincoln 327 (`scratchpad/lincoln-surface-graph.json`), cauKien #0 (gỗ, 25% diện
 * tích) gồm 19 diện trải Y từ −552 đến 458 — tức nối liền TỪ CHÂN (đáy) tới TỰA LƯNG (đỉnh) chỉ vì
 * cùng vân gỗ óc chó và các diện đó CHIA SẺ BIÊN dọc theo khung ghế. Dùng cụm này làm "1 cấu kiện"
 * sẽ khoá/tinh-chỉnh nhầm cả bộ khung cùng lúc — trái đúng tinh thần luật ("đổi điều cần đổi thôi").
 * ⇒ file này gom lại theo VÙNG KHÔNG GIAN (bbox theo trục đứng + phía trước/sau), bỏ qua vật liệu —
 * lệch so với câu tổng quát trong phiếu ("diện liền kề + cùng vật liệu + cùng vùng ⇒ 1 cấu kiện",
 * vốn mô tả đúng cơ chế `cauKien` sẵn có) nhưng bằng chứng trên cho thấy áp nguyên văn quy tắc đó
 * cho MỌI cấu kiện sẽ sai giải phẫu; quyết định này ghi rõ ở đây để T/Hoà xét lại nếu cần.
 *
 * THUẦN — không fs/mạng/DOM/AI, không import runtime của `chuan-net.ts` (chỉ `import type`, tránh
 * kéo `three` vào nơi không cần) — chỉ gọi hai hàm dựng sẵn `xayDoThiDien`/`chuanNet` ở NƠI GỌI.
 * Hash tự viết (FNV-1a 32-bit trên JSON khoá đã sắp thứ tự) — không phụ thuộc Node `crypto` để
 * chạy được cả trình duyệt, đúng tinh thần "THUẦN" của hai file nguồn.
 */
import { rgbToHex, type Dien, type LoaiDien, type V3 } from './surface-graph';
import type { ChuanNetPart } from './chuan-net';

/* ══════════════════════ vector nhỏ (glue — không phải engine) ══════════════════════ */

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const dist = (a: V3, b: V3): number => len(sub(a, b));
function unit(a: V3): V3 { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

/** hai trục ⟂ với `n` (dựng khung cục bộ ổn định) — bản glue, không đụng bản trong surface-graph.ts. */
function perp2(n: V3): [V3, V3] {
  const t: V3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = unit([n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]]);
  const e2 = unit([n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]]);
  return [e1, e2];
}

/** khoảng cách điểm p tới ĐOẠN tâm `c`, trục `axisUnit` (đã unit), nửa-dài `halfLen`. */
function distToSegment(p: V3, c: V3, axisUnit: V3, halfLen: number): number {
  const d = sub(p, c);
  const t = Math.max(-halfLen, Math.min(halfLen, dot(d, axisUnit)));
  const closest: V3 = [c[0] + axisUnit[0] * t, c[1] + axisUnit[1] * t, c[2] + axisUnit[2] * t];
  return dist(p, closest);
}

/** khoảng cách điểm p tới VÒNG bán kính `rMajor` tâm `c`, mặt phẳng ⟂ `axisUnit`. */
function distToRing(p: V3, c: V3, axisUnit: V3, rMajor: number): number {
  const d = sub(p, c);
  const along = dot(d, axisUnit);
  const radial: V3 = [d[0] - axisUnit[0] * along, d[1] - axisUnit[1] * along, d[2] - axisUnit[2] * along];
  const r = len(radial);
  return Math.hypot(r - rMajor, along);
}

/* ══════════════════════ FNV-1a 32-bit — hash ĐO ĐƯỢC, không phụ thuộc Node crypto ══════════════════════ */

/** stringify với KHOÁ ĐÃ SẮP THỨ TỰ đệ quy — 2 object cùng nội dung luôn ra cùng chuỗi bất kể thứ
 * tự khai báo trường lúc dựng (điều kiện cần để hash "đo được" chứ không phải "thường thì giống"). */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(',')}}`;
}

export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** hash NỘI DUNG hình học+vật liệu của 1 cấu kiện — CỐ Ý loại `khoa` (khoá là hành động, không phải
 * nội dung) và `provenance` (chỉ là chú thích, không phải hình học) — [T6] đo TRÊN phần phải bất biến. */
export function partContentHash(p: Pick<PartLockPart, 'id' | 'geomRef' | 'matHex' | 'matId'>): string {
  const s = stableStringify({ id: p.id, geomRef: p.geomRef, matHex: p.matHex, matId: p.matId });
  return `${fnv1a(s)}:${s.length}b`; // kèm ĐỘ DÀI chuỗi ổn định — 2 số độc lập cùng khớp mới coi là bất biến
}

/* ══════════════════════ ① kiểu dữ liệu ══════════════════════ */

export type GeomRefMeshSubset = {
  kind: 'meshSubset';
  /** id các diện (surface-graph) hợp thành cấu kiện này */
  dienIds: number[];
  soTri: number;
  dienTichPct: number;
};

export type GeomRefBuildOp = {
  kind: 'buildOp';
  /** id mảnh trong ChuanNetResult.parts (vd "p1-chan") — TRUY VẾT NGƯỢC được [Đ2] */
  chuanNetPartId: string;
  loai: 'cylinder' | 'torus';
  buildOp: Extract<ChuanNetPart, { loai: 'cylinder' }>['buildOp'];
  thamSo: Extract<ChuanNetPart, { loai: 'cylinder' }>['thamSo'] | Extract<ChuanNetPart, { loai: 'torus' }>['thamSo'];
};

export type GeomRef = GeomRefMeshSubset | GeomRefBuildOp;

export interface PartLockPart {
  id: string;
  tenNghe: { vi: string; en: string };
  geomRef: GeomRef;
  matHex: string;
  matId: string | null;
  khoa: boolean;
  /** chuỗi truy vết: nguồn nào (surface-graph diện #id | chuan-net part id) + luật gán tên. */
  provenance: string;
}

export interface PartLockLienKet { a: string; b: string }

export interface PartLockAsset {
  parts: PartLockPart[];
  /** cấu kiện nào chạm cấu kiện nào — để tinh chỉnh 1 phần không làm rách mối nối */
  lienKet: PartLockLienKet[];
  /** khai thật những gì KHÔNG gán tên giải phẫu được / giả định đã dùng — [T0] */
  ghiChu: string[];
}

/* ══════════════════════ ② gom diện → cấu kiện giải phẫu ══════════════════════ */

/** Đầu vào tối thiểu — CHỈ đòi `dien`, không đòi cả `DoThiDien` (mesh/cauKien/tomTat không dùng
 * tới) — một `DoThiDien` thật (từ `xayDoThiDien`) khớp kiểu này tự nhiên (structural typing). */
export interface SurfaceGraphInput { dien: Dien[] }
/** CHỈ đòi `parts` — một `ChuanNetResult` thật (từ `chuanNet`) khớp kiểu này tự nhiên. */
export interface ChuanNetInput { parts: ChuanNetPart[] }

type CylPart = Extract<ChuanNetPart, { loai: 'cylinder' }>;
type TorusPart = Extract<ChuanNetPart, { loai: 'torus' }>;

const kdToHex = (kd: V3 | null): string => (kd ? rgbToHex([kd[0] * 255, kd[1] * 255, kd[2] * 255]) : '#888888');

/** Ghép hai nguồn thành cây cấu kiện có TÊN GIẢI PHẪU + cờ khoá. Hàm THUẦN, không random/thời gian
 * → cùng đầu vào luôn ra cùng đầu ra (điều kiện cần để test "đúng số lượng kỳ vọng" ổn định). */
export function buildPartLockFromChuanNet(surfaceGraph: SurfaceGraphInput, chuanNet: ChuanNetInput): PartLockAsset {
  const ghiChu: string[] = [];
  const dien = surfaceGraph.dien;
  const legs = chuanNet.parts.filter((p): p is CylPart => p.loai === 'cylinder');
  const rings = chuanNet.parts.filter((p): p is TorusPart => p.loai === 'torus');
  if (legs.length !== 4) ghiChu.push(`kỳ vọng 4 chân, chuan-net trả ${legs.length} — tên trái/phải/trước/sau có thể trùng nhau.`);
  if (rings.length !== 2) ghiChu.push(`kỳ vọng 2 vòng tay vịn, chuan-net trả ${rings.length}.`);

  const used = new Set<string>();
  const uniqueId = (base: string): string => {
    if (!used.has(base)) { used.add(base); return base; }
    let i = 2;
    while (used.has(`${base}-${i}`)) i++;
    used.add(`${base}-${i}`);
    return `${base}-${i}`;
  };

  /* ── ①a chân + vòng: LẤY THẲNG từ chuan-net, không suy lại hình học — chỉ suy TÊN từ toạ độ ── */

  // "sau" (phía tựa lưng) là hướng Z mà các diện Y CAO NHẤT (đỉnh ghế, sau khi trừ vòng tay) nghiêng
  // về — tránh hardcode dấu Z cố định, để hàm còn đúng nếu chiều dựng model đảo trục.
  const ringExcludeR = (r: TorusPart) => Math.max(r.thamSo.rMinorMm * 5, 60);
  const legExcludeR = (l: CylPart) => Math.max(l.thamSo.radiusMm * 4, 60);
  const notNearLegOrRing = (d: Dien): boolean => {
    for (const l of legs) {
      const axis = unit(l.thamSo.axis);
      if (distToSegment(d.frame.goc, l.thamSo.centerMm, axis, l.thamSo.heightMm / 2 + 40) < legExcludeR(l)) return false;
    }
    for (const r of rings) {
      const axis = unit(r.thamSo.axis);
      if (distToRing(d.frame.goc, r.thamSo.centerMm, axis, r.thamSo.rMajorMm) < ringExcludeR(r)) return false;
    }
    return true;
  };
  const nonFloor = dien.filter((d) => !d.nghiVanBongSan);
  const freeCandidates = nonFloor.filter(notNearLegOrRing);
  const topK = freeCandidates.slice().sort((a, b) => b.frame.goc[1] - a.frame.goc[1]).slice(0, Math.max(1, Math.min(5, freeCandidates.length)));
  const rearZ = topK.reduce((s, d) => s + d.frame.goc[2], 0) / (topK.length || 1);
  const rearSign = rearZ >= 0 ? 1 : -1; // dấu Z của phía "sau" (tựa lưng)

  const legParts: PartLockPart[] = legs.map((l) => {
    const xSide = l.thamSo.centerMm[0] >= 0 ? 'phai' : 'trai';
    const zSign = l.thamSo.centerMm[2] >= 0 ? 1 : -1;
    const zSide = zSign === rearSign ? 'sau' : 'truoc';
    const id = uniqueId(`chan-${xSide}-${zSide}`);
    return {
      id,
      tenNghe: {
        vi: `Chân ${xSide === 'phai' ? 'phải' : 'trái'} ${zSide === 'sau' ? 'sau' : 'trước'}`,
        en: `Leg (${xSide === 'phai' ? 'right' : 'left'}-${zSide === 'sau' ? 'rear' : 'front'})`,
      },
      geomRef: { kind: 'buildOp', chuanNetPartId: l.id, loai: 'cylinder', buildOp: l.buildOp, thamSo: l.thamSo },
      matHex: kdToHex(l.kdSrgb),
      matId: null,
      khoa: false,
      provenance: `chuan-net:${l.id} (cylinder fit, RMS ${l.saiSoPct.toFixed(2)}% · r=${l.thamSo.radiusMm.toFixed(1)}mm h=${l.thamSo.heightMm.toFixed(0)}mm) → tên suy từ dấu X (trái/phải) + dấu Z so rearSign=${rearSign} (trước/sau)`,
    };
  });

  const ringParts: PartLockPart[] = rings.map((r) => {
    const xSide = r.thamSo.centerMm[0] >= 0 ? 'phai' : 'trai';
    const id = uniqueId(`vong-tay-${xSide}`);
    return {
      id,
      tenNghe: { vi: `Vòng tay vịn ${xSide === 'phai' ? 'phải' : 'trái'}`, en: `Armrest ring (${xSide === 'phai' ? 'right' : 'left'})` },
      geomRef: { kind: 'buildOp', chuanNetPartId: r.id, loai: 'torus', buildOp: r.buildOp, thamSo: r.thamSo },
      matHex: kdToHex(r.kdSrgb),
      matId: null,
      khoa: false,
      provenance: `chuan-net:${r.id} (torus fit, RMS ${r.saiSoPct.toFixed(2)}% · R=${r.thamSo.rMajorMm.toFixed(1)}mm r=${r.thamSo.rMinorMm.toFixed(1)}mm) → tên suy từ dấu X (trái/phải)`,
    };
  });

  /* ── ①b mặt ngồi / tựa lưng / thanh giằng: gom DIỆN theo VÙNG Y (surface-graph), sau khi trừ
   * vùng chân/vòng — dải Y suy TỈ LỆ theo hình học chân/vòng thật (không hardcode số mm cố định,
   * để hàm còn hợp lý nếu đổi kích thước ghế khác Lincoln 327). ── */
  let seatPart: PartLockPart | null = null;
  let backrestPart: PartLockPart | null = null;
  let stretcherPart: PartLockPart | null = null;
  const claimed = new Set<number>(); // dienId đã gán vào 1 cấu kiện có tên

  if (legs.length && rings.length) {
    const legTopY = legs.reduce((s, l) => s + (l.thamSo.centerMm[1] + l.thamSo.heightMm / 2), 0) / legs.length;
    const legBotY = legs.reduce((s, l) => s + (l.thamSo.centerMm[1] - l.thamSo.heightMm / 2), 0) / legs.length;
    const legSpan = Math.max(1, legTopY - legBotY);
    const ringBotY = rings.reduce((s, r) => s + (r.thamSo.centerMm[1] - r.thamSo.rMajorMm), 0) / rings.length;

    const seatMin = legTopY - 0.08 * legSpan;
    const seatMax = ringBotY + 0.11 * legSpan;
    const stretchMin = legBotY + 0.28 * legSpan;
    const stretchMax = legBotY + 0.62 * legSpan;
    // z-extent (bề rộng trước-sau) để đặt ngưỡng "rõ ràng ở phía sau" theo % — không hardcode mm.
    const zs = freeCandidates.map((d) => d.frame.goc[2]);
    const zExtent = zs.length ? Math.max(...zs) - Math.min(...zs) : 0;
    const rearThresh = 0.075 * zExtent; // 7,5% bề sâu — đo thật Lincoln: ngăn được cọc tay vịn phía trước lẫn vào

    const seatDien: number[] = [];
    const backDien: number[] = [];
    for (const d of freeCandidates) {
      const y = d.frame.goc[1];
      const z = d.frame.goc[2];
      if (y >= seatMin && y <= seatMax) seatDien.push(d.id);
      else if (y > seatMax && rearSign * z > rearThresh) backDien.push(d.id);
    }

    const stretchCandidates = freeCandidates.filter((d) => d.loai === 'freeform' && d.frame.goc[1] >= stretchMin && d.frame.goc[1] <= stretchMax);
    const stretchSeed = stretchCandidates.slice().sort((a, b) => b.dienTichPct - a.dienTichPct)[0] ?? null;

    const mkMeshPart = (ids: number[], baseId: string, vi: string, en: string, ruleNote: string): PartLockPart | null => {
      if (!ids.length) return null;
      const list = ids.map((id) => dien.find((d) => d.id === id)!).filter(Boolean);
      const dominant = list.slice().sort((a, b) => b.dienTichPct - a.dienTichPct)[0];
      const soTri = list.reduce((s, d) => s + d.soTri, 0);
      const dienTichPct = list.reduce((s, d) => s + d.dienTichPct, 0);
      ids.forEach((id) => claimed.add(id));
      return {
        id: uniqueId(baseId),
        tenNghe: { vi, en },
        geomRef: { kind: 'meshSubset', dienIds: ids.slice().sort((a, b) => a - b), soTri, dienTichPct: +dienTichPct.toFixed(3) },
        matHex: dominant.mauHex ?? '#888888',
        matId: dominant.vatLieu?.matId ?? null,
        khoa: false,
        provenance: `surface-graph: ${ids.length} diện [${ids.slice().sort((a, b) => a - b).join(',')}] gộp theo ${ruleNote}`,
      };
    };

    seatPart = mkMeshPart(seatDien, 'mat-ngoi', 'Mặt ngồi', 'Seat', `Y∈[${seatMin.toFixed(0)},${seatMax.toFixed(0)}]mm (giữa đỉnh chân=${legTopY.toFixed(0)} và đáy vòng tay=${ringBotY.toFixed(0)})`);
    if (!seatPart) ghiChu.push(`mat-ngoi: KHÔNG có diện nào trong dải Y[${seatMin.toFixed(0)},${seatMax.toFixed(0)}] sau khi trừ chân/vòng — bỏ qua, không ép tên.`);

    backrestPart = mkMeshPart(backDien, 'tua-lung', 'Tựa lưng', 'Backrest', `Y>${seatMax.toFixed(0)}mm & lệch về phía sau >${rearThresh.toFixed(0)}mm theo Z`);
    if (!backrestPart) ghiChu.push(`tua-lung: KHÔNG có diện nào thoả Y>${seatMax.toFixed(0)} & lùi sau >${rearThresh.toFixed(0)}mm — bỏ qua, không ép tên.`);

    if (stretchSeed) {
      claimed.add(stretchSeed.id);
      stretcherPart = {
        id: uniqueId('thanh-giang'),
        tenNghe: { vi: 'Thanh giằng', en: 'Stretcher' },
        geomRef: { kind: 'meshSubset', dienIds: [stretchSeed.id], soTri: stretchSeed.soTri, dienTichPct: +stretchSeed.dienTichPct.toFixed(3) },
        matHex: stretchSeed.mauHex ?? '#888888',
        matId: stretchSeed.vatLieu?.matId ?? null,
        khoa: false,
        provenance: `surface-graph: diện #${stretchSeed.id} — freeform LỚN NHẤT (${stretchSeed.dienTichPct.toFixed(2)}% diện tích) trong dải Y∈[${stretchMin.toFixed(0)},${stretchMax.toFixed(0)}]mm (28%-62% chiều cao chân, dưới mặt ngồi)`,
      };
    } else {
      ghiChu.push(`thanh-giang: KHÔNG có diện freeform nào trong dải Y[${stretchMin.toFixed(0)},${stretchMax.toFixed(0)}] — bỏ qua, không ép tên.`);
    }
  } else {
    ghiChu.push('Thiếu chân hoặc vòng tay từ chuan-net → KHÔNG suy được dải Y giải phẫu, bỏ qua mat-ngoi/tua-lung/thanh-giang.');
  }

  /* ── ①c phần còn lại: KHÔNG khớp tên nghề nào → giữ tên kỹ thuật `phan-YY` (mỗi diện 1 cấu kiện,
   * không tự gộp — tránh bịa một "cấu kiện" gộp mà không rõ nó LÀ GÌ). ── */
  const leftoverParts: PartLockPart[] = [];
  for (const d of dien) {
    if (d.nghiVanBongSan) continue; // bóng sàn nướng vào mesh — không phải cấu kiện vật lý, bỏ hẳn
    if (claimed.has(d.id)) continue;
    if (!notNearLegOrRing(d)) continue; // đã thuộc vùng chân/vòng — không lặp lại thành phan-YY
    const yy = String(d.id).padStart(2, '0');
    leftoverParts.push({
      id: uniqueId(`phan-${yy}`),
      tenNghe: { vi: `Phần kỹ thuật #${yy}`, en: `Technical part #${yy}` },
      geomRef: { kind: 'meshSubset', dienIds: [d.id], soTri: d.soTri, dienTichPct: +d.dienTichPct.toFixed(3) },
      matHex: d.mauHex ?? '#888888',
      matId: d.vatLieu?.matId ?? null,
      khoa: false,
      provenance: `surface-graph: diện #${d.id} (loai=${d.loai}) — không khớp dải Y giải phẫu nào đã biết, giữ tên kỹ thuật`,
    });
  }

  const parts = [...legParts, ...ringParts, ...(seatPart ? [seatPart] : []), ...(backrestPart ? [backrestPart] : []), ...(stretcherPart ? [stretcherPart] : []), ...leftoverParts];

  /* ── ② liên kết: cấu kiện nào CHẠM cấu kiện nào — theo khoảng cách nhỏ nhất giữa điểm đại diện. ── */
  const lienKet = ganLienKet(parts, dien);

  return { parts, lienKet, ghiChu };
}

/* ══════════════════════ liên kết (điểm chạm) ══════════════════════ */

function repPointsMeshSubset(dien: Dien[], ids: number[]): V3[] {
  const pts: V3[] = [];
  for (const id of ids) {
    const d = dien.find((x) => x.id === id);
    if (!d) continue;
    pts.push(d.frame.goc);
    for (const poly of d.bien) for (const p of poly) pts.push(p);
  }
  return pts;
}

function repPointsCylinder(thamSo: CylPart['thamSo']): V3[] {
  const axis = unit(thamSo.axis);
  const [e1, e2] = perp2(axis);
  const half = thamSo.heightMm / 2;
  const r = thamSo.radiusMm;
  const pts: V3[] = [];
  for (const h of [-half, 0, half]) {
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const cx = Math.cos(ang) * r, sx = Math.sin(ang) * r;
      pts.push([
        thamSo.centerMm[0] + axis[0] * h + e1[0] * cx + e2[0] * sx,
        thamSo.centerMm[1] + axis[1] * h + e1[1] * cx + e2[1] * sx,
        thamSo.centerMm[2] + axis[2] * h + e1[2] * cx + e2[2] * sx,
      ]);
    }
  }
  return pts;
}

function repPointsTorus(thamSo: TorusPart['thamSo']): V3[] {
  const axis = unit(thamSo.axis);
  const [e1, e2] = perp2(axis);
  const R = thamSo.rMajorMm;
  const pts: V3[] = [];
  for (let a = 0; a < 16; a++) {
    const ang = (a / 16) * Math.PI * 2;
    const cx = Math.cos(ang) * R, sx = Math.sin(ang) * R;
    pts.push([thamSo.centerMm[0] + e1[0] * cx + e2[0] * sx, thamSo.centerMm[1] + e1[1] * cx + e2[1] * sx, thamSo.centerMm[2] + e1[2] * cx + e2[2] * sx]);
  }
  return pts;
}

function repPoints(p: PartLockPart, dien: Dien[]): V3[] {
  if (p.geomRef.kind === 'meshSubset') return repPointsMeshSubset(dien, p.geomRef.dienIds);
  if (p.geomRef.loai === 'cylinder') return repPointsCylinder(p.geomRef.thamSo as CylPart['thamSo']);
  return repPointsTorus(p.geomRef.thamSo as TorusPart['thamSo']);
}

function minDist(a: V3[], b: V3[]): number {
  let best = Infinity;
  for (const p of a) for (const q of b) { const d = dist(p, q); if (d < best) best = d; }
  return best;
}

/** ngưỡng "chạm" — rộng rãi vì fillet/mép nối đã bị hai pipeline (region-growing / slab-fit) xoá
 * hoặc đơn giản hoá, khoảng hở vài chục mm giữa 2 mảnh liền kề là bình thường, không phải hở thật. */
const TOUCH_THRESH_MM = 90;

function ganLienKet(parts: PartLockPart[], dien: Dien[]): PartLockLienKet[] {
  const pts = parts.map((p) => repPoints(p, dien));
  const out: PartLockLienKet[] = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (!pts[i].length || !pts[j].length) continue;
      if (minDist(pts[i], pts[j]) < TOUCH_THRESH_MM) out.push({ a: parts[i].id, b: parts[j].id });
    }
  }
  return out;
}

/* ══════════════════════ ③ khoá — tái sinh CHỈ phần chưa khoá ══════════════════════ */

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * CHỈ gọi `tinhChinh` trên cấu kiện KHÔNG nằm trong `khoaIds`; cấu kiện bị khoá được deep-clone,
 * `khoa` ép về `true`, KHÔNG đưa qua `tinhChinh` — [T6] hash `partContentHash` trước=sau phải TUYỆT
 * ĐỐI bằng nhau cho phần khoá (test + proof chứng minh bằng số, không phải bằng mắt).
 */
export function regenerateUnlocked(
  asset: PartLockAsset,
  khoaIds: string[],
  tinhChinh: (part: PartLockPart) => PartLockPart,
): PartLockAsset {
  const khoaSet = new Set(khoaIds);
  const parts = asset.parts.map((p) => {
    if (khoaSet.has(p.id)) return { ...deepClone(p), khoa: true };
    return tinhChinh(deepClone(p));
  });
  return { ...asset, parts, lienKet: asset.lienKet, ghiChu: asset.ghiChu };
}

/* ══════════════════════ soi mắt — bảng ASCII cây cấu kiện ══════════════════════ */

export function asciiTree(asset: PartLockAsset): string {
  const rows = asset.parts.map((p) => {
    const loai = p.geomRef.kind === 'buildOp' ? p.geomRef.loai : `mesh×${p.geomRef.dienIds.length}diện`;
    const pct = p.geomRef.kind === 'buildOp' ? '' : `${p.geomRef.dienTichPct.toFixed(1)}%`;
    return { id: p.id, vi: p.tenNghe.vi, loai, pct, khoa: p.khoa ? '🔒' : '·', mat: p.matHex };
  });
  const w1 = Math.max(3, ...rows.map((r) => r.id.length));
  const w2 = Math.max(4, ...rows.map((r) => r.vi.length));
  const w3 = Math.max(4, ...rows.map((r) => r.loai.length));
  const lines = [
    `${'id'.padEnd(w1)}  ${'tên nghề'.padEnd(w2)}  ${'loại'.padEnd(w3)}  %dt     khoá  màu`,
    ...rows.map((r) => `${r.id.padEnd(w1)}  ${r.vi.padEnd(w2)}  ${r.loai.padEnd(w3)}  ${r.pct.padStart(6)}  ${r.khoa}     ${r.mat}`),
  ];
  return lines.join('\n');
}
