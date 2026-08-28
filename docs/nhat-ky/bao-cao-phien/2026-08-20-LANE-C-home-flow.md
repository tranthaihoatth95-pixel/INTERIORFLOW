# LANE C — UX/UI + Product flow (Home) · 20/08 night shift

Mốc: `c7f3ac8` (main). Vùng ghi: `components/home/**`. Server dùng lại :3001 (KHÔNG đẻ server mới).

---

## ⓪ TIỀN ĐỀ — đo lại, không đoán

| Giả định của phiếu | Đo được | Kết luận |
|---|---|---|
| `DongStudioHome.tsx` = Home LIVE | ✅ mount qua `HomeScreen.tsx:567` | đúng |
| `HomeScreen.tsx` cũng tồn tại — đo cái nào mount | **CẢ HAI đều mount**, không phải chọn một: `app/page.tsx:17` + `app/projects/[id]/render/page.tsx:23` mount `HomeScreen` (vỏ route + gate đăng nhập); `HomeScreen` mount `DongStudioHome` (lưới bento). | phiếu ngầm hiểu "một trong hai" — **sai**; sửa bento phải vào `DongStudioHome` |
| `ResumeWork` LIVE, bấm nhảy đúng route | ✅ verify browser (xem ④) | đúng |
| `/api/home/summary` có `recentProjects`? | ✅ **CÓ SẴN** (`route.ts` → `pickRecentProjects(flows, projects, 6)`) — không phải bịa API mới | đúng |
| Task/`/api/tasks` có thật | ✅ `summary.upcoming` + `openTasksByProject` đọc `prisma.task` thật | đúng |

⓪b `git rev-list --count HEAD..main` = 0. ~163 file dirty của phiên song song — KHÔNG revert hunk của ai.

---

## ① LOOK INSIDE — Home trả lời được 3 câu chưa? (đo TRƯỚC khi sửa)

Đo trên app thật, 1280×720, đã đăng nhập.

| Câu | Trước | Bằng chứng |
|---|---|---|
| (a) tôi đang ở đâu | ✅ **có** | rail "Tổng quan" active; ô 02 "Chào Hoa · Thứ Năm, 20/08" |
| (b) làm gì tiếp | 🟡 **có nội dung, nhưng ô cạnh nó bị nghiến** | ô "Việc đang dở" hiện `Nháp · Thiết kế 2D · hôm nay · Mở lại →` |
| (c) CTA chính | ✅ **có** | ô 01 Dự án: card "+ Dự án mới" + 2 dự án thật + ngăn Nháp 15 |

### 🔴 LỖI THẬT BẮT ĐƯỢC — "Ghi chú nhanh" bị nghiến còn 12,3px

Đo bằng `getBoundingClientRect` trên app thật, KHÔNG suy từ mã:

```
ô lưới (col 4/8, row 3/4)          h = 156px
  └ stack 'auto minmax(0,1fr)'     rows = "136px  12.2969px"
      ├ ResumeWork  (hàng auto)    h = 136px
      └ QuickNotes  (hàng 1fr)     h =  12px   ← card
          └ input                  h =  33px   ← TRÀN RA NGOÀI card 21px
```

**Gốc bệnh**: R5 (19/08) mount `ResumeWork` chồng lên `QuickNotes` trong MỘT ô cao 156px, hàng trên
để `auto` ⇒ nó lấy trọn 136px chiều cao nội dung; hàng dưới `minmax(0,1fr)` **cho phép co về 0** nên
không có sàn nào chặn. Hệ quả: ô nhập ghi chú vẽ đè ra ngoài card, **danh sách ghi chú biến mất hoàn
toàn**. Đây là widget LUÔN SỐNG (không tự ẩn được) nên lỗi hiện thường trực.

Đúng loại lỗi 5 máy soi không bắt được: tsc xanh, test xanh, không lệch nhãn/hình-học/sổ — chỉ lộ khi
**đo hộp thật trên app**.

---

## ② SỬA GÌ — `components/home/DongStudioHome.tsx` (1 file)

**Không rebuild Home. Không thêm widget mới. Không đụng `bento-layout.ts` (256 ca test).**

1. **Bố cục `bento` — tách CẠNH NHAU thay vì chồng.** Ô Ghi chú vốn đã hấp thụ cột của E/G khi chúng
   rỗng (`fAreaLeft`). Khi bề ngang ≥ 4 cột thì hai widget đứng cạnh nhau, mỗi cái lấy TRỌN 156px
   chiều cao — thay vì chia nhau chiều cao của một ô. Ghi chú giữ phần rộng hơn/bằng (nó có danh sách
   + ô nhập). `fSpan` 4→2/2 · 5→3/2 · 7→4/3.
2. **Đường lùi (còn 2 cột, tức E và G đều sống — không đủ chỗ tách): sàn + cuộn.** Hàng dưới đổi
   `minmax(0,1fr)` → **`minmax(96px,1fr)`** (đủ tiêu đề + ô nhập + 1 dòng ghi chú) và ngăn chồng thêm
   `overflow-y-auto`. Quá chật thì người dùng **cuộn**, không widget nào bị nghiến mất chức năng.
   Đường lùi này dùng chung cho cả 3 bố cục còn lại (vừa · mỏng · xếp-dọc).

Không đụng: `--accent*`/`globals.css` · `app/api/**` · `lib/resume.ts` (chỉ đọc) · lưới 12 cột ·
số ô (`ResumeWork` CỐ Ý không mang `index`, giữ nguyên theo R5).

---

## ③ CÁI GÌ CỐ Ý **KHÔNG** LÀM — và vì sao

| Phiếu gợi ý | Quyết định | Lý do đo được |
|---|---|---|
| Widget "Recent projects" | ⛔ **KHÔNG thêm** | `summary.recentProjects` đã là NGUỒN của ô 01 Dự án (ProjectSelect liệt kê đúng danh sách đó, có tìm kiếm + ngăn Nháp). Thêm widget nữa = **hai mặt tiền cho một dữ liệu** — đúng lỗi #4 "khử trùng sự kiện" mà `widgets/types.ts` đã ghi làm luật sau khi trả giá một lần. |
| CTA quick start → `/files` / Thư viện | ⛔ **KHÔNG thêm** | Rail cụm XƯỞNG **đã có** `Files` + `Thư viện` thường trực ở mọi màn (đo trên DOM). Thêm nút ở Home = vật thừa, trái chốt 16/08 "bỏ pill riêng, một vật một chỗ". |
| Sửa nhãn "Chat · Họp" | ⛔ ngoài vùng ghi | Rail sống ở `components/studio/**`. Và nó **đã đúng luật rồi**: mờ + lý do thật *"Chưa có trang — phần này đang dựng"* — không phải nút giả. |
| Ô "Sắp tới" đang không hiện | ✅ **đúng, không phải lỗi** | `upcomingHasSignal` = false vì 0 Task có hạn (Biểu đồ chặng xác nhận `2/0` — 2 dự án, 0 việc mở). Widget thiếu dữ liệu **tự ẩn**, đúng luật 13/08. Không bịa số. |

---

## ④ NGHIỆM THU

**tsc** — `npx tsc --noEmit`: 3 lỗi, **cả 3 ở `app/api/project-files/**`** (`kiemDelegate` không export ·
role `'editor'`), là file đang dở của Lane B, **0 lỗi trong `components/home`**. Không đụng vào.

**Test targeted** — cả hai suite chạm file có test đều xanh:
`bento-layout.test.ts` → **30 ok · 0 fail** · `resume-card.test.ts` → **29 pass · 0 fail**.

**Browser thật (:3001, tab-6)** — số đo hộp trước/sau:

| | TRƯỚC | SAU |
|---|---|---|
| ô Ghi chú (card) | **12,3px** ← vỡ | **156px** ✅ |
| ô nhập ghi chú | 33px, tràn ra ngoài card | 33px, nằm trong card ✅ |
| ô Việc đang dở | 136px (chồng trên) | 156px, **ô riêng** ✅ |
| cột lưới | `4/8` chung một ô | Ghi chú `4/6` · Việc đang dở `6/8` ✅ |

**CTA thật, không phải nút giả** — bấm "Mở lại →":
`aria-label="Mở lại Nháp ở Thiết kế 2D, hôm nay"` → `location.pathname` = `/projects/cmsl4b5ux0001w9jlrgo2q41t/cad`.
Route khớp đúng chặng mà nhãn hứa.

**Đường lùi verify SỐNG** (không phải suy luận) — nạp lại ở 900px để React lấy đúng `isWide`:
```
rows = "136px 96px"   overflowY = auto   boxH = 220   scrollH = 240   scrollable = true
ô nhập = 33px trong card 96px  → dùng được
```
Sàn 96px giữ đúng, và khi tổng vượt khung thì **cuộn** chứ không nghiến.

---

## ⑤ 3 CÂU HỎI MỤC ① — SAU KHI SỬA

(a) ở đâu → rail active + lời chào có ngày · (b) làm gì tiếp → "Việc đang dở" **đứng nguyên ô riêng,
đọc được, bấm ra đúng route** · (c) CTA → ô 01 Dự án + "+ Dự án mới". Cả ba trả lời được, và ô luôn-sống
cạnh nó **không còn bị nghiến**.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo Chromium**, 2 khổ (1280×720 · 900×800). Safari/Firefox là **suy**, chưa mở.
- **Nhánh `notesStack` ở bố cục `vừa` và `mỏng` chưa chạy mắt** — máy Hoà đang ở nấc `bento` (4/6 ô phụ
  sống). Suy từ số: `vừa` ~340px và `mỏng` ~220px đều ≥ sàn 96px nên an toàn, nhưng **chưa nhìn thật**.
- **Nhánh tách 5 cột (`fSpan=5`, tức chỉ G sống) và 7 cột (E và G đều rỗng) chưa dựng được trên máy này**
  — chỉ ca `fSpan=4` có dữ liệu thật. Hai ca kia là **suy từ công thức**, chưa có ảnh.
- Ca đường-lùi thật (`hasE && hasG`, span 2) **chưa tái hiện được ở bố cục bento** vì cần Task có hạn;
  tôi verify cùng đoạn mã đó qua bố cục xếp-dọc thay thế. Không tạo Task giả để tránh bẩn dữ liệu Hoà.
- **Chưa thử trình đọc màn hình** thật. `aria-label` của ResumeWork đọc đủ 3 mẩu tin (đã có sẵn từ R5).
- Ô nhập ghi chú ở nhánh tách chỉ còn **76px bề ngang** (ô 2 cột, nút "Lưu" chiếm phần còn lại) — chữ
  gợi ý bị cắt ("Gõ ghi c…"). **Dùng được nhưng chật**; đây là đánh đổi có ý thức so với 12px chiều cao.
  Nếu Hoà thấy chật, hướng sửa rẻ nhất là cho nút "Lưu" thu thành icon khi ô < 200px — **chưa làm**.

## ⑦c HẠN DÙNG KẾT LUẬN

- Mọi con số hộp đo ở **1280×720, dữ liệu máy Hoà 20/08** (2 dự án · 0 việc mở · 4/6 ô phụ sống).
  Dữ liệu dày lên (có Task có hạn ⇒ `hasG` bật) thì bố cục đổi nhánh — **số đo hết hiệu lực, đo lại**.
- Kết luận "3 lỗi tsc không phải của tôi" đúng **tại mốc `c7f3ac8` + working tree tối 20/08**; Lane B
  commit xong thì kiểm lại.
- Quyết định "không thêm CTA tới /files" phụ thuộc **rail còn giữ Files + Thư viện**. Rail đổi cấu trúc
  (4 kịch bản sidebar đang chờ Hoà chọn) thì **mở lại quyết định này**.
