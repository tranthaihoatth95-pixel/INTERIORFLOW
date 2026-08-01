# 00 · SỔ CHỐT — đọc file này ở ĐẦU MỖI PHIÊN

> **Mục đích:** `docs/` có **160+ file · 8,9 MB**. Đọc hết là chết context. File này là **sổ mục lục
> 1 dòng/quyết định** — đọc nó rồi mới mở đúng file cần.
>
> **Vì sao phải có:** `STATUS.md` theo dõi **việc đang chạy**, không theo dõi **điều đã chốt**.
> Ngày 01/08 Cowork ba lần thiết kế lại thứ đã có sẵn vì không thấy chúng. Lỗi hệ thống, không
> phải lỗi trí nhớ.
>
> **Luật giữ file nhỏ:** mỗi mục **đúng 1 dòng**. Trần cứng **200 dòng**. Đầy thì cắt mục cũ đã
> thành code, đừng nới dài.

**Thứ tự đọc đầu phiên:** `CLAUDE.md` → `STATUS.md` → **file này** → chỉ mở file thật cần.

---

## ✅ ĐÃ CHỐT — coi như luật, không bàn lại

| File | Chốt điều gì |
|---|---|
| `CHOT-COWORK-2026-07-30.md` | **Sổ append-only** — quyết định chốt xong ghi vào, không sửa dòng cũ |
| `CHOT-DUYET-SPEC-2026-08-01.md` | ⭐ **Vòng duyệt 7 spec 01/08** — CAD song song-kế thừa · Present 3 phương án + khoá giữ · dàn bài linh hoạt · **video 6 bậc** · ranh giới uỷ quyền Hoà↔Cowork |
| `CHOT-DUYET-SPEC-DOT2-2026-08-01.md` | ⭐ **Đợt 2 — đóng 13/14 nhãn còn lại**: IF chính thức **4 chặng (0→3)** · duyệt hướng 4 spec tính năng · **ArchiNote CŨNG trung tính** (Hoà lật đề xuất E2.2) · chỉ còn `SPEC-SEMANTIC-MODEL` treo chờ Hoà tự đọc |
| `SPEC-VIDEO-MAT-BANG.md` | Spec bậc 1·2·4 video 0-credit — layer `IF_CAMPATH`, không EntityType mới, tầm mắt người 1650 |
| `CHOT-TACH-AI-VA-CHINH-TAY.md` | Tách AI bằng **dấu + truy vết**, không bằng vị trí · từ khoá **"Magic"** · ba trục Khổ/Bố cục/Nhận diện · cấm chữ "tự động" |
| `CHOT-BRAND-KIT-2026-08-01.md` | Brand Kit thuộc **DỰ ÁN**; `_studio/` chỉ là mẫu đọc một chiều |
| `QUYET-DINH-HA-TANG-2026-07-31.md` | Đĩa là nguồn sự thật (①B) · cây thư mục (②) · Gu→Prisma (③C) · FlowVersion đổi cò (④C) · desktop-first 1024/1440 |
| `CHOT-HUONG-SAU-DEMO-2026-07-31.md` | 2 điểm Hoà nêu sau demo → hàng đợi có thứ tự |
| `CHOT-SO-MA-2026-07-29.md` | Quy ước cấp mã · chỉ Claude Code được ghi vào cây |
| `LUAT-300DPI-2026-07-29.md` | Mọi sản phẩm chất lượng **≥ 300dpi** |
| `LUAT-CHU-VIET-7.1.23-2026-07-31.md` | Chữ Việt: dấu chồng mang nghĩa · cấm hoa toàn phần, `line-height < 1.5`, tracking âm |
| `LUAT-COWORK-TU-KIEM.md` | Luật **14a–14t** cho Cowork — nhãn nguồn · hạn dùng (cả ảnh) · kiểm ở đích · **ghi đúng điều Hoà chốt** · luật DB |
| `CONTENT-RULES.md` | Nội dung app thật · demo · dự án khách **không được trộn** |
| `AUDIT-BRAND-PII.md` | **LUẬT TRUNG TÍNH** — IF là sản phẩm bán ra. Danh sách chuỗi phải dọn |
| `SPEC-VITALS-VISUAL.md` | Glyph Vitals: cầu kính + electron, **số hạt là kênh thông tin**, 1 accent `#6a57f5` |

### Bảy spec gỡ nhãn `[CẦN HOÀ DUYỆT]` ngày 01/08

| File | Ai duyệt |
|---|---|
| `SPEC-PRESENT-FLOW` · `SPEC-CAD-MODES` | **Hoà** |
| `SPEC-PRODUCT-INFRA` · `SPEC-VITALS-ROLE` · `SPEC-UI-SHELL` · `SPEC-NAVIGATION-MODEL` | **Cowork** (Hoà uỷ quyền phần thuần kỹ thuật) |
| `SPEC-VITALS-AI` | vai trò đã duyệt · **cơ chế còn draft** |

---

## 📐 SPEC ĐÃ ỔN ĐỊNH — tra khi cần, không đọc mặc định

`SPEC-TONG-COWORK-2026-07-29` (46 KB) · `SPEC-ARCHINOTE-DETAIL-v1` · `SPEC-ARCHINOTE-IF-BOUNDARY` ·
`SPEC-RENDER-STUDIO` · `SPEC-EDITOR-TOOLKIT` · `SPEC-IF-LIBRARY` · `SPEC-MATERIAL-PIPELINE` ·
`SPEC-SEMANTIC-MODEL` · `SPEC-THU-VIEN-D-2026-07-30` · `SPEC-COLLABORATION` · `SPEC-FILE-MANAGER` ·
`SPEC-KNOWLEDGE-BASE` · `SPEC-BRIEF-INTAKE` · `SPEC-STAGE-0-IDEATION` ·
`CHUAN-THIET-KE-v7.6-NGUON` (chuẩn nội thất v7.6, 8 mục, ISO 128)

⚠️ **Mâu thuẫn Cowork tự phát hiện 01/08**: 12 trong số các file trên vẫn **đeo nhãn
`[CẦN HOÀ DUYỆT]`** trong khi bảng này gọi chúng là "đã ổn định". 🧮 Tổng còn đeo nhãn: **14 file**
(thêm `PLAN-LIBRARY-GATEWAY` · `IF-ARCHITECTURE-BLUEPRINT-v1`). ⇒ Cần **vòng duyệt đợt 2** —
hoặc gỡ nhãn vì đã lỗi thời, hoặc duyệt thật. Chưa quyết.

---

## 🔧 THỨ ĐÃ TỒN TẠI TRONG CODE — kiểm trước khi định "làm mới"

Trước khi thiết kế bất cứ gì: `ls docs/` + grep tên chủ đề + grep tên component.

| Tưởng chưa có | Thật ra đã có |
|---|---|
| Trình đổi avatar | `components/avatar/AvatarBuilder.tsx` (311) + `AvatarRenderer.tsx` (1271) + route `/settings/avatar` |
| Glyph Vitals | `components/studio/VitalsIcon.tsx` (67) — **còn bản cũ 21/07**, gradient cam→navy ngoài hệ màu |
| Chuẩn nội thất | `docs/CHUAN-THIET-KE-v7.6-NGUON.md` + `lib/vision/single-view-metrology.ts` (958 dòng) |
| Hạ tầng đóng lớp | `lib/useDismissable.ts` — 1 họ sự kiện `pointerdown` pha bắt toàn app |
| Đảo nguồn sự thật | `lib/disk-sync.ts` — `resolveSourceOfTruth()` thuần, có test |
| Bộ dàn trang Present | `LayoutShelf.tsx` (825) — `TemplatePicker.tsx` là **dead code**, đang xoá |

⚠️ **Hai con số dễ lẫn**: metrology dùng **tầm mắt máy ảnh 1500–1600** (mặc định 1550);
đường cam video dùng **tầm mắt người ~1650**. Hai việc khác nhau.

---

## 📌 CÂU HỎI ĐANG ĐỂ NGỎ

| Câu | Ai quyết |
|---|---|
| 136 MB trong `dev.db` là gì? (`FlowVersion` chỉ 5,31%) | đo sau khi push `GuModel` xong |
| Brand Kit đảo nguồn — phải đổi hình dạng `brand-kit.json` trước | thiết kế, chưa tới lượt |
| GPL-3.0 của `@mlightcad/libredwg-web` — `licenseNotes` UNRESOLVED | **Hoà**, trước khi phát hành |
| `/library/ingest` tràn full màn + placeholder có tên khách — sửa 1 lần được cả 2 | hàng đợi |
| **Viết lại lịch sử git** (`filter-repo`) để xoá dấu vết TTT ở các commit cũ | **Hoà**, chỉ làm **ngay trước khi giao repo ra ngoài** |

### ✅ Dọn trung tính 01/08 — Hoà duyệt cả ba

| Thứ | Xử lý | Về đâu |
|---|---|---|
| `knowledge/ttt-design-system/` (16 KB) — readme có tên khách thật: *Sofitel Metropole · Fairmont · Four Seasons · Movenpick · New World Saigon · OCB The Hallmark* | **dời hẳn ra ngoài repo** + gitignore | `~/Downloads/_TTT-BRAND/` |
| `docs/files.zip` — 11 instruction của agent RIN·NHA·VU·KIEN, tài sản cá nhân | **gỡ khỏi git + dời ra** | `~/Downloads/_CLAUDE-AGENTS/` |
| 21 ảnh · 8,9 MB trong `docs/` (có `42-demo-amanoi.png` — tên resort thật) | **gỡ ảnh, giữ `report.md`** | `~/Downloads/_IF-ANH-DEMO/` (giữ nguyên cây) |

⚠️ `@ttt.vn` trong `auth-policy.ts` · `auth.ts` · `LoginForm.tsx` **KHÔNG phải khoá domain** — chỉ là
comment mô tả chính sách cũ đã bỏ 19/07. `isValidAccountEmail()` nhận **mọi domain**. Chữ cần dọn,
chức năng không sai. *(Luật 14d: comment không phải code.)*

---

## ⛔ LUẬT VẬN HÀNH — học từ sự cố thật

**Sự cố `dev.db` 01/08** — `prisma db push` bị FUSE chặn giữa chừng. Không mất dữ liệu: SQLite ghi
hot journal, mở lại trên máy thật là tự lùi. `integrity_check` = ok.

1. **KHÔNG chạy `prisma db push` / `migrate` qua sandbox.** FUSE không cho SQLite khoá file đúng
   chuẩn POSIX. Soạn lệnh sẵn, Hoà chạy trên máy thật.
2. **Sao lưu SQLite bằng `sqlite3 dev.db ".backup 'ten'"`**, không dùng `cp`.
3. **Gặp sự cố DB: DỪNG, đừng tự chữa.** Đừng xoá journal — đó là cuốn sổ hoàn tác.
4. Trong `device_bash`, `~` = thư mục phiên sandbox, **không phải máy Hoà**. Luôn dùng `/mnt/`.

---

*Cowork lập 01/08/2026. Thêm quyết định mới thì thêm **1 dòng** — đừng để nó chỉ nằm trong chat,
chat bị nén là mất.*
