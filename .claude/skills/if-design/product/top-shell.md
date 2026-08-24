# TOP SHELL — vỏ app, sáu ổ đứng yên

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — bộ khung sáu ổ dùng chung cho mọi bề mặt. **Vị trí và kích thước sáu ổ KHÔNG đổi khi đổi
mode trong cùng chặng — chỉ RUỘT đổi.** **[N]** docstring của chính vỏ.

**KHÔNG PHẢI** — nơi chứa lối đi (đó là bản đồ) · nơi chứa công cụ chặng · nơi bày trạng thái.

**Sáu ổ:** ⓪ rail (bản đồ) · ① header · ② navigator **214px** · ③ stage · ④ inspector **236px** ·
⑤ toolbelt (dock kính nổi) · ⑥ status **26px**.

⚠️ **ĐỪNG LẪN Ổ ⓪ VỚI Ổ ②** — cảnh báo ghi ngay trong mã: ⓪ = **bản đồ app**, y hệt ở mọi chặng;
② = **nội dung của chặng**. Gộp hai ổ = mất bản đồ.

**Ba cụm trong header:** trái = dự án · chặng · giữa = ổ Vitals · phải = thông báo · hiện diện · avatar.

## 2 · VIỆC CỦA CON NGƯỜI
Biết mình đang mở cái gì · gọi được thứ dùng ở mọi màn (tìm · hỏi · thông báo · tôi là ai) · và
**không bao giờ phải học lại vị trí** khi đổi chặng.

## 3 · NHÂN VẬT CHÍNH
**Ổ ③ (stage).** Vỏ phải nhường: chrome không được nuốt canvas. Đo được ở 2D — canvas chiếm **93%
bề ngang** màn 1440. Đó là màn duy nhất có nhân vật chính rõ và đúng.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép | Ghi chú |
|---|---|
| Header **một hàng** | **đã đạt** — một dòng phẳng |
| Bậc thang nhường chỗ khi chật | **đầu đề dự án nén/cắt TRƯỚC**; ổ giữa **không nhúc nhích** |
| Vitals ở ổ giữa | neo theo **tâm vùng làm việc**, không theo flex |

| Bị từ chối | Lý do |
|---|---|
| Thêm một hàng thanh công cụ | **NEVER ADD A TOOLBAR ROW** — recompose, đừng thu nhỏ |
| Đưa Vitals trở lại một cụm flex | ca hỏng 20/08: nó **neo nhầm hệ** (bám hệ danh-tính), không phải neo sai chỗ. Cảnh báo cứng trong mã |
| Hộp co giãn chứa thứ không co được | **luật đã vỡ một lần 30/07** — đo được **4px chồng ở 1024px** |
| Danh tính giả ở lớp vỏ | xem §7 |

## 5 · TRẠNG THÁI
Chưa đăng nhập → cụm phải tự ẩn; vỏ vẫn dựng đủ (xem `cold-open-auth.md` §7 ca B2).
Hiện diện chỉ một mình → phần hiện diện tự ẩn (luật *thiếu dữ liệu thì tự ẩn*, 13/08).
Ổ ⑤ toolbelt: **có ổ, nhưng chưa "luôn hiện"** — xem §8.

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 30/07 | Xoá nút "Chạy flow" khỏi header; "Tệp ▾" rời header |
| 17/08 | Gỡ bộ chuyển chặng khỏi header (tệp giữ lại làm đường quay đầu) |
| 20/08 | Bậc thang nhường: đầu đề dự án nén trước, ổ Vitals không nhúc nhích |
| 23/08 | Vỏ **đã đứng yên** — câu *"3 chặng như 3 app"* **không còn đúng ở tầng vỏ** |

## 7 · CA HỎNG THẬT

**① `Untitled flow` hiện trên 10/13 bề mặt — DANH TÍNH GIẢ Ở LỚP VỎ.** Đây **không phải fixture**:
nó là tên mặc định thật khi tạo flow, khai cứng ở **6 nơi**. Nhưng ở **vỏ ứng dụng** nó đọc ra như
*"app chưa biết mình đang mở cái gì"*. ⇒ **Vấn đề là CHỖ HIỂN THỊ, không phải dữ liệu.** Sửa một màn
không giải quyết được — nó ở vỏ dùng chung. Hạng **FAIL hệ thống**, xếp **việc số 2** sau ca B2.
Dấu vết còn trên đĩa: hai thư mục `<id> — Untitled flow/` bị tạo nhầm.
**[IF]** Nối thẳng `SKILL.md §12`: *một thứ chưa được đặt tên thì là chưa được đặt tên — không phải
"Untitled flow" được thăng lên làm danh tính sản phẩm.*

**② Header 42px CHƯA phủ toàn app.** Chiều cao 42px chỉ áp dụng khi một cờ được bật; mặc định tắt ⇒
Render/Present còn dùng vỏ cũ với chiều cao khác. **Spec một-con-số, thực tế hai-con-số.**

**③ Icon trộn nguồn — 13/13 bề mặt.** Không màn nào 100% một bộ icon. Nặng nhất một màn cài đặt
(10 hình ngoài hệ). Vỏ chung: **một nửa** icon không thuộc bộ chuẩn.

**④ Trôi cỡ chữ 4 → 11.** Hai màn có **11 cỡ chữ riêng biệt** trên cùng một màn; vỏ chung chỉ 4.
Chênh gần **3 lần** ⇒ đó không phải một thang, đó là **tích tụ**.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Sáu ổ + luật ổ đứng yên + cảnh báo ⓪↔② | `components/studio/AppShell.tsx` (đọc docstring, nó là hợp đồng) |
| Header, ba cụm, bậc thang nhường | `components/studio/AppChrome.tsx` |
| Đo 13 bề mặt + 4 kẻ tái phạm + thứ tự sửa | `docs/design-campaign/01-CLINICAL-UI-AUDIT.md` |
| Đo vỏ 23/08: ai bọc vỏ, đổi chặng thì đổi gì, thanh đáy ai có ai không | `docs/bao-cao-phien/2026-08-23-lane-workspace.md` |
| Trụ "ổ cố định, ruột thay đổi" | `docs/SPEC-HA-TANG-UI-IF.md` · `docs/SPEC-APP-SHELL-CHUNG.md` |
| Nền móng icon/chữ/nhịp (thang đo mọi màn) | `docs/mocks/claude-foundation-system.dc.html` · `docs/design-campaign/05-FOUNDATION-BASELINE.md` |

**🔴 CHƯA GIẢI:**
- **Thanh đáy "luôn hiện"** — ổ đã có; thiếu ở Present · 3D-Node · Home, và 3D-3D đang đặt toolbelt
  **ở TRÊN** thay vì trong ổ. Ba lần sửa một dòng ở **ba chủ sở hữu khác nhau** ⇒ gom **một** phiếu.
- **Search ở giữa ↔ Vitals đang chiếm giữa** — chỉ hoà được nếu Vitals rời khỏi bề mặt header. Và
  *search trong chặng thì tìm gì?* chưa ai trả lời. Xem `ask-search.md`.
- **"Now surface" ở cụm phải** — chưa có định nghĩa đo được. Xem `now-surface.md`.
- **Docstring bộ chuyển chặng vẫn tự khai *"TRỤC ĐIỀU HƯỚNG DUY NHẤT của app"*** dù nó đã gỡ khỏi
  header từ 17/08 — **chữ đã chết mà chưa đóng dấu**.
- **Nền móng token vẫn là nợ của Claude Design** (thang chữ · vai màu · bảng kích thước · số đo
  icon). Trong lúc chờ: **DESIGN MISSING**, vỏ **không được tự chế**.
