# BÁO CÁO PHIÊN · LT — he-luat-thao-tac (P3 Hệ Luật Thao Tác) — 13/08/2026

> Phiếu: `docs/phieu-giao/he-luat-thao-tac.md` · Vai LT, cấp F build-tooling [Đ4].
> Điều khoản ruột trích: [T6] máy soi 2 chiều · [N1]+[Đ5] 7 cấm kỵ = tội danh · [T0] khai thật · [Đ2] chưng cất không sáng tác.

## ① File tạo/sửa (đúng VÙNG FILE, không ra ngoài)
| File | Việc |
|---|---|
| `scripts/thao-tac-registry.mjs` | MỚI — kho 36 luật: **17 grep + 19 mắt**, mỗi luật có `toiDanh`/`nguon`; 3 kiểu điều kiện soi (`can:true` bắt buộc · cấm · `mauCo/mauThieu`) |
| `scripts/soi-thao-tac.mjs` | MỚI — máy soi cùng họ soi-frontier: grep 2 chiều exit 1 + BẢNG NỢ NGHIỆM THU MẮT nhóm theo tội danh [Đ6]; tự bỏ qua 2 file registry/soi |
| `package.json` | đúng 1 dòng `"soi:thao-tac": "node scripts/soi-thao-tac.mjs"` cạnh họ soi (:19) |
| `docs/HE-LUAT-THAO-TAC.md` | MỚI — 47 dòng: cơ chế · 7 tội danh · kỷ luật thêm luật · cách đọc output |
| `docs/bao-cao-phien/2026-08-13-LT-he-luat-thao-tac.md` | báo cáo này |

KHÔNG đụng: code app (lib/components/app) · frontier-registry (entry `he-luat-thao-tac` chờ T flip theo ô ⑧) · git · dev server · dep.

## ② Số luật theo tội danh (đếm bằng máy, con số thật)
| Tội danh [N1] | grep | mắt |
|---|---|---|
| 1 Lỗi giao diện | 4 | 4 |
| 2 Xài hoài không ra chất lượng | 0 | 1 |
| 3 Lỗi thao tác | 9 | 6 |
| 4 Cảm giác GIẢ | 1 | 1 |
| 5 Gò ép | 0 | 2 |
| 6 Không group-by | 0 | 2 |
| 7 Thẩm mỹ kém | 3 | 3 |
| **Tổng** | **17** (≥15 ✓) | **19** (≥10 ✓) |

Nguồn chưng cất: SPEC-HOVER-FOCUS · SPEC-PANEL-ROLLOUT · SPEC-APPLE-MOTION-MATERIAL · SPEC-MAT-DO-CON-TRO · SPEC-DESIGN-SYSTEM-IF §2/§2c/§2e · LUAT-GIAO-DIEN-BAT-BUOC L4 · CHOT-TACH-AI · TICKET-FIX-KINH K1/K3/K4 · 00-CHOT (card rời 07/08, X2, mục 10 tay cầm, phím tắt 10/08, THỨ-ĐÃ-TỒN-TẠI) · TRIET-LY-IF [N2][Đ6]. Không sáng tác luật ngoài nguồn [Đ2].

## ③ Nghiệm thu tự làm — kết quả THẬT
- `node scripts/soi-thao-tac.mjs` chạy không crash, in đủ 2 khối, exit 1 (có lệch thật) ✓
- `npx tsc --noEmit` exit 0, không lỗi mới ✓ (package.json không vỡ)
- `npm run soi:frontier`: **2 LỆCH — cả hai KHÔNG do LT gây, đều thuộc T flip**:
  1. `he-luat-thao-tac` "CODE CÓ RỒI mà sổ ghi chưa" — chính việc phiên này, phiếu ô ⑧ ghi T flip sau audit.
  2. `grounded-render` cùng thông báo — `lib/grounded-render/*` + `lib/nodes/defs/grounded-render.ts` do **agent song song** (phiếu `grounded-render-v0.md`) đáp xuống trong lúc LT chạy; LT không đụng lib/ (git status xác nhận LT chỉ chạm 5 file ở ①). Ghi để T flip, LT không tự sửa frontier-registry.

## ④ Output lần chạy đầu — dán nguyên văn

```
HỆ LUẬT THAO TÁC — soi-thao-tac 2026-08-13
────────────────────────────────────────────────────────────────────────────────────────────────────
  ✅ reduce-motion-thang
  ✅ token-mat-do
  ✅ override-cam-ung
  🔴 kinh-webkit-prefix — [tội 1 · Lỗi giao diện]
     LUẬT: File dùng backdrop-filter PHẢI kèm -webkit-backdrop-filter (thiếu = tablet không blur)
     NGUỒN: TICKET-FIX-KINH-LONG-2026-08-02 K3
     ↳ 18 file CÓ /backdrop-filter|backdropFilter/ mà THIẾU /-webkit-backdrop-filter|WebkitBackdropFilter/:
        components/cad/CamPathControlPanel.tsx
        components/cad/CamPathPanel.tsx
        components/cad/PlanPresentPanel.tsx
        components/cad/RevitSummaryPanel.tsx
        components/cad/ZonePanel.tsx
        … +13 file nữa
  🔴 outline-can-focus-visible — [tội 3 · Lỗi thao tác]
     LUẬT: Bàn phím = chuột: file bỏ outline phải có :focus-visible thay thế (vòng focus accent)
     NGUỒN: SPEC-HOVER-FOCUS-IDF §3.6
     ↳ 31 file CÓ /outline:\s*none|outline-none/ mà THIẾU /focus-visible/:
        components/AnnotateModal.tsx
        components/ChatPanel.tsx
        components/CommandPalette.tsx
        components/Dashboard.tsx
        components/FlowsPanel.tsx
        … +26 file nữa
     ↳ 1 file CÓ /outline:\s*none|outline-none/ mà THIẾU /focus-visible/:
        app/globals.css
  🔴 keydown-ne-o-nhap — [tội 3 · Lỗi thao tác]
     LUẬT: Phím tắt toàn cục không kích hoạt khi đang nhập chữ — listener keydown toàn cục phải né INPUT/TEXTAREA/contentEditable
     NGUỒN: Chốt hệ phím tắt toàn app 10/08 (00-CHOT)
     ↳ 12 file CÓ /(window|document)\.addEventListener\('keydown'/ mà THIẾU /INPUT|TEXTAREA|isContentEditable|isTyping|isEditable/:
        components/home/DongStudioHome.tsx
        components/home/widgets/VitalsPill.tsx
        components/materials/MaterialImpactPreview.tsx
        components/photo-editor/DocCanvas.tsx
        components/present/PresentViewer.tsx
        … +7 file nữa
     ↳ 1 file CÓ /(window|document)\.addEventListener\('keydown'/ mà THIẾU /INPUT|TEXTAREA|isContentEditable|isTyping|isEditable/:
        lib/useDismissable.ts
  🔴 cam-chu-tu-dong — [tội 4 · Cảm giác GIẢ về nội dung]
     LUẬT: CẤM chữ "tự động" trong UI — AI đoán phải mang dấu Magic, không tự xưng chắc chắn
     NGUỒN: CHOT-TACH-AI-VA-CHINH-TAY §1
     ↳ 17× vi phạm (mẫu cấm /'[^'\n]*[Tt]ự động[^'\n]*'|"[^"\n]*[Tt]ự động[^"\n]*"|>[Tt]ự động</):
        components/LibraryPanel.tsx:61
        components/LibraryPanel.tsx:118
        components/LibraryPanel.tsx:147
        components/LibraryPanel.tsx:193
        components/cad/CadEditor.tsx:421
        … +12 chỗ nữa
  ✅ cam-auto-hide
  ✅ tam-noi-tai-cho
  ✅ tam-khong-fade-opacity
  🔴 cam-hex-inline — [tội 1 · Lỗi giao diện]
     LUẬT: Màu qua CSS var app — cấm hardcode hex trong inline style của component
     NGUỒN: LUAT-GIAO-DIEN-BAT-BUOC L4 + SPEC-DESIGN-SYSTEM-IF §2e.1
     ↳ 193× vi phạm (mẫu cấm /:\s*'#[0-9a-fA-F]{3,8}'/):
        components/CommentLayer.tsx:194
        components/CommentLayer.tsx:235
        components/CommentLayer.tsx:236
        components/CommentLayer.tsx:244
        components/CommentLayer.tsx:277
        … +188 chỗ nữa
  ✅ so-tabular-nums
  ✅ dong-lop-chung
  ✅ tay-cam-panel-chung
  ✅ chuot-phai-filemanager
  ✅ esc-dong-lop
  ✅ nhip-ease-apple
────────────────────────────────────────────────────────────────────────────────────────────────────
👁 BẢNG NỢ NGHIỆM THU MẮT — 19 luật chỉ soi được bằng mắt (không tính lệch):
  · Tội 1 — Lỗi giao diện:
    👁 chu-khong-nhay — Chữ không nhảy khi thẻ lift/scale — chữ giữ vị trí tương đối, không scale riêng chữ  (SPEC-HOVER-FOCUS-IDF §3.2)
    👁 kinh-phai-portal — Panel kính nổi PHẢI portal ra body — cấm kính lồng trong chrome kính (menu xuyên thấu)  (TICKET-FIX-KINH-HEADER-2026-08-02 K4)
    👁 fade-kinh-self-opacity — Fade kính = self-opacity trên chính element kính — fade wrapper cha giết backdrop-filter  (TICKET-FIX-KINH-LONG-2026-08-02 K1)
    👁 kinh-la-vo — Kính là VỎ không là RUỘT: chỉ lớp nổi tạm thời; panel cố định nền đặc; chữ trên kính đọc được CẢ 2 theme  (SPEC-APPLE-MOTION-MATERIAL §0 + §1)
  · Tội 2 — Tính năng xài hoài không ra chất lượng:
    👁 mot-hanh-dong-ra-chuan — Mặc định = bản CHƯNG CẤT cách người pro làm — một hành động ra kết quả chuẩn; chiều sâu collapse, không mất  (TRIET-LY-IF [N2])
  · Tội 3 — Lỗi thao tác:
    👁 hover-vao-cham-ra-nhanh — Hover vào chậm ra nhanh: hover-out ngắn hơn hover-in ~30% (200ms vào → 140ms ra)  (SPEC-HOVER-FOCUS-IDF §3.5)
    👁 tablet-khong-giau-sau-hover — Cảm ứng không có hover — thông tin/chức năng chỉ hiện khi hover PHẢI có đường khác (bấm giữ, nút sẵn)  (SPEC-HOVER-FOCUS-IDF §3.7)
    👁 rollout-3-co-che — Rollout: bấm cả thanh tiêu đề = thu/mở · grip ⠿ kéo đổi thứ tự · nhớ theo LOẠI VẬT, cấm khoá theo sub-mode  (SPEC-PANEL-ROLLOUT-IDF §2a + §2b)
    👁 thu-gon-co-nhan — Thu gọn panel = dải dọc mỏng CÓ NHÃN, trạng thái thu/mở NHỚ giữa các phiên  (SPEC-PANEL-ROLLOUT-IDF §2f + 00-CHOT mục 10 (07/08))
    👁 thoi-luong-dung-nac — Bấm/toggle <200ms · popover 200-300ms · chuyển trang 300-500ms · cấm >600ms cho thao tác thường  (SPEC-APPLE-MOTION-MATERIAL §3a + §4)
    👁 lenh-co-duong-phim — Mọi lệnh ĐÃ chạy được phải có đường bàn phím thật; tooltip/⌘K/bảng ⌘/ không khai lệch hành vi  (Chốt hệ phím tắt toàn app 10/08 (00-CHOT))
  · Tội 4 — Cảm giác GIẢ về nội dung:
    👁 mo-kem-ly-do — Lệnh chưa đủ điều kiện hiện MỜ kèm LÝ DO — cấm nút giả bấm không ra gì, cấm gán phím giả  (Chốt hệ phím tắt 10/08 + luật §9 (00-BAT-DAU-DOC-DAY))
  · Tội 5 — Gò ép — không module / không tuỳ chỉnh:
    👁 khong-chan-man — Không màn nào chặn vì "chưa làm bước trước" — chặng trống hiện empty state LÀM ĐƯỢC VIỆC tại chỗ  (00-CHOT luật X2 (03/08))
    👁 nguoi-keo-may-khong-doi — Người dùng tự kéo sắp panel (adaptable), máy KHÔNG tự đổi thứ tự (adaptive); luôn có "Đặt lại bố cục" nhìn thấy  (SPEC-PANEL-ROLLOUT-IDF §1 (Findlater CHI 2004) + §2b)
  · Tội 6 — Không phân loại group-by:
    👁 dai-trang-theo-loai-vat — Inspector = dải trang đổi theo LOẠI VẬT đang chọn (kiểu Rhino); chọn nhiều loại → chỉ trang chung; không chọn → thuộc tính khung nhìn  (SPEC-PANEL-ROLLOUT-IDF §2c)
    👁 phan-loai-lon-nho — Nội dung/tính năng phân loại LỚN trước NHỎ sau, group-by + filter — gọn mặc định, sâu khi cần  (TRIET-LY-IF [Đ6])
  · Tội 7 — Thẩm mỹ kém:
    👁 khong-scale-vat-lon — KHÔNG scale khi hover: nút toolbar · hàng danh sách · ảnh lớn · node canvas — scale chỉ cho vật NHỎ/ĐƠN LẺ  (SPEC-HOVER-FOCUS-IDF §2 + §4)
    👁 trang-thai-mau-hinh — Trạng thái nói bằng MÀU + HÌNH (icon bật/tắt, chấm màu) — không câu chữ "Có/Không"; số giữ nguyên chữ số  (SPEC-PANEL-ROLLOUT-IDF §3)
    👁 mo-dong-dung-khuon — Mở popover/tool window: opacity+scale .96→1, gốc phóng TẠI nút bấm; đóng nhanh hơn mở (vào chậm ra nhanh)  (SPEC-APPLE-MOTION-MATERIAL §3d)
────────────────────────────────────────────────────────────────────────────────────────────────────
🔴 5 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt  ← lệch trong code app GHI BÁO CÁO cho T quyết, không nới pattern
```

## ⑤ 5 lệch trong code app — GHI CHO T QUYẾT (LT không sửa, đúng biên ⑤)
1. **kinh-webkit-prefix** — 18 file có backdrop-filter thiếu Webkit prefix. Đúng bệnh K3 (tablet không blur), việc sửa cơ học, gợi ý 1 phiếu quét gộp.
2. **outline-can-focus-visible** — 31 file components + globals.css. Nợ "bàn phím = chuột" diện rộng; một phần có thể giải bằng style focus-visible TOÀN CỤC trong globals.css thay vì sửa 31 file — T cân.
3. **keydown-ne-o-nhap** — 12 file components + `lib/useDismissable.ts`. ⚠️ CÓ FALSE-POSITIVE CẦN T PHÁN: file chỉ bắt phím `Escape` (vd useDismissable) thì bắn khi đang gõ là hành vi ĐÚNG (Esc đóng lớp); pattern không phân biệt được Escape-only với handler mũi-tên/chữ (vd PresentViewer, DongStudioHome — các file này nghi lệch thật). LT giữ pattern thô theo [T0] (không nới cho sạch giả), đề xuất T: hoặc chấp nhận nợ liệt kê, hoặc chốt quy ước marker `// esc-only` để miễn trừ có chủ đích.
4. **cam-chu-tu-dong** — 17 chỗ chuỗi "tự động" trong components (LibraryPanel ×4, CadEditor…). Trùng một phần với soi-tu-dien (cùng luật gốc CHOT-TACH-AI) — chủ đích giữ ở cả hai: bên này gắn TỘI DANH 4 để finding mắt có nhãn.
5. **cam-hex-inline** — 193 chỗ hex trong inline style components. Diện rộng nhất, khớp tiền lệ soi hardcode hex; ứng viên group-by 1 phiếu migrate về token (cùng họ việc radius v2 đã làm).

## ⑥ Quyết định tự chọn + lý do
- **3 kiểu điều kiện soi** (bắt buộc/cấm/mauCo-mauThieu) thay vì chỉ can:true/false của frontier — vì luật thao tác đa số là "có A phải kèm B" (backdrop+prefix, outline+focus-visible); vẫn cùng tinh thần 2 chiều [T6].
- **Đếm LỆCH theo LUẬT không theo hit** (5 lệch, không phải 254) — dòng tổng ổn định, hit chi tiết vẫn in đủ (cap 5/lỗi như soi-tu-dien).
- **Pattern kiểm trên code thật TRƯỚC khi chốt** (grep tay từng ứng viên): nhờ đó bắt được và sửa 1 bug pattern — `[^']*` vắt qua nhiều dòng gây khớp ảo (CommandPalette), đổi thành `[^'\n]*` → 31 hit ảo xuống 17 hit thật. Ghi thành lưu ý trong HE-LUAT-THAO-TAC.md.
- **Hạ xuống mắt** các ứng viên grep không sạch theo đúng phiếu: fade-kính-self-opacity, portal kính, disabled-kèm-title (không tách được cặp attribute cùng element bằng regex dòng), scale-vật-lớn, thời-lượng-ms.
- **Tội 2/5/6 không có luật grep** — nguồn được giao không cho pattern grep sạch cho các tội này; phủ bằng luật mắt (1/2/2), khai thật không ép.
- Registry/máy soi tự SKIP 2 file của chính nó (học đúng bài SKIP_FILES của soi-frontier — sổ không tự khớp mình).

## ⑦ CHƯA LÀM — nói thẳng
- Chưa sửa bất kỳ lệch nào trong code app (đúng biên phiếu — 5 cụm lệch ở ⑤ chờ T mở phiếu).
- Chưa flip entry `he-luat-thao-tac` trong frontier-registry (ô ⑧ — T flip sau audit); frontier hiện 2 đỏ chờ flip (kèm `grounded-render` của agent song song).
- Chưa nối soi:thao-tac vào lệnh gộp/CI nào — phiếu không giao.
- Luật mắt chưa ai duyệt mắt — bảng 19 luật là NỢ nghiệm thu, chờ phiên duyệt-mắt-gộp.
- Không phát hiện mâu thuẫn luật giữa các spec trong phạm vi đã đọc (mâu thuẫn radius 6/9/12/16 vs 10/14/20/28 đã được chính SPEC-DESIGN-SYSTEM §2 tự đính chính, không tính).

## ⑧ Khuôn 2 giá trị (§1c)
- **Giá trị kiến trúc app:** [tính năng] luật thao tác từ ~10 spec rời thành MỘT kho máy-đọc cùng họ soi-* — chốt UI mới có chỗ ghi ngay, regress có máy canh (tam-noi-tai-cho đã canh đúng bản sửa 07/08); [giao diện] 5 cụm nợ UI được định lượng lần đầu (18+31+12+17+193 chỗ) thay vì cảm giác.
- **Giá trị vận hành + người dùng IF:** [tính năng] mỗi lệch mang tội danh [N1] — nghiệm thu mắt của Hoà có trục gọi tên đúng bệnh (lỗi giao diện ≠ cảm giác giả ≠ gò ép); [giao diện] người dùng cuối hưởng chuỗi luật bảo vệ thao tác thật: phím tắt không cướp ô gõ, tablet có blur, bàn phím đi được mọi nơi chuột đi.
