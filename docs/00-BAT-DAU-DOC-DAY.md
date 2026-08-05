# 00 · BẮT ĐẦU ĐỌC ĐÂY — mọi phiên, mọi vai, đọc trước khi làm bất cứ gì
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
2. Phần chưa có tính năng: **nút/ô hiện dạng `disabled` KÈM LÝ DO tại chỗ** — *"Chưa dựng được — hiện dùng Tường hoặc đùn từ bản vẽ"*. **CẤM nút giả bấm không ra gì** (mẫu đúng đã có: `Command3DPanel.tsx:113,139`).
3. Mỗi ô trống trên giao diện = **một dòng trong `CHECKLIST-TONG.md`**. Hai bên phải khớp 1-1; lệch là có thứ bị rớt.
4. Phiên code KHÔNG được xoá ô trống cho gọn mắt — ô trống là **bằng chứng còn việc**. Muốn bỏ phải trình TỔNG kèm lý do.
5. Áp cho CẢ hai app: IF và ArchiNote.

**Ca bệnh làm luật này ra đời:** 6 tầng lệnh dựng hình 3D (`SPEC-DUNG-BO-LENH-3D`) nghiên cứu xong nhưng **giao diện chỉ có nút Tường** — 5 khối còn lại disabled, còn extrude/lathe/sweep/loft/boolean/symmetry/array **không hề xuất hiện trên màn**. Không ai nhìn ra đang thiếu gì cho tới khi Hoà tự nhớ ra và hỏi.
