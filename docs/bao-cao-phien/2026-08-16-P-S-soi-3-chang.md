# P-S · Báo cáo — soi giao diện ba chặng, đo "3 chặng như 3 app" bằng số

> Phiếu `docs/phieu-giao/P-S-soi-giao-dien-3-chang.md` · **ĐO, KHÔNG SỬA** — 0 dòng code đổi.
> Kết quả đầy đủ (bảng + `file:dòng`): **`docs/nc/NC-SOI-3-CHANG-2026-08-16.md`**.
> Khuôn 6 phần `docs/CLAUDE.md`.

---

## 1 · TỔNG QUAN

Soi cả ba chặng bằng cùng một bộ câu hỏi, rồi biến hai lời chê của Hoà thành số:
**"3 chặng như 3 app"** = **5 bản dựng lại trên 7 ổ của `AppShell`** (khớp ổ 43% · lệnh chung sống
được 63% · một-việc-cùng-chỗ 20% · component dùng chung cả ba 22%).
**"sketch với pro chả khác gì"** = Hoà **đúng về trải nghiệm, sai về cơ chế**: Chuyên có thật thêm
**29 lệnh** (51↔22) nhưng **5/6 ổ giao diện dùng chung một hằng số**, thứ đổi rõ nhất là **cỡ nút
×1,375**, và **~49% bề rộng thanh Chuyên nằm ngoài mép màn** với dấu hiệu duy nhất là vệt mờ 18px.

---

## 2 · CHI TIẾT TỪNG MỤC

### V1 · Bảng đối chiếu ba chặng — điểm đắt nhất
| | 2D | 3D | Trình chiếu |
|---|---|---|---|
| Navigator ② | `LayerPanel` 214 | cây khối/kệ node **280** | **placeholder chữ** (`PresentNavigator.tsx:53-60`) |
| Inspector ④ | ổ chung 236 | ổ chung 236 | **riêng 280, kéo 220–460** (`PresentEditor.tsx:2274`) |
| Toolbelt ⑤ | dùng | **không** — dock tự `absolute` (`ToolDock3D.tsx:176`) | **không** |
| Thanh tệp ⑦ | **trong canvas** (`CadEditor.tsx:693`) | ổ `toolbar` ✅ | **trong canvas** |
| Thanh công cụ | đáy giữa, nổi, 2 hàng | đáy giữa, nổi, 1–2 hàng | **trên cùng, in-flow, `flexWrap`** |
| Cửa vào việc | canvas trắng | canvas trắng / 2 nút | **thư viện mẫu 4 loại** ← tốt nhất |

🔴 Trình chiếu dựng lại **4/7 chỗ cắm** bên trong Stage ⇒ hai cột trái liền nhau **214+288 = 502px**,
cột ngoài rỗng. Ước tính diện tích canvas còn lại: 2D ~71% · 3D ~55% · **Trình chiếu ~33%**.

### V2 · Bốn phép đo, có công thức đo lại
| Phép đo | Số | Cách tính |
|---|---|---|
| A · khớp ổ | **3/7 = 43%** | đọc prop truyền vào `<AppShell>` ở 3 màn chặng |
| B · lệnh chung sống được | **19/30 = 63%** (cad 10 · 3D 7 · Present **2**) | `commonCommandsFor` + `bindStage`, đếm `enabled` |
| C · một việc, ba chỗ | **1/5 = 20%** | 5 việc chung, ghi chỗ đứng + tên + phím hiện |
| D · chia sẻ code | **2/9 component (22%)** · **2.205/36.608 dòng (5,7%)** | 1 lệnh grep import chéo |

Ở Trình chiếu **8/10 chip "lệnh chung" là chip mờ vĩnh viễn** — đúng luật §9 nhưng tầng đó gần như trống.

### V3 · Sketch ↔ Pro — 25 điểm rẽ, chia 3 nhóm
- ① **NĂNG LỰC** (11 chỗ): `MODIFY` 13 + `DIMENSION` 6 + `DIAGRAM` 3 + polar + Paper space +
  `PRO_ONLY_TOOLS` **30 tool** khoá cứng (`store.ts:184`) + kệ 2↔5. Đếm nút: **22 ↔ 51**.
- ② **ĐẦU VÀO bút/chạm** (8 chỗ): chống tì tay · cử chỉ 2 ngón · nhấn-giữ ra đĩa lệnh · `penUpAt` ·
  **`CadTouchDock` 9 nút chỉ mount ở Sơ phác** · safe-area · ẩn alias gõ.
- ③ **BỐ CỤC/CỠ** (6 chỗ): nút 44↔32 (×1,375) · icon 20↔17 · nút gạt 40↔30 · hàng 2 của dock ·
  `MaterialPalette` bottom 252↔120 · nhánh Paper.

### V4 · Hiến pháp — L1–L8 và 5 lệch mới
Còn: **L4 nguyên vẹn** (4 nút phơi mỗi thumbnail, `SlideStrip.tsx:136-153`, còn dùng `disabled`+`title`
đúng lỗi `ToolbarChip` vừa sửa 16/08) · **L1 nửa xong** (vỏ nút hợp nhất, vỏ thanh chưa) ·
**L2 nửa xong** (⌘K có; hint không có ở Trình chiếu; bảng ⌘/ vẫn nguồn thứ hai) · L6 nửa · L7 nửa · L8 nửa.
Chưa kiểm: L3, L5 (ngoài ba chặng).
Mới: **L9** Trình chiếu dựng lại 4/7 ổ · **L10** hai sổ phím song song (`registry.ts` 10 lệnh vs
`lib/shortcuts.ts` **76 entry**; `surfaces` khai mà 0 nơi đọc lúc chạy) · **L11** ⌘Z cài **5 nơi độc lập** ·
**L12** chặng 3D mount **hai bảng lệnh**, và cùng phím ⌘K mở bảng khác nhau tuỳ có đang gõ hay không ·
**L13** ba canvas chính không dùng `EmptyState` chung.

---

## 3 · TỔNG KẾT VẤN ĐỀ

"3 chặng như 3 app" **không phải chuyện thẩm mỹ**, và cũng không còn là chuyện vỏ nút (đã hợp nhất
15-16/08). Nó là chuyện **mỗi chặng cắm chức năng vào một ổ khác nhau**: cùng là "thanh tệp" mà 2D để
trong canvas, 3D để đúng ổ, Trình chiếu để trong canvas; cùng là "trục phải" mà hai chặng dùng ổ chung
còn một chặng dựng bản riêng rộng hơn, kéo được, không phím tắt. Người dùng đổi chặng phải **học lại chỗ
đứng**, không phải học lại nút.

Còn "sketch với pro chả khác gì" là **cùng một bệnh nhìn từ trong một chặng**: khác biệt có thật và rất
lớn, nhưng nằm ở phần thanh công cụ bị cuộn ra ngoài mép, nên thứ mắt bắt được chỉ còn cỡ nút.
⇒ Hai lời chê của Hoà là **một gốc bệnh: cái đúng thì có, nhưng không hiện ra đúng chỗ mắt nhìn.**

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt hơn tôi tưởng trước khi đo.** Tầng lệnh chung (B2, 16/08) đã đóng đúng gốc phân kỳ tên/icon/thứ tự:
ba thanh nay đọc chung `registry.ts`, và chỗ chưa chạy được thì **mờ kèm lý do thật** thay vì giấu —
đúng §9, và là thứ hiếm app nào chịu làm. `ToolbarChip` phủ cả ba chặng. NT-4 đạt ở cả ba.

**Chưa tốt.** Ổ vỏ vẫn ba kiểu; Trình chiếu là chặng lệch xa nhất và cũng là chặng **canvas hẹp nhất
(~33% màn)** trong khi nó là chặng để nhìn. Hai sổ phím song song khiến NT-10 chưa đóng dù ⌘K đã có.

**Rủi ro cần nói thẳng.** Việc "trả Trình chiếu về ổ chung" dễ bị đánh giá thấp: nó chặn ở `deck`/`current`
là state cục bộ trong `useEditor()` (`PresentEditor.tsx` 2.585 dòng) — `PresentNavigator.tsx:5-12` đã ghi
đúng lý do chưa làm từ 03/08. Và **ổ ④ ghim cứng 236px** trong khi Inspector Trình chiếu kéo được 220–460;
dời panel mà bỏ mất tính kéo là **đổi một lệch lấy một lệch**.

**Chỗ tôi yếu.** Không mở app (phiếu cấm) ⇒ ba nhóm số là ước tính từ hằng số mã (bề rộng thanh ±10%,
tỉ lệ diện tích canvas, và L12 suy từ thứ tự sự kiện DOM chứ chưa bấm thử). **Chặng 3D tôi quét nông
hơn hai chặng kia** — vùng `components/render-studio/**` đang do phiên khác giữ, tôi chỉ đọc dock/bố cục,
chưa đọc `Command3DPanel`, `ToolWindow`, và gần như chưa soi mode `3d/node`.

---

## 5 · HƯỚNG XỬ LÝ — HAI GÓC KHÁC NHAU

**Góc A — chữa VỎ trước (đồng bộ ổ).** Trả 4 chỗ cắm của Trình chiếu về `AppShell`, rồi dời dock 3D
vào ổ ⑤ và thanh tệp 2D vào ổ `toolbar`. Khớp ổ 43% → ~86%.
*Được:* đánh thẳng vào câu "3 như 3 app", trả lại ~290px bề ngang cho canvas Trình chiếu.
*Mất:* đắt và rủi ro cao nhất (phải nâng state của tệp 2.585 dòng); Hoà **không thấy gì mới**
trong 1-2 phiên đầu vì đây là việc dọn.

**Góc B — chữa cái MẮT THẤY trước (bày lệnh).** Gói 22 lệnh ít dùng của thanh 2D vào 3 nhóm xổ
(51 → ~24 nút, hết tràn), + cho phím tắt hiện ở cả ba chặng (~10 dòng).
*Được:* rẻ, thấy ngay, và chạm đúng hai câu Hoà vừa nói; dùng lại khuôn `MoreDrawButton`+`Popover` đã có.
*Mất:* không đụng gốc — Trình chiếu vẫn là bản dựng riêng, khớp ổ vẫn 43%.

---

## 6 · ĐỀ XUẤT — **GÓC B TRƯỚC, GÓC A CHẺ ĐÔI LÀM SAU**

Chọn B trước vì ba lý do đo được, không phải vì nó dễ:

1. **Đúng nút thắt đang siết nhất.** Sổ frontier hôm nay: **👁1 qua mắt · ✅70 xong-máy**. Thứ khan hiếm
   nhất không phải công sức build mà là **băng thông duyệt mắt của Hoà**. Việc B ra kết quả nhìn-thấy-được
   trong một phiên, đúng loại việc đưa vào cửa duyệt mắt được ngay; việc A ăn 1-2 phiên mà không có gì để nhìn.
2. **B trả lời trực tiếp câu Hoà vừa hỏi.** Hoà chê sketch↔pro; số đo nói lỗi nằm ở 49% thanh ngoài mép,
   và B đóng đúng chỗ đó. A đóng một câu chê **khác** (Trình chiếu), Hoà chưa nêu trong lượt này.
3. **B là thi hành chốt đang treo, không phải việc mới** — KB-1 tầng ② và `kien-truc-tool-3-lop` (13/08)
   đã chốt "gói tác vụ group-by" mà chưa ai dựng. Làm B là trả nợ chốt, và nó **dựng sẵn khuôn** cho
   Trình chiếu dùng lại khi làm A.

Thứ tự đề nghị: **B2 phím tắt 3 chặng (10 dòng)** → **B1 gói lệnh 2D** → **A①** nâng state + Navigator
Trình chiếu hiện danh sách trang thật (xoá cột rỗng, trả 214px — đây là nửa A rẻ và thấy được) →
**A②** dời Inspector + thanh công cụ, **kèm điều kiện cho ổ ④ nhận bề rộng thay vì ghim 236**.

⚠️ Trước khi mở phiếu nào trong số này: **một lượt mở app thật** để chốt ba con số tôi còn ước tính
(bề rộng thanh 2D · tỉ lệ canvas · ⌘K hai bảng). Nếu bề rộng thật lệch nhiều so với ước tính,
mức độ ưu tiên giữa B và A có thể đảo.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM
Chi tiết đầy đủ ở `NC-SOI-3-CHANG-2026-08-16.md` §7. Bốn điều đáng nhớ nhất:
- **Không mở app, không dev server** — toàn bộ là đọc mã.
- **3D quét nông hơn** 2D và Trình chiếu (vùng do phiên khác giữ) ⇒ ô 3D trong bảng NT và mục
  "thứ chỉ 3D có" kém tin cậy hơn.
- **Phép đo A đổi số theo cách chọn mẫu số**: 7 chỗ cắm → 43%; ai tính 6 ổ (bỏ prop `toolbar`) → 50%.
  Phép đo D không đếm `components/studio`; đếm vào thì tỉ lệ chia sẻ tăng đáng kể.
- **Không chạy git** (lệnh giao việc cấm) ⇒ không chứng minh được `HEAD..main = 0`, chỉ kiểm gián tiếp
  qua dấu vết tệp sau B2.
- 🔧 Một lỗi của chính tôi, ghi lại: suýt báo phiếu dẫn sai mã điều khoản `[Đ2]:72`. Mở `TRIET-LY-IF.md`
  đọc thì **phiếu đúng** — `:72` là `[Đ2] NHÌN VÀO TRONG TRƯỚC`. Đúng loại lỗi "nhớ hộ máy" mà phiếu dặn tránh.

## ⑦c HẠN DÙNG
Đúng cho ảnh chụp mã **16/08/2026**. Hết hiệu lực khi: `hotkey-registry` B2/B3 chạy tiếp · Trình chiếu
dời panel về ổ chung · thanh 2D gói lệnh · `lib/shortcuts.ts` nhập vào `registry.ts`.
Các số đếm đo lại bằng 4 lệnh grep ghi trong §2 của NC, không cần đọc lại báo cáo này.

## Nghiệm thu
`npm run soi:frontier` → **0 lệch** · `npm run soi:tu-dien` → 252 chỗ chữ trần (nợ cũ; phạm vi quét là
`docs/phieu-giao` + `docs/mocks` nên hai tệp phiên này không làm tăng số) · **0 dòng code đổi**.
