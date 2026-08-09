/**
 * lib/present-editor/pptx-import.ts — ĐỌC file `.pptx` (PowerPoint) THÀNH slide của chặng
 * Trình chiếu. Mở khoá nút "Mở deck (.pptx)" ở `components/present-editor/Toolbar.tsx`
 * (trước 09/08 là nút xám, `disabled: true`).
 *
 * MỨC ĐỘ ĐÃ CHỐT (Hoà, 09/08): **mỗi slide .pptx → 1 slide IF gồm ẢNH nhúng giữ nguyên +
 * hộp CHỮ thành TextElement**. Không bắt chước PowerPoint 100% — đích đến là "nhập được rồi
 * SỬA TIẾP TRONG IF", đúng luật nền §7② (đích đến phải sửa được, không phải file chết).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * CÁCH LÀM — vì sao không kéo thêm thư viện
 * `.pptx` là file ZIP chứa XML (OOXML). Repo đã có `jszip` và đã có TIỀN LỆ tự dựng/đọc OOXML
 * bằng chuỗi + jszip, không thêm gói: `lib/boq/xlsx.ts` (dựng .xlsx) và `lib/pptx-zip-fonts.ts`
 * (vá .pptx). File này đi tiếp con đường đó theo CHIỀU NGƯỢC LẠI (đọc vào).
 *
 * ⚠️ KHÔNG dùng `DOMParser`: nó chỉ có trong trình duyệt, mà test của repo chạy bằng
 * `sucrase-node` (Node 20 không có `DOMParser` toàn cục — đo 09/08). Nên file này mang theo một
 * BỘ ĐỌC XML TỐI GIẢN (`parseXml`, ~90 dòng) chạy giống hệt ở Node lẫn trình duyệt ⇒ thứ chạy
 * trong test ĐÚNG BẰNG thứ chạy trong app, không phải hai đường khác nhau.
 *
 * ĐƠN VỊ — OOXML dùng EMU (English Metric Unit), IF dùng % sân khấu:
 *   · 914400 EMU = 1 inch · 12700 EMU = 1 pt (điểm chữ) · 60000 = 1 độ (thuộc tính `rot`).
 *   · `Frame.x/y/w/h` (model.ts) = **% sân khấu** ⇒ `x% = off.x / sldSz.cx × 100` (dọc theo cy).
 *     Nhờ vậy nhập xong đổi khổ trình bày (16:9 → A4…) vẫn đúng, % không đổi nghĩa.
 *   · `TextElement.fontSize` = **% CHIỀU CAO sân khấu** (model.ts:324) ⇒ cỡ chữ pptx `sz`
 *     (đơn vị 1/100 pt) quy đổi: `fontSize% = (sz/100) / (cy/12700) × 100`.
 *     Kiểm nhanh: slide 16:9 chuẩn cy = 6.858.000 EMU = 540pt; chữ 18pt → 3,33% → ở 1080px là
 *     36px = đúng 18pt × 2px/pt. Khớp.
 *
 * ẢNH NHÚNG — đi ĐÚNG đường đã có, không mở đường thứ hai: đọc `ppt/media/*` ra **dataURL** rồi
 * `makeImage(dataURL)`, y hệt lúc người dùng tự tải ảnh lên (`Toolbar.onFile` →
 * `FileReader.readAsDataURL` → `onAddImageUrl`). KHÔNG gán `assetId` — `LinkedAsset` (model.ts
 * §PS-3) là để NHIỀU element dùng CHUNG một nguồn sửa-một-nơi-đổi-mọi-nơi; ảnh nhập từ pptx là
 * ảnh rời, không có nguồn sống nào đứng sau, gán bừa chỉ đẻ registry rác.
 *
 * BỀN VỚI FILE HỎNG (yêu cầu của phiếu): slide nào XML hỏng / lạ quá thì ghi vào `warnings`
 * ("slide N: …") và **BỎ QUA ĐÚNG SLIDE ĐÓ**, các slide còn lại vẫn vào. Chỉ ném lỗi khi cả
 * FILE không mở được (không phải ZIP / thiếu `ppt/presentation.xml`).
 *
 * ⛔ GIỚI HẠN THẬT — nói trước cho khỏi tưởng bở (KHÔNG đọc được, sẽ mất khi nhập):
 *   · SmartArt, biểu đồ (chart), bảng (table), OLE nhúng → đều nằm trong `p:graphicFrame`;
 *     chúng được ĐẾM và báo trong `warnings`, không dựng lại.
 *   · Animation / transition / timing: bỏ hẳn (phiếu chốt không cần).
 *   · Hình khối vẽ (`prstGeom` rect/ellipse/…): CHỈ lấy phần CHỮ bên trong, không dựng lại nền
 *     hình/đường viền → chưa map sang `ShapeElement`.
 *   · Nền slide: chỉ lấy màu đặc (`a:srgbClr`); nền gradient/ảnh/kế thừa theme → nền trắng.
 *   · Màu chữ theo THEME (`a:schemeClr` như `tx1`, `accent1`) không tra bảng theme → dùng màu
 *     mực mặc định của IF; chỉ `a:srgbClr` (mã hex thật) mới lấy đúng.
 *   · Ảnh định dạng `.emf/.wmf` (metafile của Windows) trình duyệt không hiển thị được → bỏ
 *     qua kèm cảnh báo.
 *   · Chữ nghệ thuật / hiệu ứng chữ (WordArt) chỉ còn phần chữ trơn.
 */

import JSZip from 'jszip';
import {
  makeImage,
  makeText,
  newId,
  type EditorSlide,
  type Frame,
  type ListStyle,
  type SlideElement,
  type TextAlign,
} from './model';

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ①  BỘ ĐỌC XML TỐI GIẢN (không phụ thuộc DOM, chạy cả Node lẫn trình duyệt)
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/** Một nút XML đã đọc. `name` đã BỎ tiền tố namespace (`a:t` → `t`) cho dễ tra. */
export interface XmlNode {
  /** tên cục bộ, không tiền tố — vd `t`, `off`, `spTree`. */
  name: string;
  /** tên đầy đủ như trong file — vd `a:t`, `p:spTree`. */
  qname: string;
  /** thuộc tính theo tên ĐẦY ĐỦ (`r:embed`, `x`, `sz`…). Tra bằng `attr()` để khỏi lo tiền tố. */
  attrs: Record<string, string>;
  children: XmlNode[];
  /** phần chữ trực tiếp bên trong nút (đã giải mã thực thể `&amp;`…). */
  text: string;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Giải mã thực thể XML — gồm cả dạng số `&#10;` / `&#x1F600;`. */
export function decodeXmlEntities(s: string): string {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body] ?? whole;
  });
}

/** Vị trí dấu `>` đóng thẻ, BỎ QUA dấu `>` nằm trong giá trị thuộc tính có nháy. */
function findTagEnd(src: string, from: number): number {
  let quote = '';
  for (let i = from; i < src.length; i += 1) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = '';
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '>') return i;
  }
  return -1;
}

const ATTR_RE = /([^\s=/<>]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

function parseTagBody(body: string): { qname: string; attrs: Record<string, string> } {
  const m = /^([^\s/>]+)/.exec(body);
  const qname = m ? m[1] : '';
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = m ? m[0].length : 0;
  let a: RegExpExecArray | null;
  while ((a = ATTR_RE.exec(body))) {
    attrs[a[1]] = decodeXmlEntities(a[3] !== undefined ? a[3] : a[4] ?? '');
  }
  return { qname, attrs };
}

function localName(qname: string): string {
  const i = qname.indexOf(':');
  return i < 0 ? qname : qname.slice(i + 1);
}

/**
 * Đọc chuỗi XML thành cây. Chỉ xử lý đúng phần OOXML cần: thẻ mở/đóng/tự đóng, thuộc tính,
 * chữ, CDATA; bỏ qua khai báo `<?xml?>`, DOCTYPE và chú thích. Thẻ đóng lệch tên thì đóng tới
 * nút khớp gần nhất (dễ dãi có chủ ý — file thật đôi khi lệch, không đáng đánh rơi cả slide).
 * Ném lỗi khi thẻ không bao giờ đóng ngoặc `>` (dấu hiệu file cắt cụt/hỏng thật).
 */
export function parseXml(src: string): XmlNode {
  const root: XmlNode = { name: '#document', qname: '#document', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) {
      stack[stack.length - 1].text += decodeXmlEntities(src.slice(i));
      break;
    }
    if (lt > i) stack[stack.length - 1].text += decodeXmlEntities(src.slice(i, lt));

    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt);
      i = end < 0 ? src.length : end + 3;
      continue;
    }
    if (src.startsWith('<![CDATA[', lt)) {
      const end = src.indexOf(']]>', lt);
      stack[stack.length - 1].text += src.slice(lt + 9, end < 0 ? src.length : end);
      i = end < 0 ? src.length : end + 3;
      continue;
    }
    if (src.startsWith('<?', lt) || src.startsWith('<!', lt)) {
      const end = src.indexOf('>', lt);
      i = end < 0 ? src.length : end + 1;
      continue;
    }

    const gt = findTagEnd(src, lt + 1);
    if (gt < 0) throw new Error('XML hỏng: có thẻ không đóng ngoặc');
    const raw = src.slice(lt + 1, gt);

    if (raw[0] === '/') {
      const close = localName(raw.slice(1).trim());
      for (let d = stack.length - 1; d > 0; d -= 1) {
        if (stack[d].name === close) {
          stack.length = d;
          break;
        }
      }
      i = gt + 1;
      continue;
    }

    const selfClose = raw.endsWith('/');
    const { qname, attrs } = parseTagBody(selfClose ? raw.slice(0, -1) : raw);
    if (!qname) {
      i = gt + 1;
      continue;
    }
    const node: XmlNode = { name: localName(qname), qname, attrs, children: [], text: '' };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
    i = gt + 1;
  }
  return root;
}

/** Thuộc tính theo tên cục bộ — `attr(n,'embed')` bắt được cả `r:embed`. */
export function attr(node: XmlNode | null | undefined, name: string): string | undefined {
  if (!node) return undefined;
  if (node.attrs[name] !== undefined) return node.attrs[name];
  for (const k of Object.keys(node.attrs)) if (localName(k) === name) return node.attrs[k];
  return undefined;
}

/** Con TRỰC TIẾP theo tên cục bộ. */
export function kids(node: XmlNode | null | undefined, name: string): XmlNode[] {
  if (!node) return [];
  return node.children.filter((c) => c.name === name);
}

export function kid(node: XmlNode | null | undefined, name: string): XmlNode | null {
  if (!node) return null;
  return node.children.find((c) => c.name === name) ?? null;
}

/** Con cháu ĐẦU TIÊN theo tên cục bộ (duyệt theo chiều sâu, theo thứ tự tài liệu). */
export function descend(node: XmlNode | null | undefined, name: string): XmlNode | null {
  if (!node) return null;
  for (const c of node.children) {
    if (c.name === name) return c;
    const deep = descend(c, name);
    if (deep) return deep;
  }
  return null;
}

/** Gom TOÀN BỘ chữ trong nhánh (dùng cho `<a:t>` lồng trong `<a:fld>`…). */
function deepText(node: XmlNode): string {
  let s = node.text;
  for (const c of node.children) s += deepText(c);
  return s;
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ②  ĐƠN VỊ + KIỂU DỮ LIỆU CHUNG
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/** 1 pt = 12700 EMU. */
export const EMU_PER_POINT = 12700;
/** 1 inch = 914400 EMU. */
export const EMU_PER_INCH = 914400;
/** Khổ 16:9 mặc định của PowerPoint hiện đại (13.333in × 7.5in) — dùng khi file thiếu `p:sldSz`. */
export const DEFAULT_SLIDE_CX = 12192000;
export const DEFAULT_SLIDE_CY = 6858000;

/** EMU → % của một chiều sân khấu. `total<=0` (file lạ) → 0 thay vì NaN/Infinity. */
export function emuToPct(emu: number, total: number): number {
  if (!Number.isFinite(emu) || !Number.isFinite(total) || total <= 0) return 0;
  return +((emu / total) * 100).toFixed(4);
}

/**
 * Cỡ chữ OOXML (`sz`, đơn vị 1/100 pt) → `TextElement.fontSize` (% chiều CAO sân khấu).
 * Xem phần "ĐƠN VỊ" ở đầu file. Thiếu `sz` → caller tự dùng `DEFAULT_FONT_SZ`.
 */
export function szToFontSizePct(sz: number, slideCy: number): number {
  const heightPt = slideCy / EMU_PER_POINT;
  if (!Number.isFinite(sz) || sz <= 0 || heightPt <= 0) return 0;
  return +(((sz / 100) / heightPt) * 100).toFixed(4);
}

/** Cỡ chữ mặc định của PowerPoint khi hộp chữ không khai `sz` (18pt). */
export const DEFAULT_FONT_SZ = 1800;

function num(v: string | undefined, fallback = 0): number {
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Khung hình học thô đọc từ `<a:xfrm>` — vẫn theo EMU, chưa quy đổi %. */
interface RawXfrm {
  x: number;
  y: number;
  cx: number;
  cy: number;
  /** độ (đã chia 60000). */
  rot: number;
}

/** Phép biến đổi từ hệ toạ độ của nhóm (`p:grpSp`) về hệ toạ độ slide. */
interface GroupTf {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
}

const IDENTITY_TF: GroupTf = { ox: 0, oy: 0, sx: 1, sy: 1 };

function readXfrm(x: XmlNode | null): RawXfrm | null {
  if (!x) return null;
  const off = kid(x, 'off');
  const ext = kid(x, 'ext');
  if (!off || !ext) return null;
  const cx = num(attr(ext, 'cx'));
  const cy = num(attr(ext, 'cy'));
  if (cx <= 0 || cy <= 0) return null;
  return { x: num(attr(off, 'x')), y: num(attr(off, 'y')), cx, cy, rot: num(attr(x, 'rot')) / 60000 };
}

/** Nối phép biến đổi của nhóm cha với `<a:xfrm>` của chính nhóm (có `chOff`/`chExt`). */
function composeGroupTf(parent: GroupTf, grpXfrm: XmlNode | null): GroupTf {
  const self = readXfrm(grpXfrm);
  if (!self) return parent;
  const chOff = kid(grpXfrm, 'chOff');
  const chExt = kid(grpXfrm, 'chExt');
  const cox = num(attr(chOff, 'x'));
  const coy = num(attr(chOff, 'y'));
  const ccx = num(attr(chExt, 'cx'), self.cx) || self.cx;
  const ccy = num(attr(chExt, 'cy'), self.cy) || self.cy;
  const sx = self.cx / ccx;
  const sy = self.cy / ccy;
  return {
    ox: parent.ox + (self.x - cox * sx) * parent.sx,
    oy: parent.oy + (self.y - coy * sy) * parent.sy,
    sx: parent.sx * sx,
    sy: parent.sy * sy,
  };
}

function applyTf(r: RawXfrm, tf: GroupTf): RawXfrm {
  if (tf === IDENTITY_TF) return r;
  return { x: tf.ox + r.x * tf.sx, y: tf.oy + r.y * tf.sy, cx: r.cx * tf.sx, cy: r.cy * tf.sy, rot: r.rot };
}

function toFrame(r: RawXfrm, cx: number, cy: number): Frame {
  return {
    x: emuToPct(r.x, cx),
    y: emuToPct(r.y, cy),
    w: Math.max(0.5, emuToPct(r.cx, cx)),
    h: Math.max(0.5, emuToPct(r.cy, cy)),
    rotation: +r.rot.toFixed(2),
  };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ③  ĐỌC MỘT SLIDE (THUẦN — không đụng zip, test được độc lập)
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/** Bối cảnh cần để dựng 1 slide — do lớp zip ở §④ chuẩn bị sẵn. */
export interface SlideBuildContext {
  /** bề rộng sân khấu (EMU) từ `p:sldSz`. */
  cx: number;
  /** chiều cao sân khấu (EMU) từ `p:sldSz`. */
  cy: number;
  /** rId ảnh → dataURL (đã nạp sẵn từ `ppt/media/*`). */
  media: Map<string, string>;
  /** khung placeholder thừa kế từ slideLayout/slideMaster (có thể rỗng). */
  placeholders?: Map<string, RawXfrm>;
}

/** Kết quả dựng 1 slide: slide IF + những thứ đã phải bỏ (để báo cho người dùng). */
export interface SlideBuildResult {
  slide: EditorSlide;
  /** số đối tượng KHÔNG dựng lại được (SmartArt/biểu đồ/bảng/OLE/ảnh metafile). */
  skipped: number;
  /** mô tả ngắn từng loại đã bỏ, gộp lại — vd "biểu đồ/SmartArt/bảng ×2". */
  skippedNote: string;
}

const IF_DEFAULT_INK = '#221f1a';

function hexColorOf(container: XmlNode | null): string | undefined {
  const fill = kid(container, 'solidFill');
  const srgb = kid(fill, 'srgbClr');
  const val = attr(srgb, 'val');
  if (!val || !/^[0-9a-fA-F]{6}$/.test(val)) return undefined; // schemeClr/theme → không đoán
  return `#${val.toLowerCase()}`;
}

function alignOf(pPr: XmlNode | null): TextAlign | undefined {
  const a = attr(pPr, 'algn');
  if (a === 'ctr') return 'center';
  if (a === 'r') return 'right';
  if (a === 'l' || a === 'just' || a === 'dist') return 'left';
  return undefined;
}

function listStyleOf(pPr: XmlNode | null): ListStyle | undefined {
  if (!pPr) return undefined;
  if (kid(pPr, 'buNone')) return 'none';
  if (kid(pPr, 'buAutoNum')) return 'number';
  if (kid(pPr, 'buChar')) return 'bullet';
  return undefined;
}

function lineHeightOf(pPr: XmlNode | null): number | undefined {
  const pct = kid(kid(pPr, 'lnSpc'), 'spcPct');
  const v = num(attr(pct, 'val'), 0);
  if (v <= 0) return undefined;
  return +(v / 100000).toFixed(2);
}

/** Chữ + kiểu dáng rút từ `<p:txBody>`. `text` rỗng = hộp chữ trống, bỏ qua cả hộp. */
interface TextRead {
  text: string;
  sz?: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color?: string;
  align?: TextAlign;
  listStyle?: ListStyle;
  lineHeight?: number;
}

function readTxBody(txBody: XmlNode): TextRead {
  const paras = kids(txBody, 'p');
  const lines: string[] = [];
  let first: XmlNode | null = null; // rPr của run CÓ CHỮ đầu tiên — quyết định kiểu cả hộp
  let firstPPr: XmlNode | null = null;

  for (const p of paras) {
    let line = '';
    for (const c of p.children) {
      if (c.name === 'r' || c.name === 'fld') {
        const t = kids(c, 't').map(deepText).join('');
        if (t) {
          line += t;
          if (!first) {
            first = kid(c, 'rPr');
            firstPPr = kid(p, 'pPr');
          }
        }
      } else if (c.name === 'br') {
        line += '\n';
      }
    }
    lines.push(line);
  }
  // bỏ dòng trống ở hai đầu, giữ dòng trống ở giữa (người dùng cố ý cách dòng)
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  const pPr = firstPPr ?? kid(paras[0] ?? null, 'pPr');
  const sz = num(attr(first, 'sz'), 0);
  return {
    text: lines.join('\n'),
    sz: sz > 0 ? sz : undefined,
    bold: attr(first, 'b') === '1',
    italic: attr(first, 'i') === '1',
    underline: !!attr(first, 'u') && attr(first, 'u') !== 'none',
    color: hexColorOf(first),
    align: alignOf(pPr),
    listStyle: listStyleOf(pPr),
    lineHeight: lineHeightOf(pPr),
  };
}

/** Vai trò IF suy từ loại placeholder PowerPoint (`p:ph@type`). */
function roleOfPh(phType: string | undefined): 'title' | 'kicker' | 'body' | 'free' {
  if (phType === 'title' || phType === 'ctrTitle') return 'title';
  if (phType === 'subTitle') return 'kicker';
  if (phType === 'body' || phType === 'obj' || phType === undefined) return 'body';
  return 'free';
}

/** Khoá tra khung placeholder — xem `resolvePlaceholderXfrm`. */
function phKeys(ph: XmlNode | null): string[] {
  const type = attr(ph, 'type');
  const idx = attr(ph, 'idx');
  const keys: string[] = [];
  if (type && idx) keys.push(`${type}#${idx}`);
  if (idx) keys.push(`i#${idx}`);
  if (type) keys.push(`t#${type}`);
  // 'title' và 'ctrTitle' là hai tên của cùng một ô trên bố cục khác nhau
  if (type === 'title') keys.push('t#ctrTitle');
  if (type === 'ctrTitle') keys.push('t#title');
  if (!type && !idx) keys.push('t#body');
  return keys;
}

/** Gom khung của mọi placeholder trong 1 cây (slideLayout / slideMaster) để slide kế thừa. */
export function collectPlaceholderFrames(root: XmlNode): Map<string, RawXfrm> {
  const out = new Map<string, RawXfrm>();
  const tree = descend(root, 'spTree');
  if (!tree) return out;
  const walk = (node: XmlNode, tf: GroupTf) => {
    for (const c of node.children) {
      if (c.name === 'grpSp') {
        walk(c, composeGroupTf(tf, kid(kid(c, 'grpSpPr'), 'xfrm')));
        continue;
      }
      if (c.name !== 'sp') continue;
      const ph = descend(kid(c, 'nvSpPr'), 'ph');
      const raw = readXfrm(kid(kid(c, 'spPr'), 'xfrm'));
      if (!ph || !raw) continue;
      const abs = applyTf(raw, tf);
      for (const k of phKeys(ph)) if (!out.has(k)) out.set(k, abs);
    }
  };
  walk(tree, IDENTITY_TF);
  return out;
}

function resolvePlaceholderXfrm(ph: XmlNode | null, table: Map<string, RawXfrm> | undefined): RawXfrm | null {
  if (!ph || !table || !table.size) return null;
  for (const k of phKeys(ph)) {
    const hit = table.get(k);
    if (hit) return hit;
  }
  return null;
}

/** Khung chót nếu không nơi nào khai vị trí — xếp theo vai trò, người dùng kéo lại sau. */
function fallbackFrame(role: 'title' | 'kicker' | 'body' | 'free', order: number): RawXfrm {
  const cyUnit = DEFAULT_SLIDE_CY;
  const cxUnit = DEFAULT_SLIDE_CX;
  if (role === 'title') return { x: cxUnit * 0.07, y: cyUnit * 0.08, cx: cxUnit * 0.86, cy: cyUnit * 0.18, rot: 0 };
  if (role === 'kicker') return { x: cxUnit * 0.07, y: cyUnit * 0.28, cx: cxUnit * 0.86, cy: cyUnit * 0.1, rot: 0 };
  const row = Math.min(order, 4);
  return { x: cxUnit * 0.07, y: cyUnit * (0.4 + row * 0.12), cx: cxUnit * 0.86, cy: cyUnit * 0.11, rot: 0 };
}

const NOT_SUPPORTED_LABEL = 'biểu đồ/SmartArt/bảng';

/**
 * Dựng 1 `EditorSlide` từ cây XML của `ppt/slides/slideN.xml`. THUẦN: không đụng zip/DOM/mạng
 * ⇒ test được với XML viết tay. Ném lỗi nếu không tìm thấy `<p:spTree>` (không phải slide).
 */
export function buildSlideFromXml(root: XmlNode, ctx: SlideBuildContext): SlideBuildResult {
  const tree = descend(root, 'spTree');
  if (!tree) throw new Error('không thấy <p:spTree> — không phải slide hợp lệ');

  const elements: SlideElement[] = [];
  let skipped = 0;
  const skippedKinds = new Map<string, number>();
  const noteSkip = (label: string) => {
    skipped += 1;
    skippedKinds.set(label, (skippedKinds.get(label) ?? 0) + 1);
  };
  let textOrder = 0;

  const walk = (node: XmlNode, tf: GroupTf) => {
    for (const c of node.children) {
      switch (c.name) {
        case 'grpSp':
          walk(c, composeGroupTf(tf, kid(kid(c, 'grpSpPr'), 'xfrm')));
          break;

        case 'sp': {
          const txBody = kid(c, 'txBody');
          if (!txBody) break; // hình khối trơn, không chữ → ngoài phạm vi mức đã chốt
          const read = readTxBody(txBody);
          if (!read.text.trim()) break; // placeholder rỗng ("Click to add title") → bỏ
          const ph = descend(kid(c, 'nvSpPr'), 'ph');
          const role = roleOfPh(attr(ph, 'type'));
          const raw =
            readXfrm(kid(kid(c, 'spPr'), 'xfrm')) ??
            resolvePlaceholderXfrm(ph, ctx.placeholders) ??
            fallbackFrame(role, textOrder);
          textOrder += 1;
          const fontSize = szToFontSizePct(read.sz ?? DEFAULT_FONT_SZ, ctx.cy);
          const cName = attr(kid(kid(c, 'nvSpPr'), 'cNvPr'), 'name');
          elements.push(
            makeText({
              text: read.text,
              frame: toFrame(applyTf(raw, tf), ctx.cx, ctx.cy),
              fontSize: fontSize > 0 ? fontSize : 3.33,
              color: read.color ?? IF_DEFAULT_INK,
              // Màu ĐỌC ĐƯỢC từ file là ý người tạo deck → khoá lại, không cho lớp tự-dò-tương-phản
              // (model.ts `colorAuto`) đổi sau lưng. Không đọc được màu thì để hệ tự lo như text mới.
              colorAuto: read.color ? false : undefined,
              align: read.align ?? 'left',
              bold: read.bold,
              italic: read.italic,
              underline: read.underline,
              listStyle: read.listStyle,
              lineHeight: read.lineHeight,
              role,
              name: cName || undefined,
            }),
          );
          break;
        }

        case 'pic': {
          const embed = attr(descend(kid(c, 'blipFill'), 'blip'), 'embed');
          const src = embed ? ctx.media.get(embed) : undefined;
          if (!src) {
            noteSkip('ảnh không đọc được (định dạng .emf/.wmf hoặc thiếu tệp)');
            break;
          }
          const raw = readXfrm(kid(kid(c, 'spPr'), 'xfrm'));
          const frame = raw
            ? toFrame(applyTf(raw, tf), ctx.cx, ctx.cy)
            : { x: 10, y: 10, w: 40, h: 40, rotation: 0 };
          const cName = attr(kid(kid(c, 'nvPicPr'), 'cNvPr'), 'name');
          elements.push(makeImage(src, { frame, name: cName || undefined }));
          break;
        }

        case 'graphicFrame':
          noteSkip(NOT_SUPPORTED_LABEL);
          break;

        default:
          break;
      }
    }
  };
  walk(tree, IDENTITY_TF);

  const bg = hexColorOf(kid(descend(root, 'bg'), 'bgPr')) ?? '#ffffff';
  const slide: EditorSlide = {
    id: newId('sld'),
    background: bg,
    backgroundImage: null,
    elements,
    templateId: 'pptx-import',
  };
  const skippedNote = [...skippedKinds.entries()]
    .map(([label, n]) => (n > 1 ? `${label} ×${n}` : label))
    .join(', ');
  return { slide, skipped, skippedNote };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════
 * ④  LỚP ZIP — mở file, xếp thứ tự slide, nạp ảnh
 * ════════════════════════════════════════════════════════════════════════════════════════ */

/** Bảng quan hệ của MỘT phần (rId → đường dẫn đích, đã tính tương đối). */
export function parseRelsXml(xml: string, baseDir: string): Map<string, string> {
  const out = new Map<string, string>();
  let root: XmlNode;
  try {
    root = parseXml(xml);
  } catch {
    return out;
  }
  const rels = descend(root, 'Relationships');
  for (const r of kids(rels, 'Relationship')) {
    const id = attr(r, 'Id');
    const target = attr(r, 'Target');
    if (!id || !target) continue;
    if (attr(r, 'TargetMode') === 'External') continue; // ảnh liên kết ngoài — không có trong zip
    out.set(id, resolveZipPath(baseDir, target));
  }
  return out;
}

/** Gộp đường dẫn kiểu ZIP (`ppt/slides` + `../media/a.png` → `ppt/media/a.png`). */
export function resolveZipPath(baseDir: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const parts = baseDir.split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

function dirOf(path: string): string {
  const i = path.lastIndexOf('/');
  return i < 0 ? '' : path.slice(0, i);
}

/** Kích thước sân khấu từ `ppt/presentation.xml` (`<p:sldSz cx= cy=>`). */
export function slideSizeFromPresentation(root: XmlNode): { cx: number; cy: number } {
  const sz = descend(root, 'sldSz');
  const cx = num(attr(sz, 'cx'), DEFAULT_SLIDE_CX) || DEFAULT_SLIDE_CX;
  const cy = num(attr(sz, 'cy'), DEFAULT_SLIDE_CY) || DEFAULT_SLIDE_CY;
  return { cx, cy };
}

/**
 * THỨ TỰ slide đúng như trong PowerPoint — theo `<p:sldIdLst>` của `presentation.xml`, KHÔNG
 * theo tên file (slide10.xml có thể đứng trước slide2.xml sau khi người dùng kéo thả sắp lại).
 * Trả về danh sách đường dẫn trong zip.
 */
export function slideOrderFromPresentation(presRoot: XmlNode, presRels: Map<string, string>): string[] {
  const lst = descend(presRoot, 'sldIdLst');
  const out: string[] = [];
  for (const s of kids(lst, 'sldId')) {
    // ⚠️ `<p:sldId id="256" r:id="rId2"/>` có HAI thuộc tính tên "id": `id` là số nội bộ của
    // PowerPoint, `r:id` mới là khoá quan hệ. Lấy đúng `r:id` (chấp nhận tiền tố khác 'r' vì
    // namespace do file tự đặt), KHÔNG dùng `attr(s,'id')` — nó khớp nhầm số nội bộ.
    let relId: string | undefined;
    for (const [k, v] of Object.entries(s.attrs)) {
      if (k.includes(':') && k.endsWith(':id')) relId = v;
    }
    const path = relId ? presRels.get(relId) : undefined;
    if (path) out.push(path);
  }
  return out;
}

const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
};

/** Cảnh báo gắn với MỘT slide (số thứ tự 1-based như người dùng nhìn thấy). */
export interface PptxImportWarning {
  slide: number;
  reason: string;
}

export interface PptxImportResult {
  /** slide dựng được, ĐÚNG thứ tự trong file. */
  slides: EditorSlide[];
  /** tổng số slide có trong file (kể cả slide bỏ qua) — để báo "N/M". */
  total: number;
  warnings: PptxImportWarning[];
}

/**
 * Đọc cả file `.pptx`. Ném lỗi CHỈ khi không mở được file (không phải ZIP / thiếu
 * `ppt/presentation.xml`); slide hỏng lẻ thì vào `warnings` và bỏ qua đúng slide đó.
 */
export async function importPptx(data: ArrayBuffer | Uint8Array | Blob): Promise<PptxImportResult> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data as ArrayBuffer);
  } catch {
    throw new Error('Không mở được tệp — đây không phải file .pptx (ZIP) hợp lệ.');
  }

  const presFile = zip.file('ppt/presentation.xml');
  if (!presFile) throw new Error('Không phải file .pptx hợp lệ — thiếu ppt/presentation.xml.');

  let presRoot: XmlNode;
  try {
    presRoot = parseXml(await presFile.async('string'));
  } catch {
    throw new Error('File .pptx hỏng — không đọc được ppt/presentation.xml.');
  }
  const { cx, cy } = slideSizeFromPresentation(presRoot);

  const presRelsFile = zip.file('ppt/_rels/presentation.xml.rels');
  const presRels = presRelsFile ? parseRelsXml(await presRelsFile.async('string'), 'ppt') : new Map<string, string>();

  let paths = slideOrderFromPresentation(presRoot, presRels).filter((p) => !!zip.file(p));
  if (!paths.length) {
    // Dự phòng: file thiếu sldIdLst/rels → quét thẳng thư mục slides, sắp theo SỐ trong tên.
    paths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => num(/(\d+)\.xml$/.exec(a)?.[1]) - num(/(\d+)\.xml$/.exec(b)?.[1]));
  }

  const slides: EditorSlide[] = [];
  const warnings: PptxImportWarning[] = [];
  /** cache cây layout/master đã đọc (nhiều slide dùng chung 1 bố cục). */
  const phCache = new Map<string, Map<string, RawXfrm>>();

  for (let i = 0; i < paths.length; i += 1) {
    const n = i + 1;
    const path = paths[i];
    try {
      const xml = await zip.file(path)!.async('string');
      const root = parseXml(xml);
      const relsPath = `${dirOf(path)}/_rels/${path.slice(path.lastIndexOf('/') + 1)}.rels`;
      const relsFile = zip.file(relsPath);
      const rels = relsFile ? parseRelsXml(await relsFile.async('string'), dirOf(path)) : new Map<string, string>();

      // ảnh nhúng → dataURL (chỉ nạp thứ thật sự là ảnh trình duyệt hiển thị được)
      const media = new Map<string, string>();
      for (const [rid, target] of rels) {
        const ext = target.slice(target.lastIndexOf('.') + 1).toLowerCase();
        const mime = IMAGE_MIME[ext];
        if (!mime) continue;
        const f = zip.file(target);
        if (!f) continue;
        media.set(rid, `data:${mime};base64,${await f.async('base64')}`);
      }

      // khung placeholder kế thừa: slide → slideLayout → slideMaster
      const placeholders = await loadPlaceholderChain(zip, rels, phCache);

      const built = buildSlideFromXml(root, { cx, cy, media, placeholders });
      slides.push(built.slide);
      if (built.skipped > 0) {
        warnings.push({ slide: n, reason: `bỏ ${built.skipped} đối tượng không đọc được (${built.skippedNote})` });
      }
    } catch (err) {
      warnings.push({
        slide: n,
        reason: `không đọc được, bỏ qua — ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return { slides, total: paths.length, warnings };
}

/** Đọc khung placeholder của slideLayout rồi slideMaster (layout thắng master khi trùng khoá). */
async function loadPlaceholderChain(
  zip: JSZip,
  slideRels: Map<string, string>,
  cache: Map<string, Map<string, RawXfrm>>,
): Promise<Map<string, RawXfrm>> {
  const out = new Map<string, RawXfrm>();
  const layoutPath = [...slideRels.values()].find((p) => /slideLayouts\/[^/]+\.xml$/.test(p));
  if (!layoutPath) return out;

  const layout = await loadPlaceholderFile(zip, layoutPath, cache);
  for (const [k, v] of layout) if (!out.has(k)) out.set(k, v);

  const layoutRelsFile = zip.file(`${dirOf(layoutPath)}/_rels/${layoutPath.slice(layoutPath.lastIndexOf('/') + 1)}.rels`);
  if (!layoutRelsFile) return out;
  const layoutRels = parseRelsXml(await layoutRelsFile.async('string'), dirOf(layoutPath));
  const masterPath = [...layoutRels.values()].find((p) => /slideMasters\/[^/]+\.xml$/.test(p));
  if (!masterPath) return out;
  const master = await loadPlaceholderFile(zip, masterPath, cache);
  for (const [k, v] of master) if (!out.has(k)) out.set(k, v);
  return out;
}

async function loadPlaceholderFile(
  zip: JSZip,
  path: string,
  cache: Map<string, Map<string, RawXfrm>>,
): Promise<Map<string, RawXfrm>> {
  const hit = cache.get(path);
  if (hit) return hit;
  let table = new Map<string, RawXfrm>();
  try {
    const f = zip.file(path);
    if (f) table = collectPlaceholderFrames(parseXml(await f.async('string')));
  } catch {
    table = new Map(); // bố cục hỏng KHÔNG được làm hỏng slide — chỉ mất vị trí thừa kế
  }
  cache.set(path, table);
  return table;
}

/**
 * Câu báo kết quả cho người dùng — 1 nguồn duy nhất để Toolbar và test nói cùng một lời.
 * Có slide bỏ qua thì nói rõ "N/M", không có thì nói gọn.
 */
export function importSummary(fileName: string, res: PptxImportResult): string {
  const failed = res.warnings.filter((w) => w.reason.startsWith('không đọc được'));
  const head =
    failed.length > 0
      ? `Đã nhập ${res.slides.length}/${res.total} slide từ "${fileName}" — bỏ qua slide ${failed
          .map((w) => w.slide)
          .join(', ')}.`
      : `Đã nhập ${res.slides.length} slide từ "${fileName}".`;
  const partial = res.warnings.filter((w) => !w.reason.startsWith('không đọc được'));
  if (!partial.length) return head;
  return `${head} ${partial.length} slide thiếu vài đối tượng (biểu đồ/SmartArt/bảng không nhập được).`;
}
