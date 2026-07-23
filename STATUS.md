# STATUS — InteriorFlow

> ⚠️ SHA/trạng thái verify bằng git, không chép brief/memory. Git là sự thật duy nhất.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals AI/NotebookLM.
> ⚠️ Nhãn UI 20/07: Layout CAD→Drafting CAD · Render→Rendering · Present→Presenting. **ID nội bộ GIỮ** `concept`/`render`/`present`. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (23/07 tối, chuẩn bị chuyển phiên)
- Nhánh tích hợp `feat/present-layout-ml-p1` = `origin/main`. Local `637aa4b` vượt origin `db08b4f` **3 commit** (INSTALLER-R + LIB-R + STATUS trước) — auto mode block push, user cần chạy tay: `cd ~/Downloads/interiorflow && git push origin feat/present-layout-ml-p1:main`.
- Toàn bộ đợt 19-23/07 ĐÃ MERGE (chi tiết → CHANGELOG). Mới nhất 23/07 chiều tối: **IF2-A nền + A1 fix Notebook P1 + INSTALLER-R docs + CHAT-R docs + LIB-R docs + V verify** (6 agent song song, xem 4 báo cáo `RESEARCH-*` mới: CHAT-FULL, INSTALLER-4-PLATFORMS, LIBRARY-UPGRADE + folder `installers/` scaffold).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (**75 file** cuối phiên). tsc sạch.

## Worktree đang mở
- (Không có — 5 slot sẵn sàng.)

## Chốt user 23/07
- **Chat mở rộng: FULL** (project + direct + group Zalo + Supabase Realtime). 🔴 chặn Q1 = build ACCESS-CONTROL M1 (`ProjectMember`+5 role+GATE) TRƯỚC khi Chat M1.
- **IF2 song song IF1** — nền IF2-A đã merge. IF2-B/C/D (three.js viewer 3D + BIM/IFC + DWG export) chờ Sprint sau.
- **4 bộ cài Win/Mac/Android/iOS** — Sprint 1 (Windows unsigned + PWA iOS/Android + LAN QR, KHÔNG cần credential) có thể phóng ngay. Sprint 2 chờ user cấp Apple Dev $99 + Google Play $25.
- **NVIDIA_API_KEY rotate xong** — key mới `Rebw...zv-e` verify OK.

## Việc chờ USER DUYỆT (đã đề xuất, chưa phóng agent)
1. **A** — Sprint 1 installer (Win unsigned + PWA polish + LAN QR).
2. **B** — Agent AC-M1 build ACCESS-CONTROL M1 (nếu Q1=A + Q3 không VN + Q7 giữ mãi).
3. **C** — Agent LIB-M1 build Library upgrade M1 (schema 4 cột JSON + auto-classify upload MỚI, không migrate 1515 ảnh cũ).
4. **D** — Vitals ⌘J bổ sung + Skip button avatar bỏ khỏi spec (nhỏ, gộp 1 agent).
5. Intro Phase 2 Figma (chờ authorize `plugin:brand-voice:figma` MCP).
6. Archinote handoff · ML Gu Engine · MS Teams — chờ user chọn scope.
7. Cấp `LARK_APP_ID/SECRET/BASE_APP_TOKEN` (Larkbase sync đã build sẵn).

## Nợ kỹ thuật
- ✅ FIX 21/07 tối: chuyển chặng (stageDone init đồng bộ) · lag veil 316ms→155ms · deselect · Vitals redesign giọt kính v2 + logo Siri · Presenting mount khựng · Enter Vitals không hijack · Gallery gesture · drag→panel pre-mount. Chi tiết → CHANGELOG.
- ✅ FIX 23/07: NotebookLM 404 slug↔cuid (approach C) + defensive filter bucket ẩn.
- ✅ FIX 20/07: Presenting chữ chồng/echo · M0 tỉ lệ khung tên CAD.
- 🐛 `/cad-editor` warning React `Cannot update a component...` — điều tra sâu KHÔNG tái hiện, treo.
- 🐛 ⌘J Vitals grep 0 kết quả trong code (verify agent V) — chưa implement dù STATUS cũ ghi có.
- 🟡 Morph login chỉ fade (chưa LayoutGroup cross-page) · Signup chưa auto-open avatar picker · Avatar PATCH type cast.
- 🟡 Cursor polling 25 cặp/30s idle (verify V phát hiện) — nên throttle khi mouse không move.
- 🟡 Skip button `/settings/avatar` thiếu (STATUS spec ghi Save/Skip nhưng UI chỉ Save).
- [THẤP] Property Render không undo · meta giá/vendor/sku trống · `knowledge/` 121MB Git LFS · M1 Larkbase chưa link-picker grid >8 dự án.

## Quyết định user đã khoá
- Auth: email MỌI domain · Google · MS (chờ Azure app) · quên mk = admin reset.
- Logo IF `framed`. 30 wallpaper `public/wallpapers/` (user chưa lọc bộ cuối).
- Perceptron THẬT (learning-to-rank) wired Presenting LayoutShelf + CAD AiBriefPanel.

## Bị chặn — KHÔNG tự khởi động
- (Trống.)

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS trước khi báo cáo.
2. Không tự merge/push lên main. Bug ngoài phạm vi → ghi Nợ.
3. **An toàn verify browser — LUẬT MÁU:** dev server worktree PHẢI verify qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/DELETE cookie. Cần đăng nhập thật: worktree copy `.env` + DB riêng `dev.db.wt`. Code tự cách ly cookie: thiếu AUTH_SECRET→`if_session_noenv`; worktree(`.git` là file)→`if_session_wt`.
4. Worktree & context: CLAUDE.md (max **5** worktree; cơ chế an toàn tự dọn cuối phiên; STATUS <800 từ).
5. **Vai trò:** phóng agent code, KHÔNG tự làm (memory `role-agentic-not-hands-on`). Việc "cần thiết": gitops/verify/memory/đề xuất; việc mới/mập mờ → đề xuất trước, chờ OK.
