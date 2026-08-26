# IF · VITALS — HỢP ĐỒNG TRẠNG THÁI
`W1-10 · IF-VITALS-UX-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE**

> **Đây là hợp đồng TRẠNG THÁI, không phải hợp đồng hình ảnh.** Nó chốt *một ô Vitals có thể ở
> những trạng thái nào · chuyển giữa chúng theo điều kiện gì · mỗi trạng thái mang đúng dữ liệu
> nào*. Nó **không** chốt màu, cỡ, khoảng cách, hay hình thái. Xem §7 THẨM QUYỀN.

> ⚠️ **Nhãn verdict của tệp này:** `PARTIAL — contract/design proof`. **`NOT ASSESSED` cho mọi
> bậc runtime** — lane tài liệu, không dev server, không ảnh app thật (F-16: *"nhãn verdict phải
> mang theo bề mặt đã chạm, không chỉ số ca đạt"*).

---

## 1 · "VITALS CELL" LÀ GÌ

**Một `vitals cell` = MỘT tín hiệu có nguồn đo được, đứng cạnh việc đang làm.**

Nó **không** phải một component. Nó là một **đơn vị ngữ nghĩa** được vẽ ra ở nhiều bề mặt khác
nhau: một dòng trong khẩu độ Peek (`components/studio/VitalsAperture.tsx`) · một chấm ambient
(`components/studio/VitalsStateBadge.tsx:40-60`) · một số trên Dashboard · một dấu trên thẻ dự án.
Cùng một cell, cùng một trạng thái, ba chỗ vẽ — **một máy trạng thái duy nhất**.

Neo canonical: `IF-CANONICAL.md` §11 (*Vitals = trí tuệ cạnh việc*) · §9 (Vitals nằm trong **hệ
dùng chung** ⇒ luật *"cái gì đã gọi là dùng chung thì phải THẬT SỰ dùng chung"*, M-26 cấm bản sao
thứ hai).

---

## 2 · MÁY TRẠNG THÁI

### 2.1 · Tám trạng thái

| mã | tên | nghĩa chính xác | terminal? |
|---|---|---|---|
| `khong-quyen` | **KHÔNG CÓ QUYỀN** | người này không được phép biết con số này | ✅ **TERMINAL trong phạm vi hiện tại** — chỉ thoát khi quyền đổi (sự kiện ngoài) |
| `chua-hoi` | **CHƯA HỎI** | quyền đã kiểm và ĐẠT; chưa phát yêu cầu đo | ❌ (trạng thái khởi đầu duy nhất sau cửa quyền) |
| `dang-tai` | **ĐANG TẢI** | đã phát yêu cầu, chưa có trả lời | ❌ |
| `khong-co-du-lieu` | **KHÔNG CÓ DỮ LIỆU** | nguồn truy được, **không có đối tượng nào để đo** (chưa dự án · chưa bản vẽ · hàng đợi rỗng) | ❌ |
| `bang-khong` | **BẰNG KHÔNG** | đã đo trên đối tượng có thật, **kết quả = 0** | ❌ |
| `co-so` | **CÓ SỐ** | đã đo, kết quả `> 0`, còn hiệu lực | ❌ |
| `cu` | **CŨ / STALE** | có số, nhưng **tiền đề của phép đo đã đổi** ⇒ số không còn khớp | ❌ |
| `khong-do-duoc` | **KHÔNG ĐO ĐƯỢC** | đã thử, **thất bại hoặc bị bỏ qua có chủ đích** | ❌ |

⛔ **`khong-co-du-lieu` ≠ `bang-khong`.** Cái đầu: *không có gì để đếm*. Cái sau: *đếm rồi, ra 0*.
Neo: `components/studio/vitals-tin-hieu.ts:21-26` phân biệt `undefined` ↔ `0` và nói rõ vì sao
gộp là mở đường cho câu *"bản vẽ không có lỗi"* — thứ đã bị cấm bằng chữ vì **"0 vi phạm" ≠
"đạt chuẩn"**.

⛔ **`khong-do-duoc` KHÔNG BAO GIỜ được ánh xạ thành `bang-khong`, `khong-co-du-lieu`, hay bất kỳ
trạng thái "ổn" nào.** Đây là F-02 nguyên văn (`docs/design-campaign/02-FAILURE-LEDGER.md`):
với `site` và `projects` cùng 401, khẩu độ hiện `calm` — *"`calm` không phải sự im lặng, nó là
khẳng định 'đã kiểm, không có gì cần chú ý'"*. Trạng thái ledger: **FAIL, open**.
Cùng luật ở `IF-CANONICAL.md` §11: *"`401` / không truy được / không rõ ⇒ **không bao giờ** ánh xạ
thành calm"* và M-07 (`IF-UXUI-OPERATING-MEMORY.md`).

### 2.2 · Chuyển trạng thái

| từ | tới | điều kiện |
|---|---|---|
| *(khởi tạo)* | `khong-quyen` | **cửa quyền TRẢ VỀ TRƯỚC** — chưa phát bất kỳ yêu cầu dữ liệu nào |
| *(khởi tạo)* | `chua-hoi` | cửa quyền ĐẠT |
| `chua-hoi` | `dang-tai` | bề mặt gắn kết / người dùng mở Peek / poll tới hạn |
| `dang-tai` | `co-so` | trả lời hợp lệ, số `> 0` |
| `dang-tai` | `bang-khong` | trả lời hợp lệ, có đối tượng đo, số `= 0` |
| `dang-tai` | `khong-co-du-lieu` | trả lời hợp lệ, **không có đối tượng nào để đo** |
| `dang-tai` | `khong-do-duoc` | 401/403/5xx · timeout · vượt ngưỡng an toàn · bộ kiểm ném lỗi |
| `dang-tai` | `khong-quyen` | máy chủ trả 404/403 **cho chính phép đo này** (quyền đổi giữa chừng) |
| `co-so` · `bang-khong` | `cu` | tiền đề đổi (`HoSoDiaDiem.daCu` có mục mới) — **KHÔNG** tự động theo đồng hồ |
| `cu` | `dang-tai` | người dùng hoặc hệ gọi tính lại **đúng miền bị ảnh hưởng** |
| `co-so` | `co-so` | số đổi (cùng nguồn, cùng phép đo) |
| bất kỳ | `khong-quyen` | quyền bị thu hồi ⇒ **ô biến mất**, số đang hiện bị **xoá khỏi màn** |
| `khong-quyen` | `chua-hoi` | **chỉ khi** có sự kiện quyền đổi từ máy chủ. Không bao giờ do người dùng bấm |

**Chuyển bị CẤM (nêu tên để máy canh bắt được):**
- `khong-do-duoc` → `bang-khong` / `khong-co-du-lieu` — F-02.
- `dang-tai` → `bang-khong` khi trả lời **thiếu trường** — F-17: `(undefined ?? []).some(...)`
  cho `false`, và hai ca *"không thấy"* **xanh trong khi chưa bao giờ nhìn vào dữ liệu nào*.
  ⇒ **phải có ca khẳng định trường tồn tại và đúng kiểu TRƯỚC khi khẳng định nội dung của nó.**
- `cu` → `co-so` mà không đi qua `dang-tai` — tức là "làm mới" bằng cách xoá dấu cũ.

---

## 3 · KIỂU TypeScript ĐỀ XUẤT

> 🔴 **CHỈ KHAI TRONG TÀI LIỆU.** Lane này **KHÔNG** ghi vào `lib/`. Khi nào MAIN thi công, đây là
> hình dạng đề xuất — và MAIN có quyền bác (M-32: *"agent được phép bác MAIN"*, chiều ngược lại
> cũng thế).

**Vì sao discriminated union, không phải interface phẳng:** repo đã cấm khuôn phẳng-toàn-optional
tại `lib/cad/idfc.ts:11` — *"VỎ CHUNG + RUỘT THEO LOẠI (⛔ CẤM interface phẳng toàn optional)"*, với
lý do đo được ở `:15-17`: máy kiểm được *"video KHÔNG được có geom2d"* **thay vì 40 trường optional
mỗi loại dùng 5**. Áp vào đây: một `interface { so?: number; loi?: string; dangTai?: boolean }`
cho phép biểu diễn `{ dangTai: true, so: 0 }` — một trạng thái vô nghĩa mà **kiểu không cấm được**,
và đó chính là cửa cho F-02 quay lại.

```ts
// ĐỀ XUẤT — chưa ghi vào lib/. Tên trường theo lối đặt tên đang dùng ở
// components/studio/vitals-tin-hieu.ts (tiếng Việt không dấu), không đẻ vốn từ thứ hai (M-25/M-51).

/** Ai đo, đo trên cái gì. Bắt buộc ở MỌI trạng thái đã đo — không có nguồn thì không có số. */
interface NguonDo {
  /** Định danh phép đo — hằng số, không phải chữ tự do. */
  readonly phepDo: 'hang-doi-chay' | 'chay-loi' | 'chuan-ve' | 'dia-diem' | 'demo-flow';
  /** Đối tượng cụ thể đã đo (id bản vẽ · id dự án). Dùng để chứng minh "đo cái gì", không để hiện. */
  readonly doiTuong: string;
  /** Mốc thời gian phép đo hoàn tất (epoch ms). Bắt buộc — luật dữ liệu cũ §5 dựa vào nó. */
  readonly doLuc: number;
}

type OVitals =
  // ── S4 · KHÔNG CÓ QUYỀN — quyết TRƯỚC mọi yêu cầu dữ liệu, không mang số nào ──────────────
  | {
      readonly trangThai: 'khong-quyen';
      readonly lyDo: 'khong-la-thanh-vien' | 'vai-tro-khong-du';
      /**
       * Có được phép để người dùng biết ô này TỒN TẠI không.
       * `false` ⇒ ô không render, không chiếm chỗ, không có tooltip — xem lib/server/access.ts:31
       * (404 thay 403: "không tiết lộ project này có tồn tại").
       */
      readonly choPhepBietTonTai: boolean;
    }

  // ── trước khi hỏi ─────────────────────────────────────────────────────────────────────────
  | { readonly trangThai: 'chua-hoi' }

  // ── S2 · ĐANG TẢI ─────────────────────────────────────────────────────────────────────────
  | {
      readonly trangThai: 'dang-tai';
      readonly batDauLuc: number;
      /** Có huỷ được không. `false` ⇒ giao diện KHÔNG được vẽ nút huỷ (M-03: nút không tác dụng). */
      readonly huyDuoc: boolean;
    }

  // ── S1 · KHÔNG CÓ DỮ LIỆU — không có đối tượng nào để đo ──────────────────────────────────
  | { readonly trangThai: 'khong-co-du-lieu'; readonly nguon: NguonDo }

  // ── S5 · BẰNG KHÔNG — đã đo trên đối tượng thật, kết quả 0 ────────────────────────────────
  | {
      readonly trangThai: 'bang-khong';
      readonly nguon: NguonDo;
      /**
       * ⭐ PHẠM VI PHÉP ĐO — câu trả lời cho "0 cái gì". Bắt buộc, vì "0 vi phạm" ≠ "đạt chuẩn"
       * (vitals-tin-hieu.ts:24-26). Không khai được phạm vi ⇒ không được hiện số 0.
       */
      readonly phamVi: string;
    }

  // ── CÓ SỐ ─────────────────────────────────────────────────────────────────────────────────
  | {
      readonly trangThai: 'co-so';
      readonly nguon: NguonDo;
      /** Số nguyên bản. Nơi vẽ dùng thẳng, không bóc chữ ra khỏi nhãn (vitals-tin-hieu.ts:57-58). */
      readonly so: number;
      /** Câu người đọc thấy — LUÔN mang số thật, cấm câu chung chung "có vài việc" (:55-56). */
      readonly nhan: string;
      /** VÌ SAO — HẰNG SỐ theo loại phép đo, KHÔNG phải chữ tự do (:61-66). Cửa duy nhất. */
      readonly viSao: string;
      readonly chiTiet?: string; // chỉ khi nguồn thật sự có; chuỗi rỗng = không có (:147-148)
    }

  // ── CŨ / STALE ────────────────────────────────────────────────────────────────────────────
  | {
      readonly trangThai: 'cu';
      readonly nguon: NguonDo;           // doLuc ở đây là "số này đo lúc nào" — bắt buộc hiện
      readonly so: number;
      readonly nhan: string;
      readonly viSao: string;
      /** Tiền đề nào đã đổi. Không khai được ⇒ KHÔNG được hiện số cũ (xem §5). */
      readonly viSaoCu: 'su-that-doi' | 'ban-sua-nguon-doi';
      /** Miền bị ảnh hưởng — UNION CHỮ CHẾT, cố ý không phải string[] (vitals-tin-hieu.ts:104-109). */
      readonly mien: readonly MaMien[];
    }

  // ── S3 · KHÔNG ĐO ĐƯỢC ────────────────────────────────────────────────────────────────────
  | {
      readonly trangThai: 'khong-do-duoc';
      readonly lyDo:
        | 'xac-thuc'        // 401/403 — F-02 nổ đúng ở đây
        | 'mang'            // timeout / mất kết nối
        | 'vuot-nguong'     // bỏ kiểm có chủ đích: VitalsAperture.tsx:95-99, MAX_ROOMS_FOR_AREA
        | 'bo-kiem-nem';    // bộ kiểm gặp hình học lạ: VitalsAperture.tsx:107-109
      /** Có đường thử lại không. `false` ⇒ không vẽ nút thử lại. */
      readonly thuLaiDuoc: boolean;
    };
```

**Ba tính chất kiểu này khoá được mà interface phẳng không khoá được:**
1. Không thể dựng `{ trangThai: 'khong-do-duoc', so: 0 }` — `so` không tồn tại ở nhánh đó.
2. Không thể hiện `0` mà quên `phamVi` — `phamVi` bắt buộc trong nhánh `bang-khong`.
3. Không thể hiện số `cu` mà quên `viSaoCu` và `doLuc` — cả hai bắt buộc trong nhánh `cu`.

**Hàm chọn giữ nguyên hợp đồng đã có:** `chonTinHieu(nguon): TinHieu[]` với trần
`TRAN_TIN_HIEU = 3` (`vitals-tin-hieu.ts:31`) và thứ tự cố định `THU_TU`
(`:120-123`). Union trên là **lớp TRẠNG THÁI của một ô**, đứng *trước* lớp chọn tín hiệu — không
thay thế nó, không đẻ bảng thứ hai (M-26).

---

## 4 · QUY TẮC · QUYỀN KIỂM **TRƯỚC** KHI TẢI

> **Cửa quyền là bước ĐẦU TIÊN của máy trạng thái, không phải một lớp phủ.**
> Không tải ảnh / tên / số / trạng thái online rồi mới che bằng CSS, `hidden`, hay `disabled`.

**Vì sao đây là luật cứng, không phải sở thích:**
- **M-03** (`IF-UXUI-OPERATING-MEMORY.md`) — lý do nút mờ đặt trong `title` ⇒ *"câm trên cảm ứng,
  Tab bỏ qua nút `disabled`"* ⇒ **không bao giờ tới được ai**. Che bằng CSS là cùng một bệnh: thông
  tin **đã** rời máy chủ, chỉ có mắt là không thấy.
- **`lib/server/access.ts:31`** — *"404 chứ không 403 khi không phải member: không tiết lộ 'project
  này có tồn tại'"*. Một ô Vitals render rồi mới ẩn đã **phá đúng tính chất này** ở tầng client.
- **`components/collab/PresenceBar.tsx:16-19`** — nút Mời *"chỉ hiện khi `canManage`… **ẩn hẳn thay
  vì hiện rồi báo lỗi 403**"*. Đây là khuôn đúng, tái dùng nó (M-26: cấm khuôn thứ hai).
- **`lib/server/access.ts:76-89`** — bản cũ `visibleProjectIds()` lệch ngữ nghĩa ba điểm và có **0
  nơi gọi**; docstring kết luận bật nguyên trạng *"nguy hiểm hơn không lọc gì, vì nó **trông như**
  đã lọc"*. Lọc ở sai tầng là tệ hơn không lọc.

### Hệ quả với TỪNG trạng thái

| trạng thái | hệ quả của luật quyền-trước |
|---|---|
| `khong-quyen` · `choPhepBietTonTai: false` | Ô **không tồn tại trong cây render**. Không chiếm chỗ, không placeholder, không tooltip, không `aria-label`. Bố cục phải **đứng được** khi thiếu ô này (M-12: ô co theo nội dung, không `h-full`) |
| `khong-quyen` · `choPhepBietTonTai: true` | Ô hiện với nội dung là **lý do cần quyền**, không phải một số bị làm mờ. Chỉ dùng khi việc che giấu sự tồn tại là vô nghĩa (ví dụ: cột trong bảng mọi người đều thấy tiêu đề) |
| `chua-hoi` | Chỉ tới được **sau** khi cửa quyền ĐẠT. Nếu một ô ở `chua-hoi` mà chưa qua cửa quyền ⇒ **lỗi hợp đồng**, không phải trạng thái hợp lệ |
| `dang-tai` | Không bao giờ là trạng thái đầu tiên. Ô nào bắt đầu ở `dang-tai` là ô đã phát yêu cầu trước khi kiểm quyền |
| `co-so` · `bang-khong` · `cu` | Số **phải** tính trên tập đã lọc quyền **ở máy chủ**. Đếm toàn cục rồi lọc ở client là rò rỉ đội lốt số liệu — `app/api/library/route.ts:7` ghi thẳng *"GET trả tất cả asset của mọi user"*, một cell đếm từ nguồn này **vi phạm luật này ngay cả khi hiển thị đúng** |
| `khong-do-duoc` · `lyDo: 'xac-thuc'` | 401/403 **đến từ phép đo** ⇒ đây là S3, **không** phải S4. Phân biệt: S4 là *đã biết trước là không được phép*; S3 là *đã thử và bị từ chối*. Gộp hai cái là mất khả năng nói *"phiên của bạn hết hạn"* |

---

## 5 · QUY TẮC DỮ LIỆU CŨ

### 5.1 · Khi nào ĐƯỢC hiện số cũ

Được hiện khi **cả bốn** điều kiện đúng:
1. Số đó **đã từng đo thật** trên đối tượng còn tồn tại (`nguon.doiTuong` còn hợp lệ).
2. Biết **tiền đề nào đã đổi** — `viSaoCu` khai được, và nó đến từ **trạng thái miền đã ghi xuống
   hồ sơ**, không suy từ state giao diện (`vitals-tin-hieu.ts:101` cấm nguyên văn).
3. Biết **đo lúc nào** — `nguon.doLuc` có thật.
4. Người dùng **vẫn còn quyền** với đối tượng đó. Quyền đổi ⇒ số cũ bị **xoá khỏi màn**, không
   được giữ lại như bộ nhớ đệm.

### 5.2 · Dấu hiệu bắt buộc đi kèm

| bắt buộc | vì sao |
|---|---|
| **số mục cần cập nhật** (đếm thật) | `lib/site/vitals-site.ts:31-34` — *"SỐ THẬT, đếm từ `daCu`… luôn mang số, không có câu chung chung"* |
| **miền nào bị ảnh hưởng** | `:39-40` — nơi gọi dùng để đi tới **đúng chỗ**, không phải một trang chung |
| **câu VÌ SAO** | `vitals-tin-hieu.ts:81` — *"Sự thật địa điểm đã đổi, phân tích suy ra từ nó không còn khớp."* Hằng số, không phải chữ AI sinh |
| **mốc đo** (`doLuc`) | không có mốc thì người đọc không phân biệt được *"cũ 5 phút"* với *"cũ 3 tuần"* |

### 5.3 · Khi nào PHẢI TỪ CHỐI hiện

- **Không khai được `viSaoCu`.** Số cũ mà không biết vì sao cũ là số không kiểm chứng được ⇒ về
  `khong-do-duoc`.
- **Số cũ sẽ dẫn tới quyết định không đảo được** (phát hành · khoá bản · xuất giao khách). Ở những
  chỗ đó, cũ ⇒ **chặn và bắt tính lại**, không hiện kèm nhãn rồi để người dùng tự chịu.
- **Cập nhật một miền không được xoá dấu cũ của miền khác.** Test đã khoá:
  `lib/site/vitals-site.test.ts:29-34` — cập nhật `nang` thì `van-hoa`/`thu-cong` **VẪN cũ**, vì
  chúng *"cũ vì lý do khác"*.
- **Hồ sơ trống trơn không phải một cảnh báo.** `lib/site/vitals-site.ts:50` — *"Không có `daCu`
  thì im — kể cả khi hồ sơ trống trơn."* Đó là S1, không phải `cu`.

### 5.4 · Ranh giới với Activity — không được nhập

`lib/site/vitals-site.ts:9-11`: **Activity là BIÊN NIÊN** (giữ cả *"hướng đã đổi"* → *"nắng cần
tính lại"* → *"nắng đã cập nhật"* theo thời gian). **Vitals chỉ giữ dòng CÒN CẦN XỬ LÝ, và biến
mất khi xử xong.** *"Trộn hai thứ là biến khẩu độ thành sổ nhật ký."*

⚠️ **Lỗ dây đã ghi, chưa xác minh lại trong lượt này:** `lib/site/dan-xuat.ts:9` khai
*"`daCu` luôn rỗng ⇒ **Vitals không bao giờ có tín hiệu để báo**. Máy đủ, dây thiếu."*
⇒ trạng thái `cu` có thể **chưa bao giờ tới được người dùng**. `NOT ASSESSED` — cần một lượt
runtime riêng (đúng họ M-03: *"có trong mã ≠ tới được người dùng"*).

---

## 6 · QUY TẮC CHUYỂN ĐỘNG — CHỈ Ý NGHĨA VÀ RÀNG BUỘC

> **Tệp này KHÔNG chốt giá trị thẩm mỹ nào.** Dưới đây là *cái gì báo hiệu cái gì* và *cái gì bị
> cấm*. Đường cong, biên độ, hình thái: quyền của Hoà (§7).

### 6.1 · Ý nghĩa — mỗi chuyển động trả lời một câu

| chuyển động | báo hiệu điều gì | KHÔNG được dùng để |
|---|---|---|
| **nhịp chậm, đều** | *"đang sống, không có gì"* — trạng thái nghỉ | thu hút sự chú ý |
| **nhịp nhanh hơn** | *"có việc ĐANG diễn ra"* (`dang-tai` / `dang-chay`) | báo lỗi |
| **đổi sắc sang ấm** | *"có việc CẦN XEM"* — và **chỉ** loại thật sự cần xem | báo tiến độ. `vitals-tin-hieu.ts:195-197` cố ý **không** kéo `demo-flow` sang `alert`: *"nó là TIẾN ĐỘ trình bày, không phải cảnh báo"* |
| **nở ra từ nguồn** | *"tấm này thuộc về vật vừa bấm"* — giữ trí nhớ không gian | mọc từ hư không. `lib/ui/nhip.ts:4-11` cấm: *"hộp thoại mọc từ hư không · panel trượt từ mép chẳng liên quan · cắt phựt giữa hai hình chữ nhật xa lạ · nảy tưng cho vui"* |
| **thu ngược về chỗ cũ** | *"đóng lại đúng chỗ nó mở ra"* | — |

### 6.2 · Ràng buộc cứng

1. **Thời lượng lấy từ thang đã có, cấm gõ số ms tại chỗ.** `lib/ui/nhip.ts:1-3` — *"đây là NƠI
   DUY NHẤT khai nhịp cho lớp bề mặt nổi"*. Thang: `bam 130 · vien 170 · bang 220 · nguCanh 300 ·
   bienHinh 460` (`:28-33`). **Trần cho một ô Vitals: `NHIP.bang` (220ms)** — nó là *viên/bảng*,
   không phải *biến hình lớn*. `PROPOSED`.
2. **Đóng nhanh hơn mở (~0.8×)** — `lib/ui/nhip.ts:45-49`: *"vào chậm ra nhanh… người dùng đã
   quyết định xong thì đừng bắt họ chờ xem hiệu ứng"*.
3. ⛔ **CẤM NHẤP NHÁY.** Không có trạng thái nào của Vitals được biểu đạt bằng bật/tắt đột ngột
   lặp lại. Lý do: nhấp nháy là kênh **cưỡng bức chú ý**, mà Vitals theo `IF-CANONICAL.md` §11 là
   *"thường trực, im, người dùng chủ động ghé"* — cưỡng bức chú ý là việc của toast.
4. ⛔ **CẤM TỰ BUNG.** `VitalsAperture.tsx:33-35`: *"Khẩu độ này KHÔNG BAO GIỜ tự bung — mọi mức
   đều do người dùng ra cử chỉ. **Tự bung là biến nó thành toast**."*
5. **`prefers-reduced-motion` ⇒ thời lượng về 0ms — HIỆN THẲNG, không phải "chậm lại".**
   `lib/ui/nhip.ts:96-99`, và *"đây là chỗ duy nhất quyết định, nơi gọi không được tự kiểm rồi tự
   chế nhánh riêng"*.
6. **Mọi trạng thái phải phân biệt được ở KHUNG TĨNH**, không phụ thuộc chuyển động và không phụ
   thuộc màu (`VitalsStateBadge.tsx:23-26`). Đây là **điều kiện nghiệm thu**, không phải lời khai —
   xem ca `T-09` ở §7.
7. **Chuyển động không được thay thế thông tin.** Một ô đang chuyển động vẫn phải trả lời được
   *CÁI GÌ · VÌ SAO · NGUỒN · ẢNH HƯỞNG · LÀM GÌ TIẾP* (`IF-CANONICAL.md` §11).

---

## 7 · MA TRẬN KIỂM — mỗi trạng thái một ca chứng minh

> **CA 0 · HARNESS đứng đầu, bắt buộc.** F-15: `sucrase` thoát mã 0 và sinh ra một tệp **RỖNG**;
> import tệp rỗng thành công ⇒ *"máy soi xanh vì nó không soi gì cả"*. Luật: mọi script chứng minh
> phải mở bằng một ca **chứng minh chính nó**, và cổng đỏ thì **cấm in PASS cho mọi ca phía sau**.

| ca | trạng thái cần chứng minh | dựng thế nào | khẳng định |
|---|---|---|---|
| **T-00** | **HARNESS** | nạp đúng module thật đang được kiểm và khẳng định một hằng số chỉ nó mới có — ví dụ `TRAN_TIN_HIEU === 3` (`vitals-tin-hieu.ts:31`) và `THU_TU.length === 5` (`:123`) | sai ⇒ **DỪNG**, không chạy ca nào tiếp |
| **T-01** | `khong-co-du-lieu` | gọi `chonTinHieu({ dangChay: 0, chayLoi: 0 })` — mọi nguồn rỗng | trả `[]`. Đây là ca đã có test khoá (`VitalsAperture.tsx:29-31` dẫn `chonTinHieu({}) === []`) |
| **T-02** | `dang-tai` | `{ dangChay: 2, chayLoi: 0 }` | có đúng 1 tín hiệu `dang-chay`, `so === 2`, `trangThaiAmbient(...) === 'answering'` (`:199`) |
| **T-03** | `dang-tai` **không nhãn** | `{ dangChay: 1, nhanDangChay: '' }` | `chiTiet` **không tồn tại** — chuỗi rỗng coi như không có (`:147-148`). ⛔ cấm sinh `chiTiet: ''` |
| **T-04** | `co-so` (lỗi) | `{ dangChay: 0, chayLoi: 3 }` | 1 tín hiệu `chay-loi`, ambient `alert` (`:200`) |
| **T-05** | `bang-khong` | `{ dangChay: 0, chayLoi: 0, chuanCanXem: 0 }` | trả `[]` — **đo rồi, sạch, vẫn im** (`:155-157`) |
| **T-06** | `khong-do-duoc` (vượt ngưỡng / ném lỗi) | `{ ..., chuanCanXem: undefined }` | trả `[]` **và** ca phải khẳng định `chuanCanXem` là `undefined` chứ không phải `0` — nếu không, T-05 và T-06 là **cùng một ca** và không ca nào chứng minh trục S1/S3/S5 (F-17: khẳng định phải có chủ thể) |
| **T-07** | `khong-do-duoc` (xác thực) — **ca F-02** | dựng nguồn trả 401 cho `site` **và** `projects` cùng lúc; đọc trạng thái ambient | ambient **KHÔNG** phải `idle`/`calm`. **Đây là ca đắt nhất của cả gói** — F-02 đang `FAIL, open`. Cần runtime, `NOT ASSESSED` ở lượt này |
| **T-08** | `khong-quyen` | tài khoản B **không** là member của dự án của A; quan sát **luồng mạng**, không quan sát màn hình | **không có yêu cầu dữ liệu nào được phát** cho ô đó. Kiểm ở tầng mạng, vì kiểm ở tầng pixel không phân biệt được *không tải* với *tải rồi ẩn* (M-03) |
| **T-09** | `cu` | hồ sơ có `daCu: ['nang.gocChieu', 'nang.gioNang']` | `so === 2`, `chiTiet` liệt kê đúng miền (`vitals-site.test.ts:17-20`) |
| **T-10** | `cu` — **cập nhật một miền** | `daCu: ['nang.gocChieu','van-hoa.det','thu-cong.gom']`, cập nhật `nang` | `nang` bị gỡ, `van-hoa` và `thu-cong` **VẪN cũ** (`vitals-site.test.ts:29-34`) |
| **T-11** | **trần 3 tín hiệu** | dựng nguồn cho **cả 5** loại cùng có dữ liệu | trả đúng **3** phần tử, theo `THU_TU` (`:123`), không phải 5 |
| **T-12** | **cửa vào chữ tự do** | thử truyền một mã miền không thuộc `MaMien` | `tsc` đỏ. Union chữ chết là **cửa duy nhất** (`vitals-tin-hieu.ts:104-109`) — nếu `tsc` xanh thì cửa sau đã mở |
| **T-13** | **giảm chuyển động** | `matchMedia('(prefers-reduced-motion: reduce)')` → khớp | `thoiLuong(220) === 0` (`lib/ui/nhip.ts:99`) **và** chụp khung tĩnh, đối chiếu 5 trạng thái phân biệt được bằng mắt — máy không đo được vế sau (M-01) |
| **T-14** | **tới được người dùng** | mở app thật, đi qua các cảnh C-01…C-15 của tệp `01-TARGET-REJECT-STORYBOARD.md` | ảnh app thật, sáng lẫn tối. `IF-CANONICAL.md` §7: *"thiếu mắt là chưa xong"*; M-01: không ảnh app thật ⇒ **trần cứng là PARTIAL** |

### Luật viết ca — rút từ ledger, áp cho chính ma trận này

- **Một nhóm ca chỉ toàn kỳ vọng "không thấy" là nhóm không đáng tin** (F-17). T-01/T-05/T-06 đều
  kỳ vọng `[]` ⇒ **bắt buộc** đi kèm T-02/T-04/T-09 (kỳ vọng **THẤY**) trên cùng đường dữ liệu.
- **Có test cho đường thoái lui mà không có test khẳng định đường CHÍNH chạy được ⇒ test che bug**
  (M-04).
- **Khẳng định phủ định phải kèm đầu ra nguyên văn của lệnh đã chạy** (M-55).
- **Câu hỏi "X có tồn tại không" ⇒ cấm `grep -c`, dùng `grep -n`** (M-55).

### `NOT ASSESSED` của tệp này

| chỗ | lý do |
|---|---|
| T-07 · T-08 · T-13 (vế mắt) · T-14 | cần runtime + ảnh app thật; lane này không chạy dev server |
| Trạng thái `cu` có tới được người dùng không | `lib/site/dan-xuat.ts:9` khai *"máy đủ, dây thiếu"* — chưa xác minh lại |
| F-02 đã vá chưa | ledger ghi `FAIL, open`; không kiểm lại trong lượt này |
| Ô Vitals hiện có mount ở mọi màn không | `VitalsAperture.tsx:20-28` khai `VitalsGesture` đã mồ côi và chip ở `StatusBar` *"bấm vào không ra gì"* — đó là **lời khai trong docstring**, chưa phải phép đo (M-11) |
| Bề mặt UI cho `429`/credit | `grep "429" --include=*.tsx components app` chỉ trả một `path` SVG không liên quan (`components/entry/LoginForm.tsx:576`) ⇒ **không có bề mặt nào**. Trạng thái `khong-do-duoc · lyDo:'xac-thuc'` chưa phủ ca hết-credit; cần một nhánh `lyDo` riêng khi có nơi tiêu thụ thật |
| Union `OVitals` có xung đột với hợp đồng `TinHieu` hiện có không | chưa thi công, chưa chạy `tsc`. Đây là **đề xuất tài liệu** |

---

## 8 · THẨM QUYỀN

Gói này chốt **TRẠNG THÁI và NGỮ NGHĨA** — máy trạng thái, hình dạng kiểu, luật quyền-trước-tải,
luật dữ liệu cũ, ràng buộc chuyển động, ma trận kiểm.

**Mắt và chuyển động cuối cùng là quyền của Hoà. Không agent nào thay.**

Mọi giá trị thẩm mỹ trong tài liệu này — trần thời lượng 220ms, cách sắc ấm biểu đạt cảnh báo,
hình thái ô, nhịp thở, cách một ô "nở ra từ nguồn" trông ra sao — là **ĐỀ XUẤT**, đánh dấu
`PROPOSED`, **chờ Hoà duyệt**. Chúng không có hiệu lực chỉ vì đã được viết ra ở đây.

Chiếu `IF-CANONICAL.md` §2: **Claude Design** giữ thẩm quyền bố cục người dùng nhìn thấy ·
**MAIN** là người ghi sản xuất · **chỉ Hoà** được nâng `CANDIDATE → APPROVED`.
Gói này đang ở **CANDIDATE**.
