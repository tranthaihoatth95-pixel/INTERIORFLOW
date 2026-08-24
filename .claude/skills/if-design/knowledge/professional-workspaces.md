# Không gian làm việc chuyên nghiệp — LUẬT CHUNG, cấm chép diện mạo

> Chưng cất từ Photoshop · Illustrator · Figma · Blender · Cinema 4D · Rhino · AutoCAD · Revit ·
> DaVinci Resolve · Unreal. **Trích LUẬT CHUNG. Cấm chép diện mạo.**
> Phần khảo sát có nguồn trong repo: `docs/SPEC-PANEL-ROLLOUT-IDF.md` §1 (3ds Max · Blender ·
> Rhino · SketchUp, đo thật). Phần mở rộng sang 10 app dưới đây là **DIỄN GIẢI CỦA IF** — nêu ra
> để dùng, không phải trích dẫn có nguồn từng dòng.

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- App nghề nào cũng có panel — có luật chung nào không, hay mỗi ông một kiểu?
- IF nên bắt chước cái gì của Blender/Photoshop, và tuyệt đối không bắt chước cái gì?
- Mật độ lệnh bao nhiêu là chuyên nghiệp, bao nhiêu là ngộp?
- Vì sao "cho máy tự sắp panel cho gọn" là ý tồi?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**W-1 · CANVAS/VIEWPORT LÀ VUA.** Chrome không được nuốt sân khấu. Mốc đo có thật trong IF: màn 2D
đạt **canvas 1338 / 1440 = 93% bề ngang** (`01-CLINICAL-UI-AUDIT`) — dùng làm mức tham chiếu.

**W-2 · NGƯỜI DÙNG SẮP, MÁY KHÔNG SẮP.** Findlater (CHI 2004): giao diện **adaptable** (người tự
sắp) thắng **adaptive** (máy tự sắp) cả về tốc độ lẫn mức ưa thích (55% thích nhất). ⇒ **Cho người
dùng kéo; cấm máy tự đổi bố cục sau lưng họ.**

**W-3 · NHỚ BỐ CỤC, KHOÁ THEO LOẠI VẬT.** Lưu `{thứ tự panel, cái nào đang mở}` theo **loại đối
tượng** (tường · đồ nội thất · đèn · vùng · trang · khối 3D). ⛔ **Cấm khoá theo sub-mode** — đó
đúng là lỗi làm Command Panel của 3ds Max nhảy loạn. Luôn có **"Đặt lại bố cục panel"** nhìn thấy được.

**W-4 · THANH TIÊU ĐỀ = THU/MỞ · GRIP `⠿` = ĐỔI THỨ TỰ.** Tách hai việc (luật Blender). Kéo thì có
**bóng mờ theo chuột + vạch accent 2px chỉ chỗ thả** (luật 3ds Max). Chuột phải tiêu đề:
`Mở hết · Thu hết · Chỉ mở cái này · Đặt lại thứ tự` — nhưng **"Thu hết" phải có nút nhìn thấy**,
không giấu trong menu chuột phải (lỗi 3ds Max).

**W-5 · INSPECTOR THEO NGỮ CẢNH, DÙNG DẢI TRANG KHÔNG DÙNG CHỒNG ROLLOUT** (lời giải Rhino):
chọn tường → `Kích thước · Vật liệu · Nguồn` · chọn đèn → thêm `Ánh sáng` · chọn vùng → thêm
`Khối lượng` · **không chọn gì → thuộc tính bản vẽ/khung nhìn**, không phải panel trống.
Chọn nhiều loại → chỉ hiện trang **chung**. Lý do nghề: KTS nhảy sofa ↔ tường ↔ đèn liên tục.

**W-6 · GHIM.** Panel ghim thì ở lại dù đổi vật đang chọn hoặc đổi tab. Rẻ nhất, được khen nhất ở
cả 3ds Max (`Pin Stack`) lẫn Blender.

**W-7 · PHÍM TRƯỚC CHUỘT.** Mọi lệnh **chạy được** phải có đường bàn phím thật, tra từ **một sổ
lệnh chung**, và phím tắt phải **hiện ngay cạnh lệnh** (menu, tooltip, `⌘K`) — dạy tại chỗ dùng,
không bắt đi tra bảng. Cấm mỗi thanh công cụ tự khai phím riêng.

**W-8 · NHÓM CÔNG CỤ, HAI KHUÔN THEO TẦN SUẤT.**
- **Ổ kiểu Photoshop** — nhóm dùng liên tục: mặt ô là **lệnh vừa dùng**, bấm là **chạy luôn**, tam giác xổ.
- **Thư mục kiểu iOS** — nhóm tra thỉnh thoảng: mặt ô là lưới 2×2 xem trước, bấm là **mở**.

**W-9 · MẬT ĐỘ LỆNH — dày là được, LỘN XỘN là không.** App nghề được phép dày; điều kiện là
**thang nhất quán** (một bộ icon, một thang cỡ, một ngữ pháp nhóm). Mốc cảnh báo đo được trong IF:
Settings **107 nút**, 2D **101 nút**, Files/Library **11 cỡ chữ** — dày mà không cùng thang.

**W-10 · TOOLBAR = WORKING SET 4–8**, phần sâu nằm trong cửa sổ công cụ / inspector
(`CHOT-EXPERIENCE-SYSTEM` Master Capability). Thanh chung **không đổi theo stage**.

**W-11 · MỘT LỆNH, NHIỀU BỘ THI HÀNH.** Cùng động tác nghề ở mọi môi trường thì **cùng id · cùng
nhãn · cùng icon · cùng phím**, chỉ khác `run`. `Replace` ở 2D và 3D không được trông như hai chức
năng lạ nhau (`IF-MOTION-VISUAL-LAW §V`).

## 3 · VÌ SAO — cơ chế con người
Người dùng chuyên nghiệp trả **chi phí học một lần** để đổi lấy **tốc độ mỗi ngày**. Đó là hợp
đồng ngầm của cả 10 app trên. Hai hệ quả:
- Ổn định > gọn. Panel tự sắp lại "cho đẹp" phá trí nhớ cơ bắp — thứ đắt nhất họ đã trả tiền mua.
- Dày không đáng sợ; **bất nhất** mới đáng sợ. Người ta nhớ được 40 nút cùng ngữ pháp, không nhớ
  nổi 12 nút mỗi nút một kiểu.

Và lý do phím tắt phải hiện cạnh lệnh: người ta chỉ chuyển từ chuột sang phím khi **tình cờ thấy**
phím tắt trong lúc đang dùng chuột. Không ai đi đọc bảng phím tắt để tự nâng cấp.

## 4 · CA HỎNG THẬT CỦA IF
- **L1 (`NC-NGUYEN-TAC-GIAO-DIEN` mục 6) — 🔴 nặng nhất**: ba chặng ba khuôn thanh công cụ
  (2D chip ngang · Present chip wrap 4 hàng · 3D dock capsule). Gốc bệnh đo 15/08: **5 SỔ LỆNH
  SONG SONG** — `lib/commands/registry.ts` 55 lệnh chỉ palette đọc; CadToolbar 10 mảng tự khai;
  ToolDock3D 6 nhóm + 16 phím gõ cứng; Present tự khai; một CommandPalette thứ hai.
  Phân kỳ đo được: Xoay `RO`/`RO`/**Q** · Chép `CO`/`CO`/**D** · Đo `DI`/`DI`/**T**.
  ⇒ Đây là **chi phí học lại**, không phải chuyện thẩm mỹ. Trái W-7 và W-11.
- **L2**: đường bàn phím ≈ 0 — chưa `⌘K`, không hint cạnh lệnh, `hotkey-registry` chưa thi công.
- **`01-CLINICAL-UI-AUDIT` B3**: **13/13 bề mặt** trộn nguồn icon; Settings 65/75. Trái W-9.
- **3D FAIL**: `/projects/<id>/render` **không rail, 11 nút** — chữ ký giống hệt màn Login, trong
  khi 2D cùng dự án dựng đầy đủ. Cùng một sản phẩm, hai kết cục.
- **F-14**: cửa sổ công cụ từng là `position: fixed` portal ra ngoài canvas — **nổi TRÊN** canvas
  chứ không **THUỘC** canvas: không pan/zoom theo, không cổng vào/ra, một cửa/lượt. Trái W-1/W-2.

## 5 · KIỂM THẾ NÀO
1. Đo `bề rộng canvas / bề rộng màn`. Dưới ~85% thì chrome đang lấn.
2. Đếm số nguồn khai lệnh. Phải là **1**. (`grep -rn "lib/commands" components/` ở mọi toolbar)
3. Lấy 5 lệnh có ở nhiều môi trường: cùng id, cùng nhãn, cùng phím không?
4. Mở một lệnh bất kỳ trong menu/tooltip: có thấy phím tắt của nó không?
5. Đổi vật đang chọn 3 lần: bố cục panel có **nhảy** không? (W-3)
6. Đếm cỡ chữ và nguồn icon trên màn dày nhất: `npm run soi:foundation`.
7. Có auto-hide không? Có ⇒ sai (`docking-and-panels.md`).

## 6 · ĐÀO SÂU
- `docs/SPEC-PANEL-ROLLOUT-IDF.md` — khảo 4 app, §1 bảng "học gì / né gì", §4 bảng phím tắt
- `docs/TICKET-KIEN-TRUC-LENH-3-TANG.md` — 5 sổ lệnh, lộ trình B1–B5
- `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` — Master Capability System, toolbar 4–8
- `docs/IF-MOTION-VISUAL-LAW.md` §V — capability đổi representation, không đổi identity
