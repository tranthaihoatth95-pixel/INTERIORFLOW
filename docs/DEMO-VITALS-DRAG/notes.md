# Vitals drag UX + NotebookLM đa lĩnh vực auto-smart · Demo notes

Worktree: `interiorflow-wt-vitals-drag-nb-general`
Branch:   `feat/vitals-drag-nb-general`
Dev URL:  `http://127.0.0.1:3011/cad-editor`
Ngày verify: 24/07/2026

## State machine kéo giọt Vitals

| # | Cử chỉ                                | Kết quả                                                                 |
|---|---------------------------------------|-------------------------------------------------------------------------|
| 1 | Nghỉ (chưa kéo)                       | Handle line 24×1px opacity 0.4 dưới thanh chặng, tooltip "↓ Kéo xuống để hỏi Vitals" hiện lần đầu 4s |
| 2 | Kéo xuống >= 28px (< 120px)           | Popover Vitals compact bung ra: header "VITALS · DRAFTING CAD" + nút Maximize (Mở rộng) + nút X. Chat bubble input. |
| 3 | Kéo xuống >= 120px HOẶC bấm Maximize | Popover đóng, router push `/projects/<slug>/notebook` — NotebookLM full 3 cột (Nguồn · Chat · Xem)  |

## Bằng chứng verify (24/07)

### State 1 · resting
- URL: `http://127.0.0.1:3011/cad-editor`
- read_page interactive tree: KHÔNG có "Sổ tay dự án · Project Notebook" button (đã xoá NotebookButton khỏi Header — Vitals là entry point AI duy nhất).
- Header quan sát: `Home` · `Chat nhóm` · `Giao diện: tự động` (3 nút cạnh nhau, KHÔNG có Notebook).

### State 2 · popover compact
- Kịch bản JS mô phỏng `pointerdown`+`pointermove` (dy=5..35)+`pointerup`.
- JS assert:
  ```json
  { "panelPresent": true, "panelAriaHidden": "false",
    "expandBtnPresent": true, "expandLabel": "Mở NotebookLM đầy đủ · Full" }
  ```
- Screenshot Browser pane (tool output): thanh header popover "VITALS · DRAFTING CAD" + icon Maximize2 (11px) + X.

### State 3 · full modal NotebookLM
- Kịch bản JS: đóng popover → mô phỏng long drag (dy=10..150) → tracker verdict = `notebook-full` → `router.push`.
- `location.pathname` sau navigate = `/projects/untitled-flow/notebook`.
- Screenshot Browser pane: layout 3 cột Nguồn · Chat · Xem, header "Notebook · Sổ tay dự án", 4 câu gợi ý song ngữ, badge "Mock mode" (do wt DB rỗng, không có project).

## NotebookLM đa lĩnh vực auto-smart (mode C)

Sửa `lib/notebook/rag.ts`:

- Trả thêm field `mode: 'grounded' | 'general'` trong `RagResult`.
- `mode = 'grounded'` khi retrieve ra ít nhất 1 chunk khớp → giữ hành vi cũ (system prompt + RAG context block + luật trích [n]).
- `mode = 'general'` khi notebook chưa có nguồn HOẶC retrieve rỗng → system prompt "CHẾ ĐỘ CHUNG · KHÔNG CÓ NGUỒN" (bỏ ràng buộc trích, cho phép đa lĩnh vực), answer prefix `[General mode · không có nguồn]\n\n`.
- Không đụng contract API (`app/api/notebook/[projectId]/query`) — chỉ thêm field, cũ vẫn hoạt động.

UI:
- `useNotebook.ts` đọc `mode` từ response, gán vào ChatMessage.
- `NotebookChatPanel.tsx` hiển thị badge nhỏ "General mode · không có nguồn" dưới answer khi `m.mode === 'general'`.

## Test

- `npx tsc --noEmit` → PASS (sạch).
- `node_modules/.bin/sucrase-node lib/input/stage-drop.test.ts` → **23 pass, 0 fail** (bổ sung 6 case: long-drag → notebook-full, kéo thẳng qua ngưỡng full, giữ nguyên full sau khi bắn).
- `npx vitest run` → repo không dùng vitest (đã confirm với STATUS.md `sucrase-node` là runner canonical, vitest báo "No test suite found" cho toàn bộ 75 file test là expected).
