# STATUS — InteriorFlow (bản gọn 08/08 · trần <800 từ theo CLAUDE.md)

> Lịch sử chi tiết → `CHANGELOG.md` (bản cũ 8.674 từ chép NGUYÊN VĂN ở mục 08/08 — không đọc mỗi phiên). Chi tiết mẻ việc → `docs/M-*-OUT.md`.
> ⚠️ Git là sự thật duy nhất — verify SHA bằng `git log`, không chép từ brief/memory.
> ⚠️ Sản phẩm = **Thiết kế 2D · Thiết kế 3D · Trình chiếu** + login/Gallery/Vitals/Notebook.
> ⚠️ ĐỌC `CLAUDE.md` LUẬT NỀN TẢNG: IF độc lập global, không dính TTT; Brand Kit = từng dự án.

## 🟡 ĐANG CHẠY

- **p13/.idfc** (cây chính) — gộp Thư viện về `.idfc` v2: `docs/M-IDFC-2-OUT.md` · `M-THU-VIEN-OUT.md`.
  Working tree còn 4 file dở của phiên này (`components/library/*` · `lib/library/local-state.ts`) —
  **chưa commit, đừng đụng**. Chờ Hoà quyết kind `preset` cho 5 thumb `light-*`.
- **p7** (worktree `interiorflow-wt-p7`, server 3007) — lighting·camera·phím tắt, phiếu
  `docs/DAN-VAO-p7.md`, phiên riêng của Hoà đang/sắp chạy.
- Sổ phiếu đã phát → `docs/SO-PHIEU-DA-PHAT.md` (§0w — đọc TRƯỚC khi soạn phiếu mới).

## ✅ MERGE ĐỢT 08/08 (Hoà ra lệnh "merge đi" — phiên kiểm bàn giao thực hiện)

- **p14** (`d7364d2`) build-ops UI: Array 2 cửa + QuickCommandBox + 6 việc soi 3D · **p3c**
  (`87e7215`) ReviewPanel mount AppShell · **p2** (`c54267a`) dọn trần 5 sheet + cắt STATUS này.
  Conflict duy nhất: STATUS.md (bản cắt p2 thắng, mục hôm nay ghi lại ở đây). tsc + test chạy
  sau merge — kết quả ở báo cáo phiên. p3-mock rỗng (0 file) — bỏ nhánh. KHÔNG push (chưa có lệnh).
- Cùng phiên: vá regex `soi-that.mjs` → **1 đỏ thật duy nhất = `openingsWidthOnBoundary()`**
  (5 dòng kia là đổi tên/chữ bảng); dọn server §0aa (kill 3001 rác, giữ 3000); support.js +
  3 export mock hỏng xác nhận ĐÃ có/đã sửa (README-mocks đính chính). 🟡 Lệch chốt chưa sửa:
  dải mode 2D còn 3 nút (chốt 07/08 = 2) · intro clipart cũ (chốt 02/08 = video) · 3 thẻ
  trùng tên "Dự án mẫu" trong dev.db.

## ✅ VỪA XONG (chi tiết + số đo trong từng tệp OUT)

- Nghiệm thu build cuối + **vá bug CHẶN PHÁT HÀNH** (electron-builder rơi `node_modules/.prisma`;
  DMG 352MB đi hết 3 chặng thật) → `docs/M-BUILD-FINAL-OUT.md`.
- Cửa kiểm `check-chot` 🔴34→0, đã nối vào `npm test` → `docs/M-CHOT-OUT.md`.
- BOQ/FF&E/bảng món + dây ảnh→bản vẽ bấm thật → `docs/M-BOQ-OUT.md` · `M-FIX-C-OUT.md`.
- Soi 16 mảng chưa sổ (17 đề xuất GAP chờ TỔNG duyệt) → `docs/M-SOI-16-MANG-OUT.md`.
- Vật liệu PBR + ảnh vân · login UI · build-ops engine · snap 3D → `M-VAT-LIEU-OUT` ·
  `M-VAT-LIEU-2-OUT` · `M-LOGIN-UI-OUT` · `M-BUILD-OPS-OUT` · `M-3D-NOI-OUT`.
- Bảng màu sơn (bỏ Pantone) · tên node VI/EN · 3 task AI internal-free — CHANGELOG mục 08/08.

## 📌 WORKTREE ĐANG MỞ (đo 08/08)

Sau merge 08/08: `main` + **`interiorflow-wt-p7`** (giữ — phiên p7 + server 3007) + worktree đã
merge chờ dọn theo 4 điều kiện an toàn CLAUDE.md (xem báo cáo phiên merge).
(Ghi chú `interiorflow-g4` cũ đã LỖI THỜI — không còn.)

## ⬜ VIỆC KẾ TIẾP

- **BỎ HOÃN H4** — màn chọn 6 loại hồ sơ chặng Trình chiếu (chốt 07/08 mục 8; loại thứ 6
  "trình chiếu HTML" chưa có spec).
- Nối `ops[]`/UI cho 10 lệnh build-ops (p14 VIỆC 6) · menu "3D — sắp có" header canvas chưa nối
  Scene3DViewer.
- V1.1 so le nội thất theo cửa chính · V2.1 look-at + `CamPathPreview` chưa wire vào `/cad-editor`.
- Tay cầm thu/mở panel thành component dùng chung (chốt 07/08 mục 10) · liên kết sống CAD→deck.
- 17 dòng `G-M14-*` (soi 16 mảng) chờ TỔNG gộp vào `GAP-IF.md`.

## 🔴 LỜI DẶN CÒN HIỆU LỰC

- **G-M3-15 (54 block) chừa cho p2 — không đụng, tầng dữ liệu ngăn Cấu kiện sẵn chỗ.**
- **Hydrate**: `useFlowStore.hydrate()` CHỈ gọi từ `HomeScreen` — vào thẳng URL con là store về
  mặc định (`aiTier=2`, `userId` rỗng). Verify phải đi từ `/` bằng click UI thật.
- `findHatchBoundary` (`lib/three/cad-to-obj.ts`) treo >2 phút ở mật độ cực cao →
  `docs/TECH-DEBT.md`.
- `tsc -p .` chạy NỀN (`run_in_background`) thì xong bình thường; foreground bị cap ~40s.
- Scratch chờ Hoà `rm`: `app/dev-bench-3d-2/page.tsx` (bench, route 307kB — cân nhắc loại khỏi
  build phát hành). `tsconfig.scoped.json` ĐÃ dọn.
- File `*-css.ts` (template literal) **CẤM backtick trong comment** — gãy build 3 lần 07/08.
- Cấm `git stash`/`checkout` khi nhiều phiên chung một working tree (suýt-sự-cố P13 vòng 4).

## ⏳ CHỜ HOÀ QUYẾT

DWG: hướng GPL + nghiệm thu "huỷ <1s" + `terminate()` không cắt được WASM (`SO-KIEM-TONG.md` §11d)
· kind `preset` (p13) · kênh liên hệ written-offer GPL (`lib/legal/third-party-licenses.ts:29`)
· Pantone `lib/colors/trend.ts` · duyệt xoá 5 ảnh `public/covers/` (`detech/` đã xoá 07/08)
· `git filter-repo` dấu vết TTT + `pantone-tcx.json` + `__dwg-cancel-test.dwg` trong lịch sử git
(trước khi giao repo ra ngoài) · 4.1.f brand-kit thi công · sprint BOQ ĐỢT 3.

## Quy tắc session

1. Không tự merge/push **main** nếu chưa hỏi. **V6: phiên code KHÔNG commit — Hoà commit.**
2. Verify browser qua `127.0.0.1:<port>`; KHÔNG logout/xoá cookie. Login demo: `demo@if.local` /
   `demo1234`.
3. KHÔNG `prisma db push`/`migrate` qua sandbox — soạn lệnh cho Hoà. Backup:
   `sqlite3 dev.db ".backup 'ten'"`.
4. Nhiều phiên chung repo: mỗi phiếu một worktree riêng (`interiorflow-wt-*`), đọc
   `SO-PHIEU-DA-PHAT.md` trước khi nhận việc; một thư mục = MỘT dev server.
5. Nợ kỹ thuật → `docs/TECH-DEBT.md`. Quyết định đã chốt → `docs/00-CHOT.md`.
