# 08 · T xử bản tư vấn "vai tư vấn tổ chức & vận hành" (Hoà giao quyền chốt)

> Nguồn: `TU-VAN-PROMPT-VAI-TU-VAN-VAN-HANH.md` (cowork-nghiên cứu, outputs ngoài repo).
> Hoà: *"này thuộc phạm vi chốt của bạn"* ⇒ T quyết + thi hành, không hỏi lại.
> Chốt đầy đủ: `docs/00-CHOT.md` mục "Xử bản tư vấn vai vận hành 15/08".

## Phán: NHẬN 4 · BÁC 2 · SỬA HƯỚNG 1

**Nhận (đã thi hành ngay trong phiên):**
1. **3 ô vá khuôn phiếu** → `HOP-DONG-PHOI-HOP-T` §3 nay là **⓪ + 8 ô**: ⓪ TIỀN ĐỀ (agent phải
   xác nhận/bác bỏ giả định của phiếu trước khi làm; bác thì DỪNG) · ⑦b CHƯA CHẮC/CHƯA KIỂM
   (trống cũng phải ghi) · ⑦c HẠN DÙNG KẾT LUẬN. Kèm T tự ràng buộc: phiếu nào T không nêu nổi
   tiền đề = phiếu chưa nghĩ xong, không được phóng.
2. **Gộp CLAUDE↔AGENTS** → `AGENTS.md` là **symlink** vào `CLAUDE.md`. Hai bản đã phân kỳ thật
   (bản AGENTS ghi sai `.Codex/launch.json` + 3 dòng phụ lục cụt). Banner cấm dựng bản sao thứ hai.
3. **Trần kích thước kho** → entry `tran-kich-thuoc-kho` (đo thật: docs/ **674 file · 32MB**).
4. **claimKeys** (chống va chạm phạm vi agent song song) → entry `claim-keys-va-cham`.

**Bác:**
- ⛔ **SIM-LEDGER** — sổ của SPIRAL đã chết; bản sống ta có rồi (frontier-registry +
  `bao-cao-phien/` + `soi:contract` + V). Làm nó = đúng tội N8 mà chính bản tư vấn cảnh báo.
- ⛔ **Đẻ agent thứ 6** — trùng vai **V**, vốn vừa chạy thật lần đầu 15/08 (nhánh 04). Cần gì
  thì nạp vào V. SPIRAL mục 5 đã trả giá một lần cho đúng bài này (KIẾN đụng KIÊN).

## Gốc bệnh đã vá — quan trọng hơn cả 7 kẽ hở nó nêu
Bản tư vấn audit `QUY_TRINH_SPIRAL_v1.md` **như thể đang chạy**. Đo: SPIRAL là bản 28/07, commit
cuối `8e096a8` 29/07; bài tư vấn nhắc HOP-DONG-T/TRIET-LY/frontier/soi/V **0 lần**, và ngược lại
STATUS/00-CHOT/HOP-DONG/TRIET-LY nhắc SPIRAL **0 lần** — hai hệ không biết nhau tồn tại.
⇒ Đã **đóng dấu ⛔LỖI THỜI lên đầu SPIRAL** + bảng ánh xạ 4 cơ chế cũ→mới (SIM LEDGER→registry ·
G7→T+V · G8A→§9 · hạm đội NHÃ/KIẾN/VŨ/TRỤ→T+sub-agent+V).
**Luật rút ra: văn bản quy trình bị thay PHẢI đóng dấu tại chỗ, không im lặng bỏ hoang.**

## Máy bắt T ngay trong lượt chốt — ghi lại vì đây là bài học, không phải sự cố
Bản tư vấn khai 3 ý "thật sự mới, không có gì tương đương". T nhận cả 3 và mở entry. Chạy
`soi:frontier` → **🔴 1 lệch**: `effectiveFrom`/`supersededBy` **ĐÃ SỐNG ĐẦY ĐỦ** ở
`lib/cad/standards/registry.ts:87-95` + hàm lọc theo ngày mốc `:222-245` + test riêng
`rule-effective-date.test.ts`.
⇒ Bản tư vấn sai, **và T nhận mà chưa grep cũng sai** — cùng một cơ chế "nhận định trước khi đọc
nguồn gốc" mà bài tư vấn tự thú ở §0. Máy bắt được cả hai. Entry đã thu phạm vi: ý ② không phải
xây mới mà là **nhân rộng cơ chế sẵn có** từ luật-ngành sang bản ghi tri thức/quy trình.
Còn lại ý ① một-cửa-ghi vẫn mới thật (grep 0) → entry `kho-mot-cua-han-dung`.

## Một chỗ bản tư vấn BỊA, ghi để nhớ
Nó viết *"luật `verified` cần ≥2 nguồn độc lập trong registry.ts"*. Mở
`lib/cad/standards/registry.ts:9` — luật thật là verified=true khi tra được từ **một** nguồn
kiểm chứng được. Mối lo của nó (một-nguồn-LƯU ≠ ngừng-đối-chiếu) vẫn đúng và đáng nhận, nhưng
bằng chứng thì tô thêm. **Phê bình đúng vẫn phải trích đúng dòng.**

## Số kết
`soi:frontier` 0 lệch · `soi:tu-dien` 0 · ship map 104 task (👁1 ✓64 ○39).
Registry +3 entry đợt 9. Không đụng code app trong lượt này (thuần luật + sổ).
