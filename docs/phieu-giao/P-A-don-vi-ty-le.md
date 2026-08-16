# PHIẾU P-A · ĐƠN VỊ ĐO + TỈ LỆ CẤP TOÀN APP

> T soạn 16/08 theo khuôn `docs/HOP-DONG-PHOI-HOP-T.md` §3. Phiếu TỰ CHỨA — không cần hỏi lại T.

## ⓪ TIỀN ĐỀ — trả lời TRƯỚC khi làm, đúng một dòng mỗi ý

1. TIỀN ĐỀ: *"IF hiện KHÔNG có cài đặt đơn vị đo cấp app — `unitSystem`/metric-imperial grep = 0, mm gõ cứng rải rác (vd `lib/idfc-import/chuan-net.ts:1202` `donVi:'mm'`), `components/settings/` có 7 màn và không màn nào về đơn vị."*
2. TIỀN ĐỀ: *"Tỉ lệ hiện chỉ tồn tại ở khung tên/xuất PDF (`'1:50'` trong export-checks) và nút 'Tỉ lệ' trong thanh 2D — không có cài đặt cấp app."*

→ Mỗi tiền đề trả lời `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng.
**Bác bỏ thì DỪNG, báo T.** Làm đúng một phiếu sai vẫn là hỏng việc.

## ① BỐI CẢNH NGÀNH
KTS nội thất Việt Nam làm hồ sơ bằng mm, nhưng dự án cho khách nước ngoài / catalogue hãng nhập
thường dùng inch-feet. Nay IF ép mm ở mọi chỗ nhập và mọi chỗ hiện — người dùng phải tự quy đổi
trong đầu, và đó là chỗ đẻ ra sai số chết người trong bản vẽ thi công. Tỉ lệ cũng vậy: dãy tỉ lệ
chuẩn ngành (1:1 · 1:2 · 1:5 · 1:10 · 1:20 · 1:25 · 1:50 · 1:100 · 1:200) là quy ước ISO, in ra
tỉ lệ lẻ kiểu "1:47" là hồ sơ bị trả về (đã bắt được lỗi này 11/08 khi mở `layout.pdf` bằng mắt).

## ② ĐỌC TRƯỚC
- `docs/00-CHOT.md` — tìm mục **15/08** *"ĐƠN VỊ ĐO + TỈ LỆ PHẢI CHỈNH ĐƯỢC Ở CẤP TOÀN APP"* và
  mục **A7** trong `docs/CHOT-PHIEN-15-08-CAN-SOAT.md`: **ràng buộc cứng — LƯU TRỮ LUÔN LÀ mm,
  chỉ đổi lớp HIỂN THỊ và lớp NHẬP.**
- `docs/CHUAN-DAU-RA-NGHE.md` — mục dãy tỉ lệ chuẩn.
- `components/settings/` (7 màn hiện có) — học khuôn màn cài đặt đang dùng, KHÔNG chế khuôn mới.
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) +
  `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..4) — **hiến pháp giao diện, là cửa nghiệm thu.**

## ③ VÙNG FILE — ngoài vùng là vi phạm dù sửa đúng
✅ `components/settings/**` · `lib/units/**` (tạo mới) · `app/settings/**`
✅ chỗ HIỂN THỊ số đo trong `components/cad/` chỉ khi đọc qua hàm format mới
⛔ KHÔNG đụng `lib/cad/model.ts` schema · KHÔNG đụng `prisma/` · KHÔNG đụng `lib/commands/` ·
   KHÔNG đụng `components/render-studio/` (phiên P-C đang ở đó)

## ④ VIỆC
1. `lib/units/index.ts` — MARKER `unitSystem`. Một nguồn: `formatLength(mm, opts)` +
   `parseLength(chuỗi người gõ) → mm`. Hỗ trợ **mm · cm · m · inch · feet-inch**. Lưu trữ mm bất biến.
2. `lib/units/scale.ts` — MARKER `SCALE_CHUAN`. Dãy tỉ lệ chuẩn ISO; hàm chọn tỉ lệ gần nhất
   **trong dãy** (cấm sinh tỉ lệ lẻ), hàm kiểm một tỉ lệ có hợp chuẩn không.
3. Lưu lựa chọn per-user (localStorage cùng khuôn các cài đặt sẵn có — **không thêm bảng DB**).
4. **MÀN GIAO DIỆN: `Cài đặt › Đơn vị & Tỉ lệ`** — xem ô ⑤.
5. Test: `lib/units/units.test.ts` — tối thiểu 20 ca gồm round-trip mm→hiện→gõ lại→mm, feet-inch
   dạng `5'6"`, và tỉ lệ lẻ bị từ chối.

## ⑤ GIAO DIỆN — BẮT BUỘC, KHÔNG PHIÊN NÀO ĐƯỢC KHÔNG CÓ MẶT
> Luật Hoà chốt 16/08. Phiên không có mặt = phiên hỏng, dù code đúng.

1. **Vẽ mock TRONG Claude Design trước khi code.** Tool là `DesignSync` (tool deferred — nạp bằng
   `ToolSearch` query `select:DesignSync`). Project: **InteriorFlow · Design System**
   `b7dc14ba-1752-4821-8fc7-d519f737ac09`. Nền tham chiếu: `docs/IF-design-system-seed.html`
   (token thật lấy từ `app/globals.css`).
2. Mock phải có **ĐỦ 2 THEME sáng + tối**, icon lucide thật, màu qua CSS var — cấm hardcode hex.
3. Nội dung màn: chọn đơn vị hiển thị · chọn cách nhập · dãy tỉ lệ chuẩn với tỉ lệ mặc định ·
   **ô xem trước sống** (đổi đơn vị thì con số mẫu đổi ngay tại chỗ).
4. Theo hiến pháp: NT-8 icon luôn có nhãn · KB-1 khuôn nút chung (`components/ui/ToolbarChip.tsx`) ·
   thang bo 6/10/14/20 + `--r-full`, concentric `rInner = max(4, rOuter − pad)` · dùng
   `var(--tap)` cho cỡ chạm, **cấm đẻ số ngoài token**.
5. Lưu mock vào `docs/mocks/mock-cai-dat-don-vi-ty-le.html` **và** đẩy lên Claude Design.
6. Code phải giống mock — không sáng tác thêm khi code.

## ⑥ RÀNG BUỘC
- **KHÔNG git** (không commit/stash/checkout — T lo). **KHÔNG tự mở dev server.**
- Ngôn ngữ UI song ngữ VI/EN theo hệ i18n sẵn có; cấm chữ "tự động" (luật thao tác).
- Trung tính tuyệt đối: không brand/tên khách trong UI hay ví dụ.
- TRIẾT LÝ `docs/TRIET-LY-IF.md` — trích mã điều khoản vào báo cáo: **[N2]** đơn giản ngoài ·
  sâu trong · **[Đ2]** nhìn vào trong trước (dùng lại khuôn settings sẵn có, cấm đẻ khuôn mới).

## ⑦ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
npm test -- lib/units
npm run soi:tu-dien
npm run soi:hinh-hoc
```
Cả bốn phải sạch. Dán **nguyên văn** kết quả vào báo cáo.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng phải ghi "không có"
Điều gì đang suy luận chứ không đo · file nào chưa đọc mà có thể lật kết luận · hai nguồn mâu
thuẫn thì nêu CẢ HAI, không chọn hộ T.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ: *"kết luận này hết đúng khi ... xảy ra"*.

## ⑧ DÂY MÁY
Entry registry: **`don-vi-ty-le-toan-app`**. Agent **KHÔNG tự sửa** `scripts/frontier-registry.mjs`
— T flip sau khi audit.

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-A-don-vi-ty-le.md` theo khuôn **6 phần** (`docs/CLAUDE.md`).

---

## ⑨ ĐỒ NGHỀ ĐƯỢC TRANG BỊ (T tra kho 16/08 — skill chính chủ Anthropic, plugin `design`)
Gọi bằng tool **Skill**, ví dụ `Skill(skill: "design:design-critique")`. Bắt buộc dùng, không phải tuỳ chọn:

· `design:ux-copy` — nhãn và câu chữ trên màn cài đặt (ngắn, hành động trước, cấm jargon)
· `design:accessibility-review` — **đây là lỗ ❌ đang mở của IF** (STATUS.md ghi "a11y audit 1 lượt" chưa làm); màn này nhỏ, làm chuẩn ngay từ đầu rẻ hơn vá sau
· `design:design-critique` — khung 5 trục chính chủ (ấn tượng đầu · usability · hierarchy · consistency · accessibility) để TỰ CHẤM mock trước khi nộp

⛔ **CẤM dùng `anthropic-skills:brand-guidelines`** — nó áp bộ nhận diện của **Anthropic**, trái
LUẬT TRUNG TÍNH của IF (sản phẩm bán ra, không đeo thương hiệu bên thứ ba). IF có token riêng ở
`app/globals.css`, đó là nguồn duy nhất.
⛔ **CẤM `theme-factory`/`canvas-design`** cho việc này — chúng sinh gu riêng, sẽ chọi hệ token IF.

**Thứ tự dùng:** đọc skill design-system/ux-copy TRƯỚC khi vẽ mock → vẽ mock → **tự chấm bằng
`design:design-critique` + `design:accessibility-review` TRƯỚC khi nộp** → sửa → mới code.
Báo cáo phải ghi rõ 2 skill chấm đó bắt được lỗi gì và đã sửa gì.
