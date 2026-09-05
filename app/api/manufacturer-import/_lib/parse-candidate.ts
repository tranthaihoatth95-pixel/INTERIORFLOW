/**
 * app/api/manufacturer-import/_lib/parse-candidate.ts — phần THUẦN của route nhập hãng/ứng viên
 * mở: đọc JSON client → `AssetFamilyCandidate` đã kiểm kiểu, hoặc lỗi 400 nói rõ trường nào.
 * Không DB, không FS — test không cần server (parse-candidate.test.ts).
 *
 * Nguyên tắc đọc: trường lạ BỎ QUA, trường sai kiểu là LỖI (không ép mù). Cờ nguồn của số khai
 * KHÔNG được để trống: client phải nói số này từ đâu (`source`) và tin tới đâu (`flag`) — thiếu
 * là 400, không tự gán `verified`.
 */

import type { AssetFamilyCandidate, DeclaredDims, RefPayload } from '../../../../lib/idfc-import/asset-family';
import { IDFC_KINDS, type IdfcKind } from '../../../../lib/cad/idfc';
import { isAssetSourceKind, isLicenseId, type LicenseClaim } from '../../../../lib/idfc-import/license-gate';
import type { ProvenanceFlag, ProvenancedValue } from '../../../../lib/idfc-import/from-photo';
import type { MaterialPbr } from '../../../../lib/materials/schema';

export type ParseResult = { ok: true; candidate: AssetFamilyCandidate; attachToAssetId?: string } | { ok: false; error: string };

const FLAGS: readonly ProvenanceFlag[] = ['measured', 'inferred', 'verified'];
const FORMATS = ['glb', 'gltf', 'obj', 'fbx', 'skp', '3dm', 'other'] as const;
/** Trần byte GLB nhận qua JSON base64 — cùng trần 25MB của Thư viện (LIBRARY_MAX_BYTES). */
export const GLB_MAX_BYTES = 25 * 1024 * 1024;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

function readProv(v: unknown, path: string): { ok: true; value: ProvenancedValue<number> } | { ok: false; error: string } {
  if (!isObj(v)) return { ok: false, error: `${path} phải là {value, flag, source}.` };
  if (typeof v.value !== 'number') return { ok: false, error: `${path}.value phải là số.` };
  if (typeof v.flag !== 'string' || !(FLAGS as readonly string[]).includes(v.flag)) return { ok: false, error: `${path}.flag phải là measured | inferred | verified.` };
  const source = str(v.source);
  if (!source) return { ok: false, error: `${path}.source bắt buộc — số không nguồn là số bịa.` };
  return { ok: true, value: { value: v.value, flag: v.flag as ProvenanceFlag, source } };
}

function readRef(v: unknown, path: string): { ok: true; value: RefPayload & { wPx?: number; hPx?: number } } | { ok: false; error: string } | { ok: true; value: undefined } {
  if (v === undefined) return { ok: true, value: undefined };
  if (!isObj(v)) return { ok: false, error: `${path} phải là {payloadRef, flag, source}.` };
  const payloadRef = str(v.payloadRef);
  const source = str(v.source);
  if (!payloadRef) return { ok: false, error: `${path}.payloadRef bắt buộc.` };
  if (payloadRef.startsWith('data:')) return { ok: false, error: `${path}.payloadRef là dataURL — cấm nhúng payload.` };
  if (typeof v.flag !== 'string' || !(FLAGS as readonly string[]).includes(v.flag)) return { ok: false, error: `${path}.flag phải là measured | inferred | verified.` };
  if (!source) return { ok: false, error: `${path}.source bắt buộc.` };
  return {
    ok: true,
    value: {
      payloadRef,
      flag: v.flag as ProvenanceFlag,
      source,
      ...(typeof v.wPx === 'number' ? { wPx: v.wPx } : {}),
      ...(typeof v.hPx === 'number' ? { hPx: v.hPx } : {}),
    },
  };
}

function readLicense(v: unknown): { ok: true; value: LicenseClaim } | { ok: false; error: string } {
  if (!isObj(v)) return { ok: false, error: 'license bắt buộc — {id, sourceUrl?, evidenceUrl?, verifiedBy?, verifiedAt?, redistributionPermission?, termsForbidRebundle?, attribution?}.' };
  if (!isLicenseId(v.id)) return { ok: false, error: `license.id "${String(v.id)}" không thuộc từ vựng (dùng "unknown" nếu chưa rõ — máy không đoán).` };
  const rp = v.redistributionPermission;
  if (rp !== undefined && rp !== 'explicit' && rp !== 'none') return { ok: false, error: 'license.redistributionPermission phải là explicit | none.' };
  if (v.termsForbidRebundle !== undefined && typeof v.termsForbidRebundle !== 'boolean') return { ok: false, error: 'license.termsForbidRebundle phải là boolean.' };
  return {
    ok: true,
    value: {
      id: v.id,
      sourceUrl: str(v.sourceUrl),
      evidenceUrl: str(v.evidenceUrl),
      verifiedBy: str(v.verifiedBy),
      verifiedAt: str(v.verifiedAt),
      redistributionPermission: rp as LicenseClaim['redistributionPermission'],
      termsForbidRebundle: v.termsForbidRebundle as boolean | undefined,
      attribution: str(v.attribution),
    },
  };
}

/** Giải base64 → Uint8Array; từ chối chuỗi không phải base64 hoặc vượt trần. */
export function decodeGlbBase64(b64: string): { ok: true; bytes: Uint8Array } | { ok: false; error: string } {
  const clean = b64.replace(/^data:[^,]*,/, '');
  if (!/^[A-Za-z0-9+/=\s]*$/.test(clean)) return { ok: false, error: 'glbBase64 không phải base64.' };
  const est = Math.floor((clean.replace(/\s/g, '').length * 3) / 4);
  if (est > GLB_MAX_BYTES) return { ok: false, error: `GLB quá ${GLB_MAX_BYTES / 1024 / 1024}MB.` };
  const buf = Buffer.from(clean, 'base64');
  if (buf.length === 0) return { ok: false, error: 'glbBase64 rỗng.' };
  return { ok: true, bytes: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) };
}

export function parseCandidate(body: unknown): ParseResult {
  if (!isObj(body)) return { ok: false, error: 'Body phải là JSON object.' };
  const name = str(body.name);
  const code = str(body.code);
  if (!name) return { ok: false, error: 'Thiếu name.' };
  if (!code) return { ok: false, error: 'Thiếu code.' };
  if (typeof body.kind !== 'string' || !(IDFC_KINDS as readonly string[]).includes(body.kind)) return { ok: false, error: `kind phải thuộc: ${IDFC_KINDS.join(' | ')}.` };
  const kind = body.kind as IdfcKind;

  if (!isObj(body.origin)) return { ok: false, error: 'origin bắt buộc — {kind, url?, contentHash?, originalName?, originalMime?, originalBytes?}.' };
  if (!isAssetSourceKind(body.origin.kind)) return { ok: false, error: 'origin.kind phải là user-upload | manufacturer-reference | open-candidate | if-seed.' };
  if (body.origin.kind === 'if-seed') return { ok: false, error: 'origin.kind "if-seed" chỉ dành cho fixture nội bộ, không nhận qua API.' };
  const contentHash = str(body.origin.contentHash);
  if (contentHash && !/^[0-9a-f]{64}$/i.test(contentHash)) return { ok: false, error: 'origin.contentHash phải là sha256 hex 64 ký tự.' };
  const origin: AssetFamilyCandidate['origin'] = {
    kind: body.origin.kind,
    url: str(body.origin.url),
    contentHash: contentHash?.toLowerCase(),
    originalName: str(body.origin.originalName),
    originalMime: str(body.origin.originalMime),
    ...(typeof body.origin.originalBytes === 'number' ? { originalBytes: body.origin.originalBytes } : {}),
    retrievedAt: str(body.origin.retrievedAt),
  };
  if ((origin.kind === 'manufacturer-reference' || origin.kind === 'open-candidate') && !origin.url)
    return { ok: false, error: `origin.url bắt buộc với nguồn ${origin.kind} — không có trang nguồn thì không truy được giấy phép.` };

  const lic = readLicense(body.license);
  if (!lic.ok) return lic;

  let dims: DeclaredDims | undefined;
  if (body.dims !== undefined) {
    if (!isObj(body.dims)) return { ok: false, error: 'dims phải là object {wMm?, dMm?, hMm?}.' };
    dims = {};
    for (const k of ['wMm', 'dMm', 'hMm'] as const) {
      if (body.dims[k] === undefined) continue;
      const r = readProv(body.dims[k], `dims.${k}`);
      if (!r.ok) return r;
      dims[k] = r.value;
    }
  }

  const refs: Partial<Pick<AssetFamilyCandidate, 'planColor' | 'elevation' | 'section' | 'preview'>> = {};
  for (const k of ['planColor', 'elevation', 'section', 'preview'] as const) {
    const r = readRef(body[k], k);
    if (!r.ok) return r;
    if (r.value) refs[k] = r.value;
  }

  let model3d: AssetFamilyCandidate['model3d'];
  if (body.model3d !== undefined) {
    const m = body.model3d;
    if (!isObj(m)) return { ok: false, error: 'model3d phải là {payloadRef, format, glbBase64?, upAxisDeclared?, flag?, source}.' };
    const payloadRef = str(m.payloadRef);
    const source = str(m.source);
    if (!payloadRef) return { ok: false, error: 'model3d.payloadRef bắt buộc.' };
    if (!source) return { ok: false, error: 'model3d.source bắt buộc.' };
    if (typeof m.format !== 'string' || !(FORMATS as readonly string[]).includes(m.format)) return { ok: false, error: `model3d.format phải thuộc: ${FORMATS.join(' | ')}.` };
    if (m.upAxisDeclared !== undefined && m.upAxisDeclared !== 'Y' && m.upAxisDeclared !== 'Z') return { ok: false, error: 'model3d.upAxisDeclared phải là Y | Z.' };
    if (m.flag !== undefined && (typeof m.flag !== 'string' || !(FLAGS as readonly string[]).includes(m.flag))) return { ok: false, error: 'model3d.flag phải là measured | inferred | verified.' };
    let glb: Uint8Array | undefined;
    if (m.glbBase64 !== undefined) {
      if (typeof m.glbBase64 !== 'string') return { ok: false, error: 'model3d.glbBase64 phải là chuỗi base64.' };
      const d = decodeGlbBase64(m.glbBase64);
      if (!d.ok) return d;
      glb = d.bytes;
    }
    model3d = {
      payloadRef,
      format: m.format as (typeof FORMATS)[number],
      source,
      ...(glb ? { glb } : {}),
      ...(m.upAxisDeclared ? { upAxisDeclared: m.upAxisDeclared as 'Y' | 'Z' } : {}),
      ...(m.flag ? { flag: m.flag as ProvenanceFlag } : {}),
    };
  }

  let lod: AssetFamilyCandidate['lod'];
  if (body.lod !== undefined) {
    if (!Array.isArray(body.lod)) return { ok: false, error: 'lod phải là mảng.' };
    lod = [];
    for (let i = 0; i < body.lod.length; i++) {
      const l = body.lod[i];
      if (!isObj(l) || typeof l.level !== 'number' || !str(l.payloadRef) || !str(l.source)) return { ok: false, error: `lod[${i}] phải là {level, payloadRef, source, triangles?}.` };
      lod.push({ level: l.level, payloadRef: str(l.payloadRef)!, source: str(l.source)!, ...(typeof l.triangles === 'number' ? { triangles: l.triangles } : {}) });
    }
  }

  let pbr: AssetFamilyCandidate['pbr'];
  if (body.pbr !== undefined) {
    const p = body.pbr;
    if (!isObj(p) || !isObj(p.value) || typeof p.flag !== 'string' || !(FLAGS as readonly string[]).includes(p.flag) || !str(p.source))
      return { ok: false, error: 'pbr phải là {value: MaterialPbr, flag, source}.' };
    pbr = { value: p.value as MaterialPbr, flag: p.flag as ProvenanceFlag, source: str(p.source)! };
  }

  let catalog: AssetFamilyCandidate['catalog'];
  if (body.catalog !== undefined) {
    if (!isObj(body.catalog)) return { ok: false, error: 'catalog phải là object.' };
    const c = body.catalog;
    catalog = {
      brand: str(c.brand), sku: str(c.sku), vendor: str(c.vendor), productUrl: str(c.productUrl), specId: str(c.specId), matId: str(c.matId),
    };
  }

  const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim()) : undefined;
  const attachToAssetId = str(body.attachToAssetId);

  const candidate: AssetFamilyCandidate = {
    name,
    code,
    kind,
    origin,
    license: lic.value,
    ...(dims ? { dims } : {}),
    ...refs,
    ...(model3d ? { model3d } : {}),
    ...(lod ? { lod } : {}),
    ...(pbr ? { pbr } : {}),
    ...(catalog ? { catalog } : {}),
    ...(isObj(body.commerce) ? { commerce: body.commerce as AssetFamilyCandidate['commerce'] } : {}),
    ...(tags?.length ? { tags } : {}),
  };
  return { ok: true, candidate, ...(attachToAssetId ? { attachToAssetId } : {}) };
}
