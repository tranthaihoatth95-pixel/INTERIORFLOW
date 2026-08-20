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

/** Một số đo kèm nguồn gốc. `flag` là cờ HIỆN HÀNH; `flagMay` là cờ MÁY nói lúc đầu (luật ⑤). */
export interface KichThuocCoNguon {
  valueMm: number;
  toleranceMm: number;
  flag: ProvenanceFlag;
  flagMay: ProvenanceFlag;
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

function toKichThuoc(v: MeasurementValue): KichThuocCoNguon {
  // `MeasurementValue.kind` chỉ có 'measured'|'inferred' — ánh xạ 1-1, KHÔNG dịch sang từ khác.
  return { valueMm: v.valueMm, toleranceMm: v.toleranceMm, flag: v.kind, flagMay: v.kind, basis: v.basis };
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

  const chung = {
    category: input.category,
    silhouette: input.silhouette,
    cameraHeightMm: input.cameraHeightMm,
    knownWidthMm: input.knownWidthMm,
    manualAnchor: input.manualAnchor,
  };
  let do3 = measureObjectTiered({ ...chung, image: input.image });
  let measurement: MeasurementResult = { width: do3.width, depth: do3.depth, height: do3.height };

  // Cổng số-đo-hỏng: DÙNG LẠI `dimsAreUsable` của to-cad.ts (đã trả giá 2 vòng phản biện 06/08),
  // không viết kiểm tra thứ hai ở đây — hai bộ kiểm là hai bộ sẽ phân kỳ.
  let target = measurementToTarget(measurement);

  // 🔴 TỤT BẬC KHI BẬC 4 TRẢ SỐ RỖNG — bắt được trên app thật 20/08, ảnh "Ghế bar Lincoln 327":
  // `measureObjectTiered` hứa *"tự tụt phương pháp"*, nhưng `tryTier4` chỉ tụt khi hiệu chỉnh
  // camera BÁO THẤT BẠI. Ca ở đây khác: nó báo THÀNH CÔNG rồi trả `rộng=0 · sâu=0 · cao=0`
  // ⇒ không nhánh nào tụt, và cả dây chuyền chết ở cổng số-đo-hỏng dù bậc 2/3 thừa sức đo ảnh đó.
  // Chữa ĐÚNG TẦNG: `lib/vision` là tầng phương pháp (ngoài vùng ghi của lượt này, và sửa ở đó
  // đụng cả node `vision.measureobject`), nên tầng dây chuyền tự lo — thử lại KHÔNG kèm ảnh để
  // rơi xuống bậc neo/mặt nạ. Không bịa số: nếu bậc dưới cũng hỏng thì vẫn TỪ CHỐI như cũ.
  if (!dimsAreUsable(target) && input.image) {
    do3 = measureObjectTiered({ ...chung, image: undefined });
    measurement = { width: do3.width, depth: do3.depth, height: do3.height };
    target = measurementToTarget(measurement);
  }

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

  const rong = toKichThuoc(do3.width);
  const sau = toKichThuoc(do3.depth);
  const cao = toKichThuoc(do3.height);

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

export interface SuaKichThuoc {
  rongMm?: number;
  sauMm?: number;
  caoMm?: number;
}

/**
 * NHẬN — người đã xem và ký.
 *
 * 🔴 SỬA 20/08 (LANE Ảnh→Spec) — BẢN ĐẦU NÂNG **CẢ BA CHIỀU** LÊN `verified` CHỈ VÌ MỘT CÚ BẤM
 * "Nhận". Đó là **suy-ra lọt thành đã-kiểm**: người duyệt nhìn ba con số, gật một cái, và chiều
 * SÂU — thứ ảnh 2D **không thể** thấy (`tier3` ghi thẳng vào `basis`: *"ảnh 2D không thấy mặt
 * sau"*) — bỗng thành số đo được và **đi thẳng vào BOQ**. Sai luật ở ba chỗ độc lập:
 *   · luật ⑤ ngay đầu file này: người xác nhận KHÔNG xoá dấu vết máy;
 *   · `prisma/schema.prisma` `AssetRepresentation.truthLevel`: *"bấm 'Nhận' KHÔNG tự nâng cả ba
 *     chiều lên verified — chỉ chiều nào người GÕ LẠI SỐ mới được verified"*;
 *   · Hoà chốt 15/08: *"BOQ chỉ lấy giá trị chính xác đến từ con số"*.
 * Và test cũ (`:110` *"người ký → cả ba chiều verified"*) **khoá đúng hành vi hỏng** — đúng họ
 * bệnh đã rút thành luật ở vụ Hough 15/08: test khẳng định một hình dạng sai thì nó che bug.
 *
 * ⇒ LUẬT NAY: **chỉ chiều người GÕ LẠI SỐ mới lên `verified`**. Chiều để nguyên GIỮ cờ máy
 * (`inferred` vẫn là `inferred`), chỉ ghi thêm vào `basis` rằng người duyệt đã xem mà không sửa.
 * Gõ lại ĐÚNG con số máy vẫn tính là kiểm — người đã đối chiếu với thực tế và ký tên vào nó.
 *
 * Thuần: trả BẢN MỚI, không đổi tại chỗ — ứng viên cũ vẫn còn để so/hoàn tác.
 */
export function nhanUngVien(
  uv: UngVienKhoi3D,
  opts: { nguoiXacNhan: string; sua?: SuaKichThuoc; ghiChu?: string },
): UngVienKhoi3D {
  if (uv.trangThai === 'daBo') {
    throw new Error('Ứng viên đã bỏ — không nhận lại được. Chạy lại đề xuất nếu muốn dùng.');
  }
  if (!opts.nguoiXacNhan) throw new Error('Nhận ứng viên phải có người ký — verified không có chủ là verified giả.');

  const ky = (k: KichThuocCoNguon, moiMm?: number): KichThuocCoNguon => {
    const goLai = moiMm != null && Number.isFinite(moiMm) && moiMm > 0;
    if (!goLai) {
      // KHÔNG đụng `flag`: xem qua không phải là đo. Chỉ ghi vết đã có người nhìn.
      return { ...k, basis: `${k.basis} · người duyệt đã xem, không sửa: ${opts.nguoiXacNhan}` };
    }
    const doiSo = moiMm !== k.valueMm;
    return {
      valueMm: moiMm,
      toleranceMm: 0,
      flag: 'verified',
      flagMay: k.flagMay,
      basis: doiSo
        ? `người nhập tay: ${opts.nguoiXacNhan} (máy trước đó: ${k.valueMm}mm — ${k.basis})`
        : `người nhập tay xác nhận đúng số máy: ${opts.nguoiXacNhan} (${k.basis})`,
    };
  };

  const rong = ky(uv.rong, opts.sua?.rongMm);
  const sau = ky(uv.sau, opts.sua?.sauMm);
  const cao = ky(uv.cao, opts.sua?.caoMm);
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

/**
 * Hoà chốt 15/08: *"BOQ chỉ lấy giá trị chính xác đến từ con số"* — không cột "tạm tính", không
 * cờ độ tin cậy trong BOQ. Một chiều còn `inferred` là CẢ MÓN đứng ngoài BOQ.
 * Muốn vào thì người sửa tay/ký (cơ chế sửa tay đã có: `lib/present-editor/boq-overrides.ts`).
 */
export function duocVaoBoq(uv: UngVienKhoi3D): { duoc: boolean; lyDo: string } {
  if (uv.trangThai !== 'daNhan') {
    return { duoc: false, lyDo: 'Khối còn là đề xuất chưa duyệt — BOQ chỉ nhận số đã được người duyệt.' };
  }
  const suy = ([['rộng', uv.rong], ['sâu', uv.sau], ['cao', uv.cao]] as const)
    .filter(([, k]) => k.flag === 'inferred')
    .map(([t]) => t);
  if (suy.length) {
    return { duoc: false, lyDo: `Số ${suy.join(' · ')} còn là suy từ ảnh — BOQ chỉ nhận số đo được.` };
  }
  return { duoc: true, lyDo: 'Ba chiều đã đo được hoặc đã có người xác nhận.' };
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
  const nhan =
    uv.mucSuThat === 'verified' ? 'người xác nhận' : uv.mucSuThat === 'measured' ? 'đo được' : 'suy từ ảnh';
  return `${uv.categoryLabel} ${r}×${s}×${c}mm — ${nhan} · ${uv.tierLabel} ${uv.confidencePercent}%`;
}
