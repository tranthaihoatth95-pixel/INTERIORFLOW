# BIÊN NHẬN SỬA PHẠM VI — commit `147f66a`

> **Hoà chốt 27/08: GIỮ NGUYÊN.** Cấm `revert` · `rebase` · `reset` · cấm mọi cố gắng "tách lại"
> 980 tệp. Đây là biên nhận bền, không phải đề xuất.

## Sự thật

| | |
|---|---|
| commit | `147f66a` |
| nhan đề | *"feat(security): R3 IF-SECURE-ARTIFACT-DELIVERY-001 + sổ bằng chứng Wave 0 + Integration Plan"* |
| tệp tôi CHỦ Ý sửa | **9** |
| tệp commit THẬT SỰ chứa | **991** |
| chênh lệch | **980** tệp — công việc **chưa commit của các phiên trước**, đang nằm bẩn trong cây lúc phiên 27/08 mở ra |
| trong đó có | một lượt **XOÁ** `components/IntroSequence.tsx` mà người ghi commit **chưa từng đọc** |

Phân bố 980 tệp đó, gom theo thư mục: `artifacts/visual-review` 159 · `docs/bao-cao-phien` 73 ·
`docs/memory` 64 · `docs/mocks` 49 · `components/present-editor` 32 · `components/studio` 28 ·
`app/api` 25 · `present-demo/screens` 21 · `components/render-studio` 20 · `components/home` 20 ·
`lib/capabilities` 19 · `docs/audit-2026-08-18` 19 · …

## ⛔ HỆ QUẢ RÀNG BUỘC

**1. `git revert 147f66a` KHÔNG CÒN AN TOÀN — cấm dùng.**
Nó sẽ lùi luôn 980 tệp không liên quan và **hồi sinh một tệp đã bị xoá có chủ ý**. Đường lùi ghi
trong chính commit đó (*"git revert commit này"*) là **sai** — đọc dòng này thay cho dòng đó.

**2. Đường lùi thay thế cho phần R3** (nếu có ngày cần): lùi **từng tệp**, không lùi commit —
`git checkout 6c9712a -- <đường dẫn>` cho đúng 9 tệp của R3:
`app/api/comments/route.ts` · `app/api/comments/image/[id]/route.ts` · `lib/server/comment-artifact.ts`
· `lib/server/comment-artifact.test.ts` · `scripts/proof/secure-artifact-delivery.mjs` ·
`docs/design-campaign/02-FAILURE-LEDGER.md` · `docs/design-candidate/IDF-IF-PACKET-003/02-SMARTBOARD.md`
· `.../03-INTEGRATION-PLAN.md` · `docs/IF-INTEGRATION-GATE-2026-08-19.md`.

**3. `git log` nay gán công việc của phiên khác cho người ghi phiên 27/08.** Ai khảo cổ lịch sử
phải đọc biên nhận này trước khi kết luận ai làm gì trong `147f66a`.

## 🔒 LUẬT TỪ NAY — cấm stage mù

1. **Đầu phiên: đo `git status --porcelain | wc -l`.** Khác 0 ⇒ đó là việc của người khác:
   **báo ra**, không nuốt vào commit của mình.
2. **CẤM `git add -A` và `git add .` khi cây không sạch.** Liệt kê đường dẫn tường minh. Chấp
   nhận gõ dài — cái giá của việc gõ ngắn nằm ngay trên bảng đầu tệp này.
3. **Trước mỗi commit: đối chiếu số tệp staged với số tệp mình chủ ý sửa.** Lệch ⇒ **dừng**,
   không commit rồi sửa sau.
4. **Đường lùi ghi trong commit phải đúng với RUỘT THẬT của commit đó**, không đúng với ý định.

## Vì sao nó khó thấy

Lane `IF-UXUI-RUNTIME-001` bắt được, không phải người gây ra. Nó đối chiếu hai lần đo cách nhau
vài giờ và thấy *"582 tệp bẩn biến mất khỏi cây, **không qua commit**"*.

Câu đó sai một nửa — và nửa sai chính là chỗ khó thấy: chúng **CÓ** qua commit, chỉ là qua một
commit **mang cái tên không nhắc gì tới chúng**. Tìm bằng `git log --oneline` thì không thấy;
phải đếm tệp mới thấy.

Xem thêm `docs/design-campaign/02-FAILURE-LEDGER.md` §F-19.
