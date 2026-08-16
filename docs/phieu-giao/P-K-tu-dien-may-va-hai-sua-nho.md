# P-K · ĐƯA 9 TÊN ĐÃ DUYỆT VÀO MÁY + VÁ LỖ MÁY SOI + HAI SỬA CODE CÓ CHỦ ĐÍCH

> Khuôn §3 `docs/HOP-DONG-PHOI-HOP-T.md`. Tự chứa.
> **THẺ VAI [Đ4]:** phiên phụ cấp CHẶNG/LUỒNG. Chạm biên (đổi tên KIỂU/UNION dùng khắp repo, đổi
> hợp đồng lệnh, đổi schema) → **DỪNG + đề xuất lên T**. Đọc kỹ §④ V5: có thứ phiếu này **cố ý KHÔNG làm**.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```bash
git log --oneline -1
git rev-list --count HEAD..main   # phải ra 0
```
Lệch > 0 → **DỪNG**, báo T. Bạn làm trong **cây chính**, có một phiên phụ khác chạy song song (chỉ ghi `docs/mocks/` + báo cáo).

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận/bác bỏ từng ý
1. *"`scripts/soi-tu-dien.mjs:30` khai `EXT = new Set(['.ts','.tsx','.html','.css'])` ⇒ máy soi từ điển **KHÔNG quét `.md`**, tức **mù đúng thư mục `docs/phieu-giao/`** — nơi agent đọc để thi hành. Nhãn lệch trong phiếu **lan thẳng vào code của phiên sau**."*
2. *"`docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` §V5 có bảng 13 dòng; **Hoà đã duyệt 9 dòng 🔴** ngày 16/08."*
3. *"Dòng #8 (mã điều khoản `[Đ1]`↔`[Đ2]`) **ĐÃ SỬA XONG** trong đợt trước — bạn **không** phải sửa lại, chỉ cần **canh cho nó không tái phát**."*

Bác ý nào → **DỪNG**, báo T kèm `file:dòng`.

## ① BỐI CẢNH

Chữ dùng lệch không làm app sập — nó làm **người sau hiểu sai rồi sửa nhầm chỗ**. Ca đau nhất đã đo được: **`lớp` mang 4 nghĩa cùng tên `layer`** (lớp bản vẽ CAD · phần tử z trong slide · trục Thẻ DNA · lớp luật/góp ý); hai cái đầu **cùng bộ thao tác** ⇒ sửa nhầm chặng mà **`tsc` và test vẫn xanh**. Đó là loại lỗi máy hiện có **không bắt nổi**.

Và bệnh này đang **lan qua đường phiếu giao việc** — đúng chỗ máy soi đang mù.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` (đọc HẾT, nhất là §V5 và mục đề xuất luật máy soi) | nguồn của mọi tên trong phiếu này |
| `scripts/soi-tu-dien.mjs` (đọc HẾT) | cỗ máy phải mở rộng — xem nó khai từ điển và báo lệch kiểu gì |
| `docs/00-CHOT.md` — mục **"[16/08 Hoà chốt 4 câu gộp]"** (cuối file) | 4 quyết định của Hoà, gồm cả hai chỗ Hoà giao T quyết |
| `components/ui/ToolbarChip.tsx` | nơi có `opacity: disabled ? 0.5 : 1` |
| `app/globals.css` — khối khai token màu | `--mat-*` nằm đây |

## ③ VÙNG FILE
**ĐƯỢC ghi:** `scripts/soi-tu-dien.mjs` · `app/globals.css` · `components/ui/ToolbarChip.tsx` · các tệp **tiêu thụ `--mat-*`** (chỉ để đổi tên biến, không đổi gì khác) · `docs/nc/NC-TU-DA-NGHIA-2026-08-16.md` (thêm mục "đã thi hành") · `docs/bao-cao-phien/2026-08-16-P-K-tu-dien-may.md` (mới).
**CẤM:** `scripts/frontier-registry.mjs` · `docs/00-CHOT.md` · `docs/mocks/*` (phiên khác đang giữ) · `components/ui/LightBar.tsx` · `lib/ui/tien-trinh.ts` · `components/ui/Tooltip.tsx` · `lib/dna/*` · `lib/review/*` · `lib/cad/model.ts`.
**KHÔNG git. KHÔNG dev server.**

## ④ VIỆC

### V1 — Vá lỗ máy soi mù `.md` (marker: `EXT`) 🔴 làm TRƯỚC
Cho `soi:tu-dien` quét `.md`. ⚠️ **Sẽ nổ ra rất nhiều báo đỏ** — `docs/` có **554 tệp `.md` · 33 MB**, và phần lớn là **nhật ký lịch sử** (`CHANGELOG` · `docs/memory/` · `docs/bao-cao-phien/` cũ): sửa nhật ký cũ là **viết lại lịch sử**, không phải sửa lỗi.
⇒ **Phạm vi quét `.md` chỉ gồm nơi chữ còn ĐANG ĐIỀU KHIỂN việc**: `docs/phieu-giao/` (ưu tiên số 1 — agent đọc để thi hành) · `docs/mocks/` · và các spec đang hiệu lực nếu bạn đo thấy đáng.
**Loại trừ tường minh, có ghi lý do trong code**: `CHANGELOG.md` · `docs/memory/` · `docs/bao-cao-phien/` · `docs/00-CHOT.md`.
Nếu bạn đo ra ranh giới khác hợp lý hơn, **được quyền đề xuất**, nhưng phải nêu **số liệu** (bao nhiêu tệp, bao nhiêu chỗ báo đỏ) chứ không phải cảm giác.

### V2 — Nạp 9 tên đã duyệt vào từ điển máy (marker: `tuDienDaNghia`)
Lấy đúng cột *"tên riêng đề xuất"* ở §V5 cho 9 dòng 🔴. Máy phải **báo được chỗ dùng chữ trần đa nghĩa** và **gợi tên đúng**.
⚠️ Từ điển này khác từ điển cũ (nhãn-hiển-thị-lệch): đây là **một-chữ-nhiều-nghĩa**. Cân nhắc để nó thành **luật riêng có tên riêng** trong cùng một máy, đừng nhồi vào cùng danh sách cũ rồi lẫn hai loại lỗi.

### V3 — Mức nghiêm: CẢNH BÁO trước, chưa CHẶN (marker: `mucNghiem`)
Phát đầu tiên **không được chặn build** — `docs/phieu-giao/` sẽ đỏ nhiều, mà đỏ-mà-không-sửa-được là cách nhanh nhất giết một máy soi (người ta học cách bỏ qua nó).
⇒ **cảnh báo + đếm**, có đường bật chặt về sau. Báo cáo phải ghi **con số thật**: bật xong thì bao nhiêu chỗ đỏ, ở đâu.

### V4 — Hai sửa code có chủ đích
**V4a · Token `--mat-*` → `--nen-mo-*`** (dòng #3 bảng). Lý do: `--mat-panel/card` (màu kính giao diện) cách `matId` (mã vật liệu nối tới **giá**, `lib/cad/materials.ts:58`) **đúng một dấu gạch** — một bên là màu, một bên là tiền.
Đổi **tên biến CSS + mọi nơi tiêu thụ**, giữ nguyên giá trị. Đây là đổi tên **cơ học, khép kín**, `tsc` + mắt bắt được ngay nếu sót.
🔎 Đếm số nơi tiêu thụ **trước khi sửa**, ghi vào báo cáo; sau khi sửa **grep lại `--mat-` phải về 0** (trừ `matId` — khác hẳn, đừng đụng).

**V4b · Độ mờ nút mờ: hằng số → token theo theme** (chốt Hoà 16/08, T quyết cách làm).
`ToolbarChip.tsx` đang `opacity: disabled ? 0.5 : 1`. Đo được: **2,54:1 ở theme SÁNG** (tối 4,01) — dưới ngưỡng 3:1 của WCAG 1.4.11 cho thành phần giao diện.
⇒ Thay `0.5` bằng **token khai trong `globals.css`, có giá trị riêng cho từng theme**, chỉnh sao cho **cả hai theme đạt ≥ 3:1**. Nền sáng cần **đậm hơn** nền tối mới đọc ra.
⭐ **Vì sao làm bằng token chứ không sửa con số**: theme sáng sắp đổi sang bản canh-Apple; khai bằng token thì lúc đó **chỉ đổi token**, component không phải đụng lần hai. Ghi lập luận này vào comment ngay tại chỗ khai.
📏 Nghiệm thu: **đo tương phản thật ở cả hai theme**, dán số vào báo cáo. Giữ nguyên `cursor: not-allowed` và đường `aria-disabled` + `aria-describedby` mà đợt trước vừa dựng — **đừng phá nó**.

### V5 — ⛔ THỨ PHIẾU NÀY CỐ Ý KHÔNG LÀM
**KHÔNG đổi tên KIỂU/UNION dùng khắp repo** — `Layer` · `Card` · `Tang` · các union trong `lib/dna` · `lib/review` · `lib/cad/model.ts`.
Hoà duyệt **CÁI TÊN**, không có nghĩa là duyệt **một cú đổi hàng loạt ngay hôm nay**. Đổi tên xuyên repo cần vòng an toàn riêng (đo nơi dùng · đổi từng cụm · chạy test giữa các cụm), và trộn nó vào phiếu này thì **hỏng cả hai**.
⇒ Việc của bạn: **liệt kê từng cụm đổi tên còn lại + số nơi dùng đo được + thứ tự đề xuất**, để T mở phiếu riêng. Đây là **đầu ra bắt buộc**, không phải phần tuỳ chọn.

## ⑤ RÀNG BUỘC
- Máy soi phải **tất định** — grep/AST, **KHÔNG dùng AI** (luật kiểm-bằng-máy, Hoà chốt 15/08).
- Màu qua biến CSS, cấm hex ngoài khối khai token. Thang bo **6/10/14/20 + `--r-full`**.
- **Trích mã điều khoản `docs/TRIET-LY-IF.md`** — **MỞ FILE ĐỌC SỐ, cấm nhớ hộ** (hôm nay vừa có một đợt trích sai mã trên diện rộng, gốc bệnh chính là nhớ-hộ): **[T1] một-nguồn** · **[Đ2] nhìn vào trong trước**. Trích **nguyên văn**; mã khác với T ghi thì **báo lại đúng mã**.
- Phiếu này **không dựng UI mới** ⇒ luật *"phiên phụ phải có mặt"* **không áp** — nhưng V4b **đổi thứ nhìn thấy được** (độ mờ nút), nên báo cáo phải có **số đo tương phản trước/sau ở cả hai theme**. Đó là phần "có mặt" của phiếu này.

## ⑥ NGHIỆM THU TỰ LÀM
```bash
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
npm run soi:thao-tac
npm run soi:frontier
```

## ⑥b ĐIỀU KIỆN ĐÍCH — VÒNG TỰ ĐÓNG
**ĐÍCH:** `tsc` 0 · `npm test` **0 fail** (nay đã sạch — làm nó đỏ lại là bạn gây ra) · `soi:frontier` 0 lệch · `soi:hinh-hoc` và `soi:thao-tac` **không thêm lệch mới** (nền: hình-học 10 · thao-tác 31 focus-visible + 193 hex) · `grep -- '--mat-'` **về 0** (trừ `matId`) · nút mờ đạt **≥ 3:1 ở CẢ HAI theme**, có số dán vào báo cáo · máy soi mới chạy được và **không chặn build**.
**VÒNG:** chưa đạt → tự sửa, **trần 5 vòng**. **QUÁ TRẦN → DỪNG**, nộp kèm bảng *"vòng nào hỏng vì gì"*. **CẤM** khai đạt khi chưa đạt; **CẤM** nới pattern máy soi cho qua cửa — lệch trong code app thì **ghi báo cáo cho T quyết**, đúng câu chính máy soi đang in ra.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-16-P-K-tu-dien-may.md`, khuôn 6 phần `docs/CLAUDE.md`. Dán nguyên văn kết quả lệnh.

## ⑦b CHƯA CHẮC — bắt buộc, trống cũng ghi "không có"
Bắt buộc phủ: ranh giới quét `.md` là **đo** hay **chọn** · con số tương phản đo bằng cách nào (công thức/công cụ nào) · từ nào trong 9 dòng bạn thấy **tên đề xuất chưa ổn** khi bắt tay vào (nói thẳng, **đừng tự đổi** — Hoà đã duyệt tên đó) · nơi dùng `--mat-*` bạn có chắc grep đã phủ hết chưa (còn chỗ nào tên biến ghép chuỗi động không).

## ⑦c HẠN DÙNG KẾT LUẬN
*"Hết đúng khi …"* — ít nhất phủ: khi **theme sáng đổi sang bản canh-Apple** (mọi số tương phản cột "sáng" phải đo lại, gồm cả nút mờ) · khi màu nhấn thứ hai được chốt · khi các cụm đổi tên ở V5 được thi hành.

## ⑧ DÂY MÁY
`chong-lech-dinh-nghia` (mở rộng) · `may-soi-dong-dang` (cùng họ, tín hiệu ②/⑤) · `he-mau-2-lop` (token độ mờ theo vai trò). Bạn **không** sửa registry — T flip sau audit.
