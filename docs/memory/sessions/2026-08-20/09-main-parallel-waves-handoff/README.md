# 09 · MAIN — 3 WAVE SONG SONG + UX PASS + SỬA BUG GENERATION THẬT — bàn giao hết context

> Phiên này KẾ TIẾP `07-ban-giao-main` (đọc trước nếu cần bối cảnh xa hơn). Không lặp lại nội
> dung đó — chỉ ghi những gì MỚI trong phiên này. Đọc `docs/coordination/IF-LIVE-BRIDGE.md`
> TRƯỚC — nó là bản tóm tắt sống, file này là chi tiết đầy đủ phía sau nó.

## 1 · GIT — ĐỌC TRƯỚC KHI LÀM GÌ
- Nhánh làm việc: **`backup/2026-08-19-batch0a`**, tip **`2d7b962`**, đã push remote.
- `main` = `2dfed16` — **CHƯA nhập**, đúng lệnh cũ (chỉ nhập sau khi diễn tập demo loop xanh).
- 8 checkpoint tuần tự trong phiên này (mới nhất trước):
  `2d7b962` fix timeout+lỗi dịch generation → `7418ac8` UX Coherence Pass (3 lane) →
  `f3e6d89` login color + chẩn ComfyUI → `a3ff86a` Wave 3 Spec→Present →
  `7e1001b` Wave 2 (3D+Files) → `4a8801d` Wave 1 (2D+Home+Activity) →
  `1824ddd` CommandLine quiet-by-default → `9a3934e` (tip cũ từ phiên trước).
- **Cách checkpoint đã dùng cả phiên** (giữ nguyên, đã sửa đúng 1 lỗi thật gặp phải — xem mục 6):
  `GIT_INDEX_FILE=/tmp/if_ckpt_X` (path CỐ ĐỊNH TRONG MỘT LỆNH BASH DUY NHẤT, không tách 2 lệnh
  riêng — `$$` đổi PID giữa hai lệnh Bash là nguyên nhân sự cố) → `git read-tree <parent>` →
  `git add -- <chỉ đúng file đã đổi>` → `git write-tree` → **BẮT BUỘC guard**
  `git ls-tree -r $TREE | wc -l` phải **≥ 2000**, nếu nhỏ hơn thì ABORT ngay, đừng commit →
  `git commit-tree $TREE -p <parent> -m "..."` → `git branch -f backup/2026-08-19-batch0a <commit>`
  → `git push origin backup/2026-08-19-batch0a:backup/2026-08-19-batch0a`.
- ⛔ **KHÔNG tự commit/push** khi giao việc cho lane con — MAIN gộp tập trung sau khi nhận đủ báo
  cáo, để tránh đua git trên cùng working tree (đã có 1 lần suýt hỏng, xem mục 6).

## 2 · TRẠNG THÁI HẠ TẦNG LÚC BÀN GIAO (đã đo lại ngay trước khi viết file này)
- `npx tsc --noEmit` → **0 lỗi**.
- **App dev server**: PID 19556/19576, cổng **3001**, `curl localhost:3001/` → 200. (Server CŨ từ
  đầu phiên — PID 12606 — đã bị MAIN kill giữa phiên để mở "clean verification window"; server
  hiện tại là bản khởi động lại sạch.)
- **ComfyUI THẬT đang chạy**: PID 18339, `127.0.0.1:8188`, `curl :8188/system_stats` → 200.
  Khởi bằng lệnh trực tiếp (KHÔNG qua "Comfy Desktop.app" — app đó treo vô hạn ở bước kiểm tra
  mạng/cloud-capacity lúc khởi động):
  ```
  cd /Users/tranben/ComfyUI-Installs/ComfyUI/ComfyUI
  /Users/tranben/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/bin/python3 main.py --listen 127.0.0.1 --port 8188
  ```
  Log: `/tmp/comfyui-direct-launch.log`.
- **Model SDXL + ControlNet đã khôi phục bằng SYMLINK** (không tải lại, 0 byte tốn thêm đĩa) —
  tìm thấy trong một bản cài ComfyUI KHÁC trên cùng máy (`/Users/tranben/ComfyUI/models/`, bản cũ
  không dùng nữa nhưng model vẫn còn nguyên):
  ```
  /Users/tranben/ComfyUI-Installs/ComfyUI/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors
    -> /Users/tranben/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors
  /Users/tranben/ComfyUI-Installs/ComfyUI/ComfyUI/models/controlnet/controlnet-canny-sdxl-1.0.safetensors
    -> /Users/tranben/ComfyUI/models/controlnet/controlnet-canny-sdxl-1.0.safetensors
  ```
  Xác nhận qua chính API ComfyUI (`/object_info/CheckpointLoaderSimple`) rằng
  `sd_xl_base_1.0.safetensors` đã hiện diện. **ĐÃ CHẠY THẬT 2 job generation thành công** (không
  phải chỉ health-check) — xem mục 4.
- **Migration `ProjectFile.reviewState` CHƯA CHẠY** — đã kiểm trực tiếp
  `sqlite3 prisma/dev.db "PRAGMA table_info(ProjectFile)"`, 3 cột `reviewState`/`reviewedAt`/
  `reviewedBy` **VẪN CHƯA CÓ**. Backup DB đã sẵn sàng:
  `prisma/dev.db.bak-20260820-pre-review-migration` (36.7MB, integrity-check OK). Lệnh Hoà cần
  chạy (agent KHÔNG được tự chạy, đúng luật CLAUDE.md):
  ```
  npx prisma migrate dev --name add_project_file_review_state
  ```
  Sau khi chạy: verify `sqlite3 prisma/dev.db "PRAGMA table_info(ProjectFile);"` có 3 cột +
  `npx tsc --noEmit` vẫn 0 + browser-smoke Files/Review/Promote còn load được.

## 3 · VIỆC ĐÃ LÀM TRONG PHIÊN — TÓM THEO SÓNG

### Wave 1 (song song, 4 lane): A·2D · B·Home+Shell · C·Vitals+Activity+Present · QA
- 2D: cursor theo tool (mũi tên/grab/crosshair đúng ngữ cảnh, trước cứng crosshair mọi lúc).
- Home: cá nhân hoá THẬT — đổi thứ tự/ghim/ẩn widget, lưu `lib/home/widget-prefs.ts`
  (localStorage per-user), verify end-to-end (đổi → reload → giữ đúng).
- Vitals/AppChrome: xác nhận 3-vùng (Trái/Giữa/Phải) đã đúng từ dở dang trước đó — không cần sửa.
- **Activity/Flow — xây MỚI HOÀN TOÀN**: chuông ở cụm phải-trên (`CumPhaiTren.tsx`) → Peek → cột
  phải đầy đủ (`components/studio/HoatDongChuong.tsx` + `hoat-dong-luong.ts`), đọc dữ liệu thật
  từ `useFlowStore` + `useRenderQueue`, không lộ tên provider/model.
- QA: tìm thấy "auto-redirect về Home" — sau đó xác nhận đây là **nhiễu môi trường đa-agent**
  (3 lane cùng hot-save file lớn → HMR storm), KHÔNG tái hiện khi chạy đơn lẻ.

### Wave 2 (song song, 2 lane): D·3D · E·Files/Library/Review
- 3D: **sửa lỗi thật** — chọn tường trong khung nhìn 3D nay có phản hồi (emissive tint +
  Box3Helper + Inspector mở cạnh đó); `StageToolbelt stage="render"` mount lần đầu → Image→Spec
  bấm được từ cả 2D lẫn 3D.
- Files/Library: **verify THẬT bằng UI thật** (không đọc code) — upload 1 file → Promote →
  Library → Where-Used, cả chuỗi hoạt động, còn để lại `lane-e-test-upload.png` làm bằng chứng
  sống trong demo project.

### Wave 3: F·Demo Spine (1 lane, agent bị STALL giữa chừng — đã RESUME thành công qua SendMessage)
- **Sửa gap thật duy nhất còn thiếu**: Spec→Present — `lib/present-editor/spec-present-handoff.ts`
  (mới, cùng pattern sessionStorage+fallback với cầu CAD→Present cũ, KHÔNG đẻ cơ chế thứ ba) +
  nút "Đưa sang Trình bày →" trong `CuaAnhThanhSpec.tsx` (chỉ bật SAU khi spec đã lưu thật, POST
  `/api/asset-representation` → 201) + effect tiêu thụ trong `PresentEditor.tsx`. Verify thật:
  deck 1→2 slide, 6 layer đúng dữ liệu spec.
- Bản đồ trung thực chuỗi Demo Spine (Sketch→Visual Generate→Accept→Image→Spec→Human Verify→
  Spec→Present→Motion→Promote→Where-Used→Activity→Home) — link nào CONNECTED, link nào BROKEN,
  ghi trong git log commit `a3ff86a`+`2d7b962` message.

### UX/UI Coherence Pass (song song, 3 lane 1/2/3) — checkpoint `7418ac8`
- Lane 1: xoá write cuối cùng còn sót của cờ localStorage CHẾT `interiorflow.stageDone`
  (`ProjectSelect.tsx`) — MỘT nguyên nhân thật của "auto-redirect", chưa khẳng định đóng hẳn.
- Lane 2: StatusBar bottom-edge hết dày (danh sách "Bắt điểm:..." thu về icon, mở qua Tooltip).
- Lane 3 (ADJUST): Library Browse→Passport→Technical Verify (`LibrarySheet.tsx` +
  `library-sheet-css.ts`); Command3DPanel mặc định thu gọn (`Render3DModeSkeleton.tsx`); xác nhận
  Present Page Setup chrome ĐÃ ĐÚNG cấu trúc (full-work-area, không phải modal) — gap còn lại là
  DATA (live sheet preview), không phải UX.

### ⭐ Sửa bug generation THẬT (đo được, checkpoint `2d7b962`) — quan trọng nhất phiên
Chạy 1 job generation thật đầu tiên trong phiên (Sketch→Ảnh thật qua ComfyUI vừa khôi phục model)
→ ComfyUI xác nhận `status:success` + ảnh thật trên đĩa, NHƯNG mất **25 phút 38 giây** (lượt
nguội: nạp 6,9GB checkpoint + 2,4GB ControlNet từ đĩa, MPS không CUDA, "eager" kernel). Root
cause đo được chính xác trong code:
1. `lib/ai/client.ts` `TIMEOUT_MS=180_000` (3 phút) — đúng cho cloud (fal/sd), SAI hoàn toàn cho
   tự-host lượt nguội. → thêm `COMFYUI_TIMEOUT_MS=2_400_000` (40 phút) CHỈ áp khi
   `providerForTier(tier,engine)==='comfyui'`.
2. `lib/execution.ts` `friendlyAiError()` — regex bắt chữ "timeout" khớp NHẦM thông điệp timeout
   của chính app vào nhánh "Backend AI chưa chạy / không kết nối được" — SAI, job vẫn đang chạy
   thật. → thêm nhánh riêng cho `^timeout \d+ phút`, nói đúng "job VẪN ĐANG CHẠY, đừng tắt".

**ĐÃ RE-TEST SỐNG SAU KHI SỬA**: chạy lại đúng node đó → hoàn tất 22:48, UI **KHÔNG** báo lỗi
sớm, hiển thị % tiến độ đúng suốt, kết quả trả về THẬT — xác nhận bằng DOM (`naturalWidth:960,
naturalHeight:640, complete:true`, base64 PNG thật). ⚠️ Có 1 chi tiết dễ nhầm khi soi lại: ảnh
kết quả render ở toạ độ NGOÀI khung 800px của screenshot công cụ (tool scale khác viewport thật
1440px) — đọc `getBoundingClientRect()` qua JS mới thấy đúng, đừng kết luận "ảnh không hiện" chỉ
vì screenshot không thấy nó.

## 4 · PHÁT HIỆN MỚI, CHƯA XỬ — CONTROLLED EDIT LÀ VỎ KHÔNG RUỘT
Mở kết quả generation ra bảng lệnh chỉnh sửa thật: Chọn thông minh · Co giãn vùng · Thêm lớp ·
Gộp lớp · Chế độ hoà · Đường cong · Cân trắng — **CẢ BẢY lệnh đều mang đúng một title**:
`"Lệnh của môi trường này — chưa nối bộ thi hành"`. UI/command-palette thật, đúng kiến trúc,
KHÔNG cái nào chạy được. Đây là **P0 tiếp theo** theo đúng khung ưu tiên Hoà đặt ("P0: Controlled
Edit nếu thiếu/dở dang").

## 5 · CÂU HỎI CÒN NGỎ — chưa đóng hẳn
- **Route bounce / auto-redirect-to-Home**: KHÔNG tái hiện trong TOÀN BỘ clean verification
  window (~45+ phút, server sạch, 0 lane chạy song song, kể cả xuyên qua 1 lần bị khoá màn hình
  do idle rồi mở khoá lại). Nghiêng mạnh về "nhiễu môi trường đa-agent lúc hot-save", nhưng CHƯA
  đủ để đóng hẳn theo đúng khung phân loại Hoà đặt ra — cần một lượt dùng thật (không phải chỉ
  đứng yên chờ) mới kết luận chắc.
- **Present live sheet preview**: chrome đúng, DATA chưa nối — cần lượt riêng (không phải UX).
- Gallery Home vẫn 1 ảnh/tuần — chưa chạm, đúng phạm vi đã xếp hàng đợi.
- 2D near-pointer contextual actions (Offset/Material cạnh vật chọn) — xác nhận THẬT SỰ CHƯA CÓ,
  việc BUILD có phạm vi rõ.

## 6 · BÀI HỌC ĐẮT (đừng học lại bằng đường đau)
- **`GIT_INDEX_FILE` PHẢI ở CÙNG MỘT LỆNH BASH với mọi lệnh git dùng nó.** Tách `export
  GIT_INDEX_FILE=/tmp/x_$$` ra một lệnh Bash riêng rồi gọi `git write-tree` ở lệnh Bash KHÁC ⇒
  `$$` đổi PID giữa hai lệnh ⇒ path lệch ⇒ index rỗng ⇒ **suýt push một commit TREE RỖNG lên
  remote** (đã xảy ra thật 1 lần đầu phiên, phát hiện qua `git ls-tree` đếm 0 file, force-fix
  ngay). Từ đó **mọi checkpoint sau đều có guard `wc -l` ≥ 2000 trước khi commit** — giữ nguyên
  guard này ở mọi lần checkpoint tiếp theo.
- **Agent con báo "BLOCKED" bằng ComfyUI backend không kết nối được — đừng tin ngay, tự đo lại.**
  Lane F báo generation BLOCKED — kiểm tay ra ComfyUI thật sự không chạy lúc đó (đúng), nhưng SAU
  KHI model được khôi phục, CÙNG THÔNG ĐIỆP LỖI đó lại xuất hiện dù ComfyUI đã chạy hoàn hảo — hoá
  ra là bug dịch lỗi (mục 3). Bài học: một thông điệp lỗi giống hệt có thể có HAI nguyên nhân khác
  hẳn nhau ở hai thời điểm khác nhau — luôn đo lại tận gốc (server log, DB, API) thay vì tin chữ
  hiển thị trên UI.
- **Đóng băng viết code trong lúc job nền đang chạy — nhưng đừng đóng băng VÔ THỜI HẠN.** Hoà ra
  lệnh "hold, đừng đụng gì" trong lúc generation 25 phút chạy — đúng. Nhưng SAU KHI job xong (log
  xác nhận `Prompt executed`), lệnh hold đó hết hiệu lực; tiếp tục treo tay chờ thay vì đọc log để
  biết job đã xong là lãng phí thời gian thật.
- **`ScheduleWakeup` là cách đúng để chờ job nền dài** (generation 20+ phút, agent con) — không
  chain `sleep` trong Bash (bị chặn), không polling dồn dập.
- **Screenshot của Browser pane bị SCALE (800px) so với viewport thật (1440px)** — toạ độ từ
  `getBoundingClientRect()` là toạ độ THẬT, không phải toạ độ screenshot. Một phần tử render đúng
  nhưng nằm ngoài khung screenshot bị hiểu nhầm là "không hiện ra" — luôn đối chiếu qua JS
  (`querySelector` + rect) trước khi kết luận UI hỏng.
- **File chưa từng được checkpoint dù đã "LIVE" nhiều ngày** — `components/ui/CuaAnhThanhSpec.tsx`
  (596 dòng, tính năng Image→Spec thật) chưa từng nằm trong LỊCH SỬ GIT của nhánh backup cho tới
  khi Lane F chạm vào nó — tồn tại độc lập trên đĩa, 0 backup git suốt session trước. Bài học:
  "LIVE trong truth-map" ≠ "đã có trong git" — hai việc khác nhau, đừng giả định cái này kéo theo
  cái kia.

## 7 · ƯU TIÊN CHO PHIÊN SAU (theo đúng thứ tự Hoà đặt)
1. **P0 — Controlled Edit**: nối bộ thi hành thật cho ít nhất 1-2 lệnh (gợi ý bắt đầu: Cân trắng
   hoặc Đường cong — biến đổi ảnh thuần, không cần model AI riêng, rẻ nhất để chứng minh đường
   dây chạy được trước khi làm các lệnh nặng hơn như Chọn thông minh/AI-based).
2. Một lượt QA DÙNG THẬT (không phải đứng yên) để đóng hẳn câu hỏi route-bounce.
3. Present live sheet preview — nối dữ liệu slide thật vào `ThietLapTrangDayDu.tsx`.
4. Sau khi P0 xong: diễn tập demo loop đầu-cuối lần cuối → mới xét nhập `main`.
5. Cửa thật cần Hoà (không đổi từ trước): chạy migration `ProjectFile.reviewState` (mục 2).
