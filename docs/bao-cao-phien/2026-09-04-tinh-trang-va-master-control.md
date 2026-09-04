# TÌNH TRẠNG + MASTER CONTROL — 04/09/2026

> Đo tại nguồn lúc ~08:5x, mốc mã `35265718`. Mọi con số dưới đây là **kết quả chạy máy trong
> phiên này**, không phải số chép lại từ sổ cũ — luật đo-tại-nguồn (rút từ ca `ProjectFile=0`
> và ca `merge-base` rỗng: *máy trả về RỖNG là câu trả lời về PHÉP ĐO trước, về THẾ GIỚI sau*).

## ① MỘT CON SỐ NÓI HẾT

```
👁  1  việc qua MẮT Hoà
✅ 77  việc xong MÁY, đứng chờ
⬜ 56  việc chưa làm
🔴  0  lệch sổ↔code
```

Không phải thiếu người làm. **Van đang khoá ở khâu duyệt mắt.**

## ② CỔNG MÁY

| Cổng | Kết quả | Đọc ra |
|---|---|---|
| `soi:frontier` | **0 lệch** | sổ và code khớp |
| `soi:contract` | 21 có dây · 1 chờ dây · **0 lệch** | hợp đồng tính năng lành |
| `soi:cam-dien` | 91 sống · 8 nội bộ · **2 kho chưa mở (433 dòng)** · 20 tệp mồ côi | mã viết rồi chưa ai gọi |
| `soi:hinh-hoc` | 1066 khai radius · **37 ngoài thang** (11 giá trị lẻ) | nợ cũ, không tăng |
| `soi:thao-tac` | **5 lệch** · 19 luật chờ mắt | ⚠️ tăng — xem dưới |
| `soi:tu-dien` | 316 chỗ chữ trần, không chặn | nợ nhãn, siết dần |
| CI `kiem` | **xanh** trên `35265718` | tsc + test + gate |
| PR #15 | mở · nháp · `mergeable_state: clean` | 442 tệp · +44.025 dòng |

### 5 lệch `soi:thao-tac` — ba cái là MỚI, do thu 11 slice về

| Lệch | Ở đâu | Nguồn |
|---|---|---|
| thiếu `-webkit-backdrop-filter` | `components/ui/Surface.tsx` · `components/SearchProjectsInput.tsx` | slice bộ nền |
| `keydown` không né ô nhập | `components/materials/BaMatPanel.tsx` | slice vật liệu |
| chữ "tự động" trong UI | `components/studio/VitalsEvalPanel.tsx:13` | Slice 12 |
| 32 vòng focus tự chế | 32 tệp | nợ cũ |
| hex viết thẳng | rải rác | nợ cũ |

Thu slice về thì kéo theo vi phạm của slice. Đúng thứ cổng máy sinh ra để bắt, và nó đã bắt.

## ③ MASTER CONTROL — dây chuyền chỉ huy

```
LUẬT NỀN     TRIET-LY-IF · north star N-1…N-20 · Experience System
   ↓                    (hiến pháp — hiếm đổi)
BẢN ĐỒ       INTERIORFLOW-ARCHITECTURE-MAP   ← hướng đi
   ↓         IF-ARCHITECTURE-BLUEPRINT       ← ghép thế nào
   ↓         ADR                             ← thắng cả hai khi cãi
SỔ VIỆC      scripts/frontier-registry.mjs (134 entry, máy đọc được)
   ↓
PHIẾU        docs/phieu-giao/ — khuôn 8 ô + ⓪ tiền đề + ⓪b mốc git
   ↓
THI CÔNG     phiên phụ, khoá phạm vi rời nhau
   ↓
MÁY PHÁN     6 cổng ở bảng ② + tsc + test
   ↓
🔴 MẮT HOÀ   ←──── VAN ĐANG ĐÓNG Ở ĐÂY
   ↓
XONG THẬT    👁 xong-mắt
```

Sáu tầng trên chạy tốt. Tầng thứ bảy là thứ duy nhất máy không thay được.

### Cân vai (phân loại Hoà đặt 12/08)

```
⭐ MVP      37/57  65%   ← lõi khác biệt, dẫn đầu — đúng trọng tâm
🧰 Đỡ       21/36  58%
🔗 Kết nối  20/41  49%   ← đang tụt
```

Kết nối tụt trúng **kiểu lệch cấm #5**: *"code/UI đầy mà backend/đấu nối không"*.
Phải bù ở đợt sau, không để sang đợt thứ ba.

## ④ ĐANG CHẶN — cần Hoà, không cần T

| # | Chờ gì | Chặn cái gì |
|---|---|---|
| 1 | **4 phán quyết mắt** — `vitals` · `h1` · `h2` · `h3` | toàn bộ Home; luật KHÔNG CODE còn hiệu lực |
| 2 | Board 3 lô #1 (chrome/điều hướng) — **chưa từng được phán** | nợ nghiệm thu tồn |
| 3 | 3 mục di sản `LEGACY-RECONCILIATION.md §6` | gác lại sau Home, đúng thứ tự Hoà đặt |
| 4 | ~~Migration tụt sau schema~~ | ✅ **ĐÃ ĐÓNG** — xem đính chính dưới |

### 🔧 ĐÍNH CHÍNH mục 4 — đo lại lúc 09:5x, nó KHÔNG còn mở

Bản đầu của báo cáo này gọi mục 4 là *"nặng nhất trong sổ hiện giờ"*. **Sai — nó đã được đóng
từ 01:15 cùng ngày**, bởi một lane khác trong chính phiên này
(`fd83f343` *"migration bù — migrate deploy dựng đủ 24/24 bảng"*).

Đo lại, không chép:
```
prisma migrate diff --from-migrations → --to-schema-datamodel   ⇒ "This is an empty migration."
CREATE TABLE dựng từ migrations : 24
CREATE TABLE khai trong schema  : 24
bảng schema có mà migrations thiếu : 0
ProductSpec.matId trong migrations : có
```
⇒ Máy chủ mới chạy `migrate deploy` **dựng đủ 24/24 bảng**. Rủi ro phát hành **đóng**.
Blocker 19/08 *"Hoà phải chạy tay Prisma migration cho `ProductSpec.matId`"* cũng đổi bản chất:
tệp migration **đã có sẵn**, việc còn lại chỉ là chạy `migrate deploy` trên CSDL thật — thao tác
thường lệ, không còn phải soạn migration.

🔴 **Bài học của chính lượt này, đắt hơn con số:** trạng thái cũ **tự lan**. Nó nằm trong phần
"Nợ để lại" của PR #15, tôi chép sang báo cáo, rồi báo miệng cho Hoà — **ba lần khẳng định, không
lần nào đo lại**, trong khi thứ đóng nó đã nằm trong repo 8 tiếng. Đúng luật đã ghi:
**đo tại nguồn, đừng nhớ hộ máy** — và "nhớ hộ" gồm cả nhớ hộ chính báo cáo của mình.

## ⑤ SAU KHI HOÀ PHÁN

| Hoà trả | Việc kế tiếp |
|---|---|
| Vitals **Đạt** | mục xong-mắt **thứ hai** sau 19 ngày; mở đường cắm `hinh` vào sổ lệnh |
| Vitals **Sửa** | sửa theo ghi chú, chụp lại, đưa lại cửa — không đụng Home |
| H_ **Đạt** | mở khoá KHÔNG CODE cho **đúng một** hướng, thi công từ bản vẽ đó |
| **Ghép** | dựng **một** bản ghép rồi trình lại, không code trước |
| Cả ba **Sửa** | quay lại tầng nghiên cứu khuôn, không vá bố cục cũ |

## ⑥ HAI VIỆC CHẠY ĐƯỢC SONG SONG, không cần mở khoá Home

1. **Dọn 3 lệch mới** do thu slice — nhỏ, khép kín, không đụng bố cục.
2. **Sinh migration bù** cho mục 🔴 số 4 — gỡ rủi ro phát hành nặng nhất.
   ⚠️ Hoà phải chạy lệnh trên máy thật: sandbox không khoá được file POSIX (luật vận hành §1).

## ⑦ MỌI THỨ CỦA ĐỢT NÀY NẰM ĐÂU

| Thứ | Chỗ |
|---|---|
| Ảnh bằng chứng | `docs/delivery/anh-duyet-mat/lo-01/` · `lo-04-home-system/` |
| Bản vẽ Home | `docs/mocks/mock-home-h{1,2,3}-*.html` |
| Nghiên cứu khuôn | `docs/nc/NC-HOME-KHUON-CAU-TRUC-2026-09-04.md` |
| Bản trình 3 study | `docs/delivery/HOME-SYSTEM-STUDIES.md` |
| Cửa duyệt (dựng lại) | `node scripts/dung-cua-duyet-mat.mjs` |
| PDF (dựng lại) | `node scripts/xuat-pdf-duyet-mat.mjs` |
| Sổ cửa đang mở | `docs/delivery/VISUAL-APPROVAL-QUEUE.md` |
| Đối chiếu di sản | `docs/delivery/LEGACY-RECONCILIATION.md` |
| Mã | nhánh `integration/2026-09-04` → PR #15 |

🔴 **Hai thứ nằm NGOÀI repo, phải biết để không tưởng là đã an toàn:**
· **trang duyệt xuất bản** (artifact) — ảnh nhúng trong đó là bản sao, nguồn vẫn ở repo;
· **phán quyết Hoà bấm** — nằm trong kho `phan-quyet/` của artifact, **không có chuông báo về
  phiên này** (`subscribe_forbidden`), T phải chủ động đọc bằng `read_db`.
