# Báo cáo R9a — lô "nhãn nói thật" + lô lux + 3 DRIFT sổ (19/08)

WORKER R9a · HEAD `c7f3ac8` main (⓪b PASS) · scope text-only + rules-3d · KHÔNG git add/commit.

## 1 · Tổng quan
Đóng Gate §4 "Nhãn hứa-quá-code: 4 → 0" (cả 4 đo lại vẫn hứa quá, đã sửa chữ), xoá bản chép tay
công thức lux ở `rules-3d.ts` (gọi engine `lib/lighting/lux.ts` — bản chép còn THIẾU MF=0.8),
sửa 3 DRIFT sổ (D2/D3/D4) tại `INTERIORFLOW-ARCHITECTURE-MAP.md` có đóng dấu 19/08.
Mục 4 (comment resolve.ts) SKIP — đã được sửa từ trước. tsc 0 · test targeted 27+26 pass.

## 2 · Chi tiết từng mục

| # | Mục | Kết quả | Bằng chứng |
|---|---|---|---|
| 1a | Spotlight "Chọn cho dự án này" | **SỬA** → "Mục đầu kệ / First on the shelf" + comment lý do | `LibrarySheet.tsx:414` vẫn là `items[0]`, 0 logic ngữ cảnh dự án; nhãn tại `:720` (cũ) |
| 1b | Tab "Top tuần này" | **SỬA** → "Gần đây trước / Recent first" | `LibrarySheet.tsx:416` chỉ xếp cờ `recent` lên đầu; cờ này kho built-in **không bao giờ set** (`shelves.ts:194` tự khai "recent bỏ") — không có logic tuần nào |
| 1c | PPTX "luôn khổ 16:9" | **SỬA** → "đúng khổ đã chọn" | `Toolbar.tsx:609`; code thật đọc `deck.stagePreset` (`lib/present-editor/export.ts:15-19`, quyết định 16:9-cứng HUỶ 07/08 p12 — ghi ngay trong docblock export.ts) |
| 1d | Toast BulkIngest "Đã đưa N tệp vào kho — chờ chủ studio duyệt" | **SỬA** → "N tệp chưa nhập được — loại này chưa có đường nhập" | `BulkIngestMode.tsx:167-170`: nhánh non-idfc KHÔNG lưu gì, KHÔNG có luồng duyệt (comment `:157-158` tự khai "hành vi mock cũ") |
| 2 | Lô lux — bản chép tay | **SỬA** — gọi `roomLuxEstimate()` | Engine thật là `lib/lighting/lux.ts` (KHÔNG phải `lib/cad/standards/lux.ts` như phiếu đoán — path đó không tồn tại; `vn-lighting.ts` tự khai "KHÔNG PHẢI lux calculator"). Bản chép ở `rules-3d.ts:149` là `Σlm×0.4/A` — **thiếu MF=0.8** so với engine (E=Φ·UF·MF/A, IESNA/CIE 97). `UF_UOC_LUONG` giữ export nhưng thành alias của `DEFAULT_UTILIZATION_FACTOR`; chuỗi `nguon` nay ghi cả UF lẫn MF + trỏ engine |
| 3-D2 | MAP #6 "2 production caller" | **SỬA** + dấu ⛔ĐÍNH CHÍNH 19/08 | Đo: 1 caller sống (`DesignDnaCardPanel.tsx:297` qua `distillDnaFromAssets`→`distill()`, mount `app/projects/[id]/overview/page.tsx:308`); `CuaSoThaoLuan.tsx:182` có code nhưng grep mount = **0** (D1) |
| 3-D4 | MAP #8 camera [CHƯA CẮM] | **SỬA** → [ĐANG CÓ] (một phần) + dấu 19/08 | `CamPathPanel` (bọc `CamPathPreview`) mount thật tại `CadEditor.tsx:866` (import `:91`, state `:201-203`) |
| 3-D3 | FfeApproval | **SỬA tại MAP #17** (⚠️ phiếu ghi "Blueprint #17" — **sai file**: grep `FfeApproval` trong `IF-ARCHITECTURE-BLUEPRINT.md` = 0 hit; câu drift sống ở `INTERIORFLOW-ARCHITECTURE-MAP.md:200` hàng #17) | Đo: `FfeApproval` = TS type `lib/ffe/sheet.ts:52`, không persist; import duy nhất của `lib/ffe/sheet` là `MaterialImportWizard.tsx:23` và KHÔNG đụng approvals |
| 4 | Comment stale resolve.ts "0 caller" | **SKIP — đã đúng sẵn** | Docblock `lib/materials/resolve.ts` đã viết lại 19/08 (IDENTITY BƯỚC 2A), nêu rõ callsite thật `MaterialsScreen.tsx` + `ngan-tho.ts`; grep "0 caller/0 nơi gọi/chưa cắm" trong file = 0 hit |
| ⛔ | Lô comment StageSwitcher (7 file) | **SKIP theo phiếu** — chờ R2/H2 | — |

## 3 · Tổng kết
Bốn nhãn đều còn nguyên bệnh lúc đo (không cái nào tự lành sau audit) — đã về 0 theo Gate §4.
Lux nay MỘT nguồn công thức; hệ quả có chủ đích: kết quả ước lượng **giảm ×0.8** (thêm MF) ⇒
nhiều phòng biên sẽ bị báo "thiếu rọi" hơn — đây là sửa đúng, không phải regress (bản chép thiếu
hệ số duy trì). 3 DRIFT sổ đóng dấu tại chỗ, không viết lại file.

## 4 · Đánh giá khách quan
- Tốt: mọi mục đo tại nguồn trước khi sửa; test margin lux kiểm trước (17.8↔100 · 177.8↔100, không lật).
- Chưa: (i) nhãn mới chưa nhìn bằng mắt trên app (BROWSER-PENDING theo phiếu); (ii) MAP #22 vẫn
  liệt `FfeApproval` trong "5 signal đã sống" — cùng bệnh D3 nhưng NGOÀI danh sách phiếu, KHÔNG sửa,
  ghi lại đây; (iii) MAP #4 "Cửa Sổ Thảo Luận đã ship" = DRIFT D1, ngoài phạm vi, còn nguyên.

## 5 · Hướng xử lý khác đã cân nhắc
- Nhãn 1a/1b: hướng "sửa code cho nhãn thành thật" bị loại — cần lịch sử dùng/logic ngữ cảnh DNA
  (>1-2 dòng, ngoài scope); sửa chữ là đường rẻ đúng phiếu.
- Lux: hướng "chỉ thêm MF vào bản chép" bị loại — vẫn là hai công thức, trái mục tiêu một-nguồn.

## 6 · Đề xuất
Mở phiếu nhỏ sau R2: quét nốt D1 + MAP #22 (FfeApproval trong danh sách signal) cùng lô comment
StageSwitcher — cùng họ drift, một lượt là sạch.

## ⑦b · Chưa chắc / chưa kiểm
- Chưa chạy browser — nhãn mới chưa thấy trên màn (khớp NGHIỆM THU phiếu: BROWSER-PENDING).
- `luatDoRoi` đổi số ×0.8: chưa có snapshot nào ngoài test [4] canh biên; ca thật gần ngưỡng
  (vd 110→88 lux quanh minLux 100) sẽ đổi verdict — đúng chủ đích nhưng chưa kiểm trên doc thật.
- `soi:tu-dien`/`soi:frontier` chưa chạy lại sau sửa (worker không được lệnh; text-only ít rủi ro).

## ⑦c · Hạn dùng kết luận
Số đo caller/mount đúng tại HEAD `c7f3a8`+working tree 19/08; CuaSoThaoLuan được mount hoặc
FfeApproval được persist thì hàng #6/#17 MAP phải đo lại — dấu ⛔ĐÍNH CHÍNH đã ghi ngày để đối chiếu.
