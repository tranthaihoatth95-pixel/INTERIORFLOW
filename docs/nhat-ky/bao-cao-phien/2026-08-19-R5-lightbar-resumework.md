# Báo cáo R5 — mount LightBar cho hàng đợi render + ResumeWork vào DongStudioHome (19/08)

Lane UX/UI · phiếu theo `docs/IF-INTEGRATED-EXECUTION-MAP.md` §3 Đợt 0 · luật Hoà 16/08
"cái gì đang chạy cũng phải có thanh tiến trình".

## ① Tiền đề (⓪ + ⓪b) — XÁC NHẬN CẢ HAI, đo tại nguồn

- ⓪b: HEAD `c7f3ac8`, nhánh `main` — đúng mốc phiếu. Working tree dirty của phiên khác,
  chỉ sửa additive, không revert hunk nào.
- `LightBar` MỒ CÔI thật: grep toàn repo, 0 importer (chỉ 2 dòng COMMENT ở `LightArc.tsx:41`
  và `tien-trinh.ts:5` nhắc tên). Panel hàng đợi (`RenderQueuePanel.tsx`) trước chỉ dùng
  `LightArc` (cung) + số % rời.
- `ResumeWork` MỒ CÔI thật: 0 importer; `HomeScreen.tsx:204,259` chỉ NHẮC trong comment
  ("đổi từ ÉP sang MỜI... người tự bấm") — tức P-N V1 đã cắt auto-resume và HỨA widget thay
  thế, nhưng widget chưa bao giờ được mount. Home sống = `DongStudioHome` (mount tại
  `HomeScreen.tsx:567`). ⇒ không REFUSE phần nào.

## ② Việc đã làm — 2 file sửa, đều additive

### `components/render-studio/RenderQueuePanel.tsx`
- Job **đang chạy**: thay cụm `LightArc 26px + <span>%` trong `JobCard` bằng **`LightBar`**
  (soVach 20, height 7 — thanh hẹp ~230px) đặt dưới dòng trạng thái. Không nói cùng một tin
  hai lần trong một thẻ.
- **Hai nhánh union đúng thiết kế lõi `tien-trinh.ts`**:
  `value = job.progress > 0 ? pct : undefined`. Lý do: số 0 lúc mới chạy là **store tự ghi**
  (`render-queue-store.ts:155`), KHÔNG phải số engine báo — hiện "0%" đứng yên là số giả
  đúng loại luật 16/08 cấm ⇒ nhánh không-đo-được (rai trôi, không số) cho tới khi relay
  engine ghi số thật đầu tiên.
- Pill thu gọn GIỮ `LightArc` (vòng cung nhỏ vừa pill) — hai mặt tiền cùng MỘT lõi, [T2].
- Không thêm chuyển động mới; `prefers-reduced-motion` do chính LightBar xử (keyframes cục
  bộ instance, đã có test).

### `components/home/DongStudioHome.tsx`
- Import `ResumeWork` + `buildResumeCard`/`resumeWorkHasSignal` + `loadResume`; đọc resume
  MỘT lần trong `useEffect` theo `currentUserId` (widget không tự đụng localStorage —
  SSR-safe, đúng hợp đồng props); `currentProjectId` đọc từ FlowStore.
- Mount theo khuôn TIỀN LỆ H/I (WeeklyMaterial `auto` chồng NewsFeed): `notesStack` =
  ResumeWork (hàng `auto`, cao đúng nội dung) xếp CHỒNG trên QuickNotes (`minmax(0,1fr)`),
  thay 4 chỗ dùng QuickNotes ở CẢ 4 layout (bento đầy · vừa · mỏng · stacked mobile) —
  MỘT định nghĩa, không chép 4 lần.
- **Widget thiếu dữ liệu TỰ ẨN** (luật 13/08): `buildResumeCard` trả null ⇒ `hasR=false` ⇒
  ô Ghi chú y nguyên như trước, không khung rỗng.
- CỐ Ý không sửa `bento-layout.ts` (ngoài scope ghi, 256 ca test): widget không mang số ô
  `index` (prop optional) — chấp nhận không có "0N ·" thay vì đụng file ngoài phạm vi.

## ③ Nghiệm thu

- `npm run tsc` — **0 lỗi** (toàn repo, working tree dirty của các phiên khác vẫn xanh).
- Test targeted: `tien-trinh.test.ts` **64 pass** · `resume-card.test.ts` **29 pass** ·
  `bento-layout.test.ts` **30 pass** · 0 fail.
- **Browser THẬT** (server 3001 sẵn có, khoẻ — 200/0.7s; KHÔNG đẻ server mới):
  - Home `/`: widget **"VIỆC ĐANG DỞ"** hiện đúng chỗ (chồng trên Ghi chú nhanh), nấc gọn
    chip "Trình chiếu · hôm nay", hover lên nấc vừa, nút "Mở lại →" chạy.
  - `/projects/<id>/render`: `__ifRenderQueue.demo(2)` (0 credit) — job đang chạy hiện
    **dãy vạch LightBar + % số thật** (chụp được 71% và 26%), job xếp hàng KHÔNG có thanh,
    job xong thanh biến mất + thumbnail đổi ảnh kết quả + "Xong · 9 giây", ETA "còn ~7 giây"
    chỉ hiện sau khi có job xong. Đã `clear()` hàng đợi diễn tập sau khi xong.

## ④ Không đụng

LightBar.tsx · tien-trinh.ts · globals.css · `--accent*` · bento-layout.ts · mọi hunk dirty
sẵn có của phiên khác trong DongStudioHome. Không git add/commit.

## ⑤ Phát hiện ngoài phạm vi (không sửa)

- Bấm "Mở lại" khi resume KHÔNG có `routeId` (route toàn cục `/present-editor`) → 
  `LegacyStageRedirect` dội về Home kèm toast "Chọn dự án trước". Hành vi CŨ của cầu
  redirect, không phải lỗi widget — nhưng trải nghiệm "mở lại mà bị dội về" đáng một phiếu
  riêng (hoặc widget ẩn nút khi routeId null — cần chốt, vì card vẫn mang tin hữu ích).

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- Nhánh KHÔNG-ĐO-ĐƯỢC (rai trôi) chưa THẤY bằng mắt trên app: demo job báo số sau ~120ms,
  cửa sổ progress=0 quá ngắn để chụp. Đường đi đã có test lõi (64 ca) + tsc ép union,
  nhưng hình thái rai-trôi trong bối cảnh thẻ hẹp 230px là suy từ mã, chưa nhìn.
- Job THẬT (tốn credit) chưa chạy — như trạng thái sổ 15/08, chỉ verify bằng demo 0-credit.
- `prefers-reduced-motion` chưa kích hoạt thật trong lượt này.
- Nấc `stacked` (mobile <1100px) chưa chụp: ResumeWork nằm trong block h-[220px] chung với
  Ghi chú — có thể chật, chưa đo mắt.
- Theme SÁNG chưa chụp (server đang theme tối).

## ⑦c HẠN DÙNG

Kết luận "LightBar/ResumeWork mồ côi" đúng tại HEAD `c7f3ac8` + working tree 19/08 —
các lane song song đang sửa nhiều file, ai đọc sau phải grep lại tại nguồn, đừng chép số.
