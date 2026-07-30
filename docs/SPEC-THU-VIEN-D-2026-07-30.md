# SPEC · THƯ VIỆN D — một thư viện, ba họ, theo ngữ cảnh

> Hoà chốt phương án **D** (30/07): *"Một thư viện duy nhất. Tuỳ ngữ cảnh nó đề xuất thứ tối ưu
> vốn thuộc về chặng đó. Thông tin luôn được chia sẻ xuyên suốt."* — và gật cả 4 bẫy.
>
> **Không đánh số mã** (Luật #12 — Claude Code cấp). Tài liệu này thay phần "NT1 gộp 4 UI Library"
> ở `FILEMANAGER-SPRINT-2026-07-29-v2.md`: phạm vi thật **lớn hơn** NT1 mô tả.

---

## 1 · Vì sao NT1 chưa đủ

NT1 viết *"gộp 4 UI Library thành 1 model `LibraryAsset`"*. Khám thật ra **5 mặt tiền thuộc 3 HỌ
khác bản chất** — gộp giao diện của ba họ khác bản chất vào một model phẳng là chỗ dễ hỏng nhất.

| Họ | Mặt tiền | Bản chất |
|---|---|---|
| **A · Ảnh tham khảo** | `LibraryPanel.tsx` (317d) · `present-editor/LibraryBrowser.tsx` (354d) · `photo-editor/LibraryPickerModal.tsx` (131d) | pixel · server `/api/library` · có phân loại + bảng màu |
| **B · Block CAD** | `lib/cad/block-library.ts` (218d) · `lib/cad/furniture.ts` | hình học · đơn vị **mm** · file `.dxf` trên đĩa |
| **C · Vật liệu** | *(chưa có mặt tiền)* | **giá tiền** · nguồn ngoài (ATLAS/Lark) · 1.449 bản ghi |

**Ba nhận định phải nhớ khi làm:**

🟢 **Cơ chế "đề xuất theo chặng" ĐÃ CÓ** — `orderCategoriesByPhase()` + `phaseRelevance()` trong
`LibraryPanel.tsx`. Nó chỉ đang bị nhốt trong một mặt tiền và **chỉ biết ảnh**. → Nâng lên dùng chung,
đừng viết lại.

⚠️ **Ngay trong họ B đã có hai thư viện song song chưa gộp.** `block-library.ts` ghi rõ nó **cố ý
không đụng** `furniture.ts`, và tự ghi *"cách nối vào panel Thư viện nội thất thật (sau này)"* —
tức **đã xây xong mà chưa lộ mặt tiền nào**.

⛔ **`NodeLibraryPanel.tsx` KHÔNG phải thư viện tài sản** — đó là **danh mục node**. Thấy chữ
"Library" mà gộp vào là hỏng.

---

## 2 · Mô hình dữ liệu — lõi mỏng + union theo `kind`

Ép ba họ vào một model phẳng sẽ ra **mẫu số chung thấp nhất**, phục vụ được ai cả.
**IF đã giải đúng bài toán này một lần rồi ở `ParamDef` (9 kind)** — lặp lại đúng khuôn đó.

### Lõi chung — mọi tài sản đều có

```
id · kind · tên · thumbnail · nguồn · thẻ[] · styleTag[] · projectIds[]
· lastUsedAt · addedBy · createdAt
```

### Phần riêng theo `kind`

| `kind` | Trường riêng |
|---|---|
| `image` | `palette[]` · `autoClass` · `pxW/pxH` · **`usageRight`** (§5) · `externalSource` |
| `block` | `dxfPath` · `entityCount` · `sizeMm{w,d,h}` · `defaultLayer` · `category` |
| `material` | `atlasRecordId` · `unit` · `refPrice` · `altCode` · `supplier` · `wastePct` · `packSpec` · `syncedAt` |

**Luật:** không trường nào ở lõi mà chỉ một `kind` dùng được. Trường nào chỉ một họ hiểu ⇒ xuống
phần riêng. *(Cùng phép thử của **Luật Trung Tính** ③.)*

> ⚠️ **SỬA 30/07 khuya (`2.1.9.r`, khám khi làm AtlasMaterial cho BOQ)**: hàng `material` ở bảng
> trên **KHÔNG cần dựng model union mới** — `ProductSpec{kind:'material'}` (`prisma/schema.prisma`)
> đã có ĐÚNG bộ trường này rồi (mở rộng 30/07: `unit`/`priceVnd`(≈`refPrice`)/`wastagePercent`
> (≈`wastePct`)/`packagingSpec`(≈`packSpec`)/`altSku`(≈`altCode`)/`styleTags`, cộng `vendor`
> (≈`supplier`) và `larkRecordId`(≈`atlasRecordId`) đã có sẵn từ trước). Và **quan trọng hơn**:
> `ProductSpec` đã có sẵn ĐỦ 3 khoá nối đúng "ba họ" tài liệu này mô tả — `imageAssetId` (→ họ A,
> `LibraryAsset`) · `drawingBlock` (→ họ B, `BlockDef`/manifest) · `larkRecordId` (→ họ C, ATLAS).
> ⇒ **"Một thư viện, ba họ" là KHUNG NHÌN (view/query) join qua `ProductSpec`, KHÔNG phải bảng
> union mới** — rẻ hơn nhiều so với phương án lõi-mỏng-union ở trên. Giữ nguyên tài liệu này làm
> tư duy NGỮ CẢNH (§3 trở xuống — "chặng nào ưu tiên họ nào" vẫn đúng, không đổi), chỉ SỬA phần
> mô hình dữ liệu §2: khi làm thật, join 3 bảng có sẵn thay vì tạo bảng lõi mới.

---

## 3 · Ngữ cảnh — mỗi họ tự khai nó phục vụ chặng nào

Không hard-code bảng ưu tiên trong UI. Mỗi `kind` khai **vai trò theo chặng**, thư viện xếp theo
điểm liên quan — mở rộng chính `phaseRelevance()` đã có.

| Ở chặng | Lên đầu | Thứ hai | Chìm xuống |
|---|---|---|---|
| **CAD** | `block` | `material` *(gán vùng tô)* | `image` |
| **Render** | `image` *(gu / moodboard)* | `material` *(đổi vật liệu)* | `block` |
| **Present** | `image` *(kết quả + gu)* | `material` *(dạng thẻ thông số)* | `block` (ẩn) |

**Luật:** "chìm xuống" ≠ "ẩn đi". Người dùng vẫn tìm được bằng ô tìm kiếm — thư viện **gợi ý**,
không **giới hạn**.

---

## 4 · "Chia sẻ xuyên suốt" = QUAN HỆ, không phải hiển thị

Đây là phần giá trị nhất, và cũng dễ làm sai nhất.

**Sai:** mọi chặng thấy mọi thứ → đổ đống.
**Đúng:** mỗi tài sản mang theo **LỊCH SỬ DÙNG xuyên chặng**.

| Tài sản | Mang theo |
|---|---|
| Ảnh gu | đã dẫn tới **render nào** |
| Vật liệu | đã gán **vùng tô nào · tờ nào** · **ra bao nhiêu tiền trong BOQ nào** |
| Block | đã đặt ở **bản vẽ nào · tờ nào** |

Bảng quan hệ tối thiểu: `assetId · targetKind · targetId · stage · createdAt`.

→ Đây **chính là** trường `Quan hệ` trong lớp mô tả nội dung của chặng 3. **Hai việc là một việc —
làm một lần, dùng cho cả hai.** Đừng dựng hai bảng quan hệ.

### ⭐ Hệ quả mạnh nhất

Vật liệu ATLAS nằm chung thư viện + mang quan hệ ⇒ **đổi vật liệu ở chặng 2 biết giá ngay tại chỗ.**
Render xong biết luôn đắt hay rẻ, chưa cần chạy BOQ.

Đó là lúc thư viện thôi làm kho ảnh và thành **công cụ ra quyết định** — và là thứ không công cụ AI
nào ngoài kia có, vì họ không có bảng vật liệu của TTT.

---

## 5 · ⚠️ QUYỀN DÙNG ẢNH — rủi ro pháp lý thật, phải chặn bằng máy

`LibraryBrowser.tsx` hiện nhận ảnh từ **Unsplash · Openverse · dán URL (Pinterest)** — **chung một rổ,
không phân biệt**. Unsplash/Openverse có giấy phép dùng được; **ảnh dán từ Pinterest thì không**.

Ảnh tham khảo nội bộ lọt vào **hồ sơ gửi khách** là rủi ro thật cho studio — và là **lỗi im lặng**:
phát hiện khi khách hỏi thì đã muộn.

### Cơ chế

Mỗi `image` mang `usageRight`, **bắt buộc, không có giá trị mặc định "không biết"**:

| Giá trị | Nghĩa | Nguồn điển hình |
|---|---|---|
| `deliverable` | **dùng được trong hồ sơ gửi khách** | ảnh do TTT tự chụp/render · Unsplash · Openverse |
| `internal` | **chỉ tham khảo nội bộ** | dán URL · Pinterest · ảnh nguồn không rõ |
| `licensed` | có giấy phép riêng — kèm ghi chú | ảnh mua |

**Luật cưỡng chế:**
- Nhập từ nguồn ngoài **không xác định được giấy phép** ⇒ mặc định `internal`, **không hỏi, không đoán**
- Người dùng nâng lên `deliverable` được, nhưng **phải xác nhận có chủ đích** và **ghi log ai nâng**
- **Preflight chặng 3 CHẶN** khi ảnh `internal` lọt vào bản xuất — chặn cứng, không phải cảnh báo mờ
- Thư viện hiện **dấu nhìn thấy được** trên thumbnail ảnh `internal`

---

## 6 · Nối với các việc khác

| Việc | Quan hệ |
|---|---|
| **NT1** (gộp UI Library) | Tài liệu này **thay** phạm vi NT1 — rộng hơn: 3 họ, không phải 4 UI |
| **NT5 Pha 1** (cây thư mục thật) | Tài sản `image`/`block` chuyển sang `~/InteriorFlow/...`. **Chỉ động vào lớp lưu trữ MỘT lần** — làm cùng đợt |
| **ATLAS / Lark** | `material` là **cache chỉ-đọc**, có `syncedAt`. Chờ 3 khoá Lark của Hoà |
| **BOQ** | Quan hệ vật liệu→vùng tô→tiền chính là đường BOQ. Dùng chung bảng quan hệ |
| **Chặng 3 · lớp mô tả nội dung** | Bảng quan hệ **dùng chung**, không dựng hai |
| **Settings · "Của dự án này"** | Thư mục gốc tài sản đặt ở đó |
| **`block-library.ts`** | Đã xây xong, **chưa có mặt tiền** — đây là lúc lộ ra |

---

## 7 · Thứ tự làm

| # | Việc | Vì sao trước |
|---|---|---|
| **1** | Model lõi + union `kind` + bảng quan hệ | Nút thắt. Mọi thứ sau đọc từ đây |
| **2** | Nâng `phaseRelevance()`/`orderCategoriesByPhase()` lên dùng chung 3 họ | **Đã có**, chỉ mở rộng — rẻ nhất |
| **3** | `usageRight` + dấu trên thumbnail + preflight chặn ở chặng 3 | Rủi ro pháp lý — làm sớm, đừng để tích ảnh rồi mới gắn cờ |
| **4** | Gộp 3 mặt tiền họ A về một component, mỗi chỗ chỉ khác **chế độ chọn** | Hết viết lại 3 lần |
| **5** | Lộ `block-library.ts` ra mặt tiền + gộp với `furniture.ts` | Đã xây xong, chỉ thiếu cửa |
| **6** | `material` — cache ATLAS vào thư viện | Chờ khoá Lark |
| **7** | NT5 Pha 1 — dời lưu trữ sang cây thư mục thật | Làm **cùng đợt** với 1, chỉ động lớp lưu trữ 1 lần |

**Đợt 1–3 làm được ngay, không chờ Hoà.** Đợt 6 chờ khoá Lark.

---

## 8 · Test bắt buộc

| Test | Bắt lỗi gì |
|---|---|
| Không trường nào ở **lõi** mà chỉ một `kind` dùng | Rò trường riêng lên lõi (§2) |
| Ở mỗi chặng, thứ tự đề xuất đúng bảng §3 | Ngữ cảnh hỏng thầm lặng |
| Ảnh nhập từ nguồn không rõ giấy phép ⇒ **luôn** `internal` | §5 — không được mặc định lỏng |
| Ảnh `internal` **KHÔNG xuất được** ở chặng 3 | Rủi ro pháp lý |
| `material` không có `syncedAt` ⇒ hiện "chưa đồng bộ", không hiện giá | Giá cũ tưởng là giá mới |
| Xoá 1 tài sản ⇒ quan hệ trỏ tới nó không làm vỡ chỗ khác | Tham chiếu chết |
| `NodeLibraryPanel` **không** nằm trong phạm vi gộp | Bẫy §1 |

---

*Cowork, 30/07/2026. Dựa trên khám thật: `components/LibraryPanel.tsx` · `present-editor/LibraryBrowser.tsx`
· `photo-editor/LibraryPickerModal.tsx` · `lib/cad/block-library.ts` · `lib/cad/furniture.ts` ·
`lib/refingest.ts` · `lib/classify.ts`. Quyết định gốc ghi ở `docs/CHOT-COWORK-2026-07-30.md` §6.*
