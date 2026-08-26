# F1 — Đề bài → Gói Ý tưởng (Brief → Concept Package)

> Gói thi công · `IF-MVP-FLOWS-001` · xác minh lại trên **HEAD `147f66a`**
> (lượt đo gốc ghi `ad26391` — dòng đã trôi, các chỗ lệch liệt kê ở §8).

---

## 1. Nhãn

**`CANDIDATE-ONLY`**

Có một panel đọc đề bài và đẻ ra ba phương án bố cục, nhưng **"Gói Ý tưởng" (Concept Package)
không tồn tại như một vật thể trong repo** — không model, không route, không component, không
tệp lưu. Chuỗi hôm nay kết thúc bằng việc vẽ entity vào canvas CAD; mọi thứ còn lại chỉ sống
trong `localStorage` của trình duyệt.

---

## 2. Bản đồ chuỗi chạy

| chặng | file:dòng | trạng thái | loại |
|---|---|---|---|
| Điểm vào — render `AiBriefPanel` khi `aiBriefOpen` | `components/cad/CadEditor.tsx:911` | CHẠY | OBSERVED |
| Phân loại tệp đề bài theo đuôi tên | `lib/cad/brief-file.ts:34` (`briefFileKind`) | CHẠY | OBSERVED |
| Danh sách đuôi được nhận (`.pdf,.txt,.md`) | `lib/cad/brief-file.ts:23` (`BRIEF_FILE_ACCEPT`) | CHẠY | OBSERVED |
| `.docx`/`.doc` → trả về `'word'` rồi báo lỗi có hướng dẫn, **không trích** | `lib/cad/brief-file.ts:37` + docstring `:14` | CHẶN CÓ CHỦ Ý | OBSERVED |
| Trích text PDF (dynamic import, dùng lại `unpdf` của notebook) | `components/cad/AiBriefPanel.tsx:157-158` → `lib/notebook/extract.ts#extractPdf` | CHẠY | OBSERVED |
| Trần ký tự đổ vào ô brief (20.000) | `lib/cad/brief-file.ts:31` (`BRIEF_MAX_CHARS`) | CHẠY | OBSERVED |
| Đối chiếu hiện trạng (hồ sơ) khi bật baseline | `components/cad/AiBriefPanel.tsx:252` → `lib/cad/dossier-check.ts#checkDossier` | CHẠY | OBSERVED |
| Tầng 1 — parse đề bài → `LayoutSpec` | `lib/cad/ai-assist.ts:220` (`parseDescription`) | CHẠY, **là STUB rule-based** (tự khai `:155`, `:216`) | OBSERVED |
| Tầng 2 — sinh 3 phương án bố cục | `lib/cad/ai-assist.ts:559` (`generateLayoutOptions`), gọi ở `components/cad/AiBriefPanel.tsx:297` | CHẠY | OBSERVED |
| "Nhận" — áp entity vào doc CAD + dạy `PairwisePerceptron` | `components/cad/AiBriefPanel.tsx:340` (`accept`) | CHẠY | OBSERVED |
| Lưu bản nháp đề bài | `components/cad/AiBriefPanel.tsx:75` (`interiorflow.cad.aibrief.draft.v1`, ghi `:94`) | CHỈ localStorage | OBSERVED |
| Lưu lịch sử lượt dùng | `components/cad/AiBriefPanel.tsx:76` (`...history.v1`, ghi `:110`) | CHỈ localStorage | OBSERVED |
| **Gói Ý tưởng như một vật thể** | — | **KHÔNG TỒN TẠI** | OBSERVED (tìm không thấy) |
| Vật gần nhất — Thẻ DNA thiết kế | `lib/dna/types.ts:48` (`DesignDnaCard`) | CHẠY, độc lập | OBSERVED |
| Nơi lưu Thẻ DNA (JSON file, không DB) | `lib/dna/store.ts:21` (`DNA_ROOT`), `:53` (`cards.json`) | CHẠY | OBSERVED |
| API Thẻ DNA | `app/api/projects/[id]/dna/route.ts:22` GET · `:37` PUT · `:60` DELETE | CHẠY | OBSERVED |
| **Nối brief → DNA** | — | **KHÔNG CÓ DÒNG MÃ NÀO** | OBSERVED (grep 0 kết quả) |

---

## 3. Chỗ đứt chính xác

Có **hai** vết đứt, thứ tự quan trọng:

**Đứt A — đầu ra bay hơi (đứt chính).**
`accept()` (`AiBriefPanel.tsx:340`) làm đúng hai việc: `st.addEntities()` vào doc CAD, và
`localStorage.setItem(HISTORY_KEY, …)`. Không có lượt ghi nào xuống máy chủ. Đề bài — thứ đắt
nhất trong cả luồng, thường là PDF 20-50 trang của khách — sống trong `localStorage` của **một**
trình duyệt, **một** máy. Đổi máy, đổi trình duyệt, xoá site data, hoặc chỉ cần mở dự án ở tab
ẩn danh: đề bài biến mất, không ai trong nhóm đọc được.

*Người dùng thấy gì:* mở dự án trên laptop thứ hai, panel "AI mô tả" trống trơn dù hôm qua vừa
nạp brief 40 trang. Không có thông báo nào — nó chỉ đơn giản là rỗng, trông y hệt dự án mới.

**Đứt B — không có vật thể "Gói Ý tưởng".**
Ngay cả khi Đứt A được vá, cái được lưu vẫn chỉ là *chuỗi text brief* + *một option bố cục*. Một
Gói Ý tưởng theo nghĩa nghề (đề bài đã chắt → ràng buộc → hướng thiết kế → phương án) không có
chỗ chứa. Repo **đã có** đúng hình hài đó ở nơi khác: `DesignDnaCard` (`lib/dna/types.ts:48`)
với `DesignDnaLayers` (`:46`) — các tầng đã chắt lọc, mỗi tầng là một `DistilledField` mang theo
căn cứ. Nhưng brief và DNA là hai hòn đảo: `grep` toàn repo cho `aibrief` ngoài chính
`AiBriefPanel.tsx` trả về **0 dòng**.

*Người dùng thấy gì:* làm brief xong ở panel CAD, sang màn DNA thấy trống; muốn có thẻ DNA phải
gõ lại bằng tay những gì vừa đọc. Hai lần nhập cho một lần suy nghĩ.

**Đứt C (nhỏ, đã khai thật, không phải bug).**
`.docx` bị chặn có chủ ý — repo không có thư viện đọc Word (`brief-file.ts:14` khai rõ). Thông
điệp hướng người dùng lưu thành PDF. Đây là **chặn đúng**, không nằm trong lát mỏng kế tiếp.

---

## 4. Lát mỏng nhỏ nhất kế tiếp

**Mục tiêu: chỉ vá Đứt A + nửa Đứt B — cho lượt "Nhận" đẻ ra MỘT Thẻ DNA thật trên máy chủ.**

Không bảng mới. Không migrate. Không route mới. Dùng nguyên `PUT /api/projects/[id]/dna` đang
chạy (`app/api/projects/[id]/dna/route.ts:37`), ghi vào `uploads/dna/<projectId>/cards.json`
(`lib/dna/store.ts:53`) — hạ tầng file-JSON này đã được chọn có chủ đích cho dữ liệu không cần
quan hệ (docstring `lib/dna/store.ts:7`).

**Sửa đúng 2 tệp:**

1. **`lib/cad/brief-to-dna.ts`** *(tệp mới, thuần, ~60 dòng — không DOM, test được dưới sucrase)*
   - `export function theDnaTuBrief(input: { brief: string; option: LayoutOption; spec: LayoutSpec }): DesignDnaCard`
   - Dựng `DesignDnaCard` (`lib/dna/types.ts:48`) từ `parseDescription` đã chạy sẵn trong
     `AiBriefPanel`. Mỗi `DistilledField` mang `nguon = 'brief'` + đoạn text gốc làm căn cứ.
   - ⛔ Tầng nào `parseDescription` **không** suy ra được thì để **trống**, không bịa. Stub
     rule-based (`ai-assist.ts:216`) chỉ đọc được phòng/kích thước — các tầng ngôn ngữ/vật liệu
     phải rỗng và hiện là "chưa rõ", đúng luật 5 (không dữ liệu giả).
   - Không gọi `fetch` ở đây — tệp thuần, dễ test.

2. **`components/cad/AiBriefPanel.tsx`** — trong `accept()` (`:340`), sau `st.addEntities(...)`:
   - Gọi `theDnaTuBrief(...)` rồi `fetch('/api/projects/${projectId}/dna', { method: 'PUT', … })`.
   - Ghi trạng thái thật vào `setStatus`: **chỉ** báo "Đã lưu Thẻ DNA" khi response `200`.
     Lỗi thì báo lỗi thật kèm tên lỗi — không nuốt, không báo xong.
   - `localStorage` **giữ nguyên**: nó vẫn là bộ đệm nháp khi gõ, không phải nơi lưu cuối. Bỏ nó
     đi là mất tính năng khôi phục lúc đang gõ dở.

**Cố tình KHÔNG làm ở lát này:** không lưu bản thân file PDF; không nối DNA ngược lại vào panel
(reopen); không đụng `.docx`. Reopen là lát kế tiếp, và nó rẻ vì `GET` đã có sẵn (`route.ts:22`).

---

## 5. Cờ + đường lùi

- **Cờ:** `NEXT_PUBLIC_IF_BRIEF_DNA=1`. Mặc định **tắt**. Tắt ⇒ `accept()` chạy đúng đường cũ,
  không một lượt `fetch` nào phát ra — không đổi hành vi với mọi người dùng chưa bật.
- **Đường lùi:** revert **2 tệp**. `lib/cad/brief-to-dna.ts` xoá thẳng (không ai import khác);
  `components/cad/AiBriefPanel.tsx` revert một khối trong `accept()`. Không có dữ liệu cần dọn
  ngược — `cards.json` sai chỉ cần `DELETE /api/projects/[id]/dna` (`route.ts:60`, đã có).
- **Không có schema nào bị đụng** ⇒ không có migration để lùi.

---

## 6. Ba ca chứng minh trên runtime

Server đang chạy: **CHINH=3001**. Không bật server mới.

**Ca 1 — CA HÔM NAY TRƯỢT (đây là ca bắt buộc).**
Mở `localhost:3001`, vào một dự án, mở CAD → panel "AI mô tả". Gõ đề bài
`Phòng khách 5x4m; Bếp 3x3m`. Bấm sinh phương án, bấm **Nhận** trên option 1.
Mở tab thứ hai ở chế độ **ẩn danh**, đăng nhập cùng tài khoản, mở đúng dự án đó, mở panel.
- **Hôm nay:** ô brief **trống**. Không có thẻ DNA nào. `uploads/dna/<projectId>/cards.json`
  không tồn tại. ⇒ **TRƯỢT**.
- **Sau lát mỏng (cờ bật):** `cards.json` có **1** thẻ; `GET /api/projects/<id>/dna` trả về thẻ
  đó với tầng phòng/kích thước điền, các tầng khác **rỗng**.

**Ca 2 — cổng "không bịa".**
Gõ đề bài chỉ có một dòng vô nghĩa: `abc`. Bấm sinh → bấm Nhận (nếu có option).
- **Mong đợi:** thẻ DNA được tạo **không** có tầng nào tự điền chữ. Mọi `DistilledField` phải
  hoặc rỗng hoặc mang căn cứ trỏ về đúng chuỗi `abc`. Nếu thấy bất kỳ chữ nào không có trong
  đề bài ⇒ **hỏng luật 5**, dừng lát mỏng.

**Ca 3 — cờ tắt = im lặng tuyệt đối.**
Bỏ `NEXT_PUBLIC_IF_BRIEF_DNA`, khởi động lại, mở DevTools → Network, lặp lại Ca 1.
- **Mong đợi:** **0** request tới `/api/projects/*/dna`. Entity vẫn được vẽ vào canvas,
  `localStorage` vẫn ghi history. Hành vi trùng khít bản trước khi sửa.

**`NOT ASSESSED`:** hành vi khi `uploads/` không ghi được (đĩa đầy / quyền). Chưa dựng được ca
tái hiện trong phiên này; `lib/dna/store.ts` chưa được đọc kỹ phần xử lý lỗi ghi.

---

## 7. Rủi ro nếu làm sai thứ tự

- **Vá `.docx` trước khi có nơi lưu** — tệ nhất. Thêm được đầu vào 20-50 trang rồi vẫn đổ vào
  `localStorage`, chỉ làm cái mất mát to hơn, và ăn quota `localStorage` nhanh hơn.
- **Thay stub `parseDescription` bằng LLM trước khi có nơi lưu** — đốt tiền để đẻ ra thứ bay hơi
  ngay khi F5. Chi phí cao nhất, giá trị giữ lại bằng 0.
- **Đẻ model `ConceptPackage` trong Prisma** — repo đã **4 lần** mắc đúng lỗi này. `DesignDnaCard`
  + `cards.json` đang trống chỗ và làm được việc; đẻ bảng thứ hai cho cùng một vật là khởi đầu
  của phân kỳ (luật 6).
- **Làm reopen trước khi làm write** — không có gì để đọc lại. Thứ tự bắt buộc là ghi → đọc.
- **Bỏ `localStorage` khi thêm ghi máy chủ** — mất tính năng khôi phục lúc gõ dở. Hai lớp phục vụ
  hai mục đích khác nhau, giữ cả hai.

---

## 8. Sai lệch so với lượt đo (đã xác minh lại trên `147f66a`)

| lượt đo ghi | mã thật `147f66a` | ghi chú |
|---|---|---|
| HEAD `ad26391` | HEAD **`147f66a`** | dòng đã trôi trên nhiều tệp |
| `brief-file.ts:14,23` cho `.docx` | `:14` là **docstring** khai `.docx` chưa nhận; nhánh trả `'word'` thật ở **`:37`**; `:23` là `BRIEF_FILE_ACCEPT` | kết luận không đổi, dòng đổi |
| `brief-file.ts:35` `briefFileKind()` | **`:34`** | lệch 1 |
| `ai-assist.ts:216` parse là stub | `:216` là **docstring** "TẦNG 1 (stub rule-based)"; hàm ở **`:220`** | cả hai đều đúng nghĩa |
| `ai-assist.ts:155` stub | ✅ đúng (mốc mục "TẦNG 1 — PARSE (stub…)") | — |
| `AiBriefPanel.tsx:341` "Nhận" | hàm `accept` ở **`:340`** (docstring `:335-338`) | lệch 1 |
| `lib/dna/types.ts:47` Thẻ DNA | `export interface DesignDnaCard` ở **`:48`** | lệch 1 |
| `lib/dna/store.ts:21,50` | `DNA_ROOT` **`:21`** ✅ · `cards.json` ở **`:53`** (không phải `:50`) | lệch 3 |
| `CadEditor.tsx:911`, `AiBriefPanel.tsx:157`, `:252`, `:297`, `:75-76`, `ai-assist.ts:559`, route DNA | ✅ **đúng nguyên** | — |
| "không dòng mã nào nối brief → DNA" | ✅ **xác nhận lại** — grep `aibrief` ngoài `AiBriefPanel.tsx` = 0 dòng | — |
