# IF · TRÍ NHỚ AUDIT — phương pháp và phát hiện, đã phân loại

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> ## ⭐ BÁO CÁO AUDIT LÀ BẰNG CHỨNG, KHÔNG PHẢI THẨM QUYỀN.
>
> Mọi phát hiện phải mang đúng MỘT nhãn trước khi ai đó hành động:
> `LỖI ĐÃ XÁC NHẬN` · `NỢ ĐÃ XÁC NHẬN` · `LUẬT XUNG ĐỘT` · `BẰNG CHỨNG CŨ` ·
> `BÁO ĐỘNG GIẢ` · `HƯỚNG THIẾT KẾ` · `CẦN CON NGƯỜI QUYẾT`.
>
> **Phát hiện đúng + phân loại sai = hành động sai.** Ca chứng minh: §C-01.

Lập 23/08/2026. Vai đọc tệp này: skill `.claude/skills/if-audit/`.
Nguồn chưng cất: `docs/design-campaign/02-FAILURE-LEDGER.md` (F-01…F-14) ·
`01-CLINICAL-UI-AUDIT.md` · `06-DESIGN-KNOWLEDGE-AUDIT.md` · `07-SOI-HOME-23-08.md` ·
`scripts/soi-cam-dien.mjs` · `scripts/soi-foundation.mjs` · `docs/bao-cao-phien/2026-08-23-*.md`.

---

# PHẦN I · PHƯƠNG PHÁP — thứ đắt hơn từng phát hiện lẻ

## M-01 · Reachability đi qua máy, không qua grep
`npm run soi:cam-dien`. Nó giải `@/` · `./` · `../` · thiếu đuôi · `index.ts` · `import()` động ·
`new Worker(new URL(…, import.meta.url))`. Grep không giải được cái nào trong số đó.
**Bằng chứng vì sao:** F-03 (`lib/lighting` báo chết, thật ra `rules-3d.ts:31` gọi) và **F-12**
(`lib/distill` báo 0 caller, thật ra 3 caller + 2 adapter) — **cùng một lớp lỗi, cách nhau một
đợt sóng, sau khi F-03 đã được viết ra trong cùng ngày**. ⇒ Luật không phải *"cẩn thận hơn"*,
luật là *"câu hỏi này không được phép trả lời bằng grep"*.

## M-02 · Máy soi phải tự chứng minh, im lặng không phải là sạch
Mỗi họ luật khai: **tệp quét · ứng viên thấy · vi phạm · miễn trừ**. `ứng viên = 0` khi sản phẩm
rõ ràng có thứ đó ⇒ **PHÉP ĐO HỎNG** (mã thoát **2**), khác hẳn mã 1 (vi phạm thật).
Luật này đã thành mã, đọc ở `scripts/soi-foundation.mjs` đầu tệp. Gốc: F-04, `soi-cam-dien`
in `⚡ 0` khi có 5 entry sai.

## M-03 · Xanh trên nền đã biết là bẩn ⇒ nghi phép đo trước
F-13: `F-MAT-VOCAB` báo PASS lần chạy đầu, mâu thuẫn bằng chứng đã biết (G0–G3 xuất hiện 0 lần
trong sản xuất) ⇒ điều tra ⇒ mẫu dò khớp trúng *"luật G1"* trong chú thích. **Xanh trái với
điều đã biết thì không được gửi vào ngân hàng, phải mổ.** Kiểm bằng probe: 1164 → 1168 → 1164.

## M-04 · Bóc chú thích trước khi khớp
Chỉ nhận **dạng token thật**, không nhận từ trần (`\bG[0-3]\b` là mẫu sai). Ca phụ cùng lớp:
`uppercase` ra 6 kết quả, **cả 6 trong chú thích**, mã sống đã sạch.

## M-05 · Bốn danh tính không được lẫn: NGUỒN / DEV / BẢN DỰNG / ẢNH ĐÓNG BĂNG
`:3777` phát hành đóng băng · `:3778` bản dựng cũ · `:3799` mã hiện tại — nhìn giống hệt nhau.
Mã mới soi trên bản dựng cũ = **PENDING-REBUILD**, không phải xanh (F-08). Hỏi
`/api/dev-identity` trước khi kết luận bất cứ điều gì về giao diện.
Kèm **F-09**: một cây = **đúng một** dev server; `pgrep next dev` mù, phải `pgrep -f`.

## M-06 · Thang sự thật không được xẹp
`ENGINE CÓ → DÂY ĐÃ NỐI → NGƯỜI DÙNG VỚI TỚI → APP THẬT ĐÃ CHẠY → MẮT ĐÃ DUYỆT`.
Thư mục / ký hiệu / test xanh **không bao giờ** hàm ý sản phẩm (F-04).
Giới hạn của chính `soi:cam-dien`, nó tự in mỗi lần chạy: nó chứng minh **có đường dây**,
không chứng minh **có nút bấm** — engine nằm sau nhánh `if` chết vẫn được tính là 🟢.

## M-07 · Bằng chứng phải có phạm vi
Mẫu rộng không bao giờ tự-xanh. Phạm vi hợp lệ: đường chạy chính xác · tên xuất chính xác ·
id năng lực đã đăng ký · quyền sở hữu route/component. Bằng chứng lẫn lộn = **CẢNH BÁO**, không
bao giờ là hoàn thành (F-05). Và 20 màu đỏ không sửa được thì dạy người ta bỏ qua máy soi —
nên tầng bằng-chứng-rộng cố ý là cảnh báo, không phải lỗi.

## M-08 · Cấm dọn cho xanh
Máy soi được thoả mãn mà hành vi không đổi = **bẫy đã tháo ngòi**, tệ hơn đỏ (F-06: thêm chữ
`-webkit-` vào chú thích của tệp không hề dùng `backdrop-filter`). Báo động giả thì **BÁO CÁO**,
không xoá.

## M-09 · Có mặt ≠ có tác dụng — lớp lỗi tốn kém nhất
Bốn ca cùng họ: import chỉ-kiểu được đếm là caller (F-04) · khớp trúng văn xuôi (F-03/F-12/F-13) ·
lưới chứng minh khúc xạ đặt **sau một bề mặt đục** (F-14). Vật **có ở đó và không làm gì cả**.
Guard hiện có kiểm **kho hàng**, không kiểm **đấu nối** — đây là lỗ chưa vá của cả bộ máy soi.
**Luật F-14:** một vật chứng minh phải **nêu tên bề mặt nó tác động lên**, và bề mặt đó phải
nhận được tác động.
**Đính chính F-14 cùng ngày, Hoà lật:** khi bằng chứng cho thấy vật không làm được điều nó tuyên
bố, mặc định phải hỏi **"có phải nó bị dựng sai không"** TRƯỚC khi hỏi **"có phải tuyên bố sai
không"**. Hạ tham vọng cho vừa một bản dựng hỏng là cách **trông có vẻ hợp lý nhất** để đánh mất
chữ ký của sản phẩm.

## M-10 · Trạng thái "khoẻ" vẫn là một tuyên bố — kiểm tiền đề của nó
F-02: Vitals báo `calm` trong khi cả hai nguồn đọc đều 401. `calm` không phải im lặng, nó là
câu *"đã đọc, không có gì cần chú ý"* — mà phép đọc đã hỏng. Ba trạng thái phải tách:
`calm` (đọc được, sạch) · im (không có ngữ cảnh) · **không rõ / không đọc được**.
⚠️ Cả MAIN lẫn lane QA **đều khen ca này là đúng**, dùng chính cụm từ mô tả căn bệnh của nó
(*"nói dối bằng một con số thật"*). Hoà bác. ⇒ **Đồng thuận giữa các agent không phải bằng chứng.**

## M-11 · Biết luật bằng chữ ≠ nhận ra vi phạm bằng mắt
Ca 23/08 (`06-DESIGN-KNOWLEDGE-AUDIT` §đính chính): `components/home/BeMatHome.tsx:11-17` —
docstring của **chính tệp dựng bố cục Home** — chép sẵn đúng luật cấm lưới thẻ đều, gọi tên đúng
cả hai lần trượt trước (20/08, 22/08), phát biểu đúng cách hiểu đúng. Rồi vẫn giao ra một tường
thẻ trắng. ⇒ Chẩn đoán *"lỗi định tuyến, không ai đọc"* **SAI**. Luật thiếu **cách đối chiếu bằng
hình**. Với audit: đừng bao giờ kết luận *"vì họ chưa đọc luật"* khi chưa mở tệp ra xem họ có
chép luật vào đó không.

## M-12 · Phải tự nhìn ảnh, không suy từ CSS
Lane HOME 23/08 tính bố cục bằng số CSS, chưa mở Home lần nào, ra tường thẻ trắng; Hoà mở app,
nói đúng một chữ **"XẤU"**. Audit giao diện phải **đọc tệp ảnh bằng công cụ Read**, và ghi vào
báo cáo *"agent đã tự mở ảnh: CÓ/KHÔNG"* (khuôn `07-SOI-HOME-23-08.md` §① làm sẵn ô này).

## M-13 · Khẳng định trong chú thích không phải bằng chứng
F-01: một chú thích khẳng định *"thứ này thuộc khí quyển, không phải widget"* nằm **ngay trên**
đoạn mã vẽ ra đúng cái widget đó. **Lời khai và mã bất đồng, và chỉ lời khai được đọc.**
⇒ Trong audit, chú thích là *giả thuyết cần kiểm*, không phải *dữ kiện*.

## M-14 · Không dùng AI để kiểm thứ đo được
Tất định · 0đ · chạy 10 lần ra 10 kết quả giống nhau · dẫn được điều khoản (Hoà chốt 15/08).
Kích thước · khoảng cách · diện tích · tỷ lệ · độ rọi · chồng lấn · thiếu trường bắt buộc —
tất cả viết thành luật máy, không hỏi model.

---

# PHẦN II · PHÁT HIỆN — đã phân loại

Cột **Hạn dùng** = kết luận dựa trên bản dựng/ảnh nào, ngày nào. Quá mốc đó phải đo lại.

## C-01 · Rail tự mâu thuẫn về auto-hide — `LUẬT XUNG ĐỘT` 🔴 CHỜ NGƯỜI QUYẾT
| | |
|---|---|
| Bằng chứng | `components/nav/RailDieuHuong.tsx:22` (§6.1 cấm tự thu **theo bề rộng cửa sổ**) ↔ `:154` + `:372` (§8 tự thu **khi chuột rời**, có ân hạn, trừ khi ghim) |
| Vì sao KHÔNG phải lỗi | khác **trigger**, không trái chữ của §6.1 |
| Vì sao vẫn phải xử | trái đúng **cái lý do** §6.1 đưa ra (*"cấm auto-hide"* là thứ bị chê nặng nhất ở cả 4 app đối thủ đã khảo — `SPEC-PANEL-ROLLOUT-IDF`) |
| Hành động đúng | **trình người quyết**. Sửa như một lỗi = xoá một hành vi đã thiết kế có chủ ý |
| Hạn dùng | mã tại `c7f3ac8`, 23/08 |

## C-02 · Bề rộng nấc hẹp nhất của rail: 28 hay 52-56 — `LUẬT XUNG ĐỘT` 🔴 MỞ
`HOP-DONG-CAU-TRUC-DIEU-HUONG.md §5` + bản vẽ đã duyệt (`--w-dinh-vi:28px`, 16/08) ↔
`CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 4 (*"Rail 52-56"*, 20/08). Lane RAIL dựng theo **28**
và **khoá bằng test** (`muc-dieu-huong.test.ts` [7]) để không ai đổi một chiều rồi quên báo — cách
xử đúng cho một xung đột chưa đóng. Đổi sang 52 rẻ: một hằng số + một dòng test + nút nấc 24→32px.
**Hạn dùng** 23/08.

## C-03 · Trạng thái "không đọc được" chưa có chủ sở hữu ngữ nghĩa — `LỖI ĐÃ XÁC NHẬN`, HỆ THỐNG, MỞ
Gồm luôn **F-02 false calm**. Bằng chứng cấu trúc (`01-CLINICAL-UI-AUDIT` §B2, 22/08, `:3778`):
**ba** hành vi khác nhau cho **cùng** điều kiện chưa-đăng-nhập — ① dựng vỏ đầy đủ + dữ liệu 401
(10 màn) · ② ở nguyên URL, không vỏ (3D) · ③ ra màn đăng nhập (`/`).
⇒ Sửa riêng false calm là vá một triệu chứng. **Đây là mục số 1 trong thứ tự đề xuất.**
**Hạn dùng** bản dựng `:3778` 22/08 — đo lại trước khi thi công.

## C-04 · `Untitled flow` ở vỏ ứng dụng, 10/13 bề mặt — `LỖI ĐÃ XÁC NHẬN`, HỆ THỐNG, MỞ
Không phải fixture: là tên mặc định thật (`ProjectSelect.tsx:739` · `FlowsPanel.tsx:85` ·
`WelcomeIntro.tsx:51`). Bệnh nằm ở **chỗ hiển thị** (shell dùng chung), không ở dữ liệu ⇒ sửa
một chỗ. **Hạn dùng** 22/08, `:3778`.

## C-05 · 3D không có vỏ trong khi 2D cùng dự án dựng đầy đủ — `LỖI ĐÃ XÁC NHẬN`, MỞ
`/projects/<id>/render`: không rail, 11 nút, 4/8 icon — **chữ ký giống hệt màn Login**; 2D cùng
dự án cùng phiên: rail ✓, canvas 1338×712, 101 nút. Không phải *"3D nặng nên chưa tải"*.
⇒ nghi **định tuyến/gating**, không phải UI. **Hạn dùng** 22/08, `:3778`, **phiên chưa đăng nhập**.

## C-06 · Icon trộn nguồn 13/13 bề mặt · trôi cỡ chữ 4→11 — `NỢ ĐÃ XÁC NHẬN`
Nặng nhất Settings 65/75 (10 svg ngoài hệ); Files và Library mỗi màn 11 cỡ chữ. Thật, nhưng là
**hoàn thiện** — xếp sau C-03/C-04/C-05. Máy canh đã có: `soi:foundation`. **Hạn dùng** 22/08.

## C-07 · Home chưa từng được đo bằng mắt trong đợt khám lâm sàng — `BẰNG CHỨNG CŨ` / BLOCKED
`01-CLINICAL-UI-AUDIT` xếp Home là **BLOCKED**: `/` ra màn đăng nhập. Việc gỡ đồng hồ ánh sáng
được chứng minh ở **tầng bundle** (`05:00`/`20:00` = 0 chunk), **không phải bằng ảnh**.
Đến 23/08 `07-SOI-HOME-23-08.md` mới soi được Home thật (đăng nhập, 1440 + 1100, agent tự mở ảnh).
⇒ Mọi câu về Home trích từ bản 22/08 đều **hết hạn**.

## C-08 · Bản vẽ Home cũ vs sản xuất — `HƯỚNG THIẾT KẾ`, không phải phát hiện audit
`MOCK-home-work-os.png` · `MOCK-home-sua-4-loi.png` là **bản vẽ**, dùng để so *ý định* với
*kết quả*, **không dùng làm chuẩn chấm** (`07-SOI-HOME-23-08` §③). Kho ví dụ XẤU có chú giải
(`.claude/skills/if-design/examples/BAD/**`) **chưa tồn tại** — đây là `NỢ ĐÃ XÁC NHẬN` và
`06-DESIGN-KNOWLEDGE-AUDIT` xếp nó là **phần sinh lời cao nhất** của cả Trường Thiết kế.

## C-09 · `soi-cam-dien` in `⚡ 0` khi có 5 entry sai — `BÁO ĐỘNG GIẢ` ✅ ĐÃ XỬ
Hai bug cộng dồn: `import type` được đếm là caller · cross-check chỉ nổ trên một nhãn bucket.
Đã sửa: máy thoát 1 khi vi phạm hợp đồng frontier, **đã kiểm bằng cách tiêm một hồi quy, xác nhận
nó nổ, rồi gỡ**. Luật rút ra thành M-02.

## C-10 · Guard `kinh-webkit-prefix` bị thoả mãn bằng chú thích — `BÁO ĐỘNG GIẢ` ✅ ĐÃ HOÀN NGUYÊN
Đã trả về đỏ một cách trung thực. Xem M-08.

## C-11 · Test chập chờn 1/5 lượt — `LỖI ĐÃ XÁC NHẬN` ✅ ĐÃ XỬ
`route.guard.test.ts` so `projectAssetUsage.count()` **toàn cục** trước/sau; ý định là *"tôi dọn
sau khi làm"*, mã lại khẳng định *"không ai trong pool `-P8` ghi vào bảng này"* — mà
`lib/server/promote.test.ts` ghi thật. **Không phải khoá SQLite** (giả thuyết cũ bị loại đúng lý do,
nhưng nguyên nhân thật là nhiễu số dòng liên tệp). Đã tái hiện trước khi sửa, xác minh sau: 4/4
xanh trong khi số đếm toàn cục vẫn trôi 18→20. **Luật: chỉ khẳng định về phạm vi của chính mình.**

## C-12 · Hai dev server trên một cây — `CẦN CON NGƯỜI QUYẾT` 🔴 MỞ (F-09)
`:3000` trả `/` → 404 cho người này, `/files` → 500 cho người kia. Hai `next dev` cùng ghi một
`.next`. Cả hai phiên đều bị chặn `kill` ⇒ cần người.

## C-13 · `lib/idfc-import` — engine 3.341 dòng, 0 nơi gọi lúc chạy — `LỖI ĐÃ XÁC NHẬN` (F-04)
64 test xanh, proof thật (ghế Lincoln), hai entry frontier ✅. Năm tệp chỉ gọi lẫn nhau: một hòn
đảo. **Hạn dùng:** đo tay 17/08 (`docs/nc/DO-ENGINE-7-MANH-2026-08-17.md`) — chạy lại
`soi:cam-dien` trước khi trích lại con số này.

## C-14 · Nhắm nhầm một mục tiêu đã bị thay thế — `BẰNG CHỨNG CŨ` (F-11)
MAIN giao dựng `claude-home-first-use.html`, một hướng đã bỏ, vì **đọc chỉ mục chứ không đọc phần
thay thế**. **Luật: giải quyết supersession qua chỉ mục trước khi giao việc; không chọn theo tên
tệp hay `mtime`.** Có MỘT Home với nhiều **trạng thái dữ liệu**; zero-state là một trạng thái,
không phải một màn riêng.

## C-15 · Các lớp mở mang từ phiên trước — chưa root-cause, giữ để không mất
Sọc test khúc xạ lọt vào kính sản xuất · panel cố định làm IF kém linh hoạt hơn công cụ chuyên
nghiệp · nhiều lớp chrome quanh canvas · sidebar mở đẩy nội dung · sidebar cũ vẫn với tới được ·
mock tồn tại trong khi bố cục sản xuất vẫn cũ · MAIN sửa CSS thay vì thi hành thiết kế · trộn thư
viện icon · tiếng Việt dịch sát nghĩa thô và trộn VI/EN không luật · danh tính tạm được nâng thành
danh tính sản phẩm. **Nhãn: chưa phân loại** — mỗi lớp phải đi qua 10 bước truy dấu trước khi ai
đó sửa.

---

# PHẦN III · HẠN DÙNG CỦA CẢ TỆP NÀY

| Nhóm | Dựa trên | Hết hạn khi |
|---|---|---|
| C-03 … C-06 | ảnh + đo DOM trên **`:3778`**, 22/08, **phiên chưa đăng nhập** | có một lượt đo lại **có đăng nhập** trên **`:3799`** |
| C-07, C-08 | `07-SOI-HOME-23-08`, ảnh `home-production/*` 22/08 17:38 | Home được dựng lại |
| C-01, C-02 | mã tại `c7f3ac8`, 23/08 | `components/nav/**` đổi |
| C-13 | đo tay 17/08 | chạy lại `soi:cam-dien` |
| M-01 … M-14 | luật rút từ ca thật | chỉ đổi khi có ca thật mới lật lại |

**Chưa đo được, cấm đoán (BLOCKED-NEEDS-HUMAN, theo `01-CLINICAL-UI-AUDIT` §E):** Lock ·
Session Ended · sidebar mở rộng/thu · Vitals 3 nấc · ToolWindow · Present editor thật · nội dung
Library/Gallery · trạng thái Material. Đợt khám 22/08 **không** kết luận được *"không còn bản sao
legacy"* — nó chỉ chứng minh được một chiều.
