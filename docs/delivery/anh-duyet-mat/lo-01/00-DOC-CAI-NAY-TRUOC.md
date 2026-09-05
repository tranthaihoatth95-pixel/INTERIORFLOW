# ẢNH BẰNG CHỨNG — LÔ DUYỆT MẮT #1 · ảnh chụp 04/09/2026 03:01

> **Đây KHÔNG phải lô trình duyệt.** Đây là **bằng chứng của ba lỗi** khiến lô #1 bị giữ lại.
> Bản trình (khi đủ điều kiện) ở `docs/delivery/VISUAL-REVIEW-BATCH-01.md`.

Chụp trên app thật, đã đăng nhập, khổ **1600×900**, studio thử có **1 dự án · 0 việc đang dở**.
Mốc mã: `4ce173c2`.

## Vì sao phải nằm trong repo
`.nen-chrome-out/` bị gitignore và **đã bị dọn giữa chừng** khi ba lane chạy song song — lô ảnh
`home-that-*.png` của lane Home **biến mất khỏi đĩa** trước khi ai kịp nhìn. Ảnh duyệt mắt là
**deliverable**, mà deliverable chỉ tồn tại khi nó nằm trong repo và git nhìn thấy.
(*Phiên là sức tính, không phải kho chứa.*)

## Ảnh nào cho thấy gì

| Tệp | Đọc ra điều gì |
|---|---|
| `vitals-home-light-ambient.png` | ⭐ **Ba lỗi cùng một khung.** ① Khẩu độ Vitals ở mép trên (giữa, ~x865–975) **nhạt hơn ô tìm kiếm ngay cạnh** — thứ được chốt là *signature interaction* lại là vật mờ nhất trên thanh trên. ② Vùng tiêu điểm (ô `01 DỰ ÁN`) **cao gần hết màn nhưng chỉ có hai thẻ ở góc trên** — khoảng dư nằm BÊN TRONG thẻ trắng, phạm chính luật ① (*"phần dư trả về cho NỀN"*). ③ Thẻ phụ cuối (`05 BẢNG TIN STUDIO`) **bị xén ở mép dưới**. |
| `vitals-home-light-engage.png` | ⭐ **Chỗ đứng ĐÚNG, nhãn SAI.** Bảng Engage **mọc xuống từ chính khẩu độ, tâm trùng tâm** — đúng V3-a và đúng luật hình học *FROM THE CENTER*. Nhưng đầu bảng ghi **"VITALS · THIẾT KẾ 3D"** trong khi đang đứng ở **Home**. |
| `vitals-home-light-peek.png` | Mức giữa — dùng để soi ba mức có ra **một vật đang nở** hay **ba vật khác nhau**. |
| `vitals-home-dark-ambient.png` · `vitals-home-dark-engage.png` | Cùng hai khung trên, nền tối — để đối chiếu khi đo tương phản khẩu độ ở **cả hai nền**. |
| `vitals-files-light-ambient.png` | Khẩu độ **theo sang stage khác** (Files) — xác nhận nó mắc ở `AppChrome`, không phải riêng Home. |

## Ba lỗi, và ai đóng

| # | Lỗi | Gốc bệnh đo được | Ai |
|---|---|---|---|
| 1 | Nhãn chặng sai ở **mọi màn ngoài ba chặng** | `AppChrome.tsx:366` truyền `stage={currentPhase}`; `activeToPhase` (`lib/studio/stage-nav.ts:18-23`) **rơi thẳng vào `return 'render'`** cho mọi thứ không phải cad/photo/present. Kiểu `Phase` chỉ có 3 giá trị nên **không diễn đạt được "không ở chặng nào"** — phải sửa ở tầng kiểu, không vá bằng đoán. | lane Vitals |
| 2 | Ambient gần như vô hình | chưa đo — phải đo tương phản viền/nền khẩu độ với `--bg` ở hai nền, ngưỡng **3:1** (WCAG 1.4.11) | lane Vitals |
| 3 | Tiêu điểm Home trống | `banViecDo = coDuAn && coViecDo`; studio thử **0 việc dở** ⇒ dải Resume — thứ EXS §6 chốt là **HERO** — **không mọc**. ⚠️ **Chưa phân định được lỗi bố cục hay dữ liệu mỏng.** Phải chụp lại trên studio có vài dự án + có việc dở. | phiên chính |

## Bài học ghi lại, vì nó đắt hơn cả ba lỗi
Cổng máy **xanh hết** mà bố cục vẫn không đứng được: tỉ lệ tiêu điểm : cụm phụ đo được **1,62** —
đúng tới hai chữ số thập phân — trong khi vùng tiêu điểm trên màn thật **gần như trống rỗng**.
Số đo trả lời *"hai vùng có đúng tỉ lệ không"*, nó **không** trả lời *"trong vùng đó có gì không"*.
⇒ Đúng luật đã ghi từ 11/08: **frontier nào sinh ra thứ NHÌN ĐƯỢC thì nghiệm thu = MỞ RA NHÌN;
`tsc` · test · số đo KHÔNG đủ.**
