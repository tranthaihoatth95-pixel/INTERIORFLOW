# Prompt chạy `/understand` lần đầu cho IF — dán vào phiên T mới

> Hoà dán KHỐI DƯỚI vào ô nhập của phiên Claude Code mới trong repo `~/Downloads/interiorflow`. Không cần chỉnh gì.

---

Chào T. Đây là phiên đầu tiên sau khi Hoà cài plugin **Understand-Anything** (Egonex-AI, v2.5, 18/08). Việc của bạn: chạy `/understand` lần đầu cho toàn codebase IF, đối chiếu bản đồ máy vẽ với hiến pháp `docs/IF-KIEN-TRUC-OS.md` T viết tay.

## ⓪ TIỀN ĐỀ
1. Plugin đã cài (kiểm: gõ `/understand` phải có gợi ý autocomplete). Nếu không có → DỪNG, báo Hoà mở terminal `claude` chạy `/plugin install understand-anything` lại.
2. `git rev-list --count HEAD..main` = 0 (đúng mốc).
3. Bản đồ tay đã có: `docs/IF-KIEN-TRUC-OS.md` · `docs/IF-KIEN-TRUC.md` · `docs/BAN-DO-KIEN-TRUC-2026-08-18.md` — đây là căn cứ đối chiếu.

## ① BỐI CẢNH
Suốt 5 ngày qua T viết tay bản đồ kiến trúc IF, mốc 19 ngày (`IF-ARCHITECTURE-COMPASS.md` mồ côi), đẻ khái niệm ma (master tool ↔ ToolWindow · .idfnotes). **Cơ chế tự sync CODE ↔ BẢN ĐỒ mới chặn được loại lỗi này.** Understand-Anything giải đúng chỗ đau đó: LLM 1 lần sinh graph → click node xem plain-English + dependencies → post-commit hook tự cập nhật.

## ② ĐỌC TRƯỚC
1. `docs/IF-KIEN-TRUC-OS.md` — hiến pháp OS 18/08, đọc §5 lớp + §Đối chiếu hiện trạng (5 rủi ro)
2. `docs/BAN-DO-KIEN-TRUC-2026-08-18.md` — bản đồ T tay viết + 8 câu Q1-Q8 chờ Hoà chốt
3. Xem README plugin: `~/.claude/plugins/marketplaces/Egonex-AI/Understand-Anything/README.md` (nếu tồn tại)

## ③ VÙNG FILE ĐƯỢC ĐỤNG
Chỉ: `.ua/` (plugin tự sinh) · `.gitignore` (thêm 2 dòng loại trừ) · báo cáo `docs/bao-cao-phien/`.
KHÔNG đụng: mọi code khác.

## ④ VIỆC
1. **Chạy `/understand`** — quét toàn codebase, sinh `.ua/knowledge-graph.json`. Cảnh báo trước với Hoà: tốn nhiều token (codebase ~700 file, 32MB docs) + thời gian ~vài phút.
2. **Chạy `/understand-dashboard`** — mở dashboard tương tác, xem qua bản đồ.
3. **Chạy `/understand-domain`** — trích ra domain view (business flows). ⭐ Đối chiếu với 5 lớp OS: PROJECT · WORKFLOW · KNOWLEDGE · COMMUNITY · AI.
4. **Cập nhật `.gitignore`** — thêm 2 dòng: `.ua/intermediate/` và `.ua/diff-overlay.json` (theo README plugin).
5. **Bật auto-update**: `/understand --auto-update` — cài post-commit hook để mỗi commit sau đó tự patch graph.
6. **Đối chiếu với bản đồ T tay viết**:
   - Máy phát hiện được bao nhiêu trong 21 model Prisma?
   - Có bắt được **khái niệm ma** không (master tool = ToolWindow · lib/gateway tên trùng AI Gateway · Flow trùng nghĩa)?
   - Có phát hiện lớp COMMUNITY = 0 code không?
   - Có thấy AI Gateway CHƯA CÓ (chỉ gọi thẳng provider) không?
7. **Xuất bảng đối chiếu** vào báo cáo — bên trái AI thấy gì, bên phải T tay viết. 3 cột: (a) máy ĐÚNG hơn T (b) máy THIẾU so với T (c) máy VÀ T cùng đúng.

## ⑤ RÀNG BUỘC
- **Chọn LOCAL model** (Ollama) nếu có, tránh cloud để đúng luật Own your data + Privacy Fully Local. Nếu Ollama không có → dừng hỏi Hoà chọn cloud provider nào.
- **KHÔNG commit `.ua/` vội** — chạy xong `/understand`, đọc kết quả, đối chiếu, RỒI mới commit (theo README plugin: có thể commit để share team, nhưng file >10MB dùng git-lfs).
- **KHÔNG sửa code IF** — chỉ đọc + báo cáo.
- Trích mã điều khoản TRIẾT-LÝ-IF: [Đ2] nhìn-vào-trong-trước (đây chính là cỗ máy làm việc đó tự động) · [T5] con người quyết cuối (Hoà xem bản đồ máy vẽ rồi mới quyết dùng thay/bổ tay).

## ⑥ NGHIỆM THU
- File `.ua/knowledge-graph.json` tồn tại
- Chạy `/understand-dashboard` mở được
- Bảng đối chiếu đủ 3 cột, có ít nhất 5 hàng mỗi cột
- Auto-update hook bật thành công (test: sửa 1 file bất kỳ, commit, xem graph có update không)

## ⑥b VÒNG TỰ ĐÓNG
Đích: 4 nghiệm thu ⑥ đều PASS + báo cáo xuất được. Chưa đạt → tự sửa/tra README plugin/hỏi Hoà. Trần 3 vòng. Quá trần → nộp bản có phần nào xong bấy nhiêu, khai rõ vòng nào hỏng vì gì.

## ⑦ BÁO CÁO
Lưu `docs/bao-cao-phien/2026-08-19-understand-lan-dau.md` theo khuôn 6 phần `docs/CLAUDE.md`:
1. Tổng quan (1-3 câu)
2. Số liệu: bao nhiêu node graph · file · function · class · thời gian chạy · token tiêu
3. Bảng đối chiếu AI ↔ T
4. Đánh giá khách quan (AI hơn/kém T ở đâu, có đáng thay tay không)
5. ≥2 hướng dùng plugin về sau (chỉ tra khi cần vs cập nhật liên tục vs kết hợp cả tay lẫn máy)
6. Đề xuất 1 hướng + lý do

## ⑦b CHƯA CHẮC
- Plugin v2.5 vừa ra 5/2026 — có thể bug chưa lộ
- LLM sinh graph = có thể sai/thiếu (như mọi AI-generated) — đối chiếu tay là kiểm cần thiết
- Chạy trên codebase lớn có thể timeout/tràn context — sẵn sàng cắt scope nếu cần

## ⑦c HẠN DÙNG KẾT LUẬN
"Bản đồ AI này hết đúng khi: (a) plugin update lên v3 · (b) code IF đại refactor · (c) Hoà chốt Q1-Q8 trong BAN-DO-KIEN-TRUC-2026-08-18.md làm hình dạng schema đổi."

## ⑧ DÂY MÁY
Entry registry `understand-anything-cai-dat` — mở trong `frontier-registry.mjs` sau khi ⑥ đủ 4 nghiệm thu.

---

**Nhớ**: dán CẢ khối trên (từ dòng "Chào T" tới cuối) vào ô nhập phiên T mới. Không cần gõ thêm.
