# M-LOGIN-UI-OUT — báo cáo phiên CODE màn đăng nhập (07/08)

Sở hữu: `app/globals.css` (CHỈ khối `.lq-*`) · `components/entry/LoginForm.tsx`.
`git status --short` sau phiên: đúng 2 file `M` (globals.css + LoginForm.tsx). **V6: KHÔNG commit.**
`npx tsc --noEmit -p .` (nền) → **exit 0**. Console browser sau sửa: **0 lỗi**.
Server verify: 127.0.0.1:3000 (server sẵn của phiên khác, CÙNG working tree nên HMR ăn thay đổi
— trần 5 server/thư mục đã kín, không mở thêm được; không logout/xoá cookie, đúng luật máu).

## VIỆC 1 — text-shadow áp nhầm ngữ cảnh: ĐÃ SỬA, chọn phương án (a)

**Chọn (a) selector theo theme/tone, KHÔNG chọn (b) class `--on-photo`** — lý do quyết định:
tín hiệu "đang nổi trên ảnh" ĐÃ tồn tại dạng attribute (`data-login-tone` do
`LoginScreen.tsx:92` gắn; `data-theme` trên `:root`), còn (b) đòi sửa markup ở
`LoginScreen.tsx`/`LoginBackdrop.tsx` — **ngoài vùng sở hữu phiên này** (chỉ được LoginForm).
(a) gói trọn trong khối `.lq-*` mình sở hữu, 0 đụng file khác.

| Sửa | Vị trí (grep `07/08`) |
|---|---|
| Tắt shadow ở ngữ cảnh card sữa chữ mực: `:root[data-theme='light'] …` + `[data-login-tone='light'] …` → `text-shadow:none` | `app/globals.css:806-813` |
| Bật lại cho nền ảnh: `:root [data-login-tone='dark'] .lq-card > .lq-content` — specificity (0,4,0) ≥ nhánh theme sáng, đặt SAU | `app/globals.css:815-820` |
| Nút submit COPPER giữ `text-shadow:none` bất kể tone (nâng selector cùng bậc) | `app/globals.css:822-827` |
| **KHÔNG xoá** shadow gốc `:800→804` — theme tối/ảnh nền vẫn cần (đúng cảnh báo brief) | `app/globals.css:804` |

**Ma trận đo computed style trên browser thật (getComputedStyle `.lq-content`):**
| Trạng thái | textShadow đo được | Đúng? |
|---|---|---|
| theme tối + tone dark (ảnh/gradient tối — chữ trắng) | `rgba(0,0,0,.45) 0 1px 3px` | ✅ giữ |
| theme SÁNG + tone dark (ảnh nền trong theme sáng) | `rgba(0,0,0,.45) 0 1px 3px` | ✅ giữ (chữ vẫn trắng trên ảnh) |
| theme SÁNG + không tone (ember auto — card sữa chữ mực) | `none` | ✅ hết nhoè |
| tone light (linen) — cả 2 theme | `none` | ✅ hết nhoè (ca ảnh Hoà) |

## VIỆC PHÁT SINH (cùng họ, trong vùng sở hữu) — bug specificity "tone dark cưỡng bức"

`[data-login-tone='dark'] .lq-card` (cũ, (0,2,0)) **THUA** `:root[data-theme='light'] .lq-card`
(:757, (0,3,0)) ⇒ theme sáng + ảnh nền ra **card SỮA đè lên ảnh**, trái chính comment "tone dark
cưỡng bức" của nó. Cùng mẫu ở `.lq-field`. Sửa: thêm biến thể `:root [data-login-tone='dark'] …`
(0,3,0), đứng sau → thắng khi hoà — `app/globals.css:773-778` (card) + grep
`cùng họ lỗi specificity` (field). Verify computed: theme sáng ép + tone dark → cardBg vẫn bản
kính tối `rgba(58,48,38,0.14/0.07)`, KHÔNG phải sữa 0.55. (Sửa vượt chữ "liệt kê" của VIỆC 3 —
lý do: trạng thái nghiệm thu "theme sáng + ảnh nền" của chính VIỆC 1 phụ thuộc trực tiếp nó.)

## VIỆC 2 — "Ghi nhớ đăng nhập" dính "Quên mật khẩu?": KHÔNG TÁI HIỆN ĐƯỢC (N3), vá lưới đỡ

Đo DOM thật (`getBoundingClientRect`, VI):
| Cấu hình | rowW | gap thật |
|---|---|---|
| desktop 1280 | 326px | **102.6px** |
| mobile 375 | 269px | **45.6px** |
| mobile 375 EN (đo canvas cùng font) | 269px | ước **≈34px** |

`justify-between` còn nguyên (computed `justifyContent:space-between`, `flexWrap:nowrap` trước
sửa), không class nào đè. ⇒ Không dựng lại được ảnh "dính sát" của Hoà ở các cấu hình trên —
nghi ngữ cảnh hẹp hơn chưa dò ra (cửa sổ rất hẹp? LockScreen nhúng? — `LockScreen.tsx:82` nhúng
LoginForm, container không thấy ràng buộc hẹp khi đọc). Theo đúng chỉ đạo brief vẫn vá lưới đỡ:
`flex flex-wrap … gap-x-4 gap-y-1` (`components/entry/LoginForm.tsx`, grep `+gap-x-4`) — hở tối
thiểu 16px kể cả khi hết chỗ, quá chật thì "Quên mật khẩu?" xuống dòng thay vì dính. Ghi thẳng
trong comment code: đây là lưới đỡ, KHÔNG phải fix nguyên nhân gốc.
→ **Nhờ Hoà**: nếu còn thấy dính sau bản này, cho xin kích thước cửa sổ/ngữ cảnh (màn login hay
màn khoá) để truy tiếp.

## VIỆC 3 — rà cùng họ toàn màn

| Chỗ | Kết luận |
|---|---|
| `app/globals.css` khối `.lq-*` | text-shadow tĩnh CHỈ có 1 chỗ `.lq-content:804` (đã xử lý trên); `.lq-field`/`.lq-scrim` không shadow |
| `.vitals-pop` (globals.css, grep `KHÔNG text-shadow`) | sạch — chính nó là nơi phát biểu luật |
| `lib/adaptive-contrast.ts:231` `shadowCss()` | **KHÔNG cùng họ lỗi** — shadow đổi màu theo tone chữ: chữ kem → bóng MỰC, chữ mực → quầng KEM sáng (`tone==='light'?INK_RGB:CREAM_RGB`, tone='light' nghĩa là CHỮ sáng theo `buildPlan:249`), không bao giờ ra bóng đen dưới chữ đen |
| `components/entry/*` khác | grep `text-shadow|textShadow` = 0 chỗ tự khai |

## Nghiệm thu N6 — chụp màn (trong transcript phiên, đủ 4 trạng thái)

① tối + nền ảnh/gradient tối: chữ trắng + shadow (đúng ngữ cảnh gốc 26/07) · ② "Lụa sáng"
(linen): card sữa, chữ mực SẮC không viền mờ — đúng ca Hoà chê, đã hết · ③ theme sáng ép + "Mực
đêm" (tone dark): card vẫn kính tối, chữ trắng + shadow, KHÔNG còn card sữa đè ảnh · ④ theme
sáng + không tone: shadow none. 0 lỗi console.
🟡 **CHƯA VERIFY**: ca ẢNH THẬT (thư viện ảnh server này trống "Chưa có ảnh dựng sẵn", không bơm
ảnh lạ vào app) — đại diện bằng gradient tone dark, CSS đi đúng cùng nhánh `[data-login-tone='dark']`
(slideshow/image/wall đều ép 'dark' tại `LoginBackdrop.tsx:230-235`) · trạng thái ③/④ ép
`data-theme`/`data-login-tone` bằng JS để cô lập CSS (lựa chọn nền + theme thật đi cùng đường
attribute đó, đã đối chiếu code gắn attr `LoginScreen.tsx:92`) · reduce-motion không liên quan
(không đụng transition nào).
