# PHIẾU 🔴 — 5 LỖI UI CHẶNG TRÌNH BÀY (Hoà chụp 03/08 ~02:5x)
**Ai làm:** G4 (vùng `components/present-editor/*`) · **Nguồn:** ảnh Hoà "lỗi nè" · **Luật:** §0 trung thực · §0d giữ-cái-đang-tốt · §0c ba mảng · A8 logic

## L1 🔴 "Trang 1" + "1/5" ĐÁNH LỪA NGƯỜI DÙNG (lỗi logic + ngôn ngữ)
Tab ghi **"Trang 1"**, góc phải ghi **"1/5"** — nhưng dải dưới có **8 slide**. Người dùng đọc "1/5" tưởng *đang ở trang 1 trong 5 trang tài liệu*, thực tế đó là **sheet 1 / trần 5 sheet** (`PresentSheets.tsx:12 "TRẦN 5"`), còn 8 kia là slide trong sheet.
→ Hai đơn vị khác nhau (sheet vs slide) dùng chung một chữ "Trang". Sửa: tab = **"Hồ sơ 1"** (hoặc tên do người dùng đặt), chỉ số góc phải = **"8 slide"** (bỏ mẫu x/y), trần 5 chỉ hiện khi chạm trần ("Tối đa 5 hồ sơ"). Đối chiếu `SPEC-NGON-NGU-CHI-DAN` §3 từ điển.

## L2 🔴 Slide 4 CHỮ CHỒNG CHỮ
Trên slide "TRIẾT LÝ THIẾT KẾ": cụm `• Không gian chuẩn mực • Ít mà đúng` lặp **4 lần**, đè lên nhau và đè tiêu đề `LUMEN VILLA` (chữ bị cắt thành "…RD"). Nghi: template nhân bản text-block theo số mục nhưng không dịch chuyển Y / dùng vị trí tuyệt đối trùng nhau. Kiểm `LayoutShelf.tsx` + generator sinh slide này.
**Nghiệm thu:** mở đúng slide đó, đo `getBoundingClientRect` 4 khối text → không cặp nào chồng >2px.

## L3 🟡 Thumbnail slide 3 chữ đè ảnh
Ô "Không gian sống kể…" chữ tiêu đề nằm đè lên ảnh nền, không nền/không tương phản. Sửa: thumbnail render đúng tỉ lệ slide thật (scale-down), KHÔNG vẽ lại nhãn đè lên; nếu cần tên thì đặt DƯỚI ô như slide 5-8 đang làm đúng.

## L4 🟡 Toolbar Trình bày = 2 HÀNG ~30 NÚT (chưa áp Toolbelt ổ ⑤)
Chặng Vẽ vừa gộp xong dock kính (`060c419`) nhưng Trình bày vẫn 2 hàng nút trải ngang (căn lề · phân bố · khoá · nhóm…). Vi phạm `SPEC-HA-TANG-UI-IF` khung 6 ổ. Sửa: nhóm căn-lề/phân-bố/thứ-tự vào **1 nút mở popover**, chỉ giữ ngoài: Chữ · Ảnh · Hình · Đường · Mẫu · Xuất. Còn lại vào ⌘K + chuột phải.
**§0d:** KHÔNG đập bỏ chức năng — chỉ gom vào popover, mọi lệnh vẫn tới được bằng ≤2 thao tác.

## L5 🟡 Panel phải bị cắt đáy
Khối "NỀN SLIDE" → dòng hướng dẫn *"Chọn một phần tử trên slide để chỉnh. Kéo…"* bị cắt ngang. Inspector phải cuộn riêng (`overflow-y:auto`), không để nội dung tràn khỏi ổ ④.

## THỨ TỰ LÀM
L2 (xấu nhất, người ngoài nhìn thấy ngay) → L1 (sai logic) → L5 (rẻ) → L3 → L4 (lớn nhất, có thể tách phiếu riêng).
