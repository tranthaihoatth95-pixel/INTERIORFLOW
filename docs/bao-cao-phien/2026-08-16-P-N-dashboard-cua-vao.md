# P-N · DASHBOARD LÀ CỬA VÀO — báo cáo phiên (16/08)

> Phiếu: `docs/phieu-giao/P-N-dashboard-la-cua-vao.md` · khuôn 6 phần `docs/CLAUDE.md`
> Mốc: `544999f` · lệch main **0** · nhánh `main`

---

## 1 · TỔNG QUAN

Đăng nhập nay **luôn dừng ở dashboard** — đã cắt cả **hai** nhánh tự-nhảy trong `HomeScreen.tsx`
(phiếu chỉ nêu một; nhánh thứ hai mới là nhánh khiến người dùng quay lại không bao giờ thấy Home).
Việc-đang-dở không mất: dựng widget **"Việc đang dở"** ba nấc + lõi thuần 29 test, bấm **1 cú** là
về đúng chỗ cũ. **V3 (thanh trượt bên) DỪNG giữa chừng theo chốt mới của Hoà** — phần đã đo gói lại
thành ghi chú bàn giao ở §5. Bản vẽ thu về đúng widget, 2 theme, 1440×900 không tràn.

🔴 **Một việc KHÔNG đóng được trong phiếu này:** widget **chưa mount lên dashboard**, vì nơi mount
duy nhất là `components/home/DongStudioHome.tsx` — **phiên hình nền đang giữ**. Patch 3 dòng ở §5.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b Tiền đề hạ tầng
| Kiểm | Kết quả |
|---|---|
| `git log --oneline -1` | `544999f` — **khớp phiếu** |
| `git rev-list --count HEAD..main` | **0** — không lệch |

### ⓪ Bốn tiền đề nghiệp vụ — **đo lại, ĐÚNG CẢ BỐN**
| # | Phiếu nói | Đo được |
|---|---|---|
| 1 | tự-nhảy ở `HomeScreen.tsx:320-322`, khoá `sessionStorage 'interiorflow.sessionResumed'` | ✅ đúng nguyên văn từng ký tự |
| 2 | `StudioBar.tsx` không còn; lối vào 3 chặng là dock `StageSwitcher` trong thanh trên | ✅ `ls components/studio/` không có StudioBar; `StageSwitcher.tsx:4` tự khai "TRỤC ĐIỀU HƯỚNG DUY NHẤT" |
| 3 | `PanelFlank` đã có, dùng ở 4 nơi | ✅ `AppShell` · `LibrarySheet` · `ReviewPanel` · `Render3DModeSkeleton` |
| 4 | `widgets/` có 10 widget + `WidgetCard` + `types.ts` + `nav.ts` | ✅ đếm đúng 10 |

🔧 **Một bổ sung quan trọng phiếu chưa nêu (T cần biết):** tiền đề 1 chỉ kể **một** nhánh tự-nhảy.
Có **nhánh thứ hai** ngay dưới (`:326-344` bản cũ): `if (resume?.flowId || stageFlag) setStageDone(true)`
— nó bỏ qua dashboard vào thẳng canvas 3D. Và có **nhánh thứ ba** sớm hơn nữa: khối `useState`
khởi tạo `stageDone` (`:197-208` bản cũ) đọc `localStorage 'interiorflow.stageDone'` **đồng bộ ngay
lúc render đầu** — nghĩa là với người dùng quay lại, dashboard bị bỏ qua **trước khi**
`enterAfterAuth` kịp chạy. Chỉ cắt nhánh phiếu nêu thì Hoà mở app vẫn rơi thẳng vào canvas.
⇒ Đã cắt **cả ba**.

### V1 — `cuaVaoDashboard` ✅
| Đã gỡ | Ở đâu | Vì sao |
|---|---|---|
| đọc `localStorage 'interiorflow.stageDone'` khi khởi tạo `stageDone` | `HomeScreen.tsx` | nhánh "quay lại thì vào thẳng canvas" |
| `router.push(resume.route)` + khoá `sessionStorage 'interiorflow.sessionResumed'` | `enterAfterAuth` | nhánh phiếu nêu |
| `setStageDone(true)` + `openFlow(...)` theo `resume.flowId`/`stageFlag` | `enterAfterAuth` | nhánh thứ hai |
| 2 chỗ **ghi** `'interiorflow.stageDone'` | `onEnter` của DongStudioHome + WelcomeIntro | hết nơi đọc ⇒ không nuôi cờ chết |
| import `bootstrapWorkspace`, `openFlow` | đầu file | nơi gọi duy nhất vừa cắt |

**GIỮ LẠI có chủ ý:** `if (resume?.phase) setWorkspace(resume.phase)` — đây **không phải điều hướng**,
chỉ đảm bảo khi người dùng **tự bấm** vào canvas thì đứng đúng chặng cũ ([T5] con người quyết cuối).
`ResumeTracker` vẫn ghi resume nguyên vẹn — dữ liệu đó nay **nuôi widget**, xoá là mất thứ V2 cần.

#### 📏 BẢNG TRẠNG THÁI TRƯỚC → SAU (đủ 3 hạng người dùng)
| Hạng | Trước 16/08 | Sau | Đổi? |
|---|---|---|---|
| **① Lần đầu** (không resume, không cờ) | dashboard + WelcomeIntro | dashboard + WelcomeIntro | **KHÔNG ĐỔI** |
| **② Có việc dở — thoát ở route studio** (`/cad-editor`, `/present-editor`) | `router.push('/cad-editor')` → **rơi thẳng vào bản vẽ**, 1 lần/phiên trình duyệt | **dashboard**; việc dở nằm ở widget, bấm 1 cú về đúng bản vẽ đó | **ĐỔI** — đúng yêu cầu Hoà |
| **③ Có việc dở — thoát ở canvas `/`** (có `flowId`/`stageFlag`) | `setStageDone(true)` → **bỏ qua dashboard**, vào thẳng canvas 3D | **dashboard**; widget đưa về `/projects/<id>/render` | **ĐỔI** |
| (④ vào bằng URL `/projects/[id]/render`) | vào thẳng chặng đó | vào thẳng chặng đó | **KHÔNG ĐỔI** — URL là người dùng chủ động |
| (⑤ bấm "Home"/⌘0) | dashboard | dashboard | **KHÔNG ĐỔI** |

**Bug flash 21/07 không tái phát:** nó xảy ra vì Gallery là màn **trung gian** nháy qua trước cú
nhảy; nay dashboard **là đích**, không còn cú nhảy nào sau nó để nháy.

### V2 — `vietDangDo` ✅ (trừ khâu mount)
| Tệp | Vai |
|---|---|
| `components/home/widgets/resume-card.ts` | **lõi thuần** — `buildResumeCard` · `resumeHref` · `daysAgoLabel` |
| `components/home/widgets/resume-card.test.ts` | **29 test, 0 fail** |
| `components/home/widgets/ResumeWork.tsx` | widget theo đúng khuôn `WidgetCard` |

**Ba nấc** (chốt 16/08 "hai ngôn ngữ trình bày", không phải hai chiều cao):
| Nấc | Nói bằng | Đo được trên bản vẽ |
|---|---|---|
| **gọn** (mặc định) | ký hiệu + số — chip chặng, chip "2 ngày trước" | **2 chip** |
| **vừa** (trỏ vào) | **icon biến mất**, chữ thay chỗ | **0 chip** |
| **đầy đủ** | đoạn văn | **0 chip** |
Nấc gọn **đủ tự thân**: che hai nấc kia vẫn đọc ra dự án + chặng + thời điểm.

**Nguồn dữ liệu — không có trường nào bịa:**
| Trường | Nguồn | Khi thiếu |
|---|---|---|
| `stage` | `ResumeState.route` (ResumeTracker ghi) hoặc `.phase` | không suy được ⇒ **widget tự ẩn** |
| `daysAgo` | `ResumeState.ts` | `ts=0` (bản ghi cũ) ⇒ `null`, **bỏ hẳn dòng thời gian**, không hoá thành "hôm nay" |
| `projectName` | khớp id với `summary.recentProjects` | không khớp ⇒ "Dự án gần nhất", **không bịa tên** |
| ~~ảnh xem trước~~ | **KHÔNG CÓ NGUỒN** | không vẽ khung xám giả — xem §4 |

**Tự ẩn — chứng minh bằng test**, 4 ca đều trả `null`: chưa từng có resume · `undefined` ·
route `/` không kèm `phase` · route lạ đã gỡ khỏi app.
**≤2 cú bấm — chứng minh bằng test**, thực tế là **1**: `resumeHref()` ra đúng một đích
(`/projects/<id>/cad|render|present`), và ca không có id vẫn có đích (route cũ = cầu redirect).
Test canh riêng: *"mọi đường về đều khác rỗng — không có ca nào bấm mà không đi đâu"*.

### V3 — **DỪNG** theo chốt mới của Hoà (sidebar = hệ router toàn app)
Không dựng, không đụng `StageSwitcher`, **không đụng `AppChrome.tsx`** (nên không có gì phải hoàn
nguyên). Dữ kiện đã đo → §5.

### V4 — bản vẽ ✅ `docs/mocks/mock-widget-viec-dang-do.html`
`@dsCard group="Widget việc đang dở"` · 2 theme có nút gạt · token thật (`--nen-mo-*`, `--vien-mo`,
thang bo 6/10/14/20) · **0 hex ngoài khối khai token**.
Đo bằng DOM thật ở **1440×900**: **không tràn ngang ở cả hai theme**; nền tối `rgb(12,12,14)` ↔ sáng
`rgb(242,242,247)`; bày đủ 3 nấc + trạng thái **không có việc dở** (widget biến mất, ô lân cận giãn).

---

## 3 · TỔNG KẾT — rốt cuộc là gì

Yêu cầu của Hoà có **hai vế bắt buộc đi cùng nhau**: bỏ tự-nhảy (vế mất) và widget việc-đang-dở
(vế bù). Làm vế một mà thiếu vế hai thì đúng là **bước lùi** như phiếu cảnh báo. Phiên này làm trọn
cả hai về mặt **mã + kiểm chứng**, nhưng vế bù **chưa nhìn thấy được trên màn** vì thiếu đúng 3 dòng
mount nằm trong tệp phiên khác đang giữ.

⇒ Nếu merge nguyên trạng, người dùng quay lại sẽ **thấy dashboard nhưng KHÔNG thấy widget** — tức
đang ở đúng trạng thái "bước lùi" trong khoảng thời gian giữa hai lần merge. **Đây là rủi ro cần T
xử ngay**, không phải việc để dành.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Bắt được 2 nhánh tự-nhảy phiếu chưa biết; chỉ cắt 1 nhánh thì yêu cầu của Hoà **không thành hiện thực**.
- Không để lại cờ chết: 2 nơi đọc + 2 nơi ghi `interiorflow.stageDone` cắt cùng lúc.
- Logic quyết định hiện/ẩn và đường-về nằm ở tầng **thuần, có test** — không phải "nhìn app thấy chạy".

**Chưa được / rủi ro:**
- 🔴 **Widget chưa mount** (§5). Đây là khoảng hở thật, không phải chi tiết.
- 🔴 **`interiorflow.stageDone` còn 1 nơi GHI ngoài vùng phiếu**: `components/ProjectSelect.tsx:786`.
  Nay **0 nơi đọc** ⇒ cờ chết còn sót, cần T dọn 1 dòng.
- 🟡 **Phát hiện a11y ngoài phạm vi, đáng báo:** `WidgetCard.tsx` dùng `--t4` cho **tiêu đề widget**
  và `--t5` cho **số ô**. Đo tương phản trên `--card`:

  | Token | Theme tối | Theme sáng | Ngưỡng 4,5:1 |
  |---|---|---|---|
  | `--t3` | 6,53 | 5,23 | ✅ |
  | `--t4` | **3,44** | **3,26** | ❌ |
  | `--t5` | **1,98** | **2,21** | ❌ nặng |

  Đây là **tiêu đề của cả 10 widget Home**, không riêng widget mới. Bản vẽ + `ResumeWork.tsx` đã
  dùng `--t3`; **`WidgetCard.tsx` chưa sửa** — sửa nó là đổi diện mạo mọi widget, vượt phạm vi
  phiếu. Nối thẳng lỗ ❌ *a11y audit* đang mở ở `STATUS.md`.
- 🟡 **Chưa chạy app thật** — mọi kết luận về điều hướng là **đọc mã**, xem ⑦b.
- ⚪ `tsc` có **1 lỗi** ở `lib/wallpaper/sets.ts:225` — **của phiên hình nền**, xuất hiện giữa hai lần
  tôi chạy. Lọc theo vùng: **0 lỗi** ngoài vùng hình nền, **0 lỗi** trong tệp tôi sửa/tạo.

---

## 5 · HƯỚNG XỬ LÝ — nhiều góc độ

### 5a · Mount widget (phải chọn 1)
| Hướng | Cách | Ưu | Nhược |
|---|---|---|---|
| **A. T (hoặc phiên hình nền) dán 3 dòng** | patch dưới | đúng bento, đúng "khai theo ô lưới" | phải chờ tệp rảnh |
| **B. Mount nổi trong `HomeScreen`** | card `absolute` cạnh dashboard | làm được ngay trong vùng tôi | **vật thừa nổi**, trái luật ô lưới + trái chính đợt đang cắt vật thừa — **tôi đã từ chối** |
| **C. Chờ phiếu Home-bento tuỳ biến** | gộp vào đợt sau | không đụng ai | để hở "bước lùi" lâu nhất |

**Patch cho hướng A** — `components/home/DongStudioHome.tsx`, 3 chỗ:
```tsx
// ① đầu tệp
import ResumeWork from './widgets/ResumeWork';
import { loadResume } from '@/lib/resume';
import { buildResumeCard } from './widgets/resume-card';

// ② cạnh các cờ hasC/hasD/… (sau `const currentUserId`)
const [resume] = useState(() => (currentUserId ? loadResume(currentUserId) : null));
const hasResume = !!buildResumeCard(resume, { recentProjects: s.recentProjects });

// ③ thêm một ô vào lưới (cùng cách hasC/hasG), index "10"
{hasResume && (
  <div style={/* ô lưới, vd area([11,13],[1,2]) */}>
    <ResumeWork resume={resume} recentProjects={s.recentProjects} index="10" />
  </div>
)}
```
⚠️ `hasResume` phải vào `optionalLiveCount` để nấc bố cục mỏng/vừa/đầy đếm đúng.

### 5b · Cờ chết `interiorflow.stageDone`
Xoá `components/ProjectSelect.tsx:786` (1 dòng) · hoặc để lại và ghi 1 dòng vào sổ. **Nên xoá** —
cờ 0 người đọc là bẫy cho phiên sau tưởng nó còn điều khiển hành vi.

### 5c · A11y `WidgetCard`
Đổi `--t4`→`--t3` (tiêu đề) và `--t5`→`--t3` + `font-weight` nhẹ (số ô), **một tệp, 10 widget được
lợi** · hoặc gộp vào đợt a11y audit chung. Nên làm riêng vì rẻ và đang có số đo sẵn.

### 5d · 🎁 BÀN GIAO V3 — dữ kiện cho phiên dựng kịch bản sidebar
Đây là phần đã đo trước khi T bảo dừng, **đừng đo lại**:

1. **Dock `StageSwitcher` KHÔNG chỉ là điều hướng.** Nó còn là **nơi mount DUY NHẤT của panel chat
   Vitals** trong toàn app (`StageSwitcher.tsx:434`, Hoà chốt 05/08 "hai Vitals cùng lúc"), mang
   **cử chỉ kéo-xuống-hỏi-Vitals** (`:357-397`) và **phím ⌘J** (`:207`). ⇒ **Bỏ dock = mất Vitals**,
   không phải mất một nút. Bất kỳ kịch bản nào định thay dock đều phải nói trước Vitals dời đi đâu.
2. **Hai thứ hiện KHÔNG hề đứng cạnh nhau.** `AppChrome` (chứa dock) mount **duy nhất** ở
   `AppShell.tsx:139`, mà `AppShell` chỉ sống trong các chặng. Trên dashboard (`/`, `!stageDone`)
   **không có `AppChrome`, không có dock** — nhánh đó chỉ render `DongStudioHome` + `WelcomeIntro`
   + `Dashboard`. ⇒ Sidebar trên dashboard sẽ **không trùng** dock; chỉ trùng nếu ai đó cho sidebar
   chạy **cả trong chặng**. Đó mới là câu cần Hoà chọn.
3. **Hôm nay dashboard KHÔNG có đường nào vào 3 chặng** ngoài việc bấm vào một dự án. Nên sidebar
   không lấy chỗ của ai — nó lấp một chỗ đang trống.
4. **Hướng tôi định chọn (để vào bàn cân):** sidebar **là cửa vào TỪ dashboard**, dock **giữ vai đổi
   chặng KHI ĐÃ Ở TRONG chặng** — hai màn khác nhau, không nhân đôi; **không bỏ dock**. Nay chốt của
   Hoà nâng sidebar thành **router toàn app**, hướng này vẫn tương thích: 3 chặng chỉ là một nhóm
   mục trong router, dock thành **lối tắt trong-chặng** của đúng nhóm đó.
5. **`PanelFlank` dùng được ngay**, không cần dựng tay cầm mới: `side` · `storageKey` (tự nhớ
   localStorage, tiền tố `if.panelflank.`) · `label` (aria "Thu/Mở …") · `hotkey` 1 ký tự có
   input-guard sẵn. Có thêm `FlankStrip` (dải trình bày thuần) cho nơi **đã có state riêng** — đúng
   ca một router toàn app tự quản trạng thái.
6. **Cạm bẫy bố cục:** `DongStudioHome` tự đo `window.innerWidth >= 1100` để chọn nấc bento. Sidebar
   chiếm bề ngang thật nhưng `innerWidth` **không đổi** ⇒ ở gần 1100px lưới sẽ chọn nhầm nấc. Kịch
   bản nào cũng phải xử chỗ này (đo bề rộng **vùng chứa**, không đo cửa sổ).

---

## 6 · ĐỀ XUẤT — chọn 1

**Làm 5a hướng A ngay trong lượt tới, kèm 5b và 5c.**

Vì sao A chứ không B/C: hở "bước lùi" ở §3 là **rủi ro sản phẩm thật** — Hoà mở app sẽ thấy đúng cái
mất mà chưa thấy cái bù, và đó là ấn tượng đầu tiên về thay đổi này. B giải nhanh nhưng đẻ một vật
nổi ngoài lưới — đúng thứ đợt giao diện đang cắt, và sẽ phải gỡ lại ở phiếu Home-bento. C an toàn
nhất về va chạm tệp nhưng để hở lâu nhất, mà **giá của A chỉ là 3 dòng** trong một tệp phiên khác
đang mở — chi phí phối hợp thấp hơn nhiều so với giá của việc để hở.

Kèm 5b (1 dòng) và 5c (1 tệp) vì cả hai đã có **số đo sẵn trong báo cáo này**; để sang đợt khác thì
phải đi đo lại từ đầu.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM
- 🔴 **KHÔNG chạy app thật, không dev server** (phiếu cấm). Mọi kết luận về điều hướng là **ĐỌC MÃ**
  + `tsc` + test thuần + đo DOM **của bản vẽ** (không phải của app). Bảng trạng thái §V1 là **suy từ
  mã**, chưa ai bấm thử đủ 5 ca.
- 🟡 **Nhánh trong `HomeScreen` tôi không dám chắc đã hiểu trọn:** tương tác giữa `consumeForceGallery()`
  và `GO_HOME_EVENT` khi bấm "Home" **trong lúc đang ở `/`** (không remount). Tôi **không sửa** nhánh
  đó, nhưng chưa chứng minh được nó không đổi hành vi sau khi `stageDone` luôn khởi tạo `false`.
- 🟡 **Trường chưa có nguồn:** **ảnh xem trước** việc-đang-dở — `ResumeState` không mang thumbnail và
  tôi **không tìm thấy** đường nào lấy ảnh canvas hiện tại. Đã báo T thay vì tự chế.
- 🟡 **`projectName` có thể trượt:** `resume.flowId` là **Flow.id**, còn `recentProjects[].id` là
  **Project.id**. Trùng nhau chỉ khi flow **chưa gán dự án**. Ca flow **đã gán** dự án: tra tên sẽ
  **không khớp** ⇒ hiện "Dự án gần nhất". Không sai (không bịa) nhưng **kém hơn mức nên có** —
  chưa kiểm bằng dữ liệu thật vì không chạy app.
- 🟡 **`soi:tu-dien` ra 243, phiếu ghi nền 212.** Đếm theo tệp: **0 chỗ** đến từ tệp tôi tạo; phần
  tăng nằm ở phiếu `P-B/P-C/P-D/P-E/P-F` của các phiên song song. "Không tăng" **đúng với phần của
  tôi**, nhưng con số nền trong phiếu **đã cũ** — T nên chốt lại mốc.
- 🟢 **Quyết hay đoán:** quan hệ thanh-bên ↔ dock ở §5d.4 là **hướng tôi ĐỊNH chọn, chưa quyết** —
  T đã dừng V3 trước khi tôi chốt. Các dữ kiện 5d.1–5d.3, 5d.5–5d.6 là **đo được**, không phải đoán.

## ⑦c HẠN DÙNG KẾT LUẬN
Báo cáo này **hết đúng khi**:
- **Home bento tuỳ biến** thi công (widget đổi chỗ/đổi cỡ được) ⇒ patch mount §5a và cách khai ô lưới
  phải viết lại theo cơ chế mới; `optionalLiveCount`/nấc mỏng-vừa-đầy có thể không còn.
- **`hotkey-registry` B2** nối xong ⇒ nếu widget/router nhận phím tắt thì phải đọc từ sổ lệnh chung,
  không tự khai.
- **Bản tablet/điện thoại** bắt đầu làm ⇒ nhánh `stackedList` và giả định "1 cú bấm" (chuột) phải
  kiểm lại bằng cử chỉ chạm.
- **Sidebar router toàn app** chốt kịch bản ⇒ §5d thành dữ kiện lịch sử, và ca "dashboard không có
  đường vào 3 chặng" (5d.3) hết đúng.
- **`ResumeState` được thêm ảnh xem trước** ⇒ mục "không có nguồn" ở ⑦b hết đúng.
