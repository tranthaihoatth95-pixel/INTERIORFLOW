# PHIẾU P-U — MÀN KHOÁ: CÓ HÌNH NỀN + GỠ MÀU ĐỒNG ĐÃ BỊ BỎ

> Giao: T · 17/08 · vùng khoá: `components/LoginScreen.tsx` + `lib/lockscreen.ts` + mock + báo cáo.
> ⛔ **KHÔNG đụng** `components/home/` · `lib/wallpaper/` (chỉ **dùng**, không sửa) · `scripts/` ·
> `lib/materials/` · `app/globals.css` (**cấm thêm/đổi token màu** — xem ⑤).

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
```
git log --oneline -1
git rev-list --count HEAD..main
```
Lệch main > 0 → **DỪNG NGAY**, báo T. Mốc khi phóng: `58ef7be`.

## ⓪ TIỀN ĐỀ NGHIỆP VỤ — xác nhận hoặc BÁC
> **TIỀN ĐỀ:** *"Màn khoá đang xấu vì **hai** thứ, cả hai đã được Hoà chốt bỏ nhưng chưa ai thi công:
> ① nó **không có hình nền** — `SystemWallpaper` xuất hiện **0 lần** trong `LoginScreen.tsx`, nền là
> `var(--bg)` đặc cộng một quầng `radial-gradient` mờ; ② toàn bộ tông nâu đến từ hằng số
> `COPPER = '#c79a63'` **gõ cứng** ở `LoginScreen.tsx:14`, đúng màu Hoà **bỏ hẳn 16/08**."*

→ `[XÁC NHẬN | BÁC BỎ | KHÔNG CÓ BẰNG CHỨNG]` + file:dòng. Bác thì **DỪNG**, báo T.

## ① BỐI CẢNH
Hoà xem ảnh `00-01-man-khoa.png` và nói nguyên văn: ***"Ko có hình nền nhìn xấu dã man"***.
Đây là **màn đầu tiên** mọi người dùng nhìn thấy — nó đang là một khối nâu trơn.

Hai chốt liên quan, **đều đã có, đều chưa thi công**:
- **16/08** — *"**màn khoá** cho KTS thả **ảnh render của mình** · **Home** dùng ánh sáng vì dày dữ liệu"*.
  Tức ranh giới đã rõ: **màn khoá = ẢNH**, Home = nền sinh bằng mã.
- **16/08** — *"bỏ màu vàng đấy thay bằng màu khác, **tone vàng mà thêm xám vào là thảm hoạ**"* ⇒
  `--accent-warm` **bỏ khỏi vai màu nhấn**. Sổ đã ghi *"nút Vào xưởng ở màn khoá đang màu đồng → đổi theo"*.

## ② ĐỌC TRƯỚC
| File | Vì sao |
|---|---|
| `components/LoginScreen.tsx` toàn bộ | đối tượng của phiếu |
| `components/wallpaper/SystemWallpaper.tsx` | **dùng lại**, đừng viết lớp nền thứ hai; đọc kỹ phần *nhịp thời gian một `setTimeout`* và `pointer-events:none` |
| `lib/wallpaper/prefs.ts` · `sets.ts` | 5 bộ + `MAC_DINH` + nấc giảm chói |
| `components/settings/LockScreenSettings.tsx` | màn cài đặt màn khoá **đã có**, `WallpaperSettings` đã mount ở đó |
| `docs/IF-KIEN-TRUC.md` §7 | ba nấc = ba công năng (nếu có nấc nào) |

## ③ VÙNG FILE
- **SỬA**: `components/LoginScreen.tsx` · `lib/lockscreen.ts` (nếu cần chỗ lưu lựa chọn ảnh)
- **TẠO**: `docs/mocks/mock-man-khoa.html` (dòng đầu `<!-- @dsCard group="Vào app" -->`) ·
  `docs/bao-cao-phien/2026-08-17-P-U-man-khoa.md`

## ④ VIỆC
1. **CẮM HÌNH NỀN.** Thứ tự thoái lui, khai rõ trong mã:
   ① **ảnh của người dùng** (nếu đã đặt trong Cài đặt màn khoá) → ② **nền hệ thống sinh bằng mã**
   (`SystemWallpaper`, 5 bộ, đổi theo giờ — **dùng lại, không viết mới**) → ③ `--bg` trơn khi người
   dùng tắt hẳn. **Không bao giờ rơi về khối nâu trơn như hiện nay.**
   Marker code: `[marker: manKhoaNen]`.
2. **GỠ MÀU ĐỒNG.** `COPPER = '#c79a63'` gõ cứng (`:14`, dùng ở `:98 :119 :154 :236`) → **token**.
   ⚠️ Xem ràng buộc ⑤ về *dùng token nào* — **cấm tự chế màu mới**.
3. **THẺ ĐĂNG NHẬP PHẢI ĐỌC ĐƯỢC TRÊN MỌI ẢNH.** Đây là điểm nghiệm thu thật, không phải chuyện đẹp:
   nền là ảnh **do người dùng chọn** ⇒ độ sáng **không đoán trước được**. Thi hành đúng cách đã chốt
   16/08: nền để **NÉT** (không bôi mờ cả ảnh), chữ đọc được nhờ **tấm kính đủ đặc** ở vùng có chữ.
   ⇒ tương phản chữ phải là **hằng số không phụ thuộc ảnh**. Phải có **nấc giảm chói** (NT-16), và
   **giảm chói cắt ánh kim, KHÔNG BAO GIỜ cắt độ đọc**.
4. **CHỪA LỀ CHO NỀN THỞ** — thẻ không phủ kín màn; nền ló ra quanh rìa mới có nghĩa là nền.
5. **BẢN VẼ** `mock-man-khoa.html`: đủ **2 theme**, token thật, **0 hex gõ tay**, bày đủ ca —
   ảnh sáng · ảnh tối · ảnh nhiều chi tiết · không có ảnh (rơi về nền sinh bằng mã) · bật nấc giảm chói.
   Tự chấm `design:design-critique` + `design:accessibility-review` trước khi nộp.

## ⑤ RÀNG BUỘC — đọc kỹ, đây là chỗ dễ làm hỏng nhất
- 🔴 **MÀU NHẤN THỨ HAI CHƯA CHỐT.** Hoà đang cân **mòng két ↔ mận** và nói *"để tôi xem bản vẽ đã"*.
  ⇒ **TUYỆT ĐỐI không chọn hộ, không tự chế hue mới, không thêm token màu vào `globals.css`.**
  Nút chính dùng **`--accent`** (tím `#7c3aed`) — đó là màu **đã chốt và đang chạy khắp app**, nên
  đây là *thôi dùng màu đã bị bỏ*, **không phải** *chọn màu mới*. Khai rõ điều này trong docstring.
- **KHÔNG viết lớp nền thứ hai** — `SystemWallpaper` đã có, đã chạy thật ở Home từ 16/08. Đẻ bản
  thứ hai là đúng thứ `may-soi-dong-dang` sinh ra để bắt.
- **KHÔNG** lệnh `git` ghi · **KHÔNG** dev server · **KHÔNG** đụng `app/globals.css`.
- Nền **`pointer-events:none` + `aria-hidden`** — không bao giờ khoá tay người dùng.
- `prefers-reduced-motion` thắng mọi hiệu ứng vào.
- **Mã điều khoản: MỞ `docs/TRIET-LY-IF.md` ĐỌC SỐ**, cấm chép theo phiếu.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
npm test
npm run soi:tu-dien
npm run soi:hinh-hoc
```

## ⑥b ĐÍCH — VÒNG TỰ ĐÓNG, TRẦN 5 VÒNG
**ĐÍCH**: `tsc` 0 · `npm test` 0 fail · 2 máy soi không thêm lệch mới · `grep -c "#c79a63"` trong
`LoginScreen.tsx` = **0** · `grep -c "SystemWallpaper"` trong `LoginScreen.tsx` ≥ **1** · bản vẽ tự
chấm không còn lỗi mức chặn · **tương phản chữ trong thẻ đăng nhập đạt ≥4,5:1 trên CẢ ca ảnh sáng
lẫn ảnh tối** (tính ra số, dán vào báo cáo).
Chưa đạt → tự sửa rồi chạy lại, trần **5 vòng**. Quá trần → **DỪNG**, nộp kèm bảng *vòng nào hỏng vì gì*.

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-P-U-man-khoa.md` — khuôn 6 phần (`docs/CLAUDE.md`), dán nguyên văn kết quả lệnh.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng ghi "không có"
Đặc biệt: **chưa chạy app thật thì nói thẳng** · tương phản là **tính** hay **đo** · ca *ảnh người
dùng tự thả* đã thử với ảnh thật nào chưa, hay chỉ dựng giả.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi rõ *"kết luận này hết đúng khi …"* — gợi ý: **khi Hoà chốt màu nhấn thứ hai**, nút chính phải rà lại.

## ⑧ DÂY MÁY
Entry registry: T tự mở sau audit. **Agent KHÔNG sửa `frontier-registry.mjs`.**
