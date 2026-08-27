/**
 * dwg-flag.ts — CỜ TẮT đường nhập DWG trực tiếp (mặc định TẮT, 28/08).
 *
 * VÌ SAO TẮT MÀ KHÔNG XOÁ MÃ:
 * `lib/cad/dwg-worker.ts` phụ thuộc `@mlightcad/libredwg-web@0.7.7` — **GPL-3.0**, là
 * `dependencies` production, và `build.files` của electron-builder gói cả `node_modules/**`
 * ⇒ gói GPL đi theo MỌI bộ cài. Chừng nào IF còn là sản phẩm đóng và có người nhận bản cài
 * (kể cả pilot MIỄN PHÍ — GPL tính việc GIAO BẢN SAO, không tính có thu tiền hay không),
 * chỗ này chưa có lời giải đã được luật sư xác nhận.
 *
 * ⇒ Tắt nút, GIỮ NGUYÊN mã. Đảo lại bằng một biến môi trường, không phải bằng một lần revert.
 *
 * BA ĐƯỜNG THẬT cho người dùng có file .dwg — không đường nào bắt buộc phải có một phần mềm
 * cụ thể nào (Hoà sửa khung câu hỏi 28/08: *"không có CAD thì có cái khác chứ"*):
 *   1. Xuất DXF từ **phần mềm CAD người dùng đang có bản quyền** — AutoCAD/LT/Web, Revit,
 *      BricsCAD, ZWCAD, GstarCAD, ARES, DraftSight, Rhino, SketchUp Pro, Archicad,
 *      Vectorworks, Allplan… đều SAVEAS/EXPORT được DXF. IF nhận DXF.
 *   2. Máy không có gì: dùng một **bộ chuyển DWG→DXF đứng riêng, miễn phí** do người dùng tự
 *      cài và tự chạy. IF không phân phối nó, không tự động điều khiển nó ở bước này.
 *   3. DWG trực tiếp để **sau** — chỉ mở lại khi đã có cổng kiểm sai lệch (Fidelity Gate) và
 *      một lời giải giấy phép, không phải trước.
 *
 * KHÔNG hardcode tên một hãng nào vào lời thoại sản phẩm (LUẬT NỀN TẢNG §1).
 */

/** Bật lại đường DWG trực tiếp. Mặc định TẮT ở mọi môi trường. */
export function dwgImportEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IF_DWG_IMPORT === '1';
}

/**
 * Câu nói với người dùng khi họ thả/chọn một file .dwg lúc cờ đang tắt.
 * Nêu ĐƯỜNG ĐI, không nêu tên hãng — và không nói dối rằng file hỏng.
 */
export function dwgTatMessage(tenFile: string, en = false): string {
  return en
    ? `“${tenFile}” — direct DWG is off in this build. Two ways in now: export DXF from the CAD software you already licence, or convert DWG→DXF with a standalone free converter, then open the DXF here. Native DWG comes back once the fidelity gate is in place.`
    : `“${tenFile}” — bản này chưa mở DWG trực tiếp. Hai đường dùng được ngay: xuất DXF từ phần mềm CAD anh đang có bản quyền, hoặc chuyển DWG→DXF bằng một bộ chuyển miễn phí đứng riêng — rồi mở DXF ở đây. DWG trực tiếp sẽ mở lại sau khi có cổng kiểm sai lệch.`;
}
