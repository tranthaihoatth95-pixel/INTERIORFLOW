# 02 · WORKFLOW / G3 — máy canh công cụ chết + audit bàn 2D/3D (04/09)

Mốc vào: `f43de304`, lệch **138** commit sau `origin/integration/2026-09-04`, cây sạch,
`merge-base --is-ancestor` rc=0 ⇒ `merge --ff-only` lên `55a953fa`. Không rebase, không force.

---

## ⓪ TIỀN ĐỀ — nhận ba, sửa một

| Tiền đề của phiếu | Phán |
|---|---|
| Ca Vitals (panel mount ở `StageSwitcher` đã gỡ, Cmd+J chết) là có thật | ✅ ĐÚNG — tái hiện được trên ảnh chụp lịch sử, xem §2 |
| Ba câu luật (phím câm · nút không đường chạy · bấm im lặng) chưa máy nào canh | ✅ ĐÚNG |
| Cần một máy soi mới, không nới máy cũ | ✅ ĐÚNG — `soi-cam-dien` đi từ `lib/` lên và **tự khai** trong docstring là *"chứng minh CÓ ĐƯỜNG DÂY, KHÔNG chứng minh CÓ NÚT BẤM"*. Máy mới đi chiều ngược. Không trùng. |
| 🔧 **"gõ câu hỏi rồi Enter là mất câu hỏi" — nói ở THÌ HIỆN TẠI** | **SỬA**: ca đó **đã được lane khác đóng cùng ngày**. `AppChrome.tsx:387` nay mount `<VitalsAperture>`, Cmd+J đăng ký duy nhất ở `VitalsAperture.tsx:295`. Máy soi xác nhận cả hai chiều: trên ảnh chụp trước bản vá thì H4 báo `lib/vitals-ui.ts`; trên `main` hôm nay thì `VitalsGesture` đã rời danh sách mồ côi. |

Không dừng: giá trị của phiếu không nằm ở ca đã đóng mà ở **cơ chế để nó không tái diễn**.

---

## ① VIỆC A — `scripts/soi-cong-cu-chet.mjs` + `npm run soi:cong-cu-chet`

Bốn họ, in riêng từng họ, **không gộp một con số tổng** (bài học ca `outline-none` gộp ba cơ chế
CSS rồi báo nhầm 24/32).

Phát chạy trên `main`: **27 ca — H1 26 · H2 0 · H3 0 · H4 1** (1.394 tệp · 110 entry router ·
952 tệp sống · 63 nơi nghe bàn phím sống). Exit 0, cố ý không chặn build.

### Hiệu chuẩn — làm thí nghiệm, không khai suông
| Phép thử | Kỳ vọng | Kết quả |
|---|---|---|
| cây **biết hỏng** `/tmp/hc-hong` (mỗi họ đúng một ca) | 4/4 họ ĐỎ | ✅ H1 3 · H2 1 · H3 1 · H4 1 |
| cây **biết đạt** `/tmp/hc-dat` (cùng hình dạng, đã nối đủ dây) | 0/0/0/0 | ✅ TỔNG 0 |
| **ảnh chụp lịch sử** `git archive 711d5c73^` → `/tmp/vitals-goc` | bắt được ca Vitals | ✅ H1 bắt `VitalsGesture.tsx` (*"2 nơi import, đều chết theo"*) **và** `VitalsRightEdgeHost.tsx` (*"0 nơi import"* — khớp đúng chữ trong sổ *"chưa từng được mount"*); H4 bắt `lib/vitals-ui.ts` — *"1 nơi SỐNG bấm (StatusBar.tsx) · mặt CHẾT HẾT (StageSwitcher.tsx)"* |
| `main` hôm nay | ca Vitals đã đóng | ✅ `VitalsGesture` rời H1 |

⭐ **Hiệu chuẩn bắt lỗi thật của chính máy soi.** Vòng 1 của H4 **hụt đúng ca Vitals** — tiêu chí
cũ đòi *"mọi mặt đều chết"*, nhưng tệp bấm công tắc (`StatusBar`) cũng có JSX nên tự nó bị đếm là
một "mặt sống", điều kiện không bao giờ đúng. Thử tách hai vai theo **dạng gọi** cũng hỏng: đo
`StatusBar.tsx:106-107` thấy nó đọc `panelOpen` **và** lấy `open` bằng **cùng một kiểu selector**.
⇒ đổi sang tiêu chí **quan hệ**: *công tắc còn người sống bấm + mặt của nó đã mồ côi*. Nếu chỉ chạy
trên `main` rồi thấy 0 thì đã kết luận "sạch" — **lỗi này chỉ lộ ra vì có cây biết-hỏng để đối chiếu**.

### Ba cạm bẫy đã vá sẵn (mỗi cái là một lần dự án đã trả giá)
1. **Bóc chú thích trước khi quét**, kể cả block comment giữa dòng — chỗ `soi-cam-dien` tự khai
   còn hở. Máy trạng thái có nhận biết chuỗi nháy đơn/kép/backtick, thay bằng khoảng trắng **cùng
   độ dài** nên số dòng không lệch. Không có bước này thì ~10 ca H1 hôm nay sẽ mất: các tệp mồ côi
   được nhắc tên rất nhiều **trong docstring** (`AccountSettings` · `StorageSettings` ·
   `NotebookButton` · `CuaSoThaoLuan`) nhưng **không ai import**.
2. **Tách bốn họ**, không gộp một con số.
3. **Tự loại trừ chính mình**: vùng quét cố ý chỉ `app/`+`components/`+`lib/`, kèm guard cứng
   `TU_LOAI_TRU` thoát mã 2 nếu ai nới sang `scripts/`.

---

## ② ƯỚC LƯỢNG BÁO NHẦM — đọc tay 14/26 ca H1

| Ca đọc tay | Phán |
|---|---|
| `components/LoginScreen.tsx` | **ĐÚNG** — `app/login/page.tsx:13` dùng `components/entry/LoginScreen.tsx`. **Hai bản cùng tồn tại**, 12.104 vs 8.874 byte |
| `StageSelect.tsx` | ĐÚNG — `ProjectSelect.tsx:98` tự khai *"THAY cho StageSelect cũ"* |
| `entry/StackedCards.tsx` · `entry/cardFaces.tsx` | ĐÚNG — chỉ hai tệp mồ côi ở trên import chúng ⇒ chết theo chuỗi |
| `AccountSettings` · `AppearanceSettings` · `StorageSettings` | ĐÚNG — mọi nơi nhắc tên đều là **chú thích**, 0 import thật |
| `NotebookButton` · `CuaSoThaoLuan` | ĐÚNG — như trên |
| `site/SunArc` · `site/SiteCompassPanel` · `site/MeetingContextCard` | ĐÚNG — cụm `components/site/*` **chỉ import lẫn nhau**, không ai bên ngoài mount |
| `ui/TruthBadge.tsx` | ĐÚNG — chỉ `lib/ui/truth.test.ts` chạm |
| `ui/Surface.tsx` | ĐÚNG — máy tự dán nhãn *"TOÀN TEST (xanh giả)"* |

**14/26 đọc tay, 0 báo nhầm ⇒ ước lượng báo nhầm H1 ≈ 0% trên mẫu đã đọc.** Nói thẳng giới hạn:
12 ca còn lại **chưa đọc**, và mẫu này nghiêng về ca dễ kiểm nên con số 0% là **cận dưới của sự
thật, không phải bằng chứng máy không bao giờ sai**.

- **H2 = 0 là THẬT, không phải máy mù.** Đếm độc lập: registry khai **9** `key:`, token
  `F · F9 · Esc · Delete · Z`; mọi token đều có nơi-nghe SỐNG. Và máy **có** bắt được `F13` trên
  cây biết-hỏng ⇒ họ này hoạt động.
- **H3 = 0 cũng THẬT** — `grep` độc lập cho handler rỗng cũng ra 0; máy bắt được ca giả.
- **H4 = 1** là `lib/vitals-ui.ts`: `StageSwitcher.tsx` vẫn import kho và vẫn mồ côi. Repo **cố ý
  giữ** tệp này (`AppChrome.tsx:360` ghi rõ *"Không xoá StageSwitcher.tsx"*) ⇒ đây là **tàn dư đã
  biết**, không phải hồi quy.

---

## ③ VIỆC B — audit bàn 2D/3D

Bảng đầy đủ: `docs/delivery/G3-BAN-LAM-VIEC-2D-3D.md`.

**Năm hỏng nặng nhất** (đau × rẻ): ① **xoay + tỉ lệ 3D không tồn tại ở khung nhìn** —
`grep TransformControls` toàn repo = 0 · ② **di chuyển 3D nhích cứng 100 mm/lần bấm**
(`Viewport3D.tsx:308` → `Render3DModeSkeleton.tsx:415`) · ③ **hai bản `LoginScreen`** đã phân kỳ,
bản mồ côi kéo theo cả cụm `StageSelect`/`StackedCards`/`cardFaces` · ④ `lib/vitals-ui.ts` còn dây
tới mặt đã rơi · ⑤ **2D thiếu canh hàng (align)** giữa 56 lệnh có cả `fillet`/`chamfer`/`divide`.

Hai điều đáng ghi ngược lại — đo ra **tốt hơn** dự đoán: 3D **có** thao tác không gian trực tiếp
thật (push-pull `Scene3DViewer.tsx:630` · dựng khối bằng cử chỉ `:648` · kéo đèn `:640`), và mọi
thao tác 3D **ghi thẳng vào cùng một `useCadStore` với 2D** — đúng luật X1 *dựng ở đâu cũng ghi vào
MỘT Doc*.

---

## ④ CHƯA CHẮC / CHƯA KIỂM
1. **Không mở app lần nào** (phiếu chỉ cho đọc mã) ⇒ mọi ô `CƠ CHẾ CÓ` là *đọc mã*, không phải
   nghiệm thu. Vòng *thao tác → ghi → tải lại → vào lại → cùng một sự thật* **chưa chạy lần nào**.
2. **H2 mù phím khai ngoài `lib/commands/` + `lib/shortcuts.ts`.** Đo được một ca thật:
   `TOOL3D_HOTKEYS` (`lib/render-studio/tool3d.ts:42`) — 8 phím đơn của 3D. Kiểm tay thì chúng
   **có** nơi nghe (`Tool3DBar.tsx`) nên không câm, nhưng **máy không phủ**. Cố ý không nới vội:
   hình dạng khai khác hẳn, nới ẩu là báo nhầm. Việc đợt 2.
3. **H1 không hiểu `next/dynamic` với đường dẫn dựng bằng biến.** Dạng chuỗi tĩnh thì bắt được
   (mẫu ⑤ `new URL`, `import()`); dạng ghép chuỗi thì mù ⇒ có thể **báo oan**. Không gặp ca nào
   trong 14 ca đã đọc, nhưng không chứng minh được là không có.
4. **Bóc chú thích không bóc nội dung chuỗi.** Regex literal chứa dấu mở chú thích khối sẽ lệch —
   ca hiếm, khai chứ không giấu.
5. 12/26 ca H1 **chưa đọc tay**.
6. `npm test` ban đầu **rc=123** vì worktree **không có `node_modules`**; đã nối symlink sang repo
   chính (bị gitignore, không lọt vào commit) rồi chạy lại. ⇒ **các lane khác chạy test trong
   worktree sạch sẽ gặp đúng lỗi này.**
7. Bảng 2D **gộp 56 lệnh theo nhóm** để đọc được — gộp là **chọn**, không phải đo.
8. Chuỗi mount 3D đi qua `HomeScreen`, **chưa đọc hết** tệp đó ⇒ có thể còn nhánh điều kiện quyết
   định 3D hiện hay không mà bảng chưa thấy.

## ⑤ HẠN DÙNG KẾT LUẬN
Số của máy soi đúng **tại `55a953fa`**. Chúng đổi mỗi khi có tệp mới hoặc một mount bị gỡ — chạy
lại chứ đừng trích số này. Riêng ba ô "KHÔNG" (`TransformControls` · `align` · `group` cấp entity)
là `grep` toàn repo = 0, bền hơn: chỉ đổi khi có người thêm tính năng đó.
