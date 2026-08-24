# SIDEBAR — BẢN ĐỒ, không phải bệ phóng

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải. Nguồn đầy đủ ở §8.

## 1 · MÀN NÀY LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — **bản đồ** của toàn app: *app có những gì · tôi đang ở đâu · tôi đi đâu được*. Nó là
**hệ router cấp toàn app**; ba chặng chỉ là **một nhóm** trong đó, không phải trục riêng.
**[N]** Hoà 16/08: *"sidebar là hệ router toàn app, 3 chặng là 1 trong những stage"*.

**KHÔNG PHẢI** — bệ phóng ứng dụng · thanh công cụ · nơi bày trạng thái dự án · thứ đổi nội dung
theo chặng. **[N]** `SKILL.md §1` + `HOP-DONG-CAU-TRUC-DIEU-HUONG.md §6.2`.

**Hai luật cứng đi kèm:** ① sidebar **không bao giờ đổi nội dung theo chặng** — bản đồ mà đổi theo
chỗ đứng thì thôi là bản đồ ② **thanh công cụ không bao giờ chứa lối đi**; hai vật, hai việc.

## 2 · VIỆC CỦA CON NGƯỜI

| Việc | Bản đồ trả lời bằng |
|---|---|
| Biết mình đang ở đâu | vị trí + hình của mục đang mở (dải màu đặc 2px bên trái, không chỉ màu) |
| Biết app có những gì | danh sách đầy đủ — mục chưa dùng được thì **mờ kèm lý do**, KHÔNG ẩn |
| Nhảy sang chỗ khác | một cú bấm, không menu lồng |
| Liếc xem chỗ đó đang có gì | chỉ ở nấc rộng nhất (§5) |

**[N]** *Cụm dự án chưa mở dự án thì mờ kèm lý do, không ẩn — ẩn thì người dùng không biết app có
gì.* Lý do đi qua `aria-describedby`, **không** qua `title` (title câm trên cảm ứng, và Tab bỏ qua
nút `disabled` thật). **[N]** bài học P-G 16/08.

## 3 · NHÂN VẬT CHÍNH

**Nội dung — không phải bản đồ.** Sidebar ở trạng thái nghỉ phải gần như biến mất; nó bung ra khi
được gọi rồi trả lại chỗ. **[IF]** Đây là tinh thần *nhường chỗ* học từ visionOS (xem
`references/visionos.md`) — **không** phải chép kiến trúc visionOS.

## 4 · ĐƯỢC PHÉP CHỨA / BỊ TỪ CHỐI

### Danh sách đang hiệu lực (chốt 23/08, kèm 10 ảnh)
> *"thanh sidebar cực đơn giản, KHÔNG nên 1 thanh dọc dài dễ cảm giác thô, mà tách 2 phần."*

| Cụm | Mục |
|---|---|
| **1** | Trang chủ · Dự án · **Cảm hứng** (Design DNA) · Thư viện |
| **2** | Thiết kế 2D · Thiết kế 3D · Trình chiếu · **`+`** |

**Nút `+`:** trượt qua ba chặng thì kính **chỉ trong, không màu**; tới `+` thì kính **vẫn trong
nhưng ăn màu AI** — báo rằng bấm vào đây sẽ **sinh ra sản phẩm từ AI**. **[N]**
**[IF]** Đây là ca dùng G3 **đúng nghĩa**: hiếm · một chỗ · quang học · **mang tin**. Màu không
trang trí — nó là *lời khai về năng lực của nút*. Và nó mạnh hơn lý do cũ (*"nút quan trọng nên cho
nó đẹp"*).

### Bị từ chối khỏi rail — kèm chỗ thay thế
| Thứ | Vì sao | Sống ở đâu |
|---|---|---|
| **Bảng màu** | *màu là một BƯỚC trong chọn vật liệu* **[N] 16/08** | trong luồng chọn vật liệu ở Thư viện |
| **Kho vật liệu** | là một **KỆ** của Thư viện | kệ Thư viện |
| **Gallery** | mặt tiền tuyển chọn của kệ Ảnh & tài sản | trong Thư viện |
| Khối ngữ cảnh dự án (đang ở dự án nào, có ai) | là **vật thứ ba** trên một thanh đã chốt là đúng hai viên | bề mặt dự án |
| Đường kẻ ngang chia cụm | luật *bỏ đường kẻ, tách bằng khoảng thở* | — |
| Quầng sáng / glow trên `+` | NT-11 + luật G3-không-glow: "ăn màu" làm bằng **quang học** (khúc xạ, dày mép), mọi bóng là `inset` | — |

### Hình dạng
**Máng giữ chỗ trong dòng chảy, HAI VIÊN NỔI đứng bên trong.** *Cột là CHỖ, viên là VẬT đứng trong
chỗ đó.* **[N]** A1 23/08. Hai phép nghiệm thu dễ rơi nhất: ① viên **không chạm mép trên/dưới** —
chính chỗ hở làm nó đọc ra *vật nổi* thay vì *thanh* ② **nhãn bung ra BÊN CẠNH viên**, không nằm
trong viên ⇒ viên không cần nở để có chữ.

**Bung là TẤM NỔI, không bóp canvas.** Nấc rộng nổi đè; hợp đồng bố cục (`railRight ≤ contentLeft`)
giữ nguyên, **thêm** `viênRight ≤ bề rộng máng`. **[N]** A1.

## 5 · TRẠNG THÁI

### Ba nấc = ba CÔNG NĂNG (không phải ba cỡ)
| Nấc | Câu hỏi nó trả lời | Thứ nấc dưới **KHÔNG THỂ** có |
|---|---|---|
| hẹp nhất | *tôi đang ở đâu* | — (nền của thang) |
| **240** | *tôi đi đâu được* | **CHỮ** — nấc hẹp không chứa nổi một chữ nào |
| **320** | *ở đó đang có gì* | **HÌNH**, hoặc **tình trạng sống** nếu mục đó không có hình |

**Cửa nghiệm thu hai vế:** ① che nấc to → nấc nhỏ vẫn đứng được một mình ② nấc to phải có thứ nấc
nhỏ **không thể** có — **không phải** thứ nấc nhỏ có mà bé hơn. **[N]** Hoà 16/08, sửa T hai lần vì
tư duy "kéo dãn".

⛔ **Mục nào không có gì để nhìn thì BỎ nấc 320 cho riêng nó**, kèm lý do đọc được. Ba nấc là
**nhịp**, không phải **hạn ngạch**. Ví dụ đã ký: Trang chủ bỏ nấc 320 vì *"bày một bản thu nhỏ của
chính nó ngay cạnh nó là nói cùng một điều hai lần"*.
📏 Nấc-hình có **ngưỡng đo được**: 141px đã bị đo là **quá nhỏ để phân biệt vân sồi với óc chó**.

### Trạng thái khác
- **Mục chưa dùng được** — mờ + `aria-disabled` + lý do; **không ẩn**, **không** `disabled` thật.
- **Cụm dự án khi chưa mở dự án** — mờ toàn cụm, kèm lý do.
- **Thu/mở phải NHỚ giữa các phiên** (localStorage). **CẤM auto-hide** — thứ bị chửi nhất ở cả 4
  app chuyên nghiệp đã khảo. **[N]** `SPEC-PANEL-ROLLOUT-IDF.md`.
- **Giảm chuyển động** — nhánh tĩnh, không phải nhánh chậm hơn.

## 6 · HÀNH VI ↔ DIỆN MẠO — tách rõ, đây là chỗ hay hỏng nhất

> **[IF] LUẬT: hành vi đã có test thì đừng viết lại chỉ vì diện mạo đổi.**

| Đã có, đã đo, **giữ nguyên** (HÀNH VI) | Được phép đổi (DIỆN MẠO) |
|---|---|
| ba nấc, mỗi nấc một công năng | máng phẳng → **hai viên nổi** |
| nhớ nấc qua `localStorage` | bo góc viên, khoảng hở giữa hai cụm |
| cấm auto-hide | trạng thái đang chọn = **vòng/dải đặc** |
| nấc rộng **nổi đè**, không bóp canvas | nút `+` ăn màu AI |
| nút mờ đi `aria-disabled` + `aria-describedby` | icon từng mục |
| khái niệm **cụm** (`CumRail`, thứ tự cụm) | tên nhãn, thứ tự mục trong cụm |

**[N]** lane-rail 23/08: *"Ba thứ phiếu tưởng phải làm mới mà ĐÃ CÓ SẴN… việc thật của lượt này là
đổi HÌNH DẠNG + rút danh sách, không phải viết lại điều hướng."*

**Ràng buộc hình học không chọn bằng mắt:** hàng có đệm 4 ⇒ theo `rInner = max(4, rOuter − pad)`,
muốn hàng đúng bo `10` thì viên phải bo `14`. Lấy `20` thì hàng hụt 6px và góc đọc ra lệch tâm.

## 7 · CA HỎNG THẬT

**① `/files` thành màn mồ côi (23/08).** Danh sách chốt sáng 23/08 không có Files, mà rail là **lối
vào duy nhất** nó đang có ⇒ sau khi thi hành, `/files` chỉ còn vào được bằng cách gõ URL. Đây là
**hệ quả thật của chốt**, không phải lỗi thi công. **Cần Hoà chỉ chỗ đặt lối vào mới** — đề xuất:
một kệ/tab bên trong Thư viện, đúng mạch *Files → cửa sổ → Thư viện* của `IF-KIEN-TRUC.md §5`.
**[IF] Luật rút ra: gỡ một mục khỏi bản đồ thì phải kiểm nó còn lối vào nào khác không — bản đồ là
lối vào duy nhất của gần hết các màn.**

**② Icon chọn bằng nghĩa, bị test bác bằng số.** Chọn đầu cho *Cảm hứng* là `Lightbulb` (nghĩa "ý
tưởng" rõ nhất). Test bác: cung của nó là bán kính **6** trong khi cả sáu icon còn lại là **2** —
đúng loại lệch mà mắt thấy "sai sai" mà không gọi được tên. Chốt lại `Compass`. Ràng buộc quyết
định **không phải nghĩa mà là silhouette**: mọi ứng viên "đúng nghĩa ảnh" (`Image`, `Images`,
`GalleryVertical`) đều là khung chữ nhật ⇒ ở 18px đọc lẫn với dãy thẻ của Thư viện. `Sparkles` loại
có chủ đích: lấp lánh là ngôn ngữ của AI, kênh đó đã dành cho `+`.

**③ Bản vẽ dựng trước chốt thì đọc như đang sống.** `mock-kich-ban-sidebar.html` vẫn để Kho vật
liệu (13 lần) và Bảng màu (9 lần) trên rail — hai thứ Hoà đã gỡ 16/08. Phải **dựng lại, không vá**.
Đây đúng thứ `HOP-DONG` gọi là *build chéo ngược*.

**④ Màu AI không được lên chữ.** `#2a99a4` trên nền panel sáng = **3,23:1** — đạt 3:1 cho phần tử
giao diện (viền, glyph) nhưng **trượt 4,5:1 cho chữ**. Ở nấc rộng nút này CÓ nhãn chữ ⇒ màu đi vào
**viền + dấu `+`**, chữ ở lại token mực.

## 8 · ĐÀO SÂU

| Cần gì | Đọc đâu |
|---|---|
| Hợp đồng cấu trúc (cụm · Files 2 tầng · Thư viện chia kệ · 3 nấc · 7 ràng buộc chung) | `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` |
| Chốt 23/08 hai cụm + `+` ăn màu AI + bằng chứng 10 ảnh | `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md` §"BỔ SUNG 3" + §"BỔ SUNG 4 · A1" |
| Bản vẽ | `docs/mocks/mock-rail-hai-cum.html` (305 dòng, bố cục · hành vi · a11y) · `mock-sidebar-ban-do-2026-08-22.html` · `mock-sidebar-3-nac-home.html` |
| Thi công + số đo DOM app thật + a11y | `docs/bao-cao-phien/2026-08-23-lane-rail.md` |
| Vai bốn bề mặt (canvas · cửa sổ · chặng · sidebar) | `docs/IF-KIEN-TRUC.md` §2 §3 |
| Luật panel thò thụt, cấm auto-hide (khảo 3dsMax/Blender/Rhino/SketchUp) | `docs/SPEC-PANEL-ROLLOUT-IDF.md` |

**🔴 MÂU THUẪN CHƯA GIẢI — CHỜ HOÀ, cấm tự chọn:**

**Bề rộng nấc hẹp nhất: 28px hay 52–56px?**

| Văn bản | Số | Ngày |
|---|---|---|
| `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §5` + bản vẽ `mock-rail-hai-cum.html` (`--w-dinh-vi:28px`) | **28** | 16/08 |
| `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` điều 4 (*"Rail 52–56"*) | **52–56** | 20/08 |
| `.claude/skills/if-design/SKILL.md §6` (*"sidebar rail 52px"*) | **52** | — |

Hiện **đã dựng theo 28** — lý do: bản vẽ là bản đã duyệt bằng mắt, **và** nó đi kèm lời giải cho hệ
quả kỹ thuật của chính con số đó (nút thu/mở phải hạ 32→24px + `flex-shrink:0`, thiếu thì bị bóp còn
16px); tức 28 đã được thi công thử, không chỉ được viết ra. 52 chỉ là một khoảng trong văn bản chốt
— **nhưng nó mới hơn 4 ngày.** Số đã khoá bằng test để không ai đổi một chiều rồi quên báo.
Đổi sang 52 rẻ: một hằng số + một dòng test + trả nút nấc về 32px.
⇒ **CHỜ HOÀ. Không phiên nào được tự chọn một trong hai.**

**Còn treo:**
- **"Màu AI" là màu gì** — đang tạm `#1f7f88`/`#2a99a4` khai tại một chỗ duy nhất trong rail; hết
  hiệu lực ngay khi Hoà chốt màu nhấn thứ hai (mòng két ↔ mận, **hai bản đã dựng để so bằng mắt,
  chưa duyệt**). Không được tự phong thành accent thứ ba.
- **Cụm 2 gồm những gì** — chốt 23/08 ghi *2D · 3D · Trình chiếu · `+`*; đặc tả Workspace 23/08 lại
  nói ba chế độ là *Collab · 2D · 3D*. **Present đi đâu chưa ai trả lời** ⇒ xem
  `product/workspace-toolwindow.md` §7. Chưa trả lời thì chưa chốt được cụm 2.
- **`+` chưa nối hành vi** — `aria-disabled`, không `onClick`. Cửa "tạo sản phẩm bằng AI" là một bề
  mặt mới chưa dựng. Cho nó `router.push` bừa vào một trang gần giống là **nút giả**.
- **Danh sách 23/08 ↔ `HOP-DONG` 17/08 lệch nhau** (17/08: XƯỞNG 6 mục / DỰ ÁN 5 mục). 23/08 mới
  hơn nên thắng, nhưng `HOP-DONG` **chưa được đóng dấu tại chỗ** ⇒ ai đọc nó trước sẽ dựng bản cũ.
