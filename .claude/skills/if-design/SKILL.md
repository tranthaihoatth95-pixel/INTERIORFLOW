---
name: if-design
description: Bộ não thiết kế bền của InteriorFlow — TRƯỜNG THIẾT KẾ IF. Nạp TRƯỚC mọi quyết định giao diện người dùng thấy được, mọi đề bài thiết kế, mọi lượt dựng bản vẽ, mọi lượt thi công thị giác. Đây là BỘ ĐỊNH TUYẾN: nó không chứa toàn bộ tri thức, nó chỉ đường tới đúng module cần cho việc đang làm. Dùng khi chạm Home, Sidebar, Vitals, ToolWindow, Design DNA, Sources, Library, 2D, 3D, Vật liệu, Trình chiếu, Soát duyệt, Đăng nhập, hoặc bất kỳ primitive dùng chung nào.
---

# TRƯỜNG THIẾT KẾ IF — bộ định tuyến

> **Vì sao tệp này là BỘ ĐỊNH TUYẾN chứ không phải bộ bách khoa.**
> Kiểm kê 23/08 (`docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md`) đo được: IF đã có **32 tệp
> nghiên cứu · 12 văn bản luật · ~106 bản vẽ**. Thừa sức trả lời mọi lỗi. Vậy mà cùng ngày, sản
> xuất vẫn ra một màn Trang chủ phạm **bốn luật đã ghi thành văn**. Truy từng lỗi thì **ba trên
> bốn là LỖI ĐỊNH TUYẾN** — luật có thật, nằm trong một chú thích `.ts` hoặc chôn trong một tệp
> nghiên cứu, không ai đọc đúng lúc.
> ⇒ Bệnh không phải thiếu luật. Bệnh là **không biết lúc nào phải đọc gì**. Tệp này chữa đúng bệnh đó.
>
> **KINH TẾ TOKEN LÀ YÊU CẦU, KHÔNG PHẢI LỜI KHUYÊN.** Đừng nạp cả trường. Nạp đúng nhánh.

---

## 0 · LUẬT GỐC — thuộc lòng, không cần mở tệp

1. **CON NGƯỜI TRƯỚC.** Không bao giờ bắt đầu từ component có sẵn, hình dạng DB, CSS đang có, hay *"ta đang có sẵn những nút gì"*. Bắt đầu từ: ai · họ đang cố làm gì · cái gì đáng được chú ý lúc này · cái gì nên biến mất.
2. ⭐ **MỘT PHẦN TỬ KHÔNG XỨNG ĐÁNG TỒN TẠI CHỈ VÌ CÓ DỮ LIỆU HOẶC CÓ CHỖ TRỐNG.** Trước khi thêm bất cứ widget/thẻ/panel nào: *"Nó phục vụ VIỆC GÌ của con người?"* — không trả lời được thì **không thêm**.
3. **NỘI DUNG / CANVAS / KHUNG NHÌN LÀ NHÂN VẬT CHÍNH.** Nheo mắt nhìn màn: thứ đầu tiên đập vào phải là **việc của người dùng**. Nếu là sidebar · thanh công cụ · ô tìm kiếm · tường thẻ ⇒ **TRƯỢT**.
4. **LỘ DẦN.** Bày đủ để quyết định, không bày đủ để choáng.
5. **MỘT SỰ THẬT DỰ ÁN.**
6. **CLAUDE DESIGN SỞ HỮU PHẦN NGƯỜI DÙNG NHÌN THẤY. MAIN THI CÔNG, MAIN KHÔNG ÂM THẦM THIẾT KẾ LẠI.**
7. **CHỈ DỮ LIỆU THẬT.** Không fixture, không `0/0`, không khung rỗng chờ nội dung.
8. **BẢN VẼ → HỢP ĐỒNG THIẾT KẾ → MÃ → APP THẬT → SOI BẰNG MẮT.** Thiếu mắt là chưa xong.
9. **CẢM ỨNG LÀ CÔNG DÂN HẠNG NHẤT.** Không tính năng quan trọng nào chỉ tới được bằng hover.
10. **APPLE LÀ THẤU KÍNH CHẤT LƯỢNG, KHÔNG PHẢI LỚP DA.** Hỏi *"Apple đang giải bài toán con người nào?"*, rồi *"IF giải bài đó cho KTS nội thất thế nào?"*
11. **NGHIÊN CỨU NGƯỜI KHỔNG LỒ → RÚT LUẬT CHUNG → MỚI ÁP VÀO IF.** Cấm chép diện mạo.
12. **CÙNG MỘT LỖI LẶP LẠI ⇒ NÂNG NÓ THÀNH LUẬT / SKILL / TEST.**

---

## 1 · ĐI THEO ĐƯỜNG NÀO — tra bảng, đừng nạp hết

| Việc bạn đang làm | Nạp đúng những tệp này |
|---|---|
| **Bất kỳ việc giao diện nào** | `knowledge/human-centered-design.md` ← **luôn luôn, không ngoại lệ** |
| Dựng/sửa một MÀN | + `product/<màn>.md` + **cặp** `examples/BAD/` ↔ `examples/GOOD/` cùng loại |
| Muốn thấy một lỗi được sửa ra sao | + `examples/BEFORE-AFTER/` — hai đầu có ảnh thật |
| Bố cục · thứ bậc · "trông rối" | + `knowledge/visual-hierarchy.md` + `knowledge/editorial-composition.md` |
| Thanh công cụ · panel · workspace | + `knowledge/professional-workspaces.md` + `knowledge/docking-and-panels.md` + `knowledge/progressive-disclosure.md` |
| Chữ · nhãn · bất kỳ chữ tiếng Việt nào | + `knowledge/typography-vietnamese.md` ← **bắt buộc, vừa bị phạm 23/08** |
| Icon | + `knowledge/iconography.md` |
| Kính · bề mặt · chiều sâu | + `knowledge/materials-g0-g3.md` |
| Chuyển động · chuyển cảnh | + `knowledge/motion.md` |
| Tablet · bút · chạm | + `knowledge/touch-ipad.md` |
| Trợ năng | + `knowledge/accessibility.md` |
| Đặt tên · nhãn · thuật ngữ nghề | + `knowledge/professional-terminology.md` |
| Mượn ý từ sản phẩm khác | + `references/<sản phẩm>.md` |
| Sắp giao bản vẽ | + `contracts/design-contract-template.md` |
| Sắp tuyên bố xong | + `checks/**` và skill **`if-design-review`** |

**Cấm nạp cả trường.** Nạp thừa là tự làm loãng chú ý của chính mình — đúng cơ chế `context rot`.

---

## 2 · TRÌNH TỰ CHUẨN CHO MỘT VIỆC GIAO DIỆN

```
① nhận diện VIỆC CỦA CON NGƯỜI   → knowledge/human-centered-design.md
② đọc màn                        → product/<màn>.md   (được phép chứa gì · bị từ chối gì)
③ soi ví dụ cùng loại            → examples/BAD/** rồi examples/GOOD/**
                                    ← ĐỐI CHIẾU BẰNG HÌNH, không bằng trí nhớ.
                                    Xem cả examples/BEFORE-AFTER/** khi có.
④ nạp nguyên tắc liên quan       → knowledge/**
⑤ tra token nền                  → docs/design-campaign/05-FOUNDATION-BASELINE.md
⑥ cần tiền lệ thì tra            → references/**
⑦ CLAUDE DESIGN dựng bản vẽ
⑧ xuất HỢP ĐỒNG THIẾT KẾ         → contracts/design-contract-template.md
⑨ MAIN thi công
⑩ chụp APP THẬT rồi TỰ NHÌN
⑪ soi độc lập                    → skill `if-design-review`
```

⛔ **Bỏ bước ⑩ là vi phạm.** Ca thật 23/08: một lane tính bố cục bằng số CSS, **chưa mở Home lần nào**, ra một tường thẻ trắng; Hoà mở app và nói đúng một chữ — *"XẤU"*.

---

## 3 · MÁY ĐO ĐƯỢC GÌ, NGƯỜI CHẤM GÌ — đừng lẫn

| Máy soi được | Người phải chấm |
|---|---|
| thang chữ · nguồn/cỡ/nét icon · token nhịp · dùng G0–G3 · tương phản đã biết · bản vẽ nguồn có tồn tại | bố cục · cái đẹp · cân bằng thị giác · **nhân vật chính** · sự tĩnh tại của kiến trúc |

Lệnh: `npm run soi:foundation` · `soi:hinh-hoc` · `soi:tu-dien` · `soi:thao-tac` · `soi:design-school`.

🔴 **Bằng chứng ranh giới này là thật** (23/08): ba phát hiện nặng nhất khiến Home trượt **không máy nào bắt được**, trong khi `soi:foundation` báo **1.173 vi phạm** mà **không cái nào là lý do Home trượt**. Máy và người **cùng làm**, không thay nhau. **Đừng giả vờ máy chấm được cái đẹp.**

---

## 4 · HỌC TỪ THẤT BẠI

Mọi lần Hoà từ chối phải thành tri thức, **không được lưu mỗi câu nói**. Tách: **triệu chứng → gốc bệnh → luật đã sửa → ví dụ → câu kiểm**.

Sổ: `docs/design-campaign/02-FAILURE-LEDGER.md` (F-01…F-14).

⚠️ Bài học đắt nhất tới giờ: **F-01 ghi sổ rồi vẫn sống trên app** — telemetry ánh sáng ban ngày vẫn chiếm giữa màn Trang chủ, **trên** hero, tới tận 23/08. **Ghi sổ mà không có máy canh hoặc không có ví dụ hình thì sổ chỉ là sổ.**

---

## 5 · CHỖ TRA NHANH

- Kiểm kê tri thức: `docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md`
- Token nền: `docs/design-campaign/05-FOUNDATION-BASELINE.md`
- Bản vẽ đang hiệu lực: `docs/mocks/CLAUDE-DESIGN-CURRENT.md`
- Luật vận động/thị giác: `docs/IF-MOTION-VISUAL-LAW.md`
- Chữ Việt: `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`
- Hiến pháp giao diện NT-1..18: `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md`
- Bản cũ của chính tệp này (bách khoa 237 dòng, giữ làm dấu vết): `docs/nhat-ky/design-campaign/SKILL-if-design-BAN-CU-23-08.md` (dời 28/08 lượt dọn kho)
