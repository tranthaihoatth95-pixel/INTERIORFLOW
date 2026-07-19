# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. **19/07 XONG cảm ứng CAD (pinch-zoom/pan + nút Xoá nổi) & Slide Sorter (DnD→Pointer Events)** — chi tiết → CHANGELOG. Verify SHA bằng git.
- **19/07 khuya — ĐỢT MỚI user giao (2 đợt agent):**
  - **Đợt 1 ĐANG CHẠY (3 worktree):** `feat/login-contrast` (bỏ 2 dòng chữ login "Bắt đầu dòng chảy…"/"Đăng nhập để mở dự án…" · cơ chế tương phản thích ứng DÙNG CHUNG áp 4 chỗ: login/thẻ Gallery/chữ slide Present đè ảnh/nhãn ảnh Render · logo IF **chốt phương án CÓ KHUNG**, đồng bộ Header+MobileMenu+share) · `feat/toolbar-io-sync` (gom gọn toolbar CAD · sửa scrollbar thô ở Pro mode · **component Nhập/Xuất dùng chung cả 3 chặng**: cùng cách thể hiện, bấm mới xổ định dạng riêng từng chặng) · ~~`fix/login-bounce-root`~~ (XONG, đã merge — xem Nợ kỹ thuật).
  - **Đợt 2 CHƯA giao:** ① Sketch mode = cảm ứng kiểu ArcSite · Pro mode = tối ưu chuột/phím · chuyển 3 chặng mượt + phân định rõ (gộp luôn UI cảm ứng cho F8/F12/gõ lệnh/Space — CAD hiện vẫn cần bàn phím vật lý cho mấy cái này). ② Present font: tải font từ máy · edit chữ tiêu đề kiểu text-effects/typography illustration · sửa lỗi hiện chữ ở dải thumbnail deck mẫu.
- Có nút **Mở DWG** trực tiếp (Web Worker cô lập GPL).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (59 file). KHÔNG có vitest/jest — bỏ qua chỉ dẫn nào ghi `npm test`.

## Quyết định user đã khoá
- **Auth (19/07 THAY "chỉ @ttt.vn" cũ)**: đăng ký/đăng nhập email MỌI domain (register đã mở lại) · Google OAuth mọi tài khoản · **Microsoft OAuth** (Entra ID, env `MS365_*`) — **user CHƯA tạo Azure app**, nút disabled, hướng dẫn ở `docs/INTEGRATIONS.md` · admin seed giữ nguyên; quên mật khẩu = admin reset.
- **Logo IF: chốt phương án CÓ KHUNG** (`framed`). Wallpaper: 30 ảnh TTT ở `public/wallpapers/` — **user sẽ lọc bộ cuối sau**.
- Perceptron THẬT (learning-to-rank) · installer cả 3 unsigned (.exe cần Win) · PWA host Vercel + Supabase (Sprint 4).

## Nợ kỹ thuật
- Audit 19/07 (chuột/phím/cảm ứng 3 chặng) đã sửa gần hết, chi tiết → CHANGELOG.md mục "19/07 — Audit...".
- ~~**CAD→Render văng đăng nhập**~~ — **ĐÃ TÌM RA GỐC + sửa** (nhánh `fix/login-bounce-root`, chưa merge). Gốc: cookie định danh theo HOST **không theo PORT** → mọi dev server worktree trên `localhost:<port>` dùng chung lọ cookie với `localhost:3000`; worktree KHÔNG có `.env` nên thiếu AUTH_SECRET/DATABASE_URL, và DELETE /api/auth/me ở đó phát `Set-Cookie: if_session=; Expires=1970` → **xoá phiên thật của :3000**. CAD không kiểm tra phiên nên user vẫn vẽ, tới lúc bấm Render mới lộ. Sửa: server thiếu AUTH_SECRET dùng cookie riêng `if_session_noenv` + cảnh báo log · `getSession()` phân biệt anonymous/stale/error (DB lỗi → 503, KHÔNG đá về login) · cookie chết bị xoá + báo lý do · `SessionWatch` cảnh báo mất phiên ngay tại chặng studio.
- ⚠️ **Việc cần làm ngay:** hai dev server worktree đang chạy ở `localhost:4090`/`4091` vẫn là code CŨ — còn khả năng xoá phiên đăng nhập thật. Tắt hoặc merge nhánh fix trước khi dùng tiếp.
- ~~[TRUNG] Cảm ứng CAD + Slide Sorter~~ — ĐÃ LÀM XONG + merge (xem mục Hiện tại); còn phần shortcut bàn phím CAD chưa có UI cảm ứng.
- [THẤP] Property panel Render không undo được (có thể chủ ý, chưa hỏi).
- Sprint 3 B1: `meta` (giá/vendor/sku) trống — chưa có dữ liệu giá thật.
- In A3/A4 300dpi thật CHƯA khả dụng (giới hạn Render stage) — đúng phạm vi đã chốt.
- `knowledge/project-references/` ~121MB PDF trong git — Git LFS, user chọn ĐỂ SAU (rủi ro rewrite history).

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser — LUẬT MÁU (19/07 đã gây sự cố thật):** cookie định danh theo HOST, KHÔNG theo PORT → `localhost:3000` và `localhost:4xxx` (worktree) DÙNG CHUNG một lọ cookie. Worktree không có `.env` (thiếu `AUTH_SECRET`/`DATABASE_URL`) nên mọi request auth 401, và chỉ cần chạm vào đăng xuất là **XOÁ phiên thật của user** — đây chính là bug "bấm Render bị văng đăng nhập" kéo dài nhiều ngày. Vì vậy: dev server worktree PHẢI verify qua **`127.0.0.1:<port>`** (khác host = khác lọ cookie), mỗi agent song song 1 origin riêng (127.0.0.1 / [::1] / IP LAN); TUYỆT ĐỐI KHÔNG logout, KHÔNG loadDemoFlow đè flow thật. Code đã có lớp chống: server thiếu `AUTH_SECRET` tự dùng cookie riêng `if_session_noenv`.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
