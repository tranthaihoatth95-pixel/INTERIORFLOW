# P-L · ĐÓNG KHE HỞ TÊN TOKEN GIỮA MOCK VÀ CODE + sửa tên cấn

> Phiếu `docs/phieu-giao/P-L-dong-khe-ho-token.md`. Khuôn 6 phần `docs/CLAUDE.md`.
> Bản chất: **ĐỔI TÊN, KHÔNG ĐỔI GIÁ TRỊ** — đã chứng minh bằng so byte, không bằng mắt.

---

## 1 · TỔNG QUAN

Đổi tên **1 576 chỗ / 133 tệp** để mock và code lại gọi chung một thứ tiếng, và tách một tên
đặt sai nghĩa ra khỏi họ của nó. **Không một giá trị màu nào đổi** — chứng minh bằng cách áp
đúng phép đổi tên lên bản sao lưu rồi so **từng byte**: 115/115 mock và 1 093/1 096 tệp code
trùng khít; 3 tệp lệch là 3 tệp tôi sửa **comment** bằng tay, và sha256 dãy giá trị màu của cả
ba **y hệt trước sau**.

Đích ⑥b đạt trọn ở **vòng 1**. Hai việc phải báo chứ không được tự xử: **V4 tìm ra 6 chỗ thật**
(toàn ở mocks, code sạch) và **phiên chạy song song vừa sinh một mock dùng đúng cái tên tôi vừa
khai tử**.

---

## 2 · CHI TIẾT TỪNG MỤC

### ⓪b TIỀN ĐỀ HẠ TẦNG — ✅ ĐẠT

| Đo | Kết quả |
|---|---|
| `git log --oneline -1` | `0471b54` — **khớp mốc phiếu ghi** |
| `git rev-list --count HEAD..main` | **0** |
| nhánh | `main` |

### ⓪ TIỀN ĐỀ NGHIỆP VỤ — nhận cả 4 về hướng, **3/4 lệch số**, 1 chỗ lệch nặng

| # | T ghi | Tôi đo | Phán |
|---|---|---|---|
| 1 | 622 dòng `--mat-` trong `docs/mocks/` | **622** | ✅ đúng từng dòng |
| 1b | *(phiếu ③)* “**9 tệp mock** đang có” | **115 tệp** trong `docs/mocks/` (105 cấp 1 + 10 trong `_archinote/`), trong đó **55 tệp** dính `--mat-` | 🔴 **lệch nặng nhất** |
| 1c | code `--mat-` = 0 | **0** | ✅ đúng (P-K dọn 114 dòng/43 tệp lượt trước) |
| 2 | class `.mat-*` “~**70** chỗ” | **97 chỗ** — code 65 · mocks 32 | 🔴 thiếu 27 |
| 3 | `--nen-mo-hairline` “~**80** chỗ” | **80 trong code** ✅ · nhưng tổng cả mocks là **573** (mocks 493) | 🟡 đúng phần code, thiếu phần mocks |
| 4 | `matId` khác hẳn, cấm đụng | ✅ đúng — **và còn 3 họ nữa phiếu không nêu** | 🔴 xem dưới |

🔴 **BẪY PHIẾU KHÔNG NÊU — ba họ định danh tiếng Việt sẽ chết nếu ai đó `sed 's/mat-/nen-mo-/g'`:**

| Chuỗi | Nghĩa thật | Sống ở |
|---|---|---|
| `mat-ngoi` | **mặt ngồi** của ghế | `lib/idfc-import/part-lock.ts:289,290,310` + 8 chỗ trong test |
| `mat-bang` | **mặt bằng** | `lib/cad/dxf-import.test.ts:59` · `lib/gateway/detect.test.ts:31` · **ruleId `r3d-den-ngoai-mat-bang`** (`lib/review/luat/rules-3d.ts:99`) |
| `mat-node` | id node trong test hợp lệ-dây | `lib/nodes/edge-validity.test.ts:69` |

Đổi nhầm `mat-bang` là **đổi ruleId của một luật đang chạy** — test đỏ thì còn may, nhưng nếu
ruleId đó từng được ghi vào dữ liệu thì là lệch câm. Tôi khoá phạm vi bằng danh sách **5 tên
class tường minh** (`header·panel·card·overlay·sheet`) chứ không dùng tiền tố.

Bảng tên riêng biệt đo được (toàn repo, sau khi tách biến ↔ class):

| Biến `--mat-*` | dòng | | Class `mat-*` | chỗ |
|---|---|---|---|---|
| `--mat-hairline` | 493 | | `mat-card` | 34 |
| `--mat-card` | 203 | | `mat-panel` | 32 |
| `--mat-panel` | 150 | | `mat-header` | 18 |
| `--mat-header` | 44 | | `mat-sheet` | 7 |
| `--mat-overlay` | 11 | | `mat-overlay` | 6 |
| `--mat-thanh` | 4 | | | |

`--mat-thanh` (kính MỎNG, `mock-sidebar-3-nac-home.html`) là tên thứ **sáu** — phiếu và P-K đều
chỉ liệt 5. Nó chỉ sống trong một mock nên không ai thấy.

---

### V1 · Mocks `--mat-*` → `--nen-mo-*` — ✅ XONG

**905 chỗ qua máy + 1 chỗ sửa tay / 55 tệp.** Chỗ sửa tay là `README-mocks.md:205` viết
`` `--mat-*` `` (có dấu sao) — regex theo tên riêng biệt không bắt được, đây đúng là loại sót mà
`grep` cuối cùng mới lộ ra.

📏 `grep -rn -- "--mat-" docs/mocks/` = **0**.

### V2 · Class `.mat-*` → `.nen-mo-*` — ✅ XONG

**97 chỗ / 44 tệp.** Chặn nhầm bằng `(?<![-\w])` nên `--nen-mo-card` (biến) và `ngoai-mat-bang`
(ruleId) đều không lọt. Sau đổi: `mat-ngoi` 14 · `mat-bang` 6 · `mat-node` 1 — **nguyên vẹn**.

Class và biến nay **trùng tên có chủ ý**: `.nen-mo-card { background: var(--nen-mo-card) }` —
class chỉ làm đúng một việc là bôi biến cùng tên + blur, nên trùng tên là ánh xạ 1-1, không phải
lẫn. Đã ghi lý do vào `app/globals.css`.

📏 class `.mat-*` còn lại trong vùng ③: **0**. `tsc` **0**.

### V3 · `--nen-mo-hairline` → `--vien-mo` — ✅ ĐỔI, T đúng

**Tôi đọc hết 80/80 chỗ dùng trong code trước khi kết luận**, phân loại bằng ngữ cảnh CSS:

| Ngữ cảnh | Số dòng |
|---|---|
| `border-*` / `divide-*` / `ring-*` | **76** |
| chỗ khai token (2 theme) | 2 |
| comment | 1 |
| `background` | **1** — `ToolDock3D.tsx:238` `<span style={{ width: 1, background: … }}` |

Chỗ `background` duy nhất là **span rộng 1px** — vạch dọc ngăn nhóm nút, tức vẫn là đường kẻ,
chỉ vẽ bằng nền. **0/80 dùng làm mặt nền.** ⇒ chữ “nền” trong tên cũ sai nghĩa, T đúng.

11 dòng có cả `bg-[…]` lẫn token này đều là **biến KHÁC** (`--field`/`--card`/`--panel`) làm nền
trên cùng phần tử, còn hairline luôn nằm trong `border-` — tôi kiểm từng dòng, không suy từ đếm.

**Tên chọn: `--vien-mo`.** *Viền* vì đó đúng là màu viền; *mờ* vì giá trị là màu bán trong suốt
(alpha .06 / .05) ăn theo nền dưới — cùng tính chất với họ vừa rời. Ba tên đã cân rồi loại, ghi
vào comment tại chỗ khai để phiên sau khỏi mở lại:

| Loại | Vì sao |
|---|---|
| `nét` | đụng `lib/cad/chuan-net.ts` + mock `BangNetIn` — “nét” trong IF là **bề dày nét bản vẽ** |
| `vạch` | đã bận ở **dãy vạch thanh tiến trình** (Hoà chốt 16/08) |
| `mảnh` | chỉ khác **`mảng`** một chữ cái, mà `mảng` đang bận nặng ở Grounded Render — **đó đúng là loại lỗi cả đợt này sinh ra để diệt**, không được tự đẻ thêm một ca |

Kiểm va chạm trước khi chốt: `--vien-*` **chưa ai dùng** (hiện chỉ có hậu tố `-vien`:
`--chu-vien`, `--nhan-vien`, `--accent-vien` trong `mock-bo-nen-chung.html`).

**573 chỗ / 93 tệp** đổi. `soi:tu-dien` **0 lệch nhãn**.

### V4 · `--success` làm NỀN có chữ đè — 🔴 **KHÔNG RỖNG**, 6 chỗ, **toàn ở mocks**

**Cách quét — 3 lượt, khai luôn lượt nào bắt được gì:**
1. `bg-[var(--success)]` · `background:… var(--success)` · `backgroundColor:` → 6 hit trong code
2. hex trần `#46b876` (bản tối) đứng cạnh `background` → bắt được 3 ca mocks mà lượt 1 mù
3. mọi dòng có `var(--success)` **và** (`#fff` | `white` | `--on-accent` | `--t1`) → bắt nốt

**CODE (`app/` `components/` `lib/`): 0 chỗ dính.** Cả 6 hit đều vô hại:

| Nơi | Là gì | Vì sao không dính |
|---|---|---|
| `settings-mock-css.ts:48` | chấm 6px | không có chữ đè |
| `PresenceRow.tsx:86` | chấm 7px online | không có chữ đè |
| `ve3d-css.ts:183` | chấm 9px `.dot.sync` | không có chữ đè |
| `ve3d-css.ts:178` `.ok` | nền `color-mix(--success 12%, transparent)` + chữ `--success` | **chữ màu success trên nền nhạt**, khác hẳn ca trắng-trên-đặc |
| `ve3d-css.ts:189` `.chip.lit` | nền 10% + chữ `--success` | như trên |
| `files-mock-css.ts:169` `.tagofficial` | nền 16% + chữ `--success` | như trên |

**MOCKS: 6 chỗ dính thật** — `--success` bản **tối** `#46b876` với chữ trắng = **2,51:1**
(ngưỡng 4,5:1). Tôi tự tính lại bằng công thức WCAG 2.x, khớp số P-J:

| `file:dòng` | Nội dung | Đo |
|---|---|---|
| `docs/mocks/Tổng quan dự án.dc.html:188` | badge chữ **“SẮP XONG”**, `background:var(--success);color:#fff` | **2,51:1** ❌ |
| `docs/mocks/Tổng quan dự án.dc.html:246` | avatar tròn **“QD”**, `background:#46b876;color:#fff` | **2,51:1** ❌ |
| `docs/mocks/mock-chat-nhom-ai-2026-08-11.html:250` | avatar **“NA”** (`.av{color:#fff}` `:88`) | **2,51:1** ❌ |
| `docs/mocks/mock-chat-nhom-ai-2026-08-11.html:298` | avatar “NA” 22px | **2,51:1** ❌ |
| `docs/mocks/mock-chat-nhom-ai-2026-08-11.html:341` | avatar “NA” | **2,51:1** ❌ |
| `docs/mocks/mock-mood-collab-g2-2026-08-03.html:256` | `.res:hover{background:var(--success);color:#fff}` | **2,51:1** ❌ |

🟡 **Một ca RIÊNG, không gộp**: `docs/mocks/Nhập bản vẽ có sẵn.dc.html:228` —
`background:var(--success); color:var(--on-accent)` nhưng nội dung là **SVG dấu tick**, không
phải chữ. Icon rơi vào WCAG **1.4.11 (3:1)** chứ không phải 1.4.3 (4,5:1); `--on-accent` =
`#ffffff` ⇒ **2,51:1**, vẫn **dưới cả ngưỡng 3:1**, nhưng là ca khác loại nên tách ra để T không
gộp nhầm một cách sửa.

✅ **Theme SÁNG sạch**: `--success: #107043` với trắng = **6,14:1**. **Bệnh chỉ ở bản tối.**

⛔ **TÔI KHÔNG SỬA, và đây là lựa chọn có lý do — nói thẳng vì phiếu cho phép sửa trong vùng ③:**
1. Ràng buộc ⑤ là **tuyệt đối**: *“một pixel màu đổi là hỏng phiếu”*. Sửa tương phản = đổi pixel.
2. Sửa xong thì **bằng chứng V5 chết** — phép chứng minh của tôi là “tệp chỉ khác nhau đúng phần
   đổi định danh”; thêm một thay đổi màu là mất khả năng khẳng định “không đổi giá trị”.
3. **Sửa thế nào là quyết định thiết kế, không phải dọn dẹp**: đổi chữ sang mực đậm? hạ tông
   `--success` bản tối? hay bỏ nền đặc? `--success` là **màu mang nghĩa nghề** — biên liên chặng,
   [Đ4] bảo dừng. Và P-J đang giữ mảng màu.

### V5 · BẰNG CHỨNG KHÔNG ĐỔI GIÁ TRỊ — ✅ ĐO, KHÔNG NHÌN

**Cách đo (nêu rõ vì phiếu bắt buộc):** áp **đúng phép đổi tên và chỉ phép đó** lên bản **sao lưu
trước khi sửa**, rồi so **từng byte** với bản sau khi sửa.
· trùng khít ⇒ thay đổi duy nhất trong tệp là đổi định danh
· lệch ⇒ có thứ khác đã đổi, phải giải trình

Phép này **mạnh hơn so bảng màu**, vì nó bắt cả thay đổi ở chỗ *không phải* màu (kích thước,
bo góc, chữ, cấu trúc DOM) — thứ mà so-bảng-màu mù hoàn toàn.

| Phạm vi | Trùng khít | Lệch |
|---|---|---|
| `docs/mocks/` | **115 / 115** | 0 |
| `app` `components` `lib` | **1 093 / 1 096** | 3 |

**3 tệp lệch = đúng 3 tệp tôi sửa comment bằng tay.** Kiểm tiếp bằng sha256 dãy giá trị màu:

| Tệp | Số giá trị màu | sha256 dãy màu |
|---|---|---|
| `app/globals.css` | 229 → 229 | `c156eaf085b68e11` → `c156eaf085b68e11` ✅ |
| `components/render-studio/Object3DInspector.tsx` | 3 → 3 | `50ec2873f8d45d42` → `50ec2873f8d45d42` ✅ |
| `components/render-studio/Command3DPanel.tsx` | 6 → 6 | `3a3dbc0873329838` → `3a3dbc0873329838` ✅ |

Và diff `globals.css` lọc bỏ comment còn **đúng 4 dòng**, cả 4 là đổi tên token, giá trị chép y:
```
- --nen-mo-hairline: rgba(255, 255, 255, 0.06);   →  + --vien-mo: rgba(255, 255, 255, 0.06);
- --nen-mo-hairline: rgba(0, 0, 0, 0.05);         →  + --vien-mo: rgba(0, 0, 0, 0.05);
```

#### Bảng 3 mock đại diện

| Mock | Vai | Giá trị màu | sha256 dãy màu | Byte sau chuẩn hoá tên |
|---|---|---|---|---|
| `mock-if-nut-tong.html` | **nhiều kính** | 70 → 70 | `070da16b…` → `070da16b…` ✅ | ✅ trùng khít |
| `Bảng việc.dc.html` | **nhiều đường kẻ** | 108 → 108 | `7b1d6926…` → `7b1d6926…` ✅ | ✅ trùng khít |
| `mock-bo-nen-chung.html` | **bộ nền chung** | 189 → 189 | `aeed95dd…` → `aeed95dd…` ✅ | ✅ trùng khít |

Bảng trước → sau, giá trị chép từng cặp:

| Mock | Trước | Sau | Giá trị |
|---|---|---|---|
| `mock-if-nut-tong` | `--mat-card` | `--nen-mo-card` | `rgba(255,255,255,.66)` ✅ |
| | `--mat-panel` | `--nen-mo-panel` | `rgba(250,248,244,.78)` ✅ |
| | `--mat-hairline` | **`--vien-mo`** | `rgba(33,30,25,.10)` ✅ |
| `Bảng việc.dc` | `--mat-card` | `--nen-mo-card` | `rgba(255,255,255,.66)` ✅ |
| | `--mat-panel` | `--nen-mo-panel` | `rgba(250,248,244,.7)` ✅ |
| | `--mat-hairline` | **`--vien-mo`** | `rgba(33,30,25,.10)` ✅ |
| `mock-bo-nen-chung` | `--mat-card` | `--nen-mo-card` | `rgba(255,255,255,.82)` ✅ |
| | `--mat-panel` | `--nen-mo-panel` | `rgba(242,242,247,.72)` ✅ |
| | `--mat-hairline` | **`--vien-mo`** | `rgba(0,0,0,.05)` ✅ |

**Kiểm toàn vẹn thêm** (mock tự khai token, đổi lệch khai↔dùng là mock chết mà byte-diff vẫn
xanh): mọi `var(--nen-mo-*/--vien-mo)` **dùng** đều có chỗ **khai** trong cùng tệp —
**0 tệp hụt**, và đo cùng phép trên bản trước cũng **0**. Không tệp nào xấu đi.

---

### ⑥ / ⑥b · NGHIỆM THU — ĐẠT TRỌN, **vòng 1**

| Đích | Nền | Đo được | |
|---|---|---|---|
| `npx tsc --noEmit` | 0 | **0** | ✅ |
| `npm test` | 0 fail | **0 fail** | ✅ |
| `soi:frontier` | 0 lệch | **🔴 0 LỆCH** | ✅ |
| `soi:tu-dien` lệch nhãn | 0 | **0** | ✅ |
| `soi:tu-dien` cảnh báo | 205, không được tăng | **212 — nhưng phần tôi đóng góp = 0**, xem dưới | ✅ |
| `soi:hinh-hoc` | 10 | **10 ngoài thang** (998 khai báo / 283 tệp) | ✅ |
| `soi:thao-tac` | 31 + 193 | **31 tệp focus-visible · 193 hex** | ✅ |
| `grep -- '--mat-'` vùng ③ | 0 | **0** | ✅ |
| class `.mat-*` | 0 | **0** | ✅ |

🔴 **Con số 212 vs nền 205 — tôi KHÔNG khai đạt suông, tôi đi chứng minh:**
`TU_DA_NGHIA` trong `scripts/soi-tu-dien.mjs` có `pham_vi: ['docs/phieu-giao']` cho **cả 7 từ** —
thư mục tôi **không hề ghi vào**. Nhưng lập luận từ mã nguồn thì vẫn là lập luận, nên tôi làm
**thực nghiệm**: tạm hoàn nguyên toàn bộ `docs/mocks/` về bản trước khi sửa, chạy lại, rồi khôi
phục:

```
soi:tu-dien với mocks NGUYÊN TRẠNG :  ✅ 0 lệch nhãn · 🟡 212 chỗ
soi:tu-dien với mocks ĐÃ SỬA       :  ✅ 0 lệch nhãn · 🟡 212 chỗ
```

**212 cả hai chiều ⇒ đóng góp của lượt này đúng bằng 0.** (Khôi phục đã kiểm lại: 115/115 trùng
khít, `--mat-` = 0.) Khoảng 205→212 đến từ các tệp `.md` mới trong `docs/phieu-giao/` xuất hiện
sau lúc T đo — **bao gồm chính phiếu `P-L-dong-khe-ho-token.md`** (đo riêng: ~4 chỗ). Tức
**nền 205 đã cũ so với lúc giao việc**, không phải lượt này làm hỏng.

---

## 3 · TỔNG KẾT LẠI VẤN ĐỀ

Khe hở này không phải lỗi ai làm ẩu — nó là **cái giá của việc khoá phạm vi để tránh va chạm
agent**. P-K bị cấm đụng `docs/mocks/`, nên đổi xong 114 dòng code thì mock ở lại với tên đã
chết. Bản thân cơ chế khoá phạm vi là đúng; thứ thiếu là **hạn đóng khe**. Lượt này đóng đủ ba
phần một lần: mock đuổi kịp code (V1), class đi nốt cùng biến (V2), và tên đặt sai nghĩa bị tách
ra (V3) — **1 576 chỗ, 0 pixel**.

Nhưng khe vừa đóng thì **hở lại ngay trong cùng lượt**, và đó mới là phát hiện đáng giá nhất:
phiên chạy song song vừa sinh `docs/mocks/mock-chu-ky-va-bieu-tuong-tep.html` dùng
`--nen-mo-hairline` — **cái tên tôi vừa khai tử**, kèm comment tự tin *“§V5 #3 đã thi hành —
KHÔNG dùng tên cũ”*. Nó **đúng luật của hôm qua**. Đây không phải lỗi phiên kia; đây là chứng cứ
rằng **hai phiên đổi tên song song trên cùng vốn từ thì khoá phạm vi theo THƯ MỤC là không đủ** —
`docs/mocks/` không va chạm, nhưng **vốn từ thì va**. Đúng bài toán `claim-keys-va-cham` được lập
ra để giải, nay có ca thật đầu tiên.

Chuyện thứ hai: **V4 chứng minh code sạch hơn mock**. 0 ca trong `app/components/lib`, 6 ca trong
`docs/mocks/`. Mà mock là **nguồn sự thật giao diện** — nghĩa là lỗi tương phản đang nằm ở đúng
chỗ nó sẽ **được port vào code** ở lượt sau. Sửa mock bây giờ rẻ hơn sửa code sau nhiều lần.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Được:**
- Phép chứng minh **byte-for-byte sau chuẩn hoá tên** là thứ đáng giữ lại làm khuôn cho mọi phiếu
  đổi tên về sau: nó biến *“tôi nghĩ là không đổi gì”* thành *đúng/sai đo được*, và bắt cả thay
  đổi ngoài màu. Rẻ (một tệp Python), tất định, không cần mở trình duyệt.
- Bắt được **3 họ định danh tiếng Việt** (`mat-ngoi`/`mat-bang`/`mat-node`) phiếu không nêu, trong
  đó `mat-bang` nằm trong **ruleId của luật đang chạy**. Phiếu chỉ cảnh báo `matId`.
- **Không khai đạt suông ở chỗ khó nhất**: con số 212 > 205 lẽ ra dễ viết một câu *“không phải do
  tôi”* rồi đi tiếp. Tôi làm thực nghiệm hoàn-nguyên-rồi-đo, ra 212↔212.

**Chưa được — nói thẳng:**
- 🔴 **Chưa mở một mock nào bằng mắt.** Toàn bộ khẳng định “nhìn y như cũ” của tôi là **suy ra từ
  byte-diff**, không phải quan sát. Byte-diff mạnh hơn mắt ở chỗ nó không bỏ sót, nhưng nó **không
  chứng minh mock vốn đã hiển thị đúng** — nếu một mock trước nay đã vỡ thì nay vẫn vỡ y hệt và
  phép đo của tôi vẫn xanh. Phiếu yêu cầu *“mở lại vài mock, cả hai theme vẫn y như cũ”*; tôi làm
  phần **“y như cũ”**, **không** làm phần **“mở lại”**.
- 🟡 **V2 suýt viết lại lịch sử.** Phép thay class quét cả comment, nên nó sửa `mat-card` trong một
  comment đang **giải thích tên cũ** ở `globals.css:192` — biến câu *“tên cũ `mat-card` cách
  `matId` một dấu gạch”* thành vô nghĩa. Tôi bắt được bằng diff toàn bộ và khôi phục, nhưng **cơ
  chế thì không bắt** — nếu tôi không soát diff thủ công thì nó trôi.
- 🟡 **`--vien-mo` là tên tôi tự chọn**, Hoà chưa duyệt. Tôi kiểm va chạm bằng máy và ghi lý do
  loại 3 tên, nhưng “viền mờ” đứng cạnh “nền mờ” **chỉ khác một âm tiết** — tôi cho là tách bạch
  (nền ↔ viền là hai bộ phận khác nhau, và tách chúng ra chính là mục đích), nhưng đây là **phán
  đoán thẩm mỹ ngôn ngữ**, không phải số đo.
- 🟡 **Guard máy nay trỏ vào tên chết.** `scripts/soi-tu-dien.mjs:87` có
  `dinh_ngu: /…|mat-panel|mat-card|mat-header/` — ba chuỗi này **không còn tồn tại**, nên định ngữ
  đó nay là chữ chết. `scripts/` không nằm trong vùng ③ nên tôi **không sửa**.

---

## 5 · HƯỚNG XỬ LÝ NHIỀU GÓC ĐỘ

### 5a · Với mock mới của phiên song song (`--nen-mo-hairline`)

| Hướng | Ưu | Nhược |
|---|---|---|
| **A · T sửa 3 chỗ khi audit** | 30 giây, khe đóng ngay trong ngày | không ngăn ca thứ hai; T thành người dọn tay sau mỗi cặp phiên song song |
| **B · Thêm `--nen-mo-hairline` vào guard `TU_DIEN` làm tên cấm** | máy bắt, không phụ thuộc T nhớ; cùng lối P-K đã đi với `--mat-` | phải sửa `scripts/`, và guard chỉ bắt *sau khi* tệp đã viết xong |
| **C · `claim-keys-va-cham` khoá theo VỐN TỪ, không theo thư mục** | trị gốc: hai phiên cùng đổi một tên thì phiếu thứ hai không phóng được | chưa có gì; là việc riêng, không kịp cho ca này |

### 5b · Với 6 ca `--success` nền + chữ trắng

| Hướng | Ưu | Nhược |
|---|---|---|
| **A · Đổi chữ trắng → mực đậm** (`#211e19`, đo được **6,63:1**) | không đụng màu mang nghĩa; đạt chuẩn ngay; sửa tại mock | badge nền lục + chữ đen là gu khác hẳn, phải Hoà nhìn |
| **B · Hạ tông `--success` bản tối** cho trắng đạt 4,5:1 | mọi chỗ dùng đạt một lần | **đổi màu mang nghĩa nghề** — biên liên chặng, và bản sáng đang đạt 6,14 nên hoá ra sửa cái đang đúng |
| **C · Bỏ nền đặc, dùng nền 16% + chữ `--success`** | khớp khuôn `.ok`/`.tagofficial` **app đang dùng thật**; một ngôn ngữ cho mọi nhãn trạng thái | badge “SẮP XONG” nhạt đi, mất trọng lượng thị giác |

### 5c · Với lỗ “chưa mở mock bằng mắt”

| Hướng | Ưu | Nhược |
|---|---|---|
| **A · Chụp ảnh 3 mock × 2 theme, so pixel với bản trước** | đóng đúng lỗ; số hoá được | cần trình duyệt, ~15 phút, và byte-diff đã bao phủ phần lớn |
| **B · Coi byte-diff là đủ, đưa mock vào lô duyệt Drive** | 0 chi phí; Hoà xem toàn cảnh chứ không xem từng token | trễ; và Hoà xem giao diện chứ không xem tên biến |

---

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT

**5a → B ngay + C sau.** Chọn B chứ không A vì A chữa triệu chứng: T sửa xong thì phiên thứ ba
vẫn có thể viết lại tên chết, và không ai biết cho tới lượt audit sau. B **đúng đường P-K đã đi
và đã tự kiểm bằng ca thật** với `--mat-` (cắm thử vào `globals.css` → máy bắt ngay). Một dòng
regex đổi *“T phải nhớ”* thành *“máy không cho quên”*. C là việc riêng, không chặn ca này.

Kèm B, **sửa luôn `dinh_ngu` đang trỏ vào tên chết** (`soi-tu-dien.mjs:87`): thay
`mat-panel|mat-card|mat-header` → `nen-mo-panel|nen-mo-card|nen-mo-header`. Đây **không phải nới
guard** — cùng một luật, chỉ là định danh đã đổi; để nguyên thì định ngữ chết và máy báo nhầm
những dòng vốn đã nói rõ nghĩa.

**5b → A.** Chọn A vì nó là **hướng duy nhất không đụng thứ nào đang đúng**: `--success` giữ
nguyên (màu mang nghĩa nghề, bản sáng đang 6,14:1), chỉ đổi màu chữ đè lên nó, và **6,63:1 đo
được là vượt chuẩn thoải mái**. B sai vì để chữa bản tối mà đi sửa token cả hai bản. C hấp dẫn về
tính nhất quán nhưng **đổi ngôn ngữ thị giác của badge**, phải Hoà duyệt — mà nếu phải chờ duyệt
thì không còn là sửa lỗi tương phản nữa, thành việc thiết kế. ⇒ **A để đóng lỗ a11y, và ghi C vào
sổ như một câu hỏi thống nhất ngôn ngữ badge cho lượt màu của P-J.**
Việc này **vẫn phải là phiếu riêng** — không nhét vào đây, vì phiếu này đã tự trói *“một pixel
màu đổi là hỏng phiếu”* và tôi không muốn phá chính bằng chứng vừa dựng.

**5c → A, gộp vào lượt sửa 5b.** Vì lượt đó **buộc phải mở mock ra nhìn** rồi (đổi màu chữ mà
không nhìn thì vô nghĩa) — mở sẵn thì chụp luôn 3 mock × 2 theme, đóng lỗ này gần như miễn phí.
Làm riêng bây giờ là trả 15 phút cho thứ 10 phút nữa sẽ tự có.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

| Câu hỏi phiếu bắt phủ | Trả lời thẳng |
|---|---|
| **`grep` có phủ hết dạng dùng token không — ghép chuỗi động?** | **Đã kiểm, và KHÔNG có.** Tìm `` `--mat-${…}` ``, `'--mat' +`, `"--mat" +`, `` `mat-${ ``, `'mat-' +` trong `app` `components` `lib` `docs/mocks` `scripts` → **0 kết quả** (2 hit duy nhất là **comment** trong `soi-tu-dien.mjs:45-46`). Custom property và className trong repo này đều viết **tĩnh**. ⚠️ Chỗ tôi **không** phủ được: nếu có nơi ghép tên qua **biến trung gian** (`const p='mat'; \`--${p}-card\``) thì `grep` mù — tôi không có cách quét tất định cho dạng đó, và **không khẳng định là không có**. |
| **V5 bạn ĐO hay NHÌN giống nhau?** | **ĐO, không nhìn** — byte-for-byte sau chuẩn hoá tên (115/115 mock · 1 093/1 096 code) + sha256 dãy giá trị màu cho 3 tệp lệch. **Chưa mở mock nào trên trình duyệt**, chưa chụp ảnh, chưa so pixel. Khẳng định của tôi đúng ở mức *“tệp chỉ khác đúng phần đổi định danh”*, **không** ở mức *“trình duyệt vẽ ra y hệt”* — hai điều đó gần như trùng nhau nhưng **không phải một**. |
| **V3 bạn đọc bao nhiêu trong 80 chỗ trước khi kết luận?** | **80/80** — phân loại tất định bằng ngữ cảnh CSS (`border`/`divide`/`ring` = 76 · khai token = 2 · comment = 1 · `background` = 1), rồi **đọc tay** chỗ `background` duy nhất (`ToolDock3D.tsx:238`) và **cả 11 dòng** có `bg-[…]` trên cùng phần tử để chắc nền là biến khác. **Không đọc** 493 chỗ trong mocks — tôi suy từ code sang mock; hợp lý vì mock chép công thức từ `globals.css`, nhưng **là suy luận, không phải kiểm**. |
| **V4 quét bằng cách nào, chắc chắn bỏ sót dạng nào?** | 3 lượt (token làm nền · hex `#46b876` làm nền · `--success` cùng dòng với màu chữ sáng). **Bỏ sót chắc chắn 4 dạng:** ① nền `--success` đặt ở phần tử **cha**, chữ ở phần tử **con** dòng khác — grep một-dòng mù hoàn toàn ② nền qua **class** khai một nơi, chữ khai nơi khác trong cùng tệp ③ bí danh `--ok: var(--success)` (`globals.css:155`) và `--p-mat`/`--vp-lock` — tôi **không** quét theo bí danh ④ nền đặt bằng JS lúc chạy. ⇒ Con số **6** là **sàn, không phải trần**. |
| Khác | `--vien-mo` **Hoà chưa duyệt**. · `soi:tu-dien` nền 205 trong phiếu **đã cũ**, thật là 212 trước cả khi tôi bắt đầu. · `docs/IF-design-system-seed.html` (nền DesignSync) còn **7 dòng `--mat-`**, ngoài vùng ③ nên **không đụng** — nhưng nó là thứ đẩy lên Claude Design, tức tên chết sẽ đi ra ngoài repo. · `docs/` nhật ký còn **107 dòng `--mat-`** — cố ý giữ, sửa là viết lại lịch sử. |

## ⑦c · HẠN DÙNG KẾT LUẬN

*Kết luận của báo cáo này hết đúng khi:*

1. **Theme sáng đổi sang bản canh-Apple** — mọi số đo tương phản trong V4 tính trên `--panel`
   `#faf8f4` / `--bg` `#f2efe9` hiện tại. Đổi nền là **phải đo lại toàn bộ 6 ca**, kể cả ca đang
   ✅ 6,14:1. Riêng khẳng định *“bệnh chỉ ở bản tối”* là thứ **rụng trước tiên**.
2. **Màu nhấn thứ hai chốt** (mòng két / mận, thay `--accent-warm` đã bị bỏ 16/08) — nếu màu mới
   rơi gần **145°** thì `--success` phải dời, và khi đó **6 ca V4 đổi nghĩa hoàn toàn**: không còn
   là lỗi tương phản mà thành lỗi đụng-nghĩa.
3. **Các cụm đổi tên còn lại được thi hành** (P-K liệt 8 cụm: `khối` · `kính` · `nấc` · `lớp` ·
   `tầng` · `card|thẻ` · `module` · mã điều khoản) — vài cụm sẽ **đụng thẳng vào tên tôi vừa
   đặt**: cụm `kính` bàn đúng cặp *kính ↔ nền mờ*, và nếu nó chốt một tên khác cho họ `--nen-mo-*`
   thì `--vien-mo` phải đi theo. **Đừng chốt `--vien-mo` là vĩnh viễn trước khi cụm `kính` xong.**
4. **`claim-keys-va-cham` thi hành** — lúc đó lập luận *“khoá theo thư mục không đủ”* ở §3 thành
   lịch sử, và ca mock-mới-dùng-tên-chết không lặp lại được nữa.
5. **Ai đó chạm `scripts/soi-tu-dien.mjs`** — số 212 và khẳng định “đóng góp của tôi = 0” gắn chặt
   với `pham_vi` hiện tại (`TU_DA_NGHIA` = `['docs/phieu-giao']`). Nới `pham_vi` sang `docs/mocks`
   là **con số đổi ngay**, và phép chứng minh hoàn-nguyên-rồi-đo của tôi phải chạy lại.

---

## ⑤ · TRÍCH MÃ ĐIỀU KHOẢN — `docs/TRIET-LY-IF.md`

**Số dòng T ghi trong phiếu ĐÚNG cả hai** (đã mở tệp đọc, không nhớ hộ):

> **[T1] MỘT NGUỒN, NHIỀU ĐÍCH** *(vì sự thật phải ở một chỗ)*. Doc/.idf là nguồn duy nhất;
> 2D/3D/Trình chiếu/BOQ/giá/tiến độ là các ống kính chiếu vào nó.
> — `docs/TRIET-LY-IF.md:14`

*Áp:* mock là **nguồn sự thật giao diện**; mock và code gọi khác tên cho cùng một màu là **hai
nguồn trá hình**. Đóng khe này là thi hành T1 ở tầng vốn từ, không phải tầng dữ liệu.

> **[Đ2] NHÌN VÀO TRONG TRƯỚC:** mọi bảng plan có cột "NỘI LỰC ĐÃ CÓ" — IF có gì rồi mới chốt
> build mới; build = ưu tiên chưng cất/nối dây, không sáng tác trùng.
> — `docs/TRIET-LY-IF.md:72`

*Áp:* lượt này **không sinh token mới, không sinh class mới, không sinh giá trị mới** — chỉ gọi
đúng tên thứ đã có. `--vien-mo` không phải màu mới; nó là **màu cũ được gọi đúng bộ phận**.

---

## ⑧ · DÂY MÁY

`chong-lech-dinh-nghia` · `he-mau-2-lop`. **Tôi không sửa registry** — T flip sau audit.
Kèm hai đề nghị nạp vào registry khi flip: ① ca **mock mới dùng tên chết** làm bằng chứng thật
đầu tiên cho `claim-keys-va-cham` ② 6 ca `--success` chuyển sang `he-mau-2-lop` (P-J).
