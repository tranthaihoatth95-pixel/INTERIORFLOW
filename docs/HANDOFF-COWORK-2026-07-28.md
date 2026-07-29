# HANDOFF — Cowork → Claude Code / Hoà, 2026-07-28

> Theo đúng ranh giới đã tự đặt (`docs/IF1_IF2_BIGPICTURE.md`, 20/07: *"Cowork ngừng đụng vào repo
> trực tiếp — Hoà + Claude Code sở hữu việc build IF1/IF2 từ nay"*), Cowork chỉ sửa **file tài
> liệu** (không phải code sản phẩm) trong phiên này, sau khi Hoà duyệt qua lệnh "tiến hành" (2 đợt):
>
> **Đợt 1:**
> 1. `docs/IF-MASTER-BLUEPRINT.md` — gỡ Phần C + Phần E (trùng lặp/lệch với Tree), thay bằng con trỏ.
> 2. `docs/IF-MASTER-TREE.md` — thêm ngoại lệ khẩn cấp vào luật E3 (bản "flexible" thay cho bỏ hẳn).
> 3. `docs/LICENSE-NOTES.md` (mới) — thay `archive/LICENSE-NOTES.md`, áp bản nháp đã duyệt.
>
> **Đợt 2 (lệnh "lưu và thay thế... chốt đổi tên"):**
> 4. Đổi tên `docs/IF-MASTER-BLUEPRINT.md` → **`docs/IF-ARCHITECTURE-COMPASS.md`**; `docs/IF-MASTER-TREE.md`
>    → **`docs/IF-FEATURE-TREE.md`** — hết trùng chữ "MASTER". Tên cũ giữ lại dạng file chuyển
>    hướng 1 dòng (không xoá — versioning discipline), phòng file khác trong repo còn trỏ tên cũ.
> 5. Đổi tên persona **KIÊN → TRỤ** trong `QUY_TRINH_SPIRAL_v1.md` (mục 4 + mục 5) và
>    `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` (§5C) — giữ nguyên KIẾN, không đụng file danh tính của
>    nó, vì KIÊN chỉ là 1 nhãn checklist nhẹ còn KIẾN đã có cả file riêng.
> 6. Chốt CẦN HOÀ QUYẾT #6 trong `docs/IF-FEATURE-TREE.md` (Q7) — làm tiếp 3 tool Render đắt nhất,
>    NHƯNG phải khám/review toàn bộ tool Render trước, nghiên cứu kỹ, ra sản phẩm hệ thống — chưa
>    được nhảy thẳng vào code 3 tool đó.
>
> **Chưa đụng gì vào code** (`.ts`/`.tsx`/CI config/`package.json`) — đúng việc của Claude Code,
> cần chạy test + tsc mà Cowork không có quyền/hạ tầng để verify. Danh sách dưới đây là việc CẦN
> LÀM TIẾP, xếp theo đúng độ ưu tiên đã thống nhất.

---

## 1. Chèn vào Day 1 kế hoạch ship IF1 (rẻ, ~0 chi phí, nên làm trước khi ship)

### 1.1 Trang "Third-party licenses" trong app

Nội dung cần có (đã viết sẵn nội dung pháp lý ở `docs/LICENSE-NOTES.md` mục 1-2, chỉ cần lên UI):

```
Third-party licenses / Giấy phép bên thứ ba
─────────────────────────────────────────
@mlightcad/libredwg-web (based on GNU LibreDWG)
License: GPL-3.0
Copyright © MLight Lee, GNU LibreDWG contributors, FSF
[Full GPL-3.0 text — nhúng nguyên văn từ https://www.gnu.org/licenses/gpl-3.0.txt]
Written offer: Corresponding Source (tarball @mlightcad/libredwg-web@0.7.7 + wasm build script)
có tại: [link repo GitHub public hoặc endpoint tải]

jszip — used under the MIT license (dual-licensed MIT OR GPL-3.0-or-later; IF chọn nhánh MIT)

sharp — Apache-2.0, bundles libvips (LGPL-3, dynamic link — không lây copyleft)

Be Vietnam Pro — SIL Open Font License 1.1 (public/fonts/OFL.txt)
```

Vị trí đề xuất: route mới `/settings/licenses` hoặc `/about/licenses`, link từ trang Cài đặt
(`⌘,`). Việc rẻ, không cần logic — chỉ cần 1 trang tĩnh + nhúng đúng file text.

### 1.2 CI gate chặn dependency copyleft mới

```bash
# thêm vào package.json scripts hoặc bước CI riêng
npx license-checker-rseidelsohn --production \
  --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;CC0-1.0;Unlicense;Python-2.0;BlueOak-1.0.0' \
  --excludePackages '@mlightcad/libredwg-web' \
  # excludePackages: dep GPL DUY NHẤT đã biết + chấp nhận, không cho thêm dep copyleft khác lọt vào
```

Chạy 1 lần thủ công trước để xem baseline hiện tại có sạch không (`RESEARCH-DWG-LICENSE.md` §6
nói đã rà 34 dep trực tiếp — chưa rà transitive), rồi đưa vào CI.

---

## 2. Sau khi ship IF1 xong (1 sprint tới)

### 2.1 Di trú DWG parse sang server-side (đường A+D, đã có kế hoạch chi tiết)

Toàn bộ kế hoạch `file:dòng` đã có sẵn ở `docs/RESEARCH-DWG-LICENSE.md` §3.3 (5 bước, đã verify
chạy nhanh hơn bản browser hiện tại). Tóm tắt bề mặt thay đổi: 2 file sửa (`lib/cad/dwg.ts` +
route mới `app/api/cad/dwg/route.ts`), 1 file xoá (`lib/cad/dwg-worker.ts`), xoá 9MB
`public/wasm/libredwg-web.wasm`. Signature `openDwgFile()` giữ nguyên → không đụng
`CadEditor.tsx`/`AiBriefPanel.tsx`.

Đồng thời loại `@mlightcad/*` khỏi `build.files` của Electron installer (xem §3.4 của research —
3 lối A1/A2/A3, khuyến nghị A1 cho web + A2 cho desktop).

### 2.2 ✅ ĐÃ CHỐT (Q7) — 3 tool đắt nhất của Render

`docs/IF-FEATURE-TREE.md` mã 2.2.16-2.2.21 (Style Writer/Shot Explorer/Grid Architect): **làm
tiếp**. Điều kiện: review lại TOÀN BỘ tool Render (không chỉ 3 cái này), nghiên cứu kỹ, làm có hệ
thống — không vá rời rạc. **Việc kế tiếp cho Claude Code**: 1 vòng KHÁM (audit
`SPEC-RENDER-STUDIO.md` §6B đối chiếu code thật, kiểu giống `AUDIT-EDITOR-TOOLKIT.md` đã làm cho
Editor Toolkit) — xong vòng khám mới viết SPEC chi tiết cho 3 tool, đúng thứ tự Luật Đóng Băng #5.

### 2.3 ✅ ĐÃ CHỐT — KIÊN → TRỤ

Đổi tên xong ở `QUY_TRINH_SPIRAL_v1.md` (mục 4 bảng vai + mục 5, giữ lịch sử quyết định trong
khối gấp) và `docs/IF-ARCHITECTURE-BLUEPRINT-v1.md` (§5C). Giữ nguyên KIẾN — không đụng file
`AGENTKIENIFARCHITECT.md`. Việc còn lại (không khẩn): nếu Claude Code gặp thêm chỗ nào khác trong
repo còn ghi "KIÊN" mà Cowork chưa quét tới (Cowork chỉ grep trong phạm vi các file đã đọc phiên
này), cập nhật luôn sang TRỤ khi tiện.

---

## 3. Dài hạn — không deadline

- Dựng bảng `FEATURE_TREE` trong Lark Base (ATLAS) thay cho `IF-FEATURE-TREE.md` dạng văn bản —
  cột Mã làm khoá duy nhất (Lark tự chặn trùng), filter/sort tự động ra 3 bảng tổng thay vì đếm
  tay. Không chặn ship, làm khi có băng thông.
- Email hỏi giá thật ODA (Open Design Alliance) — chỉ khi IF2 thật sự bắt đầu cần ghi DWG. Danh
  sách câu hỏi cụ thể đã có ở `docs/RESEARCH-DWG-LICENSE.md` §8 mục 7.

---

## 4. Quy tắc review sản phẩm — chốt 28/07 (áp dụng mọi lần Cowork review/đề xuất từ đây)

**Lỗi vừa xảy ra (bài học):** Cowork dựng mockup UI shell bằng CSS tự chế (accent cam, bo góc
vuông, không hiệu ứng chuyển cảnh) mà **không đọc `app/globals.css`/`tailwind.config.ts` thật
trước** — sai lệch với thiết kế thật: accent thật là **tím** `#6a57f5` (chốt 27/07, có audit
contrast WCAG), bo góc thật theo **nhịp Apple 10/14/20/28px**, và app thật dùng `framer-motion`
(48 file) + easing riêng `cubic-bezier(0.32,0.72,0,1)` — mockup không có hiệu ứng nào. Cowork đã
đưa nhận định ("giao diện giống Apple") mà chưa kiểm chứng trước.

**Quy trình mới — bắt buộc mọi lần sau:**
1. Đọc trạng thái thật đã có (code/token/doc liên quan) TRƯỚC — không phá cái đã làm được.
2. Nói rõ phần nào đã xem kỹ vs phần nào CHƯA xem — không giả định, không phán khi chưa kiểm tra.
3. Chỉ sau đó mới đưa nhận định/đề xuất/sửa lỗi — kể cả xử lý gốc (mầm mống lỗi), không chỉ vá
   triệu chứng.
4. "Sản phẩm đầu ra đúng" = theo checklist hình ảnh tham chiếu Hoà gửi — Cowork mô tả lại ngắn
   gọn từng ảnh để xác nhận hiểu đúng ý trước khi làm/đề xuất.
5. Giữ token thấp — tổng quan phải đủ (không thiếu sót phần quan trọng) nhưng không lan man.

---

*Ghi bởi Cowork (Claude, phiên phân tích kiến trúc IDF) — 2026-07-28, theo lệnh "tiến hành" +
"lưu và thay thế... chốt đổi tên" của Hoà, cập nhật thêm mục 4 (quy tắc review) cùng ngày. Không
code, không git commit — chỉ sửa/tạo file docs (liệt kê ở đầu file, 2 đợt) và ghi lại việc còn
cần Claude Code làm. Đúng luật versioning: file cũ không bị xoá (`archive/LICENSE-NOTES.md`, và 2
file đổi tên `IF-MASTER-BLUEPRINT.md`/`IF-MASTER-TREE.md` giữ dạng chuyển hướng 1 dòng) — vẫn giữ
nguyên làm lịch sử/không dẫn đường cụt.*
