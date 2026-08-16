# P-P · KỊCH BẢN SIDEBAR — hệ router toàn app, phủ MỌI stage cấp app

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG, vùng `docs/mocks`. Đây là phiếu **BÀY PHƯƠNG ÁN**,
> **KHÔNG thi công** — không sửa một dòng code nào. Chạm biên → **DỪNG + đề xuất lên T**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1              # mốc mới nhất: 544999f
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. **Hai phiên phụ khác đang chạy** — một giữ `components/home/**` + `lib/resume.ts` + `components/studio/AppChrome.tsx`, một giữ `lib/wallpaper/**` + `components/wallpaper/**` + `DongStudioHome` + `LoginScreen` + `LockScreen`. Bạn **chỉ tạo 2 tệp MỚI**, không đụng gì của họ.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý (T đã đo, bạn đo lại)
1. *"App có **25 route**. Các stage **CẤP APP có route thật**: `/` tổng quan · `/files` · `/library` (+`/library/gallery`, `/library/ingest`) · `/materials` · `/colors` · `/tasks` · `/settings` (+`about`, `avatar`, `licenses`). Các stage **CẤP DỰ ÁN**: `/projects/[id]/overview` · `notebook` · `cad` · `render` · `present` · `photo`."*
2. *"**Chat có API (`app/api/chat/route.ts`) nhưng KHÔNG có trang** ⇒ nó là stage đã chốt ở CẤP 0.5 (11/08) mà **chưa dựng mặt**."*
3. *"`components/studio/StageSwitcher.tsx` tự khai là *'trục điều hướng DUY NHẤT của app'* — câu đó **nay lỗi thời** theo chốt của Hoà; nhưng **chưa ai sửa**, và phiếu này **không sửa code**."*
4. *"`docs/mocks/mock-sidebar-3-nac-home.html` **ĐÃ CÓ** (sidebar 3 nấc **28 / 240 / 320**), và **ba nấc là nhịp chung toàn app** (sidebar · tool 3 lớp · card 3 nấc) ⇒ kịch bản **kế thừa nhịp đó**, không đẻ nhịp thứ hai."*

Số/đường dẫn của T lệch cái bạn đo → **báo lại cái đúng**. Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH — chốt của Hoà, nguyên văn

> *"chốt về side bar hết, nó là hệ router toàn app, 3 chặng là 1 trong những stage làm việc của app. dựng cho mình 1 vài kịch bản sidebar bao gồm tất cả những stage ở cấp toàn app."*

**Đây là chốt kiến trúc, không phải chuyện thẩm mỹ.** Nó **hạ cấp** trục điều hướng cũ: `StageSwitcher` (dock 3 chặng trong thanh đầu) từ *"trục duy nhất"* thành **một lối vào một nhóm stage**. Sidebar lên làm **hệ router**.

## ② 🔴 BÀI TOÁN THẬT — hai cấp, một thanh

Đây là chỗ khó nhất, và là lý do cần **nhiều kịch bản** chứ không phải một:

**Stage của app** (Files · Thư viện · Vật liệu · Màu · Bảng việc · Cài đặt) sống **không cần dự án nào**.
**Stage của dự án** (Tổng quan · Sổ tay · 2D · 3D · Trình chiếu) **chỉ có nghĩa khi đang mở một dự án**.

Nhét cả hai vào một thanh phẳng thì hoặc **nửa số mục chết** khi chưa mở dự án, hoặc người dùng **không hiểu vì sao bấm vào thì trống**. Mỗi kịch bản phải **trả lời câu này theo một cách khác nhau** — đó chính là thứ phân biệt các kịch bản, không phải bo góc hay màu.

Câu hỏi kèm theo, mỗi kịch bản phải trả lời: **đổi dự án thì làm ở đâu?** · **stage nào chưa dựng (Chat) hiện thế nào?** · **thu về nấc hẹp nhất thì còn đọc được gì?**

## ③ ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/mocks/mock-sidebar-3-nac-home.html` | nền phải kế thừa — 3 nấc 28/240/320 |
| `docs/mocks/mock-bo-nen-chung.html` | bộ nền: màu · card · lưới · nhịp |
| `docs/CHOT-16-08-BAN-DUNG.md` mục **A5 · B1 · B5 · B10 · B12** | ba nấc là nhịp chung · kính là vỏ · ưu tiên ký hiệu · cỡ ô lưới · chi tiết phải mang tin |
| `docs/00-CHOT.md` — mục **[11/08 HỆ TÊN CẤP LÕI + TẦNG WORKSPACE]** | định nghĩa CẤP 0.5 WORKSPACE gốc |
| `components/studio/StageSwitcher.tsx` (CHỈ ĐỌC) | trục cũ — kịch bản phải nói rõ nó thành gì |
| `components/ui/PanelFlank.tsx` (CHỈ ĐỌC) | tay cầm thu/mở dùng chung |

## ④ VÙNG FILE
**ĐƯỢC ghi — đúng 2 tệp, đều MỚI:** `docs/mocks/mock-kich-ban-sidebar.html` · `docs/bao-cao-phien/2026-08-16-P-P-kich-ban-sidebar.md`.
**CẤM ghi bất kỳ tệp nào khác.** Không code, không mock đang có, không `scripts/`, không `docs/00-CHOT.md`.
**KHÔNG git. KHÔNG dev server.**

## ⑤ VIỆC

### V1 — Chốt danh sách stage cấp app (marker: `danhSachStage`) 🔴 làm trước
Đi từ **route thật**, không từ trí nhớ hay từ sổ. Với mỗi stage ghi: **tên hiển thị** (song ngữ) · **route** · **cấp app hay cấp dự án** · **đã dựng hay chưa**.
Có stage nào **trong sổ mà không có route** (vd Chat) hoặc **có route mà sổ không nhắc** → **nêu ra**. Đây là lần đầu ai đó đối chiếu hai danh sách này; **lệch là phát hiện, không phải lỗi của bạn.**

### V2 — Dựng **3–4 kịch bản**, mỗi cái giải bài-toán-hai-cấp một kiểu khác (marker: `kichBanSidebar`)
Bạn tự đề xuất, nhưng **các kịch bản phải KHÁC NHAU VỀ CƠ CHẾ**, không phải khác về trang trí. Vài hướng để khởi động — **không bắt buộc dùng**:
- **hai khối trong một thanh**: khối app ở trên, khối dự-án-đang-mở ở dưới, ngăn bằng chuyển sắc (không dùng đường kẻ ngang — luật B2)
- **thanh đổi ruột theo ngữ cảnh**: chưa mở dự án thì chỉ có stage app; mở dự án thì mọc thêm nhánh
- **hai nấc trong thanh**: cột hẹp chọn *cõi*, cột rộng liệt kê stage của cõi đó
- **thanh phẳng + bộ chọn dự án ở đỉnh**, stage dự án mờ đi kèm lý do khi chưa mở dự án

Mỗi kịch bản **bắt buộc** có: cả **3 nấc** (28/240/320) · trạng thái **chưa mở dự án** ↔ **đang mở dự án** · chỗ **đổi dự án** · cách hiện stage **chưa dựng** · và **`StageSwitcher` thành gì** (giữ · đổi vai · bỏ).

### V3 — Bảng đối chiếu, KHÔNG chấm điểm (marker: `doiChieuKichBan`)
Mỗi kịch bản: **được gì · mất gì · gãy ở đâu khi app lớn thêm** (thêm 5 stage nữa thì cái nào vỡ trước?).
⛔ **CẤM xếp hạng, CẤM chấm điểm** (luật §12.3). Bày ra để mắt Hoà quyết.
✅ Được phép nói *"kịch bản X trượt ràng buộc Y"* — đó là **sự thật đo được**, khác với xếp hạng.

### V4 — Chấm cả 3-4 kịch bản bằng thước `simpleCoChiTiet`
Thước 7 câu đã dựng ở `docs/mocks/mock-chu-ky-va-bieu-tuong-tep.html` (H1…H7) — **dùng lại, cấm chế thước thứ hai**. Đọc nó trước.
Đặc biệt soi **H5 (sống ở nấc gọn nhất)**: ở nấc **28px** thì kịch bản còn nói được gì? Đây là chỗ sidebar hay chết.

### V5 — Bản vẽ (marker: `@dsCard`)
`docs/mocks/mock-kich-ban-sidebar.html`, dòng đầu `<!-- @dsCard group="Kịch bản sidebar" -->`.
Đủ **2 theme** có nút gạt · **token thật** (⚠️ `--mat-*` **đã chết** → `--nen-mo-*`; đường kẻ mảnh là **`--vien-mo`**) · cấm hex ngoài khối khai token · 1440×900 không tràn ngang · tự chấm bằng `design:design-critique` + `design:accessibility-review`.
**Bày các kịch bản sao cho SO ĐƯỢC** — cùng nội dung, cùng bố cục khung, chỉ khác cơ chế. Khác nội dung thì mắt không so được.
T đẩy lên Claude Design; bạn **không có** `DesignSync`.

## ⑥ RÀNG BUỘC
- **Ưu tiên ký hiệu hơn chữ** ở nấc hẹp — **nhưng nhãn 1-2 từ vẫn giữ** (NT-8), và ở nấc rộng thì **icon nhường chỗ cho chữ**.
- **Ký hiệu nghề**: lệnh/stage thuộc nghề nên dùng **ký hiệu bản vẽ** thay icon chung khi có — đây là thứ IF có mà app đa dụng không có. ⚠️ Nhưng nó hiện **CHƯA LÀM** (thanh công cụ vẫn 11/11 lucide) ⇒ dùng thì phải khai là **đề xuất mới**, không phải tài sản sẵn có.
- **Thu/mở phải NHỚ** giữa các phiên. **Cấm auto-hide** (bị chửi nhất ở cả 4 app đối thủ đã khảo).
- **Bàn phím**: mọi stage tới được không cần chuột.
- **Màu không là kênh duy nhất**; chấm màu định danh dự án là **lớp ③ Brand Kit**, không phải màu hệ thống.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ**: **[T5] con người quyết cuối** (`:32`) · **[Đ2] nhìn vào trong trước** (`:72`). Số T ghi sai thì **báo lại đúng số**.

## ⑦ NGHIỆM THU TỰ LÀM
```bash
npm run soi:tu-dien
npm run soi:hinh-hoc
```
Không đụng code ⇒ không cần `tsc`.

## ⑦b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** danh sách V1 **đi từ route thật**, đủ cột, có nêu chỗ lệch sổ↔route · **≥3 kịch bản khác nhau về CƠ CHẾ** (khác trang trí không tính) · mỗi kịch bản đủ **3 nấc × 2 trạng thái dự án** · mỗi kịch bản trả lời được **cả 4 câu** ở mục ② · bảng V3 có cột *"gãy ở đâu khi app lớn thêm"* · cả 3-4 chấm bằng thước có sẵn · `soi:tu-dien` **không tăng** (nền 212) · `soi:hinh-hoc` giữ mốc **10** · **0 mục chữ dưới ngưỡng đọc-được ở cả hai theme** · 1440×900 không tràn ngang.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt; **CẤM** dựng 3 kịch bản khác nhau mỗi cái đổi vài pixel rồi gọi là 3 phương án.

## ⑧ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-P-kich-ban-sidebar.md`, khuôn 6 phần `docs/CLAUDE.md`.

## ⑧b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: stage nào bạn **không chắc** thuộc cấp app hay cấp dự án (nói rõ, đừng đoán bừa) · kịch bản nào bạn thấy **thước chấm không tới** · bạn có **mở app thật** không (nếu không thì mọi kết luận về điều hướng hiện tại là **đọc mã**) · chỗ nào bạn **chọn một con số** không có nguồn.

## ⑧c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi Hoà chọn một kịch bản (các kịch bản còn lại phải **khai tử tường minh**, không bỏ hoang) · khi **Chat** được dựng mặt · khi bản tablet/điện thoại bắt đầu làm (sidebar là thứ vỡ đầu tiên khi màn hẹp).

## ⑨ DÂY MÁY
`khung-mot-khuon` · `luong-theo-viec` · `kien-truc-tool-3-lop`. Bạn **không** sửa registry — T flip sau audit.
