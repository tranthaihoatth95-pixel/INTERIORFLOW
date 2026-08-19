# CONTINUITY-1 — sửa bug "Mở lại" dội về Home (19/08)

## ① Tiền đề
Xác nhận đúng như phiếu giao: `components/entry/ResumeTracker.tsx` đứng trên route scope dự án
(`/projects/[id]/cad`…) chỉ ghi `saveResume(userId, { route })`, không kèm id dự án. Khi resume
trước đó chưa từng có `flowId` (case "vào thẳng URL/bookmark"), `buildResumeCard()`
(`components/home/widgets/resume-card.ts:80`) tính `routeId = currentProjectId ||
resume.flowId || null` ra `null` ⇒ `resumeHref()` trả route toàn cục cũ (`/cad-editor`) ⇒
`LegacyStageRedirect` tra lại cũng null ⇒ dội `/?notice=choose-project`. Gốc bệnh đúng ở
`ResumeTracker.tsx` (thiếu ghi id) — không đụng `resume-card.ts` hay `LegacyStageRedirect.tsx`.

`git log --oneline -1` = `c7f3ac8`, main, đúng mốc ⓪b. Không đụng `DongStudioHome.tsx`.

## ② Việc đã làm
- `lib/resume.ts`: thêm hàm thuần `computeResumePatch(pathname)` — tách logic tính patch resume
  ra khỏi component để test được không cần DOM. Khi `parseStageRoute()` nhận diện route scope
  dự án, patch trả về kèm `flowId: scoped.projectId` (field `flowId` đã có sẵn trong
  `ResumeState`, chỉ thiếu người ghi ở route này).
- `components/entry/ResumeTracker.tsx`: effect gọi `computeResumePatch(pathname)` thay vì tự
  lặp logic tại chỗ; giữ nguyên hành vi route `/` (vẫn do `app/page.tsx` tự ghi, không đụng).
- Không sửa `resume-card.ts`, `LegacyStageRedirect.tsx`, `DongStudioHome.tsx`, mọi store 2D/3D.

## ③ Test
- `lib/resume.test.ts` (mới, sucrase-node, theo khuôn `StoreHydrator.test.ts`): 15 ca — route
  scope dự án kèm đúng flowId (cad/present/photo), route `render` (legacy `/`) bị loại đúng vì
  `/` tự ghi nơi khác, id có ký tự encode được decode đúng, route studio cũ trực tiếp không có
  flowId (giữ hành vi cũ), route lạ/không resumable → null. **15 pass, 0 fail.**
- `components/home/widgets/resume-card.test.ts` (đã có, không sửa): 29 pass, 0 fail — xác nhận
  không phá vỡ phía đọc.
- `npm run tsc`: 0 lỗi.

## ④ BROWSER-PENDING
Chưa mở app thật trong phiên này. Kịch bản nghiệm thu mắt cần chạy:
1. Vào `/projects/<id>/cad` (qua URL trực tiếp/bookmark, không qua Home).
2. Bấm về Home.
3. Bấm "Mở lại" ở widget ResumeWork.
4. Kỳ vọng: vào đúng lại `/projects/<id>/cad`. KHÔNG dội về `/?notice=choose-project`.

## ⑤ Phạm vi ghi
Đúng SCOPE phiếu: `components/entry/ResumeTracker.tsx` + `lib/resume.ts` + test mới
`lib/resume.test.ts`. Không đụng `resume-card.ts`, `LegacyStageRedirect.tsx`,
`DongStudioHome.tsx` (xác nhận `git diff components/home/DongStudioHome.tsx | grep -c
'ResumeWork'` = 3, giữ nguyên diff R5 của phiên khác).

## ⑥ Luật git
Không add/commit/push/stash/checkout/reset — đúng luật.

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy trên app thật (browser) — mọi kết luận dựa trên đọc mã + test thuần logic.
- `computeResumePatch` giả định `scoped.projectId` từ `parseStageRoute()` luôn là id ổn định
  dùng lại được cho `routeId` ở `buildResumeCard()` — đúng theo code hiện tại
  (`resolveFlowForRouteId` khớp cả `Project.id` lẫn `Flow.id`), nhưng chưa verify bằng dữ liệu
  DB thật (dự án có `Project.id` khác `Flow.id`, hay đứng route bằng `Flow.id` thô).
- Chưa kiểm case route scope dự án nhưng KHÔNG khớp `Project.id` nào (project đã xoá/id sai) —
  hành vi vẫn ghi `flowId` đó, `resolveFlowForRouteId` phía đọc tự xử lý null nếu không khớp;
  chưa test tay case này qua UI.

## ⑦c Hạn dùng kết luận
Kết luận dựa trên source đọc tại `c7f3ac8`. Nếu `resume-card.ts`/`LegacyStageRedirect.tsx`/
`scope-core.ts` đổi cấu trúc `routeId`/`ScopeInfo` sau mốc này, phải đọc lại trước khi tin.
