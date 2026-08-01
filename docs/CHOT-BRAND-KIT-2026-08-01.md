# CHỐT — BRAND KIT thuộc về DỰ ÁN

> Hoà quyết **01/08/2026**, sau bảng khám `4.1.f` của code chính (commit `067a5d1`).
> Trả lời câu hỏi để ngỏ ở `QUYET-DINH-HA-TANG-2026-07-31.md` mục ②.

---

## Quyết định

> **`<dự án>/brand-kit.json` là NGUỒN SỰ THẬT.**
> **`_studio/brand-kit-mac-dinh.json` chỉ là MẪU KHỞI TẠO — đọc MỘT CHIỀU, không đồng bộ ngược.**

Lý do: kit đang có tên `ATELIER NORD · LUMEN VILLA` — đó là nhận diện **của một dự án**, không phải
của studio đang dùng IF. Mỗi dự án một nhận diện là thực tế nghề, không phải trường hợp hiếm.

⚠️ **LUẬT TRUNG TÍNH** (`AUDIT-BRAND-PII.md`): "studio" ở đây là **studio bất kỳ đang dùng IF**,
không phải TTT. `_studio/brand-kit-mac-dinh.json` khi ship ra phải **rỗng hoặc trung tính** — không
được kèm sẵn nhận diện của studio nào. Kit mẫu trong repo phải hư cấu 100%.

Loại bỏ phương án "đồng bộ hai chiều" vì phải giải bài gộp cấp-từng-kit — đắt và dễ sinh lỗi, đúng
loại rủi ro đã trả giá ở B2/B4.

---

## Ràng buộc bắt buộc khi thi công

**① KHÔNG áp `resolveSourceOfTruth()` nguyên khối.** Code chính đã chỉ ra (4.1.f): `brand-kit.json`
hiện là bản xuất **toàn bộ danh sách global**, không phải phần riêng của dự án. "Đĩa thắng nếu mới
hơn" sẽ **xoá kit của dự án khác** — nặng hơn lỗi đang có.

**② Phải đổi hình dạng tệp trước.** `<dự án>/brand-kit.json` chỉ được chứa **kit của dự án đó**,
không chứa cả thư viện. Đổi xong mới bàn tới chuyện đảo nguồn.

**③ `_studio/` chỉ đọc.** Không có đường ghi ngược từ dự án lên `_studio/`. Muốn cập nhật mẫu studio
thì phải là hành động **thủ công, có chủ đích**, không tự động.

**④ Trọng số Gu và Brand Kit là hai bài khác nhau.** Gu là **tri thức nghề của studio** (chốt ③ =
Prisma). Brand Kit là **tài sản của dự án**. Đừng gom chung một khuôn.

---

## Hiện trạng đo được (01/08, code chính `4.1.f`)

| # | File:dòng | Việc |
|---|---|---|
| 1 | `brand-kit.ts:58-59` | `read()` — localStorage, **nguồn sự thật duy nhất hiện nay** |
| 2 | `brand-kit.ts:69-71` | `write()` — localStorage |
| 3 | `brand-kit-disk.ts:37` | ghi `brand-kit.json` ← `BrandKitPanel.tsx:157`, fire-and-forget |
| 4 | `brand-kit-disk.ts:46` | đọc kiểm tồn tại ← `:103`, chỉ để quyết hiện nút |
| 5 | `brand-kit-disk.ts:66` | đọc để nhập ← `:179`, **nút thủ công + confirm** |
| 6 | `PresentSheets.tsx:455-456` | ghi `brandKitSnapshot` vào `.idfp` lúc xuất |
| 7 | `idfp.ts:204` | đọc lại `brandKitSnapshot` — **0 nơi tiêu thụ** |

`grep -c brand lib/disk-sync.ts lib/project-scope.ts` = **0/0** — engine B4 chưa từng chạm Brand Kit.

---

## Đính chính kết quả B5 (dòng e)

🔍 `BrandKitPanel.tsx:62` `const p = [...deck.palette]` · `:66` `useState(deck.fonts)`.

Panel lấy màu/font **từ DECK**, không từ thư viện kit. Tên `ATELIER NORD · LUMEN VILLA` cũng nằm
trong deck (`.idfp` → `deck.brand`).

⇒ Dòng (e) của B5 chứng minh **theme của deck sống sót trên đĩa**, **KHÔNG** chứng minh
`brand-kit.json` được đọc. B5 vẫn ĐẠT — deck là thứ giao cho khách — nhưng phải ghi đúng mức đó
trong `IF-FEATURE-TREE.md`.

Và nó giải thích luôn vụ id phân nhánh: ở profile sạch, panel hiện màu/font từ deck, Hoà bấm Lưu,
localStorage rỗng ⇒ `makeId()` (`brand-kit.ts:78`) đúc id mới. Không phải lỗi lẻ — là hệ quả trực
tiếp của việc localStorage vẫn là nguồn.

---

## Microcopy — câu thay (code chính đề xuất, Hoà chưa duyệt chữ)

Thay `BrandKitPanel.tsx:497-501`:

> *"Brand Kit lưu trên máy này (localStorage), dùng chung cho mọi dự án. Mỗi dự án có thể giữ 1 bản
> sao `brand-kit.json` để mang sang máy khác — bản xuất MỘT CHIỀU, không tự đồng bộ ngược."*

Câu này mô tả **đúng hiện trạng**, không hứa tương lai. Sửa lại khi ② được thi công.

---

*Cowork ghi 01/08/2026. Nguồn: quyết định của Hoà + bảng khám `4.1.f` commit `067a5d1`.*
