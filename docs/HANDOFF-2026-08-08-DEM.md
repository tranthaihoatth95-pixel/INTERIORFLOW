# HANDOFF — phiên "Bàn giao tất cả 2026" gần hết context, 08/08 đêm

> Đọc file này TRƯỚC nếu tiếp nối đúng phiên điều phối này. Đây không phải STATUS.md (Hoà tự
> quản file đó) — đây là sổ tay kỹ thuật để phiên sau không phải dò lại từ đầu.

## Trạng thái máy đo lúc rời phiên

```
tsc            0 lỗi
check-chot     0 đỏ / 0 vàng
npm test       0 fail (chạy full suite lần gần nhất)
server 3000    sống (đã rm -rf .next + restart sạch sau sự cố cache — xem mục "BẪY" bên dưới)
commit hôm nay ~20 commit, 8 CHƯA PUSH (git log origin/main..main)
working tree   sạch (trừ 2 agent đang chạy dở — xem "ĐANG CHẠY")
```

## ĐANG CHẠY lúc rời phiên (2 agent, chưa có kết quả)

Cả 2 phóng cùng lúc, vùng file KHÔNG giẫm nhau:
1. **Port 3 mock "2D Kỹ thuật"** vào chặng Thiết kế 2D — đích: `Navigator.tsx` ·
   `AppLogoMenu.tsx` · `CadStageScreen.tsx` · `CadEditor.tsx` · `CadToolbar.tsx` ·
   `CadToolbelt.tsx` · `RevitSummaryPanel.tsx` · `PlanPresentPanel.tsx` · `CadInspectorPages.tsx`.
2. **Port mock Vẽ 3D** (`mock-if-ve3d.html`) — đích: `Command3DPanel.tsx` · `Viewport3D.tsx` ·
   `Object3DTree.tsx` · `Object3DInspector.tsx`.

**Khi 2 agent này báo về:** kiểm độc lập theo đúng quy trình cả phiên đã làm — đọc diff, chạy
lại test/tsc, verify browser (server đang chạy sẵn 127.0.0.1:3000, demo@if.local/demo1234), rồi
mới `git add` đúng file trong danh sách cho phép + commit. KHÔNG tin báo cáo suông (luật N1).

## BẪY đã gặp — đọc trước khi phóng agent tiếp

**Khi ≥3 agent chết cùng lúc giữa chừng (hết hạn mức tuần), dev server có thể bị hỏng cache
webpack thật** — biểu hiện: lỗi runtime kiểu `X is not defined` dù code trên đĩa đúng cú pháp
và `tsc` sạch 0 lỗi. Reload trình duyệt KHÔNG đủ. Cách sửa: `preview_stop` server cũ →
`rm -rf .next` → `preview_start` lại → đợi ~8s cho compile xong rồi mới verify tiếp. Đã xảy ra
đúng 1 lần hôm nay, đã sửa xong, cơ chế ghi rõ trong docstring commit `d89f6f1`.

**Hạn mức tuần (weekly limit) là giới hạn tài khoản, reset cố định giờ đã biết** — nếu agent
chết hàng loạt với lỗi `"You've hit your weekly limit"`, đó không phải bug, chỉ chờ reset. Xem
`docs/HOI-SINH-SAU-RESET-2026-08-11.md` (bản đồ hồi sinh lần trước, cùng cơ chế) để biết cách
phóng lại đúng đề bài cho agent đã chết dở.

## Việc ĐÃ XONG hôm nay (tóm tắt, chi tiết xem `git log`)

- **Đối chiếu 42 spec** ↔ code (4 agent đọc tay) → `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` —
  kho quặng chính cho việc tiếp theo, đọc trước khi giao việc mới tránh xây lại thứ đã có.
- **8 mục "kho chưa mở"** đã nối dây xong: BuildOp union (9 hàm dựng hình sống) · Vitals
  docContext · eyedropper+VCB · xuất V-Ray/D5+lux · Bảng việc (Kanban) · File Manager desktop
  idioms · brief nạp PDF · LinkedAsset recipe.
- **4 lỗi UI Hoà soi trực tiếp** đã sửa: kính xám đục (`.vitals-pop`) · nút "Dựng ảnh" trùng
  công tắc (đổi thành "Dựng khối · Magic", disabled chờ spec) · `ToolDock3D` port đúng mock
  (hover thật) · `StageSwitcher` hover màu chữ.
- **Port 3 mock khác**: mood-collab-g2 (Node canvas + bắt được bug hex Tailwind trá hình trong
  `NoteNode.tsx`) · BOQ (cột tuỳ chỉnh 6 kiểu + click-to-jump lỗi) · gap "Thêm vật liệu mới"
  (nối đúng `MaterialFormModal`, đã kiểm quyền API an toàn).
- **Phiên Thư viện** (song song, độc lập): `.idfc` v3 kind `preset` · sửa bug thẻ "5a" (grid
  track tự co sai) · test `idfc-store.ts` 21/21 · xác nhận VIỆC 5 (gộp thư viện) đóng, không
  cần làm gì thêm · **quyết KHÔNG port** mock quả cầu vật liệu (3 chốt sau đè lên mock cũ,
  lý do đầy đủ trong `docs/M-THU-VIEN-OUT.md` VÒNG 4).
- **Sổ đã sửa**: `README-mocks.md` (mục HIỆN HÀNH lỗi thời, đính chính) · `00-CHOT.md` (nhiều
  dòng quyết định mới) · `docs/HOI-SINH-SAU-RESET-2026-08-11.md`.

## Việc CHƯA làm — ước lượng quy mô cho "phần 3" (Hoà hỏi mấy phiên agent nữa)

Đây là ước lượng thô dựa trên độ phức tạp quan sát được hôm nay (mỗi "phiên điều phối" ~
phóng 4-8 agent song song 1-2 đợt, mỗi agent ~15-60 phút thực tế). KHÔNG phải cam kết chính xác.

| Việc | Vì sao chưa làm | Ước lượng |
|---|---|---|
| **3 editor hồ sơ** (Bảng vật liệu A3 · Văn bản · Video timeline) | Chưa khởi công — cần `docType` union + màn chọn H4 trước, rồi mới xây từng editor | **~3 phiên** (A3 nhẹ nhất — tái dùng MaterialSphere/PBR vừa xong hôm nay; Văn bản vừa — cần template+biến; Video nặng nhất — cần data model shot/timeline + xuất MP4) |
| **Chặng 0 Ý tưởng** | Cần Hoà chốt làm hay bỏ backlog trước — 3 spec khác đang tham chiếu nó như đã tồn tại | **~1-2 phiên** nếu duyệt (tái dùng Gu Engine đã có) |
| **Magic đường B** | Đã chốt hướng, CHƯA có spec (luật CLAUDE.md #2 cấm code khi chưa có spec) | **~0.5 phiên soạn spec + ~2 phiên code** (nay đã có BuildOp union mở sẵn — hạ tầng dựng hình đã sẵn sàng nhận) |
| **Cộng tác thật** (comment có projectId, @mention, "Việc của tôi", khách qua link) | Cần model Prisma mới + API + UI, hiện chỉ là công cụ dev nội bộ | **~2 phiên** |
| **Cấu kiện tham số ⑥** (cầu thang, trần thả, tủ bếp module) | Chờ BuildOp union — **nay đã mở**, có thể làm luôn | **~1-2 phiên** |
| **2 câu Hoà cần quyết** (ChatMessage có projectId? · Neufert có ship trong repo?) | Quyết định, không phải code | **0 phiên agent** — chỉ cần Hoà trả lời, code theo sau ~0.5 phiên mỗi câu |
| **Dọn lịch sử git** | Cần Hoà chạy tay lúc rảnh (`scripts/don-git-lich-su.sh`) | **0 phiên agent** |

**Tổng thô: ~9-12 phiên điều phối nữa** để đóng hết "phần 3", giả sử không bị chặn bởi quyết
định của Hoà. Nếu Hoà trả lời nhanh 2 câu quyết + chốt chặng 0, có thể rút ngắn vì không phải
dừng giữa chừng chờ.

## Cách phiên sau nối lại đúng nhịp

1. Đọc `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` trước khi giao bất kỳ việc mới nào — tránh lặp
   lỗi "xây lại thứ đã có" đã xảy ra 4 lần trong ngày trước phiên này.
2. Kiểm 2 agent đang chạy dở (mục "ĐANG CHẠY" ở trên) trước khi phóng thêm — đừng chồng việc.
3. Khi phóng agent mới: LUÔN dặn "server đang chạy sẵn 127.0.0.1:3000, đừng tự khởi server
   mới" — nhiều agent hôm nay tự ý mở server thứ 2 gây xung đột `.next` (luật §0aa).
4. Sau mỗi agent về: đọc diff thật (`git diff`) trước khi tin báo cáo, chạy lại test/tsc bằng
   tay, verify browser nếu đổi UI — quy trình đã chứng minh bắt được ít nhất 3 bug thật hôm nay
   mà agent tự báo "xong" (hex Tailwind trá hình, lỗ hổng bộ ký tự VCB, gap admin-permission).
5. Chưa push — Hoà cần chạy `git push origin main` khi sẵn sàng.
