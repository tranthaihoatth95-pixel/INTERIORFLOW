# `7.3.31` — 3 nút chặng nhảy vị trí khi chuyển chặng

**Ảnh Hoà gửi**: thanh đầu chặng Rendering — `CAD · Phác thảo` | **Rendering** | `Presenting` |
`— 02 · RENDERING` | `Tệp ▾`. Đổi chặng thì cả cụm dịch chỗ.

---

## 1 · BA nguyên nhân, không phải một

### ① `StageSwitcher.tsx:244` — `fontWeight: on ? 600 : 500`

Chữ **600 rộng hơn 500**. Nút đang hoạt động phình ra → đẩy 2 nút kia. Đây là nguyên nhân chính và
là lỗi kinh điển của mọi tab bar.

### ② `lib/phases.ts:124-129` — nhãn CAD ĐỔI ĐỘ DÀI

```ts
if (cadStage === 'technical') return 'CAD · Kỹ thuật';
if (cadStage === 'bim')       return 'CAD · BIM';
return 'CAD · Phác thảo';
```

Ba độ dài khác nhau → nút CAD tự đổi rộng **ngay cả khi không chuyển chặng**, chỉ cần đổi chế độ CAD.

### ③ `StageSwitcher.tsx:404` — nhãn micro đổi theo chặng

`01 · Drafting CAD` / `02 · Rendering` / `03 · Presenting` (hiện từ `xl`). Ba độ dài khác nhau →
**mọi thứ SAU nó dịch theo**: `Tệp`, `⋯`, avatar. Đây là lý do trong ảnh Hoà thấy cả nút `Tệp` nhảy,
không chỉ 3 nút chặng.

---

## 2 · Sửa

### ① Giữ chỗ theo bản chữ đậm — **không hardcode px**

Mỗi nút chặng thêm `data-label` = chính nhãn của nó, rồi:

```css
.stage-btn::before{
  content: attr(data-label);
  font-weight: 600;          /* luôn giữ chỗ theo bản ĐẬM */
  display: block;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}
```

Nút luôn rộng bằng bản đậm của chính nó, dù đang hoạt động hay không → **bề rộng bất biến**. Tự đúng
với mọi nhãn, mọi ngôn ngữ, không cần đo tay, không vỡ khi đổi nhãn ở `2.2.69`.

> Không dùng `min-width` px cứng: nhãn VI/EN dài khác nhau (`Rendering` vs `CAD · Phác thảo`), và
> `2.2.69` vừa đổi nhãn — hardcode là hẹn giờ vỡ.

### ② Nút CAD giữ nhãn CỐ ĐỊNH

Thanh chặng ghi **`CAD`** thôi. Chế độ (Phác thảo / Kỹ thuật / BIM) là **trạng thái bên trong chặng**,
không phải tên chặng — nó thuộc `CadToolbar` (`ModeSwitch` đã có sẵn ở đó, dòng 243).

*Nếu Hoà muốn giữ chế độ hiện trên thanh chặng:* giải pháp thay thế là `data-label="CAD · Phác thảo"`
(nhãn dài nhất) cho cả 3 chế độ — nút rộng cố định, chữ bên trong đổi. Nhưng tôi khuyên tách hẳn:
**tên chặng không nên chứa trạng thái con.**

### ③ Nhãn micro — bỏ tên chặng, giữ số

`StageSwitcher.tsx:404` hiện ghi `· Rendering`, mà **nút đang hoạt động ngay bên cạnh đã ghi
"Rendering"**. Cùng một thông tin, hai chỗ, cách nhau 8px.

→ Bỏ `<span className="hidden xl:inline">· {label}</span>`. Giữ vạch màu chặng + số `01/02/03`
(bề rộng bất biến vì luôn 2 chữ số).

**Sửa cái này được ba việc một lúc**: hết nhảy · hết trùng thông tin (Luật #6) · thanh đầu ngắn thêm
~90px ở dải `xl` (nối tiếp `2.2.60`).

---

## 3 · Verify — mức 2 (không cần browser-verify đầy đủ)

Đo bằng DOM, không bằng mắt:

```js
// ở mỗi chặng, đọc rect của cùng 1 phần tử mốc
const r = document.querySelector('[data-stage-switcher]').getBoundingClientRect();
// và của nút Tệp
```

**Đạt khi**: `left` + `width` của cụm 3 nút **giống nhau ở cả 3 chặng** (sai số ≤0.5px), và `left`
của nút `Tệp` cũng bất biến. Kiểm ở 1183px và 1440px.

---

## 4 · Xếp hàng

| Mã | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| **`7.3.31`** | Bịt 3 nguồn nhảy vị trí ở thanh chặng | Rẻ — 2 file (`StageSwitcher.tsx`, `lib/phases.ts`), thuần layout | **Làm chung lượt với B1 backup** nếu B1 xong sớm; nếu không thì lượt kế tiếp. **KHÔNG chen lên trước B1** |

---

*Cowork, 30/07/2026. Đọc trực tiếp `components/studio/StageSwitcher.tsx:225,240,244,393-405`,
`lib/phases.ts:124-129`. Mã `7.3.31` là ĐỀ XUẤT — kiểm trùng trước khi dán.*
