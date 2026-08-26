# Wave 15 (Lane B) — VITALS INPUT HYGIENE: audit, KHÔNG sửa sản phẩm

## Kết luận: PASS — Vitals KHÔNG ăn dữ liệu rác. Không đổi mã sản phẩm.

## 1 · Truy từng tín hiệu về nguồn thật (đo call site, không đọc comment)
| Tín hiệu | Nguồn thật | Đọc bảng Project? |
|---|---|---|
| `dangChay` · `nhanDangChay` · `chayLoi` | `useFlowStore(s => s.flowRuns)` — mảng **trong phiên**, khởi tạo `[]` (`lib/store.ts:350`), chỉ được `push` khi người dùng THẬT SỰ chạy node (`:775`) | **KHÔNG** |
| `chuanCanXem` | `doQuyChuan()` → `useCadStore.getState().doc` — bản vẽ **đang mở**; 0 entity ⇒ `undefined` ⇒ im | **KHÔNG** |
| `diaDiemCanXem` · `diaDiemMien` | `GET /api/projects/<id>/site` — **đúng MỘT dự án lấy từ URL** | Không duyệt bảng |
| `demoXong` · `demoTong` | `tomTatSpine()`, chặn sau cờ `demoBat` — mặc định **TẮT** (`docBatTuLuu()` đòi localStorage `'1'`) | **KHÔNG** |

**Bằng chứng đóng đinh:** toàn bộ lời gọi `/api/` của Vitals chỉ có `/api/projects/<id>` ·
`/api/ai-assist-chat` · `/api/home/notes`. `grep listProjects|allProjects|projects')` trong cả ba
tệp Vitals = **0**. Không có chỗ nào đếm dự án ⇒ **rác không có đường vào**.

## 2 · Xác minh độc lập dữ liệu rác Lane A báo
15 dòng Project — khớp. `__nb:` = **5** — khớp.
🔧 **Fixture tôi đếm 5, Lane A báo 4**: `Dự án verify inline input` · `Enter test 2` ·
`Test B3 (phục hồi backup)` · `M-SCOPE test rỗng` · `Dự án guard`.

| Loại | Số | Chủ sở hữu |
|---|---|---|
| PLACEHOLDER `__nb:` | 5 | 2 của Hoà · 2 demo@if.local · 1 userId null |
| FIXTURE | 5 | 2 demo · 2 smallfixes-verify@ttt.vn · 1 guard-…@test.local |
| USER | 5 | 4 của Hoà · 1 demo |

**Không xoá, không sửa dữ liệu** — chỉ phân loại.

## 3 · Thử tại thời gian chạy (ca khó nhất: placeholder Hoà TỰ SỞ HỮU)
| Ca | Khẩu độ | Site API |
|---|---|---|
| `__nb:` của **người khác** | KHÔNG mount | HTTP 404 |
| FIXTURE của người khác | KHÔNG mount | HTTP 404 |
| **`__nb:` của chính Hoà** | **KHÔNG mount** (thân trang 125 ký tự) | OK, `daCu=0` ⇒ **im** |
| USER `Nháp` / `Dự án mới` | `calm` | OK, `daCu=0` |

⇒ Hai lớp chặn độc lập: dòng rác **không dựng nổi màn có khẩu độ**, và kể cả dựng được thì
`daCu=0` ⇒ `chonTinHieu` im (luật "không đo không nói" đã có test khoá).

## 4 · Hai lần phép đo của tôi suýt cho kết luận sai
① Lượt đầu cả **ba** dự án đều "không có khẩu độ" — tôi suýt kết luận Vitals bị chặn ở mọi nơi.
Thật ra **dev server đã chết** (`curl` → `000`, không listener); trang rỗng 125 ký tự là vỏ lỗi.
Khởi động lại rồi đo mới có nghĩa. ⇒ *Trước khi kết luận từ một phép đo trình duyệt, kiểm server sống.*
② Lượt hai tôi thử `__nb:` của **người khác** rồi định kết luận "placeholder bị chặn" — sai căn cứ:
404 đó là do **không thuộc quyền**, không phải do placeholder. Phải thử đúng dòng Hoà sở hữu mới
loại được giả thuyết. ⇒ *Chọn ca thử sai thì kết luận đúng cũng chỉ là may.*

## 5 · Không làm gì thêm
Vitals đã cô lập ⇒ theo luật, **PASS, không đổi sản phẩm**. Không dựng "định nghĩa dự án sạch"
thứ hai bên trong Vitals; nếu sau này cần, nó phải là predicate CHUNG ở tầng repository, không
phải bản riêng của Vitals.
