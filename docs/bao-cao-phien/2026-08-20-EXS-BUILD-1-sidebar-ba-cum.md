# EXS-BUILD-1 — Rail điều hướng: HAI CỤM → BA CỤM + độ rộng theo chốt Experience System (20/08)

## ⓪ Tiền đề
- `git log --oneline -1` = **c7f3ac8** ✅ (đúng mốc phiếu). Tree dirty nhiều file — đúng như phiếu khai.
- Đã đọc `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 3 (BA CỤM) + điều 4 (Rail 52-56 · Shelf 220-280 · Panel 320-440) trước khi code. Điều 4 tự khai DRIFT `BE_RONG_NAC = 28/240/320` — khớp đúng hiện trạng đo được.
- ⓪b: dev server :3001 sống sẵn, KHÔNG restart. ⓪c: không dùng worktree, làm trong cây chính đúng vùng ghi.

## ① Việc đã làm (LOOK INSIDE → sửa đúng chỗ, KHÔNG rail thứ hai)

### `components/nav/muc-dieu-huong.ts` (model)
1. **`CumRail`: `'xuong' | 'duAn'` → `'chung' | 'duAn' | 'caNhan'`.**
   - Đo trước khi đổi: khoá cụm **KHÔNG persist ở đâu** — localStorage chỉ lưu NẤC (`interiorflow.rail.nac_v1`, giá trị là `NacRail` `dinhVi/dieuHuong/duyet`, không đổi); grep toàn repo: `CumRail`/`'xuong'` không có consumer ngoài `components/nav/` (các hit `duAn` khác là của bento-layout và files/ngan-tho — kiểu riêng, không dính). ⇒ đổi khoá an toàn, không cần đường nâng cấp.
   - **Giữ khoá `duAn` cho cụm giữa thay vì `chang` như phiếu gợi ý** — lý do: cụm chứa cả hai mục KHÔNG phải chặng (`du-an-nay` · `so-tay`); điều kiện sống của cả cụm là "đã mở dự án" — đó là ranh giới kỹ thuật thật, "ba chặng" chỉ là nhãn của chốt. Đổi thành `chang` là đặt tên sai bản chất cho 2/5 mục.
2. **Phân mục lại đúng chốt điều 3**: cụm `chung` = Tổng quan · Bảng việc · Chat/Họp · Files · Thư viện (5) — **Cài đặt RỜI khỏi cụm này** · cụm `duAn` = Dự án này · Sổ tay · 2D · 3D · Trình chiếu (5, giữ nguyên điều kiện chỉ-sống-khi-có-dự-án) · cụm `caNhan` = **Cá nhân (MỚI)** · Cài đặt (2).
   - Mục **Cá nhân** trỏ trang THẬT `/settings/avatar` (AvatarBuilder, route sống từ trước) — không phải nút giả; `mucDangMo` bắt `/settings/avatar` → `ca-nhan` TRƯỚC nhánh `/settings` → `cai-dat` để hai mục không cùng sáng.
   - Luật "KHÔNG lên rail" (Bảng màu · Kho vật liệu · Gallery) GIỮ NGUYÊN, test [2] vẫn canh.
3. **`BE_RONG_NAC`: `{dinhVi: 28→52, dieuHuong: 240 giữ, duyet: 320 giữ}`.**
   - **Vì sao 52** (khoảng chốt 52-56, số chốt theo token): `52 = --tap-lg 44px (globals.css:110, ô chạm lớn — KHÔNG đổi theo con trỏ) + 2×4px lề hàng có sẵn (`margin: 0 4px`)`. Không bịa số mới.
   - **240 giữ**: đã nằm trong khoảng 220-280 — đổi là churn không mang tin.
   - **320 giữ min, KHÔNG tự chế resize**: rail hiện không có cơ chế resize nào ⇒ theo phiếu, ghi **NỢ phiếu riêng** (comment ⛳ tại `BE_RONG_NAC`): resize kéo tay nấc `duyet` trong [320, 440].
4. `duongCua`: `cum === 'xuong'` → `cum !== 'duAn'` (cụm chung + cá nhân đều là đường tuyệt đối). `NHAN_CUM` ba nhãn: **Workspace chung / Dự án / Cá nhân**. Thêm `THU_TU_CUM` xuất khẩu để renderer + test dùng chung một thứ tự.

### `components/nav/RailDieuHuong.tsx` (renderer)
5. Vòng vẽ cụm đọc `THU_TU_CUM` (3 cụm) thay mảng gõ tay 2 cụm. Ba cụm = ba đảo dọc cùng trục, tách bằng `marginTop: 18` (khoảng thở) — **không đường kẻ ngang**, đúng luật 16/08 (vốn đã đúng, giữ).
6. Nút đổi nấc ở nấc định vị: bỏ hack đệm `6px 2px` + nút 24px (sinh ra vì 28px chật); nay 52px chứa nút **32×32** + đệm 6 (32+12=44 ≤ 52) — ghim 32 CỐ ĐỊNH chứ không `var(--tap)` vì trên cảm ứng `--tap` nở 44 ⇒ 56 > 52 sẽ tràn. 32×32 vượt ngưỡng 24×24 WCAG 2.2 AA (2.5.8).
7. **Sửa 1 bug lộ ra khi đo browser thật**: span bọc của `Tooltip` là inline-flex SHRINK-WRAP ⇒ `width: calc(100% - 8px)` của hàng tính trên fit-content, hàng co còn 32px thay vì ăn bề ngang. Truyền `style={{width:'100%'}}` qua prop `style` sẵn có của Tooltip (KHÔNG sửa `components/ui/Tooltip.tsx` — ngoài vùng ghi).
8. Marker `data-marker="railHaiCum"` **GIỮ NGUYÊN chuỗi** làm định danh ổn định (đổi là vỡ con trỏ trong phiếu/nhật ký cũ); docstring hai file đã ghi rõ rail nay là BA CỤM + nguồn chốt.

### `components/nav/muc-dieu-huong.test.ts`
9. Kỳ vọng đổi theo chốt, ghi nguồn chốt ngay đầu file: [1] ba cụm 5/5/2 + thứ tự từng cụm + ba cụm liền khối không đan xen · [4] `/settings/avatar → ca-nhan`, `/settings → cai-dat` · [5] thêm "cụm CÁ NHÂN không bị dự án khoá" · [7] `52/240/320` kèm chú thích vì sao 52 và vì sao 440 là nợ.

### KHÔNG đụng
`components/studio/AppShell.tsx` (mount không cần đổi — rail tự khai bề rộng) · `app/globals.css` · token `--accent*` · mọi vùng ngoài `components/nav/**`.

## ② Verify

### Máy
- `npx tsc --noEmit` → **0 lỗi**.
- `sucrase-node components/nav/muc-dieu-huong.test.ts` → **✅ tất cả kiểm ĐẠT** (0 FAIL).

### Browser THẬT :3001 (số đo `getBoundingClientRect`)
**Ở `/` (Home, chưa mở dự án):**
- Nấc mặc định `dieuHuong`: rail **width = 240**, ba `role="group"` render đúng: "Workspace chung" (5 mục, Chat·Họp mờ kèm lý do "chưa có trang") · "Dự án" (5 mục, CẢ 5 MỜ kèm lý do "Chưa mở dự án — chọn một dự án ở Tổng quan" — hành vi cũ giữ nguyên) · "Cá nhân" (2 mục, dùng được). Khoảng thở giữa cụm ≈ 22px (18 margin + 4 gap), không đường kẻ.
- Nấc `dinhVi`: rail **width = 52**, `overflowX = false`, **0 text span** (icon-only đúng), hàng mục 32×28 nằm gọn (bề ngang khả dụng 40px vì scrollbar `thin` chiếm 11px khi danh sách cuộn dọc — hành vi có sẵn từ trước, không phải regression), nội dung chính bắt đầu đúng **x = 52** — không tràn/đè canvas.
**Trong chặng (mở dự án CÓ SẴN qua nút "Mở lại" — không tạo dự án mới), `/projects/cmsqu517r0001w9axbunx9m7m/cad`:**
- Rail width = 240, canvas bắt đầu **x = 240** (không đè), cụm Dự án HẾT MỜ, `aria-current="page"` đúng trên **Thiết kế 2D**, ba cụm đủ thành phần y như ở Home (rail không đổi nội dung theo chặng — luật §6.2 giữ).
- Rác dữ liệu: 0 (không tạo dự án/ghi chú; khoá localStorage nấc đã xoá trả về trạng thái ban đầu).

## ③ Một sự cố giữa chừng, đã tự sửa
Lượt đầu đặt comment JSX `{/* */}` ngay sau `return (` trước `<Tooltip>` → dev server báo `ModuleBuildError` (trang 500). Đã chuyển thành comment `//` phía trên `return`, tsc + trang xanh lại ngay. Ghi để phiên sau biết trang 500 lúc ~lượt này là do tôi, không phải bệnh `.next`.

## ④ Nợ ghi lại
- **Resize nấc `duyet` [320, 440]** — phiếu riêng (comment ⛳ tại `BE_RONG_NAC`).
- `nav` element đo `offsetHeight = 0` dù con render đầy đủ (quirk flex `min-h-0` có sẵn, không thuộc phiếu này — chỉ ghi nhận, chưa đào).

## ⑦b CHƯA CHẮC / CHƯA KIỂM + các chỗ mơ hồ đã tự quyết
1. **"Cá nhân" là mục MỚI trỏ `/settings/avatar`** — phiếu ghi "Cá nhân · Cài đặt → cụm cá nhân" nhưng model cũ không có mục Cá nhân. Tôi chọn thêm mục trỏ trang avatar THẬT thay vì (a) bỏ qua (thiếu so với chốt) hay (b) nút giả `chuaCoTrang` (thừa nợ). Nếu Hoà muốn "Cá nhân" là trang hồ sơ riêng sau này thì chỉ đổi `duong` một dòng.
2. **Khoá cụm giữ `duAn` thay vì `chang`** — khai lý do ở ①.1; nếu T muốn đúng chữ chốt thì đổi khoá là một lệnh rename an toàn (đã chứng minh không persist).
3. **52 chứ không 54/56** — suy từ token `--tap-lg` 44 + lề 4×2 có sẵn; chưa có nguồn nào chốt 56.
4. **Bề ngang khả dụng ở nấc 52 là 40px** (scrollbar thin 11px) ⇒ nút icon thực đo 32px, không phải 44px trọn như comment lý tưởng — không vỡ, không tràn, target ≥ WCAG 24×24; muốn ăn trọn 44 phải đổi sang `scrollbar-gutter`/overlay — đụng hành vi cuộn có sẵn, ngoài phạm vi.
5. **Chưa kiểm**: theme sáng (chỉ đo theme đang bật) · cảm ứng thật (`--tap` 44) · nấc `duyet` 320 trên browser (logic không đổi so với trước, chỉ hằng số giữ nguyên) · Safari/Firefox.
6. Marker giữ chuỗi `railHaiCum` dù rail là ba cụm — quyết định cố ý (định danh ≠ nhãn), có thể gây ngạc nhiên cho người grep theo nghĩa đen.

## ⑦c HẠN DÙNG
Kết luận đúng tại mốc `c7f3ac8` + tree dirty 20/08, dev server :3001 bản dev đang chạy. Con số 52 phụ thuộc `--tap-lg = 44px` (globals.css:110) — token đó đổi thì lý do chọn 52 phải tính lại. Chốt nguồn là `CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` (hiếm đổi, chỉ Hoà lật); nếu Hoà chốt lại Vitals/board EXS-D khác đi thì phần độ rộng phải đối chiếu lại.
