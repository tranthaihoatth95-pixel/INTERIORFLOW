# BÁO CÁO G4 — Kệ Thư viện chặng 2 (Thư viện = sheet kính trượt lên)

> Worktree `~/Downloads/interiorflow-g4`, nhánh `nhanh-g4`. Bước "G4 · Kệ Thư viện chặng 2" trong
> `docs/TICKET-CHANG2-BUILD-2026-08-02.md` — ticket ghi ⏸ *chờ chốt 3 câu*, nhưng 3 câu ĐÃ CHỐT
> 02/08 (`SPEC-STAGE-LIBRARIES.md` mục "✅ 3 điểm — CHỐT 02/08") ⇒ mở khoá, đã làm.

## Đã kiểm trước khi code (L1 — `LUAT-GIAO-DIEN-BAT-BUOC.md`)

- `git merge main` trước (lấy `mock-if-3chang.html` + `StageShell` mới) — sạch, không conflict.
- Đọc: `SPEC-STAGE-LIBRARIES.md` (kệ theo chặng · 3 động tác · 4 mức phạm vi) ·
  `PLAN-LIBRARY-GATEWAY.md` **mục 0 đọc kỹ, 5 chỗ xung đột** · `SPEC-NAVIGATION-MODEL.md` §1 ·
  `SPEC-HOVER-FOCUS-IDF.md` §2 · `docs/mocks/mock-if-3chang.html` (khối THƯ VIỆN, port nguyên văn).
- `ls components/library/` (9 component sẵn) + `lib/library/` (3 file sẵn) — TÁI DÙNG
  `PublishModal` · `LibraryToast` · `local-state` thay vì viết lại.
- Kiểm TỪNG biến token mock cần trong `app/globals.css`: `--mat-card` `--blur-strong`
  `--shadow-sheet` `--mat-overlay` `--mat-hairline` `--border-strong` `--accent-warm`
  `--accent-strong` `--field` `--hover` `--radius-*` `--fw-semi` `--ease-apple` `--dur-base`
  → **có thật, dùng thẳng**. Thiếu đúng 2 thứ: `--fs-2xs` và class `.mat-sheet` ⇒ khai trong
  phạm vi sheet (`.if-lib-root`), KHÔNG sửa `globals.css` (ngoài vùng code G4).

## 4 commit

| # | Commit | Nội dung |
|---|---|---|
| 1 | `8e04f85` | `lib/library/shelves.ts` (cấu trúc kệ 2 nhóm + 4 mức phạm vi) · `use-library-sheet.ts` (một cửa vào duy nhất) |
| 2 | (sheet) | `library-sheet-css.ts` port nguyên văn + `LibrarySheet.tsx` + mount ở `/library` để nghiệm thu |
| 3 | `1ac485b` | `BulkIngestMode.tsx` — "Nạp hàng loạt" thành 1 CHẾ ĐỘ của sheet |
| 4 | (báo cáo) | File này |

## Đối chiếu yêu cầu

| # | Yêu cầu | Trạng thái |
|---|---|---|
| 1 | Sheet kính TRƯỢT LÊN từ đáy, không panel hẹp/trang riêng · Esc + bấm ngoài đóng · port `.lib/.scrim/.shelf/.chips/.grid` · `.mat-sheet` blur-strong · `--shadow-sheet` · bo `--radius-xl` 2 góc trên | ✅ Đo DOM thật: đóng `top=900`, mở `top=340 height=560` = đúng `min(560px,74vh)`; `width=980` = `min(980px,94vw)` |
| 2 | Kệ trái 2 nhóm — nhóm trên đổi theo chặng, nhóm dưới kệ chung | ✅ Đọc DOM ở `?stage=cad`: caption `Kệ chặng Vẽ` → Ký hiệu·khối 46 · Template bản vẽ 12 · Template phòng 9 · Hatch·vật liệu 2D 31 · Form lập luận 6; caption `Kệ chung` → ATLAS 1449 · Bộ nhận diện 3 · Ảnh & tài sản 218 · Phông·màu·nền 14 |
| 3 | Chip lọc 4 mức phạm vi (+ Tất cả · Gần đây) · badge phạm vi ở góc thumbnail | ✅ Lọc THẬT, không phải trang trí: Tất cả→12 món (4 loại badge), Chung→3 (chỉ CHUNG), Studio→3 (chỉ STUDIO), Dự án này→3 (chỉ DỰ ÁN) |
| 4 | 3 động tác: kéo=bản làm việc · áp=preset · publish CÓ CHỦ DUYỆT · nút "Đưa lên kệ" chân sheet | ✅ Vật liệu/hatch/preset = **áp**, còn lại = **kéo** (`APPLY_SHELVES`). Publish qua `PublishModal` sẵn có → hàng chờ duyệt, KHÔNG tự lên kệ chung |
| 5 | Một cửa vào duy nhất (nút Navigator mọi chặng · ô Vật liệu Inspector · phím tắt) | ⚠️ Hàm `openLibrarySheet()` + phím tắt **L**/Esc đã xong và verify. Nút ở Navigator/Inspector **chưa gắn được** — `components/studio/*` ngoài vùng code G4. Xem "Cần CHINH" bên dưới |
| 6 | Gộp `/library/ingest` thành 1 chế độ của sheet | 🟡 Làm phần LÕI (segmented "Duyệt kho \| Nạp hàng loạt" trong sheet). **DỪNG** trước phần đụng kiến trúc — xem mục ⛔ |

## ⛔ ĐÃ DỪNG — chỗ đụng `PLAN-LIBRARY-GATEWAY` mục 0.1, cần Hoà quyết

**Sự thật kiểm được:** `[+]` popover VÀ link `/library/ingest` **cùng nằm trong
`components/LibraryPanel.tsx`** (dòng 60 và 235–240) — file này **ngoài vùng code G4**
(`components/library/*` là thư mục con khác). Nên gộp trọn NT1 sẽ phải: xoá popover `[+]` +
đổi/xoá route `/library/ingest` + sửa `LibraryPanel.tsx` — đúng chỗ mục 0.1 gọi là *"đảo ngược
kiến trúc vừa chốt tháng 7, không phải xây tiếp"*.

**Mâu thuẫn tài liệu cần Hoà gỡ** (báo thẳng, không tự chọn):
- Mục 0.1 (viết 28/07 sáng) cảnh báo BỎ popover là đảo ngược ⇒ *"cần Hoà xác nhận"*.
- Nhưng **cuối chính file đó**, mục "Câu hỏi cần Hoà quyết — ĐÃ CHỐT 28/07" câu 1 ghi:
  > **CHỐT: BỎ HẲN, đúng NT1.** Không giữ, không thêm mục… tự chuyển sang chế độ "nạp hàng loạt"
  > TRONG CÙNG PANEL, không hỏi người dùng.
- Tức **cảnh báo mục 0 đã cũ hơn quyết định ở cuối file**. Ticket 02/08 lại nhắc cảnh báo cũ.

**Đã chọn đường an toàn:** làm phần additive trong vùng G4 (chế độ "Nạp hàng loạt" trong sheet),
**KHÔNG** đụng `LibraryPanel.tsx`, **KHÔNG** xoá `/library/ingest`. Không có gì gãy; bỏ phần thừa
sau này chỉ là xoá, không phải làm lại.

**3 việc còn lại chờ Hoà gật** (làm được ngay khi có lệnh):
1. Xoá popover `[+]` trong `components/LibraryPanel.tsx`, thay bằng thả tệp → tự nhận (đúng NT1).
2. `/library/ingest` → chuyển hẳn vào sheet, route cũ redirect (giữ bookmark) hoặc xoá.
3. Chuyển nốt bộ nâng cao của trang ingest (chưng cất manifest · AI Content Strategist) vào chế độ
   sheet — hiện **vẫn ở trang cũ**, chưa gộp, để không phải bê 371 dòng khi hướng còn chưa chốt.

## Cần CHINH — 1 dòng, ngoài vùng code G4

Sheet phải sống ở `StageShell` để có mặt ở **mọi chặng, cùng chỗ** (yêu cầu #5). Hiện mount tạm ở
`/library` để chạy/nghiệm thu được thật.

```tsx
// components/studio/StageShell.tsx
import { LibrarySheet } from '@/components/library/LibrarySheet';
// …trong JSX, sau {children}:
<LibrarySheet stage={active === 'cad' ? 'cad' : active === 'present' ? 'present' : 'render'} />
```

Nút "Thư viện" ở Navigator + ô Vật liệu trong Inspector chỉ cần gọi:

```tsx
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
onClick={() => openLibrarySheet()}                          // nút Navigator
onClick={() => openLibrarySheet({ shelfId: 'render-mat' })} // ô Vật liệu → mở thẳng kệ Vật liệu
```

Canvas nhận món kéo ra / preset áp vào bằng 2 sự kiện (đã phát, chưa ai nghe):
`if:library-instantiate` (detail = `SheetItem`, tạo BẢN LÀM VIỆC) · `if:library-apply`
(detail = `SheetItem`, áp preset lên vật đang chọn).

## Nghiệm thu

`tsc --noEmit` **0 lỗi** · `next lint` sạch vùng `components/library` + `lib/library` +
`app/library` (2 cảnh báo `no-img-element` còn lại là của `ingest/page.tsx` cũ, không thuộc việc
này) · `npm test` **exit 0**.

Verify browser thật 1440×900, **kiểm Tối trước** (Tối là mặc định app) rồi Sáng — console sạch:

| Kiểm | Kết quả |
|---|---|
| Sheet trượt lên/xuống | đo DOM: `top 900 → 340`, `height 560`, `width 980` |
| Phím tắt `L` | mở (`data-open=false→true`) |
| `Esc` | đóng (`true→false`), nghe ở pha bắt nên ô tìm kiếm trong sheet không nuốt phím |
| Kệ theo chặng | `?stage=cad` ra đúng 5 kệ chặng Vẽ + 4 kệ chung (đọc DOM, không nhìn ảnh) |
| Chip phạm vi | lọc thật — Chung/Studio/Dự án mỗi loại 3 món, badge khớp 1-1 |
| Nạp hàng loạt | 3 tệp → nhận đúng `Bản vẽ`/`Ảnh`/`Bảng tính`, chân sheet "3 tệp sẵn sàng" |
| Bàn phím | 32 phần tử focus được trong sheet; khi đóng đặt `inert` để Tab không chui vào sheet vô hình |
| 2 theme | Tối + Sáng đều đọc được (badge STUDIO dùng `--accent-warm` như mock) |

## Quyết định tự chọn khi gặp mơ hồ

1. **`body.lib` → `data-open`**: mock bật/tắt bằng class trên `<body>`; ở React ghi class lên
   `<body>` từ component dễ rò khi unmount ⇒ dùng thuộc tính trên chính 2 phần tử. Giá trị CSS y hệt.
2. **Món cho kệ KHÔNG phải kệ mặc định**: mock chỉ vẽ kệ mặc định (12 món/chặng, đã chép nguyên
   văn). Các kệ còn lại không có vật mẫu ⇒ đặt 2–3 món đúng nghĩa từng kệ, **đánh dấu rõ là mock**
   trong `shelves.ts`, để bấm vào kệ không thấy trống.
3. **Số đếm trên kệ** (46/12/9/31/6…) giữ nguyên số của mock — là số kho mock, chưa nối
   `/api/library`/ATLAS thật; đã ghi cảnh báo ở đầu `shelves.ts`.

## Đề xuất 3 việc tiếp theo

1. Hoà gỡ mâu thuẫn mục ⛔ → làm nốt 3 việc gộp ingest (đã liệt kê, làm được ngay).
2. CHINH gắn 1 dòng `<LibrarySheet/>` vào `StageShell` + nút Navigator/ô Vật liệu → đóng yêu cầu #5.
3. Nối `if:library-instantiate` / `if:library-apply` vào canvas thật (Render node · CAD block ·
   Present trang) — hiện mới phát sự kiện + toast, chưa có ai tiêu thụ.

---

# 05/08/2026 — PHIÊN S3 · BUILD #2: NỐI CỤM BÀN VÀO THƯ VIỆN BLOCK

**V6 — CHƯA COMMIT.** Mảng đụng: `lib/cad/workstation-clusters.ts` · `lib/cad/block-library.ts` ·
`components/library/*`. **KHÔNG đụng** `scripts/cad-library/**`, `public/cad-library/**`
(mảng COWORK VẼ, theo phiếu sửa giữa phiên), `components/studio/*` (mảng S5 — chỉ IMPORT).

## Việc đã làm

**VIỆC 1 — mount 6 cụm.** Trước phiên: `grep -rn "workstation-clusters" app/ components/` = **0 dòng**.
Nay có kệ **"Văn phòng · Cụm bàn"** trong sheet Thư viện (phím `L` / ⌘K "Mở Thư viện"), chỉ hiện ở
chặng 2D. **VIỆC 2 bỏ** theo phiếu sửa. **VIỆC 3** — không gõ tay toạ độ nào, xem mục cuối.

### grep chứng minh 6 cụm đã có nơi mount

```
$ grep -rn "workstation-clusters" app/ components/     # (bỏ các dòng docstring)
components/library/ClusterPanel.tsx:66:} from '@/lib/cad/workstation-clusters';
components/library/LibrarySheet.tsx:20:import { CLUSTER_SPECS } from '@/lib/cad/workstation-clusters';

$ grep -rn "ClusterPanel" components/
components/library/LibrarySheet.tsx:22:import { ClusterPanel } from './ClusterPanel';
components/library/LibrarySheet.tsx:271:  <ClusterPanel onInserted={() => setOpen(false)} />
components/library/ClusterPanel.tsx:166:export function ClusterPanel(…)
```

Chuỗi đủ: `AppShell.tsx:164 <LibrarySheet/>` → nút kệ `cad-clusters` (`LibrarySheet.tsx:239-247`)
→ `ClusterPanel` (`LibrarySheet.tsx:267-271`) → `CLUSTER_SPECS` → 6 hàm sinh →
`clusterPrimsToEntities()` (`block-library.ts:203`) → `useCadStore.addEntities()` (`store.ts:520`).

### 6 cụm — số đo LẤY TỪ HÌNH HỌC THẬT (`primsBBox`), không khai tay

| Cụm | Bao ngoài (kể cả ghế) | Chỗ | m²/chỗ riêng bàn | m²/chỗ cả lối đi | Entity |
|---|---|---|---|---|---|
| Chữ L xương sống | 2860×5600 | 8 | 2,00 | 2,98 | 49 |
| Bench thẳng hàng | 2440×5600 | 8 | 1,71 | 2,69 | 41 |
| Chữ Y — 6 chỗ | 6955×6263 | 6 | 7,26 | 11,64 | 33 |
| Góc 120° — 6 chỗ | 3278×3520 | 6 | 1,92 | 4,03 | 31 |
| Chữ thập — 4 chỗ | 2860×2860 | 4 | 2,04 | 4,54 | 22 |
| Bàn họp 12 chỗ | 3980×2034 | 12 | 0,67 | 1,85 → **TCVN ĐẠT** | 49 |

Tất cả sinh ra **polyline** — một cấp nét, không gán `color`/`lineweight` override, thừa hưởng layer
`l-furniture`. Đúng điều 1 `00-PHAN-TICH-NGUON-THAM-CHIEU.md`: phân cấp 4:2:1 chỉ ở tầng bản vẽ.

### Checkpoint — dùng khuôn chung S5, không tự đẻ

`components/studio/Checkpoint.tsx` cắm đúng chỗ phiếu chỉ định (thả cụm xuống bản vẽ):

| Điều | Cắm thế nào |
|---|---|
| KS1 `preview` | SVG dựng từ **chính `result.prims` sắp thả** + vùng chờ nét đứt + dòng đối chiếu TCVN. Không phải ảnh minh hoạ. |
| KS1 `params` | 5 dòng số kiểm + toàn bộ núm máy vừa chạy |
| KS2 `seed` | `clusterSeed(specId, values)` — băm FNV-1a bộ tham số. Cụm là hàm TẤT ĐỊNH nên seed = **dấu vân tham số**: cùng seed ⇔ cùng cụm. Đã ghi rõ trong docstring là không phải hạt ngẫu nhiên. |
| KS3 `items` | **2 phần: "Bàn + vách" / "Ghế"**. Bỏ tick Ghế ⇒ entity ghế KHÔNG vào `Doc`. Chọn cách chia này vì bản vẽ bố trí kỹ thuật hay vẽ bàn mà bỏ ghế — thao tác nghề thật, không phải chia nhỏ cho có. |
| KS4 `undoLabel` | "bản vẽ trước khi thả cụm (N đối tượng)", N đọc qua hook nên đúng theo thời điểm |
| KS5 `why` | mỗi item + mỗi núm đều có `why` (nguồn của trị số) |
| `onAccept(ids)` | chỉ ghép `deskPrims`/`chairPrims` theo ids đã tick. **Không có đường ghi cả mẻ.** |
| `onRetry` | **CỐ TÌNH KHÔNG TRUYỀN** → Checkpoint tự hiện nút disabled kèm lý do. Cụm tất định nên "làm lại nguyên tham số cũ" ra đúng hình cũ ⇒ truyền vào là nút giả (§9). |
| `phase` | luôn `'preview'` — cụm dựng trong ~1ms, không I/O. Bịa pha `running` + thanh tiến độ cho việc đó mới là giả. |

## Đối chiếu nguồn thẩm mỹ — và một lỗi tôi suýt báo sai

`clusterY()` mặc định cho **6955×6263**, trong khi `00-PHAN-TICH-NGUON-THAM-CHIEU.md` (nguồn `E1`)
ghi **6955×6023**. Tôi đã định ghi "lệch 4%". Đo kỹ thì:

- `deskEnvelopeMm` (bàn+vách) = **6955×6024** → khớp nguồn tới **1mm**
- `sizeMm` (kể cả ghế) = **6955×6263** → rộng hơn 240mm vì ghế nhô ra theo trục Y

⇒ **Không lệch.** 6955×6023 của nguồn là bao ngoài BÀN, đúng như `ClusterResult` đã ghi chú
("ghế bị đẩy ra/đẩy vào nên không ai lấy làm kích thước cụm"). Đã viết rõ vào docstring
`CLUSTER_Y_HUB_R_MM` để phiên sau không đo nhầm như tôi.

Bàn họp 12 chỗ, pitch 478: dựng ra **2390×914** vs nguồn `D1` **2388×914** — lệch **2mm**, do
94″ = 2387,6mm nên pitch đúng phải 477,52. Không chỉnh; ghi ra để biết.

## Cần COWORK VẼ vẽ thêm (S3 không tự thêm — `manifest.json` là mảng của cowork)

Manifest hiện **46 block / 11 nhóm · 0 block văn phòng**. Cụm bàn KHÔNG cần block tĩnh (sinh lúc
chạy), nhưng mặt bằng văn phòng vẫn thiếu — đây là VIỆC 2 đã chuyển đi, ghi lại kèm kích thước:

| Cần | Kích thước | Vì sao |
|---|---|---|
| Người nhìn từ trên | Ø450–550 (vai) | `B1`,`C1`,`D1`,`D2` đều có người. Không có người thì mặt bằng chết. |
| Người mặt đứng | cao 1650–1750 | bản vẽ mặt đứng (`C1`,`C2`) |
| Cây — tán tự do bất đối xứng | Ø800–1600 | ⛔ không răng cưa đều. Nguồn CC0: Temaki · Openclipart |
| Thảm định vùng | Ø1600–2400, nét đứt | công cụ zoning (`B1`), không phải trang trí |
| Ký hiệu ổ điện/mạng/công tắc | ~100–150 | nguồn QElectroTech (CC-BY, **phải ghi công**) |

Trong lúc chờ: panel cụm KHÔNG hiện ô giả cho các món này — không có ô nào, nên không vi phạm §9.

## Lỗi đã mắc trong phiên

1. **Suýt báo sai `clusterY` lệch 4%** — đo `sizeMm` rồi so với con số nguồn vốn là `deskEnvelopeMm`.
   Bắt được vì in cả hai ra trước khi viết. Bài học: `ClusterResult` có **hai** bao ngoài, đọc nhầm
   là báo oan cho code đúng.
2. **Tự đẻ checkpoint riêng** — vòng đầu tôi viết preview + nút "Thả vào bản vẽ" của riêng mình.
   Phiếu sửa giữa phiên báo S5 đã dựng khuôn chung ⇒ phải gỡ ra làm lại theo `Checkpoint`. Nếu
   phiếu tới muộn hơn thì repo đã có hai khuôn checkpoint lệch nhau.
3. **Gọi `useCadStore.getState()` trong thân render** để lấy số entity cho `undoLabel` — không phản
   ứng khi bản vẽ đổi, tức "lùi về đâu" sẽ nói sai số. Đổi sang hook `useCadStore((s) => …)`.
4. **Sửa docstring N8 sai chiều** — docstring `workstation-clusters.ts` khai
   "`00-PHAN-TICH-NGUON-THAM-CHIEU.md` không tồn tại". File NAY ĐÃ CÓ. Đã sửa lại + ghi rõ vẫn chưa
   mở được ảnh gốc `E1`/`E2`/`D1` (`docs/reference/` chưa có), đối chiếu mới tới bảng số chưng cất.

## Phát hiện ngoài phạm vi — ghi để phiên nối canvas biết

`LIBRARY_INSTANTIATE_EVENT` / `if:library-instantiate`: `grep` toàn `app/ components/ lib/` chỉ có
chỗ **PHÁT**, **0 nơi NGHE**. Tức kéo–thả món từ kệ hiện chỉ hiện toast, chưa rơi xuống bản vẽ.
Kệ cụm bàn **không đi đường này** (gọi thẳng `addEntities`) nên thả là có hình ngay. Đã ghi cảnh
báo tại chỗ khai hằng số trong `LibrarySheet.tsx`. Đây đúng là đề xuất #3 của báo cáo phiên trước —
vẫn chưa ai làm.

## Nghiệm thu — TRẠNG THÁI THẬT, có phần CHƯA chạy được

| Phép kiểm | Kết quả |
|---|---|
| `workstation-clusters.test.ts` | **85 pass · 0 fail** (chạy lại SAU khi thêm `deskPrims`/`chairPrims` — không hồi quy; test không có assert so-khớp-nguyên-hình nên thêm field là an toàn) |
| `sheet-migrate.test.ts` | 34 pass · 0 fail (mẫu đối chứng, không liên quan) |
| Dựng 6 cụm qua `CLUSTER_SPECS` | cả 6 ra hình, ra entity, không throw — bảng số ở trên |
| §0f TB4 "đổi dữ liệu, hình tự cập nhật?" | chữ L: 6/12/20 chỗ → 4200/8400/14000mm · bàn 1200/1400/1600 → 4800/5600/6400mm. **Có.** |
| `npm run license:check` | **pass (exit 0)** |
| `npx tsc --noEmit -p .` | ✅ **exit 0, sạch** — chạy SAU khi cắm `Checkpoint` |
| Nghiệm thu trình duyệt thật | 🔴 **CHƯA LÀM** — xem dưới |

### Ghi chú về `tsc`

Chạy được sau vài lần thử — giữa phiên công cụ chạy lệnh gặp lỗi hạ tầng tạm thời
("classifier temporarily unavailable") chặn riêng các lệnh `tsc` trong khi `grep`/`sucrase-node`/
`license:check` vẫn chạy. Không liên quan tới code. Kết quả cuối: **exit 0**.

## Nghiệm thu trình duyệt thật — ĐÃ LÀM (127.0.0.1:3000, chặng 2D, theme tối)

Mở sheet bằng đúng cửa chung (`if:library-open`, `use-library-sheet.ts:19`), không dựng đường tắt riêng.

| Kiểm | Kết quả đo |
|---|---|
| Kệ hiện đúng chỗ | `Văn phòng · Cụm bàn  6` nằm cuối nhóm "KỆ CHẶNG THIẾT KẾ 2D", trên "KỆ CHUNG" |
| 6 cụm | hiện đủ 6 thẻ kèm mô tả; bấm đổi cụm ra đúng bộ núm của cụm đó |
| §0f TB4 đổi dữ liệu → hình tự cập nhật | Số chỗ `8 → 16`: SVG vẽ lại ngay, dòng "Số chỗ" đổi theo. **Có.** |
| KS1 xem trước | khung `XEM TRƯỚC` + SVG cụm + vùng chờ nét đứt |
| KS1 tham số | đọc được: bao ngoài `2.860×5.600 mm` · riêng bàn `2.860×5.600` · 8 chỗ · `2` và `2.98` m²/chỗ |
| KS2 seed | hiện `Seed 3861766789` |
| KS3 duyệt phần | `Bàn + vách 17 nét · 2.860×5.600mm` · `Ghế 32 nét · 8 chỗ`. Bỏ tick Ghế → nút đổi **"Nhận 2 phần" → "Nhận 1 phần"**. Bỏ tick cả hai → nút **tự disabled** (`acceptGate`). |
| KS4 lùi về đâu | "Không nhận thì quay về: bản vẽ trước khi thả cụm (**128 đối tượng**)" — số thật của bản vẽ đang mở |
| §9 nút giả | `Làm lại` **disabled = true** (đúng chủ ý không truyền `onRetry`); `Nhận`/`Sửa tham số rồi làm lại` enabled |
| Lỗi console | không có lỗi liên quan panel |

🟡 **KHÔNG bấm "Nhận" trên máy thật.** Bản vẽ đang mở là của **phiên khác đang làm việc song song**
(`Đang mở nơi khác`, 128 đối tượng) — chèn hình vào doc của họ là đúng thứ `STATUS.md` cấm lặp lại.
Đường ghi đã verify headless thay thế: `clusterPrimsToEntities()` sinh **49 entity polyline** cho
cụm chữ L 8 chỗ, đúng loại, đúng số. Sau khi đóng sheet đo lại: `entities 128 · past 0` ⇒ **không
đụng gì vào bản vẽ của họ**.

## 🔴 LỖI TỰ GÂY, BẮT ĐƯỢC LÚC NGHIỆM THU — đã sửa

**Nút "Nhận" nằm ngoài màn, không bấm được.** Đo DOM lần đầu: `.libmain` `overflow-y: visible`,
cao 447px trong khi nội dung 878px; đáy checkpoint ở **1136px** còn viewport chỉ **720px**. Nút
`Nhận 2 phần` CÓ trong DOM nhưng không cuộn tới được ⇒ tính năng coi như chết.

Nguyên nhân: `.libmain` là flex-column cao cố định, con của nó **phải tự claim** `flex:1` +
`minHeight:0` + `overflow-y:auto` mới cuộn — đúng cách `.grid` đang làm
(`library-sheet-css.ts:96`). Panel của tôi là `<div>` grid trần, không claim gì.

Sửa (chỉ trong `ClusterPanel.tsx`, không đụng CSS chung): gốc panel `flex:1 · minHeight:0` +
padding khớp `.grid`; **cả hai cột** `minHeight:0 · overflowY:auto`. Đo lại: cột phải
`scrollHeight 892 > clientHeight 419 · canScroll true`, cuộn xuống thì nút Nhận nằm **trong**
khung sheet (`btnInsideSheet: true`). Bài học ghi luôn vào comment: nhét thành phần CAO vào
`.libmain` thì phải tự lo cuộn.

## Nghiệm thu cuối — chạy lại sau khi sửa

```
npx tsc --noEmit -p .                          → TSC_EXIT=0
lib/cad/workstation-clusters.test.ts           → 85 pass, 0 fail
npm run license:check                          → LICENSE_EXIT=0
```
