# TRANSFER NOTE — HOME: SỰ THẬT TRẠNG THÁI + HỢP ĐỒNG ẢNH · 22/08/2026

> Phiên UX/UI **DESIGN-ONLY**. Ghi chú này là **bằng chứng đọc từ code thật**, không phải bản vá.

## 1 · SỰ THẬT TRẠNG THÁI — kiểm bằng lệnh, không suy từ tên tệp

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Home campaign mới còn DESIGN-ONLY? | **CÒN** | `find app components lib server prisma -newermt '-30 minutes'` → **rỗng** |
| Có phần nào đã merge vào production? | **KHÔNG** | `grep -rn "claude-home-living-canvas\|claude-liquid-glass\|claude-home-widget\|Home.dc.html" components lib app` → **0 dòng** |
| Home production sửa lần cuối khi nào? | **17/08**, 5 ngày trước | `git log -1 -- components/home/DongStudioHome.tsx` → `ae1a208 2026-08-17` |
| Hoà đã duyệt mắt bản mới chưa? | **CHƯA** | chỉ số ghi `APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt` |
| localhost đang chiếu bản nào? | **BẢN CŨ ĐANG SHIP** — đúng và cố ý | không có gì được merge |

### Bảng trạng thái phải ghi như sau, không được ghi khác
```
HOME
  Design:        CANDIDATE (chưa Hoà duyệt)
  Implementation: OLD PRODUCTION
  Visual Match:   FAIL
  Real Browser:   PASS — chỉ như bằng chứng của TRẠNG THÁI CŨ
```
⛔ **Không được gọi Home là "đã hội tụ" / "visually complete".**

### Tệp ứng viên hiện có (campaign 22/08)
- `docs/mocks/claude-home-living-canvas-final.html` — vỏ + 2 trạng thái + thang độ sâu
- `docs/mocks/claude-home-widget-system.html` — bộ widget MVP
- `docs/mocks/claude-liquid-glass-system.html` — vật liệu kính + Vào xưởng
- ⛔ `docs/mocks/Home.dc.html` — **SUPERSEDED** (bố cục 4 dải, bị bác theo §4/§41). Giữ làm dấu vết, **cấm dựng**.

---

## 2 · 🔴 HỢP ĐỒNG ẢNH HOME — HAI LỖI THẬT, ĐÃ ĐO

### Lỗi ① — SAI NGUỒN
`components/home/widgets/WeeklyImage.tsx:6` tự khai nguồn:
> *"…(`usage:'ref-render'`, đọc từ `/api/library` — chỉ ĐỌC)"*

⇒ Ô **"ẢNH ĐẸP TUẦN NÀY"** đang lấy **ảnh render / tài sản tham chiếu**, tức **đầu ra của app**,
chứ KHÔNG phải ảnh tuyển từ Gallery/Explore. Đó chính là lý do trên màn hiện ra **viewport 3D của
chính app**. Ảnh loại này **không có nguồn, không có provenance** ⇒ sai cả về nghĩa lẫn về luật.

**Hợp đồng đúng:** nguồn PHẢI là **Gallery / Explore**, và mỗi ảnh phải mang **danh tính +
nguồn** (`img_…` từ `lib/img-id.ts`, đã có sẵn).
**CẤM** dùng: ảnh chụp viewport 3D · ảnh chụp màn hình app · ảnh fixture demo · preview dự án tuỳ
tiện · ảnh "đẹp tuần này" bịa ra.
**Không có ảnh hợp lệ ⇒ ẨN Ô ĐÓ** (zero-state), **TUYỆT ĐỐI không bịa một tấm cho có.**
Đây đúng luật đã chốt: *widget thiếu dữ liệu thì TỰ ẨN*.

### Lỗi ② — SAI CÁCH ĐẶT ẢNH VÀO KHUNG
`components/home/widgets/WeeklyImage.tsx:58`
```
className="weekly-image-frame absolute inset-0 h-full w-full object-cover"
```
`object-cover` = **cắt phăng** để lấp đầy khung ⇒ đúng hiện tượng "ảnh bị phóng to / cắt cụt".

**LUẬT ẢNH (mới):** người dùng phải **NHÌN THẤY TRỌN TẤM ẢNH**.
- giữ đúng tỉ lệ gốc · vừa trong khung · căn giữa · **không kéo giãn · không cắt hung hãn**
- hành vi tương đương **`object-fit: contain`**
- khung lệch tỉ lệ với ảnh ⇒ giải bằng **nền lấy từ chính ảnh / ambient**, bằng **khoảng trống**,
  hoặc bằng **khung tiết chế** — **KHÔNG** giải bằng cover-crop.

> **Ảnh là NỘI DUNG. Khung PHỤC VỤ ảnh.** Không phải ngược lại.

---

## 3 · Ba việc kèm theo, đừng làm sai thứ tự
1. **KHÔNG đánh bóng Home 4-dải hiện tại.** Nó đã superseded — sửa CSS thẻ của nó là phí công.
   Chỉ **giữ lại phần HÀM và HỢP ĐỒNG DỮ LIỆU thật** sẽ tái dùng.
2. **Sidebar hiện tại chưa phải bản cuối.** Dùng target Sidebar Map chính tắc; **không được để rail
   demo/cũ nguyên đó rồi tuyên bố Home đã hội tụ.** Vỏ mới (rail 52 · top bar · Vitals Edge) nằm
   trong `claude-home-living-canvas-final.html`.
3. Khi Hoà duyệt: **THAY bố cục Home cũ**, không vá lên nó.

⚠️ **Cấm merge bản ứng viên khi Hoà chưa duyệt mắt.**
