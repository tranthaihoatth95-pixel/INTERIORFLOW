# `IF-DEC-003` · DWG — giấy phép và độ trung thực

> **Status `CANDIDATE`** · Plane `IF` · Authority **Hoà** (pháp lý ⇒ chỉ Hoà) · bậc **W3**.
> Nguồn: gói nghiên cứu read-only 28/08 (Autodesk · ODA · GNU LibreDWG) + đo lại tại HEAD `541a91f`.
> ⛔ **Không phải legal PASS.** Không tuyên bố tuân thủ.

## OBSERVED — đo tại repo, không lấy từ báo cáo

| # | đo được | bằng chứng |
|---|---|---|
| `EV-010` | `@mlightcad/libredwg-web@0.7.7` · **`license: GPL-3.0`** · **11 MB** | `node_modules/@mlightcad/libredwg-web/package.json` |
| `EV-011` | Nó là **`dependencies`**, không phải `devDependencies` | `package.json` |
| `EV-012` | `build.files` chứa `node_modules/**` ⇒ **đi theo MỌI bộ cài** | `package.json → build.files` |
| `EV-013` | Đường DWG **tới được người dùng cuối**: `<input accept=".dwg">` + câu mời *"mở file có sẵn (.idf · .dxf · .dwg)"* | `components/cad/CadEditor.tsx:790,831` |
| `EV-014` | 🔴 **`license:check` CỐ Ý LOẠI TRỪ đúng gói đó** — `--excludePackages '…@mlightcad/libredwg-web@0.7.7…'` | `package.json → scripts.license:check` |
| `EV-015` | `docs/LICENSE-NOTES.md` **đã tự bác** lập luận cũ: *"lập luận 'tool nội bộ' đã hết hiệu lực"*, và ghi rõ installer/app store **đều là "conveying" theo GPL-3 §0** | `docs/LICENSE-NOTES.md:7,18,21` |
| `EV-016` | Bộ đọc DXF của IF **không phải bộ đọc đầy đủ**: làm phẳng `INSERT`, xấp xỉ circle dưới non-uniform scale, đếm-rồi-bỏ entity lạ | `lib/cad/dxf.ts:21,252,436,460,1036` |

`Sensitivity`: `license-bound` · `Scope`: trả lời *"IF có đang phân phối GPL không"* và *"DXF hiện đọc được tới đâu"*. **Không** trả lời câu quyền của ODA/Autodesk — đó là nguồn ngoài, chưa tự xác minh (`UNVERIFIED`).

## INFERENCE

`EV-010`+`011`+`012`+`013` ⇒ **bộ cài hôm nay chứa và phân phối mã GPL-3.0**, và tính năng dùng nó **mời người dùng dùng**. `EV-015` cho thấy repo **đã biết** điều này. `EV-014` cho thấy máy canh duy nhất có thể bắt được thì **đã bị tắt cho đúng gói đó** — nên nó im lặng mãi.

⚠️ Đây **không** phải kết luận pháp lý. Nó chỉ nói: điều kiện thực tế mà một luật sư cần biết **đã tồn tại**, không phải giả định.

## PROPOSED — mặc định khuyến nghị, reversible

**① Gỡ `libredwg-web` khỏi bộ cài v1.** Nút `.dwg` sau cờ, **mặc định TẮT**; câu mời bỏ `.dwg`. Không xoá mã, không xoá dữ liệu — cờ lùi được. Đây là thay đổi **rẻ nhất** gỡ được cổng chặn pilot.
**② Bỏ `--excludePackages` cho gói đó** để `license:check` **đỏ thật** — một cổng bị tắt còn tệ hơn không có cổng, vì nó tạo cảm giác đã canh.
**③ v1 nhập DWG qua DXF do người dùng tự xuất** từ CAD họ đã có: AutoCAD 2018 ASCII DXF · toàn bộ bản vẽ · precision 16 · **không** R12 · **không** "Select objects" · **không** bật audit.
**④ Không hứa "gần như không đổi".** Câu đúng với IF hôm nay: **"trung thực cao cho tập 2D đã chứng nhận"** — vì `EV-016` cho thấy cổ chai nằm ở **parser của IF**, không chỉ ở converter. Đổi converter tốt hơn mà không mở rộng mô hình thì vẫn đổ dữ liệu vào cùng một cổ chai.
**⑤ ODA/RealDWG là đánh giá thương mại song song**, không chặn v1.

## ONLY-HOÀ — sáu câu, chỉ trả lời nếu nó đổi mặc định

1. v1 có phải chạy trên máy **không cài AutoCAD** không?
2. v1 cần **chỉnh sửa được** dynamic block/AEC, hay chỉ cần **hình 2D nhìn đúng**?
3. macOS có bắt buộc DWG local **ngay v1** không?
4. Chấp nhận **ngân sách SDK định kỳ** (ODA/RealDWG) không?
5. Chấp nhận bước người dùng **tự `SAVEAS`** giai đoạn đầu, hay **một nút** là điều kiện ship?
6. IF có cần giữ `handles`/`XDATA`/block identity để **round-trip**, hay DWG chỉ là **nguồn nhập một chiều**?

Im lặng ⇒ tôi chạy mặc định ①②③④ (đều reversible), **không** chạm ⑤.

## Rủi ro nếu KHÔNG làm gì

Giao bộ cài hiện tại cho một studio là **conveying** mã GPL-3.0 trong một sản phẩm đóng — theo đúng câu mà `docs/LICENSE-NOTES.md` đã tự viết. Đây là **cổng chặn pilot số 6** trong QA phát hành, và nay nó có số đo thay vì có lo ngại.
