## Bắt đầu session
Đọc @STATUS.md TRƯỚC TIÊN. Cập nhật nó cuối mỗi task.

## Quy tắc worktree & context

### Giới hạn cứng
- **Tối đa 5 worktree cùng lúc** (= 5 agent song song, tăng từ 3 lên 5 sau 21/07). Nếu đã có 5, KHÔNG tạo thêm — hỏi chủ dự án worktree nào dọn trước.
- Mỗi worktree PHẢI đặt tên theo pattern: `interiorflow-wt-{tên-nhánh}` (vd: `interiorflow-wt-ui-motion`).

### Dọn cuối phiên — CƠ CHẾ AN TOÀN (21/07 rule mới)
Cuối mỗi phiên (hoặc khi chủ dự án bảo dọn), tự động dọn worktree nhưng CHỈ khi đủ MỌI điều kiện an toàn dưới đây — thiếu 1 điều là DỪNG lại, báo chủ dự án, KHÔNG dùng force:
1. Nhánh của worktree đã MERGE vào nhánh tích hợp (`git branch --merged feat/present-layout-ml-p1` liệt kê).
2. `git -C <worktree> status --short` SẠCH (không có file dirty/untracked ngoài `IF1_IF2_BIGPICTURE.md` gitignore).
3. Không có dev server nào còn chạy trong thư mục worktree (`lsof` check).
4. Không có branch nào chỉ tồn tại ở worktree đó mà chưa push/merge (mất commit là mất luôn).
Nếu 4 điều kiện đủ: `git worktree remove <path>` (KHÔNG `--force`) + `git branch -d <branch>` (KHÔNG `-D`) + gỡ entry trong `.claude/launch.json` nếu có. Nếu 1 điều kiện thiếu: giữ nguyên worktree, ghi rõ lý do vào STATUS.md phần "Worktree đang mở", để chủ dự án quyết.

### Sau khi merge nhánh vào main
1. Chạy test + tsc trên main — PASS mới tiếp.
2. **Xoá worktree đã merge NGAY** — `git worktree remove interiorflow-wt-{tên}`.
3. Xoá nhánh remote nếu đã push: `git branch -d feat/{tên} && git push origin --delete feat/{tên}`.
4. Cập nhật STATUS.md: chuyển mục "đang chạy" sang "vừa xong" hoặc CHANGELOG.md.

### Trước khi bắt đầu sprint mới
- Chạy `git worktree list` — nếu còn worktree cũ từ sprint trước → **DỪNG, báo chủ dự án**, không tự tạo worktree mới chồng lên.
- Kiểm tra ~/Downloads (hoặc folder chứa repo) không có folder `interiorflow-*` rác.

### Chống tràn context
- STATUS.md **dưới 800 từ**. Lịch sử đã xong chuyển sang CHANGELOG.md.
- KHÔNG đọc CHANGELOG.md mỗi đầu phiên — chỉ đọc khi được yêu cầu.
- Nếu gặp lỗi "autocompact thrashing" → nguyên nhân là file quá lớn hoặc quá nhiều file trong context. Báo ngay, KHÔNG tự retry liên tục.

## Project Knowledge
Tài liệu tham chiếu đã load vào `knowledge/` (copy từ `~/Downloads/knowledge/`, 18/07):

**`knowledge/ttt-design-system/`** — hệ thiết kế TTT. ⚠️ CHỈ dùng khi làm **tài liệu/báo cáo CHO TTT**, KHÔNG áp vào sản phẩm (xem LUẬT NỀN TẢNG bên dưới).

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
