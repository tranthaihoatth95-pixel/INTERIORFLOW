# WORKSPACE / SHELL — ĐẶC TẢ CHỐT (Hoà, 23/08)
Quyết định sản phẩm. MAIN ghi nguyên ý + đối chiếu hiện trạng đo được. Không diễn giải thành thiết kế.

## Nguyên tắc nền
> **Collab · 2D · 3D là BA CHẾ ĐỘ LÀM VIỆC trên CÙNG MỘT canvas — không phải ba ứng dụng.**
> Đổi chế độ = đổi **ngữ cảnh**, không đổi ứng dụng.

**Dùng chung, một bản duy nhất:** project context · canvas · history · Vitals · asset library.

Mục tiêu: giữ cảm giác **unified** mà vẫn linh hoạt cho tác vụ chuyên sâu.

## Năm thành phần vỏ

| # | Thành phần | Đặc tả |
|---|---|---|
| 1 | **Ba entry chế độ** | Collab · 2D · 3D — ba lối vào **cùng một canvas** |
| 2 | **Master tool** | Lớp công cụ **THEO NGỮ CẢNH** · gọi bằng **CHUỘT PHẢI** · **bao quanh vùng làm việc** · **KHÔNG cố định** · **dùng chung cho mọi chế độ** |
| 3 | **Bottom tool rail** | **Luôn hiện** phía dưới · dành cho **thao tác hệ thống** |
| 4 | **Top bar** | **MỘT HÀNG** · search ở **giữa** · bên phải: **now surface + avatar** |
| 5 | **Vitals** | Nằm trên **ĐƯỜNG RANH giữa navigation và canvas** · **hover ở bất kỳ điểm nào** trên đường đó để mở insight ngắn · **giãn dần theo nhu cầu** · **luôn giữ neo với canvas** |

---

## Đối chiếu hiện trạng (đo 23/08)

### 🟢 ĐÃ CÓ — dùng lại, đừng dựng mới
| Đặc tả | Có sẵn ở đâu |
|---|---|
| Master tool gọi bằng chuột phải | `components/print/RadialToolMenu.tsx` (port từ `BangTron.dc.html`), đã mount ở `CadCanvas` — entry `pie-menu-2d` |
| Hộp công cụ bám vật | `components/nodes/HopCongCuBamVat.tsx` (`NodeToolbar` thật) |
| Bottom rail | `components/ui/StageToolbelt.tsx` |
| Canvas dùng chung | `FlowCanvas` (`@xyflow/react`) + `Viewport3D` |
| Vitals | `components/studio/VitalsAperture.tsx` |

### 🔴 BA CHỖ VA VỚI HIỆN TRẠNG — phải xử, không được lờ

**V1 · "Ba chặng" hôm nay KHÔNG có Collab, và CÓ Present.**
`lib/phases.ts:7` khai `Phase = 'concept' | 'render' | 'present'` → **2D Design · 3D Design · Presenting**.
Đặc tả mới nói ba chế độ là **Collab · 2D · 3D**.
⇒ **Present đi đâu?** Ba cách đọc, MAIN **không tự chọn**:
  1. Present **vẫn là chặng thứ tư**, ba-chế-độ chỉ nói về vùng *dựng*, còn Present là vùng *đóng gói*.
  2. Present **thành một chế độ trong Collab** (trình bày = làm việc chung với người khác).
  3. Present **bị hạ** khỏi hàng chế độ, trở thành một master tool / đầu ra.
  ⚠️ Chốt 13/08 đã ghi *"chặng 3 CHỈ trình chiếu + tinh chỉnh nhẹ; mọi SẢN XUẤT về chặng 2"* —
  đọc cùng nhau thì cách **1** hoặc **3** khớp hơn, nhưng đây là quyết định sản phẩm.
  ⚠️ Đổi `Phase` là **vỡ localStorage/route/DB** — luật cũ: **đổi NHÃN được, đổi KHOÁ thì không**.

**V2 · Vitals đang neo SAI CHỖ so với đặc tả.**
`VitalsAperture.tsx:196` tự khai *"Vitals **bám vào cụm phải-trên**"*, `position:absolute` trong `<header>`.
Đặc tả mới: nằm trên **ĐƯỜNG RANH nav↔canvas**, **hover ở bất kỳ điểm nào trên đường đó**.
⇒ Đây là đổi từ **neo một ĐIỂM** sang neo một **ĐƯỜNG**. Khác bản chất, không phải dời toạ độ.
⇒ "Giữ neo với canvas" khi giãn: tấm nở ra vẫn phải **dính đường ranh**, không trôi thành hộp thoại giữa màn.

**V3 · Master tool: hai định nghĩa đang cùng tồn tại.**
- Bản 15–16/08: *"cửa sổ công cụ = MÔI TRƯỜNG LÀM VIỆC tối ưu (ảnh/video/3D prototype), kéo thả
  trong canvas, xung quanh có panel vệ tinh"* — nặng, là một **khung môi trường**.
- Bản 23/08 (đặc tả này): *"lớp công cụ ngữ cảnh, gọi nhanh bằng chuột phải, bao quanh vùng làm
  việc, không cố định"* — nhẹ, là một **lớp gọi ra rồi tan**.
⇒ Hai thứ này **có thể cùng sống** (chuột phải gọi lớp nhẹ; lớp nhẹ mở được khung môi trường),
  nhưng **phải nói rõ** — nếu không, phiên sau đọc "master tool" sẽ dựng nhầm cái kia.
  Đây đúng họ lỗi *"master tool ↔ window tool là một mà sổ ghi hai tên"* đã trả giá 16/08.

---

## Hệ quả cho rail hai viên (bổ sung 3)
Rail cụm 2 đang khai là *"3 chặng + `+`"*. Nếu ba chế độ đổi thành **Collab · 2D · 3D** thì
cụm 2 = **Collab · 2D · 3D · `+`**, và **Present phải có chỗ khác** (cụm 1? master tool? đầu ra?).
⇒ Không dựng rail cho tới khi V1 có câu trả lời — dựng trước là phải sửa lại.

## Điều đặc tả này làm tốt
Nó **đóng đúng cái bệnh gốc** đã đo: *"3 chặng như 3 app"*. Trước nay mỗi chặng đổi cả vỏ
(`SPEC-MODE-PER-STAGE §1`: *"mode mỗi chặng = đổi CẢ shell"*). Đặc tả này lật điều đó —
**vỏ đứng yên, chỉ ngữ cảnh đổi**. Đây là câu trả lời kiến trúc, không phải câu trả lời thẩm mỹ.
