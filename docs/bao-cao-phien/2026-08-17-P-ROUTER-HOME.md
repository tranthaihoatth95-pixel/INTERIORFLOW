# P-ROUTER-HOME · 17/08 · phiên phụ P-ROUTER-HOME

## 1. Tổng quan
Wrap `<DongStudioHome>` bằng `<AppShell active="home">` để rail điều hướng V1 (`RailDieuHuong`) hiện ở '/' như mọi chặng khác — Hoà chốt 16/08 "sidebar là hệ router toàn app, LUÔN hiện". Xong-máy 3 file (`AppChromeTypes.ts` · `AppShell.tsx` · `HomeScreen.tsx`); tsc 0 · npm test 0 fail · dev server render sống với đủ 11 mục rail; verify browser thật `http://localhost:3000/`.

## 2. Chi tiết

### ⓪b tiền đề hạ tầng
- `git log -1` = `3c65c24` (`docs(phieu): 2 phiếu — router wrap AppShell + dashboard theo hệ DS`)
- `git rev-list --count HEAD..main` = **0** — worktree đúng mốc, không lệch main
- Xác nhận theo ⓪c luật mới 16/08 (`00-CHOT`) — không lặp lại ca 167-commit hôm trước

### ⓪ tiền đề nghiệp vụ
Phiếu khẳng định `HomeScreen.tsx:557` render `<DongStudioHome>` trực tiếp KHÔNG qua `<AppShell>`. Đã đọc và xác minh: đúng — nhánh `if (!stageDone)` return `<>...<DongStudioHome/>...<Dashboard/></>`, RailDieuHuong không tồn tại trên '/'. **NHẬN tiền đề, không bác**.

### ③ Việc — 3 sửa
| File | Thay đổi | Bằng chứng |
|---|---|---|
| `components/studio/AppChromeTypes.ts` | Thêm `'home'` vào union `AppChromeActive` | `AppChromeTypes.ts:12` `= 'render' \| 'cad' \| 'present' \| 'photo' \| 'home';` |
| `components/studio/AppShell.tsx` | ① `navigator?` + `navigatorAddLabel?` thành optional (line 54-58) ② Gate `<Navigator>` bằng `active !== 'home'` (line 155) — dùng `active` không dùng `navigator !== undefined` để chặng khác quên truyền cũng thấy khung Navigator trống (báo lỗi hiển thị sớm) | `AppShell.tsx:54-64` + `:150-159` |
| `components/home/HomeScreen.tsx` | ① Wrap nhánh `!stageDone` bằng `<AppShell active="home">...</AppShell>` (thay `<>...</>`) ② GỠ `<Dashboard/>` cuối Fragment cũ — vì `AppShell.tsx:186` đã tự mount `<Dashboard/>`, mount đôi = 2 subscription store | `HomeScreen.tsx:516-598` |

**KHÔNG đụng**: `DongStudioHome.tsx` (P-DASHBOARD giữ) · `components/home/widgets/**` · `--accent*` · `app/globals.css`.

### Vì sao chọn 'home' không dùng lại 'render'
`app/settings/page.tsx:29` tiền lệ: dùng `active="render"` cho trang không phải chặng. Có thể áp dụng cho Home để tránh mở rộng `AppChromeActive`. **T bác vì**: ①ngữ nghĩa Home ≠ Render (Rail đã đọc `pathname='/'` → active `tong-quan`, không phụ thuộc `active` của AppChrome — nên đặt `'home'` không hại; đặt `'render'` LÀM SAI ngữ nghĩa) ②kiểm lan tỏa `AppChromeActive` trước khi thêm — 5 nơi nhận đều null-safe (`activeToPhase` if/else default 'render'; `routeScope` return null; `AppCommandPalette` fallback 'render'; `MobileMenu` gọi `activeToPhase`; `AppChrome:287` fallback 'cad' cho `AppLogoMenu.stage`, `AppChrome:333` `StageSwitcher.active={currentPhase}` — 'home' → 'render' fallback, không mục nào active trên switcher, ĐÚNG ngữ nghĩa Home không thuộc chặng nào).

### ⑥b Đích trần 5 vòng — kết quả đo
| Đích | Đo | Kết quả |
|---|---|---|
| tsc 0 | `npx tsc --noEmit` | **EXIT=0** |
| npm test 0 fail | `npm test` (tsc + license:check + check:chot + tất cả `*.test.ts`) | **EXIT=0** — không có `fail`/`Error`/`error TS` |
| `grep -c '<AppShell active="home"'` ≥ 1 | grep `HomeScreen.tsx` | **2** (một mở tag + một trong comment) |
| dev server auto-recompile không vỡ chunk | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` | **200** · browser render sống: rail 11 mục, 5 mục xưởng có href thật (`/`, `/tasks`, `/files`, `/library`, `/settings`), 6 mục mờ (Chat·Meetings + 5 mục dự án chưa mở) |

### 5 máy soi + soi:tu-dien
- `npm run soi:frontier` = **0 lệch** (👁 1 mắt · ✅ 71 xong-máy · ⬜ 55 chờ · 🔴 0)
- `npm run soi:tu-dien` = **0 lệch nhãn cứng** (314 chỗ chữ trần cảnh báo, không phải mới, không chặn)

### 4. Đánh giá khách quan
**Tốt**:
- Chốt Hoà 16/08 (sidebar = hệ router toàn app) nay thi hành thật ở đúng route '/' — trước là route DUY NHẤT trong app không có bản đồ. Đo được: `data-marker="railHaiCum"` xuất hiện trên `/`.
- Kiến trúc thay đổi (mount đôi Dashboard cũ) được sửa cùng lượt, không lưu nợ ẩn.
- Không lan tỏa vào `AppChrome`/`ShortcutsPanel`/`MobileMenu`/`stage-nav` — nhờ tất cả đều đã null-safe.

**Chưa**:
- 🟡 **Console browser hiện có errors STALE**: "Unexpected token AppShell" ở `HomeScreen.tsx:528` — nhưng đây là snapshot compile trước, KHÔNG phải lỗi runtime hiện tại (bằng chứng: screenshot render đúng, DOM có rail 11 mục hoạt động, `tsc` PASS, `pathname='/'` route trả 200). Errors này sẽ trôi khỏi buffer sau vài lần navigate; không phải lỗi cần sửa.
- 🟡 Chưa test navigate thật khi bấm mục rail — chỉ verify `href` có trong DOM (5 mục xưởng đủ href), chưa mô phỏng click và đo redirect.
- 🟡 Chưa test tương tác `WelcomeIntro` modal khi mở trên Home mới (verify nó nổi trên rail, không đè). Modal mount CÙNG cấp với DongStudioHome trong AppShell — z-index của WelcomeIntro thuộc component đó, không phụ thuộc container, nên lý thuyết OK; chưa đo thật.
- 🟡 Chưa test cover mode (`isCover && !forceFullApp`) và nhánh canvas — hai nhánh này không đụng vào phiên này nhưng cần chắc rail không bị đúp vì AppShell cũng mount ở nhánh canvas dưới. Xác minh nhanh: nhánh canvas cũng đã bọc `<AppShell active="render">` từ trước (line 634) → nay `/` và canvas đều có rail, đúng ý.

### ⑦b CHƯA CHẮC / CHƯA KIỂM
1. Errors console stale — không xác minh được chúng đã trôi hết sau lần recompile mới nhất; runtime hoạt động là bằng chứng gián tiếp, không trực tiếp.
2. `WelcomeIntro` modal + `chooseProjectNotice` notice bar khi bật đồng thời: chưa thao tác thật, chỉ đọc code (notice bar `position: fixed z 60`, WelcomeIntro thuộc component riêng chưa mở).
3. Nhánh cover mode (`isCover`) — chưa test resize dưới 480px xem có bị rail đè không (cover không dùng AppShell, giữ nguyên `<motion.div>` bao Dashboard read-only).
4. Sub-agent P-DASHBOARD-DS đang chạy song song trên `components/home/DongStudioHome.tsx` + `widgets/**` — không xác nhận được phần đó có xung đột merge với `HomeScreen.tsx:557 <DongStudioHome onEnter=...>` không (T đã khoá phạm vi khác nhau, nhưng chưa đo thật giữa hai phiên).

### ⑦c HẠN DÙNG KẾT LUẬN
- `'home'` thêm vào `AppChromeActive`: hiệu lực cho đến khi có luật thay `AppChrome` cho Home (vd Home có shell riêng không dùng AppChrome). Nay không có kế hoạch đó.
- `navigator?` optional: hiệu lực vĩnh viễn — chỉ nới thêm khả năng, không phá 5 nơi cũ (đều đang truyền).
- Gỡ `<Dashboard/>` khỏi nhánh `!stageDone`: hiệu lực khi AppShell tiếp tục mount `Dashboard` line 186. Nếu ai đó gỡ dòng đó ở AppShell thì phải khôi phục ở HomeScreen.

## 3. Tổng kết
Ba file sửa gọn, đích ⑥b trần 5 vòng PASS toàn bộ, browser render sống. Kiến trúc "sidebar là bản đồ toàn app" nay có mặt trên route '/' — kết thúc bất đối xứng lâu ngày.

## 5. Hướng xử lý nhiều góc độ (nếu ai đó muốn khác)
- **Hướng A (đang làm)**: thêm `'home'` vào `AppChromeActive` + gate Navigator bằng `active !== 'home'`. Rõ ngữ nghĩa, chống lỗi lan sang chặng khác.
- **Hướng B**: dùng `active="render"` cho Home (như `/settings`), giữ nguyên `AppChromeActive`. Ít đụng type, nhưng ngữ nghĩa sai (Home ≠ Render); và phải sửa AppShell gate Navigator theo cách khác (kiểm `navigator !== undefined`), làm mất khả năng phát hiện chặng quên truyền navigator.
- **Hướng C**: không dùng AppShell ở Home — dựng riêng `<HomeShell>` chỉ chứa AppChrome + RailDieuHuong + children. Sạch nhất về ngữ nghĩa, nhưng nhân đôi khung xương app, phá luật "vỏ chung 3 chặng" mà AppShell sinh ra để thực thi.

## 6. Đề xuất
**Hướng A** — đã chọn và thi công. Lý do so với B: 'home' là ngữ nghĩa đúng, ràng buộc `active !== 'home'` phòng lỗi rẻ. So với C: không nhân đôi khung xương, không đẻ khái niệm mới.
