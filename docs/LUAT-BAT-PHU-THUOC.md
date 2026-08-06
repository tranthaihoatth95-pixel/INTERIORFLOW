# LUẬT BẤT PHỤ THUỘC (BPT) — phiếu phải tự đứng được, không dựa trí nhớ người soạn

> **Trạng thái: ĐỀ XUẤT, chờ Hoà gật.** Soạn 05/08/2026 bởi phiên code PHU, sau khi 2/3 việc trong
> phiếu "PHU GẤP" hoá ra đã xong từ 2 ngày trước.
>
> **Vấn đề cần giải (Hoà nêu):** *"cowork bị trí nhớ không tốt và handoff giữa các phiên chi tiết
> sẽ rớt"*. Hệ hiện tại chảy MỘT CHIỀU: trí nhớ Cowork → phiếu → phiên code. Trí nhớ rớt ở đầu
> nguồn thì cả dòng sai theo, và phiên code không có cửa nào chặn.

---

## §0 · VÌ SAO LUẬT CŨ KHÔNG ĐỦ

Đã có N1 (báo cáo không phải bằng chứng) · N7 (grep đúng chỉ báo) · N8 (mỗi dòng phải có
`file:dòng`) · §6.5 (kiểm merge bằng `merge-base`). Cả 4 đều **dạy người soạn cẩn thận hơn** —
và cả 4 đều đã bị phạm lại. N8 tự ghi: sai **7 lần** tính tới 05/08.

Thiếu mảnh còn lại: **không có cửa nào ở ĐẦU NHẬN**. Phiếu sai vẫn được thi hành trọn vẹn, không
ai biết cho tới lúc báo cáo. Và vì báo cáo không chảy ngược vào sổ, **ô sổ sai vẫn nằm đó đẻ ra
phiếu sai tiếp** — xem §4 để thấy ca thật.

---

## §1 · BPT-1 — PHIẾU KHÔNG ĐƯỢC CHỨA KHẲNG ĐỊNH TRẠNG THÁI

Cowork **không được viết** "X chưa ai làm" · "Y đang chặn Z" · "bug này chưa ai động".
Chỉ được viết 3 loại câu:

| Loại | Mẫu | Ví dụ |
|---|---|---|
| **ĐÍCH** | điều gì phải ĐÚNG khi xong, đo bằng gì | "`findHatchBoundary` 40k đoạn xong dưới 1 s — đo bằng bench, dán số" |
| **LỆNH KIỂM** | câu lệnh trả về sự thật, không phải câu khẳng định | "`git merge-base --is-ancestor nhanh-phu main` — nếu ĐÃ MERGE ⇒ đóng phiếu, báo lại" |
| **NGHI VẤN** | phỏng đoán, GẮN NHÃN rõ là phỏng đoán | "🟡 NGHI: chưa có timeout. CHƯA GREP." |

> Câu khẳng định là thứ **hết hạn**. Câu lệnh thì không — chạy lúc nào cũng ra sự thật lúc đó.
> Đây là toàn bộ tinh thần "bất phụ thuộc": phiếu chỉ chứa thứ không hỏng theo thời gian.

---

## §2 · BPT-2 — KHỐI MỞ PHIẾU (chạy TRƯỚC, dán nguyên output)

Mọi phiếu mở đầu bằng khối này. Phiên code chạy **trước khi đọc phần việc**, dán output lên đầu
báo cáo. Không có khối này ⇒ phiếu không hợp lệ, hỏi lại.

```bash
# 1 · Ai vừa đụng vùng file này (bẫy "giao trùng việc", §6.1)
git log --oneline -5 -- <vùng-file>
# 2 · Nhánh đã merge thật chưa — KHÔNG grep commit message (§6.5)
git merge-base --is-ancestor <nhánh> main && echo "ĐÃ MERGE" || echo "CHƯA MERGE"
# 3 · Đích đã đạt SẴN chưa (chỉ báo phải đúng cái đang kiểm — N7)
grep -n "<chỉ-báo-của-ĐÍCH>" <file>
# 4 · Repo có đang đỏ sẵn không (đừng nhận nợ của người khác)
npx tsc --noEmit; echo "EXIT=$?"
# 5 · Sổ nói gì về chính ô này (để đối chiếu + đính chính ngược ở §4)
grep -n "<từ-khoá>" docs/CHECKLIST-TONG.md docs/STATUS.md
```

---

## §3 · BPT-3 — BỐN TÍN HIỆU "LẠ LẠ", ĐỊNH NGHĨA ĐƯỢC

Hoà: *"sẽ không làm và hỏi kỹ từ đầu khi đọc tổng quát trước làm mà thấy lạ lạ"*. "Lạ lạ" phải
đo được, không để cảm tính:

| Mã | Tín hiệu | Ca thật 05/08 |
|---|---|---|
| **L1** | Phiếu nói "chưa ai làm" nhưng `git log` có commit đụng đúng vùng đó **sau** ngày soạn phiếu | VIỆC 2 nói "chưa ai động"; thật ra timeout/tiến độ/huỷ đã có ở `lib/cad/dwg.ts:150,179,183` |
| **L2** | Phiếu trỏ tên file · hàm · nút · màn mà `grep` = 0 | "hộp thoại tạo dự án mới" — Gallery không có; `ProjectSelect.tsx:1199` tạo & mở luôn |
| **L3** | Tiêu chí nghiệm thu **đã đạt sẵn** trước khi gõ dòng code nào | VIỆC 1: `tsc` EXIT 0 ngay từ đầu; `4641163` đã merge 03/08 |
| **L4** | Số đo 10 phút đầu **lệch bậc** so với số trong phiếu | libredwg đo 812 ms, phiếu ngụ ý nó là nút cổ chai |

**Cách xử — không cứng nhắc, không bỏ chạy:**

- **1 tín hiệu** → vẫn làm, nhưng ghi ngay vào báo cáo mục "NGHI VẤN MỞ PHIẾU" + tiếp tục phần
  KHÔNG phụ thuộc vào tiền đề đang nghi.
- **≥2 tín hiệu, hoặc bất kỳ L3** (đích đã đạt) → **DỪNG việc đó, hỏi Hoà**, và **làm tiếp các
  việc độc lập khác trong phiếu** (không ngồi chờ — luật V7 "task đang làm thì làm đến cùng").
- Câu hỏi phải **cụ thể**, kèm vật chứng: *"VIỆC 1 đích đã đạt (`tsc` EXIT 0, fix `4641163` merge
  03/08). Hoà muốn (a) đóng phiếu, hay (b) mở rộng đích sang việc khác?"* — không hỏi trống
  "phiếu này còn đúng không?".

---

## §4 · BPT-4 — CHIỀU NGƯỢC LẠI (mảnh còn thiếu, quan trọng nhất)

Hôm nay dòng chảy chỉ có **một chiều**. Phải thêm chiều về:

**Mọi báo cáo BẮT BUỘC có 2 mục:**

```markdown
## PHIẾU SAI CHỖ NÀO
- VIỆC 1 "2 lỗi type chặn merge" → SAI: đã vá `4641163`, merge `892c927` (03/08).

## Ô SỔ CẦN SỬA  ← Cowork phải nuốt mục này TRƯỚC khi ra phiếu mới
- `docs/CHECKLIST-TONG.md:61` — ⬜ PHU GẤP → ✅, bằng chứng `4641163` + `892c927`.
```

**Vì sao đây là mảnh quan trọng nhất:** `4641163` vá xong **03/08 08:40**, merge **03/08 09:40**.
Tới **05/08** ô `CHECKLIST-TONG.md:61` **vẫn ⬜** — và chính ô ⬜ đó đẻ ra phiếu "PHU GẤP" hôm nay.
Không có chiều về thì tuần sau nó lại đẻ ra phiếu ấy lần nữa. Sửa ô sổ **rẻ hơn làm lại việc**
đúng hai bậc.

---

## §5 · BPT-5 — Ô SỔ CÓ HẠN DÙNG (chống trí nhớ rớt)

Hôm nay `CHECKLIST-TONG.md` có **103 ô trạng thái**, tự khai *"phiên nào xong việc thì đổi ô của
mình"* — tức là mọi ô đều dựa vào việc ai đó **nhớ** quay lại sửa. Đó chính là chỗ rớt.

Đề xuất: mỗi ô mang **dấu kiểm** `✅@<sha hoặc ngày>`. Thêm trạng thái thứ ba:

| Ký hiệu | Nghĩa |
|---|---|
| `✅@892c927` | xong, đã kiểm tại mốc đó |
| `🔎` | **chưa kiểm lại** — quá 7 ngày, hoặc `main` đã có commit mới đụng đúng vùng file đó |
| `⬜` | chưa có gì |

**Luật cứng: ô `🔎` KHÔNG được biến thành phiếu việc.** Phải chạy lệnh kiểm cho nó về `✅` hoặc
`⬜` trước. Một dòng `git log --oneline <sha>..main -- <vùng-file>` là đủ để biết ô đã ôi hay chưa.

---

## §6 · BPT-6 — TRẠNG THÁI LÀ THỨ **TÍNH RA**, KHÔNG PHẢI THỨ **GÕ VÀO**

Đích cuối. Tiền lệ đã có thật trong repo: [`scripts/check-mocks.mjs`](../scripts/check-mocks.mjs)
— cửa kiểm bằng máy, mã hoá **5 kiểu hỏng đã gặp thật**, không phải lint chung chung. Nó đúng
nguyên lý cần nhân rộng: *máy giữ sự thật, người chỉ đọc.*

Đề xuất `scripts/trang-thai.mjs`: mỗi dòng checklist **chặn việc** (⛔/🔴) khai thêm 1 trường
`kiem:` là câu lệnh; script chạy hết, in ra trạng thái THẬT, so với ô đang ghi và báo ô nào lệch.

```
kiem: git merge-base --is-ancestor nhanh-phu main
kiem: npx tsc --noEmit
kiem: node_modules/.bin/sucrase-node lib/cad/hatch-perf.test.ts
```

Không cần làm cho cả 103 ô — **chỉ ô đang chặn việc**, chừng 10-15 ô. Chưa dựng; chờ Hoà gật §1-§5
trước đã, vì §6 chỉ có nghĩa khi phiếu đã viết theo lối "lệnh kiểm" của §1.

---

## §7 · BỐN CÂU COWORK PHẢI TRẢ LỜI TRƯỚC KHI RA PHIẾU

Thiếu câu nào, phiên code hỏi lại đúng câu đó — không đoán:

1. **Bằng chứng nào cho thấy việc này CHƯA làm?** (`file:dòng` hoặc `sha`, hoặc ghi `CHƯA GREP`)
2. **Xong thì đo bằng gì?** (câu lệnh + con số, không phải tính từ)
3. **Vùng file nào? Ai vừa đụng?** (`git log --oneline -5 -- <vùng>`)
4. **Nếu đích đã đạt sẵn thì sao?** (đóng phiếu / mở rộng đích — quyết TRƯỚC, đừng để phiên code
   đoán giữa chừng)

---

## §8 · THỬ NGƯỢC TRÊN CHÍNH PHIẾU HÔM NAY

| Việc | BPT bắt ở đâu | Tiết kiệm được |
|---|---|---|
| V1 · 2 lỗi type | Khối mở phiếu lệnh 2+4 → `ĐÃ MERGE` + `EXIT=0` ⇒ **L3**, dừng ngay | ~40 phút đọc `BAO-CAO-CHINH` 1.600 dòng tìm lỗi không còn tồn tại |
| V2 · DWG treo | Lệnh 1 → thấy commit P1 vá timeout ⇒ **L1**, hỏi lại "vá rồi, còn treo chỗ nào?" | Không mất — nhưng đích đúng ngay từ đầu, khỏi đi vòng qua giả định "convertEx là thủ phạm" |
| V3 · findHatchBoundary | Không tín hiệu nào — phiếu đúng | Chạy thẳng, không phí kiểm |

Tỉ lệ: **2/3 việc lẽ ra phải dừng hỏi ở phút thứ 5.**

---

## §9 · ĐIỀU LUẬT NÀY **KHÔNG** LÀM

- ❌ Không bắt Cowork ngừng ra phiếu khi chưa chắc — cứ ra, nhưng **gắn nhãn NGHI VẤN** (§1).
- ❌ Không bắt phiên code dừng cả phiên vì 1 nghi vấn — làm tiếp phần độc lập (§3).
- ❌ Không thêm file sổ mới. `CHECKLIST-TONG.md`/`STATUS.md` giữ nguyên, chỉ thêm dấu kiểm (§5).

---

## DÒNG DÁN VÀO `00-CHOT.md` KHI HOÀ GẬT

```
[05/08 Hoà chốt] LUẬT BẤT PHỤ THUỘC (docs/LUAT-BAT-PHU-THUOC.md): phiếu chỉ chứa ĐÍCH · LỆNH KIỂM · NGHI VẤN — CẤM khẳng định trạng thái (khẳng định là thứ hết hạn, câu lệnh thì không). Mọi phiếu mở đầu bằng KHỐI MỞ PHIẾU 5 lệnh, dán nguyên output. 4 tín hiệu "lạ lạ" L1-L4 định nghĩa được; ≥2 tín hiệu hoặc bất kỳ L3 (đích đã đạt sẵn) ⇒ DỪNG việc đó + hỏi cụ thể kèm vật chứng, vẫn làm tiếp việc độc lập. Báo cáo BẮT BUỘC có mục "PHIẾU SAI CHỖ NÀO" + "Ô SỔ CẦN SỬA" — Cowork phải nuốt trước khi ra phiếu mới (ca bệnh: CHECKLIST-TONG:61 còn ⬜ 2 ngày sau khi 4641163 merge, đẻ lại đúng phiếu cũ). Ô sổ mang dấu ✅@sha; quá 7 ngày hoặc main đụng vùng đó ⇒ tự hạ 🔎, ô 🔎 CẤM biến thành phiếu.
```
