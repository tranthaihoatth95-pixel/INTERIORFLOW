# PHIẾU GIAO VIỆC — H2 · `panel-handle-chung` (Tay cầm thu/mở panel dùng chung) — Đợt 5, 13/08/2026

## ① BỐI CẢNH NGÀNH
Màn làm việc của KTS chật: panel chiếm chỗ canvas. Hoà chốt 07/08 (00-CHOT mục 10): tay cầm thu/mở của chặng Trình chiếu "làm rất tốt, áp cho toàn hệ thống" — dải dọc mảnh sát mép panel, giữa có mũi tên ‹/›, bấm là thu/mở, chiếm ~0 diện tích, thu rồi VẪN THẤY tay cầm (không "mất tích"). Đo 07/08: components/library 0/7 file có cơ chế này, cad 2/20, render-studio 2/18. Đây là việc 🧰ĐỠ của ĐỢT GIAO DIỆN THỐNG NHẤT (Hoà chốt 13/08).

## ② ĐỌC TRƯỚC
1. `docs/00-CHOT.md` chốt 07/08 mục 10 (nguyên văn mẫu + vì sao đáng nhân bản).
2. Tay cầm MẪU đang sống ở chặng Trình chiếu — grep trong `components/present-editor/` (tìm nút thu/mở panel, mũi tên ‹ ›) để CHÉP đúng hành vi + hình dạng, không sáng tác lại.
3. `app/globals.css:60-75` thang bo `--r-*` + token màu.
4. `lib/useDismissable.ts` — họ sự kiện đóng lớp sẵn có (không tự chế pointerdown mới).
5. `docs/SPEC-HOVER-FOCUS-IDF.md` bảng tra hover cho phần tử nhỏ.

## ③ VÙNG FILE
ĐƯỢC: `components/ui/PanelHandle.tsx` (MỚI, + test nếu logic tách được) · lắp vào ĐÚNG các file: `components/library/LibrarySheet.tsx` + `components/library/library-sheet-css.ts` (tấm Thư viện) · sidebar Lớp trong `components/cad/` (file chứa rail "Lớp bản vẽ" — tự định vị bằng grep, ghi rõ file vào báo cáo) · `components/render-studio/Command3DPanel.tsx` (panel Sửa 3D).
CẤM: `components/home/**` · `app/page.tsx` · `app/globals.css` · `docs/mocks/**` · `components/studio/LightTab.tsx` · `components/materials/**` · `components/FlowCanvas.tsx` · `components/print/**` · `components/present-editor/**` (chỉ ĐỌC mẫu, không sửa) · prisma.

## ④ VIỆC
1. **Component** `components/ui/PanelHandle.tsx`: props tối thiểu `{ side: 'left'|'right', collapsed, onToggle, storageKey? }` — dải dọc mảnh + mũi tên, bo theo thang `--r-*`, hover theo SPEC-HOVER-FOCUS (phần tử nhỏ: đổi nền 120ms, không scale to). MARKER: `PanelHandle`.
2. **Nhớ trạng thái giữa phiên** qua `storageKey` (localStorage) — panel thu vẫn chừa dải tay cầm nhìn thấy được.
3. **Lắp vào 3 panel** ở ③ — panel thu về dải mỏng CÓ NHÃN dọc (luật SPEC-PANEL-ROLLOUT: CẤM auto-hide, thu là thu-có-mặt); canvas nở ra chiếm chỗ.
4. `prefers-reduced-motion`: đổi trạng thái tức thì, không trượt.
5. Test logic (nếu tách được phần thuần) + tsc.

## ⑤ RÀNG BUỘC
Không git · không dev server · không prisma · không sửa file ngoài ③ · token màu qua CSS var · nhãn hiển thị theo SPEC-NGON-NGU.

## ⑥ NGHIỆM THU TỰ LÀM
```
npx tsc --noEmit
grep -rn "PanelHandle" components/ui components/library components/cad components/render-studio | head
```

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-13-H2-panel-handle.md` — khuôn 2 giá trị §1c; lệnh dán nguyên văn; quyết định + lý do; CHƯA LÀM nói thẳng; file cad đã chọn ghi rõ.

## ⑧ DÂY MÁY
Entry `panel-handle-chung` (dir components/ui, mẫu PanelHandle). Không tự sửa registry.
