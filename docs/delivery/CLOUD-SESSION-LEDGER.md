# SỔ PHIÊN / SLICE — kiểm kê Git canonical

**Lập** 04/09/2026 · **REPO_ROOT** `/home/user/INTERIORFLOW` · **Nguồn sự thật** Git, không phải danh sách phiên trên giao diện.
**Cách đọc**: mọi con số dưới đây đo bằng `git rev-list` / `git diff` tại thời điểm lập. Đo lại khi nghi ngờ, đừng nhớ hộ.

---

## 0 · PHÁT HIỆN NỀN — LỊCH SỬ GIT CÓ **HAI DÒNG TÁCH RỜI**

`git merge-base origin/main origin/checkpoint/2026-08-24-control-plane` → **không có tổ tiên chung**.

| Dòng | Gốc | Tổng commit | Dấu vết TTT trong cây |
|---|---|---|---|
| **main** (canonical hiện hành) | `388a8932` · 19/08/2026 | **52** | **0** |
| **checkpoint/2026-08-24-control-plane** (lưu trữ trước dọn) | `8c3d317b` · 03/07/2026 *"Initial commit from Create Next App"* | **1820** | **6 tệp** (`docs/design-candidate/TTT-PROFILE-UX-001/…`) |

**Kết luận (OBSERVED + bằng chứng):** lịch sử đã được **dọn có chủ đích** đúng theo `scripts/don-git-lich-su.sh` (Hoà duyệt 08/08 — *"XOÁ VĨNH VIỄN dấu vết TTT/khách/Pantone khỏi LỊCH SỬ git"*), rồi dòng cũ được giữ lại làm nhánh lưu trữ. `main` **không** phải lịch sử bị mất — nó là lịch sử **đã làm sạch**.

> ⛔ **LUẬT RÚT RA — CẤM MERGE DÒNG CŨ VÀO MAIN.** Merge `checkpoint`, `nhanh-*`, hay bất kỳ `feat/*` nào sẽ **kéo ngược 6 tệp TTT** và toàn bộ lịch sử vừa bị xoá trở lại — phá thẳng LUẬT TRUNG TÍNH và làm vô hiệu việc dọn. Nhánh nào gốc `8c3d317b` = **ARCHIVE, không bao giờ merge**. Cần lấy một mẩu mã từ đó thì **chép nội dung tệp**, không merge commit.

---

## 1 · MƯỜI SLICE CÓ MÃ CHƯA VÀO CANONICAL LINE

Tất cả cắt từ cùng một mốc `2dfed165` (20/08), gốc chung với main. **Đây là phần thu về.**

| SLICE | MỤC ĐÍCH | BRANCH `claude/…` | HEAD | AHEAD | TỆP | +/− | ACTION |
|---|---|---|---|---|---|---|---|
| Quyền & cộng tác | vai theo năng lực · mời có chữ ký · bình luận/duyệt xuyên máy | `project-permissions-collaboration-5delq6` | `018539e6` | 2 | 37 | +3071/−114 | **INTEGRATE** |
| Compass · lịch · họp | la bàn dự án local-first + MS365 qua registry năng lực | `compass-site-calendar-slice-8w69t6` | `29b953b2` | 1 | 36 | +2376/−13 | **INTEGRATE** |
| Tài sản `.idfc` | cửa pháp lý · kiểm đơn vị/trục · biểu diễn · seed CC0 | `asset-idfc-normalization-vwy62i` | `233fb1a1` | 1 | 23 | +2807/−5 | **INTEGRATE** |
| Thư viện + Home | `/library` tổng · Kho tri thức có nguồn gốc · xuất JSON | `interiorflow-home-library-slice-u98w4u` | `81e80c32` | 3 | 17 | +1675/−40 | **INTEGRATE** |
| Cảm hứng · đọc ảnh | bề mặt Cảm hứng → đọc ảnh → áp ý định **lùi được** vào Thẻ DNA | `inspiration-image-intelligence-qmbeuu` | `390cf1e0` | 1 | 15 | +3328/−0 | **INTEGRATE** |
| Present · BOQ · giọng | phụ lục BOQ trong deck + điều hướng slide bằng giọng | `interiorflow-present-boq-voice-4hl7aa` | `57bf575b` | 1 | 13 | +1248/−2 | **INTEGRATE** |
| Node · cài đặt AI | đường dẫn có hướng dẫn · 9 họ node · nguồn gốc kết quả · Bốn mức AI | `node-workflow-ai-settings-hqm2bi` | `a2b696f9` | 1 | 12 | +1755/−60 | **INTEGRATE** |
| Xương dữ liệu | thang độ đảm bảo chung + sổ phiên bản ghi nguyên tử cho Thẻ DNA | `canonical-data-spine-identity-izarxs` | `cb286071` | 1 | 12 | +1240/−33 | **INTEGRATE** |
| 2D · CAD | **Chỉnh lệnh vừa chạy** (B4, kiểu Blender F9) sau Dời/Chép/Xoay/Offset/Tường | `interiorflow-2d-cad-slice-s319zo` | `028d2762` | 1 | 11 | +970/−13 | **INTEGRATE** |
| Vitals · đánh giá | lõi đánh giá thiết kế 3 lớp + hành động "Đánh giá bản vẽ" | `vitals-eval-slice-uzipzg` | `b93ba4c4` | 1 | 9 | +1817/−3 | **INTEGRATE** |
| *(phiên này)* Bộ nền chrome | token bề mặt/focus/z + `Surface` · `TruthBadge` · máy canh token | `interiorflow-design-system-vbdcku` | `83b9c79c` | 3 | 15 | +1284/−14 | **INTEGRATE** |

**Tổng phần thu về: ~19.500 dòng, 202 tệp.**

### ⭐ ĐIỂM QUYẾT ĐỊNH — CHỒNG LẤN BẰNG KHÔNG
Đo: **202 tệp bị đụng · 202 tệp riêng biệt · 0 tệp bị hai nhánh cùng sửa.**
Thêm: **0 nhánh** đụng `prisma/schema.prisma` · **0** migration mới · **0** dependency mới · **0** nhánh đụng `frontier-registry.mjs` hay `lib/capabilities/registry.ts`. Chỉ nhánh bộ-nền đụng `app/globals.css`.

⇒ Về mặt cơ học, **11 nhánh gộp được theo bất kỳ thứ tự nào, không xung đột nội dung**. Rủi ro còn lại là **ngữ nghĩa** (hai slice cùng dựng một khái niệm dưới hai tên) — thứ chỉ `tsc` + test + `soi:*` bắt được, và đó là việc của cổng tích hợp §23.

---

## 2 · NHÁNH ĐÃ VÀO CANONICAL

| SLICE | BRANCH | HEAD | ACTION |
|---|---|---|---|
| Ảnh → 3D · render | `claude/interiorflow-image-to-3d-render-qqimbk` | `f43de304` = **HEAD của `origin/main`** | **KEEP** — đã là main |

---

## 3 · NHÁNH LƯU TRỮ — KHÔNG MERGE

| NHÁNH | GỐC | AHEAD so main | ACTION | LÝ DO |
|---|---|---|---|---|
| `checkpoint/2026-08-24-control-plane` | `8c3d317b` **khác dòng** | 1820 | **ARCHIVE** | lịch sử trước dọn; merge = kéo TTT về |
| `nhanh-g4` · `nhanh-phu` | `8c3d317b` **khác dòng** | 1010 · 854 | **ARCHIVE** | như trên (tháng 8) |
| 17 nhánh `feat/*` (07/2026) | `8c3d317b` **khác dòng** | 61–195 | **ARCHIVE** | như trên; nội dung đã sống trong main qua bản dọn |
| `worktree-agent-a9a70ede…` | `8c3d317b` **khác dòng** | 57 | **ARCHIVE** | worktree agent cũ |
| `backup/2026-08-19-batch0a` | `388a8932` **cùng dòng main** | 59 (behind 2) | **INVESTIGATE** | ⚠ cùng dòng với main ⇒ *có thể* chứa việc sau-dọn chưa thu; commit đầu nhắc thẳng chốt EXS (*"nới trần Work Panel 320→440"*) |

> `backup/2026-08-19-batch0a` là **nhánh lưu trữ duy nhất cùng dòng với main** ⇒ phải soi riêng, không gộp chung nhóm ARCHIVE.

---

## 4 · LUẬT VẬN HÀNH RÚT RA

1. **Gốc `8c3d317b` = ARCHIVE tuyệt đối.** Kiểm bằng `git rev-list --max-parents=0 <branch>` trước khi bàn merge bất kỳ nhánh cũ nào.
2. **Không xoá nhánh nào trong sổ này** — lưu trữ là bằng chứng, và là đường lùi nếu bản dọn sót thứ gì.
3. **Slice mới phải cắt từ `origin/main`**, không cắt từ `2dfed165` nữa (mốc đó nay đã lùi 2 commit).
4. Sổ này cập nhật **mỗi lần một slice được thu về hoặc một nhánh đổi ACTION**. Không đẻ sổ thứ hai.

---

## 5 · KẾT QUẢ THU VỀ — 04/09, nhánh `integration/2026-09-04`

Cắt từ `origin/main` (`f43de304`), gộp **11/11 nhánh, không một xung đột nào**.

| Cổng | Kết quả |
|---|---|
| `tsc --noEmit` | **0 lỗi** — 11 slice không đụng kiểu nhau |
| `npm run build` | **exit 0** · **119 route** (từ 96 ⇒ **+23**) |
| `npm test` | **exit 0**, 0 lỗi Prisma *(sau W0)* |
| `soi:frontier` · `soi:contract` | 0 LỆCH · 0 LỆCH |
| `soi:cam-dien` | 🟢 91 sống (từ 86) · 🔴 **2** kho chưa mở (từ 1) |
| `soi:hinh-hoc` | **37** ngoài thang (từ 26) |
| Tổng | **203 tệp · +21.968 / −297** |

**Hai món nợ do tích hợp sinh ra, ghi để không rơi:** thêm **1 kho chưa mở** (mã 0 nơi gọi) và **+11 giá trị radius ngoài thang**. Không chặn, nhưng phải đóng trước khi gọi là xong.

### CORE E2E — LƯỢT ĐẦU CÓ BẰNG CHỨNG **PASS**
Chạy trên máy chủ thật (`next start`) + CSDL thật, đăng nhập thật:

| Bước | Kết quả |
|---|---|
| Đăng nhập `POST /api/auth/login` | **200**, trả hồ sơ người dùng |
| Tạo bản vẽ `POST /api/flows` | **200** `rev=0` |
| Lưu `PUT` kèm `expectedRev` | **200** `rev=1` |
| **Tải lại đọc ra đúng dữ liệu đã lưu** | ✅ `Tường W-01 / 2700mm` sống nguyên |
| Gửi lại `rev` cũ | **409 `REV_CONFLICT`** — chốt chống ghi đè **có thật, chạy đúng** |
| Ảnh chụp phiên bản · chia sẻ link | **200** · token sinh ra |
| Mở link chia sẻ **không đăng nhập** | **200** |
| 20 trang (14 cấp app + 6 trong dự án) | **200 tất cả**, gồm `/inspiration` và `/library/knowledge` mới thu về |

⇒ **Xương sống một-nguồn (tạo → lưu → tải lại → chống ghi đè → chia sẻ) đã có bằng chứng chạy được**, không còn là INFERENCE.

### 🔴 RỦI RO PHÁT HÀNH PHÁT HIỆN Ở W0 — CHƯA XỬ
`prisma migrate deploy` áp đủ 6 migration nhưng chỉ dựng **21/24 bảng**: thư mục `prisma/migrations` **tụt sau `schema.prisma`** (3 model chỉ sống nhờ `db push` trước đây — xem chính tên migration `catchup_db_push_baseline`). ⇒ **Máy chủ mới triển khai bằng `migrate deploy` sẽ có CSDL THIẾU BẢNG.** Phải sinh migration bù trước khi phát hành. *(P1, không chặn phát triển.)*

---

## 6 · `backup/2026-08-19-batch0a` — MÃ MỒ CÔI, CẦN CHỦ DỰ ÁN QUYẾT

| Đo | Giá trị |
|---|---|
| Commit chưa vào main | **59** (21–22/08) |
| `git cherry origin/main` | **59/59 dấu `+`** — không commit nào có bản tương đương trong main |
| Diff so main | **201 tệp · +28.955 / −1.779** — *lớn hơn cả 11 slice cộng lại* |
| Có ở nơi khác không | **KHÔNG.** `checkpoint` có **0 commit ngày 21–22/08**, 0 tiêu đề trùng; **19 tệp chỉ tồn tại ở nhánh này** |
| Gốc | `388a8932` — **cùng dòng với main**, nên merge được về mặt lịch sử |
| Chồng lấn với 11 slice | **10 tệp**, gồm `app/globals.css` · `lib/commands/registry.ts` · `CadCanvas.tsx` · `PresentEditor.tsx` |

**Nội dung (đọc từ tiêu đề commit):** gizmo 3D bám vật kéo được · dựng khối bằng cử chỉ · deck + bản vẽ có **bản sao bền trên máy chủ** (sống qua xoá sạch trình duyệt) · mở đường về 2D từ Present · **Live Guide / Demo Conductor** · CÔNG THỨC HÌNH gom ngăn xếp theo ý định · và **`fix(rail): nới trần Work Panel 320→440 — thi hành chốt #4 Experience System`** — đúng một trong các mục DRIFT mà báo cáo bootstrap ghi là *"chưa sửa"*.

**Vì sao main hụt 10 ngày:** `main` có 26 commit ngày 19/08 + 24 ngày 20/08 rồi **đứng im tới 03/09**. Việc ngày 21–22/08 chạy trên nhánh này; việc sau đó chạy trên dòng cũ `checkpoint` (tới 01/09). Không nhánh nào được thu về.

**ACTION: `INVESTIGATE` → chờ chủ dự án.** Không tự merge: 29 nghìn dòng hành vi sản phẩm, đụng 10 tệp hợp đồng dùng chung, và cái tên `backup/` để ngỏ khả năng nó **cố ý** không được thu về.

---

## 04/09 · VA CHẠM DỰNG SONG SONG — ghi lại vì nó sẽ tái diễn

**Triệu chứng:** `npx next start` báo *"Could not find a production build in the '.next' directory"*
**hai lần liên tiếp**, ngay sau khi một bản dựng vừa báo xong.

**Đo được:** `pgrep -af "next build"` ra **ba** tiến trình dựng chạy chồng nhau. Next dựng vào
**MỘT** thư mục cố định (`.next`), nên hai bản dựng song song **ghi đè lẫn nhau** — `BUILD_ID` sinh
ra rồi biến mất giữa chừng. Đây **không phải chậm, mà là hỏng**: cả ba lane cùng không có server.

**Cùng họ với một mất mát thật hôm nay:** `.nen-chrome-out/` bị gitignore và **đã bị dọn giữa
chừng** — lô ảnh `home-that-*.png` của lane Home **biến mất khỏi đĩa** trước khi ai kịp nhìn.

⭐ **Bài học chung của cả hai ca: `claim-keys-va-cham` mới khai được TỆP, chưa khai được TÀI
NGUYÊN DÙNG CHUNG.** Hai lane không đụng một tệp nguồn nào của nhau vẫn giẫm nhau, vì cùng ghi vào:
| Tài nguyên | Ai đụng | Hậu quả khi va |
|---|---|---|
| `.next/` | mọi lệnh `build` / `dev` | bản dựng hỏng, không ai chạy được |
| cổng 3000–30xx | mọi server | cổng bị chiếm, lane sau tưởng app chết |
| `prisma/dev.db` | mọi test chạm CSDL | đã cắn một lần — đã vá bằng cách chạy test CSDL **tuần tự** |
| `.nen-chrome-out/` | mọi lane chụp màn | **mất bằng chứng**, không ai biết đã mất |

**Cách xử đã dùng (không phải luật, mới là tiền lệ):** lane nào đang chạy dở thì **giữ quyền dựng
và giữ server**; lane còn lại **dừng dựng**, chờ được nhắn cổng rồi dùng nhờ. Điều phối bằng
`SendMessage`, không bằng cách giết tiến trình của nhau — **không lane nào được giết tiến trình
của lane khác**, vì không lane nào biết lane kia đang ở bước nào.

**Việc còn nợ:** nới `claim-keys-va-cham` để khai được **tài nguyên dùng chung**, không chỉ đường
dẫn tệp. Bốn dòng bảng trên là danh sách khởi điểm.

---

## 04/09 · ĐÍNH CHÍNH MỘT BÁO CÁO CỦA LANE — "bản sao bền không ghi được gì" là SAI

**Lane 3D/Present báo:** *"`ProjectFile` trong CSDL = 0 hàng ⇒ bản sao bền trên máy chủ
(`dfd5537d`) hiện KHÔNG ghi được gì cho cả bản vẽ lẫn deck."*

**Kiểm lại tại nguồn — hai nửa, một đúng một sai:**

| Khẳng định | Phán quyết | Bằng chứng |
|---|---|---|
| `ProjectFile` = 0 hàng | ✅ **ĐÚNG** | `prisma.projectFile.count()` = **0** (Project 4 · Flow 5) |
| ⇒ đường ghi hỏng | 🔴 **SAI** | `POST /api/project-files` trả **200**, ghi hàng thật kèm `contentHash` `015df7d5…` |

**Sự thật:** đường ghi **chạy tốt**. Số 0 đến từ chỗ **cò chưa bao giờ bóp**:
`PresentSheets.tsx:436` chạy sao lưu theo **nhịp 30 giây**, và có cổng chặn
`if (!rec?.sheets.length …) return`. Muốn nó ghi thì phải có **deck ≥1 tờ mở liên tục >30s**.
Phép đo của lane chờ **20 giây** — chưa tới nhịp đầu tiên.

⭐ **BÀI HỌC, và nó là bài học về CÁCH ĐỌC BẰNG CHỨNG chứ không về deck:**
**"đếm ra 0" không phải bằng chứng "đường ống hỏng" — nó là bằng chứng "chưa có gì đi qua".**
Hai kết luận khác hẳn nhau và dẫn tới hai việc sửa khác hẳn nhau: một bên đi sửa đường ống đang
tốt, một bên đi tìm xem vì sao cò không bóp. Muốn phân biệt thì phải **bơm thử một giọt qua ống** —
đúng phép thử đã làm ở đây, tốn một phút.

🪤 **MỘT CÁI BẪY NỮA, cùng ca, đã cắn CHÍNH TÔI trước khi cắn ai khác**: `flow.id ≠ project.id`.
`/api/flows` trả `{ id: <flow>, project: { id: <project> } }`, mà **đường dẫn app dùng flow id**
(`/projects/<flowId>/present`). Lấy nhầm id thì `/api/project-files` trả *"Không tìm thấy dự án"* —
đọc hệt như "không có dữ liệu". Máy chụp trong repo lấy ĐÚNG
(`it?.projectId ?? it?.project?.id ?? it?.id`); phép thử đầu tiên của tôi thì lấy SAI, và tôi
suýt ghi kết luận từ đó.

**Còn chưa biết (không được kết luận thay):** deck **có** sống qua tải lại khi IndexedDB còn
nguyên hay không. Phép đo của tôi rơi vào hồ sơ **0 tờ** nên cổng chặn không cho ghi, và
`interiorflow-sheets/sheets` = 0 trước lẫn sau tải lại — tức **chưa dựng được tiền đề của phép
thử**, chứ không phải đã chứng minh điều gì.
