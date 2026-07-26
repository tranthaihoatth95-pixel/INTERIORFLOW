# SPEC — PRESENT FLOW & VIDEO *(chặng 3)*

> **[CẦN HOÀ DUYỆT]** · Chẩn đoán gốc (Hoà, 24/07): *"thông minh chưa tới mà human-in-loop
> cũng chưa tới"* — Present đang **kẹt giữa** hai mô hình.
> Đọc cùng `SPEC-UI-SHELL.md`, `SPEC-SEMANTIC-MODEL.md`, `IF-PRESENT-SPRINT-PLAN.md`.

---

## 1. Chẩn đoán — ba mô hình tương tác đánh nhau trên một màn hình

| Đang có | Hứa gì | Thực tế |
|---|---|---|
| Panel trái 3 bước (ảnh → text → reference) | *"Điền vào, máy tự dàn"* — **wizard** | Điền xong không biết bấm gì tiếp |
| Canvas giữa kéo thả | *"Bạn tự làm"* — **editor** | Vậy 3 bước kia để làm gì? |
| Panel phải layer + màu nền | **Photoshop** | Hệ tư duy thứ ba |

⇒ Máy chưa đủ thông minh để tự lo, người cũng không được cầm lái rõ ràng.

## 2. Mô hình đúng — **máy đề xuất · người chọn · máy học**

```
① NẠP          ② MÁY DÀN             ③ BẠN SỬA          ④ XUẤT
nguyên liệu  → 3 phương án khác   →  canvas tự do   →  deck · PDF · video
(1 màn hình)    nhau, chọn 1          (wizard ẩn đi)
                     ↑                      │
                     └──── "Đề xuất lại" ───┘   (cả deck / 1 trang / 1 khối)
                               ↓
                  mỗi lần chọn & sửa = tín hiệu học (Perceptron đã có)
```

### Bốn luật gỡ "kẹt giữa"

| # | Luật | Cụ thể |
|---|---|---|
| 1 | **Một lúc một việc** | Xong bước nạp → panel wizard **thu lại**, không chiếm đất vĩnh viễn |
| 2 | **Đề xuất NHIỀU, không đề xuất MỘT** | Máy đưa **3 phương án** dàn trang → người chọn. Chọn = dạy máy. Một phương án thì người chỉ biết chịu hoặc bỏ |
| 3 | **Sửa tay không mất đề xuất** ⭐ | "Đề xuất lại" chỉ đổi phần **chưa động tay**; chỗ đã sửa được **khoá giữ** *(pin)*. Thiếu luật này là lý do hầu hết công cụ AI làm slide bị bỏ — sửa xong generate lại là mất hết công |
| 4 | **Nói rõ máy vừa làm gì** | 1 dòng: *"Đã dàn 5 trang theo lưới 12 cột, ảnh ngang lên đầu"* — không im lặng |

## 2B. CÂY DÀN BÀI + TẠO SINH CÓ RÀNG BUỘC *(lấy từ Figma & Canva, bỏ điểm yếu của cả hai)*

| | **Figma** giỏi | **Canva** giỏi |
|---|---|---|
| Giải bài toán | **Kiểm soát cấu trúc** — thấy toàn bộ, sắp xếp lại được | **Khởi động** — không đối mặt trang trắng |
| Điểm yếu | Trang trắng, tự dựng từ đầu | ⚠️ **Không đồng nhất thẩm mỹ** |

**Vì sao Canva rời rạc**: sinh từng slide độc lập, không có hệ thống ràng buộc.
**IF khác**: đã có `DECK_STANDARDS` (lưới 12 cột) · Brand Kit · 25 template · Perceptron học gu.

> ⭐ **LUẬT: AI chỉ được CHỌN trong bộ template đã duyệt — KHÔNG được tự sáng tác bố cục.**
> *(constrained generation)* → nhanh như Canva nhưng **đồng nhất thẩm mỹ**, vì mọi trang
> sinh ra từ cùng một hệ thống. Thắng cả hai không nhờ AI mạnh hơn, mà nhờ **có hệ thống
> thiết kế để ràng buộc AI**.

### Cây cấu trúc 3 cấp (panel trái) — cấp bậc của DECK, không phải của layer

```
▾ 00 · Về chúng tôi          ← CHƯƠNG (kéo thả đổi thứ tự cả chương)
    ▸ Trang bìa
    ▸ Hồ sơ năng lực
▾ 01 · Hiểu về dự án
    ▸ Tổng quan               ← TRANG (kéo đổi vị trí · nhân bản · ẩn)
    ▸ Bối cảnh · khí hậu
▾ 02 · Ý tưởng
```

### Dàn bài mẫu theo loại hồ sơ — thứ Figma/Canva KHÔNG có

| Loại deck | Dàn bài mẫu |
|---|---|
| Concept proposal | Về chúng tôi → Hiểu dự án → Nghiên cứu → Ý tưởng lớn → Định hướng → Layout → Vật liệu |
| Design development | Layout chi tiết → Từng không gian → Vật liệu → Chi tiết → Khối lượng |
| Material board | Tổng quan palette → Từng khu vực → Bảng vật liệu → Nguồn cung |

### Luồng Present mới

```
① Chọn loại hồ sơ   → ra CÂY DÀN BÀI mẫu (sửa được: thêm/bớt/đổi tên chương)
② Nạp nguyên liệu   → ảnh · bản vẽ từ CAD · text · reference
③ Máy phân vào chỗ  → mỗi trang tự CHỌN template phù hợp trong 25 mẫu (không sáng tác)
④ Cây bên trái      → kéo thả sắp xếp, thấy trang nào còn trống
⑤ Sửa trên canvas   → chỗ đã sửa được KHOÁ GIỮ (luật 6c)
⑥ Xuất              → PDF · PPTX · HTML · video
```

**Bước ① và ④ hiện HOÀN TOÀN THIẾU** — chính chúng gây cảm giác "không biết bấm gì tiếp".

## 3. Nhánh video — tách 4 thứ, chỉ 2 dùng được ngay

⚠️ **Video đắt hơn ảnh rất nhiều** (mỗi giây 24–30 khung). Đây là chỗ phá ngân sách 0-credit
nhanh nhất → chọn lọc gắt.

| Loại | Độ chín 2026 | Chi phí | Kết luận |
|---|---|---|---|
| **Text-to-voice** *(TTS)* | 🟢 chín, tiếng Việt tốt | Rất rẻ | ✅ làm ngay |
| **Deck → video thuyết trình** (slide + chuyển cảnh + lời + nhạc) | 🟢 không cần AI, chỉ dựng phim | **0 credit** | ✅ **giá trị cao nhất** |
| **Ken Burns / parallax 2.5D** từ ảnh render | 🟢 kỹ thuật cũ, ổn định | **0 credit** | ✅ sớm |
| Image-to-video (rèm bay, nắng chuyển) | 🟡 chỉ khi chuyển động nhỏ | Đắt | 🔸 b-roll 3s |
| Text-to-video sinh cả không gian | 🔴 méo hình học, rung | Rất đắt | ❌ |
| Fly-through phối cảnh | 🔴 AI thua xa | — | ❌ **dùng D5 render video** |

### Món đáng làm nhất: `deck + giọng đọc = video thuyết trình`
KTS gửi khách xem trước họp · đăng fanpage · gửi CĐT ở xa.
**Đường rẻ nhất**: Present đã xuất PNG từng slide → TTS đọc phần ghi chú → ghép bằng FFmpeg.
Vài ngày công, **0 credit vận hành**.

### Phân bậc video
| Bậc | Nội dung |
|---|---|
| **N** | Xuất deck thành video: slide + chuyển cảnh + nhạc nền |
| **P** | TTS thuyết minh (đọc speaker notes) · Ken Burns/parallax từ ảnh render · ghép b-roll |
| **L** | Camera path lấy từ **semantic model** (CAD) → video có cấu trúc, không phải AI đoán |

## 4. Việc kế tiếp (khớp sprint PS đang có)

- Luật 1–4 áp vào **PS-8 AI khởi thảo nội dung** — đây chính là chỗ "kẹt giữa" hiện tại.
- Video bắt đầu từ **N** (deck→video) sau khi PS-4 đa khổ xong; TTS làm cùng.
- Không chen video AI (image-to-video) vào trước khi nền N của CAD xong — luật số 1 blueprint.

---

*v1.1 (thêm §2B cây dàn bài + tạo sinh có ràng buộc) · 2026-07-24 · Ben soạn theo ý Hoà.*

