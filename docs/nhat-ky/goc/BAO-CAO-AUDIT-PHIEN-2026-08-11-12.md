# BÁO CÁO AUDIT — chuỗi phiên 11-12/08/2026 (65+ commit, 13 agent code + 6 agent NC/mock)

> Hoà yêu cầu 12/08: "tổng quan trước đó · thay đổi sau mỗi phiên (nguyên nhân · nội dung ·
> khác trước chỗ nào) · check rơi rớt chưa merge". Mọi dòng đối chiếu git log + soi-frontier thật.

## §0 · TỔNG QUAN TRƯỚC (baseline `fc3036d`, sáng 11/08)

Trạng thái lúc đó: app có khung 3 chặng chạy được nhưng **"chưa 1 sản phẩm frontier nào dùng
được"** (lời Hoà, được chứng minh đúng bằng PDF xuất thử: tỷ lệ "1:47", chữ đè hình, khung tên
lộ jargon). Bệnh hệ thống: tính năng có sẵn trong code mà không ai nối ("kho chưa mở"), sổ giấy
mục theo thời gian nên frontier đợt trước biến mất khi bàn đợt sau, nghiệm thu chỉ dừng ở
tsc/test — không ai mở file đầu ra. Library/FM chạy dữ liệu mock; Task là ốc đảo không biết
workspace; cụm nền canvas dở dang từ phiên Codex.

## §1 · PHIÊN KIỂM (11/08 chiều) — "kiểm tra, đánh giá, checklist"

- **Nguyên nhân:** 2 agent 09/08 chết vì hạn mức tuần, cần khép sổ; Hoà lệnh handoff.
- **Nội dung:** kiểm 3 mock 09/08 + màn chọn hồ sơ H4 (đều đã về đích qua phiên khác); gom
  handoff (`HANDOFF-KIEM-TONG-2026-08-11.md`); commit cụm mock+handoff; **sửa lỗi "PATTERN
  CANVAS ĐÂU?"** (trả dot-grid `--dots` — FlowCanvas bị tắt 2 tầng: color transparent + CSS
  opacity:0); minimap lên góc phải; **phát hiện login tự động LÀM ĐƯỢC** bằng gõ phím thật
  (đảo kết luận sai của các handoff cũ → ghi memory vĩnh viễn).
- **Khác trước:** canvas có pattern kỹ thuật đúng chốt thay vì trơn lì; từ đây verify browser
  sau login là khả thi — mở đường cho toàn bộ nghiệm thu về sau.

## §2 · PHIÊN SOI GIAO DIỆN + UX (11/08 tối)

- **Nguyên nhân:** Hoà soi trực tiếp bằng ảnh: scrollbar thô, bảng việc trống vô hồn, nút
  "Nhập bản vẽ" vô duyên, dock 3D "hầu như chẳng sử dụng được", toolbelt "lệch bento".
- **Nội dung (5 commit):** ẩn scrollbar dock Sketch/Paper (tái dùng `.cad-pill-scroll`);
  **Bảng việc 2 luồng** (5 template nghiệp vụ gieo việc THẬT qua API + nút Vitals disabled kèm
  lý do); empty-state 2D thay pill; **dock 3D thu gọn chỉ hiện nút thật** (16 nút → 5, 12 nút
  chờ-engine dời vào bảng mở rộng có nhãn+lý do); toolbelt về nhịp 44 (bỏ nút 62px), dock cảm
  ứng chia 3 lớp có vách.
- **Khác trước:** UI hết "nút giả câm" — frontier lộ ở dạng ĐỌC ĐƯỢC; nhịp 44/34 được tôn trọng.

## §3 · PHIÊN KIẾN TRÚC + KỶ LUẬT MÁY (11/08 khuya) — nền của mọi thứ sau

- **Nguyên nhân:** Hoà: "bàn xong đợt 3 là frontier đợt 1-2 biến mất — cách gì khắc phục, rẻ".
- **Nội dung:** hệ tên CẤP 0→3 + 8 hệ xuyên app + TaskContext (00-CHOT); `TU-VAN-LOI-LUONG`
  (bảng ĐỌC/NUÔI + 10 mâu thuẫn + kế hoạch 3 đợt); **SỔ FRONTIER SỐNG** (`soi-frontier.mjs` —
  registry máy-đọc, báo đỏ 2 chiều, exit 1); **LUẬT CHUẨN ĐẦU RA NGHỀ** (`CHUAN-DAU-RA-NGHE.md`
  — sinh từ lần đầu MỞ FILE layout.pdf bằng mắt); Hero Output **Story Set**; 5 Phiếu chống rủi
  ro (kịch bản nghiệm thu hành vi); Cổng Duyệt nội bộ (CĐT ở ngoài hệ); NC 6 vai ~110
  deliverable; NC 3 lớp người dùng + % tiết kiệm.
- **Khác trước:** nghiệm thu đổi định nghĩa (= mở file đầu ra); trí nhớ dự án chuyển từ sổ
  giấy sang máy kiểm — soi-frontier bắt lệch ngay phát chạy đầu (STANDARD_SCALES có sẵn mà
  đường xuất không gọi — đúng nguyên văn căn bệnh).

## §4 · ĐỢT CODE 1 (12/08 đêm, 4 agent + audit độc lập từng cái)

| Cụm | Nguyên nhân | Khác trước |
|---|---|---|
| Xuất 2D đạt LUẬT (`dd7d98b`) | 3 lỗi PDF 11/08 | "1:47"→1:50 bắt nấc · khung tên 9 ô sạch jargon · né nhãn v1 leader · gate CHUAN_DAU_RA trong dialog xuất — **audit = sinh lại PDF soi mắt** |
| Material Impact (`1993290`) | lõi impact.ts + test đủ, 0 UI gọi (Cổng R1 #4) | lần đầu "đổi 1 lan 5" SỜ ĐƯỢC: panel hỏi trước khi áp, số thật 6 nơi tiêu thụ, undo nguyên |
| TaskContext (`1035f5a`) | Task là ốc đảo (mâu thuẫn #1) | Task mang stage/workspace/entity + migration (backup DB trước) + chip chặng bấm nhảy deep-link |
| ThinkDial + LightArc + PresenceRow (`1322c28`) | 4 engine Vitals có sẵn không cần gạt; ánh sáng trạng thái chưa có linh kiện | 4 nấc gating payload thật (Nghiên cứu NỐI RAG notebook — vượt kỳ vọng) · cung sáng xuất PDF · avatar online màu/offline trắng-đen (tiện tay khử hex lậu + vi phạm G1 cũ) |

## §5 · ĐỢT CODE 2 (12/08 rạng sáng, 4 agent)

| Cụm | Nguyên nhân | Khác trước |
|---|---|---|
| Né nhãn v2 (`baa727e`) | soi mắt đợt 1 còn WC/BẾP cấn, dim trong phòng | labelInRoomBounds + dimOutsideRoom — **PDF audit độc lập: 0 nhãn đè, dim ra ngoài 2 lớp thẳng hàng** — bản vẽ demo lần đầu đạt trọn LUẬT §1 |
| Story Set v1 (`051f6ab`) | Hoà phê "app studio không có sản phẩm đặc trưng" | hero output thành thẻ THẬT đầu gallery hồ sơ, 8 trang 6 chương, ảnh mẫu Unsplash verify 200 |
| Bảng khởi tạo (`4fc9c3c`) | Gallery toàn "Untitled flow" — khoảnh khắc giàu thông tin nhất bị bỏ phí | ProjectProfile + Scaffolder gợi ý kèm CĂN CỨ; phát hiện đắt: 2 cấp quyền đã có nền (isAdmin/owner) — 0 vai mới |
| Kho THẬT (`00ee78c`) | "Lắp Trước Dựng Sau" chưa có kho (mâu thuẫn #3); lệnh Hoà "kho không giả trân" | Library đọc LibraryAsset, FM bỏ mock (0 thật thay 2,1GB bịa), 17 seed minh hoạ Unsplash TẢI OFFLINE, gỡ `--undo` |

## §6 · PHIÊN HÌNH HỌC + VITALS VISUAL (12/08)

- **Nguyên nhân:** Hoà chê "bo góc không phát triển từ tâm"; nhớ card kính gradient "rất đẹp";
  giao 5 ref Siri mới.
- **Nội dung:** audit hình học (`fb1ccc9` — **35% radius lẻ, 8px×259 lần không thuộc thang
  nào, 10/15 cặp lồng vi phạm**; máy soi `soi:hinh-hoc`; thang hợp nhất 6/10/14/20+capsule CHỜ
  HOÀ DUYỆT); card kính gradient tái sinh CÓ NGHĨA (`72bf098` — chỉ chạy khi status=running);
  chốt Vitals 3 cấp window theo Siri + hover gradient kem (`ce2103e`) + mock (`8eb1e1f`).
- **Khác trước:** cảm giác "không đồng bộ" của Hoà nay là CON SỐ đo được + máy canh vĩnh viễn.

## §7 · KIỂM RƠI RỚT (12/08 — git thật)

- **Working tree SẠCH** (chỉ `AGENTS.md` untracked — của Codex, giữ theo luật). Registry
  **23 xong · 22 chờ · 0 lệch**.
- **Đã dọn 27 nhánh local đã-merge** (git branch -d, gồm 3 nhánh worktree-agent tạm).
- **2 nhánh CHƯA merge — để Hoà quyết, không tự xử:**
  1. `fix/hatch-t-junction` (11/07, +244 dòng hatch DCEL cho phòng vách chữ T + test) — CÓ
     GIÁ TRỊ (liên quan TECH-DEBT findHatchBoundary) nhưng 1 tháng tuổi, lib/cad đã đổi nhiều
     → merge sẽ conflict, cần 1 lượt đánh giá riêng. Có bản sao trên origin.
  2. `fix/quality-pipeline` (18/07, 1 commit docs thử nghiệm 3-agent) — giá trị thấp, đề nghị xoá.
- **2 stash cũ** (pre-merge-stash trên feat/present-layout-ml-p1: launch.json+STATUS ·
  wip-dsstore trên feat/copy-global: Header+webgpu) — nhỏ, nhánh gốc đã merge từ lâu, đề nghị
  Hoà liếc 1 lần rồi drop.
- **Còn treo chờ tay Hoà:** duyệt thang bo 6/10/14/20 (AUDIT-HINH-HOC) · restart dev server
  (Prisma client mới: ProjectProfile/TaskContext) · quyết Neufert + 2 nhánh trên.
