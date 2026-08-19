# InteriorFlow · Thống kê thời gian làm việc + coding

> Số liệu MÁY ĐO từ `git log` HEAD `3da4b8c` (17/08 tối) — không phải khai suông.

---

## 1 · TỔNG QUAN

| Chỉ số | Giá trị |
|---|---|
| **Ngày bắt đầu** | 03/07/2026 18:57 (Initial commit Next App) |
| **Ngày commit cuối (đo)** | 17/08/2026 16:19 |
| **Thời gian dự án** | **~46 ngày** (03/07 → 17/08) |
| **Số ngày CÓ commit** | **46 ngày** — commit HÀNG NGÀY, không nghỉ |
| **Tổng commit** | **1.610 commit** |
| **Trung bình** | **35 commit/ngày** (rất cao — cường độ dày) |
| **Đỉnh 1 ngày** | **154 commit ngày 02/08** |

## 2 · TỐC ĐỘ THEO THÁNG

| Tháng | Commit | Ngày |
|---|---|---|
| 07/2026 | **800** | 29 ngày (03/07 → 31/07) |
| 08/2026 | **810** | 17 ngày (01/08 → 17/08) |

**Nhận xét**: tháng 8 CAO HƠN tháng 7 (810 vs 800 với thời gian ngắn hơn 12 ngày) → **cường độ TĂNG dần**, không giảm.

## 3 · TÁC GIẢ COMMIT

| Tên | Commit | Ghi chú |
|---|---|---|
| **Hoà** | 852 | 52,9% — tài khoản chính |
| **Tran Thai Hoa** | 739 | 45,9% — cùng người, tên khác |
| **Hoa Tran** | 16 | 1,0% — cùng người |
| **Claude** | 2 | 0,1% — commit Claude ký tên (agent con) |
| **InteriorFlow Dev** | 1 | 0,06% |

⇒ **1.607/1.610 commit = 99,8% do Hoà tự chạy** (với AI hỗ trợ trong session). Chỉ 3 commit do agent ký thẳng tên.

## 4 · LOẠI COMMIT

| Loại | Số | % |
|---|---|---|
| **docs** | **621** | 38,6% — TÀI LIỆU nặng hơn code |
| **feat** | **426** | 26,5% — tính năng mới |
| **fix** | **207** | 12,9% — sửa lỗi |
| **merge** | 111 | 6,9% |
| **chore** | 33 | 2,0% |
| **refactor** | 22 | 1,4% |
| **wip** | 8 | 0,5% |
| **perf** | 5 | 0,3% |
| **test** | 4 | 0,2% |
| **frontier** | 3 | 0,2% |

**Nhận xét đắt**: **DOCS > FEAT** (621 vs 426). Đây là dự án **THIẾT KẾ TRƯỚC CODE SAU** — đúng luật §9 Hoà đặt 03/08 *"nghiên cứu xong phải vẽ ngay lên giao diện, tính năng điền vào sau"*.

## 5 · TOP 8 NGÀY HOẠT ĐỘNG CAO NHẤT

| Xếp | Ngày | Commit | Ghi chú |
|---|---|---|---|
| 1 | 02/08 | **154** | Kiến trúc giao diện hạ tầng (SPEC-MODE-PER-STAGE + ref visual + Apple Motion) |
| 2 | 03/08 | 98 | Panel rollout + design system + hàm đo con trỏ + tên 3 chặng |
| 3 | 10/08 | 89 | Chiếu sáng workspace + hình minh hoạ điện ảnh + Design DNA |
| 4 | 19/07 | 87 | (đầu tháng, xây nền) |
| 5 | 14/08 | 68 | NT-1..18 duyệt + DesignSync + ghế Lincoln Trellis + chuỗi P1-P6 |
| 6 | 17/07 | 66 | (đầu tháng, xây nền) |
| 7 | 16/08 | 62 | Đợt giao diện T #2 (bàn giao 5 phiên phụ) |
| 8 | 11/07 | 59 | (đầu tháng) |

## 6 · GIỜ COMMIT — Hoà làm việc như thế nào

```
Giờ  | Commit
---------------
00 h | 43  ▓▓▓▓
01 h | 43  ▓▓▓▓
02 h | 33  ▓▓▓
03 h | 25  ▓▓
04 h | 33  ▓▓▓
05 h | 53  ▓▓▓▓▓
06 h | 79  ▓▓▓▓▓▓▓▓
07 h | 64  ▓▓▓▓▓▓
08 h | 70  ▓▓▓▓▓▓▓
09 h | 91  ▓▓▓▓▓▓▓▓▓
10 h | 91  ▓▓▓▓▓▓▓▓▓
11 h | 56  ▓▓▓▓▓
12 h | 66  ▓▓▓▓▓▓
13 h | 125 ▓▓▓▓▓▓▓▓▓▓▓▓  ← đỉnh
14 h | 101 ▓▓▓▓▓▓▓▓▓▓
15 h | 116 ▓▓▓▓▓▓▓▓▓▓▓
16 h | 60  ▓▓▓▓▓▓
17 h | 60  ▓▓▓▓▓▓
18 h | 64  ▓▓▓▓▓▓
19 h | 72  ▓▓▓▓▓▓▓
20 h | 51  ▓▓▓▓▓
21 h | 64  ▓▓▓▓▓▓
22 h | 64  ▓▓▓▓▓▓
23 h | 86  ▓▓▓▓▓▓▓▓  ← đỉnh phụ đêm
```

**Đọc**:
- **Đỉnh 1: 13-15h** (342 commit) — buổi chiều sau nghỉ trưa
- **Đỉnh 2: 09-10h** (182 commit) — buổi sáng sớm
- **Đỉnh 3: 23-01h** (172 commit) — đêm khuya, gần 11%
- **Đáy: 03h** (25 commit) — chỉ giờ này Hoà nghỉ

⇒ **Làm cả ngày lẫn đêm**. 172 commit trong khung 23-01h = Hoà thường xuyên chốt việc trước khi ngủ.

## 7 · KÍCH THƯỚC CODEBASE HIỆN TẠI

| Loại | Số |
|---|---|
| **Dòng code** (.ts + .tsx) | **232.812** |
| **Số file** (.ts + .tsx) | **1.141** |
| **Số file test** | **849** — tỉ lệ 74,4% file có test |
| **Số file docs (.md)** | **424** |
| **Kích thước docs** | **44 MB** |

**Ghi chú**: chưa tính CSS, JSON, config. Tổng có thể ~250-260k dòng nếu tính đủ.

## 8 · TỔNG KẾT NGƯỜI + MÁY

- **1.610 commit** trong **46 ngày** = **35 commit/ngày** (cường độ cực cao)
- **1.607/1.610 = 99,8% do Hoà đứng tên** — Hoà là người bấm commit, AI ở trong session giúp làm
- **621 docs commit > 426 feat commit** — thiết kế trước code sau (đúng luật §9)
- **74% file có test** — chống hồi quy
- **Không có ngày nghỉ** trong 46 ngày dự án
- **Đỉnh 154 commit/ngày (02/08)** — ngày chốt kiến trúc UI hạ tầng
- **11% commit trong khung 23-01h** — Hoà chốt việc trước ngủ thường xuyên

**Chỉ số cường độ**:
- 1.610 commit ÷ 46 ngày = **35 commit/ngày**
- 232k dòng code ÷ 46 ngày = **5.060 dòng/ngày**
- 424 file docs ÷ 46 ngày = **9,2 file docs/ngày**

Ba con số này cho một dự án **1-2 người** (Hoà + AI trong session) là **cực kỳ cao**.

## 9 · CHƯA ĐO ĐƯỢC

- Thời gian THẬT Hoà ngồi trước màn hình (git chỉ đo lúc BẤM commit, không đo lúc nghiên cứu/vẽ mock/đọc tài liệu)
- Tỉ lệ code Hoà viết tay vs AI trong session viết (khó tách vì Hoà bấm commit cả hai)
- Thời gian bay/đi nghỉ (nhìn khoảng trống commit ra được, nhưng chưa đo)

## 10 · CẬP NHẬT VỀ SAU

Mọi ngày mới commit → chạy lại script grep để cập nhật:
```bash
git log --format='%as' | sort -u | wc -l         # số ngày làm việc
git log --oneline | wc -l                         # tổng commit
git log --format='%s' | sed -E 's/^([a-z]+).*/\1/' | sort | uniq -c    # loại commit
```

---

*Thống kê 19/08/2026, HEAD `3da4b8c` (17/08 16:19). Không nạp commit của ngày 18-19/08 (đang phiên T + chưa commit). Chạy lại khi cập nhật.*
