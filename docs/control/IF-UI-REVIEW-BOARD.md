# IF UI Review Board — cửa duyệt duy nhất

> **Mở bản nhìn:** [`docs/mocks/IF-UI-Review-Board.html`](../mocks/IF-UI-Review-Board.html)
>
> Tệp này là index cho agent. Hoà review trên bản HTML bằng ảnh, không review trong bảng chữ này.

- Updated: 2026-08-24
- Board ID: `IF-UI-REVIEW-BOARD-v1`
- Writer: Codex task `01a03199-06aa-7b62-ad4a-90b36b9b73b8`
- Scope: presentation/review only; production untouched

## Ba lane

| Lane | Nghĩa | Hoà review bằng gì |
|---|---|---|
| `B · Đã build` | Có trong app; chưa chắc đã qua mắt | ảnh/app thật `CURRENT` |
| `S · Đã spec` | Có target; chưa thi công hoặc chưa hội tụ | ảnh `TARGET`, trạng thái/revision |
| `N · Cần spec` | Chưa có target/thi công nhưng cần tối ưu IF | vấn đề con người + mức ưu tiên |

## Cụm review đầu tiên

1. `IF-UI-S03` — Login A/B/C.
2. `IF-UI-S05` — Home Living Canvas.
3. `IF-UI-B03` — Sidebar current ↔ target.
4. `IF-UI-B10` — 2D canvas/chrome.
5. `IF-UI-N04` — hành vi mất phiên thống nhất.

## Cách ghi verdict

`APPROVED` · `NEEDS CHANGE` · `REJECTED` · `NEEDS EVIDENCE` · `DEFERRED`.

Board HTML lưu nhận xét cục bộ trong trình duyệt và xuất một đoạn handoff có ID. Kết luận bền phải
được MAIN chép về Sổ duyệt mắt/current-state khi nhận bàn giao; localStorage của board không phải
canonical memory.
