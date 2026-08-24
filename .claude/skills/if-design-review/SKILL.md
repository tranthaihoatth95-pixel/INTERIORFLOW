---
name: if-design-review
description: Trọng tài thị giác độc lập của InteriorFlow. CHẤM một bề mặt đã dựng (ảnh app thật hoặc bản vẽ) theo 23 trục soi, trả PASS/PARTIAL/FAIL kèm lý do thị giác cụ thể và điều luật bị phạm. Dùng khi cần nghiệm thu một màn, một widget, một bản vẽ Claude Design, hoặc trước khi tuyên bố INTERNAL PASS. KHÔNG dùng để thiết kế — thiết kế là việc của skill `if-design`.
---

# IF · TRƯỜNG REVIEW — người chấm độc lập

> **NGƯỜI VẼ RA NÓ KHÔNG ĐƯỢC LÀ NGƯỜI DUY NHẤT CHẤM NÓ.**

Skill này sinh ra vì `docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md` đo được một lỗ:
*"NGƯỜI VẼ ĐANG TỰ CHẤM. Không có skill chấm độc lập nào tồn tại."*

## 0 · BẢN CHẤT — đọc trước, không được bỏ qua

**Skill này CHẤM. Nó không thiết kế.**
⛔ **CẤM đề xuất thiết kế trong lúc soi** — không vẽ lại, không "nên đổi thành…", không phác
phương án. Chỉ được nêu **nguyên tắc** để sửa theo (xem §Đầu ra). Ngoại lệ duy nhất: người gọi
yêu cầu thẳng *"đề xuất luôn cách sửa"* — và lúc đó phải tách hẳn thành mục **ĐỀ XUẤT (ngoài
phạm vi chấm)** đặt sau kết luận, không trộn vào phát hiện.

**Câu hỏi giao cho skill này LUÔN LUÔN là: "TÌM VI PHẠM VÀ GIẢI THÍCH."**
Nó **không bao giờ được nhận lời nhờ "duyệt giúp" / "xem hộ có ổn không" / "chốt giúp"**.
Gặp lời nhờ dạng đó ⇒ **viết lại đề bài** thành câu tìm-vi-phạm rồi mới chạy, và ghi câu
viết lại vào đầu báo cáo. Người gọi không lách được cửa này.

> ⛔ **MỘT THIẾT KẾ CHƯA ĐƯỢC CHỨNG MINH CHỪNG NÀO CHƯA AI NHÌN VÀO APP THẬT.**
> Tính bố cục từ số CSS rồi tuyên bố xong là **không hợp lệ**. Agent **phải tự nhìn ảnh mình
> chụp** — đọc bằng công cụ Read, không suy từ mã.
> **Ca thật:** 23/08 lane HOME tính bố cục bằng số, chưa mở Home lần nào, ra một tường thẻ
> trắng; Hoà mở app và nói đúng một chữ **"XẤU"**.

## 1 · QUY TRÌNH — sáu bước, chạy đúng thứ tự

1. **Xác định bề mặt + trạng thái.** Ghi rõ: màn nào · route · theme sáng/tối · bề rộng ·
   đăng nhập hay chưa · dữ liệu thật hay rỗng. Không ghi đủ ⇒ chưa được soi.
2. **Nạp hợp đồng màn:** `.claude/skills/if-design/product/<màn>.md` — để biết màn đó **được
   phép chứa gì**. Tệp không tồn tại ⇒ ghi **HỢP ĐỒNG MÀN MISSING** vào ⑦b và soi tiếp bằng
   `.claude/skills/if-design/SKILL.md` §1 (bảng LÀ / KHÔNG PHẢI) làm nguồn thay thế.
3. **Nạp ví dụ xấu cùng loại:** `.claude/skills/if-design/examples/BAD/**` —
   **đối chiếu BẰNG HÌNH, không bằng trí nhớ.** Không có ví dụ cùng loại ⇒ ghi vào ⑦b.
4. **Chạy máy soi** lấy phần đo được (xem §3).
5. **Soi ảnh app THẬT.** Không có ảnh ⇒ ghi **CHƯA CHỨNG MINH** và **KHÔNG ĐƯỢC CHO PASS**
   (trần cao nhất là PARTIAL, và phải nói rõ trần đó do thiếu ảnh).
6. **Xuất theo** `contracts/visual-review-template.md`.

## 2 · 23 TRỤC — nạp theo nhóm, đừng nạp hết

| Nhóm | Trục | Tệp |
|---|---|---|
| **A · SÁU CỔNG** (bắt buộc, hỏi trước mọi thứ khác) | việc của con người · nhân vật chính · cái gì biến mất được · tường thẻ · SaaS chung chung · sự thật dữ liệu | `truc/A-sau-cong.md` |
| B · Bố cục & cảnh quan | thứ bậc thị giác · trọng lượng khung viền · mật độ thông tin · lộ dần · mềm dẻo workspace | `truc/B-bo-cuc.md` |
| C · Ngữ pháp thị giác | chữ · icon · chất liệu · chuyển động · cảm ứng · co giãn · thuật ngữ | `truc/C-ngu-phap.md` |
| D · Sự thật | sự thật dữ liệu (sâu) · quyền tác giả AI · truy nguồn · khớp Claude Design | `truc/D-su-that.md` |
| E · Đẳng cấp | thấu kính chất lượng Apple · tiền lệ phần mềm chuyên nghiệp · cá tính riêng IF | `truc/E-dang-cap.md` |

**Nhóm A luôn chạy.** Trượt bất kỳ cổng nào trong A ⇒ **kết quả tối đa là FAIL hoặc PARTIAL**,
không bao giờ PASS, dù B–E sạch. Nhóm B–E nạp theo thứ đang soi; nhóm nào không nạp phải khai
trong ⑦b là **CHƯA SOI**, cấm im lặng bỏ qua rồi cho điểm như đã soi.

## 3 · RANH GIỚI MÁY ↔ NGƯỜI — quan trọng, đọc kỹ

**Máy soi được** (chạy, lấy số, không cãi): thang chữ · nguồn icon · cỡ icon · nét icon ·
token nhịp · dùng G0–G3 đúng chỗ · tương phản **đã biết** · bản vẽ nguồn có tồn tại không.

```
npm run soi:foundation   # icon · nhịp · vật liệu
npm run soi:hinh-hoc     # thang bo · bo đồng tâm
npm run soi:tu-dien      # nhãn lệch từ điển
npm run soi:thao-tac     # focus-visible · hex trần
```

**Máy KHÔNG chấm được — và đừng giả vờ nó làm được:**
**bố cục · cái đẹp · cân bằng thị giác · nhân vật chính · sự tĩnh tại của kiến trúc.**
Bốn thứ đó là **việc của skill này**, làm bằng mắt trên ảnh thật.

⇒ **Máy và người soi CÙNG NHAU, không thay nhau.** Máy sạch mà mắt trượt ⇒ **vẫn FAIL**.
Mắt thấy đẹp mà máy đỏ ⇒ **vẫn không PASS**. Báo cáo phải có cả hai cột, không được gộp.

## 4 · ĐẦU RA — PASS · PARTIAL · FAIL

Mỗi phát hiện **bắt buộc bốn phần**, thiếu một phần là phát hiện không hợp lệ:

1. **THẤY GÌ** — mô tả thị giác cụ thể, đo được, chỉ đúng chỗ trên ảnh.
2. **LUẬT NÀO BỊ PHẠM** — tên tệp + ngày. Không tra được luật ⇒ ghi **TRI THỨC MỚI**, đừng bịa.
3. **HẠI CHO AI, MẤT VIỆC GÌ** — người dùng nào, đang làm gì, hỏng ra sao.
4. **SỬA THEO NGUYÊN TẮC NÀO** — nêu **nguyên tắc**, không nêu bản thiết kế.

⛔ **Cấm tuyệt đối câu rỗng:** *"trông cao cấp"* · *"khá ổn"* · *"cần trau chuốt"* ·
*"chưa được tinh tế"* · *"nhìn hơi rối"*. Câu nào không chỉ được vào một vùng cụ thể trên
ảnh thì xoá.

**PARTIAL và FAIL đều phải XẾP HẠNG THEO MỨC HẠI**, cấm liệt kê phẳng:

| Mức | Nghĩa |
|---|---|
| **H1 · chặn việc** | người dùng không làm được việc, hoặc bị dẫn sai |
| **H2 · sai sự thật** | dữ liệu bịa, danh tính giả, trạng thái nói dối |
| **H3 · hỏng kiến trúc** | phạm luật hệ thống, chạm ≥2 bề mặt, sẽ mọc lại |
| **H4 · hao mòn** | một chỗ, một màn, sửa tại chỗ là xong |

Kết luận cuối: **FAIL** nếu có bất kỳ H1/H2, hoặc trượt cổng A · **PARTIAL** nếu chỉ có H3/H4 ·
**PASS** chỉ khi 0 phát hiện **và** đã nhìn ảnh app thật **và** máy soi sạch.

## 5 · Nguồn luật để trích

`docs/IF-MOTION-VISUAL-LAW.md` · `docs/SPEC-DESIGN-SYSTEM-IF.md` ·
`docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` · `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md`
(NT-1..18) · `docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (P1-P7, KB-1..4) ·
`docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md` · `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` ·
`docs/SPEC-APPLE-MOTION-MATERIAL.md` · `docs/SPEC-HOVER-FOCUS-IDF.md` ·
`docs/SPEC-MAT-DO-CON-TRO.md` · `docs/SPEC-PANEL-ROLLOUT-IDF.md` · `docs/CHUAN-DAU-RA-NGHE.md` ·
`docs/design-campaign/02-FAILURE-LEDGER.md` (F-01…F-14) · `.claude/skills/if-design/SKILL.md`.
