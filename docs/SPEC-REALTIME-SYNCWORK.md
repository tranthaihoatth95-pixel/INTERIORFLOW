# SPEC-REALTIME-SYNCWORK — nghiên cứu đồng bộ realtime, viết bởi COWORK-PHU (06/08/2026)

> ⚠️ **CẢNH BÁO LỆCH BỐI CẢNH — đọc trước khi dùng file này.** Phiếu việc gọi tên "SyncWork" (app
> quản lý công việc studio, theo Memory: Expo/React Native, mobile-first, micro-interaction) nhưng
> **ràng buộc kỹ thuật phiếu đưa ra lại là của InteriorFlow** (app DESKTOP Electron, offline-first,
> dữ liệu ở file `.idf` cục bộ, đã có Prisma+SQLite — xem `lib/cad/idf.ts`, `electron/main.js`).
> Phiên COWORK-PHU này **chỉ mount được `~/Downloads/interiorflow`**, không có quyền đọc repo
> SyncWork nào để kiểm chứng ngược. Tôi KHÔNG bịa constraint SyncWork từ trí nhớ (đúng §0o) — thay
> vào đó viết spec bám sát ĐÚNG các ràng buộc đã cho trong phiếu (vốn khớp kiến trúc IF hơn), và để
> nguyên nghi vấn này cho TỔNG/Hoà xác nhận file này thực sự áp cho app nào trước khi giao Claude Code.
> Nếu đây đúng là cho SyncWork thật (React Native, không phải Electron/.idf), phần "Ràng buộc" và
> "Tích hợp với code hiện có" bên dưới cần viết lại — phần so sánh 3 công nghệ (§1-§2) thì dùng lại
> được nguyên vì nó không phụ thuộc framework UI.

## 0. Ràng buộc đã cho trong phiếu (dùng làm căn cứ chấm điểm)

1. App chạy trên desktop (được mô tả là Electron trong phiếu) — **phải chạy được offline**, không cloud-first.
2. Dữ liệu dự án là **file cục bộ** (`.idf` theo mô tả IF — JSON versioned, xem `lib/cad/idf.ts:122-126`).
3. Quy mô nhỏ — vài đến vài chục người dùng/studio, không phải hàng nghìn.
4. Đã có **Prisma + SQLite cục bộ** sẵn (`prisma/schema.prisma`) làm nguồn lưu trữ hiện tại.
5. **§0v L-EXT1** — không khoá vendor ở phần lõi; chấm điểm nặng các giải pháp gắn chặt vào 1 hãng.
6. 3 màn hình đang bị chặn theo phiếu: **Kanban ghi ngược** (2 chiều, không chỉ đọc như
   `LarkKanbanTab` hiện tại — `components/dashboard/LarkPanels.tsx:176-210` CHỈ ĐỌC, xem docstring
   `:8-10` "không có thao tác nào ghi ngược Larkbase"), **chat nhóm**, **multi-cursor**.

`grep -rna "yjs\|liveblocks\|socket.io\|partykit\|pusher\|ably\|automerge" package.json` → **0 kết
quả** (chạy 06/08, xác nhận trước khi viết file này) — chưa có dependency realtime nào trong repo.

## 1. Ba phương án — bảng so sánh

| Tiêu chí | **Yjs** (+ `y-websocket`/`y-webrtc`) | **Automerge** (+ `automerge-repo`) | **Hosted: Liveblocks / PartyKit** |
|---|---|---|---|
| Offline-first | **Tốt nhất** — IndexedDB provider có sẵn (`y-indexeddb`), merge tự động khi có mạng lại, đã dùng rộng rãi (Obsidian Sync-tương tự dùng cơ chế này) | **Tốt** — `automerge-repo` có `IndexedDBStorageAdapter` + network adapter tách rời, triết lý "local-first" là mục tiêu thiết kế gốc của thư viện | **Yếu với offline thật** — Liveblocks có "offline support" nhưng vẫn cần kết nối lại để merge qua server của họ; PartyKit là stateful edge server, mất mạng = mất room đang chạy |
| Khoá vendor (L-EXT1) | **Thấp** — MIT, mã nguồn mở, tự host relay, đổi provider (websocket/webrtc/p2p) không đổi CRDT core | **Thấp** — MIT/tương tự, Automerge Rust+WASM core độc lập, network adapter tự viết được | **Cao (Liveblocks)** — SaaS đóng, API/SDK riêng, dữ liệu đi qua hạ tầng của họ. **Trung bình (PartyKit)** — nay thuộc Cloudflare, self-host được (mã nguồn mở) nhưng convention gắn với Cloudflare Workers |
| Chi phí | Thấp — chỉ trả chi phí hạ tầng relay (VPS nhỏ hoặc máy trong studio), thư viện free | Thấp — tương tự Yjs | Có — theo connection/MAU (Liveblocks) hoặc theo request/Durable Object (PartyKit); rẻ lúc nhỏ, tăng theo scale |
| Độ khó tích hợp với code hiện có | **Trung bình** — cần viết server relay mới (không có sẵn), cần quyết định phần nào của `Doc`/Kanban dùng Yjs shared-type thay vì Prisma thuần | **Trung bình-cao** — hệ sinh thái JS nhỏ hơn Yjs, ít ví dụ tích hợp Next.js/Electron sẵn có, nhưng mô hình "toàn bộ doc là 1 CRDT" khớp tự nhiên với triết lý `.idf` (file JSON versioned) hơn Yjs (vốn thiên về shared-type nhỏ lẻ: Y.Map/Y.Array) | **Thấp nhất ban đầu** — SDK có sẵn presence/cursor/storage, nhưng phải học API riêng của họ, và phải tự nghĩ cách đồng bộ ngược về Prisma/`.idf` (2 nguồn sự thật) |
| Ai chạy server | Studio tự host (1 tiến trình Node nhỏ, `y-websocket` server mẫu ít dòng) hoặc LAN-only qua `y-webrtc` (không cần server tập trung, hợp studio nhỏ cùng mạng) | Studio tự host `sync-server` (Rust binary chính thức của Automerge) hoặc dùng adapter WebSocket tự viết | Bên thứ 3 chạy (Liveblocks Cloud) hoặc tự host PartyKit trên Cloudflare Workers (vẫn phụ thuộc hạ tầng Cloudflare cho bản dễ nhất) |
| Multi-cursor / presence có sẵn không | Có, nhưng phải tự dựng UI (awareness protocol — `y-protocols/awareness`, chỉ là dữ liệu, không có UI) | Tương tự — `automerge-repo` chưa có awareness/presence chuẩn hoá bằng Yjs, cần tự thêm kênh ephemeral riêng | **Có sẵn, đẹp nhất** — đây là thế mạnh SaaS, cursor UI gần như cắm-là-chạy |

## 2. Chấm điểm (thang 1–5, 5 = tốt nhất cho ràng buộc §0)

| | Offline-first | Không khoá vendor | Chi phí | Dễ tích hợp | Tổng |
|---|---|---|---|---|---|
| Yjs + y-websocket (tự host) | 5 | 5 | 4 | 3 | **17** |
| Automerge + sync-server tự host | 5 | 5 | 4 | 2 | **16** |
| Liveblocks (hosted) | 2 | 1 | 3 | 5 | 11 |
| PartyKit (self-host trên Cloudflare) | 3 | 3 | 3 | 4 | 13 |

**Kiến nghị: Yjs + `y-websocket` (relay tự host), dự phòng `y-webrtc` cho LAN cùng studio.**

Lý do chọn Yjs thay vì Automerge dù điểm rất sát nhau:
- Hệ sinh thái JS/TS trưởng thành hơn nhiều (số lượng binding, ví dụ Next.js/Electron, cộng đồng) —
  quan trọng vì đây là quy mô 1 studio nhỏ, không có đội riêng nuôi hạ tầng CRDT.
- `y-indexeddb` + `y-websocket` là combo đã chứng minh trong sản xuất (nhiều app ghi chú/collab
  dùng), giảm rủi ro "tự dựng thứ chưa ai kiểm chứng" hơn Automerge (vốn mạnh về lý thuyết
  local-first nhưng ít case study production quy mô lớn bằng Yjs).
- Automerge phù hợp hơn nếu **toàn bộ tài liệu** (cả cấu trúc `.idf`) muốn là 1 CRDT thống nhất —
  nhưng đó là thay đổi kiến trúc lớn, rủi ro cao cho 1 sprint đầu. Yjs cho phép áp CRDT **cục bộ**
  vào đúng 3 màn hình đang chặn (Kanban/chat/cursor) mà không đụng phần còn lại của `Doc`.

**KHÔNG chọn Liveblocks/PartyKit làm lõi** — vi phạm trực tiếp §0v L-EXT1 (khoá vendor) và mâu
thuẫn với ràng buộc offline-first #1. Có thể cân nhắc lại **CHỈ nếu** sau này chốt app này là
cloud-first thật sự (không phải trường hợp hiện tại theo phiếu).

## 3. Sơ đồ luồng dữ liệu (ai giữ nguồn sự thật, xung đột hợp nhất ở đâu)

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│  Máy A (studio, offline OK) │        │  Máy B (studio, offline OK) │
│                              │        │                              │
│  Prisma/SQLite cục bộ        │        │  Prisma/SQLite cục bộ        │
│  (nguồn sự thật CHO PHẦN    │        │  (nguồn sự thật CHO PHẦN    │
│   KHÔNG cần realtime — xem  │        │   KHÔNG cần realtime)        │
│   §4)                        │        │                              │
│         ▲                    │        │         ▲                    │
│         │ ghi sau khi CRDT   │        │         │ ghi sau khi CRDT   │
│         │ merge xong          │        │         │ merge xong          │
│  ┌──────┴───────┐            │        │  ┌──────┴───────┐            │
│  │ Y.Doc cục bộ  │◄───────────┼────────┼─►│ Y.Doc cục bộ  │            │
│  │ (Kanban·chat· │  y-websocket / y-webrtc │ (Kanban·chat· │            │
│  │  cursor state)│  (relay, KHÔNG giữ    │  cursor state)│            │
│  └──────┬────────┘  business logic,     │  └──────┬────────┘            │
│         │            chỉ chuyển tiếp    │         │                     │
│         ▼            update binary)     │         ▼                     │
│  y-indexeddb (cache │                    │  y-indexeddb (cache │
│  offline, tự merge  │                    │  offline, tự merge  │
│  khi có mạng lại)   │                    │  khi có mạng lại)   │
└─────────────────────────────┘        └─────────────────────────────┘
                    │                                  │
                    └──────────► relay (VD Node nhỏ) ◄─┘
                         chạy trên 1 máy trong studio
                         (NAS/máy chủ nội bộ) hoặc VPS rẻ
                         — KHÔNG cần biết nghiệp vụ, chỉ
                         forward Yjs update (giữ vai trò
                         "bưu tá", không phải "sổ cái")
```

**Nguồn sự thật:**
- **Yjs `Y.Doc`** là nguồn sự thật CHO 3 vùng realtime (Kanban board state, chat thread, cursor/
  presence) — merge tự động bằng thuật toán CRDT, không cần "ai thắng ai" thủ công.
- **Prisma/SQLite** vẫn là nguồn sự thật cho MỌI thứ còn lại (auth, project metadata, file `.idf`,
  billing/credit theo `§3 T1` của `00-BAT-DAU-DOC-DAY.md`) — Yjs KHÔNG thay thế Prisma, chỉ phủ lên
  đúng 3 màn hình cần merge nhiều người sửa cùng lúc.
- **Xung đột hợp nhất ở đâu:** ngay trong `Y.Doc`, phía CLIENT (thuật toán CRDT chạy trên máy người
  dùng, không cần server "quyết định đúng-sai"). Server relay không tham gia logic hợp nhất — đúng
  triết lý local-first, và đúng tinh thần offline-first #1.
- **Ghi ngược Prisma:** sau khi `Y.Doc` ổn định (debounce vài trăm ms không có update mới), 1
  listener ghi snapshot xuống Prisma để các phần KHÔNG dùng Yjs (báo cáo, filter server-side, tab
  Bảng hiện tại `LarkBoardTab`) đọc được — Prisma đóng vai trò "bản lưu trữ đã hợp nhất", không phải
  nơi hợp nhất.

## 4. Danh sách việc code cần bàn giao cho Claude Code sau này

1. Dựng relay `y-websocket` tối giản (server Node độc lập, chạy `caffeinate`/pm2 trên máy trong
   studio hoặc VPS nhỏ) — KHÔNG chứa business logic, chỉ forward binary update + xác thực kết nối
   (token theo project, tránh phòng công khai).
2. Client: tạo `Y.Doc` theo `projectId`, gắn `y-indexeddb` (cache offline) + provider websocket.
3. Kanban 2 chiều: đổi `LarkKanbanTab` (`components/dashboard/LarkPanels.tsx:176-210`, hiện chỉ
   đọc) — **lưu ý quan trọng**: `LarkKanbanTab` đọc từ `LarkTaskRef` (mirror pull-only của Larkbase,
   `prisma/schema.prisma:317-333`) — ghi ngược 2 chiều vào ĐÓ là ghi ngược vào hệ ngoài, khác phạm
   vi phiếu này. Cần làm rõ với TỔNG: Kanban "ghi ngược" trong phiếu SyncWork nói tới bảng việc NỘI
   BỘ app này (chưa có model — xem VIỆC 3, chưa có `model Task` nào ngoài `LarkTaskRef`), không phải
   ghi ngược Larkbase.
4. Chat nhóm: `Y.Array`/`Y.Map` cho thread + tin nhắn, presence "đang gõ" qua `y-protocols/awareness`.
5. Multi-cursor: awareness protocol (vị trí con trỏ, không cần CRDT merge — dữ liệu ephemeral, mất
   khi disconnect, không cần lưu Prisma).
6. Trang cài đặt: cho phép studio tự nhập địa chỉ relay của họ (không hardcode 1 relay duy nhất) —
   đúng L-EXT1, tránh khoá vào 1 hạ tầng do IF/SyncWork vận hành.
7. Test round-trip offline: tắt mạng giữa chừng, sửa cả 2 máy, bật mạng lại, xác nhận merge không
   mất dữ liệu (giống bài test round-trip đã có cho `.idf`, xem `lib/cad/dxf.roundtrip.test.ts` làm mẫu).

## 5. Cái gì KHÔNG cần realtime

- **Metadata dự án** (tên, khách hàng, ngày tạo) — sửa hiếm, xung đột hiếm, Prisma REST bình thường đủ.
- **File `.idf` / bản vẽ CAD** — đã có cơ chế export/import + `IDF_VERSION` migration riêng
  (`lib/cad/idf.ts:25,72-97`), đổi sang CRDT toàn bộ `Doc` là công trình lớn ngoài phạm vi phiếu này
  (K1 của IF nói "một nguồn", nhưng "một nguồn" không bắt buộc phải là CRDT — có thể vẫn là file +
  khoá sửa/lock theo phiên, coi như v1 an toàn hơn).
- **Billing/credit** (`CreditTransaction` — `prisma/schema.prisma:223-233`) — theo `§3 T1/T2` của
  `00-BAT-DAU-DOC-DAY.md`, kế toán tiền BẮT BUỘC ở server, KHÔNG được đưa vào CRDT client-side dễ
  giả mạo.
- **Báo cáo/thống kê tổng hợp** (% tiến độ theo `larkProjectCode`, `computeProgressByCode` —
  `lib/lark/task-utils.ts:41-57`) — tính lại từ Prisma khi cần, không cần đẩy realtime.
- **Roster nhân sự** (`LarkPersonRef`) — pull-only từ hệ ngoài, đổi hiếm, không có xung đột nhiều
  người sửa cùng lúc.

## 6. Chưa kiểm chứng được

- Không xác nhận được app mục tiêu thật là SyncWork hay IF (xem cảnh báo đầu file) — vì phiên này
  không mount được repo SyncWork.
- Chưa đo thực tế độ trễ/băng thông relay tự host trên hạ tầng thật của studio (không có môi trường
  để bench trong phiên Cowork).
- Chưa xác nhận `model Task` nội bộ có tồn tại cho Kanban hay không — xem VIỆC 3, kết luận là
  **KHÔNG** (chỉ có `LarkTaskRef` mirror ngoài), ảnh hưởng trực tiếp tới việc #3 ở mục 4 trên.
