# BÁO CÁO PHIÊN · FC — P5 FeatureContract máy hoá + soi:contract (bậc 1) — 13/08/2026

**Phiếu:** `docs/phieu-giao/feature-contract-may.md` · **Vai:** FC (cấp F build-tooling, DocCore P5)
**Điều khoản ruột:** [T6] soi 2 chiều · [T2] một cỗ máy nhiều mặt tiền · [T0] grep code thật · [Đ2]

## ① Việc đã làm — đúng 5 file vùng phiếu

| File | Việc |
|---|---|
| `scripts/contract-registry.mjs` | MỚI — 22 entry đủ 4 câu (doc·ghi·congThuc·anTheo) + loi/day/trangThai |
| `scripts/soi-contract.mjs` | MỚI — 3 khối 🔴 (regress · mất dây · sổ quên) + bảng 🟡 KHO CHỜ DÂY, exit 1 chỉ khi 🔴 |
| `package.json` | +1 dòng `"soi:contract": "node scripts/soi-contract.mjs"` |
| `docs/FEATURE-CONTRACT.md` | MỚI, 58 dòng — 4 câu là gì · cách thêm entry · cách đọc output · giới hạn bậc 1 |
| Báo cáo này | — |

**Đếm entry:** 22 tổng = **20 co-day · 2 cho-day** (capture-sequence · lux-l6). Nạp: 14 kho
DOI-CHIEU §1 (kiểm lại từng kho bằng grep 13/08) + 8 engine 12-13/08 (DistillEngine ·
TableDocEngine · BuildRecipe/evalRecipe · pdfToDeck · packHoSoSong · GroundedRender ·
suggestScaffold · TaskContext). Máy soi miễn khai (đúng phiếu ④.1b).

## ② BẢNG ĐỐI CHIẾU 14 KHO CŨ (sổ 08/08 nói "0 caller") — sự thật grep 13/08

| # | Kho | 13/08 | Bằng chứng grep (file:dòng) |
|---|---|---|---|
| 1 | build-ops 9 hàm | **ĐÃ MỞ** | `BuildOp` union `model.ts:490` đủ arrayRadial/mirror/bevelEx/taper/sweep/revolve; `Command3DPanel.tsx` dùng op thật |
| 2 | docContext Vitals | **ĐÃ MỞ** | `VitalsGesture.tsx:78-79` field docContext+violations trong payload (frontier vitals-doccontext đợt 0) |
| 3 | captureSequence | 🟡 chờ | chỉ `app/dev-bench-3d-2/page.tsx:107` (route bench tạm) + comment Scene3DViewer — chưa có nút xuất |
| 4 | /api/tasks | **ĐÃ MỞ** | `TaskBoardScreen` · `ProjectInitBoard` · `Render3DModeSkeleton` · `lib/tasks/focus-entity.ts` gọi chuỗi `/api/tasks` |
| 5 | eyedropper | **ĐÃ MỞ** | `CadCanvas.tsx:63` import matchPropsOne + nút `CadToolbar.tsx:539` (CustomEvent cad:eyedropper-toggle) |
| 6 | vcb gõ số | **ĐÃ MỞ** | `CadCanvas.tsx:2316,2325` parseVcbToken + applyVcbToMoveCopy chạy thật |
| 7 | export V-Ray/D5 | **ĐÃ MỞ** | `MaterialPbrEditor.tsx:133` gọi toVRayMtl/toD5Material (nút xuất tham số engine) |
| 8 | Lux L6 | 🟡 chờ | hàm ĐÃ VIẾT 08/08 (`lib/lighting/lux.ts` roomLuxEstimate/luxVerdict) nhưng 0 caller — chỉ comment `schema.ts:90` nhắc |
| 9 | Trích PDF brief | **ĐÃ MỞ** | `components/cad/AiBriefPanel.tsx:157-158` extractPdf; thêm `app/api/notebook/.../source/route.ts` |
| 10 | commands registry | **ĐÃ MỞ** (1 phần) | `AppCommandPalette.tsx:28` import cmdsFor (⌘K + statusbar sống); icon=0, mặt dock/contextmenu/llm còn treo → việc hotkey-registry đợt 6 |
| 11 | T2 ảnh recipe | **ĐÃ MỞ** | `model.ts:471` `recipe?: LinkedAssetRecipe` + `Inspector.tsx:1383` renderRecipeImage nút "Làm mới từ bản vẽ" |
| 12 | Thư viện + FM mock | **ĐÃ MỞ** | `shelves.ts:25` `LIBRARY_DATA_IS_MOCK = false` · `queries.ts:3` "12/08 BỎ MOCK" (frontier library-data-that/fm-data-that) |
| 13 | --accent-warm | **ĐÃ MỞ** | `LightArc.tsx:42` state warn dùng var · VitalsStateBadge · LightClock — 8 file caller |
| 14 | GuProfile | **ĐÃ CÓ DÂY** (code cãi sổ) | `ConceptForm.tsx:13` guProfileFromPicked · `PresentEditor.tsx:53` buildGuProfile — sổ 08/08 ghi "cố ý chặn" nhưng caller THẬT tồn tại; phần gate Reference.projectId vẫn giữ chủ đích. Ghi theo code thật + note (đúng BIÊN phiếu) |

**Kết đếm: 12/14 ĐÃ MỞ · 2 chờ dây.** Sổ BAN-THIET-KE 13/08 ghi "13 kho-chưa-mở còn lại (đợt 4
mở 1/14)" — LỖI THỜI so với grep hôm nay: các đợt 12-13/08 đã mở gần hết mà sổ chưa gom.
Khối "🔴 sổ quên" lần đầu = 0 vì tôi kiểm grep TRƯỚC khi ghi trạng thái ([T0] — sự sửa-sổ-quên
xảy ra ngay lúc nạp, 12 kho flip từ "0 caller 08/08" → co-day).

## ③ Output soi:contract lần đầu — nguyên văn

```
SỔ DÂY FEATURECONTRACT — soi-contract 2026-08-13
① 🔴 REGRESS — khai lõi mà bằng chứng lõi MẤT: (không có)
② 🔴 MẤT DÂY — khai co-day mà 0 caller thật: (không có)
③ 🔴 SỔ QUÊN — khai cho-day mà kho ĐÃ MỞ (có caller): (không có)
🟡 KHO CHỜ DÂY — lõi sống, 0 caller (hàng đợi nối dây, xếp theo đòn bẩy, KHÔNG tính lệch):
  🟡 capture-sequence — captureSequence() xuất PNG sequence
     ↳ chờ ai ăn theo: Tầng ① SPEC-TRINH-VIDEO-EDITOR (chưa nối) — video tạo+dựng chặng 2 theo chốt 13/08
  🟡 lux-l6 — Lux L6 phương pháp quang thông
     ↳ chờ ai ăn theo: (chưa ai) — đích dự kiến: Inspector phòng chặng 2D/3D + lib/review lớp luật chiếu sáng
🔗 CÓ DÂY — hợp đồng sống, caller thật:
  ✅ build-ops-9-ham 1 · vitals-doc-context 1 · tasks-api 4 · eyedropper-matchprop 1 ·
  ✅ vcb-go-so 1 · export-vray-d5 1 · brief-pdf-extract 2 · commands-registry 1 ·
  ✅ anh-recipe-lam-moi 1 · library-fm-kho-that 2 · accent-warm-canh-bao 8 · gu-profile 2 ·
  ✅ distill-engine 3 · table-doc-engine 2 · build-recipe 1 · pdf-to-deck 2 ·
  ✅ goi-ho-so-song-pack 1 · grounded-render-v0 2 · scaffolder-goi-y 1 · task-context-day 4
CONTRACT — 🔗 20 có dây · 🟡 2 chờ dây · 🔴 0 LỆCH
```

## ④ Nghiệm thu tự làm (phiếu ⑥)

- `node scripts/soi-contract.mjs` chạy đủ 3 khối + bảng kho chờ dây, exit 0 ✅
- **Self-test máy bắt lệch** (registry giả 3 ca trong scratchpad, không đụng repo): regress ·
  mất-dây · sổ-quên đều bắt đúng, exit 1 ✅
- `npm run soi:frontier` KHÔNG vỡ ✅ — báo đúng 1 🔴 là chính entry `feature-contract-may`
  ("code có rồi mà sổ ghi chưa") — ĐÚNG THIẾT KẾ phiếu ⑧: T flip sau audit, FC bị cấm sửa
  frontier-registry (BIÊN). Không phải lỗi.
- `npx tsc --noEmit` exit 0 ✅ · KHÔNG git · KHÔNG server · KHÔNG dep · không đụng
  components/present-editor + lib/present-editor/export.ts (chỉ grep đo)

## ⑤ Quyết định tự chọn (mơ hồ → chọn + lý do)

1. **Kho 3 vẫn cho-day dù route bench gọi:** dev-bench là route TẠM tự khai "xoá sau khi đo";
   day.mau dùng `import \{[^}]*captureSequence` để né comment Scene3DViewer (file này import
   capture.ts nhưng KHÔNG import captureSequence) — khớp ý frontier capture-nut "rời route bench".
2. **Kho 14 flip co-day:** sổ nói "cố ý chặn" nhưng grep ra 2 caller thật — BIÊN phiếu bảo
   ghi theo code + note, đã note phần gate projectId giữ chủ đích.
3. **Kho 8 cho-day dù sổ §1#8 tưởng "chưa có hàm":** hàm đã viết 08/08 (header lux.ts tự khai)
   nhưng 0 dây — trạng thái đúng của nó là kho-chờ-dây, không phải chưa-khởi-công.
4. **Pattern day ưu tiên import/chuỗi literal** (vd `['"\`]/api/tasks`, `from '@/lib/...'`) để
   né comment nhắc tên — đã bắt được 2 ca comment-contamination thật (Scene3DViewer · AppShell).
5. **EXT máy soi thêm `.css`** (khác soi-frontier) — vì entry accent-warm có lõi ở globals.css.
6. **Khối sổ-quên = 0 ở lần đầu:** không "nới" gì — hệ quả trực tiếp của [T0] kiểm-trước-ghi-sau;
   phiếu ⑤ nói có 🔴 lần đầu là bình thường, không nói bắt buộc phải có.

## ⑥ Khuôn 2 giá trị (HOP-DONG §1c)

- **Kiến trúc app** [tính năng]: sổ dây máy-đọc đóng vòng T6 thứ 5 (frontier·hinh-hoc·tu-dien·
  thao-tac·contract) — anti-pattern #1 nay có máy canh, kho mới sinh ra là phải khai dây.
  [giao diện]: chưa đụng UI — bậc sau ("nút mồ côi") cần hotkey-registry làm nguồn map nút→lệnh.
- **Vận hành/giá trị IF** [tính năng]: bảng KHO CHỜ DÂY = danh sách việc-rẻ-nhất luôn tươi cho
  phiếu sau (hôm nay: capture-sequence mở đường video chặng 2 · lux-l6 mở moat chiếu sáng).
  [giao diện]: 4 câu chữ người đọc trong registry chính là tài liệu sống trả lời "tính năng này
  đọc gì/ghi gì/ai ăn theo" — phiên sau khỏi đối chiếu tay 42 spec.

## ⑦ Bàn giao / chờ T

- T flip entry frontier `feature-contract-may` sau audit (đỏ soi:frontier hiện tại là chờ-flip).
- Đề xuất nhịp: thêm `soi:contract` vào chuỗi kết-phiên cạnh `soi:frontier` (1 dòng docs HOP-DONG).
- Bậc sau: soi "nút mồ côi" khi hotkey-registry (đợt 6) có map nút→lệnh.
