# PHIẾU PORT GIAO DIỆN — 67 trang mock → code (06/08, vòng M5)

> Vòng M5 **chỉ chẩn đoán**, phiếu này **chưa ai thi công**. Nó trả lời đúng một câu:
> *trong 67 trang `docs/mocks/`, trang nào PORT ĐƯỢC NGAY, trang nào phải sửa trước, và màn
> nào phải VẼ MỚI vì 3 task cần mà bộ mock không có.*
>
> Nguồn số: `npm run check:mocks` chạy 06/08 → **67 trang · 44 ĐỎ · 23 sạch** (10 trang trong
> 67 là bản xuất công cụ thiết kế `.dc`, 57 trang còn lại là bộ mock viết tay).
> GAP tương ứng: `docs/GAP-IF.md` dòng **G-M5-01 … G-M5-15**. Chi tiết đường đi: `docs/M5-OUT.md`.

---

## 0 · Luật port (không thương lượng)

1. **Mock ĐỎ = KHÔNG port.** Sửa mock cho xanh trước, rồi mới port — port trang chỉ-một-theme là
   đẻ lại đúng lỗi màn tối đã ghi trong luật giao diện ②.
2. **Mock lạc hậu hơn code = KHÔNG port ngược.** Gặp ca này thì SỬA MOCK theo code, ghi lại lý do
   ngay trong trang mock. Đã có 2 ca đo được ở §1 (Inspector chặng vẽ, bảng khối lượng).
3. **Một màn chỉ được có MỘT trang hiệu lực.** Trang bị thay thế phải đổi tên `…-CU.html` hoặc
   xoá; hiện có 6 trang cùng tả một màn (G-M5-03).
4. **Không port trang của app song song** (10 trang, G-M5-15) — kiểm tiêu đề trước khi mở.

---

## 1 · Bảng A — 23 trang SẠCH (cửa kiểm không đỏ)

Cột "đích" là **đề xuất**, phiên port phải tự xác nhận bằng grep trước khi động.

| # | Trang mock | Đích đề xuất trong code | Trạng thái đo được 06/08 | Ưu tiên |
|---|---|---|---|---|
| A1 | `InteriorFlow 05 Máy quay.html` | `components/cad/CamPathPanel.tsx` (đã nối) | 🟠 **ĐÍNH CHÍNH 06/08 — dòng này bản đầu SAI.** Hai component KHÔNG mồ côi: `CamPathPanel.tsx` đã ghép chúng và được gắn vào màn vẽ. Lỗi do lệnh grep của phiên trước tự loại chính file gọi (`grep -v CamPath`). Việc còn lại chỉ là **đối chiếu mock ↔ màn đang chạy**, không phải nối dây | 🟢 hạ ưu tiên — KHÔNG phải "món rẻ nhất còn lại" |
| A2 | `mock-if-du-an-v2.html` | `components/ProjectSelect.tsx` | màn có thật, chưa đối chiếu bằng mắt với mock | 🟡 |
| A3 | `mock-cad-shell-v5.html` | `components/studio/CadStageScreen.tsx` · `components/cad/CadEditor.tsx` | **vỏ** port được; **Inspector trong mock đã lạc hậu** (xem A4) | 🟡 — chỉ port vỏ |
| A4 | ~~`mock-cad-shell-v3/v4.html`~~ | — | ✅ **ĐÃ CHỐT chiều 06/08**: bản hiệu lực cho màn 2D là **cặp trang chế độ Chuyên + Phác thảo (06/08)** — 6 trang cũ (gồm cả A3/v5) đã đổi tên `_cu.html`, có chú thích chéo hai chiều. G-M5-03 đóng | ✅ xong |
| A5 | `mock-cad-revit-2026-08-03.html` | `components/cad/RevitSummaryPanel.tsx` + chế độ cấu kiện của `CadEditor.tsx` | mock sạch; là ứng viên gần nhất cho Inspector-cấu-kiện mà T1 cần (G-M5-02) | 🔴 cao (T1) |
| A6 | `mock-if-bang-cong-cu-3d.html` | `components/render-studio/Command3DPanel.tsx` | màn có thật | 🟡 |
| A7 | `mock-material-sphere-2026-08-03.html` | quả cầu xem trước vật liệu — `components/library/LibrarySheet.tsx` + `lib/materials/*` | màn có thật | 🟡 |
| A8 | `mock-if-thu-vien-trong.html` | `components/ui/EmptyState.tsx` + `LibraryPanel` | **đã port 04/08** — dùng làm bản đối chiếu, không port lại | ✅ |
| A9 | `mock-trinh-boq-2026-08-04.html` | `components/present-editor/boq/*` | 🟠 **ĐÍNH CHÍNH — bản đầu đếm sai (7 cột) và kết luận ngược.** Mock có 10 ô tiêu đề và **đi TRƯỚC code**: thêm cột theo ý người dùng · công thức ƒx · truy vết sửa-tay ↔ số-máy (code = 0 chỗ). **Port XUÔI theo mock**, đừng sửa mock theo code. Cái mock còn thiếu: cột số lượng đếm (cái/bộ) | 🔴 cao (T2) — port xuôi |
| A10 | `mock-trinh-video-2026-08-04.html` | trình dựng video chặng Trình bày | chưa đối chiếu | 🟢 thấp (ngoài 3 task) |
| A11 | `mock-mood-collab-g2-2026-08-03.html` | canvas Mood+Collab chặng Dựng ảnh | chưa đối chiếu | 🟡 (T2, bước đưa ảnh vào) |
| A12 | `mock-checkpoint-duyet.html` | `components/studio/Checkpoint.tsx` | màn có thật | 🟢 |
| A13 | `mock-if-3chang.html` | `components/studio/AppChrome.tsx` (khung + chuyển chặng) | chưa đối chiếu | 🟢 |
| A14 | `mock-if-cai-dat-v2.html` | `components/settings/*` | chưa đối chiếu | 🟢 |
| A15 | `mock-avatar-picker-v2.html` · `mock-if-anh-dai-dien-v2.html` | `app/settings/avatar` · `components/avatar/AvatarBuilder.tsx` | ngoài 3 task | 🟢 |
| A16 | `Cài đặt.html` · `Dự án.html` · `Ảnh đại diện.html` · `mock-if-cai-dat.html` · `mock-if-du-an.html` · `mock-if-anh-dai-dien.html` | — | **màn của app song song** (tiêu đề tự khai) — 3 trang cuối mang tiền tố của app này nhưng nội dung là app kia | ⛔ KHÔNG port (G-M5-15) |

---

## 2 · Bảng B — 44 trang ĐỎ: việc phải làm trước khi port

> ✅ **ĐÃ XONG chiều 06/08 — bảng này giữ lại làm lịch sử.** `npm run check:mocks` nay ra
> **57 file · 0 đỏ · 0 lỗi**: 10 trang app song song đã tách sang `docs/mocks/_archinote/`,
> nhóm B1 (bản xuất công cụ thiết kế) đã được giải chữ mẫu thành HTML tĩnh, B2/B3 đã sửa.
> ⚠️ **NHƯNG "0 đỏ" chưa phải "lành"**: còn 6 trang khoá theme sáng vào một tên theme app không
> phát ra · 3 trang còn 62/28/21 chỗ chữ "PLACEHOLDER" lộ ra UI · 8 trang nạp thư viện từ Internet
> · vẫn còn trang trùng tiêu đề. Xem `docs/M5-OUT.md` Phần B §2 và **G-M5-16**.

| Nhóm | Số trang | Lỗi | Việc sửa | Chặn task nào |
|---|---|---|---|---|
| B1 | **10** (`*.dc.html`) | trỏ tệp kịch bản **không có trong repo** + còn 2–58 chỗ chữ mẫu `{{ }}` mỗi trang; trang "Thư viện" còn trỏ **4 trang con không tồn tại** | dựng lại thành HTML tự đủ (đổ dữ liệu mẫu cứng vào), hoặc **loại khỏi bộ mock và ghi rõ đã loại** | T1 (cụm xuất in — G-M5-04), T3 (thư viện) |
| B2 | **19** | thiếu `data-theme` ⇒ chỉ dựng MỘT theme | thêm nhánh theme còn lại, kiểm đủ 2 theme | rải khắp 3 task (G-M5-14) |
| B3 | **15** | `font:` viết tắt nuốt font-family ⇒ chữ Việt rơi về font hệ thống | tách `font-size`/`font-weight` | 3 task |
| B4 | 4 (`mock-an-*`) | (kèm B2/B3) | **màn app song song** — loại khỏi bộ, đừng sửa | — |

Trang ĐỎ nằm ngay trên đường của 3 task, nên sửa trước: `mock-if-thu-vien.html` (T3 — thả đồ),
`mock-2d-ky-thuat.html` (T1/T3), `mock-3d-thong-nhat.html` (T1 — xem lại sau khi sửa),
`mock-if-ai-3d.html` + `mock-render-layout-H3.html` (T2 — đưa ảnh vào),
`mock-trinh-bay.html` + `mock-if-trang-chia-se.html` (T2 — hồ sơ trình khách).

---

## 3 · Bảng C — màn PHẢI VẼ MỚI (3 task cần, bộ mock không có)

Xếp theo thứ tự người dùng gặp, không theo độ khó.

| # | Màn phải vẽ | Task | GAP | Vì sao không hoãn được |
|---|---|---|---|---|
| C1 | **Nhập bản vẽ có sẵn**: chọn tệp → tiến độ → nút huỷ → **báo cáo nạp** (đọc được / bỏ qua / cảnh báo) | T1 · T3 | G-M5-01 | màn ĐẦU TIÊN của cả hai task; năng lực dưới đã có mà không có chỗ hiện |
| C2 | 🟠 **KHÔNG phải vẽ mới — là PORT `mock-cad-revit-2026-08-03.html`** (đã vẽ trọn Inspector tường: đặt theo tim/trong/ngoài · loại dùng chung + vật liệu · dày · cao · dài · hướng · nối tường · danh sách cửa trong tường). Chỉ **vẽ thêm trang CỬA + trang KHỐI + lịch sử sửa** | T1 | G-M5-02 | T1 = sửa 1 cấu kiện; bản đầu của phiếu này nhìn nhầm sang trang CAD shell nên kết luận "phải vẽ mới" |
| C3 | **Phiên bản hồ sơ**: so trước–sau, đánh dấu chỗ sửa, đóng dấu bản phát hành | T1 | G-M5-06 | không có thì bản sửa không giao lại được |
| C4 | **Cửa sổ công cụ bốc tách + đo món** | T2 | G-M5-07 | trục chính của T2 |
| C5 | **Bảng N món** + **hồ sơ nhiều món** (mã · ảnh · hoàn thiện · nhà cung cấp · số lượng · ô duyệt) | T2 | G-M5-08 | đầu ra của T2 |
| C6 | **Cột số lượng (cái/bộ) + cột ảnh** trong bảng khối lượng — lấy đúng hình bảng món đã vẽ ở trang hồ sơ trình khách | T2 | G-M5-09 | thiếu thì báo giá thiếu âm thầm; hiện trang trình khách hứa mà không cửa nào sinh ra được |
| C7 | **Kho vật liệu** · **cửa nhập bảng tính** (ghép cột · xem trước · báo dòng hỏng) · **bảng màu sơn** | T2 | G-M5-10 | ba màn ĐÃ CODE mà chưa từng có hợp đồng |
| C8 | **Màn nhận đề bài** — 🟠 **có bản mẫu tham khảo NGOÀI repo**: một phiếu đề bài + checklist đầu vào dạng HTML nằm trong thư mục dữ liệu thử (`2407-Test/`, gitignore). **KHÔNG bê nguyên vào repo** (dữ liệu khách) — đọc lấy CẤU TRÚC TRƯỜNG rồi viết lại trung tính | T3 | G-M5-11 | bước mở đầu T3 |
| C9 | **Zoning theo chương trình** — 🟠 **đã từng có mock, bị XOÁ**: `docs/mocks/mapa-de-zonas.html` ("Bản đồ chức năng / Nhóm chức năng") bị xoá ở commit `6d6b063` (đợt gỡ tài sản thương hiệu), bản còn sống ở `.worktrees/so-lenh/docs/mocks/`. **Đọc lại trước khi vẽ mới**, nhưng phải soi kỹ vì lý do xoá là trung tính — có thể còn dấu vết cần gỡ | T3 | G-M5-12 | khoảng trống lớn nhất của T3 |
| C10 | **Bảng kết quả kiểm sau bố trí** (lối đi · khoảng cách · diện tích/người) | T3 | G-M5-13 | bố trí xong không nghiệm thu được |

---

## 4 · Thứ tự đề xuất (chờ chốt)

1. **Vá cửa kiểm** `scripts/check-mocks.mjs` — 5 luật còn thiếu, đo được sau khi dọn (G-M5-16):
   tên theme lạ · chữ mẫu không viết bằng `{{}}` · ruột là tên component · phụ thuộc mạng ·
   trùng tiêu đề; cộng luật "trang con thiếu" (G-M5-05) và mở rộng vùng quét (G-M5-17).
2. ~~**Chốt bản hiệu lực cho màn 2D** (G-M5-03)~~ ✅ xong chiều 06/08 — xem A4.
3. **C1 + C2** — hai màn này mở khoá cả T1 lẫn T3, và cả hai đều có năng lực sẵn ở tầng dưới.
4. ~~**A1 (Máy quay)** — mock sạch + component sẵn + 0 nơi gọi: rẻ nhất trong nhóm "nối dây".~~
   🟠 **GẠCH 06/08**: đã nối từ trước (`CamPathPanel.tsx`), phiên trước kết luận sai vì lệnh grep
   tự loại file gọi. Xem lại `docs/PORT-TICKETS.md` để lấy hàng đợi "mồ côi" đã kiểm lại.
5. **A9/C6** — sửa mock bảng khối lượng theo code rồi thêm số lượng + ảnh, kẻo lần port sau kéo
   ngược về "chỉ tính m²".

## 5 · Phiếu này KHÔNG bao gồm

- Không sửa mock, không sửa code, không commit trong vòng M5 (luật V6).
- Không đối chiếu pixel mock ↔ app: mới mở **4 trang** bằng trình duyệt thật
  (`HopXuatPDF.dc` · `Thư viện.dc` · `mock-if-thu-vien` · `mock-cad-shell-v5`), 63 trang còn lại
  mới đọc ở mức mã nguồn + cửa kiểm. Cột "chưa đối chiếu" trong Bảng A nói đúng chỗ đó.
