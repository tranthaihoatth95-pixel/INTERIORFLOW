# Báo cáo · COLLAB-LOI — mở `ProvenanceInput` union cho distiller

> Phiên phụ COLLAB-LOI · 17/08 · vùng ghi: `lib/distill/**` + `lib/dna/**`. **KHÔNG** đụng
> `components/**` `app/**` `scripts/**` `--accent*` `schema.prisma` `docs/mocks/`.
> Khuôn 6 phần + ⑦b + ⑦c theo `docs/CLAUDE.md`.

## ⓪b · TIỀN ĐỀ HẠ TẦNG
- `git log -1` = `3d36277 docs(phieu): 4 phiếu đợt A — Collab lõi/vỏ · gỡ đồng · chốt worktree`
- `git rev-list --count HEAD..main` = **0** (đứng đúng đầu nhánh chính, không lệch commit)
- `git status --short` = sạch trước khi bắt đầu ⇒ **⓪b PASS**

## ⓪ · TIỀN ĐỀ NGHIỆP VỤ (NHẬN, có ĐÍNH CHÍNH nhỏ)
NHẬN cả 3 việc trong phiếu (mở union · phân nhánh xử lý · test 3 kind ×2 ca). Đính chính duy nhất
để phiên sau không đọc lệch: phiếu ⓪ ghi *"`distiller.ts:44` chỉ có `ProvenanceInput = { kind: 'image' }`"* —
đo thật `lib/distill/types.ts:23-25` **union hiện có 2 kind** `image | text`, chỉ là `text` chưa nơi
tiêu thụ. Không đổi kết cục việc (thêm 3 kind mới), chỉ ghi ra vì phiếu ⓪ diễn đạt hơi hẹp. **Kết
quả sau lượt này: union có 5 kind** (image · text · sticky · form · asset), tăng 3.

## 1 · TỔNG QUAN
Mở `ProvenanceInput` từ 2 lên 5 kind (thêm `sticky` · `form` · `asset`); `lib/dna/distiller.ts` phân
nhánh routing 3 kind mới vào ĐÚNG các lớp DNA đã có (yDo · ngonNguKhongGian · vatLieuMatId · anhNguon),
KHÔNG đẻ trường kết quả mới. Thêm hàm `distillDnaFromSources()` cho cửa sổ Thảo Luận gọi thẳng với
nguồn hỗn hợp. `mergeDistilledIntoCard` giữ nguyên hành vi bảo vệ `verified`. **tsc 0 · npm test 213
suite/0 fail · distiller.test 71 pass/0 fail** (14 ca cũ + 8 khối ca mới cho 3 kind mới, mỗi kind ≥2 ca).

## 2 · CHI TIẾT

### 2.1 Sửa/thêm file
| File | Sửa gì | Bằng chứng |
|---|---|---|
| `lib/distill/types.ts` | Thêm 3 nhánh discriminated union `sticky`/`form`/`asset` + 2 helper type `FormKind` `AssetKind` + doc dài liệt kê từng kind cắm vào đâu | `:23,45,47,48,50,58` |
| `lib/dna/distiller.ts` | Nâng SPECS: `anhNguon` nhận thêm `asset(image)` · `ngonNguKhongGian` nhận thêm `form(poles)` · `vatLieuMatId` nhận thêm `asset(material)` · `yDo` nhận `sticky.text` + `form(ba-hoi)`. Thêm helper `flatFormValues()`. Thêm hàm public `distillDnaFromSources(sources)` cho cửa Thảo Luận. `distillDnaFromAssets()` giữ nguyên chữ ký, forward qua hàm mới. | `:75-131,140,152` |
| `lib/dna/distiller.test.ts` | +8 khối ca test (49 assertion mới) cho 3 kind mới: sticky đủ/thiếu · form ba-hoi/poles/moodboard · asset image/material/other · hỗn hợp 4 kind · merge giữ verified · input rỗng | `:92-234` |

### 2.2 Routing sau khi vá (bảng nghiệm thu bằng mắt)
| Lớp DNA | Nguồn cũ | Nguồn MỚI |
|---|---|---|
| `anhNguon` | `image.caption`/`.id` | + `asset(image).label`/`.id` |
| `ngonNguKhongGian` | `image` tag `style:*` | + `form(poles)` — mỗi trường thành `<key>: <value>` |
| `mauTyLe` | `image.palette` | (không đổi — không suy palette từ nguồn không phải ảnh) |
| `vatLieuMatId` | `image` tag `material:*`/`mat:*` | + `asset(material).id` |
| `anhSang` | `image` tag `light:*` | (không đổi) |
| `khungHinh` | `image` tag `frame:*` | (không đổi) |
| `yDo` | LUÔN trống | ← `sticky.text` (bỏ text rỗng/whitespace) + `form(ba-hoi)` (mỗi hồi 1 giá trị) |
| `rangBuocDoTin` | LUÔN trống | (giữ trống ở rule-based — quyết định của người) |

### 2.3 Grep chứng minh
```
lib/distill/types.ts:48  | { kind: 'sticky'; id: string; text: string; author?: string; x?: number; y?: number }
lib/distill/types.ts:50    kind: 'form';
lib/distill/types.ts:58    kind: 'asset';

lib/dna/distiller.ts:83   if (s.kind === 'asset' && s.assetKind === 'image')
lib/dna/distiller.ts:91   if (s.kind === 'form' && s.formKind === 'poles')
lib/dna/distiller.ts:106  if (s.kind === 'asset' && s.assetKind === 'material')
lib/dna/distiller.ts:115  if (s.kind === 'sticky')
lib/dna/distiller.ts:119  if (s.kind === 'form' && s.formKind === 'ba-hoi')

lib/dna/distiller.ts:152  export function distillDnaFromSources(sources: readonly ProvenanceInput[]): DesignDnaLayers
```
Test khai `{ kind: 'sticky' }` × 4 dòng · `{ kind: 'form' }` × 5 dòng · `{ kind: 'asset' }` × 5 dòng
(mỗi kind ≥ 2 ca, đủ ràng buộc phiếu ③.4).

### 2.4 Kết quả thi hành
- `npx tsc --noEmit` — **EXIT 0**, 0 diagnostic
- `node_modules/.bin/sucrase-node lib/dna/distiller.test.ts` — **71 pass, 0 fail** (trước 30; +41 assertion mới)
- `node_modules/.bin/sucrase-node lib/distill/engine.test.ts` — **17 pass, 0 fail** (không phá ca cũ)
- `npm test` — **EXIT 0**, 213 test suite, 0 fail

## 3 · TỔNG KẾT VẤN ĐỀ
Trước lượt này, `distiller.ts:44` cứng cửa: `if (s.kind !== 'image') return []` — mọi nguồn không phải
ảnh bị vứt ⇒ cửa sổ Thảo Luận (mà NC-COLLAB-CHANG-3D chốt là mặt tiền của Collab chặng 3D) không có
đường vào `DistillEngine`. Sau lượt này: cửa đó mở, sticky/form/asset chảy vào ĐÚNG lớp đã có (không
đẻ trường mới, không phá hình dạng `image` cũ mà `from-photo.ts` phụ thuộc), và caller có hàm public
`distillDnaFromSources()` để gọi thẳng — vào đúng khuôn *"một cỗ máy, nhiều mặt tiền"* [Đ2] TRIET-LY-IF.md:72.

## 4 · ĐÁNH GIÁ KHÁCH QUAN
**Tốt:**
- Không phá `image` — `distillDnaFromAssets` giữ y chữ ký, chỉ chuyển thân sang gọi hàm mới ⇒ 0 tệp
  khác trong repo phải sửa (grep `distillDnaFromAssets` = 0 nơi gọi ngoài test).
- Luật `mergeDistilledIntoCard` KHÔNG XOÁ `verified` được chứng minh lại **bằng test cho ca sticky mới**
  (dòng test 216-224) — không phải chỉ "tin" mà chưa đo.
- Union mở đúng tinh thần SPEC-SEMANTIC-MODEL §3: 3 kind mới đều có **nơi tiêu thụ thật** đã khai trong
  NC-COLLAB-CHANG-3D (NoteNode · form Poles/Ba-hoi · Gallery asset) — không khai vống ngữ nghĩa.
- Routing `form(poles)` giữ nguyên chuỗi `<key>: <value>` thay vì tự diễn giải cực — người sau đọc log
  chưng cất còn truy được cực gì bấm mức bao nhiêu (T5 CON NGƯỜI QUYẾT CUỐI).

**Chưa/rủi ro:**
- Chưa cắm vào UI (đúng phạm vi phiếu — vùng ghi cấm `components/**`); cửa sổ Thảo Luận chưa gọi
  `distillDnaFromSources()` ở đâu — nợ cho phiếu vỏ Collab sau.
- Đường `text` (đã có sẵn 2 kind cũ) VẪN không có extractor nào nhận — nếu caller nào bơm `{ kind:'text' }`
  vào thì bị bỏ qua im lặng. Không phải bug do lượt này gây ra, nhưng đáng ghi để không tưởng là đã kết nối.
- Chưa test ràng buộc kiểu tĩnh cho `formKind`/`assetKind` bằng `@ts-expect-error` — hiện dựa vào tsc
  toàn repo pass là đủ, nhưng nếu ai đó nới literal type mà làm hỏng discriminated union thì test không
  bắt được ngay tại chỗ.

## 5 · HAI HƯỚNG XỬ LÝ TIẾP THEO
### Hướng A — nối `text` (đã có sẵn 2 kind cũ) vào extractor `yDo`
- Ưu: nhỏ (1 nhánh `if (s.kind === 'text')` trong extractor `yDo`), chốt luôn kiến trúc "text = ý đồ".
- Nhược: `text` chưa có nơi bơm dữ liệu thật (grep 0 nơi khởi tạo `{ kind: 'text' }` ngoài types), làm
  bây giờ là **khai vống ngữ nghĩa** — trái luật SPEC-SEMANTIC-MODEL §3. Đợi khi có caller mới làm.

### Hướng B — thêm 1 ca test tĩnh `@ts-expect-error` chứng minh discriminated union chặt
- Ưu: chốt kiểu union — thêm nhánh sai (vd `{ kind: 'sticky', text: 123 }`) là tsc đỏ NGAY tại file test,
  không phải chờ ca sử dụng thật.
- Nhược: 1-2 dòng test khá thừa vì tsc toàn repo đã bắt; giá trị nhỏ.

## 6 · ĐỀ XUẤT HƯỚNG TỐT NHẤT
**KHÔNG làm cả hai ở lượt này** — phiếu ⑥b nói ĐÍCH đã đạt (tsc 0 · npm test 0 fail · distiller.test
71 pass · grep chứng minh 3 kind). Hướng A vi phạm chính luật `[Đ2]` mà file đã dẫn (không khai vống);
hướng B lãi bé. **Đề xuất**: giao thẳng cho phiếu VỎ Collab (dựng `CuaSoCongCu` môi trường `ban-bac` +
nút "Chưng cất → Thẻ DNA" gọi `distillDnaFromSources`) — nợ CÓ CẢNH quả duy nhất của lượt lõi này.
Khi vỏ có, sẽ tự lộ ca thật cần cho `text` (nếu có) và ràng buộc tsc mạnh hơn (nếu cần).

## ⑦b · CHƯA CHẮC / CHƯA KIỂM
- **KHÔNG chạy dev server** (phiếu ⑤ cấm) ⇒ chưa xác nhận `distillDnaFromSources()` được browser gọi
  không dính bundling issue nào (đường code thuần TS, không dùng window/fs — rủi ro thấp).
- **Không đọc đủ `components/nodes/NoteNode.tsx` / `components/form/ConceptForm.tsx`** — chỉ tin số dòng
  NC đã đo (17/08 phiên COLLAB-NC). Nếu shape thật của `NoteNode.data.text` không khớp `sticky.text`,
  caller sẽ phải map — nhưng đây là việc của phiếu vỏ, không phá contract lõi.
- **Format `form(poles)` giá trị `"<key>: <value>"` là T tự chọn** vì phiếu không quy định. Có thể lộ
  ra một dạng khó parse ngược nếu về sau ai đó cần lấy lại số cực từ chuỗi. Hạn dùng: cho tới khi có
  người dùng thật của Bảng-so-cực.
- **`asset.assetKind === 'other'` mặc định bị bỏ qua** — hợp với luật "không đoán bừa" nhưng nếu về
  sau có kind asset mới (vd `light`/`framing`) thì caller sẽ ngạc nhiên vì không thấy gì. Đây là ràng
  buộc CÓ THẬT (extractor cấm suy), khai để phiên sau mở rộng biết đường vá.
- **CHƯA sửa bug xFromPhoto** ở `lib/idfc-import/from-photo.ts` (phiếu ⑤ dặn KHÔNG động) — bug đó NC
  đã ghi, cần phiếu riêng. Đo trong lượt này: `from-photo.ts` KHÔNG import gì từ `lib/distill/*` (0 nơi
  chạm) ⇒ lượt sửa union không làm hỏng thêm.

## ⑦c · HẠN DÙNG KẾT LUẬN
Kết luận này **hết đúng khi**:
- Có caller mới bơm `{ kind: 'text' }` vào `distillDnaFromSources()` (không có extractor nào nhận, sẽ
  bỏ qua im lặng — lúc đó phải thêm nhánh cho `text` ở extractor phù hợp).
- Shape thật của `NoteNode` / `ConceptForm` khi map sang `sticky`/`form` khác đáng kể với các trường T
  đã khai (`sticky.text` · `form.fields`) — lúc đó phải nâng union (thêm trường), có thể phá thêm test.
- Ai đó đổi hành vi `mergeDistilledIntoCard` (nay giữ `verified`) — mọi test hỗn hợp về "sticky mới không
  đè verified" sẽ đỏ, đúng cách canh phải làm.
- Hoà lật quyết định 15/08 (từ điển tên chuẩn) đổi tên `matId`/`ngonNguKhongGian`/`yDo` — tên lớp đổi
  thì cả routing lẫn test đổi theo.
