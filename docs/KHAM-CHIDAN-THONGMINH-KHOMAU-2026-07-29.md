# Hệ chỉ dẫn thông minh · Kho mẫu biểu mẫu — KHÁM + TƯ VẤN

> 2 việc Hoà giao. Khám code thật trước (Luật #4/#5), nghiên cứu ngoài để đối chiếu.

---

# A · HỆ CHỈ DẪN THÔNG MINH

## A1. KHÁM — IF đã có hệ 3 tầng, kiến trúc ĐÚNG, nhưng gần như rỗng ruột

Đọc `lib/resume.ts` + `components/onboarding/`: IF **đã xây sẵn** hệ chỉ dẫn phân tầng, đúng nguyên
tắc "không hiện chình ình" Hoà mô tả.

| Tầng | Cơ chế | Hiện lúc nào | File | Trạng thái thật |
|---|---|---|---|---|
| **1 · Chào** | `tourDone` | 1 lần/user, lần đầu vào app | `entry/WelcomeIntro.tsx` | ✅ chạy |
| **2 · Vào chặng** | `stageIntroSeen` | 1 lần/chặng, lần đầu mở chặng đó | `onboarding/StageIntroCard.tsx` | ✅ chạy |
| **3 · Coachmark** | `coachmarkSeen` | 1 lần/thao tác, đúng lúc chạm vào | `resume.ts:191-227` | 🟡 **có khung — nhưng cả app đúng 1 cái** |

Bằng chứng tầng 3 rỗng, nguyên văn `resume.ts:227`:

```
export const COACHMARKS: readonly string[] = ['selectMove'];
```

**Một coachmark duy nhất** (`selectMove` ở `CadCanvas.tsx`) cho một app có **45 node · 3 chặng ·
2 trình sửa riêng**. Nghĩa là tầng chỉ dẫn *đúng lúc, đúng chỗ* — tầng có giá trị nhất — thực tế
**chưa được dùng**.

Điểm yếu thứ hai: cả 3 tầng chỉ có **một loại kích hoạt duy nhất là "lần đầu nhìn thấy X"**. Không
có kích hoạt nào theo **hành vi** (đang lúng túng, làm sai lặp lại, dừng lâu không bấm gì).

Có sẵn "Xem lại hướng dẫn" trong menu ⋯ (`Header.tsx:201-211`) reset đủ cả 3 tầng — tốt, giữ nguyên.

## A2. Nghiên cứu ngoài — 8 mẫu chỉ dẫn 2026 và tín hiệu kích hoạt

Khảo sát (Chameleon · SetProduct · Userpilot):

**8 mẫu**: chỉ dẫn nội tuyến (icon ? cạnh phần tử) · tooltip · modal · **HelpBar** (ô tìm kiếm hỏi
bằng câu tự nhiên, AI trả lời) · checklist · tour tuần tự · lightbox · banner.

**Tín hiệu kích hoạt theo hành vi** (đây là phần IF hoàn toàn chưa có):

- chuột đứng yên ≥5 giây → dấu hiệu đang phân vân
- bấm lặp lại cùng 1 nút → thao tác thất bại
- lần đầu chạm vào 1 tính năng
- ở lì trên 1 màn quá lâu

**Kết luận quan trọng của ngành**: không phải "tour thì dở, contextual thì hay" — mà là **tour
chung chung thì phiền; tour bắn đúng theo hành vi thì vẫn hiệu quả**. Chia làm 2 chiều:

| Chiều | Nghĩa | IF có chưa |
|---|---|---|
| **Chủ động** (proactive) | App tự bật khi đoán user đang kẹt | ⛔ chưa |
| **Bị động** (reactive) | User tự đi tìm khi cần | ⛔ chưa |

## A3. ĐỀ XUẤT — thêm 2 tầng, và tái dùng 2 thứ đã có sẵn

### Giữ nguyên tầng 1-2-3, thêm tầng 4-5

| Tầng | Tên | Kích hoạt | Hình thức |
|---|---|---|---|
| 1 | Chào | lần đầu vào app | modal 1 lần ✅ |
| 2 | Vào chặng | lần đầu mở chặng | thẻ nhỏ góc màn ✅ |
| 3 | Coachmark | lần đầu chạm 1 thao tác | bong bóng trỏ vào đúng chỗ 🟡 **cần lấp đầy** |
| **4** | **Theo hành vi** *(mới)* | dừng ≥8s không thao tác · bấm Render lỗi 2 lần liên tiếp · thả file sai định dạng · mở node lần đầu | 1 dòng gợi ý mảnh ở chân màn, tự tắt sau 6s, có nút "Đừng nhắc nữa" |
| **5** | **Tra cứu chủ động** *(mới)* | user tự hỏi | **gõ thẳng vào Vitals** |

### Hai thứ tái dùng — không viết mới (Luật #6)

**① 45 `description` đã viết sẵn = 45 bài chỉ dẫn.** Mỗi node trong registry đã có sẵn mô tả rất
tốt, ví dụ nguyên văn `ai.pattern`:

> *"Hoa văn cho vách · giấy dán tường · thảm · gạch · rèm. **Nối ẢNH MẪU vào input Reference để giữ
> đúng motif (Chăm/Khmer/Đông Sơn…) — chỉ tả bằng chữ thì AI hay chệch sang mandala/damask.**"*

Đó **chính là** nội dung coachmark tầng 3 nên hiện lần đầu người dùng mở node đó. **Không phải viết
gì thêm** — chỉ cần nối `description` vào cơ chế `coachmarkSeen` sẵn có. Lấp đầy tầng 3 từ 1 lên 45
với chi phí gần bằng 0.

**② Vitals làm HelpBar.** IF đã có Vitals (viên ở đáy màn, entry point AI duy nhất). **Đừng xây hệ
help thứ hai** — tầng 5 chính là Vitals, chỉ cần dạy nó đọc `IF-FEATURE-TREE.md` + 45 description để
trả lời "làm sao để…". Một trợ lý, một chỗ hỏi.

### Nguyên tắc "không chình ình" — 4 luật cứng

1. **Không bao giờ 2 lớp chỉ dẫn cùng lúc** — tầng thấp hơn im nếu tầng cao đang hiện.
2. **Mọi thứ tự bật đều tự tắt** (≤8s) và đều có "Đừng nhắc nữa".
3. **Tầng 4 tối đa 1 lần/phiên/loại** — kẹt lần nữa thì im, không cằn nhằn.
4. **Không có checklist onboarding** — người dùng IF là dân nghề, không phải người dùng SaaS cần
   dắt tay; họ vào là để làm việc thật.

---

# B · KHO MẪU BIỂU MẪU — ô thứ 6 của chặng Present

## B1. KHÁM — hạ tầng đã có đủ, chỉ thiếu NỘI DUNG

| Mảnh cần | IF đã có gì | Ở đâu |
|---|---|---|
| Nhóm "Template" trong thư viện | ✅ đã khai báo — 1 trong 8 nhóm nội dung của Library | `docs/SPEC-IF-LIBRARY.md` |
| Đọc template từ thư viện ra kệ | ✅ `templatesFromLibrary(assets)` | `lib/present-editor/templates.ts:9-10` |
| User tự lưu slide thành template | ✅ PS-2, nhóm `'mine'` | `lib/present-editor/custom-templates.ts` |
| 4 kệ phân loại | ✅ Bìa · Bìa phụ · Nội dung chính · Trang kết | `templates.ts:53-63` |
| **Kho mẫu tuyển chọn sẵn** | ❌ **rỗng** | — |

→ Giống hệt 3 việc trước trong phiên: **IF không thiếu hệ thống, IF thiếu nội dung đổ vào hệ thống**.
Việc này **không phải việc code**, mà là **việc thiết kế + nhập liệu**.

## B2. Ô thứ 6 — "Kho mẫu" (chốt theo yêu cầu 5 → 6 ô)

Bố cục màn chọn chặng 3 thành 6 ô: 5 khổ giấy + **1 ô Kho mẫu** (khác màu, có viền nhấn) dẫn thẳng
sang Thư viện lọc sẵn nhóm Template.

## B3. Phân loại kho mẫu — 4 nhóm, bám việc thật

| Nhóm | Nội dung | Khổ |
|---|---|---|
| **Hồ sơ thiết kế** | Bìa hồ sơ · trang mục lục · board concept · bảng vật liệu · spec sheet nội thất · trang so sánh phương án · trang mặt bằng chú thích | A3 · A4 |
| **Văn phòng · Giấy tờ** | Báo giá · hợp đồng thi công · biên bản nghiệm thu · **biên bản họp** · phiếu yêu cầu đổi thiết kế · nhật ký công trường · phiếu giao hàng | A4 |
| **Tem nhãn · Bảng mẫu** | **Tem dán mẫu vật liệu** (mã · tên · nhà cung cấp · kích thước) · nhãn dán board · thẻ treo mẫu vải · tem đánh số phòng · nhãn hộp mẫu | Tem 40×25 · 70×37mm, in A4 nhiều tem/tờ |
| **Trình bày · Thuyết trình** | Bìa thuyết trình · trang tiêu đề chương · trang ảnh lớn · trang 2-3 cột · trang kết/liên hệ | 16:9 · A3 |

**Nhóm "Tem nhãn · Bảng mẫu" là nhóm khác biệt nhất** — không app trình bày nào ngoài kia có, vì nó
là nhu cầu riêng của nghề nội thất (dán tem lên bảng mẫu vật liệu giao khách). Đây là thứ khiến kho
mẫu IF **không thể thay bằng Canva**.

## B4. Ba luật cho kho mẫu

1. **Sửa được, không phải ảnh chết** — mọi mẫu là `EditorSlide` với phần tử thật, đúng cơ chế
   `build(ctx)` đang có; chọn xong sửa được ngay từng chữ, từng ô.
2. **Tự ăn theo Thẻ Gu và Nhận diện** — mẫu dùng `palette`/`fonts` từ `TemplateContext` sẵn có
   (`templates.ts:29-37`), nên chọn 1 mẫu là nó **tự đổi màu theo brand đang dùng**, không phải sửa
   tay. Đây là điểm Canva **không làm được ở mức này**.
3. **Có mã trong Library như mọi asset khác** — theo đúng "xương sống chung" của
   `SPEC-IF-LIBRARY.md` (id · type · nguồn+giấy phép · thẻ · thống kê dùng), để đếm được mẫu nào hay
   dùng, mẫu nào bỏ xó.

⚠️ **Cảnh báo bản quyền**: kho mẫu "tuyển chọn đẹp" rất dễ dẫn tới chép bố cục từ nguồn có bản
quyền. `SPEC-IF-LIBRARY.md` đã có sẵn mục quy định giấy phép — **mọi mẫu trong kho phải ghi rõ nguồn
+ giấy phép**, tự vẽ hoặc dùng nguồn tự do. Không có ngoại lệ, vì đây là thứ đem giao khách.

---

## C · Xếp hàng (Luật #8b)

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `7.20` | **Lấp đầy tầng 3**: nối 45 `description` vào `coachmarkSeen` — coachmark tự sinh cho mọi node | **Rất rẻ** (nội dung đã viết sẵn) | **Sprint 3** — rẻ nhất, giá trị cao nhất trong nhóm này |
| `7.21` | **Tầng 4 — chỉ dẫn theo hành vi** (4 tín hiệu + 4 luật không-chình-ình) | Trung bình | Sprint 4 |
| `7.22` | **Tầng 5 — Vitals trả lời "làm sao để…"** (đọc cây tính năng + 45 description) | Trung bình | Sprint 4, sau 7.20 |
| `3.30` | **Ô thứ 6 "Kho mẫu"** ở màn chọn chặng 3 + lọc Library theo nhóm Template | Rẻ | **Sprint 3, cùng đợt 2.3.61** (cùng màn hình) |
| `3.31` | **Nội dung kho mẫu — đợt 1**: 4 nhóm × 6 mẫu = 24 mẫu, ưu tiên nhóm Tem nhãn (khác biệt nhất) | Trung bình — **việc thiết kế, không phải việc code** | Sprint 4-5, làm dần |

---

*Cowork, 29/07/2026. Đã đọc: `lib/resume.ts`, `components/onboarding/StageIntroCard.tsx`,
`Header.tsx:197-211`, `lib/present-editor/templates.ts`, `custom-templates.ts`,
`docs/SPEC-IF-LIBRARY.md`. Nghiên cứu ngoài: Chameleon (8 mẫu chỉ dẫn + tín hiệu hành vi),
SetProduct, Userpilot. Mã 7.20-7.22 / 3.30-3.31 là ĐỀ XUẤT — Claude Code kiểm tra trùng số.*
