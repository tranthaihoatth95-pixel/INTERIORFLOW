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
