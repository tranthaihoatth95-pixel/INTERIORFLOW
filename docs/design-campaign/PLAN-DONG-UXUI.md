# KẾ HOẠCH ĐÓNG UX/UI — END TO END, AUTO MODE
Lập 23/08. Nguyên tắc: **mắt Hoà KHÔNG chặn đợt** — nó dồn vào SỔ, cuối đợt chỉnh một lượt.

## Cơ chế then chốt: SỔ DUYỆT MẮT
Hoà mở Electron nhìn trực tiếp (`npm run dev:electron`, cổng 3799, HMR sống).
Thấy gì nói nấy → **MAIN ghi vào `docs/design-campaign/SO-DUYET-MAT.md`** theo khuôn cố định:

```
[N] MÀN · TRẠNG THÁI — điều Hoà nói (nguyên văn)
    LOẠI: thị giác | hành vi | dữ liệu | ngôn ngữ | hiệu năng
    HỆ THỐNG? có/không   ← có = sửa ở token/primitive, không = sửa tại chỗ
    TRẠNG THÁI: mở | đã sửa | bác (kèm lý do)
```
**Không dừng đợt để sửa từng mục.** Ghi → đi tiếp → cuối đợt chỉnh một lượt theo sổ.
Mục nào `HỆ THỐNG? có` thì sửa ở tầng token/primitive, không vá màn lẻ.

## Sáu đợt

| Đợt | Việc | Chặn bởi | Ai |
|---|---|---|---|
| **0 · GỠ CHẶN** | Icon primitive (giết 93% của 1.164 vi phạm nền — ngữ pháp icon đã có, KHÔNG chờ token) · dọn phiên chết · Electron sẵn sàng cho Hoà nhìn | không gì | MAIN |
| **1 · NỀN MÓNG** | Foundation tokens về → thi hành: type · colour roles (sửa luôn be↔trắng lệch nhiệt) · spacing · elevation · motion `--nhip-*` | phiên thiết kế | Design → MAIN |
| **2 · MÔI TRƯỜNG** | Bộ nền giấy-draft lưới lam + 4 khung giờ (engine đã có, chỉ thêm bộ) | đợt 1 | Design → MAIN |
| **3 · HOME** | 5 trạng thái A→E · State B snapshot-làm-nền + cổng chụp fail-closed | đợt 1,2 | Design → MAIN |
| **4 · VỎ** | Rail hai viên (2D·3D·Present·`+`) · Collab thành LỚP · Vitals về đường ranh · Cold Open | đợt 1 | Design → MAIN |
| **5 · ĐÓNG** | Chỉnh theo SỔ · chạy hết cổng · dựng bộ cài `.dmg` · nghiệm thu trên bản đóng gói | đợt 0–4 | MAIN |

## Đang chặn — và cách gỡ
| Chặn | Gỡ bằng |
|---|---|
| Mắt Hoà (accent thứ 2 · G3 đặt đâu · duyệt mock) | **Electron sống** — Hoà nhìn trực tiếp, nói, MAIN ghi sổ. Không chờ. |
| Chưa có phiên thiết kế | Hoà đang mở |
| Kiến trúc Collab/Present | Đề xuất đã trình, **chờ Hoà gật một câu** |
| 4 tiến trình `next dev` lạc (11452·11453·18745·18746) | Cần tay Hoà — cả 2 phiên đều bị chặn `kill` |
| Không đăng nhập được (QA) | Cần tay Hoà một lần |

## Cổng đóng đợt (không tự tuyên bố xong)
`tsc 0` · `npm test 0` · `soi:foundation` giảm thật · `soi:cam-dien 0` · Electron đóng gói mở
được · nghiệm thu trên **bản đóng gói**, không phải dev · SỔ hết mục `mở`.
