/**
 * lib/idfc-import/from-photo.ts — [importFromPhoto] pipeline ẢNH SẢN PHẨM → bản ghi `.idfc`
 * kind `furniture` có mesh 3D ước-hình + tham số mang CỜ NGUỒN từng trường (entry
 * `import-ghe-tu-hinh`, phiếu GI 14/08 — proof thật: ghế Lincoln 327, Mezzo Collection).
 *
 * BA BƯỚC (mỗi bước một nguồn sự thật, KHÔNG trộn cờ [T0]):
 *   ① PHÂN LOẠI — vision `captionImage` (đường NVIDIA free mà Grounded Render đã dùng [T2]):
 *     kind/phong cách/3 lớp vật liệu/loại phòng → cờ `inferred` (máy nhìn ảnh mà đoán).
 *   ② MESH — task `imageTo3d` (AI_TASKS, models.ts): ảnh → GLB texture qua fal TRELLIS.
 *     Mesh là ƯỚC-HÌNH từ MỘT ảnh: đúng dáng nhìn được, KHÔNG phải hình học kỹ thuật đo được
 *     → cờ `inferred`, provenance ghi model + requestId để truy vết.
 *   ③ THAM SỐ — spec hãng đã đối chiếu (docs/dogfood/DF3-LINCOLN-327-SPEC.md): w/d/h/seatH/
 *     nặng → cờ `verified` kèm URL nguồn. Máy KHÔNG đoán trường hãng không công bố (bài học
 *     DF3: cao mặt ngồi + trọng lượng không suy nổi từ ảnh đơn — thiếu thì để trống).
 *
 * VỎ .idfc: dùng ĐÚNG `exportIdfc`/`importIdfc` của lib/cad/idfc.ts (không chế format thứ hai).
 * Ruột `component` đòi `geom2d` bắt buộc → sinh HÌNH CHIẾU BẰNG ước (poly chữ nhật w×d từ số
 * verified — nét bao, không phải ký hiệu vẽ tay) cờ `inferred`. Mesh GLB + bảng cờ nguồn nằm ở
 * khoá mở rộng `xFromPhoto` (importIdfc bỏ qua khoá lạ nên file vẫn mở được ở app hiện tại;
 * đưa mesh vào ruột chính thức = migration idfc v4, NGOÀI phạm vi phiếu này — khai thật, không
 * lách): đây là NHÁP CHỜ DUYỆT [T5], không tự đăng vào Thư viện như đồ chuẩn.
 *
 * Phần THUẦN (buildIdfcFromPhoto) tách khỏi phần MẠNG (classifyPhoto/generateMesh) để test
 * không cần mạng — from-photo.test.ts.
 */

import { exportIdfc, importIdfc, lastImportIdfcError, type IdfcGeom2d, type ParsedIdfc } from '../cad/idfc';
import type { BlockGroup } from '../cad/shared-types';
import { AI_TASKS } from '../ai/models';
import { captionImage, type RefCaption } from '../ai/providers/nvidia';

/* ═══════════════ CỜ NGUỒN ═══════════════ */

/** 3 nấc chốt 10/08 (CHOT-ELEMENT-MATERIAL-INTELLIGENCE): máy suy / người đo / hãng-nguồn xác nhận. */
export type ProvenanceFlag = 'measured' | 'inferred' | 'verified';

export interface ProvenancedValue<T> {
  value: T;
  flag: ProvenanceFlag;
  /** nguồn CỤ THỂ: URL hãng · "vision:<model>" · "fal:<model>#<requestId>" — truy vết được. */
  source: string;
}

/* ═══════════════ ĐẦU VÀO ═══════════════ */

/** Spec đã xác minh từ hãng (người/phiên T tra trang hãng — KHÔNG phải máy đoán). */
export interface VerifiedSpec {
  name: string;
  code: string;
  brand?: string;
  wMm: number;
  dMm: number;
  hMm: number;
  seatHMm?: number;
  weightKg?: number;
  materials?: string[];
  /** URL trang hãng — provenance mọi trường verified. */
  sourceUrl: string;
}

/** Kết quả vision ① — RefCaption + tên model đã chạy (để ghi provenance). */
export interface PhotoClassification extends RefCaption {
  visionModel: string;
}

/** Kết quả mesh ② — GLB đã có + vết job. */
export interface MeshResult {
  /** URL fal hoặc đường dẫn file GLB đã tải về (đường nào cầm được file là được). */
  glbUrl: string;
  falModel: string;
  requestId?: string;
  fileSizeBytes?: number;
  triangles?: number;
}

/* ═══════════════ ③ BUILD BẢN GHI — THUẦN, test không mạng ═══════════════ */

export interface FromPhotoRecord {
  /** JSON .idfc hoàn chỉnh (vỏ exportIdfc + khoá mở rộng xFromPhoto). */
  idfcJson: string;
  /** Kết quả round-trip qua importIdfc — chứng minh shape hợp lệ với app hiện tại. */
  parsed: ParsedIdfc;
}

/**
 * Ghép ①②③ thành file .idfc kind furniture. Throw nếu chính importIdfc của app từ chối
 * (không bao giờ trả về file mà app không mở nổi).
 */
export function buildIdfcFromPhoto(input: {
  spec: VerifiedSpec;
  classification: PhotoClassification;
  mesh: MeshResult;
  /** ảnh nguồn (URL hãng) — ghi vết "sinh từ ảnh nào". */
  sourceImageUrl: string;
  /** nhóm phòng cho hình chiếu bằng — mặc định 'Phòng khách' (trục ② độc lập trục kind). */
  group?: BlockGroup;
}): FromPhotoRecord {
  const { spec, classification, mesh, sourceImageUrl } = input;
  const group: BlockGroup = input.group ?? 'Phòng khách';

  // Hình chiếu bằng ƯỚC: nét bao chữ nhật w×d (mm) — đủ để đặt lên mặt bằng đúng chỗ chiếm,
  // KHÔNG giả vờ là ký hiệu 2D vẽ tay. Số w/d verified, HÌNH là suy ra → cờ inferred.
  const geom2d: IdfcGeom2d = {
    group,
    w: spec.wMm,
    h: spec.dMm,
    prims: [
      {
        k: 'poly',
        pts: [
          { x: 0, y: 0 },
          { x: spec.wMm, y: 0 },
          { x: spec.wMm, y: spec.dMm },
          { x: 0, y: spec.dMm },
        ],
        closed: true,
      },
    ],
  };

  const visionSource = `vision:${classification.visionModel}`;
  const meshSource = `fal:${mesh.falModel}${mesh.requestId ? `#${mesh.requestId}` : ''}`;

  const idfcJsonCore = exportIdfc({
    meta: {
      name: spec.name,
      code: spec.code,
      kind: 'furniture',
      tags: [classification.style, classification.room].filter(Boolean),
      room: classification.room || undefined,
      author: 'importFromPhoto',
    },
    body: {
      type: 'component',
      geom2d,
      geom3d: { heightMm: spec.hMm },
    },
    // Thương mại: chỉ điền thứ hãng công bố (brand/materials) — giá KHÔNG có trên trang, bỏ trống.
    commerce: {
      brand: spec.brand,
      materials: spec.materials,
    },
  });

  // Khoá mở rộng — importIdfc bỏ qua khoá lạ (kiểm bằng round-trip ngay dưới).
  const file = JSON.parse(idfcJsonCore) as Record<string, unknown>;
  file.xFromPhoto = {
    pipeline: 'importFromPhoto',
    sourceImageUrl,
    /** ② mesh ước-hình — cờ inferred, đủ vết truy job. */
    mesh: {
      glbUrl: mesh.glbUrl,
      fileSizeBytes: mesh.fileSizeBytes,
      triangles: mesh.triangles,
      flag: 'inferred' satisfies ProvenanceFlag,
      source: meshSource,
      note: 'Mesh ước-hình từ 1 ảnh — đúng dáng nhìn được, KHÔNG phải hình học kỹ thuật đo được.',
    },
    /** ① phân loại vision — cờ inferred. */
    classification: {
      caption: prov(classification.caption, 'inferred', visionSource),
      style: prov(classification.style, 'inferred', visionSource),
      materials: prov(classification.materials, 'inferred', visionSource),
      room: prov(classification.room, 'inferred', visionSource),
      kind: prov('furniture', 'inferred', visionSource),
    },
    /** ③ tham số hãng — cờ verified từng trường, thiếu thì KHÔNG khai (không đoán bừa). */
    params: {
      wMm: prov(spec.wMm, 'verified', spec.sourceUrl),
      dMm: prov(spec.dMm, 'verified', spec.sourceUrl),
      hMm: prov(spec.hMm, 'verified', spec.sourceUrl),
      ...(spec.seatHMm != null ? { seatHMm: prov(spec.seatHMm, 'verified', spec.sourceUrl) } : {}),
      ...(spec.weightKg != null ? { weightKg: prov(spec.weightKg, 'verified', spec.sourceUrl) } : {}),
    },
    geom2dFlag: prov('hình chiếu bằng ước (nét bao w×d từ số verified)', 'inferred', 'importFromPhoto'),
    /** [T5] nháp chờ duyệt — UI Thư viện (phiếu sau) phải hiện trạng thái này. */
    reviewStatus: 'draft-pending-review',
  };
  const idfcJson = JSON.stringify(file);

  const parsed = importIdfc(idfcJson);
  if (!parsed) {
    throw new Error(`buildIdfcFromPhoto sinh file app không mở nổi: ${lastImportIdfcError() ?? 'không rõ'}`);
  }
  return { idfcJson, parsed };
}

function prov<T>(value: T, flag: ProvenanceFlag, source: string): ProvenancedValue<T> {
  return { value, flag, source };
}

/* ═══════════════ ① VISION (mạng — NVIDIA free, đường captionImage sẵn có) ═══════════════ */

export async function classifyPhoto(imageDataUri: string): Promise<PhotoClassification> {
  const visionModel = process.env.NVIDIA_VLM_MODEL ?? 'meta/llama-3.2-11b-vision-instruct';
  const cap = await captionImage(imageDataUri);
  return { ...cap, visionModel };
}

/* ═══════════════ ② MESH (mạng — fal, server-only) ═══════════════ */

/**
 * Ảnh → GLB qua task `imageTo3d` (models.ts). KHÔNG đi qua /api/jobs vì providers/fal.ts
 * jobStatus chỉ trích được image/video — output ở đây là model_mesh. Dùng fal.subscribe
 * (submit + poll một cú, cùng client @fal-ai đã có); data-URI tự upload lên fal storage
 * (cùng cách resolveDataUris của providers/fal.ts).
 */
export async function generateMesh(imageUrlOrDataUri: string): Promise<MeshResult> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY chưa cấu hình');
  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: process.env.FAL_KEY });

  let imageUrl = imageUrlOrDataUri;
  if (imageUrl.startsWith('data:')) {
    const blob = await (await fetch(imageUrl)).blob();
    const f = new File([blob], 'input.jpg', { type: blob.type || 'image/jpeg' });
    imageUrl = await fal.storage.upload(f);
  }

  const falModel = AI_TASKS.imageTo3d.falModel;
  const result = await fal.subscribe(falModel, { input: { image_url: imageUrl }, logs: false });
  const data = result.data as {
    model_mesh?: { url?: string; file_size?: number };
    model_glb?: { url?: string; file_size?: number };
  };
  const meshFile = data.model_mesh ?? data.model_glb;
  if (!meshFile?.url) throw new Error(`fal ${falModel} không trả model_mesh/model_glb.`);
  return {
    glbUrl: meshFile.url,
    falModel,
    requestId: result.requestId,
    fileSizeBytes: meshFile.file_size,
  };
}

/* ═══════════════ ORCHESTRATOR ═══════════════ */

/**
 * Chạy trọn pipeline ①②③. `deps` tiêm được để test/chạy từng phần — mặc định là đường thật.
 * Server-only (đụng FAL_KEY/NVIDIA_API_KEY) — KHÔNG import từ component client.
 */
export async function importFromPhoto(
  opts: {
    imageDataUri: string;
    sourceImageUrl: string;
    spec: VerifiedSpec;
    group?: BlockGroup;
  },
  deps: {
    classify?: (dataUri: string) => Promise<PhotoClassification>;
    genMesh?: (dataUri: string) => Promise<MeshResult>;
  } = {},
): Promise<FromPhotoRecord & { classification: PhotoClassification; mesh: MeshResult }> {
  const classify = deps.classify ?? classifyPhoto;
  const genMesh = deps.genMesh ?? generateMesh;
  const classification = await classify(opts.imageDataUri);
  const mesh = await genMesh(opts.imageDataUri);
  const record = buildIdfcFromPhoto({
    spec: opts.spec,
    classification,
    mesh,
    sourceImageUrl: opts.sourceImageUrl,
    group: opts.group,
  });
  return { ...record, classification, mesh };
}
