# Chat nhóm có AI trong IF — và phát hiện: layout Hoà vừa mô tả ĐÃ CÓ trong IF

> Hoà gửi ảnh **Strut** + mô tả cơ chế: *trái = doc đính kèm (dễ kiểm soát, cảm giác tài liệu auth,
> nhấn ✕ là gỡ) · phải = chat nhóm · **chưng cất trong chat → tài liệu tự đặt tên → nhảy sang ô bên
> trái***.
>
> **Khám xong: IF đã có đúng layout đó, đã có ✕ gỡ, đã có API nhận tài liệu văn bản có tên.
> Thiếu duy nhất MỘT MŨI TÊN: chat → tài liệu.** Chi tiết ở §2.

---

## 1 · Đọc ảnh — hai lớp

### Lớp 1 · Ảnh có gì (mô tả lại để Hoà xác nhận tôi không hiểu sai)

| Vùng | Nội dung |
|---|---|
| **Rail trái** | `Inbox` · `Quick Note` · `Search` · nhóm **Workspaces** (Small Business Guide đang chọn, Social Posts, Research, Dieter Rams, Video Scripts, Series, Archive, Browse all, + New space) · đáy: `Voice & Tone` · `Help & Support` |
| **Giữa (chính)** | Tiêu đề `Small Business Guide` · `Share` · **3 nút đổi kiểu xem** (list / grid / board — grid đang bật) · `⋯` |
| **Nhóm nội dung** | Gom theo **trạng thái**, mỗi trạng thái một **vòng tròn màu**: `Ideas` (vòng nét đứt xám) · `Research` (vòng tím) · `Drafts` (vòng hổ phách). Mỗi nhóm có `+` bên phải |
| **Thẻ tài liệu** | tiêu đề → gạch đầu dòng outline → đoạn thân **mờ dần xuống đáy** → chân thẻ có **chip lặp lại đúng vòng tròn màu** + tên tag (`Hiring` · `CS` · `Growth` · `Sales`) |
| **Thẻ rỗng** | `+ New Doc` viền nét đứt, đứng **đầu** danh sách |
| **Nút nổi** | pill `✦ ⌘K` |
| **Panel phải** | `● Strut` (đốm hổ phách = danh tính AI) · lời chào · ô soạn **`Send a message about Marketing`** + mũi tên gửi |

### Lớp 2 · Bốn cơ chế đáng lấy (và một cái KHÔNG nên lấy)

| ✅ Lấy | Vì sao |
|---|---|
| **Trạng thái = vòng tròn màu, lặp ở thẻ và ở chip** | Một ngôn ngữ thị giác duy nhất, **không cần chữ nhãn**. Rẻ và cao cấp |
| **Thân bài mờ dần xuống đáy** (`mask-image` linear-gradient) | Đúng thứ Hoà đã yêu cầu cho danh sách 4 nhóm — **dùng lại 1 kỹ thuật cho 2 chỗ**, hệ thống tự thống nhất |
| **Placeholder ô soạn mang ngữ cảnh**: *"Send a message about **Marketing**"** | Đây là **cách thanh lịch nhất** để nói "AI đang đọc gì" — thay cho chip ngữ cảnh tôi định đề xuất. Ngữ cảnh nằm ngay chỗ người ta đang gõ |
| **Thẻ rỗng `+ New Doc` đứng đầu, không phải nút riêng** | Chỗ tạo mới ở đúng nơi vật thể sẽ xuất hiện |

| ⛔ Không lấy nguyên | Vì sao |
|---|---|
| **Thẻ tài liệu hiện đoạn thân bài** | Strut là app **viết** — doc là sản phẩm, nên preview chữ có nghĩa. IF là app **vẽ** — tài liệu là *bằng chứng*. Một PDF spec vật liệu thì "đoạn đầu" vô nghĩa. → IF phải dùng **thumbnail ảnh/trang bìa PDF**, chữ chỉ là phụ |

---

## 2 · 🔴 Phát hiện chính: IF đã có layout này, thiếu đúng một mũi tên

`app/projects/[id]/notebook/page.tsx` — code thật, đã đọc:

```
gridTemplateColumns: '30% 50% 20%'
 ├── 30%  NotebookSourcesSidebar   ← "ô tài liệu bên trái" của Hoà
 ├── 50%  NotebookChatPanel        ← panel chat
 └── 20%  NotebookSourceViewer     ← cột đọc tài liệu
```

Và đối chiếu từng chi tiết Hoà mô tả:

| Hoà mô tả | Trong IF | Bằng chứng |
|---|---|---|
| doc đính kèm bên trái | ✅ **có** | `NotebookSourcesSidebar.tsx` (404 dòng), header comment: *"cột trái Project Notebook (30% desktop)"* |
| nhấn ✕ gỡ bỏ | ✅ **có** | `onRemove={nb.removeSource}` + `Trash2` icon + comment *"Nút ⋯ xoá source"* |
| dễ kiểm soát, cảm giác auth | ✅ **có** | icon theo `kind` (PDF/ảnh/URL/**Mic** cho họp) + `StatusBadge` 3 trạng thái (`Đang xử lý` / `Sẵn sàng` / `Lỗi`) + filter tabs `Tất cả · PDF · Ảnh · Văn bản · Liên kết · **Cuộc họp**` |
| chat bên phải | ✅ **có** | `NotebookChatPanel.tsx` (355 dòng), citation `[1][2]` bấm được |
| **tài liệu tự đặt tên rồi nhảy sang trái** | ❌ **CHƯA CÓ** | ⬅️ **đây là toàn bộ việc phải làm** |

### Và cái cần để làm mũi tên đó cũng đã có sẵn

```ts
onAddText={(title, content) => nb.addTextOrUrl({ kind: 'text', title, content })}
```

→ **Đã có hàm nhận `title` + `content` và tạo source mới.** Chưng cất chỉ cần gọi đúng hàm này với
`title` do model sinh ra. Route `POST /api/notebook/[projectId]/source` cũng đã tồn tại.

**Kết luận về chi phí: đây là việc RẺ.** Không phải xây panel, không phải xây API, không phải đổi
schema. Chỉ thêm **một nút + một lần gọi model để đặt tên**.

---

## 3 · Một chỗ nên sửa luôn: cột 20% là cột yếu

`30% / 50% / 20%` — cột đọc tài liệu **20% là không đọc được**. Một trang A4 nhồi vào 20% màn hình
là chữ 6px.

Mô hình 2 panel Hoà vừa mô tả **tốt hơn cái đang có**:

| | Hiện tại | Đề xuất |
|---|---|---|
| Desktop | `30 / 50 / 20` | **`38 / 62`** — tài liệu · chat |
| Đọc tài liệu | cột 20% riêng | **bung tại chỗ**: bấm thẻ → tài liệu mở rộng chiếm cả cột trái (`38 → 70%`), chat co lại nhưng **không mất** |
| Mobile < 900px | xếp dọc + 3 tab (đã có) | giữ nguyên, chỉ còn **2 tab** |

Bỏ một cột đi mà **đọc được hơn** — đây là kiểu sửa nên làm ngay, không chờ.

---

## 4 · Cơ chế CHƯNG CẤT — thiết kế chi tiết

Đây là phần Hoà mô tả và là giá trị lõi. Bốn câu hỏi phải trả lời:

### ① Chưng cất cái gì?

Không phải cả kênh chat. **Một vùng chọn có biên rõ**, ba cách chọn:

| Cách | Cử chỉ | Dùng khi |
|---|---|---|
| **Cả nhánh** | nút ⚗️ trên đầu nhánh | mặc định, phổ biến nhất |
| **Khoảng tin** | chọn tin A → Shift-chọn tin B | cuộc bàn dài, chỉ lấy đoạn kết luận |
| **Một câu trả lời AI** | nút ⚗️ trên chính tin đó | câu trả lời tốt, muốn giữ |

### ② Tên tự sinh theo khuôn nào?

Đặt tên tự do sẽ ra những cái tên vô nghĩa kiểu *"Cuộc trò chuyện về thiết kế"*. Phải có **khuôn cố định**:

```
[Loại] · [Chủ đề] · [YYYY-MM-DD]
```

| Ví dụ thật |
|---|
| `Chốt · Vật liệu sàn phòng khách · 2026-07-30` |
| `Họp · Góp ý khách Villa Mr Chương · 2026-07-30` |
| `Tra cứu · Chống ẩm khu vệ sinh · 2026-07-30` |

Bốn `Loại` cho phép: **`Chốt` · `Họp` · `Tra cứu` · `Ghi chú`**. Model chỉ được chọn trong bốn cái
này — không được tự nghĩ loại mới. Đây là chỗ giữ cho danh sách bên trái **luôn đọc được sau 6 tháng**.

Và **tên phải sửa được ngay khi vừa hiện ra** (inline edit, con trỏ đã đặt sẵn trong ô). Tự động đặt
tên mà không cho sửa là chỗ AI làm người dùng khó chịu nhất.

### ③ Nội dung tài liệu chưng cất gồm gì?

Không phải bản ghi chat thô. **Bốn khối, theo thứ tự:**

| Khối | Nội dung | Vì sao |
|---|---|---|
| **Kết luận** | 1–3 câu, model viết | Cái người ta cần khi mở lại sau 3 tháng |
| **Quyết định** | gạch đầu dòng: *ai chốt gì* | Đây là thứ có giá trị pháp lý/nghề nghiệp |
| **Neo** | mã / tờ / vùng tô / node liên quan | ⬅️ **moat của IF** — Slack không có |
| **Bản ghi gốc** | nguyên văn, **gập lại mặc định** | Để kiểm khi tranh chấp, nhưng không làm rối |

Khối 4 gập lại là quan trọng: tài liệu *"cảm giác auth"* mà Hoà nói đến đến từ chỗ **có bằng chứng
gốc nhưng không phô ra**.

### ④ Chưng cất rồi thì chat còn gì?

Tin nhắn gốc **không xoá**, nhưng nhánh đó được đóng dấu:
`⚗️ Đã chưng cất → Chốt · Vật liệu sàn phòng khách` (bấm được, nhảy sang thẻ bên trái).

→ Chat trở thành **quá trình**, tài liệu bên trái là **kết quả**. Không ai phải cuộn lại tìm.

---

## 5 · Bốn bài toán RIÊNG của chat nhóm có AI — và cách giải

Chuẩn thiết kế AI-chat hiện hành (setproduct anatomy, ChatGPT/Claude/Gemini) **chỉ bàn 1 người ↔ 1 AI**.
Không một dòng nào bàn nhiều người ↔ 1 AI. Đây là vùng chưa có chuẩn → phải suy từ ràng buộc của IF.

| # | Bài toán | Cách giải | Bỏ qua thì |
|---|---|---|---|
| **1** | **Nói với ai?** Câu này nói với người hay với AI? | **`@vitals` là công tắc duy nhất.** Không `@` thì AI không đọc, không gọi API, không tồn tại. **Không có "AI tự chen vào khi thấy hữu ích"** | AI nói leo → nhóm tắt tính năng trong 3 ngày |
| **2** | **AI đọc gì?** Lịch sử nhóm dài vô hạn, phần lớn là *"ok"*, *"xong chưa"* | Ba lớp có biên: (a) tin được `@`/reply · (b) **20 tin gần nhất TRONG CÙNG NHÁNH** · (c) RAG top-k + đối tượng đang neo. **Không đọc cả kênh.** Và nói ra bằng placeholder kiểu Strut: *"Hỏi Vitals về **tờ A-03**…"* | Tốn tiền, trả lời tệ, tràn cửa sổ |
| **3** | **AI sai trước mặt cả nhóm** | **Mặc định 🔒 riêng** với người gọi, có nút **"Chia sẻ cho nhóm"**. Người gọi kiểm trước rồi mới phát | Sai 1-1 thì bỏ qua; sai giữa nhóm thì **mất uy tín tập thể** |
| **4** | **Thứ tự.** AI mất 10–30 s, trong đó nhóm đã nói thêm 4 câu | **Trả lời là NHÁNH CON** (`parentId`), neo vào câu hỏi, không rơi xuống cuối | Câu trả lời đọc như người điên nói xen |

### Về bài toán 3 — và chỗ nó khớp đẹp với chưng cất

Ba mức công khai, **cùng một cử chỉ leo thang**:

```
🔒 Riêng (mặc định)  →  👥 Chia sẻ cho nhóm  →  ⚗️ Chưng cất thành tài liệu
   nháp                    đã kiểm                  đã chốt, có tên, vào Notebook
```

Đây không phải ba tính năng — là **một trục duy nhất**: *độ chín của thông tin*. Người dùng học một
lần, dùng cho cả ba.

⚠️ **Đánh đổi phải nói thật**: mặc định 🔒 riêng làm giảm cảm giác "AI là thành viên nhóm". Nhưng
nghề này **nói sai một con số vật liệu là mất tiền thật** → lọc trước khi phát là đúng. Nếu 1 tháng
dùng thật thấy rườm thì đảo mặc định, rẻ.

### Và không stream cho người khác

Người gọi thấy chữ chạy. Người khác chỉ thấy **một dòng**: `⟳ Vitals đang trả lời cho Hoà…` → xong
mới hiện cả khối. Ba người cùng gọi = ba khối chữ nhảy = không đọc được gì.

**May mắn: điều này trùng ràng buộc đã có.** `ChatPanel.tsx` polling **3 giây** (comment: *"LAN nội bộ
là đủ mượt; realtime WebSocket để dành bản cloud"*) → **không thể** stream cho người khác. Nghĩa là
không phải làm gì thêm, chỉ cần **đừng** cố làm cái không nên làm.

---

## 6 · Chuẩn ngoài — lấy nguyên, đừng phát minh lại

| Chuẩn | Số cụ thể | Trạng thái IF |
|---|---|---|
| 6 trạng thái tin nhắn | `Queued · Thinking · Streaming · Complete · Error · Stopped` | ❌ IF chỉ có "typing 3 chấm" |
| Token đầu tiên | **< 800 ms**, nếu không đạt thì *Thinking* phải **có nội dung** | ❌ |
| Gộp token khi vẽ | **30–60 ms/khung** | ❌ |
| Khoá auto-scroll | khi người dùng cuộn lên **> 100 px** | ❌ — bắt buộc với chat nhiều người |
| Bề rộng dòng đọc | 720–768 px | ⚠️ IF là panel → dùng **`65ch`**, không dùng px cứng |
| Không làm chậm giả | *"Do not artificially slow down a fast model"* | ✅ giữ |
| Lỗi phải có tên | không dùng *"Something went wrong"* | ❌ |
| Citation | *"non-negotiable for trust"* | ✅ **`NotebookChatPanel` đã làm đúng** — nhân bản sang chat nhóm |

---

## 7 · Ba mặt chat đang có + ranh giới đã chốt sẵn

| Mặt | File | Cơ chế |
|---|---|---|
| Người ↔ người | `ChatPanel.tsx` | polling 3 s, con trỏ `after=`, giữ 300 tin cuối |
| Người ↔ tài liệu (RAG) | `NotebookChatPanel.tsx` | citation bấm được, 4 câu gợi ý, Enter gửi / Shift+Enter xuống dòng |
| Người ↔ app | `VitalsGesturePanel` · `StatusBar.tsx` | cửa AI duy nhất |

Chat nhóm LLM là **mặt thứ tư** → phải qua **Luật #6**. Và luật `7.4.2` đã chốt biên từ trước:

> *"chat **GẮN NGỮ CẢNH DỰ ÁN** được phép; chat **CHUNG** kiểu Slack/tán gẫu (lặp Lark/Zalo) thì không."*

→ Cách qua Luật #6 **không phải** thêm mặt thứ tư, mà là **gộp**: chat nhóm sống **trong Notebook**
(`38/62`), dùng lại `ChatMessage` + `NotebookSource`, và Vitals vẫn là danh tính AI duy nhất.
**Không sinh thêm panel nào.**

### ⛔ Bốn thứ đừng làm

| ⛔ | Vì sao |
|---|---|
| Bot thứ hai có tên khác | Vitals là danh tính AI duy nhất. Hai giọng = học hai thứ, tin không cái nào |
| AI tự nói khi không được gọi | §5 bài toán 1 — lỗi giết tính năng |
| Chat chung kiểu Slack | Luật `7.4.2` cấm. Lark + Zalo đã làm, IF không thắng |
| WebSocket realtime lúc này | Code ghi rõ *"để dành bản cloud"*. Tốn 1 tuần cho 0 giá trị nhìn thấy |

---

## 8 · Hạn mức gọi — luật phải có

Nhóm 5 người, mỗi `@vitals` là một lần gọi API thật. Không chặn thì hoá đơn tăng âm thầm.

IF đã có khái niệm **credit** trong hệ node (`three.cad2fbx`: *"0 credit, 100% tất định"*).
→ Dùng lại đúng khái niệm: hiện credit còn lại **ngay trên ô soạn**, hết thì **làm mờ nút gửi + một
dòng giải thích**. Không popup.

---

## 9 · Xếp hàng (mã chưa cấp — kiểm trùng trước khi dán vào cây)

| Đợt | Việc | Chi phí | Ghi chú |
|---|---|---|---|
| **1** | **Layout `38/62`** + bung tài liệu tại chỗ, bỏ cột 20% | **Rẻ** | Sửa 1 dòng `gridTemplateColumns` + state bung. Làm được ngay |
| **2** | **Chưng cất**: nút ⚗️ · khuôn tên 4 loại · 4 khối nội dung · gọi `onAddText` đã có · dấu *"Đã chưng cất"* | **Rẻ–Trung bình** | ⬅️ **Việc lõi.** API + panel đã có sẵn |
| **3** | `ChatMessage` thêm `parentId` + `role` · nhánh con · `@vitals` | Rẻ | Xương sống chat nhóm. **Không thêm bảng** |
| **4** | 6 trạng thái + khoá auto-scroll 100 px + lỗi có tên + `65ch` | Rẻ | Chuẩn ngoài, không phát minh |
| **5** | Trục 🔒 Riêng → 👥 Nhóm → ⚗️ Chưng cất | Trung bình | Có thể đảo mặc định sau khi dùng thật |
| **6** | Vòng tròn màu theo trạng thái + thân mờ dần + thumbnail thay preview chữ | Rẻ | Lớp thẩm mỹ, làm sau khi cơ chế đúng |
| **7** | Hạn mức credit trên ô soạn | Rẻ | Làm kèm đợt 3 |
| — | Neo chat vào node/tờ/vùng tô | Trung bình | **Moat thật.** Phụ thuộc `7.4.1` (ghim góp ý) |
| — | WebSocket realtime | Đắt | ⛔ Hoãn |

**Đợt 1 + 2 là một cụm rẻ và đã đủ dùng thật** — vì nó chỉ nối một mũi tên vào thứ đã xây xong.

---

## 10 · Câu chốt

Chat nhóm LLM hiệu quả trong IF **không phải một ChatGPT nhiều người**. Nó là:

> **Notebook hai cột: chat là QUÁ TRÌNH, tài liệu bên trái là KẾT QUẢ.**
> Vitals được gọi tên mới nói · trả lời neo vào câu hỏi · luôn kèm nguồn kiểm được · mặc định nói
> riêng · và **cái gì đáng giữ thì chưng cất thành tài liệu có tên, có neo, có bằng chứng gốc.**

Cái Hoà mô tả từ ảnh Strut **đúng hướng và IF đã đi 80% đường** — thiếu đúng một mũi tên và một lần
sửa `gridTemplateColumns`.

Từ khoá tra thêm: `mention-based AI invocation` · `ephemeral bot reply` · `threaded AI response` ·
`chat-to-artifact distillation` · `context-aware composer placeholder` · `RAG citation UI` ·
`mask-image text fade` · `AI message states` · `auto-scroll lock`.

---

*Cowork, 30/07/2026. Đọc code thật: `app/projects/[id]/notebook/page.tsx:151-190`,
`components/notebook/NotebookSourcesSidebar.tsx:1-60`, `NotebookChatPanel.tsx`, `NotebookSourceViewer.tsx`,
`useNotebook.ts`, `types.ts`, `app/api/notebook/[projectId]/{query,source,sources}/route.ts`,
`components/ChatPanel.tsx:26-50`, `prisma/schema.prisma` (`ChatMessage` · `NotebookSource:151`),
`lib/nodes/render-v2.ts:231-237`, `docs/IF-FEATURE-TREE.md` `7.4.1`/`7.4.2`.
Nghiên cứu ngoài: setproduct AI-chat anatomy (9 thành phần · 6 trạng thái · ngưỡng 800 ms / 30-60 ms / 100 px).*
