# 00 · SỔ CHỐT — đọc file này ở ĐẦU MỖI PHIÊN

> **Mục đích:** `docs/` có **159 file · 8,9 MB**, riêng nhóm quyết định đã **33 file ~400 KB**.
> Đọc hết là chết context. File này là **sổ mục lục 1 dòng/quyết định** — đọc nó rồi mới mở đúng
> file cần.
>
> **Vì sao phải có:** `STATUS.md` theo dõi **việc đang chạy**, không theo dõi **điều đã chốt**.
> Ngày 01/08 Cowork đã ba lần thiết kế lại thứ đã có sẵn (avatar Vitals, chốt tách AI, trình đổi
> avatar) vì không thấy chúng. Đây là lỗi hệ thống, không phải lỗi trí nhớ.
>
> **Luật giữ file này nhỏ:** mỗi mục **đúng 1 dòng**. Đầy thì cắt bớt mục cũ đã thành code, đừng
> nới dài. Trần cứng: **200 dòng**.

**Thứ tự đọc đầu phiên:** `CLAUDE.md` → `STATUS.md` → **file này** → chỉ mở file nào thật cần.

---

## ✅ ĐÃ CHỐT — coi như luật, không bàn lại

| File | Chốt điều gì |
|---|---|
| `CHOT-COWORK-2026-07-30.md` | **Sổ append-only** — mọi quyết định chốt xong ghi vào đây, không sửa dòng cũ |
| `CHOT-TACH-AI-VA-CHINH-TAY.md` | Tách AI khỏi chỉnh tay bằng **dấu + truy vết**, không bằng vị trí · từ khoá **"Magic"** · ba trục Khổ/Bố cục/Nhận diện · cấm chữ "tự động" |
| `CHOT-BRAND-KIT-2026-08-01.md` | Brand Kit thuộc **DỰ ÁN**; `_studio/` chỉ là mẫu đọc một chiều |
| `QUYET-DINH-HA-TANG-2026-07-31.md` | Đĩa là nguồn sự thật (①B) · cây thư mục (②) · Gu→Prisma (③C) · FlowVersion đổi cò (④C) · desktop-first 1024/1440 (⑤a) |
| `CHOT-HUONG-SAU-DEMO-2026-07-31.md` | 2 điểm Hoà nêu sau demo → hàng đợi có thứ tự |
| `CHOT-SO-MA-2026-07-29.md` | Quy ước cấp mã · chỉ Claude Code được ghi vào cây |
| `LUAT-300DPI-2026-07-29.md` | Mọi sản phẩm chất lượng **≥ 300dpi** — luật sản phẩm |
| `LUAT-CHU-VIET-7.1.23-2026-07-31.md` | Chữ Việt: dấu chồng mang nghĩa · cấm hoa toàn phần, `line-height < 1.5`, tracking âm |
| `LUAT-COWORK-TU-KIEM.md` | 12 lỗi → 5 nguyên nhân → luật 14a–14p cho Cowork |
| `CONTENT-RULES.md` | Nội dung app thật · demo · dự án khách **không được trộn** |
| `AUDIT-BRAND-PII.md` | **LUẬT TRUNG TÍNH** — IF là sản phẩm bán ra, không phải công cụ nội bộ. Danh sách chuỗi phải dọn |
| `SPEC-VITALS-VISUAL.md` | Glyph Vitals: cầu kính + electron, **số hạt là kênh thông tin**, 1 accent `#6a57f5` |

---

## ⏳ CHỜ HOÀ DUYỆT — **KHÔNG được dùng làm căn cứ code**

| File | Nội dung |
|---|---|
| `SPEC-VITALS-AI.md` | ghi rõ *"DRAFT v0.1 — chưa duyệt, KHÔNG dùng làm căn cứ code"* |
| `SPEC-VITALS-ROLE.md` | vai trò Vitals — `[CẦN HOÀ DUYỆT]` |
| `SPEC-CAD-MODES.md` | Sketch vs Pro hiện chỉ khác số icon — `[CẦN HOÀ DUYỆT]` |
| `SPEC-NAVIGATION-MODEL.md` | giải bệnh "lớp ngoài lớp trong loạn" — `[CẦN HOÀ DUYỆT]` |
| `SPEC-PRESENT-FLOW.md` | "thông minh chưa tới mà human-in-loop cũng chưa xong" — `[CẦN HOÀ DUYỆT]` |
| `SPEC-PRODUCT-INFRA.md` | ranh giới "app bán được" vs "prototype chạy được" — `[CẦN HOÀ DUYỆT]` |
| `SPEC-UI-SHELL.md` | một khung cho cả 3 chặng — `[CẦN HOÀ DUYỆT]` |

⚠️ **Bảy spec đang treo, không ai theo dõi.** Trước khi code theo bất kỳ file nào ở bảng này —
hỏi Hoà duyệt trước.

---

## 📐 SPEC ĐÃ ỔN ĐỊNH — tra khi cần, không đọc mặc định

`SPEC-TONG-COWORK-2026-07-29` (46 KB, bản tổng) · `SPEC-ARCHINOTE-DETAIL-v1` · `SPEC-ARCHINOTE-IF-BOUNDARY` ·
`SPEC-RENDER-STUDIO` · `SPEC-EDITOR-TOOLKIT` · `SPEC-IF-LIBRARY` · `SPEC-MATERIAL-PIPELINE` ·
`SPEC-SEMANTIC-MODEL` · `SPEC-THU-VIEN-D-2026-07-30` · `SPEC-COLLABORATION` · `SPEC-FILE-MANAGER` ·
`SPEC-KNOWLEDGE-BASE` · `SPEC-BRIEF-INTAKE` · `SPEC-STAGE-0-IDEATION`

---

## 🔧 THỨ ĐÃ TỒN TẠI TRONG CODE — kiểm trước khi định "làm mới"

Ba lần trong ngày 01/08 suýt dựng lại thứ đã có. Trước khi thiết kế bất cứ gì:
`ls docs/` + `grep` tên chủ đề + `grep` tên component.

| Tưởng chưa có | Thật ra đã có |
|---|---|
| Trình đổi avatar | `components/avatar/AvatarBuilder.tsx` (311) + `AvatarRenderer.tsx` (1271) + route `/settings/avatar` |
| Glyph Vitals | `components/studio/VitalsIcon.tsx` (67) — **còn bản cũ 21/07**, gradient cam→navy ngoài hệ màu |
| Chọn bố cục Present | `TemplatePicker.tsx` (267) **+** `LayoutShelf.tsx` (825) — hai file cùng việc |
| Chuẩn nội thất | `knowledge/designStandards.ts` v7.6 — nhân trắc học VN, khoảng hở, nét vẽ, đo một ảnh |
| Hạ tầng đóng lớp | `lib/useDismissable.ts` — 1 họ sự kiện `pointerdown` pha bắt cho toàn app |
| Đảo nguồn sự thật | `lib/disk-sync.ts` — `resolveSourceOfTruth()` thuần, có test |

---

## 📌 CÂU HỎI ĐANG ĐỂ NGỎ

| Câu | Ai quyết |
|---|---|
| 136 MB trong `dev.db` là gì? (`FlowVersion` chỉ 5,31%) | đo trước, code phụ |
| Brand Kit đảo nguồn — đổi hình dạng `brand-kit.json` trước | thiết kế, chưa tới lượt |
| Bảy spec `[CẦN HOÀ DUYỆT]` ở trên | **Hoà** |
| GPL-3.0 của `@mlightcad/libredwg-web` — `licenseNotes` đang UNRESOLVED | **Hoà**, trước khi phát hành |

---

*Cowork lập 01/08/2026. Ai thêm quyết định mới thì thêm **1 dòng** vào đây, đừng để nó chỉ nằm
trong chat — chat bị nén là mất.*
