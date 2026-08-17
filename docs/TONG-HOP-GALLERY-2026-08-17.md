# TỔNG HỢP — GALLERY & BẢNG Ý TƯỞNG

> Theo khuôn Hoà chốt 17/08 (`TAC-NHAN-T.md §2⑥`): bàn xong thì ra bảng **đã có nền chưa · xịn hay
> dỏm · dỏm thì build lại**, rồi **mô tả giao diện + minh hoạ** để Hoà chốt → đưa Claude Design dựng.
> Mọi dòng dưới đây T **đã grep kiểm trong repo**, không chép từ sổ.

---

## §1 · BẢNG TÌNH TRẠNG

| # | Mảnh | Nền? | Xịn/dỏm | Kết luận |
|---|---|---|---|---|
| 1 | Màn Gallery + route `/library/gallery` | ✅ | **xịn** — đọc thẳng kho chung, không đẻ kho mới | dùng lại |
| 2 | Máy chưng cất `lib/distill/` | ✅ | **xịn** — chạy thật ở Thẻ DNA + Grounded Render | dùng lại |
| 3 | Máy học gu `lib/gu/` (perceptron theo cặp · từ điển đặc trưng · đồng bộ mô hình) | ✅ | **xịn** — cắm thật ở 4 nơi | dùng lại |
| 4 | Làm nét ảnh — node `ai.upscale` | ✅ | **xịn** — ESRGAN, đủ 300dpi | dùng lại |
| 5 | Thanh tiến trình `lib/ui/tien-trinh.ts` + `LightBar` | ✅ | **xịn** — có kiểu *không đo được*, cấm bịa % | dùng lại |
| 6 | Tìm ảnh `lib/ref-search.ts` | ✅ | **dỏm cho việc này** — tự khai *"lexical thuần, KHÔNG embedding, KHÔNG AI"*; lọc được theo chữ và màu, **không lọc được theo nội dung công trình** | **nâng cấp** |
| 7 | Phân loại `lib/refingest.ts` — 7 nhãn công dụng | ✅ | **xịn nhưng sai trục** — phân theo *dùng để làm gì*, không phải *đây là công trình gì* | giữ, thêm trục mới |
| 8 | Gallery ↔ máy chưng cất | ❌ | grep = **0** | **build — nối dây** |
| 9 | Tim ảnh | ❌ | grep = **0** | **build** |
| 10 | Bảng ý tưởng (gom ảnh, nhiều bảng) | ❌ | — | **build** |
| 11 | Núm mức bám per-mảng (Grounded Render) | ⚠️ | **dỏm** — code tự khai *"truyền mù là giả điều khiển"* | **build lại** |
| 12 | Chiếu khối ra vùng (sàn/vách/trần từ scene IF) | ❌ | — | **build — KHÔNG cần model thị giác** |
| 13 | Đo độ sâu từ ảnh ngoài | ❌ | — | hoãn — cần backbone thị giác |
| 14 | Nguồn ngoài (Unsplash · ArchDaily · OfficeSnapshots) | ❌ | — | **build, nhưng xem §3 giấy phép** |

**Đọc bảng**: 5 mảnh xịn dùng lại · 2 mảnh cần nâng cấp · 6 mảnh build mới · 1 hoãn.
⇒ Phần lõi đã có. Việc chính là **nối dây và thêm mặt tiền**, không phải xây từ đầu.

---

## §2 · MÔ TẢ GIAO DIỆN — để Hoà chốt trước khi đưa Claude Design

### 2.1 Dạng LÀM VIỆC — ô cửa sổ, lưới

```
┌─ dải BẢNG Ý TƯỞNG ── 1 hàng, mặc định hiện ─────────────┐
│  [🔍 tìm]  [＋]   ▣ Quán cà phê ấm  ▣ Văn phòng  ▣ …    │ ← kéo xuống thì ẩn
└─────────────────────────────────────────────────────────┘   gọi lại: nhấn-kéo (như pill Vitals)

   ┌────┐ ┌────┐ ┌────┐ ┌────┐              ◐ ◐ ◐  ← 3 nút kính nổi
   │    │ │    │ │    │ │    │
   └────┘ └────┘ └────┘ └────┘     lưới ảnh — lướt · kéo · thả

   kéo một ảnh ra canvas → canvas hỏi:
      ┌ Làm nét hơn         → ảnh sắc hơn, đủ in
      └ Rút DNA thiết kế    → thành THẺ: phong cách · đường nét · vật liệu · màu
```

· Bảng ý tưởng xếp **đè nhau có chiều sâu** — chiều sâu = *còn bảng khác phía sau*, không phải hiệu ứng suông
· Chạm: kéo thả · Chuột: phím nổi
· Ba nút kính nổi trên trang, **kính chỉ ở lớp bọc** (luật đã chốt)

### 2.2 Dạng KHÁM PHÁ — trình chiếu sống

· Ảnh lớn, chuyển động rất nhẹ kiểu Ken Burns (**mượn từ màn khoá, đã dựng sẵn**)
· **Thả tim** → tín hiệu về máy gu, **để dạng chờ**, đủ ngưỡng mới học
· Ảnh đã tim thì **khác chất hiển thị** — không dán thêm biểu tượng trái tim đè lên ảnh
· Máy đề xuất phải **nói được vì sao**: *"gợi ý vì bạn hay tim ảnh có gỗ trầm và ánh sáng xiên"*
· Trạng thái phải khai thật: **đang học** ↔ **đã đủ hiểu**

### 2.2b 🔴 NHÃN TRÊN THẺ ẢNH — Hoà chốt 17/08

> *"nhãn phải được thiết kế thanh lịch, không chồng lấn tranh giành làm che nội dung; ambient vừa đủ
> để không khó chịu nhưng thông tin vẫn rõ; tránh cảm giác lốm đốm dán lên card."*

⚠️ Gallery có tới **5 loại nhãn**: nguồn · thể loại · đã tim · kho-có hay chỉ-dẫn-tới · máy-suy.
Dán hết lên ảnh là ra đúng cái lốm đốm Hoà cảnh báo. Ba luật:

**① CHỈ MỘT nhãn đứng trên ảnh.** Bốn cái còn lại xuống **dải dưới ảnh** hoặc **chỉ hiện khi trỏ vào**.
Ảnh là NỘI DUNG — nhãn không được tranh chỗ với nó.

**② Nhãn KHÔNG phải viên chip đục dán lên.** Dùng **lớp phủ chuyển sắc ở mép** (đúng cơ chế đã chốt
16/08 cho card): chữ đọc được nhờ **mép tối dần**, không nhờ một mảng nền đè lên ảnh.

**③ Ambient chỉ đủ tách chữ, không hơn.** Ngưỡng đã đo: **0,54 tại chân chữ**. Trên mức đó là dư,
ảnh bắt đầu bị bẩn. Đo **tại chân chữ**, không đo trung bình cả thẻ.

🔧 **Ca dễ hỏng — dấu "máy suy"**: nếu nó là *thêm một chấm nữa* trên ảnh thì lại lốm đốm.
⇒ Dấu máy-suy **không nằm trên ảnh** mà nằm ở **chính chữ nhãn** — chữ nghiêng hoặc nhạt hơn.
Cùng một chỗ, khác chất, **không tốn thêm vật thể**.

### 2.3 Bộ lọc — theo bậc rẻ trước

| Bậc | Lọc theo | Cần gì |
|---|---|---|
| 1 | thể loại · công trình · tác giả · năm · nước | **đọc nhãn có sẵn từ nguồn** — không đoán |
| 2 | không gian · vật liệu · phong cách | **từ điển nghề** trên mô tả — tất định |
| 3 | tông ấm/lạnh · sáng/trầm | **màu** — `ref-search` đã làm được, chỉ chưa thành nhãn lọc |
| 4 | *"hợp gu tôi"* | **học từ bảng Hoà gom + tim** — máy gu đã có |
| 5 | *"ánh sáng xiên buổi chiều"* | nhìn ảnh — **hoãn** |

⭐ Bậc 4 rẻ hơn bậc 5 mà giá trị cao hơn: nhãn nguồn trả lời được *"đây là văn phòng"*, **không** trả
lời được *"đây có hợp gu tôi không"* — câu đó học từ hành vi tốt hơn nhìn ảnh.
⚠️ Nhãn máy suy phải **đánh dấu**, người sửa được, sửa xong máy học luôn.

### 2.4 Áp DNA vào không gian khác

Hai dạng không gian đích, **cả hai đều là scene của IF**:
① khối clay chưa thiết kế · ② đang thiết kế dở hoặc bị chủ đầu tư bắt sửa

⇒ Máy **không cần đoán** đâu là sàn/vách/trần — nó biết sẵn vì đó là mô hình của chính nó.
**Phần đắt nhất (thị giác) được miễn.**

Năm nhóm nấc áp: **sàn · vách · trần · đồ nội thất** (theo bộ hoặc món rời, mỗi nấc bật tắt) · **trang trí**.
Trùng đúng bảng ánh xạ mảng của Grounded Render (chốt 13/08) ⇒ **mở rộng, không đẻ máy mới**.

---

## §3 · 🔴 GIẤY PHÉP — phải chốt trước khi build nguồn ngoài

| Nguồn | Dùng tới đâu |
|---|---|
| **Unsplash** | ✅ API chính thức, cho thương mại. Ràng buộc: ghi nguồn · **không bán lại chính bức ảnh** |
| **ArchDaily** | ⚠️ ảnh **có bản quyền** của KTS/nhiếp ảnh gia, không có API cho dùng lại |
| **OfficeSnapshots** | ⚠️ tương tự |

**Đường hợp pháp — liên kết thay vì sao chép**: hiện ảnh xem trước nhỏ + **trỏ về trang gốc**, không
lưu bản gốc vào kho. Vừa đúng luật vừa nhẹ dung lượng.
Ảnh Hoà **tự tải về máy** thì thuộc trách nhiệm Hoà; IF chỉ là chỗ để. **Ranh giới này phải ghi vào
`LICENSE-NOTES.md`** — đúng bài học đã trả giá với thư viện DWG.
⇒ Giao diện phải khai rõ: ảnh nào **kho có**, ảnh nào **chỉ dẫn tới**.

---

## §4 · THỨ TỰ T ĐỀ XUẤT

| Đợt | Việc | Vì sao trước |
|---|---|---|
| **1** | Bảng ý tưởng + tim + nối máy chưng cất + lọc bậc 1–3 | vòng khép kín nhỏ nhất mà đã dùng được; không vướng giấy phép |
| **2** | Nguồn ngoài — Unsplash trước, hai nguồn kia theo cơ chế liên-kết | cần cơ chế §3 dựng xong |
| **3** | Áp DNA vào scene IF, 5 nhóm nấc + build lại núm per-mảng | phần ăn tiền nhất, và không cần thị giác |
| **4** | Học gu bậc 4 | cần dữ liệu từ đợt 1–2 mới học được |
| **5** | Bậc 5 nhìn ảnh | chờ backbone thị giác |

⚠️ Đợt 4 làm sớm là **máy học từ số không**.

---

## §5 · CÒN CHỜ HOÀ

1. Chốt thứ tự §4 hoặc đổi
2. Chốt **§3 giấy phép** — có chấp nhận hai nguồn chỉ-liên-kết không
3. **Todo list trong widget việc**: là *các bước con trong một việc* hay *danh sách việc rời*?
   Hai cách đọc ra hai thứ khác hẳn — T không đoán.
4. Duyệt mô tả giao diện §2 → T đưa Claude Design dựng bản vẽ
