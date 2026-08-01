# Sổ CHỐT — quyết định đã chốt trong phiên Cowork 30/07/2026

> **File append-only.** Mỗi quyết định chốt xong ghi vào đây, không sửa dòng cũ.
> Lập vì Hoà chỉ ra: nhiều thứ đã chốt nhưng **chỉ nằm trong chat** — chat bị nén là mất,
> và Claude Code không đọc được chat.
>
> **LUẬT MỚI (Hoà chốt 30/07): mọi `.md` đã chốt, Cowork PHẢI tự lưu về `docs/`, không đợi nhắc.**
> Bù lại để chống doc sprawl: quyết định ngắn ghi **vào file này**, không đẻ file mới.

---

## 0 · Bù các quyết định đã chốt mà chưa lưu

Bảy mục dưới đây trước nay chỉ tồn tại trong chat. Nay ghi lại đầy đủ.

---

## 1 · LUẬT TRUNG TÍNH (Hoà đặt tên)

> **Nguồn phải trung tính với mọi đích.** `.idf` mô tả **CÁI GÌ** và **VAI TRÒ GÌ** —
> không bao giờ mô tả **TRÔNG THẾ NÀO**.

**Bốn hệ quả:**

**① Thêm một đích mới KHÔNG được sửa nguồn.** Phải sửa nguồn để thêm đích ⇒ nguồn chưa trung tính.
Đây là **phép thử tự động được**: viết một đích mới mà không chạm `.idf` là đạt.

**② Xoá một đích KHÔNG được mất dữ liệu.**

**③ Phép thử một trường:** *trường nào chỉ có nghĩa với đúng một đích thì đặt sai chỗ.*
`slideNotes` chỉ có nghĩa với PPTX → thuộc đích. `role: "cảnh báo"` có nghĩa mọi đích → thuộc nguồn.

**④ Ranh giới dễ nhầm nhất — ràng buộc NGHỀ ≠ thuộc tính TRÌNH BÀY:**

| Thuộc **nguồn** (ràng buộc nghề) | Thuộc **đích** (trình bày) |
|---|---|
| `≥300dpi` — luật in ấn | cỡ chữ · màu chữ |
| `tỉ lệ 1:20` — bản chất bản vẽ kỹ thuật | vị trí · khoảng cách · canh lề |
| `khổ A3 · hướng dọc` — chuẩn ISO | kiểu nét · độ đậm |
| `độ chín: đã chốt` | thứ tự trang · chia slide |
| `vai trò: bằng chứng` | font chữ |

**Phân biệt:** ràng buộc nghề **tồn tại kể cả khi không có đích nào**. Thuộc tính trình bày chỉ
sinh ra khi chọn đích.

**Áp cho cả ba tầng**, không riêng chặng 3:
- **ATLAS** lưu giá/đơn vị/mã — **không** lưu "hiện ở cột nào, màu gì"
- **IF2** lưu cấu kiện/thời gian/trạng thái — **không** lưu "cắt lớp tô màu gì"
- **ArchiNote** lưu số đo và ảnh — **không** lưu "hiện ở đâu trên màn hình"

**Cưỡng chế bằng test** (luật không có test thì 3 tuần là có người vi phạm): quét lược đồ `.idf`,
FAIL nếu thấy khoá trình bày — `fontSize · fontFamily · color · fill · x · y · left · top ·
margin · padding · zIndex · opacity · align`. Ngoại lệ hợp lệ ghi vào **danh sách miễn trừ có lý do**,
KHÔNG nới luật.

---

## 2 · Luật quy trình #10 · #11 · #12

**#10 — Tiêu chuẩn nghề thì tra rồi làm, KHÔNG hỏi.**
Thứ thuộc ISO/TCVN/Apple HIG/WCAG → tra chuẩn, làm đúng chuẩn. Chỉ hỏi khi là **quyết định sản phẩm**
(làm hay không · ưu tiên gì trước · đánh đổi gì).

**#11 — Mọi khối dán cho Claude Code phải có nhãn.** Ba dòng đầu:
`📋 DÁN CHO` · `🕐 KHI` · `♻️ THAY`.
Không bao giờ gửi nhiều khối cùng lúc mà không nói khối nào dùng, khối nào bỏ.

**#12 — Chỉ Claude Code cấp mã.** Cowork mô tả việc **không kèm số**; Claude Code gán, báo lại,
Cowork xác nhận. *(Ra đời sau va số `7.1.21` do hai bên cùng gán.)*

**#13 (mới, 30/07) — Cowork tự lưu `.md` đã chốt về `docs/`.** Không đợi nhắc. Quyết định ngắn
ghi vào chính file này để không đẻ thêm file.

---

## 3 · Bộ luật CHỮ VIỆT trên UI

Tiếng Việt có **dấu chồng** (dấu phụ + dấu thanh cùng một chữ) — Latin không có. **Dấu mang NGHĨA**
(phân biệt thanh điệu), không phải trang trí ⇒ dấu bị ép hoặc chữ quá nhỏ = **MẤT NGHĨA**, không chỉ
khó đọc.

| Luật | Lý do |
|---|---|
| `line-height` **≥ 1.5** (không dùng 1.2 kiểu Latin) | Dấu ăn lên không gian phía trên |
| **Cấm tracking âm**, cấm font condensed | Dấu chạm chữ liền kề |
| **Hạn chế `text-transform: uppercase`** cho chuỗi có dấu | Chữ hoa rất chật chỗ đặt dấu |
| **KHÔNG dùng font mono** cho chữ Việt | Ép mọi ký tự cùng bề rộng → dấu bị ép/chạm/cắt. **Đây là lý do sâu của mã `2.2.85`** |
| Chuỗi có dấu **tối thiểu 14px** | Dấu mang nghĩa; nhỏ quá là mất nghĩa |

**Ngoại lệ hợp lệ:** chuỗi kỹ thuật không dấu (`PDF` · `DXF` · `A3` · `CAD` · `BIM`) — uppercase và
mono đều được. Số/toạ độ/mã giữ `tabular-nums`.

**Cưỡng chế bằng test**, regex nhận dấu Việt:
`/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i`

*Nguồn: vietnamesetypography.com (Donny Trương) · Google Fonts diacritics guide.*

---

## 4 · Sao lưu — BỎ giới hạn 5 bản

**Hoà chốt:** bỏ giới hạn giữ 5 bản. Lý do: 5 bản × 10 phút = **chỉ 50 phút lịch sử**; sai từ hôm
qua là mất.

**Nhưng không phải "giữ tất cả"** — 48 bản/ngày × `.ifpack` đầy đủ ≈ **20 GB/năm/dự án**.
Ba việc:

**① Thang thời gian thay cho đếm số bản**

| Khoảng | Giữ |
|---|---|
| 1 giờ gần nhất | mọi bản |
| 24 giờ | 1 bản/giờ |
| 30 ngày | 1 bản/ngày |
| Xa hơn | 1 bản/tuần — **không giới hạn** |

≈ 60–80 bản nhưng phủ **toàn bộ đời dự án**. Ngưỡng vào CONFIG.

**② Lưu chênh lệch, không lưu bản đầy đủ.** `.idf` là JSON; một lần sửa chỉ đổi vài entity.
Snapshot đầy đủ mỗi 20 bản làm mốc, giữa là diff.
⚠️ Mỗi mốc phải **tự đứng được** — mất 1 diff không được kéo sập cả chuỗi. Phải có test đúng ca này.

**③ Hiển thị theo thang, không theo danh sách phẳng.** *"10 phút trước · 1 giờ · hôm qua 15:20 ·
thứ Hai · tuần trước"*. 1.000 dòng giống hệt nhau còn khó dùng hơn 5 dòng.

**④** Dự án đóng > 6 tháng: nén cả chuỗi vào `.ifpack` lạnh, ra khỏi ổ nóng.

---

## 5 · Cấu trúc Settings — nhóm theo PHẠM VI ẢNH HƯỞNG

**Nguyên tắc:** người dùng đi tìm cài đặt bằng câu hỏi *"cái này ảnh hưởng tới ai?"*, không phải
*"cái này thuộc chủ đề gì"*.

| Nhóm | Chứa | Gỡ nút thắt nào |
|---|---|---|
| **Của tôi** | avatar · sáng/tối · ngôn ngữ · mật độ · phím tắt | — |
| **Của dự án này** | khổ giấy · tỉ lệ · đơn vị · mức AI · **thư mục gốc dự án** · **chu kỳ + thang giữ backup** | **File Manager NT5 Pha 1** + **B1** |
| **Của studio** | tên công ty · logo · khung tên · ATLAS · Lark | **B4** — 44 chuỗi `TTT` cứng có nhà để về |

**Số đo hiện trạng phải sửa:** `max-w-2xl` (672px) → 760–820px · nhịp giữa nhóm/trong nhóm 32/16
(2:1) → ≥3:1 · thang chữ 20/15/12.5 → 22/16/14 · **body 12.5px vi phạm bộ luật chữ Việt** ·
nhóm AI 181 dòng vs 49–66 (chiếm ~60% trang) → gấp phần nâng cao vào mục thu gọn.

**Cần điều hướng** (rail trái ≥1024px / tab ngang <1024px) — vì sắp thêm ảnh nền, giao diện tuỳ chỉnh,
avatar, mật độ `2.2.79`. Dựng cấu trúc **trước khi** phình.

---

## 6 · THƯ VIỆN — phương án D (Hoà chốt)

> **Một thư viện duy nhất. Tuỳ ngữ cảnh đề xuất thứ tối ưu thuộc về chặng đó. Thông tin chia sẻ
> xuyên suốt.**

### Hiện trạng: 5 thứ gọi là "thư viện", thuộc 3 HỌ khác bản chất

| Họ | Mặt tiền | Ghi chú |
|---|---|---|
| **A · Ảnh tham khảo** (`/api/library`) | `LibraryPanel.tsx` (317d) · `present-editor/LibraryBrowser.tsx` (354d) · `photo-editor/LibraryPickerModal.tsx` (131d) | Ba cái cùng API nhưng **mỗi cái tự viết lại** duyệt/gom/xoá |
| **B · Block CAD** (file `.dxf`) | `lib/cad/block-library.ts` (218d) · `lib/cad/furniture.ts` | ⚠️ **Đã có 2 thư viện song song chưa gộp ngay trong họ B**. `block-library.ts` **xây xong nhưng chưa lộ mặt tiền nào** |
| **C · Vật liệu ATLAS** | — | 1.449 vật liệu có giá. **IF chưa đọc lần nào** |

⚠️ **KHÔNG phải thư viện tài sản:** `NodeLibraryPanel.tsx` = danh mục node. Ai làm NT1 mà gộp luôn
cái này là hỏng.

🟢 **Cơ chế "đề xuất theo chặng" ĐÃ CÓ**: `orderCategoriesByPhase()` + `phaseRelevance()` trong
`LibraryPanel.tsx`. Nó chỉ đang **bị nhốt trong một mặt tiền và chỉ biết ảnh**.

### Hình dạng đúng: lõi chung mỏng + phần riêng theo `kind`

Đừng ép ba họ vào model phẳng — ra mẫu số chung thấp nhất, phục vụ được ai cả.
**IF đã giải đúng bài toán này một lần ở `ParamDef` (9 kind)** — lặp lại khuôn đó.

**Lõi chung:** `id · tên · thumbnail · nguồn · thẻ · gu/style tag · dự án · lần dùng cuối · ai thêm`

| `kind` | Mang thêm |
|---|---|
| `image` | bảng màu · phân loại tự động · kích thước pixel · **nguồn gốc + quyền dùng** |
| `block` | hình học · kích thước **mm** · số entity · lớp mặc định |
| `material` | **giá · đơn vị · mã thay thế · nhà cung cấp · hao hụt %** (ATLAS) |

### Ngữ cảnh — mỗi họ khai nó phục vụ chặng nào

| Ở chặng | Lên đầu | Thứ hai | Chìm |
|---|---|---|---|
| **CAD** | block | vật liệu *(gán vùng tô)* | ảnh tham khảo |
| **Render** | ảnh gu / moodboard | vật liệu *(đổi vật liệu)* | block |
| **Present** | ảnh kết quả + ảnh gu | vật liệu dạng **thẻ thông số** | block (ẩn) |

### "Chia sẻ xuyên suốt" — nghĩa đúng

**Không phải** "mọi chặng thấy mọi thứ" (đổ đống). Mà là **mỗi tài sản mang theo LỊCH SỬ DÙNG
xuyên chặng**: ảnh gu này dẫn tới render nào · vật liệu này gán vùng tô nào, tờ nào, **ra bao nhiêu
tiền trong BOQ nào** · block này đặt ở bản vẽ nào.

→ Đó chính là trường **`Quan hệ`** trong lớp mô tả nội dung của chặng 3. **Hai việc là một việc.**

**Hệ quả mạnh nhất:** vật liệu ATLAS nằm chung thư viện + mang quan hệ ⇒ **đổi vật liệu ở chặng 2
biết giá ngay tại chỗ**. Render xong biết luôn đắt hay rẻ, chưa cần chạy BOQ. Thư viện thôi làm kho
ảnh, thành **công cụ ra quyết định**.

### Bốn bẫy phải chặn

**①** Đừng ép ba họ vào model phẳng — union theo `kind`.
**②** Đừng để "xuyên suốt" thành "đổ đống mọi nơi" — chia sẻ là **quan hệ**, không phải hiển thị.
**③** ATLAS là nguồn **ngoài** — cache, chỉ đọc, có `syncedAt`.
**④** ⚠️ **Bản quyền ảnh nguồn ngoài.** `LibraryBrowser.tsx` nhận ảnh từ Unsplash · Openverse ·
**dán URL (Pinterest)** — chung một rổ. Unsplash/Openverse có giấy phép; **Pinterest thì không.**
⇒ Mỗi ảnh phải mang cờ **`dùng được trong hồ sơ` / `chỉ tham khảo nội bộ`**, và **preflight chặng 3
CHẶN** khi ảnh "chỉ nội bộ" lọt vào bản xuất. Lỗi im lặng, phát hiện khi khách hỏi thì đã muộn.

---

## 7 · Chặng 3 là HÀM CHIẾU, không phải chặng

Tóm tắt — bản đầy đủ ở `docs/TU-VAN-CHANG-3-VA-IF2-2026-07-30.md` và
`docs/NGHIEN-CUU-TAM-NHIN-IDF-2026-07-30.md`.

> CAD và Render sản xuất **SỰ THẬT**. Chặng 3 **chiếu** sự thật đó vào từng khuôn đích
> (PDF in · PPTX · XLSX · phim · **tablet công trường**). **IF2 chỉ là thêm một khuôn đích nữa.**

Ngành gọi mô hình này là **single-source publishing** (chuẩn DITA, đã có 30 năm) — hướng đi được xác
nhận, không phải đánh cược.

⚠️ **Đính chính đã ghi:** tôi từng nói "chặng 3 thiếu preflight" — **sai**.
`lib/present-editor/standards.ts` (`DECK_STANDARDS`) + `layout-check.ts` **đã có và có test**.
Sự thật là **có HAI cỗ máy preflight song song** — `Violation` (chặng 1) và `LayoutWarning` (chặng 3),
hai kiểu dữ liệu khác nhau. Việc phải làm là **GỘP** (`7.1.18`), không phải **XÂY**.

---

## 8 · Danh sách việc đang treo (chốt lúc 30/07)

| | Việc | Trạng thái | Rủi ro |
|---|---|---|---|
| 1 | **B3 — thử tay sập/phục hồi** | **chưa làm lần nào** | 🔴 mất dữ liệu thật |
| 2 | `2.2.87/88` chưa verify ảnh thật | 🟡 | 🔴 số sai đi tới xưởng |
| 3 | **B2 `2.2.76`** — 2 nút "In 300dpi" vẫn `disabled` | ⬜ | 🟡 |
| 4 | **B4** — 44 chuỗi `TTT` cứng / 25 file | ⬜ | 🟡 chặn bán ra ngoài |
| 5 | `7.1.19` bước 5 (call Lark thật) | 🟡 | chờ 3 khoá của Hoà |
| 6 | `2.2.70` ảnh bìa thật | 🟡 | chờ duyệt credit |
| 7 | `7.1.22` Bộ nhớ đo đạc | ghi cây, chưa code | — |
| 8 | Header tràn 179px@640 · 51px@768 | chưa cấp mã | 🟡 |
| 9 | `2.2.79` `ToolModeForm` `1fr 1fr` cứng | 🟡 | — |
| 10 | Lớp mô tả nội dung · preflight theo đích | đã bàn, chưa vào cây | — |
| 11 | Doc sprawl — ~25 file phiên 29-30/07 | chưa gộp | 🟡 |

**Chỉ Hoà làm được:** 3 khoá Lark (`.env.local`) · thử 1 ảnh thật ở "Đo món đồ" · duyệt credit `2.2.70`.

---

*Sổ chốt lập 30/07/2026. Append-only — thêm mục mới ở cuối, không sửa mục cũ.*

---

## [2026-07-31] Khoá Lark đã vào — mở đường ĐỢT 3

| Việc | Trạng thái |
|---|---|
| `LARK_APP_ID` · `LARK_APP_SECRET` (32 ký tự) · `LARK_ATLAS_NODE_TOKEN` trong `.env.local` | ✅ đủ 3, **không trùng khoá**, `.env.local` **không bị git theo dõi** |
| Quyền ATLAS (mời app + đổi chia sẻ link) | ❌ **CHƯA LÀM** — Hoà xác nhận "xong key thôi". Vẫn treo 2 việc: mời app làm cộng tác viên, và **đổi chia sẻ link từ "ai cũng SỬA được"** trên 1.449 bản ghi có giá |

**Quyết định thứ tự:** KHÔNG vào ĐỢT 3. Chạy **cổng thông mạch 2 phút** để TÁCH hai loại lỗi:
`tenant_access_token` (kiểm khoá) → `list_tables` trên ATLAS (kiểm quyền).

| Kết quả | Nghĩa | Làm gì |
|---|---|---|
| token ❌ | khoá sai/chép thiếu | chép lại secret |
| token ✅ · list_tables ❌ | **khoá đúng, thiếu quyền** — dự kiến đúng ca này | Hoà đi hướng A→C |
| cả hai ✅ | thông | đối chiếu `ATLAS_FIELD_NAMES` → ĐỢT 3 |

Trong lúc chờ quyền, Claude Code làm `7.1.23` (không kẹt gì).

**Lý do:** `ATLAS_FIELD_NAMES` còn là placeholder. Viết engine tính tiền trên tên cột đoán =
sai số tiền im lặng — đúng loại lỗi đã chặn ở `priceNote`.

**Bù tài liệu:** `7.1.23` mục ③④⑤ (tin nhắn 30/07 bị cắt) đã đủ ở
`docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`.

---

## [2026-07-31] ATLAS · hướng A loại, chốt hướng C + phát hiện ký tự ẩn

**Khám thật (Claude web đọc UI Lark, chỉ đọc, không đổi):**

| Chỗ | Kết quả |
|---|---|
| Ô "Mời cộng tác viên" | placeholder *"Tìm kiếm người dùng, nhóm, phòng ban, nhóm người dùng"* — **không có app/bot**. Gõ `InteriorFlow` → không kết quả |
| Hộp "Cài đặt quyền" | đọc hết — **không có chữ ứng dụng/app/bot ở đâu**. Toàn bộ chỉ nói về người và tổ chức |
| Vị trí ATLAS | *"Thư viện tài liệu của tôi"* (personal wiki). Breadcrumb `Tổ chức của Trần Ben › Trần Ben › ATLAS`, badge **"Bên ngoài"** |
| URL | `…/wiki/Ejk6wjlXoiWN80khYcRjthy3prd?table=tblhr9Y0otz9SIji` |

⇒ **Hướng A LOẠI** (bản chất Lark, không phải tìm thiếu). **Hướng B bỏ.** **CHỐT HƯỚNG C** —
chuyển ATLAS ra Drive.

**Chi phí hướng C = 1 dòng env, KHÔNG sửa code.** `lib/integrations/providers/lark.ts:55` đã nhận
`LARK_ATLAS_APP_TOKEN` **hoặc** `LARK_ATLAS_NODE_TOKEN`. Ra Drive còn bỏ được cả tầng quyền Wiki
mà `resolveWikiAppToken()` (`wiki/v2/spaces/get_node`) đang cần.

### ⚠️ Phát hiện an ninh — ký tự ẩn trong tên tài liệu ATLAS

Tiêu đề tab chứa **chuỗi ký tự zero-width** chèn trước chữ "ATLAS". Không đọc ra nghĩa, không chứa
chỉ dẫn. Nhưng ATLAS đang mở **"bất kỳ ai có liên kết đều CHỈNH SỬA được"** trên 1.449 bản ghi.

**Vì sao đây là việc của code, không chỉ việc dọn dẹp:** ĐỢT 3 sẽ đọc tên vật liệu ATLAS → vào BOQ
→ vào prompt của các tầng AI. Ký tự ẩn trong dữ liệu ngoài chảy thẳng vào prompt là **đường tiêm
chỉ thị**. Trường `raw` của `ProductSpec` lưu nguyên văn ⇒ lưu luôn cả ký tự ẩn.

**Yêu cầu cho ĐỢT 3** (chưa cấp mã — Luật #12):
- `listAtlasMaterialRecords()` **chuẩn hoá mọi chuỗi khi NHẬP**: NFC + gỡ zero-width
  (U+200B–U+200D, U+2060, U+FEFF) + gỡ ký tự điều khiển bidi (U+202A–U+202E, U+2066–U+2069)
- Gỡ ở **tầng nhập**, không phải tầng hiển thị — để `raw` cũng sạch
- **Ghi log** khi có bản ghi bị gỡ (bao nhiêu bản ghi, cột nào) — im lặng là mất tín hiệu
- Test: chuỗi có zero-width ⇒ sau nhập phải bằng chuỗi sạch
- Nguyên tắc: **dữ liệu ATLAS là đầu vào KHÔNG TIN CẬY**, kể cả khi là bảng của công ty
