# IF · BIÊN NHẬN NĂNG LỰC — cái gì THẬT SỰ có, đã xác minh

`Plane: BOS` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`

Đo ngày **23/08/2026**. Mọi dòng dưới đây đã CHẠY THỬ, không phải đọc khai báo.

> ⛔ **LUẬT**: **CHỜ ĐỢI CÓ MÀ CHƯA XÁC MINH ⇒ COI LÀ KHÔNG CÓ.**
> Cấm âm thầm thay một năng lực thiếu bằng suy luận chung chung — đó là cách tạo ra
> báo cáo nghe như đã kiểm mà chưa kiểm gì.

## 1 · SKILL DỰ ÁN — `.claude/skills/`

> ✅ **ĐÃ TRACKED 24/08** — commit `b81dd88`. Trước đó `.gitignore` chặn cả `.claude/` ⇒ 72 tệp
> durable memory **chỉ sống trên MỘT máy**; đổi máy hoặc dọn cây là mất trắng.
> Cửa mở hẹp nhất: `.claude/*` chặn tất cả → `!.claude/skills/` mở một thư mục →
> `.claude/skills/**` chặn lại bên trong → chỉ `!.claude/skills/**/*.md` được nhận.
> ⇒ Bỏ binary/secret/cache vào skills thì git **vẫn chặn**. Kiểm hai chiều bằng `git check-ignore -v`.
| Tên | Vai | Xác minh bằng | Trạng thái |
|---|---|---|---|
| `if-design` | bộ **ĐỊNH TUYẾN** thiết kế (110 dòng) → 61 tệp trường | `ls` + `soi:design-school` 0 mồ côi | ✅ |
| `if-design-review` | trọng tài **CHẤM ĐỘC LẬP**, 23 trục, PASS/PARTIAL/FAIL | đã chạy thật lên Trang chủ → FAIL, 9 phát hiện | ✅ |
| `if-ui-convergence` | đưa MỘT bề mặt đi trọn 17 bước tới hội tụ | `ls` — **CHƯA chạy trọn một bề mặt lần nào** | 🟡 chưa hiệu chuẩn |
| `if-handoff` | bàn giao phiên an toàn | `ls` — chưa dùng thật | 🟡 chưa hiệu chuẩn |
| `if-audit` | audit có mục tiêu, phân loại 7 nhãn | (lane đang dựng) | 🟡 |

## 2 · SKILL NGƯỜI DÙNG — `~/.claude/skills/`
`dinh-huong-thiet-ke` · `frontend-design` · `du-toan-noi-that` · `render-ai` · `webapp-testing`
✅ **tồn tại thật** (đã `ls`). ⚠️ **Chưa gọi cái nào trong phiên này** ⇒ chưa xác minh nội dung có hợp IF không. Coi là **CÓ MẶT, CHƯA HIỆU CHUẨN**.

## 3 · MÁY SOI — đã chạy từng cái
| Lệnh | Exit | Nghĩa |
|---|---|---|
| `soi:frontier` `soi:tu-dien` `soi:hinh-hoc` `soi:contract` `soi:that` `soi:cam-dien` `soi:visual-source` `soi:design-school` | 0 | sạch |
| `soi:thao-tac` | **1** | nợ cũ (focus-visible · hex thô) |
| `soi:foundation` | **1** | 1.173 vi phạm nền — **nhưng không cái nào là lý do Trang chủ trượt** (xem M-01) |

⭐ Hai máy có **LUẬT TỰ CHỨNG MINH**: `soi:foundation` (ứng viên = 0 ⇒ **mã thoát 2 = PHÉP ĐO HỎNG**, khác hẳn 1 = có vi phạm) và `soi:design-school` (canh **hai chiều**: con trỏ chết **và** tệp mồ côi).

## 4 · CLAUDE DESIGN / DesignSync
✅ **NỐI ĐƯỢC, đã đọc thật**. Project `b7dc14ba-1752-4821-8fc7-d519f737ac09`, `canEdit: true`, 62 tệp.
⚠️ **Chỉ MAIN có DesignSync.** Phiên phụ **KHÔNG** có (`ToolSearch select:DesignSync` → không tìm thấy, đã kiểm hai lần) ⇒ phiên phụ dựng mock vào `docs/mocks/`, **MAIN đẩy lên** lúc audit.
Thao tác: gắn `<!-- @dsCard group="..." -->` dòng đầu → `finalize_plan` (bắt buộc có cả `writes` LẪN `deletes`) → `write_files` bằng `localPath`.

## 5 · KIỂM THỊ GIÁC
| | Trạng thái |
|---|---|
| **playwright** | ✅ có (`node_modules/.bin/playwright`), đã chụp thật nhiều lần |
| **Browser pane** (`mcp__Claude_Browser__*`) | ✅ chạy được. ⚠️ `computer zoom` **crop không hỗ trợ** — trả về ảnh cả màn |
| **screencapture** cửa sổ Electron | ❌ **KHÔNG DÙNG ĐƯỢC** — `could not create image from display`, máy chưa cấp quyền quay màn hình |
| **Ảnh sau đăng nhập** | 🔴 **CHẶN NGƯỜI THẬT — cần MẬT KHẨU do người giữ.** Đo tại nguồn:
`scripts/chup-man-duyet-mat.mjs:38-39` đọc `IF_EMAIL` + `IF_PASSWORD` từ biến môi trường; `:161`
chỉ đăng nhập khi **có cả hai**. Agent **không được tự nhập mật khẩu** — chính docstring của script
ghi thế. Không phải "chỉ cần ai đó bấm". |

## 6 · BUILD / TEST / RUNTIME
`npx tsc --noEmit` ✅ · `npm test` ✅ · `npm run dev:electron` ✅ (có guard danh tính nguồn + canh main/preload)
`/api/dev-identity` ✅ — khai `cwd`+`HEAD`+`pid` của **chính tiến trình phục vụ**; đây là cách duy nhất trả lời *"cổng này phục vụ MÃ NÀO"*.
🔴 **Docstring của route đó ghi ba cổng CŨ** (`:3000 · :3777 · :3778`) — cổng mã-hiện-tại nay là **`:3799`**. Sửa khi tiện; đừng tin số trong docstring đó.

## 7 · AGENT
`Agent` (nền, nhiều lane song song) ✅ · `SendMessage` sang lane đang chạy ✅ (đã dùng để sửa phiếu giữa lượt) · `ListAgents` ✅.
⚠️ **Quyền hạn KHÔNG đi kèm tin nhắn** — cấm nhờ phiên khác làm thứ phiên này bị chặn.

## 8 · KHÔNG CÓ / CHƯA XÁC MINH — nói thẳng
- ❌ `INTERIORFLOW-AGENT-CONTINUITY-PACK-2026-08-23.md` và `INTERIORFLOW-AUDIT-MEMORY-2026-08-23.md` — chủ dự án nói đã cấp, **không có trong repo, không có trong chat**. Trí nhớ này chưng cất từ nguồn thật thay thế.
- ❌ Quyền quay màn hình.
- 🟡 5 skill người dùng: có mặt, chưa hiệu chuẩn.
- 🟡 3 skill quy trình mới: có mặt, chưa chạy trọn lần nào.

---

## 9 · LỆNH CHỤP ẢNH SAU ĐĂNG NHẬP — đo lại 23/08 23:17

> ⚠️ **Mục này TỪNG SAI.** Bản trước khai *"cờ `--dang-nhap` script không nhận"* — **SAI**, và
> bản "đúng" nó đưa ra lại là đường **kém an toàn hơn** (mật khẩu nằm trên dòng lệnh ⇒ vào lịch sử
> gõ). Giữ lại vết này vì nó đúng loại lỗi mục này sinh ra để chặn: **một phép sửa chưa đo cũng là
> một khai báo chưa đo.** Luật ở đầu tệp
> (*chờ đợi có mà chưa xác minh ⇒ coi là không có*) áp cho **chính tệp này**.

**HAI ĐƯỜNG, cả hai đều CẦN NGƯỜI. Đọc tại nguồn, không nhớ hộ:**

| | Lối 1 — **ưu tiên** | Lối 2 |
|---|---|---|
| Cách | `--dang-nhap` mở cửa sổ thật, Hoà gõ vào **đúng ô đăng nhập của app** | `IF_EMAIL`+`IF_PASSWORD` → POST `/api/auth/login` |
| Mã | `:103` nhận cờ · `:145-154` hồ sơ bền `~/.if-phien-chup-man` | `:37-39` đọc biến · `:160-168` chỉ chạy khi **có cả hai** |
| Mật khẩu | **không bao giờ** lên dòng lệnh | **lên dòng lệnh** ⇒ vào lịch sử gõ |

✅ **Cờ `--dang-nhap` CÓ THẬT** — `scripts/chup-man-duyet-mat.mjs:103`. Chính guard của script
(`:187`) khi gặp màn khoá cũng bảo dùng cờ này. Docstring script nói thẳng vì sao ưu tiên Lối 1:
*"Hoà gõ mật khẩu MỘT LẦN vào đúng ô đăng nhập của app, không bao giờ phải đặt nó vào dòng lệnh."*

**Lệnh đúng — hai bước, mật khẩu không bao giờ lên dòng lệnh:**

```bash
# ① một lần: cửa sổ mở ra, Hoà đăng nhập tay, xong thì ĐÓNG CỬA SỔ
IF_URL=http://127.0.0.1:3799 node scripts/chup-man-duyet-mat.mjs --dang-nhap

# ② sau đó: máy tự chụp, không cần mật khẩu nữa
IF_URL=http://127.0.0.1:3799 node scripts/chup-man-duyet-mat.mjs
```

`IF_LOC=1` chụp 4/24 khung để thử nhanh · `IF_OUT=<đường dẫn>` đổi thư mục ra.

### Đã ĐO được (23/08 23:17)
- ✅ Cờ `--dang-nhap` tồn tại và có nhánh xử lý riêng — **đọc mã**.
- ✅ `IF_URL` mặc định `http://localhost:3000` (`:37`) — cổng đó **đã chết** ⇒ **luôn truyền `IF_URL`**.
- ✅ `:3799` sống lúc đo (`/login` · `/api/dev-identity` · `/` đều 200).
- ✅ Thư mục Drive đích giải được (`thuMucDrive()` `:46-51` thấy `GoogleDrive-…`).
- 🔴 **Hồ sơ `~/.if-phien-chup-man` CÓ TỒN TẠI nhưng PHIÊN ĐÃ HẾT HẠN.** Chạy thật Lối 2-không-mật-khẩu
  ⇒ script dừng ở màn khoá, **0 ảnh**. ⇒ Hồ sơ có sẵn **không** có nghĩa là đã đăng nhập.

### `UNVERIFIED` — coi như KHÔNG CÓ cho tới khi chạy được
- 🟡 **Chụp sau đăng nhập đầu-cuối:** `UNVERIFIED`. Chưa lối nào chạy trọn tới ra ảnh trong phiên này.
  Cho tới khi có ảnh thật: **mọi lượt chấm Trang chủ trần cứng là PARTIAL** (M-01), cấm PASS.
- 🟡 **Phiên còn sống được bao lâu sau `--dang-nhap`:** `UNVERIFIED`. Không đo được vòng đời cookie
  ⇒ đừng hứa "đăng nhập một lần là xong mãi"; hết hạn thì lặp lại bước ①.
- 🟡 **Lối 2:** `UNVERIFIED` trên máy này — chưa từng chạy có mật khẩu thật.

### 🔴 BẪY còn sống trong chính script
Guard `:187` in ra lệnh gợi ý **thiếu `IF_URL=`** ⇒ ai chép nguyên văn sẽ nối vào `:3000` đã chết,
rồi tưởng mình làm sai. **Chưa sửa** (ngoài phạm vi đợt này) — nêu ở đây để không mất thêm một lượt.
