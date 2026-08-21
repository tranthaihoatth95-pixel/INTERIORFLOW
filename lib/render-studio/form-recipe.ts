/**
 * lib/render-studio/form-recipe.ts — CÔNG THỨC HÌNH: lớp Ý ĐỊNH đặt trên `BuildRecipe.steps`.
 *
 * ⛔ KHÔNG có engine thứ hai. Ngăn xếp thật, thứ tự áp dụng, bật/tắt từng bước, tham số, lỗi từng
 * bước — tất cả đã sống ở `BuildRecipe`/`evalRecipe` (`lib/cad/model.ts` + `lib/three/build-recipe.ts`)
 * và UI đã có ở `Command3DPanel.BuildRecipeSection`. File này CHỈ trả lời một câu hỏi mà chưa ai
 * trả lời: *bước này phục vụ Ý ĐỊNH gì của người thiết kế?* — để danh sách phẳng 8 bước đọc ra
 * thành "hình chính · khoét · chi tiết · hoa văn" thay vì một chồng lệnh.
 *
 * VÌ SAO CẦN: KTS không nghĩ "bevelEx segments=6"; họ nghĩ "bo cạnh cho mềm". Nén phức tạp vào Ý
 * ĐỊNH mà KHÔNG giết khả năng sửa — người xem nhóm, engine vẫn giữ từng bước nguyên vẹn.
 *
 * THUẦN — không import three, không đụng Doc. Test bằng sucrase-node.
 */
import type { BuildOp, BuildRecipeStep } from '../cad/model';

/** Bốn ý định có THẬT hôm nay. Không khai nhóm rỗng cho đẹp bảng — xem `Y_DINH_CHUA_CO`. */
export type YDinhHinh = 'hinhChinh' | 'khoet' | 'chiTiet' | 'hoaVan';

export const NHAN_Y_DINH: Record<YDinhHinh, [string, string]> = {
  hinhChinh: ['Hình chính', 'Primary form'],
  khoet: ['Khoét', 'Openings'],
  chiTiet: ['Chi tiết', 'Detail'],
  hoaVan: ['Hoa văn', 'Pattern'],
};

/** Thứ tự BÀY RA cho mắt người — đi từ khối lớn tới chi tiết nhỏ, đúng cách người ta mô tả một
 *  món đồ. KHÔNG phải thứ tự áp dụng của engine (thứ tự đó là thứ tự mảng `steps`, do người dùng
 *  kéo). Hai thứ tự này CỐ Ý khác nhau: một cái để ĐỌC, một cái để CHẠY. */
export const THU_TU_Y_DINH: YDinhHinh[] = ['hinhChinh', 'khoet', 'chiTiet', 'hoaVan'];

/**
 * Bước này thuộc ý định nào. Ánh xạ theo BẢN CHẤT việc nó làm với khối:
 *  · dựng/đổi hình tổng thể → hình chính · lấy bớt vật liệu → khoét
 *  · làm mềm/hoàn thiện mép → chi tiết · nhân bản lặp lại → hoa văn
 */
export function yDinhCuaOp(op: BuildOp): YDinhHinh {
  switch (op.op) {
    case 'extrude':
    case 'taper':
    case 'sweep':
    case 'revolve':
    case 'loft':
      return 'hinhChinh';
    case 'boolean':
      // union/intersect cũng đổi khối bằng cách gộp/giao, nhưng người dùng gọi cả cụm này là
      // "khoét" vì subtract là ca dùng gần như duy nhất trong nội thất (hốc, lỗ cửa).
      return 'khoet';
    case 'bevelEx':
      return 'chiTiet';
    case 'arrayLinear':
    case 'arrayRadial':
    case 'mirror':
      return 'hoaVan';
    default: {
      const _het: never = op;
      void _het;
      return 'hinhChinh';
    }
  }
}

export interface NhomYDinh {
  yDinh: YDinhHinh;
  /** Bước kèm CHỈ SỐ GỐC trong `steps` — nơi gọi cần index để ghi/đổi thứ tự đúng bậc, gom nhóm
   *  KHÔNG được làm mất dấu vị trí thật. */
  buoc: { step: BuildRecipeStep; index: number }[];
}

/**
 * Gom `steps` thành nhóm theo ý định, GIỮ nguyên thứ tự tương đối bên trong mỗi nhóm và giữ chỉ
 * số gốc. Nhóm rỗng bị loại — không bày tiêu đề trống.
 */
export function nhomTheoYDinh(steps: BuildRecipeStep[]): NhomYDinh[] {
  const theoNhom = new Map<YDinhHinh, { step: BuildRecipeStep; index: number }[]>();
  steps.forEach((step, index) => {
    const y = yDinhCuaOp(step.op);
    const arr = theoNhom.get(y) ?? [];
    arr.push({ step, index });
    theoNhom.set(y, arr);
  });
  return THU_TU_Y_DINH.filter((y) => theoNhom.has(y)).map((y) => ({ yDinh: y, buoc: theoNhom.get(y)! }));
}

/**
 * ⚠️ NÓI THẬT PHẦN CHƯA CÓ. Tài liệu thiết kế nhắc "Bend · Shell · Fillet biến thiên" như thể đã
 * có; đo tại nguồn (`BuildOp` union, `lib/cad/model.ts:490`) thì KHÔNG có phép nào như vậy —
 * `bevelEx` là bo/vát bán kính CỐ ĐỊNH, không phải shell (rỗng ruột) hay bend (uốn cong).
 * Khai ở đây để UI hiện MỜ KÈM LÝ DO thay vì im lặng vắng mặt, và để không ai tưởng đã làm rồi.
 */
export const Y_DINH_CHUA_CO: { ten: [string, string]; lyDo: [string, string] }[] = [
  {
    ten: ['Uốn cong (Bend)', 'Bend'],
    lyDo: ['Chưa có phép uốn trong bộ dựng hình', 'No bend operation in the build stack yet'],
  },
  {
    ten: ['Rỗng ruột (Shell)', 'Shell'],
    lyDo: ['Chưa có phép rỗng ruột — bo cạnh không thay được', 'No shell operation — bevel is not a substitute'],
  },
];

/** Loại bước SỬA ĐƯỢC THAM SỐ tại chỗ. Một nguồn cho cả UI lẫn test — trước đây danh sách này
 *  nằm trong `Command3DPanel` nên không ai kiểm được nó ngoài mắt người. */
export const OP_SUA_DUOC = new Set<BuildOp['op']>(['arrayLinear', 'arrayRadial', 'mirror', 'bevelEx']);

export function suaDuocThamSo(op: BuildOp): boolean {
  return OP_SUA_DUOC.has(op.op);
}
