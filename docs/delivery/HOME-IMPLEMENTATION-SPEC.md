# HOME · BÀN GIAO THI CÔNG

> Đi kèm `DESIGN-LOCK-HOME.md` (bản khoá) và 3 bản vẽ `docs/mocks/mock-home-lock-*.html`.
> **Bản vẽ là hợp đồng giao diện** — port, không diễn dịch lại bằng mắt.
> Mọi số liệu dưới đây **đo tại nguồn 04/09**, không chép từ sổ.

---

## 1 · TÁI DÙNG CÁI GÌ — đo tại nguồn, đừng nhớ hộ

| Cần | Đã có | Hành động |
|---|---|---|
| Route Home | `app/page.tsx:14` → `components/home/HomeScreen.tsx` | **EXTEND** — giữ route, đổi thân |
| Thân Home hiện tại | `components/home/DongStudioHome.tsx` · `components/home/widgets/` | ⚠️ Bố cục bento **SUPERSEDED** (D-DR2 + N-10). **Giữ NĂNG LỰC, bỏ BỐ CỤC.** NO-REBUILD §B25 bảo vệ năng lực/hợp đồng/dữ liệu, **không** bảo vệ bố cục lỗi thời |
| Nền ảnh (Wallgallery) | `lib/wallpaper/sets.ts` (272 dòng, **5 bộ**) · `prefs.ts:19` mặc định `bat:true` · `SystemWallpaper` đã mount `DongStudioHome.tsx:543` | **REUSE** — đổi từ nền toàn màn sang **dải có biên** + `mask-image` tan đáy |
| Cung sáng / tiến trình | `components/ui/LightArc.tsx` (110 dòng) · `lib/ui/tien-trinh.ts` + `LightBar` | **REUSE**. `tien-trinh` là union phân biệt: **nhánh không-đo-được KHÔNG có `pct`** ⇒ bịa số là `tsc` đỏ. Dùng đúng nó cho thanh ở chân hiện vật |
| Việc đang dở | `lib/resume.ts:98` `loadResume()` · `lib/shell/last-stage.ts:34` `getLastStage()` | **REUSE**, chỉ đọc. ⛔ `lib/resume.ts` do lane khác giữ — **không sửa** |
| Gom dữ liệu Home | `lib/home/aggregate.ts` — `pickRecentProjects` `buildStageCounts` `groupUpcoming` `countTasksDueToday` | **REUSE** — đây là nguồn cho bậc `NỀN` và `KHI GỌI` |
| Chọn theo tuần | `lib/home/weekly-picks.ts` `pickWeeklyItem/pickWeeklyImages` | **REUSE** cho ảnh dải môi trường |
| Ghi chú · lời chào · giờ | `lib/home/notes-store.ts` · `greeting.ts` · `time-of-day.ts` | **REUSE** — `time-of-day` nuôi LightClock |
| Khẩu độ Vitals | ⚠️ `components/vitals/VitalsRightEdgeHost.tsx` **KHÔNG tồn tại** trong cây này | Home chỉ **chừa chỗ** ở mép trên đúng bản vẽ. Khẩu độ thật là việc của lane Vitals (D-DR1) |
| `WidgetCard` | ⚠️ `components/ui/WidgetCard.tsx` **KHÔNG tồn tại** trong cây này | Không giả định. Kệ widget ở bậc `KHI GỌI` dựng theo bản vẽ (`.o-w`, cỡ ô 1×1 / 2×1) |

**Cấm đẻ token mới.** `_home-lock-nen.css` chép nguyên văn từ `app/globals.css`; lúc thi công thì
**dùng thẳng token của app**, xoá khối chép. Bảng `--canh-*` · `--nen-sang` · `--muc` là **màu của
NỘI DUNG**, cố ý không theo theme — nếu app chưa có thì thêm cạnh khối `--illus-*` sẵn có.

---

## 2 · DỮ LIỆU — cái gì THẬT, cái gì DEMO

| Chỗ | Nguồn thật | Trạng thái trong bản vẽ |
|---|---|---|
| Bậc 1 · việc đang dở | `loadResume()` + `getLastStage()` + bản ghi vật đang mở | **DEMO** (bảng vật liệu Thảo Điền) |
| Số m² trong bảng vật liệu | **chỉ từ khối đo được** — luật BOQ 15/08 | **DEMO**, nhưng cột *"đo từ khối 3D"* / *"chưa đo được"* là **hợp đồng thật**: thiếu số thì hiện `—`, cấm ước tính |
| Bậc 2 · kề bên | `pickRecentProjects` + vật gần đây | **DEMO** |
| Bậc 3 · nền | hàng đợi render · `groupUpcoming` · `lib/review` (lỗi chuẩn) | **DEMO** |
| Bậc 4 · đếm | phần dư của cùng truy vấn | **DEMO** |
| Dải ngữ cảnh | thẻ DNA · nhật ký quyết định · dây phụ thuộc | **DEMO** — chưa có model quyết định nối sẵn |
| Kho của xưởng (khung rỗng) | đếm thật từ Thư viện | **DEMO** (248 · 12 · 12 · 6) |
| Widget | `lib/home/aggregate.ts` | **DEMO** |

⚠️ **Mọi khung đều đeo nhãn `demo · dữ liệu mẫu` ở mép trên** (§28). Nhãn đó **chỉ được gỡ khi
dữ liệu đã thật**, và gỡ là một thay đổi phải nêu trong báo cáo.

---

## 3 · THỨ TỰ THI CÔNG

1. **Khung + thang rỗng** — rail · mép trên (chừa chỗ khẩu độ) · sân · thang 4 bậc, **chưa nối
   dữ liệu**. Cửa: hình học khớp bản vẽ ở 1600×900 và 1280×800, hai nền.
2. **Bậc 1 · hiện vật + chân có số thật** — nối `loadResume`. Cửa: **luật PASS** (§5).
3. **Thang nối dữ liệu thật** — bậc 2/3/4 từ `aggregate.ts`. Cửa: 0 · 1 · 7 · 15 dự án đều không
   vỡ; thứ tụt bậc **được đếm**, không biến mất im lặng.
4. **Dải môi trường** — `wallpaper/sets` + `weekly-picks`, dải có biên + mask + hai nhãn scrim đặc.
   Cửa: **gỡ dải đi thì không chữ nào mất đọc**.
5. **Trạng thái rỗng** — `RESUME → BEGIN`. Cửa: vẫn ra studio đang sống, không phải Home-trừ-ảnh.
6. **Chuyển động** — theo §7 bản khoá. Cửa: `prefers-reduced-motion` bật thì **không vật nào di
   chuyển**, thang vẫn đổi bậc đúng.
7. **Tuỳ biến widget** — chọn · đặt · cỡ ô định sẵn 1×1 / 2×1 / 2×2, **cấm kéo giãn tự do**;
   kéo thả phải làm được **bằng bàn phím**.

Bước 1–2 là món nhỏ nhất chạy được đầu-cuối. Sai sớm rẻ hơn sai muộn.

---

## 4 · CHUẨN VI-TƯƠNG-TÁC — ba câu này là TRƯỢT, không phải nợ nhỏ

- một **phím tắt đã khai mà không mặt nào tiêu thụ** ⇒ TRƯỢT;
- một **nút tồn tại mà không có đường chạy thật** ⇒ TRƯỢT;
- một **công cụ bấm vào im lặng không làm gì** ⇒ TRƯỢT.

Mọi lối vào chính ở Home phải có đủ: mặc định · trỏ vào · đang nhấn · đang bật · đang chọn · vô
hiệu · **không khả dụng KÈM LÝ DO** (đi `aria-disabled` + `aria-describedby`, **KHÔNG** đi
`title` — `title` câm trên cảm ứng và Tab bỏ qua nút `disabled`) · đang tải · lỗi.
Kèm: con trỏ · ô giải nghĩa · phím tắt · Esc · Enter · Tab · hoàn tác.

⛔ Ba cờ đỏ đang sống trong app, **đừng nhân bản vào Home**: nút nói dối việc nó vừa làm · chữ
*"tự động"* trong giao diện · bịa phần trăm tiến trình.

---

## 5 · LUẬT PASS — ảnh tĩnh KHÔNG chứng minh được

> **THAO TÁC → GHI XUỐNG → ĐÓNG/TẢI LẠI → VÀO LẠI → CÙNG MỘT SỰ THẬT.**
> Thiếu một mắt là **không PASS**, dù mã chạy đúng lúc bấm.

Áp cụ thể cho Home: bày lại widget · ghim/bỏ ghim một vật · thu/mở panel · ảnh nền đã chọn — làm
xong, tải lại trang, phải y nguyên.

**Lưu ở đâu** (luật chung↔máy, 16/08): **VẬT** và **CẤU TRÚC VIỆC** → chung, ai cũng thấy ·
**CÁCH BÀY TRÊN MÀN CỦA TÔI** (nấc · cỡ kéo tay · panel thu/mở · bố cục widget) → **máy mình**.

---

## 6 · KIỂM TRƯỚC KHI KHAI XONG

`npm run tsc` · `npm test` · `node scripts/soi-ban-ve.mjs` (nếu còn sửa bản vẽ) ·
`npm run soi:hinh-hoc` · `npm run soi:tu-dien` · `npm run soi:thao-tac` · `npm run soi:frontier`.
Rồi **chạy app thật theo LUỒNG**, không chấm từng ảnh rời: mở app → Home → vào dự án → 2D → sửa →
3D → vật liệu → Trình chiếu → về Home. Chấm liên tục: định hướng · thứ bậc · dễ tìm thấy · liên
tục ngữ cảnh · phản hồi công cụ · tốc độ · phục hồi được.

⚠️ Đo lệnh cho đúng: `lệnh > /tmp/x 2>&1; echo "rc=$?"` — **cấm** `lệnh | tail; echo $?` (nó bắt
mã thoát của `tail`, đã một lần báo xanh giả).

---

## 7 · KHÔNG ĐƯỢC CHẠM — lane khác đang giữ

`lib/danh-tinh-phien*` · `lib/resume.ts` · `lib/sheets-persist.ts` · `components/cad/**` ·
`components/present-editor/**` · `electron/**` · `package.json` ·
`docs/ACTIVE-DESIGN-CONTEXT.md` · `docs/mocks/mock-home-ps-*` (bằng chứng vòng thăm dò, **cấm xoá**).

---

## 8 · NỢ BÀN GIAO

1. 🔴 `docs/ACTIVE-DESIGN-CONTEXT.md` ghi chặng ba là **"Trình bày"** (`:67` `:104` `:141`); code
   và từ điển máy đều là **"Trình chiếu"**. Một nhãn, người sở hữu tệp sửa.
2. Khẩu độ Vitals mép trên **chưa tồn tại** trong cây này — Home chỉ chừa chỗ. Nối khi lane Vitals
   xong (D-DR1).
3. Ngưỡng dưới của mặt nhìn bậc `KỀ BÊN` (**104×64**) chưa được mắt phán. Nếu quá nhỏ thì nới
   thang 400 → ~360 cho phần hình, không nới cả cột.
4. Ngữ pháp chuyển động §7 là **quy cách chưa chạy** — phải đo lại khi thi công.
