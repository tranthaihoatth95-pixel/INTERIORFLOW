# STATUS — InteriorFlow

> ⚠️ SHA/trạng thái verify bằng git, không chép brief/memory. Git là sự thật duy nhất.
> ⚠️ Sản phẩm = 3 chặng **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals AI/NotebookLM.
> ⚠️ **IF là sản phẩm ĐỘC LẬP GLOBAL — KHÔNG dính thương hiệu TTT** (xem CLAUDE.md mục LUẬT NỀN TẢNG). Brand Kit = nhận diện riêng TỪNG DỰ ÁN.
> Lịch sử chi tiết: `CHANGELOG.md` (KHÔNG đọc mỗi phiên).

## Hiện tại (24/07 tối — ĐỔ NỀN 1 vừa merge xong, chuẩn bị ĐỔ NỀN 1B)
- **4 nhánh ĐỔ NỀN đã merge**: T1 `img_` id ổn định cho ảnh · T0 scope global\|project + **fix bug gốc card mở nhầm dự án** (slug→id ổn định) · T3 panel Kiểm chuẩn + xuất PDF quy chuẩn trung tính · de-ttt (gỡ TTT khỏi sản phẩm, khung tên đọc Brand Kit).
- Test: `node_modules/.bin/sucrase-node <path>.test.ts` (KHÔNG vitest). Cần chạy full-suite + tsc sau merge trước khi tiếp.
- Tài liệu mới: `docs/IF-CORE-SCHEMA.md` (§1 scope, §1B ghi `/prj/` chỉ là ký hiệu logic — route thật `/projects/`).
- ⚠️ **1 phiên terminal lạc đã đóng** (user xác nhận 24/07 tối) — từ giờ CHỈ phiên này ghi repo. Nhánh `feat/copy-global` (rỗng) + 2 stash (`pre-merge-stash`, `wip-dsstore`) **giữ nguyên, không đụng**, chờ user soi sau.

## Việc chờ làm — thứ tự đã chốt với user
1. **Dọn 4 worktree đã merge** (`scope-t0`, `img-id-t1`, `checker-pdf-t3`, `de-ttt`) → build+tsc PASS mới dọn.
2. **ĐỔ NỀN 1B** (Task #21): dời CAD/Render/Present/Photo xuống `/projects/[id]/(cad|render|present|photo)`; route cũ → redirect đọc store; **URL = nguồn sự thật**, store chỉ cache.
3. **Việc 3** (#22): `docs/SPEC-VITALS-AI.md` — khung 6 nhóm (orb→copilot→citation→function-calling→voice/ảnh→audio), header `[CẦN HOÀ DUYỆT]`.
4. **Việc 4** (#23): GuProfile = DỮ LIỆU — seed `studio-default` (demo, tắt prod), runtime đọc gu+Brand Kit dự án hiện hành, xoá hardcode gu.
5. **Việc 5** (#24): `IF-CORE-SCHEMA.md` thêm Luật trung tính + Luật demo; ví dụ `prj_detech01`→`prj_nord01`; grep "detech" toàn repo → trung tính hoá.
6. **Việc 6** (#16): audit brand/PII toàn repo (TTT/Detech/MSB/Vinhomes/SunGroup/CapitaLand/HVH/tên người/sđt) — **báo cáo bảng, KHÔNG tự sửa**, chờ user duyệt.
7. **Việc 7** (#17): demo lifecycle — seed trung tính Atelier Nord/`prj_nord01`, cờ `NEXT_PUBLIC_DEMO` (dev on/prod off), empty state 2 nút, tour coachmark 5 bước.
8. **PDF font Việt** (#25) — nhúng Unicode (Be Vietnam Pro/Noto Sans) vào `pdf.ts` toàn pipeline, đầu mẻ ĐỔ NỀN 2. ⚠️ Có 1 phiên riêng user mở đã DỪNG (chưa code gì) — việc này CHỈ làm trong task #25 chính thức.

## Nợ kỹ thuật đáng chú ý
- 🔴 **jsPDF helvetica không render dấu tiếng Việt** — cả `pdf.ts` (CAD plot) lẫn `standards-report.ts` (báo cáo quy chuẩn mới). → task #25.
- 🟡 CAD/Render/Present vẫn chạy route toàn cục (audit T0), chưa nằm dưới `/projects/[id]/` → ĐỔ NỀN 1B.
- 🟡 30 ảnh nền login còn tên file `ttt-01..30.jpg` (nhãn UI đã trung tính, URL còn lộ) — chờ user chọn: đổi tên / giữ / thay bộ ảnh mới.
- 🟡 Morph login chỉ fade (chưa LayoutGroup cross-page) · Signup chưa auto-open avatar picker.
- ⚪ `/cad-editor` warning React "Cannot update a component" không tái hiện được, treo.

## Cột mốc trước đó
- **24/07 sáng**: 9 nhánh + bộ cài Windows Electron đã merge (zone-tool·dwg-flatten·access-control-m1·cad-core-logic·legend-wave1·legend-research·floorplan-color-fill·clay2img-audit·installer-win). `.app` build được trên Mac (native, đã cài `/Applications`), NSIS `.exe` cần build native trên Windows (`build-windows-native.bat`).
- fal hoạt động (balance nạp OK) — render clay→photoreal sống.
- Báo cáo BGĐ: `docs/BAO-CAO-BGD-GD1.html` (KHÔNG commit — vào `.gitignore`, đây là tài liệu RIÊNG cho TTT, không phải sản phẩm).
- **Local vượt origin — push khi tiện**: `git push origin feat/present-layout-ml-p1:main`.

## Batch cập nhật sau (chưa làm, backlog)
- Lock overlay ⌘⇧L/Ctrl⇧L (giữ phiên, không logout) — đã chốt hướng.
- ControlNet render: clay2render(Depth) sai khối với model SketchUp nhiều nét → cần sketch2render(Canny) + nút control strength.
- Vitals mở rộng (Figma, spec MIA — xem việc 3) · CAD 3-option UX · Presenting cây thư mục kiểu InDesign · Video editor M1 · Chat FULL (blocker ACCESS-CONTROL đã gỡ) · Library auto-classify · Archinote (xem `docs/MASTERPLAN-IF-ARCHINOTE.md`).

## Quyết định user đã khoá
- Auth: email mọi domain · Google · MS (chờ Azure app) · quên mk = admin reset.
- Perceptron thật (learning-to-rank) wired Presenting LayoutShelf + CAD AiBriefPanel.
- Click card dự án = mở workspace resume đúng chặng (theo id thật). Nút "Tổng quan" = `/projects/[id]/overview`.

## Bị chặn — KHÔNG tự khởi động
- (Trống.)

## Quy tắc session
1. Đọc STATUS.md trước tiên; cập nhật trước khi báo cáo xong task.
2. Không tự merge/push lên main (auto mode chặn) — user chạy tay, agent chỉ báo lệnh.
3. **LUẬT MÁU**: verify browser qua `127.0.0.1:<port>` (KHÔNG `localhost`); TUYỆT ĐỐI KHÔNG logout/DELETE cookie. Worktree copy `.env` + DB riêng `dev.db.wt`, `DATABASE_URL` phải ABSOLUTE path.
4. Worktree: max 5, dọn ngay sau merge (`git worktree remove` + `git branch -d`, KHÔNG force trừ khi xác nhận an toàn).
5. **Vai trò**: phóng agent code, KHÔNG tự code. Agent con **KHÔNG được spawn_task** (chống phiên lạc).
6. **IF là sản phẩm global** — không hardcode brand nào; nội dung demo/dự án thật KHÔNG vào git (xem `docs/CONTENT-RULES.md` + `.gitignore`).
