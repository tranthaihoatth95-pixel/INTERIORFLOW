# ASK / SEARCH — một cửa để tìm và để hỏi

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ (đích đã chốt)** — **MỘT cửa ngữ nghĩa**: tìm · điều hướng · ra lệnh · hỏi · suy luận. Không
tách ô-tìm và ô-hỏi thành hai vật. **[N]** S10 trong `REF-DNA-2026-08-23.md` + chốt 16/08.

**KHÔNG PHẢI** — hai ô cạnh nhau · một chatbot toàn màn · một bảng lệnh chỉ dành cho người thạo.

**Ranh giới với Vitals:** chỉ **tìm** ⇒ không cần Vitals. Cần **suy luận** ⇒ Vitals mới hiện.
Vitals là **chấm CẠNH ô**, hai vật riêng — không phải ô-tìm kiêm hai chế độ (bản buổi sáng 16/08 đã
bị chính Hoà thay bằng bản này). **[N]** `docs/CHOT-16-08-BAN-DUNG.md`.

## 2 · VIỆC CỦA CON NGƯỜI
Tìm một dự án · nhảy tới một màn · chạy một lệnh mà không nhớ nó nằm menu nào · hỏi một câu.
**Và học được phím tắt tại chỗ dùng** — phím tắt phải hiện **ngay trong menu**, không bắt đi tra bảng.

## 3 · NHÂN VẬT CHÍNH
**Ô nhập.** Mọi thứ khác (nhóm kết quả, phím tắt, gợi ý) là phụ trợ cho nó.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép | Ghi chú |
|---|---|
| Nhóm kết quả theo loại | ứng dụng · tệp · hành động — S10 |
| Phím tắt in cạnh từng dòng | dạy tại chỗ dùng |
| Gõ-tiếp (type-ahead) | **IF CHƯA CÓ**; đo 03/08: từ vựng chuột+bàn phím thiếu hẳn |
| Ô tìm trong dropdown dài | thay vì bắt cuộn |

| Bị từ chối | Lý do |
|---|---|
| **Bảng lệnh thứ hai** | xem §7 — hiện có **4 bảng dữ liệu + 3 mặt tiền** |
| Gán phím giả cho lệnh chưa chạy được | lệnh chưa đủ điều kiện ⇒ **mờ kèm lý do**, không phím giả |
| Cướp tổ hợp OS/trình duyệt | nếu nền web không chặn được đáng tin cậy |
| Kích hoạt khi đang gõ chữ | luật hệ phím tắt 10/08 |

## 5 · TRẠNG THÁI
Rỗng (chưa gõ) · đang gõ · không có kết quả · **lệnh mờ kèm lý do** · đang chạy.
🔴 **Trạng thái *đang hỏi AI* chưa đặc tả** — và nó khác hẳn *đang tìm* (một cái tốn tiền, một cái không).

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 10/08 | **Hệ phím tắt toàn app**: mọi lệnh **đã chạy được** phải có đường bàn phím thật, tra từ **một nguồn chung**; tooltip · bảng `⌘/` · bảng lệnh `⌘K` **không được khai lệch hành vi** |
| 16/08 | Một cửa tìm-hoặc-hỏi; Vitals là chấm cạnh ô; phím tắt hiện trong menu; dropdown dài phải có ô tìm + gõ-tiếp |
| 23/08 | Search **ở giữa** thanh trên (đặc tả vỏ) — **chưa đạt** |

## 7 · CA HỎNG THẬT

**① NĂM SỔ LỆNH SONG SONG là gốc bệnh "3 chặng như 3 app" — và nó vẫn chưa đóng.** Chẩn 15/08 chỉ
đúng chỗ đau: không phải bo góc lệch, mà là **mỗi thanh công cụ tự khai danh sách lệnh của mình**.
Phân kỳ đo được: Xoay `RO/RO/Q` · Chép `CO/CO/D` · Đo `DI/DI/T` · Chọn `Esc/V` ⇒ **học phím ở 2D
sang 3D bấm sai** — đó là **chi phí học lại**, không phải chuyện thẩm mỹ.

Đo lại 23/08 — **4 bảng dữ liệu**: ① bảng alias gốc (97 alias) mà bảng phím tắt **vẫn đọc thẳng** ·
② sổ lệnh mới (55 định nghĩa, có test canh không cho lệch số với ①) · ③ nguồn riêng cho toolbar ·
④ **một bảng dispatch còn nằm trong màn 2D, chưa đổi để gọi sổ chung** ⇒ **logic thi hành còn hai bản**.
Và **3 mặt tiền tìm kiếm rời**: bảng lệnh của Home (phụ thuộc canvas node) · bảng lệnh cấp app
(⌘K, 5 màn) · ô tìm dự án (chỉ Home, chỉ tìm giữa các dự án).

**② ⌘K từng CHẾT ở 4 màn.** Trước khi có bảng lệnh cấp app, ⌘K không hoạt động ở 2D · Trình chiếu ·
Files · Cài đặt. Bảng của Home **cố ý giữ nguyên, không đụng** (luật *giữ cái đang tốt*).

**③ Chọn xong bấm Enter không chạy lệnh.** Verify trên trình duyệt thật 05/08 ở màn 2D: phím Enter
**bị một listener capture khác chặn**. **[IF] Ca mẫu: bảng lệnh chạy được ở màn trống không có nghĩa
nó chạy được ở màn có canvas.**

**④ "Một sổ lệnh → sáu mặt hiện" hiện đạt 2/6.** Sổ chỉ khai hai mặt (thanh trạng thái · phím tắt);
bốn mặt còn lại (dock · bảng lệnh · menu ngữ cảnh · …) **cố ý chưa khai** vì *"chưa có giao diện nào
tiêu thụ"*. Và **45/55 lệnh chưa có icon**.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Chẩn 5 sổ lệnh + lộ trình B1–B5 + hai khuôn nhóm lệnh + mini window F9 | `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` |
| Sổ lệnh chung (đọc docstring — nó khai rõ cái gì chưa nối) | `lib/commands/registry.ts` |
| Mặt tiền | `components/studio/AppCommandPalette.tsx` (cấp app) · `components/CommandPalette.tsx` (Home) · `components/SearchProjectsInput.tsx` |
| Trụ "một sổ lệnh → sáu mặt hiện" | `docs/SPEC-HA-TANG-UI-IF.md` §2 |
| Va phím tắt giữa các panel | `docs/SPEC-PANEL-ROLLOUT-IDF.md` §4 |
| Bằng chứng thị giác S9 (phím tắt trong menu) · S10 (một cửa) | `docs/design-campaign/dna/REF-DNA-2026-08-23.md` |

**🔴 CHƯA CÓ / CHƯA GIẢI:**
- **Chuỗi "Search or Ask" = 0 dòng mã.** Một-cửa-tìm-hoặc-hỏi hiện **chỉ là đặc tả**. Không có mic,
  không có nhóm ứng dụng/tệp/hành động.
- **Search chỉ có ở Home, và đứng lệch phải.** Đưa vào giữa ở mọi màn mở một câu hỏi mới: **trong
  chặng thì search tìm cái gì?** Chưa ai trả lời — và không trả lời thì không dựng được.
- **Gõ-tiếp / type-ahead: chưa có.**
- **Bảng dispatch thứ hai trong màn 2D chưa gộp** ⇒ sổ chung chưa thật sự là **một** sổ.
