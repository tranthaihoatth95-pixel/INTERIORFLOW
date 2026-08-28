# Báo cáo — dựng `knowledge/` của IF DESIGN SCHOOL (23/08)

## 1 · Tổng quan
Đã viết **15 tệp** vào `.claude/skills/if-design/knowledge/` theo đúng khuôn 6 mục, tổng **1.590**
dòng (trung bình 106 dòng/tệp, nằm trong dải 60–140 yêu cầu). Toàn bộ là **CHƯNG CẤT + TRỎ VỀ
NGUỒN** — không viết lại tệp `docs/nc/` nào, không đẻ nguồn thứ hai. Mọi tệp kết bằng mục
**ĐÀO SÂU** dẫn đường dẫn gốc trong repo. Không đụng file nào ngoài vùng ghi (trừ chính báo cáo
này, do đề bài chỉ định). Không `git add/commit`.

## 2 · Chi tiết

### 2.1 · Tệp đã viết ↔ nguồn đã chưng cất từ đâu
| Tệp | dòng | Chưng cất từ |
|---|---|---|
| `human-centered-design.md` ⭐ | 116 | `SKILL.md §0/§16` · `02-FAILURE-LEDGER` F-01·F-02·F-10 · `06-DESIGN-KNOWLEDGE-AUDIT` · chốt Home 13/08 · `CHOT-EXPERIENCE-SYSTEM` |
| `visual-hierarchy.md` | 90 | `IF-MOTION-VISUAL-LAW §III/§IV/§VI` · NT-1·2·7·11·17 · `01-CLINICAL-UI-AUDIT` (B4, số canvas 2D) |
| `editorial-composition.md` | 94 | `LUAT-VAT-LIEU-KINH §5` · `CHOT-EXPERIENCE-SYSTEM` · NT-3·12·17 · F-01·F-11·F-14 · `01-CLINICAL-UI-AUDIT` B1 |
| `progressive-disclosure.md` | 95 | `00-CHOT` 16/08 (ba nấc = ba công năng · hai ngôn ngữ · mặt nhìn) · `00-CHOT` 07/08 (thang thẻ 122/168/232) · `SPEC-PANEL-ROLLOUT §2b/§2f` · NT-4 |
| `professional-workspaces.md` | 97 | `SPEC-PANEL-ROLLOUT §1` (3ds Max·Blender·Rhino·SketchUp, Findlater CHI 2004) · `TICKET-KIEN-TRUC-LENH-3-TANG` (5 sổ lệnh) · `01-CLINICAL-UI-AUDIT` B3 · `IF-MOTION-VISUAL-LAW §V` |
| `docking-and-panels.md` | 91 | `SPEC-PANEL-ROLLOUT §2a–2f/§4a` · `IF-MOTION-VISUAL-LAW §IV` · `00-CHOT` 15–16/08 (cửa sổ công dân canvas) · K1–K4 02/08 · OPEN CLASSES của ledger |
| `apple-design-principles.md` | 104 | `SPEC-APPLE-MOTION-MATERIAL` · `SPEC-HOVER-FOCUS-IDF §2` · NT-16 · F-14 · `00-CHOT` 16/08 (`#F2F2F7` ↔ `#f2efe9`) |
| `typography.md` | 98 | `SPEC-MAT-DO-CON-TRO §3–5` · NT-7·8·12 · `01-CLINICAL-UI-AUDIT` B4 · `SKILL.md §6` (nợ token) · `SPEC-NGON-NGU-CHI-DAN` |
| `typography-vietnamese.md` | 115 | `LUAT-CHU-VIET-7.1.23` (5 mục nguyên bản) · **`app/layout.tsx:11-22`** (ca Geist 23/08, đo `cmap` bằng fontTools) · `00-CHOT` 08/08 |
| `iconography.md` | 104 | **`components/ui/Icon.tsx`** (docstring + số đo 23/08) · `01-CLINICAL-UI-AUDIT` B3 · `00-CHOT` 16/08 (bảy loại icon) · `soi-foundation.mjs` |
| `materials-g0-g3.md` | 122 | `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` **toàn bộ, gồm G3 ba tầng 23/08 + phép "rìa đặc hơn tâm"** · F-06·F-13·F-14 |
| `motion.md` | 113 | `IF-MOTION-VISUAL-LAW §0/§VI/§VIII` · `app/globals.css` (`--nhip-*`, `--ease-apple`) · `lib/ui/tien-trinh.ts` · `00-CHOT` 16/08 (ba tầng ánh sáng · hai loại thanh tiến trình) |
| `touch-ipad.md` | 104 | `SPEC-MAT-DO-CON-TRO` (5 token, `app/globals.css:105`) · `SPEC-HOVER-FOCUS-IDF` luật 8 · `Tooltip.tsx:33,37` · `00-CHOT` 11/08 CẤP 0 · 16/08 (đính chính địa chỉ hằng số) |
| `accessibility.md` | 114 | WCAG 1.4.3/1.4.11/1.4.12 · `globals.css:311/:407` (`--mo-vo-hieu` 0.5/0.62) · F-02·F-10 · `00-CHOT` 16/08 (đo `aria-disabled` bằng Playwright) |
| `professional-terminology.md` | 133 | `SKILL.md §1/§12` · `scripts/soi-tu-dien.mjs` · `00-CHOT` 16/08 (ca `tool` 4 nghĩa · `master tool`↔`ToolWindow`) · `NC-TU-DA-NGHIA` · `IF-ARCHITECTURE-BLUEPRINT` B3/B20 |

### 2.2 · Kỷ luật đã giữ
- **Không viết lại nguồn**: 0 tệp `docs/nc/` bị sao chép; các module chỉ trích **luật + số đo +
  ca hỏng**, rồi trỏ về.
- **Luật đo được**: mọi mục §2 là mệnh lệnh đánh số; mọi mục §5 là câu tự chấm hoặc lệnh máy soi.
  Không có câu kiểu *"trông cao cấp"*.
- **Tách SỰ THẬT ↔ DIỄN GIẢI**: đã dán nhãn tường minh ở hai chỗ dễ nhầm nhất —
  `professional-workspaces.md` (khảo 4 app có nguồn; mở rộng sang 10 app là **diễn giải của IF**)
  và `iconography.md` (bảng 7 loại icon là **diễn giải**, T chốt 16/08 theo uỷ quyền).
- **Khai nợ, không lấp**: `typography.md` khai thang chữ **còn nợ Claude Design (`SKILL.md §6`)**
  thay vì bịa bảng số; `accessibility.md` khai a11y audit **vẫn là lỗ ❌ mở**.

## 3 · Tổng kết vấn đề
Audit kết luận IF **thiếu đường dẫn tới tri thức, không thiếu tri thức**. Bộ 15 module này là
**tầng chưng cất**: mỗi tệp gói đúng thứ agent cần lúc dựng (luật đo được + ca hỏng thật + cách
kiểm), và đẩy phần nền dài về nguồn gốc. Nó lấp được ba trong bốn lỗ 🔴 mà audit nêu — **định
tuyến** (mỗi module là một điểm vào theo chủ đề), **"việc của con người" thành cổng** (module 1),
**ca hỏng thành luật** (mọi tệp có §4). Hai lỗ còn lại **không thuộc phạm vi việc này**: ví dụ
tốt/xấu có chú giải (`examples/` vẫn rỗng) và **người chấm độc lập** (chưa có skill review).

## 4 · Đánh giá khách quan
**Được:**
- Tri thức **MỚI thật sự** (không có sẵn ở đâu trong repo): ⓵ luật H-0 *"một phần tử không xứng
  đáng tồn tại chỉ vì có dữ liệu hoặc có chỗ trống"* + bảng 12 câu mở màn + ba ca mẫu — audit xác
  nhận *"chưa từng có luật"*; ⓶ ràng buộc **bộ chữ phải phủ đủ tiếng Việt, kiểm bằng bảng mã** —
  luật này mới sinh 23/08, chỉ tồn tại trong chú thích `app/layout.tsx`, nay thành luật tra được;
  ⓷ gom **CHỮ KỸ THUẬT ↔ CHỮ CHẠY** thành một ranh giới dùng được (`LUAT-CHU-VIET` có ý này rải
  rác trong 5 mục, chưa ai gộp).
- Ba ca mẫu widget được ghi ở dạng **cùng một widget, hai phán quyết** (Ghi chú nhanh) — đây là
  phần dạy được, không phải danh sách cấm.
- Số liệu đều **đo tại nguồn trong phiên này**, không chép trí nhớ: `--mo-vo-hieu` 0.5/0.62 tại
  `globals.css:311/:407`, Geist thiếu 10/10 tại `layout.tsx:11-22`, 5 token tại `globals.css:105`.

**Chưa được / rủi ro:**
- **Chữ vẫn là chữ.** Audit đã chứng minh chữ không đủ: luật *"cấm lưới thẻ đều"* có từ 20/08 mà
  23/08 vẫn ra tường thẻ. Bộ này **sẽ lặp lại số phận đó** nếu không có ⓵ ví dụ hình đối chiếu và
  ⓶ người chấm độc lập.
- **Không có máy canh cho lớp lỗi nặng nhất.** H-0 là câu hỏi ngữ nghĩa, 5 máy soi hiện có đều mù.
- **Nguy cơ mốc.** 15 tệp này trích số từ code; code đổi thì chúng sai âm thầm — đúng bệnh
  `IF-ARCHITECTURE-COMPASS` mồ côi 19 ngày. Chưa có dây nào nối chúng vào `soi:*`.

## 5 · Hướng xử lý — ba góc
| Hướng | Ưu | Nhược |
|---|---|---|
| **A · Dựng `examples/GOOD|BAD|BEFORE-AFTER` có chú giải** | đánh trúng bằng chứng của audit (*"chữ không đủ, phải có hình đối chiếu"*); rẻ, làm được ngay từ 3 ca đã có ảnh (tường thẻ · 6 nhãn HOA · G3 nhựa↔kính) | vẫn là tự chấm; không chặn được lúc dựng |
| **B · Dựng skill/agent CHẤM ĐỘC LẬP** đọc knowledge rồi soi bản dựng | vá lỗ 🔴 *"người vẽ đang tự chấm"*; đóng được vòng lặp (trọng tài đóng vòng) | tốn hơn; cần khuôn phiếu chấm; dễ ra nhận xét chung chung nếu không neo vào §5 từng module |
| **C · Nối knowledge vào máy soi** — mỗi luật đo được thành một rule của `soi:foundation`/`soi:tu-dien` | tất định, 0đ, chạy mãi | chỉ phủ được luật **đo bằng chuỗi/số**; H-0 và thứ bậc **không** máy hoá được; và F-06/F-13 chứng minh guard grep dễ bị thoả mãn giả |

## 6 · Đề xuất
**Làm A trước, rồi B, C đi kèm B — theo đúng thứ tự đó.**
- **A trước** vì audit đã có **bằng chứng trực tiếp** rằng thiếu hình là nguyên nhân tái phạm, và
  vì nó rẻ nhất: ba ca đã có ảnh và có phán quyết của Hoà, chỉ cần chú giải.
- **B sau A** vì người chấm cần **cái để chỉ vào**; chấm bằng chữ suông sẽ đẻ nhận xét chung chung
  — đúng thứ `06-AUDIT` đang chê.
- **C đi kèm B, không thay B**: máy soi chỉ nên nhận **những luật đo bằng chuỗi/số** (cỡ icon, nét,
  `uppercase` trên chuỗi có dấu, `leading-tight`, token thay số cứng). Đẩy H-0 hay thứ bậc vào máy
  sẽ ra guard giả — đúng bài học F-06 (guard clear bằng cách sửa comment) và F-13 (pattern khớp
  prose). Ưu tiên rule đầu tiên: **`uppercase` + chuỗi có dấu** — nó bắt đúng lỗi vừa phạm hôm nay
  và tất định hoàn toàn.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM — bắt buộc khai
1. **Không mở app thật một lần nào** trong phiên này. Mọi con số hình ảnh đều trích từ tài liệu đo
   sẵn (`01-CLINICAL-UI-AUDIT` đo trên `:3778` ngày 22/08 — và chính nó khai **phiên chưa đăng
   nhập**, Home hạng **BLOCKED**). Nên các mốc kiểu *"canvas 2D 93% bề ngang"* là **chép lại một
   phép đo cũ**, không phải phép đo của tôi.
2. **Bộ 10 app trong `professional-workspaces.md`**: chỉ **4 app** có khảo sát thật trong repo
   (3ds Max · Blender · Rhino · SketchUp). Sáu app còn lại (Photoshop · Illustrator · Figma · C4D ·
   AutoCAD · Revit · Resolve · Unreal) tôi **không khảo trong phiên này** — luật rút ra là diễn
   giải, đã dán nhãn trong tệp nhưng vẫn cần Hoà/Claude Design soi lại.
3. **Findlater CHI 2004** (adaptable > adaptive, 55%) — tôi **chép từ `SPEC-PANEL-ROLLOUT §1`**,
   **không tự tra bài gốc**. Đúng bài học 15/08: phê bình đúng vẫn phải trích đúng dòng.
4. **Số WCAG** (4.5:1 · 3:1 · 1.4.11 · 1.4.12) là kiến thức chuẩn tôi khai từ hiểu biết, **không
   fetch spec W3C trong phiên này**. Nếu cần dùng làm căn cứ nghiệm thu chính thức thì phải tra lại.
5. **Nợ 31 chỗ thiếu `focus-visible`** (số ghi trong sổ 15/08) — tôi **chưa đối chiếu lại**. Đo thô
   hôm nay: 75 nơi có `focus-visible` trong `app/`+`components/`, nhưng con số đó **không nói được**
   còn thiếu bao nhiêu. Đã ghi rõ "chưa kiểm" trong `accessibility.md`.
6. **`--success` tối 2,51:1 · 6 chỗ trong mocks** — chép lại từ sổ, **chưa quét lại**, và bản gốc
   đã tự khai đó là **SÀN không phải TRẦN** (4 dạng chưa phủ). Đã giữ nguyên cảnh báo đó.
7. **`soi:tu-dien` ra 205 hay 212 chỗ chữ trần** — hai con số trong sổ ở hai thời điểm; tôi
   **không chạy lại máy soi** trong phiên này nên viết là "205–212".
8. **Chưa chạy `npm run soi:foundation` / `tsc` / `test`** — phiên này chỉ viết tài liệu, không
   đụng mã sản phẩm, nên không có gì để hồi quy. Nhưng cũng có nghĩa: **các lệnh tôi ghi trong mục
   §5 của từng module chưa được tôi chạy thử lần nào**; nếu tên script đổi thì chúng sai.
9. **Không dựng `examples/`, không dựng bộ định tuyến, không sửa `SKILL.md`.** Ba thứ đó nằm ngoài
   đề bài lần này — nhưng `SKILL.md` hiện **chưa trỏ tới 15 tệp mới**, nên chúng đang **mồ côi
   đúng kiểu `COMPASS` từng mồ côi 19 ngày**. Đây là rủi ro cao nhất của phiên, và nó cần một lượt
   nối con trỏ.
10. **Số dòng từng tệp** ở bảng §2.1 đo bằng `wc -l`, chính xác. **Nhận định "chưa từng có luật"**
    cho H-0 thì dựa vào `06-DESIGN-KNOWLEDGE-AUDIT` khai như vậy — tôi **không tự grep toàn repo**
    để xác nhận điều đó.
