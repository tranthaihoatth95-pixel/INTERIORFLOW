# M-EMPTY-2-OUT — code đuổi theo mock [BẢN CHỐT] "Bốn trạng thái rỗng" (07/08 đêm)

V6 KHÔNG commit · §0u chỉ ghi file này. Mock là HỢP ĐỒNG — mọi lệch đều sửa CODE, không sửa mock.
⚠️ Phiếu gốc bị CẮT CỤT ở "VIỆC 3 — KIỂM ĐƯỜNG NGƯỜI DÙNG THẬT / Tài khoản…" — phần sau chữ
"Tài khoản" không tới được phiên này; đã kiểm đường người dùng ở mức làm được (dưới), phần
tài-khoản-mới vẫn kẹt luật cookie (ghi ở CHƯA VERIFY). TỔNG dán lại phần đuôi nếu còn yêu cầu khác.

## VIỆC 1 · ĐỐI CHIẾU (mở mock bằng trình duyệt thật + đọc nguồn — bản tĩnh chồng 4 màn nên
cấu trúc nút đọc từ HTML, số đo/chữ đối chiếu đủ; mock render 1 theme lúc chụp, hợp đồng màu là
token `var(--*)` nên so ở mức token)

| Màn | Mock có gì | Code TRƯỚC lượt này | Lệch → đã sửa |
|---|---|---|---|
| 1a Dự án | Tiêu đề "Không gian dự án của bạn"+EN · desc "Một dự án giữ bản vẽ, khối 3D và hồ sơ trình khách ở cùng một chỗ." · 2 nút: "Tạo dự án mới"(accent) + "Mở dự án từ máy"(phụ) | "Chưa có dự án nào" · 1 nút "Dự án mới" | Tiêu đề/desc/nhãn sai chữ · THIẾU lối 2 |
| 1b 2D | "Bàn vẽ hai chiều"+EN · desc gốc-cho-3D/BOQ · "Nhập bản vẽ có sẵn"(accent)+"Vẽ mới"(phụ) · hint "Kéo tệp thả vào bàn vẽ cũng được" | "Bản vẽ đang trống" · 2 nút đúng nhãn · KHÔNG kéo-thả | Tiêu đề/desc sai chữ · hint kéo-thả là NÓI DỐI nếu không nối — phải nối thật |
| 1c 3D | "Không gian dựng khối"+EN · desc nét-vẽ-tới-đâu · "Dựng khối từ mặt bằng 2D" KHOÁ + câu warning NHÌN THẤY khi chưa có mặt bằng · "Vẽ mặt bằng trước"(accent khi lối 1 khoá) + phụ "Mở chặng Thiết kế 2D" | "Bắt đầu dựng không gian" · "Đùn từ bản vẽ"(khoá chỉ title-hover) + "Dựng khối đầu tiên"(accent) | Toàn bộ chữ · lý-do-khoá phải lộ mặt · lối 2 là NÚT MỚI cần dây điều hướng thật · nút "Dựng khối đầu tiên" không có trong mock |
| 1d Trình chiếu | "Hồ sơ trình khách"+EN · desc bộ-khách-comment · "Tạo từ ảnh đã dựng" KHOÁ+warning khi 0 ảnh render · "Bắt đầu bằng slide trắng"(accent) + phụ "Thêm ảnh và mặt bằng sau" | "Chưa có slide nào" · "Tạo từ ảnh đã dựng" = mở PICKER TỆP (luôn bật — sai ngữ nghĩa "ảnh ĐÃ DỰNG") · "+ Trang trắng" = chèn TEMPLATE có chữ mẫu (sai "slide trắng") | Chữ + cả HAI dây nút phải nối lại đúng nghĩa |

## VIỆC 2 · SỬA CODE THEO MOCK — file:dòng (grep `M-EMPTY-2`)

**1a `components/ProjectSelect.tsx`** (grep `M-EMPTY-2`) — tiêu đề/desc/2 nút đúng chữ mock, song
ngữ theo `en` sẵn có. ⚠️ "Mở dự án từ máy": mock vẽ nút bấm được nhưng đường nạp tệp→dự án từ
Gallery CHƯA TỒN TẠI (khôi phục `.ifpack` sống trong chặng 2D — `cad:ifpack-import-request`,
`CadSheets.tsx`) ⇒ theo đúng VIỆC 2c "chưa nối được thì KHOÁ + nói rõ": nút `disabled` + title
2 thứ tiếng chỉ đường vòng. **GAP cho TỔNG:** [EMPTY-2-a] cần đường "mở dự án từ tệp" ngay tại
Gallery thì nút này mới bấm được như mock.
**1b `components/cad/CadEditor.tsx`** (grep `M-EMPTY-2`) — chữ đúng mock; kéo-thả NỐI THẬT:
tách `importDxfFile(f)`/`importDwgFile(f)` khỏi 2 input handler (một đường nhập, hai cửa vào),
card nhận drop `.dxf`/`.dwg`, tệp khác báo status rõ; "Vẽ mới" đóng thẻ + `setTool('wall')`
(2c "công cụ vẽ sẵn sàng").
**1c `components/render-studio/Render3DModeSkeleton.tsx`** (grep `M-EMPTY-2`) — chữ đúng mock;
lý-do-khoá lộ mặt (câu `var(--warning)` dưới nút, hết title-hover); "Vẽ mặt bằng trước" đi ĐÚNG
đường StageSwitcher (`pickStage('concept')`, `lib/studio/stage-nav.ts:37` — không chế đường
điều hướng thứ hai); accent hoán đổi theo trạng thái như mock. Nút "Dựng khối đầu tiên" RỜI card
theo mock — cơ chế nháy-nút-Tường GIỮ (hàm `dungKhoiTaiCho`, đường tại chỗ vẫn còn qua Command
panel Tạo→Tường ⇒ **X2 thoả ở mức màn**; ghi nhận căng giữa mock 2-nút và X2 để TỔNG biết, không
tự đổi mock).
**1d `components/present-editor/PresentEditor.tsx`** (grep `M-EMPTY-2` ×2) — chữ đúng mock;
"Tạo từ ảnh đã dựng" nay đọc ảnh render THẬT của flow qua `deckImagesWithIdsFromNodes`
(`lib/present-editor/handoff.ts:118` — đúng nguồn `pickStage` dùng khi bàn giao Render→Present),
0 ảnh ⇒ KHOÁ + warning đúng chữ mock, có ảnh ⇒ mỗi ảnh thành một trang (trần 12, khai trong
code); "Bắt đầu bằng slide trắng" tạo trang TRẮNG THẬT (elements rỗng — bỏ đường template
"Tiêu đề slide/Ý chính" cũ ở màn rỗng; nút "+ Thêm slide" thường vẫn dùng template như cũ, ngoài
phạm vi). Picker-tệp cũ của màn rỗng bỏ (mock 2 nút; upload vẫn còn ở nút "Ảnh" Toolbar).
**Song ngữ (2d):** cả 4 chỗ qua `useT`/`en` — VI và EN đều là chữ trong mock. **2 theme:** toàn
token `var(--t*/--accent/--field/--warning/--border)`, không hex mới.

## VERIFY (N1 — browser thật, server riêng 3001 đã tắt; ảnh trong transcript)
- 1b: card "Bàn vẽ hai chiều" đúng chữ + hint kéo-thả — ảnh chụp. (Kéo-thả tệp thật chưa mô phỏng
  được bằng CDP — CHƯA VERIFY hành vi drop, logic dùng chung 100% đường input đã verify nhiều lần.)
- 1c: card đúng chữ, nút chính KHOÁ + câu warning vàng nhìn thấy (flow chưa có bản vẽ — đúng
  trạng thái mock vẽ) — ảnh chụp; bấm "Vẽ mặt bằng trước" → URL đổi `/render` → `/cad` THẬT
  (đo `window.location.pathname`).
- 1d: card đúng chữ VI+EN, nút chính khoá + warning, "Bắt đầu bằng slide trắng" → "1 slide"
  trắng THẬT trên canvas (ảnh chụp) → đã Hoàn tác trả deck về 0 slide.
- Console: 1 lỗi duy nhất = `EditorCanvas` max-update CŨ (sổ ghi từ 04/08, không phải lượt này).
- `tsc` 0 lỗi phần mình (lỗi hiện hành ở `lib/review/*` là file phiên khác đang gõ dở lúc 22:36,
  ngoài vùng) · `npm test` **exit 0**.

## CHƯA VERIFY (N5)
- 1a trạng thái flows=[] bằng mắt — vẫn kẹt: cần tài khoản mới ⇒ logout, mà cookie localhost chung
  mọi port sẽ giết phiên đang chạy của cửa sổ khác (luật máu #2). Code emptyBlock đã sửa đúng chữ
  mock, chứng bằng đọc code.
- Theme Kem (light) 4 màn — token-level đúng, chưa chụp mắt.
- 1d nhánh CÓ ảnh render (nút bật + đẻ N trang) — flow test 0 ảnh render thật; logic thuần đã
  qua `handoff.test.ts` 20/20 cho phần rút ảnh.
- Hành vi drop tệp thật lên card 1b (CDP không giả được DataTransfer file).

## HÀNG ĐỢI (§V7)
| | |
|---|---|
| ✅ | Đối chiếu 4 màn (bảng trên) · sửa 4 file theo mock · 3/4 màn verify browser + 2 dây nối thật đo được (điều hướng 3D→2D · slide trắng thật) · tsc/test xanh |
| 🔴 GAP mới | [EMPTY-2-a] "Mở dự án từ máy" cần đường nạp tệp→dự án tại Gallery (nút đang khoá-có-lý-do) |
| 🟡 treo | 4 mục CHƯA VERIFY trên · căng mock-2-nút ↔ X2 ở màn 1c (đã thoả ở mức màn, TỔNG/Hoà liếc lại nếu muốn giữ nút "Dựng khối đầu tiên" trên card) |
| ⚠️ | Phiếu đứt đuôi ở VIỆC 3 "Tài khoản…" — chờ TỔNG dán phần còn lại nếu có |
