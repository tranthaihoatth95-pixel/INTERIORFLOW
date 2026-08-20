# ICON — NGỮ PHÁP HÌNH (20/08)

> Nối tiếp `2026-08-20-NAV-TI-LE-ICON.md`. Hoà: **hiểu được từng cái, nhưng chưa cảm thấy là MỘT
> HỌ của IF**. Đây là siết ngữ pháp, không làm lại.
> Vùng ghi: `components/nav/**` · `components/ui/command-icon.tsx` · test cạnh đó. Server :3001
> dùng lại. Không đụng `BeMatNoi` · `useKeoBeMat` · `Vitals*` · `lib/ui/**` · `globals.css` ·
> `present-editor/**` · `print/**` · `CadSheets.tsx`.

---

## ① NGỮ PHÁP HÌNH — trục và thứ ĐO ĐƯỢC

Trục: **chữ nhật → chữ nhật bo → viên nang → tròn**. Mọi icon phải đọc ra là biến thể trên trục đó.

Thứ làm cột đọc ra một họ, và kiểm được bằng máy, là **BÁN KÍNH GÓC**. Đọc thẳng `iconNode` của
lucide đã cài — cả `rx` của `<rect>` lẫn bán kính cung `a<r> <r>` trong `path` (hai cách lucide bo):

| icon | Trang chủ | Dự án | Files | Thư viện | Soát duyệt | 2D | 3D | Trình chiếu |
|---|---|---|---|---|---|---|---|---|
| **bán kính trội** | **2** | **2** | **2** | **2** | **2** | **2** | **2** | **2** |

**Cả tám cùng r2 — một bán kính duy nhất.**

⛔ **`Blocks` bị loại BẰNG SỐ, không bằng cảm giác**: `rx: 1` — lệch nửa bán kính so với cả bộ. Đây
đúng loại lệch mà mắt thấy "sai sai" mà không chỉ ra được tên. Test khoá lại.

---

## ② ÁNH XẠ TÁM ICON

| mục | trước | **nay** | silhouette | vì sao đổi |
|---|---|---|---|---|
| Trang chủ | House | **House** | thân chữ nhật r2 + mái dốc | giữ — nhưng ⚠️ xem §④ |
| Dự án | Briefcase | **Folders** | HAI thư mục r2 xếp chồng | "hộp chứa dự án, **cùng họ với Files**" — đúng chữ Hoà. Cặp có quai là họ khác hẳn |
| Files | Folder | **Folder** | thư mục r2 | giữ — đơn giản nhất bộ |
| Thư viện | LibraryBig | **SquareStack** | ba ô vuông r2 chồng nhau | "chồng/khối/mô-đun". `LibraryBig` vẫn là **sách** — Hoà nói thẳng *"đừng dùng sách trang trí theo nghĩa đen nếu nó phá họ"*, và gáy nghiêng phá trục thật |
| Soát duyệt | FileCheck2 | **FileCheck2** | tờ r2 góc gấp + dấu kiểm | giữ — "tài liệu có quan hệ kiểm" |
| Thiết kế 2D | Grid2x2 | **Grid2x2** | chữ nhật r2 chia ô | giữ — **MẶT PHẲNG** |
| Thiết kế 3D | Box | **Box** | khối lập phương dây | giữ — **KHỐI** |
| Trình chiếu | Presentation | **Monitor** | chữ nhật r2 + chân | **MẶT ĐẦU RA**. `Presentation` là bảng treo chân xiên + nét nội dung — rời khỏi trục |

Độ phức tạp (số phần tử vẽ): `2 · 2 · 1 · 3 · 3 · 3 · 3 · 3` — dải **1-3**, không cái nào lệch hẳn.

⛔ **`FolderKanban` bị loại bằng số**: 4 phần tử, vượt trần 3 — nó nghĩa đúng nhất ("bảng dự án
trong thư mục") nhưng chính luật mình vừa dựng ở lượt trước chặn nó. Ghi lại vì đây là ca luật tự
chặn lựa chọn ưa thích của người viết luật — dấu hiệu luật đang chạy thật.

### ⭐ ĐẢO CHẶNG — MỘT TIẾN TRÌNH, không phải ba vật rời

```
Grid2x2      →      Box      →      Monitor
PHẲNG              KHỐI            MẶT TRÌNH BÀY
chữ nhật chia ô    chữ nhật đùn    chữ nhật đặt
                   lên có chiều    lên chân
                   sâu
```
Cả ba **cùng bắt đầu từ MỘT hình chữ nhật**: cái đầu chia ô, cái giữa đùn lên có chiều sâu, cái cuối
đặt lên chân. Đứng cạnh nhau thấy được một câu chuyện.
⛔ Đổi lẻ một trong ba là làm gãy câu chuyện — test khoá đúng bộ ba `grid-2x2,box,monitor`.

---

## ③ TRẠNG THÁI ĐANG MỞ — mấy kênh, và chứng minh KHÔNG dựa vào màu

🔴 **Gỡ một kênh SAI trước khi thêm kênh đúng.** Lượt trước tôi gỡ `strokeWidth={2}` rồi thay bằng
`netNhan` (1,75) khi đang mở — Hoà cảnh báo đúng: **vẫn là lấy NÉT làm kênh**, chỉ nhẹ tay hơn. Nét
là thuộc tính của HỌ; nét đổi thì icon đó thôi cùng bộ với hàng xóm. ⇒ nay **cả tám hàng nét 1,5
cứng**, đo được trên app: `stroke-width` toàn rail = `["1.5"]`, một giá trị duy nhất.

Trạng thái đi bằng **BỐN kênh**, ba trong đó không phải màu:

| # | kênh | đo được |
|---|---|---|
| ① | **nền tông nhẹ bo tròn** | `border-radius: 10px`, nền `rgba(106,87,245,.14)` |
| ② | **dấu chỉ hình dạng** — vạch dọc mép trái | `data-chi-dau="dang-mo"`, **2×18px** |
| ③ | **trợ năng** | `aria-current="page"` (đúng 1 hàng) |
| ④ | màu | *chỉ HỖ TRỢ* |

**Chứng minh "bỏ màu vẫn đọc ra" — tính bằng ĐỘ SÁNG, vứt hoàn toàn hue:**

| | độ sáng | tương phản XÁM với nền rail |
|---|---|---|
| nền rail | 0,9399 | — |
| nền hàng đang mở (đã trộn alpha .14) | 0,7744 | **1,20:1** |
| **dấu chỉ mép trái** | 0,1647 | **4,61:1** |

⇒ Nền một mình chỉ cho 1,20:1 — **đó chính là lý do dấu chỉ phải tồn tại**. Vạch 2px cho **4,61:1**
ở thang xám, tức in trắng đen hay mù màu hoàn toàn vẫn thấy rõ hàng nào đang mở. Đây là con số
biến câu "không dựa vào màu" thành thứ nghiệm thu được.

---

## ④ 🔴 MỤC CẦN GLYPH RIÊNG — khai thẳng

**TRANG CHỦ là mục duy nhất không nằm trọn trên trục.** Mái dốc của `House` là **hai đường chéo**;
trục chữ-nhật→bo→viên-nang→tròn không có đường chéo.

Đã rà hết ứng viên lucide cho nghĩa "nhà/xưởng":

| ứng viên | vì sao không |
|---|---|
| `House` | mái dốc = 2 đường chéo |
| `Warehouse` | mái cong + là toà nhà |
| `Building*` | Hoà đã loại (toà nhà chi tiết) |
| `LayoutGrid` / `LayoutDashboard` | **đúng trục** nhưng Hoà đã loại — ngôn ngữ dashboard |

⇒ **Không có ứng viên trong họ. Muốn trục tuyệt đối thì cần GLYPH RIÊNG của IF** — khung chữ nhật
bo r2 + **mái PHẲNG** (hoặc khung cửa). Đó là việc của cửa thiết kế native, **tôi không tự vẽ**.
Tạm giữ `House`: vẫn r2, vẫn viền đơn sắc, chỉ lệch ở silhouette.

*(`Box` cũng có đường chéo — nhưng đó là **bắt buộc về nghĩa**: một khối lập phương không tồn tại
mà không có cạnh chéo, và chính chiều sâu đó là thứ làm nó thành nấc "KHỐI" của tiến trình. Khác
hẳn ca Trang chủ, nơi đường chéo chỉ là quy ước vẽ nhà.)*

---

## ⑤ TÂM QUANG HỌC — đo, không ước

Icon đặt trong **ô 20×20 cố định** (`data-o-icon`) thay vì thả trần — hình lucide cái vuông cái dẹt,
thả trần thì tâm mỗi hàng lệch một kiểu và cả cột đọc ra "nhặt từ nhiều bộ".

Đo cả tám trên app thật (rail 240, `/projects/<id>/cad`):

```
tâm quang học : 119.50 (MỘT giá trị duy nhất cho cả 8)
lệch tối đa   : 0.00 px
khung         : 20×20  (đồng nhất)
hình          : 18     (đồng nhất)
nét           : 1.5    (đồng nhất — không còn kênh nét theo trạng thái)
```

---

## ⑥ MÁY KIỂM

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | 0 lỗi vùng này (2 lỗi `vitest` của lane khác vẫn còn, untracked) |
| `muc-dieu-huong.test.ts` | **✅ ĐẠT toàn bộ** — khuôn nhà `sucrase-node`, **không vitest** |

**Nhóm [9] mới — khoá ngữ pháp hình:**
- **bán kính góc nhất quán**: bán kính trội của cả 8 phải `= 2`;
- **tiến trình phẳng→khối→mặt**: đảo CHẶNG phải đúng `grid-2x2,box,monitor`;
- **trạng thái không chỉ dùng màu**: nguồn rail phải có `strokeWidth={HE_BIEU_TUONG.net}` và
  **không** còn `strokeWidth={dangMo ?` · phải có `data-chi-dau="dang-mo"` · `aria-current` ·
  nền `--accent-soft`;
- **tâm quang học**: phải có ô đặt icon cố định (`data-o-icon`).

Nhóm [8] mở rộng danh sách loại-đích-danh: `layout-grid` · `building-2` · `library` ·
**`library-big`** · **`blocks`** · **`folder-kanban`** · **`presentation`** · `shield-check` —
mỗi cái kèm lý do, khoá bằng **tên tệp** nên đổi icon là phải cãi lại chỗ này.

⚠️ **Bẫy gặp khi viết test, suýt cho kết quả sai**: lucide ghi `rx: "2"` **có ngoặc kép**; regex
`rx:\s*([0-9.]+)` trả **rỗng** cho đúng ba icon rect-thuần (`grid-2x2` `monitor` `square-stack`) —
tức im lặng bỏ qua thứ cần kiểm nhất. Đã thêm `"?`. Cùng họ với bẫy đếm phần tử lượt trước: **regex
bám sát nguồn của bên thứ ba là chỗ test hay mù nhất.**

---

## ⑦b — CHƯA CHẮC / CHƯA KIỂM

1. **`Folders` có một cung `a1.5 1.5`** bên cạnh các cung `a2 2` (bán kính **trội** vẫn là 2, test
   đo theo trội). Ở 18px chênh 0,5 đơn vị lưới là dưới ngưỡng nhìn, nhưng **không phải r2 tuyệt
   đối** — khai để không ai tưởng cả 8 sạch 100%.
2. **"Cảm thấy là một họ" chưa có ai xác nhận bằng mắt.** Bán kính · nét · khung · tâm là các thước
   **gián tiếp**. Chúng loại được cái sai, **không chứng minh được cái đúng**. Cửa nghiệm thu thật
   vẫn là Hoà nhìn cả cột.
3. **Ảnh chụp không dùng được** — pane trình duyệt render nội dung vào góc ~184×120 của khung
   800×500. Toàn bộ số là đo DOM. ⇒ **Chưa có ảnh cả cột cho Hoà duyệt** — đây là thiếu sót thật
   của lượt này so với cửa nghiệm thu phiếu yêu cầu.
4. **Chỉ đo ở nấc 240, theme sáng, `/cad`.** Chưa đo tâm quang học ở nấc 52 (justify center — công
   thức khác) và nấc 320; chưa đo theme tối.
5. **Sự cố tự gây, đã sửa, phải khai**: lúc thay khối chú thích icon bằng script, tôi cắt nhầm cả
   khối `BE_RONG_NAC`/`NacRail`/`nacKe`/`CumRail`/`MucRail` nằm giữa hai mốc thay thế — tsc bắt
   ngay, đã dựng lại đủ và tsc + test xanh lại. Không có gì mất, nhưng đây là **lỗi của tôi**:
   thay khối bằng chỉ số dòng/mốc chuỗi mà không kiểm phần nằm giữa.
6. **Lane khác vẫn đang biên dịch song song** — có lượt chunk cũ báo `NAC_MAC_DINH is not defined`
   sau khi hằng số đó đã bị xoá khỏi nguồn (grep = 0). Số ở báo cáo là số đo sau khi
   `visibility: visible`.

## ⑦c — HẠN DÙNG

Bảng bán kính/phần tử hết hạn khi nâng `lucide-react` — test [8]/[9] sẽ báo đỏ, đó là chỗ biết.
Số tương phản xám phụ thuộc `--accent` và `--accent-soft`: **lane vật liệu đang ghi token trong
`app/globals.css`** ⇒ nếu accent đổi, đo lại 4,61 và 1,20.

## ⑧ ⛳ NỢ

- **Glyph riêng cho Trang chủ** (khung r2 + mái phẳng) — cửa thiết kế của Hoà.
- Ảnh cả cột 8 icon để duyệt mắt (pane hiện không chụp được).
- Đo tâm quang học ở nấc 52 và 320; đo theme tối.
- `HE_BIEU_TUONG` mới phủ rail + `CommandIcon`; toolbar khác vẫn gõ `size`/`strokeWidth` tại chỗ.
