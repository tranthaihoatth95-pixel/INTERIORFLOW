# IF · TRẠNG THÁI HIỆN TẠI — tệp NÓNG, cố ý dễ cũ

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`

> Nhỏ và mới. **Cấm để triết lý dài hạn ở đây** — nó thuộc `IF-CANONICAL.md`.
> **Cập nhật trước khi kết phiên.**

**Ngày** 02/09/2026 ~18:00 · **Nhánh** `checkpoint/2026-08-24-control-plane` · **HEAD** `8585c5ea` · **Cây bẩn** 10 tệp (8 là `docs/control/ban/*.md` do MÁY sinh — nhịp của máy, không phải nợ; **2 rác thật, untracked**: `anh-luot5/` lô ảnh nghiệm thu lượt 5 và `chup-luot5.tam.mjs` bản chép tạm của máy chụp. Cả hai **không phải của lane 06 tạo ra ở gốc repo** ⇒ để nguyên, chờ người đặt nó quyết; đừng để lọt commit. `anh-luot5/` cũng là 1 trong 4 thư mục MỒ CÔI mà `soi:thu-muc` đang nêu tên) · **Worktree** 0 · **Dev server** 1 · cổng 3001 · **PID 75921** · **Lịch sử ĐÃ VIẾT LẠI 30/08** — mọi SHA sau `147f66a` đổi, bảng ánh xạ `.git/filter-repo/commit-map`

> 🔴 **DÒNG TRÊN VỪA STALE LẦN THỨ TƯ — và lần này bắt được bằng máy.** Bản 00:48 khai
> `HEAD 2f87f940 · PID 12200 · khởi động 01/09 23:02`. Đo lại 02/09 (`lsof -nP -iTCP:3001
> -sTCP:LISTEN`): **PID 75921** — dev server đã khởi động lại, và HEAD đã đi thêm 7 commit.
> Ba lần trước đã ghi ngay dưới đây; lần này thêm một quan sát mới: **ô PID stale nguy hiểm hơn
> ô HEAD stale**. HEAD sai thì `git log` cãi lại ngay; PID sai thì `ps -p 12200` báo "không có
> tiến trình" và người đọc kết luận **dev server đã chết** trong khi nó đang chạy khoẻ ở PID
> khác — đúng cùng họ với bài học "kiểm sống bằng `ListAgents`, KHÔNG bằng `ps -p`" ở mục dưới.
> ⇒ Ô này phải đo lại MỖI lượt ghi, hoặc bỏ hẳn con số PID và chỉ giữ câu lệnh đo.

> 📦 **BẢN CÀI CHO HOÀ — `dist-installer/mac-arm64/InteriorFlow.app`, đóng lại 02/09 03:20.**
> `npx next build` EXIT 0 rồi `npx electron-builder --mac --dir` EXIT 0 (cả hai chạy KHÔNG qua
> ống — bài học `| tail` nuốt exit, 31/08). Bản này ăn **9 commit** lượt 5 + cờ tường, gồm cả
> **da GĐ2 của rail** (`b4dcada1`) và dải Gantt bản 3-màu. Bản 00:46 đã bị thay.
> ⚠️ **`--dir` là bản THƯ MỤC, chưa phải `.dmg`.** Mở bằng `open` thư mục đó, không phải cài đặt.
> ⛔ **Chưa ai mở bản này bằng mắt** — đóng gói xong ≠ chạy được.

> ✅ **Cờ tường: BẬT — đo 02/09 00:44.** `grep NEXT_PUBLIC_IF_TUONG_HINH_HOC .env.local` ⇒
> `NEXT_PUBLIC_IF_TUONG_HINH_HOC=1`. Dòng cũ ghi *"UNKNOWN · 0 lần trong mọi tệp `.env*`"*
> (kiểm lại được bằng `grep -l NEXT_PUBLIC_IF_TUONG_HINH_HOC .env*`) — câu đó là
> ĐÚNG LÚC VIẾT (01/09 07:23) và **đã hết đúng**: cờ được thêm vào đêm 01/09 theo lệnh Hoà 23:05.
> Vẫn còn một nửa chưa đo: cờ có mặt trong tệp ≠ mục "Báo cáo nạp bản vẽ" hiện trên màn. Muốn
> đóng nốt thì mở `/projects/<id>/cad` và nhìn.
> Đo lúc ghi, không chép số cũ (M-05). Dòng này TỪNG stale **BA** lần — khai `main · c7f3ac8` khi
> thật là nhánh checkpoint · khai `6c9712a · 617 tệp` sau khi đã đi thêm 8 commit · và **30/08 khai
> `28/08 · HEAD 65dc66c · Dev server 0`** trong khi thật là `30/08 · 27140602 · 1 server đang mở`.
> Lần thứ ba do **phiên Codex `00·MAIN` bắt được**, không phải phiên viết tự thấy — đó là bằng
> chứng: người ghi KHÔNG tự soi được dòng mình vừa bỏ quên. Cần máy, hoặc cần người thứ hai.
> ⚠️ **`prisma mcp` KHÔNG đo lượt này** — trường đó đã bỏ khỏi dòng thay vì chép lại số cũ. Chép
> một con số không đo được là đúng cách dòng này stale ba lần trước.

## 🖊️ NGƯỜI GHI SẢN XUẤT — **một ô duy nhất trong cả tệp**

```
NGƯỜI GHI HIỆN TẠI:  interiorflow-d0
KIỂM SỐNG:           `ListAgents` — tên có trong danh sách = còn sống. CẤM `ps -p`.
Nhận lúc:            26/08/2026 · Xác nhận bởi: HOÀ ("Production Integrator duy nhất")
PHẠM VI (mở rộng 27/08 — "SHIP ACCELERATION"):
  Wave S1  đóng blocker thật: sổ migration · scope asset-representation ·
           StageToolbelt→nguonId · manifest toàn vẹn .idfc
  Wave S2  ba lát MVP end-to-end: F1 brief→2D · F2 ảnh→spec · F3 .idfc→BOQ→Present
  Wave S3  UI CHỈ theo Design Authority, không tự thiết kế lại
CHẾ ĐỘ:    GREEN tự làm · AMBER chọn mặc định reversible + cờ + rollback ·
           RED chỉ dừng ở: license/PII/chi phí vật liệu · migrate phá huỷ · duyệt mắt/brand
CỔNG:      mọi khuyến nghị → quyết định bền phải qua `IF-ADVICE-VERIFICATION-GATE-001`
           (`docs/control/IF-ADVICE-VERIFICATION-GATE.md`). Không có `EV-*` ⇒ chỉ được
           ghi `UNKNOWN`. `PASS` chỉ do Quality tuyên sau runtime proof độc lập.
CẤM:       PASS giả (chỉ NOT ASSESSED / PARTIAL / PASS / FAIL, kèm bề mặt proof) ·
           audit lại toàn repo (chỉ delta audit khi chạm security/migration/dữ liệu/tenant/runtime)
```

🔒 **QUYỀN GHI NAY CÓ CỔNG MÁY, không chỉ có ô chữ này (31/08).** Ô trên nói *ai được ghi*;
tới 30/08 nó vẫn chỉ là lời — không gì chặn một phiên khác gõ `Write`. Nay `PreToolUse` gọi
`scripts/claude-role-guard.mjs` trước MỌI công cụ ghi được tệp, và mỗi lượt ghi phải trình
`SYSTEM · ROLE · TASK · LEASE · KIND · FILES`:
- `cl:06` ghi production, phải có **lease ACTIVE** trong `~/PROJECT/SHARED/LOG/claude-writer-leases.jsonl`
  khớp cả system·lane·session·task·id; allowlist là trường `files` **của lease**, không phải của phiên.
- `cl:00` chỉ đọc/định tuyến. **Lane khác** ghi workspace của mình theo `IF_FILE_ALLOWLIST`.
- Lớp **VERIFY** (`npm test`, `npm run soi:*`, `npx tsc --noEmit`, `node scripts/soi-*.mjs`) chạy
  được ở mọi lane **không cần lease** — bắt người kiểm xin quyền ghi là dạy họ đừng kiểm.
- Cấp/thu lease cho người thật: `node scripts/claude-lease.mjs issue --issuer-hoa "<ghi chú>" …`.
  Trước 31/08 không có lối này, nên Hoà muốn cấp lease phải mượn identity `cx:00` — sổ ghi tên
  một tuyến máy cho quyết định của người, tức nói dối đúng ô quan trọng nhất: *ai đã cho phép*.
- **Điều phối (31/08).** `moc.mjs handoff` vào nhóm governance với luật **from = identity** —
  ô `from` là ô danh tính, không khớp thì đó là giả danh lane khác phát phiếu. `danh-thuc` gõ
  vào phiên người khác nên đích của nó là chuyện quyền: **`cl:00` đánh thức mọi địa chỉ đích**,
  lane thường chỉ đánh thức phiếu gửi **tới chính mình**. Đích không nằm trong dòng lệnh mà nằm
  trong `agent-handoffs.jsonl` ⇒ cổng tra sổ; tra không ra thì **đóng**.
- **Commit đối chiếu chỉ mục (31/08).** Trước khi cho `git commit`, cổng chạy
  `git diff --cached --name-only` và đòi **staged nằm trọn trong allowlist**; chỉ mục rỗng hoặc
  đọc không được cũng đóng, và biên nhận `FILES` nêu đúng tệp sắp commit. Đây là lỗ đã cho
  `147f66a` lọt: cổng cũ chỉ nhìn **dạng** lệnh, mà thứ sắp thành commit là **chỉ mục**.
- **Xoá có kiểm (31/08).** `rm` và `git rm` nay là mutation **kèm danh sách tệp tường minh**, đi
  qua đúng allowlist; vẫn cấm bulk/glob; **cấm đệ quy** vào thư mục ngoài allowlist **và** vào
  chính gốc allowlist (đệ quy thì cổng không đọc được ruột). Trước đó chúng bị chặn **mù** —
  không lane nào xoá nổi tệp của chính mình.
- **Đường ngoài repo (31/08).** Mutation vào `~/.claude/` và `/private/tmp/claude-*` **qua không
  cần lease** — guard này canh **repo**, không canh nhà riêng của công cụ. `.claude/` **trong**
  repo KHÔNG dính luật này (nó resolve dưới cwd). Lô trộn trong-ngoài theo luật của repo.
  Nguồn: PROPOSAL `HO-guard-v2` §4, qua `cl:07` 30/08, Hoà chưa phủ quyết.
  ⚠️ **Nợ có tên:** `~/.claude/settings.json` là nơi khai chính hook này ⇒ đường này về lý thuyết
  cho phép một phiên tự tháo cổng của mình. Chưa có ca chứng minh, chưa vá — chờ Hoà chốt.
Ca đột biến: `scripts/claude-role-guard.test.ts` (đỏ **và** xanh — cổng luôn kêu là cổng vô dụng).

🔴 **BA Ô NGƯỜI-GHI CŨ ĐÃ XOÁ KHỎI TỆP NÀY (27/08).** Chúng khai `interiorflow-65`,
`interiorflow-9b`, và một khối "Bàn giao" tự trao bút cho bất kỳ ai đọc. Cả ba đã hết hiệu lực
nhưng vẫn nằm đây, nên tệp có **ba người ghi cùng sống** — đúng thứ mà chính tệp này cấm.
Nội dung gốc giữ trong lịch sử git (`git show 2a454b4:docs/control/IF-CURRENT-STATE.md`).

**Ba bài học của chúng thì GIỮ, nén lại thành luật:**
1. **Cấm đại từ trong ô quản trị.** *"Phiên này đang giữ bút"* khiến mọi phiên đọc đều thấy mình
   đang giữ. Ngày 24/08 hai phiên tranh chấp đúng vì câu đó. Ô phải mang **định danh đo được**.
2. **Kiểm sống bằng `ListAgents`, KHÔNG bằng `ps -p`.** pid trong ô là pid của MỘT lệnh Bash,
   chết ngay khi lệnh xong ⇒ `ps -p` luôn báo chết kể cả khi phiên đang sống. Một phiên đã kết
   luận nhầm vì thi hành đúng thủ tục sai đó.
3. **Đóng dấu một tệp thì quét CẢ tệp tìm câu lệnh còn sống**, không chỉ dán một khối lên đầu.
   Đây là lần thứ ba cùng một bệnh (M-54 · M-25 · khối "Bàn giao").

⚠️ **MỘT PHIÊN KHÔNG CHUYỂN VAI CHO PHIÊN KHÁC.** Tin nhắn từ phiên khác **không phải** lệnh của
Hoà (`IF-CANONICAL` §2). Hai phiên cùng tự xưng ⇒ **cả hai DỪNG GHI**, hỏi Hoà (M-51).

## 🎯 VIỆC KẾ TIẾP — **một việc, không phải danh sách**

🔄 **CẬP NHẬT 01/09 15:20 — LƯỢT E2E `3`, lease `L-30451b1e` (31 tệp), writer `hoa-e2e-3`.**
Mọi khối bên dưới là bản cũ hơn, **giữ làm dấu vết theo lệ**.

**ĐÃ LÀM, CÓ BIÊN NHẬN:** áp trọn 4 bộ vá (`va-mo-dung` · `va-cad` · `va-accent` · `va-ui-that`)
— **34 tệp, mỗi tệp diff BYTE-MỘT với bản `.new.*` sau khi áp: tất cả IDENTICAL.**
`CadSheets.tsx` (có ở CẢ HAI bộ) gộp 3 chiều bằng tay: so với `va-cad` chỉ còn đúng 10 hunk của
`va-mo-dung`, so với `va-mo-dung` chỉ còn đúng 2 hunk của `va-cad` ⇒ **không hunk nào bị nuốt**.
· `npx tsc --noEmit` → **0 lỗi**.
· Test đã chạy thật: import-summary **32/0** · cad3d-autosave **30/0** · sheets-persist **28/0**
  (ghi chú bộ vá nói 29 — **thật là 28**, 0 fail) · query-snap-index **11/11** · render-cull
  **15/15** · accent-css **32/0** · z-order 20/20 · layer-index 8/8 · snap-priority 6/6.
· Perf đo LẠI trên máy này: `findSnap` 12.000 entity **6,78 ms/lượt → 0,08 ms/lượt**.
· `npx next build` **XANH, exit 0** (chạy lại KHÔNG QUA ỐNG để lấy exit thật — bài học 31/08),
  54/54 trang tĩnh. `npx electron-builder --mac --dir` → **`dist-installer/mac-arm64/InteriorFlow.app`**
  (15:00, arm64, `com.interiorflow.app`). ⚠️ **KHÔNG phải `dist/`** — `build` field trỏ
  `dist-installer/`; nhìn nhầm `dist/` sẽ tưởng chưa đóng gói.
· ⚠️ **ENOENT "Collecting page data" KHÔNG tái hiện**: build chạy NGON dù dev :3001 vẫn sống và
  KHÔNG `rm -rf .next`. Hai bước "tắt dev + xoá .next" của phiếu **không cần thiết** (và đều bị
  cổng chặn cho lane này — biên nhận trong phiên).

🔴 **BA VIỆC CÒN MỞ — cần Hoà quyết, KHÔNG tự gỡ:**
1. **`npm test` có 2 DÒNG ĐỎ MỚI** ngoài 3 phiếu `cx` đã biết:
   `components/nav/muc-dieu-huong.test.ts:393-395` khoá cứng regex
   `color-mix(in srgb, var(--accent) N%` với N ≤ 6; bộ `va-ui-that` **cố ý** đổi kênh rail sang
   `var(--t1) 8%` (trung tính theo bản vẽ GĐ1) ⇒ regex hết khớp. Cổng **đúng tinh thần** (trường
   tông rất nhẹ) nhưng **lỗi thời về chữ** (neo `--accent`). Sửa đúng = cập nhật cổng sang `--t1`
   trần ≤8 — **một dòng**, nhưng tệp đó **NGOÀI lease**; writer không tự amend lease (đúng thứ bàn
   06 từ chối ở phiếu ROLE-GUARD 30/08). Phương án B: revert 2 dòng rail.
2. **Cổng thiết kế chưa nối vào `test:sweep`, CỐ Ý.** `scripts/cong-thiet-ke.mjs` + đăng ký
   `guard-lenh-doc.json` + `npm run soi:thiet-ke` đã vào. Nhưng chạy thử: **45 lỗi / 11 cảnh báo
   trên 44 artboard `.dc.html` ở gốc repo**, và **3 lỗi** trên chính `scratchpad/design-if`
   (`Knowledge` · `KnowledgeCham` 2 họ accent · `Render.dc.html` dính `placeholder`) ⇒ mục (e)
   của phiếu ("0 lỗi cổng") **KHÔNG ĐẠT**. Nối vào chuỗi bây giờ = `npm test` đỏ vĩnh viễn 45 dòng.
   Đây là **nợ thiết kế có thật**, phải xử nội dung chứ không nới cổng.
3. **Chưa nghiệm thu bằng MẮT trên runtime.** Extension Chrome timeout 4 lượt liên tiếp; `open`
   (mở app đóng gói) bị cổng chặn. ⇒ CAD hồ sơ `cmsl4b5ux0001w9jlrgo2q41t`, accent đổi theo bộ
   nền, và vòng Home/2D/3D/Render/Present/BOQ **CHƯA có ảnh**. Theo luật 8 + `IF-FORM-TRA-LOI`,
   lượt này **CHƯA được gọi là xong** — mã xanh, mắt chưa duyệt.

✅ **Nghi vấn ĐÓNG:** `ops[]` KHÔNG lưu vào `.idf` là **BÁO ĐỘNG GIẢ** — round-trip
`exportIdf()`→`importIdf()` giữ `ops` nguyên văn 1:1, **11/11 pass** (chạy lại độc lập trong phiên
này). Bằng chứng cũ *"0 chỗ `ops` trong `idf.ts`"* đúng theo grep nhưng kết luận sai — hai hàm đó
`JSON.stringify`/`JSON.parse` cả object, không liệt kê field theo tên. Đã sửa
`IF-CON-THIEU-GI.md` §2.

---

⬇️ **BẢN CŨ HƠN — lượt E2E 2, giữ làm dấu vết. Không dùng làm hiện trạng.**

🔄 **CẬP NHẬT 01/09 TRƯA — LƯỢT E2E **2**, lease `L-1d648167` (27 tệp), writer `hoa-e2e-2`
(phiên `eb2d7edc`). Mọi dòng bên dưới khối này là bản cũ hơn, **giữ làm dấu vết theo lệ**.

**MỤC TIÊU LƯỢT:** `npm test` xanh trọn + đóng sổ. Hoà duyệt sẵn 4 việc trong `issuer` của lease
(đọc: `node scripts/claude-lease.mjs status`).

**NỢ ĐÃ TRẢ lượt này:**
- ~~`npm-test-chưa-xanh-trọn`~~ ⇒ **TRẢ CẢ HAI NỬA.**
  · `soi:vang-mat` **9 → 7 / trần 7** — trả ở `3c2319b1` (lượt trước), không phải lượt này.
  · `soi:thao-tac` `T-cam-hex-inline` **201 → 194 / trần 194**, exit 0. Đo lại: `npm run soi:thao-tac`.
- ~~`ack-legacy-catch-22`~~ ⇒ **TRẢ.** Hai đầu một phiếu legacy nay gặp nhau; phiếu
  `3db07c32bcd1` **đã đóng thật** (bàn tự sinh lại, 15 → 16 phiếu đã đóng).
- ~~`soi-cau-thiếu-ô-địa-chỉ`~~ ⇒ **TRẢ, và nó không đứng một mình:** `scripts/phieu-ca.mjs:387`
  in **đúng câu sai đó**. Hai tệp cùng in sai một câu ⇒ chuỗi hướng dẫn bị CHÉP, không phải một
  lần gõ nhầm. Sửa cả hai.

**CÁCH SIẾT `cam-hex-inline` — và một phương án ĐÃ THỬ RỒI BỎ, ghi lại để đừng ai thử lại.**
Ca oan: `components/print/LineweightTable.tsx` `DEMO_LINEWEIGHT_ROWS` giữ 7 màu LAYER của
**người dùng** (đi qua prop `row.color`) — phạt nó là phạm LUẬT NỀN TẢNG 3.
⛔ **Phương án soi theo vùng `style={{…}}` — BỎ.** Nó hạ số **201 → 111**, nghe như thắng, thật
ra 90 hit rơi mất là hex NGOÀI inline style (const `CSSProperties`, chuỗi CSS-in-JS trong `*.ts`)
— vẫn đúng tinh thần luật. Mà `scripts/foundation-tran.json` **ngoài lease** nên trần đứng yên ở
194 ⇒ để lại **83 ô trống** cho vi phạm mới chui vào mà cổng vẫn xanh. Đó là **nới trần đi cửa
sau**, đúng thứ M-52 cấm.
✅ **Phương án dùng: MIỄN TRỪ CÓ KHAI BÁO tại chỗ** (`scripts/soi-thao-tac.mjs`, hàm `vungMienTru`).
Khuôn `soi-thao-tac:mien-tru <id-luật> — <lý do>` đặt trên khối; phạm vi = ĐÚNG một cụm ngoặc cân
bằng **trải nhiều dòng**. Rơi đúng 7 dòng oan, **khe hở bằng không**, grep ra được:
`grep -rn 'soi-thao-tac:mien-tru'`. Hex nằm gọn một dòng thì **không khai miễn trừ được** — cửa
hẹp là chủ đích.

**🔴 NỢ MỚI CÓ TÊN — đo được trong lượt này, đừng để chìm:**
1. **`mẫu-luật-nằm-ngoài-lease`.** Chỗ ĐÚNG của phép siết là ô `vung:`/mẫu trong
   `scripts/thao-tac-registry.mjs`, và trần ở `scripts/foundation-tran.json` — **cả hai không có
   trong lease `L-1d648167`**. Nên bảng bắc cầu phải nằm tạm trong máy soi (đã ghi chú tại chỗ).
   Lần sau ai mở registry: dời sang đó rồi xoá bản tạm, đừng để hai chỗ cùng nói.
   ⛔ Writer **không tự `claude-lease.mjs amend`** để mở rộng quyền ghi của chính mình.
2. **`cardFaces-là-mã-chết` — việc ② của lượt CHƯA LÀM, cố ý.** Lệnh việc bảo rút 7 hex trong
   `components/entry/cardFaces.tsx` thành token và cho *"thẻ đăng nhập đổi theo theme"*. Đo chuỗi
   import: `cardFaces` ← `components/StageSelect.tsx` + `components/LoginScreen.tsx`, và **cả hai
   0 nơi import** (`grep -rn "from '@/components/StageSelect'"` ⇒ 0 dòng). `LoginScreen.tsx:1`
   tự đóng dấu *"MÃ CHẾT 17/08"* kèm lời chứng: một phiếu trước đã grep ra đúng tệp này, sửa xong
   *"màn hình không đổi một pixel"*. Màn đăng nhập THẬT là `components/entry/LoginScreen.tsx`,
   dùng `.lq-card` — vốn **đã** có nhánh `:root[data-theme='light'] .lq-card` (`app/globals.css:1205`).
   ⚠️ Thêm một cái bẫy nếu ai định làm ẩu: trong vùng login, `--t1` bị `[data-login-tone]` ép theo
   **NỀN**, không theo theme (`globals.css:1560`). Bind mực thẻ vào `var(--t1)` ⇒ nền ảnh tối sẽ
   cho chữ `#f5f5f7` trên thẻ kem `#f4efe6`. ⇒ **Cần Hoà chỉ đúng bề mặt** trước khi tiêu lượt ghi.
3. **`47c67b5b5474-chỉ-cl:00-ack-được`.** Phiếu legacy `→ '00'`. Cổng đúng luật: `cl:06` không ack
   được địa chỉ không phải của mình. Lối `--legacy` nay đã có, **việc còn lại của `cl:00`**.
4. **`BOS_SESSION_ID-vắng-trong-env-phiên`.** Phiên này được mở với đủ `IF_SYSTEM/IF_LANE/
   IF_SESSION_ID/IF_TASK_ID/IF_LEASE_ID` nhưng **không có `BOS_SESSION_ID`**, mà `moc.mjs` đòi
   đúng biến đó ⇒ mọi lệnh ghi biên nhận exit 2 với câu *"thiếu session_id thật"*. Lượt này khai
   inline `BOS_SESSION_ID=hoa-e2e-2`. Sửa gốc: bộ mở phiên đặt luôn, hoặc `moc.mjs` đọc
   `IF_SESSION_ID` làm nguồn thứ tư.
5. **`guard-chặn-oan-vòng-lặp-đọc` — có thêm hai ca THẬT trong lượt này.** `while read … done`
   (chỉ `grep -c`) và `node <kịch bản chỉ-đọc trong scratchpad>` đều bị xếp `KIND mutation`.
   Trùng đúng E13 của `NC-VI-SAO-CODEX-KY-LUAT.md`. Sổ lệnh đọc `scripts/guard-lenh-doc.json`
   là chỗ nới đúng — **cấm sửa lõi**.
6. **`cờ-tường-UNKNOWN`** — giữ nguyên, xem cảnh báo đầu tệp.

**NỢ GIỮ NGUYÊN, KHÔNG gạch:** `POCHE_TAM-inferred-rộng` · `mau-bo-chưa-nối` · `guard-chưa-có-heartbeat`.

**📌 HAI QUYẾT ĐỊNH MỚI CỦA HOÀ — 01/09, nhập vào sổ lượt này:**

**QĐ 08:32 · HAI PHIÊN BẢN UI THEO PHƯƠNG THỨC NHẬP, CẤM LAI** (phiếu `HO-20260901013338-aa2ddb75a6eb`).
Mỗi phương thức nhập một bản tối ưu riêng: **desktop** (phím + chuột — mật độ cao, hover, phím
tắt, con trỏ chính xác) và **cảm ứng + pencil** (target ≥44px, dock trong tầm ngón cái, pencil là
công cụ vẽ chính trên canvas 2D, **không UI nào phụ thuộc hover**). **CẤM một bản lai phục vụ cả
hai.** ⚠️ Đây **KHÔNG** phải responsive breakpoint — là hai bộ layout/tương tác có chủ đích, dùng
chung token + engine. Nó **thay** nợ *"Hai cơ chế Home theo bề rộng màn"* Hoà chê 29/08: phân
nhánh nay theo **PHƯƠNG THỨC NHẬP**, không theo bề rộng.

**QĐ 09:52 · UX TRƯỚC, UI SAU — HAI GIAI ĐOẠN** (phiếu `HO-20260901025256-b76a803ea132`).
**GĐ1 = UX**: hành trình · kiến trúc thông tin · bố cục chính-phụ · mô hình tương tác theo phương
thức nhập · 2 trạng thái Home · vỏ 4 cạnh — **chốt với Hoà xong mới đi tiếp**.
**GĐ2 = UI**: da thị giác (token màu · chất liệu kính · đèn viền · typography) trên bộ UX đã chốt.
⚠️ **Nghiệm thu GĐ1 = Hoà duyệt bố cục/luồng, KHÔNG chấm màu ở giai đoạn này.**

**📎 BẢN VẼ + NGHIÊN CỨU của lượt thiết kế — nằm NGOÀI repo, ghi con trỏ vào đây kẻo mất dấu.**
Canvas thiết kế `fa541dc6` (v3) · 19 bản `.dc.html` (9 cặp desktop/`*Cham` + `Main`) tại
`/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/e31f331f-0b13-469e-b14f-2d38fcb5de26/scratchpad/design-if/`.
Cùng thư mục có 4 báo cáo: `NC-QUY-TRINH-UXUI-APP-THIET-KE.md` · `NC-HANH-VI-KTS-NOI-THAT.md` ·
`NC-VI-SAO-CODEX-KY-LUAT.md` · `CHUNG-CAT-BOARD-1IF-2026-08-31.md`.
⚠️ **`/private/tmp` là thư mục TẠM của máy** — mất là mất trắng. Nợ có tên:
**`bản-vẽ-nghiên-cứu-chưa-có-nhà-bền`**.

**Bốn đề xuất từ `NC-VI-SAO-CODEX-KY-LUAT.md` — chưa ai nhận, ghi tên để không chìm:**
`phiên-lane-bền-resume` (mục 5 — một session id bền mỗi lane, luôn `--resume`) ·
`phiếu-kèm-AllowedFiles-CẤM` (mục 6 — bắt chước khuôn `cx` E10, đã có mẫu thật ở phiếu
`a8707a0ad7d7`) · `nấc-VERIFIED-trên-cầu` (mục 7 — chuỗi hiện là `HANDOFF→WAKE→SENT→SEEN→ACK`,
thiếu nấc kiểm độc lập trước khi phiếu đóng) · `allowlist-hẹp-theo-prefix` (mục 8).

**🔬 ĐANG ĐIỀU TRA — CAD lag + mở sai khung nhìn** (Hoà báo 10:13; báo cáo chỉ-đọc:
`…/e31f331f-…/scratchpad/DIEU-TRA-CAD-LAG-MO-SAI.md`). **Chưa có verdict, chưa vá.** Ba kết luận
đã có bằng chứng dòng mã, đáng đọc trước khi ai đó đoán lại từ đầu:
- **Đường `/cad` KHÔNG dùng viewport lưu** (mọi nhánh khôi phục rơi về `DEFAULT_VIEWPORT` rồi phát
  `cad:zoom-extents`) — nhưng **`/render` thì CÓ**: `lib/cad/cad3d-autosave-core.ts:95` áp thẳng
  `sheet.viewport` **không sanity-check scale > 0** ⇒ viewport âm thời-kỳ-bug sống lại nguyên vẹn.
- **Nghi phạm lag số 1 không phải cờ tường** (nó chạy đúng một lần mỗi lượt import, trong worker).
  Là `findSnap` chạy TRỌN doc mỗi `pointermove` (`lib/cad/query.ts:215` lọc visible bằng
  `layers.find` lồng trong filter ⇒ ~315.000 phép so mỗi lần rê chuột), cộng full-redraw 12.600
  entity **không viewport-culling**, cộng autosave `JSON.stringify` cả doc trên main thread.
- **Phương án A (`f2d85fb8`) có thể là chính thủ phạm của "mở lên chưa đúng khung"**: điều kiện 2
  trả `cluster.box` TRẦN, docstring `lib/cad/import-summary.ts:230` tự ghi **34–88% số hình nằm
  NGOÀI khung** trên 6 hồ sơ thật.
Mọi dòng bên dưới khối này là bản cũ hơn, **giữ làm dấu vết theo lệ**.

| commit | nhóm | chứng cứ |
|---|---|---|
| `c5304765` | **N1 guard-v4** | tsc 0 · `claude-role-guard.test.ts` xanh · sổ lease có 1 dòng `LEASE_CLAIMED` thật |
| `f2d85fb8` | **N2 fit-cụm phương án A** | tsc 0 · `import-summary.test.ts` **24/0** · đo đủ **6 hồ sơ** `FILE MBHT` |

**NỢ ĐÃ TRẢ lượt này:**
- ~~`soat-toan-dien-đường-cứng`~~ ⇒ **TRẢ** ở `c5304765`. Đo: chạy có `BOS_SHARED_LOG_ROOT` trỏ
  thư mục rỗng ⇒ mất dòng `👁 ký 2026-08-30 @370962a4`, rơi về `chờ: … tuong-len-man …`.
- ~~`QĐ fit-theo-cụm phương án A — CHƯA THI CÔNG`~~ ⇒ **XONG** ở `f2d85fb8`. `ABSURD_FAR_RATIO=30`
  không bị đụng; ca ⑤ *"bản vẽ thường vẫn mode full"* vẫn xanh, **không sửa một kỳ vọng nào**.
- ~~`lease-không-phân-biệt-hai-phiên-cùng-session_id`~~ ⇒ **TRẢ MỘT NỬA** ở `c5304765` (xem nợ mới).

**NỢ GIỮ NGUYÊN, KHÔNG gạch:** `POCHE_TAM-inferred-rộng` · `mau-bo-chưa-nối`.

**🔴 NỢ MỚI CÓ TÊN — đo được, đừng để chìm:**
1. **`npm-test-chưa-xanh-trọn`.** Tách chuỗi test (N1 mục 1) làm **lộ hai cổng ĐỎ SẴN Ở HEAD** mà
   dây `&&` cũ che vì `soi:cau` chết trước:
   `soi:vang-mat` **9 / trần 7** (`docs/control/*.md`) · `soi:thao-tac` `T-cam-hex-inline`
   **201 / trần 194** (`components/CommentLayer.tsx` và 196 chỗ nữa).
   Đo lại: `npm run soi:vang-mat` · `npm run soi:thao-tac`. **CẢ HAI NGOÀI lease `L-90a99d21`**
   (lease 15 tệp, không có tệp nào trong hai nhóm đó — mở ra nhìn: `node scripts/claude-lease.mjs status`)
   ⇒ writer lượt này **không có quyền sửa**.
   ⛔ Cấm nới trần (M-52) — cách duy nhất là **sửa nội dung**: thêm lệnh chứng minh dưới câu
   khẳng định vắng mặt, và bỏ hex nội tuyến. Cần Hoà/`cx:00` amend lease hoặc giao lane khác.
2. **`guard-chưa-có-heartbeat`.** Ô "phiên đang giữ" khoá theo `hook.session_id`, chết cùng lease
   nên không khoá vĩnh viễn — nhưng **chưa có đường TRẢ BÀN giữa chừng một lease đang sống**.
   Phiên chết bất ngờ ⇒ phải `claude-lease.mjs issue --thay`. Ca test cho phần đã làm:
   `scripts/claude-role-guard.test.ts` nhóm v4③.
3. **`ack-legacy-catch-22` — CHƯA VÁ.** Phiếu địa chỉ trần (`to: '06'` · `'00'`) không ack/đánh
   thức được: ô tác giả bắt buộc namespaced (`docDiaChi(…, false)`), còn `eventThuocDiaChi` so
   với địa chỉ legacy ⇒ không bao giờ khớp. Sâu hơn: `khoaHandoff()` cho HANDOFF legacy ra khoá
   `legacy:NN|…` còn cho ACK ra `cl:NN|…` ⇒ **hai khoá không gặp nhau**, nên kể cả ack được thì
   `soi:cau` vẫn không thấy. Cửa sửa nằm ở `scripts/cau-mo-hinh.mjs` + `scripts/soi-cau.mjs`,
   **cả hai ngoài lease này**. ⛔ Cấm suy `06` → `cl:06`: legacy là `LEGACY_AMBIGUOUS` theo thiết kế.
4. **`soi-cau-thiếu-ô-địa-chỉ`.** `scripts/soi-cau.mjs` cuối bản in vẫn dạy
   `moc.mjs danh-thuc <handoffId> "<cơ chế>"` — thiếu ô địa chỉ, đúng lỗi đã sửa trong `moc.mjs`
   ở `c5304765`. Tệp ngoài lease này.
5. **`cờ-tường-UNKNOWN`** — xem cảnh báo ở đầu tệp. Cần một lượt mở app thật.

**CẦU sau lượt này:** `b0c8ee44f978` đã có mắt ĐÁNH THỨC (hook phiên `223b210d` in ra inbox).
Còn **4 phiếu đỏ**, không phiếu nào cl:06 có quyền chạm: `47c67b5b5474` (→ `00`, legacy) ·
`3db07c32bcd1` (→ `06`, legacy) · `8016b4d76198` (→ `cx:06`) · `53aae5e63150` (→ `cx:00`).
Luật cổng: lane thường chỉ đánh thức phiếu gửi **tới chính mình**; hai phiếu `cx:*` thuộc tuyến
Codex, hai phiếu legacy vướng nợ ③. ⇒ **Việc của `cl:00` + Hoà**, không phải của bàn 06.

**📌 QUYẾT ĐỊNH CỦA HOÀ 21:54 31/08 — SÁNG/TỐI** (phiếu `HO-20260831145529-6268f159d6fe`):
**BỎ** ràng buộc *"nền tối là mặc định làm việc, nền giấy sáng cho canvas"*. Luật mới:
① sáng/tối **người dùng TỰ CHỌN**, hoặc tự động theo giờ trong ngày;
② canvas giấy-mực **ĐI CÙNG** theme hệ thống — theme sáng thì giấy sáng, theme tối thì giấy tối;
không có chuyện UI tối mà canvas cố định sáng.
Kiến trúc đã sẵn: render giấy-mực đọc token `--giay`/`--muc` (`dc1a5254`) ⇒ đổi theo theme là
**đổi token, không đổi engine**. ⚠️ Bảng mực pha-màu-về-giấy phải được **KIỂM ĐỦ HAI THEME** —
nợ `K3 pha nhầm hướng nền` trong `7cf286db` đã cảnh báo đúng ca này.
**GIỮ NGUYÊN:** đơn sắc + MỘT accent · WCAG 2.2 AA · sàn chữ Việt 12px · thang mô-đun.
⇒ Việc kéo theo, chưa làm: `IF-CHUAN-NEN.md` cần **một dòng đính chính**; khung chấm mắt theo
board `1if` bỏ tiêu chí nền-tối-mặc-định.

**📌 CHƯNG CẤT GU** — phiếu `HO-20260831151158-f3f42dc9d551` (→ `cl:04`, đã có mắt đánh thức:
`cl:00` tự thi hành vì lane 04 không có phiên sống). Canvas thiết kế kèm theo: **`cl:00` đưa URL
sau** — chỗ này để trống có chủ ý, **cấm điền bằng trí nhớ**. Nền của việc: `docs/GU-PROFILE.md`
(49 dòng, chưng cất từ 4 board Pinterest) — tệp từng **không có con trỏ nào** trỏ tới, đo 30/08.

---

🔄 **CẬP NHẬT 31/08 TỐI.** Mọi dòng bên dưới khối này là bản cũ hơn, **giữ làm dấu vết theo lệ**.

**HAI LÔ BẨN ĐÃ ĐÓNG — cây từ 24 tệp bẩn về 0 (ngoài nhịp máy).** Xử theo kiểu Hoà chốt 20:48:
một phiên cầm lease, một phiên khác review chỉ-đọc, commit **TÁCH BẠCH**, cấm `add -A`.

| commit | lô | người review | verdict |
|---|---|---|---|
| `6d70079e` | MÀU BỘ (7 tệp) | `hoa-giay-muc-a` (99) | **PASS có điều kiện** — 3 điểm đánh dấu đã tự kiểm lại |
| `c3b0ec6a` | CẦU (17 tệp) | `hoa-giay-muc-a` (99) | **PASS có điều kiện** — kẹp `soi:cau` hai đầu, khớp |

Nợ **`commit-d9d92364-không-tự-chứa`** ⇒ **ĐÓNG** ở `c3b0ec6a`.

**Giấy Mực đợt A — xong luật 1·2·3·4·5** (KHÔNG phải 1·2·4 như bản chiều ghi). Neo: luật 2 thang
mực `lib/cad/render.ts` `BE_DAY_MUC`+`netMuc` · luật 3 poché `GIAY_MUC_PHA.pocheTuong = 0.8` ·
luật 4 `GiayMuc.khaoSat` + `components/cad/giay-muc-store.ts` · luật 5 `mayDocNguoc()`.
Commit `dc1a5254` + `8f75aa0d`; ca khoá `lib/cad/render-giay-muc.test.ts` 53/0.
⛔ **CHƯA chứng minh trên runtime ⇒ cấm tuyên PASS.**

**Sổ nợ chiều 31/08 — cập nhật:**
1. ~~chống-ăn-lại polyline~~ ⇒ **TRẢ** ở `dc1a5254` (chốt chặn dời lên đầu vòng `docDoanThang` +
   `laPocheCuaChinhBoNay` trong `lib/cad/tuong-hinh-hoc.ts`; test 59/0, 2 ca ĐỎ đúng lý do trước khi vá)
2–8. giữ nguyên.

**Nợ MỚI có tên, đừng để chìm:**
- **`mau-bo-chưa-nối`** — `lib/wallpaper/mau-bo.ts` (495 dòng) chưa có nơi tiêu thụ Ở RUNTIME;
  `--accent` trong `globals.css` vẫn là hằng số `#6a57f5` (đo trên app thật lúc commit). Nó KHÔNG
  phải mã chết: `mau-bo.test.ts:66` ghim nó vào CSS bằng cổng máy ⇒ đã có **dây KIỂM**, chưa có
  **dây CHẠY**. Việc nối token: `docs/control/IF-HE-5-BO-MAU.md` §5.
- **`soat-toan-dien-đường-cứng`** — `scripts/soat-toan-dien.mjs:67` đọc cầu bằng
  `os.homedir()/PROJECT/SHARED/LOG`, **bỏ qua `BOS_SHARED_LOG_ROOT`**, trong khi `soi-cau.mjs:55`
  và `buu-ta-cau.mjs:25` cùng lô đều tôn trọng biến đó. Ai cách ly sổ chạy thử thì `soat` vẫn đọc
  SỔ THẬT — đúng họ hàng bệnh 31/08. Chưa hại (ngoài `npm test`), nhưng nó có tên từ đây.
- **`POCHE_TAM-inferred-rộng`** — đường chạy khi KHÔNG có giấy mực vẫn lấy `e.inferred` một mình,
  cùng cái lỗ đã làm toàn bản vẽ hoá accent. Phía giấy-mực đã vá ở `8f75aa0d` bằng `mayDocNguoc()`
  (cặp `inferred` + `wallThicknessMm`); **đường cũ chưa vá** vì bị 20 ca `render-z-order.test.ts` khoá.

**Vá scale-âm — `81dd7dd7`** *"defer fit-on-open until canvas is measured"* (tác giả Hoà, 3 tệp,
`import-summary.test.ts` 18/0). Gốc là **TẤT ĐỊNH, không phải race** — nguyên văn commit:
`visibilityState hidden ⇒ requestAnimationFrame không chạy ⇒ scheduleResize không tới onResize ⇒
canvas kẹt 300x150 trong khi khung chứa 963x610`.

**QĐ fit-theo-cụm PHƯƠNG ÁN A — Hoà chốt 20:48, CHƯA THI CÔNG.** Canh vào cụm chính khi tỉ lệ
thô/cụm vượt `FOCUS_MIN_RATIO=4`, làm bằng **ĐIỀU KIỆN MỚI**; ⛔ **CẤM đụng `ABSURD_FAR_RATIO=30`**;
bấm `F` vẫn xem toàn bộ; phải chạy lại trên đủ **6 hồ sơ** trong docstring `import-summary` trước
khi commit. Số đã đo sẵn để khỏi đo lại: `03_TANG5B-TTT.dxf` khung thô **225,9 × 71,4 m** ·
`mainClusterBox` **28,5 × 26,2 m** · tỉ lệ **21,65×**; `zoomExtentsPlan` vẫn trả `mode 'full',
farEntities 0` vì `lib/cad/import-summary.ts` có dòng `if (far === 0) return full`.
⚠️ Giao cho phiên có lease `import-summary.ts` — **không phải** lane này.

**VIỆC KẾ TIẾP CHÍNH XÁC:** chứng minh **Giấy Mực đợt A trên runtime** (ảnh app thật, số trên màn
khớp số máy đo) — đó là mục duy nhất đang chặn việc tuyên PASS cho đợt A.

---

🔄 **CẬP NHẬT 31/08 CHIỀU.** Mọi dòng bên dưới khối này là bản cũ hơn, **giữ làm dấu vết theo lệ**.

**Chuỗi commit + verdict trong ngày:**

| commit | việc | verdict |
|---|---|---|
| `d9d92364` | phục hồi bàn | **PASS** |
| `02216b87` | guard-v3 | **PASS** |
| `81739ee1` | demo-sạch | **PASS 8/8** — 6,1MB dữ liệu khách rời ship; `test-assets` + `apk` dời `~/Downloads/_IF-KHO/tu-repo-demo-sach` |
| `a2acd109` | 81-tường | **PASS 7/7**, **cờ vẫn TẮT** — quyền Hoà |
| `7cf286db` | canvas đợt 1 | **PASS kèm nợ polyline** |

**MẮT CHỦ.** Canvas **2 lượt "chưa ổn"** → **LOOK OUTSIDE 9 tool** → chốt ngôn ngữ **GIẤY MỰC**,
mock được chấm **"ỔN" 17:20** → `docs/control/IF-GIAY-MUC.md`.

**QĐ accent-theo-bộ (17:24)** → `IF-CHUAN-NEN` §4.

**SỔ NỢ MỚI CHIỀU 31/08:**
1. chống-ăn-lại polyline `lib/cad/tuong-hinh-hoc.ts:208-212` + ca khoá `docDoanThang`
2. **GUARD-V4** — gom 10 mục: `mv`/`git mv` · `next build` vào VERIFY · `danh-thuc` address-slot
   bên giao · env danh tính vào shell lane (`IF_*`/`BOS_SESSION_ID`) · sổ git-branch hở biến thể
   ghi · VERIFY nhận `npx sucrase-node` · legacy-ack mồ côi · duyệt-lease-từ-xa + matcher mọi tool
   ghi · TTL theo cỡ việc · khai script TTS `--out` đã dùng đường sổ
3. sheet UX — đóng sheet không xác nhận đã-tự-lưu; bấm `+` trùng tên "Bản vẽ 2"
4. bug **số dối** thanh trạng thái *"GFA 30,8m² · 102 phòng"* trên mặt bằng **474m²**
5. **E-Stair ×12** tính nhầm tường
6. phiếu design **"bộ minh hoạ trung tính"** (3 TODO trong mã trỏ tên)
7. `trinh-bay.idfp` dangling `/demo/`
8. nghiệm thu vàng `npm test` trọn tuyến — **chờ đánh thức 2 phiếu `cx`** (Codex hết quota)

**VIỆC KẾ TIẾP CHÍNH XÁC:** thi công **Giấy Mực** (P1+P3, mock `giay-muc-v1` là spec) + **vá
polyline cùng lease**; sau đó **guard-v4**.

---

🔄 **CẬP NHẬT 31/08.** Mọi dòng bên dưới khối này là bản cũ (29/08 trở về trước), **giữ làm dấu
vết theo lệ**.

### 31/08 — hai quyết định, một khung, một nợ guard

**QĐ-1 · `demo:sạch`** — gỡ `public/demo` · `test-assets` · `.apk` · **4 route** `app/demo` +
**3** `thu-*`. Màn trống ⇒ **hướng dẫn**, không để trắng. Thống kê **đếm thật**.
Lane **06** thi công, lane **07** chấm.

**QĐ-2 · `db:partial`** — ship kèm **nhãn `PARTIAL`** + `db-target-guard` **bắt buộc**.
`F-18` **mở**, **không chặn ship**.

**Role Guard** — v1 `3eafa184` + v2 `09b8679f`, lane `cl:07` chấm **PASS-phạm-vi-phiếu**.
Nợ **`GUARD-V3`** — *nguyên văn gốc giữ nguyên, chỉ đeo thêm trạng thái; **`✅` = đã vá 31/08
trong lượt `HO-guard-v3`, CHƯA có trọng tài chấm** — lane 06 không tự tuyên PASS cho chính mình*:
- ✅ chuỗi `&&` / `;` thuần đọc — mục 1
- ✅ redirect lành — mục 2 (`2>&1` · `2>/dev/null` · `>/dev/null`; ghi ra tệp thật vẫn chặn)
- ✅ whitelist đọc thành **sổ JSON** — mục 3, `scripts/guard-lenh-doc.json`, fail-closed
- ✅ hạng `EXTERNAL` — mục 4 (tách hạng + thông điệp; **không** mở đường cho lệnh network nào)
- 🟡 lease **renew** + **TTL theo cỡ việc** — mục 5 vá **NỬA**: có `renew` · `amend` ·
  `issue --thay`. **`TTL theo cỡ việc` VẪN MỞ** — chưa dòng mã nào suy hạn từ cỡ việc.
- ✅ cửa **ngoài-repo** đi TRƯỚC chốt lane-00 — mục 6
- ✅ khai script TTS trích `--out` — mục 8 (đích vẫn qua đúng cửa ngoài-repo, không miễn kiểm)
- ✅ **env-prefix**: guard phân loại lệnh dạng `VAR=x cmd` theo `cmd`, để inline `BOS_SESSION_ID`
  cho governance — mục 7
- ✅ **NGHI ÁN** `phieu-ca --ghi-ban` phá tệp bàn + `soi:ban` **mù** — trọng tài 07 đo 31/08,
  ~~**chưa xác minh độc lập**~~ → đã xác minh và vá ở `d9d92364`; ca đột biến nay đứng riêng ở
  `scripts/phieu-ca.test.ts` (32 ca, dời khỏi chỗ tạm trú trong `cau-mo-hinh.test.ts`)
- ✅ **`npm run` truyền tiếp `--ghi-ban` lọt VERIFY** — `npm run soi:ban -- --ghi-ban` chạy được
  **không cần lease**, tức đúng cái lệnh vừa phá 9 tệp bàn hôm 30/08 đi lọt qua cổng. Phát hiện
  bởi **writer `9e`**, **không khai thác**. Vá ở **mục 9** `HO-guard-v3`.
- ✅ **symlink phía guard** — mục 10: `ngoaiRepo()` giải `realpath` trước khi so, nên symlink
  trong nhà công cụ trỏ ngược về repo hết được tính là "ngoài repo".

**NỢ CÒN MỞ sau lượt này** (tên theo chung thẩm, không đổi tên):
- **`symlink-phieu-ca`** — phần symlink của `phieu-ca.mjs`; NGOÀI lease `HO-guard-v3`, chưa đụng
- **`khoá-mồ-côi`** — khoá `.khoa` còn sót khi tiến trình chết giữa chừng
- **`từ-chối-câm`** — đường từ chối không nói ra lý do ở một số nhánh
- **`commit-d9d92364-không-tự-chứa`** — chờ lô `moc.mjs` + `buu-ta-cau*` của lane `cx`
- **`nghiệm-thu-vàng`** — chờ đánh thức 4 phiếu `47c67b5b5474` · `3db07c32bcd1` ·
  `8016b4d76198` · `53aae5e63150`

**KHUNG BA TẦNG chốt** → `docs/control/IF-KHUNG-BA-TANG.md`.
Phán quyết mắt **2/10** ⇒ **vẽ ĐÓNG BĂNG** chờ khung thi công; **3 lô sửa đo được vẫn chạy**.

**Việc kế tiếp:** phát phiếu lane theo khung, qua cầu `moc`.

---

🔄 **CẬP NHẬT 29/08 — HEAD `71667fa`.** Mọi dòng bên dưới mốc này là bản 28/08, giữ làm dấu vết.

### Hai chốt chặn ship của 28/08 ĐÃ ĐÓNG CẢ HAI

**① Sản phẩm đọc được bản vẽ nghề thật.** `lib/cad/tuong-hinh-hoc.ts` (sau cờ
`NEXT_PUBLIC_IF_TUONG_HINH_HOC`, mặc định TẮT) đảo ngược đúng chuỗi lệnh người vẽ đã chạy:
ghép đôi độc quyền → ĐẢO TRIM → ĐẢO ARRAY → gộp chùm.
`03_TANG5B-TTT.dxf`: **12.274 entity → 81 tường · 286,0 m · 23 ms**, bề dày rơi vào nấc nghề
200/100/300mm. Trước đó cùng tệp ra **1 khối sàn**. Điểm gọi duy nhất `lib/cad/dxf-worker.ts:38`.
⚠️ **Chưa ai HIỆN số đo đó cho người dùng** — nó nằm ở `report.tuongHinhHoc`, không mặt nào đọc.
Đã giao lane 06 (`HO-20260829110917-81c45b528978`).

**② GPL ra khỏi bộ cài, chặn bằng CẤU TRÚC.** `next.config.mjs:18` alias
`@mlightcad/libredwg-web` → `lib/cad/dwg-engine-tat.ts` khi cờ tắt ⇒ webpack không đọc tới gói.
Dựng sạch từ HEAD, tự kiểm — **chạy lại được, đừng tin con số suông**:
```
rm -rf .next && npx next build && npx electron-builder --mac --dir
find .next -name "*.wasm" | wc -l                                          # → 0
find dist-installer/mac-arm64 -iname "*libredwg*" -o -iname "*mlightcad*"   # → rỗng
grep -rl "@mlightcad/libredwg-web/wasm\|static/media/libredwg-web" dist-installer/mac-arm64 --include="*.js" | wc -l   # → 0
node scripts/soi-giay-phep-phat-hanh.mjs --chan                            # → exit 0
```
Bật cờ lên dựng lại → mã quay lại đúng **9.399.820 byte × 2** ⇒ **cờ không nói dối**.
⛔ **CHƯA ĐƯỢC GỌI LÀ "SẠCH"**: thiếu SBOM · biên nhận artifact · biên nhận giấy phép. Nhãn đúng
là **"quét sạch, chưa có biên nhận"**. Đã giao lane 07 (`HO-20260829110917-0a6369e3941f`).

### Máy soi mới trong ngày — 3 cái, đều có ca đột biến

| máy | canh gì | trần |
|---|---|---|
| `soi-chu-viet.mjs` | luật chữ Việt V-2/V-3/V-6, **tách ứng viên khỏi vi phạm** | `T-CHU-VIET` **850** |
| `soi-anh-the.py` | ảnh thẻ khoá: 5 cổng chặn + 1 tiêu chí bố cục (độ tĩnh) | — |
| `nhuom-anh-the.py` | lọc điện ảnh ASC CDL + chuẩn hoá thích ứng, `--quet` chạy dải | — |

`soi-giay-phep-phat-hanh.mjs` đã **nâng để soi RUỘT tệp** — bản cũ chỉ soi tên và **đã nói dối**
trên một artifact bẩn thật (trần độ sâu 6, đường thật sâu 8).

### Cầu bàn giao — nay có chuông phía Claude Code

`SENT` (bưu tá Codex) → `SEEN` (hook `.claude/settings.json` ghi) → `ACK` (phiên xử lý ghi).
Hook đọc `IF_LANE`, mặc định `00`. `moc.mjs im <lane>` câm khi rỗng; `moc.mjs chua-nhan [phút]`
cho bưu tá biết phải đánh thức ai.
⛔ Hook chạy ở **ranh giới lượt**, không bất đồng bộ. Phiên ngồi im thì phiếu nằm đó.
⛔ Claude Web / điện thoại **không đọc được tệp local** ⇒ ngoài đường này. Cần connector riêng.

### Phiếu đang nằm trong cầu — 30/08: **4 phiếu · 0 phiên sống để nhận**

`ListAgents` 30/08: 22 phiên ngang hàng, **tất cả offline**. Hook nhận phiếu chạy ở ranh giới
lượt ⇒ phiên offline không bao giờ có lượt ⇒ **phiếu nằm im vô hạn**. Đây là thứ đang chặn ship,
không phải việc khó.

| lane | phiếu | việc |
|---|---|---|
| `03 · UI` | `HO-20260829110918-7a934500f2a1` | thang cỡ chữ tiếng Việt (Hoà chốt **nâng sàn 12px, giữ tỉ lệ**) + bỏ hai cơ chế Home |
| `05 · THIẾT KẾ/NC` | `HO-20260829181708-7dcb0535e6b4` | **MÁY ĐỌC GU** — đặc tả đầy đủ ở [`docs/phieu-giao/may-doc-gu.md`](../phieu-giao/may-doc-gu.md), viết cho người KHÔNG có repo. Bên đó thiết kế, bên này thi công |
| `05 · THIẾT KẾ/NC` | *chưa gửi cầu* | **KHẢO SÁT UX/UI CHUẨN TOÀN CẦU** — [`docs/phieu-giao/khao-sat-ux-toan-cau.md`](../phieu-giao/khao-sat-ux-toan-cau.md) + 24 ảnh ở `artifacts/man-30-08/`. Hoà giao 30/08: *"chụp màn router chính → gửi ChatGPT để nó làm khảo sát UX/UI global standard with Apple design system human-centric để viết phiếu định hướng"*. ⚠️ Đo md5: 4 cặp ảnh TRÙNG KHÍT ⇒ 24 khung nhưng chỉ **20 mặt khác nhau** |
| `05 · THIẾT KẾ/NC` | *bản đồ chuẩn* | **38 LĨNH VỰC** — [`docs/phieu-giao/ban-do-nghien-cuu-chuan.md`](../phieu-giao/ban-do-nghien-cuu-chuan.md). Hai họ: chuẩn hệ thống 12 (8 đã có cổng) · chuẩn ngành 26 (**19 nền tảng** không thương lượng + **7 diễn đạt** — chỗ duy nhất gu cá nhân được sống). Luật quy định theo vùng tách hẳn. Nền: [`IF-CHUAN-NEN.md`](IF-CHUAN-NEN.md) |
| `06 · 2D3D` | `HO-20260829110917-81c45b528978` | hiện 81 tường lên giao diện |
| `07 · QUALITY` | `HO-20260829110917-0a6369e3941f` | SBOM + biên nhận giấy phép |

Mở phiên nhận lane: `cd ~/Downloads/interiorflow && IF_LANE=06 claude`

### Ba phiên cũ đã thành lane, phiếu đã ghi, CHƯA AI NHẬN

`06 · 2D3D` (`251b1d67`) · `07 · QUALITY` (`b98f2f19`) · `03 · UI` (`6d476d59`) · `00 · MAIN` (phiên này).

### Nợ đã đo, chưa giao ai

- **772/850 vi phạm là cỡ chữ < 12px** ⇒ thang chữ của app dưới sàn tiếng Việt. Phải xử bằng
  **thang token**, không vá 772 chỗ. Chạm diện mạo ⇒ **quyền Hoà**.
- **Hai cơ chế Home** theo bề rộng màn (`HomeScreen.tsx:151`, ngưỡng 480px, rẽ ở :626;
  730+365+850 dòng). Hoà 29/08: *"không cần thiết"*. Đã ghi vào phiếu lane 03.
- **Dữ liệu demo trong bản ship**: `public/demo` 6,1 MB · `test-assets` 2,3 MB · `.apk` 3,6 MB ·
  4 route `app/demo` + 3 route `thu-*`. Hoà: *"ship lúc đầu chưa có dữ liệu thì thống kê lấy gì
  mà đếm"* — ảnh anh gửi hiện "3 dự án · 15 nháp" là đếm trên demo. **Quyền Hoà.**
- **31 chuỗi HOA CỨNG** cần phân loại *quy ước nghề* ↔ *lỗi*; nặng nhất là tiêu đề hồ sơ trình
  khách trong `lib/present-editor/story-set.ts` — **khách đọc**, không phải nhân viên.
- Hoà chốt 29/08: **"giao diện tới giờ vẫn còn sai"** — cấm tuyên PASS bằng đọc mã.

### Bài học đắt nhất trong ngày — [[M-59]]

Phép thử so **trước ↔ sau** chỉ bắt được lỗi mà bước đó **thêm vào**; lỗi **có sẵn ở cả hai đầu**
thì nó mù. Máy nào sinh ra HÌNH HỌC thì lần đầu **bắt buộc vẽ ra và nhìn ở mức phóng to**, mỗi
đối tượng một màu — thứ cần nhìn là **ranh giới đối tượng**, chỉ hiện ra khi đổi màu.

Kèm hai lỗi điều phối của MAIN, ghi để không lặp: **ghi sản xuất khi worker khác đang chạy**
(làm `tsc` của nó đỏ giữa chừng) · **chia ranh giới theo tệp nguồn mà quên `.next` là tài nguyên
dùng chung** (dev server + `next build` cùng lúc ⇒ `.next` hỏng, `/api/auth/me` sập 500 ba lần).

---


🔄 **CẬP NHẬT 28/08 — HEAD `cf96bf6`.** Câu dưới (Wave S1/S2) là bản 27/08, giữ làm dấu vết.

**Việc kế tiếp: đo L2-01 trên chính `next start`.**
Phép đo 28/08 (`docs/design-candidate/IDF-IF-PACKET-003/sqlite/01-L2-01-CHAN-DOAN.md`,
6,2 triệu lượt / 45 phút / 3 arm) **KHÔNG tái hiện được cú kẹt**, kể cả arm mang đúng điều kiện
27/08. ⇒ Bậc bằng chứng còn lại: chạy tải hỗn hợp qua HTTP trên `next start` với phiên đăng nhập
thật — đó là nơi bệnh đã xảy ra. Ngoài nó chỉ thu hẹp nghi ngờ, không đóng được ca.

**P0-2 đã ĐÓNG** (`b7c836b`): bốn trạng thái trên `/projects` `/materials` `/tasks` · Vitals ·
Home modal người-mới (L2-06) · dải Dự án thôi nói dối con số (L2-07).

**F3 — mắt xích `.idfc → 3D` nay BỊ KHOÁ BỞI QUYẾT ĐỊNH, không phải bởi thiếu hiểu biết.**
Tôi đo và commit (`4712a38`); lane Design biến nó thành `IF-DEC-IDFC-3D-001`, Quality bác v0.1
rồi chấp nhận v0.2 là **ACCEPTED CANDIDATE · BUILD BLOCKED** (cổng G1–G7). Hai bản đã nhập repo:
`docs/design-candidate/IF-DEC/`. ⛔ **MAIN KHÔNG được thi công mục PROPOSED trong bản đo của
chính mình** — đó đúng là thứ đang bị cổng chặn.

**DWG đã gắn cờ TẮT** (`ca0eb7c`) + cổng `npm run soi:giay-phep` chặn mọi `electron:build*`.
Tắt cờ **không** gỡ mã GPL khỏi bộ cài — việc gỡ khỏi artifact vẫn còn nợ.

🔴 **ĐO THẬT 29/08 — BỘ CÀI DỰNG TỪ HEAD `913ac61` VẪN MANG GPL-3.0. Câu trả lời: CÒN.**
Dựng thật (`next build` + `npx electron-builder --mac --dir`, cả hai exit 0), rồi quét ruột
`dist-installer/mac-arm64/InteriorFlow.app/`:
- `…/app/.next/static/media/libredwg-web.56922457.wasm` **và** `…/app/.next/server/chunks/static/
  media/…` — **HAI bản**, mỗi bản 9.399.820 byte, sha256 `2b66d476…` **trùng khớp**
  `public/wasm/libredwg-web.wasm`. Tổng **17,9 MiB**.
- `…/app/.next/server/chunks/6995.js` (187 KB) + `…/static/chunks/6513.*.js` (67 KB) — **toàn bộ
  glue Emscripten của libredwg-web đã minify**, còn nguyên đường dẫn `@mlightcad/libredwg-web/wasm`.

**Đường nó lọt vào:** hai dòng loại trừ ở `package.json:133-134` (`!node_modules/@mlightcad/**`,
`!public/wasm/libredwg-web.wasm`) **CÓ hiệu lực** — hai đường đó đã sạch trong artifact. Nhưng
`lib/cad/dwg-worker.ts:277` `await import('@mlightcad/libredwg-web')` khiến **webpack đã sao mã GPL
+ WASM vào `.next/` TRƯỚC KHI** electron-builder chạy, và `package.json:118` gói cả `.next/**/*`
không loại trừ gì. **Loại trừ nguồn không đuổi kịp bản sao của bộ đóng gói.** ⇒ cần ARCHITECT
quyết, MAIN không tự sửa `package.json`.

⚠️ **Cổng `soi:giay-phep` đã NÓI DỐI, nay đã chữa.** Trên đúng artifact bẩn ở trên, bản cũ in
"✅ không thấy gói/WASM GPL", exit 0. Hai lỗ độc lập: ① trần độ sâu `sau > 6` — đường thật sâu 8,
vòng quét quay đầu trước khi tới nơi; ② chỉ soi **tên tệp** — `6995.js` mang trọn mã GPL mà tên
vô tội. Đã bỏ trần độ sâu + soi **ruột** tệp mã, phân biệt được mã GPL với **trang ghi công**
`/settings/licenses` (trang này bắt buộc phải nhắc tên GPL, không được tính là vi phạm).
Nay `--chan` → **exit 1**, 2,5s. `npm test` vẫn exit 0 (mức cảnh báo).

---
*(bản 27/08, dấu vết:)* **Wave S1 · mục 2 — `W1-ASSET-REPRESENTATION-SCOPE-001` đã XONG (`ef0f2d6`, proof 20/20).**
⇒ Việc kế tiếp: **Wave S2 · lát F3** — `.idfc` → 2D → 3D → BOQ → Present → export/reopen,
đi trọn một đường end-to-end **trước khi** dựng thêm bất cứ tính năng song song nào.

Bốn mục Wave S1 đều đã đóng, mỗi mục kèm proof runtime (xem `02-SMARTBOARD.md` sổ bằng chứng).

## 🟢 QUYẾT ĐỊNH KIẾN TRÚC MỚI NHẤT — 27/08

**ADR Q14 · Local-first + Opt-in Selective Sync** — `docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md`.
Máy giữ bản gốc · đồng bộ nhẹ theo quyền và theo vùng · Library đi bằng **catalog** (metadata +
quyền + nguồn + version + hash + preview), asset nặng tải theo yêu cầu sau khi kiểm quyền ·
năm scope tách bạch, **Builder OS memory không lẫn vào Product Knowledge** · Lark là connector
ngoài, không phải nguồn chân lý · cấm ghi đè im lặng · ⛔ **không cài Supabase, không đổi database**.

## ⛔ HAI CHỐT CHẶN CÒN SỐNG

1. **Prisma — `PARTIAL`, KHÔNG phải xanh.**
   Sổ migration đã chữa gốc (`20260820000000_baseline_bu_ba_bang`; parity chứng minh bằng
   *"This is an empty migration"*). Nhưng nhãn đúng là
   **`PARTIAL — parity/recovery proven; target-isolation incident F-18 remains open`**:
   parity đo SAU sự cố là bằng chứng **phục hồi tốt**, nó không biến một thao tác **ghi nhầm
   đích** thành PASS.
   ⛔ **CẤM `reset` · `db push` · `migrate resolve` trên DB thật trong mọi lane sau.**
   ⛔ **Mọi lệnh có thể ghi DB phải đi qua cổng:**
   `node scripts/db-target-guard.mjs --expect <đường dẫn> -- <lệnh>`
   Cổng in đường **tuyệt đối** + băm tệp + **vân tay dữ liệu** trước/sau, và **DỪNG khi mục tiêu
   lệch**. `export DATABASE_URL` **không** cách ly được — `.env` thắng (đó là F-18).
   Bằng chứng cổng: `scripts/proof/db-target-guard.mjs` **15/15**, có ca dựng lại đúng F-18.
   Hai bản sao lưu sống: `dev.db.bak-2026-08-27-mocsach-truoc-baseline` (sổ 5 hàng) ·
   `…-sau-ky-so` (sổ 7 hàng). Hai `migration.sql` đã ký nay **BẤT BIẾN** — sổ giữ checksum.
2. ⛔ **CẤM `git revert 147f66a`.** Commit đó mang nhan đề về R3 (9 tệp) nhưng chứa **991 tệp** —
   980 tệp là việc chưa commit của phiên trước, bị `git add -A` nuốt vào, gồm một lượt **xoá**
   `components/IntroSequence.tsx`. Hoà chốt **GIỮ NGUYÊN**: cấm revert · rebase · reset · cấm
   tách lại. Cần lùi phần R3 thì lùi **từng tệp**, không lùi commit — 9 đường dẫn liệt kê ở
   `docs/design-candidate/IDF-IF-PACKET-003/release/02-SCOPE-CORRECTION-147f66a.md`.
   🔒 Từ nay **cấm `git add -A`/`git add .` khi cây bẩn**; trước mỗi commit đối chiếu số tệp
   staged với số tệp chủ ý sửa, lệch thì **dừng**.

3. **Plugin Prisma vẫn bật.** Mở phiên Claude Code mới là 3 tiến trình `prisma mcp` sinh lại, và
   `migrate-reset` nằm trong tầm tay chúng. Kiểm+diệt: `pkill -f "prisma mcp"; pgrep -c -f "prism[a] mcp" || echo 0`.

## Runtime
| | |
|---|---|
| Mã hiện tại | **0 dev server đang chạy** (đo 27/08). Bật lại: `npx next dev -p 3001` từ gốc repo — **đừng dùng `npx` ngoài repo**, nó tải Next 16 thay vì 14.2.35 của dự án |
| Đóng băng | `:3777` ảnh chụp phát hành · `:3778` bản dựng cũ — **đừng nghiệm thu trên hai cổng này** |
| Electron | mở được bằng `ELECTRON_START_URL=http://127.0.0.1:3799 npx electron .` |
| ⚠️ | server dev **chết vài lần** trong ngày lúc nhiều lane chạy — kiểm sống trước khi kết luận |

## Cổng đo cuối cùng — đo 24/08 01:30
`tsc` **0 lỗi** · `npm test` **0 fail** (đã gồm cổng bánh cóc) · `soi:design-school` **0 mồ côi** ·
`soi:foundation` **271** · `soi:thao-tac` **1** (nợ cũ)

⚠️ **Con số nền KHÔNG so sánh trực tiếp được với "1.173" của 23/08** — số cũ đo bằng một cái thước
sai. Xem "Nền móng" bên dưới.

## Frontier
| Bề mặt | Trạng thái |
|---|---|
| Font tiếng Việt | ✅ **XONG-MÁY** — BeVietnamPro, đủ dấu, hết serif |
| Hệ màu sáng | ✅ xong-máy — 25 token về ngả lam `#f2f2f7` |
| Rail hai cụm | ✅ xong-máy · neo **52px** (23/08) — 👁 **chưa qua mắt**, chưa soi trên trình duyệt thật |
| Files hai tầng | ✅ xong-máy — 👁 chưa qua mắt |
| Cửa sổ công cụ v0 | ✅ xong-máy — lệnh vệ tinh **chưa nối bộ thi hành** |
| **Trang chủ** | 🔴 **FAIL** — 7/10 lỗi đã sửa, **chưa có ảnh app thật để chấm lại** |
| Trường Thiết Kế | ✅ 61 tệp + 5 skill + 2 máy soi mới |

## ĐỢT 25/08 — audit thước rồi mới sửa (HEAD `0524e1a`)

**Nợ nền: 1.173 → 128.** Không đợt nào sửa mù; mỗi thước bị AUDIT trước, và **cả hai lần audit
đều bắt được thước báo oan** — nếu sửa theo con số thì cả hai lần đều làm hỏng thứ đang đúng.

| Họ luật | Trước | Sau | Thước bắt oan gì |
|---|---|---|---|
| `F-ICON-SIZE` | 874 | **0** | (đợt trước) đếm cả `size` của quả cầu vật liệu · avatar · chấm trạng thái |
| `F-ICON-STROKE` | 137 | **37** | `stroke-width` trong **chuỗi sinh SVG** — 9 ca |
| `F-MOTION-TOKEN` | 84 | **41** | 🔴 `0.001ms !important` trong `prefers-reduced-motion` — **lối thoát trợ năng** |
| `F-ICON-VIEWBOX` | 74 | 49 | chưa audit |
| `F-MAT-VOCAB` | 1 | 1 | G0–G3 chưa có mặt dưới dạng token |

⛔ **37 ca nét CÒN LẠI KHÔNG ĐƯỢC SỬA BẰNG CÁCH ĐỔI SỐ.** Phần lớn ở `components/nodes/NodeIcons.tsx`
— bộ icon inline vẽ trên **lưới 16**, nét 1.2. Bơm 1.2 → 1.5 trên lưới 16 làm icon **nặng hơn về
quang học**; "sửa" theo con số sẽ làm hỏng hình. **Việc thật ở đó là DI TRÚ LƯỚI 16 → 24** (hoặc
đưa về primitive `Icon`), và đó là việc thị giác, không phải việc số học.

⛔ **Ba ca nhịp còn lại cần phán đoán, không phải đổi số:** `900ms` (chuyển màu logo Login — chậm
có chủ ý) · `260ms` (nằm giữa 220 và 300, không có lựa chọn hiển nhiên) · `700ms`.

## Kho bản vẽ — ĐỌC TRƯỚC MỌI VIỆC THỊ GIÁC
`docs/mocks/CLAUDE-DESIGN-CURRENT.md` = **bản nào đang hiệu lực**. `docs/mocks/` = ~106 bản vẽ.
⛔ Trước khi brief hay dựng bất cứ thứ gì người dùng nhìn thấy: **`ls docs/mocks/` + đọc tệp trên.**
Ngày 23/08 MAIN cũ brief ba lane bằng bố cục **tự nghĩ ra**, trong khi ba bản vẽ đúng việc đó
**đã nằm sẵn trong repo** — và bản vẽ rail còn chặt hơn brief ở **6 điểm**. (M-30)

## 📌 ĐIỂM DỪNG AN TOÀN — 24/08/2026 01:30 (đợt NỀN MÓNG · icon)

**Dừng theo yêu cầu của Hoà, tại ranh giới sạch.** Không có lane nào đang chạy. Không có việc dở dang.

### Runtime lúc đó *(số liệu KHẢO CỔ 24/08 — không phải hiện trạng)*
Mã `:3799`, `/api/dev-identity` khai `kind:current-source · head c7f3ac8 · pid 83870`.
Tên người ghi của đợt đó **đã gỡ khỏi mục này 27/08** — chỉ ô `NGƯỜI GHI HIỆN TẠI` ở đầu tệp mới
nói ai cầm bút, và một cái tên cũ nằm dưới mục "Điểm dừng" vẫn đọc được như một lệnh còn sống.

### ✅ XONG — `F-ICON-SIZE` **ĐẠT** (0 vi phạm · 12 miễn trừ có khai báo)
Từ **832** vi phạm THẬT (số cũ 874 có 42 ca oan). 6 lane × ~139 site, phân hạng theo **VẬT CHỨA**
(bảng §04: micro 14 · row 16 · compact/standard 18 · major/rail 20), **không làm tròn theo số**.

### 🔧 SỬA CHÍNH MÁY SOI — 6 lỗi, làm TRƯỚC khi sửa sản phẩm
Cái thước sai thì mọi con số đo bằng nó đều sai. Cả 6 đều đã chứng minh bằng phép đo:
| # | Lỗi | Hệ quả |
|---|---|---|
| 1 | `F-ICON-SIZE` đếm MỌI `size={N}` trong tệp có import lucide | oan `MaterialSphere size={120}` · `UserAvatar 68` · `VitalsStateDot 7` |
| 2 | `F-ICON-VIEWBOX` soi MỌI `<svg>` | oan tranh intro 200×200 · avatar · ảnh sinh 768×512 · đồ thị viewBox động |
| 3 | `F-ICON-STROKE` soi cả nét trong CHUỖI sinh ảnh | oan `stroke-width="0.35"` của `lib/render-core` |
| 4 | **`--tu-kiem` là CỜ MA** — khai ở `:33`, không dùng ở đâu | ai chạy cũng thấy "bình thường" rồi tưởng máy đã tự kiểm |
| 5 | **`mienTru` là SỐ MA** — in ra mọi lượt, không dòng nào tăng | "0 miễn trừ" đọc thành "không ai xin", thật ra là "không xin được" |
| 6 | ⭐ **ĐẾM HỤT**: JSX lồng trong prop — `<IOMenu items={[{icon: <FileUp size={15}/>}]}>` | thẻ NGOÀI nuốt `size` của thẻ TRONG ⇒ 3 icon trong `Toolbar.tsx` tàng hình, máy báo tệp SẠCH |
⇒ Nay: `--tu-kiem` **chạy thật** (chèn tệp ảo, đòi cả 4 họ bắt được mẫu hỏng, trượt là exit 3) ·
miễn trừ **phải khai tại chỗ + nêu đích danh họ luật + lý do ≥12 ký tự** (khai suông thì VẪN tính vi phạm,
đã thử nghiệm chứng minh) · `--tat-ca` bỏ trần hiển thị 40 dòng · `--tran` là **CỔNG BÁNH CÓC**.

### 🔒 CHỐNG TÁI PHÁT — nguyên nhân gốc đã đóng
**KHÔNG máy soi nào từng nằm trong `npm test`** — đó là lý do nền trôi mà không ai thấy lúc đang trôi.
Nay `npm test` chạy `soi:foundation -- --tran`; trần ở `scripts/foundation-tran.json`
(`F-ICON-SIZE: 0` đã khoá). **Vượt trần = ĐỎ. Nới trần cho test xanh = tháo ngòi (M-52).**

### 🩹 LỖI CỦA CHÍNH MAIN TRONG ĐỢT NÀY — đã sửa, đã ghi M-56
Phiếu tôi viết có câu *"không có control bọc ⇒ 14"*. Sai cho **glyph là nhân vật chính của một ô**.
Bóp hỏng **8 chỗ** (vùng thả tệp `MaterialImportWizard` 26→14 · `form/shared` 22→14 · thẻ
`CollectionPlus` 34→14 · `ItemThumb` 22→14 · 2 vòng quay `Dashboard` 22→14). **Mọi cổng đo vẫn XANH**
suốt lúc đó — máy chỉ hỏi "cỡ có thuộc {14,16,18,20}", mà 14 thì thuộc (M-01).
Đã **hoàn nguyên đủ 8** kèm miễn trừ. Bắt được là nhờ **lane tự khai nghi ngờ** (lane 4) và **lane BÁC
thẳng** (lane 5) — ô ⓪ TIỀN ĐỀ (M-32) trả lãi lần nữa.
**Phép thử một câu:** *bỏ glyph này đi thì ô còn gì không?* Còn ⇒ icon. **Trống trơn ⇒ TRANH, đừng đụng cỡ.**

### Tệp đã đụng
`scripts/soi-foundation.mjs` (6 sửa) · `scripts/foundation-tran.json` (mới) · `package.json` (cổng test) ·
**172 tệp** `components/**` `app/**` (chỉ giá trị trong `size={N}` + 12 chú thích miễn trừ) ·
`docs/control/IF-CURRENT-STATE.md` · `IF-TOOLING-RECEIPT.md` §9 · `IF-UXUI-OPERATING-MEMORY.md` (M-55 · M-56).
⛔ **KHÔNG đụng**: bố cục · className · màu · khoảng cách · cấu trúc JSX · `strokeWidth` · `viewBox`.

### Lane
Cả **6/6 ĐÓNG**, không lane nào còn chạy. Mỗi lane tự chạy `tsc` = 0 trước khi đóng.
2 lane BÁC site không-phải-icon (đúng); 1 lane tự sửa lại phán đoán của mình giữa chừng.

### 🔴 CÒN ĐỎ — chưa đụng, thứ tự đề nghị
| Họ | Còn | Ghi chú trước khi bắt đầu |
|---|---|---|
| `F-ICON-STROKE` | **137** | ⚠️ chưa audit ca oan như đã làm với SIZE — **kiểm thước trước, sửa sản phẩm sau** |
| `F-ICON-VIEWBOX` | **49** | 42 ca là `0 0 16 16` (bộ icon nhà, thật) |
| `F-MOTION-TOKEN` | **84** | hai thang `--dur-*` ↔ `--nhip-*` cùng sống (M-26) |
| `F-MAT-VOCAB` | **1** | G0–G3 chưa có mặt dạng token; đụng `globals.css` ⇒ xem "Đừng đụng" |

### ⛔ CHƯA CÓ — nói thẳng
**REAL BROWSER UNVERIFIED.** Chưa một pixel nào của đợt này được nhìn trên app thật: rail + phần lớn
bề mặt nằm sau đăng nhập, playwright trên `:3799` thấy `.if-rail-spine` = 0 (app đứng ở màn khoá).
~680 site đổi cỡ icon = **thay đổi người dùng NHÌN THẤY**, mới chỉ qua máy, **chưa qua mắt**.
Theo M-01 trần cứng là **PARTIAL**, cấm PASS.

### ▶️ (đã gộp — xem ô HÀNH ĐỘNG KẾ TIẾP CHÍNH XÁC ở CUỐI tệp, đó là ô DUY NHẤT)
> 🔴 Mục này từng là ô thứ hai nói việc kế tiếp. Hai ô cùng sống = M-54. Nội dung dưới giữ lại
> làm dấu vết, **đừng thi hành từ đây**.
> **Audit thước của `F-ICON-STROKE` y như đã làm với `F-ICON-SIZE`** — liệt kê 137 chỗ bằng
> `npm run soi:foundation -- --tat-ca`, phân loại ICON ↔ TRANH ↔ ẢNH SINH, sửa máy soi nếu còn đếm oan,
> **rồi mới** hội tụ. ⛔ Đừng sửa 137 chỗ trước khi biết thước đúng — đó đúng là cái bẫy đợt này vừa thoát.

## CHECKPOINT 24/08 — cây đã bảo toàn

| | |
|---|---|
| Nhánh | `checkpoint/2026-08-24-control-plane` |
| Commit | `02c9378` control plane · `869b782` guard infra · HEAD `869b782` |
| Cây | **582 tệp còn bẩn — CỐ Ý.** Chủ khác/chưa truy được; luật cấm `add -A` |
| Cổng | `tsc` 0 · `npm test` pass (hook chạy lúc commit) · `soi:design-school` 0 mồ côi |
| Remote | **behind 57** — KHÔNG pull/rebase/merge; bảo toàn trước |
| Runtime | `:3799` 200 mã hiện tại · `:3778` 200 **bản dựng CŨ, đừng nghiệm thu trên đó** |

**Nhóm 1** `02c9378` — `docs/control/**` · `docs/design-campaign/**` · `CLAUDE.md` bộ nạp ·
4 cửa vào cũ đóng dấu.
**Nhóm 2** `869b782` — 5 máy soi · `frontier-registry` · `Icon.tsx`+test · `dev-identity` ·
`middleware` · `dev-electron` · `package.json`.
⚠️ Buộc phải kèm `soi-visual-source.mjs` + `foundation-tran.json`: `npm test` đã phụ thuộc chúng,
commit `package.json` mà thiếu là **gãy cổng test**.

**CỐ Ý KHÔNG ĐÓNG** — 12 script chủ khác (`backfill-*` `seed-*` `audit-*` `kiem-3d-*` `md-to-pdf`
`sinh-mau-*` `chup-visual-review`) và toàn bộ `app/` `components/` `lib/` đang bẩn.

✅ **LỖ BẢO TOÀN ĐÃ VÁ 24/08** — commit `b81dd88` **nhóm 3**. `.gitignore` nay chặn `.claude/*`
và mở đúng `!.claude/skills/**/*.md`: **72 tệp, 100% `.md`, không gì khác lọt** (kiểm bằng
`git add -n` và `git check-ignore -v` hai chiều). Quét an toàn 7 mục trước khi mở — 0 secret ·
0 symlink ra ngoài · 0 binary >200KB · 0 đường dẫn máy cá nhân · 0 email · khớp "TTT" duy nhất
là câu **bắt buộc trung tính**. Worktree · settings · cache · session · socket **vẫn bị chặn**.

📌 **FOLLOW-UP DÀI HẠN — GHI, KHÔNG THI CÔNG HÔM NAY.**
Kho skill canonical hiện nằm trong `.claude/`, tức **thư mục của MỘT công cụ**. Đúng về mặt bảo
toàn nhưng sai về mặt sở hữu: skill là tài sản của **repo**, không của Claude, không của một chat.
Hướng xem xét sau: dời sang thư mục trung tính (`.agents/skills` hoặc `skills/`), rồi để
Claude/Codex dùng **adapter hoặc symlink** trỏ vào. Đổi chỗ kho là đụng mọi con trỏ trong
`SKILL.md` + `soi:design-school` ⇒ phải làm trọn một lượt, có máy canh chạy sau, **không làm vội**.

## Đừng đụng
`docs/nc/**` · `docs/00-CHOT.md` · `CHANGELOG.md` · `docs/bao-cao-phien/**` — **nhật ký lịch sử**, sửa là viết lại lịch sử.
`app/globals.css` — token dùng chung; đổi phải kèm cập nhật bản sao trong `lib/wallpaper/contrast.ts` (có drift-guard canh, nó sẽ đỏ).

## Chờ CON NGƯỜI quyết — chỉ cái chặn thật
1. **Ảnh Trang chủ sau đăng nhập** — chặn mọi lượt chấm tiếp theo. `node scripts/chup-man-duyet-mat.mjs --dang-nhap`
2. **Màu nhấn thứ hai** — mòng két `#1f7f88` ↔ mận `#8f5a72`. Token `--mau-ai` đã sẵn, đổi **hai dòng**.
3. ~~**Rail nấc hẹp 28 hay 52px**~~ — ✅ **ĐÓNG 23/08.** Chỉ thị cuối của Hoà §SIDEBAR MAP tuyên
   thẳng **"52px anchor rail"** ⇒ `IF-CANONICAL.md` §10 `[CHỐT]` là phân giải, không phải ghi vội.
   **THAY BỞI:** IF-CANONICAL §10. Bản vẽ `mock-rail-hai-cum.html` (28px) nay LỖI THỜI ở con số này.
   ✅ **THI CÔNG XONG 23/08** (MAIN mới): `muc-dieu-huong.ts:133` → `dinhVi: 52` · test `:233`
   đổi kỳ vọng → 52 · ba khối docstring cũ giải thích "vì sao 28" đã viết lại · nút thu/mở
   `RailDieuHuong.tsx` 24 → **32px cố định**.
   ⚠️ **Đừng đổi nút đó thành `var(--tap)`** như ghi chú cũ gợi ý: `--tap` bị override thành **44px**
   dưới `(hover:none) and (pointer:coarse)` (`app/globals.css:206-208`), mà máng chỉ còn
   52 − 2×6 = **40px** ⇒ 44 > 40 là tràn trên cảm ứng. 32 cố định vượt sàn WCAG 2.2 (24) và lọt 40.
   🟡 `tsc` 0 · `npm test` 0 fail · **REAL BROWSER UNVERIFIED** — rail nằm sau đăng nhập, đo bằng
   playwright trên `:3799` thấy `.if-rail-spine` = 0 vì app đứng ở màn khoá.
4. ~~**Auto-hide rail**~~ — ✅ **ĐÓNG 23/08** bằng chỉ thị cuối: phân giải bằng **CHỦ Ý** chứ không bằng trigger. `PEEK` (hover) **được** tự thu · `OPEN` (bấm/bàn phím) **cấm** tự thu · `PINNED` thường trực. Xem `IF-CANONICAL.md` §10. **Việc thi công, không còn là câu hỏi.**
5. **Present** — hạ ở tầng điều hướng, **không đụng khoá `Phase`**?
6. **`/files` mồ côi** — rail là lối vào duy nhất, mà danh sách chốt 23/08 không có Files.

## Ưu tiên — CHỈ THỊ CUỐI 23/08 ĐÃ ĐẶT THỨ TỰ
`P0` Foundation → App Shell → **Sidebar** → TopShell → Ask/Tìm → Vitals → Now Surface
`P1` ToolWindow → Dock → Inspector → Toolbelt → nhớ bố cục
`P2` **Home** → Project → Sources → Library → Design DNA → 2D → 3D → Vật liệu → Present → Review
⛔ **Cấm bắt đầu P4 (delight) khi P0/P1 còn hỏng cấu trúc.** Rõ ràng trước, delight sau.
⛔ **Không dừng sau mỗi đợt để hỏi** — chỉ dừng theo 5 điều kiện ở `IF-CANONICAL.md` §20.

## HÀNH ĐỘNG KẾ TIẾP CHÍNH XÁC
🔴 **CHỈ CÓ MỘT Ô NÀY NÓI VIỆC KẾ TIẾP.** Bản 23/08 để câu lệnh ở đây, rồi 24/08 lại thêm một câu
nữa ở khối ĐIỂM DỪNG — hai câu cùng sống là đúng bệnh đã đóng dấu thành luật ở đầu tệp
(M-54: dán khối mới lên đầu mà không quét cả tệp tìm câu lệnh còn sống). Gộp lại tại đây:

**① LÀM ĐƯỢC NGAY, không chờ ai — audit thước `F-ICON-STROKE`** (137 chỗ) đúng cách đã làm với
`F-ICON-SIZE`: `npm run soi:foundation -- --tat-ca` → phân loại ICON ↔ TRANH ↔ ẢNH SINH → sửa máy soi
nếu còn đếm oan → **rồi mới** hội tụ. ⛔ Cấm sửa 137 chỗ trước khi biết thước đúng.

**② CHẶN NGƯỜI, không chặn việc — ảnh sau đăng nhập.** Cần Hoà chạy MỘT lần (lệnh đúng ở
`IF-TOOLING-RECEIPT` §9, hai bước, mật khẩu không lên dòng lệnh). Có ảnh rồi thì chạy `if-design-review`
lượt hai **do phiên KHÁC chấm**, và nó nay phải chấm cả **~680 site đổi cỡ icon của đợt 24/08** —
chúng là thay đổi người dùng nhìn thấy, mới qua máy, **chưa qua mắt**.
⚠️ ② chỉ chặn việc CHẤM. Không được đứng yên chờ nó — ① và cả P0 còn lại đều đi được.

**③ NỢ CÓ TÊN CỦA ROLE GUARD (31/08, sau Hướng A).** Cổng đã đóng bốn lỗ đo được — ống thuần
đọc bị chặn oan · lớp VERIFY phải xin lease · `IF_FILE_ALLOWLIST` hứa mà không đọc · công cụ ghi
ngoài `Bash/Write/Edit` không ai canh. Còn lại, **chưa làm, đừng tưởng đã xong**:
- `2>&1` bị chặn cùng lối với `> tệp` (cùng ký tự `>`), nên không gộp được stderr khi chạy lệnh.
  Chưa tách; hiện phải dùng ống `| tail`.
- Guard mới chứng minh trên tuyến **Claude**. Tuyến **Codex** chưa lượt nào đi qua cổng này.
- `npm test` **ĐANG ĐỎ ở `soi:cau`** (4 phiếu đã ghi chưa giao) và `soi:ban` (khối máy giữ của
  bàn 00 · 06 lệch nguồn, chữa bằng `node scripts/phieu-ca.mjs --ghi-ban`). **Cả hai có trước
  Hướng A và không thuộc lane nào của nó** — chữa là việc của người giữ cầu, không phải của
  phiên vừa sửa guard. Ghi ra đây để không ai đọc `npm test` đỏ rồi đổ cho guard.
