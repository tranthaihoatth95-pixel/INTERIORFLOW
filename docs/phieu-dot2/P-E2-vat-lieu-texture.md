# PHIẾU E2 · VẬT LIỆU — ẢNH VÂN (texture) còn thiếu

Vùng sở hữu: `lib/materials/` · `components/materials/`. Chạm `lib/three/` **chỉ ở chỗ đọc map** (phối hợp trước nếu phiếu 3D đang mở).
Luật: V6 KHÔNG commit · §0u ghi `docs/M-VAT-LIEU-2-OUT.md` · **luật 2.1.9.i** (MaterialDef = thị giác · ProductSpec = thương mại, **cố ý không trộn**) · N8.

## GỐC (đo 07/08)
```
lib/materials/schema.ts:24    baseColor?: SrgbHex        ← MỘT MÃ MÀU, không phải ảnh
lib/materials/schema.ts:34-39 normalUrl · heightUrl · aoUrl   ← chỉ 3 map
components/materials/MaterialPbrEditor.tsx:184-186   chỉ 3 nút nạp ảnh
```
Hệ quả nhìn thấy: vật liệu "Đá travertine ong vàng · SW-TRV-BE" render ra quả cầu **màu trơn, không vân**. Mọi vật liệu thật — gỗ, đá, vải, gạch — đều cần ảnh màu.

## VIỆC 1 — thêm 3 map + tỷ lệ lặp (G-M17-03, `GAP-IF.md:144`)
Thêm vào `MaterialPbr`:
- `baseColorMapUrl?: string` — **nạp sRGB** (khác `normalUrl`/`heightUrl`/`aoUrl` nạp linear). Ghi rõ trong comment, sai chỗ này là màu bị nhạt/đậm toàn cục.
- `roughnessMapUrl?: string` (linear)
- `metallicMapUrl?: string` (linear)
- `uvScaleMm?: { w: number; h: number }` — **bước lặp vân tính bằng mm**. Không có nó thì vân co giãn sai tỷ lệ trên mặt lớn (viên gạch 600mm hiện thành 3m).

Giữ đúng chuẩn **glTF metal/rough** như file đã chốt (`schema.ts:1-14`) — D5 và Enscape khớp thẳng, V-Ray đi qua lớp dịch `export-vray.ts`.

## VIỆC 2 — nút nạp ảnh trên UI
`MaterialPbrEditor.tsx:184-186` thêm 3 nút cùng khuôn `mapBtn()` đang có. Quả cầu xem trước phải **hiện vân thật** sau khi nạp — đó là verify (N6).

## VIỆC 3 — nối xuống 3D
Tìm nơi `lib/three/` dựng vật liệu, đọc thêm 3 map mới + `uvScaleMm`. Nếu vùng đó đang có phiên khác mở ⇒ **dừng, báo, đừng đụng** — ghi vào M-OUT để TỔNG điều phối.

## VIỆC 4 — nếu còn thời lượng
`G-M17-01` (120) — vật liệu **chẻ ba** (`MaterialPbr` / `MaterialDef` / `ProductSpec`), không mảnh nào biết mảnh nào. **KHÔNG gộp** (trái luật 2.1.9.i) — thêm **khoá nối** giữa chúng và ghi rõ mảnh nào là nguồn của trường nào.

## CẤM
- **KHÔNG** nhồi giá / nhà cung cấp / hao hụt vào `MaterialPbr`.
- Không tự chạy dev server mới (§0aa).

## VERIFY
Nạp một ảnh vân thật (gỗ hoặc đá), chụp quả cầu xem trước **trước và sau**. Chụp cả khối trong 3D nếu VIỆC 3 làm được.

## HÀNG ĐỢI (§V7) — bắt buộc cuối lượt
