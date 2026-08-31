/**
 * lib/cad/render.ts — VẼ entity ra Canvas 2D (dùng chung cho live-canvas + export PNG).
 * Không phụ thuộc React. Toạ độ world mm, Y-up → screen px qua Viewport (lật Y).
 */

import type { Doc, Entity, Layer, Pt, Viewport, DimEntity, LineType, ZoneEntity, RoomEntity } from './model';
import { docBox, fitBox, worldToScreen, ZONE_GROUP_META, ZONE_GROUPS, zoneBoundaryPoints, zoneCentroid, roomCentroid } from './model';
import { BLOCK_MAP, type Prim } from './furniture';
import { hatchLines, hatchDots } from './hatch';
// B25 REUSE — `mixHex` là bộ pha màu canonical của IF (`plan-depth.ts` §1), đã có test riêng.
// Không đẻ bộ pha thứ hai ở đây (luật 6). `plan-depth.ts` chỉ import KIỂU từ `model.ts` nên
// chiều phụ thuộc vẫn một chiều, không sinh vòng.
import { mixHex } from './plan-depth';
import { roomLabel } from './room';

/** Dim style tối thiểu dùng khi vẽ (mặc định nếu không truyền — xem store.ts DimStyle). */
export interface DimStyle {
  textHeight: number;
  arrowSize: number;
  dimScale: number;
}
const DEFAULT_DIM_STYLE: DimStyle = { textHeight: 120, arrowSize: 80, dimScale: 1 };

export interface DrawStyle {
  /** màu nét mặc định khi entity/layer không cho màu (dùng cho export đen-trắng) */
  stroke: string;
  /** ép mọi nét về 1 màu (export) — nếu set, bỏ qua màu layer */
  forceColor?: string;
  lineWidth: number;
  /** vẽ chữ text entity */
  text: boolean;
  /** Nấc 3 — dim style (cỡ chữ/mũi tên/tỉ lệ); mặc định DEFAULT_DIM_STYLE nếu không truyền */
  dimStyle?: DimStyle;
  /**
   * BỔ SUNG (hệ nét ISO 128) — true: dùng lineweight/lineType THẬT của layer/entity (mm → px
   * qua viewport.scale, tối thiểu 1px) thay vì `lineWidth` cố định. false/thiếu ⇒ hành vi CŨ
   * (lineWidth cố định, dùng cho preview/selection-highlight/PNG export — nơi cần 1 độ dày
   * đồng nhất bất kể layer, không phải bản vẽ "thật").
   */
  realLineweight?: boolean;
  /**
   * FIX (demo render overlap) — true: entity 'hatch' (tường/poché SOLID) chỉ vẽ VIỀN, KHÔNG
   * tô đặc. Dùng cho các lớp overlay accent (highlight selection đang chọn, preview ghost khi
   * offset/trim/mirror, leg đầu dimension góc) — những lớp này vẽ ĐÈ SAU CÙNG lên toàn bộ bản
   * vẽ (kể cả text/nhãn phòng bên dưới); nếu để tô đặc như bản vẽ THẬT, 1 mảng tường (hatch
   * SOLID dày theo bề dày tường) sẽ thành 1 thanh màu accent ĐẶC che kín chữ bên dưới nó —
   * đúng bug user báo cáo (screenshot: thanh tím dày đè chữ nhãn phòng). KHÔNG áp dụng cho
   * export PNG đen-trắng (renderDocToDataURL) — export vẫn cần tô đặc poché tường như bản in.
   */
  outlineOnly?: boolean;
  /**
   * MÀU NỀN mà bề mặt này đang vẽ lên. Chỉ dùng để **pha nhạt** lớp máy suy ra (`Entity.inferred`)
   * — xem `POCHE_TAM`. KHÔNG vẽ nền, không đổi gì khác.
   *
   * ⚠️ Thiếu field này KHÔNG được đoán: canvas sống của IF là NỀN TỐI (`--bg` ≈ `#141210`), còn
   * xuất PNG/sheet là NỀN SÁNG. Pha nhầm hướng thì lớp "nhạt" lại SÁNG LÊN, tức đè mạnh hơn cả
   * lúc chưa sửa. Không có nền ⇒ chỉ vẽ viền, không tô (K3: thà thiếu còn hơn đoán).
   */
  background?: string;
  /**
   * NGÔN NGỮ "GIẤY MỰC" (`docs/control/IF-GIAY-MUC.md`). Thiếu field này ⇒ **đường vẽ cũ chạy y
   * hệt, không lệch một byte** — hai bộ luật sống song song có chủ đích, xem `GiayMuc`.
   */
  giayMuc?: GiayMuc;
}

/* ════════════════════ GIẤY MỰC — ngôn ngữ canvas 2D (Hoà chốt 31/08) ════════════════════ */

/**
 * `docs/control/IF-GIAY-MUC.md` — mắt chủ chấm "ỔN" 17:20 · 31/08 trên mock `giay-muc-v1`.
 * Vì sao có nó: mắt chủ phán **hai lượt "chưa ổn"** trên các bản vá lẻ; vá lượt ba là vá vào chỗ
 * không có ngôn ngữ để vá. ⇒ chốt NGÔN NGỮ trước, thi công sau.
 *
 * Tiền lệ chính là **Rayon** (LOOK OUTSIDE 9 công cụ, 31/08): style tách khỏi layer · wireframe là
 * *chế độ khảo sát* chứ không phải mặc định · stroke-scale gắn tỉ lệ bản vẽ.
 *
 * ⚠️ **BẬT/TẮT, KHÔNG THAY THẾ.** `style.giayMuc` thiếu ⇒ mọi nhánh dưới đây không chạy, đường vẽ
 * chạy đúng như trước 31/08 (khoá ở `render-giay-muc.test.ts` ca ⑦ + cả 20 ca `render-z-order`).
 * Đường xuất PNG/PDF và các lớp overlay accent chưa đổi — chúng ép màu riêng, xem `forceColor`.
 */
export interface GiayMuc {
  /** luật 1 — nền giấy ấm, MỘT MÀU PHẲNG (hướng `#FAF9F6`). Cũng là đích PHA khi nét chạm sàn. */
  giay: string;
  /** màu mực đơn sắc: mọi màu ACI của tệp nhập biến mất về đây (luật 4, chế độ TRÌNH BÀY). */
  muc: string;
  /** luật 5 + 7 — ĐÚNG MỘT màu không phải mực trên toàn canvas, dẫn xuất từ BỘ người dùng chọn. */
  accent: string;
  /**
   * luật 2 — stroke-scale gắn **tỉ lệ bản vẽ** (N của "1:N"), kiểu Rayon: mm thật trên giấy × N ×
   * `viewport.scale`. Thiếu ⇒ đọc `doc.printScale` (`model.ts`, khái niệm ĐÃ CÓ — không đẻ trường
   * thứ hai cho cùng một thứ, luật 6), thiếu nốt ⇒ `TI_LE_MAC_DINH`.
   */
  strokeScale?: number;
  /**
   * luật 4 câu cuối — bảng map `layer → bậc mực` là **heuristic, phải SỬA ĐƯỢC per-layer**.
   * Khoá theo **id layer HOẶC tên layer** (người dùng nhìn thấy tên, không thấy id). Đợt A chưa có
   * UI, nhưng đường dây phải có sẵn — nếu không thì "sửa được" chỉ là lời chúc.
   */
  theoLayer?: Record<string, BacMuc>;
  /**
   * luật 4 — **KHẢO SÁT: van an toàn BẮT BUỘC.** Wireframe 1px **màu layer GỐC**, tắt mọi fill.
   * Đây là đường về với dữ liệu thật khi bản đồ mực map sai — không có nó thì người dùng mất khả
   * năng kiểm chứng chính bản vẽ mình gửi vào.
   */
  khaoSat?: boolean;
}

/** Ba bậc mực — ISO 128-24 nội bộ (`CHUAN-DAU-RA-NGHE` §1). mm THẬT trên giấy. */
export type BacMuc = 'cat' | 'thay' | 'manh';
export const BE_DAY_MUC: Record<BacMuc, number> = { cat: 0.5, thay: 0.25, manh: 0.13 };

/** Sàn hiển thị: mảnh hơn mức này thì màn hình không vẽ nổi nữa. Chạm sàn ⇒ NHẠT, không mảnh thêm. */
export const SAN_NET_PX = 1;

/** 1:50 — tỉ lệ mặt bằng nội thất hay gặp. Chỉ là NƯỚC CHÓT: `doc.printScale` có thì nó thắng. */
export const TI_LE_MAC_DINH = 50;

/**
 * Các mức pha của ngôn ngữ giấy-mực. **Số nằm trong dải spec, không phải số đẹp tự chọn** —
 * `render-giay-muc.test.ts` khoá chính cái dải ấy, nên đổi ra ngoài dải là ĐỎ.
 *
 * ⛔ MỌI mức đều là **PHA MÀU về giấy**, tuyệt đối không alpha: alpha chồng alpha thì chỗ nét chồng
 * nét cộng dồn ra vệt đậm giả — mà tường thì chồng nhau ở mọi góc nhà. Cùng lý do `plan-depth.ts:8-13`.
 */
export const GIAY_MUC_PHA = {
  /** luật 3 — poché tường cắt: xám đậm **75–85% mực**, không đen đặc. */
  pocheTuong: 0.8,
  /** luật 5 — fill của phần máy suy ra: accent còn lại **8–12%**. */
  accentTo: 0.1,
  /** mảng tô SOLID không phải tường, chưa có luật riêng — giữ NHẠT HƠN poché tường để thứ bậc không đảo. */
  toKhac: 0.45,
  /** trần pha khi nét chạm sàn — pha quá mức này thì lớp mảnh nhất biến mất khỏi bản vẽ. */
  nhatToiDa: 0.62,
} as const;

/**
 * SỔ NỢ GIẤY MỰC — nói thẳng trên mặt, không giấu trong comment lẻ (luật "không PASS giả").
 * Đợt A thi công luật **1 · 2 · 3 · 4 · 5**. Còn nợ:
 */
export const GIAY_MUC_CON_NO = [
  'luật 3 — hatch VẬT LIỆU chỉ hiện từ ngưỡng zoom: chưa có ngưỡng, pattern hatch vẫn vẽ ở mọi zoom.',
  'luật 5 — nét ĐỨT accent = "đề xuất chờ duyệt": chưa vẽ, vì CHƯA CÓ FLOW DUYỆT nào sinh ra trạng thái đó. Vẽ nét đứt lúc này là bịa một trạng thái sản phẩm không có thật.',
  'luật 6 — halftone khi VẼ ĐÈ lên bản nhập (mượn Revit): cần biết "đang thao tác đè", tức trạng thái của tầng tương tác chứ không phải của tầng vẽ. Chưa nối.',
  'luật 7 — accent TỰ TRÍCH từ ảnh nền người dùng + cổng tương phản AA: đợt A nhận accent qua tham số. Máy trích màu + cổng nằm ở lô `mau-bo.ts`/`contrast.ts`, chưa nối vào đây.',
] as const;

/** Tên layer kiểu "nét cắt" — tường/cột/kết cấu/mặt cắt. */
const TEN_LAYER_CAT = /(WALL|TUONG|TƯỜNG|VACH|VÁCH|COLUMN|COT|CỘT|STRU|KETCAU|SECT|CUT|^S-|-S-)/i;
/** Tên layer kiểu "nét mảnh" — chú thích, kích thước, lưới trục, gạch. */
const TEN_LAYER_MANH = /(DIM|TEXT|ANNO|NOTE|LEADER|GRID|AXIS|TRUC|TRỤC|HATCH|PATT|CENTER|TIM)/i;

/**
 * Entity này thuộc bậc mực nào. **Bốn kênh, dừng ở kênh đầu tiên trả lời được:**
 *   ① người dùng sửa tay per-layer (`theoLayer`, theo id HOẶC tên) — luôn thắng;
 *   ② **bề dày KHAI BÁO** trong tệp (entity → layer), bắt về bậc gần nhất — đây là dữ liệu THẬT,
 *      không phải suy đoán, nên nó đứng trên mọi phép đoán theo tên;
 *   ③ heuristic tên layer;
 *   ④ `thay` — bậc giữa, chỗ đứng an toàn nhất khi không biết gì.
 *
 * ⚠️ **KHÔNG CÓ KÊNH "ACI → bậc", cố ý.** Phiếu ghi *"map layer/ACI"*, nhưng tới tầng này mã ACI
 * đã KHÔNG CÒN: `dxf.ts` quy đổi index → hex ngay lúc nhập (`aciToHex`, bảng 13 mã), và bản thân
 * AutoCAD cũng không có bảng ACI→bề dày chuẩn — mỗi xưởng một bảng bút riêng trong tệp CTB của họ.
 * Suy ngược bề dày từ màu là **đoán chồng lên một phép quy đổi đã mất mát** (K3). Tệp có khai bề
 * dày thì kênh ② đọc đúng; tệp in-theo-màu thì kênh ③ đoán và kênh ① cho người sửa. Khi nào IF giữ
 * được bảng bút của xưởng thì đó là một kênh có nguồn, không phải một phép đoán.
 */
export function bacMucCua(e: Entity, lay: Layer | undefined, gm: GiayMuc): BacMuc {
  const sua = gm.theoLayer;
  if (sua) {
    const theoId = sua[e.layer];
    if (theoId) return theoId;
    const theoTen = lay ? sua[lay.name] : undefined;
    if (theoTen) return theoTen;
  }
  const mm = e.lineweight ?? lay?.lineweight;
  if (mm !== undefined) {
    let gan: BacMuc = 'thay';
    let lech = Infinity;
    for (const b of ['cat', 'thay', 'manh'] as BacMuc[]) {
      const d = Math.abs(BE_DAY_MUC[b] - mm);
      if (d < lech) { lech = d; gan = b; }
    }
    return gan;
  }
  const ten = lay?.name ?? '';
  if (TEN_LAYER_CAT.test(ten)) return 'cat';
  if (TEN_LAYER_MANH.test(ten)) return 'manh';
  return 'thay';
}

/**
 * Bề dày px + lượng pha của một bậc mực, tại một zoom và một tỉ lệ bản vẽ.
 *
 * Luật 2, nguyên văn: *"Zoom đổi ⇒ cả thang co giãn cùng nhau, giữ thứ bậc. Chạm sàn hiển thị thì
 * NHẠT ĐI bằng pha-màu-về-nền (⛔ CẤM alpha), **không mảnh thêm**."*
 *
 * Vì sao không mảnh thêm: dưới 1px màn hình không vẽ được nét mảnh hơn — nó vẽ một nét 1px NHẠT đi
 * theo cách riêng của trình duyệt, không kiểm soát được, và ba bậc mực sẽ **bẹp thành một**. Chủ
 * động dừng ở sàn rồi tự pha thì thứ bậc còn nguyên: cắt đậm, thấy nhạt hơn, mảnh nhạt nhất.
 */
export function netMuc(bac: BacMuc, v: Viewport, gm: GiayMuc, tiLe: number): { px: number; nhat: number } {
  const px = BE_DAY_MUC[bac] * tiLe * Math.abs(v.scale);
  if (px >= SAN_NET_PX) return { px, nhat: 0 };
  return { px: SAN_NET_PX, nhat: Math.min(GIAY_MUC_PHA.nhatToiDa, 1 - px / SAN_NET_PX) };
}

/** Tỉ lệ bản vẽ hiệu dụng: nơi gọi ép > `doc.printScale` (N của "1:N") > 1:50. */
export function tiLeBanVe(doc: Doc, gm: GiayMuc): number {
  return gm.strokeScale ?? doc.printScale ?? TI_LE_MAC_DINH;
}

/** Bút của một entity ở chế độ giấy-mực: màu nét · bề dày px · nét đứt. */
function butGiayMuc(
  li: LayerIndex, doc: Doc, e: Entity, v: Viewport, gm: GiayMuc, style: DrawStyle, suyRa: boolean,
): { mau: string; px: number; dash: number[] } {
  const lay = li.get(e.layer);
  /* KHẢO SÁT — trả đúng dữ liệu GỐC: màu riêng của entity trước, rồi màu layer. 1px, không thang
   * mực, không pha. Đây là chế độ để NGỜ VỰC bản đồ mực, nên nó không được đi qua bản đồ mực. */
  if (gm.khaoSat) {
    return { mau: e.color ?? lay?.color ?? style.stroke, px: 1, dash: effectiveLineDashPx(li, e, v, style) };
  }
  const { px, nhat } = netMuc(bacMucCua(e, lay, gm), v, gm, tiLeBanVe(doc, gm));
  /* Luật 5 — nét LIỀN accent = **đã xác nhận**. Nét ĐỨT (đề xuất chờ duyệt) chưa vẽ: xem
   * `GIAY_MUC_CON_NO`. Ép `[]` ở đây để linetype của layer nguồn không biến một thứ máy đã xác
   * nhận thành một thứ trông như đang chờ duyệt. */
  if (suyRa) return { mau: gm.accent, px, dash: [] };
  return { mau: mixHex(gm.muc, gm.giay, nhat), px, dash: effectiveLineDashPx(li, e, v, style) };
}

/** Màu tô mảng SOLID ở chế độ giấy-mực. `null` = KHÔNG tô (chế độ khảo sát tắt fill). */
function toGiayMuc(e: Entity, gm: GiayMuc, suyRa: boolean): string | null {
  if (gm.khaoSat) return null;
  if (suyRa) return mixHex(gm.accent, gm.giay, 1 - GIAY_MUC_PHA.accentTo);
  if (e.elementType === 'wall') return mixHex(gm.muc, gm.giay, 1 - GIAY_MUC_PHA.pocheTuong);
  return mixHex(gm.muc, gm.giay, 1 - GIAY_MUC_PHA.toKhac);
}

/**
 * NGÔN NGỮ THỊ GIÁC CHO THỨ MÁY SUY RA (`Entity.inferred`, `model.ts` A5·G-M1-09).
 *
 * 🔴 **BẢN TẠM — chờ mock poché, phiếu `P1-mock`.** Đây KHÔNG phải ngôn ngữ poché cuối cùng.
 * Nó chỉ giải đúng một bệnh đo được 31/08: tường máy đọc ra từ hình học (`tuong-hinh-hoc.ts`)
 * được vẽ bằng hatch SOLID đậm ngang hàng dữ liệu người vẽ, nên **đè mất nét gốc của khách** —
 * một suy đoán của máy che mất bằng chứng của người. Khi mock poché về, thay chỗ này.
 *
 * Hai cần gạt, đúng triết lý `plan-depth.ts:8-13`:
 *   ① **PHA MÀU về nền** — ⛔ CẤM `alpha`: alpha chồng alpha thì chỗ nét chồng nét cộng dồn ra
 *      vệt đậm giả, mà tường suy ra thì chồng lên nhau ở mọi góc nhà. Pha màu không bao giờ bị.
 *   ② **VIỀN MẢNH** — lớp suy đoán mảnh hơn lớp khai báo.
 */
const POCHE_TAM = {
  /** pha bao nhiêu phần về nền. 0.72 ⇒ còn 28% mực: đọc được là "có cái gì ở đây", không tranh nét. */
  pha: 0.72,
  /** nhân bề dày nét. Cùng nhịp `DEFAULT_DEPTH_FADE.weightPerStep` họ hàng. */
  manh: 0.6,
};

/** Màu của lớp tạm: pha về nền. Không biết nền, hoặc không phải lớp tạm ⇒ TRẢ NGUYÊN màu vào. */
function tamMau(mau: string, style: DrawStyle, tam: boolean): string {
  return tam && style.background ? mixHex(mau, style.background, POCHE_TAM.pha) : mau;
}

/** Bề dày nét của lớp tạm. Không phải lớp tạm ⇒ TRẢ NGUYÊN số vào. */
function tamNet(px: number, tam: boolean): number {
  return tam ? Math.max(0.5, px * POCHE_TAM.manh) : px;
}

/**
 * HIỆU NĂNG — BẢNG TRA LỚP theo id (thay `doc.layers.find(...)` quét tuyến tính).
 *
 * Trước: mỗi entity tra lớp 4 lần (màu · bề dày · nét đứt · lọc lớp ẩn), mỗi lần quét cả
 * `doc.layers` ⇒ chi phí O(entity × lớp) MỖI KHUNG HÌNH. Bản vẽ 200.000 entity × 40 lớp là
 * ~16 triệu phép so mỗi lượt tra, ×4 lượt — đo được ở bản cũ: 142,6 ms/khung (≈7 khung/giây).
 * Nay dựng Map một lần rồi tra O(1).
 *
 * CACHE KHÔNG MÙ — khoá cache là CHÍNH MẢNG `doc.layers` (WeakMap) kèm chốt chặn `n` = độ dài:
 *  · store.ts luôn thay mảng mới khi thêm/sửa/xoá lớp (`[...layers]` / `.map` / `.filter`)
 *    ⇒ mảng mới = khoá mới = Map dựng lại, không đọc bản cũ.
 *  · Đường NHẬP file (`dxf.ts:640`, `dwg-map.ts:667`) `push` THẲNG vào mảng cũ ⇒ khoá không
 *    đổi; chốt `n !== layers.length` bắt đúng ca này và dựng lại.
 *  · Sửa TẠI CHỖ một Layer (vd `lay.visible = false`) không cần dựng lại: Map giữ THAM CHIẾU
 *    tới chính object Layer đó, đọc ra vẫn là giá trị mới nhất.
 * WeakMap ⇒ Doc bị thu hồi thì bảng tra tự đi theo, không rò bộ nhớ.
 */
const LAYER_INDEX_CACHE = new WeakMap<Layer[], { n: number; map: Map<string, Layer> }>();
type LayerIndex = Map<string, Layer>;

function layerIndex(doc: Doc): LayerIndex {
  const layers = doc.layers;
  const hit = LAYER_INDEX_CACHE.get(layers);
  if (hit && hit.n === layers.length) return hit.map;
  const map: LayerIndex = new Map();
  for (const l of layers) map.set(l.id, l);
  LAYER_INDEX_CACHE.set(layers, { n: layers.length, map });
  return map;
}

function layerColor(li: LayerIndex, e: Entity, style: DrawStyle): string {
  if (style.forceColor) return style.forceColor;
  if (e.color) return e.color;
  const lay = li.get(e.layer);
  return lay?.color ?? style.stroke;
}

/** mm/px của nét — layer trước, override entity sau, mặc định 0.25mm (trung, chưa gán layer). */
function effectiveLineWidthPx(li: LayerIndex, e: Entity, v: Viewport, style: DrawStyle): number {
  if (!style.realLineweight) return style.lineWidth;
  const lay = li.get(e.layer);
  const mm = e.lineweight ?? lay?.lineweight ?? 0.25;
  return Math.max(1, mm * v.scale);
}

/** Dash pattern (px, đã nhân viewport.scale) theo lineType hiệu dụng của entity. [] = nét liền. */
const LINE_DASH_MM: Record<LineType, number[]> = {
  continuous: [],
  hidden: [3, 2],
  dashed: [6, 3],
  center: [12, 3, 2, 3],
  phantom: [12, 3, 2, 3, 2, 3],
};
function effectiveLineDashPx(li: LayerIndex, e: Entity, v: Viewport, style: DrawStyle): number[] {
  if (!style.realLineweight) return [];
  const lay = li.get(e.layer);
  const lt: LineType = e.lineType ?? lay?.lineType ?? 'continuous';
  return LINE_DASH_MM[lt].map((mm) => Math.max(0.5, mm * v.scale));
}

/** local mm của block → world mm (áp translate/rotate/scale của instance). */
function blockLocalToWorld(lp: Pt, at: Pt, rot: number, sx: number, sy: number): Pt {
  const x = lp.x * sx;
  const y = lp.y * sy;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos };
}

function drawPrim(ctx: CanvasRenderingContext2D, v: Viewport, prim: Prim, tf: (p: Pt) => Pt) {
  const S = (p: Pt) => worldToScreen(v, tf(p));
  ctx.beginPath();
  if (prim.k === 'line') {
    const a = S(prim.a);
    const b = S(prim.b);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  } else if (prim.k === 'poly') {
    prim.pts.forEach((p, i) => {
      const s = S(p);
      if (i === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    if (prim.closed) ctx.closePath();
  } else if (prim.k === 'circle') {
    // xấp xỉ bằng cung (giữ đúng khi scale không đồng đều thì méo — chấp nhận)
    const c = tf(prim.c);
    const sc = worldToScreen(v, c);
    const rp = Math.abs(prim.r * v.scale);
    ctx.arc(sc.x, sc.y, rp, 0, Math.PI * 2);
  } else if (prim.k === 'arc') {
    const c = tf(prim.c);
    const sc = worldToScreen(v, c);
    const rp = Math.abs(prim.r * v.scale);
    // Y lật → góc lật dấu
    ctx.arc(sc.x, sc.y, rp, -prim.a2, -prim.a1);
  }
  ctx.stroke();
}

/** Vẽ 1 entity. */
export function drawEntity(ctx: CanvasRenderingContext2D, v: Viewport, doc: Doc, e: Entity, style: DrawStyle) {
  const li = layerIndex(doc); // O(1) sau lần đầu — xem chú thích LAYER_INDEX_CACHE
  /* BẢN TẠM chờ mock poché (phiếu `P1-mock`) — xem `POCHE_TAM`. Entity KHÔNG mang `inferred` đi
   * qua đây y hệt trước: `tam` = false ⇒ hai dòng dưới trả đúng giá trị cũ, không lệch một byte.
   *
   * ⛔ `forceColor` TẮT lớp tạm. Nơi gọi ép màu là nơi đang vẽ một lớp ACCENT có chủ đích —
   * highlight vật đang chọn, ghost preview lúc offset/trim/mirror (`CadCanvas.tsx`). Pha nhạt
   * một lớp accent là làm hỏng đúng thứ nó sinh ra để làm: cho người dùng THẤY. Tường suy ra
   * được chọn thì phải sáng lên như mọi vật khác, không được mờ đi vì máy đoán ra nó. */
  const tam = e.inferred === true && !style.forceColor;
  /* GIẤY MỰC — `forceColor` TẮT nó vì cùng lý do đã tắt lớp tạm ngay trên: nơi ép màu là nơi đang
   * vẽ một lớp ACCENT có chủ đích (highlight/ghost preview), thang mực không được nuốt nó. */
  const gm = style.giayMuc && !style.forceColor ? style.giayMuc : undefined;
  const but = gm ? butGiayMuc(li, doc, e, v, gm, style, tam) : null;
  const mauNet = but ? but.mau : tamMau(layerColor(li, e, style), style, tam);
  ctx.strokeStyle = mauNet;
  ctx.lineWidth = but ? but.px : tamNet(effectiveLineWidthPx(li, e, v, style), tam);
  ctx.setLineDash(but ? but.dash : effectiveLineDashPx(li, e, v, style));
  const S = (p: Pt) => worldToScreen(v, p);

  switch (e.type) {
    case 'line': {
      const a = S(e.a);
      const b = S(e.b);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      break;
    }
    case 'polyline': {
      ctx.beginPath();
      e.points.forEach((p, i) => {
        const s = S(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      if (e.closed) ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'rect': {
      const p0 = S({ x: e.x, y: e.y });
      const p1 = S({ x: e.x + e.w, y: e.y + e.h });
      ctx.strokeRect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.abs(p1.x - p0.x), Math.abs(p1.y - p0.y));
      break;
    }
    case 'circle': {
      const c = S(e.c);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.abs(e.r * v.scale), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arc': {
      const c = S(e.c);
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.abs(e.r * v.scale), -e.a2, -e.a1);
      ctx.stroke();
      break;
    }
    case 'text': {
      if (!style.text) break;
      const at = S(e.at);
      ctx.fillStyle = mauNet;
      const px = Math.max(9, e.h * v.scale);
      ctx.font = `${px}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(e.text, at.x, at.y);
      break;
    }
    case 'dim': {
      drawDimension(ctx, v, e, mauNet, style);
      break;
    }
    case 'block': {
      const def = BLOCK_MAP[e.block];
      if (!def) break;
      const tf = (p: Pt) => blockLocalToWorld(p, e.at, e.rot, e.sx, e.sy);
      for (const prim of def.prims) drawPrim(ctx, v, prim, tf);
      break;
    }
    case 'hatch': {
      if (e.points.length < 3) break;
      const pattern = e.pattern ?? (e.solid === false ? 'ANSI31' : 'SOLID');
      const color = mauNet;
      const veBien = () => {
        ctx.beginPath();
        e.points.forEach((p, i) => {
          const s = S(p);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.closePath();
      };
      /* CHỈ VIỀN — hai nguồn, cùng một kết quả:
       *  · `outlineOnly`: lớp overlay accent, xem khai báo ở `DrawStyle` (tránh tô đặc đè chữ);
       *  · KHẢO SÁT: luật 4 ra lệnh **tắt fill**, wireframe là wireframe. */
      if (style.outlineOnly || gm?.khaoSat) {
        veBien();
        ctx.strokeStyle = color;
        ctx.stroke();
        break;
      }
      if (gm && pattern === 'SOLID') {
        /* Poché GIẤY MỰC: mảng tô rồi VIỀN đè lên chính nó — mảng tô không bao giờ được ăn mất
         * đường bao của chính nó. Màu tô do `toGiayMuc` quyết (tường cắt 80% mực · máy suy ra
         * accent 10% · còn lại 45%), luôn `globalAlpha = 1`: độ nhạt nằm trong MÀU, không trong alpha. */
        const mauTo = toGiayMuc(e, gm, tam);
        if (mauTo) {
          veBien();
          ctx.fillStyle = mauTo;
          ctx.globalAlpha = 1;
          ctx.fill();
        }
        veBien();
        ctx.strokeStyle = color;
        ctx.stroke();
        break;
      }
      if (tam && !gm) {
        /* 🔴 BẢN TẠM — chờ mock poché, phiếu `P1-mock`. Xem `POCHE_TAM` để biết vì sao pha màu
         * chứ không alpha. Mảng tô của MÁY SUY RA không được đậm ngang dữ liệu người vẽ.
         * Không biết nền (`style.background` thiếu) ⇒ **chỉ viền, không tô** — pha nhầm hướng
         * nền thì lớp "nhạt" lại sáng lên và đè mạnh hơn cả lúc chưa sửa (K3). */
        if (style.background) {
          veBien();
          ctx.fillStyle = color;
          ctx.globalAlpha = 1; // ⛔ KHÔNG dùng `e.opacity`/0.9 ở đây — độ nhạt đã nằm trong MÀU.
          ctx.fill();
        }
        veBien();
        ctx.strokeStyle = color;
        ctx.stroke();
        break;
      }
      if (pattern === 'SOLID') {
        veBien();
        ctx.fillStyle = color;
        // Zone tool (N1) — opacity per-entity; thiếu ⇒ 0.9 GIỮ hành vi cũ (poché tường).
        ctx.globalAlpha = e.opacity ?? 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (pattern === 'DOTS') {
        const dots = hatchDots(e.points, e.patternScale ?? 1);
        ctx.fillStyle = color;
        if (e.opacity !== undefined) ctx.globalAlpha = e.opacity;
        for (const p of dots) {
          const s = S(p);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        const lines = hatchLines(e.points, pattern, e.patternScale ?? 1, e.patternAngle ?? 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(0.6, ctx.lineWidth * 0.6); // mảnh hơn biên — dựa trên lineWidth hiệu dụng đã set ở đầu drawEntity
        ctx.beginPath();
        for (const [p, q] of lines) {
          const sp = S(p);
          const sq = S(q);
          ctx.moveTo(sp.x, sp.y);
          ctx.lineTo(sq.x, sq.y);
        }
        ctx.stroke();
      }
      break;
    }
    // Zone tool (N2) — 3 entity mới. Ellipse: đường cong THẬT của canvas (không xấp xỉ).
    case 'ellipse': {
      const c = S(e.c);
      ctx.beginPath();
      // Y màn hình lật so với world ⇒ góc xoay đổi dấu (cùng quy ước arc ở trên).
      ctx.ellipse(c.x, c.y, Math.abs(e.rx * v.scale), Math.abs(e.ry * v.scale), -(e.rot ?? 0), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'arrow': {
      if (e.path.length < 2) break;
      const color = mauNet;
      ctx.strokeStyle = color;
      // nét đứt mặc định cho circulation flow nếu entity không tự khai lineType (kể cả khi
      // style không bật realLineweight — arrow là diagram, luôn cần thấy nét đứt).
      const lt: LineType = e.lineType ?? 'dashed';
      ctx.setLineDash(LINE_DASH_MM[lt].map((mm) => Math.max(0.5, mm * v.scale * 2)));
      ctx.beginPath();
      e.path.forEach((p, i) => {
        const s = S(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      // đầu mũi tên (px màn hình từ headSize mm).
      const headPx = Math.max(6, (e.headSize ?? 250) * v.scale);
      if (e.headEnd !== false) {
        const tip = S(e.path[e.path.length - 1]);
        const from = S(e.path[e.path.length - 2]);
        drawArrowHead(ctx, from, tip, headPx);
      }
      if (e.headStart) {
        const tip = S(e.path[0]);
        const from = S(e.path[1]);
        drawArrowHead(ctx, from, tip, headPx);
      }
      break;
    }
    case 'zone': {
      drawZone(ctx, v, e, style);
      break;
    }
    case 'room': {
      drawRoom(ctx, v, e, style);
      break;
    }
  }
}

/**
 * G-M2-04/G-M2-03 — vẽ 1 RoomEntity: biên nét đứt mảnh (phòng là DỮ LIỆU, không phải nét thi
 * công đậm) + nhãn TÊN + m² SỐNG. Con số diện tích KHÔNG lấy từ chữ nào — tính lại từ
 * `boundary` qua `roomLabel()` (`lib/cad/room.ts`) mỗi lần vẽ ⇒ biên đổi là số đổi, hết cảnh
 * "nhãn giữ nguyên, tổng chạy" đo được ở GAP-IF G-M2-03.
 */
function drawRoom(ctx: CanvasRenderingContext2D, v: Viewport, r: RoomEntity, style: DrawStyle) {
  if (r.boundary.length < 3) return;
  const S = (p: Pt) => worldToScreen(v, p);
  const color = style.forceColor ?? r.color ?? '#8b8578';
  ctx.beginPath();
  r.boundary.forEach((p, i) => {
    const s = S(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  if (!style.text) return;
  const { title, area } = roomLabel(r);
  const at = S(r.labelPos ?? roomCentroid(r));
  const px = Math.max(10, Math.min(24, 240 * v.scale));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // cùng khuôn halo của drawZone — đọc được trên mọi nền
  ctx.font = `700 ${px}px Archivo, ui-sans-serif, system-ui, sans-serif`;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, px * 0.22);
  ctx.strokeText(title, at.x, at.y);
  ctx.fillStyle = '#1E1B16';
  ctx.fillText(title, at.x, at.y);
  const px2 = px * 0.72;
  ctx.font = `500 ${px2}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.lineWidth = Math.max(1.5, px2 * 0.22);
  ctx.strokeText(area, at.x, at.y + px * 1.05);
  ctx.fillStyle = 'rgba(30,27,22,0.78)';
  ctx.fillText(area, at.x, at.y + px * 1.05);
}

/** Màu fill của zone: override entity.color nếu có, không thì theo nhóm chức năng. */
export function zoneColor(z: ZoneEntity): string {
  return z.color ?? ZONE_GROUP_META[z.group]?.color ?? '#9a9488';
}

/** Vẽ 1 zone: fill bán trong suốt theo nhóm + viền mảnh + nhãn UPPERCASE in đậm có halo. */
function drawZone(ctx: CanvasRenderingContext2D, v: Viewport, z: ZoneEntity, style: DrawStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const color = style.forceColor ?? zoneColor(z);
  const path = () => {
    ctx.beginPath();
    if (z.ellipse) {
      const c = S(z.ellipse.c);
      ctx.ellipse(c.x, c.y, Math.abs(z.ellipse.rx * v.scale), Math.abs(z.ellipse.ry * v.scale), -(z.ellipse.rot ?? 0), 0, Math.PI * 2);
    } else {
      const pts = zoneBoundaryPoints(z);
      if (pts.length < 3) return false;
      pts.forEach((p, i) => {
        const s = S(p);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      });
      ctx.closePath();
    }
    return true;
  };
  if (!path()) return;
  if (style.outlineOnly) {
    ctx.strokeStyle = color;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0, Math.min(1, z.opacity ?? 0.4));
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (!style.text) return;
  // nhãn: UPPERCASE in đậm tại labelPos ?? centroid, halo trắng để đọc được trên mọi nền.
  const at = S(z.labelPos ?? zoneCentroid(z));
  const px = Math.max(10, Math.min(26, 260 * v.scale));
  ctx.font = `700 ${px}px Archivo, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, px * 0.22);
  const label = (z.label || '').toUpperCase();
  ctx.strokeText(label, at.x, at.y);
  ctx.fillStyle = '#1E1B16';
  ctx.fillText(label, at.x, at.y);
  if (z.labelEn) {
    const px2 = px * 0.62;
    ctx.font = `600 ${px2}px Archivo, ui-sans-serif, system-ui, sans-serif`;
    ctx.lineWidth = Math.max(1.5, px2 * 0.22);
    ctx.strokeText(z.labelEn, at.x, at.y + px * 0.95);
    ctx.fillStyle = 'rgba(30,27,22,0.72)';
    ctx.fillText(z.labelEn, at.x, at.y + px * 0.95);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function dimText(ctx: CanvasRenderingContext2D, v: Viewport, color: string, text: string, at: Pt, ds: DimStyle) {
  ctx.fillStyle = color;
  const px = Math.max(9, ds.textHeight * ds.dimScale * v.scale);
  ctx.font = `${px}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, at.x, at.y - 3);
  ctx.textAlign = 'left';
}

/** Tick 45° kiểu kiến trúc tại điểm `at`, dọc theo hướng đơn vị (ux,uy) của đường kích thước. */
function drawTick(ctx: CanvasRenderingContext2D, at: Pt, ux: number, uy: number, size: number) {
  // xoay hướng (ux,uy) 45° để ra tick chéo — chuẩn ghi kích thước kiến trúc VN thay vì mũi tên.
  const c = Math.SQRT1_2;
  const tx = ux * c - uy * c;
  const ty = ux * c + uy * c;
  ctx.beginPath();
  ctx.moveTo(at.x - tx * size, at.y - ty * size);
  ctx.lineTo(at.x + tx * size, at.y + ty * size);
  ctx.stroke();
}

/** Mũi tên tam giác tại điểm `tip`, hướng từ `from`→`tip` (dùng cho leader radius/diameter). */
function drawArrowHead(ctx: CanvasRenderingContext2D, from: Pt, tip: Pt, size: number) {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const back = { x: tip.x - ux * size, y: tip.y - uy * size };
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(back.x + px * size * 0.4, back.y + py * size * 0.4);
  ctx.lineTo(back.x - px * size * 0.4, back.y - py * size * 0.4);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();
}

/** DAL — aligned: đo khoảng cách a-b, đường kích thước lệch `off`. */
function drawDimAligned(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, ds: DimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const dx = e.b.x - e.a.x;
  const dy = e.b.y - e.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const oa = { x: e.a.x + nx * e.off, y: e.a.y + ny * e.off };
  const ob = { x: e.b.x + nx * e.off, y: e.b.y + ny * e.off };
  const sa = S(oa);
  const sb = S(ob);
  const sa0 = S(e.a);
  const sb0 = S(e.b);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(sa0.x, sa0.y);
  ctx.lineTo(sa.x, sa.y);
  ctx.moveTo(sb0.x, sb0.y);
  ctx.lineTo(sb.x, sb.y);
  ctx.moveTo(sa.x, sa.y);
  ctx.lineTo(sb.x, sb.y);
  ctx.stroke();
  const tickPx = Math.max(2, ds.arrowSize * ds.dimScale * v.scale * 0.5);
  const ulen = Math.hypot(sb.x - sa.x, sb.y - sa.y) || 1;
  const ux = (sb.x - sa.x) / ulen;
  const uy = (sb.y - sa.y) / ulen;
  drawTick(ctx, sa, ux, uy, tickPx);
  drawTick(ctx, sb, ux, uy, tickPx);
  dimText(ctx, v, color, `${Math.round(len)}`, { x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 }, ds);
}

/** DRA/DDI — radius/diameter: leader từ tâm (radius) hoặc xuyên tâm (diameter), mũi tên tại tâm/đối tâm. */
function drawDimRadial(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, diameter: boolean, ds: DimStyle) {
  const S = (p: Pt) => worldToScreen(v, p);
  const r = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
  const from = diameter ? { x: e.a.x * 2 - e.b.x, y: e.a.y * 2 - e.b.y } : e.a;
  const sFrom = S(from);
  const sTo = S(e.b);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(sFrom.x, sFrom.y);
  ctx.lineTo(sTo.x, sTo.y);
  ctx.stroke();
  const arrowPx = Math.max(3, ds.arrowSize * ds.dimScale * v.scale);
  drawArrowHead(ctx, sFrom, sTo, arrowPx);
  if (diameter) drawArrowHead(ctx, sTo, sFrom, arrowPx);
  // 'Ø' (U+00D8) chứ KHÔNG phải '⌀' (U+2300) — giữ khớp với lib/cad/pdf.ts, xem lý do ở đó.
  const label = diameter ? `Ø${Math.round(r * 2)}` : `R${Math.round(r)}`;
  dimText(ctx, v, color, label, { x: (sFrom.x + sTo.x) / 2, y: (sFrom.y + sTo.y) / 2 }, ds);
}

/** DAN — angular: cung đo góc bán kính `off` quanh đỉnh `c`, giữa hướng a-c và b-c. */
function drawDimAngular(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle, ds: DimStyle) {
  if (!e.c) return;
  const S = (p: Pt) => worldToScreen(v, p);
  const ang1 = Math.atan2(e.a.y - e.c.y, e.a.x - e.c.x);
  const ang2 = Math.atan2(e.b.y - e.c.y, e.b.x - e.c.x);
  const r = Math.abs(e.off) || 500;
  const p1 = { x: e.c.x + r * Math.cos(ang1), y: e.c.y + r * Math.sin(ang1) };
  const p2 = { x: e.c.x + r * Math.cos(ang2), y: e.c.y + r * Math.sin(ang2) };
  const sc = S(e.c);
  ctx.strokeStyle = color;
  // đường gióng từ đỉnh tới cung
  ctx.beginPath();
  ctx.moveTo(sc.x, sc.y);
  const sp1 = S(p1);
  ctx.lineTo(sp1.x, sp1.y);
  ctx.moveTo(sc.x, sc.y);
  const sp2 = S(p2);
  ctx.lineTo(sp2.x, sp2.y);
  ctx.stroke();
  // cung đo (Y lật giống drawEntity arc)
  ctx.beginPath();
  ctx.arc(sc.x, sc.y, Math.abs(r * v.scale), -ang2, -ang1);
  ctx.stroke();
  const sweep = (((ang2 - ang1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const deg = Math.round((sweep * 180) / Math.PI);
  const mid = ang1 + sweep / 2;
  const tp = S({ x: e.c.x + r * Math.cos(mid), y: e.c.y + r * Math.sin(mid) });
  dimText(ctx, v, color, `${deg}°`, tp, ds);
}

function drawDimension(ctx: CanvasRenderingContext2D, v: Viewport, e: DimEntity, color: string, style: DrawStyle) {
  const kind = e.kind ?? 'aligned';
  const ds = style.dimStyle ?? DEFAULT_DIM_STYLE;
  if (kind === 'radius') drawDimRadial(ctx, v, e, color, style, false, ds);
  else if (kind === 'diameter') drawDimRadial(ctx, v, e, color, style, true, ds);
  else if (kind === 'angular') drawDimAngular(ctx, v, e, color, style, ds);
  else drawDimAligned(ctx, v, e, color, style, ds);
}

/**
 * Vẽ toàn bộ entity (bỏ layer ẩn) — z-order **5 lượt**, mỗi lượt giữ nguyên insertion-order bên
 * trong nó (doc thiếu loại nào thì lượt đó rỗng, không đổi thứ tự các lượt còn lại):
 *
 *   1) mảng tô MÁY SUY RA   2) mảng tô người vẽ   3) hình học   4) zone + arrow   5) dim + text
 *
 * ▸ Lượt **4 → 5** là khuôn Zone tool (N2) có từ trước: zone/arrow phủ ĐÈ hình học nhưng nằm
 *   DƯỚI dimension/text, để nhãn kích thước/ghi chú không bao giờ bị màng màu che.
 *
 * ▸ Lượt **1 + 2 tách ra 31/08 — HATCH LUÔN CHÌM.** Trước đó `hatch` nằm chung lượt hình học,
 *   tức thứ tự với nét là **thứ tự tình cờ trong stream DXF**: `HATCH` rơi vào sau một `LINE` là
 *   mảng tô ĐÈ mất chính nét ấy. Bản vẽ nghề thì ngược lại — poché luôn nằm dưới mọi nét, không
 *   bao giờ có chuyện mảng tô ăn nét. Đây là luật vẽ, không phải sở thích, nên nó nằm ở tầng vẽ
 *   chứ không đẩy cho từng nơi gọi tự xếp mảng.
 *
 * ▸ Lượt **1 dưới lượt 2**: mảng tô do MÁY suy ra (`Entity.inferred`, `tuong-hinh-hoc.ts`) xuống
 *   đáy cùng — suy đoán của máy không được đè dữ liệu người vẽ, kể cả mảng tô của người.
 *   Ngôn ngữ thị giác của lớp này: xem `POCHE_TAM` (bản tạm, phiếu `P1-mock`).
 *
 * ⚠️ Bản vẽ KHÔNG có hatch ⇒ hai lượt đầu rỗng ⇒ nhật ký thao tác y hệt bản trước 31/08.
 */
export function drawEntities(ctx: CanvasRenderingContext2D, v: Viewport, doc: Doc, style: DrawStyle) {
  const toSuyRa: Entity[] = [];
  const toNguoiVe: Entity[] = [];
  const geom: Entity[] = [];
  const overlay: Entity[] = [];
  const annot: Entity[] = [];
  const li = layerIndex(doc);
  for (const e of doc.entities) {
    const lay = li.get(e.layer);
    if (lay && !lay.visible) continue;
    if (e.type === 'hatch') (e.inferred ? toSuyRa : toNguoiVe).push(e);
    else if (e.type === 'zone' || e.type === 'arrow') overlay.push(e);
    else if (e.type === 'dim' || e.type === 'text') annot.push(e);
    else geom.push(e);
  }
  for (const e of toSuyRa) drawEntity(ctx, v, doc, e, style);
  for (const e of toNguoiVe) drawEntity(ctx, v, doc, e, style);
  for (const e of geom) drawEntity(ctx, v, doc, e, style);
  for (const e of overlay) drawEntity(ctx, v, doc, e, style);
  for (const e of annot) drawEntity(ctx, v, doc, e, style);
}

/**
 * Zone tool (N3) — legend chấm màu vẽ THẲNG vào canvas export (góc dưới-trái): gom nhóm từ các
 * ZoneEntity đang có trong doc. Dùng cho "Xuất Presenting" (slide zone map có chú giải như bản
 * Brazil tham chiếu). KHÔNG dùng cho canvas live (đã có panel ZonesLegend DOM riêng, kéo được).
 */
export function drawZoneLegend(ctx: CanvasRenderingContext2D, doc: Doc, W: number, H: number) {
  const zones = doc.entities.filter((e): e is ZoneEntity => e.type === 'zone');
  if (!zones.length) return;
  const used = ZONE_GROUPS.filter((g) => zones.some((z) => z.group === g));
  const hasArrow = doc.entities.some((e) => e.type === 'arrow');
  const rows: { color: string; vi: string; en: string }[] = used.map((g) => ({ ...ZONE_GROUP_META[g], color: ZONE_GROUP_META[g].color }));
  if (hasArrow) rows.push({ color: '#6B7280', vi: 'Luồng giao thông', en: 'Circulation' });
  const pad = Math.round(W * 0.012) + 8;
  const lineH = Math.max(16, Math.round(W * 0.011));
  const fontPx = Math.max(10, Math.round(lineH * 0.62));
  const titlePx = Math.max(9, Math.round(fontPx * 0.82));
  ctx.save();
  ctx.font = `600 ${fontPx}px Archivo, ui-sans-serif, system-ui, sans-serif`;
  let maxW = 0;
  for (const r of rows) maxW = Math.max(maxW, ctx.measureText(`${r.vi.toUpperCase()} · ${r.en}`).width);
  const boxW = maxW + lineH + pad * 2 + 8;
  const boxH = rows.length * lineH + pad * 2 + titlePx + 8;
  const bx = pad;
  const by = H - boxH - pad;
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = '#FAF7F1';
  ctx.strokeStyle = 'rgba(30,27,22,0.18)';
  ctx.lineWidth = 1;
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeRect(bx, by, boxW, boxH);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(30,27,22,0.55)';
  ctx.font = `600 ${titlePx}px Archivo, ui-sans-serif, system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('NHÓM CHỨC NĂNG · FUNCTION GROUPS', bx + pad, by + pad * 0.7);
  rows.forEach((r, i) => {
    const cy = by + pad * 0.7 + titlePx + 8 + i * lineH + lineH / 2;
    ctx.beginPath();
    ctx.arc(bx + pad + lineH * 0.28, cy, lineH * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = r.color;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `600 ${fontPx}px Archivo, ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = '#1E1B16';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.vi.toUpperCase(), bx + pad + lineH * 0.28 * 2 + 8, cy);
    const w1 = ctx.measureText(r.vi.toUpperCase()).width;
    ctx.fillStyle = 'rgba(30,27,22,0.55)';
    ctx.fillText(` · ${r.en}`, bx + pad + lineH * 0.28 * 2 + 8 + w1, cy);
  });
  ctx.restore();
}

/**
 * Zone tool (N3) — render zone map → PNG dataURL kèm LEGEND (khác renderDocToDataURL thuần):
 * nền beige TTT, giữ MÀU thật của zone/layer (không ép đen-trắng). Dùng cho nút "Xuất Presenting".
 */
export function renderZoneMapToDataURL(doc: Doc, maxPx = 2000, pad = 80): string {
  if (typeof document === 'undefined') return '';
  const box = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const aspect = bw / bh;
  const W = aspect >= 1 ? maxPx : Math.round(maxPx * aspect);
  const H = aspect >= 1 ? Math.round(maxPx / aspect) : maxPx;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FAF7F1';
  ctx.fillRect(0, 0, W, H);
  const vp: Viewport = fitBox(box, W, H, pad);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawEntities(ctx, vp, doc, { stroke: '#47423a', lineWidth: 1.6, text: true, realLineweight: true });
  drawZoneLegend(ctx, doc, W, H);
  return canvas.toDataURL('image/png');
}

/**
 * Render bản vẽ → PNG dataURL (nền trắng, nét đen), cạnh dài ~maxPx. Dùng cho Export PNG
 * và "Đưa sang Render". Tự tạo canvas ngoài màn hình (chỉ chạy phía client — có document).
 */
export function renderDocToDataURL(doc: Doc, maxPx = 2000, pad = 80): string {
  if (typeof document === 'undefined') return '';
  const box = docBox(doc) ?? { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const aspect = bw / bh;
  let W: number;
  let H: number;
  if (aspect >= 1) {
    W = maxPx;
    H = Math.round(maxPx / aspect);
  } else {
    H = maxPx;
    W = Math.round(maxPx * aspect);
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const vp: Viewport = fitBox(box, W, H, pad);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawEntities(ctx, vp, doc, { stroke: '#111111', forceColor: '#111111', lineWidth: 2, text: true, realLineweight: true });
  return canvas.toDataURL('image/png');
}
