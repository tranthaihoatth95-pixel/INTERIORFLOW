<!-- ═══════════════════════════════════════════════════════════════════════════════════════
     BỘ NẠP — đọc khối này TRƯỚC, rồi mới đọc phần còn lại của tệp.
     ═══════════════════════════════════════════════════════════════════════════════════════ -->

# ⚡ BỘ NẠP PHIÊN MỚI — đọc 4 tệp, đừng quét lại cả repo

Repo này có ~700 tệp tài liệu. Quét lại từ đầu mỗi phiên là cách đốt nửa phiên mà không làm được gì.
**Não bền của dự án nằm ở `docs/control/`.** Đọc theo đúng thứ tự:

> 🔴 **SỬA 28/08 — BỘ NẠP CŨ THIẾU MỘT CÂU HỎI, VÀ ĐÓ LÀ CÂU ĐẦU TIÊN.**
> Bốn tệp cũ trả lời: *đang ở đâu · bị cấm gì · đã ngã ở đâu · cầm được gì*. **Không tệp nào trả
> lời `IF LÀ GÌ`.** Hiến pháp kiến trúc (`docs/IF-KIEN-TRUC-OS.md`, Hoà chốt 18/08) chỉ được trỏ
> tới từ `docs/CLAUDE.md` — đúng tệp đã đóng dấu *"KHÔNG CÒN LÀ CỬA VÀO"*. Cùng số phận với tệp
> mô tả **cách làm việc với Hoà**. Hai lần cùng một cơ chế: **danh tính bị hạ xuống, thủ tục được
> đưa lên.** Hệ quả đo được: phiên thức dậy biết phải làm gì tiếp, **không biết mình đang xây cái
> gì, cho ai** — rồi tóm đề bằng kết quả thay vì bằng bản chất. Hoà bắt được lỗi này 28/08.
> ⇒ Ba hàng `0a`/`0b`/`0c` dưới đây đọc **trước** mọi thứ. Chúng ngắn.
> `0a` **IF là gì** · `0b` **làm việc với Hoà thế nào** · `0c` **Hoà vừa nhắn gì**.
> Cả ba đều là thứ Hoà đã có sẵn; không tệp nào trong số đó do máy đẻ ra.

| # | Tệp | Trả lời câu gì | Khi nào đọc |
|---|---|---|---|
| **0a** | `docs/IF-KIEN-TRUC-OS.md` | **IF LÀ GÌ** — Local-first Design OS · *Own your data · workflow · memory · Replace your AI*. Trên mọi chốt khác | **luôn luôn, đầu tiên** |
| **0b** | `~/PROJECT/CLAUDE.md` §3 + §5 | **LÀM VIỆC VỚI HOÀ THẾ NÀO** — *"Hoà nói, Claude ghi hộ, không bắt Hoà điền form"* · *"không đề xuất chung chung, phải trích được nguồn"*. **Hoà tự viết 26/08.** Đây là bản canonical — cấm đẻ bản thứ hai trong repo (luật 6) | **luôn luôn**, ngoài repo, đọc chỉ-đọc |
| **0c** | `~/PROJECT/INBOX.md` | **Hoà vừa nhắn gì** — hộp thư anh tự dựng 26/08 (*"chỗ đổ ý nghĩ, đừng nghĩ nó thuộc đâu"*). Anh gõ một dòng, phiên sau thấy, không phải dán lại | **luôn luôn**, chỉ-đọc, vài giây |
| 1 | `docs/control/IF-CURRENT-STATE.md` | đang ở đâu · runtime nào · **việc kế tiếp chính xác** | **luôn luôn**, nó nhỏ |
| 2 | `docs/control/IF-CANONICAL.md` | IF **LÀ GÌ** · luật bền · ai quyết cái gì | **luôn luôn** |
| 3 | `docs/control/IF-UXUI-OPERATING-MEMORY.md` | **những sai lầm đã trả giá** | trước mọi việc giao diện |
| 4 | `docs/control/IF-TOOLING-RECEIPT.md` | năng lực **THẬT** đã xác minh | trước khi định dùng một công cụ |

**Tra câu hỏi trước khi tìm ngoài:** `docs/control/IF-HOI-DAP.md` — mục lục **theo câu hỏi**, không
theo tệp. Lệnh nghiên cứu nay là: ① tra bảng đó → ② tra kho ngoài repo → ③ mới ra ngoài tìm, và
chỉ tìm **điều mới** → ④ tư vấn kèm phần đã có. Bỏ bước ① là đẻ ra "đề xuất lại thứ đã có" (N8).

Tra khi cần, **đừng nạp sẵn**: `docs/control/IF-AUDIT-MEMORY.md` (khi điều tra) ·
`docs/design-campaign/02-FAILURE-LEDGER.md` (khi một lỗi lặp lại) ·
`docs/control/IF-ADVICE-VERIFICATION-GATE.md` (**trước khi biến một khuyến nghị thành quyết định
bền hoặc thành mã** — `IF-DEC-*` · `EV-*` · `DISS-*` · `GATE-*` · `REC-*`).

## Skill — nạp đúng nhánh, cấm nạp cả kho
`if-design` bộ định tuyến thiết kế · `if-design-review` trọng tài chấm độc lập ·
`if-ui-convergence` đưa một bề mặt đi trọn · `if-audit` audit có mục tiêu · `if-handoff` bàn giao phiên.

## Chín luật vận hành — thuộc lòng, không cần mở tệp
1. **Đọc control plane trước.** Cấm quét lại toàn repo trừ khi 4 tệp trên chứng minh là không đủ.
2. **MỘT người ghi sản xuất** tại một thời điểm.
3. **Claude Design sở hữu phần người dùng nhìn thấy.** MAIN thi công, **không âm thầm thiết kế lại**.
4. **App thật thắng bản vẽ.** Bản vẽ thắng lời nói.
5. **Không dữ liệu giả. Không PASS giả. Không tự tin giả.**
6. **Tái dùng khuôn canonical** — đẻ khuôn thứ hai là bắt đầu phân kỳ.
7. **Lỗi hệ thống thì chữa bằng hệ thống** (luật · máy canh · đổi cấu trúc), không chữa bằng vá ca.
8. **Đi trọn tới chứng minh trên runtime.** Dừng ở "đã viết mã" là chưa xong.
9. **Xong = 9 mục** (xem `IF-CANONICAL.md` §7). Thiếu một mục là chưa xong.

> Luật thiết kế chi tiết **KHÔNG** nằm ở tệp này — chúng ở skill `if-design`. Tệp này chỉ nạp não.

---

> **MỘT NGUỒN — `AGENTS.md` là SYMLINK trỏ vào chính file này (T gộp 15/08).** Trước đó hai file
> là hai bản sao gần y hệt, đã bắt đầu phân kỳ: bản `AGENTS.md` ghi sai `.Codex/launch.json`
> (repo thật là `.claude/launch.json`) + đeo thêm 3 dòng phụ lục cụt. Sửa một bên quên bên kia là
> chuyện chắc chắn xảy ra, nên **cấm dựng lại bản sao thứ hai của luật nền** — công cụ nào cần
> `AGENTS.md` thì đọc qua symlink. Sửa luật: sửa `CLAUDE.md`, hết.

## Bắt đầu session
🔴 **DÒNG NÀY ĐÃ ĐỔI 23/08 — bản cũ ra lệnh đọc `STATUS.md` rồi `00-CHOT.md` TRƯỚC TIÊN.**
Câu đó nay **mâu thuẫn với BỘ NẠP ở đầu tệp**, và mâu thuẫn ấy đã gây hỏng thật: một phiên nguội
làm bài kiểm 23/08 theo đúng câu này, đi vào `STATUS.md` (bản 19/08) → `LATEST.md` → sổ phiên cũ,
và **không mở một tệp nào trong `docs/control/`**. Nó vẫn trả lời đúng — nhưng bằng nguồn CŨ, rải rác.
⇒ Não bền viết ra mà không ai đi tới thì bằng không (luật M-24).

**Thứ tự đúng: đọc BỘ NẠP ở đầu tệp này → `docs/control/` → rồi mới tra tiếp nếu cần.**
`STATUS.md` và `00-CHOT.md` nay là **NHẬT KÝ**: tra khi cần khảo cổ một quyết định, KHÔNG dùng làm
bức tranh hiện tại. Bức tranh hiện tại ở `docs/control/IF-CURRENT-STATE.md`.

## Quy tắc worktree & context

### Giới hạn cứng
- **Tối đa 5 worktree cùng lúc** (= 5 agent song song, tăng từ 3 lên 5 sau 21/07). Nếu đã có 5, KHÔNG tạo thêm — hỏi chủ dự án worktree nào dọn trước.
- **MỘT đường worktree duy nhất: `.claude/worktrees/`** (Claude Code tự tạo `agent-*` ở đó). Không tạo worktree ngoài repo (`~/Downloads/interiorflow-wt-*`) nữa — pattern cũ 07-08/07 đã hết dùng; ai muốn khôi phục phải sửa CLAUDE.md trước, không được vừa làm vừa thêm luật. Chỉ hai máy soi walk-từ-ROOT (`soi-that.mjs`, `check-chot.mjs`) và `package.json test` mới thực sự chạm đường này — cả ba đã dùng khuôn hàm `.includes('worktrees')`/cả `.worktrees` lẫn `.claude/worktrees` (bền với mọi chỗ đặt). Năm máy soi walk-từ-scan-dirs (`soi-frontier`, `soi-tu-dien`, `soi-contract`, `soi-thao-tac`, `soi-hinh-hoc`) không chạm; `SKIP` của chúng vẫn giữ `.worktrees` như phòng ngừa.

### Dọn cuối phiên — CƠ CHẾ AN TOÀN (21/07 rule mới)
Cuối mỗi phiên (hoặc khi chủ dự án bảo dọn), tự động dọn worktree nhưng CHỈ khi đủ MỌI điều kiện an toàn dưới đây — thiếu 1 điều là DỪNG lại, báo chủ dự án, KHÔNG dùng force:
1. Nhánh của worktree đã MERGE vào nhánh tích hợp (`git branch --merged feat/present-layout-ml-p1` liệt kê).
2. `git -C <worktree> status --short` SẠCH (không có file dirty/untracked ngoài `IF1_IF2_BIGPICTURE.md` gitignore).
3. Không có dev server nào còn chạy trong thư mục worktree (`lsof` check).
4. Không có branch nào chỉ tồn tại ở worktree đó mà chưa push/merge (mất commit là mất luôn).
Nếu 4 điều kiện đủ: `git worktree remove <path>` (KHÔNG `--force`) + `git branch -d <branch>` (KHÔNG `-D`) + gỡ entry trong `.claude/launch.json` nếu có. Nếu 1 điều kiện thiếu: giữ nguyên worktree, ghi rõ lý do vào STATUS.md phần "Worktree đang mở", để chủ dự án quyết.

### Sau khi merge nhánh vào main
1. Chạy test + tsc trên main — PASS mới tiếp.
2. **Xoá worktree đã merge NGAY** — `git worktree remove .claude/worktrees/{tên}`.
3. Xoá nhánh remote nếu đã push: `git branch -d feat/{tên} && git push origin --delete feat/{tên}`.
4. Cập nhật STATUS.md: chuyển mục "đang chạy" sang "vừa xong" hoặc CHANGELOG.md.

### Trước khi bắt đầu sprint mới
- Chạy `git worktree list` — nếu còn worktree cũ từ sprint trước → **DỪNG, báo chủ dự án**, không tự tạo worktree mới chồng lên.
- Kiểm tra `.claude/worktrees/` không còn thư mục `agent-*` mồ côi (agent đã đóng nhưng worktree không được dọn).

### Chống tràn context
- 🔴 **LUẬT NÀY ĐÃ HẾT ÁP DỤNG CHO `STATUS.md` (28/08).** Nguyên văn cũ: *"STATUS.md **dưới 800
  từ**. Lịch sử đã xong chuyển sang CHANGELOG.md."* Trần 800 từ có nghĩa khi `STATUS.md` còn là
  **bức tranh hiện tại** — một tệp nóng thì phải ngắn để đọc được nhanh. Nhưng chính tệp này đã hạ
  nó xuống **NHẬT KÝ** ngày 23/08 (xem dòng "Bắt đầu session" ở trên), và **cắt ngắn một cuốn nhật
  ký là xoá bằng chứng**, không phải dọn dẹp. Đo 28/08: `STATUS.md` 1657 từ — **để nguyên**.
  ⇒ Trần độ dài nay áp cho **`docs/control/IF-CURRENT-STATE.md`** (tệp nóng thật sự): giữ nhỏ, cấm
  để triết lý dài hạn, cập nhật trước khi kết phiên.
- KHÔNG đọc CHANGELOG.md mỗi đầu phiên — chỉ đọc khi được yêu cầu.
- Nếu gặp lỗi "autocompact thrashing" → nguyên nhân là file quá lớn hoặc quá nhiều file trong context. Báo ngay, KHÔNG tự retry liên tục.

## Project Knowledge
⛔ **`knowledge/` TRONG REPO LÀ RỖNG — đừng đi tìm tài liệu ở đó.** Kiểm 05/08: `ls knowledge/` = 0 file, `git ls-files knowledge` = 0 dòng. Thư mục rỗng còn lại chỉ là vỏ.

Bản `knowledge/ttt-design-system/` (hệ thiết kế TTT) **đã dời hẳn ra ngoài repo** theo LUẬT TRUNG TÍNH — nó là tài sản thương hiệu của MỘT studio, không được nằm trong sản phẩm bán ra (xem LUẬT NỀN TẢNG bên dưới + `docs/00-CHOT.md` mục "Dọn trung tính 01/08"). `.gitignore` đã chặn đường về.
Cần tra nó khi làm **tài liệu/báo cáo CHO TTT** (KHÔNG áp vào sản phẩm) thì đọc từ ngoài repo — hỏi Hoà đường dẫn hiện tại; sổ 01/08 ghi `~/Downloads/_TTT-BRAND/`, chưa xác minh lại trong phiên này.

> Ghi chú 05/08 (S6/T9): mục này TRƯỚC ĐÂY ghi *"Tài liệu tham chiếu đã load vào `knowledge/`"* — sai hiện trạng, khiến phiên sau tin là có tài liệu, đi tìm, không thấy, rồi tự suy diễn. Đó đúng là cơ chế đẻ ra "đề xuất lại thứ đã có" (luật N8).

### 📦 Dữ liệu tham khảo đã TÁCH RA NGOÀI repo (24/07)
Theo Luật trung tính, các thư mục sau **không còn trong repo** (đã chuyển, KHÔNG xoá) — nằm ở **`~/Downloads/interiorflow-reference/`**:
- `project-references/` — 4 PDF hồ sơ dự án khách thật (Sungroup Beach Club, HV Office, Detech Complex), 121MB
- `ttt-brand/` — TTT Brand Guideline 5 biến thể
- `san pham dau ra/` — 51 ảnh sản phẩm tham khảo
- `dev.db.bak-*` — 2 bản sao DB cũ, 274MB

→ Cần tra tài liệu tham khảo thì đọc từ đường dẫn ngoài repo đó. **Không copy trở lại vào repo.**

## ⛔ LUẬT NỀN TẢNG — IF là SẢN PHẨM ĐỘC LẬP, GLOBAL (rule hardcore 24/07)
**InteriorFlow KHÔNG phải tool nội bộ TTT. Đây là sản phẩm độc lập, bán/dùng toàn cầu, KHÔNG dính thương hiệu TTT.**

1. **TUYỆT ĐỐI KHÔNG nhúng cứng thương hiệu TTT (hay bất kỳ studio nào) vào sản phẩm** — không logo, tên, màu, font TTT trong khung tên CAD, intro, brand mặc định, placeholder, deck mẫu. TTT chỉ là MỘT người dùng như mọi studio khác.
2. **Brand Kit = nhận diện riêng của TỪNG DỰ ÁN** (logo · màu · font · watermark của khách hàng/dự án đó). Mọi chỗ cần thương hiệu (khung tên bản vẽ, footer slide, watermark, export) PHẢI đọc từ Brand Kit của dự án đang mở, KHÔNG hardcode.
3. **Không áp đặt ngôn ngữ thiết kế nào lên nội dung người dùng.** App phải cho chọn tự do — serif/sans/mọi bộ font, mọi palette. 3 bộ FontPairing (Editorial/Modern/Elegant) là ĐÚNG cho sản phẩm global, serif KHÔNG phải lỗi.
4. **UI của chính app** có nhận diện riêng của InteriorFlow (trung tính, quốc tế), tách khỏi nội dung dự án người dùng tạo.
5. **Song ngữ**: giao diện hỗ trợ VI/EN (đã có switcher) — không mặc định chỉ tiếng Việt.

> `knowledge/ttt-design-system/` chỉ dùng khi làm **tài liệu/báo cáo CHO TTT** (vd báo cáo BGĐ), KHÔNG áp vào sản phẩm. (`ttt-brand/` đã tách ra ngoài repo — xem trên.)
> ✅ ĐÃ DỌN 24/07 (nhánh `fix/de-ttt` merged): khung tên CAD `titleBlockPro()` đọc Brand Kit dự án · brand mặc định rỗng · intro bỏ chip TTT · deck mẫu "Atelier Nord" · **system prompt Vitals** không còn ép gu TTT · comment định vị sửa.
> 🔴 CÒN SÓT (bảng đầy đủ ở `docs/AUDIT-BRAND-PII.md`): `content-deck.ts:113` hardcode `DETECH · CONCEPT` lên mọi deck user sinh · 53 ảnh mặt tiền là render khách (`public/wallpapers/ttt-*`, `covers/`, `detech/`) · `package.json` author/appId `com.ttt.*` · installers cert + Android package `com.tttarchitects.*` · mật khẩu test trong comment (`IntroSequence.tsx:21`) · 3 route mẫu công khai (`/present`, `/demo-amanoi`, deck `IKI Village`).
> ⚖️ RỦI RO PHÁP LÝ: `docs/LICENSE-NOTES.md` miễn trừ GPL-3.0 của `libredwg-web` dựa trên "tool nội bộ, không bán" — lập luận này CHẾT với định vị global. Xem `docs/RESEARCH-DWG-LICENSE.md`.
