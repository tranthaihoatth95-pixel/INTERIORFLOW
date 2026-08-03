# STATUS — InteriorFlow

> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Drafting CAD · Rendering · Presenting** + login/Gallery/Vitals/Notebook.
> ⚠️ **ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG**: IF ĐỘC LẬP GLOBAL, không dính TTT. Brand Kit = nhận diện TỪNG DỰ ÁN.
> Lịch sử → `CHANGELOG.md` (không đọc mỗi phiên).

## ✅ XONG (03/08 đêm muộn — sửa bug MẤT DỮ LIỆU mode 3D, chi tiết đủ trong message commit)
- **Mode "3D Thiết kế" giờ ĐÃ autosave** (bug có từ push-pull 3D-5, phát hiện khi verify VIỆC dưới)
  — `useCad3DAutosave()` nối lại ĐÚNG `lib/sheets-persist.ts` (không cơ chế lưu thứ hai), gọi ở
  gốc `Render3DModeSkeleton.tsx`. Cốt lõi thuần `lib/cad/cad3d-autosave-core.ts` (13 test tích hợp
  thật, chờ debounce 1200ms THẬT) + `lib/cad/cad-doc-hydration.ts` (cờ chống race 2D↔3D). Verify
  browser thật: khoét hốc → F5 (URL y hệt) → hốc còn nguyên (IndexedDB + UI khớp). `tsc --noEmit`
  toàn repo: đúng 1 lỗi, KHÔNG phải của việc này (`Viewport3D.tsx` `ViewDir` — phiên KHÁC đang sửa
  đồng thời, file không đụng tới). Chi tiết → `docs/TECH-DEBT.md`, `docs/SO-KIEM-TONG.md` §1.

## ✅ XONG (03/08 đêm — NC-12 bộ lệnh 3D VIỆC 1-3, chi tiết đủ trong message commit)
- **`three-mesh-bvh`+`three-bvh-csg`** cài (MIT, NC-12 §1.6 chốt) · **`Base.ops?: BuildOp[]`**
  (`model.ts`, đúng 3 phép `extrude`/`boolean`/`arrayLinear`, optional/additive, KHÔNG bump
  `IDF_VERSION`) · **boolean THẬT**: `lib/three/csg.ts` (cổng duy nhất gọi thư viện) +
  `lib/three/build-ops.ts` (cache runtime theo entityId+hash, KHÔNG vào Doc) + `cad-to-obj.ts`
  dựng cutter (`boxPositionsMm`) + `lib/cad/commands.ts` `cutHoleInWall` (thuần) + store method
  cùng tên + nút thật "Khoét hốc" trong `Object3DInspector.tsx`. 30 test mới (4 file), tsc scoped
  sạch. Verify browser: click thật → `ops` ghi đúng vào Doc trong bộ nhớ (entities 117→118), CSG
  chạy thật (không lỗi). **Phát hiện lỗi CÓ TRƯỚC (không do việc này)**: mode "3D Thiết kế" không
  autosave IndexedDB (autosaver chỉ sống trong `CadSheets.tsx`, không mount ở stage 3D) — ăn luôn
  cả push-pull 3D-5 đã ship. Chi tiết → `docs/TECH-DEBT.md`.

## ✅ XONG (03/08, TRÌNH-CODE — chi tiết đủ trong message commit)
- **BOQ editor B0-B6+B10** (`4991340`) + **xlsx SUM sống B8** (`18afba3`) — `docs/PHIEU-TRINH-BOQ-EDITOR.md`.
  Live-link override (sửa tay ô m²/đơn giá, badge+revert+cảnh báo) · group theo tầng · truy vết
  ngược "Xem trên bản vẽ" · treo tạm nút BOQ trong `PresentNavigator` (chờ H4 5-loại-hồ-sơ) ·
  27+36 test pass, tsc scoped sạch. Bắt+sửa 1 bug thật lúc verify browser (vòng lặp vô hạn
  `useT()` trong `useCallback` deps). **CHƯA làm**: B7 cột tuỳ biến · B9 in PDF (treo, ghi rõ).
  B11 (mini-DSL) vẫn GATED chờ PHU đúng như phiếu.

## ✅ XONG (02/08, mã commit — chi tiết đủ trong message từng commit + CHANGELOG)
- **3D-1** (`d9eea9b`+`d5f6700`): three.js viewer mode orbit + nút "Xem 3D" node "Bản vẽ → 3D".
  FPS thật: gộp theo màu 4 draw call/0.087ms/khung, không gộp 2011/2.73ms — vẫn realtime.
- **3D-2..3D-5 ĐÃ CÓ SẴN TỪ TRƯỚC** (`d7dff63`/`4c81469`/`87c2e78`/`2881c32`) — mục "⬜ CHƯA BẮT ĐẦU"
  bản cũ SAI, đã sửa (02/08 tối). **Mới**: đổi chữ ký `captureSequence()` sang streaming `onFrame`+
  `AbortSignal`+`frameCount` (yêu cầu Hoà, tránh gom RAM) + `planCaptureSequenceFrames()` thuần có
  test (26/26). ⚠️ CHƯA đo được thời gian thật qua browser (sandbox không giữ được dev server sống
  qua các lần gọi) — bench sẵn ở `app/dev-bench-3d-2/`, chờ chạy tay. Chi tiết đủ → `CHANGELOG.md`.
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
- Menu "3D — sắp có (Phase 3–4)" đã có sẵn trong header canvas (`ref` thấy khi verify) — CHƯA nối
  vào Scene3DViewer (3D-2..5 giờ đã xong hết, không còn "chờ mode" nữa) — việc nối menu này là việc
  UI riêng, chưa ai làm, xem trước khi động vào.
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
- **`npx tsc --noEmit -p .` (toàn repo) KHÔNG chạy xong trong sandbox Cowork này** — luôn hết giờ
  lệnh (>40-45s, kể cả bật `incremental`) dù `tsconfig.tsbuildinfo` có sẵn từ trước. Dùng tsc SCOPED
  (config tạm `include` đúng vài file đang sửa, xem `tsconfig.scoped.json` cách làm) để kiểm nhanh
  thay vì `-p .` — ghi lại đây để phiên sau khỏi mất công thử lại y hệt.
- **2 file scratch KẸT lại, sandbox không xoá được** (FUSE, cùng loại cũ) — đã dọn rỗng nội dung,
  Hoà `rm` tay: `tsconfig.scoped.json` (tsc scoped tạm, xem trên) · `app/dev-bench-3d-2/page.tsx`
  (bench đo `captureSequence`, xem mục 3D-2 phía trên — CHỈ xoá SAU KHI đã chạy lấy số thật, đừng
  xoá trước).

## Worktree đang mở
- **`interiorflow-g4`** (nhánh `nhanh-g4`) — ĐÃ merge vào `main` (`12223cf`), nhưng KHÔNG xoá worktree:
  `git status` worktree này còn dirty (`​.claude/launch.json` sửa tay, chưa commit — thêm entry dev
  server `interiorflow-g4` port 3004) VÀ có dev server đang chạy thật ở port 3004. Thiếu 2/4 điều
  kiện an toàn (`CLAUDE.md` mục "Dọn cuối phiên") → giữ nguyên, chủ dự án quyết khi tiện.

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
