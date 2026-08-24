# Panel · dock · cửa sổ công cụ — vũ đạo của khung làm việc

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Panel nên dính cạnh, hay nổi, hay là một vật trên canvas?
- Thu panel thì thu kiểu gì? Có được tự ẩn không?
- Panel mở ra thì đẩy nội dung hay đè lên nội dung?
- Bao nhiêu lớp bọc quanh canvas là đủ?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**D-1 · NĂM TẦNG CHIỀU SÂU, KHÔNG BÓNG ĐỔ TUỲ HỨNG** (`IF-MOTION-VISUAL-LAW §IV`):
`L0` canvas/workspace · `L1` thẻ/kệ thường trực · `L2` công cụ ngữ cảnh / inspector đang hoạt ·
`L3` popover / Vitals Peek / công cụ nổi · `L4` modal tập trung, chỉ khi thật cần.
**Tầng càng cao càng TẠM THỜI và càng TẬP TRUNG.** Một vật ở L3 mà sống mãi là sai tầng.

**D-2 · TỐI ĐA BA LỚP CHROME QUANH CANVAS.** Chuẩn de-facto đo được của IF là **3 lớp** ở 10/13
màn; Materials **4 lớp** là lệch, phải sửa về 3. Mỗi lớp thêm vào phải trả lời được nó mang tin gì.

**D-3 · THU GỌN KIỂU "MINIMIZE", KHÔNG AUTO-HIDE.** Thu về **dải dọc mỏng CÓ NHÃN**, rê mới hé ra;
có chủ đích, không tự động. ⛔ Auto-hide là thứ **bị chửi nhiều nhất** trong cả 4 app đã khảo
(Rhino auto-hide đóng luôn hộp thoại con; SketchUp nhấp nháy, nút ghim quá nhỏ không nhãn).
Mỗi panel kèm **một phím tắt bật/tắt** (`B` Navigator · `I` Inspector · `⌘\` ẩn cả hai).

**D-4 · MỞ PANEL KHÔNG ĐƯỢC ĐẨY NỘI DUNG ĐANG ĐỌC.** Panel bên mở ra làm canvas **co và nội dung
nhảy** là lỗi đang mở trong sổ (danh sách OPEN CLASSES của `02-FAILURE-LEDGER`). Hai đường hợp lệ:
panel **đè** lên mép canvas (L2/L3), hoặc canvas **giữ nguyên tâm nhìn** khi co.

**D-5 · TAY CẦM THU/MỞ LÀ MẪU CHUNG TOÀN APP.** Dải dọc mảnh sát mép panel, giữa có `›`/`‹`. Ưu
điểm: gần 0 diện tích, vị trí đoán được, một cú bấm, **thu rồi vẫn thấy tay cầm** (không mất tích).
Tách **một component dùng chung**, cấm chép sáu lần. Trạng thái thu/mở **nhớ** giữa các phiên.

**D-6 · KÍNH CHỈ Ở LỚP VỎ, KHÔNG LỒNG KÍNH.** Panel kính nổi **PHẢI portal ra ngoài**, không lồng
trong chrome kính (luật K4, rút từ sự cố thật: dropdown nằm trong khung kính thanh tiêu đề → xuyên
thấu). Và fade kính phải fade ở **chính phần tử kính**, không fade ở cha (K1). Xem `materials-g0-g3.md`.

**D-7 · CỬA SỔ CÔNG CỤ LÀ CÔNG DÂN CỦA CANVAS, KHÔNG PHẢI MODAL.** (Hoà chốt 15/08)
Nó là **một CỤM**: khung môi trường (ảnh · video · 3D · bàn bạc) **+ panel vệ tinh bám quanh**.
Cả cụm kéo thả được, mở **nhiều cụm cùng lúc**, nối dây được, kết quả mang sẵn định nghĩa.
⛔ Không `position: fixed` portal ra ngoài canvas — đó là bản cũ, đã đổi.
⛔ **Không giấu vệ tinh**: mở cửa sổ LÀ hành vi bày ra, đóng cửa sổ LÀ hành vi giấu đi.

**D-8 · HAI LOẠI CỬA SỔ.** **Sản xuất** (ảnh · video · 3D) có cổng ra, đẻ ra một tệp.
**Thảo luận** (moodboard · khung tư duy · ghi chú) **có thể KHÔNG có cổng ra** — đầu ra là một
**quyết định**. Cấm bắt mọi cửa sổ phải có cổng ra.

**D-9 · CỘT TỰ CHIA, MỘT HỢP ĐỒNG BỀ RỘNG.** Kéo panel rộng thì rollout tự chia 2 cột khi vượt
ngưỡng — không có nút "chế độ rộng". Mọi panel dùng **cùng một hợp đồng bề rộng**; hard-code width
lẻ tẻ làm cột lởm chởm (lỗi 3ds Max).

**D-10 · ZOOM LỒNG ZOOM — xử từ thiết kế.** Canvas pan/zoom mà môi trường 3D bên trong cũng
pan/zoom thì vừa rối tay vừa mờ hình (WebGL trong container bị biến đổi tỉ lệ). Luật: **từ nấc VỪA
trở lên, cửa sổ thoát khỏi phép biến đổi của canvas** — vẽ ở tỉ lệ màn hình, canvas trôi phía sau;
nấc thu không chạy 3D sống, chỉ ảnh tĩnh.

## 3 · VÌ SAO — cơ chế con người
Panel là **bộ nhớ ngoài** của người làm nghề: họ nhớ *"lớp ở bên trái, vật liệu ở dưới phải"* bằng
tay chứ không bằng đầu. Mọi thứ làm vị trí đó **không đoán được** — auto-hide, máy tự sắp, panel
nhảy theo sub-mode — đều đánh thẳng vào trí nhớ cơ bắp, và người dùng cảm thấy như app đang **giật
đồ khỏi tay** giữa lúc làm.

Ngược lại, chiều sâu (D-1) là cách nói *"vật này tạm thôi"*. Người dùng đọc được điều đó mà không
cần chữ, nên vật ở tầng cao được phép che nội dung — miễn nó thật sự đi ngay.

## 4 · CA HỎNG THẬT CỦA IF
- **OPEN CLASSES (`02-FAILURE-LEDGER`)**: *"panel cố định làm IF kém linh hoạt hơn công cụ chuyên
  nghiệp"* · *"nhiều lớp chrome quanh canvas"* · *"sidebar mở ra đẩy nội dung"* — ba lớp lỗi đang
  mở, chính là D-2/D-4/D-7.
- **`01-CLINICAL-UI-AUDIT`**: Materials **4 lớp chrome** trong khi 10 màn khác 3 lớp.
- **15/08 · `ToolWindow.tsx:54,58`**: `position:fixed` zIndex 31, portal ra NGOÀI canvas, mount làm
  anh em với `<FlowCanvas/>` ⇒ không pan/zoom theo, **không cổng vào/ra**, 1 cửa/lượt, nút `−` là
  đóng hẳn. Docstring tự thú giới hạn — mà vẫn sống 14 ngày sau khi chốt 01/08 nói ngược lại.
- **K4 (02/08)**: dropdown là **con** của thanh tiêu đề kính ⇒ backdrop gốc chặn blur ⇒ menu xuyên
  thấu. Sửa: portal ra body. Luật D-6 sinh từ đây.
- **16/08 · T định thu vệ tinh vào tay nắm** — Hoà bác, xem D-7. Gốc lỗi: bỏ trống tầng nhóm lệnh
  rồi đổ tại vệ tinh.

## 5 · KIỂM THẾ NÀO
1. Đếm lớp bọc từ mép màn tới canvas: > 3 là lệch.
2. Mở/đóng panel bên: nội dung đang đọc có **nhảy** không?
3. Mỗi panel: thu được không · có nhãn khi thu không · có phím tắt không · có nhớ trạng thái không?
4. `grep -rn "position: *fixed" components/` ở vùng cửa sổ công cụ — còn cái nào portal ra ngoài?
5. Panel kính nào đang lồng trong chrome kính? (D-6 — kiểm bằng cây DOM, không bằng ảnh)
6. Gán mỗi bề mặt nổi một tầng L0–L4: có vật nào ở L3/L4 mà sống thường trực không?
7. `npm run soi:hinh-hoc` cho bo góc đồng tâm giữa panel và ruột.

## 6 · ĐÀO SÂU
- `docs/SPEC-PANEL-ROLLOUT-IDF.md` §2a–2f, §4a phím tắt toàn app
- `docs/IF-MOTION-VISUAL-LAW.md` §IV Depth · §V Master Capability
- `docs/00-CHOT.md` 15/08 "master tool là công dân của canvas" · 16/08 kiến trúc canvas + cửa sổ
- `docs/00-CHOT.md` 02/08 — K1…K4 bốn sự cố kính lỏng
- `docs/CHOT-RENDER-TOOL-WINDOW-2026-08-01.md`
