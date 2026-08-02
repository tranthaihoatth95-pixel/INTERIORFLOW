# BÁO CÁO · COWORK-VẼ
**Vai:** VAI 4 theo `HAM-DOI-COWORK.md` — spec nghiệp vụ chặng Vẽ, kinh là `SPEC-LENH-VE-IF.md`.
**Luật:** không code, không mock. Chỉ ghi vào file này. Append-only.

---

## PHIÊN 03/08/2026 — nhận vai

### Đã đọc theo trình tự hiến chương
`HAM-DOI-COWORK.md` → `SO-KIEM-TONG.md` → `00-CHOT.md` → `SPEC-LENH-VE-IF.md`. Kiểm trùng: `SPEC-VE-INFERENCE.md` / `SPEC-VE-REVIT-MODE.md` chưa tồn tại, `git log --all` sạch — không ai làm trước.

### Khảo sát hiện trạng (luật L1 — trước khi viết spec)
Đã grep/đọc `lib/cad/store.ts` · `lib/cad/query.ts` · `components/cad/CadCanvas.tsx` (3441 dòng). Kết luận đưa vào §1 của spec — điểm chính:

| Đã có sẵn (KHÔNG vẽ lại) | Ở đâu |
|---|---|
| OSNAP 10 loại bật/tắt từng loại (`SnapSettings`) | `store.ts:179` |
| `findSnap()` → `SnapResult{pt,type}` | `lib/cad/query.ts:28` |
| Glyph snap phân biệt HÌNH theo loại (vuông/tam giác/tròn/X…) — nhưng MỘT màu accent | `CadCanvas.tsx:2923 drawSnap()` |
| Dynamic input `dynBuf`: số đơn = độ dài theo hướng, `X,Y` tuyệt đối, `@dx,dy` tương đối, F12 toggle | `CadCanvas.tsx:443-470 effectivePoint()` |
| Enter đặt tham số fillet/chamfer/lengthen/offset | `CadCanvas.tsx:928 commitEnter()` |
| Shift = ortho TẠM · F8 = `orthoLock` (store) · polar tracking + `polarStep` | `CadCanvas.tsx:423-441` + store |
| Space tap = lặp lệnh · Esc reset chuỗi | `CadCanvas.tsx` onKey |

**Thiếu thật (spec phải đắp):** màu inference theo loại · khoá Shift-giữ-inference · phím mũi tên khoá trục · gõ-số-SAU-chốt (chỉnh lại được) · `3x` `/3` cho Move-copy · đường gióng thước dây.

### Trạng thái hàng đợi
1. ✅ **`SPEC-VE-INFERENCE.md`** — TỔNG duyệt ĐẠT (BAO-CAO-DEM 00:0x, cơ chế ship-trước-sửa-sau).
2. ✅ **`SPEC-VE-REVIT-MODE.md` — VIẾT XONG** cùng phiên. Phát hiện gốc: `wallChain` sinh per-đoạn rồi VỨT tim tường → không parametric được; giải bằng lớp `WallRun` (tim sống lại) đứng trên lớp hình học, additive theo khuôn IF2. Kèm thuật toán room trace **ngân sách cứng 50ms** (bài học `findHatchBoundary` treo — TECH-DEBT).
3. ⛔ Rà 10 khuyết ①-⑩ → phiếu — **CHẶN: `BAO-CAO-PHU.md` chưa có kết quả grep §4** (đã kiểm 03/08, chỉ có match không liên quan dòng 609/614). Chờ PHU xong mục 5 của họ.

### Đề xuất cho `00-CHOT.md` (TỔNG duyệt mới ghi)
- [03/08] `SPEC-VE-INFERENCE.md` (COWORK-VẼ): inference đắp MÀU lên glyph sẵn có · Shift hợp nhất khoá-ràng-buộc · mũi tên khoá trục · VCB gõ-số-sau + `3x` `/3` — chi tiết tới điểm móc code, PHU làm lib, CHINH/G4 nối UI.
- [03/08] `SPEC-VE-REVIT-MODE.md` (COWORK-VẼ): tường parametric qua lớp `WallRun` optional (tim + type/instance + location line) · nối tự sạch MỘT kiểu (miter, không UI sửa nối) · cửa/cửa sổ hosted Space đảo chiều · ROOM click-vùng-kín + `l-room-sep` · seed 4 WallType VN — mode revit đổi hành vi lệnh qua `when`, `.idf` cũ không breaking.

### Việc TỔNG cần phân khi phát phiếu (nêu ở cả 2 spec §5/§8)
- `components/cad/CadCanvas.tsx` **chưa gán mảng** trong `SO-KIEM-TONG` §2 — phần wiring (lastOp/lockedSnap/axisLock/drawGuides + tool door/window/roomsep) cần chủ. Đề xuất: cùng người làm lib để khỏi handoff giữa chừng.
- Danh sách 4 WallType seed (gạch 110/220 · thạch cao 100 · kính 12) — Hoà/TỔNG chỉnh lúc duyệt.

### Nghi vấn liên vai (Hoà chuyển TỔNG khi tiện)
- Token màu inference (4 nhóm + 2 trục) chưa có trong `globals.css` — spec đặt TÊN token + giá trị đề xuất, **giá trị cuối thuộc SPEC-DESIGN-SYSTEM-IF của COWORK-UI** (TỔNG duyệt). Một câu cần chuyển: *"COWORK-UI chốt giá trị 6 token `--snap-*`/`--axis-*` theo §2 SPEC-VE-INFERENCE rồi ghi vào SPEC-DESIGN-SYSTEM-IF."*

### CHỐT PHIÊN
- Xong: nhận vai · khảo sát code 2 vòng · `SPEC-VE-INFERENCE.md` (TỔNG duyệt ĐẠT) · `SPEC-VE-REVIT-MODE.md` (chờ hậu kiểm ca đêm) · sổ này.
- Dở: việc 3 hàng đợi vẫn CHẶN chờ PHU grep §4 — hết việc khả thi trong hàng đợi vai.
- Không đụng file vai khác, không code. Token `--snap-*`/`--axis-*` đã thành việc 0 của COWORK-UI (TỔNG bơm) — 2 spec dùng `var()` có fallback, không chờ.
