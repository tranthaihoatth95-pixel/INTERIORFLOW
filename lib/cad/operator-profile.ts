/**
 * lib/cad/operator-profile.ts — PHA 1 ML "Gu Engine" (nhóm LÀM NGAY tất định).
 *
 * PHÂN LOẠI OPERATOR TYPE của 1 mặt bằng CAD bằng HEURISTIC CÓ TRỌNG SỐ (L0+L1, 0 key/GPU,
 * 100% tất định — cùng input luôn ra cùng nhãn). Bám mục 1 của docs/ML-GU-ENGINE-PROPOSAL.md:
 *   "Operator classifier = heuristic có trọng số từ block inventory × room set × text tokens
 *    → softmax → nhãn + độ tin. Vector CAD cho tín hiệu SẠCH nên KHÔNG cần model."
 *
 * FILE MỚI, ĐỌC-ONLY với code cũ: chỉ IMPORT type `Doc`/`Entity` (model.ts) + `RuleGroup`/
 * `BUILTIN_GROUPS` (standards/registry.ts) để TRA tên nhóm rule — KHÔNG sửa registry, KHÔNG sửa
 * checker, KHÔNG đụng solver/ai-assist. Muốn cắm vào luồng: xem HOOK ở cuối docstring dưới.
 *
 * Đầu vào linh hoạt: 1 `Doc` (rút block + text tự động) HOẶC block inventory + tập phòng + text
 * rời (khi mới có mô tả ngôn ngữ, chưa dựng Doc). Đầu ra `{operator, confidence, evidence[]}` +
 * danh sách id nhóm rule nên áp cho operator đó.
 */

import type { Doc, Entity } from './model';
import type { RuleGroup } from './standards/registry';
import { BUILTIN_GROUPS } from './standards/registry';
import { findRoomLabels } from './standards/checker';
// CHỈ import type (bị xoá khi compile) — gu-features import HÀM classifyOperator từ file này,
// nên import ngược chiều phải là type-only để không tạo chu trình runtime.
import type { LayoutTypology } from './gu-features';

/* ═══════════════════════ NHÃN & KIỂU ═══════════════════════ */

/** Loại vận hành không gian (proposal §1a). `residential` gộp nhà ở/homestay/host. */
export type OperatorType =
  | 'residential'
  | 'office'
  | 'f&b'
  | 'retail'
  | 'hospitality'
  | 'clinic'
  | 'generic';

/** Danh mục công năng của 1 block (rút gọn từ id block furniture.ts hoặc id thư viện .dxf). */
export type BlockCategory = 'bed' | 'desk' | 'dining' | 'kitchen' | 'sofa' | 'sanitary' | 'other';

export interface OperatorEvidence {
  /** loại tín hiệu: 'block' | 'room' | 'text' | 'layout' (typology từ gu-features — Sprint 2) */
  signal: 'block' | 'room' | 'text' | 'layout';
  /** operator được tín hiệu này cộng điểm */
  operator: OperatorType;
  weight: number;
  /** mô tả người đọc được, VD "3 bàn làm việc → office" */
  detail: string;
}

export interface OperatorProfile {
  operator: OperatorType;
  /** 0..1 = điểm operator thắng / tổng điểm (dưới ngưỡng nên coi là "phỏng đoán"). */
  confidence: number;
  /** điểm thô mỗi operator (giải thích được, không chuẩn hoá). */
  scores: Record<OperatorType, number>;
  evidence: OperatorEvidence[];
  /** id các nhóm rule trong registry NÊN áp cho operator này (đọc BUILTIN_GROUPS, không sửa). */
  ruleGroupIds: string[];
}

/** Đầu vào linh hoạt — truyền `doc` để tự rút, hoặc truyền rời từng mảnh. */
export interface OperatorInput {
  /** Doc đã parse (rút block-inventory + text-token tự động). */
  doc?: Doc;
  /** block id có mặt (key furniture.ts hoặc id .dxf thư viện) — mảng hoặc map đếm số lượng. */
  blocks?: string[] | Record<string, number>;
  /** phòng có mặt: RoomFunction ('bedroom'|'office'|…) hoặc nhãn tiếng Việt ('phòng ngủ'…). */
  rooms?: string[];
  /** text tự do: tên file + mô tả người dùng + nội dung TEXT/MTEXT. */
  text?: string;
  /** TÍN HIỆU BỔ SUNG (Sprint 2, additive): typology bố cục từ lib/cad/gu-features.ts.
   *  KHÔNG truyền = hành vi phân loại y hệt cũ (không đổi 1 điểm số nào). */
  typology?: LayoutTypology;
}

/* ═══════════════════════ BẢNG TRA (dữ liệu, không hardcode con số quy chuẩn) ═══════════════════════ */

/** operator → nhóm rule (id trong registry). Chỉ TRA tên nhóm, không định nghĩa lại rule.
 *
 * 'neufert' (QA D2): nhóm nhân trắc/tiện dụng Neufert (lưu thông, bếp, tủ áo, chỗ ngồi ăn,
 * khổ cửa, trần phòng ở — xem neufert.ts) gắn cho các operator CÓ KHÔNG GIAN Ở/SINH HOẠT:
 *   - residential + hospitality: giường/tủ áo/bếp/chỗ ăn là lõi của rule set → khớp trực tiếp.
 *   - office: rule lưu thông 1-2 người (750/1400mm) áp cho lối đi giữa cụm bàn — thứ mà
 *     intl-egress (thoát nạn PCCC) KHÔNG phủ; pantry văn phòng dùng được rule bếp.
 *   - f&b/retail/clinic: KHÔNG gắn — lưu thông ở đó do quy chuẩn thoát nạn/ngành chi phối,
 *     các rule Neufert còn lại (tủ áo, worktop gia đình, trần phòng Ở) không đúng bản chất. */
const OPERATOR_RULE_GROUPS: Record<OperatorType, string[]> = {
  residential: ['vn-residential', 'vn-fire', 'iso-drafting', 'neufert'],
  office: ['vn-fire', 'intl-egress', 'iso-drafting', 'neufert'],
  'f&b': ['vn-fire', 'intl-egress', 'iso-drafting'],
  retail: ['vn-fire', 'intl-egress', 'iso-drafting'],
  hospitality: ['vn-residential', 'vn-fire', 'intl-egress', 'iso-drafting', 'neufert'],
  clinic: ['vn-fire', 'intl-egress', 'iso-drafting'],
  generic: ['iso-drafting'],
};

/** Từ khoá text (đã lowercase) → operator, VI + EN. Cụm dài để trước cụm ngắn. */
const TEXT_KEYWORDS: [string, OperatorType][] = [
  // office
  ['coworking', 'office'], ['co-working', 'office'], ['văn phòng', 'office'], ['workstation', 'office'],
  ['phòng họp', 'office'], ['meeting room', 'office'], ['open office', 'office'], ['office', 'office'],
  ['làm việc', 'office'], ['pantry văn phòng', 'office'],
  // f&b
  ['nhà hàng', 'f&b'], ['restaurant', 'f&b'], ['coffee', 'f&b'], ['café', 'f&b'], ['cafe', 'f&b'],
  ['quán ăn', 'f&b'], ['ẩm thực', 'f&b'], ['bếp công nghiệp', 'f&b'], ['dining hall', 'f&b'],
  ['bar', 'f&b'], ['bistro', 'f&b'], ['canteen', 'f&b'], ['căng tin', 'f&b'], ['f&b', 'f&b'],
  // retail
  ['showroom', 'retail'], ['cửa hàng', 'retail'], ['gian hàng', 'retail'], ['trưng bày', 'retail'],
  ['boutique', 'retail'], ['retail', 'retail'], ['shop', 'retail'], ['quầy thu ngân', 'retail'],
  ['store', 'retail'],
  // hospitality
  ['khách sạn', 'hospitality'], ['resort', 'hospitality'], ['hotel', 'hospitality'],
  ['lounge', 'hospitality'], ['lobby', 'hospitality'], ['sảnh', 'hospitality'], ['lễ tân', 'hospitality'],
  ['reception', 'hospitality'], ['suite', 'hospitality'], ['homestay', 'hospitality'],
  // clinic
  ['phòng khám', 'clinic'], ['nha khoa', 'clinic'], ['dental', 'clinic'], ['phòng mổ', 'clinic'],
  ['clinic', 'clinic'], ['y tế', 'clinic'], ['bệnh viện', 'clinic'], ['treatment', 'clinic'],
  ['phòng điều trị', 'clinic'],
  // residential
  ['căn hộ', 'residential'], ['chung cư', 'residential'], ['biệt thự', 'residential'],
  ['nhà phố', 'residential'], ['penthouse', 'residential'], ['duplex', 'residential'],
  ['apartment', 'residential'], ['villa', 'residential'], ['nhà ở', 'residential'],
  ['residential', 'residential'], ['phòng ngủ', 'residential'],
];

/** nhãn phòng (RoomFunction hoặc VN) → [operator, weight]. */
const ROOM_AFFINITY: [string, [OperatorType, number][]][] = [
  ['bedroom', [['residential', 1.4], ['hospitality', 1.1]]],
  ['phòng ngủ', [['residential', 1.4], ['hospitality', 1.1]]],
  ['office', [['office', 1.6]]],
  ['làm việc', [['office', 1.6]]],
  ['dining', [['f&b', 1.0], ['residential', 0.5]]],
  ['phòng ăn', [['f&b', 1.0], ['residential', 0.5]]],
  ['kitchen', [['f&b', 0.9], ['residential', 0.5]]],
  ['bếp', [['f&b', 0.9], ['residential', 0.5]]],
  ['living', [['residential', 0.9], ['hospitality', 0.4]]],
  ['phòng khách', [['residential', 0.9], ['hospitality', 0.4]]],
];

/** typology bố cục (gu-features) → [operator, weight]. Trọng số NHỎ HƠN block/room — bố cục là
 *  tín hiệu phụ trợ (open-plan có thể là văn phòng LẪN căn hộ studio), không được lật tín hiệu
 *  nội thất thật. Additive: chỉ chạy khi caller truyền `typology`. */
const TYPOLOGY_AFFINITY: Record<LayoutTypology, [OperatorType, number][]> = {
  cellular: [['residential', 1.2], ['hospitality', 0.8]], // chia nhiều phòng kín — nhà ở / dãy phòng khách sạn
  'open-plan': [['office', 1.2], ['retail', 0.5]], // sàn mở — open office / sàn trưng bày
  linear: [['hospitality', 0.7], ['office', 0.4]], // tuyến dài — hành lang phòng / dãy bàn
  perimeter: [['retail', 1.0], ['office', 0.3]], // kệ/quầy bám chu vi — cửa hàng
  island: [['f&b', 1.0], ['retail', 0.5]], // cụm đảo giữa sàn — đảo bếp/quầy bar
};

/* ═══════════════════════ RÚT ĐẶC TRƯNG (L0/L1) ═══════════════════════ */

/** Phân loại 1 block id (furniture.ts key HOẶC id .dxf thư viện) về danh mục công năng. */
export function blockCategory(id: string): BlockCategory {
  const s = id.toLowerCase();
  if (/bed|giuong|giường|phong-ngu/.test(s)) return 'bed';
  if (/desk|ban-lam-viec|ban-hoc|workstation/.test(s)) return 'desk';
  if (/dining|ban-an|phong-an/.test(s)) return 'dining';
  if (/kitchen|bep|\bbếp\b/.test(s)) return 'kitchen';
  if (/sofa|armchair|couch|phong-khach/.test(s)) return 'sofa';
  if (/toilet|lavabo|bathtub|wc|ve-sinh|basin|urinal/.test(s)) return 'sanitary';
  return 'other';
}

/** Chuẩn hoá blocks (mảng hoặc map) → map đếm số lượng. */
function toCountMap(blocks?: string[] | Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  if (!blocks) return out;
  if (Array.isArray(blocks)) {
    for (const id of blocks) out[id] = (out[id] ?? 0) + 1;
  } else {
    for (const [id, n] of Object.entries(blocks)) out[id] = (out[id] ?? 0) + (Number.isFinite(n) ? n : 0);
  }
  return out;
}

/** Rút block-inventory + text + ROOM-SET từ 1 Doc (đọc-only).
 *
 * ROOM-SET (QA D1): tái dùng `findRoomLabels` của checker (nhãn TEXT toàn-hoa + dò biên
 * findHatchBoundary — CHỈ import hatch.ts qua checker, không sửa). Chỉ nhận phòng có BIÊN KÍN
 * (areaM2 !== null) làm tín hiệu 'room' — nhãn không dò được biên vẫn góp mặt trong `text`
 * (mọi TEXT đều được join) nên không mất tín hiệu, chỉ không được cộng thêm trọng số phòng. */
function fromDoc(doc: Doc): { blocks: Record<string, number>; text: string; rooms: string[] } {
  const blocks: Record<string, number> = {};
  const texts: string[] = [];
  for (const e of doc.entities as Entity[]) {
    if (e.type === 'block') blocks[e.block] = (blocks[e.block] ?? 0) + 1;
    else if (e.type === 'text') texts.push(e.text);
  }
  let rooms: string[] = [];
  try {
    rooms = findRoomLabels(doc).filter((r) => r.areaM2 !== null).map((r) => r.name);
  } catch {
    // dò biên lỗi (hình học hở/bẩn) → bỏ tín hiệu room, KHÔNG chặn phân loại (block/text vẫn chạy)
    rooms = [];
  }
  return { blocks, text: texts.join(' '), rooms };
}

/* ═══════════════════════ CHẤM ĐIỂM ═══════════════════════ */

const ALL_OPERATORS: OperatorType[] = ['residential', 'office', 'f&b', 'retail', 'hospitality', 'clinic', 'generic'];

function emptyScores(): Record<OperatorType, number> {
  return { residential: 0, office: 0, 'f&b': 0, retail: 0, hospitality: 0, clinic: 0, generic: 0 };
}

/** Điểm operator theo danh mục block (đã đếm số lượng). Nhiều desk = office rất mạnh; nhiều bàn
 *  ăn + bếp = f&b; giường = nhà ở/khách sạn. Trả cả evidence để giải thích. */
function scoreBlocks(counts: Record<string, number>, scores: Record<OperatorType, number>, ev: OperatorEvidence[]): void {
  const cat: Record<BlockCategory, number> = { bed: 0, desk: 0, dining: 0, kitchen: 0, sofa: 0, sanitary: 0, other: 0 };
  for (const [id, n] of Object.entries(counts)) cat[blockCategory(id)] += n;

  const add = (op: OperatorType, w: number, detail: string) => {
    scores[op] += w;
    ev.push({ signal: 'block', operator: op, weight: w, detail });
  };

  if (cat.bed > 0) {
    add('residential', 2 * cat.bed, `${cat.bed} giường → nhà ở`);
    add('hospitality', 1 * cat.bed, `${cat.bed} giường → có thể lưu trú`);
  }
  if (cat.desk > 0) {
    const base = 2 * cat.desk;
    const cluster = cat.desk >= 3 ? 3 : 0; // cụm bàn = văn phòng thật
    add('office', base + cluster, `${cat.desk} bàn làm việc${cluster ? ' (cụm ≥3 → open office)' : ''} → office`);
  }
  if (cat.dining > 0) {
    add('f&b', 1.5 * cat.dining + (cat.dining >= 4 ? 3 : 0), `${cat.dining} bàn ăn${cat.dining >= 4 ? ' (≥4 → phục vụ)' : ''} → F&B`);
    add('residential', 0.5 * cat.dining, `${cat.dining} bàn ăn → có thể nhà ở`);
  }
  if (cat.kitchen > 0) {
    add('f&b', 1.2 * cat.kitchen, `${cat.kitchen} bếp → F&B`);
    add('residential', 0.6 * cat.kitchen, `${cat.kitchen} bếp → có thể nhà ở`);
  }
  if (cat.sofa > 0) {
    add('residential', 0.7 * cat.sofa, `${cat.sofa} sofa → sinh hoạt/nhà ở`);
    add('hospitality', 0.5 * cat.sofa, `${cat.sofa} sofa → sảnh/lounge`);
  }
  // sanitary trung tính (mọi loại đều có) — không cộng để tránh nhiễu.
}

function scoreRooms(rooms: string[], scores: Record<OperatorType, number>, ev: OperatorEvidence[]): void {
  for (const raw of rooms) {
    const r = raw.toLowerCase().trim();
    for (const [key, affs] of ROOM_AFFINITY) {
      if (r.includes(key)) {
        for (const [op, w] of affs) {
          scores[op] += w;
          ev.push({ signal: 'room', operator: op, weight: w, detail: `phòng "${raw}" → ${op}` });
        }
        break; // 1 nhãn phòng chỉ khớp 1 lần
      }
    }
  }
}

function scoreText(text: string, scores: Record<OperatorType, number>, ev: OperatorEvidence[]): void {
  const t = text.toLowerCase();
  const seen = new Set<string>();
  for (const [kw, op] of TEXT_KEYWORDS) {
    if (t.includes(kw) && !seen.has(kw)) {
      seen.add(kw);
      const w = 1.5;
      scores[op] += w;
      ev.push({ signal: 'text', operator: op, weight: w, detail: `từ khoá "${kw}" → ${op}` });
    }
  }
}

/** Tín hiệu typology (additive — Sprint 2). Chỉ được gọi khi caller truyền typology. */
function scoreTypology(typo: LayoutTypology, scores: Record<OperatorType, number>, ev: OperatorEvidence[]): void {
  for (const [op, w] of TYPOLOGY_AFFINITY[typo] ?? []) {
    scores[op] += w;
    ev.push({ signal: 'layout', operator: op, weight: w, detail: `bố cục ${typo} → ${op}` });
  }
}

/* ═══════════════════════ HÀM CHÍNH ═══════════════════════ */

/**
 * Phân loại operator từ 1 Doc / block-inventory / phòng / text. TẤT ĐỊNH, 0 key/GPU.
 * Không đủ tín hiệu ⇒ operator='generic', confidence=0 (UI nên ghi "chưa đủ dữ kiện").
 */
export function classifyOperator(input: OperatorInput): OperatorProfile {
  const scores = emptyScores();
  const evidence: OperatorEvidence[] = [];

  // gộp nguồn: doc (nếu có — block + text + ROOM-SET dò biên) + block/room/text rời truyền thẳng
  const docPart = input.doc ? fromDoc(input.doc) : { blocks: {}, text: '', rooms: [] as string[] };
  const counts = { ...docPart.blocks };
  for (const [id, n] of Object.entries(toCountMap(input.blocks))) counts[id] = (counts[id] ?? 0) + n;
  const text = [docPart.text, input.text ?? ''].filter(Boolean).join(' ');
  const rooms = [...docPart.rooms, ...(input.rooms ?? [])];

  scoreBlocks(counts, scores, evidence);
  if (rooms.length) scoreRooms(rooms, scores, evidence);
  if (text.trim()) scoreText(text, scores, evidence);
  if (input.typology) scoreTypology(input.typology, scores, evidence); // additive — thiếu = y cũ

  // argmax tất định theo thứ tự ALL_OPERATORS (bỏ 'generic' khỏi tranh chấp — nó là baseline)
  let best: OperatorType = 'generic';
  let bestScore = 0;
  let total = 0;
  for (const op of ALL_OPERATORS) {
    if (op === 'generic') continue;
    total += scores[op];
    if (scores[op] > bestScore) {
      bestScore = scores[op];
      best = op;
    }
  }

  const confidence = total > 0 ? bestScore / total : 0;
  if (bestScore <= 0) {
    best = 'generic';
    evidence.push({ signal: 'text', operator: 'generic', weight: 0, detail: 'không đủ tín hiệu → generic' });
  }

  return {
    operator: best,
    confidence,
    scores,
    evidence,
    ruleGroupIds: OPERATOR_RULE_GROUPS[best],
  };
}

/**
 * operator → các `RuleGroup` (built-in) nên áp. ĐỌC BUILTIN_GROUPS của registry rồi LỌC theo id;
 * KHÔNG sửa registry. Dùng để nạp đúng bộ rule trước khi đưa vào checker (checker giữ nguyên).
 */
export function rulesForOperator(operator: OperatorType): RuleGroup[] {
  const ids = new Set(OPERATOR_RULE_GROUPS[operator] ?? OPERATOR_RULE_GROUPS.generic);
  return BUILTIN_GROUPS.filter((g) => ids.has(g.id));
}

/** Tra danh sách id nhóm rule cho 1 operator (không cần đọc registry). */
export function ruleGroupIdsForOperator(operator: OperatorType): string[] {
  return OPERATOR_RULE_GROUPS[operator] ?? OPERATOR_RULE_GROUPS.generic;
}
