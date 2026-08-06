/**
 * lib/cad/commands.ts — LỆNH/MACRO NỘI THẤT cho chặng 1 "Layout CAD" (mức SƠ PHÁC DD —
 * Design Development). Mục tiêu: vẽ nhanh mặt bằng trình bày được (tường/phòng/cửa/kích
 * thước/nhãn), KHÔNG nhắm tới độ chính xác hồ sơ thi công (CD) — phần CAD chuyên nghiệp đầy
 * đủ (TRIM/EXTEND/FILLET/CHAMFER/HATCH pattern thật…) thuộc về app CAD tách rời (dự án EFC),
 * cố tình KHÔNG làm sâu ở đây.
 *
 * Mọi hàm ở đây THUẦN (nhận toạ độ/tham số → trả Entity[]), không đụng store/React — gọi từ
 * CadCanvas/CadEditor rồi addEntities(). Giữ file này là nơi DUY NHẤT chứa logic macro để
 * CadEditor/CadCanvas không phình.
 */

import type { Doc, Entity, Box, Pt, WallRun, WallLocationLine } from './model';
import { newId } from './store';
import { BLOCK_MAP } from './furniture';

/* ───────────────────────── Sprint 10 — Việc 1: nhập toạ độ chính xác ───────────────────────── */

/**
 * Kết quả gõ toạ độ kiểu AutoCAD trên dòng lệnh/dynamic input:
 *  - 'abs' — toạ độ TUYỆT ĐỐI world (mm), gõ "X,Y" (VD "1500,2200").
 *  - 'rel' — toạ độ TƯƠNG ĐỐI so điểm gốc vừa chốt, gõ "@dx,dy" (VD "@300,-150").
 * Hàm THUẦN — không biết base point là gì (CadCanvas tự cộng base cho 'rel').
 */
export type CoordInput = { kind: 'abs'; pt: Pt } | { kind: 'rel'; dx: number; dy: number };

/** Parse chuỗi đang gõ (dynBuf) thành toạ độ — null nếu không đúng định dạng "X,Y"/"@dx,dy"
 * (VD chỉ là số đơn "500" — đó là ĐỘ DÀI, không phải toạ độ, xử lý riêng ở CadCanvas). */
export function parseCoordInput(raw: string): CoordInput | null {
  const s = raw.trim();
  if (!s) return null;
  const rel = s.startsWith('@');
  const body = rel ? s.slice(1) : s;
  const parts = body.split(',');
  if (parts.length !== 2) return null;
  const a = parseFloat(parts[0]);
  const b = parseFloat(parts[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return rel ? { kind: 'rel', dx: a, dy: b } : { kind: 'abs', pt: { x: a, y: b } };
}

/** Áp dụng CoordInput lên điểm hiệu dụng — 'rel' cần `base` (điểm gốc vừa chốt); không có base
 * thì 'rel' vô nghĩa → trả null (CadCanvas fallback về snap point như cũ). */
export function resolveCoordInput(coord: CoordInput, base?: Pt): Pt | null {
  if (coord.kind === 'abs') return coord.pt;
  if (!base) return null;
  return { x: base.x + coord.dx, y: base.y + coord.dy };
}

/* ───────────────────────── WALL — tường 2 nét + poché ───────────────────────── */

/** 1 đoạn tường tim-tường a→b, bề dày t (mm) → quad tô đặc (hatch) + biên nét mảnh.
 *
 * A3 · G-M1-08 — hai entity này NEO vào nhau ngay từ lúc sinh: `hatch.hostId = polyline.id`
 * (đường bao là chủ, vùng tô là con — lý do đầy đủ ở đầu `lib/cad/poche.ts`). Trước đây chúng rời
 * nhau hoàn toàn nên dời một nửa là tường rách. */
export function wallSegment(a: { x: number; y: number }, b: { x: number; y: number }, t: number, layer: string): Entity[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (t / 2);
  const ny = (dx / len) * (t / 2);
  const p1 = { x: a.x + nx, y: a.y + ny };
  const p2 = { x: b.x + nx, y: b.y + ny };
  const p3 = { x: b.x - nx, y: b.y - ny };
  const p4 = { x: a.x - nx, y: a.y - ny };
  const outlineId = newId('e');
  return [
    { id: newId('e'), type: 'hatch', layer, points: [p1, p2, p3, p4], solid: true, hostId: outlineId },
    { id: outlineId, type: 'polyline', layer, points: [p1, p2, p3, p4], closed: true },
  ];
}

/** Chuỗi tường qua nhiều điểm tim-tường (như polyline). closed=true khép vòng (phòng kín). */
export function wallChain(points: { x: number; y: number }[], t: number, layer: string, closed = false): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < points.length - 1; i++) out.push(...wallSegment(points[i], points[i + 1], t, layer));
  if (closed && points.length > 2) out.push(...wallSegment(points[points.length - 1], points[0], t, layer));
  return out;
}

/* ───────────────────────── WallRun — location line tường (P11, `SPEC-VE-REVIT-MODE.md` §2) ───────────────────────── */

/**
 * Offset [trái, phải] của 1 đoạn `path` ra 2 biên tường theo `locationLine` (dấu theo pháp tuyến
 * TRÁI của chiều vẽ a→b — quay 90° CCW từ hướng đi, chuẩn world Y-up của file này, xem `nx/ny`
 * trong `wallSegment` phía trên: đây CHÍNH LÀ pháp tuyến đó, chỉ khác là KHÔNG nhân sẵn t/2).
 * 'left'/'right': path CHÍNH LÀ biên đó → offset phía mình = 0, dồn hết bề dày `t` sang phía kia.
 * Đây là cơ chế "location line đứng yên khi đổi bề dày": `path` không đổi theo `t`, chỉ 2 số offset
 * này đổi — cạnh có offset 0 luôn trùng khớp `path` bất kể `t` là bao nhiêu.
 */
export function wallLocationOffsets(t: number, loc: WallLocationLine): { left: number; right: number } {
  if (loc === 'left') return { left: 0, right: -t };
  if (loc === 'right') return { left: t, right: 0 };
  return { left: t / 2, right: -t / 2 };
}

/**
 * 1 đoạn tường a→b theo `locationLine` — thay `wallSegment` (LUÔN center) khi cần path đứng yên
 * ở 1 biên. Entity sinh ra mang `elementType:'wall'`/`wallThicknessMm` (IF2-nền, đúng khuôn
 * `Base` — xem model.ts) để Navigator/BOQ đọc được ngay, không đợi gán tay. `wallSegment` cũ GIỮ
 * NGUYÊN, KHÔNG đụng (sketch/pro vẫn dùng y như trước — nguyên tắc 3 SPEC-VE-REVIT-MODE §0).
 */
export function wallSegmentOutline(a: Pt, b: Pt, t: number, layer: string, loc: WallLocationLine = 'center'): Entity[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const { left, right } = wallLocationOffsets(t, loc);
  const p1 = { x: a.x + nx * left, y: a.y + ny * left };
  const p2 = { x: b.x + nx * left, y: b.y + ny * left };
  const p3 = { x: b.x + nx * right, y: b.y + ny * right };
  const p4 = { x: a.x + nx * right, y: a.y + ny * right };
  // A3 · G-M1-08 — neo poché vào đường bao ngay lúc sinh (xem `wallSegment` phía trên + poche.ts).
  const outlineId = newId('e');
  return [
    { id: newId('e'), type: 'hatch', layer, points: [p1, p2, p3, p4], solid: true, elementType: 'wall', wallThicknessMm: t, hostId: outlineId },
    { id: outlineId, type: 'polyline', layer, points: [p1, p2, p3, p4], closed: true, elementType: 'wall', wallThicknessMm: t },
  ];
}

/**
 * Sinh geometry (hatch+polyline mỗi đoạn) cho TOÀN BỘ `path` của 1 WallRun — dùng chung cho tạo
 * mới lẫn regen. THUẦN, luôn cấp id MỚI (`newId`) — caller (store, ngoài phạm vi file này) chịu
 * trách nhiệm xoá `entityIds` cũ khỏi `Doc` trong CÙNG snapshot (xem `regenWallRun`). CHƯA nối
 * tự sạch nhiều đoạn (§3 SPEC-VE-REVIT-MODE, miter/bevel/T-trim) — mỗi đoạn sinh quad ĐỘC LẬP như
 * `wallChain` cũ, việc RIÊNG, không làm ở đây.
 */
export function wallRunOutlineEntities(
  run: Pick<WallRun, 'path' | 'thicknessMm' | 'locationLine' | 'layer' | 'closed'>,
): Entity[] {
  const { path, thicknessMm, locationLine, layer, closed } = run;
  const out: Entity[] = [];
  for (let i = 0; i < path.length - 1; i++) out.push(...wallSegmentOutline(path[i], path[i + 1], thicknessMm, layer, locationLine));
  if (closed && path.length > 2) out.push(...wallSegmentOutline(path[path.length - 1], path[0], thicknessMm, layer, locationLine));
  return out;
}

/** Tạo WallRun mới + geometry ban đầu — mặt tiền tương đương `wallChain()` cũ nhưng GIỮ `path`
 * sống (mode revit dùng hàm này thay `wallChain`, xem SPEC-VE-REVIT-MODE §2 "Vẽ ở mode nào"). */
export function createWallRun(
  path: Pt[],
  thicknessMm: number,
  layer: string,
  locationLine: WallLocationLine = 'center',
  closed = false,
): { run: WallRun; entities: Entity[] } {
  const entities = wallRunOutlineEntities({ path, thicknessMm, locationLine, layer, closed });
  const run: WallRun = {
    id: newId('wr'),
    path,
    closed,
    thicknessMm,
    locationLine,
    layer,
    entityIds: entities.map((e) => e.id),
  };
  return { run, entities };
}

/**
 * Đổi tham số 1 WallRun (`path`/`thicknessMm`/`locationLine`/`closed`) rồi SINH LẠI geometry —
 * đúng quy tắc regen `SPEC-VE-REVIT-MODE.md` §2: "mọi sửa đổi → xoá entityIds cũ, sinh mới, ghi
 * lại entityIds — MỘT snapshot cho cả cụm". THUẦN — không đụng `doc.entities` (đúng ranh giới đầu
 * file "gọi từ CadCanvas/CadEditor rồi addEntities()"); caller tự xoá `removedEntityIds` khỏi Doc
 * + push `entities` mới trong CÙNG 1 lệnh undo (chưa wire — CadCanvas/store là việc khác, ngoài
 * `vùng: lib/cad/model.ts · lib/cad/commands.ts` của phiếu này).
 */
export function regenWallRun(
  run: WallRun,
  patch: Partial<Pick<WallRun, 'path' | 'thicknessMm' | 'locationLine' | 'closed'>>,
): { run: WallRun; entities: Entity[]; removedEntityIds: string[] } {
  const next: WallRun = { ...run, ...patch };
  const entities = wallRunOutlineEntities(next);
  next.entityIds = entities.map((e) => e.id);
  return { run: next, entities, removedEntityIds: run.entityIds };
}

/* ───────────────────────── ROOM — phòng chữ nhật + nhãn + diện tích ───────────────────────── */

export interface RoomResult {
  entities: Entity[];
  areaM2: number;
}

/**
 * Vẽ 1 phòng chữ nhật từ 2 góc đối diện: 4 tường (wallChain khép vòng) + tên phòng + diện
 * tích thông thuỷ (trong tim tường trừ bề dày, xấp xỉ đủ dùng cho DD) căn giữa phòng.
 */
export function roomRect(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  t: number,
  name: string,
  wallLayer: string,
  textLayer: string,
): RoomResult {
  const x0 = Math.min(p0.x, p1.x);
  const y0 = Math.min(p0.y, p1.y);
  const x1 = Math.max(p0.x, p1.x);
  const y1 = Math.max(p0.y, p1.y);
  const corners = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  const entities = wallChain(corners, t, wallLayer, true);
  const clearW = Math.max(0, x1 - x0 - t);
  const clearH = Math.max(0, y1 - y0 - t);
  const areaM2 = (clearW * clearH) / 1e6;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const h = Math.min(280, Math.max(160, Math.min(x1 - x0, y1 - y0) * 0.12));
  entities.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: cx - (name.length * h * 0.3), y: cy + h * 0.5 }, text: name, h });
  entities.push({
    id: newId('e'),
    type: 'text',
    layer: textLayer,
    at: { x: cx - h * 1.6, y: cy - h * 0.9 },
    text: `${areaM2.toFixed(1)} m²`,
    h: h * 0.72,
  });
  return { entities, areaM2 };
}

/* ───────────────────────── DOOR / WINDOW — chèn nhanh block có sẵn ───────────────────────── */

/** Đặt 1 block furniture (dùng cho DOOR/WIN — tái dùng block 'door'/'window' có sẵn trong furniture.ts). */
export function placeBlock(blockId: string, at: { x: number; y: number }, rot: number, layer: string): Entity | null {
  if (!BLOCK_MAP[blockId]) return null;
  return { id: newId('e'), type: 'block', layer, block: blockId, at, rot, sx: 1, sy: 1 };
}

/* ───────────────────────── LƯỚI TRỤC (grid axes) ───────────────────────── */

/** Lưới trục kiến trúc: số 1,2,3… dọc trục X (dưới), chữ A,B,C… dọc trục Y (trái), mỗi đầu có bong bóng tròn. */
export function axesGrid(box: Box, spacing: number, layer: string, margin = 800): Entity[] {
  const out: Entity[] = [];
  const r = 260;
  const x0 = Math.floor(box.minX / spacing) * spacing;
  const x1 = Math.ceil(box.maxX / spacing) * spacing;
  const y0 = Math.floor(box.minY / spacing) * spacing;
  const y1 = Math.ceil(box.maxY / spacing) * spacing;
  const bottom = box.minY - margin;
  const left = box.minX - margin;

  let n = 1;
  for (let x = x0; x <= x1 + 1; x += spacing) {
    out.push({ id: newId('e'), type: 'line', layer, a: { x, y: box.minY - margin * 0.3 }, b: { x, y: box.maxY + margin * 0.3 } });
    out.push({ id: newId('e'), type: 'circle', layer, c: { x, y: bottom - r }, r });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: x - r * 0.35, y: bottom - r - r * 0.4 }, text: String(n), h: r * 0.9 });
    n += 1;
  }
  let letter = 65; // 'A'
  for (let y = y0; y <= y1 + 1; y += spacing) {
    out.push({ id: newId('e'), type: 'line', layer, a: { x: box.minX - margin * 0.3, y }, b: { x: box.maxX + margin * 0.3, y } });
    out.push({ id: newId('e'), type: 'circle', layer, c: { x: left - r, y }, r });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: left - r - r * 0.35, y: y - r * 0.4 }, text: String.fromCharCode(letter), h: r * 0.9 });
    letter += 1;
  }
  return out;
}

/* ───────────────────────── KHUNG TÊN (cajetín) ───────────────────────── */

export interface TitleBlockInfo {
  project: string;
  drawing: string;
  scale: string;
  author?: string;
  date?: string;
}

/** Khung tên góc phải-dưới bản vẽ, neo tại `at` = góc phải-dưới của khung. */
export function titleBlock(at: { x: number; y: number }, info: TitleBlockInfo, wallLayer: string, textLayer: string): Entity[] {
  const w = 2600;
  const h = 900;
  const x0 = at.x - w;
  const y0 = at.y;
  const out: Entity[] = [];
  out.push({ id: newId('e'), type: 'rect', layer: wallLayer, x: x0, y: y0, w, h });
  out.push({ id: newId('e'), type: 'line', layer: wallLayer, a: { x: x0, y: y0 + h * 0.55 }, b: { x: x0 + w, y: y0 + h * 0.55 } });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + h - 130 }, text: info.project || 'DỰ ÁN', h: 130 });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + h * 0.55 + 40 }, text: info.drawing || 'MẶT BẰNG BỐ TRÍ — SƠ PHÁC DD', h: 90 });
  out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + 60, y: y0 + 60 }, text: `Tỷ lệ ${info.scale}`, h: 90 });
  if (info.date) out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + w * 0.5, y: y0 + 60 }, text: info.date, h: 90 });
  if (info.author) out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x: x0 + w * 0.72, y: y0 + 60 }, text: `VẼ: ${info.author}`, h: 90 });
  return out;
}

/* ─────────────── KHUNG TÊN CHUYÊN NGHIỆP (B1 24/07 — song ngữ, theo khổ giấy) ─────────────── */

/**
 * Thông tin khung tên — mở rộng TitleBlockInfo (số bản vẽ + người kiểm + tên studio), additive.
 *
 * ⛔ LUẬT NỀN TẢNG: InteriorFlow là sản phẩm ĐỘC LẬP, dùng cho MỌI studio. Tên studio in trên
 * bản vẽ KHÔNG hardcode — đọc từ Brand Kit / trường "Tên studio" của dự án đang mở (UI:
 * `TitleBlockPanel` trong components/cad/CadEditor.tsx, lưu ở `Doc.studioName` → vào .idf).
 */
export interface TitleBlockInfoPro extends TitleBlockInfo {
  /** số bản vẽ, VD "IF-01". */
  drawingNo?: string;
  /** người kiểm (checked by). */
  checker?: string;
  /** tên studio/công ty của DỰ ÁN (Brand Kit). Rỗng/undefined ⇒ ô wordmark để TRỐNG. */
  studio?: string;
}

/** @deprecated tên cũ (khi khung tên còn hardcode 1 studio) — giữ cho code/.idf cũ. */
export type TitleBlockInfoTTT = TitleBlockInfoPro;

/**
 * Khung tên chuyên nghiệp — song ngữ Việt·Anh, đủ trường ISO 7200 tối thiểu (dự án/bản vẽ/số/
 * tỉ lệ/ngày/vẽ/kiểm). Wordmark cột trái lấy từ `info.studio` (Brand Kit của dự án); KHÔNG in
 * thương hiệu nào của app hay của studio nào — bản vẽ thuộc về DỰ ÁN, không phải quảng cáo app.
 * KHÁC titleBlock() cũ (giữ nguyên, backward-compat): kích thước đặt theo KHỔ GIẤY — template
 * 180×42mm TRÊN GIẤY, nhân scaleN (tỉ lệ 1:N) ra mm world, nên in ra ở tỉ lệ đã chọn thì khung
 * tên luôn đúng cỡ 180×42mm bất kể khổ A3/A2/A1. Text tỉ lệ giữ ĐÚNG tiền tố "Tỷ lệ " để
 * applyRealScaleToTitleBlock (pdf.ts) vẫn ghi đè được lúc xuất. `at` = góc phải-dưới của khung
 * (cùng quy ước titleBlock cũ).
 */
/**
 * Ước lượng bề rộng chuỗi TRÊN GIẤY (mm) khi in ở chiều cao chữ `hMm`.
 *
 * Vì sao ƯỚC LƯỢNG chứ không đo thật: tầng này là hình học thuần (sinh `Entity[]`, dùng chung
 * cho canvas/DXF/IDF/PDF) — không có font metrics, jsPDF chỉ xuất hiện ở `lib/cad/pdf.ts`.
 * Hệ số advance trung bình đo THẬT bằng `jsPDF.getTextWidth` trên chính các chuỗi khung tên với
 * font đang nhúng (Be Vietnam Pro, xem lib/pdf-font.ts): ~0.52 × h cho chữ hỗn hợp, ~0.62 × h
 * cho chuỗi TOÀN HOA (chữ hoa rộng hơn). Helvetica hẹp hơn ~5-8% nên ước lượng này là phía AN
 * TOÀN cho cả 2 font.
 */
function estTextWidthMm(text: string, hMm: number): number {
  const allCaps = text === text.toUpperCase();
  return text.length * (allCaps ? 0.62 : 0.52) * hMm;
}

/**
 * Co chiều cao chữ VỪA ĐỦ để chuỗi lọt lòng ô khung tên. KHÔNG phóng to (chuỗi ngắn giữ nguyên
 * cỡ thiết kế), và có sàn 60% để chữ không co tới mức không đọc nổi — quá sàn thì chấp nhận
 * tràn nhẹ, coi như tín hiệu cho người dùng rút gọn tên dự án/tên người.
 *
 * Trước fix #25 khung tên dùng chiều cao CỐ ĐỊNH: "KIẾN TRÚC ĐƯỜNG NÉT" (58.6mm) và dòng
 * "Vẽ · Drawn: … Kiểm · Checked: …" (86.0mm) đã tràn ô 46mm/72mm SẴN TỪ TRƯỚC (helvetica cũng
 * tràn: 54.4mm/80.9mm) — đổi font chỉ làm rõ thêm. Nay co lại nên hết tràn ở cả 2 font.
 */
function fitTextHeightMm(text: string, hMm: number, cellWmm: number): number {
  const w = estTextWidthMm(text, hMm);
  if (w <= cellWmm || w <= 0) return hMm;
  return Math.max(hMm * 0.6, hMm * (cellWmm / w));
}

export function titleBlockPro(
  at: { x: number; y: number },
  info: TitleBlockInfoPro,
  wallLayer: string,
  textLayer: string,
  scaleN = 100,
): Entity[] {
  const k = Math.max(1, scaleN); // mm-giấy → mm-world
  const W = 180 * k;
  const H = 42 * k;
  const x0 = at.x - W;
  const y0 = at.y;
  const x1 = at.x;
  const y1 = at.y + H;
  // 2 vạch dọc chia 3 cột: brand | dự án/bản vẽ | số/tỉ lệ/ngày
  const cA = x0 + 52 * k;
  const cB = x0 + 130 * k;
  // vạch ngang chia hàng trong cột giữa + phải
  const rMid = y0 + 22 * k; // trên: dự án · dưới: bản vẽ (cột giữa)
  const rBot = y0 + 11 * k; // đáy cột giữa: vẽ/kiểm
  const out: Entity[] = [];
  const ln = (a: Pt, b: Pt) => out.push({ id: newId('e'), type: 'line', layer: wallLayer, a, b });
  const tx = (x: number, y: number, text: string, h: number) =>
    out.push({ id: newId('e'), type: 'text', layer: textLayer, at: { x, y }, text, h: h * k });

  out.push({ id: newId('e'), type: 'rect', layer: wallLayer, x: x0, y: y0, w: W, h: H });
  ln({ x: cA, y: y0 }, { x: cA, y: y1 });
  ln({ x: cB, y: y0 }, { x: cB, y: y1 });
  ln({ x: cA, y: rMid }, { x: x1, y: rMid });
  ln({ x: cA, y: rBot }, { x: cB, y: rBot });
  // hàng cột phải: 3 ô (số · tỉ lệ · ngày) — chia đều dưới rMid… dùng rMid và thêm 1 vạch
  const rR2 = y0 + 11 * k;
  ln({ x: cB, y: rR2 }, { x: x1, y: rR2 });

  const pad = 3 * k;
  // Bề rộng LÒNG Ô (mm giấy) của 3 cột — trừ pad hai bên. Dùng để co chữ cho khỏi tràn.
  const cellL = 52 - 6;
  const cellM = 78 - 6;
  const cellR = 50 - 6;
  /** Như `tx` nhưng CO chiều cao chữ nếu chuỗi ước lượng dài hơn lòng ô (xem fitTextHeightMm). */
  const txFit = (x: number, y: number, text: string, h: number, cellWmm: number) =>
    tx(x, y, text, fitTextHeightMm(text, h, cellWmm));

  // ── cột trái: wordmark studio của DỰ ÁN (Brand Kit) — trống nếu user chưa nhập ──
  const studio = (info.studio || '').trim();
  if (studio) txFit(x0 + pad, y0 + H - 12 * k, studio.toUpperCase(), 5, cellL);
  txFit(x0 + pad, y0 + 3 * k, 'Hồ sơ sơ phác · Design Development', 2.4, cellL);
  // ── cột giữa: dự án (trên) · bản vẽ (giữa) · vẽ/kiểm (đáy) ──
  txFit(cA + pad, rMid + 14 * k, 'DỰ ÁN · PROJECT', 2.4, cellM);
  txFit(cA + pad, rMid + 4 * k, (info.project || 'DỰ ÁN').toUpperCase(), 5, cellM);
  txFit(cA + pad, rBot + 7 * k, 'BẢN VẼ · DRAWING', 2.4, cellM);
  txFit(cA + pad, rBot + 2 * k, info.drawing || 'MẶT BẰNG BỐ TRÍ — SƠ PHÁC DD', 3.2, cellM);
  txFit(cA + pad, y0 + 2.5 * k, `Vẽ · Drawn: ${info.author || '—'}    Kiểm · Checked: ${info.checker || '—'}`, 2.6, cellM);
  // ── cột phải: số bản vẽ (trên) · tỉ lệ + ngày (dưới) ──
  txFit(cB + pad, rMid + 14 * k, 'SỐ · NO', 2.4, cellR);
  txFit(cB + pad, rMid + 4 * k, info.drawingNo || 'IF-01', 6, cellR);
  txFit(cB + pad, rR2 + 6 * k, `Tỷ lệ ${info.scale}`, 3.6, cellR);
  txFit(cB + pad, y0 + 3 * k, info.date ? `Ngày · Date ${info.date}` : 'Ngày · Date —', 2.6, cellR);
  return out;
}

/**
 * @deprecated tên cũ của `titleBlockPro` (thời khung tên còn hardcode wordmark 1 studio).
 * Giữ export để code/test cũ không vỡ — hành vi y hệt titleBlockPro (không in studio nào
 * trừ khi truyền `info.studio`).
 */
export const titleBlockTTT = titleBlockPro;

/* ───────────────────────── MŨI TÊN BẮC ───────────────────────── */

export function northArrow(at: { x: number; y: number }, size = 700, layer = 'l-text'): Entity[] {
  const r = size / 2;
  return [
    { id: newId('e'), type: 'circle', layer, c: at, r },
    {
      id: newId('e'),
      type: 'polyline',
      layer,
      closed: true,
      points: [
        { x: at.x, y: at.y + r * 0.85 },
        { x: at.x + r * 0.28, y: at.y - r * 0.5 },
        { x: at.x, y: at.y - r * 0.2 },
        { x: at.x - r * 0.28, y: at.y - r * 0.5 },
      ],
    },
    { id: newId('e'), type: 'text', layer, at: { x: at.x - r * 0.28, y: at.y + r + 60 }, text: 'B', h: r * 0.55 },
  ];
}

/* ───────────────────────── CAO ĐỘ (spot elevation) ───────────────────────── */

/**
 * Ký hiệu cao độ kiểu kiến trúc: tam giác đặc nhỏ (đỉnh chạm điểm đo) + gạch chân + trị số —
 * quy ước ISO cho cao độ sàn/trần (VD "±0.000" nền hoàn thiện tầng trệt, "+2.700" trần...).
 * `at` = điểm chạm (đỉnh dưới tam giác); giá trị dương chèn phía trên, âm phía dưới `at`.
 */
export function elevationMarker(at: { x: number; y: number }, label: string, layer = 'l-text', size = 180): Entity[] {
  const s = size;
  const top = { x: at.x, y: at.y + s * 1.4 };
  return [
    {
      id: newId('e'),
      type: 'hatch',
      layer,
      solid: true,
      points: [
        { x: at.x, y: at.y },
        { x: at.x + s * 0.5, y: at.y + s * 0.9 },
        { x: at.x - s * 0.5, y: at.y + s * 0.9 },
      ],
    },
    { id: newId('e'), type: 'line', layer, a: { x: at.x - s * 0.9, y: top.y }, b: { x: at.x + s * 0.9, y: top.y } },
    { id: newId('e'), type: 'text', layer, at: { x: at.x + s * 0.15, y: top.y + 20 }, text: label, h: s * 0.9 },
  ];
}

/* ───────────────────────── THƯỚC TỈ LỆ ───────────────────────── */

/** Thước tỉ lệ: vạch 1m xen kẽ, số mét dưới mỗi vạch. `at` = góc trái-dưới của thước. */
export function scaleBar(at: { x: number; y: number }, segments = 4, segLenMm = 1000, layer = 'l-text'): Entity[] {
  const out: Entity[] = [];
  const barH = 90;
  for (let i = 0; i < segments; i++) {
    const x0 = at.x + i * segLenMm;
    const filled = i % 2 === 0;
    if (filled) {
      out.push({
        id: newId('e'),
        type: 'hatch',
        layer,
        solid: true,
        points: [
          { x: x0, y: at.y },
          { x: x0 + segLenMm, y: at.y },
          { x: x0 + segLenMm, y: at.y + barH },
          { x: x0, y: at.y + barH },
        ],
      });
    }
    out.push({ id: newId('e'), type: 'rect', layer, x: x0, y: at.y, w: segLenMm, h: barH });
    out.push({ id: newId('e'), type: 'text', layer, at: { x: x0 - 40, y: at.y + barH + 60 }, text: String(i), h: 110 });
  }
  out.push({ id: newId('e'), type: 'text', layer, at: { x: at.x, y: at.y - 160 }, text: 'Tỷ lệ (m)', h: 110 });
  return out;
}

/* ───────────────────────── CHUỖI KÍCH THƯỚC (dimension chain) ───────────────────────── */

/** Ghi 1 chuỗi kích thước liên tiếp qua các điểm (thẳng hàng) — dùng cho cạnh ngoài mặt bằng. */
export function dimensionChain(points: { x: number; y: number }[], off: number, layer: string): Entity[] {
  const out: Entity[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    out.push({ id: newId('e'), type: 'dim', layer, a: points[i], b: points[i + 1], off });
  }
  return out;
}

/* ───────────────────────── mở rộng doc tiện dụng ───────────────────────── */

/** Thêm bộ tiện ích trình bày (lưới trục + khung tên + mũi tên Bắc + thước tỉ lệ) quanh 1 bản vẽ đã có. */
export function addPresentationKit(doc: Doc, box: Box, info: TitleBlockInfo): Entity[] {
  const out: Entity[] = [];
  out.push(...axesGrid(box, 3000, 'l-axis'));
  const tbAt = { x: box.maxX + 2600, y: box.minY - 400 };
  out.push(...titleBlock(tbAt, info, 'l-wall', 'l-text'));
  out.push(...northArrow({ x: box.maxX + 900, y: box.maxY - 300 }, 700, 'l-text'));
  out.push(...scaleBar({ x: box.minX, y: box.minY - 1400 }, 4, 1000, 'l-text'));
  void doc;
  return out;
}

/* ───────────────────────── BOOLEAN 3D — khoét/hợp/giao khối (NC-12 VIỆC 3) ─────────────────────────
 * Nghiệm thu: khoét 1 hốc trên tường → lưu .idf → mở lại → hốc còn nguyên (ops sống trong Doc,
 * xem `Base.ops` model.ts) VÀ sửa được kích thước hốc (sửa `w`/`h`/`heightMm` của CHÍNH cutter —
 * một `RectEntity` bình thường trong Doc, sửa được bằng công cụ 2D CAD sẵn có, không cần UI mới).
 */

/** Tham số hốc/khối cắt — toạ độ world (mm), CÙNG hệ với `wall.points`. `heightMm` thiếu = tràn
 * hết cao tường (xem `cutterPositionsMm`, `lib/three/cad-to-obj.ts` — cutter không tự suy cao độ
 * ở tầng này, THUẦN data, không đụng `docToObjScene`). */
export interface CutHoleOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  heightMm?: number;
  /** layer của cutter — mặc định lấy đúng layer của tường (cùng nhóm hiện/ẩn/khoá). */
  layer?: string;
}

/**
 * Khoét/hợp/giao 1 khối vào `wall` — tạo CUTTER (`RectEntity` MỚI, entity thật trong CÙNG Doc,
 * K1: không type hình học riêng cho "khối cắt") rồi thêm 1 bậc `{op:'boolean', kind, withRef}`
 * vào `wall.ops` (NC-12 §4.2). THUẦN (không đụng store/React, không tính hình học 3D — đó là
 * việc của tầng ba.js `lib/three/build-ops.ts` lúc render) — nơi gọi (`useCadStore.cutHoleInWall`)
 * chịu trách nhiệm ghi 2 entity này vào Doc + 1 snapshot undo, cùng khuôn mọi hàm khác trong file.
 */
export function cutHoleInWall(
  wall: Entity,
  opts: CutHoleOpts,
  kind: 'union' | 'subtract' | 'intersect' = 'subtract',
): { cutter: Entity; updatedWall: Entity } {
  const cutter: Entity = {
    id: newId('cutter'),
    type: 'rect',
    layer: opts.layer ?? wall.layer,
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    ...(opts.heightMm !== undefined ? { heightMm: opts.heightMm } : {}),
  };
  const updatedWall: Entity = {
    ...wall,
    ops: [...(wall.ops ?? []), { op: 'boolean', kind, withRef: cutter.id }],
  };
  return { cutter, updatedWall };
}

/* ───────────────────────── BEVEL — vát cạnh trên (NC-12 §4.2 tầng ③ "extrude", SPEC-DUNG-BO-LENH-3D) ─────────────────────────
 * Nghiệm thu: vát cạnh 1 tường đang chọn → lưu .idf → mở lại → còn nguyên (bậc `extrude` sống
 * trong `ops`, `lib/three/cad-to-obj.ts` `ObjBuilder.prismBeveled` đọc lại). bevelMm<=0 XOÁ bậc
 * `extrude` khỏi `ops` (tắt vát cạnh) thay vì để lại rác `bevel:0` — cùng luật "sửa tham số ở bậc
 * nào cũng chỉ 1 thao tác" đã ghi ở `cutHoleInWall`.
 */

/** Đặt/xoá bậc `{op:'extrude', bevel}` trên `entity` — GIỮ NGUYÊN mọi bậc khác trong `ops` (chỉ
 * thay đúng 1 bậc `extrude`, đúng khuôn "modifier stack" NC-12 §4.2: mỗi loại bậc chỉ 1 lần,
 * gọi lại là SỬA chứ không cộng dồn — khác `cutHoleInWall` cố ý CỘNG DỒN nhiều bậc `boolean`).
 * `h` lưu THAM KHẢO cao hiện tại của entity lúc đặt (không phải nguồn đọc lại — nguồn đọc lại
 * dựng hình vẫn là `entity.heightMm`, xem docstring `Base.ops`), tránh field bắt buộc rỗng vô nghĩa. */
export function setEntityBevel(entity: Entity, bevelMm: number): Entity {
  const rest = (entity.ops ?? []).filter((op) => op.op !== 'extrude');
  if (bevelMm <= 0) return { ...entity, ops: rest.length ? rest : undefined };
  return { ...entity, ops: [...rest, { op: 'extrude', h: entity.heightMm ?? 2700, bevel: bevelMm }] };
}

/* ───────────────────────── ARRAY LINEAR — nhân bản dãy (NC-12 §4.2 tầng ④ "modifier") ─────────────────────────
 * Nghiệm thu: áp mảng lên 1 cột/tường mẫu → lưu .idf → mở lại → còn nguyên N bản (ops sống trong
 * Doc — hình học nhân bản CHỈ tính ở tầng ba.js lúc render, `lib/three/build-ops.ts`
 * `resolveGroupGeometry`, KHÔNG ghi N entity rời vào Doc — đúng "LƯU THAM SỐ, KHÔNG BAO GIỜ lưu
 * mesh" đã ghi ở `Base.ops`).
 */
export interface ArrayLinearOpts {
  n: number;
  dx: number;
  dy: number;
  dz: number;
}

/** Đặt/xoá bậc `{op:'arrayLinear'}` trên `entity` — cùng luật SỬA-tại-chỗ như `setEntityBevel`
 * (không cộng dồn nhiều bậc arrayLinear). `n<=1` = tắt mảng (xoá bậc), tránh "mảng 1 bản" vô nghĩa. */
export function setEntityArrayLinear(entity: Entity, opts: ArrayLinearOpts): Entity {
  const rest = (entity.ops ?? []).filter((op) => op.op !== 'arrayLinear');
  if (opts.n <= 1) return { ...entity, ops: rest.length ? rest : undefined };
  return {
    ...entity,
    ops: [...rest, { op: 'arrayLinear', n: Math.round(opts.n), dx: opts.dx, dy: opts.dy, dz: opts.dz }],
  };
}

/**
 * "Lan can" mẫu (nút tầng ⑥ Command3DPanel) — dựng 1 CỘT (`wallSegment` vuông postSizeMm ×
 * postSizeMm, TÁI DÙNG đúng engine tường, không viết hình học mới) rồi gắn bậc `arrayLinear` nhân
 * bản dọc `a→b`, đúng ví dụ "nan chớp/song sắt lặp" đã ghi ở `Base.ops` (model.ts). Trả về ĐÚNG 2
 * entity như `wallSegment` (hatch dựng hình + polyline biên) — hatch mang `heightMm`/`ops`, không
 * sinh N entity rời (luật LƯU THAM SỐ ở trên).
 *
 * CHƯA CÓ tay vịn ngang nối các cột — tường/hatch hôm nay LUÔN đùn từ sàn z=0 (`cad-to-obj.ts`
 * `wallHatches.forEach` hardcode z0=0), chưa có cơ chế đặt khối NỔI ở cao độ giữa không (khác
 * cutter dùng `elevationMm` — đó chỉ áp cho vai trò CẮT, không áp cho khối DỰNG). Ghi rõ ở đây để
 * phiên sau không tưởng lầm là đã đủ bộ (§9 "không giấu ô trống") — việc tay vịn để dành đợt sau.
 */
export function railingPosts(
  a: { x: number; y: number },
  b: { x: number; y: number },
  count: number,
  spacingMm: number,
  postSizeMm: number,
  heightMm: number,
  layer: string,
): Entity[] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const half = postSizeMm / 2;
  const post = wallSegment(
    { x: a.x - ux * half, y: a.y - uy * half },
    { x: a.x + ux * half, y: a.y + uy * half },
    postSizeMm,
    layer,
  );
  return post.map((e) =>
    e.type === 'hatch'
      ? { ...e, heightMm, ops: [{ op: 'arrayLinear' as const, n: count, dx: ux * spacingMm, dy: uy * spacingMm, dz: 0 }] }
      : e,
  );
}
