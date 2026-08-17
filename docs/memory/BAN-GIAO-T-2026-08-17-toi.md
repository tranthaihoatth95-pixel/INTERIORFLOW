# BÀN GIAO — phiên T 17/08 (tối), đợt A + Kho ghi nhớ + Files hai tầng + Đợt C dashboard

> Đọc trước: `docs/TAC-NHAN-T.md` (vai) · `docs/memory/BAN-GIAO-T-2026-08-17-chieu.md` (phần chiều)
> · `docs/IF-KIEN-TRUC.md` (bản đồ) · `docs/hoa-noi/SO-TONG.md` (kho Hoà nói vừa dựng).
> Phiên này **auto, chạy dài** — Hoà cho ủy quyền. Van an toàn cột chặt suốt phiên.

---

## §1 · MÔ HÌNH LÀM VIỆC PHIÊN NÀY

Hoà nói: *"phương án tối ưu nhất, tôi cần nhanh, auto. chạy dài xong hết, tôi chỉ duyệt cuối."*
⇒ T điều phối chuỗi phiên phụ, tự audit, tự commit theo path, KHÔNG push origin. Van an toàn:

- Ô ⓪ mỗi phiếu · agent có quyền BÁC → DỪNG (đã dùng thật hôm nay)
- ⑥b đích + trần 5 vòng
- Không `git add -A` khi phiên khác chạy (bài học 16/08 — code lọt commit nhãn *docs*)
- Không đụng `--accent*` · không thêm token màu (Hoà chưa chốt màu nhấn thứ 2)
- Không xoá worktree · không lệnh cần mật khẩu (đưa Hoà chạy tay)
- Không nhắn phiên khác chạy hộ việc bị Hoà chặn (luật SendMessage vừa ghi 10ce7c2)

## §2 · CHỐT MỚI TRONG LƯỢT NÀY (5 chốt)

**Files từ HAI NGĂN → HAI TẦNG.** Hoà đưa mock chiều tối: Tầng ① thư mục hệ thống 5 loại có quyền
(Dự án · Studio dùng chung · NCC · Đã duyệt · Lưu trữ) + Tầng ② **Collection+** 8 nhóm (mã
`COL-XXX-NNN`, chưng cất → Thư viện). Bản "hai NGĂN dự án ↔ phần thô" chốt sáng 17/08 **hết hiệu lực**;
logic phần thô gộp vào thư mục "Nhà cung cấp". Đã cập nhật `HOP-DONG §3` + `IF-KIEN-TRUC §5`.

**T tư vấn KHÔNG tách route Collection+.** Hoà uỷ quyền *"soi toàn app, check đồng bộ rồi tư vấn"*.
Ba lý do đo được: ① dòng chảy VẬT §5 không đổi ② rail cụm XƯỞNG đã 5 mục cân đối ③ kệ Thư viện chia
THEO CHẶNG (`lib/library/shelves.ts`), Collection+ chia THEO LOẠI VẬT — **khác trục, không cạnh tranh**.

**Collection+ mở TẦNG THỨ HAI của DistillEngine.** Trước chỉ chạy cấp dự án (Thẻ DNA · Grounded
Render · Cửa sổ Thảo Luận). Nay có cấp studio. **Mặt tiền thứ 6** của cỗ máy chưng cất.

**Kho Hoà nói (`docs/hoa-noi/`)** — cơ chế Hoà nạp ý, T đọc, chống trôi. Thay cho việc T tự chưng cất
(đã sai nhiều lần). Artifact có dedup Jaccard + phân họ 16 nhãn.

**`SendMessage` giữa phiên** — dùng được cho: hỏi phiên khác đang đụng file gì · chia việc không cần
worktree · nhờ kiểm chứng chéo. **Ràng buộc cứng**: quyền hạn KHÔNG đi kèm tin nhắn — bị Hoà chặn
thì KHÔNG được nhắn phiên kia chạy hộ.

## §3 · CODE ĐÃ SHIP (16 commit chiều-tối, HEAD `ae1a208`)

### Đợt A (song song 4 phiên, vùng file rời)
| Phiên | Ship |
|---|---|
| **COLLAB-LOI** | `lib/distill/types.ts` mở union 3 kind (`sticky`/`form`/`asset`); `distillDnaFromSources()` cho cửa Thảo Luận; +41 assertion (71 pass) |
| **COLLAB-VO** | `components/collab/` (5 file: CuaSoThaoLuan · BangSoCucForm · BaHoiStorylineForm · feature-flags · tao-nguon-chung-cat + test); **flip cờ live** khi LOI ship |
| **DONG-GO** | Gỡ `#c79a63` khỏi `components/entry/` (4 hex → `var(--accent)`); còn 18 shade đồng khác trong `cardFaces.tsx` chưa dọn — nợ nếu Hoà chốt bỏ HẲN dải đồng |
| **WT-CHOT** | Chốt MỘT đường `.claude/worktrees/`; gỡ pattern `interiorflow-wt-*` khỏi CLAUDE.md; gỡ entry p3mock launch.json |

### `soi:cam-dien` — máy canh "engine đã tới tay người dùng chưa"
Đo 94 module: **85 sống · 7 nội bộ · 3 kho chưa mở** (3.709 dòng). 4 entry frontier ✅ nhưng
CHƯA CẮM ĐIỆN (`chuan-net-3d` · `wireframe-dinh-bien-dien` · `part-lock-cau-kien` · `mirror-doi-xung-chuan-net`
— cả 4 nằm trong `lib/idfc-import`).

### Đợt C (song song 2 phiên, sửa Home)
- **P-ROUTER-HOME**: wrap `<DongStudioHome>` bằng `<AppShell active="home">` → rail 11 mục
  (5 XƯỞNG có href · 6 DỰ ÁN mờ kèm lý do khi chưa mở dự án)
- **P-DASHBOARD-DS**: `GLASS_SHELL` const dùng chung ở `WidgetCard` → **10 widget tự có kính lỏng**
  qua wallpaper. Token `--nen-mo-card` · `--vien-mo` · `--blur-strong` · `--shadow-node` · `--r-3`.
  **0 hex mới, 0 token mới**, không đẻ hệ kính thứ hai. backdrop-filter 11 chỗ.

### Cơ chế
- `docs/hoa-noi/` (README + SO-TONG) — kho Hoà nói, T đọc đầu phiên
- Artifact **Kho Hoà nói** `c369a03d` — Hoà gõ ý + thả ảnh, dedup Jaccard
- Artifact **Khung duyệt mắt** `4743d70a` — 37 ảnh (24 app + 13 mock, có mock Files hai tầng + Collab Ca D)

## §4 · ĐO ĐƯỢC — dùng lại, không đo lại

| Mảnh | Kết quả |
|---|---|
| `components/entry/LoginScreen.tsx` | **MÃ CHẾT** — 0 nơi import (đóng dấu ⛔ trong file, đừng sửa nó) |
| Files v2 "hai ngăn" | 🔴 **bố cục Hoà bác 17/08 tối** — build lại thành hai TẦNG khi Hoà duyệt mock |
| Mock `mock-files-hai-tang.html` | ✅ đã đẩy Design + Khung duyệt mắt — 2 skill design không lỗi chặn, 11/11 tương phản ≥4.5:1 |
| Distill union 4 kind | ✅ COLLAB-LOI ship; `distillDnaFromSources()` sẵn sàng cho cửa Thảo Luận |
| Rail V1 mount | ✅ AppShell mode 'home' đã có, HomeScreen wrap 2 nhánh (welcomeOpen · !stageDone) |
| `app/workhub/` + `components/workhub/` | ⚠️ **283 dòng do phiên Claude KHÁC dựng**, chưa commit — không biết là gì, để nguyên |
| Server dev port 3000 | Tôi khởi qua preview_start · nếu chunk hỏng thì stop + start lại (autoPort) |

## §5 · 🔴 CẢNH BÁO CHO PHIÊN SAU

**① Auto-hide toolbar — xung đột luật SPEC-PANEL-ROLLOUT §2f.** Hoà bỏ qua câu T hỏi lật.
Bám khuôn ⑤: T ĐỀ XUẤT **thu về dải mỏng có nhãn** (không hide hẳn), Hoà bấm nếu khác.

**② Vitals "trên thanh tìm" — nghĩa gì?** Ba khả năng (đầu ô · phía trên · overlay). T đề xuất
**đầu ô bên phải** (đối xứng kính lúp bên trái). Chưa Hoà xác nhận.

**③ 18 shade đồng khác trong `cardFaces.tsx` chưa dọn.** DONG-GO chỉ gỡ hex chủ `#c79a63`. Nếu Hoà
muốn bỏ HẲN dải đồng (không chỉ hex chủ) thì phóng phiếu con.

**④ Auto hide + Vitals + Toolbar nổi — 3 yêu cầu trong một message Hoà, có ảnh kèm tôi CHƯA thấy**
("minhaf đã gửi" = "mình đã gửi" typo hoặc chưa upload). Nếu Hoà gửi lại ảnh, đọc luật §4 nói-chuyện-
bằng-hình rồi đo trên ảnh trước khi dựng.

**⑤ Chat nhóm phải sửa NỀN DỮ LIỆU trước.** `ChatMessage` không có projectId (verify DB: 6 bản ghi
không biết thuộc dự án nào). **Nợ từ 08/08 · chưa xử.** Dựng UI chat trước khi sửa schema = xây trên
cát. Migration Prisma cần Hoà chạy tay theo luật CLAUDE.md.

**⑥ Kho tri thức RỖNG** — `NotebookSource: 0 · NotebookChunk: 0`. Việc thật là *có thứ để nạp*, không
phải xây máy. Chat nhóm là cửa nạp.

**⑦ NT-16 nấc giảm chói kính CHƯA thi hành** — nợ cấp app từ P-DASHBOARD-DS. Ambient inset theme
SÁNG hiện là bóng đen loãng ở đỉnh — chờ Hoà duyệt mắt.

## §6 · CÒN CHỜ HOÀ

1. **Duyệt mắt 37 ảnh** trong [Khung duyệt mắt](https://claude.ai/code/artifact/4743d70a-996c-4640-8d68-1d318faf6787)
2. **Chọn màu mòng két ↔ mận** — cấm thi công gì dính `--accent*`
3. **Chọn ảnh CC0** từ bảng 28 ứng viên Wikimedia Commons (đã đưa)
4. **Duyệt mock Files hai tầng** — sau bấm ✓ mới mở phiếu FILES-HAI-TANG-BUILD
5. **Duyệt mock Collab chặng 3D (Ca D)** — sau bấm ✓ mới ship phiếu 2 (nối cửa sổ vào FlowCanvas)
6. Chạy tay: **`git worktree remove`** 2 worktree rác + **chụp lại `02-04-vat-lieu.png`**
7. Xác nhận **auto-hide** + **vị trí Vitals** (câu ②) — T đã tự chọn nếu Hoà im lặng dài
8. Bấm hướng cho **`app/workhub/`** — dùng tiếp hay xoá

## §7 · CHỖ T LÀM CHƯA TỐT

**Lỗi thứ 14 trong ngày (WT-CHOT bắt)**: T ghi *"pattern interiorflow-wt-* chưa dùng lần nào"* —
đo lại có **57 dòng lịch sử** nhắc pattern. T đọc `CLAUDE.md` hiện tại chứ không grep toàn kho.
Cùng họ lỗi 17/08 sáng (đếm 9 tệp thay 106): **đo bản chiếu thay nguồn**.

**Bảng lỗi tổng ngày 17/08**: 14 lỗi · agent bắt cả 14 · máy soi bắt 0. Ô ⓪ + quyền agent bác T
là cơ chế đắt nhất phiên. Giữ bằng mọi giá.

**Chưa dùng SendMessage lần nào** dù luật vừa ghi. Đây là công cụ mới, cần thử sớm.

## §8 · CHỔ THẢ CÂU CHO PHIÊN SAU

**Cứ đọc `LATEST.md` + `LENH-MO-PHIEN.md` + `IF-KIEN-TRUC.md` như luật hiện có.**
Chạy `soi:frontier` + `soi:cam-dien` + `soi:that` đầu phiên. Ba máy soi mới đắp hôm nay:
- `soi:that` — văn bản ↔ code (vá 17/08)
- `soi:cam-dien` — engine đã tới tay người dùng chưa
- `check:chot` cũ đã vá worktree

**Kho Hoà nói** — mỗi lần Hoà bấm "Sao chép cho T" từ artifact, T commit vào `docs/hoa-noi/SO-TONG.md`.
Đây là chỗ chống trôi mới.
