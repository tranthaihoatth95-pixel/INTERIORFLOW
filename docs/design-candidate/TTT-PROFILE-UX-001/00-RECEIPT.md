# BIÊN NHẬN — TTT-PROFILE-UX-001

**Nhận:** CLAUDE MAIN · 26/08/2026
**Chế độ phiên này:** `DESIGN` — **read-only trên production**. Không sửa `app/`, `components/`, `lib/`, `prisma/`.
**Nhánh:** `checkpoint/2026-08-24-control-plane`
**Trạng thái giao nộp:** `CANDIDATE` — chờ Hoà duyệt mắt.
**Canvas họ artifact:** https://claude.ai/code/artifact/c87eb06d-8369-474e-9402-3417527e29b8
**Tệp nguồn candidate:** `docs/design-candidate/TTT-PROFILE-UX-001/artifacts/` — xem `MANIFEST.json`

---

## 1 · ĐÃ HIỂU ĐÚNG ĐỀ BÀI?

Xác nhận ba điều cốt lõi, nếu tôi hiểu sai thì dừng tôi ở đây:

1. **TTT là HỒ SƠ KHÁCH HÀNG ĐẦU TIÊN, không phải cấu trúc mặc định của IF.**
   Sản phẩm phải trung tính; TTT là một *tenant* ánh xạ vào mô hình trung tính qua **configuration adapter**.
2. **Chức danh tổ chức ≠ quyền truy cập.** Reporting line và permission là **hai đồ thị khác nhau**,
   không được vẽ chồng lên nhau, không được suy ra nhau.
3. **Workload/OT là để nhìn TẢI NGUỒN LỰC, không phải chấm điểm con người.**
   Đây là ràng buộc đạo đức, không phải tuỳ chọn hiển thị.

## 2 · MÔ HÌNH TRUNG TÍNH — như đã nhận

```
Organization → Legal Entity → Division → Department → Team → Position → Person
```
Tách riêng, KHÔNG gộp vào cây trên:
```
Person → Membership · Reporting Line · Project Assignment · Product Permission · Workload/Availability
```

## 3 · DANH SÁCH ARTIFACT DỰ KIẾN — 13 mục, có mã bền

| Mã | Artifact | Trạng thái |
|---|---|---|
| `IF-PO-01` | System map · navigation placement | ✅ **CANDIDATE — đã dựng, chờ duyệt** |
| `IF-PO-02` | Organization Overview | ⏳ xếp hàng |
| `IF-PO-03` | Organization Map (Tree · Network · Compact List) | ⏳ |
| `IF-PO-04` | People Directory | ⏳ |
| `IF-PO-05` | Person Profile | ⏳ |
| `IF-PO-06` | Team Profile | ⏳ |
| `IF-PO-07` | Project Staffing | ⏳ |
| `IF-PO-08` | Workload / OT Insight | ⏳ |
| `IF-PO-09` | Collaboration Flow (capability flow cấu hình được) | ⏳ |
| `IF-PO-10` | Member · Invite · Permission states | ⏳ |
| `IF-PO-11` | Empty · loading · error · offline · stale · denied · conflict | ⏳ |
| `IF-PO-12` | Desktop · tablet · touch · reduced modes | ⏳ |
| `IF-PO-13` | Interaction storyboard (zoom · drill-down · select · add member · assignment · rollback) | ⏳ |

**Một họ artifact thống nhất, không phải mock rời** — cùng một canvas, cùng token, cùng khuôn thẻ,
cùng ngữ pháp icon và chuyển động.

## 4 · 🔴 LỆCH SO VỚI ĐỀ BÀI — báo trước, không giấu

**`Claude Design project/artifact ID` không lấy được trong môi trường này.**
Bản Claude Design chạy ở đây là **canvas nhúng trong Artifact**, không phải project trên claude.ai;
`import` / `export` / `status` / `sync` **không có** ở preview này.
⇒ Tôi dùng **URL artifact** làm định danh, và ghi rõ đây là **lệch**, không phải tương đương.
Nếu bắt buộc phải có project ID thật thì cần một phiên có đăng nhập claude.ai và chính sách tổ chức cho phép.

## 5 · 🔴 RỦI RO PHÁT HIỆN NGAY KHI NHẬN VIỆC

Tôi grep `TTT` trong `app/ components/ lib/` — **5 chỗ, tất cả là GHI CHÚ về việc đã gỡ thương hiệu**,
không phải nhãn sống. Nhưng một chỗ chỉ ra nợ cũ chưa trả:

> `components/entry/LoginBackdrop.tsx:8` — thư viện 30 ảnh `public/wallpapers/ttt-01..30.jpg`

Đây là **ảnh render công trình của khách**, đã bị ghi 🔴 trong `docs/AUDIT-BRAND-PII.md` và **vẫn còn**.
Nó **không thuộc phạm vi task này**, nhưng nó **mâu thuẫn trực tiếp** với luật *"không hardcode tài sản TTT"*
mà task này dựng lên. Báo để Hoà quyết — tôi **không tự xoá**.

## 6 · DỮ LIỆU DÙNG TRONG DESIGN

- **Toàn bộ synthetic.** Tên người, tên đơn vị, ảnh — do IF tự sinh.
- **Không có PII của TTT** ở bất kỳ tệp nào trong repo global.
- **Không dùng số 430** làm mặc định. Số trong bản vẽ là số tổng hợp, và mỗi con số
  đều kèm **ngày chụp** + **nguồn**.
- Mọi số tổng hợp hiển thị kèm `snapshot date` và `source`; lệch thì hiện **“Needs verification”**,
  **không tự sửa**.

## 7 · ⛔ DESIGN / ARCHITECTURE MISSING — chưa chốt, KHÔNG BỊA

Design dùng **synthetic contract** và ghi nhận các chỗ chưa có nguồn chân lý:

1. **Domain schema thật của Organization/Person/Membership** — chưa tồn tại trong `prisma/`.
2. **Product Permission model** — chưa có định nghĩa quyền cho `workload`, `OT`, `HR data`.
3. **Nguồn dữ liệu HRM** và cơ chế đồng bộ (đẩy/kéo, tần suất, ai là nguồn chân lý khi lệch).
4. **Tenant capability flag** — chưa có hạ tầng feature flag theo tenant trong repo.
5. **Audit trail** — chưa có bảng/luồng ghi nhật ký cho export · role change · assignment · sensitive view.
6. **Định nghĩa "quá tải"** — ngưỡng nào là quá tải? Đây là quyết định của tổ chức, không phải của tôi.

⇒ Không có sáu thứ trên thì **P0 domain/permission contract không thể chốt**.
Design vẫn đi tiếp bằng hợp đồng synthetic, nhưng **mọi trường đều đánh dấu nguồn = SYNTHETIC**.

## 8 · TÔI SẼ KHÔNG LÀM

- Không sửa production trong phiên này.
- Không bịa schema rồi trình bày như đã chốt.
- Không đưa dữ liệu TTT vào mock/fixture/analytics.
- Không dựng dashboard card-wall (đề bài cấm, và tôi đồng ý).
- Không chép skin của Workday / SAP / Lark / Microsoft.
- Không để AI tự đổi assignment — AI **đề xuất**, người **quyết**.

## 9 · BƯỚC KẾ TIẾP

1. Dựng `IF-PO-01` → publish canvas riêng cho họ artifact.
2. Hoà duyệt mắt `IF-PO-01` (đặc biệt: **chỗ đặt trong router**) trước khi tôi dựng 12 cái còn lại —
   vì nếu placement sai thì cả 12 cái sau sai theo.
3. Sau eye review → mở phiên Product/Data kiểm domain và permission.

---

## 10 · BIÊN NHẬN GHI/XOÁ — phiên này

**ĐÃ TẠO (3 tệp, không tệp nào thuộc production):**
- `docs/design-candidate/TTT-PROFILE-UX-001/00-RECEIPT.md` — tệp này
- `IF-PO-01.dc.html` — artifact 01
- `po-canvas.json` — bố cục canvas họ artifact

**ĐÃ SỬA:** không có.
**ĐÃ XOÁ:** không có.
**PRODUCTION (`app/` `components/` `lib/` `prisma/`):** **KHÔNG CHẠM.**

> Ghi chú kỹ thuật: công cụ seed canvas yêu cầu một artboard tên `Main.dc.html`.
> Tôi đã **tạm** đổi tên, seed, rồi **trả `Main.dc.html` về nguyên trạng** — đã kiểm lại sau khi trả.
> Đây là hạn chế của công cụ, không phải thay đổi thiết kế.

## 11 · CHƯA LÀM — và vì sao

**12 artifact còn lại CỐ Ý CHƯA DỰNG.**
Không phải vì thiếu thời gian — mà vì `IF-PO-01` chốt **chỗ đặt** và **ranh giới hai đồ thị**.
Sai một trong hai thì cả 12 cái sau sai theo, và sửa lúc đó tốn gấp mười.

**Cần Hoà duyệt mắt ba điểm trước khi tôi đi tiếp:**
1. **Chỗ đặt** — `Projects / Studio Administration → People & Organization`. Đúng chưa?
2. **Hai đồ thị rời** — cây tổ chức và quan hệ của người là hai thứ khác nhau, không suy ra nhau.
3. **Collaboration Flow đặt tên theo NĂNG LỰC**, không theo chuỗi của TTT.
   Chuỗi *Marketing/KAM → Tender → Design → Project → Manufacturing → After Sales* trong đề bài
   là **chuỗi của MỘT khách**; lấy nó làm mặc định là đưa bản sắc TTT vào sản phẩm.
   Đây là chỗ tôi **diễn giải đề bài**, nên cần Hoà xác nhận tôi hiểu đúng.
