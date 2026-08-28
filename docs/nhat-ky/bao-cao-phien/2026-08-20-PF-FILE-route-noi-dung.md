# PF-FILE — route đọc nội dung `ProjectFile` (20/08)

Phiếu: `GET /api/project-files/[id]/file` + nối vào ô xem trước của *Tệp nguồn dự án*.
Mốc: `c7f3ac8`. Vùng ghi: `app/api/project-files/**`, `components/filemanager/TepNguonDuAn.tsx`.

---

## ⓪ TIỀN ĐỀ — kiểm rồi mới làm

| Giả định của phiếu | Kiểm | Kết |
|---|---|---|
| HEAD = `c7f3ac8` | `git log --oneline -1` | ✅ đúng |
| UI không hiện được preview cho tệp đã lưu | đọc `TepNguonDuAn.tsx` docstring cũ (dòng 27-30) + `OXemTruoc` — chỉ nhận `anhPhien[id]` (dataUrl trong phiên) hoặc `ketQua[id].assetUrl` (sau promote) | ✅ nợ CÓ THẬT |
| Chưa có route đọc nội dung ProjectFile | `ls app/api/project-files/` = `[id]/{promote,route.ts}`, `_lib`, `route.ts` — không có `file/` | ✅ đúng |
| Dev server 3001 sống | `lsof -ti :3001` → 2279/78070 · `curl /files` → 200 | ✅ không restart |

**Không bác tiền đề nào.** Một chỗ phải đọc khác phiếu — xem ⑦b mục ①.

---

## ① LOOK INSIDE — cái gì đã có, cái gì mới

Theo NO-REBUILD: đo trước, chỉ NEW phần không tồn tại.

| Cần | Primitive đã có | Bằng chứng | Hành động |
|---|---|---|---|
| Phục vụ byte từ `./uploads` | `app/api/library/[id]/file/route.ts:8-35` | route LibraryAsset live | **REUSE khuôn nguyên** |
| MIME đúng, không tin DB | `lib/server/mime-sniff.ts:37` `sniffKind` + `isRasterImageKind` | whitelist magic-bytes | **REUSE** |
| Kiểm quyền | `lib/server/access.ts:32` `assertProjectAccess` | cửa DUY NHẤT của repo | **REUSE** (không tự chế) |
| Body lỗi + 503 Prisma + 500 có log | `app/api/project-files/_lib/guard.ts:17,40` | `loiJson` · `kiemDelegate` | **REUSE** |
| Đường đọc nội dung `ProjectFile` | — | `grep` = 0 | **NEW** (chính là nợ) |
| Chặn path traversal | — | khuôn gốc `library/[id]/file:14` không guard | **EXTEND** |

*Negative evidence cho NEW:* đã tìm `library/[id]/file`, `library-save.ts`, `promote.ts`, 3 route `project-files`; không route nào phục vụ byte của `ProjectFile`, và `library/[id]/file` tra bảng `libraryAsset` nên không dùng lại được — nó không biết `projectId` để kiểm quyền theo dự án. Không tạo island: route mới nằm trong đúng cụm `project-files`, dùng chung `_lib/guard.ts` và chung kho `./uploads`.

## ② ĐÃ LÀM

1. **`app/api/project-files/_lib/doc-noi-dung.ts`** (mới) — LÕI: tra bản ghi → `assertProjectAccess(userId, projectId, 'viewer')` → chặn tên file → đọc đĩa → sniff lại byte → dựng header. Cố ý **không gọi `getSessionUser()`**, nhận `userId` từ caller ⇒ test gọi được THẲNG (cùng lý do `promoteProjectFile()` tách khỏi route).
2. **`app/api/project-files/[id]/file/route.ts`** (mới) — vỏ mỏng 45 dòng: auth → `kiemDelegate` → lõi → `NextResponse`. Lỗi đi qua `loiJson` chung.
3. **`app/api/project-files/[id]/file/route.test.ts`** (mới) — 11 assertion, gọi lõi THẬT trên `dev.db`.
4. **`components/filemanager/TepNguonDuAn.tsx`** — `OXemTruoc` thêm nguồn ảnh thứ ③ (route mới) + `onError` rơi về badge; docstring cũ *"ProjectFile KHÔNG có route đọc nội dung"* đã **đóng dấu đính chính tại chỗ**, không bỏ hoang.

### Hợp đồng mã lỗi

| Mã | Khi nào |
|---|---|
| 401 | chưa đăng nhập |
| 403 | là thành viên nhưng thiếu vai (đọc chỉ cần `viewer` ⇒ thực tế không xảy ra; giữ nhánh cho đúng hợp đồng) |
| **404** | tệp không tồn tại · đã xoá mềm · **KHÔNG phải thành viên dự án** |
| **410** | bản ghi còn mà file mất trên đĩa, hoặc cột `path` bất thường |
| 503 | Prisma Client thiếu model `ProjectFile` (lỗi vận hành) |
| 500 | luôn kèm body JSON + `console.error` |

## ③ VÌ SAO LÀM THẾ — ba quyết định đáng cãi

**① Không phải thành viên ⇒ 404, KHÔNG phải 403 (lệch mô tả phiếu, cố ý).**
Phiếu ghi *"403 không phải thành viên"*. `lib/server/access.ts:44` cố ý ném **404**: *"không tiết lộ project này có tồn tại"*. Trả 403 ở đây là nói cho người ngoài biết file id đó có thật và thuộc một dự án có thật — rò rỉ mà cả 3 route anh em đang tránh. Chọn **phương án an toàn nhất + đồng bộ với repo**, không fork một chính sách quyền thứ hai cho một route.

**② Chặn path traversal dù luồng bình thường không sinh được.**
`path` do `luuProjectFile()` sinh (`<base36>_<rand6>.<ext>`) nên luôn phẳng. Nhưng đó là **cột chuỗi tự do trong DB** — một đường ghi khác (import, migration, sửa tay) đặt `../../.env` vào là đọc được file ngoài kho. Hai đai: regex tên phẳng + so `path.resolve` với `UPLOAD_DIR/basename`. Trả **410** chứ không 400 — không báo cho bên ngoài biết ta vừa phát hiện `path` bất thường.

**③ Sniff lại byte mỗi lần trả, không dùng cột `mime`.**
Đúng §6.2 audit backend. Test ⑧ chứng minh bằng ca thật: đặt `mime='text/html'` trong DB mà byte là PNG ⇒ header vẫn `image/png`. Cột bẩn không lọt ra được thành vector XSS.

## ④ NGHIỆM THU

### Máy

```
npx tsc --noEmit                                        → 0 lỗi
app/api/project-files/[id]/file/route.test.ts           → 11 assertions PASS
lib/server/promote.test.ts                              → 16 assertions PASS (không hồi quy)
components/filemanager/tep-nguon.test.ts                → PASS
app/api/project-asset-usage/route.test.ts               → PASS
```

Phủ của test mới: tên file an toàn (8 ca thuần) · thành viên đọc được + đủ 3 header · **cột `mime` bẩn không thắng sniff** · PDF ⇒ `attachment` tên đã làm sạch · người ngoài dự án bị chặn · xoá mềm ⇒ 404 · id không có ⇒ 404 · file mất đĩa ⇒ 410 · **path traversal 4 biến thể** (`../../package.json`, `../.env`, `/etc/passwd`, `a/../../b.png`) đều 410.

Một chi tiết đáng ghi: fixture khẳng định `nguoiLa.isAdmin === false` trước khi dùng — `access.ts:47` cho admin cửa hậu 'owner', nếu người lạ lỡ là admin thì ca "không phải thành viên" **PASS giả**.

### Browser thật — localhost:3001 /files, 1280×720

| Bước | Kết quả |
|---|---|
| POST ảnh PNG 64×64 thật (canvas) vào *Dự án mới* | 200, `path=mt0xq0zj_pwjlnz.png` |
| **Tải lại trang** (select về "— chọn dự án —" ⇒ 0 dataUrl trong bộ nhớ) rồi chọn lại dự án | **ảnh HIỆN** — `src=/api/project-files/cmt0xq…/file`, `complete=true`, `naturalWidth/Height = 64/64` ⇒ **đúng ca đang hỏng, nay chạy** |
| Đọc header route | `content-type: image/png` · `x-content-type-options: nosniff` · `cache-control: private, max-age=86400` |
| id không tồn tại | 404 `{"error":"Không tìm thấy tệp dự án."}` |
| Xoá file trên đĩa, bản ghi còn | **410** `{"error":"File mất trên đĩa."}` |
| Tệp hỏng + tải lại trang | rơi về **badge "PNG"**, khung vẫn **48×48** — không vỡ khung; tệp lành cùng danh sách vẫn ra ảnh |
| Nút **Xoá** trên UI → soft-delete | route trả **404**, DELETE lần hai cũng 404 |

Console: mỗi ảnh hỏng để lại **đúng MỘT** dòng `Failed to load resource: 410 (Gone)` — dòng của chính trình duyệt, không thể tắt cho `<img>`; **không có vòng lặp thử lại, không spam**, `onError` chốt một lần rồi thôi (bài học D5 đạt).

### ⛔ Dọn sạch

| | Trước | Sau |
|---|---|---|
| `LibraryAsset` | 1613 | **1613** |
| `ProjectFile` | 0 | **0** |
| `ProjectAssetUsage` | 0 | **0** |
| file trong `./uploads` | 1616 | **1616** |

2 bản ghi dựng lúc verify đã xoá cứng; 2 file trong `./uploads` đã `rm`; 2 script tạm (`.pf-count.ts`, `.pf-clean.ts`) đã xoá. Test tự đếm trước/sau và tự `unlink` file nó ghi.

## ⑤ PHÁT HIỆN NGOÀI PHẠM VI — không sửa

**Hydration mismatch có sẵn trong `TepNguonDuAn.tsx:154`**: `useMemo(() => Math.random()…)` sinh id khác nhau giữa server và client ⇒ mỗi lần tải trang là một `Warning: Prop aria-describedby did not match` trong console. Có TRƯỚC phiếu này, không do thay đổi của tôi. Cách sửa đúng là `useId()`. **Không sửa** vì: ngoài phạm vi phiếu, và tệp này có thể đang được lane thiết kế đụng. Đáng mở phiếu riêng — nó vừa là a11y (id treo hụt) vừa là nhiễu console che lỗi thật.

## ⑥ CÒN LẠI

- Đường `EXTEND` tự nhiên: cho phép xem PDF ngay trong app (hiện là `attachment`). Chưa làm — nhúng viewer là quyết định riêng.
- Route chưa có `HEAD`; `<img>` không cần, nhưng nếu sau này có chỗ muốn hỏi "file còn không" mà không tải byte thì thêm.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

1. **404-thay-403 là tôi tự quyết**, lệch câu chữ của phiếu. Căn cứ: `access.ts:44` + 3 route anh em. Nếu Hoà muốn đúng 403 thì phải đổi ở `access.ts` cho cả repo, không vá riêng route này — và đổi thế là chấp nhận lộ sự tồn tại của dự án.
2. **Test không đi qua `getSessionUser()`** — nhánh 401 chỉ được đọc bằng mắt trong `route.ts:36`, không có test tự động. Giới hạn có sẵn của repo (cookie thật, đã ghi ở `draft-project.test.ts`); `route.guard.test.ts` là tệp duy nhất giả được session và nó phải giả cả `jose` + `next/headers`.
3. **Nhánh 403 chưa bao giờ chạy** trong thực tế (đọc chỉ cần `viewer`, nấc thấp nhất). Nó là mã chết-có-chủ-đích; nếu sau này siết nấc đọc lên thì mới sống.
4. **Chỉ đo trên Chromium của Browser pane**, 1280×720, một phiên đăng nhập. Safari/Firefox là suy; chưa thử trình đọc màn hình.
5. **Ca `Cache-Control: private, max-age=86400` chưa được cân**: sau khi ảnh vào cache trình duyệt, xoá file trên đĩa thì **ô xem trước vẫn hiện ảnh cũ tới 24h** — đã QUAN SÁT ĐƯỢC trong lượt verify (phải tạo tệp thứ hai chưa từng tải mới thấy fallback). Đây là hành vi **kế thừa nguyên từ `library/[id]/file`**, tôi cố ý không đổi để hai route không phân kỳ — nhưng nó là thứ thật, không phải lý thuyết. Nếu thấy phiền: dùng `contentHash` làm query-string cache-buster, sửa MỘT lượt cho cả hai route.
6. **Chưa đo hiệu năng** với file sát trần 25MB — route đọc trọn file vào RAM rồi trả (giống khuôn gốc), không stream. Với ô xem trước 48px thì đây là lãng phí băng thông thật (tải nguyên ảnh gốc để vẽ 48px); đường ra là thumbnail, chưa có, chưa nằm trong phiếu.
7. **`Buffer<ArrayBuffer>` trong kiểu trả** là để tránh TS2345 — đúng với `@types/node` hiện tại của repo; nâng cấp @types/node có thể phải đọc lại chỗ đó (đã ghi lý do ngay trên dòng khai).
8. Giàn giáo vá alias `@/` trong test là **chép khuôn `route.guard.test.ts:18-27`**; nếu ai đổi cách nạp module chung thì cả hai tệp cùng gãy, không riêng tệp này.

## ⑦c HẠN DÙNG KẾT LUẬN

- Số đếm DB (**LA 1613 · PF 0 · PAU 0**) và **uploads 1616** là ảnh chụp lúc 20/08 03:0x. Phiên khác chạy song song là đổi ngay — **đo lại tại nguồn**, đừng trích số này.
- Kết luận *"404 cho người ngoài"* hết hiệu lực nếu `lib/server/access.ts` đổi chính sách. Test ⑤ có ghi chú buộc đọc lại lý do trước khi sửa test.
- Kết luận *"`library/[id]/file` không guard path"* đúng tại `c7f3ac8`. Nếu lane khác vá route đó, nên **gộp hai chỗ về một helper chung** thay vì để hai bản guard.
- Kết luận *"hydration mismatch là có sẵn"* đúng tại `c7f3ac8`; ai sửa `idNhan` thì mục ⑤ hết hạn.
