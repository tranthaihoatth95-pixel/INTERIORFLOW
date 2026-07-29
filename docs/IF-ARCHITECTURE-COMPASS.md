# IF ARCHITECTURE COMPASS — Kiến trúc · Hệ sinh thái .idf · Lệnh giao diện
*(trước gọi `IF-MASTER-BLUEPRINT.md`, đổi tên 28/07 — hết trùng chữ "MASTER" với
`docs/IF-FEATURE-TREE.md`, tránh nhầm vai trò giữa 2 file)*

> **Đây là kim chỉ nam cho KIẾN TRÚC + NGÔN NGỮ HỆ THỐNG.**
> Trạng thái tính năng (đã xong/chưa, bậc N/P/L, cây phụ thuộc) **không còn ở đây** —
> xem **`docs/IF-FEATURE-TREE.md`**, nguồn duy nhất cho việc đó (từ 28/07).
> Ý mới → `IDEAS-BACKLOG.md`, không chen vào cây.
> Cột "Code" do Cowork điền từ code thật (Ben không truy cập repo).

> ⚠️ **Sửa 28/07 (Cowork, Hoà duyệt "tiến hành")**: file này trước có Phần C (cây tính năng) và
> Phần E (Luật Đóng Băng) — cả hai **trùng lặp** với `IF-FEATURE-TREE.md` và dùng CHUNG một sơ đồ
> mã số nhưng mã giống nhau lại chỉ hai nội dung khác nhau (vd mã `2.1.6` = "Checker" ở đây nhưng
> = "Xuất bản & chia sẻ" ở Tree) — rủi ro code nhầm tính năng nếu ai tra mã mà không biết đang đọc
> file nào. Đã gỡ cả hai phần, thay bằng con trỏ sang `IF-FEATURE-TREE.md`. Chi tiết lý do + so sánh
> đầy đủ: `docs/HANDOFF-COWORK-2026-07-28.md`.

---

# PHẦN A · KIẾN TRÚC TỔNG THỂ

## A1. Ba hệ, ba vai

```
   ARCHINOTE 📱              INTERIORFLOW 💻            ATLAS ☁️
   (hiện trường)               (xưởng)                (điểm gặp)
   Capacitor mobile          Electron desktop          Lark Base
   ─────────────             ─────────────             ─────────────
   đo · ảnh · ghi âm         Ý tưởng → CAD →          MATERIAL
   panorama · GPS            Render → Present →        STYLE_DNA
   nắng·gió·view             Movie                     DEVELOPER
        │                          │                   PROJECT_STATUS
   nặng ở máy                nặng ở máy                nhẹ, dùng chung
        └──── nhẹ ──────►  ◄────── nhẹ ────┘
                    (cả hai ĐỌC/GHI Lark)
```

**Luật vàng**: dữ liệu **nặng ở lại máy**, dữ liệu **điều phối bay lên Lark**.
Hai app **không gọi nhau** — chỉ cùng đọc/ghi Lark. Đổi bên nào cũng không vỡ bên kia.

## A2. Sáu tầng kỹ thuật (T0–T5)

| Tầng | Là gì | Chứa gì |
|---|---|---|
| **T5** | Não tri thức | RAG · quy chuẩn · gu · KnowledgePack |
| **T4** | Giao diện | Khung app · SmartBar · StatusBar · panel |
| **T3** | Tính năng | Xem `docs/IF-FEATURE-TREE.md` |
| **T2** | Động cơ | DCEL · checker · Perceptron · material-texture · render |
| **T1** | Lõi mã chung | **`.idf`** · shared-types · GuProfile · asset id |
| **T0** | Vỏ | Electron · auto-updater · SQLite/Prisma |

## A3. Sáu khối chức năng (T3)

```
① MANAGER CENTER  quản lý công việc · phân quyền · team
② STUDIO          Ý tưởng → CAD → Render → Present → Movie
③ SMART BAR       thanh chỉnh sửa thích ứng theo tác vụ
④ LIBRARY         cửa hàng — tài sản đã tuyển chọn
⑤ FILE MANAGER    chợ đầu mối — lớp đệm app ↔ máy tính
⑥ KNOWLEDGE       trung tâm sự thật (chỉ admin)
     ↕ VITALS xuyên suốt cả sáu
```

## A4. Hai luồng, một nguồn

| | **Luồng SÁNG TẠO** | **Luồng KỸ THUẬT** |
|---|---|---|
| Giai đoạn | Sơ phác → Schematic Design | Technical → BIM/IFC |
| Chế độ CAD | **Sketch** (tablet · bút · cử chỉ) | **Pro** (chuột · lệnh · mm) |
| Cần gì | Nhanh · tự do · nhiều phương án | Chính xác · chuẩn · hồ sơ |
| Đầu ra | Ý tưởng · moodboard · concept | Bản vẽ thi công · IFC · BOQ |

⚠️ Hai luồng **cùng một `.idf`**. Chuyển bất kỳ lúc nào, không mất gì.

## A5. Tám luật vận hành *(hiến pháp — đã chốt, chi tiết đầy đủ ở `IF-ARCHITECTURE-BLUEPRINT-v1.md` §8)*

1. Không làm L khi N chưa xong
2. Không hộ chiếu (spec) thì không code
3. Mỗi sprint chỉ lên một bậc
4. Thừa thì cắt, ghi sổ
5. Output mồ côi (không id) không ship
6. Human-in-the-loop: một lúc một việc · đề xuất nhiều không một · sửa tay không mất đề xuất · nói rõ máy vừa làm gì
7. **Không có nút thì không có AI** — năng lực → nút → AI gọi hàm
8. **AI không ghi trực tiếp vào hình học** — LLM ra ý định, code tính toạ độ

---

# PHẦN B · HỆ SINH THÁI `.idf`

## B1. `.idf` là gì

**Một file = một bản vẽ có ngữ nghĩa.** Không phải ảnh, không phải DXF —
là **mô hình biết mình là gì**.

```
.idf (JSON nén)
├── meta        version · id · ngày · người tạo · đơn vị
├── geometry    DCEL half-edge — điểm · cạnh · mặt
├── semantic    ⭐ Room{roomType, area} · Wall{wallKind, structural, thickness}
│               Door · Window · Zone · Light{type, lumen}
├── materials   matId → vùng áp (nối ATLAS)
├── layers      Tường · Nội thất · Kích thước · Ghi chú · Trục · Đèn
├── sheets      Layout · viewport · tỉ lệ · khung tên
└── history     undo stack · rev · deviceId (local-first)
```

## B2. Ai đọc, ai ghi

| Ai | Đọc | Ghi | Ghi chú |
|---|---|---|---|
| CAD | ✅ | ✅ | Nguồn chính |
| Render | ✅ | ❌ | Lấy hình học làm ControlNet |
| Present | ✅ | ❌ | Lấy bản vẽ + số liệu |
| Movie | ✅ | ❌ | Lấy camera path |
| Checker | ✅ | ❌ | Đọc semantic để kiểm |
| Vitals | ✅ | 🔒 qua hàm | **Luật 8** — không ghi thẳng |
| ArchiNote | ❌ | ❌ | Chỉ gửi số đo qua Lark |

## B3. Vòng đời

```
DXF/DWG ──┐
số đo    ──┼─► GATEWAY ─► .idf ─┬─► render ─► ảnh (img_)
ảnh      ──┘                    ├─► deck   ─► PDF/PPTX
                                ├─► BOQ    ─► Excel
                                ├─► IFC    ─► BIM
                                └─► video  ─► MP4
                                     ↓
                            KnowledgePack ─► T5 (học ngược)
```

## B4. Bốn ràng buộc bắt buộc

| # | Ràng buộc | Vì sao |
|---|---|---|
| 1 | **Có `migrate()` trước khi bump version** | Không thì file cũ đọc lỗi im lặng |
| 2 | **cuid cho mọi id** | Sync không đụng độ |
| 3 | **`updatedAt` + `rev` + `deletedAt` + `deviceId`** | Local-first |
| 4 | **File nặng KHÔNG nằm trong `.idf`** | Chỉ giữ đường dẫn *(linked asset)* |

## B5. Định dạng anh em

| Đuôi | Là gì |
|---|---|
| `.idf` | Một bản vẽ |
| `.ifpack` | **Gói dự án** (ZIP: .idf + ảnh + metadata + manifest) — bàn giao/backup |
| `.iftool` | Một thẻ tool (subgraph JSON + preview) — chia sẻ trong team |
| `.ifkit` | Brand Kit (màu · font · logo · template) |

---

# PHẦN C · CÂY TÍNH NĂNG

> **Đã chuyển sang `docs/IF-FEATURE-TREE.md`** (28/07) — cây 461 mục, có trạng thái ✅/🟡/⬜/⛔
> theo bằng chứng `file:dòng` thật, 3 bảng tổng (đếm theo khối · cây phụ thuộc · "làm được ngay"),
> và Luật Đóng Băng (xem Phần E dưới). File này không còn giữ bản sao cây tính năng để tránh 2 mã
> số trùng nhau chỉ 2 nội dung khác nhau.

---

# PHẦN D · LỆNH GIAO DIỆN

## D1. Phím tắt toàn cục

| Phím | Việc |
|---|---|
| `⌘K` | Bảng lệnh — tìm mọi thứ |
| `⌘J` | Vitals |
| `⌘S` | Lưu |
| `⌘Z` / `⌘⇧Z` | Undo / Redo |
| `⌘,` | Cài đặt |
| `1` `2` `3` `4` `5` | Nhảy chặng |
| `Esc` | Thoát chế độ hiện tại |

## D2. CAD

| Phím | Việc |
|---|---|
| `L` | Vẽ đường/tường |
| `REC` | Chữ nhật |
| `PL` | Polyline |
| `C` | Tròn |
| `D` | Kích thước |
| `M` | Di chuyển |
| `CO` | Sao chép |
| `TR` | Cắt |
| `F8` | Khoá ngang/dọc (ortho) |
| `F3` | Bật/tắt snap |
| `Space` | Lặp lệnh trước |
| `Del` | Xoá |

## D3. Present

| Phím | Việc |
|---|---|
| `T` | Chữ |
| `I` | Ảnh |
| `R` | Hình |
| `⌘D` | Nhân bản |
| `⌘G` / `⌘⇧G` | Nhóm / Bỏ nhóm |
| `⌘⇧]` / `⌘⇧[` | Đưa lên trước / xuống sau |
| `⌘⇧P` | Trình chiếu |
| `⌥ + kéo` | Nhân bản nhanh |
| `⇧ + kéo` | Khoá tỉ lệ |

## D4. Render

| Phím | Việc |
|---|---|
| `⏎` | Render |
| `B` | Cọ mask |
| `E` | Tẩy |
| `[` `]` | Cỡ cọ |
| `\` | So sánh trước/sau |
| `⌘⏎` | Render tất cả hàng đợi |

## D5. Cử chỉ *(cảm ứng / trackpad)*

| Cử chỉ | Việc |
|---|---|
| 2 ngón chụm/xoè | Zoom |
| 2 ngón kéo | Pan |
| **2 ngón chạm** | Undo |
| **3 ngón chạm** | Redo |
| **Chạm giữ** | = chuột phải |
| **Kéo xuống từ thanh chặng** | Vitals |
| Bút + lực nhấn | Nét đậm nhạt (Sketch) |

## D6. Chuột phải — theo ngữ cảnh

| Bấm ở đâu | Menu |
|---|---|
| CAD nền trống | Dán · Nhập tệp vào đây · Thêm block |
| CAD trên đối tượng | Sửa · Nhân bản · Xoá · Đổi vật liệu |
| Render canvas | Nạp ảnh · Thêm node · Dán |
| Present ảnh | **Thay ảnh…** · Chỉnh ảnh · Nâng cao · Nhân bản · Xoá · Lên trước/xuống sau |
| Library món | Dùng ngay · Sửa thẻ · Xem file gốc · Xoá |

⚠️ **Chuột phải chỉ là ĐƯỜNG TẮT** — mọi việc phải làm được bằng đường khác.

## D7. Vị trí cố định trên màn hình

```
┌────────────────────────────────────────────────────────┐
│ [logo] [Dự án ▾]  Ý tưởng·CAD·Render·Present·Movie [⚙] │ ← thanh chặng
├────┬──────────────────────────────────┬────────────────┤
│ ⬛ │                                  │  Thuộc tính    │
│ ⬛ │           CANVAS                 │  đối tượng     │
│ ⬛ │                                  │  đang chọn     │
│ ⬛ │                                  │                │
├────┴──────────────────────────────────┴────────────────┤
│              ⚡ SMART BAR (đổi theo tác vụ)             │
├────────────────────────────────────────────────────────┤
│ dự án · bản vẽ · toạ độ │ ✦ VITALS │ hàng đợi · lưu ·🔴n│ ← status bar
└────────────────────────────────────────────────────────┘
  rail trái: Thư viện · Lớp · Lịch sử · File Manager
```

---

# PHẦN E · LUẬT ĐÓNG BĂNG

> **Đã chuyển sang `docs/IF-FEATURE-TREE.md`** (28/07) — bản đầy đủ 5 điều (bản ở đây trước chỉ có
> 4, thiếu điều "KHÁM → QUYẾT → SPEC → CODE") + đã thêm ngoại lệ khẩn cấp cho điều 3 theo yêu cầu
> "flexible" của Hoà. Không giữ bản sao ở đây để tránh 2 bản luật lệch nhau.

---

*v1.1 · 2026-07-28 (Cowork) · Gỡ Phần C (cây tính năng) và Phần E (Luật Đóng Băng), cả hai đã
trùng lặp + lệch nội dung với `IF-FEATURE-TREE.md`. Thay bằng con trỏ. File này từ nay chỉ giữ vai
kiến trúc tổng thể (A) · hệ sinh thái `.idf` (B) · ngôn ngữ lệnh giao diện (D). Lý do đầy đủ:
`docs/HANDOFF-COWORK-2026-07-28.md`. Hoà duyệt qua lệnh "tiến hành".*
*v1.0 · 2026-07-28 · Ben soạn theo yêu cầu Hoà. Cột "Code" chờ Cowork điền từ code thật.*
