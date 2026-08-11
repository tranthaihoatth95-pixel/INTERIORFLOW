# HANDOFF — KIỂM TỔNG + CHỐT PHIÊN 11/08/2026 (kiến trúc sư trưởng)

> Gom 2 nguồn thành 1 sổ: ① kết quả KIỂM TRA/ĐÁNH GIÁ/CHECKLIST của phiên điều phối
> (Claude, 11/08 chiều — mọi dòng kiểm bằng lệnh thật, không chép báo cáo) và ② các CHỐT MỚI
> từ phiên Figma/Codex 11/08 sáng-trưa mà Hoà dán lại (Render Studio · 5 stage dựng 3D ·
> bộ tool Blender+SketchUp · Thẻ gu · gom hàng đợi 5 cụm · sửa nền canvas).
>
> Đọc kèm: `docs/HANDOFF-CODEX-2026-08-11.md` (sổ của phiên Codex, KHÔNG đụng file đó) ·
> `STATUS.md` · `docs/00-CHOT.md`.

---

## PHẦN 1 · TRẠNG THÁI MÁY LÚC BÀN GIAO (kiểm 11/08 chiều)

```
tsc --noEmit     0 lỗi (chạy lại tay, không tin báo cáo cũ)
server 3000      sống, PID 28293 (đúng như HANDOFF-CODEX ghi)
worktree         chỉ còn repo chính (p7 + p3-mock đã dọn)
HEAD             fc3036d "docs: record staged 3d build mock"
chưa push        (theo luật — chờ lệnh Hoà)
```

**Dirty chưa commit (6 file)** — là cụm sửa nền canvas, xem PHẦN 3 mục G:
`STATUS.md` · `app/settings/_components/AppearanceCard.tsx` · `app/settings/_lib/local-state.ts`
· `app/settings/_lib/wallpaper.ts` · `components/BottomToolbar.tsx` · `components/FlowCanvas.tsx`

**Untracked**: `AGENTS.md` (của Codex, không đụng) · `docs/HANDOFF-CODEX-2026-08-11.md` ·
4 mock `docs/mocks/mock-*2026-08-09/10.html` · file này.

---

## PHẦN 2 · CHECKLIST KIỂM — việc giao 09/08 đều VỀ ĐÍCH dù 2 agent chết vì hạn mức tuần

| # | Hạng mục | Kết quả kiểm (bằng lệnh) |
|---|---|---|
| 1 | Mock Ý tưởng `mock-if-y-tuong-2026-08-09.html` | ✅ 33KB · nhãn chặng ĐÚNG bản chốt (Thiết kế 2D/3D · Trình chiếu) · 2 theme thật (data-theme + phím D) · 0 hex TTT |
| 2 | Mock Bảng vật liệu A3 `mock-trinh-materialA3-2026-08-09.html` | ✅ như trên (26KB) |
| 3 | Mock Văn bản `mock-trinh-vanban-2026-08-09.html` | ✅ như trên (25KB) |
| 4 | Màn chọn hồ sơ H4/V6 | ✅ `PresentDocTypePicker.tsx` ĐÃ VÀO MAIN; `TODO(H4)` trong `PresentNavigator.tsx` đã gỡ; có thêm mock tablet 10/08 |
| 5 | "Kho chưa mở" (14 mục sổ 08/08) | ✅ 11/14 đã nối dây thật (grep từng mục); còn 3 — xem PHẦN 4 |
| 6 | Nhánh rác | 🟡 3 nhánh local `worktree-agent-*` mồ côi — vô hại, dọn lúc rảnh |

**Sổ sách còn thiếu (chưa sửa, theo lệnh "không làm thêm"):**
- `README-mocks.md` CHƯA có dòng cho 3 mock 09/08 (mock tablet 10/08 đã ghi) — trái luật append 1 dòng/mock.
- Mock tablet 10/08 dùng nhãn "Trình bày" (3 chỗ) — bản chốt là "Trình chiếu".
- Cả 4 mock chưa soi bằng mắt 2 theme trên browser (mới verify mức đọc CSS).

---

## PHẦN 3 · CHỐT MỚI PHIÊN 11/08 (Figma/Codex — Hoà duyệt trực tiếp trong chat)

### A · Render Studio — đặt TRƯỚC chuỗi tạo sinh (commit `dcd1712`)
Vai trò chốt: **scene đã kiểm → V-Ray/D5 handoff → ảnh có pass → Visual Production**.
Có: kiểm hình khối/vật liệu/đèn/camera · chọn nháp/cuối · pass Beauty/Alpha/Material ID/
Object ID/Depth · gói bàn giao · lịch sử revision. Hiện là **mock/spec giao diện trên Figma,
CHƯA nối renderer thật** — đừng đọc nhầm thành "đã có render engine".

### B · Mode Dựng 3D tách 5 STAGE, luôn nối về Render Studio (commit `fc3036d`)
1. Khung không gian — tường, sàn, trần
2. Hoàn thiện — ốp, khe, nẹp, bề mặt
3. Nội thất — fit-out và đồ rời
4. Ánh sáng & camera
5. Render Studio — recipe, pass, output

**Cơ chế tool 2 kích thước**: bản **mini nằm trên kệ node** (gọi nhanh, không chiếm chỗ,
không che khung nhìn) · **kéo thả ra canvas → bung cửa sổ đầy đủ**. Cột phải hiện dữ liệu
mỗi stage đã tích luỹ; nút chuyển sang Render Studio luôn hiện.

### C · Bộ tool Dựng 3D: "tay SketchUp, cấu trúc Blender" (Hoà duyệt hướng)
- KHÔNG bê nguyên rừng lệnh Blender. Học SketchUp ở thao tác trực tiếp; học Blender ở tách
  Object mode (đặt/sắp cảnh) ↔ Edit mode (sửa hình học).
- 7 nhóm tool: Điều hướng & chọn · Dựng khung · Biến đổi · Hoàn thiện · Nội thất ·
  Ánh sáng & camera · Kiểm & bàn giao. **Dock chỉ mang 8–10 lệnh dùng liên tục**; thao tác
  sâu mở từ kệ mini hoặc chuột phải thành cửa sổ đầy đủ.
- **Phím tắt đề xuất** (trùng SketchUp để học phí ≈ 0): Space chọn · W tường · P Push/Pull ·
  M move · Q xoay · S scale · B bề mặt/vật liệu · L đèn · C camera · T đo · O orbit ·
  H pan · F vừa khung · **Tab mở/đóng "Sửa hình"** · X/Y/Z khoá trục khi transform ·
  Shift giữ trục suy luận · Alt/Option tạo bản sao · gõ số SAU thao tác (`1200`, `30°`,
  `3x2`, `/3`).
- **Chuột phải theo đối tượng**, không menu chung: nền trống / tường / sàn-trần / đồ nội thất
  / mặt / đa chọn — mỗi loại một menu riêng (chi tiết trong chat log 11/08, đã thể hiện ở mock).
- **Ranh giới Edit mode**: Tab "Sửa hình" CHỈ mở cho tường, mặt phẳng, primitive, component IF.
  Model import từ Revit/3ds Max/Blender chỉ cho transform + binding vật liệu + visibility +
  metadata — **không giả vờ mesh editor native**.
- Thứ tự làm: Khung không gian → Hoàn thiện → Nội thất → Ánh sáng & camera → Edit hình sâu.

### D · Gom hàng đợi thành 5 CỤM (thay vì chạy màn rời)
1. **Lõi thiết kế 2D→3D** — ưu tiên số một, quyết định IF "dùng được" hay không.
2. **Cấu kiện & Master Library** — type/instance, provenance, BOQ; Library là nguồn dữ liệu
   không phải kho ảnh.
3. **Render & sản xuất hình ảnh** — Scene → recipe → V-Ray/D5 → pass → ảnh/video; cùng đọc
   MỘT scene, không sinh bản sao rời.
4. **Trình bày & đầu ra** — chỉ mở loại hồ sơ thật, editor chưa có thì khoá rõ lý do.
5. **Độ ổn định dùng nội bộ (R1)** — máy sạch, backup/khôi phục, GPL DWG, trung tính,
   hiệu năng viewport, checklist phát hành.

Vitals chạy NGANG cả 5 cụm, không thành dự án riêng. Sprint: 1 lõi 3D → 2 cấu kiện–library
→ 3 render–output → 4 Present + release hardening.

### E · Vitals cấp không gian — THẺ GU NHÁP (Hoà chốt kiến trúc)
Prompt chỉ là bản DIỄN GIẢI máy đọc từ thẻ, không phải nơi chứa ý tưởng rời.
Luồng: brainstorm/moodboard → duyệt nguồn → Vitals chưng cất **Thẻ gu nháp** → người chỉnh/
duyệt → đưa vào FlowRender → sinh recipe theo scene thật.

**8 lớp thông tin bắt buộc mỗi thẻ**: ① Ý đồ (1 câu) · ② Hình minh hoạ CÓ NGUỒN (3–8 ảnh,
mỗi ảnh ghi đóng góp gì) · ③ Ngôn ngữ không gian · ④ Màu sắc (palette + TỶ LỆ dùng) ·
⑤ Vật liệu (liên kết matId khi đã chọn thật) · ⑥ Ánh sáng · ⑦ Khung hình render (góc máy,
cao độ mắt, lens, thời điểm) · ⑧ Ràng buộc & độ tin cậy (đã chốt vs giả định).

**3 đầu ra từ 1 thẻ**: Design brief (người đọc duyệt) · Render prompt (máy tạo sinh) ·
Render recipe (vật liệu–đèn–camera cho FlowRender/V-Ray/D5).

**Trạng thái thẻ**: Đang gom ý → Nháp → Đã duyệt → Đã áp vào scene → Cần xem lại (khi ảnh/
vật liệu/mặt bằng đổi).

### F · Đoạn giới thiệu app chốt dùng (intro/marketing)
> InteriorFlow là không gian làm việc thống nhất cho thiết kế nội thất — từ ý tưởng, bản vẽ
> 2D, dựng không gian 3D đến hồ sơ trình bày. Mọi thứ cùng dùng một nguồn dữ liệu: cấu kiện,
> vật liệu, ánh sáng và đồ nội thất cập nhật xuyên suốt thay vì xuất–nhập giữa nhiều phần mềm.
> Thư viện thông minh giúp tìm, đóng gói và áp dụng asset có đủ thông số, hình ảnh, dữ liệu
> BOQ. Công cụ chuyên sâu chỉ xuất hiện đúng lúc cần. Vitals hỗ trợ kiểm tra, gợi ý, điều
> phối — nhưng người thiết kế luôn quyết định cuối cùng.

### G · Nền canvas các chặng (đang DỞ — 6 file dirty)
Hoà chốt: **không hình nền trang trí/ảnh/aura** ở mọi chặng, nhưng canvas **PHẢI có pattern
kỹ thuật** (dot/line grid rất nhẹ theo token theme) để định hướng không gian. Phiên Codex đã
tắt QUÁ TAY cả pattern → lỗi "PATTERN CANVAS ĐÂU?" đang mở. Minimap Tổng quan đã lên góc
phải trên; toolbar đáy đã giới hạn theo bề rộng canvas (Codex báo đã sửa + verify, tsc PASS)
— nhưng cả cụm **CHƯA COMMIT**. Chi tiết từng file: `HANDOFF-CODEX-2026-08-11.md` §7.

---

## PHẦN 4 · VIỆC TIẾP THEO — theo thứ tự

1. 🔴 **Trả pattern canvas trung tính** (dot/line grid nhẹ, token theme, không gradient/ảnh/
   quầng tím) vào `wallpaper.ts` + `FlowCanvas.tsx`; sửa câu "nền trơn" trong STATUS.md thành
   "pattern canvas trung tính"; kiểm light/dark + nhiều mức zoom → rồi mới commit cụm 6 file.
2. **Sổ sách mock**: thêm 3 dòng README-mocks cho mock 09/08 · đổi "Trình bày"→"Trình chiếu"
   trong mock tablet 10/08 · soi mắt 2 theme cả 4 mock.
3. **3 kho-chưa-nối còn lại**: ① nút xuất PNG sequence (`captureSequence` kẹt ở route bench
   tạm `dev-bench-3d-2`) · ② `lib/commands/registry.ts` chưa điền icon/surfaces · ③ Thư viện
   + File Manager vẫn đọc mock (`LIBRARY_DATA_IS_MOCK=true`).
4. **M1 3D theo STATUS.md** — nay đi theo khung 5 stage (PHẦN 3.B) + bộ tool/phím tắt (3.C):
   same Doc, wall/floor/ceiling/room, transform/snap/hotkey, Library contract.
5. **Thẻ gu nháp**: từ chốt 3.E → cần spec hoá (schema 8 lớp + 3 đầu ra + trạng thái) trước
   khi code, theo luật "không spec không code".
6. Material/Element Impact MVP → Present Magic + BOQ form/Magic → R1 hardening (giữ nguyên
   thứ tự HANDOFF-CODEX §9).

## PHẦN 5 · LUẬT NHẮC LẠI CHO PHIÊN SAU

- Không hardcode thương hiệu; Brand Kit thuộc dự án. Không hai Vitals. Không nút giả.
- Không ép pipeline — mọi chặng mở độc lập. Hatch tham chiếu `materialId`, không thành kho
  vật liệu thứ hai.
- Không đụng file untracked của người khác (`AGENTS.md`, handoff Codex).
- Không push khi chưa có lệnh. Mỗi việc lớn = 1 commit, tsc + test trước khi sang việc kế.
- Render Studio/5 stage hiện là MOCK Figma — tài liệu nào nói "đã có render" là nói quá.
