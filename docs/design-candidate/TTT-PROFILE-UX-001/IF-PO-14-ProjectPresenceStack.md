# IF-PO-14 · ProjectPresenceStack

| | |
|---|---|
| **Design ID** | `IF-PO-14` |
| **Version** | `v0.1` |
| **Trạng thái** | `CANDIDATE · ALIGNED` |
| **Nguồn** | `TTT-PROFILE-UX-001` + chốt Hoà 26/08/2026 |
| **Artifact** | https://claude.ai/code/artifact/c87eb06d-8369-474e-9402-3417527e29b8 |
| **Tệp nguồn** | `artifacts/IF-PO-14.dc.html` · `artifacts/po-canvas.json` |
| **Dữ liệu** | SYNTHETIC — không PII |
| **Production** | ❌ chưa có · **Runtime** ❌ chưa kiểm |

---

## 1 · ÁP DỤNG TẠI — sáu nơi, MỘT primitive

`Project Legacy` · `Hồ sơ công trình` · `Project cards` · `Widget Công trình (Home)` ·
`Project Lens` · `Project Reel` *(hai cái sau: khi đủ không gian)*

## 2 · HỢP ĐỒNG — 9 điều

1. Tối đa **3 avatar**, sau đó `+N`.
2. Chồng khoảng **một phần ba**.
3. Viền lấy **token của bề mặt chứa** — không dùng trắng cố định.
4. Cỡ theo context: **18 / 20 / 24px**. Cỡ theo **bề mặt**, không theo dữ liệu.
5. Cùng `projectId` ⇒ **cùng tập presence/membership đã được phép nhìn**.
6. **Không ghi role** trực tiếp lên thẻ dự án.
7. Hover/focus/tap mở **popover ngắn**; *“Xem đội dự án”* mới đi vào Project Staffing.
8. Keyboard · touch · screen reader **đọc được SỐ NGƯỜI** — `aria-label="Đội dự án: 5 người"`.
9. **Không dùng màu avatar** để biểu diễn role hay trạng thái duy nhất.

## 3 · ĐIỀU CHỈNH BẮT BUỘC — đã nhận, đã sửa

**Cụm biểu diễn ĐỘI DỰ ÁN. Nó KHÔNG tự khẳng định ai đang online.**
Presence là **lớp thêm vào**, chỉ hiện khi có **nguồn presence thật**.

### Ba trạng thái KHÔNG được trộn
| | nghĩa | nhịp đổi |
|---|---|---|
| **Membership** | thuộc team nào | bền, đổi hiếm |
| **Project Assignment** | được giao dự án nào, vai trò gì, từ–đến | theo dự án — **đây là thứ cụm biểu diễn** |
| **Presence** | đang mở app hay không | thoáng qua, giây một |

Trộn ba cái là nguồn của mọi hiểu nhầm: một người **còn trong đội** nhưng **hết hạn assignment**,
hoặc **đang online** nhưng **không thuộc dự án này**.

## 4 · QUYỀN — kiểm TRƯỚC khi tải

| Ca | Hiển thị |
|---|---|
| Có quyền xem đội | avatar + tên. Ảnh chỉ tải **SAU** khi quyền trả về |
| Chỉ thấy tổng hợp | **số người**, không danh tính |
| Khách của dự án | chỉ thành viên **thuộc phạm vi được chia sẻ** |
| Không có quyền | **không hiện cụm** — không ô trống, không ổ khoá |
| ✕ **SAI** | tải avatar + tên rồi che bằng CSS — **dữ liệu đã ra khỏi máy chủ** |

## 5 · HỎNG · THIẾU · DÀI

- **Mất ảnh** → chữ cái đầu tên, không phải ô xám trống
- **Đang tải** → ba ô mờ, **không nhảy số**
- **Tên dài** → cắt bằng dấu ba chấm; **cụm avatar không co lại**

## 6 · TÁM ĐIỀU QUALITY PHẢI KIỂM — chưa cái nào PASS

1. Cùng project cho kết quả nhất quán ở cả sáu nơi
2. `+N` tính đúng
3. **Permission-before-load**
4. Avatar lỗi/mất ảnh có fallback
5. 18/20/24px vẫn nhận diện được
6. Không vỡ ở 1100px · touch · tên dài
7. Click mở đúng Project Staffing
8. **Ảnh chứng minh trên Electron thật**

## 7 · 🔴 NỢ HIỆN TẠI

Bốn chỗ trên canvas IF (`ProjectLegacy` · `HoSoCongTrinh` · `ManDuAn` · `Main`)
đang là **bản vẽ tay, CHƯA qua primitive, CHƯA có cổng quyền**.
⇒ Production **phải thay cả bốn bằng primitive** trước khi dùng với dữ liệu thật.

## 8 · BIÊN NHẬN GHI/XOÁ

**TẠO:** `IF-PO-14.dc.html` · tệp này
**SỬA:** `po-canvas.json` (thêm 1 artboard + 1 ghi chú)
**XOÁ:** không có
**PRODUCTION:** không chạm
