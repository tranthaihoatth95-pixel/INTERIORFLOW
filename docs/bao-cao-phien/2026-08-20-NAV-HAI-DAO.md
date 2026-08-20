# NAV-HAI-DAO — thanh trái hai đảo + cụm phải trên (20/08)

> Phiên phụ. Vùng ghi: `components/nav/**` · `components/studio/AppChrome.tsx` ·
> `components/studio/CumPhaiTren.tsx` (mới) · `components/studio/Navigator.tsx` (gỡ bản lặp) ·
> `components/AccountMenu.tsx` (nối Credit + thêm Tài khoản).
> Server :3001 dùng lại, KHÔNG restart. Không git, không prisma. Không tạo/xoá dữ liệu thật.

---

## ⓪ TIỀN ĐỀ — kiểm trước khi làm

| Giả định của phiếu | Kiểm | Kết luận |
|---|---|---|
| Rail đang là BA CỤM `chung\|duAn\|caNhan` ở `muc-dieu-huong.ts` | đọc file | ĐÚNG |
| `BE_RONG_NAC = {dinhVi:52, dieuHuong:240, duyet:320}` | đọc file | ĐÚNG (52, không phải 28 như sổ cũ ghi) |
| Đổi khoá cụm có vỡ persist không | `localStorage` của rail chỉ có `interiorflow.rail.nac_v1` lưu **NacRail**; `CumRail` không được lưu ở đâu, chỉ sống trong 3 tệp `components/nav/**` | **KHÔNG vỡ** — đổi `chung\|duAn\|caNhan` → `viec\|chang` an toàn, không cần đường nâng cấp |
| Credit team chỉ có ở tab "Tổng quan" của `Dashboard.tsx:416` | đo: `Dashboard.tsx:401` `StatCard "Credit dùng 30 ngày" … còn X trong team` | ĐÚNG |
| Vùng cấm không bị chạm | không sửa `components/home/**`, `lib/capabilities/**`, `StageToolbelt.tsx`, `lib/library/shelves.ts`, `lib/cad/library-item-resolve.ts`, `LibraryDropBridge.tsx`, `components/present-editor/**`, `docs/mocks/**` | ĐẠT |

**Bổ sung giữa lượt (MAIN nhắn):** hai-đảo là bản đúng (ba lần đè trong ~4 ngày: hai cụm 16-17/08
→ ba cụm sáng 20/08 → **hai đảo + cụm phải-trên chiều 20/08**). Ràng buộc thêm: hai đảo phải giữ
tách ở **cả ba nấc**, kể cả rail 52 — chỉ ẩn chữ, không gộp thành một dãy icon liền. Đã thi hành
và đo (xem ⑤).

---

## ① VIỆC ĐÃ LÀM

### VIỆC 1 — thanh trái chỉ còn việc, hai đảo dọc
`components/nav/muc-dieu-huong.ts` · `RailDieuHuong.tsx`

- `CumRail` đổi `'chung'|'duAn'|'caNhan'` → **`'viec'|'chang'`**.
- Bảng mục còn **đúng 8**:
  - **Đảo A · VIỆC** — Trang chủ `/` · Dự án `/projects/<id>/overview` · Files `/files` ·
    Thư viện `/library` · Soát duyệt (mờ, lý do thật).
  - **Đảo B · CHẶNG** — Thiết kế 2D `cad` · Thiết kế 3D `render` · Trình chiếu `present`.
- Khoảng thở giữa hai đảo **18 → 24px**. Lý do ghi tại chỗ: còn ba cụm thì tiêu đề cụm đỡ nghĩa
  cho mắt; ở nấc ĐỊNH VỊ (icon-only) khoảng thở là **kênh duy nhất** nói "đây là hai khối", nên
  phải đọc được cả khi không có chữ nào. Vẫn là khoảng thở, **không đường kẻ**.
- Điều kiện "cần dự án" chuyển từ *suy theo cụm* sang **đọc trường `duoi`** — vì đảo VIỆC nay trộn
  cả mục cần dự án (Dự án) lẫn mục không cần (Files · Thư viện); lấy cụm làm điều kiện sẽ khoá
  nhầm nửa đảo.
- `mucDangMo()`: `/settings`, `/settings/avatar`, `/tasks`, `…/notebook` nay trả **null** — có ý,
  và **có test riêng cho từng route**: cách hỏng kinh điển của mọi lần rút gọn điều hướng là bỏ
  mục nhưng quên bỏ nhánh suy, rail sáng bừa sang mục bên cạnh.

### VIỆC 2 — cụm phải trên
`components/studio/CumPhaiTren.tsx` (mới) mount trong `AppChrome.tsx` **sau** `VitalsAperture`.

Thứ tự `[Thông báo] [Hiện diện] [Ảnh đại diện]`, và **hai trong ba tự thu gọn** đúng luật phiếu:

| Món | Trạng thái | Căn cứ |
|---|---|---|
| ① Thông báo | **KHÔNG render** | `grep -rin "notif" lib components` = 0 kho/hàng đợi thông báo. Thứ gần nhất là hàng đợi job AI (`lib/execution.ts`) — mà đó là *"tôi nên biết gì"*, tức đất của **Vitals** ở mép trên. Vẽ chuông luôn-rỗng ở đây là nút giả **và** lấn hệ Vitals, hai lỗi một lúc |
| ② Hiện diện | render khi có người thật khác mình **trong dự án đang mở**; một mình thì tự ẩn | nguồn `useCollabStore` (con trỏ sống, server prune 6s) — **không mở thêm đường mạng nào** |
| ③ Ảnh đại diện | render khi đã đăng nhập | `UserAvatar` + `AccountMenu` dùng chung |

**Không dựng lại (B25 no-rebuild):** hiện diện dùng đúng primitive `components/ui/PresenceRow.tsx`
mà `PresenceBar` đang dùng. **Không** mount lại `PresenceBar` — nó là thẻ `absolute right-4 top-4`
nổi trên canvas của `FlowCanvas`, kèm nút mời + poll roster 30s; mount bản thứ hai ở header là hai
thẻ hiện diện cùng một màn.

**Cấm lặp — đã gỡ bản thứ hai bên trái:** chân `Navigator` trước đây có avatar (mở `AccountMenu`:
Hồ sơ · Credit · Cài đặt · Đăng xuất) **và** một nút ⚙ đi thẳng `/settings`. Cả hai ở **cột trái**
⇒ đúng thứ Hoà nêu là tiêu chí trượt, và sau khi cụm phải-trên có avatar thì nó thành bản thứ hai
của cùng một cửa. Đã gỡ trọn ổ đó (kèm dọn import/state chết). Không mất chức năng nào —
`AccountMenu` giữ nguyên, chỉ đổi chỗ neo.

**🔴 MỘT LỖ CŨ LỘ RA KHI ĐO, ĐÃ BỊT:** ở `/` avatar hiện, mở `/projects/<id>/cad` thì **mất** —
`store.user` là `undefined` trên các route chặng vì chỉ `HomeScreen` mới đi hỏi `/api/auth/me`;
phiên đăng nhập vẫn còn, chỉ là store không biết. **Không phải lỗ do đợt này đào ra**: avatar cũ ở
chân `Navigator` cũng gác `{user && …}` nên cũng câm y hệt ở đó — đợt này chỉ làm nó lộ ra. Đã nạp
một lần trong `CumPhaiTren` theo **đúng khuôn đã có** (`SessionWatch.tsx:36` ·
`PresentStageScreen.tsx:62-77`): một lần · 401 thì im để `SessionWatch` lo báo · mạng đứt thì
không kết luận gì. Không chế đường xác thực thứ hai. Sau khi bịt: đo lại trong chặng → avatar hiện
ở `1398..1428`.

**⚠️ CREDIT — giữ được đường xem thật, không giữ Dashboard cho có:** dòng credit trong menu trước
là **con số câm**. Nay là **nút** mở đúng chỗ xem mức dùng thật (`setDashboardOpen(true)` →
tab "Tổng quan" → `Credit dùng 30 ngày` + `còn X trong team`, `Dashboard.tsx:401`). Nhãn đổi thành
**"Tín dụng · Mức dùng"**. Khi có màn mức-dùng riêng thì **đổi đích ở đúng dòng đó**, đừng thêm
mục thứ hai — đã ghi thành comment tại chỗ.

**"Tài khoản":** đo tại nguồn — **không có màn tài khoản riêng**. `components/settings/AccountSettings.tsx`
tồn tại nhưng `PixelSettingsShell.tsx` **không mount** nó (grep = 0); thứ thật sự có là nhóm
`#group-profile` — chính là đích của mục "Hồ sơ" ngay trên. ⇒ mục hiện **MỜ kèm lý do thật**, đi
đường `aria-disabled` + `aria-describedby` (không `disabled`, không `title` — bài học 16/08:
`<button disabled>` bị Tab bỏ qua và `title` câm trên cảm ứng). Trỏ trùng chỗ "Hồ sơ" sẽ là nút
giả kiểu tinh vi hơn, vẫn phạm §9.

### VIỆC 3 — luật không gian
TRÁI = *làm việc ở đâu* (hai đảo) · PHẢI TRÊN = *tôi là ai / ai đang ở đây* · MÉP TRÊN = Vitals,
**không đụng một dòng**. Ranh giới hai hệ ghi thành docstring ở cả `CumPhaiTren.tsx` lẫn chỗ mount
trong `AppChrome.tsx`: cấm gom badge Vitals vào chuông, cấm cho avatar mở Vitals.

### VIỆC 4 — ba nấc
`BE_RONG_NAC` **không đụng** (52 / 240 / 320), ba công năng giữ nguyên (định vị / điều hướng /
duyệt). Test khoá lại cả ba số.

---

## ② ĐO TRÊN APP THẬT — :3001, 1440×900, đăng nhập `hoa`

Ảnh chụp trong pane trình duyệt render ở tỉ lệ không đọc được (nội dung thu vào góc ~184×120 của
khung 800×500) ⇒ **nghiệm thu bằng số đo DOM thật**, không bằng ảnh. Mọi số dưới đây đọc từ
`getBoundingClientRect()`/`getComputedStyle()` trên trang đang chạy.

**Trang chủ `/`** — rail `0..240`:
```
[VIỆC ]  Trang chủ · Dự án [MỜ] · Files · Thư viện · Soát duyệt [MỜ]     marginTop 0
[CHẶNG]  Thiết kế 2D [MỜ] · Thiết kế 3D [MỜ] · Trình chiếu [MỜ]          marginTop 24px
cụm phải trên: 1398..1428
```
**Trong chặng `/projects/<id>/cad`** — rail `0..240`:
```
[VIỆC ]  Trang chủ · Dự án · Files · Thư viện · Soát duyệt [MỜ]
[CHẶNG]  Thiết kế 2D ◀ĐANG MỞ · Thiết kế 3D · Trình chiếu               marginTop 24px
cụm phải trên: 1398..1428   (aria-label "Tài khoản — hoa")
```

**Quét lặp** — mọi `a|button|[role=button]` khớp `Hồ sơ|Tín dụng|Credit|Cài đặt|Tài khoản|Đăng xuất`,
loại phần trong menu portal:

| Màn | Kết quả |
|---|---|
| `/` | **1 kết quả duy nhất**: `Tài khoản — hoa` tại `1398..1428` (chính là avatar phải-trên) |
| `/projects/<id>/cad` | **1 kết quả duy nhất**: y hệt trên |

⇒ **Hồ sơ / Credit / Cài đặt KHÔNG còn ở trái, và không lặp ở đâu.**

**Menu ảnh đại diện** (bấm thật): `Tín dụng · Mức dùng 161` · Chia sẻ · Chat · Hồ sơ · Đổi avatar ·
Giao diện · Cài đặt · **Tài khoản [MỜ]** · Trợ giúp · Đăng xuất.

**Hai đảo giữ tách ở CẢ BA NẤC** (đổi `interiorflow.rail.nac_v1` rồi tải lại, đo lại từng nấc):

| Nấc | Bề rộng đo được | Khoảng giữa hai đảo | Khoảng giữa hai hàng trong cùng đảo | Chữ |
|---|---|---|---|---|
| `dinhVi` | **52px** | **28px** | **2px** | không (chỉ còn span a11y ẩn) |
| `dieuHuong` | 240px | 28px | — | có nhãn |
| `duyet` | **320px** | 28px | — | có nhãn + dòng tình trạng |

28 ÷ 2 = **14 lần** khoảng cách trong đảo ⇒ ở rail icon-only vẫn đọc ra hai khối, không thành một
dãy icon liền. Nấc `duyet` hiện tình trạng THẬT: mục **Dự án** bày `Mặt bằng · Studio 48m²`.

---

## ③ MÁY KIỂM

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi thuộc vùng này**. Còn 2 lỗi của lane khác: `lib/ui/hien-dan.test.ts` · `lib/ui/nhip.test.ts` — `Cannot find module 'vitest'`. Cả hai **untracked**, tạo 13:58 hôm nay, chưa từng nằm trong vùng ghi của phiên này |
| `muc-dieu-huong.test.ts` | **✅ Tất cả kiểm ĐẠT** (7 nhóm, viết lại theo cấu trúc mới) |
| `npm test` | exit 1 — **dừng ở `npm run tsc`** vì đúng 2 lỗi vitest của lane khác ở trên, chưa chạy tới lớp test. Chạy trực tiếp bộ test nav thì ĐẠT |
| `soi:tu-dien` | 0 lệch nhãn (316 chỗ chữ trần là cảnh báo repo-wide, không chặn, không phải của đợt này) |

**Test mới thêm** (mỗi dòng là một cách hỏng đã lường):
- nhóm **[2] TIÊU CHÍ TRƯỢT** — chặn cứng cả hai kênh: **nhãn** (VI + EN: Hồ sơ/Credit/Cài đặt/
  Tài khoản/Đăng xuất/Cá nhân) **và đường đi** (`không mục nào trỏ /settings*`). Kiểm nhãn không
  thôi là hở: đổi nhãn mà giữ route vẫn là lặp.
- `/settings` · `/settings/avatar` · `/tasks` · `…/notebook` phải trả `null` — chặn ca "bỏ mục
  quên bỏ nhánh suy".
- lý do "chưa mở dự án" phải nói **"Trang chủ"** (mục đã đổi tên khỏi "Tổng quan") — chặn chữ mồ côi.

---

## ④ RÀNG BUỘC KỸ THUẬT

Token màu (0 hex mới) · thang bo qua `lib/geometry` (`RADIUS.full`) · `--mo-vo-hieu` cho mọi mục
mờ · `aria-disabled` + `aria-describedby` (không `disabled`/`title`) · `prefers-reduced-motion`
giữ nguyên đường cũ của rail · trạng thái không chỉ dựa vào màu (mục đang mở có **dải 2px** +
`aria-current="page"`, ngoài màu nền).

---

## ⑤ ⑦b — CHƯA CHẮC / CHƯA KIỂM (khai thẳng, không tô)

1. 🔴 **BA MỤC RỜI THANH TRÁI, CHƯA CÓ NHÀ MỚI** — chốt liệt kê đúng 5 + 3, nên **Bảng việc**
   (`/tasks`, route sống), **Sổ tay** (`/projects/<id>/notebook`, route sống) và **Chat · Họp**
   (chỉ có `app/api/chat/route.ts`, chưa có trang) không còn mục nào trên rail. Tôi **theo đúng
   chốt** và không tự nhét chúng vào đâu — nhét vào menu avatar là sai loại (đó là chuyện của
   tôi, không phải việc), nhét lại vào đảo CHẶNG là phá tính ổn định của đảo đó.
   ⇒ **Cần Hoà chốt nhà mới.** Hai route kia vẫn tới được bằng URL và (với `/tasks`) qua widget
   Home, nhưng đó không phải điều hướng.
2. **"Dự án" là cách đọc của tôi, không phải chữ của Hoà.** Không có route danh sách dự án
   (`app/projects/` chỉ có `[id]`; gallery chọn dự án sống *bên trong* `/`). Tôi đọc "Dự án" =
   dự án đang mở → `/projects/<id>/overview`, chưa mở thì mờ. Nếu Hoà muốn "Dự án" = **danh sách**
   thì phải có route mới — việc khác, không làm lén.
3. **Soát duyệt đang MỜ.** Động cơ soát duyệt CHẠY THẬT (`lib/review/` + `ReviewPanel` mount ở
   `AppShell.tsx:192`), nhưng nó ngồi ở **mép phải mỗi chặng** theo luật một-chỗ-ngồi, không có
   route để rail trỏ tới. Cho bấm được cần thêm một sự kiện mở cho `components/ui/PanelFlank.tsx`
   — **ngoài vùng ghi đợt này**, không tự đụng.
4. **Thông báo chưa có gì để hiện** — không phải "chưa vẽ" mà là chưa có kho dữ liệu. Khe đã chừa
   sẵn, đánh dấu ① trong phần vẽ.
5. **Hiện diện chưa nhìn thấy trên app thật lượt này** — chỉ có một mình `hoa` đăng nhập nên nhánh
   `hienDien.length > 0` **chưa chạy lần nào**. Mã đúng theo hợp đồng `PresenceRow`, nhưng đây là
   *suy từ mã*, chưa phải *đo thấy*. Cần hai phiên đăng nhập cùng một dự án để nghiệm thu thật.
6. **Chỉ đo Chromium trong pane, 1440×900, theme đang bật.** Chưa soi khổ hẹp (<1024), chưa thử
   trình đọc màn hình thật, chưa đối chiếu hai theme.
7. **Dev server :3001 đang bị nhiều lane cùng biên dịch** — trong lúc đo có lượt `ChunkLoadError`
   404/410 và một `ReferenceError: VitalsPill is not defined` bắt nguồn từ
   `components/home/widgets/VitalsPill` (vùng lane khác). Không phải lỗi của đợt này (tsc sạch,
   tải lại là hết), nhưng nó làm hydrate hỏng vài lượt ⇒ **mọi số ở §② là số đo sau khi trang đã
   hydrate xong**, đã kiểm `visibility: visible` trước khi tin.

## ⑦c — HẠN DÙNG KẾT LUẬN

Cấu trúc điều hướng bị đè **ba lần trong ~4 ngày** (hai cụm 16-17/08 → ba cụm sáng 20/08 → hai đảo
chiều 20/08). ⇒ Trích bản này **phải ghi kèm ngày VÀ buổi**. Số đo DOM ở §② hết hạn ngay khi lane
khác đụng `AppChrome`/`AppShell` — đo lại, đừng chép. Kết luận "không lặp" chỉ đúng cho **hai màn
đã soi** (`/` và `/cad`); `/files`, `/library`, `/settings`, `/present`, `/render` **chưa quét**.

---

## ⑥ ⛳ NỢ ĐỂ LẠI

- Bảng việc · Sổ tay · Chat·Họp: chờ Hoà chốt nhà mới (mục 1 ở trên).
- `PanelFlank` nhận sự kiện mở ⇒ "Soát duyệt" bấm được thay vì mờ.
- Khuôn *"chưa có user thì hỏi `/api/auth/me` một lần"* nay có **ba bản chép tay**
  (`SessionWatch.tsx:36` · `PresentStageScreen.tsx:62-77` · `CumPhaiTren.tsx`) — đúng ca
  `may-soi-dong-dang` tín hiệu ③ "cùng chuỗi thao tác ở nhiều nơi". Gom về một hook: phiếu riêng.
- Resize kéo tay nấc `duyet` trong khoảng [320, 440] (nợ cũ, chưa đụng).
