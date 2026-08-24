# CỬA VÀO — Cold Open · Đăng nhập · Khoá · Phiên kết thúc

> **[N]** = sự thật từ nguồn · **[IF]** = diễn giải.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — **môi trường thức dậy trước giao diện**, rồi đưa người vào việc. Bốn bề mặt cùng họ:
cold open (mở nguội) · đăng nhập · **khoá màn** · **phiên kết thúc**.

**KHÔNG PHẢI** — thẻ đăng nhập SaaS · một đoạn intro để khoe · một cổng chặn. **[N]** bản
`claude-login-home-ambient-final.html` bị **BÁC 22/08 với đúng lời phán: *"đọc như SaaS auth card"***.

**Bốn ranh giới cứng:**
- **KHOÁ ≠ ĐĂNG XUẤT.** Khoá **không** xoá người dùng khỏi phiên, **không** xoá cookie, **không**
  huỷ việc render đang chạy.
- **Mất phiên ≠ mất việc.** Chuỗi đang dùng: *"Phiên đăng nhập đã kết thúc · bản vẽ của bạn vẫn
  được giữ nguyên tại máy."*
- **Không đọc được ≠ mất phiên.** Máy chủ trả 503 ⇒ **im lặng, giữ phiên**, không kết luận.
- **Cold open không được là đoạn phim.** Bản intro cũ dài **60 000 ms**; bản thay chốt mục tiêu
  **320 ms tới lúc gõ được**.

## 2 · VIỆC CỦA CON NGƯỜI
| Việc | Bề mặt |
|---|---|
| Vào được, nhanh | cold open → đăng nhập |
| Rời máy vài phút mà không mất chỗ | **khoá** (phím tắt khoá ngay) |
| Biết mình vừa mất phiên, và biết việc vẫn còn | dải báo *phiên kết thúc* ở đáy màn, **không chặn thao tác** |
| Quay lại đúng chỗ đang dở | bộ theo dõi resume |

## 3 · NHÂN VẬT CHÍNH
**Môi trường** (ánh sáng/không khí) ở cold open · **ô nhập** ở đăng nhập · **thông điệp trấn an**
ở phiên kết thúc. Không bao giờ là logo.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép | Ghi chú |
|---|---|
| Nền động + đo tương phản **thích ứng theo vùng** | đã có: vùng logo và vùng thẻ đo riêng |
| Liên tục cold open → login → Home | bằng **lớp trường gắn ở vỏ** |
| Khoá bằng phím tắt | có |

| Bị từ chối | Lý do |
|---|---|
| Nhúng thẳng ô đăng nhập vào mặt khoá | đọc ra như *"màn đăng nhập thứ hai"* — **ca hỏng thật, đã viết lại 22/08** |
| Thẻ auth kiểu SaaS | verdict 22/08 |
| Intro 60 giây | thay bằng cold open |
| Kết luận "mất phiên" khi máy chủ 503 | phải im lặng |
| Ghi resume cho route gốc `/` | sẽ **đè resume trước khi cổng kịp đọc ⇒ tự-quay-lại chết** — ca hỏng đã ghi |

## 5 · TRẠNG THÁI
Cold open có **6 trạng thái** COLD → HOME_READY (bản vẽ có dải phim 6 trạng thái + khung bàn giao +
ca *đang-gõ-lúc-còn-ổn-định* + bản giảm chuyển động).
Đăng nhập: nghỉ · đang gửi · **lỗi đọc được** · lỗi OAuth quay về (nhặt từ tham số URL).
Phiên: sống · hết hạn · **không đọc được (503) → giữ nguyên** · ẩn danh → **không cảnh báo gì**.

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 22/08 | Login bản ambient **BỊ BÁC** — *"đọc như SaaS auth card"*; ba phương án A/B/C dựng lại, **chờ duyệt mắt** |
| 22/08 | Khoá viết lại: khoá không phải đăng xuất; mặt khoá không nhúng ô đăng nhập |
| — | Cold open thay intro; liên tục bằng lớp trường ở vỏ, **không cần bỏ điều hướng router** |

## 7 · CA HỎNG THẬT
**① Lỗi đăng nhập nuốt mất câu lỗi.** Mã cũ gọi `res.json()` **TRƯỚC** khi kiểm mã trạng thái ⇒ khi
máy chủ trả **trang lỗi HTML**, dòng ném lỗi có thông điệp **không bao giờ chạy tới**. Nay bộ đọc
lỗi luôn trả về một vật có trường lỗi đọc được. **[IF] Cùng họ F-10: mất im lặng tệ hơn lỗi nhìn
thấy được.**

**② Ba hành vi khác nhau cho cùng một điều kiện "chưa đăng nhập"** — hạng **FAIL hệ thống**:
① 10 bề mặt dựng **vỏ đầy đủ** rồi để dữ liệu 401 · ② **3D** ở nguyên URL, **không vỏ**, 11 nút ·
③ Home ra màn đăng nhập. *Ba câu trả lời cho một câu hỏi.* Gốc: **chưa có MỘT chủ sở hữu ngữ nghĩa
cho trạng thái "không đọc được"** — và nó **gộp luôn** ca *false calm* của Vitals (F-02). Sửa riêng
false calm là vá triệu chứng của cùng một bệnh. ⇒ **Việc số 1 của cả cụm.**

**③ Marker chết.** Có một phần tử morph intro→login đặt ở `top:-9999`, `opacity:0`, tự khai là
*"marker chờ tương lai"*. Nó **không làm gì cả** — đừng đọc nó như một cơ chế đang chạy.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Bản vẽ cold open (6 trạng thái, thang nhịp, bản giảm chuyển động) | `docs/mocks/claude-cold-open.dc.html` — **CANDIDATE, chờ duyệt mắt** |
| Ba phương án login sau verdict FAIL | `docs/mocks/claude-login-redesign-abc.html` — **chờ duyệt mắt** |
| Bản vẽ Auth/Login/Lock/Resume (6 bản A–F) | `docs/mocks/Auth.dc.html` · `Auth-session-ended.dc.html` — **NOT STARTED** |
| Mã đang chạy | `components/entry/LoginScreen.tsx` · `LoginForm.tsx` · `components/studio/SessionWatch.tsx` · `LockScreen.tsx` · `components/entry/ResumeTracker.tsx` |
| Lưới đỡ auth (tự khai *"LƯỚI ĐỠ, KHÔNG PHẢI CỬA CHÍNH"*) | `middleware.ts` |
| Ca B2 (ba hành vi) | `docs/design-campaign/01-CLINICAL-UI-AUDIT.md` §B2 |
| F-02 false calm · F-10 mất im lặng | `docs/design-campaign/02-FAILURE-LEDGER.md` |

**🔴 CHƯA GIẢI:** ① **chủ sở hữu ngữ nghĩa cho "không đọc được"** — chưa tồn tại module/hook nào gom
trạng thái 401 cho giao diện; ba hành vi vẫn rời ② **ba phương án login A/B/C chưa ai chọn** ③ liên
tục cold open → Home mới có bản vẽ, **chưa dựng** ④ trạng thái *đang tải* của từng bề mặt: **chưa
truy được nguồn**.
