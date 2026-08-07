# BẢNG LỆNH ĐỢT 2 — dán một mạch, 4 phiên song song
Soạn 07/08 · nguồn số liệu: `docs/AUDIT-TONG-THE-IF-2026-08-07.md` + `docs/GAP-IF.md` (85 dòng · **58 đỏ** sau khi hoãn ArchiNote 07/08)
⏳ Chạy khi limit reset (11/08). Trước đó chỉ đọc, đừng dán.

## Vì sao chia đúng 4 phiếu này
Năm thư mục **rời hẳn nhau** ⇒ 0 chồng (§0w). (Đ2-5 thêm 07/08 sau khi Hoà bắt được TỔNG bỏ sót — xem §0x.) Tra `docs/SO-PHIEU-DA-PHAT.md` trước khi thêm phiếu thứ 5.

| Phiếu | Chủ thư mục | Đóng | Chặn ai |
|---|---|---|---|
| Đ2-1 TẦNG DỮ LIỆU | `prisma/` `lib/lark` `app/api/lark-tasks` | G-M10-01 · G-M9-01 | **chặn cả mảng SyncWork**. ArchiNote NGOÀI phạm vi |
| Đ2-2 NỐI DÂY ENGINE | `lib/boq` `lib/ffe` `components/materials` | G-M3-09/11/04/17 | không |
| Đ2-3 PORT 4 MÀN CAD | `components/cad` `components/sketch` | 4 dòng G-M5 | không |
| Đ2-4 THƯ VIỆN vòng 2 | `components/library` | G-A-01/04/05 | không |
| **Đ2-5 MẢNG 3D** 🔴 | `lib/three` `components/three` `render-core` `render-studio` | dựng vỏ + lập sổ | **chặn: cần mock trước** |
| **Đ2-6 SOI 14 MẢNG** 🔴 | chỉ ĐỌC, 0 thư mục sở hữu | lập sổ ~24.600 dòng chưa ai soi | không — chỉ đọc |

⚠️ Đ2-1 là **phiếu duy nhất** được đụng `prisma/schema.prisma`. Ba phiếu kia chạm schema ⇒ DỪNG, báo TỔNG.

---

## ▣ PHIẾU Đ2-1 — TẦNG DỮ LIỆU  ⟨cửa sổ: `1·fix-gocc`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md trước, tuân N1–N8 và V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: prisma/ · lib/lark/ · lib/integrations/ · app/api/lark-tasks/
CẤM chạm: components/ (trừ đọc) · lib/boq · lib/ffe · lib/cad

🚫 ARCHINOTE NGOÀI PHẠM VI (Hoà chốt 07/08: *"archinote chưa code. xử if trước"*).
   ArchiNote chưa có một dòng code nào ⇒ ĐỪNG thiết kế gì cho nó, đừng thêm field "cho sau này",
   đừng dựng hàng đợi offline. Chỉ lo IF ↔ Larkbase. Cửa cho ArchiNote đã chừa sẵn MIỄN PHÍ:
   ExternalRef có cột `system` là chuỗi tự do — sau này thêm `system='archinote'` là xong, 0 sửa lõi.
   Làm thừa lúc này là nợ kỹ thuật cho một thứ chưa tồn tại.

BỐI CẢNH ĐO ĐƯỢC (đừng tin, hãy kiểm lại bằng grep):
- prisma/schema.prisma có 18 model. KHÔNG có model Task nào.
- Có 3 model mang tên nhà cung cấp trong LÕI: LarkTaskRef(:317) LarkPersonRef(:341) LarkUserMap(:450)
- model ExternalRef ĐÃ CÓ (:482) + lib/integrations/external-ref{,-core}.ts đã có test.
- LarkTaskRef còn bị 4 file code gọi trực tiếp.
- components/dashboard/LarkPanels.tsx:8 tự khai "kéo-thả kanban KHÔNG đổi trạng thái".

VIỆC 1 — dựng model Task nội bộ (đóng G-M10-01)
  Thêm `model Task`: id (cuid, do IF sinh) · projectId · title · statusId · assigneeIds · startAt
  · dueAt · order · createdAt · updatedAt.

  ⚠️ SỬA SO VỚI BẢN ĐẦU (07/08, sau khi tra cách các hệ khác làm):
  ① `status` KHÔNG phải String tự do. Dựng `model WorkflowState { id · projectId · name · order ·
     isActive · isDone }`, Task trỏ `statusId`. Lý do: String tự do thì phiên này gõ "Đang làm",
     phiên sau gõ "đang làm", Kanban vỡ cột. Mẫu chuẩn coi trạng thái là DỮ LIỆU, không phải mã —
     bỏ dùng thì tắt `isActive`, KHÔNG xoá (giữ lịch sử, luật KS4 lùi được).
     Vẫn giữ tinh thần trung tính: mỗi dự án tự khai bộ trạng thái riêng, app không áp đặt.
  ② `LarkTaskRef` GIỮ NGUYÊN, đừng thay thế. Nó là bản chụp hệ ngoài (có `raw` + `syncedAt`,
     không có `updatedAt` người dùng sinh) — vai trò CACHE. Task nội bộ là nguồn chân lý MỚI,
     hai thứ nối nhau qua ExternalRef. Xoá cache là mất đường đối chiếu khi sync lệch.
  ③ Đừng neo Task vào `Project.currentStage` (:79) hay `lib/phases.ts` — ba chặng
     concept/render/present là PIPELINE LÀM ẢNH của IF, KHÔNG phải giai đoạn hợp đồng ngành
     (Ý tưởng → Cơ sở → Kỹ thuật → Thi công → Giám sát). Trùng tên là bẫy. Nếu cần giai đoạn hợp
     đồng thì đó là trường RIÊNG, ghi vào M-OUT để TỔNG quyết, đừng tự đẻ.

  Chạy migrate. Viết CRUD ở lib/server/tasks.ts + app/api/tasks/route.ts.
  Nghiệm thu N6: phải GHI được — chạy thật một lệnh tạo→sửa status→đọc lại, dán output.

VIỆC 2 — chuyển 3 model Lark* sang dùng ExternalRef (đóng G-M9-01 một phần)
  Không xoá vội. Trình tự: ① viết lớp đọc mới qua ExternalRef ② chuyển 4 file gọi LarkTaskRef sang
  lớp mới ③ viết script chép dữ liệu cũ sang ExternalRef ④ đánh dấu 3 model cũ @@map + comment
  "DEPRECATED — xoá ở đợt 3". CHƯA xoá model ở đợt này (mất dữ liệu là không lùi được, luật KS4).
  Nghiệm thu: grep -rn "LarkTaskRef" lib app components → chỉ còn trong lớp tương thích, 0 nơi khác.

VIỆC 3 — adapter Lark ghi NGƯỢC được
  lib/integrations/providers/lark.ts hiện chỉ đọc. Thêm đường ghi: đổi status Task nội bộ → đẩy sang
  Lark qua ExternalRef. Nếu API Lark không cho ghi ⇒ KHÔNG bịa, ghi rõ vào M-OUT là chặn ngoài tầm.

  ⚠️ BẮT BUỘC — CHỐNG VÒNG LẶP ĐỒNG BỘ (bổ sung 07/08).
  Đây là lỗi số một của mọi cầu nối hai chiều: IF đẩy sang Lark → Lark báo "có thay đổi" → IF nhận
  lại → tưởng mới → đẩy tiếp → lặp vô tận, đốt sạch hạn ngạch API trong vài phút.
  Chặn bằng dấu nguồn: thêm `lastWriteBy` ('idf' | '<mã hệ ngoài>') + `lastWriteAt` vào ExternalRef.
  Khi nhận thay đổi từ hệ ngoài: nếu `lastWriteBy='idf'` và cách `lastWriteAt` dưới ngưỡng (đề nghị
  60 giây) ⇒ BỎ QUA, đó là tiếng vọng của chính mình.
  Nghiệm thu: đổi status 1 việc, đếm số lần gọi API Lark trong 5 phút sau đó. Phải là 1, không phải n.
  Trùng thời điểm hai bên cùng sửa ⇒ chọn theo `lastWriteAt` mới hơn, GHI LẠI bản bị thua vào log
  (đừng nuốt im — luật KS5 nói được vì sao).

VIỆC 4 — nối Kanban ghi được
  components/dashboard/LarkPanels.tsx: kéo-thả nay gọi API Task nội bộ. Sửa luôn dòng :8 tự khai sai.
  Nghiệm thu N6: quay/chụp kéo một thẻ sang cột khác, tải lại trang, thẻ Ở LẠI cột mới.

BÁO CÁO: docs/M-FIX-C-OUT.md — mỗi việc một mục, mỗi kết luận một dòng `file:dòng` (N8).
Việc nào KHÔNG verify được thì ghi thẳng "CHƯA VERIFY" + lý do. Cấm suy đoán (N1).
```

---

## ▣ PHIẾU Đ2-2 — NỐI DÂY ENGINE  ⟨cửa sổ: `2·m1-loi-cad`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md trước, tuân N1–N8 và V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: lib/boq/ · lib/ffe/ · lib/materials/ · components/materials/ · components/present-editor/
CẤM chạm: prisma/schema.prisma (Đ2-1 giữ) · components/library (Đ2-4 giữ) · components/cad (Đ2-3 giữ)

BỐI CẢNH: đây là mảng "động cơ xong, thiếu sợi dây" — engine đã pass test, chỉ chưa có nút bấm.
- G-M3-09: computeBoq chạy thật, 120 test pass, 0 nút nào trên màn gọi tới.
- G-M3-11: xuất .xlsx có xl/media/ thật, openpyxl đọc được, chưa bấm được trên UI.
- G-M3-04: buildFfeSheet ra file 14.083 B, 2 ảnh neo đúng ô, nút chưa bấm được.
- G-M3-17: xem docs/GAP-IF.md.
KIỂM LẠI cả 4 dòng bằng grep trước khi làm — sổ có thể đã lệch.

VIỆC 1–3 — nối nút cho BOQ · xuất xlsx · FF&E
  Mỗi cái: tìm chỗ ĐÚNG trên giao diện (đừng đẻ màn mới), gắn nút, nối vào hàm engine đã có.
  Nút phải có CHỮ, không chỉ icon (luật G6).
  Trạng thái chờ + lỗi phải hiện ra — engine chạy vài giây, im lặng là hỏng trải nghiệm.
  Nghiệm thu N6 cho TỪNG cái: bấm thật → file thật rơi xuống → mở ra xem được. Dán tên + kích thước file.

VIỆC 4 — G-M3-17.

VIỆC 5 — tự soát: grep các hàm export trong lib/boq lib/ffe, lập bảng "hàm ↔ có nơi gọi từ UI không".
  Hàm nào 0 nơi gọi ⇒ thêm dòng mới vào M-OUT (ĐỪNG tự ghi vào GAP-IF.md — chỉ TỔNG ghi sổ đó, §0u).

BÁO CÁO: docs/M-FIX-C-OUT.md mục "ĐỢT 2". Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## ▣ PHIẾU Đ2-3 — PORT 4 MÀN CAD  ⟨cửa sổ: `3·apply-node`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md trước, tuân N1–N8 và V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: components/cad/ · components/sketch/ · components/smartselect/
CẤM chạm: components/library (Đ2-4 giữ) · prisma (Đ2-1 giữ) · lib/boq lib/ffe (Đ2-2 giữ)

PORT 4 MOCK — nằm ở docs/mocks/, CHƯA AI PORT (tra docs/SO-PHIEU-DA-PHAT.md xác nhận lại):
  ① Nhận đề bài.dc.html        (35 KB)
  ② Bảng món nội thất.dc.html  (31 KB)
  ③ Kết quả chia khu.dc.html   (26 KB)
  ④ Xem cấu kiện.dc.html       (25 KB)

LUẬT KHI PORT:
- Màu: mock hardcode ~33–43 mã hex. KHÔNG bê nguyên — ánh xạ về var(--…) đã có. Mã nào không có
  token tương ứng ⇒ ghi vào M-OUT, ĐỪNG tự đẻ token mới.
- Kính lỏng (backdrop-filter): "Kết quả chia khu" có 2 chỗ, "Xem cấu kiện" có 6 chỗ. Luật G9 cho
  phép TỐI ĐA 4 chỗ toàn app. Port xong phải đếm lại toàn repo — vượt 4 ⇒ bỏ bớt, báo chỗ nào bỏ.
- line-height ≥ 1,5 (G4 — dưới mức đó cắt dấu tiếng Việt). Mock đã đúng, đừng làm hỏng khi port.
- font-size 9px trong mock CHỈ dùng cho chữ tắt trong avatar tròn (NT · MH · QD). Đừng lan nó ra
  chữ có dấu.
- Chuỗi "PLACEHOLDER" trong mock phải biến mất hết sau khi port.
- Nút quyết định phải có CHỮ (G6).

Nghiệm thu N6 cho TỪNG màn: chứng minh có nơi mount + mở được trên trình duyệt thật.
Màn nào chỉ dựng được vỏ, chưa có ruột ⇒ ghi rõ "vỏ xong, ruột chưa" — đừng khai xong.

BÁO CÁO: docs/M-APPLY-A-OUT.md mục "ĐỢT 2". Mỗi kết luận một dòng `file:dòng` (N8).
```

---

## ▣ PHIẾU Đ2-4 — THƯ VIỆN vòng 2  ⟨cửa sổ: `4·apply-ingiay`⟩

```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md trước, tuân N1–N8 và V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: components/library/
CẤM chạm: mọi thư mục khác.

ĐỌC TRƯỚC: docs/00-CHOT.md mục "CHỐT 07/08 — Thư viện" + "Bổ sung 07/08". Đó là chốt của chủ dự án,
KHÔNG được tự sửa vì "cho tiện tay".

VIỆC 1 — sửa CÁCH VÀO (chốt 07/08)
  library-sheet-css.ts hiện mới đúng một nửa: bo 4 góc ✅ · hở đáy 14px ✅ · nhưng
  transform-origin:50% 100% (:61) và translate(-50%, calc(100%+14px)) (:62) vẫn là chuyển động
  NGĂN KÉO — tấm bò từ đáy màn lên. Sửa thành:
      transform-origin: 50% 50%
      đóng: translate(-50%,10px) scale(.97)     mở: translate(-50%,0) scale(1)
      200ms cubic-bezier(.32,.72,0,1)
      prefers-reduced-motion ⇒ hiện thẳng, bỏ transform
  CHỈ transform, KHÔNG animate opacity (luật G1).
  Lý do (đừng đảo ngược): sheet dính đáy là ngôn ngữ ĐIỆN THOẠI — dán cạnh dưới vì đó là vùng ngón
  cái. IF chạy Electron trên desktop, chuột không có vùng ngón cái. macOS chưa bao giờ dính đáy.
  Nghiệm thu: quay 3 khung lúc mở — tấm xuất hiện ĐÚNG CHỖ nó đứng, không bò từ mép dưới.

VIỆC 2 — PHƯƠNG ÁN A (chốt 07/08)
  Tấm giữ 720px · cột kệ 214px · cột thông số CHỈ hiện khi ĐANG CHỌN món, trượt vào từ phải.
  Lưới lúc duyệt 534px (~4 thẻ/hàng) → lúc chọn 298px (~2 thẻ/hàng).
  Chuyển cảnh 180–220ms và phải ÊM. Bật cụp là hỏng cả phương án ⇒ coi như chưa xong.

VIỆC 3 — G-A-04: Thư viện.dc.html còn 4 `dc-import` trỏ file thiếu. Tìm file thật hoặc khai thiếu.
VIỆC 4 — G-A-05: chỗ port đang cãi chốt 05/08. Đọc chốt, sửa cho khớp.
VIỆC 5 — G-A-01: kho vật liệu thiếu cột thông số.

BÁO CÁO: docs/M-APPLY-C-OUT.md mục "ĐỢT 2". Mỗi kết luận một dòng `file:dòng` (N8).
```

---
---

# 🗺 SAU ĐỢT 2 CÒN MẤY ĐỢT — đường tới bản code xong

**Còn 4 đợt nữa (đợt 3→6).** Ước lượng dựa trên 60 đỏ đo được hôm nay, không phải cảm tính —
nhưng đợt 3 có một ẩn số lớn, nói rõ ở dưới.

| Đợt | Tên | Đóng ~ | Vì sao xếp ở đây |
|---|---|---|---|
| **2** | Dữ liệu · nối dây · 5 màn | ~15 đỏ | Task nội bộ chặn mọi thứ ⇒ phải xong trước |
| **3** | Hình học + Workspace | ~18 đỏ | poché là lỗi LÕI; workspace chờ Task của đợt 2 |
| **4** | Giao diện còn lại | ~12 đỏ | phải có Design vẽ mock mới thì mới port được |
| **5** | Trung tính + pháp lý | ~8 mục | không sửa thì **không được bán** |
| **6** | Đóng gói + nghiệm thu | — | chỉ làm khi 5 đợt trên xanh |

## Đợt 3 · HÌNH HỌC + WORKSPACE — nặng nhất
- **`G-M2` (9 đỏ) — tường rách làm đôi.** `G-M2-01`: vùng tô (poché) và đường bao là hai hình rời;
  dời tường thì nửa tô sang chỗ mới, nửa bao đứng lại, **lệch 450 mm**, không cảnh báo.
  Cùng gốc với `G-M1-08` (poché không neo được với hồ sơ nhập vào — 0/126–161 mảng tô có đường bao).
  ⚠️ **Đây là ẩn số.** Nếu chỉ cần nhóm hai hình lại thì gọn. Nếu phải dựng lại mô hình "tường là
  MỘT vật" thì nó ăn sang cả `lib/cad` và có thể thành **hai đợt**. Phải đào 1 phiên riêng để đo
  trước khi hứa lịch.
- `G-M1` còn 10 đỏ — CAD/bản vẽ.
- `G-M8` (4 đỏ) — port 3 màn Workspace: `Bảng việc` · `Lịch · Nhắc việc` · `Tiến độ · Gantt`.
  Chỉ làm được SAU khi Đ2-1 có model Task. Port trước là vẽ vỏ rỗng.
- Dọn nốt: 3 model `Lark*` đánh dấu DEPRECATED ở đợt 2 — **chỉ xoá `LarkPersonRef`/`LarkUserMap`**
  nếu dữ liệu đã sang `ExternalRef` đủ. `LarkTaskRef` GIỮ LẠI làm cache (xem Đ2-1 việc 1 điểm ②).

> 🚫 **ArchiNote không nằm trong bất kỳ đợt nào.** Chốt 07/08. Hai dòng `G-M9-02` `G-M9-03` đã hạ
> xuống ⚪ hoãn trong `GAP-IF.md` — chúng mô tả một app **chưa tồn tại**, không phải lỗ hổng của IF.
> Sổ nay còn **58 đỏ** (trước 60).

## Đợt 4 · GIAO DIỆN CÒN LẠI — chặn ngược lên Claude Design
`G-M5` còn ~10 đỏ, và phần lớn **không phải lỗi code — là màn CHƯA TỪNG ĐƯỢC VẼ**.
Ví dụ `G-M5-01`: cụm "nhập bản vẽ có sẵn" (chọn tệp → tiến độ → nút huỷ → báo cáo nạp) —
grep 67 trang mock cho "nhập bản vẽ"/"báo cáo nạp"/"tiến độ nhập" = **0**.
Năng lực đã có ở `G-M1-01`, nhưng chưa ai vẽ nên port xong không biết đặt vào đâu.
⇒ **Việc cho Claude Design phải chạy TRƯỚC đợt 4, song song với đợt 3.**
Chia đợt ≤4 màn/prompt (bài học 06/08: brief 11 màn một mạch thì hư từ màn thứ 5 —
*chia đợt không phải một câu dặn trong prompt, chia đợt là chia PROMPT*).

## Đợt 5 · TRUNG TÍNH + PHÁP LÝ — không sửa thì không bán được
Bảng đầy đủ: `docs/AUDIT-BRAND-PII.md`. Tóm:
| Mục | Rủi ro |
|---|---|
| `content-deck.ts:113` hardcode `DETECH · CONCEPT` lên **mọi deck user sinh** | khách A mở ra thấy tên khách B |
| 53 ảnh render của khách thật (`public/wallpapers/ttt-*` `covers/` `detech/`) | bản quyền hình + lộ hồ sơ khách |
| `package.json` author + appId `com.ttt.*`; Android `com.tttarchitects.*`; cert installer | sản phẩm global mang tên một studio |
| Mật khẩu test trong comment (`IntroSequence.tsx:21`) | bảo mật |
| 3 route mẫu công khai (`/present` `/demo-amanoi`, deck `IKI Village`) | lộ dự án thật |
| **GPL-3.0 của `libredwg-web`** | `docs/LICENSE-NOTES.md` miễn trừ dựa trên "tool nội bộ, không bán" — **lập luận này chết** với định vị global. Phương án: `docs/RESEARCH-DWG-LICENSE.md` |

⚠️ Mục giấy phép nên **quyết sớm, đừng để tới đợt 5** — nếu phải đổi thư viện đọc DWG thì nó kéo
theo `lib/cad`, tức phải làm TRƯỚC hoặc CÙNG đợt 3, không phải sau.

## Đợt 6 · ĐÓNG GÓI + NGHIỆM THU
- ~~`npx next build`~~ ✅ xong 07/08. Còn lại: đóng `G-M11-02` (8 trang vượt ngưỡng First Load JS).
- Đo hiệu năng runtime + kích thước bundle (chưa đo lần nào).
- Đóng gói Electron, thử trên máy sạch.
- Chạy tay đầu-cuối một dự án thật: nhập bản vẽ → bố trí → BOQ → xuất PDF/xlsx → giao việc.

---

## Ba điều KHÔNG nằm trong đợt nào — dễ rơi
1. ~~**`next build`**~~ ✅ **XONG 07/08 — XANH.** Hoà chạy máy thật: 84 route · 46 trang tĩnh ·
   0 lỗi · kiểm kiểu PASS. Nền đứng được, 4 phiên đợt 2 chạy được. Build lộ thêm 2 mục mới:
   `G-M11-01` (cảnh báo `jose` Edge Runtime, chưa hỏng) · `G-M11-02` (8 trang nặng, xếp đợt 6).
2. **Quyết giấy phép DWG** — quyết muộn thì đắt gấp nhiều lần.
3. **Bản chạm/tablet** — chốt "nổi giữa, không dính đáy" (07/08) chỉ đúng cho desktop.
   Có bản chạm thì phải mở lại chốt đó, KHÔNG tự suy ra.

---

## ▣ PHIẾU Đ2-5 — MẢNG 3D  ⟨cửa sổ MỚI: `5·ba-chieu`⟩
> 🔴 **Phiếu bổ sung 07/08 — Hoà bắt được TỔNG bỏ sót.** Bốn phiếu Đ2-1→Đ2-4 soạn buổi sáng
> nhắc tới mảng 3D **0 lần**, trong khi nó là 12.737 dòng code. Đây là lỗ hổng của TỔNG, không
> phải của phiên nào.

### Bằng chứng bị bỏ quên (đo 07/08)
| Đo | Kết quả |
|---|---|
| Code 3D | **12.737 dòng / 64 file** — `lib/three` 4.151 · `components/render-studio` 5.111 · `components/three` 1.750 · `lib/render-studio` 931 · `lib/render-core` 794 |
| Dòng trong `GAP-IF.md` | **2** (`G-M2-02` · `G-M2-05`) |
| Đối chứng CAD | 156 file → **20 dòng sổ** |
| Test lớp giao diện | `components/three` **0/8** · `components/render-studio` **0/19** |
| Đối chứng `lib/cad` | **76 test / 156 file** |
| Component mồ côi | 0 — ✅ đều có nơi mount |
| Trang thật | `app/dev-bench-3d-2/page.tsx` **137 dòng** · `app/projects/[id]/render/page.tsx` **24 dòng** |

⇒ 12,7k dòng động cơ, **161 dòng vỏ**. Đây là ca "động cơ mạnh, vỏ mỏng nhất" của cả repo.

### ⚠️ CHẶN TRƯỚC — mock chưa có trong repo
Hoà xem 4 màn 3D trong cửa sổ **Claude Design** ngày 07/08 (chọn khối · kéo mặt có nhãn `2 700` ·
dock công cụ mở rộng · không chọn gì). Truy chuỗi trong ảnh:
| Chữ trong ảnh | Ở đâu |
|---|---|
| "Dựng ảnh AI" · "Khoá vị trí" | `docs/mocks/mock-3d-frame.html` (35 KB, 06/08) |
| "Khối tường" | `docs/mocks/InteriorFlow 05 Máy quay.html` |
| **"Góc nhìn trục giao"** · **"Dock công cụ"** | 🔴 **KHÔNG có trong repo** |

⇒ Bản Hoà xem là **bản mới, chưa lưu**. Đóng cửa sổ Design là mất.
**BƯỚC 0 phải lấy mock về TRƯỚC** (lệnh ở mục kế). Chưa có file thì phiên code KHÔNG được bắt đầu —
port theo trí nhớ vi phạm §0o (cấm mô tả nguồn từ trí nhớ).

### Mock 3D đã có trong repo (đời cũ, `.html` không phải `.dc.html`)
| File | KB | Ngày |
|---|---|---|
| `docs/mocks/mock-2d-ky-thuat_cu.html` | 78 | 06/08 |
| `docs/mocks/mock-if-3chang.html` | 56 | 02/08 |
| `docs/mocks/mock-3d-thong-nhat.html` | 53 | 06/08 |
| `docs/mocks/mock-3d-frame.html` | 35 | 06/08 |
| `docs/mocks/2D Kỹ thuật.dc.html` | 78 | 06/08 (đời mới) |

⚠️ **5 file, chồng lấn nhau, chưa ai chốt bản nào là chuẩn.** Đó chính là lý do mảng này bị trôi:
không có bản chốt thì không ai dám port. Việc 1 của phiếu là chốt.

### 🔷 BƯỚC 0 — dán vào cửa sổ **Claude Design** NGAY (không chờ 11/8)
```
Xuất toàn bộ màn 3D bạn vừa vẽ (màn có "Dựng ảnh AI", "Khối tường",
"Góc nhìn trục giao", dock công cụ mở rộng) thành file .dc.html hoàn chỉnh,
tự chứa, mở được bằng trình duyệt.

Tên file: 3D Dựng khối.dc.html

Đủ 4 trạng thái đúng như đã vẽ:
  ① chọn một khối tường — hiện gizmo trục + tấm thông số bên phải
  ② kéo mặt lên — hiện nhãn số sống "2 700" bám con trỏ
  ③ dock công cụ mở rộng — 3 nhóm CHỌN · VẼ · DỰNG KHỐI + BIẾN ĐỔI · ĐO ĐẠC
  ④ không chọn gì — tấm phải rỗng, có dòng gợi ý

Ràng buộc:
- KHÔNG dc-import trỏ file ngoài — mọi thứ trong 1 file
- Xoá hết chữ PLACEHOLDER
- Màu dùng var(--…), không hardcode hex
- line-height ≥ 1,5 (dấu tiếng Việt bị cắt nếu thấp hơn)
- backdrop-filter TỐI ĐA 4 chỗ (bản cũ 2D Kỹ thuật có 12 — quá luật)
- nút quyết định phải có CHỮ, không chỉ icon
- avatar tròn; nhóm = nhiều tròn đè nhau

Xuất xong đưa tôi nội dung file để lưu vào docs/mocks/.
```
Nhận được → Hoà lưu vào `docs/mocks/3D Dựng khối.dc.html` → TỔNG ghi 1 dòng vào
`docs/SO-PHIEU-DA-PHAT.md` → mới thả phiếu code bên dưới.

### 🔶 PHIẾU CODE — dán khi limit reset (11/8), SAU khi có mock
```
Bạn là phiên CODE. Đọc docs/00-BAT-DAU-DOC-DAY.md trước, tuân N1–N8 và V6 (KHÔNG commit).
SỞ HỮU DUY NHẤT: lib/three/ · components/three/ · lib/render-core/ · lib/render-studio/
                 · components/render-studio/ · app/dev-bench-3d-2/ · app/projects/[id]/render/
CẤM chạm: prisma (Đ2-1) · lib/boq lib/ffe (Đ2-2) · components/cad (Đ2-3) · components/library (Đ2-4)

BỐI CẢNH — đừng tin, kiểm lại bằng grep:
Mảng này có 12.737 dòng động cơ nhưng chỉ 161 dòng vỏ (2 trang). Sổ GAP chỉ có 2 dòng cho
nó, KHÔNG phải vì nó lành — vì chưa ai đi soi. components/three và components/render-studio
có 0 test trên tổng 27 file. Nhiệm vụ đợt này là DỰNG VỎ + LẬP SỔ, không phải viết thêm động cơ.

VIỆC 1 — CHỐT BẢN MOCK CHUẨN (làm trước, 15 phút)
  Có 5 mock 3D chồng lấn: 3D Dựng khối.dc.html (mới nhất, BẢN CHUẨN) · 2D Kỹ thuật.dc.html
  · mock-2d-ky-thuat_cu.html · mock-3d-thong-nhat.html · mock-3d-frame.html · mock-if-3chang.html
  Đọc cả bộ, lập bảng "màn/cụm nào ở file nào, file nào thay file nào".
  Ghi vào M-OUT. ĐỪNG xoá file nào — chỉ lập bảng, TỔNG quyết xoá sau.
  ⇒ Đây là gốc khiến mảng 3D bị trôi 2 tuần: không có bản chốt thì không ai dám port.

VIỆC 2 — PORT VỎ theo bản chuẩn (ƯU TIÊN CAO NHẤT — Hoà chốt "ưu tiên giao diện trước")
  Port 3D Dựng khối.dc.html vào components/three + components/render-studio.
  Đủ 4 trạng thái ①→④. Nối vào app/projects/[id]/render/page.tsx (nay mới 24 dòng).
  Luật port: màu về var(--…) · line-height ≥1,5 · backdrop-filter đếm lại TOÀN REPO ≤4 (G9)
  · nút có CHỮ (G6) · 0 chữ PLACEHOLDER còn sót.
  Nghiệm thu N6 từng trạng thái: mở trình duyệt thật, chụp màn. Trạng thái nào chỉ có vỏ chưa có
  ruột ⇒ ghi rõ "vỏ xong, ruột chưa", ĐỪNG khai xong.

VIỆC 3 — LẬP SỔ cho mảng 3D (việc chống-quên, quan trọng ngang việc 2)
  Đi soi 12.737 dòng, liệt kê mọi lỗ hổng tìm được theo mẫu dòng GAP.
  Ghi vào M-OUT mục "ĐỀ XUẤT DÒNG GAP MỚI" — TUYỆT ĐỐI KHÔNG tự ghi vào docs/GAP-IF.md
  (§0u: một ngòi bút, chỉ TỔNG ghi sổ đó).
  Mỗi dòng đề xuất phải có `file:dòng` (N8). Soi tối thiểu:
   · hàm export nào 0 nơi gọi từ UI
   · trạng thái lỗi/chờ khi dựng ảnh chạy lâu — có hiện ra không
   · 27 file giao diện 0 test — cái nào đáng viết test nhất
   · G-M2-02 (2D và 3D đọc hai nửa khác nhau của cùng bức tường) còn đúng không
   · G-M2-05 (chặng 3D không có Hoàn tác) còn đúng không

VIỆC 4 — Hoàn tác cho chặng 3D (G-M2-05), CHỈ nếu việc 2 xong sớm.
  ⌘Z hiện không làm gì và không báo gì. Tối thiểu: báo cho người dùng biết chưa hỗ trợ,
  đừng im lặng. Sửa thật thì tốt, nhưng ĐỪNG hy sinh việc 2 để làm việc này.

BÁO CÁO: docs/M-3D-OUT.md (file MỚI). Mỗi việc một mục, mỗi kết luận một dòng `file:dòng` (N8).
Việc nào không verify được ⇒ ghi "CHƯA VERIFY" + lý do. Cấm suy đoán (N1).
```

---

## ▣ PHIẾU Đ2-6 — ĐI SOI 14 MẢNG LỌT LƯỚI (chỉ LẬP SỔ, KHÔNG sửa code)
> 🔴 **Phiếu bù thứ hai, 07/08.** Chạy lệnh §0x sau khi Hoà bắt được mảng 3D → lộ ra **không phải
> 1 mảng bị quên mà 14**, tổng ~24.600 dòng nằm ngoài mọi phiếu.

### Kết quả đối chiếu §0x (đo 07/08 — dán nguyên, không tô hồng)
| Mảng | dòng | dòng sổ | tỷ lệ |
|---|---|---|---|
| `lib/nodes` | 4.963 | 1 | 4.963 : 1 |
| `lib/vision` | 2.962 | 3 | 987 : 1 |
| `components/nodes` | 2.556 | 1 | 2.556 : 1 |
| `components/entry` | 2.387 | **0** | ∞ |
| `components/photo-editor` | 2.205 | **0** | ∞ |
| `components/notebook` | 1.319 | 1 | 1.319 : 1 |
| `components/print` | 1.258 | **0** | ∞ |
| `lib/colors` | 1.233 | 1 | 1.233 : 1 |
| `lib/photo-editor` | 1.157 | **0** | ∞ |
| `lib/legal` | 1.086 | **0** | ∞ |
| `components/intro` | 1.016 | **0** | ∞ |
| `components/colors` | 865 | 1 | 865 : 1 |
| `components/filemanager` | 828 | 1 | 828 : 1 |
| `lib/commands` | 812 | **0** | ∞ |

### ⚠️ Ca nặng nhất KHÔNG nằm trong bảng trên
`components/present-editor` **13.696** + `lib/present-editor` **13.431** = **27.127 dòng · 1 dòng sổ**.
Lọt khỏi danh sách "lọt lưới" chỉ vì nó CÓ tên trong phiếu Đ2-2 — nhưng ở đó nó chỉ được nhắc để
**nối một cái nút**. Ruột chưa ai soi. Đây là mảng lớn **thứ hai cả repo**, sau `lib/cad` (36.296).
`components/studio` 5.744 dòng / 1 dòng sổ cũng cùng dạng.

### Vì sao KHÔNG mở 14 phiếu sửa
Chưa biết trong đó có gì thì không viết được phiếu sửa — sẽ thành đoán. Phiếu này chỉ làm **một
việc**: mở nắp, ghi sổ. Sửa là chuyện của đợt 3 sau khi đã biết mình đang sửa cái gì.

```
Bạn là phiên KIỂM TRA (không phải phiên sửa). Đọc docs/00-BAT-DAU-DOC-DAY.md, tuân N1–N8, V6.
⛔ TUYỆT ĐỐI KHÔNG SỬA MỘT DÒNG CODE NÀO. Chỉ đọc và ghi báo cáo.
   Thấy lỗi rõ ràng cũng ĐỪNG sửa — ghi vào sổ, đợt 3 sửa. Sửa lúc này là đụng thư mục
   của 5 phiếu khác đang chạy song song (§0w).

NHIỆM VỤ: soi 16 mảng dưới đây, mỗi mảng ghi tối đa 8 dòng đề xuất GAP.
Thứ tự ưu tiên (làm từ trên xuống, hết giờ thì dừng, ghi rõ dừng ở đâu):
  ① present-editor (lib + components)  27.127 dòng · 1 dòng sổ  ← NẶNG NHẤT
  ② nodes (lib + components)            7.519 dòng · 2 dòng sổ  ← canvas, lõi sản phẩm
  ③ components/studio                   5.744 dòng · 1 dòng sổ
  ④ lib/vision                          2.962 dòng · 3 dòng sổ
  ⑤ photo-editor (lib + components)     3.362 dòng · 0 dòng sổ
  ⑥ components/entry                    2.387 dòng · 0 dòng sổ
  ⑦ components/notebook · components/print · lib/colors · components/colors
  ⑧ lib/legal · components/intro · components/filemanager · lib/commands

MỖI MẢNG soi đúng 5 câu hỏi này, không lan man:
  1. Hàm export nào 0 nơi gọi từ UI?  (grep tên hàm ra ngoài thư mục)
  2. Component nào 0 nơi mount?       (luật N6)
  3. Thao tác chạy lâu (>1 giây) nào KHÔNG có trạng thái chờ / báo lỗi?
  4. Có tên khách hàng / brand studio nào hardcode không? (luật trung tính)
  5. Có mock nào trong docs/mocks/ ứng với mảng này mà chưa port không?

MỖI DÒNG ĐỀ XUẤT phải có `file:dòng` (N8). Không có `file:dòng` ⇒ không được ghi.
Cấm suy đoán (N1). Không chắc ⇒ ghi "nghi, chưa xác minh" + cách xác minh.

⛔ KHÔNG tự ghi vào docs/GAP-IF.md — §0u, một ngòi bút, chỉ TỔNG ghi sổ đó.
BÁO CÁO: docs/M-SOI-14-MANG-OUT.md (file MỚI), mục "ĐỀ XUẤT DÒNG GAP MỚI" chia theo mảng.
Đầu báo cáo ghi: soi được mấy mảng / 16, dừng ở mảng nào, vì sao.
```
