# CHỐT — VITALS LM · MÔ HÌNH CHAT (AI riêng + @AI trong nhóm)

> Hoà 02/08 uỷ quyền ("tuỳ bạn, sao cho khác biệt·tiện·hợp IF/IDF") + chốt "**cho phép AI tham gia**".
> Nối `SPEC-VITALS-AI` (2 hệ chat đã tách) · `RESEARCH-CHAT-FULL`.

## Mô hình: CẢ HAI
| Kênh | Là gì | Khác ChatGPT chỗ nào |
|---|---|---|
| **AI riêng** | thread 1-người-với-AI (popover → NotebookLM full) | **grounded RAG tài liệu dự án, trả lời CÓ TRÍCH NGUỒN** (brief·spec·ảnh), context theo chặng (`ChatStage`) |
| **@AI trong NHÓM** | channel người-với-người, gọi `@AI` → AI trả lời NGAY TRONG channel, cả nhóm thấy | **multiplayer** — ChatGPT riêng tư 1 người, IF cho cả studio hỏi chung một AI đang "ngồi trong phòng" |

## Luật hành xử @AI trong nhóm
1. AI **chỉ nói khi được gọi** (`@AI` hoặc reply tin của nó) — không xen tự do.
2. Trả lời trong nhóm cũng **grounded + trích nguồn** như thread riêng; không biết thì nói không biết.
3. Tin AI có **nhận diện riêng** (glyph Vitals + màu accent-soft) — không giả người.
4. Ngôn ngữ: tiếng Việt dẫn, không sến, không emoji, ngắn (luật `chat-assist.ts:65`).
5. Quyền: khách Commenter cũng gọi @AI được, nhưng AI chỉ đọc tài liệu mà người đó được thấy.

---
*Cowork quyết theo uỷ quyền + ghi 02/08/2026. UI: 2 tab trong panel LM (AI · Nhóm), nhóm có @AI.*
