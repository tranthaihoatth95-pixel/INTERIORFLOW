# CẮT PHẠM VI — 3 ngày ship IF1

> Hoà cần xong trong 3 ngày. Tôi phải nói thẳng một điều trước: **kế hoạch 8-sprint tôi dựng hôm
> qua là kế hoạch SAI cho ràng buộc này.** Nó trả lời câu "làm sao cho IF hay", không phải "làm sao
> ship được trong 3 ngày". Nếu chạy nó, hết 3 ngày sẽ có giao diện đẹp hơn và **vẫn không ship được**.
>
> Trong repo **đã có** `KE_HOACH_3_NGAY_SHIP_IF1.md` (v1.0, 28/07) — và nó đúng hơn kế hoạch của tôi
> cho tình huống này. Dưới đây là đối chiếu blocker của nó với code thật, cộng phần cắt.

---

## 1 · BỐN BLOCKER — đối chiếu code thật, không tin báo cáo

| # | Blocker | Trạng thái thật | Bằng chứng |
|---|---|---|---|
| **B1** | Backup tự động | ❌ **CHƯA** | `buildIfpack()` có (`lib/cad/ifpack.ts`) nhưng **không có `setInterval` nào** — chỉ gọi tay từ `CadSheets.tsx`. Đây chính là việc bị rơi khỏi Sprint 1 khi Sprint 1 được định nghĩa lại |
| **B2** | Xuất được ra định dạng phổ thông | 🟡 **một nửa** | `RenderIOMenus.tsx` có đường tải xuống; nhưng nút **"In 300dpi" vẫn khoá** (`2.2.76` chưa làm). Xuất được PNG, chưa xuất được bản in |
| **B3** | Không mất việc khi crash | 🟡 **cần kiểm** | `lib/save-status.ts` · `lib/resume.ts` · `lib/sheets-persist.ts` đều có, nhưng **grep `setInterval` trong đó = 0 kết quả** → autosave có thể đang chạy theo sự kiện, không theo chu kỳ. Phải thử tay: sửa 5 phút rồi kill tab |
| **B4** | Trung tính thương hiệu | ❌ **CHƯA — 44 chỗ** | 44 lần chuỗi `TTT` trong **file sẽ ship** (đã trừ test), rải **25 file** kể cả `lib/server/auth.ts`, `app/layout.tsx`, `lib/cad/model.ts`, `components/entry/LoginScreen.tsx` |

**Hai blocker đỏ, một vàng.** Kế hoạch v1.0 ghi rõ: *"Thiếu bất kỳ cái nào = không ship."*

---

## 2 · CẮT — danh sách đóng băng, không bàn lại

**KHÔNG làm trong 3 ngày này** (dù đã có mã trong cây, dù rẻ, dù Hoà đang muốn):

| Cắt | Vì sao |
|---|---|
| `2.2.69` + `2.2.85` đổi tên 45 node + bỏ font mono | Không ai mất dữ liệu vì font mono. Đẹp hơn ≠ ship được |
| `7.3.30` gom `/settings` 4 nhóm | " |
| Toàn bộ Sprint 2 (Present UX: toolkit, gộp Photo-editor, tách AI/manual) | Chặng Present **không phải chặng mạnh nhất**. Kế hoạch v1.0 nói đúng: cắt về **chặng CAD (~68%)** |
| Sprint 3-8 (4 nhóm cross, bento, gói combo, preflight, cộng tác, kho mẫu…) | Không cái nào là blocker |
| Vitals visual mới (`2.2.84`) | Đẹp, không chặn |

**Ba ngày này chỉ có 5 việc.** Mọi thứ khác đóng băng.

---

## 3 · LỊCH — bám kế hoạch v1.0, gắn mã thật

### NGÀY 1 — bịt rủi ro mất dữ liệu

| Việc | Mã | Mức tối thiểu chấp nhận |
|---|---|---|
| **B1 backup tự động** | (mã mới, vd `4.20`) | `setInterval` gọi `buildIfpack()` mỗi 10 phút + mỗi lần lưu tay → ghi ra thư mục thứ 2, **giữ 5 bản gần nhất**. Không cloud, không UI đẹp, không cần cấu hình |
| **B3 kiểm autosave + khôi phục** | — | **Thử tay trước, đừng đọc code:** mở CAD, vẽ 5 phút, kill tab, mở lại. Còn việc → ✅ tick, ghi 1 dòng bằng chứng. Mất việc → sửa, đây thành blocker |
| **B2 mở đường xuất bản in** | `2.2.76` (rút gọn) | **Chỉ làm phần rẻ**: tự chèn `ai.upscale ×4` vào đường xuất + mở khoá nút "In 300dpi". **BỎ** phần `2.3.62` tách sân khấu Present — quá lớn cho 3 ngày |

**Cổng cuối ngày 1**: B1 xong, B3 có bằng chứng thử tay, B2 xuất được 1 file PDF ≥300dpi thật.
Chưa xong → **cắt thêm, không kéo sang ngày 2.**

### NGÀY 2 — trung tính + đóng gói + tự thử

| Việc | Mức tối thiểu |
|---|---|
| **B4 trung tính, 44 chỗ / 25 file** | **Không cần refactor kiến trúc tenant.** Chỉ cần: chuỗi hiển thị `TTT` → đọc từ 1 file config duy nhất (vd `lib/tenant.ts` với `BRAND_NAME`). Chỗ nào là **comment** thì bỏ qua — không ship ra mặt người dùng. Chỗ nào là **tên biến nội bộ** (`STAGE_TINT`, `ttt-*` css var) cũng bỏ qua. **Chỉ sửa chuỗi người dùng ĐỌC ĐƯỢC** |
| Ghi nợ trung tính | Chỗ nào buộc phải hardcode vì gấp → ghi ngay vào `docs/TECH-DEBT-NEUTRALITY.md`: chỗ nào · vì sao · hạn gỡ |
| Đóng gói + cài trên **máy khác** | Kế hoạch v1.0 nói đúng: bước này hay bị bỏ và **luôn** lộ lỗi |
| **Hoà tự chạy 1 task thật từ đầu đến cuối** | Hoà là người dùng thử số 1, không phải đồng nghiệp |

### NGÀY 3 — giao 2-3 người + mở vòng lặp

Bám nguyên mục 3-4-5 của `KE_HOACH_3_NGAY_SHIP_IF1.md`: hướng dẫn 1 trang (**có mục "chưa làm
được gì"**), cài cho 2-3 người, ngồi cạnh xem 30 phút đầu, lập `FEEDBACK-LEDGER.md`.

---

## 4 · Ba điều tôi khuyên đọc kỹ trong kế hoạch v1.0 — đừng bỏ

1. **Luật lưới an toàn**: người dùng thử **vẫn làm task theo cách cũ song song**. IF là cách thứ hai.
   Nói rõ từ đầu — họ thử thoải mái hơn, Hoà không gánh rủi ro trễ việc thật của họ.
2. **Không chọn người khó tính nhất** để thử bản đầu. Để dành.
3. **Luật SOP hoá**: chỉ viết SOP cho cả công ty khi quy trình chạy trơn **≥2 lần với ≥2 người**.
   Một lần thành công có thể là may.

---

## 5 · Một cảnh báo về ràng buộc 3 ngày

`KE_HOACH_3_NGAY_SHIP_IF1.md` là file **chưa commit** — Claude Code cố ý loại khỏi 2 commit gần nhất
vì nó nằm ngoài phạm vi đợt sửa. Nếu 3 ngày này bám theo nó thì **commit nó vào ngay**, để nó là
nguồn sự thật chứ không phải file rời trên máy.

Và nói thẳng phần khó: **B4 với 44 chỗ / 25 file là việc dễ vỡ nhất** — nó chạm `lib/server/auth.ts`
và `app/layout.tsx`. Nếu đến trưa ngày 2 mà chưa xong, **cách cắt đúng là hạ chuẩn B4**, không phải
kéo ngày: chấp nhận `TTT` còn trong core, ghi vào `TECH-DEBT-NEUTRALITY.md`, và **chỉ ship nội bộ
TTT** (đúng đối tượng đang chờ) — vì trung tính thương hiệu chỉ thật sự chặn khi bán ra ngoài, không
chặn khi giao cho chính TTT dùng thử.

Đây là chỗ tôi nghĩ kế hoạch v1.0 hơi cứng: B4 là blocker của **bán ra ngoài**, không phải blocker
của **bản dùng thử nội bộ**. Hoà cân lại — nhưng nếu hạ chuẩn thì phải ghi nợ, không được lặng lẽ bỏ.

---

*Cowork, 30/07/2026. Đọc trực tiếp `KE_HOACH_3_NGAY_SHIP_IF1.md`, `lib/cad/ifpack.ts`,
`lib/save-status.ts`, `lib/resume.ts`, `lib/sheets-persist.ts`, `components/studio/RenderIOMenus.tsx`,
grep 44 chuỗi `TTT` / 25 file ship. Mã `4.20` là ĐỀ XUẤT.*
