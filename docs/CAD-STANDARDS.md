# CAD-STANDARDS — Bộ nhớ quy chuẩn (TCVN/QCVN/ISO/NFPA-IBC)

Hệ thống ghi nhớ tự động các tiêu chuẩn ngành xây dựng (Việt Nam + quốc tế) cho trình CAD 2D
(`/cad-editor`). **Nguyên tắc cốt lõi (điều khoản hiến pháp): chỉ ĐỌC bản vẽ và ĐỀ XUẤT — không
bao giờ tự động sửa entity.** Người dùng tự quyết định có sửa hay không, và tự sửa bằng các lệnh
CAD thường (MOVE/STRETCH/…).

## Kiến trúc (data-driven — thêm quy chuẩn KHÔNG cần sửa code xử lý)

```
lib/cad/standards/
  registry.ts          — types (StandardRule/RuleGroup) + nạp tất cả nhóm rule + rule tuỳ biến
  vn-residential.ts     — TCVN 4451:2012 (diện tích tối thiểu phòng ở)
  vn-fire.ts            — QCVN 06:2022/BXD (+ Sửa đổi 1:2023) — an toàn cháy, thoát nạn
  intl-egress.ts        — NFPA 101 / IBC Chapter 10 (thoát nạn quốc tế)
  iso-drafting.ts       — ISO 128 (nét vẽ), ISO 129 (kích thước), ISO 7200 (khung tên), ISO 216 (khổ giấy)
  checker.ts            — rule engine: đo hình học thật từ Doc, đối chiếu rule → Violation[]
  checker.test.ts       — test rule engine (chạy: node_modules/.bin/sucrase-node lib/cad/standards/checker.test.ts)
```

UI: nút "Kiểm chuẩn" (icon khiên) trên thanh file `components/cad/CadEditor.tsx` → mở
`StandardsPanel` → chạy `checkStandards(doc, getAllRules())` → liệt kê vi phạm (mức độ/nguồn/
verified hay chưa/nút zoom tới vị trí). Không có nút "tự sửa" ở đâu cả.

## Thêm 1 quy chuẩn mới

1. Chọn file nhóm phù hợp (`vn-residential.ts`/`vn-fire.ts`/`intl-egress.ts`/`iso-drafting.ts`)
   hoặc tạo file mới nếu là nhóm hoàn toàn khác (VD `vn-electrical.ts`) — nhớ import + thêm vào
   `BUILTIN_GROUPS` trong `registry.ts`.
2. Thêm 1 object `StandardRule` vào mảng `rules` của nhóm đó:

```ts
{
  id: 'vn-res-vi-du-moi',           // slug DUY NHẤT toàn cục
  source: 'TCVN XXXX:20XX §y.y',    // trích dẫn CÀNG CỤ THỂ CÀNG TỐT
  category: 'room-size',            // room-size | clearance | door-window | egress | corridor-stair | drafting | other
  severity: 'warning',              // error | warning | info
  description: 'Mô tả tiếng Việt, hiện trực tiếp trong panel.',
  params: { minAreaM2: 12 },        // tham số số — checker.ts tự đọc field nào cần
  verified: true,                   // XEM MỤC DƯỚI trước khi đặt true
  note: '...',                      // BẮT BUỘC nếu verified=false
}
```

3. Nếu rule cần ĐO ĐƯỢC tự động (không chỉ hiển thị tham khảo), thêm logic đo trong
   `checker.ts` — hàm `checkStandards()`. Nếu KHÔNG có cách đo (thiếu dữ liệu hình học, VD chiều
   cao cửa), rule vẫn có thể tồn tại trong registry để tham khảo, chỉ là chưa sinh violation tự
   động — ghi rõ điều này trong `note`.
4. Cập nhật/thêm test trong `checker.test.ts` cho rule mới nếu có logic đo tự động.

### Nguyên tắc `verified` — KHÔNG ĐƯỢC BỊA SỐ

- `verified: true` **chỉ** khi đã tra cứu được số liệu từ nguồn kiểm chứng được (search web, văn
  bản pháp luật/tiêu chuẩn gốc, tài liệu kỹ thuật uy tín) — ghi rõ trong `source`.
- `verified: false` khi số liệu lấy từ trí nhớ chung/kinh nghiệm/suy đoán hợp lý, hoặc tra được
  qua tổng hợp web nhưng CHƯA đọc trực tiếp văn bản gốc — `note` PHẢI giải thích rõ lý do và
  khuyến nghị "cần đối chiếu bản gốc quy chuẩn X trước khi dùng cho hồ sơ chính thức".
- Test `checker.test.ts` (mục "Registry integrity") tự động kiểm tra: **mọi rule có
  `verified: false` đều phải có `note`** — CI-style guard chống quên ghi chú.

### Rule tuỳ biến của user (không cần sửa code)

`registry.ts` export `loadCustomRules()/saveCustomRules()/addCustomRule()/removeCustomRule()`
— đọc/ghi `localStorage` (client-only, an toàn SSR vì chỉ chạy trong hàm gọi từ component).
`getAllRules()` trộn rule built-in + rule tuỳ biến (trùng `id` → rule tuỳ biến ghi đè). Hiện
CHƯA có UI để user tự thêm rule qua giao diện (chỉ có API sẵn sàng) — để dành bản nâng cấp sau.

## Cách đo hình học (checker.ts)

Đo diện tích/bề rộng phòng bằng cách TÁI DÙNG thuật toán dò biên pick-point của HATCH (Nấc 4,
`lib/cad/hatch.ts` → `findHatchBoundary`): lấy vị trí TEXT tên phòng (quy ước app: đặt bên trong
phòng) làm pick-point, dò ra đa giác phòng thật, đo diện tích (chính xác, không phụ thuộc text
"12.2 m²" có thể lệch nếu user sửa tường mà quên sửa nhãn) + bề rộng nhỏ nhất (xấp xỉ rotating-
calipers, đủ cho phòng chữ nhật/gần chữ nhật).

**Giới hạn đã biết (đã kiểm chứng bằng debug thủ công, không phải suy đoán):** dò biên đáng tin
cậy cho phòng có tường bao là 1 vòng khép kín KHÔNG bị vách khác đâm vào giữa (chữ T). Với phòng
có T-junction (rất phổ biến — VD phòng khách kề 1 vách dọc chia các phòng khác), thuật toán đôi
khi thất bại (trả `null`, do các quad tường độc lập không vát góc trong `commands.ts` chồng lấn
tạo khe hở hình học nhỏ ở góc/chữ T). Checker xử lý AN TOÀN: bỏ qua phòng không dò được biên
(không đoán mò, không báo sai) — nghĩa là MỘT SỐ VI PHẠM THẬT Ở PHÒNG CÓ HÌNH HỌC PHỨC TẠP CÓ THỂ
BỊ BỎ SÓT (false negative), không phải báo sai (false positive). Đã tạo task riêng theo dõi việc
nâng cấp thuật toán face-finding này.

## Trạng thái verified/chưa verified của từng rule (chốt tại lúc viết — 2026-07-11)

| Rule id | Nguồn | verified |
|---|---|---|
| `vn-res-bedroom-min-area` | TCVN 4451:2012 | true (qua tổng hợp web, chưa đọc PDF gốc) |
| `vn-res-wc-min-area` | TCVN 4451:2012 (khuyến nghị) | true (qua tổng hợp web) |
| `vn-res-kitchen-dining-min-area` | TCVN 4451:2012 (khuyến nghị) | true (qua tổng hợp web) |
| `vn-res-window-floor-ratio` | TCVN 4451:2012 | true (chưa có cơ chế đo tự động) |
| `vn-res-apartment-min-area` | TCVN 4451:2012 | true (qua tổng hợp web) |
| `vn-res-living-min-area` | Kinh nghiệm thực hành | **false** — chưa trích dẫn được điều khoản cụ thể |
| `vn-fire-corridor-min-width-f1-over15` | QCVN 06:2022/BXD | true (qua tổng hợp web) |
| `vn-fire-corridor-min-width-general` | QCVN 06:2022/BXD | true (qua tổng hợp web) |
| `vn-fire-stair-min-width` | QCVN 06:2022/BXD | **false** — 2 trị số (1.0m/1.35m) chưa rõ áp dụng khi nào |
| `vn-fire-exit-door-double-leaf-rule` | QCVN 06:2022/BXD | true (rule định tính) |
| `vn-fire-exit-door-height-min` | QCVN 06:2022/BXD | **false** — nghi ngờ lẫn chiều cao/chiều rộng |
| `intl-egress-min-width-general` | IBC Ch.10/NFPA 101 | true (qua tổng hợp web) |
| `intl-egress-max-door-width` | IBC Ch.10 | true (qua tổng hợp web) |
| `intl-egress-door-swing-encroachment` | IBC Ch.10 | true (chưa đo tự động được) |
| `iso128-lineweight-set` | ISO 128-2:2020 | true (qua tổng hợp web) |
| `iso128-thick-thin-ratio` | ISO 128-2:2020 | true (qua tổng hợp web) |
| `iso216-paper-sizes` | ISO 216 | true (kiến thức phổ thông ổn định) |
| `iso129-dimension-style-minimal` | ISO 129 | **false** — chưa tra điều khoản cụ thể |
| `iso7200-titleblock-fields` | ISO 7200 | **false** — chưa tra điều khoản cụ thể |

**Mọi rule `verified: true` ở trên đều tra qua tìm kiếm web tổng hợp (không phải đọc trực tiếp
văn bản PDF gốc)** — nên đối chiếu bản gốc trước khi dùng cho hồ sơ pháp lý/PCCC/xin phép chính
thức. Đây KHÔNG phải công cụ thẩm duyệt PCCC hay xin phép xây dựng — chỉ là trợ lý rà soát nhanh
trong quá trình thiết kế.
