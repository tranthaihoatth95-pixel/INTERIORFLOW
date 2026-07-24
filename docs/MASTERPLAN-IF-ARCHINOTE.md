# MASTERPLAN — Hệ sinh thái TTT: InteriorFlow (IF1 → IF2) + Archinote
> Soạn 24/07/2026 · Kiến trúc sư trưởng điều phối · Nguồn sự thật tiến độ: git + STATUS.md
> Cập nhật khi có quyết định mới. Mọi mục ⏳ = chưa phóng agent, cần user duyệt thứ tự.

## 0 · Tầm nhìn 1 câu
**Một hệ sinh thái thiết kế nội thất TTT**: InteriorFlow là *dây chuyền sản xuất* (CAD → Render → Present), Archinote là *sổ tay + trung tâm tài nguyên của KTS*, nối nhau bằng **Vitals AI** (1 trợ lý xuyên app), **Larkbase** (1 nguồn dữ liệu vận hành) và **TTT Design System** (1 ngôn ngữ hình ảnh).

## 1 · Vấn đề giải quyết (pain → thuốc)
| Nỗi đau thật ở TTT | Ai đau | Thuốc | Ở đâu |
|---|---|---|---|
| "Mười file. Năm tool. Ba lần sếp hỏi chưa xong à?" — dữ liệu vương vãi PPT/CAD/Excel/Zalo | Cả team | 1 file `.idf` chảy qua 3 chặng, không nhập lại | IF1 ✅ |
| Vẽ sơ phác + check quy chuẩn tốn ngày | KTS concept | CAD command-line + standards checker TCVN/QCVN/Neufert/NFPA + AI brief 3 phương án | IF1 ✅ |
| Render đẹp phụ thuộc hoạ viên 3D + máy khủng | CREA | Clay/Sketch→Photoreal fal cloud ~30s/ảnh + upscale 4K | IF1 ✅ (cần fal balance) |
| Deck present làm tay từng trang, lệch brand | Cả team | Presenting editor + ML LayoutShelf + export theo TTT DS | IF1 ✅ |
| Thống kê vật tư/spec đếm tay, nhập lại nhiều lần | Hoạ viên + QS | ProductSpec 1 nguồn → Schedule tự đếm → spec sheet | IF1 ✅ nền / IF2 mở rộng |
| File DWG nhà thầu mở không được trên web | Hoạ viên | LibreDWG WASM + block-flatten | IF1 ✅ |
| Tài liệu dự án phân mảnh, hỏi ai cũng "để tìm lại" | PM + KTS | NotebookLM in-app (RAG + citation) + Vitals auto-smart | IF1 ✅ |
| Ai rảnh ai bận không ai biết, phân việc cảm tính | BGĐ + PM | Archinote PM page: Gantt/Kanban + tải nhân sự + AI đề xuất phân bổ + Lark sync | Archinote ⏳ |
| Kiến thức nội bộ (sách, template, chi tiết kỹ thuật) không có chỗ tra | KTS trẻ | Archinote Home 4 khu tài nguyên | Archinote ⏳ |
| Bàn giao giữa CREA → hoạ viên → BIM mất dữ liệu | Cả pipeline | GATE + snapshot + role lock (relay pipeline) | IF1 nền ✅ / IF2 GATE M2 |

## 2 · IF1 — Bảng tính năng theo chặng (tracking 24/07)
### Chặng 00 · Shell (Login/Gallery/Vitals/Notebook) — ★★★★☆
| Tính năng | Trạng thái |
|---|---|
| Intro cinematic 60s + login kính lỏng + SSO Google/MS/Apple + avatar builder 172k combo | ✅ |
| Gallery card-deck + gesture + ambient glow | ✅ |
| Vitals giọt kính: kéo tầng 1 popover · tầng 2 NotebookLM full · RAG auto-smart (grounded↔general) | ✅ |
| NotebookLM 3 cột: nguồn PDF/ảnh/text/URL → embed 1024d → chat citation | ✅ |
| Dashboard Tổng quan/Bảng/Kanban/Nhân sự + panel Members (5 role) | ✅ |
| ACCESS-CONTROL M1: ProjectMember + GATE role↔stage + PRO_ONLY_TOOLS theo role | ✅ (chờ merge) |
| Chat FULL (project+direct+group, Supabase Realtime) | ⏳ đã mở khoá blocker, chờ phóng |
| Vitals v2 theo spec MIA (orb 5 state, function-calling tạo node, voice, kéo ảnh) | ⏳ spec v2 + Figma |
| Morph login LayoutGroup · Skip avatar · ⌘J | 🟡 nợ nhỏ |

### Chặng 01 · Drafting CAD — ★★★★☆
| Tính năng | Trạng thái |
|---|---|
| Command line (L/PL/REC/C/ROOM/D/H/ZONE/AW…) + 5 layer + Sketch/Pro + DCEL | ✅ |
| DXF import/export · **DWG import + block-flatten** (489/497; van 200k entity) | ✅ (chờ merge) |
| Standards checker TCVN/QCVN/Neufert/NFPA (đề xuất, không tự sửa) | ✅ |
| AI Brief 3 phương án (fix né obstacles + Perceptron placedRatio thật + history) | ✅ (chờ merge) |
| **Tỉ lệ per-sheet** 1:10→1:500 + PDF plot-to-scale + **khung tên TTT song ngữ** | ✅ (chờ merge) |
| **Nền IFC**: storey/elementType + UI gán BIM + XDATA DXF round-trip | ✅ (chờ merge) |
| **Zone tool** (oval/polygon + 6 nhóm VN + legend + aerial + xuất Presenting) | ✅ (chờ merge) |
| **Schedule tự đếm + Legend ký hiệu + ProductSpec** (10 seed) | ✅ (chờ merge) |
| Logic 3-option: thao tác so sánh/trộn phương án chưa tối ưu | ⏳ dặn dò #2 |
| Multi-sheet đầy đủ · comment pin DCEL · block library mở rộng | ⏳ IF2 |

### Chặng 02 · Rendering — ★★★☆☆
| Tính năng | Trạng thái |
|---|---|
| Canvas React Flow 30 node (7 input · 11 AI-gen · 8 AI-edit · 10 utility · 3 output) | ✅ |
| Clay→Photoreal (FLUX Depth ~26s) · Sketch→Photoreal (Canny) · Upscale 4K thật | ✅ (fal cần balance đúng account) |
| 4 mức phụ thuộc AI (cloud/oneAI/tự-host/không AI) + credit server-side | ✅ |
| Video Kling image→video (đã có node, cloud tier 3) | 🟡 chưa wire UI hoàn chỉnh — gộp video plan |
| relight/removebg bản tự-host · WebGPU local | ⏳ bỏ ưu tiên (Mac/1660 không kham) |
| Material legend + palette board (Legend đợt 2) | ⏳ |

### Chặng 03 · Presenting — ★★★★★
| Tính năng | Trạng thái |
|---|---|
| Editor Mẫu/Reference/Motion + filmstrip + brand kit + khổ 16:9/A4/A3 + Present Mode | ✅ |
| Generate slide deck từ text+ảnh học gu · ML LayoutShelf learning-to-rank | ✅ |
| Export PDF/PPTX theo TTT DS + moodboard | ✅ |
| **Cây thư mục kiểu InDesign** (pages/layers tree, tách nhánh AI ↔ máy học ↔ tay) | ⏳ dặn dò #3 |
| Spec sheet Volumen-style + proposal board đánh số (Legend đợt 3) | ⏳ |

### Đường về đích IF1 (thứ tự chốt)
1. ✅→ Merge 8 nhánh (còn 2: cad-core-logic, legend-wave1) + test + db push + seed
2. ⏳ Vitals v2: spec đối chiếu repo + **Figma UI kit** → duyệt → code (Group 4-5 là phần mới)
3. ⏳ Dặn dò: CAD 3-option UX · Presenting tree InDesign · Video editor M1 (timeline ghép render+Kling+title card)
4. ⏳ Chat FULL M1 + Library auto-classify M1 + gói nợ nhỏ A6
5. ⏳ **INSTALLER Windows** (.exe NSIS, user tự tải cài PC-TTTA-008)
6. ⏳ **Video quay màn hình toàn bộ tính năng** (Playwright auto-record + title card TTT) → công bố GĐ1

## 3 · IF2 — Giai đoạn 2 (nền đã cắm sẵn trong IF1)
| Nhóm | Nội dung | Nền IF1 đã có |
|---|---|---|
| IF2-B · BIM/IFC 4.0 | Exporter IFC (IfcOpenShell/Bonsai qua cầu Blender), driver QĐ 258/QĐ-TTg | storey/elementType + XDATA + cầu Blender |
| IF2-C · Viewer 3D web | three.js/web-ifc lazy-load, section cut, clash cơ bản | auto mass-model 2D→3D + cad-to-obj |
| IF2-D · DWG export + LOD | Ghi DWG, LOD/lazy block cho file 400k+ entity | LibreDWG worker + van 200k |
| Collab realtime | CRDT/Yjs đa người 1 bản vẽ + comment pin DCEL | cursors API + DCEL entity |
| Legend "sống" | Schedule/legend tự cập nhật theo bản vẽ (object sống), móc giá Larkbase | ProductSpec + schedule tĩnh |
| Video editor full | NLE đa track, xuất walkthrough | Video M1 + node Kling |
| Gu Engine ML | Học gu từ Reference per-project (không hardcode) | Perceptron + captionImage + taxonomy |
| CAD kỹ thuật mode | Auto-switch theo role+GATE, badge "Coming soon · IF2" | PRO_ONLY_TOOLS role-based |

## 4 · ARCHINOTE — Sổ tay Kiến trúc sư (app chị em)
> Nguyên tắc: **không xây lại gì IF đã có** — Archinote dùng chung auth, Vitals, NotebookLM engine, Larkbase sync, TTT DS. Repo riêng, share package hoặc gọi API IF.

### AN-0 · Nền móng (làm trước, nhỏ)
- Shared auth (cùng user/JWT với IF) · Vitals bridge (tab AI đồng bộ ngữ cảnh dự án từ IF) · TTT DS import.

### AN-1 · Home / Architect Gallery (Hero)
| Khu | Tính năng | Ghi chú |
|---|---|---|
| Sách & Kiến thức | Kho tài liệu nội bộ + link mua sách Amazon | Thanh toán = link affiliate/deep-link ra Amazon (KHÔNG xử lý thẻ trong app) |
| Biểu mẫu & Template | Biên bản họp, biểu mẫu chuẩn TTT DS, export docx/pdf | Dùng lại pipeline export Presenting |
| Kỹ thuật | Thư viện bản vẽ mẫu, chi tiết kỹ thuật, khung tiêu chuẩn | Nối ProductSpec + block library IF |
| Gallery dự án | Import file đầu vào → **NotebookLM engine tự phân loại/chắt lọc ảnh** vào gallery + AI hỏi đáp tại chỗ | Dùng lại RAG + captionImage + taxonomy LIB |

### AN-2 · Dashboard nổi (widget)
- Floating toolbar/widget góc màn hình: To-do + notes · tab **Vitals** (đồng bộ dữ liệu InteriorFlow các dự án) · biểu đồ tải + tiến độ. Chạm để mở, không chuyển trang.

### AN-3 · Quản lý Dự án
- Gantt ⇄ Kanban chuyển đổi (Dashboard IF đã có Kanban nền) · tải nhân sự (ai full/ai trống) · **AI đề xuất phân bổ theo level** · đồng bộ Larkbase 2 chiều (cần LARK_APP_ID/SECRET — user cấp).

### Thứ tự Archinote: AN-0 → AN-1 (Gallery+NotebookLM trước, 4 khu sau) → AN-2 → AN-3. Khởi động SAU khi IF1 đóng gói (installer xong), trừ khi user đổi ưu tiên.

## 5 · Tương lai sản phẩm đạt được (định nghĩa "xong")
- **Hết GĐ1**: 1 bộ cài Windows + PWA; team TTT dựng concept→render→deck trong 1 app, 1 ngày thay 1 tuần; video demo công bố nội bộ; dữ liệu spec/schedule không nhập lại.
- **Hết GĐ2**: hồ sơ DD sơ phác đạt chuẩn nộp (IFC 4.0 theo QĐ 258), xem 3D + clash ngay trên web, nhiều người cùng vẽ, legend/spec sống theo bản vẽ, video walkthrough xuất từ app.
- **Archinote đủ 3 module**: KTS mở 1 app là có tài nguyên + việc + tải team + trợ lý nắm toàn cảnh dự án.
- **EFC dài hạn** (ngoài phạm vi 2 GĐ): CAD engine C++/Skia tách riêng — IF chỉ cần mức DD, không thành CAD pro.

## 6 · Chặn hiện tại
- 🔴 fal balance nạp chưa khớp account key `131feecd-…` — demo AI + video đợi xác nhận.
- 🔴 2 merge cuối (cad-core-logic, legend-wave1) — user chạy tay.
- ⏳ LARK_APP_ID/SECRET/BASE_APP_TOKEN — cần cho AN-3 + Legend móc giá.
- ⏳ Bộ hình giao diện Vitals (user báo sẽ gửi) — chặn bước Figma.
