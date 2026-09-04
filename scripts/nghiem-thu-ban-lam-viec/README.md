# Bộ đo bàn làm việc — cứu khỏi thư mục bị `.gitignore`

> Cứu 04/09 từ `.nen-kiem/` của lane 04 · DESIGN trước khi gỡ worktree.
> **18 tệp / 950 dòng** — báo cáo của lane chỉ nhắc 8. Đây là lần **thứ hai** trong ngày
> một bộ đo có giá trị suýt biến mất cùng worktree vì nằm trong thư mục bị bỏ qua
> (lần đầu: `scripts/nghiem-thu-home/`). Luật zero-loss §4: *`.gitignore` không có nghĩa
> file không quan trọng.*

## Vì sao đáng giữ

Ba lỗi luồng nghề của lượt 04/09 **không máy soi nào trong repo bắt được** — cả năm máy
(`soi:frontier` · `tu-dien` · `hinh-hoc` · `thao-tac` · `cong-cu-chet`) đều xanh trong khi
người dùng bấm nút thì không có gì xảy ra. Chúng chỉ chết dưới các script ở đây, vì các
script này **đo trên trình duyệt thật**: toạ độ, chồng lớp, `elementFromPoint`, và chuyện
gì còn lại sau khi tải lại.

| Tệp | Đo gì |
|---|---|
| `soi-vi-tuong-tac.mjs` | vi-tương-tác: phần tử bấm được có thật sự nhận được cú bấm không |
| `soi-che.mjs` · `soi-che2.mjs` | **thứ đang che thứ khác** — họ lỗi làm gãy lối vào mode Vẽ 3D |
| `luong-nghe.mjs` | luồng nghề đầu-cuối Home → 2D → 3D → Trình chiếu (kết quả: `luong-nghe.json`) |
| `soi-2d*.mjs` | vẽ tường, kéo, `Enter`, và **tường còn sau khi tải lại** |
| `soi-3d*.mjs` | vào chặng 3D, gạt mode, canvas node |
| `soi-home.mjs` · `do-rail.mjs` · `do-dai*.mjs` | bậc thông tin Home, ba nấc rail, đo màu/kích thước dải nền |
| `soi-present.mjs` | màn Trình chiếu |
| `seed-viec.mjs` · `mk-user.mjs` · `soi-db.mjs` | dựng dữ liệu thật để đo (không đo trên màn rỗng) |

## Chạy

Cần một dev server đang sống và Chromium sẵn có:

```bash
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers   # cấm chạy `playwright install`
export DATABASE_URL="file:$(pwd)/prisma/dev.db"    # bản riêng, xem LUAT-WORKTREE-LANE.md
node scripts/nghiem-thu-ban-lam-viec/luong-nghe.mjs
```

⚠️ Đường Chromium và số cổng **gõ cứng theo máy dựng chúng** — sửa ở đầu mỗi tệp trước khi
chạy nơi khác. Đây là đồ nghề đo, chưa phải bộ nghiệm thu chuẩn hoá như
`scripts/nghiem-thu-g2-hanh-trinh.mjs`.
