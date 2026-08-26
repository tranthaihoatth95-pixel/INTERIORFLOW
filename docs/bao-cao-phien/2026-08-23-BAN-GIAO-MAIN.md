# BÁO CÁO BÀN GIAO — MAIN cũ → MAIN mới
**23/08/2026** · nhánh `main` · HEAD `c7f3ac8` · tsc **0 lỗi** · npm test **0 fail**

---

## 0 · TÓM TẮT MỘT TRANG

Phiên này làm ba việc, theo đúng thứ tự Hoà giao:

1. **Sửa sản phẩm** — 6 lỗi thật, trong đó có một lỗi nền đã sống suốt hai tuần.
2. **Dựng Trường Thiết Kế** — 61 tệp + 2 skill + 2 máy soi, để luật thiết kế thôi chết theo phiên.
3. **Chưng cất chính mình vào repo** — 5 tệp control plane + 3 skill quy trình, kiểm bằng bài khởi động nguội.

**Phát hiện đắt nhất cả phiên** (một agent bác lại kết luận của tôi, và nó đúng):

> **BIẾT LUẬT BẰNG CHỮ KHÔNG PHẢI LÀ NHẬN RA VI PHẠM BẰNG MẮT.**

Tệp dựng bố cục Trang chủ chép sẵn luật cấm lưới thẻ đều, **gọi tên đúng cả hai lần trượt trước**,
phát biểu đúng cách hiểu đúng — rồi vẫn giao ra một tường thẻ trắng. Không phải "không ai đọc".
Luật bằng văn xuôi **không cho người ta cách đối chiếu sản phẩm của mình với nó**.

⇒ Luật rút ra, áp cho mọi luật thiết kế về sau:
**luật nào không kèm được một cặp ảnh TỐT/XẤU thì chưa dùng được — nó mới là một câu, chưa phải công cụ.**

---

## 1 · SỬA SẢN PHẨM — 6 lỗi, tất cả đã đo tại nguồn

### 1.1 🔴 Font không đánh vần được tiếng Việt — lỗi nền, sống suốt hai tuần
| Font | Ký tự Việt dấu chồng (ế ề ấ ầ ộ ự ữ ạ ị) |
|---|---|
| **Geist** — đang dùng toàn app | **thiếu 10/10** |
| **BeVietnamPro** — nằm không trong repo từ 26/07 | đủ 10/10 |

Màn hình thật ghi *"Thiêt kê 2D"* · *"gân nhât"* · *"Quyêt định"*. Mỗi chữ có dấu rơi về font hệ
thống mặc định là **serif** ⇒ một từ tiếng Việt bị vá bằng **hai font**.

⭐ Đây là nguyên nhân **DUY NHẤT** của cả hai lời chê kéo dài hai tuần: *mất dấu* và *trông serif*.

**Bẫy đã giết nó lâu đến vậy:** chú thích ngay chỗ đó khai *"hệ điều hành tự fallback glyph tiếng
Việt"*. Sai — `fallback` lo lúc font **tải hỏng**; nó **không** lo được lúc font tải xong mà
**không có chữ**. Hai lỗi khác nhau bị gộp một dòng nên không ai đi kiểm.

### 1.2 🔴 `--focus-ring` chưa bao giờ tồn tại
`HaiNgan.tsx:46` gọi `outline: var(--focus-ring)` từ 17/08. Biến **không được khai** ⇒ CSS **im
lặng** bỏ qua cả khai báo ⇒ vòng focus "đã sửa" **sáu ngày không vẽ ra một pixel nào**.
Không máy nào bắt: `tsc` không đọc CSS, test không dựng DOM, máy soi tìm nhãn chứ không tìm
biến-chưa-khai. **`var(--x)` mà `--x` chưa khai là một lỗi CÂM.**

### 1.3 🔴 `Icon.tsx` — primitive của chính tôi, không dùng được
Khai `strokeWidth?: number`, hẹp hơn `LucideProps` ⇒ **mọi** chỗ dùng thật là `tsc` đỏ.
`grep "glyph={"` = **0 nơi dùng**. Tôi từng khai *"8 assertion PASS"* — nhưng **không ca nào truyền
một icon lucide thật vào**; test chỉ khoá hằng số.
⇒ Đúng bài học bug Hough 15/08: **test khẳng định đường thoái lui mà không có test nào khẳng định
đường CHÍNH chạy được thì đó là test CHE bug.** Đã sửa + thêm guard kiểu bắt đúng ca đã lọt.

### 1.4 Hệ màu sáng lệch nhiệt độ — không phải 2 token mà là **25**
`--bg #f2efe9` (be ẤM) cạnh `--card #ffffff` (trắng thuần). Lệch nằm ở `--field --hover --border
--t1..t5 --dots --kinh-*` và cả ba `--shadow-*`. Nay cả bộ ngả lam `#f2f2f7` canh Apple.

### 1.5 Màu AI hardcode ngoài hệ token
`MAU_AI = '#1f7f88'` là **hằng số TypeScript** trong component — màu **mang nghĩa** sống ngoài hệ
token. Nay là `--mau-ai` / `--mau-ai-sang`; Hoà chọn mận thì **sửa đúng hai dòng**.

### 1.6 4 route dev lọt vào cây sản phẩm
`/dev-bench-3d-2` · `/demo/ghe-3d` · `/thu-be-mat` · `/thu-trang-thai`. Không có lối vào từ
giao diện nên không ai thấy — nhưng trong bản đóng gói **ai gõ đúng đường dẫn là vào được**, và
thấy bàn thử với dữ liệu bịa. Nay trả **404 thật** trong production (server layout), dev giữ nguyên.

### 1.7 Nút "Vào xưởng" — cả cục tím thì không bao giờ ra kính
Hoà chỉ đúng: cấu tạo cũ tô phẳng ⇒ tâm = rìa ⇒ mắt đọc ra **nhựa**. Dựng lại ba tầng
(**phim màu mỏng → khối kính trong → mép**), nghiệm thu một câu: **rìa phải đặc hơn tâm**.
Đo trên app thật: oklab L **tâm 0.647 → rìa 0.353**.
🔴 Và phát hiện kèm theo: **kính lỏng quang học cần DIỆN TÍCH** — ở 44px các cue chồng lên nhau
thành một vệt. Hoà chọn hướng **nâng nút lên 60px** thay vì cường điệu cue vượt vật lý.

---

## 2 · TRƯỜNG THIẾT KẾ IF

**Kiểm kê trước khi dựng lật ngược giả định:**

> **IF KHÔNG THIẾU TRI THỨC. IF THIẾU ĐƯỜNG DẪN TỚI TRI THỨC ĐÚNG LÚC.**

32 tệp nghiên cứu · 12 văn bản luật · ~106 bản vẽ — thừa sức trả lời mọi lỗi. Vậy mà cả 10 lỗi
Trang chủ vẫn xảy ra, **bốn trong số đó vi phạm luật đã ghi thành văn**.

| Lỗi | Luật có từ | Vì sao vẫn lọt |
|---|---|---|
| Tường thẻ trắng | 20/08 + 22/08 | **đọc rồi vẫn phạm** — xem mục 0 |
| 6 nhãn HOA | 31/07 | không máy nào canh, không ví dụ xấu để đối chiếu |
| Heatmap phù phiếm | 02/08 | chôn trong tệp nghiên cứu đối thủ |
| Widget lấp chỗ | **chưa từng có luật** | tri thức MỚI thật sự |

**Đã dựng:** `SKILL.md` 237 dòng bách khoa → **110 dòng định tuyến** · 15 module tri thức ·
19 module sản phẩm · 8 tham chiếu · **5 cặp ví dụ TỐT/XẤU** + 2 cặp TRƯỚC-SAU có ảnh thật ·
3 khuôn hợp đồng · 3 checklist nhị phân 189 câu · skill `if-design-review` 23 trục.

**`soi:design-school`** — máy canh **hai chiều**: con trỏ chết **và** tệp mồ côi. Lượt chạy đầu bắt
ngay **7 tệp mồ côi do chính bộ định tuyến tôi vừa viết** chỉ trỏ `examples/BAD/` mà quên `GOOD/`.

---

## 3 · CHƯNG CẤT MAIN — control plane

```
CLAUDE.md                                 bộ nạp (prepend, KHÔNG xoá luật cũ)
docs/control/IF-CANONICAL.md              305 dòng — hiến pháp, 2 phần
docs/control/IF-UXUI-OPERATING-MEMORY.md  209 — 37 mục, 12 nhãn 🔴 HỆ THỐNG
docs/control/IF-AUDIT-MEMORY.md           215 — 14 luật phương pháp + 15 phát hiện phân loại
docs/control/IF-TOOLING-RECEIPT.md         56 — năng lực THẬT, từng cái đã chạy thử
docs/control/IF-CURRENT-STATE.md           63 — RAM, có dấu bàn giao
.claude/skills/  if-design · if-design-review · if-ui-convergence · if-audit · if-handoff
```

### Ba luật hệ thống đắt nhất trong trí nhớ vận hành

**M-03 · "Có trong mã" ≠ "tới được người dùng"** — ba ca cùng họ (lý do nút mờ nằm trong `title`
câm trên cảm ứng · `--focus-ring` chưa khai · `Icon.tsx` chưa từng chạy). Gốc bệnh chung: kiểm
**CÓ MẶT** thay vì kiểm **CÓ TÁC DỤNG**.

**M-24 · Tri thức chết vì đứt con trỏ, không vì bị xoá** — `IF-ARCHITECTURE-COMPASS.md` là bản đồ
12KB sống nguyên vẹn mà **19 ngày không phiên nào đọc**, chỉ vì một lượt đổi tên làm đứt con trỏ.

**M-25 · Sổ đặt tên cho thứ code đã có tên ⇒ đẻ khái niệm ma** — `"master tool"` **26 lần trong sổ,
0 trong code**; `ToolWindow` **13 trong code, 0 trong sổ**. Hai tên không giao nhau ở đâu cả.
Yêu cầu bị nhắc **4 lần**, làm nhầm **6 phiếu**.

---

## 4 · BÀI KIỂM KHỞI ĐỘNG NGUỘI — **FAIL · FAIL · PASS**

Ba phiên nguội độc lập, không ai được giải thích gì.

| Lượt | Kết quả | Đọc `docs/control/`? |
|---|---|---|
| 1 | ❌ FAIL | **không tệp nào** — đi `LATEST.md` → sổ phiên cũ |
| 2 | ❌ FAIL | **không tệp nào** — đi `docs/CLAUDE.md` → `LATEST.md` |
| 3 | ✅ **PASS** | **đủ 4 tệp**, 8 lệnh đọc, 4 lượt, đúng 9/9 câu |

**Giá trị nằm ở hai lượt FAIL.** Cả hai vẫn trả lời đúng 8–9/9 câu, rẻ, không audit repo — nghĩa là
**tri thức tới được, ĐƯỜNG DẪN thì không**.

### Nguyên nhân gốc, do lượt 3 tìm ra

> **Bản `CLAUDE.md` nhét sẵn vào system prompt của phiên mới là ẢNH CHỤP CŨ.**
> Nó mở đầu bằng *"Đọc @STATUS.md rồi @00-CHOT.md TRƯỚC TIÊN"*, **không có bộ nạp**, không nhắc
> `docs/control/` một chữ. Cùng lúc `STATUS.md` + `00-CHOT.md` (112KB nhật ký) cũng được nhét sẵn.
> ⇒ **Phiên mới bị đẩy vào đúng cái hố trước khi kịp đọc gì.**
> **Sửa tệp trên đĩa KHÔNG sửa được bản đã nhét vào ngữ cảnh phiên đang chạy.**

**Thứ cứu lượt 3:** dấu *"ĐÂY KHÔNG CÒN LÀ CỬA VÀO"* đặt ở **dòng 1–11** của bốn cửa vào cũ.
Không chặn được nó đi sai đường, nhưng **kéo được về ngay khi vừa đi**.

⇒ **M-54:** *ta không điều khiển được phiên mới bắt đầu từ đâu — chỉ điều khiển được thứ nó gặp khi
tới đó.* Và bẫy con: **dấu ở đầu tệp không vô hiệu hoá câu lệnh ở giữa tệp**.

### Bốn cửa vào cũ, tất cả đều nói dối về chính mình
| Tệp | Tự xưng | Thật ra |
|---|---|---|
| `docs/memory/LATEST.md` | *"bản nén phiên gần nhất"* | biết **2 trong 21 phiên** của 22/08 ⇒ đọc đúng nó là **mất trắng 19 phiên** |
| `IF-LIVE-BRIDGE.md` | *"nguồn sự thật SỐNG, cập nhật liên tục"* | **đứng yên từ 20/08** |
| `docs/CLAUDE.md` | luật vận hành | 19/08 — luật còn đúng, **thứ tự đọc thì sai** |
| `STATUS.md` | bức tranh hiện tại | bức tranh của **19/08** |

Cả bốn đã đóng dấu chuyển hướng, **giữ nguyên nội dung** làm dấu vết.

---

## 5 · NĂNG LỰC — đã chạy thử từng cái

> ⛔ **LUẬT: CHỜ ĐỢI CÓ MÀ CHƯA XÁC MINH ⇒ COI LÀ KHÔNG CÓ.**

**✅ ĐÃ XÁC MINH** — 5 skill dự án · **10 máy soi** (8 exit 0; `soi:thao-tac` và `soi:foundation`
exit 1 = nợ cũ) · DesignSync `canEdit:true` 62 tệp · playwright · Browser pane · `/api/dev-identity` ·
Agent/SendMessage.

**🟡 CÓ MẶT, CHƯA HIỆU CHUẨN** — 5 skill người dùng (chưa gọi lần nào) · 3 skill quy trình mới
(chưa chạy trọn một bề mặt) · 189 câu checklist (chưa chạy thử lần nào).

**❌ KHÔNG CÓ** — quyền quay màn hình (`screencapture` trả *could not create image from display*) ·
ảnh sau đăng nhập (401) · **hai artifact Hoà nói đã cấp** (`CONTINUITY-PACK`, `AUDIT-MEMORY`) —
không có trong repo, không có trong chat.

⚠️ **Phiên phụ KHÔNG có DesignSync** (kiểm hai lần) ⇒ phiên phụ dựng mock, **MAIN đẩy lên**.

---

## 6 · CÒN CHỜ NGƯỜI — 5 câu, chỉ câu 1 chặn cứng

| | Câu | Ghi chú |
|---|---|---|
| 1 | **Ảnh Trang chủ sau đăng nhập** | 🔴 `node scripts/chup-man-duyet-mat.mjs --dang-nhap` — chặn **việc chấm Trang chủ**, KHÔNG chặn P0 |
| 2 | Màu nhấn thứ hai | mòng két `#1f7f88` ↔ mận `#8f5a72` · token sẵn, đổi **2 dòng** |
| 3 | Rail nấc hẹp 28 hay 52px | ⚠️ code đang **28**; báo cáo khai *"52 ở dòng 138"* là **bịa** — thật là dòng 133, `dinhVi: 28` |
| 4 | Present | hạ ở tầng điều hướng, không đụng khoá `Phase`? |
| 5 | `/files` mồ côi | rail là lối vào duy nhất |

✅ **ĐÃ ĐÓNG trong phiên** — *auto-hide rail*: phân giải bằng **CHỦ Ý** chứ không bằng trigger.
`PEEK` được tự thu · `OPEN` cấm tự thu · `PINNED` thường trực. §6.1 và §8 **đều đúng một phần** —
chúng nói về hai trạng thái khác nhau mà chưa ai đặt tên.

---

## 7 · NỢ CHƯA VÁ — nói thẳng để không ai tưởng đã xong

1. 🔴 **Một bộ luật đang điều khiển wave mới nhất chỉ sống trong chat.** Có phiên trích
   `§7 · §17 · §19 · §24A` của một văn bản mà `grep` toàn `docs/` ra **0 kết quả**.
   Phiên sau **không tái lập được**. Đúng loại "khái niệm ma" mà chính sổ cảnh báo.
2. 🔴 **Chưa có ảnh Trang chủ 23/08 nào trong repo.** Cả đợt kết luận *"phải đối chiếu bằng hình"* —
   mà ca đắt nhất thì đang thiếu đúng cái hình đó.
3. 🟡 **189 câu checklist chưa hiệu chuẩn.** Chính kho này ghi lại ba phiên khác đã *kiểm công cụ
   trước khi tin nó*; bước đó chưa làm cho bộ checklist mới.
4. 🟡 **Ví dụ TỐT vẫn có khuyết tật** — `M1-login-sang.png` là mẫu Auth tốt nhưng còn **4 nhãn HOA**.
   Đã liệt kê thành bảng; giấu đi là mời người sau chép cả khuyết tật.
5. 🟡 `soi:foundation` còn **1.173 vi phạm** nền — nhưng **không cái nào là lý do Trang chủ trượt**.

---

## 8 · CÂU MỞ CHO MAIN MỚI

```
Read InteriorFlow project memory/control plane first (docs/control/), run the
cold-start check, verify current runtime/tooling, then resume the exact next
frontier autonomously. Do not rediscover solved product philosophy.
```

**Nó phải trả đúng:** người ghi sản xuất là chính nó · runtime `:3799` · Claude Design là thẩm quyền
thị giác · Home không phải dashboard · Sidebar `PEEK/OPEN/PINNED` · ToolWindow là xưởng có
`MOVE/DOCK/PIN/PERSIST` · Vitals im khi không có tín hiệu · 5 câu chờ người · và **thứ tự P0 bắt
đầu ở Foundation → App Shell → Sidebar**, không phải Home.

---

*MAIN cũ kết thúc tại đây. Repo biết InteriorFlow; phiên Claude chỉ là người vận hành hiện tại.*
