> ⛔ **LỖI THỜI — ĐÃ BỊ THAY. Giữ làm dấu vết, KHÔNG thi hành.**
> Phiếu này sai khoá tra: `ProductSpec.id` là **cuid**, `getMaterial` rẽ theo `isMatIdUuid` ⇒ cuid
> rơi xuống `legacy-sku` ⇒ `pbr = null` vĩnh viễn. Lane bác đúng ở ô ⓪, không gõ dòng mã nào.
> ⇒ Bản thi hành: **`docs/phieu-giao/P-V8c-UV-TRUOC-VAT-LIEU-SAU.md`**

# P-V8 · SCENE 3D ĐỌC VẬT LIỆU THẬT — trường đã có sẵn, chưa ai đọc

> **Chạy SAU khi V5 khoá hợp đồng hạt-giống.** V5 đang sửa `lib/materials/hat-giong.ts` —
> đó là hợp đồng phiếu này TIÊU THỤ. Bắt đầu trước là đọc hợp đồng đang đổi.

## ⓪ TIỀN ĐỀ — xác nhận hoặc BÁC rồi mới làm

Phiếu này đứng trên 5 khẳng định đã đo 05/09. **Bác được cái nào thì DỪNG và báo** — làm đúng một
phiếu sai vẫn là hỏng việc.

| # | khẳng định | cách tự kiểm |
|---|---|---|
| ⓪.1 | `SceneGroup.specId` khai ở `lib/three/cad-to-obj.ts:178`, gán ở 6 chỗ, đi trọn vào `groupList` (`:372`) | `grep -n specId lib/three/cad-to-obj.ts` |
| ⓪.2 | `Scene3DData = Pick<ObjScene,'groups'> & {…}` (`:213`) ⇒ **không tầng nào rơi mất `specId`** | đọc `:213` |
| ⓪.3 | `Scene3DViewer.tsx` **chưa bao giờ đọc** nó | `grep -c specId components/three/Scene3DViewer.tsx` phải = 0 |
| ⓪.4 | `getMaterial()` sống ở `lib/materials/resolve.ts:88`, trả đủ ba mặt | mở hàm |
| ⓪.5 | `buildPbrMaterial` + `loadPbrTextures` + cache theo URL sống ở `lib/three/pbr-three.ts` | mở tệp |

⚠️ **Bản probe ĐẦU ghi sai** (*"cầu chỉ chuyển tiếp colorHex"*) — đã đính chính trong
`docs/delivery/PROBE-DUONG-ONG-ANH.md`. Đọc bản đã đính chính, đừng đọc trí nhớ ai.

## ⓪b TIỀN ĐỀ HẠ TẦNG — trả lời TRƯỚC tiền đề nghiệp vụ

`git log --oneline -1` + `git rev-list --count HEAD..nen-checkpoint`. **Lệch > 0 là DỪNG NGAY.**

## VIỆC 1 — MỘT hàm tra dùng chung, không dán mã vào viewer

Ba nơi tiêu thụ **cùng một** `SceneGroup[]`:

| nơi | hôm nay | sau phiếu |
|---|---|---|
| `components/three/Scene3DViewer.tsx:478,491` | `MeshStandardMaterial({ color: b.colorHex })` | qua hàm chung |
| `lib/three/capture.ts:94` (ảnh · video · depth ControlNet) | `MeshBasicMaterial({ color: b.colorHex })` | qua hàm chung |
| panel vật liệu | đã tra `getMaterial` | không đụng |

⛔ **Sửa mỗi viewer là hỏng một nửa** — khung hình XUẤT RA vẫn phẳng, mà đó mới là thứ khách nhìn.
⛔ **Cấm mặt tiền thứ hai**: không `TextureLoader` riêng, không cache riêng, không suy vật liệu
theo tên nhóm. Một sự thật vật liệu, ba nơi đọc.

Chuỗi: `group.specId → getMaterial → (facet pbr) → loadPbrTextures → buildPbrMaterial`.

## VIỆC 2 — ĐƯỜNG LÙI phải giữ nguyên hành vi hôm nay

`specId` trống · tra không ra · vật liệu không có map · ảnh 404 ⇒ **rơi về `colorHex` đúng như
hôm nay**. Không bịa vân, không ô caro tím, không chặn cảnh, không để trống mặt.
Một ảnh hỏng **không được** làm hỏng cả khung nhìn (`texCache` đã tự xoá khoá lỗi — `pbr-three.ts:57`).

## VIỆC 3 — BẤT ĐỘNG SẢN BỘ NHỚ: cache · tái dùng · dispose

Đây là chỗ dễ hỏng nhất và **không nhìn thấy được bằng mắt**, nên nói trước:

1. **Tái dùng**: N mặt tường cùng `specId` ⇒ **một** lượt tải ảnh (cache theo URL đã có), và nên
   dùng chung một `MeshPhysicalMaterial` thay vì `new` cho từng mesh.
2. **Dispose**: `Scene3DViewer` cleanup hiện `dispose()` material của từng mesh (`:1044`).
   Material dùng chung mà dispose theo mesh ⇒ **dispose nhiều lần / dispose nhầm bản đang dùng**.
   Đọc cách `material-preview.ts:318` đã giải (clone map, dispose an toàn) rồi làm cùng khuôn.
3. **Tải bất đồng bộ**: `loadPbrTextures` là `Promise`. Cảnh phải **hiện ngay bằng `colorHex`**
   rồi nâng cấp khi ảnh về — không chặn khung hình đầu, không nhấp nháy trắng.
4. `capture.ts` chụp **đồng bộ** ⇒ phải `await` texture TRƯỚC khi dựng cảnh chụp, nếu không ảnh
   xuất ra vẫn phẳng mà không ai biết vì sao.

## VIỆC 4 — CHỨNG MINH BẰNG ẢNH CHẨN ĐOÁN, KHÔNG BẰNG GỖ

Dùng `public/textures/chan-doan/chan-doan-512.png` (`node scripts/sinh-anh-chan-doan.mjs`).
Gỗ đẹp là ảnh dò tồi — hỏng kiểu gì cũng vẫn "trông giống gỗ".

Quy ước: **1 chu kỳ = 400×400 mm** ⇒ dán lên tường **4000 mm** phải đếm được **đúng 10 chu kỳ**.

| bắt lỗi | dấu hiệu trên ảnh |
|---|---|
| mất map | còn một màu xám trung bình, không ô cờ |
| lật | chữ `IF` ngược / tam giác quay sai |
| xoay 90° | số `1 2 3 4` về sai góc |
| sai tỉ lệ UV | 24 sọc mảnh dần bệt ở dải nào ⇒ sai bao nhiêu |
| sai colorSpace | map nhám gán sRGB ⇒ lệch gamma, thấy ngay ở ô cờ |

## ⑤ MẶT NHÌN

Phiếu này **không đẻ mặt mới**. Thứ nhìn thấy được là **chính khung nhìn 3D đổi chất**.
⇒ Nộp **2 ảnh cặp trước/sau** cùng góc máy, cùng cảnh: một bằng `colorHex` hôm nay, một bằng
vật liệu thật. Đặt vào `docs/ship/anh/`.

## NGHIỆM THU — HAI PHÉP THỬ TÁCH BẠCH, không gộp thành một ô xanh

**A · ĐÚNG** — pixel tới đúng chỗ, đúng chiều, đúng tỉ lệ (đo bằng ảnh chẩn đoán ở VIỆC 4).
**B · HỮU DỤNG** — kiến trúc sư **phán được vật liệu** từ khung nhìn: thấy thớ, thấy hướng vân,
thấy cỡ thật. Đúng mà vô dụng vẫn là chưa xong.

Kèm: `npx tsc --noEmit` sạch · test phạm vi xanh · **không rò bộ nhớ** (mở/đóng cảnh 5 lượt,
`renderer.info.memory.textures` không tăng tuyến tính).

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc ghi, trống cũng phải ghi
## ⑦c HẠN DÙNG KẾT LUẬN — số này đo lúc nào, cái gì làm nó hết hạn

## RÀNG BUỘC

- ⛔ **Không đổi hợp đồng** `SceneGroup`/`Scene3DData` — trường đã có, chỉ đọc.
- ⛔ Không đụng `lib/materials/hat-giong.ts` (V5 đang giữ) · không đụng biểu diễn **hatch vector**
  của mặt 2D — 2D giữ nguyên đường vector, đây là luật, không phải chưa làm.
- ⛔ Không chạy nút AI tốn credit.
- ⛔ Nền / Wallgallery vẫn **NOT IMPLEMENTED** — không mượn việc này để làm nó.
- Mỗi việc lớn một commit; chạy tsc + test trước khi sang việc kế.

## Ô KẾT (MẪU 6) — bắt buộc cuối báo cáo
① VẤN ĐỀ · ② GIẢI PHÁP · ③ RỦI RO (**của chính giải pháp mình**, cấm để trống) · ④ ĐẠT ĐƯỢC
(kèm *"biết bằng cách nào"*).
