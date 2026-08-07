# PHU-OUT — báo cáo phiên COWORK-PHU (Cowork local, 06/08 22:30)

Vai: COWORK-PHU (Cowork LOCAL trỏ `~/Downloads/interiorflow`) — KHÔNG sửa code, KHÔNG chạy git.
Nguồn luật đã đọc trước khi làm: `docs/00-BAT-DAU-DOC-DAY.md` (toàn bộ, §0a→§0v).

---

## VIỆC 1 — Dọn nhiễu tsc

Đã làm:
1. `npx tsc --noEmit` lần 1 (thư mục repo) → đúng 3 file đỏ như kỳ vọng phiếu việc:
   - `2407-Test/M3-out/t2-boq.ts` (5 lỗi TS2307, import tuyệt đối `/Users/tranben/Downloads/interiorflow/...`)
   - `2407-Test/M3-out/t2-run.ts` (3 lỗi TS2307 + 2 lỗi TS7006 implicit any)
   - `lib/cad/render-layer-index.test.ts:36` (TS2352 — ép kiểu `{scale,tx,ty}` sang `Viewport` thiếu `panX`/`panY`)
2. Sửa `tsconfig.json` — thêm `"2407-Test"` vào mảng `"exclude"` (trước: `["node_modules"]` → sau: `["node_modules", "2407-Test"]`).
3. KHÔNG động vào `lib/cad/render-layer-index.test.ts` (đúng luật — thuộc phiên `2·m1-loi-cad`).
4. `npx tsc --noEmit` lần 2 → xác nhận: đúng 1 lỗi còn lại, đúng dòng `render-layer-index.test.ts(36,21)` như kỳ vọng.

File kết quả: `tsconfig.json` (1 dòng thay đổi).

GAP mới: không có — việc này là dọn nhiễu, không phát hiện GAP sản phẩm.

Chưa kiểm chứng được: không có — cả 2 lần chạy tsc đều khớp kỳ vọng phiếu việc, không cần dừng.

---

## VIỆC 2 — `docs/SPEC-REALTIME-SYNCWORK.md`

Đã làm:
1. Bước 0 xác nhận: `grep -rna "yjs|liveblocks|socket.io|partykit|pusher|ably|automerge" package.json` → **0 kết quả**, khớp kỳ vọng.
2. Phát hiện lệch bối cảnh quan trọng: phiếu gọi tên "SyncWork" nhưng ràng buộc kỹ thuật đưa ra (Electron desktop, file `.idf`, Prisma+SQLite cục bộ) khớp kiến trúc **InteriorFlow**, không khớp SyncWork (theo Memory: Expo/React Native mobile). Phiên này không mount được repo SyncWork nên không kiểm chứng ngược được — đã ghi cảnh báo rõ ở đầu file, không tự bịa constraint SyncWork từ trí nhớ (đúng §0o).
3. So sánh 3 phương án: Yjs+y-websocket, Automerge+sync-server, hosted (Liveblocks/PartyKit) — chấm điểm offline-first/khoá-vendor/chi-phí/độ-khó-tích-hợp/ai-chạy-server.
4. Kiến nghị: **Yjs + y-websocket tự host** (điểm 17/20, sát Automerge 16/20 nhưng hệ sinh thái JS trưởng thành hơn). Loại Liveblocks/PartyKit vì vi phạm §0v L-EXT1 (khoá vendor) + mâu thuẫn offline-first.
5. Sơ đồ luồng dữ liệu: Yjs `Y.Doc` là nguồn sự thật CHO 3 vùng realtime (Kanban/chat/cursor), Prisma/SQLite vẫn là nguồn sự thật cho phần còn lại — merge CRDT phía client, ghi snapshot xuống Prisma sau khi ổn định.
6. Phát hiện phụ: `LarkKanbanTab` (`components/dashboard/LarkPanels.tsx:176-210`) hiện CHỈ ĐỌC, đọc từ `LarkTaskRef` (mirror pull-only Larkbase) — "Kanban ghi ngược" trong phiếu cần làm rõ với TỔNG là ghi ngược vào model nội bộ mới (chưa có, xem VIỆC 3), không phải ghi ngược Larkbase.
7. Liệt kê "cái gì KHÔNG cần realtime": metadata dự án, file `.idf`, billing/credit (luật T1/T2), báo cáo tổng hợp, roster nhân sự.

File kết quả: `docs/SPEC-REALTIME-SYNCWORK.md`.

GAP mới: **G-P-01** — IF chưa có tính năng Kanban ghi-ngược nội bộ (chỉ có mirror đọc Larkbase), cần model Task riêng trước khi làm realtime Kanban (liên quan trực tiếp VIỆC 3/G-P-02).

Chưa kiểm chứng được: (a) app mục tiêu thật là SyncWork hay IF — không mount được repo SyncWork để xác minh; (b) độ trễ/băng thông relay tự host trên hạ tầng thật — không có môi trường bench trong phiên Cowork.

---

## VIỆC 3 — `docs/SPEC-GANTT-DATA.md`

Đã làm:
1. Xác nhận: `grep -rina "gantt" lib/ components/ app/ docs/mocks/` → **0 dòng**, khớp kỳ vọng.
2. Đọc bắt buộc trước khi viết: `lib/lark/task-utils.ts`, `app/api/lark-tasks/route.ts`, `prisma/schema.prisma` (toàn bộ 18 model qua `grep -n "^model "`), `components/dashboard/LarkPanels.tsx`.
3. Phát hiện nền tảng: **KHÔNG có `model Task` nội bộ nào trong schema** — chỉ có `LarkTaskRef` (`prisma/schema.prisma:317-333`), là mirror pull-only của Larkbase (docstring `LarkPanels.tsx:8-10` "CHỈ ĐỌC"), thiếu `startDate`, dùng chuỗi tự do thay vì khoá ngoại `projectId` thật, chỉ 3 trạng thái rời rạc. Kết luận: Gantt cần `model Task` MỚI thuộc lõi IF, không xây trên `LarkTaskRef` (đúng §0v L-EXT1 — tránh lặp lỗi "cột chịu lực mượn hàng xóm").
4. Đề xuất field `Task` đầy đủ kèm nơi tiêu thụ (K4) — không đặt tên hãng nào (dùng `ExternalRef` sẵn có nếu cần nối Lark, không thêm cột `larkX`).
5. Phụ thuộc: đề xuất CHỈ finish-to-start (FS) lúc đầu, bảng `TaskDependency` tách riêng để mở khoá SS/FF/SF sau khi có nơi tiêu thụ thật.
6. Đường găng: tính CLIENT, tính lại mỗi lần mở (không cache) — tránh lớp bug "số chết" (N1).
7. Milestone: cờ `isMilestone: Boolean` trên `Task`, không phải model riêng.
8. Task chưa gán người/chưa có ngày: bảng quy tắc hiển thị đầy đủ 4 trường hợp, không được biến mất khỏi UI (đúng §9 "ô trống là bằng chứng còn việc").

File kết quả: `docs/SPEC-GANTT-DATA.md`.

GAP mới: **G-P-02** — IF chưa có `model Task` nội bộ nào (chỉ có mirror Lark) — đây là gốc chặn không chỉ Gantt mà cả Kanban ghi-ngược ở VIỆC 2. Đề xuất TỔNG cân nhắc gộp 2 GAP này thành 1 hạng mục "cần model Task lõi" khi gán mã chính thức.

Chưa kiểm chứng được: (a) chưa có mock UI Gantt thật để đối chiếu field — `Tiến độ · Gantt.dc.html` trong `docs/mocks/` là export chưa mở khoá (`support.js` thiếu, xem VIỆC 5); (b) chưa đo cỡ dữ liệu thật để kiểm định giả thiết CPM-tính-client-đủ-rẻ; (c) `ExternalRef` chưa chạy migrate (`prisma/schema.prisma:478-479`) nên đường nối Task↔Lark chỉ là thiết kế, chưa dùng được ngay.

---

## VIỆC 4 — `docs/PHUONG-AN-LICENSE-DWG.md`

Đã làm:
1. Đọc `docs/LICENSE-NOTES.md` (276 dòng) + `docs/RESEARCH-DWG-LICENSE.md` (609 dòng) — cả 2 đã RẤT đầy đủ (nghiên cứu 25/07, duyệt 28/07), nên việc chính của VIỆC 4 là DỊCH thành tóm tắt quyết định cho Hoà, không nghiên cứu lại từ đầu (đúng §0s).
2. `grep -rna "libredwg\|dwg" package.json lib/cad/` — xác nhận 1 dependency GPL-3.0 duy nhất (`@mlightcad/libredwg-web@0.7.7`), cô lập ở đúng 1 file (`lib/cad/dwg-worker.ts:231`).
3. Viết rủi ro cụ thể (GPL-3 §4/§5/§6, đang "conveying" ở cả web WASM lẫn Electron installer), bảng 6 hướng xử lý (A-F, thêm F = tách plugin GPL riêng so với 5 đường gốc), chấm điểm chi phí/công sức/mất gì.
4. Tách rõ phần kỹ thuật tự tin trả lời (code, số đo, license text) khỏi phần BẮT BUỘC hỏi luật sư (5 câu hỏi cụ thể — derivative work qua cô lập worker, luận điểm "server-side = không conveying", corresponding source, rủi ro khởi kiện, điều khoản chấm dứt hợp đồng ODA).
5. Phát hiện + SỬA 1 chỗ lệch giữa `LICENSE-NOTES.md §5` và hiện trạng thật: `package.json:14-15` **đã có** `license:check` script (license-checker-rseidelsohn) và **đã nối vào `npm test`** — không còn "chưa làm" hoàn toàn như file cũ mô tả. Không tìm thấy `.github/workflows/` nên "gate trong CI" (GitHub Actions) vẫn chưa xác nhận được, chỉ có gate ở `npm test` local.

File kết quả: `docs/PHUONG-AN-LICENSE-DWG.md`.

GAP mới: **G-P-03** — `docs/LICENSE-NOTES.md §5` mô tả lệch hiện trạng (nói "chưa đưa vào CI" nhưng script đã nối vào `npm test`) — đề xuất TỔNG cập nhật lại đúng luật §0i (chiếu dòng lệch phải sửa ngay khi phát hiện). KHÔNG tự sửa `LICENSE-NOTES.md` vì đây không phải file được giao trong phiếu VIỆC 4 (chỉ tạo file mới `PHUONG-AN-LICENSE-DWG.md`).

Chưa kiểm chứng được: (a) đã có luật sư review chưa — không tìm thấy tài liệu xác nhận trong `docs/`; (b) giá ODA thật ngoài trang web (nghiên cứu gốc đã đề nghị gửi email hỏi, chưa thấy bằng chứng đã gửi); (c) có CI GitHub Actions thật hay không — chỉ xác nhận không có `.github/workflows/`, không loại trừ hoàn toàn khả năng CI chạy ở nơi khác ngoài tầm nhìn của phiên này.

---

## VIỆC 5 — `docs/KIEM-KE-MOCK-2026-08-06.md`

RÀNG BUỘC đã tuân thủ: CHỈ đọc `docs/mocks/`, không sửa/xoá/ghi đè file nào trong đó (đã kiểm lại — không dùng Edit/Write vào bất kỳ file nào trong `docs/mocks/`).

Đã làm:
1. Liệt kê toàn bộ 67 file `.html` trong `docs/mocks/` (mtime + size qua `stat -c '%Y|%s|%n'`, tránh lỗi awk cắt tên file tiếng Việt có dấu cách gặp phải ở lần thử đầu) + 12 file trong `docs/mocks/_archinote/`.
2. `grep -a -o '<title>...'` cho toàn bộ 67 file, `grep -al '{{'`/`grep -al 'dc-import'`/`grep -al 'support.js'` để kiểm "mở sạch".
3. Đối chiếu với `docs/mocks/README-mocks.md` (227 dòng, audit trước đó 03-06/08) — phát hiện 3 chỗ README đã LỆCH hiện trạng: (a) danh sách 16 file dùng `support.js` nay chỉ còn ĐÚNG 10 (khớp chính xác con số "10/67" trong phiếu G-M5-05); (b) `mock-cad-shell-v5.html` (README ghi là bản chốt "được port") không còn tồn tại dưới tên đó — đã bị đổi tên `_cu` cùng lúc với 5 file cụm CAD-shell khác vào 16:18:58 06/08; (c) `InteriorFlow 05 Máy quay.html` chưa từng được xếp loại trong README (mồ côi khỏi audit).
4. Xác nhận G-M5-05 phần "Thư viện trỏ 4 trang con không tồn tại" **đã được sửa cùng ngày 06/08** (comment `[06/08 · gỡ G-A-04]` ở `Thư viện.dc.html:172,289`), khoảng 5 phút TRƯỚC khi phiếu này được giao (22:30) — 2/4 tên đã port nội dung vào file, 2/4 tên còn lại xác nhận chưa từng có `dc-import`/file thật (chỉ là chữ nhắc tới).
5. Tìm được 1 cặp trùng lặp XÁC NHẬN bằng nội dung (không chỉ đoán tên): `Lịch việc.dc.html` và `Lịch · Nhắc việc.dc.html` — cùng h1 "Lịch việc" (grep thật), kiến nghị giữ bản mới hơn/lớn hơn. 1 cặp NGHI VẤN (`Tiến độ dự án.dc.html` vs `Tiến độ · Gantt.dc.html`) chưa đủ căn cứ, cần mở bằng mắt.
6. Không tìm đủ căn cứ xác nhận đúng "6 trang cùng 1 màn" như phiếu mô tả — chỉ xác nhận được 1 cặp chắc chắn + 1 nghi vấn + cụm CAD-shell (đã tự đánh dấu `_cu`, không phải "không biết chọn bản nào" nữa).

File kết quả: `docs/KIEM-KE-MOCK-2026-08-06.md`.

GAP mới: **G-P-04** — `docs/mocks/README-mocks.md` lệch hiện trạng ở 3 điểm (chi tiết §0 file kết quả), cần TỔNG cập nhật (không tự sửa vì đây không phải file được giao). **G-P-05** — cặp "Lịch việc" trùng lặp, cần TỔNG/Hoà xác nhận trước khi xoá bản cũ (phiên này không tự xoá, đúng ràng buộc).

Chưa kiểm chứng được: không render trực quan (Playwright/Chromium) bất kỳ file nào trong phiên này — mọi nhận định "trùng màn hình" chỉ dựa trên `grep` chuỗi text (h1/title), chưa đạt chuẩn NT3 (ảnh chụp cạnh file). Cặp "Tiến độ" và cụm 4 file batch 21:15-21:16 (nghi là luồng nhiều bước) chỉ ở mức suy luận có căn cứ, chưa xác nhận chắc.

---

## VIỆC 6 — `docs/PHUONG-AN-CAU-IDF.md`

RÀNG BUỘC đã tuân thủ: KHÔNG mount `ttt-tasks` (repo ArchiNote thật) — chỉ đọc `docs/ARCHINOTE-MAP.md` (đã khảo sát sẵn) + `lib/cad/idf.ts` (đọc trực tiếp trong phiên này). Mọi điều không kiểm chứng được từ 2 nguồn này gắn nhãn CHƯA VERIFY, không suy đoán.

Đã làm:
1. Đọc toàn bộ `lib/cad/idf.ts` (230 dòng) — dán field thật của `IdfFile`/`IdfMeta`/`IdfSheetData`, xác nhận cơ chế migration versioned đã có sẵn (`IDF_MIGRATIONS`, `idf.ts:72-97`) là pattern nên tái dùng cho field mới.
2. Phát hiện lệch giữa docstring đầu file (`idf.ts:1-6` liệt "entities/layers/markups/photos") và interface `IdfFile` thật (`idf.ts:109-131`, KHÔNG thấy field `photos` cấp `IdfFile`) — gắn nhãn CHƯA VERIFY vì chưa đọc `lib/cad/model.ts` (1.273 dòng) để xác nhận `photos` có nằm trong `Doc` hay không.
3. Đọc `docs/ARCHINOTE-MAP.md` — xác nhận module "Hiện trường" (đo đạc/ảnh/ghi âm) của ArchiNote hiện **0% code**, nên VIỆC 6 là spec CHUẨN BỊ TRƯỚC (đúng luật §9), không phải audit luồng đang chạy.
4. Bảng khớp/lệch nhu cầu dữ liệu 2 bên — 4/5 hàng lệch (thiếu hoàn toàn), 1 hàng một phần.
5. Đề xuất `IdfFieldNote` (additive, bump `IDF_VERSION` → 3 theo đúng pattern migration có sẵn) + `ExternalRefLite` tái dùng convention `system` tự do đã có ở `ExternalRef` Prisma (không phát minh khuôn mới, đúng §0v).
6. Đề xuất 3 tầng cache cục bộ ArchiNote: ghi cục bộ trước → hàng đợi đồng bộ xuất file `.idfnotes.json` → IF nhập và duyệt từng phần (đúng §0e KS3 "duyệt theo phần", không tự động nuốt note thành entity).

File kết quả: `docs/PHUONG-AN-CAU-IDF.md`.

GAP mới: **G-P-06** — `.idf` hiện có 0 field `external`/`source` (xác nhận lại đúng như §0v đã ghi), cần `IdfFieldNote`/`ExternalRefLite` mới có thể làm cầu nối ArchiNote theo L-EXT2. **G-P-07** — docstring `idf.ts:1-6` và interface thật `IdfFile` không khớp nhau về field `photos` — cần phiên có quyền đọc `model.ts` xác nhận và sửa docstring nếu sai.

Chưa kiểm chứng được: (a) cấu trúc đầy đủ `Doc`/`entities` trong `lib/cad/model.ts` — không đọc trong phiên này (ngoài phạm vi thời gian); (b) ArchiNote lưu cục bộ bằng công nghệ gì — không mount được `ttt-tasks/src`; (c) cơ chế chuyển giao file `.idfnotes.json` giữa 2 app (đường truyền hạ tầng) — chỉ đề xuất hình dạng dữ liệu, không quyết đường truyền; (d) `PROJECT_STATUS` 2 chiều — ghi nhận là việc khác lớn hơn, không thiết kế lại trong file này.

---

## Lỗi tôi đã mắc trong phiên này (HG6)

1. **Lỗi awk cắt tên file tiếng Việt có khoảng trắng (VIỆC 5).** Lần đầu liệt kê `docs/mocks/` bằng `ls -la ... | awk '{print $6,$7,$5,$NF}'` — với filename có dấu cách (VD "2D Kỹ thuật.dc.html"), `awk` chỉ in được TỪ CUỐI (`$NF}`), làm bảng đầu tiên sai tên hàng loạt file (chỉ còn "thuật.dc.html", "việc.dc.html" lặp 3 lần không phân biệt được). Tự phát hiện trước khi dùng số liệu sai — chuyển sang `stat -c '%Y|%s|%n'` (không tách trường theo khoảng trắng) và làm lại toàn bộ bảng. Không có số liệu sai lọt vào báo cáo cuối, nhưng đây là bằng chứng cho luật §0t "phải nghi ngờ output lệnh shell mặc định với dữ liệu có ký tự đặc biệt", không chỉ riêng byte điều khiển.
2. **Viết nhầm mtime trong bảng VIỆC 5 rồi phải tự sửa 2 lần.** Khi soạn bảng "20 file .dc.html mới nhất", tôi gõ tay `22:41` cho `2D Kỹ thuật.dc.html` (không đối chiếu lại số `stat` thật đã có sẵn ngay phía trên), rồi ở lần soát lại phát hiện SAI (giá trị thật là `15:41:32`, không phải `22:41` và cũng không phải `16:18` như tôi đoán lần sửa đầu) — phải sửa 2 lần trong cùng 1 file trước khi chốt đúng số. Bài học: khi có số liệu thô đã grep được ngay phía trên, phải copy-paste lại, không gõ tay theo trí nhớ tạm — đúng đúng tinh thần N7 dù đây không phải lỗi grep sai chỉ báo mà là lỗi chép tay ẩu.
3. **Chưa mở render trực quan file mock nào** (VIỆC 5) — mọi nhận định "trùng màn hình" chỉ dựa trên `grep` text (h1/title), CHƯA đạt chuẩn NT3 (ảnh chụp cạnh file để xác nhận bằng mắt). Đã tự gắn nhãn "nghi vấn"/CHƯA VERIFY rõ ràng cho các cặp không chắc (Tiến độ, cụm 4 file quy trình) thay vì khẳng định liều — nhưng nếu có thêm thời gian, nên render bằng Chromium để xác nhận chắc hơn (công cụ có sẵn cho TỔNG theo `00-BAT-DAU-DOC-DAY.md §0g NT3`, nhưng phiên COWORK-PHU này không được giao quyền/công cụ render đó).
4. **Không đụng vùng cấm** — tự kiểm lại: không sửa/xoá bất kỳ file nào trong `lib/**`, `components/**`, `app/**`, `prisma/**`, `docs/GAP-IF.md`, `docs/VIEC-DANG-CHO.md`, `docs/00-BAT-DAU-DOC-DAY.md`, `docs/mocks/**`, `docs/M*-OUT.md`. Không chạy lệnh `git` nào (chỉ dùng `npx tsc`, `grep -rna`, `stat`, `ls`, `Read`/`Edit`/`Write`). Sửa đúng 1 file cấu hình được phép (`tsconfig.json`, đúng 1 dòng, đúng VIỆC 1).
