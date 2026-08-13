# PHIẾU GIAO · he-luat-thao-tac — P3 Hệ Luật Thao Tác (kho + soi:thao-tac + 7 cấm kỵ thành tội danh)

> Hợp đồng tự chứa theo HOP-DONG-PHOI-HOP-T §3. Dán nguyên phiếu vào phiên phụ là chạy được.

## THẺ VAI [Đ4]
- **VAI:** LT — agent nhánh Hệ-Luật-Thao-Tác (DocCore, chuỗi nền P3), xây MÁY SOI luật thao tác cùng họ soi-frontier.
- **PHẠM VI/TRẦN:** cấp F (build-tooling). Chỉ đụng: `scripts/thao-tac-registry.mjs` (mới) · `scripts/soi-thao-tac.mjs` (mới) · `package.json` (đúng 1 dòng script `soi:thao-tac`) · `docs/HE-LUAT-THAO-TAC.md` (mới) · báo cáo.
- **BIÊN → DỪNG:** KHÔNG sửa code app (lib/components/app) dù soi ra lệch — lệch tìm được chỉ GHI vào báo cáo cho T quyết. KHÔNG sửa frontier-registry. Thấy luật nào mâu thuẫn giữa các spec → ghi lại, không tự phân xử.
- **ĐIỀU KHOẢN RUỘT:** [T6] đo được mới tin — máy soi 2 chiều · [N1]+[Đ5] 7 cấm kỵ là tội danh gốc · [T0] khai thật, không bịa luật · [Đ2] chưng cất từ spec đã có, không sáng tác luật mới.

## ① BỐI CẢNH NGÀNH
Đối tượng IF là người sáng tạo lai kỹ thuật [N1] — dị ứng đồ giả, lỗi thao tác, gò ép. Hoà đã ban 7 CẤM KỴ làm trục nghiệm thu mắt, và ~10 spec UI đã chốt hàng chục luật thao tác cụ thể (hover không scale vật lớn, cấm auto-hide panel, reduce-motion thắng, panel kính phải portal, fade kính = self-opacity…). Bệnh: luật chỉ nằm trong docs, mắt người soi sót — đã 3 lần Hoà chê xấu vì phiên code không biết luật tồn tại. P3 biến luật thành MÁY: cùng cơ chế soi-frontier (registry máy-đọc + grep 2 chiều + exit 1).

## ② ĐỌC TRƯỚC (bắt buộc, theo thứ tự)
1. `docs/TRIET-LY-IF.md` — [N1] 7 cấm kỵ (dòng 53-58) + [Đ5].
2. `scripts/frontier-registry.mjs` + `scripts/soi-frontier.mjs` — cơ chế registry + soi 2 chiều để BẮT CHƯỚC (đọc kỹ cách grep bangChung, exit code, output).
3. `scripts/soi-tu-dien.mjs` — họ hàng gần (grep UI/mocks).
4. Nguồn luật để chưng cất (đọc lướt, trích luật GREP-ĐƯỢC): `docs/SPEC-HOVER-FOCUS-IDF.md` · `docs/SPEC-PANEL-ROLLOUT-IDF.md` · `docs/LUAT-GIAO-DIEN-BAT-BUOC.md` · `docs/SPEC-DESIGN-SYSTEM-IF.md` (§2c chống ngô nghê, G1/G9) · `docs/SPEC-APPLE-MOTION-MATERIAL.md` · `docs/SPEC-MAT-DO-CON-TRO.md` · `docs/00-CHOT.md` các mục: TICKET-FIX-KINH (fade kính self-opacity, portal panel kính) · card rời nổi-tại-chỗ 07/08 · luật X2 không chặn màn · tay cầm PanelFlank mục 10 · hệ phím tắt 10/08.

## ③ VÙNG FILE
`scripts/thao-tac-registry.mjs` (MỚI) · `scripts/soi-thao-tac.mjs` (MỚI) · `package.json` (1 dòng) · `docs/HE-LUAT-THAO-TAC.md` (MỚI) · `docs/bao-cao-phien/2026-08-13-LT-he-luat-thao-tac.md`. Ngoài vùng = vi phạm dù sửa đúng.

## ④ VIỆC (marker để registry soi)
1. **`scripts/thao-tac-registry.mjs`** — kho luật máy-đọc. Mỗi entry: `{ id, toiDanh: 1..7, luat: '<câu luật 1 dòng>', nguon: '<file chốt gốc>', loai: 'grep'|'mat', soi?: [{dir|file, mau, can}] }`. `toiDanh` map đúng 7 cấm kỵ [N1]: 1 lỗi giao diện · 2 xài hoài không ra chất lượng · 3 lỗi thao tác · 4 cảm giác GIẢ · 5 gò ép không tuỳ chỉnh · 6 không phân loại group-by · 7 thẩm mỹ kém. Mục tiêu: **≥15 luật grep-được + ≥10 luật chỉ-mắt** chưng cất từ nguồn ②4 — KHÔNG sáng tác luật ngoài nguồn, mỗi luật ghi rõ `nguon`.
   Gợi ý luật grep-được (kiểm lại pattern trước khi chốt, tránh false-positive ồ ạt): fade kính trên element có backdrop-filter phải self-opacity (grep `transition.*opacity` gần wrapper?) · thiếu guard `prefers-reduced-motion` trong file có animation mới · hardcode hex ngoài token trong components (đã có tiền lệ soi) · `onContextMenu`/`shiftKey` vắng ở vùng canvas (từ vựng chuột thiếu — SPEC-MAT-DO-CON-TRO) · chuỗi "tự động" trong UI (cấm theo CHOT-TACH-AI) · nút `disabled` không kèm `title`/lý do (luật hiện-mờ-kèm-lý-do). Luật nào grep không sạch → hạ xuống `loai:'mat'`, đừng ép.
2. **`scripts/soi-thao-tac.mjs`** — chạy: đọc registry, soi luật `loai:'grep'` 2 chiều như soi-frontier (lệch = exit 1, in rõ luật + tội danh + file:dòng); luật `loai:'mat'` in thành BẢNG NỢ NGHIỆM THU MẮT nhóm theo tội danh [Đ6] (không tính lệch). Output gọn kiểu soi-frontier: dòng tổng cuối `🔴 X LỆCH · 👁 Y luật chờ mắt`.
3. **`package.json`** — thêm `"soi:thao-tac": "node scripts/soi-thao-tac.mjs"` cạnh họ soi.
4. **`docs/HE-LUAT-THAO-TAC.md`** — ≤60 dòng: cơ chế, 7 tội danh, cách thêm luật (chốt UI mới = thêm entry ngay, cùng kỷ luật frontier), cách đọc output.

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG mở dev server · KHÔNG dep mới · script thuần Node ESM như họ soi hiện có · tiếng Việt trong output máy soi · pattern grep phải chạy được trên macOS (không GNU-only flags). Lần chạy đầu soi ra lệch trong code app là BÌNH THƯỜNG — ghi vào báo cáo, KHÔNG sửa code app, KHÔNG nới pattern cho "sạch giả" [T0].

## ⑥ NGHIỆM THU TỰ LÀM
`node scripts/soi-thao-tac.mjs` chạy không crash, in đủ 2 khối (lệch grep + nợ mắt) · `npm run soi:frontier` vẫn 0 lệch (entry `he-luat-thao-tac` sẽ do T flip) · `npx tsc --noEmit` không lỗi mới (script .mjs không qua tsc nhưng kiểm package.json không vỡ) · đếm số luật: ghi con số thật vào báo cáo.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-LT-he-luat-thao-tac.md` — khuôn: file sửa/tạo · output lệnh THẬT dán nguyên văn (lần chạy đầu soi-thao-tac đầy đủ) · số luật grep/mắt theo từng tội danh · quyết định tự chọn + lý do · CHƯA LÀM nói thẳng · khuôn 2 giá trị (§1c): giá trị kiến trúc + giá trị vận hành trong phạm vi nhánh.

## ⑧ DÂY MÁY
Entry `he-luat-thao-tac` (đợt 7, DocCore, 🔗dây) — agent KHÔNG tự sửa frontier-registry, T flip sau audit.
