# SPEC — HỆ NGÔN NGỮ CHỈ DẪN (semantic guidance · UX writing)

> Hoà 02/08, chê dải cảnh báo *"Flow này có 2 node — chọn Node MASTER ở sidebar chỉ hiện được 1
> việc, mở Node Library để xem đủ"*: **"nói vậy chả ai hiểu gì cả."** Gốc bệnh: câu nói CƠ CHẾ
> bằng THUẬT NGỮ NỘI BỘ. Spec này là luật cho MỌI chữ hiện ra trước người dùng.

## 1 · Năm luật viết (mọi thông điệp)
1. **Hành động trước, cơ chế sau (hoặc bỏ)** — nói người dùng LÀM GÌ và ĐƯỢC GÌ, không giải thích hệ thống vận hành.
2. **Cấm thuật ngữ nội bộ lộ ra UI** — dùng Từ điển §3. Người dùng là KTS/designer, không phải dev.
3. **Ngắn**: 1 câu = 1 ý, ≤ 12 từ, động từ đứng đầu. Tối đa 2 câu/thông điệp.
4. **Kèm NÚT làm ngay** — đừng bảo "mở X để xem"; đặt nút [Xem tất cả] ngay cạnh. Chỉ-chữ-không-nút = thiết kế hỏng.
5. Giọng: tiếng Việt tự nhiên, không sến, không emoji, không "vui lòng" (luật `chat-assist` dùng chung).

## 2 · Bốn loại thông điệp — khuôn cố định
| Loại | Khi nào | Khuôn | Ví dụ |
|---|---|---|---|
| **Trống** (empty state) | chưa có gì | [icon] + 1 câu mời + [nút bắt đầu] | "Chưa có ảnh nào — kéo ảnh vào đây" [Chọn ảnh] |
| **Mách nước** (coach mark) | lần đầu gặp tính năng | 1 câu + [nút thử] + tự tắt sau khi làm 1 lần | "Kéo công cụ ra giữa để mở bảng làm việc" [Thử ngay] |
| **Nhắc trạng thái** (hint strip) | có gì đó user nên biết | 1 câu kết quả + [nút xử] · chỉ hiện khi THẬT SỰ cần | xem §4 |
| **Lỗi chặn** | không đi tiếp được | điều gì hỏng + cách thoát, KHÔNG đổ lỗi user | "Ảnh quá 20MB — chọn ảnh nhỏ hơn hoặc để IF nén lại" [Nén giúp tôi] |

## 3 · TỪ ĐIỂN — nội bộ (cấm lộ) → chữ người dùng thấy
| Nội bộ (code/docs) | UI tiếng Việt | UI EN |
|---|---|---|
| Flow / graph | **bảng làm việc** | board |
| Node | **khối** | block |
| Node MASTER | **công cụ** | tool |
| Node thường | khối | block |
| Node Library | **thư viện khối** | block library |
| Tool window | **cửa sổ công cụ** | tool window |
| campath | **đường máy quay** | camera path |
| subgraph | (không bao giờ lộ) | — |
| stage/mode | **chặng / chế độ** | stage / mode |
| render v2 tier | (không lộ — chỉ hiện "AI" / "tự tính, 0 credit") | — |

## 4 · Sửa mẫu — chính câu Hoà chê
- ✗ Gốc: "Flow này có 2 node — chọn 'Node MASTER' ở sidebar bên trái chỉ hiện được 1 việc, mở Node Library để xem đủ."
- ✓ Mới: **"Còn công cụ khác chưa hiện."** [Xem tất cả] — nút mở thẳng thư viện khối.
- Hoặc nếu ý là flow đơn giản: **"Bảng này mới có 2 khối — thêm công cụ để làm tiếp."** [Thêm công cụ]

## 5 · Thi công
- `lib/i18n.ts` giữ MỌI chuỗi (EN+VI đủ cặp) — không hardcode chữ trong component.
- Coach mark ghi localStorage `seen:*`, hiện đúng 1 lần.
- Nghiệm thu: đọc to câu cho người KHÔNG làm dev nghe — hiểu ngay trong 3 giây mới đạt.

---
*Cowork soạn 02/08/2026 theo yêu cầu Hoà. Nối SPEC-DESIGN-SYSTEM-IF §5 (chữ cũng là thiết kế) · LUAT-CHU-VIET-7.1.23.*

---

# 6 · BỘ TÊN CHÍNH THỨC (COWORK-UI append 03/08/2026 — việc 8 của `CHOT-TEN-CHANG-MODE-2026-08-03`)

> Nguồn chuẩn: `docs/CHOT-TEN-CHANG-MODE-2026-08-03.md` mục **"VÒNG CUỐI 03/08 — ĐÈ LÊN TOÀN BỘ VÒNG TRƯỚC"** (Hoà gật).
> Mục này **append**, không sửa đè §1-§5. Có xung đột giữa §3 (Từ điển cũ) và §6 → **§6 thắng** cho lớp tên chặng/mode/app.

## 6.1 · Bảng tên chốt — DÙNG NGUYÊN VĂN, KHÔNG BIẾN THỂ
| Lớp | Tên chốt | Header hẹp | Ghi chú |
|---|---|---|---|
| Ứng dụng | **InteriorFlow** | IF | Giữ tiếng Anh. **Luật cấm-jargon KHÔNG áp cho tên riêng/thương hiệu** (Figma/Notion cũng không dịch tên riêng). Đổi tên = đổi logo + repo + đuôi `.idfp` + toàn bộ docs, và mất lợi thế nếu bán quốc tế. |
| Chặng 1 | **2D Kỹ thuật** | **2D** | "Kỹ thuật" = trục đúng-sai: đúng thước, đúng lớp, xuất hồ sơ. |
| Chặng 2 | **3D Thiết kế** | **3D** | "Thiết kế" = trục đẹp-xấu: khối, ánh sáng, vật liệu, phối cảnh. |
| Chặng 3 | **Trình bày** | **Trình bày** | Không rút gọn thêm. |
| Mode chặng 2D | **Sơ phác ↔ Kỹ thuật** | — | Đúng 2 chế độ đối nhau. Mode "Kỹ thuật" bổ sung phần 3D-CAD. |
| Mode chặng 3D | **Node ↔ 3D** | — | Đúng 2 chế độ đối nhau. |
| Mode chặng Trình bày | **KHÔNG CÓ MODE** | — | Không được thêm. |

**Nguyên tắc đặt tên (dùng để thẩm mọi đề xuất sau):** đặt theo **CHIỀU KHÔNG GIAN + MỤC ĐÍCH**, KHÔNG theo động tác tay. `2D`/`3D` là ký hiệu quốc tế, không phải jargon chữ → không phạm §1 luật 2.
**Không có mode thứ ba lửng lơ ở bất kỳ chặng nào.** Mỗi chặng đúng 2 chế độ đối nhau, hoặc không mode.

## 6.2 · Tên ĐÃ BỎ — giữ dấu vết để KHÔNG đặt lại vòng 5
Bộ tên hiện hành là kết quả **bốn vòng** đặt đi đặt lại trong cùng ngày 03/08. Ba bộ dưới đây **đã bị Hoà bác**, phiên sau đề xuất lại = lặp việc đã đóng:

| Vòng | Bộ tên đã bỏ | Lý do bỏ (nguyên văn/tóm) |
|---|---|---|
| 1 | ❌ **Phác · Kỹ thuật · Cấu kiện** | "Cấu kiện" nghe nặng xây dựng, lệch định vị **BIM nội thất**. |
| 2 | ❌ **Vẽ · Dựng ảnh · Trình bày** | "Dựng ảnh" bỏ rơi khối 3D + video — chặng 2 nay gánh cả ba. |
| 3 | ❌ **Vẽ · Dựng · Trình bày** | Hoà: *"vẽ với dựng trong ngôn ngữ design là 1"* — tự tạo mập mờ. |
| — | ❌ **Rendering · Presenting · CAD** (nhãn code cũ) | Tiếng Anh lộ UI, phạm §1 luật 2. |
| — | ❌ **BIM** làm nhãn UI | Jargon Anh. Chỉ dùng trong docs kỹ thuật. |

## 6.3 · ⚖️ LUẬT ĐỔI TÊN
1. **Muốn đổi bất kỳ tên nào ở §6.1 phải qua Hoà.** Không phiên nào — Cowork hay Code, kể cả TỔNG — được tự đặt lại.
2. Phiên nào đề xuất tên mới **bắt buộc đọc §6.2 trước** và nói rõ vì sao lý do bỏ cũ không còn đúng. Đề xuất không tham chiếu §6.2 → audit đánh 🔴 trả về.
3. Đổi tên hiển thị **KHÔNG được đổi khoá kỹ thuật** (`CadMode` = `sketch/pro/revit`, route `/cad` `/` `/present-editor`) — đổi khoá = vỡ persist.
4. Luật nền đi kèm (từ cùng file chốt): **ba chặng là ba ỐNG KÍNH soi vào MỘT nguồn dữ liệu, không phải ba kho dữ liệu.** Đề xuất "đồng bộ / copy / xuất-nhập dữ liệu giữa các chặng" là sai từ gốc.

## 6.4 · BẢNG TỪ CẤM ↔ TỪ THAY (tra nhanh khi rà nhãn)
| Từ CẤM lộ UI | Thay bằng | Ghi chú |
|---|---|---|
| `Rendering` | **3D Thiết kế** (hẹp: 3D) | |
| `Presenting` · `Present` | **Trình bày** | |
| `CAD` · `CAD · Phác thảo` | **2D Kỹ thuật** (hẹp: 2D) · **2D Kỹ thuật · Sơ phác** | Chữ `CAD` vẫn dùng trong code/docs (`lib/cad/*`, route `/cad`) — chỉ cấm lộ ra nhãn UI. |
| `Dựng ảnh` (nhãn chặng) | **3D Thiết kế** | Nếu là **tên khối/node** ("Dựng ảnh AI") thì KHÔNG thuộc diện này — đó là tên chức năng, không phải tên chặng. |
| `Dựng` (nhãn chặng) | **3D Thiết kế** | Bỏ ở vòng 3. |
| `Vẽ` (nhãn chặng) | **2D Kỹ thuật** | Chữ "Vẽ" làm **nhãn nhóm công cụ** trong toolbar thì GIỮ — không phải tên chặng. |
| `Vẽ 3D` (nhãn mode chặng 2) | **3D** (cặp **Node ↔ 3D**) | |
| `Bảng` · `Board` · `Render+Mood+Collab` (nhãn mode chặng 2) | **Node** | |
| `Phác thảo` · `Phác` (nhãn mode) | **Sơ phác** | |
| `Chuyên` · `Pro` · `Revit` (nhãn mode) | **Kỹ thuật** | Khoá kỹ thuật `pro`/`revit` giữ nguyên. |
| `Cấu kiện` (nhãn mode) | **BỎ HẲN** — không có mode thứ ba | Dữ liệu cấu kiện là **tầng dưới của cả ba chặng**, không phải một mode. Phần Revit cắt đôi: mặt bằng/ký hiệu/thống kê → 2D Kỹ thuật; khối/đặt đồ/vật liệu → 3D Thiết kế. |
| `BIM` | **không lộ UI** | Chỉ dùng trong docs kỹ thuật + spec. Với người dùng nói "đồ nội thất · lớp hoàn thiện · tủ bếp · trần · sàn". |
| `IFC` · `Pset` · `IfcCovering`… | **không lộ UI** | Docs kỹ thuật + nhãn xuất file. |
| `Flow` · `graph` | **bảng làm việc** | Đã có §3, nhắc lại. |
| `Node` (khối thường) | **khối** | Đã có §3. LƯU Ý: **"Node" làm TÊN MODE chặng 3D là hợp lệ** (§6.1) — ngoại lệ duy nhất. |

## 6.5 · Nghiệm thu nhãn (dùng cho mọi mock + màn app mới)
Grep 8 chữ này ra **0 kết quả** ở vùng nhãn hiển thị mới đạt:
`Rendering` · `Presenting` · `Dựng ảnh` · `CAD ·` · `Phác thảo` · `Cấu kiện` · `Vẽ 3D` · `Dựng`
(chữ `Vẽ` và `Present` phải soi bằng mắt — có trường hợp hợp lệ, xem §6.4).

---
*COWORK-UI append 03/08/2026 — việc 8 bảng §C `CHOT-TEN-CHANG-MODE-2026-08-03`. Không sửa §1-§5.*
