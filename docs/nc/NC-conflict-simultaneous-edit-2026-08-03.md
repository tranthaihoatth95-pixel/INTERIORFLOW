# NC-10 · XUNG ĐỘT KHI 2 NGƯỜI SỬA ĐỒNG THỜI — Figma / Miro / Revit worksharing (+ bài học Webflow)
**COWORK-NC · 03/08/2026 (đợt 3, bài bổ sung).** Nuôi: **G2 Mood+Collab** (G4 đang build TRỌN GÓI theo `SO-KIEM-TONG` §3 G4 mục 3) + đường lưu `graphJson` (`lib/store.ts` + `app/api/flows/[id]/route.ts`).

**Vì sao có bài này thay vì lặp lại đề bài gốc:** đọc `docs/BAO-CAO-COWORK-NC.md` + `docs/nc/*.md` trước khi viết (đúng §0b bước 1) phát hiện **cả 2 đề tài ĐỢT 3 đã có người làm** — bởi một phiên COWORK-NC khác chạy song song, vừa xong đúng lúc tôi đang làm (file `BAO-CAO-COWORK-NC.md` đổi nội dung GIỮA 2 lần đọc của chính tôi trong phiên này — bằng chứng cụ thể của việc chạy song song, không phải suy đoán): ① first-run cùng ngành D5/SketchUp/Enscape = `NC-firstrun-cung-nganh-2026-08-03.md` · ② presence/collab Figma/Miro/FigJam = `NC-presence-collab-2026-08-03.md`. Cả hai bài đều đủ chuẩn (nguồn thật, số liệu thật, mục "Điều IF nên làm"), đã được phiên kia tự chốt phiên đợt 3 lúc 09:2x sáng 03/08. Viết lại là vi phạm §0b "đừng viết lại cái đã có". Thay vào đó, bài này lấp đúng **1 lỗ hổng NC-9 tự khai** ở dòng cuối: *"cơ chế CRDT/conflict-resolution của document sync KHÔNG nằm trong bài này... ĐỪNG để phiếu code lẫn 2 việc"*. Đây chính là bài đó — và khi grep code thật để viết, phát hiện đây **không phải câu hỏi lý thuyết** mà là **lỗ hổng đang nằm sẵn trong code** (xem §0).

---

## §0 · SEARCH trước — phát hiện từ code thật IF (không phải suy đoán)

Đọc `app/api/flows/[id]/route.ts` + `lib/store.ts` trước khi tra ngành ngoài (đúng §0b bước 1):

- `lib/store.ts:1118-1130` — autosave **debounce 2 giây**, mỗi lần đổi state thì gửi **NGUYÊN KHỐI** `JSON.stringify({ nodes, edges, groups, comments, strokes })` — tức là mọi thứ Mood+Collab sắp có (sticky = node, comment pin, nét bút tablet) đi qua **CÙNG MỘT blob**, không tách riêng.
- `app/api/flows/[id]/route.ts:74-81` — route PUT nhận `graphJson` và ghi thẳng: `prisma.flow.update({ where: { id: r.flow.id }, data })`. **`where` chỉ lọc theo `id`, không so `rev`.** Trường `rev` CÓ tồn tại và có tăng (`rev: { increment: 1 }`) nhưng **không ai đọc lại để so sánh** — ghi mù kiểu "ai lưu sau thắng, không cảnh báo ai".
- `FlowVersion` (bản có thể phục hồi) **chỉ tạo khi người dùng bấm tay "Đánh dấu bản này"** (`action === 'snapshot'`, dòng 36-40) — autosave thường **KHÔNG** tạo version. Nghĩa là: nếu 2 người đụng nhau qua autosave, bên thua **không có đường cứu dữ liệu** trừ khi vừa hay có bản snapshot tay gần đó.
- `lib/collabStore.ts` (presence/cursor) đi đường **riêng, đúng kiến trúc** — poll `/api/cursors` mỗi 900ms, không đụng `graphJson`. Đây là điều NC-9 đề xuất ("presence tách khỏi document, KHÔNG persist") — **phần này IF đã làm ĐÚNG**. Vấn đề nằm ở tầng graphJson, không nằm ở presence.

**Kết luận §0:** IF hiện là **"toàn tài liệu ghi-đè-mù" (whole-document last-write-wins)** — mô hình rủi ro cao nhất trong mọi mô hình ngành khảo bên dưới, vì phạm vi mất dữ liệu = CẢ FLOW tại thời điểm lưu, không phải chỉ phần bị đụng.

---

## §1 · Bốn mô hình ngành xử lý xung đột — xếp từ rủi ro thấp đến cao

| Mô hình | App | Cơ chế | Trải nghiệm khi đụng nhau |
|---|---|---|---|
| **CRDT, ghi-đè theo TỪNG THUỘC TÍNH** | Figma | Not: khoá cả object — chỉ khi 2 người sửa CÙNG property của CÙNG object thì lấy bản mới nhất; khác property/khác object thì cả hai giữ nguyên, không ai mất gì | Rủi ro thấp nhất: bán kính mất dữ liệu = 1 property. Điểm yếu tự thừa nhận: sửa text đồng thời — "B" → "AB" (người 1) và "B"→"BC" (người 2) cùng lúc, kết quả cuối là **AB hoặc BC, không bao giờ là ABC** — Figma chấp nhận vì không tối ưu cho gõ chữ đồng thời |
| **Khoá theo OBJECT (pessimistic lock)** | Miro | Kỹ thuật KHÔNG cho 2 người sửa cùng 1 object cùng lúc — object đang bị người khác chạm thì bị khoá tạm | Rủi ro thấp (không mất dữ liệu) nhưng **đổi bằng ma sát**: 2 threads cộng đồng than phiền trực tiếp đúng chủ đề này — [ý tưởng "cho sửa object cùng lúc"](https://community.miro.com/ideas/editing-same-object-by-multiple-users-at-the-same-time-12341) và [hỏi "nhiều người sửa cùng object"](https://community.miro.com/ask-the-community-45/multiple-users-editing-the-same-object-13344) đều nói rõ đây là **giới hạn kỹ thuật đã biết**, nặng nhất khi 2 người cùng gõ chữ trong 1 thẻ hoặc sửa cùng 1 story card |
| **Khoá theo VÙNG SỞ HỮU + xin phép (pessimistic, có quy trình)** | Revit worksharing | Bật "editable" một workset = **sở hữu độc quyền** mọi phần tử trong đó; đụng phần tử người khác đang giữ → hiện hộp thoại **Editing Request** (tên dự án + phần tử + người xin) cho chủ sở hữu **Grant/Deny**; nhả quyền khi **Synchronize with Central** | Rủi ro thấp nhất, ma sát cao nhất (phải xin-cho) — nhưng đây là **quy trình dân kiến trúc/nội thất đã quen tay hàng chục năm** (BIM, muscle memory đúng đối tượng IF nhắm tới). Nguồn: [Grant a Request to Borrow an Element (Autodesk chính hãng)](https://help.autodesk.com/cloudhelp/2022/ENU/Revit-Collaborate/files/GUID-AC3ADD25-CDBB-42BB-9C08-CED25E647B2B.htm) · [Borrow Elements](https://help.autodesk.com/cloudhelp/2023/ENU/Revit-Collaborate/files/GUID-27E3B22D-79D3-44F5-A630-6E5F614585B4.htm) · [tổng hợp thực chiến](https://bimheroes.com/revit-worksharing/) |
| **Toàn tài liệu ghi-đè-mù, không cảnh báo** ⚠️ = **IF hiện tại** | (bài học phản diện) Webflow Designer↔Editor trước khi có branching | Ghi đè cả trang/site, không kiểm version trước khi lưu | Rủi ro cao nhất: [than phiền kéo dài nhiều năm](https://forum.webflow.com/t/conflicts-between-editor-and-designer/48385) — 1 ca cụ thể: designer sửa lại cả trang chủ, giữa chừng khách sửa 1 chi tiết nhỏ ở trang khác rồi publish → **bản nửa-vời của designer bị đẩy lên production**; [thảo luận thêm](https://discourse.webflow.com/t/changes-being-made-in-designer-and-editor-at-the-same-time/81708). Webflow phải vá bằng tính năng mới **[Page branching](https://help.webflow.com/hc/en-us/articles/33961355506195-Page-branching)** (nhánh + merge, như git) sau nhiều năm bị than |

Mẫu UX chung ngành khi PHÁT HIỆN được xung đột (không phải ngăn từ đầu mà là báo đúng lúc): **optimistic concurrency control** — server so version lúc ghi, lệch thì trả lỗi thay vì ghi đè; thông điệp mẫu ngành hay dùng: *"Nội dung này vừa được người khác sửa"* + nút **Tải lại**; 3 hướng xử khi phát hiện lệch — **DB thắng** (bỏ bản của mình, tải bản mới) · **Client thắng** (ghi đè có chủ đích) · **Gộp tay** (cho xem cả hai, tự chọn). Nguồn: [Handling Optimistic Concurrency in Web Frontends](https://blog.bitsrc.io/handling-optimistic-concurrency-in-web-frontends-1ae7eb0e57a4).

---

## §2 · Kịch bản cụ thể — điều gì xảy ra THẬT trên IF hôm nay nếu G2 ship đúng như code hiện có

1. Designer A và B cùng mở một flow ở canvas Mood+Collab (đúng kịch bản G2 hứa hẹn: presence cho thấy cả hai đang ở đây).
2. A kéo 3 sticky mới, B viết 1 comment + vẽ 2 nét bút — trong cùng khung ~2-4 giây (nhanh hơn nhịp debounce autosave rất nhiều so với tốc độ thao tác tay thật).
3. Trình duyệt của A gửi PUT với `graphJson` = trạng thái **A biết lúc đó** (không có sticky/comment/nét của B vì B chưa kịp gửi/A chưa kịp nhận). Trình duyệt của B gửi PUT tương tự, thiếu phần của A.
4. PUT nào tới server SAU sẽ **ghi đè hoàn toàn** state trước đó — không phải theo thứ tự thao tác, mà theo **thứ tự mạng tới server** (có thể ngược thứ tự thao tác thật nếu mạng A chậm hơn B dù A thao tác trước).
5. Người thua mất **toàn bộ nội dung mới của mình trong flow đó** — không có thông báo, không có lỗi hiện ra, không có bản backup (vì `FlowVersion` chỉ tạo khi bấm tay). Presence vẫn hiện cả hai đang "ở đây, đang cộng tác" — **cảm giác an toàn giả** trong khi dữ liệu vừa mất.

Đây là đúng loại lỗi tệ nhất: **im lặng**. UI không có gì báo sai, người dùng chỉ phát hiện khi F5 lại thấy mất — lúc đó không còn cách truy lại là ai làm mất của ai.

---

## §3 · ĐIỀU IF NÊN LÀM

| # | Đề xuất | Độ khẩn | Căn cứ |
|---|---|---|---|
| 1 | **Dùng `rev` ĐÃ CÓ SẴN làm khoá optimistic concurrency** — client gửi kèm `expectedRev` (rev đã biết lúc tải/lần lưu trước); server so trong transaction, lệch → trả 409 thay vì ghi mù. Field đã tồn tại + đã tăng, chỉ thiếu bước SO SÁNH — chi phí code gần như 0 | 🔴 làm TRƯỚC khi G2 mở nhiều người thật vào 1 canvas | Pattern optimistic concurrency chuẩn ngành; đây là khoảng trống RẺ NHẤT có thể vá trong 4 mô hình khảo ở §1 |
| 2 | **Khi 409: khuôn MÁCH NƯỚC theo `SPEC-NGON-NGU-CHI-DAN`** — "Có người vừa sửa bản này" + nút **Tải lại** (mẫu DB-thắng, không cần dựng UI gộp tay phức tạp cho v1) | 🔴 đi kèm mục 1 | Mẫu phổ biến nhất ngành (bảng §1 dưới cùng); rẻ hơn hẳn Miro-lock hay Revit-request |
| 3 | **Tự tạo 1 `FlowVersion` ngay LÚC PHÁT HIỆN 409** (không phải mọi autosave — chỉ khi có xung đột thật) — cho người thua 1 đường lấy lại phần vừa mất qua lịch sử bản, thay vì mất vĩnh viễn | 🟡 làm cùng đợt với mục 1 nếu rẻ | Học tắt bài Webflow (phải đợi nhiều năm than mới vá bằng branching) — IF vá trước khi bị than |
| 4 | **Báo rõ với PHU/G4: đây là RỦI RO MẤT DỮ LIỆU, KHÔNG nằm trong khuôn "ship trước sửa sau"** (`SO-KIEM-TONG` §3 cơ chế ship-trước-sửa-sau) — lỗi UI sửa sau được, dữ liệu mất rồi thì không. Đề nghị mục 1+2 là ĐIỀU KIỆN TỐI THIỂU trước khi G2 cho > 1 người thật vào cùng flow, không phải việc "sai đâu sửa đó" | 🔴 quyết định của PHU/G4, Cowork chỉ nêu rủi ro không tự quyết vùng code | Nguyên tắc "Cowork không code" + đúng thẩm quyền §2 `SO-KIEM-TONG` |
| 5 | **KHÔNG làm khoá kiểu Miro/Revit ở v1** — object-lock hay xin-phép cần hạ tầng presence-per-object (biết ai đang "giữ" object nào) mà `collabStore` hiện chỉ có cursor, chưa có "đang chọn/đang kéo object nào"; để v1.1 SAU khi mục 1-3 sống và có số liệu thật về tần suất đụng nhau (studio 5-15 người, không phải workshop đông — tần suất đụng CÙNG 1 object có thể thấp, nhưng bán kính mất dữ liệu hiện tại là CẢ FLOW nên vẫn phải vá mục 1 trước) | ⬜ để sau, ghi vào spec "chưa làm" cho khỏi ai tự chế | Giữ phạm vi theo luật cấm bịa việc; đúng tinh thần NC-9 mục 10 (không làm quá tay v1) |
| 6 | **Tách dần payload `graphJson`** (nodes/edges/groups/comments/strokes đang là 1 blob) — về lâu dài, xung đột giữa "B vẽ nét bút" và "A kéo sticky" không nên đụng nhau nếu 2 loại dữ liệu này KHÔNG chung 1 record để so `rev`. Đây là câu hỏi kiến trúc lớn hơn — bài này chỉ nêu, không đề xuất thiết kế lại (ngoài phạm vi Cowork) | ⬜ câu hỏi kiến trúc, để PHU cân nhắc khi rảnh tay | Đối chiếu Figma (property-level) — bán kính nhỏ hơn hẳn vì KHÔNG gộp mọi loại dữ liệu vào 1 record |

---

**Giới hạn nghiên cứu:** ví dụ "B→AB/BC" là diễn giải lại từ blog kỹ thuật Figma (Evan Wallace, "Multiplayer Editing in Figma"), không tự kiểm chứng bằng cách dựng lại thí nghiệm; cơ chế CRDT đầy đủ của Figma phức tạp hơn nhiều so với tóm tắt property-level ở đây (bài gốc dài, chỉ trích phần liên quan). Revit worksharing mô tả theo doc chính hãng — CHƯA xác nhận qua Hoà (dùng AutoLISP/AutoCAD, không rõ có dùng Revit worksharing thật hay không — nếu Hoà có kinh nghiệm thật với Editing Request, nên xác nhận lại bảng §1 dòng Revit bằng trải nghiệm thật thay vì chỉ doc). Số "2 giây debounce" và cơ chế PUT đọc trực tiếp từ code hiện tại (03/08) — có thể đã đổi nếu PHU/G4 sửa `lib/store.ts` sau ngày này, verify lại bằng `git log -- lib/store.ts app/api/flows/[id]/route.ts` trước khi dùng số này làm căn cứ code.
