# CHỐT — HƯỚNG 3D DÀI HẠN + VAI TRÒ HỆ IDF

## 0 · TÊN GỌI & VAI TRÒ — bản CUỐI (Hoà chốt 01/08, ba lần chỉnh trong ngày)

> Chốt cuối của Hoà: *"CAD và Revit bản chất giống nhau — đưa vào chặng 1; chặng 2 như hiện tại
> + vẽ 3D; chặng 3 presenting như cũ + công cụ cắt lớp viewer công trường. Không phá mọi thứ đã
> gầy dựng."* — Cowork xác nhận: khớp nguyên vẹn kiến trúc đã có, không phá gì.

**IF = MỘT sản phẩm · giữ nguyên luồng chặng 0→3 · IF1/IF2 = TẦNG NĂNG LỰC cắt NGANG các chặng,
vận hành bằng cơ chế SKETCH/PRO MODE đã có — KHÔNG xây hệ phân quyền mới** (Hoà chốt lần 4:
*"không cần phân quyền chi cho rối rắm, nâng cấp cơ chế sketch mode/pro mode như đã làm"*):

```
                CHẶNG 1 · VẼ           CHẶNG 2 · DỰNG + RENDER      CHẶNG 3 · TRÌNH
IF1 · SƠ PHÁC   nét · Sketch/Pro       khối massing (B1) + AI render deck · video · in
IF2 · KỸ THUẬT  CẤU KIỆN có nghĩa (B2) nhận IFC chồng lớp (B3)      đích chiếu CÔNG TRƯỜNG:
(= Pro mode)    kích thước liên kết    · va chạm · xuất IFC (B4)    tablet CẮT LỚP · đo · ghi chú
```

- Lên tầng = **bật Pro mode** — nâng cấp đúng cơ chế Sketch/Pro ĐÃ CHẠY (*"một năng lực, nhiều
  lối vào"*). Không ném người dùng sang app lạ, không thêm hệ phân quyền.
- Viewer công trường = **đích chiếu thứ 5 của chặng 3** (PDF · PPTX · XLSX · phim · tablet) —
  đúng từng chữ chốt *"chặng 3 là hàm chiếu"* (`TU-VAN` §6, 30/07).
- ⚠️ **Luật một nguồn**: khối 3D hiển thị/chỉnh ở chặng 2 nhưng NGUỒN là Doc chặng 1 — push-pull
  ghi ngược cao độ/storey vào Doc. Cấm chặng 2 giữ bản 3D riêng (bệnh hai-nguồn đã trả giá ở Brand Kit).

```
HỆ SINH THÁI IDF:  IF (trên) ·  ARCHINOTE — máy THU hiện trường (ảnh gắn cấu kiện, đo đạc → về IF)
                              ·  ATLAS (Lark Base) — dữ liệu vật liệu/nhân sự/việc, IF chỉ ĐỌC
```

**Hai câu phân biệt:** ① IF1 vẽ *nét* để nghĩ — IF2 vẽ *cấu kiện* để xây; khác nhau bằng MODE (Sketch/Pro),
không bằng app, không bằng hệ phân quyền. ② Viewer công trường để *NHÌN thiết kế*; ArchiNote để *GHI thực tế* — cặp nhau
trên cùng một tablet.

> Hoà chốt **01/08/2026**, sửa lại tư vấn sai của Cowork (Cowork từng khuyên "không làm
> Revit-level" — SAI vì không đọc lại tài liệu; `IDF-TRINH-BAN-GIAM-DOC-v2:18` đã ghi đích đến
> từ 30/07). Lời Hoà: *"desktop vẽ được Revit, tablet mode là để đi công trường — không có sản
> phẩm được tạo ra thì lấy đâu ra tablet coi. IF không vẽ được 3D thì ý nghĩa tồn tại của IF và
> hệ sinh thái IDF giảm — bỏ phụ thuộc Autodesk có còn tồn tại?"*

## 1 · Chốt (Hoà xác nhận lần 2 cùng ngày: *"vẽ ở IF1; 2 là ra công trường xem + ArchiNote"*)

1. **TẦNG VẼ thuộc IF1 (desktop)** — leo dần tới BIM trong phạm vi nghề nội thất/kiến trúc,
   thông Revit qua IFC, **không lệ thuộc Autodesk**. Đây là lý do tồn tại của hệ IDF
   (🔍 `IDF-TRINH-BAN-GIAM-DOC-v2` :18 · :99 · :131 · :145; `TAM-NHIN` §4 "tài sản, không thuê bao").
2. **IF2 = RA CÔNG TRƯỜNG: XEM · đo · cắt lớp · ghi chú — cộng ArchiNote** (máy thu dữ liệu
   hiện trường). IF2 không dựng mô hình; desktop tạo sản phẩm, hiện trường tiêu thụ và phản hồi
   ngược (ảnh gắn cấu kiện, đo đạc → về IF1).
3. **Import Max/Blender (glTF/OBJ) = làn phụ** cho đồ rời và khối ngoài — không thay tầng vẽ.
   D5 là cửa một chiều (nhận tốt, nhả yếu) — chỉ dùng làm đích render bậc 5.
4. **Nơi render luôn là IF.**

## 2 · Bậc thang leo tới đích — mỗi bậc tự bán được, khớp thang SEMANTIC-MODEL pha 1→4

| Bậc | Làm gì | Bán được ngay |
|---|---|---|
| **B1 (nay)** | Khối extrude + **push-pull + orbit** — SketchUp-level massing (`SPEC-3D-CORE` 3D-5) | nuôi AI render (depth/lineart) — "SketchUp cho khối, AI cho da" |
| **B2** | Cấu kiện 3D CÓ NGỮ NGHĨA — tường/dầm/sàn là đối tượng (pha 3–4 semantic) | bóc khối lượng 3D, sửa-một-lần |
| **B3** | **NHẬN IFC** — chồng file kết cấu/MEP lên thiết kế, phát hiện va chạm | 🔍 `TU-VAN` §7⑥: *"cửa vào IF2 bằng đường rẻ nhất"* — việc hằng ngày là NHẬN file |
| **B4** | **XUẤT IFC** — thông Revit hai chiều | giao hồ sơ mọi tư vấn quốc tế, thoát khoá phần mềm |
| **ĐÍCH** | IF vẽ BIM phạm vi nghề · 4D tiến độ · tablet cắt lớp | hệ IDF đứng độc lập |

**Kỷ luật leo thang:** đúng luật §3 SEMANTIC-MODEL — *bậc trên chỉ mở khi bậc dưới có nơi tiêu thụ
thật*. Không nhảy cóc lên B3/B4 khi B1 chưa có người dùng. IF1 ship vẫn đi trước mọi bậc.

## 3 · Việc sửa ngay theo chốt này

1. `SPEC-3D-CORE`: sửa "4 người dùng" → **"4 nơi tiêu thụ"** (Hoà chỉ ra chữ gây hiểu lầm);
   thêm **3D-5 push-pull massing** vào thứ tự thi công; thêm mục "đích đến BIM" trỏ về file này.
2. `RANG-BUOC-IF2-CHO-IF1` #6 ("IFC quan trọng chiều NHẬN hơn XUẤT") vẫn đúng làm **thứ tự**
   (B3 trước B4) — không mâu thuẫn với đích xuất-IFC ở B4.
3. Lộ trình: **B1 (khối massing) thuộc TẦNG SƠ PHÁC IF1** — đợt hạ tầng 3D đã xếp;
   **B2–B4 thuộc TẦNG KỸ THUẬT IF2 (Pro mode kỹ thuật)**, mở sau ATLAS/ArchiNote.
4. Tài liệu mới: nói "IF" ra ngoài; "IF1/IF2" dùng đúng nghĩa **tầng** (sơ phác / kỹ thuật),
   không dùng như "giai đoạn".

---

*Cowork ghi 01/08/2026 — kèm lời tự kiểm: tư vấn ban đầu sai vì tin trí nhớ thay vì đọc lại
`IDF-TRINH-BAN-GIAM-DOC-v2` (Luật 14g/14b). Hoá sửa đúng. Đích không đổi từ 30/07; đóng góp còn
lại của tư vấn là BẬC THANG và thứ tự — được giữ.*
