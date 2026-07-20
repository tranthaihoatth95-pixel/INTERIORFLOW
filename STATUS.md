# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main` (local vượt origin, chưa push). Verify SHA bằng git. Đợt 19-21/07 (chi tiết đầy đủ → CHANGELOG) ĐÃ MERGE hết: login/contrast, toolbar+IO, Sketch-Pro, Present typography, đổi tên chặng, PPTX font, input, motion, fix-api-auth-p0, login-glass+fix login, báo cáo nghiên cứu, CAD demo mặt bằng 2, CAD "AI mô tả" v2, M0 tỉ lệ khung tên, fix text chồng chữ Presenting.
  - ⚠️ **CHỜ USER VERIFY bằng mắt:** .pptx nhúng font (PowerPoint thật) · frame-timing chuyển chặng.
- **8 BÁO CÁO NGHIÊN CỨU trong `docs/`, CHỜ USER QUYẾT** (đọc thẳng từng file, đừng chép lại vào đây):
  - `RESEARCH-ACCESS-CONTROL.md` — phân quyền `ProjectMember` 5 role, 10 câu hỏi §8.
  - `RESEARCH-MOBILE-DISTRIBUTION.md` — bộ cài iOS/macOS/Android.
  - `RESEARCH-COMFYUI-LESS.md` — chạy không cần ComfyUI local.
  - `RESEARCH-MATERIAL-BRIDGE.md` — cầu nối Larkbase↔hatch↔Rendering; 🔴 **Larkbase đang sai workspace** (không có bảng vật liệu, Q1 §10).
  - `RESEARCH-TECHNICAL-DRAWING-PIPELINE.md` — khung tên/tỉ lệ/PDF in kỹ thuật CAD→Presenting (M0 tỉ lệ ĐÃ SỬA, còn M1+ chờ quyết).
  - `RESEARCH-TEAM-COLLABORATION.md` — chat/cộng tác: Phần A (comment CAD+Rendering) rẻ, làm ngay được. Phần B (Presenting real-time) 🔴 Presenting KHÔNG có server source-of-truth cho deck — phải dựng trước khi bàn CRDT/Yjs.
  - `RESEARCH-OFFICE-FILE-INTEROP.md` — mở PPTX/Word/Keynote chỉnh tiếp + bảng tính Excel thật (A/PPTX khả thi · B/Keynote KHÔNG khả thi trực tiếp · C/Word rẻ nhất · D/bảng tính MỚI hoàn toàn). 6 câu hỏi §6.
  - `RESEARCH-HOME-GALLERY-DASHBOARD.md` — Gallery (`ProjectSelect.tsx`, ĐÃ có sẵn, `StageSelect.tsx` là code chết) + Larkbase (`LarkTaskRef` mirror, field thật đã tra, phát hiện `Mã DA="Khác"` cần lọc). ĐÃ CHỐT: phân quyền tách biệt Larkbase (`ProjectMember`) · tạo dự án cục bộ, liên kết Larkbase tuỳ chọn, KHÔNG ghi ngược. Còn hỏi mở §5.2 (lối vào Gallery cho returning-user, vị trí kanban).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (66 file). KHÔNG có vitest/jest.

## Quyết định user đã khoá
- **Auth**: email MỌI domain · Google OAuth mọi tài khoản · Microsoft OAuth (Entra ID) — user CHƯA tạo Azure app, nút disabled · quên mật khẩu = admin reset.
- **Logo IF: CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/`.
- Perceptron THẬT (learning-to-rank, đã verify wired vào Presenting `LayoutShelf` + mới thêm CAD `AiBriefPanel`) · 3 installer unsigned · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ✅ **FIX Presenting — chữ tiêu đề chồng/echo:** root cause = sửa chữ TRÊN CANVAS (double-click) mở `<textarea>` nổi đè đúng khung `frame`, nhưng `EditorCanvas.tsx` vẫn vẽ `<Element>` tĩnh (chữ CŨ, chưa commit) bên dưới → 2 lớp gần trùng vị trí, lệch vài pixel do khác box-model = "echo". Sửa qua Inspector không qua overlay này nên luôn sạch (đúng manh mối user chỉ ra). Sửa: `EditorCanvas.tsx` ~dòng 313, bỏ vẽ `<Element>` khi `editing?.id === el.id`. Verify: tsc sạch · test pass · browser thật — double-click, gõ chữ, không còn ghost, blur commit đúng.
- 🐛 `/cad-editor` warning React `Cannot update a component...` (`CadCanvas`/`StudioBar`) — điều tra sâu nhưng KHÔNG tái hiện được, chưa sửa. Chi tiết → CHANGELOG.
- ✅ **FIX M0 tỉ lệ khung tên CAD:** khoá lỗi tỉ lệ gõ tay không khớp `fitBox()` thật (`RESEARCH-TECHNICAL-DRAWING-PIPELINE.md` §1.6). Verify PDF thật (đọc byte: "1:47" đúng, "1:100" gõ tay cũ hết còn).
- [THẤP] Property panel Render không undo được · Sprint 3 B1 `meta` giá/vendor/sku trống · `knowledge/` 121MB cân nhắc Git LFS.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU:** cookie định danh theo HOST không theo PORT → dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/`DELETE /api/auth/me`/xoá cookie. Code đã tự cách ly 2 lớp (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ worktree (`.git` là file) → cookie `if_session_wt`. Cần đăng nhập thật: cấp worktree `.env` + DB riêng (`cp prisma/dev.db prisma/dev.db.wt`, sửa `DATABASE_URL`).

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
