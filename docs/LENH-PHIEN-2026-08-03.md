# SỔ LỆNH PHIÊN — 03/08/2026
Prompt khởi tạo + khối lệnh phân việc 4 phiên. **Dán lại được nguyên văn ở phiên sau.**
Cowork soạn 03/08. Lý do lưu: chat bị nén là mất, mà đây là thứ tốn công soạn nhất.

---

## 0 · TRẠNG THÁI CHỐT LÚC GHI (03/08, sau trực ca)

| Mục | Trạng thái |
|---|---|
| `main` | `12223cf` — đã merge `nhanh-g4`. Ahead 4 chưa push. |
| Đang sửa dở (chưa commit) | `app/layout.tsx` (đã thêm `<CanvasWallpaper />` ✅) · `components/LeftRail.tsx` (+18/−4, port `openOnCanvas`) |
| StageShell | 3 bước xong: `a9b7203` · `cfc2cab` · `bc38604` |
| Hex TTT trong avatar | **đã sạch** (grep `app/settings/avatar/page.tsx` + `components/avatar/AvatarBuilder.tsx` = rỗng) |
| PHU · `lib/boq` | 5 module + 4 test. 3 file mới + `app/api/boq/[projectId]/route.ts` **chưa commit** |
| ⛔ Chặn PHU | quyền đọc Wiki Lark — mã lỗi `131006`, Hoà phải bật trong Lark Developer Console |
| ArchiNote | repo thật là `~/Downloads/ttt-tasks` (`package.json` → `"name": "archinote"`). `~/Downloads/archinote` là repo **trống**, bỏ |

**Va chạm đã xử:** `components/LeftRail.tsx` là file duy nhất cả `nhanh-g4` lẫn `main` cùng sửa (main ở `a9b7203`, g4 để bỏ rail tự viết). Luật: **LeftRail thuộc CHINH** — lấy bản main, `openOnCanvas()` của G4 thì port sang.

---

## 1 · PROMPT KHỞI TẠO — PHIÊN CODE CHÍNH (dán khi mở session mới)

> Thư mục: `~/Downloads/interiorflow`

```
Bạn là phiên Claude Code CHÍNH của dự án InteriorFlow (IF) — app desktop Electron/Next.js
cho studio nội thất. Repo: ~/Downloads/interiorflow.

═══ ĐỌC TRƯỚC KHI GÕ DÒNG CODE NÀO (đúng thứ tự) ═══
1. docs/00-CHOT.md                  — sổ mục lục mọi quyết định
2. docs/BAO-CAO-CHINH.md            — mục "CHỐT PHIÊN" cuối file: hàng đợi + 3 bẫy
3. docs/SPEC-HA-TANG-UI-IF.md       — CƠ CHẾ, quan trọng nhất
4. docs/SPEC-CAD-SHELL-V3.md        — luật vỏ app chặng Vẽ
5. docs/SPEC-HOVER-FOCUS-IDF.md     — bảng tra hover/press/selected
6. docs/SPEC-MAT-DO-CON-TRO.md      — token mật độ desktop vs cảm ứng
7. docs/BAI-HOC-02-08-2026.md       — 4 lần hỏng + quy trình 6 bước
8. docs/mocks/mock-if-3chang.html   — vật mẫu 3 chặng + Thư viện
9. app/globals.css                  — token thật

═══ LUẬT BẤT BIẾN ═══
L1. KIỂM TRƯỚC KHI THIẾT KẾ: ls docs/mocks/ + grep repo trước khi tạo file mới.
    Lỗi số 4 BAI-HOC: vẽ lại avatar bằng 8 vòng tròn trong khi đã có AvatarRenderer 1271 dòng.
L2. PORT NGUYÊN VĂN mock, KHÔNG vẽ lại bằng mắt. Lỗi số 2, đã tái phạm 1 lần.
L3. Màu/bo/chữ lấy từ var(--...) globals.css. CẤM hex TTT: #F06020 #002850 #1B1512 #F1ECE3.
L4. Mock đủ 2 theme. Tối là MẶC ĐỊNH, kiểm Tối trước.
L5. Verify bằng ĐO DOM (getComputedStyle), không chỉ nhìn ảnh.
L6. Không đụng vùng phiên khác: components/filemanager/* + app/settings/* = G4;
    lib/boq/* + lib/commands/* = PHU. Buộc phải sửa thì DỪNG, ghi vào báo cáo.
L7. Mỗi bước 1 commit. tsc + eslint + npm test sạch trước khi commit.
L8. Chốt phiên khi context ~85%: ghi trạng thái cuối docs/BAO-CAO-CHINH.md rồi commit + push.

═══ BẪY ĐÃ BIẾT (đừng chẩn đoán lại) ═══
- 2 dev server cùng repo → .next/ đụng nhau, server nghẹt. Restart là hết, KHÔNG phải bug.
- Click đầu tiên vào toggle trên tab browser mới đôi khi không đăng ký → đọc store.
- Loop "Maximum update depth" ở EditorCanvas present-editor là của phiên phụ, đã biết.

═══ VIỆC — AppShell 6 ổ (bước 1 SPEC-HA-TANG-UI-IF) ═══
Đọc kỹ Trụ 1 + Trụ 4 trước.
Nâng components/studio/StageShell.tsx thành <AppShell> sáu ổ cắm cố định:
  ① Header 42px · ② Navigator 214px · ③ Stage · ④ Inspector 236px · ⑤ Toolbelt dock · ⑥ Status 26px
Vị trí + kích thước ổ KHÔNG nhúc nhích khi đổi chặng/mode — chỉ ruột đổi.

Port từ docs/mocks/mock-if-3chang.html:
- BỎ rail icon. 4 mục xuyên app gom vào menu bung ra từ nút logo góc trái.
  Dashboard/FlowsPanel VẪN mount tại shell như a9b7203 — chỉ đổi cửa vào, không đụng logic.
- Navigator trái 214px thay chỗ rail. Đáy Navigator 2 hàng cố định, GIỐNG HỆT mọi chặng mọi mode
  (điểm neo trí nhớ, luật B của spec):
    hàng trên: [thêm] · [Thư viện] · [thu gọn ‹]
    hàng dưới: [avatar + tên] · [⚙ Cài đặt]
- Inspector 236px CHỈ render khi có vật được chọn (không render, không phải ẩn CSS). Có nút ✕.
  Vào bằng animation ramp .96→1.008→1, transform-origin: right center.
- Toolbelt = dock kính nổi giữa-dưới canvas, dùng class .mat-panel có sẵn.
  Gộp dock Ortho/Số liệu/Lệnh/Xong/Huỷ hiện có vào đây, KHÔNG để 2 dock.
- Tab ngang 34px trên canvas.
- defineMode registry: mode chỉ khai 4 thứ — navigator, canvas, shelves, commands. CẤM state ẩn.
- Sidebar tự thu khi cửa sổ <1280px, NHỚ lựa chọn tay (tự thu rồi thì phóng cửa sổ không tự mở lại).

Token thêm vào globals.css cạnh khối --radius-*:
  :root{ --tap:32px; --row:28px; --gap:8px; --fs-2xs:11px }
  @media (hover:none) and (pointer:coarse){ :root{ --tap:44px; --row:44px; --gap:12px } }
Tái dùng đúng điều kiện đã có ở globals.css:1030 — KHÔNG dùng bề rộng màn hình.

Chia 3-4 commit. Mỗi commit verify 1440×900 + 2560×1440, Sáng lẫn Tối, đo DOM đủ 6 ổ,
thử bàn phím (Tab đi hết Navigator, focus ring hiện rõ).

═══ CHỜ COWORK, ĐỪNG TỰ CHẾ ═══
Mock mode Vẽ 3D (Command Panel 5 tab + viewport + ViewCube) và mode Revit — Cowork đang dựng.
Đến phần đó thì DỪNG chờ mock. Luật đã chốt sau 4 lần hỏng.
```

---

## 2 · PHU — commit BOQ rồi làm sổ lệnh

```
1. COMMIT trước: khối lệnh đã soạn sẵn cuối docs/BAO-CAO-PHU.md.
   cd ~/Downloads/interiorflow-phu → chạy khối đó. Kèm: rm scripts/_tmp-probe-node-token.ts
2. ATLAS thật VẪN CHẶN (quyền đọc Wiki Lark, mã 131006) — KHÔNG tự xoay, để nguyên.
3. VIỆC MỚI — đọc docs/SPEC-HA-TANG-UI-IF.md Trụ 2, làm BƯỚC 2 thi công:
   Gom lib/cad/commands.ts + lib/cad/command-aliases.ts thành lib/commands/registry.ts.
   Mỗi lệnh một bản ghi: { id, label:[vi,en], icon, key, aliases, when, group, surfaces, run }
   - when: biểu thức bối cảnh 'stage==cad && mode!=revit' — viết parser nhỏ, KHÔNG dùng eval
   - group: 'draw@2' kiểu VS Code; tên nhóm quyết định vào dock hay vào popover ⋯
   - selector cmdsFor(ctx) trả về danh sách đã lọc + sắp xếp
   - LUẬT ENABLE/HIDE KHÁC NHAU THEO MẶT:
     dock → trả về CẢ lệnh không dùng được với disabled:true (LÀM MỜ, giữ chỗ)
     contextmenu/palette → LỌC BỎ hẳn
     Lý do trong spec: Microsoft — ẩn lệnh trên thanh cố định làm layout nhảy, mất ổn định.
   THUẦN LIB, KHÔNG ĐỤNG UI. Có test cho selector + when parser.
   Không đụng components/ của CHINH, không đụng filemanager của G4.
```

---

## 3 · G4 — Inspector tự sinh từ schema

```
Sau khi CHINH merge xong nhanh-g4, đọc docs/SPEC-HA-TANG-UI-IF.md Trụ 3, làm BƯỚC 3:

lib/schema/ mới:
- defineObject(type, { groups:[{label, fields:[{k,label,subtype,readonly,emphasis}]}] })
- Bộ subtype: LENGTH_MM · AREA_M2 · ANGLE_DEG · FACTOR · MONEY_VND · MATERIAL_ID ·
  LAYER_REF · COLOR · ENUM · TEXT · IMAGE_REF
  Mỗi subtype quyết định: kiểu widget + định dạng số + đơn vị + căn lề.
  LENGTH_MM → "5 200" (cách nghìn bằng dấu cách, chuẩn bản vẽ VN)
  MONEY_VND → "32 287 500 ₫"   AREA_M2 → "24.60 m²"   FACTOR → thanh trượt 0–1
- components/inspector/AutoInspector.tsx: nhận (schema, vật đang chọn) → dựng panel
- CỬA THOÁT PHÂN BẬC (bắt buộc): override 1 trường → 1 nhóm → cả panel.
  KHÔNG được thiết kế kiểu "hoặc tự sinh hoặc viết tay".
- CHỌN NHIỀU: trường có giá trị khác nhau hiện "—", sửa thì áp cho tất cả.

Đổi 3 inspector đang viết tay sang AutoInspector, bắt đầu từ cái NHỎ NHẤT.
Mock tham chiếu: docs/mocks/mock-if-3chang.html (ổ Inspector phải, 3 chặng đều có).
KHÔNG đụng components/studio/ (của CHINH).
```

---

## 4 · ARCHINOTE — duyệt 3 câu

> ⚠️ Thư mục **`~/Downloads/ttt-tasks`**, KHÔNG phải `~/Downloads/archinote` (repo trống).

```
DUYỆT 3 câu trong BAO-CAO-ARCHINOTE.md (Cowork chốt, Hoà giao quyền quyết):
1. Repo ArchiNote CHÍNH LÀ ~/Downloads/ttt-tasks (package.json đã "name": archinote,
   git history thật, 1066 dòng đang chạy). Copy 9 file spec từ ~/Downloads/archinote sang
   ttt-tasks/docs/, commit. Bỏ repo trống. TUYỆT ĐỐI KHÔNG scaffold lại PM page.
2. Định vị theo lệnh mới: v1 = sổ tay tài nguyên + PM, chạy web. Hiện trường đẩy v2.
   Ghi 1 dòng đính chính vào ĐẦU SPEC-ARCHINOTE-DETAIL-v1, KHÔNG xoá dòng cũ (append-only).
3. Nối IF: duyệt phương án đã đề xuất — chung ngôn ngữ hình ảnh Vitals + chung nguồn Lark
   + deep-link "Mở trong InteriorFlow →". KHÔNG app nào gọi API app kia (luật A5.1).

Mock Home 4 khu: Cowork dựng, dừng ở B2 chờ mock là ĐÚNG.
CHẶN ngoài tầm tay, không tự xoay: LARK_* env copy từ ~/Downloads/interiorflow/.env.local;
bảng PROJECT_STATUS chưa tồn tại → B6 DỪNG, không tự tạo bảng trên Lark của Hoà.
Làm 1+2 trước, báo cáo, rồi chờ mock.
```

---

## 5 · CHỐT PHIÊN GẤP (dùng khi phiên nào sắp hết context)

```
CHOT PHIEN NGAY (context sap het). Lam dung 3 viec, khong lam gi khac:
1. Neu dang merge do dang: git merge --abort HOAC hoan tat roi commit — dung de treo.
2. Ghi vao CUOI docs/BAO-CAO-<TEN>.md muc "CHOT PHIEN <gio> <ngay>":
   viec dang do · file dang mo · quyet dinh da chot · thu con chan
3. git add -A && git commit -m "docs: chot phien <TEN> <ngay>" && git push
Xong bao 1 dong. Khong tom tat dai.
```

---

## 6 · VIỆC CÒN TREO CHỜ HOÀ

| # | Việc | Vì sao chỉ Hoà làm được |
|---|---|---|
| 1 | Bật quyền đọc Wiki cho app Lark trong Developer Console | chặn ATLAS sync thật, mã `131006` |
| 2 | `git push` khi phiên CHÍNH commit xong (main ahead 4) | — |
| 3 | Hướng **avatar**: mua bộ 3D ~$30–80 / thuê hoạ sĩ / tự dựng Blender | quyết định tiền |
| 4 | Google Flow: tạo 2–3 video 8s theo prompt đã soạn, gửi lại để ghép `/intro` | cần credit của Hoà |
| 5 | Gật `SPEC-HA-TANG-UI-IF` để phát lệnh thi công bước 2–5 | quyết định kiến trúc |
| 6 | Xoá dead-code `components/IntroSequence.tsx` (chứa credential comment) — CHINH đề xuất | cần gật |
| 7 | Chạy lệnh dọn `public/detech/` (22MB ảnh dự án khách) — đã soạn sẵn trong BAO-CAO-CHINH | sau khi 3 chỗ code còn tham chiếu được thay |

---
*Cowork ghi 03/08/2026. File này để dán lại, không phải để đọc cho vui — mọi khối trong đây đã kiểm với repo thật tại thời điểm ghi.*
