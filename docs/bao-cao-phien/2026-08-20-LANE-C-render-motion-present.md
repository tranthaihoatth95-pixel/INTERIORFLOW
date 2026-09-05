# LANE C — Render (P0) · Motion (P1) · Cầu sang Trình chiếu · 20/08

> Worker LANE C của wave Frontier. Mốc `c7f3ac8`. Dev server dùng chung `:3001` (KHÔNG restart).
> Không git, không prisma, không đụng `app/globals.css` / token `--accent*`.

---

## ⓪ TIỀN ĐỀ — đã kiểm, không bác bỏ điều nào

| Giả định của phiếu | Kiểm | Kết |
|---|---|---|
| HEAD = `c7f3ac8` | `git log --oneline -1` | ✅ đúng, tree dirty nhiều file (bình thường, nhiều lane) |
| `lib/capabilities/compound.ts` có sẵn, khai `render`/`motion`/`sequence` | đọc trọn file | ✅ đúng — 6 năng lực, 3 cái của tôi có mặt |
| Hàng đợi render THẬT đã nghiệm thu | đọc `render-queue-store.ts` 421 dòng | ✅ đúng — tuần tự, AbortController, tiến trình relay số thật từ `runNode()` |
| Node `ai.clay2render` / `ai.image2video` / `ai.upscale` có thật | `lib/nodes/registry.ts:374 / :561 / :743` | ✅ đúng, có credit khai sẵn 4 / 8 / 2 |
| LANE A sở hữu `visual-generate.ts` + `toolbar-source.ts` + tầng job | — | ✅ **KHÔNG chạm dòng nào** trong 2 file đó |

Một giả định **phải sửa lại** (không phải bác, nhưng đủ đổi cách làm): tôi tưởng có thể dùng thẳng
`lib/three/capture.ts::captureFrame` để "kết xuất khung nhìn hiện tại". **Sai** — nó đặt camera qua
`placeCamera(bbox, CameraSpec)`, tức khung SUY TỪ bounding box + preset, không phải góc người dùng
đang orbit. Chi tiết + hai đường đã loại ở đầu `components/three/capture-live.ts`.

---

## ① VIỆC ĐÃ LÀM

### Reused (không viết lại một dòng nào)
- `components/render-studio/render-queue-store.ts` — **mọi** lượt chạy AI của lane này đi qua đúng
  hàng đợi đó, kiểu job `node` sẵn có. **Không thêm `RenderQueueSource` kiểu mới, không job model
  thứ hai, không vòng chạy riêng, không timer.**
- `lib/execution.ts::runNode` — credit, cache-skip, huỷ, `friendlyAiError`. Không gọi provider trực tiếp.
- `lib/nodes/registry.ts` — chỉ ĐỌC. Ba chế độ render = ba cách GHÉP node có sẵn.
- `lib/present-editor/handoff.ts` — cầu Render→Present **đã có từ trước** (`stashPresentHandoffWithIds`,
  consume-once, id ổn định `renderImageId`). Cầu của tôi = gọi vào đó.
- `lib/ui/tien-trinh.ts` + `components/ui/LightBar` — tiến trình.
- `lib/three/obj-scene-to-geometry::buildMergedGeometries` + `lib/three/capture::nearFarForScene`.

### Extended
- `components/three/Viewport3D.tsx` — thêm prop optional `cameraApiRef` để **mượn** ref camera sống
  ra ngoài. Bỏ trống = hành vi cũ y nguyên (ref nội bộ, ViewCube chạy như trước).
- `components/render-studio/Render3DModeSkeleton.tsx` — mount `KetXuatPanel` trong `PanelFlank`
  side="right" (đúng mẫu tay cầm chung, chốt 07/08 mục 10), `defaultOpen={false}`.

### New (4 file, đều khai negative evidence ở đầu file)
| File | Là gì |
|---|---|
| `lib/capabilities/render-core.ts` | THUẦN: bảng 3 chế độ · khung máy quay · băm bản-sửa-cảnh · bản ghi kết quả · cờ CŨ · lý-do-nút-mờ |
| `lib/capabilities/render.ts` | kho kết quả (zustand + localStorage) + dựng chuỗi node thật rồi xếp hàng |
| `lib/capabilities/motion-core.ts` | THUẦN: 6 ý định chuyển động · thời lượng · chất lượng · ghép prompt |
| `lib/capabilities/motion.ts` | ảnh đã Nhận → node `ai.image2video` → hàng đợi |
| `components/three/capture-live.ts` | chụp offscreen TẠI pose camera sống (30 dòng, dùng lại 2 linh kiện đã export) |
| `components/render-studio/KetXuatPanel.tsx` | mặt tiền: chế độ · tỉ lệ · phong cách · dải kết quả · Nhận/Bỏ · Chuyển động · Sang Trình chiếu |
| `lib/capabilities/render-core.test.ts` | 30 test |

Vì sao tách `*-core.ts`: `render.ts`/`motion.ts` phải chạm zustand + `lib/store` (@xyflow) nên
**không chạy được dưới `sucrase-node`** — mà đó lại là phần cần test. Cùng khuôn `handoff.ts`.
Nơi gọi vẫn chỉ import một cửa (`export *`).

---

## ② BA CHẾ ĐỘ — khai đúng cái backend làm được

| Chế độ | Chạy thật cái gì | Credit | Có gọi AI |
|---|---|---|---|
| Xem trước thiết kế | chụp offscreen tại pose camera sống, khối xám | **0** | không |
| Xem trước chất lượng cao | `ai.clay2render` (khoá hình học bằng depth) | 4 | có |
| Bản cuối | `ai.clay2render` → `ai.upscale ×2` | 6 | có |

⛔ **Không chỗ nào gọi là "ray tracing"/"dò tia"** — và có **test canh** điều đó
(`render-core.test.ts`: mọi `ten`+`giaiThich` phải không khẳng định là dò tia; câu duy nhất được
phép chứa từ đó là câu **phủ định** "Không phải dò tia"). Kèm hai bất biến máy nữa: `credit === 0`
⇔ `lenhNoiBo` rỗng, và `canProvider` ⇔ có lệnh AI.

**Đầu ra mang:** bản-sửa-cảnh (băm nội dung `Scene3DData`) · camera (vị trí/nhìn-tới/FOV/tỉ lệ/px) ·
chế độ + tham số · nhà cung cấp thật (`fal`/`comfyui`/`sd`/`khong-ai`) · credit · nodeId nguồn ·
`nguonId` (phim trỏ về ảnh) · cờ `xemTruoc|daNhan`.

**Nguồn đổi ⇒ CHỈ đóng dấu CŨ**, viền cảnh báo + câu "Muốn mới thì bấm Kết xuất lại (tốn credit)".
Không có một đường nào tự sinh lại. Clip **kế thừa `sceneRev` của ảnh nguồn** ⇒ sửa cảnh 3D thì cả
chuỗi ảnh–phim cùng thành cũ, không lệch nửa chuỗi.

---

## ③ MOTION (P1)

Ảnh **đã Nhận** → `input.image` → `ai.image2video` → hàng đợi. Núm: **ý định chuyển động** (6 mục,
ngôn ngữ máy quay: tiến vào · lùi ra · lia · nâng máy · vòng quanh vật · máy đứng yên) ·
**thời lượng** (5s/10s — đúng 2 giá trị node nhận) · **chất lượng** (đúng 2 model node khai).

**Tỉ lệ khung KHÔNG phải núm ở bước này** và tôi cố ý không bịa một ô chọn: `ai.image2video` không
nhận tỉ lệ, clip lấy tỉ lệ của ảnh nguồn. Tỉ lệ được chọn ở bước **Kết xuất** — nơi nó có tác dụng
THẬT (quyết định khung chụp offscreen ⇒ ảnh AI và clip kế thừa). Panel nói thẳng câu đó kèm số
`rộng×cao` của ảnh nguồn. ⛔ Không xây trình dựng phim: không timeline, không cắt ghép, không nhạc.

---

## ④ CẦU SANG TRÌNH CHIẾU

LOOK INSIDE trước (agent phụ soi `components/present-editor/` + `lib/present-editor/`): cầu **đã có**.
`stashPresentHandoffWithIds([{src,id}])` → sessionStorage (fallback biến module) → consume-once ở
`PresentEditor.tsx:361-379` → ảnh vào giỏ Tham chiếu, chèn vào slide thì `id` thành `assetId`.
⇒ Tôi **không làm cầu mới**. Id chuyển đi là `renderImageId(nodeId, 0, 1)` — cùng chuỗi kho kết quả
bên 3D tra ngược được, nên quan hệ nguồn giữ được qua route.

🔴 **Khai thật phần CHƯA đủ:** yêu cầu "tối thiểu có *Đi tới nguồn* và biết nguồn còn mới hay đã cũ"
mới đạt **một nửa** — dây dữ liệu (assetId ↔ bản ghi có `sceneRev`) đã nối, nhưng **chưa có mặt
hiển thị BÊN TRONG Trình chiếu**. Lý do dừng: chèn UI vào `PresentEditor.tsx` (~2.200 dòng, đang có
lane khác đụng vùng lân cận) không còn là "tối thiểu", và món này phụ thuộc một quyết định chưa ai
chốt: element-level provenance nên nằm ở đâu — `ImageElement`, `LinkedAsset.provenance` (hôm nay
`loai` là literal đóng `'pdf'`), hay side-map kiểu `boq-overrides`. Đã có sẵn **hai** hình dạng
provenance khác nhau đang chạy song song (`LinkedAssetProvenance` vs `PerspectiveProvenanceStep`
ép kiểu qua `as`), thêm cái thứ ba mà không chốt là đẻ nguồn thứ tư.

**Phim không sang Trình chiếu được** và panel nói thẳng: `ElementKind` chỉ có `image|text|shape`,
không có ô phim, mọi `<input>` đều `accept="image/*"`. Không bịa nút.

---

## ⑤ AN TOÀN DEMO (provider chết)

- Provider hỏi qua `checkProviders()` (`/api/health`). Không có provider nào ⇒ **chế độ 0-credit vẫn
  chạy**, hai chế độ AI mờ **kèm lý do thật**; nút video mờ kèm lý do riêng (video chỉ chạy trên fal).
- Job lỗi ⇒ thẻ hiện **nguyên văn lỗi engine đã dịch** (`friendlyAiError`) + nút **Thử lại** xếp lại
  đúng node cũ. Không fake success, không fake progress, không `catch` nuốt lỗi.
- Đo tại chỗ 20/08: `/api/health` trả `fal:true, comfyui:true, sd:false`. ⚠️ Nên nhánh
  **"không provider" chưa được chạy sống** — chỉ chứng minh bằng test thuần (`lyDoKhongBamDuoc`).

---

## ⑥ 3 VIỆC MAIN/GUARDIAN YÊU CẦU GIỮA LƯỢT — đã sửa hết

| # | Việc | Đã làm |
|---|---|---|
| ① | radius `8` ngoài thang ⇒ `soi:hinh-hoc` 26→27 | đổi về **10**, có comment lý do. `soi:hinh-hoc` **về đúng mốc 26** |
| ② | nút "Cho chuyển động" `disabled` trần, 0 lý do | bỏ `disabled` → **`aria-disabled` + `aria-describedby`** trỏ ô lý do, chặn hành vi bằng nhánh `if` trong `onClick` |
| ③ | lý do của nút Kết xuất nằm trong `<span>` rời | **`aria-describedby`** nối vào nút, id sinh từ `useId()`; nút cũng chuyển sang `aria-disabled` |
| kèm | `#fff` gõ cứng 3 chỗ | → **`var(--on-accent)`** |

Lý do đổi `disabled` → `aria-disabled` (không chỉ để có thuộc tính): nút `disabled` thật **bị Tab bỏ
qua**, nên lý do không bao giờ tới bàn phím/trình đọc màn hình — đúng bài học 16/08 *"có trong mã ≠
tới được người dùng"*.

---

## ⑦ NGHIỆM THU

### ⑦a Máy
- `npx tsc --noEmit` → **0**
- `lib/capabilities/render-core.test.ts` → **30 pass / 0 fail** (mới)
- Không hồi quy trên các test liên quan: `lib/three/capture.test.ts` 27 · `lib/ui/tien-trinh.test.ts` 64 · `lib/nodes/macro.test.ts` 14 — đều pass
- `npm run soi:frontier` → **0 LỆCH**
- `npm run soi:hinh-hoc` → **26 ngoài thang = đúng mốc** (đã trả lại 27→26)
- `npm run soi:thao-tac` → 4 lệch, **cả 4 là nợ cũ**; grep xác nhận **0 chỗ vi phạm trong file của lane này** (không hex inline, không backdrop-filter thiếu prefix)

### ⑦b BROWSER THẬT `:3001` — **PARTIAL**, khai từng bước

**PASS (thấy tận mắt trên app thật, 1440×900, chặng 3D mode Vẽ 3D):**
1. Panel mount đúng chỗ, mở/thu qua tay cầm `PanelFlank` ("Mở/Thu bảng kết xuất").
2. Ba chế độ hiện đủ với credit 0 / 4 / 6 + câu giải thích thật; hàng tỉ lệ 16:9 · 4:3 · 1:1 · 9:16.
3. **Cảnh rỗng ⇒ nút mờ kèm lý do thật** *"Cảnh chưa có khối nào — dựng khối hoặc đùn từ mặt bằng 2D trước."*
4. Có khối ⇒ nút **tự bật**.
5. **Kết xuất chạy thật**: bấm ra **bản xem trước PNG của đúng khung nhìn đang mở** (khối xám: tường + sàn), thẻ ghi
   `không qua AI · 0 credit · bản cảnh 44093868 · 1280×720`, hai nút **Nhận / Bỏ**. Đây là chứng minh
   trọn đường *camera sống → chụp offscreen → bản ghi có gia phả → dải kết quả*.

**CHƯA CHẠY SỐNG (không phải "chạy rồi mà lỗi" — là chưa tới được):**
- bấm **Nhận** → **Sang Trình chiếu** → thấy ảnh bên Present;
- job AI thật (clay2render) qua hàng đợi + thanh tiến trình số thật;
- job video;
- cờ **CŨ** bật khi sửa cảnh.

Lý do dừng, nói thẳng: dev server `:3001` **dùng chung với 2 lane đang ghi file**, nên trang bị
full-reload liên tục giữa chừng; cộng thêm một hành vi của app (ngoài vùng lane này): **thêm cấu
kiện ở chặng 3D thì app tự nhảy về `/…/cad`**, và vào thẳng URL `/projects/<id>/render` khi chưa "mở
dự án" thì router đá về `/`. Mỗi vòng thử tốn 3–5 phút và hỏng ở một bước ngẫu nhiên. Tôi chọn khai
thật thay vì suy từ mã.

### 🔴 BUG THẬT BẮT ĐƯỢC + ĐÃ SỬA (trong vùng ghi của lane)
`components/render-studio/Command3DPanel.tsx:115` — `run: onTaoTuong` truyền **thẳng** hàm vào
`onClick` ⇒ React gọi nó với `MouseEvent` làm tham số đầu ⇒ tham số mặc định `draft = FIRST_WALL`
không được áp ⇒ `taoTuongMau` đọc `draft.from.x` trên một event ⇒
`TypeError: Cannot read properties of undefined (reading 'x')`, toast **"1 error"**, và nút
**"Thêm tường" chưa bao giờ tạo được tường**. Sửa: bọc lambda `run: () => onTaoTuong()`.
Sau khi sửa, nút tạo tường chạy đúng (thấy `Tường 1` + `Sàn` trong cây khối) — và chính nhờ vậy mới
nghiệm thu được nút Kết xuất. Đây là bug **có sẵn trước lane này**, không phải do tôi tạo ra.

### ⑦b CHƯA CHẮC / CHƯA KIỂM (bắt buộc ghi, kể cả khi trống)
1. **Nhận → Present → thấy ảnh bên Trình chiếu: chưa chạy sống.** Dây gọi đúng API cũ, nhưng chưa ai
   nhìn thấy ảnh hạ cánh bên kia.
2. **Cờ CŨ chưa thấy bật trên app.** Logic có 3 test thuần, chưa có lần nào sửa cảnh rồi soi bằng mắt.
3. **Chưa tiêu một credit nào.** Hai chế độ AI và toàn bộ nhánh video **chưa gọi provider lần nào**
   trên app thật — chưa biết `image_size` từ ảnh 9:16 có làm `ai.clay2render` khó chịu không, chưa
   biết clip trả về phát được trong thẻ `<video>` không.
4. **Nhánh "không provider" chưa chạy sống** (máy này có fal + comfyui).
5. **Lần bấm Kết xuất ĐẦU TIÊN ngay sau khi thêm tường rơi vào guard** *"Khung nhìn 3D chưa sẵn
   sàng"* — vì `Scene3DViewer` cleanup đặt `cameraApiRef.current = null` khi cảnh đổi rồi mới gán
   lại. Bấm lại là được. Tôi **cố ý không** thêm vòng chờ/retry ngầm: đó là trạng thái thật, và giấu
   nó đi thì lần sau hỏng thật cũng im lặng. Nhưng nó **là một gợn tay chưa ai duyệt**.
6. **Kho kết quả qua `localStorage`**: chỉ bản **đã Nhận** xuống đĩa, trần 24 bản, quota đầy thì thử
   lại một lần sau khi bỏ các bản `data:` rồi thôi (kho còn sống trong phiên). **Chưa test ca quota
   đầy thật.** Ảnh chụp 1280×720 PNG data-URI có thể vài trăm KB — chưa đo phân bố thật.
7. **`lib/capabilities/render.ts` import `components/render-studio/render-queue-store`** — một cạnh
   `lib/ → components/`, ngược tầng. Cố ý (dùng lại hàng đợi thật thay vì đẻ cái thứ hai), không có
   vòng lặp import, tsc sạch. Nhưng nếu wave sau muốn dựng máy soi ranh giới module
   (`soi-ranh-gioi` đang ⬜) thì đây là một chỗ nó sẽ kêu.
8. **Chưa đo trên theme sáng**, chưa thử `prefers-reduced-motion`, chưa thử trình đọc màn hình thật.
9. **Rác để lại:** một **tường mẫu 4m + sàn** trong dự án thử `Dự án mới`
   (`cmsqu517r0001w9axbunx9m7m`) do nghiệm thu, và vài node `input.image`/`ai.clay2render` có thể đã
   sinh trên canvas dự án đó. **Không chạm DB bằng tay** (không đếm trước/sau vì không chạy lệnh DB
   nào); dọn được bằng Undo trong app.
10. **`Sequence` (năng lực thứ ba): KHÔNG LÀM GÌ.** Không mở file, không viết dòng nào. Xem §⑧.

### ⑦c HẠN DÙNG KẾT LUẬN
- Bảng ba chế độ + credit đúng **chừng nào `registry.ts` chưa đổi `creditCost`** của
  `ai.clay2render`(4) / `ai.upscale`(2) / `ai.image2video`(8). Test canh con số 8; **không** canh 4 và 2
  ⇒ đổi hai số kia là bảng nói sai mà máy im.
- "Cầu Present là CONNECT không phải NEW" đúng chừng nào `handoff.ts` giữ nguyên chữ ký
  `stashPresentHandoffWithIds` + đường consume-once ở `PresentEditor.tsx:361`.
- Kết luận browser gắn với mốc `c7f3ac8` + tree dirty tối 20/08 của **ba lane cùng chạy**; sau khi
  các lane merge, phải chạy lại vòng nghiệm thu mắt.
- Băm bản-sửa-cảnh là băm **nội dung** `Scene3DData`. Nếu wave sau thêm revision thật vào `Doc`, phải
  chuyển sang đọc số đó — băm nội dung sẽ báo "cũ" cả khi đổi thứ không ảnh hưởng hình ảnh
  (ví dụ đổi tên group).

---

## ⑧ TRẢ MAIN THEO §32

| Mảng | Trạng thái | Ghi chú một dòng |
|---|---|---|
| **Render** | **LIVE** | chụp khung nhìn sống → bản ghi có gia phả → dải kết quả, thấy tận mắt; nhánh AI qua hàng đợi đã nối nhưng **chưa tiêu credit lần nào** |
| **Motion** | **PARTIAL** | dây đủ (ảnh đã Nhận → `ai.image2video` → hàng đợi, có gia phả + kế thừa `sceneRev`), **chưa chạy sống** |
| **Sequence** | **BLOCKED** | không làm gì. Chặn thật: `captureSequence` cần `CamPathResult`, mà `CamPathPreview`/`CamPathControlPanel` **chưa wire vào chặng nào** (nợ cũ, `00-CHOT`); nối nó là một phiếu riêng, không nhồi vào lượt này |
| **Present Bridge** | **PARTIAL** | dùng lại cầu `handoff.ts` sẵn có, id ổn định giữ quan hệ nguồn; **thiếu mặt hiển thị "Đi tới nguồn / còn mới–đã cũ" bên trong Trình chiếu** — chờ chốt chỗ ở của provenance cấp element |

- **Reused:** render-queue-store · runNode · registry (chỉ đọc) · handoff.ts · tien-trinh/LightBar ·
  buildMergedGeometries · nearFarForScene · PanelFlank · ToolbarChip-khuôn-aria
- **Extended:** Viewport3D (prop ref optional) · Render3DModeSkeleton (mount panel) · Command3DPanel (sửa bug)
- **New:** render-core · render · motion-core · motion · capture-live · KetXuatPanel · 1 test file
- **BROWSER: PARTIAL** — 5 bước PASS (mount · bảng chế độ · nút mờ kèm lý do thật · tự bật khi có
  khối · kết xuất ra bản xem trước có gia phả); 4 bước chưa tới được (Nhận→Present · job AI thật ·
  job video · cờ CŨ). Lý do môi trường ở §⑦b, không suy đoán thay.

## ⑨ ĐỀ NGHỊ CHO WAVE SAU (không tự làm)
1. Một lượt nghiệm thu mắt **trên server yên tĩnh**: 4 bước còn lại + 1 job clay2render thật (4 credit).
2. Chốt chỗ ở của **provenance cấp element** bên Present (hôm nay đã có 2 hình dạng chạy song song)
   rồi mới dựng "Đi tới nguồn".
3. `app tự nhảy 3D → /cad` khi thêm cấu kiện — ngoài vùng lane này, nhưng nó phá mạch làm việc và
   suýt che mất bug `Thêm tường`.
4. Nếu muốn Sequence: wire `CamPathPreview`/`CamPathControlPanel` trước, rồi
   `captureSequenceAsync` + hàng đợi — đường đã sẵn, chỉ thiếu chỗ cắm.
