# CHẨN ĐOÁN "chỉ chặng Present hiện ở local" — 07/08
Đo bằng **mở app thật, nhìn tận mắt** trên máy Hoà + truy vấn DB. Không phải suy đoán.

---

# ✅ KẾT LUẬN CUỐI (sau khi nhìn màn hình thật, 11:41)

## Ba chặng CHẠY BÌNH THƯỜNG. Không có gì hỏng về điều hướng.

| Kiểm | Bằng chứng |
|---|---|
| `/projects/<id>/cad` | ✅ **nhìn tận mắt** — có bản vẽ, 5 lớp (Tường·Nội thất·Kích thước·Ghi chú·Trục), thanh công cụ đầy đủ, thanh trạng thái báo "Đã lưu lúc 11:39 · Đĩa đồng bộ" |
| `/projects/<id>/render` | ✅ tải xong — tiêu đề tab đổi thành "InteriorFlow", URL giữ nguyên `/render` (KHÔNG bị đá về) |
| Thanh 3 chặng | ✅ có mặt: **Thiết kế 2D · Sơ phác** (đậm) · Thiết kế 3D (mờ) · Trình chiếu (mờ) |
| Nút chặng có bị khoá không | ❌ **KHÔNG** — `StageSwitcher.tsx:264-280` không có `disabled`, không `pointerEvents:'none'`. Chỉ đổi màu: `color: on ? 'var(--t1)' : 'var(--t4)'` |

## 🔴 NHƯNG — nút TRÔNG NHƯ BỊ KHOÁ. Đây mới là lỗi thật.

`StageSwitcher.tsx:280` dùng `--t4` cho chặng không được chọn. Đo tương phản trên nền panel:

| | màu | tương phản | luật G2 cần ≥4,5:1 |
|---|---|---|---|
| chặng ĐANG mở (`--t1`) | `#211e19` | **14,22:1** | ✅ |
| chặng khác — chế độ sáng (`--t4`) | `#9a938a` | **2,60:1** | 🔴 **trượt xa** |
| chặng khác — chế độ tối (`--t4`) | `#6e6e78` | **4,32:1** | 🔴 trượt sát |

⇒ Người dùng nhìn hai chặng kia **mờ như bị vô hiệu hoá**, nên **không bấm**.
Không phải app khoá — là **giao diện nói dối**. Vi phạm `G2`. ⇒ dòng sổ `G-M15-01`.

## Chuyện dev server tự chết
Lúc 11:35 cổng 3000 trả `ERR_CONNECTION_REFUSED`; 20 phút trước đó nó còn sống.
Hoà bật lại bằng `npm run dev` → `✓ Ready in 3.8s`, chạy lại bình thường.
⇒ Chưa rõ vì sao tự chết. Nếu tái diễn thì mở dòng sổ riêng — hiện CHƯA VERIFY.

## Ba lần suýt kết luận sai trong lần chẩn đoán này (§0y)
1. Tưởng cổng 3001 — thật ra **3000**.
2. Tưởng `/render` bị đá về `/cad` — thật ra **ảnh chụp là tab khác**, tab tôi điều khiển vẫn ở `/render`.
3. Tưởng "Đang mở nơi khác" là khoá phiên — `StatusBar.tsx:350` ghi rõ *"CHỈ cảnh báo, không khoá/gộp"*.

---

---

## 🔴 NGUYÊN NHÂN GỐC: **41/41 flow đều MỒ CÔI — không flow nào gắn dự án**

```sql
select count(*) from Flow where projectId is null;   →  41 / 41
```

Và ngược lại — **không dự án nào có flow**:
| Project | số flow |
|---|---|
| Dự án verify inline input | **0** |
| Enter test 2 | **0** |
| `__nb:untitled-flow` | **0** |
| Test B3 (phục hồi backup) | **0** |
| `__nb:nonexistent-project` | **0** |
| `__nb:cmrqo009h0003w9ddwcuxaki6` | **0** |
| `__nb:cms915kza0001w9a613z8tp65` | **0** |

⇒ Hai bảng **rời hẳn nhau**. Không một cặp Project↔Flow nào nối được.
(4/7 project tên tiền tố `__nb:` — notebook tự sinh, không phải dự án người dùng tạo.)

## Chuỗi hệ quả — khớp đúng code đã grep

App tự mở vào: `localhost:3000/projects/cms915kza0001w9a613z8tp65/render`

`cms915kza0001w9a613z8tp65` **KHÔNG phải projectId** — tra DB ra:
```
Project → không có
Flow    → ('cms915kza0001w9a613z8tp65', 'Untitled flow', projectId=None)
```
Đó là **flowId của một flow mồ côi**, đứng ở vị trí `<id>` trong `/projects/<id>/<stage>`.

Chính `lib/project-scope.ts:73-74` đã lường trước ca này:
> *"Flow chưa gán Project mà URL mang chính flowId → `currentProjectId=null`"*

⇒ **Chặng Render chạy được** vì nó làm việc trên **flow** (canvas node) — không cần Project.
⇒ **Chặng CAD / Present không có gì để hiện** vì chúng cần dữ liệu **thuộc Project**.

**Không phải lỗi điều hướng. Là dữ liệu đứt ở tầng dưới.**

---

## ✅ Đã loại trừ — về CODE ba chặng nối ĐỦ
```
StageSwitcher.tsx:268 → AppChrome.tsx:222 → stage-nav.ts:37
                      → project-scope.ts:52 → scope-core.ts:69  = /projects/<id>/<stage>
```
| Kiểm | |
|---|---|
| 4 trang chặng tồn tại | ✅ `app/projects/[id]/{cad,render,present,photo}` |
| 3 màn bọc `AppShell` (chứa thanh chặng) | ✅ Present 4 · Cad 4 · Home 7 |
| Đường dự phòng khi thiếu projectId | ✅ `LegacyStageRedirect` → `/?notice=choose-project` |
| `npx next build` | ✅ xanh (07/08) |
⇒ **ĐỪNG soạn phiếu "nối 3 chặng". Không có gì để nối.**

---

## ⚠️ Hai điều CHƯA VERIFY — nói thẳng
1. **Không chụp được màn hình.** Extension Chrome lỗi `Script injection timed out` trên MỌI trang,
   kể cả `example.com` ⇒ hỏng ở extension, **không phải ở app**. Nên chưa xác nhận được bằng mắt
   màn CAD/Present hiện gì (trắng? có thông báo? có thanh chặng?).
2. **Dev server chạy cổng 3000**, không phải 3001 như quy ước trong bộ nhớ. Cổng 3001 không có gì.

---

## PHIẾU SỬA — có triệu chứng thật rồi, không vá mù (N3 ✅)

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU: lib/workspace.ts · lib/project-scope.ts · lib/scope-core.ts · app/api/flows/ · prisma/
CẤM chạm: components/cad · components/library · lib/boq lib/ffe

TRIỆU CHỨNG ĐO ĐƯỢC 07/08 (kiểm lại bằng lệnh dưới trước khi sửa):
  sqlite3 prisma/dev.db "select count(*) from Flow where projectId is null"   → 41/41
  sqlite3 prisma/dev.db "select id,name from Project"                          → 7, 4 cái tiền tố __nb:
  URL app tự mở: /projects/<flowId>/render  ← flowId đứng chỗ projectId

VIỆC 1 — VÌ SAO flow không gắn được Project (tìm gốc, đừng vá triệu chứng)
  Truy đường tạo flow: app/api/flows/route.ts + lib/workspace.ts openFlow/createFlow.
  Câu hỏi phải trả lời bằng file:dòng: chỗ nào ĐÁNG LẼ gán projectId mà không gán?
  Là quên gán, hay là luồng tạo dự án chưa từng chạy?
  ⛔ ĐỪNG viết script gán bừa projectId cho 41 flow cũ trước khi biết gốc.

VIỆC 2 — MÀN TRỐNG PHẢI CÓ LỜI, KHÔNG ĐƯỢC TRẮNG TRƠN
  Khi vào chặng CAD/Present mà scope không có Project: hiện trạng thái trống có hướng dẫn —
  nói rõ "dự án này chưa có bản vẽ" + nút "Tạo bản vẽ mới" / "Nhập bản vẽ có sẵn".
  Đây là lỗi trải nghiệm nặng hơn cả lỗi dữ liệu: người dùng không biết mình đang thiếu gì.
  Nghiệm thu N6: mở /projects/<flowId>/cad trên trình duyệt thật, chụp màn.

VIỆC 3 — CHẶN Ở GỐC
  `/projects/<id>/<stage>` nhận cả flowId lẫn projectId (thiết kế cố ý, project-scope.ts:73).
  Nhưng phải PHÂN BIỆT ĐƯỢC và nói ra: id là flow mồ côi ⇒ báo người dùng, đừng im lặng
  render màn rỗng.

VIỆC 4 — DỌN DB DEV (làm CUỐI, sau khi việc 1 xong)
  4/7 Project là rác `__nb:` tự sinh. Không xoá vội — viết script LIỆT KÊ trước, Hoà duyệt rồi xoá.
  Luật KS4: lùi được.

BÁO CÁO: docs/M-SCOPE-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
```

## Việc cho Hoà — 20 giây, xác nhận triệu chứng bằng mắt
Mở `http://localhost:3000/projects/cms915kza0001w9a613z8tp65/cad`
→ nói tôi biết: **trắng trơn?** hay **có thông báo gì?** hay **có thanh 3 chặng trên cùng?**
Tôi không chụp được vì extension hỏng.
