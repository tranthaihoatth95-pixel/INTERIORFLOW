# M4-OUT — vòng vò app (06/08) · chẩn đoán qua giao diện + sửa 3 lỗi tuân thủ/logic avatar

Hai phần tách bạch, KHÔNG trộn:

- **Phần A — chẩn đoán, CHỈ LOG**: bật máy chủ phát triển, đi task thật qua giao diện, gãy đâu ghi
  vào `GAP-IF.md`. Không sửa gì trong phần này.
- **Phần B — sửa, ĐƯỢC PHÉP**: gỡ màu thương hiệu khỏi avatar (bug tuân thủ) + 2 lỗi logic avatar
  Hoà chỉ ra khi xem ảnh dựng.

**V6 — không commit.** Mọi thay đổi nằm ở thư mục làm việc.

---

## A · Chẩn đoán qua giao diện

### A1. Kết quả đi task

| Đi qua | Kết quả |
|---|---|
| Vào app → chặng vẽ 2D → vẽ một đoạn tường | chạy đúng |
| Chuyển sang chặng 3D → bật dựng khối | **khối dựng lên đúng từ nét vừa vẽ ở 2D** — luật "vẽ ở đâu cũng ghi vào một nguồn" còn sống |
| Mở màn đổi ảnh đại diện, đi hết các thẻ | chạy đúng, 0 lỗi console khi nạp lại trang từ đầu |
| Quét route: kho vật liệu · bảng màu · thư viện · tệp · cài đặt · trình chiếu · hai route cũ | đều 200 |

### A2. Hai mục vào `GAP-IF.md`

- **G-M4-02 · 🔴 GAP thật** — công tắc chế độ màn vẽ hiện `Sketch/Pro/Revit` (khoá nội bộ) trên mặt
  nút, đẩy tên chính thức tiếng Việt vào tooltip. Ngược đúng chiều so với chốt tên và so với cách
  đã làm cho tên khối. Xác nhận bằng đọc DOM, không suy từ ảnh chụp.
- **G-M4-01 · ⚪ ĐÃ RÚT** — xem A3.

### A3. 🔴 Một kết luận của chính phiên này đã bị chứng minh là SAI — ghi lại để không ai lặp

Giữa phiên tôi báo: *"`/login` trả 404 dù trang tồn tại và biên dịch sạch — tái hiện trên cả máy chủ
sạch lẫn máy chủ cũ, ép biên dịch lại vẫn 404"*. **Kết luận đó không đứng vững.** Đo lại sau đó:
`/login` trả **200**.

Nhật ký máy chủ cho thấy cơ chế thật:

```
✓ Compiled /login  →  ✓ Compiled /_not-found  →  GET /login 404
✓ Compiled /settings/avatar → GET /settings/avatar?… 404 → GET /settings/avatar 200
```

Lần gọi ĐẦU ngay sau khi một route vừa biên dịch **đôi lúc** rơi vào nhánh không-tìm-thấy; gọi lại
là 200. Tật của máy chủ phát triển, không có trong bản phát hành.

**Bài học vận hành, quan trọng hơn cả cái GAP hụt:** 404 trên máy chủ phát triển **không phải bằng
chứng lỗi**. Trong phiên này một máy chủ chạy hơn một ngày trả 404 cho cả `/` lẫn `/login` trong khi
trang khác vẫn 200 — suýt nữa tôi ghi hai lỗi sản phẩm không tồn tại. Đo lại trên tiến trình MỚI
rồi mới được kết luận.

### A4. Việc phụ nhặt được, chưa xử lý

- `npx tsc --noEmit -p .` còn **1 lỗi CŨ** ở `lib/cad/render-layer-index.test.ts:36` (TS2352, thiếu
  `panX/panY`) — có từ commit gần nhất, **không phải của phiên này**. Chưa sửa (ngoài phạm vi).
- Nhật ký máy chủ có vài lượt `/api/*` trả 404. **Chưa xác minh** là thiếu route thật hay cùng tật
  đua ở A3 — không ghi thành GAP khi chưa đo lại.

---

## B · Ba việc đã sửa trên avatar

### B1. Gỡ màu thương hiệu (bug tuân thủ)

Ba màu của một studio khách bị nhúng cứng ở **10 chỗ**: bảng màu áo (`navy`/`orange`/`white`) và 7
chỗ vẽ thẳng trong SVG (dải mũ phớt · quả bông mũ len · ghim cổ · đèn tai nghe · băng đô · vòng viền
khung · ba sắc navy của mũ). Đổi hết sang màu trung tính cùng họ, **giữ nguyên KEY** nên ảnh đại
diện người dùng đã lưu chỉ đổi sắc độ, không mất lựa chọn.

Miễn trừ cũ trong `lib/legal/brand-neutrality.test.ts` dựa vào hai lập luận, cả hai đã hết hiệu lực:
① "avatar là giao diện của app nên được có nhận diện riêng" — luật cho phép nhận diện riêng của
**sản phẩm này**, không phải của một studio khách (chính chú thích cũ đã tự nhận là chưa đủ);
② "avatar sắp đổi sang ảnh thật nên sửa màu là sửa thứ sắp bỏ" — nhưng bản vẽ vẫn là đường dự phòng
đang chạy thật, và đợt đổi kiến trúc chưa có ngày.

⇒ **Gỡ miễn trừ.** Hai tệp avatar nay nằm trong lưới quét; thêm nhóm kiểm `[3]` khẳng định riêng
rằng chúng **thực sự nằm trong tập được quét** — không chỉ "sạch". Đổi tên tệp hay đổi phạm vi quét
mà làm chúng rơi ra ngoài lưới thì test đỏ, thay vì im lặng xanh.

### B2. SỬA 1 — da phải là MỘT biến

**Gốc lỗi:** `skin` vốn đã là một biến, nhưng **12 chỗ vẽ da mỗi chỗ tự bịa hệ số riêng**
(`darken(skin, .04/.12/.18/.20/.24/.30/.32/.34/.36/.50/.55)`). Hệ quả đọc được bằng mắt: tai trái
`−.04` còn tai phải `−.20` — lệch nhau `.16` trong khi cả khối cầu khuôn mặt chỉ đi từ `+.16` xuống
`−.12`, tức **tai phải tối hơn cả chỗ tối nhất của mặt**. Cổ `−.18` cũng không khớp nấc nào của mặt.

**Sửa:** đúng một thang `skinRamp(base)` — nơi DUY NHẤT được pha sáng/tối lên da, 7 nấc có tên
(`lit · sheen · base · shade · recess · deep · cast`). Tai trái lấy `base`, tai phải lấy `shade` —
đúng hai nấc mà chính gradient khuôn mặt dùng ở hai phía đó, nên tai không còn "rời" khỏi mặt.

### B3. SỬA 2 — đội nón thì tóc phải biết

**Gốc lỗi:** `config.hat` **chỉ được truyền cho phần vẽ nón**. Ba phần vẽ tóc (lớp sau, lớp trước,
bóng chân tóc) không hề nhận nó ⇒ tóc vẽ y hệt nhau dù có nón hay không, nón chỉ được đắp đè lên.
Kiểu tóc khối cao chui lên trên cả thân nón; bóng chân tóc vẫn hắt xuống trán dù chân tóc đang nằm
khuất dưới nón.

**Sửa:** mỗi nón khai mép dưới phần che kín sọ (`HAT_COVER_Y`). Tóc lớp TRƯỚC bị cắt trên mép đó;
tóc lớp SAU giữ nguyên nên đuôi và lọn dài vẫn lộ ra dưới nón; bóng chân tóc tắt khi chân tóc khuất.
`null` cho băng đô và tai nghe — hai thứ này nằm TRÊN tóc, tóc phải nguyên vẹn. Đây là lý do bảng
này không thể thay bằng một cờ đúng/sai.

### B4. Test khoá — `lib/avatar-invariant.test.ts` (mới), 23/23

Dựng **thật** bằng React chứ không đọc nguồn dạng chữ, vì hai lỗi trên là lỗi HÀNH VI: "tai ≠ mặt"
chỉ lộ ra sau khi đã tính xong màu, "nón không đổi tóc" chỉ lộ ra khi so HAI bản dựng khác cấu hình.
Gỡ được hai rào từng buộc test cũ phải đọc chữ: vá bộ phân giải đường dẫn cho bí danh `@/`, và gắn
`React` toàn cục cho JSX lối cổ điển — **không sửa tệp sản phẩm để chiều test**.

| Nhóm | Khoá điều gì |
|---|---|
| `[1]` | Mọi vùng da tô đúng nấc của thang (90 vùng × 6 tông) · màu tai nằm trong bộ màu khuôn mặt · đổi tông da thì **0 vùng đứng yên** · **0 chỗ tự pha sáng/tối lên `skin`** ngoài thang · miễn trừ pha-màu-khác đúng 2 chỗ đã biết (môi, má) |
| `[2]` | Mọi kiểu nón đều khai mép che (không sót) · nón che sọ → tóc ĐỔI THEO (5/5) và cắt đúng mép đã khai · nón không che sọ → tóc NGUYÊN VẸN (3/3) · tóc dài phía sau vẫn lộ · bóng chân tóc tắt/bật đúng **cả hai chiều** |
| `[3]` | Đổi tông da → **mọi đường hình học y hệt** (cấm chạm hình/khối) và màu cấu kiện không trôi theo da · ba trục đổi-được (tông da · phụ kiện · nền) phải thật sự đổi được |

**Đã chứng minh test cắn thật** — bẻ lại đúng hai lỗi cũ, mỗi lần phục hồi ngay:

| Bẻ lại | Test bắt |
|---|---|
| tai phải về hệ số tự bịa | 3 FAIL (lệch thang 6 vùng · tai ≠ mặt · 1 chỗ pha ngoài thang) |
| gỡ phép cắt dưới-nón khỏi tóc lớp trước | 1 FAIL (`tóc ĐỔI THEO 0/5`) |

`avatar-render.test.ts` (khoá toạ độ, có sẵn) · `avatar.test.ts` · `brand-neutrality.test.ts` đều
PASS, không hồi quy. `tsc` không thêm lỗi mới.

### B5. Ảnh dựng để nhìn (`docs/screenshots/`, `.gitignore` chặn — ảnh xem, không commit)

| Tệp | Nội dung |
|---|---|
| `avatar-truoc-va.png` · `avatar-sau-va.png` | 8 kiểu, cùng cấu hình — chứng minh **chỉ đổi màu, không đụng một toạ độ nào** |
| `avatar-sua-logic.png` | A/B logic cũ ↔ mới, **cùng bảng màu**: tóc hết chui qua mũ len/lưỡi trai/phớt; băng đô và tai nghe giữ nguyên (bằng chứng không sửa quá tay) |

Lấy bản trước vá bằng cách đọc thẳng từ lịch sử ra thư mục tạm, **không dùng `git stash`** — kho
đang có phiên khác làm song song, stash trơn sẽ cuốn cả tệp của họ. Thư mục làm việc không bị đụng
một byte (đã đối chiếu số dòng thay đổi trước/sau).

---

---

## C · Vòng SỬA (06/08, sau chẩn đoán) — 2 agent: 1 làm · 1 kiểm phản biện

### C0. BƯỚC 0 (N7) — grep trước, và nó đổi hẳn việc phải làm

| Định thêm | Grep ra | Xử lý |
|---|---|---|
| Tên chính thức 3 chế độ vẽ 2D | **ĐÃ CÓ** — `CadStageScreen.tsx:55/63` khai `[vi,en]`; `mode-registry.ts:36`; `i18n.ts:30` có `useT()` | **NỐI**, không đặt tên mới |
| "Lỗi lông mày theo kiểu nón" | **KHÔNG TỒN TẠI** — xem C3 | Không sửa |

### C1. G-M4-02 — nút chế độ hiện tên chính thức ✅

Đảo nhãn trong `ModeSwitch`: mặt nút nay là `Sơ phác` · `Kỹ thuật` · `Nội thất`, khoá kỹ thuật
biến khỏi giao diện nhưng **`onChange('sketch'|'pro'|'revit')` nguyên vẹn từng ký tự** (đổi khoá =
vỡ dữ liệu đã lưu). Nhãn đi qua `useT()` sẵn có nên EN ra `Sketch · Technical · Interior` — hết
mượn tên phần mềm hãng khác.

Tự nghiệm thu trên trình duyệt thật: nút hiện đúng tên · **0 chuỗi khoá kỹ thuật lọt ra giao diện**
(đọc DOM) · nhánh EN gạt tay xác nhận · thanh công cụ có tràn nhưng cuộn được và **đã tràn từ trước
khi sửa** nên không phải hồi quy.

### C2. 🔴 Kiểm phản biện phát hiện test khoá của chính vòng trước LÀ LỖ — đã vá

Vòng trước tôi báo "23/23, đã chứng minh cắn thật bằng 2 đột biến". **Kết luận đó quá vội.** Hai
đột biến tôi thử là loại *sửa thật thà*; agent phản biện thử 16 đường, trong đó **4 đường lách làm
test xanh y nguyên trong khi bug đã tái phát**. Tôi dựng lại từng cái để tự xác nhận, không tin lời:

| Đường lách | Trước vá | Sau vá |
|---|---|---|
| Dựng lại **nguyên bug gốc** (tai `−.04`/`−.20`) nhưng **xoá `data-skin`** | 🟢 xanh 23/23 | 🔴 2 fail |
| `HAT_COVER_Y.cap → null` (tóc chui xuyên mũ lưỡi trai trở lại) | 🟢 xanh 23/23 | 🔴 3 fail |
| `beanie: 88 → 200` (cắt bay cả tóc mai) | 🟢 xanh | 🔴 1 fail |
| Ép cả 6 nấc thang da về `0` (mặt phẳng lì, mất sạch khối) | 🟢 xanh | 🔴 1 fail |

**Gốc rễ — hai sai lầm thiết kế test, đáng nhớ hơn bản thân bug:**

1. **Khoá theo DẤU thay vì theo HÀNH VI.** Rào cũ chỉ soi phần tử mang `data-skin`; bỏ một thuộc
   tính `data-*` không đổi một pixel, không tsc/lint nào cản. Rào phụ grep `darken(skin` — khoá
   TÊN BIẾN, nên `darken(BASE_TONES[config.base], .2)` đi thẳng qua.
   → Rào mới không dùng dấu nào: **«màu nào ĐỔI khi đổi tông da thì bắt buộc phải là một nấc của
   thang»**. Vẽ da bằng đường nào cũng rơi vào lưới này.
2. **Kỳ vọng dẫn xuất từ chính thứ đang bị kiểm.** `covering = HAT_STYLES.filter(h => HAT_COVER_Y[h] !== null)`
   ⇒ bảng đổi thì kỳ vọng đổi theo, luôn tự khớp; đặt cả 8 nón về `null` thì thành `0 === 0` xanh rỗng.
   → Nay là **danh sách viết tay** dựa trên sự thật vật lý của từng cái nón (mũ phớt/len/lưỡi trai/
   tai bèo/nồi ôm sọ; băng đô đè lên tóc; tai nghe vòng qua), cộng rào "hai danh sách phải phủ đủ
   mọi kiểu nón" nên thêm nón mới là buộc phải khai.

Vá thêm 4 chỗ nhỏ agent chỉ ra: phép cắt nay kiểm **trên thẻ `<g>`** chứ không chỉ trong `<defs>`
(gỡ clip khỏi `<g>` mà định nghĩa còn thì bản cũ vẫn xanh) · chọn tai bằng **toạ độ** thay vì bằng
`data-skin` (bản cũ gom nhầm 2 thẻ `<stop>` của gradient mặt vào tập "tai" ⇒ tự so với chính mình) ·
thêm chốt chống-rỗng cho phép so hình · **bỏ một tích xanh KHAI MAN**: dòng ghi "bảng nền vẫn trung
tính" nhưng thân hàm chỉ ĐẾM số key — nhét đúng màu beige thương hiệu vào vẫn in `ok`.

`lib/avatar-invariant.test.ts` nay **31 ok / 0 fail**.

### C3. Bộ quét trung tính cũng thủng — đã vá (đúng phép Hoà chỉ định)

Phép "để lại 1 hex lạ xem test có đỏ không": hex **bắt được** mọi ca (thường, HOA, 8 số, trong
chuỗi), chú thích **tha đúng**, và làm thủng lưới quét thì nhóm `[3]` **vẫn bắt**. Nhưng ba cú pháp
CSS **hợp lệ và đang phổ biến** đi thẳng qua: `RGBA(` viết hoa · `rgb(240 96 32)` cách bằng dấu
cách · `rgb(240 96 32 / 50%)`. Nguyên nhân: bản cũ **so chuỗi** sau khi bỏ hết khoảng trắng, nên
`rgb(240 96 32)` thành `rgb(2409632)` không khớp gì nữa.

Đúng **cùng loại lỗi** mà docblock của chính file đó đã ghi ("quét hex là KHÔNG ĐỦ"), chỉ lùi một
bậc. Nay **bóc số ra khỏi lời gọi** thay vì so chuỗi, không phân biệt hoa/thường, mọi dấu phân cách.
Còn sót có ghi rõ: `hsl()` và `color(srgb …)` viết cùng một màu vẫn lọt — muốn bắt phải đổi hệ màu.
`brand-neutrality.test.ts` nay **16 ok / 0 fail**.

### C4. Lông mày — KHÔNG có lỗi, không sửa

Hoà giao "sửa lông mày 2 kiểu (băng đô, tai nghe) ra màu lạ — bind về đúng biến". Đo ba đường, cả
ba nói ngược lại:

1. **Hành vi**: giữ nguyên màu tóc, đổi qua cả 8 kiểu nón → lông mày ra **cùng một mã màu** ở cả 8.
2. **Hình học**: mép dưới băng đô cách lông mày 5,4–10,8 px (đo theo từng hoành độ); vòng gọng tai
   nghe ở tầm lông mày nằm cách gần 40 px. Không chỗ nào chạm.
3. **Nguồn**: `AvatarRenderer.tsx:302` bind `color={darken(hair, 0.22)}` — một biến duy nhất, `hat`
   không đi vào đó. Thumbnail cũng không phá (`AvatarBuilder.tsx:123` chỉ override đúng 1 thuộc tính).

⇒ Lông mày **đã bind đúng biến rồi**. Thứ Hoà nhìn thấy gần như chắc chắn là do **ảnh A/B tôi gửi
lượt trước**: tôi chọn tóc `pink` cho cột băng đô và `silver` cho cột tai nghe, mà lông mày bám màu
tóc nên ra hồng tím / xanh xám. **Lỗi trình bày của tôi, không phải lỗi code.**

Có một khuyết tật THẬT nằm cạnh đó, nhưng nó là quyết định mỹ thuật nên tôi **không tự đổi**: lông
mày bám cả 4 màu tóc phi tự nhiên (teal → xanh lục sẫm, pink → hồng tím, lilac → tím, silver → xanh
xám). Người nhuộm tóc hồng thì lông mày vẫn nâu. Chờ Hoà chọn: **(a)** giữ nguyên · **(b)** kẹp lông
mày về dải nâu-đen tự nhiên (1 dòng + 1 rào test).

---

## Còn treo

- Đường thẳng test tôi vẽ vào app lúc đi task **chưa dọn** (nằm trong bộ nhớ đệm trình duyệt của
  phiên chạy thử, không phải cơ sở dữ liệu). Chờ Hoà cho phép.
- Máy chủ phát triển cổng 3005 do phiên này bật vẫn đang chạy nền.
- `G-M4-02` chưa sửa — đúng luật vòng chẩn đoán chỉ log.
