# PHIẾU COWORK-PHU — loạt dài, chạy một mạch · 06/08/2026 22:30
Dán nguyên khối dưới đây vào phiên **COWORK-PHU** (Cowork local, trỏ `~/Downloads/interiorflow`).

## Vì sao giao PHU chứ không phải Claude Code
PHU là **Cowork local** — đọc/grep/ghi file thật, **không tốn limit Code**, và theo §7 thì
**KHÔNG code, KHÔNG chạy git**. Loạt việc dưới đây đều là **đọc · nghiên cứu · soạn spec**,
đúng vai. Đường ranh: cái gì phải *bấm được trên màn* mới nghiệm thu được → để Claude Code.

## 🛡 LUẬT CHỐNG VA CHẠM — đọc trước, vi phạm là mất việc của người khác
Lúc 22:24 đo được: **74 file dirty**, và `1·fix-gocc` **vẫn đang ghi** (`components/materials/*`
sửa lúc 22:22). Vì vậy:

| ⛔ CẤM ĐỤNG | Vì ai đang giữ |
|---|---|
| `lib/**` `components/**` `app/**` `prisma/**` | 4 phiên Claude Code đang chạy |
| `docs/GAP-IF.md` | §0u — **chỉ COWORK-TỔNG** ghi |
| `docs/VIEC-DANG-CHO.md` · `docs/00-BAT-DAU-DOC-DAY.md` | TỔNG giữ |
| `docs/mocks/**` | `3·apply-node` sắp nhận `G-A-04`/`G-A-05` |
| `docs/M*-OUT.md` | của từng phiên code |
| **mọi lệnh `git`** | V6 — Hoà commit |

**✅ ĐƯỢC:** đọc toàn repo · tạo **file MỚI** trong `docs/` với tên đã ghi sẵn dưới đây ·
sửa **đúng 1 file cấu hình** ở VIỆC 1 (đã kiểm 22:28: sạch, không ai giữ).

**Ghi delta GAP vào `docs/PHU-OUT.md` của mình** — TỔNG gộp về `GAP-IF` sau (§0u).

---

# KHỐI DÁN — từ đây trở xuống

```
[COWORK-PHU] Loạt việc 06/08. Bạn là Cowork local trỏ ~/Downloads/interiorflow.
KHÔNG code, KHÔNG chạy git, KHÔNG commit. Làm tuần tự 1→6, xong việc nào báo việc đó.

⛔ CẤM ĐỤNG: lib/** components/** app/** prisma/** · docs/GAP-IF.md ·
docs/VIEC-DANG-CHO.md · docs/00-BAT-DAU-DOC-DAY.md · docs/mocks/** · docs/M*-OUT.md · mọi lệnh git.
Lý do: 4 phiên Claude Code đang ghi trên các vùng đó (đo 22:24: 74 file dirty, phiên
`1·fix-gocc` vẫn đang sửa components/materials lúc 22:22).

✅ ĐƯỢC: đọc toàn repo · tạo file MỚI trong docs/ đúng tên ghi dưới đây · sửa tsconfig.json
(đã kiểm sạch). Delta GAP ghi vào docs/PHU-OUT.md của bạn, đừng đụng GAP-IF.md.

LUẬT BẮT BUỘC (đọc docs/00-BAT-DAU-DOC-DAY.md §0t, §0o, N8 trước khi gõ):
- grep phải là `grep -rna` — thiếu `-a` thì grep nuốt tệp có byte điều khiển và trả rỗng IM LẶNG,
  kết luận "0 nơi gọi" thành dương tính giả. Đã bị 2 lần.
- MỌI dòng trong đề xuất phải kèm `file:dòng` chứng minh, hoặc gắn nhãn CHƯA GREP.
  Bệnh cũ: 8 lần đề xuất xây thứ ĐÃ CÓ SẴN, vì tin suy luận kiến trúc hơn tin code.
- Nói "đã có / đã đúng / đã làm rồi" thì phải MỞ FILE RA KIỂM trước, dán đường dẫn.
- TRUNG TÍNH: 0 tên khách, 0 số liệu dự án trong mọi file bạn viết (data khách ở 2407-Test/).

═══════════════════════════════════════════════════════════
VIỆC 1 — DỌN NHIỄU tsc (nhanh nhất, làm trước, ~10 phút)
═══════════════════════════════════════════════════════════
Chạy `npx tsc --noEmit` → đang đỏ 3 file, KHÔNG file nào thuộc việc ai đang làm:
  2407-Test/M3-out/t2-boq.ts · t2-run.ts  — import bằng đường dẫn TUYỆT ĐỐI /Users/tranben/...
  lib/cad/render-layer-index.test.ts:36   — ép kiểu Viewport thiếu panX/panY

Hệ quả thật: mọi phiên chạy tsc đều thấy đỏ rồi tưởng mình làm hỏng, đi tìm mất thời gian.

Việc: sửa tsconfig.json — thêm "2407-Test" vào mảng "exclude" (nay chỉ có ["node_modules"]).
2407-Test là thư mục gitignored chứa data khách, đáng lẽ không nằm trong tầm tsc.
⛔ KHÔNG sửa lib/cad/render-layer-index.test.ts — mảng đó `2·m1-loi-cad` đang giữ. Chỉ GHI LẠI.

Nghiệm thu: chạy lại `npx tsc --noEmit`, dán output. Phải còn ĐÚNG 1 lỗi (render-layer-index).
Ghi kết quả vào docs/PHU-OUT.md.

═══════════════════════════════════════════════════════════
VIỆC 2 — CHỌN NỀN THỜI GIAN THỰC cho SyncWork  → docs/SPEC-REALTIME-SYNCWORK.md
═══════════════════════════════════════════════════════════
Đây là việc ĐANG CHẶN 3 màn (Kanban ghi ngược · chat nhóm · con trỏ nhiều người).

BƯỚC 0: grep -na "yjs\|liveblocks\|socket.io\|partykit\|pusher\|ably\|automerge" package.json
        → 06/08 đo được 0. Kiểm lại, nếu khác thì báo ngay.

Bối cảnh đã chốt: Hoà chốt cộng tác nhiều người = CÓ. TỔNG gợi ý Yjs + y-websocket nhưng
đó MỚI LÀ GỢI Ý CHƯA NGHIÊN CỨU — nhiệm vụ của bạn là kiểm lại, được quyền bác.

Ràng buộc thật của IF, phải cân vào:
- App DESKTOP (Electron), không phải web thuần → cần chạy được cả khi offline
- Dữ liệu dự án nằm ở file .idf cục bộ, không phải cloud-first
- Studio nhỏ (vài đến vài chục người), không phải quy mô hàng nghìn
- Đã có Prisma + SQLite cục bộ
- Luật §0v L-EXT1: KHÔNG khoá nhà cung cấp vào lõi. Nền nào khoá chặt là điểm trừ nặng.

So ít nhất 3 phương án (Yjs · Automerge · một dịch vụ có sẵn kiểu Liveblocks/Partykit),
mỗi phương án chấm theo: offline-first · khoá nhà cung cấp · chi phí · độ khó nối vào code
hiện có · ai vận hành máy chủ.

File ra phải có: bảng so sánh · KIẾN NGHỊ MỘT phương án kèm lý do · sơ đồ dữ liệu chảy
(ai giữ bản gốc, gộp xung đột ở đâu) · danh sách việc code để nối (giao Claude Code sau) ·
và mục "cái gì KHÔNG cần realtime" — không phải thứ gì cũng cần đồng bộ tức thì.

═══════════════════════════════════════════════════════════
VIỆC 3 — MÔ HÌNH DỮ LIỆU GANTT  → docs/SPEC-GANTT-DATA.md
═══════════════════════════════════════════════════════════
Gantt hiện = 0 code (grep -rina "gantt" lib/ components/ app/ docs/mocks/ → 0 dòng).
Claude Design đang vẽ giao diện Gantt. Khi code bắt tay làm sẽ cần mô hình dữ liệu —
soạn TRƯỚC để khỏi mỗi phiên tự bịa một kiểu.

Đọc trước, đừng bịa: lib/lark/task-utils.ts (việc + hạn đã có) · app/api/lark-tasks/route.ts ·
prisma/schema.prisma (model Task, LarkUserMap) · components/dashboard/LarkPanels.tsx.

File ra phải trả lời:
- Việc (task) cần thêm field gì để lên được Gantt: bắt đầu · kết thúc · % xong · người/nhóm phụ trách
- PHỤ THUỘC giữa việc lưu thế nào (finish-to-start là đủ, hay cần 4 kiểu?)
- ĐƯỜNG GĂNG tính ở đâu — client hay server, tính mỗi lần mở hay lưu sẵn
- MỐC (milestone, vd giao khách) là loại việc riêng hay cờ trên việc thường
- Việc chưa giao ai / chưa có hạn thì hiện thế nào (đừng để rơi khỏi biểu đồ im lặng)
- ⚠️ §0v L-EXT1: field mới TUYỆT ĐỐI không mang tên nhà cung cấp. ID ngoài đi qua ExternalRef.
- ⚠️ K4: chỉ đề xuất field khi đã chỉ ra NƠI TIÊU THỤ cụ thể.

═══════════════════════════════════════════════════════════
VIỆC 4 — RỦI RO GIẤY PHÉP DWG  → docs/PHUONG-AN-LICENSE-DWG.md
═══════════════════════════════════════════════════════════
CLAUDE.md ghi: docs/LICENSE-NOTES.md miễn trừ GPL-3.0 của libredwg-web dựa trên lập luận
"tool nội bộ, không bán" — và lập luận đó CHẾT khi IF định vị là sản phẩm global bán ra.
Chưa ai xử. Đây là rủi ro PHÁP LÝ, không phải rủi ro kỹ thuật — để lâu càng đắt.

Đọc: docs/LICENSE-NOTES.md · docs/RESEARCH-DWG-LICENSE.md · package.json (dò dependency dính).
grep -rna "libredwg\|dwg" package.json lib/cad/ | head

File ra: rủi ro cụ thể là gì (điều khoản nào của GPL-3.0 bị chạm, khi nào phát tác) ·
các đường xử được (bỏ tính năng · thay thư viện · mua giấy phép thương mại · tách tiến trình) ·
mỗi đường: chi phí, công sức, mất gì · KIẾN NGHỊ đường nào.
⛔ Bạn KHÔNG phải luật sư — viết ở mức "đủ để Hoà quyết có cần hỏi luật sư không", nói rõ
chỗ nào là hiểu biết kỹ thuật, chỗ nào cần ý kiến pháp lý thật.

═══════════════════════════════════════════════════════════
VIỆC 5 — KIỂM KÊ MOCK, TÌM BẢN CHỐT  → docs/KIEM-KE-MOCK-2026-08-06.md
═══════════════════════════════════════════════════════════
G-M5-03: sáu trang mock cùng tả MỘT màn, KHÔNG trang nào ghi "bản chốt" — ba bản CAD shell
v3/v4/v5 dùng chung một tiêu đề. Phiên port không có cách chọn bản đúng ngoài đoán theo ngày sửa.
G-M5-05: 10/67 trang là bản xuất công cụ thiết kế, cần file kịch bản KHÔNG có trong repo;
nặng nhất là trang "Thư viện" trỏ tới 4 trang con không tồn tại.

⛔ CHỈ LIỆT KÊ, KHÔNG SỬA — docs/mocks/** là vùng `3·apply-node` sắp nhận.

File ra: bảng mọi file trong docs/mocks/ — tên · tiêu đề trong <title> · ngày sửa · kích thước ·
tả màn nào · trùng với file nào · mở được không (còn {{ }} / trỏ file thiếu / cần script ngoài) ·
ĐỀ XUẤT bản nào là bản chốt và vì sao.
Cách kiểm "mở được không": grep -a tìm chuỗi "{{" và "dc-import", và grep -a lấy <title>.

═══════════════════════════════════════════════════════════
VIỆC 6 — ĐỌC LẠI BẢN ĐỒ ArchiNote  → docs/PHUONG-AN-CAU-IDF.md
═══════════════════════════════════════════════════════════
Luật §0v L-EXT2 vừa chốt: IF ↔ ArchiNote phải nói chuyện bằng .idf, KHÔNG qua Lark.
Nay ngược lại — docs/ARCHINOTE-MAP.md:17 ghi "kênh chung mà spec chủ ý là Lark Base",
:130 ghi "toàn bộ ở Lark, không có bản sao local — mất mạng = trắng màn".

⚠️ Repo ttt-tasks KHÔNG mount trong phiên này. Chỉ đọc docs/ARCHINOTE-MAP.md (đã khảo sát sẵn)
+ lib/cad/idf.ts. Cái gì không kiểm được thì ghi CHƯA VERIFY, đừng suy.

File ra: `.idf` hiện chứa gì (đọc lib/cad/idf.ts, dán tên field thật) · ArchiNote cần gửi lên
những gì (số đo · ảnh hiện trường · ghi âm — theo ARCHINOTE-MAP) · bảng KHỚP/LỆCH giữa hai bên ·
cần thêm gì vào .idf để gánh được khớp · và ArchiNote cần tầng cache cục bộ ra sao để hết
"mất mạng = trắng màn".

═══════════════════════════════════════════════════════════
BÁO CÁO
═══════════════════════════════════════════════════════════
Ghi docs/PHU-OUT.md: mỗi việc 1 mục — đã làm gì · file ra · GAP mới phát hiện (mã tạm G-P-xx,
TỔNG sẽ đánh mã chính thức) · cái gì CHƯA VERIFY được và vì sao.
Bắt buộc có mục "lỗi tôi đã mắc trong phiên này" (HG6) — không có mục đó thì báo cáo không hợp lệ.
KHÔNG commit. Xong việc nào báo việc đó, đừng đợi xong hết.
```

---

## Sau khi PHU xong — TỔNG làm gì
Gộp `docs/PHU-OUT.md` → `GAP-IF.md` (một ngòi bút, §0u) · lấy `SPEC-REALTIME-SYNCWORK.md` để
soạn phiếu code nối realtime · lấy `SPEC-GANTT-DATA.md` ghép với mock Gantt của Claude Design.

## Bản đồ ai giữ gì — lúc 22:30
| Ai | Vùng | Trạng thái |
|---|---|---|
| `1·fix-gocc` | `lib/materials` `lib/boq` `lib/ffe` `components/materials` | 🔴 **ĐANG GHI** (22:22) |
| `2·m1-loi-cad` | `lib/cad` `components/cad` | ngưng ~20:5x |
| `3·apply-node` | `components/nodes` `library` `FlowCanvas` · sắp nhận `docs/mocks` | ngưng |
| `4·apply-ingiay` | `components/print` `present-editor` | ngưng |
| **`COWORK-PHU`** | **`tsconfig.json` + 5 file docs MỚI** | phiếu này |
| `COWORK-TỔNG` | `GAP-IF` `VIEC-DANG-CHO` `00-BAT-DAU-DOC-DAY` · cây gia phả | đang chạy |
| Claude Design | `docs/mocks/*.dc.html` (file mới) | đang vẽ theo đợt |
