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
