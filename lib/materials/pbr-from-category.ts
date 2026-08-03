/**
 * lib/materials/pbr-from-category.ts — "ATLAS map PBR suy từ Danh mục", `SPEC-VAT-LIEU-PBR-IF`
 * §4 mục 2: ATLAS sync (`lib/lark/atlas-material-map.ts`) chưa có trường PBR đo thật — pha 1 gán
 * roughness/metallic THEO TÊN DANH MỤC (chuỗi tự do người dùng gõ trong Lark, vd "Gỗ tự nhiên",
 * "Đá bóng", "Vải bọc ghế"...), dùng làm giá trị khởi tạo tạm cho tới khi có đo thật.
 *
 * ⚠️ CỐ Ý KHÔNG import từ `atlas-material-map.ts` / không đụng `AtlasMaterialUpsertData`: PBR là
 * dữ liệu THỊ GIÁC, `AtlasMaterialUpsertData`→`ProductSpec` là THƯƠNG MẠI — luật 2.1.9.i (30/07,
 * xem docstring `lib/cad/materials.ts`) cấm trộn 2 nhịp sống đó. Hàm này nhận đúng 1 chuỗi
 * "Danh mục" thô (không quan tâm nó tới từ Lark hay gõ tay ở đâu khác) → trả PBR gợi ý, để phía
 * gọi (route sync hoặc UI) tự quyết gán vào đâu.
 *
 * KHÔNG phải bảng đo — là quy tắc nhớ thô (rule of thumb) cho 2026, dựa trên đặc tính vật lý phổ
 * biến của từng nhóm vật liệu nội thất VN hay dùng. 3 mốc "Gỗ→0.6 · Đá bóng→0.15 · Vải→0.9" lấy
 * ĐÚNG NGUYÊN VĂN ví dụ trong spec §4-2; các dòng còn lại là suy luận thêm theo cùng logic, CHƯA
 * đối chiếu đo đạc thật — luôn trả `suyDoan: true`, không có ngoại lệ.
 *
 * ⚠️ GIỚI HẠN ĐÃ BIẾT: sau khi bỏ dấu, "đá" (stone) và "da" (leather/skin) trùng thành cùng 1
 * chuỗi "da" — 2 từ tiếng Việt khác nghĩa nhưng không phân biệt được nếu chỉ so bằng chuỗi thô 1
 * từ. Vì vậy hàm này CỐ Ý không có rule bắt riêng chuỗi "da" trơ 1 từ cho cả 2 nghĩa — chỉ bắt
 * khi có thêm ngữ cảnh (cụm 2+ từ: "đá tự nhiên"/"da thật"...). Danh mục ghi vỏn vẹn "Đá" hoặc
 * "Da" không kèm gì thêm sẽ rơi vào FALLBACK trung tính — thà không suy đoán còn hơn suy sai 50%
 * số lần vì admin, đúng tinh thần "suyDoan" của spec.
 */

/** Kết quả suy đoán — cố ý KHÔNG dùng `MaterialPbr` đầy đủ, chỉ 2 trường bảng ví dụ spec nêu. */
export interface InferredPbr {
  roughness: number;
  metallic: 0 | 1;
  /** Luôn true — hàm này không có đường trả về "chắc chắn". */
  suyDoan: true;
}

/** Bỏ dấu tiếng Việt + hạ chữ thường, để so khớp từ khoá không phụ thuộc cách gõ dấu. */
function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

/**
 * Mỗi rule: mảng CỤM từ khoá đã bỏ dấu (so khớp `includes` trên chuỗi đầy đủ, không phải so
 * từng từ) → giá trị suy đoán. THỨ TỰ MẢNG QUAN TRỌNG — rule càng cụ thể phải đứng CÀNG TRƯỚC,
 * vì hàm quét từ đầu và rule khớp đầu tiên thắng (vd "da bong" phải trước rule đá chung, nếu có).
 * Toàn bộ từ khoá ở đây đều ≥2 từ (cụm), tránh đúng bẫy "đá"/"da" nêu ở docstring trên.
 */
const CATEGORY_RULES: { keywords: string[]; roughness: number; metallic: 0 | 1 }[] = [
  // Kim loại — metallic=1 là đặc biệt, đặt sớm cho rõ ý dù không đụng từ khoá nhóm khác.
  { keywords: ['kim loai', 'inox', 'thep khong gi', 'nhom', 'dong thau', 'sat son'], roughness: 0.3, metallic: 1 },
  // Đá bóng/mài bóng — ví dụ spec §4-2: "Đá bóng→0.15" nguyên văn. Trước rule đá chung.
  { keywords: ['da bong', 'da mai bong', 'granite bong', 'marble bong', 'polished'], roughness: 0.15, metallic: 0 },
  // Đá chung (thô/tự nhiên chưa đánh bóng) — chỉ bắt cụm ≥2 từ, KHÔNG bắt "đá" trơ (xem giới hạn đầu file).
  { keywords: ['da tu nhien', 'da tho', 'da op lat', 'granite', 'marble', 'travertine', 'sa thach'], roughness: 0.5, metallic: 0 },
  // Gỗ — ví dụ spec: "Gỗ→0.6" nguyên văn. "go" 1 từ AN TOÀN hơn "da" vì không trùng nghĩa khác.
  { keywords: ['go tu nhien', 'go cong nghiep', 'go'], roughness: 0.6, metallic: 0 },
  // Vải — ví dụ spec: "Vải→0.9" nguyên văn.
  { keywords: ['vai', 'fabric', 'boc ghe', 'rem cua'], roughness: 0.9, metallic: 0 },
  // Thảm — nhám hơn cả vải thường (sợi rối, không phẳng).
  { keywords: ['tham'], roughness: 0.95, metallic: 0 },
  // Da thật/da công nghiệp (leather) — CHỈ cụm ≥2 từ, không bắt "da" trơ (xem giới hạn đầu file).
  { keywords: ['da that', 'da cong nghiep', 'leather', 'simili'], roughness: 0.45, metallic: 0 },
  // Kính — nhẵn gần gương, roughness thấp (transmission/ior nằm ngoài phạm vi hàm này).
  { keywords: ['kinh cuong luc', 'kinh trong', 'kinh mo', 'kinh'], roughness: 0.05, metallic: 0 },
  // Gạch/ceramic/sứ — men bóng vừa phải.
  { keywords: ['gach men', 'ceramic', 'gach', 'su ve sinh'], roughness: 0.25, metallic: 0 },
  // Sơn bóng trước sơn thường (cụ thể hơn phải đứng trước).
  { keywords: ['son bong'], roughness: 0.35, metallic: 0 },
  { keywords: ['son'], roughness: 0.55, metallic: 0 },
];

/** Không khớp rule nào — mốc trung tính, KHÔNG bịa theo hướng nào (không quá bóng, không quá nhám). */
const FALLBACK: { roughness: number; metallic: 0 | 1 } = { roughness: 0.5, metallic: 0 };

/**
 * Suy PBR từ 1 chuỗi Danh mục thô. Thuần — không đụng FS/network, test được trực tiếp.
 * Chuỗi rỗng/undefined → fallback trung tính (không throw, để pha sync không vỡ vì thiếu field).
 */
export function inferPbrFromCategory(categoryRaw: string | null | undefined): InferredPbr {
  const norm = stripDiacritics((categoryRaw ?? '').trim());
  if (!norm) return { ...FALLBACK, suyDoan: true };
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => norm.includes(kw))) {
      return { roughness: rule.roughness, metallic: rule.metallic, suyDoan: true };
    }
  }
  return { ...FALLBACK, suyDoan: true };
}
