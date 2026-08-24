# VITALS — khẩu độ chú ý, không phải dòng thông báo

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — **khẩu độ** sống trong vỏ: nó **cắt vào** vỏ, biết **im lặng**, và nở ra theo nhu cầu.
Ba mức: **ambient** (luôn thấy) → **peek** (tối đa 3 tín hiệu THẬT) → **engage** (mở hội thoại).

**KHÔNG PHẢI** — dòng thông báo · popover · chatbot toàn màn · một quả cầu trang trí.
**[N]** `SKILL.md §1` + chốt 20/08.

> ⛔ **LUẬT KHAI THẬT: *Vitals không được nói chỉ để chứng minh rằng nó tồn tại.*** **[N]** 23/08.
> Không có gì đáng nói ⇒ **không tạo card "Everything is fine"**.

**Ranh giới với kiểm chuẩn — đã chốt, không còn tranh luận:** **kiểm tiêu chuẩn là việc của MÁY**
(tất định · 0 đồng · tức thì · chạy 10 lần ra 10 kết quả giống nhau · dẫn được điều khoản).
**AI chỉ đứng ở lớp GÓP Ý** (bố cục · ánh sáng · câu chuyện) và **không bao giờ chặn**.
Điều này đóng cứng vào mã: nguồn tín hiệu của Vitals tự khai *"KHÔNG có insight AI ở đây, và **cố ý
không có chỗ để cắm vào**"*. **[N]** chốt 15/08 (Hoà duyệt) + 07/08 §12.

## 2 · VIỆC CỦA CON NGƯỜI
Biết **có gì cần tôi để mắt không** — mà không phải đi tìm, và không bị làm phiền khi không có gì.
Rồi mới tới: hỏi một câu · xem máy lập luận · duyệt một chuỗi việc.

## 3 · NHÂN VẬT CHÍNH
Ở mức ambient: **sự im lặng**. Ở mức peek: **tín hiệu**. Ở mức engage: **câu trả lời**.
Không bao giờ là bản thân cái khẩu độ.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép | Ghi chú |
|---|---|
| Tối đa **3 tín hiệu** ở mức peek | quá 3 thì *"thôi là khẩu độ, thành bảng điều khiển"* |
| Ba nguồn tín hiệu **THẬT** | việc đang chạy · việc lỗi · vi phạm chuẩn của bản vẽ đang mở |
| Nở từ **chính neo của nó** | luật *mở ra từ nơi nó sống* |
| Nhạy hover trên **cả đường ranh** nav↔canvas | đổi từ neo một ĐIỂM sang neo một ĐƯỜNG |

| Bị từ chối | Lý do |
|---|---|
| Đưa Vitals vào một cụm flex | ca hỏng 20/08 — **neo nhầm hệ**, không phải neo sai chỗ |
| Dựng một dải phủ lên đường ranh | dải DOM ở đó sẽ **nuốt cú bấm** của canvas 2D bên dưới (một cú đặt điểm bị nuốt là hỏng nét) ⇒ cơ chế **không có thân**, nó là phép đo |
| Bịa `0` khi không đo được | phải trả **"chưa biết"** — có test khoá |
| Cắm AI vào lớp tín hiệu | xem §1 |
| Chấm điểm, nói xu hướng không nguồn, chặn người dùng | ba cấm của lớp góp ý |

## 5 · TRẠNG THÁI

| Nên có | Có thật? |
|---|---|
| `calm` — **đã đọc, sạch** | ✅ |
| im lặng — không có ngữ cảnh | ✅ |
| **`unknown` / `unavailable` — ĐỌC THẤT BẠI** | 🔴 **KHÔNG TỒN TẠI TRONG MÃ** |

**[N]** Enum thật vẫn ba giá trị *nghỉ · đang trả lời · cảnh báo*. Không có state `unknown` nào
trong hệ Vitals ⇒ **F-02 vẫn FAIL, còn mở.**

✅ Chỗ làm **rất tốt** và nên nhân rộng: hệ này **phân biệt `undefined` (chưa/không đo được) với `0`
(đã đo, sạch)**. Bộ đo quy chuẩn trả *"chưa biết"* khi không mở bản vẽ / bản vẽ quá nặng / bộ kiểm
ném lỗi — nhánh bắt lỗi **trả `undefined`, không bịa `0`**. Đúng tinh thần F-02, chỉ là chưa đi tới
tầng hiển thị.

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 02/08 | CẢ HAI: thread AI riêng (có trích nguồn) + gọi AI trong kênh nhóm |
| 20/08 | **Vitals Aperture ở MÉP TRÊN, 3 mức — là chữ ký của IF**; nó *cắt vào vỏ và biết im* |
| 15/08 | Kiểm chuẩn = việc của MÁY, AI chỉ ở lớp góp ý (Hoà duyệt, thành luật) |
| 23/08 | Hai dạng hiện diện ở Home: **cửa Ask/Search toàn cục** ↔ **tín hiệu** (chỉ khi đủ đáng giá) |
| 23/08 | Vitals nằm trên **ĐƯỜNG RANH nav↔canvas**, hover **bất kỳ điểm nào** trên đường đó, giãn dần, **luôn giữ neo với canvas** |

## 7 · CA HỎNG THẬT

**① F-02 · FALSE CALM — trạng thái "khoẻ mạnh" khẳng định trên một tiền đề đã sụp.** Hai nguồn đều
trả 401, khẩu độ vẫn hiện `calm`. Gốc: **`calm` không phải im lặng — nó là lời khẳng định *"đã kiểm,
không có gì cần chú ý"*.** Phép đọc đã hỏng nên tiền đề không còn.
Giả định sai: *"không đọc được ⇒ không xác định ⇒ im lặng"* — chỉ nửa đầu đúng.
🔴 **Chi tiết đắt nhất: cả người dựng lẫn lane QA đều KHEN ca này là đúng, bằng đúng cụm từ mô tả
chính căn bệnh của nó (*"nói dối bằng một con số thật"*). Hoà bác.**
⇒ **Một trạng thái "khoẻ mạnh" vẫn là một LỜI KHẲNG ĐỊNH — phải kiểm tiền đề của nó còn đứng không.**

**② Vitals từng neo nhầm hệ (20/08).** Nó đứng trong cụm phải-trên và tự tính vị trí từ tham chiếu
của cụm đó ⇒ **bám vào hệ danh-tính**. Chẩn đoán đúng không phải *"neo sai chỗ"* mà **"neo nhầm hệ"**.
Nay có ổ dành riêng, neo theo **tâm vùng làm việc**.

**③ Bấm vào không ra gì.** Một panel hội thoại Vitals (675 dòng) **mồ côi**: nơi mount duy nhất là
bộ chuyển chặng, đã gỡ 17/08 ⇒ chip "Vitals" ở thanh trạng thái gọi tới một panel **không còn được
mount**. Cả hai cửa vào đều đóng.

**④ Trên Home 23/08: nút 38×26, ruột chỉ một hình ellipse 18×18, KHÔNG có nhãn chữ, và nhãn trợ
năng tự khai *"Vitals — không có tín hiệu"*.** Tức nó **tự khai là không có gì để nói, rồi vẫn chiếm
một chỗ trên thanh trên**. Đúng thứ chốt 23/08 cấm.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Ba mức + hằng số ổ + đường ranh (đọc docstring, nó khai cả lý do) | `components/studio/VitalsAperture.tsx` |
| Ba nguồn tín hiệu thật + trần 3 + `undefined ≠ 0` | `components/studio/vitals-tin-hieu.ts` |
| Chốt Aperture là chữ ký | `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 7 |
| Vitals trên đường ranh (5 thành phần vỏ) | `docs/design-campaign/dna/WORKSPACE-SPEC-2026-08-23.md` |
| Hai dạng hiện diện trên Home | `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` |
| Khuôn thị giác Siri 3 nấc | `docs/SPEC-APPLE-MOTION-MATERIAL.md` §4b |
| Bản vẽ | `docs/mocks/Vitals.dc.html` · `Vitals glyph.dc.html` — **COMPLETE** |
| F-02 | `docs/design-campaign/02-FAILURE-LEDGER.md` |
| Spec đầy đủ | `docs/SPEC-VITALS-UNIFIED-2026-08-11.md` · `SPEC-VITALS-ROLE.md` · `SPEC-VITALS-VISUAL.md` · `SPEC-VITALS-AI.md` |

**🔴 CHƯA GIẢI:**
- **F-02 chưa sửa** — trạng thái `unknown` chưa tồn tại. Và nó **gộp chung việc** với ca B2 (ba hành
  vi khi chưa đăng nhập): cả hai cần **MỘT chủ sở hữu ngữ nghĩa cho "không đọc được"**. Sửa riêng
  false calm là vá triệu chứng.
- **Ngưỡng "đủ đáng giá"** của một tín hiệu — chưa định nghĩa được ⇒ chưa chặn được card rỗng.
- **Nấc 3 = "chế độ agentic"** (chốt 16/08, đè bản 12/08 *"trang phiên đầy đủ"*): chỗ bày **đồ thị
  chuỗi việc kèm giá + nút duyệt**, không phải màn chat phóng to. **Chưa dựng.**
- **Vitals ở Home ↔ Vitals trong chặng ↔ Vitals trên đường ranh** — ba mô tả từ ba ngày; ràng buộc
  đã ký là *cùng MỘT vật, cùng hình dạng, mỗi màn đúng MỘT Vitals*. Bản đang chạy neo ở header;
  **bản "nút rời cạnh trục phải" chưa dựng.**
