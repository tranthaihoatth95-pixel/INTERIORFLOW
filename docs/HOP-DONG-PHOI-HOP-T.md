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

## §2 · FLOW CHUẨN — 8 bước, bắt đầu từ trao đổi, kết thúc ở file đầu ra

1. **TRAO ĐỔI** — Hoà và T bàn tự do (ý tưởng, ảnh ref, lời chê). T được đóng vai đa ngành
   (KTS · designer nội thất · kỹ sư M&E · drafter · 3D artist · chủ xưởng · CĐT) để phản biện.
2. **HOÀ NÓI "CHỐT"** — từ khoá kích hoạt. Chưa có chữ "chốt" thì mọi thứ chỉ là bàn.
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
8. **T TỔNG KẾT cho Hoà**: bảng commit · cái gì đạt Cửa · lệch V bắt được · các quyết đang
   chờ tay Hoà. Kết mỗi phiên: `soi:frontier` + `soi:hinh-hoc` phải 0 lệch mới được nghỉ.

## §3 · KHUÔN HỢP ĐỒNG GIAO VIỆC (T → sub-agent) — 8 ô bắt buộc

```
① BỐI CẢNH NGÀNH: painpoint gì, của persona nào, tại sao tận gốc (1 đoạn)
② ĐỌC TRƯỚC: danh sách file chốt/spec/code PHẢI đọc (kèm dòng nếu biết)
③ VÙNG FILE: được đụng gì — ngoài vùng là vi phạm dù sửa đúng
④ VIỆC: đầu mục đánh số, mỗi mục có MARKER code (registry soi được)
⑤ RÀNG BUỘC: không git · không server · token/luật UI liên quan (G1/G9/ngôn ngữ/nhãn chặng)
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

*Lập 12/08/2026 theo lệnh Hoà. Sửa hợp đồng này = chốt mới, ghi 00-CHOT.*
