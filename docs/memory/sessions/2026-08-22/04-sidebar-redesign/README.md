# 04 · SIDEBAR VẼ LẠI — "bản đồ, không phải menu" (lane Claude Design · 22/08)

**Bản vẽ:** `docs/mocks/mock-sidebar-ban-do-2026-08-22.html` (939 dòng, `@dsCard group="Hệ thị giác"`)
**Tự chấm:** PASS. **Chưa đẩy** lên Claude Design — lane này không có `DesignSync`, MAIN đẩy khi audit.

---

## 1 · Tổng quan

Hoà bác bản sidebar cũ vì *"đúng chức năng nhưng quá generic — đọc ra như Notion/Linear/admin menu"*.
Đã kiểm ⓪ bằng code: **cả ba tiền đề của phiếu ĐÚNG** ⇒ đây **không** phải bài toán cấu trúc mà là
bài toán **xử lý thị giác**. Bản vẽ giữ nguyên ba nấc và ba đảo đang có, đổi **ngữ pháp hình học**:
sidebar thành một **XƯƠNG SỐNG** — mục không còn là hàng-trong-danh-sách mà là **điểm trên một tuyến**.

## 2 · ⓪ Tiền đề — xác nhận từng điều

| # | Phiếu nói | Đo tại nguồn | Kết |
|---|---|---|---|
| 1 | Ba nấc đã tồn tại | `muc-dieu-huong.ts:138` `BE_RONG_NAC = { dinhVi: 52, dieuHuong: 240, duyet: 320 }` | ✅ ĐÚNG |
| 2 | Ba đảo `viec` → `du-an` → `chang` | `:171` `CumRail`, `:385` `THU_TU_CUM`, `:376` `CUM_CAN_DU_AN`; nhãn cụm `du-an` thay bằng tên dự án thật (`RailDieuHuong.tsx:291-292`) | ✅ ĐÚNG |
| 3 | Đảo CHẶNG bọc trong hộp bo tròn | `RailDieuHuong.tsx:400-403` — `background: color-mix(in srgb, var(--t1) 3%, transparent)` + `borderRadius: RADIUS.r3` | ✅ ĐÚNG, đúng thứ phải bỏ |

Bề rộng vẽ **56 / 236 / 320** thay vì 52/240/320 — nằm trong khoảng đã chốt (52-56 · 220-280 · 320-440),
và 56 = `--tap` 44 + 2×4 lề + 2×2 đệm nên hàng 44px vừa khít. Con số cuối do MAIN chốt lúc tích hợp.

## 3 · Ý tưởng hình học

> **XƯƠNG SỐNG.** Một đường 1px `--vien-mo` chạy dọc mỗi đảo, tâm tại **x=27,5px** — đúng tâm icon
> (đo trên trình duyệt: `spineLeft 27.5px` / `iconCenterX 28`).

- **Ba đảo tách bằng chỗ ĐỨT của chính đường đó** — không vạch ngang, không hộp, không tiêu đề in hoa.
- **Đảo CHẶNG là đoạn xương sống ĐẬM hơn** (`--border-strong` #3d3d45, đo xác nhận) ⇒ `2D │ 3D │ Trình chiếu`
  đọc ra **một tiến trình nghề**, thay cho cái hộp bo lớn.
- **Tín hiệu active liền vào rail**: đoạn xương sống tại hàng đó **sáng lên** thành 22×2px `--accent`
  + quầng `--accent-soft`, icon **thụt 1,5px và co 3%**. Không pill, không nền hàng, không vạch dán bên trái.

## 4 · Bảy trạng thái + chuyển cảnh

| | Trạng thái | Có | Cách bày |
|---|---|---|---|
| A | Rail 56 · định vị | ✅ | khung riêng, chỉ ký hiệu; đảo dự án nén thành **một chấm rỗng** |
| B | Map 236 · điều hướng | ✅ | khung riêng, thêm chữ; tên dự án bằng **serif** |
| C | Ngữ cảnh dự án | ✅ | khung soi gần: `THẢO ĐIỀN / Phòng khách / 3D · đang làm` |
| D | Browse 320 | ✅ | khung + mặt làm việc; cột ô tròn vật liệu · ảnh xem trước · tình trạng |
| E | 2D immersive | ✅ | rail `data-tone="lui"` — mờ 58%, bỏ nền/viền, trên nền lưới bản vẽ |
| F | 3D immersive | ✅ | y hệt E, chỉ điểm sáng dịch xuống ô 3D |
| G | Home yên | ✅ | rail bỏ nền, icon `--t3` mờ .82, cạnh Ambient |

**Chuyển cảnh — hai cách bày, không phải một ảnh tĩnh:**
1. **Demo sống** (§03): 5 nút đổi nấc/tone, rail giãn thật. Đo trên trình duyệt: `56 → 236 → 320`,
   nhãn `opacity 0 → 1`, ngữ cảnh `display none → block`, lớp 320 chỉ hiện ở browse.
2. **Băng phim 5 khung** (0 · 70 · 150 · 220 · 380 ms) cho người đọc bản in.

**Ba lớp vào lệch nhịp** — đó là thứ làm nó đọc ra như *một vật đang mở* chứ không phải *một trang đang đổi*:
khung giãn `shelf 220ms` → chữ hiện `reveal 180ms` + trượt 4px → ngữ cảnh và lớp 320 nở sau cùng.
Đường cong `cubic-bezier(.32,.72,0,1)`.

## 5 · Đối chiếu danh sách Hoà bác

| Hoà bác | Xử |
|---|---|
| Hộp bo tròn to ôm cụm CHẶNG | **BỎ.** Thay bằng đoạn xương sống `--border-strong`. 0 nền, 0 bo góc trong rail |
| Hàng active thành pill/card | **BỎ.** Active = 22×2px ánh sáng trên xương sống + icon thụt 1,5px |
| Icon và chữ cùng một trọng lượng | **BỎ.** Ba hạng: toàn cục 1.5/19px · dự án 1.25/17px mờ .86 · chặng 1.85/20px `--t2` |
| Tiêu đề IN HOA cỡ lớn khắp nơi | **BỎ.** Nhãn đảo 10.5px `--t3`; thứ được đặt to là **tên dự án**, bằng serif |
| Nửa dưới trống chết | **BỎ.** Ngữ cảnh dự án + 4 mục dự án chiếm nửa dưới. 12 hàng × 44 + đỉnh + đáy ≈ 700px |
| Hai mũi tên đáy không giải thích | **BỎ.** Nút có nhãn đọc được: "Thu về ký hiệu" / "Điều hướng" / "Duyệt", đổi chữ theo nấc |
| Sidebar thành chồng thẻ | **BỎ.** Một mặt phẳng liền — 0 viền hàng, 0 nền hàng, 0 bóng đổ bên trong rail |

## 6 · Sáu lỗi tự bắt được và đã sửa

Tự chấm bắt được lỗi thật, không phải chỉ ký duyệt bản của mình:

| # | Lỗi | Vì sao đắt | Sửa |
|---|---|---|---|
| 1 | 🔴 **`--t4` cho chữ nhỏ** (nhãn đảo · vai trò · trạng thái · nút nấc) | Đo: **3,65:1 nền Mực · 2,86:1 nền Kem** — trượt 4,5:1 **cả hai** nền | → `--t3` (6,93 / 4,90) |
| 2 | 🔴 **Xương sống vẽ một đường dài rồi lấy khối màu "xoá" chỗ đứt** | Khối xoá lấy `--bg` còn rail nền `--panel` ⇒ hiện ra một chip lệch màu; ở nấc immersive rail trong suốt thì **chẳng có gì để xoá bằng** | Xương sống **một đoạn cho mỗi đảo** — chỗ đứt thành THẬT, đúng ở cả ba nền |
| 3 | 🔴 **Hàng cao 38px** | Phá đúng phép tính biện minh cho 56 (=44+2×4+2×2), và dưới ô chạm `--tap` | → **44px**, khung vẽ nâng 452→700px cho khớp độ cao thật |
| 4 | 🟡 `aria-describedby` trỏ vào node `hidden` | Nhiều trình đọc màn hình bỏ qua nội dung `hidden` ⇒ đúng nút cần giải thích nhất lại mất kênh giải thích — **đúng bài học 16/08 của `ToolbarChip`** | Lớp ẩn-nhìn `.an-only`; **11/11** hàng mờ có lý do trỏ tới 3 node dùng chung |
| 5 | 🟡 Icon hạng dự án nhẹ bằng **màu** `--t4` | 2,86:1 — trượt cả ngưỡng **3:1 của đồ hoạ phi-chữ** | Nhẹ bằng **nét + cỡ**, màu giữ `--t3` mờ .86 |
| 6 | 🟡 Nút nấc 30-32px | Dưới ô chạm | → 44px (cả nút đổi theme và nút demo) |

⭐ Sửa xong CSS, **lời văn trong bản vẽ vẫn ghi số cũ** ("hé sáng 14px màu `--t4`", "dịch 1px").
Đây đúng bệnh *sổ nói sai code* — đã rà và đồng bộ lại toàn bộ số trong prose với CSS thật.

## 7 · Nghiệm thu đo được

Đo bằng trình duyệt thật 1440×900, không suy từ mã:

```
xuong song   left 27.5px · rong 1px · tam 28  ⟷ tam icon 28      → khop tuyet doi
mau xuong song  --vien-mo rgba(255,255,255,.06) · dao chang #3d3d45 (--border-strong)
hang            44px          nut nac 44px
ba nac          56px → 236px → 320px  (do that, khong phai khai)
nhan chu        opacity 0 (rail) → 1 (map)   ngu canh  none → block
nen Kem         rail #faf8f4 · nhan #726c62 · ten du an #211e19 · vach active #6a57f5
tuong phan      7/7 cap PASS ca hai theme (chu 4,5:1 · do hoa 3:1)
the can bang    div 232/232 · button 86/86 · nav 1/1 · section 6/6 · svg 90/90
tran ngang      khong · loi console  khong
```

Mọi hex trong tệp truy được về `app/globals.css`, trừ **hai** ngoại lệ đã khai ngay trong tệp:
`#08080a` (nền giấy trình bày — đúng giá trị `mock-he-thi-giac-3-man.html` đang dùng) và `#e9e5dd`
(= `--hover` nền Kem). Ô tròn vật liệu **cố ý không đổi theo theme**: đó là màu của vật liệu thật,
gỗ sồi không sáng lên vì người dùng bật nền Kem.

## 8 · Đánh giá khách quan

**Được:** giải bằng **ngữ pháp hình học** chứ không bằng trang trí, nên nó không thể đọc ra như
Notion/Linear — ba app đó đều dựa vào *hàng có nền bo tròn* làm tín hiệu chọn, thứ bản này bỏ hẳn.
Tự chấm bắt 6 lỗi thật, trong đó 3 lỗi 🔴.

**Chưa được / rủi ro:**
- Xương sống là tín hiệu **mảnh 1px**. Trên màn kém hoặc độ sáng thấp nó có thể yếu hơn dự tính —
  đây là rủi ro thật của hướng "quiet field", chỉ **mắt Hoà trên màn thật** mới phán được.
- Nấc 320 chỉ vẽ **4 kiểu nội dung**; các mục còn lại chưa thử.
- Đã dựng **đảo dự án nén thành chấm** ở nấc rail, nhưng chưa giải bài "nhiều dự án mở cùng lúc".

## 9 · CHƯA CHẮC / CHƯA KIỂM — khai đủ

1. **Chưa chạy trong app thật.** Bản vẽ là HTML tĩnh; rail thật là `RailDieuHuong.tsx` với state,
   router, `localStorage`. Mọi kết luận về hành vi là **thiết kế**, chưa phải **quan sát**.
2. **`prefers-reduced-motion` chưa kích hoạt lần nào** — nhánh tĩnh viết theo luật, chưa chạy thử.
3. **Chỉ đo trên Chromium.** Safari/Firefox là suy; `backdrop-filter` ở thanh trên chưa thử Safari.
4. **Chưa thử trình đọc màn hình thật.** `aria-describedby`/`aria-current`/`nav` đúng theo chuẩn,
   nhưng VoiceOver/NVDA đọc ra sao thì chưa nghe.
5. **Trễ hover chưa dựng** — luật đã ghi ở §05 nhưng bản vẽ chưa có mã cho nó.
6. **Chưa thử zoom 200%** và chưa thử màn hẹp; khung vẽ dùng bề rộng cố định.
7. **Con số 56 (thay 52)** là T lane này chọn trong khoảng đã chốt, **Hoà chưa duyệt**.
8. Pane xem trước trả kết quả **trễ một lượt gọi** — mọi số ở §7 đã đọc lại lần hai để xác nhận,
   nhưng đó là **cách đọc quanh một hạn chế của công cụ**, không phải phép đo sạch.

## 10 · Việc kế cho MAIN

1. Đẩy `mock-sidebar-ban-do-2026-08-22.html` lên Claude Design (nhóm *Hệ thị giác*) — Hoà duyệt mắt.
2. Đối chiếu với `mock-he-thi-giac-3-man.html` xem hai bản có cãi nhau chỗ nào không.
3. Duyệt xong mới tích hợp: bỏ `RailDieuHuong.tsx:400-403`, và sửa docstring
   `StageSwitcher.tsx` — nó vẫn tự khai *"trục điều hướng duy nhất"*, câu đó **lỗi thời từ 16/08**.
