# ACTIVITY — dòng thời gian, không phải Vitals

> 🔴 **CHƯA TỒN TẠI.** Không có route, không có component. Mã tự khai: *"activity-feed **CHƯA
> xây**"*. Tài liệu này ghi lại **những gì đã quyết** và **cái đang tạm thay thế nó**.

## 1 · LÀ GÌ / KHÔNG PHẢI LÀ GÌ

**LÀ** — **chuỗi thời gian**: cái gì đã xảy ra, ai làm, khi nào. **[N]** `SKILL.md §1`.

**KHÔNG PHẢI** — **Vitals**. Đây là ranh giới quan trọng nhất của bề mặt này:
| | Vitals | Activity |
|---|---|---|
| Trả lời | *có gì cần tôi để mắt **bây giờ*** | *đã xảy ra những gì* |
| Trục | mức độ đáng chú ý | **thời gian** |
| Rỗng thì | **im lặng** | *"chưa có gì"* là câu trả lời hợp lệ |
| Trần | tối đa 3 tín hiệu | không có trần — nó là sổ |

**KHÔNG PHẢI** mạng xã hội: bỏ lớp social, **lấy CẤU TRÚC feed**. **[N]** ref #13.

## 2 · VIỆC CỦA CON NGƯỜI
Bắt kịp sau khi vắng · truy *ai đổi cái này* · nhảy tới đúng đối tượng vừa đổi.

## 3 · NHÂN VẬT CHÍNH
**Sự kiện + đối tượng nó chạm tới.** Không phải người thực hiện, không phải dấu thời gian.

## 4 · ĐƯỢC PHÉP / BỊ TỪ CHỐI
| Được phép (theo ref #13) | Ghi chú |
|---|---|
| Tab lọc **Tất cả / Của tôi / Đội** | ba cách đọc cùng một sổ |
| Thẻ sự kiện **theo loại** | không phải một dòng chữ đều đều |
| Thread trả lời **inline** | không nhảy ra chỗ khác |
| Cụm avatar chồng | mật độ người, không cần liệt kê |

| Bị từ chối | Lý do |
|---|---|
| Thích · số lượt xem · độ phổ biến | lớp social, bỏ |
| Trộn với Vitals | hai vật, hai trục — §1 |
| Đẻ một engine riêng | xem §7 |

## 5 · TRẠNG THÁI
**Chưa đặc tả.** Bốn trạng thái bắt buộc phải có khi dựng: rỗng thật · chưa đọc được (**không được
đọc thành rỗng** — bài học F-02) · đang tải · lỗi.

## 6 · CHỐT ĐÃ KÝ
| Ngày | Chốt |
|---|---|
| 02/08 | Lấy **cấu trúc** feed (tab lọc · thẻ theo loại · thread inline · avatar chồng), **bỏ lớp social**. Ghi thẳng: *"IF hiện CHƯA có trung tâm thông báo nào"* |
| 12/08 | ⭐ Activity là **một trong 5 mặt tiền** của **ENGINE NEO NGỮ CẢNH** — cùng cỗ máy với: tiêu-điểm-đối-tượng · tạo-việc-từ-đây · chat-dự-án · bình-luận-neo-đối-tượng. Luật: **viết engine MỘT LẦN, các mặt tiền gọi vào** |
| — | Xếp **đợt 5**, cùng lượt với cổng soát duyệt |

## 7 · CA HỎNG THẬT
**Chưa có ca hỏng riêng.** Hai điều đáng ghi:

**① Đang có một thứ *thay thế* mà dễ tưởng là *đã có*.** Vì chưa có activity-feed, tín hiệu *"dự án
vừa chuyển chặng"* trên Home đang lấy tạm từ **dấu thời gian cập nhật của flow**. Mã ghi rõ đây là
đồ thay thế. **[IF] Rủi ro: một dấu thời gian nói *"có gì đó đã đổi"*, nó KHÔNG nói *đổi cái gì, ai
đổi*. Dựng giao diện hứa nhiều hơn thế là bịa trí thông minh mà engine không có.**

**② Nó nằm trong một cụm 5 mặt tiền — làm lẻ là làm sai.** Chốt 12/08 đã nhận diện: neo-đối-tượng +
liên-kết-sâu + thông-báo là **một** cơ chế. Dựng riêng activity-feed sẽ đẻ ra bản thứ hai của cùng
cơ chế đó — đúng bệnh mà chính chốt ấy sinh ra để chặn.

## 8 · ĐÀO SÂU
| Cần gì | Đọc đâu |
|---|---|
| Ref #13 — cấu trúc feed, lấy gì bỏ gì | `docs/REF-VISUAL-2026-08-02.md` |
| Cụm 5 mặt tiền của engine neo ngữ cảnh | `docs/00-CHOT.md` [12/08 máy gợi nhóm] |
| Chỗ đang thay thế tạm | `lib/home/aggregate.ts` (đọc docstring — nó tự khai) |
| Sổ frontier (trạng thái: **chưa**, đợt 3) | `scripts/frontier-registry.mjs` |
| Ranh giới Activity ≠ Vitals | `.claude/skills/if-design/SKILL.md §1` · `product/vitals.md` |

**🔴 PHẢI TRẢ LỜI TRƯỚC KHI DỰNG:**
1. **Nó là một MÀN hay một PANEL?** Chưa ai nói. Nếu là màn thì nó cần chỗ trên bản đồ — mà bản đồ
   vừa được rút gọn còn 8 mục 23/08.
2. **Nguồn sự kiện là gì?** Hôm nay không có bảng sự kiện nào; chỉ có dấu thời gian rải rác trên
   từng bản ghi. Dựng feed đòi **một sổ sự kiện thật** — đó là việc dữ liệu, không phải việc giao diện.
3. **Nó và chuông thông báo là một hay hai?** Có một chuông hoạt động đang chạy (gộp hàng đợi
   render). Nếu hai thì phải nói rõ khác nhau chỗ nào, nếu không người dùng gặp **hai sổ cho cùng
   một chuyện**.
