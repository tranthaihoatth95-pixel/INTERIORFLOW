# Phân luồng trí nhớ — cái nào ra cái đó

`Plane: BOS` · Hoà chốt 28/08

> *"cái nào ra cái đó. Trí nhớ bị trộn thì ta phải tìm cách để phân luồng. Cái người người dùng
> chung thì ta phải cất ở một chỗ, đặt tên bằng quy ước mà ai cũng có thể dùng."*
>
> **LOOK INSIDE (B25):** quy ước **đã có** — `IF-ADVICE-VERIFICATION-GATE.md:42` khai
> `Plane : IF | AN | IDF | BUILDER | CLIENT-TTT`. Tệp này **dùng lại nó**, không đẻ quy ước thứ hai.
> Đây là tệp **đầu tiên** mang đúng tiền tố mới, để làm mẫu.

## Chỗ trộn — đo được 28/08

**11/17 tệp trong `docs/control/` là luật NGƯỜI XÂY, không phải luật sản phẩm** — mà **tất cả**
mang tiền tố `IF-`. Tên đang nói dối tuyến. Phiên mới đọc `IF-CURRENT-STATE` tưởng đang đọc trạng
thái **sản phẩm**; thật ra đang đọc trạng thái **công trường**.

## Năm tuyến — cái nào ra cái đó

| Mã | Tuyến | Chứa gì | Sống ở đâu | Ai sửa |
|---|---|---|---|---|
| `IF` | **Sản phẩm** | IF là gì · luật bền · kiến trúc · hợp đồng định dạng | `docs/` trong repo | MAIN sau khi Design/Hoà duyệt |
| `BOS` | **Người xây** (Builder OS) | cách agent làm việc · sổ lỗi · cổng · mốc · trạng thái công trường | `docs/control/` trong repo | MAIN |
| `HOA` | **Hoà & đội** | việc công ty · người · dự án thật · ghi chú | **`~/PROJECT/`**, ngoài repo | Hoà (agent chỉ ghi khi được mời) |
| `RAW` | **Bản ghi thô** | 109 phiên · 1,3 GB nguyên văn | `~/.claude/projects/…` | không ai — chỉ đọc |
| `CLIENT` | **Dữ liệu khách** | hồ sơ · ảnh · tên khách | **ngoài repo**, nơi có quyền | Hoà |

**Luật cứng:** `CLIENT` **không bao giờ** vào repo. `HOA` **không** vào repo. `RAW` **không** chép
vào repo — chỉ trỏ bằng mốc (`IF-MOC.md`).

## Quy ước tên — ai cũng dùng được

```
<MÃ TUYẾN>-<câu hỏi tệp trả lời>.md
```

`BOS-PHAN-LUONG-TRI-NHO.md` ✅ · `IF-VI-SAO-CHUA-SHIP.md` ✅ · `AUDIT-DWG-2026-08-28.md` ❌

Không nhớ mã nào thì hỏi **một câu**: *"tệp này hỏng thì SẢN PHẨM sai, hay CÔNG TRƯỜNG sai?"*
Sản phẩm sai ⇒ `IF`. Công trường sai ⇒ `BOS`.

## Đổi tên 17 tệp cũ? **KHÔNG.**

Đổi tên hàng loạt là gãy mọi tham chiếu — lớp lỗi **B** (*đúng thao tác, sai đối tượng*), và
`IF-CURRENT-STATE`/`IF-CANONICAL` đang được trỏ tới từ `CLAUDE.md` và hàng chục tệp khác.

Thay vào đó, **phân biệt rồi xử lý** (đúng luật trung tính Hoà dạy 28/08): mỗi tệp mang **một
dòng khai tuyến** ngay đầu tệp. Tên giữ nguyên, tuyến trở nên **máy đọc được**:

```
`Plane: BOS`
```

Tệp mới thì đặt tên theo quy ước. Tệp cũ đổi tên **chỉ khi** đã có việc phải sửa nó, và đổi **một
tệp một lần**, kèm sửa mọi chỗ trỏ tới. **Kho tự dọn theo nhu cầu, không dọn theo lịch.**

## Cổng

`soi:quan-tri` luật **L7** — mọi tệp trong `docs/control/` phải khai `Plane:` trong 15 dòng đầu.
Vàng, không đỏ: thiếu khai là *chưa phân loại*, không phải *sai*.

---

## Bảng mã luật — luật nào thuộc tuyến nào

> Hoà 28/08: *"phần luật có vẻ cứ lẫn lẫn giữa luật design system, luật vận hành, luật làm việc
> của đội build. Và việc tôi không thấy nhắc mã hoặc tên chủ đề trước câu trả lời — tôi biết cái
> đó chưa được thực thi theo luật trung tính vừa bàn → là mầm mống lẫn lộn cho tương lai."*
>
> Đúng cả hai vế. Tuyến đã khai cho **tệp**; **hệ mã luật** thì chưa, và **câu trả lời** thì chưa.

### 🔴 Hai vụ đụng mã — đo 28/08

| tiền tố | nghĩa 1 | nghĩa 2 | hậu quả |
|---|---|---|---|
| **`F-*`** | **23 lỗi đã trả giá** — `F-15` · `F-22` · `F-23`, sổ `02-FAILURE-LEDGER.md` | **7 họ luật nền** — `F-NHAN-BIA` · `F-ICON-STROKE`, bánh cóc `foundation-tran.json` | một cái là **quá khứ**, một cái là **luật đang sống** |
| **`T-*`** | **8 luật trật tự** — `T2` · `T6`, `IF-TRAT-TU-MOI.md` | **3 trần bánh cóc** — `T-keydown-ne-o-nhap` | một cái là **luật**, một cái là **hạn nợ** |

**Chưa đổi mã ngay** — đổi tiền tố là gãy mọi tham chiếu (lớp lỗi B), và `F-*` đã nằm trong 23 mục
sổ lỗi cùng hàng chục chỗ trỏ tới. Xử đúng cách đã dùng cho tên tệp: **phân biệt bằng bảng, không
bằng đổi tên.** Mã mới thì tránh hai tiền tố này.

### Bảng đầy đủ

| mã | số | nghĩa | sổ | tuyến |
|---|---|---|---|---|
| `M-*` | 42 | sai lầm **thiết kế** đã trả giá | `IF-UXUI-OPERATING-MEMORY.md` | **IF** — sai về sản phẩm |
| `F-01…F-23` | 23 | sai lầm **thi công** đã trả giá | `02-FAILURE-LEDGER.md` | **BOS** — sai về công trường |
| `F-<TÊN>` | 7 | **họ luật nền** đang sống + bánh cóc | `foundation-tran.json` | **IF** — ràng buộc lên sản phẩm |
| `T-<tên>` | 3 | **trần nợ** thao tác | `foundation-tran.json` | **IF** |
| `T1…T8` | 8 | **luật trật tự** làm việc | `IF-TRAT-TU-MOI.md` | **BOS** |
| `L1…L7` | 7 | luật máy quản trị | `soi-quan-tri.mjs` | **BOS** |
| `B25` · `N8` | 2 | luật nền cách làm | `CLAUDE.md` | **BOS** |
| `IF-DEC-*` · `EV-*` · `DISS-*` | — | thẻ quyết định + bằng chứng | `IF-ADVICE-VERIFICATION-GATE.md` | **cả hai** — thẻ tự khai `Plane` |

**Cách đọc nhanh, không cần nhớ bảng:** *lỗi này nếu sửa thì sửa ở đâu?*
Sửa **mã sản phẩm** ⇒ tuyến `IF`. Sửa **cách đội làm việc** ⇒ tuyến `BOS`.

### Luật cho CÂU TRẢ LỜI — phần chưa ai thi hành

Tuyến khai cho tệp mà **không khai cho lời nói** thì lẫn lộn vẫn tiếp tục, chỉ là ở chỗ khác.

> **Mỗi lượt trả lời mở đầu bằng một dòng: `<TUYẾN> · <chủ đề>`**
> `BOS · làm bù` · `IF · nhập DXF` · `HOA · việc công ty` · `CLIENT · hồ sơ khách`

Một dòng, không giải thích. Người đọc nhìn dòng đầu là biết máy **đang đứng ở tầng nào** — và
biết ngay khi máy **đứng nhầm tầng**.
