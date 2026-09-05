# ĐỐI CHIẾU DI SẢN — PR / NHÁNH CŨ vs DÒNG TÍCH HỢP HIỆN TẠI

**Lập** 04/09/2026 · phiên FORENSIC (chỉ đọc) · **HEAD** `79e2bdb4` trên `integration/2026-09-04`
**Nguồn phán**: Git + `CLOUD-SESSION-LEDGER` + `CAPABILITY-DELTA-backup-batch0a` + north star `N-1…N-20`.
**Không dùng làm căn cứ**: lời của bất kỳ phiên Cloud cũ nào, và **trạng thái Open/Merged của PR**.

> ⛔ **PHIÊN CLOUD CŨ = THỢ CŨ, KHÔNG PHẢI AUTHORITY.** Phiên cũ báo *"12 PR mở"*. Con số đó
> **ĐÚNG như một sự thật GitHub và SAI như một tuyên bố về việc còn lại** — 11/12 PR đó có nội
> dung đã nằm trọn trong HEAD. Xem §1.

---

## 0 · BẢNG ĐẾM

| | |
|---|---|
| **TOTAL LEGACY** | **35 nhánh** (37 ref remote − `origin/main` − `origin/integration/2026-09-04`) · **12 PR mở** + 2 PR đã merge |
| **ALREADY INTEGRATED** | **12** — toàn bộ `claude/*` |
| **RECOVER VALUE** | **2** — `backup/2026-08-19-batch0a` · `checkpoint/2026-08-24-control-plane` |
| **SUPERSEDED** | **1** — `fix/hatch-t-junction` |
| **ARCHIVE** | **20** — 17 `feat/*` · `nhanh-g4` · `nhanh-phu` · `worktree-agent-a9a70ede` |
| **INVESTIGATE** | **0 nhánh** — nhưng **1 khẳng định nền không kiểm được tại chỗ**, xem §5.1 |

---

## 1 · "12 PR MỞ" — GIẢI TRỌN, CÓ BẰNG CHỨNG

12 PR đang mở là **#1, #3–#13** (#15 là chính xe tích hợp, không tính). Phép kiểm quyết định
**không phải** trạng thái PR mà là quan hệ tổ tiên:

```
git merge-base --is-ancestor <branch> HEAD      → 12/12 YES
git rev-list --count HEAD..<branch>             → 12/12 = 0
comm -23 <(ls-tree branch) <(ls-tree HEAD)      → 12/12 = 0 tệp riêng
```

⇒ **Mọi commit và mọi tệp của 12 nhánh `claude/*` đều đã nằm trong HEAD.** Chúng hiện "Open"
chỉ vì `integration/2026-09-04` **chưa merge vào `main`** (PR #15 là xe chở). Đóng PR #15 là 11
PR kia tự hết nghĩa.

**Ngoại lệ duy nhất trong nhóm 12**: **PR #1 = `checkpoint/…`** — đây là PR mở *thật sự* chưa
tích hợp, và nó là ca riêng (§3).

> ⭐ **BÀI HỌC ĐỌC BẰNG CHỨNG**: "PR Open" là bằng chứng về **quy trình**, không phải về **nội
> dung**. Ở đây quy trình nói *"còn 12 việc"*, nội dung nói *"còn 1"*. Chênh nhau 11.

---

## 2 · BẢNG CHI TIẾT TỪNG NHÁNH

### 2.1 · ALREADY INTEGRATED — 12 nhánh `claude/*`

| PR | Nhánh | HEAD | Commit chưa có trong HEAD | Tệp riêng | Năng lực | BẰNG CHỨNG |
|---|---|---|---|---|---|---|
| #9 | `project-permissions-collaboration-5delq6` | `018539e6` | **0** | **0** | quyền theo năng lực · mời có chữ ký · bình luận xuyên máy | ancestor-of-HEAD |
| #7 | `compass-site-calendar-slice-8w69t6` | `29b953b2` | **0** | **0** | la bàn dự án + lịch/họp MS365 | ancestor-of-HEAD |
| #6 | `asset-idfc-normalization-vwy62i` | `233fb1a1` | **0** | **0** | `.idfc` cửa pháp lý · kiểm đơn vị/trục · seed CC0 | ancestor-of-HEAD |
| #3 | `interiorflow-home-library-slice-u98w4u` | `81e80c32` | **0** | **0** | `/library` tổng · Kho tri thức có nguồn gốc | ancestor-of-HEAD |
| #12 | `inspiration-image-intelligence-qmbeuu` | `390cf1e0` | **0** | **0** | Cảm hứng → đọc ảnh → áp ý định lùi được vào Thẻ DNA | ancestor-of-HEAD |
| #5 | `interiorflow-present-boq-voice-4hl7aa` | `57bf575b` | **0** | **0** | phụ lục BOQ trong deck + điều hướng slide bằng giọng | ancestor-of-HEAD |
| #13 | `node-workflow-ai-settings-hqm2bi` | `a2b696f9` | **0** | **0** | 9 họ node · nguồn gốc kết quả · Bốn mức AI | ancestor-of-HEAD |
| #4 | `canonical-data-spine-identity-izarxs` | `cb286071` | **0** | **0** | thang độ đảm bảo chung + sổ phiên bản Thẻ DNA | ancestor-of-HEAD |
| #10 | `interiorflow-2d-cad-slice-s319zo` | `028d2762` | **0** | **0** | Chỉnh lệnh vừa chạy (B4, kiểu Blender F9) | ancestor-of-HEAD |
| #11 | `vitals-eval-slice-uzipzg` | `b93ba4c4` | **0** | **0** | lõi đánh giá thiết kế 3 lớp | ancestor-of-HEAD |
| #8 | `interiorflow-design-system-vbdcku` | `83b9c79c` | **0** | **0** | token bề mặt/focus/z · `Surface` · `TruthBadge` · máy canh token | ancestor-of-HEAD |
| #2·#14 | `interiorflow-image-to-3d-render-qqimbk` | `f43de304` | **0** | **0** | Ảnh→Spec · render — **đã là `origin/main`** | merged 03/09 + 04/09 |

### 2.2 · SUPERSEDED — 1 nhánh

| Nhánh | HEAD | Chưa có trong HEAD | Năng lực | BẰNG CHỨNG SUPERSEDED |
|---|---|---|---|---|
| `fix/hatch-t-junction` | `ed002ec0` | 159 *(số ảo, xem §5.1)* | **DCEL liệt kê mặt toàn cục** — dò biên hatch đúng cho phòng có vách chữ T (+244 dòng, 29 test, 11/07, treo 55 ngày) | **Năng lực đã có trong HEAD, viết độc lập.** `lib/cad/hatch.ts` (610 dòng, gấp đôi bản nhánh 336) docstring bước 3 ghi thẳng *"Dựng DCEL toàn cục … khác bản cũ chỉ 'rẽ góc nhỏ nhất' cục bộ … vốn lạc lối tại đỉnh chữ T bậc ≥4"*; `hatch.test.ts` có test **[7]** *"2 phòng, vách ngăn đâm chữ T"* và **[8]** *"demo-plan thật … PHÒNG KHÁCH/BẾP (kề chữ T — ca fail cũ)"* |

🔴 **SỔ LỆCH CODE — phải đóng**: `scripts/frontier-registry.mjs:83` entry `hatch-t-junction-cay-lai`
vẫn `trangThai: 'chua'`. Nó không bao giờ tự chuyển vì **mẫu bằng chứng của nó là
`facesFromDcel|hatch-t-junction`** — một **tên hàm** mà bản HEAD không dùng (HEAD hiện thực DCEL
với cách đặt tên khác). `grep facesFromDcel lib/cad` = **0**.

> ⭐ Đây là ca mẫu của luật đọc bằng chứng: **grep ra 0 KHÔNG phải bằng chứng "năng lực vắng"** —
> ở đây nó chỉ là bằng chứng *"cái tên đó không tồn tại"*. Năng lực có đủ, có cả test khoá đúng
> hai ca từng fail. Sổ đòi một cái tên, code trả một cái tên khác, và `soi:frontier` mù suốt.

### 2.3 · ARCHIVE — 20 nhánh dòng cũ (gốc `8c3d317b`)

| Nhóm | Số nhánh | Năng lực | BẰNG CHỨNG ARCHIVE |
|---|---|---|---|
| `feat/*` (android-oppo · cad-ai-mechanism · cad-block-library · cad-lt-parity · cad-pro-stage1 · cad-type-anywhere · demo-flows · form-mode · login-social · pptx-export · present-editor · present-env · qa-p1-fixes · reference-gu-ml · render-nodes-ux · render-quality · wt-session) | 17 | việc tháng 07/2026 | dưới bảng |
| `nhanh-g4` · `nhanh-phu` | 2 | việc tháng 08 dòng cũ | dưới bảng |
| `worktree-agent-a9a70ede` | 1 | 1 commit `polish(demo): i18n VI/EN toggle…` | dưới bảng |

**Phép đo gộp cho cả 21 nhánh dòng cũ** (gồm cả `fix/hatch-t-junction`), so với `checkpoint` —
tức là **tip muộn nhất của chính dòng đó**:

```
tổng tệp mà nhóm dòng cũ có mà checkpoint KHÔNG có   →  164
  ├ tài sản thương hiệu/khách (detech·covers·san pham·amanoi·ttt)  → 106
  ├ mã demo/sample/intro                                            →  28
  └ còn lại là MÃ, không phải brand/demo                            →  15
```

**15 tệp mã còn lại** đều là vỏ app trước 17/08 hoặc route mẫu công khai đã bị chốt giết:
`app/present/page.tsx` · `app/report/page.tsx` · `components/Header.tsx` · `components/LeftRail.tsx`
· `components/studio/StudioBar.tsx` · `components/studio/HomeButton.tsx` ·
`components/present-editor/ExportMenu.tsx` · `components/form/{FormSurface,PresentForm,RenderForm}.tsx`
· `components/render-studio/ToolModeHome.tsx` · `components/three/{CommandPanel,ObjectProperties}.tsx`
· `lib/nodes/tags.ts` · `lib/three/mode-render-3d.ts`.

**Hai lý do ARCHIVE, mỗi lý do tự đủ:**
1. **Nội dung riêng của chúng chính là thứ đợt dọn trung tính CỐ Ý XOÁ.** Mẫu `feat/qa-p1-fixes`:
   44 tệp `san pham dau ra/tham khao` · 18 tệp `public/detech` · 5 `public/covers` ·
   `lib/present-editor/detech-sample.ts` · `akh-sample.ts` · `app/demo-amanoi/` ·
   `components/IntroSequence.tsx` · `TemplatePicker.tsx`. Thu về là **kéo ngược dữ liệu khách
   vào sản phẩm bán ra** — phá thẳng LUẬT TRUNG TÍNH.
2. **`checkpoint` là bản muộn hơn của cùng dòng** ⇒ nếu một năng lực của dòng cũ còn sống, nó
   nằm trong `checkpoint`, không cần đi qua 21 nhánh. Nguồn thu hồi của dòng cũ **chỉ có một**.

⇒ **KHÔNG XOÁ nhánh nào** (luật §4 sổ kiểm kê: lưu trữ là bằng chứng và là đường lùi).

---

## 3 · HAI NHÁNH CÒN GIÁ TRỊ THẬT

### 3.1 · `checkpoint/2026-08-24-control-plane` — **RECOVER VALUE (nội dung) · ARCHIVE VĨNH VIỄN (lịch sử)**

| Đo | Giá trị |
|---|---|
| Commit cuối | 01/09/2026 — **muộn hơn `backup` 10 ngày** |
| Tệp có mà HEAD không có | **921** · trong đó **246 tệp MÃ** |
| Tệp HEAD có mà nó không có | 352 (11 slice + việc 03–04/09) |
| Dấu vết TTT trong cây | **6 tệp** `docs/design-candidate/TTT-PROFILE-UX-001/…` — HEAD: **0** |

⛔ **Cấm merge như lịch sử; chỉ CHÉP NỘI DUNG TỆP.** Sáu tệp TTT là lý do đủ, không cần lý do
nào khác. Chép blob không kéo lịch sử về.

**Cụm mã riêng, theo thư mục:** `scripts` 48 + `scripts/proof` 24 · `lib/cad` 20 · `lib/ui` 14 ·
`lib/site` 14 · `lib/voice` 9 · `lib/render-studio` 8 · `components/studio` 8 · `components/home` 8
· `lib/capabilities` 7 · `components/ui` 7 · `components/site` 7 · `app/api` 7 · `lib/server` 5 ·
`lib/home` 5 · `artifacts/visual-review` 4 (ảnh) · `lib/wallpaper` 4.

### 3.2 · `backup/2026-08-19-batch0a` — **RECOVER VALUE, đã thu 3 đợt, còn dư**

| Đo | Giá trị |
|---|---|
| Commit chưa có trong HEAD | **59** |
| Tệp có mà HEAD không có | **91** · trong đó **47 tệp MÃ** *(khi lập `CAPABILITY-DELTA` là 56 ⇒ 3 đợt thu đã đóng 9)* |
| Sức khoẻ | HEAD nhánh **không biên dịch được** (4 import trỏ vào module chỉ có ở `checkpoint`) |

⇒ Giữ nguyên kết luận của `CAPABILITY-DELTA`: **nguồn thu hồi đúng là `checkpoint`**, `backup`
chỉ là lát cắt sớm hơn của cùng dòng.

---

## 4 · CẬP NHẬT LỚN SO VỚI HAI SỔ — ĐO LẠI TẠI NGUỒN 04/09

Hai mục `CAPABILITY-DELTA` đánh dấu **DECISION REQUIRED / authority chống authority** nay **ĐÃ
ĐƯỢC THI HÀNH TRONG HEAD**. Phiên nào đọc sổ cũ rồi đi làm tiếp là làm lại thứ đã xong.

| Mục | Sổ ghi | HEAD 04/09 | Bằng chứng |
|---|---|---|---|
| **D-DR1 · chỗ đứng Vitals** | *"hai bên loại trừ nhau, không tự chọn"* | **XONG theo EXS §7** | `AppChrome.tsx:370` mount `<VitalsAperture/>` — **mount duy nhất**; `VitalsRightEdgeHost` **0 nơi mount**; `VitalsPill` **0 nơi mount**; `VitalsGesturePanel` chỉ còn sống **bên trong** `VitalsAperture.tsx:735` (đúng lệnh "ADAPT hành vi, bỏ chỗ đứng"). Commit `711d5c73` *"thi hành D-DR1 và D-DR2"* |
| **Lỗi mất câu hỏi** | *(chưa ai bắt)* | **ĐÃ VÁ + CÓ MÁY CANH** | `components/studio/mot-cho-dung.test.ts` — 3 khẳng định khoá: ①`VitalsGesturePanel` mount đúng 1 tệp ②⌘J đăng ký đúng 1 tệp ③chỗ đứng là khẩu độ mép trên **và được mount thật**. Commit `4ce173c2` |
| **D-DR2 · bố cục Home** | *"hai bố cục loại trừ nhau"* | **XONG theo EXS §6** | cùng commit `711d5c73`; `components/home/xuong-layout.ts` có mặt trong HEAD |

> ⭐ Đây là lý do việc đối chiếu này cần làm bằng **đo tại nguồn**, không bằng đọc sổ: hai sổ
> đều đúng **tại lúc lập**, và cả hai đã lỗi thời **trong vòng chưa tới một ngày**.

🟡 **Nợ dọn nhỏ, không chặn**: `VitalsRightEdgeHost.tsx` · `VitalsPill.tsx` · `StageSwitcher.tsx`
còn nằm trong cây với **0 nơi mount**. `4ce173c2` gọi là *"đóng dấu bia mộ"* — tệp mồ côi đọc ra
như tệp sống là đúng cái bẫy đã cắn dự án ba lần (`KB-5` · `.idfnotes` · *"master tool"*).

---

## 5 · HÀNG ĐỢI THU HỒI — XẾP THEO NĂNG LỰC, KHÔNG THEO PR

> **Cột AUTHORITY theo yêu cầu điều phối 04/09.** Không có cột này thì *"thu hồi có chọn lọc"*
> tụt thành *"thu hồi cái gì còn sót"*. **N-19: không hồi sinh một tính năng chỉ vì mã còn tồn tại.**
> Nguồn chép: `git show origin/checkpoint/2026-08-24-control-plane:<path>` (bản muộn nhất).

### 5.A · THU ĐƯỢC NGAY — authority còn hiệu lực, không đụng quyết định nào

| # | Năng lực | Tệp nguồn | AUTHORITY phủ nó | Còn hiệu lực? | Vì sao còn giá trị theo north star | Rủi ro khi thu |
|---|---|---|---|---|---|---|
| R1 | **Tầng CHÍNH SÁCH NGƯỠNG** — 4 hạng `chuan/chinh-sach/uoc-le/chi-test`; ngưỡng chưa có nguồn **IM TRONG SẢN XUẤT**, kết quả trần `inferred` | `lib/site/chinh-sach.ts` (+ `anh-huong.ts` · `suy-luan.ts` · `vitals-site.ts`) | LUẬT ĐỒNG BỘ HỌ CHUẨN + BIẾN SỐ NGỮ CẢNH (15/08) · **N-2** *"sự thật thiết kế không được mất"* | ✅ **CÒN** | HEAD **chưa có** tầng này: `lib/cad/standards/registry.ts` mới có cờ **nhị phân** `verified` true/false. Ba ngưỡng vô chủ (mưa 100mm · ven biển 3000m · ẩm 75%) đi qua vài lớp hàm rồi hiện ra trước mặt KTS **như sự thật ngành** — đúng thứ N-2 bảo vệ | ⚠️ **PHẢI EXTEND, KHÔNG DỰNG SONG SONG.** Đặt 4 hạng cạnh cờ `verified` 2 trạng thái mà không nối = đẻ ca thứ 5 "cùng bản chất khác tên". Theo B25: EXTEND NEAREST CONTRACT = `StandardRule.verified/source` |
| R2 | **Cầu same-origin tới ComfyUI** (vá 403 do header `Origin`) | `app/api/comfyui-image/route.ts` | chốt 15/08 *"chặng 2: MỘT bộ lệnh, HAI lối thao tác — node ComfyUI ↔ tool truyền thống"* | ✅ **CÒN** | lối node-graph là 1 trong 2 lối đã chốt; 403 làm chết hẳn lối đó | thấp — 1 route độc lập |
| R3 | **Ảnh → Spec ra TỜ SPEC lưu được** | `lib/capabilities/anh-thanh-spec.ts` (+test) · `components/ui/CuaAnhThanhSpec.tsx` | `CHOT-ELEMENT-MATERIAL-INTELLIGENCE` 10/08 · **N-1** chuỗi *ý định → … → đầu ra* | ✅ **CÒN** | HEAD có nửa **ĐỌC** ảnh (`lib/vision/image-spec.ts`, 03/09) nhưng **không có** nửa ra tờ spec ⇒ chuỗi đứt ở đoạn cuối, đúng hình dạng lỗi mà §4 vừa vá cho Vitals | thấp — khác tầng, không trùng |
| R4 | **9 ảnh mẫu vật liệu + máy sinh lại** | `public/mau-vat-lieu/*` · `scripts/sinh-mau-vat-lieu.mjs` | LUẬT 300DPI · trung tính (ảnh sinh, không phải render khách) | ✅ **CÒN** | rẻ, có script sinh lại nên không phải nợ nhị phân | thấp |

### 5.B · THU ĐƯỢC, NHƯNG PHẢI ĐỐI CHIẾU AUTHORITY 04/09 TRƯỚC KHI DỰNG

| # | Năng lực | Tệp nguồn | AUTHORITY phủ nó | Còn hiệu lực? | Ghi chú bắt buộc đọc |
|---|---|---|---|---|---|
| R5 | **TỜ BẢN VẼ → Trình chiếu, phần thiết lập trang** (B3 nhanh · B4 đầy đủ + khai năng lực THẬT · B7 cầu Spec→Present · B8 nguồn liên kết · B9 cờ hồ sơ) | `components/present-editor/{ThietLapTrang,ThietLapTrangDayDu,NguonLienKet,ho-so-status}.tsx` · `lib/present-editor/spec-present-handoff.ts` | `CHUAN-DAU-RA-NGHE` 11/08 (LUẬT) · Present đa đích 07/08 | ✅ **CÒN** | **B2+B5 đã thu** (`3a4af296`); đây là phần còn lại của cùng chuỗi. B4 giá trị nằm ở **NGHI THỨC**: núm chưa nối phải khai lý do thật, cấm khai `false` giả |
| R6 | **Deep-link slide → ngữ cảnh sống → quay về đúng slide** | `lib/present-editor/present-return.ts` · `components/studio/QuayVeTrinhBay.tsx` | **N-1** *"ngữ cảnh không được chết khi đổi công cụ hay đổi chặng"* | ✅ **CÒN** | đúng câu lõi của north star; hoà tay 1 khối import ở `SlidePlayer.tsx:15-27` |
| R7 | **Trạng thái tệp nguồn — 2 trục 7 nấc** | `components/filemanager/tep-nguon-trang-thai.ts` (+test 144 dòng) | Files hai tầng 17/08 | 🟡 **CẦN SOI** | Hoà đổi cấu trúc Files hai lần (hai NGĂN 17/08 → hai TẦNG + Collection+ 17/08 tối). Thu **lõi trạng thái**; **KHÔNG** thu bản viết lại `TepNguonDuAn.tsx` 747 dòng |
| R8 | **Sửa có kiểm soát trên ảnh sinh ra** | `lib/render-studio/controlled-edit*.ts` · `components/render-studio/SuaCoKiemSoat.tsx` | MAXIMUM CONTROL MINIMUM FRICTION · **N-3** quyền tác giả thuộc về người | ✅ **CÒN** | môi trường `cua.anh.can-trang` **đã có** trong HEAD ⇒ cắm vừa |
| R9 | **Tầng nền UI còn lại** — D5 `BeMatNoi` (portal + mọc-từ-nguồn) · D6 ba mức vật liệu theo vai trò · D7 nhịp theo vai trò | `components/ui/BeMatNoi.tsx` · `lib/ui/vat-lieu.ts` (+test) | EXS luật hình học 20/08 (*from the center* · morph giữ identity) · **N-15 tiết chế chất liệu** | ✅ **CÒN** | **D1–D4 đã thu** (`31a1c6cc`) nên đây là phần dư. Đường gộp đã chốt sẵn ở `CAPABILITY-DELTA` §D-0: **giữ tên lớp `.if-surface--*` của INT**, thu trục vật liệu 3 giá trị của BK. `lib/ui/vat-lieu.ts` là tệp còn thiếu |
| R10 | **Dải ngữ cảnh mép trên** (D8) · **cụm phải-trên** (D9) · **chuông hoạt động 3 mức** (D10) | `components/studio/{DaiNguCanh,CumPhaiTren,HoatDongChuong}.tsx` · `lib/studio/hoat-dong-luong.ts` | EXS §2 năm vùng trách nhiệm · **N-13 chrome tĩnh** | 🟡 **CẦN SOI LẠI** | Lý do gốc của D9 trong sổ là *"INT đang ở đúng trạng thái bị khai là TRƯỢT"* — **trạng thái đó đã đổi** sau `711d5c73`. Vỏ mép trên nay có khẩu độ Vitals; thêm hai cụm nữa vào cùng dải **phải kiểm va chỗ đứng**, đúng thứ luật ĐẶT CHỖ (đã thu, D1) sinh ra để chặn |
| R11 | **Live Guide / Demo Conductor + xương demo 9 bước** | `components/studio/LiveGuide.tsx` · `lib/studio/{live-guide,demo-spine}.ts` | *(chỉ có trong sổ BK, không thấy chốt Hoà nào phủ)* | 🔴 **KHÔNG TRA ĐƯỢC** | Xem §6 — mục duy nhất tôi không tìm ra authority đang phủ |

### 5.C · KHÔNG THU — đã có bản thay, hoặc trái authority hiện tại

| Năng lực | Vì sao KHÔNG | Điều khoản |
|---|---|---|
| **`lib/site` + `components/site` bản VI của checkpoint** (`khi-hau` · `dan-xuat` · `canh-gac` · `gio` · `dia-ly` · `NhapViTri` · `TomTatDiaDiem` …) | **Trùng khái niệm, khác từ vựng** với bản đã tích hợp từ slice compass: `khi-hau`↔`climate` · `dan-xuat`↔`derive` · `canh-gac`↔`guard` · `gio`↔`solar`. Bản HEAD đã qua `tsc`/test/build và đang chạy | **N-19** · ca 4-tên-một-thứ (`may-soi-dong-dang`) |
| **`components/home/BatDauNgaySoKhong.tsx` · `lib/home/widget-prefs.ts` · bento** | Hoà phán Home theo mô hình đó **TRƯỢT 04/09**; `widget wall` · `card-for-everything` · `bento làm mặc định` nay là **cờ đỏ** | **N-10** · **N-8** |
| **`prisma/migrations/…_them_project_file_review_state`** | Schema **cả hai bên** đều không có cột `reviewState` ⇒ áp vào là dựng cột Prisma không biết | C8 `CAPABILITY-DELTA` |
| **`artifacts/visual-review/*.png`** (35+ ảnh 20–23/08) | Ảnh của **vỏ app cũ**; không dùng được làm ảnh chuẩn cho hàng đợi duyệt mắt hiện tại. Còn nguyên trên nhánh để tra khi cần khảo cổ | **N-19** |
| **`components/home/TrangThaiO.tsx`** | Nấc thứ tư "ngoại tuyến" **đã được gộp** vào `EmptyState.tsx` (`13ecd08a`) thay vì dựng component thứ hai | — |

---

## 6 · CẦN CHỦ DỰ ÁN QUYẾT — **3 mục**

Tôi cố ý để danh sách này ngắn. Mọi mục khác đã đủ bằng chứng để tự phán.

| # | Câu hỏi | Vì sao MÁY KHÔNG phán được | Dữ kiện để quyết |
|---|---|---|---|
| **Q1** | **Live Guide / Demo Conductor** (R11) — còn muốn không? | Đây là mục duy nhất tôi **không tìm ra authority nào đang phủ nó**. Nó không trái north star, nhưng cũng không có chốt nào đòi. Thu vì *"mã còn tồn tại"* là đúng thứ **N-19** cấm | 3 tệp, tự đứng được; hoãn không chặn gì |
| **Q2** | **`app/api/manufacturer-import`** (C4) — hai cách tiếp cận cho **cùng một cửa** | BK đi đường "gói tệp người dùng có sẵn"; slice `asset-idfc` đã tích hợp đường `idfc-import/asset-family` + `catalog-link`. Chọn cửa nhập là quyết định **sản phẩm**, không phải kỹ thuật | bản INT đang chạy và có test; bản BK chưa từng chạy trên dòng này |
| **Q3** | **`lib/render-studio/form-recipe.ts`** (A13) — mặt tiền "Công thức hình gom theo Ý ĐỊNH" | Engine đã có dưới tên khác (`lib/three/build-recipe.ts`, từ 12/08). Thu mặt tiền = có ích cho người dùng; cũng = nguy cơ hai tên một thứ. Cân giữa **giá trị dùng** và **kỷ luật từ vựng** | BK có test; `BuildRecipe` đang gánh cả `chuan-net` |

> Ba mục `A9` (bảng lớp 3 nấc) · `A11` (trang demo `/demo/ghe-3d`) · `B10-viết-lại` giữ nguyên
> trạng thái **không đụng** như `CAPABILITY-DELTA` đã chốt — chưa cần làm phiền chủ dự án lần nữa.

---

## 7 · CHƯA CHẮC — khai thẳng

### 7.1 · 🔴 **KHO NÀY LÀ BẢN SAO NÔNG (SHALLOW) — vài con số trong hai sổ là HIỆN VẬT ĐO ĐẠC**

```
git rev-parse --is-shallow-repository   → true
cat .git/shallow                        → 388a8932  (mốc "gốc" của main)
                                           d49eaea3  (đỉnh checkpoint)
```

Hệ quả **đo được**, không suy:

| Khẳng định trong sổ | Thực tế kiểm được | |
|---|---|---|
| *"`main` gốc `388a8932`, 52 commit — lịch sử đã dọn sạch"* | `git cat-file -p 388a8932` cho thấy nó **CÓ dòng `parent 073881e3`**. Nó **không phải root**; git chỉ coi nó là root vì `.git/shallow` cắt ở đó | 🟡 |
| *"`checkpoint` gốc `8c3d317b`, 1820 commit"* | Trong kho này `checkpoint` đo ra **1 commit, ahead 1** — vì `d49eaea3` bị đánh dấu shallow. Số 1820 của sổ **không tái hiện được ở đây** | 🟡 |
| *"hai dòng lịch sử KHÔNG có tổ tiên chung"* | `git merge-base` vẫn trả rỗng — **nhưng rỗng là kết quả bắt buộc** khi cả hai dòng đều bị cắt cụt. `073881e3` **không tồn tại trong kho này** ⇒ **không kiểm được** | 🔴 **KHÔNG PHÁN ĐƯỢC** |

⚠️ **Điều này KHÔNG đổi quyết định ARCHIVE** — quyết định đó đứng trên **bằng chứng nội dung**
(6 tệp TTT trong cây `checkpoint`, 106 tệp brand trong nhóm `feat/*`), không cần tới lịch sử.
Nhưng **lý do phải ghi lại cho đúng**, và mọi phép đo lịch sử về sau trong kho này phải kèm cảnh
báo shallow. Muốn phán dứt điểm thì cần `git fetch --unshallow` trên một kho đầy đủ.

> ⭐ Đúng cái bẫy đã dặn: **một lệnh git trả rỗng thì nghi ngờ chính lệnh đó trước.** Ở đây
> `merge-base` trả rỗng vì **bị bịt mắt**, không phải vì hai dòng thật sự rời nhau.

### 7.2 · Những chỗ khác tôi không kiểm được

- **Không chạy `tsc` · `npm test` · `build` · dev server** (phiếu cấm) ⇒ mọi phán quyết là
  **đọc mã + đo Git**, không phải *"chạy thấy đúng"*. Riêng năng lực hatch chữ T tôi đọc được
  cả docstring **và** tên test khoá hành vi, nên tin cậy cao — nhưng **chưa thấy nó xanh**.
- **Không mở render bản vẽ nào.** Nhận định về 20 bản EXS dựa trên đầu tệp + kích thước.
- **18/20 nhánh ARCHIVE tôi không mở từng nhánh một.** Kết luận dựa trên phép đo **gộp** ở §2.3
  (164 tệp riêng của cả nhóm, phân loại được 149) + đọc kỹ 2 nhánh mẫu. Nếu một nhánh giấu thứ
  gì quý trong 15 tệp mã còn lại thì phép đo của tôi **không loại trừ được** — tôi chỉ chứng minh
  chúng là vỏ app trước 17/08 **theo tên tệp**, không theo nội dung.
- **246 tệp mã riêng của `checkpoint`: tôi phân loại theo THƯ MỤC, không đọc từng tệp.** Cụm
  `scripts` (74 tệp, gồm `claude-lease` · `claude-role-guard` · `phieu-ca` · `buu-ta-cau` ·
  `phong-dieu-khien`) là **hạ tầng điều phối phiên** — tôi **chưa đánh giá**, và nó nằm ngoài
  khuôn "năng lực sản phẩm" mà phiếu này hỏi. Có thể còn giá trị cho vận hành; cần một lượt riêng.
- **Con số 246 lệch với 207 của `CAPABILITY-DELTA`.** Nhiều khả năng do bộ lọc đuôi tệp khác nhau
  (tôi tính cả `.mjs`/`.js`/`.css`), **không phải** do nội dung đổi. Tôi **không đi truy lại** —
  nếu con số này quan trọng cho quyết định nào thì phải đo lại bằng cùng một bộ lọc.

### 7.3 · Một bài học về NHÃN, do điều phối chỉ ra và tôi ghi lại

**"Đã qua mắt" không phải nhãn vĩnh viễn — nó gắn với CÂU HỎI tại thời điểm đó.**
Ca thật: `mock-exs-c-home-work-os.html` qua mắt Hoà 20/08, tôi khuyến nghị dùng lại cho Home; điều
phối bác đúng — 04/09 Hoà đã phán chính mô hình đó (bento + tường widget) là **TRƯỢT**, và các
thành phần bản vẽ đó liệt kê nay là **cờ đỏ N-10**. Bản vẽ đúng cho câu hỏi 20/08, **sai cho quyết
định 04/09**.
⇒ Khi authority đổi, **con dấu duyệt cũ không tự bị thu hồi**. Đây cùng họ với bệnh tài-liệu-mồ-côi
(`KB-5` · `.idfnotes` · *"master tool"* · và chính `IF-ARCHITECTURE-COMPASS` mồ côi 19 ngày).
**Đó là lý do bảng §5 có cột AUTHORITY và cột CÒN HIỆU LỰC.**

---

## 8 · VIỆC SINH RA TỪ ĐỐI CHIẾU NÀY (không thuộc hàng đợi thu hồi)

| # | Việc | Vì sao |
|---|---|---|
| V1 | **Đóng entry `hatch-t-junction-cay-lai`** trong `frontier-registry.mjs:83` → `xong`, và sửa mẫu bằng chứng khỏi tên hàm không tồn tại | Sổ báo "chưa" cho việc đã xong 100%; máy soi không bao giờ tự phát hiện |
| V2 | **Xoá hoặc đóng dấu bia mộ rõ ràng** cho `VitalsRightEdgeHost.tsx` · `VitalsPill.tsx` · `StageSwitcher.tsx` (0 nơi mount) | tệp mồ côi đọc ra như tệp sống — bẫy đã cắn 3 lần |
| V3 | **Cập nhật `CLOUD-SESSION-LEDGER` §3 + `CAPABILITY-DELTA` §D-DR1/§D-DR2**: đóng dấu ĐÃ THI HÀNH | hai sổ đang mời phiên sau đi quyết lại thứ đã quyết và làm lại thứ đã làm |
| V4 | **Ghi cảnh báo SHALLOW vào `CLOUD-SESSION-LEDGER` §0** | mọi con số lịch sử đo trong kho này đều kèm hiện vật; xem §7.1 |
| V5 | Sau khi PR #15 merge vào `main`: **đóng 11 PR `claude/*`** kèm một câu lý do | để lần sau không ai đọc "12 PR mở" thành "12 việc còn lại" |
