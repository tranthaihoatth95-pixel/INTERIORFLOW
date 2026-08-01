# `7.3.32` — Ảnh nền + giao diện tuỳ chỉnh vào nhóm Giao diện của `/settings`

> Hoà chốt: ảnh nền và giao diện tuỳ chỉnh đặt trong Cài đặt.
> **Đồng ý về chỗ đặt** — nhóm `AppearanceSettings` đã có sẵn (`7.3.30` vừa dựng), cắm vào đó là
> đúng, không phải đẻ trang mới.
>
> **Nhưng phải phân biệt 3 loại nền — chúng KHÔNG cùng bản chất**, và một trong ba **xung đột với
> quyết định ISO 3664 đã chốt**.

---

## 1 · Ba loại nền, ba kết luận khác nhau

| Loại nền | Đang có gì | Kết luận |
|---|---|---|
| **① Nền màn đăng nhập / chào** | `components/entry/LoginBackdrop.tsx` đã có | ✅ **CHO tuỳ chỉnh thoải mái** — thuần trang trí, không ai chấm màu ở đây |
| **② Nền canvas (lưới điểm)** | `FlowCanvas.tsx:394` `Background variant={Dots} color="var(--dots)"` · token `--dots` (`#26262d` tối / `#ddd8ce` sáng) | ✅ **CHO tuỳ chỉnh, nhưng CHỈ mật độ/độ mờ lưới, KHÔNG cho ảnh** — xem §2 |
| **③ Nền sân khấu chấm màu (chặng 2, sau ảnh render)** | Chưa có | ⛔ **KHÔNG cho ảnh, KHÔNG cho màu tự do** — xem §2 |

---

## 2 · ⛔ Vì sao KHÔNG cho ảnh nền ở vùng chấm màu

Chuẩn thiết kế đã commit (`docs/IF-DESIGN-STANDARD-2026-07-29.md` §6.5, dẫn **ISO 3664**) chốt:
môi trường quan sát để chấm màu phải là **xám trung tính**. Đó là lý do chặng 2 được quyết định
dùng nền tối trung tính thay vì nền giấy ấm `#f2efe9`.

**Ảnh nền phía sau ảnh render sẽ phá đúng điều đó**: mắt người đánh giá màu **theo tương quan với
vùng xung quanh**. Đặt một ảnh nhiều màu sau bức render thì Hoà sẽ **chỉnh màu bù trừ theo một cái
nền đang nói dối** — rồi in ra giấy thấy lệch, không hiểu vì sao.

Đây không phải chuyện thẩm mỹ. Đây là lý do **Photoshop, Capture One, Lightroom đều không cho đặt
ảnh nền sau canvas** — chỉ cho chọn mức xám. Chúng không thiếu tính năng, chúng cố ý không làm.

### Nên cho gì thay thế

Ở vùng chấm màu, cho đúng **một thanh trượt độ xám trung tính** (vd 18% → 50% grey, mặc định ~20%
theo khuyến nghị softproof). Vẫn là "tuỳ chỉnh", vẫn cho Hoà quyền, nhưng **không cho tự bắn vào
chân mình**.

---

## 3 · Nội dung nhóm Giao diện đề xuất

Cắm thẳng vào `components/settings/AppearanceSettings.tsx` đã có:

| Mục | Kiểu điều khiển | Ghi chú |
|---|---|---|
| Sáng / Tối / Tự động | segmented (đã có) | giữ nguyên |
| Ngôn ngữ | segmented (đã có) | giữ nguyên |
| **Nền màn đăng nhập** | chọn ảnh · hoặc 3-4 preset dựng sẵn · hoặc "không" | Thoải mái. Ảnh người dùng lưu ở đâu → xem §4 |
| **Lưới canvas** | 3 mức: Ẩn · Thưa · Dày + thanh độ mờ | Đổi `gap`/`size`/`opacity` của `Background variant={Dots}`. **Không cho ảnh** |
| **Độ xám sân khấu chấm màu** | thanh trượt 18–50% grey, mặc định 20% | Chỉ áp ở chặng 2. Kèm 1 dòng: *"Nền trung tính giúp chấm màu đúng — theo ISO 3664"* |
| **Mật độ giao diện** | Thoáng · Vừa · Dày | **Để chỗ trống, khoá mờ tới `2.2.79`** — đúng như `7.3.30` đã dự trù |
| Nhận diện (Brand Kit) | link sang Present | `lib/present-editor/brand-kit.ts` đã có — **chỉ link, đừng nhân bản** (Luật #6) |

---

## 4 · Hai chuyện kỹ thuật phải chốt trước khi code

**① Ảnh nền lưu ở đâu.** IF là **local-first**. Ba lựa chọn:

| Cách | Ưu | Nhược |
|---|---|---|
| `localStorage` base64 | rẻ nhất | **giới hạn ~5MB**, một ảnh 4K là vỡ |
| **IndexedDB blob** | đúng cỡ ảnh, đã có hạ tầng IDB (autosave đang dùng) | thêm ít code |
| Đường dẫn file trên đĩa | không nhân bản dữ liệu | trình duyệt **không đọc lại được đường dẫn** giữa các phiên (trừ khi giữ handle File System Access — đã có `chooseBackupFolder()` làm mẫu ở B1) |

→ Khuyến nghị **IndexedDB blob**, tái dùng hạ tầng IDB đã có. Giới hạn 1 ảnh, nén xuống ≤2560px
trước khi lưu.

**② Ảnh nền phải theo user, không theo máy.** Nếu lưu theo trình duyệt thì đổi máy là mất. Chấp
nhận được cho bản đầu — nhưng **ghi vào `docs/TECH-DEBT.md`** để sau đồng bộ theo tài khoản.

---

## 5 · Xếp hàng

| Mã | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| **`7.3.32`** | Mở rộng nhóm Giao diện: nền đăng nhập · lưới canvas · độ xám sân khấu · link Brand Kit · ô mật độ khoá mờ | Trung bình (mới, có lưu trữ IDB) | **Sau `7.3.31` và B2/B3.** Là việc tiện nghi, không phải blocker — nhưng rẻ và Hoà đang muốn, nên đặt ngay sau cụm đó, trước chuỗi Sprint 3 nền (`2.2.65/78`) |

**Không chen lên trước B2/B3**: hai cái đó là blocker ship, cái này là tuỳ chỉnh.

---

*Cowork, 30/07/2026. Đọc trực tiếp `components/settings/` (4 file `7.3.30` vừa dựng),
`components/entry/LoginBackdrop.tsx`, `components/FlowCanvas.tsx:394`, `app/globals.css:72,109`
(token `--dots`), `docs/IF-DESIGN-STANDARD-2026-07-29.md` §6.5. Mã `7.3.32` là ĐỀ XUẤT.*
