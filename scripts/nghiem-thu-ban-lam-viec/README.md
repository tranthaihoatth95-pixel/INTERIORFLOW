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

---

## 04/09 — hai bộ đo cho MẶT VẼ 2D (nhận `--url` / `--pid`, không gõ cứng cổng)

| Tệp | Hỏi câu gì | Hiệu chuẩn |
|---|---|---|
| `mat-ve-2d-cham-toi-duoc.mjs` | cú bấm trên mặt vẽ rơi vào ai — mặt vẽ hay một lớp khác? | `--tu-kiem` tự chèn tấm phủ giữa mặt vẽ: phải ĐỎ, gỡ ra phải XANH |
| `vat-lieu-hat-giong-song-sot.mjs` | chọn vật liệu hạt giống → tô → **đóng hẳn trình duyệt** → vào lại: `specId` còn không? | `--tu-kiem` chạy thêm lượt ĐỐI CHỨNG không chọn gì — phải ra `specId` rỗng |

```bash
node scripts/nghiem-thu-ban-lam-viec/mat-ve-2d-cham-toi-duoc.mjs --url=http://localhost:3097 --pid=<projectId> --tu-kiem
node scripts/nghiem-thu-ban-lam-viec/vat-lieu-hat-giong-song-sot.mjs --url=http://localhost:3097 --pid=<projectId> --tu-kiem
```

**Ba điều hai bộ này khác đồ nghề đo cũ trong thư mục**, đáng giữ khi viết bộ mới:
1. **`launchPersistentContext` trên hồ sơ đĩa** — `newContext()` vứt IndexedDB lúc đóng, nên câu
   *"đóng hẳn rồi mở lại"* hỏi bằng `newContext` là **vô nghĩa từ định nghĩa**, không phải đo dở.
2. **Phân biệt FAIL với LỖI**: khẳng định sai ⇒ FAIL (kết luận được); hạ tầng ngã ⇒ **LỖI, không
   kết luận**. Ca thật gặp ngay lượt đầu: dự án chưa có bản vẽ thì chặng 2D **không dựng `<canvas>`**
   — báo "không thấy canvas" mà xếp vào FAIL là đổ oan cho app.
3. **Tách "che THẤY ĐƯỢC" khỏi "che TRONG SUỐT"**: dock kính đè mặt vẽ là thiết kế đã chốt, người
   dùng nhìn thấy nó; hộp bố cục rỗng nuốt chuột mới là lỗi. Gộp hai loại thì máy soi báo quá tay,
   và cách nhanh nhất giết một máy soi là để nó kêu thứ không sửa được.

🔴 **Chỗ `soi:cong-cu-chet --cham` (luật H5) MÙ, đã đo 04/09**: bộ chọn của H5 là
`button, a[href], input, select, textarea, summary, [role=…], [tabindex]` — **không có `canvas`**
⇒ H5 **không bao giờ xét mặt vẽ**. Chạy H5 trên chặng 2D ra 2 ca, cả hai ở màn 3D, 0 ca ở 2D,
trong khi mặt vẽ đang bị **439 điểm** che bởi hộp trong suốt. Đây là lý do `mat-ve-2d-cham-toi-duoc`
tồn tại: nó hỏi câu ngược lại — *"đứng ở điểm này trên mặt vẽ, cú bấm rơi vào ai?"*
