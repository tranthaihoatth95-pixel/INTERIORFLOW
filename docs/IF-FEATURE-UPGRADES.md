# IF Feature Upgrades — Tối đa hoá tính năng đã có

> File này bổ sung cho `IF-FEATURE-SPEC-P1-v2.md` (spec canonical hiện hành).
> Mỗi tính năng ✅ đã hoạt động → đẩy lên mức **Pro** hoặc **Elite**.
> Claude Code đọc file này khi được giao nâng cấp tính năng cũ.

> **⟳ ĐỐI SOÁT 2026-07-17** — mỗi mục đã gắn marker trạng thái *thật* (audit mã nguồn):
> **✅ ĐẠT** = các bullet "Nâng lên" đã build · **⏳ CHƯA** = mới ở mức Basic, bullet nâng cấp chưa làm.
> Kết luận: **chỉ Standards Checker (D1) đã lên Pro**. Phần lớn còn lại vẫn Basic — các
> bullet "Nâng lên" là ý tưởng chưa thực hiện, KHÔNG phải mô tả thứ đã có.

## Thang đánh giá

| Mức | Nghĩa | Ví von |
|---|---|---|
| Basic | Chạy được, test pass | Bản vẽ tay |
| Pro | Mượt, thông minh, có UX tốt | Bản vẽ AutoCAD |
| Elite | Tự động, học được, context-aware | Vượt AutoCAD — chỉ IF có |

---

## A — VẼ & HÌNH HỌC

### A1.1 Wall tool — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Vẽ tường bằng click 2 điểm | + Nhập kích thước realtime khi kéo (dynamic input) |
| | + Preview tường trước khi click xác nhận (ghost line) |
| | + Double-click tường để sửa chiều dài inline |
| | + Kéo đầu tường để resize (stretch handle) |

### A1.2 Room detection — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| DCEL nhận vùng kín | + Auto-label tên phòng theo diện tích + hình dạng (≥10m² + dài/hẹp = hành lang) |
| | + Tô màu nhẹ phân biệt phòng (color-code by type) |
| | + Click phòng → panel hiện: diện tích, chu vi, số cửa, vi phạm TCVN |
| | + Room type suggestion từ Operator profile |

### A1.3 Room area — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Tính diện tích | + Hiện label diện tích giữa phòng (luôn visible, auto-size font) |
| | + Đổi đơn vị: m² / ft² / tsubo (thị trường Nhật) |
| | + Tổng diện tích sàn tự cộng (GFA = gross floor area) |
| | + Tỉ lệ diện tích sử dụng / diện tích thông thuỷ |

### A1.5 Wall join — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Tự nối góc L, T, + | + Hiện rõ kiểu nối (butt joint / miter / overlap) |
| | + Kéo tường mới → tự snap vào tường cũ tạo T-junction |
| | + Xoá tường → tự heal các tường còn lại |

### A2.1–A2.3 Line / Polyline / Rectangle — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Vẽ cơ bản | + Rubber-band preview khi kéo chuột |
| | + Dimension tooltip realtime (hiện mm khi vẽ) |
| | + Double-click polyline → edit vertex (thêm/xoá/kéo điểm) |
| | + Tab key chuyển giữa nhập X,Y tuyệt đối và tương đối |

### A3.1–A3.2 Hatch — Pro → Elite 🟡 MỘT PHẦN (2026-07-17: thumbnail vật liệu ✅ procedural; còn preview-on-canvas/BOQ)
| Hiện tại | Nâng lên |
|---|---|
| Tô hatch + auto boundary | ✅ Palette chọn vật liệu visual (thumbnail **procedural**, không phải tên code) — E1.2, xem CLOSEOUT |
| | + Preview hatch trước khi apply (hover = thấy ngay) |
| | + Scale hatch tự theo tỉ lệ bản vẽ (1:50 vs 1:100) |
| | + Hatch gắn với Material Library → click = xem giá + nhà cung cấp |
| | + Đổi hatch = tự cập nhật BOQ |

### A4.1–A4.3 Move / Copy / Rotate — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Thao tác cơ bản | + Kéo thả trực tiếp (không cần chọn tool trước) |
| | + Copy kèm smart spacing (giữ khoảng cách đều) |
| | + Rotate snap 15° mặc định, giữ Shift = tự do |
| | + Move kèm alignment guides (đường dóng tự hiện) |

### A4.11 Undo / Redo — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Undo/Redo cơ bản | + Undo history panel (danh sách hành động, click để nhảy) |
| | + Undo theo nhóm (vd: "undo toàn bộ thay đổi phòng ngủ") |

### A5.1–A5.2 Snap — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Grid + Endpoint | + Visual indicator: vòng tròn xanh khi snap thành công |
| | + Snap priority: endpoint > midpoint > intersection (tránh nhảy loạn) |
| | + Snap distance setting (toggle gần/xa) |
| | + Temporary override: giữ phím tắt để tắt snap tạm |

### A5.7 Ortho — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Khoá ngang/dọc | + Toggle nhanh bằng phím F8 (quen thuộc từ AutoCAD) |
| | + Hiện đường dóng khi ortho đang bật |
| | + Kết hợp polar tracking: ortho + 45° |

---

## D — KIỂM TRA QUY CHUẨN

### D1.1–D1.6 Standards checker — Pro → Elite ✅ ĐẠT (đã lên Pro: severity + click-to-locate + fix wizard)
| Hiện tại | Nâng lên |
|---|---|
| 15 test, detect vi phạm | + Severity level: 🔴 nghiêm trọng / 🟡 cảnh báo / 🔵 gợi ý |
| | + Click vi phạm → zoom tới vị trí trên CAD |
| | + Fix wizard: "Bếp < 10m² → kéo tường ra 300mm?" → 1 click apply |
| | + Rule enable/disable (checkbox từng quy chuẩn) |
| | + Badge count trên panel: "3 vi phạm, 5 cảnh báo" |

### D2.1–D2.2 Checker UI — Basic → Pro ⏳ CHƯA (real-time có; floating panel + history chưa)
| Hiện tại | Nâng lên |
|---|---|
| Liệt kê vi phạm + tô đỏ | + Floating panel luôn hiện (không phải mở menu) |
| | + Real-time: sửa tường → vi phạm tự biến mất |
| | + History: "đã sửa 12 vi phạm hôm nay" (motivation UX) |

---

## F — AI & HỌC MÁY

### F1.1 Operator profile — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Nhận diện residential/office/hotel | + Confidence bar visual: "residential 78% | office 15% | hotel 7%" |
| | + Manual override + feedback: user sửa → model học |
| | + Sub-type: residential → apartment / villa / townhouse |
| | + Auto-apply ruleset theo type (villa cho phép diện tích lớn hơn) |

### F1.2–F1.4 Gu Engine — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Style extraction + mood + prompt | + Gallery moodboard visual: 6 ảnh reference tự sinh |
| | + Style comparison: "phong cách bạn vs phong cách đề xuất" |
| | + Persist per project: mỗi dự án lưu Gu profile riêng |
| | + Team style: TTT house style làm baseline, dự án override |

### F2.1–F2.4 Perceptron — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Pairwise ranking + serialize | + Visual A/B: hiện 2 layout side-by-side, user chọn |
| | + Explain why: "Layout A tốt hơn vì: lối đi rộng hơn, bếp gần cửa" |
| | + Team model: gộp feedback từ nhiều designer TTT |
| | + Cold start: pre-train từ Neufert best practices |

---

## G — CỘNG TÁC & XUẤT BẢN

### G1.1–G1.5 Pipeline — Pro → Elite ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| CAD→Render→Present + handoff | + Progress indicator: "Bước 2/3 — Đang render..." |
| | + Preview thumbnail trước khi chuyển stage |
| | + Back-link: từ Present slide → click quay lại đúng phòng trên CAD |
| | + Batch render: render tất cả phòng 1 lần |

### G2.1–G2.2 DXF — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Import/Export cơ bản | + Import: preview trước khi load (hiện outline + layer list) |
| | + Import: auto-detect wall layer vs furniture layer vs text |
| | + Export: chọn layer nào xuất (không xuất layer draft) |
| | + Export: embed metadata IF vào DXF comment (round-trip) |

### G1.5 Multi-sheet — Basic → Pro ⏳ CHƯA (persist Sprint 2 xong; rename/reorder/duplicate chưa)
| Hiện tại | Nâng lên |
|---|---|
| Tab ≤5 sheet | + Rename tab (double-click đổi tên) |
| | + Reorder tab (kéo thả) |
| | + Duplicate sheet (clone layout) |
| | + Sheet template: "thêm sheet Mặt bằng bố trí nội thất" |
| | + Persistence: nhớ chính xác trạng thái từng sheet (Sprint 2 đang làm) |

---

## H — TIỆN ÍCH

### H3.1–H3.4 Auth — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| Google OAuth + Remember Me | + Loading screen branded TTT (logo + progress bar) |
| | + Session indicator: "Đăng nhập với hoang@ttt.vn" ở góc |
| | + Auto-save draft: mất mạng → không mất bản vẽ |
| | + Logout confirmation: "Bạn có thay đổi chưa lưu" |

### H2.1 Duplicate remove — Basic → Pro ⏳ CHƯA
| Hiện tại | Nâng lên |
|---|---|
| DCEL tự clean | + Manual scan button: "Dọn bản vẽ" → báo cáo: đã gỡ X nét trùng |
| | + Auto-run khi import DXF (DXF thường có nét trùng) |
