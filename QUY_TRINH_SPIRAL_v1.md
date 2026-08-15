# QUY TRÌNH SPIRAL — Vòng lặp khép kín Design ⇄ IDF

> # ⛔ LỖI THỜI — KHÔNG PHẢI QUY TRÌNH ĐANG CHẠY (T đóng dấu 15/08)
>
> **File này là bản 28/07, commit cuối 29/07 (`8e096a8`), CHƯA từng chạy trọn một vòng.**
> Quy trình vận hành THẬT hiện nay:
> `docs/HOP-DONG-PHOI-HOP-T.md` (mô hình T/V, 12/08) + `docs/TRIET-LY-IF.md` (hiến pháp, 13/08)
> + sổ máy `scripts/frontier-registry.mjs` + 5 máy soi (`soi:frontier` · `soi:tu-dien` ·
> `soi:thao-tac` · `soi:hinh-hoc` · `soi:contract`) + `docs/bao-cao-phien/`.
>
> **Đối chiếu 15/08:** `STATUS.md` · `00-CHOT.md` · `HOP-DONG-PHOI-HOP-T` · `TRIET-LY-IF` nhắc
> "SPIRAL" **0 lần**; chỉ 3 file cùng thời 28/07 còn trỏ tới đây. Hai hệ không biết nhau tồn tại.
>
> **Vì sao đóng dấu chứ không xoá:** 15/08 một bản tư vấn ngoài đọc file này, tưởng đang chạy,
> rồi kê đơn sửa nó — trong đó có "khởi tạo SIM LEDGER" (đã BÁC, xem `docs/00-CHOT.md` mục
> "Xử bản tư vấn vai vận hành 15/08"). File không có dấu lỗi-thời thì người/agent sau còn mắc
> tiếp. Nội dung dưới giữ nguyên làm lịch sử — 3 thứ ĐÃ CHUYỂN SANG hệ mới, tra bảng:
>
> | Cơ chế SPIRAL | Bản đang sống thay nó |
> |---|---|
> | SIM LEDGER (§0) | `scripts/frontier-registry.mjs` + `docs/bao-cao-phien/` + `soi:contract` |
> | Audit 2 lớp G7 | T audit (§2 bước 6) + **agent V** kiểm chéo độc lập (§2 bước 7) |
> | Chưng cất SOP G8A | `docs/HOP-DONG-PHOI-HOP-T.md` §9 + `docs/he-luat-thao-tac` |
> | Hạm đội NHÃ/KIẾN/VŨ/TRỤ | T (kiến trúc xuyên chặng) + sub-agent cấp chặng + V (§1c) |
>
> ⛔ **Cấm dùng file này làm căn cứ chẩn đoán hiện trạng.** Đọc `docs/memory/LATEST.md` trước.

> **Mục đích kép:** vừa tạo ra sản phẩm design/tool A&D thật, vừa dùng chính quá trình đó để phát hiện IDF còn thiếu gì → đề xuất code cải tiến.
> **Nguyên lý:** không đoán xem IDF cần tính năng gì. **Làm việc thật trong môi trường giả lập, cái gì thiếu sẽ tự lộ ra.**
> Version: v1.0 · 2026-07-28

---

## 0 · CƠ CHẾ CỐT LÕI — SIM LEDGER (Sổ Giả Lập)

Đây là phần quan trọng nhất, không được bỏ. Nó vừa giải quyết mâu thuẫn "giả sử tính năng đã có" vs "chỉ tin code thật", vừa là nguồn dữ liệu cho bước phản hồi ngược.

**Luật:** mỗi lần trong môi trường ảo cần dùng một tính năng IDF **chưa có thật**, ghi ngay 1 dòng vào `SIM-LEDGER.md`:

```
[Mã] | Tính năng giả lập | Dùng để làm gì | Input mong đợi | Output mong đợi | Lần thứ mấy | Nếu không có thì làm sao
```

Ví dụ thật:
```
S-001 | Đọc gu từ ảnh khách | Chuyển 12 ảnh Pinterest CĐT gửi → GuProfile | 12 ảnh JPG | GuProfile (mood/palette/form) | Lần 3 | Làm tay 45ph, dễ lệch
```

**Vì sao đây là chìa khoá:**
- Cột "Lần thứ mấy" = **tần suất thật**, không phải phỏng đoán. Tính năng xuất hiện 5 lần trong 3 dự án khác nhau → ưu tiên cao hơn tính năng nghe hay nhưng chỉ dùng 1 lần.
- Cột "Nếu không có thì làm sao" = **chi phí thật của việc thiếu nó** (45 phút/lần × 5 lần = 3.75 giờ). Đây là con số để quyết có đáng code không.
- Giữ ranh giới sạch: mọi thứ trong SIM LEDGER **mặc định là chưa có thật**. Không bao giờ được coi là đã xây.

**Luật cách ly (quan trọng):** khi báo cáo tiến độ IF thật, chỉ đọc từ code — tuyệt đối không đọc SIM LEDGER. Hai nguồn không được trộn.

---

## 1 · SƠ ĐỒ VÒNG LẶP

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  G0 NẠP BỐI CẢNH (chỉ 1 lần đầu)                        │
│         ↓                                                │
│  G1 ĐỀ BÀI & BỐI CẢNH                                   │
│         ↓                                                │
│  G2 LẬP DANH MỤC NGHIÊN CỨU                             │
│         ↓                                                │
│  G3 NGHIÊN CỨU → LỌC HỆ GIÁ TRỊ                         │
│         ↓                                                │
│  G4 3 OPTION Ý TƯỞNG + HÌNH MINH HOẠ                    │
│         ↓                                                │
│  G5 Q&A HỘI TỤ → CHỌN 1                                 │
│         ↓                                                │
│  G6 PHÁT TRIỂN CHI TIẾT (đúng gu CĐT)                   │
│         ↓                                                │
│  G7 AUDIT (2 lớp: sản phẩm + quá trình)                 │
│         ↓                                                │
│  G8 CHƯNG CẤT SOP  +  PHẢN HỒI NGƯỢC VỀ IDF             │
│         │                        ↓                       │
│         │              [Đề xuất code improve IF]         │
│         ↓                                                │
└──── quay lại G1 ở BẬC THANG cao hơn ───────────────────┘
```

---

## 2 · CHI TIẾT TỪNG GIAI ĐOẠN

### G0 · NẠP BỐI CẢNH — chỉ chạy 1 lần, đầu tiên

| Việc | Chi tiết |
|---|---|
| Đọc hệ sinh thái IDF | `CONTEXT-IF-ECOSYSTEM.md`, `IF-MASTER-TREE.md` |
| Dựng môi trường ảo | Lập bảng "Tính năng giả định có sẵn" theo 3 hệ: ArchiNote · ATLAS/Lark · IF (4 chặng Studio) |
| Khởi tạo SIM LEDGER | File rỗng, sẵn sàng ghi |
| Chốt bậc thang | Xác định đang ở bậc nào (xem mục 3) |

**Đầu ra:** 1 khối tóm tắt ≤10 dòng — môi trường ảo gồm gì, ranh giới ở đâu.

---

### G1 · ĐỀ BÀI & BỐI CẢNH

| Việc | Chi tiết |
|---|---|
| Nhận brief | Dùng BRIEF CARD (đã có trong NHÃ v4) |
| Xác định phạm vi | Đây là bậc thang nào? Sản phẩm design hay tool A&D? |
| Đọc vị CĐT | Điều họ NÓI ≠ điều họ CẦN — 1 câu insight |
| Ràng buộc cứng | Ngân sách, timeline, kết cấu, quy định |

**Cổng ra:** chưa rõ dữ kiện then chốt → dừng, hỏi 1 câu kèm 2-3 lựa chọn. **Không đi tiếp khi còn mơ hồ.**

---

### G2 · LẬP DANH MỤC NGHIÊN CỨU (research agenda)

Chưa nghiên cứu vội — **liệt kê cái gì đáng nghiên cứu trước đã**. Đây là bước hay bị bỏ, dẫn tới nghiên cứu lan man.

| Loại nghiên cứu | Ví dụ | Ưu tiên |
|---|---|---|
| Bối cảnh văn hoá/địa điểm | Genius loci của khu đất, tập quán sử dụng | Cao nếu công trình có bản sắc địa phương |
| Người dùng thật | Ai dùng, dùng lúc nào, thói quen gì | Luôn cao |
| Tham chiếu ngành | Ai đã làm tương tự, thành/bại ra sao | Trung bình |
| Kỹ thuật/vật liệu | Cái gì khả thi ở VN, giá bao nhiêu | Cao nếu ngân sách chặt |
| Xu hướng/công nghệ | Có giải pháp mới nào không | Thấp — trừ khi đó là điểm khác biệt |

**Đầu ra:** bảng 3-7 câu hỏi nghiên cứu, xếp ưu tiên, mỗi câu ghi rõ *"biết cái này để quyết định gì"*. Câu nào không trả lời được "để quyết gì" → gạch bỏ, đừng nghiên cứu.

---

### G3 · NGHIÊN CỨU → LỌC HỆ GIÁ TRỊ

Tiến hành nghiên cứu theo danh mục G2, rồi **chắt lọc thành hệ giá trị áp dụng được** — đây mới là phần khó.

| Bước | Làm gì |
|---|---|
| Thu thập | Theo đúng danh mục, không lan man |
| Sàng lọc | Mỗi phát hiện: giữ/bỏ + 1 lý do |
| Chắt lọc hệ giá trị | Từ nhiều phát hiện rời rạc → **3-5 nguyên tắc chỉ đạo** cho dự án này |
| Kiểm tra | Mỗi nguyên tắc phải trả lời được: "nếu vi phạm nguyên tắc này thì sao?" — không trả lời được = nguyên tắc rỗng |

**Đầu ra mẫu:**
```
HỆ GIÁ TRỊ DỰ ÁN X
1. Ưu tiên ánh sáng gián tiếp — vì CĐT làm việc ban đêm, chói mắt là điểm đau thật
2. Vật liệu chịu ẩm ở tầng trệt — vì khu vực ngập theo mùa
3. Hình khối tối giản — vì ngân sách chỉ đủ gia công thẳng, không đủ uốn cong
```

---

### G4 · 3 OPTION Ý TƯỞNG TỔNG THỂ + HÌNH MINH HOẠ

| Yêu cầu | Chi tiết |
|---|---|
| Đúng 3 phương án | Không 2 (thiếu lựa chọn), không 5 (loãng, khó quyết) |
| Khác nhau về **bản chất** | Không phải 3 biến thể cùng 1 ý — mỗi cái đánh đổi khác nhau |
| Mỗi option có | Tên gọi · 1 dòng định vị · mood/palette/hình khối · **hình minh hoạ** · ưu/nhược/chi phí/rủi ro |
| Ánh xạ hệ giá trị | Mỗi option ghi rõ đang tối đa hoá nguyên tắc nào, hy sinh nguyên tắc nào |

**Về hình minh hoạ** — đây là chỗ SIM LEDGER hoạt động mạnh nhất:
- Có tính năng thật (render, moodboard) → dùng
- Chưa có → ghi vào SIM LEDGER + làm tạm bằng công cụ ngoài (Nano Banana, D5, tham chiếu ảnh)

---

### G5 · Q&A HỘI TỤ → CHỌN 1

| Bước | Làm gì |
|---|---|
| Q&A có cấu trúc | Mỗi lượt 1 câu hỏi, kèm 2-3 lựa chọn để Hoà/CĐT chọn nhanh |
| Ghi nhận phản hồi | Mỗi phản hồi → cập nhật vào hệ giá trị nếu cần |
| Lai ghép nếu hợp lý | Được phép lấy điểm mạnh option A ghép vào B — nhưng phải kiểm tra không phá vỡ tính nhất quán |
| Chốt 1 phương án | Ghi rõ: chọn cái nào, vì sao, bỏ cái kia vì sao |

**Cổng ra:** phải có 1 phương án duy nhất được chốt bằng văn bản. Không chốt = không đi tiếp G6.

---

### G6 · PHÁT TRIỂN CHI TIẾT

| Việc | Chi tiết |
|---|---|
| Triển khai theo ưu tiên ngân sách | Cái nào ảnh hưởng trải nghiệm nhiều nhất làm trước |
| Vật liệu · ánh sáng · furniture · điểm nhấn | Mỗi hạng mục kèm lý do + keyword EN |
| Kiểm tra gu CĐT liên tục | Áp dụng "Tắc kè hoa" — nền theo gu Hoà, điểm nhấn chiều CĐT có kiểm soát |
| Pre-mortem | "Nếu CĐT chê, sẽ chê chỗ nào?" + phương án đỡ sẵn |
| Ghi SIM LEDGER | Mọi tính năng IDF cần mà chưa có → ghi ngay tại chỗ, không để cuối mới nhớ lại |

---

### G7 · AUDIT — 2 LỚP TÁCH BẠCH

Đây là điểm nhiều quy trình làm sai: trộn chung "sản phẩm tốt không" với "cách làm tốt không".

**Lớp A — Audit sản phẩm** (đầu ra có đạt không)

| Tiêu chí | Câu hỏi |
|---|---|
| Đúng hệ giá trị | Có vi phạm nguyên tắc nào đã chốt ở G3? |
| Đúng gu CĐT | Khớp thật hay gu designer áp lên? |
| Khả thi | Thi công được với ngân sách/timeline thật? |
| Cảm xúc | Có tạo được khoảnh khắc dừng lại không? |

**Lớp B — Audit quá trình** (cách làm có tốt không)

| Tiêu chí | Câu hỏi |
|---|---|
| Chỗ tắc | Giai đoạn nào mất nhiều thời gian bất thường? |
| Làm lại | Chỗ nào phải làm đi làm lại? Vì sao — thiếu thông tin ở G1? Hay hệ giá trị G3 sai? |
| Quyết định muộn | Có quyết định nào lẽ ra nên chốt sớm hơn? |
| Thủ công vô ích | Việc nào lặp đi lặp lại mà máy làm được? *(→ nguồn cho SIM LEDGER)* |

---

### G8 · CHƯNG CẤT SOP + PHẢN HỒI NGƯỢC VỀ IDF

**8A — Chưng cất quy trình (SOP hoá)**

Từ audit lớp B → cập nhật quy trình cho vòng sau:
- Bước nào thừa → bỏ
- Bước nào thiếu → thêm
- Checklist nào cần bổ sung mục mới
- Ghi vào `SOP-DESIGN-vN.md`, tăng version mỗi vòng

**8B — Phản hồi ngược về IDF (phần anh yêu cầu)**

Đọc SIM LEDGER, xếp hạng theo công thức:

```
Điểm ưu tiên = (Tần suất × Thời gian tiết kiệm mỗi lần) ÷ Độ khó xây
```

| Hạng | Nghĩa là | Hành động |
|---|---|---|
| Cao | Dùng nhiều, tiết kiệm nhiều, dễ xây | Đề xuất code ngay vòng tới |
| Trung bình | Dùng vừa hoặc khó xây | Ghi `docs/IDEAS-BACKLOG.md` |
| Thấp | Dùng 1 lần, khó xây | Loại, ghi lý do để khỏi đề xuất lại |

**Trước khi đề xuất code, bắt buộc kiểm tra 3 điều** (theo luật cứng của IF):
1. Tính năng này có trong `IF-MASTER-TREE.md` không? Nếu không → vào IDEAS-BACKLOG, **không chen vào cây tính năng**.
2. Thuộc tầng nào (T0-T5)? Thang N/P/L là gì? Nếu là L mà N của chặng đó chưa ✅ → **chưa được xây**.
3. Có phạm luật kiến trúc nào không (local-first, LLM không viết toạ độ, 2 app không gọi nhau)?

**Đầu ra đề xuất code — format chuẩn:**
```
ĐỀ XUẤT: [tên tính năng]
BẰNG CHỨNG NHU CẦU: SIM LEDGER S-001, S-014, S-032 (3 dự án, 8 lần dùng)
CHI PHÍ HIỆN TẠI: ~45ph/lần × 8 = 6 giờ
VỊ TRÍ: Tầng T3 · Chặng Render · Thang P
KIỂM TRA LUẬT: ✅ có trong MASTER-TREE mã 2.2.16 · ✅ N chặng Render đã đủ · ✅ không phạm local-first
ĐỀ XUẤT KỸ THUẬT: [mô tả — KIẾN chỉ đề xuất, không tự code]
```

---

## 3 · BẬC THANG — từ đơn giản nhất đến lớn nhất

Mỗi vòng lặp hoàn tất → leo 1 bậc. **Không nhảy bậc.**

| Bậc | Phạm vi | Sản phẩm mẫu | Mục tiêu học được |
|---|---|---|---|
| **L1** | 1 chi tiết đơn | Bảng vật liệu 1 khu vực · 1 món đồ tạo dáng | Quy trình chạy được không, SIM LEDGER ghi đúng chưa |
| **L2** | 1 không gian đơn | 1 phòng hoàn chỉnh (concept → present) | Vòng lặp có khép kín thật không |
| **L3** | 1 căn hộ / 1 tầng | Nhiều không gian liên kết | Xử lý mâu thuẫn giữa các không gian |
| **L4** | 1 công trình | Dự án đầy đủ như Detech | Chịu được độ phức tạp thật |
| **L5** | Tool A&D | Công cụ dùng được cho cả team | Chuyển từ làm sản phẩm → làm công cụ tạo sản phẩm |

**Luật lên bậc:** chỉ lên khi vòng ở bậc hiện tại đã chạy trọn G1→G8 **và** SOP đã được cập nhật ít nhất 1 lần. Chạy nửa vời rồi nhảy bậc = quy trình không bao giờ chín.

---

## 4 · AI LÀM GÌ Ở GIAI ĐOẠN NÀO

| Giai đoạn | Agent chính | Vai phụ |
|---|---|---|
| G0 | KIẾN* (đọc hệ sinh thái) | — |
| G1-G3 | 🌸 NHÃ (ADVISOR mode) | KIẾN* nếu liên quan IF |
| G4-G5 | 🌸 NHÃ (STUDIO mode) | 🎬 RIN nếu cần hình/công cụ số |
| G6 | 🌸 NHÃ + 📐 TRỤ (kỹ thuật) | 🎬 RIN nếu có lớp số |
| G7 lớp A | 🔭 VŨ | — |
| G7 lớp B | 🔭 VŨ | KIẾN* (nhìn từ góc hệ thống) |
| G8A | 🔭 VŨ (chốt SOP) | — |
| G8B | KIẾN* (đề xuất code) | 🎬 RIN (nếu cần prototype) |

\* **KIẾN chưa được chốt vào hệ.** Xem mục 5.

---

## 5 · VIỆC CÒN TREO — CẦN HOÀ QUYẾT

✅ **QUYẾT (28/07, qua Cowork, lệnh "tiến hành")** — Vấn đề gốc: KIẾN là agent thứ 5, tên đụng
KIÊN, domain chồng RIN.

**Quyết định:** giữ tinh thần phương án B gốc (KIẾN ở riêng, KHÔNG gộp vào RIN — giữ đúng luật
"chỉ đọc, không ghi, không code" là lớp bảo vệ giá trị cho repo IF), nhưng **đổi hướng rename**:
thay vì đổi tên KIẾN (agent mới, đã có cả file danh tính riêng `AGENTKIENIFARCHITECT.md`, tên chơi
chữ "kiến trúc" hợp vai trò), **đổi tên KIÊN (checklist kỹ thuật nhẹ, dùng ở G6 + hội đồng giả
định) → TRỤ** — ít xáo trộn hơn vì KIÊN trước giờ chỉ là 1 nhãn checklist, không phải 1 agent có
danh tính riêng. Domain chồng RIN tự giải quyết vì đã không gộp (đúng lý do nêu ở phương án A cũ,
xem lịch sử bên dưới).

Đã cập nhật cùng đợt: mục 4 ở trên (KIÊN → TRỤ) · `IF-ARCHITECTURE-BLUEPRINT-v1.md` §5C (checklist
TRỤ/NHÃ) · `IF-FEATURE-TREE.md` mã 7.2.3.

<details><summary>Phân tích gốc (28/07, trước khi quyết) — giữ lại làm lịch sử, không xoá</summary>

**Vấn đề:** KIẾN là agent thứ 5, tên đụng KIÊN, domain chồng RIN.

| Phương án | Ưu | Nhược |
|---|---|---|
| **A. Nhập KIẾN vào RIN** | Giữ đúng 4 agent · không đụng tên | RIN đang là "sản xuất", KIẾN là "chỉ đọc-tư vấn" — hai chất khác nhau, dễ loãng vai |
| **B. Giữ riêng, đổi tên** (vd: **THẤU** — thấu hiểu hệ thống · hoặc **TRỤ** — cột trụ kiến trúc) | Giữ được luật "chỉ đọc không ghi" rất giá trị cho IF | Thành 5 agent |
| **C. KIẾN không phải agent thường trực** — chỉ bật khi làm việc với IF | Không phá cấu trúc 4 agent hằng ngày | Cần kỷ luật, dễ quên |

Em nghiêng về B (đổi tên, giữ riêng) — vì luật "chỉ đọc, không ghi, không code" là bảo vệ thật cho
repo IF, mà RIN thì bản chất là agent sản xuất, trộn vào sẽ mất lớp bảo vệ đó.

</details>

---

## Changelog

| Ngày | Bản | Thay đổi |
|---|---|---|
| 2026-07-28 | v1.1 | (Cowork) Chốt đổi tên KIÊN → TRỤ, giải xung đột tên với KIẾN mà không đụng vào file danh tính KIẾN đã có. Giữ nguyên phân tích gốc trong khối gấp ở mục 5 (append-only, không xoá). |
| 2026-07-28 | v1.0 | Khởi tạo quy trình SPIRAL 8 giai đoạn + cơ chế SIM LEDGER + bậc thang L1-L5 |
