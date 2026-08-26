# ⑧ ADR CANDIDATE — **Q10 → Q13**, nối tiếp dãy đã có

> 🔴 **KIỂM TRƯỚC KHI VIẾT** (bài học N8, đã bị bắt hai lần trong ngày):
> `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` **đã có 9 ADR `ACCEPTED`** — Q1…Q9:
> source-of-truth của Project · Prisma vs `.idf` · `.idfc` · Master Library ·
> File Manager · Representation · Zustand · DesignDecision · Design DNA.
>
> Grep `tenant|multi-org|đa khách` trên tệp đó: **0 hit**.
> ⇒ Bốn ADR dưới đây **KHÔNG trùng, KHÔNG mâu thuẫn** với chín cái đã chốt.
> Tôi **đánh số nối tiếp Q10–Q13** thay vì mở dãy `ADR-00x` thứ hai — luật 6, tái dùng khuôn canonical.
>
> Tệp gốc còn mục *"MÂU THUẪN LỘ RA (code hiện tại vs quyết định) — CHỜ HOÀ QUYẾT"* (`:1030`).
> **Q10 nên gộp vào mục đó** khi Hoà duyệt.


---

## Q10 · Một cài đặt IF phục vụ MỘT hay NHIỀU tổ chức?

**Trạng thái:** `PROPOSED` — 🔴 **chặn toàn bộ People & Organization**

**Bối cảnh.** Mã hiện tại **cố ý** không có ranh giới giữa người dùng: `dashboard` · `chat` · `specs`
trả toàn đội, comment ghi rõ *"app nội bộ team"* (`dashboard/route.ts:7-8`). `ProjectMember` chỉ phủ
cây `Project`; sáu bảng nằm ngoài cây đó **không có phạm vi nào** (`07-RISKS` R1).
Nhưng `CLAUDE.md` định vị IF là **sản phẩm độc lập bán toàn cầu**.
**Hai định vị này đang cùng tồn tại trong một repo.**

**Lựa chọn.**

**A · MỘT tổ chức mỗi cài đặt.**
Ghi thành **ràng buộc triển khai tường minh**. Giữ thư viện dùng chung như **tính năng**.
Vẫn phải đóng R3 (`public/comments-images`) và R4 (audit trail).
→ *Được:* không migration, giữ đúng mã hiện có, ship nhanh.
→ *Mất:* không host đa khách; mỗi khách một cài đặt; **phải nói rõ điều này khi bán**.

**B · NHIỀU tổ chức, thêm `tenantId`.** ⭐ **đề xuất**
Cột phạm vi ở ≥6 bảng + wave sửa route. `visibleProjectIds()` đã chờ sẵn (`access.ts:73-80`).
→ *Được:* mở đường thương mại hoá; People & Organization làm được tử tế; ranh giới thực thi **bằng mã**.
→ *Mất:* migration lớn; phải sửa nhiều route; **chi phí lớn nhất nếu làm muộn**.

**C · Hoãn.**
→ **Không khả thi.** People & Organization là tính năng **đầu tiên bắt buộc** phải có ranh giới khách hàng.
Hoãn = xây trên đường nứt.

**Đề xuất: B**, và làm **NGAY**, kể cả khi hôm nay chỉ có một tenant.
**Lý do quyết định:** chi phí thêm `tenantId` **tăng theo thời gian và theo lượng dữ liệu**.
Thêm bây giờ là một migration; thêm sau ba khách hàng là một cuộc di trú có rủi ro mất dữ liệu.

**Hệ quả nếu chọn B:** mọi bảng People mang `tenantId` từ ngày đầu · cửa quyền mở rộng để kiểm tenant ·
feature flag theo tenant (`backlog 0.2`) · **không migration phá dữ liệu**.

**⛔ Cần authority:** đây là **quyết định sản phẩm**, không phải kỹ thuật. Tôi **không tự quyết**.
Trong lúc chờ: dùng **provisional contract** + feature flag + rollback (đúng luật cứng số 8 của đề bài).

---

## Q11 · Lark là gì trong kiến trúc IF?

**Trạng thái:** `PROPOSED` · phụ thuộc `Q10`

**Quyết định:** Lark = **`TENANT CONNECTOR CANDIDATE`**, **không** phải domain model,
**không** phải source-of-truth mặc định.

**Bằng chứng ủng hộ** (`03-LARK-CONNECTOR-EVIDENCE`): 0 test chạm connector · đường ghi ngược
chặn cứng và chưa viết (`lark-write.ts:33,58-65`) · ràng buộc vào **một base** và **tên cột tiếng Việt literal**
(`sync/route.ts:52-59`) · Lark **không cung cấp** `LegalEntity`/`Division`/`Team`/`ReportingLine`.

**Hệ quả:**
1. Nhập mặc định `READ-ONLY IMPORT → PREVIEW → HUMAN CONFIRM`. **Sửa hành vi có thật** — hiện tại
   sync **áp thẳng và ghi đè im lặng** việc người dùng (R5).
2. **Cấu hình mapping cột tách khỏi mã** — nếu không thì khách thứ hai không dùng được.
3. `isCrea` **không map** — cờ riêng của một tổ chức (`schema:451`).
4. **`3.1` nhập bằng tệp làm TRƯỚC `3.3` Lark** — chứng minh trọn luồng mà không buộc vào nhà cung cấp nào.

---

## Q12 · Thực thi ranh giới local bằng MÃ, không bằng cách đóng gói

**Trạng thái:** `PROPOSED` · **độc lập với Q10, làm được ngay**

**Bối cảnh.** `AUTH_SECRET` có fallback hardcode (`auth.ts:46` · `middleware.ts:34`).
Electron được cứu vì tự sinh secret; web thì không, và `vercel.json` có trong repo.

**Quyết định:** thiếu `AUTH_SECRET` ⇒ **từ chối khởi động**, không chạy tiếp lặng lẽ.

**Khuôn đã có sẵn trong chính repo:** `lib/integrations/crypto.ts:16` ném lỗi khi thiếu key.
⇒ Đây là **áp lại một khuôn đã tồn tại**, không phải phát minh.

**Chi phí:** một dòng. **Rủi ro nếu không làm:** giả mạo phiên bất kỳ user nào, kể cả `isAdmin`.

---

## Q13 · Đường đi tiếp của local-first

**Trạng thái:** `PROPOSED` · phụ thuộc `Q10`

**Quyết định:** **Đường B — local-first + opt-in sync** (`06-SYNC-OPTIONS`),
triển khai theo **bậc thang**, bắt đầu ở **bậc 1: xuất/nhập tệp có ký**.

**Lý do:** bậc 1 **không cần dịch vụ nào**, có ngay provenance + preview, và **trả lời được câu
*"đổi máy có mất không"*** — câu hỏi thực tế nhất của một studio.

**Không chọn C (managed cloud):** nó **phá lời hứa** *"dữ liệu nằm trên máy anh"* — câu đang in
ngay dưới thẻ đăng nhập. Chọn C là **đổi sản phẩm**, không phải thêm tính năng.

---

## PHỤ THUỘC

```
Q10 (tenancy) ──┬─► Q11 (Lark)  ──► backlog 3.x
                    ├─► Q13 (sync)
                    └─► toàn bộ People & Organization

Q12 (secret) ── độc lập, làm được NGAY
```

## TÓM TẮT CHO NGƯỜI QUYẾT

| ADR | câu hỏi | ai quyết | chặn gì |
|---|---|---|---|
| **Q10** | một hay nhiều tổ chức mỗi cài đặt? | **Hoà** | **tất cả** |
| Q11 | Lark là connector hay source-of-truth? | Hoà + khách | backlog 3.x |
| Q12 | bỏ fallback secret? | kỹ thuật — **nên làm ngay** | không chặn ai |
| Q13 | đường sync nào? | Hoà | bậc 4+ |
