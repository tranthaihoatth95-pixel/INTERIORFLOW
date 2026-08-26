# ④ NEUTRAL PEOPLE & ORGANIZATION CONTRACT

> **Loại:** `PROPOSED` — chưa có gì trong mã. Không phải OBSERVED.
> **Tình trạng:** `PROVISIONAL CONTRACT` — dùng để thiết kế và test, **KHÔNG viết vào production schema**.
> **Cổng:** toàn bộ đứng sau `tenant capability flag`. **Có rollback.**
> HEAD `a08378a` · task `IF-ARCH-LOCAL-FIRST-LARK-001`

---

## 0 · HAI LUẬT QUYẾT ĐỊNH HÌNH DẠNG HỢP ĐỒNG

**Luật 1 — `Organization role ≠ Product permission`.**
Không có trường nào trong cây tổ chức được dùng để suy ra quyền. Quyền là **đồ thị riêng**,
cấp tường minh, và **không kế thừa** theo chức danh.

**Luật 2 — bốn thứ này là BỐN trạng thái, không phải một.**

| | nghĩa | nhịp đổi | nguồn |
|---|---|---|---|
| `Membership` | thuộc đơn vị nào | bền, đổi hiếm | HRM |
| `ReportingLine` | báo cáo ai | bền | HRM |
| `ProjectAssignment` | giao dự án nào, vai trò gì, từ–đến | theo dự án | IF |
| `Presence` | đang mở app | giây một | runtime |

Trộn bốn cái là nguồn của mọi hiểu nhầm. Một người có thể **còn membership** nhưng
**hết hạn assignment**; hoặc **đang online** nhưng **không thuộc dự án đang xem**.

---

## 1 · THỰC THỂ — cây tổ chức

```ts
// Mọi thực thể đều mang provenance. Không có ngoại lệ.
interface Provenance {
  externalId:  string | null   // ID bền ở hệ nguồn — KHÔNG phải id nội bộ
  source:      'IF' | 'IMPORT' | 'MANUAL'
  sourceSystem: string | null  // 'lark' | 'csv' | … — chỉ là NHÃN, không phải phụ thuộc
  syncedAt:    string | null   // ISO
  stale:       boolean         // nguồn đã đổi mà chưa nhập lại
  confidence:  'VERIFIED' | 'IMPORTED' | 'INFERRED'
}

interface Organization  { id; name; provenance }
interface LegalEntity   { id; organizationId; name; jurisdiction?; provenance }
interface Division      { id; legalEntityId;  name; provenance }
interface Department    { id; divisionId;     name; provenance }
interface Team          { id; departmentId;   name; leaderPersonId?; provenance }
interface Position      { id; teamId; title;  level?; provenance }
interface Person        { id; displayName; email?; avatarRef?; status:'ACTIVE'|'INACTIVE'; provenance }
```

**Chú ý — `Person.email` là tuỳ chọn và là PII.** Xem `05-DATA-CLASSIFICATION`.
**`Team.leaderPersonId` tuỳ chọn** — ca *"leader chưa có team"* và *"team chưa có leader"* đều hợp lệ,
phải hiện **“Needs verification”**, **không tự sửa**.

## 2 · QUAN HỆ — bốn đồ thị RỜI

```ts
interface Membership       { id; personId; teamId; positionId?; from; to?|null; provenance }
interface ReportingLine    { id; personId; managerPersonId; kind:'DIRECT'|'DOTTED'; from; to?|null; provenance }
interface ProjectAssignment{ id; personId; projectId; role:AssignmentRole;
                             workstream?; from; to?|null; provenance }
interface Permission       { id; principalId; scope:'GLOBAL'|'PROJECT'|'TEAM';
                             scopeId?|null; capability:Capability;
                             grantedBy; grantedAt; expiresAt?|null }   // ⛔ KHÔNG có provenance từ HRM
interface Availability     { id; personId; window:{from;to};
                             committedHours; capacityHours;
                             observedOrInferred:'OBSERVED'|'INFERRED'; source; syncedAt }
```

```ts
type AssignmentRole = 'RESPONSIBLE' | 'SUPPORT' | 'APPROVER' | 'OBSERVER'
type Capability =
  | 'people.read.basic'      // tên + avatar
  | 'people.read.contact'    // email, số điện thoại — PII
  | 'people.read.hr'         // chức danh, phòng ban, lịch sử
  | 'workload.read.aggregate'| 'workload.read.person'
  | 'staffing.propose' | 'staffing.commit'
  | 'org.import' | 'org.export'
```

**`Permission` KHÔNG mang `provenance`** — cố ý. Quyền **không được nhập từ HRM**.
Nhập chức danh thì được; nhập quyền thì không.

## 3 · ADAPTER — Lark → hợp đồng trung tính

> Lark là **`TENANT CONNECTOR CANDIDATE`**, không phải domain model, không phải source-of-truth mặc định.
> Kết luận nhãn thật do **Phiên B** đưa ra bằng bằng chứng — mục này là *hình dạng adapter nếu Lark được chọn*.

```
LarkPersonRef.larkAccount  →  Provenance.externalId   (source='IMPORT', sourceSystem='lark')
LarkPersonRef.fullName     →  Person.displayName
LarkPersonRef.title        →  Position.title          ⚠ Lark PHẲNG: không có Team/Department thật
LarkPersonRef.department   →  Department.name         ⚠ chỉ là CHUỖI, phải khớp mờ rồi NGƯỜI xác nhận
LarkPersonRef.isCrea       →  ⛔ KHÔNG map. Cờ riêng của một tổ chức.
LarkPersonRef.syncedAt     →  Provenance.syncedAt
LarkUserMap.userId         →  liên kết Person ↔ tài khoản IF (KHÔNG phải quyền)
```

**Bốn thứ Lark KHÔNG cung cấp, và adapter KHÔNG được bịa:**
`LegalEntity` · `Division` · `Team` · `ReportingLine`.
⇒ Nhập từ Lark cho ra một cây **CỤT**: Organization → (thiếu) → Department(chuỗi) → Person.
Phần thiếu phải do **người dựng trong IF**, hoặc từ nguồn thứ hai.

**Chiều đồng bộ mặc định:** `READ-ONLY IMPORT → PREVIEW → HUMAN CONFIRM`.
Không ghi ngược về Lark. Không tự áp thay đổi.

## 4 · TÁM CA COUNT-MISMATCH — hợp đồng phải biểu diễn được

| ca | hợp đồng xử lý thế nào |
|---|---|
| tổng org ≠ tổng division | `stale=true` + **“Needs verification”**, giữ CẢ HAI số, không tự sửa |
| division ≠ tổng department | như trên, chỉ rõ tầng nào lệch |
| một người nhiều membership | **hợp lệ** — `Membership[]`, không phải lỗi |
| leader chưa có team | `Team.leaderPersonId` null-able ⇒ hợp lệ, gắn cờ |
| position không có reporting line | `ReportingLine` là bảng RỜI ⇒ vắng là hợp lệ, gắn cờ |
| assignment hết hạn | `to < now` ⇒ **không hiện ở đội hiện tại**, vẫn còn trong lịch sử |
| HRM cũ/stale | `Provenance.stale` + `syncedAt` hiện trên mặt |
| không có quyền xem workload | `Capability` thiếu ⇒ **không tải**, không phải tải rồi che |

## 5 · ⛔ RỦI RO DI TRÚ VÀ PHỤ THUỘC

1. **Chưa có khái niệm tenant trong schema hiện tại** *(chờ Phiên A/D xác nhận bằng chứng)*.
   Không có tenant thì **mọi bảng People đều là bảng dùng chung** — đây là rủi ro nặng nhất.
2. `Person` ≠ `User`. IF đã có `User`. **Không được gộp**: một Person có thể **không bao giờ đăng nhập**.
   Cầu nối là `LarkUserMap`-kiểu, tức bảng liên kết riêng.
3. Thêm 12 model là **thay đổi schema lớn**. Bắt buộc: migration thuận nghịch, feature flag,
   và **không migration phá dữ liệu**.
4. `Availability` phụ thuộc định nghĩa **"quá tải"** — **chưa có authority**. Để `INFERRED` cho tới khi có.

## 6 · KHÔNG LÀM

- Không viết 12 model này vào `prisma/schema.prisma` trong task này.
- Không copy nguyên schema Lark làm domain.
- Không để `isCrea` hay bất kỳ cờ riêng của một tổ chức nào lọt vào hợp đồng.
- Không suy quyền từ chức danh.
