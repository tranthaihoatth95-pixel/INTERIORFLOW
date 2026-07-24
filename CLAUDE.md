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

**`knowledge/ttt-design-system/`** — nguồn sự thật cho mọi output visual của IF (Present, slide, PDF export).
- [SKILL.md](knowledge/ttt-design-system/SKILL.md)
- [readme.md](knowledge/ttt-design-system/readme.md)
- [styles.css](knowledge/ttt-design-system/styles.css)

**`knowledge/project-references/`** — hồ sơ dự án tham khảo (PDF, ~121MB — nặng, cân nhắc Git LFS nếu repo phình to sau này).
- 260320_Sungroup-Beach-Club-Phu-Quoc_mood.pdf
- 2600403_Sungroup-Beach-Club-Phu-Quoc_ConceptID_REV01.pdf
- 260623_8324_HV_Office.pdf
- 260710_DETECH_COMPLEX__1_.pdf

**`knowledge/ttt-brand/`** — TTT Brand Guideline (5 biến thể: gốc/in/VI/VI-Dark/VI-EN).

## ⛔ LUẬT NỀN TẢNG — IF là SẢN PHẨM ĐỘC LẬP, GLOBAL (rule hardcore 24/07)
**InteriorFlow KHÔNG phải tool nội bộ TTT. Đây là sản phẩm độc lập, bán/dùng toàn cầu, KHÔNG dính thương hiệu TTT.**

1. **TUYỆT ĐỐI KHÔNG nhúng cứng thương hiệu TTT (hay bất kỳ studio nào) vào sản phẩm** — không logo, tên, màu, font TTT trong khung tên CAD, intro, brand mặc định, placeholder, deck mẫu. TTT chỉ là MỘT người dùng như mọi studio khác.
2. **Brand Kit = nhận diện riêng của TỪNG DỰ ÁN** (logo · màu · font · watermark của khách hàng/dự án đó). Mọi chỗ cần thương hiệu (khung tên bản vẽ, footer slide, watermark, export) PHẢI đọc từ Brand Kit của dự án đang mở, KHÔNG hardcode.
3. **Không áp đặt ngôn ngữ thiết kế nào lên nội dung người dùng.** App phải cho chọn tự do — serif/sans/mọi bộ font, mọi palette. 3 bộ FontPairing (Editorial/Modern/Elegant) là ĐÚNG cho sản phẩm global, serif KHÔNG phải lỗi.
4. **UI của chính app** có nhận diện riêng của InteriorFlow (trung tính, quốc tế), tách khỏi nội dung dự án người dùng tạo.
5. **Song ngữ**: giao diện hỗ trợ VI/EN (đã có switcher) — không mặc định chỉ tiếng Việt.

> `knowledge/ttt-design-system/` + `knowledge/ttt-brand/` chỉ dùng khi làm **tài liệu/báo cáo CHO TTT** (vd báo cáo BGĐ), KHÔNG áp vào sản phẩm.
> Nợ cần dọn: `titleBlockTTT()` (lib/cad/commands.ts) in "TTT ARCHITECTS" lên mọi bản vẽ · brand mặc định trong `lib/store.ts`/`lib/nodes/registry.ts` · chip "TTT · Creative Studio" ở intro · deck mẫu · comment mô tả IF là "tool nội bộ TTT".
