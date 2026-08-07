> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p3c`** (nhánh con của *p3. 3D shell UI and test*).
> ⚠️ Phải chạy trong **worktree riêng** — xem cuối tệp.

---

# LUẬT BẮT BUỘC — đọc trước khi gõ dòng code đầu tiên

Đọc theo thứ tự: `STATUS.md` → `docs/00-CHOT.md` → `docs/00-BAT-DAU-DOC-DAY.md`.
**KHÔNG đọc `CHANGELOG.md`.**

```
V6  · KHÔNG commit. Hoà commit. Làm xong để nguyên, báo cáo.
§0u · Chỉ COWORK-TỔNG được ghi docs/GAP-IF.md. Phiên khác ghi vào tệp OUT của mình.
§0ab· Sổ là ảnh chụp cũ. ĐO LẠI bằng máy trước khi tin bất kỳ con số nào.
§0ac· Báo cáo phải tự khai: tệp OUT tên gì, dán vào phiên nào.
N1  · Báo cáo KHÔNG phải bằng chứng. Mỗi việc "xong" phải kèm số đo hoặc ảnh.
N5  · Khai thật cái chưa xong. Thà ghi "CHƯA VERIFY" còn hơn ghi "xong" mà không đo.
N6  · Code không có nơi mount = CHƯA XONG. Phải chỉ được file:dòng nơi gọi tới.
N8  · Mọi dòng báo cáo có file:dòng.
```

**Luật giao diện**

```
G2 · panel nền đặc ≥92%
G4 · line-height ≥1,5  (thấp hơn là CẮT DẤU tiếng Việt)
G6 · nút quyết định phải có CHỮ, không chỉ biểu tượng
G8 · kéo thả KHÔNG được là đường duy nhất — luôn có nút thay thế
```

**Luật sản phẩm**

- IF là sản phẩm global. 0 tên khách, 0 brand studio nhúng cứng.
- Cấm chữ "tự động" ở nhãn hành động AI. Phễu AI tên "Magic".
- **KHÔNG đổi tên code** `lib/cad/`, `useCadStore`, route `/projects/[id]/cad`.

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .        # phải 0 lỗi
node scripts/check-chot.mjs  # phải 0 đỏ 0 vàng
npm test                     # không được thêm lỗi mới
```

> ⚠️ **Bài học 08/08:** một script in "✅ đã gỡ 7/7" trong khi thực tế gỡ nhầm, số hỏng tăng 7→27.
> Không ai phát hiện vì nó không tự đo lại. **Mọi việc trong phiếu này phải ĐO LẠI SAU KHI LÀM.**

---

# PHIẾU `p3c` · BẢNG KIỂM BA CHẶNG

**Tệp OUT:** `docs/M-BANG-KIEM-OUT.md`
**Sở hữu:** `lib/review/` · `components/review/` (tạo mới) · `components/studio/AppShell.tsx`
**Cấm đụng:** `lib/cad/standards/` · `lib/present-editor/` · `lib/three/` (chỉ IMPORT) ·
`components/render-studio/Command3DPanel.tsx` (`p14` giữ) ·
`components/render-studio/Render3DModeSkeleton.tsx` (`p3` giữ) · `prisma/` · `lib/server/` (`p12` giữ)

---

## Bối cảnh — chính phiên này đã dựng động cơ, giờ lắp đồng hồ

`lib/review/` — 7 tệp, kiến trúc hai lớp **khoá ở kiểu dữ liệu**:

```
FindingLuat  → BẮT BUỘC có: muc ('do'|'vang') · nguon (điều khoản dẫn được) · ruleId
FindingGopy  → KHÔNG CÓ CHỖ khai mức đỏ/vàng · không điểm số · không cờ chặn
ReviewResult → trả luat[] và gopy[] TÁCH SẴN — UI không bao giờ phải tự phân loại
```

Ba chặng đã cắm đủ:

| Hàm | Gọi tới |
|---|---|
| `review2d()` | `checkStandards()` — 11 bộ, 3 074 dòng, **nguyên trạng** |
| `reviewDeck()` | `evaluateDeck()` — `DECK_STANDARDS` có sẵn |
| `review3d()` | `rules-3d.ts` — 20 phép kiểm mới |

**Nhưng grep toàn repo: 0 nơi gọi.** Động cơ chạy trong phòng kín. Đo lại:

```bash
grep -rn "review2d\|review3d\|reviewDeck\|from '@/lib/review'" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v "^./lib/review/"
```

---

## VIỆC 1 — Đọc hợp đồng trước khi vẽ

Đọc **trọn** `lib/review/index.ts` (spec vẽ nằm sẵn ở docstring) + `lib/review/types.ts`.

**Đừng thiết kế lại.** Hợp đồng đã có, việc của phiếu này là **hiện nó ra màn**.

---

## VIỆC 2 — `components/review/ReviewPanel.tsx`

Một panel dùng chung cho cả ba chặng. Bắt buộc:

| Yêu cầu | Vì sao |
|---|---|
| **Hai lớp KHÔNG trộn trên màn** — hai khối riêng, tiêu đề riêng | Luật là pháp quy, góp ý là gu. Trộn là nói dối người dùng |
| Khối **LUẬT**: đỏ/vàng · số hiệu điều khoản · nguồn dẫn được · nút **Sửa** khi có `cachSua` | `FindingLuat.nguon` bắt buộc chính là để hiện chỗ này |
| Khối **GÓP Ý**: không màu cảnh báo · không điểm số · không chặn | Ba điều này đã khoá ở compile-time — UI không được lách |
| Mục mang `chuaKiemChung` phải **hiện rõ là chưa kiểm chứng** | N5 áp cả vào sản phẩm, không chỉ báo cáo |
| Tay cầm thu/mở dùng `components/ui/PanelFlank.tsx` | Mẫu chung toàn app (Hoà chốt 07/08). **Đừng chế dải thứ hai** |
| Bấm một mục → **nhảy tới đúng đối tượng** trên bàn vẽ / khối 3D / trang deck | Bảng kiểm không nhảy được thì chỉ là danh sách để đọc |
| Song ngữ VI/EN qua `useT` sẵn có | |

---

## VIỆC 3 — Mount

Mount **một chỗ duy nhất**, không ba chỗ. Panel tự đọc chặng đang mở rồi gọi đúng hàm.

Chỗ hợp lý: `components/studio/AppShell.tsx` — nơi đã quản Inspector.

**Khai `file:dòng` trong OUT.** N6 tính đúng chỗ này: không có nơi mount = chưa xong.

---

## VIỆC 4 — Lớp góp ý: GIỮ NGUYÊN trạng thái chặn

`lib/review/gopy/index.ts` đang **chặn có lý do** vì màn đề bài chưa xong.

⛔ **KHÔNG mở chặn. KHÔNG bịa nội dung AI.**
UI phải hiện đúng: *"chưa có đề bài dự án"*.

---

## NGHIỆM THU

1. `tsc` 0 lỗi · `check-chot` 0/0 · `npm test` không thêm lỗi.
2. **Ảnh chụp thật** ở cả ba chặng, mỗi ảnh thấy đủ hai khối tách bạch.
3. Chứng minh nhảy được: bấm một mục luật ở chặng 2D → đối tượng lỗi **được chọn** trên bàn vẽ.

Không có ảnh = **CHƯA VERIFY**, ghi thẳng vào OUT (N5).

---

## BÁO CÁO — `docs/M-BANG-KIEM-OUT.md`

1. `file:dòng` nơi mount (N6).
2. Ảnh ba chặng.
3. Mục **CHƯA VERIFY**.
4. Dòng cuối: *"Tệp OUT: `docs/M-BANG-KIEM-OUT.md` · dán vào phiên `p3c`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU — mở worktree riêng

Phiên `p12` đang chạy ở thư mục gốc. Hai phiên cùng một thư mục là hai người cùng sửa một bản vẽ.

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p3c -b feat/p3c-bang-kiem
cd ../interiorflow-wt-p3c && npm install && npm run dev -- -p 3012
```

Rồi mở phiên `p3c` **trong thư mục `interiorflow-wt-p3c`**.
