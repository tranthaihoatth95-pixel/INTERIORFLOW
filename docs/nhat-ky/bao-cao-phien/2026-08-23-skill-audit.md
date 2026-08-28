# Phiên · dựng skill `if-audit` + trí nhớ audit — 23/08

Vùng ghi: `.claude/skills/if-audit/` · `docs/control/IF-AUDIT-MEMORY.md`. Không `git add`, không commit.

## ⓪b TIỀN ĐỀ HẠ TẦNG — PASS
`git log --oneline -1` → `c7f3ac8` · `git rev-list --count HEAD..main` → **0** · nhánh `main`.

## ⓪a TIỀN ĐỀ NGHIỆP VỤ — **BÁC MỘT PHẦN**
Phiếu bảo *"chốt đã ký nằm ở `docs/control/IF-CANONICAL.md`"*. Đo tại nguồn:
**`docs/control/` chưa tồn tại**, `IF-CANONICAL.md` không có ở đâu trong repo.
⇒ Tôi vẫn ghi con trỏ đó vào skill (phiếu là chốt của người giao), nhưng **báo thẳng**: hôm nay
nó là **con trỏ chết**. Đây đúng lớp bệnh đã ghi trong sổ 16/08 — bản đồ mồ côi 19 ngày vì con
trỏ trỏ vào mẩu cụt. Người giao cần hoặc tạo tệp đó, hoặc đổi con trỏ về `docs/00-CHOT.md`.
Tôi **không tự tạo** vì ngoài vùng ghi.

## Đã làm
1. `.claude/skills/if-audit/SKILL.md` — **107 dòng** (< 120). Luật trung tâm + bảng 7 nhãn ở
   đầu · cấm quét dạo · 10 bước truy dấu · 7 bài học mỗi cái kèm ca thật · khuôn đầu ra 5 cột
   bắt buộc có ⑦b.
2. `docs/control/IF-AUDIT-MEMORY.md` — luật trung tâm ở đầu · **PHẦN I** 14 luật phương pháp
   (M-01…M-14) · **PHẦN II** 15 phát hiện (C-01…C-15) mỗi cái một nhãn + trạng thái đã-xử /
   còn-mở / chờ-người · **PHẦN III** bảng hạn dùng theo bản dựng và ngày.

## Ca thật trung tâm — đã tự xác minh, không chép báo cáo
`components/nav/RailDieuHuong.tsx:22` ghi §6.1 cấm tự thu **theo bề rộng cửa sổ**;
`:154` và `:372` thi hành §8 tự thu **khi chuột rời** (có ân hạn, trừ khi ghim / còn focus).
⇒ khác **trigger**, không trái chữ — nhưng trái lý do §6.1 đưa ra. Nhãn đúng: `LUẬT XUNG ĐỘT`,
đưa người quyết; xử như lỗi là xoá một hành vi đã thiết kế có chủ ý.

## Chỗ tôi từ chối làm đẹp bài
Bài học ①  *"nhìn thấy 14px ≠ vùng bấm 14px"* — tôi **không tìm được ca thật** nào trong ledger
hay báo cáo 23/08. Đã ghi thẳng *"chưa có ca thật ghi lại"* trong skill thay vì bịa ví dụ.

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- **`IF-CANONICAL.md` không tồn tại** — skill đang trỏ vào một tệp chưa có. Nêu trên.
- **Số 23/08 "audit báo 3 điểm P0"**: tôi chỉ xác minh được **một** điểm (rail auto-hide) bằng
  `tệp:dòng`. Hai điểm còn lại tôi **không tìm ra bằng chứng tại nguồn** ⇒ trong cả hai tệp tôi
  chỉ nói *"cả ba đều đúng"* như lời phiếu, và **chỉ trích dẫn điểm có bằng chứng**. Ai cần hai
  điểm kia phải đi đo lại.
- **C-04 các dòng `ProjectSelect.tsx:739` · `FlowsPanel.tsx:85` · `WelcomeIntro.tsx:51`** là
  **trích lại** từ `01-CLINICAL-UI-AUDIT.md` (22/08), tôi **chưa mở ba tệp đó**. Đã gắn hạn dùng.
- **Không chạy máy soi nào lượt này** (`soi:cam-dien`, `soi:foundation`) — phiên là việc viết tài
  liệu, không sửa mã. Mọi con số máy soi trong hai tệp đều là **chép có ghi nguồn + ngày**, không
  phải phép đo hôm nay. Đây đúng lỗi *"số chép lại không phải phép đo"* đã ghi sổ 17/08 — nên tôi
  gắn cột hạn dùng thay vì trình bày chúng như số hiện tại.
- **Chưa mở app, chưa nhìn ảnh nào.** Skill này chưa từng được chạy thử lên một ca thật.
- 15 mục C-15 (các lớp mang từ phiên trước) **chưa phân loại nhãn** — cố ý, vì phân nhãn mà chưa
  truy dấu chính là lỗi mà skill này sinh ra để chặn.
