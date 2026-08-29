/**
 * lib/cad/tuong-hinh-hoc.ts — NHẬN DIỆN TƯỜNG BẰNG HÌNH HỌC, không đọc tên layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * BỆNH (đo được, `docs/nc/NC-DOC-NGUOC-THAO-TAC-VE-2026-08-28.md`): IF đòi tường phải là **hatch
 * poché** (`commands.ts` `wallSegmentOutline`) — đó là cách IF TỰ vẽ. Nhưng bản vẽ nghề thật không
 * có poché: thợ vẽ tường bằng `OFFSET` ⇒ **hai đường song song**. Hệ quả đo trên
 * `03_TANG5B-TTT.dxf`: IF đọc 12.274 entity không lỗi rồi dựng ra **đúng 1 khối sàn**.
 *
 * THUỐC: **giải ngược đúng chuỗi lệnh người vẽ đã chạy** — mỗi lệnh CAD là một phép biến đổi có
 * nghịch đảo. Bốn bước, theo đúng thứ tự người vẽ đã làm nhưng đi ngược:
 *
 *   ① ĐẢO OFFSET (`ghepDoiDocQuyen`)  hai nét song song  →  MỘT trục giữa + MỘT bề dày
 *   ② ĐẢO TRIM   (`daoTrim`)          các mảnh cùng đường → MỘT bức tường nguyên
 *   ③ ĐẢO ARRAY  (`boArray`)          ≥4 trục bước đều    → KHÔNG phải tường (bậc thang/nan/gạch)
 *   ④ GỘP CHÙM   (`gopChum`)          chùm nét cùng tường → BAO NGOÀI (bề dày = hai nét ngoài cùng)
 *
 * VÌ SAO ĐÚNG CHỨ KHÔNG MAY: nó không đoán ý người vẽ, nó giải ngược phép biến đổi đã áp. Bằng
 * chứng tự chấm được: bề dày rơi ra đúng các nấc nghề `200 · 400 · 100 · 300 mm` — **chính những
 * con số người vẽ đã gõ vào `OFFSET`**. Nhận diện sai sẽ cho phân bố tán loạn.
 *
 * ⛔ **KHÔNG ĐỌC MỘT TÊN LAYER NÀO** (LUẬT NỀN TẢNG §1 + K3). Trên chính bản vẽ đo được, tường nằm
 * trên `A-Draw` chứ KHÔNG nằm trên `A-Wall` — nhận diện bằng tên layer sẽ trượt sạch, và nó nhét
 * chuẩn đặt tên của một studio vào sản phẩm bán ra. `layer` chỉ dùng làm **khoá gom nhóm** (hai nét
 * khác layer thì không ghép thành một tường), không bao giờ dùng làm **điều kiện nhận dạng**.
 *
 * ⚠️ NGHIỆM THU TỰ CHẤM của bước ② (đã cứu một lần, xem "đường sai đã loại" trong sổ NC):
 * **số tường phải GIẢM MẠNH, tổng chiều dài phải GẦN NHƯ KHÔNG ĐỔI.**
 *   giảm cả hai ⇒ đang ĂN MẤT tường · không giảm ⇒ chưa nối được gì · dài tăng vọt ⇒ nối bừa qua cửa.
 *
 * THUẦN (không React/DOM/store ở tầng nhận diện). Test:
 *   `node_modules/.bin/sucrase-node lib/cad/tuong-hinh-hoc.test.ts`
 */

import type { Doc, Entity, Pt } from './model';
// B25 REUSE — KHÔNG đẻ khuôn sinh tường thứ hai. `wallSegmentOutline` là khuôn canonical đang
// dùng cho lệnh WALL (hatch poché + đường bao, đã neo `hostId` theo `poche.ts`). Tường máy đọc ra
// phải là ĐÚNG loại entity ấy, nếu không thì 3D/BOQ/kiểm chuẩn đều không thấy nó.
import { wallSegmentOutline } from './commands';

/* ═══════════════════════ 0 · CỜ ═══════════════════════ */

/**
 * Bật đường nhận diện tường bằng hình học. **Mặc định TẮT ở mọi môi trường** ⇒ mở DXF hôm nay ra
 * y hệt hôm qua.
 *
 * Cùng KHUÔN `lib/cad/dwg-flag.ts` (một hàm, một biến `NEXT_PUBLIC_*`, mặc định tắt). Cố ý KHÔNG
 * tách thành `tuong-hinh-hoc-flag.ts` riêng: `dwg-flag.ts` phải đứng riêng vì đọc cờ mà lỡ import
 * `dwg.ts` là kéo theo cả gói WASM **GPL-3.0**; ở đây không có ràng buộc đó, và nơi gọi cờ cũng
 * chính là nơi gọi hàm nhận diện — đẻ thêm một tệp chỉ để chứa một dòng là đi ngược luật 6.
 *
 * Phải là `NEXT_PUBLIC_*`: biến không có tiền tố đó KHÔNG tồn tại trong bundle trình duyệt/worker,
 * nghĩa là cờ sẽ luôn tắt ở đúng nơi cần nó mà không ai nhận ra (bài học `idfc-identity-flag.ts`).
 */
export function tuongHinhHocEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IF_TUONG_HINH_HOC === '1';
}

/* ═══════════════════════ 1 · KIỂU + THAM SỐ ═══════════════════════ */

/** Một đoạn thẳng thô đọc ra từ bản vẽ (line, hoặc MỘT cạnh của polyline). */
export interface DoanThang {
  a: Pt;
  b: Pt;
  /** id layer — chỉ dùng làm khoá gom nhóm, KHÔNG dùng làm điều kiện nhận dạng. */
  layer: string;
}

/** Một bức tường đọc được: TRỤC GIỮA + BỀ DÀY — đúng ý định gốc của người vẽ. */
export interface TrucTuong {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** bề dày (mm) — con số người vẽ đã gõ vào `OFFSET`. */
  d: number;
  layer: string;
}

/**
 * Mọi ngưỡng đều là THAM SỐ, không hardcode vào thuật toán — hồ sơ studio khác, đơn vị khác, tỉ lệ
 * khác thì chỉnh ở đây chứ không sửa mã (cùng luật `dxf-plan.ts` đặt cho danh sách layer).
 */
export interface TuyChonTuong {
  /** bỏ nét vụn ngắn hơn ngần này (mm). Nét < 30cm không phải mặt tường. */
  minDaiNetMm: number;
  /** dải bề dày tường coi là hợp lý (mm). Ngoài dải ⇒ không phải cặp OFFSET của một bức tường. */
  beDayMinMm: number;
  beDayMaxMm: number;
  /** hai nét lệch phương quá ngần này (radian) thì không coi là song song. ~1°. */
  lechPhuongRad: number;
  /** hai nét phải chồng lấn dọc trục ít nhất ngần này (mm) mới là hai mặt của MỘT bức tường. */
  chongLanMinMm: number;
  /** ② ĐẢO TRIM — khe hở tối đa còn nối hai mảnh cùng đường (mm). Rộng hơn là nối bừa qua ô cửa. */
  kheHoTrimMm: number;
  /** ③ ĐẢO ARRAY — dải bước lặp coi là "đều" (mm) và số bước tối thiểu để kết luận là ARRAY. */
  buocArrayMinMm: number;
  buocArrayMaxMm: number;
  soBuocDeuToiThieu: number;
  /** ③ dung sai để coi các bước là bằng nhau (mm). */
  dungSaiBuocMm: number;
}

/** Ngưỡng mặc định — số đo trên bản vẽ nghề thật, không phải số tròn cho đẹp. */
export const TUONG_MAC_DINH: TuyChonTuong = {
  minDaiNetMm: 300,
  beDayMinMm: 90,
  beDayMaxMm: 400,
  lechPhuongRad: 0.02,
  chongLanMinMm: 500,
  kheHoTrimMm: 100,
  buocArrayMinMm: 150,
  buocArrayMaxMm: 420,
  soBuocDeuToiThieu: 3,
  dungSaiBuocMm: 60,
};

/** Số đo từng bước — để nghiệm thu tự chấm được, không cần mắt ai (xem docstring đầu tệp). */
export interface DoDemTuong {
  netThang: number;
  capUngVien: number;
  sauGhepDoi: number;
  sauDaoTrim: number;
  sauDaoArray: number;
  loaiBoiArray: number;
  sauGopChum: number;
  /** tổng chiều dài trục tường cuối cùng (mm). */
  tongDaiMm: number;
  /** bảng bề dày: `mm` → số bức. */
  beDay: Record<number, number>;
}

export interface KetQuaTuong {
  tuong: TrucTuong[];
  doDem: DoDemTuong;
}

/* ═══════════════════════ 2 · ĐỌC NÉT THÔ ═══════════════════════ */

const daiDoan = (s: DoanThang) => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);

/** Góc của một đoạn, chuẩn hoá về [0, π) — hai chiều ngược nhau là CÙNG một phương. */
const gocDoan = (s: DoanThang) => {
  let g = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
  if (g < 0) g += Math.PI;
  return g;
};

/**
 * Gom mọi đoạn thẳng của bản vẽ: `line`, và **mỗi cạnh** của `polyline`.
 *
 * ⚠️ POLYLINE PHẢI ĐƯỢC TÍNH. Phép thử gốc (`scripts/proof/tuong-tu-hinh-hoc.ts`) đọc nhầm field
 * `e.pts` — model của IF đặt tên là `points` (`model.ts` `PolylineEntity`) — nên nó âm thầm bỏ
 * **1.858 cạnh polyline** trên chính tệp đo. Không nổ, không cảnh báo, chỉ ra ít tường hơn. Đây là
 * lý do bản trong sản phẩm không chép nguyên phép thử mà đọc đúng model.
 */
export function docDoanThang(doc: Doc, minDaiMm = TUONG_MAC_DINH.minDaiNetMm): DoanThang[] {
  const ra: DoanThang[] = [];
  for (const e of doc.entities) {
    if (e.type === 'line') {
      ra.push({ a: e.a, b: e.b, layer: e.layer });
    } else if (e.type === 'polyline' && Array.isArray(e.points)) {
      for (let i = 0; i + 1 < e.points.length; i++) ra.push({ a: e.points[i], b: e.points[i + 1], layer: e.layer });
      if (e.closed && e.points.length > 2) ra.push({ a: e.points[e.points.length - 1], b: e.points[0], layer: e.layer });
    }
  }
  return ra.filter((s) => daiDoan(s) > minDaiMm);
}

/* ═══════════════════════ 3 · ① ĐẢO OFFSET — ghép đôi ĐỘC QUYỀN ═══════════════════════ */

/**
 * Hai nét song song cách nhau đúng bề dày ⇒ một trục giữa. Nhưng **một nét chỉ được là mặt của MỘT
 * bức tường**.
 *
 * ⛔ BẢN TRƯỚC ĐÃ TRƯỢT: ghép MỌI cặp thoả điều kiện. Thợ vẽ tường bằng 3–4 nét (hai mặt kết cấu +
 * nét trát/ốp mỗi bên) ⇒ một bức tường đẻ ra 6 trục chồng nhau, tổng chiều dài bị thổi phồng, và
 * Hoà nhìn ảnh phóng to bắt được ngay: *"bị sai"* — cái tưởng là một tường liền là nhiều vật xếp đè.
 *
 * SỬA: xếp cặp ứng viên theo **độ khớp chiều dài** (`OFFSET` sinh ra bản sao DÀI BẰNG NHAU — đó là
 * dấu tay đáng tin nhất), rồi tới bề dày mỏng hơn (cặp nét sát nhau nhất); duyệt lần lượt, chỉ nhận
 * khi **cả hai nét còn tự do**.
 */
export function ghepDoiDocQuyen(
  nets: DoanThang[],
  o: TuyChonTuong = TUONG_MAC_DINH,
): { tuong: TrucTuong[]; capUngVien: number } {
  interface UngVien { i: number; j: number; t: TrucTuong; khop: number }
  const uv: UngVien[] = [];
  // Chỉ số góc + gom theo layer để khỏi quét O(n²) trên toàn bộ nét khác layer.
  const goc = nets.map(gocDoan);
  for (let i = 0; i < nets.length; i++) {
    const p = nets[i];
    const ux = Math.cos(goc[i]), uy = Math.sin(goc[i]);
    for (let j = i + 1; j < nets.length; j++) {
      const q = nets[j];
      if (p.layer !== q.layer) continue;
      let dg = Math.abs(goc[i] - goc[j]);
      if (dg > Math.PI / 2) dg = Math.PI - dg;
      if (dg > o.lechPhuongRad) continue;
      const d = Math.abs((q.a.x - p.a.x) * -uy + (q.a.y - p.a.y) * ux);
      if (d < o.beDayMinMm || d > o.beDayMaxMm) continue;
      const t = (pt: Pt) => (pt.x - p.a.x) * ux + (pt.y - p.a.y) * uy;
      const [p0, p1] = [t(p.a), t(p.b)].sort((x, y) => x - y);
      const [q0, q1] = [t(q.a), t(q.b)].sort((x, y) => x - y);
      const lo = Math.max(p0, q0), hi = Math.min(p1, q1);
      if (hi - lo < o.chongLanMinMm) continue;
      const mx = (p.a.x + q.a.x) / 2, my = (p.a.y + q.a.y) / 2;
      uv.push({
        i, j,
        khop: (hi - lo) / Math.max(p1 - p0, q1 - q0),
        t: { ax: mx + ux * lo, ay: my + uy * lo, bx: mx + ux * hi, by: my + uy * hi, d: Math.round(d), layer: p.layer },
      });
    }
  }
  uv.sort((a, b) => b.khop - a.khop || a.t.d - b.t.d);
  const daDung = new Set<number>();
  const tuong: TrucTuong[] = [];
  for (const c of uv) {
    if (daDung.has(c.i) || daDung.has(c.j)) continue;
    daDung.add(c.i); daDung.add(c.j);
    tuong.push(c.t);
  }
  return { tuong, capUngVien: uv.length };
}

/* ═══════════════════════ 4 · ② ĐẢO TRIM ═══════════════════════ */

/** Hướng chuẩn hoá của một trục + độ lệch vuông góc so với gốc toạ độ. */
function trucCua(t: TrucTuong) {
  const L = Math.hypot(t.bx - t.ax, t.by - t.ay);
  let ux = (t.bx - t.ax) / L, uy = (t.by - t.ay) / L;
  if (ux < 0 || (Math.abs(ux) < 1e-9 && uy < 0)) { ux = -ux; uy = -uy; }
  const s0 = t.ax * ux + t.ay * uy, s1 = t.bx * ux + t.by * uy;
  return { ux, uy, c: t.ax * -uy + t.ay * ux, s0: Math.min(s0, s1), s1: Math.max(s0, s1), L };
}

/**
 * Người vẽ chạy `TRIM` ở mỗi chỗ giao ⇒ MỘT bức tường dài bị chẻ thành nhiều mảnh. Đảo lại: gom
 * các trục CÙNG MỘT ĐƯỜNG THẲNG (cùng layer · cùng bề dày · cùng phương · cùng độ lệch vuông góc)
 * rồi hợp các khoảng chồng/kề trên đường đó.
 */
export function daoTrim(ds: TrucTuong[], kheHo = TUONG_MAC_DINH.kheHoTrimMm): TrucTuong[] {
  interface Nhom { ux: number; uy: number; c: number; d: number; layer: string; kh: [number, number][] }
  const nhoms: Nhom[] = [];
  for (const t of ds) {
    const g = trucCua(t);
    if (!Number.isFinite(g.L) || g.L < 1) continue;
    const n = nhoms.find((x) =>
      x.layer === t.layer &&
      Math.abs(x.d - t.d) <= 20 &&
      Math.abs(x.ux * g.ux + x.uy * g.uy) > 0.9998 &&   // lệch phương < ~1°
      Math.abs(x.c - g.c) < 60);                        // cùng một đường
    if (n) n.kh.push([g.s0, g.s1]);
    else nhoms.push({ ux: g.ux, uy: g.uy, c: g.c, d: t.d, layer: t.layer, kh: [[g.s0, g.s1]] });
  }
  const ra: TrucTuong[] = [];
  for (const n of nhoms) {
    n.kh.sort((a, b) => a[0] - b[0]);
    let [lo, hi] = n.kh[0];
    const px = -n.uy * n.c, py = n.ux * n.c;
    const xuat = () => ra.push({
      ax: px + n.ux * lo, ay: py + n.uy * lo,
      bx: px + n.ux * hi, by: py + n.uy * hi,
      d: n.d, layer: n.layer,
    });
    for (let i = 1; i < n.kh.length; i++) {
      const [a, b] = n.kh[i];
      if (a - hi <= kheHo) hi = Math.max(hi, b);
      else { xuat(); [lo, hi] = [a, b]; }
    }
    xuat();
  }
  return ra;
}

/* ═══════════════════════ 5 · ③ ĐẢO ARRAY ═══════════════════════ */

/**
 * Bậc thang KHÔNG phải tường. Chữ ký HÌNH HỌC, **không đọc tên layer**: ≥4 trục song song, cùng
 * phương, xếp cách đều nhau bước 200–400mm — dấu tay của `ARRAY`/`OFFSET` lặp.
 *
 * PHÉP THỬ ĐỘC LẬP (không cố ý dựng ra, ghi trong sổ NC): máy loại **105/112** vật nằm trên layer
 * tên `E-Stair` mà **chưa từng đọc chữ "Stair"**. Hai nguồn độc lập — hình học và tên người vẽ đặt
 * — cùng chỉ một chỗ. Kiểu bằng chứng này mạnh hơn "chạy ra số đẹp" vì không thể dàn xếp được.
 */
export function boArray(
  ds: TrucTuong[],
  o: TuyChonTuong = TUONG_MAC_DINH,
): { giuLai: TrucTuong[]; bo: TrucTuong[] } {
  const nhom: TrucTuong[][] = [];
  for (const t of ds) {
    const g = trucCua(t);
    if (!Number.isFinite(g.L) || g.L < 1) continue;
    const cung = nhom.find((nh) => {
      const a = trucCua(nh[0]);
      if (Math.abs(a.ux * g.ux + a.uy * g.uy) < 0.999) return false;
      const s = (t.ax - nh[0].ax) * a.ux + (t.ay - nh[0].ay) * a.uy;   // vị trí dọc trục
      const c = (t.ax - nh[0].ax) * -a.uy + (t.ay - nh[0].ay) * a.ux;  // lệch ngang
      return Math.abs(s) < g.L + a.L && Math.abs(c) < 3000;
    });
    if (cung) cung.push(t); else nhom.push([t]);
  }
  const bo = new Set<TrucTuong>();
  for (const g of nhom) {
    if (g.length < o.soBuocDeuToiThieu + 1) continue;
    const a = trucCua(g[0]);
    const c = g.map((p) => (p.ax - g[0].ax) * -a.uy + (p.ay - g[0].ay) * a.ux).sort((x, y) => x - y);
    const buoc: number[] = [];
    for (let i = 1; i < c.length; i++) buoc.push(c[i] - c[i - 1]);
    const deu = buoc.filter((x) => x > o.buocArrayMinMm && x < o.buocArrayMaxMm);
    if (deu.length < o.soBuocDeuToiThieu) continue;
    const tb = deu.reduce((s, x) => s + x, 0) / deu.length;
    if (deu.every((x) => Math.abs(x - tb) < o.dungSaiBuocMm)) g.forEach((p) => bo.add(p));
  }
  return { giuLai: ds.filter((t) => !bo.has(t)), bo: [...bo] };
}

/* ═══════════════════════ 6 · ④ GỘP CHÙM → BAO NGOÀI ═══════════════════════ */

/**
 * Vẫn còn 3–4 vệt song song trên CÙNG một bức tường: thợ vẽ nhiều nét (hai mặt kết cấu + nét
 * trát/ốp), ghép đôi độc quyền cho ra mấy cặp rời, mỗi cặp một trục chồng lên nhau.
 *
 * ⛔ ĐƯỜNG SAI ĐÃ LOẠI — *"giữ trục dày nhất trong vùng"*: đo được **mất 74% chiều dài** (990 → 260 m),
 * vì một trục 400mm dài nuốt trọn các tường 200mm nằm cùng đường. Đúng cái nghiệm thu tự chấm bắt
 * được: *giảm cả hai là đang ăn mất tường*. **Không nhận, không đưa vào mã.**
 *
 * LUẬT ĐÚNG: không chọn-một-bỏ-phần-còn-lại mà **GỘP** — chỉ gom những trục THỰC SỰ chồng nhau, và
 * bức tường mới lấy **BAO NGOÀI** của chùm (bề dày = khoảng cách hai nét ngoài cùng; nét giữa là
 * lớp hoàn thiện, không phải mặt tường).
 */
export function gopChum(ds: TrucTuong[]): TrucTuong[] {
  const g = ds.map(trucCua);
  const chum = new Array<number>(ds.length).fill(-1);
  const cungTuong = (i: number, j: number) => {
    const a = g[i], b = g[j];
    if (ds[i].layer !== ds[j].layer) return false;
    if (Math.abs(a.ux * b.ux + a.uy * b.uy) < 0.999) return false;
    // nét kia phải nằm TRONG thân bức tường đang xét, không phải tường bên cạnh
    if (Math.abs(a.c - b.c) > (ds[i].d + ds[j].d) / 2) return false;
    return Math.min(a.s1, b.s1) - Math.max(a.s0, b.s0) > 0.5 * Math.min(a.s1 - a.s0, b.s1 - b.s0);
  };
  let so = 0;
  for (let i = 0; i < ds.length; i++) {
    if (chum[i] >= 0) continue;
    chum[i] = so;
    for (let j = i + 1; j < ds.length; j++) if (chum[j] < 0 && cungTuong(i, j)) chum[j] = so;
    so++;
  }
  const ra: TrucTuong[] = [];
  for (let k = 0; k < so; k++) {
    const idx: number[] = [];
    for (let i = 0; i < ds.length; i++) if (chum[i] === k) idx.push(i);
    if (!idx.length) continue;
    if (idx.length === 1) { ra.push(ds[idx[0]]); continue; }
    const cai = g[idx[0]];
    const lo = Math.min(...idx.map((i) => g[i].s0)), hi = Math.max(...idx.map((i) => g[i].s1));
    const mepTren = Math.max(...idx.map((i) => g[i].c + ds[i].d / 2));
    const mepDuoi = Math.min(...idx.map((i) => g[i].c - ds[i].d / 2));
    const cGiua = (mepTren + mepDuoi) / 2;
    const px = -cai.uy * cGiua, py = cai.ux * cGiua;
    ra.push({
      ax: px + cai.ux * lo, ay: py + cai.uy * lo,
      bx: px + cai.ux * hi, by: py + cai.uy * hi,
      d: Math.round(mepTren - mepDuoi), layer: ds[idx[0]].layer,
    });
  }
  return ra;
}

/* ═══════════════════════ 7 · CHẠY CẢ BỐN BƯỚC ═══════════════════════ */

const tongDai = (ds: TrucTuong[]) => ds.reduce((s, t) => s + Math.hypot(t.bx - t.ax, t.by - t.ay), 0);

/** Chạy trọn ① → ② → ③ → ④ và trả kèm SỐ ĐO TỪNG BƯỚC để nghiệm thu tự chấm. */
export function nhanDienTuong(doc: Doc, o: TuyChonTuong = TUONG_MAC_DINH): KetQuaTuong {
  const nets = docDoanThang(doc, o.minDaiNetMm);
  const { tuong: ghep, capUngVien } = ghepDoiDocQuyen(nets, o);
  const noi = daoTrim(ghep, o.kheHoTrimMm);
  const { giuLai, bo } = boArray(noi, o);
  const tuong = gopChum(giuLai);
  const beDay: Record<number, number> = {};
  for (const t of tuong) beDay[t.d] = (beDay[t.d] ?? 0) + 1;
  return {
    tuong,
    doDem: {
      netThang: nets.length,
      capUngVien,
      sauGhepDoi: ghep.length,
      sauDaoTrim: noi.length,
      sauDaoArray: giuLai.length,
      loaiBoiArray: bo.length,
      sauGopChum: tuong.length,
      tongDaiMm: Math.round(tongDai(tuong)),
      beDay,
    },
  };
}

/* ═══════════════════════ 8 · ĐƯA VÀO BẢN VẼ ═══════════════════════ */

/**
 * Trục + bề dày → entity tường THẬT của IF (hatch poché + đường bao, `elementType: 'wall'`), bằng
 * ĐÚNG khuôn canonical `wallSegmentOutline` — không đẻ khuôn thứ hai (luật 6/B25). Nhờ vậy 3D
 * (`docToObjScene`), BOQ và bộ kiểm chuẩn thấy được ngay mà không phải dạy thêm.
 *
 * Tường sinh ra GIỮ NGUYÊN layer của nét gốc — trung tính, không nhét tên layer của studio nào vào.
 */
export function tuongThanhEntities(tuong: TrucTuong[]): Entity[] {
  const ra: Entity[] = [];
  for (const t of tuong) {
    if (t.d <= 0) continue;
    ra.push(...wallSegmentOutline({ x: t.ax, y: t.ay }, { x: t.bx, y: t.by }, t.d, t.layer, 'center'));
  }
  return ra;
}

/**
 * Điểm vào duy nhất cho luồng nhập DXF: đọc tường ra rồi **THÊM** vào bản vẽ.
 *
 * ⚠️ **THÊM, KHÔNG THAY THẾ.** Nét gốc của người vẽ được giữ nguyên vẹn (K3 — không phá dữ liệu
 * người dùng để đổi lấy một suy đoán của máy). Người dùng vẫn thấy đúng bản vẽ mình gửi vào, chỉ
 * có thêm lớp tường mà IF đã hiểu được.
 *
 * Hàm THUẦN: trả `Doc` mới, không sửa `doc` truyền vào.
 */
export function apDungTuongHinhHoc(doc: Doc, o: TuyChonTuong = TUONG_MAC_DINH): { doc: Doc; ketQua: KetQuaTuong } {
  const ketQua = nhanDienTuong(doc, o);
  const them = tuongThanhEntities(ketQua.tuong);
  if (!them.length) return { doc, ketQua };
  return { doc: { ...doc, entities: [...doc.entities, ...them] }, ketQua };
}
