# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Drafting CAD (TCVN checker) · Rendering (node canvas) · Presenting (dàn trang)** + login/gallery.
> ⚠️ Nhãn hiển thị đổi 20/07 (Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting). **ID nội bộ GIỮ NGUYÊN** `concept`/`render`/`present` — mọi khoá localStorage/route/tên file không đổi. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. Verify SHA bằng git. Đợt 19-20/07 (login/contrast · toolbar+IO · Sketch-Pro · Present typography · đổi tên chặng · PPTX font · input · motion · fix-api-auth-p0 · **login-glass**) ĐÃ MERGE hết → chi tiết CHANGELOG.
  - ⚠️ **CHỜ USER VERIFY:** .pptx nhúng font chưa mở bằng PowerPoint thật (QuickLook bỏ qua font nhúng, không dùng làm bằng chứng) · frame-timing chuyển chặng chưa đo được (browser tự động luôn `hidden`) — cần xem bằng mắt thật.
  - 🐛 **20/07 chiều — user báo "Ghi nhớ đăng nhập chưa hoạt động", ĐÃ SỬA:** checkbox dùng `sr-only` co về đúng 1×1px (kỹ thuật ẩn chuẩn nhưng quá nhỏ để chuột thật bấm trúng) — logic React/server đều đúng sẵn (verify bằng curl: `remember:false`→cookie phiên không Max-Age, `remember:true`→Max-Age 30 ngày). Sửa: input phủ `absolute inset-0` kín cả label (125×16px). Verify lại bằng chuột giả lập thật, cả 2 chiều đúng.
- **3 BÁO CÁO NGHIÊN CỨU trong `docs/`, CHỜ USER QUYẾT** (chi tiết đầy đủ trong từng file, đừng chép lại vào đây):
  - `RESEARCH-ACCESS-CONTROL.md` — chọn `ProjectMember` 5 role + GATE, ~9 ngày công, 10 câu hỏi §8 chờ user (Q2 brief NDA · Q5 role · Q8 GATE quay ngược).
  - `RESEARCH-MOBILE-DISTRIBUTION.md` — iOS: Custom App/ABM · macOS: bỏ MAS giữ `.dmg` notarize · Android: Managed Google Play Private App (đính chính quy mô không giới hạn) · PWA client đã có sẵn, thiếu HTTPS cố định.
  - `RESEARCH-COMFYUI-LESS.md` — tier "oneAI" mở chuỗi LAN→RunPod serverless→model-API, ~2.5-3 ngày công.
  - `RESEARCH-HOME-GALLERY-DASHBOARD.md` (nhánh `feat/research-home-gallery-dashboard`) — Gallery (`ProjectSelect.tsx`) + Larkbase (`LarkTaskRef` mirror, field thật đã tra); ĐÃ CHỐT: phân quyền tách biệt khỏi Larkbase (`ProjectMember`) · tạo dự án cục bộ, liên kết Larkbase tuỳ chọn, KHÔNG ghi ngược; còn hỏi mở §5.2 (lối vào Gallery cho returning-user, vị trí đặt kanban).
- **ĐỢT SAU (chưa giao, cần nghiên cứu trước):** Chat/cộng tác — CAD+Rendering = comment/ghim bất đồng bộ kiểu Miro · Presenting = real-time (đã chốt dùng CRDT/Yjs, ngược tài liệu IF1_IF2_BIGPICTURE cũ).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (63 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn")**: email MỌI domain · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, xem `docs/INTEGRATIONS.md` · quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · 3 installer unsigned (.exe cần Win) · PWA Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- 🐛 **MỚI (có TRƯỚC đợt này, 2 agent độc lập cùng thấy, 1 agent xác nhận trên mã gốc):** `/cad-editor` ném warning React `Cannot update a component while rendering a different component` (`CadCanvas`/`StudioBar`) làm error boundary dựng lại cây. Chưa truy.
- [THẤP] Property panel Render không undo được (có thể chủ ý) · Sprint 3 B1 `meta` giá/vendor/sku trống (chờ dữ liệu) · in A3/A4 300dpi chưa khả dụng (đúng phạm vi) · `knowledge/` 121MB PDF cân nhắc Git LFS (ĐỂ SAU).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST **không theo PORT** → `localhost:3000` và `localhost:4xxx` (worktree) dùng chung lọ cookie; server worktree gọi `DELETE /api/auth/me` là **xoá phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Luật: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (lưu ý `preview_start` có thể tự mở tab `localhost` trước → navigate sang `127.0.0.1` NGAY); mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout / `DELETE /api/auth/me` / xoá cookie. **Code đã có 2 lớp chống** (`lib/server/auth.ts`): thiếu `AUTH_SECRET` → cookie `if_session_noenv`; chạy từ git worktree (nhận diện `.git` là file) → cookie `if_session_wt`. Nên worktree copy `.env` từ repo chính cũng KHÔNG đụng được phiên thật nữa. Muốn agent verify trang cần đăng nhập: cấp worktree `.env` + **DB riêng** (`cp prisma/dev.db prisma/dev.db.wt` rồi sửa `DATABASE_URL`), agent tự đăng ký tài khoản test.

4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
