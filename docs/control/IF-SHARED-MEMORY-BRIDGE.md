# IF · SHARED MEMORY BRIDGE

`Plane: IF` · phân luồng: `docs/control/BOS-PHAN-LUONG-TRI-NHO.md`


> **Namespace:** IF · **Authority:** adapter từ repo sang `00 · IDF CONTROL CENTER` trên Google Drive.

## Source of truth

- Repo IF giữ canonical/current-state/decision/tooling/failure knowledge của InteriorFlow.
- Drive giữ bản đọc chung trên điện thoại, raw memory events và inbox của Hoà.
- Bản `01-CURRENT-STATE/IF/**` trên Drive là **mirror**, không sửa tay.
- Ý kiến Drive chỉ có hiệu lực vận hành sau khi được xác minh và quay về đúng file repo/ADR.

## Xuất bản

Chạy:

```bash
node scripts/publish-idf-control-center.mjs
```

Máy xuất các nguồn IF cần đọc trên điện thoại, UI Review Board và `SYNC-RECEIPT.json`. Việc xuất dùng
ghi nguyên tử: tạo file tạm rồi đổi tên, tránh để Drive thấy nửa file.

## Luồng ngược

1. Hoà thêm ảnh/note vào `06-REVIEW/HOA-INBOX/` hoặc dùng Mobile Advisory tạo memory event.
2. Codex đọc event theo đúng topic, phân biệt nguyên văn với suy luận.
3. Nếu là quyết định: tạo/cập nhật ADR và canonical/current-state thích hợp.
4. Tạo event xác nhận `VERIFIED`/`DECIDED`; không sửa event gốc.
5. Xuất bản lại để điện thoại thấy version mới.

## Cầu Claude ↔ Codex — không dùng Hoà làm người chuyển tin

Cầu dùng lại `scripts/moc.mjs`; không có sổ quyết định hoặc canonical thứ hai. Sự kiện thô nằm ở
`~/PROJECT/SHARED/LOG/agent-handoffs.jsonl`, append-only và chỉ mang nội dung BUILDER. Repo vẫn thắng.

```bash
# giao việc / kết quả có provenance
node scripts/moc.mjs handoff cx:00 cl:05 "chủ đề" "một dòng đủ hành động" "docs/control/…#sha256"

# phiên lane 05 tự kéo phần chưa nhận khi bắt đầu
node scripts/moc.mjs inbox cl:05

# nhận xong thì thêm ACK; không sửa hoặc xoá sự kiện gốc
node scripts/moc.mjs ack cl:05 HO-… DONE "docs/control/…"
```

## Namespace migration

Địa chỉ canonical là `cx:NN` (Codex) và `cl:NN` (Claude). Mọi event mới ghi `system · lane ·
session_id · task_id/handoffId`; lệnh ghi từ chối `NN` trần. Event cũ không bị sửa: `inbox NN`
chỉ đọc đúng hàng cũ và gắn `LEGACY_AMBIGUOUS`, tuyệt đối không tự gán hệ. Migration view/pointer:
`node scripts/moc.mjs namespace-view`. Registry khóa theo `(system,lane)` nên `cx:06` và `cl:06`
cùng sống. Rollback code được; log v2 vẫn append-only và reader cũ chỉ coi trường mới là dư.

## Bưu tá local (CANDIDATE · default-off)

`scripts/buu-ta-cau.mjs` chỉ đọc sổ cầu, không quét repo. Khi `BOS_MOC_POSTMAN=1`, nó gọi connector
đã khai theo lane bằng `execFile` (không shell), truyền `handoffId` làm idempotency key, ghi
`WAKE_ATTEMPTED` (`WAKE` cũ vẫn được đọc như alias); chỉ ghi `SENT` khi connector trả receipt thật. Retry exponential có mốc
`DISPATCH_ATTEMPT` append-only nên restart không quên backoff. Không có connector/process callable
thì nó báo `OFFLINE` và để phiếu nguyên trong inbox; hook `moc im <cl:NN>` sẽ tự nạp ở lượt kế tiếp.
Nó không thể tự đánh thức một Claude/Codex session đang ngủ nếu host không cung cấp connector.

Connector map dùng khóa namespaced (`"cl:06"`). Chạy một lượt:
`BOS_SESSION_ID=<session-thật> BOS_MOC_POSTMAN=1 BOS_MOC_CONNECTORS_JSON='<json>' npm run moc:postman`.
Rollback: bỏ biến `BOS_MOC_POSTMAN` hoặc dừng process; không có daemon/system service để gỡ.

Mỗi phiên chạy `inbox <cx:NN|cl:NN>` **một lần khi bắt đầu**, không quét transcript. Khi có kết luận cần
lane khác xử lý, chạy `handoff`; người nhận tự ACK. Thiếu source/hash thì giữ nhãn `chat-unverified`,
không được nâng thành decision. Cấm ghi PII, CLIENT, TTT/private hoặc asset khách vào cầu này.

Giới hạn thật: cầu filesystem truyền được khi hai ứng dụng cùng máy và cùng đọc bootstrap. Nó không
tự đánh thức Claude Web. Muốn chạy khi ứng dụng đang đóng cần một Routine/Automation phía ứng dụng;
đó là cơ chế đánh thức, không phải một kho nhớ mới.

## Chống context bleed

- IF repo chỉ nạp tài liệu `IF-*` và bridge này.
- `IDF-*`/`AN-*` nằm ngoài repo IF; chỉ tra khi task thật sự liên-app.
- Một event luôn phải có namespace và topic. File thiếu hai trường này nằm ở inbox, chưa được nạp.
