# BỘ LUẬT VẬN HÀNH & QUY TRÌNH THỰC HIỆN — tổng hợp có cấu trúc (15/08/2026)

> File tổng hợp — KHÔNG phải nguồn sự thật mới, mà là BẢN ĐỒ dẫn tới nguồn sự thật (mỗi mục ghi
> rõ file gốc). Tổ chức theo đúng nguyên lý [T4]/[Đ6] của chính IF: **TỪ TỔNG THỂ → CHI TIẾT**,
> lớn quản lý nhỏ. Sửa nội dung luật → sửa Ở FILE GỐC, không sửa ở đây (đây chỉ là bản đồ).

---

## TẦNG 0 — HIẾN PHÁP (nguồn: `docs/TRIET-LY-IF.md`)
Mọi phiếu/luật/quyết định phải trích được mã điều khoản từ đây. Sửa tầng này = một chốt có ý
thức của Hoà, không trượt dần.

**Cây dọc T0→T8** (tầng sau là hệ quả tầng trước):
| Mã | Tên | Tinh thần |
|---|---|---|
| T0 | Sự thật là chân lý | Không bịa, lệch thì báo không sửa cho đẹp |
| T1 | Một nguồn, nhiều đích | `.idf` là nguồn duy nhất, 2D/3D/Trình chiếu là ống kính |
| T2 | Đồng bộ — một cỗ máy nhiều mặt tiền | Tự chế cơ chế riêng khi đã có khuôn = vi phạm |
| T3 | Trung tính | Không nhúng brand/gu của ai vào lõi |
| T4 | Tổng thể → chi tiết | Cây cấp lớn trước nhỏ sau; làm chi tiết trước khi chốt tổng = lệch số 1 |
| T5 | Con người quyết cuối | AI 2 vai, đích đến LUÔN sửa được, sửa tay không bao giờ bị đè |
| T6 | Đo được mới tin | Xong-máy ≠ xong-mắt; nghiệm thu = mở file đầu ra + kịch bản thật |
| T7 | Chuẩn nghề là sàn, gu là đỉnh | CHUẨN-ĐẦU-RA là luật máy chặn; trên sàn mới tới gu |
| T8 | Bền vững & hữu dụng | Dogfood là cửa nghiệm thu, giá trị dùng được > lý thuyết đẹp |

**2 trục ngang** (cắt qua mọi tầng): **N1** human-centric cho người sáng tạo lai kỹ thuật (7 CẤM
KỴ) · **N2** đơn giản ngoài — sâu trong — sức sâu học từ nghề (2 tầng truy cập, 1 registry lệnh).

**6 điều hành** (luật ban luật): **Đ1** tầng sau = hệ quả tầng trước · **Đ2** nhìn vào trong
trước khi build mới · **Đ3** mọi luật ánh xạ đủ 2 giá trị (giúp-AI-build ↔ người-dùng-cảm-thấy)
· **Đ4** ghim cứng agent–vai trò · **Đ5** 7 cấm kỵ N1 = trục nghiệm thu mắt · **Đ6** phân loại
lớn→nhỏ, group-by mặc định gọn.

---

## TẦNG 1 — QUY TRÌNH ĐIỀU PHỐI T/V/sub-agent (nguồn: `docs/HOP-DONG-PHOI-HOP-T.md`)

**Vai:** Hoà (chủ quyết, nói "chốt", duyệt mắt) · T (điều phối tổng, plan/giao/audit/báo cáo) ·
sub-agent (1 nhánh gia phả, trần = cấp chặng/luồng) · V (phiên RIÊNG, độc lập, chỉ đọc-đối
chiếu-phán, không sửa code).

**Flow chuẩn 8 bước:** Bước 0 soi tổng→chi tiết → Trao đổi → Hoà nói "chốt" (+ phản biện trước
chốt cho việc lớn) → T lập plan (bảng 5 cột + entry registry ngay) → T soạn hợp đồng giao việc
(khuôn 8 ô, §3) → Agent chạy (không git/không server, báo cáo về `docs/bao-cao-phien/`) → T audit
(mở file đầu ra, không tin lời khai suông) → Phiên V kiểm chứng (đếm 3 số: lệch·chu kỳ·làm lại)
→ T tổng kết cho Hoà.

**Bảng sức khoẻ 8 trụ** (T tự vấn mỗi đợt, trụ đói 2 đợt liên tiếp = cảnh báo đỏ): Nền dữ liệu ·
Đấu nối · Luồng nghiệp vụ · Giao diện & design system · Chất lượng đầu ra · Vận hành & an toàn ·
Hiệu năng & bền · Tri thức ngành.

**5 kiểu lệch cấm:** lõi dày tính năng lẻ tẻ không dây · lý thuyết nhiều dùng không được · cái gì
cũng có không cái nào trọn · UI về đích code 0 dòng · code/UI đầy mà đấu nối không.

**2 trạng thái nghiệm thu:** `xong` (máy) ≠ `xong-mắt` (Hoà duyệt) — Cửa chỉ đóng khi nợ mắt = 0.

**Vòng khép kín:** Hoà chỉ 3 chạm/chu kỳ (chốt · duyệt bảng plan · duyệt mắt tại Cửa) — còn lại
tự chạy.

---

## TẦNG 2 — QUY TẮC DỰ ÁN THƯỜNG TRỰC (nguồn: `docs/CLAUDE.md`)

**Luật đóng băng:** tính năng không có mã trong IF-MASTER-TREE → không code · ý mới giữa chừng →
ghi IDEAS-BACKLOG, không code ngay · khám trước khi spec · cột "Code" trong cây là sự thật.

**8 luật vận hành (hiến pháp gốc):** không làm bậc L khi N chưa xong · không tài liệu spec thì
không code · mỗi sprint 1 bậc · tính năng lạc hướng thì cắt không xoá âm thầm · output không id
không ship · con người quyết cuối · không nút thì không AI · AI ra ý định, CODE tính+kiểm.

**Quy tắc gộp tính năng:** "một cỗ máy, nhiều mặt tiền" — luôn hỏi có engine tương tự chưa trước
khi viết engine mới.

**Thói quen Hoà (luôn tuân theo):** chạy một mạch không dừng hỏi giữa chừng · tiết kiệm token ·
mỗi việc lớn 1 commit · tự verify độc lập không tin agent con mù quáng · verify browser thật khi
liên quan UI · báo ngay khi tài liệu sai so với code thật · không tự push origin/main.

**LUẬT CỨNG BÁO CÁO (mới, 15/08):** khuôn 6 phần bắt buộc — Tổng quan → Chi tiết từng mục →
Tổng kết vấn đề → Đánh giá khách quan → Hướng xử lý nhiều góc độ → Đề xuất hướng tốt nhất. Áp cho
MỌI báo cáo, kể cả agent con.

**Hệ trí nhớ 2 lớp (mới, 15/08):** chi tiết đầy đủ theo phiên → `docs/memory/sessions/<ngày>/
<NN-nhánh>/README.md` · bản nén 1 file ghi đè → `docs/memory/LATEST.md`.

**An toàn dữ liệu:** không commit secret · kiểm `.env*`/`uploads/*` trước push · local-first,
không phụ thuộc cloud bên thứ ba cho dữ liệu dự án.

---

## TẦNG 3 — VẬN HÀNH PHIÊN/WORKTREE (nguồn: `CLAUDE.md` gốc repo)

Giới hạn cứng tối đa 5 worktree song song · đặt tên `interiorflow-wt-{nhánh}` · dọn cuối phiên
CHỈ khi đủ 4 điều kiện an toàn (merged + sạch + không server chạy + không branch mồ côi), thiếu 1
điều là DỪNG báo chủ dự án, không force · sau merge vào main: test+tsc pass mới xoá worktree
ngay · trước sprint mới: kiểm `git worktree list`, có worktree cũ thì DỪNG báo · chống tràn
context: STATUS.md dưới 800 từ, không đọc CHANGELOG.md mỗi đầu phiên.

---

## TẦNG 4 — MÁY CANH (soi-*.mjs — chạy đầu/cuối mỗi phiên)

| Máy soi | Canh gì |
|---|---|
| `npm run soi:frontier` | Tính năng đã khai vs code thật, 2 chiều (khai-xong-mà-mất / code-có-mà-sổ-quên) |
| `npm run soi:hinh-hoc` | Thang bo góc/kích thước đúng token đã duyệt |
| `npm run soi:tu-dien` | Tên/thuật ngữ đúng từ điển chuẩn, không lệch định nghĩa |
| `npm run soi:thao-tac` | 36 luật hành vi thao tác (7 cấm kỵ N1 làm tội danh) |
| `npm run soi:contract` | FeatureContract 4 câu (Đọc gì/Ghi gì/Công thức gì/Ai ăn theo) |

Kết phiên: `soi:frontier` + `soi:hinh-hoc` phải 0 lệch mới được nghỉ.

---

## TẦNG 5 — TRUNG TÍNH & PHÁP LÝ (nguồn: `CLAUDE.md` gốc, `docs/AUDIT-BRAND-PII.md`)

IF là sản phẩm ĐỘC LẬP toàn cầu — tuyệt đối không nhúng cứng thương hiệu TTT (hay bất kỳ studio
nào): không logo/tên/màu/font mặc định. Brand Kit thuộc TỪNG DỰ ÁN, không thuộc app. Song ngữ
VI/EN bắt buộc.

---

## CÁCH DÙNG BẢN ĐỒ NÀY
- Cần biết **triết lý/vì sao** một luật tồn tại → Tầng 0.
- Cần biết **quy trình giao việc cho agent** → Tầng 1.
- Cần biết **luật ngày-qua-ngày khi code/báo cáo** → Tầng 2.
- Cần biết **quy tắc worktree/dọn phiên** → Tầng 3.
- Cần **lệnh kiểm tra máy** → Tầng 4.
- Cần biết **ranh giới thương hiệu/pháp lý** → Tầng 5.

*Tổng hợp 15/08/2026 theo yêu cầu Hoà. Không thay thế file gốc — sửa luật thì sửa ở nguồn, rồi
cập nhật lại bản đồ này nếu cấu trúc đổi.*
