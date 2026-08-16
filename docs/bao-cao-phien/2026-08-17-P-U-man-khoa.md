# P-U — MÀN KHOÁ CÓ HÌNH NỀN · **DỪNG Ở Ô ⓪, BÁC TIỀN ĐỀ**

> Phiên phụ P-U · 17/08 · phiếu `docs/phieu-giao/P-U-man-khoa-co-hinh-nen.md`
> Mốc: `58ef7be` · lệch main **0** · **KHÔNG sửa một dòng code nào** (ô ⓪ buộc dừng).

---

## 1 · Tổng quan

⓪b **PASS**. ⓪ **BÁC BỎ**.

Hai khẳng định của tiền đề đều **đúng từng chữ về file mà nó nêu tên** — nhưng
`components/LoginScreen.tsx` **không ai import**, nó là **mã chết**. Sửa nó xong màn hình Hoà
nhìn thấy **không đổi một pixel nào**.

Màn đăng nhập thật là `components/entry/LoginScreen.tsx`, và nó **đã có sẵn** một hệ nền đầy đủ
(`LoginBackdrop`): 4 preset gradient · 5 nền động sinh bằng mã · ảnh người dùng tải lên ·
ảnh Unsplash/Openverse/URL · trình chiếu Ken Burns · đo tương phản thích ứng theo từng ảnh.

**Nguyên nhân thật của "ko có hình nền"**: kho ảnh dựng sẵn bị rút rỗng từ 05/08 theo luật trung
tính (`WALLPAPERS = []`, `public/wallpapers/` = **0 tệp**), nên mặc định rơi xuống nền động
`aurora` — một chuyển sắc CSS tối. Máy chạy **đúng thiết kế**; mắt người đọc ra là "không có ảnh".

⇒ Phiếu nhắm đúng **triệu chứng**, sai **cả hai địa chỉ**, và cách chữa nó kê sẽ **đẻ ra lớp nền
thứ hai** — đúng thứ chính ô ⑤ của nó cấm.

---

## 2 · Chi tiết từng mục

### 2.1 · ⓪b Tiền đề hạ tầng — PASS

| Lệnh | Kết quả thật |
|---|---|
| `git log --oneline -1` | `58ef7be docs(memory): nén phiên 17/08 đợt #3 — 2 lệch sổ, vá 2 máy soi, chẩn lại dải đen` |
| `git rev-list --count HEAD..main` | `0` |

Đứng đúng mốc phiếu ghi. Không tái diễn ca 167-commit.

### 2.2 · ⓪ Tiền đề nghiệp vụ — BÁC, kèm bằng chứng

**Vế ①** *"`SystemWallpaper` xuất hiện 0 lần trong `LoginScreen.tsx`"* — **đúng, nhưng vô nghĩa**.

| Đo | Kết quả |
|---|---|
| `grep -c SystemWallpaper components/LoginScreen.tsx` | `0` ✔ đúng như phiếu |
| Ai import `components/LoginScreen`? | **rỗng — 0 nơi** |
| Ai import `components/entry/LoginScreen`? | `app/login/page.tsx:13` · `components/home/HomeScreen.tsx:21` (render ở `:503`) |

`components/LoginScreen.tsx:52` khai `export function LoginScreen` nhưng **không tệp nào gọi tới**.
Ba commit gần nhất chạm nó (`544999f`, `0471b54`, `74cf4c5`) đều là **quét đổi tên token hàng loạt**
— tức nó đang được các đợt quét cơ khí kéo theo, tạo **dấu hiệu sống giả**. Đây đúng họ bệnh
"bản đồ mồ côi" ghi trong sổ 16/08, chỉ khác chiều: tệp thì chết, mà lịch sử git đọc như đang sống.

**Vế ②** *"tông nâu đến từ `COPPER = '#c79a63'` gõ cứng ở `LoginScreen.tsx:14`"* — **đúng địa chỉ đã
nêu, nhưng bỏ sót đường sống**. Màu đồng **có thật trên màn Hoà nhìn thấy**, ở chỗ khác:

| file:dòng | Vai trò | Nằm trên đường sống? |
|---|---|---|
| `components/LoginScreen.tsx:14` | hằng `COPPER`, dùng ở `:98 :119 :154 :169 :175 :194 :236` | ❌ mã chết |
| `components/entry/LoginBackdrop.tsx:608` | **quầng đồng của preset `ember`** | ✅ **có** |
| `components/entry/LoginBackdrop.tsx:74` | swatch `ember` trong bảng chọn nền | ✅ có |
| `components/entry/StackedCards.tsx:84` | viền trong thẻ xếp chồng | ✅ có |
| `components/entry/cardFaces.tsx:119` | nền bìa "Present · Deck" | ✅ có |

Phiếu ghi 4 nơi dùng (`:98 :119 :154 :236`); thực tế trong tệp chết là **7** nơi (thiếu
`:169 :175 :194`, trong đó `:154` và `:194` viết dạng `rgba(199,154,99,…)` nên `grep` hex không bắt).

🔴 **Điểm nặng nhất**: `useLoginBackdrop()` khởi tạo `{kind:'preset', id:'ember'}`
(`LoginBackdrop.tsx:222`) — tức **khung hình đầu tiên khi mount, và toàn bộ bản SSR**, là
**quầng đồng `#c79a63`**. Màu Hoà bỏ hẳn 16/08 đang là thứ **đập vào mắt trước nhất** của sản phẩm.

### 2.3 · Vì sao màn hình không có ảnh — nguyên nhân thật

Chuỗi thoái lui trong `loadChoice()` (`LoginBackdrop.tsx:153-181`):

```
localStorage có lựa chọn cũ?  → dùng
   ↓ không
WALLPAPERS.length > 0 ?       → trình chiếu bộ ảnh dựng sẵn
   ↓ không   ← ĐANG RƠI VÀO ĐÂY
{ kind: 'dynamic', id: 'aurora' }   ← chuyển sắc CSS tối, KHÔNG PHẢI ẢNH
```

| Đo | Kết quả |
|---|---|
| `WALLPAPERS` (`LoginBackdrop.tsx:111`) | `[]` — rỗng từ 05/08, luật trung tính |
| `ls public/wallpapers/ \| wc -l` | **0** |
| `.if-dyn-aurora` trong `app/globals.css` | có thật (`:1327`, 25 dòng họ `if-dyn`) |

⇒ CSS **không hỏng**, nền **có** hiện. Nhưng nó là chuyển sắc tối trơn, nên đúng nghĩa đen câu Hoà
nói. Docblock `LoginBackdrop.tsx:8-14` đã tự khai trước: bỏ ảnh đi thì cơ chế vẫn nguyên, **chỉ cần
đổ ảnh có giấy phép vào là sống lại, không phải sửa gì thêm**.

### 2.4 · 🔴 Phát hiện ngoài phạm vi — HAI hệ nền sinh bằng mã song song

| | `DYNAMIC_BGS` | `WALLPAPER_SETS` |
|---|---|---|
| Ở đâu | `components/entry/LoginBackdrop.tsx:134` | `lib/wallpaper/sets.ts:61+` |
| Số bộ | **5** | **5** |
| Cách sinh | class CSS (`globals.css:1319-1455`) | tính trong TS (`css.ts` + `sets.ts`) |
| Dùng ở | màn đăng nhập | Home (`DongStudioHome.tsx:543`) |
| Có cửa kiểm tương phản lúc build | ❌ chỉ có `lum` khai tay | ✅ `contrast.ts`, 240 phép đo |

Và **`contour` ≡ `binh-do`** — cùng một hiện tượng, hai cái tên, hai lần cài đặt.

Đây là tín hiệu ② của `may-soi-dong-dang` (*hai union cùng vai ngữ nghĩa, khác từ vựng*), đang
sống thật trong repo. **Việc ④ của phiếu sẽ làm nó nặng thêm**: cắm `SystemWallpaper` vào màn đăng
nhập là dựng **lớp nền thứ ba** chồng lên `LoginBackdropLayer` vốn đã ở đó — trong khi chính ô ⑤
viết *"KHÔNG viết lớp nền thứ hai"*. Ô ⑤ đúng tinh thần; nó chỉ không biết là **lớp thứ hai đã tồn
tại từ trước**, ở phía màn đăng nhập.

---

## 3 · Tổng kết lại vấn đề

Lời chê của Hoà **đúng và đáng sửa**. Nhưng phiếu chẩn sai ở ba tầng:

1. **Sai tệp** — nhắm mã chết; sửa xong màn hình không đổi.
2. **Sai chẩn đoán** — không phải *"chưa ai cắm hình nền"*, mà là *"hệ hình nền có đủ, kho ảnh bị
   rút rỗng nên rơi xuống nấc thoái lui cuối"*. Tính năng không thiếu; **nguyên liệu** thiếu.
3. **Sai cách chữa** — thứ cần là **ảnh có giấy phép** (hoặc một quyết định về nấc mặc định), không
   phải thêm một lớp nền nữa.

Điều tiền đề nói đúng mà phiếu **chưa khai thác**: màu đồng **thật sự còn sống** trên màn đầu tiên
của sản phẩm — chỉ là ở `LoginBackdrop.tsx:608/74`, không phải ở địa chỉ phiếu ghi.

---

## 4 · Đánh giá khách quan

**Tốt** — cơ chế ô ⓪ lần nữa chặn đúng ca nó sinh ra để chặn: phiếu mạch lạc, số liệu đúng, mà làm
theo thì tiêu công vô ích **và** để lại một lớp nền thừa. Hạ tầng `LoginBackdrop` cũng tốt hơn tôi
tưởng lúc nhận việc (đo tương phản theo từng ảnh, chống nền đen ở bản Electron, chặn tab ẩn).

**Chưa tốt** — mã chết `components/LoginScreen.tsx` là **cái bẫy đang mở**: nó mang đúng tên, đúng
nội dung nghiệp vụ, và có lịch sử git mới, nên phiên sau rất dễ dính lại. Tôi là người thứ nhất;
sẽ có người thứ hai nếu không đóng dấu.

**Rủi ro** — sản phẩm định vị bán ra đang lấy **màu đã bị bỏ** làm khung hình đầu tiên, và kho ảnh
rỗng thì mọi người dùng mới đều gặp nấc thoái lui. Cả hai đều nằm ở mặt tiền, không phải góc khuất.

**Tôi tự chấm mình**: đọc `grep` ra "0 importer" rồi mới dám kết luận — đúng bài học 16/08 *"đã grep
thì đọc đường dẫn trong kết quả"*. Nhưng tôi **không chạy app**, nên toàn bộ phần "màn hình trông ra
sao" là **suy từ mã**, không phải nhìn thấy.

---

## 5 · Hướng xử lý — bốn góc độ

| | Hướng | Ưu | Nhược |
|---|---|---|---|
| **A** | **Đổ ảnh có giấy phép vào `public/wallpapers/`** + liệt kê vào `WALLPAPERS` | Rẻ nhất. 0 dòng logic. Trình chiếu·Ken Burns·đo tương phản **sống lại ngay** đúng như docblock hứa | Phải có ảnh sạch giấy phép — quyết định của Hoà, không phải của máy |
| **B** | **Đổi nấc mặc định** từ `aurora` sang bộ nền động khác đẹp hơn | 1 dòng | Vẫn không phải ảnh ⇒ **không giải lời chê**, chỉ đổi sắc thái |
| **C** | **Gộp hai hệ nền** — màn đăng nhập dùng `WALLPAPER_SETS` | Xoá một bản trùng, có cửa kiểm tương phản lúc build | Đúng nhưng **to**, phải giữ được ảnh-người-dùng + đo-theo-ảnh mà `LoginBackdrop` đang có |
| **D** | **Gỡ màu đồng khỏi đường sống** (`LoginBackdrop.tsx:608/74` + 2 tệp `entry/`) | Thi hành thẳng chốt 16/08, không phụ thuộc ai | Chưa chốt màu nhấn thứ hai ⇒ chỉ được *thôi dùng đồng*, chưa được *chọn màu mới* |

---

## 6 · Đề xuất

**Làm D ngay + A khi Hoà cấp ảnh. Hoãn C. Bỏ B.**

- **D trước** vì nó là việc **chắc chắn đúng và không chờ ai**: chốt 16/08 đã ghi thành lời
  *"nút Vào xưởng ở màn khoá đang màu đồng → đổi theo"*. Ràng buộc ⑤ vẫn giữ nguyên hiệu lực —
  chuyển sang `--accent`, **không chế màu mới**. Chỉ khác một điều so với phiếu gốc: sửa ở
  `components/entry/`, không sửa tệp chết.
- **A** là thứ **thật sự** giải câu *"ko có hình nền"*. Nó chờ đúng một đầu vào từ Hoà (ảnh sạch
  giấy phép) và **0 dòng logic** — đường rẻ nhất từ lời chê tới màn hình đẹp.
- **Hoãn C**: gộp hai hệ nền là việc đúng nhưng phải đi qua T, vì nó chạm biên liên chặng
  (Home ↔ màn đăng nhập) — vượt quyền phiên phụ.
- **Bỏ B**: đổi `aurora` sang bộ khác vẫn là chuyển sắc CSS. Hoà chê **không có ảnh**, không chê
  ảnh xấu. B chữa sai chỗ.

**Kèm hai việc dọn, rẻ, nên làm cùng lượt:**
1. **Đóng dấu ⛔ LỖI THỜI ngay dòng đầu `components/LoginScreen.tsx`** (hoặc xoá hẳn) — thi hành
   luật 15/08 *"văn bản bị thay phải đóng dấu tại chỗ, không im lặng bỏ hoang"*. Đây là cái bẫy đã
   bắt được tôi hôm nay.
2. Mở entry `may-soi-dong-dang` cho ca `DYNAMIC_BGS` ↔ `WALLPAPER_SETS` (T tự mở — agent không sửa
   `frontier-registry.mjs`).

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- 🔴 **Chưa chạy app một dòng nào** (phiếu cấm dev server). Mọi câu về *"màn hình trông thế nào"* là
  **đọc mã**, không phải nhìn thấy. Cụ thể chưa xác minh bằng mắt: nền `aurora` thật sự hiện ra sao ·
  quầng đồng `ember` có kịp lộ ở khung đầu trước khi `useEffect` đổi sang `aurora` hay không (tôi đọc
  mã là **có**, vì `useState` khởi tạo `ember` rồi `useEffect` mới chạy — nhưng chưa đo được nó kéo
  dài bao lâu, và đó là khác biệt giữa "nháy một khung" và "thấy rõ").
- 🔴 **Không có số tương phản nào trong báo cáo này.** Phiếu ⑥b đòi số cho ca ảnh sáng/ảnh tối —
  tôi dừng ở ⓪ nên **không tính, không đo**. Không suy đoán hộ. Ghi nhận: đường sống đã có máy làm
  việc này (`useCardText` → `lib/adaptive-contrast.ts`, ngưỡng `AA_NORMAL` = 4.5, đo thật vùng
  `CARD_REGION` của từng ảnh) — **nhưng tôi chưa kiểm nó chạy đúng**, chỉ đọc thấy nó tồn tại.
- **Ca "ảnh người dùng tự thả" chưa thử với ảnh thật nào** — không dựng giả, không thử thật.
- **Không tìm thấy** ảnh `00-01-man-khoa.png` trong thư mục Drive duyệt mắt ⇒ **chưa đối chiếu được
  ảnh Hoà xem với màn tôi phân tích**. Đã loại trừ được ứng viên kia bằng mã: `components/studio/`
  `LockScreen.tsx` (màn khoá ⌃⌘Q — chữ *"màn khoá"* trong repo trỏ **hai** thứ) chỉ là **lớp phủ
  mờ đè lên app đang chạy** (`:99` `color-mix(--bg 55%)` + `blur(28px)`), 134 dòng, **không có màu
  đồng**; chụp nó thì thấy app mờ phía sau, **không ra ảnh "không có hình nền"**. ⇒ ảnh Hoà xem gần
  như chắc chắn là `entry/LoginScreen`. Vẫn ghi là **suy luận có loại trừ, không phải đã nhìn thấy
  ảnh**.
- Danh sách nơi dùng `#c79a63` lấy bằng `grep` hex + ba dạng `rgb` đã biết; **dạng ghép chuỗi hoặc
  biến trung gian thì grep mù** ⇒ con số là **sàn dưới**, không phải danh sách đủ.
- **Chưa chạy** `tsc` / `npm test` / hai máy soi — không sửa gì thì không có gì để nghiệm thu, và
  chạy chúng lúc này chỉ đo trạng thái người khác để lại.

## ⑦c · HẠN DÙNG KẾT LUẬN

- Hết đúng **khi ảnh được đổ vào `public/wallpapers/`** — lúc đó `loadChoice()` tự quay về trình
  chiếu, nguyên nhân gốc biến mất, mục 2.3 thành lịch sử.
- Hết đúng **khi Hoà chốt màu nhấn thứ hai** — hướng D phải rà lại: chỗ nào thôi dùng đồng mà tạm
  mượn `--accent` cần cân xem có thuộc về màu mới không.
- Hết đúng **nếu `components/LoginScreen.tsx` được nối lại vào luồng** — khi đó nó thôi là mã chết
  và tiền đề gốc của phiếu sống lại nguyên vẹn.
- Hết đúng **nếu ảnh `00-01-man-khoa.png` hoá ra chụp `components/studio/LockScreen.tsx`** — xem
  ⑦b; đây là giả định nền của cả báo cáo.
