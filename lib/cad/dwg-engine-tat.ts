/**
 * dwg-engine-tat.ts — BẢN THAY THẾ RỖNG cho engine đọc DWG khi cờ nhập DWG đang TẮT.
 *
 * VÌ SAO CÓ TỆP NÀY (đọc trước khi xoá):
 * `lib/cad/dwg-worker.ts` là điểm-vào-duy-nhất tới gói đọc DWG mang giấy phép **GPL-3.0**.
 * Nhưng `lib/cad/dwg.ts` đẻ worker bằng `new Worker(new URL('./dwg-worker.ts', import.meta.url))`
 * ⇒ webpack **dựng worker đó vô điều kiện**, và khi dựng thì nó SAO cả mã GPL + tệp `.wasm` vào
 * `.next/`. Sau đó `build.files` của electron-builder gói `".next/**\/*"` — tức bản sao đã nằm sẵn
 * trong bộ cài TRƯỚC KHI electron-builder kịp loại trừ gì. Đo thật 29/08: hai bản `.wasm`
 * 9.399.820 byte + `chunks/6995.js` mang trọn glue Emscripten, trong khi hai dòng loại trừ
 * `!node_modules/@mlightcad/**` và `!public/wasm/...` VẪN có hiệu lực. Loại trừ **nguồn** không
 * bao giờ đuổi kịp **bản sao** của bộ đóng gói.
 *
 * ⇒ Chặn ở tầng PHÂN GIẢI MODULE, không chặn theo tên tệp đầu ra: `next.config.mjs` trỏ
 * `resolve.alias` của gói GPL về đây khi `NEXT_PUBLIC_IF_DWG_IMPORT !== '1'`. Webpack không đọc
 * tới gói đó ⇒ không có mã nào để sao, không có `.wasm` nào để phát ra, và **không có tên chunk
 * nào phải đoán** (tên chunk đổi mỗi lần dựng — vá theo tên là mong manh, luật 7).
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "xoá tính năng". `dwg-worker.ts` giữ nguyên từng dòng. Đặt
 * `NEXT_PUBLIC_IF_DWG_IMPORT=1` rồi dựng lại là gói thật quay lại đúng chỗ cũ.
 *
 * Nếu vì lý do nào đó mã worker vẫn CHẠY khi cờ tắt (không nên xảy ra — `CadEditor` đã chặn
 * bằng `dwgImportEnabled()` trước khi gọi), thì nó gặp lỗi có lời giải thích, không phải
 * `undefined is not a function`.
 */

const LOI =
  'Bản dựng này không kèm bộ đọc DWG trực tiếp (cờ NEXT_PUBLIC_IF_DWG_IMPORT đang tắt). ' +
  'Hãy mở tệp DXF, hoặc dựng lại với cờ bật. Xem lib/cad/dwg-flag.ts.';

/** Cùng HÌNH DẠNG với export thật mà `dwg-worker.ts` dùng — chỉ khác: gọi vào là ném lỗi rõ nghĩa. */
export class LibreDwg {
  static create(_wasmPath?: string): Promise<never> {
    return Promise.reject(new Error(LOI));
  }
}

/** Enum thật chỉ được đọc để truyền vào `dwg_read_data`; giữ hình dạng để mã gọi không vỡ kiểu. */
export const Dwg_File_Type = { DWG: 0, DXF: 1 } as const;

export default { LibreDwg, Dwg_File_Type };
