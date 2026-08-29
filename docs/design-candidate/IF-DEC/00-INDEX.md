# IF · SỔ QUYẾT ĐỊNH THIẾT KẾ

> 🔴 **TÊN CŨ GHI "nhập từ xưởng Design (28/08)" — nay KHÔNG CÒN ĐỦ.** Sổ này ban đầu chỉ chứa
> thẻ **nhập từ ngoài**, nên đầu đề mô tả nguồn gốc thay vì mô tả vai. Từ 29/08 nó chứa cả thẻ
> **sinh trong repo**. Đầu đề mô tả nguồn nhập khiến thẻ sinh tại chỗ không có đường vào — và
> đó chính là lý do `IF-DEC-CAI-DAT-BA-TRUC-001` nằm ngoài bảng suốt một ngày.

> **Đây là CANDIDATE, không phải chốt.** Không tệp nào trong thư mục này cho phép thi công.
> Cổng thi công nằm ở chính các tệp (`GATE-*`, `G1–G7`) và ở `docs/control/IF-ADVICE-VERIFICATION-GATE.md`.

## Vì sao nhập

Xưởng Design (`~/.codex/visualizations/2026/08/24/01a031aa-…`) đã sinh ra một loạt quyết định có
mã bền, có hash, có phản biện độc lập — nhưng **nằm ngoài Git**. Một quyết định không ai đi tới
được thì bằng không (luật M-24), và một thư mục ngoài repo thì phiên sau **không có đường tìm**.

Nhập **nguyên văn, không sửa một byte**. Băm dưới đây đo tại thời điểm nhập bằng
`shasum -a 256` trên chính tệp trong thư mục này.

## Bảng

| tệp | byte | sha256 (đo lúc nhập) | trạng thái |
|---|---|---|---|
| `IF-DEC-IDFC-3D-001.md` | 7997 | `0c58d2ba0afd12172a15b8f777a3f1be1b43fe43277514ce7e65dd58361d66b3` | **v0.1 · REVISE** — giữ làm provenance, **cấm sửa đè** |
| `IF-DEC-IDFC-3D-001-v0.2.md` | 16840 | `cc08d3c9ba2b375c45b24af2363a55fb4b9a1c46ac75d87dbf1e1bab15a4e644` | **ACCEPTED CANDIDATE · BUILD BLOCKED** (G1–G7) |
| `IF-DEC-DOCK-ANCHOR-001.md` | 11281 | `2b8ac0b5889287387141338aff8a2d915c5218e600bbd1b643f7b25322ac2ff1` | **PROVISIONAL** — xem `docs/control/IF-ADVICE-VERIFICATION-GATE.md` §10 |
| `IF-FINAL-DESIGN-CONTRACT-CANDIDATE.md` | 22052 | `501a5d8d3a7553cfbf006f0c3417cee4fee3735bb0bcf4e7465533fff2db90dc` | CANDIDATE · chờ Hoà duyệt mắt |
| `IF-TASK-FIRST-INTERACTION-CONTRACT-028.md` | 11044 | `42fdc92e6107718840ec3d6f07db987f53ea5caa1e307a3f8ac860fe52348430` | CANDIDATE |
| `IF-UX-COMPLETE-SPEC-010.md` | 75915 | `b53971ea678b1059799ebbcfa72c54028faa2e2b546b833931accb604bde5969` | CANDIDATE |
| `IF-DEC-CAI-DAT-BA-TRUC-001.md` | 5179 | `1e63eec23a1d946ee4d2809694986b272d3299e5aa7c7805a12bb79a9f058a6d` | **ĐÃ QUYẾT · chưa thi công** — sinh trong repo 29/08, không nhập từ ngoài |

## 🔴 BIÊN NHẬN CŨ ĐÃ SAI — ĐO ĐƯỢC 28/08

Phiếu P0-rescue của lane Production Control ghi hai tệp với byte/hash cụ thể. **Hai trong bốn số
đó nay không còn đúng** — tệp đã bị sửa sau khi phiếu được lập:

| tệp | phiếu ghi | đo được 28/08 |
|---|---|---|
| `IF-UX-COMPLETE-SPEC-010.md` | 75.644 byte · `feb85ac5…` | **75.915 byte · `b53971ea…`** |
| `IF-FINAL-DESIGN-CONTRACT-CANDIDATE.md` | 16.128 byte · `9d353dd4…` | **22.052 byte · `501a5d8d…`** |

Hai tệp `IF-DEC-IDFC-3D-001*` thì **khớp tuyệt đối**.

⇒ Bài học, và là lý do bảng trên ghi *"đo lúc nhập"* chứ không chép lại phiếu: **một biên nhận
không tự làm mới.** Nhập theo số được kể thay vì số đo được là ghi một lời nói dối có chữ ký.
Sổ phiên xưởng cho thấy nguyên nhân lành: lane Design đã **nối thêm** hợp đồng Dock và task-first
vào chính tệp đó (`+121 −0`, `+2 −0`). Không ai sai; chỉ là phiếu ra đời trước lần sửa.

## Quét trước khi nhập

`grep` khoá bí mật · khoá riêng · email · điện thoại · đường dẫn `/Users/…`: **0 kết quả thật.**
Một kết quả báo động giả `05052793376` — đó là một đoạn **nằm trong chuỗi sha256** ở
`IF-DEC-DOCK-ANCHOR-001.md:83`, không phải số điện thoại.
Tên khách/dự án thật (`detech` · `sungroup` · `amanoi` · `iki village` · `westlake`): **0**.

## Điều thư mục này KHÔNG chứa

40 tệp `.html` trực quan của xưởng **không** được nhập: chúng là ảnh minh hoạ, nặng, và
`IF-DEC-001` đã chốt *git giữ văn bản + manifest/hash, ảnh gốc ở nơi có quyền*. Cần xem thì mở
từ xưởng theo hash ghi trong từng contract.
