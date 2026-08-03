# NC-6 · QUYỀN LARK WIKI/BASE — gỡ kẹt 131006 cho ATLAS sync
**COWORK-NC · 02/08/2026 đêm (sổ hệ: đợt bơm "04/08").** Nuôi: PHU mục 2 (ATLAS sync 1449 bản ghi đang DỪNG vì 131006) — "việc Lark Console của Hoà".
**Đối chiếu code (đã grep):** `lib/integrations/providers/lark.ts` — chuỗi gọi: ① `POST /open-apis/auth/v3/tenant_access_token/internal` (token CẤP APP) → ② `GET /open-apis/wiki/v2/spaces/get_node` (đổi `node_token` deep-link → `app_token`, vì ATLAS Material Library nằm TRONG WIKI) → ③ Bitable `list_records`/`list_fields`. Comment code đã cảnh báo: *node_token ≠ app_token, lưu cả hai*. Base "Quản lý Công việc" là base THƯỜNG (ngoài wiki) — đường quyền khác, xem §3-C.

---

## 1 · Bản đồ 3 LỚP quyền của Lark — kẹt vì tưởng chỉ có 1 lớp

| Lớp | Là gì | Cấp ở đâu | Nếu thiếu → lỗi |
|---|---|---|---|
| **① Scope (API permission)** | "App ĐƯỢC PHÉP GỌI loại API này" — vd đọc wiki, đọc Base | Developer Console → app → **Permissions & Scopes** | `99991672` No permission (thiếu scope) |
| **② Version đã publish** | Scope CHỈ CÓ HIỆU LỰC khi nằm trong version đã **Create version → Publish** (+ admin duyệt nếu tenant yêu cầu). Thêm scope mà không phát hành version mới = scope chưa ăn | Developer Console → **Version Management & Release** | vẫn `99991672` dù đã tick scope |
| **③ Quyền TÀI NGUYÊN (resource membership)** | "App được đụng ĐÚNG tài nguyên này" — app phải là **member của wiki space** (hoặc collaborator của Base) y như một con người được share. Scope không thay được lớp này | Trong Lark client, tại chính wiki space / Base | **`131006` node permission denied** — đúng lỗi đang kẹt |

Chốt nghĩa mã lỗi (nguồn cộng đồng nhất quán qua nhiều error-mapping của các Feishu MCP server — mức tin trung-cao, docs chính hãng không public bảng này bằng tiếng Anh):
- **`131006` = wiki NODE permission denied** — app gọi `get_node` nhưng không có quyền đọc node/space đó → kẹt ở bước ② của chuỗi IF, TRƯỚC cả khi đụng Bitable.
- **`99991672` = No permission** — thiếu scope (lớp ①/②).

Vì IF dùng `tenant_access_token` (danh tính APP/bot, không gắn user) → **mọi quyền phải cấp cho APP, không phải cho tài khoản Hoà**. Hoà mở base ngon lành trong browser KHÔNG có nghĩa app mở được — đây là hiểu lầm phổ biến nhất của lỗi này. (User_access_token là đường OAuth theo user — không dùng cho sync server pull-only, đừng đổi hướng.)

Nguồn: [llms.txt chính hãng open.larksuite.com — mục 数据权限: "cấu hình data permission + nộp duyệt, DUYỆT XONG quyền mới hiệu lực, không thì API trả lỗi quyền"](https://open.larksuite.com/llms.txt) · [Lark CLI FAQ: scope phải nằm trong version đã publish](https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/use_cases) · [error mapping 131006 — ví dụ](https://glama.ai/mcp/servers/@cso1z/Feishu-MCP/blob/36bd9890d971c901d5d4fcf2088b8b054f931e17/src/utils/error.ts) · [Add Wiki space members API](https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-member/create) · [wiki get_node](https://open.larksuite.com/document/ukTMukTMukTM/uUDN04SN0QjL1QDN/wiki-v2/space/get)

---

## 2 · CHECKLIST CHO HOÀ — làm 1 lượt, theo đúng thứ tự

### A · Developer Console ([open.larksuite.com](https://open.larksuite.com) → Developer Console → chọn app của IF)
- [ ] **A1.** Menu trái **Permissions & Scopes** → ô tìm kiếm gõ `wiki` → tick quyền ĐỌC wiki (tên hiển thị dạng *"View wiki information"* / mã dạng `wiki:wiki:readonly`). Đây là quyền cho bước `get_node`.
- [ ] **A2.** Cùng màn, tìm `base` (hoặc `bitable`) → tick quyền ĐỌC Base (*"View Base"* / `bitable:app:readonly` — nếu console tách quyền record thì tick cả quyền xem record). KHÔNG cần quyền ghi — sync là pull-only.
- [ ] **A3.** Nếu console hiện thêm bước **Data permission / cấu hình phạm vi dữ liệu** cho các quyền vừa tick → cấu hình + Submit (luật chính hãng: duyệt xong mới hiệu lực).
- [ ] **A4.** Menu trái **Version Management & Release** → **Create version** → điền số version mới + mô tả "thêm quyền wiki+base đọc ATLAS" → Save → **Submit for release/Publish**.
- [ ] **A5.** Nếu tenant bắt duyệt: mở **Lark Admin Console** (admin.larksuite.com) → Workplace/App review → **Approve** app version vừa nộp. (Hoà là admin tenant TTT thì tự duyệt được.)
- [ ] **A6.** Quay lại Version Management — xác nhận version ONLINE là version MỚI và trong đó có 2 quyền A1+A2. *(Scope nằm ở version cũ = chưa ăn.)*

### B · Lark client — cấp quyền TÀI NGUYÊN cho app (lớp ③, chữa đúng 131006)
- [ ] **B1.** Mở **wiki space chứa ATLAS Material Library** → biểu tượng ⚙ **Space settings** → **Members** → **Add member** → gõ ĐÚNG TÊN APP (bot) → thêm với quyền **Can view/Member** là đủ.
- [ ] **B2.** *Nếu ô tìm không ra app/bot* (một số bản Lark không cho add app thẳng): đường vòng chuẩn cộng đồng — tạo 1 **group chat** → menu ⋯ → **Settings → Bots → Add bot** → thêm bot của app → rồi ở wiki space **Members → Add** chọn NHÓM đó. Bot vào space qua group.
- [ ] **B3.** Kiểm node ATLAS không bị đặt quyền riêng chặt hơn space (mở node → Share/permission xem có dòng hạn chế không).

### C · Base THƯỜNG "Quản lý Công việc" (ngoài wiki — đường khác)
- [ ] **C1.** Mở Base đó trong Lark → nút **Share** (hoặc ⋯ → Share/Collaborators) → **Add** app/bot làm collaborator quyền xem. Base ngoài wiki KHÔNG hưởng quyền wiki space — phải share trực tiếp.

### D · Verify (PHU chạy, Hoà không cần đụng terminal)
- [ ] **D1.** Kiểm `.env.local`: `LARK_ATLAS_NODE_TOKEN` = token từ deep-link wiki, `LARK_ATLAS_APP_TOKEN` = app_token thật (nếu đã biết) — **đừng nhét nhầm ô nhau**; token `Ejk6wjIXoi` chữ **i HOA** (bài học cũ trong hàng đợi PHU).
- [ ] **D2.** Chạy lại sync. Đọc kết quả theo bảng: hết 131006 → ĐÃ THÔNG lớp wiki; nếu đổi sang lỗi permission ở `list_records` → thiếu A2 hoặc B (Base con trong wiki thường ăn theo space, nhưng nếu vẫn chặn thì share thẳng Base ATLAS cho app như C1); nếu ra `99991672` → scope chưa ăn, xem lại A4–A6.

---

## 3 · Điều IF nên làm (ngoài checklist)

1. **Ghi 3 lớp quyền vào comment đầu `lib/integrations/providers/lark.ts`** (1 đoạn ngắn) — phiên code sau khỏi đoán lại; lỗi mã → nghĩa: `131006` = lớp ③ resource, `99991672` = lớp ①/② scope/version. (Việc của PHU, 5 phút.)
2. **Sync route nên dịch 2 mã lỗi này ra thông điệp tiếng Việt hành-động-được** ("App chưa được thêm vào wiki space — xem NC-lark-permission §2-B") thay vì ném số trần — đúng khuôn LỖI của `SPEC-NGON-NGU-CHI-DAN`.
3. **Đừng đổi sang user_access_token** để "đi tắt" — sync server pull-only đúng kiến trúc hiện tại; user token kéo theo OAuth flow + refresh + gắn đời user, đắt hơn hẳn 1 lần bấm B1.

**Giới hạn nghiên cứu:** docs Lark là SPA nên không fetch được nguyên văn trang scope/version bằng máy — tên hiển thị chính xác của từng quyền trong Console có thể lệch chút so với mã scope ghi ở đây (đã ghi cả 2 dạng; Hoà cứ tìm theo từ khoá `wiki`/`base`); mapping mã 131006 lấy từ nguồn cộng đồng nhất quán, chưa có trang chính hãng tiếng Anh đối chứng; đường vòng B2 (bot qua group) là kinh nghiệm cộng đồng phổ biến, có thể đã thừa nếu bản Lark hiện tại cho add app thẳng — B1 trước, B2 chỉ khi B1 bí. Nếu làm hết checklist vẫn 131006: chụp màn hình Permissions + version Online + Members của space, đó là 3 ảnh đủ để chẩn tiếp.
