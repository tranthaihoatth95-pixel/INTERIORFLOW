# 00 · SỰ THẬT & BỘ PHIẾU DỨT ĐIỂM — 07/08/2026
Hoà yêu cầu: *"soạn tuần tự tất cả những điều bấy lâu nay bị giấu, những điều mới phát hiện,
phơi bày sự thật và prompt tất cả cho tôi… làm 1 lần kết thúc luôn"*.

**File này thay mọi bảng lệnh rải rác.** Đọc PHẦN A → C, dán theo PHẦN D.

---
---

# PHẦN A · SỰ THẬT — chín điều đáng lẽ phải nói sớm hơn

## A1 · 🔴 Con số "68% GAP đỏ" KHÔNG đáng tin — và tôi đã dùng nó suốt
Sổ `GAP-IF.md` phân bố cực lệch. Đo 07/08:
| Mảng | dòng code | dòng sổ | tỷ lệ |
|---|---|---|---|
| `present-editor` (lib+components) | **23.021** | **1** | 23.021 : 1 |
| `render-studio` + `three` | 9.355 | 2 | 4.678 : 1 |
| `nodes` (lib+components) | 6.553 | 2 | 3.277 : 1 |
| `cad` (lib+components) | 35.255 | 43 | 820 : 1 |

⇒ **Sổ đang đo mức độ CHÚ Ý, không đo mức độ HỎNG.** Mảng nào bị soi kỹ thì sổ dày; mảng nào
chưa ai mở thì sổ trống — rồi im lặng bị đọc thành "lành".
Mọi kế hoạch trước 07/08 đều dựa trên bản đồ thiếu.

## A2 · 🔴 `components/` che phủ test = **0%** — trong khi báo cáo khoe "3.016 test xanh"
| | dòng nguồn | dòng test | che phủ |
|---|---|---|---|
| `lib/` — động cơ | 70.158 | 30.720 | **43%** |
| `components/` — vỏ | **71.004** | **170** | **0%** |
| `app/` — trang | 6.845 | 0 | **0%** |

Hai nửa gần bằng nhau về khối lượng. Một bên 43%, một bên không.
**16 mảng có 0 test = 48.589 dòng nguồn**, gần trọn là `components/`.
⇒ "3.016 phép kiểm xanh" chỉ nói về ĐỘNG CƠ. Lớp người dùng chạm vào **chưa có lưới an toàn nào**.
⇒ `G-M12-01`

## A3 · 🔴 **41/41 flow MỒ CÔI** — dữ liệu đứt ở tầng dưới
```sql
select count(*) from Flow where projectId is null   →   41/41
```
Và ngược lại: **cả 7 Project đều 0 flow**. Hai bảng rời hẳn nhau.
4/7 project tên tiền tố `__nb:` = notebook tự sinh, không phải dự án người dùng tạo.
App tự mở `/projects/cms915kza0001w9a613z8tp65/render` — id đó là **flowId mồ côi**, không phải projectId.
⇒ `G-M14-01` · **việc số một**

## A4 · 🔴 HAI BỘ "3 CHẶNG" khác nhau, cùng một chữ — bẫy từ vựng nặng nhất
| Nguồn | "3 chặng" nghĩa là |
|---|---|
| `IF1_IF2_BIGPICTURE.md:41-48` (20/07) | ① CAD kỹ thuật ② BIM/IFC ③ **Viewer 3D** |
| Chốt Hoà 07/08 | ① Thiết kế 2D ② Thiết kế 3D ③ **Trình chiếu** |
Phiên nào đọc BIGPICTURE trước sẽ hiểu "chặng 3" = Viewer 3D rồi code sai chỗ mà vẫn tin đúng sổ.
⇒ `G-M15-03`

## A5 · 🔴 Mảng 3D bị bỏ ngoài mọi kế hoạch — Hoà bắt được, không phải tôi
12.737 dòng code · **2 dòng sổ** · **0 test** ở lớp giao diện · **0 lần** xuất hiện trong bảng lệnh đợt 2.
Chạy lệnh đối chiếu mới lộ ra: **không phải 1 mảng bị quên mà 14**, tổng ~24.600 dòng.
⇒ `§0x` · phiếu `Đ2-5` · `Đ2-6`

## A6 · 🔴 Tôi báo sai **bốn lần** trong một ngày — cùng một kiểu
| # | Việc | Chỉ báo sai | Suýt báo |
|---|---|---|---|
| 1 | Soi mock 3 màn | regex `1\.[0-4][0-9]?\|1` bắt trúng số 1 trong `1.5` | "146 chỗ vi phạm line-height" — thật ra ĐẠT |
| 2 | Truy mock 4 ảnh Hoà gửi | `grep -c` đếm **dòng**, không đếm **chức năng** | khẳng định nhầm file |
| 3 | Soi 16 mảng | regex không bắt `export default function` | "30 file chết · 6.573 dòng" — thật ra **0** |
| 4 | Chẩn đoán 3 chặng | ảnh chụp là **tab khác** tab tôi điều khiển | "`/render` bị đá về `/cad`" — thật ra không |
**Gốc chung:** viết một câu lệnh tìm, thấy con số, **báo luôn** — không lấy vài mẫu kiểm tay.
⇒ `§0y`. Lần 3 và 4 tôi tự bắt được trước khi báo; lần 1 và 2 thì không.

## A7 · 🟠 `next build` **chưa từng chạy** cho tới chiều 07/08
Nghĩa là mọi việc trước đó xây trên nền **chưa ai biết có đứng không**.
Hoà chạy lúc 11:0x → ✅ xanh, 84 route · 46 trang tĩnh · 0 lỗi. Nền đứng được.
Nhưng nó cũng lộ 2 mục mới: `G-M11-01` (cảnh báo `jose` Edge Runtime) · `G-M11-02` (8 trang nặng).

## A8 · 🟠 Rủi ro pháp lý chưa quyết — có thể buộc viết lại mảng lớn nhất repo
`libredwg-web` là **GPL-3.0**. `docs/LICENSE-NOTES.md` miễn trừ dựa trên *"tool nội bộ, không bán"*
— lập luận này **chết** với định vị global. Nếu phải đổi thư viện đọc DWG thì kéo theo
`lib/cad` = **36.296 dòng**, mảng lớn nhất repo. Quyết muộn thì đắt gấp nhiều lần.

## A9 · 🟠 Tên khách thật vẫn hiện lên giao diện
```
lib/filemanager/mock-data.ts:50    name: '2026-06 Detech Complex'
lib/filemanager/mock-data.ts:216   name: 'Detech-brief-khach.pdf'
```
Không phải comment — chuỗi hiển thị, đường ra: `queries.ts:3` → `StorageCard.tsx:10`.
Cộng `content-deck.ts:113` in `DETECH · CONCEPT` lên **mọi deck user sinh**.
⇒ `G-M13-02` · `AUDIT-BRAND-PII.md`

---
---

# PHẦN B · HIỆN TRẠNG THẬT, bằng số

| | |
|---|---|
| File `.ts`/`.tsx` | 888 · **178.897 dòng** |
| `npm test` | 96 khối · **3.016 phép kiểm · 0 FAIL** |
| `npx next build` | ✅ **XANH** (máy thật, 07/08) — 84 route · 46 trang tĩnh |
| `tsc --noEmit` | 1 lỗi cũ (`render-layer-index.test.ts:36`, từ `752fb54`) |
| Component mồ côi | **2/220 = 0,9%** |
| File chết hoàn toàn | **0 / ~400 file soi** |
| Sổ GAP | **99 dòng · 69 đỏ** · 13 xong · 11 vàng · 6 cam · 3 hoãn |

**Chẩn đoán một câu: IF mạnh phần ĐỘNG CƠ, yếu phần NỐI DÂY và thiếu MỘT model dữ liệu.**
Không có code chết — 48.589 dòng chưa test đều có đường sống. Đó là tin tốt lớn nhất hôm nay.

---
---

# PHẦN C · BỘ PHIẾU — dán theo đúng thứ tự

> Mỗi khối trong hộp mã là **một lần dán, một cửa sổ**. Không cắt nhỏ.
> Tất cả phiếu đều mở đầu bằng: đọc `docs/00-BAT-DAU-DOC-DAY.md`, tuân N1–N8, **V6 = KHÔNG commit**.

---

## 🟩 P0 · GIAO DIỆN — dán NGAY, không chờ limit, không đụng ai
Bốn lỗi nhãn/màu Hoà chốt hôm nay. Rẻ nhất, thấy được ngay bằng mắt.

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU: components/studio/StageSwitcher.tsx · lib/phases.ts · lib/cad/store.ts (CHỈ comment)
        + 14 chuỗi nhãn liệt kê ở việc 4.
CẤM chạm: mọi logic. Đây là phiếu SỬA CHỮ VÀ MÀU, không sửa hành vi.

ĐỌC TRƯỚC: docs/00-CHOT.md mục "[07/08 Hoà chốt] ĐỊNH NGHĨA BA CHẶNG". Đó là chốt của
chủ dự án, KHÔNG tự diễn giải lại.

VIỆC 1 — G-M15-01 · nút chặng TRÔNG NHƯ BỊ KHOÁ
  StageSwitcher.tsx:280 dùng `color: on ? 'var(--t1)' : 'var(--t4)'`.
  Đo tương phản trên nền panel: --t4 sáng #9a938a = 2,60:1 · tối #6e6e78 = 4,32:1.
  Luật G2 cần ≥4,5:1 ⇒ CẢ HAI TRƯỢT. Người dùng tưởng bị vô hiệu hoá nên không bấm.
  Nút KHÔNG hề bị khoá (:264-280 không có disabled/pointerEvents:none).
  SỬA: đổi sang --t3 (hoặc đậm hơn) cho tab không active; giữ --t1 cho tab đang mở.
  Nghiệm thu: tính lại tương phản CẢ HAI chế độ sáng/tối, dán con số vào M-OUT. Phải ≥4,5:1.

VIỆC 2 — G-M15-02 · nút chặng GỘP tên CHẶNG với tên MODE
  Nay hiển thị "Thiết kế 2D · Sơ phác". Sai cấu trúc: "Thiết kế 2D" là CHẶNG,
  "Sơ phác/Chuyên" là MODE BÊN TRONG chặng đó (mode đã có dải riêng ở thanh công cụ dưới:
  Sơ phác · Kỹ thuật · Nội thất).
  SỬA: nút chặng CHỈ ghi "Thiết kế 2D". Xem lib/phases.ts:143 `'Thiết kế 2D · Kỹ thuật'`.
  Tên chuẩn 3 chặng (song ngữ, ID GIỮ NGUYÊN):
    concept → "Thiết kế 2D" / "2D Design"
    render  → "Thiết kế 3D" / "3D Design"
    present → "Trình chiếu"  / "Presenting"

VIỆC 3 — G-M15-05 · comment sai chữ
  lib/cad/store.ts:156 gọi lựa chọn mode thủ công là "override thủ công (backward-compat)".
  Hoà chốt 07/08: người dùng TỰ BẤM CHỌN mode — đây là ĐƯỜNG CHÍNH, không phải override.
  Áp cho CẢ Thiết kế 2D (Sơ phác·Chuyên) LẪN Thiết kế 3D (Dựng khối·Render).
  SỬA COMMENT cho khớp. LOGIC KHÔNG ĐỔI — :156 đã đặt trước hai dòng role nên thủ công đã thắng.

VIỆC 4 — G-M15-06 · bỏ chữ "CAD" khỏi nhãn người dùng
  Hoà chốt: "có cad là sai thôi". Nhãn phải là "Thiết kế 2D".
  ⚠️ CHỈ ĐỔI NHÃN. TUYỆT ĐỐI KHÔNG đổi tên code: lib/cad/ · components/cad/ · useCadStore ·
     CadMode · route /projects/[id]/cad · khoá localStorage — đổi là VỠ route + localStorage + DB.
  ⚖️ PHÂN LOẠI TỪNG DÒNG, CẤM thay thế hàng loạt:
     · nói về CHẶNG LÀM VIỆC  ⇒ ĐỔI thành "Thiết kế 2D"
     · nói về ĐỊNH DẠNG TỆP (DWG/DXF) ⇒ GIỮ "CAD", vì đó đúng nghĩa
  14 chỗ đã grep:
     lib/phases.ts:37 · components/present-editor/PresentEditor.tsx:337
     components/render-studio/ModeSwitchCell.tsx:33 · components/LibraryPanel.tsx:25
     lib/library/types.ts:86 · lib/refingest.ts:45 · lib/library/shelves.ts:155
     app/library/ingest/page.tsx:16,291 · components/settings/GuModelSettings.tsx:130,131
     lib/nodes/registry.ts:210 · lib/nodes/defs/render-v2.ts:292
  Mỗi dòng ghi rõ trong M-OUT: ĐỔI hay GIỮ, và VÌ SAO.

VIỆC 5 — rà 3 tagline trong lib/phases.ts theo chốt 07/08
  :36 (concept) thiếu "Revit 2D" + khái niệm 2 mode
  :51 (render)  thiếu "Revit 3D" + "dựng khối"
  :88 (present) ✅ đã khớp, đừng đụng

BÁO CÁO: docs/M-UI-NHAN-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
Nghiệm thu N6: chụp màn thanh chặng SAU khi sửa, dán vào báo cáo.
```

---

## 🟥 P1 · TẦNG DỮ LIỆU — việc số một, chặn cả mảng SyncWork
⟨cửa sổ `1·fix-gocc`⟩ · **41/41 flow mồ côi**

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: prisma/ · lib/lark/ · lib/integrations/ · lib/workspace.ts ·
                 lib/project-scope.ts · lib/scope-core.ts · app/api/flows/ · app/api/lark-tasks/
CẤM chạm: components/ (trừ việc 5) · lib/boq · lib/ffe · lib/cad · lib/three
⚠️ ĐÂY LÀ PHIẾU DUY NHẤT ĐƯỢC ĐỤNG prisma/schema.prisma.

🚫 ArchiNote NGOÀI PHẠM VI (Hoà chốt 07/08). Chưa có dòng code nào. ĐỪNG thiết kế trước cho nó,
   đừng thêm field "để dành". Cửa đã chừa MIỄN PHÍ: ExternalRef.system là chuỗi tự do.

TRIỆU CHỨNG ĐO ĐƯỢC 07/08 — kiểm lại trước khi sửa:
  sqlite3 prisma/dev.db "select count(*) from Flow where projectId is null"  → 41/41
  sqlite3 prisma/dev.db "select id,name from Project"                        → 7, trong đó 4 tiền tố __nb:
  App tự mở /projects/<flowId>/render — flowId đứng chỗ projectId.

VIỆC 1 — VÌ SAO flow không gắn được Project (TÌM GỐC, đừng vá triệu chứng)
  Truy app/api/flows/route.ts + lib/workspace.ts (openFlow/createFlow).
  Trả lời bằng file:dòng: chỗ nào ĐÁNG LẼ gán projectId mà không gán? Quên gán, hay luồng
  tạo dự án chưa từng chạy?
  ⛔ ĐỪNG viết script gán bừa projectId cho 41 flow cũ trước khi biết gốc — vá thế là giấu mất
     nguyên nhân, hỏng lại ngay hôm sau.

VIỆC 2 — dựng `model Task` nội bộ (G-M10-01)
  Thêm: id (cuid do IF sinh) · projectId · title · statusId · assigneeIds · startAt · dueAt
        · order · createdAt · updatedAt
  ⚠️ status KHÔNG phải String tự do. Dựng `model WorkflowState { id · projectId · name · order ·
     isActive · isDone }`, Task trỏ statusId. Lý do: String tự do thì phiên này gõ "Đang làm",
     phiên sau gõ "đang làm", Kanban VỠ CỘT. Bỏ dùng thì tắt isActive, KHÔNG xoá (giữ lịch sử, KS4).
     Vẫn trung tính: mỗi dự án tự khai bộ trạng thái riêng, app không áp đặt.
  ⚠️ ĐỪNG neo Task vào Project.currentStage (:79) hay lib/phases.ts — ba chặng
     concept/render/present là PIPELINE của IF, KHÔNG phải giai đoạn hợp đồng ngành
     (Ý tưởng → Cơ sở → Kỹ thuật → Thi công → Giám sát). Trùng tên là bẫy.
  CRUD: lib/server/tasks.ts + app/api/tasks/route.ts.
  Nghiệm thu N6: chạy thật tạo→đổi status→đọc lại, DÁN OUTPUT.

VIỆC 3 — chuyển 3 model Lark* sang ExternalRef (G-M9-01)
  model ExternalRef ĐÃ CÓ (schema.prisma:482) + lib/integrations/external-ref{,-core}.ts có test.
  Trình tự: ① lớp đọc mới qua ExternalRef ② chuyển 4 file gọi LarkTaskRef sang lớp mới
            ③ script chép dữ liệu cũ sang ④ đánh dấu DEPRECATED
  ⚠️ GIỮ LarkTaskRef làm CACHE, ĐỪNG thay thế. Nó có `raw` + `syncedAt`, không có updatedAt
     người dùng sinh ⇒ vai trò bản chụp hệ ngoài. Xoá là mất đường đối chiếu khi sync lệch.
  CHƯA xoá model nào ở đợt này (KS4 lùi được).

VIỆC 4 — adapter Lark ghi NGƯỢC + CHỐNG VÒNG LẶP ĐỒNG BỘ
  lib/integrations/providers/lark.ts hiện chỉ đọc. Thêm đường ghi qua ExternalRef.
  ⚠️ BẮT BUỘC chống vòng lặp — lỗi số một của mọi cầu nối hai chiều: IF đẩy sang Lark → Lark
     báo "có thay đổi" → IF nhận lại → tưởng mới → đẩy tiếp → LẶP VÔ TẬN, đốt sạch hạn ngạch API.
     Chặn: thêm `lastWriteBy` ('idf' | '<mã hệ ngoài>') + `lastWriteAt` vào ExternalRef.
     Nhận thay đổi từ ngoài: nếu lastWriteBy='idf' và cách lastWriteAt < 60 giây ⇒ BỎ QUA.
  Nghiệm thu: đổi status 1 việc, đếm số lần gọi API Lark trong 5 phút sau. Phải là 1, không phải n.
  Hai bên cùng sửa ⇒ chọn theo lastWriteAt mới hơn, GHI LOG bản bị thua (KS5 nói được vì sao).
  API Lark không cho ghi ⇒ KHÔNG bịa, ghi rõ là chặn ngoài tầm.

VIỆC 5 — G-M14-02 · màn chặng không dữ liệu phải CÓ LỜI, không được trắng trơn
  (ngoại lệ được chạm components/) Vào chặng mà scope không có Project ⇒ hiện trạng thái trống
  có hướng dẫn: "dự án này chưa có bản vẽ" + nút "Tạo bản vẽ mới" / "Nhập bản vẽ có sẵn".
  /projects/<id>/<stage> nhận CẢ flowId lẫn projectId (cố ý, project-scope.ts:73) — nhưng phải
  PHÂN BIỆT ĐƯỢC và NÓI RA, đừng im lặng render màn rỗng.
  Nghiệm thu N6: mở /projects/<flowId>/cad trên trình duyệt thật, CHỤP MÀN.

VIỆC 6 — nối Kanban ghi được
  components/dashboard/LarkPanels.tsx: kéo-thả gọi API Task nội bộ. Sửa luôn dòng :8 tự khai sai
  ("kéo-thả kanban KHÔNG đổi trạng thái").
  Nghiệm thu N6: kéo thẻ sang cột khác, TẢI LẠI TRANG, thẻ Ở LẠI cột mới.

VIỆC 7 — dọn DB dev (làm CUỐI)
  4/7 Project là rác `__nb:`. KHÔNG xoá vội — viết script LIỆT KÊ trước, Hoà duyệt rồi mới xoá (KS4).

BÁO CÁO: docs/M-SCOPE-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## 🟦 P2 · SOI 16 MẢNG CÒN LẠI — chỉ ĐỌC, thả lúc nào cũng được
Không sở hữu thư mục nào ⇒ **0 nguy cơ chồng phiếu khác**. Gỡ ẩn số lớn nhất còn lại.

```
Bạn là phiên KIỂM TRA (không phải phiên sửa). Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6.
⛔ TUYỆT ĐỐI KHÔNG SỬA MỘT DÒNG CODE NÀO. Chỉ đọc và ghi báo cáo.
   Thấy lỗi rõ ràng cũng ĐỪNG sửa — ghi vào sổ, đợt sau sửa. Sửa lúc này là đụng thư mục của
   các phiếu đang chạy song song (§0w).

BỐI CẢNH: 16 mảng này (~48.589 dòng) có 0 test và gần như 0 dòng sổ. Đã xác nhận 07/08:
KHÔNG có file chết (0/~400 file) — đều có đường sống. Nhiệm vụ là LẬP SỔ, không phải dọn rác.

THỨ TỰ (làm từ trên xuống, hết giờ thì DỪNG và ghi rõ dừng ở đâu):
  ① present-editor (lib+components)  23.021 dòng · 1 dòng sổ   ← NẶNG NHẤT
  ② nodes (lib+components)            6.553 · 2   ← canvas, lõi sản phẩm
  ③ components/studio                 5.639 · 1
  ④ lib/vision                        1.985 · 3
  ⑤ photo-editor (lib+components)     3.214 · 0
  ⑥ components/entry                  2.322 · 0
  ⑦ notebook · print · lib/colors · components/colors
  ⑧ lib/legal · intro · filemanager · lib/commands

MỖI MẢNG soi đúng 5 câu, không lan man:
  1. Hàm/component export nào 0 nơi gọi từ ngoài mảng?
     ⚠️ regex PHẢI bắt: `export default function` · `export {a as b}` · barrel index.ts ·
        dynamic import() · JSX <Tên/> · đường dẫn @/… trỏ THƯ MỤC (không phải /index).
        (Bài học §0y: bỏ sót `export default` từng cho ra "30 file chết", thật ra 0.)
  2. Component nào 0 nơi mount? (N6)
  3. Thao tác >1 giây (xuất file, gọi AI, tải ảnh, render) nào KHÔNG có trạng thái chờ hoặc
     KHÔNG báo lỗi? — người dùng bấm rồi ngồi nhìn màn hình im lặng.
  4. Tên khách / brand studio hardcode? (tìm TTT · DETECH · Amanoi · IKI · Sungroup · mật khẩu
     trong comment). ⚠️ PHÂN BIỆT comment với chuỗi hiển thị — comment KHÔNG phải vi phạm.
  5. docs/mocks/ có mock nào ứng với mảng này mà chưa port?

QUY TẮC: mỗi phát hiện PHẢI có `file:dòng` (N8). Không có ⇒ không được ghi.
Không chắc ⇒ ghi "nghi, chưa xác minh" + cách xác minh. Cấm suy đoán (N1).
⛔ KHÔNG tự ghi vào docs/GAP-IF.md — §0u, một ngòi bút, chỉ TỔNG ghi sổ đó.

BÁO CÁO: docs/M-SOI-16-MANG-OUT.md (đã có phần đầu, GHI THÊM vào), mục "ĐỀ XUẤT DÒNG GAP MỚI"
chia theo mảng. Đầu báo cáo ghi: soi được mấy mảng / 16, dừng ở đâu, vì sao.
```

---

## 🟨 P3 · MẢNG 3D — cần mock trước
**BƯỚC 0 dán vào Claude Design NGAY** (mock đang nằm trong cửa sổ Design, đóng là mất):

```
Xuất toàn bộ màn 3D bạn vừa vẽ (màn có "Dựng ảnh AI", "Khối tường", "Góc nhìn trục giao",
dock công cụ mở rộng) thành file .dc.html hoàn chỉnh, tự chứa, mở được bằng trình duyệt.

Tên file: 3D Dựng khối.dc.html

Đủ 4 trạng thái đúng như đã vẽ:
  ① chọn một khối tường — gizmo trục + tấm thông số bên phải
  ② kéo mặt lên — nhãn số sống "2 700" bám con trỏ
  ③ dock công cụ mở rộng — CHỌN · VẼ · DỰNG KHỐI + BIẾN ĐỔI · ĐO ĐẠC
  ④ không chọn gì — tấm phải rỗng, có dòng gợi ý

Ràng buộc:
- KHÔNG dc-import trỏ file ngoài — mọi thứ trong 1 file
- Xoá hết chữ PLACEHOLDER
- Màu dùng var(--…), không hardcode hex
- line-height ≥ 1,5 (dấu tiếng Việt bị cắt nếu thấp hơn)
- backdrop-filter TỐI ĐA 4 chỗ (bản cũ "2D Kỹ thuật" có 12 — quá luật G9)
- nút quyết định phải có CHỮ, không chỉ icon
- KHÔNG dùng chữ "CAD" trong nhãn — chặng này tên là "Thiết kế 3D"

Xuất xong đưa tôi nội dung file để lưu vào docs/mocks/.
```

**Có mock rồi mới dán phiếu code** ⟨cửa sổ mới `5·ba-chieu`⟩:

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU: lib/three/ · components/three/ · lib/render-core/ · lib/render-studio/ ·
        components/render-studio/ · app/dev-bench-3d-2/ · app/projects/[id]/render/
CẤM chạm: prisma (P1) · lib/boq lib/ffe · components/cad · components/library · StageSwitcher (P0)

BỐI CẢNH — kiểm lại bằng grep, đừng tin:
12.737 dòng động cơ nhưng chỉ 161 dòng vỏ (2 trang: dev-bench-3d-2 137 dòng, render 24 dòng).
components/three 0/8 test · components/render-studio 0/19 test. Sổ chỉ có 2 dòng cho mảng này —
KHÔNG phải vì lành, vì CHƯA AI SOI. Nhiệm vụ: DỰNG VỎ + LẬP SỔ, không viết thêm động cơ.

VIỆC 1 — CHỐT BẢN MOCK CHUẨN (làm trước, ~15 phút)
  6 mock 3D chồng lấn: 3D Dựng khối.dc.html (MỚI = BẢN CHUẨN) · 2D Kỹ thuật.dc.html ·
  mock-2d-ky-thuat_cu.html · mock-3d-thong-nhat.html · mock-3d-frame.html · mock-if-3chang.html
  Đọc cả bộ, lập bảng "màn/cụm nào ở file nào, file nào thay file nào". Ghi vào M-OUT.
  ĐỪNG xoá file nào — chỉ lập bảng, TỔNG quyết xoá sau.
  ⇒ Đây là gốc khiến mảng 3D trôi 2 tuần: không có bản chốt thì không ai dám port.

VIỆC 2 — PORT VỎ theo bản chuẩn (ƯU TIÊN CAO NHẤT)
  Port "3D Dựng khối.dc.html" vào components/three + components/render-studio, đủ 4 trạng thái.
  Nối vào app/projects/[id]/render/page.tsx (nay mới 24 dòng).
  Luật port: màu về var(--…) · line-height ≥1,5 · đếm backdrop-filter TOÀN REPO ≤4 (G9) ·
             nút có CHỮ (G6) · 0 chữ PLACEHOLDER · KHÔNG dùng chữ "CAD" trong nhãn.
  Chặng này có 2 MODE người dùng TỰ BẤM CHỌN (Hoà chốt 07/08): Dựng khối · Render.
  Nghiệm thu N6 từng trạng thái: mở trình duyệt thật, CHỤP MÀN. Trạng thái nào chỉ có vỏ chưa
  có ruột ⇒ ghi rõ "vỏ xong, ruột chưa", ĐỪNG khai xong.

VIỆC 3 — LẬP SỔ cho mảng 3D (quan trọng ngang việc 2)
  Soi 12.737 dòng, liệt kê lỗ hổng theo mẫu dòng GAP, ghi vào M-OUT mục "ĐỀ XUẤT DÒNG GAP MỚI".
  ⛔ KHÔNG tự ghi vào docs/GAP-IF.md (§0u).
  Soi tối thiểu: hàm export 0 nơi gọi từ UI · trạng thái lỗi/chờ khi dựng ảnh chạy lâu ·
  27 file giao diện 0 test — cái nào đáng viết test nhất ·
  G-M2-02 (2D và 3D đọc hai nửa khác nhau của cùng bức tường) còn đúng không ·
  G-M2-05 (chặng 3D không có Hoàn tác) còn đúng không.

VIỆC 4 — Hoàn tác cho chặng 3D (G-M2-05), CHỈ nếu việc 2 xong sớm.
  ⌘Z hiện không làm gì và không báo gì. Tối thiểu: báo người dùng biết chưa hỗ trợ, đừng im lặng.
  ĐỪNG hy sinh việc 2 để làm việc này.

BÁO CÁO: docs/M-3D-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## 🟪 P4 · NỐI DÂY ENGINE — engine xong, thiếu nút bấm
⟨cửa sổ `2·m1-loi-cad`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU: lib/boq/ · lib/ffe/ · lib/materials/ · components/materials/ · components/print/
CẤM chạm: prisma (P1) · components/library · components/three (P3) · StageSwitcher (P0)

BỐI CẢNH — mảng "động cơ xong, thiếu sợi dây". KIỂM LẠI bằng grep trước khi làm, sổ có thể lệch:
  G-M3-09  computeBoq chạy thật, 120 test pass, 0 nút nào trên màn gọi tới
  G-M3-11  xuất .xlsx có xl/media/ thật, openpyxl đọc được, chưa bấm được trên UI
  G-M3-04  buildFfeSheet ra file 14.083 B, 2 ảnh neo đúng ô, nút chưa bấm được
  G-M13-03 components/print 1.258 dòng CHƯA CÓ TRANG NÀO MOUNT (`ls app | grep print` = 0).
           LineweightTable · PaperSheetFrame · RadialToolMenu mỗi cái chỉ 1 nơi nhắc, và đều là
           COMMENT. Chỉ ExportPdfDialog có 4 nơi thật. Đây là 4 mock in ấn đã port chưa nối.

VIỆC 1–3 — nối nút cho BOQ · xuất xlsx · FF&E
  Mỗi cái: tìm chỗ ĐÚNG trên giao diện (đừng đẻ màn mới), gắn nút, nối vào hàm engine đã có.
  Nút phải có CHỮ (G6). Trạng thái chờ + lỗi phải hiện ra — engine chạy vài giây, im lặng là hỏng.
  Nghiệm thu N6 TỪNG cái: bấm thật → file thật rơi xuống → mở ra xem được. Dán tên + kích thước.

VIỆC 4 — G-M13-03 · dựng trang cho components/print
  4 mock in ấn (HopXuatPDF · BangNetIn · BangTron · ToGiay) đã thành component nhưng chưa có
  màn hình nào mount. Dựng trang, nối vào. Nghiệm thu N6: mở được trên trình duyệt thật.

VIỆC 5 — G-M13-01 · 9 chỗ gọi mạng KHÔNG bắt lỗi (phần thuộc mảng này)
  components/present-editor/PresentEditor.tsx:263,268 · components/render-studio/ToolModeForm.tsx:570
  Hỏng mạng thì màn hình im lặng, không báo, không lùi được. Thêm catch + thông báo cho người dùng.
  (Phần LoginForm/useNotebook/LoginBackdrop thuộc phiếu khác — ĐỪNG đụng.)

VIỆC 6 — G-M3-17 (xem docs/GAP-IF.md)

VIỆC 7 — tự soát: grep các hàm export trong lib/boq lib/ffe, lập bảng "hàm ↔ có nơi gọi từ UI
  không". Hàm nào 0 nơi gọi ⇒ ghi vào M-OUT. ⛔ ĐỪNG tự ghi GAP-IF.md (§0u).

BÁO CÁO: docs/M-FIX-C-OUT.md mục "ĐỢT 07/08". Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## 🟫 P5 · THƯ VIỆN vòng 2 — chốt thiết kế 07/08
⟨cửa sổ `4·apply-ingiay`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: components/library/
CẤM chạm: mọi thư mục khác.

ĐỌC TRƯỚC: docs/00-CHOT.md mục "CHỐT 07/08 — Thư viện" + "Bổ sung 07/08".
Đó là chốt của chủ dự án, KHÔNG tự sửa vì "cho tiện tay".

VIỆC 1 — SỬA CÁCH VÀO (chốt 07/08)
  library-sheet-css.ts mới đúng một nửa: bo 4 góc ✅ · hở đáy 14px ✅ · nhưng
  transform-origin:50% 100% (:61) và translate(-50%, calc(100%+14px)) (:62) vẫn là chuyển động
  NGĂN KÉO — tấm bò từ đáy màn lên. Sửa thành:
      transform-origin: 50% 50%
      đóng: translate(-50%,10px) scale(.97)     mở: translate(-50%,0) scale(1)
      200ms cubic-bezier(.32,.72,0,1)
      prefers-reduced-motion ⇒ hiện thẳng, bỏ transform
  CHỈ transform, KHÔNG animate opacity (G1).
  LÝ DO (đừng đảo ngược): sheet dính đáy là ngôn ngữ ĐIỆN THOẠI — dán cạnh dưới vì đó là vùng
  ngón cái. IF chạy Electron trên desktop, chuột không có vùng ngón cái. macOS chưa bao giờ
  dính đáy (Save panel · Preferences · Quick Look đều nổi giữa).
  Nghiệm thu: quay 3 khung lúc mở — tấm xuất hiện ĐÚNG CHỖ nó đứng, không bò từ mép dưới.

VIỆC 2 — PHƯƠNG ÁN A (chốt 07/08)
  Tấm giữ 720px · cột kệ 214px · cột thông số CHỈ hiện khi ĐANG CHỌN món, trượt vào từ phải.
  Lưới lúc duyệt 534px (~4 thẻ/hàng) → lúc chọn 298px (~2 thẻ/hàng).
  Chuyển cảnh 180–220ms và phải ÊM. Bật cụp là hỏng cả phương án ⇒ coi như chưa xong.

VIỆC 3 — G-A-04: Thư viện.dc.html còn 4 `dc-import` trỏ file thiếu. Tìm file thật hoặc khai thiếu.
VIỆC 4 — G-A-05: chỗ port đang cãi chốt 05/08. Đọc chốt, sửa cho khớp.
VIỆC 5 — G-A-01: kho vật liệu thiếu cột thông số.

BÁO CÁO: docs/M-APPLY-C-OUT.md mục "ĐỢT 07/08". Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## ⬛ P6 · PHÁP LÝ + TRUNG TÍNH — quyết sớm, đừng để cuối
**Không phải phiếu code — là việc Hoà phải QUYẾT.**

### ❓ Câu hỏi số một: giấy phép DWG
`libredwg-web` là **GPL-3.0**. `docs/LICENSE-NOTES.md` miễn trừ dựa trên *"tool nội bộ, không bán"*
— lập luận **chết** với định vị global (LUẬT NỀN TẢNG trong `CLAUDE.md`).
Ba đường, đọc `docs/RESEARCH-DWG-LICENSE.md` + `docs/PHUONG-AN-LICENSE-DWG.md`:
| Đường | Giá |
|---|---|
| Mở mã nguồn IF theo GPL-3.0 | miễn phí, nhưng phải công khai toàn bộ mã |
| Mua giấy phép thương mại (ODA…) | tiền/năm, giữ mã đóng |
| Đổi sang thư viện khác | kéo theo `lib/cad` = **36.296 dòng** |
⚠️ Nếu chọn đường 3 thì phải làm **TRƯỚC hoặc CÙNG** đợt hình học, không phải sau.

### Phiếu trung tính (dán khi đã quyết xong giấy phép)
```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md + docs/AUDIT-BRAND-PII.md, tuân N1–N8, V6.
SỞ HỮU: lib/filemanager/ · lib/present-editor/content-deck.ts · package.json · public/ ·
        components/IntroSequence.tsx
LUẬT NỀN TẢNG (CLAUDE.md): IF là sản phẩm GLOBAL. 0 tên khách, 0 brand studio trong sản phẩm.

VIỆC 1 — G-M13-02 · tên khách HIỆN LÊN MÀN HÌNH
  lib/filemanager/mock-data.ts:50  name: '2026-06 Detech Complex'
  lib/filemanager/mock-data.ts:216 name: 'Detech-brief-khach.pdf'
  KHÔNG phải comment — chuỗi hiển thị. Đường ra: queries.ts:3 → app/settings/_components/StorageCard.tsx:10
  Đổi sang tên mẫu trung tính (vd "2026-06 Riverside Office", "brief-khach.pdf").

VIỆC 2 — content-deck.ts:113 hardcode 'DETECH · CONCEPT' lên MỌI deck user sinh
  Khách A mở ra thấy tên khách B. Phải đọc từ Brand Kit của dự án đang mở (LUẬT NỀN TẢNG điểm 2).

VIỆC 3 — package.json author/appId `com.ttt.*` · Android `com.tttarchitects.*` · cert installer
VIỆC 4 — 53 ảnh render khách: public/wallpapers/ttt-* · covers/ · detech/
VIỆC 5 — mật khẩu test trong comment: components/IntroSequence.tsx:21
VIỆC 6 — 3 route mẫu công khai: /present · /demo-amanoi · deck 'IKI Village'

⚠️ 8 dòng chứa chữ "TTT" trong components/ và lib/ ĐÃ KIỂM 07/08 — TẤT CẢ là COMMENT giải thích,
   vài dòng còn ghi "đã bỏ tên TTT rồi". KHÔNG phải vi phạm. ĐỪNG sửa mù.

BÁO CÁO: docs/M-TRUNG-TINH-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
```

---
---

# PHẦN D · THỨ TỰ DÁN

> 📌 **TRẠNG THÁI HIỆN TẠI ở `docs/00-DANG-CHO.md`** — đó là nguồn sự thật duy nhất (§0r).
> Tính tới 07/08: **P0 ✅ xong** · P3 chờ mock · P6 chờ Hoà quyết giấy phép ·
> P1·P2·P4·P5·P7 chờ limit 11/08.

## Hôm nay (07/08) — không cần limit Code
| | Việc | Ở đâu |
|---|---|---|
| 1 | **Xuất mock 3D** — mock đang trong cửa sổ Design, đóng là mất | P3 · BƯỚC 0 → Claude Design |
| 2 | **P0 giao diện** — rẻ nhất, thấy ngay bằng mắt | cửa sổ Code rảnh bất kỳ |
| 3 | **P2 soi 16 mảng** — chỉ đọc, 0 nguy cơ đụng ai | cửa sổ Code rảnh bất kỳ |
| 4 | `git commit` — cây sạch, build xanh, lệnh đã soạn | Terminal |

## 11/08 khi limit reset — thả song song, 5 cửa sổ
| Cửa sổ | Phiếu |
|---|---|
| `1·fix-gocc` | **P1 · Tầng dữ liệu** ← việc số một |
| `2·m1-loi-cad` | **P4 · Nối dây engine** |
| `4·apply-ingiay` | **P5 · Thư viện vòng 2** (gộp vào P7 nếu chạy P7) |
| `3·apply-node` | **P7 · Thư viện tổng + Vật liệu + `.idfc`** ← nặng nhất về thiết kế |
| `5·ba-chieu` (mới) | **P3 · Mảng 3D** (phải có mock trước) |
| — | **P6 · trung tính**, sau khi Hoà quyết giấy phép |

## Kiểm tra chồng phiếu — 6 phiếu, 6 vùng RỜI HẲN
| Phiếu | Sở hữu |
|---|---|
| P0 | `StageSwitcher.tsx` · `phases.ts` · 14 chuỗi nhãn |
| P1 | `prisma/` · `lib/lark` · `lib/integrations` · `lib/workspace` · `lib/*scope*` · `app/api/flows` |
| P2 | **không sở hữu gì — chỉ đọc** |
| P3 | `lib/three` · `components/three` · `render-core` · `render-studio` |
| P4 | `lib/boq` · `lib/ffe` · `lib/materials` · `components/materials` · `components/print` |
| P5 | `components/library` |
| P7 | `lib/library` · `components/library` · `LibraryPanel` · `NodeLibraryPanel` · `cad-library` · `lib/materials` · `components/materials` · `public/cad-library` |
| P6 | `lib/filemanager` · `content-deck.ts` · `package.json` · `public/` |
⇒ **0 chồng.** Ghi vào `docs/SO-PHIEU-DA-PHAT.md` khi phát (§0w).

---

# PHẦN E · BA ĐIỀU CÒN CHƯA TRẢ LỜI — nói thẳng

1. **Hiệu năng lúc chạy** — thời gian mở app, độ mượt kéo-thả: **chưa đo lần nào**.
2. **Poché `G-M2-01`** — tường gồm hai hình rời, dời đi thì rách làm đôi lệch 450mm.
   Chưa biết là sửa gọn hay phải dựng lại mô hình "tường là MỘT vật". **Ẩn số**, cần một phiên
   đào riêng để đo trước khi hứa lịch.
3. **Dev server tự chết** lúc 11:35 (07/08) — chưa rõ vì sao. Nếu tái diễn thì mở dòng sổ.

**Không hứa ngày.** Gỡ xong ẩn số 2 và có kết quả P2 thì mới ước lượng được mà không nói dối.

---

## 🟧 P7 · THƯ VIỆN TỔNG + VẬT LIỆU + `.idfc` — Hoà chốt 07/08
⟨cửa sổ `3·apply-node`⟩ · **phiếu nặng nhất về thiết kế, cả logic lẫn giao diện**

### Vì sao phiếu này quan trọng hơn nó trông
Cấu kiện đang bị **chẻ làm đôi**: hình học ở `.dxf`, dữ liệu ở `ProductSpec`, không sợi dây nối.
Ghế trong kho vật liệu và ghế trong bản vẽ là **hai thứ khác nhau**. Đó là gốc của `G-A-01`,
và là lý do "chọn vật liệu xong không dùng được".
Sửa được chỗ này thì BOQ · FF&E · dự toán · xuất hồ sơ **tự thông** — vì tất cả đều đọc từ đó.

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU: lib/library/ · components/library/ · components/LibraryPanel.tsx ·
        components/NodeLibraryPanel.tsx · components/cad-library/ ·
        lib/materials/ · components/materials/ · lib/cad/library-item-resolve.ts ·
        lib/cad/block-library.ts · public/cad-library/
CẤM chạm: prisma/schema.prisma trừ ĐÚNG việc 2 (P1 giữ phần còn lại — báo TỔNG trước khi đụng) ·
          lib/boq lib/ffe (P4) · lib/three (P3) · StageSwitcher (P0)

ĐỌC TRƯỚC — bắt buộc, đây là chốt của chủ dự án:
  docs/00-CHOT.md mục "[07/08 Hoà chốt] `.idfc` — ĐƠN VỊ CẤU KIỆN + GỘP THƯ VIỆN VỀ MỘT TẤM"
  docs/SPEC-STAGE-LIBRARIES.md (kệ theo chặng, chốt 02/08)
  docs/IDF-TONG-QUAN-COWORK-TONG.md §10 (hệ dữ liệu lõi)

════════ PHẦN A · LOGIC ════════

VIỆC 1 — KHẢO SÁT trước khi động (làm đầu tiên, ~30 phút, CHƯA sửa gì)
  Lập bảng: 5 nơi "thư viện" hiện có, mỗi nơi phục vụ màn nào, ai gọi, còn sống không.
    lib/library/ 795 dòng · components/library/ 1.599 · LibraryPanel.tsx ·
    NodeLibraryPanel.tsx · components/cad-library/ 318 (tự khai "DEMO độc lập")
  Trả lời bằng file:dòng: cái nào ĐÃ CHẾT (0 nơi mount) — xoá được; cái nào còn sống — phải gộp.
  ⚠️ Dùng regex ĐẦY ĐỦ (bài học §0y): `export default function` · `export {a as b}` ·
     barrel index.ts · dynamic import() · JSX <Tên/> · đường dẫn @/… trỏ THƯ MỤC.
  Ghi vào M-OUT. ⛔ CHƯA xoá gì ở bước này.

VIỆC 2 — DỰNG FORMAT `.idfc` (đóng G-M16-01 + G-M16-03)
  ⚠️ ĐỌC docs/00-CHOT.md mục ③ TRƯỚC — `.idfc` KHÔNG chỉ gói hình+dữ liệu. Nó gói đủ BA MẶT
     cho BA CHẶNG. Đây là luật K1 áp xuống cấp cấu kiện: MỘT nguồn, ba ống kính.

  Một tệp `.idfc` = MỘT CẤU KIỆN, gói:
    ① mặt cho Thiết kế 2D — ký hiệu · block CAD · dữ liệu kiểu Revit
       nguồn có sẵn: 54 block `public/cad-library/*.dxf` (manifest.json, 12 nhóm) +
                     `lib/cad/block-library.ts` + `library-item-resolve.ts`
    ② mặt cho Thiết kế 3D — khối 3D · vật liệu PBR · để render
       nguồn có sẵn: `lib/three/cad-to-obj.ts` (extrude) · `csg.ts` · `lighting.ts` ·
                     `lib/materials/pbr-from-category.ts` (`inferPbrFromCategory`) ·
                     `export-d5.ts` · `export-vray.ts`
       ⚠️ Hiện 3D SUY TỪ MẶT BẰNG, không gắn vào cấu kiện — đây là chỗ phải nối.
    ③ mặt cho Trình chiếu — giá · thông số bày cho khách
       nguồn có sẵn: `ProductSpec.priceVnd` (Decimal, SỐ THẬT — KHÔNG parse từ priceNote,
                     sai 1 dòng là sai tiền thật) · `priceNote` · `wastagePercent`
    ④ tham số — kiểu `CLUSTER_SPECS` (lib/cad/workstation-clusters.ts, 20 mục) để cấu kiện
       co giãn được, không phải hình chết

  🔴 LAN TRUYỀN — điểm ăn tiền, phải làm cho bằng được:
     Đổi vật liệu ghế ⇒ MỘT thao tác, NĂM nơi tự đổi:
       ① bản vẽ 2D (ký hiệu·ghi chú) · ② phối cảnh 3D (PBR→render) · ③ hồ sơ khách
       · 💰 BOQ/dự toán (đơn giá ⇒ tổng tiền tính lại) · 📅 tiến độ (thời gian đặt/thi công)
     Hôm nay phải sửa 4 nơi, 4 lần, và luôn sót một chỗ. `.idfc` biến thành MỘT lần.
     Revit·SketchUp·D5 KHÔNG có cái này (họ phải xuất-nhập giữa app).

  ⚠️ BA RÀNG BUỘC — vi phạm là hỏng kiến trúc:
     1. **MỘT CHIỀU.** `.idfc` → chặng. Chặng KHÔNG ghi ngược vào `.idfc` gốc — sửa ghế ở dự án A
        KHÔNG được đổi ghế mẫu của cả kho. Đổi mẫu gốc phải vào Thư viện, có xác nhận (KS3/KS4).
     2. **Bản chèn giữ ĐÈ CỤC BỘ.** Dự án này muốn ghế cao 450 thay vì 420 ⇒ ghi đè TẠI BẢN CHÈN,
        KHÔNG đổi `.idfc`. Dùng `srcInsertId`/`expandIdsByInsertGroup` đã có (`model.ts`).
     3. **Nhánh TIẾN ĐỘ phụ thuộc `model Task`** — chưa có (G-M10-01, phiếu P1).
        ⇒ Làm ①②③ + giá TRƯỚC, nối tiến độ SAU khi P1 xong. ĐỪNG chặn nhau, đừng chờ.
  Theo ĐÚNG khuôn `.idf` đã có: file JSON + `IDFC_VERSION` + `migrateIdfc()` — soi `lib/cad/idf.ts`
  (`IDF_VERSION = 2`, `IDF_MIGRATIONS`) rồi làm y hệt. ĐỪNG phát minh cơ chế version mới.
  ⚠️ TRUNG TÍNH: `.idfc` KHÔNG được mang tên studio/khách nào. Cấu kiện là tài sản người dùng.
  Nghiệm thu N6 — CHẠY THẬT, dán ảnh:
    a) xuất 1 cấu kiện ra `.idfc`, mở lại ở dự án KHÁC, thả vào bản vẽ
    b) kiểm đủ 4 mặt: hình 2D đúng · khối 3D + PBR đúng · giá đúng · kéo giãn được
    c) **thử lan truyền**: đổi vật liệu của cấu kiện đó ⇒ chụp màn CHỨNG MINH
       bản vẽ 2D đổi · phối cảnh 3D đổi · BOQ đổi số tiền. Thiếu một nhánh = CHƯA XONG.

VIỆC 3 — NỐI hình học ↔ dữ liệu (gốc của G-A-01)
  Nay `lib/cad/library-item-resolve.ts:46` có 6 loại thả được
  (block·furniture·symbol·cluster·sanitary·misc) nhưng resolve xong KHÔNG mang dữ liệu.
  Sửa: thả một cấu kiện lên bản vẽ ⇒ bản chèn giữ được liên kết tới `.idfc` gốc
  (dùng `srcInsertId`/`expandIdsByInsertGroup` đã có ở `model.ts` — G-M1-06/07/18 đã đóng).
  Nghiệm thu N6: thả ghế → chọn nó → tấm thông số hiện ĐÚNG mã·hãng·vật liệu·giá của ghế đó.

VIỆC 4 — G-A-01 · kho vật liệu thiếu cột thông số
  Thiếu: mã · hãng · nguồn · đơn vị · GIÁ · nhám/bóng. Nối vào `ProductSpec` (đã có sẵn các trường).
  Đây là việc con của việc 3 — làm sau khi việc 3 thông.

════════ PHẦN B · GIAO DIỆN ════════

VIỆC 5 — GỘP NĂM THƯ VIỆN VỀ MỘT TẤM (đóng G-M16-02)
  Hoà chốt: MỘT tấm Thư viện duy nhất, chia kệ theo loại:
      Cấu kiện · Vật liệu · Node · Ảnh tham chiếu
  Nền: `components/library/LibrarySheet.tsx` (bản mới nhất) + chốt hình dáng ở việc 6.
  · `components/cad-library/` tự khai "DEMO độc lập" ⇒ nếu việc 1 xác nhận chết thì XOÁ, ghi rõ.
  · `lib/library/types.ts:15` ghi *"Master Library KHÔNG lộ ra UI"* — sau khi gộp, câu này SAI.
    Sửa comment.
  ⚠️ Gộp = MỘT cửa vào, KHÔNG phải nhét 5 panel cạnh nhau. Người dùng chỉ thấy một tấm.

VIỆC 6 — HÌNH DÁNG TẤM (chốt 07/08, đã ghi ở docs/00-CHOT.md)
  · Tấm **nổi lên tại chỗ**, KHÔNG trượt từ đáy:
        transform-origin: 50% 50%
        đóng: translate(-50%,10px) scale(.97)   mở: translate(-50%,0) scale(1)
        200ms cubic-bezier(.32,.72,0,1) · prefers-reduced-motion ⇒ hiện thẳng
    CHỈ transform, KHÔNG animate opacity (G1).
    LÝ DO (đừng đảo ngược): dính đáy là ngôn ngữ ĐIỆN THOẠI (vùng ngón cái). IF chạy Electron
    trên desktop — macOS chưa bao giờ dính đáy (Save panel · Preferences · Quick Look).
  · **PHƯƠNG ÁN A**: tấm 720px · cột kệ 214px · cột thông số CHỈ hiện khi ĐANG CHỌN món,
    trượt vào từ phải. Lưới duyệt 534px (~4 thẻ/hàng) → lúc chọn 298px (~2 thẻ/hàng).
    Chuyển cảnh 180–220ms và phải ÊM — bật cụp là hỏng cả phương án, coi như chưa xong.

VIỆC 7 — HIỂN THỊ CẤU KIỆN trên kệ (Hoà nhấn mạnh)
  Mỗi thẻ cấu kiện phải đọc được NGAY, không cần bấm vào:
    · ảnh/hình chiếu của cấu kiện — KHÔNG phải ô xám trống
    · tên + mã
    · kích thước (w×d×h) — dân thiết kế cần con số này trước tiên
    · dấu hiệu cấu kiện có tham số (co giãn được) vs hình cứng
  Luật giao diện áp cứng: line-height ≥1,5 (G4) · nút quyết định có CHỮ (G6) ·
  backdrop-filter đếm TOÀN REPO ≤4 (G9) · panel nền đặc ≥92% (G2).
  ⚠️ KHÔNG dùng chữ "CAD" trong nhãn (chốt 07/08) — chặng là "Thiết kế 2D".

VIỆC 8 — G-A-04 · 4 khối `dc-import` của Thư viện.dc.html trỏ file THIẾU
  (`KeVatLieu` · `KeDoDac` · `KeDangGom` · `CotThongSo`). Tìm file thật hoặc khai thiếu, đừng bịa.
VIỆC 9 — G-A-05 · chỗ port đang cãi chốt 05/08 (kính vs đặc · dính đáy vs card rời · 214 vs 186px).
  Đọc chốt, sửa cho khớp.

VIỆC 10 — VÁ NỢ TỪ P0 (`G-M15-07` mục ② và ③) — hai chỗ này nằm trong vùng P7
  ② SÓT · `lib/library/types.ts:87,88` — bảng `STAGE_META` mới đổi `cad → 'Thiết kế 2D'`, còn:
        render:  { label: 'Render' },    ← vẫn tiếng Anh cụt
        present: { label: 'Present' },   ← vẫn tiếng Anh cụt
     Đây ĐÚNG là bảng nhãn CHẶNG (`StageKey`). Đổi thành 'Thiết kế 3D' / 'Trình chiếu'
     theo chốt 07/08. Đổi một bỏ hai là lỗi nửa vời.

  ③ BẤT NHẤT · hai chỗ cùng bản chất, xử lý ngược nhau:
        components/LibraryPanel.tsx:25   'CAD / Sketch'  → 'Thiết kế 2D / Sketch'   ĐỔI
        lib/refingest.ts:45              'CAD / Bản vẽ'  → giữ nguyên               GIỮ
     Cả hai đều là NHÃN PHÂN LOẠI NỘI DUNG. Và danh sách ở LibraryPanel toàn loại nội dung
     (Ref nội thất · Ref ngoại thất · Style dàn trang · Vật liệu/Texture) ⇒ nhét tên CHẶNG
     vào đó là lẫn hai hệ khái niệm.
     CHỌN MỘT CHUẨN cho cả hai, ghi lý do vào M-OUT. Đề nghị: cả hai là phân loại nội dung
     ⇒ giữ chữ "CAD" ở CẢ HAI (nói về loại tệp/bản vẽ, không phải chặng).
     ⚠️ Đổi `LibraryPanel.tsx:25` thì phải đổi ĐỒNG BỘ `lib/ref-search.ts:253`
        (`concept: ['Thiết kế 2D / Sketch']`) — hai chỗ này khớp chuỗi với nhau, lệch là vỡ mapping.

════════ NGHIỆM THU CHUNG ════════
· Mỗi việc một mục trong M-OUT, mỗi kết luận một dòng `file:dòng` (N8)
· Việc 2·3·5·6·7 đều phải CHỤP MÀN trình duyệt thật (N6) — báo cáo không kèm ảnh = chưa xong
· Việc nào chỉ dựng vỏ chưa có ruột ⇒ ghi "vỏ xong, ruột chưa", ĐỪNG khai xong
· Không verify được ⇒ "CHƯA VERIFY" + lý do. Cấm suy đoán (N1)
· ⛔ KHÔNG tự ghi vào docs/GAP-IF.md (§0u — chỉ TỔNG ghi)

BÁO CÁO: docs/M-THU-VIEN-OUT.md
```

### Thứ tự trong P7 — đừng đảo
```
VIỆC 1 khảo sát  →  VIỆC 2 dựng .idfc  →  VIỆC 3 nối hình↔dữ liệu
                                              ↓
                    VIỆC 5 gộp tấm  →  VIỆC 6 hình dáng  →  VIỆC 7 hiển thị thẻ
                                              ↓
                                    VIỆC 4·8·9 dọn nốt
```
Làm giao diện trước khi có `.idfc` = vẽ kệ rỗng, không có gì bày lên.

---

## 🟩 P8 · CLAUDE DESIGN — 14 đỏ `G-M5` (KHÔNG tốn phiên code)
14/75 đỏ là **màn chưa được VẼ**, không phải lỗi lập trình. Thả phiên code vào là nó tự bịa
giao diện — đúng thứ `§9` cấm.

### ĐỢT 1 — DỌN BỘ MOCK (dán trước, gỡ 5 đỏ)
```
Bạn là Claude Design. Không code, chỉ dọn + vẽ mock.

BỐI CẢNH ĐO ĐƯỢC (docs/GAP-IF.md):
- 44/67 trang mock ĐỎ ở cửa kiểm, 19 trang chỉ dựng MỘT theme  (G-M5-14)
- 6 trang cùng tả MỘT màn (chặng 2D), không trang nào ghi "bản chốt"  (G-M5-03)
- 10/67 trang là bản xuất công cụ thiết kế, chạy không nổi ngoài công cụ đó  (G-M5-05)
- 10/67 trang thực ra là màn của app song song, không phải app này  (G-M5-15)
- Cụm xuất in: 4 trang (hộp xuất PDF · tờ giấy · bảng nét in · bảng tròn) không đọc
  được thành hợp đồng giao diện  (G-M5-04)

VIỆC 1 — lập BẢNG KIỂM KÊ 67 trang trong docs/mocks/:
  mỗi trang: tên · tả màn nào · thuộc app nào · đủ 2 theme chưa · còn dùng hay bỏ
VIỆC 2 — với mỗi màn có NHIỀU bản: chọn 1 BẢN CHỐT, ghi rõ vì sao, các bản kia đánh dấu THAY THẾ
VIỆC 3 — 10 trang của app song song: tách ra khỏi bộ, ghi rõ
VIỆC 4 — 19 trang một theme: bổ sung theme còn thiếu
VIỆC 5 — cụm xuất in: gộp 4 trang thành MỘT hợp đồng giao diện đọc được

RÀNG BUỘC MỌI TRANG:
- .dc.html tự chứa, KHÔNG dc-import trỏ file ngoài
- đủ 2 theme (Kem/Mực) · line-height ≥1,5 · nút quyết định có CHỮ
- backdrop-filter ≤4 chỗ · 0 chữ PLACEHOLDER · màu var(--…), không hex cứng
- KHÔNG dùng chữ "CAD" trong nhãn — chặng tên là "Thiết kế 2D"
- 3 chặng: Thiết kế 2D / Thiết kế 3D / Trình chiếu (2D Design / 3D Design / Presenting)

Xuất bảng kiểm kê + danh sách trang cần sửa. CHƯA vẽ mới ở đợt này.
```

### ĐỢT 2 — VẼ 7 MÀN THIẾU (dán sau đợt 1, mỗi lần ≤4 màn)
```
Bạn là Claude Design. Vẽ mock cho các màn CHƯA TỪNG CÓ. Mỗi màn 1 file .dc.html tự chứa.

ĐỢT 2A — 4 màn:
 ① Nhập bản vẽ có sẵn (G-M5-01) — chọn tệp → tiến độ → nút huỷ → báo cáo nạp
    (đọc được / bỏ qua / cảnh báo). Năng lực đã có ở G-M1-01 nhưng chưa ai vẽ.
 ② Phiên bản hồ sơ (G-M5-06) — so trước–sau bản vẽ, đánh dấu chỗ vừa sửa, đóng dấu bản
 ③ Cửa sổ bốc tách/đo món (G-M5-07) — hiện chưa có, trang tool-window duy nhất tả việc KHÁC
 ④ Bảng N MÓN (G-M5-08) — kết quả bốc tách nhiều món, hồ sơ chuẩn ngành
    (mã · ảnh · finish · vendor · giá · SL · duyệt)

RÀNG BUỘC: y hệt đợt 1 (2 theme · line-height ≥1,5 · nút có CHỮ · ≤4 kính · 0 PLACEHOLDER ·
var(--…) · không chữ "CAD" · tên 3 chặng đúng chốt).
Vẽ xong đưa nội dung từng file để lưu vào docs/mocks/.
```
```
ĐỢT 2B — 3 màn (dán sau khi 2A xong):
 ⑤ Kho vật liệu + cửa nhập bảng tính (G-M5-10) — ĐÃ CODE mà chưa bao giờ có mock:
    ghép cột · xem trước · báo dòng hỏng
 ⑥ Màn nhận ĐỀ BÀI (G-M5-11) — bước MỞ ĐẦU của chặng 3, nay chỉ là panel 3 bước lọt trong màn vẽ
 ⑦ ZONING theo chương trình (G-M5-12) — chia khu từ đề bài · bảng diện tích từng khu · đối chiếu
RÀNG BUỘC: y hệt trên.
```

### ĐỢT 3 — SỬA CỬA KIỂM MOCK (2 đỏ, việc của TỔNG không phải Design)
`G-M5-16` cửa kiểm cho qua 5 kiểu hỏng · `G-M5-17` cửa chỉ quét `docs/mocks/*.html` không đệ quy
⇒ TỔNG tự sửa script, không cần phiên.

---

## 🟥 P9 · CAD + HÌNH HỌC — 19 đỏ `G-M1` + `G-M2`
⟨cửa sổ mới `p9-hinh-hoc`⟩ · **`lib/cad` hiện KHÔNG phiên nào giữ**

### Bốn đỏ cùng MỘT gốc — làm gốc là đóng cả bốn
`G-M2-01` tường = hai hình rời · `G-M1-08` poché không neo cấu kiện ·
`G-M1-14` poché không sống sót vòng xuất DXF · `G-M2-02` 2D và 3D đọc hai nửa khác nhau

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md — ĐỌC KỸ "LUẬT SỐ 0" ở đầu.
Tuân N1–N8, V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: lib/cad/ · components/cad/
CẤM chạm: prisma (p1 giữ) · lib/boq lib/ffe lib/materials (p4) · components/library (p5) ·
          lib/three · components/three
⚠️ 4 phiên khác đang chạy song song. Chạm ngoài vùng = vỡ.

════ VIỆC 1 · ĐÀO GỐC POCHÉ (làm TRƯỚC, chỉ ĐO, CHƯA sửa) ════
Bốn đỏ cùng một gốc: G-M2-01 · G-M1-08 · G-M1-14 · G-M2-02.
Triệu chứng đo được: vùng tô (poché) và đường bao là HAI hình rời không liên kết.
  Dời tường ⇒ nửa tô sang chỗ mới, nửa bao đứng lại, LỆCH 450 mm, không cảnh báo.
  126–161 mảng tô/file, 0 mảng có đường bao để neo.
  3D chỉ dựng TỪ VÙNG TÔ ⇒ 2D và 3D đặt cùng bức tường ở hai vị trí khác nhau.

TRẢ LỜI 3 CÂU bằng file:dòng, ghi vào M-OUT, RỒI DỪNG BÁO CÁO:
  a) Nhóm hai hình lại là ĐỦ, hay phải dựng lại mô hình "tường là MỘT vật"?
  b) Nếu phải dựng lại: đụng bao nhiêu file, bao nhiêu dòng? Có phá `.idf` đang lưu không?
  c) Có đường đi TỪNG BƯỚC không (vá tạm giữ liên kết trước, mổ lõi sau)?
⚠️ ĐÂY LÀ ẨN SỐ LỚN NHẤT DỰ ÁN. Báo cáo xong CHỜ TỔNG quyết mới làm tiếp.
   Tự ý mổ lõi = có thể mất dữ liệu người dùng.

════ VIỆC 2 · NẠP DXF — làm song song, KHÔNG chờ việc 1 ════
  G-M1-01  nạp DXF chạy trên LUỒNG CHÍNH, không tiến độ, không huỷ, không worker ⇒ app đứng hình
  G-M1-10  bỏ ATTRIB/ATTDEF (14–17 bản ghi/file) — nơi CAD cất giá trị khung tên
  G-M1-11  bỏ ELLIPSE (9/file) trong khi kho kiểu dữ liệu ĐÃ CÓ entity ellipse thật
  G-M1-12  2/6 file không lấy được diện tích trong khung tên (chuỗi nằm trong định nghĩa block)
Nghiệm thu N6: nạp file DXF thật, chụp màn thanh tiến độ + nút huỷ chạy được.

════ VIỆC 3 · XUẤT DXF HỎNG — nặng, làm sau việc 2 ════
  G-M1-18  🔴 file DXF do IF xuất ra KHÔNG mở được bằng bộ đọc chuẩn (thử `ezdxf` fail)
  G-M1-13  xuất DXF đổi tên lớp và GỘP MẤT lớp (bộ làm sạch tên thay khoảng trắng)
  G-M1-19  bộ suy loại cấu kiện tự bật cho MỌI nơi gọi, kể cả đường nạp block thư viện
Nghiệm thu N6: xuất DXF → mở bằng `ezdxf` (python) → dán output. Không mở được = CHƯA XONG.

════ VIỆC 4 · CÒN LẠI, làm nếu còn giờ ════
  G-M1-05 không tính diện tích sàn từ hình học (6/6 file trả `method:'none'`)
  G-M2-03 diện tích trên bản vẽ là CHỮ CHẾT, đổi hình phòng thì nhãn m² y nguyên
  G-M2-04 không có đối tượng PHÒNG (nhãn chỉ là chữ, biên dò lại mỗi lần)
  G-M2-06 lệnh sửa hình không có bản xem trước
  G-M2-07 hình dẫn xuất tự chảy vào bản vẽ, bị đếm như hình người vẽ
  G-M2-08 số khai ≠ hình vẽ, không ai đối chiếu (khai 220mm, vùng tô vẽ 100mm)
  G-M2-09 🔴 phiên hết hạn giữa lúc sửa = MẤT SẠCH Hoàn tác/Làm lại  ← ưu tiên cao nhất nhóm này
  G-M2-05 chặng 3D không có Hoàn tác (⌘Z không làm gì, không báo)

BÁO CÁO: docs/M-HINH-HOC-OUT.md. Mỗi kết luận một dòng `file:dòng` (N8).
Việc 1 xong ⇒ DỪNG, báo TỔNG. Việc 2·3·4 cứ chạy.
```
