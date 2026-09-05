/**
 * components/home/xuong-layout.ts — [marker: xuongCaNhan] BỐ CỤC HOME = **MỘT TIÊU ĐIỂM + MỘT
 * CỤM PHỤ**, thuần (không JSX, không DOM) nên test được.
 *
 * ⛔ NÓ ĐÈ HƯỚNG CŨ. Trước 20/08 Home là lưới BENTO 12 cột × 3 hàng, mỗi ô một widget, các ô
 * chia nhau chiều cao đều nhau (`bento-layout.ts` — GIỮ NGUYÊN, còn dùng cho bản xếp dọc hẹp).
 * Hoà chốt 20/08: *"TRƯỢT nếu Home vẫn trông như dashboard SaaS"* — cấm lưới thẻ đều, cấm bức
 * tường nút tính năng, cấm khung xương kiểu dashboard.
 *
 * ⭐ LUẬT BỐ CỤC MỚI, ba câu:
 *   ① NỀN là MẶT PHẲNG CHÍNH — nó là cái SÂN, không phải hình dán. ⇒ nội dung KHÔNG phủ kín
 *      màn: lề ngoài rộng, và **phần dư trả về cho nền**, không nhồi vào thẻ.
 *   ② ĐÚNG MỘT TIÊU ĐIỂM — một vùng lớn, lệch trục, là thứ mắt chạm đầu tiên. Không có vùng
 *      thứ hai ngang hạng với nó.
 *   ③ ĐÚNG MỘT CỤM PHỤ — một cột hẹp hơn hẳn, các mục **cao đúng nội dung** (`auto`), xếp theo
 *      THỨ TỰ ƯU TIÊN. Không rải đều, không chia nhau chiều cao.
 *
 * ⭐ BA TRẠNG THÁI LÀ **MỘT KHÔNG GIAN ĐANG LỚN LÊN**, không phải ba dashboard:
 *   A · Ngày-Số-Không → tiêu điểm chứa ba cửa (Tạo · Mở · Nhập nguồn). Cụm phụ chỉ còn hai mục
 *       luôn sống (Chào · Ghi chú) — nó **mỏng đi**, không biến mất.
 *   B · Có dự án      → CÙNG vùng tiêu điểm đó, ở CÙNG chỗ, mọc thêm dải "Tiếp tục việc dở" lên
 *       trên (`banViecDo`). Dữ liệu **cập bến**, tiêu điểm không nhảy chỗ khác.
 *   C · Sau demo      → vẫn vùng đó; cụm phụ dày lên theo đúng thứ tự ưu tiên dưới đây.
 *   ⇒ Vị trí tiêu điểm KHÔNG đổi giữa A/B/C. Đó là thứ làm nó đọc ra là một không gian lớn lên
 *     chứ không phải ba màn khác nhau.
 */

/** Các mục có thể đứng trong CỤM PHỤ. Tên khớp cờ dữ liệu ở `DongStudioHome`. */
export type MucPhu =
  | 'chao'
  | 'homNay'
  | 'mocToi'
  | 'vatLieu'
  | 'anhTuan'
  | 'bieuDo'
  | 'dongTin'
  | 'ghiChu';

/**
 * THỨ TỰ ƯU TIÊN của cụm phụ — cố định, khai MỘT chỗ.
 *
 * Vì sao thứ tự này (không phải thứ tự lịch sử của lưới bento): đọc từ **việc phải quyết hôm
 * nay** xuống **thứ chỉ để ngắm**.
 *   chao     — mốc giờ + lời chào, neo trên cùng vì nó là thứ nói "bây giờ là lúc nào".
 *   homNay   — ai đang làm gì HÔM NAY.
 *   mocToi   — cái sắp tới hạn.
 *   ghiChu   — chỗ gõ vào; luôn sống nên luôn có mặt, nhưng đứng SAU ba mục trên vì nó là chỗ
 *              GHI chứ không phải chỗ BÁO.
 *   vatLieu · anhTuan · bieuDo · dongTin — nuôi mắt, xếp cuối.
 */
export const THU_TU_PHU: readonly MucPhu[] = [
  'chao',
  'homNay',
  'mocToi',
  'ghiChu',
  'vatLieu',
  'anhTuan',
  'bieuDo',
  'dongTin',
] as const;

/** Cờ "mục này có dữ liệu thật không". `chao`/`ghiChu` không có mặt vì chúng LUÔN sống. */
export interface CoDuLieuPhu {
  homNay: boolean;
  mocToi: boolean;
  vatLieu: boolean;
  anhTuan: boolean;
  bieuDo: boolean;
  dongTin: boolean;
}

export interface BoCucXuong {
  /** Nội dung của vùng tiêu điểm — cùng MỘT vùng, đổi ruột theo trạng thái. */
  tieuDiem: 'ngaySoKhong' | 'duAn';
  /** Có dải "Tiếp tục việc dở" nằm TRÊN tiêu điểm không (trạng thái B/C). */
  banViecDo: boolean;
  /** Cụm phụ, ĐÃ lọc theo dữ liệu thật và ĐÃ xếp theo ưu tiên. */
  cumPhu: MucPhu[];
  /** Số ô hiện ra — `01` cho tiêu điểm, rồi `02`… theo đúng thứ tự đọc thật. */
  soO: Partial<Record<MucPhu | 'tieuDiem', string>>;
}

function hai(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Tính bố cục. Thuần: cùng đầu vào ⇒ cùng đầu ra, không đọc `window`/`Date`.
 *
 * `coDuAn` = studio đã có ít nhất một dự án. `coViecDo` = có việc đang dở để mời quay lại.
 * ⚠️ `coViecDo` KHÔNG tự bật tiêu điểm mới — dải việc-dở mọc TRONG vùng tiêu điểm sẵn có
 * (đúng "một không gian đang lớn lên", xem đầu file).
 */
export function bocCucXuong(opts: {
  coDuAn: boolean;
  coViecDo: boolean;
  duLieu: CoDuLieuPhu;
}): BoCucXuong {
  const { coDuAn, coViecDo, duLieu } = opts;
  const song: Record<MucPhu, boolean> = {
    chao: true,
    ghiChu: true,
    homNay: duLieu.homNay,
    mocToi: duLieu.mocToi,
    vatLieu: duLieu.vatLieu,
    anhTuan: duLieu.anhTuan,
    bieuDo: duLieu.bieuDo,
    dongTin: duLieu.dongTin,
  };
  const cumPhu = THU_TU_PHU.filter((m) => song[m]);

  const soO: BoCucXuong['soO'] = { tieuDiem: '01' };
  cumPhu.forEach((m, i) => {
    soO[m] = hai(i + 2);
  });

  return {
    tieuDiem: coDuAn ? 'duAn' : 'ngaySoKhong',
    // Ngày-Số-Không thì KHÔNG có việc dở để tiếp — chặn ở đây để nơi gọi không phải nhớ.
    banViecDo: coDuAn && coViecDo,
    cumPhu,
    soO,
  };
}

/**
 * CHIỀU CAO một hàng của cụm phụ.
 *
 * 🔴 ĐO ĐƯỢC trên app thật 1440×900 trước khi có hàm này (cụm 6 mục, mọi hàng để `auto`):
 *   · "05 · Ảnh đẹp tuần này" cao **2px** — widget ảnh là một BỀ MẶT (`h-full` bên trong), `auto`
 *     hỏi nó "anh cần bao nhiêu" thì nó trả lời "không cần gì" ⇒ sập.
 *   · "03 · Ghi chú nhanh" còn **105px** — nó khai `1fr` nhưng mấy hàng `auto` xung quanh ăn hết
 *     chỗ trước, `1fr` chỉ được phần thừa; không có sàn nào chặn.
 * ⇒ Hai loại mục cần hai luật khác nhau, không thể một luật cho tất cả:
 *   ① **mục KÝ HIỆU** (chào · hôm nay · mốc tới · vật liệu · biểu đồ · dòng tin) — nói bằng
 *      icon + số, cao ĐÚNG nội dung ⇒ `auto`. Kéo dãn chúng là đúng thứ luật 20/08 cấm.
 *   ② **mục BỀ MẶT** (ảnh tuần · ghi chú) — phải có DIỆN TÍCH mới làm được việc: ảnh phải đủ to
 *      để nhìn ra vân, ghi chú phải đủ chỗ cho ô nhập + vài dòng.
 *
 * Đơn vị là **vh, không px** — cùng một khai báo chạy trên máy tính · tablet · điện thoại, và
 * màn cao hơn thì bề mặt lớn hơn theo. Tràn thì cụm phụ CUỘN (nơi gọi để `overflow-y:auto`) —
 * chứ không nghiến mục nào về 2px như bản trước.
 */
export function hangPhu(m: MucPhu): { flex: string; minHeight?: string } {
  // `flex: 0 0 auto` = "cao đúng nội dung, KHÔNG cho co, KHÔNG cho dãn". Chữ `0` ở giữa (không
  // co) là mấu chốt: dùng CSS Grid ở đây thì hàng `auto` bị **nén về min-content** khi cột chật
  // (đo 20/08: Biểu đồ chặng 289px → 106px) — đúng cái nghiến mà bố cục này sinh ra để bỏ.
  if (m === 'anhTuan') return { flex: '0 0 20vh' };
  if (m === 'ghiChu') return { flex: '0 0 auto', minHeight: '16vh' };
  return { flex: '0 0 auto' };
}

/**
 * Bề rộng hai vùng, khai bằng `fr` (KHÔNG px — điều kiện để cùng bố cục chạy trên máy tính ·
 * tablet · điện thoại).
 *
 * 1.62 : 1 — tiêu điểm rộng gấp rưỡi cụm phụ có lẻ. Không phải 2:1 (quá thô, đọc thành "hai cột
 * chính") và tuyệt đối không 1:1 (đó chính là lưới đều bị cấm). Cụm phụ MỎNG ĐI khi dữ liệu
 * mỏng: chỉ còn 2 mục luôn-sống thì nó tụt về 1fr/1.9 để nền chiếm chỗ nhiều hơn.
 */
export function cotXuong(soMucPhu: number): string {
  const phu = soMucPhu <= 2 ? 1.9 : 1.62;
  return `minmax(0, ${phu}fr) minmax(0, 1fr)`;
}
