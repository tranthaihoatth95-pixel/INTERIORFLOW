# NC-9 · PRESENCE & COLLAB — Figma / Miro / FigJam
**COWORK-NC · 03/08/2026 sáng (đợt 3).** Nuôi: **code G2 của G4** (hàng đợi G4 mục 3 TRỌN GÓI: `lib/collab/` presence store · share roles Viewer/Commenter/Editor · comment anchor + UI theo ticket G2).
**Đối chiếu spec đã chốt:** `SPEC-CHANG2-UI-2MODE` — presence on/off + mời(+) · sticky/comment/reaction · share 3 vai · frame theo phòng. Bài này cấp CƠ CHẾ + SỐ cho từng mục đó.

---

## 1 · Presence hiển thị & điều khiển

| Cơ chế | Figma | Miro |
|---|---|---|
| Dải avatar | góc trên phải, mỗi người 1 màu; **màu avatar = màu cursor** | collaboration toolbar; **màu cursor = màu VIỀN avatar, đồng bộ cho mọi người nhìn** |
| Cursor người khác | tên + màu bám theo; dùng như "chỉ trỏ" tự nhiên (vẫy cursor gây chú ý, đặt cạnh object để trỏ) | như Figma |
| Ẩn cursor | có toggle "Show multiplayer cursors" — **forum than: setting KHÔNG NHỚ qua phiên** ([thread](https://forum.figma.com/archive-21/make-show-multiplayer-cursors-setting-sticky-across-sessions-25831)) | tắt được vì "cursor bay đầy màn gây phân tâm workshop đông"; community còn xin "**chỉ hiện cursor người tôi đang follow**" ([idea](https://community.miro.com/ideas/only-view-cursor-of-person-i-am-following-1377)) |
| Follow | **click avatar = observation mode**: theo viewport + mọi thao tác của người đó; cả view-only cũng follow được; opt-in, thoát/vào lại không phá ai; **Figma KHÔNG báo cho người bị theo** (có forum xin "disable observe" — góc riêng tư) | click avatar để follow; đổi người = click người khác |
| Kéo mọi người về mình | **Spotlight** (người trình bày chủ động) | **Bring everyone to me** (moderator, trong Attention Management) |

Nguồn: [Figma observation mode (help)](https://help.figma.com/hc/en-us/articles/360040322673-Follow-along-with-observation-mode) · [Figma blog highlight Observation](https://medium.com/figma-design/figma-fun-fact-click-an-avatar-in-a-file-to-watch-someone-move-around-the-design-2d00fc5e412e) · [Miro Attention management (help)](https://help.miro.com/hc/en-us/articles/360013358479-Attention-management)

## 2 · Kỹ thuật presence — bài engineering Figma (vàng cho `lib/collab/`)

Từ [How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) + [Multiplayer Editing](https://www.figma.com/blog/multiplayer-editing-in-figma/):
- **Presence (cursor + selection + viewport rect) là DỮ LIỆU PHÙ DU** — đi cùng đường WebSocket với document delta nhưng **không bao giờ ghi vào journal/persistence**. Tách 2 loại ngay từ kiến trúc.
- **Cursor throttle ~80 ms/lần gửi** (~12/s); client cập nhật cursor CỦA MÌNH ngay tại chỗ trước khi gửi → cảm giác tức thì; nội suy (interpolation) phía nhận cho mượt.
- Tần suất cao → cân nhắc mã hoá gọn (binary) thay JSON đầy đủ.

## 3 · Reaction · Stamp · Comment (FigJam + Figma)

- **Emote** (FigJam): phím **E** mở bánh xe emoji → giữ chuột = burst PHÙ DU (tan ngay) — phản ứng sống khi ai đó trình bày. ([help](https://help.figma.com/hc/en-us/articles/1500004290981-Stamps-emotes-and-high-fives))
- **Stamp** (FigJam): cùng bánh xe E nhưng ĐẶT XUỐNG thì **GẮN VÀO OBJECT — object di chuyển, stamp đi theo**; dùng làm vote/heatmap async (dán ⭐ lên phương án thích). Phù du vs bền vững cùng 1 bánh xe.
- **Cursor chat** (FigJam): phím **/** — gõ tới đâu người khác thấy tới đó, không cần gửi, tự tan sau ~5 s. ([help](https://help.figma.com/hc/en-us/articles/1500004414842-Send-messages-with-cursor-chat))
- **Comment** (Figma/FigJam): pin trên canvas — hover = preview, click = mở thread; reply + **@mention** (bắn notification) + **emoji reaction trên từng comment**; **Resolve = ẩn khỏi canvas** (không xoá); mức notification: "Everything" vs "**Just mentions and replies**". ([guide chính hãng](https://help.figma.com/hc/en-us/articles/360039825314-Guide-to-comments-in-Figma), [manage comments](https://help.figma.com/hc/en-us/articles/360041547593-View-and-manage-comments))

---

## 4 · ĐIỀU IF NÊN LÀM (rót thẳng vào G2 của G4)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **`lib/collab/` tách 2 tầng NGAY từ store**: presence (cursor·selection·viewport) = ephemeral, KHÔNG persist, không đi qua FlowVersion/Doc; chỉ comment/stamp/share-role mới bền. Ghi thành luật đầu file | Kiến trúc Figma; trộn 2 loại = nguồn bug + phình DB |
| 2 | **Số cho presence v1**: cursor gửi throttle **80–100 ms**, cursor mình render local-first, nội suy phía nhận; selection + viewport gửi theo sự kiện (không theo nhịp) | Số Figma công bố; đủ mượt mà rẻ |
| 3 | **Màu người = MỘT nguồn**: avatar viền + cursor + selection-highlight cùng màu, gán theo người (bảng màu từ `SPEC-DESIGN-SYSTEM-IF`, né --success/--warning) | Miro đồng bộ màu được khen dễ đọc; đỡ 1 lớp học |
| 4 | **Follow v1 = click avatar theo viewport** (kiểu observation), thoát bằng pan/zoom tay như Figma; **KHÔNG làm spotlight/bring-to-me v1** — studio 5-15 người duyệt phương án không phải workshop 50 người | Follow là 80% giá trị; 2 tính năng kia là facilitation cho đám đông |
| 5 | **Toggle "Ẩn con trỏ người khác" có mặt từ v1 và ĐƯỢC NHỚ** (localStorage) — sửa thẳng pain Figma "setting không sticky" bị than trên forum | Pain có thật, phí sửa ~0; điểm "IF chu đáo hơn" rẻ nhất bài này |
| 6 | **Reaction của G2 = mô hình STAMP-GẮN-OBJECT** (không phải emote bay): khách/đồng nghiệp dán ⭐❤️✅ lên render/moodboard → thành DỮ LIỆU DUYỆT PHƯƠNG ÁN (đếm được, lọc được theo frame/phòng). Emote phù du: để sau, không nuôi quyết định | FigJam stamp = vote/heatmap là đúng use-case duyệt phương án nội thất; khớp "frame theo phòng" của spec |
| 7 | **Comment anchor theo OBJECT** (spec G4 đã đúng hướng — giữ): pin bám object khi object di chuyển (bài học stamp FigJam); hover preview → click mở thread; **Resolve = ẩn không xoá**; @mention bắn notification | Cả 3 cơ chế là chuẩn ngành user đã quen tay (§0b bước 3) |
| 8 | **Notification mặc định = "mentions + replies"**, KHÔNG "everything" | Mức mặc định Everything = spam là bài học Figma phải đẻ 2 mức |
| 9 | **Share 3 vai khớp hành vi Figma**: Viewer (xem + follow + reaction) · Commenter (+ comment/stamp) · Editor (full) — viewer ĐƯỢC follow (Figma cho phép, hợp duyệt phương án với khách) | Map 1-1 vào mô hình 3 vai đã chốt trong spec |
| 10 | **KHÔNG làm v1**: cursor chat · high-five · audio · emote bay — vui nhưng ngoài ticket G2; ghi vào spec mục "để sau" cho khỏi ai tự chế | Giữ phạm vi; luật cấm bịa việc |
| 11 | **Riêng tư**: theo Figma — không báo "ai đang theo dõi bạn"; chỉ hiện tổng thể dải avatar ai đang Ở TRONG dự án. Ghi 1 dòng vào spec để khỏi tranh luận lại | Forum Figma có tranh cãi — chọn theo mặc định ngành, ghi rõ là lựa chọn có chủ đích |

**Giới hạn nghiên cứu:** số 80 ms từ tài liệu kỹ thuật Figma/cộng đồng kỹ thuật thuật lại bài blog gốc 2019 — kiến trúc hiện tại của Figma có thể đã tinh vi hơn (bài [Making multiplayer more reliable](https://www.figma.com/blog/making-multiplayer-more-reliable/) chưa đọc sâu); cơ chế CRDT/conflict-resolution của document sync KHÔNG nằm trong bài này (G2 v1 chỉ cần presence + comment — sync đồ hoạ đa người là chuyện khác, ĐỪNG để phiếu code lẫn 2 việc); chưa khảo Miro/FigJam trên tablet cảm ứng (liên quan §0c mảng 3 — khi G4 dựng UI cần tự kiểm đường chạm cho follow/stamp).
