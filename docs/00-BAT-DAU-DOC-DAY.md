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
