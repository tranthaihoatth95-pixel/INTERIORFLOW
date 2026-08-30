# ĐẶC TẢ — MÁY ĐỌC GU cho màn Cảm hứng (thiết kế, không thi công)

> Trả phiếu `docs/phieu-giao/may-doc-gu.md` (cầu `HO-20260829181708-7dcb0535e6b4`, Hoà giao 30/08).
> Người viết: lane `05 · THIẾT KẾ/NC`. **Dựng TRÊN ADR candidate đã DECIDED** của lane 05/Codex
> (`HO-20260830034520-df4602ec4e59`): *5 miền `nganh` hiện hữu, multi-label · hard safety gate +
> research pool rộng + curated ranking · GU-PROFILE chỉ là hiệu chuẩn cá nhân, không gate toàn cục ·
> mọi ngưỡng là CANDIDATE chờ gold-set + ca đột biến.* Đặc tả này không mở lại các quyết định đó —
> nó làm chúng **dựng được**.
> (UNKNOWN: bản ADR đầy đủ nằm ở final của lane Codex, chưa nhập repo — đặc tả bám bản chưng cất
> trong cầu; nếu bản đầy đủ vênh, ADR thắng.)

---

## 0 · MỘT CÂU

**Nhìn hình → hiểu hình → quyết ba ngăn: LOẠI · KHO RỘNG (research) · TUYỂN (mặt tiền)** — gate
cứng chặn cái không được phép, thang đo xếp hạng cái đáng hứng, gu cá nhân chỉ đổi THỨ TỰ, không
đổi tư cách.

Giải đúng câu khó nhất của phiếu ("*rộng thì người ta mới tìm, đẹp thì mới có hứng*"): **rộng và
đẹp KHÔNG tranh nhau một cái cổng** — rộng sống ở KHO RỘNG (chỉ chặn vi phạm cứng), đẹp sống ở
XẾP HẠNG mặt tiền (không chặn ai, chỉ quyết ai đứng trước). Một cổng duy nhất vừa chặn vừa chấm
sẽ giết một trong hai — nên tách làm hai tầng.

## 1 · BẢNG NGÀNH — lấy gì làm chuẩn, vì sao

**Chốt theo ADR: đúng 5 miền `nganh:*` ĐANG THI HÀNH Ở TẦNG HÀM** (`lib/library/gallery-tags.ts`):
`kien-truc · noi-that · canh-quan · graphic · art` — **multi-label** (một ảnh được mang nhiều miền).

- **Vì sao 5 miền này**: ① nó là hợp giao của hai hệ phân loại chuẩn — nhóm ngành *không gian*
  (kiến trúc / nội thất / cảnh quan: ba nghề hành nghề riêng theo mọi hệ phân loại xây dựng) và
  nhóm *thị giác phẳng* (graphic / art: hệ phân loại design schools); ② nó ĐÃ là contract chạy
  thật trong code — đổi taxonomy là migration, phải có bằng chứng thiếu thật (B25).
- **"mood/feeling" KHÔNG phải miền** — nó là TRỤC ĐO CHUNG (mọi ảnh đều có mood), xử ở §2. Đưa
  mood thành miền là để một ảnh "zen" mất miền nội thất của nó.
- **Miền ứng viên tương lai** (chỉ mở khi đo thấy kho tràn khỏi 5 miền): `san-pham` (product/
  furniture design rời) · `vat-lieu` (macro texture). Ghi additive, không mở bây giờ.

## 2 · THANG ĐO CHUNG — áp mọi ảnh, đo LOCAL, mỗi trục có số

Nguyên tắc đo: **chạy LÚC NẠP, một lần một ảnh** (trả lời câu hỏi ngược #2 của phiếu — duyệt màn
chỉ ĐỌC điểm đã cache trong DB, local-first gánh được; 1.635 ảnh × ~200ms CV cổ điển ≈ 5 phút một
lần backfill). Mọi trục đo bằng **thị giác máy cổ điển, offline được**; tầng VLM là nâng cao có
mạng (§5). Con số dưới đây là **CANDIDATE** — hiệu chuẩn ở §6, cấm coi là chốt.

| Trục | Cách đo (offline) | Khoảng | Ngưỡng CANDIDATE | Vì sao ngưỡng |
|---|---|---|---|---|
| **T1 · Kỹ thuật ảnh** | cạnh Laplacian (nét) · nhiễu/blockiness JPEG · cạnh ngắn px | nét 0–1 · px | cạnh ngắn **≥900px** cho TUYỂN, ≥500 cho KHO; nét ≥p25 của gold-set | dưới 900px không phóng được trên màn duyệt lớn; số p25 lấy từ gold-set, không bịa |
| **T2 · Bố cục / độ tĩnh** | REUSE nguyên trục `độ tĩnh = 1 − rối/0.40` của `scripts/soi-anh-the.py` (đã có ca chạy thật màn khoá) + phát hiện đối xứng (sai khác lật ngang) | 0–1 | tĩnh **≥0.45** cho TUYỂN (KHÔNG gate ở KHO) | 0.40 là trần rối đã dùng thật ở màn khoá; nới 0.45 vì ảnh cảm hứng được phép động hơn ảnh nền |
| **T3 · Ánh sáng** | histogram: % cháy sáng/tối · dải động (p5–p95) · cast màu (lệch kênh) | % · stops | cháy **<8%** khung · dải ≥5 stops cho TUYỂN | ảnh nghề chịu được tối trầm (zen 2700K!) — gate cháy chứ KHÔNG gate tối; ngưỡng tối sẽ giết đúng cực ZEN của gold-set |
| **T4 · Màu** | k-means 6 màu (REUSE đúng pipeline palette `lib/refingest.ts:105-120` đang chạy) · số cụm trội · độ bão hoà trung vị | — | KHÔNG gate; chỉ ghi hồ sơ màu làm dữ liệu xếp hạng + lọc tìm kiếm | màu là GU, không phải PHẨM CHẤT — đưa màu vào gate là ép gu (vi phạm trung tính) |
| **T5 · Tỉ lệ khung** | aspect ratio | — | 1:3 → 3:1 cho TUYỂN | ngoài dải này là banner/strip, phá lưới duyệt |
| **T6 · Sạch nội dung** | phát hiện chữ/UI (mật độ cạnh chữ nhật + vùng phẳng đơn sắc lớn) · watermark góc | 0–1 | screenshot-UI/watermark đậm ⇒ **LOẠI khỏi TUYỂN**, được ở KHO nếu license sạch | mặt tiền cảm hứng không phải kho screenshot; graphic được miễn một phần (§3) |

**Cổng CỨNG (hard gate — đứng TRƯỚC mọi thang, phạm là LOẠI, không có điểm bù):**
G1 nguồn + giấy phép hợp lệ (`license:` ∈ cc0/unsplash/studio/ai/user — luật đã thi hành ở tầng
hàm, REUSE `canJoinCollection()`) · G2 chặn Pinterest (REUSE `gallery-source-guard` + `IMAGE-SOURCES.md`)
· G3 **ảnh khách/PII**: ảnh mang `duAnId`/tag dự án khách hoặc trùng hash với `LibraryAsset` thuộc
dự án ⇒ cấm frontage vĩnh viễn (được nằm kho làm việc của dự án đó — đây chính là ca "5 ảnh hành
lang thang máy" đang chiếm mặt tiền hôm nay) · G4 trùng lặp (contentHash ĐÃ CÓ trong schema — ảnh
trùng byte không nạp hai lần).

## 3 · THANG ĐO RIÊNG TỪNG MIỀN — cắm vào `nganh:*`, chỉ đổi TRỌNG SỐ và thêm ít trục

| Miền | Trục thêm/riêng | Đo | CANDIDATE |
|---|---|---|---|
| `noi-that` | **đọc được KHÔNG GIAN**: có phối cảnh (vanishing lines qua Hough — họ hàm đã có trong `lib/vision`) + tỉ trọng vùng vật liệu (gỗ/đá/vải qua hồ sơ màu-texture) | 0–1 | space-score ≥0.5 cho TUYỂN miền này |
| `kien-truc` | hình khối + đường chân trời + tỉ lệ trời/công trình | 0–1 | như trên |
| `canh-quan` | tỉ trọng phổ xanh thực vật + tầng lớp (foreground/background entropy) | 0–1 | như trên |
| `graphic` | ĐẢO chiều T6: chữ/lưới/phẳng là ĐẶC TRƯNG chứ không phải lỗi; đo lưới (alignment), tương phản chữ-nền | — | T6 miễn trừ; T2 đo theo lưới thay vì theo tĩnh |
| `art` | lỏng nhất: chỉ G1–G4 + T1; không áp T2/T3 (nghệ thuật được phép rối và cháy) | — | vào TUYỂN bằng xếp hạng, không bằng gate |

Phân miền: multi-label bằng **điểm miền** (rule-based từ đặc trưng trên + từ điển caption
`MATERIAL_TERMS/STYLE_TERMS/ROOM_TERMS` của `lib/gu.ts` khi ảnh có caption) — ảnh đạt ngưỡng ở
nhiều miền thì mang nhiều nhãn (ADR). **Không miền nào đạt** ⇒ nhãn `chua-xep`, nằm KHO, xuất
hiện trong tìm kiếm, không lên khay miền.

## 4 · ĐƯỜNG ĐI CỦA MỘT TẤM ẢNH (nhìn → hiểu → quyết)

```
NẠP (kéo-thả / URL sạch / Sổ nguồn)
 → ① NHÌN     đo T1–T6 + hash + palette (local, ~200ms, ghi 1 lần vào AssetRepresentation/tags)
 → ② GATE     G1–G4: phạm ⇒ LOẠI (kèm LÝ DO NGUYÊN VĂN — khuôn 415-hiện-lý-do đã có ở Promote)
 → ③ HIỂU     điểm miền (multi-label) + hồ sơ màu/mood keywords
 → ④ QUYẾT    - qua gate, chưa đạt trục TUYỂN  ⇒ KHO RỘNG (research pool — tìm được, dùng được)
              - qua gate + đạt trục TUYỂN của ≥1 miền ⇒ ỨNG VIÊN MẶT TIỀN
 → ⑤ XẾP HẠNG frontage mỗi miền xếp theo điểm tổng; GU CÁ NHÂN (§6) chỉ re-rank, không loại
 → ⑥ NGƯỜI    duyệt cuối khay "Ứng viên mặt tiền" theo lô (một cú một ảnh) — máy KHÔNG tự
              công bố mặt tiền; và chỉ NGƯỜI gỡ được một ảnh đã tuyển
```

Trạng thái nào cũng NÓI THẬT trên UI theo khuôn `02-02` đang có ("còn N ảnh chưa gắn nhóm — chưa
lên mặt tiền, không mất") — máy đọc gu thay con số ấy bằng ba con số: `đã tuyển · trong kho · loại`.

## 5 · LOCAL-FIRST — phần nào offline, phần nào mạng, hạ cấp ra sao

| Tầng | Chạy đâu | Mất mạng thì |
|---|---|---|
| T1–T6 + G1–G4 + điểm miền rule-based | **100% local** (CV cổ điển + từ điển gu.ts) | chạy đủ — máy vẫn phân ba ngăn được |
| Caption/VLM (mô tả ảnh, bắt vật thể tinh) | tuỳ chọn, khi có mạng/khi bật máy VLM local | **hạ cấp**: bỏ trục caption, điểm miền chỉ từ đặc trưng thị giác; ảnh vào KHO chờ, KHÔNG chặn |
| Nạp nguồn ngoài (Openverse/Unsplash API) | mạng | Sổ nguồn ghi lại URL, nạp khi có mạng |
| Lọc "cho đẹp" (ASC CDL) | local — REUSE `nhuom-anh-the.py` | chạy đủ |

**Nguồn cho CÁI RỘNG** (trả câu hỏi ngược #1): Unsplash + Openverse + Wikimedia là nền; **chưa đủ
cho chất lượng nghề nội thất** — bổ sung: Pexels (license riêng, cho phép), kho bảo tàng CC0
(Met/Rijksmuseum — mạnh cho `art`), và **nguồn chất lượng thật dài hạn là `studio` + `user`**
(ảnh tự chụp, render tự sinh `ai`) — đúng 5 loại license đã chốt, không thêm loại mới.

## 6 · HIỆU CHUẨN + GU CÁ NHÂN — trả câu hỏi ngược #3

> 🔴 **ĐÓNG DẤU 30/08 (sau khi giao) — hai sửa đổi từ cầu lane 00, đọc trước khi thi công mục này:**
> **(a) SỰ THẬT BẨN đã kiểm chéo:** con số "1.580 ảnh `gu-đích`" mà mục này kế thừa từ phiếu giao là
> SAI — đo thật: tag `gu-đích` chỉ có **43 ảnh**; 1.580 = category `Ref nội thất` (986) + `Style dàn
> trang` (594); tag thật là họ `pinterest/pin-*/detech/*`. **Ai lọc theo tag `gu-đích` sẽ hụt 37 lần
> mà không lỗi.** ⇒ mọi bộ lọc hiệu chuẩn trong mục này phải chọn theo **category + tag thật, đo lại
> từ nguồn ngay trước khi dùng**, không trích số từ phiếu (kể cả phiếu này).
> **(b) HOÃN phần gu (không huỷ):** Hoà chốt thứ tự *chuẩn ngành trước → điều hơn chuẩn → HỌC GU SAU
> CÙNG*; `GU-PROFILE.md` **không phải nguồn chuẩn, không phải mặc định** — nó là MỘT design DNA của
> MỘT designer đầu tiên IF học. ⇒ đoạn "hồ sơ gu cá nhân + re-rank cho tài khoản Hoà" dưới đây
> **HOÃN**; **gold-set 120 ảnh VẪN LÀM nhưng chấm theo CHUẨN NGÀNH** (đạt/không theo thang T1–T6),
> không chấm theo gu. Gate G1–G4 + thang T + ba ngăn ĐỨNG ĐỘC LẬP với gu ngay từ thiết kế — không
> đổi kiến trúc, chỉ hoãn một tầng re-rank.

- **1.580 ảnh `gu-đích` của Hoà = TẬP HIỆU CHUẨN, không phải hàng lên mặt tiền.** Hai việc:
  ① rút **phân phối chuẩn** cho các ngưỡng CANDIDATE (vd "nét ≥p25 của gold-set" — ngưỡng lấy từ
  dữ liệu thật thay vì bịa); ② dựng **hồ sơ gu cá nhân** (palette trội + keyword — GU-PROFILE đã
  chưng cất sẵn 3 cực GLAM/TĨNH/ZEN) để **re-rank khay mặt tiền cho TÀI KHOẢN HOÀ**. Người dùng
  khác nạp gu riêng bằng đúng cơ chế (ảnh họ pick → `guProfileFromPicked` ĐÃ CÓ) ⇒ trung tính giữ.
- **Gold-set chấm tay**: chọn 120 ảnh (40 chắc-đạt · 40 chắc-loại · 40 khó) — Hoà chấm nhị phân
  một buổi (~15 phút, một cú một ảnh theo luật khung giờ). Fit ngưỡng trên 100, giữ 20 làm test mù.
- **Ca đột biến bắt buộc trước khi tin máy** (không PASS giả): trồng ① ảnh watermark Pinterest ⇒
  G2 bắt; ② render dự án khách có tag `duAnId` ⇒ G3 chặn frontage; ③ blob xanh 400px mờ ⇒ T1 loại
  khỏi TUYỂN; ④ screenshot UI ⇒ T6; ⑤ ảnh zen RẤT TỐI hợp lệ (từ gold-set) ⇒ PHẢI QUA (đây là ca
  chống-giết-nhầm quan trọng nhất — máy nào loại ảnh này là máy hỏng); ⑥ graphic poster chữ to
  hợp lệ ⇒ PHẢI QUA ở miền graphic. Sáu ca này thành test cố định chạy trong `npm test` (khuôn
  `soi-anh-the.py` đã có kiểu này).

## 7 · MÁY *KHÔNG* QUYẾT ĐƯỢC GÌ — nói thẳng

1. **Công bố mặt tiền** — máy chỉ đề cử; người bấm. 2. **Giấy phép mập mờ** — máy chỉ đọc nhãn đã
khai; nguồn không rõ là việc người. 3. **"Đẹp" tuyệt đối** — máy đo được tĩnh/nét/sáng, KHÔNG đo
được thần thái; xếp hạng là gợi ý thứ tự duyệt, không phải phán quyết thẩm mỹ (đúng ranh giới
máy-đo/người-chấm đã thành luật trường thiết kế). 4. **Ảnh khách được phép ngoại lệ** (vd studio
muốn khoe dự án của chính họ đã xin phép) — cờ ngoại lệ do người bật từng ảnh. 5. **Đổi taxonomy
miền** — quyền ADR, không phải quyền máy.

## 8 · NỐI VÀO CÁI CÓ SẴN (B25 — bảng bắt buộc)

| Cần | Mảnh có sẵn | Coverage | Action |
|---|---|---|---|
| tag miền + license | `gallery-tags.ts` (`nganh:*`, `license:*`, `canJoinCollection`) | FULL | **REUSE** — máy ghi vào đúng tag này |
| gate nguồn | `gallery-source-guard` + `IMAGE-SOURCES.md` | FULL | REUSE |
| trục bố cục/tĩnh | `soi-anh-the.py` (5 cổng + độ tĩnh, có ca thật) | PARTIAL (khung nhỏ) | **EXTEND** thành T2 + khuôn test đột biến |
| palette | `refingest.ts` k-means local | FULL | REUSE làm T4 |
| từ điển gu/caption | `lib/gu.ts` MATERIAL/STYLE/ROOM_TERMS + `guProfileFromPicked` | FULL | REUSE cho điểm miền + gu cá nhân |
| hash chống trùng | `contentHash` (VỪA sống trong DB 30/08) | FULL | CONNECT làm G4 |
| chấm-lô một-cú | khuôn duyệt Promote/"Đã xem" (922af7e) | PARTIAL | EXTEND thành khay "Ứng viên mặt tiền" |
| lọc đẹp | `nhuom-anh-the.py` ASC CDL | FULL | REUSE sau-tuyển (không thuộc gate) |
| đề xuất ML sâu | `docs/ML-GU-ENGINE-PROPOSAL.md` | UNKNOWN (chưa ai đọc lại) | đọc TRƯỚC khi thêm bất kỳ model nào ngoài rule-based |
| **NEW thật sự** | bộ đo T1/T3/T5/T6 + điểm miền + khay ứng viên | NONE | NEW có negative-evidence: không mảnh nào hiện đo nét/sáng/khung/UI-detect; xây thành MỘT module `lib/gu-doc/` cạnh `lib/gu.ts`, không đẻ store mới (điểm ghi vào tags/AssetRepresentation có sẵn) |

## 9 · CHƯA CHẮC · HẠN DÙNG

CHƯA CHẮC: mọi ngưỡng số (chờ gold-set); năng lực UI-detect T6 bằng CV cổ điển (có thể cần VLM);
bản ADR đầy đủ chưa đối chiếu; `ML-GU-ENGINE-PROPOSAL.md` chưa đọc lại. HẠN DÙNG: đặc tả sống tới
khi gold-set trả số thật — lúc đó MỌI ô CANDIDATE phải thay bằng số đo, phiếu này không được trích
như ngưỡng chốt.
