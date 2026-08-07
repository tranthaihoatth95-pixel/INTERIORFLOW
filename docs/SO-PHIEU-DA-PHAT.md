# SỔ PHIẾU ĐÃ PHÁT — chống hai phiên một việc (§0w)
**Append-only.** Mỗi phiếu phát ra ghi MỘT dòng. Trước khi soạn phiếu mới: **đọc sổ này trước.**
Phủ trùng mock/mảng đã phát ⇒ DỪNG, gộp vào phiếu cũ hoặc thu hẹp.

⚠️ **Phủ theo MOCK, không chỉ theo thư mục.** Ca 06/08: hai phiếu khác thư mục
(`components/nodes` vs `components/library`) nhưng **cùng mock "Bảng nút"** ⇒ vẫn đụng nhau.

| Giờ phát | Cửa sổ | Phủ mảng / mock | M-OUT đích | Ghi chú |
|---|---|---|---|---|
| ~15:5x 06/08 | `M1-SUA` | `lib/cad/*` GỐC A+B | `M1-SUA-OUT.md` | |
| ~19:2x 06/08 | (không rõ) | mock **Bảng nút** | `M-NODE-BOARD-OUT.md` | 🔴 **chồng với LÀN A** |
| ~19:4x 06/08 | `3·apply-node` | LÀN A = mock **Bảng nút · Nút tổng · Thư viện** | `M-APPLY-A-OUT.md` | 🔴 **chồng** — tự khai ở `:176` |
| ~19:5x 06/08 | `4·apply-ingiay` | LÀN C = mock HopXuatPDF · BangNetIn · BangTron · ToGiay | `M-APPLY-C-OUT.md` | |
| ~20:0x 06/08 | `2·m1-loi-cad` | `lib/cad/*` `components/cad/*` | `M1-OUT.md` | |
| ~20:1x 06/08 | `1·fix-gocc` | `lib/boq` `lib/ffe` `lib/materials` `components/materials` | `M-FIX-C-OUT.md` | |
| **22:5x 06/08** | **Claude Design** | 3 màn đã vẽ + 5 màn mới (workspace + khách) | `docs/mocks/*.dc.html` | 0 limit Code |
| **22:5x 06/08** | **COWORK-PHU** | `tsconfig.json` + 5 file docs MỚI | `PHU-OUT.md` | 0 limit Code |
| **22:5x 06/08** | `2·m1-loi-cad` vòng 2 | `G-M1-08/04/07/01` — `lib/cad/*` | `M1-OUT.md` PHẦN 4 | |
| **22:5x 06/08** | `1·fix-gocc` vòng 2 | `G-M3-17` + nối nút BOQ/FF&E | `M-FIX-C-OUT.md` bổ sung | dán CUỐI |
| ⏸ HOÃN | `3·apply-node` | `G-A-04/05/01` — mock Thư viện | — | chờ limit reset 11/8 |
| ⏸ HOÃN | `4·apply-ingiay` | nối hộp xuất + bảng tròn + test + `ExternalRef` | — | chờ limit reset 11/8 |

---

## Bản đồ MOCK ↔ ai đã port — tra trước khi giao mock cho ai
| Mock | Đã port bởi | Trạng thái |
|---|---|---|
| `Bảng nút.dc.html` | **HAI phiên** (node-board + apply-A) | ⚠️ đã port, ĐỪNG giao lại |
| `Nút tổng.dc.html` | `3·apply-node` | đã port |
| `Thư viện.dc.html` | `3·apply-node` | ⚠️ còn 4 `dc-import` trỏ file thiếu (`G-A-04`) + cãi chốt 05/08 (`G-A-05`) |
| `HopXuatPDF` `BangNetIn` `BangTron` `ToGiay` | `4·apply-ingiay` | đã port, chưa nối hết |
| `Nhận đề bài` `Bảng món nội thất` `Kết quả chia khu` `Xem cấu kiện` | ⏳ giao Đ2-3 (07/08) | chưa port |
| `Bảng việc` `Lịch · Nhắc việc` `Tiến độ · Gantt` | ⏸ **chờ đợt 3** | chờ model Task của Đ2-1 — port trước là vỏ rỗng |
| `Tổng quan dự án` `Tiến độ dự án` `Lịch việc` (21:46) | chưa ai port | có thể bị 3 màn 22:27 thay thế — TỔNG phải chốt trước khi giao |
| ⏳ soạn 07/08 | `1·fix-gocc` Đ2-1 | `prisma/` `lib/lark` `lib/integrations` `app/api/lark-tasks` | `M-FIX-C-OUT.md` | **phiếu DUY NHẤT được đụng schema** |
| ⏳ soạn 07/08 | `2·m1-loi-cad` Đ2-2 | `lib/boq` `lib/ffe` `lib/materials` `components/materials` | `M-FIX-C-OUT.md` | nối dây engine |
| ⏳ soạn 07/08 | `3·apply-node` Đ2-3 | `components/cad` `sketch` `smartselect` + 4 mock CAD | `M-APPLY-A-OUT.md` | Nhận đề bài · Bảng món · Chia khu · Cấu kiện |
| ⏳ soạn 07/08 | `4·apply-ingiay` Đ2-4 | `components/library` | `M-APPLY-C-OUT.md` | chốt A + cách vào popup |
| ⏳ soạn 07/08 | `5·ba-chieu` Đ2-5 | `lib/three` `components/three` `render-core` `render-studio` `app/dev-bench-3d-2` `app/projects/[id]/render` | `M-3D-OUT.md` | 🔴 **phiếu bù lỗ TỔNG bỏ sót**. CHẶN: phải có `docs/mocks/3D Dựng khối.dc.html` trước |
| ⏳ BƯỚC 0 07/08 | Claude Design | xuất `3D Dựng khối.dc.html` (4 trạng thái) | `docs/mocks/` | dán NGAY, không chờ 11/8 |
| ⏳ soạn 07/08 | phiên KIỂM TRA (bất kỳ cửa sổ rảnh) Đ2-6 | ĐỌC 16 mảng, KHÔNG sửa code | `M-SOI-14-MANG-OUT.md` | 🔴 **phiếu bù thứ hai**. Chỉ đọc ⇒ 0 nguy cơ chồng thư mục |
| 07/08 | `Nhãn và màu StageSwitcher` P0 | `StageSwitcher.tsx` `phases.ts` + 14 nhãn | `M-UI-NHAN-OUT.md` | ✅ xong, kiểm chéo 5/5, còn nợ G-M15-07 |
| 07/08 | `p1. Flow projectId gốc và Task` | `prisma/` `lib/lark` `lib/integrations` `lib/workspace` `lib/*scope*` `app/api/flows` | `M-SCOPE-OUT.md` | 🟢 đang chạy |
| 07/08 | `p2 Kiểm tra 16 mảng code` | **chỉ ĐỌC — 0 thư mục sở hữu** | `M-SOI-16-MANG-OUT.md` | 🟢 đang chạy |
| 07/08 | `p4. Nối UI cho BOQ, xuất` | `lib/boq` `lib/ffe` `lib/materials` `components/materials` `components/print` | `M-FIX-C-OUT.md` | 🟢 đang chạy |
| 07/08 | `p5. thư viện: sửa animation` | `components/library/` | `M-APPLY-C-OUT.md` | 🟢 đang chạy · ⚠️ **P7 đụng thư mục này** |
| ⏸ chờ | P7 Thư viện tổng + `.idfc` | `lib/library` `components/library` `LibraryPanel` `NodeLibraryPanel` `cad-library` `lib/materials` `components/materials` `public/cad-library` | `M-THU-VIEN-OUT.md` | 🔴 **KHÔNG thả khi P5 còn chạy** |
| ⏸ chờ | P3 Mảng 3D | `lib/three` `components/three` `render-core` `render-studio` | `M-3D-OUT.md` | chờ mock |
