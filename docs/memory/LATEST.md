# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN**, rồi **`docs/IF-KIEN-TRUC.md`** (bản đồ — mới lập 16/08, thay bản mồ côi).
> Luật giữ bản nén: **CHỈ tên + đường dẫn + một câu. Cấm chép nội dung.**

**Cập nhật lần cuối: 2026-08-16 (đợt giao diện #2 + lập bản đồ kiến trúc)**

## ⭐ Việc lớn nhất phiên: PHÁT HIỆN BẢN ĐỒ MỒ CÔI
`IF-ARCHITECTURE-COMPASS.md` sửa cuối 29/07, **19 ngày không phiên nào đọc** — `CLAUDE.md` trỏ vào
tên cũ đã thành mẩu cụt 774 byte. ⇒ Lập **`docs/IF-KIEN-TRUC.md`** (cốt lõi 11 mục không tách +
cập nhật theo `docs/memory/sessions/<ngày>/`), nối lại con trỏ, đóng dấu lỗi thời bản cũ.
**Bài học:** nén ngữ cảnh + lưu chi tiết đều là cơ chế cho **nhật ký**; thứ thiếu suốt là **QUAN HỆ**,
và bản đồ **không nén ra được từ nhật ký**.

## Chốt lớn của Hoà trong phiên (nguyên văn ở `00-CHOT` ngày 16/08)
Kiến trúc **canvas + cửa sổ công cụ** (canvas=sơ đồ · cửa sổ=xưởng · chặng=khung nhìn · sidebar=bản đồ) ·
**sidebar là router toàn app**, một trục **hai cụm** · **Files là phần thô** (bỏ nghĩa *chợ đầu mối*) ·
**màu là bước chọn vật liệu**, không có "thư viện vật liệu" riêng · **ba nấc = ba công năng**, nấc to
là **mặt nhìn** · **đồng bộ = không tách ra ngay từ đầu** · **dock neo theo ngữ cảnh** · 5 bộ hình nền
động sinh bằng mã · dashboard là cửa vào.

## Code đã ship (3 commit: `0471b54` · `544999f` · `45e79a2`)
`Tooltip` prop `hinh` + `lib/ui/thao-tac-glyph.tsx` · `ToolbarChip` bỏ `title` → `aria-disabled` ·
`lib/ui/tien-trinh.ts` + `LightBar` (**bịa % là tsc đỏ**) · `components/nodes/HopCongCuBamVat.tsx` +
`CuaSoCongCu.tsx` (`NodeToolbar` thật, nhiều cụm cùng lúc) · `soi:tu-dien` hết mù `.md` ·
`--mat-*`→`--nen-mo-*` (114 dòng/43 tệp) · `--nen-mo-hairline`→`--vien-mo` (573/93) · token `--mo-vo-hieu`.

## Bản vẽ chờ mắt Hoà — Claude Design, project `b7dc14ba-1752-4821-8fc7-d519f737ac09`
`mock-o-giai-nghia` · `mock-thanh-tien-trinh` · `mock-ban-thu-2-huong-mau` · `mock-chu-ky-va-bieu-tuong-tep` ·
`mock-kich-ban-sidebar` (🔴 **phải dựng lại** — dựng trên danh sách stage cũ) · `mock-5-bo-hinh-nen` ·
`mock-widget-viec-dang-do`.

## Nghiên cứu mới sinh
`docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` (8 từ, Hoà duyệt 9 dòng đỏ) · `NC-DIEU-HUONG-APP-TUONG-TU`
(10 app, 6 ranh giới) · `NC-CAD-REVIT-MOT-APP` (**được** — vướng đúng 3 dây chưa nối) ·
`NC-SOI-3-CHANG` ("3 chặng như 3 app" nay có số: khớp ổ 3/7 · chia sẻ code 5,7%).

## ⛔ VIỆC ĐỨNG ĐẦU HÀNG — không phải giao diện
1. **Máy đối chiếu SỔ ↔ CODE** — thứ duy nhất bắt được `master tool` · `KB-5` · `.idfnotes`.
   Quét riêng từng bên thì mỗi bên đều nhất quán. **Bản đồ vừa lập do chính T viết ⇒ không có máy
   canh thì nó mốc y bản trước.**
2. **Nối vật liệu ba mảnh** — `lib/materials`↔`ProductSpec` = **0 code**, đo 07/08 và 16/08 không đổi.
   Hoà gọi đây là *phần đẹp nhất của IF*.
3. Ba việc từ soi 3 chặng: phím tắt hiện đủ 3 chặng → **gói 22 lệnh thanh 2D** (tầng ② còn trống,
   giết ca **49% thanh nằm ngoài màn**) → trả 4 chỗ cắm Trình chiếu về ổ chung.

## ⛔ CHỜ HOÀ
① duyệt mắt 6 bản vẽ ② chọn màu **mòng két ↔ mận** ③ xác nhận **Files có ngăn riêng cho phần thô
dùng chung?** (sai thì cả nhánh Files vẽ lại) ④ *Tổng quan dự án* và *Sổ tay* đứng đâu ⑤ nợ nghiệm
thu mắt **70 xong-máy đối 1 qua mắt**.

## Lỗi của T trong phiên — 9 lỗi, **agent bắt cả 9**, máy soi bắt 0
mã `[Đ1]`↔`[Đ2]` sai diện rộng · dẫn NT-8 thay NT-10 · sai lý do `<button disabled>` · xếp nhầm
`module` · số dòng `:69` thay `:70` (ngay trong dòng ban luật cấm nhớ hộ) · gán `[N1]` cho *người
quyết cuối* (thật ra `[T5]`) · **đo sketch/pro sai TRỤC** (`isPro` chứ không `cadMode`) · lấy số tệp
đã đẩy Design System (9) làm số tệp thư mục (106) · mượn luật ngành cho thứ khác bản chất.
⇒ **Ô ⓪ TIỀN ĐỀ + quyền agent bác T là cơ chế sinh lời đậm nhất — giữ bằng mọi giá.**

## Dọn dẹp còn nợ
3 worktree rác `.claude/worktrees/agent-*` (đã merged, lệnh xoá bị classifier chặn — Hoà chạy tay).

---

# 2026-08-17 — bổ sung cuối phiên

## Xong hôm nay
`4e967f2` — **4 lỗi Home Hoà soi từ ẢNH CHỤP THẬT** (lần đầu lô duyệt-mắt sinh finding):
lời chào `hoa`→`Hoa` + nút sửa tên · số ô **01→07 liền mạch** (bỏ gán cứng, 256 ca test) ·
thừa trống trong ô `50,3→34,5%` · `37,2→~2%` · `65,2→~0%` · thẻ dự án phân biệt được ·
`--t4/--t5`→`--t3` ở `WidgetCard` (một chỗ ăn cho **cả 10 widget**, 1,98→7,24).
**Máy chụp màn** hết bỏ khung: **24 ảnh, 0 bỏ** (trước 17, thiếu hẳn ba chặng).

## 🔴 CÒN LẠI — đọc trước khi làm tiếp
1. **Dải đen trên/dưới Home.** Sửa thừa-trống-trong-ô xong thì lưới co lại và **trôi giữa nền đen** —
   đổi *trống trong ô* lấy *trống quanh lưới*. Gốc: lưới trả phần dư **cho hình nền** (chốt A2)
   nhưng **hình nền CHƯA nối vào Home**. ⇒ hai đường: **nối 5 bộ hình nền đã dựng** (T nghiêng
   đường này) hoặc cho lưới cao trở lại.
2. **Design system CHƯA CÓ THANG CHIỀU CAO KHỐI.** Đo phần sửa: 0 hex cứng, bo đúng thang, màu/cỡ
   chữ/khoảng cách đều token — nhưng **chiều cao lưới là số gõ tay** (`279/220/112/97px`), và đó
   **chính là gốc của dải đen**. Đáng thêm vào bộ nền, cùng họ thang bo + thang mật độ.
3. **Tên hiển thị lưu localStorage** — đổi máy là mất. Bản bền cần cột DB + màn Cài đặt.
4. **24 ảnh mới đã lên Drive** `IF-duyet-mat/01-anh` — gồm **ba chặng lần đầu chụp được**.
   Hoà chưa soi 2D/3D/Trình chiếu.

## Nhắc lại thứ tự đã chốt (chưa đụng)
① **máy đối chiếu sổ ↔ code** ② **nối vật liệu ba mảnh** (`lib/materials`↔`ProductSpec` = 0 code,
đứng yên 9 ngày) ③ ba việc từ soi 3 chặng ④ dựng lại **4 kịch bản sidebar** theo cấu trúc hai cụm.
