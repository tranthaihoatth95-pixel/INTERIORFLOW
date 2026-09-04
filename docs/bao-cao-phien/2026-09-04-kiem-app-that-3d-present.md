# Kiểm trên APP THẬT — 5 năng lực 3D · Trình chiếu (04/09)

> **Việc:** năm năng lực vừa thu hồi mới chỉ có bằng chứng MÁY (`tsc`/`npm test`), chưa ai bấm thử.
> Phiên này **ĐO trên app thật bằng con trỏ thật**, và chỉ sửa mã ở chỗ phép đo chứng minh có lỗi.
>
> **Bộ đo:** `scripts/kiem-3d-contro-that.js` (thu về từ `origin/checkpoint/2026-08-24-control-plane`,
> đã tham số hoá — xem §7). Playwright phát sự kiện chuột ở tầng CDP nên là **sự kiện tin cậy**:
> `setPointerCapture` chạy y như tay người. Pointer tổng hợp (`dispatchEvent`) KHÔNG giữ được
> capture, mà cả push/pull lẫn cử chỉ dựng khối của IF đều dựa vào nó — đó là lý do bộ đo này tồn tại.

## 0 · Môi trường đo

| | |
|---|---|
| Bản dựng | `npm run build` → `next start`, **NODE_ENV=production** (không phải `next dev`) |
| Cổng | `http://localhost:3143` |
| Trình duyệt | Chromium 1194 headless, WebGL2 qua swiftshader (`WebGL 2.0 (OpenGL ES 3.0 Chromium)`) |
| `deviceScaleFactor` | **2** — lỗi cắt cụt viewport CHỈ phát trên màn retina, DPR=1 không bao giờ bắt được |
| Tài khoản | `kiem@localhost.test` (mật khẩu qua biến môi trường, không ghi trong mã) |
| Dự án | `cmtmdaaws00017dmmhactp691` — tạo qua đúng đường app dùng (`POST /api/flows`) |

### ⚠️ Một giới hạn phải biết trước khi đọc mọi con số dưới đây
`window.__cadStore` **chỉ được gắn khi `NODE_ENV === 'development'`** (`lib/cad/store.ts:926`). Đo trên
bản dựng thật thì KHÔNG có nó ⇒ bộ đo này **không đọc kho**, nó đọc **thứ người dùng nhìn thấy**:
nhãn khung nhìn `.vplabel` · huy hiệu đếm của cây đối tượng (`Object3DTree.tsx:133`) · Inspector ·
và ẢNH CHỤP so từng điểm ảnh. Đây là bằng chứng **mạnh hơn** đọc kho: kho có dữ liệu mà màn hình
không hiện thì vẫn là hỏng — đúng bài học "mã có, đường dây tới người dùng đứt" của chính hôm nay.

### 🔴 Hai trở ngại hạ tầng đã cắn, ghi lại để phiên sau khỏi mất vòng
1. **`.next` DÙNG CHUNG.** Ba phiên cùng dựng vào một thư mục ⇒ máy chủ của tôi giữ manifest cũ
   trong khi CSS đã đổi băm: **mọi trang trả về trắng tinh**, `/_next/static/css/…css` → 404. Một
   lượt đo mất trắng vì tưởng giao diện hỏng. Cách thoát (không sửa tệp nào trong repo): chạy máy
   chủ từ **thư mục riêng** với `.next` **chép cứng bằng hardlink** —
   `cp -al .next /tmp/if-run/.next` + symlink `node_modules`/`public`/`next.config.mjs`/`prisma`.
   `next build` **xoá rồi tạo mới** tệp chứ không ghi đè tại chỗ, nên bản hardlink giữ nguyên inode
   và máy chủ **sống sót qua một lượt dựng của người khác**. ⇒ **Chỉ lúc DỰNG mới cần độc quyền,
   lúc CHẠY thì không.**
2. **Điều hướng bị huỷ.** Đứng ở `/favicon.ico` (bản cũ làm thế) rồi `goto` tiếp thì Next huỷ lượt
   đi (`net::ERR_ABORTED`) và trình duyệt nằm lại chỗ cũ. Nay vào `/login` trước, và mọi lượt đi
   qua `diToi()` có thử lại + xác nhận bằng URL cuối.

---

## Bảng tổng — năm mục

| # | Năng lực | Kết quả |
|---|---|---|
| 1 | Dựng khối bằng cử chỉ 3D | **PASS** |
| 2 | Chọn · viền hộp bao · xoá khối 3D | **PASS sau khi vá** (trước khi vá: FAIL đường bàn phím) |
| 3 | Viewport 3D không bị cắt trên retina | **PASS** |
| 4 | Bản vẽ → Trình chiếu | **PASS 3/3 sau khi sửa BỘ ĐO** — bản FAIL 9/10 bên dưới là **hiện vật của bộ đo**, giữ nguyên vì nó dẫn tới một rủi ro thật |
| 5 | Hàng tab ở khổ desktop hẹp | **PASS** |

---

## 1 · Dựng khối bằng cử chỉ 3D — **PASS**

Cầm công cụ (nút "Bắt đầu trong 3D" đóng card chào + cầm sẵn công cụ tường) rồi **kéo bằng con trỏ
thật trên mặt sàn**.

| Phép đo | Số |
|---|---|
| Khung nhìn | 824 × 881 |
| Nhãn trước khi kéo | `"Không gian trống"` |
| Nhãn sau khi kéo | `"Khối xám · chưa vật liệu"` |
| Hình có đổi | **57,36 %** điểm ảnh khác (1.665.542 / 2.903.776) |
| Cây đối tượng | mọc `CHƯA XẾP TẦNG · 2` → `Sàn` + `Tường 1` |
| **Ctrl+Z** | nhãn về `"Không gian trống"` ⇒ **lùi được** |
| **Kéo 1 điểm ảnh** | nhãn KHÔNG đổi ⇒ **bị huỷ đúng như thiết kế** |

Ảnh: `1a-truoc-khi-dung.png` · `1b-sau-khi-keo.png` (thấy rõ tường + cây đối tượng) ·
`1c-sau-hoan-tac.png` · `1d-keo-qua-nho.png`.

> ✅ **Đính chính một trở ngại được báo trước là "đã biết":** phiếu ghi *"khung nhìn 3D không mount
> khi chưa có mặt bằng 2D"*. **Trên nhánh này KHÔNG còn đúng** — dự án vừa tạo, chưa có một nét 2D
> nào, khung nhìn vẫn mount và kéo ra khối được ngay (`Render3DModeSkeleton.tsx:9` *"SÂN KHẤU LUÔN
> HIỆN"*, `:573` `scene={visibleScene ?? EMPTY_SCENE_3D}`). Tức luật X2/X3 (không chặn vì
> chưa-làm-bước-trước) đã được thi hành thật. Phiên sau đừng đi vẽ 2D trước cho phí công.

> ⚠️ **Quan sát ngoài tiêu chí, không tính là lỗi:** dựng xong thì camera **tự khung lại rất sát**
> — khối chiếm gần trọn khung hình và tràn mép phải (xem `1b`). Đây là `fitCameraToScene` chạy khi
> cảnh đổi. Không sai chức năng, nhưng là thứ nên đưa qua mắt Hoà.

## 3 · Viewport 3D trên màn retina — **PASS**

Chạy ở `deviceScaleFactor: 2` (`window.devicePixelRatio` xác nhận = 2).

| Phép đo | Số |
|---|---|
| Cỡ HIỂN THỊ của canvas | 824 × 881 |
| Cỡ Ô CHỨA (`.vpscene`) | 824 × 881 |
| **Tràn** | **0 × 0 px** |
| Bộ đệm vẽ (`canvas.width/height`) | 1236 × 1321 = hiển thị **× 1,5** ⇒ vẫn nét |
| CSS tính ra | `width:824px` · `height:881px` · `display:block` |

⇒ Luật `.vpscene>canvas{display:block;width:100%;height:100%}` đang làm đúng việc: `setSize(w,h,false)`
không ghi style, CSS ghim cỡ hiển thị, bộ đệm vẫn gấp 1,5 lần. Không có mép nào bị `overflow:hidden`
cắt. Ảnh: `3a-viewport-retina.png`.

## 5 · Hàng tab bản vẽ ở khổ desktop hẹp — **PASS**

Một tờ thì không gì tràn được, nên phép đo **ép hàng tab chịu tải**: bấm "Thêm bản vẽ" 8 lượt →
**10 tab** cùng hàng với nút mới.

| | 1280 × 800 | 1152 × 720 |
|---|---|---|
| Số tab | 10 | 10 |
| Hàng tab | x 454 · rộng 812 · **cao 36** | x 276 · rộng 862 · **cao 36** |
| Nút "Gửi sang Trình chiếu" | x 1107 · rộng 151 · mép phải **1258** | x 979 · rộng 151 · mép phải **1130** |
| Mép phải của hàng | 1266 | 1138 |
| Nút bị cắt ra ngoài hàng | **không** (1258 ≤ 1266) | **không** (1130 ≤ 1138) |
| Nút bị bóp hẹp | không (151px, giữ nguyên chữ) | không (151px) |
| Trang cuộn ngang | **0 px** | **0 px** |
| Dải tab tràn | 0 (645/645) | 0 (695/695) |

⇒ Hàng cao **36px ở cả hai khổ** = KHÔNG xuống dòng. Nút giữ nguyên bề rộng, không đè lên dải tab,
không đẩy trang tràn ngang. Ảnh: `5-tab-1280x800.png` · `5-tab-1152x720.png`.

> ⚠️ Ghi thêm cho đúng: ở 10 tab, dải tab **chưa** phải cuộn (`scrollWidth == clientWidth`) — các tab
> tự co lại vừa chỗ. Nên phép đo này chứng minh **nút mới không phá hàng tab**, chứ CHƯA chứng minh
> hành vi khi tab nhiều tới mức phải cuộn. Muốn biết ngưỡng đó phải đẩy số tờ lên cao hơn.

## 2 · Chọn · viền hộp bao · xoá khối 3D — **PASS sau khi vá** (trước khi vá: FAIL)

### Đo lần đầu — bắt được một lỗi thật
| Phép đo | Kết quả |
|---|---|
| Bấm vào khối để chọn | **trúng ngay điểm đầu** (fx .36 / fy .40) — Inspector hiện "Đã chọn trong khung nhìn 3D" + "Cao 2.700 mm" |
| Viền hộp bao có nhìn thấy được | **CÓ** — đếm điểm ảnh MÀU NHẤN `#6a57f5` trong khung nhìn: **0 → 1.569 điểm** |
| Chip "Xoá" | chỉ xuất hiện KHI đang chọn; `aria-disabled` = không |
| **Phím `Delete`** | 🔴 **KHÔNG XOÁ GÌ** — huy hiệu cây đối tượng vẫn `2`, nhãn vẫn "Khối xám" |
| Bấm CHIP "Xoá" | ✅ xoá đúng — huy hiệu biến mất, nhãn về "Không gian trống" |

⇒ Năng lực xoá CHẠY; mất đúng **đường bàn phím**.

### Gốc bệnh (đo, không suy)
`cad.sel.delete` khai `key:['Delete']` + `surfaces:['statusbar','shortcut']` (`registry.ts:523-524`),
**nhưng `grep "'shortcut'"` toàn repo NGOÀI `registry.ts` = 0** — chưa có ai đọc mặt tiền `shortcut`,
nên khai phím ở registry hiện **không tự sinh ra phím nào**. Đường `Delete` thật duy nhất nằm ở
`components/cad/CadCanvas.tsx:2799`, tức **chỉ chặng 2D**.

> 🔁 Đây là **ca thứ hai cùng một gốc**. Lần đầu là ⌘Z: `Render3DModeSkeleton.tsx:304-311` ghi
> nguyên văn *"⌘Z/⌘⇧Z chặng 3D trước đây KHÔNG BẮT ĐƯỢC PHÍM GÌ … thiếu duy nhất là KHÔNG CÓ
> listener nào gọi nó trong mode này"* và phải vá tay. Nay lặp lại y hệt với phím xoá.

### Đã vá — TỐI THIỂU, trong vùng được giao
`components/three/Viewport3D.tsx`: thêm một listener `Delete`/`Backspace` **gọi ĐÚNG lệnh
`cad.sel.delete` trong registry rồi `run()`** — KHÔNG tự viết `removeIds`, nên hành vi · undo ·
điều kiện `when` không thể phân kỳ với chip "Xoá". Vẫn hỏi `when({stage:'render'})` trước khi chạy
để chưa-chọn-gì thì phím im lặng (§9 cấm nút bấm-không-ra-gì), và né ô nhập.

### Đo lại sau khi vá
| Phép đo | Trước vá | Sau vá |
|---|---|---|
| Huy hiệu cây đối tượng, phím `Delete` | `2` → **`2`** | `2` → **`0`** |
| Nhãn khung nhìn sau khi xoá | "Khối xám · chưa vật liệu" | **"Không gian trống"** |
| Viền hộp bao (điểm ảnh màu nhấn) | +1.569 | +1.569 |

Ảnh: `2a-truoc-khi-chon.png` · `2b-sau-khi-chon.png` (thấy rõ hộp bao tím quanh tường + Inspector) ·
`2c-sau-phim-delete.png` · `2d-sau-khi-xoa.png`.

> 🔴 **LỖ HỆ THỐNG CÒN NGUYÊN — ngoài vùng tệp của phiếu này, KHÔNG tự sửa.** Bản vá trên chỉ nối
> phím cho MỘT lệnh ở MỘT chặng. Mặt tiền `shortcut` vẫn không có ai đọc, nên `F9` ·
> `Zoom Extents` · `undo`/`redo` (đều khai `surfaces:[…,'shortcut']`) vẫn ở tình trạng cũ. Vá điểm
> lần thứ ba là nuôi bệnh — cần sửa GỐC: một nơi đọc `surfaces:'shortcut'` rồi gắn phím.

## 4 · Bản vẽ → Trình chiếu — **PASS** (sau khi sửa TIỀN ĐỀ của chính bộ đo)

### Kết quả
Bấm "Gửi sang Trình chiếu" ở chặng 2D → Trình chiếu nhận đúng tờ, **và sống qua lần tải lại**.
Chạy lại 3 lượt liên tiếp: **PASS · PASS · PASS**.

| Mốc | Khổ | Tỉ lệ | Cửa nhận tờ |
|---|---|---|---|
| Cầu ra (`sessionStorage`) | `A3` | `1:100` | — |
| Bên Trình chiếu nhận | `A3` | `1:100` | có · khung tên có · "Quay lại 2D" có · Nguồn "Hiện hành" |
| **Sau khi tải lại trang** | `A3` | `1:100` | **còn** |

Tờ mang đủ: `khoGiay:A3` · `huong:landscape` · `le:10` · `tyLe:1:100` ·
`khungTen.tenBanVe:"Bản vẽ 1"` · `neo:{chang:'cad2d', docId}`. Panel phải hiện KHỔ GIẤY (A3 sáng) ·
`420 × 297 mm` · TỈ LỆ BẢN VẼ (1:100 sáng) · LỀ 10mm · KHUNG TÊN. Ảnh `4c-trinh-chieu-nhan-to.png`.

### 🔴 Vì sao lúc đầu tôi đo ra FAIL — và vì sao đó là lỗi của BỘ ĐO
Lần đo đầu, deck về `0 slide` sau khi tải lại (9/10 lượt), `IndexedDB interiorflow-sheets/sheets` = 0
bản ghi ở **cả ba mốc**. Nguyên nhân **không phải sản phẩm**:

App có **HAI nguồn** cho "ai đang đăng nhập" — ① cookie phiên (máy chủ) ② `localStorage`
`interiorflow.lastUserId`. **Lớp LƯU TRỮ bám vào nguồn ②**: `PresentSheets.tsx:322` mở bằng
`getLastUserId()`, rỗng thì `:335-338` rẽ nhánh **thuần in-memory** và `saveSheets()` chặn ngay
dòng đầu. Khoá ② chỉ được ghi ở `LoginForm.tsx:135` (đăng nhập **bằng biểu mẫu**) và
`HomeScreen.tsx:264` (**ghé Home**). Bộ đo đăng nhập bằng `POST /api/auth/login` rồi vào thẳng
`/projects/<id>/present` ⇒ cookie hợp lệ, app chạy bình thường, **nhưng ② rỗng**.

Phép thử chốt, chỉ đổi MỘT bước:

| | `lastUserId` | IDB `sheets` | Sau khi tải lại |
|---|---|---|---|
| **KHÔNG** ghé Home | `null` | 0 | `0 slide` ❌ |
| **CÓ** ghé Home | `cmtm9hop7…` | **1** | **`1 slide`** ✅ |

⇒ Bộ đo đã sửa: `dangNhap()` ghé Home một lượt rồi **xác nhận `lastUserId` có giá trị** trước khi đo.

> ⭐ Chỗ này cũng giải luôn "1 lượt PASS không giải thích được" mà tôi từng khai: trong lượt chạy
> gộp, trang `/login` kịp tự điều hướng về Home trước lượt đi kế tiếp nên `lastUserId` được ghi;
> các lượt chạy lẻ thì lượt `goto` kế tiếp cướp mất. **Kết quả chập chờn không phải nhiễu — nó là
> chỗ hai đường đi khác nhau lộ ra.**

> ⚠️ Và một suy luận của tôi đã đi quá bằng chứng, ghi lại để không lặp: tôi đo
> `prisma.projectFile.count() = 0` rồi viết *"bản sao bền không ghi được gì"*. **Sai.** Số 0 chỉ
> chứng minh **chưa có gì đi qua**, không chứng minh ống hỏng — điều phối bơm thử một giọt qua
> `POST /api/project-files`, trả **200** và ghi hàng thật. Ống tốt; cò chưa bóp. Hai kết luận đó
> dẫn tới hai việc sửa khác hẳn.

### 🔴 RỦI RO THẬT LỘ RA TỪ ĐÂY — không tan cùng với hiện vật, đề nghị mở phiếu riêng
Trạng thái đăng nhập có hai nguồn, và **lớp lưu trữ bám vào nguồn YẾU HƠN**. Người dùng thật vẫn
rơi vào được: cookie còn sống mà site data bị xoá · mở thẳng một bookmark
`/projects/<id>/present` trong hồ sơ trình duyệt mới · vào bằng deep-link mà chưa từng ghé Home.
Lúc đó app **trông vẫn đăng nhập**, vẫn cho dựng deck, vẫn hiện `1 slide` — rồi **im lặng không lưu
gì**; người dùng chỉ biết mình mất việc SAU KHI tải lại. Không cảnh báo, không dấu hiệu.
Đây là hình dạng tệ nhất của một lỗi mất dữ liệu, và **cùng họ với hai ca khác trong ngày**
(surface `shortcut` khai mà không ai đọc · lý do nút mờ nằm trong `title` mà bàn phím không tới):
**mã có, đường dây tới người dùng đứt ở đoạn cuối.** Ngoài `FILES_ALLOWED` ⇒ khai, không tự sửa.

