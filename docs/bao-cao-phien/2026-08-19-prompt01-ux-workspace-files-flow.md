# BÁO CÁO PROMPT-01 — UX / WORKSPACE / FILE MANAGER / FLOW ARCHITECTURE (audit, không code)

> Phiên 19/08/2026 · HEAD `3da4b8c` (working tree có Wave 0 chưa commit) · scope = **audit/spec theo phiếu PROMPT-01**, không sửa code.
> Nguồn TARGET: `IF-ARCHITECTURE-BLUEPRINT.md` v1.0 (B1–B25) · `INTERIORFLOW-ARCHITECTURE-MAP.md` (24 direction) · `IF-KIEN-TRUC-OS.md` (hiến pháp) · 00-CHOT/LATEST.
> Nguồn CURRENT: 5 agent Explore đo tại nguồn (file:line) + T spot-check độc lập 3 điểm nặng nhất. `soi:frontier` đầu phiên: 0 lệch.

---

## 1 · TỔNG QUAN

Đo 9 vùng UX/IA đối chiếu vision đã chốt. Kết luận gọn: **kiến trúc đúng như Blueprint tự khai — vùng dày rất dày (2D, Present-editor, node canvas, review-luật), vùng mỏng đúng là mỏng (Project Context, Workspace semantic, Files→Library pipeline, Decision/Revision)** — KHÔNG có conflict kiến trúc mới. Nhưng audit lộ ra một lớp bệnh Blueprint chưa ghi đủ: **ít nhất 4 "dây đứt ở đoạn cuối"** — engine có thật, UI có thật, mà đường tới người dùng không thông (Vitals panel mount trong component chết · Cửa Sổ Thảo Luận 0 mount · ReviewPanel chặng Present đọc nguồn rỗng · hai đường upload không gặp nhau). Đây đúng loại lỗi máy soi không bắt được (bài học 16/08), và vá chúng toàn là CONNECT, không NEW.

---

## 2 · CHI TIẾT — CURRENT → TARGET → GAP (9 vùng, kèm file:line)

### 2.1 Project shell / context

| | |
|---|---|
| CURRENT | **Không có route gốc dự án**: `app/projects/[id]/` chỉ có 6 page chặng (`cad/render/present/photo/overview/notebook`), không `page.tsx` gốc, không `layout.tsx`. Mở dự án = `useProjectScopeSync` → `ensureProjectScope` (`lib/project-scope.ts:80-113`) → `openFlow` chỉ nạp **graph + tên + projectId** (`lib/workspace.ts:27-43`). Mảnh context sống rời: `ProjectProfile` chỉ fetch ở `ProjectOverviewCard.tsx:53`; DNA panel chỉ render trong `overview/page.tsx`; members ở 3 chỗ. `lastStage` chạy thật (`lib/shell/last-stage.ts:21-42`, ghi duy nhất `stage-nav.ts:42-46`). Prisma `Project` có `clientName` là **1 chuỗi** (`schema.prisma:69-118`); `ProjectProfile` (`:150-170`) 0 trường vị trí; **không model Client/Location/Milestone** (chỉ `mocBanGiao`). |
| TARGET | B5 Project Open Sequence semantic-first (WHO→WHAT→revision→context→rồi mới panel) · Manifest Q1 (Wave 1) · Project Context composed read model [DESIGN DIRECTION]. |
| GAP | Manifest file (đúng plan Wave 1) · context composer 0 code · route gốc/hub dự án 0 code · Client/Location 0 model (khớp B8). Overview page hiện là hub gần nhất nhưng **không nằm trong AppShell** (tự viết header, `overview/page.tsx:100-137`) — lệch khuôn shell. |

### 2.2 Workspace

| | |
|---|---|
| CURRENT | **0 primitive**. Chữ "workspace" mang 3 nghĩa không liên quan: ① `WorkspaceMode = Phase` (`lib/store.ts:33,106` — thực chất là CHẶNG, persist `interiorflow.workspace`) ② `lib/workspace.ts` = lớp gọi API flow ③ `CadWorkspace = 'model'\|'paper'` (`lib/cad/store.ts:50`). `Task.workspaceId` CÓ trong schema (`schema.prisma:589`, TaskContext Link) nhưng `buildTaskDeepLink` **bỏ qua nó** (`lib/tasks/context.ts:41-47`) và `lib/home/aggregate.ts:24` luôn set null. |
| TARGET | C3 [CHỐT 19/08]: Workspace = working context, compose capability, host Master Tool/Canvas; CẤP 0.5 = instances chuẩn; restore contract; tách DOMAIN/WORKSPACE/UI state (B5). |
| GAP | Toàn bộ tầng semantic. Thêm: **3 nghĩa trùng tên là nợ từ-điển** (đúng họ bệnh `soi:tu-dien`); phân tầng state chưa có lớp ép — ~60 localStorage key gọi `setItem` trực tiếp rải rác, không wrapper chung (đo agent A mục 7). |

### 2.3 Canvas / Board

| | |
|---|---|
| CURRENT | `@xyflow/react` v12.11.1, **2 nodeTypes** `{interior, note}` (`FlowCanvas.tsx:37`), 0 edgeTypes. Schema Flow 1-N theo project (`schema.prisma:103,219`) nhưng **thực dụng 1-1**: `resolveFlowForRouteId` lấy flow ĐẦU TIÊN (`lib/scope-core.ts:105`); không Board model, không UI chuyển canvas trong dự án; `FlowsPanel` liệt kê theo user, "Flow mới" không truyền projectId (`FlowsPanel.tsx:85` → draft project). Persist: debounce 2s → `Flow.graphJson` (`lib/store.ts:1188-1251`); chưa đăng nhập → localStorage `interiorflow.flow.v1` **toàn cục không theo project**. Cửa sổ công cụ: đường node-trên-canvas THẬT (`InteriorNode.tsx:139`), 3 nấc + đa cụm (`lib/nodes/cua-so-cong-cu-ui.ts:44-79`); đường nổi vẫn singleton (`tool-mode-ui.ts:54`). |
| TARGET | C4 [CHỐT]: Project → nhiều Workspace → nhiều Canvas/Board + MỘT Project Flow/Timeline xuyên suốt (graph nối [DESIGN DIRECTION]). |
| GAP | Board/multi-canvas 0 code (khớp Blueprint) · A-5 graphJson mồ côi authority giữ nguyên · Project Flow graph 0 primitive. Schema 1-N **đã sẵn** — GAP là resolver + UI, không phải data model ⇒ EXTEND, không NEW. |

### 2.4 File Manager / Library

| | |
|---|---|
| CURRENT | `/files` có thật, **hai NGĂN** đã build (`app/files/_components/HaiNgan.tsx:56-158`) — nhưng **"hai TẦNG + Collection+" (chốt 17/08) chỉ có trong mock**, `COL-` = 0 hit code. **Hai đường upload KHÔNG nối nhau**: `/files` ghi thẳng đĩa người dùng qua FS Access (`FileManagerShell.tsx:396`, không chạm DB/uploads) ↔ `/library/ingest` chỉ ghi manifest IndexedDB, **chưa bao giờ gọi** `POST /api/library`. Đường tạo `LibraryAsset` duy nhất chỉ nhận **ảnh raster** (`app/api/library/route.ts:79-91`). Format Router (`lib/gateway/`) 23 format + magic byte + bảng capability thật nhưng tự khai "CHƯA nối UI" — **1 caller** (`warehouse/xlsx-parse.ts:19`). **Promote/normalize: 0 hit toàn repo.** `LibraryAsset` **không cột provenance/contentHash/origin** — nguồn+license encode vào `tags` tiền tố chuỗi (`gallery-tags.ts:39-45`). LibrarySheet: tấm 960px ✅, 3 nấc thẻ ✅, nhưng spotlight "Chọn cho dự án này" = `items[0]` (`LibrarySheet.tsx:414` — T xác minh), "Top tuần này" = thứ tự nguyên bản (`recent` không nơi nào set). |
| TARGET | Q5 Files→Understand→Normalize→Promote→Master Library · Files hai tầng + Collection+ · Thư viện "mang đồ tới, hiểu ngữ cảnh" · Q4 provenance. |
| GAP | Pipeline gần như toàn phần: trạng thái RAW 0 code · promote 0 code · 2 đường upload phải hợp nhất · Format Router chờ cắm (dây có, chưa cắm điện — đúng khuôn `getMaterial` trước 17/08) · spotlight cần logic ngữ cảnh thật (hiện là **nhãn hứa quá code** — dạng lỗi khai-thật). |

### 2.5 2D Kỹ thuật — vùng DÀY, đúng vision nhất

CURRENT: mode Sơ phác↔Chuyên 1 chỗ gạt (`CadToolbar.tsx:435,639-704`; nút revit đã bỏ UI, khoá persist giữ); toolbar **lai** — 10 lệnh chung đọc registry qua `commonCommandsFor` (`CadToolbar.tsx:255-269`), phần vẽ/biến đổi tự khai; Doc 13 entity + markup/photo/site rời (`lib/cad/model.ts`); disk-sync `.idf` là nguồn (`lib/disk-sync.ts:44-60`) + autosave IDB chuẩn khoá `userId::route::projectId`; **hatch/tô mặt bằng ✅** (`MaterialPalette.tsx`), **markup ✅**, photo-markup ở editor riêng `/projects/[id]/photo`; **camera IF_CAMPATH ĐÃ WIRE** (`CadEditor.tsx:866` CamPathPanel, tiêu thụ `CameraExportTab.tsx:14`) — tag [CHƯA CẮM] của MAP direction #8 **đã lỗi thời một phần**; 9 bộ luật builtin + ReviewPanel mount 3 chặng (`AppShell.tsx:191-193`); export PDF/DXF + `CHUAN_DAU_RA` gate thật (`lib/print/export-checks.ts:124`). **Line extraction (ảnh→nét): 0 code.**
TARGET/GAP: giữ nguyên (direction #2/#16 đã [ĐANG CÓ]); GAP nhỏ: hoàn thiện registry B2-B5 · line extraction nếu vision cần (chưa có chốt ưu tiên).

### 2.6 3D Thiết kế (Design Development)

| | |
|---|---|
| CURRENT | Node↔3D gạt qua `ModeSwitchCell` (`lib/stage-mode.ts:21-44`) — **đổi cả shell** (`HomeScreen.tsx:665-685`), registry không phân biệt 2 mode (cả hai map `stage:'render'`, `AppCommandPalette.tsx:154`). Một-bộ-lệnh: tầng ① 5 lệnh chung đã đọc registry (`ToolDock3D.tsx:96-102`), `runFor` chưa có (B5 ticket lệnh). Brainstorm hiện = 1 mindmap template `concept-5-nhanh` (`mindmap-templates.ts:28`; 5 form còn lại tự khai chưa làm) + sticky/moodboard/gu-ref nodes. **`CuaSoThaoLuan` (ship 17/08) 0 mount** — grep toàn repo chỉ self-reference (T xác minh độc lập, exit 1); nút Chưng cất luôn mờ vì `!onChungCat` (`CuaSoThaoLuan.tsx:139-146`). BuildRecipe 10 op, evaluator thật, nhưng UI chỉ 5 nút thêm bước (`Command3DPanel.tsx:1293-1302`); sweep/revolve/loft/taper/boolean chỉ vào qua `ops[]` cũ. Scene derived thuần, không persist (`use-scene3d.ts:16-22`) — đúng chốt Q6. |
| TARGET | Direction #4: Design Development Workspace = context · brainstorm · references · decisions · material exploration · 3D Master Tool · Visual Pipeline chung. |
| GAP | Mount CuaSoThaoLuan (CONNECT thuần — mount site + `mergeDistilledIntoCard`) · decision capture (Q8 Wave 3) · 5 form lập luận · Visual Pipeline facade (Wave 2 — render hiện chỉ chặng 3D + 1 đường hẹp Present `print-upscale.ts:203`; 2D = 0). |

### 2.7 Trình chiếu

CURRENT: H4 màn chọn **6 loại** có thật (`PresentDocTypePicker.tsx`), deck/material-a3/boq/schedule = editor thật; text/video/approval-form **khoá kèm lý do** (đúng luật không-giả); `.idfp` disk-sync đối xứng CAD (`PresentSheets.tsx:136-419`); BOQ specId required W0.2 + XLSX xuất/nhập thật; xuất PDF/PPTX/PNG/300dpi + Gói Hồ Sơ Sống (`lib/ho-so-song/pack.ts:159`). Brand Kit **per-máy toàn cục** (`brand-kit.ts:8-11`), per-project chỉ ở tệp đĩa mang đi; deck **copy** watermark lúc tạo, không tham chiếu (`PresentSheets.tsx:126-127`).
TARGET: #15 Present = Communication + Review + Issue layer · Brand Kit thuộc DỰ ÁN (chốt 01/08).
GAP: Review/Issue layer 0 code (Wave 3) · **ReviewPanel chặng present đọc nguồn RỖNG** (`ReviewPanel.tsx:96-99` tự khai — engine `evaluateDeck` có thật nhưng PresentEditor gọi trực tiếp, không qua panel) · Brand Kit chưa per-project đúng chốt · ⚠️ nhãn UI PPTX "luôn 16:9" (`Toolbar.tsx:613`) **lệch code** đã đọc `stagePreset` (`export.ts:15-19`).

### 2.8 Vital / AI

CURRENT (bảng touchpoint đầy đủ ở §6): 2 tầng chữ NVIDIA→Ollama (`text-tier.ts`); `/api/ai-assist-chat` prompt-stuffing, không RAG; Notebook RAG **có thật chạy được** (brute-force cosine, `rag.ts:64-69`) nhưng **embedding gửi thẳng cloud NVIDIA không qua cửa nào** (`embed.ts:19,55-60`; route query 0 policy/credit — khớp GAP C-3 Blueprint, nay có bằng chứng dòng); 3 cụm gateway song song (ảnh `providers/index.ts` · chữ `text-tier.ts` · file `lib/gateway/`≠AI) + ~11 file gọi thẳng provider (cận trên). DistillEngine: caller `DesignDnaCardPanel.tsx:297` **sống**, caller `CuaSoThaoLuan.tsx:182` **chết theo component** ⇒ thực tế **1 live caller** (MAP #6 ghi 2 — cần chú thích). Credit: gate server nguyên tử + refund có jobRef; "nói giá trước" = badge tĩnh, không dialog.
**🔴 Phát hiện chéo nặng nhất: chuỗi Vitals trong chặng ĐỨT.** `VitalsGesturePanel` mount **duy nhất** tại `StageSwitcher.tsx:446` — mà `StageSwitcher` là **code chết** (0 import, đã gỡ khỏi header `AppChrome.tsx:334-338`; T xác minh grep chỉ còn comment). `StatusBar.tsx:101,128` gọi `openVitals()` vào store nhưng không nơi nào render panel ⇒ chip Vitals ở StatusBar **bấm không ra gì** (vi phạm luật "cấm nút giả"); đường Vitals sống duy nhất là `VitalsPill` ở Home (`AppChrome.tsx:345-347`). Kéo theo: consumer RAG `VitalsGesture.tsx:335` (nấc research) cũng không tới được từ UI chặng.
TARGET: Vitals neo theo ngữ cảnh 3 nấc (chốt 16/08) · AI Gateway facade Wave 2 · Privacy mode (OS §4) · Why-this + control points 4 mức.
GAP: đúng Wave 2/4 plan + **vá dây đứt Vitals** (CONNECT, không chờ Wave).

### 2.9 Review / approval / revision

CURRENT: `lib/review/` 2 lớp đúng thiết kế (FindingGopy bị type cấm mức đỏ/điểm — `types.ts:14-17`); gopy **chưa bật có chủ đích** (chặn bởi thiếu màn đề bài — `gopy.ts:34-40`); Checkpoint component THẬT 4 mount (`ClusterPanel.tsx:316`, `PlanPresentPanel.tsx:271`, `CadEditor.tsx:1009`, `SectionPreviewOverlay.tsx:159`) nhưng state useState không persist; `FfeApproval` = TS type, **không có trong Prisma**, 0 production caller truyền approvals (`lib/ffe/sheet.ts:52-181`) — Blueprint #17 ghi "mới có FfeApproval" là **hơi vống**; `FlowVersion` snapshot chỉ khi bấm tay (`workspace.ts:88-96`); `rev` 4 model, **8 route tự tăng tay, 0 enforcement/0 test** (blocker ⑤ xác nhận); `ProjectRevision`/`Decision`/`ProposalSheet` = 0 code (xác nhận grep); undo = 3 store rời, mọi ghi qua API không undo.
TARGET/GAP: đúng Q6/Q8 Wave 3 — không phát hiện lệch plan; điểm mới duy nhất: **Checkpoint core là primitive gần nhất cho ProposalSheet** khi Wave 3 mở (EXTEND, đừng NEW).

---

## 3 · BỨC TRANH TỔNG

1. **Vision và code không cãi nhau — chúng chỉ chưa BẮT TAY.** 9 vùng đo ra 0 conflict kiến trúc mới; mọi GAP lớn đều đã có tên trong Blueprint/Wave plan. Cái Blueprint chưa ghi đủ là **lớp "dây đứt đoạn cuối"**: Vitals panel (component chết) · CuaSoThaoLuan (0 mount) · ReviewPanel-present (nguồn rỗng) · Format Router (1 caller) · hai đường upload song song · spotlight giả ngữ cảnh · Task.workspaceId bị deep-link bỏ qua. **Bảy chỗ, cùng một họ bệnh: engine xong-máy, người dùng chưa chạm được.** Khớp đúng nút thắt STATUS "76 xong-máy đối 1 xong-mắt".
2. **UX Information Architecture hiện tại "flow-centric", vision là "project-centric".** Không có route gốc dự án, không Project Context, chuyển dự án = ghi đè store toàn cục (đã có rò chéo tự khai `project-doc.ts:19-28`). Toàn bộ chuỗi mở-dự-án hiện trả lời "graph nào" thay vì "dự án nào, đang ở đâu, ai quyết gì".
3. **Đối chiếu chuẩn công việc ngành** (mục 4 phiếu): master/detail + density + hierarchy trong từng chặng ĐẠT khá (dock kính, PanelFlank, 3 nấc, ReviewPanel neo entity); **context persistence và multi-project là hai điểm YẾU nhất** so với thói quen ngành (KTS mở 2-3 dự án song song — hiện store toàn cục không snapshot/restore); review flow mới có máy-kiểm-luật, chưa có duyệt-người (đúng Wave 3); handoff giữa chặng đã có (cad↔render handoff, photo handoff qua sessionStorage) nhưng chưa có handoff CONTRACT khai báo (B-4 FINAL-AUDIT giữ nguyên).

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt**: 2D + Present-editor + node canvas là code trưởng thành, tự khai giới hạn trung thực (nút khoá kèm lý do — đúng luật); disk-sync/persist có khuôn chung được tái dùng kỷ luật (5 store cùng DB `interiorflow-sheets`); review 2 lớp cưỡng chế bằng type; credit gate server nguyên tử; cửa sổ công cụ đường-node đã đúng chốt "công dân canvas".
**Chưa tốt**: 4 dây đứt user-facing (trong đó Vitals là **nút giả** đang sống trên StatusBar); nhãn hứa quá code ở 3 chỗ (spotlight "Chọn cho dự án này" · "Top tuần này" · PPTX "16:9"); phân tầng UI-state chưa có lớp ép (~60 key rải); RAG rò cloud không qua Privacy (OS §4 vi phạm khi ở tinh thần Fully Local — code chưa có Privacy mode nên chưa "vi phạm luật máy" nhưng là rủi ro dữ liệu dự án thật).
**Rủi ro**: ① sổ đang vống hơn code ở 3 điểm (CuaSoThaoLuan "ship", FfeApproval, DistillEngine "2 caller") — để lâu sẽ thành `master tool` thứ hai; ② mọi kết luận là phân tích TĨNH (chưa browser verify — server 3001 vẫn bệnh theo LATEST); ③ 2 phiên Claude khác đang mở cùng repo, working tree chưa commit — số đo có hạn dùng ngắn.

**DRIFT ghi nhận (không tự hoà giải, chờ T/Hoà xử):**
| # | Sổ/Blueprint nói | Code đo được |
|---|---|---|
| D1 | LATEST 17/08: "Cửa Sổ Thảo Luận chặng 3D **đã ship**" · MAP #4 [ĐANG CÓ một phần] | Component + form + distill có thật, **0 mount** — chưa tới người dùng |
| D2 | MAP #6 / Gate C-4: DistillEngine "2 production caller" | 1 caller sống (`DesignDnaCardPanel.tsx:297`); caller kia chết theo D1 |
| D3 | Blueprint #17: "mới có FfeApproval" | FfeApproval = TS type không persist, 0 caller production |
| D4 | MAP #8 camera [CHƯA CẮM] | CamPathPanel ĐÃ mount trong CadEditor (`CadEditor.tsx:866`) — tag lỗi thời một phần |
| D5 | Chốt 05/08: "panel Vitals mount DUY NHẤT ở StageSwitcher" | StageSwitcher nay là code chết ⇒ chốt cũ thành dây đứt |
| D6 | Nhãn UI PPTX "luôn 16:9" (`Toolbar.tsx:613`) | Code đọc `stagePreset` (`export.ts:15-19`) |

---

## 5 · HAI HƯỚNG XỬ LÝ

**Hướng A — "CẮM ĐIỆN TRƯỚC, XÂY TẦNG SAU"** (lô CONNECT nhỏ chèn trước Wave 1, rồi Wave 1 nguyên bản):
Vá 7 dây đứt (mount CuaSoThaoLuan + merge DNA · sửa/loại nút Vitals StatusBar và quyết chỗ mount panel theo chốt 16/08 · nối ReviewPanel↔nguồn deck · hợp nhất 2 đường upload qua Format Router · deep-link đọc workspaceId · sửa 3 nhãn hứa quá · đóng dấu StageSwitcher chết). Ưu: 100% CONNECT/REUSE đúng B25, rẻ, trả giá trị nhìn-thấy ngay, giảm nợ xong-mắt. Nhược: không đụng GAP kiến trúc lớn (Project Context, Workspace) — bệnh flow-centric còn nguyên.

**Hướng B — "DỰNG TẦNG PROJECT/WORKSPACE TRƯỚC"** (đi thẳng Wave 1 semantic: route gốc `/projects/[id]` + Manifest Q1 + Project Context composer + workspace primitive, dây đứt vá dần trong lúc đi):
Ưu: giải đúng gốc bệnh IA (project-centric), mọi UX sau đứng trên nền đúng. Nhược: vùng MỎNG — dễ đẻ island nếu làm trước khi Hoà chốt `U-Q1-01` (hình thù Manifest); các dây đứt là lỗi user-facing đang sống, để sau nghĩa là app tiếp tục có nút giả; khối lượng lớn hơn nhiều, khó nghiệm thu mắt từng bước.

## 6 · ĐỀ XUẤT

**Chọn A trước, B ngay sau trong Wave 1** — vì: ① 7 dây đứt đều CONNECT thuần, không cần quyết định kiến trúc nào đang treo; ② trong đó có 1 **nút giả** (Vitals StatusBar) vi phạm luật cứng "cấm nút bấm không ra gì" — loại lỗi phải sửa trước mọi việc mới; ③ B bị chặn thật bởi `U-Q1-01` chờ Hoà — chạy A trong lúc chờ là dùng thời gian chết đúng chỗ; ④ A giảm ngay khoảng cách sổ↔code (D1-D6), tránh đẻ thêm "khái niệm ma". Điều kiện kèm: A **không mở rộng phạm vi** — mỗi dây đứt một phiếu nhỏ có ô ⓪, cấm nhân tiện refactor vùng dày.

---

## PHỤ LỤC

### P1 · UX / FLOW MAP hiện trạng (rút gọn)

```
LOGIN → HOME (AppShell: rail 2 cụm + ô tìm + VitalsPill✅)
  ├─ ProjectSelect card ──lastStage──► /projects/[id]/{cad|render|present}
  │      (openFlow: chỉ graph+tên — KHÔNG context)
  ├─ /files (2 NGĂN; upload → đĩa người dùng, KHÔNG vào Library)  ✂ đứt
  ├─ /library/ingest (→ IDB manifest, KHÔNG POST /api/library)     ✂ đứt
  ├─ /tasks (deep-link bỏ workspaceId)                              ✂ nửa đứt
  └─ /projects/[id]/overview + /notebook: NGOÀI AppShell            ⚠ lệch khuôn
Chặng: 2D (dày, ReviewPanel✅, campath✅) · 3D (Node↔3D đổi cả shell;
  CuaSoThaoLuan ✂ 0 mount) · Present (H4 6 loại; ReviewPanel nguồn rỗng ✂)
Vitals trong chặng: StatusBar chip → openVitals() → panel KHÔNG mount   ✂ ĐỨT
```

### P2 · DATA OWNERSHIP — bổ sung so với Blueprint B8 (chỉ điểm mới đo được)

| Điểm | Đo được | Rủi ro |
|---|---|---|
| `interiorflow.flow.v1` (autosave graph khi chưa đăng nhập) | toàn cục, KHÔNG theo project (`lib/store.ts:1215`) | rò chéo dự án ở chế độ offline |
| Present rò doc chéo dự án | tự khai tại `lib/present-editor/project-doc.ts:19-28` | đã biết, chưa vá |
| `pe-panelW`/`pe-inspectorW`/`pe-inspectorOpen` | key trần không prefix (`PresentEditor.tsx:136-138`) | lệch quy ước `if.*`/`interiorflow.*` |
| Inspector AppShell thu/mở | useState, không persist (`AppShell.tsx:118-149`) | mất trạng thái mỗi reload |
| Brand Kit | per-máy (IDB) chứ chưa per-project (`brand-kit.ts:8-11`) | lệch chốt 01/08 |
| Nguồn/license asset | encode trong `tags` tiền tố (`gallery-tags.ts:39-45`) | Q4 sẽ phải migrate |

### P3 · DESIGN SYSTEM REUSE/IMPROVE (giữ DS, chỉ improve có evidence)

| Primitive | Trạng thái | Ghi chú |
|---|---|---|
| 148 token `globals.css` (thang r-1..r-full, mật độ `--tap/--row/...`, `--mo-vo-hieu`) | REUSE | nền đủ cho mọi việc A |
| `PanelFlank` (`if.panelflank.*`) | REUSE + EXTEND | mới 2 key dùng — tay cầm thu/mở chung (chốt 07/08 mục 10) nên lắp qua nó, KHÔNG viết mới |
| `Tooltip` (label/desc/shortcut/hinh) · `ToolbarChip` (aria-disabled) | REUSE | ô giải nghĩa đã có khung |
| `LightArc`/`LightBar` · `EmptyState` · `PresenceRow` · `Popover` | REUSE | |
| `Checkpoint` + `checkpoint-core` | EXTEND (Wave 3) | primitive gần nhất của ProposalSheet — negative-evidence chống NEW |
| Improve có evidence | ① thống nhất prefix key localStorage (pe-* trần) ② persist inspector AppShell ③ CommentLayer hiện chỉ mount Home (`HomeScreen.tsx:700`) — muốn comment trong chặng thì CONNECT nó, không viết layer mới |

### P4 · VITAL/AI TOUCHPOINT MAP

| Touchpoint | File | Sống? |
|---|---|---|
| VitalsPill (Home, cạnh ô tìm) | `AppChrome.tsx:345-347` → `/api/ai-assist-chat` | ✅ |
| StatusBar chip Vitals (trong chặng) | `StatusBar.tsx:101,128` | 🔴 nút giả — panel không mount |
| VitalsGesturePanel (+ nấc research→RAG) | `StageSwitcher.tsx:446` (code chết) | 🔴 không tới được |
| Notebook RAG API | `app/api/notebook/[id]/query` | ✅ API · ⚠ 0 policy, embedding cloud |
| AiBriefPanel (2D gợi ý bố cục) + pairwise | `AiBriefPanel.tsx:130-208` | ✅ |
| LayoutShelf gợi ý (Present) + pairwise | `LayoutShelf.tsx:166-185` | ✅ |
| GenerateFlow Magic deck | `PresentEditor.tsx:1080` | ✅ |
| Node AI (49 def, credit badge) | `lib/nodes/registry.ts` | ✅ |
| SmartSelect SAM2 (fallback hình học) | `SmartSelectModal.tsx:288-318` | ✅ |
| DistillEngine → DNA card | `DesignDnaCardPanel.tsx:297` ✅ · `CuaSoThaoLuan.tsx:182` 🔴 | 1/2 sống |
| Review lớp góp ý | `lib/review/gopy` | ⏸ chặn có chủ đích (chờ màn đề bài) |

### P5 · CHƯA CHẮC (gộp 5 agent + T)

- **Toàn bộ là phân tích TĨNH** — 0 phút browser thật (server 3001 bệnh theo LATEST; phiếu không cho mở server mới). Các claim "mount/không mount", "bấm không ra gì" cần 1 lượt verify browser trước khi flip trạng thái.
- Chưa xác minh `dev.db` thật có cột `ProductSpec.matId` chưa (repo có tiền lệ db-push không sinh migration file).
- `ProjectSelect.tsx` (2806 dòng), `HomeScreen`/`DongStudioHome`, `checkpoint-core.ts`, `rules-3d.ts` thân hàm: chưa đọc trọn.
- Đếm "11 file gọi thẳng provider" là cận trên (chưa loại gián tiếp); "9 vs 11 bộ luật" chênh giữa `BUILTIN_GROUPS` và docstring cũ.
- `hough-line.ts` không tồn tại, chỉ có `.test.ts` — chưa đọc test import gì (có thể test chết; 00-CHOT 15/08 nói đã sửa Hough trong `single-view-metrology.ts` — hai nguồn cần đối chiếu).
- Notebook page mock-mode runtime chưa đo; CuaSoThaoLuan có thể được mount ở worktree/phiên khác chưa merge.

### P6 · HẠN DÙNG KẾT LUẬN

Đo tại HEAD `3da4b8c` + working tree 19/08 (Wave 0 chưa commit), 2-3 phiên Claude khác đang mở cùng repo. Kết luận hết hạn khi: ① Hoà chạy runbook DB / commit Wave 0 ② bất kỳ phiếu Wave 1 nào chạm shell/Files/Library ③ `app/workhub/` được quyết hướng. Các con số grep (0 mount, 1 caller…) phải **đo lại tại nguồn** trước khi dùng làm tiền đề phiếu mới — không trích từ báo cáo này như sự thật vĩnh viễn.
