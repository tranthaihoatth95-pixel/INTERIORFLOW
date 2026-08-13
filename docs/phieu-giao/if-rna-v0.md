# PHIẾU GIAO · if-rna-v0 — P6 IF-RNA v0: Hệ Thuộc Tính Tự Mô Tả, proof trên MaterialPbr

## THẺ VAI [Đ4]
- **VAI:** RN — agent nhánh IF-RNA (DocCore, chuỗi nền P6), proof cơ chế UI-tự-sinh-từ-định-nghĩa trên ĐÚNG MỘT loại đối tượng: MaterialPbr.
- **PHẠM VI/TRẦN:** cấp F. Vùng: `lib/rna/` (MỚI) · `lib/materials/schema.ts` (CHỈ THÊM metadata cạnh type, không đổi shape dữ liệu) · `components/materials/MaterialPbrEditor.tsx` (rewire dùng panel tự sinh) · báo cáo.
- **BIÊN → DỪNG:** ⛔ KHÔNG RNA-hoá gì ngoài MaterialPbr (BuildOp/.idfc là bậc sau, cấm đụng) · KHÔNG đổi shape `MaterialPbr` hay giá trị lưu (metadata là lớp BÊN CẠNH, file .idf/.idfc cũ đọc y nguyên) · KHÔNG đổi hành vi editor (cùng trường, cùng đơn vị, cùng lan truyền) · thấy nhu cầu metadata mà schema không tả được → ghi đề xuất, đừng nới type vội.
- **ĐIỀU KHOẢN RUỘT:** [T2] một định nghĩa nhiều mặt tiền — panel là mặt tiền SINH từ định nghĩa · [T6] đo được: SỐ DÒNG UI trước/sau + chứng minh sửa-1-chỗ-lan-mọi-nơi bằng ví dụ thật · [T0] cái gì panel cũ làm mà bản tự sinh chưa làm được thì GIỮ TAY + khai thật · [N2] đơn giản ngoài sâu trong.

## ① BỐI CẢNH
Bệnh "UI-lõi không gọi nhau": mỗi panel code tay từng ô nhập → thêm 1 thuộc tính là sửa N chỗ, nhãn/đơn vị/min-max trôi lệch nhau. Thuốc đặc trị đã chọn (BAN-THIET-KE §3, học Blender RNA/DNA): data tự mô tả bằng metadata → UI TỰ SINH. v0 = proof trên MaterialPbr (14 thuộc tính chuẩn glTF, panel tay hiện có 332 dòng) — thành công đo được mới nhân rộng.

## ② ĐỌC TRƯỚC
`docs/BAN-THIET-KE-HE-THONG-IF-2026-08-13.md` §3-§4 · `lib/materials/schema.ts` (14 thuộc tính — nguồn sự thật shape) · `components/materials/MaterialPbrEditor.tsx` (332 dòng — hành vi phải giữ nguyên: từng trường, đơn vị, bước, callback, kể cả nút xuất V-Ray/D5 dòng ~133) · `docs/SPEC-VAT-LIEU-PBR-IF.md` (chốt 03/08: template ~8 trường kiểu D5, không 40 trường V-Ray) · `lib/i18n` cách tr() · 1-2 inspector row sẵn có để tái dùng khuôn ô nhập (grep trong components/materials + components/studio/InspectorPages).

## ③ VÙNG FILE
`lib/rna/{types.ts, material-pbr.rna.ts, rna.test.ts}` (MỚI — marker `IfRna`) · `lib/materials/schema.ts` (chỉ export thêm) · `components/materials/{MaterialPbrEditor.tsx, RnaPanel.tsx}` · `docs/bao-cao-phien/2026-08-14-RN-if-rna-v0.md`.

## ④ VIỆC
1. `lib/rna/types.ts` — `IfRnaField`: { key, label: {vi,en}, kind: 'number'|'color'|'bool'|'enum'|'texture', unit?, min?, max?, step?, group: {vi,en}, moTa?: {vi,en}, anTheo?: string[] /* key khác cần re-render/lan truyền */ }. Generic theo T (typed key của T).
2. `lib/rna/material-pbr.rna.ts` — `MATERIAL_PBR_RNA: IfRnaField<MaterialPbr>[]` đủ 14 thuộc tính, label/đơn vị/min-max chép ĐÚNG từ panel tay hiện có (đó là hành vi chuẩn — không sáng tác); nhóm theo cụm panel cũ đang nhóm.
3. `components/materials/RnaPanel.tsx` — component generic: nhận defs + value + onChange, render đúng khuôn ô nhập hiện dùng (slider/number/color/toggle theo kind), collapse theo group [Đ6], reduce-motion thắng. KHÔNG chế visual mới — tái dùng class/khuôn của editor cũ.
4. Rewire `MaterialPbrEditor.tsx`: phần 14 trường thay bằng `<RnaPanel defs={MATERIAL_PBR_RNA} …>`; phần KHÔNG phải field-editing (header, quả cầu preview, nút xuất V-Ray/D5, template) GIỮ NGUYÊN. Đếm dòng trước/sau ghi báo cáo.
5. Test `lib/rna/rna.test.ts`: đủ 14 key khớp keyof MaterialPbr (không thừa thiếu — máy canh drift) · min≤max · label đủ vi/en · round-trip một value qua defs không mất trường.
6. **Chứng minh lan-1-chỗ**: đổi thử 1 label/miền trong material-pbr.rna.ts → panel đổi theo (ghi lại bằng chứng trong báo cáo; sửa lại về đúng sau khi chụp).

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG server mới (server 3000 đang chạy — được dùng browser pane XEM panel, ⛔ không login/nhập mật khẩu; panel vật liệu cần login thì verify bằng test + tsc và khai thật) · KHÔNG dep · chuỗi UI qua tr() · tu-dien 0 lệch mới.

## ⑥ NGHIỆM THU TỰ LÀM
tsc 0 · test mới pass + test materials cũ 0 vỡ · số dòng MaterialPbrEditor trước/sau · soi:contract không vỡ (engine matId caller giữ nguyên).

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-14-RN-if-rna-v0.md` — khuôn chuẩn + bảng đo (dòng UI trước/sau · ví dụ lan-1-chỗ) + những gì panel tay còn giữ lại và vì sao + đề xuất điều kiện nhân rộng sang BuildOp (chỉ đề xuất, không làm).

## ⑧ DÂY MÁY
Entry `if-rna-v0` (đợt 7, DocCore, ⭐MVP) — bangChung `IfRna|if-rna` trong lib. T flip sau audit.
