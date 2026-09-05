# HỢP ĐỒNG CẤU TRÚC ĐIỀU HƯỚNG — nguồn chung cho mọi phiên thi công cụm này

> Lập: T · 17/08. **Đây KHÔNG phải spec tính năng.** Nó là **bản khai cấu trúc** mà mọi phiên
> thi công cụm điều hướng phải đọc và tuân — để hai phiên làm hai mảnh **không ra hai cấu trúc**.
>
> 🔴 **VÌ SAO CÓ FILE NÀY** (ràng buộc Hoà đặt 17/08): *"build đồng bộ các mảnh có mối quan hệ chéo
> với nhau song song, **không được build riêng lẻ chéo ngược**"*. Sidebar · Files · Thư viện · vị trí
> Tổng quan/Sổ tay là **một cụm chéo nhau**: sửa cái nào lẻ cũng làm ba cái kia sai. Bằng chứng
> đang sống: `mock-kich-ban-sidebar.html` dựng trước chốt 16/08 nên **vẫn để Kho vật liệu và Bảng
> màu trên rail** — hai thứ Hoà đã gỡ. Đó chính là *build chéo ngược*.

---

## 1 · RAIL — một trục dọc, HAI CỤM

| Cụm | Mục | Đường | Sống khi |
|---|---|---|---|
| **XƯỞNG** | Tổng quan | `/` | luôn |
| | Bảng việc | `/tasks` | luôn |
| | Chat · Họp | 🔴 **chưa có trang** | luôn |
| | Files | `/files` | luôn |
| | Thư viện | `/library` | luôn |
| | Cài đặt | `/settings` | luôn |
| **DỰ ÁN** | Dự án này | `/projects/[id]/overview` | **chỉ khi đã mở dự án** |
| | Sổ tay | `/projects/[id]/notebook` | nt |
| | Thiết kế 2D | `/projects/[id]/cad` | nt |
| | Thiết kế 3D | `/projects/[id]/render` | nt |
| | Trình chiếu | `/projects/[id]/present` | nt |

Các cụm tách bằng **một khoảng thở**, không phải đường kẻ (luật *bỏ đường kẻ ngang chia khối*).

> 🔄 **04/09** — hợp đồng này viết khi rail còn HAI cụm. Chốt `CHOT-EXPERIENCE-SYSTEM` 20/08 điều 3
> đè thành **BA cụm** (workspace chung · dự án · cá nhân+hệ thống); mã đã thi hành. Nguồn sự thật là
> `components/nav/muc-dieu-huong.ts`, xem thêm `docs/IF-KIEN-TRUC.md` §3.
Cụm DỰ ÁN chưa mở dự án thì **mờ kèm lý do**, KHÔNG ẩn — ẩn thì người dùng không biết app có gì.

### ⛔ KHÔNG lên rail — và ở đâu thay thế
| Thứ | Vì sao | Sống ở đâu |
|---|---|---|
| **Bảng màu** | *một BƯỚC trong chọn vật liệu* (Hoà chốt 16/08) | trong luồng chọn vật liệu ở Thư viện |
| **Kho vật liệu** | *một KỆ trong Thư viện* | kệ của Thư viện |
| **Gallery** | mặt tiền tuyển chọn của kệ Ảnh | trong Thư viện |

## 2 · BA MẶT CÙNG TÊN "TỔNG QUAN" — gỡ va chạm

Đo 17/08, ba thứ khác bản chất đang cùng một tên:

| Mặt | Ở đâu | **Tên mới (T quyết)** |
|---|---|---|
| Home bento | `/` | **Tổng quan** |
| `Dashboard.tsx` overlay, tab đầu | mở từ nút *Chi tiết* | **Bảng chi tiết** |
| Trang một dự án | `/projects/[id]/overview` | **Dự án này** |

**Vì sao T quyết chứ không hỏi**: Hoà chốt 16/08 *"Home đổi ngữ nghĩa thành tổng quan dự án"* ⇒
tên **Tổng quan** thuộc về Home, hai mặt kia phải nhường. Đây là **đổi NHÃN, không đổi route**
— Hoà lật lại sau tốn đúng một dòng, nên không đáng chặn cả cụm để chờ.
⚠️ **Route giữ nguyên** `/projects/[id]/overview` — đổi route là vỡ deep-link.

## 3 · FILES — HAI TẦNG KHÁC CHỨC NĂNG (Hoà đưa mock 17/08 tối · thay bản "hai ngăn")

> 🔴 **Bản "hai NGĂN dự án ↔ phần thô"** (chốt sáng 17/08, V2 đã dựng) **hết hiệu lực** — bố cục
> Hoà đưa chiều tối là **hai TẦNG khác chức năng** trong cùng một route `/files`. Logic "phần thô"
> KHÔNG mất — nó gộp vào thư mục **"Nhà cung cấp"** ở tầng ①.

### Tầng ① · THƯ MỤC HỆ THỐNG (có QUYỀN)
5 thư mục cấp studio, mỗi thư mục 1 loại quyền truy cập:
| Thư mục | Vai | Quyền |
|---|---|---|
| **Dự án** | tệp theo từng dự án | Theo dự án |
| **Studio dùng chung** | dùng khắp studio | Toàn studio |
| **Nhà cung cấp** | map texture · NCC · **range giá** (thay ngăn "phần thô" cũ) | Biên tập giới hạn |
| **Đã duyệt** | nội dung đã qua Review Gate | Chỉ đọc |
| **Lưu trữ** | kho lạnh | Quản trị viên |

### Tầng ② · COLLECTION+ (kho nguồn của IF, chưng cất → dự án)
8 gói component, mã `COL-<LOẠI>-NNN`, tổ chức theo LOẠI VẬT (không theo chặng):
Vật liệu · Furniture · Chi tiết điển hình · Cây · người · Design DNA · Gói học từ dự án · Mẫu trình bày · Cách làm.
Bộ lọc: Loại · Nguồn · Trạng thái · Cập nhật. Quyền: Cá nhân · Chia sẻ nhóm · Studio.

**Vì sao KHÔNG tách route** (T tư vấn 17/08, Hoà uỷ quyền):
1. Bản đồ §5 dòng chảy VẬT không đổi — Collection+ là **cách TỔ CHỨC của Files**, không phải mắt xích thứ ba.
2. Rail cụm XƯỞNG đã 5 mục cân đối — thêm nữa là nhồi.
3. Kệ Thư viện chia THEO CHẶNG (`lib/library/shelves.ts`), Collection+ chia THEO LOẠI VẬT — **khác trục**, không cạnh tranh.

Files scroll dọc — tầng ② nối tiếp tầng ①. Có nút "Đến Collection+" ở đầu trang (jump link).

## 4 · THƯ VIỆN — một cái duy nhất, chia KỆ

Kệ: **Vật liệu** · **Cấu kiện** · **Ảnh & tài sản** (Gallery là mặt tuyển chọn của kệ này) ·
**Mẫu & hồ sơ** · **Node**.
**Màu là một BƯỚC bên trong chọn vật liệu**, không phải kệ, không phải mục rail.
Thư viện **hiểu ngữ cảnh và đề xuất đúng** — không phải kho để đi tìm (bản đồ §11).

## 5 · BA NẤC = BA CÔNG NĂNG (bản đồ §7) — cửa nghiệm thu hai vế

| Nấc | Câu hỏi nó trả lời | Thêm gì so với nấc dưới |
|---|---|---|
| **28** | *tôi đang ở đâu* | — (định vị bằng vị trí + hình) |
| **240** | *tôi đi đâu được* | **CHỮ** |
| **320** | *ở đó đang có gì* | **HÌNH**, hoặc **tình trạng** nếu không có hình |

⛔ **Mục nào không có gì để nhìn thì BỎ nấc 320** — Cài đặt là ví dụ. Ba nấc là **nhịp**, không phải **hạn ngạch**.
Cửa nghiệm thu: ① che nấc to → nấc nhỏ vẫn đứng một mình ② nấc to phải có thứ nấc nhỏ **không thể** có.
📏 Nấc-hình có ngưỡng đo được: **141px đã bị đo là quá nhỏ để phân biệt vân sồi với óc chó**.

## 6 · RÀNG BUỘC CHUNG cho mọi phiên trong cụm

1. **Thu/mở phải NHỚ giữa các phiên làm việc.** Cấm auto-hide (bị chửi nhất ở cả 4 app đã khảo).
2. **Sidebar KHÔNG BAO GIỜ đổi nội dung theo chặng** — nó là bản đồ (bản đồ §2).
3. **Thanh công cụ KHÔNG BAO GIỜ chứa lối đi.**
4. Nấc và cỡ kéo tay lưu **THEO MÁY**, không vào `.idf` (bản đồ §9).
5. 🔴 **CẤM đụng `--accent*` và cấm thêm token màu** — Hoà chưa chốt màu nhấn thứ hai.
6. Kéo-thả phải làm được **bằng bàn phím** (chọn → mũi tên → Enter).
7. Chữ theo **từ điển máy** — `npm run soi:tu-dien` không thêm lệch mới.

## 7 · ĐO HIỆN TRẠNG 17/08 — đừng tin sổ, đây là số thật

| Đo | Kết quả |
|---|---|
| Component rail/sidebar | **KHÔNG CÓ** — `grep '/materials'` toàn repo ra đúng 2 chỗ (màn cài đặt, lỗi BOQ) |
| `/colors` | **vẫn là route riêng** `app/colors/page.tsx` |
| Chat · Họp | có API `app/api/chat/route.ts`, **không có trang** |
| `mock-kich-ban-sidebar.html` | còn **Kho vật liệu 13 lần · Bảng màu 9 lần** ⇒ **dựng lại, không vá** |
| Route cấp app | 8 · Route cấp dự án | 6 |

## 8 · CHIA VIỆC — hai phiên SONG SONG, vùng tệp RỜI NHAU

| Phiên | Vùng ghi | Làm gì |
|---|---|---|
| **V1 · vỏ điều hướng** | `components/nav/**` (mới) · `components/studio/AppShell.tsx` · mock sidebar | rail **ba cụm** (đã nới từ hai theo chốt 20/08), ba nấc **52/240/320–440 kéo được**, thu/mở nhớ được, mờ-kèm-lý-do cho cụm dự án |
| **V2 · hai ngăn & kệ** | `app/files/**` · `components/library/**` · `app/colors/**` · mock Files + Thư viện | Files hai ngăn · Thư viện chia kệ · màu thành bước trong chọn vật liệu |

**Cả hai đọc file này làm nguồn.** Chạm biên ngoài vùng ⇒ **DỪNG, báo T**, không tự quyết —
đó đúng là chỗ hai phiên sẽ đẻ ra hai cấu trúc.
