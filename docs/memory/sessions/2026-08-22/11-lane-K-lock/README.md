# LANE K — AUTH / LOCK / RESUME (22/08)

**KẾT: PASS** · `npx tsc --noEmit` → 0 · `npm test; echo $?` → **0** (soi mã thoát, không grep FAIL).

## ⓪ [Đ2] Bốn giả định của phiếu — XÁC NHẬN CẢ BỐN, không dựng hệ khoá thứ hai
| Tệp | Đã chạy sẵn | Thiếu |
|---|---|---|
| `components/studio/LockScreen.tsx` | overlay portal z-[99], đồng hồ, tên dự án, dòng-trong-ngày, khoá không điều hướng | **nhúng thẳng `LoginForm`** ⇒ mặt khoá là form đăng nhập thứ hai (ô email + tab Đăng ký + 3 nút OAuth) · thiếu ngữ cảnh chặng · lật là `rotateX`, không phải trục Y |
| `lib/lockscreen.ts` | store `locked`, `lockScreenNow()` **ép autosave rồi mới khoá** (đợi tín hiệu `useSaveStatus` thật, trần 2s) | nấc 5/15/30/60/Không-bao-giờ · canh tab ở nền · cửa cho lệnh |
| `components/settings/LockScreenSettings.tsx` | mount thật, lưu theo user | ô **nhập số tự do** (1–180) thay vì nấc |
| `components/studio/AppChrome.tsx` | mount LockScreen · hẹn giờ rảnh (mặc định 15') · **chặn mọi phím tắt khi khoá** ở capture phase, chừa lối cho `[data-lockscreen-root]` | phím ⌃⌘Q **gõ cứng tại component**, không qua sổ lệnh |

AppChrome KHÔNG nằm trong vùng ghi ⇒ **không sửa một dòng**. Mọi thứ thêm được đặt vào LockScreen (luôn mount) và `lib/lockscreen.ts`.

## ĐÃ CÓ (tái dùng) vs ĐÃ THÊM
**Tái dùng nguyên vẹn:** store `useLockScreen` · `lockScreenNow()` + hai sự kiện ép-lưu `cad:/present:force-save-request` · hẹn giờ rảnh của AppChrome · bộ chặn phím lúc khoá · portal ra `document.body` (luật K4) · `POST /api/auth/login` (`app/api/**` không đụng) · token `app/globals.css` (0 màu mới) · `useT(vi,en)`.

**Thêm:**
- `lib/auth/xac-thuc-lai.ts` — xác thực **LẠI** (khác đăng nhập: đã biết là ai, chỉ hỏi bằng chứng, xong ở nguyên chỗ). `sinhTracKhaDung()` luôn `false` kèm lý do.
- `components/auth/TheXacThucLai.tsx` — mặt sau thẻ: tài khoản dạng **chữ đọc**, đúng một ô mật khẩu. Không email, không OAuth, không Đăng ký.
- `components/studio/LockScreen.tsx` — viết lại ruột: **GIỜ → NGỮ CẢNH (dự án · chặng) → DÒNG NGẮN → Mở lại ↵**; thẻ hai mặt lật 180° trục Y; nghe `if:lock-request`; gọi `startLockGuard`.
- `lib/lockscreen.ts` — `LOCK_IDLE_CHOICES [5,15,30,60,0]` · `getLockIdleChoice/setLockIdleChoice` · `NEVER_MINUTES` · `startLockGuard()` (canh tab nền + cửa lệnh) · **sửa ruột `getLockIdleMinutes`**.
- `lib/commands/registry.ts` — **chỉ thêm**: `APP_COMMANDS` (`app.lock` "Khoá InteriorFlow", `key:['mod','shift','L']`), `findAppCommand`, `matchKeyToken`.
- `components/settings/LockScreenSettings.tsx` — dải 5 nấc + phím tắt hiện ngay cạnh nút.

### Hai cái bẫy đã gỡ, ghi lại kẻo phiên sau đạp lại
1. **"Không bao giờ" suýt thành "khoá tức thì".** Nơi tiêu thụ duy nhất là `setTimeout(minutes*60_000)`; `0`/`Infinity`/`>2^31−1 ms` đều chạy NGAY. Nên "không bao giờ" quy ra **7 ngày** (604.800.000 ms, dưới trần), và `getLockIdleMinutes` phải đổi ruột — bản cũ coi mọi giá trị `<=0` là hỏng rồi rơi về 15.
2. **Không nhét `app.lock` vào `COMMANDS`.** `registry.test.ts` khoá ba bất biến (số alias phải khớp `CAD_COMMANDS`; mọi lệnh ≥1 alias; chỉ 10 lệnh có đủ 3 `stages`). Lệnh khoá cố ý **không có alias gõ tay** (gõ "KHOA" giữa lúc vẽ mà khoá màn là bẫy) ⇒ tách `APP_COMMANDS`, cùng tệp, cùng kiểu, không phá test nào.

## LOCK ≠ LOGOUT — giữ được gì, bằng chứng
Đo trên app thật (`artifacts/visual-review/__k-shot.mjs`), dự án *Mặt bằng · Studio 48m²*, chặng 2D:
```
TRUOC KHOA  /projects/cmt10d9lg0016w9rbvnkt9xh3/cad   mark=K-1787368445142  canvasConnected=true
KHI KHOA    /projects/cmt10d9lg0016w9rbvnkt9xh3/cad   mark=K-1787368445142  canvasConnected=true
            o email tren mat khoa = 0 · o mat khau tren mat khoa = 0
SAU MO LAI  /projects/cmt10d9lg0016w9rbvnkt9xh3/cad   mark=K-1787368445142  canvasConnected=true
URL GIU NGUYEN? true
```
- `window.__kMark` **sống sót** ⇒ không tải lại trang.
- Tham chiếu tới thẻ `<canvas>` lấy TRƯỚC khi khoá vẫn `isConnected` sau khi mở ⇒ **cây workspace không hề bị tháo** ⇒ camera/zoom/vùng chọn/cửa sổ công cụ/bố cục còn nguyên vì chưa bao giờ mất.
- **Job đang chạy:** đường khoá gồm đúng ba việc — bắn 2 sự kiện ép-lưu, đợi `useSaveStatus`, bật cờ `locked`. Không một lời gọi huỷ/abort/cancel nào; hàng đợi render sống trong cây React phía sau, mà cây đó chứng minh được là còn nguyên (dòng trên).
- Phiên: không `setUser(null)`, không xoá cookie, không điều hướng.

## MỞ LẠI ĐÚNG CHỖ CŨ
`Mở lại ↵` → lật sang mặt xác thực (`data-lock-mode` đổi `mat-khoa`→`xac-thuc`) → xác thực → `unlock()` **chỉ hạ lớp che**, không `router.push` ở đâu cả ⇒ URL và DOM y nguyên (bảng trên). Không qua Trang chủ, không nhập lại email.
⚠️ Khai thẳng: lượt mở khoá trong ảnh chạy với `/api/auth/login` **bị stub 200** (phiếu cấm nhập mật khẩu). Cái được chứng minh là **đường mở-lại → về đúng chỗ cũ**; cái CHƯA chứng minh trên app thật là phản hồi 401 của máy chủ với mật khẩu sai — mới chỉ đúng theo mã.

## SINH TRẮC — **KHÔNG CÓ**, nói thẳng
Đo tại nguồn: `app/api/auth/` chỉ có apple · google · login · me · microsoft · providers · register — **không route WebAuthn nào**, không gói WebAuthn trong dự án. Thiếu nửa máy chủ thì `navigator.credentials.get()` chỉ là hộp thoại đẹp không chứng minh được gì. Nên **không vẽ nút sinh trắc** (bịa nút sinh trắc nặng hơn nút giả: nó hứa một mức bảo mật không tồn tại). Thứ tự ①passkey ②mật khẩu vẫn đúng, hôm nay chỉ có ②.

## CHUYỂN CẢNH
Lật 180° **trục Y**, 620ms `easeApple`, mỗi lần đổi trạng thái lật đúng một lần (không lặp trang trí). Nền: trường ambient `blur(30px) saturate(120%)` + nền 72% — workspace lùi lại, nhận ra app của mình nhưng **không đọc được nội dung**; mặt khoá chỉ nói TÊN dự án + TÊN chặng, không ảnh render, không toạ độ, không số đo.
**`prefers-reduced-motion` — nhánh tĩnh THẬT, đã đo** (`__k-rm.mjs`): `transform: none` ở CẢ hai trạng thái, mặt xác thực vẫn dựng đủ (ô mật khẩu có mặt) → đổi mặt tức thì, không xoay.

## LẠNH ≠ MỞ KHOÁ
Hai luồng vẫn tách: mở lạnh (ngữ cảnh trình duyệt sạch) rơi vào **`/intro`** — route riêng, Lane K **không đụng** (`components/entry/**` ngoài vùng ghi). Chụp K1 chỉ để làm bằng chứng hai luồng không bị trộn.

## ẢNH (`artifacts/visual-review/`)
`K1-cold-ambient.png` (mở lạnh → /intro) · `K0-workspace-truoc-khoa.png` · `K2-lock-face.png` · `K2b-the-xac-thuc.png` · `K2c-reduce-motion.png` · `K3-unlock-resume.png`. Script: `__k-shot.mjs` · `__k-cold.mjs` · `__k-rm.mjs`.

## CHƯA CHẮC / CHƯA KIỂM
- Mật khẩu sai / máy chủ 401: **chỉ đúng theo mã**, chưa chạy thật (phiếu cấm nhập mật khẩu).
- Canh tab ở nền (`visibilitychange`) và nấc "Không bao giờ": **chưa chạy thật** — muốn kiểm phải đợi 5 phút thật hoặc ẩn tab lâu; lập luận `setTimeout` quá trần đã ghi rõ để người sau kiểm lại bằng số.
- Chỉ đo trên **Chromium/macOS, 1440×900, theme sáng**. `backface-visibility` + `preserve-3d` ở Safari/Firefox là **suy**, chưa nhìn. Theme tối chưa chụp.
- `matchKeyToken` dò macOS bằng `navigator.platform` (đã lỗi thời nhưng còn chạy) có `userAgent` đỡ; Win/Linux `Ctrl⇧L` **chưa thử trên máy thật**.
- Chưa thử trình đọc màn hình. `aria-hidden` mặt đang úp đã đặt, nhưng chưa nghe bằng tai.
- ⌃⌘Q cũ (AppChrome) **vẫn còn**, chạy song song với ⌘⇧L. Hai phím một việc — cố ý giữ tay quen macOS, nhưng đây là **nợ**: dọn được khi nào AppChrome vào vùng ghi.
- 12 câu "dòng trong ngày" giữ nguyên từ bản cũ, chưa qua mắt Hoà.
