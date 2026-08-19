# 03 · Night Shift — 4 lane song song

⓪ reality lúc mở ca: main `c7f3ac8`, backup `c15b928` (39 commit ahead), server 3001 sống
(Prisma Client mới, restart 00:5x). PREFETCH-ATTACH + REFERENCE-UI-GJ-PASS đã đóng trước ca.

## File ownership (MAIN phân trước khi giao, chống collision)
- **Lane B** (LIBRARY+REFERENCE E2E): `app/api/project-files/**` · `lib/server/promote.ts` · test cạnh.
  CẤM: `app/api/project-asset-usage/**` (LIVE) · `prisma/schema.prisma` · `components/**`.
- **Lane C** (UX/UI writer): `components/home/**` · `components/filemanager/**` ·
  `components/library/LibrarySheet.tsx` · `AssetWhereUsed.tsx` · `da-gan-du-an.ts` · `app/files/_components/**`.
  CẤM: `app/api/**` · `lib/server/**` · `prisma/**` · `--accent*`.
- **Lane D** (Interaction+QA): `components/cad|three|review|render-studio|ui/**` · `lib/commands/**`
  — CHỈ sửa nếu bug thuộc đúng vùng, browser Golden Loop trước. CẤM: home/library/filemanager, api/server/schema.

## Đang chạy
Cả 3 lane phóng cùng lúc, chưa có kết quả.

## HẠN DÙNG
Cập nhật khi từng lane về + checkpoint.

---

## KẾT CA (20/08 ~02:4x) — DONE/PARTIAL/BLOCKED

| Lane | Trạng thái | Commit | Ghi chú |
|---|---|---|---|
| B ProjectFile→Promote | ✅ DONE (máy) | `a25bb46` | 16/16 test DB thật; MAIN verify độc lập. 🟡 nhánh có-phiên của API chưa chạy browser |
| C Home fix nghiến 12px | ✅ DONE | `37a596e` | MAIN verify browser: card Ghi chú 273px, input trong card |
| D Golden Loop QA | ✅ DONE | `5b8f21c` | Loop PASS trọn; D2 P0 + D1/D3 P1 sửa, MAIN accept sống D2 (W→click→Enter ra tường lần đầu) |
| MAIN D5/D6/D7 | ✅ DONE | `eb43791` | verify browser (widget ẩn đúng, nút Lưu có lý do focusable) |
| D4 selection ma | ✅ DONE | `5bc0996` | cơ chế thật = removeLayer (không phải undo); fix gốc + defense aliveSelection |
| D8 ToolDock3D title-câm | ⚪ HOÃN có chủ đích | — | cùng họ D3, lượt sau |

Cuối ca: `npm test` EXIT=0 (~9000 ok) · tsc 0 · soi:frontier 0 lệch · soi:hinh-hoc giữ mốc 26 ·
browser-accept: Home + 2D vẽ/undo sạch, không rác dữ liệu (doc test đã undo về rỗng).
backup/2026-08-19-batch0a tip `5bc0996` đã push remote. main nguyên `c7f3ac8`.

## NỢ MỞ CHO PHIÊN SAU
- Dedupe promote theo hash: cần cột schema mới trên LibraryAsset (phiếu schema riêng, human gate db push)
- Upload project-files v0 chỉ ảnh+PDF; DWG/DXF trả 415 — nới là quyết định riêng
- D8 ToolDock3D 4 nút mờ lý do qua title → chuyển aria-describedby
- Dữ liệu chết: LibraryAsset ảnh weekly trả 410 (UI đã phòng thủ, gốc dữ liệu chưa dọn)
- read_page viewport 0×0 cả phiên (Lane D khai) — trợ năng mới kiểm mức DOM attr, chưa screen-reader thật
