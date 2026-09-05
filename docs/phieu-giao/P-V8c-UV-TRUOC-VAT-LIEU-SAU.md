# P-V8c · UV TRƯỚC, VẬT LIỆU SAU — thay P-V8 và P-V8b

> **Hai phiếu trước SAI, cả hai bị lane bác ở ô ⓪ và cả hai lần bác đúng.**
> `P-V8` sai khoá tra (cuid ≠ UUID). `P-V8b` đúng kiến trúc nhưng **sai thứ tự**: nó đặt trường dữ
> liệu trước người tiêu thụ ⇒ ra hai trường không ai ghi, không ai đọc.
> Phiếu này dựng trên **đo đạc chạy thật**, không trên đọc mã. Xem
> `docs/delivery/PROBE-DUONG-ONG-ANH.md` mục "🔬 ĐO LẦN HAI 05/09".

## SỰ THẬT NỀN — đã đo, đừng đo lại, nhưng cũng đừng tin nếu thấy khác

| # | đo được | ở đâu |
|---|---|---|
| S1 | Hình học **không có `uv`** ⇒ `material.map` cho **ĐÚNG 1 MÀU** toàn mặt, **0 lỗi ném ra** | probe WebGL 2.0 |
| S2 | `geometryOf()` `build-ops.ts:23-29` chỉ `position` — nơi DUY NHẤT dựng geometry | đọc |
| S3 | `buildMergedGeometries` gộp theo **`colorHex`** ⇒ danh tính mất trước khi dựng mesh | `obj-scene-to-geometry.ts:63-76` |
| S4 | Mọi tường chung một hex ⇒ **hai tường không thể hai vật liệu** khi khoá gộp còn là màu | `cad-to-obj.ts:244/254/263` |
| S5 | Entity **CÓ** danh tính: `specId='hat-giong:<uuid>'`; chết vì **tiền tố 7 ký tự** | `kho-mo-dau.ts:230` |
| S6 | `MATERIALS` **0/13** preset khai `matId`; `MaterialPick` chưa mang `matId` | đếm |
| S7 | Chromium ở `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, WebGL 2.0 chạy | probe |

⇒ **S1 là lý do phiếu này đảo thứ tự.** Gán vật liệu trước khi có UV = `tsc` sạch, test xanh,
ảnh "trông như cũ", **không máy soi nào bắt được** — vì không có gì sai để bắt.

## CHẠY TRÌNH DUYỆT THẾ NÀO (hai lượt trước tưởng máy không có)
Playwright của repo đòi build **1234**, máy có **1194** ⇒ `chromium.launch()` trần **thất bại**.
```js
chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] })
```

## ⓪ TIỀN ĐỀ — xác nhận hoặc BÁC
Kiểm S1-S7 ở trên (S1 chạy lại được bằng probe của bạn). ⓪b: `git log --oneline -1` +
`git rev-list --count HEAD..nen-checkpoint`, lệch > 0 là DỪNG.
**Bác được cái nào thì DỪNG và báo.** Hai lượt trước bác và đều đúng — đừng ngại.

## QUYẾT ĐỊNH KIẾN TRÚC (T chốt, đừng mở lại)

**① Kiểu UV: CHIẾU HỘP THEO TRỤC TRỘI của pháp tuyến mặt, đơn vị MÉT THẾ GIỚI.**
Không unwrap, không shader riêng, tính một lần lúc dựng hình.
- Vì sao không planar một trục: mặt đứng và mặt nằm sẽ **kéo giãn** ở một trong hai.
- Vì sao không triplanar shader: phải viết shader riêng ⇒ rời khỏi `MeshPhysicalMaterial` của
  `buildPbrMaterial` ⇒ đẻ đường vật liệu thứ hai. **Cấm.**
- Kiến trúc nội thất gần như luôn vuông góc trục ⇒ chiếu hộp đủ đúng, và **sai thì thấy ngay**
  trên ảnh chẩn đoán (mặt nghiêng sẽ méo có kiểm soát, không phải méo bí ẩn).
- ⚠️ **Đơn vị phải là MÉT**, vì `uvRepeatOf` (`pbr-three.ts:23`) tính `repeat = 1000/w` với `w` là
  mm ⇒ nó giả định **1 đơn vị UV = 1 mét**. Sai đơn vị ở đây là sai tỉ lệ vật lý toàn app.

**② Khoá gộp: `colorHex` → `colorHex + '|' + (matId ?? '')`.** `BuiltGroup` mang thêm `matId?`.
🔴 **PHẢI ĐO số draw call trước/sau** — chú thích `:46-53` cảnh báo worst case ~2000 object.
Tăng quá thì báo, đừng âm thầm nuốt.

**③ Đường sáng RẺ NHẤT làm ngay ở bước 3, không chờ bước 4:** `specId` bắt đầu bằng `hat-giong:`
⇒ gỡ tiền tố (dùng `laHangHatGiong()` đã có) ⇒ ra UUID ⇒ `getMaterial` ra pbr thật.
**7 vật liệu sáng ngay, không cần CSDL, không cần đăng nhập.**

## BỐN BƯỚC — ĐÚNG THỨ TỰ NÀY, mỗi bước một commit, `tsc` + test mới sang bước kế

**1 · UV vào `geometryOf()`** — chiếu hộp theo trục trội, mét thế giới.
   Nghiệm thu: probe WebGL của chính bạn — cùng hình học, có map ⇒ **số màu khác nhau > 1**;
   và tường **4000 mm** với `uvScaleMm.w = 400` ⇒ đếm được **đúng 10 chu kỳ**.

**2 · Khoá gộp mang danh tính** — `BuiltGroup.matId?`, khoá `colorHex|matId`. Đo draw call.

**3 · MỘT hàm tra dùng chung** cho **cả `Scene3DViewer.tsx` LẪN `lib/three/capture.ts`**:
   `matId → getMaterial → loadPbrTextures → buildPbrMaterial`.
   Nguồn pbr: `pbrMapBaTang()` (`tang-phan-giai.ts:116`).
   Thứ tự lùi: `group.matId` → `specId` gỡ tiền tố hạt giống → `colorHex` **như hôm nay**.
   ⛔ Bỏ `capture.ts` thì **ảnh/video xuất ra vẫn phẳng** — đó mới là thứ khách nhìn.
   ⚠️ `capture.ts` chụp **đồng bộ** ⇒ phải `await` texture TRƯỚC khi dựng cảnh.

**4 · `Base.matId?` + nguồn ở 2D** — gói cùng `MaterialPick.matId`.
   **Vùng ghi được MỞ RỘNG cho bước này**: `components/cad/MaterialPalette.tsx` ·
   `lib/library/spec-refs.ts` · `lib/cad/model.ts` · `lib/cad/store.ts` · `components/cad/CadCanvas.tsx`.
   Không có hai tệp đầu thì bước này lại thành dây chết — lượt trước đã bác đúng vì thiếu chúng.
   ⚠️ `Base.matId` là **UUID**, tuỳ chọn, thêm vào. **Không trộn** với `specId` (cuid/thương mại).
   Chú thích `model.ts:692` (*"specId là hiện thân của matId"*) có TRƯỚC ADR 19/08 và nay **sai** —
   đóng dấu đính chính tại chỗ, đừng xoá.

**Hết bước 3 là đã có thứ NHÌN THẤY ĐƯỢC.** Không kịp bước 4 thì dừng ở 3 và khai rõ — ba bước
trọn hơn bốn bước dở.

## BỐN CHỖ DỄ HỎNG, mắt không thấy
tái dùng material giữa N mặt cùng `matId` · dispose material dùng chung (xem `material-preview.ts:318`)
· tải bất đồng bộ (hiện `colorHex` ngay, nâng cấp khi ảnh về, không nhấp nháy) · `capture.ts` `await`.

## NGHIỆM THU — HAI phép thử tách bạch, cấm gộp một ô xanh
**A · ĐÚNG** — ảnh chẩn đoán `public/textures/chan-doan/chan-doan-512.png`, **1 chu kỳ = 400×400 mm**:
ô cờ mất ⇒ mất map · `IF` ngược ⇒ lật · số góc sai ⇒ xoay · sọc bệt ⇒ sai tỉ lệ.
**B · HỮU DỤNG** — kiến trúc sư phán được vật liệu: thớ, hướng vân, cỡ thật.
Kèm `tsc` sạch · test xanh · **draw call trước/sau** · không rò bộ nhớ (mở/đóng 5 lượt,
`renderer.info.memory.textures` không tăng tuyến tính) · **2 ảnh cặp trước/sau** vào `docs/ship/anh/`.

## RÀNG BUỘC
- ⛔ **CẤM `git add -A` / `git add .` / `git commit -a`** · cấm `stash`/`checkout`/`reset`.
- ⛔ Không đụng biểu diễn **hatch vector** 2D — luật, không phải việc chưa làm.
- ⛔ Không chạy nút AI tốn credit. Không làm Nền/Wallgallery.
- ⛔ Không đẻ đường vật liệu thứ hai — mọi thứ đi qua `buildPbrMaterial`.
- ⛔ **Không PASS giả.** S1 chứng minh chỗ này PASS giả rất dễ: sai mà trông y như cũ.

## BÁO CÁO
Khuôn 6 phần + **⑦b CHƯA CHẮC** (trống cũng ghi) + **⑦c HẠN DÙNG** +
**Ô KẾT (MẪU 6)**: ① vấn đề ② giải pháp ③ **rủi ro của chính giải pháp mình** ④ đạt được kèm
*"biết bằng cách nào"*.
