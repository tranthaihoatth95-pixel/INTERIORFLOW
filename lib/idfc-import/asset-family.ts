/**
 * lib/idfc-import/asset-family.ts — CHUẨN HOÁ MỘT HỌ TÀI SẢN (Slice 8, 09/2026): một danh tính
 * ngữ nghĩa (ghế X của hãng Y / tấm sồi Z) mang NHIỀU CÁCH THỂ HIỆN — nét mặt bằng · mặt bằng
 * màu · mặt đứng/mặt cắt · ảnh xem trước · khối 3D chạy được · hộp bao/va chạm · LOD · bản đồ PBR ·
 * kích thước/spec/liên kết catalog — cộng nguồn gốc + giấy phép ở cấp họ.
 *
 * ── LOOK INSIDE (B25 NO-REBUILD, đo tại nguồn 09/2026) — DÙNG LẠI, KHÔNG VIẾT LẠI ────────────
 *   · Vỏ file: `exportIdfc`/`importIdfc` (lib/cad/idfc.ts, v3) — KHÔNG chế format thứ hai. Phần
 *     mở rộng đi qua khoá `xAssetFamily` (cùng lối `xFromPhoto` đã dùng thật 14/08: importIdfc bỏ
 *     qua khoá lạ, file vẫn mở được ở app hiện tại). Đưa vào ruột chính thức = migration v4,
 *     thuộc lib/cad — NGOÀI vùng phiếu này, khai thẳng.
 *   · Cờ ba nấc `ProvenanceFlag` (from-photo.ts:35) — REUSE, không đẻ bộ từ vựng thứ tư.
 *   · Số liệu mesh: `glbStats` (glb-stats.ts) nay có `bounds` qua node transform.
 *   · Đơn vị/trục: `units-axis.ts` — chỉ báo lệch, KHÔNG tự scale/xoay.
 *   · Pháp lý: `license-gate.ts` — quyết bậc TRƯỚC khi có byte nào được ghi.
 *   · Hàng DB: `AssetRepresentation{kind,payloadRef,truthLevel,provenance}` (schema.prisma:347) —
 *     `toRepresentationRows()` phát đúng shape đó; KHÔNG nhân bản LibraryAsset.
 *   · Đường `BlockEntity`/`BLOCKS` (lib/cad/block-library.ts) KHÔNG đụng — họ tài sản nằm cạnh,
 *     nối qua `.idfc` như mọi mẫu thư viện khác.
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ─────────────────────────────────────────────────────────────────────
 *  ① KHÔNG BỊA SỐ. Chiều nào không có nguồn thì KHÔNG có; số suy từ mesh mang cờ `inferred` +
 *     nguồn `glb:bounds` (mesh có thể sai tỉ lệ — nó là đo FILE, không phải đo VẬT). Chỉ
 *     `measured`/`verified` mới được vào BOQ (Hoà chốt 15/08) — cổng `boqEligibleDims()`.
 *  ② TẤT ĐỊNH. Cùng đầu vào + cùng `now` ⇒ cùng byte JSON, cùng `familyId` (sha256 của bộ danh
 *     tính, không phụ thuộc thời gian). Test khoá.
 *  ③ HỎNG THÌ HIỆN, KHÔNG BIẾN MẤT. Biểu diễn không dựng được vẫn nằm trong danh sách với
 *     `status: 'unsupported' | 'invalid'` + `reason`. `.idfc` không dựng được ⇒ `idfc.ok=false`
 *     + lý do, họ tài sản vẫn trả về đủ phần còn lại.
 *  ④ GỐC BẤT BIẾN. `origin` (hash + URL + tên/mime/bytes gốc) đi nguyên vào `xAssetFamily`; mọi
 *     thứ khác là DẪN XUẤT có ghi `derivedFrom`.
 *  ⑤ HÌNH HỌC NẶNG THEO CHÍNH SÁCH GIẤY PHÉP. `geometryPolicy` của license-gate quyết
 *     biểu diễn 3D/LOD là `ready` (byte được lưu) hay `on-demand` (chỉ con trỏ) hay
 *     `pointer-only` (blocked: không lưu, không tải).
 *
 * THUẦN (không DOM/FS/network; `crypto` chỉ để sha256) — test: asset-family.test.ts.
 */

import { createHash } from 'crypto';
import {
  exportIdfc,
  importIdfc,
  lastImportIdfcError,
  SELLABLE_KINDS,
  type IdfcCommerce,
  type IdfcGeom2d,
  type IdfcKind,
  type ParsedIdfc,
} from '../cad/idfc';
import type { BlockGroup } from '../cad/shared-types';
import type { MaterialPbr } from '../materials/schema';
import type { ProvenanceFlag, ProvenancedValue } from './from-photo';
import { glbStats, type GlbStats } from './glb-stats';
import { decideAcquisition, type AcquisitionDecision, type AssetSourceKind, type LicenseClaim } from './license-gate';
import { checkMeshAgainstDeclared, glbBoundsToMm, validateDimsMm, type BoundsMm, type UnitsIssue } from './units-axis';

/* ═══════════════ TỪ VỰNG BIỂU DIỄN ═══════════════ */

/** Mười cách thể hiện của một họ. Tên nội bộ (kebab) — cột DB dùng bảng `REPRESENTATION_DB_KIND`. */
export type RepresentationKind =
  | 'plan-line'
  | 'plan-color'
  | 'elevation'
  | 'section'
  | 'preview'
  | 'model3d'
  | 'bounds'
  | 'lod'
  | 'pbr'
  | 'spec';

export const REPRESENTATION_KINDS: readonly RepresentationKind[] = [
  'plan-line', 'plan-color', 'elevation', 'section', 'preview', 'model3d', 'bounds', 'lod', 'pbr', 'spec',
];

/**
 * Ánh xạ sang `AssetRepresentation.kind` (chuỗi tự do có chủ đích, schema.prisma:350 khai
 * `plan | elevation | section | model3d | image`). Giữ đúng 5 tên đã khai, thêm 5 tên mới cùng lối.
 */
export const REPRESENTATION_DB_KIND: Record<RepresentationKind, string> = {
  'plan-line': 'plan',
  'plan-color': 'plan-color',
  elevation: 'elevation',
  section: 'section',
  preview: 'image',
  model3d: 'model3d',
  bounds: 'bounds',
  lod: 'lod',
  pbr: 'pbr',
  spec: 'spec',
};

export type RepresentationStatus = 'ready' | 'on-demand' | 'pointer-only' | 'unsupported' | 'invalid';

export interface NormalizedRepresentation {
  kind: RepresentationKind;
  status: RepresentationStatus;
  /** con trỏ nội dung — đường uploads / URL nguồn / `inline:…` cho payload nhỏ nhúng trong .idfc. Rỗng khi unsupported. */
  payloadRef: string;
  truthLevel: ProvenanceFlag;
  /** nguồn gốc cụ thể (URL hãng · `glb:bounds` · `derived:plan-line` …). */
  source: string;
  /** lý do khi status ≠ ready/on-demand — bắt buộc hiện ra cho người. */
  reason?: string;
  /** số liệu kèm (tam giác, kích thước, mức LOD…) — chỉ số đo được từ file, không đoán. */
  meta?: Record<string, number | string | boolean>;
}

/* ═══════════════ ĐẦU VÀO ═══════════════ */

export interface AssetOrigin {
  kind: AssetSourceKind;
  /** URL trang nguồn (hãng/kho mở) — với user-upload có thể trống. */
  url?: string;
  /** sha256 hex của BINARY GỐC (cùng định nghĩa `bamContentHash`) — có thì là trục danh tính mạnh nhất. */
  contentHash?: string;
  originalName?: string;
  originalMime?: string;
  originalBytes?: number;
  retrievedAt?: string; // ISO 8601
}

export interface DeclaredDims {
  wMm?: ProvenancedValue<number>;
  dMm?: ProvenancedValue<number>;
  hMm?: ProvenancedValue<number>;
}

export interface CatalogLink {
  brand?: string;
  sku?: string;
  vendor?: string;
  productUrl?: string;
  /** `ProductSpec.id` (FK mềm, cùng `BlockEntity.specId`) — khi kho đã có bản ghi thương mại. */
  specId?: string;
  /** matId UUID canonical (lib/materials/matid-identity.ts) — chỉ khi đã biết. */
  matId?: string;
}

export interface RefPayload {
  payloadRef: string;
  flag: ProvenanceFlag;
  source: string;
}

export interface Model3dInput {
  payloadRef: string;
  format: 'glb' | 'gltf' | 'obj' | 'fbx' | 'skp' | '3dm' | 'other';
  /** byte GLB để kiểm — có thì kiểm hộp bao/đơn vị; không có thì chỉ giữ con trỏ. */
  glb?: Uint8Array;
  upAxisDeclared?: 'Y' | 'Z';
  flag?: ProvenanceFlag;
  source: string;
}

export interface LodInput {
  level: number;
  payloadRef: string;
  triangles?: number;
  source: string;
}

export interface AssetFamilyCandidate {
  name: string;
  code: string;
  kind: IdfcKind;
  origin: AssetOrigin;
  license: LicenseClaim;
  dims?: DeclaredDims;
  /** nét mặt bằng sẵn có (block 2D) — không có thì suy nét bao từ w×d (cờ inferred). */
  planLine?: { geom2d: IdfcGeom2d; flag: ProvenanceFlag; source: string };
  planColor?: RefPayload;
  elevation?: RefPayload;
  section?: RefPayload;
  preview?: RefPayload & { wPx?: number; hPx?: number };
  model3d?: Model3dInput;
  lod?: LodInput[];
  pbr?: { value: MaterialPbr; flag: ProvenanceFlag; source: string };
  catalog?: CatalogLink;
  commerce?: IdfcCommerce;
  group?: BlockGroup;
  tags?: string[];
}

/* ═══════════════ ĐẦU RA ═══════════════ */

export interface FamilyIssue {
  code: UnitsIssue['code'] | 'idfc-rejected' | 'kind-body-mismatch' | 'glb-unreadable' | 'lod-order' | 'license-blocked';
  level: 'error' | 'warn';
  message: string;
  detail?: Record<string, number | string>;
}

export interface NormalizedAssetFamily {
  /** sha256 tất định của bộ danh tính (nguồn + hash gốc/URL + tên + mã). */
  familyId: string;
  name: string;
  code: string;
  kind: IdfcKind;
  origin: AssetOrigin;
  acquisition: AcquisitionDecision;
  dims: DeclaredDims;
  /** hộp bao (mm) — từ số khai (w/d/h) hoặc từ mesh; `truthLevel` nói nguồn nào. */
  bounds?: { xMm: number; yMm: number; zMm: number; truthLevel: ProvenanceFlag; source: string };
  meshStats?: Omit<GlbStats, 'bounds'> & { boundsMm?: BoundsMm };
  representations: NormalizedRepresentation[];
  issues: FamilyIssue[];
  idfc: { ok: true; json: string; parsed: ParsedIdfc } | { ok: false; reason: string };
}

export interface NormalizeOptions {
  /** ISO 8601 — tiêm để tất định; mặc định `new Date().toISOString()`. */
  now?: string;
  /** dung sai đối chiếu mesh↔số khai (mặc định 5%). */
  tolerance?: number;
}

/* ═══════════════ DANH TÍNH ═══════════════ */

/** Bộ danh tính: nguồn + (hash gốc | URL | tên+mã). Không có thời gian ⇒ tất định. */
export function computeFamilyId(c: Pick<AssetFamilyCandidate, 'origin' | 'name' | 'code'>): string {
  const anchor = c.origin.contentHash
    ? `hash:${c.origin.contentHash.toLowerCase()}`
    : c.origin.url
      ? `url:${c.origin.url.trim()}`
      : `name:${c.name.trim().toLowerCase()}|code:${c.code.trim().toLowerCase()}`;
  return createHash('sha256').update(`${c.origin.kind}|${anchor}`).digest('hex');
}

/* ═══════════════ CỔNG BOQ ═══════════════ */

/** Chỉ chiều `measured`/`verified` mới được BOQ đọc (Hoà 15/08). Trả tập con — không nâng cờ. */
export function boqEligibleDims(d: DeclaredDims): DeclaredDims {
  const out: DeclaredDims = {};
  for (const k of ['wMm', 'dMm', 'hMm'] as const) {
    const v = d[k];
    if (v && (v.flag === 'measured' || v.flag === 'verified')) out[k] = v;
  }
  return out;
}

/* ═══════════════ CHUẨN HOÁ ═══════════════ */

const FLAG_RANK: Record<ProvenanceFlag, number> = { inferred: 0, measured: 1, verified: 2 };
function weakest(flags: ProvenanceFlag[]): ProvenanceFlag {
  return flags.reduce<ProvenanceFlag>((a, b) => (FLAG_RANK[b] < FLAG_RANK[a] ? b : a), 'verified');
}

/**
 * Chuẩn hoá một ứng viên thành họ tài sản. KHÔNG throw — mọi thứ hỏng đi vào `issues` và
 * `status` của từng biểu diễn. Xem luật ①–⑤ ở đầu tệp.
 */
export function normalizeAssetFamily(c: AssetFamilyCandidate, opts: NormalizeOptions = {}): NormalizedAssetFamily {
  const now = opts.now ?? new Date().toISOString();
  const issues: FamilyIssue[] = [];
  const reps: NormalizedRepresentation[] = [];
  const acquisition = decideAcquisition(c.origin.kind, c.license);
  const familyId = computeFamilyId(c);
  const dims: DeclaredDims = { ...(c.dims ?? {}) };

  if (acquisition.tier === 'blocked') {
    issues.push({ code: 'license-blocked', level: 'error', message: acquisition.reasons.join(' ') });
  }

  // ① số khai — kiểm, không điền. Chiều KHÔNG HỢP LỆ (NaN/≤0/ngoài dải) bị GỠ khỏi `dims` (issue
  // giữ dấu vết) và từ đó coi như THIẾU — không để NaN chảy xuống .idfc/BOQ (JSON hoá NaN = null câm).
  for (const iss of validateDimsMm({ wMm: dims.wMm?.value, dMm: dims.dMm?.value, hMm: dims.hMm?.value })) {
    issues.push(iss);
    const k = iss.detail?.dim;
    if (k === 'wMm' || k === 'dMm' || k === 'hMm') delete dims[k];
  }
  const declaredNums = { wMm: dims.wMm?.value, dMm: dims.dMm?.value, hMm: dims.hMm?.value };

  // ② mesh — đọc số thật, đối chiếu, KHÔNG sửa.
  let meshStats: NormalizedAssetFamily['meshStats'];
  let boundsMm: BoundsMm | null = null;
  let meshUsable = false;
  if (c.model3d?.glb) {
    const st = glbStats(c.model3d.glb);
    if (!st) {
      issues.push({ code: 'glb-unreadable', level: 'error', message: 'Byte không phải GLB hợp lệ (magic/chunk JSON hỏng).' });
    } else {
      boundsMm = st.bounds ? glbBoundsToMm(st.bounds) : null;
      const { bounds: _b, ...rest } = st;
      meshStats = { ...rest, ...(boundsMm ? { boundsMm } : {}) };
      if (!boundsMm) {
        issues.push({ code: 'mesh-bounds-missing', level: 'warn', message: 'GLB không khai min/max POSITION — không có hộp bao để kiểm đơn vị.' });
        meshUsable = true; // mesh vẫn dùng được để xem, chỉ không kiểm được kích thước
      } else {
        const meshIssues = checkMeshAgainstDeclared(boundsMm, declaredNums, {
          tolerance: opts.tolerance,
          upAxisDeclared: c.model3d.upAxisDeclared,
        });
        for (const iss of meshIssues) issues.push(iss);
        meshUsable = meshIssues.every((i) => i.level !== 'error');
      }
    }
  } else if (c.model3d?.upAxisDeclared === 'Z') {
    issues.push({ code: 'axis-declared-z-up', level: 'error', message: 'Khai trục lên là Z — glTF bắt buộc +Y lên; chuyển trục ở nguồn.' });
  }

  // ③ Điền chiều THIẾU từ mesh — CHỈ khi mesh không lệch đơn vị/trục — cờ inferred, nguồn
  // glb:bounds (đo FILE, không phải đo VẬT). Chiều đã khai hợp lệ GIỮ NGUYÊN (không ghi đè nguồn người).
  if (boundsMm && meshUsable) {
    if (!dims.wMm) dims.wMm = { value: boundsMm.xMm, flag: 'inferred', source: 'glb:bounds' };
    if (!dims.dMm) dims.dMm = { value: boundsMm.zMm, flag: 'inferred', source: 'glb:bounds' };
    if (!dims.hMm) dims.hMm = { value: boundsMm.yMm, flag: 'inferred', source: 'glb:bounds' };
  }

  // Hộp bao: chỉ khi đủ ba chiều; cờ = cờ YẾU NHẤT; nguồn nói rõ chiều nào từ đâu.
  let bounds: NormalizedAssetFamily['bounds'];
  if (dims.wMm && dims.dMm && dims.hMm) {
    const srcs = [dims.wMm, dims.dMm, dims.hMm].map((v) => v.source);
    const allGlb = srcs.every((x) => x === 'glb:bounds');
    const anyGlb = srcs.some((x) => x === 'glb:bounds');
    bounds = {
      xMm: dims.wMm.value,
      yMm: dims.hMm.value,
      zMm: dims.dMm.value,
      truthLevel: weakest([dims.wMm.flag, dims.dMm.flag, dims.hMm.flag]),
      source: allGlb ? 'glb:bounds' : anyGlb ? 'declared+glb:bounds' : 'declared',
    };
  }

  const policy = acquisition.geometryPolicy;
  const heavyStatus: RepresentationStatus =
    policy === 'store-derivatives' ? 'ready' : policy === 'metadata-and-thumb-first' ? 'on-demand' : 'pointer-only';

  /* ── plan-line ── */
  let geom2d: IdfcGeom2d | undefined;
  const group: BlockGroup = c.group ?? 'Phòng khách';
  if (c.planLine) {
    geom2d = c.planLine.geom2d;
    reps.push({ kind: 'plan-line', status: 'ready', payloadRef: 'inline:idfc.body.geom2d', truthLevel: c.planLine.flag, source: c.planLine.source });
  } else if (dims.wMm && dims.dMm) {
    const w = dims.wMm.value;
    const d = dims.dMm.value;
    geom2d = {
      group,
      w,
      h: d,
      prims: [{ k: 'poly', pts: [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: 0, y: d }], closed: true }],
    };
    reps.push({
      kind: 'plan-line',
      status: 'ready',
      payloadRef: 'inline:idfc.body.geom2d',
      truthLevel: 'inferred',
      source: 'derived:footprint(w×d)',
      meta: { note: 'nét bao chữ nhật w×d — không phải ký hiệu vẽ tay', wMm: w, dMm: d },
    });
  } else if (c.kind !== 'material') {
    reps.push({
      kind: 'plan-line',
      status: 'unsupported',
      payloadRef: '',
      truthLevel: 'inferred',
      source: 'none',
      reason: 'Không có nét 2D và không đủ w×d để suy nét bao — không bịa hình.',
    });
  }

  /* ── plan-color / elevation / section / preview ── */
  const passRef = (kind: RepresentationKind, r?: RefPayload & { wPx?: number; hPx?: number }) => {
    if (!r) return;
    reps.push({
      kind,
      status: r.payloadRef ? 'ready' : 'invalid',
      payloadRef: r.payloadRef,
      truthLevel: r.flag,
      source: r.source,
      ...(r.payloadRef ? {} : { reason: 'Thiếu payloadRef.' }),
      ...(r.wPx || r.hPx ? { meta: { ...(r.wPx ? { wPx: r.wPx } : {}), ...(r.hPx ? { hPx: r.hPx } : {}) } } : {}),
    });
  };
  passRef('plan-color', c.planColor);
  passRef('elevation', c.elevation);
  passRef('section', c.section);
  passRef('preview', c.preview);

  /* ── model3d ── */
  if (c.model3d) {
    const flag = c.model3d.flag ?? 'inferred';
    const hasBytes = Boolean(c.model3d.glb);
    const unreadable = issues.some((i) => i.code === 'glb-unreadable');
    const axisOrScaleError = issues.some((i) => (i.code.startsWith('mesh-') || i.code.startsWith('axis-')) && i.level === 'error');
    let status: RepresentationStatus = heavyStatus;
    let reason: string | undefined;
    if (unreadable) {
      status = 'invalid';
      reason = 'GLB không đọc được.';
    } else if (axisOrScaleError) {
      status = 'invalid';
      reason = issues.filter((i) => i.code.startsWith('mesh-') || i.code.startsWith('axis-')).map((i) => i.message).join(' ');
    } else if (c.model3d.format !== 'glb' && c.model3d.format !== 'gltf') {
      status = 'unsupported';
      reason = `Định dạng ${c.model3d.format} chưa có bộ chuyển sang glTF trong app — giữ con trỏ về gốc, không chuyển mù.`;
    } else if (!hasBytes && status === 'ready') {
      status = 'on-demand'; // được phép lưu nhưng chưa có byte trong lượt này
    }
    reps.push({
      kind: 'model3d',
      status,
      payloadRef: c.model3d.payloadRef,
      truthLevel: flag,
      source: c.model3d.source,
      ...(reason ? { reason } : {}),
      meta: {
        format: c.model3d.format,
        ...(meshStats ? { triangles: meshStats.triangles, vertices: meshStats.vertices, bytes: meshStats.bytes, meshes: meshStats.meshes } : {}),
        ...(meshStats?.generator ? { generator: meshStats.generator } : {}),
      },
    });
  }

  /* ── bounds ── */
  if (bounds) {
    reps.push({
      kind: 'bounds',
      status: 'ready',
      payloadRef: 'inline:xAssetFamily.bounds',
      truthLevel: bounds.truthLevel,
      source: bounds.source,
      meta: { xMm: bounds.xMm, yMm: bounds.yMm, zMm: bounds.zMm },
    });
  } else {
    reps.push({
      kind: 'bounds',
      status: 'unsupported',
      payloadRef: '',
      truthLevel: 'inferred',
      source: 'none',
      reason: issues.some((i) => i.code.startsWith('dim-'))
        ? 'Có chiều khai không hợp lệ (xem issues) và không đủ nguồn thay thế — không bịa hộp va chạm.'
        : 'Không đủ w×d×h khai và mesh không cho hộp bao tin được — không bịa hộp va chạm.',
    });
  }

  /* ── lod ── */
  if (c.lod && c.lod.length) {
    const sorted = [...c.lod].sort((a, b) => a.level - b.level);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].triangles;
      const cur = sorted[i].triangles;
      if (prev != null && cur != null && cur > prev) {
        issues.push({
          code: 'lod-order',
          level: 'warn',
          message: `LOD${sorted[i].level} (${cur} tam giác) nặng hơn LOD${sorted[i - 1].level} (${prev}) — thứ tự LOD ngược.`,
        });
      }
    }
    for (const l of sorted) {
      reps.push({
        kind: 'lod',
        status: l.payloadRef ? heavyStatus : 'invalid',
        payloadRef: l.payloadRef,
        truthLevel: 'inferred',
        source: l.source,
        ...(l.payloadRef ? {} : { reason: 'Thiếu payloadRef.' }),
        meta: { level: l.level, ...(l.triangles != null ? { triangles: l.triangles } : {}) },
      });
    }
  }

  /* ── pbr ── */
  if (c.pbr) {
    const p = c.pbr.value;
    const maps = ['baseColorMapUrl', 'normalUrl', 'roughnessMapUrl', 'metallicMapUrl', 'heightUrl', 'aoUrl'].filter(
      (k) => typeof (p as Record<string, unknown>)[k] === 'string' && (p as Record<string, unknown>)[k],
    );
    reps.push({
      kind: 'pbr',
      status: 'ready',
      payloadRef: c.kind === 'material' ? 'inline:idfc.body.pbr' : 'inline:idfc.body.geom3d.pbr',
      truthLevel: c.pbr.flag,
      source: c.pbr.source,
      meta: { maps: maps.length, ...(maps.length ? { mapKeys: maps.join(',') } : {}) },
    });
  }

  /* ── spec (kích thước + catalog) ── */
  {
    const hasSpec = Boolean(dims.wMm || dims.dMm || dims.hMm || c.catalog || c.commerce);
    const specFlags = [dims.wMm, dims.dMm, dims.hMm].filter((v): v is ProvenancedValue<number> => Boolean(v)).map((v) => v.flag);
    reps.push({
      kind: 'spec',
      status: hasSpec ? 'ready' : 'unsupported',
      payloadRef: hasSpec ? 'inline:xAssetFamily.spec' : '',
      truthLevel: specFlags.length ? weakest(specFlags) : 'inferred',
      source: c.catalog?.productUrl ?? c.origin.url ?? 'none',
      ...(hasSpec ? {} : { reason: 'Không có kích thước, catalog hay thương mại — spec trống, không bịa.' }),
      meta: {
        dimsDeclared: specFlags.length,
        boqEligible: Object.keys(boqEligibleDims(dims)).length,
        ...(c.catalog?.specId ? { specId: c.catalog.specId } : {}),
        ...(c.catalog?.matId ? { matId: c.catalog.matId } : {}),
      },
    });
  }

  /* ── .idfc ── */
  const idfc = buildIdfc(c, { now, familyId, acquisition, dims, bounds, geom2d, reps, issues, meshStats });

  return {
    familyId,
    name: c.name,
    code: c.code,
    kind: c.kind,
    origin: c.origin,
    acquisition,
    dims,
    bounds,
    meshStats,
    representations: reps,
    issues,
    idfc,
  };
}

/* ═══════════════ .idfc ═══════════════ */

function buildIdfc(
  c: AssetFamilyCandidate,
  ctx: {
    now: string;
    familyId: string;
    acquisition: AcquisitionDecision;
    dims: DeclaredDims;
    bounds: NormalizedAssetFamily['bounds'];
    geom2d?: IdfcGeom2d;
    reps: NormalizedRepresentation[];
    issues: FamilyIssue[];
    meshStats?: NormalizedAssetFamily['meshStats'];
  },
): NormalizedAssetFamily['idfc'] {
  const isMaterial = c.kind === 'material';
  const isComponent = ['furniture', 'millwork', 'fitout', 'fixture', 'soft'].includes(c.kind);
  if (!isMaterial && !isComponent) {
    return { ok: false, reason: `Slice này chỉ chuẩn hoá cấu kiện vật lý và vật liệu; kind "${c.kind}" chưa có đường .idfc ở đây.` };
  }

  let body: Parameters<typeof exportIdfc>[0]['body'];
  if (isMaterial) {
    if (!c.pbr) return { ok: false, reason: 'Vật liệu cần PBR (ít nhất bộ rỗng có nguồn) để dựng ruột .idfc.' };
    body = { type: 'material', pbr: c.pbr.value, ...(ctx.geom2d ? { symbol2d: ctx.geom2d } : {}) };
  } else {
    if (!ctx.geom2d) return { ok: false, reason: 'Cấu kiện cần nét mặt bằng (geom2d) hoặc đủ w×d để suy nét bao — hiện thiếu, không bịa.' };
    body = {
      type: 'component',
      geom2d: ctx.geom2d,
      geom3d: {
        ...(ctx.dims.hMm ? { heightMm: ctx.dims.hMm.value } : {}),
        ...(c.catalog?.matId ? { matId: c.catalog.matId } : {}),
        ...(c.pbr ? { pbr: c.pbr.value } : {}),
      },
    };
  }

  const commerce: IdfcCommerce | undefined =
    (SELLABLE_KINDS as readonly string[]).includes(c.kind) && (c.commerce || c.catalog)
      ? {
          ...(c.commerce ?? {}),
          // ⭐ 04/09 — KHOÁ BẤT BIẾN đi TRƯỚC business key. Trước đó chỗ này chỉ chép
          // `brand/sku/vendor`, bỏ lại `specId`/`matId` trong `xAssetFamily.catalog` ⇒ cấu kiện
          // rời nối về kho CHỈ bằng `sku` (đổi được), trong khi `Doc`/BOQ neo bằng `specId`.
          ...(c.catalog?.specId ? { specId: c.catalog.specId } : {}),
          ...(c.catalog?.matId ? { matId: c.catalog.matId } : {}),
          ...(c.catalog?.brand ? { brand: c.catalog.brand } : {}),
          ...(c.catalog?.sku ? { sku: c.catalog.sku } : {}),
          ...(c.catalog?.vendor ? { vendor: c.catalog.vendor } : {}),
        }
      : c.commerce;

  const core = exportIdfc({
    meta: {
      id: ctx.familyId,
      name: c.name,
      code: c.code,
      kind: c.kind,
      tags: c.tags,
      author: c.origin.kind === 'user-upload' ? 'user-import' : `import:${c.origin.kind}`,
      createdAt: ctx.now,
    },
    body,
    commerce,
  });
  const file = JSON.parse(core) as Record<string, unknown>;
  // exportIdfc luôn lấy `modifiedAt = now()` — ép về `ctx.now` để tất định (luật ②).
  (file.meta as Record<string, unknown>).modifiedAt = ctx.now;
  file.xAssetFamily = {
    version: 1,
    familyId: ctx.familyId,
    origin: c.origin,
    license: c.license,
    acquisition: ctx.acquisition,
    dims: ctx.dims,
    ...(ctx.bounds ? { bounds: ctx.bounds } : {}),
    ...(c.catalog ? { catalog: c.catalog } : {}),
    ...(ctx.meshStats ? { meshStats: ctx.meshStats } : {}),
    representations: ctx.reps,
    issues: ctx.issues,
    reviewStatus: 'draft-pending-review',
  };
  const json = JSON.stringify(file);
  const parsed = importIdfc(json);
  if (!parsed) {
    ctx.issues.push({ code: 'idfc-rejected', level: 'error', message: lastImportIdfcError() ?? 'importIdfc từ chối không rõ lý do.' });
    return { ok: false, reason: lastImportIdfcError() ?? 'importIdfc từ chối.' };
  }
  return { ok: true, json, parsed };
}

/* ═══════════════ HÀNG DB ═══════════════ */

/** Shape đúng cột `AssetRepresentation` (schema.prisma:347) — `provenance` là JSON chuỗi cùng lối `palette`. */
export interface RepresentationRow {
  kind: string;
  payloadRef: string;
  truthLevel: ProvenanceFlag;
  provenance: string;
}

/**
 * Chuyển biểu diễn → hàng DB. CHỈ những biểu diễn có con trỏ nội dung (`ready` | `on-demand`) —
 * `unsupported`/`invalid` không có gì để trỏ; `pointer-only` (blocked) không được ghi.
 * Hàng mang `familyId` + `status` + `reason` trong provenance để where-used truy ngược được.
 */
export function toRepresentationRows(f: NormalizedAssetFamily): RepresentationRow[] {
  if (f.acquisition.tier === 'blocked') return [];
  return f.representations
    .filter((r) => (r.status === 'ready' || r.status === 'on-demand') && r.payloadRef)
    .map((r) => ({
      kind: REPRESENTATION_DB_KIND[r.kind],
      payloadRef: r.payloadRef,
      truthLevel: r.truthLevel,
      provenance: JSON.stringify({
        familyId: f.familyId,
        source: r.source,
        status: r.status,
        origin: f.origin.kind,
        ...(f.origin.contentHash ? { contentHash: f.origin.contentHash } : {}),
        tier: f.acquisition.tier,
        ...(r.meta ? { meta: r.meta } : {}),
      }),
    }));
}
