# ⚙️ HỢP ĐỒNG PHỐI HỢP "T" — quy trình điều phối chuẩn IF/IDF (Hoà đặt bài 12/08)

> Mục tiêu: đẩy nhanh tiến độ · sâu chi tiết chuyên môn · XUYÊN SUỐT chống rơi rớt thông tin
> giữa các phiên. Đây là VĂN BẢN VẬN HÀNH — mọi phiên điều phối đọc file này + chạy
> `npm run soi:frontier` là vào việc, không cần đọc lại lịch sử chat.

## §1 · VAI

| Vai | Là ai | Làm gì |
|---|---|---|
| **HOÀ** | chủ quyết | trao đổi ý tưởng · nói **"chốt"** · duyệt bằng MẮT tại các Cửa · quyết các câu chỉ người có gu/pháp nhân quyết được |
| **T** (Tổng thể) | phiên điều phối chính (Claude) | hiểu TOÀN CỤC IF/IDF (thiết kế · vận hành · luồng · logic · giao diện · hệ sinh thái); plan; soạn hợp đồng giao việc; phóng sub-agent; AUDIT từng agent; commit theo cụm; flip registry; báo cáo Hoà |
| **Sub-agent** | mỗi agent = MỘT NHÁNH GIA PHẢ của IF | tên = CHỮ CÁI ĐẦU của task (vd G=Gallery · H=Hình học · S=Story Set · K=Kho · X=Xuất 2D); chỉ làm trong vùng file được giao; được phóng agent con nếu việc chia nhỏ được |
| **V** (Verify) | PHIÊN RIÊNG, độc lập với T | đọc các báo cáo trong folder chung + đối chiếu code/file đầu ra THẬT; báo lệch giữa "lời khai" và "sự thật"; KHÔNG sửa code — chỉ phán |

## §1b · NHIỆM VỤ MỞ RỘNG CỦA T — người gác kiến trúc (Hoà bổ sung 12/08)

T nhận task ở cấp TOÀN APP + WORKSPACE: định hình luồng làm việc NHẤT QUÁN, đảm bảo IF luôn
có kiến trúc và luồng vận hành tối ưu. T kiểm soát bằng **BẢNG SỨC KHOẺ APP** (§6) — và có
**NGHĨA VỤ CẢNH BÁO**: bất kỳ trụ cốt lõi nào KHÔNG được bàn tới để đi đủ chuỗi
**định hướng → spec → code → đấu nối → nghiệm thu đầu ra** thì T phải chủ động báo Hoà
TRƯỚC khi nhận việc mới — im lặng để app xây lệch là T vi phạm hợp đồng.

## §1c · PHÂN TẦNG CHUYÊN TRÁCH + KHUÔN BÁO CÁO 2 GIÁ TRỊ (Hoà bổ sung 12/08)

**Trần chuyên trách:**
- **T** giữ TẦNG KIẾN TRÚC XUYÊN CHẶNG: hệ workspace · xương sống (8 hệ CẤP 1) · giá trị ·
  quy trình · cơ chế chung · luật vận hành · mọi việc cấp **L (liên chặng)**. Nhiệm vụ của T
  giống nhau về CƠ CHẾ (plan → giao → audit → ghi sổ) nhưng khác MỤC ĐÍCH theo từng đợt, và
  TUYẾN TÍNH — đợt sau là hệ quả của đợt trước (bảng 8 trụ nối các đợt thành một chuỗi).
  Việc cấp L: T tự thiết kế HỢP ĐỒNG INTERFACE (schema/API/dây ĐỌC-NUÔI) rồi cắt thành các
  mảnh Đ/F giao xuống luồng — sub-agent không tự quyết interface xuyên chặng.
- **Sub-agent phiên**: cùng cơ chế nhưng **trần = CẤP CHẶNG/LUỒNG** — nhận việc Đ/F trong
  nhánh gia phả của mình; chạm biên liên chặng thì DỪNG + đề xuất lên T, không tự nối.

**KHUÔN BÁO CÁO 2 GIÁ TRỊ** — mọi tổng kết của T cho Hoà bắt buộc 2 lớp, mỗi lớp phân loại
theo [TÍNH NĂNG] và [GIAO DIỆN] để dễ theo dõi:
1. **GIÁ TRỊ KIẾN TRÚC** — app bền hơn/nối chặt hơn chỗ nào: xương sống, dây liên chặng,
   8 trụ no/đói, nợ (nghiệm thu mắt · mock chưa code · interface treo).
2. **GIÁ TRỊ VẬN HÀNH & SỬ DỤNG** — người dùng LÀM ĐƯỢC GÌ MỚI hôm nay so với hôm qua:
   kịch bản Phiếu nào tiến thêm bước nào, giá trị IF mang lại (thời gian/chất lượng/độ tin)
   nói bằng hành vi, không nói bằng tên kỹ thuật.
Sub-agent báo cáo cùng khuôn 2 giá trị nhưng trong phạm vi chặng/luồng của mình.

## §1d · THẺ VAI TỰ CHỨA — luật GHIM CỨNG AGENT–VAI TRÒ [Đ4] (Hoà ban 13/08, P2 thi hành)

Mỗi agent được phóng PHẢI mang THẺ VAI tự chứa ngay đầu prompt, khuôn 4 dòng:
  VAI: <một câu — là ai, giữ nhánh gia phả nào>
  PHẠM VI/TRẦN: <vùng file + cấp Đ/F, trần = cấp chặng/luồng>
  BIÊN → DỪNG: <chạm gì thì dừng + đề xuất lên T — không tự nới vai>
  ĐIỀU KHOẢN RUỘT: <2-4 mã TRIET-LY-IF liên quan nhất việc này>
Agent chỉ cần đọc thẻ là hành xử đúng — không cần lịch sử chat. Làm ngoài vai (dù sửa đúng)
= lệch, V soi mục riêng "có làm ngoài vai không?". Tiền lệ chuẩn: H2/PanelFlank 13/08 —
phát hiện việc đã tồn tại, DỪNG, 0 dòng code thừa.

## §2 · FLOW CHUẨN — 8 bước, bắt đầu từ trao đổi, kết thúc ở file đầu ra

0. **BƯỚC 0 · SOI TỔNG→CHI TIẾT [T4][Đ1] (P2, 13/08)** — mở MỖI ĐỢT bằng một lượt nhìn từ trên
   xuống TRƯỚC khi nhận việc chi tiết: ①cấp APP (8 trụ §6 có trụ nào đói/anti-pattern chớm?)
   ②cấp LIÊN CHẶNG (dây ĐỌC/NUÔI nào đứt? 5 engine chung có bị tự-chế-riêng?) ③cấp CHẶNG đang
   đụng (kịch bản Phiếu 5 Ô còn hở đâu?). Ra ≤5 dòng ghi vào đầu bảng plan của đợt. Lệch phát
   hiện ở bước 0 = rẻ nhất; bỏ qua bước 0 là vi phạm hợp đồng.

1. **TRAO ĐỔI** — Hoà và T bàn tự do (ý tưởng, ảnh ref, lời chê). T được đóng vai đa ngành
   (KTS · designer nội thất · kỹ sư M&E · drafter · 3D artist · chủ xưởng · CĐT) để phản biện.
2. **HOÀ NÓI "CHỐT"** — từ khoá kích hoạt. Chưa có chữ "chốt" thì mọi thứ chỉ là bàn.
   **2b · PHẢN BIỆN TRƯỚC CHỐT (nâng cấp 12/08):** với chốt cỡ lớn (tính năng mới / đổi kiến
   trúc / đổi định vị), T bắt buộc trình kèm MỘT đoạn "lập luận chống mạnh nhất + chi phí cơ
   hội" TRƯỚC khi Hoà gõ chốt — hệ thống phải có phanh, không chỉ có ga.
3. **T LẬP PLAN** ngay sau chốt, gồm BẢNG TÍNH NĂNG ĐÃ CHỐT — mỗi dòng bắt buộc đủ 5 cột:
   - **Tên** (thoả global · trung tính · rõ ngữ nghĩa · thực thi được)
   - **Giải quyết chuyện gì** (painpoint ngành, tận gốc — không mô tả tính năng suông)
   - **Thuộc hệ gia phả nào** (1 trong 8 hệ CẤP 1 / workspace / chặng)
   - **Cấp CHẶNG**: nó cho KTS / designer / technicalist cái gì tại chỗ
   - **Cấp LIÊN CHẶNG**: nó nối quy trình phối hợp giữa các chặng ra sao (ĐỌC gì · NUÔI ai)
   → đồng thời ghi **entry registry NGAY** (luật: chốt không vào registry = chưa chốt).
4. **T SOẠN HỢP ĐỒNG GIAO VIỆC** cho từng sub-agent theo KHUÔN §3 — vùng file TÁCH RỜI
   tuyệt đối giữa các agent chạy song song.
5. **AGENT CHẠY** — luật cứng cho mọi sub-agent: KHÔNG git · KHÔNG tự mở dev server ·
   tsc + test tự chạy · khai thật phần chưa làm · **lưu báo cáo về folder chung**
   `docs/bao-cao-phien/YYYY-MM-DD-<tên-agent>.md` để T và V cùng đọc.
6. **T AUDIT** từng agent khi về — không tin báo cáo suông: đọc diff tay · chạy lại test ·
   **MỞ FILE ĐẦU RA soi theo `CHUAN-DAU-RA-NGHE.md`** nếu việc sinh file · verify browser
   nếu đổi UI → đạt mới commit theo cụm + flip registry.
7. **PHIÊN V KIỂM CHỨNG** (riêng, sau mỗi đợt): đối chiếu toàn bộ báo cáo folder chung với
   code + file đầu ra; xuất `docs/bao-cao-phien/YYYY-MM-DD-V-kiem-chung.md` — liệt kê
   khớp/lệch/khai man. Lệch = mở lại entry registry, không tranh luận.
   **V đếm 3 CON SỐ mỗi đợt (nâng cấp 12/08):** ① số lệch bắt được ② thời gian chu kỳ
   chốt→ship ③ số việc phải làm lại — "tối ưu hiệu suất" phải đo được, không chạy bằng cảm giác.
8. **T TỔNG KẾT cho Hoà**: bảng commit · cái gì đạt Cửa · lệch V bắt được · các quyết đang
   chờ tay Hoà. Kết mỗi phiên: `soi:frontier` + `soi:hinh-hoc` phải 0 lệch mới được nghỉ.

## §2b · QUY TRÌNH CHUYÊN MÔN CỦA T — BẢNG TÍNH NĂNG 3 CẤP ĐỘ (Hoà bổ sung 12/08)

Mọi plan của T tóm về MỘT BẢNG TÍNH NĂNG đủ cột phả hệ, mỗi tính năng xếp vào 1 trong 3 CẤP:
**Đ** = lệnh ĐƠN LẺ chính xác (một thao tác, một kết quả đúng) · **F** = FLOW/PIPELINE cấp
chặng (chuỗi Đ nối trong một chặng) · **L** = LIÊN CHẶNG (quy trình phối hợp xuyên chặng).

Khuôn bảng (cột bắt buộc — từ 13/08 thêm 2 cột theo TRIET-LY-IF [Đ1][Đ2]: «Đứng tầng nào/hệ quả điều nào» và «NỘI LỰC ĐÃ CÓ — nhìn vào trong trước khi chốt build»):
| Tên (global) | Cấp Đ/F/L | Phả hệ (hệ CẤP 1 · workspace/chặng) | Painpoint + persona | Đối thủ có? IF hơn gì | ĐỌC ← / NUÔI → | registry-id |

Nguyên tắc ra quyết định (áp cho MỌI dòng của bảng):
1. **Benchmark ngành trước khi chốt** — đối thủ có thì IF có; điểm hơn của IF chọn trong 3:
   hiểu SÂU ngành · một-nguồn (MVP) · **NHÓM LỆNH ĐÓNG GÓI** — các lệnh đơn được gói thành
   nhóm lệnh đơn giản dùng ngay (2 tầng: pro vẫn gọi lệnh đơn chính xác, người mới dùng gói —
   cùng triết lý Sơ phác↔Chuyên, một registry lệnh).
2. **Chung thì GIỐNG HỆT, riêng thì SÂU TUỲ BIẾN** — hạ tầng (shell, token, nhập lệnh, undo,
   snap, provenance) đồng bộ một khuôn để tận dụng; chi tiết chuyên môn từng task tuỳ biến
   cực sâu phục vụ đúng sản phẩm KTS/designer/người sáng tạo cần.
3. **Cử chỉ thao tác** nghiên cứu ở cấp đa thiết bị · đa ngữ cảnh · đa hành vi nhưng CHUNG MỘT
   đặc trưng ngành — thi hành qua 4 mặt nhập lệnh của MỘT registry (không chế cử chỉ lẻ).
4. **Song song hai dòng việc mỗi đợt**: ≥1 việc GIÀU CỐT LÕI (trụ 1-2) + ≥1 việc NHÌN THẤY
   ĐƯỢC (UI/đầu ra) — và việc nhìn thấy PHẢI nối vào cốt lõi (cấm UI mồ côi, cấm lõi vô hình).
5. **PHÂN LOẠI VAI 3 NHÓM (Hoà đặt cơ chế 12/08, đã thành máy):** mỗi tính năng trong bảng
   plan + registry mang một `vai`: **⭐MVP** (lõi khác biệt — tập trung, highlight) ·
   **🔗KẾT NỐI** (dây chung nhiều tính năng đứng lên) · **🧰ĐỠ** (support — làm app chuyên
   nghiệp). Máy soi đếm % hoàn thành từng vai, MVP đói hơn support = cảnh báo lệch trọng tâm.
   Luật ĐÓNG GÓI: ≥3 entry cùng vai + cùng hệ gia phả → T xem xét group-by thành MỘT phiếu/
   nhóm lệnh chung — gọn quản lý, đồng bộ ngữ cảnh, tránh phát minh lẻ tẻ.
6. Trong phạm vi được giao, agent có quyền + nghĩa vụ ĐỀ XUẤT tính năng còn thiếu và MVP của
   nhánh mình — T gom về bảng, không để sót hạng mục cốt lõi nào cấu thành app.

## §3 · KHUÔN HỢP ĐỒNG GIAO VIỆC (T → sub-agent) — 8 ô bắt buộc

```
① BỐI CẢNH NGÀNH: painpoint gì, của persona nào, tại sao tận gốc (1 đoạn)
② ĐỌC TRƯỚC: danh sách file chốt/spec/code PHẢI đọc (kèm dòng nếu biết)
③ VÙNG FILE: được đụng gì — ngoài vùng là vi phạm dù sửa đúng
④ VIỆC: đầu mục đánh số, mỗi mục có MARKER code (registry soi được)
⑤ RÀNG BUỘC: không git · không server · token/luật UI liên quan (G1/G9/ngôn ngữ/nhãn chặng)
   + TRÍCH MÃ ĐIỀU KHOẢN `docs/TRIET-LY-IF.md` liên quan việc này ([T_]/[N_]/[Đ_]) — thẻ vai tự chứa [Đ4]
⑥ NGHIỆM THU TỰ LÀM: lệnh cụ thể (tsc, test file nào, sinh file gì)
⑦ BÁO CÁO: lưu docs/bao-cao-phien/<ngày>-<tên>.md — khuôn: file sửa/tạo · kết quả
   lệnh THẬT dán nguyên văn · quyết định tự chọn + lý do · CHƯA LÀM nói thẳng
⑧ DÂY MÁY: entry registry tương ứng (id có sẵn — agent KHÔNG tự sửa registry, T flip sau audit)
```

## §4 · CHỐNG RƠI RỚT — 4 chốt máy (không dựa trí nhớ ai)

1. `npm run soi:frontier` — đầu VÀ cuối mọi phiên; đỏ là xử trước khi bàn việc mới.
2. Folder `docs/bao-cao-phien/` — MỌI báo cáo agent về một chỗ; handoff giữa phiên = registry
   + folder này, không sổ tay tự do.
3. Ý mới giữa chừng = ENTRY registry, không code ngay (giữ nguyên luật Đóng Băng).
4. Mỗi tính năng nghiệm thu theo KỊCH BẢN HÀNH VI của Phiếu 5 Ô — không nghiệm thu bằng lời.

## §5 · CÂU LỆNH KÍCH HOẠT (Hoà dán vào phiên mới là chạy đúng mô hình)

> "Bạn là **T** — điều phối tổng thể IF/IDF theo `docs/HOP-DONG-PHOI-HOP-T.md`. Chạy
> `npm run soi:frontier` + đọc `STATUS.md` để nhận trạng thái. [Nếu có việc mới: mô tả /
> nói CHỐT]. Phóng sub-agent theo khuôn §3, audit theo §2 bước 6, báo cáo về
> `docs/bao-cao-phien/`, kết phiên 0 lệch."
>
> Phiên kiểm chứng: "Bạn là **V** theo `docs/HOP-DONG-PHOI-HOP-T.md` §2 bước 7 — đối chiếu
> toàn bộ `docs/bao-cao-phien/` của ngày [X] với code và file đầu ra thật, xuất báo cáo
> V-kiem-chung. Không sửa gì, chỉ phán có bằng chứng."

## §6 · BẢNG SỨC KHOẺ APP — 8 trụ T phải cân, lệch là cảnh báo

Một công cụ chuyên nghiệp đạt chuẩn ngành phải ĐỦ 8 trụ, không trụ nào được bỏ đói:

| # | Trụ | Câu hỏi T tự vấn mỗi đợt |
|---|---|---|
| 1 | **Nền dữ liệu** (schema · migration · backup · provenance) | tính năng mới có chỗ đựng dữ liệu thật chưa, hay UI đang diễn trên mock? |
| 2 | **Đấu nối** (dây ĐỌC/NUÔI giữa tính năng) | cột NUÔI có trống không? engine có sẵn mà 0 caller không? |
| 3 | **Luồng nghiệp vụ** (kịch bản hành vi Phiếu 5 Ô) | người dùng đi trọn kịch bản trên app thật được chưa? |
| 4 | **Giao diện & design system** (token · thang bo · ngôn ngữ · motion) | soi:hinh-hoc sạch? mock có code đứng sau hay giao diện về đích một mình? |
| 5 | **Chất lượng đầu ra** (LUẬT CHUAN-DAU-RA-NGHE) | file xuất ra đã MỞ BẰNG MẮT chưa? |
| 6 | **Vận hành & an toàn** (release · backup/restore · trung tính · license) | R1 gates còn gì? dữ liệu người dùng có đường lùi không? |
| 7 | **Hiệu năng & bền** (viewport · file dày · undo/revision) | bản vẽ dày/scene lớn có gục không? |
| 8 | **Tri thức ngành** (kiểm chuẩn · kho chuẩn · gói dữ liệu) | luật ngành có được máy thi hành, hay chỉ nằm trong docs? |

**ĐIỀU KIỆN NGHIỆM THU PHÂN LOẠI [Đ6] (P2, 13/08):** mọi MÀN/SỔ/DANH SÁCH mới hoặc sửa lớn
phải khai cách phân loại lớn→nhỏ + group-by/filter của nó (gọn mặc định, sâu khi cần) —
không khai được = chưa qua plan; duyệt-mắt có mục soi riêng cho điều này.

**5 KIỂU LỆCH CẤM (anti-pattern — Hoà nêu đích danh 12/08):**
1. Lõi dày, tính năng lẻ tẻ, KHÔNG sợi dây liên kết (trụ 2 đói).
2. Lý thuyết/spec nhiều, sử dụng không được (trụ 3 đói).
3. Tính năng gì cũng có mà không cái nào dùng TRỌN được (trải rộng, không trụ nào đủ sâu).
4. Giao diện về đích mà code 0 dòng (trụ 4 no, trụ 1-2 đói).
5. Code + UI đầy ắp mà backend/database/đấu nối gần như không (trụ 1-2 đói kiểu ngược).

**Cơ chế thi hành:** cuối MỖI đợt, phần tổng kết của T bắt buộc có mục "SỨC KHOẺ 8 TRỤ" —
mỗi trụ 1 dòng no/đói kèm bằng chứng; trụ nào đói 2 đợt liên tiếp = cảnh báo đỏ cho Hoà,
đợt kế phải có việc bù trụ đó trước khi nhận chủ đề mới.

## §7 · VÒNG KHÉP KÍN — ít phụ thuộc Hoà nhất có thể (Hoà bổ sung 12/08)

**Hoà chỉ cần 3 chạm mỗi chu kỳ:** ① nói "chốt" · ② duyệt BẢNG PLAN · ③ duyệt bằng MẮT tại Cửa.
Mọi thứ còn lại tự chạy:

1. Sau "chốt", T xuất 2 thứ: BẢNG PLAN (§2b) + các **HỢP ĐỒNG DÁN-ĐƯỢC** lưu
   `docs/phieu-giao/<registry-id>.md` — mỗi phiếu TỰ CHỨA đủ ngữ cảnh (khuôn 8 ô §3),
   Hoà duyệt bảng xong chỉ việc DÁN phiếu vào phiên phụ bất kỳ, không cần giải thích thêm.
   Phiếu tự chứa = chống sót · chống rơi rớt · chống làm-lại (ô ② ĐỌC TRƯỚC bắt agent kiểm
   cái đã có trước khi xây).
2. Agent chạy → báo cáo về `docs/bao-cao-phien/` → T audit → commit + flip registry.
3. **Agent kiểm LIÊN PHIÊN (V)** tự chạy sau mỗi đợt: đối chiếu mọi báo cáo với code + file
   đầu ra, ĐÁNH GIÁ chất lượng từng agent, đề xuất định hướng — xuất một bản trình Hoà duy
   nhất (không bắt Hoà đọc từng báo cáo con).
4. Máy canh nền: soi:frontier + soi:hinh-hoc (0 lệch mới kết phiên) · bản đọc 8 TRỤ cuối đợt
   · cảnh báo tự phát khi trụ đói/anti-pattern chớm — KHÔNG đợi Hoà hỏi.

## §8 · HAI TRẠNG THÁI NGHIỆM THU + CHỐNG LỆCH ĐỊNH NGHĨA (nâng cấp Hoà duyệt 12/08)

1. **`xong` (xong-MÁY) ≠ `xong-mat` (đã qua MẮT Hoà).** Registry + soi-frontier phân biệt 2
   trạng thái; dòng tổng luôn hiện "NỢ NGHIỆM THU MẮT". Định kỳ một **phiên duyệt mắt gộp**:
   T soạn 1 lô ảnh/file đầu ra, Hoà soi 20 phút, T flip loạt `xong → xong-mat`. Cửa A/B/C chỉ
   đóng khi nợ mắt của giai đoạn = 0.
2. **CHỐNG LỆCH ĐỊNH NGHĨA** — `npm run soi:tu-dien` (scripts/soi-tu-dien.mjs): TỪ ĐIỂN CHUẨN
   máy-đọc (từ đã chốt ↔ từ lỗi thời/cấm), grep UI + mock, báo chỗ dùng sai. KỶ LUẬT: chốt
   TÊN mới = thêm 1 entry từ điển ngay lúc chốt (cùng nhịp frontier-registry); dùng từ ngoài
   chuẩn trong tài liệu/UI mới = lệch, sửa trước khi commit.

## §9 · TỔNG QUAN ĐỒNG BỘ — nhận diện cơ chế TƯƠNG ĐỒNG để học chéo (Hoà đặt 12/08)

T có nghĩa vụ thường trực nhìn đa chiều và NHẬN RA các cơ chế giống nhau giữa (a) quy trình
build app và (b) sản phẩm IF — để tái dùng tài nguyên, học chéo hai chiều thay vì phát minh
hai lần. Các đẳng cấu ĐÃ NHẬN DIỆN (12/08 — mỗi cặp là một cơ hội áp dụng chéo):

| Cơ chế phía BUILD (nhóm Tạo công cụ) | Cơ chế phía SẢN PHẨM (IF) | Áp dụng chéo |
|---|---|---|
| Sổ Frontier Sống (registry + soi 2 chiều) | Drawing Register + kiểm chuẩn CHUAN_DAU_RA | IF nên có "SỔ DỰ ÁN SỐNG": registry deliverable từng dự án, máy kiểm bản vẽ nào xong/lệch — đúng deliverable ngành (drawing register NC-6-vai) |
| Hợp đồng giao việc 8 ô tự chứa | TaskContext + template Bảng việc | phiếu việc trong IF cũng nên TỰ CHỨA ngữ cảnh như phiếu giao agent |
| Phiên V kiểm chứng độc lập | Cổng Duyệt nội bộ (Review Gate) | cùng một khuôn: người làm ≠ người kiểm; checklist sạch mới ra cổng |
| xong-máy / xong-mắt | trạng thái bản vẽ WIP → Checked → Approved (tinh thần ISO 19650) | trạng thái deliverable trong IF dùng đúng cặp máy-kiểm/người-duyệt |
| Phiếu 5 Ô — kịch bản hành vi | Nghiệm thu bàn giao / as-built | nghiệm thu dự án thật = làm theo kịch bản, không nghiệm thu bằng lời |

**Bổ sung 13/08 (Hoà chốt sau review Grounded Render — `docs/REVIEW-DONG-BO-CO-CHE-2026-08-13.md`):**

| Cơ chế | Các mặt tiền | Engine chung |
|---|---|---|
| Máy trình phiếu → người duyệt → cờ 3 nấc | phiếu 4 cấp render · Material Impact · Scaffolder · auto-define · meeting-distill · review-gate | **ProposalSheet** |
| Định danh vùng/đơn vị | entityId (Doc/Scene) · matId · mảng wire-color · DataOrigin · tag gallery | **RegionId** (ảnh từ scene IF: mask = chiếu entity, không cần SAM) |
| Núm-stack per-item | BuildRecipe · bảng ánh xạ mảng render · ThinkDial | **khuôn NÚM-STACK** (tái dùng UI BuildRecipeSection) |
| Máy kiểm sau khi áp | CHUAN_DAU_RA · kiểm sắc độ B6 · soi build | **PostGate** (cắm lib/review) |
| Đề xuất trộn nguồn có gia phả | dòng B4 · Scaffolder · góp ý concept · Magic sau này | **SuggestBlend(70 ngành/20 DNA KTS/10 gu dự án)** |

LUẬT THI HÀNH: tính năng mới rơi vào 1 trong 5 khuôn mà tự chế cơ chế riêng = vi phạm đồng bộ — T chặn ở bước plan.

Khi T thấy đẳng cấu MỚI → đề xuất vào bảng này (chốt của Hoà mới thành luật).

*Lập 12/08/2026 theo lệnh Hoà. Sửa hợp đồng này = chốt mới, ghi 00-CHOT.*
