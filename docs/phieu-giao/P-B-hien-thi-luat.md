# PHIẾU P-B · HAI CHẾ ĐỘ HIỂN THỊ LUẬT (NGẮN ↔ ĐẦY ĐỦ) + TRỤC NGUỒN

> T soạn 16/08 theo khuôn `docs/HOP-DONG-PHOI-HOP-T.md` §3. Phiếu TỰ CHỨA.

## ⓪ TIỀN ĐỀ — trả lời TRƯỚC khi làm

1. TIỀN ĐỀ: *"`lib/review/` đã dựng đúng chốt 07/08 hai-lớp: `types.ts` phân `FindingLuat` vs `FindingGopy`, có `luat/cad.ts` · `luat/rules-3d.ts` · `luat/deck.ts` đủ 3 chặng và `gopy/index.ts` cho lớp AI."*
2. TIỀN ĐỀ: *"`lib/cad/standards/registry.ts` ĐÃ có `effectiveFrom`/`supersededBy` (khoảng dòng 87-95) + hàm lọc theo ngày mốc (khoảng 222-245) + `verified: boolean` + `note` + `region` + cơ chế đè rule trùng id."*
3. TIỀN ĐỀ: *"Trường giữ NGUYÊN VĂN điều khoản CHƯA có — `nguon` chỉ giữ mã số kiểu `QCVN 06:2022 §3.2`."*

→ Mỗi tiền đề: `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. **Bác bỏ thì DỪNG, báo T.**

## ① BỐI CẢNH NGÀNH
KTS lúc đang chạy deadline chỉ cần biết *"đỏ ở đâu, sửa cái gì"*. Nhưng lúc bảo vệ hồ sơ trước
chủ đầu tư hoặc thẩm duyệt thì phải **trích được nguyên văn điều khoản** — nói "app bảo thế" là
mất uy tín nghề. Một chế độ hiển thị không phục vụ nổi hai tình huống đó.

🔴 **Đây là chỗ rủi ro pháp lý cao nhất của cả phiên 15/08** (mục B6): nếu app nói sai một điều
khoản mà KTS xuất hồ sơ theo đó, hậu quả là thật.

## ② ĐỌC TRƯỚC
- `docs/CHOT-PHIEN-15-08-CAN-SOAT.md` mục **B1–B7** — nguồn gốc trọn vẹn của việc này.
- `docs/00-CHOT.md` mục **07/08 §12** — HAI LỚP KIỂM, *"trộn hai lớp là hỏng cả hai"*; và
  mục **15/08** *"kiểm chuẩn là việc của MÁY, AI chỉ góp ý"* (Hoà đã duyệt thành luật).
- `lib/review/types.ts` · `lib/cad/standards/registry.ts` · `lib/cad/standards/checker.ts`
  (docstring dòng 5-7: *chỉ đọc doc và trả về đề xuất, KHÔNG bao giờ tự sửa entity*).
- Hiến pháp giao diện: `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` +
  `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md`.

## ③ VÙNG FILE
✅ `lib/review/**` · `lib/cad/standards/types.ts` (chỉ THÊM trường, không đổi trường cũ) ·
   component hiển thị vi phạm (ReviewPanel + thẻ vi phạm)
⛔ KHÔNG đụng `components/settings/` (P-A đang ở đó) · KHÔNG đụng `lib/commands/` hay toolbar
   (P-C đang ở đó) · KHÔNG đụng `prisma/` · KHÔNG sửa nội dung 12 bộ luật ngành sẵn có

## ④ VIỆC
1. **Hai chế độ hiển thị** — MARKER `cheDoHienThi`.
   · **NGẮN**: mức (đỏ/vàng) + tên điều khoản + một câu + nút sửa.
   · **ĐẦY ĐỦ**: thêm **nguyên văn điều khoản** + cách sửa + ngày hiệu lực + cờ *"số liệu chưa
     đối chiếu bản gốc"* (đọc từ `verified` đã có).
   · Nhớ lựa chọn per-user, đổi được bất cứ lúc nào.
2. **Trục NGUỒN** — MARKER `loaiNguon`: `luat` (nhà nước) · `tieuChuan` (ngành) · `xuHuong`.
   ⚠️ **ĐỘC LẬP với trục RÀNG BUỘC `RuleBinding` đã có** — không gộp, không suy cái này ra cái kia:
   một tiêu chuẩn ngành có thể thành bắt buộc khi hợp đồng viện dẫn; một luật vẫn có điều khoản
   chỉ mang tính khuyến nghị.
3. **Trường nguyên văn** — MARKER `nguyenVan`, optional, additive. Rule cũ không có thì chế độ
   ĐẦY ĐỦ hiện thẳng *"chưa có nguyên văn — chỉ có số hiệu"*, **CẤM bịa, CẤM để AI diễn giải**.
4. **Ba rào an toàn (B6)** — viết thành comment luật ngay đầu file + test khoá:
   · AI chỉ được BÁO "có vẻ có bản mới, đây là link", **cấm tự sửa bộ luật**
   · cập nhật bộ luật luôn qua người duyệt
   · với loại `luat`: chỉ TÌM và TRÍCH NGUYÊN VĂN — **cấm diễn giải, cấm tóm tắt**
5. **KHÁC DẤU, KHÔNG KHÁC CHỖ**: luật → đỏ/vàng + dẫn điều khoản + nút sửa · góp ý → dấu Magic
   tím + chữ "gợi ý" + **không bao giờ chặn**. Cùng một bảng.
6. Test: `lib/review/hien-thi-luat.test.ts` — tối thiểu 15 ca, gồm ca "rule không có nguyên văn
   thì không được bịa" và ca "góp ý không bao giờ mang cờ chặn".

## ⑤ GIAO DIỆN — BẮT BUỘC
1. **Mock trong Claude Design TRƯỚC khi code.** Tool `DesignSync` (deferred — nạp bằng `ToolSearch`
   query `select:DesignSync`). Project **InteriorFlow · Design System**
   `b7dc14ba-1752-4821-8fc7-d519f737ac09`; nền `docs/IF-design-system-seed.html`.
2. Vẽ **THẺ VI PHẠM ở cả hai chế độ, cạnh nhau**, đủ **2 theme sáng + tối**.
3. Phải nhìn là phân biệt được ngay đâu là **luật** (cứng, dẫn nguồn) đâu là **góp ý** (mềm,
   không chặn) — đây là điểm nghiệm thu quan trọng nhất của mock.
4. Token: thang bo 6/10/14/20 + `--r-full`, concentric `rInner = max(4, rOuter − pad)`;
   màu qua CSS var, **cấm hardcode hex**; NT-8 icon luôn có nhãn.
5. Lưu `docs/mocks/mock-the-vi-pham-2-che-do.html` + đẩy lên Claude Design.

## ⑥ RÀNG BUỘC
- **KHÔNG git · KHÔNG tự mở dev server.**
- Mọi trường mới **optional/additive** — rule cũ phải chạy y nguyên, không migrate.
- Trung tính: ví dụ trong code/mock không mang tên khách thật.
- TRIẾT LÝ `docs/TRIET-LY-IF.md` — trích mã: **[N1]** human-centric (máy không được đoán thay
  người ở chỗ pháp lý) · **[Đ1]** nhìn vào trong trước (tận dụng `effectiveFrom`/`verified`/
  `region` đã có, cấm dựng cơ chế song song).

## ⑦ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
npm test -- lib/review
npm run soi:tu-dien
npm run soi:hinh-hoc
```
Dán **nguyên văn** kết quả vào báo cáo.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
## ⑦c HẠN DÙNG KẾT LUẬN — *"kết luận này hết đúng khi ... xảy ra"*

## ⑧ DÂY MÁY
Entry: **`hien-thi-luat-2-che-do`**. Agent **KHÔNG tự sửa** registry — T flip sau audit.

## Báo cáo
`docs/bao-cao-phien/2026-08-16-P-B-hien-thi-luat.md`, khuôn **6 phần**.

---

## ⑨ ĐỒ NGHỀ ĐƯỢC TRANG BỊ (T tra kho 16/08 — skill chính chủ Anthropic, plugin `design`)
Gọi bằng tool **Skill**, ví dụ `Skill(skill: "design:design-critique")`. Bắt buộc dùng, không phải tuỳ chọn:

· `design:design-critique` — tự chấm mock 5 trục trước khi nộp; trục **hierarchy** là then chốt: nhìn phát phải phân biệt luật (cứng) với góp ý (mềm)
· `design:ux-copy` — giọng cảnh báo. Câu luật phải nói được SỬA GÌ, không doạ suông; cấm jargon nội bộ lộ ra UI
· `design:accessibility-review` — **quan trọng đặc biệt ở phiếu này**: mức đỏ/vàng KHÔNG được chỉ dựa vào màu (người mù màu đọc không ra), phải có nhãn chữ + hình dạng kèm theo

⛔ **CẤM dùng `anthropic-skills:brand-guidelines`** — nó áp bộ nhận diện của **Anthropic**, trái
LUẬT TRUNG TÍNH của IF (sản phẩm bán ra, không đeo thương hiệu bên thứ ba). IF có token riêng ở
`app/globals.css`, đó là nguồn duy nhất.
⛔ **CẤM `theme-factory`/`canvas-design`** cho việc này — chúng sinh gu riêng, sẽ chọi hệ token IF.

**Thứ tự dùng:** đọc skill design-system/ux-copy TRƯỚC khi vẽ mock → vẽ mock → **tự chấm bằng
`design:design-critique` + `design:accessibility-review` TRƯỚC khi nộp** → sửa → mới code.
Báo cáo phải ghi rõ 2 skill chấm đó bắt được lỗi gì và đã sửa gì.
