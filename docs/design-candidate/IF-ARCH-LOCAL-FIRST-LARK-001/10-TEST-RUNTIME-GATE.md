# ⑩ TEST + RUNTIME PROOF GATE

> `PROPOSED`. HEAD `a08378a`.
> **Luật:** Claude nói "đã làm" ⇒ chỉ chuyển `REVIEW`. Quality mới nâng `PASS`. Hoà duyệt mắt cuối.
> **Cấm PASS khi chưa có bằng chứng runtime.**

## 1 · BỐN CỔNG — không nhảy cóc

| cổng | ai | bằng chứng bắt buộc |
|---|---|---|
| `DESIGN` | Claude Design | artifact + design ID + version + hash |
| `REVIEW` | Hoà | duyệt mắt trên ảnh rõ |
| `TECH PASS` | Quality | test xanh + **ảnh Electron thật** |
| `SHIP` | Production Control | rollback đã thử, flag đã bật/tắt được |

## 2 · MA TRẬN TEST — sáu nhóm

### A · SYNC / IMPORT
| ca | kỳ vọng | chứng minh |
|---|---|---|
| tệp hợp lệ | preview đúng số, **chưa ghi gì** | ảnh preview + DB không đổi |
| tệp thiếu cột | báo **cột nào thiếu**, không nhập một phần | ảnh lỗi |
| nhập lại cùng tệp | **không nhân đôi** (khớp theo `externalId`) | đếm trước/sau |
| nhập rồi rollback | về đúng trạng thái cũ | hash DB trước/sau |
| nguồn đổi sau khi nhập | `stale=true`, **không tự nhập lại** | cờ hiện trên mặt |

### B · QUYỀN BỊ THU HỒI
| ca | kỳ vọng |
|---|---|
| đang mở màn thì quyền bị gỡ | lần gọi kế tiếp **từ chối**, màn thu về mức thấp hơn |
| quyền hết hạn giữa phiên | như trên, **không đợi đăng nhập lại** |
| mất `people.read.contact` | email biến mất, **tên vẫn còn** — giảm bậc, không sập |
| không có `workload.read.person` | **không tải**, chỉ thấy tổng hợp |

### C · DỮ LIỆU CŨ / LỆCH
| ca | kỳ vọng |
|---|---|
| tổng org ≠ tổng division | hiện **“Needs verification”**, giữ cả hai số, **không tự sửa** |
| assignment hết hạn | rời khỏi đội hiện tại, **còn trong lịch sử** |
| leader chưa có team | hợp lệ + gắn cờ, **không phải lỗi** |
| `syncedAt` quá 30 ngày | nhãn cũ hiện trên mặt |

### D · XUNG ĐỘT
| ca | kỳ vọng |
|---|---|
| hai nguồn cùng `externalId`, khác tên | **dừng, hỏi người**. Cấm last-writer-wins |
| sửa local + nhập đè | preview chỉ rõ **cái gì sẽ mất** |

### E · OFFLINE / KẾT NỐI LẠI
| ca | kỳ vọng |
|---|---|
| mất mạng khi đang nhập | dừng sạch, **không nhập một nửa** |
| Electron mất server loopback | thông báo rõ, **không màn trắng** |
| kết nối lại | xếp hàng chạy tiếp, không nhân đôi |

### F · AUDIT TRAIL
| ca | kỳ vọng |
|---|---|
| export danh sách người | ghi: ai · lúc nào · bao nhiêu bản ghi · lý do |
| đổi quyền | ghi trước/sau + người duyệt |
| đổi assignment | ghi trước/sau + **undo được** |
| xem dữ liệu nhạy cảm | ghi lượt xem, **không ghi giá trị** |

## 3 · BẰNG CHỨNG RUNTIME — bốn thứ, thiếu một là không PASS

1. **Ảnh Electron thật** — app đóng gói, không phải `next dev` trong trình duyệt.
2. **Trước/sau** cho mọi thao tác đổi dữ liệu.
3. **Log/receipt** chứng minh permission-before-load: quyền được hỏi **trước** truy vấn.
4. **Rollback đã chạy thật**, không phải "về lý thuyết rollback được".

## 4 · TÁM ĐIỀU RIÊNG CHO `IF-PO-14` *(đã chốt, chưa cái nào PASS)*

1. cùng project nhất quán ở 6 nơi · 2. `+N` đúng · 3. **permission-before-load** ·
4. avatar lỗi có fallback · 5. 18/20/24px nhận diện được · 6. không vỡ ở 1100px · touch · tên dài ·
7. click mở đúng Project Staffing · 8. **ảnh Electron thật**

## 5 · ⛔ ĐIỀU KHÔNG THỂ LÀM TRONG PHIÊN NÀY

Phiên này **read-only**, không chạy Electron, không có dữ liệu thật.
⇒ **Không mục nào ở trên được đánh PASS bởi tôi.** Chúng là **định nghĩa cổng**, không phải kết quả.
