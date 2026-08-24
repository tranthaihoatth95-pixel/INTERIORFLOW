# examples/ — KHO VÍ DỤ CÓ CHÚ GIẢI

## Vì sao thư mục này tồn tại

`docs/design-campaign/06-DESIGN-KNOWLEDGE-AUDIT.md` đo được một chuyện:

> Luật *"cấm lưới thẻ đều"* đã có từ **20/08**, nhắc lại **22/08** — vậy mà **23/08**
> sản xuất vẫn ra một tường thẻ trắng.

Luật ấy không nằm chỗ khuất. Nó nằm trong docstring của **chính tệp đang dựng bố cục**
(`components/home/xuong-layout.ts:7`, `components/home/BeMatHome.tsx:12-13`). Người viết
mã đọc nó, gật, rồi vẫn ra tường thẻ.

⇒ Kết luận không phải *"viết luật rõ hơn"*. Là: **chữ mô tả một hình không thay được
việc nhìn hình đó.** Ba lần thất bại cùng một lớp là bằng chứng đủ.

Thư mục này là **hình đối chiếu**. Mỗi lỗi có một cặp: cái đã hỏng thật, và cái đúng —
đặt cạnh nhau, kèm cơ chế.

## Nguyên tắc cứng của kho

1. **Ví dụ phải dạy VÌ SAO, không được chỉ nói "xấu".** Một tệp chỉ ghi *"trông xấu"*
   là một tệp vô dụng — nó không truyền được gì cho người chưa có mắt.
2. **Mọi khẳng định phải trỏ bằng chứng thật**: đường dẫn ảnh · `tệp:dòng` · hoặc ngày +
   trích dẫn. Không có bằng chứng thì ghi thẳng **"chưa có ảnh"**.
   ⛔ **Cấm mô tả một ảnh chưa mở ra nhìn.**
3. **Ví dụ TỐT cũng có mục `KHÔNG ĐƯỢC CHÉP GÌ`.** Ví dụ tốt bị chép nguyên xi là cách
   một quyết định đúng-cho-một-chỗ lan thành một luật sai-cho-mọi-chỗ.
4. **Ví dụ hỏng thì không xoá — sửa hoặc đóng dấu.** Kho này là bộ nhớ; xoá một ca hỏng
   là mời nó quay lại.

## Đọc theo thứ tự nào

| Bạn sắp làm gì | Đọc cặp nào trước |
|---|---|
| bất cứ màn nào có nhiều hơn 3 thẻ | ① HOME |
| điều hướng, rail, panel bên | ② SIDEBAR |
| bề mặt có canvas (2D · 3D · Present) | ③ 2D |
| màn không có nội dung dày (khoá · đăng nhập · trống) | ④ AUTH |
| bất cứ thứ gì trong suốt, mờ, bóng, hoặc màu nhấn | ⑤ KÍNH |

## Bảng kho

| Mã | Cặp | XẤU | TỐT |
|---|---|---|---|
| ① | Home | `BAD/home-tuong-the-23-08.md` | `GOOD/home-living-canvas.md` |
| ② | Sidebar | `BAD/sidebar-rail-icon-chung-chung.md` | `GOOD/sidebar-ban-do.md` |
| ③ | 2D | `BAD/2d-tuong-thanh-cong-cu.md` | `GOOD/2d-canvas-truoc.md` |
| ④ | Auth | `BAD/auth-man-khoa-rong.md` | `GOOD/auth-ambient-lien-tuc.md` |
| ⑤ | Kính | `BAD/kinh-soc-thu-va-gel-tim.md` | `GOOD/kinh-g1-g3-dung-cau-tao.md` |

`BEFORE-AFTER/` — cặp trước/sau **có ảnh thật ở cả hai bên**, tức thay đổi đã xảy ra
trên app chứ không phải trên bản vẽ:

| Tệp | Đo được gì |
|---|---|
| `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md` | dải chrome trên canvas 4 → 2 |
| `BEFORE-AFTER/g3-vao-xuong-nhua-thanh-kinh.md` | tâm=rìa → rìa đặc hơn tâm, oklab L 0.647 → 0.353 |

## Khuôn mỗi tệp — bắt buộc đủ bảy mục

```
# <mã> · <tên>
TỐT hay XẤU · ngày · ảnh/bản vẽ (đường dẫn)
## Nhìn thấy gì            (mô tả khách quan, chưa phán xét)
## VIỆC CON NGƯỜI nào được phục vụ / bị đánh mất
## NGUYÊN TẮC nào có mặt / bị vi phạm   (dẫn tệp luật + ngày)
## VÌ SAO nó hỏng — CƠ CHẾ, không phải cảm giác
## HỌC GÌ
## KHÔNG ĐƯỢC CHÉP GÌ
## NGUYÊN TẮC THAY THẾ ĐÚNG
```

Mục *"Nhìn thấy gì"* phải viết được bởi một người **không biết luật** — nếu nó đã mang
phán xét thì phần *"vì sao"* mất giá trị, vì kết luận đã bị nhét vào tiền đề.
