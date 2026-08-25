# HANDOFF-NEXT — MAIN (engineering) → phiên UI/UX (design-only)

Cập nhật: 22/08/2026, cuối wave 10. **MAIN không sửa `docs/mocks/**`** (vùng của phiên thiết kế).

## 1 · LOCALHOST
```
http://localhost:3000
```
Server **đã chạy sẵn** — tái dùng, **đừng mở cái thứ hai** (hai server một thư mục làm hỏng `.next`,
sự cố đã có tiền lệ). Nếu chết: `npm run dev` tại gốc repo.

**Xem được ngay:**
| Màn | Đường |
|---|---|
| Home | `/` |
| 2D Kỹ thuật | `/projects/cmsqu517r0001w9axbunx9m7m/cad` |
| 3D | `/projects/cmsqu517r0001w9axbunx9m7m/render` |
| Trình chiếu | `/projects/cmsqu517r0001w9axbunx9m7m/present` |
| Thư viện (73 món thật) | tấm Thư viện trong 2D |

## 2 · TỆP MAIN VỪA ĐỘNG (đã xong, an toàn để dựng UI lên trên)
| Tệp | Việc |
|---|---|
| `lib/lockscreen.ts` · `components/studio/AppChrome.tsx` | "Không bao giờ" = **không hẹn giờ** (trả `null`), bỏ giả lập 7 ngày |
| `components/nav/RailDieuHuong.tsx` | Bản đồ **NỔI** + tự thu 320ms + ghim + Esc. Rail giữ 52px trong dòng chảy |
| `components/studio/SheetTabBar.tsx` | Mọc ổ `phai` — chỗ cho hành động cấp-tài-liệu đứng cùng hàng tab |
| `components/cad/CadSheets.tsx` | "Gửi sang Trình chiếu" bỏ dải riêng 41px, về ổ `phai` |
| `components/cad/LibraryDropBridge.tsx` | 🔴 **Sửa lỗi thật**: đọc cùng nguồn với kệ (`tronKhoMam`) |
| `components/entry/LoginForm.tsx` · `app/globals.css` | Nút "Vào xưởng" (`.if-vao-xuong`), `.if-rail-spine` |
| `lib/cad/keo-tha-idfc.test.ts` | Máy canh mới cho kéo-thả |

## 3 · ĐANG BAY (lane khác giữ — đừng dựng UI đè lên khi chưa hỏi)
- `components/render-studio/CuaSoCongCu.tsx` · `ToolWindow.tsx` · `lib/nodes/thi-hanh-lenh-cua.ts`
  — lane W vừa nhả, **9/13 lệnh vệ tinh còn mờ**, vệ tinh nấc 3 chưa đầy.
- `lib/voice/**` — lane V xong hợp đồng, **chưa mount vào app**, chưa nói mic thật.

## 4 · AN TOÀN ĐỂ DỰNG UI NGAY
`Home.dc.html` vừa vào APPROVED ⇒ Home là dòng dựng được. Vùng dưới đây MAIN **không** đụng nữa
và không lane nào giữ:
- `components/home/**` (bốn dải hiện tại là bản MAIN tự ghép — **thay được, không phải target**)
- `components/nav/NguCanhDuAn.tsx`
- `app/globals.css` (dùng token, đừng gõ hex)

## 5 · TÌNH TRẠNG SẢN XUẤT
Cổng: `tsc` **0** · `npm test` **exit 0** · test kéo-thả mới **TẤT CẢ ĐẠT**.

Đo được trên app thật, không phải đọc mã:
- Bản đồ nổi: tấm 240 mở mà canvas `left=88` — **không bóp canvas**; rời chuột → 320ms → thu về 52.
- 2D chrome: **163px → 122px**.
- Kéo-thả: thả "Sofa 2 chỗ" ra **+41 nét**, đúng 41 prims của mẫu, 1 cụm, `l-furniture`.
- Nút "Vào xưởng": nền `rgb(106,87,245)`, reduce-motion `animation: none`.

**Chưa đo / khai thật:** Visual match **FAIL** ở mọi màn MAIN từng tự ghép (Home · Smart Shell ·
2D · Workspace) — chờ bản vẽ. Voice chưa mount. Material **BLOCKED** bởi migration `ProductSpec.matId`.

## 5b · CỔNG CHẬP CHỜN — CHƯA TÌM RA GỐC (khai thật)
`npm test` hôm nay **1 lần exit=1 trong ~5 lượt**, đuôi log không có mục nào hỏng. Sau đó **2 lượt
liên tiếp exit=0**. Đã loại hai giả thuyết bằng đo, không phải bằng suy đoán:
- *Do sửa của MAIN* — loại: bản trước và sau sửa đều xanh.
- *Tám test chạy song song `-P8` giẫm chân nhau trên SQLite* — loại: chạy riêng nhóm `lib/server/*`
  ở `-P8` **3/3 lượt sạch**. (Ghi chú: `edgecase-concurrency.test.ts` đã bị loại trừ sẵn trong
  `package.json` — tức có người từng gặp đúng họ bệnh này.)
- Còn nghi: một test khác trong 200+ tệp chạy `-P8`. Chưa bắt được tại trận.
⚠️ **Đừng tin một lượt xanh đơn lẻ làm bằng chứng.** Cổng chập chờn thì mọi màu xanh đều mất giá.

## 6 · HAI BLOCKER CẦN HOÀ
1. **commit/push bị chặn** — ~400 tệp treo; manifest sở hữu ở `09-ban-giao/README.md`.
2. **migration `ProductSpec.matId`** — phải chạy trên máy thật (sandbox không khoá được file).

## 6b · VIỆC KẾ TIẾP CỦA MAIN
`Home.dc.html` đã vào APPROVED ⇒ theo §2 đây là màn MAIN **được phép dựng** (dựng đúng bản đó, so
trên localhost, sửa tới khi khớp mắt). Chưa bắt đầu — bản vẽ vừa nhả cuối lượt này.

## 7 · BẢNG TRẠNG THÁI
Khuôn 5 trục §11: `docs/memory/sessions/2026-08-22/10-core-completion/BANG-5-TRUC.md`
