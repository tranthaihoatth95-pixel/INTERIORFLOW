> **CÁCH DÙNG:** `Cmd+A` → `Cmd+C` → dán vào phiên **`p14. Bevel, chamfer, array…`**
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
KS4· LÙI ĐƯỢC — mọi phép sửa hình phải Ctrl+Z về được
```

**Luật sản phẩm**

- `MaterialDef` = thị giác · `ProductSpec` = thương mại. **Cố ý không trộn** (luật 2.1.9.i).
- Cấm chữ "tự động" ở nhãn hành động AI.
- **KHÔNG đổi tên code** `lib/cad/`, `useCadStore`, route.

**Cửa kiểm trước khi báo xong**

```bash
npx tsc --noEmit -p .
node scripts/check-chot.mjs
npm test
```

---

# PHIẾU `p14` · MỞ KHO DỰNG HÌNH

**Tệp OUT:** `docs/M-BUILD-OPS-2-OUT.md`
**Sở hữu:** `lib/three/build-ops.ts` · `lib/three/csg.ts` · `components/render-studio/Command3DPanel.tsx`
**Cấm đụng:** `components/studio/AppShell.tsx` (`p3c` giữ) ·
`components/render-studio/Render3DModeSkeleton.tsx` (`p3` giữ) ·
`prisma/` · `lib/server/` (`p12` giữ) · `lib/review/` (`p3c` giữ) · `lib/cad/`

---

## Bối cảnh

Chính phiên này đã viết `build-ops.ts` (xem `docs/M-BUILD-OPS-OUT.md`, dòng *"Sở hữu"*).
Nó xuất **13 hàm** — nhưng **11 hàm có 0 nơi gọi** ngoài chính nó và tệp test:

```
arrayGrid · arrayRadial · loftSections · revolveProfile · sweepProfile
prismTapered · prismChamfered · prismBeveledEx · mirrorGeometry
offsetPolygonInwardMm · filletPolygonMm
```

Hai hàm còn lại (`geometryOf`, `resolveGroupGeometry`) **có đường sống thật** qua
`lib/three/obj-scene-to-geometry.ts:12`.

Đo lại — đừng tin con số trên:

```bash
for fn in arrayGrid arrayRadial loftSections revolveProfile sweepProfile prismTapered prismChamfered prismBeveledEx mirrorGeometry offsetPolygonInwardMm filletPolygonMm; do
  echo "$fn: $(grep -rn "\b$fn\b" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v 'lib/three/build-ops' | wc -l)"
done
```

Ví von: **kho đã đóng đủ hàng, chưa mở cửa bán.**

---

## VIỆC 1 — Phân loại trước, đừng nối bừa cả 11

Không phải hàm nào cũng đáng có nút riêng. Chia **ba nhóm**, ghi bảng vào OUT:

| Nhóm | Nghĩa | Cách xử |
|---|---|---|
| **A · đáng có nút** | Người thiết kế nội thất dùng thật — nhân bản lưới ghế, xoay tròn quanh trục, vát cạnh bàn | Lên `Command3DPanel` tab **Tạo** |
| **B · là bước con** | Chỉ được hàm khác gọi, không đứng riêng (`offsetPolygonInwardMm`, `filletPolygonMm`) | Nối vào hàm cha, **ghi rõ cha là ai** |
| **C · chưa tới lúc** | Cần dữ liệu chưa có | Ghi vào OUT làm GAP cho TỔNG — **không nối gượng** |

⚠️ Xếp nhóm phải **nêu lý do theo nghề nội thất**, không theo cảm tính kỹ thuật.

---

## VIỆC 2 — Nối nhóm A

| Yêu cầu | Chi tiết |
|---|---|
| Nút có **CHỮ** | G6 — không chỉ biểu tượng |
| Ô nhập tham số | số hàng/cột · khoảng cách · bán kính · số đoạn — **đơn vị mm**, hiện rõ |
| **Lùi được** | KS4 — xong bấm `Ctrl+Z` phải trả về hình cũ |
| Chưa chọn vật → nút **khoá + nói rõ lý do TẠI CHỖ** | Không dùng tooltip. Bài học màn rỗng 07/08: **lý do khoá phải lộ mặt** |
| Phép nặng → cho **xem trước** rồi mới chốt | |

---

## VIỆC 3 — Test

Mỗi phép nối phải có phép kiểm **đo kết quả hình học**:

```
số đỉnh · khung bao (bounding box) · thể tích
```

**Không phải** chỉ "gọi được, không nổ". Theo khuôn `lib/three/build-ops.test.ts` sẵn có.

---

## NGHIỆM THU

1. Số hàm 0-nơi-gọi giảm từ **11** xuống — ghi rõ **còn bao nhiêu, hàm nào, vì sao còn**.
2. **Ảnh**: chọn một khối → chạy một phép nhóm A → hình đổi → `Ctrl+Z` → về như cũ.
3. `tsc` 0 lỗi · `npm test` không thêm lỗi.

Không có ảnh = **CHƯA VERIFY** (N5).

---

## BÁO CÁO — `docs/M-BUILD-OPS-2-OUT.md`

1. Bảng phân ba nhóm A/B/C, mỗi hàm một dòng lý do.
2. Số hàm 0-nơi-gọi **TRƯỚC / SAU**.
3. `file:dòng` nơi nối từng phép.
4. Ảnh chứng minh lùi được.
5. Mục **CHƯA VERIFY**.
6. Dòng cuối: *"Tệp OUT: `docs/M-BUILD-OPS-2-OUT.md` · dán vào phiên `p14`"* (§0ac).

**KHÔNG commit.**

---

## ⚠️ TRƯỚC KHI BẮT ĐẦU — mở worktree riêng

```bash
cd ~/Downloads/interiorflow
git worktree add ../interiorflow-wt-p14 -b feat/p14-build-ops-ui
cd ../interiorflow-wt-p14 && npm install && npm run dev -- -p 3013
```

Rồi mở phiên `p14` **trong thư mục `interiorflow-wt-p14`**.
