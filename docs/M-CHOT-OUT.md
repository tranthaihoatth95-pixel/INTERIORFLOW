# M-CHOT-OUT — phiên DỌN theo cửa kiểm check-chot (07/08 tối)

Phiên: **p2**. Luật: V6 KHÔNG commit · §0u chỉ ghi file này · N1/N5/N8 · §0ab (đo lại trước khi tin phiếu).

## SỐ TRƯỚC / SAU (thước đo: `node scripts/check-chot.mjs`)

| | TRƯỚC (đầu phiên) | SAU |
|---|---|---|
| 🔴 vi phạm chặn | **34** (phiếu ghi 35 — đo lại ra 34: TRUNG-TINH lúc đó còn 2, không 4) | **0** |
| 🟡 cảnh báo | **4** | **0** |
| EXIT | 1 | **0** |

Phân rã 34 đỏ đầu phiên: KHONG-NUOT-LOI 25 · TEN-CHANG 4 · LOGO-KHONG-ACCENT 2 · TRUNG-TINH 2 · PHEU-AI-TEN-MAGIC 1.

## VIỆC 1 — 25 catch rỗng → 0 (K5)

Không nhét `console.warn` máy móc — phân loại từng ca:

| Cụm | Số chỗ | Cách xử |
|---|---|---|
| `try{localStorage…}catch{}` — chế độ riêng tư/iframe chặn storage | 21 (`lib/store.ts` ×11 · `components/studio/StageSwitcher.tsx` ×5 · `lib/render-studio/tool-mode-ui.ts` ×2 · `app/intro/page.tsx:22` · `components/intro/IntroSequence.tsx:72` · `app/layout.tsx:70,71` — 2 chỗ cuối là chuỗi inline-script, comment chèn thẳng vào JS trong chuỗi) | Comment MỘT DÒNG nêu lý do nuốt được ("chỉ mất tiện nghi ghi nhớ, không chặn việc" / "dùng mặc định" / "intro hiện lại lần sau, vô hại" / "migration một-lần bỏ qua") |
| `setPointerCapture`/`releasePointerCapture` throw khi pointer đã rời | 2 (`StageSwitcher.tsx:140,181`) | Comment lý do: capture không còn để giữ/nhả, bỏ qua an toàn |
| **Gọi MẠNG bị nuốt** — poll chat 3s | 1 (`components/ChatPanel.tsx:43`) | Sửa THẬT: `catch (err)` + `console.warn` **1 lần mỗi đợt đứt** (cờ `warnedOffline`, reset khi mạng sống lại) — không spam console mỗi 3s, không nuốt im lặng |
| (dòng thứ 25 của phiếu là tổng đếm gồm cả 2 dòng layout.tsx ở trên) | | |

## VIỆC 2 — TEN-CHANG 4 → 0

| Chỗ | Trước → Sau |
|---|---|
| `components/cad/CadEditor.tsx:305` | title PDF `'InteriorFlow — Drafting CAD'` → `'InteriorFlow — Thiết kế 2D'` |
| `CadEditor.tsx:620` | `"Nhập / mở file vào chặng Drafting CAD"` → `"…chặng Thiết kế 2D"` |
| `CadEditor.tsx:633` | `"Xuất file từ chặng Drafting CAD"` → `"…chặng Thiết kế 2D"` |
| `lib/refingest.ts:45` | `label: 'CAD / Bản vẽ'` → `'Bản vẽ 2D (DXF/DWG)'` — giữ nghĩa ĐỊNH DẠNG TỆP mà không lộ chữ CAD; **`id: 'cad'` là KHOÁ LƯU, giữ nguyên** (comment tại chỗ) |

Không đổi tên code `lib/cad/`, `useCadStore`, route — đúng ⛔ của phiếu. (Docstring `CadEditor.tsx:4` còn chữ "Drafting CAD" — là comment, không phải nhãn người dùng, cửa kiểm không bắt, không đụng.)

## VIỆC 3 — TRUNG-TINH: ĐÃ ĐƯỢC XỬ GIỮA CHỪNG BỞI NGƯỜI KHÁC, phiên này KHÔNG sửa trùng

Đo lại lúc bắt tay vào VIỆC 3 (giữa phiên): `components/intro/TitleSequence.tsx:39,181` đã được
viết lại lời ("thư mục ảnh khách đã xoá hẳn 07/08" — hết chuỗi `/detech/*`),
`public/__testcases/present.json` grep "detech" = **0** (đã trỏ `/demo/mood2.jpg`/`mood3.jpg`),
và **`public/detech/` đã bị xoá hẳn khỏi đĩa** (Hoà/phiên khác thực hiện — trùng lúc phiên này
chạy; luật KHONG-DU-AN-MAU cũng vì thế mà xanh). ⇒ TRUNG-TINH = 0 không do phiên này; ghi nhận
để không ai tưởng phiếu chưa chạy. Không có test nào tham chiếu present.json bị vỡ (npm test 0 fail).

## Sửa CỬA KIỂM (2 dương tính giả của chính nó)

1. `scripts/check-chot.mjs` — **tự quét chính nó**: 2 dòng khai luật LOGO-KHONG-ACCENT chứa hex cấm
   `#8b5cf6/#c026d3` (bắt buộc phải nhắc nguyên văn để mô tả luật). Sửa: `FILES` loại
   `scripts/check-chot.mjs` khỏi tập quét, comment lý do tại chỗ.
2. `components/present-editor/Toolbar.tsx:428` — comment LỊCH SỬ nhắc nguyên văn nhãn cũ trong
   ngoặc kép, dính regex PHEU-AI-TEN-MAGIC. Sửa: viết lại comment không nhắc nguyên văn (nội dung
   lịch sử giữ nguyên ý).

## VIỆC 5 — 4 🟡 AI-CAM-TU-TU-DONG: rà từng chỗ, cả 4 KHÔNG phải AI → allow-list

| Chỗ | Phân loại | Căn cứ |
|---|---|---|
| `Inspector.tsx:631` "Danh sách đánh số tự động" | KHÔNG AI — đánh số danh sách văn bản | phiếu đã phán + đọc code `setListStyle` |
| `TextToolbar.tsx:272` "Đánh số tự động" | KHÔNG AI — cùng cỗ máy đánh số | `setList('number')` thuần trình bày |
| `LibraryPanel.tsx:147` "Tự động: app tự nhận…" + option "⚡ Tự động phân loại" | KHÔNG AI — phân loại theo mime/đuôi tệp | `lib/refingest.ts` `classify()/guessUsage()` — heuristic thuần (`/\.(dxf|dwg)$/…`), 0 gọi mô hình |
| `Inspector.tsx:1136` "(thủ công, không tự động)" | KHÔNG AI — chữ "tự động" dùng để PHỦ ĐỊNH | đọc nguyên câu |

Allow-list thêm vào rule trong `scripts/check-chot.mjs`, khoá theo **(file, chuỗi con)** chứ không
theo số dòng (số dòng trôi — đúng bài học §0i), kèm lý do đầy đủ trong comment.

## VIỆC 4 — nối cửa kiểm vào npm test (chỉ nối SAU khi 🔴=0)

`package.json`: thêm `"check:chot": "node scripts/check-chot.mjs"` và chèn `npm run check:chot`
vào pipeline `"test"` ngay sau `license:check`. Đã chạy `npm test` TRỌN pipeline sau khi nối.

## VERIFY CUỐI (N1 — số thật)

```
node scripts/check-chot.mjs → EXIT 0 · 9 luật · 🔴 0 · 🟡 0
npx tsc --noEmit -p .       → EXIT 0 · 0 dòng lỗi
npm test                     → EXIT 0 · 6.335 dòng ok · 0 fail (license:check + check:chot đều chạy trong pipeline)
```

## File đã sửa (V6 — Hoà commit)
```
lib/store.ts · lib/render-studio/tool-mode-ui.ts · components/studio/StageSwitcher.tsx
app/intro/page.tsx · app/layout.tsx · components/intro/IntroSequence.tsx · components/ChatPanel.tsx   (VIỆC 1)
components/cad/CadEditor.tsx · lib/refingest.ts                                                        (VIỆC 2)
components/present-editor/Toolbar.tsx · scripts/check-chot.mjs                                         (sửa cửa kiểm + comment)
package.json                                                                                           (VIỆC 4)
docs/M-CHOT-OUT.md                                                                                     (file này)
```

## HÀNG ĐỢI CUỐI LƯỢT (§V7)
- **Đã xong**: 🔴 34→0 · 🟡 4→0 · cửa kiểm đã gác trong `npm test` · tsc 0 · test 6.335 ok/0 fail.
- **Còn treo**: không.
- **CHƯA VERIFY**: hành vi UI của 4 nhãn vừa đổi chưa nhìn bằng mắt trên trình duyệt (đổi chuỗi
  tĩnh trong title/tooltip, rủi ro ~0; dev server phiên khác đang chiếm repo, không dựng server
  riêng chỉ để soi 3 tooltip). Ca ChatPanel offline-log chưa mô phỏng đứt mạng thật — logic cờ
  `warnedOffline` đã đọc lại bằng mắt, có test pipeline xanh nhưng không có test riêng cho nó.
- **Lưu ý cho TỔNG**: con số phiếu (35 đỏ · 5 vàng) lệch số đo đầu phiên (34 · 4) vì TRUNG-TINH
  được phiên khác/Hoà xử song song đúng hôm nay — sổ nào chép số này nên chép từ `M-CHOT-OUT` SAU.
