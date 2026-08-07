# 00 · ĐANG CHỜ — trạng thái phiếu, cập nhật 07/08 13:xx
**Một nguồn sự thật cho việc đang chờ (§0r).** Đọc file này trước khi hỏi "còn gì chưa làm".
Append-only cho phần lịch sử; bảng trạng thái thì sửa tại chỗ.

---

## BẢNG TRẠNG THÁI — cập nhật 07/08 15:2x

| Phiếu | Việc | Trạng thái |
|---|---|---|
| P0 · giao diện nhãn/màu | `M-UI-NHAN-OUT` 12:44 | ✅ xong · còn nợ `G-M15-07` |
| P2 · soi 16 mảng | `M-SOI-16-MANG-OUT` 13:10 | ✅ xong |
| P5 · thư viện vòng 2 | `M-APPLY-C-OUT` 13:18 | ✅ xong |
| P4 · nối dây engine | `M-FIX-C-OUT` 13:21 | ✅ xong |
| P9 · CAD + hình học | `M-HINH-HOC-OUT` 13:54 | ✅ xong |
| P6 · pháp lý + trung tính | `M-PHAP-LY-OUT` 14:13 | ✅ xong |
| P12 · UI CAD | `M-UI-CAD-OUT` 14:29 | ✅ xong |
| P3 · mảng 3D | `M-3D-OUT` 14:31 | ✅ xong |
| P7 · thư viện + `.idfc` | `M-THU-VIEN-OUT` 14:38 | ✅ xong |
| **P14 · lệnh dựng khối** | `M-BUILD-OPS-OUT` 15:13 | ✅ **xong — đóng `G-M17-02`**, mở `G-M18-01/02` |
| **P13 · khoá nối vật liệu** | — | 🟢 **ĐANG CHẠY** (vừa tạo `resolve.ts` · `pbr-store.ts` · `material-edit.ts`) |
| **P1 · tầng dữ liệu** | 🔴 **KHÔNG có `M-SCOPE-OUT.md`** | ⚠️ **code CÓ làm** (`model Task`+`WorkflowState` ở schema:514,530 · `lib/server/tasks.ts` · `app/api/tasks/`) nhưng **flow mồ côi vẫn 43/44** ⇒ chưa chạm gốc. Cần đòi báo cáo. |
| P8 · Design vẽ 14 màn | chưa dán | ⏸ |
| P10 · Workspace (4 đỏ `G-M8`) | chưa dán | ⏸ chờ P1 xong thật |
| P11 · dọn lẻ | chưa dán | ⏸ |

---|---|---|---|
| **P0** · Giao diện nhãn/màu | `Nhãn và màu StageSwitcher` | ✅ **XONG** — kiểm chéo 5/5. Còn nợ `G-M15-07` (3 chỗ) | — |
| **P1** · Tầng dữ liệu | `p1. Flow projectId gốc và Ta…` | 🟢 **ĐANG CHẠY** | — |
| **P2** · Soi 16 mảng | `p2 Kiểm tra 16 mảng code` | 🟢 **ĐANG CHẠY** | — |
| **P3** · Mảng 3D | *(chưa mở)* | ⏸ **CHỜ MOCK** | Claude Design chưa xuất `3D Dựng khối.dc.html` |
| **P4** · Nối dây engine | `p4. Nối UI cho BOQ, xuất…` | 🟢 **ĐANG CHẠY** | — |
| **P5** · Thư viện vòng 2 | `p5. thư viện: sửa animation…` | 🟢 **ĐANG CHẠY** | — |
| **P6** · Pháp lý + trung tính | *(chưa mở)* | ⏸ **CHƯA DÁN** | **Hoà chưa quyết giấy phép DWG** |
| **P7** · Thư viện tổng + `.idfc` | *(chưa mở)* | ⏸ **CHƯA DÁN** | ⚠️ **đụng P5** — xem cảnh báo dưới |
| **P8** · Design vẽ 14 màn `G-M5` | *(chưa mở)* | ⏸ **DÁN ĐƯỢC NGAY** | — · Claude Design, 0 phiên code |
| **P9** · CAD + hình học (19 đỏ) | *(chưa mở)* | ⏸ **DÁN ĐƯỢC NGAY** | — · `lib/cad` 0 phiên giữ |

> 🚫 **BỎ LUẬT LIMIT 11/08** (Hoà chốt 07/08). Không còn chờ reset. Dán khi sẵn phiếu.

### ⚠️ CẢNH BÁO CHỒNG PHIẾU — P5 và P7 (§0w)
`P5` đang sở hữu `components/library/`. `P7` cũng sở hữu thư mục đó **cộng thêm** `lib/library` ·
`LibraryPanel` · `NodeLibraryPanel` · `cad-library` · `lib/materials` · `components/materials`.
⇒ **KHÔNG thả P7 khi P5 còn chạy.** Hai lựa chọn:
1. **Đợi P5 xong** rồi thả P7 (P7 việc 6 đã gồm nội dung P5 — cách vào + phương án A)
2. Thả P7 NGAY nhưng **cắt bỏ việc 6** khỏi phiếu, ghi rõ "P5 đang làm phần đó"
Cách 1 sạch hơn. Ca hai-phiên-một-việc tối 06/08 sinh ra đúng từ chỗ này.

### Bốn cửa sổ cũ đã ngưng (chấm rỗng)
`1·fix-gocc` · `2·m1-loi-cad` · `3·apply-node` · `4·apply-ingiay` — mẻ 06/08, đã có báo cáo.
Tên phiên mới (`p1`…`p5`) khớp mã phiếu ⇒ đúng §0l, dễ tra hơn tên cũ.

---

## ⏳ BA THỨ ĐANG CHẶN

### 1. `docs/mocks/3D Dựng khối.dc.html` — CHƯA CÓ ⇒ P3 đứng
Lệnh xuất nằm ở `00-SU-THAT-VA-BO-PHIEU §P3 · BƯỚC 0`, dán vào **Claude Design**.
⚠️ Mock đang nằm TRONG cửa sổ Claude Design. **Đóng cửa sổ là mất.**
Truy 07/08: chuỗi "Góc nhìn trục giao" và "Dock công cụ" **KHÔNG có trong repo** ⇒ bản Hoà xem
là bản mới, chưa lưu.

### 2. Quyết định giấy phép DWG — CHƯA QUYẾT ⇒ P6 đứng
`libredwg-web` = **GPL-3.0**. `docs/LICENSE-NOTES.md` miễn trừ dựa trên *"tool nội bộ, không bán"*
— lập luận **chết** với định vị global.
| Đường | Giá |
|---|---|
| Mở mã nguồn IF theo GPL-3.0 | miễn phí, phải công khai toàn bộ mã |
| Mua giấy phép thương mại (ODA…) | tiền/năm, giữ mã đóng |
| Đổi thư viện khác | kéo theo `lib/cad` = **36.296 dòng** |
⚠️ Chọn đường 3 thì phải làm TRƯỚC/CÙNG đợt hình học, không phải sau.
Đọc: `docs/RESEARCH-DWG-LICENSE.md` · `docs/PHUONG-AN-LICENSE-DWG.md`

### 3. ~~Limit Code~~ — 🚫 **BỎ 07/08.** Không còn chờ 11/08.
Còn chặn thật: **P7 phải đợi P5 xong** (chồng `components/library/`).

---

## 📌 CÒN NỢ TỪ P0 (đã xong nhưng lộ 3 chỗ) — `G-M15-07`
⚠️ Ba chỗ rơi vào HAI VÙNG khác nhau — không dán chung được:
| | Chỗ | Vùng | Dán ở đâu |
|---|---|---|---|
| ① | `lib/nodes/defs/render-v2.ts:292` | `lib/nodes/` — **0 phiên giữ** | ✅ **dán ngay được** (phiếu lẻ) |
| ② | `lib/library/types.ts:87,88` | `lib/library/` — **P7 giữ** | ⇒ **P7 việc 10** |
| ③ | `LibraryPanel.tsx:25` + `refingest.ts:45` | **P7 giữ** | ⇒ **P7 việc 10** |
Dán lẻ ②③ bây giờ = tái diễn ca hai-phiên-một-việc 06/08 (§0w).

Chi tiết ba chỗ:
1. **SAI NGỮ NGHĨA** `lib/nodes/defs/render-v2.ts:292` — `'Thiết kế 2D→OBJ extrude'` đọc vô nghĩa;
   câu này mô tả KỸ THUẬT đùn khối, không phải tên chặng. Trả về "CAD→OBJ" hoặc "hình học 2D→OBJ".
2. **SÓT** `lib/library/types.ts:87,88` — `STAGE_META` mới đổi `cad`; `render: 'Render'` và
   `present: 'Present'` vẫn tiếng Anh cụt, phải là "Thiết kế 3D" / "Trình chiếu".
3. **BẤT NHẤT** `components/LibraryPanel.tsx:25` đổi `'CAD / Sketch'→'Thiết kế 2D / Sketch'`
   nhưng `lib/refingest.ts:45` cùng bản chất lại GIỮ `'CAD / Bản vẽ'`. Chọn một chuẩn.

---

## ✅ ĐÃ XONG HÔM NAY 07/08
| | |
|---|---|
| `npx next build` | XANH — 84 route · 46 trang tĩnh · 0 lỗi (lần đầu tiên chạy) |
| Soi 16 mảng (sơ bộ, TỔNG tự quét) | **0 file chết** / ~400 file · 3 lỗ thật → `G-M13-01/02/03` |
| Chẩn đoán 3 chặng | không phải lỗi điều hướng — **41/41 flow mồ côi** → `G-M14-01/02` |
| P0 giao diện | 5/5 việc, đã kiểm chéo |
| Chốt sản phẩm | tên 3 chặng · mode tự bấm chọn · bỏ chữ "CAD" · `.idfc` · gộp thư viện |

## 🔜 VIỆC HOÀ CHƯA LÀM
- [ ] `git commit` — cây dirty, build xanh, lệnh đã soạn (an toàn)
- [ ] Dán lệnh xuất mock 3D vào Claude Design ← **gấp, kẻo mất**
- [ ] Quyết giấy phép DWG
- [ ] Thả **P7** sau khi P5 xong (hoặc cắt việc 6)
- [ ] Thả **P3** sau khi có mock 3D

---

## 📥 ĐÃ GOM 07/08 — 3 dòng bị bỏ sót từ báo cáo 06/08
`docs/M-NODE-BOARD-OUT.md` (phiên chồng phạm vi tối 06/08) có 3 mã **chưa vào sổ**. Nay đã gom,
và kiểm chéo lại từng cái bằng đọc code (N1 — không tin báo cáo):
| Mã | Báo cáo nói | Kiểm 07/08 |
|---|---|---|
| `G-NB-01` dây sai kiểu không nhìn ra | đã đóng | ✅ **đúng** — `FlowCanvas.tsx:400-401` có `bn-edge-bad` + `var(--danger)` + dash |
| `G-NB-02` thiếu kiểu cổng 'vật liệu' | — | ✅ **đã có** — `lib/types.ts` `DataType` nay đủ 7 kiểu gồm `material` |
| `G-NB-03` 3 màu cổng hex cứng | — | 🔴 **mới xong 1/3** — `table` dùng token rồi, nhưng `text:'#38bdf8'` (`:165`) và `video:'#fb7185'` (`:168`) VẪN hex cứng, không đổi theo theme |

4 báo cáo còn lại (`M-FIX-C` · `M-APPLY-A` · `M-APPLY-C`) — **đã gom đủ, 0 sót**.

---

## SỔ GAP — 107 dòng
🔴 **74** · ✅ 13 · 🟡 12 · 🟠 6 · ⚪ 3
