/**
 * lib/materials/hang-doi-xem-truoc.ts — VAN CHI PHÍ cho máy xem trước vật liệu.
 *
 * ⛔ CA XẤU PHẢI CHỐNG, có tên: `AdPreviewGenerator` của Revit — mở thư viện vật liệu là **30
 * giây, 100% CPU**. Nâng ô mẫu 32 → 168 px là **27× diện tích**; kho 200 món mà render đồng loạt
 * thì đó đúng là cái ta vừa đi bắt ở người khác. Van phải đứng ở đây, TRƯỚC lúc gọi máy render.
 *
 * 🔴 VÌ SAO Ở LỚP GỌI, KHÔNG Ở `material-preview.ts` (spec §5.4 P7 ghi rõ): tệp kia là **máy**
 * — nó biết vẽ một quả cầu và cache kết quả. Nó KHÔNG biết, và không nên biết, ô nào đang lọt
 * vào mắt người dùng. Nhét chính sách xếp hàng vào máy là làm máy đó phải đoán ngữ cảnh của mọi
 * nơi gọi (kệ Thư viện · widget Home · panel 3D · bảng kho) — mỗi nơi một nhịp khác nhau.
 *
 * BA VIỆC, KHÔNG HƠN:
 *  ① TRẦN ĐỒNG THỜI ≤ 4 lượt render cùng lúc; phần còn lại xếp hàng (P7).
 *  ② HẸN LÚC RẢNH — dùng CHUNG `henLucRanh` với autosave, không chép cơ chế thứ hai (P4).
 *  ③ HUỶ ĐƯỢC — cuộn qua một ô thì việc của nó rời hàng đợi, kể cả khi đang chờ (P4).
 *
 * ⚠️ KHÔNG cache ở đây. Cache PNG theo hash tham số đã sống trong `material-preview.ts` (P2) —
 * đặt thêm một lớp nhớ ở đây là hai lớp nhớ cho cùng một thứ, và lớp nào cũ hơn thì nói dối.
 *
 * THUẦN về logic (không import three, không DOM ngoài `henLucRanh`) ⇒ test được bằng sucrase-node.
 */
import { henLucRanh } from '../hen-luc-ranh';

/** Trần đồng thời. 4 = spec §5.4 P7. Một quả cầu chiếm renderer dùng chung trong vài chục ms;
 * cho quá nhiều lượt chen vào là dựng lại đúng cục nghẽn mà van này sinh ra để chặn. */
export const TRAN_DONG_THOI = 4;

type Viec = { chay: () => Promise<unknown>; huy: boolean };

const cho: Viec[] = [];
let dangChay = 0;
let soLoi = 0;

function bom(): void {
  while (dangChay < TRAN_DONG_THOI) {
    const v = cho.shift();
    if (!v) return;
    if (v.huy) continue;               // cuộn qua rồi — bỏ, không tốn một lượt render nào
    dangChay += 1;
    /* 🔴 `.catch` KHÔNG PHẢI cho gọn — nó là thứ giữ hàng đợi sống. Bỏ nó thì một lượt render
       ngã (WebGL tắt · máy hết context · tham số hỏng) thành **unhandled rejection**, và ở
       Next dev/Electron thứ đó nổ ra lỗi toàn trang: MỘT ô hỏng làm CẢ kho vật liệu trắng.
       Bắt được đúng ca này bằng test `LỖI MỘT LƯỢT KHÔNG LÀM TẮC HÀNG ĐỢI`, không phải bằng
       suy luận. Van này KHÔNG báo lỗi hộ ai — `chay` phải tự lo phần báo; ở đây chỉ đếm để
       lúc đo còn biết là đã có lượt ngã, thay vì im lặng tuyệt đối. */
    void v.chay().catch(() => { soLoi += 1; }).finally(() => { dangChay -= 1; bom(); });
  }
}

/**
 * Xếp một lượt render vào hàng đợi, chạy khi trình duyệt rảnh VÀ còn suất trong trần.
 * `chay` PHẢI tự xử lý lỗi của mình — van này nuốt lỗi để hàng đợi không chết (xem `.catch`
 * bên dưới), nó KHÔNG báo hộ ai.
 * @returns hàm HUỶ. Gọi nó trước khi việc chạy ⇒ việc không bao giờ chạy. Gọi sau ⇒ vô hại
 *          (máy render bên dưới đã có cache, và nơi gọi tự bỏ kết quả bằng cờ `alive`).
 */
export function xepLuotXemTruoc(chay: () => Promise<unknown>, tranMs = 1500): () => void {
  const v: Viec = { chay, huy: false };
  const huyHen = henLucRanh(() => { cho.push(v); bom(); }, tranMs);
  return () => { v.huy = true; huyHen(); };
}

/** Chỉ dùng cho ĐO và cho test — không phải API cho giao diện. */
export function trangThaiHangDoi(): { dangChay: number; dangCho: number; soLoi: number } {
  return { dangChay, dangCho: cho.filter((v) => !v.huy).length, soLoi };
}
