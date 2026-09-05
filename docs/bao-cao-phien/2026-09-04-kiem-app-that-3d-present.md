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

> ✅ **Lượt chạy GỘP — mỗi mục một trang trình duyệt riêng — cho PASS CẢ NĂM MỤC trong một lượt,
> `loiTrang: []`** (`.nen-chrome-out/ket-qua-tat-ca.json`, 04:09:46Z). Chi tiết ở §12.1.

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

---

## 6 · Lỗi thật tìm ra — trước / sau

### 6.1 · Phím `Delete` không xoá được khối ở chặng 3D · **ĐÃ VÁ**
| | Trước | Sau |
|---|---|---|
| Nhấn `Delete` khi đang chọn khối | huy hiệu cây `2` → `2`, nhãn vẫn "Khối xám" | huy hiệu `2` → `0`, nhãn "Không gian trống" |
| Bấm chip "Xoá" | xoá đúng | xoá đúng (không đổi) |

Sửa ở `components/three/Viewport3D.tsx` — gọi ĐÚNG lệnh `cad.sel.delete` của registry, không đẻ
đường xoá thứ hai. Xem §2.

### 6.2 · Ba việc chưa vá, đều NGOÀI `FILES_ALLOWED` — khai, không tự sửa
1. **Không ai đọc mặt tiền `surfaces:'shortcut'`** ⇒ `F9` · `Zoom Extents` · `undo`/`redo` khai phím
   mà phím không tự sinh ra. Cần sửa GỐC, đây đã là ca thứ hai (ca đầu: ⌘Z).
2. **Lưu trữ bám vào `localStorage.lastUserId` chứ không bám cookie** ⇒ vào bằng deep-link là app
   im lặng không lưu gì. Xem §4.
3. **`fitCameraToScene` chạy lại mỗi khi đổi khối đang chọn** ⇒ bấm chọn một khối thì camera tự
   khung lại. Không sai chức năng nhưng gây mất phương hướng; nên đưa qua mắt Hoà.

## 7 · Tham số hoá bộ đo — đã đưa gì ra biến môi trường

Bản cũ (`origin/checkpoint/2026-08-24-control-plane`) gõ cứng ba thứ không chạy được ở máy khác:

| Bản cũ | Nay |
|---|---|
| `OUT = '/Users/tranben/Downloads/interiorflow/present-demo/screens'` | `IF_SHOT_DIR`, mặc định `<repo>/.nen-chrome-out` (đã gitignore) |
| `/Users/tranben/…/_debug-no-hit.png` gõ thẳng trong thân hàm | dùng chung `chup()` |
| `PROJ = 'cmsl8prn80001w9i2ud3bfdgr'` | `IF_DU_AN`; trống thì tự tạo qua `POST /api/flows` và nhớ ở `<SHOT_DIR>/du-an.txt` |
| **`pwd.fill('demo1234')` — MẬT KHẨU TRONG MÃ** | `IF_MATKHAU`, **không có mặc định**; thiếu thì dừng và chỉ cách truyền. **Không mật khẩu nào nằm trong tệp.** |
| `BASE` mặc định `:3000` | `IF_BASE` |
| — | `IF_EMAIL` · `IF_DPR` (mặc định 2) · `IF_CHROMIUM` (mặc định `/opt/pw-browsers/chromium`) · `IF_HEADED` |

Chạy: `IF_MATKHAU='…' IF_BASE=http://localhost:3145 node scripts/kiem-3d-contro-that.js tat-ca`
(lệnh lẻ: `probe` · `cu-chi` · `chon-xoa` · `retina` · `to-present` · `hep`).

> ⚠️ `IF_CHROMIUM` cần thiết vì gói `playwright` trong repo đóng đinh số hiệu **1234** còn máy có
> sẵn **1194** — báo lỗi *"Executable doesn't exist"* đọc như thiếu trình duyệt, thật ra chỉ lệch
> số hiệu. Trỏ thẳng vào bản có sẵn, **đừng chạy `npx playwright install`**.

## 8 · Tệp đã sửa
| Tệp | Việc |
|---|---|
| `scripts/kiem-3d-contro-that.js` | thu về + tham số hoá + viết lại phép đo 5 mục (722 → 773 dòng) |
| `components/three/Viewport3D.tsx` | **+1 import, +1 effect** — nối phím `Delete`/`Backspace` vào lệnh `cad.sel.delete` |
| `docs/bao-cao-phien/2026-09-04-kiem-app-that-3d-present.md` | báo cáo này |
| `docs/delivery/anh-duyet-mat/lo-01/` | ảnh bằng chứng |

`npx tsc --noEmit` → **0 lỗi**. `npm test` **KHÔNG chạy** (phiên khác đang chạy song song, dùng chung `dev.db`).

## 9 · ⚠️ CHƯA CHẮC / CHƯA KIỂM — bắt buộc khai
1. **Không đọc kho, chỉ đọc màn hình.** `window.__cadStore` là dev-only nên mọi kết luận về "có
   khối / mất khối" dựa trên **nhãn khung nhìn + huy hiệu cây đối tượng + điểm ảnh**. Nếu hai thứ
   đó nói dối (hiện sai trạng thái) thì phép đo sai theo — chưa có gì bắt chéo được điều đó.
2. **Ngưỡng 20mm chưa đo được bằng mm.** Mục 1 chứng minh **kéo 1 điểm ảnh thì không sinh khối**,
   KHÔNG chứng minh ngưỡng đúng bằng `MIN_KICH_THUOC_MM = 20`. Muốn khẳng định con số phải đọc
   được kích thước thật của khối — mà UI chỉ hiện "Cao", không hiện dài/rộng.
3. **Chỉ một cỡ cửa sổ cho mục 1-4** (1600×1000, DPR 2). Mục 5 có hai khổ. Chưa đo 1920, chưa đo
   màn dọc, chưa đo DPR 1 và DPR 3.
4. **Chỉ Chromium**, chỉ headless. Safari/WebKit và Firefox chưa chạm — mà `backdrop-filter`,
   pointer capture và WebGL là ba chỗ hay lệch nhất giữa các engine.
5. **WebGL chạy bằng swiftshader (phần mềm)**, không phải GPU thật. Hình học/raycast không phụ
   thuộc điều này, nhưng thời gian dựng cảnh thì có ⇒ mọi `waitForTimeout` trong bộ đo là **kinh
   nghiệm, không phải hợp đồng**; máy chậm hơn có thể làm phép đo trượt.
6. **Mục 5 chưa chạm ngưỡng cuộn.** Ở 10 tab dải tab vẫn vừa chỗ; chưa biết hành vi khi phải cuộn.
7. **Chưa dùng trình đọc màn hình.** Mục 2 khẳng định chip "Xoá" chỉ hiện khi có chọn, nhưng chưa
   kiểm cây trợ năng — đúng loại lỗi mà "có trong mã ≠ tới được người dùng" hay ẩn nấp.
8. **Cây làm việc DÙNG CHUNG.** Lúc dựng, `components/studio/StatusBar.tsx` ·
   `VitalsPill.tsx` · `VitalsRightEdgeHost.tsx` đang có sửa đổi chưa commit của phiên khác. Bản
   dựng tôi đo **có** những sửa đổi đó. `StatusBar` là nơi chip "Xoá" sống ⇒ mục 2 có thể chịu ảnh
   hưởng; tôi không tách được.
9. **Mục 4 chỉ PASS trên đường "đã ghé Home".** Đường deep-link vẫn mất dữ liệu im lặng (§4) —
   PASS ở đây KHÔNG có nghĩa là mọi đường vào đều an toàn.
10. **Một lượt PASS bất thường đã giải thích được** (§4), nhưng lời giải là **suy luận có căn cứ mã**,
    tôi không dựng lại được đúng lượt đó để chứng minh trực tiếp.

## 10 · Rủi ro
1. **`.next` dùng chung là rủi ro vận hành thật, không phải phiền toái.** Ba phiên cùng dựng làm
   máy chủ phục vụ manifest cũ ⇒ **trang trắng, CSS 404**, đọc hệt như "giao diện hỏng". Đã mất một
   vòng đo vì nó. Cách thoát ở §0; nếu không ai áp dụng thì phiên sau sẽ vấp lại.
2. **`dev.db` và tài khoản kiểm dùng chung.** Mật khẩu `kiem@localhost.test` bị ba lượt đặt lại
   trong một buổi ⇒ phép đo chết giữa chừng bằng 401. Đã chốt `kiemthu123`.
3. **`.nen-chrome-out/` bị gitignore VÀ bị dọn giữa chừng** — lô ảnh đầu của tôi biến mất khỏi đĩa
   trước khi ai kịp nhìn. Ảnh nghiệm thu là **deliverable**; đã chép sang
   `docs/delivery/anh-duyet-mat/lo-01/`. Phiếu giao việc ghi ngược lại ("không commit ảnh") — điều
   phối đã sửa hướng, ghi ra để hai chỗ không tiếp tục nói khác nhau.
4. **Bộ đo tự tạo ra lỗi giả.** Mục 4 suýt được ghi thành lỗi sản phẩm. Bài học rút thành luật cho
   bộ đo: **trước khi kết luận sản phẩm hỏng, phải hỏi "tiền đề của phép đo có giống người dùng
   thật không"** — ở đây là "đăng nhập bằng API ≠ đăng nhập bằng biểu mẫu".
5. **Ba ca cùng một bệnh trong một ngày** (surface `shortcut` không ai đọc · lý do nút mờ kẹt trong
   `title` · lưu trữ bám nguồn yếu): **mã có, đường dây tới người dùng đứt ở đoạn cuối.** Không có
   máy soi nào hiện bắt được loại này — chúng chỉ bắt lệch nhãn, lệch hình học, lệch sổ. Chỉ
   **thao tác thật** mới bắt được. Đây là lý lẽ mạnh nhất cho việc giữ bộ đo con-trỏ-thật chạy đều.

## 11 · Ảnh bằng chứng — `docs/delivery/anh-duyet-mat/lo-01/`

Ảnh nằm TRONG repo, không nằm ở `.nen-chrome-out/`: thư mục đó bị gitignore **và đã bị dọn giữa
chừng** trong chính buổi này — lô ảnh đầu của tôi biến mất khỏi đĩa trước khi kịp nhìn.

| Tệp | Chứng minh điều gì |
|---|---|
| `kiem-3d-1a-truoc-khi-dung-khoi.png` | cảnh trống, nhãn "Không gian trống" |
| `kiem-3d-1b-keo-tren-san-ra-tuong.png` | **kéo ra tường thật** — nhãn đổi, cây đối tượng mọc `Sàn` + `Tường 1` |
| `kiem-3d-1c-ctrl-z-lui-duoc.png` | Ctrl+Z đưa về cảnh trống |
| `kiem-3d-1d-keo-1px-bi-huy.png` | kéo 1 điểm ảnh không sinh khối |
| `kiem-3d-2a-truoc-khi-chon.png` | khối chưa chọn (0 điểm ảnh màu nhấn) |
| `kiem-3d-2b-vien-hop-bao-hien-ra.png` | **viền hộp bao tím quanh khối** + Inspector "Cao 2.700 mm" |
| `kiem-3d-2c-sau-phim-delete.png` | sau khi nhấn `Delete` — cảnh đã trống (bản ĐÃ VÁ) |
| `kiem-3d-2d-sau-khi-xoa.png` | trạng thái cuối sau khi xoá |
| `kiem-3d-3a-viewport-retina-dpr2.png` | khung nhìn ở DPR 2, không mép nào bị cắt |
| `kiem-present-4a-chang-2d-hang-tab.png` | chặng 2D + hàng tab + nút "Gửi sang Trình chiếu" |
| `kiem-present-4b-sau-khi-gui.png` | ngay sau khi bấm gửi |
| `kiem-present-4c-nhan-to-a3-1-100.png` | **Trình chiếu nhận đúng**: chip `A3 · 1:100`, panel Khổ giấy/Tỉ lệ/Khung tên |
| `kiem-present-4d-sau-khi-tai-lai.png` | sau khi tải lại trang — tờ vẫn còn |
| `kiem-tab-5a-1280x800-10-tab.png` | 10 tab + nút mới ở 1280×800, hàng cao 36px |
| `kiem-tab-5b-1152x720-10-tab.png` | 10 tab + nút mới ở 1152×720, hàng cao 36px |

## 12 · Một bài học về chính BỘ ĐO (ghi vì nó sẽ lặp lại)

Trong buổi này bộ đo **tự tạo ra hai lỗi không có thật**, và cả hai đều suýt được ghi thành lỗi
sản phẩm:

| Hiện vật | Nguyên nhân | Cách phát hiện |
|---|---|---|
| "Trình chiếu mất tờ khi tải lại" (§4) | đăng nhập bằng API ⇒ `localStorage.lastUserId` rỗng ⇒ lớp lưu trữ chạy in-memory | đổi **một** bước: ghé Home trước |
| "Cầu ra không ghi gì" | đọc `sessionStorage` ở +1500ms trong khi nó bị **tiêu thụ trong vài trăm ms** | dò 100ms/lượt |
| "Mục 2 không dựng được khối" (chỉ khi chạy gộp) | mục 1 đóng card chào ⇒ mục 2 không còn đường cầm công cụ | cấp **trang riêng** cho từng mục |

⇒ **Luật rút ra:** trước khi kết luận sản phẩm hỏng, hỏi *"tiền đề của phép đo có giống người dùng
thật không"* và *"trạng thái do phép đo TRƯỚC để lại có làm hỏng phép đo này không"*. Hai câu đó
rẻ hơn nhiều so với việc cử người đi sửa một lỗi không tồn tại.

⚠️ Và chỗ ngược lại cũng đúng: **kết quả chập chờn không phải nhiễu để làm ngơ.** Lượt PASS lẻ loi
1/10 ở §4 chính là chỗ chứa lời giải. Làm tròn nó đi cho gọn là mất luôn manh mối.

### 12.1 · Lượt chạy GỘP — **cả năm mục PASS trong MỘT lượt**

Sau khi cấp **trang riêng cho từng mục**, lượt gộp chạy trọn và sạch
(`.nen-chrome-out/ket-qua-tat-ca.json`, `2026-09-04T04:09:46Z`, DPR 2, **`loiTrang: []`**):

```
PASS   3 · viewport 3D không bị cắt trên retina
PASS   1 · dựng khối bằng cử chỉ 3D
PASS   2 · chọn / viền hộp bao / xoá khối 3D
PASS   4 · bản vẽ → Trình chiếu
PASS   5 · hàng tab bản vẽ ở khổ desktop hẹp
```

Số khớp đúng với các lượt chạy lẻ: viewport `824×881` tràn `0×0` · cử chỉ đổi **57,36%** điểm ảnh ·
viền hộp bao **+1.569** điểm ảnh màu nhấn · phím `Delete` **2 → 0** · cầu ra `A3 · 1:100` sang bên
nhận `A3 · 1:100` · 10 tab, hàng cao 36px, không tràn ở cả hai khổ.

> ⭐ Chi tiết đáng ghi ở mục 4 lượt này: `phaiTaoHoSoTruoc: false` — hồ sơ từ lượt trước **vẫn còn**,
> tức deck ĐÃ được lưu bền. Thêm một xác nhận độc lập rằng "mất hồ sơ" là hiện vật của bộ đo chứ
> không phải lỗi sản phẩm.

**⚠️ Một tật của bộ đo, chưa sửa — khai để phiên sau không vấp:** mục 5 bấm "Thêm bản vẽ" **8 lượt
mỗi khổ** để ép hàng tab chịu tải ⇒ mỗi lượt chạy để lại **+16 tờ** trong dự án kiểm. Chạy vài lượt
là dự án phình tới hàng chục tờ và bước đó chậm dần (một lượt gộp trước đó đã bị cắt vì hết giờ
chính vì lý do này — **do bộ đo, không phải app chậm**). ⇒ Việc nên làm khi dùng lại: cho mục 5
**dọn tờ đã thêm sau khi đo**, hoặc chạy nó trên một dự án dùng-một-lần.
