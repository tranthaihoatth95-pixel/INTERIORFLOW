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
