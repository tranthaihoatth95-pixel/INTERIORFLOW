# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (02/08, mã commit — chi tiết đủ trong message từng commit + CHANGELOG)
- **3D-1** (`d9eea9b`+`d5f6700`): three.js viewer mode orbit + nút "Xem 3D" node "Bản vẽ → 3D".
  FPS thật: gộp theo màu 4 draw call/0.087ms/khung, không gộp 2011/2.73ms — vẫn realtime.
  walk/campath/section: TODO 3D-2..3D-4.
- **Wire nút "PDF in 300dpi (A3/A4)"** (`2a252c9`) — mở khoá theo khổ giấy, verify cả 2 nhánh.
- **Đo ESRGAN thật** (Hoà duyệt ~4cr) — TB 9.7s/ảnh · scale ×4 đúng lý thuyết. Số đầu (512/896px)
  KHÔNG đạt 300dpi A3 — nhưng đó chỉ là 2 cỡ test tuỳ chọn, KHÔNG phải trần thật của tầng free.
- **P3 phần 2** (`8b7e282`) — Hoà chốt hướng "chuẩn nguồn in": nguồn ≥~1240px (tầng free xuất
  1344px, ĐỦ) → A3 300dpi đạt bằng ×4. `lib/present-editor/print-upscale.ts` (targetPx suy từ
  frame% × mm giấy thật, planSteps 0/1/2 = ×4 rồi ×2 phần thiếu) + `upscale-cache.ts` (IndexedDB,
  key = hash SHA-256 src, mỗi ảnh trả tiền 1 lần) + `export.ts` tự upscale trước khi render +
  `PresentEditor.tsx` hiện giá/thời gian ước qua `window.confirm` trước khi trừ credit thật.
  Verify browser thật: credit spend/refund atomic đúng (mọi lỗi đều hoàn), export không crash khi
  upscale lỗi. Chi tiết sự cố khi verify (vượt phạm vi duyệt, đã dừng kịp, net -4cr ví demo) → xem
  message commit `8b7e282`, không lặp lại ở đây.

## 🟡 PHÁT HIỆN QUAN TRỌNG — đọc trước khi verify browser bất kỳ tính năng dùng `aiTier`/`credits`
`useFlowStore.hydrate()` (đọc `aiTier`/`credits`/theme từ localStorage) **CHỈ được gọi từ
`components/home/HomeScreen.tsx`**. Vào THẲNG URL con (vd `/present-editor`, hard reload/navigate
mới) → store luôn về mặc định (`aiTier=2`), BỎ QUA mọi thứ đã lưu trong Settings. Cách verify
đúng: mở `/` (hoặc để app tự resume) trước, RỒI điều hướng bằng click UI thật (client-side route,
không hard-navigate) sang trang cần test. Ghi vào TECH-DEBT nếu có ca thật user report "đổi mức
AI ở Settings không ăn" — nghi đúng nguyên nhân này (route không qua Home).

## ⬜ CHƯA BẮT ĐẦU (hàng đợi đã biết)
- **3D-2** (mode campath + captureSequence, mở khoá video bậc 2-b) → 3D-3 (depth/lineart) → 3D-4
  (section/walk) — thứ tự cố định, `docs/SPEC-3D-CORE.md` §4. camPath ăn `CamPathResult`
  (`lib/cad/campath.ts`, KHÔNG phải "SampledCamPath" spec gọi nhầm tên — đã sửa khi làm 3D-1).
- Menu "3D — sắp có (Phase 3–4)" đã có sẵn trong header canvas (`ref` thấy khi verify) — CHƯA nối
  vào Scene3DViewer/3D-1, có thể là chỗ nối tự nhiên cho 3D-2 hoặc việc riêng, xem trước khi làm.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at khoá điểm/khoá zone + panel chỉnh tốc độ/lens.
- Liên kết sống CAD→deck (moat) — sau P1-P3.
- Toàn bộ mục dưới "Chờ USER quyết" (chưa đổi) vẫn còn nguyên.

## 🔴 PHIÊN SAU PHẢI BIẾT
- **`.git/index.lock` stale LẦN 5** phiên này — hai phiên (tôi + code phụ) giờ **CHUNG 1 .git**,
  Hoà đã báo trực tiếp. Luật mới: commit theo CỤM NGẮN, không giữ lock lâu giữa các bước; nếu file
  đang STAGED sẵn (không phải của mình) → **dùng `git commit -- <pathspec>` giới hạn đúng file
  mình**, TUYỆT ĐỐI không `git add -A`/commit trơn (sẽ cuỗm cả staged của phiên kia).
- **`findHatchBoundary`** (`cad-to-obj.ts`, code CŨ) treo >2 phút ở mật độ phòng cực cao — né được
  trong bench 3D-1, ghi `TECH-DEBT.md`, chưa phải bug chặn.
- File scratch bench 3D-1 đã xoá sạch, ảnh test P3-2 đã xoá khỏi dự án mẫu, mức AI đã trả về
  "oneAI" (mặc định gốc) trước khi rời — dự án mẫu sạch, không còn dấu vết verify.

## Nợ kỹ thuật
→ `docs/TECH-DEBT.md`.

## Chờ USER quyết
- **4.1.f thi công** (đổi hình dạng `brand-kit.json`) · **`knowledge/ttt-design-system/`** vi phạm
  LUẬT TRUNG TÍNH · **④ `FlowVersion`** không phải thủ phạm `dev.db` phình · **NT1/NT5**/**T3/T4**
  dời sau · **Figma** MCP lỗi, đường vòng đã có · **DWG** hướng GPL chưa chốt + `2.1.6.d` 🔴 bug
  Nhập DWG treo vĩnh viễn chưa ai động · Treo: VIỆC 4 cũ, #14, Xlsx probe · 3 nhánh
  `worktree-agent-*` merged còn local · Sprint BOQ ĐỢT 3 greenlight sau ĐỢT DEMO ·
  `2.2.16-2.2.21`/12 file SPEC-TỔNG §9/`2.2.83` chưa quyết. Chi tiết → CHANGELOG/`IF-FEATURE-TREE.md`.

## Quy tắc session
*(worktree/LUẬT NỀN TẢNG → `CLAUDE.md`. Chi tiết đầy đủ → memory: `feedback-docs-never-overwrite`,
`feedback-verify-before-trust`, `project-ben-doc-bundle-workflow`.)*
1. Không tự merge/push **main** nếu chưa hỏi.
2. **LUẬT MÁU verify browser**: qua `127.0.0.1:<port>` (KHÔNG `localhost`); KHÔNG logout/xoá cookie.
3. Login demo: `demo@if.local` / `demo1234`.
4. **KHÔNG `prisma db push`/`migrate` qua sandbox** (FUSE chặn khoá file SQLite) — soạn lệnh sẵn
   cho Hoà chạy máy thật. Backup: `sqlite3 dev.db ".backup 'ten'"`, không `cp`. Chi tiết →
   `docs/00-CHOT.md` mục "LUẬT VẬN HÀNH".
5. **Hai phiên chung `.git`** (mới 02/08) — commit cụm ngắn, `git commit -- <pathspec>` khi có
   file staged của phiên khác, không giữ lock lâu.
