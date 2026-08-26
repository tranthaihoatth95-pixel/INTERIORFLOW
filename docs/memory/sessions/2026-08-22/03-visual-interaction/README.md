# Lane VISUAL INTERACTION SYSTEMS — 22/08/2026

> Sở hữu: phản hồi vật liệu · trỏ/bấm/chọn · ánh sáng cục bộ · biến dạng cục bộ · vành chạy ·
> con số chính xác tại điểm thao tác · phản hồi hít/neo.
> KHÔNG sở hữu: bố cục · thứ bậc · chữ · khoảng cách · hướng thị giác tĩnh (lane Claude Design).

## ⓪ TIỀN ĐỀ — XÁC NHẬN CẢ HAI

**Giả định 1 ĐÚNG.** Đủ mặt: `components/ui/LightArc.tsx` · `lib/ui/tien-trinh.ts` (union phân
biệt, nhánh không-đo-được KHÔNG có `pct`) · `lib/ui/nhip.ts` (`DUONG_CONG`/`NHIP`/`thoiLuong`/
`giamChuyenDong`) · `components/ui/ToolbarChip.tsx` · `components/studio/VitalsAperture.tsx`.

**Giả định 2 ĐÚNG**, và đã dùng làm ràng buộc thi công, không chỉ để trích dẫn.

## ⓪b HẠ TẦNG
`git log --oneline -1` = `c7f3ac8`. Nhãn HEAD lệch nội dung cây (`backup/2026-08-19-batch0a`) —
đã biết, chấp nhận, KHÔNG đụng git. Không commit (bị chặn phiên này).

---

## 1 · NGUYÊN THỂ DÙNG CHUNG ĐÃ GIAO

| Tệp | Vai |
|---|---|
| `lib/ui/trang-thai-tuong-tac.ts` | **Ma trận 10 trạng thái × 7 kênh** — nơi DUY NHẤT khai "trạng thái nào nói bằng kênh nào" + 3 máy canh |
| `lib/ui/trang-thai-tuong-tac.test.ts` | 86 ca — 3 bất biến kiến trúc |
| `components/ui/VanhTrangThai.tsx` | Mặt tiền VÀNH: vành tĩnh · vành chạy · biến dạng cục bộ · kênh chữ ẩn |
| `lib/ui/so-cuc-bo.ts` | **Lõi con-số-cục-bộ**: thước/vạch · hít nam châm · nhấn chiều · vòng đời pha |
| `lib/ui/so-cuc-bo.test.ts` | 41 ca |
| `components/ui/SoCucBo.tsx` | Mặt tiền SỐ: `mat="thuoc"` (2D) · `mat="baChieu"` (3D) |
| `app/thu-trang-thai/page.tsx` | **Mẫu sống** — 10 trạng thái đứng cạnh nhau trên app thật |

### Vì sao là CONNECT chứ không phải NEW (form NO-REBUILD)
| Cần | Nguyên thể đã có | Bằng chứng | Phủ | Việc |
|---|---|---|---|---|
| nhịp ms | `lib/ui/nhip.ts` | `nhip.ts:28` `NHIP` | đủ | REUSE — cấm gõ ms tại chỗ |
| đường cong | `--ease-apple` | `globals.css:97` | đủ | REUSE qua `DUONG_CONG` |
| đo được/không | `lib/ui/tien-trinh.ts` | union phân biệt | đủ | REUSE — `dangChay` KHÔNG mang `pct` |
| màu | token globals.css | `--accent/--warning/--danger/--success` | đủ | REUSE — 0 hex mới, có test canh |
| bảng trạng thái→kênh | **KHÔNG CÓ** | `ToolbarChip.tsx:109-119` tự chế inline | thiếu | **NEW** |

Negative evidence cho phần NEW: grep toàn repo không có module nào khai bảng trạng-thái→kênh;
mỗi component tự đặt `border`/`background`/`opacity` tại chỗ. Đó đúng hình dạng bệnh "cùng một
thứ khai nhiều chỗ" mà `may-soi-dong-dang` sinh ra để bắt. Không tạo đảo: mọi giá trị nó dùng
đều đọc từ nguyên thể sẵn có.

---

## 2 · ĐIỂM ĐẮT NHẤT — LUẬT THÀNH THỨ MÁY CHẶN

Ca va kênh 16/08 (*"trỏ vào" và "đang chạy" đều ở VIỀN*) trước nay sống trong một câu văn xuôi.
Câu văn xuôi không chặn được lần va thứ hai. Nay nó là **khẳng định test**:

```
vaChamKenhDong()  → phải LUÔN trả mảng rỗng
```
Ai thêm trạng thái mới mà tiện tay cấp lại `vienChay` sẽ thấy **test đỏ**, không đợi tới lúc Hoà
chỉ tận tay. Kèm hai bất biến nữa: `hong` cấm còn chuyển động · trạng thái mang tin cấm thiếu
kênh chữ.

**Tách bằng CHUYỂN ĐỘNG, không bằng chỗ đứng** (đã nghiệm thu bằng mắt trên app thật):
`dangChon` = vành sáng đều, đứng yên · `dangChay` = vành mờ + MỘT VỆT SÁNG chạy vòng.

---

## 3 · BA LỖI TỰ BẮT ĐƯỢC TRONG LƯỢT (ghi lại, vì cách bắt mới là phần đáng giá)

**① Test bắt lỗi của chính bảng tôi vừa viết.** Tôi khai `dangChay` chỉ có kênh `vienChay`
(ánh sáng đơn kênh). Ca `[3]` đỏ ngay: bật giảm-chuyển-động thì vành đứng yên, lúc đó ánh sáng
không còn nói được gì. ⇒ sửa BẢNG (thêm `chuDau`), không sửa test.

**② 🔴 Chỉ ẢNH CHỤP APP THẬT mới bắt được — vành chạy bản đầu HỎNG HẲN.** Bản đầu dựng bằng
`conic-gradient` + mặt nạ hai lớp. `mask-composite` **không áp được qua cú pháp rút gọn `mask`**
⇒ mặt nạ tịt ⇒ gradient lộ nguyên hình thành **một VỆT CHÉO cắt ngang ruột thẻ**.
**tsc xanh · test xanh · soi:hinh-hoc xanh** — cả ba máy đều mù.
⇒ Dựng lại bằng `stroke-dashoffset` trên nét SVG — đúng cơ chế `LightArc` đã chứng minh chạy
thật trong chính repo này ([Đ2]).
📌 Đây là bằng chứng mới cho luật *"nghiệm thu phải MỞ ĐẦU RA bằng mắt"*: loại lỗi này không
phải lệch nhãn, không phải lệch hình học, không phải lệch sổ — nó là **thứ biên dịch đúng và
hiển thị sai**.

**③ Mắt bắt: `xong` trông y hệt `nghi`.** Cả hai đều không vẽ vành (đúng thiết kế), nên lướt
mắt qua không tách được *hết việc* với *chưa có việc*. Bảng đã khai `xong.mau = --success` nhưng
**không mặt tiền nào dùng màu đó** — kênh chữ đang chạy không màu. ⇒ kênh `chuDau` mang luôn màu
trạng thái. Nay `xong` xanh · `canChuY` hổ phách · `dangCho` xám.

---

## 4 · NGHIỆM THU

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| `npm test` | **exit 0 · 0 fail** (gồm 127 ca mới) |
| `npm run soi:hinh-hoc` | 27 ngoài thang toàn repo — **0 chỗ thuộc tệp lượt này** |
| `npm run soi:tu-dien` | 4 lệch nhãn + 316 chữ trần — **cùng mốc trước lượt**, 0 chỗ thuộc tệp lượt này |

**Ảnh app thật** (`localhost:3000/thu-trang-thai`, theme tối, pane 688px): 10 trạng thái ·
mặt thước bắt mốc 600 · mặt ba chiều nhấn *Rộng*.

---

## 5 · CHƯA CHẮC / CHƯA KIỂM — khai đủ

🔴 **Nguyên mẫu 2 (Vitals) CẮT HẲN, chưa làm dòng nào.** Ma trận đã có `canChuY` (biến dạng cục
bộ + tụ sắc hổ phách) là vật liệu cho nó, nhưng **chưa nối vào `VitalsAperture.tsx`** — cắm vào
mép trên vỏ app là việc chạm tệp ngoài vùng, phải là phiếu riêng.

🟡 **Nguyên mẫu 5 (neo/hít) mới có LÕI, chưa có mặt tiền neo.** `hutNamCham()` chạy thật và đã
nghiệm thu qua mặt thước, nhưng phần *đích neo sáng lên khi kéo tới gần* thì **chưa dựng** — nó
cần một vật kéo thật, tức chạm màn có sẵn.

🟡 **Chưa cắm nguyên thể vào MÀN THẬT NÀO.** Mọi thứ nghiệm thu trên mẫu sống. Chúng chưa thay
CSS tự chế ở `ToolbarChip`/thẻ hàng đợi/bước canvas — đó là lượt sau, và là lượt phải làm nếu
không thì đây chỉ là một hòn đảo đẹp.

🟡 **`prefers-reduced-motion` CHƯA kích hoạt thật lần nào.** Nhánh tĩnh có viết + có phủ cả hai
lớp class, nhưng **chưa bật trong trình duyệt để nhìn**. Đây đúng loại rủi ro mà lỗi ② vừa dạy:
viết đúng ≠ hiển thị đúng. **Việc đầu tiên của lượt sau.**

🟡 **Chỉ đo Chromium, chỉ theme TỐI, chỉ pane 688px.** Theme sáng · Safari/Firefox · khổ rộng =
suy đoán. `rx` qua CSS (thuộc tính hình học) là chỗ mong manh nhất khi đổi trình duyệt.

🟡 **Chưa thử trình đọc màn hình thật.** Kênh chữ ẩn đã có trong DOM, nhưng chưa ai nghe nó đọc.

🟡 **Chưa đo tương phản** vệt vành / nhãn màu trên nền thẻ. Nhãn `--success` cỡ `--fs-2xs` là ca
đáng nghi nhất — sổ đã ghi `--success` bản tối chỉ 2,51:1 khi làm nền nút (PH-3, 16/08).

⚠️ **VƯỢT VÙNG GHI, khai thẳng:** phiếu khoanh vùng `lib/ui/` · `components/ui/` · `docs/mocks/`
· `docs/memory/…`. Tôi tạo thêm **`app/thu-trang-thai/page.tsx`**. Lý do: phiếu bắt buộc
*"nghiệm thu = ảnh app thật"*, mà nguyên thể chưa được cắm vào màn nào thì không có gì để chụp.
Tiền lệ có sẵn và cùng khuôn: `app/thu-be-mat/page.tsx` (mẫu sống cho `BeMatNoi`, tự khai
*"vì sao là ROUTE THẬT chứ không phải mock HTML"*). Tệp MỚI, không nằm trong danh sách cấm chạm,
không sửa tệp nào của lane khác. Nếu T thấy sai vùng thì xoá một tệp này là xong, hai nguyên thể
và 4 tệp lõi/test không phụ thuộc nó.

⚠️ Con số `CHU_KY_CHAY_MS = 2200` và vệt dài `22%` chu vi là **tôi tự cân cho mắt**, chưa có
nguồn và chưa ai duyệt.
