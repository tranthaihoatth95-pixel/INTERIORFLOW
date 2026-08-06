/**
 * lib/vision/to-cad.ts — CẦU NỐI bước ⑤/⑥ (đã có, chạy được, 0 nơi gọi) sang BẢN VẼ THẬT.
 *
 * Vì sao có file này (G-M3-03, đo được ngày 06/08):
 * ```bash
 * grep -rn "match-template\|ortho-projection" components app --include="*.tsx" --include="*.ts"
 * # → 0 dòng
 * ```
 * `lib/vision/match-template.ts` (⑤ khớp mẫu block theo tỉ lệ w:d) và `lib/vision/ortho-
 * projection.ts` (⑥ ba hình chiếu) đã viết xong + có test, nhưng KHÔNG nút nào trong app đi từ
 * "món vừa đo" sang "hình trên bản vẽ" ⇒ dây chuyền ảnh→bản vẽ đứt đúng giữa vision và block.
 * File này KHÔNG viết lại thuật toán nào — chỉ **nối dây** (luật N7): gọi `matchTemplate()` /
 * `buildOrthoViews()` có sẵn rồi đổ `Prim[]` ra `Entity[]` bằng `clusterPrimsToEntities()` cũng
 * có sẵn (`lib/cad/block-library.ts`, đường mà kệ "cụm bàn" đã chạy thật từ 05/08).
 *
 * THUẦN: không React/DOM/fetch (`clusterPrimsToEntities` là hàm thuần; `loadManifest()` bất đồng
 * bộ nằm ở TẦNG UI, manifest được truyền vào đây). Test chạy bằng sucrase-node như các module
 * `lib/vision/*` khác — vì thế mọi import ở đây là TƯƠNG ĐỐI, không dùng alias `@/`.
 *
 * ⚠️ GIỚI HẠN CÒN NGUYÊN, KHÔNG GIẤU: hình đổ xuống bản vẽ là **đường rời** (polyline/line/arc),
 * KHÔNG phải một `BlockEntity` mang danh tính — đúng bệnh G-M3-10 (block thư viện + cụm bàn cũng
 * đang bị y hệt). Hệ quả: bảng thống kê gộp chúng vào "Chưa phân loại" và BOQ không đếm được
 * theo entity. Đường vòng đã làm ở đây: trả kèm `item: FfeItem` (mã · số lượng · phòng · ảnh ·
 * độ tin cậy) để món vẫn lên được bảng FF&E/BOQ qua tầng dữ liệu, trong khi chờ G-M3-10 sửa gốc.
 */

import type { Entity, Pt } from '../cad/model';
import type { Prim } from '../cad/furniture';
import { clusterPrimsToEntities, type InsertOptions, type LibraryManifest } from '../cad/block-library';
import {
  matchTemplate,
  makeTemplateRequest,
  fallbackBox,
  FALLBACK_BLOCK_LABEL,
  DEFAULT_MATCH_THRESHOLD,
  type TargetDims,
  type TemplateMatch,
  type TemplateRequest,
} from './match-template';
import { buildOrthoViews, type OrthoViewKind, type OrthoViewSet } from './ortho-projection';
import type { FurnitureCategory, MeasurementResult, ObjectSilhouette } from './single-view-metrology';
import { makeFfeItem, type FfeItem } from '../ffe/item';

/** Số đo tầng A → 3 số thuần cho bước ⑤ (bỏ `kind`/`basis` — đúng chú thích `TargetDims`). */
export function measurementToTarget(m: MeasurementResult): TargetDims {
  return { widthMm: m.width.valueMm, depthMm: m.depth.valueMm, heightMm: m.height.valueMm };
}

/** Độ tin của MỘT món suy từ 3 số đo: cả ba đều `measured` ⇒ 'measured', còn lại ⇒ 'inferred'.
 * (Không chế thang điểm mới — mượn nguyên `MeasurementValue.kind`, luật K3.) */
export function measurementConfidence(m: MeasurementResult): 'measured' | 'inferred' {
  return m.width.kind === 'measured' && m.depth.kind === 'measured' && m.height.kind === 'measured'
    ? 'measured'
    : 'inferred';
}

export interface BuildFurnitureInput {
  measurement: MeasurementResult;
  /** điểm thả trên bản vẽ (mm, hệ world CAD) */
  at: Pt;
  category?: FurnitureCategory;
  silhouette?: ObjectSilhouette;
  /** manifest thư viện block — UI `loadManifest()` rồi truyền vào (giữ module thuần). */
  manifest?: LibraryManifest | null;
  /** tên món để đặt cho `FfeItem` — không có thì lấy tên mẫu đã khớp / nhãn khối tạm. */
  name?: string;
  /** phòng đang bố trí, nếu người dùng đã chọn (G-M3-08). */
  room?: string;
  /** ảnh nguồn (ảnh phối cảnh đã bốc tách) — vào thẳng cột ảnh của bảng FF&E. */
  imageUrl?: string;
  /** mốc thời gian cho `TemplateRequest` — caller truyền để test tất định (module thuần). */
  now?: number;
  insert?: InsertOptions;
}

export interface BuildFurnitureResult {
  /** entity sẵn sàng `useCadStore.addEntities()` — 1 nấc Undo cho cả cụm. */
  entities: Entity[];
  /** mẫu khớp được (đã kéo giãn về đúng số đo), `null` khi dưới ngưỡng ⇒ dùng hộp bao. */
  match: TemplateMatch | null;
  /** điểm của mẫu GẦN NHẤT kể cả khi trượt ngưỡng (0..1) — để nói thật "gần nhất mới 42%". */
  bestScore: number;
  usedFallback: boolean;
  /** true = điểm khớp chỉ dựa trên MỘT tiêu chí ⇒ không nhận, dù điểm có cao (xem
   * `MIN_MATCH_CRITERIA`). UI nên mời người dùng khai loại đồ để khớp có căn cứ hơn. */
  thinEvidence: boolean;
  /** true = số đo không dùng được (NaN/vô cực/≤0) ⇒ `entities` RỖNG, `label` là câu giải thích.
   * UI phải hiện câu đó và KHÔNG gọi `addEntities` (mảng rỗng nên gọi cũng vô hại, nhưng đừng
   * báo "đã đặt N nét"). */
  invalidDims: boolean;
  /** câu tiếng Việt ngắn hiện thẳng cho người dùng (≤12 từ theo SPEC-NGON-NGU-CHI-DAN). */
  label: string;
  /** trượt ngưỡng ⇒ MỘT DÒNG VIỆC cho thư viện, không phải một lần thất bại im lặng. */
  request: TemplateRequest | null;
  /** món rời tương ứng — nối sang bảng FF&E/BOQ (`lib/ffe/item.ts`). */
  item: FfeItem;
}

/**
 * Số tiêu chí TỐI THIỂU phải chấm được thì điểm khớp mới đáng tin.
 *
 * 🔴 Đo được lúc nối dây (06/08), KHÔNG phải lo xa: `scoreCandidate()` bỏ tiêu chí không đánh giá
 * được rồi **chia lại trọng số cho phần còn lại**. Khi caller không khai `category` và không có
 * mặt nạ, chỉ còn ĐÚNG MỘT tiêu chí (tỉ lệ rộng:sâu) và nó ăn trọn 100% trọng số ⇒ mọi món đều
 * "giống 100%" một mẫu nào đó. Chạy thật: 4200×120×2400 → *Gương 100%* · 3000×3000×300 → *Sofa
 * góc 100%* · 220×180×4000 → *Bàn ăn 8 98%*. Nói với người dùng "giống mẫu Gương 100%" cho một
 * cái tủ rack là nói dối bằng con số.
 * Vá ở TẦNG NÀY (cửa tiêu thụ), KHÔNG sửa trọng số trong `match-template.ts`: đổi thang điểm của
 * engine là đổi hành vi của mọi nơi khác + vỡ test đã chốt của bước ⑤ — đó là quyết định riêng,
 * cần Hoà chốt. Ở đây chỉ TỪ CHỐI NHẬN một điểm số không đủ căn cứ.
 */
export const MIN_MATCH_CRITERIA = 2;

/**
 * BƯỚC ⑤ nối vào bản vẽ: món đã đo → nét mặt bằng → entity thật.
 *
 * Gọi `matchTemplate` với `threshold: 0` để LUÔN biết mẫu gần nhất là ai và gần tới đâu, rồi tự
 * quyết theo `DEFAULT_MATCH_THRESHOLD` — thà nói "gần nhất mới 42%, dựng khối tạm" còn hơn im
 * lặng trả `null` rồi người dùng không hiểu vì sao ra cái hộp.
 */
/**
 * Số đo dùng được để dựng hình: cả ba chiều phải HỮU HẠN và DƯƠNG.
 *
 * 🔴 VÁ 06/08 — vòng kiểm phản biện phá được bản đầu: không có một kiểm tra `Number.isFinite` nào.
 * Đo thật: `NaN×NaN×NaN` và `Infinity×800×750` đều ra **1 entity với 4/4 điểm không hữu hạn**,
 * `FfeItem.w/d/hUp = NaN`, mà `label` vẫn báo như bình thường. Entity NaN vào `Doc` sẽ phá
 * render/xuất DXF, và `buildXlsxBuffer` (`lib/boq/xlsx.ts`) NÉM LỖI khi gặp số không hữu hạn ⇒
 * người dùng gặp sập ở tận cuối dây (lúc xuất hồ sơ), rất xa chỗ thật sự sai. Chặn tại nguồn.
 */
export function dimsAreUsable(t: TargetDims): boolean {
  return [t.widthMm, t.depthMm, t.heightMm].every((v) => Number.isFinite(v) && v > 0);
}

/** Câu báo khi số đo không dùng được — nói rõ SỐ NÀO hỏng, không nói chung chung. */
export function unusableDimsMessage(t: TargetDims): string {
  const bad = ([['rộng', t.widthMm], ['sâu', t.depthMm], ['cao', t.heightMm]] as const)
    .filter(([, v]) => !Number.isFinite(v) || v <= 0)
    .map(([k, v]) => `${k}=${Number.isFinite(v) ? v : 'không phải số'}`);
  return `Số đo chưa dùng được (${bad.join(' · ')}) — đo lại hoặc nhập tay trước khi dựng khối.`;
}

export function buildFurnitureFromMeasurement(input: BuildFurnitureInput): BuildFurnitureResult {
  const target = measurementToTarget(input.measurement);

  // Không dựng gì cả khi số đo hỏng: trả entity RỖNG + câu báo thật. KHÔNG ném lỗi (UI đang ở
  // giữa luồng làm việc, ném là mất trang), KHÔNG dựng hộp bao méo rồi báo thành công.
  if (!dimsAreUsable(target)) {
    return {
      entities: [],
      match: null,
      bestScore: 0,
      usedFallback: false,
      thinEvidence: false,
      invalidDims: true,
      label: unusableDimsMessage(target),
      request: null,
      item: makeFfeItem({
        name: input.name ?? 'Món chưa đo được',
        source: 'vision',
        qty: 1,
        room: input.room,
        imageUrl: input.imageUrl,
        confidence: 'inferred',
        confidenceBasis: unusableDimsMessage(target),
        note: unusableDimsMessage(target),
      }),
    };
  }
  const best = matchTemplate(target, {
    category: input.category,
    silhouette: input.silhouette,
    manifest: input.manifest,
    threshold: 0,
  });
  const bestScore = best?.matchScore ?? 0;
  const thinEvidence = !!best && best.reasons.length < MIN_MATCH_CRITERIA;
  const accepted = best && bestScore >= DEFAULT_MATCH_THRESHOLD && !thinEvidence ? best : null;

  const prims: Prim[] = accepted?.prims?.length ? accepted.prims : fallbackBox(target);
  const entities = clusterPrimsToEntities(prims, input.at, { layer: 'l-furniture', ...input.insert });

  const usedFallback = !accepted?.prims?.length;
  const label = accepted
    ? `Giống mẫu "${accepted.candidate.name}" ${Math.round(bestScore * 100)}%`
    : thinEvidence
      ? `${FALLBACK_BLOCK_LABEL} — mới khớp được tỉ lệ, chưa đủ căn cứ`
      : `${FALLBACK_BLOCK_LABEL} — gần nhất mới ${Math.round(bestScore * 100)}%`;

  const request = accepted
    ? null
    : makeTemplateRequest({
        category: input.category,
        dims: target,
        bestScore,
        bestCandidateName: best?.candidate.name,
        now: input.now ?? 0,
      });

  const item = makeFfeItem({
    name: input.name ?? accepted?.candidate.name ?? FALLBACK_BLOCK_LABEL,
    source: 'vision',
    qty: 1,
    room: input.room,
    imageUrl: input.imageUrl,
    w: Math.round(target.widthMm),
    d: Math.round(target.depthMm),
    hUp: Math.round(target.heightMm),
    confidence: measurementConfidence(input.measurement),
    confidenceBasis: input.measurement.width.basis,
    entityIds: entities.map((e) => e.id),
    note: usedFallback ? label : undefined,
  });

  return { entities, match: accepted, bestScore, usedFallback, thinEvidence, invalidDims: false, label, request, item };
}

/* ═══════════════════════ BƯỚC ⑥ — ba hình chiếu xuống bản vẽ ═══════════════════════ */

/** Khoảng hở giữa ba hình trên bản vẽ (mm) — 300mm ~ 3cm ở tỉ lệ 1:100, đủ thoáng để ghi kích
 * thước sau này mà không phải kéo giãn tay. */
export const ORTHO_GAP_MM = 300;

export interface OrthoPlacement {
  kind: OrthoViewKind;
  title: string;
  /** tâm hình trên bản vẽ (world mm) */
  at: Pt;
  extentMm: { w: number; h: number };
  /** true = chỉ hộp bao, chưa phải hình thật ⇒ UI nên nói rõ, đừng để người dùng tưởng đã xong. */
  isBoundingOutlineOnly: boolean;
}

export interface OrthoToCadResult {
  entities: Entity[];
  placements: OrthoPlacement[];
  /** true = số đo không dùng được ⇒ KHÔNG dựng hình nào, `warning` là câu giải thích (cùng chốt
   * chặn `dimsAreUsable` của bước ⑤ — ba hình chiếu cũng đọc chính ba con số đó). */
  invalidDims?: boolean;
  /** dấu cảnh báo bắt buộc của bước ⑥ (mặt khuất là suy diễn) — KHÔNG có tham số tắt. */
  warning: string;
  set: OrthoViewSet;
}

/**
 * Xếp ba hình chiếu THẲNG HÀNG NGANG theo đúng thứ tự đọc bản vẽ nghề: Mặt bằng · Mặt đứng ·
 * Mặt bên, cách nhau `ORTHO_GAP_MM`, tâm hàng đặt tại `at`.
 *
 * KHÔNG tự ghi kích thước lên bản vẽ ở lượt này: `OrthoView.dimensions` đã mang sẵn số + nguồn
 * gốc, nhưng entity ghi kích thước (dimension) là việc của tầng CAD và cần chọn kiểu ghi/tỉ lệ —
 * làm bừa ở đây sẽ đẻ ra chữ chết không cập nhật (đúng bệnh G-M2-03). Trả `placements` để lượt
 * sau nối máy ghi kích thước vào đúng chỗ.
 */
export function orthoViewsToEntities(
  measurement: MeasurementResult,
  at: Pt,
  opts: { match?: TemplateMatch | null; silhouette?: ObjectSilhouette; gapMm?: number; insert?: InsertOptions } = {},
): OrthoToCadResult {
  const target = measurementToTarget(measurement);
  if (!dimsAreUsable(target)) {
    const set0 = buildOrthoViews(measurement, { match: null, silhouette: undefined });
    return { entities: [], placements: [], invalidDims: true, warning: unusableDimsMessage(target), set: set0 };
  }

  /* 🔴 VÁ VÒNG 2 (kiểm phản biện 06/08) — `dimsAreUsable` mới gác BA CON SỐ w/d/h, trong khi
     MẶT NẠ (silhouette) cũng DỰNG HÌNH THẬT ở bước ⑥ (`silhouetteToElevation`). Đo được: số đo
     sạch + `silhouette.front` chứa điểm NaN ⇒ bước ⑤ sạch nhưng bước ⑥ ra **2/11 điểm không hữu
     hạn**, `invalidDims` vẫn `false`. Mặt nạ đến từ bộ tách ảnh (`ai.furnitureextract`) nên hoàn
     toàn có thể lẫn NaN thật. Bỏ mặt nạ hỏng ⇒ mặt đứng rơi về hộp bao (`buildOrthoViews` đã có
     sẵn nhánh đó) thay vì đẩy toạ độ hỏng vào Doc. */
  const cleanSilhouette =
    opts.silhouette && opts.silhouette.front.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      ? opts.silhouette
      : undefined;

  const set = buildOrthoViews(measurement, { match: opts.match ?? null, silhouette: cleanSilhouette });
  const gap = opts.gapMm ?? ORTHO_GAP_MM;
  const order: OrthoViewKind[] = ['plan', 'front', 'side'];
  const views = order.map((k) => set[k]);

  const totalW = views.reduce((s, v) => s + v.extentMm.w, 0) + gap * (views.length - 1);
  let cursor = at.x - totalW / 2;

  const entities: Entity[] = [];
  const placements: OrthoPlacement[] = [];
  for (const v of views) {
    const center: Pt = { x: cursor + v.extentMm.w / 2, y: at.y };
    entities.push(...clusterPrimsToEntities(v.prims, center, { layer: 'l-furniture', ...opts.insert }));
    placements.push({
      kind: v.kind,
      title: v.title,
      at: center,
      extentMm: v.extentMm,
      isBoundingOutlineOnly: v.isBoundingOutlineOnly,
    });
    cursor += v.extentMm.w + gap;
  }

  return { entities, placements, warning: set.warning, set };
}
