# NGỮ CẢNH DỰ ÁN — PHA 1 + PHA 2 (22/08)

## 🔴 BÀI HỌC ĐẮT NHẤT: CỔNG MÁY CỦA T LÀ **XANH GIẢ**, LANE B BẮT ĐƯỢC

T báo *"`npm test` 0 fail"* sau Pha 1. **SAI.** Thực đo lại: `npm test; echo $?` → **exit=1**.

**Vì sao lọt**: T soi cổng bằng `npm test 2>&1 | grep -c "FAIL -"`. Nhưng tệp test **CHẾT LÚC NẠP**
(`MODULE_NOT_FOUND`) thì **không in dòng `FAIL` nào cả** ⇒ grep đếm ra 0 ⇒ T đọc thành "sạch".
Máy đếm đúng thứ nó được bảo đếm; thứ nó không thấy thì nó không kêu.

**Gốc bệnh**: `lib/site/solar.ts` import `@/lib/three/lighting` — bộ chạy test của repo là
`sucrase-node` (`package.json` script `test`), **nó không phân giải alias `@/`**. Đây là *value
import* nên sinh `require()` thật lúc chạy. (`types.ts` dùng `@/` vẫn sống vì là `import type` —
sucrase xoá hẳn, không sinh require. Chính chỗ này làm T tưởng alias dùng được.)
T chạy `npx tsx` (phân giải alias) nên thấy xanh; runner thật thì đỏ. **Hai bộ chạy khác nhau,
T tin bộ dễ tính hơn.**

⇒ **LUẬT TỪ NAY: soi cổng bằng MÃ THOÁT, không bằng grep.**
`npm test >/dev/null 2>&1; echo $?` — số 0 mới là sạch. `grep "FAIL"` chỉ là phụ.
⇒ **Và: value import trong `lib/**` PHẢI tương đối, cấm `@/`.** Đã ghi cảnh báo tại chỗ ở
`solar.ts` kèm lý do, để phiên sau không "dọn" lại thành alias cho đẹp.

📌 Ghi nhận: **Lane B chủ động quét toàn suite và chuyển blocker về đúng chủ sở hữu thay vì tự vá
vào vùng cấm** — đúng kỷ luật claim-key, và nó cứu một lời khai sai của T.

## PHA 1 · TẦNG MIỀN (MAIN) — XONG, chạy thật
`lib/site/types.ts` · `solar.ts` · `anh-huong.ts` · `store.ts` · `app/api/projects/[id]/site/route.ts`

⭐ **BA TẦNG SỰ THẬT KHOÁ BẰNG MÁY, không bằng lời dặn** (§3 · §4):
· `nguonHopLe()` — `verified` mà không nguồn = mâu thuẫn tự thân, bị chặn
· `apQuyetDinh(..., boi:'  ')` → **`null`** ⇒ máy KHÔNG có đường tự nhận đề xuất thay người
· `deXuatDuocDuyet()` — nơi DUY NHẤT quyết cái gì vào ngữ cảnh AI; `cho-duyet`/`da-tu-choi` không lọt

⭐ **§32 — đổi hướng KHÔNG được quét sạch**: `PHU_THUOC` khai đổi hướng chỉ làm cũ `nang`;
bằng chứng `thu-cong`/`van-hoa` **không đụng**. Có test riêng cho đúng ca này.

**Chạy thật trên app** (phiên đã đăng nhập): GET rỗng → `chua-ro` · PATCH → 10.7769/106.7009 ·
GET lại → BỀN VỮNG · đổi hướng → `thayDoi=huong-mat-dung` (KHÔNG nhầm thành `toa-do`), vị trí giữ nguyên.

**Hai quyết định của MAIN + lý do** (để phiên sau khỏi hỏi lại):
① **KHÔNG thêm bảng Prisma** — `migrate`/`db push` không chạy qua sandbox (luật vận hành #1) và ghi
DB đang bị chặn. Đẩy schema mà không migrate được = có bảng trên giấy, không có chỗ lưu thật. Dùng
khuôn JSON-per-project ĐÃ CÓ (dna/notebook/comments) ⇒ persistence THẬT ngay. Di trú sau = đổi một
hàm đọc/ghi, không phải sửa khắp UI.
② **KHÔNG đẻ bộ từ vựng độ tin cậy thứ năm** — §16 đề nghị 5 nấc, nhưng repo đã có 4 bộ cạnh tranh
và `lib/capabilities/image-to-3d.ts:61` CẤM giá trị thứ tư của `measured|inferred|verified` (~509
chỗ dùng). ÁNH XẠ thay vì thêm; phép ánh xạ khai trong docstring `types.ts`.

## PHA 2 · TRÍ TUỆ VẬT LÝ (Lane B) — XONG-MÁY, MAIN đã kiểm độc lập
`khi-hau.ts` · `gio.ts` · `dia-ly.ts` · `suy-luan.ts` · `vat-ly.test.ts` (**102 khẳng định**, MAIN tự chạy lại)

⭐ **MÁY CHẶN NÓI QUÁ, không phải lời nhắc**: `viPhamThoiTiet()` bắt `nhietDoHienTai`/`duBao7Ngay`
(khí hậu ≠ thời tiết, §10) · `viPhamCFD()` + `laCFD(): false` + nhãn bắt buộc `NHAN_GIO = "gió thịnh
hành của vùng"` (§12 cấm ám chỉ CFD) · nguồn khai thang `cong-truong` bị **loại thẳng chứ không hạ
hạng** · `taoDeXuat` **không có tham số `trangThai`** ⇒ máy không có đường tự `da-nhan`.
⭐ **`dia-ly.ts` tách hai đường**: đo được (lên `verified` khi có nguồn) vs **gợi ý từ TÊN ĐỊA DANH
(vĩnh viễn `inferred`)** — ca bẫy *"Hải Dương"* nằm trong test.

🔴 **KHAI THẬT PHẠM VI** (Lane B tự khai, MAIN xác nhận là trung thực): nhóm `nang.*` **chạy thật
ngay** vì hình học mặt trời TÍNH RA từ toạ độ, không phải số đi xin ⇒ ca kinh điển ①
*(mặt đứng Tây + nắng chiều)* **sống trên app thật**. Kho nguồn khí hậu/gió **RỖNG CỐ Ý, không bịa
một con số nào** ⇒ ca kinh điển ② *(ẩm + ven biển → ăn mòn)* hiện **chỉ chạy trong test với fixture**;
luật im trên app cho tới khi cắm nguồn thật. **Thà rỗng thật còn hơn đầy giả.**

## 🟡 CHỜ HOÀ CHỐT
Ba ngưỡng Lane B tự chọn, **chưa có nguồn ngành chống lưng**: mưa **100mm** · ven biển **3000m** ·
ẩm **75%**. Đây là quy ước làm việc, không phải sự thật ngành.

## CÒN NỢ
· Cắm nguồn khí hậu/gió thật (chưa có gói mạng nào, cố ý)
· `hoSo.*` của Lane B cố ý không trùng `Mien` ⇒ nếu lượt sau đem lưu xuống đĩa thì `suThatCu()`
  sẽ KHÔNG đánh dấu chúng là cũ — phải xử lúc đó
· `CACH_NOI_CAM`/`TU_CAM_THOI_TIET` là **sàn dưới không phải trần** (lọc chuỗi, không hiểu nghĩa)
· Lane C (UX + 3D thôi sở hữu vị trí) đang chạy

## CỔNG (đo bằng MÃ THOÁT)
`npx tsc --noEmit` **0** · `npm test` **exit 0** · `site.test.ts` ✅ · `vat-ly.test.ts` ✅ 102 khẳng định

---

# ĐỢT SIẾT (chỉ thị "NEXT DIRECTIVE") — 22/08

## §1 · NGƯỠNG CHƯA CÓ NGUỒN → TẦNG CHÍNH SÁCH, IM TRONG SẢN XUẤT
`lib/site/chinh-sach.ts` — bốn hạng `chuan | chinh-sach | uoc-le | chi-test`.
Ba ngưỡng (mưa 100mm · ven biển 3000m · ẩm 75%) khai `uoc-le`, **không nguồn** ⇒
`dungDuocTrongSanXuat()` trả **false** ⇒ luật IM. Không đem ra hỏi Hoà: đây là câu hỏi BẰNG
CHỨNG, không phải khẩu vị.
⭐ **Trần độ tin cậy `tranDoTinCay()`**: kết luận KHÔNG THỂ chắc hơn ngưỡng yếu nhất đã dùng
(mắt xích yếu nhất) ⇒ dùng ngưỡng `uoc-le` thì **trần là `inferred`**, dù mọi dữ kiện khác
`verified`. Không có đường vòng lên `verified`.
⭐ Nâng hạng mà không đính nguồn → `nguongHopLe()` chặn, test đỏ. Muốn lên `chuan` phải có nguồn
thật, KHÔNG phải sửa con số rồi giữ nguyên hạng.

## §2 · MÚI GIỜ SUY TỪ KINH ĐỘ KHÔNG BAO GIỜ LÀ CANONICAL
`ViTriDuAn` thêm `muiGioCo: ProvenanceFlag` + `muiGioNguon`.
`TrangThaiNang` thêm `co` + `vi` — **hạng của chính kết quả nắng**.
Hình học mặt trời tất định, NHƯNG nó ăn múi giờ ⇒ múi giờ `inferred` thì **nắng bị kẹp trần
`inferred`**; chỉ múi giờ `verified` mới cho nắng lên `verified`. Lý do hiện thành câu người đọc
được: *"múi giờ SUY TỪ KINH ĐỘ — xấp xỉ, sai ở nước có ranh giới múi giờ theo chính trị"*.

## §3A · QUYỀN — ĐÃ ĐÓNG
`lib/site/quyen.test.ts` (15 khẳng định): thang quyền (**`crea` cao thứ nhì VẪN không đủ**) ·
lớp lỗi (403 khi thiếu quyền · **404 khi không phải member** để không lộ dự án có tồn tại) ·
tuyến đường (**PATCH đòi `owner`**, kiểm quyền TRƯỚC khi đọc thân và TRƯỚC khi ghi, chỉ một chỗ
gọi `ghiHoSo`).
**Đo trên app thật**: PATCH dự án không phải của mình → **HTTP 404**, hồ sơ của mình **không bị
đụng**; GET dự án lạ cũng **404**. ⇒ cổng quyền SỐNG THẬT, không chỉ nằm trong mã.
🟡 Còn lại: ca 403 ĐÚNG NGHĨA (thành viên hạng thấp) chưa quan sát được — dựng thành viên thứ hai
cần GHI DB, mà ghi DB đang bị chặn. Bảo đảm hiện có là **hợp thành từ ba mắt xích**, không phải
quan sát trực tiếp. Khai đúng như vậy.

## §3B · DANH TÍNH VẬT THỂ 3D — 🔴 CHƯA ĐÓNG, KHÔNG NHẬN BỪA
Thử **ba lượt** trên app thật, cảnh 3D nạp lên **rỗng** (0 vật thể) ⇒ phép so "trước = sau" ra
`0 === 0` — **ĐẠT RỖNG TUẾCH**. Đây đúng cái bẫy xanh-giả vừa trả giá ở cổng `npm test`, nên
**KHÔNG ghi PASS**.
Phần đóng được thì đã đóng bằng máy — canh gác **G11**: đường kéo giờ `applyDateTime` không chạm
`entit*`/`setDoc`/`setScene`/`rebuild`/`setSelected`, chỉ ghi qua `writeSun`, và góc nắng lấy từ
`gocNangTuHoSo(hoSo…)` chứ không từ state riêng của 3D.
⇒ **Còn nợ**: dựng cảnh có vật thật rồi so danh tính/hình học/vật liệu/lựa chọn trước-sau.

## §4 · CANH GÁC CHỐNG TÁI PHÁT — `lib/site/canh-gac.test.ts` (43 khẳng định)
G1 3D không sở hữu vị trí (**chỉ đếm DÒNG MÃ**, cho phép comment giữ dấu mốc lỗi thời) · G2 URL
thắng "dự án gần nhất" · G3 hồ sơ rỗng hợp lệ · G4 **"Sài Gòn"/"Hải Dương" không được đọc thành
toạ độ DMS** · G5 `verified` phải có nguồn · G6 đề xuất bị từ chối không vào ngữ cảnh AI · G7 đổi
hướng chỉ làm cũ nắng · G8 ngưỡng chưa nguồn không thành canonical · G9 múi giờ suy ra ≠ đã kiểm ·
G10 `solar.ts` cấm alias `@/` + giữ lời cảnh báo · G11 kéo giờ không chạm vật thể.

## SỬA THÊM NGOÀI CHỈ THỊ (lỗi của MAIN, Lane C bắt)
Rail hiện **tên dự án khác** với trang: `duAnHieuLuc` không đọc URL dù `usePathname()` có sẵn ⇒
rơi xuống "dự án gần nhất". Đã sửa: **URL thắng tất cả**. Đo lại: A→"Dự án mới", B→"Căn hộ mẫu ·
Studio 48m²", khớp trang cả hai. Khoá bằng G2. Ảnh `S3` đã **chụp lại** vì bản cũ còn dính lỗi.

## CỔNG (đo bằng MÃ THOÁT, không bằng grep)
`npx tsc --noEmit` **0** · `npm test` **exit 0** ·
`site` 35 · `canh-gac` 43 · `quyen` 15 · `vat-ly` 102 = **195 khẳng định**

## OPEN — QA/A11Y, KHÔNG CHẶN KIẾN TRÚC (§7)
theme tối · trình đọc màn hình · các khổ màn khác. Ghi riêng, KHÔNG trộn vào Site Truth.

## CÒN LẠI CỦA ĐỢT NÀY
· §3B danh tính vật thể 3D (cần cảnh có vật)
· §6 dây Site → Vitals thật (đổi hướng → nắng CŨ → Vitals mép → Peek → Detail → tính lại → hết cũ)

---

# ĐÓNG HAI CỬA CUỐI — §3B + §6 (22/08)

## §3B · DANH TÍNH VẬT THỂ 3D DƯỚI NẮNG THẬT — **PASS**

**Cảnh KHÔNG rỗng, dựng qua ĐÚNG đường app thật**: Vẽ 3D → chip **Tạo** → **Chữ nhật** → hai điểm
trên khung nhìn → Enter. Không fixture, không đường tắt bỏ qua bộ nạp cảnh.

| trường | trước | sau kéo giờ |
|---|---|---|
| objectCount | 1 (`Khối`) | 1 (`Khối`) |
| objectIds | `["Khối"]` | `["Khối"]` |
| selection | `["Tất cả"]` | `["Tất cả"]` |
| hồ sơ địa điểm | 10.7769/106.7009 · 270° | y hệt |
| **kim la bàn (azimuthDeg)** | **135°** | **279,26°** |

`nonEmptyScene ✓ · identityStable ✓ · selectionStable ✓ · siteProfileSame ✓ · solarChanged ✓`

⭐ **KIỂM CHÉO ĐẮT GIÁ**: 279,26° lúc 17:00 tại TP.HCM khớp với dải Tây mà `site.test.ts` tính
ĐỘC LẬP bằng `trangThaiNang` (16h30 → 240–290°). Giao diện và tầng miền ra cùng một số ⇒ 3D thật
sự đọc hồ sơ dự án, không phải tự tính một đường riêng.

🔴 **BỐN LƯỢT ĐẦU BÁO `solarChanged: false` — VÀ ĐÓ LÀ LỖI CỦA BỘ ĐO, KHÔNG PHẢI CỦA APP.**
React theo dõi setter của `input.value`; gán thẳng `el.value` rồi bắn `input` thì handler **không
chạy**. Phải gọi setter gốc `HTMLInputElement.prototype.value`. Ghi lại vì đây là bẫy sẽ gặp lại
ở mọi lần lái thanh trượt bằng script.
📌 Một lượt khác báo `false` vì **dự án chưa có toạ độ** ⇒ Nắng thật không tính được nên không đổi.
Đó là **hành vi ĐÚNG** (thiếu dữ kiện thì không bịa nắng), không phải hỏng.
⚠️ Đã có ba lượt ra `0 === 0` và một lượt ra "chỉ nắng cũ" trên mảng RỖNG — **đều bị loại, không
ghi PASS**. Đạt-rỗng-tuếch không phải đạt.

## §6 · DÂY SITE → VITALS — **PASS**

`lib/site/vitals-site.ts` (thuần) + `POST /api/projects/[id]/site/tinh-lai` + `HoSoDiaDiem.daCu`.

⭐ **VITALS ĐỌC TRẠNG THÁI MIỀN, KHÔNG PHẢI STATE GIAO DIỆN**: đầu vào duy nhất là `daCu` đã ghi
xuống hồ sơ ⇒ đóng app mở lại, việc "nắng cần tính lại" vẫn còn. Không tín hiệu demo, không cờ
gõ cứng. Không có `daCu` ⇒ **im tuyệt đối** (hồ sơ chưa khai KHÔNG phải một cảnh báo).

🔴 **SỬA MỘT LỖ THẬT LỘ RA KHI CHẠY DÂY**: `suThatCu()` chỉ soi kho `suThat` đã cache, nên hồ sơ
chưa cache số nào thì đổi hướng ra "không có gì cũ" — trong khi **KẾT LUẬN** *"mặt đứng hứng nắng
chiều"* vừa mới sai. Thêm `caiGiCu()` soi CẢ `suThat` LẪN `ketLuan`. Ngược lại vẫn giữ đúng chừng
mực: **chưa suy ra gì thì không có gì để cũ** ⇒ dự án mới tinh đổi hướng KHÔNG bị nhắc vô cớ.

**Chạy trên app thật** (hướng 270° → 40°, hồ sơ có 2 kết luận: nắng + văn hoá):
```
1 đổi hướng      → thayDoi = huong-mat-dung
2 daCu           = ["nang.ketluan:k-nang"]
3 ⭐ chỉ NẮNG cũ, VĂN HOÁ nguyên vẹn      ĐÚNG
4 phiên MỚI vẫn thấy daCu                 bền vững
5 tính lại "nang" → daCu = []             Vitals TẮT
6 kết luận vẫn còn đủ 2                   KHÔNG bị xoá
```
⭐ **Tính lại CÓ CHỌN LỌC**: bảo tính lại nắng thì bằng chứng văn hoá đang cũ vì lý do khác **vẫn
cũ**. Không "dọn hết cho gọn".
⚖️ **Vitals ≠ Activity** (§E): Vitals chỉ giữ dòng CÒN CẦN XỬ, xử xong là biến mất — có test riêng.

## CỔNG KHÔNG HỒI QUY
`tsc` **exit 0** · `npm test` **exit 0** ·
`site` 35 · `canh-gac` 43 · `quyen` 15 · `vat-ly` 102 · `vitals-site` 16 = **211 khẳng định**
⚠️ Khai thật: có **MỘT lượt** `npm test` ra exit=1 rồi hai lượt sau exit=0; quét từng tệp test
KHÔNG thấy tệp nào đỏ. Nghi do script e2e của chính tôi đang ghi `uploads/site/*.json` đúng lúc
suite chạy song song. **Chưa chứng minh được**, ghi lại thay vì bỏ qua.

## CÒN LẠI (không chặn kiến trúc)
· Mức Peek/Detail của Vitals mới có LÕI + API; **chưa cắm vào `vitals-tin-hieu.ts`** để hiện trên
  khẩu độ — đó là việc nối mặt tiền, dây miền đã chạy.
· 403 đúng nghĩa (thành viên hạng thấp) vẫn chưa quan sát được — cần ghi DB.
· §7: theme tối · trình đọc màn hình · khổ màn khác.

---

# ĐÓNG VÒNG VITALS (22/08) — HAI LỖI GIAO DIỆN THẬT, KHÔNG PHẢI "HẠN CHẾ CỦA MÁY"

🔴 **BÀI HỌC LỚN NHẤT ĐỢT NÀY**: lượt trước tôi kết luận *"Peek không mở dưới automation"* và định
để đó. **SAI.** Bắt xem nó như MỘT LỖI THẬT thì lần ra **hai lỗi giao diện đang sống**, cả hai đều
đánh vào người dùng thật, không riêng máy.

## LỖI ① — BẤM CHUỘT LÊN VITALS LÀ MỞ RỒI ĐÓNG NGAY
Lần theo **vết sự kiện** (không đoán, không chụp màn):
```
pointerenter → state→peek     (hover mở, CHƯA ghim)
focus:peek                     → onFocus gọi moPeek(TRUE) ⇒ GHIM
click:peek                     → `ghim && muc==='peek'` ⇒ dong() ⇒ ĐÓNG
state→attention
```
`focus` luôn đi TRƯỚC `click`, nên nó **ghim hộ**, biến cú bấm đầu tiên thành cú bấm-lần-hai.
⇒ **Mọi cú bấm chuột lên khẩu độ đều không ra gì.** Bấm là cách tự nhiên nhất, và nó là cách
DUY NHẤT hỏng — bàn phím (Enter) vẫn chạy, nên lỗi này sống sót mọi vòng kiểm trước.
**Sửa**: `onFocus` chỉ MỞ, không ghim (`moPeek(false)`). GHIM để dành cho hành động chủ động
(bấm chuột · Enter/Space). Bàn phím vẫn mở ngay khi focus — không giấu sau hover (luật §8).

## LỖI ② — `ghim` ĐỌC QUA CLOSURE CŨ
`roiVung` đọc `ghim` từ closure của lần render hiện tại; `setGhim(true)` bất đồng bộ ⇒ con trỏ rời
nút trước khi React commit thì closure vẫn thấy `false` ⇒ hẹn thu ⇒ **tấm vừa mở đã đóng**.
**Sửa**: gương `ghimRef` cập nhật ĐỒNG BỘ; `roiVung` đọc ref.

## §2 · TRẠNG THÁI ĐỌC ĐƯỢC — `data-vitals-state`
`calm | attention | peek | engage` trên chính nút. **Không phải UI chỉ-để-test**: đây là chỗ DUY
NHẤT nói khẩu độ đang ở đâu, dùng cho trợ năng + gỡ lỗi. Trước đó trạng thái chỉ nằm trong closure
React — đó chính là lý do một lỗi *mở-rồi-đóng-ngay* sống được mà không ai thấy.

## NGHIỆM THU A–J TRÊN APP THẬT
```
A khoẻ mạnh   state=calm       daCu=[]
B/C đổi hướng state=attention  daCu=["nang.ketluan:k-nang"]
D bấm         state=peek                       (mở thật)
E vào tấm     state=peek                       (KHÔNG đóng)
F chi tiết    CÁI GÌ·VÌ SAO·NGUỒN·ẢNH HƯỞNG ✓  + [Mở phân tích nắng] [Tính lại]
G deep-link   từ /render → /overview#ngu-canh-dia-diem · khối TỒN TẠI · TRONG TẦM NHÌN
              nội dung thật: "Quận 1, TP.HCM · 10.7769, 106.7009 · BÌNH MINH 05:47 · NẮNG TRƯA 89°"
I tính lại    daCu=[]
J Edge        state=calm · kết luận giữ nguyên 2 ✓
```
Ảnh: `V-A-calm.png` · `V-C-edge.png` · `V-DEF-peek-detail.png` · `V-G-deeplink-nang.png` · `V-J-calm-lai.png`

## BÀN PHÍM (§4)
`Enter` trên khẩu độ → `data-vitals-state=peek`, `aria-expanded=true`, dialog mount. `Esc` đóng.
⇒ Truy cập KHÔNG phụ thuộc hover.

## §10 · ỔN ĐỊNH CỔNG
3 lượt liên tiếp: `exit=0 · ok=9211 · fail=0` (cả ba giống hệt) · `tsc exit=0`.
⚠️ **CÓ ĐIỀU KIỆN**: lượt đỏ im lặng trong lịch sử **vẫn CHƯA có gốc**. Đã bác giả thuyết
`uploads/site` (không test nào chạm `uploads/`), đã sửa một va chạm tệp tạm THẬT
(`pptx-zip-fonts` dùng tên cố định trong tmpdir) — nhưng không dám gọi là "đã sửa".
