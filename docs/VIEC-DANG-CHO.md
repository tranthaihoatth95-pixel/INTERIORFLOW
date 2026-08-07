# VIỆC ĐANG CHỜ — nguồn sự thật (chống trôi, §0r)
### Cập nhật 06/08/2026 · TRUNG TÍNH · chat là kênh, đây là NGUỒN

Chi tiết paste-block chạm data khách → `2407-Test/` (không chép vào đây).

---

## 🔒 ĐÃ CHỐT 06/08 — Hoà quyết trực tiếp
- **CỘNG TÁC NHIỀU NGƯỜI = CÓ.** SyncWork phải chạy nhiều người thật (không phải xem một mình).
  ⇒ `G-M8-02` chuyển từ "chặn, chờ quyết" sang **"chờ chọn hạ tầng + soạn brief"**.
  Repo nay **0 dep realtime** (`grep -na "yjs\|liveblocks\|socket.io\|partykit\|pusher\|ably"
  package.json` = 0) ⇒ phải chọn nền trước khi vẽ. Chi tiết:
  `docs/AUDIT-WORKSPACE-SYNCWORK-2026-08-06.md` §2.

## 🔴 NGAY — Hoà chạy tay (sandbox không làm được)
- **Migrate 2 cột `room` + `confidence`** — mở khoá `G-M3-08`. Đã khai trong `schema.prisma`
  nhưng `sqlite3` xác nhận **DB chưa có cột**. ⚠️ **Tắt hết dev server trước khi chạy**:
  ```bash
  cd ~/Downloads/interiorflow && sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-truoc-cot-room'" && npx prisma db push && npx prisma generate
  ```
  Chạy xong mới được bật `SPEC_ROOM_COLUMN_READY` (3 chỗ đã ghi sẵn ở `lib/server/specs.ts:8-27`).
  ⛔ Bật cờ khi **chưa** migrate = vỡ ngay lần ghi đầu + hỏng truy vấn `ProductSpec` của phiên khác.

- **Dán bảng lệnh Claude Design theo ĐỢT** — `docs/BANG-LENH-DESIGN-CHIA-DOT.md`.
  Khối nền → đợt 1 → xem file → đợt 2… (lượt gộp 11 màn một mạch đã hư ở màn thứ 5, §0m).

## 🔴 NGAY — chờ Hoà quyết
- **Kanban ghi ngược nguồn dữ liệu?** `G-M8-01` — nay chỉ đọc. Không mở đường ghi thì SyncWork
  chưa phải "lớp việc". Cần Hoà giao 1 phiên code (`lib/lark/*` + `components/dashboard/*`).

## 🟡 SAU khi 4 phiên fix ghi OUT
- **Gộp M0**: `docs/M{1..5}-OUT.md` + `GAP-IF.md` → `S0-OUT.md` để TỔNG đọc một lần, xác nhận đỏ
  nào đóng THẬT (kèm kiểm phản biện), cập nhật cây gia phả (chấm đỏ→xanh).

## 🟢 GIỮ — thả khi ĐỎ IF xong (một mẻ)
- **M6·archinote** — khảo sát, map như IF (chưa xây). → `docs/ARCHINOTE-MAP.md`
- **M7·larkbase** — connector đầy đủ (nay pull-only). Data khách → `.idf`, không vào repo.
- **BOOST** — mở lại M1·M2·M3 nối nốt orphan (Gốc B/D/E/G) một mẻ, song song M6/M7.

---

## ĐANG CHẠY (đã dán)
- M1 Gốc A (danh tính+elementType) + B · M3 Gốc C (món rời/BOQ/FF&E) + B · M4 Gốc H+avatar · M5 Gốc F

## Luật gắn mọi phiếu
BƯỚC 0 grep-trước (N7) · mỗi Code phóng agent cloud (1 làm 1 kiểm) · V6 người-commit ·
đóng đỏ phải chứng minh THÀNH TÍNH NĂNG (N6).

## 🟢 GIỮ — mảng WORKSPACE/SyncWork (TỔNG cầm, không va phiên nào)
- **Brief Claude Design mảng Workspace** — chia đợt ≤8 màn (§0m), CHỜ chốt 2 câu 🔴 NGAY ở trên.
  Lỗ thật: Gantt=0 · 6 màn có ruột chưa có vỏ (`G-M8-03`, `G-M8-04`).

## ✅ ĐÃ XONG (giữ vết)
- 06/08: **dọn trung tính `lib/` — ĐÓNG, đã kiểm.** `grep -rina` tên khách: `lib/`=0 · `components/`
  `app/`=0 · `git ls-files`=0 · `docs/CHOT-DIEN-TICH-*.md` không còn trên đĩa. Hit còn lại chỉ ở
  `docs/` + `.worktrees/*/docs/` — **§0h miễn trừ `docs/`**. (Dòng cũ ghi "10 chỗ" đã lạc hậu.)
- 06/08: audit mảng Workspace/SyncWork → `docs/AUDIT-WORKSPACE-SYNCWORK-2026-08-06.md`; sửa 3 chấm
  sai trên `BANDO-PHU-THIET-KE-IF.html`; thêm `G-M8-01..05` vào `GAP-IF.md` (§0u — một ngòi bút)
- 06/08: bản đồ tổng + cây gia phả IDF → docs/BAN-DO-TONG-IDF.html · CAY-GIA-PHA-IDF.html
- 06/08: avatar trung tính hoá (hex TTT gỡ) + 2 lỗi logic (da 1 biến, nón→tóc) + test khoá
- 06/08: vòng chẩn đoán 5 phiên → 55 GAP → 8 gốc (GAP-IF.md)

## 📌 GỘP 4 M-OUT — 06/08, TỔNG gộp một ngòi bút (§0u)
Nguồn: `M1-OUT.md` · `M-FIX-C-OUT.md` · `M-APPLY-A-OUT.md` · `M-APPLY-C-OUT.md`.
Sổ `GAP-IF.md` nay **78 dòng**: 🔴 52 · ✅ 11 · 🟡 10 · 🟠 4 · ⚪ 1.

⚠️ **Đỏ TĂNG dù 4 phiên đều làm được việc** — vì hôm nay thêm **13 dòng GAP mới** (12 đỏ):
`G-M8-01..05` mảng Workspace · `G-M9-01..03` hệ sinh thái · `G-A-01/04/05` từ LÀN A ·
`G-C-01/02` từ LÀN C. Không phải tệ đi — là **nhìn thấy nhiều hơn**.

**Vừa chuyển KHỎI đỏ (7):**
- ✅ đóng thật, verify trình duyệt: `G-M3-05` · `G-M3-06` · `G-M3-07`
- 🟡 đóng mức engine/file, **CHƯA bấm được trên UI ⇒ chưa đạt N6**: `G-M3-09` · `G-M3-11` · `G-M3-04`
- 🟠 không đóng được như phiếu mong: `G-M3-01`

**Còn đỏ đáng chú ý:** `G-M3-08` (chờ migrate ở trên) · `G-M1-08` poché hồ sơ nhập
(0/126–161 mảng tô có đường bao để neo) · `G-M1-04` zoom · `G-M1-07` cây lồng 5 cấp.

## ✅ ĐÓNG 06/08 — `G-M3-08` nghiệm thu XONG
Hoà chạy migrate + lệnh kiểm trên máy thật, kết quả nguyên văn:
`room = "Phòng ngủ Master" | confidence = "measured"` · `lọc theo phòng đếm được: 1` ·
`đã xoá bản ghi kiểm`. ⇒ Đủ N6, chấm ✅.
**Nửa còn lại tách thành `G-M3-17`** (cửa nhập chưa ghi xuống DB) — đã giao ở phiếu vòng 2.

## ⚪ `dev.db` rác ở gốc repo — KHÔNG TỒN TẠI
Báo cáo `3·apply-node` nêu file `dev.db` 0 byte ở gốc. Hoà chạy `rm` → *No such file*.
TỔNG kiểm lại: `ls dev.db` → không có. ⇒ **báo cáo phiên sai hoặc file đã bị xoá trước đó.**
Ghi lại đúng tinh thần N1: *báo cáo của phiên không phải bằng chứng* — kể cả báo cáo tốt.

## 🟠 RÁC GÂY NHIỄU — `tsc` toàn repo đang đỏ 3 file, KHÔNG file nào thuộc việc đang làm
- `2407-Test/M3-out/t2-boq.ts` · `t2-run.ts` — import bằng **đường dẫn tuyệt đối** `/Users/tranben/...`
  ⇒ đỏ ở mọi máy khác. `2407-Test/` là thư mục gitignored (data khách) mà vẫn nằm trong tầm `tsc`.
  Cách gọn: thêm `2407-Test` vào `exclude` của `tsconfig.json`.
- `lib/cad/render-layer-index.test.ts:36` — ép kiểu `Viewport` thiếu `panX`/`panY` (lỗi có sẵn).

⚠️ Hệ quả: phiên sau chạy `npx tsc --noEmit` sẽ thấy đỏ và tưởng mình làm hỏng. Dọn 3 chỗ này
là **dọn nhiễu cho mọi phiên**, không phải việc riêng của ai.

---

## 🌙 CHỐT ĐÊM 06/08 · 23:00 — TỔNG gộp xong

**Sổ `GAP-IF.md` nay 83 dòng:** 🔴56 · ✅12 · 🟡10 · 🟠4 · ⚪1.
Thêm `G-M10-01..04` gộp từ `PHU-OUT.md` (§0u — một ngòi bút).

### 🔴 PHÁT HIỆN LỚN NHẤT ĐÊM NAY — `G-M10-01`
**IF không có `model Task` nội bộ nào.** Chỉ có bản sao CHỈ ĐỌC từ nguồn ngoài.
⇒ Đây là **gốc chặn kép**: Kanban không ghi ngược được, Gantt không có gì để dựng.
⇒ **Mọi việc thuộc lớp VIỆC của SyncWork đều chặn ở đây.** `G-M8-01` và `G-M8-03` phải xếp sau nó.

Trước đêm nay ta tưởng thiếu *màn*; hoá ra thiếu *dữ liệu*. Vẽ giao diện Gantt/Kanban tiếp
mà không có model Task thì vẽ xong không nối được vào đâu.

### Đã dán / chưa dán
| Cửa sổ | Trạng thái | Bằng chứng |
|---|---|---|
| Claude Design | ✅ chạy | 11 file `.dc.html` |
| COWORK-PHU | ✅ **6/6 việc** | `PHU-OUT.md` + 5 spec + `tsconfig.json` đã có `"2407-Test"` |
| `2·m1-loi-cad` | ✅ chạy | `M1-OUT.md` 22:51 (26.5 KB) |
| `1·fix-gocc` | ✅ chạy | `M-FIX-C-OUT.md` 22:56 (38.8 KB) |
| `4·apply-ingiay` | ✅ chạy | `M-APPLY-C-OUT.md` 22:56 (27.2 KB) |
| `3·apply-node` | ⏸ **CHƯA dán** | `M-APPLY-A-OUT.md` vẫn 22:37 — **cố ý hoãn**, giữ limit |

### Còn sót — 1 việc, cố ý hoãn
**`3·apply-node` vòng 2** — `G-A-04/05/01`. Phiếu soạn sẵn ở
`docs/PHIEU-CODE-3-PHIEN-2026-08-06.md`. Dán khi limit reset **11/8**.

### ⚠️ LỖI TỔNG MẮC 23:00 — ghi lại (HG6)
TỔNG kiểm PHU lúc **22:59** bằng `ls docs/PHUONG-AN-CAU-IDF.md` → không thấy → báo Hoà
*"PHU sót VIỆC 6"* và bảo dán lại. **File ra lúc 23:01** — chỉ chậm 2 phút. PHU đã làm đủ
6/6 và đã báo xong; TỔNG bắt dán thừa một lần.
⇒ Gốc: kiểm bằng **tên file TỔNG tự đặt trong phiếu**, không đọc **báo cáo thật** (`PHU-OUT.md`
mục "VIỆC 6" nằm ngay ở dòng 103). Đúng ca **N1** — *báo cáo của phiên không phải bằng chứng,
nhưng KHÔNG đọc báo cáo còn tệ hơn*. Và đúng **N7** — chỉ báo gần đúng cho kết luận sai.
⇒ **Chặn:** trước khi kết luận một phiên "sót việc", phải `grep "VIỆC N" <phiên>-OUT.md` TRƯỚC,
rồi mới kiểm file. Báo cáo là nguồn thứ nhất, file trên đĩa là nguồn xác nhận — không đảo thứ tự.

### GAP bổ sung từ VIỆC 6 (`G-P-06`, `G-P-07` → TỔNG gộp)

### TỔNG còn nợ — sửa 3 chỗ sổ lệch (`G-M10-03`)
`LICENSE-NOTES.md §5` · `mocks/README-mocks.md` · đánh dấu bản chốt cặp mock trùng.
Không gấp, làm khi rảnh.

### Sáng dậy đọc theo thứ tự
`PHU-OUT.md` → `SPEC-REALTIME-SYNCWORK.md` + `SPEC-GANTT-DATA.md` → `KIEM-KE-MOCK` →
`PHUONG-AN-LICENSE-DWG.md` → 3 `M-OUT` vòng 2.

**V6 — chưa ai commit. Sáng Hoà commit một phát.**

## 🔒 CHỐT 07/08 — Thư viện bố cục = PHƯƠNG ÁN A
Giữ tấm **720px** · cột thông số **chỉ hiện khi đang chọn** (trượt vào từ phải, 180–220ms) ·
cột kệ **214px**. Chi tiết + lý do bác B/C: `docs/00-CHOT.md` mục "CHỐT 07/08".
⇒ Gỡ mục "chờ Hoà" ở `M-APPLY-A-OUT.md` §A3.6 điểm 4.
⚠️ Điều kiện: chuyển cảnh phải ÊM. Bật cụp là hỏng cả phương án.
