# BÀN GIAO · BẢO VỆ CÂY LÀM VIỆC (22/08) — §6

## MỐC HIỆN TẠI
```
HEAD:   c7f3ac8657fe924d13f273d51dfb2272b5c8c15d
nhãn:   main   ⚠️ nhãn trỏ main, NỘI DUNG đĩa = backup/2026-08-19-batch0a
backup: fbd65213593407277b3fa214536f37cbd6e3b1e8
tổng tệp thay đổi/chưa theo dõi: 383
```

## ⛔ CẤM
- `git add -A` — cây có 380+ tệp lẫn lộn nhiều đợt, gom hết là gom cả rác của phiên khác.
- `git reset` / `checkout` / `stash` — có việc chưa rõ chủ trong cây.
- Chỉ checkpoint bằng ĐƯỜNG DẪN TƯỜNG MINH khi được phép commit.

## TỆP THUỘC NGỮ CẢNH DỰ ÁN (Site) — checkpoint bằng đúng danh sách này
```
lib/site/types.ts
lib/site/solar.ts
lib/site/anh-huong.ts
lib/site/store.ts
lib/site/chinh-sach.ts
lib/site/vitals-site.ts
lib/site/khi-hau.ts
lib/site/gio.ts
lib/site/dia-ly.ts
lib/site/suy-luan.ts
lib/site/site.test.ts
lib/site/canh-gac.test.ts
lib/site/quyen.test.ts
lib/site/vat-ly.test.ts
lib/site/vitals-site.test.ts
app/api/projects/[id]/site/route.ts
app/api/projects/[id]/site/tinh-lai/route.ts
components/site/NhapViTri.tsx
components/site/TomTatDiaDiem.tsx
components/site/dia-diem-client.ts
components/site/doc-toa-do.ts
components/site/doc-toa-do.test.ts
components/site/nang-tu-ho-so.ts
components/site/nang-tu-ho-so.test.ts
```

## TỆP SỬA THEO (ngoài lib/site, do dây Site chạm tới)
```
components/studio/vitals-tin-hieu.ts        · thêm loại tín hiệu dia-diem + TEN_MIEN + export THU_TU
components/studio/vitals-tin-hieu.test.ts   · bỏ số gõ cứng !==4, so với THU_TU
components/studio/VitalsAperture.tsx        · đọc daCu thật + mức Chi tiết + 2 hành động
components/render-studio/LightTab.tsx       · 3D ĐỌC hồ sơ, thôi sở hữu vị trí
components/render-studio/scene3d-ui.ts      · gỡ latDeg/lngDeg/northDeg
app/projects/[id]/overview/page.tsx         · bọc AppShell + khối Ngữ cảnh + neo #ngu-canh-dia-diem
components/nav/RailDieuHuong.tsx            · URL thắng dự-án-gần-nhất
lib/pptx-zip-fonts.test.ts                  · tên tệp tạm DUY NHẤT theo tiến trình (sửa cô lập test)
```

## CỔNG XANH LÚC BÀN GIAO
```
tsc              exit 0
npm test         exit 0  (3 lượt liên tiếp)
site 35 · canh-gac 43 · quyen 15 · vat-ly 102 · vitals-site 16  = 211 khẳng định
```

## SẢN PHẨM ĐÃ SINH
```
artifacts/visual-review/01-2d-empty.png
artifacts/visual-review/02-sidebar-collapsed.png
artifacts/visual-review/03-sidebar-expanded.png
artifacts/visual-review/04-2d-full.png
artifacts/visual-review/05-home.png
artifacts/visual-review/06-sidebar-solo.png
artifacts/visual-review/07-sidebar-team.png
artifacts/visual-review/08-library-icon.png
artifacts/visual-review/09-sidebar-full.png
artifacts/visual-review/10-project-overview-shell.png
artifacts/visual-review/G3B-3d-danh-tinh.png
artifacts/visual-review/M1-sidebar-ban-do.png
artifacts/visual-review/M2-he-thi-giac-3-man.png
artifacts/visual-review/S1-overview-chua-co-vi-tri.png
artifacts/visual-review/S2-nhap-vi-tri.png
artifacts/visual-review/S3-overview-co-vi-tri.png
artifacts/visual-review/S4-3d-nang-that.png
artifacts/visual-review/V-A-khoe-manh.png
artifacts/visual-review/V-B-C-edge-sang.png
artifacts/visual-review/V-C-edge-sang.png
artifacts/visual-review/V-D-E-peek-chi-tiet.png
artifacts/visual-review/V-DE-peek-chitiet.png
artifacts/visual-review/V-H-vitals-tat.png
uploads/site/<projectId>/ho-so.json   (dữ liệu THẬT, đã .gitignore)
```
