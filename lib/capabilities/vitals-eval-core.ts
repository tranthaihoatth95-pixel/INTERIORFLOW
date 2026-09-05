/**
 * lib/capabilities/vitals-eval-core.ts — LÕI ĐÁNH GIÁ THIẾT KẾ của Vitals (Slice 12, 03/09).
 *
 * ── VÌ SAO CÓ FILE NÀY (negative evidence, luật B25 NO-REBUILD) ────────────────────────────────
 * Đo trước khi tạo mới (03/09):
 *   · `lib/review/`            — CÓ khung 2 lớp LUẬT/GÓP Ý + adapter 2D/3D/deck. Nhưng `FindingLuat`
 *                                KHÔNG mang độ tin cậy · phiên bản luật · hành động · lý do, và
 *                                KHÔNG có lớp GU (Design DNA / phản hồi người dùng). GIỮ NGUYÊN, ở
 *                                đây CHỈ TRỎ VÀO cùng nguồn luật (checker · export-checks).
 *   · `lib/cad/standards/`     — CÓ 11 bộ luật + `checkStandards()` tất định. KHÔNG chép luật.
 *   · `lib/print/export-checks`— CÓ bộ kiểm CHUAN_DAU_RA (tỷ lệ · khung tên · nhãn đè). TRỎ VÀO.
 *   · `lib/gu/pairwise-perceptron` — CÓ mô hình xếp hạng học từ cặp Nhận/Bỏ, on-device, JSON
 *                                thuần. TÁI DÙNG làm lớp HỌC, không viết mô hình thứ hai.
 *   · `lib/dna/`               — CÓ Thẻ DNA 8 lớp với cờ measured/inferred/verified + nguồn.
 *                                ĐỌC để sinh lớp GU, KHÔNG ghi ngược vào thẻ.
 *   · `lib/capabilities/render-core` — CÓ `bamSceneRev` (băm nội dung). TÁI DÙNG để băm Doc.
 * ⇒ Thứ DUY NHẤT chưa tồn tại: (1) một BẢN GHI ĐÁNH GIÁ thống nhất mà mỗi phát hiện mang đủ
 *   bằng chứng · độ tin cậy · luật/mô hình/phiên bản · mức · hành động lùi được · lý do, và
 *   TÁCH RÕ ba lớp; (2) đường học từ phản hồi Nhận/Bỏ + Thẻ DNA mà KHÔNG ghi đè nguồn sự thật;
 *   (3) khuôn bản ghi huấn luyện/đánh giá trung lập nhà cung cấp, lưu local-first.
 *
 * ── BA LỚP, TÁCH BẰNG KIỂU (không tách bằng lời dặn — cùng kỷ luật `lib/review/types.ts`) ────
 *   `deterministic` — máy đo, tất định, dẫn được nguồn. LỚP DUY NHẤT được mang `severity`.
 *   `learned`       — mô hình học từ phản hồi. Chỉ XẾP THỨ TỰ + gắn nhãn, KHÔNG có mức đỏ/vàng.
 *   `taste`         — gu dự án (Thẻ DNA) / gu người dùng. Là QUAN SÁT, không bao giờ là "sai".
 *   `ai`            — góp ý mô hình ngôn ngữ (tuỳ chọn, thay được). Không có mức, không chặn.
 * Muốn gắn mức đỏ cho một quan sát gu thì phải sửa kiểu này trước — và diff đó sẽ bị soi.
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ────────────────────────────────────────────────────────────────────────
 *  ① Không có đường nào ghi vào `Doc` / Thẻ DNA. Mọi hàm nhận input, trả object MỚI.
 *  ② Lớp học KHÔNG được vùi phát hiện `error` của lớp máy đo: `rankFindings` ghim `error` lên
 *    đầu bất kể trọng số (có test đối kháng).
 *  ③ Không có `Date`/`Math.random` trong đường sinh phát hiện — id + nội dung tất định; thời
 *    điểm chỉ vào BẢN GHI qua tham số `now` do nơi gọi truyền.
 *  ④ Không bịa độ tin cậy 1.0 cho luật `verified:false` — mang `chuaKiemChung`, confidence < 1.
 *
 * File THUẦN: import tương đối, không React/DOM/fetch — test bằng sucrase-node.
 */

import type { Doc, Entity, PaperKey, PaperOrientation, Pt } from '../cad/model';
import { defaultPaperOrientation } from '../cad/model';
import { checkStandards, findRoomLabels } from '../cad/standards/checker';
import type { Violation } from '../cad/standards/checker';
import { getAllRules } from '../cad/standards/registry';
import type { Severity, StandardCategory } from '../cad/standards/registry';
import { buildChuanDauRaChecks } from '../print/export-checks';
import type { DesignDnaCard } from '../dna/types';
import type { TrangThaiNguon } from '../distill/types';
import { PairwisePerceptron, type FeatureVector, type PerceptronState } from '../gu/pairwise-perceptron';
import { bamSceneRev } from './render-core';

/* ═══════════════════════════════ ① KIỂU ═══════════════════════════════ */

/** Phiên bản LÕI — đổi khi cách sinh phát hiện đổi (bản ghi cũ đọc lại vẫn biết mình từ đâu). */
export const EVAL_ENGINE_VERSION = '1.0.0';

/** Chín miền đánh giá theo đề bài slice. Mỗi phát hiện thuộc ĐÚNG MỘT miền. */
export type EvalDomain =
  | 'cad-drawing' // chất lượng bản vẽ kỹ thuật (tỷ lệ · khung tên · nhãn · nét)
  | 'spatial-layout' // tỷ lệ không gian / bố trí (diện tích · bề rộng · hình dạng phòng)
  | 'composition' // bố cục
  | 'hierarchy' // thứ bậc thị giác
  | 'color-material' // quan hệ màu / vật liệu
  | 'lighting' // ánh sáng
  | 'render-fidelity' // độ trung thực render
  | 'presentation' // dàn trang / đồ hoạ hồ sơ
  | 'motion'; // liên tục chuyển động / phim

export const EVAL_DOMAINS: readonly EvalDomain[] = [
  'cad-drawing',
  'spatial-layout',
  'composition',
  'hierarchy',
  'color-material',
  'lighting',
  'render-fidelity',
  'presentation',
  'motion',
] as const;

export type EvalLayer = 'deterministic' | 'learned' | 'taste' | 'ai';

/**
 * CƠ SỞ của phát hiện — nói rõ ngưỡng đến từ đâu:
 *  `standard`            — điều khoản/quy chuẩn dẫn được (checker · CHUAN_DAU_RA).
 *  `measured-convention` — SỐ ĐO tất định nhưng NGƯỠNG là thông lệ nghề, KHÔNG phải quy chuẩn
 *                          ⇒ không bao giờ được là `error`.
 *  `preference`          — gu (Thẻ DNA / người dùng). Không có ngưỡng đúng-sai.
 */
export type EvalBasis = 'standard' | 'measured-convention' | 'preference';

export type EvalSeverity = Severity; // 'error' | 'warning' | 'info' — cùng từ vựng checker

export interface EvalEvidence {
  /** id entity/element liên quan — UI chọn/tô sáng được đúng vật. */
  entityIds: string[];
  /** toạ độ world (mm) để zoom tới — chỉ khi đo được. */
  at?: Pt;
  /** số slide (deck) — chỉ chặng Trình chiếu. */
  slide?: number;
  /** số đo/đối chiếu đã dùng — nguyên văn từ máy đo, không làm tròn thêm. */
  metrics?: Record<string, number | string>;
  /** id nguồn Thẻ DNA đã đóng góp (lớp gu) — khớp `DistilledField.nguon`. */
  nguon?: string[];
}

export interface EvalRule {
  /** id ổn định — "đã bỏ qua"/học phản hồi neo vào đây. */
  id: string;
  /** phiên bản của bộ sinh phát hiện (luật hoặc mô hình). */
  version: string;
  /** nguồn dẫn được (điều khoản · bảng ngưỡng · thẻ DNA · tên mô hình). */
  source: string;
}

/** Hành động đề xuất — LUÔN lùi được. `reversible: true` là literal: không có chỗ khai false. */
export type EvalActionKind = 'select' | 'focus' | 'ask-vitals' | 'none';
export interface EvalAction {
  kind: EvalActionKind;
  label: [string, string];
  reversible: true;
}

interface EvalFindingBase {
  /** id tất định: `${layer}:${rule.id}:${neo}` — cùng Doc ra cùng id. */
  id: string;
  domain: EvalDomain;
  basis: EvalBasis;
  rule: EvalRule;
  /** 0..1. Lớp máy đo: 1 khi luật đã kiểm chứng, <1 khi `chuaKiemChung` hoặc ngưỡng thông lệ. */
  confidence: number;
  /** câu quan sát cụ thể — có số đo, có đối tượng. */
  moTa: string;
  /** VÌ SAO — nguồn ngưỡng + cách hiểu, để người dùng cãi được. */
  why: string;
  evidence: EvalEvidence;
  action: EvalAction;
  /** cách sửa cụ thể nếu có (từ checker/CHUAN_DAU_RA) — chỉ mô tả, KHÔNG tự sửa. */
  cachSua?: string;
  /** số liệu luật chưa đối chiếu bản gốc (`StandardRule.verified=false`). */
  chuaKiemChung?: boolean;
}

/** LỚP MÁY ĐO — lớp DUY NHẤT có `severity`. */
export interface EvalFindingDeterministic extends EvalFindingBase {
  layer: 'deterministic';
  basis: 'standard' | 'measured-convention';
  severity: EvalSeverity;
}

/** LỚP GU — quan sát về gu dự án/người dùng. KHÔNG có severity, KHÔNG có cờ chặn. */
export interface EvalFindingTaste extends EvalFindingBase {
  layer: 'taste';
  basis: 'preference';
  /** trạng thái nguồn Thẻ DNA đã dùng — người dùng biết đang so với thứ máy suy hay người ký. */
  trangThaiNguon: TrangThaiNguon;
}

/** LỚP HỌC — nhãn/thứ tự do mô hình phản hồi sinh ra. KHÔNG severity. */
export interface EvalFindingLearned extends EvalFindingBase {
  layer: 'learned';
  basis: 'preference';
  model: EvalModel;
}

/** LỚP AI — góp ý mô hình ngôn ngữ, tuỳ chọn/thay được. KHÔNG severity. */
export interface EvalFindingAi extends EvalFindingBase {
  layer: 'ai';
  basis: 'preference';
  model: EvalModel;
}

export type EvalFinding = EvalFindingDeterministic | EvalFindingTaste | EvalFindingLearned | EvalFindingAi;

export interface EvalModel {
  name: string;
  version: string;
  /** 'on-device' cho perceptron; tên provider cho AI (nvidia/ollama/…) — trung lập, chuỗi mở. */
  provider: string;
}

/* ═══════════════════════ ② BẢN GHI ĐÁNH GIÁ (trung lập nhà cung cấp) ═══════════════════════ */

export type EvalVerdict = 'accept' | 'reject';

export interface EvalFeedback {
  findingId: string;
  verdict: EvalVerdict;
  /** ISO — do nơi gọi truyền, không đọc đồng hồ trong lõi. */
  at: string;
  /** chép lại để bản ghi tự đủ khi finding bị cắt khỏi danh sách (huấn luyện offline). */
  ruleId: string;
  layer: EvalLayer;
  domain: EvalDomain;
}

export interface EvalSubject {
  kind: 'cad-doc';
  /** băm nội dung Doc lúc đánh giá — bản ghi cũ tự thành CŨ khi Doc đổi. */
  hash: string;
  projectId: string | null;
  entityCount: number;
}

/**
 * MỘT lượt đánh giá = một bản ghi. Đây là khuôn huấn luyện/đánh giá: JSON thuần, không tham chiếu
 * provider nào, không chứa Doc (chỉ băm) ⇒ lưu local-first (IndexedDB qua sheets-persist) hoặc
 * xuất tệp đều được. `feedback` là NHÃN người dùng — nguồn học duy nhất, không suy ra từ im lặng.
 */
export interface EvalRecord {
  version: 1;
  id: string;
  createdAt: string;
  stage: 'concept' | 'render' | 'present';
  subject: EvalSubject;
  engine: { name: 'vitals-eval-core'; version: string };
  /** thẻ DNA đã dùng cho lớp gu — null khi không có (lớp gu bị chặn có lý do). */
  dna: { cardId: string; name: string; updatedAt: string } | null;
  /** lý do lớp gu không chạy — không im lặng. */
  tasteBiChan?: string;
  findings: EvalFinding[];
  feedback: EvalFeedback[];
}

/* ═══════════════════════════ ③ LỚP MÁY ĐO — CAD 2D ═══════════════════════════ */

export interface EvalCadOptions {
  paper?: PaperKey;
  orientation?: PaperOrientation;
  /** mốc thời gian bộ quy chuẩn (T2 rule-effective-date) — truyền thẳng cho checker. */
  asOfDate?: string | null;
}

const CATEGORY_DOMAIN: Record<StandardCategory, EvalDomain> = {
  'room-size': 'spatial-layout',
  clearance: 'spatial-layout',
  'door-window': 'spatial-layout',
  egress: 'spatial-layout',
  'corridor-stair': 'spatial-layout',
  drafting: 'cad-drawing',
  other: 'cad-drawing',
};

/** Độ tin cậy lớp máy đo khi luật CHƯA đối chiếu bản gốc — cố ý dưới 1, hiện rõ cho người dùng. */
export const CONFIDENCE_CHUA_KIEM_CHUNG = 0.6;
/** Độ tin cậy cho ngưỡng THÔNG LỆ (số đo đúng, ngưỡng là quy ước nghề). */
export const CONFIDENCE_THONG_LE = 0.7;

const ACTION_NONE: EvalAction = { kind: 'none', label: ['Chỉ ghi nhận', 'Note only'], reversible: true };
const ACTION_SELECT: EvalAction = { kind: 'select', label: ['Chọn trên bản vẽ', 'Select on drawing'], reversible: true };
const ACTION_FOCUS: EvalAction = { kind: 'focus', label: ['Nhìn tới vị trí', 'Go to location'], reversible: true };

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function violationToFinding(v: Violation, ordinal: number): EvalFindingDeterministic {
  const neo = v.entityId ?? `#${ordinal}`;
  const domain = CATEGORY_DOMAIN[(v.category as StandardCategory) ?? 'other'] ?? 'cad-drawing';
  return {
    id: `deterministic:${v.ruleId}:${neo}`,
    layer: 'deterministic',
    domain,
    basis: 'standard',
    severity: v.severity,
    rule: { id: v.ruleId, version: EVAL_ENGINE_VERSION, source: v.source },
    confidence: v.verified ? 1 : CONFIDENCE_CHUA_KIEM_CHUNG,
    moTa: v.message,
    why: v.verified
      ? `Ngưỡng theo ${v.source} — đo trực tiếp trên hình học bản vẽ.`
      : `Ngưỡng theo ${v.source}, số liệu CHƯA đối chiếu bản gốc — tra lại trước khi dùng cho hồ sơ chính thức.`,
    evidence: {
      entityIds: v.entityId ? [v.entityId] : [],
      ...(v.at ? { at: v.at } : {}),
    },
    action: v.entityId ? ACTION_SELECT : v.at ? ACTION_FOCUS : ACTION_NONE,
    ...(v.verified ? {} : { chuaKiemChung: true }),
  };
}

/** Ánh xạ thông điệp CHUAN_DAU_RA → id luật ổn định (bộ kiểm gốc không trả id). Có test khoá. */
export function chuanDauRaRuleId(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('tỷ lệ') || m.includes('quá lớn')) return 'chuan-dau-ra.ty-le';
  if (m.includes('khung tên')) return 'chuan-dau-ra.khung-ten';
  if (m.includes('nhãn')) return 'chuan-dau-ra.nhan';
  return 'chuan-dau-ra.khac';
}

/** Ngưỡng thông lệ: phòng dài hơn N lần rộng khó bố trí — KHÔNG phải quy chuẩn. */
export const ROOM_ASPECT_CONVENTION = 3;

function bboxAspect(poly: Pt[]): { ratio: number; wMm: number; dMm: number } | null {
  if (poly.length < 3) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const d = maxY - minY;
  const short = Math.min(w, d);
  const long = Math.max(w, d);
  if (short <= 0) return null;
  return { ratio: long / short, wMm: long, dMm: short };
}

/** Entity nào ĐÁNG LẼ phải có vật liệu — cùng vị từ với `lib/ai/doc-context.ts` (hatch + block). */
function needsMaterial(e: Entity): e is Extract<Entity, { type: 'hatch' | 'block' }> {
  return e.type === 'hatch' || e.type === 'block';
}

/** Trần số id đưa vào bằng chứng cho một phát hiện gộp — đủ để chọn, không phình bản ghi. */
export const MAX_EVIDENCE_IDS = 40;

/**
 * ĐÁNH GIÁ CAD 2D — lớp máy đo. Tất định: cùng Doc + opts ⇒ cùng JSON (có test chạy 2 lần).
 * Ba nguồn, xếp theo thứ tự ổn định: quy chuẩn (checker) → chuẩn đầu ra (CHUAN_DAU_RA) →
 * số đo thông lệ (tỷ lệ phòng · vật liệu chưa gán).
 */
export function evaluateCadDoc(doc: Doc, opts: EvalCadOptions = {}): EvalFindingDeterministic[] {
  const out: EvalFindingDeterministic[] = [];
  const entities = Array.isArray(doc.entities) ? doc.entities : [];
  if (entities.length === 0) return out;

  // ① Quy chuẩn — CONNECT checker, không chép luật.
  const violations = checkStandards(doc, getAllRules(), { asOfDate: opts.asOfDate ?? null });
  const perRule = new Map<string, number>();
  for (const v of violations) {
    const n = (perRule.get(v.ruleId) ?? 0) + 1;
    perRule.set(v.ruleId, n);
    out.push(violationToFinding(v, n));
  }

  // ② Chuẩn đầu ra nghề — CONNECT bộ kiểm CHUAN_DAU_RA.
  const paper: PaperKey = opts.paper ?? doc.paperKey ?? 'A3';
  const orientation: PaperOrientation = opts.orientation ?? doc.paperOrientation ?? defaultPaperOrientation(paper);
  const chuan = buildChuanDauRaChecks(doc, paper, orientation);
  const perChuan = new Map<string, number>();
  for (const c of chuan) {
    const ruleId = chuanDauRaRuleId(c.message);
    const n = (perChuan.get(ruleId) ?? 0) + 1;
    perChuan.set(ruleId, n);
    out.push({
      id: `deterministic:${ruleId}:#${n}`,
      layer: 'deterministic',
      domain: 'cad-drawing',
      basis: 'standard',
      severity: c.level === 'error' ? 'error' : 'warning',
      rule: { id: ruleId, version: EVAL_ENGINE_VERSION, source: 'CHUAN-DAU-RA-NGHE §1' },
      confidence: 1,
      moTa: c.message,
      why: `Luật chuẩn đầu ra nghề (docs/CHUAN-DAU-RA-NGHE.md §1) — kiểm trên khổ ${paper} ${orientation === 'landscape' ? 'ngang' : 'dọc'}.`,
      evidence: { entityIds: [], metrics: { paper, orientation } },
      action: ACTION_NONE,
      cachSua: c.fix,
    });
  }

  // ③ Số đo thông lệ — tỷ lệ phòng. Ngưỡng là quy ước nghề ⇒ chỉ 'info', confidence < 1.
  const rooms = findRoomLabels(doc);
  for (const r of rooms) {
    if (!r.poly) continue;
    const a = bboxAspect(r.poly);
    if (!a || a.ratio <= ROOM_ASPECT_CONVENTION) continue;
    const neo = r.labelId ?? `${Math.round(r.at.x)},${Math.round(r.at.y)}`;
    out.push({
      id: `deterministic:proportion.room-aspect:${neo}`,
      layer: 'deterministic',
      domain: 'spatial-layout',
      basis: 'measured-convention',
      severity: 'info',
      rule: { id: 'proportion.room-aspect', version: EVAL_ENGINE_VERSION, source: `Thông lệ nghề: tỷ lệ dài/rộng ≤ ${ROOM_ASPECT_CONVENTION}` },
      confidence: CONFIDENCE_THONG_LE,
      moTa: `Phòng "${r.name}": hình bao ${Math.round(a.wMm)}×${Math.round(a.dMm)}mm, tỷ lệ ${a.ratio.toFixed(1)}:1 — dài hơn ${ROOM_ASPECT_CONVENTION}× rộng.`,
      why: 'Số đo là thật (hình bao biên phòng); ngưỡng 3:1 là thông lệ bố trí, KHÔNG phải quy chuẩn — phòng hành lang/gallery cố ý dài thì bỏ qua là đúng.',
      evidence: {
        entityIds: r.labelId ? [r.labelId] : [],
        at: r.at,
        metrics: { ratio: Math.round(a.ratio * 10) / 10, longMm: Math.round(a.wMm), shortMm: Math.round(a.dMm) },
      },
      action: r.labelId ? ACTION_SELECT : ACTION_FOCUS,
    });
  }

  // ④ Vật liệu chưa gán — số đếm thật, gom thành MỘT phát hiện có danh sách id.
  const missing = entities.filter((e) => needsMaterial(e) && !e.specId);
  if (missing.length > 0) {
    out.push({
      id: 'deterministic:material.unassigned:doc',
      layer: 'deterministic',
      domain: 'color-material',
      basis: 'measured-convention',
      severity: 'info',
      rule: { id: 'material.unassigned', version: EVAL_ENGINE_VERSION, source: 'Đếm entity hatch/block thiếu specId (cùng vị từ lib/ai/doc-context.ts)' },
      confidence: 1,
      moTa: `${missing.length} vùng tô/đồ nội thất chưa gán vật liệu (specId).`,
      why: 'Chưa gán vật liệu thì BOQ và bảng vật liệu không truy được về bản vẽ — đây là thiếu dữ liệu, không phải sai thiết kế.',
      evidence: { entityIds: missing.slice(0, MAX_EVIDENCE_IDS).map((e) => e.id), metrics: { count: missing.length } },
      action: ACTION_SELECT,
    });
  }

  return out;
}

/* ═══════════════════════════ ④ LỚP GU — Thẻ DNA dự án ═══════════════════════════ */

export interface TasteResult {
  findings: EvalFindingTaste[];
  /** lý do lớp gu không chạy — không im lặng (cùng khuôn `gopyBiChan`). */
  biChan?: string;
}

const TRANG_THAI_CONFIDENCE: Record<TrangThaiNguon, number> = {
  verified: 0.9,
  measured: 0.8,
  inferred: 0.5,
};

const DNA_MATERIAL_KEYS_SOURCE = 'Thẻ DNA · lớp vatLieuMatId';

/**
 * So vật liệu bản vẽ với lớp `vatLieuMatId` của Thẻ DNA. CHỈ QUAN SÁT: "thẻ khai X, bản vẽ chưa
 * dùng" / "bản vẽ dùng Y ngoài thẻ". Không có mức đúng-sai; độ tin cậy theo trạng thái nguồn
 * của thẻ (máy suy 0.5 · đo 0.8 · người ký 0.9). Không đọc gì ngoài thẻ và Doc — không đoán gu.
 */
export function evaluateTaste(doc: Doc, card: DesignDnaCard | null): TasteResult {
  if (!card) {
    return {
      findings: [],
      biChan: 'Dự án chưa có Thẻ DNA — lớp gu cần thẻ làm mốc, không có thì máy sẽ tự bịa gu rồi chấm theo nó.',
    };
  }
  const layer = card.layers.vatLieuMatId;
  const wanted = layer.values.map((v) => v.trim()).filter(Boolean);
  if (wanted.length === 0) {
    return { findings: [], biChan: `Thẻ DNA "${card.name}" chưa khai vật liệu (lớp vatLieuMatId trống) — chưa có gì để so.` };
  }
  const entities = Array.isArray(doc.entities) ? doc.entities : [];
  const used = new Map<string, string[]>(); // specId → entityIds
  for (const e of entities) {
    if (!needsMaterial(e) || !e.specId) continue;
    const list = used.get(e.specId) ?? [];
    list.push(e.id);
    used.set(e.specId, list);
  }
  const conf = TRANG_THAI_CONFIDENCE[layer.trangThai];
  const findings: EvalFindingTaste[] = [];
  for (const m of wanted) {
    if (used.has(m)) continue;
    findings.push({
      id: `taste:dna.material-not-used:${m}`,
      layer: 'taste',
      domain: 'color-material',
      basis: 'preference',
      trangThaiNguon: layer.trangThai,
      rule: { id: 'dna.material-not-used', version: EVAL_ENGINE_VERSION, source: `${DNA_MATERIAL_KEYS_SOURCE} "${card.name}"` },
      confidence: conf,
      moTa: `Thẻ DNA "${card.name}" khai vật liệu "${m}" — bản vẽ chưa dùng.`,
      why: 'Đây là gu đã ghi của dự án, không phải luật. Bỏ qua nếu phương án này cố ý đi khác thẻ.',
      evidence: { entityIds: [], nguon: [...layer.nguon] },
      action: ACTION_NONE,
    });
  }
  for (const [specId, ids] of used) {
    if (wanted.includes(specId)) continue;
    findings.push({
      id: `taste:dna.material-outside-card:${specId}`,
      layer: 'taste',
      domain: 'color-material',
      basis: 'preference',
      trangThaiNguon: layer.trangThai,
      rule: { id: 'dna.material-outside-card', version: EVAL_ENGINE_VERSION, source: `${DNA_MATERIAL_KEYS_SOURCE} "${card.name}"` },
      confidence: conf,
      moTa: `Bản vẽ dùng vật liệu "${specId}" (${ids.length} chỗ) không có trong Thẻ DNA "${card.name}".`,
      why: 'Quan sát để người thiết kế quyết: thêm vào thẻ, hoặc giữ nguyên vì là chủ ý.',
      evidence: { entityIds: ids.slice(0, MAX_EVIDENCE_IDS), nguon: [...layer.nguon] },
      action: ACTION_SELECT,
    });
  }
  return { findings };
}

/* ═══════════════════════════ ⑤ LỚP HỌC — perceptron cặp Nhận/Bỏ ═══════════════════════════ */

export const EVAL_MODEL: EvalModel = { name: 'vitals-eval-pairwise', version: '1', provider: 'on-device' };

/** Khoá localStorage của trạng thái mô hình (JSON `PerceptronState` — trung lập, xuất/nhập được). */
export const EVAL_MODEL_STORAGE_KEY = 'interiorflow.vitals.eval-model.v1';

const SEV_WEIGHT: Record<EvalSeverity, number> = { error: 1, warning: 0.66, info: 0.33 };

/**
 * Vector đặc trưng THƯA của một phát hiện — mọi giá trị trong [0,1] (thang đo perceptron).
 * Quy ước tên theo `lib/gu/feature-dict.ts` (namespace chấm, one-hot hậu tố ':').
 */
export function findingFeatures(f: EvalFinding): FeatureVector {
  const v: FeatureVector = {
    [`domain:${f.domain}`]: 1,
    [`layer:${f.layer}`]: 1,
    [`rule:${f.rule.id}`]: 1,
    [`basis:${f.basis}`]: 1,
    'eval.conf': clamp01(f.confidence),
  };
  if (f.layer === 'deterministic') v[`sev:${f.severity}`] = 1;
  if (f.chuaKiemChung) v['eval.chuaKiemChung'] = 1;
  return v;
}

/** Điểm heuristic (khi mô hình chưa đủ cặp) — mức nặng trước, rồi độ tin cậy. */
export function findingHeuristic(f: EvalFinding): number {
  const sev = f.layer === 'deterministic' ? SEV_WEIGHT[f.severity] : 0.2;
  return sev + clamp01(f.confidence) * 0.1;
}

/**
 * XẾP THỨ TỰ phát hiện. Luật ②: `error` của lớp máy đo GHIM ĐẦU theo thứ tự sinh ra — mô hình
 * chỉ được xếp phần còn lại. Người dùng bỏ 100 lần một lỗi quy chuẩn thì nó vẫn đứng đầu; thứ
 * họ được quyền là bấm "Bỏ", không phải làm nó biến mất.
 */
export function rankFindings(findings: readonly EvalFinding[], model: PairwisePerceptron): EvalFinding[] {
  const errors = findings.filter((f) => f.layer === 'deterministic' && f.severity === 'error');
  const rest = findings.filter((f) => !(f.layer === 'deterministic' && f.severity === 'error'));
  return [...errors, ...model.rank([...rest], findingFeatures, findingHeuristic)];
}

/**
 * HỌC từ bản ghi: mỗi (accept, reject) trong CÙNG bản ghi là một cặp thứ hạng. Chỉ học từ nhãn
 * người dùng ghi rõ — im lặng không phải nhãn. Trả số cặp đã cho mô hình ăn. Không mutate record.
 */
export function learnFromRecord(model: PairwisePerceptron, record: EvalRecord): number {
  const byId = new Map(record.findings.map((f) => [f.id, f] as const));
  const acc = record.feedback.filter((fb) => fb.verdict === 'accept').map((fb) => byId.get(fb.findingId)).filter((x): x is EvalFinding => !!x);
  const rej = record.feedback.filter((fb) => fb.verdict === 'reject').map((fb) => byId.get(fb.findingId)).filter((x): x is EvalFinding => !!x);
  let n = 0;
  for (const a of acc) {
    for (const r of rej) {
      model.update(findingFeatures(a), findingFeatures(r));
      n += 1;
    }
  }
  return n;
}

/**
 * HỌC PHẦN MỚI khi vừa ghi MỘT phản hồi: chỉ các cặp có mặt phản hồi đó (accept mới × mọi
 * reject cũ, hoặc mọi accept cũ × reject mới). Dùng ở UI để không cho mô hình ăn lại cặp cũ
 * mỗi lần bấm. Trả số cặp. Không mutate record.
 */
export function learnDelta(model: PairwisePerceptron, record: EvalRecord, findingId: string): number {
  const fb = record.feedback.find((x) => x.findingId === findingId);
  const f = record.findings.find((x) => x.id === findingId);
  if (!fb || !f) return 0;
  const byId = new Map(record.findings.map((x) => [x.id, x] as const));
  const others = record.feedback
    .filter((x) => x.findingId !== findingId && x.verdict !== fb.verdict)
    .map((x) => byId.get(x.findingId))
    .filter((x): x is EvalFinding => !!x);
  let n = 0;
  for (const o of others) {
    if (fb.verdict === 'accept') model.update(findingFeatures(f), findingFeatures(o));
    else model.update(findingFeatures(o), findingFeatures(f));
    n += 1;
  }
  return n;
}

export function modelFromState(json: string | null | undefined): PairwisePerceptron {
  return PairwisePerceptron.deserialize(json);
}

export function modelState(model: PairwisePerceptron): PerceptronState {
  return model.toState();
}

/* ═══════════════════════════ ⑥ LỚP AI — tuỳ chọn, thay được ═══════════════════════════ */

/**
 * Hợp đồng bộ góp ý AI: nhận ngữ cảnh, trả phát hiện lớp `ai`. Lõi KHÔNG gọi provider nào —
 * nơi cắm (route/adapter) tự chọn nvidia/ollama/CLI. `null` = tắt AI, mọi thứ khác vẫn chạy.
 */
export type AiCritic = (ctx: { record: EvalRecord; summary: string }) => Promise<EvalFindingAi[]>;

/**
 * Chuẩn hoá đầu ra AI: bỏ mọi mục thiếu id/moTa, ép layer/basis đúng, KHÔNG cho mang severity
 * (kiểu đã cấm; đây là rào runtime cho dữ liệu đến từ ngoài). Không bịa thêm mục nào.
 */
export function sanitizeAiFindings(raw: unknown, model: EvalModel): EvalFindingAi[] {
  if (!Array.isArray(raw)) return [];
  const out: EvalFindingAi[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const r = x as Record<string, unknown>;
    const moTa = typeof r.moTa === 'string' ? r.moTa.trim() : '';
    const ruleId = typeof r.ruleId === 'string' && r.ruleId.trim() ? r.ruleId.trim() : 'ai.observation';
    if (!moTa) continue;
    const domain = (EVAL_DOMAINS as readonly string[]).includes(String(r.domain)) ? (r.domain as EvalDomain) : 'composition';
    const conf = typeof r.confidence === 'number' && Number.isFinite(r.confidence) ? clamp01(r.confidence) : 0.5;
    const ids = Array.isArray(r.entityIds) ? r.entityIds.filter((s): s is string => typeof s === 'string').slice(0, MAX_EVIDENCE_IDS) : [];
    out.push({
      id: `ai:${ruleId}:${out.length + 1}`,
      layer: 'ai',
      domain,
      basis: 'preference',
      model,
      rule: { id: ruleId, version: model.version, source: `${model.name} (${model.provider})` },
      confidence: conf,
      moTa,
      why: typeof r.why === 'string' && r.why.trim() ? r.why.trim() : 'Góp ý của mô hình ngôn ngữ — xác suất, mỗi lần một khác; không chặn gì.',
      evidence: { entityIds: ids },
      action: ids.length ? ACTION_SELECT : ACTION_NONE,
    });
  }
  return out;
}

/* ═══════════════════════════ ⑦ BẢN GHI: dựng · phản hồi · tóm tắt ═══════════════════════════ */

export function hashDoc(doc: Doc): string {
  return bamSceneRev(doc);
}

export interface BuildRecordInput {
  doc: Doc;
  stage: EvalRecord['stage'];
  projectId: string | null;
  card: DesignDnaCard | null;
  model: PairwisePerceptron;
  /** ISO — nơi gọi truyền (UI: new Date().toISOString(); test: hằng). */
  now: string;
  cadOptions?: EvalCadOptions;
  /** phát hiện AI đã sanitize (tuỳ chọn). */
  aiFindings?: EvalFindingAi[];
}

/** id bản ghi tất định theo (băm Doc, thời điểm) — không random. */
export function recordId(hash: string, now: string): string {
  return `eval_${hash}_${now.replace(/[^0-9]/g, '').slice(0, 14)}`;
}

export function buildEvalRecord(input: BuildRecordInput): EvalRecord {
  const det = evaluateCadDoc(input.doc, input.cadOptions);
  const taste = evaluateTaste(input.doc, input.card);
  const all: EvalFinding[] = [...det, ...taste.findings, ...(input.aiFindings ?? [])];
  const hash = hashDoc(input.doc);
  return {
    version: 1,
    id: recordId(hash, input.now),
    createdAt: input.now,
    stage: input.stage,
    subject: { kind: 'cad-doc', hash, projectId: input.projectId, entityCount: Array.isArray(input.doc.entities) ? input.doc.entities.length : 0 },
    engine: { name: 'vitals-eval-core', version: EVAL_ENGINE_VERSION },
    dna: input.card ? { cardId: input.card.id, name: input.card.name, updatedAt: input.card.updatedAt } : null,
    ...(taste.biChan ? { tasteBiChan: taste.biChan } : {}),
    findings: rankFindings(all, input.model),
    feedback: [],
  };
}

/**
 * Ghi phản hồi — trả BẢN GHI MỚI (không mutate). Cùng finding bấm lại thì THAY, không nhân đôi.
 * findingId lạ ⇒ trả nguyên bản ghi (không bịa nhãn cho thứ không tồn tại).
 */
export function applyFeedback(record: EvalRecord, findingId: string, verdict: EvalVerdict, at: string): EvalRecord {
  const f = record.findings.find((x) => x.id === findingId);
  if (!f) return record;
  const fb: EvalFeedback = { findingId, verdict, at, ruleId: f.rule.id, layer: f.layer, domain: f.domain };
  const rest = record.feedback.filter((x) => x.findingId !== findingId);
  return { ...record, feedback: [...rest, fb] };
}

export function verdictOf(record: EvalRecord, findingId: string): EvalVerdict | null {
  return record.feedback.find((x) => x.findingId === findingId)?.verdict ?? null;
}

/** Bản ghi còn khớp Doc hiện tại không? Doc đổi ⇒ CŨ (chỉ đánh dấu, không tự chạy lại). */
export function isRecordStale(record: EvalRecord, doc: Doc): boolean {
  return record.subject.hash !== hashDoc(doc);
}

/** Trần bản ghi giữ lại mỗi dự án (local-first, không phình IDB). Cũ nhất rơi trước. */
export const MAX_RECORDS_PER_PROJECT = 20;

export function mergeRecordIntoList(list: readonly EvalRecord[], record: EvalRecord): EvalRecord[] {
  const others = list.filter((r) => r.id !== record.id);
  const merged = [...others, record].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  return merged.slice(-MAX_RECORDS_PER_PROJECT);
}

/** Kiểm tối thiểu bản ghi đọc từ đĩa/IDB — dữ liệu ngoài không tin mù. */
export function isEvalRecord(x: unknown): x is EvalRecord {
  if (!x || typeof x !== 'object') return false;
  const r = x as Record<string, unknown>;
  if (r.version !== 1 || typeof r.id !== 'string' || typeof r.createdAt !== 'string') return false;
  if (!Array.isArray(r.findings) || !Array.isArray(r.feedback)) return false;
  const s = r.subject as Record<string, unknown> | undefined;
  if (!s || s.kind !== 'cad-doc' || typeof s.hash !== 'string') return false;
  return r.findings.every((f) => {
    const g = f as Record<string, unknown>;
    return typeof g.id === 'string' && typeof g.layer === 'string' && typeof g.moTa === 'string' && !!g.rule;
  });
}

/** Đếm theo lớp/mức — nguồn thật cho chấm trạng thái Vitals + dòng tóm tắt. */
export function summarizeRecord(record: EvalRecord): {
  errors: number;
  warnings: number;
  infos: number;
  taste: number;
  learned: number;
  ai: number;
  total: number;
} {
  let errors = 0, warnings = 0, infos = 0, taste = 0, learned = 0, ai = 0;
  for (const f of record.findings) {
    if (f.layer === 'deterministic') {
      if (f.severity === 'error') errors += 1;
      else if (f.severity === 'warning') warnings += 1;
      else infos += 1;
    } else if (f.layer === 'taste') taste += 1;
    else if (f.layer === 'learned') learned += 1;
    else ai += 1;
  }
  return { errors, warnings, infos, taste, learned, ai, total: record.findings.length };
}

/**
 * Khối chữ để HỎI Vitals về kết quả (đường AI tuỳ chọn qua chat sẵn có). Chỉ chuyển NGUYÊN VĂN
 * số đo + nguồn — không thêm số, không thêm kết luận. Trần dòng để không phình prompt.
 */
export const MAX_SUMMARY_LINES = 12;

export function summaryForVitals(record: EvalRecord): string {
  const s = summarizeRecord(record);
  const lines: string[] = [];
  lines.push(`Kết quả đánh giá máy (${record.engine.name} v${record.engine.version}): ${s.errors} lỗi · ${s.warnings} cảnh báo · ${s.infos} ghi nhận · ${s.taste} quan sát gu.`);
  for (const f of record.findings.slice(0, MAX_SUMMARY_LINES)) {
    const tag = f.layer === 'deterministic' ? `[${f.severity}]` : `[${f.layer}]`;
    lines.push(`${tag} ${f.moTa} (nguồn: ${f.rule.source}; tin cậy ${Math.round(f.confidence * 100)}%)`);
  }
  if (record.findings.length > MAX_SUMMARY_LINES) lines.push(`… và ${record.findings.length - MAX_SUMMARY_LINES} mục khác.`);
  if (record.tasteBiChan) lines.push(`Lớp gu: ${record.tasteBiChan}`);
  lines.push('Hãy diễn giải các mục trên cho tôi theo thứ tự nên sửa trước. Không thêm số đo mới.');
  return lines.join('\n');
}
