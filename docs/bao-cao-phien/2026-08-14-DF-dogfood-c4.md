# BÁO CÁO PHIÊN · DF — Dogfood C4 end-to-end (PDF→deck→✨→inpaint→nhận ảnh→PDF)

**Phiếu:** `docs/phieu-giao/demo-df-dogfood-c4.md` · **Ngày:** 14/08/2026 · **Vai:** DF (dogfood browser, server 3000 sẵn có — không mở server mới, không nhập mật khẩu, không sửa code)

## ① Vòng tròn đã chạy ĐẾN ĐÂU — từng bước máy/tay [T0]

| Bước | Máy/Người | Kết quả |
|---|---|---|
| Tạo deck "DF2-C4" (không đụng "Hồ sơ 1" / node cũ của flow) | DF thao tác app | ✅ tab sheet mới + đổi tên + "Tạo hồ sơ trống" |
| Nhập PDF Westlake FULL (477 trang) chọn trang `15-22` | máy (unpdf) + prompt trang | ✅ 8 slide, lớp chữ SỐNG (panel Lớp: "MỞ RỘNG BẾP", "VÁCH KÍNH DI ĐỘNG"…), 21 ảnh vào kho `/api/library` tag `pdf-import` — DF2-F1 (deck >1GB) ĐÃ VÁ THẬT: deck JSON nhỏ, ảnh ngoài deck |
| Phát hiện trang 15-22 KHÔNG có render bếp (số "~tr.16" trong sổ dựa giả định 47 trang; file thật 477) | DF scan text PDF bằng unpdf ngoài app | ✅ render C4 bán hàng = tr.293-294 (lưới) + **tr.295-299 (khách bếp ăn khổ lớn)** + 300-301 (vách ngăn bếp) |
| Nhập bổ sung `293-301` | máy | 🔴 **TREO TAB 6+ phút** (DF2-F3/F4 dưới) — reload mất 2 lần; rút xuống `293-294` thì ✅ 2 slide, 19 asset |
| Chọn ảnh bếp (tr.294, 849×600) → **"Chỉnh phối cảnh ✨"** | người bấm (DF) | ✅ nhảy chặng 2, cặp node Nhập ảnh→Render bám ý gieo sẵn + select (đúng D2) |
| Mask | DF: thử `ai.idmask` 6 nấc pick (tầng lõi tất định, 0 fal) → cụm màu không ra object → chuyển `util.maskpainter` vẽ mask đảo bếp bằng canvas (khai: vẽ tay bằng máy) | ✅ mask cứng mặt đảo + thân đảo |
| Phiếu 4 cấp | DF điền theo checklist C4-1/C4-2/C4-6, flag `verified`, nguồn ghi rõ → chọn "Đã duyệt phiếu" [T5] | ✅ node chặn đúng khi chưa duyệt |
| Inpaint (FLUX Fill, aiTier=3 fal) | máy | ✅ 3 job: #1 mặt đảo→đá vân xám khói đậm ĂN · #2 thân đảo→gỗ (prompt kèm mệnh đề "GIỮ…") KHÔNG ăn · #3 prompt vật liệu thuần → thân đảo nan óc chó ĂN ĐẸP. Đèn ray GIỮ cả 3 lần ✓ |
| Về Trình chiếu → **"Nhận ảnh đã chỉnh"** | người bấm (DF) | ✅ nút tự hiện đúng điều kiện (node done + output≠src); bấm → ảnh thay ĐÚNG khung, thumbnail cùng đổi (sửa-1-lần-đổi-mọi-nơi chạy thật) |
| **Xuất PDF** | người bấm | ✅ "Hồ sơ 2.pdf" 11 trang; trang 11 có ảnh bếp bản chỉnh đúng vị trí — **VÒNG TRÒN ĐÓNG** |

**Số job fal: 3 billed** (+1 request fail validation trước khi chạy — file_download_error, không compute). Trần 4 ✓.

## ② Findings — VÀNG của dogfood (DF2-F3 → F10)

- **DF2-F3 🔴 `/api/library` POST 500 = `RangeError: Maximum call stack size exceeded`** (stack trỏ `app/api/library/route.ts` POST, 19 lần trong log server) với ảnh nhúng lớn (trang render ~12-50MB). Hệ quả: lib fallback dataURL đúng thiết kế nhưng mở cửa cho F4.
- **DF2-F4 🔴 Nhập trang render khổ lớn treo chết tab**: encode PNG lossless + fallback dataURL (12-20MB×n) trên main thread + autosave IDB ghi 190MB lặp → renderer đơ 6+ phút, phải reload; **slide vừa nhập MẤT sau reload** (11→9, một lượt hydrate muộn đè state mới — mất dữ liệu người dùng thật).
- **DF2-F5 🔴 linkedAssets mồ côi 190MB**: slide mất nhưng registry deck vẫn ôm dataURL → MỖI autosave của Present ghi 190→250MB IndexedDB (log `[present-sheets] IDB ghi 190181.0 KB` lặp). Deck DF2-C4 hiện vẫn ôm nợ này — cần lệnh dọn asset mồ côi (đề xuất phiếu lib/present-editor; Hoà có thể xoá sheet DF2-C4 sau demo cho nhẹ).
- **DF2-F6 🟠 ✨ gieo node với src = URL local `/api/library/...`** → fal trả `file_download_error` (cloud không tải được localhost). DF phải tự đổi input sang dataURL mới chạy được. Gap liên chặng của đường D2: cần dataURL-hoá (hoặc upload fal storage) trước khi job.
- **DF2-F7 🟠 Công thức prompt làn máy**: prompt kèm mệnh đề "GIỮ đèn ray, giữ ghế…" → inpaint gần như không đổi (job #2); bỏ hết mệnh đề GIỮ, chỉ tả vật liệu đích (job #3, cùng mask/keep) → ăn ngay. Bài học: **mask cứng lo phần giữ, prompt chỉ tả phần đổi** — nên nạp vào sổ công thức F2/làn máy + placeholder ô "Áp gì vào mảng này".
- **DF2-F8 🟡 Tên file xuất** = tên deck nội bộ "Hồ sơ 2.pdf", không theo tên sheet người dùng đã đổi ("DF2-C4").
- **DF2-F9 🟠 PDF xuất nướng phẳng**: mỗi trang = 1 JPEG (11 JPEG/11 trang, soi ruột file) — lớp chữ sống của deck không thành text trong PDF (không search/sửa được; đối chiếu CHUAN-DAU-RA-NGHE mục "chữ sửa được").
- **DF2-F10 🟡 Trích ảnh PDF**: import 15-22 báo "11 ảnh nhúng không trích được" + pdf.js warning `TT: undefined function: 21`; trang 21 không có ảnh nào vào kho. Số liệu browser (31 asset/66 element) ≠ Node-run của DP (16/41) — engine hai môi trường ra hai kết quả.
- **idmask tier 2 âm thầm rơi tầng lõi**: aiTier=2 định tuyến ComfyUI, `/api/health` khai `comfyui:true` nhưng workflow removeBg không có → catch im lặng, chạy median-cut (badge tier CÓ ghi, nhưng người dùng không biết VÌ SAO BiRefNet không chạy). Mask cụm màu không dùng được cho mảng object — đúng chỗ SAM2/RegionId của spec Grounded còn thiếu.
- **(tooling pane, không phải app)**: click chuột thật của Browser pane không tới page (phải dispatch JS event); screenshot pane không lưu ra file được — bằng chứng chuyển sang file ảnh/PDF tải về scratchpad.

## ③ Bằng chứng (scratchpad phiên DF `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/b779779b-.../scratchpad/`)

- `DF2-C4-out.pdf` — PDF xuất 11 trang (GIÁ TRỊ CUỐI, mở trang 11 soi ảnh bếp đã thay)
- `df2c4/bep-truoc.png` (ảnh bếp gốc 849×600) · `df2c4/bep-sau.jpg` (job#1 đá mặt đảo) · `df2c4/bep-sau2.jpg` (job#2 không ăn — đối chứng F7) · `df2c4/bep-sau3.jpg` (job#3 CUỐI: đá + nan óc chó)
- `df2c4/idmap-6vung.png` (median-cut 6 vùng — minh chứng mask cụm màu không ra object)
- `df2c4/pdfimgs/img10_536609.jpg` (trang 11 trích từ PDF xuất)

## ④ Trạng thái để lại + khai thật

- Deck **DF2-C4** (11 slide) nằm cạnh "Hồ sơ 1" (không đụng); flow "Untitled flow" chặng 2 có thêm 3 node của DF (cặp ✨ gieo + idmask + maskpainter) — node cũ của Hoà nguyên vẹn. 2 symlink tạm trong `public/` đã xoá, working tree sạch (2 file `__lincoln*` trong public là của phiên khác, không đụng).
- Nhập file vào app: pane không lái được hộp thoại chọn tệp native → DF bơm file qua chính input `onGatewayFile` bằng DataTransfer + fetch từ symlink tạm (đường đi của app giữ nguyên 100%, prompt trang thật đã hiện "477 trang" và nhận `15-22`).
- Checklist mục 1 (phòng khách C4-3) · 4 (vệ sinh) · 5 (pass bộ) · 6 (closet ẩn): CHƯA làm — hết trần job + đúng phạm vi phiên proof; mục 2/3/7 đã tick kèm ghi chú phạm vi trong file checklist.
- Đề xuất kế tiếp cho T: ① vá F3 (RangeError route library) + F4/F5 (worker encode + dọn asset mồ côi) rồi mới nhập nổi trang render khổ lớn 295-299 — điều kiện để áp C4-1 trên ảnh gốc nét cao; ② F6 dataURL-hoá trong `seedPerspectiveEdit`; ③ nạp bài học F7 vào placeholder/công thức làn máy.
