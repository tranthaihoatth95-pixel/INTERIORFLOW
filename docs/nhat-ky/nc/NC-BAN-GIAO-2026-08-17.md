# BÀN GIAO PHIÊN 17/08 — nghiên cứu · phép đo · cơ chế · và bản chưng cất 5 phiên

> Cùng khuôn với `NC-BAN-GIAO-NGHIEN-CUU-2026-08-16.md`. Viết để **phiên sau đọc là dùng được**,
> không phải lục lại chat. Mọi con số dưới đây là **đo tại nguồn trong ngày**, không trích sổ.

---

## 1 · NGUỒN NGOÀI ĐÃ TRA — kèm kết luận dùng được

| Nguồn | Kết luận rút ra |
|---|---|
| **Điều khoản Unsplash** (đọc lại từ chính `lib/stock-photos.ts:26`) | ⛔ **KHÔNG được tải ảnh Unsplash vào repo làm thư viện ship kèm** — họ cấm *"cache ảnh thành thư viện riêng"*. Đây là ràng buộc IF đã tự ghi từ 25/07 mà suýt bị phá hôm nay. |
| **Openverse API** (`api.openverse.org/v1/images`) | Chạy được, lọc `license=cc0` **có tác dụng**. ⚠️ **Kết quả KHÔNG kèm `width`/`height`** ⇒ lọc theo kích thước phải đo **sau khi tải**, không lọc được ở truy vấn. `result_count` **trần ở 240**, đừng dùng nó để so kho lớn nhỏ. |
| **Wikimedia Commons API** | Cú pháp đúng là `gsrsearch="<từ khoá> incategory:CC-Zero"` + `gsrnamespace=6` + `prop=imageinfo&iiprop=url\|size\|extmetadata`. Trả **ảnh gốc khổ lớn**, khác hẳn Openverse. |
| **Vỉa "(Unsplash)" trên Commons** | Ảnh Unsplash tải lên Commons **trước 6/2021** nằm dưới **CC0 thật** (thời Unsplash còn dùng CC0). Phát hành lại được. **Đây KHÔNG phải thứ điều khoản Unsplash cấm** — cấm là *gọi API của họ rồi cache*. Hai chuyện khác nhau, ghi rõ để phiên sau không tự trói. |

**Cạm bẫy hạ tầng đã trả giá:** `python3 urllib` trong môi trường này **chết vì SSL cert** (`CERTIFICATE_VERIFY_FAILED`); `curl` thì chạy. Mọi việc gọi mạng → dùng `curl`.
Và ảnh Commons 5–7 MB ⇒ `--max-time 40` **tải hụt 19/28 tệp mà vẫn ghi ra file** (sharp báo *premature end of JPEG*). Phải `--max-time 150 --retry 2`, và **luôn đo lại tệp sau khi tải**.

---

## 2 · PHÉP ĐO TỰ LÀM — dùng lại được

### a) Dải đen Home — bốn nấc × năm bộ × hai theme
Đo pixel trên **ảnh chụp thật**, không suy từ mã:

| Đo | Số |
|---|---|
| Nền màn khoá/Home dốc từ đỉnh xuống đáy | HSL L **0,049 → 0,159** (khớp trọn dải khai `night [0,05…0,17]`) |
| Card `--panel` **đo thật trên ảnh** | **0,110** |
| Token `--panel` `#141417` | 0,084 — **chênh vì card là lớp bán trong suốt đè lên nền** |

🔴 **Gốc bệnh: dải sáng của nền ÔM TRỌN độ sáng card.** Nửa trên nền tối hơn card ⇒ lỗ đen; nửa dưới sáng hơn ⇒ card chìm.
Ma trận đầy đủ (theme tối): `night` **5/5 bộ cắt ngang** · `dusk` 4/5 · `dawn` 3/5 · `day` 2/5. Theme sáng: chỉ `day` cắt (5/5).

> **LUẬT ĐỀ XUẤT (chờ Hoà duyệt):** *nền phải nằm TRỌN một phía so với card — tối hơn ở MỌI điểm hoặc sáng hơn ở MỌI điểm.* Đo được ⇒ **viết thành test được**.
> ⚠️ Chưa giải: card **kính** (`backdrop-filter`) thì "độ sáng của card" không còn là một con số — phải chốt cách đo trước khi thành test.

**Vì sao vòng sửa 16/08 không bắt được:** bảng neo độ sáng được cân **so với chữ trên pill kính**, chưa bao giờ cân **so với card**. Đo đúng cặp mới thấy.

### b) Kho ảnh CC0 cho nội thất — mỏng hơn mọi dự đoán
116 ảnh CC0 tải về từ Openverse → **5** đủ khổ ngang ≥1900px → **1** thật sự dùng được.
Nút thắt **không phải giấy phép** mà là **độ phân giải nhà cung cấp phục vụ**: rawpixel trả `editor_1024`, stocksnap trả `960w`. Chỉ **Wikimedia và Flickr** cho ảnh gốc lớn.

### c) Vật liệu — hai con số định hướng việc kế
- `lib/cad/materials.ts`: **0/14** preset khai `matId` ⇒ mặt 2D gạch `–` **toàn kho**.
- `/api/specs`: **0/10** bản ghi có `priceVnd` là **số**. Thứ bảng đang hiện là `priceNote` (*"≈ 3.200.000đ (tham khảo)"* — **chữ**). ⇒ chỉ báo `Giá !` **nói đúng**, và nó lộ ra bảng lâu nay hiện một con số trông như giá thật.

### d) Ô nhiễm worktree — ba quy ước cùng tồn tại
| Đường | Thực trạng |
|---|---|
| `.worktrees/` | **rỗng, mồ côi** — git không quản lý, nhưng `.gitignore:60` chặn nó và `.claude/launch.json` vẫn trỏ `.worktrees/p3-mock` (không tồn tại) |
| `.claude/worktrees/` | **1,5 GB, 2 worktree thật** — đây mới là đường Claude Code dùng |
| `interiorflow-wt-{nhánh}` (`CLAUDE.md:14`) | **chưa từng được dùng lần nào** |

🔴 **Ba quy ước cho một thứ ⇒ ba máy quét nhầm cây trong một ngày**: `package.json` (vá 16/08) · `soi-that.mjs` · `check-chot.mjs`. Hai máy sau **vẫn in xanh** trong khi 100% và 50% thứ chúng soi là bản sao cũ.
⇒ **Việc phải làm:** chốt MỘT đường duy nhất, sửa `CLAUDE.md` + `launch.json` cho khớp, và **loại trừ theo *"tên thư mục chứa chữ `worktrees`"*, không so chuỗi cứng.**

---

## 3 · CƠ CHẾ ĐÃ DỰNG TRONG PHIÊN

| Cơ chế | Ở đâu | Giải bài gì |
|---|---|---|
| **Hợp đồng cấu trúc chung** | `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` | Thi hành ràng buộc Hoà đặt 17/08: *các mảnh chéo nhau phải build đồng bộ, không build riêng lẻ chéo ngược*. Hai phiên thi công song song **đọc chung một nguồn**, vùng tệp rời nhau. |
| **`npm run soi:that`** | `scripts/soi-that.mjs` | Máy đối chiếu **văn bản ↔ code** đã có từ 08/08 nhưng **không có lối chạy** nên ngủ 9 ngày. Nay: vá đường quét, nối `package.json`, nới 68 spec → **503 văn bản sống**, thêm 2 chiều **mảng CÂM** + **khái niệm MA**. |
| **`npm run tsc`** | `package.json` | Cửa được trích dẫn nhiều nhất toàn sổ mà **không có lối npm và không nằm trong `npm test`**. Nay có cả hai. |
| **Vá `check-chot.mjs`** | `scripts/check-chot.mjs` | Nó **chạy trong `npm test`** mà đọc 50% là bản sao worktree. |
| **Đóng dấu mã chết** | `components/LoginScreen.tsx` | Tệp 0 nơi import nhưng có 3 commit gần đây ⇒ **đọc ra như đang sống**, đã bẫy trọn một phiếu. |

---

## 4 · LỖI CỦA T TRONG PHIÊN — kèm gốc rễ

| Lỗi | Gốc rễ | Ai bắt |
|---|---|---|
| Phiếu P-S: *"chưa có máy đối chiếu sổ↔code"* | **Không kiểm kho máy sẵn có.** `soi-that.mjs` làm đúng việc đó từ 08/08 | agent |
| Phiếu P-U trỏ vào **mã chết** | **Nhìn ngày commit thay vì đếm nơi import.** 3 commit gần đây đều là quét đổi tên hàng loạt | agent |
| **Ghi đè mất ảnh `02-04-vat-lieu.png` trên Drive** | **Đo ở bản chiếu, không đo ở nguồn** — tưởng `/materials` công khai vì *pane trình duyệt đang có phiên*; playwright sạch phiên ra **HTTP 401** | T tự phát hiện sau khi đã hỏng |

⭐ **Nhận xét đắt nhất:** phiếu đi bắt *"code có mà sổ không biết"* **tự nó là một ca của đúng vế ấy**.

---

## 5 · SOI 5 PHIÊN GẦN NHẤT — chưng cất mô hình làm việc

### Số thô (git, đo tại nguồn)

| Ngày | commit | tệp đổi | +dòng | báo cáo | lỗi T ghi nhận |
|---|---|---|---|---|---|
| 13/08 | 47 | 277 | 13.063 | 18 | — |
| 14/08 | **68** | 297 | **65.445** | 18 | — |
| 15/08 | **17** | **77** | 4.693 | 4 | 0 |
| 16/08 | 62 | **320** | 20.806 | 17 | **9** |
| 17/08 | ~11 | 106 | 15.784 | 5 | **2** (+1 tự gây) |

### 🔴 Đọc số này SAI cách là ra kết luận ngược
**Sản lượng KHÔNG phải hiệu suất.** 65.445 dòng của 14/08 phần lớn là **quét đổi tên hàng loạt** (radius 107 tệp, font). Lấy dòng-code làm thước thì ngày dọn dẹp thắng ngày nghĩ ra cơ chế — trong khi 15/08 chỉ 17 commit lại là ngày **nạp ô ⓪ / ⑦b / ⑦c**, thứ về sau chặn được hai phiếu sai.

### Ba tương quan rút ra

**① T càng build, T càng sai.** 16/08 — ngày T vừa build vừa điều phối — **9 lỗi**, cao nhất. 17/08 T chuyển hẳn sang điều phối: **2 lỗi**, và **cả hai bị chặn TRƯỚC khi agent viết dòng nào**.

**② Cơ chế phòng ngừa sinh lời gấp nhiều lần cơ chế phát hiện.**
- 16/08: 9 lỗi, **bắt SAU khi đã làm** ⇒ phải sửa lại.
- 17/08: 2/8 phiếu **bác ở ô ⓪** ⇒ mất ~11 phút agent, **0 dòng code sai**.
Cùng tỷ lệ sai, khác hẳn cái giá.

**③ Máy soi bắt được 0 lỗi của T, suốt cả 5 phiên.** 11 lỗi cộng dồn: **agent bắt 11, máy bắt 0**. Vì **không máy nào nhìn vào phiếu** — máy canh code, canh nhãn, canh registry; cái phiếu là điểm duy nhất trong dây chuyền **không có cửa kiểm**.

### Phân loại 11 lỗi → đường diệt

| Loại | Ví dụ | Máy bắt được? |
|---|---|---|
| **Lỗi ĐO** | mã chết · "chưa có máy" · đếm 9 mock thay 106 · sai địa chỉ hằng số · mã điều khoản sai 12 chỗ · dẫn NT-8 thay NT-10 · sai trục sketch/pro | ✅ **8/11** |
| **Lỗi NGHĨ** | sai lý do `<button disabled>` · xếp nhầm từ đa nghĩa · mượn luật ngành sai bản chất | ❌ **3/11** |

> **73% lỗi của T là lỗi ĐO, không phải lỗi NGHĨ.** ⇒ **Máy phát phiếu diệt trọn một LỚP**, không phải diệt từng ca.
> **27% còn lại tuyệt đối không được tự động hoá** — đó đúng là phần agent bác lại T.

### ⇒ MÔ HÌNH CHƯNG CẤT (đề xuất thành chuẩn)

1. **T không build, T không quét.** T ra đề, phán, và kiểm chứng bằng **sự bất hợp lý trong logic** — không bằng đo tay.
2. **Tiền đề của phiếu do MÁY viết từ số đo**, không phải người viết từ trí nhớ. Máy đính sẵn: tệp còn sống không *(đếm nơi import)* · ký hiệu có thật không · bao nhiêu nơi gọi · mã điều khoản trích có khớp `TRIET-LY-IF.md` không · **máy nào đã làm việc này rồi**.
3. **Trọng tài máy đứng TRONG vòng** — giao *đích + trần vòng*, agent tự đóng vòng; T chỉ soi cái đã sạch.
4. **Mảnh chéo nhau ⇒ một hợp đồng cấu trúc chung TRƯỚC, rồi thi công song song** trên vùng tệp rời nhau.
5. **Quyền agent bác T là bất khả xâm phạm.** Nó bắt 11/11.
6. **Thước đo phiên KHÔNG phải sản lượng mà là CÔNG CỐC** — bao nhiêu việc phải làm lại, bao nhiêu phiếu sai lọt qua ô ⓪.

### ⚠️ Điều mô hình này KHÔNG giải
Nút thắt lớn nhất vẫn là **71 xong-máy đối 1 qua mắt**. Sai sót tốn phút; chỗ này tốn cả dự án.
Đòn bẩy mạnh nhất tìm được hôm nay **không phải một máy** mà là **một tấm ảnh**: gom 23 màn vào một hình, Hoà nhìn **một lần** ra **ba finding** trong vài phút (`40-01` · `02-05` · màn khoá). **Xếp cả bộ cạnh nhau thì lệch cấu trúc nổi lên trong một cái liếc; xem từng màn thì màn nào cũng hợp lý.**

---

## 6 · CÒN NỢ — phiên sau nhận nguyên trạng

**Đang chạy nền khi bàn giao:** V1 vỏ điều hướng · V2 Files hai ngăn & Thư viện kệ · Đ1 đo engine theo 7 mảnh.
**Đã về:** Đ2 → `docs/nc/SOI-10-PHIEN-IDF-2026-08-17.md`.

**Chờ Hoà:** ① duyệt mắt (71 đối 1) ② màu **mòng két ↔ mận** — *cấm thi công gì dính `--accent*`* ③ vị trí *Tổng quan* & *Sổ tay* trên rail ④ duyệt **luật nền-trọn-một-phía** ⑤ **chọn ảnh CC0** từ bảng 28 ứng viên ⑥ chạy tay: xoá 2 worktree rác + chụp lại `02-04-vat-lieu.png`.

**Việc đã rõ, chưa làm:** máy phát phiếu · gán `matId` cho 14 preset 2D · gỡ `#c79a63` khỏi `components/entry/` · **chốt một quy ước đường worktree** · thang chiều cao khối · 16 dòng ❌ mới của `soi:that`.
