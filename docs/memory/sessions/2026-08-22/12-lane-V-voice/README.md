# LANE V — GIỌNG NÓI LÀ ĐẦU VÀO HẠNG NHẤT (22/08)

**LANE V: PASS**

---

## ⓪b HẠ TẦNG — đã kiểm

`git log --oneline -1` = `c7f3ac8` (đúng như phiếu khai). Không chạy `checkout/reset/stash/commit/push`.
Không khởi động dev server mới. Toàn bộ việc nằm trong vùng ghi được cấp:
`lib/voice/**` (mới) · `components/voice/**` (mới) · thư mục báo cáo này.
**KHÔNG thêm dòng nào vào `lib/commands/registry.ts`** (được phép nhưng không cần — lý do ở mục A).

## ⓪ [Đ2] NHÌN VÀO TRONG TRƯỚC — tiền đề của phiếu: **ĐÚNG cả bốn**

| Phiếu khai | Đo lại tại nguồn | Kết |
|---|---|---|
| `grep SpeechRecognition\|webkitSpeech` = 0 | 0 kết quả trong `lib` `components` `app` | ✅ chưa có nhận dạng giọng nói |
| `lib/commands/registry.ts` là sổ lệnh chung | 55 `CommandDef` · `allAliases()` 97 · `cmdsFor(ctx)`/`findByAlias(raw,ctx)` | ✅ |
| Command Palette là mặt tiền ⌘K | `AppCommandPalette.tsx:153-157` dựng `WhenCtx` thật | ✅ |
| `lib/i18n.ts` `useT(vi,en)` · `lib/review/` | có cả hai | ✅ |

**Đo thêm, phiếu không nói mà hoá ra quan trọng:** IF **chưa có kho ghi chú neo tới ĐỐI TƯỢNG**.
Kho ghi chú duy nhất đang chạy là `lib/home/notes-store.ts` (`HomeNote`), và nó **chỉ neo tới DỰ ÁN**
(`projectId: string | null`). Neo tới `entityId` vẫn là entry `comment-neo-doi-tuong` đang chờ trong sổ
frontier. Việc này quyết định hình dạng ngữ cảnh C — xem mục C.

---

## HỢP ĐỒNG DÙNG CHUNG

**Đường dẫn:** `lib/voice/types.ts` → `DauVaoNguNghia`.

```ts
DauVaoNguNghia = {
  nguon:  'giong-noi' | 'chu-go' | 'but' | 'cham' | 'anh' | 'pdf'
  yDinh:  YDinh            // union phân biệt theo nguCanh (5 nhánh)
  banChu: BanChu           // { van, doTinCay?, ngonNgu, tamThoi }
  doiSuThat: boolean       // do canXacNhan() TÍNH, không nhận từ nơi gọi
}
```

Đường đi, đúng thứ tự phiếu yêu cầu:

```
tiếng nói ─► BanChu ─► giaiBanChu() ─► DauVaoNguNghia ─► thiHanh() ─► hệ thống mà CHỮ GÕ đang dùng
            nhan-dang    giai-y-dinh                      thi-hanh
```

Bảy tệp: `types` · `chuan-hoa` · `giai-y-dinh` · `rui-ro` · `thi-hanh` · `sang-ghi-chu` · `nhan-dang`
(+2 tệp test). Mặt tiền: `components/voice/CuaGiongNoi.tsx` + `giong-noi-css.ts`.

**Hai luật cấm được khoá bằng KIỂU DỮ LIỆU, không bằng lời dặn:**
- *Cấm đẻ kho riêng*: `DauVaoNguNghia` không mang kho, không mang hàm ghi. `thi-hanh.ts` không giữ
  state nào — nơi ghi là `CuaNhan` do **host** truyền vào. Test `[C] ghi chú đi tới ĐÚNG cửa host khai`.
- *Cấm app trợ lý riêng*: không có phiên hội thoại, không lịch sử chat, không kho câu lệnh.

**Bằng chứng "giọng nói ngang hàng chữ gõ", không phải lời hứa:** test
`⭐ chữ GÕ và GIỌNG NÓI ra cùng một hợp đồng, khác đúng một chữ nguon` — cùng một câu đi qua
`giaiBanChu(..., 'chu-go')` và `giaiBanChu(..., 'giong-noi')` cho ra `yDinh` **deepStrictEqual** và
`doiSuThat` bằng nhau. Trong toàn bộ `lib/voice` **không có một nhánh `if (nguon === 'giong-noi')` nào**.

---

## NGỮ CẢNH LÀM ĐƯỢC

| | Ngữ cảnh | Trạng thái | Ghi chú |
|---|---|---|---|
| **A** | LỆNH | ✅ **TRỌN, chạy thật** | giải qua sổ lệnh chung; `cmd.run()` gọi thật vào `useCadStore` |
| **B** | Ý ĐỊNH THIẾT KẾ | 🟡 **cửa xác nhận TRỌN, đường ghi CHƯA nối** | nhận diện + phiếu xem trước + chặn + hoàn tác: thật. Nhưng `CuaNhan.yDinhThietKe` hiện do host cấp; **chưa nối vào đường ghi thật của `useCadStore`** — nối là việc chạm `components/cad/**`, ngoài vùng ghi. Khai thẳng: đây là phần **CẮT**. |
| **C** | GHI CHÚ | ✅ **TRỌN** | neo đúng vật đang chọn, hạ xuống kho `HomeNote` **sẵn có** |
| **D** | SOÁT DUYỆT | 🟡 nhận diện + đưa tới cửa: thật. **Chưa cắm vào `lib/review`** — cắm phải sửa đường checklist ngoài vùng ghi. **CẮT** phần cắm. |
| **E** | TÌM KIẾM | 🟡 nhận diện + tách kho (`thu-vien`/`gallery`/`du-an`): thật. **Chưa nối mặt tìm kiếm** — **CẮT** phần nối. |

Đúng chỉ dẫn phiếu ("quá tải thì làm TRỌN A + C"): **A và C trọn**, ba cái còn lại làm phần
nhận-diện + hợp-đồng và **khai thẳng phần cắt** thay vì vẽ suông.

---

## TÁI DÙNG SỔ LỆNH — bằng chứng

1. `lib/voice/giai-y-dinh.ts` **không chứa một bảng ánh xạ lời-nói → hành-động nào**. Nó gọi
   `cmdsFor(ctx)` rồi so lời nói với `aliases` và `label` **có sẵn trong sổ**.
2. ⭐ **Bằng chứng mạnh nhất là thứ KHÔNG chạy được**: ba câu phiếu nêu làm ví dụ — *"mở vật liệu"*,
   *"mở Vitals"*, *"quay lại bản vẽ"* — **đều trả `khong-co-trong-so-lenh`**. Sổ lệnh hôm nay chỉ có
   **lệnh CAD**, chưa có lệnh điều hướng nào. Nếu lane này có bảng riêng thì ba câu đó đã chạy được.
   Muốn chúng chạy thì phải **thêm vào SỔ** — một chỗ, sáu mặt tiền cùng được.
   (Test: `[A] ⭐ lệnh KHÔNG có trong sổ thì nói cũng không chạy`.)
3. **Cổng `when` của sổ vẫn thắng**: nói "offset" ở chế độ Sơ phác (`proToolsAllowed: false`) → không
   khớp. Thoại **không đi vòng** qua cổng chế độ. (Test `[A] ⭐ cổng when của sổ lệnh vẫn thắng`.)
4. Chạy thật trong trình duyệt: bơm *"đo khoảng cách"* → `Đã chạy: Đo khoảng cách`, `cmd.run()` gọi
   `useCadStore.setTool('measure')` thật (ảnh `VO2`).
5. Hoà điểm thì **không chọn bừa**: nói "kích thước" khớp 5 nhãn dim → báo mập mờ, hỏi lại.

---

## CHẶN ĐỔI SỰ THẬT LẶNG LẼ — cơ chế + test

**Cơ chế ba tầng, tầng nào cũng fail-closed:**

1. `rui-ro.ts` — **mặc định MỌI ý định phải xác nhận**; chỉ 4 lệnh trong `LENH_CHAY_THANG` được chạy
   thẳng (`select` · `zoomextents` · `polar` · `measure`). Chọn "danh sách an toàn" chứ **không** chọn
   "danh sách nguy hiểm": danh sách nguy hiểm phải đuổi theo sổ lệnh, quên khai một lệnh mới là nó
   chạy thẳng và im lặng — đúng thứ luật cấm. Kiểu này thì quên khai chỉ tốn thêm một cú bấm.
   · `undo`/`redo`/`delete` **cố ý KHÔNG** nằm trong danh sách an toàn dù nghe vô hại.
   · Ý định thiết kế → **luôn** phải xác nhận, không ngoại lệ nào theo `doTinCay`.
2. `thi-hanh.ts` — cửa chặn cuối: `doiSuThat && !daXacNhan` ⇒ trả `can-xac-nhan`, **không gọi cửa host**.
3. Mặt tiền — dựng **phiếu xem trước** bày đúng con số sắp đổi (nghe được gì · thuộc tính · giá trị
   mới · gắn vào vật nào), Huỷ đứng **trước** Đồng ý, kèm dòng "vẫn hoàn tác được bằng ⌘Z".

**Test khoá:**
- `⭐ FAIL-CLOSED: mọi lệnh trong sổ, trừ danh sách an toàn, đều phải xác nhận` — lặp qua **cả 55 lệnh**.
  Thêm lệnh mới vào sổ mà quên phân loại ⇒ nó tự rơi vào nhánh phải-xác-nhận, test vẫn xanh, hành vi vẫn an toàn.
- `⭐ thiHanh() TỪ CHỐI chạy khi chưa xác nhận` — đếm số lần cửa host bị gọi: **0** trước khi xác nhận, **1** sau.
- `danh sách an toàn không có id ma` — mọi id đối chiếu với `COMMANDS` thật.
- `bản chữ TẠM không bao giờ giải ra ý định`.

**Chạy thật trong trình duyệt** (không phải test đơn vị): bơm *"tường này dày 120"* →
`window.__daDoi` = **`KHÔNG ĐỔI GÌ`**, phiếu hiện lên; bấm Đồng ý → mới đổi. Ảnh `VO4`.

---

## TIẾNG VIỆT — bằng chứng

- Engine đặt `lang = 'vi-VN'` mặc định (`nhan-dang.ts`), `ngonNgu: 'vi'` ở mặt tiền.
- Mọi tiền tố ngữ cảnh là tiếng Việt: *ghi chú · ghi lại · ghim · soát lại · tìm · tra cứu*.
- **Bỏ dấu chỉ để SO KHỚP, nội dung lưu giữ NGUYÊN VĂN có dấu** (luật chữ Việt 7.1.23). Test:
  nói *"ghi chú chỗ này cần kiểm lại cao độ"* → lưu đúng chuỗi có dấu `chỗ này cần kiểm lại cao độ`.
- Câu lệch dấu vẫn khớp: *"do khoang cach"* → `cad.dim.measure`.
- Mọi chuỗi giao diện đi qua `useT(vi, en)`.

🔴 **Bẫy tiếng Việt bắt được lúc chạy thử, đáng ghi lại**: bỏ dấu xong thì **"đối tượng" chứa đúng
chữ "tuong"**. Bản đầu chấm điểm bằng kiểu *"nhãn có chứa cụm ở bất kỳ đâu"* ⇒ câu **"vẽ tường"**
khớp cả `cad.edit.divide` (nhãn có "đối tượng") — hai lệnh chẳng liên quan gì nhau, và máy im lặng
báo mập mờ. Tiếng Việt tách theo **âm tiết** nên "ranh giới từ" không cứu được.
⇒ Đổi sang so với **TÊN CHÍNH** của nhãn (bỏ phần trong ngoặc và phần sau gạch dài) và chỉ khớp
**từ đầu tên**. Ghi thành chú thích tại chỗ ở `giai-y-dinh.ts` để không ai "nới cho dễ khớp".

---

## NGHIỆM THU

| Máy | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| `npm test; echo $?` | **`NPM_TEST_EXIT=0`** (đo bằng MÃ THOÁT, không `grep FAIL`) |
| Test mới | `giai-y-dinh.test.ts` **20 ca** · `nhan-dang.test.ts` **6 ca** — 26 ca, 0 fail |
| Lỗi console trình duyệt | **0** |

⚠️ **Một lần `npm test` giữa chừng trả `EXIT=2`** vì `components/render-studio/ToolWindow.tsx` (lane
khác, ngoài vùng ghi của tôi) đang sửa dở. Đo lại 3 phút sau: `tsc` sạch, `npm test` = 0. Ghi lại vì
đây là ca thật của `claim-keys-va-cham` — ba lane cùng cây, mã thoát của `npm test` là **tài sản chung**,
không phải chỉ số riêng của lane nào.

### Ảnh — `artifacts/visual-review/`

| Tệp | Nội dung |
|---|---|
| `VO1-dang-nghe.png` | đang nghe: chấm đập + viền accent + **nhãn chữ** "Đang nghe — bấm để dừng"; bản chữ TẠM in nghiêng, nhạt |
| `VO2-lenh-chay.png` | *"đo khoảng cách"* → `Đã chạy: Đo khoảng cách` (chạy thật qua sổ lệnh) |
| `VO3-ghi-chu-neo.png` | ghi chú vào kho host, **neo: dự án `du-an-thao-dien` · vật `ent-tuong-07`** |
| `VO4-phieu-xac-nhan.png` | phiếu xem trước cho *"tường này dày 120"* — chưa bấm thì chưa đổi gì |
| `VO5-theme-sang.png` | cùng cửa đó ở theme SÁNG (luật nghiệm thu 2 theme) |

**Cách chụp — khai thẳng, đây là chỗ dễ nói dối nhất:**
Chromium headless **không có micro thật**, nên **KHÔNG có câu nào được nói vào micro**. Tôi bơm
`BanChu` giả vào **đúng cửa `bản chữ → ngữ nghĩa`** (`window.__nap`, đường `onSanSang` của component)
rồi để nó chạy hết đường thật: sổ lệnh thật · `cmd.run()` thật · cửa chặn thật · cửa host thật.
Tầng duy nhất bị thay là tầng **nghe**, và đó chính là tầng được tách ra để nghiệm thu được như vậy.

Bàn thử: component **thật** (`CuaGiongNoi.tsx`) + **113 mô-đun thật** của repo (gồm
`lib/commands/registry`, `lib/cad/store`) gói bằng `sucrase` chạy trên React UMD 18.3.1 trong
Chromium thật, dùng `app/globals.css` thật. **Không mô phỏng lại một dòng logic nào.**
Bàn thử nằm trong scratchpad, **không** thêm tệp nào vào repo — vì vùng ghi của lane không cho tạo
route/trang, nên chưa mount được vào app thật (xem "CHƯA CHẮC").

---

## ⭐ BA LỖI MẮT BẮT ĐƯỢC MÀ MÁY KHÔNG BẮT

Cả ba đều qua `tsc` 0 và `npm test` 0, chỉ lộ ra khi **mở ảnh chụp ra nhìn**:

1. **Vòng chạy quay quanh nút thành vệt chéo cắt ngang cả thẻ.** Nút là **capsule rộng**; xoay một
   capsule quanh tâm thì nó quét ra một vệt dài. Vòng chạy chỉ đúng với hình **TRÒN**.
   ⇒ Đổi tín hiệu động sang **chấm tròn nở/thu**, nút chỉ đổi màu viền. (Chú thích khoá tại chỗ ở CSS.)
2. **Phiếu xác nhận hiện `Thuộc tính: day`** — khoá dữ liệu lọt ra giao diện, phạm SPEC-NGON-NGU-CHI-DAN.
   ⇒ Thêm `nhanThuocTinh()` (khoá → chữ cho người, vi/en); mặt tiền cấm in thẳng `y.truong`.
3. **`Đã làm: y-dinh-thiet-ke`** — cùng bệnh, ở chỗ khác. ⇒ Câu báo lấy **nhãn từ sổ lệnh**
   (`Đã chạy: Đo khoảng cách`) hoặc câu tiếng người theo ngữ cảnh.

Bài học lặp lại đúng bài học 16/08: *"có trong mã" không bằng "tới được người dùng"*. Hai trong ba
lỗi là **chữ nghề rò ra giao diện** — không máy soi nào hiện có bắt được loại này.

---

## CHƯA CHẮC / CHƯA KIỂM

- 🔴 **CHƯA NÓI VÀO MICRO THẬT MỘT LẦN NÀO.** Toàn bộ nghiệm thu là **bơm bản chữ**. Nghĩa là:
  `taoMayNghe()` — phần cắm vào Web Speech API thật, gán `onresult/onerror/onend`, đọc
  `results[i][0].transcript` — **chưa chạy với engine thật lần nào**. Test của nó dùng engine giả do
  chính test dựng. **Đây là rủi ro lớn nhất còn lại của lane này.** Hoà mở `https` (hoặc localhost)
  trên Chrome/Safari, bấm nút, nói một câu tiếng Việt là biết ngay.
- 🔴 **Chất lượng nhận dạng tiếng Việt: KHÔNG có số nào.** Không biết Web Speech API nghe "tường",
  "offset", "chamfer" ra chữ gì trong thực tế. Bộ bỏ-dấu + khớp-tên-chính là **phòng xa**, chưa phải
  bằng chứng. Con số thật chỉ có sau khi có người nói thật.
- **Chưa mount vào app thật** — vùng ghi không cho tạo route/trang. `CuaGiongNoi` chưa xuất hiện ở màn
  nào. Việc kế: chọn nơi neo (theo chốt 16/08, Vitals neo theo ngữ cảnh — giọng nói nên đi cùng chỗ đó,
  **không** đẻ nút micro thứ hai).
- **Ngữ cảnh B chưa nối đường ghi thật.** Cửa chặn đã đúng, nhưng cái được chặn hiện là một callback
  của host, chưa phải `useCadStore`. Khi nối thật phải kiểm lại **hoàn tác** trên Doc thật.
- **Chưa thử trình đọc màn hình thật** (VoiceOver/NVDA). `aria-live` · `aria-pressed` ·
  `aria-describedby` là đọc mã, không phải nghe thật.
- **Chỉ đo Chromium.** Safari/Firefox là suy. Đáng lo riêng cho Safari: nó dùng
  `webkitSpeechRecognition` và hành vi `interimResults` khác.
- **Danh sách `THUOC_TINH` mới có 4 từ** (dày/cao/rộng/dài) — cố ý ngắn, nhưng **chưa hỏi người dùng
  thật** xem KTS nói những gì. Mỗi từ thêm vào là một cửa cho câu nói chạm vào sự thật dự án, nên
  không nới bằng suy đoán.
- **`--vien-mo` / `--mo-vo-hieu` / `--r-full`**: dùng theo tên token đã có trong repo, có `fallback`
  đầy đủ, nhưng **chưa đo tương phản** trên nền thật của từng màn — mới nhìn bằng mắt ở hai theme.
- `soi:frontier` / `soi:hinh-hoc` / `soi:tu-dien` **chưa chạy riêng cho lane này** (chúng là tài sản
  chung, ba lane đang chạy song song nên số đo sẽ lẫn). `npm test` = 0 đã bao gồm `check:chot`.
- **Chưa mở entry frontier** cho việc này — mở entry là chạm sổ chung, ngoài vùng ghi. Tên đề xuất:
  `giong-noi-dau-vao-hang-nhat`.
