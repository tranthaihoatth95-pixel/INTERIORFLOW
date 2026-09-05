# 2026-08-20 — Reference/Library UI: "Dùng ảnh này cho dự án"

## ① Việc được giao
Thêm UI attach `LibraryAsset` có sẵn vào `Project` đang mở (phần đầu Golden Journey: asset X
dùng Project A → reuse Project B → where-used thấy cả A/B), gọi API `project-asset-usage` do
worker khác dựng song song. CHỈ sửa `components/library/LibrarySheet.tsx` (additive) + thêm mới
`components/library/AssetWhereUsed.tsx`. Không đụng `app/api/project-asset-usage/**`.

## ② Tiền đề đã đo lại (⓪)
- `git log --oneline -1` = `c7f3ac8`, đúng `main` như phiếu yêu cầu.
- `LibrarySheet.tsx` KHÔNG có `projectId` context sẵn — grep `projectId` trong file = 0 trước khi
  sửa. Nguồn đúng là `useFlowStore((s) => s.currentProjectId)` (`lib/store.ts:110`) — REACTIVE,
  khác `activeProjectRouteId()` (`lib/project-scope.ts:58`) là hàm thuần đọc `getState()` một lần,
  không re-render khi store đổi trong lúc sheet đang mở (sheet mở lâu, người dùng có thể đổi dự án
  bằng router mà sheet không re-mount).
- `lib/library/gallery-tags.ts` đã đọc — KHÔNG dùng cho phiếu này (nó là tag phân loại Gallery
  liên ngành, không liên quan usage attach).
- `LIBRARY_USAGES` KHÔNG có trong `lib/`— tìm ra ở `lib/server/library-save.ts:17`
  (`['ref-render','slide','material','layout','cad','brief','furniture']`) qua diff schema đang
  mở (`prisma/schema.prisma`, model `ProjectAssetUsage` mới, comment dòng ~432 dẫn thẳng tới file
  này). Dùng `'ref-render'` cho MVP — hợp lệ trong tập đó.
- `SheetItem.id` của món DB thật mang tiền tố `db:` (`lib/library/db-items.ts:87`,
  `id: \`db:${a.id}\``) — món built-in/mock (block, dxf, idfc) KHÔNG có hàng `LibraryAsset` thật để
  trỏ tới. Nút attach + where-used CHỈ hiện khi `displayItem.id.startsWith('db:')`.

## ③ Đã làm
- `components/library/AssetWhereUsed.tsx` (mới) — component nhận `assetId` (LibraryAsset.id thật,
  đã bóc `db:`) + `refreshKey?`, tự `fetch GET /api/project-asset-usage?assetId=`. Pattern
  loading/error copy từ `components/dna/DesignDnaCardPanel.tsx` (`fetchDnaCards` — try/catch quanh
  fetch, không throw ra UI, 3 trạng thái loading/error/rỗng đều có dòng chữ nhạt `--t3`, không màn
  trắng câm).
- `components/library/LibrarySheet.tsx`:
  - Import `useFlowStore`, `getLastUserId`, icon `Check`/`Loader2`, `AssetWhereUsed`.
  - `projectId = useFlowStore((s) => s.currentProjectId)` — reactive.
  - `dbAssetIdOf(item)` — bóc tiền tố `db:`, trả `null` nếu món không phải DB thật.
  - `attachToProject(item)` — POST `{projectId, assetId, usage:'ref-render', addedBy}`.
    `addedBy` lấy theo đúng pattern có sẵn trong repo (`useFlowStore.getState().user?.id ??
    getLastUserId() ?? ''`, thấy ở `components/studio/AppChrome.tsx:185`,
    `components/settings/LockScreenSettings.tsx:21`).
    - `200` → đánh dấu đã gắn (`attachedUsage`), bump `whereUsedRefresh` để `AssetWhereUsed` fetch
      lại, toast nhẹ "Đã dùng… cho dự án này".
    - `409` (đã gắn rồi) → CÙNG cách đánh dấu đã gắn, toast nhẹ khác câu ("đã gắn vào dự án này
      rồi") — KHÔNG coi là lỗi (đúng yêu cầu phiếu: "409 hiện thông báo nhẹ, không phải lỗi to").
    - lỗi mạng/`!ok` khác → toast nhẹ báo thử lại, không throw, không chặn panel.
  - Nút "Dùng cho dự án này" chèn vào `.spact` (cột thông số ④, cạnh "Sửa bản sao"/"Xuất .idfc") —
    CHỈ render khi `dbAssetIdOf(displayItem) && projectId` đều có thật. `disabled` khi đã gắn/đang
    chạy, đổi nhãn + icon `Check`/`Loader2` theo trạng thái — không ẩn nút sau khi gắn (giữ nhìn
    thấy được, §9 "không giấu ô cho gọn mắt" áp cho cả nút trạng thái).
  - Khối where-used chèn vào `.speccol` ngay dưới `.spsec` "Thông số" — hiện với MỌI món DB thật
    (không điều kiện theo `projectId`, vì "asset này dùng ở đâu" hữu ích cả lúc không mở dự án
    nào), dùng lại class `.spsec`/`.spcap` sẵn có (không thêm CSS mới, không sửa
    `library-sheet-css.ts`).

## ④ MVP — chưa làm, khai rõ
- KHÔNG có UI chọn `usage` (`usage` picker) — mặc định cứng `'ref-render'`. Đủ chứng minh Golden
  Journey (attach + where-used), chưa đủ cho ca "cùng asset, 2 usage khác nhau trong cùng dự án".
- Không có nút gỡ usage (`DELETE /api/project-asset-usage/[id]`) ở UI này — where-used chỉ ĐỌC.
- `attachedUsage`/`attachBusyId` là state CỤC BỘ của phiên sheet đang mở — không đọc trạng thái
  "đã gắn" từ server lúc mới mở món (chỉ biết sau khi bấm 1 lần và ăn 200/409). Nút không tự hiện
  "Đã dùng ✓" khi mở lại sheet ở dự án đã gắn từ trước — vì MVP không fetch danh sách usage của
  CHÍNH project đang mở để đối chiếu trước. Ghi rõ đây là gap, không phải bug.

## ⑤ Nghiệm thu
- `npm run tsc` — PASS, 0 lỗi (chạy 2 lần, kể cả `tsc --noEmit` trần).
- Test targeted: không viết — cả hai file mới/sửa là component React gọi `fetch` thật + phụ thuộc
  `document`/portal của `LibrarySheet`, không có logic thuần tách được để test bằng sucrase-node mà
  không dựng DOM. Không thấy phần nào đáng test độc lập hơn browser-verify.
- BROWSER-PENDING (route `app/api/project-asset-usage/**` do worker khác dựng, và
  `ProjectAssetUsage` mới ở diff `prisma/schema.prisma` là **SCHEMA-ONLY, CHƯA push/generate**
  theo đúng comment trong schema — nên `fetch` thật sẽ 404/500 tới khi cả hai điều kiện đó xong).
  Kịch bản khi verify được:
  1. Mở một dự án thật (`projectId` có giá trị) → mở LibrarySheet → vào kệ có món DB thật (tiền
     tố `db:`, ví dụ món vừa `/library/ingest`) → bấm chọn thẻ để mở cột thông số ④.
  2. Thấy khối "Đang dùng ở dự án" (rỗng hoặc danh sách) NGAY DƯỚI "Thông số".
  3. Thấy nút "Dùng cho dự án này" trong `.spact`. Bấm → gọi POST → nút đổi "Đã dùng ✓" +
     khối where-used tự fetch lại, thấy đúng project vừa mở.
  4. Bấm lại (hoặc mở sheet khác rồi quay lại bấm) → 409 → toast "đã gắn vào dự án này rồi", nút
     vẫn ở trạng thái "Đã dùng ✓".
  5. Mở màn KHÔNG gắn dự án nào (`projectId` null, ví dụ trang không nằm dưới `/projects/[id]/…`)
     → xác nhận nút "Dùng cho dự án này" KHÔNG hiện (chỉ where-used hiện, nếu có).

## ⑥ File đã sửa
- `components/library/AssetWhereUsed.tsx` — MỚI.
- `components/library/LibrarySheet.tsx` — sửa additive (import + state + 2 khối UI trong cột ④).

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy app thật một dòng nào (không có dev server sẵn theo `feedback_dev-server-ports`, và
  route API worker kia dựng có thể chưa xong tại thời điểm nộp bài) — mọi khẳng định về hành vi
  runtime (200/409/UI đổi trạng thái) là suy từ đọc code, chưa đo bằng mắt.
- Contract API tin theo đúng mô tả trong phiếu (POST/GET/DELETE, hình dạng response). Nếu response
  GET thật trả cấu trúc khác (`usages` lồng khác tên trường `project`/`asset`) thì `AssetWhereUsed`
  sẽ hiện "chưa dự án nào dùng" sai (đọc `rows.length===0` từ mảng rỗng do parse sai hình dạng) —
  chưa có cách kiểm cho tới khi route thật tồn tại.
- `addedBy` gửi `''` (chuỗi rỗng) khi không có user id nào tìm được (chưa đăng nhập / sandbox) —
  chưa biết route worker kia có validate non-empty hay không; nếu có, POST sẽ lỗi ở ca đó. Không
  tự đoán thêm ràng buộc phía UI vì không có trong contract.

## ⑦c Hạn dùng kết luận
Đúng tại `c7f3ac8`. Nếu `ProjectAssetUsage` được push/generate với hình dạng response khác đoạn
mô tả trong phiếu (vd đổi tên `project`→`proj`, hoặc bọc thêm `data:`), `AssetWhereUsed.tsx` phải
sửa lại phần parse — không tự suy diễn thêm khi chưa thấy route thật.
