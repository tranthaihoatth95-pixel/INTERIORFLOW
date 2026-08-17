# PHIẾU COLLAB-NC — nghiên cứu + mock cho Workspace Collab chặng 3D

> Giao: T · 17/08. Đây là phiếu **NGHIÊN CỨU + MOCK**, KHÔNG THI CÔNG CODE.
> Ra: **1 báo cáo NC** + **1 mock HTML** để Hoà duyệt mắt trước khi mở phiếu thi công.
> ⛔ Vùng ghi: `docs/nc/NC-COLLAB-CHANG-3D.md` (tạo) · `docs/mocks/mock-collab-chang-3d.html` (tạo) · báo cáo.
> ⛔ **KHÔNG đụng** `lib/**` · `components/**` · `app/**` · `scripts/**` · `package.json`.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` + `git rev-list --count HEAD..main`. Lệch > 0 → DỪNG.

## ⓪ TIỀN ĐỀ — có quyền BÁC, hãy soi kỹ
> **TIỀN ĐỀ:** *"Nhiều mảnh của workspace collab chặng 3D **đã tồn tại**, đang rời rạc, và nối chúng
> là VIỆC CHÍNH — không phải dựng mới. Cụ thể: `FlowCanvas` + `NoteNode` + `CommentPin` là canvas
> Miro-like đã sống; `ConceptForm.tsx` là form khung tư duy đầu tiên (Concept moodboard); `MoodboardModal`
> đã có; `lib/dna/distiller.ts` chưng cất → Thẻ DNA; `DesignDnaCardPanel` hiện Thẻ DNA. Việc còn thiếu
> là **cửa vào Collab thành mode/tầng riêng** + **thư viện form khung tư duy** + **cổng chưng cất**."*

→ XÁC NHẬN / BÁC + file:dòng. **Bác thì DỪNG** — có thể T đọc sổ sai một lần nữa.

## ① BỐI CẢNH — ba chốt cùng chỉ về đây, chưa cái nào thành trang thật

| Chốt | Nói gì | Đo hôm nay |
|---|---|---|
| **02/08** `SPEC-CHANG2-UI-2MODE` | *"Render+Mood+Collab = canvas Miro-like, sticky/comment/frame-theo-phòng, mindmap là một tuỳ chọn"* | Node mode có canvas + sticky. Không có Frame gom nhóm. Không có "theo phòng". |
| **13/08** brainstorm/collab | *"form mẫu lập luận có sẵn + pick từ gallery + note → moodboard/storyline = Thẻ DNA dự án"* | Có Concept form (1 loại). Có Gallery. Có Thẻ DNA panel. Đường nối 3 thứ **chưa có**. |
| **16/08** cửa sổ THẢO LUẬN | *"đầu ra là một QUYẾT ĐỊNH, không phải tệp; có thể KHÔNG có cổng ra"* | Cửa sổ công cụ hôm 16/08 dựng là cửa sổ SẢN XUẤT. Cửa sổ THẢO LUẬN chưa có. |

## ② ĐỌC TRƯỚC — bắt buộc
| File | Vì sao |
|---|---|
| `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md` | luật ranh giới 4 bề mặt (khỏi phá sidebar) |
| `docs/IF-KIEN-TRUC.md` §2 §5 §7 | canvas là sơ đồ · cửa sổ là xưởng · dòng chảy VẬT · ba nấc |
| `docs/00-CHOT.md` — mục 02/08, 13/08, 16/08 về collab/moodboard/cửa sổ thảo luận | ba chốt gộp lại trong bối cảnh |
| `components/render-studio/*` (toàn bộ 7 tệp) | vỏ chặng 3D thật, đặt Collab vào chỗ nào |
| `components/FlowCanvas.tsx` · `nodes/NoteNode.tsx` · `nodes/CommentPin.tsx` | mặt bàn Miro-like sẵn có |
| `components/form/ConceptForm.tsx` | khuôn form đầu tiên — mở rộng thành **thư viện form khung tư duy** kiểu nào |
| `components/MoodboardModal.tsx` | modal có sẵn — dùng lại vs. nội tuyến trong canvas? |
| `components/dna/DesignDnaCardPanel.tsx` + `lib/dna/distiller.ts` + `types.ts` | ĐÍCH ĐẾN: Thẻ DNA là *quyết định đã chốt* của phiên Collab |
| `docs/nc/DO-ENGINE-7-MANH-2026-08-17.md` §TRỤ ② | `lib/distill/engine.ts` (60 dòng, **CHỈ NỘI BỘ**) — cỗ máy chưng cất chung, chưa lên tới mặt. Đây có thể là chỗ nối. |

## ③ VIỆC — chia hai
### VIỆC 1 · NGHIÊN CỨU (`docs/nc/NC-COLLAB-CHANG-3D.md`)
Trả lời **năm câu**, mỗi câu có bằng chứng file:dòng:

1. **Collab đứng đâu trong chặng 3D?** `ModeSwitchBar` hiện là Node ↔ Vẽ 3D. Ba khả năng:
   - (a) Mode thứ ba `Collab` → 3 mode ~ không khớp câu 13/08 *"Node ↔ 3D"*
   - (b) **TẦNG** trên mode Node — như một cụm cửa sổ thảo luận nổi trên FlowCanvas
   - (c) Cửa sổ toàn màn mở từ nút riêng trên rail
   → **Đề xuất một, nói vì sao hai cái kia không.**
2. **Form khung tư duy — thư viện có mấy khuôn ban đầu?** Không đề xuất list mở. Chọn ít, cụ thể, khai vì sao mỗi cái đáng có. `ConceptForm` là gốc — mở rộng bằng cách nào không phá?
3. **Cổng ra thành Thẻ DNA — dây thật đi thế nào?** `distiller.ts` nhận gì? `DesignDnaCardPanel` đọc từ đâu? Vẽ luồng: sticky/note/moodboard trên canvas → `distill/engine` → `dna/distiller` → Panel. Chỗ **thiếu dây** khai đỏ.
4. **Có phá luật *cửa sổ thảo luận không cần cổng ra* không?** Nếu ép mọi phiên phải sinh Thẻ DNA thì là cửa sổ sản xuất, không phải thảo luận. Đề xuất cách để cả hai chế độ sống chung.
5. **Danh sách "kho chưa mở" của `soi:cam-dien` liên quan** — 4 entry `chuan-net-3d` · `wireframe-dinh-bien-dien` · `part-lock-cau-kien` · `mirror-doi-xung-chuan-net`: có liên quan tới màn này không? Nếu không, khai rõ.

### VIỆC 2 · MOCK (`docs/mocks/mock-collab-chang-3d.html`)
Dòng đầu `<!-- @dsCard group="Chặng 3D — Collab" -->`.
Yêu cầu:
- **Hai theme** (sáng + tối), token thật từ `app/globals.css`, **0 hex gõ tay**.
- Vẽ **kịch bản người dùng cụ thể** — không mock rỗng. Vd: KTS mở dự án mới → bấm "Bắt đầu Concept" → chọn form "Câu hỏi 5W1H" → điền → kéo 3 ảnh từ Gallery → note sticky → **thấy Thẻ DNA dần thành hình** ở panel phải.
- Ba ca: (a) canvas trống có template gợi ý · (b) đang làm việc, sticky + gallery + form + Thẻ DNA dở · (c) chốt xong, panel Thẻ DNA hiện phiên bản đã lưu.
- Sáu ràng buộc `HOP-DONG-CAU-TRUC-DIEU-HUONG.md §6` (kể cả cấm đụng `--accent*`).
- Tự chấm `design:design-critique` + `design:accessibility-review` **trước** khi nộp.

## ④ RÀNG BUỘC
- **KHÔNG git ghi** · **KHÔNG dev server** · KHÔNG dùng AI trong mock.
- Chữ theo từ điển máy — `soi:tu-dien` không thêm lệch.
- Mã điều khoản: **mở `docs/TRIET-LY-IF.md` đọc số**, cấm chép.
- **Không hứa thứ chưa đo**. Đây là NC + Mock, KHÔNG viết dòng code lib/components nào.

## ⑤ ĐÍCH — trần 5 vòng
- `docs/nc/NC-COLLAB-CHANG-3D.md` trả đủ 5 câu, mỗi câu ≥1 bằng chứng file:dòng
- Mock render trên trình duyệt (không có dev server thì `file://` — nếu không mở được thì khai thẳng)
- Bản vẽ chấm sạch mức chặn
- **KHÔNG có dòng code nào ngoài mock** — kiểm bằng `git status`

## ⑥ BÁO CÁO
`docs/bao-cao-phien/2026-08-17-COLLAB-NC-MOCK.md` — khuôn 6 phần + ⑦b CHƯA CHẮC + ⑦c hạn dùng.

## ⑦b CHƯA CHẮC
Đặc biệt: kịch bản mock chưa chạy với KTS thật · thư viện form là **đề xuất T viết, không phải luật đã có** · có thể có mảnh code tôi (T) chưa grep ra.

## ⑦c HẠN DÙNG KẾT LUẬN
Ghi *"kết luận này hết đúng khi …"* — gợi ý: **khi Hoà chọn hướng (a)/(b)/(c) ở câu 1**, cả mock có thể lật.

## ⑧ DÂY MÁY
Entry registry: T tự mở sau audit. **Agent KHÔNG sửa registry.**
