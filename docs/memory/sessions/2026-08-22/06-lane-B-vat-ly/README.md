# LANE B · TRÍ TUỆ VẬT LÝ ĐỊA ĐIỂM — Pha 2 (22/08)

> Tầng miền Pha 1 của MAIN đã kiểm và **XÁC NHẬN ĐÚNG** cả 4 tiền đề: `types.ts` (`HoSoDiaDiem`,
> `SuThat<T>`, `NguonGoc`, `ProvenanceFlag` tái dùng `measured|inferred|verified`, `KetLuanSuyRa`,
> `DeXuatThietKe`, `PhamViDiaLy`) · `solar.ts` (`trangThaiNang`/`binhMinhHoangHon`/`muiGioGio`, gọi
> `lib/three/lighting.ts#sunFromDateTime`) · `anh-huong.ts` (`PHU_THUOC`/`soHoSo`/`suThatCu`) ·
> `store.ts` + route API. Không bác tiền đề nào. Không đụng tệp nào ngoài vùng ghi được giao.

## TỆP TẠO

| Tệp | Vai trò |
|---|---|
| `lib/site/khi-hau.ts` | **KHÍ HẬU** (§10) — cấu trúc `HoSoKhiHau` 12 tháng, hàm suy dẫn thuần (tháng nóng/lạnh nhất, biên độ nhiệt, mùa mưa/khô, tổng mưa, giờ nắng, bức xạ), đường cắm nguồn `dangKyNguonKhiHau()`, đổ ra sự thật khoá `khi-hau.*`. Kèm **máy chặn thời tiết** `viPhamThoiTiet()`. |
| `lib/site/gio.ts` | **GIÓ THỊNH HÀNH** (§12) — `GioThinhHanh` (hướng theo tháng, tốc độ, khoảng tốc độ), `muaGio()`, `gocGioToiMatDungDeg()`, đường cắm nguồn, sự thật khoá `gio.*`. Kèm **máy chặn nói quá** `viPhamCFD()` + nhãn bắt buộc `NHAN_GIO`. |
| `lib/site/dia-ly.ts` | **ĐỊA LÝ** (§9) — `DacDiemDiaLy` (ven biển/ven sông/đồi núi/đảo/mật độ đô thị/nguy cơ ngập) toàn bộ là `SuThat` chứ không phải giá trị trần. Hai đường tách bạch: **đo được** (`venBienTuKhoangCach`, `nguyCoNgapTuCaoDo`) và **gợi ý từ tên** (`goYTuTenDiaDanh`, vĩnh viễn `inferred`). |
| `lib/site/suy-luan.ts` | **FACT → INSIGHT → PROPOSAL** (§3·§4·§22) — `hangDanXuat` (mắt xích yếu nhất), `suThatTuHoSo`/`suThatNang`/`gopSuThat`, 3 luật tất định, `taoKetLuan`/`ketLuanTruyDuoc`, `taoDeXuat` (không có tham số `trangThai`), `deXuatTuKetLuan`. |
| `lib/site/vat-ly.test.ts` | 80 kiểm, 11 nhóm. |

## LUẬT ĐÃ KHOÁ BẰNG TEST

1. **Thiếu nguồn thì RỖNG THẬT** — `traKhiHau`/`traGio` trả `null` khi chưa cắm nguồn (kể cả khi đã
   có toạ độ); hồ sơ khí hậu rỗng → mọi hàm trả `null`, `suThatKhiHau` sinh **0 khoá**; không có
   mức ngập tham chiếu → `nguyCoNgapTuCaoDo` trả `null`, không có đường vòng.
2. **KHÍ HẬU ≠ THỜI TIẾT** — `viPhamThoiTiet()` bắt `nhietDoHienTai` / `duBao7Ngay` / `lamMoiLuc`…
3. **§14 thang địa lý** — nguồn khai `cong-truong`/`lan-can` bị `traKhiHau`/`traGio` **loại thẳng**,
   không hạ hạng (nhận vào là hợp thức hoá một tuyên bố sai độ phân giải).
4. **Gió KHÔNG tự nhận là CFD** — `laCFD() === false`; `viPhamCFD()` bắt *"luồng khí qua phòng ngủ
   đạt 0,4 m/s"*, *"mô phỏng dòng chảy"*, *"CFD"*; `nhanGio()` luôn mang nhãn `gió thịnh hành của
   vùng` + thang địa lý; **toàn bộ kết luận/đề xuất sinh ra trong test đều sạch nói-quá**.
5. **Tên địa danh mãi mãi chỉ là GỢI Ý** — `goYTuTenDiaDanh` luôn `inferred` + `ghiChu` nêu đúng chữ
   đã khớp; `chiLaGoY()` canh; ca bẫy **"Hải Dương"** có trong test; đường DUY NHẤT lên `verified`
   là đo + có `NguonGoc`; `suThatDiaLy` giữ nguyên hạng, không nâng lén.
6. **Kết luận rỗng `tuSuThat` bị chặn** — `ketLuanHopLe` từ chối; `taoKetLuan` trả `null`;
   `ketLuanTruyDuoc` đòi mọi khoá **thực sự có mặt** trong tập sự thật; hồ sơ rỗng → 0 kết luận;
   **mọi luật chạy trên tập rỗng đều trả `null`**.
7. **Đề xuất KHÔNG có đường nào tự `da-nhan`** — `taoDeXuat` không có tham số `trangThai`; mọi đề
   xuất ra đời `cho-duyet`, `quyetDinh === undefined`; `deXuatDuocDuyet()` vẫn rỗng cho tới khi
   `apQuyetDinh()` có tên một con người.
8. **Mắt xích yếu nhất** — `hangDanXuat(['verified','inferred']) === 'inferred'`; sự thật nắng
   tính từ toạ độ chưa xác nhận thì bản thân nó `inferred`, dù công thức tất định.
9. **Hai ca kinh điển chạy được** — mặt đứng Tây TP.HCM 21/8 → kết luận chói/hấp thụ nhiệt (và mặt
   đứng Đông cùng ngày thì **không** bắn); độ ẩm 80% + ven biển → kết luận ăn mòn/ẩm mốc (và ẩm 60%
   thì im, chỉ-ven-biển-không-có-ẩm cũng im).

## DỮ LIỆU THẬT vs KHUNG CHỜ CẮM

**CHẠY THẬT NGAY, không cần cắm gì:**
- Toàn bộ nhóm sự thật **`nang.*`** — hình học mặt trời không phải số liệu đi xin, nó tính ra từ vĩ
  độ/kinh độ/ngày qua `solar.ts` (NOAA). Đây là lý do ca kinh điển 1 chạy được trên app thật.
- Mọi **hàm suy dẫn thuần** của khí hậu/gió/địa lý — chúng chạy đúng trên bất kỳ dữ liệu nào ĐƯỢC
  ĐƯA VÀO; chỉ là hiện chưa có ai đưa vào.
- **Đường đo được** của địa lý: `venBienTuKhoangCach`, `nguyCoNgapTuCaoDo` — chạy ngay khi có số đo.
- Mọi **máy canh**: `viPhamThoiTiet`, `viPhamCFD`, `chiLaGoY`, `ketLuanTruyDuoc`, `hangDanXuat`.

**KHUNG CHỜ CẮM — RỖNG CỐ Ý, chưa có một con số khí hậu nào trong repo:**
- `KHO_NGUON` của `khi-hau.ts` và `gio.ts` đều **rỗng**. Không nhúng bảng khí hậu VN, không nhúng
  hoa gió, không nhúng bức xạ. **Không bịa một số nào.** Một bảng "nhiệt độ trung bình Hà Nội" gõ
  theo trí nhớ trông rất hợp lý và không ai phát hiện được — nhưng nó đẻ ra kết luận sai rồi đẻ
  tiếp đề xuất sai. Cắm nguồn thật qua `dangKyNguonKhiHau()` / `dangKyNguonGio()` là xong.
- Hệ quả thẳng thắn: **ca kinh điển 2 (ẩm + ven biển) hiện KHÔNG chạy trên app thật** — nó chỉ chạy
  trong test với fixture. Luật im cho tới khi có nguồn ẩm thật. Đó là hành vi đúng, không phải lỗi.

**BA NGƯỠNG LÀ QUY ƯỚC LÀM VIỆC, KHÔNG PHẢI CHUẨN** (khai thẳng, đều là tham số đổi được, và kết quả
luôn ghi lại ngưỡng đã dùng): `NGUONG_THANG_MUA_MM = 100` · `NGUONG_VEN_BIEN_M = 3000` · `NGUONG`
trong `suy-luan.ts` (góc trực diện 45° · cao độ còn gắt 5° · ẩm cao 75% · gió thuận 60°).
Bảng mảnh chữ `MAU_TEN` là **suy đoán ngôn ngữ**, đã khai rõ và bị khoá ở hạng `inferred`.

---

## 🔴 BLOCKER GỬI MAIN — một dòng trong `solar.ts` (ngoài vùng ghi của Lane B)

`lib/site/solar.ts:13` dùng **value import qua alias**:

```ts
import { sunFromDateTime } from '@/lib/three/lighting';
```

Bộ chạy test của repo (`sucrase-node`, xem `package.json` → `test`) **không phân giải alias `@/`**.
⇒ mọi tệp test chạm `solar.ts` đều `MODULE_NOT_FOUND` ngay lúc require.

**Đo trên toàn bộ suite** (quét đủ mọi `*.test.ts` theo đúng bộ lọc của `npm test`): chỉ đúng **2**
tệp đỏ, và cả hai cùng một gốc bệnh:

```
DO: ./lib/site/site.test.ts     ← Pha 1 của MAIN, ĐÃ ĐỎ TRƯỚC KHI LANE B BẮT ĐẦU
DO: ./lib/site/vat-ly.test.ts   ← Lane B
```

`site.test.ts` không import tệp nào của Lane B — nó đỏ sẵn, không phải do đợt này.

**Vì sao `types.ts:27` cũng dùng `@/` mà không sao:** nó là `import type`, sucrase **xoá hẳn** lúc
biên dịch nên không sinh `require`. Chỉ **value import** qua `@/` mới gãy. Đây là chỗ dễ hiểu nhầm
thành "alias dùng được ở lib/" (82 tệp trong `lib/` đang dùng `@/`, nhưng không tệp test nào chạm tới).

**Bản vá đúng một dòng** — `lib/three/lighting.ts` bản thân nó dùng import tương đối (`../cad/model`,
`./cad-to-obj`), nên đây là đưa `solar.ts` về đúng quy ước của chính khối `lib/three`:

```ts
import { sunFromDateTime } from '../three/lighting';
```

(Đã xác minh đường dẫn phân giải đúng: `lib/site/../three/lighting` → `lib/three/lighting.ts`.)
Vá xong là **cả hai** tệp test xanh, không phải sửa gì thêm.

**Lane B đã tự kiểm chứng bằng cách nào:** chạy `vat-ly.test.ts` qua một shim phân giải alias đặt ở
thư mục scratchpad (không ghi vào repo, không đụng `solar.ts`) → **80/80 kiểm ĐẠT**. Tức phần lõi
đúng; cái đỏ duy nhất là đường require, không phải nghiệp vụ.

---

## NGHIỆM THU

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (0 dòng ra) |
| `vat-ly.test.ts` (qua shim alias) | **80/80 ĐẠT, 0 fail** |
| Quét toàn suite | 2 tệp đỏ, **cả hai do blocker `@/` ở `solar.ts`**; `site.test.ts` đỏ sẵn từ trước |
| Vùng ghi | Chỉ 4 tệp `lib/site/{khi-hau,gio,dia-ly,suy-luan}.ts` + 1 test + báo cáo này |

## CHƯA CHẮC / CHƯA KIỂM

1. **`npm test` chưa chạy trọn** — chỉ chạy phần quét test. Ba cổng đầu của script (`license:check`,
   `check:chot`) **chưa chạy**. Lane B không thêm gói nào nên `license:check` khó đổi, nhưng đó là
   suy đoán, không phải phép đo.
2. **Chưa chạy trên app thật, chưa mở trình duyệt.** Lane này thuần hàm, không có mặt giao diện; mọi
   kết luận là từ test + đọc mã.
3. **Ba ngưỡng quy ước chưa ai duyệt** (mưa 100mm · ven biển 3000m · ẩm cao 75%). Chúng đổi được và
   luôn tự khai, nhưng **con số mặc định là do Lane B chọn**, chưa có nguồn ngành nào chống lưng.
   Chỗ này cần Hoà hoặc một tài liệu thật chốt lại.
4. **`CACH_NOI_CAM` và `TU_CAM_THOI_TIET` là SÀN DƯỚI, không phải trần.** Chúng bắt được những cách
   nói đã nghĩ ra; một cách nói quá mới lạ vẫn lọt. Đây là bộ lọc chuỗi, không phải bộ hiểu nghĩa.
5. **`MAU_TEN` chưa được rà trên danh sách địa danh thật** — chưa đo tỷ lệ báo nhầm. Không quan
   trọng bằng ở chỗ khác vì kết quả đằng nào cũng chỉ là `inferred`, nhưng gợi ý nhiễu quá nhiều thì
   người dùng sẽ học cách bỏ qua nó.
6. **Khung giờ chiều `GIO_CHIEU = [14,15,16,17]`** cũng là quy ước, và nó lấy mẫu **theo giờ chẵn** —
   góc tới nhỏ nhất thật có thể rơi vào giữa hai mốc. Sai lệch nhỏ, nhưng có thật.
7. **Chưa nối vào `store.ts`/route API** — Pha 2 mới là tầng hàm thuần. Việc ghi sự thật khí
   hậu/gió/địa lý vào `HoSoDiaDiem.suThat` rồi lưu xuống đĩa là việc của lượt sau (và khi đó phải
   nhớ `suThatCu()` ở `anh-huong.ts` đã sẵn sàng đánh dấu cũ theo `Mien` — tiền tố khoá đã khớp).
8. **`hoSo.*` là tiền tố sự thật sinh tại chỗ**, cố ý không trùng `Mien` nào. Nếu lượt sau đem lưu
   chúng xuống đĩa thì `suThatCu()` sẽ **không** đánh dấu chúng là cũ — lúc đó phải xử lại.
