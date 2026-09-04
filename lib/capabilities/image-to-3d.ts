/**
 * lib/capabilities/image-to-3d.ts — DÂY CHUYỀN "Ảnh thành khối" (năng lực `image-to-3d` trong
 * `lib/capabilities/compound.ts`): ẢNH THAM CHIẾU → HIỂU → KHỐI NHÁP → NGƯỜI DUYỆT → BIỂU DIỄN.
 *
 * ── LOOK INSIDE (luật B25 NO-REBUILD — negative evidence, đo tại nguồn 20/08) ───────────────────
 * ĐANG CÓ, DÙNG LẠI NGUYÊN (file này KHÔNG viết lại một dòng thuật toán nào):
 *   · `lib/vision/single-view-metrology.ts:942` `measureObjectTiered()` — máy HIỂU ảnh, 4 bậc,
 *     không bao giờ throw, trả w/d/h kèm `kind: 'measured'|'inferred'` + `basis` kiểm được.
 *     ĐÃ SỐNG: node `vision.measureobject` (`lib/nodes/defs/metrology.ts:21`).
 *   · `lib/vision/to-cad.ts:142` `buildFurnitureFromMeasurement()` — số đo → nét mặt bằng →
 *     `Entity[]` thật (qua `matchTemplate` ⑤ + `clusterPrimsToEntities`). ĐÃ SỐNG:
 *     `components/render-studio/ToolModeForm.tsx:974`.
 *   · `lib/vision/to-cad.ts:130` `dimsAreUsable()` / `:135` `unusableDimsMessage()` — cổng chặn số
 *     đo hỏng (NaN/∞/≤0) đã trả giá qua 2 vòng phản biện 06/08. KHÔNG viết cổng thứ hai.
 *   · `lib/idfc-import/from-photo.ts:35` `ProvenanceFlag = measured|inferred|verified` — cờ 3 nấc
 *     đã chốt 10/08. REUSE nguyên type, KHÔNG đẻ bộ từ vựng thứ tư (§11 phiếu).
 *   · `lib/cad/model.ts:284` `Base.heightMm`/`ops`/`recipe` — `docToObjScene` ĐÃ đùn lăng trụ theo
 *     `heightMm` (xem `lib/three/cad-to-obj.ts:698`). ⇒ "khối 3D" ở đây KHÔNG cần engine mới:
 *     nét mặt bằng + `heightMm` LÀ khối 3D trong từ vựng sẵn có của IF.
 *   · `prisma/schema.prisma:609` `ExternalRef{system,externalId,entityType,entityId}` — `system` cố
 *     ý là chuỗi TỰ DO, không enum (00-CHOT 07/08). ⇒ gắn một BIỂU DIỄN mới cho CÙNG một danh
 *     tính asset = thêm một hàng, KHÔNG thêm cột, KHÔNG đẻ asset thứ hai (§4 phiếu).
 * MỒ CÔI (có code, 0 nơi gọi ngoài test — đo bằng grep 20/08, KHÔNG nối ở lượt này):
 *   · `lib/idfc-import/from-photo.ts` `importFromPhoto`/`buildIdfcFromPhoto` — đường mesh THẬT
 *     (fal TRELLIS). Không nối được ở đây vì nó ĐÒI `VerifiedSpec` (w/d/h/URL trang hãng do NGƯỜI
 *     tra tay) + `FAL_KEY`: nó là bậc CAO HƠN của cùng ý định, không phải đường chạy từ ảnh trần.
 *   · `lib/idfc-import/surface-graph.ts` `buildSurfaceGraph` · `part-lock.ts` `applyPartLock` ·
 *     `lib/vision/horizon.ts` `detectHorizon` — 0 nơi gọi.
 * ⇒ Thứ DUY NHẤT chưa tồn tại và là toàn bộ nội dung file này: **trạng thái ỨNG VIÊN + cửa người
 *   duyệt + cổng BOQ + móc biểu diễn**. Không thuật toán, không mạng, không UI, không DOM.
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ────────────────────────────────────────────────────────────────────────
 *  ① MÁY SINH LÀ ĐỀ XUẤT. Ứng viên ra lò luôn `trangThai:'deXuat'`; `entities` là NHÁP, người gọi
 *    CẤM đổ vào `Doc` trước khi có `nhanUngVien()`. Cửa Xem trước → Nhận/Bỏ là bắt buộc (§19).
 *  ② SỐ SUY TỪ ẢNH LÀ `inferred` — KHÔNG vào BOQ như số đo được (Hoà chốt 15/08: *"BOQ chỉ lấy giá
 *    trị chính xác đến từ con số"*). Cổng duy nhất: `duocVaoBoq()`. Không có tham số tắt.
 *  ③ MÁY CHƯA ĐỌC ĐƯỢC GÌ TỪ ẢNH THÌ TỪ CHỐI, KHÔNG DỰNG KHỐI CHO CÓ. Bậc 1 của
 *    `measureObjectTiered` là dải chuẩn nghề theo LOẠI ĐỒ — nó không nhìn ảnh một pixel nào. Trả
 *    ứng viên ở bậc đó là bịa một khối rồi dán nhãn "từ ảnh". Xem `demXetDauVao()`.
 *  ④ KHÔNG NHÂN BẢN DANH TÍNH. Khối sinh ra là BIỂU DIỄN của chính asset ảnh đó
 *    (`bieuDienCuaUngVien().entityId === ungVien.nguon.id`), không phải một asset mới.
 *  ⑤ NGƯỜI XÁC NHẬN KHÔNG XOÁ DẤU VẾT MÁY. `nhanUngVien()` nâng cờ lên `verified` nhưng GIỮ
 *    `flagMay` (cờ máy gốc) và `basis` — sau này cãi nhau còn tra được máy đã nói gì.
 *
 * ── 🔴 SỬA NGHĨA 20/08 — BỎ NGHI THỨC "GÕ LẠI SỐ ĐỂ MỞ KHOÁ SỰ THẬT" ──────────────────────────
 * Bản trước chốt *"chỉ chiều nào NGƯỜI GÕ LẠI SỐ mới thành `verified`"*, và test khoá đúng hành vi
 * đó. Hoà bác: **gõ lại một con số KHÔNG PHẢI bằng chứng — nó chỉ là gõ lại.** Bắt người dùng gõ
 * lại đúng con số máy vừa đưa để "mở khoá" là một nghi thức rỗng: nó không đối chiếu với thực tế
 * nào, không để lại tham chiếu nào, mà lại cấp cho con số đó thẩm quyền cao nhất.
 *
 * BỐN NGHĨA CANONICAL (Hoà chốt) — mỗi nghĩa một CĂN CỨ, không nghĩa nào suy ra nghĩa kia:
 *   · **MEASURED** — đo tất định, TRUY ĐƯỢC VẾT: hình học đáng tin · CAD · nguồn đã hiệu chỉnh.
 *   · **VERIFIED** — được XÁC NHẬN TƯỜNG MINH bởi nguồn đáng tin, hoặc bởi quy trình xác minh của
 *     con người (người ký phải nêu ĐỐI CHIẾU VỚI CÁI GÌ — không có tham chiếu thì không có xác
 *     minh, chỉ có một cái gật đầu).
 *   · **HUMAN OVERRIDE** — người CHỦ ĐỘNG cung cấp/ghi đè giá trị. Đủ thẩm quyền để dùng, nhưng
 *     dấu vết phải TƯỜNG MINH và không bao giờ được đọc nhầm thành "máy đo được".
 *   · **INFERRED** — ước lượng từ ảnh/AI/dựng lại, KHÔNG có phép đo tuyệt đối truy được vết.
 *
 * ── KIẾN TRÚC: CHỌN (b) — GIỮ BA NẤC, GHI ĐƯỜNG ĐI VÀO PROVENANCE ────────────────────────────────
 * KHÔNG thêm giá trị thứ tư vào `measured|inferred|verified` (bộ đó ~509 chỗ dùng, và §11 cấm đẻ
 * từ vựng thứ tư). Thay vào đó mỗi số mang thêm **CĂN CỨ** (`canCu: CanCuSuThat`) — *đường nào đưa
 * nó tới nấc đó*. `flag` KHÔNG còn được gán tay ở bất cứ đâu: nó LUÔN là `nacTuCanCu(canCu)`, nên
 * "human override bị dán nhãn measured" là chuyện **không biểu diễn nổi** trong kiểu dữ liệu, chứ
 * không phải chuyện phải nhớ đừng làm. Ba nấc để trả lời *"tin được tới đâu"*; căn cứ để trả lời
 * *"vì sao"* — hai câu hỏi khác nhau, và trước nay câu thứ hai chỉ nằm trong một chuỗi văn xuôi
 * (`basis`) mà không máy nào kiểm được.
 * `basis` GIỮ NGUYÊN vai chuỗi văn xuôi cho người đọc (mặt tiền đang hiện nó nguyên văn).
 */

import type { Entity } from '../cad/model';
import type { ProvenanceFlag } from '../idfc-import/from-photo';
import {
  measureObjectTiered,
  FURNITURE_SIZE_PRIORS,
  type FurnitureCategory,
  type MeasurementResult,
  type MeasurementValue,
  type ObjectSilhouette,
  type RgbaImage,
  type AnchorKind,
  type Pt2D,
} from '../vision/single-view-metrology';
import {
  buildFurnitureFromMeasurement,
  measurementToTarget,
  dimsAreUsable,
  unusableDimsMessage,
} from '../vision/to-cad';
import type { LibraryManifest } from '../cad/block-library';

/* ═══════════════════════════ KIỂU ═══════════════════════════ */

/** Nguồn ảnh — hai danh tính ảnh đang có thật trong schema. KHÔNG đẻ loại thứ ba. */
export interface NguonAnh {
  /** `libraryAsset` → `LibraryAsset.id` · `projectFile` → `ProjectFile.id` (schema.prisma). */
  loai: 'libraryAsset' | 'projectFile';
  id: string;
  /** URL hiển thị (blob/dataURL/route). CẤM persist dataURL — chỉ để xem trước tại chỗ. */
  imageUrl?: string;
}

/* ─────────────────── CĂN CỨ SỰ THẬT — đường nào đưa một số tới nấc của nó ─────────────────── */

/**
 * KHÔNG phải nấc thứ tư. Đây là trục THỨ HAI, vuông góc với `ProvenanceFlag`:
 * nấc nói *tin được tới đâu*, căn cứ nói *vì sao*.
 *
 * · ba căn cứ đầu → `measured` (đo tất định, truy được vết)
 * · hai căn cứ người → `verified` (xác nhận tường minh / người cung cấp giá trị)
 * · hai căn cứ cuối → `inferred` (ước lượng, không có phép đo tuyệt đối)
 */
export type CanCuSuThat =
  /** phép đo tất định trên hình học đã hiệu chỉnh (bậc 4 — điểm tụ + thang đo neo). */
  | 'deterministic-metrology'
  /** thang đo lấy từ một neo/kích thước thật đã hiệu chỉnh, rồi suy các chiều còn lại theo nó. */
  | 'calibrated'
  /** hình học đáng tin sẵn có: khối CAD, `.idfc` đã có số, bản vẽ đã ký. */
  | 'trusted-geometry'
  /** người xác nhận TƯỜNG MINH, có nêu đối chiếu với tham chiếu đáng tin nào. */
  | 'human-confirmed'
  /** người CHỦ ĐỘNG cung cấp/ghi đè giá trị (Sửa · Nhập kích thước đã biết). */
  | 'human-override'
  /** ước lượng từ ảnh/AI/dựng lại — không có phép đo tuyệt đối truy được vết. */
  | 'image-estimate'
  /** dải chuẩn nghề theo loại đồ — một con số trong sách, không nhìn ảnh. */
  | 'category-prior';

/**
 * ⛔ CHỖ DUY NHẤT quyết định nấc của một số. `flag` không được gán tay ở bất cứ đâu khác —
 * nhờ vậy "human-override mang nhãn measured" là điều KHÔNG BIỂU DIỄN NỔI, chứ không phải điều
 * phải nhớ để đừng làm.
 */
export const NAC_THEO_CAN_CU: Record<CanCuSuThat, ProvenanceFlag> = {
  'deterministic-metrology': 'measured',
  calibrated: 'measured',
  'trusted-geometry': 'measured',
  'human-confirmed': 'verified',
  'human-override': 'verified',
  'image-estimate': 'inferred',
  'category-prior': 'inferred',
};

export function nacTuCanCu(canCu: CanCuSuThat): ProvenanceFlag {
  return NAC_THEO_CAN_CU[canCu];
}

/** true khi con số này do NGƯỜI đưa ra, không phải máy đo. Dùng để giữ dấu vết nhìn thấy được. */
export function laNguoiDuaRa(canCu: CanCuSuThat): boolean {
  return canCu === 'human-override' || canCu === 'human-confirmed';
}

/**
 * Chữ xuất xứ hiện cho người đọc. CHỖ DUY NHẤT đặt tên cho căn cứ — mặt tiền và BOQ đều gọi vào
 * đây, để không nơi nào tự chế một cách gọi khác (nhất là không nơi nào gọi số người nhập là
 * "đo được").
 */
export function nhanXuatXu(canCu: CanCuSuThat): string {
  switch (canCu) {
    case 'deterministic-metrology':
      return 'đo tất định từ hình học đã hiệu chỉnh';
    case 'calibrated':
      return 'đo qua neo/kích thước đã hiệu chỉnh';
    case 'trusted-geometry':
      return 'lấy từ hình học đáng tin (CAD/.idfc)';
    case 'human-confirmed':
      return 'người xác nhận, có tham chiếu';
    case 'human-override':
      return 'người nhập tay';
    case 'image-estimate':
      return 'ước lượng từ ảnh';
    case 'category-prior':
      return 'dải chuẩn nghề theo loại đồ';
  }
}

/**
 * Một số đo kèm nguồn gốc.
 * `canCu` là đường đi HIỆN HÀNH, `canCuMay` là đường máy đã đi lúc đầu (luật ⑤ — người ký không
 * xoá dấu vết máy). `flag`/`flagMay` là hệ quả, luôn = `nacTuCanCu` của căn cứ tương ứng.
 */
export interface KichThuocCoNguon {
  valueMm: number;
  toleranceMm: number;
  flag: ProvenanceFlag;
  flagMay: ProvenanceFlag;
  canCu: CanCuSuThat;
  canCuMay: CanCuSuThat;
  /** neo/giả định máy đã dùng — nguyên văn `MeasurementValue.basis`, nối thêm vết người ký. */
  basis: string;
}

export type TrangThaiUngVien = 'deXuat' | 'daNhan' | 'daBo';

export interface UngVienKhoi3D {
  /** `i23_…` — luật vận hành #5 "output không có id thì không ship". */
  id: string;
  nguon: NguonAnh;
  category: FurnitureCategory;
  categoryLabel: string;

  /** Bậc phương pháp đo của `measureObjectTiered` (1..4) — KHÁC `AiTier` hệ thống. */
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  confidencePercent: number;
  /** Gợi ý cụ thể để lên bậc — hiện thẳng cho người dùng, đừng nuốt. */
  upgradeHint?: string;

  rong: KichThuocCoNguon;
  sau: KichThuocCoNguon;
  cao: KichThuocCoNguon;

  /** Mức sự thật TỔNG: nấc thấp nhất trong ba chiều (một chiều `inferred` ⇒ cả món `inferred`). */
  mucSuThat: ProvenanceFlag;

  /**
   * Khối 3D NHÁP: nét mặt bằng (`Entity[]` từ `buildFurnitureFromMeasurement`) đã gắn `heightMm`
   * ⇒ ống kính 3D hiện có (`docToObjScene`) đùn thành lăng trụ. CẤM đổ vào `Doc` khi
   * `trangThai !== 'daNhan'` (luật ①).
   */
  entities: Entity[];
  heightMm: number;
  /** Câu ngắn của bước ⑤: "Giống mẫu X 78%" / "Khối tạm — gần nhất mới 42%". */
  nhanKhop: string;
  /** true = chỉ hộp bao, chưa khớp mẫu nào ⇒ UI phải nói rõ, đừng để tưởng đã xong. */
  hopBaoTam: boolean;

  trangThai: TrangThaiUngVien;
  nguoiXacNhan?: string;
  ghiChu?: string;
}

/** Từ chối CÓ LÝ DO — không bao giờ trả rỗng câm (SPEC-NGON-NGU-CHI-DAN: luôn kèm việc làm tiếp). */
export interface TuChoi {
  lyDo: string;
  /** Việc người dùng làm để qua được — ngắn, hành động trước. */
  canLam: string[];
}

export type KetQuaDeXuat = { ok: true; ungVien: UngVienKhoi3D } | { ok: false; tuChoi: TuChoi };

export interface DauVaoDeXuat {
  nguon: NguonAnh;
  /** NGƯỜI DÙNG khai — máy KHÔNG đoán loại đồ (docstring `measureObjectTiered` cấm đoán bừa). */
  category: FurnitureCategory;
  /** Mặt nạ món đồ từ `ai.furnitureextract`/`ai.removebg` — điều kiện cần (luật ③). */
  silhouette?: ObjectSilhouette;
  image?: RgbaImage;
  cameraHeightMm?: number;
  knownWidthMm?: number;
  manualAnchor?: { kind: AnchorKind; points: [Pt2D, Pt2D]; realMm: number };
  /** manifest thư viện block cho bước khớp mẫu ⑤ — tầng UI nạp rồi truyền vào (giữ module thuần). */
  manifest?: LibraryManifest | null;
  name?: string;
  room?: string;
  /** đồng hồ tiêm được để test tất định (module thuần, không tự đọc `Date.now`). */
  now?: number;
  /** bộ sinh id tiêm được — cùng lý do trên. */
  genId?: () => string;
}

/* ═══════════════════════════ ① ĐỦ ĐIỀU KIỆN CHƯA ═══════════════════════════ */

/**
 * Cổng vào. Từ chối SỚM và NÓI THẲNG, thay vì dựng một khối trông-như-thật.
 *
 * 🔴 Ca quan trọng nhất (luật ③): không mặt nạ + không neo tay ⇒ `measureObjectTiered` rơi về
 * BẬC 1 = dải chuẩn nghề theo loại đồ. Bậc đó **không đọc ảnh một pixel nào** — nó trả trung điểm
 * dải cho MỌI cái ghế ăn trên đời. Gọi kết quả đó là "khối 3D từ ảnh này" là nói dối bằng hình.
 */
export function demXetDauVao(input: DauVaoDeXuat): TuChoi | null {
  if (!input.nguon?.id) {
    return { lyDo: 'Chưa biết ảnh nào.', canLam: ['Chọn một ảnh trong Thư viện hoặc Tệp dự án.'] };
  }
  if (!input.category || !(input.category in FURNITURE_SIZE_PRIORS)) {
    return {
      lyDo: 'Chưa khai loại đồ.',
      canLam: ['Chọn loại đồ (ghế, sofa, bàn ăn…) — máy không đoán hộ loại đồ.'],
    };
  }
  // 🔴 Bắt được lúc viết test 20/08: số người NHẬP mà hỏng (NaN/≤0) đang bị bỏ qua ÂM THẦM —
  // máy tụt xuống bậc thấp hơn rồi vẫn trả khối, người dùng tưởng con số mình gõ đã được dùng.
  // Bỏ qua im lặng một thứ người dùng chủ động nhập là nói dối bằng sự im lặng. Nói thẳng.
  const soNguoiNhap = ([
    ['chiều rộng thật', input.knownWidthMm],
    ['kích thước vật neo', input.manualAnchor?.realMm],
  ] as const).filter(([, v]) => v !== undefined && !(Number.isFinite(v) && (v as number) > 0));
  if (soNguoiNhap.length) {
    return {
      lyDo: `Số bạn nhập chưa dùng được: ${soNguoiNhap.map(([t]) => t).join(' · ')}.`,
      canLam: ['Nhập lại số dương theo mm, hoặc xoá trống để máy tự đo từ mặt nạ.'],
    };
  }

  const coMatNa = !!input.silhouette && input.silhouette.front.length >= 3;
  const coNeo = !!input.manualAnchor && input.manualAnchor.realMm > 0;
  const coRongBiet = !!input.knownWidthMm && input.knownWidthMm > 0;
  if (!coMatNa && !coNeo && !coRongBiet) {
    return {
      lyDo: 'Máy chưa đọc được gì từ ảnh này — số sẽ chỉ là dải chuẩn theo loại đồ, không phải từ ảnh.',
      canLam: [
        'Tách nền món đồ để có mặt nạ (Cắt nền / Tách món).',
        'Hoặc khoanh một vật neo và nhập kích thước thật của nó.',
        'Hoặc nhập chiều rộng thật nếu đã biết.',
      ],
    };
  }
  return null;
}

/* ═══════════════════════════ ② ĐỀ XUẤT KHỐI NHÁP ═══════════════════════════ */

/**
 * Máy đi đường nào tới con số này. `MeasurementValue` chỉ mang `kind` (2 giá trị) + văn xuôi, nên
 * căn cứ phải suy từ BẬC PHƯƠNG PHÁP — thứ nói đúng bản chất phép đo:
 *   · bậc 4 = hiệu chỉnh điểm tụ + thang đo neo ⇒ phép đo tất định.
 *   · bậc 2-3 `measured` = thang đo lấy từ một neo/kích thước thật rồi suy các chiều ⇒ `calibrated`.
 *   · `inferred` = dải chuẩn nghề (một con số trong sách) hoặc ước lượng từ ảnh.
 */
function canCuTuMay(v: MeasurementValue, tier: 1 | 2 | 3 | 4): CanCuSuThat {
  if (v.kind === 'measured') return tier >= 4 ? 'deterministic-metrology' : 'calibrated';
  return /chuẩn nghề/.test(v.basis) ? 'category-prior' : 'image-estimate';
}

function toKichThuoc(v: MeasurementValue, tier: 1 | 2 | 3 | 4): KichThuocCoNguon {
  const canCu = canCuTuMay(v, tier);
  return {
    valueMm: v.valueMm,
    toleranceMm: v.toleranceMm,
    // `flag` LUÔN suy từ căn cứ — không nơi nào trong file này gán nấc bằng tay.
    flag: nacTuCanCu(canCu),
    flagMay: nacTuCanCu(canCu),
    canCu,
    canCuMay: canCu,
    basis: v.basis,
  };
}

/** Nấc THẤP NHẤT thắng: inferred < measured < verified. Một chiều suy ⇒ cả món là suy. */
const THU_TU_NAC: ProvenanceFlag[] = ['inferred', 'measured', 'verified'];
export function nacThapNhat(flags: ProvenanceFlag[]): ProvenanceFlag {
  return THU_TU_NAC.find((f) => flags.includes(f)) ?? 'inferred';
}

/**
 * Chạy máy hiểu SẴN CÓ rồi gói thành ứng viên chờ duyệt. Thuần: không mạng, không DOM, không ghi
 * `Doc`. Luôn trả `trangThai:'deXuat'` (luật ①) và `mucSuThat` KHÔNG BAO GIỜ là `verified` ở đây —
 * `verified` chỉ đến từ chữ ký người (luật ⑤).
 */
export function deXuatKhoi3D(input: DauVaoDeXuat): KetQuaDeXuat {
  const tuChoiSom = demXetDauVao(input);
  if (tuChoiSom) return { ok: false, tuChoi: tuChoiSom };

  const do3 = measureObjectTiered({
    category: input.category,
    silhouette: input.silhouette,
    image: input.image,
    cameraHeightMm: input.cameraHeightMm,
    knownWidthMm: input.knownWidthMm,
    manualAnchor: input.manualAnchor,
  });

  const measurement: MeasurementResult = { width: do3.width, depth: do3.depth, height: do3.height };

  // Cổng số-đo-hỏng: DÙNG LẠI `dimsAreUsable` của to-cad.ts (đã trả giá 2 vòng phản biện 06/08),
  // không viết kiểm tra thứ hai ở đây — hai bộ kiểm là hai bộ sẽ phân kỳ.
  const target = measurementToTarget(measurement);
  if (!dimsAreUsable(target)) {
    return {
      ok: false,
      tuChoi: { lyDo: unusableDimsMessage(target), canLam: ['Đo lại hoặc nhập tay kích thước trước khi dựng khối.'] },
    };
  }

  const built = buildFurnitureFromMeasurement({
    measurement,
    at: { x: 0, y: 0 }, // NHÁP đứng ở gốc — điểm thả thật do người duyệt chọn lúc Nhận.
    category: input.category,
    silhouette: input.silhouette,
    manifest: input.manifest,
    name: input.name,
    room: input.room,
    imageUrl: input.nguon.imageUrl,
    now: input.now ?? 0,
  });

  const heightMm = Math.round(do3.height.valueMm);
  // Nét mặt bằng + `heightMm` = khối 3D trong từ vựng sẵn có (`docToObjScene` đùn lăng trụ).
  // KHÔNG sinh mesh, KHÔNG lưu hình học derive (luật K1: một Doc, không kho thứ hai).
  const entities: Entity[] = built.entities.map((e) => ({ ...e, heightMm }));

  const rong = toKichThuoc(do3.width, do3.tier);
  const sau = toKichThuoc(do3.depth, do3.tier);
  const cao = toKichThuoc(do3.height, do3.tier);

  const gen = input.genId ?? (() => `i23_${(input.now ?? 0).toString(36)}_${input.nguon.id}`);

  return {
    ok: true,
    ungVien: {
      id: gen(),
      nguon: input.nguon,
      category: input.category,
      categoryLabel: FURNITURE_SIZE_PRIORS[input.category].label,
      tier: do3.tier,
      tierLabel: do3.tierLabel,
      confidencePercent: do3.confidencePercent,
      upgradeHint: do3.upgradeHint,
      rong,
      sau,
      cao,
      mucSuThat: nacThapNhat([rong.flag, sau.flag, cao.flag]),
      entities,
      heightMm,
      nhanKhop: built.label,
      hopBaoTam: built.usedFallback,
      trangThai: 'deXuat',
    },
  };
}

/* ═══════════════════════════ ③ CỬA NGƯỜI DUYỆT ═══════════════════════════ */

/** NGƯỜI CUNG CẤP GIÁ TRỊ — "Sửa" và "Nhập kích thước đã biết" là CÙNG MỘT việc: người đưa số. */
export interface SuaKichThuoc {
  rongMm?: number;
  sauMm?: number;
  caoMm?: number;
}

/**
 * NGƯỜI XÁC NHẬN TƯỜNG MINH — mỗi chiều một câu **đối chiếu với cái gì** (URL trang hãng · mã bản
 * vẽ · số hợp đồng · "đo tay tại xưởng 20/08"). Chuỗi rỗng bị TỪ CHỐI: không có tham chiếu thì
 * không có xác minh, chỉ có một cái gật đầu — và một cái gật đầu chính là nghi thức vừa bị bác.
 */
export interface XacNhanKichThuoc {
  rong?: string;
  sau?: string;
  cao?: string;
}

/** Bốn hành động THẬT ở cửa duyệt — một nguồn cho mặt tiền, để không nơi nào tự chế nhãn khác. */
export const HANH_DONG_DUYET = [
  {
    id: 'xacNhan',
    nhan: 'Xác nhận',
    mo: 'Đối chiếu với một tham chiếu đáng tin (trang hãng · bản vẽ · đo tay) rồi ký.',
    canCu: 'human-confirmed' as CanCuSuThat,
  },
  {
    id: 'sua',
    nhan: 'Sửa',
    mo: 'Ghi đè số máy bằng số của bạn.',
    canCu: 'human-override' as CanCuSuThat,
  },
  {
    id: 'nhapDaBiet',
    nhan: 'Nhập kích thước đã biết',
    mo: 'Cung cấp kích thước bạn đã biết sẵn của món này.',
    canCu: 'human-override' as CanCuSuThat,
  },
  {
    id: 'hieuChinhLai',
    nhan: 'Hiệu chỉnh lại',
    mo: 'Khoanh vật neo / nhập chiều rộng thật rồi chạy lại phép đo — số mới là số MÁY đo, không phải số người nhập.',
    canCu: 'calibrated' as CanCuSuThat,
  },
] as const;

/**
 * NHẬN — người đã xem và ký.
 *
 * 🔴 SỬA NGHĨA 20/08 — BỎ NGHI THỨC "GÕ LẠI ĐÚNG SỐ MÁY ĐỂ MỞ KHOÁ".
 * Bản trước: gõ lại con số máy vừa đưa ⇒ `verified`, `basis` ghi *"người nhập tay xác nhận đúng số
 * máy"*. Hoà bác: **gõ lại một con số không phải bằng chứng — nó chỉ là gõ lại.** Người dùng không
 * đối chiếu với gì cả, không để lại tham chiếu nào, mà con số lại lên nấc cao nhất. Và nó bắt gõ
 * lại TỪNG CHIỀU, kể cả chiều ảnh 2D không thể thấy.
 *
 * LUẬT NAY — ba đường, mỗi đường một CĂN CỨ khác nhau:
 *   ① **người CUNG CẤP số** (`sua`, dùng cho cả "Sửa" lẫn "Nhập kích thước đã biết")
 *      ⇒ `human-override` ⇒ `verified`. Dùng được, nhưng dấu vết là *người nhập*, VĨNH VIỄN không
 *      bao giờ được đọc thành *máy đo được*.
 *   ② **người XÁC NHẬN có tham chiếu** (`xacNhan`) ⇒ `human-confirmed` ⇒ `verified`. Giá trị GIỮ
 *      NGUYÊN số máy — người không gõ lại gì cả, người nêu ra mình đối chiếu với cái gì.
 *   ③ **để nguyên** ⇒ căn cứ máy GIỮ NGUYÊN (`inferred` vẫn là `inferred`), chỉ ghi vết đã có
 *      người nhìn. Xem qua không phải là đo, cũng không phải là xác minh.
 * Đường thứ tư — "Hiệu chỉnh lại" — KHÔNG nằm ở đây: nó quay lại `deXuatKhoi3D()` với neo mới, và
 * số ra là số MÁY đo (`calibrated`/`deterministic-metrology`), không đi qua tay người.
 *
 * Thuần: trả BẢN MỚI, không đổi tại chỗ — ứng viên cũ vẫn còn để so/hoàn tác.
 */
export function nhanUngVien(
  uv: UngVienKhoi3D,
  opts: { nguoiXacNhan: string; sua?: SuaKichThuoc; xacNhan?: XacNhanKichThuoc; ghiChu?: string },
): UngVienKhoi3D {
  if (uv.trangThai === 'daBo') {
    throw new Error('Ứng viên đã bỏ — không nhận lại được. Chạy lại đề xuất nếu muốn dùng.');
  }
  if (!opts.nguoiXacNhan) throw new Error('Nhận ứng viên phải có người ký — verified không có chủ là verified giả.');

  const ky = (ten: string, k: KichThuocCoNguon, moiMm: number | undefined, thamChieu: string | undefined): KichThuocCoNguon => {
    // Số người gõ mà hỏng: NÓI THẲNG. Nuốt im lặng rồi vẫn trả "đã nhận" là nói dối bằng sự im lặng.
    if (moiMm != null && !(Number.isFinite(moiMm) && moiMm > 0)) {
      throw new Error(`Số bạn nhập cho chiều ${ten} chưa dùng được — nhập số dương theo mm, hoặc để trống.`);
    }
    if (moiMm != null) {
      // ① NGƯỜI CUNG CẤP GIÁ TRỊ. Bằng hay khác số máy đều KHÔNG đổi bản chất: đây là số của người.
      const canCu: CanCuSuThat = 'human-override';
      return {
        valueMm: moiMm,
        toleranceMm: 0,
        flag: nacTuCanCu(canCu),
        flagMay: k.flagMay,
        canCu,
        canCuMay: k.canCuMay,
        basis: `người nhập tay: ${opts.nguoiXacNhan} (máy trước đó: ${k.valueMm}mm — ${k.basis})`,
      };
    }
    const tc = thamChieu?.trim();
    if (thamChieu != null && !tc) {
      throw new Error(
        `Xác nhận chiều ${ten} phải nêu đối chiếu với cái gì (trang hãng · bản vẽ · đo tay) — gật đầu suông không phải xác minh.`,
      );
    }
    if (tc) {
      // ② NGƯỜI XÁC NHẬN TƯỜNG MINH. Số máy giữ nguyên; thứ được thêm vào là THAM CHIẾU.
      const canCu: CanCuSuThat = 'human-confirmed';
      return {
        ...k,
        flag: nacTuCanCu(canCu),
        canCu,
        basis: `${k.basis} · ${opts.nguoiXacNhan} xác nhận, đối chiếu: ${tc}`,
      };
    }
    // ③ ĐỂ NGUYÊN — không đụng căn cứ, không đụng nấc.
    return { ...k, basis: `${k.basis} · người duyệt đã xem, không sửa: ${opts.nguoiXacNhan}` };
  };

  const rong = ky('rộng', uv.rong, opts.sua?.rongMm, opts.xacNhan?.rong);
  const sau = ky('sâu', uv.sau, opts.sua?.sauMm, opts.xacNhan?.sau);
  const cao = ky('cao', uv.cao, opts.sua?.caoMm, opts.xacNhan?.cao);
  const heightMm = Math.round(cao.valueMm);

  return {
    ...uv,
    rong,
    sau,
    cao,
    mucSuThat: nacThapNhat([rong.flag, sau.flag, cao.flag]),
    heightMm,
    entities: uv.entities.map((e) => ({ ...e, heightMm })),
    trangThai: 'daNhan',
    nguoiXacNhan: opts.nguoiXacNhan,
    ghiChu: opts.ghiChu ?? uv.ghiChu,
  };
}

/** BỎ — `entities` xoá sạch để không ai lỡ tay đổ nháp đã bỏ vào `Doc`. */
export function boUngVien(uv: UngVienKhoi3D, lyDo?: string): UngVienKhoi3D {
  return { ...uv, trangThai: 'daBo', entities: [], ghiChu: lyDo ?? uv.ghiChu };
}

/** Nháp chỉ được rời cửa duyệt khi đã Nhận. Nơi gọi `addEntities` PHẢI hỏi hàm này trước. */
export function duocDoVaoDoc(uv: UngVienKhoi3D): boolean {
  return uv.trangThai === 'daNhan' && uv.entities.length > 0;
}

/* ═══════════════════════════ ④ CỔNG BOQ ═══════════════════════════ */

/** Xuất xứ MỘT chiều, đã thành chữ — thứ phải đi kèm con số vào hồ sơ, không được rụng dọc đường. */
export interface XuatXuChieu {
  ten: 'rộng' | 'sâu' | 'cao';
  canCu: CanCuSuThat;
  flag: ProvenanceFlag;
  /** ví dụ "người nhập tay" — CẤM nơi nào tự chế chữ khác, nhất là chữ "đo được". */
  nhan: string;
}

export interface CongBoq {
  duoc: boolean;
  lyDo: string;
  /** Luôn đủ ba chiều, kể cả khi `duoc === false` — hồ sơ phải nói được từng số ở đâu ra. */
  xuatXu: XuatXuChieu[];
  /** Có mặt khi trong số vào BOQ có số do NGƯỜI đưa ra. Hiện lên, đừng nuốt. */
  canhBao?: string;
}

export function xuatXuBoq(uv: UngVienKhoi3D): XuatXuChieu[] {
  return ([['rộng', uv.rong], ['sâu', uv.sau], ['cao', uv.cao]] as const).map(([ten, k]) => ({
    ten,
    canCu: k.canCu,
    flag: k.flag,
    nhan: nhanXuatXu(k.canCu),
  }));
}

/**
 * Hoà chốt 15/08: *"BOQ chỉ lấy giá trị chính xác đến từ con số"* — không cột "tạm tính", không
 * cờ độ tin cậy trong BOQ. Một chiều còn `inferred` là CẢ MÓN đứng ngoài BOQ.
 *
 * 🔴 SỬA NGHĨA 20/08 — hợp đồng này VẪN cho `verified` (gồm cả `human-override`) vào BOQ, và đó là
 * đúng: người cung cấp giá trị thì giá trị đó dùng được. Thứ **CẤM TUYỆT ĐỐI** là để nó vào rồi
 * **dán lại nhãn `measured`** — biến *"người bảo thế"* thành *"máy đo được"* là loại nói dối nguy
 * hiểm nhất trong một bộ hồ sơ nghề, vì nó không còn chỗ nào để phát hiện ngược. ⇒ cổng này luôn
 * trả kèm `xuatXu` đủ ba chiều, và `canhBao` khi có số của người — dấu vết NHÌN THẤY ĐƯỢC, không
 * phải một trường ẩn trong provenance.
 *
 * ƯU TIÊN `MEASURED`: khi người ghi đè lên một chiều máy VỐN ĐÃ đo được, cảnh báo nói thẳng ra —
 * đó là ca duy nhất mà việc người nhập tay làm chất lượng số đi XUỐNG.
 */
export function duocVaoBoq(uv: UngVienKhoi3D): CongBoq {
  const xuatXu = xuatXuBoq(uv);
  if (uv.trangThai !== 'daNhan') {
    return { duoc: false, lyDo: 'Khối còn là đề xuất chưa duyệt — BOQ chỉ nhận số đã được người duyệt.', xuatXu };
  }
  const suy = xuatXu.filter((x) => x.flag === 'inferred').map((x) => x.ten);
  if (suy.length) {
    return { duoc: false, lyDo: `Số ${suy.join(' · ')} còn là suy từ ảnh — BOQ chỉ nhận số đo được.`, xuatXu };
  }
  const nguoiDua = xuatXu.filter((x) => laNguoiDuaRa(x.canCu));
  const deLen = ([['rộng', uv.rong], ['sâu', uv.sau], ['cao', uv.cao]] as const)
    .filter(([, k]) => k.canCu === 'human-override' && k.flagMay === 'measured')
    .map(([t]) => t);
  const canhBao = nguoiDua.length
    ? `Số ${nguoiDua.map((x) => `${x.ten} (${x.nhan})`).join(' · ')} đến từ người, không phải máy đo — giữ nguyên xuất xứ này trong hồ sơ.` +
      (deLen.length ? ` Riêng ${deLen.join(' · ')} là ghi đè lên số máy VỐN ĐÃ đo được — ưu tiên số đo nếu không có lý do rõ.` : '')
    : undefined;
  return {
    duoc: true,
    lyDo: 'Ba chiều đã đo được hoặc đã có người đưa ra kèm dấu vết.',
    xuatXu,
    canhBao,
  };
}

/* ═══════════════════════════ ⑤ BIỂU DIỄN — KHÔNG NHÂN BẢN DANH TÍNH ═══════════════════════════ */

/** Hệ thống nguồn cho `ExternalRef.system` — chuỗi tự do theo đúng thiết kế cột đó (00-CHOT 07/08). */
export const HE_BIEU_DIEN = 'if:image-to-3d' as const;

/**
 * Hàng `ExternalRef` gắn khối vừa duyệt vào CHÍNH danh tính ảnh gốc.
 *
 * 🔴 GIỚI HẠN KHAI THẬT (§4 phiếu — schema là cửa người, KHÔNG tự thêm cột): `ExternalRef` chỉ neo
 * được MỘT cặp (system, externalId) → (entityType, entityId). Nó nói được *"ảnh này có một biểu
 * diễn khối 3D tên X"* nhưng KHÔNG lưu được bản thân khối, cũng không phân biệt "biểu diễn 2D" với
 * "biểu diễn 3D" bằng một trường có kiểu. Hình dạng schema ĐÚNG cho phiếu sau: một bảng
 * `AssetRepresentation{ assetId, kind: '2d'|'3d'|'mesh', payloadRef, provenance, verifiedBy }` —
 * đề xuất, chưa làm.
 */
export interface BieuDienKhoi3D {
  system: typeof HE_BIEU_DIEN;
  /** id ứng viên — định danh của BIỂU DIỄN, không phải của asset. */
  externalId: string;
  entityType: 'LibraryAsset' | 'ProjectFile';
  /** ĐÚNG id ảnh gốc. Bằng nhau là bằng chứng không nhân bản danh tính (luật ④). */
  entityId: string;
  lastWriteBy: string;
}

export function bieuDienCuaUngVien(uv: UngVienKhoi3D): BieuDienKhoi3D {
  if (uv.trangThai !== 'daNhan') {
    throw new Error('Chưa duyệt thì chưa gắn biểu diễn — máy sinh là đề xuất, không phải sự thật.');
  }
  return {
    system: HE_BIEU_DIEN,
    externalId: uv.id,
    entityType: uv.nguon.loai === 'libraryAsset' ? 'LibraryAsset' : 'ProjectFile',
    entityId: uv.nguon.id,
    lastWriteBy: uv.nguoiXacNhan ?? 'unknown',
  };
}

/** Tóm tắt một dòng cho cửa Xem trước — ≤ mức đọc lướt, số + nguồn, không hứa hẹn. */
export function tomTatUngVien(uv: UngVienKhoi3D): string {
  const r = Math.round(uv.rong.valueMm);
  const s = Math.round(uv.sau.valueMm);
  const c = Math.round(uv.cao.valueMm);
  // Nhãn lấy từ CĂN CỨ của chiều yếu nhất, không lấy từ nấc — hai chiều cùng `verified` có thể đến
  // từ hai đường rất khác nhau (người nhập tay ↔ người xác nhận có tham chiếu).
  const yeuNhat = ([uv.rong, uv.sau, uv.cao] as const).reduce((a, b) =>
    THU_TU_NAC.indexOf(a.flag) <= THU_TU_NAC.indexOf(b.flag) ? a : b,
  );
  return `${uv.categoryLabel} ${r}×${s}×${c}mm — ${nhanXuatXu(yeuNhat.canCu)} · ${uv.tierLabel} ${uv.confidencePercent}%`;
}
