# M-REVIEW-OUT — báo cáo phiên p3c (07/08, khung kiểm hai lớp: LUẬT ↔ GÓP Ý)

Nền: `docs/CHOT-TACH-AI-VA-CHINH-TAY.md` (đọc trọn trước khi code). Sở hữu: `lib/review/` (mới)
· `lib/cad/standards/` · `lib/ai/` nhánh góp ý. Không đụng `lib/three/` (chỉ IMPORT type+hàm,
0 sửa) · `lib/cad/idfc.ts` · `lib/present-editor/` (chỉ IMPORT `evaluateDeck`/`DECK_STANDARDS`,
0 sửa).

## VIỆC 1 — khung chung `lib/review/` ✅

```
lib/review/
├── types.ts        Finding = FindingLuat | FindingGopy (discriminated union)
├── index.ts        review2d() · review3d() · reviewDeck() → ReviewResult {luat[], gopy[], gopyBiChan?}
├── luat/
│   ├── cad.ts      GỌI checkStandards() (lib/cad/standards — 11 bộ 3.074 dòng NGUYÊN TRẠNG), dịch Violation→FindingLuat
│   ├── deck.ts     GỌI evaluateDeck() (DECK_STANDARDS có sẵn), dịch LayoutWarning→FindingLuat
│   ├── rules-3d.ts MỚI — VIỆC 2 (3 nhóm luật đo được)
│   └── rules-3d.test.ts  20 phép kiểm
└── gopy/index.ts   lớp AI — CHẶN CÓ LÝ DO đợt này (xem VIỆC 3)
```

**Tách hai lớp bằng KIỂU DỮ LIỆU, không bằng lời dặn** — điểm ăn tiền của khung:
- `FindingLuat` BẮT BUỘC `muc: 'do'|'vang'` + `nguon` (điều khoản dẫn được) + `ruleId`; có
  `cachSua` thì UI hiện nút Sửa; `chuaKiemChung` mang `verified:false` của rule gốc qua.
- `FindingGopy` **KHÔNG CÓ CHỖ** khai mức đỏ/vàng, KHÔNG field điểm số, KHÔNG cờ chặn — ba cấm
  của phiếu bị khoá ở compile-time, muốn phạm phải sửa type và diff đó sẽ bị soi.
- `ReviewResult` trả `luat[]` và `gopy[]` TÁCH SẴN — UI không bao giờ phải tự phân loại (chỗ dễ
  trộn nhất).
- Ánh xạ mức 2D: `error→đỏ`, `warning/info→vàng` (bảng kiểm chỉ có 2 bậc cho lớp luật theo
  phiếu; info là tham khảo nên xếp vàng — ghi trong docstring `luat/cad.ts`).
- Deck: mọi cảnh báo DECK_STANDARDS là VÀNG — ngưỡng thẩm mỹ đo được, không phải pháp quy,
  nhưng vẫn lớp LUẬT (tất định) chứ không phải góp ý.
- 1 sửa nhỏ NGOÀI lib/review nhưng TRONG sở hữu (`lib/cad/standards/checker.ts`): thêm `export`
  cho `wallLikeDoc()` (bộ lọc "hình học tường thật cho phép đo") — rules-3d đo phòng cần ĐÚNG bộ
  lọc này, export dùng chung thay vì chép 5 dòng rồi lệch (K1). 0 đổi hành vi.

## VIỆC 2 — luật đo được chặng 3D (`luat/rules-3d.ts`) ✅ — VẪN LÀ LỚP LUẬT: thuần, tất định, 0 AI

**(a) Đèn ↔ hình học** — ⚠️ diễn giải trung thực đầu file: viewer IF **cố ý không render bóng đổ**
(`MeshBasicMaterial`, SPEC-3D-CORE quyết định #3) ⇒ "so đèn với hướng bóng" KHÔNG có dữ liệu để
so theo nghĩa đen. Thứ đo được tất định hôm nay:
- `r3d-den-ngoai-mat-bang` — đèn xy ngoài khung bao mặt bằng +500mm (kèm nút sửa: kéo dấu đèn).
- `r3d-den-cao-bat-thuong` — đèn cao hơn khối cao nhất +300mm (Shift-kéo hạ cao độ).
- `r3d-canh-toi-den` — mặt trời dưới chân trời (`altitudeDeg<0`) + 0 đèn phòng.
- `r3d-rig-du-lieu` — dịch `LightRig.warnings` sẵn có (lumens≤0, levelId mồ côi).
Khi viewer có bóng thật thì mới so "đèn↔bóng" đúng nghĩa — ghi ở đây, không giả vờ.

**(b) Độ rọi theo công năng — NỐI DÂY `vn-lighting.ts`** (file tự khai "KHÔNG có logic đo/tính
lux nào trong checker.ts" — nay có nơi tiêu thụ đầu tiên, K4): phòng dò biên bằng ĐÚNG bộ dò của
checker (`wallLikeDoc` + hatch face — không chép thuật toán), E ước lượng = Σlumens trong phòng ×
UF 0.4 / m². Chỉ 3 công năng bộ luật gốc có số (living/bedroom/kitchen) — phòng khác KHÔNG kiểm,
thà thiếu còn hơn bịa ngưỡng. Mọi finding nhóm này mang `chuaKiemChung: true` (rule gốc
`verified:false` + UF là số thực hành) — UI phải hiện rõ.

**(c) Khối hở** — `r3d-khoi-ho`: polyline có `heightMm` mà không khép kín (cờ `closed` + so điểm
đầu-cuối <1mm) ⇒ lăng trụ hở sườn, hỏng xuất khối kín/in 3D về sau; `r3d-khoi-ho-thieu-diem`
(<3 điểm). Kèm cách sửa.

**Test `rules-3d.test.ts` — 20/20 pass**, gồm đúng các chứng minh VERIFY yêu cầu:
- **[1] TẤT ĐỊNH: cùng doc chạy 10 lần → 10 chuỗi JSON giống hệt** (điều lớp góp ý AI không thể).
- [2]-[5] từng luật báo đúng ca sai, im đúng ca đúng.
- **[6] hai lớp tách**: `gopy(null)` → 0 finding + lý do chặn; `review3d` trả luat có finding,
  gopy rỗng, `gopyBiChan` có câu lý do; mọi finding luật đều dẫn được nguồn.
- [7] adapter 2D dịch đủ trường (ruleId/muc/vị trí zoom).

## VIỆC 3 — lớp góp ý: BỊ CHẶN ĐÚNG NHƯ PHIẾU DỰ BÁO, không code AI đợt này ✅(chặn có chứng cứ)

Đo theo phiếu: *"Kiểm SPEC-BRIEF-INTAKE.md xem đề bài lưu ở đâu. Chưa có chỗ lưu thì BÁO."*
- `docs/SPEC-BRIEF-INTAKE.md` (77 dòng, đọc trọn): mô tả luồng brief thật (PDF/Word → phiếu có
  cấu trúc → hỏi lại chỗ thiếu) — **CHƯA CODE** (§5 "Thứ tự" toàn việc tương lai).
- Chỗ lưu duy nhất hôm nay: `components/cad/AiBriefPanel.tsx:177` `draftCache.brief` — **draft
  cache localStorage của panel soạn thảo**, không phải đề bài chính thức của dự án (không trong
  Doc/DB, đổi máy là mất). `grep briefText|BriefIntake|deBai lib/ components/` = 0 chỗ lưu khác.
⇒ `gopy/index.ts` chỉ chứa HỢP ĐỒNG + GUARD: chưa có `DeBaiDaGhi` → trả `biChan` với câu lý do
người dùng đọc được ("máy sẽ tự bịa một concept rồi chấm theo nó"), **0 lời gọi model**. Phần
ollama cắm vào đúng chỗ này ở phiếu sau, khi màn đề bài (G-M5-11 / p3-02) có chỗ lưu thật.

## VIỆC 4 — giao diện: CHƯA LÀM, ngoài vùng sở hữu phiếu này (N5, nói thẳng)

Phiếu giao vùng `lib/review/ · lib/cad/standards/ · lib/ai/` — bảng kiểm UI sống ở `components/`
(panel Kiểm chuẩn hiện tại của CAD nằm trong `CadEditor.tsx`, vùng phiên khác). Khung đã trả đúng
hình UI cần (ReviewResult tách 2 lớp + `gopyBiChan`), spec vẽ đã nằm trong docstring `index.ts`
(phần trên LUẬT đỏ/vàng + nguồn + nút Sửa · vạch ngăn · phần dưới GỢI Ý dấu Magic tím + chữ
"gợi ý" + nút Bỏ qua · chỗ ngồi cố định 3 chặng). Phiên UI chỉ việc vẽ theo — không phải nghĩ lại.
⇒ Ảnh chụp bảng kiểm 3 chặng (VERIFY N6) theo đó CŨNG CHƯA CÓ — không có UI thì không có gì chụp;
phần chứng minh bằng máy (tất định 10 lần · góp ý không chặn) đã nằm trong test [1] và [6].

## VERIFY
- `rules-3d.test.ts` **20/20 pass** (log đầy đủ trong transcript).
- `npx tsc --noEmit -p .` → **0 lỗi**.
- `npm run check:chot` → **9 luật · 0 vi phạm chặn · 0 cảnh báo**.
- `npm test` (license:check + check:chot + TOÀN BỘ *.test.ts qua sucrase-node) → **exit 0, 0 fail**
  (kể cả fail cũ `cad-to-obj` đã được phiên khác sửa xong — bộ test hiện xanh trọn).
- 🔴 Ảnh chụp bảng kiểm 3 chặng: **CHƯA VERIFY ĐƯỢC** — UI chưa tồn tại (VIỆC 4 ngoài vùng), và
  môi trường browser phiên này vẫn kẹt server §0aa của phiên khác (xem M-PANEL-OUT.md).

## §V7 — đã xong · còn treo · CHƯA VERIFY
- ✅ VIỆC 1 (khung 2 lớp, 3 chặng cắm đủ: cad→standards nguyên trạng · deck→DECK_STANDARDS ·
  3d→rules mới) · VIỆC 2 (3 nhóm luật 3D đo được + 20 test) · VIỆC 3 phần ĐÚNG PHẢI LÀM (guard
  chặn có lý do, không bịa AI khi chưa có đề bài).
- ⬜ Còn treo: phần model ollama của lớp góp ý (chặn bởi màn đề bài — đúng dự báo cuối lượt của
  phiếu) · VIỆC 4 UI bảng kiểm (vùng components, cần phiếu cho phiên UI; hợp đồng + spec vẽ đã
  sẵn trong `lib/review/index.ts`).
- 🔴 CHƯA VERIFY: ảnh bảng kiểm 3 chặng (chưa có UI); còn lại đã verify bằng test/tsc/check-chot.
- V6 KHÔNG commit. File mới: `lib/review/{types,index}.ts` · `lib/review/luat/{cad,deck,rules-3d,rules-3d.test}.ts`
  · `lib/review/gopy/index.ts` · `docs/M-REVIEW-OUT.md`. File sửa: `lib/cad/standards/checker.ts`
  (1 từ khoá `export` + comment, 0 đổi hành vi).
