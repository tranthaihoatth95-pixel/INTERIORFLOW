# TRUNG TÍNH — VÙNG KHOANH (đóng băng, KHÔNG xoá vội)

> **Hoà chốt 05/08/2026:** *"hiện tại mình còn làm ở TTT nên vấn đề vi phạm luật trung tính
> khoanh lại tạm nhốt đó, nữa xoá sau, đừng để lan rộng phạm vi là được."*

## Luật của vùng này

| # | Luật |
|---|---|
| **TT1** | **KHÔNG xoá, KHÔNG sửa** các chỗ đã liệt kê dưới đây. Chúng là nợ có kiểm soát, Hoà xoá sau. |
| **TT2** | **KHÔNG được thêm chỗ mới.** Danh sách dưới là RANH GIỚI ĐÓNG BĂNG — file mới hoặc lần xuất hiện mới = 🔴 trả về. |
| **TT3** | Sửa file đang trong danh sách vì việc khác thì **giữ nguyên số lần hex**, không tăng. |
| **TT4** | Tính năng mới, mock mới, màn mới: **CẤM tuyệt đối** dùng hex TTT. Dùng token trong `globals.css`. |
| **TT5** | Khi Hoà quyết xoá: đọc `docs/AUDIT-BRAND-PII.md` + phiếu ở cuối file này, làm một lượt, KHÔNG làm lẻ tẻ. |

## Mốc đóng băng — đo bằng lệnh, 05/08/2026

```
rg -c '#F1ECE3|#002850|#F06020' -g'!node_modules' -g'!.worktrees' -g'!.next' lib components app
```

**Kết quả mốc: 14 file · 44 lần.** Vượt con số này = có người thêm mới.

| File | Số lần |
|---|---|
| `app/globals.css` | 1 |
| `app/projects/[id]/notebook/page.tsx` | 4 |
| `app/projects/[id]/overview/page.tsx` | 1 |
| `components/avatar/AvatarRenderer.tsx` | 7 |
| `components/intro/svgs/index.tsx` | 4 |
| `components/notebook/NotebookChatPanel.tsx` | 7 |
| `components/notebook/NotebookSourceViewer.tsx` | 3 |
| `components/notebook/NotebookSourcesSidebar.tsx` | 8 |
| `components/present-editor/PresentEditor.tsx` | 1 |
| `lib/ai/chat-assist.test.ts` | 1 |
| `lib/avatar.ts` | 3 |
| `lib/present-editor/format-painter.test.ts` | 2 |
| `lib/present-editor/text-fx.test.ts` | 1 |
| `lib/present-editor/text-fx.ts` | 1 |

### Ảnh tài sản TTT trong `public/` — 30 tệp

```
git ls-files public/ | grep -i ttt
```

- `public/wallpapers/ttt-01.jpg`
- `public/wallpapers/ttt-02.jpg`
- `public/wallpapers/ttt-03.jpg`
- `public/wallpapers/ttt-04.jpg`
- `public/wallpapers/ttt-05.jpg`
- `public/wallpapers/ttt-06.jpg`
- `public/wallpapers/ttt-07.jpg`
- `public/wallpapers/ttt-08.jpg`
- `public/wallpapers/ttt-09.jpg`
- `public/wallpapers/ttt-10.jpg`
- `public/wallpapers/ttt-11.jpg`
- `public/wallpapers/ttt-12.jpg`
- … còn 18 tệp nữa (chạy lệnh trên để xem đủ)

⚠️ Nằm trong `public/` nghĩa là **build ra là ship kèm**. Khi gỡ phải có ảnh thay thế trung tính
trước, không để app trắng trơn.

### Đã chuyển ra ngoài repo (05/08)

- `docs/mocks/Sơ đồ tổ chức _ Ti Share.html` + `_files/` → `~/Downloads/_TTT-BRAND/from-if-repo/`
  (đã chặn trong `.gitignore`)

### Còn tracked, chưa xử — thuộc vùng khoanh

- `docs/mocks/mapa-de-zonas.html` — treo cờ 🔴 trong `README-mocks.md` từ 24/07

## Chặn lan rộng — việc cần làm

Thêm bước quét vào `scripts/check-mocks.mjs` (hoặc script mới `check-neutrality.mjs`):

1. Đếm hex TTT trong `lib/ components/ app/`.
2. So với mốc trong file này (14 file · 44 lần).
3. **Vượt mốc ⇒ exit 1**, in ra file nào vừa thêm.
4. KHÔNG quét `docs/` và `scripts/` — chúng nói *về* luật, không vi phạm luật
   (`scripts/check-mocks.mjs` chính là script đi bắt hex này).
5. Nối vào `npm test`, cùng cơ chế `lib/cad/idf-neutrality.test.ts` đã có.

Có bước này thì nợ đứng yên, không cần canh bằng mắt.

## Phiếu gỡ — DÙNG SAU, khi Hoà quyết

Không làm bây giờ. Khi làm thì đọc `docs/AUDIT-BRAND-PII.md` trước, và nguyên tắc là
**đổi NGUỒN màu, không xoá màu**: rút thành token trung tính trong `globals.css`, giá trị
mặc định của IF chọn màu không phải của TTT, studio nạp bảng riêng qua Brand Kit
(`lib/present-editor/brand-kit.ts`).

---
*Lập bởi COWORK-TỔNG 05/08/2026 theo lệnh Hoà. Append-only — sửa mốc phải ghi lý do + ngày.*
