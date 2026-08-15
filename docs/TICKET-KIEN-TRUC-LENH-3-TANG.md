# TICKET · KIẾN TRÚC LỆNH 3 TẦNG — lệnh chung dùng chung, lệnh sâu gói thành THƯ MỤC

> Hoà đặt bài 15/08: *"sử dụng chung những tool chung như nhau, còn lại gói tool thành 1 nhóm lệnh
> — giống thư mục của Apple chứa group icon"* + *"học Blender: phần chung hay xài hiện trên
> toolbar, phần chuyên sâu bọc lại trong window tool mini làm bảng lệnh tuỳ chỉnh; trục phải là
> edit tuỳ biến sâu hoặc create điều mới."*
>
> T soạn 15/08 sau khi đo code thật. Ticket này **thay** phạm vi còn lại của L1 — phần vỏ nút đã
> xong (`96a3913`), phần dưới đây mới là ruột.

---

## 1 · ĐO HIỆN TRẠNG — vì sao 3 chặng "như 3 app"

Không phải tại bo góc. Tại **năm cuốn sổ lệnh sống song song, không cuốn nào biết cuốn nào**:

| # | Nguồn | Nội dung | Ai đọc |
|---|---|---|---|
| 1 | `lib/commands/registry.ts` | **55 CommandDef · 97 alias**, có `label` song ngữ, `key`, `aliases`, `when`, `group`, `surfaces` | chỉ `AppCommandPalette` |
| 2 | `components/cad/CadToolbar.tsx` | **10 mảng** tự khai (DRAW · DRAW_PRO · SHAPES2 · ARCH · EDIT · MEASURE · DIMENSION · ANNOTATE · DIAGRAM · MODIFY) | chỉ chính nó |
| 3 | `components/render-studio/ToolDock3D.tsx` | 6 nhóm · **16 phím tắt gõ cứng tại chỗ** | chỉ chính nó |
| 4 | `components/present-editor/Toolbar.tsx` | danh sách tự khai | chỉ chính nó |
| 5 | `components/CommandPalette.tsx` | đọc `NODE_DEFINITIONS` (node, không phải lệnh) | mount ở `HomeScreen:724` |

`grep "lib/commands"` trong **cả 3 thanh công cụ = 0**. Sổ lệnh chuẩn có sẵn mà không thanh nào dùng.
Và **hai bảng ⌘K cùng sống**: `AppCommandPalette` (`AppShell:185`) đọc registry · `CommandPalette`
(`HomeScreen:724`) đọc node.

### Hậu quả đo được — CÙNG một lệnh, ba cái tên, ba cái phím
| Lệnh | Sổ lệnh chuẩn | 2D toolbar | 3D dock |
|---|---|---|---|
| Xoay | `Xoay` · **RO** | `Xoay` · **RO** | `Xoay` · **Q** |
| Chép | `Sao chép` · **CO** | `Chép` · **CO** | **`Nhân bản`** · **D** |
| Đo | `Đo khoảng cách` · **DI** | `Đo nhanh` · **DI** | **`Thước`** · **T** |
| Chọn | — | `Chọn` · **Esc** | `Chọn` · **V** |
| Lật | `Đối xứng` · MI | `Lật` · MI | *(không có)* |

⇒ KTS học phím ở chặng 2D, sang 3D bấm sai. Đây **không phải chuyện thẩm mỹ, là chi phí học lại**
đánh vào tay người dùng mỗi lần đổi chặng — đúng cái Hoà gọi là "khó dùng".

---

## 2 · PHƯƠNG ÁN — MỘT SỔ LỆNH, BA MẶT TIỀN

Đúng luật nền *"một cỗ máy, nhiều mặt tiền"*: **không viết registry mới**. Nâng
`lib/commands/registry.ts` (đã có 55 lệnh, đúng hình dạng cần) thành nguồn duy nhất, rồi mọi mặt
tiền ĐỌC nó — thanh công cụ không còn sở hữu danh sách nào.

```
                    lib/commands/registry.ts   ← MỘT nguồn: id · label VI/EN · icon
                          (nâng cấp)              · key · aliases · when · group · stages
                                │
        ┌───────────────────────┼───────────────────────┬──────────────────┐
   ① THANH CHUNG          ② THƯ MỤC LỆNH          ③ MINI WINDOW      ⌘K + bảng ⌘/
   ≤9 lệnh, GIỐNG HỆT     gói theo `group`,        bảng thông số      (đã đọc registry —
   ở cả 3 chặng           mở ra lưới icon          của lệnh vừa gọi    chỉ cần bỏ bảng thứ 2)
```

Hai trường **thêm mới** vào `CommandDef` (additive, không phá 55 lệnh cũ):
- `stages: ('concept'|'render'|'present')[]` — lệnh này sống ở chặng nào. Lệnh chung khai đủ 3.
- `icon` — nay icon nằm rải trong toolbar; kéo về sổ để 3 chặng không thể vẽ khác nhau.

### Tầng ① — LỆNH CHUNG, giống hệt mọi chặng
Tiêu chí vào tầng ①: **hành vi giống nhau ở cả 3 chặng** (không phải "hay dùng"). Đề xuất 9:

`Chọn` · `Dời` · `Xoay` · `Chép` · `Lật` · `Xoá` · `Hoàn tác/Làm lại` · `Đo` · `Chữ`

Cùng icon · cùng nhãn · **cùng phím** ở 2D, 3D, Trình chiếu. Chặng nào chưa có engine cho một lệnh
thì hiện **mờ kèm lý do thật** (§9 cấm nút giả) — KHÔNG giấu đi, vì giấu là lại đẻ ra "mỗi chặng
một bộ nút".

### Tầng ② — THƯ MỤC LỆNH (ý Apple folder của Hoà)
Lệnh chuyên sâu của từng chặng **không nằm rải trên thanh** mà gói thành **ô thư mục**:

- **Mặt ô**: 1 icon lưới 2×2 ghép từ 4 icon đầu bên trong (đúng cách thư mục iOS xem trước nội
  dung) + nhãn nhóm. Ô thư mục **cùng cỡ, cùng bo** như chip lệnh — không phải nút lạ.
- **Bấm** → popover **lưới icon** (không phải danh sách dọc), mỗi icon có nhãn dưới + phím tắt góc.
- **Gõ phím tắt của lệnh bên trong vẫn chạy thẳng, không cần mở thư mục** — thư mục là lối cho
  người chưa thuộc, phím là lối cho người thạo. Hai tầng, một registry (luật gói-tác-vụ-2-tầng).
- Nguồn nhóm: `group` đã có sẵn trong registry (`edit@1`, `dim@2`…) — **không phải khai lại**.

Thư mục đề xuất: **2D** Vẽ · Cấu kiện · Sửa · Đo & Ghi chú · Sơ đồ — **3D** Dựng khối · Biến đổi ·
Đồ đạc · Đo — **Trình chiếu** Chữ · Ảnh · Hình · Trang.

### Tầng ③ — MINI WINDOW + TRỤC PHẢI (ý Blender của Hoà)
Hoà tả đúng hai thứ khác nhau của Blender, IF phải tách y hệt:

| Blender | Việc gì | IF làm sao |
|---|---|---|
| **Adjust Last Operation** (F9, panel nhỏ nổi góc dưới sau khi chạy lệnh) | chỉnh **thông số của lệnh VỪA chạy**, xem đổi ngay | 🔴 **IF CHƯA CÓ** — đây là món mới, giá trị cao nhất ticket này |
| **N-panel / Properties** (trục phải) | edit sâu vật thể · **modifier stack** (create điều mới) | ✅ đã có: Inspector ổ ④ `AppShell` + `BuildRecipe`/`BuildOp` (stack không phá huỷ) — **chỉ cần nối**, không xây |

⇒ **Mini window "Chỉnh lệnh vừa chạy"**: sau mỗi lệnh có tham số (Offset · Fillet · Array · Divide
· Hatch…), hiện panel nhỏ ngay cạnh chỗ vừa thao tác: các ô số của chính lệnh đó, sửa là hình đổi
theo, `Esc` bỏ. Nó **giết đúng một painpoint thật**: nay muốn đổi khoảng cách offset phải Undo rồi
làm lại từ đầu.
⇒ **Trục phải giữ đúng vai Blender**: Inspector = edit sâu đối tượng đang chọn; `BuildRecipe` =
create/stack. **Không** nhồi tham số-lệnh-vừa-chạy vào đây — đó là việc của mini window; trộn vào
là mất luôn cái hay của Blender (thông số ở gần tay, không phải bay mắt sang mép phải).

---

## 2b · BA BỔ SUNG HOÀ ĐƯA THÊM 15/08 — đều cùng một trục

### (a) Photoshop: tổ chức bằng NHÓM LỆNH — và chọn khuôn nào cho IF
PS gom tool thành **ổ có tam giác góc** (Lasso · Marquee · Healing…): mặt ổ hiện **lệnh dùng gần
nhất**, giữ/bấm tam giác thì xổ các anh em cùng ổ. Khác thư mục iOS ở một điểm quan trọng:

| | Thư mục iOS | Ổ nhóm Photoshop |
|---|---|---|
| Mặt ô hiện gì | lưới 2×2 xem trước **cả nhóm** | **một lệnh** — cái vừa dùng |
| Bấm thẳng vào ô | mở thư mục | **chạy luôn lệnh đó** |
| Hợp với | nhóm **chưa thuộc**, cần nhìn để nhớ | nhóm **dùng liên tục**, tay đã quen |

⇒ **T đề xuất dùng CẢ HAI, chia theo tần suất, không chọn một:**
· nhóm dùng liên tục (Vẽ · Sửa · Biến đổi) → **khuôn PS**: mặt ô = lệnh vừa dùng, bấm là chạy,
  góc có tam giác để xổ. Tay thạo không mất cú bấm nào.
· nhóm tra thỉnh thoảng (Sơ đồ · Ghi chú · Trang) → **khuôn iOS**: lưới 2×2, bấm là mở.
Cùng một `group` trong registry, chỉ khác `openStyle` — không đẻ hai cơ chế.

### (b) MỌI EDITOR SÁNG TẠO XÀI CHUNG BỘ TOOL — **kể cả Vẽ 3D**
> Hoà 15/08: *"nhóm tool chính sử dụng chung cho tất cả các editor sáng tạo, bao gồm cả vẽ 3D, vì
> những editor này thực chất đều có lệnh 2D 3D tương ứng cả."*

Đây là **dạng mạnh nhất** của luật một-cỗ-máy-nhiều-mặt-tiền, và nó đúng: cùng một ĐỘNG TÁC NGHỀ
tồn tại ở mọi editor, chỉ khác vật bị tác động. Đối chiếu bằng code thật đang có:

| Động tác | 2D (`CadToolbar`) | 3D (`ToolDock3D`) | Đồ hoạ/ảnh (`present-editor`) |
|---|---|---|---|
| Dời · Xoay · Chép | move · rotate · copy | move · rotate · dup | kéo · xoay · nhân bản |
| Đối xứng | mirror (MI) | *(thiếu)* | lật ngang/dọc |
| Lặp theo lưới | arrayrect (AR) | *(thiếu)* | *(thiếu)* |
| Bo/vát góc | fillet · chamfer | fillet *(mờ)* | bo góc shape |
| Cắt/hợp khối | trim · extend | cut/boolean *(mờ)* | pathfinder/mask |
| Giãn ra ngoài | offset (O) | *(shell — thiếu)* | offset path |
| Đùn lên chiều mới | *(2D→3D)* | pushpull | *(không có)* |

⇒ **Một lệnh, nhiều bộ thi hành.** `CommandDef` mang `run` **theo ngữ cảnh** (`runFor: { cad2d,
model3d, graphic }`) — cùng `id` · cùng nhãn · cùng icon · cùng phím, chỉ khác kẻ thực thi. KTS học
`MI` một lần, dùng được ở bản vẽ, ở khối 3D, ở slide.

Ba cái lợi đo được ngay từ bảng trên, ngoài chuyện đồng bộ:
1. **Lộ ra lỗ trống có thật**: 3D thiếu Đối xứng và Lặp-lưới — hai lệnh dựng nội thất dùng liên
   tục (4 chân ghế, dãy tủ, nan chớp). Trước khi có bảng này thì không ai thấy nó thiếu.
   *(Trùng đúng chỗ `mirror-doi-xung-chuan-net` vừa làm ở tầng thuật toán — nay lộ ra là ở tầng
   LỆNH người dùng cũng chưa có nút.)*
2. **Ô trống = việc còn nợ**, đúng LUẬT §9 (giao diện là cây gia phả nhìn thấy được của tính năng).
3. Editor nào cũng "đầy tay" mà **không nơi nào phải viết lại tool**.

Phần đặc thù (keyframe video · PBR vật liệu · dimension bản vẽ) là **Smart Tool ngữ cảnh THÊM
VÀO**, không phải bộ tool riêng.
⇒ Nối thẳng entry `present-chinh-hinh-tai-cho` (vốn đã ghi "GOM engine ĐÃ CÓ, không engine mới").

### (c) Chặng 2: Node mode ↔ 3D mode — QUY VỀ MỘT LOGIC, GIỮ HAI LỐI THAO TÁC
**T đọc ý Hoà là:** hai mode không phải hai bộ tính năng, mà là **hai cách thao tác trên CÙNG một
bộ lệnh** — một bên node-graph kiểu ComfyUI, một bên giao diện tool truyền thống.
*(Nếu ý anh là bỏ hẳn một mode thì nói, tôi sửa — nhưng bỏ mode sẽ đụng chốt 13/08 "chặng 2 chỉ
Canvas + Vẽ 3D", nên tôi không tự suy sang hướng đó.)*

Hệ quả nếu đúng cách đọc trên: **một sổ lệnh, hai lối vào**, y hệt tầng ①②③ của ticket này —
"Đổi vật liệu" là MỘT lệnh, ở Node hiện thành node, ở 3D hiện thành nút trên thanh. Không được để
mỗi bên có một tập lệnh riêng, vì đó chính là bệnh đang đo được ở mục 1.
Việc cụ thể: đối chiếu `NODE_DEFINITIONS` ↔ lệnh mode 3D, tìm cặp **cùng bản chất khác tên**
(giống Xoay RO/Q), gộp về một `CommandDef` có hai `surfaces` (`node` và `toolbar`).
⚠️ Đây là bước **rộng nhất** ticket — xếp **B5**, sau B1-B2, vì phải có sổ chung trước mới đối
chiếu được.

### (d) Ví dụ chuẩn của TẦNG ③ — xưởng hoa văn parametric
> Hoà 15/08: *"những gì dựng chuyên sâu như bản parametric thiết kế mảng hoa văn, phục vụ việc in
> giấy dán tường, để render trong 3D luôn."*

Đây đúng là hình mẫu **master node / mini-tool sâu** — thứ KHÔNG được nhét vào thanh công cụ
chung, và cũng KHÔNG được đẻ thành một app con rời. Nó là một cửa sổ tool sâu, nhưng **đầu ra rơi
thẳng vào các đường đã có**:

```
   Thẻ DNA / motif có nguồn ──► XƯỞNG HOA VĂN (master node, tham số hoá)
   (chốt Design DNA 10/08)         lặp · đối xứng · bước · đảo màu · liền mạch
                                              │  công thức = BuildRecipe (sửa lại được, không phá huỷ)
                    ┌─────────────────────────┼──────────────────────────┐
              🖨  IN GIẤY DÁN TƯỜNG      🎨 matId → PBR           📐 hatch 2D
              khổ thật · ≥300dpi         dán lên tường,          ký hiệu trên
              (LUẬT-300DPI)              render 3D ngay          mặt bằng/khai triển
                    └─────────────────────────┼──────────────────────────┘
                                        💰 BOQ: m² → số cuộn (wastagePercent đã có)
```

Ba điều đáng nói:
1. **Không cần engine mới cho phần lõi**: tham số hoá = `BuildRecipe`/`BuildOp` (stack không phá
   huỷ, đã có) · panel thông số **tự sinh từ định nghĩa** = `IF-RNA` (đã chạy thật ở MaterialPbr) ·
   đầu ra vật liệu = `matId`/`MaterialPbr` (đã có) · cửa in = LUẬT 300dpi (đã có).
2. **Đây là chỗ một-nguồn ăn tiền nhất**: đổi bước lặp hoa văn → ảnh render đổi · bản in đổi ·
   ký hiệu 2D đổi · **số cuộn trong BOQ đổi**. Revit/SketchUp/D5 không có đường này vì hoa văn với
   họ là một file ảnh chết mang từ ngoài vào.
3. **Ranh giới phải giữ**: lệnh CHUNG (dời/xoay/đối xứng/lặp lưới) vẫn là lệnh chung của tầng ①
   dùng ngay trong xưởng — xưởng chỉ sở hữu phần THẬT SỰ riêng (liền mạch tile, khổ in, chồng
   màu). Nếu xưởng tự vẽ lại nút "đối xứng" của riêng nó thì ta lại đẻ ra cái bệnh mục 1.

⇒ Chưa xếp vào B1-B5 (đây là **tính năng mới**, không phải dọn kiến trúc). Mở entry riêng
`xuong-hoa-van-parametric`, thi công **sau B1-B2** để nó sinh ra đã đúng khuôn 3 tầng, không phải
sửa lại lần hai.

---

## 3 · KHÔNG ĐẺ MÁY MỚI — nối vào 3 entry đã mở
| Entry sẵn có | Ticket này là gì của nó |
|---|---|
| `hotkey-registry` (chốt 10/08, chưa thi công) | **chính là phần lõi** — một registry lệnh+phím, tooltip/⌘K/bảng ⌘/ chung nguồn |
| `kien-truc-tool-3-lop` (Hoà chốt 13/08) | ticket này là **bản thi công cụ thể** của 3 tầng đó |
| `toolbar-mot-khuon` (15/08, vỏ nút — XONG) | nền: đã có một họ nút để mọi mặt tiền vẽ giống nhau |

⇒ Gộp làm **một chuỗi**, không mở entry thứ tư cho cùng một cỗ máy.

---

## 4 · LỘ TRÌNH — 4 bước, mỗi bước tự đứng được
| Bước | Việc | Vì sao thứ tự này |
|---|---|---|
| **B1** | Nâng `CommandDef` (+`stages`, +`icon`) · khai đủ **9 lệnh chung** · **hợp nhất phím phân kỳ** (Xoay Q→RO, Chép D→CO, Đo T→DI, Chọn V/Esc) | Sổ phải đúng trước khi ai đọc nó. Đây cũng là bước **đổi phím tay người dùng đang quen** ⇒ phải đi trước, một lần |
| **B2** | 3 thanh công cụ **đọc registry** thay cho 10+6+1 mảng tự khai; xoá danh sách cũ | Bỏ nguồn song song. Sau bước này, thêm một lệnh = sửa 1 chỗ |
| **B3** | **Thư mục lệnh** (ô lưới 2×2 → popover lưới icon) | Chỉ làm được khi `group` đã là nguồn thật (B2) |
| **B4** | **Mini window "Chỉnh lệnh vừa chạy"** + nối trục phải Inspector/BuildRecipe | Món giá trị cao nhất, nhưng đứng trên B1-B2; làm sớm là xây trên cát |
| **B5** | Gộp bộ tool **đồ hoạ/ảnh/video** về một bộ (2b-b) · đối chiếu **Node ↔ 3D** gộp lệnh cùng bản chất (2b-c) | Rộng nhất, phải có sổ chung (B1-B2) mới đối chiếu được cặp trùng |

Kèm dọn: **bỏ bảng ⌘K thứ hai** (`CommandPalette` đọc NODE_DEFINITIONS) — gộp về `AppCommandPalette`.

## 5 · RỦI RO — nói trước
1. **B1 đổi phím tắt người dùng đang quen** (3D: Q·D·T·V). Chấp nhận vì càng để lâu càng đắt, và
   IF chưa có người dùng ngoài. Đổi kèm dòng nhắc một lần trong app.
2. **`when` hiện chỉ hiểu `KEY==VALUE`** (`registry.ts` parser nhỏ, cố ý). Thêm `stages` phải nằm
   trong khuôn đó, không nâng parser thành ngôn ngữ biểu thức.
3. **Thư mục thêm một cú bấm** cho lệnh sâu. Bù bằng: phím tắt vẫn chạy thẳng + ⌘K + thư mục nhớ
   lệnh dùng gần nhất.
4. **Không làm**: thanh công cụ tuỳ biến kéo-thả (Blender có, IF chưa cần — chưa có người dùng nào
   than thiếu; xếp sau khi có vòng người dùng thật).

## 6 · NGHIỆM THU
Máy: một lệnh chung → grep ra **đúng 1 nơi khai** · `soi:frontier`/`soi:tu-dien` 0 lệch · tsc/test.
**Mắt (thước thật)**: mở 2D → 3D → Trình chiếu, **9 lệnh chung đứng cùng chỗ, cùng icon, cùng phím**;
bấm một thư mục thấy lưới icon; chạy Offset rồi **sửa số ngay tại mini window, không Undo**.
