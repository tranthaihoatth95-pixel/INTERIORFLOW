# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main` (local vượt origin, chưa push). Verify SHA bằng git. Toàn bộ đợt 19-21/07 ĐÃ MERGE hết (danh sách đầy đủ → CHANGELOG); các mảng mới nhất: **M1 Home/Gallery↔Larkbase · Gallery ambient cover glow · gesture audit CAD · Vitas AI**.
  - ⚠️ **CHỜ USER VERIFY bằng mắt:** .pptx nhúng font (PowerPoint thật) · frame-timing chuyển chặng.
  - **M1 Larkbase**: `LarkTaskRef`/`LarkPersonRef`/`LarkUserMap` + `Project.larkProjectCode` · provider `lib/integrations/providers/lark.ts` · Gallery pill cảnh báo/nút "Chi tiết"(3 tab)/"Đồng bộ"/liên kết tuỳ chọn · Home+logo về `/`. **CHỜ USER cấp `LARK_APP_ID/SECRET/LARK_BASE_APP_TOKEN`** (`docs/INTEGRATIONS.md`). Nợ: chưa link-picker grid >8.
  - **Ambient cover glow**: nền Gallery đổi theo ảnh bìa card focus (carousel only).
  - **Gesture audit** (`docs/AUDIT-GESTURES-INPUT.md`): 1 P1 ĐÃ SỬA (phím `E` CAD xoá nhầm selection), 7 P2 chưa làm.
  - **Vitas AI** (Gallery): thanh chat trong suốt LUÔN HIỆN trên thẻ dự án, placeholder động, hội thoại = overlay `.lq-card` đè lên card (zero layout shift). Route `app/api/ai-assist-chat` (auth) dùng `completeTextTiered` (NVIDIA→Ollama); v1 không lưu DB. KHÁC "Chat nhóm".
  - **Vitas ở CHẶNG** (nhánh `feat/vitas-stage-drop`, chưa merge): giọt kính ẩn trong `StageSwitcher` — click/trượt ngang chuyển chặng Y HỆT cũ; KÉO XUỐNG ≥28px → panel chat nhỏ `.lq-card` mọc ra (overlay không backdrop, canvas dưới thao tác được). Fallback: ⌘J toggle + tooltip khi hover 0.9s (tắt sau lần đầu dùng). Logic phân biệt trục ở `lib/input/stage-drop.ts` (18 test case). Tái dùng route `ai-assist-chat` + `chat-assist.ts`, không route/model mới.
  - ⚠️ **RÒ RỈ KHÓA**: verify Vitas lỡ in `NVIDIA_API_KEY` ra transcript agent — **USER NÊN ROTATE KEY** ở build.nvidia.com rồi thay `.env.local`.
- **8 BÁO CÁO NGHIÊN CỨU trong `docs/`, CHỜ USER QUYẾT** — đọc thẳng từng file (`RESEARCH-ACCESS-CONTROL/MOBILE-DISTRIBUTION/COMFYUI-LESS/MATERIAL-BRIDGE/TECHNICAL-DRAWING-PIPELINE/TEAM-COLLABORATION/OFFICE-FILE-INTEROP/HOME-GALLERY-DASHBOARD`), đừng chép lại vào đây.
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (68 file). KHÔNG có vitest/jest.

## Quyết định user đã khoá
- **Auth**: email MỌI domain · Google OAuth mọi tài khoản · Microsoft OAuth (Entra ID) — user CHƯA tạo Azure app, nút disabled · quên mật khẩu = admin reset.
- **Logo IF: CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/`.
- Perceptron THẬT (learning-to-rank, đã verify wired vào Presenting `LayoutShelf` + mới thêm CAD `AiBriefPanel`) · 3 installer unsigned · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- ✅ FIX Presenting chữ chồng/echo · ✅ FIX M0 tỉ lệ khung tên CAD — chi tiết → CHANGELOG.
- 🐛 `/cad-editor` warning React `Cannot update a component...` (`CadCanvas`/`StudioBar`) — điều tra sâu nhưng KHÔNG tái hiện được, chưa sửa. Chi tiết → CHANGELOG.
- [THẤP] Property panel Render không undo được · Sprint 3 B1 `meta` giá/vendor/sku trống · `knowledge/` 121MB cân nhắc Git LFS · M1 Larkbase: chưa link-picker grid >8 dự án.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU:** cookie định danh theo HOST không theo PORT → dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/`DELETE /api/auth/me`/xoá cookie. Code đã tự cách ly 2 lớp (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ worktree (`.git` là file) → cookie `if_session_wt`. Cần đăng nhập thật: cấp worktree `.env` + DB riêng (`cp prisma/dev.db prisma/dev.db.wt`, sửa `DATABASE_URL`).

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
