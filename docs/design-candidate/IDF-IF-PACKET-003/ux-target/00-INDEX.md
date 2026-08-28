# IF · UX TARGET — CHỈ MỤC GÓI

`IF-UX-VISUAL-REALIGNMENT-001` · gói `IDF-IF-PACKET-003` · lập 27/08/2026
HEAD đo: **`63de2d8`** · nhánh `checkpoint/2026-08-24-control-plane`

---

## 0 · GÓI NÀY LÀ GÌ, VÀ KHÔNG LÀ GÌ

**LÀ:** target **MỚI** cho bốn bề mặt — Shell · Home · Dock · Vitals — chốt **cấu trúc và ngữ nghĩa**,
neo từng dòng vào một dòng P0/P1 có thật trong `../ux/01-RUNTIME-UI-GAP-MAP.md`.

**KHÔNG LÀ:** một bản duyệt. ⛔ Không nâng CANDIDATE nào. ⛔ Không duyệt Vitals, không duyệt brand.
Mọi giá trị thẩm mỹ mang nhãn **`PROPOSED`**.

🔴 **Mọi mock/canvas cũ là `CANDIDATE / NOT FINAL TARGET`** — gói này không lấy cái nào làm chuẩn.

**Nhãn tổng:** **`PARTIAL — contract/design proof trên mã tại HEAD 63de2d8`**
(kế thừa runtime proof của gap map; **lượt này không chạy server, không thêm ảnh nào**).
⛔ Cấm đọc bất kỳ dòng nào thành PASS.

---

## 1 · BẢNG BỀ MẶT

| bề mặt | tệp | P0 đóng được | P1 đóng được | trạng thái duyệt |
|---|---|---|---|---|
| **Shell** (Left Router · Thanh trên · khung chung) | `01-TARGET-SHELL.md` | `#1` `#2` `#5` `#6` `#7` `#8`* `#9`* `#10` · `L2-01` `L2-02` | `#11` `#12` `#15` `#22` `#24` · `L2-05` · **`#14` → chuyển sang Dock** | **chờ Hoà** |
| **Home** | `02-TARGET-HOME.md` | `#9` · `L2-04` | `#20` `#21` `#33`(một phần) · `L2-06` `L2-07` `L2-08`* | **chờ Hoà** |
| **Dock** | `03-TARGET-DOCK.md` | `#5` `#6` `#10` · `L2-01` | **`#23`** · `#14` `#15` · `L2-10` | **chờ Hoà** |
| **Vitals** | `04-TARGET-VITALS.md` | **`#3`** **`#4`** · **`L2-03`** · `L2-01` | `#20` `#31`(vế mắt) | **chờ Hoà** |

`*` = đóng **một phần**; phần còn lại là **quyết định của người**, xem §3.

**Phủ sóng:** 14 P0 của gap map — **12 có dòng target**; 2 còn lại (`#8` `/workhub` · `L2-08` phạm vi
admin) chỉ đóng được **nửa giao diện**, nửa còn lại chờ Hoà.
21 P1 — **13 có dòng target**; `#13` (Tri thức/Knowledge) và `#18`/`L2-09` (cold open) **cố ý không đóng**
vì đang là mâu thuẫn chưa chốt.

---

## 2 · BA QUYẾT ĐỊNH TARGET QUAN TRỌNG NHẤT

**① Ánh sáng của lõi Vitals là HỆ QUẢ của việc các nét chạm tới nó — không phải một thuộc tính gán được.**
⇒ `calm` không còn vẽ ra được khi một phép đo thất bại: nét đứt ⇒ lõi khuyết một khoảng.
Đây là cách **F-02** (`FAIL, open` từ đầu chiến dịch) bị chặn **bằng cấu tạo**, không phải bằng thêm
một nhánh `if` (M-27: *"sửa một ca không sửa được tư duy đẻ ra ca đó"*).
`04-TARGET-VITALS.md` §1.2.

**② Hai vùng Home = luật "AI KHỞI XƯỚNG" được nâng từ một câu phải nhớ thành hai chỗ đứng trên màn.**
APP khởi xướng ⇒ vùng **Factory/Starter**. NGƯỜI DÙNG khởi xướng ⇒ vùng **Personalized/My Home**.
⇒ M-10 (ca *"Ghi chú nhanh"*) và M-11 (*"biết luật bằng chữ ≠ nhận ra vi phạm bằng mắt"*) nay
**kiểm được bằng mắt**: đặt sai vùng là **nhìn thấy được**.
`02-TARGET-HOME.md` §1.1.

**③ Ranh giới Dock ↔ Toolbar là năm phép thử kiểm được trong MỘT khung tĩnh**, không phải một lời hứa.
Trượt một phép là đã thành toolbar: trí nhớ cơ bắp (ⓐ đứng yên qua mọi chặng) · có trạng thái sống
(che icon đi vẫn còn nói được) · **đúng một** vùng biến hình · cạnh nổi tạm thời (canvas chạy dưới) ·
trần số lượng.
`03-TARGET-DOCK.md` §1.2.

---

## 3 · MÂU THUẪN — GHI CẢ HAI VẾ, KHÔNG TỰ HOÀ GIẢI

| # | mâu thuẫn | ở đâu |
|---|---|---|
| **X-1** | Kính trên thanh trên: ràng buộc *"kính chỉ ở cạnh nổi/tạm thời"* ↔ `globals.css:256` cho phép `--kinh-mong` ở *"thanh trạng thái"*, và `AppChrome.tsx:255` đang dùng `.nen-mo-header` | SHELL §7 |
| **X-2** | Rail **52px cứng** ↔ hợp đồng **ba nấc là ba công năng** (52/240/320, `IF-CANONICAL` §10 `[CHỐT]`), `RailDieuHuong.tsx:98` lấy 240 làm mặc định ngoài chặng | SHELL §7 |
| **X-3** | Từ vựng rail 4+3 ↔ ô *"Nguồn & Tri thức"* của `DA-RESOURCE-027.1` — **câu hỏi chưa quyết của Hoà** | SHELL §7 |
| **X-4** | Cold open **320 ms** (hợp đồng) ↔ **60 000 ms** (`IntroSequence.tsx:45`), và `/` tự chuyển `/intro` kể cả khi đã đăng nhập | SHELL §7 |
| **X-5** | Home **hai vùng** ↔ chốt 23/08 **năm trạng thái A–E + ba tầng widget** (`nam-trang-thai.ts`), trong đó C/D/E chia theo **giờ trong ngày** | HOME §7 |
| **X-6** | Cửa hậu admin (`access.ts:50`, cờ `IF_PROJECT_SCOPE_ENFORCE` không bật) ↔ §13 *isolation trước fetch/render* | HOME §7 |
| **X-7** | Fixture `__proof_*` sống chung bảng với dữ liệu thật — **không luật nào cấm bằng chữ** | HOME §7 |
| **X-8** | Hai capsule đáy cùng sống: `CadToolbelt` (ổ ⑤) ↔ `BottomToolbar` (canvas flow) — cả hai đều có chốt đứng sau | DOCK §7 |
| **X-9** | *"Thích ứng theo stage"* ↔ *"stable universal anchors"* — **câu hỏi mà cả bộ ranh giới dock phụ thuộc vào: có giữ ⓐ bất biến không?** | DOCK §7 |
| **X-10** | Nếu X-1 chốt theo hướng giữ kính cho thanh trên thì app có **hai** mép kính kẹp canvas ⇒ *"canvas thoáng"* mất nghĩa. **X-1 và X-10 phải chốt cùng một lượt** | DOCK §7 |
| **X-11** | `VitalsChatBubble.tsx` · `VitalsChatSurface.tsx` **tồn tại trong cây** ↔ ràng buộc ⛔ cấm chatbot chung chung (chưa đọc nội dung ⇒ chưa kết luận) | VITALS §7 |
| **X-12** | **Phát hiện của lượt này:** chú thích `vitals-tin-hieu.ts:195-197` nói **hai** loại kéo `alert`, mã `:200` kéo **ba** (thêm `dia-diem`) | VITALS §7 |
| **X-13** | `--mau-ai` **chưa chốt** — `globals.css:36-46` ghi rõ đang chờ Hoà chọn mòng két ↔ mận | VITALS §7 |

---

## 4 · `NOT ASSESSED` — GỘP CẢ GÓI

| # | chỗ | vì sao |
|---|---|---|
| NA-1 | **Mọi cảnh ở `393×852`** trên cả bốn bề mặt | Gap map chỉ có **một** ảnh 393px và nó là `/login` (`#26`). Lượt 2 **không có ảnh nào**. Toàn bộ cột 393 trong gói này là **PROPOSED** |
| NA-2 | **Ảnh runtime cho mọi dòng target** | Lượt này **CHỈ ĐỌC**, không chạy server. Kế thừa `N-12` của gap map (Playwright `net::ERR_ABORTED` với `127.0.0.1:3080`) |
| NA-3 | Bề rộng THẬT của rail ở nấc `dinhVi` | Kế thừa `#32`/`L2-11`; cần bấm nút thu rồi đo `getBoundingClientRect()` |
| NA-4 | Dock ở chặng **3D** và **Trình chiếu** | Kế thừa `#36` `#37` — chưa mở được hai chặng |
| NA-5 | Tám khung tĩnh Vitals cạnh nhau (nghiệm thu chính của Vitals) | Cần runtime + ảnh; và đây là **cổng mắt của Hoà**, không phải việc của agent |
| NA-6 | `IntroSequence` còn sống ở HEAD không | Cây làm việc đang bẩn bởi người ghi khác; không đọc bản làm dở như thể là HEAD (M-06) |
| NA-7 | `xuong-layout.ts` ghép với hai vùng Home ra sao | Chưa đọc trong lượt này ⇒ không khẳng định gì (M-55) |
| NA-8 | `VitalsChatBubble` / `VitalsChatSurface` là gì | Chưa đọc nội dung; xem X-11 |
| NA-9 | Trạng thái `cu` có tới được người dùng không | `lib/site/dan-xuat.ts:9` khai *"máy đủ, dây thiếu"* — chưa xác minh lại (M-11: khai ≠ chứng minh) |
| NA-10 | Ngưỡng cỡ tối thiểu để "nét đứt / lõi khuyết" đọc được | M-43 cùng họ: dưới một cỡ nhất định các cue chồng thành một vệt. Chưa đo |
| NA-11 | Tương phản của mọi tổ hợp chữ/nền trong target | Không đo số nào trong lượt này; chỉ **trích** số đã đo 20/08 (M-05) |
| NA-12 | **Electron đóng gói** | Kế thừa `N-11`; không thử, không được dùng bản `.app` cũ 22/08 |

---

## 5 · THỨ TỰ ĐỌC ĐỀ NGHỊ

1. Tệp này (chỉ mục · mâu thuẫn · `NOT ASSESSED`).
2. `01-TARGET-SHELL.md` — vỏ là nền của ba tệp còn lại; **X-1/X-2 chốt trước thì ba tệp kia mới đứng được**.
3. `03-TARGET-DOCK.md` — **X-9** là câu hỏi Hoà phải trả lời sớm nhất trong cả gói.
4. `02-TARGET-HOME.md` — **X-5** đụng vào một chốt đã thi công thành mã có test.
5. `04-TARGET-VITALS.md` — đọc sau cùng; cổng mắt của nó là của Hoà.

---

## 6 · THẨM QUYỀN

Gói này chốt **cấu trúc và ngữ nghĩa**.
**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**
`IF-CANONICAL` §2: Claude Design giữ thẩm quyền bố cục người dùng nhìn thấy · MAIN thi công ·
**chỉ Hoà** nâng được `CANDIDATE → APPROVED`. Gói đang ở **CANDIDATE**.
