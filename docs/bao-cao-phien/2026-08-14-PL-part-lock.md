# PL · PartLock — cấu kiện lắp ghép có tên thật + khoá từng phần (LUẬT NGÀNH thứ 6)

> Phiếu: `docs/phieu-giao/part-lock-cau-kien.md` · Hoà chốt 14/08: *"Chi tiết fur đều là 1 cấu kiện
> vật lý được ghép rời như 1 chiếc ghế thực tế... Luật chung: khi tạo sinh sản phẩm phải có cách
> trực tiếp/gián tiếp cho phép thay đổi, tinh chỉnh thiết kế, khoá cái không đổi. Đổi điều cần đổi
> thôi, không phải cả khối render là chốt cứng."*
> Đầu vào: `scratchpad/lincoln-327.glb` (cache sẵn, KHÔNG tốn job AI mới — chạy lại thuần `xayDoThiDien`
> + `chuanNet` để tái sinh input, xem §4 vì sao không nạp trực tiếp 2 JSON đã lưu).

## 0 · Kết quả một dòng

**9/22 cấu kiện đặt tên giải phẫu được** (4 chân trái/phải×trước/sau + 2 vòng tay vịn trái/phải +
mặt ngồi + tựa lưng + thanh giằng), **13/22 giữ tên kỹ thuật `phan-YY`** (mảnh nhỏ không khớp dải
giải phẫu nào — trung thực, không ép tên sai). Khoá `[mat-ngoi, tua-lung]`, "tinh chỉnh" đổi màu
`vong-tay-trai/phai` → **hash nội dung 2 cấu kiện khoá TRƯỚC = SAU tuyệt đối** (đo bằng FNV-1a +
độ dài chuỗi ổn định, không phải so bằng mắt), 2 cấu kiện không khoá đổi đúng lệnh, **18 cấu kiện
còn lại không bị lệnh sửa nhắm tới cũng giữ nguyên** — 0 lỗi.

## 1 · File

| File | Nội dung |
|---|---|
| `lib/idfc-import/part-lock.ts` (MỚI, ~390 dòng) | `buildPartLockFromChuanNet` · `regenerateUnlocked` · `partContentHash`/`stableStringify`/`fnv1a` · `asciiTree` |
| `lib/idfc-import/part-lock.test.ts` (MỚI) | fixture "ghế đồ chơi" tổng hợp (4 chân+2 vòng+seat+backrest+stretcher+3 mảnh lạc) — **23 pass · 0 fail** |
| `scratchpad/part-lock-proof.ts` | script chạy thật trên Lincoln (gọi lại `xayDoThiDien`+`chuanNet` trên GLB cache) |
| `scratchpad/lincoln-part-lock.json` | `PartLockAsset` đầy đủ (22 cấu kiện, geomRef, lienKet, ghiChu) |
| `scratchpad/lincoln-part-lock-tree.txt` | bảng ASCII cây cấu kiện (soi mắt nhanh, không cần ảnh) |

`tsc --noEmit` **0 lỗi** toàn repo · **mọi `*.test.ts` trong repo pass** (chạy sweep giống `npm test`,
bao gồm `surface-graph.test.ts` 55 pass và `chuan-net.test.ts` 58 pass — **không đụng, không vỡ**).
Không sửa `surface-graph.ts` / `chuan-net.ts` / `from-photo.ts` / `components/**` — chỉ `import type`
từ hai file nguồn + gọi hai hàm dựng sẵn từ script proof.

## 2 · Cây cấu kiện Lincoln 327 (22 cấu kiện)

```
id               tên nghề           loại         %dt     khoá  màu
chan-phai-sau    Chân phải sau      cylinder             ·     #433022
chan-phai-truoc  Chân phải trước    cylinder             ·     #422f23
chan-trai-truoc  Chân trái trước    cylinder             ·     #3a2a1f
chan-trai-sau    Chân trái sau      cylinder             ·     #423023
vong-tay-trai    Vòng tay vịn trái  torus                ·     #503e2c
vong-tay-phai    Vòng tay vịn phải  torus                ·     #55422e
mat-ngoi         Mặt ngồi           mesh×18diện   23.9%  ·     #906c3c
tua-lung         Tựa lưng           mesh×10diện   12.2%  ·     #866234
thanh-giang      Thanh giằng        mesh×1diện     1.3%  ·     #45372a
phan-07 … phan-59 (13 mảnh)         mesh×1diện   0.3–2.7% ·   (mỗi mảnh 1 màu riêng)
```
Nguồn TÊN: 4 chân + 2 vòng lấy THẲNG từ `chuanNet()` (primitive đã fit sẵn, RMS <1%) — chỉ suy TÊN
(trái/phải theo dấu X, trước/sau theo dấu Z so với hướng "sau" tự suy từ 5 diện Y cao nhất). Mặt
ngồi/tựa lưng/thanh giằng gom DIỆN của `xayDoThiDien()` theo **dải Y hình học** (tỉ lệ theo chiều
cao chân + đáy vòng tay, không hardcode mm), SAU KHI loại trừ vùng đã bị chân/vòng "ăn" (khoảng
cách tới trục trụ/vòng xuyến). 13 mảnh còn lại (chi tiết nhỏ 0,3–2,7% diện tích, ở vùng giao giữa
ghế/tay vịn/giằng) không khớp dải nào rõ ràng → giữ tên kỹ thuật `phan-YY`, không ép đặt tên sai
(đúng luật ruột [T0] "khai thật" xuyên suốt hai file nguồn).

`lienKet`: 92 cặp cấu kiện chạm nhau (ngưỡng 90mm giữa điểm biên đại diện) — ví dụ `chan-phai-sau`
chạm cả `mat-ngoi`, `tua-lung`, `thanh-giang` (đúng vị trí vật lý một chân sau chịu cả ba).

## 3 · Chứng minh khoá-bất-biến (số thật, không phải mô tả)

Khoá `[mat-ngoi, tua-lung]`, gọi `regenerateUnlocked` với lệnh "tinh chỉnh" chỉ nhắm `vong-tay-trai`
+ `vong-tay-phai` (đổi màu đồng bóng → đồng đen mờ `#1a1a1a`):

| Cấu kiện | Khoá? | hash TRƯỚC | hash SAU | Kết quả |
|---|---|---|---|---|
| `mat-ngoi` | 🔒 | `be5dd72f:178b` | `be5dd72f:178b` | **bằng nhau tuyệt đối** |
| `tua-lung` | 🔒 | `39123848:156b` | `39123848:156b` | **bằng nhau tuyệt đối** |
| `vong-tay-trai` | · | `1bb224ab:943b` | `cebc3b53:943b` | đổi (đúng lệnh, #503e2c→#1a1a1a) |
| `vong-tay-phai` | · | `06ba5c75:947b` | `3fd7335c:947b` | đổi (đúng lệnh, #55422e→#1a1a1a) |
| 18 cấu kiện còn lại (4 chân, thanh giằng, 13 `phan-YY`) | · | — | — | **tất cả bằng nhau tuyệt đối** (lệnh sửa không nhắm tới) |

Hash = FNV-1a 32-bit trên `stableStringify({id, geomRef, matHex, matId})` (khoá đã sắp thứ tự đệ
quy) **kèm độ dài chuỗi** — hai số độc lập cùng khớp mới coi là bất biến, không dùng thư viện
crypto (giữ THUẦN, chạy được cả trình duyệt). `regenerateUnlocked` **deep-clone** phần khoá (test
③ chứng minh: sửa object trả về không làm bẩn asset gốc) — không chỉ tham chiếu chung bộ nhớ.

## 4 · Quyết định tự chọn (ghi rõ để T/Hoà xét lại nếu cần)

1. **Không dùng `surfaceGraph.cauKien` (cụm vật liệu) để gom cấu kiện giải phẫu.** Đo thật: cụm gỗ
   lớn nhất của Lincoln (25% diện tích) nối liền CHÂN→GHẾ→LƯNG vì cùng vân gỗ và các diện đó chia
   sẻ biên dọc khung ghế — dùng thẳng sẽ khoá/tinh-chỉnh nhầm cả bộ khung. Thay bằng gom theo VÙNG
   KHÔNG GIAN (dải Y + hướng trước/sau), bỏ tiêu chí "cùng vật liệu" cho ba cấu kiện hữu cơ (mặt
   ngồi/tựa lưng/thanh giằng) — lệch câu tổng quát trong phiếu nhưng có bằng chứng số kèm theo.
2. **`chuan-net-recipe.json` NEST `kdSrgb`/`matName` dưới `vatLieu.*`, khác shape PHẲNG của kiểu
   `ChuanNetPart` thật** (`chuan-net.ts:1024-1027` build JSON lồng, nhưng `:737/842/914` build object
   sống với field top-level) — proof bản đầu nạp JSON cũ ra màu xám mặc định `#888888` (bug ở script
   proof, không phải ở `part-lock.ts`). Đã sửa: proof gọi lại `xayDoThiDien`/`chuanNet` SỐNG trên GLB
   cache thay vì nạp JSON, ra đúng màu gỗ/đồng thật (`#433022`…). Đáng để phiên chuan-net sau xem lại
   nếu có nơi khác cũng nạp `recipeJson` rồi ép kiểu `ChuanNetPart[]` trực tiếp.
3. `GeomRefMeshSubset` không kèm mesh vertex thật (chỉ `dienIds`+`soTri`+`dienTichPct`) — đủ để chứng
   minh khoá-bất-biến bằng hash, nhưng CHƯA đủ để render/export lại hình học cấu kiện độc lập (cần
   trace ngược `dienId → tam giác` trong `NormalizedMesh`, việc của phiếu sau nếu cần xuất `.idfc`
   từng cấu kiện riêng).

## 5 · Phần chưa làm (đúng phạm vi phiếu — để phiếu sau)

- **UI chọn khoá** (bấm 🔒 trên từng cấu kiện) — phiếu này chỉ làm hàm lõi + proof số liệu.
- Xuất `.idfc` RIÊNG cho từng cấu kiện (mesh subset → geometry thật) — hiện `geomRef.meshSubset` chỉ
  tham chiếu `dienIds`, chưa cắt mesh vật lý.
- Áp dụng cho loại ghế/đồ nội thất KHÁC ngoài "ghế bar 4 chân + 2 tay vịn" — tên giải phẫu
  (`mat-ngoi`/`tua-lung`/`thanh-giang`/4 chân/2 vòng) đang hardcode cho hình dạng này; đồ không có
  tay vịn hoặc có nhiều hơn 4 chân sẽ rơi hết vào `ghiChu` + không suy được dải Y (đã tự khai thật
  trong code khi `legs.length !== 4` hoặc `rings.length !== 2`).
