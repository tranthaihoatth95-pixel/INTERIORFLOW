# BÁO CÁO PHIÊN H2 — home-overview-card (12/08/2026)

> Phiếu: `docs/phieu-giao/home-overview-card.md` · Dây máy: `home-overview-card` (agent KHÔNG sửa registry).
> Ràng buộc tuân thủ: KHÔNG git · KHÔNG dev server · không hex mới · thiếu dữ liệu thì ẨN dòng.

## ①-② Việc đã làm

### 1 · `lib/shell/last-stage.ts` (MỚI) + test [marker: lastStage]
- `setLastStage(projectKey, phase)` / `getLastStage(projectKey)` — localStorage
  `interiorflow.lastStage.<projectKey>`, khoá = Project.id thật hoặc Flow.id (cùng quy ước id ổn
  định của card Gallery `f.project?.id ?? f.id`). Best-effort, giá trị hỏng → null, không ném.
- Import TƯƠNG ĐỐI `../phases` (không `@/`) để `sucrase-node` chạy test trực tiếp được.
- `lib/shell/last-stage.test.ts` (MỚI): 5 nhóm assert (chưa ghi→null · per-project · khoá
  rỗng/null · giá trị hỏng · ghi đè) — stub localStorage tối thiểu cho node.

### 2 · Điểm GHI duy nhất — `lib/studio/stage-nav.ts` `pickStage()` (sửa tối thiểu: 1 import + 1 khối 5 dòng)
- Chọn `pickStage` thay vì StageSwitcher/AppChrome vì nó là CHOKE POINT chung của CẢ header
  desktop lẫn MobileMenu (tách ra 30/07 chính vì lý do đó) — 1 điểm ghi phủ mọi lần đổi chặng.
- Ghi cả 2 khoá (`currentProjectId` + `currentFlowId`) để card đọc bằng khoá nào cũng trúng;
  ghi trước mọi nhánh (kể cả samePane — vẫn đúng là chặng đang đứng).
- Giới hạn biết trước: vào thẳng route chặng bằng URL/F5 (không qua pickStage) thì CHƯA ghi —
  chấp nhận v1, ghi nợ bên dưới.

### 3 · `components/home/ProjectOverviewCard.tsx` (MỚI) [marker: ProjectOverviewCard]
Khối tổng quan trên card, MỌI dòng thiếu dữ liệu tự ẨN (không bịa, luật X2):
- **Quy mô**: `loaiHinh · dienTichM2 m²` từ GET `/api/projects/[id]/profile` (ProjectProfile).
- **"Bắt đầu từ <ngày>"**: `project.createdAt` từ GET `/api/projects/[id]/overview`
  (FlowRow của `/api/flows` KHÔNG có createdAt — không đụng API theo ô③, nên đọc từ overview).
- **"Đang dở · <chặng>"**: `getLastStage` — CHỈ hiện khi đã từng ghi.
- **PresenceRow** (component 12/08 sẵn có): thành viên từ GET `/api/projects/[id]/members`,
  online đối chiếu roster `team` của `/api/flows` (cùng nguồn presence card cũ, ngưỡng 45s);
  chưa đọc được members / flow tự do → fallback owner như hôm nay.
- Cache module-level theo projectId — lướt carousel/grid không bắn lại 3 request; fetch lỗi →
  im lặng, card hiện như không có dữ liệu.

### 4 · `components/ProjectSelect.tsx` — nối vào card, GIỮ hành vi cũ
- Caption carousel (card focus) + thân card grid: hàng avatar cũ THAY bằng `ProjectOverviewCard`
  (PresenceRow online màu / offline trắng-đen); chữ đi qua `adaptiveTextStyle(plan)` ở caption
  (2 theme qua biến, không hex mới).
- **Click card → nhảy CHẶNG ĐANG DỞ** (`enterAtLastStage`): chưa có → mặc định `concept` (phiếu ④.1).
  `render` đi đường cũ `onEnter()` (HomeScreen setStageDone + toProjectRender); `concept/present`
  → `setWorkspace(stage)` + tự ghi cờ `interiorflow.stageDone` (cùng khoá+user.id y HomeScreen)
  + `router.push(stageRoutePath(id, segment))`.
- Hover thẻ grid: `hover:scale-[1.02] hover:-translate-y-0.5` duration-200 (phiếu ④.3, khớp
  SPEC-HOVER-FOCUS-IDF thẻ 1.02 + lift 2px 200ms).
- GIỮ NGUYÊN: Đổi bìa · Chi tiết · Tổng quan · sửa status · filter/tìm kiếm · toggle
  carousel↔grid · phím ←→/Enter · danh sách phẳng reduce-motion (flatList giữ avatarRow cũ,
  không đổi — reduce-motion vốn là nhánh tối giản).

## ③ Nghiệm thu (kết quả THẬT, dán nguyên)

```
$ node_modules/.bin/sucrase-node lib/shell/last-stage.test.ts
last-stage.test.ts OK (5 nhóm assert)
test exit: 0

$ node_modules/.bin/tsc --noEmit        # lần 1, sau toàn bộ edit chính
tsc exit: 0

$ node_modules/.bin/tsc --noEmit        # lần 2 (sau đổi import alias→tương đối)
components/cad/CadCanvas.tsx(1336,65): error TS2339: Property 'label' does not exist ...
components/cad/CadCanvas.tsx(1359,9): error TS2304: Cannot find name 'setTaskToast'.
tsc exit: 2
```
⚠️ 2 lỗi tsc lần 2 nằm TRỌN trong `components/cad/CadCanvas.tsx` — NGOÀI vùng H2, xuất hiện
giữa 2 lần chạy do agent song song đang sửa file đó (`git status` xác nhận `M CadCanvas.tsx`
không phải của phiên này). Vùng file H2 (ProjectSelect · ProjectOverviewCard · last-stage ·
stage-nav) = **0 lỗi tsc** (lần 1 exit 0 chạy SAU toàn bộ edit chính; thay đổi duy nhất sau đó
là 1 dòng import path, tsc lần 2 không báo gì về file H2).

## ④ Quyết định tự chọn (mơ hồ → chọn + lý do)
1. **Điểm ghi ở `stage-nav.ts` chứ không phải StageSwitcher.tsx** — pickStage là hàm chung
   header+mobile, 1 điểm phủ hết; sửa StageSwitcher sẽ phải sửa 2 nơi.
2. **Tooltip avatar mất suffix Lark "· chủ dự án · chức danh"** ở 2 card chính (PresenceRow
   dùng `title=name` chuẩn, không sửa PresenceRow vì ngoài vùng). Đổi lại: avatar giờ là
   THÀNH VIÊN DỰ ÁN thật (ProjectMember) thay vì chỉ owner. flatList vẫn giữ tooltip cũ.
3. **"Bắt đầu từ"** đọc `Project.createdAt` (overview API) — flow tự do không có → ẩn dòng.
4. **Mặc định `concept`** khi chưa có lastStage đúng nguyên văn phiếu — LƯU Ý đây là ĐỔI hành
   vi: trước đây mọi click card về `/projects/[id]/render`; nay dự án chưa từng ghi lastStage
   sẽ mở `/projects/[id]/cad`. Nếu Hoà muốn giữ render làm mặc định: đổi 1 chữ ở
   `enterAtLastStage` (ProjectSelect).

## ⑤ Nợ để lại
- lastStage chưa ghi khi vào chặng bằng URL trực tiếp/F5 (không qua pickStage) — cần 1 hook đọc
  route ở StageShell/ResumeTracker, ngoài phạm vi "1 điểm ghi" của phiếu.
- Grid nhiều dự án = 3 request/card lần đầu (có cache) — nếu thấy nặng, gộp 1 endpoint tổng quan.
- Nghiệm thu MẮT trên browser chưa làm (phiếu cấm dev server) — phiên V cần soi: caption 2 theme,
  PresenceRow trên ảnh bìa sáng, dòng quy mô khi profile null (phải ẩn sạch).

## ⑦ HAI GIÁ TRỊ

**GIÁ TRỊ KIẾN TRÚC** — [TÍNH NĂNG] Chặng-đang-dở thành DỮ LIỆU có nguồn ghi/đọc một chỗ
(`lib/shell/last-stage`, ghi tại choke point pickStage, khoá theo id ổn định của dự án) — dây
đầu tiên nối Home vào TaskContext/lastStage của chốt 12/08 ④, phiên sau (Gallery liên ngành,
card ProjectProfile đầy đủ) chỉ việc đọc cùng khoá. [GIAO DIỆN] Card Home có khối tổng quan
tách thành component riêng tái dùng được, chữ đi qua adaptive-contrast + token 2 theme, dòng
thiếu dữ liệu tự ẩn — đúng khuôn "không bịa" áp được cho mọi card về sau.

**GIÁ TRỊ VẬN HÀNH & SỬ DỤNG** — Mở app, nhìn card 2 giây biết: dự án loại gì bao nhiêu m²,
bắt đầu từ bao giờ, đang dở ở chặng nào, ai trong dự án và ai đang online (màu) / vắng
(trắng-đen). Bấm card là rơi ĐÚNG chặng đang làm dở hôm qua thay vì luôn rơi vào 3D rồi tự
bấm lại — đỡ 1-2 cú click mỗi lần mở dự án, và "Untitled flow vô hồn" thành thẻ tổng quan thật.
