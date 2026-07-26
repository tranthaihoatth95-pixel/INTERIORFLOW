# IF Architecture Blueprint v1 — Kiến trúc đa tầng thống nhất

> **Vai trò file**: Hiến pháp kiến trúc — đứng TRÊN mọi spec/sprint plan. Trả lời 4 câu:
> đâu là kiến trúc app · đâu là tri thức · đâu là input/output · tính năng nào thuộc bậc nào.
> KHÔNG thay thế **`docs/IF1_IF2_BIGPICTURE.md`** (roadmap — sửa dẫn chiếu 26/07: đây chính là
> file trước gọi "IF-MASTER-ARCHITECTURE.md", đã có sẵn trong repo dưới tên khác) hay
> `docs/IF-FEATURE-SPEC-P1-v2.md` (chi tiết 101 item — đã có trong repo từ 26/07) — file này là
> LƯỚI PHÂN LOẠI đặt lên trên chúng.
>
> **Luật đọc cho Claude Code**: nhận task mới → tra hộ chiếu tính năng (mục 3) trước khi code.
> Task không khai được hộ chiếu = task chưa đủ rõ, trả lại hỏi.

---

## 1. KIẾN TRÚC 6 TẦNG (tier stack)

Nguyên tắc: **tầng trên tựa vào tầng dưới**. Sửa tầng dưới = ảnh hưởng mọi tầng trên → thay đổi
tầng thấp phải qua RIN duyệt.

| Tầng | Tên | Chứa gì (hiện trạng thật) | Thuộc về |
|---|---|---|---|
| **T5** | Não tri thức *(knowledge core)* | RAG kiểu NotebookLM: Tập 2 Design DNA, ATLAS, TREND_WATCH, feedback records | TRI THỨC — không phải app |
| **T4** | Giao diện *(frontend)* | `/cad-editor` · `/present-editor` · `/photo-editor` · Dashboard | APP |
| **T3** | Tính năng *(features)* | 101 item spec A–G, PS-1…11 — **phân bậc N/P/L** (mục 2) | APP |
| **T2** | Động cơ *(engines)* | DCEL half-edge · standards checker · `DECK_STANDARDS`+`suggest`+Perceptron · `material-texture` · render pipeline ComfyUI | APP |
| **T1** | Lõi mã chung *(IF Core schema)* | `.idf` · `shared-types.ts` · GuProfile 10 trục · material ref (`photoUrl?` hook) · **asset id** · feedback record | APP — xương sống |
| **T0** | Hạ tầng *(infrastructure)* | Next.js/TypeScript · Google OAuth · localStorage/IDB · worktree rules | APP |

**Trao đổi T5 ↔ app (2 chiều)**:
- App → Não: mọi output có id + metadata (bản vẽ, render, deck, phản hồi khách) nạp về.
- Não → App: T2/T3 đọc tri thức khi chạy (checker đọc quy chuẩn, Gu đọc STYLE_DNA, PS-8 đọc narrative).

### 1B. Ràng buộc nền tảng — web hôm nay, desktop về sau *(platform constraint)*

IF hiện là **web app** (Next.js) bọc **Electron — CHỐT 2026-07-24** *(đã có code thật: `electron/main.js`
451 dòng — spawn Next.js server, single-instance lock, **auto-updater**, quản lý userData. Không đổi
sang Tauri: đổi = viết lại từ đầu chỉ để tiết kiệm dung lượng gói, không đáng)* — mở khoá 3 thứ web
thuần không làm được:
mở/lưu file thẳng ổ đĩa · **gọi GPU local để render 0 credit** · offline + phím tắt CAD đầy đủ.

Hai kênh, một codebase: **bản web** = dùng thử, xem deck, khách comment/share (kênh bán) ·
**bản desktop** = vẽ CAD nặng, file thật, render local (kênh làm việc).

**Ràng buộc áp dụng NGAY (kể cả khi chưa bọc vỏ)**: mọi chỗ **đọc/ghi file** và **gọi render**
phải đi qua **một lớp trung gian** *(adapter layer)* — không gọi thẳng API trình duyệt.
Ngày bọc Tauri chỉ thay 1 lớp, không viết lại app. Vi phạm ràng buộc này = nợ kỹ thuật nặng.

### 1B-2. Mô hình phát hành: **LOCAL-FIRST + ĐỒNG BỘ** *(chốt 2026-07-24)*

> ⚠️ **Không dùng nhãn A/B/C** — repo và các phiên khác đánh nhãn khác nhau, gây nhầm. Gọi tên đầy đủ.

Dữ liệu nằm ở máy người dùng, đám mây chỉ là bản sao để đồng bộ (hình mẫu: Figma, Linear).
Lý do: chỉ-desktop thì cụt đường share cho khách · cloud SaaS thì mất 0-credit và GPU local.

**Tài liệu phải dọn**: `DEPLOY-CHECKLIST.md` (giả định cloud Vercel+Supabase) → **DEPRECATED** ·
`RESEARCH-INSTALLER-4-PLATFORMS.md` → thu hẹp còn **Windows + macOS**; Android/iOS về sau chỉ
để **xem/duyệt deck qua web**, không đóng gói app CAD đầy đủ.

**Hạ tầng hiện tại là ĐÚNG hướng, không phải nợ kỹ thuật**: SQLite + Prisma (`dev.db`) ·
`uploads/` trên ổ đĩa · auth tự viết (jose JWT + bcryptjs) · `binaryTargets` có `windows`.

**5 ràng buộc T1 phải áp NGAY** (rẻ như cho hôm nay, đại phẫu nếu để sau):

| # | Ràng buộc | Vì sao | Hiện trạng (audit 24/07) |
|---|---|---|---|
| 1 | **ID = chuỗi ngẫu nhiên** (cuid), **KHÔNG số tự tăng** | 2 máy offline cùng tạo → trùng id, không cứu được | ✅ **16/16 đạt** |
| 2 | `updatedAt` + `rev` | Không có mốc thì không biết bản nào mới | 🟡 updatedAt 3/16 · rev 0/16 |
| 3 | **Xoá mềm** `deletedAt` | Máy kia không phân biệt "đã xoá" và "chưa nhận" | ⬜ 0/16 |
| 4 | Ghi `deviceId`/người sửa | Giải xung đột, truy vết | ⬜ 0/16 |
| 5 | Tách file khỏi DB (DB giữ path) | Sync metadata trước, file nặng tải sau | ✅ đạt |

**Phạm vi áp #2–#4**: chỉ 4 model `Project` · `Flow` · `LibraryAsset` · `ProjectMember`.
**KHÔNG áp cho**: bảng mirror Lark (Larkbase là nguồn chân lý, đã có `syncedAt`) và **sổ cái bất
biến** `CreditTransaction`, `FlowVersion` — *xoá mềm sai bản chất kế toán/snapshot*.

**Lộ trình 3 pha** — KHÔNG làm sync 2 chiều sớm:
1. **Nay**: local-first thuần, không sync, chỉ áp 5 ràng buộc trên.
2. **Khi cần share**: đồng bộ **một chiều** (đẩy deck/ảnh lên cho khách xem link — O3). Vừa sức.
3. **Khi nhiều máy/nhiều người**: đồng bộ hai chiều. Khó nhất.

⚠️ **KHÔNG tự viết engine sync.** Dùng sẵn: **Turso/libSQL embedded replica** (ngắn nhất — giữ
nguyên SQLite) · PowerSync · ElectricSQL · Yjs/Automerge (chỉ cho sửa realtime từng tài liệu).

---

## 2. THANG BẬC N–P–L — cơ chế phân bậc tính năng

Mỗi tính năng ở T3 thuộc đúng MỘT bậc. Đây là lưới chống loạn.

| Bậc | Tên | Định nghĩa | Nguồn chuẩn so | Luật |
|---|---|---|---|---|
| **N** | Nền *(baseline parity)* | Cái app tham khảo coi là ĐƯƠNG NHIÊN. Thiếu N = người dùng bỏ đi trong 5 phút | ArcSite (Sketch) · AutoCAD (Pro) · D5 (Render) · Canva/Gamma (Present) · Photoshop-lite (Photo) | **KHÔNG ĐƯỢC THIẾU.** Backfill trước mọi thứ khác |
| **P** | Pro *(best-of-breed)* | Tính năng cao cấp NHẤT của app tham khảo, CHỌN LỌC đem về — không bê nguyên con | Fix wizard, Brand Kit, smart-object, version review… | Chọn theo giá trị/công; có ⛔ list chống bê thừa |
| **L** | Lai trội *(hybrid vigor / heterosis)* | Lai ≥2 nguồn thành thứ KHÔNG APP NÀO CÓ. Là hào nước cạnh tranh *(moat)* | — (IF tự sinh) | Chỉ xây khi N của chặng đó ✅. Phải dùng mã T1 + nạp kết quả về T5 |

**Tiêu chí một tính năng được gọi là L** (đủ cả 4):
1. Lai từ ≥2 dòng gen (vd AutoCAD × luật VN; Canva × learning-to-rank)
2. Chạy trên mã chung T1 (đọc/ghi GuProfile, .idf, id)
3. Kết quả nạp về não T5 (đóng vòng khép kín)
4. Có người dùng thật (studio bất kỳ — TTT là tenant đầu tiên) cần nó hằng tuần, không phải demo đẹp

---

## 3. HỘ CHIẾU TÍNH NĂNG (feature passport)

Mọi tính năng — cũ lẫn mới — khai đủ 6 trường trước khi code. Đây là "cơ chế phân biệt rõ
ràng tuần tự" chống loạn xạ:

```
┌─ HỘ CHIẾU TÍNH NĂNG ─────────────────────────────┐
│ 1. Chặng      : CAD-Sketch / CAD-Pro / Render /   │
│                 Present / Photo                    │
│ 2. Bậc        : N / P / L                          │
│ 3. Gen nguồn  : app tham khảo nào, tính năng nào   │
│ 4. Input      : nhận gì, từ đâu (định dạng T1)     │
│ 5. Output     : trả gì, có id không, ai tiêu thụ   │
│ 6. Tri thức áp: đọc gì từ T5 (hoặc "không")        │
└───────────────────────────────────────────────────┘
```

Ví dụ điền mẫu — Fix wizard của Standards Checker:
`Chặng: CAD-Pro · Bậc: L · Gen: AutoCAD dimension × TCVN/QCVN VN · Input: .idf + ruleset ·
Output: vi phạm + đề xuất mm (ghi log id) · Tri thức: bảng quy chuẩn từ T5`

---

## 4. CHẨN ĐOÁN HIỆN TRẠNG — kim tự tháp ngược

Đối soát 17/07 (`docs/IF-FEATURE-UPGRADES.md`): **chỉ D1 Standards Checker đạt Pro; phần lớn còn
Basic**, trong khi các tính năng L (checker, Gu, Perceptron) đã tồn tại. Kết luận: L có trước,
N còn thủng → kim tự tháp ngược. Không đập L đi — chỉ **đổi hướng đầu tư về N** cho tới khi cân.

### Bảng audit theo chặng

| Chặng | N (nền) | P (pro) | L (lai trội) | Việc phải làm trước |
|---|---|---|---|---|
| **CAD Sketch/Pro** | 🟡 THỦNG: dynamic input khi kéo tường (A1.1), snap indicator + priority (A5.1), F8 ortho (A5.7), undo history (A4.11), rubber-band preview (A2), label diện tích luôn hiện (A1.3) | ⏳ hầu hết chưa (theo tracker) | ✅ MẠNH: checker+fix wizard, DCEL auto-heal, Gu, coordinate input | **Backfill N** — gói "CAD cảm giác tay" (danh sách mục 7) |
| **Render** | 🟡 nghẽn HẠ TẦNG: hero AI max 1344px, không đủ A3 300dpi; chưa có id ổn định cho ảnh | — | ✅ khung ControlNet giữ layout | Chờ compute; làm **id ảnh** ngay (rẻ, thuộc T1) |
| **Present** | ✅ khá đủ: editor, 25 template, export PDF/PPTX/PNG, Brand Kit (PS-1 xong) | 🟡 đúng lộ trình PS-2/3/5/6/9 | ✅ suggest + Perceptron + DECK_STANDARDS; PS-8 sắp | Chạy tiếp sprint plan hiện có — KHÔNG đổi |
| **Photo-editor** | 🟡 N-tích-hợp thủng: là hòn đảo (PS-3 chưa nối), không phím tắt (PS-7) | ✅ engine sâu: layer/mask/curve/clone | — | PS-3 trước PS-7 (đã chốt trong sprint plan) |

> Ví dụ điển hình "cái nâng cao chưa tới": photo-editor có engine ngang Photoshop-lite (P ✅)
> nhưng thiếu đường về slide (N-tích-hợp ⬜) → giá trị thực ≈ 0. Bài học: **P và L chỉ sinh lời
> khi N đủ.**

---

## 5. DÂY CHUYỀN VẬN HÀNH — hợp đồng vào/ra từng chặng (I/O contracts)

Đa nguồn nhưng chọn lọc: mọi thứ vào/ra đều theo định dạng T1, có id, có chỗ nạp về T5.

| Chặng | INPUT (nhận) | OUTPUT (trả) | Tri thức áp (đọc T5) | Nạp về não (ghi T5) |
|---|---|---|---|---|
| **0 · Đề bài** | brief khách + khảo sát + ảnh hiện trạng | GuProfile khách (10 trục) + operator type | STYLE_DNA, DEVELOPER fingerprint | GuProfile mới |
| **1 · CAD** | GuProfile + đề bài (+DXF import nếu có) | `.idf` + danh sách vật liệu + báo cáo quy chuẩn | quy chuẩn TCVN/QCVN, Neufert, ATLAS vật liệu | vi phạm thường gặp, layout được duyệt |
| **2 · Render** | `.idf` + GuProfile + material ref | ảnh photoreal **có id** + metadata (phòng, góc, style) | STYLE_DNA prompt, palette gu | cặp (prompt → ảnh được chọn) |
| **3 · Present** | ảnh id + `.idf` views + GuProfile + Brand Kit | deck/board + share link | template suggest, narrative PS-8, TREND_WATCH | Nhận/Bỏ layout, phản hồi khách |
| **4 · Phản hồi** | duyệt/từ chối của khách + QC agent | feedback record chuẩn T1 | — | **tất cả** — khép vòng |

Luật dây chuyền: **output không có id = output mồ côi, không được ship.** (Hiện Render truyền
dataURL không id — vá ở T1 trước.)

---

## 5B. CỔNG VÀO/RA (IF Gateway) — nạp mọi định dạng, nén thành mã

Vị trí: cửa duy nhất giữa thế giới ngoài và T1. Mọi thứ vào/ra đều qua đây.

### Nguyên tắc nén: "mã đi nhẹ — gốc nằm kho — id nối hai bên"
Nén NGỮ NGHĨA *(semantic compression)*, không mất thông tin thiết kế; bản gốc không xoá:
- DXF 5MB → `.idf` vài chục KB (vector + ngữ nghĩa phòng/tường)
- Buổi đọc gu 2 giờ → GuProfile 10 con số
- Ảnh render 4MB → id + thumbnail + metadata đi theo dây chuyền; bản gốc ở kho tài sản (PS-10)

### Adapter theo pha (mỗi định dạng = 1 module cắm rời, thêm mới không đụng lõi)
| Pha | Định dạng vào | Bóc ra mã gì |
|---|---|---|
| **1** | DXF (G2.1 đã có nền) · ảnh JPG/PNG · text/MD brief | `.idf` · id+meta+thumbnail · GuProfile + operator type |
| 2 | **PPTX import (M1 slide→ảnh + M2 bóc text — không hứa M3 trung thực 100%)** · PDF hồ sơ (text) · XLSX BOQ | slide asset + text box · text có tag · material list chuẩn T1 |
| 3 | PDF bản vẽ scan · SketchUp/IFC (cầu sang IF2) · audio ghi chú | outline · geometry · text |

### Flexible module — LOD *(level of detail / lazy loading)*
Hộ chiếu tính năng (mục 3) trường **Input** chính là lệnh cho cổng: module khai cần trường nào,
cổng chỉ **bung** *(hydrate)* đúng phần đó, phần còn lại giữ nén. Ví dụ: Present bung
thumbnail + palette (không kéo geometry); Render bung geometry + material (không cần feedback).

### Hai lớp thông tin trên mọi bản ghi
| Lớp | Chứa | Ai dùng |
|---|---|---|
| **Chung** *(shared)* | id · projectId · chặng nguồn · GuProfile · timestamps | Mọi module cùng đọc, không ai sở hữu riêng |
| **Trội** *(salient)* | Cờ máy tự gắn khi phân loại: vi phạm 🔴 · vật liệu chủ đạo · trục gu lệch ≥±2 · ảnh khách duyệt | Xử lý TRƯỚC, UI highlight trước |

### Đường ra đối xứng
Mọi export (DXF/PDF/PPTX/PNG/share link) đi qua CÙNG cổng — gắn id + metadata trước khi rời hệ
(round-trip: DXF export nhúng metadata IF, đã ghi ở G2.2 tracker).

### Luật cổng (3 điều)
1. Không parser nào ghi thẳng vào T1 — phải qua schema validate.
2. Định dạng chưa có adapter → lưu kho + nhãn "chờ bóc", KHÔNG chặn dây chuyền.
3. "Vào được tất cả định dạng" là tầm nhìn; thi công theo pha — không viết adapter khó
   (PDF scan) trước khi pha 1 chạy thật.

---

## 5C. ĐỒNG HỒ XU HƯỚNG & HỘI ĐỒNG GIẢ ĐỊNH — chống lỗi thời, tăng tốc học

> Thời AI mọi thứ lỗi thời nhanh — không thể chỉ chờ "test thật + thời gian". Cơ chế 2 vòng:
> **giả định sơ khảo** (nhanh, rẻ, chặn lỗi) → **thật chung khảo** (giữ sự thật thị trường).

### 1) Đồng hồ xu hướng *(trend clock)* — backend lẫn frontend
- Mọi bản ghi tri thức T5 **và** mọi hộ chiếu tính năng thêm 2 trường:
  `review_by` (hạn xem lại) · `trend_status`: 🟢 đang lên / 🟡 bão hoà / 🔴 lỗi thời.
- **Tác nhân quét** *(trend scout)*: LLM + web search có sẵn (không xây ML riêng), chạy định kỳ
  quét nguồn (Dezeen, ArchDaily, báo cáo màu, thị trường VN) → cập nhật `TREND_WATCH` → tự
  gắn/đổi tem. Tiền lệ tay đã có: Tập 2 ghi "Japandi bão hoà 2025".
- **Backend đọc tem**: ML hạ trọng số bản ghi 🔴 khi gợi ý; tính năng 🔴 vào hàng chờ thay.
- **Frontend đọc tem**: UI hiện nhãn xu hướng cạnh style/palette lúc designer chọn.

### 2) Hội đồng giả định *(synthetic panel)* — tác nhân tự Q&A
- **Persona = vân tay 10 trục trong bảng `DEVELOPER` của TENANT** (dữ liệu não riêng từng studio — với TTT là Vinhomes/Sun/CapitaLand…, KHÔNG ship trong app) + House
  Rules + checklist KIÊN/NHÃ → dựng khách giả lập gần như 0đ (dữ liệu đã có).
- Mỗi output (deck, layout, trang DNA) chạy **vòng sơ khảo**: các persona tự Q&A, chấm theo
  10 trục + quy chuẩn → trả danh sách lỗi/nghi vấn → sửa xong mới tới khách thật.
- **Vòng chung khảo** = khách thật. Phản hồi thật nạp não; nếu persona đoán sai phản ứng
  khách → hiệu chỉnh lại vân tay persona.

### Luật chống buồng vang *(echo chamber / model collapse)* — khoá cứng
1. Bản ghi giả định gắn nhãn `nguồn: synthetic` — **không bao giờ trộn** với bản ghi thật.
2. Giả định chỉ để **CHẶN lỗi (veto)**, không để **DẠY gu (train)** — Perceptron/team model
   chỉ học từ phản hồi thật. *(Ngoại lệ duy nhất: cold-start pre-train từ Neufert — F2.4
   tracker — vì đó là chuẩn sách, không phải ý kiến máy tự sinh.)*
3. Persona sai ≥2 lần liên tiếp so với khách thật → bắt buộc hiệu chỉnh trước khi dùng tiếp.

---

## 6. ƯU THẾ LAI TRỘI — danh sách moat chốt v1

Nuôi đúng 5 con này, không đẻ thêm khi N chưa cân:

| # | Tên | Công thức lai | Trạng thái |
|---|---|---|---|
| L1 | **Checker TCVN + fix wizard trong CAD** | AutoCAD precision × luật xây dựng VN | ✅ Pro — độc nhất thị trường |
| L2 | **Gu Engine 10 trục xuyên 3 chặng** | tâm lý học thẩm mỹ × vector encoding | ✅ chạy; Elite theo F1.2 tracker |
| L3 | **CAD→Render giữ đúng layout** | bản vẽ kỹ thuật × ControlNet AI | 🟡 khung xong, chờ compute |
| L4 | **Layout ML học gu nhà (Nhận/Bỏ)** | Canva template × learning-to-rank | ✅ Perceptron chạy; Elite = team model |
| L5 | **Chuỗi vật liệu xuyên suốt** CAD hatch → BOQ → callout Present → ATLAS | AutoCAD material × thư viện nhà × Lark | 🟡 hook `photoUrl?` chờ ATLAS Vol.3 |

Đề xuất L mới phải qua cổng: đủ 4 tiêu chí mục 2 + VŨ duyệt + không có N nào đang thủng ở
chặng liên quan.

---

## 7. DANH SÁCH BACKFILL N — thứ tự thi công

Gói **"CAD cảm giác tay"** (toàn bộ từ `docs/IF-FEATURE-UPGRADES.md`, đều là chuẩn ArcSite/AutoCAD):

1. A1.1 — dynamic input + ghost preview khi vẽ tường
2. A5.1–A5.2 — snap indicator (vòng xanh) + snap priority + toggle tạm
3. A5.7 — F8 ortho + đường dóng
4. A2 — rubber-band preview + dimension tooltip realtime
5. A4.11 — undo history panel
6. A1.3 — label diện tích luôn hiện + GFA tự cộng
7. A4.1 — kéo thả trực tiếp + alignment guides

Song song (thuộc T1, rẻ): **id ổn định cho ảnh render** (mở khoá PS-3 tài sản liên kết + mục 5).

Present giữ nguyên lộ trình PS: PS-2 → PS-3 → gate → PS-5/6/9 (không đổi thứ tự đã chốt).

---

## 8. LUẬT VẬN HÀNH — 7 điều chống loạn

1. **Không xây L khi N chặng đó chưa ✅.** Muốn phá lệ → RIN trình lý do, VŨ duyệt.
2. **Mọi task code phải có hộ chiếu 6 trường** (mục 3). Không hộ chiếu = không code.
3. **Mỗi sprint một bậc**: sprint-N (backfill) tách khỏi sprint-L (sáng tạo). Không trộn.
4. **Thừa thì cắt, ghi sổ**: ⛔ list trong `docs/IF-PRESENT-SPRINT-PLAN.md` (xem §9) là mẫu — mỗi
   chặng giữ mục "Đã cân nhắc & LOẠI" để không đề xuất lại.
5. **Output mồ côi không được ship**: mọi đầu ra có id + metadata theo T1, nạp được về T5.
6. **Luật human-in-the-loop — áp cho MỌI tính năng AI** *(gợi ý layout CAD · vật liệu · Present ·
   Vitals)*. Chẩn đoán gốc: *"thông minh chưa tới mà human-in-loop cũng chưa tới"* = kẹt giữa.
   - **6a · Một lúc một việc** — bước đã xong thì panel thu lại, không chiếm đất vĩnh viễn.
   - **6b · Đề xuất NHIỀU, không đề xuất MỘT** — đưa ≥3 phương án để người *chọn*; chọn = dạy máy.
     Một phương án thì người chỉ biết chịu hoặc bỏ.
   - **6c · Sửa tay không mất đề xuất** ⭐ — "đề xuất lại" chỉ đổi phần **chưa động tay**; chỗ đã
     sửa được **khoá giữ** *(pin)*. Thiếu luật này là lý do người dùng bỏ công cụ AI.
   - **6d · Nói rõ máy vừa làm gì** — 1 dòng giải thích quyết định, không im lặng.
7. **Không có nút thì không có AI.** Mọi việc AI làm được phải tồn tại TRƯỚC dưới dạng **hàm có
   tên** mà UI cũng gọi được (tầng năng lực dùng chung). Ô chat AI không có năng lực bên dưới =
   **hứa hão, cấm ship**. Thứ tự bắt buộc: **năng lực → nút → AI gọi hàm**, không được đảo.
   Vòng lặp chết cần tránh: *công cụ tay thiếu → người dùng quay sang AI → AI cũng không có gì
   để gọi → bế tắc cả hai lối → bỏ app.*
   Chi tiết: `docs/SPEC-EDITOR-TOOLKIT.md` §1.

---

## 9. QUAN HỆ VỚI CÁC FILE KHÁC

> ⚠️ **Vá dẫn chiếu file ma (26/07)** — quét toàn `docs/` thấy 4/6 nhánh dưới đây trỏ tới file
> KHÔNG tồn tại trong repo lúc đó. Đã sửa 2 (nội dung thật ra nằm sẵn dưới tên khác); 3 file còn
> lại tưởng mất nhưng hoá ra nằm ở `~/Downloads/` (ngoài repo) — Hoà đã trỏ lại, **copy vào
> `docs/` cùng ngày 26/07**, hết ⚠️.

```
IF-ARCHITECTURE-BLUEPRINT-v1  ← file này (lưới phân loại, đứng trên)
├── docs/IF1_IF2_BIGPICTURE.md    (roadmap IF1/IF2 — ĐÃ CÓ, chỉ đổi tên so với "IF-MASTER-
│                                  ARCHITECTURE" ghi trước đây, sửa dẫn chiếu 26/07)
├── docs/IF-CORE-SCHEMA.md        (chi tiết kỹ thuật T1 — ĐÃ VIẾT, không còn "sắp viết")
├── docs/IF-FEATURE-SPEC-P1-v2.md (101 item — bậc N/P/L — nạp vào docs/ 26/07 tối, từng ⚠️ mất)
├── docs/IF-FEATURE-UPGRADES.md   (nguồn backfill N — mục 7 file này từng liệt kê TRỰC TIẾP danh
│                                  sách A5.1…A4.1 chép tay; nay có file gốc, đối chiếu lại được)
└── docs/IF-PRESENT-SPRINT-PLAN.md (lộ trình PS-0…PS-11 đầy đủ — nạp vào docs/ 26/07 tối, từng
                                   ⚠️ mất, chỉ còn mảnh rải rác trong `SPEC-RENDER-STUDIO.md` +
                                   `RESEARCH-TEAM-COLLABORATION.md`).
```

*v1.2 · 2026-07-24 · Ben soạn, chờ Hoà duyệt: luật số 1 · 5 moat · thứ tự backfill · adapter
pha 1 · danh mục đầu ra (sẽ ghi thành 5D khi duyệt) · tần suất quét trend clock (tháng/quý?).*

