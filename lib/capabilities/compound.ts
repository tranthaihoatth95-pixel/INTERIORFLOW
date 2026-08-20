/**
 * lib/capabilities/compound.ts — NĂNG LỰC GỘP (Compound Capability): MỘT ý định người dùng che
 * MỘT dây chuyền phức tạp.
 *
 * ── VÌ SAO CÓ FILE NÀY (negative evidence, luật B25 NO-REBUILD) ────────────────────────────────
 * Đo 20/08 trước khi tạo mới:
 *   · `lib/nodes/registry.ts` — CÓ 16 node `ai.*` (sketch2render · clay2render · styletransfer ·
 *     image2video · text2video · relight · upscale · materialswap · removebg …). Đây là các
 *     LỆNH NỘI BỘ, không phải ý định người dùng. GIỮ NGUYÊN, file này chỉ TRỎ VÀO.
 *   · `lib/ai/providers/` — CÓ trừu tượng nhà cung cấp (comfyui · fal · sd · nvidia · ollama).
 *     Không hardcode IF vào một provider. GIỮ NGUYÊN.
 *   · `lib/commands/registry.ts` — CÓ `CommandDef` với `stages`/`icon`/`when`. Đây là sổ LỆNH
 *     ĐƠN cấp thao tác (vẽ tường, xoay, chép). Năng lực gộp là tầng TRÊN nó, khác hạt.
 *   · `lib/commands/toolbar-source.ts` — CÓ `commonCommandsFor(ctx)` + `bindStage()`: nguồn của
 *     thanh công cụ theo chặng. Stage Toolbelt EXTEND cái này, KHÔNG viết nguồn thứ hai.
 *   · `lib/gateway/capabilities.ts` — CÓ `FormatCapability`, nhưng trả lời câu KHÁC HẲN:
 *     "định dạng tệp này làm được gì ở chặng nào", không phải "người dùng muốn làm gì".
 *   · `lib/types.ts` — CÓ `RunStatus`/`FlowRunStatus` + `render-queue-store` = trạng thái việc
 *     ĐÃ CÓ. KHÔNG đẻ job model thứ hai (luật §20 phiếu Frontier).
 * ⇒ Thứ DUY NHẤT chưa tồn tại: bảng ánh xạ **ý định người dùng → nhiều lệnh nội bộ**, kèm nơi
 *   xuất hiện và ba nấc chiều sâu. Đó là toàn bộ nội dung file này. Không có logic sinh ảnh,
 *   không có gọi provider, không có UI — chỉ DỮ LIỆU KHAI BÁO thuần (cùng lối `lib/` thuần của
 *   `commands/registry.ts`).
 *
 * ── LUẬT KHÔNG ĐƯỢC PHÁ ────────────────────────────────────────────────────────────────────────
 *  ① MỘT năng lực = MỘT icon = MỘT tên xuyên toàn app. Đổi chặng thì NGỮ CẢNH bên trong đổi,
 *    identity KHÔNG đổi (§6 phiếu). Cấm một-icon-cho-mỗi-lệnh-backend.
 *  ② Rail toàn cục KHÔNG nhận năng lực nào ở đây. Rail trả lời "tôi đang ở đâu"; năng lực trả lời
 *    "ở đây tôi làm được gì" — sống ở Toolbelt/near-pointer/inspector/ToolWindow (§1, §34).
 *  ③ Ba nấc chiều sâu là NGHĨA khác nhau, không phải cùng một bảng to/nhỏ (luật ba-nấc 16/08):
 *    nhanh = ý định tối thiểu · xem kỹ = núm hay dùng · chuyên sâu = provider/model/tham số.
 *  ④ Máy sinh ra là ĐỀ XUẤT, không phải sự thật: mọi năng lực ở đây bắt buộc `deXuat: true`
 *    ⇒ phải qua Xem trước → So → Nhận/Bỏ. Cấm ghi đè im lặng (§19).
 *  ⑤ Số đo suy từ ảnh là `inferred`, KHÔNG vào BOQ như số đo được (§11) — cờ `mucSuThat`.
 */

import type { Stage } from '../commands/registry';

/** Nơi một năng lực được phép xuất hiện — KHÔNG có 'rail': rail là bản đồ, không phải hộp đồ nghề. */
export type BeMat = 'canhTro' | 'toolbelt' | 'inspector' | 'toolWindow';

/** Ba nấc chiều sâu — ba NGHĨA, không phải ba cỡ (luật ba-nấc-ba-công-năng 16/08). */
export type NacSau = 'nhanh' | 'xemKy' | 'chuyenSau';

/**
 * Mức sự thật của đầu ra — quyết định nó được đi tới đâu.
 * `suyRa` = máy suy (ảnh → kích thước): dùng để bàn, CẤM vào BOQ.
 * `nguoiXacNhan` = người đã kiểm và ký.
 * `khongPhaiSoDo` = ảnh/phim: đẹp, nhưng không mang con số nào.
 * (Từ vựng cố ý ĐỒNG BỘ với cờ 3 nấc measured/inferred/verified đã chạy — xem lib/dna/types.ts.)
 */
export type MucSuThat = 'khongPhaiSoDo' | 'suyRa' | 'nguoiXacNhan';

export interface NangLucGop {
  /** id ổn định — dùng cho icon, phím tắt, provenance. Đổi id là vỡ tham chiếu. */
  id: string;
  /** [Việt, English] — MỘT tên duy nhất xuyên app (luật ①). */
  ten: [string, string];
  /** Một câu nói Ý ĐỊNH, không mô tả dây chuyền. Đích của tooltip (§7). */
  yDinh: [string, string];
  /** Tên icon lucide — MỘT icon xuyên app (luật ①), cùng lối khai `CommandDef.icon` (chuỗi, không import). */
  icon: string;
  /** Chặng nào năng lực này sống. Khai báo, không phải cổng thật (cổng thật là `sanSang`). */
  stages: Stage[];
  beMat: BeMat[];
  /**
   * Các node mà năng lực này điều phối — **BẮT BUỘC là `type` CÓ THẬT trong
   * `lib/nodes/registry.ts`**. TRỎ tới, KHÔNG chép định nghĩa. Nhiều id ở đây = một icon ở kia,
   * đó chính là điểm của "gộp".
   *
   * 🔴 SỬA 20/08 — lỗi của chính bản đầu tiên, do lane thi công bắt được: ba id
   * `vision.measureObjectTiered` · `idfc.fromPhoto` · `cad.campath` KHÔNG PHẢI node, chúng là
   * TÊN HÀM trong `lib/vision`/`lib/idfc-import`/`lib/cad`. Trộn hai bộ từ vựng vào một trường
   * ⇒ lane nào gọi `getDefinition(id)` theo khuôn sẽ ném lỗi. Nay tách: node ở đây, hàm ở
   * `hamNoiBo`. Có test canh (`compound.test.ts`) — thêm id ma là test đỏ.
   */
  lenhNoiBo: string[];
  /**
   * Máy nội bộ KHÔNG phải node — hàm/module trong `lib/`. Khai riêng vì chúng không tra được
   * qua registry node, và vì lẫn hai thứ này chính là lỗi vừa phải sửa ở trên.
   */
  hamNoiBo?: string[];
  /** Đầu ra mang mức sự thật nào (luật ⑤). */
  mucSuThat: MucSuThat;
  /** Luôn true ở tầng này (luật ④) — khai tường minh để ai bỏ nó phải cố ý. */
  deXuat: true;
  /** Nấc mặc định khi mở — luôn `nhanh` (§4/§18: phức tạp bên dưới ≠ nhiều núm bên trên). */
  nacMacDinh: NacSau;
}

/**
 * Bảng năng lực. Mỗi dòng là MỘT ý định người dùng.
 * ⛔ Thêm dòng = thêm một icon người dùng phải học ⇒ chỉ thêm khi đó thật sự là một Ý ĐỊNH khác,
 *    không phải một tuyến kỹ thuật khác của cùng ý định (tuyến kỹ thuật thì nhét vào `lenhNoiBo`).
 */
export const NANG_LUC_GOP: readonly NangLucGop[] = [
  {
    id: 'visual-generate',
    ten: ['Dựng hình ảnh', 'Visual Generate'],
    yDinh: [
      'Biến phác thảo, ảnh hoặc khung nhìn hiện tại thành phương án hình ảnh.',
      'Turn the current sketch, image or view into visual proposals.',
    ],
    icon: 'Sparkles',
    stages: ['cad', 'render', 'present'],
    beMat: ['canhTro', 'toolbelt', 'toolWindow'],
    lenhNoiBo: [
      'ai.sketch2render',
      'ai.clay2render',
      'ai.styletransfer',
      'ai.relight',
      'ai.upscale',
      'ai.materialswap',
      'ai.emptystaging',
    ],
    mucSuThat: 'khongPhaiSoDo',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
  {
    id: 'image-to-3d',
    ten: ['Ảnh thành khối', 'Image to 3D'],
    yDinh: [
      'Đọc một ảnh tham chiếu thành khối 3D nháp để xem và sửa.',
      'Read a reference image into a draft 3D candidate you can review.',
    ],
    icon: 'Box',
    stages: ['cad', 'render'],
    beMat: ['canhTro', 'toolbelt', 'toolWindow'],
    // KHÔNG có node nào cho việc này — máy thật là HÀM trong lib/ (đó là lý do trường `hamNoiBo`
    // tồn tại; bản đầu khai nhầm chúng thành node).
    lenhNoiBo: [],
    hamNoiBo: ['lib/vision/single-view-metrology#measureObjectTiered', 'lib/idfc-import/from-photo#buildIdfcFromPhoto'],
    mucSuThat: 'suyRa',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
  {
    id: 'render',
    ten: ['Kết xuất', 'Render'],
    yDinh: [
      'Kết xuất khung nhìn 3D hiện tại thành ảnh.',
      'Render the current 3D view into an image.',
    ],
    icon: 'Camera',
    stages: ['render'],
    beMat: ['toolbelt', 'inspector', 'toolWindow'],
    lenhNoiBo: ['ai.clay2render', 'ai.upscale'],
    mucSuThat: 'khongPhaiSoDo',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
  {
    id: 'motion',
    ten: ['Chuyển động', 'Motion'],
    yDinh: [
      'Cho một ảnh hoặc bản kết xuất đã nhận chuyển động thành phim ngắn.',
      'Give an accepted image or render motion as a short clip.',
    ],
    icon: 'Clapperboard',
    stages: ['render', 'present'],
    beMat: ['canhTro', 'toolbelt', 'toolWindow'],
    lenhNoiBo: ['ai.image2video', 'ai.text2video'],
    mucSuThat: 'khongPhaiSoDo',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
  {
    id: 'sequence',
    ten: ['Chuỗi khung', 'Sequence'],
    yDinh: [
      'Ghép đường máy quay và các khung đã nhận thành một chuỗi.',
      'Arrange a camera path and accepted frames into a sequence.',
    ],
    icon: 'Film',
    stages: ['render', 'present'],
    beMat: ['toolbelt', 'toolWindow'],
    // CamPath đã có thật nhưng là HÀM chứ không phải node — đây là CONNECT, không phải trình
    // dựng phim mới.
    lenhNoiBo: ['ai.image2video'],
    hamNoiBo: ['lib/cad/campath'],
    mucSuThat: 'khongPhaiSoDo',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
  {
    id: 'auto-grid',
    ten: ['Tự dàn trang', 'Auto Grid'],
    yDinh: [
      'Dàn các khối đang chọn thành bố cục có nhịp, xem trước rồi mới áp.',
      'Compose the selected blocks into a rhythmic layout you preview before applying.',
    ],
    icon: 'LayoutGrid',
    // RIÊNG của Trình chiếu (§16) — cố ý KHÔNG làm khung chung cho Home/Files.
    stages: ['present'],
    beMat: ['toolbelt', 'inspector'],
    lenhNoiBo: ['slide.composer'],
    mucSuThat: 'khongPhaiSoDo',
    deXuat: true,
    nacMacDinh: 'nhanh',
  },
] as const;

export function nangLucTheoStage(stage: Stage): NangLucGop[] {
  return NANG_LUC_GOP.filter((n) => n.stages.includes(stage));
}

export function nangLucTheoId(id: string): NangLucGop | undefined {
  return NANG_LUC_GOP.find((n) => n.id === id);
}

/**
 * Working set của Toolbelt: 4–8 năng lực (§2). Trả nguyên danh sách nếu đã ≤ trần —
 * KHÔNG tự ý cắt bớt khi chưa chạm trần, và KHÔNG bao giờ trả quá trần.
 */
export const TRAN_TOOLBELT = 8;

export function workingSet(stage: Stage): NangLucGop[] {
  return nangLucTheoStage(stage).slice(0, TRAN_TOOLBELT);
}
