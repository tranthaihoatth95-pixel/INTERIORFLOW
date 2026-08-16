# 17/08 · 02 — Chẩn lại DẢI ĐEN Home bằng số đo pixel

> Chẩn đoán cũ (ghi tối 16/08) dựa trên tiền đề **sai** — xem `../01-mo-phien-do-lai-hai-lech/`.
> Bản này đo trên **ảnh chụp thật** `IF-duyet-mat/01-anh/01-01-home-tong-quan-du-an.png`
> (2880×1800, chụp 02:23 ngày 17/08), không suy từ mã.

---

## 1 · Chẩn đoán cũ sai ở đâu

> *"Gốc: lưới trả phần dư **cho hình nền** (chốt A2) nhưng **hình nền CHƯA nối vào Home**."*

Vế sau **sai**: `SystemWallpaper` đã mount từ 16/08, mặc định bật. Nếu tin vế sau, việc tiếp theo
sẽ là *"nối hình nền vào Home"* — tức **dựng lại thứ đã có** (tội N8).

## 2 · Phần dư là CỐ Ý, không phải lỗi

`components/home/DongStudioHome.tsx:328-335` khai rõ (V3, phiếu P-X ④.V3, làm hôm qua):

```
// lưới KHÔNG còn ép cao 100% màn. `bentoFill` co lưới lại khi ô Dự án
// chỉ cần 1 hàng tile; wrapper `items-center` đặt lưới giữa màn, phần dư là HÌNH NỀN.
```

`components/home/widgets/bento-layout.test.ts:123` — **`bentoFillPercent(1) === 76`**.
Hiện có 1 hàng tile ⇒ lưới cao **76%** ⇒ **24% × 900 ≈ 216px** trả cho nền, `items-center`
chia đôi ~108px trên / ~108px dưới. **Đúng ý đồ, đúng chốt A2.**

## 3 · Số đo — và nó chỉ ra một gốc bệnh KHÁC hẳn

Đo thẳng pixel (HSL L), cột x=20 nằm **ngoài** lưới nên là nền thuần:

| y (ảnh 2880×1800) | rgb | HSL L |
|---|---|---|
| 20 | 11,13,14 | **0,049** |
| 300 | 14,16,18 | 0,063 |
| 720 | 19,21,23 | 0,082 |
| 1000 | 23,26,28 | 0,100 |
| **— card `--panel`** | **26,26,30** | **0,110** |
| 1140 | 25,28,30 | 0,108 |
| 1420 | 30,33,36 | 0,129 |
| 1700 | 37,40,44 | **0,159** |

Đối chiếu `lib/wallpaper/sets.ts:149` — `dark.night = [0.05, 0.17]`.
**Nền đang chạy đúng như thiết kế**: dốc từ 0,049 → 0,159, khớp trọn dải khai báo.

## 4 · GỐC BỆNH THẬT

> **Dải sáng của nền ban đêm `[0,05 … 0,17]` ÔM TRỌN độ sáng của card (`0,110`).**

Hệ quả nhìn thấy được:
- **Nửa trên**: nền (0,049–0,10) **tối hơn** card ⇒ phần dư đọc thành **lỗ đen**.
- **Nửa dưới**: nền (0,12–0,16) **sáng hơn** card ⇒ card **chìm** vào nền.
- Card đi từ *nổi* sang *chìm* dọc theo màn ⇒ **không có thứ bậc**, và mắt đọc phần dư thành
  *chỗ trống chưa làm xong* thay vì *nền*.

⇒ Không phải *"nền chưa nối"*, cũng không phải *"nền quá tối"*. Là **nền và card cùng một dải
sáng**. Trong mọi ảnh tham chiếu Hoà gửi 16/08 (kính lỏng trên nền phong cảnh), thẻ **luôn**
phân biệt được với nền — vì nền đứng **trọn một phía**.

## 5 · Vì sao vòng sửa 16/08 không bắt được

`sets.ts:141-147` ghi rõ vòng 2 đã nâng dải tối vì *"mở bản vẽ ra thì năm bộ gần như đen tuyền"*,
và biên trên tính từ **tương phản chữ trên pill kính**.

Cả hai phép kiểm đó đều **thiếu đúng một thứ**: chúng đo nền **một mình** (trên bản vẽ) và đo
**chữ trên nền**, không ai đo **nền so với CARD**. Card mới là vật đứng trên nền suốt màn Home.
⇒ Cùng họ bài học 16/08: *thứ chỉ mắt bắt được thì phải mở ra nhìn* — nhưng nhìn **đúng cặp**.

## 6 · Luật đề xuất (T, chờ Hoà duyệt)

> **Nền phải nằm TRỌN một phía so với card: tối hơn ở MỌI điểm, hoặc sáng hơn ở MỌI điểm.
> Dải sáng của nền không được cắt ngang độ sáng của card.**

Đo được, máy canh được (đọc token `--panel` + dải `NEO_DO_SANG`, so hai khoảng có giao nhau
không) ⇒ đủ điều kiện thành **test**, không phải lời nhắc. Đúng luật 6: *nguyên tắc kiến trúc
chỉ sống khi có máy canh*.

## 7 · Ba hướng sửa

| | Làm gì | Ưu | Nhược |
|---|---|---|---|
| **(a)** | Hạ trần dải đêm xuống **dưới** `--panel` (vd `[0,03 … 0,095]`) — nền **luôn tối hơn** card | giữ trọn ý đồ *phần dư là nền*; card luôn nổi; sửa **một bảng số**, không đụng lưới; đúng ngôn ngữ ảnh tham chiếu | nền đêm bớt cấu trúc — đúng thứ vòng 2 vừa sửa, **phải xem lại bằng mắt** |
| **(b)** | `bentoFill` về 100% — bỏ phần dư | hết dải đen ngay | **hoàn tác việc hôm qua**, trả *trống-quanh-lưới* về thành *trống-trong-ô* |
| **(c)** | Giữ dải nền, **giới hạn phần dư** (vd ≤40px mỗi đầu) | trung dung | không chữa gốc — card vẫn chìm ở nửa dưới màn |

**T đề xuất (a)**: nó chữa **gốc** (thứ bậc nền↔card) chứ không chữa **triệu chứng** (bề dày dải),
không hoàn tác việc hôm qua, và là chỗ duy nhất trong ba hướng đẻ ra được **một luật máy canh được**.

## 8 · Không phải một nấc — TÍNH RA CẢ MA TRẬN

Chạy công thức thật (`bangMau`: `giua ± ((hi−lo)/2) × set.spread`) cho **4 nấc × 5 bộ × 2 theme**,
so với độ sáng card:

**Theme TỐI** — card **đo thật 0,110** (token `--panel` `#141417` = 0,084; chênh vì card là lớp
bán trong suốt **đè lên nền**, nên thứ mắt thấy sáng hơn token):

| Nấc | Bộ CẮT NGANG card |
|---|---|
| `night` | ❌ **cả 5 bộ** |
| `dawn` | ❌ chan-troi · o-cua · tang-sau |
| `day` | ❌ chan-troi · o-cua |
| `dusk` | ❌ chan-troi · o-cua · binh-do · tang-sau |

**Theme SÁNG** — card `#faf8f4` = 0,969: chỉ `day = [0,93 … 0,998]` cắt ngang (**5/5 bộ**);
`night` · `dawn` · `dusk` đều ✅ trọn một phía.

⇒ **Đây KHÔNG phải lỗi của một nấc ban đêm.** Nó là lỗi hệ thống của **bảng neo độ sáng**:
`NEO_DO_SANG` được cân **so với chữ**, chưa bao giờ cân **so với card**. Ảnh chụp 02:23 chỉ tình
cờ rơi vào ô xấu nhất (5/5).

⚠️ **Chưa chắc, khai thẳng**:
- Số card **0,110** đo từ **một** ảnh, **một** bộ (`chan-troi`), **một** nấc. Card đè lên nền nên
  giá trị hiệu dụng **đổi theo chỗ đứng trên màn** — ma trận trên dùng một con số cho cả màn,
  đó là **xấp xỉ**, không phải phép đo từng ô.
- Theme sáng: **0 dòng đo thật**, toàn bộ là tính từ token + công thức.
- **Chưa mở app thật** — ảnh tĩnh không kiểm được lúc nền đang chuyển nấc.
- Luật §6 đề xuất chưa tính tới **card kính** (`backdrop-filter`) — vật trong suốt thì "độ sáng
  của card" **không còn là một con số**. Phải chốt cách đo trước khi biến §6 thành test.
