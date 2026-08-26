# TRANSFER NOTE → MAIN đang thi công · 22/08/2026

> Phiên này ở chế độ **DESIGN-ONLY** (khoá đồng thời). Ghi chú này là **bằng chứng đo trên app
> thật**, KHÔNG phải bản vá. Không có tệp production nào bị phiên này sửa —
> `find components lib app -newermt '-12 minutes'` trả **rỗng**.

## 1 · Tổng quan
Đường **Thư viện → thả xuống bản vẽ 2D** (bảng mục 9, "chưa chạy thật lần nào") **ĐÃ CHẠY THẬT
lần đầu hôm nay** trên app thật. Nó thả được. Nhưng vật rơi xuống **mất danh tính**: không mang
`specId` ⇒ **không bao giờ lên được BOQ**. Đây đúng là bảng mục 10 (🔴 *"thả block → có specId"*).

## 2 · Chi tiết — đo được, có thể tái hiện
Môi trường: `http://127.0.0.1:3000` · `demo@if.local` / `demo1234` · dự án `Nháp`
(`cmsl8prn80001w9i2ud3bfdgr`) · 1440×900 · mở kệ bằng `window.dispatchEvent(new CustomEvent('if:library-open',{detail:{}}))`.

| Việc | Kết quả |
|---|---|
| Kệ Thư viện ở chặng 2D | MỞ thật · 73 món `.idfc` + 12 ký hiệu · ký hiệu ISO vẽ thật, có mã |
| Chọn món → cột thông số | Trượt vào từ phải, ĐÚNG chốt "phương án A" |
| Bấm **"Kéo ra bàn làm việc"** (Cửa 1 cánh 800) | ✅ Hình rơi xuống canvas thật · `[cad-sheets] IDB ghi 1.1→1.2 KB` |
| Bấm cho **Sofa 3 chỗ** | ✅ rơi xuống |
| Entity ghi ra IDB | `{type:"block", block:"doorRoom", layer:"l-furniture", specId:∅, srcBlock:∅}`<br>`{type:"block", block:"sofa3",   layer:"l-furniture", specId:∅, srcBlock:∅}` |

✅ Điểm TỐT, ghi rõ để không ai đập đi: đây là **`BlockEntity` THẬT** (đếm được · chọn được ·
đúng lớp `l-furniture` · một nấc Undo). Đường ống đúng, chỉ đứt một dây.

## 3 · Gốc bệnh — MỘT DÒNG, và cỗ máy đã có sẵn
`components/cad/LibraryDropBridge.tsx:83`
```ts
const hit = resolveLibraryItem(item, manifest, undefined, idfcGeom2d);
//                                             ^^^^^^^^^ specs KHÔNG BAO GIỜ được truyền
```
`lib/cad/library-item-resolve.ts:173` đã sẵn sàng nhận:
```ts
const specId = item.specId ?? (specs?.length ? matchSpec(item.code, specs)?.id : undefined);
```
và docstring `:139` tự khai nguồn đúng là **`GET /api/specs`** (route CÓ THẬT,
`app/api/specs/route.ts`, đã hỗ trợ `?drawingBlock=`).
⇒ **LOOK INSIDE / CONNECT, không phải NEW.** Không cần field mới, không cần engine mới.

## 4 · ⚠️ CẠM BẪY — nối `/api/specs` KHÔNG thôi thì VẪN HỎNG
`matchSpec()` (`lib/library/spec-panel.ts:51`) so **`item.code` ↔ `spec.sku`** khớp CHÍNH XÁC.
Dữ liệu thật KHÔNG khớp theo trục đó:

| Món trên kệ (code) | ProductSpec.sku | khớp sku? | **drawingBlock** |
|---|---|---|---|
| `SOFA-3S` | `MU-OUT-3S` | ❌ | **`sofa3`** ✅ |
| `DOOR-S-800` | — | ❌ | — (cửa không có spec — ĐÚNG, không bịa) |

`sqlite3 prisma/dev.db "select sku,drawingBlock,name from ProductSpec"` → **7/10 spec có
`drawingBlock`**: `sofa3 · sofa2 · armchair · bedD · dining4 · desk · wardrobe`.
Và entity vừa thả mang đúng `block:"sofa3"`.

⇒ **Dây nối thật là `ProductSpec.drawingBlock` ↔ `BlockDef.id`**, không phải `code ↔ sku`.
Cột đó ĐÃ CÓ trong schema và ĐÃ CÓ dữ liệu — chỉ chưa ai đọc lúc thả.

## 5 · Hai hướng (MAIN thi công chọn)
| | Hướng A — nối ở tầng resolver | Hướng B — nối ở tầng UI (LibrarySheet) |
|---|---|---|
| Làm gì | `LibraryDropBridge` nạp `/api/specs`, truyền `specs`; resolver thêm nấc dự phòng `spec.drawingBlock === def.id` SAU khi đã khớp sku | Kệ tự gán `item.specId` sẵn (đường `specLinks` gán tay đã có) |
| Ưu | Một chỗ sửa, mọi mặt tiền thả đều hưởng; dùng đúng cột đã có dữ liệu | Không đụng resolver |
| Nhược | Thêm một lượt fetch (cache được theo phiên như `loadManifest`) | Gán tay 73 món, người quên là đứt lại |

**Đề xuất: A** — vì `drawingBlock` là dây MÁY, còn gán tay là dây NGƯỜI; và bảng mục 12
(MATERIAL "một danh tính") cần đúng dây máy này chứ không phải một bảng gán tay thứ hai.

⚠️ Giữ nguyên thứ tự ưu tiên đã chốt: `item.specId` (gán tay) **THẮNG** khớp máy — chỉ THÊM nấc
dự phòng ở CUỐI, không đảo thứ tự.

## 6 · CHƯA CHẮC / CHƯA KIỂM (khai thật)
- Chưa kiểm entity có `specId` thì BOQ có thật sự nhận không — mới chứng minh được nửa đầu dây.
- Chưa thử đường `via:'idfc'` (73 món kho studio); docstring `LibraryDropBridge:99` **tự khai**
  nét rời KHÔNG mang được `specId` (schema chỉ cho Block/Hatch) — nút thắt riêng, chưa đụng.
- `L` ở chặng 2D KHÔNG mở Thư viện (bị lệnh LINE chiếm) — **đúng thiết kế** (`CHINH-4`,
  `SPEC-PANEL-ROLLOUT-IDF §4e`), không phải lỗi. Ghi lại vì rất dễ báo nhầm thành bug.
- Phiên này có **ghi 2 block vào bản vẽ demo `Nháp`** (IndexedDB trình duyệt, không phải tệp
  repo) khi chạy thử. Undo hoặc xoá tay nếu vướng.

---

# PHỤ LỤC 22/08 — 2 điểm Auth.dc.html nêu, MAIN đã KIỂM LẠI TẠI NGUỒN

Lane Claude Design (Auth) nêu 2 điểm nghi vấn về production. MAIN xác minh — **cả hai có thật**,
nhưng điểm ② phải nói chính xác hơn cách lane mô tả.

### ① Đường dẫn màn Khoá — LANE ĐÚNG, BRIEF CỦA MAIN SAI
`components/entry/LockScreen.tsx` **KHÔNG TỒN TẠI**. Chủ sở hữu thật:
- `components/studio/LockScreen.tsx`
- `components/auth/TheXacThucLai.tsx` (mặt xác thực lại)

Brief của MAIN ghi `entry/` là sai; lane không đi theo mà kiểm rồi sửa — đúng cơ chế ô ⓪.

### ② Phím khoá — KHÔNG PHẢI "hai bên bất đồng", mà là **một chính tắc + một nợ cũ còn sống**
Lane thấy `lib/lockscreen.ts:4` ghi `⌃⌘Q` còn brief ghi `⌘⇧L` nên **cố ý không in phím nào lên
mặt khoá**. Thận trọng đúng, nhưng kết luận cần chỉnh:

| Bằng chứng | Nói gì |
|---|---|
| `lib/commands/registry.ts:624` | **`⌘⇧L` / `Ctrl⇧L` là phím CHÍNH TẮC** — nằm trong SỔ LỆNH chung |
| `registry.ts:624-625` | đã ĐO va phím 22/08: `⌘L` (không shift) là mở tấm Thư viện (`AppChrome.tsx:162`) ⇒ thêm `shift` là **hết va, không phải lách** |
| `registry.ts:625` | *"⌃⌘Q cũ vẫn chạy song song"* — nợ đã biết, đã ghi ở bảng mục 6 |
| `components/studio/LockScreen.tsx:120` | *"KHÔNG gõ cứng phím ở đây: đọc từ SỔ LỆNH"* |
| `lib/lockscreen.ts:4` | `⌃⌘Q` — **docstring cũ 04/08**, không phải nơi gán phím |

⇒ **Khi dựng: IN `⌘⇧L`** (và `Ctrl⇧L` trên Win/Linux), **đọc từ sổ lệnh, KHÔNG gõ cứng chuỗi**
— đúng như `LockScreen.tsx:120` đã tự dặn. `⌃⌘Q` là nợ dọn riêng, không phải phím để bày ra.

⚠️ Kèm theo, lane khai 1 drift nữa chưa kiểm: docstring `LoginForm.tsx` còn nhắc gạch chân tab
màu ĐỒNG — màu đã khai tử 16/08. MAIN **chưa xác minh** dòng này (đang khoá ghi production).

### ③ Drift "màu đồng" ở LoginForm — ĐÃ KIỂM: **KHÔNG phải lỗi MÀU, là lỗi TỪ VỰNG**
Lane đề nghị *"gạch chân tab màu đồng phải đổi sang `--accent`"*. Đo tại nguồn:

```
components/entry/LoginForm.tsx:44   const ACCENT_WARM = 'var(--accent)';
```
⇒ **Giá trị đã là tím rồi** — pixel trên màn KHÔNG sai, không có gì để sửa về màu.
Thứ còn sai là **CÁI TÊN và LỜI CHÚ**: hằng số vẫn mang tên `ACCENT_WARM`, và 3 chỗ chú thích
vẫn viết "gạch chân **đồng**" (`:27`, `:221`, `:254`).

Đây đúng họ bệnh `soi:tu-dien` sinh ra để bắt: **tên nói một đằng, giá trị một nẻo**. Người đọc
sau sẽ tin cái tên rồi hoặc (a) đi "sửa lại cho đúng màu đồng" — tức phục sinh một màu đã khai
tử, hoặc (b) tưởng màn này còn nợ màu trong khi nó đã sạch.

⇒ Việc đúng: **đổi TÊN + 3 lời chú**, KHÔNG đụng giá trị. Đổi giá trị là làm hỏng thứ đang đúng.
