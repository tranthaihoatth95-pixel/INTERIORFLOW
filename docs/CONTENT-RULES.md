# NGUYÊN TẮC NỘI DUNG — chống lẫn lộn, chống loạn câu chữ

> Mục tiêu: **nội dung app thật · nội dung demo · nội dung dự án khách** không được trộn vào nhau.
> Ai (người hay agent) thêm nội dung vào app đều phải theo luật này. Vi phạm = coi như bug.

## 1. Ba loại nội dung — tách bạch tuyệt đối

| Loại | Là gì | Ở đâu | Xuất hiện trong app thật? |
|------|-------|-------|---------------------------|
| **APP** (thật) | Câu chữ hệ thống của sản phẩm: nhãn, nút, empty state, toast, tooltip | `lib/i18n.ts` (EN+VI) | ✅ luôn |
| **DEMO** (mẫu) | Flow mẫu, deck mẫu, seed để trình diễn tính năng | `lib/demo-*.ts`, `components/demo/*`, route `app/demo/*` | ❌ chỉ trong khu demo, KHÔNG lẫn màn app thật |
| **DỰ ÁN** (khách) | Nội dung Detech / Amanoi / … (deck, moodboard, số liệu) | Sản phẩm giao khách (file/scratchpad), route showcase riêng | ❌ tuyệt đối không nằm trong product UI |

## 2. Luật câu chữ (chống "loạn câu chữ")
- **Mọi chuỗi hệ thống người dùng thấy PHẢI đi qua `lib/i18n.ts`** — có đủ **EN + VI**, key ổn định. Không hardcode chuỗi UI rải rác trong component.
- **Một chuỗi = một key = một nguồn.** Không copy-paste cùng một câu ở nhiều nơi; cùng nghĩa thì cùng key.
- Tông giọng: quiet-luxury, gọn, quốc tế, **không sến**. (xem gu design)
- Sửa câu chữ = sửa `i18n.ts`, KHÔNG sửa lẻ trong component.

## 3. Luật demo (chống lẫn demo vào app thật)
- Màn app thật (empty state canvas, Present mode trong app, StageSelect, Header…) **không được chứa nội dung mẫu bake sẵn**. Empty = trung tính ("Canvas trống — kéo node vào").
- Demo (flow mẫu, deck mẫu) sống ở **khu demo riêng** (`/demo`, `lib/demo-*`, `components/demo/*`) và **chỉ mở khi người dùng chủ động vào khu đó**.
- **Demo mẫu polish làm SAU CÙNG** — sau khi app thật đã đủ công cụ & chất lượng.
- Đặt tên rõ: file/route demo có tiền tố `demo` (vd `app/demo/`, `lib/demo-seeds.ts`). Route showcase (vd `/present` bản Detech) phải tự nhận là demo, và **truyền nội dung mẫu tường minh** (không để component app mặc định nạp nội dung mẫu).

## 4. Luật nội dung dự án khách
- Detech, Amanoi… là **sản phẩm giao khách**, không phải nội dung sản phẩm app. Không nhét vào `lib/` của app như dữ liệu mặc định.
- Ảnh/nội dung dự án nạp qua đúng đường: **Reference (thư viện) → JSON chưng cất** (palette/vật liệu/style/usage-tag), không hardcode.

## 5. Checklist trước khi merge nội dung
- [ ] Chuỗi UI mới đã vào `i18n.ts` (EN+VI) chưa? Có hardcode sót không?
- [ ] Có nội dung mẫu/dự án nào lọt vào màn app thật (empty state, mode mặc định) không?
- [ ] Demo có nằm đúng khu `/demo` + tự truyền nội dung mẫu tường minh không?
- [ ] Cùng một câu có bị lặp ở nhiều nơi (nên gộp 1 key) không?

---
*Áp dụng từ 07/07. Đã tách: empty-state canvas (bỏ flow mẫu + DemoLauncher), Present mode in-app (mặc định rỗng, không còn deck Detech). `/present` giữ vai showcase demo, truyền `DEMO_DECK` tường minh.*
