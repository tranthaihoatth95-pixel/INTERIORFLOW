# 23/08 · DỰNG HAI SKILL QUY TRÌNH — `if-ui-convergence` · `if-handoff`

**Vùng ghi:** chỉ `.claude/skills/if-ui-convergence/` + `.claude/skills/if-handoff/` (+ báo cáo này).
Không `git add`, không commit, không chạm gì khác.

---

## 1 · ĐÃ DỰNG GÌ

### A · `.claude/skills/if-ui-convergence/SKILL.md` — 110 dòng
Quy trình đưa **một bề mặt** đi trọn từ hiện trạng tới hội tụ.

- **§0 · Ba luật khoá cứng** đặt TRƯỚC chuỗi bước, vì chúng là thứ bị phạm chứ không phải thứ bị quên:
  - **L1** bảng bốn tình huống Claude Design (có đích ⇒ thi công · chưa có ⇒ **DESIGN MISSING** trả về ·
    lệch ⇒ sửa **sản xuất** cho khớp đích · DS không diễn đạt nổi ⇒ **cấp hệ thống**, lên Foundation),
    đóng bằng câu cấm: **MAIN không bao giờ âm thầm bịa câu trả lời thị giác còn thiếu.**
  - **L2** bước ⑨ trình duyệt thật là bắt buộc, kèm ca thật 23/08 (tính bố cục bằng số CSS, chưa mở màn,
    ra tường thẻ trắng — *"XẤU"*).
  - **L3** định nghĩa "xong" thành 9 ô tick, thiếu một ô là chưa xong.
- **§1 · Chuỗi 17 bước** đúng thứ tự đề bài. Hai bước được viết dày hơn phần còn lại vì đó là chỗ mất
  thời gian thật: **②truy chủ sở hữu** (route → component canonical → bản sao còn sống; sửa nhầm bản sao
  = sửa xong không thấy gì đổi) và **⑮chứng minh legacy đã chết** (neo vào ca F-01: ghi sổ rồi vẫn sống
  trên app tới 23/08).
- **§2–§3** trỏ sang trọng tài và bàn giao.

### B · `.claude/skills/if-handoff/SKILL.md` — 102 dòng
Bàn giao trước khi cạn context.

- **§1 · Bảng 9 mục bắt buộc**, mỗi mục có cột *"bằng chứng phải kèm"* — ép ghi `tệp:dòng`, lệnh nguyên
  văn, đường dẫn ảnh, chứ không ghi cảm nhận. Thiếu thì phải ghi **là chưa đo**, không bỏ trống.
- **§2 · Ba bẫy**, mỗi bẫy nêu **ca thật + cách tự kiểm**: cổng sai (`:3777` đóng băng · `:3778` bản dựng
  cũ · `:3799` mã hiện tại ⇒ luôn hỏi *"cổng này phục vụ MÃ NÀO"* qua `/api/dev-identity`) · "đã có trong
  mã" ≠ "tới được người dùng" (lý do nút mờ nằm trong `title`) · grep thô nói dối (`uppercase` 6 kết quả,
  cả 6 trong chú thích).
- **§3 · Khuôn đầu ra dán được**, có sẵn ô **⑦b CHƯA CHẮC / CHƯA KIỂM** (trống cũng phải ghi là trống).

---

## 2 · GỌI SANG SKILL NÀO THAY VÌ CHÉP

Luật một-chủ-sở-hữu được giữ nguyên: hai skill này là **quy trình**, không phải kho tri thức.

| Cần gì | Không chép — gọi sang |
|---|---|
| Việc của con người, mọi tri thức thiết kế | skill **`if-design`** (§1 bảng định tuyến, `knowledge/human-centered-design.md`) |
| Khuôn hợp đồng thiết kế | `.claude/skills/if-design/contracts/design-contract-template.md` |
| Chấm PASS/PARTIAL/FAIL, 23 trục | skill **`if-design-review`** |
| Đích thị giác đang hiệu lực | `docs/mocks/CLAUDE-DESIGN-CURRENT.md` |
| Sổ trạng thái bề mặt | `docs/control/IF-CURRENT-STATE.md` |
| Sổ thất bại F-01… | `docs/design-campaign/02-FAILURE-LEDGER.md` |

Cụ thể **không** chép vào skill mới: danh sách 12 luật gốc của `if-design`, bảng định tuyến knowledge,
23 trục soi, thang H1–H4, danh sách lệnh `soi:*`, ranh giới máy↔người. Chỗ nào cần chúng thì trỏ đường dẫn.
Ba ca thật (tường thẻ trắng · cổng sai · `title` câm) được **nhắc lại một câu làm lý do cho luật**, không
chép nguyên khối phân tích — vì luật không có ca thật đứng cạnh thì bị đọc thành lời khuyên.

---

## 3 · ⑦b CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **`docs/control/IF-CURRENT-STATE.md` KHÔNG TỒN TẠI** — `ls docs/control` báo *No such file or
   directory*. Cả hai skill trỏ vào nó. Đã xử bằng cách ghi trong `if-ui-convergence` bước ①: chưa có thì
   tạo ở bước ⑯ và khai *CHƯA CÓ SỔ TRẠNG THÁI*. **Chưa xác minh** ai là người dự định tạo tệp này, hay
   nó nằm ở đường dẫn khác dưới tên khác.
2. 🔴 **Ba số cổng lấy nguyên từ đề bài, chưa đo.** Docstring `app/api/dev-identity/route.ts` ghi bộ ba
   **`:3000` · `:3777` · `:3778`**; đề bài ghi **`:3777` · `:3778` · `:3799`**. Skill chép theo đề bài
   (`:3799` = mã hiện tại). Không chạy `lsof` để xác minh cổng nào đang sống. **Nếu số lệch thì sửa §2·B1.**
   Cơ chế thì chắc — route `/api/dev-identity` có thật và khai đúng `cwd`+`HEAD`+`pid`.
3. **Chưa chạy thử skill nào.** Không có lượt nào dùng `if-ui-convergence` đi trọn một bề mặt để biết
   17 bước có vướng chỗ nào không. Đây là bản viết ra, chưa phải bản đã dùng.
4. **Chưa kiểm skill có nạp được không.** Không chạy `ListSkills`/`SearchSkills` để xác nhận frontmatter
   được nhận và `description` bắn đúng trigger.
5. **Ca thật `uppercase` 6/6 trong chú thích** lấy từ đề bài, **không tự grep lại** để xác minh con số.
6. **Không đọc hết `06-DESIGN-KNOWLEDGE-AUDIT.md`** — chỉ đọc `02-FAILURE-LEDGER.md` (F-01…F-03) và hai
   SKILL.md hiện có. Có thể còn tri thức trong audit trùng với phần đã viết mà tôi chưa thấy.
7. **`git status .claude/skills/` trả rỗng** ⇒ nhiều khả năng thư mục này bị gitignore. Không kiểm tiếp
   vì ngoài vùng ghi; nêu ra vì nó ảnh hưởng tới việc skill có theo repo sang máy khác hay không.
