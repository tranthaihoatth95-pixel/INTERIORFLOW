# PHIẾU P-ROUTER-HOME — wrap DongStudioHome bằng AppShell

> Giao: T · 17/08 tối · vùng ghi: `components/home/HomeScreen.tsx` + `components/studio/AppShell.tsx` (chỉ nếu cần thêm active="home") + báo cáo. ⛔ KHÔNG đụng `components/home/DongStudioHome.tsx` (P-DASHBOARD giữ) · `components/home/widgets/**` · `--accent*`.

## ⓪b `git log -1` + `HEAD..main` = 0. Mốc: `e809074`.
## ⓪ TIỀN ĐỀ (BÁC → DỪNG)
> `HomeScreen.tsx:557` render `<DongStudioHome>` trực tiếp, KHÔNG qua `<AppShell>`. AppShell đã import `RailDieuHuong` V1 (chốt luật: **sidebar = bản đồ, LUÔN hiện ở mọi chặng**). ⇒ Việc: wrap DongStudioHome bằng `<AppShell active="home">` để rail hiện ở Home.

## ② ĐỌC TRƯỚC
`components/studio/AppShell.tsx` toàn bộ · `components/home/HomeScreen.tsx:550-585` · `components/nav/RailDieuHuong.tsx` · `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md §1`.

## ③ VIỆC
1. Wrap `<DongStudioHome onEnter=...>` bằng `<AppShell active="home">`. Nếu AppShell chưa có mode `"home"` thì thêm vào type `AppChromeActive`.
2. Ở home, AppShell chỉ cần rail + AppChrome; **KHÔNG** truyền `toolbar`, `navigator`, `inspector` (undefined để ẩn hẳn).
3. Kiểm rail hiện ở Home: bấm mục "Files" hoặc "Thư viện" → phải navigate đúng.
4. `WelcomeIntro` modal vẫn nổi trên AppShell (không đè rail).

## ⑤ RÀNG BUỘC
· KHÔNG git ghi · KHÔNG chạy dev server (đã có sẵn port 3000) · KHÔNG đụng DongStudioHome nội dung.
· Rail cụm DỰ ÁN chưa mở dự án ⇒ mờ kèm lý do (đã có logic V1).

## ⑥b ĐÍCH trần 5 vòng
`tsc` 0 · `npm test` 0 fail · `grep -c "<AppShell active=\"home\"" components/home/HomeScreen.tsx` ≥ 1 · dev server auto-recompile không vỡ chunk.

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-P-ROUTER-HOME.md`
