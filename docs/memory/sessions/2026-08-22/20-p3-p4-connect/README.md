# Wave 16 (Lane B) — P3 Voice + P4 Site: NỐI, không dựng mặt mới

## 1 · Tổng quan
Hai việc CONNECT. Bắt được **một lỗi của chính tôi** (Voice nuốt câu) và **một rủi ro ngủ** ở Site
(ngưỡng tự đặt nằm trong bảng luật sống). Không dựng route mới, không dựng app mới.

## 2 · P3 — Voice nuốt câu (lỗi do tôi gây ở lượt mount trước)
Đo trên bản đóng gói: câu gõ → `POST /api/home/notes` → **401** → **màn không nói gì**.
Gốc: dòng tôi viết `void fetch(...)` rồi quên luôn — không đọc kết quả.
⇒ Người dùng tưởng đã ghi xong và đi tiếp; **câu mất im lặng**. Đúng thứ docstring của chính
`CuaGiongNoi` cấm ("không nuốt câu"), và nuốt còn tệ hơn báo lỗi.
**Sửa**: báo đúng nguyên nhân (401 hết phiên · mã khác · mất mạng) **kèm nguyên văn câu vừa mất**
để người dùng chép lại được. `CuaNhan.ghiChu` là `(d) => void` (không có đường trả về) ⇒ nối bằng
sự kiện `if:voice-loi` tới dòng lỗi sẵn có — **không đổi hợp đồng**.
🟡 **pending-rebuild**: `.app` trên :3777 là ảnh chụp ĐÓNG BĂNG lúc build; `if:voice-loi` có 2 lần
trong repo, **0 lần** trong gói. Port đó không xác minh được mã mới. Tôi khai unverified thay vì
nhận xanh — MAIN nhờ đó bắt được lệnh sai của chính họ và ra luật `pending-rebuild` cho cả hai lane.

## 3 · P4 — hai bảng ngưỡng song song (rủi ro NGỦ)
`chinh-sach.ts` mồ côi (`grep "from '.*chinh-sach'"` = **0**). Trong khi đó:
| Bảng | Vai | Trạng thái |
|---|---|---|
| `suy-luan.ts:158 NGUONG` | luật ĐANG DÙNG | sống |
| `chinh-sach.ts:76 SO_NGUONG` | xếp hạng nguồn + `dungDuocTrongSanXuat()` | **không nối đâu cả** |
⭐ Trùng khớp: `NGUONG.doAmCaoPc = 75` **chính là** `khi-hau.am-cao` mà chính sách xếp `uoc-le`
(*"chưa tra được ngưỡng ẩm nào được ban hành"*) ⇒ **một con số chính sách cấm ship đang nằm trong
bảng luật sống**. Chưa nổ vì luật đó cần sự thật khí hậu — **chưa có nguồn dữ liệu**.
⇒ Rủi ro NGỦ: ngày cắm nguồn khí hậu vào, số tự đặt **ship im lặng**.
**Sửa**: `NGUONG.doAmCaoPc` lấy thẳng từ chính sách (một số, không hai số trôi) + kết luận mang
theo lời khai `⚠️ Ngưỡng dùng ở đây: 75 % — quy ước làm việc, chưa có nguồn ngành: …`.

## 4 · ⭐ MỘT LẦN ĐI SAI RỒI QUAY LẠI — phần đáng giữ nhất
Bản đầu tôi làm **cổng chặn cứng**: ngưỡng `uoc-le` ⇒ luật IM. Nó làm **ĐỎ `vat-ly.test.ts:194`**
— **test tôi KHÔNG sở hữu**, khẳng định ca ẩm+ven-biển PHẢI chạy.
**Tôi không đập test cho qua.** Đọc lại thì test ĐÚNG: bịt miệng một kết luận có ích thì người dùng
mất tin tức mà chẳng được gì; nguy hiểm thật nằm ở chỗ **ngưỡng tự đặt đi mà không ai biết**.
`KetLuanSuyRa` không có trường độ tin ⇒ không hạ hạng bằng cấu trúc (đổi schema = phạm vi khác).
⇒ Đường thứ ba: **cho nổ + khai thẳng trong chính lời giải thích**. Không bịt miệng, không ban phước.
📌 Luật rút ra: **một test đỏ mà mình không viết là BẰNG CHỨNG, không phải chướng ngại.**

## 5 · `dia-ly.ts` — CỐ Ý để mồ côi
Địa lý/khí hậu/gió **chưa có nguồn dữ liệu**. Nối vào là dựng một miền rỗng trông như đang sống.
Đây là **câu trả lời đã xong**, không phải việc bỏ dở.

## 6 · Đánh giá khách quan
- ✅ Cả hai đều là NỐI thứ đã có, 0 route mới, 0 mặt mới.
- ⚠️ Bản vá Voice **chưa chạy thật lần nào** — chờ MAIN rebuild.
- ⚠️ Chuỗi Site vẫn chỉ chứng minh trên **dev**; trên `.app` cần dự án ⇒ blocked.
- 🔴 **Năm lần tôi phải sửa phép đo của chính mình trong ngày**: `.gia` vs `.giaTri` · đếm `<img>` ·
  regex "tường auth" · route `/present-editor` · regex thiếu chữ trong test tôi vừa viết. Cả năm bị
  bắt trước khi thành kết luận, nhưng con số đó là **dữ liệu về độ tin của tôi**, ghi lại thay vì
  lặng lẽ sửa.

## 7 · Cổng
tsc 0 · npm test exit 0 · soi:frontier exit 0 · `dan-xuat.test.ts` 8 nhóm ĐẠT.
