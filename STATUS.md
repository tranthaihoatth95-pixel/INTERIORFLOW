# STATUS — InteriorFlow

> ⚠️ Mọi SHA/trạng thái phải verify bằng git, không chép từ brief/memory. **Git là sự thật duy nhất.**
> ⚠️ Sản phẩm thật = 3 chặng **Layout CAD (TCVN checker) · Render (node canvas) · Present (dàn trang)** + login/gallery. Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi đầu phiên).

## Hiện tại
- Nhánh tích hợp **`feat/present-layout-ml-p1`** — local, **CHƯA push, CHƯA merge main** (main/origin vẫn `3265db1`).
- **✅ 15/07 merge `feat/devops-docs`** (verify: tsc 0 + đọc lướt docs OK): bộ cài + docs Sprint 4 — `.dmg` đã copy về repo chính `dist/InteriorFlow-0.1.0-arm64.dmg` (321MB, unsigned) · `.exe` config sẵn + `docs/BUILD-WINDOWS.md` (build trên máy Win) · PWA `vercel.json` + `docs/DEPLOY-VERCEL.md` (CHƯA deploy — cần tài khoản user; **db push, KHÔNG reset**) · `docs/HUONG-DAN-SU-DUNG.md` · `FINAL_ARCHITECTURE_REPORT.md` + `TECHNICAL_GLOSSARY.md`. Worktree devops-docs đã xoá.
- **✅ Cổng Sprint 2 PASS (14/07)**: 492 test/20 file · tsc 0 · verify browser 7 PASS + 1 SKIP (chi tiết CHANGELOG).
- Test pattern: `node_modules/.bin/sucrase-node <path>.test.ts` (20 file).

## Quyết định user đã khoá
- **Auth**: chỉ Google OAuth @ttt.vn (mới) + admin cấp tay (`scripts/seed-admin.ts`); user cũ ngoài-domain grandfather; register công khai 403; quên mật khẩu = admin reset.
- Perceptron THẬT (learning-to-rank, degrade heuristic) · foldable Find N6 test on-device · installer cả 3 unsigned (.exe cần máy Win) · PWA host Vercel + Supabase (Agent 4 tự dựng, Sprint 4).

## ĐIỂM RESUME (phiên mới đọc mục này TRƯỚC)
- **2 worktree đang sống** (2/3 slot): `interiorflow-wt-qa-stress` (feat/sprint3-qa-stress) · `interiorflow-wt-render-ux` (feat/render-ux-overhaul).
- **✅ 15/07 merge `feat/render-nodes-v2`** (verify độc lập: tsc 0 · 25/25 test file · smoke browser 127.0.0.1:3700 render canvas load, node text2image + badge 2 tầng OK, không lỗi render-v2): **7 node chặng Render** (`lib/nodes/defs/render-v2.ts`): text2image · ID-mask · furniture-extract · cad2fbx(import-FBX) · local-edit · camera · (nền cad-to-obj) — **kiến trúc 2 tầng: Cloud AI khi có key / LÕI tất định khi không, mọi node ghi `_tier` + badge UI** · adapter NVIDIA `generateImage()` (model chốt `black-forest-labs/flux.1-dev` — SD3/SDXL trả 404 cho account free) + route `/api/render/nvidia-image` · probe fal (`scripts/probe-fal.ts` — **fal VẪN HẾT BALANCE**) · Blender OBJ→FBX (`scripts/blender/obj2fbx.py` + route `/api/render/fbx`, verify Blender 4.5 local OK; máy không có Blender → 501 kèm hướng dẫn). **110 test mới.** Nhánh render đã xoá.
- File rác `Bản sao Không có tiêu đề.rtfd/` ở repo chính — CHỜ user duyệt xoá.
- **✅ 15/07 merge `feat/ai-local-ollama`** (ff, tsc 0 · 27/27 test · 36 test mới): tầng AI local Ollama chữ Cloud→Ollama→lõi. Worktree ollama đã xoá.
- **✅ 15/07 merge `feat/render-ux-overhaul`** (edge colors, grouping, icons, mono font).
- **✅ 15/07 merge `feat/sprint3-qa-stress`** (170 test mới, P1 auth fix).
- **✅ 15/07 merge `feat/deploy-vercel-supabase`** (DEPLOY-CHECKLIST.md 214 dòng, build pass).
- **NVIDIA_API_KEY đã có (15/07)**: user dán, đã lưu `.env.local` repo chính, probe HTTP 200 → tầng AI text2image chạy thật.
- **fal**: khoá vì hết balance ("Exhausted balance") — nạp credit ở fal.ai/dashboard/billing rồi chạy `scripts/probe-fal.ts` kiểm lại.
- CHƯA làm (backlog cũ): bỏ hardcode 'DETECH · CONCEPT' · template tĩnh thư viện · heavy-ML pha 2 (báo rủi ro trước) · membership per-flow (cần schema, chờ duyệt).

## Nợ kỹ thuật
- Hydration ⌘Z/Ctrl+Z tooltip (lib/kbd.ts:11 + CadToolbar) — cosmetic.
- `window.prompt` crash trong webview nhúng — Dashboard.tsx:138 (nút Dự án mới), browser thật OK.
- Migration Prisma drift (IntegrationAccount) — dùng `db push`, KHÔNG reset; schema change phải chờ duyệt.

## Bị chặn — KHÔNG tự khởi động
- Intro screen (chờ hình/video — flow hiện tại ĐÃ gỡ intro theo lệnh user) · ML Gu Engine heavy (chồng lấn 2 app khác) · "API team" spec.

## Quy tắc session
1. Đọc STATUS.md trước tiên; xong task cập nhật STATUS **trước** khi báo cáo.
2. Không tự merge/push lên main. Hạng mục bị chặn không tự khởi động. Sửa đúng phạm vi; bug ngoài phạm vi ghi Nợ kỹ thuật.
3. **An toàn verify browser**: cookie localhost dùng chung → verify TUẦN TỰ; dùng host 127.0.0.1 + account test riêng; KHÔNG logout, KHÔNG loadDemoFlow đè flow thật.
4. Quy tắc worktree & context: xem CLAUDE.md (tối đa 3 worktree; merge xong xoá ngay; STATUS <800 từ, lịch sử → CHANGELOG).
