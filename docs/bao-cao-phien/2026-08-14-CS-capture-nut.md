# BÁO CÁO CS · 14/08 — capture-nut: nút "Xuất chuỗi ảnh (PNG)" nối kho chờ-dây `captureSequence`

**Phiếu:** `docs/phieu-giao/capture-nut.md` · **Vai:** CS (nhánh 3D/xuất, cấp Đ) ·
**Vùng file đã đụng:** `components/render-studio/CameraExportTab.tsx` (MỚI) + `components/render-studio/Command3DPanel.tsx` (wire tab) + `lib/three/capture.ts` (đúng 1 export additive, khai ở ③) + báo cáo này. KHÔNG git · KHÔNG server mới · KHÔNG dep · KHÔNG login browser (verify bằng tsc/test theo phiếu ⑤; nghiệm thu mắt để T).

## ① NÚT ĐẶT Ở ĐÂU — VÀ VÌ SAO

**Chỗ:** tab **Camera** của `Command3DPanel` (`components/render-studio/Command3DPanel.tsx:223` — dòng `{tab === 'camera' && <CameraExportTab scene={scene ?? null} />}`), ruột flow nằm trọn trong file mới `components/render-studio/CameraExportTab.tsx`.

**Vì sao đúng chỗ (phiếu ④.1 "tìm cụm nút thật, không chế toolbar mới"):**
- Tab Camera là cụm CÓ SẴN trong panel trái mode Vẽ 3D, và chú thích ngữ cảnh của chính nó đã hứa từ trước: *"Thiết lập khung hình, ống kính và đường đi TRƯỚC KHI XUẤT"* (`Command3DPanel.tsx:127`) — nay lời hứa có nút thật.
- Trước phiên, tab này là `PlaceholderTab` "Đặt camera · đường cam — sắp có" — thay câu chờ bằng năng lực thật đúng luật §9 (điền vào ô trống đã vẽ sẵn). Phần CHƯA có (đặt camera trong cảnh, ống kính — cần model camera trong Doc theo spec §6.2) vẫn giữ 1 khối chờ trung thực Ở TRONG tab, không xoá bằng chứng còn việc.
- Không có cụm "xuất/chụp" nào khác trong mode 3D để đứng cạnh (đã grep toàn `components/render-studio`: ToolDock3D/Tool3DBar không có nút xuất nào; xuất duy nhất là spec-sheet trong ToolModeForm — ngữ cảnh tool window khác hẳn).

## ② FLOW XUẤT

1. **Nguồn đường cam:** entity polyline cờ `campath:true` — ưu tiên đường ĐANG chọn, không thì đường vẽ gần nhất. CHÉP NGUYÊN logic `components/cad/CamPathPanel.tsx:92` (một cách chọn duy nhất toàn app, không đẻ cách thứ hai). `planCamPath(points)` mặc định 1200mm/s → duration.
2. **Số khung:** input, mặc định `round(duration × 15fps)` (fps 15 = cùng con số bench 3D-2), trần 600 khung (chống treo RAM — mỗi khung PNG 1080p base64 nằm trong zip trước khi generate; cảnh báo RAM có sẵn ở JSDoc `CaptureSequenceOptions`). Khổ khung cố định 1920×1080 (16:9 chuẩn video).
3. **Chạy:** `captureSequenceAsync` streaming `onFrame` → LightArc determinate `(i/n)×100` + chữ "Khung i/n" (tiến độ THẬT từng khung, [N1] tội ④) → nút **Huỷ** gọi `AbortController.abort()` nối thẳng `opts.signal` ([T5]). Huỷ = dừng ở khung kế, KHÔNG tải file, báo "dừng ở khung i/n".
4. **Tải về: gói `.zip` qua jszip** (import lười, dep sẵn có — tiền lệ `lib/ho-so-song/pack.ts`, `lib/boq/xlsx.ts`). **Lý do chọn zip thay vì N file rời:** trình duyệt chặn tải-nhiều-file tự động không user-gesture (>1 download liên tiếp) — 1 cú tải là đường RẺ và chắc nhất; PNG đã nén sẵn nên zip mức `STORE`, không tốn CPU nén lần 2.
5. **Tên file:** zip `<slug>-chuoi-anh.zip`, từng khung `<slug>-khung-001.png` — slug từ `flowName` qua `hoSoSongSlug()` (tái dùng, không viết slug thứ hai). 0 jargon. Chuỗi UI song ngữ `tr()` toàn bộ.
6. **Thiếu điều kiện → nút MỜ kèm lý do, không ẩn:** (a) chưa có khối trong cảnh → "dựng khối hoặc đùn từ bản vẽ trước"; (b) chưa có đường cam → "vẽ bằng công cụ Đường cam ở chặng Thiết kế 2D".

## ③ 1 EXPORT ADDITIVE VÀO `lib/three/capture.ts` — KHAI RÕ

`captureSequenceAsync()` (capture.ts:316-347) — CÙNG hợp đồng `captureSequence` (plan/onFrame/AbortSignal/CaptureSequenceResult), chỉ khác: `await setTimeout(0)` giữa 2 khung. **Bắt buộc** vì `captureSequence` là vòng `for` đồng bộ chặn main thread suốt dải khung → LightArc không vẽ được khung nào và click "Huỷ" không bao giờ chạy được (signal có mà không ai flip được — trái [T5]+[N1] tội ④). KHÔNG sửa `captureSequence` hiện có (bench `app/dev-bench-3d-2` cần bản sync thuần để số đo không lẫn chi phí setTimeout). Không đụng CamPath engine, không đụng route bench.

Dọn kèm trong Command3DPanel: `PlaceholderTab` (chỉ còn phục vụ camera) gỡ; `PLACEHOLDER_COPY` thu về `Record<'sua',…>` vì EditTab vẫn đọc câu "sua".

## ④ KIỂM (phiếu ④.4)

| Kiểm | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi trong vùng tôi đụng.** Còn 2 lỗi `lib/rna/rna.test.ts` (TS2339 'sheen') — vùng agent RNA đang làm SONG SONG, tôi không đụng theo lệnh T; khai để T đối chiếu phiên đó. |
| Test liên quan | `lib/three/capture.test.ts` 27 pass/0 fail · `lib/cad/campath.test.ts` 40 ok/0 fail |
| `npm run soi:contract` | entry `capture-sequence` chuyển từ 🟡 chờ-dây sang **🔴 SỔ QUÊN "1 caller: components/render-studio/CameraExportTab.tsx → FLIP cho-day→co-day"** — đúng tín hiệu mong đợi: máy ĐÃ THẤY DÂY, tôi KHÔNG sửa contract-registry (T flip sau audit theo phiếu ⑥⑧). Lưu ý kỹ thuật: pattern registry là import tĩnh, nên component import tĩnh `captureSequenceAsync` (an toàn: Command3DPanel vốn kéo three tĩnh qua MaterialSphere; capture.ts module-scope không đụng document) — jszip vẫn import lười. |
| `npm run soi:tu-dien` | ✅ 0 lệch |

## ⑤ GIỚI HẠN KHAI THẬT ([T0])

- Chỉ `kind:'png'` — depth/lineart theo dải khung chưa có (đúng giới hạn engine tự khai).
- Bắt buộc có đường cam vẽ ở chặng 2D; chưa có UI vẽ/sửa đường cam trong mode 3D (nút mờ chỉ đường về 2D).
- Khung chụp là scene xám trơn `buildOffscreenScene` (MeshBasicMaterial, không PBR/đèn) — đúng tầng ① 0-credit, KHÔNG phải render đẹp.
- Khổ 1920×1080 + fps kế hoạch 15 cố định (chưa có UI chọn — thêm khi có nhu cầu thật, tránh bịa ô nhập vô chủ).
- Huỷ không cứu phần đã chụp (không tải zip dở) — chọn đơn giản trung thực; nếu Hoà muốn "tải phần đã có" thì mở việc riêng.
- Zip giữ toàn bộ khung trong RAM tới lúc generate → trần 600 khung; xuất dài hơi cần đường ghi-ra-đĩa (Electron) — ngoài phạm vi phiếu.
- Chưa verify mắt trên browser (phiếu ⑤ cấm login; dev server có sẵn nhưng mode 3D nằm sau đăng nhập) — T nghiệm thu mắt: mở mode Vẽ 3D → tab Camera, cần 1 doc có khối + 1 đường cam.
