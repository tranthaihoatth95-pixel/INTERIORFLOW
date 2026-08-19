# IF · INTEGRATION GATE — 19/08/2026

> **STOP GATE trước thi công feature.** Vai INTEGRATION COORDINATOR lập, Hoà duyệt.
> Cặp với: `IF-INTEGRATED-EXECUTION-MAP.md` (bản đồ thi công) · `IF-CAPABILITY-EXPOSURE-MATRIX.md` (ma trận chi tiết).
> Mốc đo: HEAD `c7f3ac8` + working tree 88 dirty, 19/08 khuya — re-verify độc lập, không chép audit.

---

## 1 · ĐIỀU KIỆN GATE — trạng thái từng điều

Luật gốc (prompt Hoà 19/08): *"Chưa code feature cho tới khi mọi điều dưới đạt."*

| # | Điều kiện | Trạng thái 19/08 khuya | Còn thiếu |
|---|---|---|---|
| G1 | Mọi surface quan trọng có capability owner | ✅ **ĐẠT** — 26 route + 12 mục nav registry map đủ vào matrix; 1 ngoại lệ = `/workhub` (owner = Hoà chưa bấm hướng, ghi U1) | /workhub chờ Hoà |
| G2 | Mọi capability quan trọng biết surface hoặc đánh dấu intentional-headless | ✅ **ĐẠT** — matrix phủ 9 lane; HEADLESS-OK khai đúng 3 ca (lark-write fail-closed · gopy chặn-có-chủ-đích · CommentLayer flag có tài liệu); 7 ORPHAN còn lại đều có Action | — |
| G3 | Router/architecture/UX không còn conflict chưa phân xử | ✅ **ĐẠT** — 0 conflict kiến trúc mới (UX lane xác nhận + reality 19/08 khuya); 6 DRIFT sổ↔code ĐÃ GHI NHẬN kèm phiếu sửa (R9) — DRIFT ≠ conflict, không chặn | — |
| G4 | 11 reconnect có dependency/order | ✅ **ĐẠT** — Execution Map §3 Đợt 0: R1-R11 kèm cỡ/phụ thuộc/blast-radius/rollback | — |
| G5 | 6 true-missing có negative evidence | ✅ **ĐẠT** — matrix mục TRUE-MISSING: T1-T6 đều có negative evidence theo B25 | — |
| G6 | Unknown-owner đã gán owner hoặc explicit UNKNOWN | ✅ **ĐẠT** — U1-U6 đều explicit, 4 chờ Hoà bấm (workhub · hatch-t-junction · GPL · intro-video), 2 vào lô dọn | 4 nút chờ Hoà |
| G7 | **Hoà duyệt artifact** | ⬜ **CHỜ** — artifact UI đã build (link ở báo cáo cuối phiên) | **Hoà bấm** |

**⇒ GATE: 6/7 ĐẠT. Điều kiện cuối = mắt Hoà trên artifact.** Sau khi Hoà duyệt (kèm các nút bấm ở §3), Đợt 0 R1-R11 được phép mở phiếu.

---

## 2 · LUẬT THI CÔNG SAU GATE (trích, không thay B25)

1. Chỉ phiếu trong danh sách **R1-R11** (Execution Map §3) được mở ở Đợt 0. Việc ngoài danh sách → qua B25 đủ thang bậc + T duyệt.
2. Mỗi phiếu: ô ⓪ tiền đề + ⓪b đo HEAD/git-status + guardian contract (Map §4) + ⑦b CHƯA CHẮC + ⑦c hạn dùng.
3. Mỗi dây đứt MỘT phiếu — cấm gộp, cấm nhân tiện refactor vùng dày.
4. Verify độc lập sau code: tsc + test + **browser thật** cho flow UI (bài học "76 xong-máy đối 1 xong-mắt" — phiếu UI không có browser verify là chưa xong).
5. Không commit/push — Hoà bấm theo nhịp riêng.
6. Persistence key bất biến: `concept/render/present` · `sketch/pro/revit` · `rev` · `interiorflow.*` · tên đuôi file.
7. Cấm đụng `--accent*` (chờ Hoà chọn mòng két ↔ mận).

## 3 · NÚT CHỜ HOÀ (gom một chỗ — bấm là mở khoá)

| # | Nút | Mở khoá |
|---|---|---|
| H1 | **Duyệt artifact Integration Map** (G7) | toàn Đợt 0 |
| H2 | Gật vị trí mount Vitals (chốt 16/08 đã có — chỉ cần "áp dụng") | R2 |
| H3 | ✓ mock Ca D (Cửa Sổ Thảo Luận) | R10 |
| H4 | Quyết sống/chết `lib/idfc-import` 3.341 dòng | R11 → UF-8 |
| H5 | Bấm hướng `app/workhub/` (gỡ / dán nhãn mock / chờ Electron) | U1 |
| H6 | Chạy runbook DB (backup → db push → generate → backfill) | Slice 1A-2B · UF-7 trọn |
| H7 | Commit working tree 88 mục theo nhịp riêng | giảm rủi ro mất trắng (P0-4) |
| H8 | Duyệt lô DEPRECATE rẻ (IntroSequence gốc · dev-bench · _shot.mjs · cặp __lincoln · exportIdfcStoreJson · slide-templates) | dọn ~5MB + bớt nhiễu |

## 4 · CAM KẾT ĐO ĐƯỢC SAU ĐỢT 0 (nghiệm thu gate-exit)

Khi R1-R10 xong (R11 tùy Hoà), các con số này phải flip — đo bằng máy + browser:

- `missing-specId-item` trên món thả từ Thư viện: **có → 0** (R1)
- Nút giả toàn repo: **1 → 0** (R2 — chip StatusBar hoặc mount panel hoặc gỡ chip)
- ORPHAN user-facing: **7 → ≤2** (giữ web-lookup + idfc-import nếu Hoà chưa quyết)
- DISCONNECTED: **6 → 0**
- DRIFT sổ↔code đã ghi nhận: **6 → 0** (R9 sửa docs/comment)
- Nhãn hứa-quá-code: **4 → 0** (spotlight · Top tuần · PPTX · toast BulkIngest)

## 5 · P-S — ĐỀ XUẤT MÁY CANH MOUNT-CHAIN + RETRIEVAL DRIFT (không framework mới)

**Gap thật cả 4 máy soi hiện có đều mù**: `soi:frontier` (sổ↔code theo entry) · `soi:contract` (kho có dây) · `soi:cam-dien` (engine tới tay user — nhưng theo REGISTRY khai tay) · `soi:tu-dien` (nhãn) — **không cái nào phát hiện "component tồn tại + importer duy nhất là code chết"** (ca VitalsGesturePanel: engine ✅ contract ✅ nhưng mount chain đứt ở mắt giữa, cả 4 máy im).

**Đề xuất `soi:mount` — script ~150 dòng cùng họ soi hiện có, KHÔNG framework:**

1. **Thuật toán**: từ mỗi `page.tsx`/`layout.tsx` trong `app/` làm root, BFS theo import graph (tái dùng cách walk của `soi-that.mjs` — REUSE, không viết parser mới) → tập REACHABLE. Mọi `.tsx` trong `components/` có export component mà KHÔNG thuộc REACHABLE và KHÔNG nằm whitelist (`*.test.*` · story · intentional-headless khai trong file cấu hình nhỏ) → báo **MOUNT-ORPHAN**.
2. **Bắt được ngay hôm nay** (nếu chạy): VitalsGesturePanel · CuaSoThaoLuan · LightBar · ResumeWork · IntroSequence gốc · 3 Settings cũ · StageSwitcher-chain — đúng danh sách audit phải đào tay 5 lượt quét.
3. **Retrieval-Map drift**: thêm bước 2 rẻ — grep các `CODE ANCHORS (đo <ngày>)` trong `RETRIEVAL-MAP.md`, anchor nào chứa `file:line` mà file không tồn tại/symbol không còn → báo **STALE-ANCHOR** (đã có 2 ca thật hôm nay: LibraryDropBridge + ReviewPanel đổi path mà map không biết).
4. **Giới hạn khai thật**: dynamic import + Worker URL + require-string = mù (cùng giới hạn soi-that đã khai); false-positive đầu tiên xử bằng whitelist chứ không phức tạp hoá thuật toán.
5. **Không làm**: không AST đầy đủ, không dependency-cruiser npm mới (thêm dep phải qua license gate), không tự sửa gì — chỉ báo, exit 1 khi có MOUNT-ORPHAN mới so baseline.

Cỡ: ~1 ngày. Đề xuất nằm chờ trong gate — **Hoà gật thì thành entry registry** (`soi-mount`), làm TRƯỚC Wave 1 để Wave 1 không đẻ thêm orphan mới không ai biết.

## 5b · DELTA 19/08 tối — MAIN Batch 0A (durability) + 0B (thi công)

- **Chính sách git MỚI (prompt MAIN Hoà 19/08) ĐÈ luật §2.5 "không commit"**: phân biệt
  MACHINE-PASS → BROWSER-PASS → CHECKPOINTED → BACKED-UP → INTEGRATED → CLOSED. Implementation
  xong không được chết dạng dirty tree.
- **R1 · R3 · R7 = CHECKPOINTED** trên nhánh `backup/2026-08-19-batch0a` (5 commit xếp chồng từ
  HEAD `c7f3ac8`: R3 `f25716e` → R7 `355459d` → wave0-snapshot `5249447` → R1 `bcb13c5` → bổ sung
  untracked `bb53eae`). Tip == working tree 100% (verify temp-index). Machine re-verify 19/08 tối:
  224 test targeted pass. `main` KHÔNG đổi — H7 vẫn của Hoà.
- **BACKED-UP một nửa**: bundle 205MB tại `~/Downloads/IF-git-backup/if-backup-2026-08-19-batch0a.bundle`
  (main + backup branch, full history). ⛔ `git push origin backup/*` bị permission mode chặn —
  cần Hoà mở rule hoặc tự push (LỆNH: `git push origin backup/2026-08-19-batch0a`).
- **Batch 0B ĐÓNG 19/08 tối — R4 + R5 + R8 xong, CHECKPOINTED** (`a1a8533` · `073881e` · `388a893`):
  · R4 Tool3DBar→ToolbarChip: MACHINE-PASS (tsc 0 · tool3d 34) · BROWSER-PENDING.
  · R5 LightBar hàng đợi + ResumeWork vào Home: MACHINE + **BROWSER-PASS** (server 3001 thực tế
    KHOẺ — đè note "bệnh" cũ; LightBar % thật, widget tự ẩn). Hết 2 ORPHAN.
  · R8 geom2d reader: MACHINE-PASS (resolver 57 · idfc-store 21 · tsc toàn repo 0 ở trạng thái gộp)
    · BROWSER-PENDING. UF-2 mắt đứt 2 có reader đầu tiên. ⚠️ Nợ khai: specId chưa gắn được lên nét
    rời (schema Base chỉ cho Block/Hatch mang specId) — món idfc làm-phẳng chưa lên BOQ, phiếu sau.
  R10 GIỮ chờ H3 (dòng "H3 ✓" trong LATEST chưa đủ bằng chứng Hoà đã bấm).
- Phát hiện ngoài phạm vi (R5): "Mở lại" khi resume thiếu routeId bị LegacyStageRedirect dội về
  Home + toast — hành vi cầu redirect cũ, đáng phiếu riêng.
- Cập nhật §4: ORPHAN user-facing 7 → 4 (LightBar · ResumeWork · Tool3DBar-khuôn đã sống).
- INTEGRATION_BASE_SHA hiện hành = `c7f3ac8` (+ toàn bộ trạng thái đã checkpoint ở backup branch).

## 6 · CHƯA CHẮC

- Toàn bộ đo TĨNH — chưa browser verify (server 3001 bệnh theo LATEST). Các claim "bấm không ra gì" cần 1 lượt browser trước khi phiếu R2/R7 đóng.
- 2-3 phiên Claude khác có thể đang sửa cùng repo — con số 88 dirty biến động.
- `soi:mount` ước 150 dòng dựa trên walk sẵn có của soi-that — chưa đọc trọn soi-that.mjs để xác nhận walk tái dùng được nguyên khối.
- Chưa xác minh `dev.db` thật thiếu cột matId bằng chính tay (tin đo lane 4 pragma — 1 nguồn).

## 7 · HẠN DÙNG

Gate này sống tới khi Đợt 0 đóng. Mỗi R đóng → cập nhật bảng §4. Hoà commit working tree → đo lại toàn bộ số. Sau Đợt 0 → gate mới cho Wave 1 (điều kiện: U-Q1-01 đã chốt + runbook DB đã chạy).
