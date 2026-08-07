# 00 · BẮT ĐẦU ĐỌC ĐÂY — mọi phiên, mọi vai, đọc trước khi làm bất cứ gì

> # ⛔⛔ LUẬT SỐ 0 — KIỂM TRƯỚC KHI PHÁT NGÔN ⛔⛔
> **Hoà ghim cứng 07/08. Đứng TRÊN mọi luật khác. Không ngoại lệ, không "lần này khác".**
>
> ## Cấm phát ngôn bất kỳ câu nào dưới đây khi CHƯA chạy lệnh kiểm:
> | Định nói | Bắt buộc chạy TRƯỚC |
> |---|---|
> | "chưa làm / chưa dán / còn thiếu" | `sed -n '<dòng>p' <file>` + `find docs -name "M-*OUT*.md" -mmin -40` |
> | "đã xong / đã sửa / đã đóng" | mở đúng file, đọc đúng dòng — **không tin báo cáo** (N1) |
> | bất kỳ CON SỐ nào | chạy lệnh đếm, rồi **kiểm tay 3 mẫu** (§0y) |
> | "sót việc / phiên X quên" | `grep "VIỆC N" <phiên>-OUT.md` TRƯỚC, rồi mới kiểm file |
> | "dán phiếu này" | §0z — kiểm đã dán chưa, kiểm phiên có đang chạy không |
> | "file/hàm/mã X là…" | `grep -rna` ra bằng chứng — cấm mô tả từ trí nhớ (§0o) |
>
> ## Ba câu tự hỏi trước khi gõ phím
> 1. **Câu này tôi ĐO hay tôi NHỚ?** Nhớ ⇒ chưa được nói.
> 2. **Lệnh tôi vừa chạy có đúng chỉ báo không?** Regex bắt hụt `export default`? `grep -c` đếm
>    dòng chứ không đếm việc? (§0y — sai 4 lần trong ngày 07/08 vì đúng chỗ này)
> 3. **Con số này nghe quá tốt hoặc quá xấu không?** Có ⇒ gần như chắc sai, kiểm lại.
>
> ## Đã trả giá — đừng lặp
> | Ngày | Ca | Hoà nói |
> |---|---|---|
> | 06/08 23:00 | báo PHU sót việc, PHU đã xong từ trước | *"nó xong từ nãy rồi bắt dán đi dán lại hoài v"* |
> | 07/08 | báo "146 chỗ vi phạm line-height" — regex sai, thật ra ĐẠT | — |
> | 07/08 | báo "30 file chết · 6.573 dòng" — regex không bắt `export default`, thật ra **0** | — |
> | 07/08 | khẳng định `/render` bị đá về `/cad` — ảnh chụp là **tab khác** | — |
> | 07/08 | đưa lại phiếu Hoà **đã dán rồi** | *"mày bị 1 lỗi bị hoài vậy, mày bị ngu hả"* |
>
> **Thà im 30 giây chạy lệnh, còn hơn nói một câu sai rồi bắt Hoà dọn.**
> Không kiểm được ⇒ ghi thẳng **"CHƯA VERIFY"** + lý do (N5). Cấm đoán, cấm suy luận thay đo.

**Lập 03/08/2026 bởi COWORK-TỔNG theo lệnh Hoà: "lưu lại hết, mỗi phiên đọc, nhớ những luật chúng ta đã đặt ra".**
File này là CỬA VÀO. Đọc hết file này (3 phút) rồi mới mở file khác.

---
## §1 · ĐANG LÀM GÌ — bối cảnh 30 giây
**InteriorFlow (IF)** = app máy tính cho studio nội thất. **ArchiNote** = app điện thoại anh em cùng nhà. Cùng một nguồn dữ liệu, ngược chiều nhau:
| | InteriorFlow | ArchiNote |
|---|---|---|
| Vai | **MÁY PHÁT** — tạo bản vẽ · mô hình · ảnh · hồ sơ | **MÁY THU** — thu số đo · ảnh hiện trường · ghi âm · tri thức |
| Thiết bị | máy tính (tablet phụ) | **điện thoại** |
| Nền mặc định | **TỐI**, accent tím `#6a57f5` | **KEM SÁNG**, vàng ấm ≤5%, tím ≤1% |
| Trợ lý tên là | **Vitals** | **Trợ lý** (KHÔNG gọi Vitals) |
| Có 3 chặng? | **CÓ**: Thiết kế 2D · Thiết kế 3D · Trình chiếu | **KHÔNG** |

**Bộ tên chính thức, dùng nguyên văn (04/08 [P7 ĐỔI TÊN] — Hoà chốt, IF1/IF2 gộp chung nên ngữ**
**nghĩa nhãn cần RỘNG hơn "kỹ thuật"; bản 03/08 CHỐT TÊN vòng cuối bên dưới GIỮ LÀM LỊCH SỬ):**
app **InteriorFlow** · 3 chặng **Thiết kế 2D · Thiết kế 3D · Trình chiếu** (EN: 2D Design · 3D
Design · Presenting; rút gọn: 2D · 3D · Trình chiếu) · 2 chế độ chặng 2D **Sơ phác ↔ Kỹ thuật** ·
2 chế độ chặng 3D **Node ↔ 3D**.
> Tên cũ (03/08 CHỐT TÊN vòng cuối, nay đã đổi nhãn — KHÔNG dùng nữa, chỉ giữ để tra lịch sử):
> app **InteriorFlow** · 3 chặng **2D Kỹ thuật · 3D Thiết kế · Trình bày** (rút gọn: 2D · 3D ·
> Trình bày) · 2 chế độ chặng 2D **Sơ phác ↔ Kỹ thuật** · 2 chế độ chặng 3D **Node ↔ 3D**.
❌ CẤM chữ: "Vẽ" · "Dựng ảnh" · "Rendering" · "Presenting" · "CAD ·" · "Cấu kiện" (làm nhãn mode).
⚠️ Khoá kỹ thuật trong code **GIỮ NGUYÊN** `sketch/pro/revit` · `concept/render/present` — đổi khoá = vỡ dữ liệu người dùng đã lưu.

**Định vị:** BIM của IF là **BIM nội thất** — nội thất (lớp hoàn thiện · tủ bếp · trần · sàn lát · vật liệu) là **ĐIỂM NHẤN, chỗ đầu tư sâu hơn thiên hạ**, vì Revit/ArchiCAD làm dở nhất chỗ đó. **KHÔNG có nghĩa kiến trúc giảm quan trọng** — tường, cửa, mặt cắt, hồ sơ kỹ thuật vẫn làm đủ, đúng chuẩn.

---
## §2 · BỐN LUẬT KIẾN TRÚC — dùng để BÁC mọi đề xuất sai
| # | Luật | Vì sao |
|---|---|---|
| **K1** | **Ba chặng là ba ỐNG KÍNH soi vào MỘT nguồn, không phải ba kho.** Cấm mọi hàm `syncXtoY` giữa các chặng. | Vẽ tường ở 2D thì 3D có khối; kéo cao ở 3D thì bản vẽ đổi theo — vì chỉ có một bản. Đây là thế mạnh DUY NHẤT không đối thủ nào có (Revit·SketchUp·D5 đều phải xuất-nhập). |
| **K2** | **Cấu kiện KHÔNG phải mode, không thuộc chặng nào — là TẦNG DỮ LIỆU dưới cả ba.** | Revit bị cắt đôi theo chiều: mặt bằng/ký hiệu/hồ sơ → chặng 2D; khối/vật liệu → chặng 3D; dữ liệu → tầng dưới. |
| **K3** | **Ngữ nghĩa KHAI BÁO thắng ngữ nghĩa SUY ĐOÁN.** Có `elementType` thì mọi ống kính phải nghe nó. Phải đoán thì gắn cờ `inferred` và UI hiện "suy đoán". | Ca bệnh: 3D đoán tường bằng `pattern==='SOLID'` → **vùng tô SƠN bị đùn thành tường cao 2,7m** giữa phòng. |
| **K4** | **Field mới chỉ thêm khi ĐÃ CÓ nơi tiêu thụ.** | Chống bệnh Revit — schema phình mà không ai đọc. |

---
## §3 · LUẬT TIỀN & QUYỀN — không được phá
| # | Luật | Ca bệnh thật |
|---|---|---|
| **T1** | **Kế toán tiền ở SERVER.** Client chỉ HIỂN THỊ số dư. | `/api/jobs` từng 0 dòng đụng credit, kế toán nằm ở client → gọi thẳng route là đốt tiền provider miễn phí |
| **T2** | **Không tin số tiền client gửi.** Cộng tiền phải đối chiếu sổ cái + chống hoàn 2 lần + giao dịch nguyên tử. | route refund từng cộng thẳng `amount` từ body → tự nạp triệu credit |
| **T3** | **Không tin loại tệp client khai.** Whitelist MIME bằng magic bytes phía server; trả `nosniff` + `attachment`. | upload thư viện → XSS lưu trữ chạy trên origin app |
| **T4** | Mọi route đụng `projectId` phải qua `lib/server/access.ts` (trả **404 chứ không 403** để không lộ dự án tồn tại). | |

---
## §4 · LUẬT GIAO DIỆN — 5 lỗi Hoà bắt được bằng mắt
| # | Luật | Ca bệnh |
|---|---|---|
| **G1** | **CẤM `animate opacity` trên phần tử có `backdrop-filter`** (và mọi tổ tiên). Fade thì fade `y`/`scale`/nội dung bên trong. | card đăng nhập "vào 1 giây rồi mới đục" — opacity<1 tạo backdrop root cô lập, kính mất nền thật lúc fade |
| **G2** | **Lớp nổi nền ĐẶC ≥92%** (popover ≥96%), kính chỉ là gia vị. Chữ đạt 4.5:1 với nền CỦA CHÍNH NÓ. | popover Vitals trong suốt, chữ chồng lên toolbar. Phân loại kính theo **cái nằm SAU nó**, đừng dùng chung một class |
| **G3** | **Cấm mount cùng một panel ở hai ổ.** Ổ khác muốn gọi thì `open()` vào store. | `VitalsGesturePanel` mount ở cả StatusBar lẫn StageSwitcher → hai Vitals trên màn |
| **G4** | **Mọi cỡ chữ phải khai `line-height` ≥1,5.** Cấm `text-[Npx]` trần và cấm `font:` rút gọn — cả hai xoá line-height → **cắt dấu tiếng Việt**. | banner phiên đăng nhập bị cắt ngang chữ · 162 chỗ trong mock dính lỗi này |
| **G5** | **z-index phải có thang khai báo**, không rải số tuỳ hứng. | banner `z-60` trùng đúng popover `zIndex 60` |
| **G6** | **Cấm icon hoá nút quyết định** (Xoá · Gửi khách · Xuất hồ sơ). Icon cho việc lặp hằng ngày; chữ cho việc bấm sai là trả giá. | |
| **G7** | **Bento chỉ cho màn TỔNG QUAN.** Màn làm việc (2D·3D·bảng nút·ảnh 360) vùng vẽ phải **liền một khối** — bento chia đều sự chú ý, còn lúc vẽ thì không muốn chia gì cả. | |
| **G8** | **Kéo thả không bao giờ là đường DUY NHẤT** — luôn có nút bấm tương đương. | công trường tay bẩn, găng tay, màn ướt |
| **G9** | **[P5 04/08] LUẬT KÍNH LỎNG `.glass-float`** (globals.css, cạnh `.vitals-pop`): nền `color-mix(var(--panel) 34%, transparent)` + `blur(var(--blur)) saturate(1.3)` + viền `--t1` 14% với **gờ trên sáng hơn** (26%, giả ánh sáng từ trên) + `box-shadow 0 8px 32px rgba(0,0,0,.28)`. Bo: khối = `var(--radius-lg)`; thanh/capsule thêm `.glass-float--bar` (999px). **CHỈ đúng 4 chỗ**: toolbelt trên canvas 3D (`ModeSwitchBar`) · nút "Dựng ảnh" (`Render3DModeSkeleton`) · ViewCube (`Viewport3D`) · thanh nổi trên ảnh render (`Lightbox`). **⛔ CẤM** cho Inspector · cây tầng · bảng vật liệu · popover Vitals · mọi panel >2 dòng chữ — chỗ đó dùng `.vitals-pop` (nền đặc ≥96%, sinh ra vì lỗi G2). ⚠️ `backdrop-filter` ăn hiệu năng trên canvas WebGL — **quá 4 tấm là giật**; muốn thêm tấm thứ 5 phải gỡ 1 tấm cũ. | kính lỏng quá trong mà đắp lên panel nhiều chữ = tái phát đúng lỗi G2 "popover trong suốt" |

---
## §5 · LUẬT NGHIỆM THU — cấm nói "xong" khi chưa đo
| # | Luật |
|---|---|
| **N1** | **Báo cáo của phiên KHÔNG phải bằng chứng.** Phải mở code đọc tận dòng, hoặc chạy test/grep. Đã bắt được 2 lần: spec ghi "đã có SUM()" (thật ra số chết) · báo cáo ghi "sửa 3 lỗ" (thật ra 1/3). |
| **N2** | **Đếm bằng `grep -c`, đừng đếm bằng trí nhớ.** |
| **N3** | **Vá thì VERIFY TAY trước.** Không tái hiện được lỗi thì DỪNG, báo lại — đừng vá mù. |
| **N4** | **Làm đủ chỉ tiêu ≠ làm đúng.** Chỗ nào chưa có dữ liệu nguồn thì ghi lý do tại chỗ, đừng gán bừa. *(Mẫu tốt: `cad-to-obj.ts:396` giải thích vì sao Floor không có `entityId`.)* |
| **N6** | **Tạo component mới thì phải CHỨNG MINH có nơi mount** — dán kết quả `grep -rn "<TênComponent>" --include=*.tsx components/ app/` vào báo cáo. Đã bắt 2 lần trong 2 ngày: `LeftRail.tsx` (144 dòng, xoá khỏi git ở `3a92170` nhưng còn nằm trên đĩa 8 ngày) · `HomeButton.tsx` (viết cẩn thận, xử lý đúng bẫy `enterAfterAuth()`, KHÔNG file nào gọi ⇒ app mất luôn đường về Gallery). Hệ đang sinh code nhanh hơn tốc độ nối dây. |
| **N7** | **Grep phải đúng CHỈ BÁO của việc đang kiểm, không phải chỉ báo gần đúng.** Sai 3 lần liên tiếp 04/08: COWORK-TỔNG dùng `grep -c MAX_SHEETS` để kết luận "D1 multi-sheet chưa làm" — nhưng `MAX_SHEETS` thuộc **D2**. Lại thấy `doc: Doc` ở `CadSheets.tsx:84` mà không đọc nó nằm trong `interface PersistedCadSheet` (shape IndexedDB, phạm vi **D3**). ⇒ Trước khi kết luận từ grep: **đọc dòng đó nằm trong hàm/interface nào**. ⇒ **Brief của TỔNG cũng phải kiểm, không phải sự thật** — git + code là sự thật duy nhất. (Phiên P2 làm đúng: không tin brief, kiểm code trước rồi mới trả lời.) |
| **N5** | **Khai thật cái chưa xong.** Chỗ chưa kiểm được ghi "CHƯA VERIFY". Thà thiếu còn hơn bịa. |
| **N8** | **MỌI DÒNG TRONG CHECKLIST/ĐỀ XUẤT PHẢI CÓ ĐƯỜNG DẪN FILE, HOẶC GHI RÕ `CHƯA GREP`.** Sai **7 lần** tính tới 05/08 — COWORK-TỔNG đề xuất thứ ĐÃ CÓ SẴN: ① "Kiểm khoảng" (đã có `lib/cad/standards/` 16 file ~3.300 dòng + `furniture.ts:38 clearance?: ClearanceZone[]`) · ② màn moodboard (đã có `docs/mocks/mock-mood-collab-g2-2026-08-03.html`) · ③ auto-arrange (đã có `components/form/DraftBoard.tsx` + `lib/moodboard-boards.ts`, nút "Tự sắp xếp") · ④ `ProductSpec.views` (đã có `drawingBlock`) · ⑤ regex tìm component mồ côi hỏng — suýt báo cáo 170 file sai (`rg -N` vẫn kèm tên file) · ⑥ lôi lại lập luận "internal tool" mà `LICENSE-NOTES §0` ĐÃ HUỶ · ⑦ "Lớp 0 nền" — `.idf` version + migration ĐÃ CÓ ĐỦ từ 28/07 (`lib/cad/idf.ts` `IDF_VERSION`, `migrateIdf()`, `sheet-migrate.ts`, `idf.test.ts`), đơn vị mm đã chốt (`model.ts:2`, phân biệt mm-giấy/mm-world ở `model.ts:31`). ⇒ **GỐC BỆNH KHÔNG PHẢI QUÊN GREP** — là **tin suy luận kiến trúc của mình hơn tin code**. Đề xuất càng "hợp lý về mặt kiến trúc" thì càng dễ bỏ qua bước kiểm. ⇒ **CHẶN**: mỗi dòng đề xuất phải kèm `file:dòng` chứng minh CHƯA CÓ, hoặc gắn nhãn `CHƯA GREP` để người đọc biết mà tự kiểm. Không có dòng nào không nguồn. ⇒ Áp cho CẢ phiếu giao việc, checklist trước ship, và mọi bảng "còn thiếu gì". |

---
## §6 · LUẬT VẬN HÀNH — tránh vỡ repo
1. Trước mỗi việc: `git log --all -- <đường-dẫn>` kiểm ai vừa đụng *(tiền lệ: giao trùng việc 3D-2)*.
2. `git commit -- <pathspec>` **ĐÍCH DANH**, không bao giờ `git add -A`.
3. Lock rác FUSE: `rm -f .git/*.lock`. Lock **chết** = tồn tại >2 phút, 0 byte. Lock **sống** = phiên khác đang commit, đợi.
4. `npx tsc --noEmit` sạch trước khi commit. **Đừng để mình là người làm repo đỏ.**
5. Câu kiểm phải kiểm ĐÚNG BẢN CHẤT: merge thì dùng `git merge-base --is-ancestor <nhánh> main`, đừng `grep` thông điệp commit *(tiền lệ: khối "THANH CONG" dương tính giả)*.
6. Chốt phiên ~85% context: cập nhật báo cáo của mình + ô `CHECKLIST-TONG.md` + **tự soạn KHỐI KHỞI ĐỘNG cho phiên kế nhiệm**. Không chờ ai nhắc.
7. **§0d GIỮ-CÁI-ĐANG-TỐT**: đập-làm-lại phần đang dùng được = 🔴 tự động. Mock là để **NÂNG CẤP** code đang chạy, không phải dựng lại.
8. Port mock theo **L2 port-nguyên-văn token**, NHƯNG vùng nào mock ghi `PLACEHOLDER` thì **không port thành dữ liệu thật** *(tiền lệ: 12 gradient placeholder)*.

---
**V7 — CHỐNG SÓT TASK KHI BỊ GIAO CHỒNG.** *(Hoà đặt 05/08 — áp cho MỌI Claude trong hệ)*

Hoà giao việc theo dòng suy nghĩ, thường **chèn task mới khi task cũ đang chạy**. Đó là cách làm
việc bình thường của Hoà, KHÔNG phải lỗi — lỗi là ở phía Claude nếu để rơi.

1. **Task đang làm thì LÀM ĐẾN CÙNG.** Không bỏ dở nhảy sang task mới, trừ khi Hoà nói "dừng".
2. **Làm xong thì NHÌN LẠI**: trong lúc làm task cũ, Hoà có giao thêm gì không? Liệt kê ra.
3. **Bị giao quá nhiều thì TỰ ĐỀ XUẤT CÁCH CHỐNG SÓT** — đánh số, xếp thứ tự, ghi rõ cái nào
   đang chờ điều kiện gì. Không im lặng ôm rồi quên.
4. **Cuối mỗi lượt trả lời dài: ghi HÀNG ĐỢI** — đã xong gì · đang làm gì · còn treo gì · treo vì ai.
5. Task treo vì **chờ Hoà** (chờ ảnh, chờ localhost, chờ quyết định) phải ghi rõ **chờ cái gì**,
   để Hoà biết mình đang chặn ở đâu.

Ca bệnh làm luật này ra đời: phiên 05/08 — Hoà giao ~12 task đan xen (đọc code · đọc luật · chụp
màn hình · so đối thủ · flow team · avatar · phân quyền · gu Pinterest · bài hệ sinh thái · đánh
giá · checklist sau ship · dọn file rác). COWORK-TỔNG làm được phần lớn nhưng **để rơi 4 task**
mà không ai nhắc, cho tới khi Hoà tự nhớ ra và hỏi lại. Ngay sau khi soạn luật này, TỔNG lại
phạm đúng nó thêm một lần — bị chèn báo cáo phiên code thì nhảy sang xử lý, bỏ dở việc đang làm.

**V6 — PHIÊN CODE KHÔNG TỰ COMMIT.** *(Hoà chốt 04/08 chiều, sau sự cố lần thứ 4)*
Sự cố hai-phiên-chung-`.git` đã lặp **4 lần**: `f77ce9d` (D1 bị cuốn) · commit BOQ · `2de4abf` ·
`080e78c`. Chưa mất dữ liệu lần nào — nhưng cả 4 đều rơi vào file *docs*. Rơi vào file *code*
là mất thật.

Từ nay:
1. **Phiên code CHỈ sửa file rồi BÁO CÁO.** Không `git add`, không `git commit`, không `git push`.
   Báo rõ: đã sửa những file nào.
2. **Hoà là người commit + push**, sau khi các phiên đã báo xong.
3. Phiên nào BẮT BUỘC phải commit (ví dụ cần hash để ghi sổ) thì trước đó phải:
   - `git status --short` → đọc HẾT. Thấy file NGOÀI vùng của mình đang `M`/`??` ⇒ **DỪNG**, báo TỔNG.
   - Gặp `index.lock`: kiểm sống/chết trước khi xoá — `ls -l .git/index.lock`
     (0 byte + cũ hơn 5 phút = chết) và `pgrep -fl "git (commit|add)"`. Lock **SỐNG ⇒ chờ**, không xoá.
   - ⚠️ `git commit -- <path>` **KHÔNG an toàn**: nó vẫn cuốn thay đổi chưa commit của phiên khác
     trên cùng file đó vào commit của mình (đúng ca `080e78c`).
   - Commit xong ghi trong báo cáo: commit những file nào, có cuốn theo gì không.

## §7 · AI LÀM GÌ
| Vai | Là gì | Làm gì |
|---|---|---|
| **COWORK-TỔNG** | phiên Cowork điều phối | chốt quyết định · soạn phiếu · audit bằng vật chứng · giữ sổ. **KHÔNG tự code** (ngoại lệ đã ghi: lỗi chặn `tsc` toàn repo trong file test) |
| **CHINH · PHU · G4** | phiên Claude Code trên máy Hoà | code thật. TỔNG không mở được, Hoà phải dán |
| **5 vai COWORK** (NC·UI·VẼ·DỰNG·TRÌNH) | agent phụ hoặc phiên riêng | spec · mock · nghiên cứu · phiếu. **KHÔNG code**, KHÔNG chạy git |
| **Claude Design** | app dựng mock | xuất HTML → `docs/mocks/` → audit A4 → mới cho port |

---
## §8 · ĐỌC TIẾP FILE NÀO
| Cần gì | Mở file |
|---|---|
| Luật đầy đủ + nhật ký | `docs/SO-KIEM-TONG.md` §0→§0d, §6 |
| Quyết định đã chốt | `docs/00-CHOT.md` |
| Tên chặng/mode + Revit cắt đôi | `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md` |
| Tầng dữ liệu cấu kiện | `docs/SPEC-TANG-DU-LIEU-CAU-KIEN.md` |
| Việc đang chờ | `docs/PHIEU-CODE-IF-DOT6-2026-08-03.md` · `docs/CHECKLIST-TONG.md` |
| Lỗ backend | `docs/AUDIT-BACKEND-2026-08-03.md` |
| Mock nào dùng được | `docs/AUDIT-MOCK-MANPHU-2026-08-03.md` · `docs/mocks/README-mocks.md` |
| **Hex/tài sản TTT trong repo — VÙNG KHOANH, cấm lan rộng** | **`docs/TRUNG-TINH-VUNG-KHOANH.md`** (Hoà chốt 05/08: nhốt lại, xoá sau, KHÔNG được thêm mới) |
| ArchiNote | `ttt-tasks/docs/SPEC-ARCHINOTE-UI-2026-08-03.md` (repo KHÁC) |

---
## §9 · LUẬT **THIẾT KẾ TRƯỚC — TÍNH NĂNG FILL SAU** *(Hoà đặt 03/08, luật chống quên mạnh nhất)*
> Nguyên văn: *"những gì đã nghiên cứu sẽ được thiết kế trước lên giao diện để chống quên, tính năng sẽ theo đó mà fill đầy — gần giống cơ chế cây thư mục hệ gia phả nhưng ở cấp frontier, và chắc chắn không bỏ sót được luôn."*

**Cơ chế:** nghiên cứu xong → **vẽ ngay lên giao diện** (mock/nút/panel/ô trống có nhãn) → tính năng điền vào sau.
Giao diện trở thành **cây gia phả nhìn thấy được** của toàn bộ tính năng: mở app ra là thấy còn thiếu gì, không cần tra sổ.

| Vì sao mạnh hơn checklist | |
|---|---|
| Checklist nằm trong file, phải nhớ mở | Giao diện **đập vào mắt mỗi lần dùng app** |
| Sót một dòng thì không ai biết | Sót một nút thì **thấy ngay chỗ trống** |
| Người ngoài không đọc được | Hoà nhìn màn hình là biết tiến độ, không cần hỏi |

**Cách thi hành — bắt buộc:**
1. Nghiên cứu (NC) xong → COWORK-UI/Claude Design **dựng ngay khung giao diện đủ CẢ những phần chưa code**.
2. Phần chưa có tính năng: **nút/ô hiện dạng `disabled` KÈM LÝ DO tại chỗ** — *"Chưa dựng được — hiện dùng Tường hoặc đùn từ bản vẽ"*. **CẤM nút giả bấm không ra gì** (mẫu đúng đã có: `Command3DPanel.tsx` — docstring nêu lý do *"thà nói thẳng chưa dựng được còn hơn nút bấm không ra gì"*, và nút `disabled` thật ngay dưới; **grep chuỗi đó, đừng tin số dòng**).
3. Mỗi ô trống trên giao diện = **một dòng trong `CHECKLIST-TONG.md`**. Hai bên phải khớp 1-1; lệch là có thứ bị rớt.
4. Phiên code KHÔNG được xoá ô trống cho gọn mắt — ô trống là **bằng chứng còn việc**. Muốn bỏ phải trình TỔNG kèm lý do.
5. Áp cho CẢ hai app: IF và ArchiNote.

**Ca bệnh làm luật này ra đời:** 6 tầng lệnh dựng hình 3D (`SPEC-DUNG-BO-LENH-3D`) nghiên cứu xong nhưng **giao diện chỉ có nút Tường** — 5 khối còn lại disabled, còn extrude/lathe/sweep/loft/boolean/symmetry/array **không hề xuất hiện trên màn**. Không ai nhìn ra đang thiếu gì cho tới khi Hoà tự nhớ ra và hỏi.

---

## §0e — QUYỀN KIỂM SOÁT (Hoà đặt 05/08)

Kiến trúc sư và dân sáng tạo **KHÔNG ghét AI**. Họ ghét cảm giác mông lung — không chắc chắn, không kiểm soát được, sản phẩm ra không đồng nhất. Mọi flow, từ lớn đến nhỏ, phải trả lại quyền kiểm soát đó.

**KS1 · DẠNG TRUNG GIAN** — mọi bước AI phải đi qua một dạng trung gian ĐỌC ĐƯỢC và SỬA ĐƯỢC trước khi thành sản phẩm cuối. Có sẵn để noi theo: `lib/cad/ai-assist.ts` `parseDescription()` → `LayoutSpec` → `layoutToEntities()`. `LayoutSpec` đã là dạng trung gian đúng — việc còn lại là cho nó lên giao diện.

**KS2 · CÙNG ĐẦU VÀO → CÙNG KẾT QUẢ** — seed phải cố định và HIỆN RA giao diện. Đang vi phạm: `lib/ai/providers/comfyui.ts:84` random khi không truyền · `lib/ai/providers/sd.ts:80` seed `-1`. Người dùng phải đọc được seed, chép được, chạy lại ra đúng cái cũ.

**KS3 · DUYỆT THEO PHẦN** — không duyệt cả gói. AI đề xuất 12 thay đổi thì chọn được 5, bỏ 7. Hộp thoại "Bạn có chắc không?" KHÔNG phải checkpoint — nó bắt người dùng chịu trách nhiệm cho thứ họ chưa được nhìn.

**KS4 · LÙI ĐƯỢC VÀ THẤY LÙI VỀ ĐÂU** — hoàn tác phải nói rõ lùi về trạng thái nào.

**KS5 · NÓI ĐƯỢC VÌ SAO** — máy đề xuất thì phải giải thích được căn cứ. Có sẵn để nuôi: `lib/cad/ai-layout-feedback.ts:61` `explainLayoutOption()`.

**KIỂM ĐƯỢC** — mỗi tính năng có AI, trả lời 5 câu: thấy trước được gì? · chạy lại có ra như cũ không? · chọn được từng phần không? · lùi về đâu? · máy nói được vì sao không? Có câu nào "không" thì tính năng đó **chưa xong**.

---

## §0f — ĐÚNG TRƯỚC KHI ĐẸP (Hoà đặt 05/08)

Kiến trúc sư chịu dùng IF khi nó cho thấy sự tinh tế — nhưng tinh tế phải **MỌC RA TỪ nguồn sự thật đã định nghĩa đúng**, không phải vẽ đè lên.

> Thứ tự bất di bất dịch: **ĐÚNG → CÔNG NĂNG → THẨM MỸ**. Đảo thứ tự là ra sản phẩm đẹp mà không ai dùng được.
> *"IF ship, kiến trúc sư mở lên mà cái gì cũng như con nít vẽ thì designer bái bai nó luôn."*

**TB1 · ĐÚNG** là kích thước, tỉ lệ, khoảng cách, nhân trắc. Sai một con số thì mọi thứ phía sau vô nghĩa. Block đẹp mà kích thước sai còn **tệ hơn** block xấu mà đúng — vì nó lừa được người nhìn.

**TB2 · NÉT KHÔNG PHẢI STYLE, NÉT LÀ THÔNG TIN.** Đậm nhạt mã hoá: cái gì bị cắt, cái gì nhìn thấy, cái gì khuất. Chọn nét theo "cho đẹp" là phá quy ước đọc bản vẽ — người trong nghề đọc ra ngay.

**TB3 · THẨM MỸ LÀ HỆ QUẢ, KHÔNG PHẢI LỚP PHỦ.** Bo góc là bán kính thật của món đồ. Thảm đẹp vì nó thật sự định vùng. Mặt bằng đẹp vì lối đi đúng 700–900, vì clearance đúng, vì cụm bàn đúng nhịp cột.

**TB4 · PHÉP THỬ — đổi dữ liệu, cái đẹp có tự cập nhật không?** Có → đó là thiết kế. Không, phải sửa tay → đó là **trang trí**, làm lại.

| Đổi dữ liệu | Nếu đúng | Nếu chỉ là sơn |
|---|---|---|
| Bàn 1400×700 → 1600×800 | tỉ lệ tự đúng, giữ nhịp chi tiết | méo, vẽ lại |
| Phòng họp 8 → 12 chỗ | bàn dài ra, clearance tự tính lại | sửa tay |
| Sàn gỗ → sàn thảm | hatch tự đổi, chú thích tự cập nhật | vẽ lại |
| Tỉ lệ 1/100 → 1/50 | LOD tự lên, nét tự đổi cấp | chữ đè nhau |

**TB5 · MỌI THỨ ĐẸP PHẢI TRUY ĐƯỢC VỀ `Doc` (K1).** Không có đường tắt "vẽ cho đẹp rồi tính sau" — thứ vẽ đè lên sẽ chết ở lần đổi dữ liệu đầu tiên.

**Đặt cạnh §0e:** người dùng phải thấy được cái **đúng** TRƯỚC, rồi mới duyệt cái **đẹp**. Duyệt cái đẹp trước là duyệt mù.

---

## §0g — NGUỒN THAM CHIẾU PHẢI MỞ ĐƯỢC (Hoà đặt 05/08)

Không phiên nào được lấy **MÔ TẢ** của phiên trước làm nguồn. Mô tả qua vài lượt là méo — tam sao thất bản, mất gốc. Đây là dạng nặng hơn của N8: N8 chống *"tin suy luận hơn tin code"*, §0g chống *"tin lời kể hơn tin file"*.

**NT1** — Nguồn tham chiếu là **FILE**: ảnh, SVG, DXF, file Figma, ảnh chụp màn. Thứ mở ra xem được, đo được, chụp lại được.

**NT2** — Nói *"đã có sẵn / đã đúng chuẩn / đã làm rồi"* thì phải **MỞ FILE RA KIỂM** trước.
*Ca bệnh 05/08:* 46 block DXF được coi là "thư viện chuẩn" suốt nhiều phiên. Mở ra: `living-armchair.dxf` = **471 byte**, 2 hình chữ nhật + 3 đường thẳng, **1 layer duy nhất**, **không có section TABLES** ⇒ không lineweight, không linetype. Suýt "học gu" từ nó.

**NT3** — Mọi block/mock phải có **ẢNH CHỤP nằm cạnh file** trong repo. Mở thư mục là thấy nó ra sao, không cần chạy app. TỔNG render được bằng Chromium+Playwright trong container.

**NT4** — **Design system là nguồn cứng.** Có nó thì hết cãi. Không có thì mỗi phiên tự bịa một chuẩn.

**Nguồn thẩm mỹ hiện có:** `docs/IF-nguon-tham-chieu-tham-my.zip` (20 ảnh, 7 nhóm) + `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md`.

---

## §0h — HỌC GU RẠCH RÒI (Hoà đặt 05/08 — luật MỞ RỘNG của luật trung tính)

IF là công cụ MVP sống nhờ **học gu**: máy học từ lựa chọn người dùng, thẩm thấu DNA, giữ gen trội, sửa sai sau bài học đầu, chắc tay dần. Chính vì thế **gu của MỘT dự án rất dễ chảy lậu vào SẢN PHẨM** — và đó là cách luật trung tính bị phá mà không ai thấy.

> Luật trung tính cấm **hex màu và tên thương hiệu**.
> §0h cấm thứ khó thấy hơn: **gu, tỉ lệ, thói quen bố trí, dữ liệu dự án** rò từ tầng dưới lên tầng trên.

### Ba tầng — gu chảy XUỐNG được, chảy NGƯỢC LÊN thì KHÔNG

| Tầng | Chứa gì | Sống ở đâu |
|---|---|---|
| ① **SẢN PHẨM** | block, template, ký hiệu, khung tên, chuẩn nét, luật hình học | repo IF — trung tính tuyệt đối |
| ② **STUDIO** | logo, màu, font, bộ layer riêng, mẫu khung tên riêng | Brand Kit, `Doc.studioName` |
| ③ **DỰ ÁN** | mặt bằng, headcount, vật liệu, gu khách, mood | file `.idf` |

### HG1 · Mọi thứ học được phải mang NHÃN NGUỒN
Không có gu "chung chung". Mỗi mẩu gu ghi rõ học từ tầng nào, chỉ áp lại trong đúng tầng đó hoặc thấp hơn. `lib/cad/ai-layout-feedback.ts:22,29` đã scope theo `userId` qua `cadLayoutOptionModelKey(userId)` — **GIỮ NGUYÊN, cấm bỏ scope, cấm thêm model gu toàn cục.**

### HG2 · Ba câu hỏi trước khi đưa bất kỳ thứ gì vào repo
1. Học từ đâu? 2. Áp vào đâu? 3. **Mở IF với dự án TRỐNG, có thấy dấu vết nó không?**
Câu 3 là phép kiểm dứt điểm. Thấy dấu vết = đã rò.

### HG3 · Được học gì từ dự án, không được học gì

| ĐƯỢC | CẤM |
|---|---|
| Kích thước chuẩn ngành (1400×700, lối đi 700–900, ghế 450) — **dữ kiện, không bản quyền** | Tên phòng ban của khách |
| Nguyên tắc bố trí (xếp theo độ riêng tư, quầy làm bản lề, thảm định vùng) — **luật nghề** | Số liệu dự án (số chỗ, m², chuẩn diện tích nội bộ của khách) |
| Chuẩn nét, quy ước layer, ký hiệu — **quy ước ngành** | Bảng vật liệu của khách |
| Cụm sinh bằng hàm — **hình học có quy luật** | Gu thẩm mỹ của một studio |

### HG4 · Học gu ≠ sao chép hình
Nguyên tắc + kích thước: tự do. Nét vẽ: không. Áp cho cả ảnh tham chiếu bên ngoài lẫn dự án đang làm. Xem `LICENSE-NOTES` — 7 nguồn cấm redistribute.

### HG5 · Ba chỗ dễ rò nhất
1. `lib/cad/ai-layout-feedback.ts` — perceptron gu → giữ scope theo user.
2. `lib/cad/demo-plan.ts` · mock · seed → demo phải là dự án **HƯ CẤU**.
3. **Phiếu TỔNG viết** — phiếu ghi "theo chuẩn <tên studio>" thì code làm theo. Phiếu phải viết trung tính: *"theo chuẩn studio đang mở"*.

### HG6 · Nhắc lại lỗi đã gặp
Mỗi handoff **BẮT BUỘC** có mục *"lỗi đã mắc"*. Không có mục đó = handoff không hợp lệ. Học gu chỉ chắc tay khi nhớ được mình đã sai ở đâu.

### Phép kiểm §0h — chạy trước mỗi lần merge
1. grep tên khách trong repo (trừ `docs/` và `.idf` mẫu) → **0**
2. grep số liệu đặc thù dự án trong `lib/` và `components/` → **0**
3. mở IF với dự án TRỐNG → block/template/gợi ý không mang dấu vết dự án nào
4. model gu có scope theo user/project → **CÓ**

---

## §0i — CHIẾU DÒNG PHẢI KÈM CHUỖI GREP ĐƯỢC (TỔNG đặt 05/08)

**Ca bệnh:** §9 ở trên trỏ `Command3DPanel.tsx:113,139`. Phiên S5 grep ra thực tế là `:123-125`
và `:236-244` — file đã sửa, số dòng trôi, sổ luật trỏ vào chỗ trống. Sổ mà trỏ sai thì phiên sau
đọc luật xong đi tìm mẫu, không thấy, rồi **tự nghĩ ra mẫu của mình** — đúng cơ chế đẻ ra bảy lần
đề-xuất-thứ-đã-có.

**Luật:**
1. Mọi chiếu dòng trong `docs/` phải kèm **một chuỗi grep được** (tên hàm, một câu docstring),
   không chỉ số dòng. Số dòng là tiện tra, chuỗi mới là địa chỉ thật.
2. Phiên nào phát hiện chiếu dòng lệch → **sửa sổ ngay trong phiên đó**, không để dành. Ghi 1 dòng
   changelog.
3. Áp cho cả `CLAUDE.md`, phiếu giao việc, và mọi báo cáo.

> **Lỗi gốc của TỔNG, ghi lại để không quên:** tôi viết §0e và §9 vào sổ, rồi soạn phiếu S5 theo
> **trí nhớ** chứ không mở sổ ra đọc — nên phiếu bảo "dựng ba trạng thái" trong khi §0e đã đặc tả
> sẵn **KS1–KS5**. S5 đọc luật trước khi gõ nên bắt được và dựng đúng KS. Nếu S5 làm theo phiếu thì
> đã có một checkpoint sai đặc tả, và cả S2/S3/S4 cắm theo. **Sổ có luật mà người giao việc không
> đọc thì luật vô dụng.** Từ nay: soạn phiếu = mở sổ, không nhớ lại.

## §0j — QUYỀN KIỂM SOÁT: KHUÔN ĐÃ CÓ, CẤM ĐẺ CÁI THỨ HAI (TỔNG chốt 05/08)

Checkpoint duyệt theo KS1–KS5 đã dựng xong, **đã xác minh có thật trên đĩa**:

| File | Kích thước |
|---|---|
| `components/studio/Checkpoint.tsx` | 16.466 B |
| `components/studio/checkpoint-core.ts` | 6.256 B — phần thuần |
| `components/studio/checkpoint-core.test.ts` | 4.592 B — **34 phép kiểm** (`grep -c "ok("` = 35, trừ 1 dòng định nghĩa hàm) |
| `docs/mocks/mock-checkpoint-duyet.html` | 14.227 B — mock hợp đồng, qua cửa kiểm |

⛔ **Cấm mọi phiên tự dựng checkpoint riêng.** Import `Checkpoint` từ `components/studio/Checkpoint`.

Bốn ràng buộc S5 ép bằng **kiểu dữ liệu**, không ép bằng lời nhắc — giữ nguyên, đừng nới:
`seed` bắt buộc (KS2) · `undoLabel` bắt buộc (KS4) · `preview` nhận `ReactNode` **không nhận
`string`** (bắt phải đưa sản phẩm thật, không đưa câu mô tả) · `onAccept(ids)` chỉ ghi phần đã tick
(KS3). `progress={null}` ⇒ hiện số giây, **cấm bịa phần trăm**.

**Còn nợ — nói thẳng:** khuôn mới **tạo điều kiện**, chưa **cưỡng chế**. Chưa có gì chặn một flow
ghi thẳng vào `Doc` mà bỏ qua checkpoint. Cưỡng chế thật phải chặn ở tầng ghi `Doc` — việc kiến
trúc, chưa giao, không nhét vào đợt đang chạy.

---

## §0k — GỬI LỆNH MỘT LOẠT, KHÔNG TRAO ĐỔI LẮT NHẮT (Hoà đặt 05/08)

> Nguyên văn Hoà: *"vừa trao đổi vừa cop, nhảy qua lại trong khi cái máy đang hoạt động hết công
> suất, phải có mốc chốt — khoá trao đổi xong dán lệnh một loạt để máy chạy. Dán ở đâu làm gì
> tuần tự. Mình kiến trúc sư, không phải IT."*

**Ca bệnh:** một buổi chiều 05/08 mất hơn một giờ vì TỔNG trả lời từng mẩu — Hoà đọc, chép, dán,
chụp màn, gửi lại, chờ. Sáu vòng cho một việc `git commit`. Trong khi đó máy đang chạy 5 phiên
song song, mỗi lần Hoà nhảy cửa sổ là một lần mất mạch.

### Luật

1. **Một phiên trao đổi có MỘT mốc chốt.** Bàn xong thì TỔNG soạn **một bảng lệnh trọn gói**, Hoà
   dán một mạch, máy chạy. Không hỏi lại giữa chừng.
2. **Mỗi lệnh phải ghi đủ ba thứ**: **dán vào đâu** (tên cửa sổ / phiên nào) · **nội dung dán
   nguyên khối** · **xong thì biết là xong bằng dấu hiệu gì**.
3. **Lệnh terminal phải là MỘT khối dán được**, nối bằng `&&` hoặc `;`. ⛔ Cấm bắt Hoà gõ từng
   dòng rồi báo kết quả rồi mới đưa dòng sau — trừ khi bước sau **thật sự** phụ thuộc kết quả bước
   trước, và khi đó phải nói thẳng *"chỗ này bắt buộc dừng vì …"*.
4. **Viết cho kiến trúc sư, không viết cho IT.** Không giả định biết `pgrep`, `reflog`,
   `--max-old-space-size`. Cần dùng thì giải thích một câu ngay tại chỗ.
5. **TỔNG phải tự kiểm lệnh trước khi đưa.** Lỗi đã mắc trong chính buổi đó: đưa `pgrep -fl git`
   (khớp cả chuỗi tham số) nên bắt nhầm Serena MCP `--from git+https://…` thành "git đang chạy",
   làm Hoà dừng một vòng vô ích. Lệnh đúng là `pgrep -x git`.
6. **Bảng lệnh gửi dạng FILE**, không rải trong lời thoại — để Hoà mở một chỗ, làm một mạch, đánh
   dấu xong từng mục.

### Mẫu bảng lệnh

```
① TERMINAL — cửa sổ "interiorflow"
   [một khối dán được]
   ✔ xong khi: thấy dòng "…"

② PHIÊN CLAUDE CODE đang làm <mảng>
   [nguyên văn khối dán]
   ✔ xong khi: nó báo …

③ THAO TÁC TAY (nếu có)
   …
```

---

## §0l — TÊN PHIÊN = TÊN MẢNG (Hoà chốt 05/08)

Tên phiên đang đặt bằng SỐ (`1`, `4`, `2`, `3`…) ⇒ không cách nào nhớ phiên nào nắm gì ⇒ dán
nhầm lệnh. Luật một-mảng-một-thợ chỉ chạy được nếu **nhìn tên là biết mảng**.

| Tên phiên | Mảng độc quyền |
|---|---|
| `S1-dxf` | `lib/cad/dxf*.ts` · `dwg*.ts` · `hatch.ts` · `lib/cad/render.ts` · `scratchpad/` |
| `S2-3d` | `lib/three/*` · `components/three/*` · `components/render-studio/*` |
| `S3-thuvien` | `workstation-clusters.ts` · `furniture.ts` · `block-library.ts` · `components/library/*` |
| `S4-matbang` | `components/cad/*` · `lib/cad/plan-present.ts` · `plan-leader.ts` · `legend.ts` |
| `S5-ui` | `components/studio/*` · `globals.css` · `docs/mocks/*` |
| `S6-chuan` | `lib/cad/standards/**` · `lib/cad/model.ts` · `CLAUDE.md` |
| `VE-block` | `scripts/cad-library/**` · `public/cad-library/**` |
| `MOCK-kiem` | `docs/mocks/*` (chỉ cửa kiểm, không sửa tính năng) |

**Luật:** mọi phiếu TỔNG soạn phải mở đầu bằng đúng một tên trong bảng. Hoà chỉ việc so tên cửa
sổ. Tên ≤11 ký tự để hiện đủ trên thanh bên hẹp.

⚠️ `VE-block` chạy trong **Claude Code**, không phải phiên Cowork — nó phải chạy
`generate-library.ts` / `verify-library.ts` / `tsc` ngay trong repo. (TỔNG từng gọi nhầm là
"COWORK-VẼ".)

## §0m — THỨ THUẦN THỊ GIÁC PHẢI QUA MẮT NGƯỜI, CHIA ĐỢT (Hoà chốt 05/08)

> Nguyên văn Hoà: *"chụp màn cho mình để mình xem sản phẩm, âm thầm vẽ đến khi sai mình không bắt được."*

**Ca bệnh:** phiên `VE-block` tự khai — *"`tsc` xanh, test xanh, DXF parse 100% mà hình vẫn là mặt
cười."* Ghế bành: 4 cung "gợi nệm" đặt bậy thành miệng + hai mắt. Tủ áo: bản lề so le thành cái
rèm. Lưng ghế: thành vành trăng rời. **Ba lỗi, không cửa kiểm tự động nào bắt được.**

**Luật — áp cho MỌI việc sinh hình (block, ký hiệu, mặt bằng trình bày, thumbnail):**
1. ⛔ **Cấm vẽ liền một mạch rồi mới cho xem.** Chia đợt ≤8 món.
2. Sau mỗi đợt: sinh lại → verify → **render TẤT CẢ ra MỘT ảnh PNG có nhãn** →
   lưu `docs/screenshots/` → **DỪNG, chờ duyệt**.
3. Báo cáo phải kèm **đường dẫn ảnh**, không chỉ kèm số.

**Nghi vấn còn mở — rò gu qua ngữ cảnh, không qua code:** hệ vừa vẽ ~15 vòng mặt Memoji (mắt,
miệng, tóc, kính — commit `83127a1`, `0bf0a84`, `0a9ddd0`, `2d07190`…) rồi quay sang vẽ ghế bằng
cung và ra **mặt cười**. Điều tra git: block CAD chỉ có **1 commit riêng** (`91053f9`), avatar có
~15 commit riêng, **không commit nào lẫn** (ngoài `985d31e` là commit gộp cả ngày của Hoà).
⇒ Nếu có rò thì rò qua **ngữ cảnh phiên**, không qua code — và git không bắt được.
⇒ Cách chặn duy nhất là luật đợt ở trên. Đây là §0h HG1 ở dạng khó thấy nhất.

## §0n — NHỊP LÀM VIỆC BA BƯỚC (Hoà chốt 05/08)

> Nguyên văn Hoà: *"mỗi lần chốt với nhau xong bạn phải lưu lại và cập nhật lưu lần nữa. Rồi mình chốt thì bạn soạn lệnh tuần tự mình dán."*

```
① TRAO ĐỔI  →  chốt được điều gì
② TỔNG LƯU NGAY  →  ghi vào sổ này + ghi về máy, RỒI ĐỌC LẠI XÁC NHẬN ĐÃ VÀO
③ HOÀ CHỐT  →  TỔNG soạn BẢNG LỆNH tuần tự (§0k)  →  Hoà dán một mạch
```

**Bước ② là bước hay bị bỏ nhất, và bỏ là mất.** Ca bệnh cùng ngày: TỔNG chốt quy ước tên phiên
với Hoà, nói xong trong khung chat rồi đi soạn việc khác — **không ghi vào sổ**. Hoà phải nhắc.
Thứ chỉ sống trong khung chat thì phiên sau không đọc được, và chat thì trôi.

**Kiểm bước ②:** ghi xong phải `wc -c` lại file và `grep` đúng mã mục vừa thêm. Không đọc lại =
chưa lưu.

---

## §0o — CẤM MÔ TẢ NGUỒN TỪ TRÍ NHỚ (Hoà đặt 06/08 — sau LẦN THỨ TÁM)

> Nguyên văn Hoà: *"cấm mô tả từ trí nhớ không rõ ràng, cấm suy luận khi không đọc dữ liệu cụ thể.
> Một phiên sai trên tám lần cùng một lỗi là không chấp nhận được."* — và: *"không nhận suông."*

**Đây không phải luật mới. Đây là §0g + N1 + N7 + N8 bị phạm lần thứ tám.** Tách thành mục riêng
vì nhắc lồng trong mục cũ đã chứng minh là không đủ.

### Ca bệnh mới nhất (06/08)

TỔNG duyệt `docs/screenshots/van-phong-dot-1.png`, phán *"`ghe-xoay` sai — mâm ngồi biến mất"*,
và **đã soạn sẵn lệnh bắt `VE-block` vẽ lại**. Hoà chặn. Mở ảnh gốc
`2407-Test/ref-tham-chieu/A2-cum-4-ban-chu-thap-net-ky-thuat.png` ra xem thì khối bo tròn to
**chính là mâm ngồi**, cấu trúc block **đúng**. Nhận xét sai hoàn toàn.

⇒ Nếu Hoà không chặn: **một phiên Opus bị đốt để phá thứ đang đúng.**

### Luật

1. ⛔ **Cấm nhận xét bất kỳ thứ gì thuộc về HÌNH khi chưa MỞ HÌNH RA XEM.** Đọc tên file · đọc
   kích thước file · đọc bản phân tích cũ **của chính mình** — **KHÔNG tính là đã xem**.
2. ⛔ **Cấm trích nguồn tham chiếu bằng lời kể.** Phải mở đúng file và **dán đường dẫn** vào nhận
   xét, để người khác mở lại kiểm được.
3. **Bẫy nguy hiểm nhất — bản phân tích của chính mình trở thành "nguồn" giả.** TỔNG từng đọc ảnh
   thật một lần, viết `00-PHAN-TICH-NGUON-THAM-CHIEU.md`, rồi các lượt sau **trích bản phân tích
   đó** thay vì mở lại ảnh. Bản tóm tắt KHÔNG thay được nguồn.
4. **Nguồn thẩm mỹ nay nằm trên đĩa, mở được:** `2407-Test/ref-tham-chieu/`
   `A1` thư viện cụm · `A2` **chuẩn nét kỹ thuật** · `D2` LOD cao · `E1`/`E2` cụm có dim ·
   `G1`/`G2` ghế bành 3 hình chiếu · `00-PHAN-TICH-*.md`.
   Nằm trong `2407-Test/` nên **.gitignore đã chặn** — không vào repo, đúng luật trung tính.
5. **Phiếu giao việc vẽ phải ghi ĐƯỜNG DẪN ẢNH CỤ THỂ**, cấm ghi "theo ảnh tham chiếu".

### Sổ đếm lỗi — chống chai lì

Mỗi lần TỔNG phạm §0o: **thêm một dòng kèm ngày và ca bệnh**.

| Lần | Ngày | Ca bệnh |
|---|---|---|
| 1–5 | 04–05/08 | 5 lần đề xuất xây thứ ĐÃ CÓ (`sectionToEntities` · 6 hàm cụm · `computeHeights` · `effectiveFrom` · `exportDxfEx`) |
| 6 | 05/08 | kết luận 46 block "thô" từ **kích thước file**, chưa render ra nhìn |
| 7 | 05/08 | nghi `components/library/*` sai mảng trước khi đọc `ClusterPanel.tsx` — phiên đó đang làm ĐÚNG |
| 8 | 06/08 | phán `ghe-xoay` "mâm ngồi biến mất" — mở `A2` ra thì mâm vẫn ở đó |

### Đã báo cáo Anthropic

Hoà từ chối lời nhận lỗi suông, yêu cầu báo cáo lên Anthropic để đưa lớp lỗi này vào môi trường
huấn luyện trước khi dùng thương mại. Báo cáo: `BAO-CAO-LOI-ANTHROPIC-2026-08-06.md`, gửi qua nút
phản hồi trong giao diện — phiên Cowork **không có kênh gửi trực tiếp**, và TỔNG đã nói rõ điều đó
thay vì hứa suông.

---

## §0q — TASK LÀ PHÉP THỬ IF, KHÔNG PHẢI DELIVERABLE (Hoà đặt 06/08)

> Nguyên văn Hoà: *"mục tiêu chính là xài IF để làm task, và từ task chỉ ra những lỗi IF không
> làm được, sau đó update IF. Bạn đang vi phạm luật trung tính khi nghiêng về dự án."*

**Vi phạm kiểu mới — nghiêng dự án.** Luật trung tính không chỉ cấm data khách vào repo. Nó còn
cấm **để việc giải dự án THAY cho việc dựng app**. TỔNG đã tính 476 chỗ bằng tay, chốt tầng 9
meeting, định vẽ stacking lên Miro — tức **làm kiến trúc sư hộ**. Mỗi lần TỔNG tự giải một bước
của dự án là **che mất đúng cái lỗi IF cần lộ ra**.

### Mô hình đúng

```
3 task  →  đi XUYÊN qua IF như một KTS thật đang dùng app
mỗi bước:
   IF làm được   → tốt, đi tiếp
   IF làm KHÔNG được → đó là GAP → phiếu backlog IF → update IF → chạy lại
sản phẩm dự án = SẢN PHẨM PHỤ. Sản phẩm CHÍNH = IF khá lên.
```

### Đường may KÉP (trung tính hai trục)

| Thứ | Bản chất | Về đâu |
|---|---|---|
| **GAP** — "IF chưa có bảng stacking", "IF không đối chiếu được headcount vs diện tích" | lỗi/thiếu của SẢN PHẨM, trung tính | `docs/GAP-IF.md` (repo) |
| **DATA** — "476 chỗ", "2.281 m²", tên phòng ban | dữ liệu MỘT khách | `2407-Test/` (ignored) |
| **giải bằng tay** — TỔNG tự tính zoning, tự binh mặt bằng | **VI PHẠM** — che lỗi IF | ⛔ KHÔNG LÀM |

### Phép kiểm §0q — trước mỗi việc dự án, hỏi:
1. Việc này đang **bắt IF làm** hay **tôi đang làm hộ IF**?
2. Nếu IF làm không được → đã ghi GAP chưa, hay tôi lặng lẽ giải tay?
3. Kết quả cuối là **IF khá lên** hay chỉ là **một mặt bằng đẹp**?

Nếu câu 3 ra "một mặt bằng đẹp" mà IF không khá hơn → đã nghiêng dự án, dừng lại.

### §0q — LUẬT CỨNG (Hoà chốt 06/08, áp cho MỌI việc tương tự về sau)

**TỔNG KHÔNG hỏi Hoà quyết định dự án/thiết kế.** 476 chỗ · bỏ 2F · xếp tầng nào · cụm gì ở đâu
— đó là **input của task** hoặc **việc IF phải tự làm**, KHÔNG phải quyết định TỔNG gate để chờ.
Mỗi lần TỔNG hỏi Hoà một quyết định thiết kế = đang bắt Hoà làm KTS hộ IF = nghiêng dự án.

Đúng: gặp quyết định thiết kế → hoặc coi là **dữ liệu thử** (đưa vào IF), hoặc ghi **GAP** ("IF
chưa tự quyết được X"). Cấm biến nó thành câu hỏi cho Hoà.

**Token — luật cứng kèm theo:** cấm quét cả kho lớn (Drive, thư mục nhiều file) để "tìm xem có
gì". Chỉ mở **đúng file** khi biết cần file nào. Không biết cần gì thì hỏi tên file, không quét mò.

---

## §0r — MỘT NGUỒN SỰ THẬT CHO VIỆC ĐANG CHỜ (Hoà chốt 06/08)

> Nguyên văn Hoà: *"push những việc rải rác lên ngọn nguồn của sự thật để chống trôi, chống chôn vùi."*

**Việc đang chờ KHÔNG được sống rải rác trong tin chat** — chat trôi, việc bị chôn, phiên sau lần
không ra. Phải gom vào MỘT file **nguồn-sự-thật** trong repo: `docs/VIEC-DANG-CHO.md`. Luôn cập
nhật, xếp theo thứ tự làm. Đây là **NGỌN** — chỗ ĐẦU TIÊN nhìn để biết còn gì.

### Luật
1. Việc mới phát sinh giữa chừng → **đẩy NGAY lên `VIEC-DANG-CHO.md`**, không để trong lời thoại.
2. Việc xong → chuyển sang mục "đã xong" kèm timestamp, không xoá trắng (giữ vết).
3. **Ledger phải TRUNG TÍNH** (nó ở trong repo sản phẩm). Việc chạm data khách → paste-block chi
   tiết để ở `2407-Test/` (ignored); ledger chỉ **trỏ tới**, không chép tên khách/số liệu vào.
4. **Chat là kênh, ledger là NGUỒN.** Chốt gì → ghi ledger. Chốt trong chat rồi thôi = sẽ trôi.

### Cơ chế ép
Mỗi lần TỔNG soạn việc mới mà không cập nhật ledger = việc đó **sẽ trôi**. Phép kiểm cuối mỗi
vòng: "việc vừa bàn đã lên `VIEC-DANG-CHO.md` chưa?" — chưa thì chưa xong vòng.

---

## §0s — CẮT TOKEN THỪA (Hoà chốt 06/08)

> *"nhìn tên là biết sứ mệnh"* — tên đã mã hoá việc thì đừng đọc lại, giải lại.

1. **Tên = sứ mệnh** (§0l): nhìn tên phiên/file/gốc là biết việc → không đọc lại luật, không giải
   lại nhiệm vụ.
2. **Có nguồn sự thật thì TRỎ, không chép lại**: ledger `VIEC-DANG-CHO.md` · cây gia phả · sổ này.
   Lặp nội dung đã có = đốt token.
3. **Phiếu lean**: tên = mảng; ai cần luật tự tra bằng mã (§0i…§0s). Không nhét cả sổ vào phiếu.
4. **TỔNG không lặp bối cảnh mỗi lượt**: câu ngắn, trỏ doc. Không kể lại thứ đã chốt.
5. **Cơ chế ép**: mỗi lượt tự hỏi *"câu này lặp thứ đã có ở đâu đó không?"* — có thì cắt, trỏ tới.

---

## §0t — `grep -a` BẮT BUỘC (Hoà chốt 06/08)

**Mọi lệnh tìm mã nguồn dùng `grep -rna`.** `grep` mặc định của phiên **nuốt tệp có byte điều
khiển** → trả rỗng / exit 1 **IM LẶNG**.

⇒ Kết luận *"0 nơi gọi"* / *"field chết"* / *"không ai dùng"* rút từ `grep` không có `-a` có thể
là **DƯƠNG TÍNH GIẢ**. Ca bệnh: **G-M1-15** — M1 báo sai **2 lần** vì đúng cơ chế này.

### Luật
1. `-a` là bắt buộc, không phải tuỳ chọn. Quen tay gõ `grep -rn` = **kết luận không dùng được**.
2. ⛔ **Cấm gõ byte điều khiển thô vào mã.** Nguồn gốc bệnh nằm ở đây — chặn từ gốc, không chỉ
   chữa triệu chứng ở phía tìm kiếm.
3. **Chạy lệnh quét** (đã có trong `M1-SUA-OUT` §3) và **báo tệp dính** — không im lặng bỏ qua.
4. Nghiệm thu **V6**: kết luận "không nơi nào gọi" phải kèm **lệnh `grep -rna` đã chạy**, dán
   nguyên văn, để người sau chạy lại kiểm được.

---

## §0u — GAP-IF: MỘT NGƯỜI GHI = COWORK-TỔNG (Hoà chốt 06/08)

**Phiên fix KHÔNG sửa `GAP-IF` trực tiếp.** Đã gây revert thật: `M1-SUA` khai đã cập nhật, mở file
ra vẫn **44 đỏ** — hai ngòi bút cùng ghi một sổ thì bản sau đè mất bản trước.

### Luật
1. Phiên ghi **delta GAP** vào **`M-OUT` của chính mình** (`M1-SUA-OUT`, `M2-…-OUT`…), không đụng
   sổ chung.
2. **TỔNG gộp về sổ một nguồn** `GAP-IF` — một ngòi bút duy nhất, không tranh chấp.
3. Đây là §0r (**một nguồn sự thật**) áp cho sổ GAP: nhiều nơi ghi = mất việc, không phải nhanh hơn.

---

## §0v — LÕI KHÔNG MANG TÊN NHÀ CUNG CẤP (Hoà chốt 06/08)

Luật trung tính lâu nay chống **thương hiệu KHÁCH** lọt vào sản phẩm (§0h). §0v chống thứ cùng
bệnh mà chưa ai gọi tên: **nhà cung cấp HẠ TẦNG lọt vào xương dữ liệu**.

**Ca bệnh — đo 06/08 bằng `grep -rna`:** 45 file dính chuỗi `lark`, nặng nhất là schema lõi —
`prisma/schema.prisma:319` `larkRecordId String @unique` (khoá đối chiếu) · `:321` `larkProjectName`
· `:322` `larkProjectCode` · `:344` `larkAccount @unique` · `:74` `larkProjectCode` trên `Project`.
⇒ Tên một nhà cung cấp đang nằm trong **tên cột** của mô hình dữ liệu lõi. Đổi nhà cung cấp =
phẫu thuật lõi + migrate + sửa 29 file code.

> Ví von: Larkbase đang được dùng như **cột chịu lực mượn của nhà hàng xóm**. Nhà đứng được,
> nhưng hàng xóm dỡ nhà thì mình sập. Đúng ra nó phải là **giàn giáo** — dựng xong thì tháo,
> nhà vẫn đứng.

### L-EXT1 · Lõi trung tính
⛔ **Cấm thêm cột mang tên nhà cung cấp vào `prisma/schema.prisma`.** ID của hệ ngoài để trong
bảng cầu `ExternalRef { system, externalId, entityType, entityId }`, khoá `@@unique([system, externalId])`.
Cột `lark*` cũ **giữ nguyên** (gỡ ngay là rủi ro vô ích) — chỉ **ngừng đẻ mới**.

Ba tầng đúng:
```
① LÕI IDF        Task · Project · Person · Material — id do IDF sinh, 0 tên nhà cung cấp
② BẢNG CẦU       ExternalRef — "task X ↔ record Y của hệ Z"
③ ADAPTER        lib/integrations/providers/lark.ts + registry.ts:37 REGISTRY  ← ĐÃ ĐÚNG, giữ
```
Tầng ③ đã làm đúng pattern rồi. Hỏng ở ① và ②.

### L-EXT2 · Hai app cùng nhà nói chuyện bằng `.idf`, KHÔNG qua Lark
`docs/ARCHINOTE-MAP.md:17` — *"Hai app hiện KHÔNG chung định dạng dữ liệu nào. Kênh chung mà spec
chủ ý là **Lark Base**"* · `:130` — *"Toàn bộ ở Lark, không có bản sao local. **Mất mạng = trắng màn.**"*

⇒ Một dịch vụ ngoài đang là **khớp nối duy nhất giữa hai app đều của mình**. Lark chết thì cả hệ
IDF chết theo. `.idf` chưa gánh việc đó (`grep -na "external\|source\|origin" lib/cad/idf.ts` = 0).

**Vai Larkbase hạ xuống:** từ *"XƯƠNG SỐNG DỮ LIỆU"* → **"nguồn dữ liệu ngoài, thay được"**.
Chính chữ "xương sống" trong sổ đang tự hợp thức hoá việc coupling.

### Vì sao vẫn GIỮ Larkbase (không phải bỏ)
Dữ liệu nhân sự/dự án/việc đang sống ở đó · business-ops (hoá đơn · công nợ · chấm công) đã chốt
**không kéo vào IF** nên phải có chỗ chứa · tự xây tầng nhân sự + quyền là 3–6 tháng, không đáng
đổi lúc này. Giữ **vai**, bỏ **coupling**.

### Phép kiểm §0v
1. `grep -na "lark" prisma/schema.prisma` — **số không được tăng** so với lần đo trước (06/08: 10 dòng)
2. Code mới đọc/ghi ID ngoài phải đi qua `ExternalRef`, không đọc thẳng cột `lark*`
3. Đường IF↔ArchiNote phải là `.idf`, không phải Lark

---

## §0w — SỔ PHIẾU ĐÃ PHÁT (TỔNG chốt 06/08 22:58, sau ca hai-phiên-một-việc)

**Ca bệnh, có vật chứng:** tối 06/08 chạy **5 phiên Code** chứ không phải 4. Hai phiếu chồng
phạm vi cùng port mock *"Bảng nút"* — `docs/M-NODE-BOARD-OUT.md` (ghi 22:28) và
`docs/M-APPLY-A-OUT.md` (22:37, LÀN A gồm *Bảng nút · Nút tổng · Thư viện*).

Chính hai phiên đó tự khai:
- `M-APPLY-A-OUT.md:176` — *"Phiếu Làn A được dán vào **HAI phiên** cùng lúc."*
- `:182` — lúc 19:54 nó thấy 3 màn của phiếu mình **đã có người làm gần xong**, kết luận
  *"ít nhất **3 làn** cùng ghi một working tree"*, và tự quyết **không sửa chồng**.
- `M-NODE-BOARD-OUT.md:6` — *"Phiên khác sửa song song `components/library/*`,
  `lib/library/shelves.ts`, `components/nodes/Macro*.tsx` **và cùng file `app/globals.css`**"*.

⇒ **Không mất việc** (cả hai xử lý tử tế), nhưng **làm hai lần một việc** — và limit Code cạn
gấp đôi. Đêm đó giao diện báo *"Approaching weekly usage limit · Resets Tue, Aug 11"*.

### Gốc bệnh
KHÔNG phải ai giao nhầm. Là **không có sổ nào ghi phiếu nào đã phát cho cửa sổ nào**.
`VIEC-DANG-CHO.md` ghi **việc**, không ghi **phiếu đã phát**. Phiếu "Bảng nút" và phiếu "LÀN A"
chồng phạm vi mà không ai thấy. Đây là §0r (một nguồn sự thật) còn thiếu một cuốn sổ.

### Luật
1. **Mỗi phiếu phát ra ghi MỘT DÒNG** vào `docs/SO-PHIEU-DA-PHAT.md`:
   `ngày giờ · dán cửa sổ nào · phủ mock/mảng nào · file M-OUT đích`.
2. **Trước khi soạn phiếu mới: đọc sổ đó trước.** Phủ trùng mock/mảng đã phát ⇒ **DỪNG**,
   gộp vào phiếu cũ hoặc thu hẹp phạm vi. Không phát chồng.
3. **Phiếu phủ theo MOCK, không chỉ theo thư mục.** Ca này hai phiếu khác thư mục
   (`components/nodes` vs `components/library`) nhưng **cùng một mock** ⇒ vẫn đụng nhau.
4. **Mỗi phiếu Code phải mở đầu bằng cửa kiểm tự động** — dán nguyên văn:
   ```
   TRƯỚC KHI GÕ: ls -la docs/M*OUT*.md
   Thấy M-OUT nào sửa trong 30 PHÚT gần đây mà chạm mảng/mock của bạn ⇒ DỪNG, báo,
   ĐỪNG LÀM. Hai phiên cùng một việc đốt limit gấp đôi và không thêm giá trị nào.
   ```
5. **Đo phiên còn chạy hay không phải nhìn CẢ HAI**: file code **và** file `M-OUT`.
   Sai đã mắc 06/08 22:24: TỔNG đo file code thấy im 56 phút, kết luận "cả 4 đã ngưng" —
   nhưng M-OUT vẫn được ghi tới **22:44**, chúng đang viết báo cáo. Đúng ca **N7**:
   grep phải đúng chỉ báo của việc đang kiểm, không phải chỉ báo gần đúng.

---

## §0x — BẢNG ĐỐI CHIẾU MẢNG: soạn bảng lệnh phải QUÉT THƯ MỤC, không dựa trí nhớ

**Ca sinh ra luật này — 07/08.** TỔNG soạn bảng lệnh đợt 2 gồm 4 phiếu, tự tin là đã phủ hết.
Hoà hỏi *"nhánh dựng 3D có vẻ như quên nữa r"* → đo lại: mảng 3D có **12.737 dòng / 64 file**,
bảng lệnh nhắc tới nó **0 lần**. Sổ GAP cũng chỉ có 2 dòng cho nó (CAD 156 file có 20 dòng).

**Vì sao lọt.** TỔNG soạn phiếu theo *danh sách lỗ hổng đang nhớ*, không theo *danh sách thư mục
đang có*. Mảng nào không ai kêu ca thì không vào đầu — và mảng 3D không ai kêu vì **chưa ai đi
soi nó**. Im lặng bị đọc nhầm thành lành.

> Ví von: kiểm hồ sơ bằng cách đọc danh mục bản vẽ mình tự gõ, thay vì mở thư mục đếm file.
> Bản vẽ nào quên gõ vào danh mục thì vĩnh viễn không ai biết là thiếu.

### Luật
Trước khi soạn BẤT KỲ bảng lệnh nhiều phiếu nào, chạy đối chiếu này và **dán kết quả vào bảng lệnh**:

```bash
# ① mọi mảng code có thật, kèm khối lượng
for d in lib/* components/*; do [ -d "$d" ] && \
  printf "%-30s %3d file %7d dòng\n" "$d" \
  "$(find $d -name '*.ts*' | wc -l)" "$(find $d -name '*.ts*' -exec cat {} + 2>/dev/null | wc -l)"; \
done | sort -k3 -rn | head -25

# ② mảng nào có mặt trong bảng lệnh vừa soạn
grep -oE 'lib/[a-z-]+|components/[a-z-]+' <bảng-lệnh>.md | sort -u
```
**① trừ ② = danh sách bị bỏ quên.** Mảng nào trên 1.000 dòng mà không có trong ②
⇒ DỪNG, giải trình bằng chữ vì sao bỏ, đừng im lặng bỏ qua.

### Chỉ báo nghi ngờ — "im lặng ≠ lành"
Mảng nào có tỷ lệ này thì gần như chắc chắn **chưa ai soi**, không phải đã ổn:
| Chỉ báo | Ngưỡng nghi |
|---|---|
| dòng code ÷ dòng GAP | > 2.000 dòng / 1 dòng sổ (3D: 6.400/1 · CAD: 800/1) |
| test ÷ file ở lớp giao diện | = 0 |
| dòng động cơ ÷ dòng vỏ | > 50 (3D: 12.737 / 161 = **79**) |

### Áp dụng ngược cho các mảng còn lại
Chạy ① ngay sau khi đọc luật này. Mảng nào lọt lưới ⇒ mở phiếu bù, đánh dấu
🔴 *"phiếu bù lỗ TỔNG bỏ sót"* như `Đ2-5`, để lần sau tra sổ còn thấy vết.

---

## §0y — SAI BA LẦN CÙNG MỘT KIỂU TRONG MỘT NGÀY: tin vào grep chưa kiểm chứng

**07/08, TỔNG mắc đúng một lỗi ba lần:**
| # | Việc | Chỉ báo sai | Hậu quả |
|---|---|---|---|
| 1 | Soi mock 3 màn 22:27 | regex `1\.[0-4][0-9]?\|1` — nhánh `\|1` bắt trúng số 1 trong `1.5` | suýt báo "146 chỗ vi phạm line-height", thật ra đạt chuẩn |
| 2 | Truy mock của 4 ảnh Hoà gửi | `grep -c` đếm **dòng khớp**, không đếm **chức năng khớp** | khẳng định nhầm file, phải đính chính |
| 3 | Soi 16 mảng | regex không bắt `export default function` | báo "30 file chết · 6.573 dòng", thật ra **0** |

**Gốc chung:** viết một biểu thức tìm kiếm, thấy ra con số, rồi **báo luôn** — không lấy 2–3 mẫu
kiểm tay xem con số đó có nghĩa đúng như mình tưởng không.

> Ví von: đo bằng thước chưa hiệu chuẩn. Số đọc ra rất tự tin, và sai đều.

### Luật
Trước khi báo BẤT KỲ con số nào rút ra từ grep/script:
1. **Lấy 3 mẫu, kiểm tay.** Mẫu lớn nhất + mẫu ngẫu nhiên + mẫu nhỏ nhất. Cả 3 khớp mới được báo.
2. **Đọc lại chính biểu thức mình vừa viết**, hỏi: nó bắt hụt dạng viết nào?
   Với TypeScript, tối thiểu phải nghĩ tới: `export default` · `export {a as b}` ·
   barrel `index.ts` · dynamic `import()` · JSX `<Tên/>` · đường dẫn `@/...` trỏ thư mục.
3. **Con số nghe quá tốt hoặc quá xấu thì gần như chắc là sai.** "6.573 dòng code chết" trong repo
   có kỷ luật N6 và 0,9% mồ côi là **mâu thuẫn nội tại** — đáng lẽ phải dừng lại ngay lúc đó.
4. Báo rồi mới phát hiện sai ⇒ **đính chính trong cùng lượt**, ghi rõ "kết quả trước BỎ", không im.

---

## §0z — TRƯỚC KHI BẢO HOÀ DÁN: KIỂM ĐÃ DÁN CHƯA

**Ca 07/08:** TỔNG soạn phiếu vá `G-M15-07 ①`, Hoà dán. Vài phút sau TỔNG **đưa lại đúng phiếu đó**
và bảo "dán phiên này". Hoà: *"cái đó tao dán gòi, mày bị 1 lỗi bị hoài vậy"*.
Cùng gốc với ca 06/08 23:00 (báo PHU sót việc trong khi PHU đã xong).

**Gốc:** TỔNG trả lời câu "dán phiên nào" bằng **danh sách phiếu đã soạn**, không bằng
**trạng thái thật của repo**.

### Luật — 3 lệnh, chạy TRƯỚC mỗi lần nói "dán cái này"
```bash
# ① file đích đã sửa chưa
sed -n '<dòng>p' <file-phiếu-nhắm-tới>
# ② báo cáo đích có mục đó chưa
grep -c "<mã GAP>" docs/M-*-OUT.md
# ③ có phiên nào đang ghi trong 40 phút qua
find docs -name "M-*OUT*.md" -mmin -40
```
**③ có kết quả ⇒ phiên ĐANG CHẠY ⇒ KHÔNG đưa phiếu mới cho vùng đó.**
File đích chưa đổi mà báo cáo vừa được ghi = đang làm dở, **không phải chưa dán**.

### Và: hỏi "dán phiên nào" ⇒ trả lời bằng BẢNG, không bằng phiếu
Đúng: *"5 phiên đang chạy. 3 phiếu còn lại chặn bởi X·Y·Z. Không còn gì để dán."*
Sai: dán lại nguyên khối lệnh đã đưa.

---

## §0aa · MỘT THƯ MỤC `.next` — MỘT SERVER (chốt 07/08, sau 2 lần dính cùng ngày)

**Triệu chứng đánh lừa:** `tsc` sạch · hàm export đúng · grep thấy đủ — mà trình duyệt vẫn báo
`X is not a function`, hoặc route có trang thật vẫn trả 404.

**Gốc:** nhiều `npm run dev` cùng chạy trên CÙNG một thư mục repo ⇒ dùng chung `.next/`, ghi đè
manifest và chunk của nhau. Một trang có thể kẹt lại bản build CŨ trong khi trang khác đã mới.

**Bằng chứng đo được (ca 07/08, `/projects/[id]/present`):**
```
lib/project-scope.ts:158        export function useScopeMissingInfo   ← CÓ
git show HEAD:lib/project-scope.ts | grep -c useScopeMissingInfo → 0  ← code mới, chưa commit
grep -rl useScopeMissingInfo .next/static/chunks/
  → app/settings/page.js · app/materials/page.js · app/page.js
  → KHÔNG có app/projects/[id]/present/page.js                        ← chunk kẹt bản cũ
```

**Luật:**
1. Một thư mục repo = **một** dev server. Cần chạy song song thì mỗi phiên **một worktree riêng**
   (worktree có `.next` riêng), KHÔNG đổi port trên cùng thư mục.
2. Trước khi kết luận "lỗi code" từ lỗi runtime trình duyệt, **bắt buộc** chạy:
   `grep -rl "<tênHàm>" .next/static/chunks/ | grep "<đườngDẫnTrang>"`
   Rỗng ⇒ lỗi build cache, KHÔNG phải lỗi code. Đừng đi sửa code.
3. Gỡ: tắt hết server → `rm -rf .next` → mở lại **một** server → đợi `✓ Ready`.
4. Ca họ hàng đã ghi: `G-M4-01` (404 giả trên dev server chạy lâu). Cùng một họ bệnh —
   **dev server không phải nguồn sự thật về code.**

## §0ab · SỔ GAP LÀ ẢNH CHỤP, KHÔNG PHẢI SỰ THẬT (chốt 07/08, sau 2 lần Hoà phải chặn)

Mỗi dòng trong `docs/GAP-IF.md` là kết quả đo **tại thời điểm ghi**. Phiên khác sửa xong
thường KHÔNG cập nhật lại (§0u chỉ cho TỔNG ghi) ⇒ sổ **luôn cũ hơn repo**.

**Luật: trước khi phát phiếu bảo ai đó LÀM một việc, phải đo lại rằng việc đó CHƯA làm.**

| Định phát phiếu | Bắt buộc chạy trước |
|---|---|
| "vẽ mock màn X" | `ls docs/mocks/` + tìm theo TÊN MÀN, không chỉ grep nội dung |
| "hàm Y chưa có" | `grep -rn "Y" --include=*.ts --include=*.tsx . \| grep -v .worktrees` |
| "chưa nối UI" | tìm nơi mount THẬT, kể cả gọi gián tiếp qua API route (bẫy `computeBoq` 07/08) |
| "test chưa có" | `find . -name '*.test.ts' \| xargs grep -l "<tên>"` |

Ca 07/08: sổ ghi "67 trang mock, grep màn X = 0". Đo lại: **96 file**, có `X.dc.html` nằm đó.
Suýt phát phiếu vẽ lại 13 màn đã có. Hoà chặn.
Ca cùng ngày trước đó: so chuỗi sai dạng chuẩn hoá (NFC vs NFD) ⇒ báo "16/16 mock thiếu",
Hoà bác: *"sai. toàn bộ các mock bạn kêu thiếu -> đã có, check"*. **Dùng `unicodedata.normalize('NFC')` khi so tên file tiếng Việt.**

## §0ac · PHIẾU PHẢI TỰ KHAI DÁN VÀO ĐÂU (chốt 07/08 — Hoà phải nhắc 2 lần)

Mỗi khối lệnh TỔNG phát ra **PHẢI mở đầu bằng đúng một dòng**:

```
DÁN VÀO: p<số>   ·   vùng sở hữu: <đường dẫn>
```

Lý do: Hoà copy khối rồi dán ngay, không đối chiếu bảng ở tin nhắn khác. Bảng map riêng
là thứ dễ lạc nhất khi cuộn lại — và **dán sai phiên đắt gấp nhiều lần** vì hai phiên
cùng sửa một vùng sẽ đè code của nhau.

Kèm theo, TỔNG **PHẢI giữ `docs/00-DANG-CHO.md` là sổ duy nhất ghi phiên nào đang cầm phiếu nào**
(§0r + §0w). Trước khi phát phiếu mới: đọc sổ đó, kiểm phiên định giao có đang cầm việc khác không.

Sai đã phạm 07/08: phát 7 khối liền, không khối nào ghi số phiên ⇒ Hoà phải hỏi lại
*"cái nào dán vô p nào? quy ước tên rồi làm sai hoài"*.
